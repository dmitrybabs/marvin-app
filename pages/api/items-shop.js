import { kv } from '../../lib/kv';
import { validateTelegramWebAppData } from '../../lib/telegram';

export const ITEMS = [
  // Маски и личины
  { id:'mask_hacker',   emoji:'🎭', name:'Маска Хакера',      desc:'Ты невидим в сети',        price:80,  category:'Маски' },
  { id:'mask_ghost',    emoji:'👺', name:'Маска Призрака',    desc:'Пугай анонимно',           price:100, category:'Маски' },
  { id:'mask_spy',      emoji:'🕵️', name:'Маска Шпиона',     desc:'Никто не узнает',          price:120, category:'Маски' },
  { id:'mask_joker',    emoji:'🃏', name:'Маска Джокера',     desc:'Хаос — твой стиль',        price:150, category:'Маски' },
  { id:'mask_anon',     emoji:'😶', name:'Маска Анонима',     desc:'Лицо без лица',            price:90,  category:'Маски' },
  // Гаджеты
  { id:'phone_burner',  emoji:'📱', name:'Одноразовый телефон', desc:'Следов не оставляет',    price:110, category:'Гаджеты' },
  { id:'vpn',           emoji:'🔒', name:'Супер-VPN',          desc:'Сквозное шифрование',     price:130, category:'Гаджеты' },
  { id:'radio',         emoji:'📡', name:'Секретная антенна',  desc:'Ловит всё',               price:95,  category:'Гаджеты' },
  { id:'usb',           emoji:'💾', name:'Флешка-призрак',     desc:'Самоуничтожение через 5с', price:160, category:'Гаджеты' },
  { id:'camera',        emoji:'📷', name:'Скрытая камера',     desc:'Видит всё, незаметно',    price:200, category:'Гаджеты' },
  { id:'laptop',        emoji:'💻', name:'Ноутбук без следов', desc:'RAM только, диска нет',   price:250, category:'Гаджеты' },
  { id:'walkie',        emoji:'📻', name:'Рация-шифровальщик', desc:'Кодирует на лету',        price:140, category:'Гаджеты' },
  // Статусы
  { id:'status_shadow', emoji:'🌑', name:'Тень',               desc:'Тебя нет. Ты везде.',     price:300, category:'Статусы' },
  { id:'status_cipher', emoji:'🔐', name:'Шифровальщик',       desc:'Читаешь всё зашифрованное',price:280,category:'Статусы' },
  { id:'status_leak',   emoji:'💧', name:'Утечка',             desc:'Знает всё раньше всех',   price:350, category:'Статусы' },
  { id:'status_void',   emoji:'🕳️', name:'Пустота',           desc:'Не существует в системе', price:400, category:'Статусы' },
  { id:'status_echo',   emoji:'🌀', name:'Эхо',                desc:'Твои слова везде',        price:220, category:'Статусы' },
  // Артефакты
  { id:'note_burn',     emoji:'🔥', name:'Горящая записка',    desc:'Сгорит после прочтения',  price:170, category:'Артефакты' },
  { id:'envelope',      emoji:'✉️', name:'Конверт без адреса', desc:'Никаких следов',          price:85,  category:'Артефакты' },
  { id:'invisible_ink', emoji:'🖊️', name:'Невидимые чернила', desc:'Текст только для своих',  price:115, category:'Артефакты' },
  { id:'dead_drop',     emoji:'📦', name:'Тайник',             desc:'Секретная точка сброса',  price:190, category:'Артефакты' },
  { id:'codebook',      emoji:'📖', name:'Кодовая книга',      desc:'Расшифруй, если сможешь', price:210, category:'Артефакты' },
  { id:'mirror',        emoji:'🪞', name:'Зеркало слежки',     desc:'Видит за стеной',         price:240, category:'Артефакты' },
  // Звания
  { id:'rank_agent',    emoji:'🥷', name:'Агент',              desc:'Лицензия на анонимность', price:500, category:'Звания' },
  { id:'rank_ghost',    emoji:'👻', name:'Призрак сети',       desc:'Легенда этого мессенджера',price:750,category:'Звания' },
  { id:'rank_architect',emoji:'🌐', name:'Архитектор',         desc:'Построил эту систему',    price:1000,category:'Звания' },
];

export default async function handler(req, res) {
  if (req.method === 'GET') return res.json({ items: ITEMS });

  if (req.method === 'POST') {
    const initData = req.headers['x-init-data'] || '';
    let user = validateTelegramWebAppData(initData);
    if (!user && process.env.NODE_ENV === 'development') user = { id: 12345, username: 'testuser' };
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { itemId } = req.body;
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(400).json({ error: 'Item not found' });

    const userId = String(user.id);
    const key = `user:${userId}`;
    const data = await kv.hgetall(key);
    const coins = parseInt(data?.coins || 0);
    if (coins < item.price) return res.status(400).json({ error: `Нужно ${item.price} COIN` });

    const ownedItems = JSON.parse(data?.ownedItems || '[]');
    if (ownedItems.includes(itemId)) return res.status(400).json({ error: 'Уже куплено' });

    ownedItems.push(itemId);
    const newCoins = coins - item.price;
    await kv.hset(key, { coins: newCoins, ownedItems: JSON.stringify(ownedItems) });

    res.json({ ok: true, coins: newCoins, ownedItems });
  }
}
