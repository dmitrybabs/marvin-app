import { kv } from '../../lib/kv';
import { validateTelegramWebAppData, getLevel, getCoinsPerPoints } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);

  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { type } = req.body; // 'happy' or 'sad'
  const userId = String(user.id);
  const key = `user:${userId}`;

  const delta = type === 'happy' ? 1 : -2;

  let newPoints = await kv.incrby(`${key}:points`, delta);
  newPoints = parseInt(newPoints);

  // Check if enough points to convert to coins
  const userData = await kv.hgetall(key);
  const messagesSent = parseInt(userData?.messagesSent || 0);
  const level = getLevel(messagesSent);
  const threshold = getCoinsPerPoints(level);

  let coinsEarned = 0;
  let currentCoins = parseInt(userData?.coins || 0);

  if (newPoints >= threshold) {
    const earnedCoins = Math.floor(newPoints / threshold);
    coinsEarned = earnedCoins;
    newPoints = newPoints % threshold;
    currentCoins += earnedCoins;
    await kv.hset(key, { coins: currentCoins });
    await kv.zadd('leaderboard:coins', { score: currentCoins, member: userId });
  }

  await kv.hset(key, { points: newPoints, level });
  await kv.zadd(`leaderboard:level`, { score: level, member: userId });

  res.json({
    points: newPoints,
    coins: currentCoins,
    coinsEarned,
    level,
    threshold,
  });
}
