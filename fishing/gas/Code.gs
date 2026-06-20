const EVENT_SHEET  = 'events';
const CATCH_SHEET  = 'catches';
const PRICE_SHEET  = 'prices';
const EVENT_HEADERS = ['id', 'date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo', 'startTime', 'endTime'];
const CATCH_HEADERS = ['id', 'eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'memo'];
const PRICE_HEADERS = ['species', 'price'];
// "06:12" のような時刻文字列はスプレッドシートに自動で時刻型として認識され、
// 読み込み時にDateオブジェクトになってしまう（フロント側のHH:MM処理が壊れる原因）。
// これらの列はプレーンテキスト書式に固定し、読み込み時もHH:MMへ復元する。
const TIME_FIELDS = ['time', 'startTime', 'endTime'];

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
  ensurePlainTextTimeColumns(sheet, headers);
  return sheet;
}

function ensurePlainTextTimeColumns(sheet, headers) {
  headers.forEach((h, i) => {
    if (TIME_FIELDS.indexOf(h) === -1) return;
    sheet.getRange(1, i + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
  });
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
      headers.forEach((k, i) => {
        const v = row[i];
        if (!(v instanceof Date)) { r[k] = v; return; }
        r[k] = TIME_FIELDS.indexOf(k) !== -1
          ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm')
          : v.toISOString();
      });
      return r;
    })
    .filter(r => r.id !== '' && r.id != null);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const es = getOrCreateSheet(EVENT_SHEET, EVENT_HEADERS);
  const cs = getOrCreateSheet(CATCH_SHEET, CATCH_HEADERS);
  const ps = getOrCreateSheet(PRICE_SHEET, PRICE_HEADERS);
  return jsonOutput({ events: sheetToRecords(es), catches: sheetToRecords(cs), prices: sheetToRecords(ps) });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'savePrice') {
    const sheet = getOrCreateSheet(PRICE_SHEET, PRICE_HEADERS);
    upsertPrice(sheet, data.species, data.price);
    return jsonOutput({ result: 'ok' });
  }

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

  return jsonOutput({ result: 'ok' });
}

function upsertPrice(sheet, species, price) {
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const speciesCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < speciesCol.length; i++) {
      if (speciesCol[i][0] === species) {
        sheet.getRange(i + 2, 2).setValue(price);
        return;
      }
    }
  }
  sheet.appendRow([species, price]);
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
