import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { colors, gradients } from '@/lib/theme';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches JavaScript errors in component tree and shows friendly UI
 * Styled with Warm Sunrise theme from DESIGN_SYSTEM.md
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    logger.error('ErrorBoundary caught error', { action: 'componentDidCatch', metadata: { componentStack: errorInfo.componentStack } }, error);

    // Haptic feedback for error
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    this.setState({
      error,
      errorInfo,
    });

    // Send to Sentry for crash reporting (production only)
    addBreadcrumb({
      message: 'Error boundary triggered',
      category: 'error',
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
      },
    });

    captureException(error, {
      level: 'fatal',
      tags: {
        errorBoundary: 'true',
        source: 'react_error_boundary',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    // Haptic feedback for retry
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient
          colors={gradients.sunrise}
          locations={[0, 0.5, 1]}
          style={styles.container}
        >
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <SafeSymbol name="exclamationmark.circle.fill" size={80} tintColor={colors.error} />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>

            {/* Error Description */}
            <Text style={styles.description}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {/* Error Details (DEV only) */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorDetailsText} numberOfLines={4}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText} numberOfLines={3}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            {/* Try Again Button (Pill with Arrow - Dribbble style) */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary.DEFAULT, shadowColor: colors.primary.DEFAULT }]}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>Try Again</Text>
              <View style={[styles.arrowContainer, { backgroundColor: colors.surface.glassStrong }]}>
                <SafeSymbol name="arrow.right" size={20} tintColor={colors.text.inverse} />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.DEFAULT,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetailsContainer: {
    backgroundColor: colors.fill,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.DEFAULT,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  errorDetailsText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
    fontFamily: 'SF Mono',
    lineHeight: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9999,
    paddingVertical: 16,
    paddingLeft: 24,
    paddingRight: 8,
    minWidth: 200,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  arrowContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
});
