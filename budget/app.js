const STORAGE_KEY = 'budget_gas_url';

const EXPENSE_CATEGORIES = ['車', '遊び', '外食', '美容', 'その他'];

const CATEGORY_TREE = {
  '車': ['月極', 'パーキング', '高速代', 'ガソリン代', 'メンテナンス代'],
  '遊び': ['洋服代', '家電代', 'キャンプ関連', '釣り関連', 'スポーツ関連'],
  '外食': ['家族', '友達'],
  '美容': ['美容院', '美容・健康'],
  'その他': ['計画外', '無駄遣い'],
};

let historicalSubCategories = {};

const els = {
  settings: document.getElementById('settings'),
  toggleSettings: document.getElementById('toggleSettings'),
  gasUrl: document.getElementById('gasUrl'),
  saveUrl: document.getElementById('saveUrl'),
  connStatus: document.getElementById('connStatus'),
  statBudgetLabel: document.getElementById('statBudgetLabel'),
  statBudget: document.getElementById('statBudget'),
  statExpenseLabel: document.getElementById('statExpenseLabel'),
  statExpense: document.getElementById('statExpense'),
  statWasteLabel: document.getElementById('statWasteLabel'),
  statWaste: document.getElementById('statWaste'),
  statBalanceLabel: document.getElementById('statBalanceLabel'),
  statBalance: document.getElementById('statBalance'),
  statForecastLabel: document.getElementById('statForecastLabel'),
  statForecast: document.getElementById('statForecast'),
  hankoStamp: document.getElementById('hankoStamp'),
  summaryMonth: document.getElementById('summaryMonth'),
  form: document.getElementById('recordForm'),
  formTitle: document.getElementById('formTitle'),
  submitBtn: document.getElementById('submitBtn'),
  cancelEdit: document.getElementById('cancelEdit'),
  expenseCategorySelect: document.getElementById('expenseCategorySelect'),
  subCategoryInput: document.getElementById('subCategoryInput'),
  recordsList: document.getElementById('recordsList'),
  budgetList: document.getElementById('budgetList'),
  copyPrevBudget: document.getElementById('copyPrevBudget'),
  resetBudget: document.getElementById('resetBudget'),
  budgetPanel: document.getElementById('budgetPanel'),
  budgetTooltip: document.getElementById('budgetTooltip'),
  chartFilter: document.getElementById('chartFilter'),
  chartWrap: document.getElementById('chartWrap'),
  chartLegend: document.getElementById('chartLegend'),
  chartTable: document.getElementById('chartTable'),
};

let currentRecords = [];
let currentBudgets = {};

const RECORDS_PAGE_SIZE = 15;
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
  showToast(message, state);
}

let toastTimer = null;

function showToast(message, state) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast visible' + (state ? ' ' + state : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateShort(value) {
  const d = new Date(value + 'T00:00:00');
  if (isNaN(d.getTime())) return String(value);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// "2026-08" の前月 "2026-07" を返す（年跨ぎも考慮）
function prevYearMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

// 経過日数あたりの支出ペースから月末時点の見込み額を算出する。
// 過去に完了した月は経過日数=月の総日数となり、実績とそのまま一致する。
function projectedAmount(ym, actual) {
  const totalDays = daysInMonth(ym);
  const elapsed = ym === currentYearMonth() ? new Date().getDate() : totalDays;
  const safeElapsed = Math.max(1, Math.min(elapsed, totalDays));
  return (actual / safeElapsed) * totalDays;
}

function recordYearMonth(record) {
  return String(record.date || '').slice(0, 7);
}

function periodLabel(ym) {
  if (ym === currentYearMonth()) return '今月';
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

function budgetKey(category, subCategory) {
  return subCategory ? `${category}::${subCategory}` : category;
}

function getBudgetItems() {
  const items = [];
  EXPENSE_CATEGORIES.forEach((major) => {
    const subs = CATEGORY_TREE[major] || [];
    if (subs.length === 0) {
      items.push({ major, sub: null });
    } else {
      subs.forEach((sub) => items.push({ major, sub }));
    }
  });
  return items;
}

function getBudgetAmount(ym, major, sub) {
  const monthBudgets = currentBudgets[ym] || {};
  const entry = monthBudgets[budgetKey(major, sub)];
  return Number((entry && entry.amount) || 0);
}

function getBudgetComment(ym, major, sub) {
  const monthBudgets = currentBudgets[ym] || {};
  const entry = monthBudgets[budgetKey(major, sub)];
  return (entry && entry.comment) || '';
}

function totalBudgetAmount(ym) {
  return getBudgetItems().reduce((sum, { major, sub }) => sum + getBudgetAmount(ym, major, sub), 0);
}

async function loadRecords() {
  const url = getGasUrl();
  if (!url) return;

  els.recordsList.innerHTML = '<p class="empty">読み込み中...</p>';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const records = Array.isArray(data) ? data : (data.records || []);
    currentRecords = records;
    currentBudgets = {};
    (Array.isArray(data) ? [] : (data.budgets || [])).forEach((b) => {
      const ym = b.yearMonth;
      if (!currentBudgets[ym]) currentBudgets[ym] = {};
      currentBudgets[ym][budgetKey(b.category, b.subCategory)] = {
        amount: Number(b.amount) || 0,
        comment: b.comment || '',
      };
    });
    renderAll(records);
    setStatus(`接続済み（${records.length}件の記録）`, 'ok');
  } catch (err) {
    setStatus('読み込みに失敗しました: ' + err.message, 'error');
    els.recordsList.innerHTML = '<p class="empty">記録を取得できませんでした。URLや公開設定（アクセス権: 全員）を確認してください。</p>';
  }
}

function renderAll(records) {
  renderTopStats(records);
  renderBudgets(records);
  renderChart(records);
  populateCategoryLists(records);
  renderRecords(records);
}

function renderTopStats(records) {
  const ym = els.summaryMonth.value || currentYearMonth();
  const expense = records.filter((r) => recordYearMonth(r) === ym).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const waste = records
    .filter((r) => recordYearMonth(r) === ym && (r.category || '').trim() === 'その他' && (r.subCategory || '').trim() === '無駄遣い')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalBudget = totalBudgetAmount(ym);
  const balance = totalBudget - expense;
  const forecast = projectedAmount(ym, expense);

  const label = periodLabel(ym);
  els.statBudgetLabel.textContent = `${label}の予算`;
  els.statForecastLabel.textContent = `${label}の着地見込み`;
  els.statExpenseLabel.textContent = `${label}の支出`;
  els.statWasteLabel.textContent = `${label}の無駄遣い`;
  els.statBalanceLabel.textContent = `${label}の残りの予算`;

  els.statBudget.textContent = formatCurrency(totalBudget);
  els.statExpense.textContent = formatCurrency(expense);
  els.statWaste.textContent = formatCurrency(waste);
  els.statBalance.textContent = formatCurrency(balance);
  els.statForecast.textContent = formatCurrency(forecast);
  els.statForecast.className = 'stat-value ' + (totalBudget > 0 && forecast > totalBudget ? 'ink-expense' : '');

  const isSurplus = balance >= 0;
  els.hankoStamp.textContent = isSurplus ? '黒字' : '赤字';
  els.hankoStamp.className = 'hanko ' + (isSurplus ? 'hanko-black' : 'hanko-red');
  // 押し直す演出のためクラスを一度外して再付与する
  void els.hankoStamp.offsetWidth;
  els.hankoStamp.classList.add('hanko-stamped');
}

function renderBudgetRow(ym, major, sub, spent) {
  const budget = getBudgetAmount(ym, major, sub);
  const comment = getBudgetComment(ym, major, sub);
  const label = sub || '全体';
  // 「その他」は予算を組む対象ではなく、使った時点で全額が想定外の支出になるカテゴリなので、
  // 予算未設定でも0円予算として扱い、支出があれば他カテゴリ同様に「超過」表示にする
  const isUnplanned = major === 'その他';

  const commentField = `
    <input type="text" class="budget-comment-input" placeholder="予算の根拠・メモ" value="${escapeHtml(comment)}" data-category="${escapeHtml(major)}" data-subcategory="${escapeHtml(sub || '')}">
  `;

  if (!budget && !isUnplanned) {
    return `
      <div class="budget-row">
        <div class="budget-row-head">
          <span class="budget-cat" tabindex="0" data-category="${escapeHtml(major)}" data-subcategory="${escapeHtml(sub || '')}">${escapeHtml(label)}</span>
          <div class="budget-set">
            <span class="budget-set-label">予算</span>
            <input type="number" class="budget-input" min="0" step="1000" placeholder="未設定" data-category="${escapeHtml(major)}" data-subcategory="${escapeHtml(sub || '')}">
            <span class="budget-unit">円</span>
          </div>
        </div>
        ${commentField}
        <p class="budget-empty">予算を設定すると残量ゲージが表示されます（今月の支出: ${formatCurrency(spent)}）</p>
      </div>
    `;
  }

  const remaining = budget - spent;
  const overspent = remaining < 0;
  let pct = 100;
  let gaugeClass = 'gauge-green';
  if (budget > 0) {
    pct = Math.max(0, Math.min(100, (remaining / budget) * 100));
    if (pct <= 10) gaugeClass = 'gauge-red';
    else if (pct <= 50) gaugeClass = 'gauge-yellow';
  } else if (spent > 0) {
    pct = 0;
    gaugeClass = 'gauge-red';
  }

  return `
    <div class="budget-row">
      <div class="budget-row-head">
        <span class="budget-cat" tabindex="0" data-category="${escapeHtml(major)}" data-subcategory="${escapeHtml(sub || '')}">${escapeHtml(label)}</span>
        <div class="budget-set">
          <span class="budget-set-label">予算</span>
          <input type="number" class="budget-input" min="0" step="1000" value="${budget}" data-category="${escapeHtml(major)}" data-subcategory="${escapeHtml(sub || '')}">
          <span class="budget-unit">円</span>
        </div>
      </div>
      ${commentField}
      <div class="budget-remaining ${overspent ? 'gauge-red' : gaugeClass}">
        ${overspent ? `${formatCurrency(Math.abs(remaining))} 超過` : `残り ${formatCurrency(remaining)}`}
      </div>
      <div class="budget-bar-track">
        <div class="budget-bar-fill ${gaugeClass}" style="width:${pct}%"></div>
      </div>
      <div class="budget-row-foot">
        <span>${formatCurrency(spent)} / ${formatCurrency(budget)} 使用</span>
      </div>
    </div>
  `;
}

function renderBudgets(records) {
  const ym = els.summaryMonth.value || currentYearMonth();
  const monthExpenses = records.filter((r) => recordYearMonth(r) === ym);

  els.budgetList.innerHTML = EXPENSE_CATEGORIES.map((major) => {
    const subs = CATEGORY_TREE[major] || [];
    const items = subs.length ? subs : [null];

    const rows = items.map((sub) => {
      const spent = monthExpenses
        .filter((r) => (r.category || '').trim() === major && (sub ? (r.subCategory || '').trim() === sub : true))
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      return renderBudgetRow(ym, major, sub, spent);
    }).join('');

    return `
      <div class="budget-group">
        <h3 class="budget-group-title">${escapeHtml(major)}</h3>
        ${rows}
      </div>
    `;
  }).join('');

  attachBudgetTooltips();
}

function attachBudgetTooltips() {
  const tooltip = els.budgetTooltip;
  const panel = els.budgetPanel;

  function showTooltip(target, clientX, clientY) {
    const major = target.dataset.category;
    const sub = target.dataset.subcategory || null;
    const ym = els.summaryMonth.value || currentYearMonth();

    const matches = currentRecords
      .filter((r) => recordYearMonth(r) === ym && (r.category || '').trim() === major && (sub ? (r.subCategory || '').trim() === sub : true))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    tooltip.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'budget-tooltip-title';
    title.textContent = `${periodLabel(ym)}の実績 — ${target.textContent.trim()}`;
    tooltip.appendChild(title);

    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'budget-tooltip-empty';
      empty.textContent = 'この月の記録はありません';
      tooltip.appendChild(empty);
    } else {
      matches.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'budget-tooltip-row';

        const date = document.createElement('span');
        date.className = 'tt-date';
        date.textContent = formatDateShort(r.date);

        const amount = document.createElement('span');
        amount.className = 'tt-amount';
        amount.textContent = formatCurrency(r.amount);

        row.appendChild(date);
        row.appendChild(amount);
        tooltip.appendChild(row);

        if (r.memo) {
          const memo = document.createElement('span');
          memo.className = 'budget-tooltip-memo';
          memo.textContent = r.memo;
          tooltip.appendChild(memo);
        }
      });
    }

    const panelRect = panel.getBoundingClientRect();
    tooltip.style.left = `${clientX - panelRect.left + 12}px`;
    tooltip.style.top = `${clientY - panelRect.top + 12}px`;
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }

  panel.querySelectorAll('.budget-cat').forEach((el) => {
    el.addEventListener('pointerenter', (e) => showTooltip(el, e.clientX, e.clientY));
    el.addEventListener('pointermove', (e) => showTooltip(el, e.clientX, e.clientY));
    el.addEventListener('pointerleave', hideTooltip);
    el.addEventListener('focus', () => {
      const rect = el.getBoundingClientRect();
      showTooltip(el, rect.left, rect.bottom);
    });
    el.addEventListener('blur', hideTooltip);
  });
}

const CHART_MONTHS = 6;

function trailingMonths(n) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function formatMonthShort(ym) {
  return `${Number(ym.split('-')[1])}月`;
}

function formatYearMonthFull(ym) {
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

function formatCurrencyShort(value) {
  const n = Math.round(Number(value) || 0);
  if (Math.abs(n) >= 10000) {
    return `¥${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`;
  }
  return formatCurrency(n);
}

function niceCeil(value) {
  if (value <= 0) return 1000;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const norm = value / base;
  let niceNorm;
  if (norm <= 1) niceNorm = 1;
  else if (norm <= 2) niceNorm = 2;
  else if (norm <= 5) niceNorm = 5;
  else niceNorm = 10;
  return niceNorm * base;
}

function monthActualBudget(ym, filter, records) {
  if (filter === 'all') {
    const actual = records.filter((r) => recordYearMonth(r) === ym).reduce((sum, r) => sum + Number(r.amount || 0), 0);
    return { actual, budget: totalBudgetAmount(ym) };
  }
  const actual = records
    .filter((r) => recordYearMonth(r) === ym && (r.category || '').trim() === filter)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const budget = getBudgetItems()
    .filter((item) => item.major === filter)
    .reduce((sum, { major, sub }) => sum + getBudgetAmount(ym, major, sub), 0);
  return { actual, budget };
}

function barPath(x, yTop, width, height, radius) {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  const yBottom = yTop + height;
  return `M${x},${yBottom} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + width - r},${yTop} Q${x + width},${yTop} ${x + width},${yTop + r} L${x + width},${yBottom} Z`;
}

function renderChart(records) {
  const filter = els.chartFilter.value || 'all';
  const months = trailingMonths(CHART_MONTHS);
  const data = months.map((ym) => {
    const base = monthActualBudget(ym, filter, records);
    return { ym, ...base, forecast: projectedAmount(ym, base.actual) };
  });

  const maxVal = niceCeil(Math.max(1, ...data.map((d) => Math.max(d.actual, d.budget, d.forecast))) * 1.15);

  const W = 600;
  const H = 220;
  const marginLeft = 46;
  const marginRight = 12;
  const marginTop = 26;
  const marginBottom = 26;
  const plotWidth = W - marginLeft - marginRight;
  const plotHeight = H - marginTop - marginBottom;
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(24, slotWidth * 0.5);

  const yScale = (v) => marginTop + plotHeight - (v / maxVal) * plotHeight;

  const gridlines = [0, maxVal / 2, maxVal].map((t) => {
    const y = yScale(t);
    return `
      <line class="chart-gridline" x1="${marginLeft}" y1="${y}" x2="${W - marginRight}" y2="${y}" />
      <text class="chart-axis-label" x="${marginLeft - 8}" y="${y + 3}" text-anchor="end">${escapeHtml(formatCurrencyShort(t))}</text>
    `;
  }).join('');

  const latestIndex = data.length - 1;

  const bars = data.map((d, i) => {
    const slotX = marginLeft + i * slotWidth;
    const barX = slotX + (slotWidth - barWidth) / 2;
    const barHeight = (d.actual / maxVal) * plotHeight;
    const barYTop = marginTop + plotHeight - barHeight;
    const path = barPath(barX, barYTop, barWidth, barHeight, 4);

    let fillClass = 'chart-bar-fill-none';
    if (d.budget > 0) fillClass = d.actual <= d.budget ? 'chart-bar-fill-ok' : 'chart-bar-fill-over';

    let forecastPath = '';
    if (d.forecast > d.actual) {
      const forecastTop = yScale(d.forecast);
      const forecastBottom = yScale(d.actual);
      const fPath = barPath(barX, forecastTop, barWidth, forecastBottom - forecastTop, 4);
      let forecastClass = 'chart-bar-forecast-none';
      if (d.budget > 0) forecastClass = d.forecast <= d.budget ? 'chart-bar-forecast-ok' : 'chart-bar-forecast-over';
      forecastPath = fPath ? `<path class="chart-bar-forecast ${forecastClass}" d="${fPath}" />` : '';
    }

    const targetY = d.budget > 0 ? yScale(d.budget) : null;
    const targetLine = targetY !== null
      ? `<line class="chart-target-line" x1="${barX - 3}" y1="${targetY}" x2="${barX + barWidth + 3}" y2="${targetY}" />`
      : '';

    const labelValue = i === latestIndex && d.forecast > d.actual ? d.forecast : d.actual;
    const valueLabel = i === latestIndex && labelValue > 0
      ? `<text class="chart-value-label" x="${barX + barWidth / 2}" y="${yScale(labelValue) - 8}">${escapeHtml(formatCurrencyShort(labelValue))}</text>`
      : '';

    const monthLabel = `<text class="chart-axis-label" x="${slotX + slotWidth / 2}" y="${H - 6}" text-anchor="middle">${escapeHtml(formatMonthShort(d.ym))}</text>`;

    return `
      <g class="chart-bar-group" tabindex="0" data-index="${i}">
        <rect x="${slotX}" y="${marginTop}" width="${slotWidth}" height="${plotHeight}" fill="transparent" />
        ${path ? `<path class="chart-bar ${fillClass}" d="${path}" />` : ''}
        ${forecastPath}
        ${targetLine}
        ${valueLabel}
        ${monthLabel}
      </g>
    `;
  }).join('');

  els.chartWrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="月別の予算と実績の比較グラフ">
      ${gridlines}
      ${bars}
    </svg>
    <div class="chart-tooltip" id="chartTooltip"></div>
  `;

  attachChartTooltip(data);
  renderChartLegend();
  renderChartTable(data);
}

function attachChartTooltip(data) {
  const tooltip = document.getElementById('chartTooltip');
  const wrap = els.chartWrap;

  function showTooltip(index, clientX, clientY) {
    const d = data[index];
    if (!d) return;
    const diff = d.actual - d.budget;

    let diffRow = '';
    if (d.budget > 0) {
      const label = diff > 0 ? '超過' : '残り';
      diffRow = `<div class="chart-tooltip-row"><span class="tooltip-label">${label}</span><span class="tooltip-value">${formatCurrency(Math.abs(diff))}</span></div>`;
    }

    const forecastRow = d.forecast > d.actual
      ? `<div class="chart-tooltip-row"><span class="tooltip-label">見込み</span><span class="tooltip-value" data-field="forecast">${formatCurrency(d.forecast)}</span></div>`
      : '';

    tooltip.innerHTML = `
      <div class="chart-tooltip-month"></div>
      <div class="chart-tooltip-row"><span class="tooltip-label">実績</span><span class="tooltip-value" data-field="actual"></span></div>
      ${forecastRow}
      <div class="chart-tooltip-row"><span class="tooltip-label">予算</span><span class="tooltip-value" data-field="budget"></span></div>
      ${diffRow}
    `;
    tooltip.querySelector('.chart-tooltip-month').textContent = formatYearMonthFull(d.ym);
    tooltip.querySelector('[data-field="actual"]').textContent = formatCurrency(d.actual);
    tooltip.querySelector('[data-field="budget"]').textContent = d.budget > 0 ? formatCurrency(d.budget) : '未設定';

    const wrapRect = wrap.getBoundingClientRect();
    tooltip.style.left = `${clientX - wrapRect.left}px`;
    tooltip.style.top = `${clientY - wrapRect.top - 12}px`;
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }

  wrap.querySelectorAll('.chart-bar-group').forEach((group) => {
    const index = Number(group.dataset.index);
    group.addEventListener('pointerenter', (e) => showTooltip(index, e.clientX, e.clientY));
    group.addEventListener('pointermove', (e) => showTooltip(index, e.clientX, e.clientY));
    group.addEventListener('pointerleave', hideTooltip);
    group.addEventListener('focus', () => {
      const rect = group.getBoundingClientRect();
      showTooltip(index, rect.left + rect.width / 2, rect.top);
    });
    group.addEventListener('blur', hideTooltip);
  });
}

function renderChartLegend() {
  els.chartLegend.innerHTML = `
    <span class="chart-legend-item"><span class="chart-legend-swatch legend-ok"></span>実績（予算内）</span>
    <span class="chart-legend-item"><span class="chart-legend-swatch legend-over"></span>実績（予算超過）</span>
    <span class="chart-legend-item"><span class="chart-legend-swatch legend-forecast"></span>月末見込み</span>
    <span class="chart-legend-item"><span class="chart-legend-line"></span>予算</span>
  `;
}

function renderChartTable(data) {
  const rows = data.map((d) => {
    const diff = d.actual - d.budget;
    return `
      <tr>
        <td>${escapeHtml(formatYearMonthFull(d.ym))}</td>
        <td>${formatCurrency(d.actual)}</td>
        <td>${d.forecast > d.actual ? formatCurrency(d.forecast) : '—'}</td>
        <td>${d.budget > 0 ? formatCurrency(d.budget) : '未設定'}</td>
        <td>${d.budget > 0 ? formatCurrency(diff) : '—'}</td>
      </tr>
    `;
  }).join('');

  els.chartTable.innerHTML = `
    <table class="chart-table">
      <thead>
        <tr><th>月</th><th>実績</th><th>見込み</th><th>予算</th><th>差引</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function populateCategoryLists(records) {
  historicalSubCategories = {};

  records.forEach((r) => {
    const major = String(r.category || '').trim();
    const sub = String(r.subCategory || '').trim();
    if (!major || !sub) return;
    if (!historicalSubCategories[major]) historicalSubCategories[major] = new Set();
    historicalSubCategories[major].add(sub);
  });

  updateSubCategoryOptions();
}

function updateSubCategoryOptions() {
  const major = els.expenseCategorySelect.value;
  const predefined = CATEGORY_TREE[major] || [];
  const historical = historicalSubCategories[major] ? [...historicalSubCategories[major]] : [];
  const combined = [...new Set([...predefined, ...historical])];

  const previousValue = els.subCategoryInput.value;
  const options = ['<option value="">選択してください</option>']
    .concat(combined.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`));
  els.subCategoryInput.innerHTML = options.join('');

  if (combined.includes(previousValue)) {
    els.subCategoryInput.value = previousValue;
  }
}

function renderRecordRow(r) {
  const categoryLabel = r.subCategory
    ? `${r.category || '未分類'} / ${r.subCategory}`
    : (r.category || '未分類');
  return `
    <div class="record-row">
      <span class="record-date">${formatDateShort(r.date)}</span>
      <span class="record-category">${escapeHtml(categoryLabel)}</span>
      <span class="record-memo">${escapeHtml(r.memo || '')}</span>
      <span class="record-amount ink-expense">-${formatCurrency(r.amount)}</span>
      <span class="record-actions">
        <button type="button" class="icon-btn edit-btn" data-id="${escapeHtml(r.id)}">編集</button>
        <button type="button" class="icon-btn delete-btn" data-id="${escapeHtml(r.id)}">削除</button>
      </span>
    </div>
  `;
}

function renderRecords(records) {
  const sorted = [...records].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    return dateDiff !== 0 ? dateDiff : String(b.id).localeCompare(String(a.id));
  });

  if (sorted.length === 0) {
    els.recordsList.innerHTML = '<p class="empty">まだ記録がありません。最初の記帳をしましょう。</p>';
    return;
  }

  const thisMonth = currentYearMonth();
  const recent = sorted.filter((r) => recordYearMonth(r) === thisMonth);
  const older = sorted.filter((r) => recordYearMonth(r) !== thisMonth);

  const recentHtml = recent.length
    ? recent.map(renderRecordRow).join('')
    : '<p class="empty">今月の記録はまだありません。</p>';

  let olderHtml = '';
  if (older.length) {
    const visibleOlder = older.slice(0, recordsLimit);
    const remaining = older.length - visibleOlder.length;
    olderHtml = `
      <details class="older-records">
        <summary>過去の記録（${older.length}件）</summary>
        <div class="older-records-list">
          ${visibleOlder.map(renderRecordRow).join('')}
          ${remaining > 0 ? `<button type="button" class="btn load-more-btn" id="loadMoreBtn">もっと見る（残り${remaining}件）</button>` : ''}
        </div>
      </details>
    `;
  }

  els.recordsList.innerHTML = recentHtml + olderHtml;
}

function enterEditMode(record) {
  els.form.id.value = record.id;
  els.form.date.value = record.date || '';
  els.form.amount.value = record.amount || '';
  els.form.memo.value = record.memo || '';
  els.expenseCategorySelect.value = record.category || '';
  updateSubCategoryOptions();
  els.subCategoryInput.value = record.subCategory || '';

  els.formTitle.textContent = '記録を編集';
  els.submitBtn.textContent = '更新する';
  els.cancelEdit.hidden = false;
  els.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exitEditMode() {
  els.form.reset();
  els.form.id.value = '';
  els.formTitle.textContent = '記帳する';
  els.submitBtn.textContent = '記帳する';
  els.cancelEdit.hidden = true;
  updateSubCategoryOptions();
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
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    setStatus('記録を削除しました。', 'ok');
  } catch (err) {
    setStatus('削除に失敗しました: ' + err.message, 'error');
  } finally {
    await loadRecords();
  }
}

// 1件分の予算をGASへ保存する（再読み込みはしない。呼び出し側でまとめて行う）
async function postSaveBudget(url, yearMonth, category, subCategory, amount, comment) {
  // text/plain を使うことで CORS のプリフライトを回避する
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: 'saveBudget', yearMonth, category, subCategory, amount, comment }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
}

async function onSaveBudget(yearMonth, category, subCategory, amount, comment) {
  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }

  try {
    await postSaveBudget(url, yearMonth, category, subCategory, amount, comment);
    setStatus('予算を更新しました。', 'ok');
  } catch (err) {
    setStatus('予算の更新に失敗しました: ' + err.message, 'error');
  } finally {
    await loadRecords();
  }
}

// 選択中の月に、前月の予算（金額・コメント）をコピーする
async function onCopyPrevBudget() {
  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }

  const ym = els.summaryMonth.value || currentYearMonth();
  const prevYm = prevYearMonth(ym);

  // 前月に設定された予算項目（金額 or コメントがあるもの）を集める
  const items = getBudgetItems()
    .map(({ major, sub }) => ({
      major,
      sub,
      amount: getBudgetAmount(prevYm, major, sub),
      comment: getBudgetComment(prevYm, major, sub),
    }))
    .filter((it) => it.amount > 0 || it.comment);

  if (!items.length) {
    setStatus(`${formatYearMonthFull(prevYm)}の予算が未設定のためコピーできません。`, 'error');
    return;
  }

  // コピーは必ず確認する。コピー先に既存の予算がある場合は上書きになる旨も明示する。
  const hasExisting = getBudgetItems().some(
    ({ major, sub }) => getBudgetAmount(ym, major, sub) > 0 || getBudgetComment(ym, major, sub)
  );
  const confirmMsg = hasExisting
    ? `${formatYearMonthFull(ym)}には既に予算があります。${formatYearMonthFull(prevYm)}の内容で上書きしますか？`
    : `${formatYearMonthFull(prevYm)}の予算を${formatYearMonthFull(ym)}にコピーします。よろしいですか？`;
  if (!confirm(confirmMsg)) {
    return;
  }

  els.copyPrevBudget.disabled = true;
  setStatus(`${formatYearMonthFull(prevYm)}の予算をコピー中...`, '');
  try {
    for (const it of items) {
      await postSaveBudget(url, ym, it.major, it.sub || '', it.amount, it.comment);
    }
    setStatus(`${formatYearMonthFull(prevYm)}の予算を${formatYearMonthFull(ym)}にコピーしました。`, 'ok');
  } catch (err) {
    setStatus('コピーに失敗しました: ' + err.message, 'error');
  } finally {
    els.copyPrevBudget.disabled = false;
    await loadRecords();
  }
}

// 選択中の月の予算を初期値（全項目0円・コメントなし）に戻す
async function onResetBudget() {
  const url = getGasUrl();
  if (!url) {
    setStatus('先に接続設定を行ってください。', 'error');
    return;
  }

  const ym = els.summaryMonth.value || currentYearMonth();

  // 現在この月に設定されている項目（金額 or コメントがあるもの）だけをクリア対象にする
  const items = getBudgetItems().filter(
    ({ major, sub }) => getBudgetAmount(ym, major, sub) > 0 || getBudgetComment(ym, major, sub)
  );

  if (!items.length) {
    setStatus(`${formatYearMonthFull(ym)}の予算はすでに未設定です。`, '');
    return;
  }

  if (!confirm(`${formatYearMonthFull(ym)}の予算をすべてクリア（初期値に戻す）します。よろしいですか？`)) {
    return;
  }

  els.resetBudget.disabled = true;
  setStatus(`${formatYearMonthFull(ym)}の予算をクリア中...`, '');
  try {
    for (const { major, sub } of items) {
      await postSaveBudget(url, ym, major, sub || '', 0, '');
    }
    setStatus(`${formatYearMonthFull(ym)}の予算を初期値に戻しました。`, 'ok');
  } catch (err) {
    setStatus('初期化に失敗しました: ' + err.message, 'error');
  } finally {
    els.resetBudget.disabled = false;
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
    date: formData.get('date'),
    category: formData.get('expenseCategory'),
    subCategory: formData.get('subCategory'),
    amount: formData.get('amount'),
    memo: formData.get('memo'),
  };

  els.submitBtn.disabled = true;
  const submittingLabel = id ? '更新中...' : '記帳中...';
  els.submitBtn.textContent = submittingLabel;

  try {
    // text/plain を使うことで CORS のプリフライトを回避する
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    setStatus(id ? '記録を更新しました。' : '記帳しました。', 'ok');
  } catch (err) {
    setStatus('保存に失敗しました: ' + err.message, 'error');
  } finally {
    exitEditMode();
    els.submitBtn.disabled = false;
    await loadRecords();
  }
}

function initMoneyRain() {
  const container = document.getElementById('moneyRain');
  if (!container) return;
  const COUNT = 18;
  for (let i = 0; i < COUNT; i++) {
    const span = document.createElement('span');
    span.textContent = '$';
    const duration = 10 + Math.random() * 10;
    span.style.left = `${Math.random() * 100}%`;
    span.style.fontSize = `${16 + Math.random() * 20}px`;
    span.style.opacity = String(0.08 + Math.random() * 0.14);
    span.style.animationDuration = `${duration}s`;
    span.style.animationDelay = `${-Math.random() * duration}s`;
    const swaySign = Math.random() < 0.5 ? -1 : 1;
    span.style.setProperty('--sway', `${swaySign * (18 + Math.random() * 26)}px`);
    container.appendChild(span);
  }
}

function init() {
  initMoneyRain();

  const url = getGasUrl();
  els.gasUrl.value = url;
  els.summaryMonth.value = currentYearMonth();
  els.form.date.value = new Date().toISOString().slice(0, 10);
  updateSubCategoryOptions();

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
  els.expenseCategorySelect.addEventListener('change', updateSubCategoryOptions);

  els.summaryMonth.addEventListener('change', () => {
    renderTopStats(currentRecords);
    renderBudgets(currentRecords);
  });

  els.copyPrevBudget.addEventListener('click', onCopyPrevBudget);
  els.resetBudget.addEventListener('click', onResetBudget);

  els.chartFilter.addEventListener('change', () => renderChart(currentRecords));

  els.budgetList.addEventListener('change', (e) => {
    const target = e.target.closest('.budget-input, .budget-comment-input');
    if (!target) return;
    const row = target.closest('.budget-row');
    const amountInput = row.querySelector('.budget-input');
    const commentInput = row.querySelector('.budget-comment-input');
    const ym = els.summaryMonth.value || currentYearMonth();
    onSaveBudget(
      ym,
      target.dataset.category,
      target.dataset.subcategory,
      Number(amountInput.value) || 0,
      commentInput ? commentInput.value : ''
    );
  });

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
