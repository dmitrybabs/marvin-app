import { kv } from '../../lib/kv';
import { validateTelegramWebAppData, getLevel, getThreshold } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);
  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { type } = req.body;
  const userId = String(user.id);
  const key = `user:${userId}`;

  const delta = type === 'happy' ? 1 : -2;
  const newPoints = await kv.incrby(`${key}:points`, delta);

  const userData = await kv.hgetall(key);
  const messagesSent = parseInt(userData?.messagesSent || 0);
  const level = getLevel(messagesSent);
  const threshold = getThreshold(level);

  let coinsEarned = 0;
  let currentCoins = parseInt(userData?.coins || 0);
  let pts = parseInt(newPoints);

  if (pts >= threshold) {
    coinsEarned = Math.floor(pts / threshold);
    pts = pts % threshold;
    currentCoins += coinsEarned;
    await kv.hset(key, { coins: currentCoins });
  }

  await kv.hset(key, { points: pts, level });
  await kv.incrby(`${key}:points`, pts - parseInt(newPoints)); // sync
  // store absolute points value
  await kv.set(`${key}:points`, pts);
  await kv.zadd('leaderboard:level', { score: level, member: userId });

  res.json({ points: pts, coins: currentCoins, coinsEarned, level, threshold });
}
