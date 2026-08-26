/**
 * State Components Type Definitions
 * Warm Sunrise Design System - UI States
 */

import React from 'react';

// Screen state types
export type ScreenState = 'loading' | 'error' | 'empty' | 'ideal';

// Error types
export type ErrorType = 'network' | 'permission' | 'generic' | 'profile';

// Empty state types
export type EmptyType = 'feed' | 'friends' | 'activity' | 'search' | 'games';

// Permission types for specific errors
export type PermissionType = 'camera' | 'microphone' | 'contacts' | 'notifications';

// Loading state configuration
export interface LoadingConfig {
  skeleton?: React.ComponentType<any>;
  count?: number;
  message?: string;
}

// Error state configuration
export interface ErrorConfig {
  type: ErrorType;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
  permissionType?: PermissionType;
}

// Empty state configuration
export interface EmptyConfig {
  type: EmptyType;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
  icon?: string;
}

// Combined state configuration
export interface StateConfig {
  loading?: LoadingConfig;
  error?: ErrorConfig;
  empty?: EmptyConfig;
}

// Screen state wrapper props
export interface ScreenStateWrapperProps {
  state: ScreenState;
  config?: StateConfig;
  children: React.ReactNode;
  onRetry?: () => void;
  onAction?: () => void;
}

// Skeleton component props
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  className?: string;
}

// Error state component props
export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  permissionType?: PermissionType;
  style?: any;
}

// Empty state component props
export interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: string;
  style?: any;
}

// Default copy for error states
export const ERROR_COPY: Record<ErrorType, { title: string; message: string }> = {
  network: {
    title: 'Connection Lost',
    message: "We couldn't reach our servers. Check your connection and try again.",
  },
  permission: {
    title: 'Permission Required',
    message: 'Loop needs access to continue. Tap below to update your settings.',
  },
  generic: {
    title: 'Something Went Wrong',
    message: "We hit a snag. Please try again.",
  },
  profile: {
    title: "Couldn't Load Profile",
    message: 'There was an issue loading your profile. Please try again.',
  },
};

// Default copy for empty states
export const EMPTY_COPY: Record<EmptyType, { title: string; message: string; actionLabel: string; icon: string }> = {
  feed: {
    title: 'Start Something Beautiful',
    message: 'Share a doodle, capture a moment, or tell your friends how you\'re feeling',
    actionLabel: 'Create Your First Post',
    icon: 'sparkles',
  },
  friends: {
    title: 'Your Inner Circle Awaits',
    message: 'Add friends to share moments, play games, and stay connected',
    actionLabel: 'Add Friends',
    icon: 'people',
  },
  activity: {
    title: 'All Caught Up!',
    message: 'When friends react to your content or send you things, you\'ll see it here',
    actionLabel: '',
    icon: 'checkmark-circle',
  },
  search: {
    title: 'No Results Found',
    message: 'Try searching with different keywords',
    actionLabel: 'Clear Search',
    icon: 'search',
  },
  games: {
    title: 'No Active Games',
    message: 'Challenge a friend to start playing!',
    actionLabel: 'Start a Game',
    icon: 'game-controller',
  },
};

// Permission-specific copy
export const PERMISSION_COPY: Record<PermissionType, { title: string; message: string }> = {
  camera: {
    title: 'Camera Access Needed',
    message: 'Loop needs camera access to take photos for your friends.',
  },
  microphone: {
    title: 'Microphone Access Needed',
    message: 'Loop needs microphone access to record voice notes.',
  },
  contacts: {
    title: 'Contacts Access Needed',
    message: 'Loop can help you find friends already using the app.',
  },
  notifications: {
    title: 'Stay in the Loop',
    message: 'Enable notifications to know when friends send you content.',
  },
};
