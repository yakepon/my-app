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
    // 完全に空の行（シート末尾の余白など）だけを除外する。
    // "id"列の有無に依存しない判定にしないと、idを持たないprices等のシートで
    // 全行が除外されてしまう。
    .filter(r => Object.values(r).some(v => v !== '' && v != null));
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 「エリア」欄の文字列に含まれる地名から、気象庁 潮汐推算データの観測地点
// コードを引く。神奈川県の沿岸地点のみ対応（必要に応じて追加してください）。
const TIDE_STATIONS = {
  '横浜': 'QS',
  '川崎': 'KW',
  '本牧': 'HM',
  '横須賀': 'QN',
  '三浦': 'QN',
  '湘南港': 'D8',
  '茅ヶ崎': 'D8',
  '藤沢': 'D8',
  '江の島': 'D8',
  '小田原': 'OD',
};

function resolveTideStation(area) {
  if (!area) return null;
  for (const name in TIDE_STATIONS) {
    if (area.indexOf(name) !== -1) return TIDE_STATIONS[name];
  }
  return null;
}

// 気象庁の潮位表（推算）テキストファイルを取得し、指定日の毎時潮位(cm)を返す。
// 1行 = 1日。先頭72文字が3桁×24時間分の潮位、続く6文字が年(2)月(2)日(2)、
// 末尾2文字が地点コード（実データを取得して確認済みのフォーマット）。
function getTide(area, dateStr) {
  const station = resolveTideStation(area);
  if (!station || !dateStr) return { hours: null };

  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { hours: null };

  const year  = d.getFullYear();
  const yy    = String(year % 100).padStart(2, '0');
  const mm    = String(d.getMonth() + 1).padStart(2, ' ');
  const dd    = String(d.getDate()).padStart(2, ' ');
  const url   = `https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/${year}/${station}.txt`;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { hours: null, station };

    const lines = res.getContentText().split('\n');
    for (const line of lines) {
      if (line.length < 80) continue;
      if (line.substring(72, 74) !== yy) continue;
      if (line.substring(74, 76) !== mm) continue;
      if (line.substring(76, 78) !== dd) continue;

      const hours = [];
      for (let h = 0; h < 24; h++) {
        const tok = line.substring(h * 3, h * 3 + 3).trim();
        hours.push(tok === '' ? null : parseInt(tok, 10));
      }
      return { hours, station };
    }
    return { hours: null, station };
  } catch (err) {
    return { hours: null, station, error: String(err) };
  }
}

// 「エリア」欄の地名から、気象庁「過去の気象データ」の観測地点コードを引く。
// 神奈川県内のみ対応（type: 's1'=主要観測所/daily_s1.php, 'a1'=アメダスのみ/daily_a1.php）。
const WEATHER_STATIONS = {
  '横浜':   { code: '47670', type: 's1' },
  '川崎':   { code: '1006',  type: 'a1' }, // 日吉（最寄り）
  '本牧':   { code: '47670', type: 's1' }, // 横浜と同じ
  '横須賀': { code: '0392',  type: 'a1' }, // 三浦（最寄り）
  '三浦':   { code: '0392',  type: 'a1' },
  '湘南港': { code: '0391',  type: 'a1' }, // 江ノ島
  '茅ヶ崎': { code: '1443',  type: 'a1' }, // 辻堂（最寄り）
  '藤沢':   { code: '1443',  type: 'a1' }, // 辻堂
  '江の島': { code: '0391',  type: 'a1' },
  '小田原': { code: '1008',  type: 'a1' },
};

function resolveWeatherStation(area) {
  if (!area) return null;
  for (const name in WEATHER_STATIONS) {
    if (area.indexOf(name) !== -1) return WEATHER_STATIONS[name];
  }
  return null;
}

// 気象庁「過去の気象データ検索」の日別ページ(HTML)から、指定日の最高・最低気温(℃)を抜き出す。
// 観測所の種別によって列の並びが異なる（s1=主要観測所は気圧列がある分ずれる）。
function getDailyTemp(area, dateStr) {
  const station = resolveWeatherStation(area);
  if (!station || !dateStr) return { max: null, min: null };

  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { max: null, min: null };

  const year  = d.getFullYear();
  const month = d.getMonth() + 1;
  const day   = d.getDate();
  const path  = station.type === 's1' ? 'daily_s1.php' : 'daily_a1.php';
  const url   = `https://www.data.jma.go.jp/stats/etrn/view/${path}?prec_no=46&block_no=${station.code}&year=${year}&month=${month}&day=&view=p1`;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { max: null, min: null };

    const html = res.getContentText();
    const rowRe = /<tr class="mtx" style="text-align:right;">([\s\S]*?)<\/tr>/g;
    let m;
    while ((m = rowRe.exec(html))) {
      const row = m[1];
      const dayMatch = row.match(/day=(\d+)&view[^>]*>(\d+)</);
      if (!dayMatch || parseInt(dayMatch[2], 10) !== day) continue;

      const cells = [];
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
      let cm;
      while ((cm = cellRe.exec(row))) {
        cells.push(cm[1].replace(/<[^>]+>/g, '').trim());
      }
      const maxIdx = station.type === 's1' ? 7 : 5;
      const minIdx = station.type === 's1' ? 8 : 6;
      const max = parseFloat(cells[maxIdx]);
      const min = parseFloat(cells[minIdx]);
      return { max: isNaN(max) ? null : max, min: isNaN(min) ? null : min };
    }
    return { max: null, min: null };
  } catch (err) {
    return { max: null, min: null, error: String(err) };
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'tide') {
    return jsonOutput(getTide(params.area, params.date));
  }
  if (params.action === 'weather') {
    return jsonOutput(getDailyTemp(params.area, params.date));
  }

  const es = getOrCreateSheet(EVENT_SHEET, EVENT_HEADERS);
  const cs = getOrCreateSheet(CATCH_SHEET, CATCH_HEADERS);
  const ps = getOrCreateSheet(PRICE_SHEET, PRICE_HEADERS);
  return jsonOutput({ events: sheetToRecords(es), catches: sheetToRecords(cs), prices: sheetToRecords(ps) });
}

// パスワードは絶対にコードに直接書かない。Apps Scriptエディタの
// 「プロジェクトの設定」→「スクリプト プロパティ」で APP_PASSWORD を設定する。
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'login') {
    const expected = PropertiesService.getScriptProperties().getProperty('APP_PASSWORD');
    if (!expected) return jsonOutput({ ok: false, configured: false });
    return jsonOutput({ ok: data.password === expected, configured: true });
  }

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
