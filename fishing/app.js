'use strict';

const STORAGE_KEY      = 'angler_gas_url';
const MOCK_EVENTS_KEY  = 'angler_mock_events';
const MOCK_CATCHES_KEY = 'angler_mock_catches';
const MOCK_PRICES_KEY  = 'angler_mock_prices';
const MOCK_GEARS_KEY   = 'angler_mock_gears';

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
  navShowGear:     document.getElementById('navShowGear'),
  navShowRodForm:  document.getElementById('navShowRodForm'),
  navShowReelForm: document.getElementById('navShowReelForm'),
  navShowLureForm: document.getElementById('navShowLureForm'),
  eventsScreen:   document.getElementById('eventsScreen'),
  catchScreen:    document.getElementById('catchScreen'),
  gearScreen:     document.getElementById('gearScreen'),
  eventBanner:    document.getElementById('eventBanner'),
  quickCatchForm: document.getElementById('quickCatchForm'),
  speciesGrid:         document.getElementById('speciesGrid'),
  speciesPrompt:       document.getElementById('speciesPrompt'),
  speciesInput:        document.getElementById('speciesInput'),
  customSpeciesInput:  document.getElementById('customSpeciesInput'),
  countBtns:      document.getElementById('countBtns'),
  countInput:     document.getElementById('countInput'),
  layerBtns:      document.getElementById('layerBtns'),
  layerInput:     document.getElementById('layerInput'),
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
  heatmapTotalBadge: document.getElementById('heatmapTotalBadge'),
  kantoMap:     document.getElementById('kantoMap'),
  areaPrefTabs: document.getElementById('areaPrefTabs'),
  styleFilter:  document.getElementById('styleFilter'),
  yearFilter:   document.getElementById('yearFilter'),
  globalFilterToggle:  document.getElementById('globalFilterToggle'),
  globalFilterBody:    document.getElementById('globalFilterBody'),
  globalFilterSummary: document.getElementById('globalFilterSummary'),
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
  lineInfoBtn:      document.getElementById('lineInfoBtn'),
  lineInfoModal:    document.getElementById('lineInfoModal'),
  lineInfoClose:    document.getElementById('lineInfoClose'),
  lineInfoBackdrop: document.getElementById('lineInfoBackdrop'),
  lureLineInfoBtn:      document.getElementById('lureLineInfoBtn'),
  lureLineInfoModal:    document.getElementById('lureLineInfoModal'),
  lureLineInfoClose:    document.getElementById('lureLineInfoClose'),
  lureLineInfoBackdrop: document.getElementById('lureLineInfoBackdrop'),
  rodLineInfoBtn:      document.getElementById('rodLineInfoBtn'),
  rodLineInfoModal:    document.getElementById('rodLineInfoModal'),
  rodLineInfoClose:    document.getElementById('rodLineInfoClose'),
  rodLineInfoBackdrop: document.getElementById('rodLineInfoBackdrop'),
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
  gearForm:        document.getElementById('gearForm'),
  gearFormTitle:   document.getElementById('gearFormTitle'),
  gearSubmitBtn:   document.getElementById('gearSubmitBtn'),
  cancelGearEdit:  document.getElementById('cancelGearEdit'),
  gearPhotoInput:    document.getElementById('gearPhotoInput'),
  gearPhotoSlots:    document.getElementById('gearPhotoSlots'),
  gearPhotoAddLabel: document.getElementById('gearPhotoAddLabel'),
  gearPhotoTrigger:  document.getElementById('gearPhotoTrigger'),
  rodList:  document.getElementById('rodList'),
  reelList: document.getElementById('reelList'),
  lureList: document.getElementById('lureList'),
  lureWeightChartWrap: document.getElementById('lureWeightChartWrap'),
  lureColorFilterChips:  document.getElementById('lureColorFilterChips'),
  lureWeightFilterChips: document.getElementById('lureWeightFilterChips'),
  lureCountBadge: document.getElementById('lureCountBadge'),
  rodLengthRuler: document.getElementById('rodLengthRuler'),
  reelSizeChart: document.getElementById('reelSizeChart'),
  tackleCombo: document.getElementById('tackleCombo'),
  pairedReelSelect: document.getElementById('pairedReelSelect'),
  gearTabRod:   document.getElementById('gearTabRod'),
  gearTabReel:  document.getElementById('gearTabReel'),
  gearTabLure:  document.getElementById('gearTabLure'),
  gearRodPanel: document.getElementById('gearRodPanel'),
  gearReelPanel: document.getElementById('gearReelPanel'),
  gearLurePanel: document.getElementById('gearLurePanel'),
  rodOnlyFields:  document.getElementById('rodOnlyFields'),
  reelOnlyFields: document.getElementById('reelOnlyFields'),
  lureOnlyFields: document.getElementById('lureOnlyFields'),
  styleLabelText: document.getElementById('styleLabelText'),
  styleInput: document.getElementById('styleInput'),
  analysisTabTrip:    document.getElementById('analysisTabTrip'),
  analysisTabCatch:   document.getElementById('analysisTabCatch'),
  analysisTripPanel:  document.getElementById('analysisTripPanel'),
  analysisCatchPanel: document.getElementById('analysisCatchPanel'),
};

// ── State ─────────────────────────────────────────────────────
let currentEvents  = [];
let currentCatches = [];
let currentPrices  = [];
let currentGears   = [];
let priceMap       = {}; // species -> 円/匹
let activeEvent    = null;
let selectedSpecies = '';
let selectedCount   = 0;
let pendingPhotoDataUrl = null;
let currentScreen  = 'events'; // 'events' | 'catches' | 'gear'
let gearTab        = 'rod'; // 'rod' | 'reel' | 'lure'
let lureColorFilter  = ''; // '' = すべて / それ以外は色名そのもの（'未設定'含む）
let lureWeightFilter = ''; // '' = すべて / binのインデックス文字列 / 'unset' = 重さ未入力
let analysisTab    = 'trip'; // 'trip' | 'catch'
let heatmapSpeciesFilter = ''; // '' = 全魚種
let heatmapTripFilter    = ''; // '' = すべての釣行 / それ以外はイベントID（日付＋釣り場名で一意な釣行）
let heatmapTideFilter    = ''; // '' = すべての潮
let styleFilter = ''; // '' = すべての釣り方
let yearFilter  = ''; // '' = すべて / 'this' = 今年 / 'last' = 昨年

function filteredEvents() {
  let list = styleFilter ? currentEvents.filter(ev => ev.style === styleFilter) : currentEvents;
  if (yearFilter) {
    const targetYear = new Date().getFullYear() - (yearFilter === 'last' ? 1 : 0);
    list = list.filter(ev => Number(normDateStr(ev.date).slice(0, 4)) === targetYear);
  }
  return list;
}

function filteredCatches(events) {
  const ids = new Set((events || filteredEvents()).map(ev => ev.id));
  return currentCatches.filter(c => ids.has(c.eventId));
}

let trendChartInst   = null;
let speciesChartInst = null;
let spotChartInst    = null;
let lureWeightChartInst = null;

// ── Mock / Demo mode ──────────────────────────────────────────
function isMockMode() { return !getGasUrl(); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function mockLoad() {
  const stored = localStorage.getItem(MOCK_EVENTS_KEY);
  if (stored === null) {
    const sample = buildSampleData();
    mockSave(sample.events, sample.catches, sample.prices, sample.gears);
    return sample;
  }
  return {
    events:  JSON.parse(stored),
    catches: JSON.parse(localStorage.getItem(MOCK_CATCHES_KEY) || '[]'),
    prices:  JSON.parse(localStorage.getItem(MOCK_PRICES_KEY) || '[]'),
    gears:   JSON.parse(localStorage.getItem(MOCK_GEARS_KEY) || '[]'),
  };
}

function mockSave(events, catches, prices, gears) {
  localStorage.setItem(MOCK_EVENTS_KEY, JSON.stringify(events));
  localStorage.setItem(MOCK_CATCHES_KEY, JSON.stringify(catches));
  localStorage.setItem(MOCK_PRICES_KEY, JSON.stringify(prices || []));
  localStorage.setItem(MOCK_GEARS_KEY, JSON.stringify(gears || []));
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
    gears: (() => {
      const reel1 = uid(), reel2 = uid();
      return [
        { id: uid(), type: 'rod',  name: '月下美人 AGS 76L-SMT', style: 'アジング', maker: 'ダイワ', memo: 'お気に入りの軽量ロッド', photo: '', photoId: '', rodLength: '231', selfWeight: '68', sinkerWeight: '0.5-7g',  purchaseDate: '2024-03-10', purchasePrice: '28000', pairedReelId: reel2 },
        { id: uid(), type: 'rod',  name: 'セフィア BB S706ML',   style: 'エギング', maker: 'シマノ', memo: '',           photo: '', photoId: '', rodLength: '213', selfWeight: '102', sinkerWeight: '3-21g',  purchaseDate: '2023-09-02', purchasePrice: '19800', pairedReelId: '' },
        { id: reel1, type: 'reel', name: '22ソルティガ 4000',    style: '4000', maker: 'ダイワ', memo: '',               photo: '', photoId: '', selfWeight: '600', purchaseDate: '2023-05-20', purchasePrice: '78000',
          reelType: 'スピニング', retrieveLength: '94', gearRatio: '5.7:1', nylonCapacity: '16lb-300m', peCapacity: '3号-400m', maxDrag: '13', lineType: 'PEライン', lineSize: '3号', lastLineChangeDate: '2026-04-01' },
        { id: reel2, type: 'reel', name: '21ヴァンフォード C2000SSPG', style: 'C2000', maker: 'シマノ', memo: '', photo: '', photoId: '', selfWeight: '180', purchaseDate: '2022-11-03', purchasePrice: '24000',
          reelType: 'スピニング', retrieveLength: '68', gearRatio: '5.3:1', nylonCapacity: '3lb-150m', peCapacity: '0.6号-200m', maxDrag: '4', lineType: 'PEライン', lineSize: '0.6号', lastLineChangeDate: '2026-02-15' },
        { id: uid(), type: 'lure', name: 'アジアダー',     style: 'ワーム',     maker: 'アジング職人', memo: 'アジング定番',  photo: '', photoId: '', selfWeight: '1.5', purchaseDate: '2025-11-02', purchasePrice: '550',  color: 'グロー' },
        { id: uid(), type: 'lure', name: 'コルトスナイパー', style: 'メタルジグ', maker: 'デュオ',       memo: '青物用',        photo: '', photoId: '', selfWeight: '30',  purchaseDate: '2025-06-10', purchasePrice: '1800', color: 'イワシ' },
      ];
    })(),
  };
}

function mockExec(payload) {
  const { events, catches, prices, gears } = mockLoad();
  const { action, id } = payload;
  const pick = (src, keys) => Object.fromEntries(keys.map(k => [k, src[k] !== undefined ? src[k] : '']));
  const EF = ['date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo', 'startTime', 'endTime', 'photo', 'photoId', 'photo2', 'photoId2', 'photo3', 'photoId3'];
  const CF = ['eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'layer', 'memo', 'photo', 'photoId'];
  const GF = ['type', 'name', 'style', 'maker', 'memo', 'photo', 'photoId', 'photo2', 'photoId2', 'photo3', 'photoId3', 'selfWeight', 'purchaseDate', 'purchasePrice', 'rodLength', 'sinkerWeight', 'reelType', 'retrieveLength', 'gearRatio', 'nylonCapacity', 'peCapacity', 'maxDrag', 'lineType', 'lineSize', 'lastLineChangeDate', 'leaderType', 'leaderSize', 'leaderLength', 'color', 'pairedReelId'];

  if      (action === 'addEvent')    { events.push({ id: payload.id || uid(), ...pick(payload, EF) }); }
  else if (action === 'updateEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events[i]  = { id, ...pick(payload, EF) }; }
  else if (action === 'deleteEvent') { const i = events.findIndex(e => e.id === id);  if (i >= 0) events.splice(i, 1); }
  else if (action === 'addCatch')    { catches.push({ id: payload.id || uid(), ...pick(payload, CF) }); }
  else if (action === 'updateCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches[i] = { id, ...pick(payload, CF) }; }
  else if (action === 'deleteCatch') { const i = catches.findIndex(c => c.id === id); if (i >= 0) catches.splice(i, 1); }
  else if (action === 'addGear')     { gears.push({ id: payload.id || uid(), ...pick(payload, GF) }); }
  else if (action === 'updateGear')  { const i = gears.findIndex(g => g.id === id);   if (i >= 0) gears[i]   = { id, ...pick(payload, GF) }; }
  else if (action === 'deleteGear')  { const i = gears.findIndex(g => g.id === id);   if (i >= 0) gears.splice(i, 1); }
  else if (action === 'savePrice')   {
    const i = prices.findIndex(p => p.species === payload.species);
    if (i >= 0) prices[i].price = payload.price; else prices.push({ species: payload.species, price: payload.price });
  }

  mockSave(events, catches, prices, gears);
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
  await sendAction({ action: 'deletePhoto', photoId, catchId: ids.catchId || '', eventId: ids.eventId || '', gearId: ids.gearId || '', photoField: ids.photoField || 'photo' });
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

// タックル（ロッド・リール）も写真を最大3枚（photo/photoId, photo2/photoId2, photo3/photoId3）まで持てる。
const GEAR_PHOTO_SUFFIXES = ['', '2', '3'];

function gearPhotoFieldNames(suffix) {
  return { field: 'photo' + suffix, idField: 'photoId' + suffix };
}

function gearPhotoSlots(g) {
  return GEAR_PHOTO_SUFFIXES
    .map(suffix => {
      const { field, idField } = gearPhotoFieldNames(suffix);
      return { field, idField, url: g[field], id: g[idField] };
    })
    .filter(p => p.url);
}

// ── Screen navigation ─────────────────────────────────────────
function showEventsScreen() {
  currentScreen = 'events';
  els.eventsScreen.hidden = false;
  els.catchScreen.hidden  = true;
  els.gearScreen.hidden   = true;
  els.navBack.hidden      = true;
  els.navShowForm.hidden  = false;
  els.navShowGear.hidden  = false;
  els.navShowRodForm.hidden  = true;
  els.navShowReelForm.hidden = true;
  els.navShowLureForm.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCatchScreen(ev) {
  activeEvent   = ev;
  currentScreen = 'catches';
  els.eventsScreen.hidden = true;
  els.catchScreen.hidden  = false;
  els.gearScreen.hidden   = true;
  els.navBack.hidden      = false;
  els.navShowForm.hidden  = true;
  els.navShowGear.hidden  = true;
  els.navShowRodForm.hidden  = true;
  els.navShowReelForm.hidden = true;
  els.navShowLureForm.hidden = true;
  resetQuickForm();
  renderEventBanner();
  renderEventCatches();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showGearScreen() {
  currentScreen = 'gear';
  els.eventsScreen.hidden = true;
  els.catchScreen.hidden  = true;
  els.gearScreen.hidden   = false;
  els.navBack.hidden      = false;
  els.navShowForm.hidden  = true;
  els.navShowGear.hidden  = true;
  els.navShowRodForm.hidden  = false;
  els.navShowReelForm.hidden = false;
  els.navShowLureForm.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// タックル管理画面の「ロッド」「リール」「ルアー」タブ切り替え。
function setGearTab(tab) {
  gearTab = tab;
  els.gearTabRod.classList.toggle('gear-tab-active', tab === 'rod');
  els.gearTabReel.classList.toggle('gear-tab-active', tab === 'reel');
  els.gearTabLure.classList.toggle('gear-tab-active', tab === 'lure');
  els.gearTabRod.setAttribute('aria-selected', String(tab === 'rod'));
  els.gearTabReel.setAttribute('aria-selected', String(tab === 'reel'));
  els.gearTabLure.setAttribute('aria-selected', String(tab === 'lure'));
  els.gearRodPanel.hidden  = tab !== 'rod';
  els.gearReelPanel.hidden = tab !== 'reel';
  els.gearLurePanel.hidden = tab !== 'lure';
  if (tab === 'lure' && lureWeightChartInst) lureWeightChartInst.resize();
}

// 分析画面の「釣行分析」「釣果分析」タブ切り替え。
function setAnalysisTab(tab) {
  analysisTab = tab;
  els.analysisTabTrip.classList.toggle('gear-tab-active', tab === 'trip');
  els.analysisTabCatch.classList.toggle('gear-tab-active', tab === 'catch');
  els.analysisTabTrip.setAttribute('aria-selected', String(tab === 'trip'));
  els.analysisTabCatch.setAttribute('aria-selected', String(tab === 'catch'));
  els.analysisTripPanel.hidden  = tab !== 'trip';
  els.analysisCatchPanel.hidden = tab !== 'catch';
  // hidden中はcanvasの幅が0になるため、表示時にChartの再計算が必要
  if (tab === 'trip' && trendChartInst) trendChartInst.resize();
  if (tab === 'catch') {
    if (speciesChartInst) speciesChartInst.resize();
    if (spotChartInst) spotChartInst.resize();
  }
}

// ── API ───────────────────────────────────────────────────────
function applyPriceMap(prices) {
  currentPrices = prices || [];
  priceMap = {};
  currentPrices.forEach(p => { priceMap[p.species] = Number(p.price) || 0; });
}

async function loadAll() {
  if (isMockMode()) {
    const { events, catches, prices, gears } = mockLoad();
    currentEvents  = events;
    currentCatches = catches;
    currentGears   = gears;
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
    currentGears   = data.gears   || [];
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

function renderYearFilter() {
  els.yearFilter.innerHTML = `
    <button class="hm-chip${!yearFilter ? ' hm-chip-active' : ''}" data-year="">すべて</button>
    <button class="hm-chip${yearFilter === 'this' ? ' hm-chip-active' : ''}" data-year="this">今年</button>
    <button class="hm-chip${yearFilter === 'last' ? ' hm-chip-active' : ''}" data-year="last">昨年</button>
  `;
}

// 折りたたみ時でも現在の絞り込み状態がひと目でわかるよう要約を表示する。
function renderGlobalFilterSummary() {
  const yearLabel  = yearFilter === 'this' ? '今年' : yearFilter === 'last' ? '昨年' : '';
  const parts = [yearLabel, styleFilter].filter(Boolean);
  els.globalFilterSummary.textContent = parts.length
    ? `絞り込み中: ${parts.join(' / ')}`
    : 'このページ全体に適用されます';
}

function renderAll() {
  renderStyleFilter();
  renderYearFilter();
  renderGlobalFilterSummary();
  renderEventsList();
  renderStats();
  renderCharts();
  renderHeatmap();
  renderAreaMap();
  populateDatalists();
  buildPriceGrid();
  buildSpeciesGrid();
  renderGearLists();
  // Refresh catch screen if currently visible
  if (currentScreen === 'catches' && activeEvent) {
    // Sync activeEvent object in case data was reloaded
    activeEvent = currentEvents.find(e => e.id === activeEvent.id) || activeEvent;
    renderEventBanner();
    renderEventCatches();
  }
}

const EVENTS_INITIAL = 2;
const collapsedMemoIds = new Set();
const tideViewIds = new Set();

function renderEventsList(expanded = false) {
  const sorted = [...filteredEvents()].sort(
    (a, b) => new Date(normDateStr(b.date)) - new Date(normDateStr(a.date))
  );

  if (!sorted.length) {
    els.eventsList.innerHTML = (styleFilter || yearFilter)
      ? '<p class="empty">この条件に合う釣行記録はまだありません。</p>'
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

    // 釣行一覧の各カードは「行程」「天候」「釣果」「コスパ」のラベル付きグループに
    // 分けて表示し、内容がない区分はグループ自体を出さない。
    const itineraryGroup = `
      ${ev.style ? `<span class="badge badge-outline">${escapeHtml(ev.style)}</span>` : ''}
      ${ev.target ? `<span class="badge badge-outline">${escapeHtml(ev.target)}狙い</span>` : ''}
      ${ev.startTime
        ? `<span class="badge badge-outline ec-time-badge"><svg class="icon icon-inline"><use href="#icon-clock"/></svg>${formatTime(ev.startTime)}${ev.endTime ? '–' + formatTime(ev.endTime) : ' 〜 計測中'}</span>`
        : `<button type="button" class="btn btn-sm btn-start-trip" data-id="${escapeHtml(ev.id)}"><svg class="icon icon-inline"><use href="#icon-play"/></svg>開始</button>`}
      ${ev.startTime && !ev.endTime
        ? `<button type="button" class="btn btn-sm btn-end-trip" data-id="${escapeHtml(ev.id)}"><svg class="icon icon-inline"><use href="#icon-stop"/></svg>終了</button>`
        : ''}
      ${hours ? `<span class="badge badge-outline">${formatDuration(hours)}</span>` : ''}`;

    const weatherGroup = `
      ${ev.weather ? `<span class="badge badge-outline">${escapeHtml(ev.weather)}</span>` : ''}
      ${ev.tide    ? `<span class="badge badge-outline">${escapeHtml(ev.tide)}</span>` : ''}
      <span class="ec-weather-slot" data-id="${escapeHtml(ev.id)}"></span>`;

    const showCatchGroup = species.length || rate != null;
    const catchGroup = `
      ${species.map(s => `<span class="badge badge-species">${speciesIconSvg(s, 'icon-inline')} ${escapeHtml(s)}</span>`).join('')}
      ${rate != null ? `<span class="ec-rate">${rate.toFixed(1)}匹/時間</span>` : ''}`;

    const showCostGroup = ev.cost || totalValue > 0;
    const costGroup = `
      ${ev.cost ? `<span class="ec-cost"><svg class="icon icon-inline"><use href="#icon-minus-circle"/></svg>¥${Number(ev.cost).toLocaleString()}</span>` : ''}
      ${totalValue > 0 ? `<span class="ec-value"><svg class="icon icon-inline"><use href="#icon-plus-circle"/></svg>¥${totalValue.toLocaleString()}</span>` : ''}`;

    const metaGroupHtml = (label, content) => `
      <div class="ec-group">
        <span class="ec-group-label">${label}</span>
        <div class="ec-group-content">${content}</div>
      </div>`;

    const tideActive = tideViewIds.has(ev.id);

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
                ${totalCatch > 0 ? `<div class="ec-catch-stat">
                  <span class="ec-catch-stat-value">${totalCatch}</span>
                  <span class="ec-catch-stat-label">匹</span>
                </div>` : ''}
              </div>
              <div class="ec-meta"${tideActive ? ' hidden' : ''}>
                ${metaGroupHtml('行程', itineraryGroup)}
                ${metaGroupHtml('天候', weatherGroup)}
                ${showCatchGroup ? metaGroupHtml('釣果', catchGroup) : ''}
                ${showCostGroup  ? metaGroupHtml('コスパ', costGroup) : ''}
                ${photos.length ? metaGroupHtml('写真', photos.map(p => `<img src="${escapeHtml(p.url)}" class="ec-thumb" data-event-id="${escapeHtml(ev.id)}" data-photo-field="${p.field}" alt="釣行写真">`).join('')) : ''}
              </div>
              <div class="tide-chart-card-body" data-tide-event-id="${escapeHtml(ev.id)}"${tideActive ? '' : ' hidden'}><p class="empty">読み込み中...</p></div>
            </div>
          </div>
        </div>
        ${ev.memo ? `
        <div class="ec-memo-row ec-action-default"${tideActive ? ' hidden' : ''}>
          <button type="button" class="ec-memo-toggle" data-id="${escapeHtml(ev.id)}">${collapsedMemoIds.has(ev.id) ? '+' : '−'}</button>
          <p class="ec-memo"${collapsedMemoIds.has(ev.id) ? ' hidden' : ''}>${escapeHtml(ev.memo)}</p>
        </div>` : ''}
        <div class="event-card-actions">
          <button type="button" class="btn btn-sm tide-toggle-btn" data-id="${escapeHtml(ev.id)}">${tideActive ? '元に戻る' : '潮汐グラフ'}</button>
          <button type="button" class="btn btn-primary enter-catches-btn ec-action-default"${tideActive ? ' hidden' : ''} data-id="${escapeHtml(ev.id)}">釣果入力 <svg class="icon icon-inline"><use href="#icon-arrow-right"/></svg></button>
          <button type="button" class="btn btn-sm edit-event-btn ec-action-default"${tideActive ? ' hidden' : ''} data-id="${escapeHtml(ev.id)}">編集</button>
          <button type="button" class="btn btn-sm btn-danger delete-event-btn ec-action-default"${tideActive ? ' hidden' : ''} data-id="${escapeHtml(ev.id)}">削除</button>
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
  // 潮汐グラフは「潮汐グラフ」ボタンを押した時点で読み込む（表示中のカードのみ再読み込み）
  visible.filter(ev => tideViewIds.has(ev.id)).forEach(hydrateTideGroup);
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
const tideCacheMap = new Map(); // `${area}|${date}` -> hours配列 | null

async function fetchTideCached(area, dateStr) {
  const key = `${area || ''}|${dateStr}`;
  if (tideCacheMap.has(key)) return tideCacheMap.get(key);
  const hours = await fetchTide(area, dateStr);
  tideCacheMap.set(key, hours);
  return hours;
}

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

// 「エリア」欄の地名から関東1都6県＋山梨・静岡の市町村レベルの緯度経度を取得する。
// 釣り場と関連の深い市町村を中心に収録した簡易版（網羅的な行政区域データではない）。
const KANTO_PREFECTURES = ['群馬', '栃木', '茨城', '埼玉', '千葉', '東京', '神奈川', '山梨', '静岡'];

const KANTO_CITY_COORDS = {
  // 神奈川県（海沿いの市町をすべて収録）
  '横浜':   { lat: 35.45, lon: 139.65, pref: '神奈川' },
  '川崎':   { lat: 35.51, lon: 139.71, pref: '神奈川' },
  '本牧':   { lat: 35.42, lon: 139.67, pref: '神奈川' },
  '横須賀': { lat: 35.28, lon: 139.67, pref: '神奈川' },
  '鎌倉':   { lat: 35.319, lon: 139.546, pref: '神奈川' },
  '逗子':   { lat: 35.297, lon: 139.579, pref: '神奈川' },
  '葉山':   { lat: 35.257, lon: 139.586, pref: '神奈川' },
  '三浦':   { lat: 35.15, lon: 139.62, pref: '神奈川' },
  '湘南港': { lat: 35.30, lon: 139.39, pref: '神奈川' },
  '茅ヶ崎': { lat: 35.33, lon: 139.41, pref: '神奈川' },
  '藤沢':   { lat: 35.34, lon: 139.49, pref: '神奈川' },
  '江の島': { lat: 35.30, lon: 139.48, pref: '神奈川' },
  '平塚':   { lat: 35.328, lon: 139.343, pref: '神奈川' },
  '大磯':   { lat: 35.307, lon: 139.313, pref: '神奈川' },
  '二宮':   { lat: 35.302, lon: 139.262, pref: '神奈川' },
  '小田原': { lat: 35.25, lon: 139.15, pref: '神奈川' },
  '真鶴':   { lat: 35.156, lon: 139.137, pref: '神奈川' },
  '湯河原': { lat: 35.131, lon: 139.107, pref: '神奈川' },
  // 千葉県（海沿いの市をすべて収録）
  '旭':     { lat: 35.720, lon: 140.650, pref: '千葉' },
  '銚子':   { lat: 35.73, lon: 140.83, pref: '千葉' },
  '勝浦':   { lat: 35.13, lon: 140.25, pref: '千葉' },
  '御宿':   { lat: 35.18, lon: 140.35, pref: '千葉' },
  'いすみ': { lat: 35.220, lon: 140.388, pref: '千葉' },
  '大原':   { lat: 35.25, lon: 140.38, pref: '千葉' },
  '鴨川':   { lat: 35.13, lon: 139.97, pref: '千葉' },
  '南房総': { lat: 34.92, lon: 139.83, pref: '千葉' },
  '館山':   { lat: 34.98, lon: 139.87, pref: '千葉' },
  '富津':   { lat: 35.30, lon: 139.83, pref: '千葉' },
  '金谷':   { lat: 35.03, lon: 139.80, pref: '千葉' },
  '君津':   { lat: 35.335, lon: 139.905, pref: '千葉' },
  '木更津': { lat: 35.38, lon: 139.93, pref: '千葉' },
  '市原':   { lat: 35.50, lon: 140.07, pref: '千葉' },
  '千葉':   { lat: 35.60, lon: 140.10, pref: '千葉' },
  '習志野': { lat: 35.660, lon: 140.027, pref: '千葉' },
  '船橋':   { lat: 35.70, lon: 139.98, pref: '千葉' },
  '市川':   { lat: 35.719, lon: 139.931, pref: '千葉' },
  '浦安':   { lat: 35.654, lon: 139.902, pref: '千葉' },
  // 茨城県
  '鹿嶋':   { lat: 35.97, lon: 140.65, pref: '茨城' },
  '大洗':   { lat: 36.31, lon: 140.58, pref: '茨城' },
  '神栖':   { lat: 35.89, lon: 140.66, pref: '茨城' },
  '日立':   { lat: 36.60, lon: 140.65, pref: '茨城' },
  '土浦':   { lat: 36.08, lon: 140.20, pref: '茨城' },
  '水戸':   { lat: 36.34, lon: 140.45, pref: '茨城' },
  // 栃木県
  '宇都宮': { lat: 36.57, lon: 139.88, pref: '栃木' },
  '那須':   { lat: 36.91, lon: 140.05, pref: '栃木' },
  '日光':   { lat: 36.75, lon: 139.60, pref: '栃木' },
  '那須塩原': { lat: 36.97, lon: 139.97, pref: '栃木' },
  // 群馬県
  '前橋':   { lat: 36.39, lon: 139.06, pref: '群馬' },
  '高崎':   { lat: 36.32, lon: 139.00, pref: '群馬' },
  'みなかみ': { lat: 36.68, lon: 138.99, pref: '群馬' },
  '渋川':   { lat: 36.49, lon: 139.00, pref: '群馬' },
  // 埼玉県
  'さいたま': { lat: 35.86, lon: 139.65, pref: '埼玉' },
  '川越':   { lat: 35.92, lon: 139.49, pref: '埼玉' },
  '秩父':   { lat: 35.99, lon: 139.09, pref: '埼玉' },
  '春日部': { lat: 35.98, lon: 139.75, pref: '埼玉' },
  // 東京都
  '東京':   { lat: 35.68, lon: 139.77, pref: '東京' },
  '大田区': { lat: 35.56, lon: 139.72, pref: '東京' },
  '江戸川': { lat: 35.70, lon: 139.87, pref: '東京' },
  '八王子': { lat: 35.66, lon: 139.34, pref: '東京' },
  '奥多摩': { lat: 35.81, lon: 139.10, pref: '東京' },
  // 山梨県
  '甲府':     { lat: 35.66, lon: 138.57, pref: '山梨' },
  '富士吉田': { lat: 35.49, lon: 138.81, pref: '山梨' },
  '河口湖':   { lat: 35.50, lon: 138.76, pref: '山梨' },
  '山中湖':   { lat: 35.42, lon: 138.87, pref: '山梨' },
  '大月':     { lat: 35.61, lon: 138.94, pref: '山梨' },
  '韮崎':     { lat: 35.70, lon: 138.54, pref: '山梨' },
  // 静岡県
  '熱海':   { lat: 35.10, lon: 139.07, pref: '静岡' },
  '伊東':   { lat: 34.97, lon: 139.10, pref: '静岡' },
  '下田':   { lat: 34.68, lon: 138.95, pref: '静岡' },
  '南伊豆': { lat: 34.62, lon: 138.85, pref: '静岡' },
  '石廊崎': { lat: 34.60, lon: 138.85, pref: '静岡' },
  '松崎':   { lat: 34.77, lon: 138.77, pref: '静岡' },
  '土肥':   { lat: 34.98, lon: 138.78, pref: '静岡' },
  '西伊豆': { lat: 34.85, lon: 138.78, pref: '静岡' },
  '沼津':   { lat: 35.10, lon: 138.86, pref: '静岡' },
  '三島':   { lat: 35.12, lon: 138.91, pref: '静岡' },
  '内浦':   { lat: 35.05, lon: 138.87, pref: '静岡' },
  '富士':   { lat: 35.16, lon: 138.68, pref: '静岡' },
  '清水':   { lat: 35.02, lon: 138.49, pref: '静岡' },
  '静岡':   { lat: 34.98, lon: 138.38, pref: '静岡' },
  '焼津':   { lat: 34.87, lon: 138.32, pref: '静岡' },
  '御前崎': { lat: 34.62, lon: 138.13, pref: '静岡' },
  '浜松':   { lat: 34.71, lon: 137.73, pref: '静岡' },
  '舞阪':   { lat: 34.68, lon: 137.60, pref: '静岡' },
  '浜名湖': { lat: 34.73, lon: 137.60, pref: '静岡' },
};

// 市町村名が見つからず都県名のみ一致した場合のフォールバック座標（各都県の重心）。
const KANTO_PREF_CENTROID = {
  '群馬':   { lat: 36.508, lon: 138.982 },
  '栃木':   { lat: 36.693, lon: 139.816 },
  '茨城':   { lat: 36.310, lon: 140.316 },
  '埼玉':   { lat: 36.000, lon: 139.345 },
  '千葉':   { lat: 35.516, lon: 140.201 },
  '東京':   { lat: 35.715, lon: 139.434 },
  '神奈川': { lat: 35.417, lon: 139.335 },
  '山梨':   { lat: 35.616, lon: 138.608 },
  '静岡':   { lat: 35.020, lon: 138.327 },
};

// 関東1都6県＋山梨・静岡のおおよその輪郭（実際の行政区域データを間引いて簡略化したもの。
// 出典: https://github.com/dataofjapan/land の japan.geojson を簡略化）。
const KANTO_PREF_POLYGONS = {
  '群馬': [[36.412,138.644],[36.424,138.592],[36.402,138.490],[36.435,138.401],[36.596,138.427],[36.643,138.473],[36.651,138.525],[36.666,138.534],[36.690,138.514],[36.739,138.712],[36.764,138.726],[36.745,138.789],[36.772,138.826],[36.817,138.822],[36.833,138.928],[36.883,138.923],[36.891,138.979],[36.979,138.966],[36.987,139.047],[37.020,139.090],[37.059,139.097],[37.000,139.172],[36.965,139.180],[36.961,139.228],[36.930,139.242],[36.941,139.266],[36.911,139.393],[36.853,139.349],[36.830,139.406],[36.774,139.353],[36.746,139.372],[36.692,139.337],[36.634,139.328],[36.602,139.398],[36.607,139.465],[36.582,139.483],[36.548,139.438],[36.509,139.422],[36.464,139.435],[36.459,139.410],[36.384,139.361],[36.272,139.464],[36.274,139.622],[36.212,139.669],[36.187,139.625],[36.210,139.588],[36.191,139.457],[36.253,139.359],[36.230,139.324],[36.283,139.129],[36.196,139.063],[36.130,139.043],[36.124,138.958],[36.096,138.946],[36.078,138.866],[36.037,138.829],[36.035,138.755],[35.985,138.713],[36.028,138.631],[36.120,138.645],[36.168,138.577],[36.174,138.637],[36.278,138.600],[36.303,138.654]],
  '栃木': [[37.154,139.961],[37.106,140.138],[37.064,140.194],[37.024,140.205],[37.026,140.249],[36.950,140.241],[36.933,140.264],[36.920,140.249],[36.824,140.267],[36.765,140.255],[36.713,140.293],[36.686,140.221],[36.518,140.260],[36.503,140.231],[36.398,140.185],[36.415,140.130],[36.394,140.101],[36.404,140.066],[36.375,140.045],[36.379,139.973],[36.351,139.965],[36.337,139.914],[36.301,139.910],[36.323,139.878],[36.311,139.849],[36.240,139.822],[36.202,139.727],[36.207,139.665],[36.255,139.631],[36.267,139.643],[36.274,139.622],[36.272,139.464],[36.384,139.361],[36.459,139.410],[36.464,139.435],[36.509,139.422],[36.548,139.438],[36.582,139.483],[36.607,139.465],[36.602,139.398],[36.634,139.328],[36.692,139.337],[36.746,139.372],[36.774,139.353],[36.830,139.406],[36.853,139.349],[36.878,139.356],[36.925,139.428],[36.970,139.460],[36.981,139.536],[37.092,139.776],[37.085,139.822],[37.118,139.816],[37.147,139.866]],
  '茨城': [[36.938,140.568],[36.945,140.586],[36.904,140.616],[36.867,140.779],[36.831,140.806],[36.781,140.747],[36.662,140.716],[36.487,140.612],[36.381,140.627],[36.305,140.566],[36.256,140.560],[36.087,140.610],[35.938,140.701],[35.929,140.663],[35.897,140.675],[35.883,140.691],[35.912,140.677],[35.925,140.707],[35.740,140.847],[35.782,140.747],[35.837,140.706],[35.859,140.632],[35.959,140.511],[35.928,140.487],[35.906,140.503],[35.926,140.458],[35.864,140.318],[35.846,140.147],[35.940,139.939],[36.104,139.787],[36.081,139.770],[36.088,139.730],[36.173,139.691],[36.206,139.691],[36.240,139.822],[36.311,139.849],[36.323,139.878],[36.301,139.910],[36.337,139.914],[36.351,139.965],[36.379,139.973],[36.375,140.045],[36.404,140.066],[36.415,140.130],[36.404,140.192],[36.503,140.231],[36.518,140.260],[36.686,140.221],[36.713,140.293],[36.757,140.257],[36.928,140.252],[36.929,140.298],[36.881,140.368],[36.838,140.377],[36.792,140.464],[36.859,140.539],[36.873,140.592]],
  '埼玉': [[36.283,139.129],[36.245,139.244],[36.246,139.304],[36.230,139.324],[36.253,139.359],[36.191,139.457],[36.210,139.588],[36.187,139.625],[36.215,139.661],[36.204,139.686],[36.088,139.730],[36.091,139.776],[36.033,139.817],[35.973,139.826],[35.897,139.887],[35.865,139.900],[35.783,139.894],[35.781,139.877],[35.797,139.872],[35.794,139.827],[35.815,139.821],[35.806,139.796],[35.818,139.768],[35.781,139.738],[35.801,139.657],[35.767,139.622],[35.779,139.589],[35.754,139.548],[35.774,139.548],[35.765,139.516],[35.782,139.544],[35.807,139.542],[35.779,139.497],[35.763,139.392],[35.791,139.370],[35.795,139.326],[35.834,139.301],[35.840,139.196],[35.873,139.062],[35.897,139.024],[35.840,138.893],[35.867,138.846],[35.862,138.814],[35.900,138.778],[35.909,138.729],[35.938,138.739],[35.985,138.713],[36.035,138.755],[36.037,138.829],[36.078,138.866],[36.096,138.946],[36.124,138.958],[36.116,138.986],[36.133,139.004],[36.130,139.043],[36.148,139.043],[36.153,139.062],[36.196,139.063]],
  '千葉': [[36.091,139.776],[35.940,139.939],[35.843,140.155],[35.864,140.318],[35.926,140.458],[35.906,140.503],[35.959,140.511],[35.718,140.871],[35.693,140.865],[35.688,140.655],[35.603,140.525],[35.462,140.411],[35.187,140.384],[35.134,140.312],[35.116,140.122],[35.011,139.982],[34.931,139.956],[34.900,139.888],[34.967,139.754],[35.003,139.858],[35.039,139.811],[35.087,139.842],[35.177,139.817],[35.235,139.870],[35.294,139.842],[35.315,139.781],[35.334,139.839],[35.375,139.845],[35.358,139.897],[35.432,139.905],[35.467,140.023],[35.544,140.061],[35.568,140.127],[35.655,139.988],[35.660,140.003],[35.664,139.986],[35.672,139.992],[35.677,139.984],[35.690,139.988],[35.692,139.985],[35.625,139.873],[35.698,139.919],[35.765,139.881],[35.865,139.900]],
  '東京': [[35.855,138.944],[35.882,138.968],[35.897,139.024],[35.873,139.062],[35.840,139.196],[35.834,139.301],[35.795,139.326],[35.791,139.370],[35.763,139.392],[35.779,139.497],[35.807,139.542],[35.782,139.544],[35.765,139.516],[35.774,139.548],[35.754,139.548],[35.779,139.589],[35.767,139.622],[35.798,139.642],[35.801,139.692],[35.781,139.738],[35.798,139.760],[35.813,139.756],[35.815,139.821],[35.794,139.827],[35.797,139.872],[35.781,139.877],[35.783,139.894],[35.765,139.881],[35.698,139.919],[35.677,139.886],[35.639,139.873],[35.641,139.806],[35.622,139.799],[35.637,139.779],[35.645,139.798],[35.650,139.796],[35.642,139.777],[35.657,139.790],[35.653,139.762],[35.589,139.744],[35.562,139.754],[35.570,139.786],[35.538,139.809],[35.527,139.790],[35.544,139.758],[35.537,139.702],[35.554,139.702],[35.563,139.678],[35.589,139.665],[35.633,139.562],[35.643,139.525],[35.605,139.497],[35.625,139.463],[35.605,139.453],[35.576,139.507],[35.562,139.490],[35.584,139.490],[35.576,139.473],[35.504,139.485],[35.502,139.468],[35.584,139.399],[35.613,139.282],[35.606,139.241],[35.646,139.216],[35.646,139.180],[35.668,139.162],[35.719,139.026],[35.769,138.984],[35.831,138.970]],
  '神奈川': [[35.672,139.131],[35.646,139.216],[35.602,139.253],[35.584,139.399],[35.502,139.468],[35.504,139.485],[35.576,139.473],[35.584,139.490],[35.562,139.490],[35.576,139.507],[35.612,139.449],[35.605,139.497],[35.643,139.525],[35.589,139.665],[35.537,139.702],[35.544,139.758],[35.527,139.790],[35.510,139.776],[35.523,139.769],[35.533,139.752],[35.512,139.765],[35.517,139.725],[35.500,139.732],[35.466,139.632],[35.439,139.691],[35.403,139.670],[35.396,139.622],[35.373,139.657],[35.342,139.657],[35.332,139.622],[35.328,139.661],[35.295,139.634],[35.301,139.672],[35.267,139.691],[35.253,139.747],[35.247,139.718],[35.212,139.725],[35.185,139.657],[35.139,139.678],[35.141,139.611],[35.163,139.627],[35.195,139.600],[35.215,139.628],[35.253,139.576],[35.294,139.569],[35.319,139.438],[35.292,139.247],[35.241,139.148],[35.179,139.137],[35.141,139.161],[35.151,139.029],[35.236,138.976],[35.330,139.019],[35.399,139.002],[35.410,138.917],[35.449,138.937],[35.537,139.113]],
  '山梨': [[35.971,138.370],[35.952,138.440],[35.939,138.454],[35.900,138.454],[35.897,138.471],[35.896,138.490],[35.922,138.509],[35.920,138.591],[35.909,138.612],[35.874,138.611],[35.870,138.676],[35.899,138.693],[35.909,138.729],[35.900,138.778],[35.862,138.814],[35.867,138.846],[35.840,138.893],[35.855,138.944],[35.831,138.970],[35.769,138.984],[35.719,139.026],[35.674,139.130],[35.653,139.118],[35.616,139.134],[35.587,139.122],[35.564,139.129],[35.512,139.085],[35.510,139.046],[35.481,139.027],[35.449,138.937],[35.401,138.916],[35.381,138.873],[35.390,138.852],[35.374,138.822],[35.358,138.680],[35.398,138.663],[35.393,138.610],[35.446,138.582],[35.434,138.559],[35.406,138.532],[35.331,138.535],[35.314,138.512],[35.202,138.533],[35.168,138.492],[35.182,138.429],[35.206,138.395],[35.312,138.365],[35.328,138.328],[35.305,138.286],[35.332,138.249],[35.362,138.251],[35.376,138.233],[35.407,138.257],[35.456,138.244],[35.516,138.268],[35.639,138.232],[35.671,138.195],[35.713,138.180],[35.758,138.236],[35.795,138.186],[35.882,138.238],[35.859,138.283]],
  '静岡': [[35.644,138.219],[35.516,138.268],[35.332,138.249],[35.305,138.286],[35.317,138.359],[35.200,138.399],[35.178,138.440],[35.168,138.492],[35.202,138.533],[35.314,138.512],[35.411,138.533],[35.446,138.582],[35.358,138.680],[35.399,139.002],[35.330,139.019],[35.236,138.976],[35.151,139.029],[35.141,139.111],[35.057,139.069],[35.046,139.100],[34.976,139.096],[34.936,139.148],[34.768,139.048],[34.743,138.997],[34.658,138.987],[34.674,138.948],[34.601,138.844],[34.690,138.739],[34.752,138.776],[34.819,138.752],[34.884,138.756],[34.908,138.790],[34.963,138.763],[35.017,138.780],[35.017,138.890],[35.048,138.906],[35.107,138.828],[35.145,138.685],[35.101,138.556],[35.032,138.494],[34.986,138.503],[35.013,138.533],[34.983,138.515],[34.915,138.357],[34.771,138.301],[34.670,138.198],[34.595,138.227],[34.658,138.063],[34.674,137.484],[34.811,137.487],[34.892,137.640],[35.035,137.717],[35.105,137.800],[35.211,137.828],[35.371,138.142],[35.448,138.119],[35.470,138.160],[35.555,138.142]],
};

function projectLatLon(lat, lon, bounds, view) {
  const { latMin, latMax, lonMin, lonMax } = bounds;
  const { w, h, margin } = view;
  return {
    x: margin + (lon - lonMin) / (lonMax - lonMin) * (w - margin * 2),
    y: margin + (latMax - lat) / (latMax - latMin) * (h - margin * 2),
  };
}

// 都道府県の輪郭ポリゴン（lat/lon配列）から、緯度方向のパディングを加えた表示範囲を求める。
// targetAspect（実距離の幅÷高さ）を指定すると、都道府県ごとに形が違っても表示の縦横比が
// 揃うよう、短い方の軸にパディングを追加して比率を合わせる（中心はずらさない）。
function computeMapBounds(polygonPoints, latPad, lonPad, targetAspect) {
  const lats = polygonPoints.map(p => p[0]);
  const lons = polygonPoints.map(p => p[1]);
  let latMin = Math.min(...lats) - latPad;
  let latMax = Math.max(...lats) + latPad;
  let lonMin = Math.min(...lons) - lonPad;
  let lonMax = Math.max(...lons) + lonPad;

  if (targetAspect) {
    const latMid = (latMin + latMax) / 2;
    const cosLat = Math.cos(latMid * Math.PI / 180);
    const latSpan = latMax - latMin;
    const lonSpan = lonMax - lonMin;
    const curAspect = (lonSpan * cosLat) / latSpan;
    if (curAspect < targetAspect) {
      const neededLonSpan = (targetAspect * latSpan) / cosLat;
      const extra = (neededLonSpan - lonSpan) / 2;
      lonMin -= extra; lonMax += extra;
    } else if (curAspect > targetAspect) {
      const neededLatSpan = (lonSpan * cosLat) / targetAspect;
      const extra = (neededLatSpan - latSpan) / 2;
      latMin -= extra; latMax += extra;
    }
  }

  return { latMin, latMax, lonMin, lonMax };
}

// 固定の縦横比でviewBoxサイズを求める（都道府県が変わっても表示の高さを揺らさないため）。
function computeMapView(targetAspect, targetH, margin) {
  const drawH = targetH - margin * 2;
  const drawW = drawH * targetAspect;
  return { w: Math.round(drawW + margin * 2), h: targetH, margin };
}

// 「エリア」欄の地名から、市町村レベル→都県レベルの順で関東の位置を判定する。
function resolveKantoLocation(area) {
  if (!area) return null;
  for (const name in KANTO_CITY_COORDS) {
    if (area.indexOf(name) !== -1) return { key: name, precise: true, ...KANTO_CITY_COORDS[name] };
  }
  for (const pref of KANTO_PREFECTURES) {
    if (area.indexOf(pref) !== -1) return { key: pref, precise: false, pref, ...KANTO_PREF_CENTROID[pref] };
  }
  return null;
}

// エリア分析で選択可能な都道府県（市町村レベルのデータが揃っているもののみ）。
const AREA_PREF_OPTIONS = ['神奈川', '千葉', '静岡'];

// 地図上にうっすら表示する、各都道府県の代表的な都市（位置の目印用）。
const AREA_MAJOR_CITIES = {
  '神奈川': ['横浜', '川崎', '横須賀', '鎌倉', '小田原'],
  '千葉':   ['千葉', '船橋', '木更津', '館山', '銚子'],
  '静岡':   ['静岡', '浜松', '沼津', '熱海', '下田'],
};
let selectedAreaPref = '神奈川';

// 神奈川県内の主要な釣り場の緯度経度（簡易版・網羅的ではない・市町村レベルより精密）。
const KANAGAWA_SPOT_COORDS = {
  '大黒海釣り公園':     { lat: 35.466, lon: 139.687 },
  '本牧海づり施設':     { lat: 35.421, lon: 139.668 },
  '磯子海づり施設':     { lat: 35.408, lon: 139.640 },
  '海の公園':           { lat: 35.339, lon: 139.648 },
  '八景島':             { lat: 35.346, lon: 139.654 },
  '横須賀うみかぜ公園': { lat: 35.288, lon: 139.668 },
  '観音崎公園':         { lat: 35.260, lon: 139.745 },
  '走水海岸':           { lat: 35.265, lon: 139.722 },
  '久里浜港':           { lat: 35.231, lon: 139.696 },
  '城ヶ島':             { lat: 35.135, lon: 139.616 },
  '三崎港':             { lat: 35.142, lon: 139.608 },
  '茅ヶ崎港':           { lat: 35.314, lon: 139.401 },
  '江の島':             { lat: 35.300, lon: 139.480 },
  '片瀬漁港':           { lat: 35.302, lon: 139.480 },
  '小田原港':           { lat: 35.246, lon: 139.149 },
  '真鶴港':             { lat: 35.156, lon: 139.137 },
  '東扇島':             { lat: 35.512, lon: 139.741 },
};

function resolveKanagawaSpot(spotName) {
  if (!spotName) return null;
  for (const name in KANAGAWA_SPOT_COORDS) {
    if (spotName.indexOf(name) !== -1) return { key: name, ...KANAGAWA_SPOT_COORDS[name] };
  }
  return null;
}

// 市町村名のみ（施設名なし）の場合、KANTO_CITY_COORDS（市町村レベル）から該当都県のものだけを拾う。
function resolveCityOnly(text, pref) {
  if (!text) return null;
  for (const name in KANTO_CITY_COORDS) {
    const c = KANTO_CITY_COORDS[name];
    if (c.pref === pref && text.indexOf(name) !== -1) return { key: name, ...c };
  }
  return null;
}

// 釣り場名でピンポイントに判定できなければ、釣り場名→エリア名の順に市町村レベルでも判定する。
// 施設名リスト（KANAGAWA_SPOT_COORDS）は神奈川県のみ収録しているため、選択中が神奈川の時だけ使う。
function resolveAreaLocation(ev) {
  if (selectedAreaPref === '神奈川') {
    const spot = resolveKanagawaSpot(ev.spot);
    if (spot) return { ...spot, precise: true };
  }
  const cityFromSpot = resolveCityOnly(ev.spot, selectedAreaPref);
  if (cityFromSpot) return { ...cityFromSpot, precise: false };
  const cityFromArea = resolveCityOnly(ev.area, selectedAreaPref);
  if (cityFromArea) return { ...cityFromArea, precise: false };
  return null;
}

function renderAreaMap() {
  els.areaPrefTabs?.querySelectorAll('.gear-tab').forEach(btn => {
    btn.classList.toggle('gear-tab-active', btn.dataset.pref === selectedAreaPref);
  });

  const events = filteredEvents();
  if (!events.length) {
    els.kantoMap.innerHTML = '<p class="empty">釣行記録がありません。</p>';
    return;
  }

  // 釣り場名でピンポイントに判定できたものを優先し、できなければ市町村レベルで
  // おおまかな位置を表示する。どちらも判定できなかった釣り場名は一覧表示する。
  const spotCounts = new Map(); // key -> { spot, count }
  const unresolvedNames = new Map(); // 入力された釣り場名 -> 件数
  events.forEach(ev => {
    const spot = resolveAreaLocation(ev);
    if (spot) {
      const entry = spotCounts.get(spot.key) || { spot, count: 0 };
      entry.count++;
      spotCounts.set(spot.key, entry);
    } else if (ev.spot) {
      unresolvedNames.set(ev.spot, (unresolvedNames.get(ev.spot) || 0) + 1);
    }
  });

  // 都道府県ごとに形が違っても表示の高さが揃うよう、固定の縦横比に合わせて表示範囲を求める
  const AREA_MAP_ASPECT = 1.3;
  const bounds = computeMapBounds(KANTO_PREF_POLYGONS[selectedAreaPref], 0.04, 0.05, AREA_MAP_ASPECT);
  const view = computeMapView(AREA_MAP_ASPECT, 420, 20);
  const project = (lat, lon) => projectLatLon(lat, lon, bounds, view);

  const defs = `
    <defs>
      <radialGradient id="kantoDotGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#ff62b3"/>
        <stop offset="55%" stop-color="#ff2d95"/>
        <stop offset="100%" stop-color="#6C3FE0"/>
      </radialGradient>
    </defs>`;

  const landPoints = KANTO_PREF_POLYGONS[selectedAreaPref]
    .map(([lat, lon]) => { const { x, y } = project(lat, lon); return `${x.toFixed(1)},${y.toFixed(1)}`; })
    .join(' ');
  const landShape = `<polygon points="${landPoints}" class="kanto-pref-land"><title>${escapeHtml(selectedAreaPref)}</title></polygon>`;

  const cityLabels = (AREA_MAJOR_CITIES[selectedAreaPref] || []).map(name => {
    const c = KANTO_CITY_COORDS[name];
    if (!c) return '';
    const { x, y } = project(c.lat, c.lon);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="kanto-city-label" text-anchor="middle">${escapeHtml(name)}</text>`;
  }).join('');

  const max = Math.max(1, ...[...spotCounts.values()].map(e => e.count));
  const dots = [...spotCounts.values()].map(({ spot, count }) => {
    const { x, y } = project(spot.lat, spot.lon);
    const r = (7 + (count / max) * 6).toFixed(1);
    const dim = (0.7 + (count / max) * 0.3).toFixed(2);
    const approxCls = spot.precise ? '' : ' kanto-dot-group-approx';
    const title = spot.precise ? `${spot.key}: ${count}回` : `${spot.key}（おおよその位置）: ${count}回`;
    return `
      <g class="kanto-dot-group${approxCls}" data-spot-key="${escapeHtml(spot.key)}" style="opacity:${dim}">
        <circle cx="${x}" cy="${y}" r="${r}" class="kanto-dot"><title>${escapeHtml(title)}</title></circle>
        <text x="${x}" y="${y}" class="kanto-dot-count" text-anchor="middle" dominant-baseline="central">${count}</text>
      </g>`;
  }).join('');

  const ranked = [...spotCounts.values()].sort((a, b) => b.count - a.count);
  const rankHtml = ranked.length
    ? `<ol class="kanto-rank-list">
        ${ranked.map(({ spot, count }) => `
          <li data-spot-key="${escapeHtml(spot.key)}">
            <span class="kanto-rank-dot"></span>
            <span class="kanto-rank-pref">${escapeHtml(spot.key)}</span>
            <span class="kanto-rank-count">${count}回</span>
          </li>`).join('')}
      </ol>`
    : '<p class="empty" style="margin-top:0.8rem">登録済みの釣り場が見つかりませんでした。</p>';

  const unresolvedHtml = unresolvedNames.size
    ? `<div class="kanto-unresolved">
        <p>※ 釣り場名・エリア名のどちらからも位置が分からない釣行があります。座標を追加すれば表示できます。</p>
        <ul class="kanto-unresolved-list">
          ${[...unresolvedNames.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) =>
            `<li>${escapeHtml(name)}<span class="kanto-unresolved-count">${n}件</span></li>`).join('')}
        </ul>
      </div>`
    : '';

  els.kantoMap.innerHTML = `
    <svg class="kanto-svg" viewBox="0 0 ${view.w} ${view.h}" xmlns="http://www.w3.org/2000/svg">${defs}${landShape}${cityLabels}${dots}</svg>
    <p class="kanto-map-caption">※ ${AREA_PREF_OPTIONS.map(escapeHtml).join('・')}のみ対応の簡易版です</p>
    ${rankHtml}
    ${unresolvedHtml}`;
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
      <svg class="icon icon-inline"><use href="#icon-sun"/></svg>${formatJstTime(sun.sunrise)}
      <svg class="icon icon-inline"><use href="#icon-moon"/></svg>${formatJstTime(sun.sunset)}
    </span>`;
    markers.push({ h: sunriseH, cls: 'tide-marker-sunrise', icon: 'icon-sun',  title: `日の出 ${formatJstTime(sun.sunrise)}` });
    markers.push({ h: sunsetH,  cls: 'tide-marker-sunset',  icon: 'icon-moon', title: `日の入り ${formatJstTime(sun.sunset)}` });
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
    ${phaseHtml || sunHtml || tripHtml ? `<div class="tide-chart-meta">${phaseHtml}${sunHtml}${tripHtml}</div>` : ''}
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

// 釣行カード内の「潮汐グラフ」表示へ、非同期で取得したグラフを差し込む。
async function hydrateTideGroup(ev) {
  const dateStr = normDateStr(ev.date);
  const hours = await fetchTideCached(ev.area, dateStr);
  const inner = document.querySelector(`.tide-chart-card-body[data-tide-event-id="${cssEscape(ev.id)}"]`);
  if (!inner) return; // 再描画でDOMが入れ替わっている場合

  if (!hours) {
    inner.innerHTML = '<p class="empty">この釣行のエリアでは潮汐データを取得できませんでした。</p>';
    return;
  }

  const countByHour = Array(24).fill(0);
  currentCatches
    .filter(c => c.eventId === ev.id)
    .forEach(c => {
      const h = parseHour(c.time);
      if (!isNaN(h)) countByHour[h] += Number(c.count) || 1;
    });

  const coords = resolveAreaCoords(ev.area);
  const sun = coords ? calcSunTimes(coords.lat, coords.lon, dateStr) : null;
  let tripRange = null;
  const startH = parseHourFraction(ev.startTime);
  if (startH != null) {
    const endH = parseHourFraction(ev.endTime);
    const now = new Date();
    tripRange = {
      start: startH,
      end: endH != null ? endH : (now.getHours() + now.getMinutes() / 60),
      ongoing: endH == null,
    };
  }

  inner.innerHTML = buildTideChartHtml(hours, countByHour, ev.tide, sun, tripRange);
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
        <span class="cr-time">${formatTime(c.time) || '--:--'}</span>
        <span class="cr-species">${escapeHtml(c.species || '-')}</span>
        <span class="cr-count">${countNum}匹</span>
        ${value > 0 ? `<span class="cr-value">¥${value.toLocaleString()}</span>` : ''}
        ${c.size ? `<span class="cr-size">${escapeHtml(String(c.size))} cm</span>` : ''}
        ${c.lure ? `<span class="cr-lure">${escapeHtml(c.lure)}</span>` : ''}
        ${c.layer ? `<span class="cr-layer">${escapeHtml(c.layer)}</span>` : ''}
        ${c.memo ? `<span class="cr-memo">${escapeHtml(c.memo)}</span>` : ''}
        ${photo ? `<img src="${escapeHtml(photo)}" class="catch-thumb" data-catch-id="${escapeHtml(c.id)}" alt="釣果写真">` : ''}
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
  const withTime = filteredCatches(events)
    .filter(c => c.time && c.eventId)
    .map(c => ({ c, ev: events.find(e => e.id === c.eventId) }))
    .filter(x => x.ev);

  // 釣行（日付＋釣り場名）フィルタ（プルダウン）
  const tripMap = new Map();
  withTime.forEach(({ ev }) => {
    if (!tripMap.has(ev.id)) tripMap.set(ev.id, `${normDateStr(ev.date)} ${ev.spot || '釣り場不明'}`);
  });
  const trips = [...tripMap.entries()].sort((a, b) => b[1].localeCompare(a[1]));
  const tripFilterHtml = `
    <label class="hm-select-label">釣行
      <select class="hm-trip-select">
        <option value=""${!heatmapTripFilter ? ' selected' : ''}>すべての釣行</option>
        ${trips.map(([id, label]) => `<option value="${escapeHtml(id)}"${heatmapTripFilter === id ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}
      </select>
    </label>`;

  // 魚種フィルタ（プルダウン）
  const allSpecies = [...new Set(withTime.map(x => x.c.species).filter(Boolean))].sort();
  const speciesFilterHtml = `
    <label class="hm-select-label">魚種
      <select class="hm-species-select">
        <option value=""${!heatmapSpeciesFilter ? ' selected' : ''}>全魚種</option>
        ${allSpecies.map(s => `<option value="${escapeHtml(s)}"${heatmapSpeciesFilter === s ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
    </label>`;

  // 潮フィルタ（プルダウン）
  const TIDE_ORDER = ['大潮', '中潮', '小潮', '長潮', '若潮'];
  const allTides = [...new Set(withTime.map(x => x.ev.tide).filter(Boolean))]
    .sort((a, b) => TIDE_ORDER.indexOf(a) - TIDE_ORDER.indexOf(b));
  const tideFilterHtml = `
    <label class="hm-select-label">潮
      <select class="hm-tide-select">
        <option value=""${!heatmapTideFilter ? ' selected' : ''}>すべての潮</option>
        ${allTides.map(t => `<option value="${escapeHtml(t)}"${heatmapTideFilter === t ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('')}
      </select>
    </label>`;

  const filterHtml = `<div class="heatmap-filter-row">${tripFilterHtml}${speciesFilterHtml}${tideFilterHtml}</div>`;

  if (!withTime.length) {
    els.heatmapTotalBadge.textContent = '';
    els.heatmap.innerHTML = filterHtml + '<p class="empty" style="margin-top:0.8rem">釣果データがありません。</p>';
    return;
  }

  // 魚種フィルタ ＆ 釣行（日付＋釣り場名）フィルタ ＆ 潮フィルタ は AND 条件で絞り込む
  const filtered = withTime.filter(({ c, ev }) => {
    if (heatmapSpeciesFilter && c.species !== heatmapSpeciesFilter) return false;
    if (heatmapTripFilter && ev.id !== heatmapTripFilter) return false;
    if (heatmapTideFilter && ev.tide !== heatmapTideFilter) return false;
    return true;
  });

  const totalCount = filtered.reduce((sum, { c }) => sum + (Number(c.count) || 1), 0);
  els.heatmapTotalBadge.innerHTML = `<span class="ec-catch-stat-value">${totalCount}</span><span class="ec-catch-stat-label">匹</span>`;

  if (!filtered.length) {
    els.heatmap.innerHTML = filterHtml + '<p class="empty" style="margin-top:0.8rem">該当する釣果データがありません。</p>';
    return;
  }

  // counts[monthIdx 0-11][slotIdx 0-23]
  const counts = Array.from({ length: 12 }, () => Array(24).fill(0));

  filtered.forEach(({ c, ev }) => {
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

function resetLayerSelection() {
  els.layerInput.value = '';
  document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('selected'));
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
  resetLayerSelection();
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
    layer:   els.layerInput.value,
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
    resetLayerSelection();
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

// ── Gear (ロッド・リール) ────────────────────────────────────────────
// 編集中の写真スロット（最大3枚）。各要素: { field, idField, url, id, pendingDataUrl, removed }
let gearPhotoState = [];

// ルアーは1枚、ロッド・リールは最大3枚まで。
function gearPhotoSuffixesForType(type) {
  return type === 'lure' ? GEAR_PHOTO_SUFFIXES.slice(0, 1) : GEAR_PHOTO_SUFFIXES;
}

function makeEmptyGearPhotoState(type) {
  return gearPhotoSuffixesForType(type).map(suffix => {
    const { field, idField } = gearPhotoFieldNames(suffix);
    return { field, idField, url: '', id: '', pendingDataUrl: null, removed: false };
  });
}

function renderGearPhotoSlots() {
  const filled = gearPhotoState
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.removed && (slot.url || slot.pendingDataUrl));

  els.gearPhotoSlots.innerHTML = filled.map(({ slot, index }) => `
    <div class="photo-slot">
      <img class="photo-thumb-preview" src="${escapeHtml(slot.pendingDataUrl || slot.url)}" alt="プレビュー">
      <button type="button" class="remove-photo-btn" data-slot="${index}"><svg class="icon"><use href="#icon-close"/></svg></button>
    </div>`).join('');

  els.gearPhotoAddLabel.hidden = filled.length >= gearPhotoState.length;
}

function applyGearPhotoLabelForType(type) {
  const max = gearPhotoSuffixesForType(type).length;
  els.gearPhotoTrigger.lastChild.textContent = ` 写真を撮る / 選択（最大${max}枚・任意）`;
}

function resetGearPhotoState(type) {
  gearPhotoState = makeEmptyGearPhotoState(type);
  applyGearPhotoLabelForType(type);
  els.gearPhotoInput.value = '';
  renderGearPhotoSlots();
}

// リールはスタイル欄に「アジング」のようなカテゴリではなくサイズ番号
// （例: C3000, 4000, 2500HG）を入力してもらい、それをリールサイズ・ライン比較の
// 大きさの基準として使う。ロッドの場合は通常のスタイルカテゴリ入力に戻す。
function applyStyleFieldForType(type) {
  if (type === 'reel') {
    els.styleLabelText.textContent = 'スタイル（リールサイズ番号）';
    els.styleInput.placeholder = '例: C3000 / 4000 / 2500HG';
    els.styleInput.removeAttribute('list');
  } else if (type === 'lure') {
    els.styleLabelText.textContent = 'スタイル（ルアーの種類）';
    els.styleInput.placeholder = '例: ミノー / メタルジグ / ワーム';
    els.styleInput.setAttribute('list', 'lureStyleList');
  } else {
    els.styleLabelText.textContent = 'スタイル';
    els.styleInput.placeholder = '例: アジング';
    els.styleInput.setAttribute('list', 'gearStyleList');
  }
}

// ロッド登録フォームの「装着しているリール」選択肢を、現在登録済みのリール一覧から作る。
// 既に他のロッドに装着済みのリールは、二重装着を防ぐため選択肢から外す
// （編集中のロッド自身が現在装着しているリールは、選択肢に残す）。
function populatePairedReelSelect(selectedId, rodId = null) {
  const reels = currentGears.filter(g => g.type === 'reel');
  const usedElsewhere = new Set(
    currentGears.filter(g => g.type === 'rod' && g.id !== rodId && g.pairedReelId).map(g => g.pairedReelId)
  );
  const selectableReels = reels.filter(r => r.id === selectedId || !usedElsewhere.has(r.id));
  els.pairedReelSelect.innerHTML = [
    '<option value="">未装着</option>',
    ...selectableReels.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name || '-')}</option>`),
  ].join('');
  els.pairedReelSelect.value = selectableReels.some(r => r.id === selectedId) ? selectedId : '';
}

function resetGearForm(type) {
  els.gearForm.reset();
  els.gearForm.elements['id'].value   = '';
  els.gearForm.elements['type'].value = type;
  els.gearFormTitle.textContent  = type === 'reel' ? 'リールを登録' : type === 'lure' ? 'ルアーを登録' : 'ロッドを登録';
  els.gearSubmitBtn.textContent  = '登録する';
  els.rodOnlyFields.hidden  = type !== 'rod';
  els.reelOnlyFields.hidden = type !== 'reel';
  els.lureOnlyFields.hidden = type !== 'lure';
  applyStyleFieldForType(type);
  resetGearPhotoState(type);
  if (type === 'rod') populatePairedReelSelect('');
}

function openGearForm(type) {
  resetGearForm(type);
  setGearTab(type);
  const section = document.getElementById('gear-form');
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeGearForm() {
  document.getElementById('gear-form').hidden = true;
}

function enterGearEditMode(g) {
  els.gearForm.elements['id'].value     = g.id;
  els.gearForm.elements['type'].value   = g.type;
  els.gearForm.elements['name'].value   = g.name  || '';
  els.gearForm.elements['style'].value  = g.style || '';
  applyStyleFieldForType(g.type);
  els.gearForm.elements['maker'].value  = g.maker || '';
  els.gearForm.elements['memo'].value   = g.memo  || '';
  els.gearForm.elements['selfWeight'].value     = g.selfWeight     || '';
  els.gearForm.elements['purchaseDate'].value   = normDateStr(g.purchaseDate);
  els.gearForm.elements['purchasePrice'].value  = g.purchasePrice  || '';
  els.gearForm.elements['rodLength'].value      = g.rodLength      || '';
  els.gearForm.elements['sinkerWeight'].value   = g.sinkerWeight   || '';
  if (g.type === 'rod') populatePairedReelSelect(g.pairedReelId, g.id);
  els.gearForm.elements['reelType'].value           = g.reelType           || '';
  els.gearForm.elements['retrieveLength'].value     = g.retrieveLength     || '';
  els.gearForm.elements['gearRatio'].value          = g.gearRatio          || '';
  els.gearForm.elements['nylonCapacity'].value      = g.nylonCapacity      || '';
  els.gearForm.elements['peCapacity'].value         = g.peCapacity         || '';
  els.gearForm.elements['maxDrag'].value            = g.maxDrag            || '';
  els.gearForm.elements['lineType'].value           = g.lineType           || '';
  els.gearForm.elements['lineSize'].value           = g.lineSize           || '';
  els.gearForm.elements['lastLineChangeDate'].value = normDateStr(g.lastLineChangeDate);
  els.gearForm.elements['leaderType'].value         = g.leaderType   || '';
  els.gearForm.elements['leaderSize'].value         = g.leaderSize   || '';
  els.gearForm.elements['leaderLength'].value       = g.leaderLength || '';
  els.gearForm.elements['color'].value              = g.color || '';
  els.gearFormTitle.textContent = (g.type === 'reel' ? 'リール' : g.type === 'lure' ? 'ルアー' : 'ロッド') + 'を編集';
  els.gearSubmitBtn.textContent = '更新する';
  els.rodOnlyFields.hidden  = g.type !== 'rod';
  els.reelOnlyFields.hidden = g.type !== 'reel';
  els.lureOnlyFields.hidden = g.type !== 'lure';
  setGearTab(g.type);

  applyGearPhotoLabelForType(g.type);
  gearPhotoState = makeEmptyGearPhotoState(g.type);
  gearPhotoState.forEach(slot => {
    slot.url = g[slot.field]   || '';
    slot.id  = g[slot.idField] || '';
  });
  els.gearPhotoInput.value = '';
  renderGearPhotoSlots();

  const section = document.getElementById('gear-form');
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function onGearSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.gearForm);
  const id   = fd.get('id') || uid();
  const type = fd.get('type');

  const payload = {
    action: fd.get('id') ? 'updateGear' : 'addGear',
    id,
    type,
    name:  fd.get('name'),
    style: fd.get('style'),
    maker: fd.get('maker'),
    memo:  fd.get('memo'),
    selfWeight:    fd.get('selfWeight'),
    purchaseDate:  fd.get('purchaseDate'),
    purchasePrice: fd.get('purchasePrice'),
    rodLength:     type === 'rod' ? fd.get('rodLength')     : '',
    sinkerWeight:  type === 'rod' ? fd.get('sinkerWeight')  : '',
    pairedReelId:  type === 'rod' ? fd.get('pairedReelId')  : '',
    reelType:           type === 'reel' ? fd.get('reelType')           : '',
    retrieveLength:     type === 'reel' ? fd.get('retrieveLength')     : '',
    gearRatio:          type === 'reel' ? fd.get('gearRatio')          : '',
    nylonCapacity:      type === 'reel' ? fd.get('nylonCapacity')      : '',
    peCapacity:         type === 'reel' ? fd.get('peCapacity')         : '',
    maxDrag:            type === 'reel' ? fd.get('maxDrag')            : '',
    lineType:           type === 'reel' ? fd.get('lineType')           : '',
    lineSize:           type === 'reel' ? fd.get('lineSize')           : '',
    lastLineChangeDate: type === 'reel' ? fd.get('lastLineChangeDate') : '',
    leaderType:         type === 'reel' ? fd.get('leaderType')         : '',
    leaderSize:         type === 'reel' ? fd.get('leaderSize')         : '',
    leaderLength:       type === 'reel' ? fd.get('leaderLength')       : '',
    color:              type === 'lure' ? fd.get('color')              : '',
  };

  els.gearSubmitBtn.disabled = true;
  els.gearSubmitBtn.textContent = fd.get('id') ? '更新中...' : '登録中...';

  const oldPhotoIdsToDelete = [];

  for (const slot of gearPhotoState) {
    if (slot.removed) {
      payload[slot.field]   = '';
      payload[slot.idField] = '';
      if (slot.id) oldPhotoIdsToDelete.push(slot.id);
    } else if (slot.pendingDataUrl) {
      if (isMockMode()) {
        payload[slot.field]   = slot.pendingDataUrl;
        payload[slot.idField] = '';
      } else {
        els.gearSubmitBtn.textContent = '写真をアップロード中...';
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
    setStatus(fd.get('id') ? 'タックルを更新しました。' : 'タックルを登録しました。', 'ok');
    closeGearForm();
    await loadAll();
  }

  els.gearSubmitBtn.disabled = false;
  els.gearSubmitBtn.textContent = fd.get('id') ? '更新する' : '登録する';
}

function gearSpecHtml(g) {
  const specs = [];
  if (g.type === 'rod' && g.rodLength)    specs.push(`全長${escapeHtml(g.rodLength)}cm`);
  if (g.selfWeight)                       specs.push(`自重${escapeHtml(g.selfWeight)}g`);
  if (g.type === 'rod' && g.sinkerWeight) specs.push(`錘負荷${escapeHtml(g.sinkerWeight)}`);
  if (g.type === 'reel' && g.reelType)        specs.push(escapeHtml(g.reelType));
  if (g.type === 'reel' && g.retrieveLength) specs.push(`巻取${escapeHtml(g.retrieveLength)}cm`);
  if (g.type === 'reel' && g.gearRatio)      specs.push(`ギア比${escapeHtml(g.gearRatio)}`);
  if (g.type === 'reel' && g.maxDrag)        specs.push(`ドラグ${escapeHtml(g.maxDrag)}kg`);
  if (g.type === 'reel' && g.nylonCapacity) specs.push(`糸巻量ナイロン:${escapeHtml(g.nylonCapacity)}`);
  if (g.type === 'reel' && g.peCapacity)    specs.push(`糸巻量PE:${escapeHtml(g.peCapacity)}`);
  if (g.type === 'reel' && (g.lineType || g.lineSize || g.lastLineChangeDate)) {
    const type   = escapeHtml(g.lineType || '');
    const size   = escapeHtml(g.lineSize || '');
    const date   = g.lastLineChangeDate ? `(${escapeHtml(normDateStr(g.lastLineChangeDate))}交換)` : '';
    specs.push(['現在ライン', [type, size].filter(Boolean).join(' '), date].filter(Boolean).join(' '));
  }
  if (g.type === 'reel' && (g.leaderType || g.leaderSize || g.leaderLength)) {
    const ltype  = escapeHtml(g.leaderType  || '');
    const lsize  = escapeHtml(g.leaderSize  || '');
    const llen   = g.leaderLength ? escapeHtml(g.leaderLength) : '';
    specs.push(['リーダー', [ltype, lsize, llen].filter(Boolean).join(' ')].filter(Boolean).join(' '));
  }
  if (g.purchaseDate || g.purchasePrice) {
    const date  = g.purchaseDate  ? escapeHtml(normDateStr(g.purchaseDate)) : '';
    const price = g.purchasePrice ? `¥${Number(g.purchasePrice).toLocaleString()}` : '';
    specs.push(['購入', date, price].filter(Boolean).join(' '));
  }
  return specs.length ? `<span class="gear-spec">${specs.join(' / ')}</span>` : '';
}

function gearRowHtml(g) {
  const photos = gearPhotoSlots(g);
  const sep = `<span class="gear-sep">/</span>`;
  const inlineParts = [
    `<span class="gear-name">${escapeHtml(g.name || '-')}</span>`,
    g.style ? `<span class="badge badge-outline">${escapeHtml(g.style)}</span>` : '',
    g.maker ? `<span class="gear-maker">${escapeHtml(g.maker)}</span>` : '',
    gearSpecHtml(g),
  ].filter(Boolean);
  return `
    <div class="gear-row">
      ${inlineParts.join(sep)}
      ${g.memo ? `${sep}<span class="gear-memo">${escapeHtml(g.memo)}</span>` : ''}
      ${photos.length ? photos.map(p => `<img src="${escapeHtml(p.url)}" class="gear-thumb" data-gear-id="${escapeHtml(g.id)}" data-photo-field="${p.field}" alt="${escapeHtml(g.name || '')}">`).join('') : ''}
      <div class="gear-actions">
        <button type="button" class="icon-btn edit-gear-btn" data-id="${escapeHtml(g.id)}">編集</button>
        <button type="button" class="icon-btn delete-gear-btn" data-id="${escapeHtml(g.id)}">削除</button>
      </div>
    </div>`;
}

// ルアー一覧は写真を名前の下に大きく表示し、補足情報は自重のみに絞る。
// 錘負荷の最大値(g換算)以下のルアーであれば「対応ロッド」とする（軽いルアーを
// 太いロッドで使うのは問題ないため、下限はチェックしない）。
function compatibleRodNames(lureWeight) {
  return currentGears
    .filter(r => r.type === 'rod')
    .filter(r => {
      const range = sinkerWeightRangeGrams(r.sinkerWeight);
      return range && lureWeight <= range.max;
    })
    .map(r => r.name || '-');
}

// 巻かれているラインの号数・タイプから推定した適合重量の最大値以下のルアーで
// あれば「対応リール」とする（リール自体に重量上限データがないため、ライン号数
// 早見表で代替。ロッドと同様に下限はチェックしない）。
function compatibleReelNames(lureWeight) {
  return currentGears
    .filter(r => r.type === 'reel')
    .filter(r => {
      const range = reelLureWeightRange(r);
      return range && lureWeight <= range.max;
    })
    .map(r => r.name || '-');
}

function lureRowHtml(g) {
  const photo  = gearPhotoSlots(g)[0];
  const weight = g.selfWeight !== '' && g.selfWeight != null ? Number(g.selfWeight) : null;
  const hasWeight = weight != null && !isNaN(weight);

  const compatHtml = hasWeight ? `
    <div class="lure-compat">
      <div class="lure-compat-row"><span class="lure-compat-label">対応ロッド</span><span class="lure-compat-value">${compatibleRodNames(weight).map(escapeHtml).join('、') || 'なし'}</span></div>
      <div class="lure-compat-row"><span class="lure-compat-label">対応リール/ライン</span><span class="lure-compat-value">${compatibleReelNames(weight).map(escapeHtml).join('、') || 'なし'}</span></div>
    </div>` : `<p class="lure-compat-hint">自重を入力すると対応タックルが分かります。</p>`;

  return `
    <div class="lure-row">
      <div class="lure-row-head">
        <span class="gear-name">${escapeHtml(g.name || '-')}</span>
        <div class="gear-actions">
          <button type="button" class="icon-btn edit-gear-btn" data-id="${escapeHtml(g.id)}">編集</button>
          <button type="button" class="icon-btn delete-gear-btn" data-id="${escapeHtml(g.id)}">削除</button>
        </div>
      </div>
      ${hasWeight ? `<span class="gear-spec">自重${escapeHtml(g.selfWeight)}g</span>` : ''}
      <div class="lure-row-body">
        ${photo ? `<img src="${escapeHtml(photo.url)}" class="gear-thumb lure-photo" data-gear-id="${escapeHtml(g.id)}" data-photo-field="${photo.field}" alt="${escapeHtml(g.name || '')}">` : ''}
        ${compatHtml}
      </div>
    </div>`;
}

// 自重(g)を10g単位のbinインデックスに変換する。未入力/不正値はnull。
function lureWeightBin(g) {
  const w = Number(g.selfWeight);
  if (g.selfWeight === '' || g.selfWeight == null || isNaN(w) || w < 0) return null;
  return Math.floor(w / 10);
}

function lureColorKey(g) {
  return (g.color || '').trim() || '未設定';
}

function renderLureColorFilter(lures) {
  const colors = [...new Set(lures.map(lureColorKey))]
    .sort((a, b) => a === '未設定' ? 1 : b === '未設定' ? -1 : a.localeCompare(b, 'ja'));
  els.lureColorFilterChips.innerHTML = `
    <button class="hm-chip${!lureColorFilter ? ' hm-chip-active' : ''}" data-color="">すべて</button>
    ${colors.map(c => `<button class="hm-chip${lureColorFilter === c ? ' hm-chip-active' : ''}" data-color="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
  `;
}

function renderLureWeightFilter(lures) {
  const bins = [...new Set(lures.map(lureWeightBin).filter(b => b != null))].sort((a, b) => a - b);
  const hasUnset = lures.some(g => lureWeightBin(g) == null);
  els.lureWeightFilterChips.innerHTML = `
    <button class="hm-chip${!lureWeightFilter ? ' hm-chip-active' : ''}" data-bin="">すべて</button>
    ${bins.map(b => `<button class="hm-chip${lureWeightFilter === String(b) ? ' hm-chip-active' : ''}" data-bin="${b}">${b * 10}-${b * 10 + 9}g</button>`).join('')}
    ${hasUnset ? `<button class="hm-chip${lureWeightFilter === 'unset' ? ' hm-chip-active' : ''}" data-bin="unset">未設定</button>` : ''}
  `;
}

function filteredLures(lures) {
  return lures.filter(g => {
    if (lureColorFilter && lureColorKey(g) !== lureColorFilter) return false;
    if (lureWeightFilter) {
      const bin = lureWeightBin(g);
      if (lureWeightFilter === 'unset') { if (bin != null) return false; }
      else if (String(bin) !== lureWeightFilter) return false;
    }
    return true;
  });
}

function renderGearLists() {
  const rods  = currentGears.filter(g => g.type === 'rod');
  const reels = currentGears.filter(g => g.type === 'reel');
  const lures = currentGears.filter(g => g.type === 'lure')
    .sort((a, b) => (Number(b.selfWeight) || -1) - (Number(a.selfWeight) || -1));
  els.rodList.innerHTML  = rods.length  ? rods.map(gearRowHtml).join('')  : '<p class="empty">登録されたロッドはありません。</p>';
  els.reelList.innerHTML = reels.length ? reels.map(gearRowHtml).join('') : '<p class="empty">登録されたリールはありません。</p>';
  renderLureColorFilter(lures);
  renderLureWeightFilter(lures);
  const visibleLures = filteredLures(lures);
  els.lureList.innerHTML = visibleLures.length ? visibleLures.map(lureRowHtml).join('') : '<p class="empty">該当するルアーはありません。</p>';
  els.lureCountBadge.innerHTML = `<span class="ec-catch-stat-value">${visibleLures.length}</span><span class="ec-catch-stat-label">個</span>`;
  renderRodLengthRuler(rods);
  renderReelSizeChart(reels);
  renderLureWeightChart(lures);
  renderTackleCombo(rods, reels);
}

// 自重(g)を10g単位のbinに分け、bin毎のルアー数を棒グラフで表示する。
// ルアーのカラー名から塗り色を決める。「銀白」のように色の漢字が2つ含まれる
// 場合は、その2色の縦じまパターンで表現する（実際の見た目に近づけるため）。
const LURE_COLOR_HEX = {
  'シルバー': '#8C8C8C', '銀': '#8C8C8C',
  'ホワイト': '#F2F2F2', '白': '#F2F2F2',
  'ゴールド': '#B8910A', '金': '#B8910A',
  'チャート': '#9FBE00',
  'グロー':   '#8FC72A',
  'ピンク':   '#D6347F',
  'イワシ':   '#3F6BA8',
  '赤': '#C2241B',
  '緑': '#1E8449',
  '青': '#1B5FBF',
  '黒': '#262626',
  '紫': '#6C3FE0',
  '黄': '#D4AC1F',
  '橙': '#D98300',
  'オレンジ': '#D98300',
};
const LURE_COLOR_KANJI_TOKENS = ['銀', '白', '金', '赤', '緑', '青', '黒', '紫', '黄', '橙'];

// hex色を指定割合だけ明るくする（グラデーションの明側に使う）。
function lightenHex(hex, amt) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return `rgb(${r}, ${g}, ${b})`;
}

// バー全体の高さに沿って「明→暗」の縦グラデーションを作る（Chart.jsのscriptable color）。
function lureColorGradient(hex) {
  return (context) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return hex;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, lightenHex(hex, 0.5));
    gradient.addColorStop(1, hex);
    return gradient;
  };
}

// 2色を交互に並べたタイルを作り、繰り返しパターンとして使うことで縦じまを表現する。
function createStripePattern(colorA, colorB) {
  const size = 12;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, size / 2, size);
  ctx.fillStyle = colorB;
  ctx.fillRect(size / 2, 0, size / 2, size);
  return ctx.createPattern(canvas, 'repeat');
}

function resolveLureColorFill(colorKey, fallbackIndex) {
  if (colorKey === '未設定') return '#a8a8ad';
  if (LURE_COLOR_HEX[colorKey]) return LURE_COLOR_HEX[colorKey];

  const found = [];
  LURE_COLOR_KANJI_TOKENS.forEach(tok => {
    if (colorKey.includes(tok) && !found.includes(tok)) found.push(tok);
  });
  if (found.length >= 2) return createStripePattern(LURE_COLOR_HEX[found[0]], LURE_COLOR_HEX[found[1]]);
  if (found.length === 1) return LURE_COLOR_HEX[found[0]];

  return CHART_PALETTE[fallbackIndex % CHART_PALETTE.length];
}

// 重さ(g)を10g単位のbinに分け、登録時のカラーごとに積み上げ棒グラフで表示する。
function renderLureWeightChart(lures) {
  const withWeight = lures
    .map(g => ({ g, w: Number(g.selfWeight) }))
    .filter(({ g, w }) => g.selfWeight !== '' && g.selfWeight != null && !isNaN(w) && w >= 0);

  if (lureWeightChartInst) { lureWeightChartInst.destroy(); lureWeightChartInst = null; }

  if (!withWeight.length) {
    els.lureWeightChartWrap.innerHTML = '<p class="empty">自重(g)を入力したルアーがあると、重量別の本数を表示できます。</p>';
    return;
  }

  if (!els.lureWeightChartWrap.querySelector('canvas')) {
    els.lureWeightChartWrap.innerHTML = '<canvas id="lureWeightChart"></canvas>';
  }

  const binCount = Math.floor(Math.max(...withWeight.map(x => x.w)) / 10) + 1;
  const labels = Array.from({ length: binCount }, (_, i) => `${i * 10}-${i * 10 + 9}g`);

  const colorOrder = [];
  const colorCounts = new Map();
  withWeight.forEach(({ g, w }) => {
    const key = (g.color || '').trim() || '未設定';
    if (!colorCounts.has(key)) { colorCounts.set(key, new Array(binCount).fill(0)); colorOrder.push(key); }
    colorCounts.get(key)[Math.floor(w / 10)]++;
  });

  const datasets = colorOrder.map((key, i) => {
    const fill = resolveLureColorFill(key, i);
    return {
      label: key,
      data: colorCounts.get(key),
      backgroundColor: typeof fill === 'string' ? lureColorGradient(fill) : fill,
      borderWidth: 0,
      stack: 'lures',
      borderRadius: 4,
      maxBarThickness: 44,
    };
  });

  const axisOpts = chartAxisOpts();
  lureWeightChartInst = new Chart(document.getElementById('lureWeightChart'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#8b8b8b', boxWidth: 14, font: { family: 'Lato', size: 11 } } },
      },
      scales: {
        x: { ...axisOpts.x, stacked: true },
        y: { ...axisOpts.y, stacked: true },
      },
    },
  });
}

// 文字列先頭の数値部分を取り出す（"C3000" → 3000, "0.6号" → 0.6 など）。
function parseLeadingNumber(str) {
  const m = String(str || '').match(/[\d.]+/);
  return m ? Number(m[0]) : null;
}

// 文字列中の数値をすべて取り出し最大値を返す（"3-21g" → 21 など）。
// 錘負荷は範囲表記が基本なので、扱える上限（太い方の数値）を代表値として使う。
function parseMaxNumber(str) {
  const nums = String(str || '').match(/[\d.]+/g);
  return nums ? Math.max(...nums.map(Number)) : null;
}

const GRAM_PER_GO = 3.75; // 1号 = 3.75g（オモリ号数の標準的な換算）

// 錘負荷の上限値を「号」の尺度に揃えて返す。数値の直後に付く単位（号 / g）を
// 個別に読み取り、それぞれ号に変換してから最大値を採用する。
// "50号 (200g)" のように同じ値を号とgの両方で書いているケースでも、単純に
// 文字列内の数値の最大値（200）をそのまま使うと号換算が効かず4倍近くに
// 太さが膨張してしまうため、数値ごとに単位を見て変換する。
// アジング/エギングロッドはg表記、船・サーフロッドは号表記が一般的なため、
// 混在していても太さの比較が公平になるようにする。
function sinkerWeightToGo(str) {
  const s = String(str || '');
  const pairs = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(号|g)/gi)];
  if (pairs.length) {
    return Math.max(...pairs.map(([, num, unit]) => {
      const n = Number(num);
      return /g/i.test(unit) ? n / GRAM_PER_GO : n;
    }));
  }
  // 数値に単位が直接付いていない場合は、号数とみなして数値の最大値を使う。
  return parseMaxNumber(s);
}

// 錘負荷の文字列（例: "0.5-7g", "20-30号", "21g"）から [最小g, 最大g] を抽出する。
// 号表記は1号=3.75gとして換算する。数値が見つからなければnull。
function sinkerWeightRangeGrams(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  const nums = s.match(/[\d.]+/g);
  if (!nums || !nums.length) return null;
  // "0.5-7g" のように単位は末尾に一度だけ書かれる前提で、末尾の単位を採用する。
  // 単位が見つからない場合は号数とみなす（他の錘負荷パース処理と同じ規則）。
  const isGram = /g\s*$/i.test(s);
  const values = nums.map(Number).map(n => isGram ? n : n * GRAM_PER_GO);
  return { min: Math.min(...values), max: Math.max(...values) };
}

// ライン号数(PE/ナイロン・フロロ)から適合ルアー重量(g)の目安レンジを引く早見表。
// 「ライン号数・ルアー重さ早見表」モーダルと同じ値。
const PE_LINE_LURE_WEIGHT_TABLE = [
  { go: 0.3, min: 0.5,  max: 4 },
  { go: 0.4, min: 1,    max: 6 },
  { go: 0.6, min: 3,    max: 10 },
  { go: 0.8, min: 5,    max: 15 },
  { go: 1,   min: 7,    max: 20 },
  { go: 1.5, min: 10,   max: 30 },
  { go: 2,   min: 15,   max: 40 },
  { go: 3,   min: 30,   max: 60 },
  { go: 4,   min: 40,   max: 80 },
  { go: 5,   min: 60,   max: 120 },
];
const NYLON_LINE_LURE_WEIGHT_TABLE = [
  { go: 0.8, min: 1,  max: 5 },
  { go: 1,   min: 1,  max: 6 },
  { go: 1.5, min: 2,  max: 8 },
  { go: 2,   min: 3,  max: 10 },
  { go: 3,   min: 7,  max: 20 },
  { go: 4,   min: 10, max: 30 },
  { go: 5,   min: 15, max: 40 },
  { go: 6,   min: 20, max: 50 },
  { go: 8,   min: 30, max: 70 },
  { go: 10,  min: 40, max: 100 },
];

// リールに巻かれているライン号数・タイプから、適合ルアー重量レンジを推定する。
// ラインの太さ自体に重量制限はないが、号数は釣り方の規模（=扱うルアー重量帯）の
// 目安になるため、早見表の最も近い号数の行を採用する。
function reelLureWeightRange(reel) {
  const goNum = parseLeadingNumber(reel.lineSize);
  if (goNum == null) return null;
  const isPe = /pe/i.test(reel.lineType || '');
  const isNylonFamily = /ナイロン|フロロ|エステル|nylon/i.test(reel.lineType || '');
  if (!isPe && !isNylonFamily) return null;
  const table = isPe ? PE_LINE_LURE_WEIGHT_TABLE : NYLON_LINE_LURE_WEIGHT_TABLE;
  return table.reduce((best, row) => Math.abs(row.go - goNum) < Math.abs(best.go - goNum) ? row : best, table[0]);
}

// ロッドの錘負荷(号)から推奨ライン号数(PE/ナイロン・フロロ)を引く早見表。
// 「錘負荷・ライン号数早見表」モーダルと同じ値。
const ROD_SINKER_LINE_TABLE = [
  { go: 0.3, pe: [0.15, 0.3], nylon: [0.6, 0.8] },
  { go: 0.5, pe: [0.2,  0.4], nylon: [0.8, 1] },
  { go: 1,   pe: [0.3,  0.6], nylon: [1,   1.5] },
  { go: 2,   pe: [0.6,  0.8], nylon: [1.5, 2] },
  { go: 3,   pe: [0.8,  1],   nylon: [2,   2.5] },
  { go: 5,   pe: [1,    1.5], nylon: [2.5, 3] },
  { go: 8,   pe: [1.5,  2],   nylon: [3,   4] },
  { go: 10,  pe: [2,    2.5], nylon: [4,   5] },
  { go: 15,  pe: [2.5,  3],   nylon: [5,   6] },
  { go: 20,  pe: [3,    4],   nylon: [6,   8] },
  { go: 30,  pe: [4,    5],   nylon: [8,   10] },
  { go: 40,  pe: [5,    6],   nylon: [10,  12] },
  { go: 50,  pe: [6,    8],   nylon: [12,  14] },
];

// ロッドの錘負荷とリールに巻かれているラインの号数が、早見表の目安に対して
// 適切か（細すぎる/太すぎる）を判定する。ロッドの錘負荷は上限値（太い方の
// 数値）を代表値とする（他の錘負荷の強さ比較と同じ規則）。
// ラインの種類(PE/ナイロン系)が判別できない、号数が読めない場合はnullを返す。
function rodReelLineCompatibility(rod, reel) {
  if (!reel || !reel.lineSize) return null;
  const sinkerGo = sinkerWeightToGo(rod.sinkerWeight);
  const lineGo = parseLeadingNumber(reel.lineSize);
  if (sinkerGo == null || lineGo == null) return null;
  const isPe = /pe/i.test(reel.lineType || '');
  const isNylonFamily = /ナイロン|フロロ|エステル|nylon/i.test(reel.lineType || '');
  if (!isPe && !isNylonFamily) return null;
  const row = ROD_SINKER_LINE_TABLE.reduce(
    (best, r) => Math.abs(r.go - sinkerGo) < Math.abs(best.go - sinkerGo) ? r : best,
    ROD_SINKER_LINE_TABLE[0]
  );
  const [min, max] = isPe ? row.pe : row.nylon;
  const status = lineGo < min ? 'thin' : lineGo > max ? 'thick' : 'ok';
  return { status, min, max };
}

// rodReelLineCompatibilityの判定結果を、タックル組み合わせカードに表示する
// バッジのテキスト・配色クラス・補足(title)に変換する。
function tackleCompatLabel(compat) {
  const rangeText = `${compat.min}号-${compat.max}号`;
  if (compat.status === 'ok') {
    return { cls: 'tackle-combo-compat-ok', text: '◎ ライン適合', title: `推奨ライン号数の目安: ${rangeText}` };
  }
  if (compat.status === 'thin') {
    return { cls: 'tackle-combo-compat-warn', text: '△ライン細め', title: `推奨ライン号数の目安: ${rangeText}（ロッドの錘負荷に対してラインが細く、高負荷時に切れやすい可能性があります）` };
  }
  return { cls: 'tackle-combo-compat-warn', text: '▲ライン太め', title: `推奨ライン号数の目安: ${rangeText}（ロッドの錘負荷に対してラインが太く、感度・遠投性が落ちる可能性があります）` };
}

// ロッドの錘負荷とリールに設定されているリーダー号数が適正かを判定する。
// リーダーはフロロ/ナイロン系が前提なので、早見表のnylon列を使う。
// リーダー号数または錘負荷が未入力の場合はnullを返す。
function rodLeaderCompatibility(rod, reel) {
  if (!reel || !reel.leaderSize) return null;
  const sinkerGo = sinkerWeightToGo(rod.sinkerWeight);
  const leaderGo = parseLeadingNumber(reel.leaderSize);
  if (sinkerGo == null || leaderGo == null) return null;
  const row = ROD_SINKER_LINE_TABLE.reduce(
    (best, r) => Math.abs(r.go - sinkerGo) < Math.abs(best.go - sinkerGo) ? r : best,
    ROD_SINKER_LINE_TABLE[0]
  );
  const isPe = /PE/i.test(reel.leaderType || '');
  const [min, max] = isPe ? row.pe : row.nylon;
  const status = leaderGo < min ? 'thin' : leaderGo > max ? 'thick' : 'ok';
  return { status, min, max, isPe };
}

function leaderCompatLabel(compat) {
  const lineKind = compat.isPe ? 'PEリーダー' : 'リーダー';
  const rangeText = `${compat.min}号-${compat.max}号`;
  if (compat.status === 'ok') {
    return { cls: 'tackle-combo-compat-ok', text: '◎ リーダー適合', title: `錘負荷に対する推奨${lineKind}号数の目安: ${rangeText}` };
  }
  if (compat.status === 'thin') {
    return { cls: 'tackle-combo-compat-warn', text: '△ リーダーが細め', title: `錘負荷に対する推奨${lineKind}号数の目安: ${rangeText}（リーダーが細く、高負荷時に切れやすい可能性があります）` };
  }
  return { cls: 'tackle-combo-compat-warn', text: '△ リーダーが太め', title: `錘負荷に対する推奨${lineKind}号数の目安: ${rangeText}（リーダーが太く、感度・遠投性が落ちる可能性があります）` };
}

// 最新ライン交換日からの経過日数（未入力なら null）。
function daysSince(dateStr) {
  const s = normDateStr(dateStr);
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const today = new Date(todayStr());
  return Math.floor((today - d) / 86400000);
}

const LINE_AGE_WARN_DAYS   = 365; // 1年以上: 交換を検討
const LINE_AGE_DANGER_DAYS = 730; // 2年以上: 交換必須

// ライン交換からの経過日数を、しきい値に応じて色・アイコン付きで表すバッジ。
function lineAgeBadgeHtml(g) {
  const days = daysSince(g.lastLineChangeDate);
  if (days == null) return '';
  if (days >= LINE_AGE_DANGER_DAYS) {
    return `<span class="reel-line-age reel-line-age-danger" title="ライン交換から${days}日。交換必須です。">
      <svg class="icon icon-inline"><use href="#icon-alert"/></svg>交換必須<small>交換から${days}日</small>
    </span>`;
  }
  if (days >= LINE_AGE_WARN_DAYS) {
    return `<span class="reel-line-age reel-line-age-warn" title="ライン交換から${days}日。そろそろ交換を検討してください。">
      <svg class="icon icon-inline"><use href="#icon-alert"/></svg>要交換<small>交換から${days}日</small>
    </span>`;
  }
  return `<span class="reel-line-age reel-line-age-ok"><small>交換から${days}日</small></span>`;
}

// リールの「スタイル」欄に入力された番号（例: 2500, C3000, 4000HG）をスプールの
// 大きさ、巻いているライン（種別・太さ）をスプール周りの色付きリングで表現し、
// 見た目で大きさ・ラインを比較できるようにする。
// PEラインはアプリ共通のグラデーション、ナイロンラインは鮮やかな黄色のグラデーションで表示する。
function renderReelSizeChart(reels) {
  const withSize = reels
    .map(g => ({ g, size: parseLeadingNumber(g.style) }))
    .filter(x => x.size != null)
    .sort((a, b) => b.size - a.size);

  if (withSize.length === 0) {
    els.reelSizeChart.innerHTML = '<p class="empty">スタイル欄にリールサイズ番号（例: 4000 / C3000）を入力すると比較できます。</p>';
    return;
  }

  const MIN_R = 20, MAX_R = 32;
  const MIN_STROKE = 2, MAX_STROKE = 10;
  // SVGのキャンバスは全行で固定サイズにし、円は常にキャンバス中心に描く。
  // これにより縦に並べたときにリールサイズが違っても円の中心が揃う。
  // リーダーリング（フランジ外側）を収めるため96pxに設定。
  const DIM = 96;
  const C = DIM / 2;

  const maxSize = Math.max(...withSize.map(x => x.size));
  const lineNums = withSize.map(x => parseLeadingNumber(x.g.lineSize)).filter(n => n != null);
  const maxLineNum = lineNums.length ? Math.max(...lineNums) : 1;

  const rows = withSize.map(({ g, size }) => {
    const isBait = /ベイト/i.test(g.reelType || '');
    // ベイトリールはスピニング2500番手相当の固定サイズで表示する。
    const effectiveSize = isBait ? 2500 : size;
    const r = Math.min(MAX_R, MIN_R + (effectiveSize / maxSize) * (MAX_R - MIN_R));
    const lineNum  = parseLeadingNumber(g.lineSize);
    const isPe     = /pe/i.test(g.lineType || '');
    const isNylon  = /ナイロン|nylon/i.test(g.lineType || '');
    const stroke   = lineNum != null ? MIN_STROKE + (lineNum / maxLineNum) * (MAX_STROKE - MIN_STROKE) : 0;
    const peGradId    = `peGrad-${g.id}`;
    const nylonGradId = `nylonGrad-${g.id}`;
    const lineStroke  = isPe ? `url(#${peGradId})` : isNylon ? `url(#${nylonGradId})` : 'var(--ink-faint)';

    // ベイトリール用: 正方形を中心(C,C)に描くヘルパー。hs = half-side。
    const bRect = (hs, cls, extra = '') =>
      `<rect x="${(C - hs).toFixed(1)}" y="${(C - hs).toFixed(1)}" width="${(2 * hs).toFixed(1)}" height="${(2 * hs).toFixed(1)}" rx="4" ${cls ? `class="${cls}"` : ''} ${extra} />`;

    const nWraps = stroke > 0 ? Math.max(3, Math.round(stroke * 1.2)) : 0;

    let ring, windTexture, flange, innerRim, body;
    if (isBait) {
      ring = stroke > 0
        ? bRect(r + stroke / 2, '', `fill="none" stroke="${lineStroke}" stroke-width="${stroke.toFixed(1)}"`)
        : '';
      windTexture = Array.from({ length: nWraps }, (_, i) => {
        const hs = r + stroke * ((i + 1) / (nWraps + 1));
        return bRect(hs, 'reel-spool-wind');
      }).join('');
      flange = stroke > 0 ? bRect(r + stroke + 1.3, 'reel-spool-flange') : '';
      innerRim = bRect(r * 0.55, 'reel-spool-inner-rim');
      body     = bRect(r, 'reel-spool-body');
    } else {
      ring = stroke > 0
        ? `<circle cx="${C}" cy="${C}" r="${(r + stroke / 2).toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="${stroke.toFixed(1)}" />`
        : '';
      windTexture = Array.from({ length: nWraps }, (_, i) => {
        const rr = r + stroke * ((i + 1) / (nWraps + 1));
        return `<circle cx="${C}" cy="${C}" r="${rr.toFixed(1)}" class="reel-spool-wind" />`;
      }).join('');
      const flangeR = r + stroke + 1.3;
      flange = stroke > 0 ? `<circle cx="${C}" cy="${C}" r="${flangeR.toFixed(1)}" class="reel-spool-flange" />` : '';
      innerRim = `<circle cx="${C}" cy="${C}" r="${(r * 0.55).toFixed(1)}" class="reel-spool-inner-rim" />`;
      body     = `<circle cx="${C}" cy="${C}" r="${r}" class="reel-spool-body" />`;
    }

    // リーダーが登録されている場合、フランジ外側に破線リングを描く。
    // フロロカーボン=グレー系、ナイロン=黄色系、その他=グレーで色分けする。
    const hasLeader = !!(g.leaderSize || g.leaderType);
    const isLeaderFluro = /フロロ/i.test(g.leaderType || '');
    const isLeaderNylon = /ナイロン/i.test(g.leaderType || '');
    const leaderColor   = isLeaderFluro ? '#a0a0b8' : isLeaderNylon ? '#ffe980' : '#a0a0a0';
    const leaderTitle   = ['リーダー', g.leaderType, g.leaderSize, g.leaderLength].filter(Boolean).join(' ');
    let leaderRing = '';
    if (hasLeader) {
      if (isBait) {
        const leaderBaseHs = stroke > 0 ? r + stroke + 1.3 : r + 2;
        const leaderRingHs = leaderBaseHs + 3.5;
        leaderRing = `<rect x="${(C - leaderRingHs).toFixed(1)}" y="${(C - leaderRingHs).toFixed(1)}" width="${(2 * leaderRingHs).toFixed(1)}" height="${(2 * leaderRingHs).toFixed(1)}" rx="5" class="reel-leader-ring" stroke="${leaderColor}"><title>${escapeHtml(leaderTitle)}</title></rect>`;
      } else {
        const flangeR    = r + stroke + 1.3;
        const leaderBaseR = stroke > 0 ? flangeR : r + 2;
        const leaderRingR = leaderBaseR + 3.5;
        leaderRing = `<circle cx="${C}" cy="${C}" r="${leaderRingR.toFixed(1)}" class="reel-leader-ring" stroke="${leaderColor}"><title>${escapeHtml(leaderTitle)}</title></circle>`;
      }
    }

    const peDefs = isPe ? `
      <defs>
        <linearGradient id="${peGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#6C3FE0"/>
          <stop offset="80%"  stop-color="#ff2d95"/>
          <stop offset="100%" stop-color="#ff2d95"/>
        </linearGradient>
      </defs>` : '';

    const nylonDefs = isNylon ? `
      <defs>
        <linearGradient id="${nylonGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#fff066"/>
          <stop offset="80%"  stop-color="#ffb300"/>
          <stop offset="100%" stop-color="#ffb300"/>
        </linearGradient>
      </defs>` : '';

    const lineTypeShort = isPe ? 'PE' : isNylon ? 'ナイロン' : (g.lineType || '');
    const centerLabel = lineTypeShort || g.lineSize
      ? `<text x="${C}" y="${C}" text-anchor="middle" dominant-baseline="middle" class="reel-spool-label">
          <tspan x="${C}" dy="-0.15em">${escapeHtml(lineTypeShort)}</tspan>
          <tspan x="${C}" dy="1.15em">${escapeHtml(g.lineSize || '')}</tspan>
        </text>`
      : `<text x="${C}" y="${C}" text-anchor="middle" dominant-baseline="middle" class="reel-spool-label reel-spool-label-empty">ラインなし</text>`;

    const leaderSizeLabel = hasLeader
      ? `リーダー: ${escapeHtml([g.leaderType, g.leaderSize].filter(Boolean).join(' '))}`
      : '';
    return `
      <div class="reel-compare-row">
        <span class="reel-compare-info">
          <span class="reel-compare-name">${escapeHtml(g.name || '-')}</span>
          ${g.reelType ? `<span class="reel-compare-type reel-compare-type-${isBait ? 'bait' : 'spinning'}">${escapeHtml(g.reelType)}</span>` : ''}
          <span class="reel-compare-size">${escapeHtml(g.style)}</span>
          ${g.retrieveLength ? `<span class="reel-compare-spec">巻取${escapeHtml(g.retrieveLength)}cm</span>` : ''}
          ${g.gearRatio      ? `<span class="reel-compare-spec">ギア比${escapeHtml(g.gearRatio)}</span>`      : ''}
        </span>
        <div class="reel-spool-wrap">
          <svg class="reel-spool-svg" width="${DIM}" height="${DIM}" viewBox="0 0 ${DIM} ${DIM}">
            ${peDefs}
            ${nylonDefs}
            ${leaderRing}
            ${ring}
            ${windTexture}
            ${flange}
            ${body}
            ${innerRim}
            ${centerLabel}
          </svg>
          ${leaderSizeLabel ? `<span class="reel-leader-label">${leaderSizeLabel}</span>` : ''}
        </div>
        ${lineAgeBadgeHtml(g)}
      </div>`;
  }).join('');

  els.reelSizeChart.innerHTML = rows;
}

// リールに巻かれているラインの種類から、リールスプール比較と同じ配色
// （PE=紫→ピンク、ナイロン系=黄→オレンジ）を返す。ライン情報が無ければnull。
function lineColorStops(reel) {
  if (!reel || !reel.lineType) return null;
  if (/pe/i.test(reel.lineType)) return ['#6C3FE0', '#ff2d95'];
  if (/ナイロン|フロロ|エステル|nylon/i.test(reel.lineType)) return ['#fff066', '#ffb300'];
  return null;
}

// ラインの種類・号数を「PE0.6号」のような短い表記にまとめる。情報が無ければnull。
function abbreviateLineType(str) {
  return String(str || '').replace(/フロロカーボン/g, 'フロロ');
}

function lineTypeSizeLabel(reel) {
  if (!reel) return null;
  const isPe = /pe/i.test(reel.lineType || '');
  const isNylon = /ナイロン|フロロ|エステル|nylon/i.test(reel.lineType || '');
  const typeShort = isPe ? 'PE' : isNylon ? 'ナイロン' : abbreviateLineType(reel.lineType || '');
  const label = [typeShort, reel.lineSize].filter(Boolean).join('');
  return label || null;
}

// ロッド1本を、釣り上げる構えのように斜めに傾けたイラストとして描く。横に並べた
// ときの占有幅を抑えるため、グリップ（支点）を中心に一定角度だけ回転させる。
// カード間で同じcm→px換算（maxLenCmが最大表示幅になる比率）を使うことで、
// ロッドの全長差がそのまま見た目の長さ差として伝わるようにする。ブランクと
// リールのスプール（糸が巻かれている部分）はどちらも、巻かれているライン
// （PE=紫→ピンク／ナイロン系=黄→オレンジ／不明=グレー）と同じ色で塗る。
// リールが装着されている場合は、穂先からそのライン色の糸を垂らし、先に魚が
// 掛かっている様子を加えて「釣れている」イメージを表現する。
// リール未装着の場合は破線の空リールで表し、糸・魚は描かない。
function tackleComboSvg(rod, reel, maxLenCm) {
  const TARGET_MAX_W = 140;
  const ANGLE = -42;
  const ORIGIN_X = 42, ORIGIN_Y = 112;
  const buttHalf = 6.5, tipHalf = 1.4;
  // 竿先がしなっている様子を出すため、先端の中心線をTIP_BEND分だけブランクの
  // 「腹側」(=ラインが垂れている方向)にずらす。Q曲線のコントロール点はバット側の
  // y座標のまま固定しているため、ずれはt^2に比例して先端付近に集中する。
  const TIP_BEND = 16;
  const lenCm = Number(rod.rodLength) || 200;
  const unitPerCm = TARGET_MAX_W / (maxLenCm || lenCm);
  const barUnits = unitPerCm * lenCm;
  const gripUnits = Math.min(22, lenCm * 0.16) * unitPerCm;
  const ctrlX = gripUnits + (barUnits - gripUnits) * 0.55;
  const gradId = `comboGrad-${rod.id}`;

  const nGuides = 3;
  const guides = Array.from({ length: nGuides }, (_, i) => {
    const f = Math.pow((i + 1) / nGuides, 1.5);
    const x = gripUnits + f * (barUnits - gripUnits);
    const half = buttHalf + (tipHalf - buttHalf) * f;
    const y = TIP_BEND * f * f;
    return `<ellipse class="rod-blank-guide" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.4" ry="${(half + 2.6).toFixed(1)}" />`;
  }).join('');

  const reelCx = gripUnits + 12;
  const reelCy = buttHalf + 11;
  const reelR  = 13;
  // リール部分にカーソルを合わせたときだけ、そのリールに巻かれているラインの
  // 号数・タイプから推定した適合ルアー重量（=ラインが耐えられる負荷の目安）を
  // ネイティブのSVGツールチップとして表示する。カード全体のtitle（ロッド側の
  // 錘負荷・最大ドラグ力）より内側の要素なので、ホバー中はこちらが優先される。
  const reelLoadRange = reel ? reelLureWeightRange(reel) : null;
  const reelTitleText = reel
    ? [
        reel.lineType || reel.lineSize ? `ラ: ${[reel.lineType, reel.lineSize].filter(Boolean).join(' ')}` : 'ライン情報なし',
        reelLoadRange ? `適合ルアー重量目安: ${reelLoadRange.min}-${reelLoadRange.max}g` : '',
      ].filter(Boolean).join('\n')
    : 'リール未装着';
  const reelTitle = `<title>${escapeHtml(reelTitleText)}</title>`;

  // ロッドのブランクと、リールのスプール（糸が巻かれている部分）を同じ色にすることで、
  // どのラインが装着されているか一目で分かるようにする（PE=紫→ピンク／ナイロン系=黄→
  // オレンジ／不明=グレー）。
  const stops = lineColorStops(reel);
  const bodyFill  = stops ? `url(#${gradId})` : '';
  const bodyClass = stops ? '' : reel ? ' tackle-combo-rod-body-unknown' : ' tackle-combo-rod-body-none';
  const gradDefs = stops ? `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${stops[0]}"/>
          <stop offset="80%" stop-color="${stops[1]}"/>
          <stop offset="100%" stop-color="${stops[1]}"/>
        </linearGradient>` : '';
  const spoolFill  = stops ? `url(#${gradId})` : '';
  const spoolClass = stops ? '' : ' tackle-combo-reel-spool-unknown';

  const reelMount = reel
    ? `
      <g>${reelTitle}
      <line x1="${reelCx.toFixed(1)}" y1="${(buttHalf - 1).toFixed(1)}" x2="${reelCx.toFixed(1)}" y2="${(reelCy - reelR + 3).toFixed(1)}" class="tackle-combo-reel-foot" />
      <circle cx="${reelCx.toFixed(1)}" cy="${reelCy.toFixed(1)}" r="${reelR}" class="tackle-combo-reel-body" />
      <circle cx="${reelCx.toFixed(1)}" cy="${reelCy.toFixed(1)}" r="${(reelR - 4).toFixed(1)}" class="tackle-combo-reel-spool${spoolClass}" ${spoolFill ? `fill="${spoolFill}"` : ''} />
      <circle cx="${reelCx.toFixed(1)}" cy="${reelCy.toFixed(1)}" r="2" class="tackle-combo-reel-axle" />
      </g>`
    : `
      <g>${reelTitle}
      <circle cx="${reelCx.toFixed(1)}" cy="${reelCy.toFixed(1)}" r="${reelR}" class="tackle-combo-reel-empty" />
      <line x1="${(reelCx - 5).toFixed(1)}" y1="${reelCy.toFixed(1)}" x2="${(reelCx + 5).toFixed(1)}" y2="${reelCy.toFixed(1)}" class="tackle-combo-reel-empty-mark" />
      </g>`;

  // 穂先（ロッド先端）の絶対座標を求め、回転グループの外側にラインと魚を描く。
  // ラインの糸自体は、回転に関わらず常に下に垂れているように見せたいため。
  const rad = ANGLE * Math.PI / 180;
  const tipX = ORIGIN_X + barUnits * Math.cos(rad) - TIP_BEND * Math.sin(rad);
  const tipY = ORIGIN_Y + barUnits * Math.sin(rad) + TIP_BEND * Math.cos(rad);
  const lineColor = stops ? stops[1] : reel ? 'var(--ink-faint)' : null;
  let catchMarkup = '';
  if (lineColor) {
    const fishX = tipX + 7;
    const fishY = tipY + 46;
    const ctrlLX = (tipX + fishX) / 2 - 5;
    const ctrlLY = (tipY + fishY) / 2 + 10;
    catchMarkup = `
      <path d="M ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${ctrlLX.toFixed(1)} ${ctrlLY.toFixed(1)} ${fishX.toFixed(1)} ${fishY.toFixed(1)}" class="tackle-combo-line" stroke="${lineColor}" />
      <g class="tackle-combo-fish" transform="translate(${fishX.toFixed(1)} ${fishY.toFixed(1)}) rotate(25)" fill="${lineColor}">
        <polygon points="-11,0 -16,-5 -16,5" />
        <ellipse cx="0" cy="0" rx="8" ry="4.5" />
        <circle cx="4.5" cy="-1.2" r="1.1" fill="var(--surface)" />
      </g>`;
  }

  return `
    <svg class="tackle-combo-svg" viewBox="0 0 175 175">
      <defs>${gradDefs}</defs>
      <g transform="translate(${ORIGIN_X} ${ORIGIN_Y}) rotate(${ANGLE})">
        <rect class="rod-blank-grip" x="0" y="${(-buttHalf - 4).toFixed(1)}" width="${gripUnits.toFixed(1)}" height="${(buttHalf * 2 + 8).toFixed(1)}" rx="4"/>
        <path class="tackle-combo-rod-body${bodyClass}" ${bodyFill ? `fill="${bodyFill}"` : ''} d="M ${gripUnits.toFixed(1)} ${(-buttHalf).toFixed(1)} Q ${ctrlX.toFixed(1)} ${(-buttHalf).toFixed(1)} ${barUnits.toFixed(1)} ${(TIP_BEND - tipHalf).toFixed(1)} L ${barUnits.toFixed(1)} ${(TIP_BEND + tipHalf).toFixed(1)} Q ${ctrlX.toFixed(1)} ${buttHalf.toFixed(1)} ${gripUnits.toFixed(1)} ${buttHalf.toFixed(1)} Z"/>
        ${guides}
        <circle class="rod-blank-tiptop" cx="${barUnits.toFixed(1)}" cy="${TIP_BEND.toFixed(1)}" r="3"/>
        ${reelMount}
      </g>
      ${catchMarkup}
    </svg>`;
}

// ロッド×リールの組み合わせを、釣り上げる構えのイラストのカードで一覧表示する。
// リールを装着しているロッドを左側に、その中・装着なし側それぞれは全長が長い
// ロッドほど左に来るよう並べる。全カードで同じcm→px比率（最長ロッドが基準）を
// 使うことで、ロッドの全長差がイラストの長さ差としてそのまま伝わるようにする
// （cm数値も併記）。カード内のセレクトから直接、装着するリールを変更できる。
// ロッド部分にカーソルを合わせると錘負荷（号とg換算の両方）を、リール部分に
// 合わせるとライン情報と適合ルアー重量目安をツールチップで表示する。
function renderTackleCombo(rods, reels) {
  if (rods.length === 0) {
    els.tackleCombo.innerHTML = '<p class="empty">ロッドを登録すると、組み合わせを設定できます。</p>';
    return;
  }

  const reelById = new Map(reels.map(r => [r.id, r]));
  // 既に他のロッドに装着済みのリールは、二重装着を防ぐため選択肢から外す
  // （自分自身が現在装着しているリールは、装着解除できるよう選択肢に残す）。
  const pairedElsewhere = rod => new Set(
    rods.filter(r => r.id !== rod.id && r.pairedReelId).map(r => r.pairedReelId)
  );
  const maxLenCm = Math.max(...rods.map(r => Number(r.rodLength) || 200));
  // リールを装着しているロッドを左側に、その中でも全長が長いロッドほど左に来るよう並べる。
  const sortedRods = [...rods].sort((a, b) => {
    const aHasReel = reelById.has(a.pairedReelId) ? 1 : 0;
    const bHasReel = reelById.has(b.pairedReelId) ? 1 : 0;
    if (aHasReel !== bHasReel) return bHasReel - aHasReel;
    return (Number(b.rodLength) || 0) - (Number(a.rodLength) || 0);
  });
  const cards = sortedRods.map(rod => {
    const reel = reelById.get(rod.pairedReelId) || null;
    const usedElsewhere = pairedElsewhere(rod);
    const selectableReels = reels.filter(r => r.id === rod.pairedReelId || !usedElsewhere.has(r.id));
    const options = [
      `<option value="">未装着</option>`,
      ...selectableReels.map(r => `<option value="${escapeHtml(r.id)}"${r.id === rod.pairedReelId ? ' selected' : ''}>${escapeHtml(r.name || '-')}</option>`),
    ].join('');
    const sinkerG = sinkerWeightRangeGrams(rod.sinkerWeight);
    const fmtG = n => (Number.isInteger(n) ? n : n.toFixed(1));
    const fmtGoRange = range => {
      const minGo = fmtG(range.min / GRAM_PER_GO);
      const maxGo = fmtG(range.max / GRAM_PER_GO);
      return range.min === range.max ? `${minGo}号` : `${minGo}号-${maxGo}号`;
    };
    const loadInfo = sinkerG
      ? `錘負荷${fmtG(sinkerG.min / GRAM_PER_GO)}-${fmtG(sinkerG.max / GRAM_PER_GO)}号(${fmtG(sinkerG.min)}-${fmtG(sinkerG.max)}g)`
      : '錘負荷: 不明';
    const rodPowerLabel = sinkerG ? `錘負荷${fmtGoRange(sinkerG)}` : '';
    const lineLabel = lineTypeSizeLabel(reel);
    const lineCompat = reel ? rodReelLineCompatibility(rod, reel) : null;
    const compatInfo = lineCompat ? tackleCompatLabel(lineCompat) : null;
    const leaderCompat = reel ? rodLeaderCompatibility(rod, reel) : null;
    const leaderCompatInfo = leaderCompat ? leaderCompatLabel(leaderCompat) : null;
    const leaderLabel = reel && reel.leaderSize ? [abbreviateLineType(reel.leaderType), reel.leaderSize].filter(Boolean).join(' ') : '';
    return `
      <div class="tackle-combo-card${reel ? '' : ' tackle-combo-card-empty'}" title="${escapeHtml(loadInfo)}">
        ${tackleComboSvg(rod, reel, maxLenCm)}
        <div class="tackle-combo-labels">
          <span class="tackle-combo-rod-name">${escapeHtml(rod.name || '-')}</span>
          <span class="tackle-combo-rod-len">${escapeHtml(rodPowerLabel)}</span>
          <select class="tackle-combo-reel-select" data-rod-id="${escapeHtml(rod.id)}" data-reel-type="${reel ? (/ベイト/i.test(reel.reelType || '') ? 'bait' : 'spinning') : ''}">${options}</select>
          ${lineLabel ? `<span class="tackle-combo-line-label"><span class="tackle-line-prefix">ラ:</span>${escapeHtml(lineLabel)}</span>` : ''}
          ${compatInfo ? `<span class="tackle-combo-compat ${compatInfo.cls}" title="${escapeHtml(compatInfo.title)}">${escapeHtml(compatInfo.text)}</span>` : ''}
          ${leaderLabel ? `<span class="tackle-combo-line-label"><span class="tackle-line-prefix">リ:</span>${escapeHtml(leaderLabel)}</span>` : ''}
          ${leaderCompatInfo ? `<span class="tackle-combo-compat ${leaderCompatInfo.cls}" title="${escapeHtml(leaderCompatInfo.title)}">${escapeHtml(leaderCompatInfo.text)}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  els.tackleCombo.innerHTML = `<div class="tackle-combo-row">${cards}</div>`;
}

// 1本のロッドを、グリップ・テーパーするブランク・ガイドリング・トップガイドを持つ
// SVGシルエットとして描く。ロッドの長さに比例した実寸スケールで描くため、グリップや
// ガイドの太さ・間隔は行ごとに変わらず一貫した見た目になる。
// powerRatio (0〜1) は錘負荷の相対的な強さで、ブランクの太さ（butt/tip径）に
// 反映する。値が大きいほど太く頑丈なロッドに見え、耐えられるオモリの重さが
// 一目でわかるようにする。
function rodBlankSvg(g, lenCm, unitPerCm, powerRatio) {
  const H = 56, cy = 28;
  const buttHalf = 7 + powerRatio * 9;   // 7〜16
  const tipHalf  = 1.4 + powerRatio * 2; // 1.4〜3.4
  const barUnits = lenCm * unitPerCm;
  const gripUnits = Math.min(22, lenCm * 0.16) * unitPerCm;
  const ctrlX = gripUnits + (barUnits - gripUnits) * 0.55;
  const gradId = `rodGrad-${g.id}`;

  const nGuides = Math.min(8, Math.max(4, Math.round(lenCm / 40)));
  const guides = Array.from({ length: nGuides }, (_, i) => {
    const f = Math.pow((i + 1) / nGuides, 1.5);
    const x = gripUnits + f * (barUnits - gripUnits);
    const half = buttHalf + (tipHalf - buttHalf) * f;
    return `<ellipse class="rod-blank-guide" cx="${x.toFixed(1)}" cy="${cy}" rx="1.6" ry="${(half + 3).toFixed(1)}" />`;
  }).join('');

  return `
    <svg class="rod-blank-svg" style="width:${(lenCm * unitPerCm / 10).toFixed(2)}%" viewBox="0 0 ${barUnits.toFixed(1)} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#9a9aa2"/>
          <stop offset="80%" stop-color="#4a4a52"/>
          <stop offset="100%" stop-color="#4a4a52"/>
        </linearGradient>
      </defs>
      <rect class="rod-blank-grip" x="0" y="${(cy - buttHalf - 4).toFixed(1)}" width="${gripUnits.toFixed(1)}" height="${(buttHalf * 2 + 8).toFixed(1)}" rx="4"/>
      <path class="rod-blank-body" fill="url(#${gradId})" d="M ${gripUnits.toFixed(1)} ${(cy - buttHalf).toFixed(1)} Q ${ctrlX.toFixed(1)} ${(cy - buttHalf).toFixed(1)} ${barUnits.toFixed(1)} ${(cy - tipHalf).toFixed(1)} L ${barUnits.toFixed(1)} ${(cy + tipHalf).toFixed(1)} Q ${ctrlX.toFixed(1)} ${(cy + buttHalf).toFixed(1)} ${gripUnits.toFixed(1)} ${(cy + buttHalf).toFixed(1)} Z"/>
      ${guides}
      <circle class="rod-blank-tiptop" cx="${barUnits.toFixed(1)}" cy="${cy}" r="3"/>
    </svg>`;
}

// ロッドの全長を、グリップ～ガイドリング～トップガイドまで再現したシルエットで比較する。
// 全行を貫く目盛りグリッド線を背面に敷くことで、長さの違いを定規のように読み取れる。
function renderRodLengthRuler(rods) {
  const withLength = rods
    .filter(g => g.rodLength && !isNaN(Number(g.rodLength)))
    .sort((a, b) => Number(b.rodLength) - Number(a.rodLength));

  if (withLength.length === 0) {
    els.rodLengthRuler.innerHTML = '<p class="empty">全長を入力したロッドを登録すると比較できます。</p>';
    return;
  }

  const maxLength = Math.max(...withLength.map(g => Number(g.rodLength)));
  const niceMax = Math.ceil(maxLength / 100) * 100;
  const unitPerCm = 1000 / niceMax;
  const ticks = [];
  for (let t = 0; t <= niceMax; t += 100) ticks.push(t);

  // 錘負荷の上限値（号換算）から、登録されているロッドの中での相対的な強さ(0〜1)を求める。
  // 未入力のロッドは中間的な太さで描き、極端に細く/太く見えないようにする。
  const powers = withLength.map(g => sinkerWeightToGo(g.sinkerWeight));
  const maxPower = Math.max(...powers.filter(n => n != null), 0);

  const scaleRow = `
    <div class="rod-ruler-row rod-ruler-scale-row">
      <span></span>
      <div class="rod-ruler-scale">
        ${ticks.map(t => `<span class="rod-ruler-tick" style="left:${(t / niceMax * 100).toFixed(1)}%">${t}</span>`).join('')}
      </div>
      <span class="rod-ruler-unit">cm</span>
    </div>`;

  const minorTicks = [];
  for (let t = 50; t < niceMax; t += 50) if (t % 100 !== 0) minorTicks.push(t);
  const gridlines = `
    <div class="rod-ruler-gridlines">
      ${minorTicks.map(t => `<span class="rod-ruler-gridline rod-ruler-gridline-minor" style="left:${(t / niceMax * 100).toFixed(2)}%"></span>`).join('')}
      ${ticks.filter(t => t > 0).map(t => `<span class="rod-ruler-gridline rod-ruler-gridline-major" style="left:${(t / niceMax * 100).toFixed(2)}%"></span>`).join('')}
    </div>`;

  const rows = withLength.map(g => {
    const lenCm = Number(g.rodLength);
    const power = sinkerWeightToGo(g.sinkerWeight);
    const powerRatio = maxPower > 0 ? (power != null ? power / maxPower : 0.45) : 0.45;
    return `
    <div class="rod-ruler-row">
      <span class="rod-ruler-info">
        <span class="rod-ruler-name">${escapeHtml(g.name || '-')}</span>
        ${g.sinkerWeight ? `<span class="rod-ruler-sinker">錘負荷${escapeHtml(g.sinkerWeight)}</span>` : ''}
      </span>
      <div class="rod-ruler-track">
        ${rodBlankSvg(g, lenCm, unitPerCm, powerRatio)}
      </div>
      <span class="rod-ruler-len">${escapeHtml(g.rodLength)}cm</span>
    </div>`;
  }).join('');

  els.rodLengthRuler.innerHTML = `${gridlines}<div class="rod-ruler-rows">${scaleRow}${rows}</div>`;
}

async function handleGearListClick(e) {
  const thumb = e.target.closest('.gear-thumb');
  if (thumb) { openPhotoLightbox(thumb.src, 'gear', thumb.dataset.gearId, thumb.dataset.photoField); return; }

  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('edit-gear-btn')) {
    const g = currentGears.find(g => g.id === id);
    if (g) enterGearEditMode(g);
    return;
  }

  if (btn.classList.contains('delete-gear-btn')) {
    const g = currentGears.find(g => g.id === id);
    if (!g || !confirm(`「${g.name}」を削除しますか？`)) return;
    await sendAction({ action: 'deleteGear', id });
    for (const p of gearPhotoSlots(g)) await deleteDrivePhoto(p.id);
    await loadAll();
  }
}

// タックル組み合わせイラストのセレクトから、ロッドに装着するリールを直接変更する。
async function onTackleComboReelChange(e) {
  const select = e.target.closest('.tackle-combo-reel-select');
  if (!select) return;
  const rod = currentGears.find(g => g.id === select.dataset.rodId);
  if (!rod) return;
  const selectedReel = currentGears.find(g => g.id === select.value);
  select.dataset.reelType = selectedReel
    ? (/ベイト/i.test(selectedReel.reelType || '') ? 'bait' : 'spinning')
    : '';
  select.disabled = true;
  await sendAction({ ...rod, action: 'updateGear', pairedReelId: select.value });
  await loadAll();
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
  f.elements['layer'].value   = c.layer   || '';
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

function openLineInfoModal() {
  els.lineInfoModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLineInfoModal() {
  els.lineInfoModal.hidden = true;
  document.body.style.overflow = '';
}

function openLureLineInfoModal() {
  els.lureLineInfoModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLureLineInfoModal() {
  els.lureLineInfoModal.hidden = true;
  document.body.style.overflow = '';
}

function openRodLineInfoModal() {
  els.rodLineInfoModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeRodLineInfoModal() {
  els.rodLineInfoModal.hidden = true;
  document.body.style.overflow = '';
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
  const list = type === 'event' ? currentEvents : type === 'gear' ? currentGears : currentCatches;
  const record = list.find(r => r.id === id);
  if (!record || !confirm('この写真を削除しますか？')) return;
  const photoIdField = photoField.replace('photo', 'photoId');

  if (isMockMode()) {
    const action = type === 'event' ? 'updateEvent' : type === 'gear' ? 'updateGear' : 'updateCatch';
    await sendAction({ ...record, action, [photoField]: '', [photoIdField]: '' });
  } else if (type === 'event') {
    await deleteDrivePhoto(record[photoIdField], { eventId: record.id, photoField });
  } else if (type === 'gear') {
    await deleteDrivePhoto(record[photoIdField], { gearId: record.id, photoField });
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
    layer:   fd.get('layer'),
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

  if (btn.classList.contains('tide-toggle-btn')) {
    const card = btn.closest('.event-card');
    const meta = card.querySelector('.ec-meta');
    const photos = card.querySelector('.ec-photos');
    const tideBody = card.querySelector('.tide-chart-card-body');
    const showTide = tideBody.hidden; // 表示切替前の状態から、これから表示する側を判定
    meta.hidden = showTide;
    if (photos) photos.hidden = showTide;
    tideBody.hidden = !showTide;
    card.querySelectorAll('.ec-action-default').forEach(b => { b.hidden = showTide; });
    btn.textContent = showTide ? '元に戻る' : '潮汐グラフ';
    if (showTide) {
      tideViewIds.add(id);
      hydrateTideGroup(currentEvents.find(e => e.id === id));
    } else {
      tideViewIds.delete(id);
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
  els.navShowGear.addEventListener('click', showGearScreen);
  els.navShowRodForm.addEventListener('click', () => openGearForm('rod'));
  els.navShowReelForm.addEventListener('click', () => openGearForm('reel'));
  els.navShowLureForm.addEventListener('click', () => openGearForm('lure'));
  els.gearTabRod.addEventListener('click', () => setGearTab('rod'));
  els.gearTabReel.addEventListener('click', () => setGearTab('reel'));
  els.gearTabLure.addEventListener('click', () => setGearTab('lure'));
  els.lureColorFilterChips.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    lureColorFilter = chip.dataset.color;
    renderGearLists();
  });
  els.lureWeightFilterChips.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    lureWeightFilter = chip.dataset.bin;
    renderGearLists();
  });
  setGearTab(gearTab);

  els.analysisTabTrip.addEventListener('click', () => setAnalysisTab('trip'));
  els.analysisTabCatch.addEventListener('click', () => setAnalysisTab('catch'));
  setAnalysisTab(analysisTab);

  els.areaPrefTabs.addEventListener('click', e => {
    const btn = e.target.closest('.gear-tab');
    if (!btn) return;
    selectedAreaPref = btn.dataset.pref;
    renderAreaMap();
  });

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

  // Layer (タナ) quick-tap buttons — optional, tap again to deselect
  els.layerBtns.addEventListener('click', e => {
    const btn = e.target.closest('.layer-btn');
    if (!btn) return;
    const layer = btn.dataset.layer;
    const alreadySelected = btn.classList.contains('selected');
    document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('selected'));
    if (alreadySelected) {
      els.layerInput.value = '';
    } else {
      btn.classList.add('selected');
      els.layerInput.value = layer;
    }
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

  // Photo capture (gear form)
  els.gearPhotoInput.addEventListener('change', async () => {
    const file = els.gearPhotoInput.files[0];
    els.gearPhotoInput.value = '';
    if (!file) return;
    const emptyIndex = gearPhotoState.findIndex(s => !s.removed && !s.url && !s.pendingDataUrl);
    if (emptyIndex === -1) return;
    try {
      const dataUrl = await compressImage(file);
      gearPhotoState[emptyIndex].pendingDataUrl = dataUrl;
      renderGearPhotoSlots();
    } catch { /* 読み込み失敗時はそのスロットを空のままにする */ }
  });

  els.gearPhotoSlots.addEventListener('click', e => {
    const btn = e.target.closest('.remove-photo-btn');
    if (!btn) return;
    const slot = gearPhotoState[Number(btn.dataset.slot)];
    if (!slot) return;
    if (slot.url) slot.removed = true;
    slot.pendingDataUrl = null;
    renderGearPhotoSlots();
  });

  // Forms
  els.quickCatchForm.addEventListener('submit', onQuickCatchSubmit);
  els.eventForm.addEventListener('submit', onEventSubmit);
  els.cancelEventEdit.addEventListener('click', () => {
    exitEventEditMode();
    toggleEventForm(false);
  });
  els.gearForm.addEventListener('submit', onGearSubmit);
  els.cancelGearEdit.addEventListener('click', closeGearForm);
  els.rodList.addEventListener('click', handleGearListClick);
  els.reelList.addEventListener('click', handleGearListClick);
  els.lureList.addEventListener('click', handleGearListClick);
  els.tackleCombo.addEventListener('change', onTackleComboReelChange);
  els.catchEditForm.addEventListener('submit', onCatchEditSubmit);
  els.catchModalClose.addEventListener('click', closeCatchModal);
  els.modalBackdrop.addEventListener('click', closeCatchModal);
  els.lineInfoBtn.addEventListener('click', openLineInfoModal);
  els.lineInfoClose.addEventListener('click', closeLineInfoModal);
  els.lineInfoBackdrop.addEventListener('click', closeLineInfoModal);
  els.lureLineInfoBtn.addEventListener('click', openLureLineInfoModal);
  els.lureLineInfoClose.addEventListener('click', closeLureLineInfoModal);
  els.lureLineInfoBackdrop.addEventListener('click', closeLureLineInfoModal);
  els.rodLineInfoBtn.addEventListener('click', openRodLineInfoModal);
  els.rodLineInfoClose.addEventListener('click', closeRodLineInfoModal);
  els.rodLineInfoBackdrop.addEventListener('click', closeRodLineInfoModal);

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

  els.heatmap.addEventListener('change', e => {
    if (e.target.matches('.hm-species-select')) {
      heatmapSpeciesFilter = e.target.value;
      renderHeatmap();
    } else if (e.target.matches('.hm-trip-select')) {
      heatmapTripFilter = e.target.value;
      renderHeatmap();
    } else if (e.target.matches('.hm-tide-select')) {
      heatmapTideFilter = e.target.value;
      renderHeatmap();
    }
  });

  // エリア分析: ランキングのリストとマップ上の丸をホバーで連動させる
  els.kantoMap.addEventListener('mouseover', e => {
    const item = e.target.closest('[data-spot-key]');
    if (!item) return;
    const key = item.dataset.spotKey;
    els.kantoMap.querySelectorAll(`[data-spot-key="${cssEscape(key)}"]`).forEach(el => el.classList.add('is-active'));
  });
  els.kantoMap.addEventListener('mouseout', e => {
    const item = e.target.closest('[data-spot-key]');
    if (!item) return;
    const key = item.dataset.spotKey;
    els.kantoMap.querySelectorAll(`[data-spot-key="${cssEscape(key)}"]`).forEach(el => el.classList.remove('is-active'));
  });

  els.globalFilterToggle.addEventListener('click', () => {
    const expanded = els.globalFilterToggle.getAttribute('aria-expanded') === 'true';
    els.globalFilterToggle.setAttribute('aria-expanded', String(!expanded));
    els.globalFilterBody.hidden = expanded;
  });

  els.styleFilter.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    styleFilter = chip.dataset.style;
    renderAll();
  });

  els.yearFilter.addEventListener('click', e => {
    const chip = e.target.closest('.hm-chip');
    if (!chip) return;
    yearFilter = chip.dataset.year;
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
