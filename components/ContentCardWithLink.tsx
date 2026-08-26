/**
 * ContentCardWithLink - Content Card with Link Preview and Context Menu
 * Wraps ContentCard with expo-router Link for iOS peek/pop and context menus
 */

import React, { useCallback } from 'react';
import { View, Share, Alert, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ContentCard } from './ContentCard';
import { useContentStore, Content, ContentReaction } from '@/stores/contentStore';
import { useAuthStore } from '@/stores/authStore';
import { quickReactions } from '@/lib/iconTokens';
import { logger } from '@/lib/logger';

interface ContentCardWithLinkProps {
  content: Content;
  index?: number;
  onReact?: (emoji: string) => void;
}

export function ContentCardWithLink({
  content,
  index,
  onReact,
}: ContentCardWithLinkProps) {
  const addReaction = useContentStore((state) => state.addReaction);
  const removeFromFeed = useContentStore((state) => state.removeFromFeed);
  const user = useAuthStore((state) => state.user);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this ${content.type} from ${content.senderName} on Loop!`,
        title: `${content.senderName}'s ${content.type}`,
      });
    } catch (err) {
      logger.error('Share error', { action: 'handleShare', metadata: { contentId: content.id, contentType: content.type } }, err);
    }
  }, [content]);

  const handleReact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onReact) {
      onReact(quickReactions[0].symbol);
    } else if (user) {
      const reaction: ContentReaction = {
        userId: user.id,
        emoji: quickReactions[0].symbol,
        createdAt: new Date().toISOString(),
      };
      addReaction(content.id, reaction);
    }
  }, [content.id, user, addReaction, onReact]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove Content',
      'Are you sure you want to remove this from your feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeFromFeed(content.id);
          },
        },
      ]
    );
  }, [content.id, removeFromFeed]);

  const handleCardReact = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onReact) {
        onReact(emoji);
      } else if (user) {
        const reaction: ContentReaction = {
          userId: user.id,
          emoji,
          createdAt: new Date().toISOString(),
        };
        addReaction(content.id, reaction);
      }
    },
    [content.id, user, addReaction, onReact]
  );

  return (
    <Link href={`/content/${content.id}` as any} asChild>
      <Pressable>
        <Link.Trigger>
          <ContentCard
            content={content}
            index={index}
            onPress={() => router.push(`/content/${content.id}` as any)}
            onReact={handleCardReact}
            currentUserId={user?.id}
          />
        </Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={handleShare}
          />
          <Link.MenuAction
            title="React"
            icon="face.smiling"
            onPress={handleReact}
          />
          <Link.MenuAction
            title="Remove"
            icon="trash"
            destructive
            onPress={handleDelete}
          />
        </Link.Menu>
      </Pressable>
    </Link>
  );
}

export default ContentCardWithLink;
