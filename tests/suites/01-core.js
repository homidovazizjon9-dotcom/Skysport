// Нормализация данных, рендер, XSS, темы
// Тело набора: run.py оборачивает его в IIFE и вставляет в копию index.html.

  const out = [];
  const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name +
  (extra !== undefined ? ' :: ' + String(extra).replace(/\s+/g, ' ').trim() : ''));
  try {
    currentUser = { uid: 'test', displayName: 'Тест Тестов', email: 't@t', photoURL: '' };
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    const today = dateKey();
    const d = new Date(); d.setDate(d.getDate() - 40);
    const old = dateKey(d);
    data = {
      transactions: normalizeTxList([
        { id: 'a1', date: today, name: '<img src=x onerror="window.__xss=1">', amount: '150', type: 'expense', category: 'food', note: '<b>n</b>' },
        { id: 'a1', date: today, name: 'dup id', amount: 50, type: 'expense', category: 'car' },
        { id: 'bad"id\'', date: 'not-a-date', name: 'bad', amount: 10, type: 'expense', category: 'nope' },
        { id: 'z', date: old, name: 'зарплата', amount: 1000, type: 'income', category: 'food' },
        { id: 'zero', date: today, name: 'zero', amount: 0 },
        null
      ]),
      subscriptions: [{ id: 'sub_1', name: 'Netflix', amount: 99, day: 1, category: 'fun', lastProcessedMonth: null }]
    };
    ok('normalize drops invalid', data.transactions.length === 4, data.transactions.length);
    ok('dup ids resolved', new Set(data.transactions.map(t => t.id)).size === 4);
    ok('id sanitized', data.transactions.some(t => t.id === 'badid'));
    ok('bad date -> today', data.transactions.find(t => t.id === 'badid').date === today);
    ok('bad category -> other', data.transactions.find(t => t.id === 'badid').category === 'other');
    ok('income category forced', data.transactions.find(t => t.id === 'z').category === 'income');

    initApp();
    switchNav('history', null);
    const hist = document.getElementById('historyList');
    ok('history rendered', hist.querySelectorAll('.tx-item').length === 4, hist.querySelectorAll('.tx-item').length);
    ok('no injected img', !hist.querySelector('img') && !document.getElementById('tab-home').querySelector('.tx-list img'));
    ok('name shown as text', hist.textContent.includes('<img src=x'));
    ok('sorted desc', data.transactions[data.transactions.length - 1].id === 'z');

    processSubscriptions();
    processSubscriptions();
    const subTx = data.transactions.filter(t => t.id.startsWith('tx_sub_'));
    ok('subscription charged once', subTx.length === 1, subTx.map(t => t.id + ' ' + t.date).join(','));

    // multiselect: same tx on Home and History highlighted together
    switchNav('home', null);
    const id = data.transactions[0].id;
    toggleSelectTx(id);
    const nodes = document.querySelectorAll(`.tx-item[data-id="${id}"]`);
    ok('multiselect highlights all copies', nodes.length >= 2 && [...nodes].every(n => n.classList.contains('selected-multi')), nodes.length);
    cancelMultiselect();

    // analytics: all periods, including an empty past month
    switchNav('analytics', null);
    setPeriod('week'); ok('week bars', document.querySelectorAll('#barChart .bar-col').length === 7);
    setPeriod('month'); ok('month bars = days in month', document.querySelectorAll('#barChart .bar-col').length === new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());
    selectedMonthForAnalytics = '2020-01'; renderAnalytics();
    ok('empty month keeps compare', document.querySelector('.month-compare-wrap').style.display === 'block');
    ok('empty month message', document.getElementById('analyticsEmptyState').textContent.includes('Нет расходов'));
    setPeriod('all');
    showMonthDetail(today.slice(0, 7));

    switchNav('plan', null); switchNav('goals', null); switchNav('ai', null); switchNav('settings', null);
    goalsData = [{ id: 'g1', name: '<scr' + 'ipt>x</scr' + 'ipt>', target: 100, saved: 10, deadline: today, emoji: '🎯' }];
    renderGoals();
    ok('goal escaped', !document.querySelector('#goalsList script') && document.getElementById('goalsList').textContent.includes('Сегодня дедлайн'));
    openSubModal(); renderSubs(); closeSubModal();
    ok('sub select has no income', ![...document.querySelectorAll('#subCat option')].some(o => o.value === 'income'));

    settings.monthBudget = 500; refreshAll();
    ok('budget bar shown', document.getElementById('budgetProgress').style.display === 'block');
    settings.monthBudget = 0; refreshAll();
    ok('budget bar hidden when cleared', document.getElementById('budgetProgress').style.display === 'none');

    toggleTheme(); ok('theme toggles', document.body.classList.contains('light')); toggleTheme();
    resetUserState();
    ok('reset clears settings', settings.monthBudget === 0 && !settings.theme && data.transactions.length === 0);

    const nav = getComputedStyle(document.getElementById('bottomNav'));
    ok('nav height fits the FAB label', nav.height === '68px', nav.height);
    ok('toast not blocking taps', getComputedStyle(document.getElementById('toast')).pointerEvents === 'none');
    ok('txSignature stable', txSignature([{ id: 'a', amount: 1, date: 'd', name: 'n', category: 'c', type: 't' }]).startsWith('a|1|d|n|c|t|'));
  } catch (e) {
    out.push('EXCEPTION ' + e.message + '\n' + e.stack);
  }
  setTimeout(() => {
    ok('no xss executed', !window.__xss);
    ok('no window errors', __errs.length === 0, __errs.join(' | '));
    const pre = document.createElement('pre');
    pre.id = '__results';
    pre.textContent = '\n@@RESULTS@@\n' + out.join('\n') + '\n@@END@@\n';
    document.body.appendChild(pre);
  }, 300);
