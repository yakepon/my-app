const STORAGE_KEY = 'feelcycle_gas_url';

const els = {
  settings: document.getElementById('settings'),
  toggleSettings: document.getElementById('toggleSettings'),
  gasUrl: document.getElementById('gasUrl'),
  saveUrl: document.getElementById('saveUrl'),
  connStatus: document.getElementById('connStatus'),
  statCount: document.getElementById('statCount'),
  statCalories: document.getElementById('statCalories'),
  statAvg: document.getElementById('statAvg'),
  form: document.getElementById('recordForm'),
  recordsList: document.getElementById('recordsList'),
  trendChart: document.getElementById('trendChart'),
  categoryChart: document.getElementById('categoryChart'),
};

const CHART_PALETTE = ['#ff2e7e', '#00e5ff', '#ffe156', '#7c5cff', '#4ade80', '#ff7849', '#38bdf8', '#f472b6'];

let trendChart = null;
let categoryChart = null;

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

async function loadRecords() {
  const url = getGasUrl();
  if (!url) return;

  els.recordsList.innerHTML = '<p class="empty">読み込み中...</p>';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const records = await res.json();
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

  els.statCount.textContent = count;
  els.statCalories.textContent = totalCal.toLocaleString();
  els.statAvg.textContent = avgCal;

  renderCharts(sorted);

  if (count === 0) {
    els.recordsList.innerHTML = '<p class="empty">まだ記録がありません。最初のライドを記録しましょう。</p>';
    return;
  }

  els.recordsList.innerHTML = sorted.map((r) => `
    <article class="record-card">
      <div class="record-main">
        <span class="record-date">${formatDate(r.datetime)}</span>
        <h3 class="record-program">${escapeHtml(r.program || '-')}</h3>
        <div class="record-meta">
          ${r.category ? `<span class="badge">${escapeHtml(r.category)}</span>` : ''}
          ${r.studio ? `<span class="meta-item">${escapeHtml(r.studio)}</span>` : ''}
          ${r.instructor ? `<span class="meta-item">${escapeHtml(r.instructor)}</span>` : ''}
        </div>
        ${r.memo ? `<p class="record-memo">${escapeHtml(r.memo)}</p>` : ''}
      </div>
      <div class="record-calories">
        <span class="cal-value">${r.calories || '-'}</span>
        <span class="cal-unit">KCAL</span>
      </div>
    </article>
  `).join('');
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
}

function renderTrendChart(records) {
  const counts = {};
  records.forEach((r) => {
    const d = new Date(r.datetime);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const labels = Object.keys(counts).sort();

  if (trendChart) trendChart.destroy();
  if (!labels.length) return;

  trendChart = new Chart(els.trendChart, {
    type: 'line',
    data: {
      labels: labels.map((key) => key.slice(5).replace('-', '/')),
      datasets: [{
        label: '受講回数',
        data: labels.map((key) => counts[key]),
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

async function onSubmit(e) {
  e.preventDefault();

  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }

  const formData = new FormData(els.form);
  const payload = {
    datetime: formData.get('datetime'),
    studio: formData.get('studio'),
    category: formData.get('category'),
    program: formData.get('program'),
    instructor: formData.get('instructor'),
    calories: formData.get('calories'),
    memo: formData.get('memo'),
  };

  const submitBtn = els.form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '送信中...';

  try {
    // text/plain を使うことで CORS のプリフライトを回避する
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStatus('記録を保存しました。', 'ok');
  } catch (err) {
    setStatus('通信エラーが発生しましたが、記録は保存されている可能性があります。一覧を確認してください。', 'error');
  } finally {
    els.form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = '記録する';
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
}

init();
