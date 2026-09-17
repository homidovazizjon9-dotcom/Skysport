// Счета, переводы, цели, удаление и отмена
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

  const out = [];
  const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
  const flush = () => {
    let pre = document.getElementById('__results');
    if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
    pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
  };
  const today = () => dateKey();
  const clickConfirm = () => document.getElementById('confirmOk').click();

  try {
    currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // ---------- accounts: defaults + legacy migration
    settings = { initialBalance: 700, monthBudget: 0 };
    ensureAccounts();
    ok('default accounts created', getAccounts().length === 2 && getAccounts()[0].id === 'cash');
    ok('legacy initial balance migrated', getAccounts()[0].initial === 700 && !settings.initialBalance);

    data = { transactions: [], subscriptions: [] };
    initApp();

    // ---------- balances: income / expense / transfer
    data.transactions = normalizeTxList([
      { id: 't1', date: today(), name: 'Зарплата', amount: 1000, type: 'income', account: 'card' },
      { id: 't2', date: today(), name: 'Обед', amount: 200, type: 'expense', category: 'food', account: 'cash' },
      { id: 't3', date: today(), name: 'Снятие', amount: 300, type: 'transfer', account: 'card', toAccount: 'cash' }
    ]);
    const bal = getAccountBalances();
    ok('card balance', bal.card === 1000 - 300, bal.card);
    ok('cash balance (700 start)', bal.cash === 700 - 200 + 300, bal.cash);
    const st = getStats('all');
    ok('total balance = sum of accounts', st.balance === bal.card + bal.cash, st.balance);
    ok('transfer is not an expense', st.expense === 200 && st.income === 1000, st.expense + '/' + st.income);
    ok('transfer not in categories', !st.byCat.transfer);

    // ---------- transfer normalization
    const bad = normalizeTx({ id: 'x', date: today(), name: 'x', amount: 5, type: 'transfer', account: 'cash', toAccount: 'cash' });
    ok('transfer to itself fixed', bad.toAccount !== bad.account, bad.account + '->' + bad.toAccount);
    const exp = normalizeTx({ id: 'y', date: today(), name: 'y', amount: 5, type: 'expense', account: 'nope', toAccount: 'cash' });
    ok('unknown account falls back', exp.account === 'cash' && !('toAccount' in exp));

    // ---------- add a transfer through the form
    switchNav('add', null);
    setType('transfer');
    ok('transfer UI shows target account', document.getElementById('accountToField').style.display === '');
    ok('submit label', document.getElementById('submitBtn').textContent === 'Перевести');
    currentAccount = 'cash'; currentAccountTo = 'card';
    document.getElementById('amountInput').value = '150';
    document.getElementById('dateInput').value = today();
    addTransaction();
    const tr = data.transactions.find(t => t.type === 'transfer' && t.amount === 150);
    ok('transfer added', !!tr && tr.account === 'cash' && tr.toAccount === 'card');
    ok('auto name for transfer', tr && tr.name.includes('→'), tr && tr.name);
    setType('expense');
    ok('expense UI hides target', document.getElementById('accountToField').style.display === 'none');

    // ---------- history rendering + account filter
    switchNav('history', null);
    ok('history shows all', document.querySelectorAll('#historyList .tx-item').length === 4);
    ok('transfer meta has arrow', document.getElementById('historyList').textContent.includes('→'));
    showAccountHistory('card');
    const cardRows = document.querySelectorAll('#historyList .tx-item').length;
    ok('account filter', cardRows === 3, cardRows); // t1, t3, transfer(150 to card)
    filterAccount = 'all'; renderAccountFilterRow(); renderHistory();

    // ---------- delete + undo
    const before = data.transactions.length;
    confirmDeleteTx('t2');
    ok('delete is instant', data.transactions.length === before - 1);
    ok('undo bar shown', document.getElementById('undoBar').classList.contains('show'));
    undoDelete();
    ok('undo restores', data.transactions.some(t => t.id === 't2') && data.transactions.length === before);
    ok('undo bar hidden', !document.getElementById('undoBar').classList.contains('show'));

    // multi delete + undo
    selectedTxIds = new Set(['t1', 't3']); multiselectMode = true;
    deleteSelected();
    ok('bulk delete', !data.transactions.some(t => t.id === 't1' || t.id === 't3'));
    undoDelete();
    ok('bulk undo', data.transactions.some(t => t.id === 't1') && data.transactions.some(t => t.id === 't3'));

    // ---------- goals move real money
    switchNav('goals', null);
    goalsData = [{ id: 'g1', name: 'Отпуск', target: 1000, saved: 0, deadline: '', emoji: '✈️' }];
    renderGoals();
    const balBefore = Object.values(getAccountBalances()).reduce((s, v) => s + v, 0);
    document.getElementById('dep-g1').value = '400';
    document.getElementById('depacc-g1').value = 'card';
    depositGoal('g1');
    const goalTx = data.transactions.find(t => t.category === 'savings');
    ok('deposit creates expense', !!goalTx && goalTx.type === 'expense' && goalTx.amount === 400 && goalTx.account === 'card');
    ok('goal saved updated', goalsData[0].saved === 400);
    const balAfter = Object.values(getAccountBalances()).reduce((s, v) => s + v, 0);
    ok('balance dropped by deposit', balBefore - balAfter === 400, balBefore + '->' + balAfter);

    document.getElementById('dep-g1').value = '150';
    withdrawGoal('g1');
    ok('withdraw returns money', goalsData[0].saved === 250 &&
      data.transactions.some(t => t.type === 'income' && t.amount === 150 && t.name.startsWith('Из цели')));

    document.getElementById('dep-g1').value = '5000';
    depositGoal('g1');
    ok('deposit capped at target', goalsData[0].saved === 1000);

    // goal delete asks for confirmation
    renderGoals();
    deleteGoal('g1'); clickConfirm();
    ok('goal deleted via confirm', goalsData.length === 0);

    // ---------- account removal reassigns transactions
    switchNav('settings', null);
    ok('accounts settings rendered', document.querySelectorAll('#accountsSettingsList .acc-row').length === 2);
    updateAccount('cash', 'name', '<img src=x onerror="window.__xss=1">');
    ok('account name escaped', !document.querySelector('#accountsSettingsList img'));
    updateAccount('cash', 'name', 'Наличные');
    addAccount();
    ok('account added', getAccounts().length === 3);
    const third = getAccounts()[2].id;
    removeAccount(third); clickConfirm();
    ok('account removed', getAccounts().length === 2);
    removeAccount('card'); clickConfirm();
    ok('txs moved off deleted account', !data.transactions.some(t => t.account === 'card' || t.toAccount === 'card'));
    ok('transfers to self converted', !data.transactions.some(t => t.type === 'transfer' && t.account === t.toAccount));

    // ---------- clear data keeps accounts, asks first
    clearData(); clickConfirm();
    ok('clear removes txs', data.transactions.length === 0 && getAccounts().length === 1, getAccounts().length);

    switchNav('analytics', null); switchNav('plan', null); switchNav('home', null);
    ok('accounts strip on home', document.querySelectorAll('#accountsStrip .acc-pill').length === 1);
  } catch (e) {
    out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
  }
  ok('no xss executed', !window.__xss);
  ok('no window errors', __errs.length === 0, __errs.join(' | '));
  flush();
