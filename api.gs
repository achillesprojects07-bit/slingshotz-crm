/*************************************************************************
 * SLINGSHOTZ TELEMARKETING CRM — BACKEND (api.gs)
 * Google Apps Script Web App + Google Sheets database.
 *
 * - This file is the ONLY script file the project needs. Do not keep
 *   backup .gs files in the project: every .gs file executes.
 * - No HTML lives here. The frontend is index.html on GitHub Pages.
 * - Every route returns JSON: { ok: true/false, ... }.
 * - Every route is testable by direct URL:
 *     <WEB_APP_URL>?action=login&mode=DEMO&code=ARN&pin=1111
 *
 * FIRST-TIME SETUP:
 *   1. Open the Apps Script editor bound to (or pointing at) your
 *      spreadsheet, paste this file as Code.gs / api.gs.
 *   2. If the script is NOT bound to the spreadsheet, set SPREADSHEET_ID.
 *   3. Run setupSheets() once from the editor (or hit ?action=setup).
 *      It creates all sheets + headers and seeds the 4 initial users
 *      (default PIN 1111 — change via Users/Settings after first login).
 *   4. Deploy > New deployment > Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Paste the /exec URL into API_URL in index.html.
 *************************************************************************/

// Leave blank if this script is container-bound to the CRM spreadsheet.
var SPREADSHEET_ID = '';

var APP_NAME = 'SLINGSHOTZ CRM API';
var APP_VERSION = '1.0.0';
var DAILY_TARGET = 30;      // calls per agent per day
var MAX_ATTEMPTS = 3;       // retry cap for non-contact results
var EVENT_SOON_DAYS = 45;   // "client event coming soon" window

/* ----------------------------- VOCABULARY ----------------------------- */

var CALL_RESULTS = [
  'ASKED TO CALL BACK',
  'BIDDING REQUIREMENT',
  'BUSY / TRY AGAIN',
  'COMPANY PROFILE SENT',
  'COMPANY PROFILE MEETING SET',
  'CONTACT PERSON NOT AVAILABLE',
  'EVENT IDENTIFIED',
  'PROJECT BRIEFING MEETING SET',
  'NO ANSWER',
  'NO REQUIREMENT',
  'NOT INTERESTED',
  'NUMBER UNREACHABLE',
  'WRONG NUMBER'
];

var MEANINGFUL_RESULTS = {
  'ASKED TO CALL BACK': 1, 'BIDDING REQUIREMENT': 1, 'COMPANY PROFILE SENT': 1,
  'COMPANY PROFILE MEETING SET': 1, 'EVENT IDENTIFIED': 1, 'PROJECT BRIEFING MEETING SET': 1
};
var RETRY_RESULTS = { 'NO ANSWER': 1, 'BUSY / TRY AGAIN': 1, 'CONTACT PERSON NOT AVAILABLE': 1 };
var FOLLOWUP_RESULTS = { 'ASKED TO CALL BACK': 1, 'COMPANY PROFILE SENT': 1, 'EVENT IDENTIFIED': 1, 'BIDDING REQUIREMENT': 1 };
var MEETING_RESULTS = { 'COMPANY PROFILE MEETING SET': 1, 'PROJECT BRIEFING MEETING SET': 1 };
var CLOSED_RESULTS = { 'NO REQUIREMENT': 1, 'NOT INTERESTED': 1, 'NUMBER UNREACHABLE': 1, 'WRONG NUMBER': 1 };

/* ------------------------------- SHEETS -------------------------------- */

var SHEET_HEADERS = {
  'COMPANY MASTER': [
    'COMPANY ID', 'COMPANY NAME', 'INDUSTRY / CATEGORY', 'PRIMARY CONTACT', 'TITLE',
    'PHONE', 'MOBILE', 'EMAIL', 'OTHER CONTACTS', 'EVENTS PARTICIPATED', 'POSSIBLE REQUIREMENTS'
  ],
  'COMPANY STATUS': [
    'COMPANY ID', 'COMPANY NAME', 'ACCOUNT OWNER', 'ACCOUNT STATUS', 'LATEST CALL RESULT',
    'LATEST NEXT ACTION', 'LATEST DEADLINE', 'LATEST CLIENT EVENT NAME', 'LATEST CLIENT EVENT DATE',
    'LAST CALL DATE', 'LAST CALLED BY', 'ATTEMPT COUNT', 'LAST UPDATED BY', 'LAST UPDATED AT',
    'OWNERSHIP DATE', 'FOLLOW-UP COUNT'
  ],
  'CALL LOG': [
    'TIMESTAMP', 'CALL ID', 'COMPANY ID', 'COMPANY NAME', 'AGENT', 'CALL RESULT',
    'FOLLOW UP DATE', 'CLIENT EVENT NAME', 'CLIENT EVENT DATE', 'NOTES'
  ],
  'DAILY ACTION LIST': [
    'TIMESTAMP', 'COMPANY ID', 'COMPANY NAME', 'AGENT', 'STATUS', 'ATTEMPTS', 'LAST RESULT', 'LAST CALL DATE'
  ],
  'USERS': [
    'USER CODE', 'NAME', 'PIN', 'ROLE', 'ACTIVE', 'CAN ADD EVENTS', 'CAN SWITCH LIVE', 'CREATED AT', 'UPDATED AT'
  ],
  'APP ACTIVITY LOG': [
    'TIMESTAMP', 'USER', 'ACTIVITY TYPE', 'COMPANY ID', 'COMPANY NAME', 'DETAILS'
  ],
  'EVENT MASTER': [
    'EVENT ID', 'EVENT NAME', 'CATEGORY', 'START DATE', 'END DATE', 'VENUE', 'ORGANIZER',
    'SOURCE', 'SOURCE URL', 'TARGET INDUSTRY', 'POSSIBLE REQUIREMENTS', 'LEAD STATUS',
    'PROSPECTING START DATE', 'PROSPECTING STATUS', 'NOTES',
    'CREATED BY', 'CREATED AT', 'UPDATED BY', 'UPDATED AT', 'DELETED',
    // Public Event Finder columns (appended; ensureEventColumns_ upgrades
    // existing sheets in place without touching existing data)
    'EVENT TYPE', 'CITY', 'PUBLIC LISTING TEXT', 'PROSPECTING ANGLE',
    'SUGGESTED TARGET COMPANIES', 'REVIEW STATUS', 'CONFIDENCE LEVEL',
    'DATE FOUND', 'LAST CHECKED'
  ],
  // Public Event Finder config (shared across DEMO/LIVE — pure configuration).
  'EVENT SOURCES': [
    'SOURCE ID', 'SOURCE NAME', 'SOURCE TYPE', 'SOURCE URL', 'DEFAULT VENUE',
    'DEFAULT CITY', 'DEFAULT INDUSTRY CATEGORY', 'ACTIVE', 'LAST CHECKED', 'NOTES'
  ],
  'EVENT INDUSTRY MAP': [
    'KEYWORD', 'EVENT TYPE', 'INDUSTRY CATEGORY', 'TARGET INDUSTRIES',
    'POSSIBLE REQUIREMENTS', 'PROSPECTING ANGLE'
  ],
  // Clean phone-number support table (one number per row). COMPANY MASTER
  // stays the main company database; this sheet only supplies callable numbers.
  // Shared across DEMO/LIVE like COMPANY MASTER (it derives from it).
  'COMPANY CONTACT NUMBERS': [
    'CONTACT NUMBER ID', 'COMPANY ID', 'COMPANY NAME', 'SOURCE FIELD', 'ORIGINAL TEXT',
    'CONTACT TYPE', 'RAW NUMBER', 'NORMALIZED NUMBER', 'DIAL NUMBER', 'DISPLAY NUMBER',
    'EXTENSION', 'IS MOBILE', 'IS LANDLINE', 'IS_VALID', 'VALIDATION STATUS',
    'VALIDATION NOTE', 'PRIMARY NUMBER', 'CREATED AT', 'UPDATED AT'
  ]
};

// Sheets that have a separate DEMO copy. COMPANY MASTER and USERS are shared
// (COMPANY MASTER is read-only source data for DEMO mode).
var MODE_SPECIFIC = {
  'CALL LOG': 1, 'DAILY ACTION LIST': 1, 'APP ACTIVITY LOG': 1, 'EVENT MASTER': 1, 'COMPANY STATUS': 1
};

/* ------------------------------ ENTRYPOINTS ---------------------------- */

function doGet(e) { return route_(e); }

function doPost(e) { return route_(e); }

function route_(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    // Allow POST bodies (text/plain JSON) as an alternative to query params.
    if (e && e.postData && e.postData.contents) {
      try {
        var body = JSON.parse(e.postData.contents);
        for (var k in body) {
          if (p[k] === undefined || p[k] === '') p[k] = body[k] == null ? '' : String(body[k]);
        }
      } catch (ignore) { /* not JSON; query params only */ }
    }
    var action = String(p.action || '').trim();
    if (!action) {
      return json_({ ok: true, app: APP_NAME, version: APP_VERSION, message: 'API is up. Pass ?action=...', actions: routeNames_() });
    }
    var handler = routes_()[action];
    if (!handler) return json_({ ok: false, error: 'Unknown action: ' + action, actions: routeNames_() });
    return json_(handler(p));
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function routes_() {
  return {
    // setup
    'setup': apiSetup_,
    // core / users
    'login': apiLogin_,
    'getUsers': apiGetUsers_,
    'addUser': apiAddUser_,
    'updateUser': apiUpdateUser_,
    'resetUserPin': apiResetUserPin_,
    'setUserActive': apiSetUserActive_,
    // companies
    'getCallQueue': apiGetCallQueue_,
    'upsertCompany': apiUpsertCompany_,
    // targets / actions
    'getDailyActions': apiGetDailyActions_,
    'getMyActions': apiGetMyActions_,
    'addTarget': apiAddTarget_,
    'removeTarget': apiRemoveTarget_,
    // call logging
    'logCall': apiLogCall_,
    'saveCallLog': apiLogCall_,   // alias, same handler
    'getCallHistory': apiGetCallHistory_,
    // agent
    'getAgentDashboardReport': apiAgentDashboard_,
    // manager
    'getManagerDashboardReport': apiManagerDashboard_,
    'getAgentPerformanceReport': apiAgentPerformance_,
    'getWorkTrailRange': apiWorkTrail_,
    'getManagerAttention': apiManagerAttentionRoute_,
    // events
    'getEvents': apiGetEvents_,
    'upsertEvent': apiUpsertEvent_,
    'deleteEvent': apiDeleteEvent_,
    // activity
    'logBreadcrumb': apiLogBreadcrumb_,
    'getCompanyEditHistory': apiCompanyEditHistory_,
    'resetDemoActivity': apiResetDemoActivity_,
    // public event finder
    'getEventSources': apiGetEventSources_,
    'upsertEventSource': apiUpsertEventSource_,
    'getEventIndustryMap': apiGetEventIndustryMap_,
    'upsertEventIndustryMap': apiUpsertEventIndustryMap_,
    'importPublicEvents': apiImportPublicEvents_,
    'getPublicEventCandidates': apiGetPublicEventCandidates_,
    'approvePublicEvent': apiApprovePublicEvent_,
    'rejectPublicEvent': apiRejectPublicEvent_,
    'markEventDuplicate': apiMarkEventDuplicate_,
    // phone cleanup layer
    'syncCompanyContactNumbers': apiSyncContactNumbers_,
    'getCompanyContactNumbers': apiGetCompanyContactNumbers_,
    'getPrimaryPhone': apiGetPrimaryPhone_,
    'getPhoneCleanupReport': apiGetPhoneCleanupReport_
  };
}

function routeNames_() {
  var names = [];
  var r = routes_();
  for (var k in r) names.push(k);
  return names.sort();
}

/* ------------------------------- HELPERS ------------------------------- */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet. Bind the script to a sheet or set SPREADSHEET_ID.');
  return ss;
}

function baseName_(name) { return name.indexOf('DEMO ') === 0 ? name.substring(5) : name; }

function modeSheetName_(base, mode) {
  return (mode === 'DEMO' && MODE_SPECIFIC[base]) ? 'DEMO ' + base : base;
}

function sheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var headers = SHEET_HEADERS[baseName_(name)];
    if (headers) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function normMode_(m) {
  m = String(m || 'DEMO').toUpperCase();
  return m === 'LIVE' ? 'LIVE' : 'DEMO';
}

// The company database may live in a tab that isn't literally named
// "COMPANY MASTER" (e.g. "Sheet1" in a hand-made spreadsheet). Resolve by
// name first, then by recognizing the header row; only create as a last resort.
function companyMasterSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName('COMPANY MASTER');
  if (sh) return sh;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    if (s.getName().indexOf('DEMO ') === 0) continue;
    if (s.getLastRow() < 1 || s.getLastColumn() < 2) continue;
    var heads = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(normHeader_);
    if (heads.indexOf('COMPANY ID') !== -1 && heads.indexOf('COMPANY NAME') !== -1) return s;
  }
  return sheet_('COMPANY MASTER');
}

function req_(v, name) {
  v = String(v == null ? '' : v).trim();
  if (!v) throw new Error('Missing required parameter: ' + name);
  return v;
}

function tz_() { return ss_().getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Manila'; }

function nowStr_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss'); }

function dayStr_(d) { return d ? Utilities.formatDate(d, tz_(), 'yyyy-MM-dd') : ''; }

// Parse anything (Date object, 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss', ISO) into a Date or null.
function parseDate_(v) {
  if (v == null || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? null : v;
  var s = String(v).trim();
  if (!s) return null;
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
  }
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Stringify a cell value for JSON output. Dates become yyyy-MM-dd (or with time).
function cellStr_(v) {
  if (v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    var hasTime = v.getHours() || v.getMinutes() || v.getSeconds();
    return Utilities.formatDate(v, tz_(), hasTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd');
  }
  return String(v).trim();
}

// Headers may contain stray line breaks / double spaces in hand-made sheets.
function normHeader_(h) { return String(h).replace(/\s+/g, ' ').trim(); }

// Read a sheet into [{HEADER: value, _row: sheetRowNumber}].
function readAll_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 1) return { headers: [], rows: [] };
  var headers = values[0].map(normHeader_);
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var blank = true;
    var obj = { _row: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      var v = values[i][j];
      obj[headers[j]] = v;
      if (v !== '' && v != null) blank = false;
    }
    if (!blank) rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function appendObj_(sh, obj) {
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(normHeader_);
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
}

function writeObj_(sh, rowNumber, obj) {
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(normHeader_);
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

// Lesson learned: never rely on a single timestamp column name.
function whenOf_(rowObj) {
  return parseDate_(rowObj['TIMESTAMP']) || parseDate_(rowObj['CREATED AT']) || parseDate_(rowObj['DATE LOGGED']) || null;
}

function inRange_(d, fromStr, toStr) {
  if (!d) return false;
  if (fromStr) {
    var f = parseDate_(fromStr);
    if (f && d.getTime() < f.getTime()) return false;
  }
  if (toStr) {
    var t = parseDate_(toStr);
    if (t) {
      var end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59);
      if (d.getTime() > end.getTime()) return false;
    }
  }
  return true;
}

function breadcrumb_(mode, user, type, companyId, companyName, details) {
  var sh = sheet_(modeSheetName_('APP ACTIVITY LOG', mode));
  appendObj_(sh, {
    'TIMESTAMP': nowStr_(), 'USER': user || '', 'ACTIVITY TYPE': type || '',
    'COMPANY ID': companyId || '', 'COMPANY NAME': companyName || '', 'DETAILS': details || ''
  });
}

/* ------------------------------- SETUP --------------------------------- */

function setupSheets() {
  // Keep the spreadsheet's timezone aligned with the script (Asia/Manila) —
  // otherwise every formatted date shifts by a day.
  try { ss_().setSpreadsheetTimeZone('Asia/Manila'); } catch (e) { /* non-fatal */ }
  companyMasterSheet_(); // resolve (or create) the company database tab first
  for (var base in SHEET_HEADERS) {
    if (base !== 'COMPANY MASTER') sheet_(base);
  }
  for (var b in MODE_SPECIFIC) sheet_('DEMO ' + b);
  ensureEventColumns_(sheet_('EVENT MASTER'));
  ensureEventColumns_(sheet_('DEMO EVENT MASTER'));
  seedUsers_();
  seedEventSources_();
  seedEventIndustryMap_();
  return 'Setup complete';
}

function apiSetup_(p) {
  setupSheets();
  return { ok: true, message: 'Sheets created/verified and initial users seeded (default PIN 1111).' };
}

function seedUsers_() {
  var sh = sheet_('USERS');
  if (sh.getLastRow() > 1) return; // never overwrite existing users
  var now = nowStr_();
  var seed = [
    ['ARN', 'Aileen Narciso', '1111', 'MANAGER', 'TRUE', 'TRUE', 'TRUE', now, now],
    ['MRY', 'Miggy Yanquiling', '1111', 'MANAGER', 'TRUE', 'TRUE', 'TRUE', now, now],
    ['BRN', 'Brian Noble', '1111', 'AGENT', 'TRUE', 'TRUE', 'FALSE', now, now],
    ['MGO', 'Magoe Narisma', '1111', 'AGENT', 'TRUE', 'TRUE', 'FALSE', now, now]
  ];
  sh.getRange(2, 1, seed.length, seed[0].length).setValues(seed);
}

/* --------------------------- USERS & LOGIN ----------------------------- */

function findUser_(code) {
  var data = readAll_(sheet_('USERS'));
  code = String(code || '').trim().toUpperCase();
  for (var i = 0; i < data.rows.length; i++) {
    if (String(data.rows[i]['USER CODE']).trim().toUpperCase() === code) return data.rows[i];
  }
  return null;
}

function userJson_(u) {
  return {
    code: cellStr_(u['USER CODE']).toUpperCase(),
    name: cellStr_(u['NAME']),
    role: cellStr_(u['ROLE']).toUpperCase() === 'MANAGER' ? 'MANAGER' : 'AGENT',
    active: String(u['ACTIVE']).toUpperCase() !== 'FALSE',
    canAddEvents: String(u['CAN ADD EVENTS']).toUpperCase() === 'TRUE',
    canSwitchLive: String(u['CAN SWITCH LIVE']).toUpperCase() === 'TRUE'
  };
}

function requireManager_(code) {
  var u = findUser_(req_(code, 'by'));
  if (!u) throw new Error('Unknown user: ' + code);
  var uj = userJson_(u);
  if (!uj.active) throw new Error('User is deactivated: ' + code);
  if (uj.role !== 'MANAGER') throw new Error('Manager permission required for this action.');
  return uj;
}

function apiLogin_(p) {
  var mode = normMode_(p.mode);
  var code = req_(p.code, 'code');
  var pin = req_(p.pin, 'pin');
  var u = findUser_(code);
  if (!u) return { ok: false, error: 'Unknown user code.' };
  var uj = userJson_(u);
  if (!uj.active) return { ok: false, error: 'This account is deactivated. Ask a manager to reactivate it.' };
  if (String(u['PIN']).trim() !== String(pin).trim()) return { ok: false, error: 'Incorrect PIN.' };
  breadcrumb_(mode, uj.code, 'LOGIN', '', '', 'Logged in (' + mode + ' mode)');
  return { ok: true, mode: mode, user: uj };
}

function apiGetUsers_(p) {
  var data = readAll_(sheet_('USERS'));
  var users = data.rows.map(userJson_);
  return { ok: true, count: users.length, sheet: 'USERS', users: users };
}

function apiAddUser_(p) {
  var by = requireManager_(p.by);
  var code = req_(p.code, 'code').toUpperCase();
  if (findUser_(code)) return { ok: false, error: 'User code already exists: ' + code };
  var now = nowStr_();
  appendObj_(sheet_('USERS'), {
    'USER CODE': code, 'NAME': req_(p.name, 'name'), 'PIN': req_(p.pin, 'pin'),
    'ROLE': String(p.role || 'AGENT').toUpperCase() === 'MANAGER' ? 'MANAGER' : 'AGENT',
    'ACTIVE': 'TRUE',
    'CAN ADD EVENTS': String(p.canAddEvents || 'TRUE').toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE',
    'CAN SWITCH LIVE': String(p.canSwitchLive || 'FALSE').toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
    'CREATED AT': now, 'UPDATED AT': now
  });
  breadcrumb_(normMode_(p.mode), by.code, 'USER ADDED', '', '', 'Added user ' + code);
  return { ok: true, message: 'User ' + code + ' added.', sheet: 'USERS' };
}

function updateUserRow_(code, mutate) {
  var sh = sheet_('USERS');
  var data = readAll_(sh);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (String(r['USER CODE']).trim().toUpperCase() === code) {
      mutate(r);
      r['UPDATED AT'] = nowStr_();
      writeObj_(sh, r._row, r);
      return true;
    }
  }
  return false;
}

function apiUpdateUser_(p) {
  var by = requireManager_(p.by);
  var code = req_(p.code, 'code').toUpperCase();
  var found = updateUserRow_(code, function (r) {
    if (p.name !== undefined && p.name !== '') r['NAME'] = p.name;
    if (p.role !== undefined && p.role !== '') r['ROLE'] = String(p.role).toUpperCase() === 'MANAGER' ? 'MANAGER' : 'AGENT';
    if (p.canAddEvents !== undefined && p.canAddEvents !== '') r['CAN ADD EVENTS'] = String(p.canAddEvents).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE';
    if (p.canSwitchLive !== undefined && p.canSwitchLive !== '') r['CAN SWITCH LIVE'] = String(p.canSwitchLive).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE';
  });
  if (!found) return { ok: false, error: 'User not found: ' + code };
  breadcrumb_(normMode_(p.mode), by.code, 'USER UPDATED', '', '', 'Updated user ' + code);
  return { ok: true, message: 'User ' + code + ' updated.' };
}

function apiResetUserPin_(p) {
  var by = requireManager_(p.by);
  var code = req_(p.code, 'code').toUpperCase();
  var pin = req_(p.pin, 'pin');
  var found = updateUserRow_(code, function (r) { r['PIN'] = pin; });
  if (!found) return { ok: false, error: 'User not found: ' + code };
  breadcrumb_(normMode_(p.mode), by.code, 'PIN RESET', '', '', 'Reset PIN for ' + code);
  return { ok: true, message: 'PIN reset for ' + code + '.' };
}

function apiSetUserActive_(p) {
  var by = requireManager_(p.by);
  var code = req_(p.code, 'code').toUpperCase();
  var active = String(p.active).toUpperCase() === 'TRUE';
  var found = updateUserRow_(code, function (r) { r['ACTIVE'] = active ? 'TRUE' : 'FALSE'; });
  if (!found) return { ok: false, error: 'User not found: ' + code };
  breadcrumb_(normMode_(p.mode), by.code, 'USER UPDATED', '', '', (active ? 'Reactivated ' : 'Deactivated ') + code);
  return { ok: true, message: 'User ' + code + (active ? ' reactivated.' : ' deactivated.') };
}

/* ------------------------------ COMPANIES ------------------------------ */
// The live COMPANY MASTER sheet predates this app and uses slightly different
// header names (INDUSTRY, PHONE / MOBILE, EMAIL ADDRESS, ...). Every company
// field therefore resolves through an alias list so both naming styles work.

var COMPANY_FIELD_ALIASES = {
  companyName: ['COMPANY NAME'],
  category: ['INDUSTRY / CATEGORY', 'INDUSTRY', 'CATEGORY'],
  primaryContact: ['PRIMARY CONTACT'],
  title: ['TITLE', 'DEPT / TITLE'],
  phone: ['PHONE', 'PHONE / MOBILE'],
  mobile: ['MOBILE'],
  email: ['EMAIL', 'EMAIL ADDRESS'],
  otherContacts: ['OTHER CONTACTS', 'OTHER CONTACTS & EMAILS'],
  eventsParticipated: ['EVENTS PARTICIPATED'],
  possibleRequirements: ['POSSIBLE REQUIREMENTS']
};

function colVal_(r, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var v = r[aliases[i]];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

function resolveHeader_(headers, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    if (headers.indexOf(aliases[i]) !== -1) return aliases[i];
  }
  return null;
}

function companyJson_(r) {
  return {
    companyId: cellStr_(r['COMPANY ID']),
    companyName: cellStr_(r['COMPANY NAME']),
    category: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.category)),
    primaryContact: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.primaryContact)),
    title: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.title)),
    phone: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.phone)),
    mobile: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.mobile)),
    email: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.email)),
    otherContacts: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.otherContacts)),
    eventsParticipated: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.eventsParticipated)),
    possibleRequirements: cellStr_(colVal_(r, COMPANY_FIELD_ALIASES.possibleRequirements))
  };
}

function apiGetCallQueue_(p) {
  var mode = normMode_(p.mode);
  var user = String(p.user || '').trim().toUpperCase();
  var master = readAll_(companyMasterSheet_());
  var statusData = readAll_(sheet_(modeSheetName_('COMPANY STATUS', mode)));
  var statusById = {};
  statusData.rows.forEach(function (r) { statusById[cellStr_(r['COMPANY ID'])] = r; });

  var myPending = {};
  if (user) {
    readAll_(sheet_(modeSheetName_('DAILY ACTION LIST', mode))).rows.forEach(function (r) {
      if (cellStr_(r['AGENT']).toUpperCase() === user && cellStr_(r['STATUS']).toUpperCase() === 'PENDING') {
        myPending[cellStr_(r['COMPANY ID'])] = true;
      }
    });
  }

  var catSet = {};
  var companies = master.rows.map(function (r) {
    var c = companyJson_(r);
    if (c.category) catSet[c.category] = true;
    var s = statusById[c.companyId];
    c.owner = s ? cellStr_(s['ACCOUNT OWNER']) : '';
    c.accountStatus = s ? cellStr_(s['ACCOUNT STATUS']) : '';
    c.lastResult = s ? cellStr_(s['LATEST CALL RESULT']) : '';
    c.lastCallDate = s ? cellStr_(s['LAST CALL DATE']) : '';
    c.attemptCount = s ? Number(s['ATTEMPT COUNT'] || 0) : 0;
    c.alreadyAdded = !!myPending[c.companyId];
    c.originalPhone = c.phone; // raw cell preserved for reference; never dialed
    return c;
  });
  attachPrimaryPhoneInfoToCompanyRows_(companies);

  return {
    ok: true, count: companies.length, sheet: 'COMPANY MASTER', mode: mode,
    categories: Object.keys(catSet).sort(), companies: companies
  };
}

function apiUpsertCompany_(p) {
  var mode = normMode_(p.mode);
  var by = requireManager_(p.user || p.by);
  var sh = companyMasterSheet_();
  var data = readAll_(sh);
  var params = {
    companyName: p.companyName, category: p.category, primaryContact: p.primaryContact,
    title: p.title, phone: p.phone, mobile: p.mobile, email: p.email,
    otherContacts: p.otherContacts, eventsParticipated: p.eventsParticipated,
    possibleRequirements: p.possibleRequirements
  };
  var companyId = String(p.companyId || '').trim();

  if (!companyId) {
    if (!String(p.companyName || '').trim()) throw new Error('Company name is required.');
    companyId = 'C-' + Date.now();
    var obj = { 'COMPANY ID': companyId };
    for (var f in params) {
      var h = resolveHeader_(data.headers, COMPANY_FIELD_ALIASES[f]);
      if (h && params[f] !== undefined) obj[h] = params[f] || '';
    }
    appendObj_(sh, obj);
    breadcrumb_(mode, by.code, 'COMPANY EDITED', companyId, p.companyName, 'Created new company');
    return { ok: true, message: 'Company added.', companyId: companyId, sheet: 'COMPANY MASTER' };
  }

  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['COMPANY ID']) === companyId) {
      var changes = [];
      for (var f2 in params) {
        if (params[f2] === undefined) continue;
        var h2 = resolveHeader_(data.headers, COMPANY_FIELD_ALIASES[f2]);
        if (!h2) continue; // this sheet has no such column; never invent one
        var oldV = cellStr_(r[h2]);
        var newV = String(params[f2]);
        if (oldV !== newV) {
          changes.push(h2 + ': "' + oldV + '" → "' + newV + '"');
          r[h2] = newV;
        }
      }
      if (changes.length) {
        writeObj_(sh, r._row, r);
        breadcrumb_(mode, by.code, 'COMPANY EDITED', companyId, cellStr_(r['COMPANY NAME']), changes.join(' | '));
      }
      return { ok: true, message: changes.length ? 'Company updated (' + changes.length + ' field(s)).' : 'No changes detected.', companyId: companyId };
    }
  }
  return { ok: false, error: 'Company not found: ' + companyId };
}

/* --------------------------- TARGETS / ACTIONS -------------------------- */

function targetJson_(r) {
  return {
    companyId: cellStr_(r['COMPANY ID']),
    companyName: cellStr_(r['COMPANY NAME']),
    agent: cellStr_(r['AGENT']).toUpperCase(),
    status: cellStr_(r['STATUS']).toUpperCase(),
    attempts: Number(r['ATTEMPTS'] || 0),
    lastResult: cellStr_(r['LAST RESULT']),
    lastCallDate: cellStr_(r['LAST CALL DATE']),
    addedAt: cellStr_(r['TIMESTAMP'])
  };
}

function apiGetDailyActions_(p) {
  var mode = normMode_(p.mode);
  var agent = String(p.agent || '').trim().toUpperCase();
  var rows = readAll_(sheet_(modeSheetName_('DAILY ACTION LIST', mode))).rows.map(targetJson_);
  if (agent && agent !== 'ALL') rows = rows.filter(function (t) { return t.agent === agent; });
  attachPrimaryPhoneInfoToActionRows_(rows);
  return { ok: true, count: rows.length, sheet: modeSheetName_('DAILY ACTION LIST', mode), targets: rows };
}

function apiGetMyActions_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var rows = readAll_(sheet_(modeSheetName_('DAILY ACTION LIST', mode))).rows
    .map(targetJson_)
    .filter(function (t) { return t.agent === user && t.status === 'PENDING'; });
  attachPrimaryPhoneInfoToActionRows_(rows);
  return { ok: true, count: rows.length, sheet: modeSheetName_('DAILY ACTION LIST', mode), targets: rows };
}

function apiAddTarget_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var companyId = req_(p.companyId, 'companyId');
  var sh = sheet_(modeSheetName_('DAILY ACTION LIST', mode));
  var data = readAll_(sh);
  var companyName = String(p.companyName || '').trim();

  if (!companyName) {
    var master = readAll_(companyMasterSheet_());
    for (var m = 0; m < master.rows.length; m++) {
      if (cellStr_(master.rows[m]['COMPANY ID']) === companyId) { companyName = cellStr_(master.rows[m]['COMPANY NAME']); break; }
    }
  }
  if (!companyName) return { ok: false, error: 'Company not found in COMPANY MASTER: ' + companyId };

  var existing = null;
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['COMPANY ID']) === companyId && cellStr_(r['AGENT']).toUpperCase() === user) {
      if (cellStr_(r['STATUS']).toUpperCase() === 'PENDING') {
        return { ok: false, error: 'Already in your target list.', alreadyAdded: true };
      }
      existing = r;
    }
  }

  if (existing) {
    // Reactivate the old row instead of duplicating it.
    existing['STATUS'] = 'PENDING';
    existing['ATTEMPTS'] = 0;
    existing['TIMESTAMP'] = nowStr_();
    writeObj_(sh, existing._row, existing);
  } else {
    appendObj_(sh, {
      'TIMESTAMP': nowStr_(), 'COMPANY ID': companyId, 'COMPANY NAME': companyName,
      'AGENT': user, 'STATUS': 'PENDING', 'ATTEMPTS': 0, 'LAST RESULT': '', 'LAST CALL DATE': ''
    });
  }
  breadcrumb_(mode, user, 'TARGET ADDED', companyId, companyName, 'Added to target list');
  return { ok: true, message: companyName + ' added to your target list.', sheet: sh.getName() };
}

function apiRemoveTarget_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var companyId = req_(p.companyId, 'companyId');
  var sh = sheet_(modeSheetName_('DAILY ACTION LIST', mode));
  var data = readAll_(sh);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['COMPANY ID']) === companyId &&
        cellStr_(r['AGENT']).toUpperCase() === user &&
        cellStr_(r['STATUS']).toUpperCase() === 'PENDING') {
      r['STATUS'] = 'REMOVED';
      writeObj_(sh, r._row, r);
      breadcrumb_(mode, user, 'TARGET REMOVED', companyId, cellStr_(r['COMPANY NAME']), 'Removed from target list');
      return { ok: true, message: 'Target removed.' };
    }
  }
  return { ok: false, error: 'Target not found in your pending list.' };
}

/* ----------------------------- CALL LOGGING ----------------------------- */

function callRows_(mode) {
  var rows = readAll_(sheet_(modeSheetName_('CALL LOG', mode))).rows;
  return rows.map(function (r) {
    var when = whenOf_(r);
    return {
      when: when,
      timestamp: when ? Utilities.formatDate(when, tz_(), 'yyyy-MM-dd HH:mm:ss') : cellStr_(r['TIMESTAMP']),
      day: when ? dayStr_(when) : '',
      callId: cellStr_(r['CALL ID']),
      companyId: cellStr_(r['COMPANY ID']),
      companyName: cellStr_(r['COMPANY NAME']),
      agent: cellStr_(r['AGENT']).toUpperCase(),
      result: cellStr_(r['CALL RESULT']).toUpperCase(),
      followUpDate: cellStr_(r['FOLLOW UP DATE']),
      clientEventName: cellStr_(r['CLIENT EVENT NAME']),
      clientEventDate: cellStr_(r['CLIENT EVENT DATE']),
      notes: cellStr_(r['NOTES'])
    };
  }).filter(function (c) { return c.companyId || c.companyName; });
}

function stripWhen_(c) {
  var o = {};
  for (var k in c) { if (k !== 'when') o[k] = c[k]; }
  return o;
}

function apiLogCall_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var companyId = req_(p.companyId, 'companyId');
  var result = req_(p.result, 'result').toUpperCase();
  if (CALL_RESULTS.indexOf(result) === -1) {
    return { ok: false, error: 'Invalid call result: ' + result, validResults: CALL_RESULTS };
  }
  var companyName = String(p.companyName || '').trim();
  var followUpDate = String(p.followUpDate || '').trim();
  var clientEventName = String(p.clientEventName || '').trim();
  var clientEventDate = String(p.clientEventDate || '').trim();
  var notes = String(p.notes || '').trim();

  if (!companyName) {
    var master = readAll_(companyMasterSheet_());
    for (var m = 0; m < master.rows.length; m++) {
      if (cellStr_(master.rows[m]['COMPANY ID']) === companyId) { companyName = cellStr_(master.rows[m]['COMPANY NAME']); break; }
    }
  }

  // 1) Append to CALL LOG (history is always preserved).
  var callId = 'CL-' + Date.now();
  appendObj_(sheet_(modeSheetName_('CALL LOG', mode)), {
    'TIMESTAMP': nowStr_(), 'CALL ID': callId, 'COMPANY ID': companyId, 'COMPANY NAME': companyName,
    'AGENT': user, 'CALL RESULT': result, 'FOLLOW UP DATE': followUpDate,
    'CLIENT EVENT NAME': clientEventName, 'CLIENT EVENT DATE': clientEventDate, 'NOTES': notes
  });

  // 2) Update the agent's DAILY ACTION LIST row (if this company is targeted).
  var actSh = sheet_(modeSheetName_('DAILY ACTION LIST', mode));
  var actData = readAll_(actSh);
  for (var i = 0; i < actData.rows.length; i++) {
    var r = actData.rows[i];
    if (cellStr_(r['COMPANY ID']) === companyId &&
        cellStr_(r['AGENT']).toUpperCase() === user &&
        cellStr_(r['STATUS']).toUpperCase() === 'PENDING') {
      var attempts = Number(r['ATTEMPTS'] || 0) + 1;
      r['ATTEMPTS'] = attempts;
      r['LAST RESULT'] = result;
      r['LAST CALL DATE'] = nowStr_();
      if (RETRY_RESULTS[result] && attempts < MAX_ATTEMPTS) {
        r['STATUS'] = 'PENDING';   // stays in the list for another try
      } else {
        r['STATUS'] = 'DONE';      // contacted, closed, or retry cap reached
      }
      writeObj_(actSh, r._row, r);
      break;
    }
  }

  // 3) Upsert COMPANY STATUS.
  updateCompanyStatus_(mode, user, companyId, companyName, result, followUpDate, clientEventName, clientEventDate);

  // 4) Breadcrumb.
  breadcrumb_(mode, user, 'CALL LOGGED', companyId, companyName,
    result + (followUpDate ? ' | follow-up ' + followUpDate : '') + (clientEventName ? ' | event: ' + clientEventName : ''));

  return { ok: true, message: 'Call logged.', callId: callId, sheet: modeSheetName_('CALL LOG', mode) };
}

function updateCompanyStatus_(mode, user, companyId, companyName, result, followUpDate, clientEventName, clientEventDate) {
  var sh = sheet_(modeSheetName_('COMPANY STATUS', mode));
  var data = readAll_(sh);
  var row = null;
  for (var i = 0; i < data.rows.length; i++) {
    if (cellStr_(data.rows[i]['COMPANY ID']) === companyId) { row = data.rows[i]; break; }
  }
  var now = nowStr_();
  var isNew = !row;
  if (isNew) {
    row = { 'COMPANY ID': companyId, 'COMPANY NAME': companyName, 'ACCOUNT OWNER': '', 'ATTEMPT COUNT': 0, 'FOLLOW-UP COUNT': 0, 'OWNERSHIP DATE': '' };
  }

  var attempts = Number(row['ATTEMPT COUNT'] || 0) + 1;
  row['COMPANY NAME'] = companyName || cellStr_(row['COMPANY NAME']);
  row['LATEST CALL RESULT'] = result;
  row['LAST CALL DATE'] = now;
  row['LAST CALLED BY'] = user;
  row['ATTEMPT COUNT'] = attempts;
  row['LAST UPDATED BY'] = user;
  row['LAST UPDATED AT'] = now;
  if (followUpDate) {
    row['LATEST NEXT ACTION'] = 'FOLLOW UP';
    row['LATEST DEADLINE'] = followUpDate;
  } else if (FOLLOWUP_RESULTS[result]) {
    row['LATEST NEXT ACTION'] = 'SET FOLLOW-UP DATE';
    row['LATEST DEADLINE'] = '';
  } else if (RETRY_RESULTS[result]) {
    row['LATEST NEXT ACTION'] = 'RETRY CALL';
  } else if (MEETING_RESULTS[result]) {
    row['LATEST NEXT ACTION'] = 'PREPARE FOR MEETING';
  } else {
    row['LATEST NEXT ACTION'] = '';
    row['LATEST DEADLINE'] = '';
  }
  if (clientEventName) row['LATEST CLIENT EVENT NAME'] = clientEventName;
  if (clientEventDate) row['LATEST CLIENT EVENT DATE'] = clientEventDate;
  if (FOLLOWUP_RESULTS[result] || followUpDate) {
    row['FOLLOW-UP COUNT'] = Number(row['FOLLOW-UP COUNT'] || 0) + 1;
  }

  // Ownership: first meaningful result claims the account.
  if (MEANINGFUL_RESULTS[result] && !cellStr_(row['ACCOUNT OWNER'])) {
    row['ACCOUNT OWNER'] = user;
    row['OWNERSHIP DATE'] = now;
  }

  // Account status derivation.
  if (MEETING_RESULTS[result]) row['ACCOUNT STATUS'] = 'MEETING SET';
  else if (result === 'BIDDING REQUIREMENT') row['ACCOUNT STATUS'] = 'BID OPPORTUNITY';
  else if (FOLLOWUP_RESULTS[result]) row['ACCOUNT STATUS'] = 'FOLLOW-UP';
  else if (CLOSED_RESULTS[result]) row['ACCOUNT STATUS'] = 'CLOSED';
  else if (RETRY_RESULTS[result]) row['ACCOUNT STATUS'] = attempts >= MAX_ATTEMPTS ? 'RESEARCH NEEDED' : 'RETRY';

  if (isNew) appendObj_(sh, row);
  else writeObj_(sh, row._row, row);
}

function apiGetCallHistory_(p) {
  var mode = normMode_(p.mode);
  var companyId = req_(p.companyId, 'companyId');
  var history = callRows_(mode)
    .filter(function (c) { return c.companyId === companyId; })
    .sort(function (a, b) { return (b.when ? b.when.getTime() : 0) - (a.when ? a.when.getTime() : 0); })
    .map(stripWhen_);
  attachPrimaryPhoneInfoToCallRows_(history);
  return { ok: true, count: history.length, sheet: modeSheetName_('CALL LOG', mode), history: history };
}

/* --------------------------- FOLLOW-UP ENGINE --------------------------- */
// Single source of truth used by BOTH the agent dashboard and tabs, and the
// manager dashboard — so counts always match the detail lists.

function latestByCompany_(calls) {
  var map = {};
  calls.forEach(function (c) {
    var key = c.companyId || c.companyName;
    var t = c.when ? c.when.getTime() : 0;
    if (!map[key] || t >= map[key]._t) {
      c._t = t;
      map[key] = c;
    }
  });
  var out = [];
  for (var k in map) out.push(map[k]);
  return out;
}

function followupRow_(c) {
  var needsDate = !c.followUpDate;
  var dueState = 'needs-date';
  if (!needsDate) {
    var fu = parseDate_(c.followUpDate);
    var today = dayStr_(new Date());
    var fuDay = fu ? dayStr_(fu) : '';
    if (fuDay && fuDay < today) dueState = 'overdue';
    else if (fuDay === today) dueState = 'due-today';
    else dueState = 'upcoming';
  }
  return {
    companyId: c.companyId, companyName: c.companyName, agent: c.agent, result: c.result,
    loggedAt: c.timestamp, followUpDate: c.followUpDate, needsDate: needsDate, dueState: dueState,
    clientEventName: c.clientEventName, clientEventDate: c.clientEventDate, notes: c.notes
  };
}

// Open follow-ups: latest call per company that is follow-up-worthy
// (the four pipeline results, even with no date) OR any non-closed result
// that has a follow-up date saved.
function openFollowUps_(calls, agent) {
  var pool = agent ? calls.filter(function (c) { return c.agent === agent; }) : calls;
  return latestByCompany_(pool)
    .filter(function (c) {
      if (CLOSED_RESULTS[c.result]) return false;
      return FOLLOWUP_RESULTS[c.result] || !!c.followUpDate;
    })
    .map(followupRow_)
    .sort(function (a, b) {
      if (a.needsDate !== b.needsDate) return a.needsDate ? -1 : 1;
      return String(a.followUpDate).localeCompare(String(b.followUpDate));
    });
}

function openMeetings_(calls, agent) {
  var pool = agent ? calls.filter(function (c) { return c.agent === agent; }) : calls;
  return latestByCompany_(pool)
    .filter(function (c) { return MEETING_RESULTS[c.result]; })
    .map(followupRow_);
}

/* --------------------------- AGENT DASHBOARD ---------------------------- */

function apiAgentDashboard_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();

  var targets = readAll_(sheet_(modeSheetName_('DAILY ACTION LIST', mode))).rows
    .map(targetJson_)
    .filter(function (t) { return t.agent === user && t.status === 'PENDING'; });

  var calls = callRows_(mode);
  var myCalls = calls.filter(function (c) { return c.agent === user; });
  var today = dayStr_(new Date());
  var todayCalls = myCalls.filter(function (c) { return c.day === today; }).map(stripWhen_);

  var followups = openFollowUps_(calls, user);
  var meetings = openMeetings_(calls, user);
  var needsAction = targets.filter(function (t) {
    return t.attempts > 0 && RETRY_RESULTS[(t.lastResult || '').toUpperCase()];
  });

  attachPrimaryPhoneInfoToActionRows_(targets);
  attachPrimaryPhoneInfoToActionRows_(needsAction);
  attachPrimaryPhoneInfoToCallRows_(followups);
  attachPrimaryPhoneInfoToCallRows_(meetings);
  attachPrimaryPhoneInfoToCallRows_(todayCalls);

  var completedToday = todayCalls.length;
  return {
    ok: true, user: user, mode: mode,
    counts: {
      targets: targets.length,
      followups: followups.length,
      meetings: meetings.length,
      needsAction: needsAction.length,
      dailyTarget: DAILY_TARGET,
      completedToday: completedToday,
      remainingToday: Math.max(0, DAILY_TARGET - completedToday),
      callsLogged: myCalls.length
    },
    targets: targets,
    followups: followups,
    meetings: meetings,
    needsAction: needsAction,
    todayCalls: todayCalls
  };
}

/* --------------------------- MANAGER REPORTS ---------------------------- */

function agentStatsFromCalls_(calls, lastActivityByAgent) {
  var byAgent = {};
  calls.forEach(function (c) {
    var a = c.agent || '?';
    if (!byAgent[a]) {
      byAgent[a] = { agent: a, calls: 0, meaningful: 0, followups: 0, meetings: 0, bids: 0, profilesSent: 0, retryCases: 0, lastActivity: '' };
    }
    var s = byAgent[a];
    s.calls++;
    if (MEANINGFUL_RESULTS[c.result]) s.meaningful++;
    if (FOLLOWUP_RESULTS[c.result] || c.followUpDate) s.followups++;
    if (MEETING_RESULTS[c.result]) s.meetings++;
    if (c.result === 'BIDDING REQUIREMENT') s.bids++;
    if (c.result === 'COMPANY PROFILE SENT') s.profilesSent++;
    if (RETRY_RESULTS[c.result]) s.retryCases++;
    if (c.timestamp > s.lastActivity) s.lastActivity = c.timestamp;
  });
  var out = [];
  for (var a in byAgent) {
    var s = byAgent[a];
    s.conversion = s.calls ? Math.round((s.meaningful / s.calls) * 100) : 0;
    if (lastActivityByAgent && lastActivityByAgent[a] && lastActivityByAgent[a] > s.lastActivity) {
      s.lastActivity = lastActivityByAgent[a];
    }
    out.push(s);
  }
  return out.sort(function (x, y) { return y.calls - x.calls; });
}

function apiManagerDashboard_(p) {
  var mode = normMode_(p.mode);
  var from = String(p.fromDate || '').trim();
  var to = String(p.toDate || '').trim();
  var agent = String(p.agent || '').trim().toUpperCase();
  if (agent === 'ALL') agent = '';

  var allCalls = callRows_(mode);
  var agentCalls = agent ? allCalls.filter(function (c) { return c.agent === agent; }) : allCalls;
  var ranged = agentCalls.filter(function (c) { return (!from && !to) ? true : inRange_(c.when, from, to); });

  var lists = {
    calls: ranged.map(stripWhen_),
    meaningful: ranged.filter(function (c) { return MEANINGFUL_RESULTS[c.result]; }).map(stripWhen_),
    bids: ranged.filter(function (c) { return c.result === 'BIDDING REQUIREMENT'; }).map(stripWhen_),
    meetings: ranged.filter(function (c) { return MEETING_RESULTS[c.result]; }).map(stripWhen_),
    profilesSent: ranged.filter(function (c) { return c.result === 'COMPANY PROFILE SENT'; }).map(stripWhen_),
    eventsFound: ranged.filter(function (c) { return c.result === 'EVENT IDENTIFIED'; }).map(stripWhen_),
    retryCases: ranged.filter(function (c) { return RETRY_RESULTS[c.result]; }).map(stripWhen_),
    // Follow-ups due: open follow-ups (latest state, not range-bound) that are
    // overdue, due, or still need a date.
    followupsDue: openFollowUps_(allCalls, agent || null).filter(function (f) {
      return f.needsDate || f.dueState === 'overdue' || f.dueState === 'due-today' ||
        (to && f.followUpDate && f.followUpDate <= to);
    })
  };

  var kpis = {
    callsLogged: lists.calls.length,
    meaningful: lists.meaningful.length,
    bids: lists.bids.length,
    followupsDue: lists.followupsDue.length,
    meetings: lists.meetings.length,
    profilesSent: lists.profilesSent.length,
    eventsFound: lists.eventsFound.length,
    retryCases: lists.retryCases.length
  };

  // Last activity per agent also considers the activity log.
  var lastAct = {};
  readAll_(sheet_(modeSheetName_('APP ACTIVITY LOG', mode))).rows.forEach(function (r) {
    var u = cellStr_(r['USER']).toUpperCase();
    var ts = cellStr_(r['TIMESTAMP']);
    if (u && (!lastAct[u] || ts > lastAct[u])) lastAct[u] = ts;
  });

  for (var lk in lists) attachPrimaryPhoneInfoToCallRows_(lists[lk]);

  var snapshot = agentStatsFromCalls_(ranged, lastAct);
  var attention = computeAttention_(mode, agent || null);
  attachPrimaryPhoneInfoToCallRows_(attention);

  var insights = [];
  if (kpis.callsLogged === 0) {
    insights.push('No calls logged in this range yet.');
  } else {
    var conv = Math.round((kpis.meaningful / kpis.callsLogged) * 100);
    insights.push(kpis.callsLogged + ' calls logged with ' + kpis.meaningful + ' meaningful conversations (' + conv + '% conversion).');
    if (snapshot.length) insights.push('Most active: ' + snapshot[0].agent + ' with ' + snapshot[0].calls + ' calls.');
    if (kpis.bids) insights.push(kpis.bids + ' proposal/bid opportunity(ies) need manager review.');
    if (kpis.meetings) insights.push(kpis.meetings + ' meeting(s) set in this range.');
  }
  var needDates = lists.followupsDue.filter(function (f) { return f.needsDate; }).length;
  if (needDates) insights.push(needDates + ' follow-up(s) still need a follow-up date.');

  return {
    ok: true, mode: mode, range: { from: from, to: to, agent: agent || 'ALL' },
    kpis: kpis, lists: lists, snapshot: snapshot, attention: attention, insights: insights
  };
}

function apiAgentPerformance_(p) {
  var mode = normMode_(p.mode);
  var from = String(p.fromDate || '').trim();
  var to = String(p.toDate || '').trim();
  var agent = String(p.agent || '').trim().toUpperCase();
  if (agent === 'ALL') agent = '';

  var calls = callRows_(mode).filter(function (c) {
    if (agent && c.agent !== agent) return false;
    return (!from && !to) ? true : inRange_(c.when, from, to);
  });

  var lastAct = {};
  readAll_(sheet_(modeSheetName_('APP ACTIVITY LOG', mode))).rows.forEach(function (r) {
    var u = cellStr_(r['USER']).toUpperCase();
    var ts = cellStr_(r['TIMESTAMP']);
    if (u && (!lastAct[u] || ts > lastAct[u])) lastAct[u] = ts;
  });

  var names = {};
  readAll_(sheet_('USERS')).rows.forEach(function (r) { names[cellStr_(r['USER CODE']).toUpperCase()] = cellStr_(r['NAME']); });

  var stats = agentStatsFromCalls_(calls, lastAct).map(function (s) {
    s.name = names[s.agent] || s.agent;
    // Quality score: conversion (60% weight) + pipeline depth bonus, capped 100.
    var bonus = Math.min(40, s.meetings * 8 + s.bids * 6 + s.profilesSent * 2);
    s.qualityScore = Math.min(100, Math.round(s.conversion * 0.6 + bonus));
    return s;
  });

  return { ok: true, mode: mode, range: { from: from, to: to, agent: agent || 'ALL' }, count: stats.length, agents: stats };
}

/* ------------------------------ WORK TRAIL ------------------------------ */

var TRAIL_TYPE_FILTERS = {
  'all': null,
  'calls': { 'CALL LOGGED': 1 },
  'targets_added': { 'TARGET ADDED': 1 },
  'targets_removed': { 'TARGET REMOVED': 1 },
  'company_edits': { 'COMPANY EDITED': 1 },
  'events': { 'EVENT ADDED': 1, 'EVENT UPDATED': 1, 'EVENT DELETED': 1 },
  'users': { 'USER ADDED': 1, 'USER UPDATED': 1, 'PIN RESET': 1 },
  'app': { 'LOGIN': 1, 'MODE SWITCH': 1, 'DEMO RESET': 1 }
};

function apiWorkTrail_(p) {
  var mode = normMode_(p.mode);
  var from = String(p.fromDate || '').trim();
  var to = String(p.toDate || '').trim();
  var user = String(p.user || p.agent || '').trim().toUpperCase();
  if (user === 'ALL') user = '';
  var typeKey = String(p.type || 'all').trim().toLowerCase();
  var typeSet = TRAIL_TYPE_FILTERS.hasOwnProperty(typeKey) ? TRAIL_TYPE_FILTERS[typeKey] : null;

  var entries = [];

  // Source 1: APP ACTIVITY LOG (skip CALL LOGGED breadcrumbs — the call log
  // itself is the authoritative source and we'd double-count).
  readAll_(sheet_(modeSheetName_('APP ACTIVITY LOG', mode))).rows.forEach(function (r) {
    var type = cellStr_(r['ACTIVITY TYPE']).toUpperCase();
    if (type === 'CALL LOGGED') return;
    var when = whenOf_(r);
    entries.push({
      when: when, timestamp: cellStr_(r['TIMESTAMP']),
      agent: cellStr_(r['USER']).toUpperCase(), type: type,
      companyId: cellStr_(r['COMPANY ID']), company: cellStr_(r['COMPANY NAME']),
      details: cellStr_(r['DETAILS']), source: 'Activity Log'
    });
  });

  // Source 2: CALL LOG — Work Trail is never empty if calls exist.
  callRows_(mode).forEach(function (c) {
    entries.push({
      when: c.when, timestamp: c.timestamp, agent: c.agent, type: 'CALL LOGGED',
      companyId: c.companyId, company: c.companyName,
      details: c.result + (c.followUpDate ? ' | follow-up ' + c.followUpDate : '') + (c.notes ? ' | ' + c.notes : ''),
      source: 'Call Log'
    });
  });

  entries = entries.filter(function (en) {
    if (user && en.agent !== user) return false;
    if (typeSet && !typeSet[en.type]) return false;
    if ((from || to) && !inRange_(en.when, from, to)) return false;
    return true;
  });
  entries.sort(function (a, b) { return (b.when ? b.when.getTime() : 0) - (a.when ? a.when.getTime() : 0); });
  entries = entries.map(stripWhen_);

  return { ok: true, count: entries.length, mode: mode, entries: entries };
}

/* --------------------------- MANAGER ATTENTION -------------------------- */

function computeAttention_(mode, agent) {
  var calls = callRows_(mode);
  if (agent) calls = calls.filter(function (c) { return c.agent === agent; });
  var latest = latestByCompany_(calls);
  var today = dayStr_(new Date());
  var soonLimit = new Date();
  soonLimit.setDate(soonLimit.getDate() + EVENT_SOON_DAYS);
  var soonStr = dayStr_(soonLimit);

  var statusById = {};
  readAll_(sheet_(modeSheetName_('COMPANY STATUS', mode))).rows.forEach(function (r) {
    statusById[cellStr_(r['COMPANY ID'])] = r;
  });

  var items = {};
  function add(priority, reason, c) {
    var key = c.companyId || c.companyName;
    if (items[key] && items[key].priority <= priority) return; // keep highest priority per company
    items[key] = {
      priority: priority, reason: reason,
      companyId: c.companyId, companyName: c.companyName, agent: c.agent,
      result: c.result, followUpDate: c.followUpDate || '',
      clientEventName: c.clientEventName || '', clientEventDate: c.clientEventDate || '',
      lastCallDate: c.timestamp, notes: c.notes || ''
    };
  }

  latest.forEach(function (c) {
    if (c.result === 'BIDDING REQUIREMENT') add(1, 'Bidding requirement', c);
    if (c.result === 'PROJECT BRIEFING MEETING SET') add(2, 'Project briefing meeting set', c);
    if (c.result === 'COMPANY PROFILE MEETING SET') add(3, 'Company profile meeting set', c);
    if (c.followUpDate && !CLOSED_RESULTS[c.result]) {
      var fu = dayStr_(parseDate_(c.followUpDate) || new Date(0));
      if (fu && fu <= today) add(4, fu < today ? 'Overdue follow-up (' + fu + ')' : 'Follow-up due today', c);
    }
    if (c.clientEventDate) {
      var ev = dayStr_(parseDate_(c.clientEventDate) || new Date(0));
      if (ev && ev >= today && ev <= soonStr) add(5, 'Client event soon: ' + (c.clientEventName || 'event') + ' (' + ev + ')', c);
    }
    if (RETRY_RESULTS[c.result]) {
      var st = statusById[c.companyId];
      var att = st ? Number(st['ATTEMPT COUNT'] || 0) : 0;
      if (att >= MAX_ATTEMPTS) add(6, 'No contact after ' + att + ' attempts — research needed', c);
    }
  });

  var out = [];
  for (var k in items) out.push(items[k]);
  out.sort(function (a, b) { return a.priority - b.priority || String(a.followUpDate).localeCompare(String(b.followUpDate)); });
  return out;
}

function apiManagerAttentionRoute_(p) {
  var mode = normMode_(p.mode);
  var agent = String(p.agent || '').trim().toUpperCase();
  if (agent === 'ALL') agent = '';
  var items = computeAttention_(mode, agent || null);
  return { ok: true, count: items.length, mode: mode, items: items };
}

/* -------------------------------- EVENTS -------------------------------- */

function eventJson_(r) {
  var start = parseDate_(r['START DATE']);
  var days = '';
  if (start) {
    days = Math.ceil((start.getTime() - new Date().getTime()) / 86400000);
  }
  var ev = {
    eventId: cellStr_(r['EVENT ID']),
    eventName: cellStr_(r['EVENT NAME']),
    category: cellStr_(r['CATEGORY']),
    startDate: cellStr_(r['START DATE']),
    endDate: cellStr_(r['END DATE']),
    venue: cellStr_(r['VENUE']),
    organizer: cellStr_(r['ORGANIZER']),
    source: cellStr_(r['SOURCE']),
    sourceUrl: cellStr_(r['SOURCE URL']),
    targetIndustry: cellStr_(r['TARGET INDUSTRY']),
    possibleRequirements: cellStr_(r['POSSIBLE REQUIREMENTS']),
    leadStatus: cellStr_(r['LEAD STATUS']),
    prospectingStartDate: cellStr_(r['PROSPECTING START DATE']),
    prospectingStatus: cellStr_(r['PROSPECTING STATUS']),
    daysUntilEvent: days,
    notes: cellStr_(r['NOTES']),
    createdBy: cellStr_(r['CREATED BY']),
    createdAt: cellStr_(r['CREATED AT']),
    updatedBy: cellStr_(r['UPDATED BY']),
    updatedAt: cellStr_(r['UPDATED AT']),
    deleted: String(r['DELETED']).toUpperCase() === 'TRUE',
    eventType: cellStr_(r['EVENT TYPE']),
    city: cellStr_(r['CITY']),
    publicListingText: cellStr_(r['PUBLIC LISTING TEXT']),
    prospectingAngle: cellStr_(r['PROSPECTING ANGLE']),
    suggestedTargetCompanies: cellStr_(r['SUGGESTED TARGET COMPANIES']),
    reviewStatus: cellStr_(r['REVIEW STATUS']).toUpperCase(),
    confidenceLevel: cellStr_(r['CONFIDENCE LEVEL']).toUpperCase(),
    dateFound: cellStr_(r['DATE FOUND']),
    lastChecked: cellStr_(r['LAST CHECKED'])
  };
  ev.opportunityScore = eventOpportunityScore_(ev);
  ev.priority = ev.opportunityScore >= 70 ? 'HIGH' : (ev.opportunityScore >= 40 ? 'MEDIUM' : 'LOW');
  return ev;
}

function apiGetEvents_(p) {
  var mode = normMode_(p.mode);
  var search = String(p.search || '').trim().toLowerCase();
  var category = String(p.category || '').trim().toLowerCase();
  var venue = String(p.venue || '').trim().toLowerCase();
  var range = String(p.range || 'all').trim().toLowerCase();
  if (range === 'allfuture' || range === 'all published future events' || range === '') range = 'all';
  if (range === '6months' || range === '6mo') range = '180';
  var fLeadStatus = String(p.leadStatus || '').trim().toUpperCase();
  var fReviewStatus = String(p.reviewStatus || '').trim().toUpperCase();
  var fEventType = String(p.eventType || '').trim().toLowerCase();
  var fSource = String(p.source || '').trim().toLowerCase();
  var fIndustry = String(p.industryCategory || '').trim().toLowerCase();
  if (fIndustry) category = fIndustry; // alias: industryCategory == category

  var rangeDays = { '30': 30, '90': 90, '180': 180, '365': 365, '540': 540, '730': 730 };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var limit = null;
  if (rangeDays[range]) {
    limit = new Date(today.getTime());
    limit.setDate(limit.getDate() + rangeDays[range]);
  }

  var evSheet = sheet_(modeSheetName_('EVENT MASTER', mode));
  ensureEventColumns_(evSheet);
  var rows = readAll_(evSheet).rows.map(eventJson_)
    .filter(function (ev) { return !ev.deleted && ev.eventId; });

  var catSet = {}, venueSet = {};
  rows.forEach(function (ev) {
    if (ev.category) catSet[ev.category] = true;
    if (ev.venue) venueSet[ev.venue] = true;
  });

  var events = rows.filter(function (ev) {
    var start = parseDate_(ev.startDate);
    var end = parseDate_(ev.endDate) || start;
    // Future events only (an event still running today counts).
    if (end && end.getTime() < today.getTime()) return false;
    if (limit && (!start || start.getTime() > limit.getTime())) return false;
    if (category && ev.category.toLowerCase() !== category) return false;
    if (venue && ev.venue.toLowerCase() !== venue) return false;
    if (fEventType && ev.eventType.toLowerCase().indexOf(fEventType) === -1) return false;
    if (fSource && (ev.source + ' ' + ev.sourceUrl).toLowerCase().indexOf(fSource) === -1) return false;
    if (fLeadStatus && ev.leadStatus.toUpperCase() !== fLeadStatus) return false;
    if (fReviewStatus && ev.reviewStatus !== fReviewStatus) return false;
    // Unless explicitly asked for, hide rejected/duplicate finder leads.
    if (!fLeadStatus && !fReviewStatus) {
      var ls = ev.leadStatus.toUpperCase();
      if (ls === 'NOT RELEVANT' || ls === 'DUPLICATE') return false;
      if (ev.reviewStatus === 'REJECTED' || ev.reviewStatus === 'DUPLICATE') return false;
    }
    if (search) {
      var hay = (ev.eventName + ' ' + ev.category + ' ' + ev.venue + ' ' + ev.organizer + ' ' + ev.targetIndustry + ' ' + ev.notes).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  }).sort(function (a, b) { return String(a.startDate).localeCompare(String(b.startDate)); });

  return {
    ok: true, count: events.length, mode: mode, sheet: modeSheetName_('EVENT MASTER', mode),
    categories: Object.keys(catSet).sort(), venues: Object.keys(venueSet).sort(), events: events
  };
}

function apiUpsertEvent_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var sh = sheet_(modeSheetName_('EVENT MASTER', mode));
  var now = nowStr_();
  var eventId = String(p.eventId || '').trim();
  ensureEventColumns_(sh);
  var fields = {
    'EVENT NAME': p.eventName, 'CATEGORY': p.category, 'START DATE': p.startDate, 'END DATE': p.endDate,
    'VENUE': p.venue, 'ORGANIZER': p.organizer, 'SOURCE': p.source, 'SOURCE URL': p.sourceUrl,
    'TARGET INDUSTRY': p.targetIndustry, 'POSSIBLE REQUIREMENTS': p.possibleRequirements,
    'LEAD STATUS': p.leadStatus, 'PROSPECTING START DATE': p.prospectingStartDate,
    'PROSPECTING STATUS': p.prospectingStatus, 'NOTES': p.notes,
    'EVENT TYPE': p.eventType, 'CITY': p.city, 'PUBLIC LISTING TEXT': p.publicListingText,
    'PROSPECTING ANGLE': p.prospectingAngle, 'SUGGESTED TARGET COMPANIES': p.suggestedTargetCompanies,
    'REVIEW STATUS': p.reviewStatus, 'CONFIDENCE LEVEL': p.confidenceLevel
  };

  if (!eventId) {
    if (!String(p.eventName || '').trim()) throw new Error('Event name is required.');
    eventId = 'EV-' + Date.now();
    var obj = { 'EVENT ID': eventId, 'CREATED BY': user, 'CREATED AT': now, 'UPDATED BY': user, 'UPDATED AT': now, 'DELETED': 'FALSE',
                'DATE FOUND': now, 'LAST CHECKED': now };
    for (var h in fields) obj[h] = fields[h] || '';
    appendObj_(sh, obj);
    breadcrumb_(mode, user, 'EVENT ADDED', '', p.eventName, 'Event lead added (' + eventId + ')');
    return { ok: true, message: 'Event lead saved.', eventId: eventId, sheet: sh.getName() };
  }

  var data = readAll_(sh);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['EVENT ID']) === eventId) {
      for (var f in fields) { if (fields[f] !== undefined) r[f] = fields[f]; }
      r['UPDATED BY'] = user;
      r['UPDATED AT'] = now;
      writeObj_(sh, r._row, r);
      breadcrumb_(mode, user, 'EVENT UPDATED', '', cellStr_(r['EVENT NAME']), 'Event lead updated (' + eventId + ')');
      return { ok: true, message: 'Event lead updated.', eventId: eventId, sheet: sh.getName() };
    }
  }
  return { ok: false, error: 'Event not found: ' + eventId };
}

function apiDeleteEvent_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var eventId = req_(p.eventId, 'eventId');
  var sh = sheet_(modeSheetName_('EVENT MASTER', mode));
  var data = readAll_(sh);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['EVENT ID']) === eventId) {
      r['DELETED'] = 'TRUE';   // soft delete only — row is never physically removed
      r['UPDATED BY'] = user;
      r['UPDATED AT'] = nowStr_();
      writeObj_(sh, r._row, r);
      breadcrumb_(mode, user, 'EVENT DELETED', '', cellStr_(r['EVENT NAME']), 'Event lead soft-deleted (' + eventId + ')');
      return { ok: true, message: 'Event deleted (soft delete).', eventId: eventId };
    }
  }
  return { ok: false, error: 'Event not found: ' + eventId };
}

/* ------------------------------- ACTIVITY ------------------------------- */

function apiLogBreadcrumb_(p) {
  var mode = normMode_(p.mode);
  var user = req_(p.user, 'user').toUpperCase();
  var type = req_(p.type, 'type').toUpperCase();
  breadcrumb_(mode, user, type, p.companyId || '', p.companyName || '', p.details || '');
  return { ok: true, sheet: modeSheetName_('APP ACTIVITY LOG', mode) };
}

function apiCompanyEditHistory_(p) {
  var mode = normMode_(p.mode);
  var entries = readAll_(sheet_(modeSheetName_('APP ACTIVITY LOG', mode))).rows
    .filter(function (r) { return cellStr_(r['ACTIVITY TYPE']).toUpperCase() === 'COMPANY EDITED'; })
    .map(function (r) {
      return {
        timestamp: cellStr_(r['TIMESTAMP']), user: cellStr_(r['USER']).toUpperCase(),
        companyId: cellStr_(r['COMPANY ID']), companyName: cellStr_(r['COMPANY NAME']),
        details: cellStr_(r['DETAILS'])
      };
    })
    .sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
  return { ok: true, count: entries.length, entries: entries };
}

function apiResetDemoActivity_(p) {
  var by = requireManager_(p.by || p.user);
  var cleared = [];
  ['DEMO CALL LOG', 'DEMO DAILY ACTION LIST', 'DEMO APP ACTIVITY LOG', 'DEMO EVENT MASTER', 'DEMO COMPANY STATUS'].forEach(function (name) {
    var sh = sheet_(name);
    var last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, sh.getMaxColumns()).clearContent();
    cleared.push(name);
  });
  breadcrumb_('DEMO', by.code, 'DEMO RESET', '', '', 'Demo data cleared');
  return { ok: true, message: 'Demo data cleared. LIVE sheets and COMPANY MASTER untouched.', cleared: cleared };
}

/* ====================================================================== */
/* PHONE CLEANUP LAYER — COMPANY CONTACT NUMBERS                          */
/* COMPANY MASTER remains the main company database. This module only     */
/* extracts, normalizes and validates Philippine phone numbers into the   */
/* COMPANY CONTACT NUMBERS sheet (one clean number per row) and attaches  */
/* primary-phone info to rows returned by existing routes. Original       */
/* phone cells in COMPANY MASTER are never modified.                      */
/* ====================================================================== */

var CONTACT_SHEET = 'COMPANY CONTACT NUMBERS';

// Master fields scanned for numbers, in dedup-priority order (first hit wins).
var PHONE_SOURCE_FIELDS = [
  'MOBILE', 'CELLPHONE', 'CELL', 'PHONE', 'PHONE / MOBILE', 'CONTACT NUMBER',
  'TEL', 'TELEPHONE', 'LANDLINE', 'PRIMARY CONTACT',
  'OTHER CONTACTS', 'OTHER CONTACTS & EMAILS', 'EMAIL / CONTACT INFO'
];

// Cache: the contact sheet is read at most once per request.
var PHONE_MAP_CACHE = null;

/* --------------------------- pure helpers ----------------------------- */

// Extract candidate numbers from one messy cell.
// Returns [{raw, digits, extension}]. Original text is preserved by caller.
function extractPhoneNumbersFromText_(text) {
  var out = [];
  var t = String(text == null ? '' : text);
  if (!t.replace(/\s/g, '')) return out;
  var segments = t.split(/[\/,;|\n•]+|\bor\b/i);
  for (var s = 0; s < segments.length; s++) {
    var seg = segments[s];
    // pull out an extension (loc / local / ext / extension) before parsing
    var ext = '';
    var extM = seg.match(/(?:\bloc(?:al)?\b|\bext(?:ension)?\b)\.?\s*:?\s*(\d{1,6})/i);
    if (extM) { ext = extM[1]; seg = seg.replace(extM[0], ' '); }
    // strip label words so "Tel:", "Mobile:" etc. never reach the number
    seg = seg.replace(/\b(tel(?:ephone)?|telefax|fax|mobile|cell(?:phone)?|contact(?:\s*(?:no|number|#))?|trunk\s*line|trunkline|landline|phone|viber|smart|globe|sun|tm|dito|direct\s*line|hotline|number|nos?)\b\.?:?/gi, ' ');
    var matches = seg.match(/\+?\d[\d\s().\-]*\d/g) || [];
    for (var m = 0; m < matches.length; m++) {
      var raw = matches[m].replace(/^\s+|\s+$/g, '');
      var digits = raw.replace(/\D/g, '');
      if (digits.length < 7) continue; // noise (years, counts, short codes)
      if (digits.length <= 13) {
        out.push({ raw: raw, digits: digits, extension: ext });
      } else {
        // Two+ numbers ran together (space-separated in one segment):
        // recover well-formed PH numbers from the digit stream.
        var rec = digits.match(/639\d{9}|09\d{9}|02\d{8}|0[3-8]\d{8}/g) || [];
        for (var r = 0; r < rec.length; r++) {
          out.push({ raw: rec[r], digits: rec[r], extension: ext });
        }
      }
    }
  }
  return out;
}

// Normalize a digit string per Philippine standards.
// Returns {normalized, dial, display, type, status, note}.
function normalizePhilippinePhone_(rawDigits) {
  var d = String(rawDigits == null ? '' : rawDigits).replace(/\D/g, '');
  var note = '';
  if (d.indexOf('0063') === 0) d = '63' + d.slice(4);
  if (d.indexOf('63') === 0) {
    if (d.length === 12 && d.charAt(2) === '9') d = '0' + d.slice(2);      // +639XXXXXXXXX
    else if (d.length === 11 && d.charAt(2) === '2') d = '0' + d.slice(2); // +632XXXXXXXX (Metro Manila)
    else if (d.length === 12 && '345678'.indexOf(d.charAt(2)) !== -1) d = '0' + d.slice(2); // +63XX provincial
  }
  if (/^9\d{9}$/.test(d)) { d = '0' + d; note = 'Inferred missing leading 0'; }
  if (/^09\d{9}$/.test(d)) {
    return { normalized: d, dial: '+63' + d.slice(1),
      display: d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7),
      type: 'MOBILE', status: 'VALID', note: note };
  }
  if (/^02\d{8}$/.test(d)) {
    return { normalized: d, dial: d,
      display: '(02) ' + d.slice(2, 6) + ' ' + d.slice(6),
      type: 'LANDLINE', status: 'VALID', note: note };
  }
  if (/^0[3-8]\d{8}$/.test(d)) { // provincial: 3-digit area code + 7 digits
    return { normalized: d, dial: d,
      display: '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + ' ' + d.slice(6),
      type: 'LANDLINE', status: 'VALID', note: note };
  }
  if (/^\d{8}$/.test(d)) {
    return { normalized: d, dial: d, display: d.slice(0, 4) + ' ' + d.slice(4),
      type: 'LANDLINE', status: 'REVIEW', note: 'Possible landline but missing area code' };
  }
  if (/^\d{7}$/.test(d)) {
    return { normalized: d, dial: d, display: d.slice(0, 3) + ' ' + d.slice(3),
      type: 'LANDLINE', status: 'REVIEW', note: 'Possible landline but missing area code' };
  }
  return { normalized: d, dial: '', display: d, type: 'UNKNOWN', status: 'INVALID', note: 'Unrecognized number format' };
}

function detectPhoneType_(normalized) {
  return normalizePhilippinePhone_(normalized).type;
}

function formatPhoneDisplay_(normalized, type) {
  var n = normalizePhilippinePhone_(normalized);
  return n.display || String(normalized || '');
}

/* ------------------------------- sync ---------------------------------- */

function syncCompanyContactNumbers_() {
  var master = readAll_(companyMasterSheet_());
  var sh = sheet_(CONTACT_SHEET);
  var existing = readAll_(sh);
  var existingByKey = {};
  var maxId = 0;
  existing.rows.forEach(function (r) {
    existingByKey[cellStr_(r['COMPANY ID']) + '|' + cellStr_(r['NORMALIZED NUMBER'])] = r;
    var m = String(r['CONTACT NUMBER ID'] || '').match(/^CN-(\d+)$/);
    if (m) maxId = Math.max(maxId, Number(m[1]));
  });

  var stats = {
    companiesScanned: 0, numbersExtracted: 0, validNumbers: 0, reviewNumbers: 0,
    invalidNumbers: 0, duplicateNumbersSkipped: 0, companiesWithNoNumber: 0
  };
  var now = nowStr_();
  var outRows = [];

  master.rows.forEach(function (r) {
    var companyId = cellStr_(r['COMPANY ID']);
    if (!companyId) return;
    var companyName = cellStr_(r['COMPANY NAME']);
    stats.companiesScanned++;
    var seen = {};
    var found = [];
    PHONE_SOURCE_FIELDS.forEach(function (field) {
      var text = cellStr_(r[field]);
      if (!text) return;
      extractPhoneNumbersFromText_(text).forEach(function (cand) {
        var n = normalizePhilippinePhone_(cand.digits);
        if (!n.normalized) return;
        if (seen[n.normalized]) { stats.duplicateNumbersSkipped++; return; }
        seen[n.normalized] = true;
        var note = n.note;
        if (cand.extension) {
          note = note ? note + '; extension detected: ' + cand.extension
                      : 'Extension detected: ' + cand.extension;
        }
        found.push({ sourceField: field, originalText: text, raw: cand.raw, ext: cand.extension || '', n: n, note: note });
      });
    });
    if (!found.length) { stats.companiesWithNoNumber++; return; }

    // Primary: first valid mobile → first valid landline → first REVIEW landline.
    var primary = null;
    for (var i = 0; i < found.length && !primary; i++) {
      if (found[i].n.status === 'VALID' && found[i].n.type === 'MOBILE') primary = found[i];
    }
    for (var j = 0; j < found.length && !primary; j++) {
      if (found[j].n.status === 'VALID' && found[j].n.type === 'LANDLINE') primary = found[j];
    }
    for (var k = 0; k < found.length && !primary; k++) {
      if (found[k].n.status === 'REVIEW' && found[k].n.type === 'LANDLINE') {
        primary = found[k];
        primary.note = primary.note ? primary.note + '; primary by fallback (needs review)' : 'Primary by fallback (needs review)';
      }
    }

    found.forEach(function (c) {
      stats.numbersExtracted++;
      if (c.n.status === 'VALID') stats.validNumbers++;
      else if (c.n.status === 'REVIEW') stats.reviewNumbers++;
      else stats.invalidNumbers++;
      var ex = existingByKey[companyId + '|' + c.n.normalized];
      var id = ex ? cellStr_(ex['CONTACT NUMBER ID']) : 'CN-' + ('000000' + (++maxId)).slice(-6);
      outRows.push([
        id, companyId, companyName, c.sourceField, c.originalText,
        c.n.type, c.raw, c.n.normalized, c.n.dial, c.n.display,
        c.ext, c.n.type === 'MOBILE' ? 'TRUE' : 'FALSE', c.n.type === 'LANDLINE' ? 'TRUE' : 'FALSE',
        c.n.status === 'VALID' ? 'TRUE' : 'FALSE', c.n.status, c.note,
        c === primary ? 'TRUE' : 'FALSE',
        ex ? (cellStr_(ex['CREATED AT']) || now) : now, now
      ]);
    });
  });

  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, sh.getMaxColumns()).clearContent();
  if (outRows.length) {
    // Force text format BEFORE writing: otherwise Sheets coerces digit-only
    // values to numbers, stripping leading zeros (0288888888 → 288888888)
    // and the + from +63 dial numbers.
    sh.getRange(2, 1, outRows.length, outRows[0].length)
      .setNumberFormat('@')
      .setValues(outRows);
  }
  PHONE_MAP_CACHE = null;
  return stats;
}

/* ------------------------- lookups & report ---------------------------- */

function contactNumberJson_(r) {
  return {
    contactNumberId: cellStr_(r['CONTACT NUMBER ID']),
    companyId: cellStr_(r['COMPANY ID']),
    companyName: cellStr_(r['COMPANY NAME']),
    sourceField: cellStr_(r['SOURCE FIELD']),
    originalText: cellStr_(r['ORIGINAL TEXT']),
    contactType: cellStr_(r['CONTACT TYPE']),
    rawNumber: cellStr_(r['RAW NUMBER']),
    normalizedNumber: cellStr_(r['NORMALIZED NUMBER']),
    dialNumber: cellStr_(r['DIAL NUMBER']),
    displayNumber: cellStr_(r['DISPLAY NUMBER']),
    extension: cellStr_(r['EXTENSION']),
    isMobile: String(r['IS MOBILE']).toUpperCase() === 'TRUE',
    isLandline: String(r['IS LANDLINE']).toUpperCase() === 'TRUE',
    isValid: String(r['IS_VALID']).toUpperCase() === 'TRUE',
    validationStatus: cellStr_(r['VALIDATION STATUS']).toUpperCase(),
    validationNote: cellStr_(r['VALIDATION NOTE']),
    primaryNumber: String(r['PRIMARY NUMBER']).toUpperCase() === 'TRUE'
  };
}

function getCompanyContactNumbers_(companyId) {
  return readAll_(sheet_(CONTACT_SHEET)).rows
    .map(contactNumberJson_)
    .filter(function (n) { return n.companyId === companyId; });
}

function getPrimaryPhoneForCompany_(companyId) {
  var nums = getCompanyContactNumbers_(companyId);
  for (var i = 0; i < nums.length; i++) if (nums[i].primaryNumber) return nums[i];
  for (var j = 0; j < nums.length; j++) if (nums[j].validationStatus === 'VALID') return nums[j];
  return null;
}

function getPhoneCleanupReport_() {
  var master = readAll_(companyMasterSheet_());
  var totalCompanies = master.rows.filter(function (r) { return cellStr_(r['COMPANY ID']); }).length;
  var nums = readAll_(sheet_(CONTACT_SHEET)).rows.map(contactNumberJson_);
  var byCompany = {};
  var valid = 0, review = 0, invalid = 0;
  nums.forEach(function (n) {
    byCompany[n.companyId] = (byCompany[n.companyId] || 0) + 1;
    if (n.validationStatus === 'VALID') valid++;
    else if (n.validationStatus === 'REVIEW') review++;
    else invalid++;
  });
  var withNumbers = 0, multi = 0;
  for (var id in byCompany) { withNumbers++; if (byCompany[id] > 1) multi++; }
  return {
    totalCompanies: totalCompanies,
    companiesWithNumbers: withNumbers,
    companiesWithNoNumber: Math.max(0, totalCompanies - withNumbers),
    companiesWithMultipleNumbers: multi,
    totalNumbers: nums.length,
    validNumbers: valid,
    reviewNumbers: review,
    invalidNumbers: invalid
  };
}

/* ----------------------- batch attach (per request) -------------------- */

function phoneInfoMap_() {
  if (PHONE_MAP_CACHE) return PHONE_MAP_CACHE;
  var map = {};
  readAll_(sheet_(CONTACT_SHEET)).rows.forEach(function (r) {
    var id = cellStr_(r['COMPANY ID']);
    if (!id) return;
    var status = cellStr_(r['VALIDATION STATUS']).toUpperCase();
    var entry = map[id] || (map[id] = { display: '', dial: '', status: 'NONE', count: 0 });
    if (status === 'VALID') entry.count++;
    var isPrimary = String(r['PRIMARY NUMBER']).toUpperCase() === 'TRUE';
    if (isPrimary || (entry.status === 'NONE' && status === 'VALID')) {
      entry.display = cellStr_(r['DISPLAY NUMBER']);
      entry.dial = cellStr_(r['DIAL NUMBER']);
      entry.status = status;
    }
  });
  PHONE_MAP_CACHE = map;
  return map;
}

function attachPhoneInfo_(rows) {
  if (!rows || !rows.length) return rows;
  var map = phoneInfoMap_();
  rows.forEach(function (r) {
    var p = map[r.companyId];
    r.primaryPhoneDisplay = p ? p.display : '';
    r.primaryPhoneDial = (p && p.status === 'VALID') ? p.dial : '';
    r.phoneCount = p ? p.count : 0;
    r.hasCleanPhone = !!(p && p.status === 'VALID');
    r.phoneValidationStatus = p ? p.status : 'NONE';
  });
  return rows;
}

// Spec-named wrappers — all row shapes share the companyId key.
function attachPrimaryPhoneInfoToCompanyRows_(rows) { return attachPhoneInfo_(rows); }
function attachPrimaryPhoneInfoToActionRows_(rows) { return attachPhoneInfo_(rows); }
function attachPrimaryPhoneInfoToCallRows_(rows) { return attachPhoneInfo_(rows); }

/* ------------------------------- routes -------------------------------- */

// Reads COMPANY MASTER regardless of DEMO/LIVE (shared source data).
function apiSyncContactNumbers_(p) {
  var stats = syncCompanyContactNumbers_();
  stats.ok = true;
  stats.sheet = CONTACT_SHEET;
  return stats;
}

function apiGetCompanyContactNumbers_(p) {
  var companyId = String(p.companyId || '').trim();
  var statusFilter = String(p.status || '').trim().toUpperCase();
  var nums;
  if (companyId) {
    nums = getCompanyContactNumbers_(companyId);
  } else {
    nums = readAll_(sheet_(CONTACT_SHEET)).rows.map(contactNumberJson_);
  }
  if (statusFilter) {
    var wanted = {};
    statusFilter.split(',').forEach(function (s) { wanted[s.replace(/\s/g, '')] = true; });
    nums = nums.filter(function (n) { return wanted[n.validationStatus]; });
  }
  return { ok: true, count: nums.length, sheet: CONTACT_SHEET, numbers: nums };
}

function apiGetPrimaryPhone_(p) {
  var companyId = req_(p.companyId, 'companyId');
  var primary = getPrimaryPhoneForCompany_(companyId);
  return { ok: true, companyId: companyId, found: !!primary, primary: primary };
}

function apiGetPhoneCleanupReport_(p) {
  var report = getPhoneCleanupReport_();
  report.ok = true;
  return report;
}

/* ====================================================================== */
/* PUBLIC EVENT FINDER — next-6-months opportunity discovery              */
/* Sources are configurable (EVENT SOURCES sheet). Import works two ways: */
/*  - pastedText: manager pastes a public listing; backend parses it.     */
/*  - URL fetch: best-effort UrlFetchApp scan of source pages. Sites that */
/*    block fetching or render via JavaScript return a clear per-source   */
/*    error ("needs manual paste") — no fake scraping, no crash.          */
/* All imports land as NEEDS REVIEW; managers approve before prospecting. */
/* ====================================================================== */

var FINDER_WINDOW_DAYS = 183; // ~6 months
var BUSINESS_EVENT_WORDS = ['expo', 'trade', 'fair', 'convention', 'conference', 'summit', 'exhibit', 'exhibition', 'showcase', 'congress', 'forum', 'franchise', 'b2b', 'show', 'bazaar', 'marketplace'];
var EVENT_MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function ensureEventColumns_(sh) {
  var wanted = SHEET_HEADERS['EVENT MASTER'];
  var lastCol = sh.getLastColumn() || 1;
  var have = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(normHeader_);
  var missing = wanted.filter(function (h) { return have.indexOf(h) === -1; });
  if (missing.length) {
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
  }
}

function seedEventSources_() {
  var sh = sheet_('EVENT SOURCES');
  if (sh.getLastRow() > 1) return;
  var now = '';
  var rows = [
    ['SRC-001', 'SMX Convention Center', 'VENUE CALENDAR', 'https://smxconventioncenter.com/events/', 'SMX Convention Center Manila', 'Pasay City', '', 'TRUE', now, 'Verify URL; site may need manual paste'],
    ['SRC-002', 'World Trade Center Metro Manila', 'VENUE CALENDAR', 'https://www.wtcmanila.com.ph/events/', 'World Trade Center Metro Manila', 'Pasay City', '', 'TRUE', now, 'Verify URL; site may need manual paste'],
    ['SRC-003', 'Philippine International Convention Center', 'VENUE CALENDAR', 'https://www.picc.gov.ph/events/', 'PICC', 'Pasay City', '', 'TRUE', now, 'Verify URL; site may need manual paste'],
    ['SRC-004', 'Megatrade Hall (SM Megamall)', 'VENUE CALENDAR', 'https://www.megatradehall.com/', 'Megatrade Hall, SM Megamall', 'Mandaluyong City', '', 'TRUE', now, 'Verify URL; site may need manual paste'],
    ['SRC-005', '10times Manila expo directory', 'PUBLIC DIRECTORY', 'https://10times.com/manila-ph', '', 'Metro Manila', '', 'TRUE', now, 'Public expo directory'],
    ['SRC-006', 'Manual paste / search results', 'MANUAL', '', '', '', '', 'TRUE', now, 'Paste listings into the Import box']
  ];
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedEventIndustryMap_() {
  var sh = sheet_('EVENT INDUSTRY MAP');
  if (sh.getLastRow() > 1) return;
  var rows = [
    ['food, beverage, restaurant, horeca, hotel, catering, culinary, coffee, bakery', 'Trade Fair', 'Food & Beverage / Hospitality',
     'Food manufacturers; Beverage brands; Restaurants; Hotels; Catering suppliers; Packaging suppliers; Kitchen equipment suppliers',
     'Booth design and fabrication; Sampling activation; Product demo; Promoters; Registration manpower; Event booth staff',
     'Exhibitors may need booths, sampling teams, ingress/egress manpower, and brand activations.'],
    ['construct, building, architecture, real estate, property, housing, interior, worldbex', 'Expo', 'Construction / Real Estate',
     'Developers; Building material suppliers; Furniture manufacturers; Hardware brands; Architecture firms',
     'Expo booth; Product display; Lead generation booth staff; Sales promoters; Trade show activation',
     'Developers, suppliers, and manufacturers often need professional booth execution and lead capture.'],
    ['medical, healthcare, pharma, dental, hospital, nursing, clinical', 'Convention', 'Healthcare / Pharmaceutical',
     'Pharma brands; Medical device suppliers; Hospitals; Dental suppliers; Lab equipment vendors',
     'Scientific conference booth; Registration support; Product information booth; Brand activation; Manpower',
     'Medical suppliers and pharma brands need compliant event presence and conference support.'],
    ['beauty, cosmetics, wellness, dermatology, spa, skincare, salon', 'Expo', 'Beauty / Wellness',
     'Beauty brands; Cosmetics distributors; Spa chains; Wellness products; Derma clinics',
     'Product sampling; Beauty booth; Promoters; Demonstration area; Lead capture',
     'Beauty brands need high-engagement booth concepts and sampling teams.'],
    ['technology, electronics, software, ai, it, digital, fintech, gaming, esports', 'Conference', 'Technology / Electronics',
     'Tech brands; Software companies; Telcos; Electronics distributors; Fintech startups',
     'Demo booth; Interactive display; Product launch activation; Registration system; Event manpower',
     'Tech exhibitors need demo spaces, trained presenters, and registration/event support.'],
    ['automotive, car, motorcycle, transport, logistics, ev, vehicle', 'Show', 'Automotive / Logistics',
     'Auto brands; Parts suppliers; Dealerships; Logistics companies; EV brands',
     'Product display; Vehicle showcase setup; Promo manpower; Test drive support; Lead generation',
     'Auto brands and suppliers need experience areas, display fabrication, and trained staff.'],
    ['franchise, business, sme, retail, entrepreneur, startup, negosyo', 'Expo', 'Retail / Franchise / Business',
     'Franchise brands; Retail chains; SME suppliers; Business services; Payment providers',
     'Sales booth; Lead capture; Sales promoters; Booth fabrication; Accreditation support',
     'Franchise exhibitors need booths and manpower to capture investor leads.'],
    ['education, school, university, training, learning, scholarship', 'Fair', 'Education',
     'Schools; Universities; Review centers; Ed-tech brands; Training providers',
     'Information booth; Registration support; Lead generation; Campus activation',
     'Schools and education brands need event booths and enrollment lead capture.'],
    ['travel, tourism, airline, destination, cruise, resort', 'Fair', 'Travel / Tourism / Hospitality',
     'Airlines; Travel agencies; Hotels and resorts; Tourism boards; Cruise lines',
     'Booth; Destination activation; Promoters; Registration; Product display',
     'Tourism and hospitality exhibitors need immersive booth concepts and visitor engagement.'],
    ['agriculture, livestock, farming, food manufacturing, agri, poultry, aqua', 'Expo', 'Agriculture / Food Manufacturing',
     'Agri suppliers; Feed manufacturers; Farm equipment brands; Food processors; Packaging suppliers',
     'Product display booth; Sampling; Trade fair manpower; Demonstration booth',
     'Agriculture and food manufacturing brands need booth execution and product engagement.']
  ];
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/* --------------------------- date extraction ---------------------------- */

// Parse a loose date or date range out of a text line.
// Handles: "March 5-7, 2026" | "Mar 30 - Apr 2, 2026" | "5-7 March 2026"
//          "March 5, 2026" | "2026-03-05" | "03/05/2026"
// Returns {start: Date, end: Date, matched: '...'} or null.
function parseLooseDateRange_(text) {
  var t = String(text || '');
  var m;
  // ISO yyyy-mm-dd (optionally a range "yyyy-mm-dd - yyyy-mm-dd")
  m = t.match(/(\d{4})-(\d{2})-(\d{2})(?:\s*(?:-|–|to)\s*(\d{4})-(\d{2})-(\d{2}))?/);
  if (m) {
    var s1 = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    var e1 = m[4] ? new Date(Number(m[4]), Number(m[5]) - 1, Number(m[6])) : s1;
    if (!isNaN(s1.getTime())) return { start: s1, end: e1, matched: m[0] };
  }
  var MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
  // "March 5-7, 2026" / "March 5 - April 2, 2026" / "March 5, 2026"
  m = t.match(new RegExp(MON + '\\s+(\\d{1,2})(?:\\s*(?:-|–|—|to|&)\\s*(?:' + MON + '\\s+)?(\\d{1,2}))?,?\\s+(\\d{4})', 'i'));
  if (m) {
    var mo1 = EVENT_MONTHS[m[1].slice(0, 3).toLowerCase()];
    var yr = Number(m[5]);
    var st = new Date(yr, mo1, Number(m[2]));
    var mo2 = m[3] ? EVENT_MONTHS[m[3].slice(0, 3).toLowerCase()] : mo1;
    var en = m[4] ? new Date(yr, mo2, Number(m[4])) : st;
    if (!isNaN(st.getTime())) return { start: st, end: en, matched: m[0] };
  }
  // "5-7 March 2026" / "5 March 2026"
  m = t.match(new RegExp('(\\d{1,2})(?:\\s*(?:-|–|to)\\s*(\\d{1,2}))?\\s+' + MON + ',?\\s+(\\d{4})', 'i'));
  if (m) {
    var mo3 = EVENT_MONTHS[m[3].slice(0, 3).toLowerCase()];
    var yr2 = Number(m[4]);
    var st2 = new Date(yr2, mo3, Number(m[1]));
    var en2 = m[2] ? new Date(yr2, mo3, Number(m[2])) : st2;
    if (!isNaN(st2.getTime())) return { start: st2, end: en2, matched: m[0] };
  }
  // mm/dd/yyyy
  m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    var st3 = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (!isNaN(st3.getTime())) return { start: st3, end: st3, matched: m[0] };
  }
  return null;
}

/* ------------------------ classification & scoring ---------------------- */

function industryMapRows_() {
  return readAll_(sheet_('EVENT INDUSTRY MAP')).rows.map(function (r) {
    return {
      keywords: cellStr_(r['KEYWORD']).toLowerCase().split(/[,;]+/).map(function (k) { return k.trim(); }).filter(String),
      eventType: cellStr_(r['EVENT TYPE']),
      category: cellStr_(r['INDUSTRY CATEGORY']),
      targetIndustries: cellStr_(r['TARGET INDUSTRIES']),
      requirements: cellStr_(r['POSSIBLE REQUIREMENTS']),
      angle: cellStr_(r['PROSPECTING ANGLE'])
    };
  }).filter(function (m) { return m.keywords.length && m.category; });
}

// Classify by event name/type/organizer/venue/listing text keywords.
function classifyEvent_(haystack, mapRows) {
  var hay = ' ' + String(haystack || '').toLowerCase() + ' ';
  for (var i = 0; i < mapRows.length; i++) {
    var row = mapRows[i];
    for (var k = 0; k < row.keywords.length; k++) {
      if (hay.indexOf(row.keywords[k]) !== -1) return row;
    }
  }
  return null;
}

function looksBusinessEvent_(text) {
  var hay = String(text || '').toLowerCase();
  for (var i = 0; i < BUSINESS_EVENT_WORDS.length; i++) {
    if (hay.indexOf(BUSINESS_EVENT_WORDS[i]) !== -1) return true;
  }
  return false;
}

function eventOpportunityScore_(ev) {
  var score = 0;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var start = parseDate_(ev.startDate);
  if (start && start.getTime() >= today.getTime()) score += 20;                       // clear future date
  if (ev.venue) score += 15;                                                          // known venue
  if (looksBusinessEvent_(ev.eventName + ' ' + ev.eventType)) score += 15;            // trade/business nature
  if (ev.category && ev.category.toLowerCase() !== 'needs review') score += 15;       // industry matched
  if (ev.sourceUrl) score += 15;                                                      // credible public source
  if (start) {                                                                        // within prospecting window
    var days = Math.ceil((start.getTime() - today.getTime()) / 86400000);
    if (days >= 0 && days <= FINDER_WINDOW_DAYS) score += 10;
  }
  if (ev.possibleRequirements) score += 10;                                           // exhibitor/sponsor opportunity
  return Math.min(100, score);
}

function prospectingStartFor_(startDate) {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var days = Math.ceil((startDate.getTime() - today.getTime()) / 86400000);
  if (days > 60) {
    var d = new Date(startDate.getTime() - 45 * 86400000);
    return { date: dayStr_(d), status: 'SCHEDULED' };
  }
  return { date: dayStr_(today), status: days <= 14 ? 'URGENT' : 'START NOW' };
}

/* ------------------------- candidate extraction ------------------------- */

// Parse free text (pasted listing or stripped HTML) into event candidates.
function parseEventCandidatesFromText_(text, defaults) {
  var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); });
  var candidates = [];
  var prevLine = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) { prevLine = ''; continue; }
    var dr = parseLooseDateRange_(line);
    if (!dr) { prevLine = line; continue; }
    // Name = same line minus the date, or the previous line for date-only lines.
    var name = line.replace(dr.matched, ' ').replace(/[|@•–—,:;\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (name.length < 5 && prevLine && !parseLooseDateRange_(prevLine)) name = prevLine;
    name = name.replace(/\s+/g, ' ').trim();
    if (name.length < 5) { prevLine = line; continue; }
    // Venue hint on the following line.
    var venue = defaults.venue || '';
    var next = lines[i + 1] || '';
    if (!venue && /\b(center|centre|hall|smx|picc|wtc|megatrade|hotel|arena|grounds|pavilion)\b/i.test(next) && !parseLooseDateRange_(next)) {
      venue = next;
    }
    candidates.push({
      eventName: name.slice(0, 150),
      startDate: dayStr_(dr.start),
      endDate: dayStr_(dr.end),
      venue: venue,
      city: defaults.city || '',
      organizer: '',
      source: defaults.sourceName || 'Manual paste',
      sourceUrl: defaults.sourceUrl || '',
      listingText: line.slice(0, 400)
    });
    prevLine = line;
  }
  return candidates;
}

// Best-effort fetch of a source page. Returns {ok, text} or {ok:false, error}.
function fetchSourcePage_(url) {
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SlingshotzCRM/1.0)' } });
    var code = resp.getResponseCode();
    if (code < 200 || code >= 400) return { ok: false, error: 'HTTP ' + code };
    var html = resp.getContentText();
    // strip scripts/styles/tags into scannable text lines
    var text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;|&#\d+;|&[a-z]+;/gi, ' ');
    return { ok: true, text: text };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

/* ------------------------------- import --------------------------------- */

function apiImportPublicEvents_(p) {
  var mode = normMode_(p.mode);
  var user = String(p.user || 'SYSTEM').toUpperCase();
  var dryRun = String(p.dryRun || '').toLowerCase() === 'true';
  var sourceId = String(p.sourceId || '').trim();
  var fromDate = parseDate_(p.fromDate);
  var toDate = parseDate_(p.toDate);
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var windowEnd = new Date(today.getTime() + FINDER_WINDOW_DAYS * 86400000);
  var from = (fromDate && fromDate.getTime() > today.getTime()) ? fromDate : today;
  var to = (toDate && toDate.getTime() < windowEnd.getTime()) ? toDate : windowEnd;

  var sh = sheet_(modeSheetName_('EVENT MASTER', mode));
  ensureEventColumns_(sh);
  var existing = readAll_(sh);
  var dupKeys = {};
  existing.rows.forEach(function (r) {
    var key = normEventKey_(cellStr_(r['EVENT NAME']), cellStr_(r['VENUE']), cellStr_(r['START DATE']));
    if (key) dupKeys[key] = r;
  });

  var mapRows = industryMapRows_();
  var sources = readAll_(sheet_('EVENT SOURCES')).rows.filter(function (r) {
    if (String(r['ACTIVE']).toUpperCase() === 'FALSE') return false;
    if (sourceId && cellStr_(r['SOURCE ID']) !== sourceId) return false;
    return true;
  });

  var result = {
    ok: true, dryRun: dryRun, mode: mode, scannedSources: 0, eventsFound: 0, eventsImported: 0,
    duplicatesSkipped: 0, rejectedPastEvents: 0, rejectedBeyondSixMonths: 0, needsReview: 0,
    errors: [], imported: []
  };

  var allCandidates = [];

  // Option C: pasted listing text (always works).
  var pasted = String(p.pastedText || '').trim();
  if (pasted) {
    var src = sources.length === 1 ? sources[0] : null;
    allCandidates = allCandidates.concat(parseEventCandidatesFromText_(pasted, {
      sourceName: src ? cellStr_(src['SOURCE NAME']) : 'Manual paste',
      sourceUrl: src ? cellStr_(src['SOURCE URL']) : '',
      venue: src ? cellStr_(src['DEFAULT VENUE']) : '',
      city: src ? cellStr_(src['DEFAULT CITY']) : ''
    }));
  } else {
    // Option B: best-effort fetch of configured source URLs.
    var srcSheet = sheet_('EVENT SOURCES');
    sources.forEach(function (srcRow) {
      var url = cellStr_(srcRow['SOURCE URL']);
      if (!url) return;
      result.scannedSources++;
      var page = fetchSourcePage_(url);
      var name = cellStr_(srcRow['SOURCE NAME']);
      if (!page.ok) {
        result.errors.push(name + ': fetch failed (' + page.error + ') — needs manual paste/import');
      } else {
        var cands = parseEventCandidatesFromText_(page.text, {
          sourceName: name, sourceUrl: url,
          venue: cellStr_(srcRow['DEFAULT VENUE']), city: cellStr_(srcRow['DEFAULT CITY'])
        });
        if (!cands.length) {
          result.errors.push(name + ': page fetched but no parseable event listings (likely rendered by JavaScript) — needs manual paste/import');
        }
        allCandidates = allCandidates.concat(cands);
      }
      if (!dryRun) {
        srcRow['LAST CHECKED'] = nowStr_();
        writeObj_(srcSheet, srcRow._row, srcRow);
      }
    });
  }

  result.eventsFound = allCandidates.length;
  var now = nowStr_();
  var seenThisRun = {};

  var JUNK_RE = /\b(birthday|wedding|debut|anniversary party|christening|funeral|private party|reunion)\b/i;

  allCandidates.forEach(function (c) {
    var start = parseDate_(c.startDate);
    if (!start) return;
    if (JUNK_RE.test(c.eventName + ' ' + c.listingText)) return; // no prospecting value
    if (start.getTime() < from.getTime()) { result.rejectedPastEvents++; return; }
    if (start.getTime() > to.getTime()) { result.rejectedBeyondSixMonths++; return; }

    var key = normEventKey_(c.eventName, c.venue, c.startDate);
    if (seenThisRun[key]) { result.duplicatesSkipped++; return; }
    seenThisRun[key] = true;
    if (dupKeys[key]) {
      result.duplicatesSkipped++;
      if (!dryRun) {
        var ex = dupKeys[key];
        ex['LAST CHECKED'] = now;
        if (!cellStr_(ex['SOURCE URL']) && c.sourceUrl) ex['SOURCE URL'] = c.sourceUrl;
        writeObj_(sh, ex._row, ex);
      }
      return;
    }

    var hay = c.eventName + ' ' + c.organizer + ' ' + c.venue + ' ' + c.listingText;
    var map = classifyEvent_(hay, mapRows);
    var business = looksBusinessEvent_(hay);
    var confidence = (map && c.venue) ? 'HIGH' : ((map || (business && c.venue)) ? 'MEDIUM' : 'LOW');
    var prospect = prospectingStartFor_(start);
    var days = Math.ceil((start.getTime() - today.getTime()) / 86400000);

    var rec = {
      'EVENT ID': 'EV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      'EVENT NAME': c.eventName,
      'CATEGORY': map ? map.category : 'Needs Review',
      'EVENT TYPE': map ? map.eventType : (business ? 'Trade / Business Event' : ''),
      'START DATE': c.startDate, 'END DATE': c.endDate,
      'VENUE': c.venue, 'CITY': c.city, 'ORGANIZER': c.organizer,
      'SOURCE': c.source, 'SOURCE URL': c.sourceUrl,
      'PUBLIC LISTING TEXT': c.listingText,
      'TARGET INDUSTRY': map ? map.targetIndustries : '',
      'POSSIBLE REQUIREMENTS': map ? map.requirements : '',
      'PROSPECTING ANGLE': map ? map.angle : '',
      'SUGGESTED TARGET COMPANIES': map ? map.targetIndustries : '',
      'LEAD STATUS': 'NEW', 'REVIEW STATUS': 'NEEDS REVIEW',
      'CONFIDENCE LEVEL': map ? confidence : 'LOW',
      'DATE FOUND': now, 'LAST CHECKED': now,
      'PROSPECTING START DATE': prospect.date, 'PROSPECTING STATUS': prospect.status,
      'DAYS UNTIL EVENT': days,
      'NOTES': '', 'CREATED BY': user, 'CREATED AT': now, 'UPDATED BY': user, 'UPDATED AT': now,
      'DELETED': 'FALSE'
    };
    result.needsReview++;
    result.eventsImported++;
    result.imported.push({ eventName: c.eventName, startDate: c.startDate, venue: c.venue, category: rec['CATEGORY'], confidence: rec['CONFIDENCE LEVEL'] });
    if (!dryRun) appendObj_(sh, rec);
  });

  if (!dryRun && result.eventsImported) {
    breadcrumb_(mode, user, 'EVENT ADDED', '', '', 'Public Event Finder imported ' + result.eventsImported + ' event lead(s)');
  }
  if (dryRun) result.eventsImported = 0;
  return result;
}

function normEventKey_(name, venue, startDate) {
  var n = String(name || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
  if (!n) return '';
  var v = String(venue || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12);
  var d = cellStr_(startDate);
  return n + '|' + v + '|' + d;
}

/* ------------------------- sources & map routes ------------------------- */

function apiGetEventSources_(p) {
  var includeInactive = String(p.all || '').toLowerCase() === 'true';
  var sources = readAll_(sheet_('EVENT SOURCES')).rows.map(function (r) {
    return {
      sourceId: cellStr_(r['SOURCE ID']), sourceName: cellStr_(r['SOURCE NAME']),
      sourceType: cellStr_(r['SOURCE TYPE']), sourceUrl: cellStr_(r['SOURCE URL']),
      defaultVenue: cellStr_(r['DEFAULT VENUE']), defaultCity: cellStr_(r['DEFAULT CITY']),
      defaultIndustryCategory: cellStr_(r['DEFAULT INDUSTRY CATEGORY']),
      active: String(r['ACTIVE']).toUpperCase() !== 'FALSE',
      lastChecked: cellStr_(r['LAST CHECKED']), notes: cellStr_(r['NOTES'])
    };
  });
  if (!includeInactive) sources = sources.filter(function (s) { return s.active; });
  return { ok: true, count: sources.length, sheet: 'EVENT SOURCES', sources: sources };
}

function apiUpsertEventSource_(p) {
  var by = requireManager_(p.user || p.by);
  var sh = sheet_('EVENT SOURCES');
  var data = readAll_(sh);
  var sourceId = String(p.sourceId || '').trim();
  var fields = {
    'SOURCE NAME': p.sourceName, 'SOURCE TYPE': p.sourceType, 'SOURCE URL': p.sourceUrl,
    'DEFAULT VENUE': p.defaultVenue, 'DEFAULT CITY': p.defaultCity,
    'DEFAULT INDUSTRY CATEGORY': p.defaultIndustryCategory,
    'ACTIVE': p.active, 'NOTES': p.notes
  };
  if (!sourceId) {
    if (!String(p.sourceName || '').trim()) throw new Error('Source name is required.');
    var maxN = 0;
    data.rows.forEach(function (r) {
      var m = String(r['SOURCE ID'] || '').match(/^SRC-(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    });
    sourceId = 'SRC-' + ('000' + (maxN + 1)).slice(-3);
    var obj = { 'SOURCE ID': sourceId, 'ACTIVE': 'TRUE' };
    for (var h in fields) if (fields[h] !== undefined && fields[h] !== '') obj[h] = fields[h];
    appendObj_(sh, obj);
    breadcrumb_('DEMO', by.code, 'EVENT ADDED', '', p.sourceName, 'Event source added (' + sourceId + ')');
    return { ok: true, message: 'Source added.', sourceId: sourceId };
  }
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['SOURCE ID']) === sourceId) {
      for (var f in fields) { if (fields[f] !== undefined && fields[f] !== '') r[f] = fields[f]; }
      writeObj_(sh, r._row, r);
      return { ok: true, message: 'Source updated.', sourceId: sourceId };
    }
  }
  return { ok: false, error: 'Source not found: ' + sourceId };
}

function apiGetEventIndustryMap_(p) {
  var rows = readAll_(sheet_('EVENT INDUSTRY MAP')).rows.map(function (r) {
    return {
      keyword: cellStr_(r['KEYWORD']), eventType: cellStr_(r['EVENT TYPE']),
      industryCategory: cellStr_(r['INDUSTRY CATEGORY']), targetIndustries: cellStr_(r['TARGET INDUSTRIES']),
      possibleRequirements: cellStr_(r['POSSIBLE REQUIREMENTS']), prospectingAngle: cellStr_(r['PROSPECTING ANGLE'])
    };
  });
  return { ok: true, count: rows.length, sheet: 'EVENT INDUSTRY MAP', map: rows };
}

function apiUpsertEventIndustryMap_(p) {
  var by = requireManager_(p.user || p.by);
  var sh = sheet_('EVENT INDUSTRY MAP');
  var data = readAll_(sh);
  var keyword = req_(p.keyword, 'keyword');
  var fields = {
    'KEYWORD': keyword, 'EVENT TYPE': p.eventType, 'INDUSTRY CATEGORY': p.industryCategory,
    'TARGET INDUSTRIES': p.targetIndustries, 'POSSIBLE REQUIREMENTS': p.possibleRequirements,
    'PROSPECTING ANGLE': p.prospectingAngle
  };
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['KEYWORD']).toLowerCase() === keyword.toLowerCase()) {
      for (var f in fields) { if (fields[f] !== undefined) r[f] = fields[f]; }
      writeObj_(sh, r._row, r);
      return { ok: true, message: 'Mapping updated.' };
    }
  }
  appendObj_(sh, fields);
  return { ok: true, message: 'Mapping added.' };
}

/* --------------------------- review workflow ---------------------------- */

function apiGetPublicEventCandidates_(p) {
  var mode = normMode_(p.mode);
  var sh = sheet_(modeSheetName_('EVENT MASTER', mode));
  ensureEventColumns_(sh);
  var today = dayStr_(new Date());
  var candidates = readAll_(sh).rows.map(eventJson_).filter(function (ev) {
    if (ev.deleted || !ev.eventId) return false;
    if (['NEEDS REVIEW', 'NEEDS DATE CHECK', 'NEEDS SOURCE CHECK'].indexOf(ev.reviewStatus) === -1) return false;
    var end = ev.endDate || ev.startDate;
    if (end && end < today) return false;
    return true;
  }).sort(function (a, b) { return b.opportunityScore - a.opportunityScore; });
  return { ok: true, count: candidates.length, mode: mode, candidates: candidates };
}

function setEventReview_(mode, eventId, user, reviewStatus, leadStatus) {
  var sh = sheet_(modeSheetName_('EVENT MASTER', mode));
  ensureEventColumns_(sh);
  var data = readAll_(sh);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (cellStr_(r['EVENT ID']) === eventId) {
      r['REVIEW STATUS'] = reviewStatus;
      if (leadStatus) r['LEAD STATUS'] = leadStatus;
      r['UPDATED BY'] = user;
      r['UPDATED AT'] = nowStr_();
      r['LAST CHECKED'] = nowStr_();
      writeObj_(sh, r._row, r);
      breadcrumb_(mode, user, 'EVENT UPDATED', '', cellStr_(r['EVENT NAME']), 'Review: ' + reviewStatus + (leadStatus ? ' / ' + leadStatus : ''));
      return cellStr_(r['EVENT NAME']);
    }
  }
  return null;
}

function apiApprovePublicEvent_(p) {
  var by = requireManager_(p.user || p.by);
  var name = setEventReview_(normMode_(p.mode), req_(p.eventId, 'eventId'), by.code, 'VERIFIED', 'APPROVED FOR PROSPECTING');
  return name ? { ok: true, message: '"' + name + '" approved for prospecting.' } : { ok: false, error: 'Event not found.' };
}

function apiRejectPublicEvent_(p) {
  var by = requireManager_(p.user || p.by);
  var name = setEventReview_(normMode_(p.mode), req_(p.eventId, 'eventId'), by.code, 'REJECTED', 'NOT RELEVANT');
  return name ? { ok: true, message: '"' + name + '" marked not relevant.' } : { ok: false, error: 'Event not found.' };
}

function apiMarkEventDuplicate_(p) {
  var by = requireManager_(p.user || p.by);
  var name = setEventReview_(normMode_(p.mode), req_(p.eventId, 'eventId'), by.code, 'DUPLICATE', 'DUPLICATE');
  return name ? { ok: true, message: '"' + name + '" marked duplicate.' } : { ok: false, error: 'Event not found.' };
}
