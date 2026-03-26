import { kv } from '../../lib/kv';
import { validateTelegramWebAppData, getLevel, getThreshold } from '../../lib/telegram';

export default async function handler(req, res) {
  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);
  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const userId = String(user.id);
  const key = `user:${userId}`;
  let data = await kv.hgetall(key);

  const tgUsername = user.username || user.first_name || 'Anonymous';

  if (!data) {
    data = { id: userId, username: tgUsername, points: 0, coins: 0, messagesSent: 0, level: 1, avatar: '👤', bio: '', chatId: '' };
    await kv.hset(key, data);
  } else {
    // Always sync username from Telegram
    if (user.username && data.username !== user.username) {
      // Remove old username mapping
      if (data.username) await kv.set(`username:${data.username.toLowerCase()}`, '');
      await kv.hset(key, { username: user.username });
      data.username = user.username;
    }
  }

  // Save username → userId mapping
  const uname = (user.username || data.username || '').toLowerCase();
  if (uname) await kv.set(`username:${uname}`, userId);

  const messagesSent = parseInt(data.messagesSent || 0);
  const level = getLevel(messagesSent);
  const threshold = getThreshold(level);
  const points = parseInt(data.points || 0);

  // Update level in leaderboard
  await kv.zadd('leaderboard:level', { score: level, member: userId });

  res.json({
    id: userId,
    username: data.username || tgUsername,
    points,
    coins: parseInt(data.coins || 0),
    messagesSent,
    level,
    coinsPerPoints: threshold,
    avatar: data.avatar || '👤',
    bio: data.bio || '',
  });
}
