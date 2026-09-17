// Долги: кому дали, у кого взяли, частичный возврат, напоминания
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
const flush = () => {
  let pre = document.getElementById('__results');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
  pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
};
const clickConfirm = () => document.getElementById('confirmOk').click();
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return dateKey(d); };

try {
  currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
  document.getElementById('splashScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  settings = { initialBalance: 0, monthBudget: 0 };
  data = { transactions: [], subscriptions: [] };
  goalsData = [];
  debtsData = [];
  ensureSettings();
  initApp();
  switchNav('debts', null);

  // ---------- категория «Долг» появилась и не путается с кредитом
  ok('debt category exists', CATS.some(c => c.id === 'debt') && getCat('debt').label === 'Долг');
  ok('income and other stay last', CATS[CATS.length - 1].id === 'other' && CATS[CATS.length - 2].id === 'income');
  ok('"долг" no longer means credit', guessCategory('долг соседу') === 'debt');
  ok('credit keyword still works', guessCategory('оплата кредита') === 'credit');

  // ---------- переключение типа
  openDebtForm();
  ok('form opens on "lent"', debtType === 'lent' && document.getElementById('debtTypeLent').classList.contains('selected'));
  ok('person label matches type', document.getElementById('debtPersonLabel').textContent === 'Кому дали');
  setDebtType('borrowed');
  ok('label follows the type', document.getElementById('debtPersonLabel').textContent === 'У кого взяли');
  ok('account select filled', document.getElementById('debtAccount').options.length === getAccounts().length);
  setDebtType('lent');

  // ---------- дал в долг
  const before = getAccountBalances()[defaultAccountId()];
  document.getElementById('debtPerson').value = 'Азамат';
  document.getElementById('debtAmount').value = '1000';
  document.getElementById('debtDue').value = inDays(2);
  saveNewDebt();
  const lent = debtsData[0] || {};
  ok('debt saved', debtsData.length === 1 && lent.type === 'lent' && lent.amount === 1000 && lent.returned === 0, JSON.stringify(lent));
  ok('due date kept', lent.due === inDays(2));
  const lentTx = data.transactions[0] || {};
  ok('money left the account', lentTx.type === 'expense' && lentTx.amount === 1000 && lentTx.category === 'debt', JSON.stringify(lentTx));
  ok('transaction names the person', lentTx.name === 'В долг: Азамат');
  ok('balance dropped', getAccountBalances()[defaultAccountId()] === before - 1000);
  ok('form cleared', document.getElementById('debtPerson').value === '' && document.getElementById('debtFormCard').style.display === 'none');

  // ---------- вернули часть
  document.getElementById('rep-' + lent.id).value = '400';
  repayDebt(lent.id);
  ok('partial return counted', debtsData[0].returned === 400 && !debtsData[0].closed);
  ok('left shown', debtLeft(debtsData[0]) === 600);
  const backTx = data.transactions[0] || {};
  ok('return is income', backTx.type === 'income' && backTx.amount === 400 && backTx.name === 'Вернул долг: Азамат', JSON.stringify(backTx));
  ok('card still open', !!document.getElementById('rep-' + lent.id));

  // ---------- вернули остаток: пустое поле = всё
  document.getElementById('rep-' + lent.id).value = '';
  repayDebt(lent.id);
  ok('debt closed', !!debtsData[0].closed && debtsData[0].returned === 1000);
  ok('closed card has no repay row', !document.getElementById('rep-' + lent.id));
  ok('balance restored', getAccountBalances()[defaultAccountId()] === before);
  repayDebt(lent.id);
  ok('closed debt cannot be repaid twice', data.transactions.filter(t => t.name === 'Вернул долг: Азамат').length === 2);

  // ---------- взял в долг
  debtsData = [];
  data.transactions = [];
  openDebtForm();
  setDebtType('borrowed');
  document.getElementById('debtPerson').value = 'Банк друга';
  document.getElementById('debtAmount').value = '500';
  saveNewDebt();
  const borrowed = debtsData[0] || {};
  ok('borrowed saved', borrowed.type === 'borrowed' && borrowed.amount === 500);
  ok('borrowed money arrives', data.transactions[0].type === 'income' && data.transactions[0].name === 'Занял у: Банк друга');
  ok('type resets to lent', debtType === 'lent');
  repayDebt(borrowed.id);
  ok('paying back is an expense', data.transactions[0].type === 'expense' && data.transactions[0].category === 'debt');
  ok('borrowed debt closed', !!debtsData[0].closed);

  // ---------- итоги сверху
  debtsData = [
    { id: 'd1', type: 'lent', person: 'А', amount: 300, returned: 100, date: dateKey(), due: '' },
    { id: 'd2', type: 'borrowed', person: 'Б', amount: 800, returned: 0, date: dateKey(), due: '' },
    { id: 'd3', type: 'lent', person: 'В', amount: 50, returned: 50, date: dateKey(), due: '', closed: dateKey() }
  ];
  renderDebts();
  const totals = document.getElementById('debtTotals').textContent;
  ok('owed to me sums the rest', totals.includes('200'), totals);
  ok('i owe sums the rest', totals.includes('800'));
  ok('closed debts excluded from totals', !totals.includes('50'));
  ok('open debts come first', document.querySelector('.debt-card').textContent.includes('А'));
  ok('closed debt is marked', document.querySelectorAll('.debt-card.closed').length === 1);

  // ---------- имя не ломает разметку
  debtsData = [{ id: 'dx', type: 'lent', person: '<img src=x onerror="window.__xss=1">', amount: 10, returned: 0, date: dateKey(), due: '' }];
  renderDebts();
  ok('person escaped', !document.querySelector('#debtsList img'));

  // ---------- напоминания
  debtsData = [
    { id: 'late', type: 'lent', person: 'Просрочка', amount: 100, returned: 0, date: dateKey(), due: inDays(-5) },
    { id: 'soon', type: 'borrowed', person: 'Скоро', amount: 100, returned: 0, date: dateKey(), due: inDays(2) },
    { id: 'far', type: 'lent', person: 'Нескоро', amount: 100, returned: 0, date: dateKey(), due: inDays(30) },
    { id: 'done', type: 'lent', person: 'Закрыт', amount: 100, returned: 100, date: dateKey(), due: inDays(-9), closed: dateKey() }
  ];
  settings.monthBudget = 0;
  const alerts = getAlerts();
  const ids = alerts.map(a => a.id).join(' ');
  ok('overdue debt warns', ids.includes('debt:late'), ids);
  ok('debt due soon warns', ids.includes('debt:soon'));
  ok('far debt stays quiet', !ids.includes('debt:far'));
  ok('closed debt stays quiet', !ids.includes('debt:done'));
  ok('overdue is a warning', alerts.find(a => a.id.startsWith('debt:late')).level === 'warn');

  // ---------- удаление не трогает операции
  debtsData = [{ id: 'dd', type: 'lent', person: 'Кто-то', amount: 10, returned: 0, date: dateKey(), due: '' }];
  data.transactions = normalizeTxList([{ id: 't1', date: dateKey(), name: 'В долг: Кто-то', amount: 10, type: 'expense', category: 'debt' }]);
  renderDebts();
  deleteDebt('dd');
  clickConfirm();
  ok('debt removed from the list', debtsData.length === 0);
  ok('transaction kept', data.transactions.length === 1);
} catch (e) {
  out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
}
ok('no xss executed', !window.__xss);
ok('no window errors', __errs.length === 0, __errs.join(' | '));
flush();
