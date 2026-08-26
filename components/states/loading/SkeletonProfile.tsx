/**
 * SkeletonProfile - Loading skeleton for profile screen
 * Matches profile header and stats layout
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBase, SkeletonCircle, SkeletonText } from './SkeletonBase';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';

interface SkeletonProfileProps {
  style?: ViewStyle;
  showStats?: boolean;
  showBio?: boolean;
}

export function SkeletonProfile({
  style,
  showStats = true,
  showBio = true,
}: SkeletonProfileProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Profile Header */}
      <View style={styles.header}>
        {/* Large Avatar */}
        <SkeletonCircle size={100} />

        {/* Name */}
        <SkeletonBase
          width={160}
          height={28}
          borderRadius={6}
          style={styles.name}
        />

        {/* Username */}
        <SkeletonBase
          width={100}
          height={16}
          borderRadius={4}
          style={styles.username}
        />

        {/* Bio */}
        {showBio && (
          <SkeletonText
            lines={2}
            lineHeight={14}
            lastLineWidth="70%"
            style={styles.bio}
          />
        )}
      </View>

      {/* Stats Cards */}
      {showStats && (
        <View style={styles.statsRow}>
          <SkeletonStatCard />
          <SkeletonStatCard />
        </View>
      )}

      {/* Edit Profile Button */}
      <SkeletonBase
        width="100%"
        height={52}
        borderRadius={borderRadius.pill}
        style={styles.editButton}
      />

      {/* Menu Items */}
      <View style={styles.menuItems}>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonMenuItem key={index} style={index > 0 ? styles.menuSpacing : undefined} />
        ))}
      </View>
    </View>
  );
}

/**
 * Stat card skeleton
 */
export function SkeletonStatCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statHeader}>
        <SkeletonBase width={24} height={24} borderRadius={6} />
        <SkeletonBase width={32} height={32} borderRadius={16} />
      </View>
      <SkeletonBase width={50} height={36} borderRadius={6} style={styles.statValue} />
      <SkeletonBase width={70} height={11} borderRadius={4} style={styles.statLabel} />
    </View>
  );
}

/**
 * Menu item skeleton
 */
export function SkeletonMenuItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.menuItem, style]}>
      <SkeletonBase width={40} height={40} borderRadius={20} />
      <View style={styles.menuText}>
        <SkeletonBase width={100} height={15} borderRadius={4} />
        <SkeletonBase width={150} height={12} borderRadius={4} style={styles.menuSubtitle} />
      </View>
      <SkeletonBase width={20} height={20} borderRadius={4} />
    </View>
  );
}

/**
 * Profile edit form skeleton
 */
export function SkeletonProfileEdit({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.editContainer, style]}>
      {/* Avatar */}
      <View style={styles.editAvatarSection}>
        <SkeletonCircle size={100} />
        <SkeletonBase width={100} height={14} borderRadius={4} style={styles.changePhotoText} />
      </View>

      {/* Form fields */}
      <View style={styles.formFields}>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonFormField key={index} style={index > 0 ? styles.fieldSpacing : undefined} />
        ))}
      </View>

      {/* Save button */}
      <SkeletonBase
        width="100%"
        height={52}
        borderRadius={borderRadius.pill}
        style={styles.saveButton}
      />
    </View>
  );
}

/**
 * Form field skeleton
 */
function SkeletonFormField({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.formField, style]}>
      <SkeletonBase width={80} height={11} borderRadius={4} />
      <SkeletonBase width="100%" height={20} borderRadius={4} style={styles.fieldInput} />
      <View style={styles.fieldUnderline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  name: {
    marginTop: spacing.md,
  },
  username: {
    marginTop: spacing.sm,
  },
  bio: {
    marginTop: spacing.md,
    width: '80%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    marginTop: spacing.sm,
  },
  statLabel: {
    marginTop: spacing.sm,
  },
  editButton: {
    marginTop: spacing.xl,
  },
  menuItems: {
    marginTop: spacing.xl,
  },
  menuSpacing: {
    marginTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  menuText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuSubtitle: {
    marginTop: 4,
  },
  editContainer: {
    paddingHorizontal: spacing.lg,
  },
  editAvatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  changePhotoText: {
    marginTop: spacing.md,
  },
  formFields: {
    marginTop: spacing.lg,
  },
  fieldSpacing: {
    marginTop: spacing.xl,
  },
  formField: {
    paddingBottom: spacing.sm,
  },
  fieldInput: {
    marginTop: spacing.sm,
  },
  fieldUnderline: {
    height: 1,
    backgroundColor: colors.separator,
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing['2xl'],
  },
});

export default SkeletonProfile;
