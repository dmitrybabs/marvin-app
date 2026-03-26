import { kv } from '../../lib/kv';

export default async function handler(req, res) {
  // Get top 50 by level score
  const topIds = await kv.zrevrange('leaderboard:level', 0, 49);

  const users = await Promise.all(
    (topIds || []).map(async (userId) => {
      const data = await kv.hgetall(`user:${userId}`);
      const score = await kv.zscore('leaderboard:level', userId);
      return {
        username: data?.username || 'anonymous',
        level: parseInt(score || data?.level || 1),
        messagesSent: parseInt(data?.messagesSent || 0),
        avatar: data?.avatar || '👤',
        bio: data?.bio || '',
      };
    })
  );

  // Sort by level desc, filter out empty
  const sorted = users.filter(u => u.username).sort((a, b) => b.level - a.level);

  res.json({ users: sorted });
}
