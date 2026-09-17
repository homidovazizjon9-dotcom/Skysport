# Прокси к ИИ

Убирает ключ из базы. Без прокси ключ лежит в `config/aiKey` и доступен
любому вошедшему пользователю — его видно во вкладке Network за десять секунд.
С прокси приложение шлёт только токен входа Firebase, а ключ живёт на сервере.

Бесплатного тарифа Cloudflare (100 000 запросов в сутки) хватает с огромным запасом.

## Развёртывание

```bash
cd ai-proxy
npx wrangler login              # откроет браузер, вход в Cloudflare
npx wrangler secret put AI_KEY  # вставить ключ, он никуда не запишется
```

Перед публикацией поправь в `wrangler.toml`:

- `ALLOWED_ORIGINS` — свой домен, например `https://azizjon.github.io`.
  Запросы с других доменов воркер отклоняет.
- `AI_UPSTREAM` — по умолчанию Gemini. Для Groq поставь
  `https://api.groq.com/openai/v1/chat/completions`.

```bash
npx wrangler deploy
```

В конце wrangler напечатает адрес вида
`https://rashody-ai.ВАШ-АККАУНТ.workers.dev`.

## Подключение

В Firebase Realtime Database создай узел:

```
config/aiProxy = "https://rashody-ai.ВАШ-АККАУНТ.workers.dev"
```

Приложение само предпочтёт прокси: если `config/aiProxy` есть и начинается
с `https://`, ключи из базы больше не читаются. **После этого удали `config/aiKey`,
`config/geminiKey` и `config/groqKey`** — иначе смысла в прокси нет.

Правила базы для нового узла те же, что и для остального `config`:

```json
"config": {
  ".read": "auth != null",
  ".write": false
}
```

## Что делает воркер

1. Проверяет домен запроса по `ALLOWED_ORIGINS`.
2. Проверяет токен входа через Firebase (`accounts:lookup`) — чужой человек
   без аккаунта в вашем приложении не пройдёт.
3. Ограничивает размер запроса и `max_tokens`, вырезает `stream`.
4. Пересылает запрос провайдеру со своим ключом и возвращает ответ как есть.

Формат запроса и ответа — OpenAI-совместимый у обоих провайдеров, поэтому
приложению всё равно, разговаривает оно напрямую или через прокси.

## Проверка

```bash
curl -X POST https://rashody-ai.ВАШ-АККАУНТ.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"привет"}]}'
```

Должно вернуться `401 Вход не подтверждён` — значит защита работает.
Настоящий ответ появится только из приложения, где есть токен входа.
