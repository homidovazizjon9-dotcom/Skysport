// Окно распознавания чека: этапы, видимая ошибка, повтор и ручной ввод
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
const flush = () => {
  let pre = document.getElementById('__results');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
  pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
};

// Поддельная база: ключ есть, чтобы дело доходило до запроса
const fakeConfig = { 'config/aiKey': 'AQ.Ab8RN6IExampleKeyForTests1234567890' };
window._fbDb = {};
window._fbRef = (db, path) => path;
window._fbGet = async path => ({
  exists: () => fakeConfig[path] !== undefined,
  val: () => fakeConfig[path]
});

const realFetch = window.fetch;
const reply = obj => ({ ok: true, status: 200, text: async () => JSON.stringify(obj) });
const answerWith = content => reply({ choices: [{ message: { content } }] });

// Настоящий однопиксельный GIF: canvas должен суметь его раскодировать
const tinyGif = () => {
  const bytes = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
  return new File([bytes], 'receipt.gif', { type: 'image/gif' });
};

const errorBox = () => document.getElementById('receiptError');
const overlayShown = () => document.getElementById('scannerOverlay').classList.contains('show');

(async () => {
  try {
    currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    settings = { initialBalance: 0, monthBudget: 0 };
    data = { transactions: [], subscriptions: [] };
    ensureSettings();
    initApp();

    // ---------- удачное распознавание
    window.fetch = async () => answerWith('{"amount": 1245.5, "date": "2026-09-01", "name": "Народный", "category": "food"}');
    await readReceipt(tinyGif());
    ok('form filled from the photo', document.getElementById('amountInput').value === '1245.5',
      document.getElementById('amountInput').value);
    ok('name filled', document.getElementById('nameInput').value === 'Народный');
    ok('overlay closed on success', !overlayShown());
    ok('photo attached to the form', _pendingReceiptPhoto !== null);
    ok('no error left on screen', errorBox().textContent === '');
    dropPendingReceipt();

    // ---------- модель ответила, но суммы нет
    window.fetch = async () => answerWith('Извините, не могу разобрать этот чек');
    await readReceipt(tinyGif());
    ok('overlay stays open on a useless answer', overlayShown());
    ok('model answer shown to the user', errorBox().textContent.includes('не могу разобрать'), errorBox().textContent);
    ok('actions offered', document.getElementById('receiptActions').style.display === 'flex');
    ok('spinner hidden while failed', document.getElementById('receiptSpinner').style.display === 'none');

    // ---------- «Ещё раз» повторяет с тем же фото
    window.fetch = async () => answerWith('{"amount": 300, "name": "Заправка", "category": "car"}');
    await retryReceipt();
    ok('retry uses the same photo', document.getElementById('amountInput').value === '300',
      document.getElementById('amountInput').value);
    ok('overlay closed after a good retry', !overlayShown());
    dropPendingReceipt();

    // ---------- сетевая ошибка не исчезает вместе с окном
    window.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await readReceipt(tinyGif());
    ok('network error kept on screen', errorBox().textContent.length > 0, errorBox().textContent);
    ok('overlay stays open on a network error', overlayShown());

    // ---------- «Ввести вручную» уводит в форму
    manualReceipt();
    ok('manual entry closes the overlay', !overlayShown());
    ok('manual entry opens the add tab', _currentNav === 'add', _currentNav);
    ok('error cleared after closing', errorBox().textContent === '');

    // ---------- отмена во время чтения
    window.fetch = async () => answerWith('{"amount": 50, "name": "Что-то", "category": "food"}');
    document.getElementById('amountInput').value = '';
    const pending = readReceipt(tinyGif());
    closeReceiptScan();
    await pending;
    ok('cancelled scan fills nothing', document.getElementById('amountInput').value === '');
    ok('cancelled scan leaves no error', errorBox().textContent === '');

    // ---------- второй запуск во время работы игнорируется
    window.fetch = async () => answerWith('{"amount": 70, "name": "Второй", "category": "food"}');
    const first = readReceipt(tinyGif());
    const second = readReceipt(tinyGif());
    await Promise.all([first, second]);
    ok('one scan at a time', data.transactions.length === 0);
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
