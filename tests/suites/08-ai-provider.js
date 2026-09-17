// Выбор ИИ-провайдера и перебор моделей, когда имя модели устарело
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
const flush = () => {
  let pre = document.getElementById('__results');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
  pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
};

// Поддельная база: config/* отдаём из обычного объекта
let fakeConfig = {};
window._fbDb = {};
window._fbRef = (db, path) => path;
window._fbGet = async path => ({
  exists: () => fakeConfig[path] !== undefined && fakeConfig[path] !== null,
  val: () => fakeConfig[path]
});

const realFetch = window.fetch;
// Заглушка ответа: приложение читает тело текстом, как настоящий fetch
const reply = (obj, status) => ({ ok: (status || 200) < 400, status: status || 200, text: async () => JSON.stringify(obj) });
let sentModels = [];
let failFirst = 0;
const stubFetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  sentModels.push({ url, model: body.model, auth: opts.headers.Authorization,
    googKey: opts.headers['x-goog-api-key'],
    reasoning: body.reasoning_effort, maxTokens: body.max_tokens });
  if (sentModels.length <= failFirst) {
    return reply({ error: { message: 'The model `' + body.model + '` does not exist' } });
  }
  return reply({ choices: [{ message: { content: 'готовый ответ' } }] });
};
window.fetch = stubFetch;

const reset = config => {
  fakeConfig = config;
  _aiEndpoint = null;
  sentModels = [];
  failFirst = 0;
};

(async () => {
  try {
    currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
    settings = { initialBalance: 0, monthBudget: 0 };
    data = { transactions: [], subscriptions: [] };
    ensureSettings();

    // ---------- какой ключ лежит, тот провайдер и выбран
    reset({ 'config/geminiKey': 'AIzaTest' });
    let ep = await getAiEndpoint();
    ok('gemini key selects gemini', ep.name === 'gemini' && ep.url.includes('generativelanguage'), ep.url);

    reset({ 'config/groqKey': 'gsk_test' });
    ep = await getAiEndpoint();
    ok('groq key selects groq', ep.name === 'groq' && ep.url.includes('api.groq.com'));

    reset({ 'config/geminiKey': 'AIzaTest', 'config/groqKey': 'gsk_test' });
    ep = await getAiEndpoint();
    ok('gemini wins when both keys exist', ep.name === 'gemini');

    reset({ 'config/aiProvider': 'groq', 'config/geminiKey': 'AIzaTest', 'config/groqKey': 'gsk_test' });
    ep = await getAiEndpoint();
    ok('explicit provider wins', ep.name === 'groq');

    reset({ 'config/aiProvider': 'выдуманный', 'config/geminiKey': 'AIzaTest' });
    ep = await getAiEndpoint();
    ok('unknown provider falls back to the key', ep.name === 'gemini');

    // ---------- один config/aiKey без подсказок: провайдер по форме ключа
    const geminiLike = 'AIzaSyD-ExampleKeyForTests123456789012';
    const googleKey = 'AQ.Ab8RN6IExampleKeyForTests1234567890';
    const groqLike = 'gsk_ExampleKeyForTests1234567890';

    reset({ 'config/aiKey': geminiLike });
    ep = await getAiEndpoint();
    ok('legacy AIza key still goes to gemini', ep.name === 'gemini' && ep.key === geminiLike, ep.name);

    reset({ 'config/aiKey': groqLike });
    ep = await getAiEndpoint();
    ok('groq-shaped key goes to groq', ep.name === 'groq', ep.name);

    reset({ 'config/aiKey': 'AQ.Ab8RN6IExampleKeyForTests1234567890' });
    ep = await getAiEndpoint();
    ok('new google key format goes to gemini', ep.name === 'gemini', ep.name);

    reset({ 'config/aiKey': 'какая-то строка' });
    ep = await getAiEndpoint();
    ok('unknown key shape defaults to gemini', ep.name === 'gemini', ep.name);

    reset({ 'config/aiProvider': 'groq', 'config/aiKey': geminiLike });
    ep = await getAiEndpoint();
    ok('explicit provider beats the key shape', ep.name === 'groq');

    reset({ 'config/groqKey': groqLike });
    ep = await getAiEndpoint();
    ok('old lone groqKey still means groq', ep.name === 'groq');

    // ---------- ошибку провайдера показываем как есть
    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: { message: 'Invalid API Key' } });
    let keyErr = '';
    try { await callAi('привет'); } catch (e) { keyErr = e.message; }
    ok('provider message passed through', keyErr.includes('Invalid API Key'), keyErr);

    // ---------- способ передачи ключа подбирается сам
    reset({ 'config/aiKey': googleKey });
    const styles = [];
    window.fetch = async (url, opts) => {
      const style = opts.headers['x-goog-api-key'] ? 'header'
        : url.includes('key=') ? 'query' : 'bearer';
      styles.push(style);
      if (style !== 'query') {
        return reply({ error: { message: 'Request had invalid authentication credentials' } }, 401);
      }
      return reply({ choices: [{ message: { content: 'подошло' } }] });
    };
    ok('auth style is found by trying', (await callAi('привет')) === 'подошло', styles.join(','));
    ok('header tried before the query', styles[0] === 'header' && styles[1] === 'query');
    const soFar = styles.length;
    await callAi('ещё раз');
    ok('working style is remembered', styles.length === soFar + 1 && styles[soFar] === 'query', styles.join(','));

    // ---------- в ошибке видно, какие способы перепробованы
    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: { message: 'Request had invalid authentication credentials' } }, 401);
    let authErr = '';
    try { await callAi('привет'); } catch (e) { authErr = e.message; }
    ok('tried styles listed', authErr.includes('header>query>bearer'), authErr);

    // ---------- частые ответы провайдера переводятся
    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: {
      message: 'Request had invalid authentication credentials. Expected OAuth 2 access token',
      status: 'UNAUTHENTICATED'
    } }, 401);
    let hinted = '';
    try { await callAi('привет'); } catch (e) { hinted = e.message; }
    ok('access token explained', hinted.includes('токен доступа') && hinted.includes('aistudio'), hinted);
    ok('original answer kept', hinted.includes('Ответ сервиса'), hinted);

    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: { message: 'API key not valid. Please pass a valid API key.' } }, 400);
    try { await callAi('привет'); } catch (e) { hinted = e.message; }
    ok('invalid key explained', hinted.includes('Ключ не принят'), hinted);

    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: { message: 'Generative Language API has not been used in project 123 before or it is disabled' } }, 403);
    try { await callAi('привет'); } catch (e) { hinted = e.message; }
    ok('disabled api explained', hinted.includes('не включён'), hinted);

    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => reply({ error: { message: 'Что-то совсем неизвестное' } }, 500);
    try { await callAi('привет'); } catch (e) { hinted = e.message; }
    ok('unknown error passed through', hinted.includes('Что-то совсем неизвестное'), hinted);
    window.fetch = stubFetch;

    // ---------- сеть и CORS не притворяются ошибкой ключа
    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => { throw new TypeError('Failed to fetch'); };
    let netErr = '';
    try { await callAi('привет'); } catch (e) { netErr = e.message; }
    ok('network failure named plainly', netErr.includes('запрос не ушёл'), netErr);
    // Предзапрос CORS нужен только заголовку, поэтому сбой сети пробует и остальные способы
    ok('network failure tries other styles', netErr.includes('header>query>bearer'), netErr);
    window.fetch = stubFetch;

    // ---------- зависший запрос обрывается по времени
    reset({ 'config/aiKey': googleKey });
    const realTry = AI_TRY_TIMEOUT;
    const realTotal = AI_TOTAL_TIMEOUT;
    AI_TRY_TIMEOUT = 150;
    AI_TOTAL_TIMEOUT = 450;
    window.fetch = (url, opts) => new Promise((resolve, reject) => {
      opts.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
    let hangErr = '';
    const startedAt = Date.now();
    try { await callAi('привет'); } catch (e) { hangErr = e.message; }
    ok('hanging request is cut off', hangErr.includes('молчала дольше'), hangErr);
    ok('whole run has a deadline', hangErr.includes('прервано'), hangErr);
    ok('deadline respected', Date.now() - startedAt < 2000, String(Date.now() - startedAt));
    AI_TRY_TIMEOUT = realTry;
    AI_TOTAL_TIMEOUT = realTotal;
    window.fetch = stubFetch;

    // ---------- не-авторизационная ошибка не гоняет способы по кругу
    reset({ 'config/aiKey': googleKey });
    const tries = [];
    window.fetch = async (url, opts) => {
      tries.push(opts.headers['x-goog-api-key'] ? 'header' : 'other');
      return reply({ error: { message: 'Quota exceeded for this project' } }, 429);
    };
    let quotaErr = '';
    try { await callAi('привет'); } catch (e) { quotaErr = e.message; }
    ok('quota error is not retried as auth', tries.length === AI_PROVIDERS.gemini.text.length, tries.join(','));
    ok('quota error shown as is', quotaErr.includes('Quota'), quotaErr);
    window.fetch = stubFetch;

    // ---------- прокси важнее ключа
    reset({ 'config/aiProxy': 'https://proxy.example/ai', 'config/geminiKey': 'AIzaTest' });
    ep = await getAiEndpoint();
    ok('proxy replaces the key', ep.proxy === true && ep.url === 'https://proxy.example/ai');

    reset({ 'config/groqProxy': 'https://old.example/ai' });
    ep = await getAiEndpoint();
    ok('old groqProxy still understood', ep.proxy === true && ep.url === 'https://old.example/ai');

    reset({ 'config/aiProxy': 'ftp://nope' , 'config/geminiKey': 'AIzaTest' });
    ep = await getAiEndpoint();
    ok('non-https proxy ignored', !ep.proxy && ep.key === 'AIzaTest');

    // ---------- без ключа честно ничего
    reset({});
    ok('no key means no endpoint', (await getAiEndpoint()) === null);
    let failed = '';
    try { await callAi('привет'); } catch (e) { failed = e.message; }
    ok('call without a key explains itself', failed.includes('config/aiKey'), failed);

    // ---------- перебор моделей
    reset({ 'config/geminiKey': 'AIzaTest' });
    let answer = await callAi('сколько я трачу?');
    ok('first model answers', answer === 'готовый ответ' && sentModels.length === 1, sentModels.length);
    ok('newest model tried first', sentModels[0].model === AI_PROVIDERS.gemini.text[0], sentModels[0].model);
    ok('google key goes in x-goog-api-key', sentModels[0].googKey === 'AIzaTest', sentModels[0].googKey);
    ok('no bearer for google', sentModels[0].auth === undefined);
    ok('key not glued into the url', !sentModels[0].url.includes('key='), sentModels[0].url);

    reset({ 'config/geminiKey': 'AIzaTest' });
    failFirst = 2;
    answer = await callAi('сколько я трачу?');
    ok('retired models are skipped', answer === 'готовый ответ' && sentModels.length === 3,
      sentModels.map(c => c.model).join(', '));

    reset({ 'config/geminiKey': 'AIzaTest' });
    failFirst = 99;
    let err = '';
    try { await callAi('привет'); } catch (e) { err = e.message; }
    ok('all models down reports the last error', err.includes('does not exist'), err);
    ok('every model was tried', sentModels.length === AI_PROVIDERS.gemini.text.length, sentModels.length);

    // ---------- «думающие» модели просят не думать
    reset({ 'config/aiKey': googleKey });
    failFirst = 1;
    await callAi('привет');
    ok('non-thinking model tried first', sentModels[0].model === 'gemini-2.0-flash', sentModels[0].model);
    ok('no reasoning flag for 2.0', sentModels[0].reasoning === undefined);
    ok('thinking turned off for 2.5', sentModels[1].reasoning === 'none', String(sentModels[1].reasoning));
    ok('answer has room to fit', sentModels[0].maxTokens >= 1000, sentModels[0].maxTokens);

    // ---------- пустой ответ объясняет, почему он пустой
    reset({ 'config/aiKey': googleKey });
    window.fetch = async (url, opts) => {
      sentModels.push({ model: JSON.parse(opts.body).model });
      return reply({ choices: [{ message: { content: '' }, finish_reason: 'length' }] });
    };
    let emptyErr = '';
    try { await callAi('привет'); } catch (e) { emptyErr = e.message; }
    ok('empty answer names the model', emptyErr.includes('gemini'), emptyErr);
    ok('empty answer names the reason', emptyErr.includes('length'), emptyErr);
    ok('all models tried before giving up', sentModels.length === AI_PROVIDERS.gemini.text.length);
    window.fetch = stubFetch;

    // ---------- ответ в родном формате Gemini тоже читается
    reset({ 'config/aiKey': googleKey });
    window.fetch = async () => (reply({ candidates: [{ content: { parts: [{ text: 'ответ из candidates' }] } }] }));
    ok('native gemini shape understood', (await callAi('привет')) === 'ответ из candidates');

    window.fetch = async () => (reply({ choices: [{ message: { content: [{ type: 'text', text: 'части' }] } }] }));
    reset({ 'config/aiKey': googleKey });
    ok('content parts joined', (await callAi('привет')) === 'части');

    window.fetch = async () => (reply({ candidates: [{ finishReason: 'SAFETY' }] }));
    reset({ 'config/aiKey': googleKey });
    let blocked = '';
    try { await callAi('привет'); } catch (e) { blocked = e.message; }
    ok('native block reason shown', blocked.includes('SAFETY'), blocked);

    window.fetch = async () => (reply({ unexpected: 1 }));
    reset({ 'config/aiKey': googleKey });
    let weird = '';
    try { await callAi('привет'); } catch (e) { weird = e.message; }
    ok('unknown shape lists its keys', weird.includes('unexpected'), weird);
    window.fetch = stubFetch;

    // ---------- чек идёт к тем же моделям
    reset({ 'config/geminiKey': 'AIzaTest' });
    const raw = await readReceiptPhoto('data:image/gif;base64,R0lGODlhAQABAAAAACw=');
    ok('receipt uses the vision list', sentModels[0].model === AI_PROVIDERS.gemini.vision[0]);
    ok('receipt answer returned', raw === 'готовый ответ');

    // ---------- смена пользователя сбрасывает адрес
    reset({ 'config/geminiKey': 'AIzaTest' });
    await getAiEndpoint();
    initApp();
    ok('endpoint cache cleared on init', _aiEndpoint === null);
  } catch (e) {
    out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
  }
  window.fetch = realFetch;
  delete window._fbGet;
  delete window._fbRef;
  delete window._fbDb;
  ok('no window errors', __errs.length === 0, __errs.join(' | '));
  flush();
})();
