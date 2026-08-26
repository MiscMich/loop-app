/**
 * DoodleCanvas - Skia-powered drawing canvas
 *
 * Uses react-native-gesture-handler (NOT deprecated Skia touch APIs)
 * Based on official Skia documentation and best practices research.
 *
 * Key patterns:
 * - GestureDetector + Gesture.Pan() for native-thread gesture handling
 * - notifyChange() to trigger Skia re-renders
 * - quadTo() for smooth curves (not lineTo())
 */

import { SafeSymbol } from '@/components/ui/SafeSymbol';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  useCanvasRef,
  notifyChange,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { SymbolView, SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as baseColors } from '@/lib/theme';

// Warm Sunrise color palette for doodling (design system aligned)
export const doodleColors: string[] = [
  baseColors.text.DEFAULT,
  baseColors.text.tertiary,
  baseColors.primary.DEFAULT,
  baseColors.accent.DEFAULT,
  baseColors.warning,
  baseColors.celebration.goldDark,
  baseColors.accent.dark,
  baseColors.primary.dark,
  baseColors.success.DEFAULT,
  baseColors.primary.light,
];

const brushSizes = [3, 6, 10, 16, 24];

interface DoodleCanvasProps {
  onSave?: (paths: string) => void;
  onExport?: (imageBase64: string) => void;
  initialPaths?: string;
}

interface PathData {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

export function DoodleCanvas({
  onSave,
  onExport,
  initialPaths,
}: DoodleCanvasProps) {
  const { colors } = useTheme();
  const canvasRef = useCanvasRef();

  // Completed paths stored in state for persistence
  const [completedPaths, setCompletedPaths] = useState<PathData[]>(() => {
    if (initialPaths) {
      try {
        const parsed = JSON.parse(initialPaths);
        return parsed.map((p: { svg: string; color: string; strokeWidth: number }) => ({
          path: Skia.Path.MakeFromSVGString(p.svg) || Skia.Path.Make(),
          color: p.color,
          strokeWidth: p.strokeWidth,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Current drawing path - shared value for worklet access
  const currentPath = useSharedValue<SkPath>(Skia.Path.Make());
  const [selectedColor, setSelectedColor] = useState(doodleColors[2]); // Coral default
  const [brushSize, setBrushSize] = useState(brushSizes[1]); // Medium default
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const isFirstRender = useRef(true);

  // Notify parent when paths change (after render, not during)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onSave) {
      const serialized = JSON.stringify(
        completedPaths.map((p) => ({
          svg: p.path.toSVGString(),
          color: p.color,
          strokeWidth: p.strokeWidth,
        }))
      );
      onSave(serialized);
    }
  }, [completedPaths, onSave]);

  // Callback to save paths (runs on JS thread)
  const savePaths = useCallback((newPath: SkPath) => {
    const newPathData = {
      path: newPath,
      color: selectedColor,
      strokeWidth: brushSize,
    };

    setCompletedPaths((prev) => [...prev, newPathData]);
  }, [selectedColor, brushSize]);

  // Pan gesture for drawing - runs on UI thread for 60fps
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(1)
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      // Start a new path
      currentPath.value = Skia.Path.Make();
      currentPath.value.moveTo(e.x, e.y);
      notifyChange(currentPath);
      runOnJS(setIsDrawing)(true);
    })
    .onChange((e) => {
      'worklet';
      // Use quadratic curves for smooth lines
      const lastPoint = currentPath.value.getLastPt();
      const xMid = (lastPoint.x + e.x) / 2;
      const yMid = (lastPoint.y + e.y) / 2;
      currentPath.value.quadTo(lastPoint.x, lastPoint.y, xMid, yMid);
      notifyChange(currentPath);
    })
    .onEnd(() => {
      'worklet';
      // Save the completed path
      const pathCopy = currentPath.value.copy();
      runOnJS(savePaths)(pathCopy);

      // Reset current path
      currentPath.value = Skia.Path.Make();
      notifyChange(currentPath);
      runOnJS(setIsDrawing)(false);
    });

  // Actions - useEffect handles onSave notification
  const handleUndo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedPaths((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedPaths([]);
  }, []);

  const handleExport = useCallback(async () => {
    if (canvasRef.current && onExport) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const image = canvasRef.current.makeImageSnapshot();
      if (image) {
        const base64 = image.encodeToBase64();
        onExport(base64);
      }
    }
  }, [canvasRef, onExport]);

  const handleColorSelect = useCallback((color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColor(color);
  }, []);

  const handleBrushSelect = useCallback((size: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBrushSize(size);
    setShowBrushPicker(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Canvas with Gesture Handler */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.canvasWrapper, { backgroundColor: colors.surface.DEFAULT }]}>
          <Canvas ref={canvasRef} style={[styles.canvas, { backgroundColor: colors.surface.DEFAULT }]}>
            {/* Completed paths */}
            {completedPaths.map((pathData, index) => (
              <Path
                key={index}
                path={pathData.path}
                color={pathData.color}
                style="stroke"
                strokeWidth={pathData.strokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
            {/* Current drawing path */}
            <Path
              path={currentPath}
              color={selectedColor}
              style="stroke"
              strokeWidth={brushSize}
              strokeCap="round"
              strokeJoin="round"
            />
          </Canvas>
        </View>
      </GestureDetector>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Color Picker */}
        <View style={styles.colorPicker}>
          {doodleColors.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && [styles.colorButtonSelected, { borderColor: colors.text.DEFAULT }],
              ]}
              onPress={() => handleColorSelect(color)}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Brush Size */}
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBrushPicker(!showBrushPicker);
            }}
          >
            <View
              style={[
                styles.brushPreview,
                {
                  width: brushSize,
                  height: brushSize,
                  backgroundColor: selectedColor,
                },
              ]}
            />
          </Pressable>

          {/* Undo */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT },
              completedPaths.length === 0 && styles.actionButtonDisabled,
            ]}
            onPress={handleUndo}
            disabled={completedPaths.length === 0}
          >
            <SafeSymbol
              name="arrow.uturn.backward"
              size={24}
              tintColor={completedPaths.length === 0 ? colors.text.tertiary : colors.text.DEFAULT}
            />
          </Pressable>

          {/* Clear */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT },
              completedPaths.length === 0 && styles.actionButtonDisabled,
            ]}
            onPress={handleClear}
            disabled={completedPaths.length === 0}
          >
            <SafeSymbol
              name="trash"
              size={24}
              tintColor={completedPaths.length === 0 ? colors.text.tertiary : colors.text.DEFAULT}
            />
          </Pressable>

          {/* Export */}
          {onExport && (
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT },
                completedPaths.length === 0 && styles.actionButtonDisabled,
                completedPaths.length > 0 && [styles.exportButton, { backgroundColor: colors.primary.DEFAULT }],
              ]}
              onPress={handleExport}
              disabled={completedPaths.length === 0}
            >
              <SafeSymbol
                name="checkmark"
                size={24}
                tintColor={completedPaths.length === 0 ? colors.text.tertiary : colors.text.inverse}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Brush Size Picker */}
      {showBrushPicker && (
        <View
          style={[
            styles.brushPicker,
            { backgroundColor: colors.surface.DEFAULT, shadowColor: colors.text.DEFAULT },
          ]}
        >
          {brushSizes.map((size) => (
            <Pressable
              key={size}
              style={[
                styles.brushOption,
                { backgroundColor: colors.background.secondary },
                brushSize === size && [styles.brushOptionSelected, { backgroundColor: colors.background.tertiary }],
              ]}
              onPress={() => handleBrushSelect(size)}
            >
              <View
                style={[
                  styles.brushPreview,
                  {
                    width: size,
                    height: size,
                    backgroundColor: selectedColor,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: 16,
    margin: 8,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    padding: 16,
    gap: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  exportButton: {
  },
  brushPreview: {
    borderRadius: 999,
  },
  brushPicker: {
    position: 'absolute',
    bottom: 140,
    left: '50%',
    marginLeft: -100,
    width: 200,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  brushOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brushOptionSelected: {
  },
});

export default DoodleCanvas;
