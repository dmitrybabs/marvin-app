import { kv } from '../../lib/kv';
import { validateTelegramWebAppData, getLevel, getCoinsPerPoints } from '../../lib/telegram';

export default async function handler(req, res) {
  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);

  // Dev fallback
  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const userId = String(user.id);
  const key = `user:${userId}`;

  let data = await kv.hgetall(key);

  if (!data) {
    data = {
      id: userId,
      username: user.username || user.first_name || 'Anonymous',
      points: 0,
      coins: 0,
      messagesSent: 0,
      level: 1,
    };
    await kv.hset(key, data);
  }

  const messagesSent = parseInt(data.messagesSent || 0);
  const level = getLevel(messagesSent);
  const coinsPerPoints = getCoinsPerPoints(level);

  res.json({
    ...data,
    points: parseInt(data.points || 0),
    coins: parseInt(data.coins || 0),
    messagesSent,
    level,
    coinsPerPoints,
    username: user.username || user.first_name || 'Anonymous',
  });
}
