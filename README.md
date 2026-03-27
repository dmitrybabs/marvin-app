# MARVIN — Telegram Mini App

## Деплой: пошаговая инструкция

### 1. GitHub
Загрузи все файлы в репо https://github.com/dmitrybabs/marvin-app

### 2. Vercel
1. vercel.com → Add New Project → подключи GitHub → выбери marvin-app
2. Framework: Next.js → Deploy
3. Settings → Domains → добавь gadgetaid.ru

### 3. Vercel KV (Redis)
1. В проекте Vercel → Storage → Create Database → KV
2. Название: marvin-kv → Create → Connect to Project
3. Переменные добавятся автоматически

### 4. Environment Variables (Vercel → Settings → Env)
- TELEGRAM_BOT_TOKEN = 8741178516:AAHIzJZV5xQuYpArHSAr7Cu6Q82zvmT71tY
- TELEGRAM_BOT_USERNAME = marvin_appbot
- NEXT_PUBLIC_APP_URL = gadgetaid.ru

После добавления → Redeploy!

### 5. BotFather
/setmenubutton → @marvin_appbot → URL: https://gadgetaid.ru → Text: Открыть MARVIN
/newapp → @marvin_appbot → URL: https://gadgetaid.ru

### 6. Webhook (открыть в браузере 1 раз)
https://api.telegram.org/bot8741178516:AAHIzJZV5xQuYpArHSAr7Cu6Q82zvmT71tY/setWebhook?url=https://gadgetaid.ru/api/webhook

Должен ответить: {"ok":true}
