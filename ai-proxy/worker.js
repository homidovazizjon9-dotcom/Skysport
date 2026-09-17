/**
 * Прокси к ИИ для трекера расходов.
 *
 * Зачем: ключ, лежащий в Realtime Database, виден любому вошедшему
 * пользователю — его можно вытащить из вкладки Network и потратить вашу квоту.
 * Воркер держит ключ у себя и пропускает только тех, кто вошёл в ваше
 * приложение через Firebase.
 *
 * Работает с любым провайдером, который принимает запрос в формате OpenAI:
 * Gemini (endpoint совместимости) и Groq. Адрес задаётся в AI_UPSTREAM.
 *
 * Развёртывание — см. ai-proxy/README.md
 */

const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';
const DEFAULT_UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Модель и длину ответа задаёт приложение, но лимиты здесь — чтобы чужой
// запрос не сжёг квоту одним махом.
const MAX_BODY_BYTES = 6 * 1024 * 1024;   // фото чека ~0.3 МБ, запас большой
const MAX_TOKENS = 4000;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: { message: 'Только POST' } }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) {
      return json({ error: { message: 'Этот домен не разрешён' } }, 403, cors);
    }

    // 1. Кто спрашивает
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: { message: 'Нужен вход в приложение' } }, 401, cors);

    const user = await verifyFirebaseToken(token, env.FIREBASE_API_KEY);
    if (!user) return json({ error: { message: 'Вход не подтверждён' } }, 401, cors);

    // 2. Что спрашивает
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: { message: 'Слишком большой запрос' } }, 413, cors);
    }
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: { message: 'Тело запроса не JSON' } }, 400, cors);
    }
    if (!body || !body.model || !Array.isArray(body.messages)) {
      return json({ error: { message: 'Ожидались model и messages' } }, 400, cors);
    }
    body.max_tokens = Math.min(Number(body.max_tokens) || 400, MAX_TOKENS);
    delete body.stream;

    // 3. Спрашиваем у провайдера своим ключом
    const key = env.AI_KEY || env.GROQ_KEY;
    if (!key) return json({ error: { message: 'На сервере не задан AI_KEY' } }, 500, cors);

    const res = await fetch(env.AI_UPSTREAM || DEFAULT_UPSTREAM, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};

/** Пускаем только домены из ALLOWED_ORIGINS (через запятую). */
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/**
 * Проверка токена входа. Вместо разбора подписи JWT спрашиваем сам Firebase —
 * короче и не ломается при ротации ключей Google.
 */
async function verifyFirebaseToken(idToken, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(LOOKUP_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users && data.users[0];
    return user && user.localId ? user : null;
  } catch {
    return null;
  }
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
