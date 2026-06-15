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

  if (data.action === 'summarize') {
    return summarizeMemos(data);
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

// 受講メモをClaude APIに送信し、プログラムの特徴を要約する
function summarizeMemos(data) {
  const memos = data.memos || [];
  const category = data.category || '';
  const program = data.program || '';

  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'スクリプトプロパティに ANTHROPIC_API_KEY が設定されていません。',
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const prompt = `以下は「${category} ${program}」というFEELCYCLEのプログラムを受講した際の感想メモです。`
    + 'これらの内容を要約し、このプログラムの特徴や雰囲気を3〜5行程度の日本語で説明してください。\n\n'
    + memos.map((memo, i) => `${i + 1}. ${memo}`).join('\n');

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText());
  if (result.error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: result.error.message || 'AI APIの呼び出しに失敗しました。',
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const summary = (result.content && result.content[0] && result.content[0].text) || '';

  return ContentService.createTextOutput(JSON.stringify({ summary }))
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
