const SHEET_NAME = 'records';
const HEADERS = ['id', 'date', 'category', 'subCategory', 'amount', 'memo'];
// "2026-07-04" のような日付文字列はスプレッドシートに自動で日付型として認識され、
// 読み込み時にDateオブジェクト（タイムゾーンずれ込みのISO文字列）になってしまう
// （<input type="date">に値が入らない原因）。この列はプレーンテキスト書式に固定し、
// 読み込み時もYYYY-MM-DDへ復元する。
const DATE_FIELDS = ['date'];

const BUDGET_SHEET_NAME = 'budgets';
const BUDGET_HEADERS = ['category', 'subCategory', 'amount'];

function getBudgetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(BUDGET_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(BUDGET_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BUDGET_HEADERS);
  }
  return sheet;
}

function budgetsToRecords(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 3).getValues()
    .filter((row) => row[0] !== '')
    .map((row) => ({ category: row[0], subCategory: row[1], amount: row[2] }));
}

function saveBudget(sheet, data) {
  const category = data.category;
  const subCategory = data.subCategory || '';
  const amount = Number(data.amount) || 0;
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(category) && String(rows[i][1] || '') === String(subCategory)) {
        sheet.getRange(i + 2, 3).setValue(amount);
        return;
      }
    }
  }
  sheet.appendRow([category, subCategory, amount]);
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    ensureHeaders(sheet);
  }
  ensurePlainTextColumns(sheet, getHeaders(sheet));
  return sheet;
}

// 既存シートに無い列があれば末尾に追加し、既存データの列はそのまま保持する
function ensureHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = HEADERS.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
}

function ensurePlainTextColumns(sheet, headers) {
  headers.forEach((h, i) => {
    if (DATE_FIELDS.indexOf(h) === -1) return;
    sheet.getRange(1, i + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
  });
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function doGet(e) {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  const rows = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  const records = rows
    .map((row) => {
      const record = {};
      headers.forEach((key, i) => {
        const value = row[i];
        if (!(value instanceof Date)) { record[key] = value; return; }
        if (DATE_FIELDS.indexOf(key) !== -1) {
          record[key] = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          record[key] = value.toISOString();
        }
      });
      return record;
    })
    .filter((record) => record.id !== '' && record.id !== undefined);

  const budgets = budgetsToRecords(getBudgetSheet());

  return ContentService.createTextOutput(JSON.stringify({ records, budgets }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'saveBudget') {
    saveBudget(getBudgetSheet(), data);
    return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet();

  switch (data.action) {
    case 'update':
      updateRecord(sheet, data);
      break;
    case 'delete':
      deleteRecord(sheet, data);
      break;
    default:
      addRecord(sheet, data);
      break;
  }

  return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ヘッダーの並び順に合わせて1行分の値を組み立てる
function recordToRow(headers, id, data) {
  return headers.map((key) => {
    if (key === 'id') return id;
    if (key === 'amount') return Number(data.amount) || 0;
    return data[key] !== undefined ? data[key] : '';
  });
}

function addRecord(sheet, data) {
  const headers = getHeaders(sheet);
  const id = Utilities.getUuid();
  sheet.appendRow(recordToRow(headers, id, data));
}

function findRowById(sheet, headers, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const idCol = headers.indexOf('id') + 1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function updateRecord(sheet, data) {
  const headers = getHeaders(sheet);
  const row = findRowById(sheet, headers, data.id);
  if (row === -1) return;
  sheet.getRange(row, 1, 1, headers.length).setValues([recordToRow(headers, data.id, data)]);
}

function deleteRecord(sheet, data) {
  const headers = getHeaders(sheet);
  const row = findRowById(sheet, headers, data.id);
  if (row === -1) return;
  sheet.deleteRow(row);
}
