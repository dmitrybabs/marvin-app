import { kv } from '../../lib/kv';
import { getLevel } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const tgUser = msg.from;
    const chatId = String(msg.chat.id);
    const userId = String(tgUser.id);
    const username = (tgUser.username || tgUser.first_name || 'Anonymous');
    const usernameLower = username.toLowerCase();

    const key = `user:${userId}`;
    const existing = await kv.hgetall(key);
    if (!existing) {
      await kv.hset(key, { id: userId, username, points: 0, coins: 0, messagesSent: 0, level: 1, avatar: '👤', bio: '', chatId });
    } else {
      await kv.hset(key, { chatId, username });
    }

    // Username → userId mapping
    await kv.set(`username:${usernameLower}`, userId);

    // Register in leaderboard
    const msgSent = parseInt(existing?.messagesSent || 0);
    const level = getLevel(msgSent);
    await kv.zadd('leaderboard:level', { score: level, member: userId });

    if (msg.text === '/start') {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'gadgetaid.ru';
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `👋 Привет, <b>${username}</b>!\n\n🕵️ <b>MARVIN</b> — анонимный мессенджер.\n\nЗарабатывай монеты, нажимая на смайлики, и отправляй анонимные сообщения друзьям.\n\nНажми кнопку ниже:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🚀 Открыть MARVIN', web_app: { url: `https://${appUrl}` } }]] },
        }),
      });
    }
  }

  res.status(200).json({ ok: true });
}
