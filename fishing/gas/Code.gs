const EVENT_SHEET  = 'events';
const CATCH_SHEET  = 'catches';
const PRICE_SHEET  = 'prices';
const GEAR_SHEET   = 'gears';
const EVENT_HEADERS = ['id', 'date', 'spot', 'area', 'style', 'target', 'weather', 'tide', 'cost', 'memo', 'startTime', 'endTime', 'photo', 'photoId', 'photo2', 'photoId2', 'photo3', 'photoId3', 'lures'];
const CATCH_HEADERS = ['id', 'eventId', 'time', 'species', 'count', 'size', 'weight', 'lure', 'point', 'layer', 'memo', 'photo', 'photoId'];
const GEAR_HEADERS  = ['id', 'type', 'name', 'style', 'maker', 'memo', 'photo', 'photoId', 'photo2', 'photoId2', 'photo3', 'photoId3', 'selfWeight', 'purchaseDate', 'purchasePrice', 'rodLength', 'sinkerWeight', 'reelType', 'retrieveLength', 'gearRatio', 'nylonCapacity', 'peCapacity', 'maxDrag', 'lineType', 'lineSize', 'lastLineChangeDate', 'leaderType', 'leaderSize', 'leaderLength', 'color', 'pairedReelId', 'egiSize', 'egiSinkType', 'frequent'];
const PHOTO_FOLDER_NAME = 'AnglerLog Photos';
const PRICE_HEADERS = ['species', 'price'];
// "06:12" のような時刻文字列はスプレッドシートに自動で時刻型として認識され、
// 読み込み時にDateオブジェクトになってしまう（フロント側のHH:MM処理が壊れる原因）。
// これらの列はプレーンテキスト書式に固定し、読み込み時もHH:MMへ復元する。
const TIME_FIELDS = ['time', 'startTime', 'endTime'];
// "2024-03-10" のような日付文字列も同様にスプレッドシートに自動で日付型として
// 認識され、読み込み時にDateオブジェクト（タイムゾーンずれ込みのISO文字列）に
// なってしまう（<input type="date">に値が入らない原因）。これらの列もプレーン
// テキスト書式に固定し、読み込み時もYYYY-MM-DDへ復元する。
const DATE_FIELDS = ['purchaseDate', 'lastLineChangeDate'];

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
  ensurePlainTextColumns(sheet, getHeaders(sheet));
  return sheet;
}

function ensurePlainTextColumns(sheet, headers) {
  headers.forEach((h, i) => {
    if (TIME_FIELDS.indexOf(h) === -1 && DATE_FIELDS.indexOf(h) === -1) return;
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
        if (TIME_FIELDS.indexOf(k) !== -1) {
          r[k] = Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
        } else if (DATE_FIELDS.indexOf(k) !== -1) {
          r[k] = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          r[k] = v.toISOString();
        }
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

// ── 釣果写真（Google Drive） ────────────────────────────────────
// アップロード先フォルダはスクリプトプロパティ PHOTO_FOLDER_ID に記録し、
// 初回アップロード時に自動作成する。
function getPhotoFolder() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('PHOTO_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (err) { /* フォルダが削除済みなら作り直す */ }
  }
  const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function uploadPhoto(dataUrl, catchId) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('invalid dataUrl');
  const mimeType = m[1];
  const bytes    = Utilities.base64Decode(m[2]);
  const ext      = (mimeType.split('/')[1] || 'jpg');
  const blob     = Utilities.newBlob(bytes, mimeType, `catch_${catchId || Utilities.getUuid()}.${ext}`);

  const file = getPhotoFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const photoId = file.getId();
  return { photoId, photoUrl: `https://drive.google.com/thumbnail?id=${photoId}&sz=w1600` };
}

function deletePhotoFile(photoId) {
  if (!photoId) return;
  try {
    DriveApp.getFileById(photoId).setTrashed(true);
  } catch (err) { /* 既に削除済み・アクセス不可な場合は無視 */ }
}

function clearPhotoCell(sheet, id, photoField, photoIdField) {
  if (!id) return;
  const row = findRow(sheet, String(id));
  if (row === -1) return;
  const headers = getHeaders(sheet);
  const photoCol   = headers.indexOf(photoField || 'photo') + 1;
  const photoIdCol = headers.indexOf(photoIdField || 'photoId') + 1;
  if (photoCol)   sheet.getRange(row, photoCol).setValue('');
  if (photoIdCol) sheet.getRange(row, photoIdCol).setValue('');
}

// 「エリア」欄の文字列に含まれる地名から、気象庁 潮汐推算データの観測地点
// コードを引く。神奈川県の沿岸地点のみ対応（必要に応じて追加してください）。
const TIDE_STATIONS = {
  // 神奈川県
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
  // 千葉県
  '銚子': 'CS',
  '勝浦': 'ZF',
  '御宿': 'ZF',
  '大原': 'ZF',
  '鴨川': 'TT',
  '南房総': 'TT', // 館山（最寄り）
  '館山': 'TT',
  '富津': 'KZ',
  '金谷': 'KZ',
  '保田': 'TT',
  '鋸南': 'TT',
  '木更津': 'KZ',
  '市原': 'CB',
  '千葉': 'CB',
  '船橋': 'CB',
  // 静岡県
  '熱海': 'Z3',
  '伊東': 'Z3',
  '下田': 'D6',
  '南伊豆': 'QK',
  '石廊崎': 'G9',
  '松崎': 'Z4',
  '土肥': 'Z4',
  '西伊豆': 'Z4',
  '沼津': 'UC',
  '内浦': 'UC',
  '清水': 'SM',
  '焼津': 'Z5',
  '御前崎': 'OM',
  '浜松': 'MI',
  '舞阪': 'MI',
  '浜名湖': 'MI',
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

// 気象取得用の緯度経度（Open-Meteo の水温・気温・風速・天気で共用）
const AREA_COORDS_GAS = {
  // 神奈川県
  '横浜':   { lat: 35.45, lon: 139.65 }, '川崎':   { lat: 35.51, lon: 139.71 },
  '本牧':   { lat: 35.42, lon: 139.67 }, '横須賀': { lat: 35.28, lon: 139.67 },
  '三浦':   { lat: 35.15, lon: 139.62 }, '湘南港': { lat: 35.30, lon: 139.39 },
  '茅ヶ崎': { lat: 35.33, lon: 139.41 }, '藤沢':   { lat: 35.34, lon: 139.49 },
  '江の島': { lat: 35.30, lon: 139.48 }, '小田原': { lat: 35.25, lon: 139.15 },
  // 千葉県
  '銚子':   { lat: 35.73, lon: 140.83 }, '勝浦':   { lat: 35.13, lon: 140.25 },
  '館山':   { lat: 34.98, lon: 139.87 }, '富津':   { lat: 35.30, lon: 139.83 },
  '木更津': { lat: 35.38, lon: 139.93 }, '千葉':   { lat: 35.60, lon: 140.10 },
  '船橋':   { lat: 35.70, lon: 139.98 },
  // 静岡県
  '熱海':   { lat: 35.10, lon: 139.07 }, '下田':   { lat: 34.68, lon: 138.95 },
  '沼津':   { lat: 35.09, lon: 138.86 }, '清水':   { lat: 35.02, lon: 138.49 },
  '御前崎': { lat: 34.59, lon: 138.22 }, '浜松':   { lat: 34.71, lon: 137.73 },
};

function resolveAreaCoordsGas(area) {
  if (!area) return null;
  for (const name in AREA_COORDS_GAS) {
    if (area.indexOf(name) !== -1) return AREA_COORDS_GAS[name];
  }
  return null;
}

// Open-Meteo Marine API で海面水温（日平均）を取得する。
function getWaterTemp(area, dateStr) {
  const coords = resolveAreaCoordsGas(area);
  if (!coords || !dateStr) return null;
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lon}&daily=sea_surface_temperature_mean&timezone=Asia%2FTokyo&start_date=${dateStr}&end_date=${dateStr}`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    const data = JSON.parse(res.getContentText());
    const temp = data.daily && data.daily.sea_surface_temperature_mean && data.daily.sea_surface_temperature_mean[0];
    return (temp != null && !isNaN(Number(temp))) ? Math.round(Number(temp) * 10) / 10 : null;
  } catch (err) {
    return null;
  }
}

// WMO天気コード（Open-Meteo weather_code）を日本語の天気概況に変換する。
// https://open-meteo.com/en/docs のWMO Weather interpretation codesに準拠。
function weatherCodeToText(code) {
  if (code == null) return null;
  const map = {
    0: '快晴', 1: '晴れ', 2: '晴れ時々曇り', 3: '曇り',
    45: '霧', 48: '霧氷',
    51: '霧雨', 53: '霧雨', 55: '霧雨',
    56: '着氷性の霧雨', 57: '着氷性の霧雨',
    61: '弱い雨', 63: '雨', 65: '強い雨',
    66: '着氷性の雨', 67: '着氷性の雨',
    71: '弱い雪', 73: '雪', 75: '強い雪', 77: '霧雪',
    80: 'にわか雨', 81: 'にわか雨', 82: '激しいにわか雨',
    85: 'にわか雪', 86: '強いにわか雪',
    95: '雷雨', 96: '雷雨（雹）', 99: '雷雨（雹）',
  };
  return map[code] || null;
}

// Open-Meteo で指定日の最高・最低気温(℃)、最大風速(m/s)、天気概況を取得する。
// 座標ベースなので観測所の有無に依存せず、どの釣り場でも安定して埋まる。
// 気象庁の過去データ(ERA5)は約5日遅れのため、直近5日以内・未来日は予報API、
// それ以前は再解析(archive)APIを使い分ける。
function getDailyWeather(area, dateStr) {
  const empty = { max: null, min: null, windMax: null, weather: null };
  const coords = resolveAreaCoordsGas(area);
  if (!coords || !dateStr) return empty;

  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return empty;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today - target) / 86400000;
  const base = diffDays > 5
    ? 'https://archive-api.open-meteo.com/v1/archive'
    : 'https://api.open-meteo.com/v1/forecast';
  const url = `${base}?latitude=${coords.lat}&longitude=${coords.lon}`
    + '&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code'
    + `&wind_speed_unit=ms&timezone=Asia%2FTokyo&start_date=${dateStr}&end_date=${dateStr}`;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return empty;
    const data = JSON.parse(res.getContentText());
    const d = (data && data.daily) || {};
    const first = (arr) => (arr && arr[0] != null && !isNaN(Number(arr[0]))) ? Number(arr[0]) : null;
    const round1 = (v) => v == null ? null : Math.round(v * 10) / 10;
    const code = first(d.weather_code);
    return {
      max:     round1(first(d.temperature_2m_max)),
      min:     round1(first(d.temperature_2m_min)),
      windMax: round1(first(d.wind_speed_10m_max)),
      weather: weatherCodeToText(code),
    };
  } catch (err) {
    return { max: null, min: null, windMax: null, weather: null, error: String(err) };
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'tide') {
    return jsonOutput(getTide(params.area, params.date));
  }
  if (params.action === 'weather') {
    const result = getDailyWeather(params.area, params.date);
    result.waterTemp = getWaterTemp(params.area, params.date);
    return jsonOutput(result);
  }

  const es = getOrCreateSheet(EVENT_SHEET, EVENT_HEADERS);
  const cs = getOrCreateSheet(CATCH_SHEET, CATCH_HEADERS);
  const ps = getOrCreateSheet(PRICE_SHEET, PRICE_HEADERS);
  const gs = getOrCreateSheet(GEAR_SHEET, GEAR_HEADERS);
  return jsonOutput({ events: sheetToRecords(es), catches: sheetToRecords(cs), prices: sheetToRecords(ps), gears: sheetToRecords(gs) });
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

  if (data.action === 'uploadPhoto') {
    const { photoId, photoUrl } = uploadPhoto(data.dataUrl, data.catchId);
    return jsonOutput({ result: 'ok', photoId, photoUrl });
  }

  if (data.action === 'deletePhoto') {
    deletePhotoFile(data.photoId);
    const photoField   = data.photoField || 'photo';
    const photoIdField = 'photoId' + photoField.replace('photo', ''); // photo→photoId, photo2→photoId2 等
    if (data.catchId) clearPhotoCell(getOrCreateSheet(CATCH_SHEET, CATCH_HEADERS), data.catchId, photoField, photoIdField);
    if (data.eventId) clearPhotoCell(getOrCreateSheet(EVENT_SHEET, EVENT_HEADERS), data.eventId, photoField, photoIdField);
    if (data.gearId)  clearPhotoCell(getOrCreateSheet(GEAR_SHEET, GEAR_HEADERS), data.gearId, photoField, photoIdField);
    return jsonOutput({ result: 'ok' });
  }

  const isEvent = data.action.includes('Event');
  const isGear  = data.action.includes('Gear');
  const codeHeaders = isEvent ? EVENT_HEADERS : isGear ? GEAR_HEADERS : CATCH_HEADERS;
  const sheet   = getOrCreateSheet(isEvent ? EVENT_SHEET : isGear ? GEAR_SHEET : CATCH_SHEET, codeHeaders);
  // 列の並びは過去の追加履歴によりシート上の物理的な順序とコード上の定義順が
  // ズレている場合があるため、書き込み時は必ずシートの実ヘッダー順を使う。
  const headers = getHeaders(sheet);
  const verb    = data.action.replace(/Event$|Catch$|Gear$/, ''); // 'add' | 'update' | 'delete'

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
