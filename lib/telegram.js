import crypto from 'crypto';

export function validateTelegramWebAppData(initData) {
  if (!initData) return null;
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return null;
  urlParams.delete('hash');
  const dataCheckArr = [];
  urlParams.forEach((value, key) => dataCheckArr.push(`${key}=${value}`));
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computedHash !== hash) return null;
  const user = JSON.parse(urlParams.get('user') || '{}');
  return user;
}

export async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch { return false; }
}

// Уровень растёт каждые 3 сообщения
export function getLevel(messagesSent) {
  return Math.floor(messagesSent / 3) + 1;
}

// Цена монеты: 10 очков на ур.1, +5 с каждым уровнем
export function getThreshold(level) {
  return 10 + (level - 1) * 5;
}
