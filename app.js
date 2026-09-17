// ==============================
// DATA
// ==============================
const BASE_CATS = [
  { id: 'food', label: 'Еда', icon: '🍕', color: 'blue' },
  { id: 'car', label: 'Машина', icon: '🚗', color: 'orange' },
  { id: 'fun', label: 'Развлечения', icon: '🎮', color: 'teal' },
  { id: 'health', label: 'Здоровье', icon: '💊', color: 'amber' },
  { id: 'gift', label: 'Подарок', icon: '🎁', color: 'pink' },
  { id: 'credit', label: 'Кредит', icon: '💳', color: 'crimson' },
  { id: 'home', label: 'Дом', icon: '🏠', color: 'cyan' },
  { id: 'cloth', label: 'Одежда', icon: '👕', color: 'olive' },
  { id: 'savings', label: 'Накопления', icon: '🏦', color: 'green' },
  { id: 'debt', label: 'Долг', icon: '🤝', color: 'amber' },
  { id: 'income', label: 'Доход', icon: '💰', color: 'green' },
  { id: 'other', label: 'Другое', icon: '📦', color: 'slate' },
];

// Saturated colours vibrate on near-black and wash out on white, so every
// data colour has two tones: [dark theme, light theme].
const DATA_COLORS = {
  blue:    ['#7fa9f0', '#2f6fd0'],
  teal:    ['#6fd3c7', '#0f8b84'],
  green:   ['#6fd39a', '#12864f'],
  amber:   ['#e0bf72', '#a87400'],
  orange:  ['#efa373', '#c35a1e'],
  pink:    ['#eb9ec2', '#b8447e'],
  crimson: ['#e8909c', '#b03546'],
  cyan:    ['#76c7d8', '#0b7c94'],
  olive:   ['#b5cf7e', '#5c7d16'],
  slate:   ['#9aa0b8', '#5f6480']
};

// Colours saved by older versions of the app
const COLOR_ALIASES = {
  '#7c6dfa': 'blue', '#fa6d8f': 'orange', '#6dfad6': 'teal', '#fad06d': 'amber',
  '#fa9e6d': 'pink', '#d06dfa': 'crimson', '#6daaff': 'cyan', '#ff6daa': 'olive',
  '#6dfa9e': 'green', '#888aaa': 'slate',
  '#2f80ed': 'blue', '#e8763a': 'orange', '#14b8a6': 'teal', '#d99000': 'amber',
  '#db2777': 'pink', '#be123c': 'crimson', '#0891b2': 'cyan', '#65a30d': 'olive',
  '#12b76a': 'green', '#0f9d58': 'green', '#6b7090': 'slate'
};

// What gets stored: a palette name, never a raw hex
function colorKey(value) {
  const v = String(value || '').toLowerCase();
  if (DATA_COLORS[v]) return v;
  return COLOR_ALIASES[v] || 'slate';
}

// A negative balance must never be green, whatever the account colour is
function balanceColor(value, accountColor) {
  return value < 0 ? 'var(--accent2)' : themeColor(accountColor);
}

function isLightTheme() {
  return document.body.classList.contains('light');
}

// What gets rendered: the tone that suits the current theme
function themeColor(value) {
  return DATA_COLORS[colorKey(value)][isLightTheme() ? 1 : 0];
}

// Built-in categories + the user's own ones (settings.customCats)
let CATS = BASE_CATS.slice();
const CAT_ICONS = ['🏷', '🐾', '📚', '✈️', '🍼', '💅', '🎓', '⚽', '🎵', '🔧', '🌱', '☕', '🚌', '📱', '🎬', '🧾'];
const CAT_COLORS = ['blue', 'orange', 'teal', 'amber', 'pink', 'crimson', 'cyan', 'olive', 'green'];

function rebuildCats() {
  const reserved = new Set(BASE_CATS.map(c => c.id));
  const custom = (Array.isArray(settings.customCats) ? settings.customCats : [])
    .filter(c => c && typeof c === 'object')
    .map((c, i) => ({
      id: String(c.id ?? '').replace(/[^\w-]/g, '') || 'c_' + i,
      label: String(c.label ?? '').trim() || 'Категория',
      icon: String(c.icon ?? '') || '🏷',
      color: colorKey(c.color ?? CAT_COLORS[i % CAT_COLORS.length])
    }))
    .filter(c => !reserved.has(c.id));
  settings.customCats = custom;
  // Keep "Доход" and "Другое" at the end of every picker
  const tail = BASE_CATS.filter(c => c.id === 'income' || c.id === 'other');
  CATS = [...BASE_CATS.filter(c => c.id !== 'income' && c.id !== 'other'), ...custom, ...tail];
}

function isCustomCat(id) {
  return !BASE_CATS.some(c => c.id === id);
}

// Transfers are not a spending category — they only move money between accounts
const TRANSFER_CAT = { id: 'transfer', label: 'Перевод', icon: '🔄', color: 'slate' };

function getCat(id) {
  const cat = id === 'transfer' ? TRANSFER_CAT : (CATS.find(c => c.id === id) || CATS[CATS.length - 1]);
  return { ...cat, color: themeColor(cat.color) };
}

const DEFAULT_ACCOUNTS = [
  { id: 'cash', name: 'Наличные', icon: '💵', color: 'green', initial: 0 },
  { id: 'card', name: 'Карта', icon: '💳', color: 'blue', initial: 0 }
];
const ACCOUNT_ICONS = ['💵', '💳', '🏦', '📱', '🪙', '💼', '🧾', '💎'];
const ACCOUNT_COLORS = ['green', 'blue', 'orange', 'cyan', 'pink', 'olive'];

const INCOME_SOURCES = [
  { id: 'salary', label: 'Зарплата', icon: '💼' },
  { id: 'freelance', label: 'Фриланс', icon: '💻' },
  { id: 'business', label: 'Бизнес', icon: '🏢' },
  { id: 'gift_in', label: 'Подарок', icon: '🎁' },
  { id: 'invest', label: 'Инвестиции', icon: '📈' },
  { id: 'sell', label: 'Продажа', icon: '🛒' },
  { id: 'other_in', label: 'Другое', icon: '💵' },
];

// Data loaded fresh per user after login — start empty
let data = { transactions: [], subscriptions: [] };
let settings = { initialBalance: 0, monthBudget: 0 };

// User-scoped localStorage helpers
function lsKey(key) {
  // Кэш отдельный для каждого пространства, иначе чужие операции перемешаются
  return `${spaceUid()}_${key}`;
}
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(lsKey(key)) || fallback); } catch (e) { return JSON.parse(fallback); }
}
function lsSet(key, val) {
  // Приватный режим и заблокированные куки бросают исключение
  try { localStorage.setItem(lsKey(key), JSON.stringify(val)); } catch (e) { /* без кэша */ }
}
let currentType = 'expense';
let currentCat = 'food';
let currentAccount = null;
let currentAccountTo = null;
let filterAccount = 'all';
let currentIncomeSource = 'salary';
let currentPeriod = 'month';
let filterCat = 'all';
let histPreset = 'all';
let compareMonthA = null;
let compareMonthB = null;
let selectedMonthForAnalytics = null;
let editingTxId = null;
let _justSignedIn = false;

function resetUserState() {
  data = { transactions: [], subscriptions: [] };
  goalsData = [];
  debtsData = [];
  _pendingReceiptPhoto = null;
  settings = { initialBalance: 0, monthBudget: 0 };
  _aiEndpoint = null;
  compareMonthA = compareMonthB = selectedMonthForAnalytics = null;
  currentAccount = currentAccountTo = null;
  filterAccount = 'all';
  hideUndo();
  if (multiselectMode) cancelMultiselect();
}

// ==============================
// ACCOUNTS
// ==============================
function normalizeAccounts(list) {
  return list.filter(a => a && typeof a === 'object').map((a, i) => ({
    id: String(a.id ?? '').replace(/[^\w-]/g, '') || 'acc_' + i,
    name: String(a.name ?? '').trim() || 'Счёт',
    icon: String(a.icon ?? '') || '💼',
    color: colorKey(a.color ?? ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]),
    initial: parseFloat(a.initial) || 0
  }));
}

// Returns true when the default accounts had to be created
// Everything derived from settings that the rest of the app depends on
function ensureSettings() {
  const created = ensureAccounts();
  rebuildCats();
  return created;
}

function ensureAccounts() {
  const had = Array.isArray(settings.accounts) && settings.accounts.length > 0;
  if (!had) {
    settings.accounts = DEFAULT_ACCOUNTS.map(a => ({ ...a }));
    // The old single "initial balance" becomes the cash account's starting sum
    if (settings.initialBalance) {
      settings.accounts[0].initial = settings.initialBalance;
      settings.initialBalance = 0;
    }
  } else {
    settings.accounts = normalizeAccounts(settings.accounts);
  }
  return !had;
}

function getAccounts() {
  if (!Array.isArray(settings.accounts) || !settings.accounts.length) ensureAccounts();
  return settings.accounts;
}

function getAccount(id) {
  const accs = getAccounts();
  const acc = accs.find(a => a.id === id) || accs[0];
  return { ...acc, color: themeColor(acc.color) };
}

function defaultAccountId() {
  const accs = getAccounts();
  return accs.some(a => a.id === settings.lastAccount) ? settings.lastAccount : accs[0].id;
}

function getAccountBalances() {
  const accs = getAccounts();
  const map = {};
  accs.forEach(a => { map[a.id] = a.initial || 0; });
  data.transactions.forEach(t => {
    const from = map.hasOwnProperty(t.account) ? t.account : accs[0].id;
    if (t.type === 'income') map[from] += t.amount;
    else if (t.type === 'transfer') {
      map[from] -= t.amount;
      if (map.hasOwnProperty(t.toAccount)) map[t.toAccount] += t.amount;
    } else map[from] -= t.amount;
  });
  return map;
}

function saveAccounts() {
  saveSettingsToFirestore();
  renderAccountsSettings();
  renderAccountChips();
  renderAccountFilterRow();
  refreshAll();
}

function updateAccount(id, field, value) {
  const acc = getAccounts().find(a => a.id === id);
  if (!acc) return;
  if (field === 'initial') acc.initial = parseFloat(value) || 0;
  else if (field === 'name') acc.name = String(value).trim() || acc.name;
  saveAccounts();
}

function cycleAccountIcon(id) {
  const acc = getAccounts().find(a => a.id === id);
  if (!acc) return;
  const i = ACCOUNT_ICONS.indexOf(acc.icon);
  acc.icon = ACCOUNT_ICONS[(i + 1) % ACCOUNT_ICONS.length];
  saveAccounts();
}

function addAccount() {
  const accs = getAccounts();
  accs.push({
    id: 'acc_' + Date.now().toString(36),
    name: 'Новый счёт',
    icon: ACCOUNT_ICONS[accs.length % ACCOUNT_ICONS.length],
    color: ACCOUNT_COLORS[accs.length % ACCOUNT_COLORS.length],
    initial: 0
  });
  saveAccounts();
  showToast('Счёт добавлен ✓', 'success');
}

function removeAccount(id) {
  const accs = getAccounts();
  if (accs.length < 2) { showToast('Нужен хотя бы один счёт', 'error'); return; }
  const acc = getAccount(id);
  const used = data.transactions.filter(t => t.account === id || t.toAccount === id);
  const target = accs.find(a => a.id !== id);
  openConfirm({
    icon: acc.icon,
    title: `Удалить счёт «${acc.name}»?`,
    text: used.length
      ? `${used.length} операц. будут перенесены на счёт «${target.name}»`
      : 'На счёте нет операций',
    okText: 'Удалить',
    onOk: () => {
      const changes = {};
      used.forEach(t => {
        if (t.account === id) t.account = target.id;
        if (t.toAccount === id) t.toAccount = target.id;
        // A transfer to itself makes no sense — turn it into a plain expense
        if (t.type === 'transfer' && t.account === t.toAccount) {
          t.type = 'expense';
          t.category = 'other';
          delete t.toAccount;
        }
        changes[t.id] = t;
      });
      settings.accounts = accs.filter(a => a.id !== id);
      if (currentAccount === id) currentAccount = null;
      if (currentAccountTo === id) currentAccountTo = null;
      if (filterAccount === id) filterAccount = 'all';
      if (Object.keys(changes).length) persistTx(changes);
      saveAccounts();
      renderHistory();
      showToast('Счёт удалён', 'error');
    }
  });
}

// ==============================
// CUSTOM CATEGORIES
// ==============================
function saveCats() {
  rebuildCats();
  saveSettingsToFirestore();
  renderCustomCats();
  renderCatGrid();
  renderFilterRow();
  refreshAll();
  if (document.getElementById('tab-plan').classList.contains('active')) renderPlanTab();
}

function addCategory() {
  if (!Array.isArray(settings.customCats)) settings.customCats = [];
  settings.customCats.push({
    id: 'c_' + Date.now().toString(36),
    label: 'Новая категория',
    icon: CAT_ICONS[settings.customCats.length % CAT_ICONS.length],
    color: CAT_COLORS[(BASE_CATS.length + settings.customCats.length) % CAT_COLORS.length]
  });
  saveCats();
  showToast('Категория добавлена ✓', 'success');
}

function updateCategory(id, field, value) {
  const cat = (settings.customCats || []).find(c => c.id === id);
  if (!cat) return;
  if (field === 'label') cat.label = String(value).trim() || cat.label;
  else if (field === 'icon') cat.icon = CAT_ICONS[(CAT_ICONS.indexOf(cat.icon) + 1) % CAT_ICONS.length];
  else if (field === 'color') cat.color = CAT_COLORS[(CAT_COLORS.indexOf(cat.color) + 1) % CAT_COLORS.length];
  saveCats();
}

function removeCategory(id) {
  const cat = getCat(id);
  const used = data.transactions.filter(t => t.category === id);
  openConfirm({
    icon: cat.icon,
    title: `Удалить категорию «${cat.label}»?`,
    text: used.length ? `${used.length} операц. перейдут в «Другое»` : 'Категория не используется',
    onOk: () => {
      const changes = {};
      used.forEach(t => { t.category = 'other'; changes[t.id] = t; });
      settings.customCats = (settings.customCats || []).filter(c => c.id !== id);
      if (settings.planCatBudgets) delete settings.planCatBudgets[id];
      if (currentCat === id) currentCat = 'food';
      if (filterCat === id) filterCat = 'all';
      if (Object.keys(changes).length) persistTx(changes);
      saveCats();
      renderHistory();
      showToast('Категория удалена', 'error');
    }
  });
}

function renderCustomCats() {
  const el = document.getElementById('customCatsList');
  if (!el) return;
  const custom = settings.customCats || [];
  if (!custom.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--text2)">Пока нет своих категорий</div>';
    return;
  }
  el.innerHTML = custom.map(c => `
    <div class="cat-edit-row">
      <button class="cat-edit-icon" style="background:${themeColor(c.color)}22" title="Сменить иконку"
        onclick="updateCategory('${c.id}','icon')">${escapeHtml(c.icon)}</button>
      <input class="cat-edit-name" value="${escapeHtml(c.label)}" onchange="updateCategory('${c.id}','label',this.value)">
      <button class="cat-edit-color" style="background:${themeColor(c.color)}" title="Сменить цвет"
        onclick="updateCategory('${c.id}','color')"></button>
      <button class="cat-edit-del" title="Удалить категорию" onclick="removeCategory('${c.id}')">${ic('close')}</button>
    </div>`).join('');
}

function renderAccountsSettings() {
  const el = document.getElementById('accountsSettingsList');
  if (!el) return;
  const accs = getAccounts();
  const balances = getAccountBalances();
  el.innerHTML = accs.map(a => `
    <div class="acc-row">
      <button class="acc-row-icon" style="background:${themeColor(a.color)}22" onclick="cycleAccountIcon('${a.id}')"
        title="Сменить иконку">${escapeHtml(a.icon)}</button>
      <div class="acc-row-main">
        <input class="acc-row-name" value="${escapeHtml(a.name)}" onchange="updateAccount('${a.id}','name',this.value)">
        <div class="acc-row-sub">Сейчас: <b style="color:${balanceColor(balances[a.id] || 0, a.color)}">${formatNum(balances[a.id] || 0)} ${CUR()}</b></div>
      </div>
      <input class="acc-row-initial field-input" type="number" inputmode="decimal" title="Начальная сумма"
        value="${a.initial || ''}" placeholder="старт" onchange="updateAccount('${a.id}','initial',this.value)">
      ${accs.length > 1 ? `<button class="acc-row-del" title="Удалить счёт" onclick="removeAccount('${a.id}')">${ic('close')}</button>` : ''}
    </div>`).join('');
}

function renderAccountsStrip() {
  const el = document.getElementById('accountsStrip');
  if (!el) return;
  const balances = getAccountBalances();
  el.innerHTML = getAccounts().map(a => `
    <button class="acc-pill" style="--acc-color:${themeColor(a.color)}" onclick="showAccountHistory('${a.id}')">
      <span class="acc-pill-icon">${escapeHtml(a.icon)}</span>
      <span class="acc-pill-name">${escapeHtml(a.name)}</span>
      <span class="acc-pill-val" style="color:${balanceColor(balances[a.id] || 0, a.color)}">${formatNum(balances[a.id] || 0)} ${CUR()}</span>
    </button>`).join('');
}

function showAccountHistory(id) {
  filterAccount = id;
  switchNav('history', null);
  renderAccountFilterRow();
  renderHistory();
}

function renderAccountFilterRow() {
  const row = document.getElementById('accountFilterRow');
  if (!row) return;
  const accs = getAccounts();
  row.innerHTML = '';
  const mk = (label, value, iconName) => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (filterAccount === value ? ' active' : '');
    if (iconName) btn.innerHTML = ic(iconName) + ' ' + escapeHtml(label);
    else btn.textContent = label;
    btn.onclick = () => {
      filterAccount = value;
      renderAccountFilterRow();
      renderHistory();
    };
    row.appendChild(btn);
  };
  mk('Все счета', 'all', 'wallet');
  accs.forEach(a => mk(a.icon + ' ' + a.name, a.id));
}

// Generic chip picker used for accounts in the add form and the edit modal
function renderChipPicker(containerId, items, selectedId, onSelect) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = '';
  items.forEach(it => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-chip' + (it.id === selectedId ? ' selected' : '');
    btn.innerHTML = `<span class="cat-icon">${escapeHtml(it.icon)}</span>${escapeHtml(it.name || it.label)}`;
    btn.onclick = () => onSelect(it.id);
    box.appendChild(btn);
  });
}

function renderAccountChips() {
  const accs = getAccounts();
  if (!accs.some(a => a.id === currentAccount)) currentAccount = defaultAccountId();
  if (!accs.some(a => a.id === currentAccountTo) || currentAccountTo === currentAccount) {
    currentAccountTo = (accs.find(a => a.id !== currentAccount) || accs[0]).id;
  }
  renderChipPicker('accountGrid', accs, currentAccount, id => {
    currentAccount = id;
    renderAccountChips();
  });
  renderChipPicker('accountToGrid', accs, currentAccountTo, id => {
    currentAccountTo = id;
    renderAccountChips();
  });
}

// ==============================
// INIT
// ==============================
// Auth handlers
async function handleSignIn() {
  document.getElementById('loginLoading').style.display = 'block';
  _justSignedIn = true;
  try {
    await window._fbSignIn();
  } catch (e) {
    document.getElementById('loginLoading').style.display = 'none';
    _justSignedIn = false;
    showToast('Ошибка входа: ' + e.message, 'error');
  }
}

async function handleSignOut() {
  document.getElementById('userMenu').classList.remove('show');
  // Unsubscribe from real-time listener
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
  await window._fbSignOut();
  currentUser = null;
  // Settings/theme of the previous account must not leak into the next one
  resetUserState();
  document.body.classList.remove('light');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  showToast('Вы вышли из аккаунта', 'success');
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (!menu.classList.contains('show')) {
    if (currentUser) {
      const avatar = document.getElementById('headerUserAvatar');
      if (avatar) avatar.src = currentUser.photoURL || AVATAR_FALLBACK;
      document.getElementById('userMenuName').textContent = currentUser.displayName || 'Пользователь';
      document.getElementById('userMenuEmail').textContent = currentUser.email || '';
    }
    document.getElementById('headerStatsTxs').textContent = data.transactions.length;
    
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const spentThisMonth = data.transactions
      .filter(t => t.date.startsWith(thisMonth) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
      
    document.getElementById('headerStatsSpent').textContent = formatNum(spentThisMonth) + ' ' + (typeof CUR === 'function' ? CUR() : 'сом');
  }
  menu.classList.toggle('show');
}

// Close user menu on outside click
document.addEventListener('click', e => {
  const menu = document.getElementById('userMenu');
  const avatar = document.getElementById('userAvatar');
  if (menu && !menu.contains(e.target) && e.target !== avatar) {
    menu.classList.remove('show');
  }
});

// Called when Firebase auth state changes
window._onAuthReady = async (user) => {
  // Always hide splash first — regardless of auth result
  const splash = document.getElementById('splashScreen');
  if (splash) { splash.style.display = 'none'; }

  if (user) {
    currentUser = user;
    document.getElementById('loginLoading').style.display = 'none';
    restoreSpace();
    resetUserState();
    loadCache();

    // Update avatar and user menu
    const avatar = document.getElementById('userAvatar');
    if (avatar && user.photoURL) {
      avatar.src = user.photoURL;
      avatar.style.display = 'block';
    }
    document.getElementById('userMenuName').textContent = user.displayName || 'Пользователь';
    document.getElementById('userMenuEmail').textContent = user.email || '';

    // Show app immediately (with cached data)
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Init UI right away with whatever is in cache
    initApp();

    // Then load fresh data from Firebase in background
    await loadFromDB();
    processSubscriptions();

    // Refresh UI with fresh data
    loadSettings();
    applyTheme();
    refreshAll();
    checkAlerts();
    loadShares();
    if (document.getElementById('tab-goals').classList.contains('active')) renderGoals();

    if (_justSignedIn) {
      _justSignedIn = false;
      const name = user.displayName ? user.displayName.split(' ')[0] : '';
      showToast(`Добро пожаловать${name ? ', ' + name : ''}! 👋`, 'success');
    }

    // Show currency selector only if not set AND first time (no transactions yet)
    if (!settings.currency) {
      setTimeout(() => {
        document.getElementById('currencyModal').style.display = 'flex';
      }, 800);
    }
  } else {
    // Not logged in — show login screen with animation
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    spawnCoins();
  }
};

function initApp() {
  // Reset AI text for new user session
  const aiEl = document.getElementById('aiText');
  if (aiEl) aiEl.textContent = 'Нажмите кнопку ниже, чтобы получить персональный анализ';
  // Сбрасываем адрес ИИ: у нового пользователя может быть другой ключ
  _aiEndpoint = null;
  hydrateIcons();
  updateOnlineState();
  renderCatGrid();
  renderSourceGrid();
  renderFilterRow();
  renderAccountChips();
  renderAccountFilterRow();
  renderDatePresets();
  previewQuickAdd();
  setType(currentType);
  setDateToday();
  loadSettings();
  refreshAll();
  setHeaderDate();
  updateGreeting();
  updateCurrencyUI();
  applyTheme();

  // Currency check happens after Firebase load in _onAuthReady
}

function init() {
  // Check every 500ms if Firebase auth resolved
  // If not resolved in 5s — show login screen
  let waited = 0;
  const check = setInterval(() => {
    waited += 500;
    const splash = document.getElementById('splashScreen');
    const stillShowing = splash && splash.style.display !== 'none';

    // If _onAuthReady already handled it — stop checking
    if (!stillShowing) { clearInterval(check); return; }

    // After 5s with no response — show login
    if (waited >= 3000 && !currentUser) {
      clearInterval(check);
      splash.style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
      spawnCoins();
      console.warn('Firebase auth timeout — showing login');
    }
  }, 500);
}

function setHeaderDate() {
  const now = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById('headerDate').textContent = now.toLocaleDateString('ru-RU', opts);
}

function setDateToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  document.getElementById('dateInput').value = `${y}-${m}-${day}`;
}

function loadSettings() {
  ensureSettings();
  renderCustomCats();
  renderNotifySettings();
  const mb = document.getElementById('monthBudget');
  if (mb) mb.value = settings.monthBudget || '';
  renderRollover();
  renderAccountsSettings();
  updateCurrencyUI();
  if (currentUser) {
    const el = document.getElementById('settingsName');
    const em = document.getElementById('settingsEmail');
    const av = document.getElementById('settingsAvatar');
    if (el) el.textContent = currentUser.displayName || 'Пользователь';
    if (em) em.textContent = currentUser.email || '';
    if (av) av.src = currentUser.photoURL || AVATAR_FALLBACK;

    // Populate profile stats
    const txsCount = document.getElementById('profileStatsTxs');
    if (txsCount) txsCount.textContent = data.transactions.length;

    const spentEl = document.getElementById('profileStatsSpent');
    if (spentEl) {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const spentThisMonth = data.transactions
        .filter(t => t.date.startsWith(thisMonth) && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      spentEl.textContent = formatNum(spentThisMonth) + ' ' + (settings.currency || 'сом');
    }
  }
}

function saveSettings() {
  const mb = document.getElementById('monthBudget');
  settings.monthBudget = parseFloat(mb ? mb.value : 0) || 0;
  // Debounce: oninput fires on every keystroke
  clearTimeout(_settingsSaveTimer);
  _settingsSaveTimer = setTimeout(saveSettingsToFirestore, 600);
  refreshAll();
}
let _settingsSaveTimer = null;

// ==============================
// NAVIGATION
// ==============================
let _currentNav = 'home';

function showTab(name, el) { switchNav(name, el); } // legacy alias

function switchNav(name, el) {
  _currentNav = name;
  // Switch tab content
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');

  if (multiselectMode) cancelMultiselect();
  hideUndo();
  window.scrollTo(0, 0);

  // Update bottom nav active state
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.more-item').forEach(b => b.classList.remove('active-more'));
  const primaryNavIds = ['home','history','analytics'];
  if (primaryNavIds.includes(name)) {
    const btn = document.getElementById('nav-' + name);
    if (btn) btn.classList.add('active');
  } else if (['plan','ai','goals','debts','settings'].includes(name)) {
    // Highlight "more" button when a secondary tab is active
    const moreBtn = document.getElementById('nav-more');
    if (moreBtn) moreBtn.classList.add('active');
    // Highlight the more-item
    document.querySelectorAll('.more-item').forEach(b => b.classList.remove('active-more'));
    const mi = document.getElementById('more-' + name);
    if (mi) mi.classList.add('active-more');
  }

  // Render content
  if (name === 'analytics') renderAnalytics();
  if (name === 'history') renderHistory();
  if (name === 'home') renderHome();
  if (name === 'goals') renderGoals();
  if (name === 'debts') renderDebts();
  if (name === 'ai') renderAiTab();
  if (name === 'plan') renderPlanTab();
}

function openMoreMenu() {
  document.getElementById('moreOverlay').classList.add('show');
  document.getElementById('moreDrawer').classList.add('show');
}

function closeMoreMenu() {
  document.getElementById('moreOverlay').classList.remove('show');
  document.getElementById('moreDrawer').classList.remove('show');
}

// ==============================
// MONTH DETAIL (Analytics)
// ==============================
let _detailMonth = null;

function showMonthDetail(monthKey) {
  _detailMonth = monthKey;
  const block = document.getElementById('monthDetailBlock');
  if (block) block.style.display = 'block';
  renderMonthDetail(monthKey);
  if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeMonthDetail() {
  _detailMonth = null;
  const block = document.getElementById('monthDetailBlock');
  if (block) block.style.display = 'none';
}

function renderMonthDetail(monthKey) {
  if (!monthKey) return;
  const MONTH_NAMES_FULL = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const [y, m] = monthKey.split('-');
  const label = MONTH_NAMES_FULL[parseInt(m)-1] + ' ' + y;

  document.getElementById('mdcTitle').textContent = label;

  // Month picker — last 12 months
  const months = new Set();
  data.transactions.forEach(t => months.add(t.date.slice(0,7)));
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    d.setMonth(d.getMonth()-1);
  }
  const sortedMonths = [...months].sort().reverse();
  const MNAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const picker = document.getElementById('mdcPicker');
  picker.innerHTML = sortedMonths.map(mk => {
    const [my, mm] = mk.split('-');
    return `<button class="mdc-pill${mk===monthKey?' active':''}" onclick="renderMonthDetail('${mk}');_detailMonth='${mk}';document.getElementById('mdcTitle').textContent='${MONTH_NAMES_FULL[parseInt(mm)-1]+' '+my}';document.querySelectorAll('.mdc-pill').forEach(p=>p.classList.remove('active'));this.classList.add('active')">${MNAMES[parseInt(mm)-1]} ${my}</button>`;
  }).join('');

  // Totals
  const txs = data.transactions.filter(t => t.date.startsWith(monthKey));
  const expenses = txs.filter(t => t.type==='expense');
  const incomes  = txs.filter(t => t.type==='income');
  const totalExp = expenses.reduce((s,t) => s+t.amount, 0);
  const totalInc = incomes.reduce((s,t) => s+t.amount, 0);
  const balance  = totalInc - totalExp;
  const cur = CUR();

  document.getElementById('mdcTotals').innerHTML = [
    { label:'Расходы', val: formatNum(totalExp)+' '+cur, color:'var(--accent2)' },
    { label:'Доходы',  val: formatNum(totalInc)+' '+cur, color:'var(--accent3)' },
    { label:'Итог',    val: (balance>=0?'+':'')+formatNum(balance)+' '+cur, color: balance>=0?'var(--accent3)':'var(--accent2)' }
  ].map(c => `<div class="mdc-total">
      <div class="mdc-total-label">${c.label}</div>
      <div class="mdc-total-val" style="color:${c.color}">${c.val}</div>
    </div>`).join('');

  // Category bars
  const byCat = {};
  expenses.forEach(t => { byCat[t.category] = (byCat[t.category]||0) + t.amount; });
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const bars = document.getElementById('mdcCatBars');
  if (!sorted.length) { bars.innerHTML = '<div style="color:var(--text2);font-size:13px;padding:8px 0">Нет расходов за этот месяц</div>'; return; }
  bars.innerHTML = sorted.map(([catId, val]) => {
    const cat = getCat(catId);
    const pct = Math.round(val/totalExp*100);
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:600">${cat.icon} ${cat.label}</span>
        <span style="font-size:12px;color:var(--text2)">${formatNum(val)} ${cur} · ${pct}%</span>
      </div>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${cat.color}"></div></div>
    </div>`;
  }).join('');
}

// ==============================
// CATEGORIES
// ==============================
function renderCatGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = '';
  CATS.filter(c => c.id !== 'income').forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-chip' + (cat.id === currentCat ? ' selected' : '');
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => selectCat(cat.id);
    grid.appendChild(btn);
  });
}

function renderSourceGrid() {
  const grid = document.getElementById('sourceGrid');
  if (!grid) return;
  grid.innerHTML = '';
  INCOME_SOURCES.forEach(src => {
    const btn = document.createElement('button');
    btn.className = 'cat-chip' + (src.id === currentIncomeSource ? ' selected' : '');
    btn.innerHTML = `<span class="cat-icon">${src.icon}</span>${src.label}`;
    btn.onclick = () => {
      currentIncomeSource = src.id;
      renderSourceGrid();
    };
    grid.appendChild(btn);
  });
}

function selectCat(id) {
  currentCat = id;
  renderCatGrid();
}

function setType(type) {
  currentType = type;
  const isTransfer = type === 'transfer';
  document.getElementById('typeExpense').classList.toggle('selected', type === 'expense');
  document.getElementById('typeIncome').classList.toggle('selected', type === 'income');
  document.getElementById('typeTransfer').classList.toggle('selected', isTransfer);
  document.getElementById('expenseFields').style.display = type === 'expense' ? '' : 'none';
  document.getElementById('incomeFields').style.display = type === 'income' ? '' : 'none';
  document.getElementById('accountToField').style.display = isTransfer ? '' : 'none';
  document.getElementById('accountLabel').textContent = isTransfer ? 'Откуда' : 'Счёт';
  document.getElementById('submitBtn').textContent =
    isTransfer ? 'Перевести' : type === 'income' ? 'Добавить доход' : 'Добавить запись';
  renderAccountChips();
}

function renderFilterRow() {
  const row = document.getElementById('filterRow');
  row.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'filter-chip active';
  all.textContent = 'Все';
  all.onclick = () => { filterCat = 'all'; setActiveFilter(all); renderHistory(); };
  row.appendChild(all);
  CATS.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.textContent = cat.icon + ' ' + cat.label;
    btn.onclick = () => { filterCat = cat.id; setActiveFilter(btn); renderHistory(); };
    row.appendChild(btn);
  });
}

function setActiveFilter(el) {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ==============================
// ADD TRANSACTION
// ==============================
function addAmount(n) {
  const inp = document.getElementById('amountInput');
  inp.value = (parseFloat(inp.value) || 0) + n;
  inp.focus();
}

async function addTransaction() {
  const amount = parseFloat(document.getElementById('amountInput').value);
  const isIncome = currentType === 'income';
  const isTransfer = currentType === 'transfer';
  let name = isIncome
    ? document.getElementById('incomeNameInput').value.trim()
    : document.getElementById('nameInput').value.trim();
  const date = document.getElementById('dateInput').value;
  const note = document.getElementById('noteInput').value.trim();

  if (!(amount > 0) || !isFinite(amount)) { showToast('Введите сумму ❌', 'error'); return; }
  if (isTransfer) {
    if (currentAccount === currentAccountTo) { showToast('Выберите разные счета ❌', 'error'); return; }
    if (!name) name = `${getAccount(currentAccount).name} → ${getAccount(currentAccountTo).name}`;
  } else if (!name) {
    showToast(isIncome ? 'Укажите источник дохода ❌' : 'Введите название ❌', 'error');
    return;
  }

  if (!isDateKey(date)) { showToast('Укажите дату ❌', 'error'); return; }

  const cat = isTransfer ? 'transfer' : isIncome ? 'income' : currentCat;
  const tx = normalizeTx({
    id: newId(),
    date, name, amount,
    category: cat,
    type: currentType,
    account: currentAccount,
    toAccount: isTransfer ? currentAccountTo : undefined,
    incomeSource: isIncome ? currentIncomeSource : undefined,
    note
  });

  settings.lastAccount = currentAccount;
  saveSettingsToFirestore();

  if (_pendingReceiptPhoto) {
    tx.photo = 1;
    saveReceiptPhoto(tx.id, _pendingReceiptPhoto);
    dropPendingReceipt();
  }

  data.transactions.unshift(tx);
  persistTx({ [tx.id]: tx });
  refreshAll();


  // Reset form
  document.getElementById('amountInput').value = '';
  document.getElementById('nameInput').value = '';
  document.getElementById('incomeNameInput').value = '';
  document.getElementById('noteInput').value = '';
  setDateToday();
  showToast(isTransfer ? 'Перевод выполнен ✓' : isIncome ? 'Доход добавлен! ✓' : 'Добавлено! ✓', 'success');
  switchNav('home', null);
}

// ==============================
// QUICK ADD (text / voice / receipt photo)
// ==============================
const CAT_KEYWORDS = {
  food: ['еда', 'обед', 'ужин', 'завтрак', 'кафе', 'ресторан', 'продукт', 'магазин', 'хлеб', 'кофе', 'чай', 'шаурма', 'пицц', 'сомса'],
  car: ['бензин', 'топлив', 'заправ', 'такси', 'машин', 'авто', 'шином', 'парков', 'мойка'],
  fun: ['кино', 'игр', 'развлеч', 'бар', 'клуб', 'концерт', 'подписк', 'нетфликс'],
  health: ['аптек', 'врач', 'лекарств', 'больниц', 'стомат', 'анализ', 'зуб'],
  gift: ['подар', 'цвет', 'свадьб', 'день рожден'],
  credit: ['кредит', 'ипотек', 'рассрочк', 'займ'],
  debt: ['долг', 'занял', 'одолжил', 'взаймы'],
  home: ['дом', 'аренд', 'квартир', 'свет', 'газ', 'вода', 'интернет', 'коммунал', 'ремонт'],
  cloth: ['одежд', 'обув', 'куртк', 'джинс', 'футболк', 'кроссов', 'плать'],
  savings: ['накоплен', 'отложи', 'сбереж', 'копилк']
};
const INCOME_WORDS = ['зарплат', 'аванс', 'преми', 'доход', 'получил', 'перевели', 'продал', 'выплат', 'кешбэк', 'кэшбэк'];

// Built-in keywords first, then the names of the user's own categories
function guessCategory(text) {
  const lower = String(text || '').toLowerCase();
  const hit = Object.entries(CAT_KEYWORDS).find(([, words]) => words.some(w => lower.includes(w)));
  if (hit) return hit[0];
  const own = (settings.customCats || []).find(c => c.label && lower.includes(c.label.toLowerCase()));
  return own ? own.id : 'other';
}

// "обед 45" / "+зарплата 5000" -> {amount, name, category, type}
function parseQuickAdd(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const m = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const amount = Math.abs(parseFloat(m[1].replace(',', '.')));
  if (!(amount > 0) || !isFinite(amount)) return null;

  let name = (text.slice(0, m.index) + ' ' + text.slice(m.index + m[1].length)).replace(/\s+/g, ' ').trim();
  const lower = name.toLowerCase();
  const isIncome = text.trim().startsWith('+') || INCOME_WORDS.some(w => lower.includes(w));
  name = name.replace(/^\+\s*/, '').trim();

  const category = isIncome ? 'income' : guessCategory(lower);
  return {
    amount,
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : (isIncome ? 'Доход' : 'Расход'),
    category,
    type: isIncome ? 'income' : 'expense'
  };
}

function previewQuickAdd() {
  const hint = document.getElementById('quickAddHint');
  const input = document.getElementById('quickAddInput');
  if (!hint || !input) return;
  const parsed = parseQuickAdd(input.value);
  if (!input.value.trim()) {
    hint.innerHTML = 'Быстрый ввод: «такси 30», «+зарплата 5000». Enter — добавить.';
    return;
  }
  if (!parsed) {
    hint.innerHTML = 'Не вижу сумму — например <b>обед 45</b>';
    return;
  }
  const cat = getCat(parsed.category);
  const acc = getAccount(defaultAccountId());
  hint.innerHTML = `${cat.icon} <b>${escapeHtml(parsed.name)}</b> · ${cat.label} · ` +
    `<b style="color:${parsed.type === 'income' ? 'var(--accent3)' : 'var(--accent2)'}">` +
    `${parsed.type === 'income' ? '+' : '−'}${formatNum(parsed.amount)} ${CUR()}</b> · ${acc.icon} ${escapeHtml(acc.name)}`;
}

function submitQuickAdd() {
  const input = document.getElementById('quickAddInput');
  const parsed = parseQuickAdd(input.value);
  if (!parsed) { showToast('Не понял сумму — например «обед 45» ❌', 'error'); return; }

  const tx = normalizeTx({
    id: newId(),
    date: dateKey(),
    name: parsed.name,
    amount: parsed.amount,
    type: parsed.type,
    category: parsed.category,
    account: defaultAccountId(),
    note: ''
  });
  data.transactions.unshift(tx);
  persistTx({ [tx.id]: tx });
  refreshAll();
  renderHistory();

  input.value = '';
  previewQuickAdd();
  const cat = getCat(tx.category);
  showToast(`${cat.icon} ${tx.name} · ${formatNum(tx.amount)} ${CUR()} ✓`, 'success');
}

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Голосовой ввод не поддерживается браузером', 'error'); return; }
  const btn = document.getElementById('micBtn');
  const rec = new SR();
  rec.lang = 'ru-RU';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = e => {
    const input = document.getElementById('quickAddInput');
    input.value = e.results[0][0].transcript;
    previewQuickAdd();
    input.focus();
  };
  rec.onerror = e => showToast('Не расслышал: ' + e.error, 'error');
  rec.onend = () => btn.classList.remove('listening');
  try {
    rec.start();
    btn.classList.add('listening');
    showToast('Говорите… 🎙', 'success');
  } catch (e) {
    btn.classList.remove('listening');
  }
}

// A live QR scanner needs BarcodeDetector (Chrome only) and a fiscal QR printed
// on the receipt. A photo works in every browser: the file input opens the
// camera or the gallery, and a vision model reads the total, date and shop.

let _receiptBusy = false;
let _receiptCancelled = false;

function pickReceipt() {
  const input = document.getElementById('receiptFile');
  if (!input) return;
  input.value = '';   // picking the same photo twice must still fire change
  input.click();
}

// Phone photos are 3-8 MB; the model only needs the text to stay legible
function fileToCompressedDataUrl(file, maxSide = 1400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть фото')); };
    img.src = url;
  });
}

function closeReceiptScan() {
  _receiptCancelled = true;
  const overlay = document.getElementById('scannerOverlay');
  if (overlay) overlay.classList.remove('show');
  const preview = document.getElementById('receiptPreview');
  if (preview) preview.removeAttribute('src');
}

function receiptStatus(text) {
  const hint = document.getElementById('scannerHint');
  if (hint) hint.textContent = text;
}

async function handleReceiptFile(input) {
  const file = input && input.files && input.files[0];
  if (!file || _receiptBusy) return;
  if (!/^image\//.test(file.type)) { showToast('Нужно фото чека', 'error'); return; }
  _receiptBusy = true;
  _receiptCancelled = false;
  try {
    const dataUrl = await fileToCompressedDataUrl(file);
    if (_receiptCancelled) return;
    const preview = document.getElementById('receiptPreview');
    if (preview) preview.src = dataUrl;
    const overlay = document.getElementById('scannerOverlay');
    if (overlay) overlay.classList.add('show');
    receiptStatus('Читаю чек…');

    const answer = await readReceiptPhoto(dataUrl);
    if (_receiptCancelled) return;
    // Снимок для хранения мельче того, что ушёл в модель
    const stored = await fileToCompressedDataUrl(file, 900, 0.55).catch(() => null);
    const parsed = parseReceiptJson(answer);
    if (!parsed) {
      showToast('Не разобрал чек — впишите вручную', 'error');
      switchNav('add', null);
      return;
    }
    applyReceiptData(parsed);
    if (stored) showPendingReceipt(stored);
  } catch (e) {
    if (!_receiptCancelled) showToast(receiptErrorText(e), 'error');
  } finally {
    _receiptBusy = false;
    closeReceiptScan();
  }
}

function receiptErrorText(e) {
  const msg = (e && e.message) || '';
  if (!navigator.onLine) return 'Нет интернета — чек не прочитать';
  if (/ключ/i.test(msg)) return msg;
  return 'Не получилось прочитать чек: ' + (msg || 'ошибка сети');
}

async function readReceiptPhoto(dataUrl) {
  const cats = CATS.filter(c => c.id !== 'income').map(c => c.id + ' — ' + c.label).join(', ');
  const prompt =
    'На фото кассовый чек. Верни ТОЛЬКО JSON, без пояснений и markdown:\n' +
    '{"amount": число, "date": "ГГГГ-ММ-ДД", "name": "строка", "category": "строка"}\n' +
    'amount — итоговая сумма к оплате (строка ИТОГО / ВСЕГО / К ОПЛАТЕ), точка как разделитель, без пробелов.\n' +
    'date — дата чека. name — магазин или главный товар, 1-3 слова.\n' +
    'category — один id из списка: ' + cats + '\n' +
    'Если чего-то не видно на фото — поставь null.';

  return aiComplete('vision', [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: dataUrl } }
    ]
  }], 300, 0);
}

// The model sometimes wraps the JSON in a sentence or a code fence
function parseReceiptJson(text) {
  const raw = String(text || '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let obj;
  try { obj = JSON.parse(raw.slice(start, end + 1)); } catch (e) { return null; }
  if (!obj || typeof obj !== 'object') return null;

  const amount = Math.abs(parseFloat(String(obj.amount ?? '').replace(/[\s\u00a0]/g, '').replace(',', '.')));
  if (!(amount > 0) || !isFinite(amount)) return null;

  const date = isDateKey(obj.date) ? obj.date : dateKey();
  let name = String(obj.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!name || name.toLowerCase() === 'null') name = 'Покупка по чеку';
  const category = CATS.some(c => c.id === obj.category && c.id !== 'income')
    ? obj.category
    : guessCategory(name);
  return { amount, date, name, category };
}

// Never saves on its own: the form opens filled in so the user can check it
function applyReceiptData(receipt) {
  switchNav('add', null);
  setType('expense');
  selectCat(receipt.category);
  document.getElementById('amountInput').value = receipt.amount;
  document.getElementById('dateInput').value = receipt.date;
  document.getElementById('nameInput').value = receipt.name;
  document.getElementById('noteInput').value = 'Распознано с фото чека';
  showToast(receipt.name + ' · ' + formatNum(receipt.amount) + ' ' + CUR() + ' — проверьте и сохраните', 'success');
}

// ==============================
// DEBTS
// ==============================
// Долг — не расход: деньги ушли, но их обещали вернуть. Поэтому долг живёт
// отдельным списком, а движение денег идёт обычной операцией по счёту.
let debtType = 'lent';

function saveDebtsData() {
  lsSet('debts_data', debtsData);
  if (currentUser && window._fbSet) {
    window._fbSet(window._fbRef(window._fbDb, userPath('debts')), debtsData || [])
      .catch(e => console.warn('RTDB debts save error:', e));
  }
}

function setDebtType(type) {
  debtType = type === 'borrowed' ? 'borrowed' : 'lent';
  const lent = document.getElementById('debtTypeLent');
  const borrowed = document.getElementById('debtTypeBorrowed');
  if (lent) lent.classList.toggle('selected', debtType === 'lent');
  if (borrowed) borrowed.classList.toggle('selected', debtType === 'borrowed');
  const label = document.getElementById('debtPersonLabel');
  if (label) label.textContent = debtType === 'lent' ? 'Кому дали' : 'У кого взяли';
}

function accountOptions(selected) {
  return getAccounts().map(a =>
    `<option value="${a.id}"${a.id === (selected || defaultAccountId()) ? ' selected' : ''}>${escapeHtml(a.icon + ' ' + a.name)}</option>`
  ).join('');
}

function openDebtForm() {
  const card = document.getElementById('debtFormCard');
  if (!card) return;
  const acc = document.getElementById('debtAccount');
  if (acc) acc.innerHTML = accountOptions();
  setDebtType('lent');
  card.style.display = '';
  card.scrollIntoView({ behavior: 'smooth' });
}

function debtLeft(debt) {
  return Math.max(Number(debt.amount) - Number(debt.returned || 0), 0);
}

// Сколько дней осталось до возврата: отрицательное — просрочено
function daysUntil(key) {
  if (!isDateKey(key)) return null;
  const today = parseDateKey(dateKey());
  return Math.round((parseDateKey(key) - today) / 86400000);
}

function debtTx(debt, amount, type, accountId, title) {
  const tx = normalizeTx({
    id: newId(),
    date: dateKey(),
    name: title + ': ' + debt.person,
    amount,
    type,
    category: type === 'expense' ? 'debt' : 'income',
    account: accountId || debt.account || defaultAccountId(),
    note: '🤝',
    debtId: debt.id
  });
  if (!tx) return;
  data.transactions.unshift(tx);
  persistTx({ [tx.id]: tx });
}

function saveNewDebt() {
  const person = document.getElementById('debtPerson').value.trim();
  const amount = Math.abs(parseFloat(document.getElementById('debtAmount').value));
  const due = document.getElementById('debtDue').value;
  const accSelect = document.getElementById('debtAccount');
  const account = accSelect && accSelect.value ? accSelect.value : defaultAccountId();

  if (!person) { showToast('Укажите имя ❌', 'error'); return; }
  if (!(amount > 0) || !isFinite(amount)) { showToast('Введите сумму ❌', 'error'); return; }

  const debt = {
    id: 'debt_' + Date.now().toString(36),
    type: debtType,
    person: person.slice(0, 40),
    amount,
    returned: 0,
    date: dateKey(),
    due: isDateKey(due) ? due : '',
    account
  };
  debtsData.unshift(debt);
  saveDebtsData();
  debtTx(debt, amount, debt.type === 'lent' ? 'expense' : 'income', account,
    debt.type === 'lent' ? 'В долг' : 'Занял у');

  document.getElementById('debtPerson').value = '';
  document.getElementById('debtAmount').value = '';
  document.getElementById('debtDue').value = '';
  document.getElementById('debtFormCard').style.display = 'none';
  setDebtType('lent');
  renderDebts();
  refreshAll();
  renderHistory();
  showToast(debt.type === 'lent' ? 'Записал: вам должны' : 'Записал: вы должны', 'success');
}

// Пустое поле суммы = вернули всё
function repayDebt(id) {
  const debt = debtsData.find(d => d.id === id);
  if (!debt) return;
  const left = debtLeft(debt);
  if (left <= 0) return;

  const input = document.getElementById('rep-' + id);
  let amount = parseFloat(input && input.value);
  if (!(amount > 0) || !isFinite(amount)) amount = left;
  amount = Math.min(amount, left);

  debt.returned = Number(debt.returned || 0) + amount;
  if (debtLeft(debt) < 0.005) {
    debt.returned = debt.amount;
    debt.closed = dateKey();
  }
  saveDebtsData();

  const accSelect = document.getElementById('repacc-' + id);
  debtTx(debt, amount, debt.type === 'lent' ? 'income' : 'expense',
    accSelect && accSelect.value, debt.type === 'lent' ? 'Вернул долг' : 'Отдал долг');

  renderDebts();
  refreshAll();
  renderHistory();
  showToast(debt.closed
    ? (debt.type === 'lent' ? 'Долг закрыт ✓' : 'Рассчитались ✓')
    : `${formatNum(amount)} ${CUR()} — осталось ${formatNum(debtLeft(debt))}`, 'success');
}

function deleteDebt(id) {
  const debt = debtsData.find(d => d.id === id);
  if (!debt) return;
  openConfirm({
    icon: 'trash',
    title: 'Убрать долг из списка?',
    text: 'Операции по счёту останутся — деньги ведь правда двигались.',
    okText: 'Убрать',
    onOk: () => {
      debtsData = debtsData.filter(d => d.id !== id);
      saveDebtsData();
      renderDebts();
      showToast('Долг убран', 'error');
    }
  });
}

function renderDebts() {
  const list = document.getElementById('debtsList');
  if (!list) return;
  const cur = CUR();
  const open = debtsData.filter(d => !d.closed);
  const owedToMe = open.filter(d => d.type === 'lent').reduce((s, d) => s + debtLeft(d), 0);
  const iOwe = open.filter(d => d.type === 'borrowed').reduce((s, d) => s + debtLeft(d), 0);

  const totals = document.getElementById('debtTotals');
  if (totals) {
    totals.innerHTML = `
      <div class="debt-total-card">
        <div class="debt-total-label">Мне должны</div>
        <div class="debt-total-value" style="color:var(--accent3)">${formatNum(owedToMe)} ${cur}</div>
      </div>
      <div class="debt-total-card">
        <div class="debt-total-label">Я должен</div>
        <div class="debt-total-value" style="color:var(--accent2)">${formatNum(iOwe)} ${cur}</div>
      </div>`;
  }

  if (!debtsData.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">🤝</div><p>Долгов нет</p>' +
      '<p style="font-size:12px;color:var(--text2)">Записывайте, кому дали и у кого взяли — сумма спишется со счёта</p></div>';
    return;
  }

  // Открытые сверху, закрытые в конце
  const sorted = [...debtsData].sort((a, b) =>
    (a.closed ? 1 : 0) - (b.closed ? 1 : 0) || String(b.date).localeCompare(String(a.date)));

  list.innerHTML = sorted.map(d => {
    const left = debtLeft(d);
    const lent = d.type === 'lent';
    const color = lent ? 'var(--accent3)' : 'var(--accent2)';
    const days = d.closed ? null : daysUntil(d.due);
    let due = '';
    if (days !== null && days !== undefined) {
      due = days < 0
        ? ` · <span class="debt-due-late">просрочено на ${Math.abs(days)} дн.</span>`
        : days === 0 ? ' · <span class="debt-due-late">вернуть сегодня</span>'
          : ` · вернуть через ${days} дн.`;
    }
    const partial = d.returned > 0 && !d.closed ? ` · вернули ${formatNum(d.returned)} из ${formatNum(d.amount)}` : '';

    return `<div class="debt-card${d.closed ? ' closed' : ''}">
  <div class="debt-head">
    <span class="debt-person">${lent ? '→' : '←'} ${escapeHtml(d.person)}</span>
    <span class="debt-amount" style="color:${color}">${formatNum(d.closed ? d.amount : left)} ${cur}</span>
    <button class="debt-del" title="Убрать" onclick="deleteDebt('${d.id}')">${ic('trash')}</button>
  </div>
  <div class="debt-meta">${d.closed
      ? `закрыт ${escapeHtml(d.closed)}`
      : `${lent ? 'дали' : 'взяли'} ${escapeHtml(d.date)}${partial}${due}`}</div>
  ${d.closed ? '' : `<div class="debt-repay-row">
    <input class="field-input" type="number" inputmode="decimal" id="rep-${d.id}" placeholder="Всё (${formatNum(left)})">
    <select class="field-input" id="repacc-${d.id}">${accountOptions(d.account)}</select>
    <button class="debt-repay-btn" onclick="repayDebt('${d.id}')">${lent ? 'Вернули' : 'Отдал'}</button>
  </div>`}
</div>`;
  }).join('');
}

// ---- фото чека хранится отдельно от операции ------------------------
// В transactions лежит только флаг photo: иначе каждая синхронизация тянула бы
// все снимки разом. Сам снимок — в receipts/<id>, читается по требованию.
let _pendingReceiptPhoto = null;

function receiptPath(txId) {
  return userPath('receipts/' + String(txId).replace(/[^\w-]/g, ''));
}

async function saveReceiptPhoto(txId, dataUrl) {
  lsSet('receipt_' + txId, dataUrl);
  if (!currentUser || !window._fbSet) return;
  try {
    await window._fbSet(window._fbRef(window._fbDb, receiptPath(txId)), dataUrl);
  } catch (e) {
    console.warn('RTDB receipt save error:', e);
  }
}

async function loadReceiptPhoto(txId) {
  const cached = lsGet('receipt_' + txId, 'null');
  if (typeof cached === 'string' && cached) return cached;
  if (!currentUser || !window._fbGet) return null;
  try {
    const snap = await window._fbGet(window._fbRef(window._fbDb, receiptPath(txId)));
    const val = snap.exists() ? snap.val() : null;
    if (val) lsSet('receipt_' + txId, val);
    return val;
  } catch (e) {
    console.warn('RTDB receipt load error:', e);
    return null;
  }
}

function forgetReceipts(txs) {
  (txs || []).filter(t => t && t.photo).forEach(t => {
    try { localStorage.removeItem(lsKey('receipt_' + t.id)); } catch (e) { /* приватный режим */ }
    if (currentUser && window._fbSet) {
      window._fbSet(window._fbRef(window._fbDb, receiptPath(t.id)), null).catch(() => {});
    }
  });
}

function showPendingReceipt(dataUrl) {
  _pendingReceiptPhoto = dataUrl;
  const chip = document.getElementById('receiptChip');
  const img = document.getElementById('receiptChipImg');
  if (img) img.src = dataUrl;
  if (chip) chip.style.display = dataUrl ? 'flex' : 'none';
}

function dropPendingReceipt() {
  _pendingReceiptPhoto = null;
  const chip = document.getElementById('receiptChip');
  if (chip) chip.style.display = 'none';
  const img = document.getElementById('receiptChipImg');
  if (img) img.removeAttribute('src');
}

// ---- прикрепить снимок к уже сохранённой операции -------------------
async function attachReceiptToTx(input) {
  const file = input && input.files && input.files[0];
  if (!file || !editingTxId) return;
  input.value = '';
  if (!/^image\//.test(file.type)) { showToast('Нужно фото', 'error'); return; }
  const tx = data.transactions.find(t => t.id === editingTxId);
  if (!tx) return;
  try {
    const dataUrl = await fileToCompressedDataUrl(file, 900, 0.55);
    await saveReceiptPhoto(tx.id, dataUrl);
    tx.photo = 1;
    persistTx({ [tx.id]: tx });
    renderEditPhoto(dataUrl);
    renderHistory();
    showToast('Чек прикреплён ✓', 'success');
  } catch (e) {
    showToast('Не получилось прикрепить фото', 'error');
  }
}

function renderEditPhoto(dataUrl) {
  const img = document.getElementById('editPhotoImg');
  const add = document.getElementById('editPhotoAdd');
  const del = document.getElementById('editPhotoDel');
  if (!img || !add || !del) return;
  if (dataUrl) {
    img.src = dataUrl;
    img.style.display = '';
    add.style.display = 'none';
    del.style.display = '';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    add.style.display = '';
    del.style.display = 'none';
  }
}

function removeReceiptPhoto() {
  const tx = data.transactions.find(t => t.id === editingTxId);
  if (!tx) return;
  forgetReceipts([{ id: tx.id, photo: 1 }]);
  delete tx.photo;
  persistTx({ [tx.id]: tx });
  renderEditPhoto(null);
  renderHistory();
  showToast('Фото убрано', 'error');
}

// ==============================
// SHARED ACCESS
// ==============================
// Приглашённый человек работает в чужом пространстве: меняется только путь
// в базе (userPath) и ключ кэша (lsKey). Вход и аккаунт остаются своими.
let activeSpaceUid = null;
let shareSpaces = [];    // куда меня пригласили: [{ uid, name, email }]
let shareMembers = [];   // кого я пригласил: [{ uid, since }]

function ownUid() {
  return currentUser ? currentUser.uid : '';
}

function spaceStorageKey() {
  return 'active_space_' + ownUid();
}

function rememberSpace(uid) {
  try {
    if (uid) localStorage.setItem(spaceStorageKey(), uid);
    else localStorage.removeItem(spaceStorageKey());
  } catch (e) { /* без кэша */ }
}

function restoreSpace() {
  try {
    const saved = localStorage.getItem(spaceStorageKey());
    activeSpaceUid = saved && saved !== ownUid() ? saved : null;
  } catch (e) {
    activeSpaceUid = null;
  }
}

function copyShareCode() {
  const code = ownUid();
  if (!code) return;
  navigator.clipboard?.writeText(code)
    .then(() => showToast('Код скопирован ✓', 'success'))
    .catch(() => showToast(code, 'success'));
}

// Список приглашений лежит в shares/<мой uid> — его пишет тот, кто приглашает
async function loadShares() {
  shareSpaces = [];
  shareMembers = [];
  if (!currentUser || !window._fbGet) return;
  try {
    const snap = await window._fbGet(window._fbRef(window._fbDb, 'shares/' + ownUid()));
    if (snap.exists() && snap.val()) {
      shareSpaces = Object.entries(snap.val())
        .filter(([uid, v]) => uid && v)
        .map(([uid, v]) => ({ uid, name: (v && v.name) || 'Общий бюджет', email: (v && v.email) || '' }));
    }
  } catch (e) {
    console.warn('shares load error:', e);
  }
  try {
    const mine = await window._fbGet(window._fbRef(window._fbDb, `users/${ownUid()}/members`));
    if (mine.exists() && mine.val()) {
      shareMembers = Object.entries(mine.val())
        .filter(([uid, v]) => uid && v)
        .map(([uid, v]) => ({ uid, name: (v && v.name) || '', since: (v && v.since) || '' }));
    }
  } catch (e) {
    console.warn('members load error:', e);
  }
  renderShareSettings();
}

async function addShareMember() {
  const input = document.getElementById('shareCodeInput');
  const uid = (input.value || '').trim();
  if (!uid) { showToast('Вставьте код ❌', 'error'); return; }
  if (uid === ownUid()) { showToast('Это ваш собственный код', 'error'); return; }
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) { showToast('Код выглядит неправильно ❌', 'error'); return; }
  if (activeSpaceUid) { showToast('Сначала вернитесь в свой бюджет', 'error'); return; }
  if (!window._fbSet) { showToast('Нет связи с базой', 'error'); return; }

  const member = { name: '', since: dateKey() };
  try {
    // Кому я открыл доступ
    await window._fbSet(window._fbRef(window._fbDb, `users/${ownUid()}/members/${uid}`), member);
    // Приглашение, которое он увидит у себя
    await window._fbSet(window._fbRef(window._fbDb, `shares/${uid}/${ownUid()}`), {
      name: currentUser.displayName || 'Общий бюджет',
      email: currentUser.email || ''
    });
  } catch (e) {
    showToast('Не вышло: проверьте правила базы', 'error');
    console.warn('share add error:', e);
    return;
  }
  shareMembers.push({ uid, name: '', since: member.since });
  input.value = '';
  renderShareSettings();
  showToast('Доступ открыт ✓', 'success');
}

function removeShareMember(uid) {
  openConfirm({
    icon: 'trash',
    title: 'Закрыть доступ?',
    text: 'Человек перестанет видеть ваши операции.',
    okText: 'Закрыть',
    onOk: async () => {
      try {
        await window._fbSet(window._fbRef(window._fbDb, `users/${ownUid()}/members/${uid}`), null);
        await window._fbSet(window._fbRef(window._fbDb, `shares/${uid}/${ownUid()}`), null);
      } catch (e) {
        console.warn('share remove error:', e);
      }
      shareMembers = shareMembers.filter(m => m.uid !== uid);
      renderShareSettings();
      showToast('Доступ закрыт', 'error');
    }
  });
}

// Переключение пространства — это полная перезагрузка данных
async function switchSpace(uid) {
  const target = uid === ownUid() ? null : uid;
  if (target === activeSpaceUid) return;

  if (target) {
    // Проверяем доступ заранее: иначе приложение молча показало бы пустой бюджет
    try {
      await window._fbGet(window._fbRef(window._fbDb, `users/${target}/settings`));
    } catch (e) {
      showToast('Нет доступа. Обновите правила базы — см. README', 'error');
      console.warn('space check failed:', e);
      return;
    }
  }

  activeSpaceUid = target;
  rememberSpace(target);
  resetUserState();
  loadCache();
  initApp();
  await loadFromDB();
  loadSettings();
  applyTheme();
  refreshAll();
  renderHistory();
  renderShareSettings();
  showToast(target ? 'Открыт общий бюджет' : 'Вернулись в свой бюджет', 'success');
}

function renderShareSettings() {
  const code = document.getElementById('myShareCode');
  if (code) code.textContent = ownUid() ? ownUid().slice(0, 10) + '…' : '—';

  const members = document.getElementById('shareMembers');
  if (members) {
    members.innerHTML = shareMembers.length
      ? '<div class="settings-hint" style="margin:14px 0 0">Вы открыли доступ:</div>' + shareMembers.map(m => `
        <div class="share-row">
          <span class="share-name">${escapeHtml(m.uid.slice(0, 12))}…<div class="share-sub">${escapeHtml(m.since || '')}</div></span>
          <button onclick="removeShareMember('${escapeHtml(m.uid)}')">Закрыть</button>
        </div>`).join('')
      : '';
  }

  const spaces = document.getElementById('shareSpaces');
  if (!spaces) return;
  if (!shareSpaces.length) { spaces.innerHTML = ''; return; }
  const rows = [{ uid: ownUid(), name: 'Мой бюджет', email: '' }].concat(shareSpaces);
  spaces.innerHTML = '<div class="settings-hint" style="margin:14px 0 0">Доступные бюджеты:</div>' + rows.map(s => {
    const active = (s.uid === ownUid() && !activeSpaceUid) || s.uid === activeSpaceUid;
    return `<div class="share-row">
      <span class="share-name">${escapeHtml(s.name)}<div class="share-sub">${escapeHtml(s.email)}</div></span>
      <button class="${active ? 'active-space' : ''}" onclick="switchSpace('${escapeHtml(s.uid)}')">${active ? 'Открыт' : 'Открыть'}</button>
    </div>`;
  }).join('');
}

// ==============================
// УСТАНОВКА И СВЯЗЬ
// ==============================
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  // Браузер готов предложить установку — показываем свою кнопку
  e.preventDefault();
  _installPrompt = e;
  const card = document.getElementById('installCard');
  if (card) card.style.display = '';
});

window.addEventListener('appinstalled', () => {
  _installPrompt = null;
  const card = document.getElementById('installCard');
  if (card) card.style.display = 'none';
});

async function installApp() {
  if (!_installPrompt) {
    showToast('Браузер не предлагает установку — добавьте через меню браузера', 'error');
    return;
  }
  const prompt = _installPrompt;
  _installPrompt = null;
  prompt.prompt();
  const choice = await prompt.userChoice.catch(() => null);
  const card = document.getElementById('installCard');
  if (card) card.style.display = 'none';
  if (choice && choice.outcome === 'accepted') showToast('Приложение устанавливается ✓', 'success');
}

// Firebase сам доотправит записи, но человек должен видеть, что связи нет
function updateOnlineState() {
  const bar = document.getElementById('offlineBar');
  if (bar) bar.classList.toggle('show', !navigator.onLine);
}

window.addEventListener('offline', updateOnlineState);
window.addEventListener('online', () => {
  updateOnlineState();
  showToast('Связь вернулась ✓', 'success');
});

// ==============================
// ПЕРЕНОС ОСТАТКА БЮДЖЕТА
// ==============================
// Переносим только прошлый месяц, а не всю историю: так остаток предсказуем.
function budgetCarry() {
  const base = settings.monthBudget || 0;
  if (!settings.planRollover || base <= 0) return 0;
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const key = `${prev.getFullYear()}-${pad2(prev.getMonth() + 1)}`;
  const prevTx = data.transactions.filter(t => String(t.date).startsWith(key));
  // В месяце вообще нет записей — приложением тогда не пользовались, переносить нечего
  if (!prevTx.length) return 0;
  const spent = prevTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  return Math.round((base - spent) * 100) / 100;
}

function activeBudget() {
  return Math.max((settings.monthBudget || 0) + budgetCarry(), 0);
}

function toggleRollover() {
  const box = document.getElementById('planRollover');
  settings.planRollover = !!(box && box.checked);
  saveSettingsToFirestore();
  renderPlanTab();
  refreshAll();
}

function renderRollover() {
  const box = document.getElementById('planRollover');
  if (box) box.checked = !!settings.planRollover;
  const note = document.getElementById('planRolloverNote');
  if (!note) return;
  if (!settings.planRollover) { note.textContent = ''; return; }
  const carry = budgetCarry();
  const cur = CUR();
  if (!settings.monthBudget) {
    note.textContent = 'Сначала укажите бюджет месяца.';
  } else if (carry > 0) {
    note.textContent = `В прошлом месяце осталось ${formatNum(carry)} ${cur} — они добавлены: бюджет ${formatNum(activeBudget())} ${cur}.`;
  } else if (carry < 0) {
    note.textContent = `В прошлом месяце перерасход ${formatNum(-carry)} ${cur} — вычтен: бюджет ${formatNum(activeBudget())} ${cur}.`;
  } else {
    note.textContent = 'Прошлый месяц закрыт ровно по бюджету.';
  }
}

// ==============================
// CALCULATE
// ==============================
function getStats(period = 'all') {
  const now = new Date();
  if (!selectedMonthForAnalytics) {
    selectedMonthForAnalytics = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Compare local YYYY-MM-DD strings: new Date('YYYY-MM-DD') is UTC midnight
  const todayKey = dateKey(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = dateKey(weekStart);

  const txs = data.transactions.filter(tx => {
    if (period === 'week') return tx.date >= weekStartKey && tx.date <= todayKey;
    if (period === 'month') return tx.date.startsWith(selectedMonthForAnalytics);
    if (period === 'current_month_strict') return tx.date.startsWith(todayKey.slice(0, 7));
    return true;
  });

  let income = 0, expense = 0;
  const byCat = {};       // expenses only — for donut/bars
  const byCatAll = {};    // all types — for month compare
  txs.forEach(tx => {
    // Transfers just move money around — they are neither income nor expense
    if (tx.type === 'transfer') return;
    if (tx.type === 'income') income += tx.amount;
    else {
      expense += tx.amount;
      if (!byCat[tx.category]) byCat[tx.category] = 0;
      byCat[tx.category] += tx.amount;
    }
    if (!byCatAll[tx.category]) byCatAll[tx.category] = 0;
    byCatAll[tx.category] += tx.amount;
  });

  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = Object.values(getAccountBalances()).reduce((s, v) => s + v, 0);

  return { income, expense, byCat, byCatAll, balance, totalIncome, totalExpense, txs, count: txs.length };
}

// ==============================
// RENDER HOME
// ==============================
function renderHome() {
  const s = getStats('current_month_strict');

  animateNumber('balanceAmount', s.balance);
  const balEl = document.getElementById('balanceAmount');
  if (balEl) balEl.style.color = s.balance < 0 ? 'var(--accent2)' : '';
  animateNumber('totalIncome', s.totalIncome);
  animateNumber('totalExpense', s.totalExpense);
  document.getElementById('totalTx').textContent = data.transactions.length;

  const today = dateKey();
  const todaySpent = data.transactions.filter(t => t.date === today && t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balCard = document.querySelector('.balance-card');
  if (balCard) {
    if (todaySpent === 0 && data.transactions.length > 0) {
      balCard.classList.add('easter-egg');
    } else {
      balCard.classList.remove('easter-egg');
    }
  }

  if (activeBudget() > 0) {
    const pct = Math.min((s.expense / activeBudget()) * 100, 100);
    document.getElementById('budgetProgress').style.display = 'block';
    document.getElementById('budgetPercent').textContent = Math.round(pct) + '%';
    const fill = document.getElementById('bpFill');
    fill.style.width = pct + '%';
    fill.className = 'bp-fill ' + (pct < 60 ? 'safe' : pct < 90 ? 'warn' : 'over');
  } else {
    document.getElementById('budgetProgress').style.display = 'none';
  }

  // Cat stats chips — show top 3, rest hidden with expand button
  const catRow = document.getElementById('catStatsRow');
  const byCat = {};
  data.transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!byCat[t.category]) byCat[t.category] = 0;
    byCat[t.category] += t.amount;
  });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const TOP = 3;
  const hasMore = sorted.length > TOP;

  function chipHtml(catId, val) {
    const cat = getCat(catId);
    return `<div class="stat-chip">
      <div class="sc-icon">${cat.icon}</div>
      <div class="sc-label">${cat.label}</div>
      <div class="sc-val" style="color:${cat.color}">${formatNum(val)} ${CUR()}</div>
    </div>`;
  }

  catRow.innerHTML = sorted.slice(0, TOP).map(([id, val]) => chipHtml(id, val)).join('');

  // Remove old expand button if any
  const oldBtn = document.getElementById('catExpandBtn');
  if (oldBtn) oldBtn.remove();

  if (hasMore) {
    const btn = document.createElement('button');
    btn.id = 'catExpandBtn';
    btn.className = 'stats-expand-btn';
    btn.textContent = `▾ Ещё ${sorted.length - TOP} категорий`;
    btn.onclick = () => {
      const isExpanded = catRow.children.length > TOP;
      if (isExpanded) {
        catRow.innerHTML = sorted.slice(0, TOP).map(([id, val]) => chipHtml(id, val)).join('');
        btn.textContent = `▾ Ещё ${sorted.length - TOP} категорий`;
      } else {
        catRow.innerHTML = sorted.map(([id, val]) => chipHtml(id, val)).join('');
        btn.textContent = `▴ Скрыть`;
      }
    };
    catRow.insertAdjacentElement('afterend', btn);
  }


  // Accounts
  renderAccountsStrip();

  // Alerts
  renderAlerts();

  // Today widget
  renderTodayWidget();

  // Smart widget
  renderSmartWidget();

  // Recent 5
  const list = document.getElementById('recentList');
  const recent = data.transactions.slice(0, 5);
  if (!recent.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">💸</div><p>Пока нет записей</p></div>';
  } else {
    list.innerHTML = recent.map((tx, i) => renderTxItem(tx, i)).join('');
    attachSwipeListeners(list);
  }

  // Daily tip logic
  const tipCard = document.getElementById('dailyTipText');
  if (tipCard) {
     const inc = s.totalIncome || 0;
     const exp = s.totalExpense || 0;
     let tip = "Финансовая подушка безопасности — залог спокойствия. Откладывайте хотя бы 5-10% с каждого дохода.";
     if (exp > inc && inc > 0) {
         tip = "Кажется, расходы превышают доходы. Потерпи, этот этап пройдет. Возможно, стоит поискать дополнительный заработок или обсудить повышение на работе?";
     } else if (exp === 0 && inc === 0) {
         tip = "Начни вести учет прямо сейчас — добавь свою первую операцию, чтобы взять финансы под контроль.";
     } else if (inc > exp * 2) {
         tip = "Отличный месяц! Доходы значительно превышают расходы. Самое время подумать об инвестициях или пополнении сбережений.";
     } else if (exp > 0) {
         const tips = [
             "Старайся планировать крупные покупки заранее, чтобы они не били по карману.",
             "Прежде чем купить что-то незапланированное, возьми паузу на 24 часа. Если желание останется — покупай.",
             "Регулярно пересматривай свои подписки. Возможно, за какие-то сервисы ты платишь, но не пользуешься ими.",
             "Инвестиции в себя — самые выгодные. Новые навыки могут увеличить твой доход в будущем."
         ];
         const dayIndex = new Date().getDate() % tips.length;
         tip = tips[dayIndex];
     }
     tipCard.textContent = tip;
  }
}

function renderTodayWidget() {
  const today = dateKey();
  const todayTxs = data.transactions.filter(t => t.date === today && t.type === 'expense');
  const todayTotal = todayTxs.reduce((s, t) => s + t.amount, 0);
  const el = document.getElementById('todayWidget');
  if (!el) return;

  if (!todayTxs.length) {
    el.innerHTML = `<div class="today-header">
  <span class="today-title">Сегодня</span>
  <span class="today-total">0 ${CUR()}</span>
</div>
<div class="today-empty">Нет расходов сегодня 🎉</div>`;
    return;
  }

  el.innerHTML = `<div class="today-header">
<span class="today-title">Сегодня</span>
<span class="today-total">${formatNum(todayTotal)} ${CUR()}</span>
  </div>
  <div class="today-items">
${todayTxs.map(tx => {
    const cat = getCat(tx.category);
    return `<div class="today-row tx-item" data-id="${tx.id}" style="border-radius:10px;border:none;padding:8px 10px">
    <span class="today-icon tx-icon" style="width:28px;height:28px;font-size:14px;border-radius:8px;background:${cat.color}22">${cat.icon}</span>
    <span class="today-name tx-info"><div class="tx-name" style="font-size:13px">${escapeHtml(tx.name)}</div></span>
    <span class="today-amt tx-amount" style="font-size:13px;color:var(--accent2)">${formatNum(tx.amount)} ${CUR()}</span>
  </div>`;
  }).join('')}
  </div>`;
  attachSwipeListeners(el);
}

// ==============================
// RENDER ANALYTICS
// ==============================
function renderAnalytics() {
  const s = getStats(currentPeriod);

  const hasData = s.expense > 0 || Object.keys(s.byCat).length > 0;
  let emptyDiv = document.getElementById('analyticsEmptyState');
  if (!emptyDiv) {
    emptyDiv = document.createElement('div');
    emptyDiv.id = 'analyticsEmptyState';
    document.getElementById('analyticsMonthPickerWrap').insertAdjacentElement('afterend', emptyDiv);
  }

  const pickerWrap = document.getElementById('analyticsMonthPickerWrap');
  if (currentPeriod === 'month') {
    pickerWrap.style.display = 'flex';
    const months = new Set();
    data.transactions.forEach(t => months.add(t.date.slice(0, 7)));
    const d = new Date();
    if (!selectedMonthForAnalytics) {
      selectedMonthForAnalytics = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    for (let i = 0; i < 12; i++) {
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      d.setMonth(d.getMonth() - 1);
    }
    const sortedMonths = [...months].sort().reverse();
    const MNAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    pickerWrap.innerHTML = sortedMonths.map(mk => {
      const [my, mm] = mk.split('-');
      const isActive = mk === selectedMonthForAnalytics;
      return `<button class="mdc-pill${isActive ? ' active' : ''}" onclick="selectedMonthForAnalytics='${mk}';renderAnalytics()">${MNAMES[parseInt(mm) - 1]} ${my}</button>`;
    }).join('');
  } else {
    pickerWrap.style.display = 'none';
  }

  const toggle = (el, show, display = 'block') => { if (el) el.style.display = show ? display : 'none'; };
  const detail = document.getElementById('catBarsDetail');
  const hasAnyTx = data.transactions.length > 0;
  toggle(document.querySelector('.donut-wrap'), hasData);
  toggle(document.querySelector('.chart-wrap'), hasData);
  toggle(detail?.previousElementSibling, hasData);
  toggle(detail, hasData, 'flex');
  // Month comparison stays available even if the selected period is empty
  toggle(document.querySelector('.month-compare-wrap'), hasAnyTx);

  if (!hasData) {
    emptyDiv.style.display = 'block';
    emptyDiv.innerHTML = hasAnyTx
      ? `<div style="padding: 32px 20px; text-align: center; color: var(--text2); animation: fadeUp 0.5s both;">
    <div style="font-size: 40px; margin-bottom: 12px;">🌿</div>
    <div style="font-size: 14px;">Нет расходов за выбранный период</div>
  </div>`
      : `
  <div style="padding: 60px 20px; text-align: center; color: var(--text2); animation: fadeUp 0.5s both;">
    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.9;">👻</div>
    <div style="font-family: 'Unbounded', sans-serif; font-size: 18px; color: var(--text); margin-bottom: 12px;">Тут пока пусто!</div>
    <div style="font-size: 14px; line-height: 1.5; color: var(--text2);">Я готов считать твои миллионы.<br>Добавь первую операцию.</div>
  </div>
`;
  } else {
    emptyDiv.style.display = 'none';
    renderDonut(s.byCat);
    renderBarChart();
    renderCatBars(s.byCat, s.expense);
  }

  if (hasAnyTx) {
    renderMonthSelectors();
    renderMonthCompare();
  }
}

function renderDonut(byCat) {
  const svg = document.getElementById('donutSvg');
  const legend = document.getElementById('donutLegend');
  const total = Object.values(byCat).reduce((a, b) => a + b, 0);
  if (!total) return;

  const r = 40, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  // Clear previous
  svg.innerHTML = `<circle cx="55" cy="55" r="40" fill="none" stroke="var(--surface3)" stroke-width="14"/>`;

  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  legend.innerHTML = '';

  sorted.forEach(([catId, val]) => {
    const cat = getCat(catId);
    const pct = val / total;
    const dashLen = pct * circ;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', cat.color);
    circle.setAttribute('stroke-width', '14');
    circle.setAttribute('stroke-dasharray', `${dashLen} ${circ - dashLen}`);
    circle.setAttribute('stroke-dashoffset', -(offset * circ - circ / 4));
    circle.style.transition = 'stroke-dasharray 0.8s ease';
    svg.appendChild(circle);
    offset += pct;

    const li = document.createElement('div');
    li.className = 'legend-item';
    li.innerHTML = `
  <div class="legend-dot" style="background:${cat.color}"></div>
  <span class="legend-text">${cat.icon} ${cat.label}</span>
  <span class="legend-val">${formatNum(val)} ${CUR()}</span>`;
    legend.appendChild(li);
  });
}

function renderBarChart() {
  const chart = document.getElementById('barChart');
  const cols = [];
  const addDay = d => cols.push({ key: dateKey(d), day: d.getDate(), label: d.getDate() + '/' + (d.getMonth() + 1), total: 0 });

  if (currentPeriod === 'month' && selectedMonthForAnalytics) {
    // Whole selected month instead of "last 14 days from today"
    const [y, m] = selectedMonthForAnalytics.split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    for (let i = 1; i <= days; i++) addDay(new Date(y, m - 1, i));
  } else {
    const days = currentPeriod === 'week' ? 7 : 14;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      addDay(d);
    }
  }

  const byDay = {};
  data.transactions.forEach(t => {
    if (t.type === 'expense') byDay[t.date] = (byDay[t.date] || 0) + t.amount;
  });
  cols.forEach(c => { c.total = byDay[c.key] || 0; });

  const dense = cols.length > 14;
  chart.style.gap = dense ? '2px' : '8px';
  const max = Math.max(...cols.map(c => c.total), 1);
  chart.innerHTML = cols.map((col, i) => {
    const h = Math.round((col.total / max) * 80);
    const label = dense ? (i === 0 || col.day % 5 === 0 ? col.day : '&nbsp;') : col.label;
    return `<div class="bar-col" title="${col.label}: ${formatNum(col.total)} ${CUR()}">
  <div class="bar-val">${!dense && col.total > 0 ? formatNum(col.total) : ''}</div>
  <div class="bar-body" style="height:${h}px"></div>
  <div class="bar-label">${label}</div>
</div>`;
  }).join('');
}

function renderCatBars(byCat, total) {
  const container = document.getElementById('catBarsDetail');
  if (!total) { container.innerHTML = '<div class="empty-state"><p>Нет расходов за период</p></div>'; return; }
  const sorted = Object.entries(byCat).filter(([k]) => k !== 'income').sort((a, b) => b[1] - a[1]);
  container.innerHTML = sorted.map(([catId, val]) => {
    const cat = getCat(catId);
    const pct = Math.round((val / total) * 100);
    return `<div class="cat-bar-item">
  <div class="cat-bar-header">
    <div class="cat-bar-name">${cat.icon} ${cat.label}</div>
    <div class="cat-bar-val">${formatNum(val)} ${CUR()} (${pct}%)</div>
  </div>
  <div class="cat-bar-track">
    <div class="cat-bar-fill" style="width:${pct}%;background:${cat.color}"></div>
  </div>
</div>`;
  }).join('');
}

function setPeriod(p, el) {
  currentPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderAnalytics();
}

// ==============================
// MONTH COMPARE
// ==============================
function getAvailableMonths() {
  const months = new Set();
  data.transactions.forEach(tx => {
    months.add(tx.date.slice(0, 7));
  });
  return [...months].sort().reverse();
}

function renderMonthSelectors() {
  const months = getAvailableMonths(); // months that have data
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Build full 12-month list regardless of data
  const allMonthsSet = new Set(months);
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    allMonthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  const allMonths = [...allMonthsSet].sort().reverse();

  // Smart defaults: A = this month, B = prev month (always different!)
  if (!compareMonthA) compareMonthA = thisMonth;
  if (!compareMonthB || compareMonthB === compareMonthA) {
    // Pick the first month that is NOT compareMonthA
    compareMonthB = allMonths.find(m => m !== compareMonthA) || prevMonth;
  }

  const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  function buildRow(containerId, activeKey, setFn, cls) {
    const container = document.getElementById(containerId);
    const label = container.firstElementChild;
    container.innerHTML = '';
    container.appendChild(label);

    allMonths.forEach(m => {
      const [y, mo] = m.split('-');
      const hasData = months.includes(m);
      const btn = document.createElement('button');
      btn.className = 'month-pill' + (m === activeKey ? ' ' + cls : '');
      btn.textContent = MONTH_NAMES[parseInt(mo) - 1] + ' ' + y;
      if (!hasData) btn.style.opacity = '0.45';
      btn.title = hasData ? '' : 'Нет данных';
      btn.onclick = () => {
        setFn(m);
        // Prevent A and B being the same
        if (compareMonthA === compareMonthB) {
          if (cls === 'active-a') compareMonthB = allMonths.find(x => x !== compareMonthA) || compareMonthB;
          else compareMonthA = allMonths.find(x => x !== compareMonthB) || compareMonthA;
        }
        renderMonthCompare();
        renderMonthSelectors();
      };
      container.appendChild(btn);
    });
  }

  buildRow('monthSelectorA', compareMonthA, v => compareMonthA = v, 'active-a');
  buildRow('monthSelectorB', compareMonthB, v => compareMonthB = v, 'active-b');

  // Add "Detail" buttons under each selector
  const detBtnStyle = `margin-top:8px;padding:6px 14px;border-radius:20px;background:rgba(124,109,250,0.14);border:1px solid rgba(124,109,250,0.3);color:var(--accent);font-size:11px;font-weight:700;cursor:pointer;transition:all 0.2s;width:100%;`;
  ['A','B'].forEach(letter => {
    const monthKey = letter === 'A' ? compareMonthA : compareMonthB;
    const wrap = document.getElementById('monthSelector' + letter);
    if (!wrap) return;
    let btn = document.getElementById('mdDetailBtn' + letter);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'mdDetailBtn' + letter;
      btn.style.cssText = detBtnStyle;
      btn.onclick = () => showMonthDetail(letter === 'A' ? compareMonthA : compareMonthB);
      wrap.parentElement.insertBefore(btn, wrap.nextSibling);
    } else {
      btn.onclick = () => showMonthDetail(letter === 'A' ? compareMonthA : compareMonthB);
    }
    const MONTH_NAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const [y, mo] = monthKey.split('-');
    btn.innerHTML = `${ic('chart')} Детали: ${MONTH_NAMES[parseInt(mo) - 1]} ${y}`;
  });
}

function getMonthTotals(monthKey) {
  const txs = data.transactions.filter(t => t.date.startsWith(monthKey) && t.type === 'expense');
  const byCat = {};
  let total = 0;
  txs.forEach(t => {
    if (!byCat[t.category]) byCat[t.category] = 0;
    byCat[t.category] += t.amount;
    total += t.amount;
  });
  return { byCat, total };
}

function renderMonthCompare() {
  const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  const fmtLabel = (key) => {
    if (!key) return '—';
    const [y, m] = key.split('-');
    return MONTH_NAMES[parseInt(m) - 1] + ' ' + y;
  };

  document.getElementById('compareLabelA').textContent = fmtLabel(compareMonthA);
  document.getElementById('compareLabelB').textContent = fmtLabel(compareMonthB);

  const a = getMonthTotals(compareMonthA);
  const b = getMonthTotals(compareMonthB);

  // All cats in both months
  const allCats = new Set([...Object.keys(a.byCat), ...Object.keys(b.byCat)]);
  const max = Math.max(...[...allCats].map(c => Math.max(a.byCat[c] || 0, b.byCat[c] || 0)), 1);

  const barsEl = document.getElementById('compareBars');

  if (compareMonthA === compareMonthB) {
    barsEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--accent2);font-size:13px">⚠️ Выбраны одинаковые месяцы — выбери разные для сравнения</div>';
    document.getElementById('compareTotals').innerHTML = '';
    return;
  }

  if (!allCats.size) {
    barsEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">Нет данных для сравнения</div>';
    document.getElementById('compareTotals').innerHTML = '';
    return;
  }

  const sorted = [...allCats].sort((x, y) => ((b.byCat[y] || 0) + (a.byCat[y] || 0)) - ((b.byCat[x] || 0) + (a.byCat[x] || 0)));

  barsEl.innerHTML = sorted.map(catId => {
    const cat = getCat(catId);
    const va = a.byCat[catId] || 0;
    const vb = b.byCat[catId] || 0;
    const pa = Math.round((va / max) * 100);
    const pb = Math.round((vb / max) * 100);

    // Per-category change arrow
    let badge = '';
    if (va > 0 && vb > 0) {
      const chg = Math.round((va - vb) / vb * 100);
      const sign = chg > 0 ? '+' : '';
      const clr = chg > 0 ? 'var(--accent2)' : 'var(--accent3)';
      badge = `<span style="font-size:11px;font-weight:700;color:${clr};margin-left:6px">${sign}${chg}%</span>`;
    } else if (va > 0 && vb === 0) {
      badge = `<span style="font-size:11px;font-weight:700;color:var(--accent2);margin-left:6px">новое</span>`;
    } else if (va === 0 && vb > 0) {
      badge = `<span style="font-size:11px;font-weight:700;color:var(--accent3);margin-left:6px">−100%</span>`;
    }

    return `<div class="cmp-row">
  <div class="cmp-row-header">
    <div class="cmp-row-name">${cat.icon} ${cat.label}${badge}</div>
    <div class="cmp-row-vals">
      <span class="cmp-val-a">${va > 0 ? formatNum(va) : '—'}</span>
      <span style="color:var(--text2);font-size:11px">vs</span>
      <span class="cmp-val-b">${vb > 0 ? formatNum(vb) : '—'}</span>
    </div>
  </div>
  <div class="cmp-tracks">
    <div class="cmp-track"><div class="cmp-fill-a" style="width:${pa}%;transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)"></div></div>
    <div class="cmp-track"><div class="cmp-fill-b" style="width:${pb}%;transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)"></div></div>
  </div>
</div>`;
  }).join('');

  // Totals comparison
  const diff = a.total - b.total;
  const diffPct = b.total > 0 ? Math.round(Math.abs(diff) / b.total * 100) : 0;
  const diffText = diff === 0 ? '= одинаково' : diff > 0 ? `▲ на ${diffPct}% больше` : `▼ на ${diffPct}% меньше`;
  const diffCls = diff <= 0 ? 'better' : 'worse';

  document.getElementById('compareTotals').innerHTML = `
<div class="ct-item">
  <div class="ct-label" style="color:var(--accent)">${fmtLabel(compareMonthA)}</div>
  <div class="ct-val">${formatNum(a.total)} ${CUR()}</div>
  ${a.total === 0 ? '<div style="font-size:11px;color:var(--text2)">нет расходов</div>' : ''}
</div>
<div class="ct-item">
  <div class="ct-label" style="color:var(--accent2)">${fmtLabel(compareMonthB)}</div>
  <div class="ct-val">${formatNum(b.total)} ${CUR()}</div>
  ${b.total === 0 ? '<div style="font-size:11px;color:var(--text2)">нет расходов</div>' : ''}
  ${a.total > 0 && b.total > 0 ? `<div class="ct-diff ${diffCls}">${diffText}</div>` : ''}
</div>`;
}

// ==============================
// RENDER HISTORY
// ==============================
function renderDatePresets() {
  const row = document.getElementById('datePresets');
  if (!row) return;
  const presets = [
    { id: 'all', label: 'Всё' },
    { id: '7', label: '7 дней' },
    { id: '30', label: '30 дней' },
    { id: 'month', label: 'Месяц' }
  ];
  row.innerHTML = presets.map(p =>
    `<button class="date-preset${histPreset === p.id ? ' active' : ''}" onclick="setDatePreset('${p.id}')">${p.label}</button>`
  ).join('');
}

function setDatePreset(id) {
  histPreset = id;
  const from = document.getElementById('histFrom');
  const to = document.getElementById('histTo');
  const now = new Date();
  if (id === 'all') {
    from.value = '';
    to.value = '';
  } else if (id === 'month') {
    from.value = dateKey(now).slice(0, 8) + '01';
    to.value = dateKey(now);
  } else {
    const start = new Date(now);
    start.setDate(start.getDate() - (parseInt(id) - 1));
    from.value = dateKey(start);
    to.value = dateKey(now);
  }
  renderDatePresets();
  renderHistory();
}

function onDateRangeChange() {
  histPreset = 'custom';
  renderDatePresets();
  renderHistory();
}

function dayLabel(dateStr) {
  const today = dateKey();
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); })();
  if (dateStr === today) return 'Сегодня';
  if (dateStr === yest) return 'Вчера';
  return parseDateKey(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
}

// A year of daily records is ~1500 rows: render a page at a time
const HISTORY_PAGE = 150;
let historyShown = HISTORY_PAGE;
let _searchTimer = null;

// Typing rebuilt the whole list on every keystroke
function onSearchInput() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => renderHistory(), 200);
}

function showMoreHistory() {
  historyShown += HISTORY_PAGE;
  renderHistory(true);
}

function renderHistory(keepPage) {
  // Any filter change starts the list from the top again
  if (keepPage !== true) historyShown = HISTORY_PAGE;
  const search = document.getElementById('searchInput').value.toLowerCase();
  const from = document.getElementById('histFrom')?.value || '';
  const to = document.getElementById('histTo')?.value || '';
  let txs = [...data.transactions];

  if (filterCat !== 'all') txs = txs.filter(t => t.category === filterCat);
  if (filterAccount !== 'all') txs = txs.filter(t => t.account === filterAccount || t.toAccount === filterAccount);
  if (isDateKey(from)) txs = txs.filter(t => t.date >= from);
  if (isDateKey(to)) txs = txs.filter(t => t.date <= to);
  if (search) txs = txs.filter(t =>
    t.name.toLowerCase().includes(search) ||
    (t.note && t.note.toLowerCase().includes(search))
  );

  // Summary for whatever is currently filtered
  const spent = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const earned = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const summary = document.getElementById('historySummary');
  if (summary) {
    summary.innerHTML = txs.length
      ? `<span>${txs.length} операц.</span>
         <span>Расход: <b style="color:var(--accent2)">${formatNum(spent)} ${CUR()}</b></span>
         <span>Доход: <b style="color:var(--accent3)">${formatNum(earned)} ${CUR()}</b></span>`
      : '';
  }

  const list = document.getElementById('historyList');
  if (!txs.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><p>Ничего не найдено</p></div>';
    return;
  }

  // Newest first, then only the visible page
  txs.sort(compareTx);
  const hidden = Math.max(0, txs.length - historyShown);
  const page = hidden ? txs.slice(0, historyShown) : txs;

  // Group by day, newest first
  const byDay = {};
  page.forEach(t => { (byDay[t.date] = byDay[t.date] || []).push(t); });
  let i = 0;
  list.innerHTML = Object.keys(byDay).sort().reverse().map(date => {
    const dayTxs = byDay[date];
    const daySpent = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dayEarned = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const total = [
      daySpent ? `<span style="color:var(--accent2)">−${formatNum(daySpent)}</span>` : '',
      dayEarned ? `<span style="color:var(--accent3)">+${formatNum(dayEarned)}</span>` : ''
    ].filter(Boolean).join(' · ');
    return `<div class="day-group">
  <div class="day-header">
    <span class="day-title">${dayLabel(date)}</span>
    <span class="day-total">${total}</span>
  </div>
  ${dayTxs.map(tx => renderTxItem(tx, i++)).join('')}
</div>`;
  }).join('');

  if (hidden) {
    list.innerHTML += `<button class="show-more-btn" onclick="showMoreHistory()">
      Показать ещё <span>· осталось ${formatNum(hidden)}</span>
    </button>`;
  }
  attachSwipeListeners(list);
}

function renderTxItem(tx, i) {
  const cat = getCat(tx.category);
  const dateStr = parseDateKey(tx.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const isTransfer = tx.type === 'transfer';
  const sign = isTransfer ? '' : tx.type === 'income' ? '+' : '-';
  const color = isTransfer ? 'var(--text2)' : tx.type === 'income' ? 'var(--accent3)' : 'var(--accent2)';
  const isSelected = selectedTxIds.has(tx.id);
  const acc = getAccount(tx.account);
  // Icons only — account names made the transfer row wrap onto two lines
  const meta = isTransfer
    ? `${acc.icon} → ${getAccount(tx.toAccount).icon}`
    : `${cat.label} · ${acc.icon}`;

  return `<div class="tx-wrap" style="animation-delay:${i * 0.05}s">
<div class="tx-item${isSelected ? ' selected-multi' : ''}"
     data-id="${tx.id}">
  <div class="tx-icon" style="background:${cat.color}22">${cat.icon}</div>
  <div class="tx-info">
    <div class="tx-name">${escapeHtml(tx.name)}</div>
    <div class="tx-meta">${meta} · ${dateStr}${tx.note ? ' · ' + escapeHtml(tx.note) : ''}</div>
  </div>
  <div class="tx-amount" style="color:${color}">${sign}${formatNum(tx.amount)} ${CUR()}</div>
  <div class="tx-btns">
    <button class="tx-btn tx-btn-edit" title="Изменить"
      onclick="event.stopPropagation();openEditModal('${tx.id}')">${ic('pencil')}</button>
    <button class="tx-btn tx-btn-del" title="Удалить"
      onclick="event.stopPropagation();confirmDeleteTx('${tx.id}')">${ic('trash')}</button>
  </div>
</div>
  </div>`;
}

// ==============================
// MULTISELECT (long press)
// ==============================
let selectedTxIds = new Set();
let multiselectMode = false;
let longPressTimer = null;
let longPressFired = false;

function attachSwipeListeners(container) {
  container.querySelectorAll('.tx-item').forEach(item => {
    const id = item.dataset.id;
    let startX = 0, startY = 0;

    item.addEventListener('pointerdown', e => {
      // Only trigger long-press from the item body, not the buttons
      if (e.target.closest('.tx-btns')) return;
      startX = e.clientX;
      startY = e.clientY;
      longPressFired = false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        longPressFired = true;
        if (!multiselectMode) enterMultiselect();
        toggleSelectTx(id);
        if (navigator.vibrate) navigator.vibrate(40);
      }, 500);
    });

    // Touch pointers jitter by a few px — cancel only on a real move
    item.addEventListener('pointermove', e => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) clearTimeout(longPressTimer);
    });
    item.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    item.addEventListener('pointercancel', () => clearTimeout(longPressTimer));
    item.addEventListener('contextmenu', e => e.preventDefault());

    item.addEventListener('click', e => {
      if (e.target.closest('.tx-btns')) return;
      // The click right after a long-press would immediately unselect the item
      if (longPressFired) { longPressFired = false; return; }
      if (multiselectMode) toggleSelectTx(id);
      else openEditModal(id);
    });
  });
}

function enterMultiselect() {
  multiselectMode = true;
}

function toggleSelectTx(id) {
  if (selectedTxIds.has(id)) selectedTxIds.delete(id);
  else selectedTxIds.add(id);
  updateMultiselectBar();
  // The same transaction can be rendered on Home and in History at once
  document.querySelectorAll(`.tx-item[data-id="${id}"]`)
    .forEach(el => el.classList.toggle('selected-multi', selectedTxIds.has(id)));
}

function updateMultiselectBar() {
  const bar = document.getElementById('multiselectBar');
  const count = selectedTxIds.size;
  if (count === 0) { cancelMultiselect(); return; }
  document.getElementById('msCount').textContent = `${count} запис${count === 1 ? 'ь' : count < 5 ? 'и' : 'ей'}`;
  bar.classList.add('show');
}

function cancelMultiselect() {
  multiselectMode = false;
  selectedTxIds.clear();
  document.getElementById('multiselectBar').classList.remove('show');
  document.querySelectorAll('.tx-item.selected-multi').forEach(el => el.classList.remove('selected-multi'));
}

function deleteSelected() {
  if (selectedTxIds.size === 0) return;
  const count = selectedTxIds.size;
  deleteTxs([...selectedTxIds], `Удалено ${count} запис${count === 1 ? 'ь' : count < 5 ? 'и' : 'ей'}`);
  cancelMultiselect();
}

// ==============================
// DELETE + UNDO
// ==============================
let _undo = null; // { txs, timer }

function deleteTxs(ids, label) {
  const removed = data.transactions.filter(t => ids.includes(t.id));
  if (!removed.length) return;
  const changes = {};
  ids.forEach(id => { changes[id] = null; });
  data.transactions = data.transactions.filter(t => !ids.includes(t.id));
  persistTx(changes);
  refreshAll();
  renderHistory();
  offerUndo(removed, label);
}

function offerUndo(txs, label) {
  if (_undo) clearTimeout(_undo.timer);
  _undo = { txs, timer: setTimeout(hideUndo, 7000) };
  document.getElementById('undoText').textContent = label;
  document.getElementById('undoBar').classList.add('show');
}

function hideUndo(keepPhotos) {
  if (_undo) {
    clearTimeout(_undo.timer);
    // Окно отмены закрылось — снимки удалённых операций больше не нужны
    if (!keepPhotos) forgetReceipts(_undo.txs);
  }
  _undo = null;
  const bar = document.getElementById('undoBar');
  if (bar) bar.classList.remove('show');
}

function undoDelete() {
  if (!_undo) return;
  const txs = _undo.txs;
  hideUndo(true);
  data.transactions.push(...txs);
  persistTx(txMap(txs));
  refreshAll();
  renderHistory();
  showToast('Восстановлено ✓', 'success');
}

// Deleting a single record is instant — the undo bar is the safety net
function confirmDeleteTx(id) {
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) return;
  deleteTxs([id], `Удалено: ${tx.name}`);
}

// Shared confirmation dialog for the irreversible actions
function openConfirm({ icon = 'trash', title, text = 'Это действие нельзя отменить', okText = 'Удалить', onOk }) {
  // Interface icons come by name, user data (account/goal/category) brings its own emoji
  document.getElementById('confirmIcon').innerHTML = ICONS[icon] ? ic(icon) : escapeHtml(icon);
  document.getElementById('confirmMsg').textContent = title;
  document.getElementById('confirmText').textContent = text;
  const ok = document.getElementById('confirmOk');
  ok.textContent = okText;
  ok.onclick = () => { closeConfirm(); onOk(); };
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('show');
}


// ==============================
// GOALS
// ==============================
const GOAL_EMOJIS = ['🎯', '📱', '✈️', '🚗', '🏠', '💻', '👟', '🎮', '📚', '💍', '🌴', '🏋️', '🎸', '📷', '💰'];
let goalsData = [];
let debtsData = [];
let selectedGoalEmoji = '🎯';

function saveGoalsData() { saveGoalsToFirestore(); }

function renderGoalEmojiPicker() {
  const row = document.getElementById('goalEmojiRow');
  if (!row) return;
  row.innerHTML = GOAL_EMOJIS.map(e =>
    `<button class="goal-emoji-btn${e === selectedGoalEmoji ? ' selected' : ''}" onclick="selectGoalEmoji('${e}')">${e}</button>`
  ).join('');
}

function selectGoalEmoji(e) {
  selectedGoalEmoji = e;
  renderGoalEmojiPicker();
}

function saveNewGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
  const deadline = document.getElementById('goalDeadline').value;
  if (!name) { showToast('Введите название ❌', 'error'); return; }
  if (!target || target <= 0) { showToast('Введите целевую сумму ❌', 'error'); return; }

  goalsData.push({ id: Date.now().toString(), name, target, saved, deadline, emoji: selectedGoalEmoji });
  saveGoalsData();

  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalSaved').value = '';
  document.getElementById('goalDeadline').value = '';
  document.getElementById('goalFormCard').style.display = 'none';
  renderGoals();
  showToast('Цель создана 🎯', 'success');
}

function renderGoals() {
  renderGoalEmojiPicker();
  const list = document.getElementById('goalsList');
  if (!list) return;

  if (!goalsData.length) {
    list.innerHTML = `<div class="empty-state">
  <div class="es-icon">🎯</div>
  <p>Нет целей накопления.<br>Создай первую!</p>
</div>`;
    return;
  }

  const COLORS = ['blue', 'green', 'orange', 'cyan', 'pink', 'olive'];

  list.innerHTML = goalsData.map((g, idx) => {
    const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
    const remaining = Math.max(g.target - g.saved, 0);
    const color = themeColor(COLORS[idx % COLORS.length]);
    const done = pct >= 100;

    let deadlineStr = '';
    if (g.deadline) {
      const daysLeft = Math.round((parseDateKey(g.deadline) - parseDateKey(dateKey())) / 86400000);
      deadlineStr = daysLeft > 0 ? `${daysLeft} дней осталось` : daysLeft === 0 ? 'Сегодня дедлайн!' : 'Дедлайн прошёл';
    }

    return `<div class="goal-card" style="animation-delay:${idx * 0.08}s">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;border-radius:${20}px ${20}px 0 0;background:${color}"></div>
  <div class="goal-header">
    <div class="goal-emoji">${escapeHtml(g.emoji)}</div>
    <div class="goal-info">
      <div class="goal-name">${escapeHtml(g.name)}</div>
      ${deadlineStr ? `<div class="goal-deadline">⏰ ${deadlineStr}</div>` : ''}
    </div>
    <button class="goal-del" title="Удалить цель" onclick="deleteGoal('${g.id}')">${ic('close')}</button>
  </div>
  <div class="goal-amounts">
    <div class="goal-saved" style="color:${color}">${formatNum(g.saved)} ${CUR()}</div>
    <div class="goal-target">из ${formatNum(g.target)} ${CUR()}</div>
  </div>
  <div class="goal-track">
    <div class="goal-fill ${pct >= 80 && pct < 100 ? 'near-complete' : ''}" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}99)"></div>
    <div class="goal-finish-icon" id="goal-finish-${g.id}">🏁</div>
  </div>
  <div class="goal-pct-row">
    <div class="goal-pct" style="color:${color}">${pct}%</div>
    <div class="goal-remaining">${done ? '✅ Цель достигнута!' : `ещё ${formatNum(remaining)} ${CUR()}`}</div>
  </div>
  <div class="goal-deposit-row">
    <input class="field-input goal-deposit-input" type="number" inputmode="decimal"
           id="dep-${g.id}" placeholder="${done ? 'Снять...' : 'Сумма...'}" style="padding:10px 14px;font-size:14px">
    <select class="field-input goal-acc-select" id="depacc-${g.id}">
      ${getAccounts().map(a => `<option value="${a.id}"${a.id === defaultAccountId() ? ' selected' : ''}>${escapeHtml(a.icon + ' ' + a.name)}</option>`).join('')}
    </select>
  </div>
  <div class="goal-deposit-row" style="margin-top:8px">
    ${!done ? `<button class="goal-deposit-btn" style="flex:1" onclick="depositGoal('${g.id}')">＋ Отложить</button>` : ''}
    ${g.saved > 0 ? `<button class="goal-deposit-btn" style="flex:1;background:var(--surface2);color:var(--text2)"
      onclick="withdrawGoal('${g.id}')">− Снять</button>` : ''}
  </div>
  ${done ? `<div class="goal-complete">🎉 Поздравляем!</div>` : ''}
</div>`;
  }).join('');
}

// Money put aside is a real expense from an account, so the balance stays honest
function depositGoal(id) {
  const input = document.getElementById('dep-' + id);
  const amount = parseFloat(input.value) || 0;
  if (!(amount > 0) || !isFinite(amount)) { showToast('Введите сумму ❌', 'error'); return; }
  const goal = goalsData.find(g => g.id === id);
  if (!goal) return;

  const add = Math.min(amount, Math.max(goal.target - goal.saved, 0));
  if (add <= 0) { showToast('Цель уже достигнута 🎉', 'error'); return; }

  goal.saved += add;
  saveGoalsData();
  addGoalTx(goal, add, 'expense', document.getElementById('depacc-' + id));
  renderGoals();
  refreshAll();
  showToast(`+${formatNum(add)} ${CUR()} к цели ✓`, 'success');

  setTimeout(() => {
    const icon = document.getElementById('goal-finish-' + id);
    if (icon) {
      icon.style.animation = 'none';
      void icon.offsetWidth;
      icon.style.animation = 'bounceFinish 0.6s cubic-bezier(0.34,1.56,0.64,1)';
    }
  }, 50);
}

function withdrawGoal(id) {
  const input = document.getElementById('dep-' + id);
  const amount = parseFloat(input.value) || 0;
  if (!(amount > 0) || !isFinite(amount)) { showToast('Введите сумму ❌', 'error'); return; }
  const goal = goalsData.find(g => g.id === id);
  if (!goal) return;

  const take = Math.min(amount, goal.saved);
  if (take <= 0) { showToast('На цели пусто', 'error'); return; }

  goal.saved -= take;
  saveGoalsData();
  addGoalTx(goal, take, 'income', document.getElementById('depacc-' + id));
  renderGoals();
  refreshAll();
  showToast(`−${formatNum(take)} ${CUR()} с цели`, 'error');
}

function addGoalTx(goal, amount, type, accSelect) {
  const account = accSelect && accSelect.value ? accSelect.value : defaultAccountId();
  const tx = normalizeTx({
    id: newId(),
    date: dateKey(),
    name: (type === 'expense' ? 'Цель: ' : 'Из цели: ') + goal.name,
    amount,
    type,
    category: type === 'expense' ? 'savings' : 'income',
    account,
    note: goal.emoji || '🎯',
    goalId: goal.id
  });
  data.transactions.unshift(tx);
  persistTx({ [tx.id]: tx });
}

function deleteGoal(id) {
  const goal = goalsData.find(g => g.id === id);
  if (!goal) return;
  openConfirm({
    icon: goal.emoji || '🎯',
    title: `Удалить цель «${goal.name}»?`,
    text: 'Операции по этой цели останутся в истории',
    onOk: () => {
      goalsData = goalsData.filter(g => g.id !== id);
      saveGoalsData();
      renderGoals();
      showToast('Цель удалена', 'error');
    }
  });
}
let _editAccount = null;
let _editAccountTo = null;

function openEditModal(txId) {
  const tx = data.transactions.find(t => t.id === txId);
  if (!tx) return;
  editingTxId = txId;

  const isTransfer = tx.type === 'transfer';
  document.getElementById('modalTitle').textContent =
    isTransfer ? '🔄 Редактировать перевод' : tx.type === 'income' ? '💰 Редактировать доход' : '✏️ Редактировать расход';

  // Account pickers
  _editAccount = getAccount(tx.account).id;
  _editAccountTo = isTransfer ? getAccount(tx.toAccount).id : null;
  document.getElementById('editAccountLabel').textContent = isTransfer ? 'Откуда' : 'Счёт';
  document.getElementById('editAccountToGroup').style.display = isTransfer ? '' : 'none';
  const drawEditAccounts = () => {
    renderChipPicker('editAccGrid', getAccounts(), _editAccount, id => { _editAccount = id; drawEditAccounts(); });
    if (isTransfer) {
      renderChipPicker('editAccToGrid', getAccounts(), _editAccountTo, id => { _editAccountTo = id; drawEditAccounts(); });
    }
  };
  drawEditAccounts();
  document.getElementById('editAmount').value = tx.amount;
  document.getElementById('editName').value = tx.name;
  document.getElementById('editDate').value = tx.date;
  document.getElementById('editNote').value = tx.note || '';

  // Category grid in modal
  const editCatGroup = document.getElementById('editCatGroup');
  if (tx.type !== 'expense') {
    editCatGroup.style.display = 'none';
  } else {
    editCatGroup.style.display = '';
    const grid = document.getElementById('editCatGrid');
    grid.innerHTML = '';
    CATS.filter(c => c.id !== 'income').forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-chip' + (cat.id === tx.category ? ' selected' : '');
      btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
      btn.onclick = () => {
        grid.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
      grid.appendChild(btn);
    });
  }

  renderEditPhoto(null);
  if (tx.photo) loadReceiptPhoto(tx.id).then(url => {
    // Пока грузили, пользователь мог открыть другую запись
    if (url && editingTxId === txId) renderEditPhoto(url);
  });

  document.getElementById('editModal').classList.add('show');
}

function closeModal(e) {
  if (e.target === document.getElementById('editModal')) closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('editModal').classList.remove('show');
  editingTxId = null;
}

function saveEdit() {
  const tx = data.transactions.find(t => t.id === editingTxId);
  if (!tx) return;

  const amount = parseFloat(document.getElementById('editAmount').value);
  if (!(amount > 0) || !isFinite(amount)) { showToast('Введите сумму ❌', 'error'); return; }

  const date = document.getElementById('editDate').value;
  if (!isDateKey(date)) { showToast('Укажите дату ❌', 'error'); return; }

  if (tx.type === 'transfer' && _editAccount === _editAccountTo) {
    showToast('Выберите разные счета ❌', 'error');
    return;
  }

  tx.amount = amount;
  tx.name = document.getElementById('editName').value.trim() || tx.name;
  tx.date = date;
  tx.note = document.getElementById('editNote').value.trim();
  if (_editAccount) tx.account = _editAccount;
  if (tx.type === 'transfer' && _editAccountTo) tx.toAccount = _editAccountTo;

  if (tx.type === 'expense') {
    const selected = document.querySelector('#editCatGrid .cat-chip.selected');
    if (selected) {
      const idx = [...document.querySelectorAll('#editCatGrid .cat-chip')].indexOf(selected);
      tx.category = CATS.filter(c => c.id !== 'income')[idx]?.id || tx.category;
    }
  }

  persistTx({ [tx.id]: tx });
  refreshAll();
  renderHistory();
  closeModalDirect();
  showToast('Сохранено ✓', 'success');
}

function deleteFromModal() {
  if (!editingTxId) return;
  const id = editingTxId;
  closeModalDirect();
  // Slight delay so modal closes before confirm appears
  setTimeout(() => confirmDeleteTx(id), 150);
}



// ==============================
// UTILS
// ==============================
function formatNum(n) {
  return Math.round(n).toLocaleString('ru-RU');
}

const AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c6dfa'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

// Line icons for the interface. Emoji stay for user data and illustrations.
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  'arrow-out': '<path d="M7 17L17 7M8 7h9v9"/>',
  'arrow-in': '<path d="M17 7L7 17M16 17H7V8"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>',
  mic: '<path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M5 10v1a7 7 0 0014 0v-1M12 19v3M8 22h8"/>',
  camera: '<path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  pencil: '<path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M4 20h16"/>',
  upload: '<path d="M12 20V9M8 13l4-4 4 4M4 4h16"/>',
  bell: '<path d="M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3z"/><path d="M10 21a2 2 0 004 0"/>',
  logout: '<path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M16 17l5-5-5-5M21 12H10"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1a6 6 0 0112 0v1"/><path d="M16 5.2a3.2 3.2 0 010 5.6"/><path d="M18 20v-1a6 6 0 00-2-4.5"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3" fill="currentColor" stroke="none"/>',
  tag: '<path d="M20 12l-8 8-8-8V4h8l8 8z"/><circle cx="7.6" cy="7.6" r="1.2" fill="currentColor" stroke="none"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  chart: '<rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M15 9.2A3 3 0 0012 7.5c-1.7 0-3 .9-3 2.1 0 2.8 6 1.5 6 4.1 0 1.2-1.3 2.1-3 2.1a3 3 0 01-3-1.7M12 6v1.5M12 16.5V18"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1 1 1.7v.4h5v-.4c0-.7.4-1.3 1-1.7A6 6 0 0012 3z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  'alert-triangle': '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  moon: '<path d="M20 14A8 8 0 019.5 3.5 8 8 0 1020 14z"/>'
};

function ic(name, cls = '') {
  const body = ICONS[name];
  return body ? `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>` : '';
}

// Fills every <span data-icon="name"> in static markup
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (el.dataset.iconDone) return;
    el.innerHTML = ic(el.dataset.icon);
    el.dataset.iconDone = '1';
  });
}

// Every user-provided string that goes into innerHTML must pass through this
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Local-time YYYY-MM-DD (toISOString() is UTC and shifts the day near midnight)
function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isDateKey(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '');
}

function parseDateKey(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function newId() {
  return Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6);
}

function compareTx(a, b) {
  return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id));
}

// Validates a transaction coming from cache, Firebase or an imported file
function normalizeTx(t) {
  if (!t || typeof t !== 'object') return null;
  const amount = Math.abs(parseFloat(t.amount));
  if (!isFinite(amount) || amount === 0) return null;
  const type = t.type === 'income' ? 'income' : t.type === 'transfer' ? 'transfer' : 'expense';
  let category = CATS.some(c => c.id === t.category) ? t.category : 'other';
  if (type === 'income') category = 'income';
  else if (type === 'transfer') category = 'transfer';
  else if (category === 'income') category = 'other';

  const accIds = getAccounts().map(a => a.id);
  const account = accIds.includes(t.account) ? t.account : accIds[0];
  const out = {
    ...t,
    // ids are used as Firebase keys and inside HTML attributes
    id: String(t.id ?? '').replace(/[^\w-]/g, '') || newId(),
    amount, type, category, account,
    date: isDateKey(t.date) ? t.date : dateKey(),
    name: String(t.name ?? '').trim() || 'Без названия',
    note: String(t.note ?? '')
  };
  if (type === 'transfer') {
    out.toAccount = accIds.includes(t.toAccount) && t.toAccount !== account
      ? t.toAccount
      : (accIds.find(a => a !== account) || account);
  } else {
    delete out.toAccount;
  }
  return out;
}

function normalizeTxList(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).map(normalizeTx).filter(Boolean).map(t => {
    if (seen.has(t.id)) t.id = newId();
    seen.add(t.id);
    return t;
  });
}

function txSignature(list) {
  return list.map(t => [t.id, t.amount, t.date, t.name, t.category, t.type, t.account, t.toAccount || '', t.note || ''].join('|')).sort().join('\n');
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  const start = parseFloat(el.textContent.replace(/\s/g, '')) || 0;
  const diff = target - start;
  const dur = 600;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / dur, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatNum(start + diff * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

let _toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  // A previous toast's timer must not hide the new one early
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ==============================
// FIREBASE REALTIME DATABASE LAYER
// ==============================
let currentUser = null;

// Чьи данные сейчас открыты: свои или те, куда вас пригласили
function spaceUid() {
  return activeSpaceUid || (currentUser ? currentUser.uid : 'guest');
}

function userPath(sub) {
  return `users/${spaceUid()}/${sub}`;
}

// Remove undefined values — Firebase doesn't accept them
function cleanForFirebase(obj) {
  return JSON.parse(JSON.stringify(obj, (key, val) => val === undefined ? null : val));
}

function txMap(list) {
  const map = {};
  list.forEach(t => { map[t.id] = t; });
  return map;
}

// Transactions are stored as { id: tx } and written per item, so two devices
// editing at the same time no longer overwrite each other's records.
// changes: { id: tx | null (delete) }
async function persistTx(changes) {
  lsSet('expenses_data', data);
  if (!currentUser || !window._fbUpdate || !Object.keys(changes).length) return;
  try {
    await window._fbUpdate(window._fbRef(window._fbDb, userPath('transactions')), cleanForFirebase(changes));
  } catch (e) {
    console.warn('RTDB tx save error:', e);
    showToast('Не удалось сохранить в облако', 'error');
  }
}

async function saveSubs() {
  lsSet('expenses_data', data);
  if (!currentUser || !window._fbSet) return;
  try {
    await window._fbSet(window._fbRef(window._fbDb, userPath('subscriptions')), cleanForFirebase(data.subscriptions || []));
  } catch (e) { console.warn('RTDB subscriptions save error:', e); }
}

// Full overwrite — only for "clear all data"
async function saveData() {
  lsSet('expenses_data', data);
  if (!currentUser || !window._fbSet) return;
  try {
    await window._fbSet(window._fbRef(window._fbDb, userPath('transactions')), cleanForFirebase(txMap(data.transactions)));
    await window._fbSet(window._fbRef(window._fbDb, userPath('subscriptions')), cleanForFirebase(data.subscriptions || []));
  } catch (e) { console.warn('RTDB save error:', e); }
}

// Real-time listener reference for cleanup
let _unsubscribe = null; // Firebase onValue unsubscribe function
let _migratedToMap = false;

async function waitForFirebase() {
  // Wait up to 5s for Firebase module to load
  for (let i = 0; i < 50; i++) {
    if (window._fbGet && window._fbOnValue && window._fbRef) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

// Instant render from the per-user localStorage cache
function loadCache() {
  // Settings first: transactions are normalized against the account list
  const cachedSettings = lsGet('expenses_settings', '{}');
  if (cachedSettings && typeof cachedSettings === 'object') {
    settings = { ...settings, ...cachedSettings };
  }
  ensureSettings();
  const cached = lsGet('expenses_data', '{"transactions":[]}') || {};
  data = {
    transactions: normalizeTxList(cached.transactions),
    subscriptions: Array.isArray(cached.subscriptions) ? cached.subscriptions : []
  };
  const cachedGoals = lsGet('goals_data', '[]');
  goalsData = Array.isArray(cachedGoals) ? cachedGoals : [];
  const cachedDebts = lsGet('debts_data', '[]');
  debtsData = Array.isArray(cachedDebts) ? cachedDebts : [];
}

async function loadFromDB() {
  if (!currentUser) return;

  // Wait for Firebase to be ready
  const ready = await waitForFirebase();
  if (!ready) {
    console.warn('Firebase not ready, using cache only');
    showToast('Офлайн режим', 'error');
    return;
  }

  // Load settings + goals + subscriptions once
  try {
    const dbRef = window._fbRef(window._fbDb);

    const settSnap = await window._fbGet(window._fbChild(dbRef, userPath('settings')));
    if (settSnap.exists() && settSnap.val()) {
      settings = { ...settings, ...settSnap.val() };
    }
    ensureSettings();
    lsSet('expenses_settings', settings);

    const goalsSnap = await window._fbGet(window._fbChild(dbRef, userPath('goals')));
    if (goalsSnap.exists() && goalsSnap.val()) {
      const val = goalsSnap.val();
      goalsData = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
    } else {
      // Deleted on another device — don't resurrect goals from the local cache
      goalsData = [];
    }
    lsSet('goals_data', goalsData);

    const debtsSnap = await window._fbGet(window._fbChild(dbRef, userPath('debts')));
    if (debtsSnap.exists() && debtsSnap.val()) {
      const val = debtsSnap.val();
      debtsData = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
    } else {
      debtsData = [];
    }
    lsSet('debts_data', debtsData);

    const subSnap = await window._fbGet(window._fbChild(dbRef, userPath('subscriptions')));
    if (subSnap.exists() && subSnap.val()) {
      const val = subSnap.val();
      data.subscriptions = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
    } else {
      data.subscriptions = [];
    }
  } catch (e) { console.warn('Settings/goals/subs load error:', e); }

  // Subscribe to real-time transactions updates
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

  return new Promise((resolve) => {
    let firstLoad = true;
    const uid = currentUser.uid;
    const txRef = window._fbRef(window._fbDb, userPath('transactions'));

    _unsubscribe = window._fbOnValue(txRef, (snap) => {
      if (!currentUser || currentUser.uid !== uid) return;
      const before = txSignature(data.transactions);
      const val = snap.exists() ? snap.val() : null;
      let isLegacyFormat = false;

      if (val) {
        const raw = Array.isArray(val) ? val : Object.values(val);
        data.transactions = normalizeTxList(raw);
        // Old format: a plain array, or keys that don't match tx ids
        isLegacyFormat = Array.isArray(val) ||
          data.transactions.length !== Object.keys(val).length ||
          data.transactions.some(t => !Object.prototype.hasOwnProperty.call(val, t.id));
      } else {
        data.transactions = [];
      }
      lsSet('expenses_data', data);
      refreshAll();
      renderHistory();

      if (isLegacyFormat && !_migratedToMap) {
        _migratedToMap = true;
        console.log('Migrating transactions to id-keyed map');
        window._fbSet(txRef, cleanForFirebase(txMap(data.transactions)))
          .catch(e => console.warn('Migration error:', e));
      }

      if (firstLoad) {
        firstLoad = false;
        console.log('✅ Synced:', data.transactions.length, 'transactions');
        resolve();
      } else if (txSignature(data.transactions) !== before) {
        // Local writes also fire onValue — only announce real remote changes
        showToast('🔄 Синхронизировано', 'success');
      }
    }, (err) => {
      console.error('RTDB error:', err.code, err.message);
      showToast('Ошибка синхронизации: ' + err.code, 'error');
      resolve();
    });
  });
}

async function saveGoalsToFirestore() {
  lsSet('goals_data', goalsData);
  if (currentUser && window._fbSet) {
    try {
      await window._fbSet(window._fbRef(window._fbDb, userPath('goals')), goalsData || []);
    } catch (e) { console.warn('RTDB goals save error:', e); }
  }
}

async function saveSettingsToFirestore() {
  lsSet('expenses_settings', settings);
  if (currentUser && window._fbSet) {
    try {
      await window._fbSet(window._fbRef(window._fbDb, userPath('settings')), settings);
    } catch (e) { console.warn('RTDB settings save error:', e); }
  }
}

function refreshAll() {
  data.transactions.sort(compareTx);
  renderHome();
  // Refresh plan tab if it's visible
  if (document.getElementById('tab-plan').classList.contains('active')) renderPlanTab();
}

// ==============================
// BUDGET PLAN TAB
// ==============================

// planCatBudgets: { catId: number } — stored inside settings
function getPlanBudgets() {
  return settings.planCatBudgets || {};
}

function onPlanBudgetInput() {
  // Live-update day card as user types
  renderPlanDayCard();
}

function savePlanBudget() {
  const val = parseFloat(document.getElementById('planTotalBudget').value) || 0;
  settings.monthBudget = val;
  saveSettingsToFirestore();
  renderPlanTab();
  // Also update home budget progress bar
  refreshAll();
  showToast('Бюджет сохранён ✓', 'success');
}

function savePlanCatBudget(catId, val) {
  if (!settings.planCatBudgets) settings.planCatBudgets = {};
  settings.planCatBudgets[catId] = parseFloat(val) || 0;
  saveSettingsToFirestore();
  renderPlanOverview();
  renderPlanCats();
}

function renderPlanTab() {
  // Sync total budget input
  const inp = document.getElementById('planTotalBudget');
  if (inp && !inp.matches(':focus')) inp.value = settings.monthBudget || '';
  renderRollover();
  renderPlanDayCard();
  renderPlanOverview();
  renderPlanCats();
}

function getCurrentMonthSpent() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  return data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'expense');
}

function renderPlanDayCard() {
  const valEl = document.getElementById('planDayValue');
  const subEl = document.getElementById('planDaySub');
  if (!valEl || !subEl) return;

  const totalBudget = parseFloat(document.getElementById('planTotalBudget')?.value) || settings.monthBudget || 0;
  if (!totalBudget) {
    valEl.textContent = '—';
    subEl.textContent = 'Установите бюджет выше';
    return;
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1; // include today

  const txMonth = getCurrentMonthSpent();
  const spentSoFar = txMonth.reduce((s, t) => s + t.amount, 0);
  const remaining = totalBudget - spentSoFar;
  const perDay = daysLeft > 0 ? Math.max(remaining / daysLeft, 0) : 0;

  valEl.textContent = formatNum(Math.round(perDay)) + ' ' + CUR();
  const pct = totalBudget > 0 ? Math.round(spentSoFar / totalBudget * 100) : 0;
  if (remaining <= 0) {
    valEl.style.color = 'var(--accent2)';
    subEl.textContent = '⚠️ Бюджет превышен!';
  } else {
    valEl.style.color = 'var(--accent3)';
    subEl.textContent = `Осталось ${daysLeft} дн. · Потрачено ${pct}% бюджета`;
  }
}

function renderPlanOverview() {
  const el = document.getElementById('planOverviewGrid');
  if (!el) return;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const txMonth = getCurrentMonthSpent();
  const spent = txMonth.reduce((s, t) => s + t.amount, 0);
  const budget = activeBudget();
  const remaining = Math.max(budget - spent, 0);
  const planBudgets = getPlanBudgets();
  const totalPlanned = Object.values(planBudgets).reduce((s, v) => s + v, 0);
  const cur = CUR();

  const cards = [
    { label: 'Бюджет месяца', value: budget > 0 ? formatNum(budget) + ' ' + cur : '—', color: 'var(--text)' },
    { label: 'Потрачено', value: formatNum(spent) + ' ' + cur, color: 'var(--accent2)' },
    { label: 'Осталось', value: budget > 0 ? formatNum(remaining) + ' ' + cur : '—', color: 'var(--accent3)' },
    { label: 'Запланировано по кат.', value: totalPlanned > 0 ? formatNum(totalPlanned) + ' ' + cur : '—', color: 'var(--accent4)' },
  ];

  el.innerHTML = cards.map(c => `
    <div class="plan-ov-card" style="--ov-color:${c.color}">
      <div class="plan-ov-label">${c.label}</div>
      <div class="plan-ov-value" style="color:${c.color}">${c.value}</div>
    </div>
  `).join('');
}

function renderPlanCats() {
  const container = document.getElementById('planCatsList');
  if (!container) return;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const txMonth = getCurrentMonthSpent();

  // Compute spent per category this month
  const spentByCat = {};
  txMonth.forEach(t => {
    spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount;
  });

  const planBudgets = getPlanBudgets();
  const cur = CUR();

  // Show all expense categories (exclude 'income')
  const expCats = CATS.filter(c => c.id !== 'income');

  container.innerHTML = expCats.map(cat => {
    const planned = planBudgets[cat.id] || 0;
    const spent = spentByCat[cat.id] || 0;
    const pct = planned > 0 ? Math.min(Math.round(spent / planned * 100), 100) : 0;
    const overPct = planned > 0 && spent > planned ? Math.round(spent / planned * 100) : pct;
    const isOver = planned > 0 && spent > planned;
    const isWarn = planned > 0 && pct >= 75 && !isOver;
    const fillClass = isOver ? 'over' : isWarn ? 'warn' : 'safe';
    const badgeClass = isOver ? 'over' : isWarn ? 'warn' : 'ok';
    const badgeText = isOver ? '⚠️ Превышено' : isWarn ? '⚡ Почти' : (spent > 0 ? '✓ Ок' : '');

    return `<div class="plan-cat-row">
      <div class="plan-cat-header">
        <span class="plan-cat-icon">${cat.icon}</span>
        <span class="plan-cat-name">${cat.label}${badgeText ? `<span class="plan-status-badge ${badgeClass}">${badgeText}</span>` : ''}</span>
        <span class="plan-cat-amounts">${formatNum(spent)} / ${planned > 0 ? formatNum(planned) : '—'} ${cur}</span>
      </div>
      <input class="plan-cat-input" type="number" inputmode="decimal"
        id="planCat_${cat.id}"
        placeholder="Лимит для «${cat.label}»..."
        value="${planned || ''}"
        onchange="savePlanCatBudget('${cat.id}', this.value)">
      ${planned > 0 ? `<div class="plan-cat-track">
        <div class="plan-cat-fill ${fillClass}" style="width:${Math.min(overPct, 100)}%"></div>
      </div>` : ''}
    </div>`;
  }).join('');
}

async function loadPlanAiAdvice() {
  const textEl = document.getElementById('planAiText');
  const btn = document.getElementById('planAiBtn');
  if (!textEl) return;

  if (data.transactions.length < 2) {
    textEl.textContent = 'Добавьте больше расходов для анализа 📊';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Думаю...'; }
  textEl.innerHTML = '<div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>';

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const txMonth = getCurrentMonthSpent();
  const spent = txMonth.reduce((s, t) => s + t.amount, 0);
  const budget = activeBudget();
  const planBudgets = getPlanBudgets();
  const daysLeft = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() - now.getDate() + 1;
  const cur = CUR();

  // Spent by category
  const spentByCat = {};
  txMonth.forEach(t => { spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount; });

  const catLines = CATS.filter(c => c.id !== 'income').map(cat => {
    const s = spentByCat[cat.id] || 0;
    const p = planBudgets[cat.id] || 0;
    if (!s && !p) return null;
    const status = p > 0 ? (s > p ? ' ⚠️ПРЕВЫШЕНО' : s >= p*0.75 ? ' ⚡почти' : '') : '';
    return `${cat.label}: потрачено ${formatNum(s)} ${cur}${p > 0 ? `, лимит ${formatNum(p)} ${cur}${status}` : ' (лимит не задан)'}`;
  }).filter(Boolean).join('\n');

  const prompt = `Ты финансовый советник. Дай 3-4 конкретных совета по бюджету пользователя. Будь дружелюбен, используй числа из данных. Без markdown, без звёздочек, по-русски.

ОБЩИЙ БЮДЖЕТ: ${budget > 0 ? formatNum(budget) + ' ' + cur : 'не задан'}
ПОТРАЧЕНО ЗА МЕСЯЦ: ${formatNum(spent)} ${cur}
ОСТАЛОСЬ ДНЕЙ В МЕСЯЦЕ: ${daysLeft}
ДОСТУПНО В ДЕНЬ: ${budget > 0 ? formatNum(Math.max((budget - spent) / daysLeft, 0)) + ' ' + cur : 'бюджет не задан'}

ПО КАТЕГОРИЯМ:
${catLines || 'нет данных по категориям'}

Дай практические советы: где нужно сократить, что идёт хорошо, и как распределить оставшийся бюджет до конца месяца.`;

  try {
    const text = await callAi(prompt);
    textEl.textContent = text || 'Ответ не получен';
  } catch(e) {
    textEl.textContent = 'Ошибка: ' + e.message;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Получить совет'; }
  }
}

async function handleImportFile(e, typeHint) {
  // typeHint: 'json' or 'csv' — passed from inline handler
  const file = e.target.files[0];
  if (!file) return;
  // Try UTF-8 first, fallback to Windows-1251 for files from Google Sheets/Excel
  e.target.value = ''; // allow picking the same file again
  let text;
  const buf = await file.arrayBuffer();
  try {
    // Strict UTF-8 throws on invalid bytes -> the file is Windows-1251 (Excel on Windows)
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (err) {
    text = new TextDecoder('windows-1251').decode(buf);
  }
  let imported = [];

  try {
    if (typeHint === 'json' || file.name.endsWith('.json')) {
      // JSON format from our own export
      const parsed = JSON.parse(text);
      imported = parsed.transactions || parsed || [];
      if (!Array.isArray(imported)) throw new Error('Неверный формат JSON');

    } else if (typeHint === 'csv' || file.name.endsWith('.csv')) {
      // Remove BOM if present
      const cleanText = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
      const lines = cleanText.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV файл пустой или содержит только заголовки');

      // Auto-detect delimiter: comma or semicolon
      const delim = lines[0].includes(';') ? ';' : ',';

      function parseLine(line) {
        const result = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote ""
            else inQ = !inQ;
            continue;
          }
          if (line[i] === delim && !inQ) { result.push(cur.trim()); cur = ''; continue; }
          cur += line[i];
        }
        result.push(cur.trim());
        return result;
      }

      const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
      console.log('CSV headers:', headers);

      // Flexible column detection
      // Exact match first, then partial
      const iDate = headers.findIndex(h => h === 'дата' || h === 'date') >= 0
        ? headers.findIndex(h => h === 'дата' || h === 'date')
        : headers.findIndex(h => h.includes('дат') || h.includes('date'));

      const iName = headers.findIndex(h => h.includes('статья') || h === 'название' || h === 'name' || h.includes('назван') || h.includes('опис'));

      // Amount: "Расход" column (not "Статья расходов")
      const iAmt = (() => {
        // Try exact match first
        let i = headers.findIndex(h => h === 'расход' || h === 'сумма' || h === 'amount');
        if (i >= 0) return i;
        // Partial — but skip if contains "статья"
        return headers.findIndex(h =>
          (h.includes('расход') && !h.includes('статья')) ||
          h.includes('сумм') || h.includes('sum')
        );
      })();

      const iType = headers.findIndex(h => h.includes('тип') || h === 'type');
      const iCat = headers.findIndex(h => h.includes('катег') || h === 'category');
      const iNote = headers.findIndex(h => h.includes('замет') || h.includes('note') || h.includes('коммент'));

      console.log('Columns: date=' + iDate + ' name=' + iName + ' amt=' + iAmt + ' type=' + iType);

      // If no headers found — try positional (col 0=date, 1=name, 2=amount)
      const usePositional = iDate < 0 && iName < 0 && iAmt < 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.every(c => !c)) continue;

        const dateRaw = usePositional ? cols[0] : (iDate >= 0 ? cols[iDate] : '');
        const name = usePositional ? (cols[1] || 'Импорт') : (iName >= 0 ? cols[iName] : 'Импорт');
        const amtRaw = usePositional ? cols[2] : (iAmt >= 0 ? cols[iAmt] : '0');
        const amount = parseFloat((amtRaw || '0').replace(/\s/g, '').replace(',', '.')) || 0;
        const typeRaw = iType >= 0 ? cols[iType] : '';
        const catRaw = iCat >= 0 ? cols[iCat] : '';
        const note = iNote >= 0 ? (cols[iNote] || '') : '';

        if (!amount || !name) continue;

        // Normalize date: DD.MM.YYYY or YYYY-MM-DD
        let date = dateRaw || '';
        if (date.includes('.')) {
          const p = date.split('.');
          if (p.length === 3) {
            date = p[2].length === 4
              ? `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`
              : `20${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          }
        }
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = dateKey();
        }

        const typeStr = typeRaw.toLowerCase();
        const type = typeStr.includes('доход') || typeStr.includes('income') ? 'income' : 'expense';
        const catStr = catRaw.toLowerCase();
        const cat = CATS.find(c => catStr.includes(c.label.toLowerCase()) || catStr === c.id)
          || CATS[CATS.length - 1];

        imported.push({
          id: Date.now().toString() + '_' + i,
          date, name, amount, note, type,
          category: type === 'income' ? 'income' : cat.id,
          synced: true
        });
      }

      console.log('CSV parsed:', imported.length, 'rows');
    }

    imported = normalizeTxList(imported);

    if (!imported.length) {
      const msg = typeHint === 'csv'
        ? `CSV не распознан. Строк: ${text.split('\n').length}. Первая строка: "${text.split('\n')[0].slice(0, 80)}"`
        : 'JSON: нет массива транзакций';
      showToast(msg, 'error');
      console.error('Import debug — raw text start:', text.slice(0, 300));
      return;
    }

    // Deduplicate by date+name+amount
    const existing = new Set(data.transactions.map(t => `${t.date}|${t.name}|${t.amount}`));
    const newTxs = imported.filter(t => !existing.has(`${t.date}|${t.name}|${t.amount}`));

    if (!newTxs.length) {
      showToast('Все записи уже существуют', 'error');
      return;
    }

    const existingIds = new Set(data.transactions.map(t => t.id));
    newTxs.forEach(t => { if (existingIds.has(t.id)) t.id = newId(); });
    data.transactions = [...data.transactions, ...newTxs];

    await persistTx(txMap(newTxs));
    refreshAll();
    renderHistory();
    showToast(`Импортировано ${newTxs.length} записей ✓`, 'success');

  } catch (err) {
    showToast('Ошибка импорта: ' + err.message, 'error');
    console.error('Import error:', err);
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'expenses_' + dateKey() + '.json';
  a.click();
}

function exportCSV() {
  const cur = CUR();
  const rows = [['Дата', 'Название', 'Сумма', 'Валюта', 'Тип', 'Категория', 'Счёт', 'Заметка']];
  const sorted = [...data.transactions].sort((a, b) => a.date > b.date ? -1 : 1);
  sorted.forEach(t => {
    const cat = getCat(t.category);
    rows.push([
      t.date,
      `"${(t.name || '').replace(/"/g, '""')}"`,
      t.amount,
      cur,
      t.type === 'income' ? 'Доход' : t.type === 'transfer' ? 'Перевод' : 'Расход',
      cat.label,
      `"${accountLabelFor(t)}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'expenses_' + dateKey() + '.csv';
  a.click();
  showToast('CSV скачан ✓', 'success');
}

function accountLabelFor(t) {
  const from = getAccount(t.account).name;
  return t.type === 'transfer' ? `${from} → ${getAccount(t.toAccount).name}` : from;
}

function exportExcel() {
  const cur = CUR();
  const sorted = [...data.transactions].sort((a, b) => a.date > b.date ? -1 : 1);

  // Group by month for summary sheet
  const byMonth = {};
  sorted.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
    if (t.type === 'income') byMonth[m].income += t.amount;
    else byMonth[m].expense += t.amount;
  });

  const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Build transactions sheet rows
  const txRows = sorted.map(t => {
    const cat = getCat(t.category);
    return `<Row>
  <Cell><Data ss:Type="String">${esc(t.date)}</Data></Cell>
  <Cell><Data ss:Type="String">${esc(t.name)}</Data></Cell>
  <Cell ss:StyleID="money"><Data ss:Type="Number">${t.amount}</Data></Cell>
  <Cell><Data ss:Type="String">${cur}</Data></Cell>
  <Cell><Data ss:Type="String">${t.type === 'income' ? 'Доход' : t.type === 'transfer' ? 'Перевод' : 'Расход'}</Data></Cell>
  <Cell><Data ss:Type="String">${esc(cat.label)}</Data></Cell>
  <Cell><Data ss:Type="String">${esc(accountLabelFor(t))}</Data></Cell>
  <Cell><Data ss:Type="String">${esc(t.note)}</Data></Cell>
</Row>`;
  }).join('');

  // Build summary sheet rows
  const summaryRows = Object.entries(byMonth).sort((a, b) => b[0] > a[0] ? 1 : -1).map(([m, v]) => {
    const [y, mo] = m.split('-');
    const label = MONTH_NAMES[parseInt(mo) - 1] + ' ' + y;
    return `<Row>
  <Cell><Data ss:Type="String">${esc(label)}</Data></Cell>
  <Cell ss:StyleID="money"><Data ss:Type="Number">${v.income}</Data></Cell>
  <Cell ss:StyleID="money"><Data ss:Type="Number">${v.expense}</Data></Cell>
  <Cell ss:StyleID="money"><Data ss:Type="Number">${v.income - v.expense}</Data></Cell>
</Row>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
<Style ss:ID="header">
  <Font ss:Bold="1" ss:Color="#FFFFFF"/>
  <Interior ss:Color="#7C6DFA" ss:Pattern="Solid"/>
  
</Style>
<Style ss:ID="money">
  <NumberFormat ss:Format="#,##0.00"/>
</Style>
  </Styles>
  <Worksheet ss:Name="Транзакции">
<Table>
  <Row ss:StyleID="header">
    <Cell><Data ss:Type="String">Дата</Data></Cell>
    <Cell><Data ss:Type="String">Название</Data></Cell>
    <Cell><Data ss:Type="String">Сумма</Data></Cell>
    <Cell><Data ss:Type="String">Валюта</Data></Cell>
    <Cell><Data ss:Type="String">Тип</Data></Cell>
    <Cell><Data ss:Type="String">Категория</Data></Cell>
    <Cell><Data ss:Type="String">Счёт</Data></Cell>
    <Cell><Data ss:Type="String">Заметка</Data></Cell>
  </Row>
  ${txRows}
</Table>
  </Worksheet>
  <Worksheet ss:Name="Сводка по месяцам">
<Table>
  <Row ss:StyleID="header">
    <Cell><Data ss:Type="String">Месяц</Data></Cell>
    <Cell><Data ss:Type="String">Доходы (${cur})</Data></Cell>
    <Cell><Data ss:Type="String">Расходы (${cur})</Data></Cell>
    <Cell><Data ss:Type="String">Баланс (${cur})</Data></Cell>
  </Row>
  ${summaryRows}
</Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'expenses_' + dateKey() + '.xls';
  a.click();
  showToast('Excel скачан ✓', 'success');
}

function clearData() {
  openConfirm({
    icon: 'trash',
    title: 'Удалить все записи, цели и долги?',
    text: 'Отменить это будет нельзя. Счета и подписки останутся.',
    okText: 'Очистить',
    onOk: async () => {
      data = { transactions: [], subscriptions: data.subscriptions || [] };
      goalsData = [];
      debtsData = [];
      await saveData();
      saveGoalsData();
      saveDebtsData();
      refreshAll();
      renderHistory();
      showToast('Данные очищены', 'error');
    }
  });
}


// ==============================
// CURRENCY
// ==============================
const CURRENCIES = {
  TJS: { code: 'TJS', symbol: 'сом', name: 'Сомони' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Рубль' },
  USD: { code: 'USD', symbol: '$', name: 'Доллар' },
  EUR: { code: 'EUR', symbol: '€', name: 'Евро' },
  KZT: { code: 'KZT', symbol: '₸', name: 'Тенге' },
  UZS: { code: 'UZS', symbol: 'сум', name: 'Сум' },
  KGS: { code: 'KGS', symbol: 'с', name: 'Сом кыргызский' },
};

function CUR() {
  return settings.currency || 'сом';
}

function updateCurrencyUI() {
  const sym = CUR();
  document.querySelectorAll('.cur').forEach(el => el.textContent = sym);
  const lbl = document.getElementById('currencyLabel');
  if (lbl) lbl.textContent = sym;
  const btn = document.getElementById('currencySettingsBtn');
  if (btn) btn.textContent = sym;
}

function selectCurrency(code, symbol, display) {
  settings.currency = symbol;
  settings.currencyCode = code;
  saveSettingsToFirestore();
  document.getElementById('currencyModal').style.display = 'none';
  updateCurrencyUI();
  refreshAll();
  showToast('Валюта: ' + display + ' ✓', 'success');
}

function showCurrencyModal() {
  document.getElementById('currencyModal').style.display = 'flex';
}


// ==============================
// FLOATING COINS ANIMATION
// ==============================
function spawnCoins() {
  const container = document.getElementById('coinsContainer');
  if (!container) return;
  const symbols = ['💰', '💵', '💴', '💶', '💷', '🪙', '💎', '✨', '💸'];
  const count = 18;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'coin';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const left = Math.random() * 100;
    const duration = 4 + Math.random() * 8;
    const delay = Math.random() * 8;
    const size = 16 + Math.random() * 20;
    el.style.cssText = `left:${left}%;font-size:${size}px;animation-duration:${duration}s;animation-delay:${delay}s`;
    container.appendChild(el);
  }
}

// ==============================
// GREETING
// ==============================
function updateGreeting() {
  const el = document.getElementById('headerGreeting');
  if (!el) return;
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const name = currentUser ? (currentUser.displayName || '').split(' ')[0] : '';
  el.textContent = name ? `${greeting}, ${name}! 👋` : `${greeting}! 👋`;
}

// ==============================
// SMART ANALYTICS WIDGET
// ==============================
function renderSmartWidget() {
  const el = document.getElementById('smartWidget');
  if (!el) return;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const txThis = data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'expense');
  const txPrev = data.transactions.filter(t => t.date.startsWith(prevMonth) && t.type === 'expense');
  const sumThis = txThis.reduce((s, t) => s + t.amount, 0);
  const sumPrev = txPrev.reduce((s, t) => s + t.amount, 0);

  const today = dateKey(now);
  const todayTxs = data.transactions.filter(t => t.date === today && t.type === 'expense');
  const todaySum = todayTxs.reduce((s, t) => s + t.amount, 0);

  // Avg daily spend this month
  const dayOfMonth = now.getDate();
  const avgDaily = dayOfMonth > 0 ? Math.round(sumThis / dayOfMonth) : 0;

  // Projected end-of-month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = Math.round(avgDaily * daysInMonth);

  // Top category this month
  const byCat = {};
  txThis.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const topCatEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const topCat = topCatEntry ? getCat(topCatEntry[0]) : null;

  // Month-over-month change
  const momChange = sumPrev > 0 ? Math.round((sumThis - sumPrev) / sumPrev * 100) : null;
  const momText = momChange === null ? '—' : (momChange > 0 ? `▲ +${momChange}%` : `▼ ${Math.abs(momChange)}%`);
  const momCls = momChange === null ? '' : momChange > 0 ? 'sw-trend-up' : 'sw-trend-down';

  // Budget progress
  const budget = activeBudget();
  const budgetPct = budget > 0 ? Math.min(Math.round(sumThis / budget * 100), 100) : 0;
  const budgetColor = budgetPct < 60 ? 'var(--accent3)' : budgetPct < 90 ? 'var(--accent4)' : 'var(--accent2)';

  const cur = CUR();

  el.innerHTML = `
<div class="sw-card">
  <div class="sw-icon">📅</div>
  <div class="sw-label">Этот месяц</div>
  <div class="sw-value" style="color:var(--accent2)">${formatNum(sumThis)}</div>
  <div class="sw-sub ${momCls}">${momText} vs прошлый</div>
</div>
<div class="sw-card">
  <div class="sw-icon">☀️</div>
  <div class="sw-label">Сегодня</div>
  <div class="sw-value" style="color:var(--accent4)">${formatNum(todaySum)}</div>
  <div class="sw-sub">среднее: ${formatNum(avgDaily)} ${cur}/день</div>
</div>
<div class="sw-card">
  <div class="sw-icon">🔮</div>
  <div class="sw-label">Прогноз на месяц</div>
  <div class="sw-value">${formatNum(projected)}</div>
  <div class="sw-sub">при текущем темпе</div>
</div>
<div class="sw-card">
  <div class="sw-icon">${topCat ? topCat.icon : '📊'}</div>
  <div class="sw-label">Топ категория</div>
  <div class="sw-value" style="font-size:var(--fs-3);color:${topCat ? topCat.color : 'var(--text2)'}">${topCat ? topCat.label : '—'}</div>
  <div class="sw-sub">${topCatEntry ? formatNum(topCatEntry[1]) + ' ' + cur : 'нет данных'}</div>
</div>
${budget > 0 ? `
<div class="sw-card wide" style="--sw-color:${budgetColor}">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="sw-label">💰 Бюджет месяца</div>
      <div style="font-size:13px;font-weight:700;margin-top:4px">${formatNum(sumThis)} из ${formatNum(budget)} ${cur}</div>
    </div>
    <div style="font-size:20px;font-weight:800;color:${budgetColor}">${budgetPct}%</div>
  </div>
  <div class="sw-bar-wrap">
    <div class="sw-bar-fill" style="width:${budgetPct}%;background:${budgetColor}"></div>
  </div>
</div>` : ''}
  `;
}



// ==============================
// THEME
// ==============================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = ic(isLight ? 'sun' : 'moon');
  settings.theme = isLight ? 'light' : 'dark';
  // Save to localStorage immediately for instant apply on reload
  lsSet('expenses_settings', settings);
  saveSettingsToFirestore();
  repaintForTheme();
}

// Data colours are picked per theme, so everything on screen must be redrawn
function repaintForTheme() {
  if (!currentUser) return;
  refreshAll();
  renderHistory();
  if (_currentNav === 'analytics') renderAnalytics();
  if (_currentNav === 'goals') renderGoals();
  if (_currentNav === 'plan') renderPlanTab();
  if (_currentNav === 'settings') { renderAccountsSettings(); renderCustomCats(); }
}

function applyTheme() {
  const isLight = settings.theme === 'light';
  document.body.classList.toggle('light', isLight);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = ic(isLight ? 'sun' : 'moon');
}

// ==============================
// AI
// ==============================
// Провайдеры говорят на одном языке: у Gemini есть endpoint, совместимый
// с OpenAI, поэтому запрос и ответ одинаковые — меняются только адрес и модели.
//
// Имена моделей у всех провайдеров живут недолго («model does not exist»),
// поэтому список перебирается сверху вниз до первой ответившей.
const AI_PROVIDERS = {
  gemini: {
    label: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    keyPath: 'config/geminiKey',
    text: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'],
    vision: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
  },
  groq: {
    label: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    keyPath: 'config/groqKey',
    text: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    vision: ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct']
  }
};

let _aiEndpoint = null;

async function fbReady() {
  for (let i = 0; i < 20; i++) {
    if (window._fbGet && window._fbRef && window._fbDb) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

async function fbConfigValue(path) {
  if (!(await fbReady())) {
    console.warn('Firebase not ready to read ' + path);
    return null;
  }
  try {
    const snap = await window._fbGet(window._fbRef(window._fbDb, path));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error(path + ' read error:', e.code, e.message);
    return null;
  }
}

// Что лежит в базе: aiProvider/aiKey/aiProxy, старые groqKey и groqProxy тоже понимаем
async function getAiEndpoint() {
  if (_aiEndpoint) return _aiEndpoint;

  const [explicit, aiProxy, groqProxy, aiKey, geminiKey, groqKey] = await Promise.all([
    fbConfigValue('config/aiProvider'),
    fbConfigValue('config/aiProxy'),
    fbConfigValue('config/groqProxy'),
    fbConfigValue('config/aiKey'),
    fbConfigValue('config/geminiKey'),
    fbConfigValue('config/groqKey')
  ]);

  const asked = String(explicit || '').toLowerCase();
  const name = AI_PROVIDERS[asked] ? asked : (geminiKey ? 'gemini' : 'groq');
  const provider = AI_PROVIDERS[name];
  const proxy = aiProxy || groqProxy;
  const key = aiKey || (name === 'gemini' ? geminiKey : groqKey);

  if (typeof proxy === 'string' && /^https:\/\//.test(proxy)) {
    _aiEndpoint = { name, provider, url: proxy.trim(), proxy: true };
  } else if (key) {
    _aiEndpoint = { name, provider, url: provider.url, key: String(key).trim() };
  } else {
    console.warn('AI key not found: положи ключ в config/aiKey или ' + provider.keyPath);
    return null;
  }
  return _aiEndpoint;
}

// Всё, что говорит с моделью, идёт сюда
async function aiRequest(body) {
  const ep = await getAiEndpoint();
  if (!ep) throw new Error('Нет ключа для ИИ. Проверь Firebase: config/aiKey или config/aiProxy');
  const headers = { 'Content-Type': 'application/json' };
  if (ep.proxy) {
    // Прокси сам проверяет, кто зовёт, — ему нужен токен входа
    const token = currentUser && currentUser.getIdToken ? await currentUser.getIdToken() : '';
    if (token) headers['Authorization'] = 'Bearer ' + token;
  } else {
    headers['Authorization'] = 'Bearer ' + ep.key;
  }
  const res = await fetch(ep.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({ error: { message: 'HTTP ' + res.status } }));
  if (json.error) throw new Error(json.error.message || ('HTTP ' + res.status));
  return json;
}

// Перебирает модели провайдера, пока одна не ответит
async function aiComplete(kind, messages, maxTokens, temperature) {
  const ep = await getAiEndpoint();
  if (!ep) throw new Error('Нет ключа для ИИ. Проверь Firebase: config/aiKey или config/aiProxy');
  const models = ep.provider[kind] || [];
  let lastErr = null;
  for (const model of models) {
    try {
      const json = await aiRequest({ model, messages, max_tokens: maxTokens, temperature });
      const text = json.choices && json.choices[0] && json.choices[0].message.content;
      if (text) return text;
      lastErr = new Error('Пустой ответ модели');
    } catch (e) {
      // «model does not exist» — просто пробуем следующую
      lastErr = e;
    }
  }
  throw lastErr || new Error('Ни одна модель не ответила');
}

async function callAi(prompt) {
  // Каждый вызов начинается с чистого листа — истории нет
  return aiComplete('text', [
    { role: 'system', content: 'Ты финансовый помощник. Отвечай кратко, по-русски, без markdown.' },
    { role: 'user', content: prompt }
  ], 400, 0.7);
}

function renderAiTab() {
  // Render mini stats on AI tab
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const txThis = data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'expense');
  const sumThis = txThis.reduce((s, t) => s + t.amount, 0);
  const incThis = data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const total = data.transactions.length;
  const cur = CUR();

  const el = document.getElementById('aiStatsSummary');
  if (!el) return;
  el.innerHTML = [
    { icon: '💸', label: 'Расходы', val: formatNum(sumThis) + ' ' + cur },
    { icon: '💰', label: 'Доходы', val: formatNum(incThis) + ' ' + cur },
    { icon: '📝', label: 'Записей', val: total }
  ].map(s => `
<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center">
  <div style="font-size:20px">${s.icon}</div>
  <div style="font-size:10px;color:var(--text2);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">${s.label}</div>
  <div style="font-size:13px;font-weight:700;margin-top:2px">${s.val}</div>
</div>
  `).join('');
}

async function loadAiInsights() {
  const el = document.getElementById('aiText');
  if (!el) return;
  if (data.transactions.length < 3) {
    el.textContent = 'Добавь больше записей для анализа 📊';
    return;
  }

  const btn = document.getElementById('aiAnalyzeBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; btn.textContent = 'Анализирую…'; }
  const aiCard = document.getElementById('aiResultCard');
  if (aiCard) aiCard.classList.add('generating');
  const t0 = Date.now();
  el.innerHTML = '<div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>';

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const txThis = data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'expense');
  const txPrev = data.transactions.filter(t => t.date.startsWith(prevMonth) && t.type === 'expense');
  const incThis = data.transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'income');
  const sumThis = txThis.reduce((s, t) => s + t.amount, 0);
  const sumPrev = txPrev.reduce((s, t) => s + t.amount, 0);
  const incSumThis = incThis.reduce((s, t) => s + t.amount, 0);

  // All categories this month
  const byCat = {};
  txThis.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const allCats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => {
      const cat = CATS.find(c => c.id === id);
      const pct = sumThis > 0 ? Math.round(v / sumThis * 100) : 0;
      return `${cat?.label || id}: ${formatNum(v)} ${CUR()} (${pct}%)`;
    }).join('\n');

  // Day of month and daily average
  const dayOfMonth = now.getDate();
  const avgDaily = dayOfMonth > 0 ? Math.round(sumThis / dayOfMonth) : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = avgDaily * daysInMonth;

  // Month change
  const momChange = sumPrev > 0 ? Math.round((sumThis - sumPrev) / sumPrev * 100) : null;
  const momText = momChange !== null ? `${momChange > 0 ? '+' : ''}${momChange}%` : 'нет данных';

  // Top single expense
  const topTx = [...txThis].sort((a, b) => b.amount - a.amount)[0];

  const today = dateKey(now);
  const todaySum = data.transactions.filter(t => t.date === today && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const cur = CUR();
  const prompt = `Ты личный финансовый аналитик. Проанализируй расходы пользователя и дай 3-4 предложения с конкретными цифрами и советом. Без markdown, без звёздочек, на русском языке.

ДАННЫЕ ЗА ТЕКУЩИЙ МЕСЯЦ:
- Расходы: ${formatNum(sumThis)} ${cur} (${momText} к прошлому месяцу)
- Доходы: ${formatNum(incSumThis)} ${cur}
- Прошлый месяц расходы: ${formatNum(sumPrev)} ${cur}
- Сегодня потрачено: ${formatNum(todaySum)} ${cur}
- Среднее в день: ${formatNum(avgDaily)} ${cur}
- Прогноз на конец месяца: ${formatNum(projected)} ${cur}
${activeBudget() ? `- Бюджет: ${formatNum(activeBudget())} ${cur} (использовано ${Math.round(sumThis / activeBudget() * 100)}%)` : ''}
- День месяца: ${dayOfMonth} из ${daysInMonth}

РАСХОДЫ ПО КАТЕГОРИЯМ:
${allCats || 'нет данных'}
${topTx ? `\nСамая крупная трата: ${topTx.name} — ${formatNum(topTx.amount)} ${cur}` : ''}

Напиши живой, дружелюбный анализ с конкретными цифрами из данных выше. Укажи что хорошо и что можно улучшить.`;

  const budgetPct = activeBudget() ? Math.round(sumThis / activeBudget() * 100) : 0;
  if (budgetPct >= 85) {
    document.documentElement.style.setProperty('--accent', 'var(--accent2)');
  } else {
    document.documentElement.style.removeProperty('--accent');
  }

  try {
    const text = await callAi(prompt);
    el.textContent = text || 'Нет ответа';
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const timeEl = document.getElementById('aiLoadTime');
    if (timeEl) timeEl.textContent = elapsed + 'с';
  } catch (e) {
    el.textContent = 'Ошибка: ' + e.message;
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = ic('search') + ' Анализировать расходы'; }
    if (aiCard) aiCard.classList.remove('generating');
  }
}

// ==============================
// ALERTS & NOTIFICATIONS
// ==============================
function dismissedAlerts() {
  const v = lsGet('dismissed_alerts', '[]');
  return Array.isArray(v) ? v : [];
}

function dismissAlert(id) {
  const list = dismissedAlerts();
  if (!list.includes(id)) list.push(id);
  lsSet('dismissed_alerts', list.slice(-50));
  renderAlerts();
}

// Budget thresholds and subscriptions that are about to be charged
function getAlerts() {
  const alerts = [];
  const now = new Date();
  const cm = dateKey(now).slice(0, 7);

  const budget = activeBudget();
  if (budget > 0) {
    const spent = data.transactions
      .filter(t => t.date.startsWith(cm) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const pct = Math.round(spent / budget * 100);
    if (pct >= 100) {
      alerts.push({
        id: 'budget100:' + cm, level: 'over', icon: 'alert-circle',
        title: 'Бюджет месяца превышен',
        text: `Потрачено ${formatNum(spent)} из ${formatNum(budget)} ${CUR()}`
      });
    } else if (pct >= 80) {
      alerts.push({
        id: 'budget80:' + cm, level: 'warn', icon: 'alert-triangle',
        title: `Использовано ${pct}% бюджета`,
        text: `Осталось ${formatNum(budget - spent)} ${CUR()} до конца месяца`
      });
    }
  }

  (debtsData || []).forEach(debt => {
    if (debt.closed) return;
    const days = daysUntil(debt.due);
    if (days === null || days > 3) return;
    const lent = debt.type === 'lent';
    alerts.push({
      id: `debt:${debt.id}:${dateKey()}`,
      level: days < 0 ? 'warn' : 'info',
      icon: 'wallet',
      title: `${lent ? 'Долг вам' : 'Ваш долг'}: ${debt.person} — ${formatNum(debtLeft(debt))} ${CUR()}`,
      text: days < 0 ? `Просрочено на ${Math.abs(days)} дн.`
        : days === 0 ? 'Вернуть сегодня' : `Вернуть через ${days} дн.`
    });
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  (data.subscriptions || []).forEach(sub => {
    const day = Math.min(Math.max(parseInt(sub.day) || 1, 1), daysInMonth);
    const left = day - now.getDate();
    if (left >= 0 && left <= 3 && sub.lastProcessedMonth !== cm) {
      const word = sub.type === 'income' ? 'Поступление' : 'Списание';
      alerts.push({
        id: `sub:${sub.id}:${cm}`, level: 'info', icon: 'repeat',
        title: `${sub.name} — ${sub.type === 'income' ? '+' : ''}${formatNum(sub.amount)} ${CUR()}`,
        text: left === 0 ? `${word} сегодня` : `${word} через ${left} дн.`
      });
    }
  });

  return alerts;
}

function renderAlerts() {
  const box = document.getElementById('alertsBox');
  if (!box) return [];
  const dismissed = dismissedAlerts();
  const alerts = getAlerts().filter(a => !dismissed.includes(a.id));
  box.innerHTML = alerts.map(a => `
    <div class="alert-card ${a.level}">
      <span class="alert-icon">${ic(a.icon)}</span>
      <div class="alert-body">
        <div class="alert-title">${escapeHtml(a.title)}</div>
        <div class="alert-text">${escapeHtml(a.text)}</div>
      </div>
      <button class="alert-close" title="Скрыть" onclick="dismissAlert('${a.id}')">${ic('close')}</button>
    </div>`).join('');
  box.style.display = alerts.length ? 'flex' : 'none';
  return alerts;
}

function notifyPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

async function pushNotification(title, body, tag) {
  if (notifyPermission() !== 'granted' || settings.notify === false) return false;
  try {
    const reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, { body, tag, icon: 'icon-192.png', badge: 'icon-192.png' });
    } else {
      new Notification(title, { body, tag, icon: 'icon-192.png' });
    }
    return true;
  } catch (e) {
    console.warn('Notification error:', e);
    return false;
  }
}

// Shows the in-app cards and sends each alert to the system only once
function checkAlerts() {
  const alerts = renderAlerts();
  const sentRaw = lsGet('notified_alerts', '[]');
  const sent = Array.isArray(sentRaw) ? sentRaw : [];
  alerts.forEach(a => {
    if (sent.includes(a.id)) return;
    sent.push(a.id);
    pushNotification(a.title, a.text, a.id);
  });
  lsSet('notified_alerts', sent.slice(-50));
}

async function enableNotifications() {
  if (!('Notification' in window)) { showToast('Браузер не поддерживает уведомления', 'error'); return; }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  settings.notify = perm === 'granted';
  saveSettingsToFirestore();
  renderNotifySettings();
  if (perm === 'granted') {
    showToast('Уведомления включены ✓', 'success');
    checkAlerts();
  } else {
    showToast('Уведомления запрещены в настройках браузера', 'error');
  }
}

function renderNotifySettings() {
  const btn = document.getElementById('notifyBtn');
  const status = document.getElementById('notifyStatus');
  if (!btn || !status) return;
  const perm = notifyPermission();
  if (perm === 'unsupported') {
    btn.style.display = 'none';
    status.textContent = 'Этот браузер не умеет показывать уведомления.';
    return;
  }
  btn.style.display = '';
  if (perm === 'granted') {
    btn.textContent = '✓ Уведомления разрешены';
    btn.style.color = 'var(--accent3)';
    btn.style.borderColor = 'var(--accent3)';
  } else {
    btn.textContent = 'Включить уведомления';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
  status.textContent = perm === 'denied'
    ? 'Уведомления заблокированы в настройках браузера — разрешите их для этого сайта.'
    : 'Предупреждаем, когда потрачено 80% и 100% бюджета, и за 3 дня до регулярного платежа. Приходят, пока приложение открыто или свёрнуто.';
}

// ==============================
// SUBSCRIPTIONS
// ==============================
function openSubModal() {
  document.getElementById('subModal').style.display = 'flex';
  renderSubs();
  const catSel = document.getElementById('subCat');
  catSel.innerHTML = CATS.filter(c => c.id !== 'income').map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
}
function closeSubModal() {
  document.getElementById('subModal').style.display = 'none';
}
function renderSubs() {
  const list = document.getElementById('subList');
  if (!data.subscriptions || data.subscriptions.length === 0) {
    list.innerHTML = '<div style="font-size:13px;color:var(--text2);text-align:center;">Нет регулярных платежей</div>';
    return;
  }
  list.innerHTML = data.subscriptions.map(s => {
    const isIncome = s.type === 'income';
    const cat = getCat(isIncome ? 'income' : s.category);
    return `<div style="display:flex;align-items:center;background:var(--surface2);padding:10px 14px;border-radius:12px;gap:10px;border:1px solid var(--border)">
  <div style="font-size:20px;width:32px;height:32px;border-radius:8px;background:${cat.color}22;display:flex;align-items:center;justify-content:center">${cat.icon}</div>
  <div style="flex:1">
    <div style="font-size:14px;font-weight:600">${escapeHtml(s.name)}</div>
    <div style="font-size:11px;color:var(--text2)">Каждое ${escapeHtml(s.day)}-е число</div>
  </div>
  <div style="font-size:14px;font-weight:700;color:${isIncome ? 'var(--accent3)' : 'var(--accent2)'}">${isIncome ? '+' : '−'}${formatNum(s.amount)} ${CUR()}</div>
  <button onclick="deleteSub('${s.id}')" title="Удалить платёж"
        style="background:none;border:none;color:var(--text2);cursor:pointer;padding:4px">${ic('close')}</button>
</div>`;
  }).join('');
}
let subType = 'expense';

// Зарплата 5-го числа — такой же регулярный платёж, только со знаком плюс
function setSubType(type) {
  subType = type === 'income' ? 'income' : 'expense';
  const expBtn = document.getElementById('subTypeExpense');
  const incBtn = document.getElementById('subTypeIncome');
  if (expBtn) expBtn.classList.toggle('selected', subType === 'expense');
  if (incBtn) incBtn.classList.toggle('selected', subType === 'income');
  // Доход всегда попадает в категорию «Доход», выбирать нечего
  const catField = document.getElementById('subCatField');
  if (catField) catField.style.display = subType === 'income' ? 'none' : '';
}

function addSub() {
  const name = document.getElementById('subName').value.trim();
  const amt = parseFloat(document.getElementById('subAmount').value);
  const day = parseInt(document.getElementById('subDay').value);
  const cat = document.getElementById('subCat').value;

  if (!name || isNaN(amt) || isNaN(day) || day < 1 || day > 31) {
    showToast('Проверьте данные подписки', 'error'); return;
  }

  if (!data.subscriptions) data.subscriptions = [];
  data.subscriptions.push({
    id: 'sub_' + Date.now().toString(36),
    name, amount: amt, day,
    type: subType,
    category: subType === 'income' ? 'income' : cat,
    // Charges start with the current month, never retroactively
    startMonth: dateKey().slice(0, 7),
    lastProcessedMonth: null
  });

  saveSubs();
  renderSubs();
  document.getElementById('subName').value = '';
  document.getElementById('subAmount').value = '';
  document.getElementById('subDay').value = '';
  setSubType('expense');
  showToast(subType === 'income' ? 'Регулярный доход добавлен' : 'Подписка добавлена', 'success');
  processSubscriptions();
}
function deleteSub(id) {
  const sub = (data.subscriptions || []).find(s => s.id === id);
  if (!sub) return;
  openConfirm({
    icon: 'repeat',
    title: `Удалить платёж «${sub.name}»?`,
    text: 'Уже созданные операции останутся в истории',
    onOk: () => {
      data.subscriptions = data.subscriptions.filter(s => s.id !== id);
      saveSubs();
      renderSubs();
      showToast('Удалено', 'error');
    }
  });
}
function nextMonth(mk) {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m, 1); // m is 1-based, so this is the next month
  return dateKey(d).slice(0, 7);
}

// Every month from `from` to `to` inclusive (capped, so a stale date can't flood the list)
function monthsRange(from, to, max = 24) {
  const list = [];
  let cur = from;
  while (cur <= to && list.length < max) {
    list.push(cur);
    cur = nextMonth(cur);
  }
  return list;
}

function processSubscriptions() {
  if (!data.subscriptions || data.subscriptions.length === 0) return;
  const now = new Date();
  const cm = dateKey(now).slice(0, 7);
  const changes = {};
  let subsChanged = false;

  data.subscriptions.forEach(sub => {
    const subId = String(sub.id).replace(/[^\w-]/g, '');
    const last = /^\d{4}-\d{2}$/.test(sub.lastProcessedMonth || '') ? sub.lastProcessedMonth : null;
    const start = /^\d{4}-\d{2}$/.test(sub.startMonth || '') ? sub.startMonth : cm;
    // Months the app was not opened in are charged too
    const from = last ? nextMonth(last) : start;
    if (from > cm) return;

    monthsRange(from, cm).forEach(mk => {
      const [y, m] = mk.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      // A payment on the 29th–31st falls back to the last day of shorter months
      const day = Math.min(Math.max(parseInt(sub.day) || 1, 1), daysInMonth);
      // Inside the current month wait until the payment day actually arrives
      if (mk === cm && now.getDate() < day) return;

      // Deterministic id: two devices processing the same month write the same record
      const id = `tx_sub_${subId}_${mk}`;
      if (!data.transactions.some(t => t.id === id)) {
        const isIncome = sub.type === 'income';
        const tx = normalizeTx({
          id,
          type: isIncome ? 'income' : 'expense',
          amount: sub.amount,
          category: isIncome ? 'income' : sub.category,
          name: sub.name,
          account: sub.account || defaultAccountId(),
          date: `${mk}-${pad2(day)}`,
          note: isIncome ? 'Регулярный доход' : 'Автоплатеж (Подписка)'
        });
        if (tx) { data.transactions.push(tx); changes[id] = tx; }
      }
      sub.lastProcessedMonth = mk;
      subsChanged = true;
    });
  });

  if (subsChanged) saveSubs();
  const added = Object.keys(changes).length;
  if (added) {
    persistTx(changes);
    refreshAll();
    showToast(`Сработали регулярные платежи: ${added} 🔄`, 'success');
  }
}

// Re-check alerts when the app comes back to the foreground
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentUser) {
    processSubscriptions();
    checkAlerts();
  }
});

// ==============================
// SERVICE WORKER
// ==============================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // On the very first install clients.claim() also fires controllerchange — don't reload then
      const hadController = !!navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.register('sw.js');

      // When a new SW is found — activate it immediately
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version ready — reload to apply
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Reload once new SW has taken control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController && !refreshing) { refreshing = true; window.location.reload(); }
      });

      // Force check for update every time page loads
      reg.update();
    } catch (e) {
      console.log('SW error', e);
    }
  });
}

// ==============================
// START
// ==============================
init();
