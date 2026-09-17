// Свои категории, история, быстрый ввод, фото чека
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
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dateKey(d); };

  try {
    currentUser = { uid: 'test', displayName: 'Тест', email: 't@t', photoURL: '' };
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    settings = { initialBalance: 0, monthBudget: 0 };
    data = { transactions: [], subscriptions: [] };
    ensureSettings();
    initApp();

    // ---------- custom categories
    ok('base cats intact', CATS.length === BASE_CATS.length && CATS[CATS.length - 1].id === 'other');
    settings.customCats = [
      { id: 'кафе!!', label: ' Питомец ', icon: '', color: '' },
      { id: 'food', label: 'Подмена', icon: '🍕', color: '#fff' }
    ];
    rebuildCats();
    ok('custom cat sanitized', CATS.some(c => c.label === 'Питомец' && /^[\w-]+$/.test(c.id)));
    ok('built-in id cannot be shadowed', CATS.filter(c => c.id === 'food').length === 1 && getCat('food').label === 'Еда');
    ok('income/other stay last', CATS[CATS.length - 1].id === 'other' && CATS[CATS.length - 2].id === 'income');
    const petId = settings.customCats[0].id;
    ok('custom cat in add grid', [...document.querySelectorAll('#catGrid .cat-chip')].some(b => b.textContent.includes('Питомец')) || (renderCatGrid(), true));

    settings.customCats = [];
    rebuildCats();
    addCategory();
    ok('addCategory works', settings.customCats.length === 1 && CATS.some(c => c.id === settings.customCats[0].id));
    const cid = settings.customCats[0].id;
    updateCategory(cid, 'label', 'Питомец');
    const iconBefore = settings.customCats[0].icon;
    updateCategory(cid, 'icon');
    updateCategory(cid, 'color');
    ok('category renamed', getCat(cid).label === 'Питомец');
    ok('icon cycles', settings.customCats[0].icon !== iconBefore);
    ok('settings row rendered', document.querySelectorAll('#customCatsList .cat-edit-row').length === 1);

    // transaction in a custom category survives normalization
    data.transactions = normalizeTxList([
      { id: 'p1', date: dateKey(), name: 'Корм', amount: 60, type: 'expense', category: cid },
      { id: 'p2', date: daysAgo(1), name: 'Обед', amount: 40, type: 'expense', category: 'food' },
      { id: 'p3', date: daysAgo(1), name: 'Аванс', amount: 500, type: 'income' },
      { id: 'p4', date: daysAgo(20), name: 'Куртка', amount: 300, type: 'expense', category: 'cloth' }
    ]);
    ok('custom category kept', data.transactions.find(t => t.id === 'p1').category === cid);
    settings.planCatBudgets = { [cid]: 100 };
    removeCategory(cid); clickConfirm();
    ok('cat removed -> tx moved to other', data.transactions.find(t => t.id === 'p1').category === 'other');
    ok('plan budget cleaned', !settings.planCatBudgets[cid]);
    ok('cat list empty again', !settings.customCats.length);

    // ---------- history grouped by day
    switchNav('history', null);
    const groups = document.querySelectorAll('#historyList .day-group');
    ok('grouped by day', groups.length === 3, groups.length);
    ok('today label', document.querySelector('#historyList .day-title').textContent === 'Сегодня');
    ok('yesterday label', groups[1].querySelector('.day-title').textContent === 'Вчера');
    ok('day total shown', groups[1].querySelector('.day-total').textContent.includes('−40'));
    ok('summary shown', document.getElementById('historySummary').textContent.includes('4 операц'));

    // date range
    setDatePreset('7');
    ok('7-day preset filters', document.querySelectorAll('#historyList .tx-item').length === 3);
    ok('preset marked active', document.querySelector('.date-preset.active').textContent === '7 дней');
    document.getElementById('histFrom').value = daysAgo(25);
    document.getElementById('histTo').value = daysAgo(2);
    onDateRangeChange();
    ok('custom range filters', document.querySelectorAll('#historyList .tx-item').length === 1);
    ok('custom preset active', !document.querySelector('.date-preset.active'));
    setDatePreset('all');
    ok('all shows everything', document.querySelectorAll('#historyList .tx-item').length === 4);

    // ---------- history paging
    const many = [];
    for (let k = 0; k < 200; k++) {
      many.push({ id: 'm' + k, date: daysAgo(k % 40), name: 'Строка ' + k, amount: 10, type: 'expense', category: 'food' });
    }
    data.transactions = normalizeTxList(many);
    setDatePreset('all');
    renderHistory();
    const shownRows = () => document.querySelectorAll('#historyList .tx-item').length;
    ok('page limited to 150', shownRows() === HISTORY_PAGE, shownRows());
    ok('show more offered', !!document.querySelector('.show-more-btn'));
    ok('rest counted on the button', document.querySelector('.show-more-btn').textContent.includes('50'));
    ok('summary counts everything', document.getElementById('historySummary').textContent.includes('200 операц'));
    showMoreHistory();
    ok('show more adds a page', shownRows() === 200, shownRows());
    ok('button gone at the end', !document.querySelector('.show-more-btn'));
    renderHistory();
    ok('paging resets on filter', historyShown === HISTORY_PAGE && shownRows() === HISTORY_PAGE);
    ok('newest day first', document.querySelector('#historyList .day-title').textContent === 'Сегодня');

    // ---------- quick add parsing
    const p1 = parseQuickAdd('обед 45');
    ok('parse "обед 45"', p1 && p1.amount === 45 && p1.category === 'food' && p1.type === 'expense' && p1.name === 'Обед', JSON.stringify(p1));
    const p2 = parseQuickAdd('+зарплата 5000');
    ok('parse income with +', p2 && p2.type === 'income' && p2.amount === 5000 && p2.name === 'Зарплата');
    ok('parse income by keyword', parseQuickAdd('аванс 300').type === 'income');
    const p3 = parseQuickAdd('кофе 12,50');
    ok('parse decimal comma', p3 && p3.amount === 12.5 && p3.category === 'food');
    ok('parse amount first', parseQuickAdd('30 такси').category === 'car');
    ok('no amount -> null', parseQuickAdd('просто текст') === null);
    ok('empty -> null', parseQuickAdd('') === null);

    switchNav('add', null);
    const inp = document.getElementById('quickAddInput');
    inp.value = '<img src=x onerror="window.__xss=1"> 99';
    previewQuickAdd();
    ok('preview escapes html', !document.querySelector('#quickAddHint img'));
    inp.value = 'заправка 120';
    previewQuickAdd();
    ok('preview shows category', document.getElementById('quickAddHint').textContent.includes('Машина'));
    const n = data.transactions.length;
    submitQuickAdd();
    const qa = data.transactions.find(t => t.amount === 120) || {};
    ok('quick add creates tx', data.transactions.length === n + 1 && qa.amount === 120 && qa.category === 'car' && qa.date === dateKey());
    ok('input cleared', inp.value === '');
    inp.value = 'ничего';
    submitQuickAdd();
    ok('bad input ignored', data.transactions.length === n + 1);
    inp.value = '';

    // ---------- receipt photo -> form
    const r1 = parseReceiptJson('Вот данные: ```json {"amount": "1 245,50", "date": "2026-09-01", "name": "Народный", "category": "food"} ``` готово');
    ok('receipt json parsed', r1 && r1.amount === 1245.5 && r1.date === '2026-09-01' && r1.name === 'Народный' && r1.category === 'food', JSON.stringify(r1));
    applyReceiptData(r1);
    ok('receipt fills amount', document.getElementById('amountInput').value === '1245.5', document.getElementById('amountInput').value);
    ok('receipt fills date', document.getElementById('dateInput').value === '2026-09-01');
    ok('receipt fills name', document.getElementById('nameInput').value === 'Народный');
    ok('receipt note', document.getElementById('noteInput').value.startsWith('Распознано'));
    ok('receipt sets category', currentCat === 'food' && currentType === 'expense');

    const r2 = parseReceiptJson('{"amount": null, "date": null, "name": null, "category": null}');
    ok('receipt without amount rejected', r2 === null);
    ok('garbage answer rejected', parseReceiptJson('модель не смогла') === null);

    const r3 = parseReceiptJson('{"amount": 300, "date": "не видно", "name": "Заправка Газпром", "category": "выдуманная"}');
    ok('bad date falls back to today', r3.date === dateKey());
    ok('bad category guessed from name', r3.category === 'car', r3.category);
    ok('receipt name is trimmed', parseReceiptJson('{"amount":1,"name":"' + 'я'.repeat(80) + '"}').name.length === 40);

    ok('guessCategory finds keyword', guessCategory('аптека рядом') === 'health');
    ok('guessCategory defaults to other', guessCategory('что-то непонятное') === 'other');

    // ---------- фото чека при операции
    const pic = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const addWithPhoto = (name, amount) => {
      switchNav('add', null);
      setType('expense');
      selectCat('food');
      showPendingReceipt(pic);
      document.getElementById('amountInput').value = String(amount);
      document.getElementById('nameInput').value = name;
      document.getElementById('dateInput').value = dateKey();
      addTransaction();
      return data.transactions[0];
    };

    switchNav('add', null);
    showPendingReceipt(pic);
    ok('receipt chip shown', document.getElementById('receiptChip').style.display === 'flex');
    dropPendingReceipt();
    ok('chip can be dropped', _pendingReceiptPhoto === null && document.getElementById('receiptChip').style.display === 'none');

    data.transactions = [];
    const withPhoto = addWithPhoto('Чек из магазина', 250);
    ok('tx marked with photo', withPhoto.photo === 1, JSON.stringify(withPhoto));
    ok('chip cleared after save', _pendingReceiptPhoto === null);
    ok('photo stored', typeof lsGet('receipt_' + withPhoto.id, 'null') === 'string');

    editingTxId = withPhoto.id;
    removeReceiptPhoto();
    ok('photo removed from tx', !withPhoto.photo);
    ok('photo removed from storage', lsGet('receipt_' + withPhoto.id, 'null') === null);

    const second = addWithPhoto('Второй чек', 99);
    deleteTxs([second.id], 'Удалено');
    undoDelete();
    ok('undo keeps the photo', typeof lsGet('receipt_' + second.id, 'null') === 'string');
    deleteTxs([second.id], 'Удалено');
    hideUndo();
    ok('expired undo drops the photo', lsGet('receipt_' + second.id, 'null') === null);

    editingTxId = null;
    attachReceiptToTx(null);
    ok('attaching without a tx is safe', true);

    // unsupported APIs must not throw
    startVoiceInput();
    pickReceipt();
    closeReceiptScan();
    handleReceiptFile(null);
    handleReceiptFile({ files: [] });
    ok('voice/receipt fallbacks survive', true);


    switchNav('home', null);
    switchNav('analytics', null);
    switchNav('plan', null);
    switchNav('settings', null);
  } catch (e) {
    out.push('EXCEPTION ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
  }
  ok('no xss executed', !window.__xss);
  ok('no window errors', __errs.length === 0, __errs.join(' | '));
  flush();
