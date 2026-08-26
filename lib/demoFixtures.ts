import type { User } from '@/stores/authStore';
import type { Content, MoodContent } from '@/stores/contentStore';
import type { Friend } from '@/stores/friendsStore';

const FIXTURE_TIME = '2026-08-26T12:00:00.000Z';

export const demoUser: User = {
  id: '10000000-0000-4000-8000-000000000001',
  username: 'skylar',
  displayName: 'Skylar',
  bio: 'Collecting tiny moments with my favorite people.',
  createdAt: FIXTURE_TIME,
};

export const demoFriends: Friend[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    username: 'river',
    displayName: 'River',
    status: 'accepted',
    addedAt: FIXTURE_TIME,
    lastActive: FIXTURE_TIME,
    currentMood: '🌿',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    username: 'nova',
    displayName: 'Nova',
    status: 'accepted',
    addedAt: FIXTURE_TIME,
    lastActive: FIXTURE_TIME,
    currentMood: '✨',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    username: 'milo',
    displayName: 'Milo',
    status: 'accepted',
    addedAt: FIXTURE_TIME,
    lastActive: FIXTURE_TIME,
    currentMood: '☀️',
  },
];

export const demoMood: MoodContent = {
  id: '30000000-0000-4000-8000-000000000001',
  type: 'mood',
  senderId: demoUser.id,
  senderName: demoUser.displayName,
  recipientId: demoFriends[0].id,
  createdAt: FIXTURE_TIME,
  reactions: [],
  emoji: '☀️',
  note: 'Making today count',
};

export const demoFeed: Content[] = [
  {
    id: '30000000-0000-4000-8000-000000000002',
    type: 'mood',
    senderId: demoFriends[0].id,
    senderName: demoFriends[0].displayName,
    recipientId: demoUser.id,
    createdAt: '2026-08-26T12:45:00.000Z',
    reactions: [{ userId: demoUser.id, emoji: '💚', createdAt: FIXTURE_TIME }],
    emoji: '🌿',
    note: 'Slow morning, good coffee',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    type: 'mood',
    senderId: demoFriends[1].id,
    senderName: demoFriends[1].displayName,
    recipientId: demoUser.id,
    createdAt: '2026-08-26T11:30:00.000Z',
    reactions: [],
    emoji: '✨',
    note: 'Big idea energy',
  },
];

export function getDemoSnapshot() {
  return {
    user: { ...demoUser },
    friends: demoFriends.map((friend) => ({ ...friend })),
    feed: demoFeed.map((item) => ({ ...item, reactions: [...item.reactions] })),
    mood: { ...demoMood, reactions: [...demoMood.reactions] },
  };
}
