import { kv } from '../../lib/kv';
import { validateTelegramWebAppData, sendTelegramMessage, getLevel } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);
  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { text, targetUsername } = req.body;
  if (!text || !targetUsername) return res.status(400).json({ error: 'Missing fields' });
  if (text.length > 500) return res.status(400).json({ error: 'Message too long' });

  const userId = String(user.id);
  const key = `user:${userId}`;
  const userData = await kv.hgetall(key);
  const coins = parseInt(userData?.coins || 0);
  if (coins < 1) return res.status(400).json({ error: 'Not enough coins' });

  const newCoins = coins - 1;
  const messagesSent = parseInt(userData?.messagesSent || 0) + 1;
  const level = getLevel(messagesSent);

  await kv.hset(key, { coins: newCoins, messagesSent, level });
  await kv.zadd('leaderboard:level', { score: level, member: userId });

  // Save to feed
  const cleanTarget = targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`;
  const message = {
    text, to: cleanTarget, from: 'Anonymous',
    time: Date.now(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  await kv.lpush('messages:feed', JSON.stringify(message));
  await kv.ltrim('messages:feed', 0, 499);

  // Find target chatId for notification
  const targetNick = targetUsername.replace('@', '').toLowerCase();
  const targetUserId = await kv.get(`username:${targetNick}`);
  if (targetUserId) {
    const targetData = await kv.hgetall(`user:${targetUserId}`);
    const chatId = targetData?.chatId;
    if (chatId) {
      await sendTelegramMessage(
        chatId,
        `🕵️ <b>Тебе анонимное сообщение!</b>\n\n<i>${text}</i>\n\n— Anonymous\n\n<a href="https://t.me/marvin_appbot/app">Открыть MARVIN</a>`
      );
    }
  }

  res.json({ success: true, coins: newCoins, messagesSent, level });
}
