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

  const userId = String(user.id);
  const key = `user:${userId}`;
  const { avatar, bio } = req.body;

  const update = {};
  if (avatar !== undefined) update.avatar = avatar;
  if (bio !== undefined) update.bio = String(bio).slice(0, 20);

  await kv.hset(key, update);
  res.json({ ok: true });
}
