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
  form: document.getElementById('recordForm'),
  formTitle: document.getElementById('formTitle'),
  submitBtn: document.getElementById('submitBtn'),
  cancelEdit: document.getElementById('cancelEdit'),
  recordsList: document.getElementById('recordsList'),
  trendChart: document.getElementById('trendChart'),
  categoryChart: document.getElementById('categoryChart'),
  instructorChart: document.getElementById('instructorChart'),
  heatmap: document.getElementById('heatmap'),
  searchCategory: document.getElementById('searchCategory'),
  searchProgram: document.getElementById('searchProgram'),
  searchBtn: document.getElementById('searchBtn'),
  searchResult: document.getElementById('searchResult'),
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

  const count = sorted.length;
  const calRecords = sorted.filter((r) => r.calories !== '' && r.calories != null && !isNaN(Number(r.calories)));
  const totalCal = calRecords.reduce((sum, r) => sum + Number(r.calories), 0);
  const avgCal = calRecords.length ? Math.round(totalCal / calRecords.length) : 0;

  const now = new Date();
  const monthlyCount = sorted.filter((r) => {
    const d = new Date(r.datetime);
    return !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  els.statCount.textContent = count;
  els.statMonthly.textContent = monthlyCount;
  els.statAvg.textContent = avgCal;

  renderCharts(sorted);
  populateDatalists(sorted);

  if (count === 0) {
    els.recordsList.innerHTML = '<p class="empty">まだ記録がありません。最初のライドを記録しましょう。</p>';
    return;
  }

  const visible = sorted.slice(0, recordsLimit);
  const remaining = sorted.length - visible.length;

  els.recordsList.innerHTML = visible.map((r) => `
    <article class="record-card">
      <div class="record-main">
        <span class="record-date">${formatDate(r.datetime)}</span>
        <h3 class="record-program">${escapeHtml(r.program || '-')}</h3>
        <div class="record-meta">
          ${r.category ? `<span class="badge">${escapeHtml(r.category)}</span>` : ''}
          ${r.studio ? `<span class="meta-item">${escapeHtml(r.studio)}</span>` : ''}
          ${r.bikeNo ? `<span class="meta-item">No.${escapeHtml(r.bikeNo)}</span>` : ''}
          ${r.instructor ? `<span class="meta-item">${escapeHtml(r.instructor)}</span>` : ''}
        </div>
        ${r.memo ? `<p class="record-memo">${escapeHtml(r.memo)}</p>` : ''}
      </div>
      <div class="record-calories">
        <span class="cal-value">${r.calories || '-'}</span>
        <span class="cal-unit">KCAL</span>
      </div>
      <div class="record-actions">
        <button type="button" class="icon-btn edit-btn" data-id="${escapeHtml(r.id)}">編集</button>
        <button type="button" class="icon-btn delete-btn" data-id="${escapeHtml(r.id)}">削除</button>
      </div>
    </article>
  `).join('') + (remaining > 0 ? `<button type="button" class="btn load-more-btn" id="loadMoreBtn">もっと見る（残り${remaining}件）</button>` : '');
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
  renderTrendChart(records);
  renderCategoryChart(records);
  renderInstructorChart(records);
  renderHeatmap(records);
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
  const counts = {};
  records.forEach((r) => {
    const d = new Date(r.datetime);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
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
    type: 'line',
    data: {
      labels: months.map((key) => `${key.slice(2, 4)}/${key.slice(5)}`),
      datasets: [{
        label: '受講回数',
        data: months.map((key) => counts[key] || 0),
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0, 229, 255, 0.15)',
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: '#00e5ff',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
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

  if (!matches.length) {
    els.searchResult.innerHTML = '<p class="empty">該当する記録が見つかりませんでした。</p>';
    return;
  }

  const instructors = [...new Set(matches.map((r) => String(r.instructor || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));

  const memoRecords = [...matches]
    .filter((r) => String(r.memo || '').trim())
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  els.searchResult.innerHTML = `
    <p class="search-count">${matches.length}件の記録が見つかりました</p>
    <div class="search-block">
      <h3>対応インストラクター</h3>
      <div class="search-instructors">
        ${instructors.length
          ? instructors.map((name) => `<span class="badge instructor-badge">${escapeHtml(name)}</span>`).join('')
          : '<p class="empty">インストラクター情報がありません。</p>'}
      </div>
    </div>
    <div class="search-block">
      <h3>過去のメモ</h3>
      ${memoRecords.length
        ? `<ul class="memo-list">${memoRecords.map((r) => `
          <li class="memo-list-item">
            <span class="memo-date">${formatDate(r.datetime)}</span>
            <p class="memo-text">${escapeHtml(r.memo)}</p>
          </li>
        `).join('')}</ul>`
        : '<p class="empty">メモが記録されていません。</p>'}
    </div>
  `;
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

  els.searchBtn.addEventListener('click', performSearch);

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
