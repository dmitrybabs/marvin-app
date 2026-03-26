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

  if (!text || !targetUsername) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Message too long' });
  }

  const userId = String(user.id);
  const key = `user:${userId}`;

  // Check coins
  const userData = await kv.hgetall(key);
  const coins = parseInt(userData?.coins || 0);
  if (coins < 1) {
    return res.status(400).json({ error: 'Not enough coins' });
  }

  // Find target user by username to get their telegram ID
  const targetKey = `username:${targetUsername.replace('@', '').toLowerCase()}`;
  const targetUserId = await kv.get(targetKey);

  // Deduct coin
  const newCoins = coins - 1;
  const messagesSent = parseInt(userData?.messagesSent || 0) + 1;
  const level = getLevel(messagesSent);

  await kv.hset(key, { coins: newCoins, messagesSent, level });
  await kv.zadd('leaderboard:level', { score: level, member: userId });

  // Save message to feed
  const message = {
    text,
    to: targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`,
    from: 'Anonymous',
    time: Date.now(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  await kv.lpush('messages:feed', JSON.stringify(message));
  await kv.ltrim('messages:feed', 0, 499); // keep last 500

  // Send Telegram notification if target is registered
  if (targetUserId) {
    const targetUsername2 = targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`;
    await sendTelegramMessage(
      targetUserId,
      `🕵️ <b>Тебе анонимное сообщение!</b>\n\n<i>${text}</i>\n\n— Anonymous\n\n<a href="https://t.me/marvin_appbot">Открыть Marvin</a>`
    );
  } else {
    // Could not find user — still saves to feed, just no notification
  }

  res.json({
    success: true,
    coins: newCoins,
    messagesSent,
    level,
  });
}
