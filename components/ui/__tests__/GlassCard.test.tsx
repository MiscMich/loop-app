/**
 * GlassCard Component Tests
 *
 * Tests for iOS 26 Liquid Glass card component with proper fallback behavior.
 * Uses expo-glass-effect for native glass effects.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { GlassCard } from '../GlassCard';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

// Cast to jest mock for type safety
const mockIsLiquidGlassAvailable = isLiquidGlassAvailable as jest.Mock;

// Wrapper for tests - ThemeProvider needs to load async
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('GlassCard', () => {
  // Store original Platform.OS
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to iOS by default
    Platform.OS = 'ios';
    // Default: liquid glass not available (uses BlurView fallback)
    mockIsLiquidGlassAvailable.mockReturnValue(false);
  });

  afterEach(() => {
    // Restore original platform
    Platform.OS = originalPlatform;
  });

  describe('rendering', () => {
    it('renders children correctly', async () => {
      render(
        <TestWrapper>
          <GlassCard>
            <Text>Test Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      // Wait for ThemeProvider to load
      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeTruthy();
      });
    });

    it('applies custom style prop', async () => {
      render(
        <TestWrapper>
          <GlassCard style={{ marginTop: 20 }}>
            <Text>Styled Card</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Styled Card')).toBeTruthy();
      });
    });

    it('supports accessibility props', async () => {
      render(
        <TestWrapper>
          <GlassCard
            accessibilityRole="button"
            accessibilityLabel="Glass card button"
          >
            <Text>Accessible Card</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Glass card button')).toBeTruthy();
      });
    });
  });

  describe('liquid glass behavior', () => {
    it('uses GlassView when liquid glass is available on iOS', async () => {
      // Enable liquid glass
      Platform.OS = 'ios';
      mockIsLiquidGlassAvailable.mockReturnValue(true);

      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={true}>
            <Text>Glass Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('glass-view')).toBeTruthy();
      });
    });

    it('falls back to BlurView when useLiquidGlass is false', async () => {
      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={false}>
            <Text>Blur Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('blur-view')).toBeTruthy();
      });
    });

    it('falls back to BlurView on Android', async () => {
      Platform.OS = 'android';
      mockIsLiquidGlassAvailable.mockReturnValue(true); // Even if available

      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={true}>
            <Text>Android Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('blur-view')).toBeTruthy();
      });
    });

    it('falls back to BlurView when liquid glass is not available', async () => {
      Platform.OS = 'ios';
      mockIsLiquidGlassAvailable.mockReturnValue(false);

      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={true}>
            <Text>Fallback Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('blur-view')).toBeTruthy();
      });
    });
  });

  describe('blur configuration', () => {
    it('applies default blur intensity of 80', async () => {
      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={false}>
            <Text>Default Blur</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const blurView = screen.getByTestId('blur-view');
        expect(blurView.props.accessibilityHint).toContain('blur-intensity-80');
      });
    });

    it('applies custom blur intensity', async () => {
      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={false} intensity={60}>
            <Text>Custom Blur</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const blurView = screen.getByTestId('blur-view');
        expect(blurView.props.accessibilityHint).toContain('blur-intensity-60');
      });
    });

    it('supports light tint', async () => {
      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={false} tint="light">
            <Text>Light Tint</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const blurView = screen.getByTestId('blur-view');
        expect(blurView.props.accessibilityHint).toContain('light');
      });
    });

    it('supports dark tint', async () => {
      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={false} tint="dark">
            <Text>Dark Tint</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const blurView = screen.getByTestId('blur-view');
        expect(blurView.props.accessibilityHint).toContain('dark');
      });
    });
  });

  describe('padding behavior', () => {
    it('applies default padding', async () => {
      render(
        <TestWrapper>
          <GlassCard>
            <Text testID="padded-content">Padded Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('padded-content')).toBeTruthy();
      });
    });

    it('removes padding when noPadding is true', async () => {
      render(
        <TestWrapper>
          <GlassCard noPadding>
            <Text testID="no-padding-content">No Padding Content</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('no-padding-content')).toBeTruthy();
      });
    });
  });

  describe('glass effect style', () => {
    it('supports regular glass style (default)', async () => {
      Platform.OS = 'ios';
      mockIsLiquidGlassAvailable.mockReturnValue(true);

      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={true}>
            <Text>Regular Glass</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const glassView = screen.getByTestId('glass-view');
        expect(glassView).toBeTruthy();
      });
    });

    it('supports clear glass style', async () => {
      Platform.OS = 'ios';
      mockIsLiquidGlassAvailable.mockReturnValue(true);

      render(
        <TestWrapper>
          <GlassCard useLiquidGlass={true} glassStyle="clear">
            <Text>Clear Glass</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        const glassView = screen.getByTestId('glass-view');
        expect(glassView).toBeTruthy();
      });
    });
  });

  describe('theme integration', () => {
    it('renders in light theme context', async () => {
      render(
        <TestWrapper>
          <GlassCard>
            <Text>Light Theme Card</Text>
          </GlassCard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Light Theme Card')).toBeTruthy();
      });
    });
  });
});
