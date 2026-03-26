import { kv } from '../../lib/kv';

export default async function handler(req, res) {
  const top = await kv.zrevrange('leaderboard:level', 0, 49);

  const users = await Promise.all(
    (top || []).map(async (userId) => {
      const data = await kv.hgetall(`user:${userId}`);
      const score = await kv.zscore('leaderboard:level', userId);
      return {
        username: data?.username || 'Anonymous',
        level: parseInt(score || data?.level || 1),
        messagesSent: parseInt(data?.messagesSent || 0),
      };
    })
  );

  res.json({ users });
}
