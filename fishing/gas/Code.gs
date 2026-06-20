const EVENT_SHEET  = 'events';
const CATCH_SHEET  = 'catches';
const EVENT_HEADERS = ['id', 'date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo', 'startTime', 'endTime'];
const CATCH_HEADERS = ['id', 'eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'memo'];

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const missing = headers.filter(h => !existing.includes(h));
    if (missing.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function sheetToRecords(sheet) {
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .map(row => {
      const r = {};
      headers.forEach((k, i) => { r[k] = row[i] instanceof Date ? row[i].toISOString() : row[i]; });
      return r;
    })
    .filter(r => r.id !== '' && r.id != null);
}

function doGet() {
  const es = getOrCreateSheet(EVENT_SHEET, EVENT_HEADERS);
  const cs = getOrCreateSheet(CATCH_SHEET, CATCH_HEADERS);
  return ContentService
    .createTextOutput(JSON.stringify({ events: sheetToRecords(es), catches: sheetToRecords(cs) }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data   = JSON.parse(e.postData.contents);
  const isEvent = data.action.includes('Event');
  const headers = isEvent ? EVENT_HEADERS : CATCH_HEADERS;
  const sheet   = getOrCreateSheet(isEvent ? EVENT_SHEET : CATCH_SHEET, headers);
  const verb    = data.action.replace(/Event$|Catch$/, ''); // 'add' | 'update' | 'delete'

  if (verb === 'delete') {
    deleteRecord(sheet, String(data.id));
  } else if (verb === 'update') {
    updateRecord(sheet, headers, data);
  } else {
    addRecord(sheet, headers, data);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeRow(headers, id, data) {
  return headers.map(k => k === 'id' ? id : (data[k] !== undefined ? data[k] : ''));
}

function addRecord(sheet, headers, data) {
  sheet.appendRow(makeRow(headers, data.id || Utilities.getUuid(), data));
}

function findRow(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const headers = getHeaders(sheet);
  const idCol = headers.indexOf('id') + 1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return -1;
}

function updateRecord(sheet, headers, data) {
  const row = findRow(sheet, String(data.id));
  if (row !== -1) sheet.getRange(row, 1, 1, headers.length).setValues([makeRow(headers, data.id, data)]);
}

function deleteRecord(sheet, id) {
  const row = findRow(sheet, id);
  if (row !== -1) sheet.deleteRow(row);
}
