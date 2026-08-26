/**
 * Accessibility Utilities
 * WCAG compliance helpers for VoiceOver, Dynamic Type, and screen readers
 */

import { AccessibilityRole, AccessibilityState } from 'react-native';

// Common accessibility roles
export const A11Y_ROLES = {
  BUTTON: 'button' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  TABLIST: 'tablist' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
  SLIDER: 'adjustable' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENUITEM: 'menuitem' as AccessibilityRole,
  PROGRESSBAR: 'progressbar' as AccessibilityRole,
  SEARCHFIELD: 'search' as AccessibilityRole,
  TIMER: 'timer' as AccessibilityRole,
};

// Generate accessibility label for content types
export function getContentAccessibilityLabel(
  contentType: string,
  senderName: string,
  timeAgo: string
): string {
  const typeLabels: Record<string, string> = {
    doodle: 'doodle drawing',
    photo: 'photo',
    mood: 'mood update',
    voice: 'voice note',
    game: 'game invitation',
  };

  const label = typeLabels[contentType] || 'content';
  return `${label} from ${senderName}, ${timeAgo}`;
}

// Generate accessibility hint for actions
export function getActionHint(action: string): string {
  const hints: Record<string, string> = {
    tap: 'Double tap to open',
    longPress: 'Double tap and hold for more options',
    swipe: 'Swipe left or right for actions',
    react: 'Double tap to react with an icon',
    send: 'Double tap to send',
    delete: 'Double tap to delete',
    edit: 'Double tap to edit',
    play: 'Double tap to play',
    pause: 'Double tap to pause',
    record: 'Double tap to start recording',
    stop: 'Double tap to stop',
  };

  return hints[action] || 'Double tap to activate';
}

// Create accessibility props for buttons
export function buttonA11yProps(
  label: string,
  hint?: string,
  disabled?: boolean
): object {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: hint || getActionHint('tap'),
    accessibilityState: { disabled: disabled || false } as AccessibilityState,
  };
}

// Create accessibility props for images
export function imageA11yProps(description: string): object {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.IMAGE,
    accessibilityLabel: description,
  };
}

// Create accessibility props for headers
export function headerA11yProps(text: string, level?: number): object {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.HEADER,
    accessibilityLabel: text,
    // iOS supports heading levels via accessibilityTraits
  };
}

// Create accessibility props for list items
export function listItemA11yProps(
  label: string,
  index: number,
  total: number,
  hint?: string
): object {
  return {
    accessible: true,
    accessibilityLabel: `${label}, item ${index + 1} of ${total}`,
    accessibilityHint: hint || getActionHint('tap'),
  };
}

// Create accessibility props for progress indicators
export function progressA11yProps(
  current: number,
  total: number,
  label?: string
): object {
  const percentage = Math.round((current / total) * 100);
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.PROGRESSBAR,
    accessibilityLabel: label || `Progress: ${percentage} percent`,
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
      text: `${percentage}%`,
    },
  };
}

// Create accessibility props for switches/toggles
export function switchA11yProps(
  label: string,
  isOn: boolean
): object {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.SWITCH,
    accessibilityLabel: label,
    accessibilityState: { checked: isOn } as AccessibilityState,
    accessibilityHint: `Double tap to ${isOn ? 'turn off' : 'turn on'}`,
  };
}

// Create accessibility props for tabs
export function tabA11yProps(
  label: string,
  isSelected: boolean,
  index: number,
  total: number
): object {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.TAB,
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected: isSelected } as AccessibilityState,
    accessibilityHint: isSelected ? 'Currently selected' : 'Double tap to select',
  };
}

// Format time for accessibility (more descriptive)
export function formatTimeForA11y(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

// Format count for accessibility
export function formatCountForA11y(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Announce for screen readers (use with AccessibilityInfo.announceForAccessibility)
export function createAnnouncement(message: string, priority: 'polite' | 'assertive' = 'polite'): string {
  return message;
}

// Check if element should be focusable
export function shouldBeFocusable(role: AccessibilityRole): boolean {
  const focusableRoles: AccessibilityRole[] = [
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'adjustable',
    'search',
    'tab',
    'menuitem',
  ];
  return focusableRoles.includes(role);
}
