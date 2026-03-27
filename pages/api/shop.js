import { kv } from '../../lib/kv';
import { validateTelegramWebAppData } from '../../lib/telegram';

export const SHOP_ITEMS = [
  { id: 'dragon', emoji: '🐉', name: 'Дракон', price: 100 },
  { id: 'crown', emoji: '👑', name: 'Корона', price: 150 },
  { id: 'alien', emoji: '👽', name: 'Пришелец', price: 120 },
  { id: 'ghost', emoji: '👻', name: 'Призрак', price: 100 },
  { id: 'robot', emoji: '🤖', name: 'Робот', price: 130 },
  { id: 'skull', emoji: '💀', name: 'Череп', price: 200 },
  { id: 'fire', emoji: '🔥', name: 'Огонь', price: 180 },
  { id: 'diamond', emoji: '💎', name: 'Алмаз', price: 250 },
  { id: 'crystal', emoji: '🔮', name: 'Кристалл', price: 220 },
  { id: 'thunder', emoji: '⚡', name: 'Молния', price: 160 },
  { id: 'shark', emoji: '🦈', name: 'Акула', price: 140 },
  { id: 'wolf', emoji: '🐺', name: 'Волк', price: 110 },
  { id: 'lion', emoji: '🦁', name: 'Лев', price: 130 },
  { id: 'phoenix', emoji: '🦅', name: 'Феникс', price: 300 },
  { id: 'ninja', emoji: '🥷', name: 'Ниндзя', price: 200 },
  { id: 'zombie', emoji: '🧟', name: 'Зомби', price: 170 },
  { id: 'mage', emoji: '🧙', name: 'Маг', price: 190 },
  { id: 'angel', emoji: '😇', name: 'Ангел', price: 160 },
  { id: 'devil', emoji: '😈', name: 'Дьявол', price: 180 },
  { id: 'snowflake', emoji: '❄️', name: 'Снежинка', price: 120 },
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({ items: SHOP_ITEMS });
  }

  if (req.method === 'POST') {
    const initData = req.headers['x-init-data'] || '';
    let user = validateTelegramWebAppData(initData);
    if (!user && process.env.NODE_ENV === 'development') {
      user = { id: 12345, username: 'testuser', first_name: 'Test' };
    }
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { itemId } = req.body;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(400).json({ error: 'Item not found' });

    const userId = String(user.id);
    const key = `user:${userId}`;
    const data = await kv.hgetall(key);
    const coins = parseInt(data?.coins || 0);

    if (coins < item.price) {
      return res.status(400).json({ error: `Недостаточно монет. Нужно ${item.price} COIN` });
    }

    // Check if already owned
    const owned = JSON.parse(data?.ownedAvatars || '[]');
    if (owned.includes(itemId)) {
      return res.status(400).json({ error: 'Уже куплено' });
    }

    owned.push(itemId);
    const newCoins = coins - item.price;
    await kv.hset(key, { coins: newCoins, ownedAvatars: JSON.stringify(owned) });

    res.json({ ok: true, coins: newCoins, owned });
  }
}
