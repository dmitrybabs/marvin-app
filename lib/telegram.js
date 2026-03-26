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

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return null;

  const user = JSON.parse(urlParams.get('user') || '{}');
  return user;
}

export async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getLevel(messagesSent) {
  return Math.floor(messagesSent / 5) + 1;
}

export function getCoinsPerPoints(level) {
  return level * 10;
}
