/**
 * ContactList Component
 *
 * Displays device contacts with ability to:
 * - Add registered Loop users as friends
 * - Invite non-registered contacts via SMS
 *
 * Features:
 * - Grouped by letter
 * - Search filtering
 * - Loading/permission states
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '@/lib/theme';
import { formatPhoneNumber } from '@/lib/contacts';
import type { NormalizedContact } from '@/lib/contacts';
import type { ContactPermissionStatus } from '@/hooks/useContacts';

// =============================================================================
// TYPES
// =============================================================================

export interface ContactListProps {
  /** Contacts to display */
  contacts: NormalizedContact[];
  /** Current permission status */
  permissionStatus: ContactPermissionStatus;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Callback to request permission */
  onRequestPermission: () => void;
  /** Callback when add friend is pressed (registered user) */
  onAddFriend: (contact: NormalizedContact) => void;
  /** Callback when invite is pressed (non-registered) */
  onInvite: (contact: NormalizedContact) => void;
  /** Set of contact IDs that have been invited this session */
  invitedIds?: Set<string>;
  /** Set of contact IDs that have pending friend requests */
  pendingIds?: Set<string>;
  /** Whether friend limit has been reached */
  friendLimitReached?: boolean;
  /** Use section headers for alphabetical grouping */
  showSectionHeaders?: boolean;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ContactRowProps {
  contact: NormalizedContact;
  onAddFriend: (contact: NormalizedContact) => void;
  onInvite: (contact: NormalizedContact) => void;
  isInvited: boolean;
  isPending: boolean;
  friendLimitReached: boolean;
  index: number;
}

function ContactRow({
  contact,
  onAddFriend,
  onInvite,
  isInvited,
  isPending,
  friendLimitReached,
  index,
}: ContactRowProps) {
  const { colors: themeColors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (contact.isRegistered) {
      onAddFriend(contact);
    } else {
      onInvite(contact);
    }
  }, [contact, onAddFriend, onInvite]);

  const getButtonState = () => {
    if (contact.isRegistered) {
      if (isPending) {
        return { text: 'Pending', icon: 'clock' as SFSymbol, disabled: true };
      }
      if (friendLimitReached) {
        return { text: 'Limit', icon: 'lock.fill' as SFSymbol, disabled: true };
      }
      return { text: 'Add', icon: 'person.badge.plus' as SFSymbol, disabled: false };
    } else {
      if (isInvited) {
        return { text: 'Invited', icon: 'checkmark' as SFSymbol, disabled: true };
      }
      return { text: 'Invite', icon: 'paperplane.fill' as SFSymbol, disabled: false };
    }
  };

  const buttonState = getButtonState();
  const primaryPhone = contact.phoneNumbers[0];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30).springify()}
      style={[
        styles.contactRow,
        { backgroundColor: themeColors.surface?.DEFAULT ?? colors.surface.DEFAULT },
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: contact.isRegistered
              ? themeColors.success?.light ?? colors.success.light
              : themeColors.accent.light,
          },
        ]}
      >
        {contact.imageUri ? (
          <Animated.Image
            source={{ uri: contact.imageUri }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={[styles.avatarText, { color: themeColors.text.inverse }]}>
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        )}
        {contact.isRegistered && (
          <View
            style={[
              styles.registeredBadge,
              {
                backgroundColor: themeColors.success?.DEFAULT ?? colors.success.DEFAULT,
                borderColor: themeColors.surface?.DEFAULT ?? colors.surface.DEFAULT,
              },
            ]}
          >
            <SafeSymbol name="checkmark" size={10} tintColor={themeColors.text.inverse} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.contactName, { color: themeColors.text.DEFAULT }]}
            numberOfLines={1}
          >
            {contact.name}
          </Text>
          {contact.isRegistered && contact.registeredUsername && (
            <Text style={[styles.username, { color: themeColors.success?.DEFAULT ?? colors.success.DEFAULT }]}>
              @{contact.registeredUsername}
            </Text>
          )}
        </View>
        {primaryPhone && (
          <Text
            style={[styles.phoneNumber, { color: themeColors.text.tertiary }]}
          >
            {formatPhoneNumber(primaryPhone)}
          </Text>
        )}
      </View>

      {/* Action Button */}
      <Pressable
        onPress={handlePress}
        disabled={buttonState.disabled}
        style={[
          styles.actionButton,
          {
            backgroundColor: buttonState.disabled
              ? themeColors.background.secondary
              : contact.isRegistered
              ? themeColors.success?.DEFAULT ?? colors.success.DEFAULT
              : themeColors.primary.DEFAULT,
          },
        ]}
        accessibilityLabel={`${buttonState.text} ${contact.name}`}
        accessibilityRole="button"
      >
        <SafeSymbol
          name={buttonState.icon as SFSymbol}
          size={16}
          tintColor={buttonState.disabled ? themeColors.text.tertiary : themeColors.text.inverse}
        />
        <Text
          style={[
            styles.actionButtonText,
            {
              color: buttonState.disabled ? themeColors.text.tertiary : themeColors.text.inverse,
            },
          ]}
        >
          {buttonState.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// EMPTY/PERMISSION STATES
// =============================================================================

interface EmptyStateProps {
  type: 'permission' | 'empty' | 'error';
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

function EmptyState({ type, message, onAction, actionLabel }: EmptyStateProps) {
  const { colors: themeColors } = useTheme();

  const config = {
    permission: {
      icon: 'person.2' as SFSymbol,
      title: 'Access Your Contacts',
      description: 'Allow Loop to access your contacts to find friends and send invites.',
    },
    empty: {
      icon: 'magnifyingglass' as SFSymbol,
      title: 'No Contacts Found',
      description: message || 'We couldn\'t find any contacts with phone numbers.',
    },
    error: {
      icon: 'exclamationmark.circle' as SFSymbol,
      title: 'Something Went Wrong',
      description: message || 'Failed to load contacts. Please try again.',
    },
  };

  const { icon, title, description } = config[type];

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: themeColors.background.secondary },
        ]}
      >
        <SafeSymbol name={icon} size={40} tintColor={themeColors.text.tertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text.DEFAULT }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: themeColors.text.secondary }]}>
        {description}
      </Text>
      {onAction && actionLabel && (
        <Pressable
          onPress={onAction}
          style={[
            styles.emptyButton,
            { backgroundColor: themeColors.primary.DEFAULT },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.emptyButtonText, { color: themeColors.text.inverse }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContactList({
  contacts,
  permissionStatus,
  isLoading,
  error,
  onRequestPermission,
  onAddFriend,
  onInvite,
  invitedIds = new Set(),
  pendingIds = new Set(),
  friendLimitReached = false,
  showSectionHeaders = true,
}: ContactListProps) {
  const { colors: themeColors } = useTheme();

  // Group contacts by first letter
  const sections = useMemo(() => {
    if (!showSectionHeaders) {
      return [{ title: '', data: contacts }];
    }

    const grouped = new Map<string, NormalizedContact[]>();
    for (const contact of contacts) {
      const firstLetter = (contact.name || '?').charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

      if (!grouped.has(letter)) {
        grouped.set(letter, []);
      }
      grouped.get(letter)!.push(contact);
    }

    // Sort letters and create sections
    const sortedLetters = Array.from(grouped.keys()).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return sortedLetters.map((letter) => ({
      title: letter,
      data: grouped.get(letter)!,
    }));
  }, [contacts, showSectionHeaders]);

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: NormalizedContact; index: number }) => (
      <ContactRow
        contact={item}
        onAddFriend={onAddFriend}
        onInvite={onInvite}
        isInvited={invitedIds.has(item.id)}
        isPending={pendingIds.has(item.registeredUserId || '')}
        friendLimitReached={friendLimitReached}
        index={index}
      />
    ),
    [onAddFriend, onInvite, invitedIds, pendingIds, friendLimitReached]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => {
      if (!title) return null;
      return (
        <View
          style={[
            styles.sectionHeader,
            { backgroundColor: themeColors.background.DEFAULT },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: themeColors.text.secondary }]}
          >
            {title}
          </Text>
        </View>
      );
    },
    [themeColors]
  );

  // Handle permission state
  if (permissionStatus === 'undetermined') {
    return (
      <EmptyState
        type="permission"
        onAction={onRequestPermission}
        actionLabel="Allow Access"
      />
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <EmptyState
        type="permission"
        message="Contact access was denied. Please enable it in Settings to find friends."
      />
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary.DEFAULT} />
        <Text style={[styles.loadingText, { color: themeColors.text.tertiary }]}>
          Loading contacts...
        </Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return <EmptyState type="error" message={error} />;
  }

  // Handle empty state
  if (contacts.length === 0) {
    return <EmptyState type="empty" />;
  }

  // Render contact list
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={showSectionHeaders ? renderSectionHeader : undefined}
      stickySectionHeadersEnabled
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheadline,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
  },
  registeredBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 1,
  },
  username: {
    fontSize: typography.fontSize.caption1,
    fontWeight: typography.fontWeight.medium,
  },
  phoneNumber: {
    fontSize: typography.fontSize.subheadline,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: typography.fontSize.caption1,
    fontWeight: typography.fontWeight.semibold,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  emptyButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});
