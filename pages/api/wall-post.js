import { kv } from '../../lib/kv';
import { validateTelegramWebAppData } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['x-init-data'] || '';
  let user = validateTelegramWebAppData(initData);
  if (!user && process.env.NODE_ENV === 'development') {
    user = { id: 12345, username: 'testuser', first_name: 'Test' };
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId, text } = req.body;
  if (!targetUserId || !text) return res.status(400).json({ error: 'Missing fields' });
  if (text.length > 300) return res.status(400).json({ error: 'Too long' });

  const post = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    authorUsername: user.username || user.first_name || 'Anonymous',
    authorId: String(user.id),
    time: Date.now(),
  };

  await kv.lpush(`wall:${targetUserId}`, JSON.stringify(post));
  await kv.ltrim(`wall:${targetUserId}`, 0, 99);

  res.json({ ok: true, post });
}
