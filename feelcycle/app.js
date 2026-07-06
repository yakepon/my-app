const STORAGE_KEY = 'feelcycle_gas_url';

const els = {
  settings: document.getElementById('settings'),
  toggleSettings: document.getElementById('toggleSettings'),
  gasUrl: document.getElementById('gasUrl'),
  saveUrl: document.getElementById('saveUrl'),
  connStatus: document.getElementById('connStatus'),
  statCount: document.getElementById('statCount'),
  statMonthly: document.getElementById('statMonthly'),
  statAvg: document.getElementById('statAvg'),
  statCancel: document.getElementById('statCancel'),
  form: document.getElementById('recordForm'),
  formTitle: document.getElementById('formTitle'),
  submitBtn: document.getElementById('submitBtn'),
  cancelEdit: document.getElementById('cancelEdit'),
  caloriesField: document.getElementById('caloriesField'),
  recordsList: document.getElementById('recordsList'),
  trendChart: document.getElementById('trendChart'),
  categoryChart: document.getElementById('categoryChart'),
  instructorChart: document.getElementById('instructorChart'),
  heatmap: document.getElementById('heatmap'),
  bikeMap: document.getElementById('bikeMap'),
  searchCategory: document.getElementById('searchCategory'),
  searchProgram: document.getElementById('searchProgram'),
  searchBtn: document.getElementById('searchBtn'),
  searchResult: document.getElementById('searchResult'),
  searchInstructor: document.getElementById('searchInstructor'),
  searchInstructorBtn: document.getElementById('searchInstructorBtn'),
  searchInstructorResult: document.getElementById('searchInstructorResult'),
};

const CHART_PALETTE = ['#ff2e7e', '#00e5ff', '#ffe156', '#7c5cff', '#4ade80', '#ff7849', '#38bdf8', '#f472b6'];

let trendChart = null;
let categoryChart = null;
let instructorChart = null;
let currentRecords = [];

const RECORDS_PAGE_SIZE = 10;
let recordsLimit = RECORDS_PAGE_SIZE;

function getGasUrl() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function setGasUrl(url) {
  localStorage.setItem(STORAGE_KEY, url);
}

function setStatus(message, state) {
  els.connStatus.textContent = message;
  els.connStatus.className = 'status' + (state ? ' ' + state : '');
}

function setFormType(type) {
  els.caloriesField.hidden = type === 'cancel';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function toDatetimeInputValue(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadRecords() {
  const url = getGasUrl();
  if (!url) return;

  els.recordsList.innerHTML = '<p class="empty">読み込み中...</p>';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const records = await res.json();
    currentRecords = records;
    renderRecords(records);
    setStatus(`接続済み（${records.length}件の記録）`, 'ok');
  } catch (err) {
    setStatus('読み込みに失敗しました: ' + err.message, 'error');
    els.recordsList.innerHTML = '<p class="empty">記録を取得できませんでした。URLや公開設定（アクセス権: 全員）を確認してください。</p>';
  }
}

function renderRecords(records) {
  const sorted = [...records].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  const rideRecords = sorted.filter((r) => !r.type || r.type === 'ride');
  const cancelRecords = sorted.filter((r) => r.type === 'cancel');

  const count = rideRecords.length;
  const calRecords = rideRecords.filter((r) => r.calories !== '' && r.calories != null && !isNaN(Number(r.calories)));
  const totalCal = calRecords.reduce((sum, r) => sum + Number(r.calories), 0);
  const avgCal = calRecords.length ? Math.round(totalCal / calRecords.length) : 0;

  const now = new Date();
  const monthlyCount = rideRecords.filter((r) => {
    const d = new Date(r.datetime);
    return !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  els.statCount.textContent = count;
  els.statMonthly.textContent = monthlyCount;
  els.statAvg.textContent = avgCal;
  els.statCancel.textContent = cancelRecords.length;

  renderCharts(sorted);
  populateDatalists(sorted);

  if (sorted.length === 0) {
    els.recordsList.innerHTML = '<p class="empty">まだ記録がありません。最初のライドを記録しましょう。</p>';
    return;
  }

  const visible = sorted.slice(0, recordsLimit);
  const remaining = sorted.length - visible.length;

  els.recordsList.innerHTML = visible.map((r) => {
    const isCancel = r.type === 'cancel';
    return `
    <article class="record-card${isCancel ? ' record-card-cancel' : ''}">
      <div class="record-main">
        <span class="record-date">${formatDate(r.datetime)}</span>
        <h3 class="record-program">${escapeHtml(r.program || '-')}</h3>
        <div class="record-meta">
          ${isCancel ? '<span class="badge-cancel">無断キャンセル</span>' : ''}
          ${r.category ? `<span class="badge">${escapeHtml(r.category)}</span>` : ''}
          ${r.studio ? `<span class="meta-item">${escapeHtml(r.studio)}</span>` : ''}
          ${r.bikeNo ? `<span class="meta-item">No.${escapeHtml(r.bikeNo)}</span>` : ''}
          ${r.instructor ? `<span class="meta-item">${escapeHtml(r.instructor)}</span>` : ''}
        </div>
        ${r.memo ? `<p class="record-memo"><span class="memo-label">プログラム:</span> ${escapeHtml(r.memo)}</p>` : ''}
        ${r.instructorMemo ? `<p class="record-memo"><span class="memo-label">インストラクター:</span> ${escapeHtml(r.instructorMemo)}</p>` : ''}
      </div>
      ${!isCancel ? `
      <div class="record-calories">
        <span class="cal-value">${r.calories || '-'}</span>
        <span class="cal-unit">KCAL</span>
      </div>` : ''}
      <div class="record-actions">
        <button type="button" class="icon-btn edit-btn" data-id="${escapeHtml(r.id)}">編集</button>
        <button type="button" class="icon-btn delete-btn" data-id="${escapeHtml(r.id)}">削除</button>
      </div>
    </article>
  `;
  }).join('') + (remaining > 0 ? `<button type="button" class="btn load-more-btn" id="loadMoreBtn">もっと見る（残り${remaining}件）</button>` : '');
}

function chartAxisOptions() {
  return {
    x: {
      ticks: { color: '#8a8aa3', font: { family: 'JetBrains Mono', size: 11 } },
      grid: { color: '#262638' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#8a8aa3', precision: 0, stepSize: 1, font: { family: 'JetBrains Mono', size: 11 } },
      grid: { color: '#262638' },
    },
  };
}

function renderCharts(records) {
  const rideRecords = records.filter((r) => !r.type || r.type === 'ride');
  renderTrendChart(records);
  renderCategoryChart(rideRecords);
  renderInstructorChart(rideRecords);
  renderHeatmap(rideRecords);
  renderBikeMap(rideRecords);
}

const DATALIST_FIELDS = {
  studioList: 'studio',
  bikeNoList: 'bikeNo',
  categoryList: 'category',
  programList: 'program',
  instructorList: 'instructor',
};

function populateDatalists(records) {
  Object.entries(DATALIST_FIELDS).forEach(([listId, key]) => {
    const values = [...new Set(records.map((r) => String(r[key] || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));
    document.getElementById(listId).innerHTML = values.map((v) => `<option value="${escapeHtml(v)}"></option>`).join('');
  });
}

function renderTrendChart(records) {
  const rideCounts = {};
  const cancelCounts = {};
  records.forEach((r) => {
    const d = new Date(r.datetime);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (r.type === 'cancel') {
      cancelCounts[key] = (cancelCounts[key] || 0) + 1;
    } else {
      rideCounts[key] = (rideCounts[key] || 0) + 1;
    }
  });

  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  if (trendChart) trendChart.destroy();
  if (!records.length) return;

  trendChart = new Chart(els.trendChart, {
    type: 'bar',
    data: {
      labels: months.map((key) => `${key.slice(2, 4)}/${key.slice(5)}`),
      datasets: [
        {
          type: 'line',
          label: '受講',
          data: months.map((key) => rideCounts[key] || 0),
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#00e5ff',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          order: 1,
        },
        {
          type: 'bar',
          label: '無断キャンセル',
          data: months.map((key) => cancelCounts[key] || 0),
          backgroundColor: 'rgba(255, 46, 126, 0.65)',
          borderColor: '#ff2e7e',
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 24,
          order: 2,
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
            color: '#8a8aa3',
            font: { family: 'JetBrains Mono', size: 11 },
            usePointStyle: true,
            boxWidth: 12,
            padding: 16,
          },
        },
      },
      scales: chartAxisOptions(),
    },
  });
}

function renderCategoryChart(records) {
  const counts = {};
  records.forEach((r) => {
    const cat = (r.category || '').trim() || '未分類';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  if (categoryChart) categoryChart.destroy();
  if (!labels.length) return;

  categoryChart = new Chart(els.categoryChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '受講回数',
        data: labels.map((key) => counts[key]),
        backgroundColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
        borderRadius: 6,
        maxBarThickness: 40,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: chartAxisOptions(),
    },
  });
}

function renderInstructorChart(records) {
  const counts = {};
  records.forEach((r) => {
    const instructor = (r.instructor || '').trim() || '未設定';
    counts[instructor] = (counts[instructor] || 0) + 1;
  });
  const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  if (instructorChart) instructorChart.destroy();
  if (!labels.length) return;

  instructorChart = new Chart(els.instructorChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '受講回数',
        data: labels.map((key) => counts[key]),
        backgroundColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
        borderRadius: 6,
        maxBarThickness: 40,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: chartAxisOptions(),
    },
  });
}

const HEATMAP_DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const HEATMAP_START_HOUR = 7;
const HEATMAP_END_HOUR = 22;
const HEATMAP_BAND_HOURS = 3;
const HEATMAP_BAND_COUNT = (HEATMAP_END_HOUR - HEATMAP_START_HOUR) / HEATMAP_BAND_HOURS;

function renderHeatmap(records) {
  if (!records.length) {
    els.heatmap.innerHTML = '<p class="empty">まだ記録がありません。</p>';
    return;
  }

  const counts = Array.from({ length: 7 }, () => Array(HEATMAP_BAND_COUNT).fill(0));

  records.forEach((r) => {
    const d = new Date(r.datetime);
    if (isNaN(d.getTime())) return;
    const hour = d.getHours();
    if (hour < HEATMAP_START_HOUR || hour >= HEATMAP_END_HOUR) return;
    const dayIndex = (d.getDay() + 6) % 7; // 0:月 ... 6:日
    const bandIndex = Math.floor((hour - HEATMAP_START_HOUR) / HEATMAP_BAND_HOURS);
    counts[dayIndex][bandIndex] += 1;
  });

  const max = Math.max(1, ...counts.flat());

  const bandLabels = Array.from({ length: HEATMAP_BAND_COUNT }, (_, i) => String(HEATMAP_START_HOUR + i * HEATMAP_BAND_HOURS).padStart(2, '0'));

  const headerCells = [`<span class="heatmap-cell heatmap-corner"></span>`]
    .concat(HEATMAP_DAYS.map((day) => `<span class="heatmap-cell heatmap-label">${day}</span>`))
    .join('');

  const bodyCells = bandLabels.map((rangeStart, bandIndex) => {
    const rangeEnd = String(HEATMAP_START_HOUR + (bandIndex + 1) * HEATMAP_BAND_HOURS).padStart(2, '0');
    const rowCells = HEATMAP_DAYS.map((day, dayIndex) => {
      const count = counts[dayIndex][bandIndex];
      const intensity = count / max;
      const style = count
        ? `style="background: rgba(0, 229, 255, ${(0.15 + intensity * 0.65).toFixed(2)}); box-shadow: 0 0 ${Math.round(4 + intensity * 12)}px rgba(0, 229, 255, ${(intensity * 0.6).toFixed(2)})"`
        : '';
      return `<span class="heatmap-cell heatmap-value" ${style} title="${day} ${rangeStart}-${rangeEnd}時: ${count}回">${count || ''}</span>`;
    }).join('');
    return `<span class="heatmap-cell heatmap-label">${rangeStart}-${rangeEnd}</span>${rowCells}`;
  }).join('');

  els.heatmap.innerHTML = `<div class="heatmap-grid">${headerCells}${bodyCells}</div>`;
}

// スタジオごとのバイク配置（座席図を上から順に並べたもの）。
// pods は前方左右の縦2台ずつのバイク。totalCols/leftCol/rightCol は
// 直後の row と同じ列数の中で、左右のポッドが何列目の真上に来るかを表す
// （0始まり。実際の座席図の画像から採寸した位置）。
// 対応スタジオを増やす場合はここにレイアウトを追加する。
const BIKE_MAP_LAYOUTS = {
  '武蔵小杉': [
    { type: 'pods', totalCols: 10, leftCol: 1, rightCol: 8, left: [1, 2], right: [3, 4] },
    { type: 'row', bikes: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5] },
    { type: 'row', bikes: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] },
    { type: 'rows-with-entrance', rows: [
      [35, 34, 33, 32, 31, 30, 29, 28, 27, 26],
      [36, 37, 38, 39, 40, null, 41, 42, 43, 44, 45],
    ] },
  ],
};

function renderBikeMap(records) {
  const [studio, layout] = Object.entries(BIKE_MAP_LAYOUTS)[0];
  const studioRecords = records.filter((r) => String(r.studio || '').trim() === studio);

  if (!studioRecords.length) {
    els.bikeMap.innerHTML = `<p class="empty">${studio}での記録がありません。</p>`;
    return;
  }

  const counts = {};
  studioRecords.forEach((r) => {
    const bikeNo = Number(r.bikeNo);
    if (!bikeNo) return;
    counts[bikeNo] = (counts[bikeNo] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));

  const gapSlot = () => '<span class="bike-gap"></span>';

  const cell = (no) => {
    if (no == null) return gapSlot();
    const count = counts[no] || 0;
    const intensity = count / max;
    const style = count
      ? `style="background: rgba(255, 46, 126, ${(0.15 + intensity * 0.65).toFixed(2)}); box-shadow: 0 0 ${Math.round(4 + intensity * 12)}px rgba(255, 46, 126, ${(intensity * 0.6).toFixed(2)})"`
      : '';
    return `<span class="bike-circle" ${style} title="No.${no}: ${count}回">${count || ''}</span>`;
  };

  const rowsHtml = layout.map((row) => {
    if (row.type === 'pods') {
      const before = gapSlot().repeat(row.leftCol);
      const between = gapSlot().repeat(row.rightCol - row.leftCol - 1);
      const after = gapSlot().repeat(row.totalCols - row.rightCol - 1);
      return `
        <div class="bike-row bike-pods-row">
          ${before}
          <div class="bike-pod">${row.left.map(cell).join('')}</div>
          ${between}
          <div class="bike-pod">${row.right.map(cell).join('')}</div>
          ${after}
          <div class="instructor-marker" title="インストラクター">
            <span class="instructor-avatar"></span>
            <span class="instructor-label">INSTR.</span>
          </div>
        </div>`;
    }
    if (row.type === 'rows-with-entrance') {
      const rowsInner = row.rows.map((bikes) => `<div class="bike-row">${bikes.map(cell).join('')}</div>`).join('');
      return `
        <div class="bike-entrance-group">
          <div class="bike-rows-stack">${rowsInner}</div>
          <div class="entrance-marker" title="入口">
            <span class="entrance-label">ENTER</span>
          </div>
        </div>`;
    }
    return `<div class="bike-row">${row.bikes.map(cell).join('')}</div>`;
  }).join('');

  els.bikeMap.innerHTML = `<div class="bike-map">${rowsHtml}</div>`;
}

function performSearch() {
  const category = els.searchCategory.value.trim();
  const program = els.searchProgram.value.trim();

  if (!category && !program) {
    els.searchResult.innerHTML = '<p class="empty">カテゴリまたはプログラム名を入力してください。</p>';
    return;
  }

  const matches = currentRecords.filter((r) => {
    const catMatch = !category || String(r.category || '').toLowerCase().includes(category.toLowerCase());
    const progMatch = !program || String(r.program || '').toLowerCase().includes(program.toLowerCase());
    return catMatch && progMatch;
  });

  const memoRecords = [...matches]
    .filter((r) => String(r.memo || '').trim())
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  const recordsHtml = matches.length
    ? `
      <p class="search-count">${matches.length}件の記録が見つかりました</p>
      <div class="search-block">
        <h3>過去のメモ</h3>
        ${memoRecords.length
          ? `<ul class="memo-list">${memoRecords.map((r) => `
            <li class="memo-list-item">
              <span class="memo-date">${formatDate(r.datetime)}</span>
              <div class="memo-meta">
                ${r.category ? `<span class="badge">${escapeHtml(r.category)}</span>` : ''}
                ${r.program ? `<span class="badge instructor-badge">${escapeHtml(r.program)}</span>` : ''}
                ${r.instructor ? `<span class="meta-item">${escapeHtml(r.instructor)}</span>` : ''}
              </div>
              <p class="memo-text">${escapeHtml(r.memo)}</p>
            </li>
          `).join('')}</ul>`
          : '<p class="empty">メモが記録されていません。</p>'}
      </div>
    `
    : '<p class="empty">該当する記録が見つかりませんでした。</p>';

  els.searchResult.innerHTML = `
    ${category && program ? '<div class="search-block program-summary-block" id="programSummary"></div>' : ''}
    ${recordsHtml}
  `;

  if (category && program) {
    loadProgramSummary(category, program);
  }
}

async function loadProgramSummary(category, program) {
  const container = document.getElementById('programSummary');
  const gasUrl = getGasUrl();
  if (!container || !gasUrl) return;

  container.innerHTML = '<p class="empty">プログラム情報を取得中...</p>';

  const params = new URLSearchParams({ action: 'programInfo', category, program });
  try {
    const res = await fetch(`${gasUrl}?${params.toString()}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!data.found) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <h3>プログラム情報 (FEELCYCLIST)</h3>
      <div class="program-summary-card">
        <p class="program-summary-text">${escapeHtml(data.description)}</p>
        <a class="program-summary-link" href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">詳細を見る →</a>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '';
  }
}

function performInstructorSearch() {
  const instructor = els.searchInstructor.value.trim();

  if (!instructor) {
    els.searchInstructorResult.innerHTML = '<p class="empty">インストラクター名を入力してください。</p>';
    return;
  }

  const matches = currentRecords.filter((r) => String(r.instructor || '').toLowerCase().includes(instructor.toLowerCase()));

  const memoRecords = [...matches]
    .filter((r) => String(r.instructorMemo || '').trim())
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  const recordsHtml = matches.length
    ? `
      <p class="search-count">${matches.length}件の記録が見つかりました</p>
      <div class="search-block">
        <h3>過去のメモ</h3>
        ${memoRecords.length
          ? `<ul class="memo-list">${memoRecords.map((r) => `
            <li class="memo-list-item">
              <span class="memo-date">${formatDate(r.datetime)}</span>
              <div class="memo-meta">
                ${r.category ? `<span class="badge">${escapeHtml(r.category)}</span>` : ''}
                ${r.program ? `<span class="badge instructor-badge">${escapeHtml(r.program)}</span>` : ''}
                ${r.instructor ? `<span class="meta-item">${escapeHtml(r.instructor)}</span>` : ''}
              </div>
              <p class="memo-text">${escapeHtml(r.instructorMemo)}</p>
            </li>
          `).join('')}</ul>`
          : '<p class="empty">メモが記録されていません。</p>'}
      </div>
    `
    : '<p class="empty">該当する記録が見つかりませんでした。</p>';

  els.searchInstructorResult.innerHTML = `
    <div class="search-block instructor-summary-block" id="instructorSummary"></div>
    ${recordsHtml}
  `;

  loadInstructorSummary(instructor);
}

async function loadInstructorSummary(instructor) {
  const container = document.getElementById('instructorSummary');
  const gasUrl = getGasUrl();
  if (!container || !gasUrl) return;

  container.innerHTML = '<p class="empty">インストラクター情報を取得中...</p>';

  const params = new URLSearchParams({ action: 'instructorInfo', name: instructor });
  try {
    const res = await fetch(`${gasUrl}?${params.toString()}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!data.found) {
      container.innerHTML = '';
      return;
    }

    const topProgramsHtml = data.topPrograms && data.topPrograms.length
      ? `<div class="search-instructors">${data.topPrograms.map((p) => `<span class="badge instructor-badge">${escapeHtml(p.name)} (${p.lessonCount}回)</span>`).join('')}</div>`
      : '';
    const topStudiosHtml = data.topStudios && data.topStudios.length
      ? `<div class="search-instructors">${data.topStudios.map((s) => `<span class="badge">${escapeHtml(s.name)} (${s.lessonCount}回)</span>`).join('')}</div>`
      : '';

    container.innerHTML = `
      <h3>インストラクター情報 (FEELCYCLE FAN)</h3>
      <div class="program-summary-card">
        <p class="program-summary-text">
          ${data.debutDate ? `デビュー日: ${formatDate(data.debutDate)}<br>` : ''}
          担当プログラム数: ${data.totalPrograms}
        </p>
        ${topProgramsHtml ? `<p class="program-summary-text" style="margin-top:10px;">よく担当するプログラム</p>${topProgramsHtml}` : ''}
        ${topStudiosHtml ? `<p class="program-summary-text" style="margin-top:10px;">よく担当するスタジオ</p>${topStudiosHtml}` : ''}
        <a class="program-summary-link" href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">詳細を見る →</a>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '';
  }
}

function enterEditMode(record) {
  els.form.id.value = record.id;
  els.form.datetime.value = toDatetimeInputValue(record.datetime);
  els.form.studio.value = record.studio || '';
  els.form.bikeNo.value = record.bikeNo || '';
  els.form.category.value = record.category || '';
  els.form.program.value = record.program || '';
  els.form.instructor.value = record.instructor || '';
  els.form.calories.value = record.calories || '';
  els.form.memo.value = record.memo || '';
  els.form.instructorMemo.value = record.instructorMemo || '';

  const type = record.type || 'ride';
  els.form.querySelectorAll('input[name="type"]').forEach((radio) => { radio.checked = radio.value === type; });
  setFormType(type);

  els.formTitle.textContent = '記録を編集';
  els.submitBtn.textContent = '更新する';
  els.cancelEdit.hidden = false;
  els.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exitEditMode() {
  els.form.reset();
  els.form.id.value = '';
  els.formTitle.textContent = '記録を追加';
  els.submitBtn.textContent = '記録する';
  els.cancelEdit.hidden = true;
  setFormType('ride');
}

function onEdit(id) {
  const record = currentRecords.find((r) => String(r.id) === String(id));
  if (!record) return;
  enterEditMode(record);
}

async function onDelete(id) {
  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }
  if (!confirm('この記録を削除しますか？')) return;

  try {
    // text/plain を使うことで CORS のプリフライトを回避する
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
    setStatus('記録を削除しました。', 'ok');
  } catch (err) {
    setStatus('通信エラーが発生しましたが、削除されている可能性があります。一覧を確認してください。', 'error');
  } finally {
    await loadRecords();
  }
}

async function onSubmit(e) {
  e.preventDefault();

  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }

  const formData = new FormData(els.form);
  const id = formData.get('id');
  const payload = {
    action: id ? 'update' : 'add',
    id,
    datetime: formData.get('datetime'),
    studio: formData.get('studio'),
    bikeNo: formData.get('bikeNo'),
    category: formData.get('category'),
    program: formData.get('program'),
    instructor: formData.get('instructor'),
    calories: formData.get('calories'),
    memo: formData.get('memo'),
    instructorMemo: formData.get('instructorMemo'),
    type: formData.get('type') || 'ride',
  };

  els.submitBtn.disabled = true;
  const submittingLabel = id ? '更新中...' : '送信中...';
  els.submitBtn.textContent = submittingLabel;

  try {
    // text/plain を使うことで CORS のプリフライトを回避する
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStatus(id ? '記録を更新しました。' : '記録を保存しました。', 'ok');
  } catch (err) {
    setStatus('通信エラーが発生しましたが、記録は保存されている可能性があります。一覧を確認してください。', 'error');
  } finally {
    exitEditMode();
    els.submitBtn.disabled = false;
    await loadRecords();
  }
}

function init() {
  const url = getGasUrl();
  els.gasUrl.value = url;

  if (url) {
    els.settings.hidden = true;
    loadRecords();
  } else {
    els.settings.hidden = false;
    setStatus('未接続: GAS WebアプリのURLを入力して保存してください。', 'error');
  }

  els.saveUrl.addEventListener('click', () => {
    const value = els.gasUrl.value.trim();
    if (!value) return;
    setGasUrl(value);
    setStatus('保存しました。読み込み中...');
    els.settings.hidden = true;
    loadRecords();
  });

  els.toggleSettings.addEventListener('click', () => {
    els.settings.hidden = !els.settings.hidden;
  });

  els.form.addEventListener('submit', onSubmit);
  els.cancelEdit.addEventListener('click', exitEditMode);
  els.form.addEventListener('change', (e) => {
    if (e.target.name === 'type') setFormType(e.target.value);
  });

  els.searchBtn.addEventListener('click', performSearch);
  els.searchInstructorBtn.addEventListener('click', performInstructorSearch);

  els.recordsList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      onEdit(editBtn.dataset.id);
      return;
    }
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      onDelete(deleteBtn.dataset.id);
      return;
    }
    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn) {
      recordsLimit += RECORDS_PAGE_SIZE;
      renderRecords(currentRecords);
    }
  });
}

init();
