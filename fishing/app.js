'use strict';

const STORAGE_KEY      = 'angler_gas_url';
const MOCK_EVENTS_KEY  = 'angler_mock_events';
const MOCK_CATCHES_KEY = 'angler_mock_catches';
const MOCK_PRICES_KEY  = 'angler_mock_prices';

const SPECIES_LIST = [
  'アジ', 'サバ', 'イワシ', 'メバル', 'カサゴ', 'タチウオ', 'シーバス', 'マダイ',
  'ヒラメ', 'ブリ', 'ハマチ', 'カツオ', 'ハゼ', 'キス', 'イカ',
  'ネンブツダイ', 'カレイ', 'メジナ', 'ベラ', 'カイワリ', 'フグ',
  'イサキ', 'タカベ', 'チヌ',
  'その他',
];

const SPECIES_ICON = {
  'アジ': 'fish', 'サバ': 'fish', 'イワシ': 'fish', 'メバル': 'fish',
  'カサゴ': 'fish', 'タチウオ': 'eel', 'シーバス': 'fish', 'マダイ': 'fish',
  'ヒラメ': 'fish', 'ブリ': 'fish', 'ハマチ': 'fish', 'カツオ': 'fish',
  'ハゼ': 'fish', 'キス': 'fish', 'イカ': 'squid',
  'ネンブツダイ': 'fish', 'カレイ': 'fish', 'メジナ': 'fish',
  'ベラ': 'fish', 'カイワリ': 'fish', 'フグ': 'pufferfish',
  'イサキ': 'fish', 'タカベ': 'fish', 'チヌ': 'fish',
  'その他': 'question',
};

function speciesIconSvg(name, cls) {
  const id = SPECIES_ICON[name] || 'fish';
  return `<svg class="icon ${cls || ''}"><use href="#icon-${id}"/></svg>`;
}

const CHART_PALETTE = ['#6C3FE0', '#9b3fd6', '#c83fc0', '#ff2d95', '#2a2a2a', '#8b8b8b', '#c2c2c2', '#4b2e9e'];

// ── DOM refs ─────────────────────────────────────────────────
const els = {
  settings:       document.getElementById('settings'),
  loginGate:      document.getElementById('loginGate'),
  loginForm:      document.getElementById('loginForm'),
  loginPassword:  document.getElementById('loginPassword'),
  loginSubmitBtn: document.getElementById('loginSubmitBtn'),
  loginError:     document.getElementById('loginError'),
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
  tideChartPanel: document.getElementById('tideChartPanel'),
  tideChart:      document.getElementById('tideChart'),
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
  editPhotoInput:   document.getElementById('editPhotoInput'),
  editPhotoPreview: document.getElementById('editPhotoPreview'),
  editPhotoThumb:   document.getElementById('editPhotoThumb'),
  editRemovePhoto:  document.getElementById('editRemovePhoto'),
  eventPhotoInput:    document.getElementById('eventPhotoInput'),
  eventPhotoSlots:    document.getElementById('eventPhotoSlots'),
  eventPhotoAddLabel: document.getElementById('eventPhotoAddLabel'),
  catchSubmitBtn: document.getElementById('catchSubmitBtn'),
  catchesList:    document.getElementById('catchesList'),
  statTotalCatch:   document.getElementById('statTotalCatch'),
  statYearlyCatch:  document.getElementById('statYearlyCatch'),
  statTotalCost:    document.getElementById('statTotalCost'),
  statFishValue:    document.getElementById('statFishValue'),
  statTotalTrips:   document.getElementById('statTotalTrips'),
  statAvgPerTrip:   document.getElementById('statAvgPerTrip'),
  trendChart:   document.getElementById('trendChart'),
  speciesChart: document.getElementById('speciesChart'),
  spotChart:    document.getElementById('spotChart'),
  heatmap:      document.getElementById('heatmap'),
  styleFilter:  document.getElementById('styleFilter'),
  eventForm:       document.getElementById('eventForm'),
  eventFormTitle:  document.getElementById('eventFormTitle'),
  eventSubmitBtn:  document.getElementById('eventSubmitBtn'),
  cancelEventEdit: document.getElementById('cancelEventEdit'),
  eventsList:   document.getElementById('eventsList'),
  catchModal:     document.getElementById('catchModal'),
  catchEditForm:  document.getElementById('catchEditForm'),
  catchModalClose: document.getElementById('catchModalClose'),
  modalBackdrop:  document.getElementById('modalBackdrop'),
  photoLightbox:        document.getElementById('photoLightbox'),
  photoLightboxImg:     document.getElementById('photoLightboxImg'),
  photoLightboxClose:   document.getElementById('photoLightboxClose'),
  photoLightboxDelete:  document.getElementById('photoLightboxDelete'),
  photoLightboxBackdrop: document.getElementById('photoLightboxBackdrop'),
  spotList:   document.getElementById('spotList'),
  targetList: document.getElementById('targetList'),
  demoNotice: document.getElementById('demoNotice'),
  resetDemo:  document.getElementById('resetDemo'),
  pricesPanel:  document.getElementById('pricesPanel'),
  togglePrices: document.getElementById('togglePrices'),
  priceGrid:    document.getElementById('priceGrid'),
  savePrices:   document.getElementById('savePrices'),
  priceStatus:  document.getElementById('priceStatus'),
  newSpeciesName:  document.getElementById('newSpeciesName'),
  newSpeciesPrice: document.getElementById('newSpeciesPrice'),
  addSpeciesBtn:   document.getElementById('addSpeciesBtn'),
};

// ── State ─────────────────────────────────────────────────────
let currentEvents  = [];
let currentCatches = [];
let currentPrices  = [];
let priceMap       = {}; // species -> 円/匹
let activeEvent    = null;
let selectedSpecies = '';
let selectedCount   = 0;
let pendingPhotoDataUrl = null;
let currentScreen  = 'events'; // 'events' | 'catches'
let heatmapSpeciesFilter = ''; // '' = 全魚種
let styleFilter = ''; // '' = すべての釣り方

function filteredEvents() {
  return styleFilter ? currentEvents.filter(ev => ev.style === styleFilter) : currentEvents;
}

function filteredCatches(events) {
  const ids = new Set((events || filteredEvents()).map(ev => ev.id));
  return currentCatches.filter(c => ids.has(c.eventId));
}

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
    mockSave(sample.events, sample.catches, sample.prices);
    return sample;
  }
  return {
    events:  JSON.parse(stored),
    catches: JSON.parse(localStorage.getItem(MOCK_CATCHES_KEY) || '[]'),
    prices:  JSON.parse(localStorage.getItem(MOCK_PRICES_KEY) || '[]'),
  };
}

function mockSave(events, catches, prices) {
  localStorage.setItem(MOCK_EVENTS_KEY, JSON.stringify(events));
  localStorage.setItem(MOCK_CATCHES_KEY, JSON.stringify(catches));
  localStorage.setItem(MOCK_PRICES_KEY, JSON.stringify(prices || []));
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
      { id: ev1, date: today,        spot: '大黒海釣り公園',      area: '神奈川', style: '堤防', target: 'アジ',     weather: '晴れ', tide: '大潮', cost: '2000',  memo: '早朝アジング予定', startTime: '06:00', endTime: '' },
      { id: ev2, date: '2026-06-14', spot: '横須賀うみかぜ公園', area: '神奈川', style: '堤防', target: 'メバル',   weather: '曇り', tide: '中潮', cost: '500',   memo: 'テトラ周りが熱かった', startTime: '18:45', endTime: '20:15' },
      { id: ev3, date: '2026-06-07', spot: '茅ヶ崎港',           area: '神奈川', style: '船',   target: 'カツオ',   weather: '晴れ', tide: '大潮', cost: '15000', memo: '' },
      // ── 2025年 ──
      { id: ev4, date: '2025-04-12', spot: '大黒海釣り公園',      area: '神奈川', style: '堤防', target: 'アジ',     weather: '晴れ', tide: '中潮', cost: '1800',  memo: '春アジ開幕', startTime: '05:30', endTime: '07:00' },
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
    prices: [
      { species: 'アジ',     price: 150 },
      { species: 'サバ',     price: 200 },
      { species: 'メバル',   price: 300 },
      { species: 'カサゴ',   price: 250 },
      { species: 'カツオ',   price: 400 },
      { species: 'ブリ',     price: 1200 },
      { species: 'タチウオ', price: 350 },
    ],
  };
}

function mockExec(payload) {
  const { events, catches, prices } = mockLoad();
  const { action, id } = payload;
  const pick = (src, keys) => Object.fromEntries(keys.map(k => [k, src[k] !== undefined ? src[k] : '']));
  const EF = ['date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo', 'startTime', 'endTime', 'photo', 'photoId', 'photo2', 'photoId2', 'photo3', 'photoId3'];
  const CF = ['eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'memo', 'photo', 'photoId'];

  if      (action === 'addEvent')    { events.push({ id: payload.id || uid(), ...pick(payload, EF) }); }
  else if (action === 'updateEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events[i]  = { id, ...pick(payload, EF) }; }
  else if (action === 'deleteEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events.splice(i, 1); }
  else if (action === 'addCatch')    { catches.push({ id: payload.id || uid(), ...pick(payload, CF) }); }
  else if (action === 'updateCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches[i] = { id, ...pick(payload, CF) }; }
  else if (action === 'deleteCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches.splice(i, 1); }
  else if (action === 'savePrice')   {
    const i = prices.findIndex(p => p.species === payload.species);
    if (i >= 0) prices[i].price = payload.price; else prices.push({ species: payload.species, price: payload.price });
  }

  mockSave(events, catches, prices);
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
    x: { ticks: { color: '#8b8b8b', font: { family: 'Lato', size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
    y: { beginAtZero: true, ticks: { color: '#8b8b8b', precision: 0, stepSize: 1, font: { family: 'Lato', size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
  };
}

function catchTotal(catches) {
  return catches.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
}

function catchValue(c) {
  return (Number(c.count) || 1) * (priceMap[c.species] || 0);
}

function catchesValue(catches) {
  return catches.reduce((sum, c) => sum + catchValue(c), 0);
}

function parseHour(timeStr) {
  // 通常は"HH:MM"形式だが、スプレッドシート側の自動型変換等で
  // ISO日時文字列が混じっても時刻部分だけ抜き出せるようにする
  if (!timeStr) return NaN;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) : NaN;
}

function formatTime(timeStr) {
  // 表示用。意図しないDate/ISO文字列が来てもHH:MM部分だけを取り出し、
  // 人間が読めない値（例: Date型の文字列化）が画面に出ないようにする
  if (!timeStr) return '';
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

function durationHours(start, end) {
  if (!start || !end) return null;
  const sm_ = String(start).match(/(\d{1,2}):(\d{2})/);
  const em_ = String(end).match(/(\d{1,2}):(\d{2})/);
  if (!sm_ || !em_) return null;
  const sh = Number(sm_[1]), sm = Number(sm_[2]);
  const eh = Number(em_[1]), em = Number(em_[2]);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // 日付をまたいだ釣行
  return mins / 60;
}

function formatDuration(hours) {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h}時間${m}分`;
  if (h) return `${h}時間`;
  return `${m}分`;
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

// 写真本体はオンライン時はGoogle Driveへアップロードし、URLのみ釣果レコードの
// photo列に保存する（デモモードはGoogle Driveに保存できないため、圧縮済みのdataURLを
// そのままphoto列に保存する＝端末ローカル限定）。
async function uploadPhotoToDrive(dataUrl, catchId) {
  const url = getGasUrl();
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'uploadPhoto', dataUrl, catchId }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || body.result !== 'ok') return null;
    return { photo: body.photoUrl, photoId: body.photoId };
  } catch {
    return null;
  }
}

async function deleteDrivePhoto(photoId, ids = {}) {
  if (isMockMode() || !photoId) return;
  await sendAction({ action: 'deletePhoto', photoId, catchId: ids.catchId || '', eventId: ids.eventId || '', photoField: ids.photoField || 'photo' });
}

// 釣行は写真を最大3枚（photo/photoId, photo2/photoId2, photo3/photoId3）まで持てる。
const EVENT_PHOTO_SUFFIXES = ['', '2', '3'];

function eventPhotoFieldNames(suffix) {
  return { field: 'photo' + suffix, idField: 'photoId' + suffix };
}

function eventPhotoSlots(ev) {
  return EVENT_PHOTO_SUFFIXES
    .map(suffix => {
      const { field, idField } = eventPhotoFieldNames(suffix);
      return { field, idField, url: ev[field], id: ev[idField] };
    })
    .filter(p => p.url);
}

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
  renderTideChart();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── API ───────────────────────────────────────────────────────
function applyPriceMap(prices) {
  currentPrices = prices || [];
  priceMap = {};
  currentPrices.forEach(p => { priceMap[p.species] = Number(p.price) || 0; });
}

async function loadAll() {
  if (isMockMode()) {
    const { events, catches, prices } = mockLoad();
    currentEvents  = events;
    currentCatches = catches;
    applyPriceMap(prices);
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
    applyPriceMap(data.prices);
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
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      setStatus(`保存に失敗しました（HTTP ${res.status}）。GAS URLや公開設定（アクセスできるユーザー: 全員）を確認してください。`, 'error');
      return false;
    }
    let body;
    try {
      body = await res.json();
    } catch {
      setStatus('保存に失敗しました（想定外の応答）。Apps Scriptのデプロイ設定やコードを確認してください。', 'error');
      return false;
    }
    if (!body || body.result !== 'ok') {
      setStatus('保存に失敗しました。Apps Script側でエラーが発生している可能性があります。', 'error');
      return false;
    }
    return true;
  } catch (err) {
    setStatus('通信エラー: ' + err.message, 'error');
    return false;
  }
}

// ── Render ────────────────────────────────────────────────────
function renderStyleFilter() {
  const allStyles = [...new Set(currentEvents.map(ev => ev.style).filter(Boolean))].sort();
  els.styleFilter.innerHTML = `
    <button class="hm-chip${!styleFilter ? ' hm-chip-active' : ''}" data-style="">すべて</button>
    ${allStyles.map(s => `<button class="hm-chip${styleFilter === s ? ' hm-chip-active' : ''}" data-style="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
  `;
}

function renderAll() {
  renderStyleFilter();
  renderEventsList();
  renderStats();
  renderCharts();
  renderHeatmap();
  populateDatalists();
  buildPriceGrid();
  buildSpeciesGrid();
  // Refresh catch screen if currently visible
  if (currentScreen === 'catches' && activeEvent) {
    // Sync activeEvent object in case data was reloaded
    activeEvent = currentEvents.find(e => e.id === activeEvent.id) || activeEvent;
    renderEventBanner();
    renderEventCatches();
    renderTideChart();
  }
}

const EVENTS_INITIAL = 2;
const collapsedMemoIds = new Set();

function renderEventsList(expanded = false) {
  const sorted = [...filteredEvents()].sort(
    (a, b) => new Date(normDateStr(b.date)) - new Date(normDateStr(a.date))
  );

  if (!sorted.length) {
    els.eventsList.innerHTML = styleFilter
      ? '<p class="empty">この釣り方の釣行記録はまだありません。</p>'
      : '<p class="empty">まだ釣行記録がありません。「釣行登録」から登録してみましょう。</p>';
    return;
  }

  const visible = expanded ? sorted : sorted.slice(0, EVENTS_INITIAL);
  const hiddenCount = sorted.length - EVENTS_INITIAL;

  const today = todayStr();
  els.eventsList.innerHTML = visible.map(ev => {
    const catches   = currentCatches.filter(c => c.eventId === ev.id);
    const species   = [...new Set(catches.map(c => c.species).filter(Boolean))];
    const totalCatch = catches.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
    const totalValue = catchesValue(catches);
    const isToday = normDateStr(ev.date) === today;
    const photos = eventPhotoSlots(ev);

    const hours = durationHours(ev.startTime, ev.endTime);
    // 極端に短い計測（誤タップ等）では時間あたり釣果が非現実的な値になるため、
    // 一定時間（10分）未満は釣果率を表示しない
    const rate  = (hours && hours >= (10 / 60) && totalCatch > 0) ? totalCatch / hours : null;

    const timeRow = `
      <div class="ec-time-row">
        ${ev.startTime
          ? `<span class="badge badge-outline ec-time-badge"><svg class="icon icon-inline"><use href="#icon-clock"/></svg>${formatTime(ev.startTime)}${ev.endTime ? '–' + formatTime(ev.endTime) : ' 〜 計測中'}</span>`
          : `<button type="button" class="btn btn-sm btn-start-trip" data-id="${escapeHtml(ev.id)}"><svg class="icon icon-inline"><use href="#icon-play"/></svg>開始</button>`}
        ${ev.startTime && !ev.endTime
          ? `<button type="button" class="btn btn-sm btn-end-trip" data-id="${escapeHtml(ev.id)}"><svg class="icon icon-inline"><use href="#icon-stop"/></svg>終了</button>`
          : ''}
        ${hours ? `<span class="badge badge-outline">${formatDuration(hours)}</span>` : ''}
        ${rate != null ? `<span class="ec-rate">${rate.toFixed(1)}匹/時間</span>` : ''}
      </div>`;

    return `
      <article class="event-card${isToday ? ' event-card-today' : ''}">
        <div class="event-card-head">
          <div class="ec-head-row">
            <div class="ec-head-main">
              <div class="ec-date-row">
                ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
                <span class="ec-date">${formatDateLabel(ev.date)}</span>
              </div>
              <div class="ec-spot-row">
                <div class="ec-spot">${escapeHtml(ev.spot || '-')}</div>
                ${photos.length ? `<div class="ec-photos">${photos.map(p => `<img src="${escapeHtml(p.url)}" class="ec-thumb" data-event-id="${escapeHtml(ev.id)}" data-photo-field="${p.field}" alt="釣行写真">`).join('')}</div>` : ''}
              </div>
              <div class="ec-meta">
                <div class="ec-meta-row">
                  ${ev.style   ? `<span class="badge badge-outline">${escapeHtml(ev.style)}</span>` : ''}
                  ${ev.weather ? `<span class="badge badge-outline">${escapeHtml(ev.weather)}</span>` : ''}
                  ${ev.tide    ? `<span class="badge badge-outline">${escapeHtml(ev.tide)}</span>` : ''}
                  <span class="ec-weather-slot" data-id="${escapeHtml(ev.id)}"></span>
                </div>
                ${(ev.target || species.length) ? `<div class="ec-meta-row">
                  ${ev.target ? `<span class="badge badge-target"><svg class="icon icon-inline"><use href="#icon-target"/></svg>${escapeHtml(ev.target)}</span>` : ''}
                  ${species.map(s => `<span class="badge badge-species">${speciesIconSvg(s, 'icon-inline')} ${escapeHtml(s)}</span>`).join('')}
                </div>` : ''}
                ${(ev.cost || totalCatch > 0 || totalValue > 0) ? `<div class="ec-meta-row">
                  ${ev.cost    ? `<span class="ec-cost">¥${Number(ev.cost).toLocaleString()}</span>` : ''}
                  ${totalCatch > 0 ? `<span class="ec-total-catch">${totalCatch}匹</span>` : ''}
                  ${totalValue > 0 ? `<span class="ec-value"><svg class="icon icon-inline"><use href="#icon-coin"/></svg>¥${totalValue.toLocaleString()}</span>` : ''}
                </div>` : ''}
              </div>
            </div>
          </div>
          ${timeRow}
        </div>
        ${ev.memo ? `
        <div class="ec-memo-row">
          <button type="button" class="ec-memo-toggle" data-id="${escapeHtml(ev.id)}">${collapsedMemoIds.has(ev.id) ? '+' : '−'}</button>
          <p class="ec-memo"${collapsedMemoIds.has(ev.id) ? ' hidden' : ''}>${escapeHtml(ev.memo)}</p>
        </div>` : ''}
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

  visible.forEach(loadEventWeather);
}

function renderEventBanner() {
  if (!activeEvent) {
    els.eventBanner.innerHTML = '';
    els.quickCatchForm.hidden = true;
    return;
  }

  const todayCatches = currentCatches.filter(c => c.eventId === activeEvent.id);
  const total   = catchTotal(todayCatches);
  const value   = catchesValue(todayCatches);
  const sizes   = todayCatches.map(c => Number(c.size)).filter(Boolean);
  const maxSize = sizes.length ? Math.max(...sizes) : null;

  els.eventBanner.innerHTML = `
    <div class="active-event">
      <div class="ae-main">
        <span class="ae-date">${formatDateLabel(activeEvent.date)}</span>
        <span class="ae-spot">${escapeHtml(activeEvent.spot || '-')}</span>
        <div class="ae-meta">
          ${activeEvent.style   ? `<span class="badge badge-outline">${escapeHtml(activeEvent.style)}</span>` : ''}
          ${activeEvent.weather ? `<span class="badge badge-outline">${escapeHtml(activeEvent.weather)}</span>` : ''}
          ${activeEvent.tide    ? `<span class="badge badge-outline">${escapeHtml(activeEvent.tide)}</span>` : ''}
          ${activeEvent.target  ? `<span class="badge badge-target"><svg class="icon icon-inline"><use href="#icon-target"/></svg>${escapeHtml(activeEvent.target)}</span>` : ''}
          <span class="ec-weather-slot" data-id="${escapeHtml(activeEvent.id)}"></span>
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
        ${value > 0 ? `<div class="ae-stat">
          <span class="ae-stat-value ae-stat-value-gold">¥${value.toLocaleString()}</span>
          <span class="ae-stat-label">推定金額</span>
        </div>` : ''}
      </div>
    </div>`;

  els.quickCatchForm.hidden = false;
  loadEventWeather(activeEvent);
}

// ── Tide chart ────────────────────────────────────────────────
let tideCache = { key: null, hours: null };

// ── Daily max/min temperature (event list) ─────────────────────
const weatherCache = {}; // key: `${area}|${date}` -> { max, min } | null

async function fetchDailyTemp(area, dateStr) {
  if (isMockMode()) return null; // デモモードはGAS経由の外部取得ができないため非対応
  const url = getGasUrl();
  if (!url) return null;
  try {
    const sep = url.indexOf('?') !== -1 ? '&' : '?';
    const res = await fetch(`${url}${sep}action=weather&area=${encodeURIComponent(area || '')}&date=${encodeURIComponent(dateStr)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.max != null || data.min != null) ? { max: data.max, min: data.min } : null;
  } catch {
    return null;
  }
}

async function loadEventWeather(ev) {
  const dateStr = normDateStr(ev.date);
  const key = `${ev.area || ''}|${dateStr}`;
  if (!(key in weatherCache)) {
    weatherCache[key] = await fetchDailyTemp(ev.area, dateStr);
  }
  const temp = weatherCache[key];
  if (!temp) return;
  const slots = document.querySelectorAll(`.ec-weather-slot[data-id="${cssEscape(ev.id)}"]`);
  slots.forEach(slot => {
    slot.innerHTML = `<span class="badge badge-outline">
      <svg class="icon icon-inline"><use href="#icon-temp"/></svg>${temp.max != null ? temp.max + '℃' : '--'} / ${temp.min != null ? temp.min + '℃' : '--'}
    </span>`;
  });
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

// 「エリア」欄の地名からおおよその緯度経度を引く（日の出/日の入り計算用）。
// 神奈川県沿岸のみ対応（GAS側のTIDE_STATIONSと同じ地名セット）。
const AREA_COORDS = {
  // 神奈川県
  '横浜':   { lat: 35.45, lon: 139.65 },
  '川崎':   { lat: 35.51, lon: 139.71 },
  '本牧':   { lat: 35.42, lon: 139.67 },
  '横須賀': { lat: 35.28, lon: 139.67 },
  '三浦':   { lat: 35.15, lon: 139.62 },
  '湘南港': { lat: 35.30, lon: 139.39 },
  '茅ヶ崎': { lat: 35.33, lon: 139.41 },
  '藤沢':   { lat: 35.34, lon: 139.49 },
  '江の島': { lat: 35.30, lon: 139.48 },
  '小田原': { lat: 35.25, lon: 139.15 },
  // 千葉県
  '銚子':   { lat: 35.73, lon: 140.83 },
  '勝浦':   { lat: 35.13, lon: 140.25 },
  '御宿':   { lat: 35.18, lon: 140.35 },
  '大原':   { lat: 35.25, lon: 140.38 },
  '鴨川':   { lat: 35.13, lon: 139.97 },
  '南房総': { lat: 34.92, lon: 139.83 },
  '館山':   { lat: 34.98, lon: 139.87 },
  '富津':   { lat: 35.30, lon: 139.83 },
  '金谷':   { lat: 35.03, lon: 139.80 },
  '保田':   { lat: 35.05, lon: 139.83 },
  '鋸南':   { lat: 35.05, lon: 139.83 },
  '木更津': { lat: 35.38, lon: 139.93 },
  '市原':   { lat: 35.50, lon: 140.07 },
  '千葉':   { lat: 35.60, lon: 140.10 },
  '船橋':   { lat: 35.70, lon: 139.98 },
  // 静岡県
  '熱海':   { lat: 35.10, lon: 139.07 },
  '伊東':   { lat: 34.97, lon: 139.10 },
  '下田':   { lat: 34.68, lon: 138.95 },
  '南伊豆': { lat: 34.62, lon: 138.85 },
  '石廊崎': { lat: 34.60, lon: 138.85 },
  '松崎':   { lat: 34.77, lon: 138.77 },
  '土肥':   { lat: 34.98, lon: 138.78 },
  '西伊豆': { lat: 34.85, lon: 138.78 },
  '沼津':   { lat: 35.10, lon: 138.86 },
  '三島':   { lat: 35.12, lon: 138.91 },
  '内浦':   { lat: 35.05, lon: 138.87 },
  '清水':   { lat: 35.02, lon: 138.49 },
  '静岡':   { lat: 34.98, lon: 138.38 },
  '焼津':   { lat: 34.87, lon: 138.32 },
  '御前崎': { lat: 34.62, lon: 138.13 },
  '浜松':   { lat: 34.71, lon: 137.73 },
  '舞阪':   { lat: 34.68, lon: 137.60 },
  '浜名湖': { lat: 34.73, lon: 137.60 },
};

function resolveAreaCoords(area) {
  if (!area) return null;
  for (const name in AREA_COORDS) {
    if (area.indexOf(name) !== -1) return AREA_COORDS[name];
  }
  return null;
}

// 簡易日の出・日の入り計算（Sunrise equation, NOAA近似式）。
// 緯度・経度・日付（JSTのカレンダー日）から、その日の日の出・日の入りを返す。
function calcSunTimes(lat, lon, dateStr) {
  const midnightUTC = new Date(`${dateStr}T00:00:00Z`);
  const J2000 = 2451545.0;
  const JD = midnightUTC.getTime() / 86400000 + 2440587.5 + 0.5; // 0h UTのJD + 0.5日

  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const mod360 = d => ((d % 360) + 360) % 360;

  const Jstar = (JD - J2000) - lon / 360;
  const M  = mod360(357.5291 + 0.98560028 * Jstar);
  const Mr = toRad(M);
  const C  = 1.9148 * Math.sin(Mr) + 0.0200 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr);
  const lambda  = mod360(M + 102.9372 + C + 180);
  const lambdaR = toRad(lambda);
  const Jtransit = J2000 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lambdaR);

  const delta = Math.asin(Math.sin(lambdaR) * Math.sin(toRad(23.4397)));
  const phi   = toRad(lat);
  const cosOmega = (Math.sin(toRad(-0.833)) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
  if (cosOmega > 1 || cosOmega < -1) return null; // 極夜・白夜（このアプリの対象地域では発生しない）

  const omega = toDeg(Math.acos(cosOmega));
  const toDate = J => new Date((J - 2440587.5) * 86400000);
  return {
    sunrise: toDate(Jtransit - omega / 360),
    sunset:  toDate(Jtransit + omega / 360),
  };
}

function formatJstTime(date) {
  return date.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });
}

function formatHourFraction(h) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function fetchTide(area, dateStr) {
  if (isMockMode()) return null; // デモモードはGAS経由の外部取得ができないため非対応
  const url = getGasUrl();
  if (!url) return null;
  try {
    const sep = url.indexOf('?') !== -1 ? '&' : '?';
    const res = await fetch(`${url}${sep}action=tide&area=${encodeURIComponent(area || '')}&date=${encodeURIComponent(dateStr)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.hours) ? data.hours : null;
  } catch {
    return null;
  }
}

// 隣接する時間と比較して、潮汐カーブの山（満潮）・谷（干潮）を検出する
function findTideExtrema(hours) {
  const valid = hours.map((v, h) => ({ h, v })).filter(p => p.v != null);
  const extrema = [];
  for (let i = 0; i < valid.length; i++) {
    const prev = valid[i - 1];
    const cur  = valid[i];
    const next = valid[i + 1];
    if (prev && next) {
      if (cur.v >= prev.v && cur.v >= next.v && cur.v > prev.v) extrema.push({ ...cur, type: 'high' });
      else if (cur.v <= prev.v && cur.v <= next.v && cur.v < prev.v) extrema.push({ ...cur, type: 'low' });
    }
  }
  return extrema;
}

function jstHourFraction(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const h = Number(parts.find(p => p.type === 'hour').value);
  const m = Number(parts.find(p => p.type === 'minute').value);
  return h + m / 60;
}

function parseHourFraction(timeStr) {
  if (!timeStr) return null;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

function buildTideChartHtml(hours, countByHour, tidePhase, sun, tripRange) {
  const points = hours
    .map((v, h) => ({ h, v }))
    .filter(p => p.v != null);

  if (!points.length) {
    return '<p class="empty">この釣行のエリアでは潮汐データを取得できませんでした。</p>';
  }

  const vals  = points.map(p => p.v);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const mid   = Math.round((min + max) / 2);
  const range = Math.max(1, max - min);
  const toY   = v => 92 - ((v - min) / range) * 80;

  const coords = points.map(p => ({ x: p.h * 10 + 5, y: toY(p.v) }));
  const pathD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${coords[coords.length - 1].x},100 L${coords[0].x},100 Z`;

  const columns = countByHour.map((n) => {
    if (!n) return '<div class="tide-col"></div>';
    const shown = Math.min(n, 5);
    const icons = Array.from({ length: shown }).map(() =>
      '<svg class="icon tide-fish"><use href="#icon-fish"/></svg>'
    ).join('');
    const extra = n > 5 ? `<span class="tide-fish-extra">+${n - 5}</span>` : '';
    return `<div class="tide-col" title="${n}匹"><div class="tide-col-icons">${icons}${extra}</div></div>`;
  }).join('');

  const axisHours = [0, 3, 6, 9, 12, 15, 18, 21];
  const axis = axisHours.map(h => `<span style="left:${((h * 10 + 5) / 240 * 100).toFixed(2)}%">${h}時</span>`).join('');

  const yAxis = `
    <span style="top:${toY(max).toFixed(1)}%">${max}cm</span>
    <span style="top:${toY(mid).toFixed(1)}%">${mid}cm</span>
    <span style="top:${toY(min).toFixed(1)}%">${min}cm</span>
  `;

  const extrema = findTideExtrema(hours);
  const extremaHtml = extrema.length
    ? `<div class="tide-extrema">
        ${extrema.map(e => `<span class="tide-extrema-item tide-extrema-${e.type}">
          ${e.type === 'high' ? '満潮' : '干潮'} ${e.h}時（${e.v}cm）
        </span>`).join('')}
      </div>`
    : '';

  const phaseHtml = tidePhase
    ? `<span class="badge badge-teal tide-phase-badge">${escapeHtml(tidePhase)}</span>`
    : '';

  let nightRects = '';
  let sunHtml = '';
  const markers = [];
  if (sun) {
    const sunriseH = jstHourFraction(sun.sunrise);
    const sunsetH  = jstHourFraction(sun.sunset);
    const x1 = Math.max(0, sunriseH * 10);
    const x2 = Math.min(240, sunsetH * 10);
    nightRects = `
      <rect class="tide-night" x="0" y="0" width="${x1.toFixed(1)}" height="100"></rect>
      <rect class="tide-night" x="${x2.toFixed(1)}" y="0" width="${(240 - x2).toFixed(1)}" height="100"></rect>
    `;
    sunHtml = `<span class="badge badge-outline tide-sun-badge">
      <svg class="icon icon-inline"><use href="#icon-sunrise"/></svg>${formatJstTime(sun.sunrise)}
      <svg class="icon icon-inline"><use href="#icon-sunset"/></svg>${formatJstTime(sun.sunset)}
    </span>`;
    markers.push({ h: sunriseH, cls: 'tide-marker-sunrise', icon: 'icon-sunrise', title: `日の出 ${formatJstTime(sun.sunrise)}` });
    markers.push({ h: sunsetH,  cls: 'tide-marker-sunset',  icon: 'icon-sunset',  title: `日の入り ${formatJstTime(sun.sunset)}` });
  }

  let tripBand = '';
  let tripHtml = '';
  if (tripRange) {
    const segments = tripRange.end >= tripRange.start
      ? [[tripRange.start, tripRange.end]]
      : [[tripRange.start, 24], [0, tripRange.end]]; // 日付をまたぐ釣行
    tripBand = segments.map(([s, e]) => {
      const x1 = Math.max(0, s * 10);
      const x2 = Math.min(240, e * 10);
      return `
        <rect class="tide-trip" x="${x1.toFixed(1)}" y="0" width="${(x2 - x1).toFixed(1)}" height="100"></rect>
        <line class="tide-trip-line" x1="${x1.toFixed(1)}" y1="0" x2="${x1.toFixed(1)}" y2="100"></line>
        <line class="tide-trip-line" x1="${x2.toFixed(1)}" y1="0" x2="${x2.toFixed(1)}" y2="100"></line>
      `;
    }).join('');
    tripHtml = `<span class="badge badge-outline tide-trip-badge">
      <svg class="icon icon-inline"><use href="#icon-play"/></svg>${formatHourFraction(tripRange.start)}
      ${tripRange.ongoing
        ? '〜 計測中'
        : `<svg class="icon icon-inline"><use href="#icon-stop"/></svg>${formatHourFraction(tripRange.end)}`}
    </span>`;
    markers.push({ h: tripRange.start, cls: 'tide-marker-start', icon: 'icon-play', title: `釣行開始 ${formatHourFraction(tripRange.start)}` });
    if (!tripRange.ongoing) {
      markers.push({ h: tripRange.end, cls: 'tide-marker-end', icon: 'icon-stop', title: `釣行終了 ${formatHourFraction(tripRange.end)}` });
    }
  }

  const markersHtml = markers.length
    ? `<div class="tide-markers">${markers.map(m => `
        <div class="tide-marker ${m.cls}" style="left:${(m.h / 24 * 100).toFixed(2)}%" title="${escapeHtml(m.title)}">
          <svg class="icon"><use href="#${m.icon}"/></svg>
        </div>`).join('')}</div>`
    : '';

  return `
    ${phaseHtml || sunHtml || tripHtml || extremaHtml ? `<div class="tide-chart-meta">${phaseHtml}${sunHtml}${tripHtml}${extremaHtml}</div>` : ''}
    <div class="tide-chart-row">
      <div class="tide-yaxis">${yAxis}</div>
      <div class="tide-chart-body">
        <svg class="tide-curve" viewBox="0 0 240 100" preserveAspectRatio="none" aria-hidden="true">
          ${nightRects}
          ${tripBand}
          <path class="tide-area" d="${areaD}"></path>
          <path class="tide-line" d="${pathD}"></path>
        </svg>
        <div class="tide-columns">${columns}</div>
        ${markersHtml}
      </div>
    </div>
    <div class="tide-axis">
      <span class="tide-axis-spacer"></span>
      <div class="tide-axis-hours">${axis}</div>
    </div>
  `;
}

async function renderTideChart() {
  if (!activeEvent) {
    els.tideChartPanel.hidden = true;
    return;
  }

  const dateStr = normDateStr(activeEvent.date);
  const key = `${activeEvent.area || ''}|${dateStr}`;
  if (tideCache.key !== key) {
    tideCache = { key, hours: await fetchTide(activeEvent.area, dateStr) };
  }

  if (!tideCache.hours) {
    els.tideChartPanel.hidden = true;
    return;
  }

  // activeEventが切り替わっている間にfetchが返ってくる場合があるため再確認
  if (!activeEvent || `${activeEvent.area || ''}|${normDateStr(activeEvent.date)}` !== key) return;

  const countByHour = Array(24).fill(0);
  currentCatches
    .filter(c => c.eventId === activeEvent.id)
    .forEach(c => {
      const h = parseHour(c.time);
      if (!isNaN(h)) countByHour[h] += Number(c.count) || 1;
    });

  els.tideChartPanel.hidden = false;
  const coords = resolveAreaCoords(activeEvent.area);
  const sun = coords ? calcSunTimes(coords.lat, coords.lon, dateStr) : null;
  let tripRange = null;
  const startH = parseHourFraction(activeEvent.startTime);
  if (startH != null) {
    const endH = parseHourFraction(activeEvent.endTime);
    const now = new Date();
    tripRange = {
      start: startH,
      end: endH != null ? endH : (now.getHours() + now.getMinutes() / 60),
      ongoing: endH == null,
    };
  }

  els.tideChart.innerHTML = buildTideChartHtml(tideCache.hours, countByHour, activeEvent.tide, sun, tripRange);
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
    const photo    = c.photo;
    const countNum = Number(c.count) || 1;
    const value    = catchValue(c);
    return `
      <div class="catch-row">
        ${photo ? `<img src="${escapeHtml(photo)}" class="catch-thumb" data-catch-id="${escapeHtml(c.id)}" alt="釣果写真">` : ''}
        <span class="cr-time">${formatTime(c.time) || '--:--'}</span>
        <span class="cr-species">${escapeHtml(c.species || '-')}</span>
        <span class="cr-count">${countNum}匹</span>
        ${value > 0 ? `<span class="cr-value">¥${value.toLocaleString()}</span>` : ''}
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

function statValueHtml(value, unit) {
  if (value === '--' || value == null) return '--';
  return `${value}<span class="stat-unit">${unit}</span>`;
}

function renderStats() {
  const now = new Date();
  const thisYear = String(now.getFullYear());
  const events  = filteredEvents();
  const catches = filteredCatches(events);

  const yearlyCatches = catches.filter(c => {
    const ev = events.find(e => e.id === c.eventId);
    return ev && normDateStr(ev.date).startsWith(thisYear);
  });

  const totalCost  = events.reduce((sum, ev) => sum + (Number(ev.cost) || 0), 0);
  const totalValue = catchesValue(catches);
  const totalCatch = catchTotal(catches);
  const totalTrips = events.length;
  const avgPerTrip = totalTrips > 0 ? totalCatch / totalTrips : null;

  els.statTotalCatch.innerHTML  = statValueHtml(totalCatch, '匹');
  els.statYearlyCatch.innerHTML = statValueHtml(catchTotal(yearlyCatches), '匹');
  els.statTotalCost.innerHTML   = statValueHtml(totalCost ? totalCost.toLocaleString() : '--', '円');
  els.statFishValue.innerHTML   = statValueHtml(totalValue ? totalValue.toLocaleString() : '--', '円');
  els.statTotalTrips.innerHTML  = statValueHtml(totalTrips, '回');
  els.statAvgPerTrip.innerHTML  = statValueHtml(avgPerTrip != null ? avgPerTrip.toFixed(1) : '--', '匹');
}

function renderCharts() {
  const events  = filteredEvents();
  const catches = filteredCatches(events);

  // Trip trend: monthly trip count, current year vs previous year
  const now = new Date();
  const curYear  = now.getFullYear();
  const prevYear = curYear - 1;

  const tripsByYM = {};
  events.forEach(ev => {
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
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderColor:     'rgba(0,0,0,0.18)',
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: `${curYear}年`,
          data: curData,
          backgroundColor: 'rgba(255,45,149,0.85)',
          borderColor:     '#ff2d95',
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
            color: '#8b8b8b',
            font: { family: 'Lato', size: 10 },
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
  catches.forEach(c => {
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
  catches.forEach(c => {
    const ev = events.find(e => e.id === c.eventId);
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
  const events  = filteredEvents();
  const withTime = filteredCatches(events).filter(c => c.time && c.eventId);

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
    const ev = events.find(e => e.id === c.eventId);
    if (!ev) return;
    const hour = parseHour(c.time);
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
      const alpha = (0.16 + (n / max) * 0.74).toFixed(2);
      const style = n
        ? `style="background:rgba(255,45,149,${alpha});color:#fff"`
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
// 組み込みの魚種リストに、単価設定で追加されたカスタム魚種を合わせたもの。
// その他は常に末尾に固定する。
function allSpeciesNames() {
  const builtIn = SPECIES_LIST.filter(s => s !== 'その他');
  const custom = new Set(currentPrices.map(p => p.species).filter(Boolean));
  builtIn.forEach(s => custom.delete(s));
  return [...builtIn, ...custom, 'その他'];
}

function buildSpeciesGrid() {
  els.speciesGrid.innerHTML = allSpeciesNames().map(name => {
    return `<button type="button" class="species-btn" data-species="${escapeHtml(name)}">
      <span class="sp-emoji">${speciesIconSvg(name)}</span>
      <span class="sp-name">${escapeHtml(name)}</span>
    </button>`;
  }).join('');
}

// ── Species unit price grid（単価設定） ─────────────────────────
function buildPriceGrid() {
  els.priceGrid.innerHTML = allSpeciesNames().filter(name => name !== 'その他').map(name => {
    const price = priceMap[name] || '';
    return `
      <label class="price-field">
        <span class="price-field-name">${speciesIconSvg(name, 'icon-inline')}${escapeHtml(name)}</span>
        <span class="price-field-input-wrap">
          <span class="price-yen">¥</span>
          <input type="number" min="0" step="10" inputmode="numeric" class="price-input"
                 data-species="${escapeHtml(name)}" value="${price}" placeholder="0">
          <span class="price-unit">/匹</span>
        </span>
      </label>`;
  }).join('');
}

async function onSavePrices() {
  const inputs = document.querySelectorAll('.price-input');
  els.savePrices.disabled = true;
  els.savePrices.textContent = '保存中...';

  let changed = 0;
  for (const input of inputs) {
    const species = input.dataset.species;
    const price = Number(input.value) || 0;
    if (price === (priceMap[species] || 0)) continue;
    const ok = await sendAction({ action: 'savePrice', species, price });
    if (ok) changed++;
  }

  els.priceStatus.textContent = changed ? `${changed}件の単価を保存しました。` : '変更はありませんでした。';
  els.priceStatus.className = 'status ok';
  els.savePrices.disabled = false;
  els.savePrices.textContent = '保存する';
  await loadAll();
  buildPriceGrid();
}

async function onAddSpecies() {
  const name = els.newSpeciesName.value.trim();
  if (!name) {
    els.priceStatus.textContent = '魚種名を入力してください。';
    els.priceStatus.className = 'status error';
    return;
  }
  const price = Number(els.newSpeciesPrice.value) || 0;

  els.addSpeciesBtn.disabled = true;
  els.addSpeciesBtn.textContent = '追加中...';

  const ok = await sendAction({ action: 'savePrice', species: name, price });

  if (ok) {
    els.priceStatus.textContent = `「${name}」を追加しました。`;
    els.priceStatus.className = 'status ok';
    els.newSpeciesName.value = '';
    els.newSpeciesPrice.value = '';
    await loadAll();
  }

  els.addSpeciesBtn.disabled = false;
  els.addSpeciesBtn.innerHTML = '<svg class="icon icon-inline"><use href="#icon-plus"/></svg>魚種を追加';
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
    photo:   '',
    photoId: '',
  };

  els.catchSubmitBtn.disabled = true;
  els.catchSubmitBtn.textContent = '記録中...';

  if (pendingPhotoDataUrl) {
    if (isMockMode()) {
      payload.photo = pendingPhotoDataUrl;
    } else {
      els.catchSubmitBtn.textContent = '写真をアップロード中...';
      const uploaded = await uploadPhotoToDrive(pendingPhotoDataUrl, catchId);
      if (uploaded) {
        payload.photo   = uploaded.photo;
        payload.photoId = uploaded.photoId;
      } else {
        setStatus('写真のアップロードに失敗しました。釣果は写真なしで記録します。', 'error');
      }
    }
  }

  const ok = await sendAction(payload);
  if (ok) {
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

// 編集中の写真スロット（最大3枚）。各要素: { field, idField, url, id, pendingDataUrl, removed }
let eventPhotoState = [];

function makeEmptyEventPhotoState() {
  return EVENT_PHOTO_SUFFIXES.map(suffix => {
    const { field, idField } = eventPhotoFieldNames(suffix);
    return { field, idField, url: '', id: '', pendingDataUrl: null, removed: false };
  });
}

function renderEventPhotoSlots() {
  const filled = eventPhotoState
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.removed && (slot.url || slot.pendingDataUrl));

  els.eventPhotoSlots.innerHTML = filled.map(({ slot, index }) => `
    <div class="photo-slot">
      <img class="photo-thumb-preview" src="${escapeHtml(slot.pendingDataUrl || slot.url)}" alt="プレビュー">
      <button type="button" class="remove-photo-btn" data-slot="${index}"><svg class="icon"><use href="#icon-close"/></svg></button>
    </div>`).join('');

  els.eventPhotoAddLabel.hidden = filled.length >= eventPhotoState.length;
}

function resetEventPhotoState() {
  eventPhotoState = makeEmptyEventPhotoState();
  els.eventPhotoInput.value = '';
  renderEventPhotoSlots();
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
  els.eventForm.elements['startTime'].value = formatTime(ev.startTime);
  els.eventForm.elements['endTime'].value   = formatTime(ev.endTime);
  els.eventFormTitle.textContent  = '釣行を編集';
  els.eventSubmitBtn.textContent  = '更新する';

  eventPhotoState = makeEmptyEventPhotoState();
  eventPhotoState.forEach(slot => {
    slot.url = ev[slot.field]   || '';
    slot.id  = ev[slot.idField] || '';
  });
  els.eventPhotoInput.value = '';
  renderEventPhotoSlots();

  toggleEventForm(true);
}

function exitEventEditMode() {
  els.eventForm.reset();
  els.eventForm.elements['id'].value      = '';
  els.eventFormTitle.textContent  = '釣行を登録';
  els.eventSubmitBtn.textContent  = '登録する';
  resetEventPhotoState();
}

async function onEventSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.eventForm);
  const id = fd.get('id') || uid();
  const payload = {
    action:  fd.get('id') ? 'updateEvent' : 'addEvent',
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
    startTime: fd.get('startTime') || '',
    endTime:   fd.get('endTime')   || '',
  };

  els.eventSubmitBtn.disabled = true;
  els.eventSubmitBtn.textContent = fd.get('id') ? '更新中...' : '登録中...';

  const oldPhotoIdsToDelete = [];

  for (const slot of eventPhotoState) {
    if (slot.removed) {
      payload[slot.field]   = '';
      payload[slot.idField] = '';
      if (slot.id) oldPhotoIdsToDelete.push(slot.id);
    } else if (slot.pendingDataUrl) {
      if (isMockMode()) {
        payload[slot.field]   = slot.pendingDataUrl;
        payload[slot.idField] = '';
      } else {
        els.eventSubmitBtn.textContent = '写真をアップロード中...';
        const uploaded = await uploadPhotoToDrive(slot.pendingDataUrl, id);
        if (uploaded) {
          payload[slot.field]   = uploaded.photo;
          payload[slot.idField] = uploaded.photoId;
          if (slot.id) oldPhotoIdsToDelete.push(slot.id);
        } else {
          setStatus('写真のアップロードに失敗しました。その写真以外の内容のみ保存します。', 'error');
          payload[slot.field]   = slot.url;
          payload[slot.idField] = slot.id;
        }
      }
    } else {
      payload[slot.field]   = slot.url;
      payload[slot.idField] = slot.id;
    }
  }

  const ok = await sendAction(payload);
  if (ok) {
    for (const photoId of oldPhotoIdsToDelete) await deleteDrivePhoto(photoId);
    setStatus(fd.get('id') ? '釣行を更新しました。' : '釣行を登録しました。', 'ok');
    exitEventEditMode();
    toggleEventForm(false);
    await loadAll();
  }

  els.eventSubmitBtn.disabled = false;
  els.eventSubmitBtn.textContent = fd.get('id') ? '更新する' : '登録する';
}

// ── Catch edit modal ──────────────────────────────────────────
let editPendingPhotoDataUrl = null;
let editPhotoRemoved = false;

function resetEditPhotoState() {
  editPendingPhotoDataUrl = null;
  editPhotoRemoved = false;
  els.editPhotoInput.value = '';
  els.editPhotoPreview.hidden = true;
  els.editPhotoThumb.src = '';
}

function openCatchModal(c) {
  const f = els.catchEditForm;
  f.elements['id'].value      = c.id;
  f.elements['eventId'].value = c.eventId;
  f.elements['photo'].value   = c.photo   || '';
  f.elements['photoId'].value = c.photoId || '';
  f.elements['time'].value    = formatTime(c.time);
  f.elements['species'].value = c.species || '';
  f.elements['count'].value   = c.count   || '';
  f.elements['size'].value    = c.size    || '';
  f.elements['weight'].value  = c.weight  || '';
  f.elements['lure'].value    = c.lure    || '';
  f.elements['point'].value   = c.point   || '';
  f.elements['memo'].value    = c.memo    || '';

  resetEditPhotoState();
  if (c.photo) {
    els.editPhotoThumb.src = c.photo;
    els.editPhotoPreview.hidden = false;
  }

  els.catchModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCatchModal() {
  els.catchModal.hidden = true;
  document.body.style.overflow = '';
  els.catchEditForm.reset();
  resetEditPhotoState();
}

let lightboxTarget = null; // { type: 'catch' | 'event', id, photoField }

function openPhotoLightbox(src, type, id, photoField = 'photo') {
  lightboxTarget = { type, id, photoField };
  els.photoLightboxImg.src = src;
  els.photoLightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closePhotoLightbox() {
  lightboxTarget = null;
  els.photoLightbox.hidden = true;
  els.photoLightboxImg.src = '';
  document.body.style.overflow = '';
}

async function deleteLightboxPhoto() {
  if (!lightboxTarget) return;
  const { type, id, photoField } = lightboxTarget;
  const list = type === 'event' ? currentEvents : currentCatches;
  const record = list.find(r => r.id === id);
  if (!record || !confirm('この写真を削除しますか？')) return;
  const photoIdField = photoField.replace('photo', 'photoId');

  if (isMockMode()) {
    await sendAction({ ...record, action: type === 'event' ? 'updateEvent' : 'updateCatch', [photoField]: '', [photoIdField]: '' });
  } else if (type === 'event') {
    await deleteDrivePhoto(record[photoIdField], { eventId: record.id, photoField });
  } else {
    await deleteDrivePhoto(record[photoIdField], { catchId: record.id });
  }
  closePhotoLightbox();
  await loadAll();
}

async function onCatchEditSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.catchEditForm);
  const catchId = fd.get('id');
  const originalPhotoId = fd.get('photoId');
  const payload = {
    action:  'updateCatch',
    id:      catchId,
    eventId: fd.get('eventId'),
    photo:   fd.get('photo'),
    photoId: fd.get('photoId'),
    time:    fd.get('time'),
    species: fd.get('species'),
    count:   fd.get('count'),
    size:    fd.get('size'),
    weight:  fd.get('weight'),
    lure:    fd.get('lure'),
    point:   fd.get('point'),
    memo:    fd.get('memo'),
  };

  let oldPhotoIdToDelete = null;

  if (editPhotoRemoved) {
    payload.photo   = '';
    payload.photoId = '';
    if (originalPhotoId) oldPhotoIdToDelete = originalPhotoId;
  } else if (editPendingPhotoDataUrl) {
    if (isMockMode()) {
      payload.photo   = editPendingPhotoDataUrl;
      payload.photoId = '';
    } else {
      const uploaded = await uploadPhotoToDrive(editPendingPhotoDataUrl, catchId);
      if (uploaded) {
        payload.photo   = uploaded.photo;
        payload.photoId = uploaded.photoId;
        if (originalPhotoId) oldPhotoIdToDelete = originalPhotoId;
      } else {
        setStatus('写真のアップロードに失敗しました。写真以外の内容のみ更新します。', 'error');
      }
    }
  }

  const ok = await sendAction(payload);
  if (ok) {
    if (oldPhotoIdToDelete) await deleteDrivePhoto(oldPhotoIdToDelete);
    setStatus('釣果を更新しました。', 'ok');
    closeCatchModal();
    await loadAll();
  }
}

// ── Trip start/end time ────────────────────────────────────────
async function setEventTime(id, field) {
  const ev = currentEvents.find(e => e.id === id);
  if (!ev) return;
  const payload = {
    action:  'updateEvent',
    id,
    date:    ev.date,
    spot:    ev.spot,
    area:    ev.area,
    style:   ev.style,
    target:  ev.target,
    weather: ev.weather,
    tide:    ev.tide,
    cost:    ev.cost,
    memo:    ev.memo,
    startTime: formatTime(ev.startTime),
    endTime:   formatTime(ev.endTime),
    [field]: nowTime(),
  };
  const ok = await sendAction(payload);
  if (ok) {
    setStatus(field === 'startTime' ? `釣行を開始しました (${payload.startTime})` : `釣行を終了しました (${payload.endTime})`, 'ok');
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

  if (btn.classList.contains('btn-start-trip')) {
    await setEventTime(id, 'startTime');
    return;
  }

  if (btn.classList.contains('btn-end-trip')) {
    await setEventTime(id, 'endTime');
    return;
  }

  if (btn.classList.contains('edit-event-btn')) {
    const ev = currentEvents.find(e => e.id === id);
    if (ev) enterEventEditMode(ev);
    return;
  }

  if (btn.classList.contains('ec-memo-toggle')) {
    const memoEl = btn.nextElementSibling;
    if (memoEl) {
      memoEl.hidden = !memoEl.hidden;
      btn.textContent = memoEl.hidden ? '+' : '−';
      if (memoEl.hidden) collapsedMemoIds.add(id); else collapsedMemoIds.delete(id);
    }
    return;
  }

  if (btn.classList.contains('delete-event-btn')) {
    if (!confirm('この釣行とその釣果をすべて削除しますか？')) return;
    const ev = currentEvents.find(e => e.id === id);
    if (ev) for (const p of eventPhotoSlots(ev)) await deleteDrivePhoto(p.id);
    const related = currentCatches.filter(c => c.eventId === id);
    for (const c of related) {
      await deleteDrivePhoto(c.photoId);
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
    const c = currentCatches.find(cc => cc.id === id);
    await deleteDrivePhoto(c && c.photoId);
    await sendAction({ action: 'deleteCatch', id });
    await loadAll();
  }
}

// ── Init ──────────────────────────────────────────────────────
const AUTH_KEY = 'angler_authed';

function bootstrapApp(url) {
  if (url) {
    els.settings.hidden = true;
    loadAll();
  } else {
    els.settings.hidden = false;
    els.demoNotice.hidden = false;
    loadAll();
  }
}

async function checkLoginPassword(password) {
  const url = getGasUrl();
  if (!url) return { ok: false, configured: false };
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'login', password }) });
    if (!res.ok) return { ok: false, configured: true };
    return await res.json();
  } catch {
    return { ok: false, configured: true };
  }
}

async function onLoginSubmit(e) {
  e.preventDefault();
  els.loginSubmitBtn.disabled = true;
  els.loginSubmitBtn.textContent = '確認中...';
  els.loginError.hidden = true;

  const result = await checkLoginPassword(els.loginPassword.value);

  if (result.ok) {
    localStorage.setItem(AUTH_KEY, 'ok');
    els.loginGate.hidden = true;
    bootstrapApp(getGasUrl());
  } else {
    els.loginError.textContent = result.configured === false
      ? 'パスワードが未設定です。Apps Script側でAPP_PASSWORDを設定してください。'
      : 'パスワードが違います。';
    els.loginError.hidden = false;
    els.loginPassword.value = '';
    els.loginPassword.focus();
  }

  els.loginSubmitBtn.disabled = false;
  els.loginSubmitBtn.textContent = 'ログイン';
}

function init() {
  buildSpeciesGrid();

  const url = getGasUrl();
  els.gasUrl.value = url;

  const needsLogin = !!url && localStorage.getItem(AUTH_KEY) !== 'ok';
  els.loginGate.hidden = !needsLogin;
  els.loginForm.addEventListener('submit', onLoginSubmit);

  if (!needsLogin) {
    bootstrapApp(url);
  }

  // Nav
  els.navBack.addEventListener('click', showEventsScreen);
  els.navShowForm.addEventListener('click', () => toggleEventForm());

  // Settings
  els.saveUrl.addEventListener('click', () => {
    const val = els.gasUrl.value.trim();
    if (!val) return;
    setGasUrl(val);
    els.settings.hidden = true;
    if (localStorage.getItem(AUTH_KEY) !== 'ok') {
      localStorage.removeItem(AUTH_KEY);
      els.loginGate.hidden = false;
      return;
    }
    setStatus('保存しました。読み込み中...');
    loadAll();
  });

  els.toggleSettings.addEventListener('click', () => {
    els.settings.hidden = !els.settings.hidden;
    if (!els.settings.hidden) els.pricesPanel.hidden = true;
  });

  els.togglePrices.addEventListener('click', () => {
    els.pricesPanel.hidden = !els.pricesPanel.hidden;
    if (!els.pricesPanel.hidden) {
      els.settings.hidden = true;
      buildPriceGrid();
      els.pricesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  els.savePrices.addEventListener('click', onSavePrices);
  els.addSpeciesBtn.addEventListener('click', onAddSpecies);

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

  // Photo capture (catch edit modal)
  els.editPhotoInput.addEventListener('change', async () => {
    const file = els.editPhotoInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      editPendingPhotoDataUrl = dataUrl;
      editPhotoRemoved = false;
      els.editPhotoThumb.src = dataUrl;
      els.editPhotoPreview.hidden = false;
    } catch {
      editPendingPhotoDataUrl = null;
    }
  });

  els.editRemovePhoto.addEventListener('click', () => {
    editPendingPhotoDataUrl = null;
    editPhotoRemoved = true;
    els.editPhotoInput.value = '';
    els.editPhotoPreview.hidden = true;
    els.editPhotoThumb.src = '';
  });

  // Photo capture (event form, 最大3枚)
  els.eventPhotoInput.addEventListener('change', async () => {
    const file = els.eventPhotoInput.files[0];
    els.eventPhotoInput.value = '';
    if (!file) return;
    const emptyIndex = eventPhotoState.findIndex(s => !s.removed && !s.url && !s.pendingDataUrl);
    if (emptyIndex === -1) return;
    try {
      const dataUrl = await compressImage(file);
      eventPhotoState[emptyIndex].pendingDataUrl = dataUrl;
      renderEventPhotoSlots();
    } catch { /* 読み込み失敗時はそのスロットを空のままにする */ }
  });

  els.eventPhotoSlots.addEventListener('click', e => {
    const btn = e.target.closest('.remove-photo-btn');
    if (!btn) return;
    const slot = eventPhotoState[Number(btn.dataset.slot)];
    if (!slot) return;
    if (slot.url) slot.removed = true;
    slot.pendingDataUrl = null;
    renderEventPhotoSlots();
  });

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

  els.catchesList.addEventListener('click', e => {
    const thumb = e.target.closest('.catch-thumb');
    if (thumb) openPhotoLightbox(thumb.src, 'catch', thumb.dataset.catchId);
  });
  els.eventsList.addEventListener('click', e => {
    const thumb = e.target.closest('.ec-thumb');
    if (thumb) openPhotoLightbox(thumb.src, 'event', thumb.dataset.eventId, thumb.dataset.photoField);
  });
  els.photoLightboxClose.addEventListener('click', closePhotoLightbox);
  els.photoLightboxBackdrop.addEventListener('click', closePhotoLightbox);
  els.photoLightboxDelete.addEventListener('click', deleteLightboxPhoto);

  els.heatmap.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    heatmapSpeciesFilter = chip.dataset.species;
    renderHeatmap();
  });

  els.styleFilter.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    styleFilter = chip.dataset.style;
    renderAll();
  });

  els.resetDemo.addEventListener('click', () => {
    if (!confirm('サンプルデータに戻しますか？現在のデータはすべて消えます。')) return;
    localStorage.removeItem(MOCK_EVENTS_KEY);
    localStorage.removeItem(MOCK_CATCHES_KEY);
    loadAll();
  });
}

init();
