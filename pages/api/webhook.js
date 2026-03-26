import { kv } from '../../lib/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const user = msg.from;
    const chatId = String(msg.chat.id);
    const userId = String(user.id);
    const username = (user.username || user.first_name || 'Anonymous').toLowerCase();

    // Register user
    const key = `user:${userId}`;
    const existing = await kv.hgetall(key);
    if (!existing) {
      await kv.hset(key, {
        id: userId,
        username: user.username || user.first_name || 'Anonymous',
        points: 0,
        coins: 0,
        messagesSent: 0,
        level: 1,
        chatId,
      });
    } else {
      await kv.hset(key, { chatId, username: user.username || existing.username });
    }

    // Save username → userId mapping for notifications
    await kv.set(`username:${username}`, userId);

    // Respond to /start
    if (msg.text === '/start') {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `👋 Добро пожаловать в <b>MARVIN</b>!\n\n🕵️ Здесь ты можешь оставлять анонимные сообщения другим пользователям.\n\n💰 Зарабатывай MARVIN Coins, нажимая на смайлики, и трать их на сообщения.\n\nНажми кнопку ниже, чтобы открыть приложение:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{
              text: '🚀 Открыть MARVIN',
              web_app: { url: `https://${process.env.NEXT_PUBLIC_APP_URL || 'gadgetaid.ru'}` }
            }]]
          }
        }),
      });
    }
  }

  res.status(200).json({ ok: true });
}
