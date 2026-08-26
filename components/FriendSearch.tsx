/**
 * FriendSearch - Search and add friends component
 * Simplified version with StyleSheet for reliable rendering
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Share,
  StyleSheet,
} from 'react-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { useTheme } from '@/providers/ThemeProvider';
import { logger } from '@/lib/logger';

interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isFriend: boolean;
  isPending: boolean;
}

interface FriendSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onAddFriend: (userId: string) => Promise<void>;
  onClose?: () => void;
  inviteCode?: string;
}

export function FriendSearch({
  onSearch,
  onAddFriend,
  onClose,
  inviteCode,
}: FriendSearchProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return;

    setIsLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const searchResults = await onSearch(query.trim());
      setResults(searchResults);
    } catch (error) {
      logger.error('Search failed', { action: 'handleSearch', metadata: { query } }, error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, onSearch]);

  const handleAddFriend = useCallback(async (userId: string) => {
    setAddingUserId(userId);
    try {
      await onAddFriend(userId);
      setResults((prev) =>
        prev.map((r) =>
          r.id === userId ? { ...r, isPending: true } : r
        )
      );
    } catch (error) {
      logger.error('Failed to add friend', { action: 'handleAddFriend', metadata: { userId } }, error);
    } finally {
      setAddingUserId(null);
    }
  }, [onAddFriend]);

  const handleShareInvite = useCallback(async () => {
    if (!inviteCode) return;

    try {
      await Share.share({
        message: `Join me on Loop! Use my invite code: ${inviteCode}.`,
        title: 'Invite to Loop',
      });
    } catch (error) {
      logger.error('Share failed', { action: 'handleShareInvite' }, error);
    }
  }, [inviteCode]);

  const renderResult = ({ item }: { item: SearchResult }) => (
    <View style={[styles.resultItem, { borderBottomColor: colors.separator }]}>
      {/* Avatar */}
      {item.avatarUrl ? (
        <View style={[styles.avatar, { backgroundColor: colors.background.secondary }]} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.primary.DEFAULT }]}>
          <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.resultInfo}>
        <Text style={[styles.displayName, { color: colors.text.DEFAULT }]}>
          {item.displayName}
        </Text>
        <Text style={[styles.username, { color: colors.text.secondary }]}>
          @{item.username}
        </Text>
      </View>

      {/* Action */}
      {item.isFriend ? (
        <View style={[styles.friendsBadge, { backgroundColor: `${colors.success.DEFAULT}1A` }]}>
          <SafeSymbol name="checkmark.circle.fill" size={16} tintColor={colors.success.DEFAULT} />
          <Text style={[styles.friendsBadgeText, { color: colors.success.dark }]}>Friends</Text>
        </View>
      ) : item.isPending ? (
        <View style={[styles.pendingBadge, { backgroundColor: `${colors.celebration.gold}1A` }]}>
          <SafeSymbol name="clock" size={16} tintColor={colors.celebration.goldDark} />
          <Text style={[styles.pendingBadgeText, { color: colors.celebration.goldDark }]}>Pending</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary.DEFAULT }]}
          onPress={() => handleAddFriend(item.id)}
          disabled={addingUserId === item.id}
        >
          {addingUserId === item.id ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <>
              <SafeSymbol name="person.badge.plus" size={16} tintColor={colors.text.inverse} />
              <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Add</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.DEFAULT }]}>Add Friends</Text>
        {onClose && (
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
            onPress={onClose}
          >
            <SafeSymbol name="xmark" size={24} tintColor={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {/* Search Input */}
      <View style={[styles.searchInputContainer, { backgroundColor: colors.background.secondary }]}>
        <SafeSymbol name="magnifyingglass" size={20} tintColor={colors.text.tertiary} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text.DEFAULT }]}
          placeholder="Search by username..."
          placeholderTextColor={colors.text.tertiary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setQuery('');
              setResults([]);
              setHasSearched(false);
              inputRef.current?.focus();
            }}
          >
            <SafeSymbol name="xmark.circle.fill" size={20} tintColor={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {/* Search Button */}
      <Pressable
        style={[
          styles.searchButton,
          { backgroundColor: query.trim().length < 2 ? colors.background.secondary : colors.error },
        ]}
        onPress={handleSearch}
        disabled={query.trim().length < 2 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text.inverse} />
        ) : (
          <Text
            style={[
              styles.searchButtonText,
              { color: query.trim().length < 2 ? colors.text.tertiary : colors.text.inverse },
            ]}
          >
            Search
          </Text>
        )}
      </Pressable>

      {/* Results */}
      {hasSearched && (
        <View style={styles.resultsContainer}>
          {results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
            />
          ) : (
            <View style={styles.emptyState}>
              <SafeSymbol name="magnifyingglass" size={48} tintColor={colors.text.faint} />
              <Text style={[styles.emptyTitle, { color: colors.text.tertiary }]}>
                No users found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
                Try a different username
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Invite Section */}
      {inviteCode && (
        <View style={styles.inviteSection}>
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
            <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
          </View>

        <Pressable
          style={[styles.shareButton, { borderColor: colors.error }]}
          onPress={handleShareInvite}
        >
          <SafeSymbol name="square.and.arrow.up" size={20} tintColor={colors.error} />
          <Text style={[styles.shareButtonText, { color: colors.error }]}>Share Invite Link</Text>
        </Pressable>

          <View style={styles.inviteCodeContainer}>
            <Text style={[styles.inviteCodeLabel, { color: colors.text.tertiary }]}>
              Your invite code:
            </Text>
            <Text style={[styles.inviteCode, { color: colors.text.DEFAULT }]}>
              {inviteCode}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
  },
  friendsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  friendsBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  inviteSection: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCodeContainer: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

export default FriendSearch;
