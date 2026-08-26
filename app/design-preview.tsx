/**
 * Design Preview Screen
 * Preview the new logo and animated backgrounds
 * Access via: loop://design-preview
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LoopLogo, LoopLogoMark, LoopAppIcon } from '@/components/LoopLogo';
import { colors } from '@/lib/theme';

type BackgroundVariant = 'default' | 'subtle' | 'vibrant';
type LogoVariant = 'default' | 'monochrome' | 'gradient' | 'glass';

export default function DesignPreviewScreen() {
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>('default');
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('default');

  const bgVariants: BackgroundVariant[] = ['default', 'subtle', 'vibrant'];
  const logoVariants: LogoVariant[] = ['default', 'monochrome', 'gradient', 'glass'];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Design Preview',
          headerTransparent: true,
          headerBlurEffect: 'light',
        }}
      />

      <AnimatedBackground variant={bgVariant}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.title}>Loop Design System</Text>
            <Text style={styles.subtitle}>2026 iOS Liquid Glass Style</Text>

            {/* Background Variants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Background Animation</Text>
              <View style={styles.buttonRow}>
                {bgVariants.map((variant) => (
                  <Pressable
                    key={variant}
                    style={[
                      styles.variantButton,
                      bgVariant === variant && styles.variantButtonActive,
                    ]}
                    onPress={() => setBgVariant(variant)}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        bgVariant === variant && styles.variantButtonTextActive,
                      ]}
                    >
                      {variant}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Logo Variants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Logo Variants</Text>
              <View style={styles.buttonRow}>
                {logoVariants.map((variant) => (
                  <Pressable
                    key={variant}
                    style={[
                      styles.variantButton,
                      logoVariant === variant && styles.variantButtonActive,
                    ]}
                    onPress={() => setLogoVariant(variant)}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        logoVariant === variant && styles.variantButtonTextActive,
                      ]}
                    >
                      {variant}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Logo Display */}
            <View style={styles.logoSection}>
              {/* Main Logo */}
              <View style={styles.logoCard}>
                <Text style={styles.logoLabel}>Main Logo (120px)</Text>
                <View style={styles.logoContainer}>
                  <LoopLogo size={120} variant={logoVariant} />
                </View>
              </View>

              {/* Logo Mark */}
              <View style={styles.logoCard}>
                <Text style={styles.logoLabel}>Logo Mark (48px)</Text>
                <View style={styles.logoContainer}>
                  <LoopLogoMark size={48} />
                </View>
              </View>

              {/* App Icon Preview */}
              <View style={styles.logoCard}>
                <Text style={styles.logoLabel}>App Icon Preview</Text>
                <View style={styles.appIconContainer}>
                  <View style={styles.appIconWrapper}>
                    <LoopAppIcon size={180} />
                  </View>
                </View>
                <Text style={styles.appIconHint}>
                  Two interlocking rings = infinite connection
                </Text>
              </View>

              {/* Size Variations */}
              <View style={styles.logoCard}>
                <Text style={styles.logoLabel}>Size Variations</Text>
                <View style={styles.sizeRow}>
                  <View style={styles.sizeItem}>
                    <LoopLogo size={24} variant={logoVariant} />
                    <Text style={styles.sizeText}>24px</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <LoopLogo size={48} variant={logoVariant} />
                    <Text style={styles.sizeText}>48px</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <LoopLogo size={72} variant={logoVariant} />
                    <Text style={styles.sizeText}>72px</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <LoopLogo size={96} variant={logoVariant} />
                    <Text style={styles.sizeText}>96px</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Color Palette */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color Palette</Text>
              <View style={styles.colorRow}>
                <ColorSwatch color="#FF6B6B" name="Primary" />
                <ColorSwatch color="#A1A8EA" name="Accent" />
                <ColorSwatch color="#97DC38" name="Success" />
                <ColorSwatch color="#FFB347" name="Gold" />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Loop • 2026 Design System
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </AnimatedBackground>
    </>
  );
}

function ColorSwatch({ color, name }: { color: string; name: string }) {
  return (
    <View style={styles.colorSwatch}>
      <View style={[styles.colorCircle, { backgroundColor: color }]} />
      <Text style={styles.colorName}>{name}</Text>
      <Text style={styles.colorHex}>{color}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A6A',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  variantButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  variantButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A6A',
    textTransform: 'capitalize',
  },
  variantButtonTextActive: {
    color: '#FFFFFF',
  },
  logoSection: {
    gap: 20,
  },
  logoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  logoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A6A',
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  appIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconWrapper: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  appIconHint: {
    fontSize: 12,
    color: '#8E8E9E',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 16,
  },
  sizeItem: {
    alignItems: 'center',
    gap: 8,
  },
  sizeText: {
    fontSize: 12,
    color: '#8E8E9E',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    alignItems: 'center',
    gap: 6,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  colorHex: {
    fontSize: 10,
    color: '#8E8E9E',
  },
  footer: {
    marginTop: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E9E',
  },
});
