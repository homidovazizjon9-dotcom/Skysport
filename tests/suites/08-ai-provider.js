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
let sentModels = [];
let failFirst = 0;
const stubFetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  sentModels.push({ url, model: body.model, auth: opts.headers.Authorization });
  if (sentModels.length <= failFirst) {
    return { json: async () => ({ error: { message: 'The model `' + body.model + '` does not exist' } }) };
  }
  return { json: async () => ({ choices: [{ message: { content: 'готовый ответ' } }] }) };
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

    // ---------- чужой ключ объясняют по-человечески
    reset({ 'config/aiKey': 'какая-то строка' });
    window.fetch = async () => ({ json: async () => ({ error: { message: 'Invalid API Key' } }) });
    let keyErr = '';
    try { await callAi('привет'); } catch (e) { keyErr = e.message; }
    ok('wrong key shape is explained', keyErr.includes('config/aiKey'), keyErr);

    reset({ 'config/aiKey': googleKey });
    keyErr = '';
    try { await callAi('привет'); } catch (e) { keyErr = e.message; }
    ok('right shape keeps the original error', keyErr === 'Invalid API Key', keyErr);
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
    ok('key goes in the header', sentModels[0].auth === 'Bearer AIzaTest');

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
