// Совместный доступ: пути в базе, кэш и проверки кода приглашения
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
const flush = () => {
  let pre = document.getElementById('__results');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
  pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
};

try {
  currentUser = { uid: 'me-uid', displayName: 'Тест', email: 't@t', photoURL: '' };
  document.getElementById('splashScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  settings = { initialBalance: 0, monthBudget: 0 };
  data = { transactions: [], subscriptions: [] };
  activeSpaceUid = null;
  ensureSettings();
  initApp();

  // ---------- по умолчанию работаем в своём пространстве
  ok('own space by default', spaceUid() === 'me-uid' && activeSpaceUid === null);
  ok('path points at own data', userPath('transactions') === 'users/me-uid/transactions');
  ok('cache key is own', lsKey('expenses_data') === 'me-uid_expenses_data');

  // ---------- переключение меняет и путь, и кэш
  activeSpaceUid = 'other-uid';
  ok('path follows the space', userPath('transactions') === 'users/other-uid/transactions');
  ok('cache follows the space', lsKey('expenses_data') === 'other-uid_expenses_data');
  ok('receipts follow the space', receiptPath('tx1') === 'users/other-uid/receipts/tx1');
  activeSpaceUid = null;

  // ---------- запоминание между запусками
  rememberSpace('other-uid');
  activeSpaceUid = null;
  restoreSpace();
  ok('space restored', activeSpaceUid === 'other-uid');
  rememberSpace('me-uid');
  activeSpaceUid = 'other-uid';
  restoreSpace();
  ok('own uid never counts as a shared space', activeSpaceUid === null);
  rememberSpace(null);
  restoreSpace();
  ok('nothing saved means own space', activeSpaceUid === null);

  // ---------- проверки кода
  const input = document.getElementById('shareCodeInput');
  input.value = '';
  addShareMember();
  ok('empty code rejected', shareMembers.length === 0);
  input.value = 'me-uid';
  addShareMember();
  ok('own code rejected', shareMembers.length === 0);
  input.value = 'нет';
  addShareMember();
  ok('short code rejected', shareMembers.length === 0);
  input.value = 'abcdef123456';
  addShareMember();
  ok('no database means no write', shareMembers.length === 0);
  ok('good code stays in the field', input.value === 'abcdef123456');
  input.value = '';

  // ---------- переключение без доступа не трогает данные
  switchSpace('unreachable-uid');
  ok('failed switch keeps own space', activeSpaceUid === null);
  ok('failed switch keeps the path', userPath('goals') === 'users/me-uid/goals');

  // ---------- список бюджетов
  shareSpaces = [{ uid: 'wife-uid', name: 'Бюджет семьи', email: 'w@e' }];
  shareMembers = [{ uid: 'friend-uid', name: '', since: dateKey() }];
  renderShareSettings();
  const spaces = document.getElementById('shareSpaces').textContent;
  ok('own budget listed first', spaces.indexOf('Мой бюджет') < spaces.indexOf('Бюджет семьи'));
  ok('shared budget listed', spaces.includes('Бюджет семьи'));
  ok('current space marked', document.querySelector('#shareSpaces .active-space').textContent === 'Открыт');
  ok('members listed', document.getElementById('shareMembers').textContent.includes('friend-uid'.slice(0, 12)));
  ok('own code shown', document.getElementById('myShareCode').textContent.startsWith('me-uid'));

  // ---------- чужое имя не ломает разметку
  shareSpaces = [{ uid: 'x-uid', name: '<img src=x onerror="window.__xss=1">', email: '' }];
  renderShareSettings();
  ok('space name escaped', !document.querySelector('#shareSpaces img'));

  // ---------- localStorage может быть запрещён
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = () => { throw new Error('denied'); };
  lsSet('expenses_data', { transactions: [] });
  Storage.prototype.setItem = realSet;
  ok('blocked storage does not break saving', true);

  shareSpaces = [];
  shareMembers = [];
  renderShareSettings();
} catch (e) {
  out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
}
ok('no xss executed', !window.__xss);
ok('no window errors', __errs.length === 0, __errs.join(' | '));
flush();
