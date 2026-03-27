import { kv } from '../../lib/kv';
import { ITEMS } from './items-shop';
import { SHOP_ITEMS } from './shop';

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const nick = username.replace('@', '').toLowerCase();
  const userId = await kv.get(`username:${nick}`);
  if (!userId) return res.status(404).json({ error: 'User not found' });

  const data = await kv.hgetall(`user:${userId}`);
  if (!data) return res.status(404).json({ error: 'User not found' });

  const rawPosts = await kv.lrange(`wall:${userId}`, 0, 49);
  const posts = (rawPosts || []).map(p => {
    try { return typeof p === 'string' ? JSON.parse(p) : p; } catch { return null; }
  }).filter(Boolean);

  const ownedAvatarIds = JSON.parse(data.ownedAvatars || '[]');
  const ownedItemIds = JSON.parse(data.ownedItems || '[]');

  res.json({
    userId,
    username: data.username || nick,
    level: parseInt(data.level || 1),
    messagesSent: parseInt(data.messagesSent || 0),
    coins: parseInt(data.coins || 0),
    avatar: data.avatar || '👤',
    bio: data.bio || '',
    ownedAvatarIds,
    ownedItemIds,
    posts,
  });
}
