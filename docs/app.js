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
  const totalCal = sorted.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
  const avgCal = count ? Math.round(totalCal / count) : 0;

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
