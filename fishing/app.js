'use strict';

const STORAGE_KEY      = 'angler_gas_url';
const MOCK_EVENTS_KEY  = 'angler_mock_events';
const MOCK_CATCHES_KEY = 'angler_mock_catches';

const SPECIES_LIST = [
  'アジ', 'サバ', 'イワシ', 'メバル', 'カサゴ', 'タチウオ', 'シーバス', 'マダイ',
  'ヒラメ', 'ブリ', 'ハマチ', 'カツオ', 'ハゼ', 'キス', 'イカ',
  'ネンブツダイ', 'カレイ', 'メジナ', 'ベラ', 'カイワリ', 'フグ',
  'その他',
];

const SPECIES_ICON = {
  'アジ': 'fish', 'サバ': 'fish', 'イワシ': 'fish', 'メバル': 'fish',
  'カサゴ': 'fish', 'タチウオ': 'eel', 'シーバス': 'fish', 'マダイ': 'fish',
  'ヒラメ': 'fish', 'ブリ': 'fish', 'ハマチ': 'fish', 'カツオ': 'fish',
  'ハゼ': 'fish', 'キス': 'fish', 'イカ': 'squid',
  'ネンブツダイ': 'fish', 'カレイ': 'fish', 'メジナ': 'fish',
  'ベラ': 'fish', 'カイワリ': 'fish', 'フグ': 'pufferfish',
  'その他': 'question',
};

function speciesIconSvg(name, cls) {
  const id = SPECIES_ICON[name] || 'fish';
  return `<svg class="icon ${cls || ''}"><use href="#icon-${id}"/></svg>`;
}

const CHART_PALETTE = ['#00c8b4', '#ff6040', '#ffc844', '#7c5cff', '#4ade80', '#38bdf8', '#f472b6', '#fb923c'];

// ── DOM refs ─────────────────────────────────────────────────
const els = {
  settings:       document.getElementById('settings'),
  toggleSettings: document.getElementById('toggleSettings'),
  gasUrl:         document.getElementById('gasUrl'),
  saveUrl:        document.getElementById('saveUrl'),
  connStatus:     document.getElementById('connStatus'),
  appNav:         document.getElementById('appNav'),
  navBack:        document.getElementById('navBack'),
  navShowForm:    document.getElementById('navShowForm'),
  eventsScreen:   document.getElementById('eventsScreen'),
  catchScreen:    document.getElementById('catchScreen'),
  eventBanner:    document.getElementById('eventBanner'),
  quickCatchForm: document.getElementById('quickCatchForm'),
  speciesGrid:         document.getElementById('speciesGrid'),
  speciesPrompt:       document.getElementById('speciesPrompt'),
  speciesInput:        document.getElementById('speciesInput'),
  customSpeciesInput:  document.getElementById('customSpeciesInput'),
  countBtns:      document.getElementById('countBtns'),
  countInput:     document.getElementById('countInput'),
  photoInput:     document.getElementById('photoInput'),
  photoPreview:   document.getElementById('photoPreview'),
  photoThumb:     document.getElementById('photoThumb'),
  removePhoto:    document.getElementById('removePhoto'),
  catchSubmitBtn: document.getElementById('catchSubmitBtn'),
  catchesList:    document.getElementById('catchesList'),
  statTotalCatch:   document.getElementById('statTotalCatch'),
  statMonthlyCatch: document.getElementById('statMonthlyCatch'),
  statTotalCost:    document.getElementById('statTotalCost'),
  statTotalTrips:   document.getElementById('statTotalTrips'),
  trendChart:   document.getElementById('trendChart'),
  speciesChart: document.getElementById('speciesChart'),
  spotChart:    document.getElementById('spotChart'),
  heatmap:      document.getElementById('heatmap'),
  eventForm:       document.getElementById('eventForm'),
  eventFormTitle:  document.getElementById('eventFormTitle'),
  eventSubmitBtn:  document.getElementById('eventSubmitBtn'),
  cancelEventEdit: document.getElementById('cancelEventEdit'),
  eventsList:   document.getElementById('eventsList'),
  catchModal:     document.getElementById('catchModal'),
  catchEditForm:  document.getElementById('catchEditForm'),
  catchModalClose: document.getElementById('catchModalClose'),
  modalBackdrop:  document.getElementById('modalBackdrop'),
  spotList:   document.getElementById('spotList'),
  targetList: document.getElementById('targetList'),
  demoNotice: document.getElementById('demoNotice'),
  resetDemo:  document.getElementById('resetDemo'),
};

// ── State ─────────────────────────────────────────────────────
let currentEvents  = [];
let currentCatches = [];
let activeEvent    = null;
let selectedSpecies = '';
let selectedCount   = 0;
let pendingPhotoDataUrl = null;
let currentScreen  = 'events'; // 'events' | 'catches'
let heatmapSpeciesFilter = ''; // '' = 全魚種

let trendChartInst   = null;
let speciesChartInst = null;
let spotChartInst    = null;

// ── Mock / Demo mode ──────────────────────────────────────────
function isMockMode() { return !getGasUrl(); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function mockLoad() {
  const stored = localStorage.getItem(MOCK_EVENTS_KEY);
  if (stored === null) {
    const sample = buildSampleData();
    mockSave(sample.events, sample.catches);
    return sample;
  }
  return {
    events:  JSON.parse(stored),
    catches: JSON.parse(localStorage.getItem(MOCK_CATCHES_KEY) || '[]'),
  };
}

function mockSave(events, catches) {
  localStorage.setItem(MOCK_EVENTS_KEY, JSON.stringify(events));
  localStorage.setItem(MOCK_CATCHES_KEY, JSON.stringify(catches));
}

function buildSampleData() {
  const today = todayStr();
  // 2026年（今年）
  const ev1 = uid(), ev2 = uid(), ev3 = uid();
  // 2025年（前年）
  const ev4 = uid(), ev5 = uid(), ev6 = uid(), ev7 = uid(), ev8 = uid();
  return {
    events: [
      // ── 2026年 ──
      { id: ev1, date: today,        spot: '大黒海釣り公園',      area: '神奈川', style: '堤防', target: 'アジ',     weather: '晴れ', tide: '大潮', cost: '2000',  memo: '早朝アジング予定' },
      { id: ev2, date: '2026-06-14', spot: '横須賀うみかぜ公園', area: '神奈川', style: '堤防', target: 'メバル',   weather: '曇り', tide: '中潮', cost: '500',   memo: 'テトラ周りが熱かった' },
      { id: ev3, date: '2026-06-07', spot: '茅ヶ崎港',           area: '神奈川', style: '船',   target: 'カツオ',   weather: '晴れ', tide: '大潮', cost: '15000', memo: '' },
      // ── 2025年 ──
      { id: ev4, date: '2025-04-12', spot: '大黒海釣り公園',      area: '神奈川', style: '堤防', target: 'アジ',     weather: '晴れ', tide: '中潮', cost: '1800',  memo: '春アジ開幕' },
      { id: ev5, date: '2025-05-03', spot: '江の島片瀬漁港',      area: '神奈川', style: '堤防', target: 'クロダイ', weather: '曇り', tide: '大潮', cost: '3200',  memo: 'GW釣行' },
      { id: ev6, date: '2025-05-24', spot: '横須賀うみかぜ公園', area: '神奈川', style: '堤防', target: 'メバル',   weather: '晴れ', tide: '小潮', cost: '',      memo: '' },
      { id: ev7, date: '2025-07-19', spot: '茅ヶ崎港',           area: '神奈川', style: '船',   target: 'カツオ',   weather: '晴れ', tide: '大潮', cost: '18000', memo: '夏の遠征' },
      { id: ev8, date: '2025-09-06', spot: '大黒海釣り公園',      area: '神奈川', style: '堤防', target: 'タチウオ', weather: '曇り', tide: '中潮', cost: '2500',  memo: 'タチウオシーズン' },
    ],
    catches: [
      // ev1 (2026-06-20)
      { id: uid(), eventId: ev1, time: '06:12', species: 'アジ',   count: '3', size: '24', weight: '', lure: 'アジング',   point: '東側',    memo: '' },
      { id: uid(), eventId: ev1, time: '06:35', species: 'アジ',   count: '2', size: '22', weight: '', lure: 'アジング',   point: '',        memo: '' },
      { id: uid(), eventId: ev1, time: '07:10', species: 'サバ',   count: '1', size: '31', weight: '', lure: 'メタルジグ', point: '',        memo: 'いきなり引いた' },
      // ev2 (2026-06-14)
      { id: uid(), eventId: ev2, time: '19:00', species: 'メバル', count: '1', size: '18', weight: '', lure: 'ワーム',     point: 'テトラ際', memo: '' },
      { id: uid(), eventId: ev2, time: '19:30', species: 'メバル', count: '2', size: '21', weight: '', lure: 'ワーム',     point: '',        memo: '' },
      { id: uid(), eventId: ev2, time: '20:00', species: 'カサゴ', count: '1', size: '19', weight: '', lure: 'ワーム',     point: '',        memo: '' },
      // ev3 (2026-06-07)
      { id: uid(), eventId: ev3, time: '08:00', species: 'カツオ', count: '1', size: '52', weight: '', lure: 'カブラ',     point: '',        memo: '' },
      { id: uid(), eventId: ev3, time: '08:45', species: 'カツオ', count: '1', size: '48', weight: '', lure: 'カブラ',     point: '',        memo: '' },
      { id: uid(), eventId: ev3, time: '09:20', species: 'ブリ',   count: '1', size: '61', weight: '', lure: 'メタルジグ', point: '',        memo: 'でかい！！' },
      // ev4 (2025-04-12)
      { id: uid(), eventId: ev4, time: '05:50', species: 'アジ',   count: '5', size: '21', weight: '', lure: 'アジング',   point: '',        memo: '' },
      { id: uid(), eventId: ev4, time: '06:30', species: 'アジ',   count: '3', size: '23', weight: '', lure: 'アジング',   point: '',        memo: '' },
      // ev5 (2025-05-03)
      { id: uid(), eventId: ev5, time: '07:00', species: 'クロダイ', count: '1', size: '38', weight: '', lure: 'ダンゴ', point: '',        memo: 'GWの一枚' },
      { id: uid(), eventId: ev5, time: '10:30', species: 'アジ',   count: '4', size: '20', weight: '', lure: 'アジング',   point: '',        memo: '' },
      // ev6 (2025-05-24)
      { id: uid(), eventId: ev6, time: '20:00', species: 'メバル', count: '3', size: '17', weight: '', lure: 'ワーム',     point: 'テトラ際', memo: '' },
      { id: uid(), eventId: ev6, time: '21:00', species: 'メバル', count: '2', size: '20', weight: '', lure: 'ワーム',     point: '',        memo: '' },
      // ev7 (2025-07-19)
      { id: uid(), eventId: ev7, time: '07:30', species: 'カツオ', count: '2', size: '50', weight: '', lure: 'カブラ',     point: '',        memo: '' },
      { id: uid(), eventId: ev7, time: '09:00', species: 'シイラ', count: '1', size: '75', weight: '', lure: 'ポッパー',   point: '',        memo: 'でかかった！' },
      // ev8 (2025-09-06)
      { id: uid(), eventId: ev8, time: '18:30', species: 'タチウオ', count: '4', size: '110', weight: '', lure: 'テンヤ', point: '',       memo: '指3本以上ばかり' },
      { id: uid(), eventId: ev8, time: '19:15', species: 'タチウオ', count: '3', size: '95',  weight: '', lure: 'テンヤ', point: '',       memo: '' },
    ],
  };
}

function mockExec(payload) {
  const { events, catches } = mockLoad();
  const { action, id } = payload;
  const pick = (src, keys) => Object.fromEntries(keys.map(k => [k, src[k] !== undefined ? src[k] : '']));
  const EF = ['date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo'];
  const CF = ['eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'memo'];

  if      (action === 'addEvent')    { events.push({ id: payload.id || uid(), ...pick(payload, EF) }); }
  else if (action === 'updateEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events[i]  = { id, ...pick(payload, EF) }; }
  else if (action === 'deleteEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events.splice(i, 1); }
  else if (action === 'addCatch')    { catches.push({ id: payload.id || uid(), ...pick(payload, CF) }); }
  else if (action === 'updateCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches[i] = { id, ...pick(payload, CF) }; }
  else if (action === 'deleteCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches.splice(i, 1); }

  mockSave(events, catches);
}

// ── Helpers ───────────────────────────────────────────────────
function getGasUrl() { return localStorage.getItem(STORAGE_KEY) || ''; }
function setGasUrl(url) { localStorage.setItem(STORAGE_KEY, url); }

function setStatus(msg, state) {
  els.connStatus.textContent = msg;
  els.connStatus.className = 'status' + (state ? ' ' + state : '');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normDateStr(val) {
  if (!val) return '';
  const s = String(val);
  if (s.length === 10) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatDateLabel(val) {
  const s = normDateStr(val);
  if (!s) return '-';
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d.getTime())) return s;
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${s.replace(/-/g, '/')}（${days[d.getDay()]}）`;
}

function chartAxisOpts() {
  return {
    x: { ticks: { color: '#6899cc', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(100,180,255,0.12)' } },
    y: { beginAtZero: true, ticks: { color: '#6899cc', precision: 0, stepSize: 1, font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(100,180,255,0.12)' } },
  };
}

function catchTotal(catches) {
  return catches.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
}

// ── Photo helpers ─────────────────────────────────────────────
function compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function savePhoto(catchId, dataUrl)  { localStorage.setItem('angler_photo_' + catchId, dataUrl); }
function getPhoto(catchId)            { return localStorage.getItem('angler_photo_' + catchId); }
function deletePhoto(catchId)         { localStorage.removeItem('angler_photo_' + catchId); }

// ── Screen navigation ─────────────────────────────────────────
function showEventsScreen() {
  currentScreen = 'events';
  els.eventsScreen.hidden = false;
  els.catchScreen.hidden  = true;
  els.navBack.hidden      = true;
  els.navShowForm.hidden  = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCatchScreen(ev) {
  activeEvent   = ev;
  currentScreen = 'catches';
  els.eventsScreen.hidden = true;
  els.catchScreen.hidden  = false;
  els.navBack.hidden      = false;
  els.navShowForm.hidden  = true;
  resetQuickForm();
  renderEventBanner();
  renderEventCatches();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── API ───────────────────────────────────────────────────────
async function loadAll() {
  if (isMockMode()) {
    const { events, catches } = mockLoad();
    currentEvents  = events;
    currentCatches = catches;
    renderAll();
    setStatus(`デモモード（釣行 ${events.length}件・釣果 ${catchTotal(catches)}匹）`, 'demo');
    return;
  }

  const url = getGasUrl();
  if (!url) return;

  els.eventsList.innerHTML = '<p class="empty">読み込み中...</p>';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentEvents  = data.events  || [];
    currentCatches = data.catches || [];
    renderAll();
    setStatus(`接続済み（釣行 ${currentEvents.length}件・釣果 ${catchTotal(currentCatches)}匹）`, 'ok');
  } catch (err) {
    setStatus('読み込みに失敗しました: ' + err.message, 'error');
    els.eventsList.innerHTML = '<p class="empty">取得できませんでした。URLや公開設定を確認してください。</p>';
  }
}

async function sendAction(payload) {
  if (isMockMode()) {
    mockExec(payload);
    return true;
  }
  const url = getGasUrl();
  if (!url) { setStatus('先に接続設定を行ってください。', 'error'); return false; }
  try {
    await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
    return true;
  } catch (err) {
    setStatus('通信エラー: ' + err.message, 'error');
    return false;
  }
}

// ── Render ────────────────────────────────────────────────────
function renderAll() {
  renderEventsList();
  renderStats();
  renderCharts();
  renderHeatmap();
  populateDatalists();
  // Refresh catch screen if currently visible
  if (currentScreen === 'catches' && activeEvent) {
    // Sync activeEvent object in case data was reloaded
    activeEvent = currentEvents.find(e => e.id === activeEvent.id) || activeEvent;
    renderEventBanner();
    renderEventCatches();
  }
}

const EVENTS_INITIAL = 2;

function renderEventsList(expanded = false) {
  const sorted = [...currentEvents].sort(
    (a, b) => new Date(normDateStr(b.date)) - new Date(normDateStr(a.date))
  );

  if (!sorted.length) {
    els.eventsList.innerHTML = '<p class="empty">まだ釣行記録がありません。「釣行登録」から登録してみましょう。</p>';
    return;
  }

  const visible = expanded ? sorted : sorted.slice(0, EVENTS_INITIAL);
  const hiddenCount = sorted.length - EVENTS_INITIAL;

  const today = todayStr();
  els.eventsList.innerHTML = visible.map(ev => {
    const catches   = currentCatches.filter(c => c.eventId === ev.id);
    const species   = [...new Set(catches.map(c => c.species).filter(Boolean))];
    const totalCatch = catches.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
    const isToday = normDateStr(ev.date) === today;

    return `
      <article class="event-card${isToday ? ' event-card-today' : ''}">
        <div class="event-card-head">
          <div class="ec-date-row">
            ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
            <span class="ec-date">${formatDateLabel(ev.date)}</span>
          </div>
          <div class="ec-spot">${escapeHtml(ev.spot || '-')}</div>
          <div class="ec-meta">
            ${ev.style   ? `<span class="badge badge-teal">${escapeHtml(ev.style)}</span>` : ''}
            ${ev.weather ? `<span class="badge badge-outline">${escapeHtml(ev.weather)}</span>` : ''}
            ${ev.tide    ? `<span class="badge badge-outline">${escapeHtml(ev.tide)}</span>` : ''}
            ${ev.target  ? `<span class="ec-target"><svg class="icon icon-inline"><use href="#icon-target"/></svg> ${escapeHtml(ev.target)}</span>` : ''}
            ${ev.cost    ? `<span class="ec-cost">¥${Number(ev.cost).toLocaleString()}</span>` : ''}
            ${totalCatch > 0 ? `<span class="ec-total-catch">${totalCatch}匹</span>` : ''}
            ${species.map(s => `<span class="badge badge-species">${speciesIconSvg(s, 'icon-inline')} ${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
        ${ev.memo ? `<p class="ec-memo">${escapeHtml(ev.memo)}</p>` : ''}
        <div class="event-card-actions">
          <button type="button" class="btn btn-primary enter-catches-btn" data-id="${escapeHtml(ev.id)}">釣果を入力 <svg class="icon icon-inline"><use href="#icon-arrow-right"/></svg></button>
          <button type="button" class="btn btn-sm edit-event-btn" data-id="${escapeHtml(ev.id)}">編集</button>
          <button type="button" class="btn btn-sm btn-danger delete-event-btn" data-id="${escapeHtml(ev.id)}">削除</button>
        </div>
      </article>`;
  }).join('');

  if (hiddenCount > 0) {
    els.eventsList.innerHTML += `
      <button type="button" class="expand-btn" id="expandEventsBtn">
        過去の釣行をもっと見る（${hiddenCount}件）
      </button>`;
    document.getElementById('expandEventsBtn').addEventListener('click', () => renderEventsList(true));
  } else if (expanded && sorted.length > EVENTS_INITIAL) {
    els.eventsList.innerHTML += `
      <button type="button" class="expand-btn expand-btn-collapse" id="collapseEventsBtn">
        折りたたむ ▲
      </button>`;
    document.getElementById('collapseEventsBtn').addEventListener('click', () => {
      renderEventsList(false);
      els.eventsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function renderEventBanner() {
  if (!activeEvent) {
    els.eventBanner.innerHTML = '';
    els.quickCatchForm.hidden = true;
    return;
  }

  const todayCatches = currentCatches.filter(c => c.eventId === activeEvent.id);
  const total   = catchTotal(todayCatches);
  const sizes   = todayCatches.map(c => Number(c.size)).filter(Boolean);
  const maxSize = sizes.length ? Math.max(...sizes) : null;

  els.eventBanner.innerHTML = `
    <div class="active-event">
      <div class="ae-main">
        <span class="ae-date">${formatDateLabel(activeEvent.date)}</span>
        <span class="ae-spot">${escapeHtml(activeEvent.spot || '-')}</span>
        <div class="ae-meta">
          ${activeEvent.style   ? `<span class="badge badge-teal">${escapeHtml(activeEvent.style)}</span>` : ''}
          ${activeEvent.weather ? `<span class="badge badge-outline">${escapeHtml(activeEvent.weather)}</span>` : ''}
          ${activeEvent.tide    ? `<span class="badge badge-outline">${escapeHtml(activeEvent.tide)}</span>` : ''}
          ${activeEvent.target  ? `<span class="badge badge-outline"><svg class="icon icon-inline"><use href="#icon-target"/></svg> ${escapeHtml(activeEvent.target)}</span>` : ''}
        </div>
      </div>
      <div class="ae-stats">
        <div class="ae-stat">
          <span class="ae-stat-value">${total}</span>
          <span class="ae-stat-label">本日釣果</span>
        </div>
        ${maxSize ? `<div class="ae-stat">
          <span class="ae-stat-value">${maxSize}</span>
          <span class="ae-stat-label">MAX cm</span>
        </div>` : ''}
      </div>
    </div>`;

  els.quickCatchForm.hidden = false;
}

function renderEventCatches() {
  if (!activeEvent) {
    els.catchesList.innerHTML = '<p class="empty-catches">釣行が選択されていません。</p>';
    return;
  }

  const catches = currentCatches
    .filter(c => c.eventId === activeEvent.id)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  if (!catches.length) {
    els.catchesList.innerHTML = '<p class="empty-catches">まだ釣果がありません。上から記録してみましょう。</p>';
    return;
  }

  els.catchesList.innerHTML = catches.map(c => {
    const photo    = getPhoto(c.id);
    const countNum = Number(c.count) || 1;
    return `
      <div class="catch-row">
        ${photo ? `<img src="${escapeHtml(photo)}" class="catch-thumb" alt="釣果写真">` : ''}
        <span class="cr-time">${escapeHtml(c.time || '--:--')}</span>
        <span class="cr-species">${escapeHtml(c.species || '-')}</span>
        <span class="cr-count">${countNum}匹</span>
        ${c.size ? `<span class="cr-size">${escapeHtml(String(c.size))} cm</span>` : ''}
        ${c.lure ? `<span class="cr-lure">${escapeHtml(c.lure)}</span>` : ''}
        ${c.memo ? `<span class="cr-memo">${escapeHtml(c.memo)}</span>` : ''}
        <div class="cr-actions">
          <button type="button" class="icon-btn edit-catch-btn" data-id="${escapeHtml(c.id)}">編集</button>
          <button type="button" class="icon-btn delete-catch-btn" data-id="${escapeHtml(c.id)}">削除</button>
        </div>
      </div>`;
  }).join('');
}

function renderStats() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyCatches = currentCatches.filter(c => {
    const ev = currentEvents.find(e => e.id === c.eventId);
    return ev && normDateStr(ev.date).startsWith(thisMonth);
  });

  const totalCost = currentEvents.reduce((sum, ev) => sum + (Number(ev.cost) || 0), 0);

  els.statTotalCatch.textContent   = catchTotal(currentCatches);
  els.statMonthlyCatch.textContent = catchTotal(monthlyCatches);
  els.statTotalCost.textContent    = totalCost ? totalCost.toLocaleString() : '--';
  els.statTotalTrips.textContent   = currentEvents.length;
}

function renderCharts() {
  // Trip trend: monthly trip count, current year vs previous year
  const now = new Date();
  const curYear  = now.getFullYear();
  const prevYear = curYear - 1;

  const tripsByYM = {};
  currentEvents.forEach(ev => {
    const s = normDateStr(ev.date);
    if (!s) return;
    const d = new Date(s + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`; // year + 0-indexed month
    tripsByYM[key] = (tripsByYM[key] || 0) + 1;
  });

  const monthLabels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const curData  = Array.from({ length: 12 }, (_, m) => tripsByYM[`${curYear}-${m}`]  || 0);
  const prevData = Array.from({ length: 12 }, (_, m) => tripsByYM[`${prevYear}-${m}`] || 0);

  if (trendChartInst) trendChartInst.destroy();
  trendChartInst = new Chart(els.trendChart, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: `${prevYear}年`,
          data: prevData,
          backgroundColor: 'rgba(160,180,200,0.45)',
          borderColor:     'rgba(160,180,200,0.7)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: `${curYear}年`,
          data: curData,
          backgroundColor: 'rgba(0,223,200,0.75)',
          borderColor:     '#00dfc8',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#6899cc',
            font: { family: 'JetBrains Mono', size: 10 },
            boxWidth: 14,
            boxHeight: 10,
            padding: 12,
          },
        },
      },
      scales: {
        ...chartAxisOpts(),
        x: {
          ...chartAxisOpts().x,
          grouped: true,
        },
        y: {
          ...chartAxisOpts().y,
          ticks: { ...chartAxisOpts().y.ticks, stepSize: 1, precision: 0 },
        },
      },
    },
  });

  const speciesCounts = {};
  currentCatches.forEach(c => {
    const sp = (c.species || '').trim() || '不明';
    speciesCounts[sp] = (speciesCounts[sp] || 0) + (Number(c.count) || 1);
  });
  const speciesLabels = Object.keys(speciesCounts).sort((a, b) => speciesCounts[b] - speciesCounts[a]).slice(0, 10);

  if (speciesChartInst) speciesChartInst.destroy();
  if (speciesLabels.length) {
    speciesChartInst = new Chart(els.speciesChart, {
      type: 'bar',
      data: {
        labels: speciesLabels,
        datasets: [{ label: '釣果数', data: speciesLabels.map(k => speciesCounts[k]),
          backgroundColor: speciesLabels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderRadius: 6, maxBarThickness: 44 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: chartAxisOpts() },
    });
  }

  const spotCounts = {};
  currentCatches.forEach(c => {
    const ev = currentEvents.find(e => e.id === c.eventId);
    const spot = (ev?.spot || '').trim() || '不明';
    spotCounts[spot] = (spotCounts[spot] || 0) + (Number(c.count) || 1);
  });
  const spotLabels = Object.keys(spotCounts).sort((a, b) => spotCounts[b] - spotCounts[a]).slice(0, 10);

  if (spotChartInst) spotChartInst.destroy();
  if (spotLabels.length) {
    spotChartInst = new Chart(els.spotChart, {
      type: 'bar',
      data: {
        labels: spotLabels,
        datasets: [{ label: '釣果数', data: spotLabels.map(k => spotCounts[k]),
          backgroundColor: spotLabels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderRadius: 6, maxBarThickness: 44 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: chartAxisOpts() },
    });
  }
}

const HM_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
// 01時〜23時 + 24時(=00時) の24スロット
const HM_HOUR_SLOTS  = [...Array.from({ length: 23 }, (_, i) => i + 1), 0]; // 実際のhour値
const HM_HOUR_LABELS = [...Array.from({ length: 23 }, (_, i) => String(i + 1).padStart(2, '0') + '時'), '24時'];

function renderHeatmap() {
  const withTime = currentCatches.filter(c => c.time && c.eventId);

  // 魚種フィルタチップ
  const allSpecies = [...new Set(withTime.map(c => c.species).filter(Boolean))].sort();
  const filterHtml = `<div class="heatmap-filter">
    <button class="hm-chip${!heatmapSpeciesFilter ? ' hm-chip-active' : ''}" data-species="">全魚種</button>
    ${allSpecies.map(s => `<button class="hm-chip${heatmapSpeciesFilter === s ? ' hm-chip-active' : ''}" data-species="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
  </div>`;

  if (!withTime.length) {
    els.heatmap.innerHTML = filterHtml + '<p class="empty" style="margin-top:0.8rem">釣果データがありません。</p>';
    return;
  }

  const filtered = heatmapSpeciesFilter
    ? withTime.filter(c => c.species === heatmapSpeciesFilter)
    : withTime;

  if (!filtered.length) {
    els.heatmap.innerHTML = filterHtml + '<p class="empty" style="margin-top:0.8rem">該当する釣果データがありません。</p>';
    return;
  }

  // counts[monthIdx 0-11][slotIdx 0-23]
  const counts = Array.from({ length: 12 }, () => Array(24).fill(0));

  filtered.forEach(c => {
    const ev = currentEvents.find(e => e.id === c.eventId);
    if (!ev) return;
    const hour = parseInt(c.time.split(':')[0], 10);
    if (isNaN(hour)) return;
    const d = new Date(normDateStr(ev.date) + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const monthIdx = d.getMonth();
    // hour=0 → slotIdx=23(24時), hour=1〜23 → slotIdx=0〜22
    const slotIdx = hour === 0 ? 23 : hour - 1;
    counts[monthIdx][slotIdx] += (Number(c.count) || 1);
  });

  const max = Math.max(1, ...counts.flat());

  const header = `<span class="heatmap-cell heatmap-corner"></span>` +
    HM_MONTHS.map(m => `<span class="heatmap-cell heatmap-label">${m}</span>`).join('');

  const body = HM_HOUR_LABELS.map((label, si) => {
    const row = HM_MONTHS.map((m, mi) => {
      const n = counts[mi][si];
      const alpha = (0.15 + (n / max) * 0.65).toFixed(2);
      const glow  = (4 + (n / max) * 12).toFixed(0);
      const glowA = ((n / max) * 0.6).toFixed(2);
      const style = n
        ? `style="background:rgba(0,200,180,${alpha});box-shadow:0 0 ${glow}px rgba(0,200,180,${glowA})"`
        : '';
      return `<span class="heatmap-cell heatmap-value" ${style} title="${m} ${label}: ${n}匹">${n || ''}</span>`;
    }).join('');
    return `<span class="heatmap-cell heatmap-label">${label}</span>${row}`;
  }).join('');

  els.heatmap.innerHTML = filterHtml + `<div class="heatmap-wrap-inner"><div class="heatmap-grid">${header}${body}</div></div>`;
}

function populateDatalists() {
  const spots   = [...new Set(currentEvents.map(e => e.spot   || '').filter(Boolean))].sort();
  const targets = [...new Set(currentEvents.map(e => e.target || '').filter(Boolean))].sort();
  els.spotList.innerHTML   = spots.map(v => `<option value="${escapeHtml(v)}">`).join('');
  els.targetList.innerHTML = targets.map(v => `<option value="${escapeHtml(v)}">`).join('');
}

// ── Species grid ──────────────────────────────────────────────
function buildSpeciesGrid() {
  els.speciesGrid.innerHTML = SPECIES_LIST.map(name => {
    return `<button type="button" class="species-btn" data-species="${escapeHtml(name)}">
      <span class="sp-emoji">${speciesIconSvg(name)}</span>
      <span class="sp-name">${escapeHtml(name)}</span>
    </button>`;
  }).join('');
}

function updateSubmitState() {
  els.catchSubmitBtn.disabled = !selectedSpecies || !selectedCount;
}

function selectSpecies(name) {
  document.querySelectorAll('.species-btn').forEach(btn =>
    btn.classList.toggle('selected', btn.dataset.species === name)
  );
  if (name === 'その他') {
    selectedSpecies = '';
    els.speciesInput.value = '';
    els.speciesPrompt.textContent = '魚種を入力してください';
    els.customSpeciesInput.hidden = false;
    els.customSpeciesInput.value = '';
    els.customSpeciesInput.focus();
  } else {
    selectedSpecies = name;
    els.speciesInput.value = name;
    els.speciesPrompt.textContent = name + ' を選択中';
    els.customSpeciesInput.hidden = true;
    els.customSpeciesInput.value = '';
  }
  updateSubmitState();
}

function resetCountSelection() {
  selectedCount = 0;
  document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('selected'));
  els.countInput.value = '';
}

function clearPhotoInput() {
  pendingPhotoDataUrl = null;
  els.photoInput.value = '';
  els.photoPreview.hidden = true;
  els.photoThumb.src = '';
}

function resetQuickForm() {
  selectedSpecies = '';
  document.querySelectorAll('.species-btn').forEach(b => b.classList.remove('selected'));
  els.speciesInput.value = '';
  els.speciesPrompt.textContent = '魚種を選択';
  els.customSpeciesInput.hidden = true;
  els.customSpeciesInput.value = '';
  resetCountSelection();
  clearPhotoInput();
  updateSubmitState();
}

// ── Quick catch form ──────────────────────────────────────────
async function onQuickCatchSubmit(e) {
  e.preventDefault();
  if (!activeEvent || !selectedSpecies || !selectedCount) return;

  const catchId = uid();
  const payload = {
    action:  'addCatch',
    id:      catchId,
    eventId: activeEvent.id,
    time:    nowTime(),
    species: selectedSpecies,
    count:   String(selectedCount),
    size:    '',
    weight:  '',
    lure:    '',
    point:   '',
    memo:    '',
  };

  els.catchSubmitBtn.disabled = true;
  els.catchSubmitBtn.textContent = '記録中...';

  const ok = await sendAction(payload);
  if (ok) {
    if (pendingPhotoDataUrl) savePhoto(catchId, pendingPhotoDataUrl);
    setStatus(`${selectedSpecies} ${selectedCount}匹 を記録しました！ (${nowTime()})`, 'ok');
    resetCountSelection();
    clearPhotoInput();
    updateSubmitState();
  }

  els.catchSubmitBtn.disabled = !selectedSpecies || !selectedCount;
  els.catchSubmitBtn.textContent = '記録する';
  await loadAll();
}

// ── Event form ────────────────────────────────────────────────
function toggleEventForm(show) {
  const section = document.getElementById('event-form');
  section.hidden = show === undefined ? !section.hidden : !show;
  if (!section.hidden) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function enterEventEditMode(ev) {
  els.eventForm.elements['id'].value      = ev.id;
  els.eventForm.elements['date'].value    = normDateStr(ev.date);
  els.eventForm.elements['spot'].value    = ev.spot    || '';
  els.eventForm.elements['area'].value    = ev.area    || '';
  els.eventForm.elements['style'].value   = ev.style   || '';
  els.eventForm.elements['target'].value  = ev.target  || '';
  els.eventForm.elements['weather'].value = ev.weather || '';
  els.eventForm.elements['tide'].value    = ev.tide    || '';
  els.eventForm.elements['cost'].value    = ev.cost    || '';
  els.eventForm.elements['memo'].value    = ev.memo    || '';
  els.eventFormTitle.textContent  = '釣行を編集';
  els.eventSubmitBtn.textContent  = '更新する';
  els.cancelEventEdit.hidden = false;
  toggleEventForm(true);
}

function exitEventEditMode() {
  els.eventForm.reset();
  els.eventForm.elements['id'].value = '';
  els.eventFormTitle.textContent  = '釣行を登録';
  els.eventSubmitBtn.textContent  = '登録する';
  els.cancelEventEdit.hidden = true;
}

async function onEventSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.eventForm);
  const id = fd.get('id');
  const payload = {
    action:  id ? 'updateEvent' : 'addEvent',
    id,
    date:    fd.get('date'),
    spot:    fd.get('spot'),
    area:    fd.get('area'),
    style:   fd.get('style'),
    target:  fd.get('target'),
    weather: fd.get('weather'),
    tide:    fd.get('tide'),
    cost:    fd.get('cost'),
    memo:    fd.get('memo'),
  };

  els.eventSubmitBtn.disabled = true;
  els.eventSubmitBtn.textContent = id ? '更新中...' : '登録中...';

  const ok = await sendAction(payload);
  if (ok) {
    setStatus(id ? '釣行を更新しました。' : '釣行を登録しました。', 'ok');
    exitEventEditMode();
    toggleEventForm(false);
    await loadAll();
  }

  els.eventSubmitBtn.disabled = false;
  els.eventSubmitBtn.textContent = id ? '更新する' : '登録する';
}

// ── Catch edit modal ──────────────────────────────────────────
function openCatchModal(c) {
  const f = els.catchEditForm;
  f.elements['id'].value      = c.id;
  f.elements['eventId'].value = c.eventId;
  f.elements['time'].value    = c.time    || '';
  f.elements['species'].value = c.species || '';
  f.elements['count'].value   = c.count   || '';
  f.elements['size'].value    = c.size    || '';
  f.elements['weight'].value  = c.weight  || '';
  f.elements['lure'].value    = c.lure    || '';
  f.elements['point'].value   = c.point   || '';
  f.elements['memo'].value    = c.memo    || '';
  els.catchModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCatchModal() {
  els.catchModal.hidden = true;
  document.body.style.overflow = '';
  els.catchEditForm.reset();
}

async function onCatchEditSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.catchEditForm);
  const payload = {
    action:  'updateCatch',
    id:      fd.get('id'),
    eventId: fd.get('eventId'),
    time:    fd.get('time'),
    species: fd.get('species'),
    count:   fd.get('count'),
    size:    fd.get('size'),
    weight:  fd.get('weight'),
    lure:    fd.get('lure'),
    point:   fd.get('point'),
    memo:    fd.get('memo'),
  };

  const ok = await sendAction(payload);
  if (ok) {
    setStatus('釣果を更新しました。', 'ok');
    closeCatchModal();
    await loadAll();
  }
}

// ── Event delegation ──────────────────────────────────────────
async function handleEventsClick(e) {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('enter-catches-btn')) {
    const ev = currentEvents.find(e => e.id === id);
    if (ev) showCatchScreen(ev);
    return;
  }

  if (btn.classList.contains('edit-event-btn')) {
    const ev = currentEvents.find(e => e.id === id);
    if (ev) enterEventEditMode(ev);
    return;
  }

  if (btn.classList.contains('delete-event-btn')) {
    if (!confirm('この釣行とその釣果をすべて削除しますか？')) return;
    const related = currentCatches.filter(c => c.eventId === id);
    for (const c of related) {
      deletePhoto(c.id);
      await sendAction({ action: 'deleteCatch', id: c.id });
    }
    await sendAction({ action: 'deleteEvent', id });
    await loadAll();
  }
}

async function handleCatchesClick(e) {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('edit-catch-btn')) {
    const c = currentCatches.find(c => c.id === id);
    if (c) openCatchModal(c);
    return;
  }

  if (btn.classList.contains('delete-catch-btn')) {
    if (!confirm('この釣果を削除しますか？')) return;
    deletePhoto(id);
    await sendAction({ action: 'deleteCatch', id });
    await loadAll();
  }
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  buildSpeciesGrid();

  const url = getGasUrl();
  els.gasUrl.value = url;

  if (url) {
    els.settings.hidden = true;
    loadAll();
  } else {
    els.settings.hidden = false;
    els.demoNotice.hidden = false;
    loadAll();
  }

  // Nav
  els.navBack.addEventListener('click', showEventsScreen);
  els.navShowForm.addEventListener('click', () => toggleEventForm());

  // Settings
  els.saveUrl.addEventListener('click', () => {
    const val = els.gasUrl.value.trim();
    if (!val) return;
    setGasUrl(val);
    setStatus('保存しました。読み込み中...');
    els.settings.hidden = true;
    loadAll();
  });

  els.toggleSettings.addEventListener('click', () => {
    els.settings.hidden = !els.settings.hidden;
  });

  // Event list clicks (events screen)
  els.eventsList.addEventListener('click', handleEventsClick);

  // Catch list clicks (catch screen)
  els.catchesList.addEventListener('click', handleCatchesClick);

  // Species grid
  els.speciesGrid.addEventListener('click', e => {
    const btn = e.target.closest('.species-btn');
    if (btn) selectSpecies(btn.dataset.species);
  });

  // Custom species text input (その他)
  els.customSpeciesInput.addEventListener('input', () => {
    const val = els.customSpeciesInput.value.trim();
    selectedSpecies = val;
    els.speciesInput.value = val;
    els.speciesPrompt.textContent = val ? val + ' を選択中' : '魚種を入力してください';
    updateSubmitState();
  });

  // Count quick-tap buttons
  els.countBtns.addEventListener('click', e => {
    const btn = e.target.closest('.count-btn');
    if (!btn) return;
    const n = Number(btn.dataset.count);
    selectedCount = n;
    document.querySelectorAll('.count-btn').forEach(b =>
      b.classList.toggle('selected', Number(b.dataset.count) === n)
    );
    els.countInput.value = n;
    updateSubmitState();
  });

  // Count manual input
  els.countInput.addEventListener('input', () => {
    const n = parseInt(els.countInput.value, 10);
    selectedCount = isNaN(n) || n < 1 ? 0 : n;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('selected'));
    updateSubmitState();
  });

  // Photo capture
  els.photoInput.addEventListener('change', async () => {
    const file = els.photoInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      pendingPhotoDataUrl = dataUrl;
      els.photoThumb.src = dataUrl;
      els.photoPreview.hidden = false;
    } catch {
      pendingPhotoDataUrl = null;
    }
  });

  els.removePhoto.addEventListener('click', clearPhotoInput);

  // Forms
  els.quickCatchForm.addEventListener('submit', onQuickCatchSubmit);
  els.eventForm.addEventListener('submit', onEventSubmit);
  els.cancelEventEdit.addEventListener('click', () => {
    exitEventEditMode();
    toggleEventForm(false);
  });
  els.catchEditForm.addEventListener('submit', onCatchEditSubmit);
  els.catchModalClose.addEventListener('click', closeCatchModal);
  els.modalBackdrop.addEventListener('click', closeCatchModal);

  els.heatmap.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    heatmapSpeciesFilter = chip.dataset.species;
    renderHeatmap();
  });

  els.resetDemo.addEventListener('click', () => {
    if (!confirm('サンプルデータに戻しますか？現在のデータはすべて消えます。')) return;
    localStorage.removeItem(MOCK_EVENTS_KEY);
    localStorage.removeItem(MOCK_CATCHES_KEY);
    loadAll();
  });
}

init();
