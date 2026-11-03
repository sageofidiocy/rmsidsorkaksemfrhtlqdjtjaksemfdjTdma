/* Deificatio — offline quest / training / skill tracker. All data lives in localStorage on this device. */
'use strict';
const { ACTIVITIES, SKILLS, FOLDERS, BELTS, NORMS, CEFR, CEFR_PCT, RATING_PCT, RATING_LABEL, PENALTY, TITLE_CATALOG, TASKS, SIDE_TEMPLATES } = window.CATALOG;
let ACT = {}, ACTS = []; // built-in + the user's own workout types (rebuildACT)
const TASK_DEF = Object.fromEntries(TASKS.map(t => [t.id, t]));
const STORE = 'ascent.v1';
const LIST_ORDER = ['Penalty', 'Due today', 'Faith', 'Morning', 'Training', 'Study', 'Craft', 'Work', 'Daily', 'Chores', 'Nutrition'];
const DAY_CAP = 1440; // most minutes any one skill (or side quest, or all workouts) can log in one day: 24 h
const DIET_BAND = { cut: [0.90, 1.05], maintain: [0.90, 1.10], bulk: [0.95, 1.10] };
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UNIT = { min: 'min', reps: 'reps', sec: 's', km: 'km', ch: 'ch.', sprints: 'sprints', sessions: 'sessions', pages: 'pages' };
const EST_MIN = { min: 1, reps: 0.05, sec: 1 / 60, km: 6, ch: 4, sprints: 1.5, sessions: 45, pages: 2 };
const CUSTOM_UNITS = [['min', 'Minutes'], ['reps', 'Reps'], ['sec', 'Seconds'], ['km', 'Distance'], ['sessions', 'Sessions'], ['pages', 'Pages']];

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dparse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = dparse(k); d.setDate(d.getDate() + n); return dkey(d); };
const daysBetween = (a, b) => Math.round((dparse(b) - dparse(a)) / 864e5);
const hm = s => { const [h, m] = (s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const roman = n => { const v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [a, r] of v) while (n >= a) { s += r; n -= a; } return s; };
const fmtDate = k => dparse(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const fmtSec = s => `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}`;
const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3.5C14 3.6 9.2 7.6 8 14.6l-.6 2.6 2.6-.6c7-1.2 10.9-6.1 10.5-13.1z"/><path d="M20.5 3.5L9.8 14.2M3.5 20.5l3.9-3.3M14.6 7.2l.4 2.6M11.9 10.2l.3 2.4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10.2 10.5v5.5M13.8 10.5v5.5"/></svg>',
  folder: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.5 6.5h6l2 2h9v10h-17z"/></svg>',
  body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17l5-6 4 3 6-8 3 3"/><path d="M3 21h18"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 01-10 0c0-2.5 1.2-3.8 2-5 .3 1.6 1 2.6 2 3-.5-3.5.2-6.5 1-9z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7M14 8.5v7"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/><path d="M12 15V10M9.5 12.5L12 10l2.5 2.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg>',
  plate: '<svg class="ic-plate" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2.5 19.5l6-9 3.5 5 2.5-3.5 7 7.5z"/><circle cx="17" cy="6.5" r="2.2"/></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M15 3.5V7h3.5M9 11h6M9 14.5h6M9 18h3.5"/></svg>',
  gift: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M2.5 9h19M12 9v11.5M12 9c-3-4.5-7-3-5.5-.5C7.4 9.5 12 9 12 9zm0 0c3-4.5 7-3 5.5-.5C16.6 9.5 12 9 12 9z"/></svg>',
  img: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M5.5 16l4-4.5 3 3 2-2 4 4"/><circle cx="14.5" cy="7.5" r="1.4"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 17l6-6 4 4 7-7.5"/><path d="M15.5 7.5h5v5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="6" opacity=".45"/><path d="M12 8l1.2 2.8 2.8 1.2-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z" fill="currentColor" stroke="none"/></svg>',
  saver: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2.8l7.5 3v5.8c0 4.6-3.2 8-7.5 9.9-4.3-1.9-7.5-5.3-7.5-9.9V5.8z"/><path d="M12 7.6c.7 2.2 3 3.1 3 6.1a3 3 0 0 1-6 0c0-1.4.7-2.2 1.1-2.9.2.9.6 1.5 1.1 1.7-.2-1.9.1-3.6.8-4.9z" fill="currentColor" stroke="none"/></svg>',
  camera: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3.5 8h4l1.8-2.5h5.4L16.5 8h4v11h-17z"/><circle cx="12" cy="13.3" r="3.6"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>',
};

/* ---------- state ---------- */
function fresh() {
  return {
    v: 3, setup: false,
    profile: { name: '', sex: 'M', birthYear: 2003, heightCm: 178, weightKg: 75, units: 'imperial', wake: '07:00', sleep: '23:00', goal: 'maintain', dietQuest: true, start: null },
    lists: ['Faith', 'Morning', 'Training', 'Study', 'Craft', 'Work', 'Daily', 'Chores'],
    skills: {}, customSkills: [], events: [], days: {}, rest: [], pauses: [], lastEval: null,
    tasks: {},      // task quests the user adopted or made: { id: { id, name, unit, sessions, base, max, diff, list, days, active, xp, done, logs, custom, lock } }
    side: [],       // one-time and time-limited quests
    rewards: [],    // rewards earned from side quests
    fx: null,       // { sound, haptic, cele } (null = all on)
    streak: { cur: 0, best: 0 }, pendingPen: null, owed: [], xp: 0,
    workouts: [], food: [], customFoods: [], favs: [], fasts: [], body: [], tests: {}, books: [],
    folders: [],    // the user's own skill folders { id, name, parent }
    hideSk: [], hideTk: [], // built-in skills / tasks the user deleted (hidden, restorable)
    customActs: [], // the user's own workout types { id, name, f, met[3], like, skill, dist, del }
    belts: {},      // martial-art belts { skillId: { ladder (null = standard), hist: [{ id, i, m, date }] } }
    szView: null, szViewJa: null, // season display options (Korean set / Japanese set)
    cal: 'ko',
    theme: null,    // { id: 'seasonal'|'custom'|…, custom: { mode 'color'|'photo', bg, accent, cards 'auto'|'dark'|'light', dim, tint } }      // which 72 micro-seasons: 'ko' (Korean names of the Chinese original) or 'ja' (Japan's 本朝七十二候)
    titles: { auto: {}, claimed: [] },
    stats: { qdone: 0, perfect: 0, penalties: 0, donated: 0, penCleared: 0 },
  };
}
function load() {
  try { const raw = localStorage.getItem(STORE); if (raw) return Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  return fresh();
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { toast('Could not save: storage full or blocked', 'bad'); }
}
let S = load();
let SK = {}, SKL = [];
function rebuildSK() {
  SKL = SKILLS.concat((S.customSkills || []).map(c => Object.assign({ cat: 'Custom', custom: true }, c)));
  SK = Object.fromEntries(SKL.map(s => [s.id, s]));
  rebuildACT();
}
function rebuildACT() {
  ACTS = ACTIVITIES.concat((S.customActs || []).map(a => Object.assign({ custom: true }, a)));
  ACT = Object.fromEntries(ACTS.map(a => [a.id, a]));
}
rebuildSK();
function skState(id) {
  const s = S.skills[id] || (S.skills[id] = { active: false, days: [1, 2, 3, 4, 5], load: 1, xp: 0, min: 0, cnt: 0, done: 0, r: {}, cefr: {}, sm: {} });
  if (!s.sm) s.sm = {};
  if (!s.sc) s.sc = {};
  if (!s.hsm) s.hsm = {}; // historic minutes per custom part (hexagon only, never XP)
  if (s.hist == null) s.hist = 0; // historic minutes for built-in skills (hexagon only)
  return s;
}
const isSkill = c => c && c.unit && !c.moved;
/* deleted built-ins are only hidden (their XP and titles stay; Settings → Deleted defaults restores them) */
const hiddenSk = id => (S.hideSk || []).includes(id), hiddenTk = id => (S.hideTk || []).includes(id);
const isLib = c => isSkill(c) && !hiddenSk(c.id);
/* skill folders: built-in tree (catalog) + the user's own */
const allFolders = () => FOLDERS.concat(S.folders || []);
const folderById = id => allFolders().find(f => f.id === id);
const folderOf = s => s.f && folderById(s.f) ? s.f : 'custom';
const subFolders = pid => allFolders().filter(f => (f.parent || null) === pid);
const workoutFolders = () => subFolders('workout');
function folderPath(id) { const f = folderById(id); if (!f) return ''; const p = f.parent ? folderById(f.parent) : null; return p ? p.name + ' › ' + f.name : f.name; }
function folderOptions(sel, o = {}) { // <option>s for every folder, children indented under their parent
  const out = [], walk = (pid, d) => subFolders(pid).forEach(f => { if (o.skip && o.skip === f.id) return; out.push(`<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${'\u2003'.repeat(d)}${esc(f.name)}</option>`); walk(f.id, d + 1); });
  walk(null, 0); return out.join('');
}
/* ---------- task quests ---------- */
const TASK_XP = { 1: 4, 2: 7, 3: 12 };
const EXP_MULT = { new: .5, some: 1, habit: 1.5 };
const needTask = L => Math.round(15 * Math.pow(L, 1.25));
const taskLevel = t => levelOf(t.xp || 0, needTask);
function taskTarget(t) { // minutes per session: grows 5% per task level, capped at the task's max
  if (t.unit !== 'min') return 0;
  return roundUnit(Math.min(t.max || 999, (t.base || 5) * (1 + 0.05 * (taskLevel(t).L - 1))), 'min');
}
const taskXpPer = t => (TASK_XP[t.diff] || 4) + (t.unit === 'min' ? Math.round(3 * Math.log2(1 + taskTarget(t) / Math.max(1, t.base0 || t.base || 5))) : 0);
const taskTitle = t => t.lock === 'sleep' ? `${t.name} by ${fmtClock(S.profile.sleep)}` : t.name;
function adoptTask(id, over = {}) { // copy a default task into the user's tasks (editable from then on)
  const d = TASK_DEF[id]; if (!d) return null;
  const exp = over.exp || 'some', base = d.unit === 'min' ? roundUnit(d.base * EXP_MULT[exp], 'min') : 0;
  const t = Object.assign({ id: d.id, name: d.name, unit: d.unit, sessions: d.sessions, base, base0: base, max: d.max, diff: d.diff, list: d.list, days: d.days.slice(), lock: d.lock || null, exp, active: true, xp: 0, done: 0, logs: 0, custom: false }, over);
  S.tasks[id] = t; if (t.list && !S.lists.includes(t.list)) S.lists.push(t.list);
  return t;
}
const activeTasks = () => Object.values(S.tasks || {}).filter(t => t.active && !hiddenTk(t.id));
/* v6 -> v7: hygiene quests and Prayer become task quests */
function migrate() {
  if (!S.tasks) S.tasks = {}; if (!S.side) S.side = []; if (!S.rewards) S.rewards = [];
  ['folders', 'hideSk', 'hideTk', 'customActs'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; }); if (!S.belts || typeof S.belts !== 'object') S.belts = {};
  // v11: coins (1 per perfect day; perfect days you already had count) and Streak Savers bought with them
  if (typeof S.coins !== 'number') S.coins = (S.stats && S.stats.perfect) || 0;
  if (typeof S.savers !== 'number') S.savers = 0;
  if (!S.coinTier) S.coinTier = coinRate((S.streak && S.streak.cur) || 0); // v16
  if (S.profile && S.profile.student == null) S.profile.student = false; // v16: students get more vacation days
  // v14: custom penalties. Owed fixed penalties are { k: day, f: id, t: what was owed }; old days with "tier 4" (0%) are Tier III + the $5 donation
  if (!Array.isArray(S.owed)) S.owed = [];
  owedFix();
  Object.values(S.days || {}).forEach(d => { if (d && d.tier === 4 && !d.fn) { d.tier = 3; d.fn = ['Donation · $5']; } });
  if (S.pendingPen && S.pendingPen.tier > 3 && !S.pen) S.pendingPen.tier = 3;
  if (S.stats && !S.stats.paid && S.stats.donated) S.stats.paid = { $: S.stats.donated * 5 };
  // v14: the Otome UI style is now called Rosewood (same look, your colors kept)
  if (S.look) { const L = S.look; if (L.style === 'otome') L.style = 'rosewood'; ['own', 'colors'].forEach(k => { if (L[k] && L[k].otome != null) { if (L[k].rosewood == null) L[k].rosewood = L[k].otome; delete L[k].otome; } }); }
  if ((S.v || 0) >= 3) return;
  S.v = 3;
  if (!S.setup) return;
  ['teeth', 'shower', 'phone'].forEach(id => { if (!S.tasks[id]) adoptTask(id, id === 'teeth' ? { sessions: 1, list: 'Wind Down' } : { list: 'Wind Down' }); });
  const ps = S.skills.prayer;
  if (ps && ps.active && !S.tasks.pray) {
    const base = roundUnit(SK.prayer.base * ps.load, 'min');
    adoptTask('pray', { days: (ps.days || [0, 1, 2, 3, 4, 5, 6]).slice(), base, base0: base, done: ps.done || 0, logs: ps.done || 0, xp: (ps.done || 0) * 7 });
    ps.active = false;
  }
  S.events.forEach(e => { if (e.skill === 'prayer') e.skill = null; });
  ['Morning', 'Chores'].forEach(l => { if (!S.lists.includes(l)) S.lists.push(l); });
  const d = S.days[todayKey()];
  if (d) { // carry today's progress over to the new quests
    const map = { 'h:teeth': 't:teeth', 'h:shower': 't:shower', 'h:phone': 't:phone', 'skill:prayer': 't:pray' };
    d.q.forEach(q => { if (map[q.key]) { q.key = map[q.key]; q.task = q.key.slice(2); if (q.task === 'pray') { delete q.skill; } q.sessions = 1; q.progress = q.done ? 1 : 0; q.xpPer = q.xp; } });
  }
}
/* ---------- seasons (72 micro-seasons) & themes ---------- */
const THEMES = {
  spring: { bg: '#0f1514', s1: 'rgba(22,31,28,.72)', s1s: '#16201d', s2: '#1d2925', line: '#253430', line2: '#31443e', ac: '#f2a9bb', ac2: '#c97f93', acA: 'rgba(242,169,187,.13)', bar: 'rgba(15,21,20,.74)', gold: '#e2c27a' },
  summer: { bg: '#08141a', s1: 'rgba(12,28,34,.72)', s1s: '#0f2229', s2: '#14303a', line: '#1a333c', line2: '#24434e', ac: '#62d6c6', ac2: '#3fa597', acA: 'rgba(98,214,198,.13)', bar: 'rgba(8,20,26,.74)', gold: '#f2c96b' },
  autumn: { bg: '#15100c', s1: 'rgba(33,24,18,.72)', s1s: '#21180f', s2: '#2c2118', line: '#35281e', line2: '#47372a', ac: '#eda25a', ac2: '#b8773a', acA: 'rgba(237,162,90,.13)', bar: 'rgba(21,16,12,.74)', gold: '#f0d08a' },
  winter: { bg: '#0b0f17', s1: 'rgba(18,24,38,.72)', s1s: '#141b2b', s2: '#1b2438', line: '#222c42', line2: '#2f3a55', ac: '#a0c9f2', ac2: '#6f97c6', acA: 'rgba(160,201,242,.13)', bar: 'rgba(11,15,23,.74)', gold: '#e2c27a' },
};
function huStarts(year) {
  const out = [];
  SEASONS.JEOLGI.forEach((j, ji) => j[6].forEach((h, hi) => out.push({ idx: ji * 3 + hi, start: dkey(new Date(year, j[3] - 1, j[4] + hi * 5)) })));
  return out;
}
function seasonOf(k) {
  const y = +k.slice(0, 4), all = [...huStarts(y - 1), ...huStarts(y), ...huStarts(y + 1)].sort((a, b) => a.start < b.start ? -1 : 1);
  let i = 0; for (let n = 0; n < all.length; n++) if (all[n].start <= k) i = n;
  const idx = all[i].idx, ji = Math.floor(idx / 3), j = SEASONS.JEOLGI[ji], hi = idx % 3;
  let nt = i + 1; while (all[nt].idx % 3 !== 0) nt++;
  return { idx, ji, hi, j, h: j[6][hi], season: j[5], start: all[i].start, end: addDays(all[i + 1].start, -1), tStart: all[i - hi].start, tEnd: addDays(all[nt].start, -1) };
}
const huNumber = idx => ((idx - 6 + 72) % 72) + 1; // traditionally counted from 立春
const termNumber = ji => ((ji - 2 + 24) % 24) + 1;
let bgIdx = null, curSeason = null, lookKey = null;
function applySeason() {
  if (!window.SEASONS || !window.SCENES) return null;
  const si = ui.previewHu != null ? seasonOf(huStarts(new Date().getFullYear()).find(h => h.idx === ui.previewHu).start) : seasonOf(todayKey());
  applyLook(si);
  return si;
}
let bgSvg = '', bgUrl = null, themeLook = null, themeUrls = [];
const themePrefetched = {};
function themePrefetch(id) { // fetch both halves of the year's pictures now, so the service worker has them for offline use
  const k = id + themeCal(); if (themePrefetched[k] || !navigator.onLine) return; themePrefetched[k] = 1;
  THEMEFX.images(id, themeCal()).forEach(u => fetch(u).catch(() => { themePrefetched[k] = 0; }));
}
/* ---------- themes ----------
   seasonal = the 72 micro-season scenes (Korean or Japanese set); custom = a solid color or your own photo with an
   accent color; cyber / cottage / village / academia = painted pictures (themes/) that change with the 24 solar terms
   through the layers themes.js draws on top (light, weather, signs). The Korean, Japanese or Chinese picture follows S.cal
   (v15: a picture per season where there is one; the Chinese alley follows the script: mainland or Hong Kong). */
const THEME_LIST = [
  ['seasonal', 'Seasonal', 'The 72 micro-season scenes'], ['custom', 'Custom', 'Your color or photo'],
  ['cyber', 'Cyberpunk', 'Neon alley, changes every solar term'], ['cottage', 'Cottagecore', 'Storybook cottage, changes every solar term'],
  ['village', 'Mountain village', 'Hanok, gasshō or Huizhou village, changes every solar term'], ['academia', 'Academia', 'Light → dark academia, changes every solar term']];
const termTheme = id => window.THEMEFX && THEMEFX.LIST.includes(id);
const themeId = () => { const id = (S.theme && S.theme.id) || 'seasonal'; return THEME_LIST.some(t => t[0] === id && !t[3]) ? id : 'seasonal'; };
const custOpts = () => Object.assign({ mode: 'color', bg: '#22304a', accent: '#e8a85c', cards: 'auto', dim: 20, tint: null }, (S.theme && S.theme.custom) || {});
/* v11: every theme has Auto / Light / Dark (cards, text and icons). Custom keeps it in custom.cards; the others in S.theme.cards[id] */
const cardsPref = id => id === 'custom' ? custOpts().cards : (((S.theme && S.theme.cards) || {})[id] || 'auto');
const SEASON_TINT = { spring: '#8fae9c', summer: '#7fb0b0', autumn: '#c09a78', winter: '#9aa8c0' }; // light look for the Seasonal theme
/* color helpers for building a UI palette from any color */
const hexRgb = h => { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const v = parseInt(h, 16) || 0; return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
const rgbHex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
const rgbaHex = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const lumHex = h => { const c = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const UI_DARK_TEXT = { tx: '#e7e9ec', mu: '#8b929d', mu2: '#5d636d' };
function uiPalette(tint, ac, light) { // tint = the background's color; ac = accent
  if (!light) {
    let a = ac; while (lumHex(a) < .16) a = mixHex(a, '#ffffff', .2);
    const b = mixHex(tint, '#05070a', .8), s1 = mixHex(tint, '#0b0e12', .72), s2 = mixHex(tint, '#11151b', .6);
    return Object.assign({ bg: b, s1: rgbaHex(s1, .74), s1s: s1, s2, line: mixHex(s2, '#ffffff', .07), line2: mixHex(s2, '#ffffff', .14), ac: a, ac2: mixHex(a, '#000000', .28), acA: rgbaHex(a, .14), bar: rgbaHex(b, .78), gold: '#e2c27a' }, UI_DARK_TEXT);
  }
  let a = ac; while (lumHex(a) > .3) a = mixHex(a, '#000000', .15);
  const b = mixHex(tint, '#f7f2e8', .84), s1 = mixHex(tint, '#fbf8f1', .9), s2 = mixHex(tint, '#ece5d8', .82);
  return { bg: b, s1: rgbaHex(s1, .86), s1s: s1, s2, line: mixHex(s2, '#000000', .09), line2: mixHex(s2, '#000000', .17), ac: a, ac2: mixHex(a, '#ffffff', .25), acA: rgbaHex(a, .12), bar: rgbaHex(s1, .9), gold: '#8a6418', tx: '#2a2622', mu: '#6a625a', mu2: '#978e84' };
}
function setVars(v, light) {
  const r = document.documentElement; for (const k in v) r.style.setProperty('--' + k, v[k]);
  r.dataset.ui = light ? 'light' : 'dark';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = v.bg;
}
function setBg(html) { $('#bg').innerHTML = html; }
/* v13: the background (above) and the UI style are separate choices. applyLook draws the background and works out the
   background's palette; applyUi() then applies the UI style: its own colors (styles with pal) or the background's, then
   your colors for that style (cards / buttons & icons / highlights), and sets html[data-sty] for the style's CSS. */
let themeR = null, themeRKey = null, uiKey = null, curBase = null;
function applyLook(si) {
  const id = themeId(), root = document.documentElement; root.dataset.season = si.season; root.dataset.theme = id;
  let pal, light;
  if (id === 'custom') {
    const o = custOpts(), photo = o.mode === 'photo' && custPhoto.url; light = o.cards === 'light' || (o.cards === 'auto' && !photo && lumHex(o.bg) > .45);
    pal = uiPalette(photo ? (o.tint || '#2a3140') : o.bg, o.accent, light);
    const key = ['custom', o.mode, o.bg, o.dim, photo ? custPhoto.url : ''].join('|');
    if (lookKey !== key) {
      lookKey = key; bgIdx = null; bgSvg = ''; themeLook = null;
      setBg(photo ? `<img src="${custPhoto.url}" alt=""><div class="bg-dim" style="opacity:${clamp(o.dim, 0, 70) / 100}"></div>` : `<div class="bg-solid" style="background:${esc(o.bg)}"></div>`);
    }
  } else if (termTheme(id)) {
    const key = ['term', id, themeCal(), si.ji].join('|');
    if (themeRKey !== key) { themeRKey = key; themeR = THEMEFX.render(id, themeCal(), si.ji); }
    const r = themeR, pref = cardsPref(id); light = pref === 'auto' ? r.ui.light : pref === 'light'; themeLook = r;
    pal = uiPalette(r.ui.tint, r.ui.accent, light);
    if (lookKey !== key) {
      lookKey = key; bgIdx = null; bgSvg = '';
      themeUrls.forEach(u => URL.revokeObjectURL(u)); themeUrls = r.layers.map(l => URL.createObjectURL(new Blob([l.svg], { type: 'image/svg+xml' })));
      const pos = `object-position:${Math.round(r.pos * 100)}% 50%`;
      setBg(`<img src="${r.img}" alt="" style="${pos}">` + r.layers.map((l, i) => `<img src="${themeUrls[i]}" alt="" style="${pos};mix-blend-mode:${l.blend}">`).join(''));
      themePrefetch(id);
    }
  } else {
    themeLook = null;
    if (lookKey && !lookKey.startsWith('seasonal')) bgIdx = null;
    lookKey = 'seasonal'; light = cardsPref('seasonal') === 'light';
    pal = light ? uiPalette(SEASON_TINT[si.season], THEMES[si.season].ac, true) : Object.assign({}, THEMES[si.season], UI_DARK_TEXT);
    const bgKey = si.idx + ':' + artCal();
    if (bgIdx !== bgKey) { // drawn once into an <img> (cheap to composite under the blurred cards)
      bgSvg = SCENES.render(si.h[3], si.season, si.idx, artCal()); bgIdx = bgKey;
      try { if (bgUrl) URL.revokeObjectURL(bgUrl); bgUrl = URL.createObjectURL(new Blob([bgSvg], { type: 'image/svg+xml' })); setBg(`<img src="${bgUrl}" alt="">`); }
      catch (e) { setBg(bgSvg); }
    }
  }
  curBase = { pal, light };
  // is the picture itself bright? (text outside the cards needs a stronger veil when the UI's brightness disagrees with it)
  root.dataset.bgl = id === 'custom' ? (lumHex(custOpts().mode === 'photo' && custPhoto.url ? custOpts().tint || '#2a3140' : custOpts().bg) > .45 ? '1' : '0') : termTheme(id) && themeR && themeR.ui.light ? '1' : '0';
  applyUi();
}
/* ---------- UI styles (v13) ----------
   pal = the style's own colors (used unless "Colors from: My background"); bg = the background it is matched with by
   "Match my background". Fonts live in fonts/ (Latin subsets, SIL OFL; fonts/LICENSE.txt) and are cached by sw.js. */
const UI_STYLES = [
  { id: 'classic', n: 'Classic', d: 'Frosted glass cards and clean type. The original look.' },
  { id: 'retro', n: 'Retro Tech', d: 'Boxy chamfered panels, CRT scanlines and terminal type.', bg: 'cyber' },
  { id: 'illum', n: 'Illuminated', d: 'A medieval manuscript: blackletter titles, drop caps, gold rules.', bg: 'academia', pal: { card: '#f1e4c6', bg: '#cdb88b', accent: '#8c2a1c', gold: '#93700f', light: true, alpha: .93 } },
  { id: 'ink', n: 'Ink & Brush', d: 'Rice paper, brush-written titles and vermilion seals.', bg: 'village', pal: { card: '#f4efe3', bg: '#d6cdbb', accent: '#1f1c19', gold: '#bb3a26', light: true, alpha: .92 } },
  { id: 'story', n: 'Storybook', d: 'Stitched cottage cards, a soft serif and garden colors.', bg: 'cottage', pal: { card: '#fbf5e6', bg: '#e3d8bc', accent: '#55854a', gold: '#b0642a', light: true, alpha: .9 } },
  { id: 'analog', n: 'Analog', d: 'A paper planner: ruled pages, typewriter ink and washi tape.', pal: { card: '#fbfaf3', bg: '#e6e0d0', accent: '#2c4f9e', gold: '#c0392b', light: true, alpha: .97 } },
  { id: 'mainframe', n: 'Mainframe', d: '1960s analog computing: steel console panels, glowing Nixie numbers, panel lamps and switch keys.', pal: { card: '#2c2f2c', bg: '#151715', accent: '#ff8f3a', gold: '#5fe8c0', light: false, alpha: .94, extra: { tx: '#ebe4d2', mu: '#aaa593', mu2: '#807c6e', line: '#40443f', line2: '#565a53' } } },
  { id: 'system', n: 'System', d: 'Manhwa status windows: glowing frames, brackets and system alerts.', pal: { card: '#0b1834', bg: '#040a18', accent: '#47c9ff', gold: '#ffd166', light: false, alpha: .84 } },
  { id: 'pixel', n: 'Pixel Quest', d: '8-bit RPG menus: pixel frames, pixel fonts and a menu cursor.', pal: { card: '#1d2b8f', bg: '#0b1240', accent: '#ffd84a', gold: '#ffd84a', light: false, alpha: .95, extra: { tx: '#f4f4f4', mu: '#c3c8f0', mu2: '#8f97d6' } } },
  { id: 'rosewood', n: 'Rosewood', d: 'Quiet elegance: a script serif, rose-gold framed cards and a little sparkle.', pal: { card: '#fff6f4', bg: '#ecd9da', accent: '#b4566f', gold: '#a87d52', light: true, alpha: .9 } },
  { id: 'pastel', n: 'Pastel Pop', d: 'Bubbly sticker cards, rounded type and candy colors.', pal: { card: '#ffffff', bg: '#fde6f1', accent: '#f0609f', gold: '#f08a1c', light: true, alpha: .93, extra: { line: '#f8d3e4', line2: '#f0acc9' } } },
  { id: 'minimal', n: 'Minimal', d: 'Flat, solid cards with no blur. Easiest to read and lightest on battery.' },
  { id: 'web1', n: 'Web 1.0', d: 'Just for laughs: Comic Neue, WordArt, beveled buttons and a visitor counter.', joke: true, pal: { card: '#c0c0c0', bg: '#008080', accent: '#000080', gold: '#b000b0', light: true, alpha: 1, extra: { tx: '#000000', mu: '#303030', mu2: '#505050', line: '#808080', line2: '#404040' } } },
];
const STYLE = Object.fromEntries(UI_STYLES.map(x => [x.id, x]));
const lookOpts = () => { const L = Object.assign({ style: 'auto', own: {}, colors: {} }, S.look || {}); L.own = L.own || {}; L.colors = L.colors || {}; return L; };
const matchStyle = tid => (UI_STYLES.find(x => x.bg === tid) || STYLE.classic).id;
const styleId = () => { const L = lookOpts(); return L.style === 'auto' ? matchStyle(themeId()) : STYLE[L.style] ? L.style : 'classic'; };
const useOwn = (sid, auto = lookOpts().style === 'auto') => { const L = lookOpts(); return !!STYLE[sid].pal && (L.own[sid] != null ? !!L.own[sid] : !auto); }; // Match: the background's colors by default
const txFor = light => light ? { tx: '#2a2622', mu: '#6a625a', mu2: '#978e84' } : UI_DARK_TEXT;
function cardPal(card, light, alpha = .86) { // every surface color from one card color
  const k = light ? '#000000' : '#ffffff', s2 = mixHex(card, k, light ? .05 : .08);
  return Object.assign({ bg: mixHex(card, '#000000', light ? .1 : .45), s1: rgbaHex(card, alpha), s1s: card, s2, line: mixHex(card, k, .12), line2: mixHex(card, k, .22), bar: rgbaHex(card, .92) }, txFor(light));
}
const accPal = (ac, light) => ({ ac, ac2: mixHex(ac, light ? '#ffffff' : '#000000', .25), acA: rgbaHex(ac, light ? .12 : .14) });
function uiFor(sid, auto, base = curBase) { // the palette a style gets with the current background and your colors
  const st = STYLE[sid], c = lookOpts().colors[sid] || {}, own = useOwn(sid, auto);
  let v = Object.assign({}, base ? base.pal : THEMES.winter), lt = base ? base.light : false;
  if (own) { const p = st.pal; lt = p.light; v = Object.assign(cardPal(p.card, lt, p.alpha), { bg: p.bg }, accPal(p.accent, lt), { gold: p.gold }, p.extra || {}); }
  if (c.card) { const was = v; lt = lumHex(c.card) > .22; v = Object.assign({}, was, cardPal(c.card, lt, own ? st.pal.alpha : .86)); if (!c.accent) Object.assign(v, accPal(was.ac, lt)); }
  if (c.accent) Object.assign(v, accPal(c.accent, lt));
  if (c.gold) v.gold = c.gold;
  v.acB = rgbaHex(v.ac, .5); v.acG = rgbaHex(v.ac, .35); v['ac-tx'] = lumHex(v.ac) > .2 ? '#10161a' : '#ffffff';
  v.goldA = rgbaHex(v.gold, .16); v.goldB = rgbaHex(v.gold, .5);
  return { v, lt };
}
function applyUi() {
  const sid = styleId(), u = uiFor(sid), key = sid + JSON.stringify(u); if (key === uiKey) return; uiKey = key;
  setVars(u.v, u.lt); document.documentElement.dataset.sty = sid;
}
const pvVars = v => ['bg', 's1', 's1s', 's2', 'line', 'line2', 'ac', 'ac2', 'acA', 'acB', 'acG', 'ac-tx', 'gold', 'goldA', 'goldB', 'tx', 'mu', 'mu2', 'bar'].map(k => `--${k}:${v[k]}`).join(';');
/* the custom photo lives in IndexedDB (too big for localStorage); a data-URL copy rides along in backups */
const IDB = {
  db: null,
  open() { return this.db ? Promise.resolve(this.db) : new Promise((res, rej) => { const r = indexedDB.open('deificatio', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
  async run(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const q = fn(db.transaction('files', mode).objectStore('files')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  get(k) { return this.run('readonly', s => s.get(k)); }, set(k, v) { return this.run('readwrite', s => s.put(v, k)); }, del(k) { return this.run('readwrite', s => s.delete(k)); },
};
const custPhoto = { url: null, data: null };
const blobToData = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
async function loadCustomPhoto() {
  try { const b = await IDB.get('bgPhoto'); if (custPhoto.url) URL.revokeObjectURL(custPhoto.url); custPhoto.url = b ? URL.createObjectURL(b) : null; custPhoto.data = b ? await blobToData(b) : null; }
  catch (e) { custPhoto.url = null; custPhoto.data = null; }
  lookKey = null;
}
async function pickPhoto(file) { // shrink to about screen size, keep as JPEG, remember its average color for the UI tint
  if (!file) return;
  try {
    const url = URL.createObjectURL(file), img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
    const sm = document.createElement('canvas'); sm.width = sm.height = 8; const sg = sm.getContext('2d'); sg.drawImage(cv, 0, 0, 8, 8);
    const px = sg.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0; for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', .86));
    await IDB.set('bgPhoto', blob);
    custSet(o => { o.mode = 'photo'; o.tint = rgbHex([r / 64, g / 64, b / 64]); });
    await loadCustomPhoto(); ui.season = applySeason(); themeRefresh(); toast('Photo set as your background', 'ti');
  } catch (e) { toast('Could not use that image', 'bad'); }
}
function custSet(fn) { const o = custOpts(); fn(o); S.theme = Object.assign({ id: 'custom' }, S.theme || {}, { custom: o }); save(); }
/* save the current scene as a phone wallpaper (PNG at the screen's real resolution) */
function saveWallpaper() {
  if (themeLook) return saveThemeWallpaper(themeLook);
  const dpr = Math.min(3, window.devicePixelRatio || 1), w = Math.round(Math.min(screen.width, screen.height) * dpr), h = Math.round(Math.max(screen.width, screen.height) * dpr);
  const o = custOpts(), cust = themeId() === 'custom', photo = cust && o.mode === 'photo' && custPhoto.url;
  const img = new Image(), url = photo ? null : bgSvg ? URL.createObjectURL(new Blob([bgSvg], { type: 'image/svg+xml' })) : null;
  img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    const iw = img.naturalWidth || SCENES.W, ih = img.naturalHeight || SCENES.H, s = Math.max(w / iw, h / ih); g.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s); if (url) URL.revokeObjectURL(url);
    if (photo && o.dim) { g.fillStyle = `rgba(0,0,0,${clamp(o.dim, 0, 70) / 100})`; g.fillRect(0, 0, w, h); }
    wallpaperOut(cv);
  };
  img.onerror = () => toast('Could not draw the wallpaper', 'bad');
  if (cust && !photo) { const c = document.createElement('canvas'); c.width = c.height = 4; const x = c.getContext('2d'); x.fillStyle = o.bg; x.fillRect(0, 0, 4, 4); img.src = c.toDataURL(); }
  else img.src = photo || url;
}
function wallpaperOut(cv) {
  cv.toBlob(b => {
    const si = ui.season, name = `deificatio-wallpaper-${huNumber(si.idx)}.png`, file = new File([b], name, { type: 'image/png' });
    const dl = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Wallpaper saved to Downloads'); };
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Deificatio wallpaper' }).catch(e => { if (!e || e.name !== 'AbortError') dl(); }); else dl();
  }, 'image/png');
}
async function saveThemeWallpaper(r) {
  const dpr = Math.min(3, window.devicePixelRatio || 1), w = Math.round(Math.min(screen.width, screen.height) * dpr), h = Math.round(Math.max(screen.width, screen.height) * dpr);
  const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  try {
    const urls = r.layers.map(l => URL.createObjectURL(new Blob([l.svg], { type: 'image/svg+xml' })));
    const imgs = await Promise.all([load(r.img), ...urls.map(load)]); urls.forEach(u => URL.revokeObjectURL(u));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    const s = Math.max(w / THEMEFX.W, h / THEMEFX.H), dw = THEMEFX.W * s, dh = THEMEFX.H * s, x = (w - dw) * r.pos, y = (h - dh) / 2;
    imgs.forEach((im, i) => { g.globalCompositeOperation = i ? (r.layers[i - 1].blend === 'normal' ? 'source-over' : r.layers[i - 1].blend) : 'source-over'; g.drawImage(im, x, y, dw, dh); });
    g.globalCompositeOperation = 'source-over'; wallpaperOut(cv);
  } catch (e) { toast('Could not draw the wallpaper', 'bad'); }
}
const fmtShort = k => dparse(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
/* ---------- season display options ----------
   Three levels (season 四季 / solar term 節氣 / micro-season 候) × five parts:
   hj = hanja, ko = Korean reading (음), kom = Korean meaning (뜻), rom = romanized reading, en = English meaning.
   One level (micro or minor) and one language (hj / ko / en / rom) form the large main text. */
const SZ_LV = ['season', 'term', 'hu'];
const SZ_LV_NAME = { season: 'Major season', term: 'Minor season', hu: 'Micro-season' };
/* Two naming sets. Korean: hj hanja, ko reading 음, kom meaning 뜻, rom romanized, en English.
   Japanese: hj kanji, ja kana reading (+ jm, a modern-Japanese meaning shown with the reading for the classical kō), rom romaji, en English. */
const SZ_CFG = {
  ko: { key: 'szView', mains: [['hj', '漢字'], ['ko', '한글'], ['en', 'English'], ['rom', 'Romanized']], gloss: { hj: null, ko: 'kom', en: 'rom', rom: 'en' },
    def: { season: { hj: 1, ko: 0, kom: 1, rom: 0, en: 0 }, term: { hj: 1, ko: 1, kom: 0, rom: 0, en: 1 }, hu: { hj: 1, ko: 1, kom: 0, rom: 0, en: 1 } },
    lang: { hj: 'ko', ko: 'ko', kom: 'ko' }, order: lv => lv === 'season' ? ['hj', 'kom', 'ko', 'rom', 'en'] : ['hj', 'ko', 'kom', 'rom', 'en'], // 冬 겨울 동 (훈음 order)
    rows: [['Hanja 漢字', [['hj', 'Characters']]], ['Korean 한국어', [['ko', 'Sound 음'], ['kom', 'Meaning 뜻']]], ['English', [['rom', 'Sound (romanized)'], ['en', 'Meaning']]]],
    terms: '二十四節氣', term: '節氣', note: "The main language's second part (Korean 뜻, or the romanized/English pair) sits right under the main text." },
  ja: { key: 'szViewJa', mains: [['hj', '漢字'], ['ja', 'かな'], ['en', 'English'], ['rom', 'Romaji']], gloss: { hj: 'ja', ja: 'jm', en: 'rom', rom: 'en' },
    def: { season: { hj: 1, ja: 1, rom: 0, en: 0 }, term: { hj: 1, ja: 1, rom: 0, en: 1 }, hu: { hj: 1, ja: 1, rom: 0, en: 1 } },
    lang: { hj: 'ja', ja: 'ja', jm: 'ja' }, order: () => ['hj', 'ja', 'rom', 'en'],
    rows: [['Kanji 漢字', [['hj', 'Characters']]], ['Japanese 日本語', [['ja', 'Reading 読み']]], ['English', [['rom', 'Sound (romaji)'], ['en', 'Meaning']]]],
    terms: '二十四節気', term: '節気', note: 'The kō are classical, so wherever the Japanese reading sits under the main text, a modern-Japanese meaning (意味) comes with it.' },
  /* v14 Chinese: hz = the characters in your script (简体 simplified by default, or 繁體 traditional), alt = the other script, py = pinyin, en = English */
  zh: { key: 'szViewZh', get mains() { return [['hz', zhTrad() ? '漢字' : '汉字'], ['py', 'Pinyin'], ['en', 'English']]; }, gloss: { hz: 'py', py: 'hz', en: 'py' },
    def: { season: { hz: 1, alt: 0, py: 1, en: 0 }, term: { hz: 1, alt: 0, py: 1, en: 1 }, hu: { hz: 1, alt: 0, py: 1, en: 1 } },
    get lang() { return zhTrad() ? { hz: 'zh-Hant', alt: 'zh-Hans' } : { hz: 'zh-Hans', alt: 'zh-Hant' }; }, order: () => ['hz', 'alt', 'py', 'en'],
    get rows() { return [['Chinese 中文', [['hz', zhTrad() ? 'Characters 繁體' : 'Characters 简体'], ['alt', zhTrad() ? 'Simplified 简体' : 'Traditional 繁體']]], ['English', [['py', 'Sound (pinyin)'], ['en', 'Meaning']]]]; },
    get terms() { return zhTrad() ? '二十四節氣' : '二十四节气'; }, get term() { return zhTrad() ? '節氣' : '节气'; },
    note: 'The same 72 as the Korean set (the original Chinese one). Switch between simplified and traditional characters above; the other script can show as well.' },
};
const calSet = () => S.cal === 'ja' ? 'ja' : S.cal === 'zh' ? 'zh' : 'ko';
const zhTrad = () => S.zhScript === 'trad'; // v14: Chinese names in traditional characters (simplified by default)
const calLang = () => calSet() === 'zh' ? (zhTrad() ? 'zh-Hant' : 'zh-Hans') : calSet(); // the lang attribute for the set's own words
const artCal = () => calSet() === 'ja' ? 'ja' : 'ko'; // the 72 scenes: the Chinese set uses the Korean scenes (the same 72)
// the solar-term pictures: Chinese gets its own (mainland for simplified, Hong Kong for traditional) once the art is in
const themeCal = () => calSet() === 'zh' ? (zhTrad() ? 'zht' : 'zhs') : calSet();
const LATIN_PARTS = ['en', 'rom', 'py'];
const SZC = () => SZ_CFG[calSet()];
function szOpts() {
  const C = SZC(), o = S[C.key] || {}, sh = o.show || {};
  return { level: o.level === 'hu' ? 'hu' : 'term', main: Object.prototype.hasOwnProperty.call(C.gloss, o.main) ? o.main : 'en',
    show: Object.fromEntries(SZ_LV.map(l => [l, Object.assign({}, C.def[l], sh[l] || {})])) };
}
function szSet(fn) { const o = szOpts(); fn(o); S[SZC().key] = o; save(); }
function szText(lv, x) { // x: a seasonOf() result, or { season } | { j, ji } | { h, idx }
  if (calSet() === 'zh') {
    const Z = SEASONS.ZH, tr = zhTrad(), pk = a => ({ hz: a[tr ? 1 : 0], alt: a[tr ? 0 : 1] });
    if (lv === 'season') { const n = Z.NAMES[x.season]; return Object.assign(pk(n), { py: n[2], en: n[3] }); }
    if (lv === 'term') { const t = Z.TERMS[x.ji]; return Object.assign(pk(t), { py: t[2], en: SEASONS.JEOLGI[x.ji][2] }); }
    const h = Z.HU[x.idx]; return Object.assign(pk(h), { py: h[2], en: SEASONS.JEOLGI[Math.floor(x.idx / 3)][6][x.idx % 3][2] });
  }
  if (calSet() === 'ja') {
    const J = SEASONS.JA;
    if (lv === 'season') { const n = J.NAMES[x.season]; return { hj: n[0], ja: n[1], rom: n[2], en: n[3] }; }
    if (lv === 'term') { const t = J.TERMS[x.ji]; return { hj: t[0], ja: t[1], rom: t[2], en: SEASONS.JEOLGI[x.ji][2] }; }
    const k = J.KO[x.idx]; return { hj: k[0], ja: k[1], jm: k[2], rom: k[3], en: k[4] };
  }
  if (lv === 'season') { const n = SEASONS.NAMES[x.season]; return { hj: n[0], kom: n[1], en: n[2], ko: n[3], rom: n[4] }; }
  if (lv === 'term') { const j = x.j; return { hj: j[0], ko: j[1], en: j[2], kom: j[7], rom: j[8] }; }
  const h = x.h; return { hj: h[0], ko: h[1], en: h[2], kom: h[4], rom: h[5] };
}
const szOrder = lv => SZC().order(lv);
const szVisible = (o, lv) => szOrder(lv).filter(p => o.show[lv][p] || (lv === o.level && p === o.main));
const szLang = p => SZC().lang[p];
const szSpan = (p, t, tag = 'span') => `<${tag} class="p-${p}"${szLang(p) ? ` lang="${szLang(p)}"` : ''}>${esc(t)}</${tag}>`;
const SZ_DOT = '<i class="dot"> · </i>';
function seasonHero(si, preview) {
  if (!si) return '';
  const C = SZC(), o = szOpts(), L = o.level, mi = SZ_LV.indexOf(L), gl = C.gloss[o.main], T = lv => szText(lv, si);
  const top = SZ_LV.slice(0, mi).map(lv => { const t = T(lv); return szVisible(o, lv).map(p => szSpan(p, t[p])).join('<i class="ps"></i>'); }).filter(Boolean);
  const mt = T(L), latin = LATIN_PARTS.includes(o.main), kana = o.main === 'ja';
  // Japanese: the kana reading sits under the kanji, and the classical kō bring their modern meaning (jm) with it
  const glossOn = gl && (gl === 'jm' ? !!mt.jm : o.show[L][gl] && mt[gl]);
  const gloss = glossOn ? szSpan(gl, mt[gl]) + (gl === 'ja' && mt.jm ? `<div class="sz-x" lang="ja">${esc(mt.jm)}</div>` : '') : '';
  const bottom = szVisible(o, L).filter(p => p !== o.main && p !== gl).map(p => szSpan(p, mt[p])).join(SZ_DOT);
  const sub = SZ_LV.slice(mi + 1).map(lv => { const t = T(lv); return szVisible(o, lv).map(p => szSpan(p, t[p])).join(SZ_DOT); }).filter(Boolean);
  const date = L === 'hu' ? `${fmtShort(si.start)} – ${fmtShort(si.end)} · 七十二候 ${huNumber(si.idx)}/72`
    : `${fmtShort(si.tStart)} – ${fmtShort(si.tEnd)} · ${C.terms} ${termNumber(si.ji)}/24 · 候 ${huNumber(si.idx)}/72`;
  return `<div class="season${preview ? ' prev' : ''}"${preview ? '' : ' data-a="seasonList" role="button" aria-label="Browse the 72 micro-seasons"'}>
    ${top.length ? `<div class="sz-top">${top.map(g => `<span class="g">${g}</span>`).join('<span class="sep"> · </span>')}</div>` : ''}
    <div class="sz-h${latin ? ' lat' : ''}${kana ? ' kana' : ''}"${latin ? '' : ` lang="${C.lang[o.main] || 'ko'}"`}>${esc(mt[o.main])}</div>
    ${gloss ? `<div class="sz-g">${gloss}</div>` : ''}${bottom ? `<div class="sz-k">${bottom}</div>` : ''}
    ${sub.map(s => `<div class="sz-s">${s}</div>`).join('')}
    <div class="sz-d">${date}</div>
  </div>${!preview && ui.previewHu != null ? `<div class="preview row"><span class="sp small">Previewing another micro-season</span><button class="btn-s" data-a="seasonReset">Back to today</button></div>` : ''}`;
}
/* ---------- Home text (v11): season names, the date & time, or your own words; works with every theme ----------
   S.homeText = null (season names) | { mode 'season'|'clock'|'custom' (the main text), main, sub, time '12'|'24'|'off', date (HT_DATES id),
     extra: { season|clock|custom: null | 'above'|'below'|'left'|'right' } }  (v14: the other two can show as smaller subtexts) */
const HT_POS = [['', 'Off'], ['above', 'Above'], ['below', 'Below'], ['left', 'Left'], ['right', 'Right']];
const htOpts = () => { const o = Object.assign({ mode: 'season', main: '', sub: '', time: '12', date: 'long', wd: true }, S.homeText || {}); o.extra = Object.assign({ season: null, clock: null, custom: null }, o.extra || {}); return o; };
const HT_MODES = [['season', 'Season names'], ['clock', 'Date & time'], ['custom', 'My own words']];
const HT_TIMES = [['12', '12-hour'], ['24', '24-hour'], ['off', 'No time']];
const HT_DATES = ['long', 'med', 'short', 'us', 'eu', 'iso', 'ko', 'kohj', 'ja', 'zh', 'off'];
const HT_WD = ['long', 'med', 'ko', 'kohj', 'ja', 'zh']; // formats that can show the weekday (v16: o.wd false hides it)
// v16: the lang a date is written in (so the UI style's CJK font picks it up); kohj = Korean in hanja
const htDateLang = f => f === 'ko' || f === 'kohj' ? 'ko' : f === 'ja' ? 'ja' : f === 'zh' ? (calSet() === 'zh' && zhTrad() ? 'zh-Hant' : 'zh-Hans') : '';
const htLangAttr = f => htDateLang(f) ? ` lang="${htDateLang(f)}"` : '';
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function htDate(d, f, wd = true) {
  const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate(), w = d.getDay(), W = s => wd ? s : '';
  switch (f) {
    case 'long': return `${W(WDL[w] + ', ')}${MON[m]} ${dd}`;
    case 'med': return `${W(WDL[w].slice(0, 3) + ', ')}${MON[m].slice(0, 3)} ${dd}, ${y}`;
    case 'short': return `${MON[m]} ${dd}, ${y}`;
    case 'us': return `${pad(m + 1)}/${pad(dd)}/${y}`;
    case 'eu': return `${pad(dd)}/${pad(m + 1)}/${y}`;
    case 'iso': return `${y}-${pad(m + 1)}-${pad(dd)}`;
    // v15: the weekday in full, no brackets (on Mondays "(월)" / "（月）" read like a second month marker)
    case 'ko': return `${y}년 ${m + 1}월 ${dd}일${W(` ${'일월화수목금토'[w]}요일`)}`;
    case 'kohj': return `${y}年 ${m + 1}月 ${dd}日${W(` ${'日月火水木金土'[w]}曜日`)}`; // v16: Korean written in hanja
    case 'ja': return `${y}年${m + 1}月${dd}日${W(` ${'日月火水木金土'[w]}曜日`)}`;
    case 'zh': return `${y}年${m + 1}月${dd}日${W(` 星期${'日一二三四五六'[w]}`)}`;
    default: return '';
  }
}
function htTime(d, f) {
  if (f === '24') return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (f === '12') return `${d.getHours() % 12 || 12}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
  return '';
}
const HT_EX = 'Carpe Diem';
// the smaller custom line keeps at most three line breaks (four short lines)
const htLines = v => { const ls = String(v || '').replace(/\r/g, '').split('\n'); return ls.length > 4 ? ls.slice(0, 3).concat(ls.slice(3).join(' ')).join('\n') : ls.join('\n'); };
function htMainHtml(o, preview) { // the main (big) text
  if (o.mode === 'clock') {
    const now = new Date(), t = htTime(now, o.time), dt = htDate(now, o.date, o.wd), big = t || dt, small = t ? dt : '';
    return `<div class="season ht clock${preview ? ' prev' : ''}"><div class="sz-h${t || !htDateLang(o.date) ? ' lat' : ''}" data-clk="${t ? 't' : 'd'}"${t ? '' : htLangAttr(o.date)}>${esc(big || ' ')}</div>${small ? `<div class="sz-g" data-clk="d"${htLangAttr(o.date)}>${esc(small)}</div>` : ''}</div>`;
  }
  if (o.mode === 'custom') {
    const main = (o.main || '').trim() || (preview ? HT_EX : ''), sub = htLines(o.sub).trim();
    return `<div class="season ht custom${preview ? ' prev' : ''}"><div class="sz-h${textLang(main) ? '' : ' lat'}${o.main ? '' : ' ph'}"${langAttr(main)}>${esc(main)}</div>${sub ? `<div class="sz-g ml"${langAttr(sub)}>${esc(sub)}</div>` : ''}</div>`;
  }
  return seasonHero(ui.season, preview);
}
function htSubHtml(m, o, preview) { // one of the other two, small
  if (m === 'clock') {
    const now = new Date(), t = htTime(now, o.time), dt = htDate(now, o.date, o.wd); if (!t && !dt) return '';
    const dl = htLangAttr(o.date);
    return `<div class="hts hts-clock">${t ? `<div class="hts-m" data-clk="t">${esc(t)}</div>` : ''}${dt ? `<div class="${t ? 'hts-s' : 'hts-m'}" data-clk="d"${dl}>${esc(dt)}</div>` : ''}</div>`;
  }
  if (m === 'custom') {
    const main = (o.main || '').trim(), sub = htLines(o.sub).trim(); if (!main && !sub && !preview) return '';
    return `<div class="hts hts-custom">${main || !sub ? `<div class="hts-m${main ? '' : ' ph'}"${langAttr(main)}>${esc(main || HT_EX)}</div>` : ''}${sub ? `<div class="hts-s ml"${langAttr(sub)}>${esc(sub)}</div>` : ''}</div>`;
  }
  const si = ui.season; if (!si) return '';
  const C = SZC(), so = szOpts(), mt = szText(so.level, si), gl = C.gloss[so.main], lat = LATIN_PARTS.includes(so.main);
  const g2 = gl && mt[gl] ? gl : so.main !== 'en' && mt.en ? 'en' : null, g = g2 ? szSpan(g2, mt[g2]) : ''; // hanja main: its English meaning under it
  return `<div class="hts hts-season"${preview ? '' : ' data-a="seasonList" role="button" aria-label="Browse the 72 micro-seasons"'}><div class="hts-m${lat ? ' lat' : ''}"${lat ? '' : ` lang="${C.lang[so.main] || 'ko'}"`}>${szSpan(so.main, mt[so.main])}</div>${g ? `<div class="hts-s">${g}</div>` : ''}</div>`;
}
function homeHero(preview) { // the big text at the top of Home, with any subtexts around it
  const o = htOpts(), main = htMainHtml(o, preview);
  const ex = HT_MODES.map(m => m[0]).filter(m => m !== o.mode && o.extra[m]);
  if (!ex.length) return main;
  const at = pos => ex.filter(m => o.extra[m] === pos).map(m => htSubHtml(m, o, preview)).join('');
  const above = at('above'), below = at('below'), left = at('left'), right = at('right');
  if (!above && !below && !left && !right) return main;
  return `<div class="ht-wrap${preview ? ' prev' : ''}">${above ? `<div class="ht-ab top">${above}</div>` : ''}${left || right ? `<div class="ht-row">${left ? `<div class="ht-side l">${left}</div>` : ''}<div class="ht-main">${main}</div>${right ? `<div class="ht-side r">${right}</div>` : ''}</div>` : main}${below ? `<div class="ht-ab bot">${below}</div>` : ''}</div>`;
}
function tickClock() { // keeps the clock on Home (and its preview) current
  const els = document.querySelectorAll('[data-clk]'); if (!els.length) return;
  const o = htOpts(), now = new Date();
  let changed = false;
  els.forEach(el => { const v = el.dataset.clk === 't' ? htTime(now, o.time) : htDate(now, o.date, o.wd); if (el.textContent !== v) { el.textContent = v; changed = true; } });
  if (changed) fitWords();
}
/* v16: your own words in Korean / Japanese / Chinese get a lang (so the UI style's CJK font is used for them too) */
function textLang(t) {
  t = String(t || '');
  if (/[\uac00-\ud7a3\u3130-\u318f]/.test(t)) return 'ko';
  if (/[\u3040-\u30ff]/.test(t)) return 'ja';
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(t)) return calSet() === 'ja' ? 'ja' : calSet() === 'ko' ? 'ko' : calLang();
  return '';
}
const langAttr = t => textLang(t) ? ` lang="${textLang(t)}"` : '';
/* v16: words without spaces (hangul, hanja, kana, hanzi phrases, dates) never break mid-word (CSS keep-all + nowrap dates);
   when one doesn't fit its space (a narrow side column, a long main phrase) it's shrunk to fit instead, down to 45% */
const FIT_SEL = '.season .sz-h, .season .sz-g, .season .sz-k, .season .sz-s, .season .sz-d, .hts-m, .hts-s, .sz-mini b, .hu > span, .jg-h b';
function fitWords(root = document) {
  root.querySelectorAll(FIT_SEL).forEach(el => {
    el.style.fontSize = ''; const w = el.clientWidth; if (!w || el.scrollWidth <= w + 1) return;
    const fs = parseFloat(getComputedStyle(el).fontSize); let k = w / el.scrollWidth;
    for (let i = 0; i < 4; i++) { el.style.fontSize = Math.max(fs * .45, fs * k * .98).toFixed(2) + 'px'; if (el.scrollWidth <= w + 1 || fs * k * .98 <= fs * .45) break; k *= w / el.scrollWidth; }
  });
}
window.addEventListener('resize', () => { clearTimeout(ui.fitT); ui.fitT = setTimeout(() => fitWords(), 120); });
if (document.fonts) document.fonts.addEventListener('loadingdone', () => fitWords()); // a style's CJK font arriving changes widths
setInterval(tickClock, 1000);
function htCtl(m, o, setup) { // the settings for one kind of text
  const now = new Date();
  if (m === 'clock') return `<label>Time</label><div class="seg tight">${HT_TIMES.map(([v, n]) => `<button class="${o.time === v ? 'on' : ''}" data-a="htTime" data-id="${v}">${n}</button>`).join('')}</div>
    <label>Date</label><select data-c="htDate" aria-label="Date format">${HT_DATES.map(v => `<option value="${v}" ${o.date === v ? 'selected' : ''}>${v === 'off' ? 'No date' : esc(htDate(now, v, o.wd)) + (v === 'kohj' ? ' (漢字)' : '')}</option>`).join('')}</select>
    ${HT_WD.includes(o.date) ? `<label>Day of the week</label><div class="seg tight">${[[1, 'Show'], [0, 'Hide']].map(([v, n]) => `<button class="${!!o.wd === !!v ? 'on' : ''}" data-a="htWd" data-id="${v}">${n}</button>`).join('')}</div>` : ''}
    ${o.time === 'off' && o.date === 'off' ? '<div class="bad small" style="margin-top:6px">Pick a time or a date to show.</div>' : ''}`;
  if (m === 'custom') return `<label>${o.mode === 'custom' ? 'Big text' : 'Your words'}</label><input data-i="ht" data-k="main" value="${esc(o.main)}" maxlength="40" placeholder="e.g. ${HT_EX}">
    <label>Smaller line (optional, up to 4 lines)</label><textarea data-i="ht" data-k="sub" rows="2" maxlength="160" placeholder="e.g. 2 Cor 3:18">${esc(o.sub)}</textarea>`;
  return setup ? '' : `<p class="mu2 small">${o.mode === 'season' ? 'Choose which names the season header shows' : 'The season names use your choices'} in Season display below.</p>`;
}
function htFields(setup) { // the controls for the Home text (Settings card and setup)
  const o = htOpts();
  let h = `<div class="seg tight">${HT_MODES.map(([v, n]) => `<button class="${o.mode === v ? 'on' : ''}" data-a="htMode" data-id="${v}">${n}</button>`).join('')}</div>${htCtl(o.mode, o, setup)}`;
  const others = HT_MODES.filter(m => m[0] !== o.mode);
  h += `<div class="ht-also"><label>Also show, smaller (optional)</label>${others.map(([m, n]) => `<div class="ht-ex"><span class="ht-exn">${n}</span><div class="seg tight mini">${HT_POS.map(([v, pn]) => `<button class="${(o.extra[m] || '') === v ? 'on' : ''}" data-a="htExtra" data-id="${m}:${v}">${pn}</button>`).join('')}</div></div>${o.extra[m] ? `<div class="ht-exc">${htCtl(m, o, setup)}</div>` : ''}`).join('')}</div>`;
  return h;
}
function htCard() {
  const o = htOpts(), simple = o.mode === 'season' && !HT_MODES.some(m => m[0] !== o.mode && o.extra[m]);
  return `<div class="card" id="htCard"><h3>Home text</h3><p class="mu small" style="margin-top:2px">The big text at the top of Home, and up to two smaller ones around it. Works with every theme.</p>
    <div class="ht-prev" data-ns="1"${simple ? ' hidden' : ''}>${simple ? '' : homeHero(true)}</div><div id="htF">${htFields()}</div></div>`;
}
function htSet(fn) { const o = htOpts(); fn(o); S.homeText = o; save(); }
function htRefresh(fields) { // fields: re-draw the controls too (not while typing in them)
  const o = htOpts(), simple = o.mode === 'season' && !HT_MODES.some(m => m[0] !== o.mode && o.extra[m]);
  $$('.ht-prev').forEach(p => { p.innerHTML = p.dataset.ns && simple ? '' : homeHero(true); p.hidden = !p.innerHTML; }); // Settings: the plain season preview lives in Season display
  if (fields) { const f = $('#htF'); if (f) f.innerHTML = htFields(f.dataset.setup); }
  fitSeason();
}
// the top line holds major (+ minor) season inline; if it would wrap, give each level its own line
function fitSeason(root = document) {
  fitWords(root);
  root.querySelectorAll('.sz-top').forEach(el => {
    el.classList.remove('stack');
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 18;
    if (el.offsetHeight > lh * 1.6) el.classList.add('stack');
  });
}
function szCard() {
  const C = SZC(), o = szOpts(), si = ui.season || seasonOf(todayKey()), ex = SZ_LV.map(lv => szText(lv, si)), rows = C.rows;
  const cell = (lv, p) => {
    const lock = lv === o.level && p === o.main;
    return lock ? `<div class="cb lock" title="Main text: always shown"><span class="lockbox" role="img" aria-label="${esc(SZ_LV_NAME[lv])}: main text, always shown">${ICON.check}</span><small>main</small></div>`
      : `<div class="cb"><input type="checkbox" data-c="szChk" data-l="${lv}" data-p="${p}" ${o.show[lv][p] ? 'checked' : ''} aria-label="${esc(SZ_LV_NAME[lv])}: ${p}"></div>`;
  };
  return `<div class="card" id="szCard"><h3>Season display</h3>
    <p class="mu small" style="margin-top:2px">Choose what the season header on Home shows. Changes apply right away.</p>
    <label>Season names</label>
    <div class="seg tight cal-seg">${[['ko', '한국', 'Korean'], ['ja', '日本', 'Japanese'], ['zh', zhTrad() ? '中國' : '中国', 'Chinese']].map(([v, a, n]) => `<button class="${calSet() === v ? 'on' : ''}" data-a="calSet" data-id="${v}"><b lang="${v === 'zh' ? calLang() : v}">${a}</b> ${n}</button>`).join('')}</div>
    ${calSet() === 'zh' ? `<div class="seg tight">${[['simp', '简体', 'Simplified'], ['trad', '繁體', 'Traditional']].map(([v, a, n]) => `<button class="${(zhTrad() ? 'trad' : 'simp') === v ? 'on' : ''}" data-a="zhScript" data-id="${v}"><b lang="${v === 'trad' ? 'zh-Hant' : 'zh-Hans'}">${a}</b> ${n}</button>`).join('')}</div>` : ''}
    <div class="sz-prev">${seasonHero(si, true)}</div>
    <label>Large main text</label>
    <div class="seg tight">${[['hu', 'Micro-season 候'], ['term', 'Minor season ' + C.term]].map(([v, n]) => `<button class="${o.level === v ? 'on' : ''}" data-a="szLevel" data-id="${v}">${n}</button>`).join('')}</div>
    <div class="seg tight">${C.mains.map(([v, n]) => `<button class="${o.main === v ? 'on' : ''}" data-a="szMain" data-id="${v}"${C.lang[v] ? ` lang="${C.lang[v]}"` : ''}>${n}</button>`).join('')}</div>
    <div class="szg">
      <div></div>${SZ_LV.map(lv => `<div class="ch">${{ season: 'Major', term: 'Minor', hu: 'Micro' }[lv]}<small lang="${calLang()}">${{ season: '四季', term: C.term, hu: '候' }[lv]}</small></div>`).join('')}
      ${rows.map(([g, parts]) => `<div class="gh" lang="${calLang()}">${g}</div>` + parts.map(([p, n]) => `<div class="lab"><div lang="${calLang()}">${n}</div><div class="smp"${C.lang[p] ? ` lang="${C.lang[p]}"` : ''}>${esc(SZ_LV.map((lv, i) => ex[i][p]).join(' · '))}</div></div>${SZ_LV.map(lv => cell(lv, p)).join('')}`).join('')).join('')}
    </div>
    <p class="mu2 small">The main text is always shown. Your other parts for that season go in the row beneath it. ${esc(C.note)}</p>
    <button class="btn-s" data-a="szReset">Reset to default</button></div>`;
}
function themeCard() {
  const id = themeId(), o = custOpts(), cur = S.theme && S.theme.id;
  const tile = ([tid, n, d, soon]) => `<button class="th-tile ${id === tid ? 'on' : ''}${soon ? ' soon' : ''}" data-a="themePick" data-id="${tid}" ${soon ? 'aria-disabled="true"' : ''}><span class="th-sw th-${tid}"${termTheme(tid) ? ` style="background-image:url(${THEMEFX.thumb(tid, themeCal())})"` : ''}></span><b>${esc(n)}</b><small>${esc(soon ? 'Art coming soon' : d)}</small></button>`;
  let ed = '';
  if (id === 'custom') {
    ed = `<div class="th-ed">
      <div class="seg tight">${[['color', 'Solid color'], ['photo', 'My photo']].map(([v, n]) => `<button class="${o.mode === v ? 'on' : ''}" data-a="custMode" data-id="${v}">${n}</button>`).join('')}</div>
      ${o.mode === 'photo' ? `<div class="row" style="gap:10px;margin:4px 0 6px">${custPhoto.url ? `<img class="th-ph" src="${custPhoto.url}" alt="">` : '<div class="th-ph none">No photo yet</div>'}<div class="sp"><button class="btn-s btn-p" data-a="custPhotoPick">${custPhoto.url ? 'Change photo' : 'Choose photo'}</button><input type="file" id="custPhotoIn" accept="image/*" hidden>
        <label style="margin-top:10px">Dim the photo · <span class="num" id="dimV">${o.dim}%</span></label><input type="range" min="0" max="70" step="5" value="${o.dim}" data-i="custDim" aria-label="Dim the photo"></div></div>`
      : `<label>Background color</label>${wheelHtml('cust', o.bg)}`}
      <p class="mu2 small">Cards, buttons and icons are set in Colors below. Your photo stays on this phone and is included in backups.</p></div>`;
  }
  if (termTheme(id)) ed = `<p class="mu2 small" style="margin-top:10px">Changes with each of the 24 solar terms: the light, the weather and what's in the air${id === 'cyber' ? ', and the shop signs' : ''}. The ${{ ja: 'Japanese', ko: 'Korean', zh: 'Chinese' }[calSet()]} picture follows your season names (Season display)${calSet() === 'zh' && id === 'cyber' ? `: ${zhTrad() ? 'Hong Kong for traditional characters' : 'the mainland for simplified characters'}` : ''}${id === 'cyber' ? '' : ', with its own pictures for the seasons'}${calSet() === 'zh' && !THEMEFX.hasArt(id, themeCal()) ? '; until the Chinese pictures arrive it uses the Korean one' : ''}. Tap the season header on Home and pick another micro-season to preview other terms.</p>`;
  return `<div class="card" id="themeCard"><h3>Background</h3><p class="mu small" style="margin-top:2px">The picture behind your cards. Any background works with any UI style.</p>
    <div class="th-grid">${THEME_LIST.map(tile).join('')}</div>${ed}</div>`;
}
function styleCard() { // UI style tiles, each a live mini preview in its own colors
  const L = lookOpts(), m = matchStyle(themeId()), bgName = (THEME_LIST.find(t => t[0] === themeId()) || ['', 'this background'])[1];
  const tile = (id, name, desc, pv, joke) => `<button class="sty-tile${L.style === id ? ' on' : ''}" data-a="styPick" data-id="${id}">${pvHtml(pv, id === 'auto')}<b>${esc(name)}${joke ? ' <span class="pill joke">JOKE</span>' : ''}</b><small>${esc(desc)}</small></button>`;
  return `<div class="card" id="styCard"><h3>UI style</h3><p class="mu small" style="margin-top:2px">How cards, buttons, fonts and icons look. Mix any style with any background.</p>
    <div class="sty-grid">${tile('auto', 'Match my background', `${STYLE[m].n} with ${bgName}, in the background's colors.`, m)}${UI_STYLES.map(x => tile(x.id, x.n, x.d, x.id, x.joke)).join('')}</div></div>`;
}
function pvHtml(sid, auto = false) { const u = uiFor(sid, auto);
  return `<div class="pv" data-pv="${sid}" style="${pvVars(u.v)}"><div class="pv-card"><div class="pv-h">Daily quests</div><div class="pv-q"><i class="pv-chk"></i><span>Push-ups</span><b>+25</b></div><div class="pv-row"><span class="pv-btn">Log</span><span class="pv-chip">Lv 3</span></div></div></div>`; }
function colorCard() { // your colors for the current UI style, each with its own wheel
  const L = lookOpts(), sid = styleId(), st = STYLE[sid], c = L.colors[sid] || {}, own = useOwn(sid), bid = themeId(), u = uiFor(sid);
  const row = (k, n, hint) => { const val = c[k], shown = val || (k === 'card' ? u.v.s1s : k === 'accent' ? u.v.ac : u.v.gold), open = ui.lkOpen === k;
    return `<div class="lk-row${open ? ' open' : ''}"><button class="lk-head" data-a="lkOpen" data-id="${k}" aria-expanded="${open}"><i class="lk-sw" style="background:${esc(shown)}"></i><span class="sp"><b>${n}</b><small>${val ? 'Yours · ' + esc(val) : 'Default'} · ${hint}</small></span><span class="chev${open ? ' open' : ''}">${ICON.chev}</span></button>
      ${open ? `<div class="lk-body">${wheelHtml('lk-' + k, shown)}<div class="row" style="margin-top:6px"><span class="sp mu2 small">Saved with the ${esc(st.n)} style.</span>${val ? `<button class="btn-s" data-a="lkReset" data-id="${k}">Reset</button>` : ''}</div></div>` : ''}</div>`; };
  const bright = own ? '' : `<label>Brightness</label><div class="seg tight">${[['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']].map(([v, n]) => `<button class="${cardsPref(bid) === v ? 'on' : ''}" data-a="themeCards" data-id="${v}">${n}</button>`).join('')}</div>
    <p class="mu2 small">${c.card ? 'Your card color decides: light cards get dark text and icons, dark cards light ones.' : bid === 'seasonal' ? 'Auto is dark, which suits the scenes at every time of day.' : bid === 'custom' ? 'Auto picks light on a light color and dark on a photo.' : 'Auto follows the picture: light on bright terms, dark on dark ones.'}</p>`;
  return `<div class="card" id="lkCard"><h3>Colors</h3><p class="mu small" style="margin-top:2px">For ${esc(st.n)}${L.style === 'auto' ? ' (matched to your background)' : ''}. Tap a color to open its wheel.</p>
    ${st.pal ? `<label>Colors from</label><div class="seg tight">${[['own', st.n + '’s own'], ['bg', 'My background']].map(([v, n]) => `<button class="${(v === 'own') === own ? 'on' : ''}" data-a="styOwn" data-id="${v}">${esc(n)}</button>`).join('')}</div>` : ''}
    ${bright}<div class="lk-rows">${row('card', 'Cards', 'text follows it')}${row('accent', 'Buttons & icons', 'checks, links, the active tab')}${row('gold', 'Highlights', 'XP, streak, ranks')}</div>
    ${Object.keys(c).length ? '<button class="btn-g small" data-a="lkResetAll" style="margin-top:6px">Reset all my colors</button>' : ''}</div>`;
}
function themeRefresh() { lookRefresh(); }
function lookRefresh() { // re-draw the Themes & display tab in place (keeps the scroll position)
  if (!(ui.tab === 'me' && ui.profSeg === 'settings' && ui.setSeg === 'look')) { const c = $('#themeCard'); if (c) { c.outerHTML = themeCard(); initWheels($('#themeCard')); } return; }
  const y = window.scrollY; render(); window.scrollTo(0, y);
}
/* ---------- color wheel: hue around, saturation outward, brightness slider ---------- */
const hsvHex = (h, s, v) => { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return rgbHex([f(5) * 255, f(3) * 255, f(1) * 255]); };
const hexHsv = hex => { const [r, g, b] = hexRgb(hex).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx]; };
const SWATCHES = ['#1b2433', '#2e1f3d', '#3a1f24', '#1f3a2e', '#f2e8d8', '#e8d0d6', '#d8e6f2', '#e8a85c', '#e86a6a', '#5cc8b8', '#8aa8f0', '#c58af0', '#f2d06b', '#f4f4f0'];
function wheelHtml(id, hex) {
  const [h, s, v] = hexHsv(hex);
  return `<div class="cw" data-cw="${id}" data-h="${h}" data-s="${s}" data-v="${v}"><div class="cw-disk"><canvas width="360" height="360" aria-label="Color wheel"></canvas><i class="cw-pin"></i></div>
    <div class="cw-side"><div class="cw-sw" style="background:${esc(hex)}"></div><input class="cw-hex num" value="${esc(hex)}" maxlength="7" data-c="cwHex" aria-label="Hex color">
      <label>Brightness</label><input type="range" min="4" max="100" value="${Math.round(v * 100)}" data-i="cwV" aria-label="Brightness"></div>
    <div class="cw-swatches">${SWATCHES.map(c => `<button class="cw-s" style="background:${c}" data-a="cwSwatch" data-id="${c}" aria-label="${c}"></button>`).join('')}</div></div>`;
}
function initWheels(root = document) {
  root.querySelectorAll('.cw').forEach(w => {
    const cv = w.querySelector('canvas'), g = cv.getContext('2d'), N = cv.width, R = N / 2, v = +w.dataset.v, im = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - R, dy = y - R, d = Math.hypot(dx, dy) / R, i = (y * N + x) * 4; if (d > 1) { im.data[i + 3] = 0; continue; }
      const [r, gg, b] = hexRgb(hsvHex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, d, Math.max(v, .12)));
      im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = d > .985 ? Math.round(255 * (1 - d) / .015) : 255;
    }
    g.putImageData(im, 0, 0); wheelPin(w);
    if (w.dataset.bound) return; w.dataset.bound = 1;
    const pick = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1;
      w.dataset.h = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; w.dataset.s = Math.min(1, Math.hypot(x, y)); wheelChanged(w, false); };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pick(e); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (cv.hasPointerCapture(e.pointerId)) pick(e); });
    cv.addEventListener('pointerup', () => wheelChanged(w, true));
  });
}
function wheelPin(w) { const p = w.querySelector('.cw-pin'), a = +w.dataset.h * Math.PI / 180, s = +w.dataset.s; p.style.left = (50 + Math.cos(a) * s * 50) + '%'; p.style.top = (50 + Math.sin(a) * s * 50) + '%'; p.style.background = hsvHex(+w.dataset.h, s, +w.dataset.v); }
function wheelChanged(w, done) {
  const hex = hsvHex(+w.dataset.h, +w.dataset.s, +w.dataset.v); wheelPin(w);
  w.querySelector('.cw-sw').style.background = hex; const hi = w.querySelector('.cw-hex'); if (document.activeElement !== hi) hi.value = hex;
  wheelSet(w.dataset.cw, hex, done);
}
function wheelSet(id, hex, done) { // live preview while dragging; saved when you let go
  if (id.startsWith('lk-')) {
    const k = id.slice(3), sid = styleId(), L = lookOpts(); L.colors[sid] = Object.assign({}, L.colors[sid], { [k]: hex }); S.look = L;
    const sw = $(`#lkCard [data-a=lkOpen][data-id=${k}] .lk-sw`); if (sw) sw.style.background = hex;
    ui.season = applySeason(); if (done) { save(); lookRefresh(); } return;
  }
  if (id !== 'cust') return;
  const o = custOpts();
  S.theme = Object.assign({ id: 'custom' }, S.theme || {}, { custom: Object.assign(o, { bg: hex }) });
  ui.season = applySeason(); if (done) save();
}
function szRefresh() { const c = $('#szCard'); if (!c) return; c.outerHTML = szCard(); fitSeason($('#szCard')); }
function seasonListModal() {
  const C = SZC(), o = szOpts(), cur = seasonOf(todayKey()).idx, order = [...Array(24).keys()].map(i => (i + 2) % 24), pm = o.main, lat = LATIN_PARTS.includes(pm), lg = lat ? '' : ` lang="${C.lang[pm] || 'ko'}"`;
  const extras = (lv, t, tag) => szVisible(o, lv).filter(p => p !== pm).map(p => szSpan(p, t[p], tag)).join(tag === 'small' ? '' : ' ');
  openModal(`<div class="row"><h3 class="sp">七十二候 · The 72 micro-seasons</h3><button class="btn-s" data-a="szOpts">Display</button></div>
  <p class="mu small">Each of the 24 solar terms (${C.term}) has three five-day pentads. Tap one to preview its scene and colors.</p>
  ${order.map(ji => { const j = SEASONS.JEOLGI[ji], tt = szText('term', { j, ji }); return `<div class="jg"><div class="jg-h"><b class="${lat ? 'lat' : ''}"${lg}>${esc(tt[pm])}</b> <span class="jg-x small">${extras('term', tt)}</span> <span class="mu2 small">~${j[3]}/${j[4]}</span></div>
    <div class="jg-row">${j[6].map((h, hi) => { const idx = ji * 3 + hi, ht = szText('hu', { h, idx }); return `<button class="hu ${idx === cur ? 'now' : ''}" data-a="seasonPick" data-id="${idx}"><span class="${lat ? 'lat' : ''}"${lg}>${esc(ht[pm])}</span>${extras('hu', ht, 'small')}</button>`; }).join('')}</div></div>`; }).join('')}
  <div class="actions"><button data-a="close">Close</button></div>`);
  fitWords($('#modal'));
}
const ui = { previewHu: null, tab: 'home', boardSeg: 'tasks', sideOpen: null, logSeg: 'workout', profSeg: 'overview', calMonth: null, calSel: null, bodyRange: 90, intensity: 1, foodRes: [], openSkill: null, emDur: 3, libOpen: new Set(['custom']) };
let curDay = null;

/* ---------- levels & ranks ---------- */
const needSkill = L => Math.round(60 * Math.pow(L, 1.5));
const needAll = L => Math.round(100 * Math.pow(L, 1.6));
function levelOf(xp, need) { let L = 1; xp = Math.max(0, xp); while (xp >= need(L)) { xp -= need(L); L++; } return { L, into: xp, need: need(L) }; }
const overall = () => levelOf(S.xp, needAll);
const skLevel = id => levelOf((S.skills[id] || {}).xp || 0, needSkill);
/* v11 ladder (Daniel): Initiate → Novice → … → Grandmaster → Sovereign. The v10 ranks keep their levels; the new ones
   (Novice, Amateur, Journeyman, Expert, Veteran, Master, Grandmaster) sit in between, after the amateur-to-grandmaster ladder. */
const RANKS = [[1, 'Initiate'], [3, 'Novice'], [6, 'Amateur'], [10, 'Apprentice'], [15, 'Journeyman'], [20, 'Adept'], [27, 'Expert'],
  [35, 'Vanguard'], [42, 'Veteran'], [50, 'Paragon'], [62, 'Master'], [75, 'Ascendant'], [88, 'Grandmaster']];
const SOV = RANKS.length; // tier of Sovereign I (II = SOV + 1, …)
/* v17 rank skins (Daniel: "multiple cosmetically different ranking systems that utilize the same actual framework"): ranks.js
   holds RANK_SKINS [{ id, name, group, names[14], icons[14] {d|e|t}, cols? }]; the 14th name is the endless top rank (II, III, …
   like Sovereign). S.rankSkin = a skin id, or null/absent = Classic. Only names and emblems change: levels, XP, title ids stay. */
const RANK_CLASSIC = [...RANKS.map(r => r[1]), 'Sovereign'];
const rankSkin = () => (S.rankSkin && (window.RANK_SKINS || []).find(k => k.id === S.rankSkin)) || null;
const rankWord = (t, sk = rankSkin()) => (sk ? sk.names : RANK_CLASSIC)[Math.min(t, SOV)];
function rankOf(L, sk = rankSkin()) {
  if (L >= 100) { const n = Math.floor((L - 100) / 50) + 1; return { name: rankWord(SOV, sk) + ' ' + roman(n), tier: SOV + n - 1 }; }
  let t = 0; RANKS.forEach((r, i) => { if (L >= r[0]) t = i; }); return { name: rankWord(t, sk), tier: t };
}
/* one glyph per rank inside the gold hexagon (same order as RANKS, then Sovereign): spark, sprout, key, flame, compass,
   open book, cut gem, shield, crossed swords, laurel + star, summit flag, rising sun, chess king, crown (+ numeral, endless) */
const RANK_GLYPH = [
  '<path d="M24 13.5l2.4 8.1 8.1 2.4-8.1 2.4-2.4 8.1-2.4-8.1-8.1-2.4 8.1-2.4z" fill="var(--gold)" stroke="none"/>',
  '<path d="M17.4 34h13.2M24 34v-9.6"/><path d="M24 26.6c-.4-4.2-3.6-6.6-8-6.4.2 4.4 3.4 6.8 8 6.4z"/><path d="M24 24.6c.2-5.2 3.6-8.6 9-8.8-.2 5.4-3.6 8.8-9 8.8z" fill="var(--gold)" stroke="none"/>',
  '<circle cx="19.2" cy="19.2" r="4.6"/><circle cx="19.2" cy="19.2" r="1.3" fill="var(--gold)" stroke="none"/><path d="M22.5 22.5l10 10M28.6 28.6l2.6-2.6M31.4 31.4l2.2-2.2"/>',
  '<path d="M24 13.2c3.4 4.2 7 7.4 7 12.4a7 7 0 0 1-14 0c0-3.2 1.8-5.4 3.4-7.4.5 2.4 1.6 3.6 2.8 4.2-.6-3.2-.2-6.4.8-9.2z"/><path d="M24 34.2c-2 0-3.4-1.5-3.4-3.4 0-2 1.8-3.4 3.4-5.4 1.6 2 3.4 3.4 3.4 5.4 0 1.9-1.4 3.4-3.4 3.4z" fill="var(--gold)" stroke="none"/>',
  '<circle cx="24" cy="24" r="9.6"/><path d="M24 15.6l2.1 6.3 6.3 2.1-6.3 2.1-2.1 6.3-2.1-6.3-6.3-2.1 6.3-2.1z"/><path d="M24 15.6l2.1 6.3L24 24l-2.1-2.1z" fill="var(--gold)" stroke="none"/>',
  '<path d="M24 18.2c-2.8-1.8-6.2-2.2-9.4-1.4v14c3.2-.8 6.6-.4 9.4 1.4 2.8-1.8 6.2-2.2 9.4-1.4v-14c-3.2-.8-6.6-.4-9.4 1.4zM24 18.2v14M17.6 21.2c1.6-.2 3.2 0 4.4.6M17.6 24.8c1.6-.2 3.2 0 4.4.6M26 21.8c1.2-.6 2.8-.8 4.4-.6M26 25.4c1.2-.6 2.8-.8 4.4-.6"/>',
  '<path d="M20.4 15.4h7.2l4.2 5.2L24 33.6l-7.8-13z"/><path d="M16.2 20.6h15.6M20.4 15.4l1.8 5.2L24 33.6l1.8-13 1.8-5.2"/><path d="M22.2 20.6h3.6L24 15.8z" fill="var(--gold)" stroke="none"/>',
  '<path d="M24 13.6l8.4 3.2v7c0 4.8-3.6 8.2-8.4 10.2-4.8-2-8.4-5.4-8.4-10.2v-7z"/><path d="M19.6 21.6l4.4 3.8 4.4-3.8M19.6 26.2l4.4 3.8 4.4-3.8"/>',
  '<path d="M15.4 15.4l13 13M32.6 15.4l-13 13M26.2 30.8l4.6-4.6M17.2 26.2l4.6 4.6"/><path d="M15.4 15.4l-.6-1.8 1.8.6M32.6 15.4l.6-1.8-1.8.6"/><circle cx="31.6" cy="31.6" r="1.4" fill="var(--gold)" stroke="none"/><circle cx="16.4" cy="31.6" r="1.4" fill="var(--gold)" stroke="none"/>',
  '<path d="M21.6 33.8c-5.4-1.6-8-6.6-6.6-12.6M26.4 33.8c5.4-1.6 8-6.6 6.6-12.6"/><path d="M16.2 30l-2.8.4M14.8 26.2l-2.6-.9M14.9 22.4l-2.2-1.8M31.8 30l2.8.4M33.2 26.2l2.6-.9M33.1 22.4l2.2-1.8"/><path d="M24 15l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="var(--gold)" stroke="none"/>',
  '<path d="M12.8 33.4l7.4-11.2 3 4.2 4.4-7.8 7.6 14.8z"/><path d="M27.6 18.6v-6.4"/><path d="M27.6 12.2l5 1.7-5 1.7z" fill="var(--gold)" stroke="none"/><path d="M25.2 22.9l2.4 1.4 2.3-1.3"/>',
  '<path d="M13.6 30.4h20.8M18 30.4a6 6 0 0 1 12 0"/><path d="M24 21.4v-3.2M17.6 24l-2.2-2.2M30.4 24l2.2-2.2M20.4 15.6l3.6-3 3.6 3"/>',
  '<path d="M16.8 34.4h14.4M18.4 31.4h11.2M20.2 31.4l1.4-8.4h4.8l1.4 8.4M20.4 23c-1.8-2.6-.4-5 3.6-5s5.4 2.4 3.6 5"/><path d="M24 18v-5.4M21.6 15h4.8"/>',
  '<path d="M16.4 27.8l-1.4-10 5.2 4.2 3.8-7 3.8 7 5.2-4.2-1.4 10z"/><path d="M16.8 30.6h14.4"/><circle cx="24" cy="12.6" r="1.1" fill="var(--gold)" stroke="none"/>',
];
function skinIcon(sk, tier, sov) { // a skin's icon (fitted to 200 x 200 in ranks.js) placed inside the hexagon
  const t = Math.min(tier, SOV), o = sk.icons[t] || {}, col = sk.cols ? sk.cols[t] : 'var(--gold)';
  if (o.t) { const n = [...o.t].length, fs = n >= 4 ? 8.4 : n === 3 ? 10 : n === 2 ? 12.5 : 16;
    return `<text x="24" y="${(sov ? 24 : 26.4) + fs * .36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${col}"${sk.cols ? ' stroke="rgba(0,0,0,.5)" stroke-width=".5" paint-order="stroke"' : ''} font-family="Orbitron,'Arial Black',system-ui,sans-serif">${esc(o.t)}</text>`; }
  const box = sov ? 18.5 : 23, x = 24 - box / 2, y = sov ? 11.2 : 24 - box / 2;
  return `<g transform="translate(${x} ${y}) scale(${box / 200})" fill="${col}"${sk.cols ? ' stroke="rgba(0,0,0,.45)" stroke-width="5" stroke-linejoin="round" paint-order="stroke"' : ''}>${o.d ? `<path d="${o.d}"/>` : ''}${o.e ? `<path d="${o.e}" fill-rule="evenodd"/>` : ''}</g>`;
}
function emblem(tier, size = 46, sk = rankSkin()) { // sk: a rank skin, or null for Classic
  const hex = r => Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return `${(24 + Math.cos(a) * r).toFixed(1)},${(24 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const sov = tier >= SOV;
  let g = `<polygon points="${hex(21)}" fill="${sov ? 'rgba(226,194,122,.16)' : 'none'}" stroke="var(--gold)" stroke-width="1.4"/>`;
  if (sov) g += `<polygon points="${hex(18)}" fill="none" stroke="var(--gold)" stroke-width=".8" opacity=".75"/>`;
  g += sk ? skinIcon(sk, tier, sov) : `<g fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${RANK_GLYPH[Math.min(tier, SOV)]}</g>`;
  if (sov) g += `<text x="24" y="38.6" text-anchor="middle" font-size="7.6" fill="var(--gold)" font-weight="700" font-family="Georgia,serif">${roman(tier - SOV + 1)}</text>`;
  return `<svg class="emblem" style="width:${size}px;height:${size}px" viewBox="0 0 48 48">${g}</svg>`;
}
function rankStrip(L, sk = rankSkin()) { // every rank you can reach, in order; the current one highlighted (render() scrolls it into view)
  const cur = rankOf(L, sk), sov = cur.tier >= SOV, list = RANKS.map(([lv], i) => ({ lv, n: rankWord(i, sk), tier: i })).concat([{ lv: 100, n: rankWord(SOV, sk), tier: SOV, more: true }]);
  return `<div class="ranks">${list.map(r => { const on = L >= r.lv, here = r.more ? sov : cur.tier === r.tier;
    return `<div class="rk${on ? '' : ' locked'}${here ? ' cur' : ''}">${emblem(r.more && sov ? cur.tier : r.tier, 40, sk)}<b>${esc(r.more && sov ? cur.name : r.n)}</b><span class="num">Lv ${r.lv}${r.more ? '+' : ''}</span></div>`; }).join('')}</div>
    <div class="mu2 small" style="margin-top:6px">${esc(rankWord(SOV, sk))} keeps going: II at level 150, III at 200, then every 50 levels.</div>`;
}
function rankCard() { // v17: Settings > Themes & display > Rank style
  const cur = rankSkin(), L = overall().L, opts = [{ id: 'classic', name: 'Classic', group: 'Classic' }].concat(window.RANK_SKINS || []);
  const tile = o => { const sk = o.id === 'classic' ? null : o, on = (cur ? cur.id : 'classic') === o.id;
    return `<button class="rs-tile${on ? ' on' : ''}" data-a="rankSkin" data-id="${o.id}" aria-pressed="${on}"><span class="rs-em">${[0, 6, SOV].map(t => emblem(t, 28, sk)).join('')}</span><b>${esc(o.name)}</b><small>${esc(rankWord(0, sk))} → ${esc(rankWord(SOV, sk))}</small></button>`; };
  const groups = [...new Set(opts.map(o => o.group))];
  return `<div class="card" id="rankCard"><h3>Rank style</h3><p class="mu small" style="margin-top:2px">Same levels, XP and rewards; only the rank names and emblems change. You're <b>${esc(rankOf(L).name)}</b> (level ${L}).</p>
    ${groups.map(g => `<div class="rs-g"><div class="mu2 small rs-gh">${esc(g)}</div><div class="rs-grid">${opts.filter(o => o.group === g).map(tile).join('')}</div></div>`).join('')}
    <label>All ranks</label>${rankStrip(L)}
    <p class="mu2 small" style="margin-top:8px">Rank icons: Fluent Emoji High Contrast (Microsoft, MIT) and game-icons.net (Lorc, Delapouite and contributors, CC BY 3.0).</p></div>`;
}

/* ---------- time ---------- */
const imperial = () => S.profile.units === 'imperial';
function todayKey(now = new Date()) { return dkey(new Date(now.getTime() - hm(S.profile.wake) * 60000)); }
function sleepDeadline(k) {
  const d = dparse(k), s = hm(S.profile.sleep), w = hm(S.profile.wake);
  if (s <= w) d.setDate(d.getDate() + 1);
  d.setHours(Math.floor(s / 60), s % 60, 0, 0); return d.getTime();
}
const age = () => new Date().getFullYear() - (S.profile.birthYear || 2000);
const latestWeightKg = () => { const b = [...S.body].sort((a, b) => a.date < b.date ? -1 : 1).reverse().find(x => x.w); return b ? b.w : S.profile.weightKg || 75; };
const latestBF = () => { const b = [...S.body].sort((a, b) => a.date < b.date ? -1 : 1).reverse().find(x => x.bf != null); return b ? b.bf : null; };
const isDeload = k => !!S.profile.start && Math.floor(daysBetween(S.profile.start, k) / 7) % 4 === 3;
const fmtW = kg => imperial() ? (kg * 2.20462).toFixed(1) + ' lb' : kg.toFixed(1) + ' kg';
function fmtClock(s) { const m = hm(s), h = Math.floor(m / 60); return `${(h % 12) || 12}:${pad(m % 60)} ${h < 12 ? 'AM' : 'PM'}`; }

/* ---------- pauses ---------- */
const pausesOn = k => S.pauses.filter(p => k >= p.start && (!p.end || k <= p.end));
function pauseInfo(k) {
  const ps = pausesOn(k); if (!ps.length) return null;
  const lists = new Set(), skills = new Set(), tasks = new Set();
  ps.forEach(p => { (p.lists || []).forEach(x => lists.add(x)); (p.skills || []).forEach(x => skills.add(x)); (p.tasks || []).forEach(x => tasks.add(x)); });
  return { ps, lists, skills, tasks, all: ps.some(p => p.all), emergency: ps.some(p => p.type === 'emergency') };
}
function scopeTxt(p) {
  if (p.all) return 'everything';
  return [...(p.lists || []), ...(p.skills || []).map(id => SK[id] ? SK[id].name : id), ...(p.tasks || []).map(id => S.tasks[id] ? S.tasks[id].name : id)].join(', ') || 'nothing';
}
const PAUSE_NAME = { vacation: 'Vacation', emergency: 'Extreme emergency', pass: 'Rest pass' };
/* v16 limits: 12 extreme emergencies a calendar year; vacation days a year: 30 (153 for students), more for 10 coins a day.
   S.vacBought = { 'YYYY': extra days bought that year } (they stay in that year's allowance even if a vacation is cancelled) */
const EM_PER_YEAR = 12, VAC_DAYS = { adult: 30, student: 153 }, VAC_EXTRA_COST = 10;
const emUsed = y => S.pauses.filter(p => p.type === 'emergency' && (p.start || '').slice(0, 4) === String(y)).length;
const vacAllow = y => (S.profile.student ? VAC_DAYS.student : VAC_DAYS.adult) + ((S.vacBought || {})[y] || 0);
function vacDaysIn(y, skipId) { // vacation days already planned or taken in year y (overlaps counted once)
  const set = new Set();
  S.pauses.filter(p => p.type === 'vacation' && p.id !== skipId).forEach(p => { let k = p.start; const e = p.end || p.start; while (k <= e) { if (k.slice(0, 4) === String(y)) set.add(k); k = addDays(k, 1); } });
  return set;
}
function vacNeed(start, end) { // per year: { y: [new days, already used, allowance] } for a vacation start..end
  const by = {}, used = {}; let k = start;
  while (k <= end) { const y = k.slice(0, 4); if (!used[y]) used[y] = vacDaysIn(y); if (!used[y].has(k)) by[y] = (by[y] || 0) + 1; k = addDays(k, 1); }
  return Object.entries(by).map(([y, n]) => ({ y, n, used: used[y].size, allow: vacAllow(y), extra: Math.max(0, used[y].size + n - vacAllow(y)) }));
}

/* ---------- schedule locks (v16) ----------
   Daniel: lock in a commitment. S.locks = [{ id, kind 'skill'|'task'|'event', ref, days [weekdays locked], start, end (last day) }].
   While a lock runs, its days can't be removed, the skill / task can't come off your quests or be deleted, and a locked event
   can't be deleted or have its dates changed. More days can always be added; they aren't locked unless locked too (a new lock).
   A lock can't be undone before its end. Quests done under a lock earn +25% XP (LOCK_BONUS). */
const LOCK_BONUS = .25, LOCK_UNITS = [['d', 'Days'], ['w', 'Weeks'], ['m', 'Months'], ['y', 'Years']];
const locksOf = (kind, ref, k = todayKey()) => (S.locks || []).filter(l => l.kind === kind && l.ref === ref && k >= l.start && k <= l.end);
const isLocked = (kind, ref) => locksOf(kind, ref).length > 0;
const lockedDays = (kind, ref) => [...new Set(locksOf(kind, ref).flatMap(l => l.days || []))];
const lockEnd = (kind, ref) => locksOf(kind, ref).reduce((a, l) => l.end > a ? l.end : a, '');
function lockRefuse(kind, ref, what) { if (!isLocked(kind, ref)) return false; toast(`Locked until ${fmtDate(lockEnd(kind, ref))}: you can't ${what}`, 'bad'); return true; }
const lockBonusOn = (kind, ref, k) => { const wd = dparse(k).getDay(); return locksOf(kind, ref, k).some(l => kind === 'event' || (l.days || []).includes(wd)); };
function lockBonus(q, kind, ref, k) { // +25% XP on a quest of a locked schedule (on a locked day)
  if (!lockBonusOn(kind, ref, k)) return q;
  if (q.xpPer) { q.xpPer = Math.round(q.xpPer * (1 + LOCK_BONUS)); q.xp = q.xpPer * (q.sessions || 1); } else q.xp = Math.round(q.xp * (1 + LOCK_BONUS));
  q.lockB = true; return q;
}
const lockName = (kind, ref) => kind === 'skill' ? (SK[ref] || {}).name : kind === 'task' ? (S.tasks[ref] || {}).name : ((S.events.find(e => e.id === ref) || {}).title);
const lockDaysOf = (kind, ref) => kind === 'skill' ? (skState(ref).days || []) : kind === 'task' ? ((S.tasks[ref] || {}).days || []) : [];
function lockModal(kind, ref) {
  ui.lk = { kind, ref, n: 1, u: 'm' }; const days = lockDaysOf(kind, ref), cur = lockedDays(kind, ref), fresh = days.filter(d => !cur.includes(d));
  openModal(`<h3>${ICON.lock} Lock this schedule</h3>
    <p class="small">Lock in your commitment to <b>${esc(lockName(kind, ref) || '')}</b>${kind === 'event' ? '' : ` on <b>${days.map(d => WD[d]).join(' ') || 'no days'}</b>`}${cur.length && fresh.length ? ` (new: ${fresh.map(d => WD[d]).join(' ')})` : ''}.</p>
    <p class="mu small">Until it ends you can't ${kind === 'event' ? 'delete this event or change its dates' : 'remove these days, take it off your quests or delete it'}, and the lock itself can't be undone. You can still add more days; those aren't locked unless you lock them too. Quests done under the lock earn <b class="gold">+${Math.round(LOCK_BONUS * 100)}% XP</b>.</p>
    <label>Lock for</label><div class="row" style="gap:8px"><input type="number" inputmode="numeric" min="1" max="99" id="lkN" value="1" data-i="lk" style="width:80px;flex:none"><select id="lkU" data-c="lkU">${LOCK_UNITS.map(([v, n]) => `<option value="${v}" ${v === 'm' ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="dg-aim" id="lkEnd">${lockEndTxt()}</div>
    <label class="check"><input type="checkbox" id="lkOk"> I understand I can't undo this before it ends</label>
    <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="lkGo">${ICON.lock} Lock it</button></div>`);
}
const lockEndTxt = () => { const n = Math.round(num((document.getElementById('lkN') || {}).value) || ui.lk.n || 1), u = (document.getElementById('lkU') || {}).value || ui.lk.u; return n < 1 || n > 99 ? '<span class="bad">Pick 1 to 99.</span>' : `Locked through <b>${fmtDate(addDur(todayKey(), n, u))}</b>`; };
function lockGo() {
  const L = ui.lk, n = Math.round(num($('#lkN').value) || 0), u = $('#lkU').value;
  if (n < 1 || n > 99) { toast('Pick how long: 1 to 99', 'bad'); return; }
  if (!$('#lkOk').checked) { toast('Tick the box to confirm', 'bad'); return; }
  const days = lockDaysOf(L.kind, L.ref); if (L.kind !== 'event' && !days.length) { toast('Pick at least one day first', 'bad'); return; }
  const tk = todayKey(), end = addDur(tk, n, u);
  S.locks = (S.locks || []).concat([{ id: uid(), kind: L.kind, ref: L.ref, days: days.slice(), start: tk, end }]);
  closeModal(true); regenToday(); afterChange(); toast(`Locked through ${fmtDate(end)} · +${Math.round(LOCK_BONUS * 100)}% XP`, 'ti');
}
function lockCtl(kind, ref) { // the lock status / button in the weekly plan and on events
  const on = isLocked(kind, ref), cur = lockedDays(kind, ref), fresh = lockDaysOf(kind, ref).filter(d => !cur.includes(d));
  if (!on) return `<button class="btn-s lk-btn" data-a="lockNew" data-k="${kind}" data-id="${ref}">${ICON.lock} Lock</button>`;
  return `<span class="pill gold lk-on">${ICON.lock} until ${fmtDate(lockEnd(kind, ref))}</span>${kind !== 'event' && fresh.length ? `<button class="btn-s lk-btn" data-a="lockNew" data-k="${kind}" data-id="${ref}">Lock new days</button>` : ''}`;
}

/* ---------- schedule ---------- */
function occursOn(ev, k) {
  if (k < ev.start || (ev.end && k > ev.end)) return false;
  const d = dparse(k), s = dparse(ev.start);
  switch (ev.repeat) {
    case 'daily': return true;
    case 'weekly': return (ev.days && ev.days.length ? ev.days : [s.getDay()]).includes(d.getDay());
    case 'monthly': { const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return d.getDate() === Math.min(s.getDate(), last); }
    case 'yearly': return d.getMonth() === s.getMonth() && d.getDate() === s.getDate();
    default: return k === ev.start;
  }
}
function roundUnit(t, u) {
  if (u === 'min' || u === 'reps') return Math.max(5, Math.round(t / 5) * 5);
  if (u === 'sec') return Math.max(15, Math.round(t / 15) * 15);
  if (u === 'km') return Math.max(0.5, Math.round(t * 2) / 2);
  return Math.max(1, Math.round(t));
}
/* v12: your own target (any skill with a number). skills[id].own = the number (null = automatic). It never changes by itself
   (deload weeks still take 25% off). Sessions done at it count in s.hits (and logs 20%+ over it in s.overs) when the day is
   evaluated; after two weeks' worth of hits (2 × days a week, at least 4) or two big overs, ownSug() suggests about +10%. */
const ownRound = (t, u) => u === 'km' ? Math.max(0.1, Math.round(t * 10) / 10) : Math.max(1, Math.round(t));
const ownStep = (t, u) => u === 'reps' ? (t < 20 ? 1 : 5) : u === 'min' ? (t < 30 ? 1 : 5) : u === 'sec' ? (t < 120 ? 5 : 15) : u === 'km' ? 0.5 : 1;
const ownNeed = id => Math.max(4, 2 * Math.max(1, (skState(id).days || []).length));
function ownSug(id) { // a raise suggestion for your own target, or null
  const c = SK[id], s = S.skills[id]; if (!c || !s || !(s.own > 0)) return null;
  const need = ownNeed(id), hits = s.hits || 0, overs = s.overs || [], big = overs.length >= 2;
  if (!big && !(hits >= need && (!s.snooze || hits >= s.snooze))) return null;
  const st = ownStep(s.own, c.unit); let to = Math.max(s.own * 1.1, s.own + st);
  if (big) to = Math.max(to, (overs[overs.length - 1] + overs[overs.length - 2]) / 2);
  to = Math.round(Math.ceil(to / st - 1e-9) * st * 100) / 100;
  return { to, why: big ? `You logged ${fmtTarget(Math.max(...overs.slice(-2)), c.unit)} on a ${fmtTarget(s.own, c.unit)} target` : `You hit ${fmtTarget(s.own, c.unit)} ${hits} times` };
}
function ownNag() { // Quests banner(s): skills ready for a higher target
  return SKL.filter(c => isLib(c) && (S.skills[c.id] || {}).active && ownSug(c.id)).slice(0, 2).map(c => { const g = ownSug(c.id);
    return `<div class="banner up"><div class="row">${ICON.up}<b class="sp">${esc(c.name)}: ready for more?</b></div><div class="small" style="margin-top:4px">${esc(g.why)}. Try ${esc(fmtTarget(g.to, c.unit))}?</div>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn-s btn-p" data-a="ownRaise" data-id="${c.id}">Raise to ${esc(fmtTarget(g.to, c.unit))}</button><button class="btn-s" data-a="ownLater" data-id="${c.id}">Not yet</button></div></div>`; }).join('');
}
function ownSet(id, v) { // v in the skill's unit; null = back to automatic
  const c = SK[id], s = skState(id);
  if (v == null) { // carry on from your number: set the automatic difficulty so it continues from it
    if (s.own > 0) s.load = clamp(s.own / Math.max(0.01, c.base * (1 + 0.02 * (skLevel(id).L - 1))), 0.4, 6);
    s.own = null;
  } else { s.own = ownRound(v, c.unit); s.ownSince = todayKey(); }
  s.hits = 0; s.overs = []; s.snooze = null;
  regenToday(); afterChange();
}
function skillTarget(id, k) {
  const c = SK[id], s = skState(id);
  if (s.own > 0) return c.phys && isDeload(k) ? ownRound(s.own * 0.75, c.unit) : s.own;
  let t = c.base * s.load * (1 + 0.02 * (skLevel(id).L - 1));
  if (c.phys && isDeload(k)) t *= 0.75;
  return roundUnit(Math.min(t, c.max || t), c.unit);
}
const questXp = (id, t) => Math.round(15 + 10 * Math.log2(1 + t / (SK[id].base || 1)));
function skillTitle(id) {
  const c = SK[id];
  if (id === 'prayer') return 'Prayer';
  if (id === 'bible') return 'Read the Bible';
  if (id === 'work') return 'Deep work';
  if (c.cat === 'Languages') return 'Study ' + c.name;
  if (c.cat === 'Instruments') return 'Practice ' + c.name;
  return c.name;
}
function makeSkillQuest(id, k, title, list) {
  const c = SK[id], t = skillTarget(id, k), own = skState(id).own;
  const q = { key: 'skill:' + id, title: title || skillTitle(id), list: list || c.list || 'Daily', skill: id, unit: c.unit, target: t, progress: 0, done: false, xp: questXp(id, t) };
  if (own > 0 && t === own) q.ownT = own; // a session at your own target (counts toward a raise suggestion)
  return q;
}
function generate(k) {
  const wd = dparse(k).getDay(), rest = S.rest.includes(k), used = new Set();
  let q = [];
  for (const ev of S.events) {
    if (!occursOn(ev, k)) continue;
    if (rest && ev.list !== 'Faith') continue;
    if (ev.skill && isLib(SK[ev.skill])) {
      if (used.has(ev.skill)) continue; used.add(ev.skill);
      const sq = makeSkillQuest(ev.skill, k, ev.title, ev.list || SK[ev.skill].list);
      if (ev.target) { sq.target = ev.target; sq.xp = questXp(ev.skill, ev.target); }
      q.push(lockBonus(lockBonus(sq, 'event', ev.id, k), 'skill', ev.skill, k));
    } else q.push(lockBonus({ key: 'ev:' + ev.id, title: ev.title, list: ev.list || 'Daily', unit: ev.unit || '', target: ev.target || 0, progress: 0, done: false, xp: 15 }, 'event', ev.id, k));
  }
  for (const c of SKL) {
    const s = S.skills[c.id];
    if (!s || !s.active || !isLib(c) || used.has(c.id) || !s.days.includes(wd)) continue;
    if (rest && c.list !== 'Faith') continue;
    used.add(c.id); q.push(lockBonus(makeSkillQuest(c.id, k), 'skill', c.id, k));
  }
  if (dietWanted(k)) q.push({ key: 'diet', title: 'Met diet requirements', list: 'Nutrition', progress: 0, done: false, xp: 15, auto: true });
  for (const t of activeTasks()) { // task quests also run on rest days: they're the everyday basics
    if (!(t.days || []).includes(wd)) continue;
    const per = taskXpPer(t), n = Math.max(1, t.sessions || 1), tq = { key: 't:' + t.id, title: taskTitle(t), list: t.list || 'Daily', task: t.id, unit: t.unit === 'min' ? 'min' : '', target: taskTarget(t), sessions: n, progress: 0, done: false, xpPer: per, xp: per * n };
    if (t.lock === 'sleep') tq.lockAt = sleepDeadline(k) + 15 * 60000;
    q.push(lockBonus(tq, 'task', t.id, k));
  }
  q.push(...sideDueQuests(k)); // v11: side quests due today (deadline / checkpoint day) count toward the day
  const pi = pauseInfo(k);
  if (pi) q = pi.all ? [] : q.filter(x => !pi.lists.has(x.list) && !(x.skill && pi.skills.has(x.skill)) && !(x.task && pi.tasks.has(x.task)));
  return q;
}
// owed fixed penalties: older saves (and backups) list just the day ("2026-01-01" = the $5 donation)
function owedFix() { if (!Array.isArray(S.owed)) S.owed = []; S.owed = S.owed.map(o => typeof o === 'string' ? { k: o, f: 'don', t: 'Donate to a charity of your choice', amt: 5, sym: '$', at: 0 } : o); return S.owed; }
/* ---------- penalties (v14: your own) ----------
   S.pen = null (the defaults below) | { tiers: [{ name, below }], items: [...], fixed: [...] }
   tiers: scalable levels, top to bottom; a day under tiers[i].below % gets tier i+1 (the strongest that applies).
     Tier 1 is always "below 100%"; the last tier is the Hell level.
   items: scalable penalties { id, name, unit 'reps'|'sec'|'min'|'km'|'mi'|'money'|'other', sym (money symbol), cu (other unit),
     amts: [amount per tier] (null/0 = not in that tier), grow: grows with your level (× 1 + level/40) }
   fixed: one set penalty when a day is at or below at % { id, text, amt (optional), sym (e.g. $ or "hours"), at, how 'sheet'|'quest' }
     sheet = a locked sheet you confirm before going on (the donation); quest = a check-off on the next day's quests */
const PEN_DEF = () => ({
  tiers: PENALTY.slice(1).map((t, i) => ({ name: t.name, below: [100, 75, 50][i] })),
  items: [['pu', 'Push-ups', 'reps'], ['sq', 'Squats', 'reps'], ['bu', 'Burpees', 'reps'], ['run', 'Run', 'km'], ['pl', 'Plank', 'sec']].map(([id, n, u]) =>
    ({ id, name: n, unit: u, grow: true, amts: PENALTY.slice(1).map(t => { const e = t.ex.find(x => x[0] === n); return e ? e[1] : null; }) })),
  fixed: [{ id: 'don', text: 'Donate to a charity of your choice', amt: 5, sym: '$', at: 0, how: 'sheet' }],
});
const penCfg = () => S.pen && Array.isArray(S.pen.tiers) && S.pen.tiers.length ? S.pen : PEN_DEF();
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const penTierName = t => { const T = penCfg().tiers[t - 1]; return T ? T.name : 'Tier ' + (ROMAN[t - 1] || t); };
const penPrefix = sym => /^[^\p{L}\d\s]{1,3}$/u.test(sym || ''); // $, €, ₩ go in front; words ("hours") after
const penAmt = (n, sym) => { const v = Math.round(n * 100) / 100; return !sym ? String(v) : penPrefix(sym) ? sym + v : v + ' ' + sym; };
const fixedTitle = f => f.amt > 0 ? `${f.text} · ${penAmt(f.amt, f.sym)}` : f.text;
const PEN_UNITS = [['reps', 'Reps'], ['sec', 'Seconds'], ['min', 'Minutes'], ['km', 'Kilometers'], ['mi', 'Miles'], ['money', 'Money'], ['other', 'Other (type it)']];
function penTierOf(pct) { let t = 0; penCfg().tiers.forEach((T, i) => { if (pct * 100 < T.below) t = i + 1; }); return t; }
const penFixedOf = pct => pct >= 1 ? [] : penCfg().fixed.filter(f => pct * 100 <= f.at);
function penQuest(it, amt) { // one scalable penalty as a quest: units the app can log keep their + button
  const base = { key: 'pen:' + it.id, list: 'Penalty', progress: 0, done: false, xp: 10, pen: true };
  if (['reps', 'sec', 'min', 'km'].includes(it.unit)) return Object.assign(base, { title: it.name, unit: it.unit, target: roundUnit(amt, it.unit) });
  if (it.unit === 'mi') return Object.assign(base, { title: it.name, unit: 'km', target: roundUnit(amt * 1.609344, 'km') });
  const sym = it.unit === 'money' ? (it.sym || '$') : (it.cu || ''), v = it.unit === 'money' ? Math.round(amt * 100) / 100 : Math.max(1, Math.round(amt));
  return Object.assign(base, { title: `${it.name} · ${penAmt(v, sym)}`, unit: '', target: 0 });
}
function penaltyQuests(pp) { // pp: { tier, fixed: [ids of fixed penalties done as quests] } (or a plain tier number)
  if (typeof pp === 'number') pp = { tier: pp };
  const P = penCfg(), tier = Math.min(pp.tier || 0, P.tiers.length), L = overall().L, out = [];
  if (tier) P.items.forEach(it => { const a = (it.amts || [])[tier - 1]; if (a > 0) out.push(penQuest(it, a * (it.grow ? 1 + L / 40 : 1))); });
  (pp.fixed || []).forEach(id => { const f = P.fixed.find(x => x.id === id); if (f) out.push({ key: 'pf:' + id, title: fixedTitle(f), list: 'Penalty', unit: '', target: 0, progress: 0, done: false, xp: 10, pen: true }); });
  return out;
}
function penRulesTxt() { // the rules in one sentence (Quests tab note)
  const P = penCfg(), t = P.tiers.map((T, i) => `${i ? 'under' : 'Under'} ${T.below}% ${i ? '' : 'means '}${T.name}`).join(', ');
  const f = P.fixed.map(x => `${x.at ? `at or below ${x.at}%` : 'at 0%'}: ${fixedTitle(x)}${x.how === 'quest' ? ' (a quest)' : ''}`).join('; ');
  return `${t} tomorrow${f ? `; ${f}` : ''}.`;
}
const dayPenTxt = d => [d.tier ? (d.tn || penTierName(d.tier)) : '', ...(d.fn || [])].filter(Boolean).join(' + ');
function ensureDay(k) { if (!S.days[k]) S.days[k] = { q: generate(k), ev: false }; return S.days[k]; }
function ensureToday() {
  const k = todayKey(); curDay = k; const d = ensureDay(k), pi = pauseInfo(k);
  if (S.pendingPen && !(pi && pi.all)) { d.q = d.q.filter(q => !q.pen).concat(penaltyQuests(S.pendingPen)); d.penTier = S.pendingPen.tier; if ((S.pendingPen.fixed || []).length) d.penFixed = S.pendingPen.fixed; S.pendingPen = null; }
  const dq = d.q.find(q => q.key === 'diet'), want = dietWanted(k);
  if ((want && !dq) || (!want && dq && (!dq.done || fastOn(k)))) regenToday();
  syncDiet(k, true); syncSide(k);
  return d;
}
function regenToday() {
  const k = todayKey(), d = ensureDay(k), old = d.q, nq = generate(k), pi = pauseInfo(k);
  const byKey = Object.fromEntries(old.map(q => [q.key, q]));
  const merged = nq.map(q => { const o = byKey[q.key]; if (!o) return q; const keep = o.done || (o.task && o.progress > 0); return Object.assign(q, { progress: o.progress, done: o.done, addMin: o.addMin, smAdd: o.smAdd, wid: o.wid, xp: keep ? o.xp : q.xp, xpPer: keep && o.xpPer ? o.xpPer : q.xpPer, target: keep ? o.target : q.target }, q.task && !o.done && o.progress > (q.sessions || 1) ? { progress: q.sessions } : {}); });
  const keys = new Set(merged.map(q => q.key)), fasting = !!fastOn(k);
  old.forEach(o => {
    if (keys.has(o.key)) return;
    // a fast removes the diet quest outright (no calorie numbers on fast days); undo its XP if it was already met
    if (o.key === 'diet' && fasting) { if (o.done) { S.stats.qdone = Math.max(0, S.stats.qdone - 1); addXp(null, -o.xp, true); addXp('discipline', -2, true); } return; }
    if (o.done || (o.pen && !(pi && pi.all))) merged.push(o);
  });
  d.q = merged; syncSide(k);
}

/* ---------- day evaluation, streaks, penalties, adaptation ---------- */
function evaluate() {
  const today = todayKey();
  if (!S.lastEval) S.lastEval = addDays(S.profile.start || today, -1);
  let k = addDays(S.lastEval, 1), n = 0, maxTier = 0; const fixQ = new Set();
  while (k < today && n < 60) {
    const d = ensureDay(k);
    if (!d.ev) {
      syncSide(k); // side quests due that day, done or not by its end
      d.ev = true;
      const pi = pauseInfo(k);
      if (!d.q.length || (pi && pi.all)) { d.frozen = true; d.pct = null; }
      else {
        if (!d.aim) d.aim = dietAim(k); // freeze that day's calorie aim so later goal changes don't rewrite history
        syncDiet(k, true);
        const tot = d.q.length, done = d.q.filter(q => q.done).length, pct = done / tot;
        d.pct = pct;
        if (pct >= 1) { S.streak.cur++; S.streak.best = Math.max(S.streak.best, S.streak.cur); S.stats.perfect++; addXp('discipline', 20, true); S.coins = (S.coins || 0) + coinRate(S.streak.cur); coinTierNote(); }
        else {
          // remember the streak this miss ended, so a Streak Saver can bring it back (one saver per missed day)
          if (S.streak.cur > 0) S.streakBreak = { n: S.streak.cur, day: k, last: k, miss: 1, days: [k] };
          else if (S.streakBreak) { S.streakBreak.miss++; S.streakBreak.last = k; S.streakBreak.days.push(k); }
          S.streak.cur = 0;
        }
        for (const q of d.q) {
          if (!q.skill || !SK[q.skill] || !SK[q.skill].unit) continue;
          const s = skState(q.skill), f = Math.max(1, s.days.length);
          if (s.own > 0) { // your own target: no auto-adjusting, count the sessions at it
            if (q.ownT === s.own) { if (q.done) s.hits = (s.hits || 0) + 1; if ((q.progress || 0) >= s.own * 1.2) s.overs = (s.overs || []).concat([q.progress]).slice(-3); }
            continue;
          }
          s.load = clamp(q.done ? s.load * (1 + 0.08 / f) : s.load * 0.94, 0.4, 6);
        }
        const tier = pct >= 1 ? 0 : penTierOf(pct), fx = penFixedOf(pct); // v14: your penalty rules
        d.tier = tier; if (tier) d.tn = penTierName(tier); if (fx.length) d.fn = fx.map(fixedTitle);
        if (tier || fx.length) { S.stats.penalties++; maxTier = Math.max(maxTier, tier);
          fx.forEach(f => { if (f.how === 'quest') fixQ.add(f.id); else S.owed.push({ k, f: f.id, t: f.text, amt: f.amt || null, sym: f.sym || '', at: f.at }); }); }
      }
    }
    S.lastEval = k; k = addDays(k, 1); n++;
  }
  if (k < today) S.lastEval = addDays(today, -1);
  if (maxTier || fixQ.size) { const pp = S.pendingPen || {};
    S.pendingPen = { tier: Math.min(penCfg().tiers.length, Math.max(maxTier, pp.tier || 0)), fixed: [...new Set([...(pp.fixed || []), ...fixQ])] }; }
}

/* ---------- xp, quests, practice ---------- */
function addXp(skill, amt, quiet) {
  const before = overall().L, sb = skill ? skLevel(skill).L : 0;
  S.xp = Math.max(0, S.xp + amt);
  if (skill && SK[skill]) { const s = skState(skill); s.xp = Math.max(0, s.xp + amt); }
  if (quiet) return;
  const after = overall().L;
  if (after > before) toast(`Level ${after} · ${rankOf(after).name}`, 'lv');
  if (skill && SK[skill] && skLevel(skill).L > sb) { const L = skLevel(skill).L, r = skRankOf(L).name; toast(`${SK[skill].name} reached level ${L}${r !== skRankOf(sb).name ? ' · ' + r : ''}`, 'lv'); }
}
function defaultActivity(id) {
  const c = SK[id]; if (!c) return null;
  if (c.custom || c.act) return c.act && ACT[c.act] ? c.act : null;
  const a = ACTIVITIES.find(a => a.skill === id) || ACTS.find(a => !a.del && a.skill === id); return a ? a.id : null;
}
function workoutKcal(actId, min, int) { const a = ACT[actId]; return a ? Math.round(a.met[int] * latestWeightKg() * min / 60) : 0; }
/* 24 h cap: no skill (or side quest) can log more than a full day of time in one day */
const dayMins = k => { const d = S.days[k] || ensureDay(k); return d.skm || (d.skm = {}); };
function capMin(id, k, want, quiet) { // how many of `want` minutes fit under today's cap; records them
  const m = dayMins(k), used = m[id] || 0, ok = Math.max(0, Math.min(want, DAY_CAP - used));
  m[id] = used + ok;
  if (ok < want && !quiet) toast(ok ? `Capped at 24 h for today · logged ${ok} min` : 'Already 24 h logged for this today', 'bad');
  return ok;
}
const uncapMin = (id, k, n) => { const m = dayMins(k); m[id] = Math.max(0, (m[id] || 0) - (n || 0)); };
function toggleQuest(key, focus) {
  const k = todayKey(), d = S.days[k]; if (!d) return;
  const q = d.q.find(x => x.key === key); if (!q) return;
  if (q.side) { sideTap(q); return; }
  if (q.auto) { ui.tab = 'log'; ui.logSeg = 'food'; render(); window.scrollTo(0, 0); toast('This quest checks itself from your food log'); return; }
  const c = q.skill && SK[q.skill] ? SK[q.skill] : null;
  if (!q.done && q.lockAt && Date.now() > q.lockAt) { toast('Deadline passed. This one is locked.', 'bad'); return; }
  if (q.task) { stepTask(q, 1); return; }
  if (!q.done && c && c.custom && focus === undefined && (q.target || 0) > (q.progress || 0)) { focusModal(q, c); return; }
  const sign = q.done ? -1 : 1;
  q.done = !q.done;
  S.stats.qdone = Math.max(0, S.stats.qdone + sign);
  addXp(c ? q.skill : null, sign * q.xp);
  addXp('discipline', sign * 2, true);
  if (c) {
    const s = skState(q.skill);
    s.done = Math.max(0, s.done + sign); s.cnt = Math.max(0, s.cnt + sign * (q.target || 0));
    if (sign > 0) {
      const remain = Math.max(0, (q.target || 0) - (q.progress || 0));
      q.addMin = capMin(q.skill, k, estMin(q.skill, remain), true);
      s.min += q.addMin;
      if (c.custom && q.addMin) {
        const ks = focus && focus.length ? focus : c.stats.map(x => x.k); q.smAdd = {};
        ks.forEach(k => { const m = q.addMin / ks.length; s.sm[k] = (s.sm[k] || 0) + m; q.smAdd[k] = m; });
      }
      const ra = c.phys && c.unit === 'reps' ? repAct(q.skill) : null; // v12: a rep quest checked by hand logs the rest of its reps
      const act = c.phys && q.addMin > 0 ? (c.unit === 'min' ? defaultActivity(q.skill) : ra ? ra.id : null) : null;
      if (act) { const w = { id: uid(), date: k, act, min: q.addMin, int: 1, skill: q.skill, auto: true, xp: 0, kcal: workoutKcal(act, q.addMin, 1) }; if (ra) w.reps = remain; S.workouts.push(w); q.wid = w.id; }
    } else {
      s.min = Math.max(0, s.min - (q.addMin || 0)); uncapMin(q.skill, k, q.addMin); q.addMin = 0;
      if (q.smAdd) { for (const k in q.smAdd) s.sm[k] = Math.max(0, (s.sm[k] || 0) - q.smAdd[k]); q.smAdd = null; }
      if (q.wid) { S.workouts = S.workouts.filter(w => w.id !== q.wid); q.wid = null; }
    }
  }
  const pens = d.q.filter(x => x.pen);
  if (q.pen && pens.length && pens.every(x => x.done) && !d.penCleared) { d.penCleared = true; S.stats.penCleared++; toast('Penalty cleared', 'ti'); }
  if (sign > 0) fx('check');
  afterChange();
}
function taskXp(t, amt) {
  if (!t) return; const b = taskLevel(t).L; t.xp = Math.max(0, (t.xp || 0) + amt);
  const a = taskLevel(t).L; if (a > b) toast(`${t.name} reached level ${a}`, 'lv');
}
function stepTask(q, dir) { // one session of a task quest forward (+1) or back (-1)
  const t = S.tasks[q.task], n = q.sessions || 1, per = q.xpPer || q.xp || 5;
  if (dir > 0 && q.done) dir = -1; // tapping a finished task takes its last session back
  if (dir > 0) {
    if ((q.progress || 0) < n) { q.progress = (q.progress || 0) + 1; if (t) t.logs = (t.logs || 0) + 1; taskXp(t, per); addXp(null, per); }
    if (q.progress >= n) { q.done = true; S.stats.qdone++; addXp('discipline', 2, true); if (t) t.done = (t.done || 0) + 1; fx('check'); } else fx('tick');
  } else {
    if (!q.progress) return;
    if (q.done) { q.done = false; S.stats.qdone = Math.max(0, S.stats.qdone - 1); addXp('discipline', -2, true); if (t) t.done = Math.max(0, (t.done || 0) - 1); }
    q.progress--; if (t) t.logs = Math.max(0, (t.logs || 0) - 1); taskXp(t, -per); addXp(null, -per, true);
  }
  afterChange();
}
/* ---------- logging amounts (v12): reps, seconds, km, pages, chapters… not only minutes ----------
   Rep exercises (ACTIVITIES with reps = seconds per rep) log reps × sets; the time and calories are estimated from the reps.
   Any quest with a number target has a + button on Quests (qlogModal). Logging past the target is allowed: it counts toward
   a raise suggestion (own targets, v12). Workouts that filled a quest remember how much (w.fill) so deleting them undoes it. */
const repAct = id => ACTS.find(a => a.reps && a.skill === id && !a.del) || null;
const estMin = (id, n) => { const c = SK[id], u = c && c.unit, a = u === 'reps' ? repAct(id) : null; return Math.round((a ? n * a.reps / 60 : n * (EST_MIN[u] ?? 0)) * 10) / 10; };
const UNIT_NAME = { min: 'Minutes', reps: 'Reps', sec: 'Seconds', km: 'Distance', ch: 'Chapters', sprints: 'Sprints', sessions: 'Sessions', pages: 'Pages' };
const QUICK = { reps: [5, 10, 15, 20, 25, 50], sec: [15, 30, 45, 60, 90, 120], min: [5, 10, 15, 30, 45, 60], km: [0.5, 1, 2, 3, 5, 10] };
const unitLabel = u => u === 'km' ? (imperial() ? 'Miles' : 'Kilometers') : UNIT_NAME[u] || 'Amount';
const amtRound = (n, u) => u === 'km' ? Math.round(n * 100) / 100 : Math.round(n);
function logAmount(id, n, keys = []) { // n in the skill's own unit (km for distance)
  const c = SK[id], u = c && c.unit; if (!u || !(n > 0)) return;
  if (u === 'min') { logPractice(id, Math.round(n), keys); return; }
  const s = skState(id), k = todayKey(); n = amtRound(n, u);
  const m = capMin(id, k, estMin(id, n), true);
  s.min += m;
  if (c.custom && m) { const ks = keys.length ? keys : c.stats.map(x => x.k); ks.forEach(x => { s.sm[x] = (s.sm[x] || 0) + m / ks.length; }); }
  const act = c.phys ? (repAct(id) || ACT[defaultActivity(id)] || null) : null;
  const q = (S.days[k] || { q: [] }).q.find(x => x.skill === id);
  if (act && m > 0) S.workouts.push({ id: uid(), date: k, act: act.id, min: m, int: 1, skill: id, xp: 0, kcal: workoutKcal(act.id, m, 1), practice: true, reps: u === 'reps' ? n : undefined, dist: u === 'km' ? n : null, fill: q ? n : 0 });
  addXp(id, u === 'reps' ? Math.max(1, Math.round(n / 10)) : Math.max(1, Math.round(m / 3)));
  if (q) {
    q.progress = amtRound((q.progress || 0) + n, u);
    if (!q.done && q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key, keys); return; }
  }
  fx('tick'); toast(`Logged ${fmtTarget(n, u)} of ${c.name}${q && !q.done ? ` · ${fmtTarget(q.progress, u)} of ${fmtTarget(q.target, u)}` : ''}`); afterChange();
}
function logQuestAmount(q, n) { // penalty exercises and event quests with a target
  q.progress = amtRound((q.progress || 0) + n, q.unit);
  if (!q.done && q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key); return; }
  fx('tick'); toast(`Logged ${fmtTarget(n, q.unit)} · ${fmtTarget(q.progress, q.unit)} of ${fmtTarget(q.target, q.unit)}`); afterChange();
}
function qlogModal(key) { // the + on a quest with a number target
  const d = S.days[todayKey()], q = d && d.q.find(x => x.key === key); if (!q) return;
  const c = q.skill ? SK[q.skill] : null, u = q.unit, mi = u === 'km' && imperial(); ui.ql = key;
  const quick = (QUICK[u] || [1, 2, 3, 5, 10]).map(v => mi ? Math.round(v / 1.609 * 10) / 10 : v);
  openModal(`<h3>Log ${esc(q.title)}</h3><p class="mu small">Today: <b>${q.progress ? esc(fmtTarget(q.progress, u)) : '0'}</b> of ${esc(fmtTarget(q.target, u))}${q.done ? ' · done. Extra still counts toward a raise.' : ''}</p>
    <div class="grid2"><div><label>${unitLabel(u)}${u === 'reps' ? ' per set' : ''}</label><input id="qlN" type="number" inputmode="${u === 'km' ? 'decimal' : 'numeric'}" step="any" min="0"></div>
    ${u === 'reps' ? '<div><label>Sets</label><input id="qlSets" type="number" inputmode="numeric" min="1" max="50" value="1"></div>' : '<div></div>'}</div>
    <div class="chips ql-chips">${quick.map(v => `<button class="chip" data-a="qlChip" data-id="${v}">${v}</button>`).join('')}</div>
    ${c && c.custom ? `<div class="mu2 small" style="margin-top:10px">Which parts did you work on? (none = split evenly)</div><div class="chips" id="ql_parts" style="margin-top:6px">${c.stats.map(x => `<button class="chip" data-a="chipT" data-k="${esc(x.k)}">${esc(x.n)}</button>`).join('')}</div>` : ''}
    <div class="actions">${c ? `<button class="btn-g small" data-a="ownGo" data-id="${q.skill}">Change target</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="qlGo">Log</button></div>`);
  setTimeout(() => { const i = $('#qlN'); if (i) i.focus(); }, 60);
}
function qlogGo() {
  const d = S.days[todayKey()], q = d && d.q.find(x => x.key === ui.ql); if (!q) { closeModal(true); return; }
  let n = num($('#qlN').value); if (!(n > 0)) { toast('Enter an amount'); return; }
  const sets = $('#qlSets') ? clamp(Math.round(num($('#qlSets').value) || 1), 1, 50) : 1;
  if (q.unit === 'km' && imperial()) n = n / 0.621371;
  n = amtRound(n, q.unit) * sets; const keys = $('#ql_parts') ? chipsOn('#ql_parts') : [];
  closeModal(true);
  if (q.skill && SK[q.skill] && SK[q.skill].unit === q.unit) logAmount(q.skill, n, keys); else logQuestAmount(q, n);
}
function logPractice(id, min, keys) {
  const c = SK[id], s = skState(id), k = todayKey();
  min = capMin(id, k, min); if (!min) { render(); return; }
  s.min += min;
  if (c.custom) { const ks = keys.length ? keys : c.stats.map(x => x.k); ks.forEach(x => { s.sm[x] = (s.sm[x] || 0) + min / ks.length; }); }
  const act = c.phys ? defaultActivity(id) : null, q = (S.days[k] || { q: [] }).q.find(x => x.skill === id), fills = q && q.unit === 'min';
  if (act) S.workouts.push({ id: uid(), date: k, act, min, int: 1, skill: id, xp: 0, kcal: workoutKcal(act, min, 1), practice: true, fill: fills ? min : 0 });
  addXp(id, Math.round(min / 3));
  if (fills) {
    q.progress = (q.progress || 0) + min;
    if (!q.done && q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key, keys); return; }
  }
  fx('tick'); toast(`Logged ${min} min of ${c.name}`); afterChange();
}
function afterChange(full = true) { syncDiet(todayKey()); syncSide(todayKey()); checkTitles(); checkPerfect(); save(); if (full) render(); }

/* ---------- titles ---------- */
/* v12 (Daniel): skills have their OWN ladder, separate from the player ranks and paced for skill XP (one skill earns ~30 XP a
   day vs ~200 for the player level). Same ladder for built-in and custom skills; custom skills add their title noun.
   Daily practice: Competent ~1 week, Proficient ~3 months, Seasoned ~9 months, Elite ~2 years, Legendary ~3½ years. */
const SKILL_RANKS = [[1, 'Fledgling'], [2, 'Developing'], [3, 'Competent'], [5, 'Capable'], [7, 'Proficient'], [9, 'Skilled'], [11, 'Seasoned'],
  [13, 'Accomplished'], [15, 'Elite'], [18, 'Exceptional'], [20, 'Legendary']];
const SK_LEG = 20, SK_LEG_STEP = 4; // Legendary II at 24, III at 28, …
function skRankOf(L) {
  if (L >= SK_LEG) { const n = Math.floor((L - SK_LEG) / SK_LEG_STEP) + 1; return { name: 'Legendary' + (n > 1 ? ' ' + roman(n) : ''), word: 'Legendary', n, tier: SKILL_RANKS.length - 1 + n - 1 }; }
  let t = 0; SKILL_RANKS.forEach((r, i) => { if (L >= r[0]) t = i; }); return { name: SKILL_RANKS[t][1], word: SKILL_RANKS[t][1], n: 0, tier: t };
}
const skillRank = id => skRankOf(skLevel(id).L).name; // e.g. "Seasoned"
const nextSkRank = L => { const r = SKILL_RANKS.find(([at]) => at > L); return r ? { at: r[0], name: r[1] } : { at: SK_LEG + (Math.floor((L - SK_LEG) / SK_LEG_STEP) + 1) * SK_LEG_STEP, name: 'Legendary ' + roman(Math.floor((L - SK_LEG) / SK_LEG_STEP) + 2) }; };
const stp = (at, id, name, desc) => ({ at, id, name, desc });
/* v16: years of commitment (since you started), each with a badge. Title ids yr<N> are permanent. */
const YEAR_BADGES = [[1, 'First Orbit'], [2, 'Second Lap'], [3, 'Third Time\'s the Habit'], [5, 'Half a Decade'], [7, 'Seven-Year Itch, Ignored'], [10, 'Decade of Discipline'],
  [15, 'Fifteen and Still Here'], [20, 'Two Decades Deep'], [30, 'Pearl of Persistence'], [40, 'Over the Hill, Still Climbing'], [50, 'Golden Jubilee of Grinding'],
  [60, 'Diamond Habit (and Diamond Knees)'], [70, 'Septuagenarian Streaker'], [80, 'Your Grandkids Use This App Now'], [90, 'Still Doing Push-ups at 90?!'],
  [100, 'Centenarian Speedrunner'], [110, 'Supercentenarian Side Quest'], [120, 'Okay, Call the Guinness People']];
function yearsIn() { // full years since you started
  const s0 = S.profile.start; if (!s0) return 0; const a = dparse(s0), b = dparse(todayKey());
  let y = b.getFullYear() - a.getFullYear(); if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) y--; return Math.max(0, y);
}
const yearTier = n => n >= 100 ? ['#ff8ad8', '#8ad8ff'] : n >= 60 ? ['#7fb2ff', '#3f6fd0'] : n >= 30 ? ['#6ee0b0', '#2f9a72'] : n >= 10 ? ['#f2d27a', '#b8862e'] : n >= 5 ? ['#e3e8ee', '#8f99a6'] : ['#e8b07a', '#a8683a'];
function yearBadge(n, earned, size = 56) { // a laurel medallion with the number of years
  const [c1, c2] = earned ? yearTier(n) : ['#6b6b72', '#3c3c42'], id = 'yb' + n + (earned ? 'e' : 'l');
  let leaves = ''; for (let i = 0; i < 9; i++) { const a = (200 + i * 17) * Math.PI / 180, x = 24 + Math.cos(a) * 19, y = 26 + Math.sin(a) * 19, r = (200 + i * 17 + 70);
    leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.9" ry="4.2" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/><ellipse cx="${(48 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="1.9" ry="4.2" transform="rotate(${-r} ${(48 - x).toFixed(1)} ${y.toFixed(1)})"/>`; }
  return `<svg class="ybadge${earned ? '' : ' off'}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <g fill="url(#${id})" opacity="${earned ? 1 : .55}">${leaves}</g><circle cx="24" cy="24" r="13.5" fill="url(#${id})"/><circle cx="24" cy="24" r="11.5" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1"/>
    <text x="24" y="${n >= 100 ? 27.6 : 28.3}" text-anchor="middle" font-size="${n >= 100 ? 9.5 : 12}" font-weight="700" font-family="system-ui, sans-serif" fill="${earned ? 'rgba(20,16,10,.82)' : '#2a2a2e'}">${n}</text></svg>`;
}
function ladder(cur, steps, more) {
  const all = steps.slice();
  if (more) for (let k = 0; k < 1000; k++) { const s = more(k); all.push(s); if (s.at > cur) break; }
  return { earned: all.filter(s => cur >= s.at), next: all.find(s => cur < s.at) || null };
}
const customRole = c => (c.role || c.name || '').trim();
function customRank(id) { // "Seasoned Painter", "Legendary Painter II"
  const c = SK[id], r = skRankOf(skLevel(id).L), role = customRole(c);
  return `${r.word} ${role}${r.n > 1 ? ' ' + roman(r.n) : ''}`;
}
const skillRankLabel = id => SK[id] && SK[id].custom ? customRank(id) : skillRank(id);
function titleTracks() {
  const T = [], num0 = v => Math.round(v).toLocaleString();
  const add = (group, cur, steps, more, fmt = num0, opts = {}) => T.push(Object.assign({ group, cur, fmt }, ladder(cur, steps, more), opts));
  const lv = v => 'Lv ' + v, active = id => !!(S.skills[id] && (S.skills[id].active || S.skills[id].xp > 0));
  // consistency
  add('Consistency', S.streak.best, [[3, 'Kindled'], [7, 'Week Unbroken'], [14, 'Fortnight Will'], [30, 'Iron Month'], [60, 'Relentless'], [100, 'Centurion'], [180, 'Half-Year Ascetic'], [365, 'Unbroken Year']].map(([n, nm]) => stp(n, 'streak' + n, nm, `${n}-day streak`)),
    k => stp((k + 2) * 365, 'streaky' + (k + 2), `Unbroken · ${k + 2} Years`, `${(k + 2) * 365}-day streak`), v => v + ' d', { note: `Best streak counts · current ${S.streak.cur}` });
  add('Commitment', yearsIn(), YEAR_BADGES.map(([n, nm]) => stp(n, 'yr' + n, nm, `${n} year${n > 1 ? 's' : ''} with Deificatio`)), null, v => v + (v === 1 ? ' year' : ' years'), { note: 'Years since you started', badge: true });
  add('Consistency', S.stats.perfect, [[7, 'Flawless Week'], [30, 'Flawless Month'], [100, 'Hundred Perfect Days'], [365, 'Perfect Year']].map(([n, nm]) => stp(n, 'perf' + n, nm, `${n} perfect days`)), null, v => v + ' days');
  add('Consistency', S.stats.qdone, [10, 50, 100, 250, 500, 1000, 2500, 5000].map(n => stp(n, 'q' + n, `${n.toLocaleString()} Quests`, `Complete ${n.toLocaleString()} quests`)),
    k => { const n = (k + 1) * 10000; return stp(n, 'q' + n, `${n.toLocaleString()} Quests`, `Complete ${n.toLocaleString()} quests`); });
  const lvName = (n, nm) => { const sk = rankSkin(); if (!sk) return nm; const i = RANKS.findIndex(r => r[0] === n); // v17: titles follow the rank style
    return i >= 0 ? rankWord(i, sk) : n === 100 ? rankWord(SOV, sk) : sk.names.includes(nm) ? 'Truly ' + nm : nm; };
  add('Consistency', overall().L, [[3, 'Novice'], [5, 'Awakened'], [6, 'Amateur'], [10, 'Apprentice'], [15, 'Journeyman'], [20, 'Adept'], [27, 'Expert'], [35, 'Vanguard'], [42, 'Veteran'], [50, 'Paragon'], [62, 'Master'], [75, 'Ascendant'], [88, 'Grandmaster'], [100, 'Sovereign']].map(([n, nm]) => stp(n, 'lvl' + n, lvName(n, nm), `Reach level ${n}`)),
    k => { const n = 150 + k * 50; return stp(n, 'lvl' + n, rankWord(SOV) + ' ' + roman(k + 2), `Reach level ${n}`); }, lv);
  // training & body
  add('Training & body', S.workouts.length, [[1, 'First Sweat'], [10, 'Regular'], [50, 'Gym Rat'], [100, 'Hundred Sessions'], [250, 'Iron Habit'], [500, 'Machine'], [1000, 'Thousand Sessions']].map(([n, nm]) => stp(n, 'wk' + n, nm, `Log ${n.toLocaleString()} workout${n > 1 ? 's' : ''}`)), null, v => v + ' sessions');
  add('Training & body', Math.round(S.workouts.reduce((a, w) => a + (w.kcal || 0), 0)), [stp(10000, 'kc10k', 'Furnace', 'Burn 10,000 kcal')],
    k => { const n = (k + 1) * 100000; return stp(n, 'kc' + n, k ? `Inferno ×${k + 1}` : 'Inferno', `Burn ${n.toLocaleString()} kcal`); }, v => num0(v) + ' kcal');
  add('Training & body', S.body.length, [stp(10, 'selfaware', 'Self-Aware', 'Log body stats 10 times')], null, v => v + ' logs');
  add('Training & body', new Set(S.food.map(f => f.date)).size, [stp(30, 'fuel', 'Fuel Accountant', 'Log food on 30 days')], null, v => v + ' days');
  // faith & reading
  add('Faith & reading', (S.skills.bible || {}).cnt || 0, [], k => stp((k + 1) * 1189, 'bible' + (k + 1), k ? `Through the Word ×${k + 1}` : 'Through the Word', 'Read all 1,189 chapters of the Bible'), v => num0(v) + ' ch.', { hidden: !active('bible') });
  const prayN = Math.max((S.skills.prayer || {}).done || 0, (S.tasks.pray || {}).done || 0);
  add('Faith & reading', prayN, [[7, 'pray7', 'A Week of Prayer'], [40, 'pray40', 'Forty Days of Prayer'], [100, 'pray100', 'Steadfast in Prayer'], [365, 'pray365', 'A Year on Your Knees'], [1000, 'pray1000', 'Pray Without Ceasing']].map(([n, id, nm]) => stp(n, id, nm, `Complete ${n.toLocaleString()} prayer quests`)), null, v => v + ' prayers', { hidden: !active('prayer') && !(S.tasks.pray && (S.tasks.pray.active || S.tasks.pray.done)) });
  const fb = S.books.filter(b => b.finished).length;
  add('Faith & reading', fb, [[1, 'Reader'], [5, 'Bookworm'], [10, 'Well-Read'], [25, 'Scholar'], [50, 'Bibliophile'], [100, 'Living Library']].map(([n, nm]) => stp(n, 'book' + n, nm, `Finish ${n} book${n > 1 ? 's' : ''}`)),
    k => { const n = 200 + k * 100; return stp(n, 'book' + n, `Library of ${n}`, `Finish ${n} books`); }, v => v + ' books');
  // skills
  for (const c of SKL) {
    if (!c.unit && c.id !== 'discipline') continue;
    if (c.moved && !((S.skills[c.id] || {}).xp > 0)) continue;
    const L = skLevel(c.id).L;
    // v12: one skill ladder for built-in and custom skills (title IDs sr_<skill>_<level>; the old sk_ / ck_ ladders are retired)
    const role = c.custom ? customRole(c) : null, nm = (w, n) => role ? `${w} ${role}${n > 1 ? ' ' + roman(n) : ''}` : `${w}${n > 1 ? ' ' + roman(n) : ''} · ${c.name}`;
    add(c.custom ? 'Your skills' : 'Skills', L, SKILL_RANKS.filter(([at]) => at >= 3).map(([n, w]) => stp(n, `sr_${c.id}_${n}`, nm(w, 1), `${c.name} level ${n}`)),
      k => { const n = SK_LEG + (k + 1) * SK_LEG_STEP; return stp(n, `sr_${c.id}_${n}`, nm('Legendary', k + 2), `${c.name} level ${n}`); }, lv,
      { hidden: c.custom ? !active(c.id) || hiddenSk(c.id) : (!active(c.id) && c.id !== 'discipline') || hiddenSk(c.id) });
  }
  // languages
  let b2 = 0, anyLang = false;
  SKILLS.filter(c => c.cat === 'Languages' && c.stats.some(x => x.t === 'cefr')).forEach(c => {
    const s = S.skills[c.id] || { cefr: {} }, mn = Math.min(...['L', 'S', 'R', 'W'].map(k => s.cefr[k] || 0)), used = active(c.id) || Object.values(s.cefr || {}).some(Boolean);
    if (mn >= 4) b2++; if (used) anyLang = true;
    add('Languages', mn, [stp(4, 'lang_b2_' + c.id, `Speaker of ${c.name}`, `B2 in all four ${c.name} skills`), stp(5, 'lang_c1_' + c.id, `Fluent in ${c.name}`, `C1 in all four ${c.name} skills`)], null, v => CEFR[v], { hidden: !used, note: 'Your lowest of listening, speaking, reading and writing' });
  });
  add('Languages', b2, [stp(3, 'poly3', 'Polyglot', 'B2+ in three languages'), stp(5, 'poly5', 'Hyperpolyglot', 'B2+ in five languages')], null, v => v + ' languages', { hidden: !anyLang });
  const hg = ((S.skills.hanja || {}).sc || {}).grade || 0, hopts = SK.hanja.stats[0].opts.map(o => o.split(' · ')[0]);
  add('Languages', hg, [[4, 'hanja5', 'Character Apprentice', '5급'], [6, 'hanja3', 'Hanja Scholar', '3급'], [8, 'hanja1', 'Master of Characters', '1급'], [9, 'hanjaT', 'Grand Master of Characters', '특급']].map(([g, id, nm, l]) => stp(g, id, `${nm} (${l})`, `Reach Hanja grade ${l}`)), null, v => hopts[v], { hidden: !active('hanja') && !hg });
  // martial-art belts: one title per belt claimed (ids belt_<skill>_<index> are permanent)
  for (const id of Object.keys(S.belts || {})) {
    const d = beltDef(id), c = SK[id], cur = beltCur(id); if (!d || !c) continue;
    add('Belts', cur ? cur.i + 1 : 0, d.belts.map((b, i) => stp(i + 1, `belt_${id}_${i}`, `${b.n} ${d.word} · ${c.name}`, `Claim the ${b.n.toLowerCase()} ${d.word.toLowerCase()} in ${c.name}`)), null, v => v ? d.belts[v - 1].n : 'none', { hidden: !cur });
  }
  // task quests (achievements scale with how many days a week the task runs)
  for (const t of Object.values(S.tasks || {})) {
    if (t.id === 'pray') continue;
    const th = taskThresholds(t), names = taskAchNames(t), pre = (t.custom ? 'tc_' : 'tk_') + t.id + '_', unit = (t.days || []).length < 7 ? 'times' : 'days';
    const steps = th.map((n, i) => stp(n, pre + i, names[i], `${t.name}: complete it ${n.toLocaleString()} ${n === 1 ? 'time' : unit}`));
    add(t.custom ? 'Your tasks' : 'Tasks', t.done || 0, steps, k => { const n = th[5] + (k + 1) * th[6]; return stp(n, pre + (6 + k), `${names[5]} ${roman(k + 2)}`, `${t.name}: complete it ${n.toLocaleString()} ${unit}`); }, v => v + '×', { hidden: (!t.active && !t.done) || hiddenTk(t.id) });
  }
  // side quests
  const sideN = (S.side || []).filter(q => q.status === 'done').length;
  add('Side quests', sideN, [[1, 'Adventurer'], [5, 'Quester'], [10, 'Seasoned Quester'], [25, 'Saga Keeper'], [50, 'Living Legend']].map(([n, nm]) => stp(n, 'side' + n, nm, `Finish ${n} one-time or time-limited quest${n > 1 ? 's' : ''}`)),
    k => { const n = 100 + k * 50; return stp(n, 'side' + n, 'Living Legend ' + roman(k + 2), `Finish ${n} side quests`); }, v => v + ' done', { hidden: !(S.side || []).length });
  // penance
  add('Penance', S.stats.donated, [stp(1, 'paid', 'Paid the Price', 'Pay off your first fixed penalty (the donation, or your own)')], null, v => v + ' paid');
  add('Penance', S.stats.penCleared, [stp(1, 'redeemed', 'Redeemed', 'Clear a penalty set'), stp(10, 'redeemed10', 'Forged in Penance', 'Clear 10 penalty sets')], null, v => v + ' cleared');
  // discovery (hidden easter egg)
  add('Discovery', S.customSkills.length, [stp(1, 'pioneer', 'Pathfinder', 'Create your own skill')], null, num0, { hidden: true });
  return T;
}
const ACH_DAYS = [1, 7, 30, 100, 365, 1000];
const CUSTOM_ACH = ['Started', 'Steady', 'Habit Formed', 'Devoted', 'Unshakable', 'Legendary'];
function taskThresholds(t) { // completions for each tier, scaled to how often the task is scheduled; [6] = step after the last tier
  const f = Math.max(1, (t.days || []).length || 7) / 7, th = [];
  ACH_DAYS.forEach((n, i) => th.push(i ? Math.max(th[i - 1] + 1, Math.round(n * f)) : 1));
  th.push(Math.max(1, Math.round(1000 * f))); return th;
}
const taskAchNames = t => !t.custom && TASK_DEF[t.id] ? TASK_DEF[t.id].ach : CUSTOM_ACH.map(w => `${w}: ${t.name}`);
function autoTitles() { return titleTracks().flatMap(t => t.earned); }
function checkTitles(silent) {
  for (const t of autoTitles()) if (!S.titles.auto[t.id]) { S.titles.auto[t.id] = todayKey(); if (!silent) toast((/^t[kc]_/.test(t.id) ? 'Achievement: ' : /^belt_/.test(t.id) ? 'Belt title: ' : 'Title earned: ') + t.name, 'ti'); }
}

/* ---------- stats & norms ---------- */
function ncdf(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function normPct(key, val) {
  if (val == null) return null; const n = NORMS[key], sx = S.profile.sex === 'F' ? 'F' : 'M';
  const [mu, sd, dr] = n[sx], mean = mu + dr * (age() - 25) / 10;
  let z = (val - mean) / sd; if (n.lower) z = -z;
  let p = ncdf(z) * 100; if (n.floor && val < n.floor[sx]) p = Math.min(p, 90);
  return clamp(Math.round(p), 1, 99);
}
const evaluatedDays = (n = 30) => Object.keys(S.days).filter(k => S.days[k].ev && !S.days[k].frozen).sort().slice(-n).map(k => S.days[k]);
function skillConsistency(id) {
  let t = 0, dn = 0; evaluatedDays(30).forEach(d => d.q.forEach(q => { if (q.skill === id) { t++; if (q.done) dn++; } }));
  return t ? Math.round(dn / t * 100) : null;
}
function autoStat(k) {
  if (k === 'd_streak') return Math.round(100 * (1 - Math.exp(-S.streak.cur / 30)));
  const ds = evaluatedDays(30); if (!ds.length) return null;
  if (k === 'd_comp') return Math.round(ds.reduce((a, d) => a + (d.pct || 0), 0) / ds.length * 100);
  if (k === 'd_sleep') { const sq = d => d.q.find(q => q.key === 'h:phone' || q.key === 't:phone'), w = ds.filter(sq); return w.length ? Math.round(w.filter(d => sq(d).done).length / w.length * 100) : null; }
  if (k === 'd_clean') return Math.round(ds.filter(d => !d.tier).length / ds.length * 100);
  if (k === 'd_perfect') return Math.round(ds.filter(d => d.pct >= 1).length / ds.length * 100);
  return null;
}
function statValue(id, st) {
  const s = skState(id);
  switch (st.t) {
    case 'r': return RATING_PCT[s.r[st.k] || 1];
    case 'cefr': return CEFR_PCT[s.cefr[st.k] || 0];
    case 'scale': return st.pct[s.sc[st.k] || 0];
    case 'h': return Math.round(100 * (1 - Math.exp(-((s.min + (s.hist || 0)) / 60) / st.scale)));
    case 'ch': { const h = ((s.sm[st.k] || 0) + (s.hsm[st.k] || 0)) / 60, sc = SK[id].scale || 100; return Math.round(100 * (1 - Math.pow(2, -h / sc))); }
    case 'c': return skillConsistency(id);
    case 'm': return normPct(st.norm, (S.tests[st.norm] || {}).v ?? null);
    case 'a': return autoStat(st.k);
    case 'belt': return beltPct(id);
  }
  return null;
}
/* ---------- diet goal & fasts ----------
   Presets: (maintenance + goal adj + workout kcal) with a % band. Maintenance = formula estimate or the user's own number.
   Custom: target ± margin, range, limit (max only) or minimum (min only); workout kcal optional.
   Fasts: up to 40 days with no diet quest and calorie tracking hidden (no penalty). */
const DIET_DEF = { maint: null, rule: 'target', kcal: 2000, tol: 150, lo: 1800, hi: 2200, burn: false };
const GOAL_NAME = { cut: 'Lose fat', maintain: 'Maintain', bulk: 'Build muscle', custom: 'Custom', none: 'No goal' };
const GOAL_ADJ = { cut: -500, maintain: 0, bulk: 300, none: 0 };
const RULES = [['target', 'Target'], ['range', 'Range'], ['limit', 'Limit'], ['min', 'Minimum']];
const RULE_NAME = { target: 'Custom target', range: 'Custom range', limit: 'Custom limit', min: 'Custom minimum' };
const KCAL_FLOOR = 1200, FAST_MAX = 40;
const fmtK = n => Math.round(n).toLocaleString();
const dietCfg = (p = S.profile) => Object.assign({}, DIET_DEF, p.diet || {});
const heightOr = () => S.profile.heightCm || (S.profile.sex === 'F' ? 163 : 176); // v14: height is optional (an average stands in)
const bmrOf = () => { const p = S.profile; return 10 * latestWeightKg() + 6.25 * heightOr() - 5 * age() + (p.sex === 'F' ? -161 : 5); };
const estMaint = () => Math.round(bmrOf() * 1.25);
const burnedOn = k => S.workouts.filter(x => x.date === k).reduce((a, x) => a + (x.kcal || 0), 0);
function dietAim(k, p = S.profile) {
  const c = dietCfg(p), burned = Math.round(burnedOn(k)), goal = GOAL_NAME[p.goal] ? p.goal : 'maintain';
  if (goal === 'none') return { goal, burned, add: 0, lo: null, hi: null, none: true }; // v14: just logging, no aim
  if (goal === 'custom') {
    const add = c.burn ? burned : 0, R = v => v == null ? null : Math.round(v + add);
    const r = c.rule === 'range' ? [c.lo, c.hi] : c.rule === 'limit' ? [null, c.kcal] : c.rule === 'min' ? [c.kcal, null] : [c.kcal - c.tol, c.kcal + c.tol];
    return { goal, rule: c.rule in RULE_NAME ? c.rule : 'target', burned, add, lo: R(r[0]), hi: R(r[1]) };
  }
  const maint = c.maint || estMaint(), t = maint + GOAL_ADJ[goal] + burned, [a, b] = DIET_BAND[goal];
  return { goal, burned, add: burned, maint, own: !!c.maint, t: Math.round(t), lo: Math.round(t * a), hi: Math.round(t * b) };
}
const aimFor = k => { const d = S.days[k]; return d && d.ev && d.aim ? d.aim : dietAim(k); };
const aimTxt = a => a.none ? 'no aim' : a.lo != null && a.hi != null ? `${fmtK(a.lo)}–${fmtK(a.hi)}` : a.hi != null ? `≤ ${fmtK(a.hi)}` : `≥ ${fmtK(a.lo)}`;
const goalDesc = a => a.goal === 'custom' ? RULE_NAME[a.rule] : GOAL_NAME[a.goal];
function aimBreakdown(a) {
  if (a.none) return 'Food is logged with no daily aim and no diet quest';
  if (a.goal === 'custom') return a.burned ? (a.add ? `Includes ${fmtK(a.burned)} kcal burned in workouts` : 'Workout calories not added') : 'Fixed daily number';
  const adj = GOAL_ADJ[a.goal];
  return `${a.own ? 'Your maintenance' : 'Est. maintenance'} ${fmtK(a.maint)}${adj ? ` ${adj < 0 ? '−' : '+'} ${Math.abs(adj)}` : ''}${a.burned ? ` + ${fmtK(a.burned)} burned` : ''}`;
}
const fastOn = k => (S.fasts || []).find(f => k >= f.start && k <= f.end) || null;
const fastNext = () => (S.fasts || []).filter(f => f.end >= todayKey()).sort((a, b) => a.start < b.start ? -1 : 1)[0] || null;
const fastLen = f => daysBetween(f.start, f.end) + 1;
const fastDay = (f, k) => daysBetween(f.start, k) + 1;
const dietWanted = k => S.profile.goal !== 'none' && S.profile.dietQuest !== false && !fastOn(k);
function dietStatus(k) {
  const a = aimFor(k), items = S.food.filter(f => f.date === k);
  const eaten = Math.round(items.reduce((s, f) => s + f.kcal, 0));
  const ok = items.length > 0 && (a.lo == null || eaten >= a.lo) && (a.hi == null || eaten <= a.hi);
  return Object.assign({}, a, { eaten, logged: items.length > 0, ok });
}
function syncDiet(k, quiet) {
  const d = S.days[k]; if (!d || !dietWanted(k)) return;
  const q = d.q.find(x => x.key === 'diet'); if (!q) return;
  const ok = dietStatus(k).ok; if (ok === q.done) return;
  q.done = ok; const sign = ok ? 1 : -1;
  S.stats.qdone = Math.max(0, S.stats.qdone + sign);
  addXp(null, sign * q.xp, quiet); addXp('discipline', sign * 2, true);
  if (!quiet) toast(ok ? 'Diet requirements met' : 'Diet quest no longer met', ok ? 'ti' : 'bad');
}
function dietSub(k) {
  const s = dietStatus(k);
  return s.logged ? `${fmtK(s.eaten)} kcal · aim ${aimTxt(s)} · auto` : `Log food to verify · aim ${aimTxt(s)} kcal`;
}
function dietMsg(s) {
  if (s.none) return s.logged ? 'Logged' : 'Nothing logged yet';
  if (!s.logged) return 'Log food to verify';
  if (s.ok) return s.hi != null ? `On track · ${fmtK(s.hi - s.eaten)} left` : 'On track ✓';
  return s.lo != null && s.eaten < s.lo ? `${fmtK(s.lo - s.eaten)} kcal to go` : `${fmtK(s.eaten - s.hi)} kcal over`;
}
function dietSummary() {
  const tk = todayKey(), f = fastOn(tk), a = dietAim(tk);
  if (f) return `Fasting until ${fmtDate(f.end)} · diet quest paused`;
  if (a.none) return 'No goal · food is just logged';
  return `${goalDesc(a)} · aim ${aimTxt(a)} kcal today · quest ${S.profile.dietQuest !== false ? 'on' : 'off'}`;
}
function nutritionAdherence() {
  const days = [...new Set(S.food.map(f => f.date))].sort().filter(k => k !== todayKey() && !fastOn(k)).slice(-14);
  if (!days.length) return null;
  if (S.profile.goal === 'none') return null; // no aim to meet
  const ok = days.filter(k => dietStatus(k).ok).length;
  return Math.round(ok / days.length * 100);
}
function healthAxes() {
  const t = k => (S.tests[k] || {}).v ?? null;
  return [
    { n: 'Body fat', v: normPct('bodyfat', latestBF()) },
    { n: 'Resting HR', v: normPct('rhr', t('rhr')) },
    { n: 'Push-ups', v: normPct('pushups', t('pushups')) },
    { n: 'Core (plank)', v: normPct('plank', t('plank')) },
    { n: 'Cardio (5K)', v: normPct('run5k', t('run5k')) },
    { n: 'Flexibility', v: normPct('sitreach', t('sitreach')) },
    { n: 'Sleep on time', v: autoStat('d_sleep') },
    { n: 'Nutrition', v: nutritionAdherence() },
  ];
}

/* ---------- charts ---------- */
function radar(axes, size = 250) {
  const n = axes.length, cx = size / 2, cy = size / 2, R = size * 0.34;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  const P = v => axes.map((_, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
  let g = '';
  [25, 50, 75, 100].forEach(l => g += `<polygon points="${P(l)}" fill="none" stroke="${l === 50 ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.12)'}" ${l === 50 ? 'stroke-dasharray="3 3"' : ''}/>`);
  axes.forEach((_, i) => { const [x, y] = pt(i, 100); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.12)"/>`; });
  const poly = axes.map((a, i) => pt(i, a.v == null ? 0 : Math.max(4, a.v)).map(x => x.toFixed(1)).join(',')).join(' ');
  g += `<polygon points="${poly}" fill="var(--acA)" stroke="var(--ac)" stroke-width="1.6" stroke-linejoin="round"/>`;
  axes.forEach((a, i) => { if (a.v != null) { const [x, y] = pt(i, Math.max(4, a.v)); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="var(--ac)"/>`; } });
  axes.forEach((a, i) => {
    const [x, y] = pt(i, 120), anc = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
    const yy = y < cy - 4 ? y - 6 : y + (Math.abs(y - cy) < 4 ? 0 : 6);
    g += `<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="${anc}" font-size="10.5" fill="#a9afb8">${esc(a.n)}</text>`;
    g += `<text x="${x.toFixed(1)}" y="${(yy + 12).toFixed(1)}" text-anchor="${anc}" font-size="10.5" fill="${a.v == null ? '#5d636d' : '#e7e9ec'}" font-family="ui-monospace,monospace">${a.v == null ? '—' : a.v}</text>`;
  });
  return `<svg class="chart" viewBox="-78 -14 ${size + 156} ${size + 34}" style="max-width:${size + 156}px">${g}</svg>`;
}
function bodyChart(range) {
  const cutoff = range ? addDays(todayKey(), -range) : '0000';
  const pts = S.body.filter(b => b.date >= cutoff).sort((a, b) => a.date < b.date ? -1 : 1);
  if (pts.length < 2) return `<div class="empty small">Log at least two entries to see the graph.</div>`;
  const W = 340, H = 170, L = 36, R = 34, T = 10, B = 22;
  const t0 = dparse(pts[0].date).getTime(), t1 = Math.max(t0 + 864e5, dparse(pts[pts.length - 1].date).getTime());
  const X = d => L + (dparse(d).getTime() - t0) / (t1 - t0) * (W - L - R);
  const series = (key, conv) => { const v = pts.filter(p => p[key] != null).map(p => [p.date, conv(p[key])]); if (!v.length) return null; let lo = Math.min(...v.map(x => x[1])), hi = Math.max(...v.map(x => x[1])); if (hi - lo < 1) { lo -= 1; hi += 1; } const pd = (hi - lo) * 0.12; lo -= pd; hi += pd; return { v, lo, hi, Y: y => T + (1 - (y - lo) / (hi - lo)) * (H - T - B) }; };
  const ws = series('w', kg => imperial() ? kg * 2.20462 : kg), bs = series('bf', x => x);
  let g = '';
  for (let i = 0; i <= 3; i++) { const y = T + i * (H - T - B) / 3; g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.09)"/>`; }
  const path = (s, color) => s ? `<polyline fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" points="${s.v.map(p => `${X(p[0]).toFixed(1)},${s.Y(p[1]).toFixed(1)}`).join(' ')}"/>` + s.v.map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${s.Y(p[1]).toFixed(1)}" r="2" fill="${color}"/>`).join('') : '';
  g += path(ws, 'var(--ac)') + path(bs, 'var(--gold)');
  const axis = (s, x, anc, color) => s ? [s.hi, (s.hi + s.lo) / 2, s.lo].map((v, i) => `<text x="${x}" y="${T + i * (H - T - B) / 2 + 4}" font-size="9.5" text-anchor="${anc}" fill="${color}" font-family="ui-monospace,monospace">${v.toFixed(1)}</text>`).join('') : '';
  g += axis(ws, L - 4, 'end', 'var(--ac)') + axis(bs, W - R + 4, 'start', '#d9b56c');
  g += `<text x="${L}" y="${H - 5}" font-size="9.5" fill="#5d636d">${fmtDate(pts[0].date)}</text><text x="${W - R}" y="${H - 5}" font-size="9.5" fill="#5d636d" text-anchor="end">${fmtDate(pts[pts.length - 1].date)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg><div class="legend"><span><i style="background:var(--ac)"></i>Weight (${imperial() ? 'lb' : 'kg'})</span><span><i style="background:var(--gold)"></i>Body fat (%)</span></div>`;
}
function ringSvg(p, size = 58) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ac)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" font-size="13" fill="#e7e9ec" font-family="ui-monospace,monospace">${Math.round(p * 100)}%</text></svg>`;
}

/* ---------- formatting helpers ---------- */
function fmtTarget(t, u) {
  if (!u || !t) return '';
  if (u === 'km') return imperial() ? (t * 0.621371).toFixed(1) + ' mi' : (+t).toFixed(1).replace(/\.0$/, '') + ' km';
  if (u === 'sec') return t >= 60 ? fmtSec(t) + ' min' : t + ' s';
  if (u === 'ch') return t + (t === 1 ? ' chapter' : ' chapters');
  return (Math.round(t * 10) / 10) + ' ' + (UNIT[u] || u);
}
const listRank = l => { const i = LIST_ORDER.indexOf(l); return l === 'Wind Down' ? 999 : i < 0 ? 50 : i; };
const chipsOn = sel => $$(sel + ' .chip.on').map(b => b.dataset.k);

/* ---------- toasts & modals ---------- */
function toast(msg, cls = '') { const box = $('#toasts'); while (box.children.length >= 3) box.firstChild.remove(); const el = document.createElement('div'); el.className = 'toast ' + cls; el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600); }
let modalLocked = false;
function openModal(html, opts = {}) { const m = $('#modal'); m.innerHTML = `<div class="sheet ${opts.cls || ''}">${html}</div>`; m.hidden = false; modalLocked = !!opts.lock; }
function closeModal(force) { if (modalLocked && !force) return; modalLocked = false; $('#modal').hidden = true; $('#modal').innerHTML = ''; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
function showDonation() { // the locked sheet for fixed penalties you owe (v14: any of yours, the $5 donation by default)
  if (!owedFix().length || !$('#modal').hidden && modalLocked) return;
  const groups = {}; S.owed.forEach(o => { const g = groups[o.f + '|' + o.t + '|' + (o.sym || '')] = groups[o.f + '|' + o.t + '|' + (o.sym || '')] || { t: o.t, sym: o.sym, amt: 0, has: false, days: [] }; g.days.push(o.k); if (o.amt > 0) { g.amt += o.amt; g.has = true; } });
  const gs = Object.values(groups), allDon = gs.every(g => /donat/i.test(g.t));
  openModal(`<h3 class="bad">Penalty: ${allDon ? 'donation' : 'fixed penalty'} owed</h3>
    <p class="mu">${S.owed.every(o => !o.at) ? 'You missed <b>every</b> quest on' : 'Your day fell to your fixed-penalty line on'} ${[...new Set(S.owed.map(o => o.k))].sort().map(fmtDate).map(esc).join(', ')}.</p>
    ${gs.map(g => `<div class="owed"><b>${esc(g.t)}</b>${g.has ? ` <b class="num bad">${esc(penAmt(g.amt, g.sym))}</b>` : ''}${g.days.length > 1 ? `<span class="mu small"> · ${g.days.length} days</span>` : ''}</div>`).join('')}
    <p class="small mu">Any penalty quests have been added to your Quests.</p>
    <label class="check"><input type="checkbox" id="donchk"> ${allDon ? 'I have made the donation' : 'I have done it'}</label>
    <div class="actions"><button class="btn-bad" data-a="donated">${allDon ? 'Yes, I donated' : 'Yes, done'}</button></div>`, { lock: true, cls: 'danger' });
}
function focusModal(q, c) {
  openModal(`<h3>${esc(q.title)}</h3><p class="mu small">What did you work on? The time is split across the parts you pick and grows those sides of the hexagon.</p>
  <div class="chips" id="focusChips">${c.stats.map(x => `<button class="chip on" data-a="chipT" data-k="${esc(x.k)}">${esc(x.n)}</button>`).join('')}</div>
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="focusDone" data-id="${esc(q.key)}">Complete</button></div>`);
}

/* ---------- feedback: check sound, vibration, celebrations ---------- */
const fxOpts = () => Object.assign({ sound: true, haptic: true, cele: true }, S.fx || {});
let actx = null;
function chime(notes) { // tiny synthesized "tick" so no audio files are needed
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime;
    notes.forEach(([freq, at, dur, vol = .16, type = 'triangle']) => {
      const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t0 + at);
      g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(vol, t0 + at + .008); g.gain.exponentialRampToValueAtTime(.0008, t0 + at + dur);
      o.connect(g); g.connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + dur + .02);
    });
  } catch (e) { }
}
function fx(kind) {
  const o = fxOpts();
  if (o.haptic && navigator.vibrate) { try { navigator.vibrate(kind === 'day' ? [18, 60, 18, 60, 40] : kind === 'tick' ? 10 : [14, 40, 22]); } catch (e) { } }
  if (!o.sound) return;
  if (kind === 'tick') chime([[1180, 0, .07, .1]]);
  else if (kind === 'day') chime([[784, 0, .16], [988, .1, .16], [1175, .2, .18], [1568, .32, .42, .12, 'sine']]);
  else chime([[880, 0, .07], [1320, .055, .16, .14, 'sine']]);
}
const STREAK_MARKS = [3, 7, 14, 21, 30, 45, 60, 75, 100, 150, 200, 250, 300, 365];
const isMilestone = n => STREAK_MARKS.includes(n) || (n > 365 && (n % 100 === 0 || n % 365 === 0));
function checkPerfect() { // the moment the last daily quest is checked
  const k = todayKey(), d = S.days[k], pi = pauseInfo(k); if (!d || d.cele || (pi && pi.all) || !d.q.length || !d.q.every(q => q.done)) return;
  d.cele = true; const n = S.streak.cur + 1;
  setTimeout(() => {
    fx('day');
    if (isMilestone(n)) celebrate(`${n}-day streak`, n === 3 ? 'Three perfect days in a row. The habit is taking root.' : n < 30 ? `${n} perfect days in a row. Keep the fire going.` : n < 100 ? `${n} days without missing a single quest. That's discipline.` : `${n} days. Unbroken. Truly remarkable.`, { big: String(n) });
    else toast(`Perfect day · streak ${n} and +1 coin tomorrow`, 'lv');
  }, 250);
}
function celebrate(title, msg, o = {}) {
  const box = document.createElement('div'); box.className = 'cele';
  box.innerHTML = `<canvas></canvas><div class="cele-card">${o.big ? `<div class="cele-n">${esc(o.big)}</div>` : `<div class="cele-ic">${ICON.gift}</div>`}<h3>${esc(title)}</h3><p>${esc(msg)}</p>${o.reward ? `<div class="cele-rw">${esc(o.reward)}</div>` : ''}<button class="btn-p" data-a="celeClose">${o.btn || 'Keep going'}</button></div>`;
  document.body.appendChild(box);
  box.addEventListener('click', e => { if (e.target === box || e.target.tagName === 'CANVAS' || e.target.closest('[data-a=celeClose]')) box.remove(); });
  if (fxOpts().cele && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) fireworks(box.querySelector('canvas'));
}
function fireworks(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, g = cv.getContext('2d');
  const cs = getComputedStyle(document.documentElement), cols = [cs.getPropertyValue('--gold').trim() || '#e2c27a', cs.getPropertyValue('--ac').trim() || '#f2a9bb', '#ffffff', '#ffd27a', '#9fd4ff'];
  const parts = [], t0 = performance.now();
  const burst = (x, y) => { const c = cols[Math.floor(Math.random() * cols.length)], n = 46; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + Math.random() * .2, v = (2.2 + Math.random() * 2.6) * dpr; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c }); } };
  const plan = [[.25, .3, 0], [.72, .24, 380], [.5, .18, 760], [.3, .4, 1150], [.68, .38, 1500], [.5, .3, 1900]].map(([x, y, at]) => ({ x: x * W, y: y * H, at, done: false }));
  (function frame(now) {
    if (!cv.isConnected) return;
    const t = now - t0; g.clearRect(0, 0, W, H);
    plan.forEach(p => { if (!p.done && t >= p.at) { p.done = true; burst(p.x, p.y); } });
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += .045 * dpr; q.vx *= .985; q.vy *= .985; q.life -= .011; if (q.life <= 0) { parts.splice(i, 1); continue; } g.globalAlpha = Math.max(0, q.life); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, 2.1 * dpr, 0, 6.283); g.fill(); }
    if (t < 3800 || parts.length) requestAnimationFrame(frame);
  })(t0);
}

/* ---------- render: chrome ---------- */
function renderTop() {
  const o = overall(), rk = rankOf(o.L);
  $('#top').innerHTML = `<div class="topbar">${emblem(rk.tier, 36)}<div class="lv"><b>Lv ${o.L}</b><small>${esc(rk.name)}</small>
    <div class="bar gold"><i style="width:${(o.into / o.need * 100).toFixed(1)}%"></i></div></div>
    <button class="coins" data-a="goBoard" data-id="rewards" title="Coins" aria-label="${S.coins || 0} coins">${ICON.coin}<span class="num">${S.coins || 0}</span></button>
    <div class="streak" title="Streak">${ICON.flame}<span class="num">${S.streak.cur}</span></div></div>`;
}
function renderNav() {
  const tabs = [['home', 'Home', ICON.home], ['today', 'Quests', ICON.today], ['board', 'Board', ICON.board], ['cal', 'Calendar', ICON.cal], ['log', 'Log', ICON.log], ['me', 'Profile', ICON.me]];
  $('#nav').innerHTML = tabs.map(([id, n, ic]) => `<button class="${ui.tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${ic}<span>${n}</span></button>`).join('');
}
function render() {
  ui.season = applySeason();
  if (!S.setup) return renderSetup();
  if (ui.tab === 'body') { ui.tab = 'log'; ui.logSeg = 'body'; }
  document.body.dataset.tab = ui.tab;
  document.documentElement.classList.toggle('noscroll', ui.tab === 'home'); // Home is one fixed screen (v11)
  renderTop(); renderNav();
  $('#view').innerHTML = ({ home: viewHome, today: viewToday, board: viewBoard, cal: viewCal, log: viewLog, me: viewMe })[ui.tab]();
  fitSeason($('#view'));
  if (ui.tab === 'me' && ui.profSeg === 'settings') initWheels($('#view'));
  const rk = ui.tab === 'me' && $('#view .ranks .rk.cur'); if (rk) rk.parentNode.scrollLeft = Math.max(0, rk.offsetLeft - rk.parentNode.offsetLeft - 90);
  if (ui.tab === 'log' && ui.logSeg === 'workout') updateWkcal();
  if (S.owed.length) showDonation(); else streakOffer();
  showCoinNote();
}
/* ---------- views: home (the season scene, no quests) ---------- */
function viewHome() {
  const k = todayKey(), d = ensureDay(k), q = d.q, done = q.filter(x => x.done).length, o = overall(), rk = rankOf(o.L);
  const side = (S.side || []).filter(x => x.status === 'active' && x.start <= k).length, rw = (S.rewards || []).filter(r => !r.used).length;
  return `<div class="home">${homeHero()}
    <div class="home-st">
      <span class="hs gold">${ICON.flame}<b class="num">${S.streak.cur}</b></span>
      <span class="hs"><b>Lv ${o.L}</b>&nbsp;${esc(rk.name)}</span>
      <button class="hs gold" data-a="goBoard" data-id="rewards" aria-label="${S.coins || 0} coins">${ICON.coin}<b class="num">${S.coins || 0}</b></button>
    </div><div class="home-st">
      <button class="hs hs-q" data-a="tab" data-id="today"><b class="num">${done}/${q.length}</b>&nbsp;today${side ? ` · ${side} side` : ''}${ICON.chev}</button>
      ${rw ? `<button class="hs gold" data-a="goBoard" data-id="rewards" aria-label="${rw} rewards waiting">${ICON.gift}<b class="num">${rw}</b></button>` : ''}
      <button class="hs hs-ic" data-a="wallpaper" aria-label="Save this scene as a wallpaper" title="Save as wallpaper">${ICON.img}</button>
    </div></div>`;
}
/* ---------- views: setup ---------- */
function renderSetup() {
  applySeason();
  $('#top').innerHTML = ''; $('#nav').innerHTML = '';
  // v11 (Daniel): nothing is ticked for you: no skills, no tasks, no look
  const tree = pid => subFolders(pid).filter(f => !/^u_/.test(f.id)).map(f => { const own = SKILLS.filter(s => isSkill(s) && s.f === f.id), kids = tree(f.id); if (!own.length && !kids) return '';
    return `<details class="su"><summary><span class="sp">${esc(f.name)}</span>${ICON.chev}</summary>${kids}${own.map(s => `
    <div class="skpick"><label><input type="checkbox" name="sk_${s.id}"> ${esc(s.name)}</label>
    <select name="lv_${s.id}"><option value="1">Beginner</option><option value="2">Intermediate</option><option value="3">Advanced</option></select></div>`).join('')}</details>`; }).join('');
  $('#view').innerHTML = `<div class="hero"><img src="icons/icon-192.png" class="hero-icon" alt=""><h1>Deificatio</h1><p class="mu">Set up your profile. Everything stays on this phone.</p></div>
  <form id="setupForm" onsubmit="return false">
  <div class="card"><h3>Profile</h3>
    <label>Name</label><input name="name" placeholder="Your name" autocomplete="given-name">
    <div class="grid2"><div><label>Sex (for norms)</label><select name="sex"><option value="M">Male</option><option value="F">Female</option></select></div>
    <div><label>Birth year</label><input name="birthYear" type="number" inputmode="numeric" value="2003"></div></div>
    <label class="check" style="margin-top:12px"><input type="checkbox" name="student"> I'm a student <span class="mu2 small">(${VAC_DAYS.student} vacation days a year instead of ${VAC_DAYS.adult}, for school breaks)</span></label>
    <label>Units</label><select name="units" data-c="setupUnits"><option value="imperial">Imperial (lb, ft, mi)</option><option value="metric">Metric (kg, cm, km)</option></select>
    <p class="mu2 small" style="margin:12px 0 0">Height, weight and the goal are optional. They're only used for calorie estimates (the diet goal and workout calories), so skip them if you don't want the health tracking.</p>
    <div class="grid2" id="hw">${SU_HW.imperial}</div>
    <div class="grid2"><div><label id="wlab">Weight (lb, optional)</label><input name="weight" type="number" step="0.1" inputmode="decimal"></div><div><label>Body fat % (optional)</label><input name="bf" type="number" step="0.1" inputmode="decimal"></div></div>
    <label>Weight goal</label><select name="goal"><option value="none" selected>No goal</option><option value="cut">Lose fat (−500 kcal)</option><option value="maintain">Maintain</option><option value="bulk">Build muscle (+300 kcal)</option></select>
  </div>
  <div class="card" id="suLook"><h3>Look</h3><p class="mu small">The app can follow the 72 micro-seasons (七十二候): pick whose names and scenes you want, or use your own look.</p>
    <div class="cal-pick">${[['ko', '한국 칠십이후', 'Korean', 'The original Chinese set read in Korean, with hangul, 뜻풀이 and romanization.', '東風解凍 · 동풍해동', 'ko'], ['ja', '日本の七十二候', 'Japanese', "Japan's own version (本朝七十二候) with kana readings, modern meanings and romaji.", '東風解凍 · はるかぜこおりをとく', 'ja'],
      ['zh', '中国七十二候', 'Chinese', 'The original 72 in Chinese: simplified characters (简体) or traditional (繁體), with pinyin.', '东风解冻 · Dōng fēng jiě dòng', 'zh-Hans'],
      ['own', 'My own theming', 'Your own look', 'A color or your own photo (or the seasonal scenes), with the date & time, your own words or the season names on Home.', '', '']]
      .map(([v, a, n, d, ex, lg]) => `<label class="cal-opt"><input type="radio" name="cal" value="${v}" data-c="calPick" ${ui.suLook === v ? 'checked' : ''}><span><b${lg ? ` lang="${lg}"` : ''}>${a}</b> <span class="mu small">${n}</span><span class="mu2 small">${d}</span>${ex ? `<span class="small" lang="${lg}">${ex}</span>` : ''}</span></label>`).join('')}</div>
    <div id="suText">${suText()}</div>
    <div class="su-more">${ICON.sliders}<p class="small"><b>More to customize later.</b> Profile → Settings → <b>Themes &amp; display</b> has every background (the seasonal scenes, cyberpunk, cottagecore, mountain village, academia, a color or your photo), the UI styles, color wheels for cards, buttons and highlights, the Home text and how the season names show.</p></div>
  </div>
  <div class="card"><h3>Daily rhythm</h3><p class="mu small">Your day resets at wake time. "Phone away & asleep" locks 15 minutes after sleep time.</p>
    <div class="grid2"><div><label>Wake time</label><input name="wake" type="time" value="07:00"></div><div><label>Sleep time</label><input name="sleep" type="time" value="23:00"></div></div>
  </div>
  <div class="card"><h3>Skills to train</h3><p class="mu small">Tick what goes on your quest list, then pick your current level. Open a folder to see its skills. Weekdays can be changed later in Calendar → Weekly plan, and you can create your own skills and folders in Board → Skills.</p>
  <div class="lib su-tree">${tree(null)}</div>
  </div>
  <div class="card"><h3>Daily tasks</h3><p class="mu small">Everyday basics with an XP bar and achievements instead of a hexagon. You can change these any time in Board → Tasks.</p>
  ${TASKS.map(t => `<div class="skpick"><label><input type="checkbox" name="tk_${t.id}"> ${esc(t.name)}</label><span class="mu2 small">${esc(taskDesc(t))}</span></div>`).join('')}
  </div>
  <button class="btn-p btn-big" data-a="finishSetup">Start</button>
  </form>
  <p class="mu2 small" style="text-align:center;margin-top:14px">Have a backup? <a href="#" data-a="importOpen">Restore it</a><input type="file" id="importFile" accept="application/json,.json,text/plain,.txt" hidden></p>`;
}
const SU_HW = { // setup: height (optional)
  imperial: '<div><label>Height (ft, optional)</label><input name="ft" type="number" inputmode="numeric" placeholder="5"></div><div><label>Height (in)</label><input name="in" type="number" inputmode="numeric" placeholder="10"></div>',
  metric: '<div><label>Height (cm, optional)</label><input name="cm" type="number" inputmode="numeric" placeholder="178"></div><div></div>' };
function suBgMode() { const t = S.theme || {}; return t.id === 'seasonal' ? 'scenes' : t.id === 'custom' && custOpts().mode === 'photo' && custPhoto.url ? 'photo' : 'color'; }
function suText() { // setup: Home text (+ the background for your own look), shown once a look is picked
  const look = ui.suLook; if (!look) return '';
  const bg = custOpts().bg, m = suBgMode();
  // your own look: colors on the left; your photo and the seasonal scenes on the right
  const own = look !== 'own' ? '' : `<label>Background</label><div class="su-bg">
      <div class="su-bgl"><div class="mu2 small">A color</div><div class="cw-swatches su-sw">${SWATCHES.map(c => `<button class="cw-s${m === 'color' && c === bg ? ' on' : ''}" style="background:${c}" data-a="suBg" data-id="${c}" aria-label="${c}"></button>`).join('')}</div></div>
      <div class="su-bgr">
        <button class="su-opt${m === 'photo' ? ' on' : ''}" data-a="suPhoto">${custPhoto.url ? `<img src="${custPhoto.url}" alt="">` : `<i class="su-ic">${ICON.camera}</i>`}<span><b>My photo</b><small>${custPhoto.url ? 'Tap to change' : 'From this phone'}</small></span></button>
        <button class="su-opt${m === 'scenes' ? ' on' : ''}" data-a="suScenes"><i class="su-ic sc"></i><span><b>Seasonal scenes</b><small>The 72 micro-seasons</small></span></button>
        <input type="file" id="suPhotoIn" accept="image/*" hidden>
      </div></div>
    ${m === 'scenes' ? `<label>Scenes &amp; season names</label><div class="seg tight cal-seg">${[['ko', '한국', 'Korean'], ['ja', '日本', 'Japanese'], ['zh', zhTrad() ? '中國' : '中国', 'Chinese']].map(([v, a, n]) => `<button class="${calSet() === v ? 'on' : ''}" data-a="suCal" data-id="${v}"><b lang="${v === 'zh' ? calLang() : v}">${a}</b> ${n}</button>`).join('')}</div>` : ''}`;
  const zh = calSet() === 'zh' && (look === 'zh' || (look === 'own' && m === 'scenes')) ? `<label>Characters</label><div class="seg tight">${[['simp', '简体', 'Simplified'], ['trad', '繁體', 'Traditional']].map(([v, a, n]) => `<button class="${(zhTrad() ? 'trad' : 'simp') === v ? 'on' : ''}" data-a="suScript" data-id="${v}"><b lang="${v === 'trad' ? 'zh-Hant' : 'zh-Hans'}">${a}</b> ${n}</button>`).join('')}</div>` : '';
  return `${own}${zh}<label>Home text</label><div id="htF" data-setup="1">${htFields(true)}</div>
    <div class="ht-prev">${homeHero(true)}</div>`;
}
function suRefresh() { const el = $('#suText'); if (el) { el.innerHTML = suText(); fitSeason(el); } }
function suLook(v) { // picking Korean / Japanese / my own theming at setup previews it right away
  const was = ui.suLook; ui.suLook = v;
  if (v === 'own') { S.theme = { id: 'custom', custom: Object.assign(custOpts(), { mode: 'color' }) }; if (htOpts().mode === 'season') htSet(o => { o.mode = 'clock'; }); }
  else { S.cal = v; if (S.theme && S.theme.id === 'custom') S.theme = null; if (was === 'own' && htOpts().mode === 'clock') htSet(o => { o.mode = 'season'; }); }
  ui.season = applySeason(); suRefresh();
}
function finishSetup() {
  const f = new FormData($('#setupForm')), g = k => f.get(k);
  const look = g('cal'), ho = htOpts(), stop = (m, el) => { toast(m, 'bad'); const t = el && $(el); if (t) t.scrollIntoView({ block: 'center' }); };
  if (!look) return stop('Pick a look: Korean, Japanese, Chinese or your own', '#suLook');
  if (ho.mode === 'custom' && !(ho.main || '').trim()) return stop('Type your Home text, or pick Date & time', '#suLook');
  if (ho.mode === 'clock' && ho.time === 'off' && ho.date === 'off') return stop('Pick a time or a date for Home', '#suLook');
  if (![...f.keys()].some(x => /^(sk|tk)_/.test(x)) && !confirm('You didn’t pick any skills or daily tasks, so your quest list starts almost empty. Start anyway? You can add them any time in Board.')) return;
  const p = S.profile;
  p.name = (g('name') || '').trim(); p.sex = g('sex'); p.birthYear = +g('birthYear') || 2000; p.units = g('units'); p.student = !!g('student');
  const hIn = (+g('ft') || 0) * 12 + (+g('in') || 0); // v14: height & weight are optional (null = not given)
  p.heightCm = p.units === 'imperial' ? (hIn > 0 ? Math.round(hIn * 2.54) : null) : (+g('cm') > 0 ? +g('cm') : null);
  const w = num(g('weight')); p.weightKg = w ? (p.units === 'imperial' ? w / 2.20462 : w) : null;
  p.goal = GOAL_NAME[g('goal')] ? g('goal') : 'none'; p.wake = g('wake') || '07:00'; p.sleep = g('sleep') || '23:00';
  if (look !== 'own') S.cal = look; // own theming keeps the names picked for its seasonal scenes (Korean unless changed)
  if (look === 'own' && !(S.theme && ['custom', 'seasonal'].includes(S.theme.id))) S.theme = { id: 'custom', custom: Object.assign(custOpts(), { mode: 'color' }) };
  const today = todayKey(); p.start = today;
  const bf = num(g('bf')); if (w || bf != null) S.body.push({ id: uid(), date: today, w: w ? p.weightKg : null, bf });
  for (const t of TASKS) if (f.get('tk_' + t.id)) adoptTask(t.id);
  for (const s of SKILLS) {
    if (!isSkill(s) || !f.get('sk_' + s.id)) continue;
    const st = skState(s.id), lv = +g('lv_' + s.id);
    st.active = true; st.load = [1, 1, 1.6, 2.3][lv];
    st.days = s.cat === 'Faith' || s.cat === 'Languages' ? [0, 1, 2, 3, 4, 5, 6] : s.phys ? [1, 3, 5] : [1, 2, 3, 4, 5];
    const rv = [0, 3, 5, 7][lv]; s.stats.forEach(x => { if (x.t === 'r') st.r[x.k] = rv; });
  }
  skState('discipline');
  S.setup = true; S.lastEval = addDays(today, -1);
  window.scrollTo(0, 0);
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  boot();
}

/* ---------- views: today ---------- */
function pauseBanner(p, tk) {
  const em = p.type === 'emergency';
  const until = p.end ? (p.end === tk ? 'Ends today' : 'Until ' + fmtDate(p.end)) : 'Until you end it';
  return `<div class="banner ${em ? 'em' : p.type === 'pass' ? 'ps' : ''}"><div class="row">${p.type === 'pass' ? ICON.gift : ICON.pause}<b class="sp">${PAUSE_NAME[p.type] || 'Vacation'}${p.note ? ' · ' + esc(p.note) : ''}</b></div>
    <div class="small mu" style="margin-top:4px">${em ? 'All quests paused, including penalties. Streak frozen, no penalties.' : p.type === 'pass' ? `You earned this. Paused: ${esc(scopeTxt(p))}. No logging needed, no penalties.` : 'Paused: ' + esc(scopeTxt(p)) + '.'} ${esc(until)}.</div>
    <div class="row" style="margin-top:10px;gap:8px">${p.start === tk ? `<button class="btn-s" data-a="pCancel" data-id="${p.id}">${em ? 'Resume today' : 'Cancel pause'}</button>` : ''}${p.end !== tk ? `<button class="btn-s" data-a="pEnd" data-id="${p.id}">${em ? 'Resume tomorrow' : 'End early'}</button>` : ''}</div></div>`;
}
function seasonMini(si) { // one-line season label for the Quests tab (the full header lives on Home)
  if (!si || (themeId() === 'custom' && htOpts().mode !== 'season')) return ''; // your own look: no season label
  const o = szOpts(), m = o.main, lat = LATIN_PARTS.includes(m), t = szText('term', si), h = szText('hu', si), lg = SZC().lang[m] || 'ko';
  return `<div class="sz-mini" data-a="seasonList" role="button" aria-label="Browse the 72 micro-seasons"><b${lat ? '' : ` lang="${lg}"`} class="${lat ? 'lat' : ''}${m === 'ja' ? ' kana' : ''}">${esc(h[m])}</b><span class="mu small">${esc(m === 'en' ? t.en : t[m] + (m === 'hj' || m === 'ko' || m === 'ja' || m === 'hz' ? ' · ' + h.en : ''))}</span></div>`;
}
function viewToday() {
  const k = todayKey(), d = ensureDay(k), q = d.q, pi = pauseInfo(k);
  const done = q.filter(x => x.done).length, pct = q.length ? done / q.length : 0;
  const xpToday = q.reduce((a, x) => a + (x.task ? (x.progress || 0) * (x.xpPer || 0) : x.done ? x.xp : 0), 0);
  const lists = [...new Set(q.map(x => x.list))].sort((a, b) => listRank(a) - listRank(b));
  const now = Date.now(), dayN = S.profile.start ? daysBetween(S.profile.start, k) + 1 : 1;
  const fst = fastOn(k);
  const badges = [S.rest.includes(k) ? '<span class="pill">Rest day</span>' : '', isDeload(k) ? '<span class="pill">Deload week · −25%</span>' : '', d.penTier || (d.penFixed || []).length ? `<span class="pill bad">Penalty${d.penTier ? ' · ' + esc(penTierName(d.penTier)) : ''}</span>` : '',
    fst ? `<span class="pill gold">Fasting · day ${fastDay(fst, k)}/${fastLen(fst)}</span>` : ''].filter(Boolean).join(' ');
  const qrow = x => {
    if (x.side) return dueRow(x);
    const locked = !x.done && x.lockAt && now > x.lockAt;
    const t = x.task ? S.tasks[x.task] : null, n = x.sessions || 1;
    const lv = x.skill && SK[x.skill] ? `Lv ${skLevel(x.skill).L}` : t ? `Lv ${taskLevel(t).L}` : '';
    const hasProg = x.progress > 0 && !x.done && !x.task;
    const prog = hasProg && x.target ? `<div class="prog"><i style="width:${Math.min(100, x.progress / x.target * 100)}%"></i></div>` : '';
    const sub = x.key === 'diet' ? dietSub(k) : [x.task ? (x.unit === 'min' ? fmtTarget(x.target, 'min') + (n > 1 ? ' each' : '') : '') : hasProg ? `${fmtTarget(x.progress, x.unit)} of ${fmtTarget(x.target, x.unit)}` : fmtTarget(x.target, x.unit), x.task && n > 1 ? `${x.progress || 0} of ${n}` : '', lv, locked ? 'locked' : ''].filter(Boolean).join(' · ');
    const pips = x.task && n > 1 ? `<div class="pips">${Array.from({ length: n }, (_, i) => `<i class="${i < (x.progress || 0) ? 'on' : ''}"></i>`).join('')}</div>` : '';
    const minus = x.task && n > 1 && x.progress > 0 && !x.done ? `<button class="btn-g x" data-a="tqMinus" data-id="${esc(x.key)}" aria-label="Undo one">${ICON.minus}</button>` : '';
    const plus = !x.task && !x.auto && !x.side && x.unit && x.target > 0 && !locked ? `<button class="btn-g x qplus" data-a="qLog" data-id="${esc(x.key)}" aria-label="Log ${esc(UNIT_NAME[x.unit] || 'amount')}">${ICON.plus}</button>` : '';
    const chk = x.done ? ICON.check : x.task && n > 1 && x.progress ? `<span class="num chk-n">${x.progress}</span>` : '';
    return `<div class="q ${x.done ? 'done' : ''} ${x.pen ? 'pen' : ''} ${x.auto ? 'auto' : ''} ${locked ? 'locked' : ''} ${x.task ? 'task' : ''}"><button class="chk${x.task && n > 1 && x.progress && !x.done ? ' part' : ''}" data-a="tq" data-id="${esc(x.key)}" aria-label="Check ${esc(x.title)}">${chk}</button>
      <div class="qb"><div class="qt">${esc(x.title)}</div>${sub ? `<div class="qs">${esc(sub)}</div>` : ''}${pips}${prog}</div>${minus}${plus}<div class="qx${x.lockB ? ' lkb' : ''}"${x.lockB ? ` title="Locked schedule: +${Math.round(LOCK_BONUS * 100)}% XP"` : ''}>${x.lockB ? ICON.lock : ''}+${x.xp}</div></div>`;
  };
  const rw = (S.rewards || []).filter(r => !r.used), side = sideSection();
  const rwNew = rw.filter(r => !(S.rwHidden || []).includes(r.id)); // v16: ✕ hides the banner until a new reward arrives
  const rwBanner = rwNew.length ? `<div class="banner rw rw-x"><button class="rw-go" data-a="goBoard" data-id="rewards"><div class="row">${ICON.gift}<b class="sp">${rw.length === 1 ? 'You have a reward waiting' : rw.length + ' rewards waiting'}</b>${ICON.chev}</div><div class="small mu" style="margin-top:3px;text-align:left">${esc(rw.slice(0, 2).map(rewardName).join(' · '))}</div></button><button class="btn-g x rw-close" data-a="rwHide" aria-label="Hide until a new reward">✕</button></div>` : '';
  if (pi && pi.all) return `${seasonMini(ui.season)}${pi.ps.map(p => pauseBanner(p, k)).join('')}${streakNag(k)}${backupNag(k)}${rwBanner}<div class="empty">${pi.emergency ? 'Nothing today. Take care of what matters.' : pi.ps.some(p => p.type === 'pass') ? 'You earned this rest. Nothing to log today.' : 'Everything is paused. Enjoy the break.'}</div>
  ${side}<div class="row" style="justify-content:center;margin-top:12px"><button class="btn-s" data-a="tab" data-id="log">Log a workout anyway</button></div>`;
  return `${seasonMini(ui.season)}${pi ? pi.ps.map(p => pauseBanner(p, k)).join('') : ''}${streakNag(k)}${ownNag()}${backupNag(k)}${rwBanner}
  <div class="card ring"><div style="flex:none">${ringSvg(pct)}</div><div class="sp"><div class="mu2 small">Day ${dayN}</div><h3>${fmtDate(k)}</h3>
    <div class="mu small"><span class="num">${done}/${q.length}</span> quests · <span class="gold num">+${xpToday} XP</span></div>${badges ? `<div class="badges">${badges}</div>` : ''}</div></div>
  ${q.length ? lists.map(l => `<div class="qlist"><div class="qhead"><h2 class="${l === 'Penalty' ? 'bad' : ''}">${esc(l)}</h2><span class="mu2 small num">${q.filter(x => x.list === l && x.done).length}/${q.filter(x => x.list === l).length}</span></div>
    ${q.filter(x => x.list === l).map(qrow).join('')}</div>`).join('') : `<div class="empty">${pi && pi.emergency ? 'Nothing today. Take care of what matters.' : 'Nothing scheduled today.'}</div>`}
  ${side}
  <div class="row" style="margin-top:16px"><button class="btn-s" data-a="regen">Refresh quests</button><span class="sp"></span><button class="btn-s" data-a="goBoard" data-id="tasks">Edit quests</button></div>
  <p class="mu2 small note">Targets adapt: finishing a skill raises it about 8% a week; missing lowers it 6%, unless you set your own target on its skill card. Every 4th week is a deload. Tap + to log reps, seconds or distance. Penalties: ${esc(penRulesTxt())} Change them in Profile → Settings → Penalties. Side quests count only on their due days (deadline or checkpoint day), unless you switch that off.</p>
  ${pi && pi.emergency ? '' : '<div style="text-align:center;margin-top:6px"><button class="btn-g bad small" data-a="emNew">Extreme emergency</button></div>'}`;
}
/* ---------- side quests: one-time & time-limited ----------
   S.side = [{ id, type 'once'|'timed', title, note, diff 1-4, start, due|null, durN, durU 'd'|'w'|'m'|'y'|'done',
     track 'check'|'cp'|'time', cps [{ id, t, day|null, done|null }], goalMin, log [{ date, min }],
     reward null|{ kind 'custom', text }|{ kind 'pass', days, all, lists, skills, tasks }, status 'active'|'done'|'expired'|'given', doneOn, xpGot,
     req (v11; missing = true), failed }]
   They run on their own clock. v11: a quest with req on counts toward the day on its due dates (the deadline, and any
   checkpoint with a quest day): those days get a 'Due today' quest (key sd:<id> / sc:<id>:<cp>) that is done when the
   quest / checkpoint was finished by the end of that day. Missing it = an incomplete day = penalties. Giving up a
   counted quest that still has a due date ahead fails it today. With req off they never count and never cost anything. */
const SIDE_XP = { 1: 25, 2: 50, 3: 100, 4: 200 };
const SIDE_DIFF = ['', 'Easy', 'Medium', 'Hard', 'Epic'];
const DUR_U = { d: 'days', w: 'weeks', m: 'months', y: 'years' };
const durTxt = (n, u) => `${n} ${n === 1 ? DUR_U[u].slice(0, -1) : DUR_U[u]}`;
const sideXp = q => SIDE_XP[q.diff || 2] * (q.type === 'timed' ? 2 : 1);
const sideMin = q => (q.log || []).reduce((a, l) => a + l.min, 0);
const cpDate = (q, c) => c.day ? addDays(q.start, c.day - 1) : null;
function addDur(k, n, u) {
  if (u === 'd') return addDays(k, n - 1);
  if (u === 'w') return addDays(k, n * 7 - 1);
  const d = dparse(k); if (u === 'm') d.setMonth(d.getMonth() + n); else d.setFullYear(d.getFullYear() + n); d.setDate(d.getDate() - 1); return dkey(d);
}
function sideProg(q) {
  if (q.track === 'cp') return q.cps.length ? q.cps.filter(c => c.done).length / q.cps.length : 0;
  if (q.track === 'time') return Math.min(1, sideMin(q) / Math.max(1, q.goalMin || 60));
  return q.status === 'done' ? 1 : 0;
}
function sideLeft(q) {
  if (q.status !== 'active') return q.status === 'done' ? `Done ${fmtDate(q.doneOn)}` : q.status === 'expired' ? `${q.failed ? 'Failed' : 'Expired'} ${fmtDate(q.due)}` : 'Given up';
  if (q.start > todayKey()) return `Starts ${fmtDate(q.start)}`;
  if (!q.due) return q.type === 'timed' ? 'Until it’s done' : 'No deadline';
  const n = daysBetween(todayKey(), q.due); return n === 0 ? 'Last day today' : n === 1 ? '1 day left' : n < 60 ? `${n} days left` : `Until ${fmtDate(q.due)}`;
}
const DUE_LIST = 'Due today';
const sideCounts = q => q.req !== false;
const sideHasDue = q => !!q.due || (q.track === 'cp' && (q.cps || []).some(c => c.day));
const sideFutureDue = (q, k) => (q.due && q.due >= k) || (q.track === 'cp' && (q.cps || []).some(c => !c.done && cpDate(q, c) && cpDate(q, c) >= k));
function sideDueQuests(k) { // the side quests that count toward day k
  const out = [];
  for (const q of S.side || []) {
    if (!sideCounts(q) || !q.start || q.start > k || (q.created && q.created > k)) continue;
    if ((q.status === 'done' || q.status === 'given') && q.doneOn < k) continue;
    const gaveUp = q.status === 'given' && q.doneOn === k && sideFutureDue(q, k), last = q.due === k || gaveUp;
    if (last) out.push({ key: 'sd:' + q.id, side: q.id, title: q.title, list: DUE_LIST, unit: '', target: 0, progress: 0, done: false, xp: sideXp(q) });
    if (q.track === 'cp' && !last) (q.cps || []).forEach(c => { if (cpDate(q, c) === k && (!q.due || k < q.due)) out.push({ key: `sc:${q.id}:${c.id}`, side: q.id, cp: c.id, title: c.t || 'Checkpoint', list: DUE_LIST, unit: '', target: 0, progress: 0, done: false, xp: 10 }); });
  }
  return out;
}
function sideEntryDone(x, k) {
  const q = (S.side || []).find(s => s.id === x.side); if (!q) return !!x.done;
  if (x.cp) { const c = q.cps.find(z => z.id === x.cp); return !!(c && c.done && c.done <= k); }
  return q.status === 'done' && !!q.doneOn && q.doneOn <= k;
}
function syncSide(k) { // keep a day's "Due today" quests in step with the side quests (never touches evaluated days)
  const d = S.days[k]; if (!d || d.ev) return;
  const pi = pauseInfo(k), want = pi && pi.all ? [] : sideDueQuests(k).filter(w => !(pi && pi.lists.has(w.list)));
  const keys = new Set(want.map(w => w.key));
  d.q = d.q.filter(x => !x.side || keys.has(x.key));
  const have = new Set(d.q.map(x => x.key));
  want.forEach(w => { if (!have.has(w.key)) d.q.push(w); });
  d.q.forEach(x => { if (!x.side) return; const w = want.find(y => y.key === x.key); if (w) { x.title = w.title; x.xp = w.xp; } x.done = sideEntryDone(x, k); });
}
function cpToggle(q, c) {
  if (!c || q.status !== 'active') return;
  if (!c.done) { c.done = todayKey(); q.xpGot = (q.xpGot || 0) + 10; addXp(null, 10); fx('tick'); } else { c.done = null; q.xpGot = Math.max(0, (q.xpGot || 0) - 10); addXp(null, -10, true); }
  if (q.cps.every(x => x.done)) { completeSide(q); return; }
  afterChange(); if (c.done) toast('Checkpoint done: ' + c.t, 'ti');
}
function sideTap(x) { // checking a "Due today" quest on the Quests tab
  const q = (S.side || []).find(s => s.id === x.side); if (!q) return;
  if (q.status !== 'active') { toast(q.status === 'done' ? 'Already complete' : q.status === 'given' ? 'You gave up on this one: it counts as failed today' : 'This quest is over', q.status === 'done' ? '' : 'bad'); return; }
  if (x.cp) { cpToggle(q, q.cps.find(z => z.id === x.cp)); return; }
  if (q.track === 'check') { if (confirm(`Complete "${q.title}"?`)) completeSide(q); return; }
  if (q.track === 'cp') { const c = q.cps.find(z => !z.done); if (c) cpToggle(q, c); return; }
  ui.tab = 'board'; ui.boardSeg = q.type; ui.sideOpen = q.id; render(); window.scrollTo(0, 0); // time logged: log it on the card
}
function passName(p) { const d = p.days || 1; return `${d === 1 ? 'A complete rest day' : d + ' complete rest days'}${p.all ? '' : ' · ' + scopeTxt(p)}`; }
const rewardName = r => r.kind === 'pass' ? passName(r.pass || {}) : r.text || 'A treat';
function completeSide(q) {
  const k = todayKey(); q.status = 'done'; q.doneOn = k;
  const xp = sideXp(q); q.xpGot = (q.xpGot || 0) + xp; addXp(null, xp); addXp('discipline', 5, true);
  let rw = null;
  if (q.reward && (q.reward.kind === 'custom' || q.reward.kind === 'pass')) {
    rw = { id: uid(), qid: q.id, from: q.title, kind: q.reward.kind, text: q.reward.text || '', earned: k, used: null };
    if (rw.kind === 'pass') rw.pass = { days: q.reward.days || 1, all: !!q.reward.all, lists: (q.reward.lists || []).slice(), skills: (q.reward.skills || []).slice(), tasks: (q.reward.tasks || []).slice() };
    S.rewards.push(rw);
  }
  afterChange(); fx('day');
  celebrate('Quest complete', q.title + ` · +${xp} XP`, { reward: rw ? 'You earned: ' + rewardName(rw) : null, btn: rw ? 'Claim it later' : 'Keep going' });
}
function expireSide(quiet) {
  const tk = todayKey();
  (S.side || []).forEach(q => {
    if (q.status !== 'active' || !q.due || q.due >= tk) return;
    q.status = 'expired'; if (sideCounts(q)) q.failed = true;
    if (!quiet) toast(q.failed ? `Quest failed: ${q.title} · it counted toward ${fmtShort(q.due)}` : 'Quest expired: ' + q.title + ' · no penalty', q.failed ? 'bad' : '');
  });
}
function dueRow(x) { // a side quest that counts toward today, in the Quests list
  const q = (S.side || []).find(s => s.id === x.side), over = q && q.status !== 'active' && !x.done;
  const sub = !q ? '' : x.cp ? `${q.title} · checkpoint due today` : [q.status === 'given' ? 'Given up · counts as failed' : 'Deadline today', SIDE_DIFF[q.diff || 2],
    q.track === 'cp' ? `${q.cps.filter(c => c.done).length}/${q.cps.length} checkpoints` : q.track === 'time' ? `${(sideMin(q) / 60).toFixed(1)}/${(q.goalMin / 60).toFixed(0)} h` : ''].filter(Boolean).join(' · ');
  const time = q && !x.cp && q.track === 'time' && q.status === 'active' && !x.done;
  const ctl = time ? `<button class="btn-s" data-a="sideOpen" data-id="${q.id}">+ Time</button>` : `<button class="chk" data-a="tq" data-id="${esc(x.key)}" aria-label="Check ${esc(x.title)}"${over ? ' disabled' : ''}>${x.done ? ICON.check : ''}</button>`;
  const prog = q && !x.cp && q.track !== 'check' && !x.done ? `<div class="prog"><i style="width:${(sideProg(q) * 100).toFixed(1)}%"></i></div>` : '';
  return `<div class="q due${x.done ? ' done' : ''}${over ? ' locked' : ''}">${ctl}<div class="qb"${q ? ` data-a="sideOpen" data-id="${q.id}" role="button"` : ''}><div class="qt">${esc(x.title)}</div>${sub ? `<div class="qs">${esc(sub)}</div>` : ''}${prog}</div>${q && q.reward && q.reward.kind !== 'none' ? `<span class="rw-ic" title="Has a reward">${ICON.gift}</span>` : ''}<div class="qx">+${x.xp}</div></div>`;
}
function sideRowMini(q) { // compact card on the Quests tab
  const p = sideProg(q), tk = todayKey(), next = q.track === 'cp' ? q.cps.find(c => !c.done) : null, late = next && cpDate(q, next) && cpDate(q, next) < tk;
  const ctl = q.track === 'cp' && next ? `<button class="chk" data-a="cpTog" data-id="${q.id}" data-c="${next.id}" aria-label="Done: ${esc(next.t)}"></button>`
    : q.track === 'time' ? `<button class="btn-s" data-a="sideOpen" data-id="${q.id}">+ Time</button>` : `<button class="chk" data-a="sideDone" data-id="${q.id}" aria-label="Complete ${esc(q.title)}"></button>`;
  const sub = q.track === 'cp' ? (next ? `Next: ${next.t}${cpDate(q, next) ? ' · ' + (late ? 'was due ' : 'by ') + fmtShort(cpDate(q, next)) : ''}` : '') : q.track === 'time' ? `${(sideMin(q) / 60).toFixed(1)} of ${(q.goalMin / 60).toFixed(0)} h` : '';
  return `<div class="q side${late ? ' late' : ''}">${ctl}<div class="qb" data-a="sideOpen" data-id="${q.id}" role="button"><div class="qt">${esc(q.title)}</div><div class="qs">${esc([sub, sideLeft(q)].filter(Boolean).join(' · '))}</div>${q.track !== 'check' ? `<div class="prog"><i style="width:${(p * 100).toFixed(1)}%"></i></div>` : ''}</div>${q.reward && q.reward.kind !== 'none' ? `<span class="rw-ic" title="Has a reward">${ICON.gift}</span>` : ''}<div class="qx">+${sideXp(q)}</div></div>`;
}
function sideSection() {
  const tk = todayKey(), due = new Set(((S.days[tk] || {}).q || []).filter(x => x.side).map(x => x.side));
  const act = (S.side || []).filter(q => q.status === 'active' && q.start <= tk && !due.has(q.id));
  if (!act.length) return '';
  return `<div class="qlist"><div class="qhead"><h2>Side quests</h2><span class="mu2 small">${act.some(q => sideCounts(q) && sideHasDue(q)) ? 'count only on their due days' : 'don’t count toward today'}</span></div>${act.sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1).map(sideRowMini).join('')}</div>`;
}
function sideCard(q) { // full card on the Board
  const tk = todayKey(), open = ui.sideOpen === q.id, p = sideProg(q), act = q.status === 'active';
  let body = '';
  if (open) {
    if (q.note) body += `<p class="mu small">${esc(q.note)}</p>`;
    if (q.track === 'cp') body += `<div class="cps">${q.cps.map(c => { const dd = cpDate(q, c), late = !c.done && dd && dd < tk; return `<div class="cp${c.done ? ' done' : ''}${late ? ' late' : ''}"><button class="chk" ${act ? `data-a="cpTog" data-id="${q.id}" data-c="${c.id}"` : 'disabled'} aria-label="${esc(c.t)}">${c.done ? ICON.check : ''}</button><div class="sp"><div>${esc(c.t)}</div>${dd || c.done ? `<div class="mu2 small">${c.done ? 'Done ' + fmtShort(c.done) : `Day ${c.day} · ${fmtShort(dd)}${late ? ' · late' : ''}`}</div>` : ''}</div></div>`; }).join('')}</div>`;
    if (q.track === 'time') body += `<div class="mu small" style="margin-top:6px">${(sideMin(q) / 60).toFixed(1)} of ${(q.goalMin / 60).toFixed(0)} hours logged</div>${act ? `<div class="row" style="margin-top:8px"><input id="sl_${q.id}" type="number" inputmode="numeric" placeholder="Minutes" style="flex:1"><button class="btn-s btn-p" data-a="sideLog" data-id="${q.id}">Log time</button></div>` : ''}`;
    if (q.reward && q.reward.kind !== 'none') body += `<div class="rw-line">${ICON.gift}<span>${esc(q.reward.kind === 'pass' ? passName(q.reward) : q.reward.text)}</span></div>`;
    body += `<div class="row wrap" style="margin-top:12px;gap:8px">${act && q.track === 'check' ? `<button class="btn-s btn-p" data-a="sideDone" data-id="${q.id}">Complete</button>` : ''}${act ? `<button class="btn-s" data-a="sideEdit" data-id="${q.id}">Edit</button><span class="sp"></span><button class="btn-g small" data-a="sideGive" data-id="${q.id}">Give up</button>` : `<span class="sp"></span><button class="btn-g bad small" data-a="sideDel" data-id="${q.id}">Delete</button>`}</div>`;
  }
  return `<div class="card side-card ${q.status}"><div class="row" data-a="sideOpen" data-id="${q.id}" role="button"><div class="sp"><div>${esc(q.title)} <span class="pill">${SIDE_DIFF[q.diff || 2]}</span>${act && sideCounts(q) && sideHasDue(q) ? ' <span class="pill gold">Counts</span>' : ''}${q.failed ? ' <span class="pill bad">Failed</span>' : ''}</div><div class="mu small">${esc(sideLeft(q))}${q.track === 'cp' ? ` · ${q.cps.filter(c => c.done).length}/${q.cps.length} checkpoints` : q.track === 'time' ? ` · ${(sideMin(q) / 60).toFixed(1)}/${(q.goalMin / 60).toFixed(0)} h` : ''}</div>
    ${q.track !== 'check' ? `<div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>` : ''}</div>${q.reward && q.reward.kind !== 'none' ? `<span class="rw-ic">${ICON.gift}</span>` : ''}<span class="chev ${open ? 'open' : ''}">${ICON.chev}</span></div>${body}</div>`;
}
function boardSide(type) {
  const all = (S.side || []).filter(q => q.type === type), act = all.filter(q => q.status === 'active'), past = all.filter(q => q.status !== 'active').sort((a, b) => (b.doneOn || b.due || '') < (a.doneOn || a.due || '') ? -1 : 1);
  const have = new Set(all.filter(q => q.status === 'active').map(q => q.title)), ideas = SIDE_TEMPLATES[type].filter(t => !have.has(t.title));
  const intro = type === 'once' ? 'Things to do once, like going camping with friends. Set an optional deadline and a reward.' : 'Projects with their own clock: days, weeks, months, years, or until they’re done. Track them with checkpoints or time logged.';
  return `<div class="row" style="margin-top:14px"><p class="mu small sp" style="margin:0">${intro} With a deadline they count toward your day on their due dates (switch that off per quest).</p><button class="btn-p btn-s" data-a="sideNew" data-id="${type}">+ New</button></div>
  <h2>Active</h2>${act.length ? act.map(sideCard).join('') : `<div class="card mu small">No ${type === 'once' ? 'one-time' : 'time-limited'} quests yet. Start one, or adopt an idea below.</div>`}
  ${ideas.length ? `<h2>Ideas</h2><div class="card">${ideas.map((t, i) => `<div class="list-item"><div class="sp"><div>${esc(t.title)}</div><div class="mu small">${esc([SIDE_DIFF[t.diff], type === 'timed' ? (t.dur ? durTxt(t.dur[0], t.dur[1]) : 'until done') : '', t.track === 'cp' ? t.cps.length + ' checkpoints' : t.track === 'time' ? t.goalH + ' h' : '', t.reward ? 'reward' : ''].filter(Boolean).join(' · '))}</div></div><button class="chip" data-a="sideIdea" data-id="${type}" data-k="${SIDE_TEMPLATES[type].indexOf(t)}">Adopt</button></div>`).join('')}</div>` : ''}
  ${past.length ? `<h2>History</h2>${past.slice(0, 20).map(sideCard).join('')}` : ''}`;
}
/* side quest editor */
function sideModal(q, type, tpl) {
  const tk = todayKey();
  if (q) ui.sd = JSON.parse(JSON.stringify(q));
  else {
    const t = tpl || {}, dur = t.dur === null ? [1, 'done'] : t.dur || [2, 'w'];
    ui.sd = { id: null, type, title: t.title || '', note: '', diff: t.diff || 2, start: tk, due: null, durN: dur[0], durU: dur[1], track: type === 'once' ? 'check' : t.track || 'cp',
      cps: (t.cps || []).map(x => ({ id: uid(), t: x, day: null, done: null })), goalMin: (t.goalH || 10) * 60, log: [], reward: t.reward ? Object.assign({ days: 1, all: true, lists: [], skills: [], tasks: [] }, t.reward) : { kind: 'none', days: 1, all: true, lists: [], skills: [], tasks: [] }, status: 'active' };
    if (type === 'timed' && !ui.sd.cps.length && ui.sd.track === 'cp') ui.sd.cps = [{ id: uid(), t: '', day: null, done: null }];
  }
  ui.sd.reward = Object.assign({ kind: 'none', text: '', days: 1, all: true, lists: [], skills: [], tasks: [] }, ui.sd.reward || {});
  openModal(`<h3>${q ? 'Edit quest' : type === 'once' ? 'New one-time quest' : 'New time-limited quest'}</h3><div id="sdBody">${sdBody()}</div>
    <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="sdSave">${q ? 'Save' : 'Start quest'}</button></div>`);
}
function scopeChips(sel, grp) { // reusable "what does this pause cover" picker (vacation + rest passes)
  const act = SKL.filter(s => isLib(s) && (S.skills[s.id] || {}).active), tks = activeTasks();
  const chip = (g, k, n) => `<button class="chip ${(sel[g] || []).includes(k) ? 'on' : ''}" data-a="${grp}" data-g="${g}" data-k="${esc(k)}">${esc(n)}</button>`;
  return `<label>Lists</label><div class="chips">${[...S.lists, 'Nutrition', 'Wind Down'].filter((l, i, a) => a.indexOf(l) === i).map(l => chip('lists', l, l)).join('')}</div>
    ${act.length ? `<label>Skills</label><div class="chips">${act.map(s => chip('skills', s.id, s.name)).join('')}</div>` : ''}
    ${tks.length ? `<label>Tasks</label><div class="chips">${tks.map(t => chip('tasks', t.id, t.name)).join('')}</div>` : ''}`;
}
function sdBody() {
  const d = ui.sd, rw = d.reward, tk = todayKey(), started = d.id && d.start <= tk;
  let h = `<label>Quest</label><input data-i="sd" data-k="title" value="${esc(d.title)}" placeholder="${d.type === 'once' ? 'e.g. Go camping with friends' : 'e.g. Finish my game demo'}" maxlength="80">
    <label>Notes (optional)</label><input data-i="sd" data-k="note" value="${esc(d.note || '')}" maxlength="140">
    <label>Difficulty · ${sideXp(d)} XP when done</label><div class="seg tight">${[1, 2, 3, 4].map(v => `<button class="${d.diff === v ? 'on' : ''}" data-a="sdSet" data-k="diff" data-id="${v}">${SIDE_DIFF[v]}</button>`).join('')}</div>`;
  if (d.type === 'once') h += `<label>Deadline (optional)</label><input type="date" min="${tk}" data-c="sd" data-k="due" value="${d.due || ''}"><div class="mu2 small">${sideCounts(d) ? 'On the deadline it joins that day’s quests. Not done by the end of that day = failed, with penalties.' : 'Past the deadline it quietly expires. No penalty.'}</div>`;
  else {
    h += `<div class="grid2"><div><label>Starts</label><input type="date" ${started ? 'disabled' : `min="${tk}"`} data-c="sd" data-k="start" value="${d.start}"></div><div><label>Time limit</label><div class="row" style="gap:6px">${d.durU === 'done' ? '' : `<input type="number" inputmode="numeric" min="1" data-i="sd" data-k="durN" value="${d.durN || 1}" style="width:64px;flex:none">`}<select data-c="sd" data-k="durU">${[['d', 'Days'], ['w', 'Weeks'], ['m', 'Months'], ['y', 'Years'], ['done', 'Until done']].map(([v, n]) => `<option value="${v}" ${d.durU === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div></div>
      <div class="mu2 small" id="sdEnd">${sdEndTxt()}</div>
      <label>Track progress by</label><div class="seg tight"><button class="${d.track === 'cp' ? 'on' : ''}" data-a="sdSet" data-k="track" data-id="cp">Checkpoints</button><button class="${d.track === 'time' ? 'on' : ''}" data-a="sdSet" data-k="track" data-id="time">Time logged</button></div>`;
    if (d.track === 'cp') h += `<div class="mu2 small">Optional: the quest day each checkpoint should be done by (day 1 = the start).</div><div class="cp-ed">${d.cps.map((c, i) => `<div class="row"><input data-i="sdCp" data-id="${i}" data-k="t" value="${esc(c.t)}" placeholder="Checkpoint ${i + 1}" ${c.done ? 'disabled' : ''}><input type="number" inputmode="numeric" min="1" data-i="sdCp" data-id="${i}" data-k="day" value="${c.day || ''}" placeholder="Day" style="width:70px;flex:none" ${c.done ? 'disabled' : ''}>${c.done ? '<span class="gold small">done</span>' : `<button class="btn-g x" data-a="sdCpDel" data-id="${i}" aria-label="Remove">✕</button>`}</div>`).join('')}</div><button class="btn-s" data-a="sdCpAdd" style="margin-top:8px">+ Checkpoint</button>`;
    else h += `<label>Goal (hours)</label><input type="number" inputmode="decimal" step="any" min="0.5" data-i="sd" data-k="goalH" value="${(d.goalMin || 600) / 60}"><div class="mu2 small">Log time on the quest card. At most 24 h counts per day.</div>`;
  }
  const on = sideCounts(d), cpDays = d.type === 'timed' && d.track === 'cp';
  h += `<label class="check" style="margin-top:14px"><input type="checkbox" data-c="sdReq" ${on ? 'checked' : ''}> Counts toward my day</label>
    <div class="mu2 small">${on ? `Its deadline${cpDays ? ' and every checkpoint with a day' : ''} join${cpDays ? '' : 's'} that day’s quests. Missing one means the day isn’t complete: penalties and a broken streak. Giving up counts as failing.` : 'Never counts toward your day and never gives a penalty.'}${on && d.type === 'timed' && d.durU === 'done' && !cpDays ? ' (An “until done” quest has no deadline, so there’s nothing to count.)' : ''}</div>`;
  // v16: a rest pass is no longer a quest reward (passes come only from coins, i.e. perfect days); an old quest that has one keeps it
  h += `<hr><label>Reward for finishing</label><div class="seg tight">${[['none', 'None'], ['custom', 'Treat'], ...(rw.kind === 'pass' ? [['pass', 'Rest pass']] : [])].map(([v, n]) => `<button class="${rw.kind === v ? 'on' : ''}" data-a="sdRw" data-id="${v}">${n}</button>`).join('')}</div>
    <div class="mu2 small">Rest passes come only from the coin shop, and coins only from perfect days.</div>`;
  if (rw.kind === 'custom') h += `<input data-i="sdRwT" value="${esc(rw.text || '')}" placeholder="e.g. A meal from Portillo's" maxlength="80"><div class="mu2 small">Anything you'd like to give yourself.</div>`;
  if (rw.kind === 'pass') h += `<div class="mu2 small">A pass you can use any time: those days don't need logging and can't give penalties.</div>
    <div class="grid2"><div><label>Days</label><input type="number" inputmode="numeric" min="1" max="14" data-i="sdRwD" value="${rw.days || 1}"></div><div></div></div>
    <label class="check"><input type="checkbox" data-c="sdRwAll" ${rw.all ? 'checked' : ''}> Covers everything</label>
    <div id="sdScope" ${rw.all ? 'hidden' : ''}>${scopeChips(rw, 'sdScope')}</div>`;
  return h;
}
function sdEndTxt() {
  const d = ui.sd; if (d.type !== 'timed') return '';
  if (d.durU === 'done') return 'No deadline: it runs until you finish it.';
  const n = Math.round(num(d.durN) || 0); if (n < 1) return '<span class="bad">Set how long.</span>';
  return `Ends ${fmtDate(addDur(d.start, n, d.durU))}. ${sideCounts(d) ? 'That day it counts toward your quests: not finished by its end = failed, with penalties.' : 'It expires on its own after that, with no penalty.'}`;
}
function saveSide() {
  const d = ui.sd, tk = todayKey(), bad = m => { toast(m, 'bad'); return false; };
  d.title = (d.title || '').trim(); if (!d.title) return bad('Name the quest');
  if (d.type === 'timed') {
    if (d.durU !== 'done') { const n = Math.round(num(d.durN) || 0); if (n < 1 || n > 999) return bad('Set a time limit'); d.durN = n; d.due = addDur(d.start, n, d.durU); } else d.due = null;
    if (d.track === 'cp') { d.cps = d.cps.filter(c => (c.t || '').trim()).map(c => Object.assign(c, { t: c.t.trim(), day: c.day ? Math.max(1, Math.round(c.day)) : null })); if (!d.cps.length) return bad('Add at least one checkpoint'); }
    else { if (!(d.goalMin >= 30)) return bad('Set a goal of at least half an hour'); }
  }
  if (d.due && d.due < tk) return bad('That deadline is in the past');
  const rw = d.reward;
  if (rw.kind === 'custom' && !(rw.text || '').trim()) return bad('Describe your treat');
  if (rw.kind === 'pass') { rw.days = clamp(Math.round(rw.days || 1), 1, 14); if (!rw.all && !rw.lists.length && !rw.skills.length && !rw.tasks.length) return bad('Pick what the pass covers'); }
  if (d.id) { const i = S.side.findIndex(x => x.id === d.id); if (i >= 0) S.side[i] = d; }
  else { d.id = uid(); d.created = tk; S.side.push(d); }
  closeModal(true); ui.boardSeg = d.type; ui.sideOpen = d.id;
  const q = S.side.find(x => x.id === d.id); afterChange(); toast(d.created === tk && !q.xpGot ? 'Quest started' : 'Quest saved', 'ti');
  if (q.track === 'cp' && q.cps.length && q.cps.every(c => c.done)) completeSide(q);
  else if (q.track === 'time' && sideMin(q) >= q.goalMin) completeSide(q);
}
/* rewards */
function boardRewards() {
  const rs = S.rewards || [], ready = rs.filter(r => !r.used), used = rs.filter(r => r.used).sort((a, b) => a.used < b.used ? 1 : -1);
  const row = r => `<div class="list-item rw-item"><span class="rw-ic">${ICON.gift}</span><div class="sp"><div>${esc(rewardName(r))}</div><div class="mu small">From “${esc(r.from)}” · ${r.used ? (r.kind === 'pass' ? 'used from ' : 'enjoyed ') + fmtDate(r.used) : 'earned ' + fmtDate(r.earned)}</div></div>
    ${r.used ? '' : r.kind === 'pass' ? `<button class="btn-s btn-p" data-a="rwUse" data-id="${r.id}">Use pass</button>` : `<button class="btn-s btn-p" data-a="rwDone" data-id="${r.id}">Enjoyed it</button>`}</div>`;
  return `${shopCard()}<p class="mu small" style="margin-top:14px">Treats come from finishing one-time and time-limited quests: whatever you promised yourself. Rest passes come only from the coin shop (coins come from perfect days): real days off with nothing to log and no penalty.</p>
  <h2>Ready · ${ready.length}</h2><div class="card">${ready.length ? ready.map(row).join('') : '<div class="mu small">Nothing yet. Add a reward to a quest and finish it.</div>'}</div>
  ${used.length ? `<h2>Used</h2><div class="card">${used.slice(0, 30).map(row).join('')}</div>` : ''}`;
}
function passModal(r) {
  const tk = todayKey(); ui.pass = r.id;
  openModal(`<h3>Use rest pass</h3><p class="mu small">${esc(passName(r.pass))}. Those days are paused: nothing to log, your streak is frozen, and no penalties.${r.pass.all ? ' Any pending penalty exercises wait until you’re back.' : ''}</p>
    <label>First day</label><input id="psStart" type="date" min="${tk}" value="${tk}" data-c="psCalc">
    <div class="dg-aim" id="psEnd">${psEndTxt(tk, r)}</div>
    <div class="actions"><button data-a="close">Not now</button><button class="btn-p" data-a="psGo" data-id="${r.id}">Use it</button></div>`);
}
const psEndTxt = (start, r) => `Paused ${r.pass.days === 1 ? '' : 'through '}<b>${fmtDate(addDays(start, r.pass.days - 1))}</b> · back on ${fmtDate(addDays(start, r.pass.days))}`;
function usePass(r, start) {
  const tk = todayKey(); if (!start || start < tk) { toast("A pass can't start in the past", 'bad'); return; }
  const p = r.pass, end = addDays(start, p.days - 1), pz = { id: uid(), type: 'pass', start, end, all: p.all, lists: p.all ? [] : p.lists.slice(), skills: p.all ? [] : p.skills.slice(), tasks: p.all ? [] : p.tasks.slice(), note: r.from, reward: r.id };
  if (start === tk && p.all) { const d = ensureDay(tk); if (d.q.some(q => q.pen && !q.done)) { S.pendingPen = { tier: Math.max(d.penTier || (d.q.some(q => q.pen && !q.done && /^pen:/.test(q.key)) ? 1 : 0), (S.pendingPen || {}).tier || 0), fixed: [...new Set([...(d.penFixed || []), ...((S.pendingPen || {}).fixed || [])])] }; delete d.penTier; delete d.penFixed; } }
  S.pauses.push(pz); r.used = start; r.pauseId = pz.id;
  closeModal(true); if (start === tk) regenToday(); afterChange(); toast(start === tk ? 'Rest pass active · enjoy it' : 'Rest pass scheduled for ' + fmtDate(start), 'ti');
}
/* ---------- coins & the shop (v11) ----------
   S.coins: +1 for every perfect day (given when the day is evaluated). The shop sells, for 10 coins each:
   a Streak Saver (S.savers; brings back a streak a missed day just ended) and a Rest Day Pass (a 1-day, everything
   pass in S.rewards, used exactly like one earned from a quest). S.streakBreak = { n, day, last, miss, days[], asked }
   is the streak the latest miss ended; it can be restored until the end of the day after the last missed day. */
const SHOP_COST = 30; // v16 (was 10): perfect days pay more as the streak grows
/* v16: coins per perfect day by streak: 1, then 2 from day 10, 3 from 100, 4 from 1,000, 5 from 10,000, and 1,000,000 from 100,000 */
const COIN_TIERS = [[100000, 1000000], [10000, 5], [1000, 4], [100, 3], [10, 2], [0, 1]];
const coinRate = n => COIN_TIERS.find(([at]) => n >= at)[1];
const LEGEND_MSG = "There's no way you're still alive, can't believe you passed me down multiple generations. Descendent of the legendary one, use these coins wisely.";
function coinTierNote() { // the first time a streak reaches a new tier: say so (once per tier)
  const r = coinRate(S.streak.cur); if (r <= (S.coinTier || 1)) return; S.coinTier = r;
  ui.coinNote = r === 1000000 ? 'legend' : r;
}
function showCoinNote() {
  const r = ui.coinNote; if (!r || !$('#modal').hidden) return; ui.coinNote = null;
  if (r === 'legend') openModal(`<h3 class="gold">${ICON.coin} 1,000,000 coins a day</h3><p>${esc(LEGEND_MSG)}</p><p class="mu small">A ${S.streak.cur.toLocaleString()}-day streak.</p><div class="actions"><button class="btn-p" data-a="close">Use them wisely</button></div>`);
  else toast(`${S.streak.cur.toLocaleString()}-day streak · perfect days now pay ${r} coins`, 'ti');
}
const SHOP = [
  ['saver', 'Streak Saver', 'Brings back a streak you just lost. One saver covers one missed day. The penalty for that day still happens.'],
  ['pass', 'Rest Day Pass', 'One complete rest day you can use any time: nothing to log, no penalties, streak frozen.']];
function shopCard() {
  const c = S.coins || 0, sb = sbValid() ? S.streakBreak : null;
  const row = ([id, n, d]) => `<div class="list-item shop-item"><span class="rw-ic">${id === 'saver' ? ICON.saver : ICON.gift}</span><div class="sp"><div>${n}${id === 'saver' && S.savers ? ` <span class="pill gold">${S.savers} owned</span>` : ''}</div><div class="mu small">${d}</div></div>
    <button class="btn-s btn-p buy" data-a="buy" data-id="${id}" ${c < SHOP_COST ? 'disabled' : ''}>${ICON.coin}<span class="num">${SHOP_COST}</span></button></div>`;
  return `<div class="card shop" style="margin-top:14px"><div class="row"><span class="coin-big">${ICON.coin}</span><div class="sp"><h3><span class="num">${c}</span> coin${c === 1 ? '' : 's'}</h3><div class="mu small">You earn ${coinRate(S.streak.cur).toLocaleString()} coin${coinRate(S.streak.cur) === 1 ? '' : 's'} for each perfect day (every quest done). More as your streak grows: 2 from a 10-day streak, 3 from 100, 4 from 1,000, 5 from 10,000.</div></div></div>
    ${sb ? `<div class="banner sv" style="margin-top:10px"><div class="row">${ICON.saver}<b class="sp">Your ${sb.n}-day streak can still be saved</b></div><div class="row" style="margin-top:8px;gap:8px"><button class="btn-s btn-p" data-a="svRestore">Bring it back</button></div></div>` : ''}
    ${SHOP.map(row).join('')}</div>`;
}
function buyItem(id) {
  const it = SHOP.find(x => x[0] === id); if (!it) return;
  if ((S.coins || 0) < SHOP_COST) { toast(`You need ${SHOP_COST} coins · you have ${S.coins || 0}`, 'bad'); return; }
  if (!confirm(`Spend ${SHOP_COST} coins on a ${it[1]}?`)) return;
  S.coins -= SHOP_COST;
  if (id === 'saver') S.savers = (S.savers || 0) + 1;
  else S.rewards.push({ id: uid(), qid: null, from: 'Coin shop', kind: 'pass', text: '', earned: todayKey(), used: null, bought: true, pass: { days: 1, all: true, lists: [], skills: [], tasks: [] } });
  afterChange(); fx('check'); toast(id === 'saver' ? `Streak Saver bought · you have ${S.savers}` : 'Rest Day Pass bought · use it from Ready below', 'ti');
}
const sbValid = () => { const b = S.streakBreak; return !!(b && b.n > 0 && todayKey() <= addDays(b.last, 1)); };
function streakNag(k) {
  if (!sbValid()) return ''; const b = S.streakBreak, need = b.miss, can = (S.savers || 0) + Math.floor((S.coins || 0) / SHOP_COST) >= need;
  return `<div class="banner sv"><div class="row">${ICON.saver}<b class="sp">Your ${b.n}-day streak ended</b></div>
    <div class="small" style="margin-top:4px">${b.miss === 1 ? 'You missed ' + fmtDate(b.day) : `You missed ${b.miss} days`}. ${can ? `A Streak Saver brings it back${need > 1 ? ` (${need} needed, one per day)` : ''}. You have ${S.savers || 0} and ${S.coins || 0} coins. Only today.` : `It takes ${need} Streak Saver${need > 1 ? 's' : ''} (${SHOP_COST} coins each). You have ${S.savers || 0} and ${S.coins || 0} coins.`}</div>
    <div class="row" style="margin-top:10px;gap:8px">${can ? `<button class="btn-s btn-p" data-a="svRestore">Bring it back</button>` : ''}<button class="btn-s" data-a="svDrop">Let it go</button></div></div>`;
}
function streakModal() {
  const b = S.streakBreak, need = b.miss, have = S.savers || 0, buy = Math.max(0, need - have), can = buy * SHOP_COST <= (S.coins || 0);
  openModal(`<div class="sv-head">${ICON.saver}</div><h3 style="text-align:center">Your ${b.n}-day streak ended</h3>
    <p class="mu small" style="text-align:center">${b.miss === 1 ? 'You missed ' + fmtDate(b.day) : `You missed ${b.miss} days in a row`}. ${need === 1 ? 'A Streak Saver' : need + ' Streak Savers'} can bring it back. That day’s penalty still happens.</p>
    <p class="small" style="text-align:center">You have <b>${have}</b> Streak Saver${have === 1 ? '' : 's'} · <b>${S.coins || 0}</b> coins</p>
    <div class="bk-btns">${can ? `<button class="btn-p" data-a="svRestore">${buy ? `Buy ${buy === 1 ? 'one' : buy} for ${buy * SHOP_COST} coins and bring it back` : `Use ${need === 1 ? 'a Streak Saver' : need + ' Streak Savers'}`}</button>` : `<div class="mu2 small" style="text-align:center">Not enough coins: it takes ${buy * SHOP_COST}, you have ${S.coins || 0}. Coins come from perfect days.</div>`}
    <button data-a="svDrop">Let it go</button><button class="btn-g" data-a="close">Decide later today</button></div>`);
}
function streakOffer() { // once per break, after the locked donation sheet (if any)
  if (!sbValid() || S.streakBreak.asked || S.owed.length || !$('#modal').hidden) return;
  S.streakBreak.asked = true; save(); streakModal();
}
function restoreStreak() {
  if (!sbValid()) { toast('That streak can’t be saved any more', 'bad'); return; }
  const b = S.streakBreak, need = b.miss, buy = Math.max(0, need - (S.savers || 0));
  if (buy * SHOP_COST > (S.coins || 0)) { toast(`You need ${buy * SHOP_COST} coins for that`, 'bad'); return; }
  S.coins -= buy * SHOP_COST; S.savers = (S.savers || 0) + buy - need;
  (b.days || [b.day]).forEach(k => { if (S.days[k]) S.days[k].saved = true; });
  S.streak.cur += b.n; S.streak.best = Math.max(S.streak.best, S.streak.cur); S.streakBreak = null;
  closeModal(true); afterChange(); fx('day');
  celebrate('Streak saved', `Your streak is back: ${S.streak.cur} day${S.streak.cur === 1 ? '' : 's'} and counting.`, { big: String(S.streak.cur) });
}

/* ---------- views: quest board (create / edit quests) ---------- */
function viewBoard() {
  const segs = [['skills', 'Skills'], ['tasks', 'Tasks'], ['once', 'One-time'], ['timed', 'Timed'], ['rewards', 'Rewards']];
  const nr = (S.rewards || []).filter(r => !r.used).length;
  return `<div class="seg board-seg">${segs.map(([id, n]) => `<button class="${ui.boardSeg === id ? 'on' : ''}" data-a="boardSeg" data-id="${id}">${n}${id === 'rewards' && nr ? ` <b class="dot-n">${nr}</b>` : ''}</button>`).join('')}</div>`
    + ({ skills: meSkills, tasks: boardTasks, once: () => boardSide('once'), timed: () => boardSide('timed'), rewards: boardRewards })[ui.boardSeg]();
}
const wdTxt = days => { const d = (days || []).slice().sort(); return d.length === 7 ? 'every day' : d.join() === '1,2,3,4,5' ? 'weekdays' : d.join() === '0,6' ? 'weekends' : d.map(i => WD[i]).join(' '); };
const taskDesc = t => [t.unit === 'min' ? `${fmtTarget(t.id && S.tasks[t.id] === t ? taskTarget(t) : t.base, 'min')}` : '', (t.sessions || 1) > 1 ? `${t.sessions}× a day` : '', wdTxt(t.days)].filter(Boolean).join(' · ');
function taskCard(t) {
  const L = taskLevel(t), open = ui.openTask === t.id, th = taskThresholds(t), names = taskAchNames(t), done = t.done || 0;
  const nx = th.findIndex(n => done < n), nextTxt = nx < 0 ? `${names[5]} ${roman(Math.floor((done - th[5]) / th[6]) + 2)}` : names[nx];
  let body = '';
  if (open) {
    body = `<div class="mu small" style="margin-top:8px">${esc(taskDesc(t))} · ${esc(t.list)} · ${['', 'Easy', 'Medium', 'Hard'][t.diff || 1]} · ${taskXpPer(t)} XP a session</div>
      <div class="mu2 small">${t.done || 0} completions · ${t.logs || 0} sessions${t.unit === 'min' ? ` · grows 5% a level, up to ${t.max} min` : ''}</div>
      ${t.id === 'pray' ? '' : `<div class="ach">${th.slice(0, 6).map((n, i) => `<div class="a ${done >= n ? 'got' : ''}"><span>${done >= n ? '★' : '☆'}</span><div class="sp">${esc(names[i])}</div><span class="mu2 small num">${n.toLocaleString()}</span></div>`).join('')}</div>`}
      <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn-s" data-a="tkEdit" data-id="${t.id}">Edit</button><span class="sp"></span>${t.active ? `<button class="btn-s" data-a="tkToggle" data-id="${t.id}">Remove from quests</button>` : `<button class="btn-s btn-p" data-a="tkToggle" data-id="${t.id}">Add back</button>`}</div>`;
  }
  return `<div class="card skill-card task-card"><div class="row" data-a="tkOpen" data-id="${t.id}" role="button"><div class="sp"><div>${esc(taskTitle(t))} <span class="mu small num">Lv ${L.L}</span>${t.custom ? ' <span class="pill">Custom</span>' : ''}</div>
    <div class="mu small">${esc(taskDesc(t))}</div><div class="bar" style="max-width:220px"><i style="width:${(L.into / L.need * 100).toFixed(1)}%"></i></div>
    ${t.id === 'pray' ? '' : `<div class="gold small" style="margin-top:4px">Next: ${esc(nextTxt)} · <span class="num">${done}/${nx < 0 ? th[5] + (Math.floor((done - th[5]) / th[6]) + 1) * th[6] : th[nx]}</span></div>`}</div><span class="chev ${open ? 'open' : ''}">${ICON.chev}</span></div>${body}</div>`;
}
function boardTasks() {
  const all = Object.values(S.tasks || {}).filter(t => !hiddenTk(t.id)), act = all.filter(t => t.active), off = all.filter(t => !t.active), lib = TASKS.filter(d => !S.tasks[d.id] && !hiddenTk(d.id));
  return `<div class="row" style="margin-top:14px"><p class="mu small sp" style="margin:0">Everyday basics: no hexagon, just an XP bar and achievements. Several sessions a day are fine (brush teeth 2×).</p><button class="btn-p btn-s" data-a="tkNew">+ New task</button></div>
  <h2>Active</h2>${act.length ? act.map(taskCard).join('') : '<div class="card mu small">No task quests yet. Adopt some below.</div>'}
  ${off.length ? `<h2>Paused</h2>${off.map(taskCard).join('')}` : ''}
  ${lib.length ? `<h2>Library</h2><div class="card">${lib.map(d => `<div class="list-item"><div class="sp"><div>${esc(d.name)}</div><div class="mu small">${esc(taskDesc(d))} · ${esc(d.list)}</div></div><button class="chip" data-a="tkAdopt" data-id="${d.id}">Adopt</button><button class="btn-g x lib-del" data-a="tkHide" data-id="${d.id}" aria-label="Delete ${esc(d.name)}">${ICON.trash}</button></div>`).join('')}</div>` : ''}`;
}
function taskModal(t, def) { // t = existing task, def = a library task being adopted, neither = brand new custom task
  const src = t || def || { name: '', unit: 'times', sessions: 1, base: 10, max: 30, diff: 1, list: 'Daily', days: [0, 1, 2, 3, 4, 5, 6] };
  const isNew = !t, isMin = src.unit === 'min';
  openModal(`<h3>${t ? 'Edit task' : def ? 'Adopt: ' + esc(def.name) : 'New task'}</h3><p class="mu small">A repeatable everyday quest with an XP bar and achievements${t && !t.custom ? '' : ' that scale with how often it runs'}.</p>
  <form id="tkForm" onsubmit="return false">
    <label>Name</label><input name="name" value="${esc(src.name)}" placeholder="e.g. Feed the cat" maxlength="40">
    <div class="grid2"><div><label>Measured in</label><select name="unit" data-c="tkUnit"><option value="times" ${!isMin ? 'selected' : ''}>Check-offs</option><option value="min" ${isMin ? 'selected' : ''}>Minutes</option></select></div>
    <div><label>Times per day</label><input name="sessions" type="number" inputmode="numeric" min="1" max="12" value="${src.sessions || 1}"></div></div>
    <div id="tkMin" ${isMin ? '' : 'hidden'}>${isNew ? `<label>Your experience with it</label><select name="exp" data-c="tkExp">${[['new', 'New to this'], ['some', 'Some'], ['habit', 'Already a habit']].map(([v, n]) => `<option value="${v}" ${v === 'some' ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}
      <div class="grid2"><div><label>Minutes ${isNew ? 'to start' : 'per session'}</label><input name="base" type="number" inputmode="numeric" min="1" value="${t ? taskTarget(t) : src.base || 10}" data-b="${src.base || 10}"></div><div><label>Grows up to (min)</label><input name="max" type="number" inputmode="numeric" min="1" value="${src.max || 30}"></div></div>
      <div class="mu2 small">The session grows about 5% each time the task levels up, so it stays approachable.</div></div>
    <label>Difficulty</label><select name="diff">${[[1, 'Easy · 4 XP a session'], [2, 'Medium · 7 XP'], [3, 'Hard · 12 XP']].map(([v, n]) => `<option value="${v}" ${(src.diff || 1) === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <label>Quest list</label><select name="list">${[...new Set([...S.lists, 'Wind Down', src.list].filter(Boolean))].map(l => `<option ${l === src.list ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
    <label>Days</label><div class="chips days" id="tkDays">${WD.map((w, i) => `<button type="button" class="chip ${(src.days || []).includes(i) ? 'on' : ''}" data-a="chipT" data-k="${i}">${w}</button>`).join('')}</div>
  </form>
  <div class="actions">${t ? `<button class="btn-g bad" data-a="${t.custom ? 'tkDel' : 'tkHide'}" data-id="${t.id}">Delete</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="tkSave" data-id="${t ? t.id : ''}" data-d="${def ? def.id : ''}">${t ? 'Save' : def ? 'Adopt' : 'Create'}</button></div>`);
}
function saveTask(id, defId) {
  const f = new FormData($('#tkForm')), name = (f.get('name') || '').trim(), unit = f.get('unit'), days = chipsOn('#tkDays').map(Number);
  const sessions = clamp(Math.round(num(f.get('sessions')) || 1), 1, 12), base = Math.round(num(f.get('base')) || 0), max = Math.round(num(f.get('max')) || 0), diff = +f.get('diff') || 1;
  if (!name) { toast('Name the task'); return; }
  if (!days.length) { toast('Pick at least one day'); return; }
  if (id && lockedDays('task', id).some(d => !days.includes(d))) { lockRefuse('task', id, 'remove a locked day'); return; }
  if (unit === 'min' && (base < 1 || base > 600)) { toast('Minutes should be 1–600'); return; }
  const cfg = { name, unit, sessions, diff, list: f.get('list'), days, base: unit === 'min' ? base : 0, max: unit === 'min' ? Math.max(base, max || base) : 0 };
  let t = id ? S.tasks[id] : null;
  if (t) { if (unit === 'min') { if (t.unit !== 'min' || !t.base) cfg.base = cfg.base0 = base; else cfg.base = base !== taskTarget(t) ? base / (1 + 0.05 * (taskLevel(t).L - 1)) : t.base; } Object.assign(t, cfg); }
  else if (defId) { t = adoptTask(defId, Object.assign(cfg, { exp: f.get('exp') || 'some', base0: cfg.base })); }
  else { const nid = 'c' + uid().slice(0, 7); t = S.tasks[nid] = Object.assign({ id: nid, custom: true, active: true, xp: 0, done: 0, logs: 0, base0: cfg.base, exp: f.get('exp') || 'some', lock: null }, cfg); }
  if (t.list && !S.lists.includes(t.list) && t.list !== 'Wind Down') S.lists.push(t.list);
  closeModal(true); ui.openTask = t.id; regenToday(); afterChange(); toast(id ? 'Task updated' : 'Task added to your quests', 'ti');
}

/* ---------- views: calendar ---------- */
function viewCal() {
  const tk = todayKey(); ui.calSel = ui.calSel || tk; ui.calMonth = ui.calMonth || tk.slice(0, 7);
  const [y, m] = ui.calMonth.split('-').map(Number), first = new Date(y, m - 1, 1);
  let cells = WD.map(w => `<div class="dh">${w[0]}</div>`).join('');
  const start = dkey(new Date(y, m - 1, 1 - first.getDay()));
  for (let i = 0; i < 42; i++) {
    const k = addDays(start, i), d = dparse(k), out = d.getMonth() !== m - 1;
    if (i >= 35 && out) break;
    const evs = S.events.filter(e => occursOn(e, k)).length, day = S.days[k], pi = pauseInfo(k);
    let dots = ''; for (let j = 0; j < Math.min(evs, 3); j++) dots += '<i></i>';
    if (day && day.ev && !day.frozen) dots += day.pct >= 1 ? '<i class="p"></i>' : '<i class="f"></i>';
    const pc = (pi ? (pi.emergency ? 'pe' : 'pv') : '') + (fastOn(k) ? ' pf' : '');
    cells += `<button class="d ${out ? 'out' : ''} ${k === tk ? 'today' : ''} ${k === ui.calSel ? 'sel' : ''} ${S.rest.includes(k) ? 'rest' : ''} ${pc}" data-a="calSel" data-id="${k}"><span class="num">${d.getDate()}</span><span class="dots">${dots}</span></button>`;
  }
  const sel = ui.calSel, evs = S.events.filter(e => occursOn(e, sel)), day = S.days[sel], spi = pauseInfo(sel);
  const repTxt = e => ({ none: 'Once', daily: 'Daily', weekly: 'Weekly · ' + (e.days && e.days.length ? e.days : [dparse(e.start).getDay()]).map(i => WD[i]).join(' '), monthly: 'Monthly', yearly: 'Yearly' })[e.repeat || 'none'];
  const active = SKL.filter(s => isLib(s) && S.skills[s.id] && S.skills[s.id].active), tks = activeTasks();
  const pauses = S.pauses.filter(p => !p.end || p.end >= tk).sort((a, b) => a.start < b.start ? -1 : 1);
  const sideDue = (S.side || []).filter(q => q.status === 'active' && (q.due === sel || q.cps && q.cps.some(c => !c.done && cpDate(q, c) === sel)));
  return `<div class="row month"><button class="btn-g" data-a="calNav" data-id="-1" aria-label="Previous month">‹</button><h3 class="sp">${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3><button class="btn-g" data-a="calNav" data-id="1" aria-label="Next month">›</button></div>
  <div class="cal">${cells}</div>
  <div class="legend cal-legend"><span><i class="dot" style="background:var(--ac)"></i>event</span><span><i class="dot" style="background:var(--gold)"></i>perfect</span><span><i class="dot" style="background:var(--bad)"></i>missed</span><span><i class="dash" style="background:#5b7fa6"></i>vacation</span><span><i class="dash" style="background:var(--bad)"></i>emergency</span><span><i class="dash" style="background:var(--gold)"></i>fast</span></div>
  <h2>${fmtDate(sel)}</h2>
  <div class="card">
    ${fastOn(sel) ? `<div class="small" style="margin-bottom:8px"><span class="gold">Fast${fastOn(sel).note ? ' · ' + esc(fastOn(sel).note) : ''}</span> · day ${fastDay(fastOn(sel), sel)} of ${fastLen(fastOn(sel))} · diet quest off</div>` : ''}
    ${spi ?`<div class="small" style="margin-bottom:8px">${ICON.pause} <span class="${spi.emergency ? 'bad' : 'acc'}">${spi.emergency ? 'Extreme emergency' : 'Vacation'}</span> · paused: ${esc(spi.all ? 'everything' : [...spi.lists, ...[...spi.skills].map(id => SK[id] ? SK[id].name : id)].join(', '))}</div>` : ''}
    ${evs.length ? evs.map(e => `<div class="list-item"><div class="sp"><div>${esc(e.title)}</div><div class="mu small">${esc(e.list || '')} · ${esc(repTxt(e))}${e.skill && SK[e.skill] ? ' · ' + esc(SK[e.skill].name) : ''}</div></div>${lockCtl('event', e.id)}<button class="btn-s" data-a="evEdit" data-id="${e.id}">Edit</button></div>`).join('') : '<div class="mu small">No events this day.</div>'}
    ${day && day.ev ? `<div class="mu small" style="margin-top:8px">Result: ${day.frozen ? 'paused (streak frozen)' : `<span class="num">${Math.round(day.pct * 100)}%</span>${dayPenTxt(day) ? ` · <span class="bad">${esc(dayPenTxt(day))}</span>` : ''}${day.saved ? ' · <span class="gold">streak saved</span>' : ''}`}</div>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn-p btn-s" data-a="evNew">+ Event</button><span class="sp"></span>
    ${sel >= tk ? `<button class="btn-s" data-a="restToggle" data-id="${sel}">${S.rest.includes(sel) ? 'Unset rest day' : 'Mark rest day'}</button>` : ''}</div>
    ${sideDue.length ? `<div class="mu small" style="margin-top:10px">${sideDue.map(q => `<div class="list-item"><span class="rw-ic">${ICON.board}</span><span class="sp">${esc(q.title)}</span><span class="mu2 small">${q.due === sel ? 'deadline' : 'checkpoint'}</span></div>`).join('')}</div>` : ''}
  </div>
  <h2>Pauses</h2>
  <div class="card">${pauses.length ? pauses.map(p => `<div class="list-item"><div class="sp"><div>${p.type === 'emergency' ? '<span class="bad">Extreme emergency</span>' : p.type === 'pass' ? '<span class="gold">Rest pass</span>' : 'Vacation'}${p.note ? ' · ' + esc(p.note) : ''}</div>
      <div class="mu small">${fmtDate(p.start)} → ${p.end ? fmtDate(p.end) : 'until ended'} · ${esc(scopeTxt(p))}</div></div>
      ${p.start >= tk ? `<button class="btn-s" data-a="pCancel" data-id="${p.id}">Cancel</button>` : ''}${p.start <= tk && p.end !== tk ? `<button class="btn-s" data-a="pEnd" data-id="${p.id}">End</button>` : ''}</div>`).join('') : '<div class="mu small">No upcoming pauses. Plan vacations ahead; paused quests don\'t count against you.</div>'}
    <div class="row" style="margin-top:12px"><button class="btn-s" data-a="vacNew">+ Vacation pause</button></div></div>
  <h2>Weekly plan</h2>
  <div class="card"><p class="mu small" style="margin-top:0">Which days each active skill shows up as a quest. An event linked to a skill replaces its automatic quest that day.</p>
  ${active.length ? active.map(s => { const ld = lockedDays('skill', s.id); return `<div class="list-item col"><div class="row"><span class="sp">${esc(s.name)}</span><span class="mu small num">${esc(fmtTarget(skillTarget(s.id, tk), s.unit))}</span></div>
    <div class="chips days" style="margin-top:8px">${WD.map((w, i) => `<button class="chip ${S.skills[s.id].days.includes(i) ? 'on' : ''}${ld.includes(i) ? ' locked' : ''}" data-a="skDay" data-id="${s.id}" data-d="${i}">${w}</button>`).join('')}</div><div class="row lk-row">${lockCtl('skill', s.id)}</div></div>`; }).join('') : '<div class="mu small">No active skills. Turn some on in Board → Skills.</div>'}
  ${tks.length ? `<div class="tg" style="margin-top:14px">Tasks</div>${tks.map(t => { const ld = lockedDays('task', t.id); return `<div class="list-item col"><div class="row"><span class="sp">${esc(t.name)}</span><span class="mu small">${esc(taskDesc(t))}</span></div>
    <div class="chips days" style="margin-top:8px">${WD.map((w, i) => `<button class="chip ${(t.days || []).includes(i) ? 'on' : ''}${ld.includes(i) ? ' locked' : ''}" data-a="tkDay" data-id="${t.id}" data-d="${i}">${w}</button>`).join('')}</div><div class="row lk-row">${lockCtl('task', t.id)}</div></div>`; }).join('')}` : ''}
  <p class="mu2 small" style="margin-top:10px">${ICON.lock} Lock a schedule to commit to it for a while: its days can't be removed until the lock ends, and those quests earn +${Math.round(LOCK_BONUS * 100)}% XP.</p>
  </div>`;
}
/* v14: tap a date on the calendar → every quest that day: what was done (past), live (today) or planned (ahead) */
function dayPreviewHtml(k) {
  const tk = todayKey(), past = k < tk, today = k === tk, d = S.days[k], pi = pauseInfo(k), fst = fastOn(k);
  const q = d ? d.q : past ? null : generate(k), evs = S.events.filter(e => occursOn(e, k));
  const tag = today ? 'Today' : past ? 'Past' : 'Planned', tom = addDays(tk, 1) === k && S.pendingPen && (S.pendingPen.tier || (S.pendingPen.fixed || []).length);
  const badges = [S.rest.includes(k) ? '<span class="pill">Rest day</span>' : '', isDeload(k) ? '<span class="pill">Deload week · −25%</span>' : '',
    pi ? `<span class="pill ${pi.emergency ? 'bad' : ''}">${pi.emergency ? 'Extreme emergency' : 'Paused'} · ${esc(pi.all ? 'everything' : 'some lists')}</span>` : '',
    fst ? `<span class="pill gold">Fast · day ${fastDay(fst, k)}/${fastLen(fst)}</span>` : '', d && d.penTier ? `<span class="pill bad">Penalty · ${esc(penTierName(d.penTier))}</span>` : ''].filter(Boolean).join(' ');
  const row = x => {
    const n = x.sessions || 1, part = x.task && n > 1 && x.progress > 0 && !x.done;
    const st = x.done ? 'ok' : part ? 'part' : past && d && d.ev ? 'miss' : 'todo';
    const sub = [x.side ? (x.cp ? 'checkpoint' : 'deadline') : '', x.key === 'diet' ? (dietStatus(k).none ? '' : 'aim ' + aimTxt(aimFor(k)) + ' kcal') : x.task ? (x.unit === 'min' ? fmtTarget(x.target, 'min') + (n > 1 ? ' each' : '') : '') : x.target ? (x.progress > 0 && !x.done ? `${fmtTarget(x.progress, x.unit)} of ${fmtTarget(x.target, x.unit)}` : fmtTarget(x.target, x.unit)) : '',
      x.task && n > 1 ? `${x.progress || 0} of ${n}` : ''].filter(Boolean).join(' · ');
    const ic = st === 'ok' ? ICON.check : st === 'miss' ? '✕' : st === 'part' ? `<span class="num">${x.progress}</span>` : '';
    return `<div class="dp-q ${st}${x.pen ? ' pen' : ''}"><i class="dp-st">${ic}</i><div class="sp"><div class="dp-t">${esc(x.title)}</div>${sub ? `<div class="mu2 small">${esc(sub)}</div>` : ''}</div><span class="qx">+${x.xp}</span></div>`;
  };
  let body;
  if (!q) body = `<div class="mu small">${S.profile.start && k < S.profile.start ? 'Before you started.' : 'Nothing was recorded this day.'}</div>`;
  else if (!q.length) body = `<div class="mu small">${pi && pi.all ? 'Everything is paused this day.' : 'No quests this day.'}</div>`;
  else {
    const lists = [...new Set(q.map(x => x.list))].sort((a, b) => listRank(a) - listRank(b)), done = q.filter(x => x.done).length;
    body = `<div class="mu small dp-sum">${past || today ? `<span class="num">${done}/${q.length}</span> done` : `<span class="num">${q.length}</span> quest${q.length === 1 ? '' : 's'}`} · <span class="gold num">${q.reduce((a, x) => a + (x.xp || 0), 0)} XP</span> on offer</div>`
      + lists.map(l => `<div class="tg">${esc(l)}</div>${q.filter(x => x.list === l).map(row).join('')}`).join('');
  }
  const result = d && d.ev ? `<div class="mu small dp-res">Result: ${d.frozen ? 'paused (streak frozen)' : `<span class="num">${Math.round(d.pct * 100)}%</span>${dayPenTxt(d) ? ` · <span class="bad">${esc(dayPenTxt(d))}</span>` : ''}${d.saved ? ' · <span class="gold">streak saved</span>' : ''}`}</div>` : '';
  return `<div class="row"><h3 class="sp">${fmtDate(k)}</h3><span class="pill${today ? ' acc' : ''}">${tag}</span></div>
    ${badges ? `<div class="badges" style="margin:6px 0 2px">${badges}</div>` : ''}${tom ? `<div class="small bad" style="margin-top:6px">A penalty${S.pendingPen.tier ? ` (${esc(penTierName(S.pendingPen.tier))})` : ''} is waiting and gets added to your next day.</div>` : ''}
    <div class="dp-list">${body}</div>${result}
    ${evs.length ? `<div class="tg">Events</div>${evs.map(e => `<div class="list-item"><div class="sp small">${esc(e.title)}</div><button class="btn-s" data-a="evEdit" data-id="${e.id}">Edit</button></div>`).join('')}` : ''}
    ${!past && !today ? '<p class="mu2 small" style="margin-top:8px">Planned from your weekly plan, events and side quests; targets can still grow before then.</p>' : ''}
    <div class="actions"><button data-a="close">Close</button><span class="sp"></span><button class="btn-s" data-a="evNew">+ Event</button>${k >= tk ? `<button class="btn-s" data-a="dpRest" data-id="${k}">${S.rest.includes(k) ? 'Unset rest day' : 'Rest day'}</button>` : ''}</div>`;
}
function dayPreview(k) { ui.calSel = k; openModal(`<div id="dpBody">${dayPreviewHtml(k)}</div>`); }
function eventModal(ev) {
  const e = ev || { id: null, title: '', list: 'Training', skill: '', repeat: 'none', days: [dparse(ui.calSel || todayKey()).getDay()], start: ui.calSel || todayKey(), end: '', target: '', unit: '' };
  const lists = [...new Set([...S.lists, e.list].filter(Boolean))];
  openModal(`<h3>${ev ? 'Edit event' : 'New event'}</h3>
  <form id="evForm" onsubmit="return false">
  <label>Title</label><input name="title" value="${esc(e.title)}" placeholder="e.g. BJJ class">
  <div class="grid2"><div><label>List</label><select name="list">${lists.map(l => `<option ${l === e.list ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
  <div><label>Linked skill</label><select name="skill"><option value="">None</option>${skillOptions(e.skill)}</select></div></div>
  <div class="grid2"><div><label>Fixed target (optional)</label><input name="target" type="number" step="any" value="${esc(e.target || '')}" placeholder="adaptive"></div>
  <div><label>Unit (no skill)</label><input name="unit" value="${esc(e.unit || '')}" placeholder="min, reps…"></div></div>
  <label>Repeats</label><select name="repeat" data-c="evRepeat">${[['none', 'Does not repeat'], ['daily', 'Every day'], ['weekly', 'Weekly on…'], ['monthly', 'Every month'], ['yearly', 'Every year']].map(([v, n]) => `<option value="${v}" ${v === e.repeat ? 'selected' : ''}>${n}</option>`).join('')}</select>
  <div id="evDays" class="chips days" style="margin-top:8px;${e.repeat === 'weekly' ? '' : 'display:none'}">${WD.map((w, i) => `<button type="button" class="chip ${(e.days || []).includes(i) ? 'on' : ''}" data-a="chipT" data-k="${i}">${w}</button>`).join('')}</div>
  <div class="grid2"><div><label>Start</label><input name="start" type="date" value="${e.start}"></div><div><label>End (optional)</label><input name="end" type="date" value="${e.end || ''}"></div></div>
  </form>
  <div class="actions">${ev ? `<button class="btn-g bad" data-a="evDel" data-id="${e.id}">Delete</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="evSave" data-id="${e.id || ''}">Save</button></div>`);
}
function saveEvent(id) {
  const f = new FormData($('#evForm')), title = (f.get('title') || '').trim(), skill = f.get('skill');
  if (!title && !skill) { toast('Give it a title'); return; }
  const start = f.get('start') || todayKey(), end = f.get('end') || '';
  if (end && end < start) { toast('End date is before start'); return; }
  const days = chipsOn('#evDays').map(Number);
  const e = { id: id || uid(), title: title || SK[skill].name, list: f.get('list'), skill: skill || null, repeat: f.get('repeat'), days, start, end, target: num(f.get('target')), unit: (f.get('unit') || '').trim() };
  const old = id && S.events.find(x => x.id === id);
  if (old && isLocked('event', id) && (old.repeat !== e.repeat || old.start !== e.start || (old.end || '') !== e.end || (old.days || []).some(d => !e.days.includes(d)))) { lockRefuse('event', id, 'change its dates (you can add days)'); return; }
  if (skill) skState(skill);
  const i = S.events.findIndex(x => x.id === e.id); if (i >= 0) S.events[i] = e; else S.events.push(e);
  closeModal(true); regenToday(); afterChange();
}
function vacModal() {
  const tk = todayKey(), active = SKL.filter(s => isLib(s) && (S.skills[s.id] || {}).active), y = tk.slice(0, 4), left = Math.max(0, vacAllow(y) - vacDaysIn(y).size);
  openModal(`<h3>Vacation pause</h3><p class="mu small">Plan it ahead. Paused quests don't appear on those days. Days with nothing left don't touch your streak or give penalties.</p>
  <div class="dg-aim small"><b class="num">${left}</b> of ${vacAllow(y)} vacation days left in ${y} (${S.profile.student ? 'student' : 'adult'}: ${S.profile.student ? VAC_DAYS.student : VAC_DAYS.adult} a year${(S.vacBought || {})[y] ? `, +${S.vacBought[y]} bought` : ''}). Extra days cost ${VAC_EXTRA_COST} coins each.</div>
  <label>Label (optional)</label><input id="vNote" placeholder="e.g. Seoul trip">
  <div class="grid2"><div><label>First day</label><input id="vStart" type="date" min="${tk}" value="${addDays(tk, 1)}"></div><div><label>Last day</label><input id="vEnd" type="date" min="${tk}" value="${addDays(tk, 7)}"></div></div>
  <label class="check"><input type="checkbox" id="vAll"> Pause everything</label>
  <label>Pause these lists</label><div class="chips" id="vLists">${[...S.lists, 'Nutrition', 'Wind Down'].filter((l, i, a) => a.indexOf(l) === i).map(l => `<button class="chip" data-a="chipT" data-k="${esc(l)}">${esc(l)}</button>`).join('')}</div>
  ${active.length ? `<label>…or individual skills</label><div class="chips" id="vSkills">${active.map(s => `<button class="chip" data-a="chipT" data-k="${s.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}
  ${activeTasks().length ? `<label>…or tasks</label><div class="chips" id="vTasks">${activeTasks().map(t => `<button class="chip" data-a="chipT" data-k="${t.id}">${esc(t.name)}</button>`).join('')}</div>` : ''}
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="vacSave">Schedule pause</button></div>`);
}
function emModal() {
  ui.emDur = 3; const y = todayKey().slice(0, 4), left = EM_PER_YEAR - emUsed(y);
  if (left <= 0) { openModal(`<h3 class="bad">Extreme emergency</h3><p class="mu">You've used all ${EM_PER_YEAR} extreme emergencies for ${y}. They come back on January 1. For time off you can plan, use a vacation pause or a Rest Day Pass.</p><div class="actions"><button data-a="close">OK</button></div>`, { cls: 'danger' }); return; }
  openModal(`<h3 class="bad">Extreme emergency</h3><p class="mu">Pauses <b>every</b> quest starting today, penalties included. Your streak is frozen and no penalties are given. Any pending penalty exercises wait until you're back.</p>
  <div class="small mu2">${left} of ${EM_PER_YEAR} left for ${y}.</div>
  <label>How long?</label><div class="chips" id="emDur">${[[1, 'Today only'], [3, '3 days'], [7, '1 week'], [14, '2 weeks'], [0, 'Until I end it']].map(([v, n]) => `<button class="chip ${v === 3 ? 'on' : ''}" data-a="emDur" data-id="${v}">${n}</button>`).join('')}</div>
  <label>Note (optional)</label><input id="emNote" placeholder="Only you see this">
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-bad" data-a="emStart">Pause everything</button></div>`, { cls: 'danger' });
}

/* ---------- views: log ---------- */
function viewLog() {
  return `<div class="seg">${[['workout', 'Workouts'], ['food', 'Food'], ['body', 'Body']].map(([id, n]) => `<button class="${ui.logSeg === id ? 'on' : ''}" data-a="logSeg" data-id="${id}">${n}</button>`).join('')}</div>` + (ui.logSeg === 'workout' ? viewWorkout() : ui.logSeg === 'body' ? viewBody() : viewFood());
}
const DIST_ACTS = ['run', 'walk', 'hike', 'trail'];
const hasDist = id => DIST_ACTS.includes(id) || !!(ACT[id] && ACT[id].dist);
function actOptions(sel) { // <optgroup> per Workout subfolder; anything else under "Other"
  const wf = workoutFolders(), live = ACTS.filter(a => !a.del), other = live.filter(a => !wf.some(f => f.id === a.f));
  return wf.map(f => [f.name, live.filter(a => a.f === f.id)]).concat([['Other', other]]).filter(([, l]) => l.length)
    .map(([n, l]) => `<optgroup label="${esc(n)}">${l.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('');
}
function viewWorkout() {
  const k = todayKey(), mine = ACTS.filter(a => a.custom && !a.del);
  const todays = S.workouts.filter(w => w.date === k);
  const week = S.workouts.filter(w => w.date > addDays(k, -7));
  return `<div class="card"><h3>Log a workout</h3>
    <label>Activity</label><select id="wAct" data-c="wcalc">${actOptions(ui.lastAct)}</select>
    <div class="grid2" id="wTime"><div><label>Minutes</label><input id="wMin" type="number" inputmode="numeric" value="45" data-i="wcalc"></div>
    <div id="wDistWrap"><label>Distance (${imperial() ? 'mi' : 'km'})</label><input id="wDist" type="number" step="0.1" inputmode="decimal" placeholder="optional"></div></div>
    <div class="grid2" id="wRep" hidden><div><label>Reps per set</label><input id="wReps" type="number" inputmode="numeric" value="20" min="1" data-i="wcalc"></div>
    <div><label>Sets</label><input id="wSets" type="number" inputmode="numeric" value="1" min="1" max="50" data-i="wcalc"></div></div>
    <label>Intensity</label><div class="seg" style="margin-top:0">${['Light', 'Moderate', 'Vigorous'].map((n, i) => `<button class="${ui.intensity === i ? 'on' : ''}" data-a="int" data-id="${i}">${n}</button>`).join('')}</div>
    <div class="row est"><span class="mu small sp" id="wEstL">Estimated burn</span><b id="wKcal" class="num">—</b></div>
    <button class="btn-p btn-big" data-a="wLog">Log workout</button>
    <p class="mu2 small">MET × your weight × time (2024 Compendium of Physical Activities). Rep exercises estimate the time from the reps. Linked skill quests fill in automatically.</p>
    <button class="btn-s" data-a="caNew" style="margin-top:2px">+ New workout type</button></div>
  <h2>Today</h2><div class="card">${todays.length ? todays.map(w => `<div class="list-item"><div class="sp"><div>${esc((ACT[w.act] || { name: w.act }).name)}</div><div class="mu small">${w.reps ? `${w.reps} reps${w.sets > 1 ? ` (${w.sets} × ${Math.round(w.reps / w.sets)})` : ''}` : w.dist ? `${esc(fmtTarget(w.dist, 'km'))} · ${Math.round(w.min)} min` : `${Math.round(w.min * 10) / 10} min`} · ${['light', 'moderate', 'vigorous'][w.int]}${w.auto ? ' · from quest' : w.practice ? ' · from practice' : ''}</div></div><span class="num">${w.kcal} kcal</span>${w.auto ? '' : `<button class="btn-g x" data-a="wDel" data-id="${w.id}" aria-label="Delete">✕</button>`}</div>`).join('') : '<div class="mu small">Nothing logged yet.</div>'}</div>
  <div class="grid3"><div class="stat"><b>${week.length}</b><span>Sessions · 7d</span></div><div class="stat"><b>${Math.round(week.reduce((a, w) => a + w.min, 0))}</b><span>Minutes · 7d</span></div><div class="stat"><b>${week.reduce((a, w) => a + (w.kcal || 0), 0).toLocaleString()}</b><span>kcal · 7d</span></div></div>
  ${mine.length ? `<h2>Your workout types</h2><div class="card">${mine.map(a => `<div class="list-item"><div class="sp"><div>${esc(a.name)}</div><div class="mu small">${esc((folderById(a.f) || { name: 'Other' }).name)} · MET ${a.met.join(' / ')}${a.skill && SK[a.skill] ? ' · ' + esc(SK[a.skill].name) : ''}${a.reps ? ' · reps' : ''}${a.dist ? ' · distance' : ''}</div></div><button class="chip" data-a="caEdit" data-id="${a.id}">Edit</button></div>`).join('')}</div>` : ''}`;
}
function caModal(a) { // the user's own workout type
  const wf = workoutFolders(), like = a ? a.like : 'hiit';
  openModal(`<h3>${a ? 'Edit workout type' : 'New workout type'}</h3><p class="mu small">Your own activity in "Log a workout". Calories use MET values like the built-in ones.</p>
  <form id="caForm" onsubmit="return false">
  <label>Name</label><input name="name" value="${esc(a ? a.name : '')}" maxlength="40" placeholder="e.g. Sled pushes">
  <label>Group</label><select name="f" data-c="caF">${wf.map(f => `<option value="${f.id}" ${(a ? a.f : 'strength') === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}<option value="__new">+ New group…</option></select>
  <div id="caNewF" hidden><input name="fNew" placeholder="New group (a folder under Workout)" maxlength="32" style="margin-top:6px"></div>
  <label>Calories</label><select name="like" data-c="caLike"><option value="__met" ${a && !a.like ? 'selected' : ''}>My own MET values</option>${ACTS.filter(x => !x.del && (!a || x.id !== a.id)).map(x => `<option value="${x.id}" ${x.id === like ? 'selected' : ''}>Burns like ${esc(x.name)}</option>`).join('')}</select>
  <div id="caMet" class="met3" ${a && !a.like ? '' : 'hidden'}>${['Light', 'Moderate', 'Vigorous'].map((n, i) => `<div><label>${n}</label><input name="met${i}" type="number" step="0.1" inputmode="decimal" value="${a ? a.met[i] : [3, 5, 8][i]}"></div>`).join('')}
    <div class="mu2 small">MET: 1 = sitting still, 3.5 = brisk walk, 8 = jogging, 12+ = all-out.</div></div>
  <label>Linked skill (optional)</label><select name="skill"><option value="">None</option>${skillOptions(a ? a.skill : '')}</select>
  <div class="mu2 small" style="margin-top:4px">Logging it adds XP to the skill and fills that skill's quest (minutes, or reps for a rep skill).</div>
  <label>Counted in</label><select name="count" data-c="caCount"><option value="min" ${a && a.reps ? '' : 'selected'}>Minutes</option><option value="reps" ${a && a.reps ? 'selected' : ''}>Reps (× sets)</option></select>
  <div id="caRs" ${a && a.reps ? '' : 'hidden'}><label>Seconds per rep (for time and calories)</label><input name="rs" type="number" step="0.1" inputmode="decimal" value="${a && a.reps ? a.reps : 3}"></div>
  <label class="check"><input type="checkbox" name="dist" ${a && a.dist ? 'checked' : ''}> Track distance</label>
  </form>
  <div class="actions">${a ? `<button class="btn-g bad" data-a="caDel" data-id="${a.id}">Delete</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="caSave" data-id="${a ? a.id : ''}">${a ? 'Save' : 'Create'}</button></div>`);
}
function saveAct(id) {
  const f = new FormData($('#caForm')), name = (f.get('name') || '').trim();
  if (!name) { toast('Name your workout'); return; }
  let fid = f.get('f');
  if (fid === '__new') { const n = (f.get('fNew') || '').trim(); if (!n) { toast('Name the new group'); return; } fid = 'u_' + uid().slice(0, 8); S.folders.push({ id: fid, name: n, parent: 'workout' }); }
  const like = f.get('like'); let met;
  if (like === '__met') { met = [0, 1, 2].map(i => num(f.get('met' + i))); if (met.some(v => !v || v < 1 || v > 25)) { toast('MET values go from 1 to 25'); return; } }
  else { const L = ACT[like]; if (!L) { toast('Pick an activity to compare with'); return; } met = L.met.slice(); }
  const rs = f.get('count') === 'reps' ? num(f.get('rs')) : null; if (rs != null && !(rs >= 0.5 && rs <= 60)) { toast('Seconds per rep: 0.5 to 60'); return; }
  const def = { id: id || 'ca_' + uid().slice(0, 8), name, f: fid, met, like: like === '__met' ? null : like, skill: f.get('skill') || null, dist: !rs && !!f.get('dist'), reps: rs || null };
  const i = S.customActs.findIndex(a => a.id === def.id);
  if (i >= 0) S.customActs[i] = Object.assign(S.customActs[i], def); else S.customActs.push(def);
  rebuildACT(); ui.lastAct = def.id; closeModal(true); afterChange(); toast(i >= 0 ? 'Workout type updated' : 'Workout type added', 'ti');
}
const wRepTotal = () => Math.max(0, Math.round(num(($('#wReps') || {}).value) || 0)) * clamp(Math.round(num(($('#wSets') || {}).value) || 1), 1, 50);
function updateWkcal() {
  const a = $('#wAct'), m = $('#wMin'); if (!a || !m) return;
  const A = ACT[a.value], rp = !!(A && A.reps); $('#wTime').hidden = rp; $('#wRep').hidden = !rp;
  const min = rp ? Math.round(wRepTotal() * A.reps / 60 * 10) / 10 : num(m.value) || 0;
  $('#wKcal').textContent = workoutKcal(a.value, min, ui.intensity) + ' kcal';
  $('#wEstL').textContent = rp ? `${wRepTotal()} reps ≈ ${min} min of work · burn` : 'Estimated burn';
  $('#wDistWrap').style.visibility = hasDist(a.value) ? 'visible' : 'hidden';
}
function logWorkout() {
  const act = $('#wAct').value, a = ACT[act]; if (!a) { toast('Pick an activity'); return; }
  const reps = a.reps ? wRepTotal() : 0, sets = a.reps ? clamp(Math.round(num($('#wSets').value) || 1), 1, 50) : 1;
  if (a.reps && reps <= 0) { toast('Enter reps'); return; }
  let min = a.reps ? Math.max(0.1, Math.round(reps * a.reps / 60 * 10) / 10) : Math.round(num($('#wMin').value) || 0); if (min <= 0) { toast('Enter minutes'); return; }
  let dist = !a.reps && hasDist(act) ? num($('#wDist').value) : null; if (dist && imperial()) dist = dist / 0.621371;
  const k = todayKey(), room = DAY_CAP - S.workouts.filter(x => x.date === k).reduce((t, x) => t + (x.min || 0), 0);
  if (min > room) { if (room <= 0) { toast('Already 24 h of workouts logged today', 'bad'); return; } min = room; toast(`Capped at 24 h for today · logged ${min} min`, 'bad'); }
  if (a.skill && !SK[a.skill]) a.skill = null;
  if (a.skill) { min = capMin(a.skill, k, min); if (!min) return; }
  const w = { id: uid(), date: k, act, min, int: ui.intensity, kcal: workoutKcal(act, min, ui.intensity), skill: a.skill, xp: a.reps ? Math.max(1, Math.round(reps / 10)) : Math.round(min / 3), dist };
  if (a.reps) { w.reps = reps; w.sets = sets; }
  ui.lastAct = act;
  S.workouts.push(w);
  addXp(a.skill, w.xp);
  if (a.skill) {
    skState(a.skill).min += min;
    const q = (S.days[k] || { q: [] }).q.find(x => x.skill === a.skill);
    const add = !q ? 0 : q.unit === 'reps' && a.reps ? reps : q.unit === 'min' ? min : q.unit === 'km' && dist ? dist : 0;
    if (add) { // extra after the quest is done still counts toward a raise suggestion
      w.fill = add; q.progress = Math.round(((q.progress || 0) + add) * 10) / 10;
      if (!q.done && q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key, []); return; }
    }
  }
  fx('tick'); toast(a.reps ? `Logged ${reps} reps · ${w.kcal} kcal` : `Logged ${min} min · ${w.kcal} kcal`); afterChange();
}
function kbar(s) {
  if (s.none) return ''; // no goal: no target zone to draw
  const ref = s.hi ?? s.lo ?? 1, max = Math.max(ref * 1.25, s.eaten * 1.04, 1), P = v => +clamp(v / max * 100, 0, 100).toFixed(1);
  const zl = s.lo != null ? P(s.lo) : 0, zr = s.hi != null ? P(s.hi) : 100;
  const cls = !s.logged ? '' : s.ok ? 'ok' : s.hi != null && s.eaten > s.hi ? 'over' : 'under';
  return `<div class="kbar ${cls}"><i class="zone${s.lo == null ? ' open-l' : ''}${s.hi == null ? ' open-r' : ''}" style="left:${zl}%;width:${(zr - zl).toFixed(1)}%"></i><i class="fill" style="width:${P(s.eaten)}%"></i></div>
    <div class="kbar-lab">${s.lo != null ? `<span class="lo" style="left:${zl}%">${fmtK(s.lo)}</span>` : ''}${s.hi != null ? `<span class="hi" style="left:${zr}%">${fmtK(s.hi)}</span>` : ''}</div>`;
}
function fastCard(f, k) {
  return `<div class="card fast-card"><div class="row">${ICON.plate}<div class="sp"><b>Fasting${f.note ? ' · ' + esc(f.note) : ''}</b><div class="mu small">Day ${fastDay(f, k)} of ${fastLen(f)} · last day ${fmtDate(f.end)}</div></div></div>
    <p class="mu small" style="margin-bottom:0">Calorie tracking is off and the diet quest is paused, with no penalty. Your other quests carry on as usual.</p>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn-s" data-a="dietGoal">Fast settings</button><span class="sp"></span><button class="btn-g small" data-a="fastFood">${ui.fastFood ? 'Hide food log' : 'Log food anyway'}</button></div></div>`;
}
const isFavEntry = e => (e.fav && S.favs.some(f => f.id === e.fav)) || (!e.items && S.favs.some(f => f.items.length === 1 && f.items[0].n === e.name && Math.round(f.items[0].g) === Math.round(e.g)));
function viewFood() {
  const k = todayKey(), items = S.food.filter(f => f.date === k), fast = fastOn(k);
  const sum = items.reduce((a, f) => ({ kcal: a.kcal + f.kcal, p: a.p + f.p, c: a.c + f.c, f: a.f + f.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  if (fast && !ui.fastFood) return fastCard(fast, k);
  let top = '';
  if (fast) top = fastCard(fast, k);
  else {
    const s = dietStatus(k), st = !s.logged ? 'mu' : s.ok ? 'acc' : s.hi != null && s.eaten > s.hi ? 'bad' : 'gold';
    top = `<div class="card diet-card"><div class="row"><div class="sp"><div class="mu small">Eaten today</div><div class="num big">${fmtK(sum.kcal)} <span class="mu" style="font-size:14px">kcal</span></div></div>
      <div class="small" style="text-align:right"><div class="${s.none ? 'mu' : st} num">${esc(dietMsg(s))}</div><div class="mu2">${s.none ? 'no goal' : `aim ${aimTxt(s)} kcal`}</div></div></div>
      ${kbar(s)}
      <div class="grid3 macros"><div><span class="mu small">Protein</span><div class="num">${sum.p.toFixed(0)} g</div></div><div><span class="mu small">Carbs</span><div class="num">${sum.c.toFixed(0)} g</div></div><div><span class="mu small">Fat</span><div class="num">${sum.f.toFixed(0)} g</div></div></div>
      <div class="diet-line"><div class="sp"><div class="dl-goal">${esc(goalDesc(s))}${S.profile.dietQuest === false ? ' <span class="pill">quest off</span>' : ''}</div><div class="mu2">${esc(aimBreakdown(s))}</div></div><button class="btn-s" data-a="dietGoal">Edit goal</button></div></div>`;
  }
  const row = f => `<div class="list-item"><button class="btn-g star ${isFavEntry(f) ? 'on' : ''}" data-a="fFav" data-id="${f.id}" aria-label="Save to favorites">${isFavEntry(f) ? '★' : '☆'}</button><div class="sp"><div class="small">${esc(f.name)}</div><div class="mu small">${f.items ? f.items.length + ' foods · ' : ''}${Math.round(f.g)} g · P ${f.p.toFixed(0)} · C ${f.c.toFixed(0)} · F ${f.f.toFixed(0)}</div></div><span class="num">${Math.round(f.kcal)}</span><button class="btn-g x" data-a="fDel" data-id="${f.id}" aria-label="Delete">✕</button></div>`;
  return `${top}${favCard()}
  <div class="card"><h3>Add food</h3><input id="foodQ" type="search" placeholder="Search, e.g. chicken breast roasted" data-i="foodq" autocomplete="off">
    <div id="foodRes"></div>
    <div class="row" style="margin-top:8px"><span class="mu2 small sp">USDA SR28 · ${window.FOOD_DB ? FOOD_DB.foods.length.toLocaleString() : '…'} foods · raw & cooked · per 100 g</span><button class="btn-s" data-a="customFood">+ Custom</button></div></div>
  <h2>Today</h2><div class="card">${items.length ? items.map(row).join('') : '<div class="mu small">Nothing logged yet.</div>'}</div>`;
}
/* ---------- favorite meals ----------
   S.favs = [{ id, name, items: [{ n, g, k, p, c, f }] }]  (k/p/c/f per 100 g, copied so favorites survive food edits) */
const r1 = v => Math.round((v || 0) * 10) / 10;
const per100 = (n, g, kcal, p, c, f) => ({ n, g, k: kcal / g * 100, p: p / g * 100, c: c / g * 100, f: f / g * 100 });
const itemMac = it => { const r = (it.g || 0) / 100; return { kcal: it.k * r, p: it.p * r, c: it.c * r, f: it.f * r }; };
const favTot = items => items.reduce((a, it) => { const m = itemMac(it); return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f, g: a.g + (it.g || 0) }; }, { kcal: 0, p: 0, c: 0, f: 0, g: 0 });
const totTxt = t => `${fmtK(t.kcal)} kcal · P ${t.p.toFixed(0)} · C ${t.c.toFixed(0)} · F ${t.f.toFixed(0)}`;
const favSub = fv => { const t = favTot(fv.items); return `${fv.items.length > 1 ? fv.items.length + ' foods · ' : ''}${Math.round(t.g)} g · ${fmtK(t.kcal)} kcal`; };
const favKey = items => JSON.stringify(items.map(i => [i.n, Math.round(i.g)]));
function saveFav(name, items) {
  if (S.favs.some(f => favKey(f.items) === favKey(items))) { toast('Already in Favorite meals'); return null; }
  const fv = { id: uid(), name: (name || items[0].n).trim(), items: items.map(i => ({ n: i.n, g: r1(i.g), k: r1(i.k), p: r1(i.p), c: r1(i.c), f: r1(i.f) })) };
  S.favs.push(fv); return fv;
}
function logItems(name, items, favId) {
  const t = favTot(items), multi = items.length > 1;
  const e = { id: uid(), date: todayKey(), name: multi ? name : items[0].n, g: Math.round(t.g), kcal: t.kcal, p: t.p, c: t.c, f: t.f, fav: favId || null };
  if (multi) e.items = items.map(i => Object.assign({}, i));
  S.food.push(e); return e;
}
function favCard() {
  const favs = S.favs || [], max = 5, show = ui.favAll ? favs : favs.slice(0, max);
  return `<div class="card"><div class="row"><h3 class="sp">Favorite meals</h3><button class="btn-s" data-a="favNew">+ New meal</button></div>
    ${favs.length ? `<div class="favs">${show.map(fv => `<div class="list-item fav"><button class="fav-b sp" data-a="favOpen" data-id="${fv.id}"><span class="fav-n">${esc(fv.name)}</span><small>${esc(favSub(fv))}</small></button><button class="btn-s btn-p" data-a="favLog" data-id="${fv.id}" aria-label="Log ${esc(fv.name)}">+ Log</button></div>`).join('')}</div>
      ${favs.length > max ? `<button class="btn-g small" style="margin-top:4px" data-a="favAll">${ui.favAll ? 'Show fewer' : `Show all ${favs.length}`}</button>` : ''}`
    : `<p class="mu small" style="margin-bottom:0">Save foods you eat often and log them in one tap. Tap ☆ on a logged food or in the food sheet, or build a meal from several foods.</p>`}</div>`;
}
function favModal(fv) {
  ui.fv = fv ? { id: fv.id, name: fv.name, items: fv.items.map(i => Object.assign({}, i)) } : { id: null, name: '', items: [] };
  ui.fvRes = [];
  openModal(`<h3>${fv ? 'Favorite meal' : 'New meal'}</h3><div id="fvBody">${fvBody()}</div>`);
}
function fvBody() {
  const d = ui.fv;
  return `<label>Name</label><input id="fvName" value="${esc(d.name)}" placeholder="e.g. Usual breakfast" data-i="fvName">
  <label>Foods</label>
  <div class="fv-items">${d.items.length ? d.items.map((it, i) => `<div class="fv-it"><div class="sp small">${esc(it.n)}<div class="mu2" id="fvk_${i}">${fmtK(itemMac(it).kcal)} kcal</div></div><input type="number" inputmode="decimal" step="any" value="${it.g}" data-i="fvG" data-id="${i}" aria-label="Grams of ${esc(it.n)}"><span class="mu small">g</span><button class="btn-g x" data-a="fvDel" data-id="${i}" aria-label="Remove">✕</button></div>`).join('') : '<div class="mu small">No foods yet. Search below to add some.</div>'}</div>
  <input id="fvQ" type="search" placeholder="Add a food: database or your custom foods" data-i="fvq" autocomplete="off" style="margin-top:10px">
  <div id="fvRes"></div>
  <div class="fv-tot num" id="fvTot">${totTxt(favTot(d.items))}</div>
  ${d.id ? '<p class="mu2 small">Change the grams for a one-off portion and tap Log, or tap Save to update this favorite.</p>' : ''}
  <div class="actions">${d.id ? '<button class="btn-g bad" data-a="fvRemove">Delete</button><span class="sp"></span>' : '<button data-a="close">Cancel</button>'}<button data-a="fvSave">Save</button><button class="btn-p" data-a="fvLog">Log</button></div>`;
}
function fvValid() {
  const d = ui.fv; d.items = d.items.filter(i => i.g > 0);
  if (!d.items.length) { toast('Add at least one food with grams'); $('#fvBody').innerHTML = fvBody(); return false; }
  return true;
}
let FIDX = null;
function foodIndex() {
  if (!window.FOOD_DB) return [];
  if (!FIDX) FIDX = FOOD_DB.foods.map(f => ({ n: f[0], l: f[0].toLowerCase(), g: FOOD_DB.groups[f[1]], k: f[2], p: f[3], c: f[4], f: f[5] }));
  return S.customFoods.map(c => ({ n: c.name, l: c.name.toLowerCase(), g: 'Custom', k: c.kcal, p: c.p, c: c.c, f: c.f })).concat(FIDX);
}
function searchFood(q) {
  const t = q.toLowerCase().split(/[\s,]+/).filter(Boolean); if (!t.length) return [];
  const PROC = /Sausages|Fast Foods|Restaurant|Meals, Entrees|Snacks|Sweets|Baked|American Indian/;
  const res = foodIndex().filter(f => t.every(x => f.l.includes(x)));
  res.sort((a, b) => (b.g === 'Custom') - (a.g === 'Custom') || (PROC.test(a.g) - PROC.test(b.g)) || (b.l.startsWith(t[0]) - a.l.startsWith(t[0])) || a.n.length - b.n.length);
  return res.slice(0, 40);
}
function updateFoodRes() {
  const q = $('#foodQ').value; ui.foodRes = searchFood(q);
  $('#foodRes').innerHTML = ui.foodRes.length ? `<div class="food-res">${ui.foodRes.map((f, i) => `<button data-a="foodPick" data-id="${i}">${esc(f.n)}<small>${esc(f.g)} · ${f.k} kcal / 100 g</small></button>`).join('')}</div>` : (q.trim() ? (window.FOOD_DB ? '<div class="mu small" style="padding:8px 2px">No matches. Try fewer words, or add a custom food.</div>' : '<div class="mu small" style="padding:8px 2px">Loading food database…</div>') : '');
}
function foodModal(f) {
  ui.foodPick = f;
  openModal(`<h3>${esc(f.n)}</h3><div class="mu small">${f.k} kcal · P ${f.p} · C ${f.c} · F ${f.f} per 100 g</div>
  <label>Weight (grams)</label><input id="fg" type="number" inputmode="decimal" value="100" data-i="fcalc">
  <div id="fcalc" class="num" style="margin-top:10px;font-size:18px">${f.k} kcal · P ${f.p} g</div>
  <div class="actions"><button data-a="close">Cancel</button><span class="sp"></span><button data-a="foodFav" id="foodFavBtn">☆ Favorite</button><button class="btn-p" data-a="foodAdd">Add</button></div>`);
}
/* ---------- penalty editor (v14) ---------- */
const peClone = P => JSON.parse(JSON.stringify(P));
const peFrom = it => { const i = (it.amts || []).findIndex(a => a > 0); return i < 0 ? 0 : i; };
const peUnitTxt = it => ({ reps: 'reps', sec: 'sec', min: 'min', km: 'km', mi: 'mi', money: it.sym || '$', other: it.cu || '' })[it.unit] || '';
const peRound = v => v >= 20 ? Math.round(v / 5) * 5 : v >= 3 ? Math.round(v) : Math.round(v * 10) / 10;
function peFill(it, N) { // the middle tiers sit evenly between the smallest and the Hell amounts
  const a = it.amts, s = peFrom(it), lo = a[s], hi = a[N - 1];
  if (!(lo > 0) || !(hi > 0)) return;
  for (let t = s + 1; t < N - 1; t++) a[t] = peRound(lo + (hi - lo) * (t - s) / (N - 1 - s));
}
function peRenumber(P) { // default-style names follow their place ("Tier II", the last one "… — Hell")
  const N = P.tiers.length;
  P.tiers.forEach((t, i) => { if (/^Tier [IVX]+( — Hell)?$/.test(t.name)) t.name = 'Tier ' + (ROMAN[i] || i + 1) + (i === N - 1 && N > 1 ? ' — Hell' : ''); });
}
function penModal() {
  ui.pe = peClone(penCfg());
  openModal(`<h3>Penalties</h3><p class="mu small">What a day under 100% costs. Scalable penalties grow tier by tier as the day gets worse; fixed penalties are one set thing at or below a line.</p><div id="peBody">${peBody()}</div>
    <div class="actions"><button data-a="peReset">Reset to default</button><span class="sp"></span><button data-a="close">Cancel</button><button class="btn-p" data-a="peSave">Save</button></div>`, { cls: 'wide' });
}
function peBody() {
  const P = ui.pe, N = P.tiers.length, tn = i => P.tiers[i] ? P.tiers[i].name : '';
  const tiers = P.tiers.map((t, i) => `<div class="pe-tier"><span class="pe-n num">${i + 1}</span><input data-i="pe" data-g="tier" data-n="${i}" data-k="name" value="${esc(t.name)}" maxlength="28" aria-label="Tier ${i + 1} name">
      <span class="pe-th">under ${i ? `<input type="number" inputmode="numeric" data-i="pe" data-g="tier" data-n="${i}" data-k="below" value="${t.below}" aria-label="Tier ${i + 1} starts under this %">` : '<b class="num">100</b>'}%</span>
      ${i ? `<button class="btn-g x" data-a="peDel" data-g="tier" data-n="${i}" aria-label="Remove this tier">✕</button>` : '<span class="pe-fix" title="The smallest penalty always applies under 100%">always</span>'}</div>`).join('');
  const amt = (i, it, t, lab) => `<div><label>${lab}</label><div class="pe-amt"><input type="number" inputmode="decimal" step="any" data-i="pe" data-g="amt" data-n="${i}" data-t="${t}" value="${it.amts[t] ?? ''}"><span class="mu2 small">${esc(peUnitTxt(it))}</span></div></div>`;
  const items = P.items.map((it, i) => { const s = peFrom(it), mid = [];
    for (let t = s + 1; t < N - 1; t++) mid.push(`<span class="pe-midc"><small>${esc(tn(t))}</small><input type="number" inputmode="decimal" step="any" data-i="pe" data-g="amt" data-n="${i}" data-t="${t}" value="${it.amts[t] ?? ''}" aria-label="${esc(tn(t))}"></span>`);
    return `<div class="pe-item"><div class="grid2"><div><label>Penalty</label><input data-i="pe" data-g="item" data-n="${i}" data-k="name" value="${esc(it.name)}" maxlength="40" placeholder="e.g. Push-ups"></div>
      <div><label>Measured in</label><select data-c="peUnit" data-n="${i}">${PEN_UNITS.map(([v, n]) => `<option value="${v}" ${it.unit === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      ${it.unit === 'money' ? `<label>Currency symbol</label><input data-i="pe" data-g="item" data-n="${i}" data-k="sym" value="${esc(it.sym || '$')}" maxlength="3" placeholder="$">` : it.unit === 'other' ? `<label>Unit</label><input data-i="pe" data-g="item" data-n="${i}" data-k="cu" value="${esc(it.cu || '')}" maxlength="16" placeholder="e.g. laps, pages, cold showers">` : ''}
      ${N > 1 ? `<label>Starts at</label><select data-c="peFrom" data-n="${i}">${P.tiers.map((t, ti) => `<option value="${ti}" ${s === ti ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>` : ''}
      <div class="grid2">${s < N - 1 ? amt(i, it, s, `Smallest · ${esc(tn(s))}`) + amt(i, it, N - 1, `Hell · ${esc(tn(N - 1))}`) : amt(i, it, N - 1, `Amount · ${esc(tn(N - 1))}`)}</div>
      ${mid.length ? `<div class="pe-mid"><span class="mu2 small">In between (filled in for you, change any):</span>${mid.join('')}</div>` : ''}
      <div class="row" style="margin-top:6px"><label class="check sp"><input type="checkbox" data-c="peGrow" data-n="${i}" ${it.grow ? 'checked' : ''}> Grows with your level</label><button class="btn-g small" data-a="peDel" data-g="item" data-n="${i}">Remove</button></div></div>`; }).join('');
  const fixed = P.fixed.map((f, i) => `<div class="pe-item"><label>Penalty</label><input data-i="pe" data-g="fixed" data-n="${i}" data-k="text" value="${esc(f.text)}" maxlength="60" placeholder="e.g. Donate to a charity of your choice">
      <div class="grid3"><div><label>Amount <small class="mu2">optional</small></label><input type="number" inputmode="decimal" step="any" data-i="pe" data-g="fixed" data-n="${i}" data-k="amt" value="${f.amt ?? ''}"></div>
        <div><label>Unit / symbol</label><input data-i="pe" data-g="fixed" data-n="${i}" data-k="sym" value="${esc(f.sym || '')}" maxlength="12" placeholder="$"></div>
        <div><label>At or below</label><div class="pe-amt"><input type="number" inputmode="numeric" data-i="pe" data-g="fixed" data-n="${i}" data-k="at" value="${f.at}"><span class="mu2 small">%</span></div></div></div>
      <label>How</label><div class="seg tight">${[['sheet', 'Confirm before going on'], ['quest', "A quest the next day"]].map(([v, n]) => `<button class="${(f.how || 'sheet') === v ? 'on' : ''}" data-a="peHow" data-n="${i}" data-id="${v}">${n}</button>`).join('')}</div>
      <div class="row"><span class="sp"></span><button class="btn-g small" data-a="peDel" data-g="fixed" data-n="${i}">Remove</button></div></div>`).join('');
  return `<div class="tg">Tiers</div><p class="mu2 small" style="margin:2px 0 6px">The smallest tier always applies under 100%; the last one is the Hell level. A day gets the strongest tier it falls under.</p>
    <div class="pe-tiers">${tiers}</div><button class="btn-s" data-a="peAddTier">${ICON.plus} Add a tier</button>
    <div class="tg">Scalable penalties</div><p class="mu2 small" style="margin:2px 0 6px">Type the penalty and what it's measured in, then the smallest and the Hell amounts.</p>
    ${items || '<div class="mu small">None. Add one, or rely on fixed penalties.</div>'}<button class="btn-s" data-a="peAddItem">${ICON.plus} Add a scalable penalty</button>
    <div class="tg">Fixed penalties</div><p class="mu2 small" style="margin:2px 0 6px">One set penalty when the day is at or below a line (0% = you missed everything).</p>
    ${fixed || '<div class="mu small">None.</div>'}<button class="btn-s" data-a="peAddFixed">${ICON.plus} Add a fixed penalty</button>`;
}
function peRefresh() { const b = $('#peBody'); if (!b) return; const sc = b.closest('.sheet'), y = sc ? sc.scrollTop : 0; b.innerHTML = peBody(); if (sc) sc.scrollTop = y; }
function peInput(el) {
  const P = ui.pe, g = el.dataset.g, i = +el.dataset.n, k = el.dataset.k, v = el.value;
  if (g === 'tier') { if (k === 'below') P.tiers[i].below = num(v); else P.tiers[i].name = v; return; }
  if (g === 'item') { P.items[i][k] = v; return; }
  if (g === 'fixed') { P.fixed[i][k] = k === 'amt' || k === 'at' ? num(v) : v; return; }
  if (g === 'amt') {
    const it = P.items[i], t = +el.dataset.t, N = P.tiers.length; it.amts[t] = num(v);
    if (t === peFrom(it) || t === N - 1) { peFill(it, N); $$(`#peBody [data-g=amt][data-n="${i}"]`).forEach(x => { const tt = +x.dataset.t; if (tt !== t && tt !== N - 1 && tt !== peFrom(it)) x.value = it.amts[tt] ?? ''; }); }
  }
}
function peSave() {
  const P = peClone(ui.pe), bad = m => { toast(m, 'bad'); return false; }, ok = v => typeof v === 'number' && isFinite(v);
  P.tiers.forEach(t => { t.name = (t.name || '').trim(); }); P.tiers[0].below = 100;
  for (let i = 0; i < P.tiers.length; i++) {
    const t = P.tiers[i]; if (!t.name) return bad(`Name tier ${i + 1}`);
    if (i && (!ok(t.below) || t.below < 1 || t.below > 99 || Math.round(t.below) !== t.below)) return bad(`Tier ${i + 1}: pick a whole % between 1 and 99`);
    if (i && t.below >= P.tiers[i - 1].below) return bad(`Each tier starts lower than the one above it (tier ${i + 1})`);
  }
  for (const it of P.items) {
    it.name = (it.name || '').trim(); if (!it.name) return bad('Type a name for each scalable penalty');
    if (it.unit === 'other' && !(it.cu || '').trim()) return bad(`Type the unit for ${it.name}`);
    const s = peFrom(it); for (let t = 0; t < P.tiers.length; t++) { if (t < s) { it.amts[t] = null; continue; } if (!ok(it.amts[t]) || it.amts[t] <= 0) return bad(`${it.name}: fill in every amount from ${P.tiers[s].name} down`); }
  }
  for (const f of P.fixed) {
    f.text = (f.text || '').trim(); if (!f.text) return bad('Type what each fixed penalty is');
    if (!ok(f.at) || f.at < 0 || f.at > 99 || Math.round(f.at) !== f.at) return bad(`${f.text}: pick a whole % between 0 and 99`);
    if (f.amt != null && (!ok(f.amt) || f.amt < 0)) return bad(`${f.text}: the amount can't be negative`);
    if (!(f.amt > 0)) f.amt = null; f.sym = (f.sym || '').trim(); f.how = f.how === 'quest' ? 'quest' : 'sheet';
  }
  S.pen = JSON.stringify(P) === JSON.stringify(PEN_DEF()) ? null : P;
  if (S.pendingPen) S.pendingPen.tier = Math.min(S.pendingPen.tier || 0, P.tiers.length);
  closeModal(true); afterChange(); toast(S.pen ? 'Your penalties are saved' : 'Penalties back to default', 'ti');
  return true;
}
/* ---------- diet goal sheet ---------- */
function dietModal(keep) {
  if (!keep || !ui.dg) { const c = dietCfg(); ui.dg = Object.assign({ goal: GOAL_NAME[S.profile.goal] ? S.profile.goal : 'maintain', quest: S.profile.dietQuest !== false, own: !!c.maint }, c, { maint: c.maint || estMaint() }); }
  openModal(`<h3>Diet goal</h3><p class="mu small">Sets the daily calorie aim for the "Met diet requirements" quest, which checks itself from your food log.</p><div id="dgBody">${dgBody()}</div>
    <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="dgSave">Save</button></div>`);
}
const dgDraft = () => { const d = ui.dg; return { goal: d.goal, diet: { maint: d.own ? d.maint : null, rule: d.rule, kcal: d.kcal, tol: d.tol, lo: d.lo, hi: d.hi, burn: d.burn } }; };
function dgAimTxt() {
  const d = ui.dg, need = d.goal === 'none' ? [] : d.goal !== 'custom' ? (d.own ? ['maint'] : []) : d.rule === 'range' ? ['lo', 'hi'] : d.rule === 'target' ? ['kcal', 'tol'] : ['kcal'];
  if (need.some(k => typeof d[k] !== 'number' || !isFinite(d[k]))) return '<span class="mu">Fill in the numbers to see today\'s aim.</span>';
  const a = dietAim(todayKey(), dgDraft());
  return `Today's aim <b class="num">${aimTxt(a)} kcal</b><div class="mu2 small">${esc(aimBreakdown(a))}</div>`;
}
function dgBody() {
  const d = ui.dg, tk = todayKey();
  const inp = (key, lab) => `<div><label>${lab}</label><input type="number" inputmode="numeric" data-i="dg" data-k="${key}" value="${d[key] ?? ''}"></div>`;
  let h = `<div class="seg goal4">${['none', 'cut', 'maintain', 'bulk', 'custom'].map(g => `<button class="${d.goal === g ? 'on' : ''}" data-a="dgGoal" data-id="${g}">${GOAL_NAME[g]}</button>`).join('')}</div>`;
  if (d.goal === 'none') h += '<p class="mu small" style="margin-top:12px">No calorie aim and no diet quest. Food you log still counts up, and you can pick a goal any time.</p>';
  else if (d.goal !== 'custom') {
    const [a, b] = DIET_BAND[d.goal], adj = GOAL_ADJ[d.goal];
    h += `<label>Maintenance calories</label><div class="seg tight"><button class="${!d.own ? 'on' : ''}" data-a="dgOwn" data-id="0">Estimate · ${fmtK(estMaint())}</button><button class="${d.own ? 'on' : ''}" data-a="dgOwn" data-id="1">My own number</button></div>
      ${d.own ? `<input type="number" inputmode="numeric" data-i="dg" data-k="maint" value="${d.maint ?? ''}" aria-label="Your maintenance calories">` : ''}
      <p class="mu2 small">The estimate is Mifflin-St Jeor (BMR ${fmtK(bmrOf())}) × 1.25 for light daily activity; logged workouts are added on top each day. If your weight trend disagrees, enter the intake that actually keeps your weight steady.</p>
      <p class="mu small">${GOAL_NAME[d.goal]}: maintenance ${adj ? `${adj < 0 ? '−' : '+'} ${Math.abs(adj)} kcal` : 'as is'} · the quest counts when you eat ${Math.round(a * 100)}–${Math.round(b * 100)}% of the aim.</p>`;
  } else {
    h += `<label>Rule</label><div class="seg tight">${RULES.map(([v, n]) => `<button class="${d.rule === v ? 'on' : ''}" data-a="dgRule" data-id="${v}">${n}</button>`).join('')}</div>
      <div class="mu2 small">${{ target: 'Hit a daily number, give or take a margin.', range: 'Land anywhere between two numbers.', limit: 'Stay at or under a daily number.', min: 'Eat at least a daily number.' }[d.rule]}</div>
      ${d.rule === 'target' ? `<div class="grid2">${inp('kcal', 'Calories per day')}${inp('tol', 'Margin (± kcal)')}</div>` : d.rule === 'range' ? `<div class="grid2">${inp('lo', 'At least (kcal)')}${inp('hi', 'At most (kcal)')}</div>` : inp('kcal', d.rule === 'limit' ? 'Stay under (kcal)' : 'Eat at least (kcal)')}
      <label class="check"><input type="checkbox" data-c="dgBurn" ${d.burn ? 'checked' : ''}> Add calories burned in logged workouts</label>`;
  }
  if (d.goal !== 'none') h += `<div class="dg-aim" id="dgAim">${dgAimTxt()}</div>
    <label class="check"><input type="checkbox" data-c="dgQuest" ${d.quest ? 'checked' : ''}> Daily "Met diet requirements" quest</label>`;
  const f = fastNext();
  h += `<hr><div class="row fast-row">${ICON.plate}<div class="sp">${f ? `<b>${f.start <= tk ? 'Fasting' : 'Fast planned'}${f.note ? ' · ' + esc(f.note) : ''}</b><div class="mu small">${fmtDate(f.start)} – ${fmtDate(f.end)} · ${f.start <= tk ? `day ${fastDay(f, tk)} of ${fastLen(f)}` : fastLen(f) + ' days'}</div>`
    : `<b>Religious fast</b><div class="mu small">Pause the diet quest and calorie tracking for up to ${FAST_MAX} days, with no penalty.</div>`}</div>
    ${f ? `${f.start >= tk ? `<button class="btn-s" data-a="fastCancel" data-id="${f.id}">Cancel</button>` : ''}${f.start <= tk && f.end !== tk ? `<button class="btn-s" data-a="fastEnd" data-id="${f.id}">End</button>` : ''}` : '<button class="btn-s" data-a="fastNew">Plan a fast</button>'}</div>
    ${f && f.start <= tk && f.end === tk ? '<div class="mu2 small" style="margin-top:6px">Last day today · the diet quest returns tomorrow.</div>' : ''}`;
  return h;
}
function saveDiet() {
  const d = ui.dg, bad = m => { toast(m, 'bad'); return false; };
  const ok = v => typeof v === 'number' && isFinite(v);
  const floorMsg = `Custom goals can't go below ${fmtK(KCAL_FLOOR)} kcal a day. Very-low-calorie plans need a doctor's guidance.`;
  if (d.goal !== 'custom' && d.goal !== 'none' && d.own) { if (!ok(d.maint) || d.maint < KCAL_FLOOR || d.maint > 8000) return bad(`Maintenance should be between ${fmtK(KCAL_FLOOR)} and 8,000 kcal`); }
  if (d.goal === 'custom') {
    if (d.rule === 'range') { if (!ok(d.lo) || !ok(d.hi)) return bad('Enter both numbers'); if (d.lo < KCAL_FLOOR) return bad(floorMsg); if (d.hi <= d.lo) return bad('"At most" must be above "At least"'); }
    else if (!ok(d.kcal) || d.kcal <= 0) return bad('Enter a calorie number');
    else if (d.rule !== 'min' && d.kcal < KCAL_FLOOR) return bad(floorMsg);
    if (d.rule === 'target' && (!ok(d.tol) || d.tol < 0 || d.tol > 1000)) return bad('Margin should be 0–1,000 kcal');
    if (d.kcal > 10000 || d.hi > 10000) return bad('That number looks too high');
  }
  const p = S.profile, dr = dgDraft();
  p.goal = d.goal; p.dietQuest = d.quest; p.diet = Object.assign(dietCfg(), dr.diet);
  closeModal(true); regenToday(); afterChange(); toast('Diet goal saved', 'ti');
  return true;
}
function fastModal() {
  const tk = todayKey(); ui.fs = { start: tk, len: FAST_MAX };
  openModal(`<h3>Religious fast</h3>
  <p class="mu small">For fasts where you don't count calories. On these days the diet quest is removed and the Food tab hides calorie tracking. Nothing counts against you, and your other quests carry on as usual. Up to ${FAST_MAX} days.</p>
  <label>Name (optional)</label><input id="fsNote" placeholder="e.g. Lent, Daniel fast" maxlength="40">
  <div class="grid2"><div><label>First day</label><input id="fsStart" type="date" min="${tk}" value="${tk}" data-c="fsCalc"></div><div><label>Length (days)</label><input id="fsLen" type="number" inputmode="numeric" min="1" max="${FAST_MAX}" value="${FAST_MAX}" data-i="fsCalc"></div></div>
  <div class="chips" id="fsChips" style="margin-top:10px">${[1, 3, 7, 21, 40].map(n => `<button class="chip ${n === FAST_MAX ? 'on' : ''}" data-a="fsLen" data-id="${n}">${n} day${n > 1 ? 's' : ''}</button>`).join('')}</div>
  <div class="dg-aim" id="fsEnd">${fsEndTxt()}</div>
  <div class="actions"><button data-a="fsBack">Back</button><button class="btn-p" data-a="fsSave">Save fast</button></div>`);
}
function fsRead() { const s = $('#fsStart'), l = $('#fsLen'); if (s) ui.fs.start = s.value; if (l) ui.fs.len = num(l.value); return ui.fs; }
function fsEndTxt() {
  const f = ui.fs, n = f.len;
  if (!f.start || !Number.isInteger(n) || n < 1 || n > FAST_MAX) return `<span class="bad">Choose 1 to ${FAST_MAX} days.</span>`;
  const end = addDays(f.start, n - 1);
  return `Last day <b>${fmtDate(end)}</b> · the diet quest returns ${fmtDate(addDays(end, 1))}`;
}
function saveFast() {
  const f = fsRead(), tk = todayKey(), n = f.len;
  if (!f.start || f.start < tk) { toast("A fast can't start in the past", 'bad'); return; }
  if (!Number.isInteger(n) || n < 1 || n > FAST_MAX) { toast(`Choose 1 to ${FAST_MAX} days`, 'bad'); return; }
  const end = addDays(f.start, n - 1);
  if (S.fasts.some(x => !(end < x.start || f.start > x.end))) { toast('That overlaps another fast', 'bad'); return; }
  S.fasts.push({ id: uid(), start: f.start, end, note: ($('#fsNote').value || '').trim() });
  if (f.start === tk) regenToday();
  afterChange(); toast(f.start === tk ? 'Fast started' : 'Fast planned', 'ti');
  dietModal(true);
}
function refreshDietUi() { if ($('#dgBody')) $('#dgBody').innerHTML = dgBody(); }

/* ---------- views: body ---------- */
function viewBody() {
  const k = todayKey(), recent = [...S.body].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8);
  const w = latestWeightKg(), bf = latestBF(), t = S.tests;
  const tv = (key, conv = x => x) => t[key] ? conv(t[key].v) : '';
  return `<div class="grid2"><div class="stat"><b>${fmtW(w)}</b><span>Weight</span></div><div class="stat"><b>${bf != null ? bf + '%' : '—'}</b><span>Body fat</span></div></div>
  <h2>Trend</h2><div class="card"><div class="seg" style="margin-top:0">${[[30, '30d'], [90, '90d'], [365, '1y'], [0, 'All']].map(([v, n]) => `<button class="${ui.bodyRange === v ? 'on' : ''}" data-a="range" data-id="${v}">${n}</button>`).join('')}</div>${bodyChart(ui.bodyRange)}</div>
  <div class="card"><h3>Log body stats</h3><div class="grid2"><div><label>Weight (${imperial() ? 'lb' : 'kg'})</label><input id="bW" type="number" step="0.1" inputmode="decimal"></div><div><label>Body fat %</label><input id="bF" type="number" step="0.1" inputmode="decimal"></div></div>
    <label>Date</label><input id="bD" type="date" value="${k}" max="${dkey(new Date())}"><button class="btn-p btn-big" data-a="bodyAdd">Save entry</button>
    ${recent.length ? '<hr>' + recent.map(b => `<div class="list-item"><span class="sp mu small">${fmtDate(b.date)}</span><span class="num small">${b.w ? fmtW(b.w) : '—'} · ${b.bf != null ? b.bf + '%' : '—'}</span><button class="btn-g x" data-a="bDel" data-id="${b.id}" aria-label="Delete">✕</button></div>`).join('') : ''}</div>
  <h2>Health hexagon</h2><div class="card"><div class="hex-wrap">${radar(healthAxes())}</div><p class="mu2 small">The dashed ring (50) is roughly the average adult of your age and sex, from approximate ACSM-style norms. Sleep and nutrition come from your own logs.</p></div>
  <div class="card"><h3>Fitness tests</h3><p class="mu small" style="margin-top:2px">Retest every few weeks; the hexagons update automatically.</p>
    <div class="grid2">
      <div><label>Resting HR (bpm)</label><input id="t_rhr" type="number" inputmode="numeric" value="${tv('rhr')}"></div>
      <div><label>Max push-ups</label><input id="t_pushups" type="number" inputmode="numeric" value="${tv('pushups')}"></div>
      <div><label>Max pull-ups</label><input id="t_pullups" type="number" inputmode="numeric" value="${tv('pullups')}"></div>
      <div><label>Plank hold (m:ss)</label><input id="t_plank" value="${t.plank ? fmtSec(t.plank.v) : ''}" placeholder="1:30"></div>
      <div><label>5K run (mm:ss)</label><input id="t_run5k" value="${t.run5k ? fmtSec(t.run5k.v * 60) : ''}" placeholder="28:00"></div>
      <div><label>100 m sprint (sec)</label><input id="t_sprint100" type="number" step="0.1" inputmode="decimal" value="${tv('sprint100')}"></div>
      <div><label>Sit & reach (${imperial() ? 'in' : 'cm'})</label><input id="t_sitreach" type="number" step="0.1" inputmode="decimal" value="${tv('sitreach', v => imperial() ? (v / 2.54).toFixed(1) : v)}"></div>
    </div><button class="btn-p btn-big" data-a="testsSave">Save tests</button></div>`;
}
const parseMS = s => { if (!s) return null; s = String(s).trim(); if (s.includes(':')) { const [a, b] = s.split(':').map(Number); return isNaN(a) ? null : a * 60 + (b || 0); } return num(s); };

/* ---------- views: profile ---------- */
function viewMe() {
  const segs = [['overview', 'Stats'], ['titles', 'Titles'], ['books', 'Books'], ['settings', 'Settings']];
  if (ui.profSeg === 'skills') ui.profSeg = 'overview';
  return `<div class="seg">${segs.map(([id, n]) => `<button class="${ui.profSeg === id ? 'on' : ''}" data-a="profSeg" data-id="${id}">${n}</button>`).join('')}</div>` + ({ overview: meOverview, titles: meTitles, books: meBooks, settings: meSettings })[ui.profSeg]();
}
function meOverview() {
  const o = overall(), rk = rankOf(o.L), titles = autoTitles();
  const hours = Object.values(S.skills).reduce((a, s) => a + (s.min || 0), 0) / 60;
  const kc = S.workouts.reduce((a, w) => a + (w.kcal || 0), 0), fb = S.books.filter(b => b.finished);
  const top = SKL.filter(s => S.skills[s.id] && (S.skills[s.id].xp > 0 || S.skills[s.id].active)).sort((a, b) => S.skills[b.id].xp - S.skills[a.id].xp).slice(0, 6);
  const tile = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  return `<div class="card row" style="gap:14px">${emblem(rk.tier, 60)}<div class="sp"><h3 style="font-size:18px">${esc(S.profile.name || 'Unnamed')}</h3>
    <div class="gold small">${esc(rk.name)} · Level ${o.L}</div><div class="bar gold"><i style="width:${o.into / o.need * 100}%"></i></div><div class="mu2 small num">${o.into} / ${o.need} XP · ${S.xp.toLocaleString()} total</div></div></div>
  <div class="card">${rankStrip(o.L)}</div>
  <div class="grid3">${tile(S.streak.cur, 'Streak')}${tile(S.streak.best, 'Best streak')}${tile(S.stats.perfect, 'Perfect days')}
    ${tile(S.stats.qdone, 'Quests done')}${tile(S.workouts.length, 'Workouts')}${tile(kc.toLocaleString(), 'kcal burned')}
    ${tile(hours.toFixed(0), 'Hours trained')}${tile(fb.length, 'Books read')}${tile(titles.length + S.titles.claimed.length, 'Titles')}
    ${tile(S.stats.penalties, 'Penalties')}${tile(S.stats.penCleared, 'Cleared')}${tile(Object.entries(S.stats.paid || {}).filter(([, v]) => v > 0).map(([k, v]) => penAmt(v, k)).join(' · ') || S.stats.donated || 0, 'Paid off')}</div>
  <h2>Health</h2><div class="card"><div class="hex-wrap">${radar(healthAxes())}</div></div>
  <h2>Discipline · Lv ${skLevel('discipline').L}</h2><div class="card"><div class="hex-wrap">${radar(SK.discipline.stats.map(st => ({ n: st.n, v: statValue('discipline', st) })))}</div></div>
  <h2>Top skills</h2><div class="card">${top.length ? top.map(s => { const l = skLevel(s.id); return `<div class="list-item"><span class="sp">${esc(s.name)} <span class="gold small">${esc(skillRank(s.id))}</span></span><span class="mu small num">Lv ${l.L}</span><div style="width:80px" class="bar"><i style="width:${l.into / l.need * 100}%"></i></div></div>`; }).join('') : '<div class="mu small">Complete quests to level up skills.</div>'}</div>`;
}
/* ---------- martial-art belts ---------- */
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
function beltDef(id) { // the ladder in use: the user's edited copy, else the standard one from the catalog
  const st = (S.belts || {})[id], std = BELTS[id];
  if (st && st.ladder && st.ladder.length) return { word: st.word || (std && std.word) || 'Belt', belts: st.ladder, custom: true };
  return std ? { word: std.word || 'Belt', belts: std.belts } : null;
}
const beltSt = id => (S.belts[id] || (S.belts[id] = { ladder: null, hist: [] }));
function beltCur(id) { // highest belt claimed
  const st = (S.belts || {})[id], d = beltDef(id); if (!st || !d || !(st.hist || []).length) return null;
  return st.hist.filter(h => h.i < d.belts.length).sort((a, b) => b.i - a.i || b.m - a.m)[0] || null;
}
function markTxt(b, v) {
  if (!b || !b.m) return '';
  if (b.ml === 'dan') return ord((b.d0 || 1) + v) + ' dan';
  if (b.ml === 'kyu') return ord(b.m + 1 - v) + ' kyu';
  if (b.ml === 'degree') return v ? ord(v) + ' degree' : '';
  return v ? v + ' stripe' + (v > 1 ? 's' : '') : '';
}
function beltName(id, i, m) { const d = beltDef(id), b = d && d.belts[i]; if (!b) return ''; const mk = markTxt(b, m || 0); return `${b.n} ${d.word.toLowerCase()}${mk ? ' · ' + mk : ''}`; }
function beltPct(id) { // white belt = about average for the art's hexagon (50), the top of the ladder ~ 99.7
  const d = beltDef(id), c = beltCur(id); if (!d || !c) return 2;
  const b = d.belts[c.i], pos = (c.i + (b && b.m ? c.m / (b.m + 1) : 0)) / Math.max(1, d.belts.length - 1);
  return Math.round(Math.min(99.7, 50 + 49.7 * Math.pow(clamp(pos, 0, 1), .8)));
}
const isDark = c => { const h = (c || '#000').replace('#', ''), v = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16); return ((v >> 16 & 255) * .3 + (v >> 8 & 255) * .59 + (v & 255) * .11) < 60; };
function beltSvg(b, m = 0, w = 84) { // flat belt with a rank bar and its marks
  if (!b) return '';
  const h = 13; let g = '';
  if (b.c2) { const n = 7; for (let i = 0; i < n; i++) g += `<rect x="${(i * w / n).toFixed(1)}" y="0" width="${(w / n + .3).toFixed(1)}" height="${h}" fill="${i % 2 ? b.c2 : b.c}"/>`; }
  else g += `<rect x="0" y="0" width="${w}" height="${h}" fill="${b.c}"/>`;
  if (b.m) { const bx = w * .66, bw = w * .22, dark = isDark(b.c); g += `<rect x="${bx.toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${h}" fill="${dark ? '#c4302b' : '#161616'}"/>`;
    const n = b.ml === 'dan' ? (b.d0 || 1) + m : m, sw = Math.max(1, Math.min(2.2, bw / 10)), gap = sw * .7, show = Math.min(n, Math.floor((bw - 2) / (sw + gap)));
    for (let k = 0; k < show; k++) g += `<rect x="${(bx + 1.5 + k * (sw + gap)).toFixed(1)}" y="1.5" width="${sw.toFixed(1)}" height="${h - 3}" fill="${b.ml === 'dan' || b.ml === 'degree' ? '#e2c27a' : '#f4f2ec'}"/>`; }
  return `<svg class="belt" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g>${g}</g><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="rgba(0,0,0,.35)"/></svg>`;
}
function beltBox(id) { // the belt section inside a martial art's skill card
  const d = beltDef(id), cur = beltCur(id), st = (S.belts || {})[id], s = SK[id];
  if (!d) return folderOf(s) === 'combat' || folderPath(folderOf(s)).startsWith('Workout › Combat') ? `<div class="belt-box"><div class="mu small">This art has no standard belts. If your school uses ranks, set them up here.</div><button class="btn-s" data-a="beltEdit" data-id="${id}" style="margin-top:8px">Set up belts</button></div>` : '';
  const hist = (st && st.hist || []).slice().sort((a, b) => a.date < b.date ? 1 : -1);
  return `<div class="belt-box"><div class="row" style="gap:10px">${cur ? beltSvg(d.belts[cur.i], cur.m) : beltSvg({ c: 'transparent' })}<div class="sp"><b>${cur ? esc(beltName(id, cur.i, cur.m)) : 'No ' + esc(d.word.toLowerCase()) + ' claimed'}</b>${cur ? `<div class="mu small">since ${fmtDate(cur.date)}</div>` : ''}</div><button class="btn-s btn-p" data-a="beltClaim" data-id="${id}">Claim ${esc(d.word.toLowerCase())}</button></div>
    ${hist.length > 1 || (hist.length && !cur) ? `<div class="belt-hist">${hist.map(h => `<div class="row small"><span class="sp mu">${esc(beltName(id, h.i, h.m))} · ${fmtDate(h.date)}</span><button class="btn-g x" data-a="beltDel" data-id="${id}" data-k="${h.id}" aria-label="Remove">✕</button></div>`).join('')}</div>` : cur ? `<div class="row small" style="margin-top:4px"><span class="sp"></span><button class="btn-g small" data-a="beltDel" data-id="${id}" data-k="${cur.id}">Undo claim</button></div>` : ''}
    <div class="row small" style="margin-top:6px"><span class="sp mu2">${d.custom ? "Your school's order" : 'Standard order · schools vary'}</span><button class="btn-g small" data-a="beltEdit" data-id="${id}">Edit ${esc(d.word.toLowerCase())}s</button></div></div>`;
}
function beltClaimModal(id) {
  const d = beltDef(id); if (!d) return; const cur = beltCur(id);
  ui.bc = { id, i: cur ? cur.i : 0, m: cur ? cur.m : 0 };
  openModal(`<h3>Claim a ${esc(d.word.toLowerCase())} · ${esc(SK[id].name)}</h3><p class="mu small">Pick the ${esc(d.word.toLowerCase())} you were awarded. It shows on the skill, fills the hexagon's Belt side and earns a title.</p><div id="bcBody">${bcBody()}</div>
  <label>Date awarded</label><input id="bcDate" type="date" value="${todayKey()}" max="${todayKey()}">
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="beltSave">Claim</button></div>`);
}
function bcBody() {
  const { id, i, m } = ui.bc, d = beltDef(id), b = d.belts[i];
  return `<div class="belt-pick">${d.belts.map((x, k) => `<button class="${k === i ? 'on' : ''}" data-a="bcPick" data-id="${k}">${beltSvg(x, 0, 56)}<span>${esc(x.n)}</span></button>`).join('')}</div>
    ${b && b.m ? `<label>${b.ml === 'dan' ? 'Dan' : b.ml === 'kyu' ? 'Kyu' : b.ml === 'degree' ? 'Degree' : 'Stripes'}</label><select data-c="bcMark">${Array.from({ length: b.m + 1 }, (_, v) => `<option value="${v}" ${v === m ? 'selected' : ''}>${esc(markTxt(b, v) || (b.ml === 'degree' ? 'No degree yet' : 'No stripes'))}</option>`).join('')}</select>` : ''}
    <div class="row" style="margin-top:12px;gap:10px">${beltSvg(b, m, 110)}<b class="small">${esc(beltName(id, i, m))}</b></div>`;
}
function beltEditModal(id) {
  const d = beltDef(id);
  ui.be = { id, word: d ? d.word : 'Belt', rows: (d ? d.belts : [{ n: 'White', c: '#f2f0ea', m: 0, ml: 'stripe' }, { n: 'Black', c: '#161616', m: 0, ml: 'dan' }]).map(b => Object.assign({}, b)) };
  openModal(`<h3>${esc(SK[id].name)} · ${esc(ui.be.word.toLowerCase())} order</h3><p class="mu small">Match your school: rename, recolor, reorder, add or remove ${esc(ui.be.word.toLowerCase())}s. "Marks" are stripes, degrees, dan or kyu a ${esc(ui.be.word.toLowerCase())} can carry.</p><div id="beBody">${beBody()}</div>
  <div class="actions">${BELTS[id] ? `<button class="btn-g" data-a="beReset">Standard order</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="beSave">Save</button></div>`);
}
function beBody() {
  const R = ui.be.rows;
  return `<label>Called</label><select data-c="beWord"><option ${ui.be.word === 'Belt' ? 'selected' : ''}>Belt</option><option ${ui.be.word === 'Sash' ? 'selected' : ''}>Sash</option><option ${ui.be.word === 'Cord' ? 'selected' : ''}>Cord</option></select>
  <div class="be-rows">${R.map((b, i) => `<div class="be-row"><input type="color" value="${esc(b.c)}" data-i="be" data-id="${i}" data-k="c" aria-label="Color"><input value="${esc(b.n)}" data-i="be" data-id="${i}" data-k="n" placeholder="Name" maxlength="24">
    <input type="number" min="0" max="12" value="${b.m || 0}" data-i="be" data-id="${i}" data-k="m" aria-label="Marks" title="Marks">
    <select data-c="be" data-id="${i}" data-k="ml" aria-label="Mark type">${[['stripe', 'stripes'], ['degree', 'degrees'], ['dan', 'dan'], ['kyu', 'kyu']].map(([v, n]) => `<option value="${v}" ${(b.ml || 'stripe') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <span class="be-btns"><button class="btn-g x" data-a="beMove" data-id="${i}" data-v="-1" aria-label="Move up" ${i ? '' : 'disabled'}>↑</button><button class="btn-g x" data-a="beMove" data-id="${i}" data-v="1" aria-label="Move down" ${i < R.length - 1 ? '' : 'disabled'}>↓</button><button class="btn-g x" data-a="beDel" data-id="${i}" aria-label="Remove">✕</button></span></div>`).join('')}</div>
  <button class="btn-s" data-a="beAdd">+ Add ${esc(ui.be.word.toLowerCase())}</button>`;
}

function statsOf(id) { // a skill's hexagon sides; a Belt side is added when you set up belts for an art that has none built in
  const s = SK[id], st = s.stats || [], b = (S.belts || {})[id];
  if (st.some(x => x.t === 'belt') || !(b && b.ladder && b.ladder.length)) return st;
  const i = s.custom ? st.length : Math.max(0, st.length - 2); return st.slice(0, i).concat([{ k: 'belt', n: 'Belt', t: 'belt' }], st.slice(i));
}
function ownBox(id) { // set your own target, see progress toward a raise
  const c = SK[id], s = skState(id), own = s.own > 0, u = c.unit, mi = u === 'km' && imperial(), g = ownSug(id), need = ownNeed(id);
  const val = own ? s.own : skillTarget(id, todayKey()), shown = mi ? Math.round(val * 0.621371 * 10) / 10 : val;
  const word = u === 'km' ? (mi ? 'mi' : 'km') : u === 'sec' ? 'seconds' : u === 'ch' ? 'chapters' : UNIT[u] || u;
  return `<div class="own-box"><label>${own ? 'Your target' : 'Set your own target'}</label>
    <div class="row"><input id="ot_${id}" type="number" step="any" min="0" inputmode="decimal" value="${shown}" aria-label="Your target"><span class="mu small">${esc(word)}</span><button class="btn-s" data-a="ownSet" data-id="${id}">${own ? 'Change' : 'Set'}</button></div>
    <div class="mu2 small" style="margin-top:4px">${own ? `Yours: it won’t change by itself${c.phys ? ' (deload weeks take 25% off)' : ''}. After ${need} sessions at it, about two weeks, you’ll get a suggestion to raise it · <b class="num">${Math.min(s.hits || 0, need)}/${need}</b> so far.` : 'Automatic now: it grows about 8% a week when you finish and drops 6% when you miss. Set a number to take over.'}</div>
    ${g ? `<div class="banner up" style="margin-top:10px"><div class="row">${ICON.up}<b class="sp">Ready for more</b></div><div class="small" style="margin-top:4px">${esc(g.why)}.</div><div class="row" style="margin-top:8px;gap:8px"><button class="btn-s btn-p" data-a="ownRaise" data-id="${id}">Raise to ${esc(fmtTarget(g.to, u))}</button><button class="btn-s" data-a="ownLater" data-id="${id}">Not yet</button></div></div>` : ''}
    ${own ? `<button class="btn-g small" data-a="ownAuto" data-id="${id}" style="margin-top:6px">Back to automatic</button>` : ''}</div>`;
}
function skillCard(id) {
  const s = SK[id], st = skState(id), l = skLevel(id), open = ui.openSkill === id, stats = statsOf(id);
  const axes = stats.map(x => ({ n: x.n, v: statValue(id, x) }));
  let body = '';
  if (open) {
    body = `<div class="hex-wrap" style="margin-top:6px">${radar(axes, 230)}</div>` + beltBox(id);
    if (s.unit) body += `<div class="mu small">Next target <b class="num">${esc(fmtTarget(skillTarget(id, todayKey()), s.unit))}</b> · ${st.own > 0 ? 'your own target' : `difficulty ×${st.load.toFixed(2)}`} · ${(st.min / 60).toFixed(1)} h logged${histMin(id) ? ` + ${(histMin(id) / 60).toFixed(0)} h past` : ''}</div>` + ownBox(id);
    if (s.custom) body += `<div class="mu2 small" style="margin-top:4px">Each side grows with the hours you put into that part. ${s.scale || 100} h on one part = 50 (average).</div>`;
    body += stats.map(x => statEditor(id, x)).join('');
    if (s.unit) {
      body += `<hr><div class="small mu">${s.unit === 'min' ? 'Log practice time' : 'Log ' + unitLabel(s.unit).toLowerCase()}</div>
        ${s.custom ? `<div class="chips" id="pf_${id}" style="margin:8px 0">${s.stats.map(x => `<button class="chip" data-a="chipT" data-k="${esc(x.k)}">${esc(x.n)}</button>`).join('')}</div><div class="mu2 small" style="margin-bottom:8px">No parts picked = split evenly.</div>` : ''}
        <div class="row" style="margin-top:6px"><input id="pm_${id}" type="number" inputmode="${s.unit === 'km' ? 'decimal' : 'numeric'}" step="any" placeholder="${esc(unitLabel(s.unit))}" style="flex:1"><button class="btn-s" data-a="practice" data-id="${id}">Log</button></div>
        <div class="mu2 small" style="margin-top:4px">${s.unit === 'min' ? 'Up to 24 h per skill per day.' : `Counts toward today’s quest. Time and calories are estimated from the ${unitLabel(s.unit).toLowerCase()}.`}</div>
        <div class="hist"><div class="small mu">Past experience (before this app)</div><div class="mu2 small">Fills in the hexagon only. It never adds XP or levels.${s.custom ? ' Uses the parts picked above (none = split evenly).' : ''}</div>
        <div class="row" style="margin-top:6px"><input id="ph_${id}" type="number" inputmode="decimal" step="any" placeholder="Hours" style="flex:1"><button class="btn-s" data-a="hist" data-id="${id}">Add hours</button></div>
        ${histMin(id) ? `<div class="row small" style="margin-top:6px"><span class="sp mu">${(histMin(id) / 60).toLocaleString(undefined, { maximumFractionDigits: 1 })} h of past experience</span><button class="btn-g small" data-a="histClear" data-id="${id}">Clear</button></div>` : ''}</div>
        <div class="row wrap" style="margin-top:12px;gap:8px">${st.own > 0 ? '' : `<button class="btn-s" data-a="skLoad" data-id="${id}" data-v="0.85">Easier</button><button class="btn-s" data-a="skLoad" data-id="${id}" data-v="1.15">Harder</button>`}<span class="sp"></span>
        ${s.custom ? `<button class="btn-s" data-a="csEdit" data-id="${id}">Edit skill</button>` : `<button class="btn-g small bad" data-a="skHide" data-id="${id}">Delete</button>`}<button class="btn-s" data-a="skToggle" data-id="${id}">${st.active ? 'Remove from quests' : 'Add to quests'}</button></div>`;
    }
  }
  const bc = beltDef(id) && beltCur(id);
  return `<div class="card skill-card"><div class="row" data-a="skOpen" data-id="${id}" role="button"><div class="sp"><div>${esc(s.name)} <span class="mu small num">Lv ${l.L}</span>${s.custom ? ' <span class="pill">Custom</span>' : ''}${bc ? ' ' + beltSvg(beltDef(id).belts[bc.i], bc.m, 40) : ''}</div><div class="gold small sk-rank">${esc(skillRankLabel(id))}${(() => { const nx = nextSkRank(l.L); return ` <span class="mu2">· ${esc(nx.name)} at Lv ${nx.at}</span>`; })()}</div>
    <div class="bar" style="max-width:200px"><i style="width:${l.into / l.need * 100}%"></i></div></div><span class="chev ${open ? 'open' : ''}">${ICON.chev}</span></div>${body}</div>`;
}
function libSkills(fid) { // skills in a folder and everything under it
  return SKL.filter(s => isLib(s) && folderOf(s) === fid).concat(...subFolders(fid).map(f => libSkills(f.id)));
}
function libFolder(f, depth = 0) {
  const all = libSkills(f.id), user = /^u_/.test(f.id);
  if (!all.length && !user) return '';
  const own = SKL.filter(s => isLib(s) && folderOf(s) === f.id), on = all.filter(s => (S.skills[s.id] || {}).active).length;
  return `<details data-f="${f.id}" ${ui.libOpen.has(f.id) ? 'open' : ''}><summary><span class="sp">${user ? '<span class="fd-ic">' + ICON.folder + '</span>' : ''}${esc(f.name)}</span><span class="mu2 small num">${on}/${all.length}</span>${ICON.chev}</summary><div class="lib-body">
    ${subFolders(f.id).map(c => libFolder(c, depth + 1)).join('')}
    ${own.map(s => { const a = (S.skills[s.id] || {}).active;
      return `<div class="list-item"><span class="sp">${esc(s.name)}${s.custom ? ' <span class="pill">Custom</span>' : ''}</span><span class="mu2 small num">Lv ${skLevel(s.id).L} · ${esc(skillRank(s.id))}</span><button class="chip ${a ? 'on' : ''}" data-a="skToggle" data-id="${s.id}">${a ? 'Active' : 'Add'}</button><button class="btn-g x lib-del" data-a="${s.custom ? 'csDel' : 'skHide'}" data-id="${s.id}" aria-label="Delete ${esc(s.name)}">${ICON.trash}</button></div>`; }).join('')}
    <div class="lib-acts"><button class="btn-g small" data-a="csNew" data-f="${f.id}">+ Skill here</button><button class="btn-g small" data-a="fdNew" data-f="${f.id}">+ Folder here</button>${user ? `<span class="sp"></span><button class="btn-g small" data-a="fdEdit" data-id="${f.id}">Rename</button><button class="btn-g small bad" data-a="fdDel" data-id="${f.id}">Delete</button>` : ''}</div></div></details>`;
}
function meSkills() {
  const active = SKL.filter(s => isLib(s) && S.skills[s.id] && S.skills[s.id].active);
  return `<div class="row" style="margin-top:14px"><p class="mu small sp" style="margin:0">Skills you train and level, each with its own hexagon. Tap one to rate its stats or add past experience. The dashed ring is the average adult (50).</p></div>
  <div class="row" style="gap:8px;margin-top:10px"><button class="btn-p btn-s" data-a="csNew">+ New skill</button><button class="btn-s" data-a="fdNew">+ New folder</button></div>
  <h2>Active</h2>${skillCard('discipline')}${active.map(s => skillCard(s.id)).join('')}
  <h2>Library</h2><div class="card lib">${subFolders(null).map(f => libFolder(f)).join('')}</div>`;
}
function folderModal(f, parent) {
  openModal(`<h3>${f ? 'Rename folder' : 'New folder'}</h3><p class="mu small">Group skills your own way. A folder can sit at the top or inside another one (for example a new subfolder under Workout).</p>
  <label>Name</label><input id="fdName" value="${esc(f ? f.name : '')}" maxlength="32" placeholder="e.g. Seminary">
  <label>Inside</label><select id="fdParent"><option value="">Top level</option>${folderOptions(f ? f.parent : parent, { skip: f && f.id })}</select>
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="fdSave" data-id="${f ? f.id : ''}">${f ? 'Save' : 'Create'}</button></div>`);
}
function skillOptions(sel) { // <optgroup> per folder (Workout first), for "linked skill" pickers
  const out = [], walk = pid => subFolders(pid).forEach(f => { const l = SKL.filter(s => isLib(s) && folderOf(s) === f.id); if (l.length) out.push([folderPath(f.id), l]); walk(f.id); });
  walk(null); out.sort((a, b) => (b[0].startsWith('Workout') ? 1 : 0) - (a[0].startsWith('Workout') ? 1 : 0));
  return out.map(([n, l]) => `<optgroup label="${esc(n)}">${l.map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`).join('');
}
const histMin = id => { const s = skState(id); return (s.hist || 0) + Object.values(s.hsm || {}).reduce((a, v) => a + v, 0); };
function statEditor(id, x) {
  const st = skState(id);
  if (x.t === 'r') return `<label>${esc(x.n)}</label><select data-c="rate" data-id="${id}" data-k="${x.k}">${RATING_LABEL.slice(1).map((n, i) => `<option value="${i + 1}" ${(st.r[x.k] || 1) === i + 1 ? 'selected' : ''}>${i + 1} · ${n}</option>`).join('')}</select>`;
  if (x.t === 'cefr') return `<label>${esc(x.n)}</label><select data-c="cefr" data-id="${id}" data-k="${x.k}">${CEFR.map((n, i) => `<option value="${i}" ${(st.cefr[x.k] || 0) === i ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  if (x.t === 'scale') return `<label>${esc(x.n)}</label><select data-c="scale" data-id="${id}" data-k="${x.k}">${x.opts.map((n, i) => `<option value="${i}" ${(st.sc[x.k] || 0) === i ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  if (x.t === 'm') return `<div class="mu small" style="margin-top:8px">${esc(x.n)}: set in Body → Fitness tests</div>`;
  if (x.t === 'ch') return `<div class="row small" style="margin-top:6px"><span class="sp mu">${esc(x.n)}</span><span class="num">${((st.sm[x.k] || 0) / 60).toFixed(1)} h${st.hsm[x.k] ? ` <span class="mu2">+ ${(st.hsm[x.k] / 60).toFixed(1)} past</span>` : ''}</span></div>`;
  return '';
}
function csModal(c) {
  const st = c ? skState(c.id) : null;
  const stats = c ? c.stats : [];
  const n = Math.max(6, stats.length);
  openModal(`<h3>${c ? 'Edit skill' : 'Create a skill'}</h3><p class="mu small">Your own skill, with its own hexagon. Each stat is one part of the skill; its side grows with the hours you log on that part.</p>
  <form id="csForm" onsubmit="return false">
  <label>Name</label><input name="name" value="${esc(c ? c.name : '')}" placeholder="e.g. Game Programming">
  <label>Folder</label><select name="f" data-c="csFolder">${folderOptions(c ? folderOf(c) : (ui.csF || 'custom'))}<option value="__new">+ New folder…</option></select>
  <div id="csNewF" hidden><input name="fNew" placeholder="New folder name" maxlength="32" style="margin-top:6px"><label>Inside</label><select name="fNewP"><option value="">Top level</option>${folderOptions(null)}</select></div>
  <label>Title name for ranks</label><input name="role" value="${esc(c ? c.role || '' : '')}" placeholder="e.g. Game Designer (defaults to the skill name)">
  <div class="mu2 small" style="margin-top:4px">Ranks: Novice → Apprentice → Journeyman → Adept → Expert → Master → Grandmaster → Legendary I, II…</div>
  <div class="grid2"><div><label>Quest list</label><select name="list">${S.lists.map(l => `<option ${(c ? c.list : 'Craft') === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
  <div><label>Measured in</label><select name="unit">${CUSTOM_UNITS.map(([v, n]) => `<option value="${v}" ${(c ? c.unit : 'min') === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
  <div class="grid2"><div><label>Starting daily target</label><input name="base" type="number" step="any" value="${c ? c.base : 30}"></div><div><label>Maximum target</label><input name="max" type="number" step="any" value="${c ? c.max : 180}"></div></div>
  ${c ? '' : `<label>Your level now</label><select name="lvl"><option value="1">Beginner</option><option value="2">Intermediate</option><option value="3">Advanced</option></select>`}
  <label>Days</label><div class="chips days" id="csDays">${WD.map((w, i) => `<button type="button" class="chip ${(st ? st.days : [1, 2, 3, 4, 5]).includes(i) ? 'on' : ''}" data-a="chipT" data-k="${i}">${w}</button>`).join('')}</div>
  <label>Hexagon stats (3–8)</label><div id="csStats">${Array.from({ length: n }, (_, i) => `<input class="csStat" data-k="${esc(stats[i] ? stats[i].k : '')}" value="${esc(stats[i] ? stats[i].n : '')}" placeholder="Stat ${i + 1}${i < 3 ? ' (required)' : ''}" style="margin-bottom:6px">`).join('')}</div>
  <button type="button" class="btn-s" data-a="csAddStat">+ Add stat</button>
  <label>Hours on one part for an average score (50)</label><input name="scale" type="number" value="${c ? c.scale || 100 : 100}">
  <label class="check"><input type="checkbox" name="phys" ${c && c.phys ? 'checked' : ''}> Physical (counts as training, gets deload weeks)</label>
  <label>Calorie estimate uses</label><select name="act"><option value="">No calorie tracking</option>${ACTS.filter(a => !a.del).map(a => `<option value="${a.id}" ${c && c.act === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
  </form>
  <div class="actions">${c ? `<button class="btn-g bad" data-a="csDel" data-id="${c.id}">Delete</button><span class="sp"></span>` : ''}<button data-a="close">Cancel</button><button class="btn-p" data-a="csSave" data-id="${c ? c.id : ''}">${c ? 'Save' : 'Create'}</button></div>`);
}
function saveCustomSkill(id) {
  const f = new FormData($('#csForm')), name = (f.get('name') || '').trim();
  const stats = $$('.csStat').map(i => ({ k: i.dataset.k || 's' + uid().slice(0, 6), n: i.value.trim(), t: 'ch' })).filter(x => x.n);
  const base = num(f.get('base')), max = num(f.get('max')), days = chipsOn('#csDays').map(Number);
  if (!name) { toast('Name your skill'); return; }
  if (stats.length < 3 || stats.length > 8) { toast('Use 3 to 8 stats'); return; }
  if (!base || base <= 0) { toast('Set a starting target'); return; }
  const unit = f.get('unit');
  let fid = f.get('f') || 'custom';
  if (fid === '__new') { const fn = (f.get('fNew') || '').trim(); if (!fn) { toast('Name the new folder'); return; } fid = 'u_' + uid().slice(0, 8); S.folders.push({ id: fid, name: fn, parent: f.get('fNewP') || null }); }
  const def = { id: id || 'c_' + uid().slice(0, 8), name, f: fid, role: (f.get('role') || '').trim(), list: f.get('list'), unit, base, max: Math.max(base, max || base * 4), phys: !!f.get('phys'), act: f.get('act') || null, scale: Math.max(1, num(f.get('scale')) || 100), stats };
  const i = S.customSkills.findIndex(c => c.id === def.id);
  if (i >= 0) S.customSkills[i] = def; else S.customSkills.push(def);
  rebuildSK();
  const st = skState(def.id); st.days = days;
  if (i < 0) { st.active = true; st.load = [1, 1, 1.6, 2.3][+f.get('lvl') || 1]; ui.openSkill = def.id; }
  let p = folderById(fid); while (p) { ui.libOpen.add(p.id); p = p.parent ? folderById(p.parent) : null; }
  closeModal(true); regenToday(); afterChange(); toast(i >= 0 ? 'Skill updated' : 'Skill created', 'ti');
}
function meTitles() {
  const auto = autoTitles(), cats = Object.keys(TITLE_CATALOG);
  const locked = titleTracks().filter(t => t.next && !t.hidden), groups = [...new Set(locked.map(t => t.group))];
  const yN = yearsIn(), nextY = YEAR_BADGES.find(([n]) => n > yN), dLeft = nextY && S.profile.start ? daysBetween(todayKey(), addDays(addDur(S.profile.start, nextY[0], 'y'), 1)) : 0;
  const badges = `<h2>Years of commitment</h2><div class="card"><div class="yb-grid">${YEAR_BADGES.map(([n, nm]) => { const on = yN >= n; return `<div class="yb${on ? ' on' : ''}" title="${esc(on ? nm : n + (n > 1 ? ' years' : ' year'))}">${yearBadge(n, on)}<small>${on ? esc(nm) : n + (n > 1 ? ' yrs' : ' yr')}</small></div>`; }).join('')}</div>
    <div class="mu small" style="margin-top:8px">${yN ? `${yN} year${yN > 1 ? 's' : ''} in. ` : ''}${nextY ? `Next badge (${nextY[0]} year${nextY[0] > 1 ? 's' : ''}) in ${dLeft.toLocaleString()} day${dLeft === 1 ? '' : 's'}.` : 'Every badge earned. Legendary.'}</div></div>`;
  return `${badges}<h2>Earned · ${auto.length}</h2><div class="card">${auto.length ? auto.map(t => `<span class="title-badge auto" title="${esc(t.desc)}">${esc(t.name)}</span>`).join('') : '<div class="mu small">Titles unlock as you go. See what\'s next below.</div>'}</div>
  <h2>Next up</h2><div class="card next-up">${groups.map(g => `<div class="tg">${esc(g)}</div>` + locked.filter(t => t.group === g).map(t => {
    const pct = clamp(t.cur / t.next.at * 100, 0, 100), to = t.fmt(t.next.at), suf = (to.match(/\s[^\d\s][^\d]*$/) || [''])[0];
    let from = t.fmt(t.cur); if (suf && from.endsWith(suf)) from = from.slice(0, -suf.length);
    return `<div class="lk"><div class="row"><div class="sp"><div class="lk-n">${esc(t.next.name)}</div><div class="mu small">${esc(t.next.desc)}</div></div><span class="num small mu">${esc(from)} / ${esc(to)}</span></div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>${t.note ? `<div class="mu2 small" style="margin-top:4px">${esc(t.note)}</div>` : ''}</div>`;
  }).join('')).join('')}</div>
  <h2>Claimed</h2><div class="card">${S.titles.claimed.length ? S.titles.claimed.map(t => `<span class="title-badge">${esc(t.name)} <span class="mu2 small">${esc(t.cat)}</span><button class="btn-g x" style="padding:0 2px" data-a="tDel" data-id="${t.id}" aria-label="Remove">✕</button></span>`).join('') : '<div class="mu small">Claim degrees, jobs, places and milestones below.</div>'}</div>
  <div class="card"><h3>Claim a title</h3>
    <label>Category</label><select id="tCat" data-c="tCat">${cats.map(c => `<option>${c}</option>`).join('')}<option>Custom</option></select>
    <label>Title</label><div id="tPick">${titlePicker(cats[0])}</div>
    <label>Date</label><input id="tDate" type="date" value="${todayKey()}">
    <button class="btn-p btn-big" data-a="tClaim">Claim</button></div>`;
}
function titlePicker(cat) {
  if (cat === 'Custom') return `<input id="tName" placeholder="e.g. Ran the Chicago Marathon">`;
  const have = new Set(S.titles.claimed.map(t => t.name));
  return `<select id="tName">${TITLE_CATALOG[cat].filter(n => !have.has(n)).map(n => `<option>${esc(n)}</option>`).join('')}</select>`;
}
function meBooks() {
  const fin = S.books.filter(b => b.finished), pages = S.books.reduce((a, b) => a + (b.finished ? b.pages : b.read || 0), 0);
  const order = [...S.books].sort((a, b) => (a.finished - b.finished) || (a.added < b.added ? 1 : -1));
  return `<div class="grid3" style="margin-top:14px"><div class="stat"><b>${fin.length}</b><span>Finished</span></div><div class="stat"><b>${S.books.length - fin.length}</b><span>Reading</span></div><div class="stat"><b>${pages.toLocaleString()}</b><span>Pages read</span></div></div>
  <div class="card" style="margin-top:10px"><h3>Add a book</h3><label>Title</label><input id="bkT" placeholder="Book title"><label>Total pages</label><input id="bkP" type="number" inputmode="numeric"><button class="btn-p btn-big" data-a="bkAdd">Add</button></div>
  ${order.map(b => `<div class="card"><div class="row"><div class="sp"><div>${esc(b.title)}</div><div class="mu small num">${b.finished ? `Finished ${fmtDate(b.finishedOn)} · ${b.pages} pages` : `${b.read || 0} / ${b.pages} pages`}</div></div><button class="btn-g x" data-a="bkDel" data-id="${b.id}" aria-label="Remove">✕</button></div>
    ${b.finished ? '' : `<div class="bar"><i style="width:${Math.min(100, (b.read || 0) / b.pages * 100)}%"></i></div><div class="row" style="margin-top:10px"><input type="number" inputmode="numeric" placeholder="Current page" id="bkr_${b.id}" style="flex:1"><button class="btn-s" data-a="bkPage" data-id="${b.id}">Update</button><button class="btn-s btn-p" data-a="bkFin" data-id="${b.id}">Finished</button></div>`}</div>`).join('')}`;
}
function meSettings() {
  const p = S.profile, ft = Math.floor((p.heightCm || 0) / 2.54 / 12), inch = Math.round((p.heightCm || 0) / 2.54 - ft * 12), seg = ui.setSeg === 'look' ? 'look' : 'gen';
  const tabs = `<div class="seg set-seg">${[['gen', 'General'], ['look', 'Themes & display']].map(([v, n]) => `<button class="${seg === v ? 'on' : ''}" data-a="setSeg" data-id="${v}">${n}</button>`).join('')}</div>`;
  if (seg === 'look') return tabs + themeCard() + styleCard() + colorCard() + rankCard() + htCard() + szCard(); // v13: everything about the look in one tab (v17: + rank style)
  return `${tabs}<div class="card"><h3>Profile</h3><form id="setForm" onsubmit="return false">
    <label>Name</label><input name="name" value="${esc(p.name)}">
    <div class="grid2"><div><label>Sex</label><select name="sex"><option value="M" ${p.sex === 'M' ? 'selected' : ''}>Male</option><option value="F" ${p.sex === 'F' ? 'selected' : ''}>Female</option></select></div><div><label>Birth year</label><input name="birthYear" type="number" value="${p.birthYear}"></div></div>
    <div class="grid2"><div><label>Height (${imperial() ? 'total in' : 'cm'}, optional)</label><input name="height" type="number" value="${p.heightCm ? (imperial() ? Math.round(p.heightCm / 2.54) : p.heightCm) : ''}" placeholder="—"></div><div><label>Units</label><select name="units"><option value="imperial" ${imperial() ? 'selected' : ''}>Imperial</option><option value="metric" ${!imperial() ? 'selected' : ''}>Metric</option></select></div></div>
    <label class="check" style="margin-top:12px"><input type="checkbox" name="student" ${p.student ? 'checked' : ''}> I'm a student <span class="mu2 small">(${VAC_DAYS.student} vacation days a year instead of ${VAC_DAYS.adult})</span></label>
    <div class="grid2"><div><label>Wake (day reset)</label><input name="wake" type="time" value="${p.wake}"></div><div><label>Sleep deadline</label><input name="sleep" type="time" value="${p.sleep}"></div></div>
    <label>Diet goal</label><div class="row dg-sum"><div class="sp small">${esc(dietSummary())}</div><button type="button" class="btn-s" data-a="dietGoal">Edit</button></div>
    <button class="btn-p btn-big" data-a="setSave">Save profile</button></form>
    <div class="mu2 small" style="margin-top:8px">${p.heightCm ? `${ft}′${inch}″ · ` : ''}started ${p.start ? fmtDate(p.start) : '—'}</div></div>
  <button class="card set-link" data-a="setSeg" data-id="look"><span class="sp"><b>Themes &amp; display</b><small class="mu">Background, UI style, colors, Home text, season names</small></span>${ICON.chev}</button>
  <div class="card" id="fxCard"><h3>Feedback</h3><p class="mu small" style="margin-top:2px">What happens when you check something off.</p>
    <label class="check"><input type="checkbox" data-c="fx" data-k="sound" ${fxOpts().sound ? 'checked' : ''}> Checkmark sound</label>
    <label class="check"><input type="checkbox" data-c="fx" data-k="haptic" ${fxOpts().haptic ? 'checked' : ''}> Vibration${navigator.vibrate ? '' : ' <span class="mu2 small">(not supported on this device)</span>'}</label>
    <label class="check"><input type="checkbox" data-c="fx" data-k="cele" ${fxOpts().cele ? 'checked' : ''}> Fireworks for streak milestones</label>
    <button class="btn-s" data-a="fxTest" style="margin-top:12px">Try it</button></div>
  ${deletedCard()}
  <div class="card" id="penCard"><h3>Penalties</h3><p class="mu small" style="margin-top:2px">What a missed day costs. ${esc(penRulesTxt())}</p>
    <div class="row" style="margin-top:8px"><button class="btn-s btn-p" data-a="penEdit">Edit penalties</button><span class="sp"></span>${S.pen ? '<span class="pill">Your own</span>' : '<span class="mu2 small">Default rules</span>'}</div></div>
  <div class="card"><h3>Quest lists</h3><div class="chips" style="margin:8px 0">${S.lists.map(l => `<span class="chip">${esc(l)}</span>`).join('')}</div>
    <div class="row"><input id="newList" placeholder="New list name"><button class="btn-s" data-a="listAdd">Add</button></div></div>
  <div class="card"><h3>Backup</h3><p class="mu small" style="margin-top:2px">Your data lives only on this phone. ${S.lastBackup ? 'Last backup: <b>' + fmtDate(S.lastBackup) + '</b>' : '<b>No backup yet.</b>'}</p>
    <p class="mu2 small">Back up now asks before it does anything: upload to Google Drive (pick Drive in the share list), or save the file to this phone. To restore, tap Restore and pick the file from Drive, iCloud or Downloads.</p>
    <div class="row wrap" style="gap:8px"><button class="btn-p" data-a="backup">${ICON.cloud} Back up now</button><button data-a="export">Download</button><button data-a="importOpen">Restore</button><input type="file" id="importFile" accept="application/json,.json,text/plain,.txt" hidden></div></div>
  <div class="card"><h3>About</h3><p class="mu small">Food: USDA National Nutrient Database for Standard Reference, Release 28 (public domain). Exercise burn: MET values from the Adult Compendium of Physical Activities. Population norms are rough approximations for motivation, not a medical assessment.</p>
    <button class="btn-g bad" data-a="reset">Erase all data</button></div>`;
}

function deletedCard() { // built-in skills and tasks the user deleted (hidden, progress kept)
  const sk = (S.hideSk || []).filter(id => SK[id]), tk = (S.hideTk || []).filter(id => S.tasks[id] || TASK_DEF[id]);
  if (!sk.length && !tk.length) return '';
  const row = (n, sub, k, id) => `<div class="list-item"><div class="sp"><div>${esc(n)}</div><div class="mu small">${esc(sub)}</div></div><button class="chip" data-a="unhide" data-k="${k}" data-id="${id}">Restore</button></div>`;
  return `<div class="card"><h3>Deleted defaults</h3><p class="mu small" style="margin-top:2px">Built-in skills and tasks you deleted. Their XP and titles were kept. Restoring puts them back in the library, not on your quests.</p>
    ${sk.map(id => row(SK[id].name, 'Skill · ' + folderPath(folderOf(SK[id])), 'hideSk', id)).join('')}${tk.map(id => row((S.tasks[id] || TASK_DEF[id]).name, 'Task', 'hideTk', id)).join('')}</div>`;
}

/* ---------- backups ---------- */
const backupName = () => `deificatio-backup-${todayKey()}`;
function markBackup(msg) { S.lastBackup = todayKey(); S.backupSnooze = null; save(); render(); toast(msg, 'ti'); }
const backupText = () => JSON.stringify(custPhoto.data ? Object.assign({}, S, { _bgPhoto: custPhoto.data }) : S);
function downloadBackup() {
  const blob = new Blob([backupText()], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = backupName() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); markBackup('Backup downloaded');
}
/* v11: "Back up now" asks first (Upload to Google Drive / Save to this phone) and never downloads on its own.
   Android Chrome says it can share a .json file and then refuses it (the old code fell back to a silent download),
   so Android always shares the .txt copy; Restore reads both. */
const isAndroid = () => /Android/i.test(navigator.userAgent || '');
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function backupModal(state) {
  const share = !!(navigator.share && navigator.canShare), ios = isIOS();
  const msg = state === 'fail' ? '<p class="bad small">The share list didn’t open. Try again, or save the file to this phone and upload it from the Google Drive app (+ → Upload).</p>'
    : !share ? '<p class="mu small">This browser can’t send files to other apps. Save the file to this phone, then open the Google Drive app, tap + → Upload and pick it from Downloads.</p>'
    : `<p class="mu small">Your progress lives only on this phone. Upload a copy to Google Drive so you can restore it on any phone.</p>
      <ol class="bk-steps mu small"><li>Tap <b>Upload to Google Drive</b>.</li><li>Pick <b>Drive</b> in the list that opens${ios ? ' (or <b>Save to Files</b> → iCloud Drive)' : ''}.</li><li>Tap <b>Upload</b>${ios ? ' or <b>Save</b>' : ''}.</li></ol>`;
  openModal(`<h3>Back up to Google Drive?</h3>${msg}
    <div class="bk-btns">${share ? `<button class="btn-p" data-a="bkShare">${ICON.cloud} ${state === 'fail' ? 'Try again' : 'Upload to Google Drive'}</button>` : ''}<button data-a="bkDown"${share ? '' : ' class="btn-p"'}>Save to this phone${share ? ' instead' : ''}</button><button class="btn-g" data-a="close">Not now</button></div>`);
}
function shareBackup() {
  const data = backupText(), txt = new File([data], backupName() + '.txt', { type: 'text/plain' });
  const opts = isAndroid() || ui.bkTxt ? [txt] : [new File([data], backupName() + '.json', { type: 'application/json' }), txt];
  const file = navigator.share && navigator.canShare ? opts.find(f => { try { return navigator.canShare({ files: [f] }); } catch (e) { return false; } }) : null;
  if (!file) { backupModal('noshare'); return; }
  navigator.share({ files: [file], title: 'Deificatio backup' }).then(() => { closeModal(true); markBackup('Backup saved'); })
    .catch(e => { if (e && e.name === 'AbortError') return; // closed the share list: the question stays open
      ui.bkTxt = true; backupModal('fail'); }); // next try sends the .txt copy (accepted everywhere)
}
function backupNag(k) {
  const last = S.lastBackup || S.profile.start; if (!last || S.backupSnooze === k) return '';
  const days = daysBetween(last, k); if (days < 7) return '';
  return `<div class="banner bk"><div class="row">${ICON.cloud}<b class="sp">${S.lastBackup ? `Last backup ${days} days ago` : 'No backup yet'}</b></div>
    <div class="small" style="margin-top:4px">Your progress lives only on this phone. Save a copy to Google Drive, or to Files → iCloud Drive on iPhone.</div>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn-s btn-p" data-a="backup">Back up now</button><button class="btn-s" data-a="backupLater">Remind me tomorrow</button></div></div>`;
}

/* ---------- actions ---------- */
const A = {
  seasonList: () => seasonListModal(),
  seasonPick: el => { ui.previewHu = +el.dataset.id; closeModal(true); ui.tab = 'today'; render(); window.scrollTo(0, 0); },
  seasonReset: () => { ui.previewHu = null; render(); },
  tab: el => { ui.tab = el.dataset.id; render(); window.scrollTo(0, 0); },
  tq: el => toggleQuest(el.dataset.id),
  tqMinus: el => { const d = S.days[todayKey()], q = d && d.q.find(x => x.key === el.dataset.id); if (q) stepTask(q, -1); },
  goBoard: el => { ui.tab = 'board'; ui.boardSeg = el.dataset.id || 'tasks'; render(); window.scrollTo(0, 0); },
  boardSeg: el => { ui.boardSeg = el.dataset.id; render(); },
  wallpaper: () => saveWallpaper(),
  fxTest: () => { fx('check'); setTimeout(() => celebrate('7-day streak', 'This is what a milestone looks like. Keep the fire going.', { big: '7' }), 300); },
  // task quests
  tkOpen: el => { ui.openTask = ui.openTask === el.dataset.id ? null : el.dataset.id; render(); },
  tkNew: () => taskModal(null, null),
  tkAdopt: el => taskModal(null, TASK_DEF[el.dataset.id]),
  tkEdit: el => taskModal(S.tasks[el.dataset.id], null),
  tkSave: el => saveTask(el.dataset.id, el.dataset.d),
  tkToggle: el => { const t = S.tasks[el.dataset.id]; if (!t) return; if (t.active && lockRefuse('task', t.id, 'take it off your quests')) return; t.active = !t.active; regenToday(); afterChange(); toast(t.active ? t.name + ' is back on your quests' : t.name + ' removed from quests (progress kept)'); },
  tkHide: el => {
    const id = el.dataset.id, t = S.tasks[id], nm = (t || TASK_DEF[id] || {}).name || 'this task'; if (lockRefuse('task', id, 'delete it')) return;
    if (!confirm(`Delete "${nm}"? Its level and achievements are kept, and you can restore it in Profile → Settings → Deleted defaults.`)) return;
    if (!S.hideTk.includes(id)) S.hideTk.push(id); if (t) t.active = false; closeModal(true); ui.openTask = null; regenToday(); afterChange(); toast(nm + ' deleted · restore it in Settings');
  },
  tkDel: el => { if (lockRefuse('task', el.dataset.id, 'delete it')) return; if (!confirm('Delete this task? Its level and achievements go with it.')) return; delete S.tasks[el.dataset.id]; S.pauses.forEach(p => { if (p.tasks) p.tasks = p.tasks.filter(x => x !== el.dataset.id); }); closeModal(true); ui.openTask = null; regenToday(); afterChange(); },
  tkDay: el => { const t = S.tasks[el.dataset.id], d = +el.dataset.d; if (!t) return; if (t.days.includes(d) && lockedDays('task', t.id).includes(d)) { lockRefuse('task', t.id, 'remove a locked day'); return; } t.days = t.days.includes(d) ? t.days.filter(x => x !== d) : [...t.days, d].sort(); regenToday(); afterChange(); },
  // side quests
  sideNew: el => sideModal(null, el.dataset.id),
  sideIdea: el => sideModal(null, el.dataset.id, SIDE_TEMPLATES[el.dataset.id][+el.dataset.k]),
  sideOpen: el => { const q = S.side.find(x => x.id === el.dataset.id); if (!q) return; if (ui.tab !== 'board') { ui.tab = 'board'; ui.boardSeg = q.type; ui.sideOpen = q.id; render(); window.scrollTo(0, 0); return; } ui.sideOpen = ui.sideOpen === q.id ? null : q.id; render(); },
  sideEdit: el => { const q = S.side.find(x => x.id === el.dataset.id); if (q) sideModal(q, q.type); },
  sideDone: el => { const q = S.side.find(x => x.id === el.dataset.id); if (!q || q.status !== 'active') return; if (!confirm(`Complete "${q.title}"?`)) return; completeSide(q); },
  sideGive: el => {
    const q = S.side.find(x => x.id === el.dataset.id); if (!q) return; const tk = todayKey(), fail = sideCounts(q) && q.start <= tk && sideFutureDue(q, tk);
    if (!confirm(fail ? 'Give up on this quest? It counts toward your day, so giving up counts as failing it: today won’t be complete, and you’ll get penalty exercises tomorrow.' : 'Give up on this quest? There’s no penalty.')) return;
    q.status = 'given'; q.doneOn = tk; if (fail) q.failed = true; afterChange();
  },
  sideDel: el => { if (!confirm('Delete this quest from your history?')) return; S.side = S.side.filter(x => x.id !== el.dataset.id); afterChange(); },
  sideLog: el => {
    const q = S.side.find(x => x.id === el.dataset.id), k = todayKey(); if (!q || q.status !== 'active') return;
    let m = Math.round(num($('#sl_' + q.id).value) || 0); if (m <= 0) { toast('Enter minutes'); return; }
    m = capMin('side:' + q.id, k, m); if (!m) return;
    q.log.push({ date: k, min: m }); const xp = Math.round(m / 6); q.xpGot = (q.xpGot || 0) + xp; addXp(null, xp); fx('tick');
    if (sideMin(q) >= q.goalMin) { completeSide(q); return; }
    afterChange(); toast(`Logged ${m} min · ${(sideMin(q) / 60).toFixed(1)} of ${(q.goalMin / 60).toFixed(0)} h`);
  },
  cpTog: el => { const q = S.side.find(x => x.id === el.dataset.id), c = q && q.cps.find(x => x.id === el.dataset.c); if (c) cpToggle(q, c); },
  sdSet: el => { const k = el.dataset.k; ui.sd[k] = k === 'diff' ? +el.dataset.id : el.dataset.id; if (k === 'track' && ui.sd.track === 'cp' && !ui.sd.cps.length) ui.sd.cps.push({ id: uid(), t: '', day: null, done: null }); $('#sdBody').innerHTML = sdBody(); },
  sdRw: el => { ui.sd.reward.kind = el.dataset.id; $('#sdBody').innerHTML = sdBody(); },
  sdCpAdd: () => { if (ui.sd.cps.length >= 30) { toast('30 checkpoints max'); return; } ui.sd.cps.push({ id: uid(), t: '', day: null, done: null }); $('#sdBody').innerHTML = sdBody(); const ins = $$('#sdBody [data-i=sdCp][data-k=t]'); if (ins.length) ins[ins.length - 1].focus(); },
  sdCpDel: el => { ui.sd.cps.splice(+el.dataset.id, 1); $('#sdBody').innerHTML = sdBody(); },
  sdScope: el => { const r = ui.sd.reward, g = el.dataset.g, k = el.dataset.k; r[g] = r[g].includes(k) ? r[g].filter(x => x !== k) : [...r[g], k]; el.classList.toggle('on'); },
  sdSave: () => saveSide(),
  // rewards
  rwUse: el => { const r = S.rewards.find(x => x.id === el.dataset.id); if (r) passModal(r); },
  rwDone: el => { const r = S.rewards.find(x => x.id === el.dataset.id); if (!r) return; r.used = todayKey(); afterChange(); toast('Enjoy it. You earned it.', 'lv'); },
  psGo: el => { const r = S.rewards.find(x => x.id === el.dataset.id); if (r) usePass(r, $('#psStart').value); },
  // historic experience (hexagon only)
  hist: el => {
    const id = el.dataset.id, c = SK[id], s = skState(id), h = num($('#ph_' + id).value);
    if (!h || h <= 0) { toast('Enter hours'); return; }
    if (h > 50000) { toast('That looks too high', 'bad'); return; }
    if (h >= 2000 && !confirm(`Add ${h.toLocaleString()} hours of past experience?`)) return;
    const m = h * 60;
    if (c.custom) { const ks = chipsOn('#pf_' + id), parts = ks.length ? ks : c.stats.map(x => x.k); parts.forEach(k => { s.hsm[k] = (s.hsm[k] || 0) + m / parts.length; }); }
    else s.hist = (s.hist || 0) + m;
    afterChange(); toast(`Added ${h.toLocaleString()} h of past experience to the hexagon`);
  },
  histClear: el => { if (!confirm('Clear past experience for this skill?')) return; const s = skState(el.dataset.id); s.hist = 0; s.hsm = {}; afterChange(); },
  regen: () => { regenToday(); afterChange(); toast('Quests refreshed'); },
  close: () => closeModal(true),
  penEdit: () => penModal(),
  peSave: () => peSave(),
  peReset: () => { ui.pe = PEN_DEF(); peRefresh(); toast('Defaults loaded · Save to keep them'); },
  peAddTier: () => { const P = ui.pe, N = P.tiers.length;
    if (N >= 12) return toast('That’s plenty of tiers');
    if (N === 1) { P.tiers.push({ name: 'Tier II', below: 50 }); P.items.forEach(it => { it.amts.push(it.amts[0] > 0 ? peRound(it.amts[0] * 2) : null); }); }
    else { const below = Math.round((P.tiers[N - 2].below + P.tiers[N - 1].below) / 2); P.tiers.splice(N - 1, 0, { name: 'Tier ' + (ROMAN[N - 1] || N), below });
      P.items.forEach(it => { const a = it.amts[N - 2], b = it.amts[N - 1]; it.amts.splice(N - 1, 0, a > 0 && b > 0 ? peRound((a + b) / 2) : null); }); }
    peRenumber(P); peRefresh(); },
  peAddItem: () => { const P = ui.pe, N = P.tiers.length, it = { id: uid(), name: '', unit: 'reps', grow: true, amts: Array(N).fill(null) }; it.amts[0] = 10; it.amts[N - 1] = N > 1 ? 50 : 10; peFill(it, N); P.items.push(it); peRefresh(); },
  peAddFixed: () => { ui.pe.fixed.push({ id: uid(), text: '', amt: null, sym: '$', at: 0, how: 'quest' }); peRefresh(); },
  peDel: el => { const P = ui.pe, i = +el.dataset.n, g = el.dataset.g;
    if (g === 'tier') { if (!i) return; P.tiers.splice(i, 1); P.items.forEach(it => { it.amts.splice(i, 1); if (!it.amts.some(a => a > 0)) it.amts[it.amts.length - 1] = 10; }); peRenumber(P); }
    else if (g === 'item') P.items.splice(i, 1); else P.fixed.splice(i, 1);
    peRefresh(); },
  peHow: el => { ui.pe.fixed[+el.dataset.n].how = el.dataset.id; peRefresh(); },
  chipT: el => el.classList.toggle('on'),
  focusDone: el => { const keys = chipsOn('#focusChips'); closeModal(true); toggleQuest(el.dataset.id, keys); },
  donated: () => {
    if (!$('#donchk').checked) { toast('Tick the box first'); return; }
    const paid = S.stats.paid = S.stats.paid || {}; owedFix().forEach(o => { if (o.amt > 0) paid[o.sym || ''] = (paid[o.sym || ''] || 0) + o.amt; });
    S.stats.donated += S.owed.length; S.owed = []; closeModal(true); afterChange();
  },
  finishSetup: () => finishSetup(),
  calSel: el => { ui.calSel = el.dataset.id; render(); dayPreview(el.dataset.id); },
  dpRest: el => { A.restToggle(el); const b = $('#dpBody'); if (b) b.innerHTML = dayPreviewHtml(el.dataset.id); },
  calNav: el => { const [y, m] = ui.calMonth.split('-').map(Number); const d = new Date(y, m - 1 + (+el.dataset.id), 1); ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  evNew: () => eventModal(null),
  evEdit: el => eventModal(S.events.find(e => e.id === el.dataset.id)),
  evSave: el => saveEvent(el.dataset.id),
  evDel: el => { if (lockRefuse('event', el.dataset.id, 'delete it')) return; if (!confirm('Delete this event (all repeats)?')) return; S.events = S.events.filter(e => e.id !== el.dataset.id); closeModal(true); regenToday(); afterChange(); },
  restToggle: el => { const k = el.dataset.id; S.rest = S.rest.includes(k) ? S.rest.filter(x => x !== k) : [...S.rest, k]; if (k === todayKey()) regenToday(); afterChange(); },
  skDay: el => { const s = skState(el.dataset.id), d = +el.dataset.d; if (s.days.includes(d) && lockedDays('skill', el.dataset.id).includes(d)) { lockRefuse('skill', el.dataset.id, 'remove a locked day'); return; } s.days = s.days.includes(d) ? s.days.filter(x => x !== d) : [...s.days, d].sort(); regenToday(); afterChange(); },
  vacNew: () => vacModal(),
  vacSave: () => {
    const tk = todayKey(), start = $('#vStart').value, end = $('#vEnd').value, all = $('#vAll').checked;
    const lists = chipsOn('#vLists'), skills = $('#vSkills') ? chipsOn('#vSkills') : [], tasks = $('#vTasks') ? chipsOn('#vTasks') : [];
    if (!start || !end) { toast('Pick both dates'); return; }
    if (start < tk) { toast("Pauses can't start in the past"); return; }
    if (end < start) { toast('Last day is before first day'); return; }
    if (!all && !lists.length && !skills.length && !tasks.length) { toast('Pick what to pause'); return; }
    // v16: vacation days are limited per year; extra days cost coins
    const need = vacNeed(start, end), extra = need.reduce((a, x) => a + x.extra, 0), cost = extra * VAC_EXTRA_COST;
    if (extra) {
      if ((S.coins || 0) < cost) { toast(`That's ${extra} day${extra > 1 ? 's' : ''} past your vacation allowance: ${cost} coins, you have ${S.coins || 0}`, 'bad'); return; }
      if (!confirm(`${need.map(x => `${x.y}: ${x.used + x.n} of ${x.allow} days`).join(', ')}. Buy ${extra} extra day${extra > 1 ? 's' : ''} for ${cost} coins?`)) return;
      S.coins -= cost; S.vacBought = S.vacBought || {}; need.forEach(x => { if (x.extra) S.vacBought[x.y] = (S.vacBought[x.y] || 0) + x.extra; });
    }
    S.pauses.push({ id: uid(), type: 'vacation', start, end, all, lists: all ? [] : lists, skills: all ? [] : skills, tasks: all ? [] : tasks, note: $('#vNote').value.trim() });
    closeModal(true); if (start === tk) regenToday(); afterChange(); toast('Vacation pause scheduled');
  },
  emNew: () => emModal(),
  emDur: el => { ui.emDur = +el.dataset.id; $$('#emDur .chip').forEach(b => b.classList.toggle('on', b === el)); },
  emStart: () => {
    const k = todayKey(), d = ensureDay(k);
    if (emUsed(k.slice(0, 4)) >= EM_PER_YEAR) { toast(`All ${EM_PER_YEAR} emergencies for this year are used`, 'bad'); return; }
    if (d.q.some(q => q.pen && !q.done)) { S.pendingPen = { tier: Math.max(d.penTier || (d.q.some(q => q.pen && !q.done && /^pen:/.test(q.key)) ? 1 : 0), (S.pendingPen || {}).tier || 0), fixed: [...new Set([...(d.penFixed || []), ...((S.pendingPen || {}).fixed || [])])] }; delete d.penTier; delete d.penFixed; }
    S.pauses.push({ id: uid(), type: 'emergency', all: true, start: k, end: ui.emDur ? addDays(k, ui.emDur - 1) : '', note: $('#emNote').value.trim() });
    closeModal(true); regenToday(); afterChange(); toast('All quests paused');
  },
  pEnd: el => { const p = S.pauses.find(x => x.id === el.dataset.id); if (!p) return; p.end = todayKey(); afterChange(); toast('Quests resume tomorrow'); },
  pCancel: el => { if (!confirm('Cancel this pause?')) return; const r = (S.rewards || []).find(x => x.pauseId === el.dataset.id); if (r) { r.used = null; r.pauseId = null; } S.pauses = S.pauses.filter(x => x.id !== el.dataset.id); regenToday(); ensureToday(); afterChange(); if (r) toast('Rest pass returned to your rewards'); },
  logSeg: el => { ui.logSeg = el.dataset.id; render(); },
  int: el => { ui.intensity = +el.dataset.id; $$('[data-a=int]').forEach(b => b.classList.toggle('on', b === el)); updateWkcal(); },
  wLog: () => logWorkout(),
  wDel: el => {
    const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return;
    S.workouts = S.workouts.filter(x => x !== w);
    if (w.skill && SK[w.skill]) { const s = skState(w.skill); s.min = Math.max(0, s.min - w.min); uncapMin(w.skill, w.date, w.min); const q = (S.days[w.date] || { q: [] }).q.find(x => x.skill === w.skill && !x.done); if (q) q.progress = Math.max(0, (q.progress || 0) - (w.fill != null ? w.fill : q.unit === 'km' ? (w.dist || 0) : w.min)); }
    addXp(w.skill, -(w.xp || 0), true); afterChange();
  },
  foodPick: el => foodModal(ui.foodRes[+el.dataset.id]),
  foodAdd: () => { const f = ui.foodPick, g = num($('#fg').value); if (!g || g <= 0) { toast('Enter grams'); return; } const r = g / 100; S.food.push({ id: uid(), date: todayKey(), name: f.n, g, kcal: f.k * r, p: f.p * r, c: f.c * r, f: f.f * r }); closeModal(true); afterChange(); toast(`Added ${Math.round(f.k * r)} kcal`); },
  fDel: el => { S.food = S.food.filter(f => f.id !== el.dataset.id); afterChange(); },
  customFood: () => openModal(`<h3>Custom food</h3><p class="mu small">Values per 100 g (check the label).</p><label>Name</label><input id="cfN"><div class="grid2"><div><label>kcal</label><input id="cfK" type="number" step="any"></div><div><label>Protein g</label><input id="cfP" type="number" step="any"></div><div><label>Carbs g</label><input id="cfC" type="number" step="any"></div><div><label>Fat g</label><input id="cfF" type="number" step="any"></div></div>
    <label>Usual portion in grams (optional)</label><input id="cfG" type="number" step="any" inputmode="decimal" placeholder="Fill in to also add it to Favorite meals"><div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="cfSave">Save</button></div>`),
  cfSave: () => {
    const n = $('#cfN').value.trim(), k = num($('#cfK').value), g = num($('#cfG').value); if (!n || k == null) { toast('Name and kcal needed'); return; }
    const cf = { name: n, kcal: k, p: num($('#cfP').value) || 0, c: num($('#cfC').value) || 0, f: num($('#cfF').value) || 0 }; S.customFoods.push(cf);
    const fav = g && g > 0 ? saveFav(n, [{ n, g, k: cf.kcal, p: cf.p, c: cf.c, f: cf.f }]) : null;
    closeModal(true); afterChange(); toast(fav ? 'Custom food saved · added to Favorite meals' : 'Custom food saved');
  },
  foodFav: el => {
    const f = ui.foodPick, g = num($('#fg').value); if (!g || g <= 0) { toast('Enter grams'); return; }
    if (saveFav(f.n, [{ n: f.n, g, k: f.k, p: f.p, c: f.c, f: f.f }])) { save(); el.textContent = '★ Saved'; el.disabled = true; toast('Saved to Favorite meals', 'ti'); }
  },
  fFav: el => {
    const e = S.food.find(x => x.id === el.dataset.id); if (!e) return;
    if (isFavEntry(e)) { toast('Already in Favorite meals'); return; }
    const items = e.items ? e.items : [per100(e.name, e.g, e.kcal, e.p, e.c, e.f)];
    if (saveFav(e.name, items)) { afterChange(); toast('Saved to Favorite meals', 'ti'); }
  },
  favNew: () => favModal(null),
  favOpen: el => { const fv = S.favs.find(x => x.id === el.dataset.id); if (fv) favModal(fv); },
  favLog: el => { const fv = S.favs.find(x => x.id === el.dataset.id); if (!fv) return; const e = logItems(fv.name, fv.items, fv.id); afterChange(); toast(`Logged ${fv.name} · ${fmtK(e.kcal)} kcal`); },
  favAll: () => { ui.favAll = !ui.favAll; render(); },
  fvDel: el => { ui.fv.items.splice(+el.dataset.id, 1); $('#fvBody').innerHTML = fvBody(); },
  fvPick: el => { const f = ui.fvRes[+el.dataset.id]; if (!f) return; ui.fv.items.push({ n: f.n, g: 100, k: f.k, p: f.p, c: f.c, f: f.f }); ui.fvRes = []; $('#fvBody').innerHTML = fvBody(); const gs = $$('#fvBody [data-i=fvG]'); if (gs.length) { gs[gs.length - 1].focus(); gs[gs.length - 1].select(); } },
  fvSave: () => {
    if (!fvValid()) return; const d = ui.fv, name = (d.name || '').trim() || (d.items.length === 1 ? d.items[0].n : '');
    if (!name) { toast('Give the meal a name'); $('#fvName').focus(); return; }
    const items = d.items.map(i => ({ n: i.n, g: r1(i.g), k: r1(i.k), p: r1(i.p), c: r1(i.c), f: r1(i.f) }));
    if (d.id) { const fv = S.favs.find(x => x.id === d.id); if (fv) { fv.name = name; fv.items = items; } }
    else if (!saveFav(name, items)) return;
    closeModal(true); afterChange(); toast(d.id ? 'Favorite updated' : 'Saved to Favorite meals', 'ti');
  },
  fvLog: () => { if (!fvValid()) return; const d = ui.fv, name = (d.name || '').trim() || 'Meal'; const e = logItems(name, d.items, d.id); closeModal(true); afterChange(); toast(`Logged ${d.items.length > 1 ? name : d.items[0].n} · ${fmtK(e.kcal)} kcal`); },
  fvRemove: () => { if (!confirm('Delete this favorite? Past log entries stay.')) return; S.favs = S.favs.filter(x => x.id !== ui.fv.id); closeModal(true); afterChange(); },
  dietGoal: () => dietModal(),
  dgGoal: el => { ui.dg.goal = el.dataset.id; refreshDietUi(); },
  dgOwn: el => { ui.dg.own = el.dataset.id === '1'; if (ui.dg.own && !ui.dg.maint) ui.dg.maint = estMaint(); refreshDietUi(); },
  dgRule: el => { ui.dg.rule = el.dataset.id; refreshDietUi(); },
  dgSave: () => saveDiet(),
  fastNew: () => fastModal(),
  fsLen: el => { const n = +el.dataset.id; $('#fsLen').value = n; fsRead(); $$('#fsChips .chip').forEach(b => b.classList.toggle('on', b === el)); $('#fsEnd').innerHTML = fsEndTxt(); },
  fsBack: () => dietModal(true),
  fsSave: () => saveFast(),
  fastEnd: el => { const f = S.fasts.find(x => x.id === el.dataset.id); if (!f) return; f.end = todayKey(); afterChange(); refreshDietUi(); toast('Last day of the fast · diet quest returns tomorrow'); },
  fastCancel: el => { if (!confirm('Cancel this fast?')) return; const tk = todayKey(); S.fasts = S.fasts.filter(x => x.id !== el.dataset.id); regenToday(); ensureToday(); afterChange(); refreshDietUi(); toast('Fast cancelled'); },
  fastFood: () => { ui.fastFood = !ui.fastFood; render(); },
  szLevel: el => { szSet(o => { o.level = el.dataset.id; }); szRefresh(); },
  szMain: el => { szSet(o => { o.main = el.dataset.id; }); szRefresh(); },
  szReset: () => { S[SZC().key] = null; save(); szRefresh(); toast('Season display reset'); },
  themePick: el => {
    const id = el.dataset.id, t = THEME_LIST.find(x => x[0] === id); if (!t) return;
    if (t[3]) { toast('That theme is waiting on its art. Coming soon.'); return; }
    S.theme = Object.assign({}, S.theme || {}, { id }); save();
    const go = () => { ui.season = applySeason(); themeRefresh(); };
    if (id === 'custom' && custOpts().mode === 'photo' && !custPhoto.url) loadCustomPhoto().then(go); else go();
  },
  custMode: el => { custSet(o => { o.mode = el.dataset.id; }); const go = () => { ui.season = applySeason(); themeRefresh(); }; if (el.dataset.id === 'photo' && !custPhoto.url) loadCustomPhoto().then(go); else go(); },
  custCards: el => { custSet(o => { o.cards = el.dataset.id; }); ui.season = applySeason(); themeRefresh(); },
  htMode: el => { htSet(o => { o.mode = el.dataset.id; o.extra[o.mode] = null; }); htRefresh(true); if ($('#suText')) suRefresh(); },
  htTime: el => { htSet(o => { o.time = el.dataset.id; }); htRefresh(true); },
  rwHide: () => { S.rwHidden = (S.rewards || []).filter(r => !r.used).map(r => r.id); afterChange(); },
  lockNew: el => lockModal(el.dataset.k, el.dataset.id),
  lkGo: () => lockGo(),
  htWd: el => { htSet(o => { o.wd = el.dataset.id === '1'; }); htRefresh(true); },
  htExtra: el => { const [m, pos] = el.dataset.id.split(':'); htSet(o => { o.extra[m] = pos || null; }); htRefresh(true); },
  suBg: el => { S.theme = { id: 'custom', custom: Object.assign(custOpts(), { mode: 'color', bg: el.dataset.id }) }; ui.season = applySeason(); suRefresh(); },
  suPhoto: () => { const i = $('#suPhotoIn'); if (!i) return; i.onchange = async () => { const f = i.files[0]; i.value = ''; if (!f) return; S.theme = { id: 'custom', custom: custOpts() }; await pickPhoto(f); suRefresh(); }; i.click(); },
  suScenes: () => { S.theme = { id: 'seasonal' }; ui.season = applySeason(); suRefresh(); },
  suCal: el => { S.cal = el.dataset.id; ui.season = applySeason(); suRefresh(); },
  suScript: el => { S.zhScript = el.dataset.id === 'trad' ? 'trad' : 'simp'; ui.season = applySeason(); suRefresh(); },
  setSeg: el => { ui.setSeg = el.dataset.id; render(); window.scrollTo(0, 0); },
  rankSkin: el => { const id = el.dataset.id; S.rankSkin = id === 'classic' ? null : id; save(); lookRefresh(); toast(`Rank style: ${rankSkin() ? rankSkin().name : 'Classic'} · you're ${rankOf(overall().L).name}`, 'ti'); },
  styPick: el => { const L = lookOpts(); L.style = el.dataset.id; S.look = L; ui.lkOpen = null; save(); ui.season = applySeason(); lookRefresh(); toast(el.dataset.id === 'auto' ? `Matched: ${STYLE[styleId()].n}` : `UI style: ${STYLE[styleId()].n}`); },
  styOwn: el => { const L = lookOpts(), sid = styleId(); L.own[sid] = el.dataset.id === 'own'; S.look = L; save(); ui.season = applySeason(); lookRefresh(); },
  lkOpen: el => { ui.lkOpen = ui.lkOpen === el.dataset.id ? null : el.dataset.id; lookRefresh(); },
  lkReset: el => { const L = lookOpts(), sid = styleId(); if (L.colors[sid]) delete L.colors[sid][el.dataset.id]; S.look = L; save(); ui.season = applySeason(); lookRefresh(); },
  lkResetAll: () => { const L = lookOpts(); L.colors[styleId()] = {}; S.look = L; ui.lkOpen = null; save(); ui.season = applySeason(); lookRefresh(); toast('Colors back to the style’s defaults'); },
  themeCards: el => { if (themeId() === 'custom') { custSet(o => { o.cards = el.dataset.id; }); ui.season = applySeason(); lookRefresh(); return; } const id = themeId(); S.theme = Object.assign({ id }, S.theme || {}); S.theme.cards = Object.assign({}, S.theme.cards || {}, { [id]: el.dataset.id }); save(); ui.season = applySeason(); themeRefresh(); },
  custPhotoPick: () => { const i = $('#custPhotoIn'); if (!i) return; i.onchange = () => { pickPhoto(i.files[0]); i.value = ''; }; i.click(); },
  wheelTgt: el => { ui.wheelTgt = el.dataset.id; themeRefresh(); },
  cwSwatch: el => { const w = el.closest('.cw'); if (!w) return; const [h, s, v] = hexHsv(el.dataset.id); w.dataset.h = h; w.dataset.s = s; w.dataset.v = v; const r = w.querySelector('[data-i=cwV]'); if (r) r.value = Math.round(v * 100); initWheels(w.parentNode); wheelChanged(w, true); },
  calSet: el => { if (calSet() === el.dataset.id) return; S.cal = el.dataset.id; save(); ui.season = applySeason(); szRefresh(); themeRefresh(); toast({ ja: '日本の七十二候 · Japanese micro-seasons', zh: (zhTrad() ? '中國七十二候' : '中国七十二候') + ' · Chinese micro-seasons', ko: '한국 칠십이후 · Korean micro-seasons' }[calSet()]); },
  zhScript: el => { S.zhScript = el.dataset.id === 'trad' ? 'trad' : 'simp'; save(); ui.season = applySeason(); szRefresh(); themeRefresh(); },
  szOpts: () => { closeModal(true); ui.tab = 'me'; ui.profSeg = 'settings'; ui.setSeg = 'look'; render(); const c = $('#szCard'); if (c) window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 70); },
  range: el => { ui.bodyRange = +el.dataset.id; render(); },
  bodyAdd: () => { let w = num($('#bW').value); const bf = num($('#bF').value); if (w == null && bf == null) { toast('Enter weight or body fat'); return; } if (w != null && imperial()) w = w / 2.20462; S.body.push({ id: uid(), date: $('#bD').value || todayKey(), w, bf }); afterChange(); toast('Saved'); },
  bDel: el => { S.body = S.body.filter(b => b.id !== el.dataset.id); afterChange(); },
  testsSave: () => {
    const set = (k, v) => { if (v == null || isNaN(v)) delete S.tests[k]; else S.tests[k] = { v, date: todayKey() }; };
    set('rhr', num($('#t_rhr').value)); set('pushups', num($('#t_pushups').value)); set('pullups', num($('#t_pullups').value));
    set('plank', parseMS($('#t_plank').value)); const r5 = parseMS($('#t_run5k').value); set('run5k', r5 == null ? null : r5 / 60);
    set('sprint100', num($('#t_sprint100').value)); const sr = num($('#t_sitreach').value); set('sitreach', sr == null ? null : imperial() ? sr * 2.54 : sr);
    afterChange(); toast('Tests saved');
  },
  profSeg: el => { ui.profSeg = el.dataset.id; render(); },
  skOpen: el => { ui.openSkill = ui.openSkill === el.dataset.id ? null : el.dataset.id; render(); },
  skToggle: el => { const id = el.dataset.id, s = skState(id); if (s.active && lockRefuse('skill', id, 'take it off your quests')) return; s.active = !s.active; if (s.active && SK[id].cat === 'Faith') s.days = [0, 1, 2, 3, 4, 5, 6]; regenToday(); afterChange(); toast(s.active ? SK[id].name + ' added to quests' : SK[id].name + ' removed from quests'); },
  skLoad: el => { const s = skState(el.dataset.id); s.load = clamp(s.load * +el.dataset.v, 0.4, 6); regenToday(); afterChange(); },
  practice: el => {
    const id = el.dataset.id, u = SK[id].unit, keys = SK[id].custom ? chipsOn('#pf_' + id) : []; let n = num($('#pm_' + id).value) || 0;
    if (n <= 0) { toast('Enter ' + unitLabel(u).toLowerCase()); return; }
    if (u === 'min') { logPractice(id, Math.round(n), keys); return; }
    if (u === 'km' && imperial()) n = n / 0.621371; logAmount(id, n, keys);
  },
  qLog: el => qlogModal(el.dataset.id),
  ownSet: el => {
    const id = el.dataset.id, c = SK[id]; let v = num(($('#ot_' + id) || {}).value);
    if (!(v > 0) || v > 100000) { toast('Enter a target above 0', 'bad'); return; }
    if (c.unit === 'km' && imperial()) v = v / 0.621371;
    ownSet(id, v); toast(`${c.name}: your target is ${fmtTarget(skState(id).own, c.unit)}`, 'ti');
  },
  ownAuto: el => { const id = el.dataset.id; ownSet(id, null); toast(`${SK[id].name}: automatic again, starting from ${fmtTarget(skillTarget(id, todayKey()), SK[id].unit)}`); },
  ownRaise: el => { const id = el.dataset.id, g = ownSug(id); if (!g) return; ownSet(id, g.to); fx('check'); toast(`${SK[id].name}: new target ${fmtTarget(g.to, SK[id].unit)}`, 'lv'); },
  ownLater: el => { const s = skState(el.dataset.id); s.snooze = (s.hits || 0) + Math.max(2, Math.ceil(ownNeed(el.dataset.id) / 2)); s.overs = []; afterChange(); toast('OK. I’ll ask again in about a week.'); },
  ownGo: el => { closeModal(true); ui.tab = 'board'; ui.boardSeg = 'skills'; ui.openSkill = el.dataset.id; render(); const c = $('#ot_' + el.dataset.id); if (c) c.scrollIntoView({ block: 'center' }); },
  qlChip: el => { const i = $('#qlN'); if (i) { i.value = el.dataset.id; i.focus(); } },
  qlGo: () => qlogGo(),
  csNew: el => { ui.csF = el && el.dataset.f || null; csModal(null); },
  csEdit: el => csModal(SK[el.dataset.id]),
  csAddStat: () => { const n = $$('.csStat').length; if (n >= 8) { toast('8 stats max'); return; } $('#csStats').insertAdjacentHTML('beforeend', `<input class="csStat" data-k="" placeholder="Stat ${n + 1}" style="margin-bottom:6px">`); },
  csSave: el => saveCustomSkill(el.dataset.id),
  skHide: el => {
    const id = el.dataset.id, c = SK[id]; if (!c) return; if (lockRefuse('skill', id, 'delete it')) return;
    if (!confirm(`Delete ${c.name}? It leaves your library and quests. Its XP and titles are kept, and you can restore it in Profile → Settings → Deleted defaults.`)) return;
    skState(id).active = false; if (!S.hideSk.includes(id)) S.hideSk.push(id); if (ui.openSkill === id) ui.openSkill = null;
    regenToday(); afterChange(); toast(c.name + ' deleted · restore it in Settings');
  },
  unhide: el => { const k = el.dataset.k, id = el.dataset.id; S[k] = (S[k] || []).filter(x => x !== id); if (k === 'hideTk' && S.tasks[id]) S.tasks[id].active = false; afterChange(); toast('Restored to the library'); },
  fdNew: el => folderModal(null, el && el.dataset.f || null),
  fdEdit: el => folderModal(folderById(el.dataset.id), null),
  fdSave: el => {
    const id = el.dataset.id, name = ($('#fdName').value || '').trim(), parent = $('#fdParent').value || null;
    if (!name) { toast('Name the folder'); return; }
    if (id) { const f = S.folders.find(x => x.id === id); if (f) { f.name = name; f.parent = parent; } }
    else { const f = { id: 'u_' + uid().slice(0, 8), name, parent }; S.folders.push(f); ui.libOpen.add(f.id); }
    let p = parent ? folderById(parent) : null; while (p) { ui.libOpen.add(p.id); p = p.parent ? folderById(p.parent) : null; }
    closeModal(true); afterChange(); toast(id ? 'Folder updated' : 'Folder created', 'ti');
  },
  fdDel: el => {
    const f = S.folders.find(x => x.id === el.dataset.id); if (!f) return;
    if (!confirm(`Delete the folder "${f.name}"? Its skills and folders move up one level; nothing else is deleted.`)) return;
    S.folders.forEach(x => { if (x.parent === f.id) x.parent = f.parent || null; });
    S.customSkills.forEach(c => { if (c.f === f.id) c.f = f.parent || 'custom'; });
    S.customActs.forEach(a => { if (a.f === f.id) a.f = f.parent || null; });
    S.folders = S.folders.filter(x => x.id !== f.id); rebuildSK(); afterChange(); toast('Folder deleted');
  },
  caNew: () => caModal(null),
  caEdit: el => caModal(ACT[el.dataset.id]),
  caSave: el => saveAct(el.dataset.id),
  caDel: el => { const a = S.customActs.find(x => x.id === el.dataset.id); if (!a || !confirm(`Delete "${a.name}"? Workouts you already logged with it keep their name and calories.`)) return; a.del = true; rebuildACT(); closeModal(true); afterChange(); },
  beltClaim: el => beltClaimModal(el.dataset.id),
  bcPick: el => { ui.bc.i = +el.dataset.id; ui.bc.m = 0; $('#bcBody').innerHTML = bcBody(); },
  beltSave: () => { const { id, i, m } = ui.bc, date = ($('#bcDate') || {}).value || todayKey(); beltSt(id).hist.push({ id: uid(), i, m, date }); closeModal(true); afterChange(); toast('Claimed: ' + beltName(id, i, m), 'ti'); },
  beltDel: el => { const st = beltSt(el.dataset.id); if (!confirm('Remove this claim?')) return; st.hist = st.hist.filter(h => h.id !== el.dataset.k); afterChange(); },
  beltEdit: el => beltEditModal(el.dataset.id),
  beMove: el => { const i = +el.dataset.id, j = i + +el.dataset.v, R = ui.be.rows; if (j < 0 || j >= R.length) return; [R[i], R[j]] = [R[j], R[i]]; $('#beBody').innerHTML = beBody(); },
  beDel: el => { if (ui.be.rows.length <= 1) { toast('Keep at least one'); return; } ui.be.rows.splice(+el.dataset.id, 1); $('#beBody').innerHTML = beBody(); },
  beAdd: () => { ui.be.rows.push({ n: '', c: '#8a8a8a', m: 0, ml: 'stripe' }); $('#beBody').innerHTML = beBody(); },
  beReset: () => { if (!confirm('Go back to the standard order? Your claims stay.')) return; const st = beltSt(ui.be.id); st.ladder = null; st.word = null; closeModal(true); afterChange(); },
  beSave: () => {
    const rows = ui.be.rows.map(b => Object.assign({}, b, { n: (b.n || '').trim(), m: clamp(Math.round(num(b.m) || 0), 0, 12) })).filter(b => b.n);
    if (!rows.length) { toast('Name at least one'); return; }
    const st = beltSt(ui.be.id); st.ladder = rows; st.word = ui.be.word; closeModal(true); afterChange(); toast('Saved', 'ti');
  },
  csDel: el => {
    if (lockRefuse('skill', el.dataset.id, 'delete it')) return;
    const id = el.dataset.id; if (!confirm('Delete this skill? Its XP stays in your overall level.')) return;
    S.customSkills = S.customSkills.filter(c => c.id !== id); delete S.skills[id];
    S.events.forEach(e => { if (e.skill === id) e.skill = null; });
    S.pauses.forEach(p => { if (p.skills) p.skills = p.skills.filter(x => x !== id); });
    rebuildSK(); ui.openSkill = null; closeModal(true); regenToday(); afterChange();
  },
  tClaim: () => { const cat = $('#tCat').value, n = ($('#tName').value || '').trim(); if (!n) { toast('Pick or type a title'); return; } S.titles.claimed.push({ id: uid(), cat, name: n, date: $('#tDate').value }); afterChange(); toast('Title claimed: ' + n, 'ti'); },
  tDel: el => { S.titles.claimed = S.titles.claimed.filter(t => t.id !== el.dataset.id); afterChange(); },
  bkAdd: () => { const t = $('#bkT').value.trim(), p = Math.round(num($('#bkP').value) || 0); if (!t || p <= 0) { toast('Title and page count needed'); return; } S.books.push({ id: uid(), title: t, pages: p, read: 0, finished: false, added: todayKey() }); afterChange(); },
  bkPage: el => { const b = S.books.find(x => x.id === el.dataset.id); if (!b) return; const v = num($('#bkr_' + b.id).value); if (v == null) { toast('Enter a page number'); return; } b.read = clamp(Math.round(v), 0, b.pages); afterChange(); },
  bkFin: el => { const b = S.books.find(x => x.id === el.dataset.id); if (!b || !confirm(`Mark "${b.title}" as completely finished?`)) return; b.finished = true; b.read = b.pages; b.finishedOn = todayKey(); addXp(null, 50, true); afterChange(); toast('Book finished · +50 XP', 'ti'); },
  bkDel: el => { if (!confirm('Remove this book?')) return; S.books = S.books.filter(b => b.id !== el.dataset.id); afterChange(); },
  setSave: () => {
    const f = new FormData($('#setForm')), p = S.profile;
    const h = num(f.get('height')), wasImp = imperial();
    p.name = f.get('name').trim(); p.sex = f.get('sex'); p.birthYear = +f.get('birthYear') || p.birthYear; p.student = !!f.get('student');
    p.heightCm = h > 0 ? (wasImp ? Math.round(h * 2.54) : h) : null; // empty = not given
    p.units = f.get('units');
    const oldWake = p.wake; p.wake = f.get('wake') || p.wake; p.sleep = f.get('sleep') || p.sleep;
    if (oldWake !== p.wake) { save(); boot(); } else { regenToday(); afterChange(); }
    toast('Saved');
  },
  listAdd: () => { const n = $('#newList').value.trim(); if (!n) return; if (S.lists.includes(n)) { toast('List already exists'); return; } S.lists.push(n); afterChange(); },
  export: () => downloadBackup(),
  backup: () => backupModal(),
  buy: el => buyItem(el.dataset.id),
  svRestore: () => restoreStreak(),
  svDrop: () => { if (!S.streakBreak || !confirm(`Let your ${S.streakBreak.n}-day streak go?`)) return; S.streakBreak = null; closeModal(true); afterChange(); },
  bkShare: () => shareBackup(),
  bkDown: () => { closeModal(true); downloadBackup(); },
  backupLater: () => { S.backupSnooze = todayKey(); save(); render(); },
  importOpen: () => {
    const i = $('#importFile'); if (!i) return;
    i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.profile || !d.days) throw 0; if (!confirm('Replace all current data with this backup?')) return; const ph = d._bgPhoto; delete d._bgPhoto; S = Object.assign(fresh(), d); rebuildSK(); save();
          const fin = () => { lookKey = null; boot(); toast('Backup restored'); };
          if (ph) fetch(ph).then(r => r.blob()).then(b => IDB.set('bgPhoto', b)).then(loadCustomPhoto).then(fin, fin); else fin(); } catch (e) { toast('Not a valid backup file', 'bad'); } }); i.value = ''; };
    i.click();
  },
  reset: () => { if (!confirm('Erase ALL data? This cannot be undone.') || !confirm('Really erase everything?')) return; localStorage.removeItem(STORE); IDB.del('bgPhoto').catch(() => { }); custPhoto.url = custPhoto.data = null; lookKey = null; S = fresh(); rebuildSK(); boot(); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  const fn = A[el.dataset.a]; if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const k = e.target.dataset.i; if (!k) return;
  if (k === 'wcalc') updateWkcal();
  if (k === 'foodq') updateFoodRes();
  if (k === 'fcalc' && ui.foodPick) { const g = num(e.target.value) || 0; $('#fcalc').textContent = Math.round(ui.foodPick.k * g / 100) + ' kcal · P ' + (ui.foodPick.p * g / 100).toFixed(1) + ' g'; }
  if (k === 'dg' && ui.dg) { ui.dg[e.target.dataset.k] = num(e.target.value); $('#dgAim').innerHTML = dgAimTxt(); }
  if (k === 'fsCalc' && ui.fs) { fsRead(); $$('#fsChips .chip').forEach(b => b.classList.toggle('on', +b.dataset.id === ui.fs.len)); $('#fsEnd').innerHTML = fsEndTxt(); }
  if (k === 'fvName' && ui.fv) ui.fv.name = e.target.value;
  if (k === 'pe' && ui.pe) peInput(e.target);
  if (k === 'lk' && ui.lk) $('#lkEnd').innerHTML = lockEndTxt();
  if (k === 'ht') { const f = e.target.dataset.k; let v = e.target.value; if (f === 'sub') { const c = htLines(v); if (c !== v) { const at = e.target.selectionStart; e.target.value = v = c; try { e.target.setSelectionRange(at, at); } catch (x) { } } } htSet(o => { o[f] = v; }); htRefresh(false); }
  if (k === 'be' && ui.be) { const r = ui.be.rows[+e.target.dataset.id]; if (r) r[e.target.dataset.k] = e.target.value; }
  if (k === 'cwV') { const w = e.target.closest('.cw'); w.dataset.v = Math.max(.04, +e.target.value / 100); clearTimeout(ui.cwT); ui.cwT = setTimeout(() => initWheels(w.parentNode), 40); wheelChanged(w, false); }
  if (k === 'custDim') { const v = +e.target.value; S.theme.custom = Object.assign(custOpts(), { dim: v }); $('#dimV').textContent = v + '%'; const d = $('#bg .bg-dim'); if (d) d.style.opacity = v / 100; lookKey = null; }
  if (k === 'sd' && ui.sd) { const f = e.target.dataset.k, v = e.target.value; if (f === 'goalH') ui.sd.goalMin = Math.round((num(v) || 0) * 60); else ui.sd[f] = f === 'durN' ? num(v) : v; if (f === 'durN' && $('#sdEnd')) $('#sdEnd').innerHTML = sdEndTxt(); }
  if (k === 'sdCp' && ui.sd) { const c = ui.sd.cps[+e.target.dataset.id]; if (c) c[e.target.dataset.k] = e.target.dataset.k === 'day' ? num(e.target.value) : e.target.value; }
  if (k === 'sdRwT' && ui.sd) ui.sd.reward.text = e.target.value;
  if (k === 'sdRwD' && ui.sd) ui.sd.reward.days = num(e.target.value);
  if (k === 'fvG' && ui.fv) { const i = +e.target.dataset.id, it = ui.fv.items[i]; if (!it) return; it.g = num(e.target.value) || 0; $('#fvk_' + i).textContent = fmtK(itemMac(it).kcal) + ' kcal'; $('#fvTot').textContent = totTxt(favTot(ui.fv.items)); }
  if (k === 'fvq' && ui.fv) {
    const q = e.target.value; ui.fvRes = searchFood(q).slice(0, 25);
    $('#fvRes').innerHTML = ui.fvRes.length ? `<div class="food-res">${ui.fvRes.map((f, i) => `<button data-a="fvPick" data-id="${i}">${esc(f.n)}<small>${esc(f.g)} · ${f.k} kcal / 100 g</small></button>`).join('')}</div>` : (q.trim() ? `<div class="mu small" style="padding:8px 2px">${window.FOOD_DB ? 'No matches.' : 'Loading food database…'}</div>` : '');
  }
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.c; if (!k) return;
  if (k === 'wcalc') updateWkcal();
  if (k === 'evRepeat') $('#evDays').style.display = t.value === 'weekly' ? '' : 'none';
  if (k === 'tCat') $('#tPick').innerHTML = titlePicker(t.value);
  if (k === 'rate') { skState(t.dataset.id).r[t.dataset.k] = +t.value; afterChange(); }
  if (k === 'cefr') { skState(t.dataset.id).cefr[t.dataset.k] = +t.value; afterChange(); }
  if (k === 'scale') { skState(t.dataset.id).sc[t.dataset.k] = +t.value; afterChange(); }
  if (k === 'fx') { S.fx = Object.assign(fxOpts(), { [t.dataset.k]: t.checked }); save(); if (t.checked && t.dataset.k !== 'cele') fx('check'); }
  if (k === 'tkUnit') { const m = $('#tkMin'); if (m) m.hidden = t.value !== 'min'; }
  if (k === 'csFolder') { const w = $('#csNewF'); if (w) w.hidden = t.value !== '__new'; }
  if (k === 'caF') { const w = $('#caNewF'); if (w) w.hidden = t.value !== '__new'; }
  if (k === 'caLike') { const w = $('#caMet'); if (w) w.hidden = t.value !== '__met'; }
  if (k === 'caCount') { const w = $('#caRs'); if (w) w.hidden = t.value !== 'reps'; }
  if (k === 'bcMark' && ui.bc) { ui.bc.m = +t.value; $('#bcBody').innerHTML = bcBody(); }
  if (k === 'be' && ui.be) ui.be.rows[+t.dataset.id][t.dataset.k] = t.value;
  if (k === 'beWord' && ui.be) { ui.be.word = t.value; $('#beBody').innerHTML = beBody(); }
  if (k === 'tkExp') { const b = $('#tkForm [name=base]'); if (b) b.value = roundUnit((+b.dataset.b || 10) * EXP_MULT[t.value], 'min'); }
  if (k === 'sd' && ui.sd) { const f = t.dataset.k; ui.sd[f] = t.value || null; if (f === 'start' && !ui.sd.start) ui.sd.start = todayKey(); if (f === 'durU') $('#sdBody').innerHTML = sdBody(); else if ($('#sdEnd')) $('#sdEnd').innerHTML = sdEndTxt(); }
  if (k === 'htDate') { htSet(o => { o.date = t.value; }); htRefresh(true); }
  if (k === 'peUnit' && ui.pe) { const it = ui.pe.items[+t.dataset.n]; it.unit = t.value; if (t.value === 'money') { it.sym = it.sym || '$'; it.grow = false; } peRefresh(); }
  if (k === 'peFrom' && ui.pe) { const it = ui.pe.items[+t.dataset.n], N = ui.pe.tiers.length, s = +t.value, was = peFrom(it), first = it.amts[was];
    it.amts = it.amts.map((a, i) => i < s ? null : a); if (!(it.amts[s] > 0)) it.amts[s] = first > 0 ? first : 10; if (!(it.amts[N - 1] > 0)) it.amts[N - 1] = it.amts[s]; peFill(it, N); peRefresh(); }
  if (k === 'lkU' && ui.lk) $('#lkEnd').innerHTML = lockEndTxt();
  if (k === 'peGrow' && ui.pe) ui.pe.items[+t.dataset.n].grow = t.checked;
  if (k === 'sdReq' && ui.sd) { ui.sd.req = t.checked; $('#sdBody').innerHTML = sdBody(); }
  if (k === 'sdRwAll' && ui.sd) { ui.sd.reward.all = t.checked; const sc = $('#sdScope'); if (sc) sc.hidden = t.checked; }
  if (k === 'psCalc') { const r = S.rewards.find(x => x.id === ui.pass); if (r && t.value) $('#psEnd').innerHTML = psEndTxt(t.value, r); }
  if (k === 'szChk') { szSet(o => { o.show[t.dataset.l][t.dataset.p] = t.checked ? 1 : 0; }); szRefresh(); }
  if (k === 'dgBurn' && ui.dg) { ui.dg.burn = t.checked; $('#dgAim').innerHTML = dgAimTxt(); }
  if (k === 'dgQuest' && ui.dg) ui.dg.quest = t.checked;
  if (k === 'fsCalc' && ui.fs) { fsRead(); $('#fsEnd').innerHTML = fsEndTxt(); }
  if (k === 'cwV' || k === 'custDim') save();
  if (k === 'cwHex') { const m = /^#?([0-9a-f]{6})$/i.exec(t.value.trim()); if (!m) { toast('Use a hex color like #2a6fd6'); return; } const w = t.closest('.cw'), [h, s, v] = hexHsv('#' + m[1]); w.dataset.h = h; w.dataset.s = s; w.dataset.v = v; initWheels(w.parentNode); wheelChanged(w, true); }
  if (k === 'calPick') suLook(t.value);
  if (k === 'setupUnits') { const imp = t.value === 'imperial'; $('#hw').innerHTML = imp ? SU_HW.imperial : SU_HW.metric; $('#wlab').textContent = imp ? 'Weight (lb, optional)' : 'Weight (kg, optional)'; }
});

// remember which library folders are open across re-renders
document.addEventListener('toggle', e => { const d = e.target; if (d.tagName === 'DETAILS' && d.dataset.f) { if (d.open) ui.libOpen.add(d.dataset.f); else ui.libOpen.delete(d.dataset.f); } }, true);

/* ---------- boot ---------- */
function boot() {
  migrate();
  if (themeId() === 'custom' && custOpts().mode === 'photo' && !custPhoto.url && !boot.ph) { boot.ph = 1; loadCustomPhoto().then(() => { if (S.setup) render(); }); }
  if (!S.setup) { renderSetup(); return; }
  evaluate(); if (S.streakBreak && !sbValid()) S.streakBreak = null;
  ensureToday(); expireSide(); checkTitles(true); save(); render();
}
setInterval(() => { if (S.setup && todayKey() !== curDay) boot(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.setup && todayKey() !== curDay) boot(); });
window.addEventListener('DOMContentLoaded', () => { FIDX = null; if (S.setup && ui.tab === 'log' && ui.logSeg === 'food') render(); });
boot();
