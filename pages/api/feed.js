import { kv } from '../../lib/kv';

export default async function handler(req, res) {
  const raw = await kv.lrange('messages:feed', 0, 99);
  const messages = (raw || []).map(m => {
    try { return typeof m === 'string' ? JSON.parse(m) : m; }
    catch { return null; }
  }).filter(Boolean);

  res.json({ messages });
}
