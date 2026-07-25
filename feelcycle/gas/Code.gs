const SHEET_NAME = 'records';
const HEADERS = ['id', 'datetime', 'studio', 'bikeNo', 'category', 'program', 'instructor', 'calories', 'memo', 'instructorMemo', 'type'];

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
  if (e && e.parameter && e.parameter.action === 'programInfo') {
    return getProgramInfo(e.parameter.category, e.parameter.program);
  }
  if (e && e.parameter && e.parameter.action === 'instructorInfo') {
    return getInstructorInfo(e.parameter.name);
  }

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

// FEELCYCLIST (https://feel.shirataki.me/) のプログラム解説ページから概要を取得する。
// プログラム名には「BSL House 1」のようにカテゴリ名が含まれるのが通例なので、
// スラッグ化した際に既にカテゴリ接頭辞を含んでいればそのまま、含んでいなければ補う
// （例: カテゴリ bsl / プログラム BSL House 1 → bsl/bslhouse1/）。
function getProgramInfo(category, program) {
  const categorySlug = String(category || '').trim().toLowerCase();
  const programSlug = String(program || '').trim().toLowerCase().replace(/\s+/g, '');
  const result = { found: false, url: '', title: '', description: '' };

  if (!categorySlug || !programSlug) {
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  const programPath = programSlug.startsWith(categorySlug) ? programSlug : `${categorySlug}${programSlug}`;
  const url = `https://feel.shirataki.me/${categorySlug}/${programPath}/`;
  result.url = url;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const html = res.getContentText();
      const titleMatch = html.match(/<title>([^<]*)<\/title>/);
      const intensityText = extractIntensitySection(html);
      const descMatch = html.match(/<meta name="description" content="([^"]*)"/);

      if (intensityText || descMatch) {
        result.found = true;
        result.title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/[|｜].*$/, '').trim() : '';
        result.description = intensityText || decodeHtmlEntities(descMatch[1]);
      }
    }
  } catch (err) {
    // ネットワークエラー等は found:false のまま返す
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// 「◯◯の強度」という見出し直後から、次の見出し（走破のポイント等）が
// 現れる手前までの解説文（概要パラグラフ）を抜き出す。

// 見つからない場合は空文字を返し、呼び出し側でmeta descriptionにフォールバックする。
function extractIntensitySection(html) {
  const sectionMatch = html.match(/<h2[^>]*>[\s\S]*?の強度[\s\S]*?<\/h2>([\s\S]*?)(?=<h[234][^>]*class="wp-block-heading")/);
  if (!sectionMatch) return '';

  const paragraphs = [];
  const paraRe = /<p class="wp-block-paragraph">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = paraRe.exec(sectionMatch[1])) !== null) {
    const text = decodeHtmlEntities(m[1].replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')).trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs.join('\n\n');
}

// エンティティが多重エンコードされているページがあるため、変化が無くなるまで繰り返しデコードする
function decodeHtmlEntities(text) {
  let result = String(text);
  let previous;
  do {
    previous = result;
    result = result
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  } while (result !== previous);
  return result;
}

// FEELCYCLE FAN (https://www.feelcycle.fun/) のインストラクター個別ページから
// 担当プログラム・スタジオの実績を取得する。
function getInstructorInfo(name) {
  const instructorName = String(name || '').trim();
  const result = {
    found: false, url: '', name: '',
    debutDate: '', lastDate: '',
    totalPrograms: 0, totalLessons: 0, upcomingProgramCount: 0,
  };

  if (!instructorName) {
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  const url = `https://www.feelcycle.fun/instructor/${encodeURIComponent(instructorName)}/`;
  result.url = url;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const detail = extractInstructorDetail(res.getContentText());
      const hasPrograms = detail && Array.isArray(detail.pastProgramInfo) && detail.pastProgramInfo.length;
      if (detail && (detail.name || hasPrograms)) {
        const pastPrograms = Array.isArray(detail.pastProgramInfo) ? detail.pastProgramInfo : [];
        const upcomingPrograms = Array.isArray(detail.programInfo) ? detail.programInfo : [];

        result.found = true;
        result.name = detail.name || instructorName;
        result.debutDate = detail.startDate || '';
        result.lastDate = detail.endDate || '';
        result.totalPrograms = pastPrograms.length;
        result.totalLessons = pastPrograms.reduce((sum, p) => sum + (Number(p.lessonCount) || 0), 0);
        result.upcomingProgramCount = upcomingPrograms.length;
      }
    }
  } catch (err) {
    // ネットワークエラー等は found:false のまま返す
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// feelcycle.fun は Next.js(App Router)製で、ページデータは self.__next_f.push([1,"..."])
// のRSCストリームにJS文字列としてエスケープ埋め込みされている（旧Nuxtの __NUXT__ は廃止）。
// 各チャンクを復号して連結し、そこから programInfo 配列を出現順に取り出す。
// 1つ目=今後の担当予定、2つ目=過去の担当実績。講師名は {"name":..,"id":数値} から得る。
// 呼び出し元(getInstructorInfo)が期待する旧フィールド名に合わせて返す。
function extractInstructorDetail(html) {
  // 1) __next_f のチャンク文字列を復号して連結し、Flightペイロードを復元する
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let payload = '';
  let m;
  while ((m = re.exec(html)) !== null) {
    try { payload += JSON.parse(m[1]); } catch (e) { /* 壊れたチャンクは無視 */ }
  }
  if (!payload) return null;

  // 2) "programInfo":[ ... ] を出現順にすべて取り出す（配列内の文字列は findMatchingBracket が無視）
  const arrays = [];
  const key = '"programInfo":[';
  let from = 0;
  while (true) {
    const p = payload.indexOf(key, from);
    if (p === -1) break;
    const openIdx = p + key.length - 1; // '[' の位置
    const closeIdx = findMatchingBracket(payload, openIdx, '[', ']');
    if (closeIdx === -1) break;
    try {
      arrays.push(JSON.parse(payload.slice(openIdx, closeIdx + 1)));
    } catch (e) {
      arrays.push([]);
    }
    from = closeIdx + 1;
  }
  if (!arrays.length) return null;

  // 1つ目=今後の担当予定、2つ目=過去の実績。配列が1つだけなら実績とみなす。
  const upcoming = arrays.length >= 2 ? (arrays[0] || []) : [];
  const past = arrays.length >= 2 ? (arrays[1] || []) : (arrays[0] || []);

  // 3) 講師名（プログラムは {name,category,...}、講師は {name,id:数値} なので id で区別）
  let name = '';
  const nm = payload.match(/"name":"((?:[^"\\]|\\.)*)","id":\d+/);
  if (nm) {
    try { name = JSON.parse('"' + nm[1] + '"'); } catch (e) { name = nm[1]; }
  }

  // 4) 在籍期間は過去実績の first/last レッスン日時の最小・最大から算出
  const firsts = past.map((x) => x.firstLessonDatetime).filter(Boolean).sort();
  const lasts = past.map((x) => x.lastLessonDatetime).filter(Boolean).sort();

  return {
    name: name,
    startDate: firsts.length ? firsts[0] : '',
    endDate: lasts.length ? lasts[lasts.length - 1] : '',
    pastProgramInfo: past,
    programInfo: upcoming,
  };
}

// 開き括弧のインデックスから対応する閉じ括弧のインデックスを探す（文字列リテラル内は無視する）
function findMatchingBracket(str, openIdx, openCh, closeCh) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' || ch === "'") {
      i = skipStringLiteral(str, i);
      continue;
    }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// quoteIdx位置のクォートに対応する終端クォートのインデックスを返す
function skipStringLiteral(str, quoteIdx) {
  const quote = str[quoteIdx];
  let i = quoteIdx + 1;
  while (i < str.length) {
    if (str[i] === '\\') { i += 2; continue; }
    if (str[i] === quote) return i;
    i++;
  }
  return str.length - 1;
}

// 括弧の深さ0のカンマで区切る（引数リストのトップレベル分割用）
function splitTopLevel(str) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' || ch === "'") {
      const end = skipStringLiteral(str, i);
      current += str.slice(i, end + 1);
      i = end;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;

    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((s) => s.trim());
}

// devalue系シリアライズのオブジェクトテキストを、キーのクォート付与・変数置換・
// Array(N)のリテラル化を行いながらJSONテキストへ変換する
function rewriteNuxtStateToJson(text, varMap) {
  let out = '';
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (ch === '"' || ch === "'") {
      const end = skipStringLiteral(text, i);
      let literal = text.slice(i, end + 1);
      if (ch === "'") {
        const inner = literal.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"');
        literal = '"' + inner + '"';
      }
      out += literal;
      i = end + 1;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(text[j])) j++;
      const ident = text.slice(i, j);

      let k = j;
      while (k < n && /\s/.test(text[k])) k++;

      if (text[k] === ':') {
        // オブジェクトキー
        out += '"' + ident + '"';
        i = j;
        continue;
      }

      if (ident === 'Array' && text[k] === '(') {
        const closeIdx = findMatchingBracket(text, k, '(', ')');
        out += '[]';
        i = closeIdx === -1 ? n : closeIdx + 1;
        continue;
      }

      if (ident === 'true' || ident === 'false' || ident === 'null') {
        out += ident;
        i = j;
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(varMap, ident)) {
        const token = (varMap[ident] || '').trim();
        out += /^Array\(\d*\)$/.test(token) ? '[]' : token;
        i = j;
        continue;
      }

      // 未知の識別子は想定外のフォールバックとして文字列化する
      out += '"' + ident + '"';
      i = j;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}
