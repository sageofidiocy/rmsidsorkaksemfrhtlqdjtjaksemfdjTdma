/* Deificatio solar-term themes (cyberpunk, cottagecore, mountain village, academia).
   The pictures in themes/ were painted with Google Gemini (prompts in Theme_art/PROMPTS.txt) with calm, neutral weather
   and blank signs. Everything that changes with the 24 solar terms is drawn here as transparent SVG layers on top:
   time of day and color grading (blend modes), weather (rain, snow, fog, wind, lightning, frost, dew, heat haze),
   seasonal life (petals, leaves, fireflies, dragonflies, geese) and, in the neon alley, the shop signs (in hangul or
   Japanese, with the current solar term on the biggest sign). When a term's name doesn't fit a theme (Lesser
   Fullness in a neon alley), the layers show the weather behind it instead (warm, humid haze and pollen).
   THEMEFX.render(theme, cal, ji) -> { img, layers: [{ svg, blend }], ui: { tint, accent, light } }
   Layers use the picture's own 768 x 1376 coordinates and are shown with object-fit: cover exactly like the picture. */
(function () {
  const W = 768, H = 1376, LIST = ['cyber', 'cottage', 'village', 'academia'];
  let seed = 1, defs = '', N = 0, REFL = [];
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, R = (a, b) => a + rnd() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const f = n => Math.round(n * 10) / 10, pick = a => a[Math.floor(rnd() * a.length)];
  const op = o => o != null && o !== 1 ? ` opacity="${f(o * 100) / 100}"` : '';
  const P = (d, c, o) => `<path d="${d}" fill="${c}"${op(o)}/>`;
  const S = (d, c, w = 2, o) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op(o)}/>`;
  const C = (x, y, r, c, o) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"${op(o)}/>`;
  const E = (x, y, rx, ry, c, o, rot) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}"${op(o)}${rot ? ` transform="rotate(${f(rot)} ${f(x)} ${f(y)})"` : ''}/>`;
  const RC = (x, y, w, h, c, o) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${c}"${op(o)}/>`;
  const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + 'Z';
  const rgb = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const hx = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hx(x.map((v, i) => v + (y[i] - v) * t)); };
  const shade = (c, t) => t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t);
  const lg = (stops, x2 = 0, y2 = 1) => { const id = 'tg' + (N++); defs += `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`; return `url(#${id})`; };
  const rg = (stops) => { const id = 'tg' + (N++); defs += `<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`; return `url(#${id})`; };
  // blur filters get an explicit region in canvas units, big enough for the whole blur (b = [x, y, w, h] of what's blurred).
  // (A region relative to the element's own box clipped the glow of small things into hard-edged rectangles.)
  const blur = (r, b) => { b = b || [-W * .1, -H * .1, W * 1.2, H * 1.2]; const m = r * 3 + 2, x = f(b[0] - m), y = f(b[1] - m), w = f(b[2] + 2 * m), h = f(b[3] + 2 * m);
    const id = `tb${r}_${x}_${y}_${w}_${h}`.replace(/\./g, 'p').replace(/-/g, 'n');
    if (!defs.includes(`id="${id}"`)) defs += `<filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><feGaussianBlur stdDeviation="${r}"/></filter>`; return `filter="url(#${id})"`; };
  const glow = (x, y, r, c, a) => C(x, y, r, rg([[0, c, a], [.45, c, a * .35], [1, c, 0]]));
  const full = (fill, o) => RC(-10, -10, W + 20, H + 20, fill, o);

  /* ---------- the pictures ---------- */
  // sky: where the sky ends; gnd: where the ground / street starts (for mist, dew, splashes); base: the picture's own light
  const GEO = {
    // street: the wet road surface (between the curbs) where the signs' reflections can show
    cyber_ko: { sky: 560, gnd: 1190, base: 'night', avg: '#483e77', street: [[270, 1193], [540, 1193], [797, 1376], [-27, 1376]] },
    cyber_ja: { sky: 470, gnd: 1170, base: 'night', avg: '#493466', pos: .68, street: [[390, 1140], [480, 1140], [775, 1376], [-23, 1376]] },
    cottage_ko_warm: { sky: 470, gnd: 820, avg: '#c2c7ae' }, cottage_ko_cold: { sky: 470, gnd: 820, avg: '#cfd0d1' },
    cottage_ja_warm: { sky: 420, gnd: 860, avg: '#b1bba1' }, cottage_ja_cold: { sky: 420, gnd: 860, avg: '#c4c8c7' },
    village_ko_warm: { sky: 330, gnd: 760, avg: '#c5cabd' }, village_ko_cold: { sky: 330, gnd: 760, avg: '#d3d6d6' },
    village_ja_warm: { sky: 320, gnd: 940, avg: '#b9c1b3' }, village_ja_cold: { sky: 320, gnd: 940, avg: '#cbd2d4' },
    academia_ko_warm: { sky: 560, gnd: 1130, avg: '#b9beaf' }, academia_ko_cold: { sky: 560, gnd: 1130, base: 'dusk', avg: '#796e6a' },
    academia_ja_warm: { sky: 560, gnd: 1150, avg: '#bfc1ad' }, academia_ja_cold: { sky: 560, gnd: 1150, base: 'dusk', avg: '#756d68' },
  };
  const seasonOfTerm = ji => ji >= 2 && ji <= 7 ? 'spring' : ji >= 8 && ji <= 13 ? 'summer' : ji >= 14 && ji <= 19 ? 'autumn' : 'winter';
  // cottage & village: the green picture from the Spring Equinox to Frost's Descent (graded gold in autumn), the snowy one
  // from the Start of Winter to the Awakening of Insects. Academia: light academia (blossom) from the Spring Equinox through
  // summer, dark academia from the Start of Autumn to the Awakening of Insects.
  function picture(theme, cal, ji) {
    if (theme === 'cyber') return `cyber_${cal}`;
    const warm = ji >= 5 && ji <= (theme === 'academia' ? 13 : 19);
    return `${theme}_${cal}_${warm ? 'warm' : 'cold'}`;
  }
  const images = (theme, cal) => theme === 'cyber' ? [`themes/cyber_${cal}.jpg`] : [`themes/${theme}_${cal}_warm.jpg`, `themes/${theme}_${cal}_cold.jpg`];
  const thumb = (theme, cal) => `themes/t_${theme}_${cal === 'ja' ? 'ja' : 'ko'}.jpg`;

  /* ---------- the 24 solar terms (index 0 = 小寒, like SEASONS.JEOLGI) ----------
     tod: light of the day. grade: color mood. fx: weather & life, extrapolated from what happens in that term. */
  const TERMS = [
    /* 小寒 Minor Cold   */ { tod: 'day', grade: 'icy', fx: [['snow', 60, .7], ['frost', .8], ['glint', 18]] },
    /* 大寒 Major Cold   */ { tod: 'overcast', grade: 'icy', fx: [['snow', 260, 1, 'heavy'], ['frost', 1], ['mist', .45]] },
    /* 立春 Start of Spring */ { tod: 'morning', grade: 'thaw', fx: [['snow', 16, .5], ['glint', 20], ['mist', .35], ['petals', 14, 'plum']] },
    /* 雨水 Rain Water   */ { tod: 'overcast', grade: 'thaw', fx: [['rain', 130, .5], ['mist', .45]] },
    /* 驚蟄 Insects Awaken */ { tod: 'storm', fx: [['rain', 200, .55], ['bolt'], ['mist', .3]] },
    /* 春分 Spring Equinox */ { tod: 'day', grade: 'spring', fx: [['petals', 46, 'cherry'], ['wind', 4, .16]] },
    /* 清明 Clear & Bright */ { tod: 'day', grade: 'bright', fx: [['petals', 110, 'cherry'], ['swallows', 4]] },
    /* 穀雨 Grain Rain   */ { tod: 'overcast', grade: 'spring', fx: [['rain', 150, .45], ['mist', .4], ['rainbow', .26]] },
    /* 立夏 Start of Summer */ { tod: 'day', grade: 'summer', fx: [['sun', 1], ['clouds', 2], ['motes', 26]] },
    /* 小満 Lesser Fullness */ { tod: 'golden', grade: 'summer', fx: [['clouds', 3], ['motes', 70], ['haze', .28]] },
    /* 芒種 Grain in Ear */ { tod: 'overcast', grade: 'humid', fx: [['rain', 150, .4, 'drizzle'], ['haze', .32]] },
    /* 夏至 Summer Solstice */ { tod: 'dusk', grade: 'summer', fx: [['fireflies', 44]] },
    /* 小暑 Minor Heat   */ { tod: 'storm', grade: 'humid', fx: [['rain', 360, .65, 'heavy'], ['mist', .5], ['splash', 70]] },
    /* 大暑 Major Heat   */ { tod: 'day', grade: 'heat', fx: [['thunderhead'], ['sun', 1.5], ['heat']] },
    /* 立秋 Start of Autumn */ { tod: 'golden', grade: 'lateSummer', fx: [['dragonflies', 7], ['leaves', 8, 'early']] },
    /* 處暑 End of Heat  */ { tod: 'dusk', grade: 'autumn', fx: [['wind', 10, .3], ['rain', 90, .4, 'slant']] },
    /* 白露 White Dew    */ { tod: 'morning', grade: 'autumn', fx: [['dew', 46], ['mist', .45]] },
    /* 秋分 Autumn Equinox */ { tod: 'golden', grade: 'autumn', fx: [['leaves', 30], ['geese', 1]] },
    /* 寒露 Cold Dew     */ { tod: 'dusk', grade: 'autumn', fx: [['geese', 2], ['leaves', 40], ['mist', .3]] },
    /* 霜降 Frost's Descent */ { tod: 'morning', grade: 'lateAutumn', fx: [['frost', .7], ['mist', .55], ['leaves', 50, 'red']] },
    /* 立冬 Start of Winter */ { tod: 'overcast', grade: 'cold', fx: [['wind', 14, .3], ['leaves', 40, 'brown']] },
    /* 小雪 Minor Snow   */ { tod: 'blue', grade: 'icy', fx: [['snow', 120, .85]] },
    /* 大雪 Major Snow   */ { tod: 'overcast', grade: 'icy', fx: [['snow', 320, 1, 'heavy'], ['mist', .5]] },
    /* 冬至 Winter Solstice */ { tod: 'night', grade: 'icy', fx: [['moon'], ['stars', 90], ['snow', 30, .5]] },
  ];
  const ACCENT = {
    cyber: { spring: '#ff6fae', summer: '#2ef2ff', autumn: '#ffb02e', winter: '#8ab8ff' },
    cottage: { spring: '#6a9a48', summer: '#3f8f6a', autumn: '#b8642a', winter: '#4f7fa0' },
    village: { spring: '#5a8a5a', summer: '#2f7a6a', autumn: '#a8552e', winter: '#3a5a7a' },
    academia: { spring: '#7a8a4f', summer: '#5f7a5a', autumn: '#c0605a', winter: '#d8b06a' },
  };
  // the tint the light of each time of day gives the cards
  const TOD_TINT = { morning: '#f0c8b0', golden: '#f0c890', dusk: '#a07890', blue: '#6a7aa0', overcast: '#9aa0a8', storm: '#5a6070', night: '#2a3050' };

  /* ---------- light & color (blend-mode layers) ---------- */
  function light(L, tod, g, cyber) {
    const b = g.base || 'day', sky = g.sky;
    if (cyber) { // already night: shift the neon mood instead
      if (tod === 'morning') L.soft += full(lg([[0, '#ff9a6a', 0], [.4, '#ff9a6a', .45], [1, '#ff9a6a', .1]]));
      if (tod === 'golden') L.soft += full('#ffb050', .3);
      if (tod === 'dusk') L.screen += glow(384, sky * .75, 520, '#ff4fa0', .28);
      if (tod === 'blue') L.mult += full('#6a7ad0', .35);
      if (tod === 'overcast') L.mult += full('#8a8aa0', .35), L.norm += full(lg([[0, '#7a7090', .25], [.5, '#7a7090', 0]]));
      if (tod === 'storm') L.mult += full('#5a5a78', .5), L.sat += full('#808080', .25);
      if (tod === 'night') L.mult += full('#3a3a80', .45);
      return;
    }
    const dusk = b === 'dusk', k = dusk ? .5 : 1;
    if (tod === 'morning') { L.soft += full(lg([[0, '#ffc0a0', .2], [sky / H, '#ffb08a', .6 * k], [1, '#ffd0b0', .15]])); L.screen += glow(W * .22, sky * .95, 560, '#ffd2a8', .4 * k); }
    if (tod === 'golden') { L.soft += full('#ffb050', .45 * k); L.screen += glow(W * .82, sky * .35, 640, '#ffdc8a', .32 * k); }
    if (tod === 'dusk' && !dusk) { L.mult += full(lg([[0, '#6a5aa0', .55], [sky / H, '#e08a7a', .5], [1, '#7a5a80', .5]])); L.screen += glow(W * .7, sky, 600, '#ffa070', .35); }
    if (tod === 'blue') L.mult += full(lg([[0, '#5a70b0', .55], [1, '#3a4a88', .6]]));
    if (tod === 'overcast') { L.sat += full('#808080', .4); L.mult += full('#a8b0bc', .4); L.norm += full(lg([[0, '#dfe3e8', .4], [sky / H, '#dfe3e8', .12], [1, '#dfe3e8', 0]])); }
    if (tod === 'storm') { L.sat += full('#808080', .45); L.mult += full('#5a6272', .6); L.norm += full(lg([[0, '#3a4050', .45], [sky / H, '#3a4050', 0]])); }
    if (tod === 'night') { L.mult += full('#1c2650', dusk ? .55 : .8); L.screen += full(lg([[0, '#3040a0', .2], [1, '#3040a0', 0]])); }
  }
  function grade(L, gr, g, cyber, coldArt) {
    const k = cyber ? .5 : g.base === 'dusk' ? .5 : 1;
    if (gr === 'icy') L.soft += full('#7ab0ff', .35 * k);
    if (gr === 'thaw') L.soft += full('#ffd0a8', .22 * k);
    if (gr === 'spring') L.soft += full('#ffc0d4', .22 * k);
    if (gr === 'bright') L.screen += full('#fff6e4', .1 * k), L.soft += full('#ffe0c0', .15 * k);
    if (gr === 'summer') L.soft += full('#ffe08a', .22 * k);
    if (gr === 'humid') L.norm += full(lg([[0, '#e8eee2', .08], [1, '#e8eee2', .2]]), k);
    if (gr === 'heat') L.soft += full('#ff9a40', .38 * k), L.screen += full(lg([[0, '#ffd080', .3], [.5, '#ffd080', 0]]), k);
    if (gr === 'lateSummer') L.soft += full('#ffc070', .28 * k);
    if (gr === 'autumn' || gr === 'lateAutumn') { // turns the green picture gold / red
      const late = gr === 'lateAutumn', a = coldArt || cyber ? .45 : 1;
      L.mult += full(late ? '#eaa070' : '#f0c080', (late ? .42 : .34) * a);
      L.soft += full(late ? '#c8402a' : '#e07030', (late ? .34 : .3) * a);
    }
    if (gr === 'cold') L.soft += full('#8aa0c0', .32 * k), L.sat += full('#808080', .22);
  }

  /* ---------- weather & life (normal / screen layers) ---------- */
  const leafPath = (s) => `M0 0 C${f(s * .3)} ${f(-s * .3)} ${f(s * .75)} ${f(-s * .26)} ${f(s)} 0 C${f(s * .75)} ${f(s * .26)} ${f(s * .3)} ${f(s * .3)} 0 0Z`;
  const FX = {
    snow(L, g, cy, n, a = 1, kind) {
      let s = '', near = '';
      for (let i = 0; i < n; i++) { const y = R(-10, H), r = R(1.2, 3.6) * (.6 + y / H * .7); s += C(R(-10, W + 10), y, r, '#ffffff', R(.5, .95) * a); }
      for (let i = 0; i < n * .08; i++) near += C(R(0, W), R(0, H), R(6, 11), '#ffffff', R(.35, .6) * a);
      L.norm += s + `<g ${blur(2.5)}>${near}</g>`;
      if (kind === 'heavy') { let st = ''; for (let i = 0; i < n * .4; i++) { const x = R(0, W), y = R(0, H); st += `M${f(x)} ${f(y)} l${f(-6)} ${f(14)} `; } L.norm += S(st, '#ffffff', 1.6, .4) + full(lg([[0, '#f4f6fa', .16], [1, '#f4f6fa', .3]])); }
      if (cy) L.norm += full(lg([[0, '#c8c0ff', 0], [1, '#c8c0ff', .08]]));
    },
    rain(L, g, cy, n, a = .5, kind) {
      const col = cy ? '#c8c0ff' : '#e2eaf2', sl = kind === 'slant' ? -26 : kind === 'heavy' ? -10 : -6, l0 = kind === 'drizzle' ? 10 : kind === 'heavy' ? 50 : 26, l1 = kind === 'drizzle' ? 22 : kind === 'heavy' ? 90 : 54;
      let far = '', near = '';
      for (let i = 0; i < n; i++) { const x = R(-40, W + 40), y = R(-60, H), l = R(l0, l1), d = `M${f(x)} ${f(y)} l${f(sl * l / 40)} ${f(l)} `; if (i % 3) far += d; else near += d; }
      L.norm += S(far, col, kind === 'drizzle' ? 1 : 1.3, a * .7) + S(near, col, kind === 'heavy' ? 2.4 : 1.9, a);
      L.norm += full(lg([[0, cy ? '#2a2050' : '#8a94a2', kind === 'heavy' ? .3 : .16], [1, cy ? '#2a2050' : '#8a94a2', kind === 'heavy' ? .2 : .06]]));
      if (cy) { // each sign's reflection runs down the wet road straight below it, in the sign's own color, only on the road
        const id = 'st' + (N++), top = Math.min(...g.street.map(p => p[1])); defs += `<clipPath id="${id}"><path d="${poly(g.street)}"/></clipPath>`;
        let s = ''; REFL.forEach(r => { const w = r.w * .5, gr = lg([[0, r.col, 0], [.12, r.col, .34], [.55, r.col, .16], [1, r.col, .05]]);
          s += `<g ${blur(5, [r.x - w, top, 2 * w, H - top])}>${RC(r.x - w / 2, top, w, H - top, gr)}</g>` + RC(r.x - w * .12, top, w * .24, H - top, lg([[0, r.col, 0], [.15, r.col, .3], [1, r.col, 0]])); });
        L.screen += `<g clip-path="url(#${id})">${s}</g>`; }
      else { let r = ''; for (let i = 0; i < 26; i++) { const y = R(g.gnd, H), w = R(10, 22) * (.6 + (y - g.gnd) / (H - g.gnd)); r += `<ellipse cx="${f(R(0, W))}" cy="${f(y)}" rx="${f(w)}" ry="${f(w * .28)}" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".45"/>`; } L.norm += r; }
    },
    splash(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) { const x = R(0, W), y = R(g.gnd, H), k = .6 + (y - g.gnd) / (H - g.gnd); s += `M${f(x - 6 * k)} ${f(y)} l${f(-3 * k)} ${f(-8 * k)} M${f(x)} ${f(y)} l0 ${f(-11 * k)} M${f(x + 6 * k)} ${f(y)} l${f(3 * k)} ${f(-8 * k)} `; } L.norm += S(s, cy ? '#d8d0ff' : '#ffffff', 1.4, .55); },
    mist(L, g, cy, a = .5) {
      const c = cy ? '#b8a8e8' : '#f2f4f6';
      [[g.sky, 420, a * .4], [g.gnd - 30, 380, a * .75], [H - 60, 300, a * .8]].forEach(([y, h, o]) => L.norm += RC(-10, y - h / 2, W + 20, h, lg([[0, c, 0], [.5, c, o], [1, c, 0]])));
    },
    haze(L, g, cy, a = .3) { L.norm += full(lg([[0, cy ? '#c8a0e0' : '#f6efdc', a * .6], [1, cy ? '#c8a0e0' : '#f6efdc', a]])); },
    petals(L, g, cy, n, kind) {
      const cols = kind === 'plum' ? ['#fff4f6', '#f6d2dc', '#fbe6ec'] : ['#f9c8d8', '#fde4ec', '#f4b0c8', '#ffffff'];
      let s = ''; for (let i = 0; i < n; i++) { const x = R(-10, W + 10), y = R(0, H), k = .6 + y / H * .9, r = R(0, 360); s += `<path d="M0 0 C${f(3 * k)} ${f(-4 * k)} ${f(9 * k)} ${f(-4 * k)} ${f(11 * k)} 0 L${f(9.5 * k)} ${f(1.2 * k)} L${f(11 * k)} ${f(2.6 * k)} C${f(9 * k)} ${f(5 * k)} ${f(3 * k)} ${f(4 * k)} 0 0Z" fill="${pick(cols)}" opacity="${f(R(.7, .95) * 100) / 100}" transform="translate(${f(x)} ${f(y)}) rotate(${f(r)})"/>`; }
      L.norm += s;
    },
    leaves(L, g, cy, n, kind) {
      const cols = kind === 'early' ? ['#c8c060', '#d8b04a', '#a8b050'] : kind === 'red' ? ['#c8302a', '#e0502e', '#b82a2a', '#e88a32'] : kind === 'brown' ? ['#8a5a2a', '#a0703a', '#6a4a2a', '#b8843a'] : ['#e08a2e', '#d8a83a', '#c8502e', '#e8c04a'];
      let s = ''; for (let i = 0; i < n; i++) { const x = R(-10, W + 10), y = R(0, H), k = .7 + y / H * .9; s += `<path d="${leafPath(16 * k)}" fill="${pick(cols)}" opacity="${f(R(.75, .95) * 100) / 100}" transform="translate(${f(x)} ${f(y)}) rotate(${f(R(0, 360))})"/>`; }
      L.norm += s;
    },
    wind(L, g, cy, n, a = .25) { let s = ''; for (let i = 0; i < n; i++) { const x = R(-100, W - 100), y = R(80, H - 120), l = R(160, 320); s += `M${f(x)} ${f(y)} q${f(l * .25)} ${f(-l * .08)} ${f(l * .5)} 0 t${f(l * .5)} 0 q${f(l * .12)} ${f(-l * .02)} ${f(l * .14)} ${f(-l * .1)} q${f(-l * .02)} ${f(-l * .08)} ${f(-l * .1)} ${f(-l * .04)} `; } L.norm += S(s, '#ffffff', 2.2, a); },
    frost(L, g, cy, a = 1) {
      [[0, H], [W, H], [0, 0], [W, 0]].forEach(([x, y], i) => L.norm += C(x, y, i < 2 ? 340 : 220, rg([[0, '#eef6ff', .6 * a], [.55, '#eef6ff', .25 * a], [1, '#eef6ff', 0]])));
      let s = ''; [[0, H, 1, -1], [W, H, -1, -1], [0, 0, 1, 1], [W, 0, -1, 1]].forEach(([x0, y0, dx, dy], ci) => {
        for (let k = 0; k < (ci < 2 ? 9 : 5); k++) { const a0 = R(0, Math.PI / 2), l = R(60, 180) * (ci < 2 ? 1 : .6); let x = x0, y = y0; const ex = x0 + dx * Math.cos(a0) * l, ey = y0 + dy * Math.sin(a0) * l; s += `M${f(x)} ${f(y)} L${f(ex)} ${f(ey)} `;
          for (let j = 1; j < 6; j++) { const t = j / 6, px = x + (ex - x) * t, py = y + (ey - y) * t, bl = l * .18 * (1 - t); s += `M${f(px)} ${f(py)} l${f(dx * bl * .7)} ${f(-dy * bl * .5)} M${f(px)} ${f(py)} l${f(-dx * bl * .4)} ${f(dy * bl * .8)} `; } }
      });
      L.norm += S(s, '#ffffff', 1.4, .55 * a);
    },
    glint(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) { const x = R(20, W - 20), y = R(g.gnd - 60, H - 60), r = R(4, 10); s += P(`M${f(x)} ${f(y - r)} L${f(x + r * .18)} ${f(y - r * .18)} L${f(x + r)} ${f(y)} L${f(x + r * .18)} ${f(y + r * .18)} L${f(x)} ${f(y + r)} L${f(x - r * .18)} ${f(y + r * .18)} L${f(x - r)} ${f(y)} L${f(x - r * .18)} ${f(y - r * .18)}Z`, '#ffffff', .9) + glow(x, y, r * 2.4, '#ffffff', .35); } L.screen += s; },
    dew(L, g, cy, n) { FX.glint(L, g, cy, Math.round(n * .5)); let s = ''; for (let i = 0; i < n; i++) { const x = R(0, W), y = R(g.gnd, H - 40), r = R(2, 4.5); s += C(x, y, r, '#eaf6ff', .55) + C(x - r * .3, y - r * .3, r * .35, '#ffffff', .95); } L.norm += s; },
    fireflies(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) { const x = R(20, W - 20), y = R(g.sky + 40, H - 120), c = cy ? pick(['#d8ff7a', '#7affd8']) : '#e8ff8a'; s += glow(x, y, R(14, 26), c, .55) + C(x, y, R(1.6, 2.8), '#f8ffd0'); } L.screen += s; },
    motes(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) s += glow(R(0, W), R(g.sky * .5, H - 100), R(4, 10), cy ? '#ffd0f0' : '#fff2c0', .6); L.screen += s; },
    sun(L, g, cy, k = 1) { if (cy) { L.screen += glow(384, g.sky * .7, 300 * k, '#ff8ac0', .3); return; } L.screen += glow(W * .86, 70, 420 * k, '#fff2c0', .55) + glow(W * .6, 260, 40 * k, '#fff6d8', .25) + glow(W * .45, 400, 22 * k, '#ffeec8', .2); },
    clouds(L, g, cy, n) {
      let s = ''; for (let i = 0; i < n; i++) { const x = R(40, W - 200), y = R(60, Math.max(120, g.sky * .55)), sc = R(.8, 1.3); s += cloud(x, y, sc, cy ? '#c8a0e8' : '#ffffff', cy ? .22 : .85); }
      L.norm += cy ? `<g ${blur(6)}>${s}</g>` : s;
    },
    thunderhead(L, g, cy) {
      if (cy) { FX.haze(L, g, cy, .22); return; }
      const x = W * .68, b = Math.max(240, g.sky * .85), top = 36, hgt = b - top; let s = '';
      for (let i = 0; i < 26; i++) { const t = i / 25, y = b - hgt * t, w = (130 - 70 * t) * R(.8, 1.1); s += C(x + R(-.5, .5) * w, y, w * R(.45, .62), mix('#ffffff', '#e4e8f0', R(0, 1) * (1 - t))); }
      s += E(x + 20, top + 14, 190, 30, '#ffffff') + E(x - 30, top + 22, 120, 24, '#f4f6fa');
      L.norm += `<g ${blur(2)} opacity=".9">${s}</g><g ${blur(14)}>${E(x, b + 6, 170, 30, '#c8ccd8', .75)}</g>`;
    },
    heat(L, g, cy) { let s = ''; for (let i = 0; i < 18; i++) { const y = R(g.gnd - 40, H - 60), x = R(-40, W - 100), l = R(120, 260); s += `M${f(x)} ${f(y)} q${f(l / 8)} -5 ${f(l / 4)} 0 t${f(l / 4)} 0 t${f(l / 4)} 0 t${f(l / 4)} 0 `; } L.norm += S(s, '#fff6e0', 2, .18); L.screen += full(lg([[0, '#ffb060', 0], [1, '#ffb060', .12]])); },
    bolt(L, g, cy) {
      const x0 = W * .7, y0 = 40, h = Math.max(260, g.sky * .9); let d = `M${f(x0)} ${y0}`, x = x0, y = y0, br = '';
      for (let i = 1; i <= 7; i++) { x += R(-36, 30); y = y0 + h * i / 7; d += ` L${f(x)} ${f(y)}`; if (i === 3) br = `M${f(x)} ${f(y)} l${f(-40)} ${f(46)} l${f(10)} ${f(30)}`; }
      L.screen += `<g ${blur(10)}>${S(d, '#c8d8ff', 26, .5)}</g>` + S(d, '#e8f0ff', 9, .55) + full(lg([[0, '#c8d0ff', .28], [.6, '#c8d0ff', 0]]));
      L.norm += S(d, '#ffffff', 3.4) + S(br, '#ffffff', 2, .9);
    },
    rainbow(L, g, cy, a = .3) { const cx = W * .3, cyy = g.sky + 160, r = Math.max(320, g.sky * .9); let s = ''; ['#ff6a6a', '#ffb060', '#ffe070', '#8ae08a', '#6ab0ff', '#9a80ff'].forEach((c, i) => s += S(`M${f(cx - r + i * 12)} ${f(cyy)} A${f(r - i * 12)} ${f(r - i * 12)} 0 0 1 ${f(cx + r - i * 12)} ${f(cyy)}`, c, 12, a)); L.screen += `<g ${blur(3)}>${s}</g>`; },
    swallows(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) { const x = R(60, W - 60), y = R(80, Math.max(160, g.sky * .8)), k = R(.8, 1.4); s += `<path d="M0 0 L-14 -7 L-26 -4 L-12 1 L-20 10 L-30 18 L-8 6 L0 4 L12 2 L18 -1Z" fill="#1c2030" transform="translate(${f(x)} ${f(y)}) scale(${f(k)}) rotate(${f(R(-20, 20))})"/>`; } L.norm += s; },
    dragonflies(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) { const x = R(60, W - 60), y = R(g.sky * .5, g.gnd), k = R(1.7, 2.5), c = cy ? '#ff6ad8' : '#b8382a';
      s += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)}) rotate(${f(R(-30, 30))})">${[[-7, -4, 9, -18], [-7, 4, 9, 18], [7, -4, 8, 18], [7, 4, 8, -18]].map(([wx, wy, wl, wr]) => `<ellipse cx="${wx}" cy="${wy}" rx="${wl}" ry="2.6" fill="#8a96a8" fill-opacity=".3" stroke="#4a5262" stroke-width=".5" stroke-opacity=".6" transform="rotate(${wr} ${wx} ${wy})"/>`).join('')}${S('M-2 0 L-26 0', c, 2.4)}${C(1, 0, 2.6, c)}</g>`; } L.norm += s; },
    geese(L, g, cy, n) { let s = ''; for (let k = 0; k < n; k++) { const ax = R(W * .25, W * .75), ay = R(80, Math.max(140, g.sky * .6)), sc = R(.8, 1.1); for (let i = -4; i <= 4; i++) { const x = ax + i * 22 * sc, y = ay + Math.abs(i) * 12 * sc; s += S(`M${f(x - 7 * sc)} ${f(y - 3 * sc)} q${f(4 * sc)} ${f(-2 * sc)} ${f(7 * sc)} ${f(3 * sc)} q${f(3 * sc)} ${f(-5 * sc)} ${f(7 * sc)} ${f(-3 * sc)}`, cy ? '#2a1a40' : '#2a2a34', 2); } } L.norm += s; },
    moon(L, g, cy) { const x = W * .2, y = 150; L.screen += glow(x, y, 220, '#dfe6ff', .4); L.norm += C(x, y, 34, '#f6f2e2') + C(x - 9, y - 6, 7, '#e2dcc8', .6) + C(x + 10, y + 9, 5, '#e2dcc8', .5); },
    stars(L, g, cy, n) { let s = ''; for (let i = 0; i < n; i++) s += C(R(0, W), R(0, g.sky * .85) * R(.3, 1), R(.8, 2), '#ffffff', R(.4, .95)); L.screen += s; },
  };
  function cloud(x, y, s, c, o) { // a soft cumulus: overlapping puffs on a rounded base, slightly blurred like paint
    let g = E(x + 75 * s, y + 18 * s, 110 * s, 26 * s, shade(c, -.1));
    [[0, 0, 38], [40, -22, 48], [92, -14, 44], [130, 4, 32], [62, 8, 40], [20, 12, 30], [108, 14, 30]].forEach(([dx, dy, r]) => g += C(x + dx * s, y + dy * s, r * s * R(.9, 1.1), c));
    return `<g opacity="${o}" ${blur(1.5)}>${g}${E(x + 70 * s, y - 20 * s, 40 * s, 16 * s, '#ffffff', .6)}</g>`; }

  /* ---------- the neon alley's signs ----------
     Every panel was measured on the painting itself (Deificatio_dev_tools/measure_signs.py): each side of a panel is found
     from many scanlines across it and fitted as a line, so the shapes sit exactly on the painted panels.
       o  = the lit outline (outer edge of the light tube; Japanese panels have no tube, so the lit face itself)
       f  = the face the letters glow on (Korean: inside the painted tube; Japanese: the lit face pulled in evenly)
       x  = things painted in FRONT of the panel (wires, a roof edge, a box): no frame color or letters are drawn over them;
            xs = they're solid (a roof, a box), so the face isn't darkened over them either (a thin dark wire just stays dark)
       tq = the quad the letters are laid out in when f isn't a plain quad (the tilted sign, the arched one)
     c = the frame's palette slot, tc = the letters' slot. The letters are mapped through the panel's perspective
     (each glyph gets the local slant of the panel at its own position), clipped to the face. */
  const SIGNS = {
    cyber_ko: [
      {o:[[36.6,816.4],[115.3,872.4],[114.0,944.7],[34.5,906.1]],f:[[39.4,822.2],[112.0,873.9],[110.8,939.8],[37.4,904.2]],c:0,tc:1,t:'food',fs:25},  // food
      {o:[[221.9,854.7],[260.4,854.7],[260.2,946.8],[220.4,946.5]],f:[[225.1,857.7],[257.4,857.8],[257.1,945.3],[223.7,945.1]],c:2,tc:0,t:'노래방',v:1},  // norae
      {o:[[231.6,969.8],[307.2,969.8],[306.9,1007.2],[231.3,1007.1]],f:[[234.4,973.0],[303.8,973.0],[303.6,1004.0],[234.1,1003.9]],c:1,tc:0,t:'편의점'},  // pyeon
      {o:[[403.0,843.2],[425.1,842.6],[425.0,894.8],[403.5,894.4]],f:[[404.9,845.1],[422.6,844.5],[422.6,892.8],[405.4,892.5]],x:[[[405.2,878.0],[405.0,882.5],[405.8,883.5],[405.0,884.2],[405.0,893.5],[412.5,893.8],[413.8,892.5],[413.8,891.2],[411.5,889.0],[408.2,887.8],[406.8,885.8],[406.8,883.0],[408.8,879.2],[407.2,878.8],[406.5,878.0]]],c:0,tc:1,t:'술집',v:1,xs:1},  // suljip
      {o:[[475.7,756.9],[503.2,759.8],[504.5,830.4],[475.6,830.2]],f:[[478.8,760.0],[499.1,762.2],[500.3,825.9],[478.6,825.7]],x:[[[477.0,796.2],[477.2,802.8],[477.8,802.5],[478.5,801.0],[481.2,802.8],[483.5,803.0],[484.2,803.8],[485.5,804.0],[488.2,805.8],[489.8,805.8],[491.2,806.8],[492.8,806.8],[494.2,807.8],[496.5,808.0],[497.2,808.8],[500.5,809.0],[502.2,810.8],[503.8,809.5],[503.5,809.0],[502.2,808.8],[501.5,808.0],[499.0,808.0],[497.5,807.0],[496.0,807.0],[494.5,806.0],[492.2,805.8],[489.5,804.0],[487.2,803.8],[484.5,802.0],[482.2,801.8],[481.5,801.0],[478.2,799.8],[478.0,798.5],[478.5,798.0],[479.2,798.8],[481.8,798.8],[483.2,799.8],[486.8,799.8],[488.2,800.8],[491.5,801.0],[492.2,801.8],[496.8,801.8],[498.2,802.8],[500.5,803.0],[501.2,804.8],[503.8,803.5],[503.5,801.0],[498.0,801.0],[496.5,800.0],[493.0,800.0],[491.5,799.0],[488.2,798.8],[487.5,798.0],[484.0,798.0],[482.5,797.0],[480.0,797.0],[478.5,796.0]]],c:0,tc:2,t:'분식',v:1},  // bunsik
      {o:[[508.1,815.7],[548.2,815.7],[549.8,929.4],[509.3,929.3]],f:[[511.8,819.0],[545.0,819.0],[546.5,925.8],[512.9,925.8]],c:1,tc:0,t:'shop',v:1},  // shop
      {o:[[570.6,747.7],[627.9,747.7],[631.6,900.6],[573.6,901.1]],f:[[576.4,753.2],[622.7,753.3],[626.1,895.2],[579.2,895.6]],c:2,tc:1,t:'term',v:1},  // term
      {o:[[634.0,919.6],[699.0,873.2],[700.8,942.2],[634.9,973.8]],f:[[639.6,922.8],[693.6,884.4],[695.0,938.7],[640.3,965.0]],c:2,tc:0,t:'PC방',fs:19},  // pc
      {o:[[505.7,950.7],[605.8,950.7],[605.8,993.3],[505.8,993.4]],f:[[510.0,954.2],[601.7,954.3],[601.8,989.5],[510.0,989.6]],c:0,tc:1,t:'item'},  // item
      {o:[[380.6,661.9],[388.2,661.9],[388.3,678.2],[380.6,678.0]],f:[[382.0,663.0],[386.9,663.0],[387.1,677.0],[382.0,676.9]],c:1,tc:1,t:'약'},  // yak
      {o:[[490.3,704.5],[488.9,705.9],[489.5,707.6],[489.5,718.5],[490.3,719.2],[494.5,719.2],[495.2,718.5],[495.2,707.3],[492.5,704.5]],f:[[491.0,705.5],[490.0,706.5],[490.0,718.2],[490.5,718.8],[494.2,718.8],[494.8,718.2],[494.8,710.5],[493.8,709.2],[493.8,706.5]],c:0,tc:0,t:'빵',tq:[[490.0,705.5],[494.8,705.5],[494.8,718.8],[490.0,718.8]]},  // ppang
      {o:[[441.9,809.9],[454.4,809.7],[454.7,823.3],[441.8,823.3]],f:[[443.3,811.1],[452.9,811.0],[453.1,821.2],[443.2,821.3]],c:0,tc:1,t:'밥'},  // bap
      {o:[[476.0,836.4],[505.0,835.0],[505.1,851.6],[476.5,852.1]],f:[[478.1,838.0],[503.2,836.7],[503.3,850.0],[478.5,850.4]],c:1,tc:2,t:'치킨'},  // chikin
    ],
    cyber_ja: [
      {o:[[641.7,467.9],[719.1,467.9],[719.1,605.8],[641.7,606.0]],f:[[647.2,473.4],[713.6,473.4],[713.6,600.3],[647.2,600.5]],c:0,tc:1,t:'term',v:1},  // term
      {o:[[641.3,629.9],[719.3,630.0],[719.3,771.0],[641.3,771.2]],f:[[646.8,635.5],[713.8,635.5],[713.8,765.5],[646.8,765.7]],c:1,tc:0,t:'居酒屋',v:1},  // izakaya
      {o:[[641.5,794.4],[719.1,794.4],[719.1,855.3],[641.4,855.4]],f:[[646.5,799.4],[714.1,799.4],[714.1,850.3],[646.4,850.4]],c:2,tc:1,t:'kana'},  // kana
      {o:[[547.8,633.6],[597.2,633.7],[597.2,721.1],[547.7,721.0]],f:[[552.3,638.1],[592.7,638.1],[592.7,716.5],[552.2,716.5]],c:0,tc:1,t:'food',v:1},  // food
      {o:[[547.5,736.6],[597.6,736.7],[597.3,826.4],[547.6,826.4]],f:[[552.0,741.1],[593.1,741.2],[592.8,821.9],[552.1,821.9]],c:1,tc:2,t:'カラオケ',v:1},  // karaoke
      {o:[[547.6,841.5],[597.4,841.3],[597.2,930.3],[547.6,930.3]],f:[[552.1,846.0],[592.9,845.9],[592.7,925.8],[552.1,925.8]],c:2,tc:0,t:'item',v:1},  // item
      {o:[[212.9,921.8],[256.7,955.9],[256.4,996.9],[213.0,970.8]],f:[[216.9,930.0],[252.7,957.9],[252.5,989.8],[217.0,968.6]],c:1,tc:0,t:'薬局',fs:17},  // yakkyoku
      {o:[[611.3,895.1],[640.3,867.8],[661.2,867.7],[675.0,912.5],[627.6,943.4]],f:[[616.5,896.4],[642.1,872.3],[657.9,872.3],[669.7,910.6],[630.0,936.4]],c:0,tc:1,t:'one',fs:30,tq:[[616.5,896.4],[656.2,870.6],[669.7,910.6],[630.0,936.4]]},  // one
      {o:[[474.3,973.3],[486.4,973.3],[486.7,992.4],[474.7,992.4]],f:[[476.3,975.2],[484.6,975.2],[484.7,990.5],[476.6,990.5]],c:0,tc:1,t:'ス'},  // su
      {o:[[474.2,995.8],[486.7,995.5],[486.9,1015.2],[473.9,1015.5]],f:[[476.1,997.7],[484.8,997.5],[484.9,1013.3],[475.8,1013.5]],c:1,tc:0,t:'ナ'},  // na
      {o:[[474.3,1019.1],[486.9,1019.3],[487.2,1038.2],[474.5,1038.1]],f:[[476.2,1021.0],[485.0,1021.2],[485.3,1036.3],[476.4,1036.2]],c:1,tc:0,t:'ッ'},  // tsu
      {o:[[473.7,1043.3],[487.2,1043.3],[487.2,1053.1],[473.6,1053.2]],f:[[475.4,1045.0],[485.5,1045.0],[485.5,1051.4],[475.3,1051.4]],c:2,tc:1,t:'ク'},  // ku
      {o:[[502.5,989.8],[521.2,989.7],[521.1,1020.7],[502.3,1022.5]],f:[[504.9,992.3],[518.7,992.2],[518.6,1018.4],[504.9,1019.7]],x:[[[511.4,1009.4],[523.2,1009.4],[523.2,1030.5],[511.4,1030.5]]],c:0,tc:1,t:'寿司',v:1,xs:1},  // sushi
      {o:[[501.5,982.3],[501.5,986.5],[502.3,987.2],[520.5,987.2],[521.2,986.5],[521.2,981.3],[520.5,980.5],[508.3,980.5],[507.1,981.5],[502.3,981.5]],c:0},  // sushiHead
      {o:[[378.1,1016.7],[400.4,1024.7],[400.4,1042.8],[377.8,1036.9]],f:[[380.6,1020.2],[397.9,1026.4],[397.9,1039.5],[380.4,1034.9]],c:0,tc:1,t:'喫茶'},  // kissa
    ],
  };
  const SIGN_WORDS = {
    ko: { spring: { food: '딸기', shop: '꽃집', item: '벚꽃' }, summer: { food: '빙수', shop: '냉면', item: '수박' }, autumn: { food: '군밤', shop: '전어', item: '단풍' }, winter: { food: '호떡', shop: '어묵', item: '군고구마' } },
    ja: { spring: { food: '花見', item: '団子', one: '桜' }, summer: { food: 'かき氷', item: '冷麺', one: '氷' }, autumn: { food: '月見', item: '焼栗', one: '月' }, winter: { food: 'おでん', item: '焼芋', one: '鍋' } },
  };
  const NEON = { spring: ['#ff6fae', '#86d846', '#ffcf40'], summer: ['#2ef2ff', '#1fd696', '#ff5ad8'], autumn: ['#ffb02e', '#ff5a3d', '#ffcc48'], winter: ['#7ab8ff', '#c08aff', '#46d8c0'] };
  const lumOf = c => { const v = rgb(c).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const FONT = { ko: "'Noto Sans KR','Noto Sans CJK KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", ja: "'Noto Sans JP','Noto Sans CJK JP','Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif" };
  // square -> quad (TL, TR, BR, BL), projective (Heckbert), so letters follow a panel seen in perspective
  function homog(q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q, dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    let g = 0, h = 0; const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) { g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den; }
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
    return (u, v) => { const z = g * u + h * v + 1; return [(a * u + b * v + x0) / z, (d * u + e * v + y0) / z]; };
  }
  const f3 = n => Math.round(n * 1000) / 1000, dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  const boxOf = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x = Math.min(...xs), y = Math.min(...ys); return [x, y, Math.max(...xs) - x, Math.max(...ys) - y]; };
  const adv = ch => /[\u0000-ɏ]/.test(ch) ? .62 : 1; // Latin letters are narrower than hangul / kanji / kana
  function signs(L, pic, cal, ji, season) {
    const pal = NEON[season], words = SIGN_WORDS[cal][season], J = window.SEASONS, font = FONT[cal];
    const termHj = cal === 'ja' ? J.JA.TERMS[ji][0] : J.JEOLGI[ji][0], termKo = J.JEOLGI[ji][1], kana = cal === 'ja' ? J.JA.TERMS[ji][1] : '';
    let halos = '', frames = ''; const hb = [];
    SIGNS[pic].forEach((sg, si) => {
      const col = pal[sg.c], hotF = lumOf(col) > .5, ob = boxOf(sg.o);
      // the mask that keeps things painted in front of the panel uncovered (only as big as the panel, so it stays cheap)
      const occ = sg.x ? (() => { const id = 'sx' + (N++), [x, y, w, h] = [ob[0] - 3, ob[1] - 3, ob[2] + 6, ob[3] + 6];
        defs += `<mask id="${id}" maskUnits="userSpaceOnUse" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}">${RC(x, y, w, h, '#fff')}<path d="${sg.x.map(poly).join(' ')}" fill="#000" fill-rule="evenodd"/></mask>`; return ` mask="url(#${id})"`; })() : '';
      // the frame, recolored for the season: a soft spill of light on the wall, then the exact lit outline (no blur, no gap)
      halos += P(poly(sg.o), col) + S(poly(sg.o), col, 14, .6); hb.push(...sg.o);
      frames += sg.x ? `<g${occ}>${P(poly(sg.o), col)}</g>` : P(poly(sg.o), col);
      if (!sg.f) return; // a lit strip with no face (the sushi bar's header)
      REFL.push({ x: ob[0] + ob[2] / 2, w: ob[2], col });
      const tc = pal[sg.tc ?? (sg.c + 1) % 3], hotT = lumOf(tc) > .5, q = sg.tq || sg.f, M = homog(q);
      const w = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2, h = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2, small = Math.min(w, h) < 16;
      // a dark face for the tubes to glow on (dimmer frames for the glary colors)
      L.mult += `<g${sg.xs ? occ : ''}>${P(poly(sg.f), '#160c26', .9)}${hotF ? `<path d="${poly(sg.o)} ${poly(sg.f)}" fill="#7a7a86" fill-rule="evenodd" opacity=".75"/>` : ''}</g>`;
      const cid = 'sc' + (N++); defs += `<clipPath id="${cid}"><path d="${poly(sg.f)}"/></clipPath>`;
      const at = (x, y) => { const p = M(x / w, y / h), ex = M((x + .5) / w, y / h), ey = M(x / w, (y + .5) / h);
        return `matrix(${f3((ex[0] - p[0]) * 2)} ${f3((ex[1] - p[1]) * 2)} ${f3((ey[0] - p[0]) * 2)} ${f3((ey[1] - p[1]) * 2)} ${f(p[0])} ${f(p[1])})`; };
      // one <text> per glyph, each placed through the panel's perspective at its own position
      const txt = (s, x, y, fs, sw, ls = 0) => { const cs = [...s], tot = cs.reduce((a, ch) => a + adv(ch) * fs, 0) + ls * (cs.length - 1); let xx = x - tot / 2, o = '';
        cs.forEach(ch => { const aw = adv(ch) * fs; o += `<text transform="${at(xx + aw / 2, y)}" font-size="${f(fs)}" stroke-width="${f(fs * sw)}">${ch}</text>`; xx += aw + ls; }); return o; };
      const pad = small ? .35 : 1.2 + Math.min(w, h) * .03, iw = w - 2 * pad, ih = h - 2 * pad, cx = w / 2;
      const lay = sw => {
        let g = '';
        if (sg.t === 'term') {
          if (cal === 'ko') { // hangul big, a clear gap, then the hanja small (no rule line: it fused with the last jamo)
            const fs = Math.min(iw * .82, ih / 3.5), fh = fs * .42, top = pad + (ih - fs * 3.45) / 2;
            g += txt(termKo[0], cx, top + fs * .55, fs, sw) + txt(termKo[1], cx, top + fs * 1.7, fs, sw) + txt(termHj[0], cx, top + fs * 2.45 + fh * .6, fh, sw) + txt(termHj[1], cx, top + fs * 2.45 + fh * 1.78, fh, sw); }
          else { const fs = Math.min(iw * .86, ih / 2.14); g += txt(termHj[0], cx, h / 2 - fs * .53, fs, sw) + txt(termHj[1], cx, h / 2 + fs * .53, fs, sw); }
        } else {
          const str = sg.t === 'kana' ? kana : words[sg.t] || sg.t, chars = [...str];
          if (sg.v) { const gap = cal === 'ko' ? 1.16 : 1.06, fs = Math.min(iw * .84, ih / (chars.length * gap)), y = h / 2 - (chars.length - 1) * fs * gap / 2; chars.forEach((ch, i) => g += txt(ch, cx, y + i * fs * gap, fs, sw)); }
          else { const units = chars.reduce((a, ch) => a + adv(ch), 0), fs = Math.min(sg.fs || 99, ih * .8, iw / (units * (cal === 'ko' ? 1.1 : 1.04) + (chars.length > 1 && cal === 'ko' ? .06 * (chars.length - 1) : 0))); g += txt(str, cx, h / 2, fs, sw, cal === 'ko' ? fs * .06 : 0); }
        }
        return g;
      };
      const tAttr = (fill, stroke) => `font-family="${font}" font-weight="${cal === 'ko' ? 700 : 800}" fill="${fill}" stroke="${stroke}" stroke-linejoin="round" paint-order="stroke" text-anchor="middle" dominant-baseline="central"`;
      const fb = boxOf(sg.f);
      // a tight glow (not a haze), then a bright core with a thin colored edge; all of it stays on the face, behind anything in front
      L.screen += `<g clip-path="url(#${cid})"${occ}>${P(poly(sg.f), tc, .05)}<g ${blur(small ? .9 : 2, fb)} opacity="${hotT ? .32 : .55}" ${tAttr(tc, tc)}>${lay(.12)}</g><g ${blur(small ? .35 : .7, fb)} opacity="${hotT ? .5 : .8}" ${tAttr(tc, tc)}>${lay(.05)}</g></g>`;
      L.text += `<g clip-path="url(#${cid})"${occ} ${tAttr(hotT ? mix(tc, '#ffffff', .12) : mix(tc, '#ffffff', .5), hotT ? shade(tc, -.25) : tc)}>${lay(small ? .025 : .035)}</g>`;
    });
    const b = boxOf(hb); // all the spills blurred together (one filter), then every exact frame on top (a neighbor's spill never tints a panel)
    L.color += `<g ${blur(9, [b[0] - 7, b[1] - 7, b[2] + 14, b[3] + 14])} opacity=".5">${halos}</g>` + frames;
  }

  /* ---------- assemble ---------- */
  const ORDER = [['mult', 'multiply'], ['sat', 'saturation'], ['soft', 'soft-light'], ['color', 'color'], ['screen', 'screen'], ['text', 'normal'], ['norm', 'normal']];
  const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
  function render(theme, cal, ji) {
    cal = cal === 'ja' ? 'ja' : 'ko'; ji = ((+ji || 0) % 24 + 24) % 24; if (!LIST.includes(theme)) theme = 'cyber';
    const pic = picture(theme, cal, ji), g = GEO[pic], T = TERMS[ji], season = seasonOfTerm(ji), cy = theme === 'cyber', coldArt = /_cold$/.test(pic);
    seed = 7 + ji * 7919 + LIST.indexOf(theme) * 104729 + (cal === 'ja' ? 31337 : 0); defs = ''; N = 0; REFL = [];
    const L = { mult: '', sat: '', soft: '', color: '', screen: '', text: '', norm: '' };
    light(L, T.tod, g, cy); if (T.grade) grade(L, T.grade, g, cy, coldArt);
    if (cy) signs(L, pic, cal, ji, season);
    T.fx.forEach(([name, ...a]) => FX[name](L, g, cy, ...a));
    const layers = []; ORDER.forEach(([k, blend]) => { if (L[k]) { if (blend === 'normal' && layers.length && layers[layers.length - 1].blend === 'normal') layers[layers.length - 1].body += L[k]; else layers.push({ blend, body: L[k] }); } });
    const light2 = theme === 'cyber' ? false : theme === 'academia' ? !coldArt : true;
    return {
      img: `themes/${pic}.jpg`, pic, pos: g.pos ?? .5, layers: layers.map(l => ({ blend: l.blend, svg: wrap(l.body) })),
      ui: { tint: TOD_TINT[T.tod] && !cy ? mix(g.avg, TOD_TINT[T.tod], .35) : g.avg, accent: ACCENT[theme][season], light: light2 },
    };
  }
  window.THEMEFX = { render, images, thumb, picture, LIST, W, H, TERMS };
})();
