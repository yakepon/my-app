const STORAGE_KEY = 'budget_gas_url';

const DEFAULT_CATEGORIES = {
  expense: ['食費', '日用品', '住居費', '光熱費', '通信費', '交通費', '医療費', '娯楽費', '交際費', '衣服・美容', 'その他'],
  income: ['給与', '賞与', '副業', 'その他'],
};

const els = {
  settings: document.getElementById('settings'),
  toggleSettings: document.getElementById('toggleSettings'),
  gasUrl: document.getElementById('gasUrl'),
  saveUrl: document.getElementById('saveUrl'),
  connStatus: document.getElementById('connStatus'),
  statIncome: document.getElementById('statIncome'),
  statExpense: document.getElementById('statExpense'),
  statBalance: document.getElementById('statBalance'),
  hankoStamp: document.getElementById('hankoStamp'),
  summaryMonth: document.getElementById('summaryMonth'),
  summaryIncome: document.getElementById('summaryIncome'),
  summaryExpense: document.getElementById('summaryExpense'),
  summaryBalance: document.getElementById('summaryBalance'),
  expenseBreakdown: document.getElementById('expenseBreakdown'),
  incomeBreakdown: document.getElementById('incomeBreakdown'),
  form: document.getElementById('recordForm'),
  formTitle: document.getElementById('formTitle'),
  submitBtn: document.getElementById('submitBtn'),
  cancelEdit: document.getElementById('cancelEdit'),
  categoryInput: document.getElementById('categoryInput'),
  expenseCategoryList: document.getElementById('expenseCategoryList'),
  incomeCategoryList: document.getElementById('incomeCategoryList'),
  recordsList: document.getElementById('recordsList'),
};

let currentRecords = [];

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

function recordYearMonth(record) {
  return String(record.date || '').slice(0, 7);
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
    renderAll(records);
    setStatus(`接続済み（${records.length}件の記録）`, 'ok');
  } catch (err) {
    setStatus('読み込みに失敗しました: ' + err.message, 'error');
    els.recordsList.innerHTML = '<p class="empty">記録を取得できませんでした。URLや公開設定（アクセス権: 全員）を確認してください。</p>';
  }
}

function renderAll(records) {
  renderTopStats(records);
  renderMonthlySummary(records);
  populateCategoryLists(records);
  renderRecords(records);
}

function renderTopStats(records) {
  const ym = currentYearMonth();
  const monthRecords = records.filter((r) => recordYearMonth(r) === ym);
  const income = monthRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const expense = monthRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const balance = income - expense;

  els.statIncome.textContent = formatCurrency(income);
  els.statExpense.textContent = formatCurrency(expense);
  els.statBalance.textContent = formatCurrency(balance);

  const isSurplus = balance >= 0;
  els.hankoStamp.textContent = isSurplus ? '黒字' : '赤字';
  els.hankoStamp.className = 'hanko ' + (isSurplus ? 'hanko-black' : 'hanko-red');
  // 押し直す演出のためクラスを一度外して再付与する
  void els.hankoStamp.offsetWidth;
  els.hankoStamp.classList.add('hanko-stamped');
}

function renderMonthlySummary(records) {
  const ym = els.summaryMonth.value || currentYearMonth();
  const monthRecords = records.filter((r) => recordYearMonth(r) === ym);

  const income = monthRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const expense = monthRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const balance = income - expense;

  els.summaryIncome.textContent = formatCurrency(income);
  els.summaryExpense.textContent = formatCurrency(expense);
  els.summaryBalance.textContent = formatCurrency(balance);
  els.summaryBalance.className = 'summary-total-value ' + (balance >= 0 ? 'ink-income' : 'ink-expense');

  renderBreakdown(els.expenseBreakdown, monthRecords.filter((r) => r.type === 'expense'), 'expense');
  renderBreakdown(els.incomeBreakdown, monthRecords.filter((r) => r.type === 'income'), 'income');
}

function renderBreakdown(el, records, type) {
  if (!records.length) {
    el.innerHTML = '<p class="empty">記録がありません。</p>';
    return;
  }
  const counts = {};
  records.forEach((r) => {
    const cat = (r.category || '').trim() || '未分類';
    counts[cat] = (counts[cat] || 0) + Number(r.amount || 0);
  });
  const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  el.innerHTML = rows.map(([cat, amount]) => {
    const pct = total ? Math.round((amount / total) * 100) : 0;
    return `
      <div class="breakdown-row">
        <div class="breakdown-row-head">
          <span class="breakdown-cat">${escapeHtml(cat)}</span>
          <span class="breakdown-amt ${type === 'expense' ? 'ink-expense' : 'ink-income'}">${formatCurrency(amount)}</span>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill ${type === 'expense' ? 'bar-expense' : 'bar-income'}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function populateCategoryLists(records) {
  const expenseCats = new Set(DEFAULT_CATEGORIES.expense);
  const incomeCats = new Set(DEFAULT_CATEGORIES.income);
  records.forEach((r) => {
    const cat = String(r.category || '').trim();
    if (!cat) return;
    if (r.type === 'income') incomeCats.add(cat); else expenseCats.add(cat);
  });
  els.expenseCategoryList.innerHTML = [...expenseCats].map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
  els.incomeCategoryList.innerHTML = [...incomeCats].map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
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

  const visible = sorted.slice(0, recordsLimit);
  const remaining = sorted.length - visible.length;

  els.recordsList.innerHTML = visible.map((r) => {
    const isIncome = r.type === 'income';
    const sign = isIncome ? '+' : '-';
    return `
    <div class="record-row">
      <span class="record-date">${formatDateShort(r.date)}</span>
      <span class="record-category">${escapeHtml(r.category || '未分類')}</span>
      <span class="record-memo">${escapeHtml(r.memo || '')}</span>
      <span class="record-amount ${isIncome ? 'ink-income' : 'ink-expense'}">${sign}${formatCurrency(r.amount)}</span>
      <span class="record-actions">
        <button type="button" class="icon-btn edit-btn" data-id="${escapeHtml(r.id)}">編集</button>
        <button type="button" class="icon-btn delete-btn" data-id="${escapeHtml(r.id)}">削除</button>
      </span>
    </div>
  `;
  }).join('') + (remaining > 0 ? `<button type="button" class="btn load-more-btn" id="loadMoreBtn">もっと見る（残り${remaining}件）</button>` : '');
}

function setCategoryDatalist(type) {
  els.categoryInput.setAttribute('list', type === 'income' ? 'incomeCategoryList' : 'expenseCategoryList');
}

function enterEditMode(record) {
  els.form.id.value = record.id;
  els.form.date.value = record.date || '';
  els.form.amount.value = record.amount || '';
  els.form.category.value = record.category || '';
  els.form.memo.value = record.memo || '';

  const type = record.type || 'expense';
  els.form.querySelectorAll('input[name="type"]').forEach((radio) => { radio.checked = radio.value === type; });
  setCategoryDatalist(type);

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
  setCategoryDatalist('expense');
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
    date: formData.get('date'),
    type: formData.get('type') || 'expense',
    category: formData.get('category'),
    amount: formData.get('amount'),
    memo: formData.get('memo'),
  };

  els.submitBtn.disabled = true;
  const submittingLabel = id ? '更新中...' : '記帳中...';
  els.submitBtn.textContent = submittingLabel;

  try {
    // text/plain を使うことで CORS のプリフライトを回避する
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStatus(id ? '記録を更新しました。' : '記帳しました。', 'ok');
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
  els.summaryMonth.value = currentYearMonth();
  els.form.date.value = new Date().toISOString().slice(0, 10);

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
    if (e.target.name === 'type') setCategoryDatalist(e.target.value);
  });

  els.summaryMonth.addEventListener('change', () => renderMonthlySummary(currentRecords));

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
