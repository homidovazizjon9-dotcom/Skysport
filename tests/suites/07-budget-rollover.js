// Перенос остатка бюджета, индикатор офлайна, кнопка установки
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
const flush = () => {
  let pre = document.getElementById('__results');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
  pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
};

// 15-е число прошлого месяца — дата, которая не уедет в соседний месяц
const lastMonthDay = () => {
  const now = new Date();
  return dateKey(new Date(now.getFullYear(), now.getMonth() - 1, 15));
};
const spentLastMonth = amount => {
  data.transactions = normalizeTxList([
    { id: 'prev', date: lastMonthDay(), name: 'Прошлый месяц', amount, type: 'expense', category: 'food' }
  ]);
};

try {
  currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
  document.getElementById('splashScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  settings = { initialBalance: 0, monthBudget: 0 };
  data = { transactions: [], subscriptions: [] };
  ensureSettings();
  initApp();

  // ---------- выключенный перенос ничего не меняет
  settings.monthBudget = 1000;
  settings.planRollover = false;
  spentLastMonth(600);
  ok('budget untouched while off', activeBudget() === 1000 && budgetCarry() === 0);

  // ---------- остаток прибавляется
  settings.planRollover = true;
  ok('unspent carries over', budgetCarry() === 400 && activeBudget() === 1400, activeBudget());

  // ---------- перерасход вычитается
  spentLastMonth(1300);
  ok('overspending carries over too', budgetCarry() === -300 && activeBudget() === 700, activeBudget());

  // ---------- бюджет не уходит в минус
  settings.monthBudget = 100;
  spentLastMonth(900);
  ok('budget never goes negative', activeBudget() === 0, activeBudget());

  // ---------- без бюджета переносить нечего
  settings.monthBudget = 0;
  ok('no budget means no carry', budgetCarry() === 0 && activeBudget() === 0);

  // ---------- месяц без записей не переносится
  settings.monthBudget = 1000;
  data.transactions = [];
  ok('empty month carries nothing', budgetCarry() === 0 && activeBudget() === 1000, activeBudget());

  // ---------- подпись под галочкой
  settings.monthBudget = 1000;
  spentLastMonth(600);
  switchNav('plan', null);
  ok('checkbox reflects the setting', document.getElementById('planRollover').checked === true);
  ok('note explains the bonus', document.getElementById('planRolloverNote').textContent.includes('400'),
    document.getElementById('planRolloverNote').textContent);
  spentLastMonth(1300);
  renderRollover();
  ok('note explains the overspending', document.getElementById('planRolloverNote').textContent.includes('300'));
  settings.monthBudget = 0;
  renderRollover();
  ok('note asks for a budget first', document.getElementById('planRolloverNote').textContent.includes('бюджет'));

  // ---------- галочка переключается
  settings.monthBudget = 1000;
  spentLastMonth(600);
  document.getElementById('planRollover').checked = false;
  toggleRollover();
  ok('unchecking turns it off', settings.planRollover === false && activeBudget() === 1000);
  document.getElementById('planRollover').checked = true;
  toggleRollover();
  ok('checking turns it back on', settings.planRollover === true && activeBudget() === 1400);
  ok('note cleared when off', true);

  // ---------- оповещения считают уже с переносом
  const now = new Date();
  const thisMonthDay = dateKey(new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate(), 28)));
  data.transactions = normalizeTxList([
    { id: 'prev', date: lastMonthDay(), name: 'Прошлый', amount: 600, type: 'expense', category: 'food' },
    { id: 'now', date: thisMonthDay, name: 'Этот', amount: 1100, type: 'expense', category: 'food' }
  ]);
  let ids = getAlerts().map(a => a.id).join(' ');
  ok('extended budget is not over yet', !ids.includes('budget100'), ids);
  settings.planRollover = false;
  ids = getAlerts().map(a => a.id).join(' ');
  ok('plain budget is over', ids.includes('budget100'), ids);
  settings.planRollover = true;

  // ---------- индикатор связи
  const bar = document.getElementById('offlineBar');
  updateOnlineState();
  ok('bar hidden while online', bar.classList.contains('show') === !navigator.onLine);
  const realOnLine = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
  updateOnlineState();
  ok('bar shown when offline', bar.classList.contains('show'));
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
  updateOnlineState();
  ok('bar hidden again', !bar.classList.contains('show'));
  if (realOnLine) Object.defineProperty(Navigator.prototype, 'onLine', realOnLine);

  // ---------- установка
  ok('install card hidden without the browser prompt', document.getElementById('installCard').style.display === 'none');
  installApp();
  ok('install without a prompt is safe', true);
} catch (e) {
  out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
}
ok('no window errors', __errs.length === 0, __errs.join(' | '));
flush();
