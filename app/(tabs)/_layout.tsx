/**
 * Tab Layout - Native iOS Tab Navigation
 * Migrated to NativeTabs with SF Symbols for iOS 26+ Liquid Glass support
 */

import {
  NativeTabs,
  Icon,
  Label,
} from 'expo-router/unstable-native-tabs';

import { useColors } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const colors = useColors();

  return (
    <NativeTabs
      tintColor={colors.primary.DEFAULT}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Friends</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <Icon sf="plus.circle.fill" />
        <Label>Create</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="activity">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>Activity</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
