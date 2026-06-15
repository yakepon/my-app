const SHEET_NAME = 'records';
const HEADERS = ['id', 'datetime', 'studio', 'bikeNo', 'category', 'program', 'instructor', 'calories', 'memo'];

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
  return sheet;
}

// 既存シートに無い列（例: bikeNo）があれば末尾に追加し、既存データの列はそのまま保持する
function ensureHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = HEADERS.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
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
        record[key] = value instanceof Date ? value.toISOString() : value;
      });
      return record;
    })
    .filter((record) => record.id !== '' && record.id !== undefined);

  return ContentService.createTextOutput(JSON.stringify(records))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

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
