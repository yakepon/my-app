const SHEET_NAME = 'records';
const HEADERS = ['id', 'date', 'category', 'subCategory', 'amount', 'memo'];
// "2026-07-04" のような日付文字列はスプレッドシートに自動で日付型として認識され、
// 読み込み時にDateオブジェクト（タイムゾーンずれ込みのISO文字列）になってしまう
// （<input type="date">に値が入らない原因）。この列はプレーンテキスト書式に固定し、
// 読み込み時もYYYY-MM-DDへ復元する。
const DATE_FIELDS = ['date'];

const BUDGET_SHEET_NAME = 'budgets';
const BUDGET_HEADERS = ['yearMonth', 'category', 'subCategory', 'amount', 'comment'];

function getBudgetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(BUDGET_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(BUDGET_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BUDGET_HEADERS);
  } else {
    ensureBudgetHeaders(sheet);
  }
  // "2026-07" が日付として誤認識されるのを防ぐため、yearMonth列はプレーンテキスト固定にする
  const ymCol = getHeaders(sheet).indexOf('yearMonth') + 1;
  if (ymCol > 0) sheet.getRange(1, ymCol, sheet.getMaxRows(), 1).setNumberFormat('@');
  return sheet;
}

// 既存シートに無い列があれば末尾に追加し、既存データの列はそのまま保持する
function ensureBudgetHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = BUDGET_HEADERS.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
}

// 列の並び順に依存せず、ヘッダー名で値を読み書きする（records シートと同じ方式）
function budgetsToRecords(sheet) {
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .map((row) => {
      const record = {};
      headers.forEach((key, i) => { record[key] = row[i]; });
      return record;
    })
    .filter((record) => record.category !== '' && record.category !== undefined);
}

function saveBudget(sheet, data) {
  const headers = getHeaders(sheet);
  const yearMonth = data.yearMonth;
  const category = data.category;
  const subCategory = data.subCategory || '';
  const amount = Number(data.amount) || 0;
  const comment = data.comment || '';

  const ymCol = headers.indexOf('yearMonth');
  const catCol = headers.indexOf('category');
  const subCol = headers.indexOf('subCategory');
  const amtCol = headers.indexOf('amount');
  const commentCol = headers.indexOf('comment');

  const lastRow = sheet.getLastRow();
  const matchingRows = [];
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    rows.forEach((row, i) => {
      if (String(row[ymCol]) === String(yearMonth) && String(row[catCol]) === String(category) && String(row[subCol] || '') === String(subCategory)) {
        matchingRows.push(i + 2);
      }
    });
  }

  if (matchingRows.length) {
    // 同じ月・カテゴリの行が複数あると保存先と表示元がズレて「更新できない」ように見えるため、
    // 最後の1行に統合して更新し、古い重複行は削除する
    const keepRow = matchingRows[matchingRows.length - 1];
    sheet.getRange(keepRow, amtCol + 1).setValue(amount);
    if (commentCol > -1) sheet.getRange(keepRow, commentCol + 1).setValue(comment);
    for (let j = matchingRows.length - 2; j >= 0; j--) {
      sheet.deleteRow(matchingRows[j]);
    }
    return;
  }

  const row = headers.map((key) => {
    if (key === 'yearMonth') return yearMonth;
    if (key === 'category') return category;
    if (key === 'subCategory') return subCategory;
    if (key === 'amount') return amount;
    if (key === 'comment') return comment;
    return '';
  });
  sheet.appendRow(row);
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

// 一回限りの移行用スクリプト。GASエディタからこの関数を選択して実行する。
// 「その他」カテゴリの既存レコードは中カテゴリ未設定だったため、すべて「計画外」に設定する。
function migrateOtherCategoryToPlanOut() {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const catCol = headers.indexOf('category');
  const subCol = headers.indexOf('subCategory');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  rows.forEach((row, i) => {
    if (String(row[catCol]) === 'その他') {
      sheet.getRange(i + 2, subCol + 1).setValue('計画外');
    }
  });
}
