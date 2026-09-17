// Регулярные платежи, пропущенные месяцы, оповещения
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

  const out = [];
  const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
  const flush = () => {
    let pre = document.getElementById('__results');
    if (!pre) { pre = document.createElement('pre'); pre.id = '__results'; document.body.appendChild(pre); }
    pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
  };
  const monthsBack = n => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return dateKey(d).slice(0, 7); };

  try {
    currentUser = { uid: 'test4', displayName: 'Тест', email: 't@t', photoURL: '' };
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    localStorage.clear();
    settings = { initialBalance: 0, monthBudget: 0 };
    data = { transactions: [], subscriptions: [] };
    ensureSettings();
    initApp();

    const cm = dateKey().slice(0, 7);
    const today = new Date().getDate();

    // ---------- month helpers
    ok('nextMonth rolls over year', nextMonth('2026-12') === '2027-01', nextMonth('2026-12'));
    ok('monthsRange inclusive', monthsRange('2026-07', '2026-09').join(',') === '2026-07,2026-08,2026-09');
    ok('monthsRange capped', monthsRange('2000-01', '2026-09').length === 24);

    // ---------- missed months are charged
    data.subscriptions = [{ id: 'sub_1', name: 'Netflix', amount: 50, day: 1, category: 'fun', lastProcessedMonth: monthsBack(3) }];
    processSubscriptions();
    let subTxs = data.transactions.filter(t => t.id.startsWith('tx_sub_'));
    ok('3 missed months charged', subTxs.length === 3, subTxs.map(t => t.date).join(','));
    ok('charged months are the missing ones',
      subTxs.map(t => t.date.slice(0, 7)).sort().join(',') === [monthsBack(2), monthsBack(1), cm].join(','));
    ok('lastProcessedMonth updated', data.subscriptions[0].lastProcessedMonth === cm);

    processSubscriptions();
    ok('no duplicates on second run', data.transactions.filter(t => t.id.startsWith('tx_sub_')).length === 3);

    // ---------- day 31 clamps to the shortest month
    data.transactions = [];
    data.subscriptions = [{ id: 'sub_2', name: 'Аренда', amount: 100, day: 31, category: 'home', lastProcessedMonth: '2026-01' }];
    processSubscriptions();
    const feb = data.transactions.find(t => t.date.startsWith('2026-02'));
    ok('day 31 -> last day of february', feb && feb.date === '2026-02-28', feb && feb.date);

    // ---------- a day that has not arrived yet is not charged
    data.transactions = [];
    data.subscriptions = [{ id: 'sub_3', name: 'Будущее', amount: 10, day: 28, category: 'home', lastProcessedMonth: monthsBack(1) }];
    processSubscriptions();
    const thisMonthTx = data.transactions.filter(t => t.date.startsWith(cm));
    ok('future day not charged yet', today >= 28 ? thisMonthTx.length === 1 : thisMonthTx.length === 0, 'today=' + today);

    // ---------- new subscription starts from the current month
    data.transactions = [];
    data.subscriptions = [];
    document.getElementById('subName').value = 'Спортзал';
    document.getElementById('subAmount').value = '200';
    document.getElementById('subDay').value = '1';
    openSubModal();
    document.getElementById('subCat').value = 'health';
    addSub();
    ok('sub saved with startMonth', data.subscriptions[0].startMonth === cm);
    ok('new sub charged once', data.transactions.filter(t => t.id.startsWith('tx_sub_')).length === (today >= 1 ? 1 : 0));
    closeSubModal();

    // ---------- регулярный доход
    data.subscriptions = [];
    data.transactions = [];
    openSubModal();
    document.getElementById('subName').value = 'Зарплата';
    document.getElementById('subAmount').value = '5000';
    document.getElementById('subDay').value = '1';
    setSubType('income');
    ok('income hides the category picker', document.getElementById('subCatField').style.display === 'none');
    addSub();
    const paySub = data.subscriptions[0] || {};
    ok('sub stored as income', paySub.type === 'income' && paySub.category === 'income', JSON.stringify(paySub));
    ok('type resets to expense', subType === 'expense');
    ok('category picker back', document.getElementById('subCatField').style.display === '');
    const payTx = data.transactions.find(t => String(t.id).startsWith('tx_sub_')) || {};
    ok('income charged as income', payTx.type === 'income' && payTx.amount === 5000, JSON.stringify(payTx));
    ok('income goes to the income category', payTx.category === 'income');
    renderSubs();
    ok('income shown with a plus', document.getElementById('subList').textContent.includes('+5'));
    closeSubModal();

    // ---------- alerts
    data.transactions = normalizeTxList([{ id: 'a1', date: dateKey(), name: 'Крупная трата', amount: 850, type: 'expense', category: 'food' }]);
    data.subscriptions = [];
    settings.monthBudget = 1000;
    let alerts = renderAlerts();
    ok('80% budget alert', alerts.some(a => a.id.startsWith('budget80')), JSON.stringify(alerts.map(a => a.id)));
    ok('alert card visible', document.querySelectorAll('#alertsBox .alert-card').length === 1);

    data.transactions[0].amount = 1200;
    alerts = renderAlerts();
    ok('100% budget alert', alerts.some(a => a.id.startsWith('budget100')) && !alerts.some(a => a.id.startsWith('budget80')));

    dismissAlert(alerts[0].id);
    ok('dismissed alert hidden', renderAlerts().length === 0 && document.getElementById('alertsBox').style.display === 'none');

    settings.monthBudget = 0;
    data.subscriptions = [{ id: 'sub_9', name: 'Интернет', amount: 90, day: Math.min(today + 2, 28), category: 'home', lastProcessedMonth: null }];
    alerts = renderAlerts();
    ok('upcoming subscription alert', today + 2 <= 28 ? alerts.some(a => a.id.startsWith('sub:')) : true, JSON.stringify(alerts.map(a => a.id)));
    ok('alert text escaped', !document.querySelector('#alertsBox img'));

    // ---------- notifications UI degrades gracefully
    switchNav('settings', null);
    renderNotifySettings();
    const status = document.getElementById('notifyStatus').textContent;
    ok('notify status filled', status.length > 10, status.slice(0, 40));
    checkAlerts();
    ok('checkAlerts survives without permission', true);

    switchNav('home', null);
    ok('alerts render on home', document.getElementById('alertsBox').style.display !== '');
  } catch (e) {
    out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
  }
  ok('no window errors', __errs.length === 0, __errs.join(' | '));
  flush();
