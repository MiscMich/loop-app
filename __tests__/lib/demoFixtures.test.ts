import { demoFeed, demoFriends, demoUser, getDemoSnapshot } from '@/lib/demoFixtures';

describe('demo fixtures', () => {
  it('are deterministic and contain no network-backed media', () => {
    expect(demoUser.createdAt).toBe('2026-08-26T12:00:00.000Z');
    expect(demoFriends).toHaveLength(3);
    expect(demoFeed).toHaveLength(2);
    expect(JSON.stringify(getDemoSnapshot())).not.toMatch(/https?:\/\//);
  });

  it('returns isolated snapshots so demos reset cleanly', () => {
    const first = getDemoSnapshot();
    const second = getDemoSnapshot();

    first.friends[0].displayName = 'Changed locally';
    first.feed[0].reactions.push({
      userId: 'local-change',
      emoji: '👍',
      createdAt: '2026-08-26T12:00:00.000Z',
    });

    expect(second.friends[0].displayName).toBe('River');
    expect(second.feed[0].reactions).toHaveLength(1);
  });
});
