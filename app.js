/* Deificatio — offline quest / training / skill tracker. All data lives in localStorage on this device. */
'use strict';
const { ACTIVITIES, SKILLS, NORMS, CEFR, CEFR_PCT, RATING_PCT, RATING_LABEL, PENALTY, TITLE_CATALOG } = window.CATALOG;
const ACT = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));
const STORE = 'ascent.v1';
const LIST_ORDER = ['Penalty', 'Faith', 'Training', 'Study', 'Craft', 'Work', 'Daily', 'Nutrition'];
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
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 4v16M18 4v16M3 9v6M21 9v6M6 12h12"/></svg>',
  body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17l5-6 4 3 6-8 3 3"/><path d="M3 21h18"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 01-10 0c0-2.5 1.2-3.8 2-5 .3 1.6 1 2.6 2 3-.5-3.5.2-6.5 1-9z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7M14 8.5v7"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/><path d="M12 15V10M9.5 12.5L12 10l2.5 2.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg>',
  plate: '<svg class="ic-plate" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/></svg>',
};

/* ---------- state ---------- */
function fresh() {
  return {
    v: 2, setup: false,
    profile: { name: '', sex: 'M', birthYear: 2003, heightCm: 178, weightKg: 75, units: 'imperial', wake: '07:00', sleep: '23:00', goal: 'maintain', dietQuest: true, start: null },
    lists: ['Faith', 'Training', 'Study', 'Craft', 'Work', 'Daily'],
    skills: {}, customSkills: [], events: [], days: {}, rest: [], pauses: [], lastEval: null,
    streak: { cur: 0, best: 0 }, pendingPen: null, owed: [], xp: 0,
    workouts: [], food: [], customFoods: [], favs: [], fasts: [], body: [], tests: {}, books: [],
    szView: null,
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
}
rebuildSK();
function skState(id) {
  const s = S.skills[id] || (S.skills[id] = { active: false, days: [1, 2, 3, 4, 5], load: 1, xp: 0, min: 0, cnt: 0, done: 0, r: {}, cefr: {}, sm: {} });
  if (!s.sm) s.sm = {};
  if (!s.sc) s.sc = {};
  return s;
}
/* ---------- seasons (72 micro-seasons) & themes ---------- */
const THEMES = {
  spring: { bg: '#0f1514', s1: 'rgba(22,31,28,.87)', s1s: '#16201d', s2: '#1d2925', line: '#253430', line2: '#31443e', ac: '#f2a9bb', ac2: '#c97f93', acA: 'rgba(242,169,187,.13)', bar: 'rgba(15,21,20,.86)', gold: '#e2c27a' },
  summer: { bg: '#08141a', s1: 'rgba(12,28,34,.87)', s1s: '#0f2229', s2: '#14303a', line: '#1a333c', line2: '#24434e', ac: '#62d6c6', ac2: '#3fa597', acA: 'rgba(98,214,198,.13)', bar: 'rgba(8,20,26,.86)', gold: '#f2c96b' },
  autumn: { bg: '#15100c', s1: 'rgba(33,24,18,.87)', s1s: '#21180f', s2: '#2c2118', line: '#35281e', line2: '#47372a', ac: '#eda25a', ac2: '#b8773a', acA: 'rgba(237,162,90,.13)', bar: 'rgba(21,16,12,.86)', gold: '#f0d08a' },
  winter: { bg: '#0b0f17', s1: 'rgba(18,24,38,.87)', s1s: '#141b2b', s2: '#1b2438', line: '#222c42', line2: '#2f3a55', ac: '#a0c9f2', ac2: '#6f97c6', acA: 'rgba(160,201,242,.13)', bar: 'rgba(11,15,23,.86)', gold: '#e2c27a' },
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
let bgIdx = null, curSeason = null;
function applySeason() {
  if (!window.SEASONS || !window.SCENES) return null;
  const si = ui.previewHu != null ? seasonOf(huStarts(new Date().getFullYear()).find(h => h.idx === ui.previewHu).start) : seasonOf(todayKey());
  if (curSeason !== si.season) {
    const th = THEMES[si.season]; for (const k in th) document.documentElement.style.setProperty('--' + k, th[k]);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = th.bg;
    curSeason = si.season; document.documentElement.dataset.season = si.season;
  }
  if (bgIdx !== si.idx) { $('#bg').innerHTML = SCENES.render(si.h[3], si.season, si.idx); bgIdx = si.idx; }
  return si;
}
const fmtShort = k => dparse(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
/* ---------- season display options ----------
   Three levels (season 四季 / solar term 節氣 / micro-season 候) × five parts:
   hj = hanja, ko = Korean reading (음), kom = Korean meaning (뜻), rom = romanized reading, en = English meaning.
   One level (micro or minor) and one language (hj / ko / en / rom) form the large main text. */
const SZ_LV = ['season', 'term', 'hu'];
const SZ_LV_NAME = { season: 'Major season', term: 'Minor season', hu: 'Micro-season' };
const SZ_MAINS = [['hj', '漢字'], ['ko', '한글'], ['en', 'English'], ['rom', 'Romanized']];
const SZ_GLOSS = { hj: null, ko: 'kom', en: 'rom', rom: 'en' }; // the main language's other part, shown under the main text
const SZ_DEF = { season: { hj: 1, ko: 0, kom: 1, rom: 0, en: 0 }, term: { hj: 1, ko: 1, kom: 0, rom: 0, en: 1 }, hu: { hj: 1, ko: 1, kom: 0, rom: 0, en: 1 } };
const SZ_KO = { hj: 1, ko: 1, kom: 1 };
function szOpts() {
  const o = S.szView || {}, sh = o.show || {};
  return { level: o.level === 'term' ? 'term' : 'hu', main: Object.prototype.hasOwnProperty.call(SZ_GLOSS, o.main) ? o.main : 'hj',
    show: Object.fromEntries(SZ_LV.map(l => [l, Object.assign({}, SZ_DEF[l], sh[l] || {})])) };
}
function szSet(fn) { const o = szOpts(); fn(o); S.szView = o; save(); }
function szText(lv, x) { // x: { season } | { j } | { h }
  if (lv === 'season') { const n = SEASONS.NAMES[x.season]; return { hj: n[0], kom: n[1], en: n[2], ko: n[3], rom: n[4] }; }
  if (lv === 'term') { const j = x.j; return { hj: j[0], ko: j[1], en: j[2], kom: j[7], rom: j[8] }; }
  const h = x.h; return { hj: h[0], ko: h[1], en: h[2], kom: h[4], rom: h[5] };
}
const szOrder = lv => lv === 'season' ? ['hj', 'kom', 'ko', 'rom', 'en'] : ['hj', 'ko', 'kom', 'rom', 'en']; // 冬 겨울 동 (훈음 order)
const szVisible = (o, lv) => szOrder(lv).filter(p => o.show[lv][p] || (lv === o.level && p === o.main));
const szSpan = (p, t, tag = 'span') => `<${tag} class="p-${p}"${SZ_KO[p] ? ' lang="ko"' : ''}>${esc(t)}</${tag}>`;
const SZ_DOT = '<i class="dot"> · </i>';
function seasonHero(si, preview) {
  if (!si) return '';
  const o = szOpts(), L = o.level, mi = SZ_LV.indexOf(L), gl = SZ_GLOSS[o.main], T = lv => szText(lv, si);
  const top = SZ_LV.slice(0, mi).map(lv => { const t = T(lv); return szVisible(o, lv).map(p => szSpan(p, t[p])).join('<i class="ps"></i>'); }).filter(Boolean);
  const mt = T(L), latin = o.main === 'en' || o.main === 'rom';
  const gloss = gl && o.show[L][gl] ? szSpan(gl, mt[gl]) : '';
  const bottom = szVisible(o, L).filter(p => p !== o.main && p !== gl).map(p => szSpan(p, mt[p])).join(SZ_DOT);
  const sub = SZ_LV.slice(mi + 1).map(lv => { const t = T(lv); return szVisible(o, lv).map(p => szSpan(p, t[p])).join(SZ_DOT); }).filter(Boolean);
  const date = L === 'hu' ? `${fmtShort(si.start)} – ${fmtShort(si.end)} · 七十二候 ${huNumber(si.idx)}/72`
    : `${fmtShort(si.tStart)} – ${fmtShort(si.tEnd)} · 二十四節氣 ${termNumber(si.ji)}/24 · 候 ${huNumber(si.idx)}/72`;
  return `<div class="season${preview ? ' prev' : ''}"${preview ? '' : ' data-a="seasonList" role="button" aria-label="Browse the 72 micro-seasons"'}>
    ${top.length ? `<div class="sz-top">${top.map(g => `<span class="g">${g}</span>`).join('<span class="sep"> · </span>')}</div>` : ''}
    <div class="sz-h${latin ? ' lat' : ''}"${latin ? '' : ' lang="ko"'}>${esc(mt[o.main])}</div>
    ${gloss ? `<div class="sz-g">${gloss}</div>` : ''}${bottom ? `<div class="sz-k">${bottom}</div>` : ''}
    ${sub.map(s => `<div class="sz-s">${s}</div>`).join('')}
    <div class="sz-d">${date}</div>
  </div>${!preview && ui.previewHu != null ? `<div class="preview row"><span class="sp small">Previewing another micro-season</span><button class="btn-s" data-a="seasonReset">Back to today</button></div>` : ''}`;
}
// the top line holds major (+ minor) season inline; if it would wrap, give each level its own line
function fitSeason(root = document) {
  root.querySelectorAll('.sz-top').forEach(el => {
    el.classList.remove('stack');
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 18;
    if (el.offsetHeight > lh * 1.6) el.classList.add('stack');
  });
}
function szCard() {
  const o = szOpts(), si = ui.season || seasonOf(todayKey()), ex = SZ_LV.map(lv => szText(lv, si));
  const rows = [['Hanja 漢字', [['hj', 'Characters']]], ['Korean 한국어', [['ko', 'Sound 음'], ['kom', 'Meaning 뜻']]], ['English', [['rom', 'Sound (romanized)'], ['en', 'Meaning']]]];
  const cell = (lv, p) => {
    const lock = lv === o.level && p === o.main;
    return lock ? `<div class="cb lock" title="Main text: always shown"><span class="lockbox" role="img" aria-label="${esc(SZ_LV_NAME[lv])}: main text, always shown">${ICON.check}</span><small>main</small></div>`
      : `<div class="cb"><input type="checkbox" data-c="szChk" data-l="${lv}" data-p="${p}" ${o.show[lv][p] ? 'checked' : ''} aria-label="${esc(SZ_LV_NAME[lv])}: ${p}"></div>`;
  };
  return `<div class="card" id="szCard"><h3>Season display</h3>
    <p class="mu small" style="margin-top:2px">Choose what the season header on Quests shows. Changes apply right away.</p>
    <div class="sz-prev">${seasonHero(si, true)}</div>
    <label>Large main text</label>
    <div class="seg tight">${[['hu', 'Micro-season 候'], ['term', 'Minor season 節氣']].map(([v, n]) => `<button class="${o.level === v ? 'on' : ''}" data-a="szLevel" data-id="${v}">${n}</button>`).join('')}</div>
    <div class="seg tight">${SZ_MAINS.map(([v, n]) => `<button class="${o.main === v ? 'on' : ''}" data-a="szMain" data-id="${v}"${v === 'hj' || v === 'ko' ? ' lang="ko"' : ''}>${n}</button>`).join('')}</div>
    <div class="szg">
      <div></div>${SZ_LV.map(lv => `<div class="ch">${{ season: 'Major', term: 'Minor', hu: 'Micro' }[lv]}<small lang="ko">${{ season: '四季', term: '節氣', hu: '候' }[lv]}</small></div>`).join('')}
      ${rows.map(([g, parts]) => `<div class="gh" lang="ko">${g}</div>` + parts.map(([p, n]) => `<div class="lab"><div lang="ko">${n}</div><div class="smp"${SZ_KO[p] ? ' lang="ko"' : ''}>${esc(SZ_LV.map((lv, i) => ex[i][p]).join(' · '))}</div></div>${SZ_LV.map(lv => cell(lv, p)).join('')}`).join('')).join('')}
    </div>
    <p class="mu2 small">The main text is always shown. Your other parts for that season go in the row beneath it; the main language's second part (Korean 뜻, or the romanized/English pair) sits right under the main text.</p>
    <button class="btn-s" data-a="szReset">Reset to default</button></div>`;
}
function szRefresh() { const c = $('#szCard'); if (!c) return; c.outerHTML = szCard(); fitSeason($('#szCard')); }
function seasonListModal() {
  const o = szOpts(), cur = seasonOf(todayKey()).idx, order = [...Array(24).keys()].map(i => (i + 2) % 24), pm = o.main, lat = pm === 'en' || pm === 'rom';
  const extras = (lv, t, tag) => szVisible(o, lv).filter(p => p !== pm).map(p => szSpan(p, t[p], tag)).join(tag === 'small' ? '' : ' ');
  openModal(`<div class="row"><h3 class="sp">七十二候 · The 72 micro-seasons</h3><button class="btn-s" data-a="szOpts">Display</button></div>
  <p class="mu small">Each of the 24 solar terms (節氣) has three five-day pentads. Tap one to preview its scene and colors.</p>
  ${order.map(ji => { const j = SEASONS.JEOLGI[ji], tt = szText('term', { j }); return `<div class="jg"><div class="jg-h"><b class="${lat ? 'lat' : ''}"${lat ? '' : ' lang="ko"'}>${esc(tt[pm])}</b> <span class="jg-x small">${extras('term', tt)}</span> <span class="mu2 small">~${j[3]}/${j[4]}</span></div>
    <div class="jg-row">${j[6].map((h, hi) => { const idx = ji * 3 + hi, ht = szText('hu', { h }); return `<button class="hu ${idx === cur ? 'now' : ''}" data-a="seasonPick" data-id="${idx}"><span class="${lat ? 'lat' : ''}"${lat ? '' : ' lang="ko"'}>${esc(ht[pm])}</span>${extras('hu', ht, 'small')}</button>`; }).join('')}</div></div>`; }).join('')}
  <div class="actions"><button data-a="close">Close</button></div>`);
}
const ui = { previewHu: null, tab: 'today', logSeg: 'workout', profSeg: 'overview', calMonth: null, calSel: null, bodyRange: 90, intensity: 1, foodRes: [], openSkill: null, emDur: 3 };
let curDay = null;

/* ---------- levels & ranks ---------- */
const needSkill = L => Math.round(60 * Math.pow(L, 1.5));
const needAll = L => Math.round(100 * Math.pow(L, 1.6));
function levelOf(xp, need) { let L = 1; xp = Math.max(0, xp); while (xp >= need(L)) { xp -= need(L); L++; } return { L, into: xp, need: need(L) }; }
const overall = () => levelOf(S.xp, needAll);
const skLevel = id => levelOf((S.skills[id] || {}).xp || 0, needSkill);
const RANKS = [[1, 'Initiate'], [10, 'Apprentice'], [20, 'Adept'], [35, 'Vanguard'], [50, 'Paragon'], [75, 'Ascendant']];
function rankOf(L) {
  if (L >= 100) { const n = Math.floor((L - 100) / 50) + 1; return { name: 'Sovereign ' + roman(n), tier: 6 + n }; }
  let t = 0; RANKS.forEach((r, i) => { if (L >= r[0]) t = i; }); return { name: RANKS[t][1], tier: t };
}
function emblem(tier, size = 46) {
  const hex = r => Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return `${(24 + Math.cos(a) * r).toFixed(1)},${(24 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  let g = `<polygon points="${hex(21)}" fill="none" stroke="var(--gold)" stroke-width="1.4"/>`;
  g += `<polygon points="${hex(11)}" fill="${tier >= 6 ? 'var(--gold)' : 'none'}" stroke="var(--gold)" stroke-width="1.2" opacity="${tier >= 6 ? .9 : .7}"/>`;
  for (let i = 0; i < Math.min(tier, 6); i++) { const a = -Math.PI / 2 + i * Math.PI / 3; g += `<line x1="${(24 + Math.cos(a) * 12).toFixed(1)}" y1="${(24 + Math.sin(a) * 12).toFixed(1)}" x2="${(24 + Math.cos(a) * 20).toFixed(1)}" y2="${(24 + Math.sin(a) * 20).toFixed(1)}" stroke="var(--gold)" stroke-width="1.4"/>`; }
  if (tier > 6) g += `<text x="24" y="27.5" text-anchor="middle" font-size="9" fill="#0b0d10" font-weight="700">${roman(tier - 6)}</text>`;
  return `<svg class="emblem" style="width:${size}px;height:${size}px" viewBox="0 0 48 48">${g}</svg>`;
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
  const lists = new Set(), skills = new Set();
  ps.forEach(p => { (p.lists || []).forEach(x => lists.add(x)); (p.skills || []).forEach(x => skills.add(x)); });
  return { ps, lists, skills, all: ps.some(p => p.all), emergency: ps.some(p => p.type === 'emergency') };
}
function scopeTxt(p) {
  if (p.all) return 'everything';
  return [...(p.lists || []), ...(p.skills || []).map(id => SK[id] ? SK[id].name : id)].join(', ') || 'nothing';
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
function skillTarget(id, k) {
  const c = SK[id], s = skState(id);
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
  const c = SK[id], t = skillTarget(id, k);
  return { key: 'skill:' + id, title: title || skillTitle(id), list: list || c.list || 'Daily', skill: id, unit: c.unit, target: t, progress: 0, done: false, xp: questXp(id, t) };
}
function generate(k) {
  const wd = dparse(k).getDay(), rest = S.rest.includes(k), used = new Set();
  let q = [];
  for (const ev of S.events) {
    if (!occursOn(ev, k)) continue;
    if (rest && ev.list !== 'Faith') continue;
    if (ev.skill && SK[ev.skill] && SK[ev.skill].unit) {
      if (used.has(ev.skill)) continue; used.add(ev.skill);
      const sq = makeSkillQuest(ev.skill, k, ev.title, ev.list || SK[ev.skill].list);
      if (ev.target) { sq.target = ev.target; sq.xp = questXp(ev.skill, ev.target); }
      q.push(sq);
    } else q.push({ key: 'ev:' + ev.id, title: ev.title, list: ev.list || 'Daily', unit: ev.unit || '', target: ev.target || 0, progress: 0, done: false, xp: 15 });
  }
  for (const c of SKL) {
    const s = S.skills[c.id];
    if (!s || !s.active || !c.unit || used.has(c.id) || !s.days.includes(wd)) continue;
    if (rest && c.list !== 'Faith') continue;
    used.add(c.id); q.push(makeSkillQuest(c.id, k));
  }
  if (dietWanted(k)) q.push({ key: 'diet', title: 'Met diet requirements', list: 'Nutrition', progress: 0, done: false, xp: 15, auto: true });
  q.push({ key: 'h:teeth', title: 'Brush teeth', list: 'Wind Down', progress: 0, done: false, xp: 5 });
  q.push({ key: 'h:shower', title: 'Shower', list: 'Wind Down', progress: 0, done: false, xp: 5 });
  q.push({ key: 'h:phone', title: `Phone away & asleep by ${fmtClock(S.profile.sleep)}`, list: 'Wind Down', progress: 0, done: false, xp: 10, lockAt: sleepDeadline(k) + 15 * 60000 });
  const pi = pauseInfo(k);
  if (pi) q = pi.all ? [] : q.filter(x => !pi.lists.has(x.list) && !(x.skill && pi.skills.has(x.skill)));
  return q;
}
function penaltyQuests(tier) {
  const mult = 1 + overall().L / 40;
  return PENALTY[tier].ex.map(([n, amt, u], i) => ({ key: 'pen:' + i, title: n, list: 'Penalty', unit: u, target: roundUnit(amt * mult, u), progress: 0, done: false, xp: 10, pen: true }));
}
function ensureDay(k) { if (!S.days[k]) S.days[k] = { q: generate(k), ev: false }; return S.days[k]; }
function ensureToday() {
  const k = todayKey(); curDay = k; const d = ensureDay(k), pi = pauseInfo(k);
  if (S.pendingPen && !(pi && pi.all)) { d.q = d.q.filter(q => !q.pen).concat(penaltyQuests(S.pendingPen.tier)); d.penTier = S.pendingPen.tier; S.pendingPen = null; }
  const dq = d.q.find(q => q.key === 'diet'), want = dietWanted(k);
  if ((want && !dq) || (!want && dq && (!dq.done || fastOn(k)))) regenToday();
  syncDiet(k, true);
  return d;
}
function regenToday() {
  const k = todayKey(), d = ensureDay(k), old = d.q, nq = generate(k), pi = pauseInfo(k);
  const byKey = Object.fromEntries(old.map(q => [q.key, q]));
  const merged = nq.map(q => { const o = byKey[q.key]; if (!o) return q; return Object.assign(q, { progress: o.progress, done: o.done, addMin: o.addMin, smAdd: o.smAdd, wid: o.wid, xp: o.done ? o.xp : q.xp, target: o.done ? o.target : q.target }); });
  const keys = new Set(merged.map(q => q.key)), fasting = !!fastOn(k);
  old.forEach(o => {
    if (keys.has(o.key)) return;
    // a fast removes the diet quest outright (no calorie numbers on fast days); undo its XP if it was already met
    if (o.key === 'diet' && fasting) { if (o.done) { S.stats.qdone = Math.max(0, S.stats.qdone - 1); addXp(null, -o.xp, true); addXp('discipline', -2, true); } return; }
    if (o.done || (o.pen && !(pi && pi.all))) merged.push(o);
  });
  d.q = merged;
}

/* ---------- day evaluation, streaks, penalties, adaptation ---------- */
function evaluate() {
  const today = todayKey();
  if (!S.lastEval) S.lastEval = addDays(S.profile.start || today, -1);
  let k = addDays(S.lastEval, 1), n = 0, maxTier = 0;
  while (k < today && n < 60) {
    const d = ensureDay(k);
    if (!d.ev) {
      d.ev = true;
      const pi = pauseInfo(k);
      if (!d.q.length || (pi && pi.all)) { d.frozen = true; d.pct = null; }
      else {
        if (!d.aim) d.aim = dietAim(k); // freeze that day's calorie aim so later goal changes don't rewrite history
        syncDiet(k, true);
        const tot = d.q.length, done = d.q.filter(q => q.done).length, pct = done / tot;
        d.pct = pct;
        if (pct >= 1) { S.streak.cur++; S.streak.best = Math.max(S.streak.best, S.streak.cur); S.stats.perfect++; addXp('discipline', 20, true); }
        else S.streak.cur = 0;
        for (const q of d.q) {
          if (!q.skill || !SK[q.skill] || !SK[q.skill].unit) continue;
          const s = skState(q.skill), f = Math.max(1, s.days.length);
          s.load = clamp(q.done ? s.load * (1 + 0.08 / f) : s.load * 0.94, 0.4, 6);
        }
        const tier = pct >= 1 ? 0 : pct >= 0.75 ? 1 : pct >= 0.5 ? 2 : pct > 0 ? 3 : 4;
        d.tier = tier;
        if (tier) { S.stats.penalties++; maxTier = Math.max(maxTier, tier); if (tier === 4) S.owed.push(k); }
      }
    }
    S.lastEval = k; k = addDays(k, 1); n++;
  }
  if (k < today) S.lastEval = addDays(today, -1);
  if (maxTier) S.pendingPen = { tier: Math.min(3, Math.max(maxTier, S.pendingPen ? S.pendingPen.tier : 0)) };
}

/* ---------- xp, quests, practice ---------- */
function addXp(skill, amt, quiet) {
  const before = overall().L, sb = skill ? skLevel(skill).L : 0;
  S.xp = Math.max(0, S.xp + amt);
  if (skill && SK[skill]) { const s = skState(skill); s.xp = Math.max(0, s.xp + amt); }
  if (quiet) return;
  const after = overall().L;
  if (after > before) toast(`Level ${after} · ${rankOf(after).name}`, 'lv');
  if (skill && SK[skill] && skLevel(skill).L > sb) toast(`${SK[skill].name} reached level ${skLevel(skill).L}`, 'lv');
}
function defaultActivity(id) {
  const c = SK[id]; if (!c) return null;
  if (c.custom) return c.act && ACT[c.act] ? c.act : null;
  const a = ACTIVITIES.find(a => a.skill === id); return a ? a.id : null;
}
function workoutKcal(actId, min, int) { const a = ACT[actId]; return a ? Math.round(a.met[int] * latestWeightKg() * min / 60) : 0; }
function toggleQuest(key, focus) {
  const d = S.days[todayKey()]; if (!d) return;
  const q = d.q.find(x => x.key === key); if (!q) return;
  if (q.auto) { ui.tab = 'log'; ui.logSeg = 'food'; render(); window.scrollTo(0, 0); toast('This quest checks itself from your food log'); return; }
  const c = q.skill && SK[q.skill] ? SK[q.skill] : null;
  if (!q.done && q.lockAt && Date.now() > q.lockAt) { toast('Deadline passed. This one is locked.', 'bad'); return; }
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
      q.addMin = Math.round(remain * (EST_MIN[c.unit] ?? 0));
      s.min += q.addMin;
      if (c.custom && q.addMin) {
        const ks = focus && focus.length ? focus : c.stats.map(x => x.k); q.smAdd = {};
        ks.forEach(k => { const m = q.addMin / ks.length; s.sm[k] = (s.sm[k] || 0) + m; q.smAdd[k] = m; });
      }
      const act = c.phys && c.unit === 'min' && remain > 0 ? defaultActivity(q.skill) : null;
      if (act) { const w = { id: uid(), date: todayKey(), act, min: remain, int: 1, skill: q.skill, auto: true, xp: 0, kcal: workoutKcal(act, remain, 1) }; S.workouts.push(w); q.wid = w.id; }
    } else {
      s.min = Math.max(0, s.min - (q.addMin || 0)); q.addMin = 0;
      if (q.smAdd) { for (const k in q.smAdd) s.sm[k] = Math.max(0, (s.sm[k] || 0) - q.smAdd[k]); q.smAdd = null; }
      if (q.wid) { S.workouts = S.workouts.filter(w => w.id !== q.wid); q.wid = null; }
    }
  }
  const pens = d.q.filter(x => x.pen);
  if (q.pen && pens.length && pens.every(x => x.done) && !d.penCleared) { d.penCleared = true; S.stats.penCleared++; toast('Penalty cleared', 'ti'); }
  afterChange();
}
function logPractice(id, min, keys) {
  const c = SK[id], s = skState(id), k = todayKey();
  s.min += min;
  if (c.custom) { const ks = keys.length ? keys : c.stats.map(x => x.k); ks.forEach(x => { s.sm[x] = (s.sm[x] || 0) + min / ks.length; }); }
  const act = c.phys ? defaultActivity(id) : null;
  if (act) S.workouts.push({ id: uid(), date: k, act, min, int: 1, skill: id, xp: 0, kcal: workoutKcal(act, min, 1), practice: true });
  addXp(id, Math.round(min / 3));
  const q = (S.days[k] || { q: [] }).q.find(x => x.skill === id && !x.done);
  if (q && q.unit === 'min') {
    q.progress = (q.progress || 0) + min;
    if (q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key, keys); return; }
  }
  toast(`Logged ${min} min of ${c.name}`); afterChange();
}
function afterChange(full = true) { syncDiet(todayKey()); checkTitles(); save(); if (full) render(); }

/* ---------- titles ---------- */
const CUSTOM_TIERS = [[3, 'Novice'], [5, 'Apprentice'], [10, 'Journeyman'], [20, 'Adept'], [35, 'Expert'], [50, 'Master'], [75, 'Grandmaster']];
const stp = (at, id, name, desc) => ({ at, id, name, desc });
function ladder(cur, steps, more) {
  const all = steps.slice();
  if (more) for (let k = 0; k < 1000; k++) { const s = more(k); all.push(s); if (s.at > cur) break; }
  return { earned: all.filter(s => cur >= s.at), next: all.find(s => cur < s.at) || null };
}
const customRole = c => (c.role || c.name || '').trim();
function customRank(id) {
  const c = SK[id], L = skLevel(id).L, role = customRole(c);
  if (L >= 100) return `Legendary ${role} ${roman(Math.floor((L - 100) / 50) + 1)}`;
  const t = CUSTOM_TIERS.filter(([at]) => L >= at).pop();
  return t ? `${t[1]} ${role}` : `Unranked ${role}`;
}
function titleTracks() {
  const T = [], num0 = v => Math.round(v).toLocaleString();
  const add = (group, cur, steps, more, fmt = num0, opts = {}) => T.push(Object.assign({ group, cur, fmt }, ladder(cur, steps, more), opts));
  const lv = v => 'Lv ' + v, active = id => !!(S.skills[id] && (S.skills[id].active || S.skills[id].xp > 0));
  // consistency
  add('Consistency', S.streak.best, [[3, 'Kindled'], [7, 'Week Unbroken'], [14, 'Fortnight Will'], [30, 'Iron Month'], [60, 'Relentless'], [100, 'Centurion'], [180, 'Half-Year Ascetic'], [365, 'Unbroken Year']].map(([n, nm]) => stp(n, 'streak' + n, nm, `${n}-day streak`)),
    k => stp((k + 2) * 365, 'streaky' + (k + 2), `Unbroken · ${k + 2} Years`, `${(k + 2) * 365}-day streak`), v => v + ' d', { note: `Best streak counts · current ${S.streak.cur}` });
  add('Consistency', S.stats.perfect, [[7, 'Flawless Week'], [30, 'Flawless Month'], [100, 'Hundred Perfect Days'], [365, 'Perfect Year']].map(([n, nm]) => stp(n, 'perf' + n, nm, `${n} perfect days`)), null, v => v + ' days');
  add('Consistency', S.stats.qdone, [10, 50, 100, 250, 500, 1000, 2500, 5000].map(n => stp(n, 'q' + n, `${n.toLocaleString()} Quests`, `Complete ${n.toLocaleString()} quests`)),
    k => { const n = (k + 1) * 10000; return stp(n, 'q' + n, `${n.toLocaleString()} Quests`, `Complete ${n.toLocaleString()} quests`); });
  add('Consistency', overall().L, [[5, 'Awakened'], [10, 'Apprentice'], [20, 'Adept'], [35, 'Vanguard'], [50, 'Paragon'], [75, 'Ascendant'], [100, 'Sovereign']].map(([n, nm]) => stp(n, 'lvl' + n, nm, `Reach level ${n}`)),
    k => { const n = 150 + k * 50; return stp(n, 'lvl' + n, 'Sovereign ' + roman(k + 2), `Reach level ${n}`); }, lv);
  // training & body
  add('Training & body', S.workouts.length, [[1, 'First Sweat'], [10, 'Regular'], [50, 'Gym Rat'], [100, 'Hundred Sessions'], [250, 'Iron Habit'], [500, 'Machine'], [1000, 'Thousand Sessions']].map(([n, nm]) => stp(n, 'wk' + n, nm, `Log ${n.toLocaleString()} workout${n > 1 ? 's' : ''}`)), null, v => v + ' sessions');
  add('Training & body', Math.round(S.workouts.reduce((a, w) => a + (w.kcal || 0), 0)), [stp(10000, 'kc10k', 'Furnace', 'Burn 10,000 kcal')],
    k => { const n = (k + 1) * 100000; return stp(n, 'kc' + n, k ? `Inferno ×${k + 1}` : 'Inferno', `Burn ${n.toLocaleString()} kcal`); }, v => num0(v) + ' kcal');
  add('Training & body', S.body.length, [stp(10, 'selfaware', 'Self-Aware', 'Log body stats 10 times')], null, v => v + ' logs');
  add('Training & body', new Set(S.food.map(f => f.date)).size, [stp(30, 'fuel', 'Fuel Accountant', 'Log food on 30 days')], null, v => v + ' days');
  // faith & reading
  add('Faith & reading', (S.skills.bible || {}).cnt || 0, [], k => stp((k + 1) * 1189, 'bible' + (k + 1), k ? `Through the Word ×${k + 1}` : 'Through the Word', 'Read all 1,189 chapters of the Bible'), v => num0(v) + ' ch.', { hidden: !active('bible') });
  add('Faith & reading', (S.skills.prayer || {}).done || 0, [stp(40, 'pray40', 'Forty Days of Prayer', 'Complete 40 prayer quests'), stp(365, 'pray365', 'A Year on Your Knees', 'Complete 365 prayer quests')], null, v => v + ' prayers', { hidden: !active('prayer') });
  const fb = S.books.filter(b => b.finished).length;
  add('Faith & reading', fb, [[1, 'Reader'], [5, 'Bookworm'], [10, 'Well-Read'], [25, 'Scholar'], [50, 'Bibliophile'], [100, 'Living Library']].map(([n, nm]) => stp(n, 'book' + n, nm, `Finish ${n} book${n > 1 ? 's' : ''}`)),
    k => { const n = 200 + k * 100; return stp(n, 'book' + n, `Library of ${n}`, `Finish ${n} books`); }, v => v + ' books');
  // skills
  for (const c of SKL) {
    if (!c.unit && c.id !== 'discipline') continue;
    const L = skLevel(c.id).L;
    if (c.custom) {
      const role = customRole(c);
      add('Your skills', L, CUSTOM_TIERS.map(([n, t]) => stp(n, `ck_${c.id}_${n}`, `${t} ${role}`, `${c.name} level ${n}`)),
        k => { const n = 100 + k * 50; return stp(n, `ck_${c.id}_${n}`, `Legendary ${role} ${roman(k + 1)}`, `${c.name} level ${n}`); }, lv, { hidden: !active(c.id) });
    } else {
      add('Skills', L, [[10, 'Adept'], [25, 'Expert'], [50, 'Master'], [100, 'Grandmaster']].map(([n, p]) => stp(n, `sk_${c.id}_${n}`, `${p} of ${c.name}`, `${c.name} level ${n}`)),
        k => { const n = 200 + k * 100; return stp(n, `sk_${c.id}_${n}`, `Legend of ${c.name} ${roman(k + 1)}`, `${c.name} level ${n}`); }, lv, { hidden: !active(c.id) && c.id !== 'discipline' });
    }
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
  // penance
  add('Penance', S.stats.donated, [stp(1, 'paid', 'Paid the Price', 'Make your first penalty donation')], null, v => v + ' paid');
  add('Penance', S.stats.penCleared, [stp(1, 'redeemed', 'Redeemed', 'Clear a penalty set'), stp(10, 'redeemed10', 'Forged in Penance', 'Clear 10 penalty sets')], null, v => v + ' cleared');
  // discovery (hidden easter egg)
  add('Discovery', S.customSkills.length, [stp(1, 'pioneer', 'Pathfinder', 'Create your own skill')], null, num0, { hidden: true });
  return T;
}
function autoTitles() { return titleTracks().flatMap(t => t.earned); }
function checkTitles(silent) {
  for (const t of autoTitles()) if (!S.titles.auto[t.id]) { S.titles.auto[t.id] = todayKey(); if (!silent) toast('Title earned: ' + t.name, 'ti'); }
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
  if (k === 'd_sleep') { const w = ds.filter(d => d.q.some(q => q.key === 'h:phone')); return w.length ? Math.round(w.filter(d => d.q.find(q => q.key === 'h:phone').done).length / w.length * 100) : null; }
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
    case 'h': return Math.round(100 * (1 - Math.exp(-(s.min / 60) / st.scale)));
    case 'ch': { const h = (s.sm[st.k] || 0) / 60, sc = SK[id].scale || 100; return Math.round(100 * (1 - Math.pow(2, -h / sc))); }
    case 'c': return skillConsistency(id);
    case 'm': return normPct(st.norm, (S.tests[st.norm] || {}).v ?? null);
    case 'a': return autoStat(st.k);
  }
  return null;
}
/* ---------- diet goal & fasts ----------
   Presets: (maintenance + goal adj + workout kcal) with a % band. Maintenance = formula estimate or the user's own number.
   Custom: target ± margin, range, limit (max only) or minimum (min only); workout kcal optional.
   Fasts: up to 40 days with no diet quest and calorie tracking hidden (no penalty). */
const DIET_DEF = { maint: null, rule: 'target', kcal: 2000, tol: 150, lo: 1800, hi: 2200, burn: false };
const GOAL_NAME = { cut: 'Lose fat', maintain: 'Maintain', bulk: 'Build muscle', custom: 'Custom' };
const GOAL_ADJ = { cut: -500, maintain: 0, bulk: 300 };
const RULES = [['target', 'Target'], ['range', 'Range'], ['limit', 'Limit'], ['min', 'Minimum']];
const RULE_NAME = { target: 'Custom target', range: 'Custom range', limit: 'Custom limit', min: 'Custom minimum' };
const KCAL_FLOOR = 1200, FAST_MAX = 40;
const fmtK = n => Math.round(n).toLocaleString();
const dietCfg = (p = S.profile) => Object.assign({}, DIET_DEF, p.diet || {});
const bmrOf = () => { const p = S.profile; return 10 * latestWeightKg() + 6.25 * p.heightCm - 5 * age() + (p.sex === 'F' ? -161 : 5); };
const estMaint = () => Math.round(bmrOf() * 1.25);
const burnedOn = k => S.workouts.filter(x => x.date === k).reduce((a, x) => a + (x.kcal || 0), 0);
function dietAim(k, p = S.profile) {
  const c = dietCfg(p), burned = Math.round(burnedOn(k)), goal = GOAL_NAME[p.goal] ? p.goal : 'maintain';
  if (goal === 'custom') {
    const add = c.burn ? burned : 0, R = v => v == null ? null : Math.round(v + add);
    const r = c.rule === 'range' ? [c.lo, c.hi] : c.rule === 'limit' ? [null, c.kcal] : c.rule === 'min' ? [c.kcal, null] : [c.kcal - c.tol, c.kcal + c.tol];
    return { goal, rule: c.rule in RULE_NAME ? c.rule : 'target', burned, add, lo: R(r[0]), hi: R(r[1]) };
  }
  const maint = c.maint || estMaint(), t = maint + GOAL_ADJ[goal] + burned, [a, b] = DIET_BAND[goal];
  return { goal, burned, add: burned, maint, own: !!c.maint, t: Math.round(t), lo: Math.round(t * a), hi: Math.round(t * b) };
}
const aimFor = k => { const d = S.days[k]; return d && d.ev && d.aim ? d.aim : dietAim(k); };
const aimTxt = a => a.lo != null && a.hi != null ? `${fmtK(a.lo)}–${fmtK(a.hi)}` : a.hi != null ? `≤ ${fmtK(a.hi)}` : `≥ ${fmtK(a.lo)}`;
const goalDesc = a => a.goal === 'custom' ? RULE_NAME[a.rule] : GOAL_NAME[a.goal];
function aimBreakdown(a) {
  if (a.goal === 'custom') return a.burned ? (a.add ? `Includes ${fmtK(a.burned)} kcal burned in workouts` : 'Workout calories not added') : 'Fixed daily number';
  const adj = GOAL_ADJ[a.goal];
  return `${a.own ? 'Your maintenance' : 'Est. maintenance'} ${fmtK(a.maint)}${adj ? ` ${adj < 0 ? '−' : '+'} ${Math.abs(adj)}` : ''}${a.burned ? ` + ${fmtK(a.burned)} burned` : ''}`;
}
const fastOn = k => (S.fasts || []).find(f => k >= f.start && k <= f.end) || null;
const fastNext = () => (S.fasts || []).filter(f => f.end >= todayKey()).sort((a, b) => a.start < b.start ? -1 : 1)[0] || null;
const fastLen = f => daysBetween(f.start, f.end) + 1;
const fastDay = (f, k) => daysBetween(f.start, k) + 1;
const dietWanted = k => S.profile.dietQuest !== false && !fastOn(k);
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
  if (!s.logged) return 'Log food to verify';
  if (s.ok) return s.hi != null ? `On track · ${fmtK(s.hi - s.eaten)} left` : 'On track ✓';
  return s.lo != null && s.eaten < s.lo ? `${fmtK(s.lo - s.eaten)} kcal to go` : `${fmtK(s.eaten - s.hi)} kcal over`;
}
function dietSummary() {
  const tk = todayKey(), f = fastOn(tk), a = dietAim(tk);
  if (f) return `Fasting until ${fmtDate(f.end)} · diet quest paused`;
  return `${goalDesc(a)} · aim ${aimTxt(a)} kcal today · quest ${S.profile.dietQuest !== false ? 'on' : 'off'}`;
}
function nutritionAdherence() {
  const days = [...new Set(S.food.map(f => f.date))].sort().filter(k => k !== todayKey() && !fastOn(k)).slice(-14);
  if (!days.length) return null;
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
  [25, 50, 75, 100].forEach(l => g += `<polygon points="${P(l)}" fill="none" stroke="${l === 50 ? '#4a505a' : '#20252d'}" ${l === 50 ? 'stroke-dasharray="3 3"' : ''}/>`);
  axes.forEach((_, i) => { const [x, y] = pt(i, 100); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#20252d"/>`; });
  const poly = axes.map((a, i) => pt(i, a.v == null ? 0 : Math.max(4, a.v)).map(x => x.toFixed(1)).join(',')).join(' ');
  g += `<polygon points="${poly}" fill="var(--acA)" stroke="var(--ac)" stroke-width="1.6" stroke-linejoin="round"/>`;
  axes.forEach((a, i) => { if (a.v != null) { const [x, y] = pt(i, Math.max(4, a.v)); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="var(--ac)"/>`; } });
  axes.forEach((a, i) => {
    const [x, y] = pt(i, 120), anc = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
    const yy = y < cy - 4 ? y - 6 : y + (Math.abs(y - cy) < 4 ? 0 : 6);
    g += `<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="${anc}" font-size="10.5" fill="#8b929d">${esc(a.n)}</text>`;
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
  for (let i = 0; i <= 3; i++) { const y = T + i * (H - T - B) / 3; g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#1c2027"/>`; }
  const path = (s, color) => s ? `<polyline fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" points="${s.v.map(p => `${X(p[0]).toFixed(1)},${s.Y(p[1]).toFixed(1)}`).join(' ')}"/>` + s.v.map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${s.Y(p[1]).toFixed(1)}" r="2" fill="${color}"/>`).join('') : '';
  g += path(ws, 'var(--ac)') + path(bs, 'var(--gold)');
  const axis = (s, x, anc, color) => s ? [s.hi, (s.hi + s.lo) / 2, s.lo].map((v, i) => `<text x="${x}" y="${T + i * (H - T - B) / 2 + 4}" font-size="9.5" text-anchor="${anc}" fill="${color}" font-family="ui-monospace,monospace">${v.toFixed(1)}</text>`).join('') : '';
  g += axis(ws, L - 4, 'end', 'var(--ac)') + axis(bs, W - R + 4, 'start', '#d9b56c');
  g += `<text x="${L}" y="${H - 5}" font-size="9.5" fill="#5d636d">${fmtDate(pts[0].date)}</text><text x="${W - R}" y="${H - 5}" font-size="9.5" fill="#5d636d" text-anchor="end">${fmtDate(pts[pts.length - 1].date)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg><div class="legend"><span><i style="background:var(--ac)"></i>Weight (${imperial() ? 'lb' : 'kg'})</span><span><i style="background:var(--gold)"></i>Body fat (%)</span></div>`;
}
function ringSvg(p, size = 58) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#232832" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ac)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" font-size="13" fill="#e7e9ec" font-family="ui-monospace,monospace">${Math.round(p * 100)}%</text></svg>`;
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
function showDonation() {
  if (!S.owed.length || !$('#modal').hidden && modalLocked) return;
  const n = S.owed.length;
  openModal(`<h3 class="bad">Penalty: donation owed</h3>
    <p class="mu">You missed <b>every</b> quest on ${S.owed.map(fmtDate).map(esc).join(', ')}.</p>
    <p>Donate <b class="num">$${n * 5}</b> to a charity of your choice. Penalty exercises have been added to your quests.</p>
    <label class="check"><input type="checkbox" id="donchk"> I have made the donation</label>
    <div class="actions"><button class="btn-bad" data-a="donated">Yes, I donated</button></div>`, { lock: true, cls: 'danger' });
}
function focusModal(q, c) {
  openModal(`<h3>${esc(q.title)}</h3><p class="mu small">What did you work on? The time is split across the parts you pick and grows those sides of the hexagon.</p>
  <div class="chips" id="focusChips">${c.stats.map(x => `<button class="chip on" data-a="chipT" data-k="${esc(x.k)}">${esc(x.n)}</button>`).join('')}</div>
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="focusDone" data-id="${esc(q.key)}">Complete</button></div>`);
}

/* ---------- render: chrome ---------- */
function renderTop() {
  const o = overall(), rk = rankOf(o.L);
  $('#top').innerHTML = `<div class="topbar">${emblem(rk.tier, 36)}<div class="lv"><b>Lv ${o.L}</b><small>${esc(rk.name)}</small>
    <div class="bar gold"><i style="width:${(o.into / o.need * 100).toFixed(1)}%"></i></div></div>
    <div class="streak" title="Streak">${ICON.flame}<span class="num">${S.streak.cur}</span></div></div>`;
}
function renderNav() {
  const tabs = [['today', 'Quests', ICON.today], ['cal', 'Calendar', ICON.cal], ['log', 'Log', ICON.log], ['body', 'Body', ICON.body], ['me', 'Profile', ICON.me]];
  $('#nav').innerHTML = tabs.map(([id, n, ic]) => `<button class="${ui.tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${ic}<span>${n}</span></button>`).join('');
}
function render() {
  ui.season = applySeason();
  if (!S.setup) return renderSetup();
  renderTop(); renderNav();
  $('#view').innerHTML = ({ today: viewToday, cal: viewCal, log: viewLog, body: viewBody, me: viewMe })[ui.tab]();
  fitSeason($('#view'));
  if (ui.tab === 'log' && ui.logSeg === 'workout') updateWkcal();
  if (S.owed.length) showDonation();
}

/* ---------- views: setup ---------- */
function renderSetup() {
  applySeason();
  $('#top').innerHTML = ''; $('#nav').innerHTML = '';
  const cats = [...new Set(SKILLS.filter(s => s.unit).map(s => s.cat))];
  $('#view').innerHTML = `<div class="hero"><img src="icons/icon-192.png" class="hero-icon" alt=""><h1>Deificatio</h1><p class="mu">Set up your profile. Everything stays on this phone.</p></div>
  <form id="setupForm" onsubmit="return false">
  <div class="card"><h3>Profile</h3>
    <label>Name</label><input name="name" placeholder="Your name" autocomplete="given-name">
    <div class="grid2"><div><label>Sex (for norms)</label><select name="sex"><option value="M">Male</option><option value="F">Female</option></select></div>
    <div><label>Birth year</label><input name="birthYear" type="number" inputmode="numeric" value="2003"></div></div>
    <label>Units</label><select name="units" data-c="setupUnits"><option value="imperial">Imperial (lb, ft, mi)</option><option value="metric">Metric (kg, cm, km)</option></select>
    <div class="grid2" id="hw"><div><label>Height (ft)</label><input name="ft" type="number" value="5"></div><div><label>Height (in)</label><input name="in" type="number" value="10"></div></div>
    <div class="grid2"><div><label id="wlab">Weight (lb)</label><input name="weight" type="number" step="0.1" inputmode="decimal"></div><div><label>Body fat % (optional)</label><input name="bf" type="number" step="0.1" inputmode="decimal"></div></div>
    <label>Goal</label><select name="goal"><option value="cut">Lose fat (−500 kcal)</option><option value="maintain" selected>Maintain</option><option value="bulk">Build muscle (+300 kcal)</option></select>
  </div>
  <div class="card"><h3>Daily rhythm</h3><p class="mu small">Your day resets at wake time. "Phone away & asleep" locks 15 minutes after sleep time.</p>
    <div class="grid2"><div><label>Wake time</label><input name="wake" type="time" value="07:00"></div><div><label>Sleep time</label><input name="sleep" type="time" value="23:00"></div></div>
  </div>
  <div class="card"><h3>Skills to train</h3><p class="mu small">Tick what goes on your quest list, then pick your current level. Weekdays can be changed later in Calendar → Weekly plan, and you can create your own skills in Profile → Skills.</p>
  ${cats.map(cat => `<h2>${esc(cat)}</h2>` + SKILLS.filter(s => s.cat === cat && s.unit).map(s => `
    <div class="skpick"><label><input type="checkbox" name="sk_${s.id}" ${s.id === 'prayer' || s.id === 'bible' ? 'checked' : ''}> ${esc(s.name)}</label>
    <select name="lv_${s.id}"><option value="1">Beginner</option><option value="2">Intermediate</option><option value="3">Advanced</option></select></div>`).join('')).join('')}
  </div>
  <button class="btn-p btn-big" data-a="finishSetup">Start</button>
  </form>
  <p class="mu2 small" style="text-align:center;margin-top:14px">Have a backup? <a href="#" data-a="importOpen">Restore it</a><input type="file" id="importFile" accept="application/json,.json,text/plain,.txt" hidden></p>`;
}
function finishSetup() {
  const f = new FormData($('#setupForm')), g = k => f.get(k);
  const p = S.profile;
  p.name = (g('name') || '').trim(); p.sex = g('sex'); p.birthYear = +g('birthYear') || 2000; p.units = g('units');
  p.heightCm = p.units === 'imperial' ? Math.round(((+g('ft') || 0) * 12 + (+g('in') || 0)) * 2.54) : (+g('cm') || 175);
  const w = num(g('weight')); p.weightKg = w ? (p.units === 'imperial' ? w / 2.20462 : w) : 75;
  p.goal = g('goal'); p.wake = g('wake') || '07:00'; p.sleep = g('sleep') || '23:00';
  const today = todayKey(); p.start = today;
  const bf = num(g('bf')); if (w || bf != null) S.body.push({ id: uid(), date: today, w: w ? p.weightKg : null, bf });
  for (const s of SKILLS) {
    if (!s.unit || !f.get('sk_' + s.id)) continue;
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
  return `<div class="banner ${em ? 'em' : ''}"><div class="row">${ICON.pause}<b class="sp">${em ? 'Extreme emergency' : 'Vacation'}${p.note ? ' · ' + esc(p.note) : ''}</b></div>
    <div class="small mu" style="margin-top:4px">${em ? 'All quests paused, including penalties. Streak frozen, no penalties.' : 'Paused: ' + esc(scopeTxt(p)) + '.'} ${esc(until)}.</div>
    <div class="row" style="margin-top:10px;gap:8px">${p.start === tk ? `<button class="btn-s" data-a="pCancel" data-id="${p.id}">${em ? 'Resume today' : 'Cancel pause'}</button>` : ''}${p.end !== tk ? `<button class="btn-s" data-a="pEnd" data-id="${p.id}">${em ? 'Resume tomorrow' : 'End early'}</button>` : ''}</div></div>`;
}
function viewToday() {
  const k = todayKey(), d = ensureDay(k), q = d.q, pi = pauseInfo(k);
  const done = q.filter(x => x.done).length, pct = q.length ? done / q.length : 0;
  const xpToday = q.filter(x => x.done).reduce((a, x) => a + x.xp, 0);
  const lists = [...new Set(q.map(x => x.list))].sort((a, b) => listRank(a) - listRank(b));
  const now = Date.now(), dayN = S.profile.start ? daysBetween(S.profile.start, k) + 1 : 1;
  const fst = fastOn(k);
  const badges = [S.rest.includes(k) ? '<span class="pill">Rest day</span>' : '', isDeload(k) ? '<span class="pill">Deload week · −25%</span>' : '', d.penTier ? `<span class="pill bad">Penalty · ${esc(PENALTY[d.penTier].name)}</span>` : '',
    fst ? `<span class="pill gold">Fasting · day ${fastDay(fst, k)}/${fastLen(fst)}</span>` : ''].filter(Boolean).join(' ');
  const qrow = x => {
    const locked = !x.done && x.lockAt && now > x.lockAt;
    const lv = x.skill && SK[x.skill] ? `Lv ${skLevel(x.skill).L}` : '';
    const hasProg = x.progress > 0 && !x.done;
    const prog = hasProg && x.target ? `<div class="prog"><i style="width:${Math.min(100, x.progress / x.target * 100)}%"></i></div>` : '';
    const sub = x.key === 'diet' ? dietSub(k) : [hasProg ? `${fmtTarget(x.progress, x.unit)} of ${fmtTarget(x.target, x.unit)}` : fmtTarget(x.target, x.unit), lv, locked ? 'locked' : ''].filter(Boolean).join(' · ');
    return `<div class="q ${x.done ? 'done' : ''} ${x.pen ? 'pen' : ''} ${x.auto ? 'auto' : ''} ${locked ? 'locked' : ''}"><button class="chk" data-a="tq" data-id="${esc(x.key)}" aria-label="Toggle ${esc(x.title)}">${x.done ? ICON.check : ''}</button>
      <div class="qb"><div class="qt">${esc(x.title)}</div>${sub ? `<div class="qs">${esc(sub)}</div>` : ''}${prog}</div><div class="qx">+${x.xp}</div></div>`;
  };
  if (pi && pi.all) return `${seasonHero(ui.season)}${pi.ps.map(p => pauseBanner(p, k)).join('')}${backupNag(k)}<div class="empty">${pi.emergency ? 'Nothing today. Take care of what matters.' : 'Everything is paused. Enjoy the break.'}</div>
  <div class="row" style="justify-content:center"><button class="btn-s" data-a="tab" data-id="log">Log a workout anyway</button></div>`;
  return `${seasonHero(ui.season)}${pi ? pi.ps.map(p => pauseBanner(p, k)).join('') : ''}${backupNag(k)}
  <div class="card ring"><div style="flex:none">${ringSvg(pct)}</div><div class="sp"><div class="mu2 small">Day ${dayN}</div><h3>${fmtDate(k)}</h3>
    <div class="mu small"><span class="num">${done}/${q.length}</span> quests · <span class="gold num">+${xpToday} XP</span></div>${badges ? `<div class="badges">${badges}</div>` : ''}</div></div>
  ${q.length ? lists.map(l => `<div class="qlist"><div class="qhead"><h2 class="${l === 'Penalty' ? 'bad' : ''}">${esc(l)}</h2><span class="mu2 small num">${q.filter(x => x.list === l && x.done).length}/${q.filter(x => x.list === l).length}</span></div>
    ${q.filter(x => x.list === l).map(qrow).join('')}</div>`).join('') : `<div class="empty">${pi && pi.emergency ? 'Nothing today. Take care of what matters.' : 'Nothing scheduled today.'}</div>`}
  <div class="row" style="margin-top:16px"><button class="btn-s" data-a="regen">Refresh quests</button><span class="sp"></span><button class="btn-s" data-a="tab" data-id="log">Log workout</button></div>
  <p class="mu2 small note">Targets adapt: finishing a skill raises it about 8% a week; missing lowers it 6%. Every 4th week is a deload. Under 100% means penalty exercises tomorrow; 0% means a $5 donation plus Tier III.</p>
  ${pi && pi.emergency ? '' : '<div style="text-align:center;margin-top:6px"><button class="btn-g bad small" data-a="emNew">Extreme emergency</button></div>'}`;
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
  const active = SKL.filter(s => s.unit && S.skills[s.id] && S.skills[s.id].active);
  const pauses = S.pauses.filter(p => !p.end || p.end >= tk).sort((a, b) => a.start < b.start ? -1 : 1);
  return `<div class="row month"><button class="btn-g" data-a="calNav" data-id="-1" aria-label="Previous month">‹</button><h3 class="sp">${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3><button class="btn-g" data-a="calNav" data-id="1" aria-label="Next month">›</button></div>
  <div class="cal">${cells}</div>
  <div class="legend cal-legend"><span><i class="dot" style="background:var(--ac)"></i>event</span><span><i class="dot" style="background:var(--gold)"></i>perfect</span><span><i class="dot" style="background:var(--bad)"></i>missed</span><span><i class="dash" style="background:#5b7fa6"></i>vacation</span><span><i class="dash" style="background:var(--bad)"></i>emergency</span><span><i class="dash" style="background:var(--gold)"></i>fast</span></div>
  <h2>${fmtDate(sel)}</h2>
  <div class="card">
    ${fastOn(sel) ? `<div class="small" style="margin-bottom:8px"><span class="gold">Fast${fastOn(sel).note ? ' · ' + esc(fastOn(sel).note) : ''}</span> · day ${fastDay(fastOn(sel), sel)} of ${fastLen(fastOn(sel))} · diet quest off</div>` : ''}
    ${spi ?`<div class="small" style="margin-bottom:8px">${ICON.pause} <span class="${spi.emergency ? 'bad' : 'acc'}">${spi.emergency ? 'Extreme emergency' : 'Vacation'}</span> · paused: ${esc(spi.all ? 'everything' : [...spi.lists, ...[...spi.skills].map(id => SK[id] ? SK[id].name : id)].join(', '))}</div>` : ''}
    ${evs.length ? evs.map(e => `<div class="list-item"><div class="sp"><div>${esc(e.title)}</div><div class="mu small">${esc(e.list || '')} · ${esc(repTxt(e))}${e.skill && SK[e.skill] ? ' · ' + esc(SK[e.skill].name) : ''}</div></div><button class="btn-s" data-a="evEdit" data-id="${e.id}">Edit</button></div>`).join('') : '<div class="mu small">No events this day.</div>'}
    ${day && day.ev ? `<div class="mu small" style="margin-top:8px">Result: ${day.frozen ? 'paused (streak frozen)' : `<span class="num">${Math.round(day.pct * 100)}%</span>${day.tier ? ` · <span class="bad">${day.tier === 4 ? 'Donation' : PENALTY[day.tier].name}</span>` : ''}`}</div>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn-p btn-s" data-a="evNew">+ Event</button><span class="sp"></span>
    ${sel >= tk ? `<button class="btn-s" data-a="restToggle" data-id="${sel}">${S.rest.includes(sel) ? 'Unset rest day' : 'Mark rest day'}</button>` : ''}</div>
  </div>
  <h2>Pauses</h2>
  <div class="card">${pauses.length ? pauses.map(p => `<div class="list-item"><div class="sp"><div>${p.type === 'emergency' ? '<span class="bad">Extreme emergency</span>' : 'Vacation'}${p.note ? ' · ' + esc(p.note) : ''}</div>
      <div class="mu small">${fmtDate(p.start)} → ${p.end ? fmtDate(p.end) : 'until ended'} · ${esc(scopeTxt(p))}</div></div>
      ${p.start >= tk ? `<button class="btn-s" data-a="pCancel" data-id="${p.id}">Cancel</button>` : ''}${p.start <= tk && p.end !== tk ? `<button class="btn-s" data-a="pEnd" data-id="${p.id}">End</button>` : ''}</div>`).join('') : '<div class="mu small">No upcoming pauses. Plan vacations ahead; paused quests don\'t count against you.</div>'}
    <div class="row" style="margin-top:12px"><button class="btn-s" data-a="vacNew">+ Vacation pause</button></div></div>
  <h2>Weekly plan</h2>
  <div class="card"><p class="mu small" style="margin-top:0">Which days each active skill shows up as a quest. An event linked to a skill replaces its automatic quest that day.</p>
  ${active.length ? active.map(s => `<div class="list-item col"><div class="row"><span class="sp">${esc(s.name)}</span><span class="mu small num">${esc(fmtTarget(skillTarget(s.id, tk), s.unit))}</span></div>
    <div class="chips days" style="margin-top:8px">${WD.map((w, i) => `<button class="chip ${S.skills[s.id].days.includes(i) ? 'on' : ''}" data-a="skDay" data-id="${s.id}" data-d="${i}">${w}</button>`).join('')}</div></div>`).join('') : '<div class="mu small">No active skills. Turn some on in Profile → Skills.</div>'}
  </div>`;
}
function eventModal(ev) {
  const e = ev || { id: null, title: '', list: 'Training', skill: '', repeat: 'none', days: [dparse(ui.calSel || todayKey()).getDay()], start: ui.calSel || todayKey(), end: '', target: '', unit: '' };
  const lists = [...new Set([...S.lists, e.list].filter(Boolean))];
  openModal(`<h3>${ev ? 'Edit event' : 'New event'}</h3>
  <form id="evForm" onsubmit="return false">
  <label>Title</label><input name="title" value="${esc(e.title)}" placeholder="e.g. BJJ class">
  <div class="grid2"><div><label>List</label><select name="list">${lists.map(l => `<option ${l === e.list ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
  <div><label>Linked skill</label><select name="skill"><option value="">None</option>${SKL.filter(s => s.unit).map(s => `<option value="${s.id}" ${s.id === e.skill ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div></div>
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
  if (skill) skState(skill);
  const i = S.events.findIndex(x => x.id === e.id); if (i >= 0) S.events[i] = e; else S.events.push(e);
  closeModal(true); regenToday(); afterChange();
}
function vacModal() {
  const tk = todayKey(), active = SKL.filter(s => s.unit && (S.skills[s.id] || {}).active);
  openModal(`<h3>Vacation pause</h3><p class="mu small">Plan it ahead. Paused quests don't appear on those days. Days with nothing left don't touch your streak or give penalties.</p>
  <label>Label (optional)</label><input id="vNote" placeholder="e.g. Seoul trip">
  <div class="grid2"><div><label>First day</label><input id="vStart" type="date" min="${tk}" value="${addDays(tk, 1)}"></div><div><label>Last day</label><input id="vEnd" type="date" min="${tk}" value="${addDays(tk, 7)}"></div></div>
  <label class="check"><input type="checkbox" id="vAll"> Pause everything</label>
  <label>Pause these lists</label><div class="chips" id="vLists">${[...S.lists, 'Nutrition', 'Wind Down'].map(l => `<button class="chip" data-a="chipT" data-k="${esc(l)}">${esc(l)}</button>`).join('')}</div>
  ${active.length ? `<label>…or individual skills</label><div class="chips" id="vSkills">${active.map(s => `<button class="chip" data-a="chipT" data-k="${s.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="vacSave">Schedule pause</button></div>`);
}
function emModal() {
  ui.emDur = 3;
  openModal(`<h3 class="bad">Extreme emergency</h3><p class="mu">Pauses <b>every</b> quest starting today, penalties included. Your streak is frozen and no penalties are given. Any pending penalty exercises wait until you're back.</p>
  <label>How long?</label><div class="chips" id="emDur">${[[1, 'Today only'], [3, '3 days'], [7, '1 week'], [14, '2 weeks'], [0, 'Until I end it']].map(([v, n]) => `<button class="chip ${v === 3 ? 'on' : ''}" data-a="emDur" data-id="${v}">${n}</button>`).join('')}</div>
  <label>Note (optional)</label><input id="emNote" placeholder="Only you see this">
  <div class="actions"><button data-a="close">Cancel</button><button class="btn-bad" data-a="emStart">Pause everything</button></div>`, { cls: 'danger' });
}

/* ---------- views: log ---------- */
function viewLog() {
  return `<div class="seg"><button class="${ui.logSeg === 'workout' ? 'on' : ''}" data-a="logSeg" data-id="workout">Workouts</button><button class="${ui.logSeg === 'food' ? 'on' : ''}" data-a="logSeg" data-id="food">Food</button></div>` + (ui.logSeg === 'workout' ? viewWorkout() : viewFood());
}
function viewWorkout() {
  const k = todayKey(), groups = [...new Set(ACTIVITIES.map(a => a.group))];
  const todays = S.workouts.filter(w => w.date === k);
  const week = S.workouts.filter(w => w.date > addDays(k, -7));
  return `<div class="card"><h3>Log a workout</h3>
    <label>Activity</label><select id="wAct" data-c="wcalc">${groups.map(g => `<optgroup label="${g}">${ACTIVITIES.filter(a => a.group === g).map(a => `<option value="${a.id}" ${a.id === ui.lastAct ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('')}</select>
    <div class="grid2"><div><label>Minutes</label><input id="wMin" type="number" inputmode="numeric" value="45" data-i="wcalc"></div>
    <div id="wDistWrap"><label>Distance (${imperial() ? 'mi' : 'km'})</label><input id="wDist" type="number" step="0.1" inputmode="decimal" placeholder="optional"></div></div>
    <label>Intensity</label><div class="seg" style="margin-top:0">${['Light', 'Moderate', 'Vigorous'].map((n, i) => `<button class="${ui.intensity === i ? 'on' : ''}" data-a="int" data-id="${i}">${n}</button>`).join('')}</div>
    <div class="row est"><span class="mu small sp">Estimated burn</span><b id="wKcal" class="num">—</b></div>
    <button class="btn-p btn-big" data-a="wLog">Log workout</button>
    <p class="mu2 small">MET × your weight × time (2024 Compendium of Physical Activities). Linked skill quests fill in automatically.</p></div>
  <h2>Today</h2><div class="card">${todays.length ? todays.map(w => `<div class="list-item"><div class="sp"><div>${esc((ACT[w.act] || { name: w.act }).name)}</div><div class="mu small">${w.min} min · ${['light', 'moderate', 'vigorous'][w.int]}${w.auto ? ' · from quest' : w.practice ? ' · from practice' : ''}</div></div><span class="num">${w.kcal} kcal</span>${w.auto ? '' : `<button class="btn-g x" data-a="wDel" data-id="${w.id}" aria-label="Delete">✕</button>`}</div>`).join('') : '<div class="mu small">Nothing logged yet.</div>'}</div>
  <div class="grid3"><div class="stat"><b>${week.length}</b><span>Sessions · 7d</span></div><div class="stat"><b>${week.reduce((a, w) => a + w.min, 0)}</b><span>Minutes · 7d</span></div><div class="stat"><b>${week.reduce((a, w) => a + (w.kcal || 0), 0).toLocaleString()}</b><span>kcal · 7d</span></div></div>`;
}
function updateWkcal() {
  const a = $('#wAct'), m = $('#wMin'); if (!a || !m) return;
  $('#wKcal').textContent = workoutKcal(a.value, num(m.value) || 0, ui.intensity) + ' kcal';
  $('#wDistWrap').style.visibility = ['run', 'walk', 'hike'].includes(a.value) ? 'visible' : 'hidden';
}
function logWorkout() {
  const act = $('#wAct').value, min = Math.round(num($('#wMin').value) || 0); if (min <= 0) { toast('Enter minutes'); return; }
  let dist = ['run', 'walk', 'hike'].includes(act) ? num($('#wDist').value) : null; if (dist && imperial()) dist = dist / 0.621371;
  const a = ACT[act], k = todayKey(), w = { id: uid(), date: k, act, min, int: ui.intensity, kcal: workoutKcal(act, min, ui.intensity), skill: a.skill, xp: Math.round(min / 3), dist };
  ui.lastAct = act;
  S.workouts.push(w);
  addXp(a.skill, w.xp);
  if (a.skill) {
    skState(a.skill).min += min;
    const q = (S.days[k] || { q: [] }).q.find(x => x.skill === a.skill && !x.done);
    if (q && (q.unit === 'min' || (q.unit === 'km' && dist))) {
      q.progress = Math.round(((q.progress || 0) + (q.unit === 'km' ? dist : min)) * 10) / 10;
      if (q.progress >= q.target) { toast('Quest complete: ' + q.title, 'ti'); toggleQuest(q.key, []); return; }
    }
  }
  toast(`Logged ${min} min · ${w.kcal} kcal`); afterChange();
}
function kbar(s) {
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
      <div class="small" style="text-align:right"><div class="${st} num">${esc(dietMsg(s))}</div><div class="mu2">aim ${aimTxt(s)} kcal</div></div></div>
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
/* ---------- diet goal sheet ---------- */
function dietModal(keep) {
  if (!keep || !ui.dg) { const c = dietCfg(); ui.dg = Object.assign({ goal: GOAL_NAME[S.profile.goal] ? S.profile.goal : 'maintain', quest: S.profile.dietQuest !== false, own: !!c.maint }, c, { maint: c.maint || estMaint() }); }
  openModal(`<h3>Diet goal</h3><p class="mu small">Sets the daily calorie aim for the "Met diet requirements" quest, which checks itself from your food log.</p><div id="dgBody">${dgBody()}</div>
    <div class="actions"><button data-a="close">Cancel</button><button class="btn-p" data-a="dgSave">Save</button></div>`);
}
const dgDraft = () => { const d = ui.dg; return { goal: d.goal, diet: { maint: d.own ? d.maint : null, rule: d.rule, kcal: d.kcal, tol: d.tol, lo: d.lo, hi: d.hi, burn: d.burn } }; };
function dgAimTxt() {
  const d = ui.dg, need = d.goal !== 'custom' ? (d.own ? ['maint'] : []) : d.rule === 'range' ? ['lo', 'hi'] : d.rule === 'target' ? ['kcal', 'tol'] : ['kcal'];
  if (need.some(k => typeof d[k] !== 'number' || !isFinite(d[k]))) return '<span class="mu">Fill in the numbers to see today\'s aim.</span>';
  const a = dietAim(todayKey(), dgDraft());
  return `Today's aim <b class="num">${aimTxt(a)} kcal</b><div class="mu2 small">${esc(aimBreakdown(a))}</div>`;
}
function dgBody() {
  const d = ui.dg, tk = todayKey();
  const inp = (key, lab) => `<div><label>${lab}</label><input type="number" inputmode="numeric" data-i="dg" data-k="${key}" value="${d[key] ?? ''}"></div>`;
  let h = `<div class="seg goal4">${['cut', 'maintain', 'bulk', 'custom'].map(g => `<button class="${d.goal === g ? 'on' : ''}" data-a="dgGoal" data-id="${g}">${GOAL_NAME[g]}</button>`).join('')}</div>`;
  if (d.goal !== 'custom') {
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
  h += `<div class="dg-aim" id="dgAim">${dgAimTxt()}</div>
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
  if (d.goal !== 'custom' && d.own) { if (!ok(d.maint) || d.maint < KCAL_FLOOR || d.maint > 8000) return bad(`Maintenance should be between ${fmtK(KCAL_FLOOR)} and 8,000 kcal`); }
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
  return `<div class="grid2" style="margin-top:14px"><div class="stat"><b>${fmtW(w)}</b><span>Weight</span></div><div class="stat"><b>${bf != null ? bf + '%' : '—'}</b><span>Body fat</span></div></div>
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
  const segs = [['overview', 'Stats'], ['skills', 'Skills'], ['titles', 'Titles'], ['books', 'Books'], ['settings', 'Settings']];
  return `<div class="seg">${segs.map(([id, n]) => `<button class="${ui.profSeg === id ? 'on' : ''}" data-a="profSeg" data-id="${id}">${n}</button>`).join('')}</div>` + ({ overview: meOverview, skills: meSkills, titles: meTitles, books: meBooks, settings: meSettings })[ui.profSeg]();
}
function meOverview() {
  const o = overall(), rk = rankOf(o.L), titles = autoTitles();
  const hours = Object.values(S.skills).reduce((a, s) => a + (s.min || 0), 0) / 60;
  const kc = S.workouts.reduce((a, w) => a + (w.kcal || 0), 0), fb = S.books.filter(b => b.finished);
  const top = SKL.filter(s => S.skills[s.id] && (S.skills[s.id].xp > 0 || S.skills[s.id].active)).sort((a, b) => S.skills[b.id].xp - S.skills[a.id].xp).slice(0, 6);
  const tile = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  return `<div class="card row" style="gap:14px">${emblem(rk.tier, 60)}<div class="sp"><h3 style="font-size:18px">${esc(S.profile.name || 'Unnamed')}</h3>
    <div class="gold small">${esc(rk.name)} · Level ${o.L}</div><div class="bar gold"><i style="width:${o.into / o.need * 100}%"></i></div><div class="mu2 small num">${o.into} / ${o.need} XP · ${S.xp.toLocaleString()} total</div></div></div>
  <div class="grid3">${tile(S.streak.cur, 'Streak')}${tile(S.streak.best, 'Best streak')}${tile(S.stats.perfect, 'Perfect days')}
    ${tile(S.stats.qdone, 'Quests done')}${tile(S.workouts.length, 'Workouts')}${tile(kc.toLocaleString(), 'kcal burned')}
    ${tile(hours.toFixed(0), 'Hours trained')}${tile(fb.length, 'Books read')}${tile(titles.length + S.titles.claimed.length, 'Titles')}
    ${tile(S.stats.penalties, 'Penalties')}${tile(S.stats.penCleared, 'Cleared')}${tile('$' + S.stats.donated * 5, 'Donated')}</div>
  <h2>Health</h2><div class="card"><div class="hex-wrap">${radar(healthAxes())}</div></div>
  <h2>Discipline · Lv ${skLevel('discipline').L}</h2><div class="card"><div class="hex-wrap">${radar(SK.discipline.stats.map(st => ({ n: st.n, v: statValue('discipline', st) })))}</div></div>
  <h2>Top skills</h2><div class="card">${top.length ? top.map(s => { const l = skLevel(s.id); return `<div class="list-item"><span class="sp">${esc(s.name)}</span><span class="mu small num">Lv ${l.L}</span><div style="width:80px" class="bar"><i style="width:${l.into / l.need * 100}%"></i></div></div>`; }).join('') : '<div class="mu small">Complete quests to level up skills.</div>'}</div>`;
}
function skillCard(id) {
  const s = SK[id], st = skState(id), l = skLevel(id), open = ui.openSkill === id;
  const axes = s.stats.map(x => ({ n: x.n, v: statValue(id, x) }));
  let body = '';
  if (open) {
    body = `<div class="hex-wrap" style="margin-top:6px">${radar(axes, 230)}</div>`;
    if (s.unit) body += `<div class="mu small">Next target <b class="num">${esc(fmtTarget(skillTarget(id, todayKey()), s.unit))}</b> · difficulty ×${st.load.toFixed(2)} · ${(st.min / 60).toFixed(1)} h logged</div>`;
    if (s.custom) body += `<div class="mu2 small" style="margin-top:4px">Each side grows with the hours you put into that part. ${s.scale || 100} h on one part = 50 (average).</div>`;
    body += s.stats.map(x => statEditor(id, x)).join('');
    if (s.unit) {
      body += `<hr><div class="small mu">Log practice time</div>
        ${s.custom ? `<div class="chips" id="pf_${id}" style="margin:8px 0">${s.stats.map(x => `<button class="chip" data-a="chipT" data-k="${esc(x.k)}">${esc(x.n)}</button>`).join('')}</div><div class="mu2 small" style="margin-bottom:8px">No parts picked = split evenly.</div>` : ''}
        <div class="row" style="margin-top:6px"><input id="pm_${id}" type="number" inputmode="numeric" placeholder="Minutes" style="flex:1"><button class="btn-s" data-a="practice" data-id="${id}">Log</button></div>
        <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn-s" data-a="skLoad" data-id="${id}" data-v="0.85">Easier</button><button class="btn-s" data-a="skLoad" data-id="${id}" data-v="1.15">Harder</button><span class="sp"></span>
        ${s.custom ? `<button class="btn-s" data-a="csEdit" data-id="${id}">Edit skill</button>` : ''}<button class="btn-s" data-a="skToggle" data-id="${id}">${st.active ? 'Remove from quests' : 'Add to quests'}</button></div>`;
    }
  }
  return `<div class="card skill-card"><div class="row" data-a="skOpen" data-id="${id}" role="button"><div class="sp"><div>${esc(s.name)} <span class="mu small num">Lv ${l.L}</span>${s.custom ? ' <span class="pill">Custom</span>' : ''}</div>${s.custom ? `<div class="gold small">${esc(customRank(id))}</div>` : ''}
    <div class="bar" style="max-width:200px"><i style="width:${l.into / l.need * 100}%"></i></div></div><span class="chev ${open ? 'open' : ''}">${ICON.chev}</span></div>${body}</div>`;
}
function meSkills() {
  const active = SKL.filter(s => s.unit && S.skills[s.id] && S.skills[s.id].active);
  const cats = [...new Set(SKL.filter(s => s.unit).map(s => s.cat))];
  return `<div class="row" style="margin-top:14px"><p class="mu small sp" style="margin:0">Tap a skill to see its hexagon and rate its stats. The dashed ring is the average adult (50).</p><button class="btn-p btn-s" data-a="csNew">+ New skill</button></div>
  <h2>Active</h2>${skillCard('discipline')}${active.map(s => skillCard(s.id)).join('')}
  <h2>Library</h2><div class="card lib">${cats.map(cat => { const list = SKL.filter(s => s.cat === cat && s.unit); const on = list.filter(s => (S.skills[s.id] || {}).active).length;
    return `<details ${cat === 'Custom' ? 'open' : ''}><summary><span class="sp">${esc(cat)}</span><span class="mu2 small num">${on}/${list.length}</span>${ICON.chev}</summary>${list.map(s => { const a = (S.skills[s.id] || {}).active;
      return `<div class="list-item"><span class="sp">${esc(s.name)}</span><span class="mu2 small num">Lv ${skLevel(s.id).L}</span><button class="chip ${a ? 'on' : ''}" data-a="skToggle" data-id="${s.id}">${a ? 'Active' : 'Add'}</button></div>`; }).join('')}</details>`; }).join('')}</div>`;
}
function statEditor(id, x) {
  const st = skState(id);
  if (x.t === 'r') return `<label>${esc(x.n)}</label><select data-c="rate" data-id="${id}" data-k="${x.k}">${RATING_LABEL.slice(1).map((n, i) => `<option value="${i + 1}" ${(st.r[x.k] || 1) === i + 1 ? 'selected' : ''}>${i + 1} · ${n}</option>`).join('')}</select>`;
  if (x.t === 'cefr') return `<label>${esc(x.n)}</label><select data-c="cefr" data-id="${id}" data-k="${x.k}">${CEFR.map((n, i) => `<option value="${i}" ${(st.cefr[x.k] || 0) === i ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  if (x.t === 'scale') return `<label>${esc(x.n)}</label><select data-c="scale" data-id="${id}" data-k="${x.k}">${x.opts.map((n, i) => `<option value="${i}" ${(st.sc[x.k] || 0) === i ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  if (x.t === 'm') return `<div class="mu small" style="margin-top:8px">${esc(x.n)}: set in Body → Fitness tests</div>`;
  if (x.t === 'ch') return `<div class="row small" style="margin-top:6px"><span class="sp mu">${esc(x.n)}</span><span class="num">${((st.sm[x.k] || 0) / 60).toFixed(1)} h</span></div>`;
  return '';
}
function csModal(c) {
  const st = c ? skState(c.id) : null;
  const stats = c ? c.stats : [];
  const n = Math.max(6, stats.length);
  openModal(`<h3>${c ? 'Edit skill' : 'Create a skill'}</h3><p class="mu small">Your own skill, with its own hexagon. Each stat is one part of the skill; its side grows with the hours you log on that part.</p>
  <form id="csForm" onsubmit="return false">
  <label>Name</label><input name="name" value="${esc(c ? c.name : '')}" placeholder="e.g. Game Programming">
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
  <label>Calorie estimate uses</label><select name="act"><option value="">No calorie tracking</option>${ACTIVITIES.map(a => `<option value="${a.id}" ${c && c.act === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
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
  const def = { id: id || 'c_' + uid().slice(0, 8), name, role: (f.get('role') || '').trim(), list: f.get('list'), unit, base, max: Math.max(base, max || base * 4), phys: !!f.get('phys'), act: f.get('act') || null, scale: Math.max(1, num(f.get('scale')) || 100), stats };
  const i = S.customSkills.findIndex(c => c.id === def.id);
  if (i >= 0) S.customSkills[i] = def; else S.customSkills.push(def);
  rebuildSK();
  const st = skState(def.id); st.days = days;
  if (i < 0) { st.active = true; st.load = [1, 1, 1.6, 2.3][+f.get('lvl') || 1]; ui.openSkill = def.id; }
  closeModal(true); regenToday(); afterChange(); toast(i >= 0 ? 'Skill updated' : 'Skill created', 'ti');
}
function meTitles() {
  const auto = autoTitles(), cats = Object.keys(TITLE_CATALOG);
  const locked = titleTracks().filter(t => t.next && !t.hidden), groups = [...new Set(locked.map(t => t.group))];
  return `<h2>Earned · ${auto.length}</h2><div class="card">${auto.length ? auto.map(t => `<span class="title-badge auto" title="${esc(t.desc)}">${esc(t.name)}</span>`).join('') : '<div class="mu small">Titles unlock as you go. See what\'s next below.</div>'}</div>
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
  const p = S.profile, ft = Math.floor(p.heightCm / 2.54 / 12), inch = Math.round(p.heightCm / 2.54 - ft * 12);
  return `<div class="card" style="margin-top:14px"><h3>Profile</h3><form id="setForm" onsubmit="return false">
    <label>Name</label><input name="name" value="${esc(p.name)}">
    <div class="grid2"><div><label>Sex</label><select name="sex"><option value="M" ${p.sex === 'M' ? 'selected' : ''}>Male</option><option value="F" ${p.sex === 'F' ? 'selected' : ''}>Female</option></select></div><div><label>Birth year</label><input name="birthYear" type="number" value="${p.birthYear}"></div></div>
    <div class="grid2"><div><label>Height (${imperial() ? 'total in' : 'cm'})</label><input name="height" type="number" value="${imperial() ? Math.round(p.heightCm / 2.54) : p.heightCm}"></div><div><label>Units</label><select name="units"><option value="imperial" ${imperial() ? 'selected' : ''}>Imperial</option><option value="metric" ${!imperial() ? 'selected' : ''}>Metric</option></select></div></div>
    <div class="grid2"><div><label>Wake (day reset)</label><input name="wake" type="time" value="${p.wake}"></div><div><label>Sleep deadline</label><input name="sleep" type="time" value="${p.sleep}"></div></div>
    <label>Diet goal</label><div class="row dg-sum"><div class="sp small">${esc(dietSummary())}</div><button type="button" class="btn-s" data-a="dietGoal">Edit</button></div>
    <button class="btn-p btn-big" data-a="setSave">Save profile</button></form>
    <div class="mu2 small" style="margin-top:8px">${ft}′${inch}″ · started ${p.start ? fmtDate(p.start) : '—'}</div></div>
  ${szCard()}
  <div class="card"><h3>Quest lists</h3><div class="chips" style="margin:8px 0">${S.lists.map(l => `<span class="chip">${esc(l)}</span>`).join('')}</div>
    <div class="row"><input id="newList" placeholder="New list name"><button class="btn-s" data-a="listAdd">Add</button></div></div>
  <div class="card"><h3>Backup</h3><p class="mu small" style="margin-top:2px">Your data lives only on this phone. ${S.lastBackup ? 'Last backup: <b>' + fmtDate(S.lastBackup) + '</b>' : '<b>No backup yet.</b>'}</p>
    <p class="mu2 small">Back up now opens your share sheet: choose Google Drive, or Save to Files → iCloud Drive on iPhone. To restore, tap Restore and pick the file from Drive, iCloud or Downloads.</p>
    <div class="row wrap" style="gap:8px"><button class="btn-p" data-a="backup">${ICON.cloud} Back up now</button><button data-a="export">Download</button><button data-a="importOpen">Restore</button><input type="file" id="importFile" accept="application/json,.json,text/plain,.txt" hidden></div></div>
  <div class="card"><h3>About</h3><p class="mu small">Food: USDA National Nutrient Database for Standard Reference, Release 28 (public domain). Exercise burn: MET values from the Adult Compendium of Physical Activities. Population norms are rough approximations for motivation, not a medical assessment.</p>
    <button class="btn-g bad" data-a="reset">Erase all data</button></div>`;
}

/* ---------- backups ---------- */
const backupName = () => `deificatio-backup-${todayKey()}`;
function markBackup(msg) { S.lastBackup = todayKey(); S.backupSnooze = null; save(); render(); toast(msg, 'ti'); }
function downloadBackup() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = backupName() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); markBackup('Backup downloaded');
}
function shareBackup() {
  const data = JSON.stringify(S), opts = [new File([data], backupName() + '.json', { type: 'application/json' }), new File([data], backupName() + '.txt', { type: 'text/plain' })];
  const file = navigator.share && navigator.canShare ? opts.find(f => { try { return navigator.canShare({ files: [f] }); } catch (e) { return false; } }) : null;
  if (!file) { downloadBackup(); return; }
  navigator.share({ files: [file], title: 'Deificatio backup' }).then(() => markBackup('Backup saved')).catch(e => { if (!e || e.name !== 'AbortError') downloadBackup(); });
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
  regen: () => { regenToday(); afterChange(); toast('Quests refreshed'); },
  close: () => closeModal(true),
  chipT: el => el.classList.toggle('on'),
  focusDone: el => { const keys = chipsOn('#focusChips'); closeModal(true); toggleQuest(el.dataset.id, keys); },
  donated: () => {
    if (!$('#donchk').checked) { toast('Tick the box first'); return; }
    S.stats.donated += S.owed.length; S.owed = []; closeModal(true); afterChange();
  },
  finishSetup: () => finishSetup(),
  calSel: el => { ui.calSel = el.dataset.id; render(); },
  calNav: el => { const [y, m] = ui.calMonth.split('-').map(Number); const d = new Date(y, m - 1 + (+el.dataset.id), 1); ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  evNew: () => eventModal(null),
  evEdit: el => eventModal(S.events.find(e => e.id === el.dataset.id)),
  evSave: el => saveEvent(el.dataset.id),
  evDel: el => { if (!confirm('Delete this event (all repeats)?')) return; S.events = S.events.filter(e => e.id !== el.dataset.id); closeModal(true); regenToday(); afterChange(); },
  restToggle: el => { const k = el.dataset.id; S.rest = S.rest.includes(k) ? S.rest.filter(x => x !== k) : [...S.rest, k]; if (k === todayKey()) regenToday(); afterChange(); },
  skDay: el => { const s = skState(el.dataset.id), d = +el.dataset.d; s.days = s.days.includes(d) ? s.days.filter(x => x !== d) : [...s.days, d].sort(); regenToday(); afterChange(); },
  vacNew: () => vacModal(),
  vacSave: () => {
    const tk = todayKey(), start = $('#vStart').value, end = $('#vEnd').value, all = $('#vAll').checked;
    const lists = chipsOn('#vLists'), skills = $('#vSkills') ? chipsOn('#vSkills') : [];
    if (!start || !end) { toast('Pick both dates'); return; }
    if (start < tk) { toast("Pauses can't start in the past"); return; }
    if (end < start) { toast('Last day is before first day'); return; }
    if (!all && !lists.length && !skills.length) { toast('Pick what to pause'); return; }
    S.pauses.push({ id: uid(), type: 'vacation', start, end, all, lists: all ? [] : lists, skills: all ? [] : skills, note: $('#vNote').value.trim() });
    closeModal(true); if (start === tk) regenToday(); afterChange(); toast('Vacation pause scheduled');
  },
  emNew: () => emModal(),
  emDur: el => { ui.emDur = +el.dataset.id; $$('#emDur .chip').forEach(b => b.classList.toggle('on', b === el)); },
  emStart: () => {
    const k = todayKey(), d = ensureDay(k);
    if (d.q.some(q => q.pen && !q.done)) { S.pendingPen = { tier: Math.max(d.penTier || 1, (S.pendingPen || {}).tier || 0) }; delete d.penTier; }
    S.pauses.push({ id: uid(), type: 'emergency', all: true, start: k, end: ui.emDur ? addDays(k, ui.emDur - 1) : '', note: $('#emNote').value.trim() });
    closeModal(true); regenToday(); afterChange(); toast('All quests paused');
  },
  pEnd: el => { const p = S.pauses.find(x => x.id === el.dataset.id); if (!p) return; p.end = todayKey(); afterChange(); toast('Quests resume tomorrow'); },
  pCancel: el => { if (!confirm('Cancel this pause?')) return; S.pauses = S.pauses.filter(x => x.id !== el.dataset.id); regenToday(); ensureToday(); afterChange(); },
  logSeg: el => { ui.logSeg = el.dataset.id; render(); },
  int: el => { ui.intensity = +el.dataset.id; $$('[data-a=int]').forEach(b => b.classList.toggle('on', b === el)); updateWkcal(); },
  wLog: () => logWorkout(),
  wDel: el => {
    const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return;
    S.workouts = S.workouts.filter(x => x !== w);
    if (w.skill && SK[w.skill]) { const s = skState(w.skill); s.min = Math.max(0, s.min - w.min); const q = (S.days[w.date] || { q: [] }).q.find(x => x.skill === w.skill && !x.done); if (q) q.progress = Math.max(0, (q.progress || 0) - (q.unit === 'km' ? (w.dist || 0) : w.min)); }
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
  szReset: () => { S.szView = null; save(); szRefresh(); toast('Season display reset'); },
  szOpts: () => { closeModal(true); ui.tab = 'me'; ui.profSeg = 'settings'; render(); const c = $('#szCard'); if (c) window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 70); },
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
  skToggle: el => { const id = el.dataset.id, s = skState(id); s.active = !s.active; if (s.active && SK[id].cat === 'Faith') s.days = [0, 1, 2, 3, 4, 5, 6]; regenToday(); afterChange(); toast(s.active ? SK[id].name + ' added to quests' : SK[id].name + ' removed from quests'); },
  skLoad: el => { const s = skState(el.dataset.id); s.load = clamp(s.load * +el.dataset.v, 0.4, 6); regenToday(); afterChange(); },
  practice: el => { const id = el.dataset.id, m = Math.round(num($('#pm_' + id).value) || 0); if (m <= 0) { toast('Enter minutes'); return; } logPractice(id, m, SK[id].custom ? chipsOn('#pf_' + id) : []); },
  csNew: () => csModal(null),
  csEdit: el => csModal(SK[el.dataset.id]),
  csAddStat: () => { const n = $$('.csStat').length; if (n >= 8) { toast('8 stats max'); return; } $('#csStats').insertAdjacentHTML('beforeend', `<input class="csStat" data-k="" placeholder="Stat ${n + 1}" style="margin-bottom:6px">`); },
  csSave: el => saveCustomSkill(el.dataset.id),
  csDel: el => {
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
    p.name = f.get('name').trim(); p.sex = f.get('sex'); p.birthYear = +f.get('birthYear') || p.birthYear;
    if (h) p.heightCm = wasImp ? Math.round(h * 2.54) : h;
    p.units = f.get('units');
    const oldWake = p.wake; p.wake = f.get('wake') || p.wake; p.sleep = f.get('sleep') || p.sleep;
    if (oldWake !== p.wake) { save(); boot(); } else { regenToday(); afterChange(); }
    toast('Saved');
  },
  listAdd: () => { const n = $('#newList').value.trim(); if (!n) return; if (S.lists.includes(n)) { toast('List already exists'); return; } S.lists.push(n); afterChange(); },
  export: () => downloadBackup(),
  backup: () => shareBackup(),
  backupLater: () => { S.backupSnooze = todayKey(); save(); render(); },
  importOpen: () => {
    const i = $('#importFile'); if (!i) return;
    i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.profile || !d.days) throw 0; if (!confirm('Replace all current data with this backup?')) return; S = Object.assign(fresh(), d); rebuildSK(); save(); boot(); toast('Backup restored'); } catch (e) { toast('Not a valid backup file', 'bad'); } }); i.value = ''; };
    i.click();
  },
  reset: () => { if (!confirm('Erase ALL data? This cannot be undone.') || !confirm('Really erase everything?')) return; localStorage.removeItem(STORE); S = fresh(); rebuildSK(); boot(); },
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
  if (k === 'szChk') { szSet(o => { o.show[t.dataset.l][t.dataset.p] = t.checked ? 1 : 0; }); szRefresh(); }
  if (k === 'dgBurn' && ui.dg) { ui.dg.burn = t.checked; $('#dgAim').innerHTML = dgAimTxt(); }
  if (k === 'dgQuest' && ui.dg) ui.dg.quest = t.checked;
  if (k === 'fsCalc' && ui.fs) { fsRead(); $('#fsEnd').innerHTML = fsEndTxt(); }
  if (k === 'setupUnits') { const imp = t.value === 'imperial'; $('#hw').innerHTML = imp ? '<div><label>Height (ft)</label><input name="ft" type="number" value="5"></div><div><label>Height (in)</label><input name="in" type="number" value="10"></div>' : '<div><label>Height (cm)</label><input name="cm" type="number" value="178"></div><div></div>'; $('#wlab').textContent = imp ? 'Weight (lb)' : 'Weight (kg)'; }
});

/* ---------- boot ---------- */
function boot() {
  if (!S.setup) { renderSetup(); return; }
  evaluate(); ensureToday(); checkTitles(true); save(); render();
}
setInterval(() => { if (S.setup && todayKey() !== curDay) boot(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.setup && todayKey() !== curDay) boot(); });
window.addEventListener('DOMContentLoaded', () => { FIDX = null; if (S.setup && ui.tab === 'log' && ui.logSeg === 'food') render(); });
boot();
