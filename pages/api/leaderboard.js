import { kv } from '../../lib/kv';

export default async function handler(req, res) {
  const topIds = await kv.zrevrange('leaderboard:level', 0, 99);

  if (!topIds || topIds.length === 0) {
    return res.json({ users: [] });
  }

  const users = await Promise.all(
    topIds.map(async (userId) => {
      const data = await kv.hgetall(`user:${userId}`);
      const score = await kv.zscore('leaderboard:level', userId);
      if (!data) return null;
      return {
        userId,
        username: data.username || 'anonymous',
        level: parseInt(score || data.level || 1),
        messagesSent: parseInt(data.messagesSent || 0),
        avatar: data.avatar || '👤',
        bio: data.bio || '',
      };
    })
  );

  const sorted = users
    .filter(Boolean)
    .filter(u => u.username && u.username !== 'anonymous')
    .sort((a, b) => b.level - a.level);

  res.json({ users: sorted });
}
