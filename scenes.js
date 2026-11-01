/* Deificatio scenes: layered flat landscapes for the 72 micro-seasons (七十二候).
   Pure SVG drawn on the fly, no image files. Every pentad has its own composition and the thing its name
   describes sits in the middle of the picture. Canvas is 400 x 860 (a phone screen); the page shows it with
   preserveAspectRatio "xMidYMid slice" so it always covers the whole screen.
   SCENES.render(sceneKey, season, idx) -> svg markup. Only idx and season are used (sceneKey kept for compatibility). */
(function () {
  const W = 400, H = 860;
  let seed = 1, ID = 'z';
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const RI = (a, b) => Math.floor(R(a, b + 1));
  const f = n => Math.round(n * 10) / 10;

  /* ---- color ---- */
  const rgb = c => { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const hx = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hx(x.map((v, i) => v + (y[i] - v) * t)); };
  const shade = (c, t) => t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t);

  /* ---- svg primitives ---- */
  const op = o => o != null && o !== 1 ? ` opacity="${o}"` : '';
  const P = (d, c, o) => `<path d="${d}" fill="${c}"${op(o)}/>`;
  const S = (d, c, w = 2, o) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op(o)}/>`;
  const C = (x, y, r, c, o) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"${op(o)}/>`;
  const E = (x, y, rx, ry, c, o, rot) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}"${op(o)}${rot ? ` transform="rotate(${f(rot)} ${f(x)} ${f(y)})"` : ''}/>`;
  const RC = (x, y, w, h, c, o, rx = 0) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${rx ? ` rx="${rx}"` : ''} fill="${c}"${op(o)}/>`;
  const G = (x, y, s, inner, o = {}) => `<g transform="translate(${f(x)} ${f(y)})${o.rot ? ` rotate(${f(o.rot)})` : ''} scale(${o.flip ? -s : s} ${s})"${op(o.o)}>${inner}</g>`;
  const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + 'Z';
  const line = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L');
  function smooth(pts, close) { // Catmull-Rom through points -> cubic bezier
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (close || '');
  }
  let defs = '';
  const lg = (stops, x2 = 0, y2 = 1) => { const id = ID + 'g' + (defs.length % 99991); defs += `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`; return `url(#${id})`; };
  const rg = (stops) => { const id = ID + 'r' + (defs.length % 99991); defs += `<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`; return `url(#${id})`; };

  /* ---- palettes: season x time of day ---- */
  const PAL = {
    'winter-night': { sky: ['#191934', '#2c2a52', '#4c4373', '#8a6f93', '#c99aae'], glow: '#e7b3bd', sun: '#fdf3e4', fog: '#b996b4', deep: '#221f3b', far: '#7a6790', light: '#e8bccb', snow: '#e4d3e4', acc: '#f0b4c4', acc2: '#a9c4ee', ink: '#ece2f2' },
    'winter-dawn': { sky: ['#26305a', '#4f5d8f', '#a89bbf', '#eec3c4', '#f8dcc6'], glow: '#ffd9c2', sun: '#fff1df', fog: '#dcc6d6', deep: '#2a3150', far: '#8f97b9', light: '#f6d4d4', snow: '#eef0f8', acc: '#f3a9a0', acc2: '#a6c6f0', ink: '#f2eef8' },
    'winter-day': { sky: ['#4b6fa5', '#7f9fcb', '#b7cbe3', '#e2ebf3'], glow: '#f4f8fb', sun: '#ffffff', fog: '#dfe7f0', deep: '#26334e', far: '#8ea2c0', light: '#f4f8fc', snow: '#f1f5fa', acc: '#d9604f', acc2: '#7fb0e6', ink: '#f4f7fb' },
    'winter-dusk': { sky: ['#1f2446', '#433f6e', '#8a6487', '#d58e93', '#f2bb98'], glow: '#ffc79e', sun: '#ffe0b8', fog: '#c79aa6', deep: '#24223d', far: '#7d6284', light: '#f0b4a8', snow: '#ead6dc', acc: '#f4a07a', acc2: '#9fb8e8', ink: '#f4e4ea' },
    'spring-dawn': { sky: ['#6f8f96', '#a7b8b4', '#d9c2b6', '#f0c5b0', '#f7dcc4'], glow: '#fde6cd', sun: '#fdf0d3', fog: '#e6d3c8', deep: '#2c4645', far: '#8eaaa8', light: '#d9e6dc', snow: '#f1efe8', acc: '#f2a9bb', acc2: '#b6dc8f', ink: '#f4efe6' },
    'spring-day': { sky: ['#5e9fbf', '#8fc1d4', '#c3dfe0', '#eef2e4'], glow: '#fbf8e8', sun: '#fffbe9', fog: '#e3eedf', deep: '#22402f', far: '#8bb3a5', light: '#e6f1dc', snow: '#f5f8f2', acc: '#f29fb5', acc2: '#a9db8f', ink: '#f5f8f0' },
    'spring-dusk': { sky: ['#2e3d5a', '#5e5f80', '#a97f95', '#eea597', '#f8cfa5'], glow: '#ffd5a8', sun: '#ffe7c2', fog: '#d7aeac', deep: '#273040', far: '#7f7f96', light: '#f2c2b2', snow: '#f0e0dc', acc: '#f6a6b8', acc2: '#c1e09a', ink: '#f6ebe6' },
    'spring-night': { sky: ['#0c1a22', '#163039', '#23474d', '#3d6463', '#6b8a80'], glow: '#9fbfae', sun: '#f4f1dd', fog: '#5e7f78', deep: '#0f2125', far: '#3c5a58', light: '#7fa597', snow: '#c8d8d0', acc: '#f2a9bb', acc2: '#cdeb8f', ink: '#d8ece4' },
    'summer-day': { sky: ['#1f7ea6', '#4fa8c4', '#93cfd6', '#d4eee6'], glow: '#f2fbf3', sun: '#fff7d6', fog: '#c9ebe2', deep: '#11383b', far: '#5f9e9f', light: '#bfe6d8', snow: '#eef8f4', acc: '#62d6c6', acc2: '#f2c96b', ink: '#effaf6' },
    'summer-dusk': { sky: ['#55707a', '#85908a', '#b9ab8c', '#e1c08c', '#f0cf96'], glow: '#ffe0a0', sun: '#f5c66a', fog: '#c8bf9f', deep: '#13323e', far: '#5b8088', light: '#d9c79a', snow: '#efe8d6', acc: '#e8a04f', acc2: '#62c2b2', ink: '#f5efe0' },
    'summer-dawn': { sky: ['#2f5e74', '#5f8f99', '#a7bcb0', '#e7cfa8', '#f6e0b8'], glow: '#fff0c8', sun: '#fff2cf', fog: '#d6ddc8', deep: '#16383f', far: '#6f9a98', light: '#e3e6c8', snow: '#f4f4e8', acc: '#62d6c6', acc2: '#f2c96b', ink: '#f4f6ec' },
    'summer-night': { sky: ['#04111b', '#0b2431', '#12384a', '#1f5160', '#3a6f74'], glow: '#6fa0a0', sun: '#f2f0d8', fog: '#2f5d63', deep: '#05191f', far: '#1f474f', light: '#4f8585', snow: '#bcd8d6', acc: '#62d6c6', acc2: '#e8f58a', ink: '#cfeee8' },
    'autumn-dusk': { sky: ['#2e2340', '#5d3a52', '#a2565a', '#e0844f', '#f4b56a'], glow: '#ffcf87', sun: '#ffd98e', fog: '#c98a6c', deep: '#29191b', far: '#7a4a48', light: '#eb9f73', snow: '#f3dccb', acc: '#eda25a', acc2: '#d0573f', ink: '#f7e3cc' },
    'autumn-day': { sky: ['#5a8bb5', '#8fb1c8', '#c8d3cf', '#f0dfbf'], glow: '#fbf0d8', sun: '#fff4dc', fog: '#e9dcc4', deep: '#382417', far: '#a58a72', light: '#f3d9b6', snow: '#f7efe2', acc: '#e98b3f', acc2: '#c9472f', ink: '#fbf3e6' },
    'autumn-dawn': { sky: ['#2b3150', '#5e5872', '#a8838a', '#e8ae8e', '#f7d6a8'], glow: '#ffe0b0', sun: '#fff0cf', fog: '#dcbfa8', deep: '#2d2121', far: '#8c7378', light: '#f0c8a8', snow: '#f5e8dc', acc: '#eda25a', acc2: '#d0573f', ink: '#f8ecdc' },
    'autumn-night': { sky: ['#100c18', '#1f1729', '#33253a', '#4c3346', '#6f4a52'], glow: '#a77468', sun: '#f6ead2', fog: '#5c4048', deep: '#130d13', far: '#3e2c36', light: '#8a5f5a', snow: '#d8c6c0', acc: '#eda25a', acc2: '#d0573f', ink: '#eadbd0' },
  };

  /* ---- landscape layers ---- */
  function jaggedRange(y0, amp, n, jag) { // rocky ridge: returns { pts, peaks }
    const pts = [], peaks = [], x0 = -40, x1 = 440, step = (x1 - x0) / n;
    let last = [x0, y0 - amp * R(.1, .3)]; pts.push(last);
    const seg = (a, b) => { const k = 3; for (let i = 1; i <= k; i++) { const t = i / (k + 1), len = Math.hypot(b[0] - a[0], b[1] - a[1]); pts.push([a[0] + (b[0] - a[0]) * t + R(-1, 1) * jag * len * .25, a[1] + (b[1] - a[1]) * t + R(-1, 1) * jag * len * .35]); } pts.push(b); };
    for (let i = 0; i < n; i++) {
      const pk = [x0 + step * (i + .5) + R(-step * .22, step * .22), y0 - amp * R(.55, 1)];
      const vl = [x0 + step * (i + 1) + R(-step * .12, step * .12), y0 - amp * R(.08, .38)];
      seg(last, pk); peaks.push(pts.length - 1); seg(pk, vl); last = vl;
    }
    return { pts, peaks, y0 };
  }
  function rangeSvg(rg, col, o = {}) { // fill + optional lit facets + snow caps
    const { pts, peaks, y0 } = rg;
    let g = P(poly(pts.concat([[440, H], [-40, H]])), col);
    const sunX = o.sunX ?? 300;
    peaks.forEach(pi => {
      const pk = pts[pi], s = sunX >= pk[0] ? 1 : -1, hgt = y0 - pk[1];
      if (o.light) {
        const depth = pk[1] + hgt * R(.45, .7); let j = pi; const side = [pk];
        while (pts[j + s] && pts[j + s][1] < depth) { j += s; side.push(pts[j]); }
        const end = side[side.length - 1], q = [pk[0] + s * R(3, 10), pk[1] + (end[1] - pk[1]) * .45], inner = [];
        for (let t = 1; t <= 5; t++) { const u = t / 6, a = u < .5 ? [end[0] + (q[0] - end[0]) * u * 2, end[1] + (q[1] - end[1]) * u * 2] : [q[0] + (pk[0] - q[0]) * (u - .5) * 2, q[1] + (pk[1] - q[1]) * (u - .5) * 2]; inner.push([a[0] + R(-5, 5), a[1] + R(-4, 4)]); }
        if (side.length > 1) g += P(poly(side.concat(inner)), o.light, o.lightO ?? .7);
      }
      if (o.snow) {
        const lim = pk[1] + hgt * R(.18, .3), cap = [pk]; let a = pi, b = pi;
        while (pts[a - 1] && pts[a - 1][1] < lim) cap.unshift(pts[--a]);
        while (pts[b + 1] && pts[b + 1][1] < lim) cap.push(pts[++b]);
        const L = cap[0], Rr = cap[cap.length - 1], zz = [];
        for (let t = 1; t < 6; t++) { const x = Rr[0] + (L[0] - Rr[0]) * t / 6; zz.push([x, lim + (t % 2 ? R(4, 12) : R(-3, 2))]); }
        if (cap.length > 2) g += P(poly(cap.concat(zz)), o.snow, o.snowO ?? .92);
      }
    });
    return g;
  }
  function softRange(y0, amp, n, ph = 0) { const pts = []; for (let i = 0; i <= n; i++) { const x = -40 + i * 480 / n; pts.push([x, y0 - amp * (.45 + .55 * Math.sin(i * 1.7 + ph) * Math.sin(i * .63 + ph * 2)) - R(0, amp * .25)]); } return pts; }
  const softSvg = (pts, col) => P(smooth(pts, ` L440 ${H} L-40 ${H}Z`), col);
  function fog(y, h, c, a = .8) { return RC(-20, y - h, 440, h + 2, lg([[0, c, 0], [1, c, a]])) + RC(-20, y, 440, h * .35, lg([[0, c, a], [1, c, 0]])); }
  function band(y, h, c, a = .35) { return RC(-20, y, 440, h, lg([[0, c, 0], [.5, c, a], [1, c, 0]])); } // horizontal haze streak
  function pine(x, y, h, c, w = .34) {
    const hw = h * w;
    return P(`M${f(x)} ${f(y - h)} L${f(x + hw * .42)} ${f(y - h * .64)} L${f(x + hw * .27)} ${f(y - h * .64)} L${f(x + hw * .74)} ${f(y - h * .3)} L${f(x + hw * .5)} ${f(y - h * .3)} L${f(x + hw)} ${f(y - h * .04)} L${f(x - hw)} ${f(y - h * .04)} L${f(x - hw * .5)} ${f(y - h * .3)} L${f(x - hw * .74)} ${f(y - h * .3)} L${f(x - hw * .27)} ${f(y - h * .64)} L${f(x - hw * .42)} ${f(y - h * .64)}Z`, c) + RC(x - h * .025, y - h * .05, h * .05, h * .07, c);
  }
  const spire = (x, y, h, c, w = .16) => P(`M${f(x)} ${f(y - h)} Q${f(x + h * w * .5)} ${f(y - h * .45)} ${f(x + h * w)} ${f(y)} L${f(x - h * w)} ${f(y)} Q${f(x - h * w * .5)} ${f(y - h * .45)} ${f(x)} ${f(y - h)}Z`, c);
  function forest(yAt, x0, x1, h0, h1, c, kind = 'spire', gap = [5, 10]) {
    let g = P(`M${x0} ${H} L${x0} ${f(yAt(x0))} ` + Array.from({ length: 41 }, (_, i) => { const x = x0 + (x1 - x0) * i / 40; return `L${f(x)} ${f(yAt(x))}`; }).join(' ') + ` L${x1} ${H}Z`, c);
    for (let x = x0 + R(0, 6); x < x1; x += R(gap[0], gap[1])) { const h = R(h0, h1), y = yAt(x) + 3; g += kind === 'round' ? E(x, y - h * .55, h * .32, h * .55, c) : kind === 'pine' ? pine(x, y, h, c) : spire(x, y, h, c); }
    return g;
  }
  const wave = (y, a, w, ph) => x => y + a * Math.sin(x / w + ph) + a * .5 * Math.sin(x / (w * .43) + ph * 1.7);
  function roundTree(x, y, h, c, light, o = {}) { // deciduous: trunk + canopy blobs
    const tw = h * .05; let g = P(`M${f(x - tw)} ${f(y)} L${f(x - tw * .6)} ${f(y - h * .5)} L${f(x + tw * .6)} ${f(y - h * .5)} L${f(x + tw)} ${f(y)}Z`, o.trunk || shade(c, -.25));
    const r = h * .3;
    g += C(x, y - h * .72, r, c) + C(x - r * .8, y - h * .56, r * .78, c) + C(x + r * .85, y - h * .58, r * .74, c);
    if (light) g += C(x + r * .35, y - h * .8, r * .55, light, .35) + C(x + r * 1.05, y - h * .62, r * .4, light, .3);
    return g;
  }
  function stars(n, c, y1 = 360, big) { let g = ''; for (let i = 0; i < n; i++) { const x = R(0, W), y = R(0, y1) * R(.3, 1), r = R(.5, 1.5); g += r > 1.25 && big ? P(`M${f(x)} ${f(y - r * 2.4)} L${f(x + r * .6)} ${f(y)} L${f(x)} ${f(y + r * 2.4)} L${f(x - r * .6)} ${f(y)}Z`, c, .8) : C(x, y, r, c, R(.35, .9)); } return g; }
  function sunDisc(x, y, r, c, glow) { return C(x, y, r * 4, rg([[0, glow, .55], [.45, glow, .16], [1, glow, 0]])) + C(x, y, r, c); }
  function moon(x, y, r, c, sky) { return C(x, y, r * 5, rg([[0, c, .25], [1, c, 0]])) + P(`M${f(x - r * .2)} ${f(y - r)} A${r} ${r} 0 1 0 ${f(x - r * .2)} ${f(y + r)} A${f(r * .8)} ${f(r * .9)} 0 1 1 ${f(x - r * .2)} ${f(y - r)}Z`, c); }
  function fullMoon(x, y, r, c) { return C(x, y, r * 4.5, rg([[0, c, .28], [1, c, 0]])) + C(x, y, r, c) + C(x - r * .3, y - r * .2, r * .22, shade(c, -.08), .5) + C(x + r * .25, y + r * .3, r * .15, shade(c, -.08), .5); }
  const streaks = (n, c, y0, y1, a = .25) => { let g = ''; for (let i = 0; i < n; i++) { const w = R(90, 240), x = R(-60, 380), y = R(y0, y1); g += RC(x, y, w, R(3, 9), c, a * R(.5, 1), 4); } return g; };
  function puff(x, y, s, c, o = 1, shadow) { // flat cumulus cloud
    let g = `<g${op(o)}>` + C(x, y, s * .42, c) + C(x + s * .5, y - s * .3, s * .55, c) + C(x + s * 1.05, y - s * .12, s * .46, c) + C(x + s * 1.45, y + s * .08, s * .32, c) + RC(x, y - s * .02, s * 1.45, s * .44, c, 1);
    if (shadow) g += RC(x - s * .3, y + s * .2, s * 2.1, s * .22, shadow, 1, s * .1);
    return g + '</g>';
  }
  function flakes(n, c, y0 = 0, y1 = H) { let g = ''; for (let i = 0; i < n; i++) g += C(R(0, W), R(y0, y1), R(.8, 2.4), c, R(.35, .85)); return g; }
  function rainLines(n, c, x0, x1, y0, y1, a = .4, slant = -5) { let d = ''; for (let i = 0; i < n; i++) { const x = R(x0, x1), y = R(y0, y1), l = R(10, 22); d += `M${f(x)} ${f(y)} l${slant} ${f(l)} `; } return S(d, c, 1.2, a); }
  function grassTufts(yAt, x0, x1, c, h0 = 6, h1 = 14, step = [5, 12], o) { let d = ''; for (let x = x0; x < x1; x += R(step[0], step[1])) { const y = yAt(x) + 1, h = R(h0, h1); d += `M${f(x - 3)} ${f(y)} Q${f(x - 2)} ${f(y - h * .6)} ${f(x - 5)} ${f(y - h)} Q${f(x)} ${f(y - h * .5)} ${f(x + 1)} ${f(y)} Q${f(x + 2)} ${f(y - h * .7)} ${f(x + 5)} ${f(y - h * 1.1)} Q${f(x + 3)} ${f(y - h * .4)} ${f(x + 4)} ${f(y)}Z `; } return P(d, c, o); }
  function water(y, h, p, o = {}) { // lake / sea band with shimmer and sun path
    const top = mix(p.sky[p.sky.length - 1], p.deep, o.dark ?? .25), bot = mix(p.sky[1], p.deep, .55);
    let g = RC(-20, y, 440, h, lg([[0, top], [1, bot]]));
    let d = ''; for (let i = 0; i < 26; i++) { const yy = y + 4 + Math.pow(rnd(), 1.4) * (h - 8), w = R(20, 70) * (1 + (yy - y) / h); const x = R(-20, 400); d += `M${f(x)} ${f(yy)} h${f(w)} `; }
    g += S(d, p.glow, 1.1, .22);
    if (o.sunX != null) { let s = ''; for (let i = 0; i < 14; i++) { const yy = y + 3 + i * (h * .6 / 14), w = (30 - i * 1.5) * R(.6, 1.2); s += `M${f(o.sunX - w / 2 + R(-6, 6))} ${f(yy)} h${f(w)} `; } g += S(s, p.sun, 2, .55); }
    return g;
  }
  const reflect = (svg, y, a = .22) => `<g transform="translate(0 ${f(2 * y)}) scale(1 -1)" opacity="${a}">${svg}</g>`;
  const clipBelow = (y, inner) => { const id = ID + 'c' + (defs.length % 99991); defs += `<clipPath id="${id}"><rect x="-20" y="${f(y)}" width="440" height="${H}"/></clipPath>`; return `<g clip-path="url(#${id})">${inner}</g>`; };

  /* ---- base scene: sky, light, mountains, fog, horizon, foreground ---- */
  function base(p, c) {
    const hy = c.hy ?? 560, sunX = c.sunX ?? (c.t === 'dawn' ? 120 : c.t === 'dusk' ? 285 : 318);
    const sunY = c.sunY ?? (c.t === 'day' ? 150 : c.t === 'night' ? 140 : hy - 95);
    let g = RC(0, 0, W, H, lg(p.sky.map((s, i) => [i / (p.sky.length - 1) * (hy / H) + (i === p.sky.length - 1 ? 0 : 0), s]).concat([[1, p.sky[p.sky.length - 1]]])));
    g += C(sunX, hy - 20, 330, rg([[0, p.glow, c.t === 'day' ? .25 : .5], [1, p.glow, 0]]));
    if (c.t === 'night' || (c.t === 'dawn' && p === PAL['winter-dawn'])) g += stars(c.t === 'night' ? 70 : 20, p.ink, 380, true);
    if (!c.noSun) g += c.t === 'night' ? (c.full ? fullMoon(sunX, sunY, 22, p.sun) : moon(sunX, sunY, 20, p.sun)) : sunDisc(sunX, sunY, c.t === 'day' ? 24 : 30, p.sun, p.glow);
    if (c.streaks !== false) g += streaks(c.streaks || 7, p.glow, 200, hy - 120, .22);
    const far = p.far, mid = mix(p.far, p.deep, .45), near = mix(p.far, p.deep, .72);
    c.col = { far, mid, near, deep: p.deep, fg: mix(p.deep, p.far, .12) };
    const m = c.mtn === undefined ? 'alps' : c.mtn, snowy = c.snow ?? (c.season === 'winter');
    if (m === 'alps' || m === 'peak') {
      const r1 = jaggedRange(hy - 10, m === 'peak' ? 250 : 170, m === 'peak' ? 2 : 4, .5);
      g += rangeSvg(r1, mix(far, p.fog, .25), { light: mix(p.light, p.fog, .2), lightO: .65, snow: snowy || m === 'peak' ? mix(p.snow, p.fog, .2) : null, sunX });
      g += fog(hy - 40, 90, p.fog, .85);
      const r2 = jaggedRange(hy + 20, 110, 5, .6);
      g += rangeSvg(r2, mix(far, p.deep, .2), { light: mix(p.light, far, .35), lightO: .45, snow: snowy ? mix(p.snow, far, .25) : null, sunX });
      g += fog(hy + 20, 70, p.fog, .75);
    } else if (m === 'hills') {
      g += softSvg(softRange(hy - 60, 90, 7, c.ph || 0), mix(far, p.fog, .3)) + fog(hy - 30, 70, p.fog, .6);
      g += softSvg(softRange(hy - 10, 70, 6, (c.ph || 0) + 2), mix(far, p.deep, .15)) + fog(hy + 10, 50, p.fog, .45);
    } else if (m === 'low') {
      g += softSvg(softRange(hy - 15, 45, 6, c.ph || 0), mix(far, p.fog, .35)) + fog(hy, 40, p.fog, .5);
    }
    c.hy = hy; c.sunX = sunX; c.sunY = sunY;
    return g;
  }
  // a foreground ground plane (with optional snow) starting around y
  function ground(p, c, y, o = {}) {
    const col = o.col || (c.season === 'winter' && o.snow !== false ? mix(p.snow, p.deep, .55) : mix(p.deep, p.far, .16));
    const col2 = o.col2 || (c.season === 'winter' && o.snow !== false ? mix(p.snow, p.deep, .72) : p.deep);
    const a = wave(y, o.amp ?? 10, 70, o.ph ?? 1), b = wave(y + (o.gap ?? 70), (o.amp ?? 10) * 1.3, 90, (o.ph ?? 1) + 2);
    let g = P(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, a(-40 + i * 48)]), ` L440 ${H} L-40 ${H}Z`), col);
    if (c.season === 'winter' && o.snow !== false) g += S(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, a(-40 + i * 48)])), p.snow, 2.5, .55);
    if (o.second !== false) g += P(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, b(-40 + i * 48)]), ` L440 ${H} L-40 ${H}Z`), col2);
    c.gy = a; c.gy2 = b;
    return g;
  }
  const vignette = p => RC(0, H - 230, W, 230, lg([[0, p.deep, 0], [1, p.deep, .82]])) + RC(0, 0, W, 170, lg([[0, '#000', .28], [1, '#000', 0]]));

  /* ================= creature & object kit (local coordinates, origin at the feet / base) ================= */
  function shell(o = {}) { const b = o.body || '#e4d0b8', dk = shade(b, -.3); return P('M-14 0 C-14 -12 -6 -18 0 -18 C6 -18 14 -12 14 0 C8 3 -8 3 -14 0Z', b) + S('M0 -1 L0 -17 M0 -1 L-6 -16 M0 -1 L6 -16 M0 -1 L-11 -11 M0 -1 L11 -11', dk, .9, .8) + E(0, 0, 4, 2, dk); }
  /* plants */
  function blossomBranch(x1, y1, x2, y2, c, w) { return S(`M${f(x1)} ${f(y1)} Q${f((x1 + x2) / 2 + R(-10, 10))} ${f((y1 + y2) / 2 + R(-12, 4))} ${f(x2)} ${f(y2)}`, c, w); }
  function blossom(x, y, r, c, ctr) { let g = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g += E(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62, r * .55, r * .42, c, 1, a * 57.3 + 90); } return g + C(x, y, r * .28, ctr || '#fff3c4'); }
  function treeLimbs(x, y, h, spread, rng = 4, c, w0 = 14) { // trunk with forking limbs. returns { g, tips[] } tips = [x,y,depth]
    let g = '', tips = [];
    const grow = (x0, y0, ang, len, w, d) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, mx = (x0 + x1) / 2 + R(-6, 6), my = (y0 + y1) / 2 + R(-6, 6);
      g += P(`M${f(x0 - w / 2)} ${f(y0)} Q${f(mx - w * .4)} ${f(my)} ${f(x1 - w * .18)} ${f(y1)} L${f(x1 + w * .18)} ${f(y1)} Q${f(mx + w * .4)} ${f(my)} ${f(x0 + w / 2)} ${f(y0)}Z`, c);
      if (d >= rng || len < 10) { tips.push([x1, y1, d]); return; }
      const n = d < 1 ? 3 : 2;
      for (let i = 0; i < n; i++) grow(x1, y1, ang + (i - (n - 1) / 2) * spread * R(.7, 1.2) + R(-.15, .15), len * R(.62, .78), w * .62, d + 1);
      if (d > 0) tips.push([x1, y1, d]);
    };
    grow(x, y, -Math.PI / 2 + R(-.06, .06), h * .38, w0, 0);
    return { g, tips };
  }
  function reeds(x, y, h, c, n = 5, head) { let g = ''; for (let i = 0; i < n; i++) { const xx = x + i * 5 + R(-2, 2), hh = h * R(.7, 1.1), lean = R(-8, 8); g += S(`M${f(xx)} ${f(y)} Q${f(xx + lean * .3)} ${f(y - hh * .5)} ${f(xx + lean)} ${f(y - hh)}`, c, 1.6); if (head && i % 2 === 0) g += E(xx + lean, y - hh - 2, 2.4, 8, head, 1, lean * 2); else g += S(`M${f(xx + lean * .5)} ${f(y - hh * .55)} q${f(R(6, 14))} ${f(-R(4, 10))} ${f(R(14, 22))} ${f(R(-2, 6))}`, c, 1.2, .8); } return g; }
  function sprout(s, c, lt) { return S(`M0 0 Q-1 ${-s * .6} 0 ${-s}`, c, s * .09) + P(`M0 ${-s} C${-s * .2} ${-s * 1.25} ${-s * .6} ${-s * 1.25} ${-s * .75} ${-s * 1.05} C${-s * .55} ${-s * .9} ${-s * .2} ${-s * .9} 0 ${-s}Z`, c) + P(`M0 ${-s} C${s * .2} ${-s * 1.3} ${s * .6} ${-s * 1.35} ${s * .8} ${-s * 1.12} C${s * .6} ${-s * .95} ${s * .2} ${-s * .92} 0 ${-s}Z`, lt || shade(c, .2)); }
  const leafShape = (x, y, l, rot, c, o) => `<path d="M0 0 C${l * .3} ${-l * .28} ${l * .75} ${-l * .25} ${l} 0 C${l * .75} ${l * .25} ${l * .3} ${l * .28} 0 0Z" fill="${c}"${op(o)} transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>`;
  function wheatStalk(x, y, h, c, bow = 0) { let d = ''; for (let i = 0; i < 5; i++) { const t = .8 + i * .05, xx = x + bow * t, yy = y - h * t - 2; d += `M${f(xx)} ${f(yy + 3)} l-4.4 -6 l1.6 -2Z M${f(xx)} ${f(yy + 2)} l4.4 -6 l-1.6 -2Z `; } return S(`M${f(x)} ${f(y)} Q${f(x + bow * .3)} ${f(y - h * .6)} ${f(x + bow)} ${f(y - h)} M${f(x + bow)} ${f(y - h - 4)} l${f(bow * .2)} -14`, c, 1.4) + `<path d="${d}" fill="${c}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>`; }
  function chrysanthemum(x, y, r, c, ctr) { let g = ''; for (let k = 0; k < 3; k++) { const rr = r * (1 - k * .26), n = 16 - k * 3; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + k * .3; g += E(x + Math.cos(a) * rr * .55, y + Math.sin(a) * rr * .55, rr * .5, rr * .12, k ? shade(c, k * .08) : shade(c, -.08), 1, a * 57.3); } } return g + C(x, y, r * .2, ctr || shade(c, -.25)); }
  function web(x, y, r, c, dew) { let g = '', n = 12; for (let i = 0; i < n; i++) { const a = i / n * 6.283; g += S(`M${f(x)} ${f(y)} L${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`, c, .8, .8); }
    for (let k = 1; k <= 7; k++) { const rr = r * k / 7.6; let d = ''; for (let i = 0; i <= n; i++) { const a = i / n * 6.283; d += (i ? ' L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr); } g += S(d, c, .7, .75); if (dew) for (let i = 0; i < n; i += RI(1, 3)) { const a = (i + .5) / n * 6.283; g += C(x + Math.cos(a) * rr * .96, y + Math.sin(a) * rr * .96, R(.9, 2), dew, .85); } }
    return g; }
  /* structures & weather */
  function storm(x, y, s, c, dk) { return puff(x - s * .9, y + s * .1, s * .9, dk) + puff(x - s * .3, y - s * .25, s * 1.1, c) + puff(x + s * .4, y, s * .95, shade(c, -.08)) + P(`M${f(x - s * 1.4)} ${f(y + s * .45)} L${f(x + s * 1.9)} ${f(y + s * .45)} L${f(x + s * 1.6)} ${f(y + s * .62)} L${f(x - s * 1.1)} ${f(y + s * .62)}Z`, dk, .9); }
  function bolt(x, y, h, c, glow) { const d = `M${x} ${y} L${x - h * .12} ${y + h * .38} L${x + h * .02} ${y + h * .36} L${x - h * .1} ${y + h * .72} L${x + h * .04} ${y + h * .68} L${x - h * .06} ${y + h}`; return S(d, glow, 12, .18) + S(d, glow, 6, .35) + S(d, c, 2.6) + S(`M${f(x - h * .06)} ${f(y + h * .55)} l${f(h * .12)} ${f(h * .1)} l-${f(h * .02)} ${f(h * .12)}`, c, 1.4, .8); }
  function rainbow(x, y, r, o = .7) { return ['#e98a8a', '#efb97a', '#ecdf86', '#9fd49a', '#8cbfe8', '#a99be6'].map((c, i) => S(`M${f(x - r + i * 6)} ${f(y)} A${f(r - i * 6)} ${f(r - i * 6)} 0 0 1 ${f(x + r - i * 6)} ${f(y)}`, c, 6.2, o)).join(''); }
  function swirl(x, y, s, c, o = .7, w = 2) { return S(`M${f(x)} ${f(y)} c${f(s * .6)} ${f(-s * .5)} ${f(s * 1.6)} ${f(-s * .5)} ${f(s * 2)} ${f(-s * .05)} c${f(s * .35)} ${f(s * .4)} ${f(s * .05)} ${f(s * .9)} ${f(-s * .35)} ${f(s * .75)} c${f(-s * .3)} ${f(-s * .1)} ${f(-s * .25)} ${f(-s * .45)} ${f(s * .05)} ${f(-s * .5)}`, c, w, o); }
  function windGust(x, y, l, c, o = .7, w = 2) { return S(`M${f(x)} ${f(y)} q${f(l * .25)} ${f(-l * .08)} ${f(l * .5)} 0 t${f(l * .5)} 0 q${f(l * .12)} ${f(-l * .02)} ${f(l * .14)} ${f(-l * .1)} q${f(-l * .02)} ${f(-l * .08)} ${f(-l * .1)} ${f(-l * .04)}`, c, w, o); }
  function house(x, y, w, h, wall, roof, o = {}) { // simple cottage, base center x,y
    let g = RC(x - w / 2, y - h, w, h, wall) + P(`M${f(x - w / 2 - 8)} ${f(y - h + 2)} L${f(x)} ${f(y - h - h * .75)} L${f(x + w / 2 + 8)} ${f(y - h + 2)}Z`, roof);
    if (o.snow) g += P(`M${f(x - w / 2 - 9)} ${f(y - h + 1)} L${f(x)} ${f(y - h - h * .78)} L${f(x + w / 2 + 9)} ${f(y - h + 1)} L${f(x + w / 2 + 4)} ${f(y - h + 4)} L${f(x)} ${f(y - h - h * .6)} L${f(x - w / 2 - 4)} ${f(y - h + 4)}Z`, o.snow);
    if (o.chimney) g += RC(x + w * .2, y - h - h * .62, w * .1, h * .35, roof);
    if (o.win) g += RC(x - w * .3, y - h * .62, w * .2, h * .26, o.win) + RC(x + w * .1, y - h * .62, w * .2, h * .26, o.win);
    if (o.door) g += RC(x - w * .08, y - h * .5, w * .16, h * .5, o.door);
    return g;
  }
  /* ================= fauna: faceted low-poly silhouettes =================
     Every animal is one or more silhouette polygons (local coords, facing right, origin where it touches its
     support). facets() fills a polygon with Delaunay triangles shaded by a light direction, like folded paper.
     One representative color per animal (or a glowing color at night), no cartoon details. */
  let SID = 0, LIGHT = [.55, -.85];
  function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function polyArea(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); }
  function delaunay(P) { // Bowyer-Watson
    const n = P.length; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    P.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    const d = Math.max(x1 - x0, y1 - y0) * 30 + 10, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, pts = P.concat([[mx - d, my - d], [mx, my + d], [mx + d, my - d]]);
    const mk = (a, b, c) => { const [ax, ay] = pts[a], [bx, by] = pts[b], [cx, cy] = pts[c], D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-9;
      const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D, uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
      return { a, b, c, x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 }; };
    let tris = [mk(n, n + 1, n + 2)];
    for (let i = 0; i < n; i++) {
      const [px, py] = pts[i], bad = [], keep = [];
      for (const t of tris) ((px - t.x) ** 2 + (py - t.y) ** 2 < t.r2 ? bad : keep).push(t);
      const edges = [];
      for (const t of bad) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) { const k = edges.findIndex(e => e[0] === v && e[1] === u || e[0] === u && e[1] === v); if (k >= 0) edges.splice(k, 1); else edges.push([u, v]); }
      tris = keep; for (const [u, v] of edges) tris.push(mk(u, v, i));
    }
    return tris.filter(t => t.a < n && t.b < n && t.c < n).map(t => [t.a, t.b, t.c]);
  }
  function facets(pts, c, o = {}) { // one polygon, faceted
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = x1 - x0 || 1, h = y1 - y0 || 1;
    const area = polyArea(pts), n = o.n ?? Math.max(2, Math.min(22, Math.round(area / 190)));
    const all = pts.map(p => [p[0] + R(-.02, .02), p[1] + R(-.02, .02)]), minD = Math.sqrt(area / Math.max(1, n)) * .6;
    for (let t = 0, got = 0; t < n * 50 && got < n; t++) { const x = R(x0, x1), y = R(y0, y1); if (!inPoly(x, y, pts) || all.some(q => (q[0] - x) ** 2 + (q[1] - y) ** 2 < minD * minD)) continue; all.push([x, y]); got++; }
    const tris = delaunay(all), k = o.k ?? .24, j = o.j ?? .07, L = o.L || LIGHT, id = ID + 's' + (SID++);
    defs += `<clipPath id="${id}"><path d="${poly(pts)}"/></clipPath>`;
    let g = `<g clip-path="url(#${id})">` + P(poly(pts), c);
    for (const [a, b, d] of tris) {
      const A = all[a], B = all[b], D = all[d], cx = (A[0] + B[0] + D[0]) / 3, cy = (A[1] + B[1] + D[1]) / 3;
      if (!inPoly(cx, cy, pts)) continue;
      const col = shade(c, ((cx - x0) / w - .5) * L[0] * k * 2 + ((cy - y0) / h - .5) * -L[1] * -k * 2 + R(-j, j));
      g += `<path d="${poly([A, B, D])}" fill="${col}" stroke="${col}" stroke-width=".6" stroke-linejoin="round"/>`;
    }
    return g + '</g>';
  }
  function blurF(r) { const id = ID + 'b' + r; if (!defs.includes(`id="${id}"`)) defs += `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${r}"/></filter>`; return `url(#${id})`; }
  // parts: [{ p: points, c: color, k, n }]; o: lum (solid luminous), eye [x, y, r], shadow width, lines (svg drawn on top, e.g. antlers/legs)
  function sil(parts, o = {}) {
    let g = '';
    if (o.shadow) g += E(o.shadowX || 0, 1, o.shadow, o.shadow * .14, '#000', o.shadowO ?? .38);
    if (o.under) g += o.under;
    g += parts.map(q => facets(q.p, q.c, o.lum ? Object.assign({}, q, { k: Math.min(q.k ?? .24, .1), j: .03 }) : q)).join('');
    if (o.lines) g += o.lines;
    if (o.eye) g += C(o.eye[0], o.eye[1], o.eye[2] || 1.4, o.eyeC || '#f6efe2', .9);
    return g;
  }
  const mirror = pts => pts.map(([x, y]) => [-x, y]);
  const scaleP = (pts, sx, sy = sx) => pts.map(([x, y]) => [x * sx, y * sy]);

  /* ---- birds ---- */
  function songbird(o = {}) { // perched, feet at 0 on the branch
    const c = o.c || o.body || '#2a2a30', bl = o.longBeak ? 15 : 8, pose = o.pose || 'perch';
    let head = pose === 'sing' ? [[33, -43], [21, -38], [17, -41], [11, -42], [5, -39], [1, -34]] : pose === 'sleep' ? [[20, -25], [18, -31], [13, -35], [6, -34], [1, -31]]
      : pose === 'preen' ? [[-3, -31], [3, -38], [10, -41], [16, -38], [19, -32]] : [[22 + bl, -31], [22, -35], [18, -39], [12, -41], [6, -39], [1, -34]];
    if (o.crest && pose !== 'preen') head = head.slice(0, 3).concat([[19, -47], [15, -42], [13, -53], [9, -43], [5, -51], [3, -40]], head.slice(4));
    const back = [[-7, -29], [-15, -23]];
    const tail = o.tail === 'long' ? [[-21, -19], [-64, -6], [-63, -1], [-16, -11]] : o.tail === 'fork' ? [[-21, -19], [-44, -13], [-34, -11], [-44, -6], [-17, -12]] : [[-21, -19], [-37, -11], [-36, -6], [-17, -12]];
    const under = [[-11, -8], [-3, -6], [-4, 0], [-1.5, 0], [0, -5], [5, -5], [5, 0], [7.5, 0], [8, -6], [14, -9], [19, -15], [22, -22]];
    const front = pose === 'sing' ? [[23, -29], [23, -32], [32, -35], [24, -34]] : pose === 'sleep' ? [[21, -22]] : pose === 'preen' ? [[20, -26]] : [[23, -27], [22, -29]];
    const body = pose === 'preen' ? head.concat(front, under.slice().reverse(), tail.slice().reverse(), back.slice().reverse()) : head.concat(back, tail, under, front);
    const parts = [{ p: body, c }];
    if (o.c3 || o.belly2) parts.push({ p: [[21, -20], [18, -13], [12, -8], [0, -7], [-11, -9], [-4, -13], [8, -16], [16, -19]], c: o.c3 || o.belly2, k: .12 });
    if (o.head) parts.push({ p: pose === 'sing' ? [[21, -37], [17, -41], [11, -42], [5, -39], [2, -34], [9, -32], [18, -32]] : [[22, -34], [18, -39], [12, -41], [6, -39], [2, -34], [8, -31], [17, -30]], c: o.head });
    if (o.mask) parts.push({ p: pose === 'sing' ? [[22, -38], [12, -37], [10, -34], [21, -35]] : [[23, -34], [12, -35], [10, -31], [22, -31]], c: o.mask, k: .05 });
    parts.push({ p: pose === 'preen' ? [[10, -30], [-2, -34], [-14, -28], [-26, -16], [-10, -16], [4, -20]] : [[12, -30], [1, -31], [-10, -26], [-25, -13], [-11, -14], [4, -18], [11, -23]], c: o.c2 || o.wing || shade(c, -.22), k: .16 });
    if (o.stripes) parts.push({ p: [[-4, -27], [-8, -18], [-5, -17], [-1, -26]], c: o.stripes, k: .02, n: 0 }, { p: [[-12, -22], [-17, -13], [-14, -13], [-9, -21]], c: o.stripes, k: .02, n: 0 });
    return sil(parts, { eye: pose === 'sleep' || pose === 'preen' ? null : pose === 'sing' ? [15, -36, 1.2] : [16, -34, 1.2], eyeC: o.eyeC, lines: pose === 'sleep' ? S('M11 -30 q3 2 6 0', shade(c, .4), 1) : '' });
  }
  function dove(o = {}) { return songbird(Object.assign({ c: '#c9bcbc', c2: '#9a8a8c' }, o)); }
  function goose(o = {}, up = true) { // in flight, side view facing right
    const c = o.c || o.body || '#34303a';
    const head = [[56, -12], [49, -16], [43, -17], [37, -14], [27, -9], [17, -6]];
    const body = up ? head.concat([[9, -6], [3, -26], [-3, -44], [-12, -62], [-20, -70], [-21, -63], [-24, -58], [-23, -48], [-21, -36], [-17, -20], [-14, -7], [-26, -5], [-40, -6], [-43, 0], [-34, 4], [-20, 8], [0, 9], [14, 6], [24, 1], [34, -6], [44, -10], [50, -10]])
      : head.concat([[0, -8], [-14, -7], [-26, -5], [-40, -6], [-43, 0], [-34, 4], [-20, 7], [-16, 12], [-20, 26], [-25, 40], [-28, 52], [-19, 48], [-10, 34], [-2, 20], [6, 8], [14, 6], [24, 1], [34, -6], [44, -10], [50, -10]]);
    const far = up ? [[4, -7], [14, -26], [22, -40], [24, -35], [20, -22], [13, -8]] : [[4, 6], [12, 18], [18, 30], [21, 26], [17, 14], [12, 5]];
    return sil([{ p: far, c: shade(c, -.25), k: .1 }, { p: body, c }], { });
  }
  function gooseSwim(o = {}) { // floating; waterline at y = 0 (draws its own reflection)
    const c = o.c || o.body || '#34303a';
    const body = [[-44, -10], [-30, -15], [-10, -18], [10, -16], [16, -14], [18, -26], [20, -40], [22, -48], [28, -52], [34, -51], [44, -47], [36, -44], [30, -44], [28, -36], [27, -24], [28, -12], [32, -6], [30, 0], [-36, 0]];
    const wing = [[-34, -8], [-20, -14], [0, -15], [8, -10], [-6, -7], [-24, -4]];
    return `<g opacity=".28" transform="scale(1 -.6)">${P(poly(body), c)}</g>` + sil([{ p: body, c }, { p: wing, c: shade(c, -.25), k: .1 }], { }) + S('M-50 4 h96 M-36 9 h70', o.ripple || shade(c, .35), .9, .25);
  }
  function raptor(o = {}) { // soaring, seen from below
    const c = o.c || o.body || '#2c221c';
    const p = [[0, -13], [3.5, -11], [4.5, -6], [28, -10], [46, -6], [58, -1], [54, 1], [57, 4], [50, 4], [53, 7], [45, 6], [47, 9], [38, 7], [22, 9], [6, 9], [9, 24], [0, 28], [-9, 24], [-6, 9], [-22, 9], [-38, 7], [-47, 9], [-45, 6], [-53, 7], [-50, 4], [-57, 4], [-54, 1], [-58, -1], [-46, -6], [-28, -10], [-4.5, -6], [-3.5, -11]];
    return sil([{ p, c, n: 10 }], { });
  }
  function raptorSide(o = {}) { // striking flight, wings raised, talons forward
    const c = o.c || '#2c221c';
    const p = [[42, -4], [36, -10], [29, -12], [22, -9], [14, -12], [9, -32], [0, -52], [-9, -66], [-13, -67], [-15, -61], [-19, -63], [-20, -56], [-24, -57], [-23, -48], [-27, -48], [-23, -35], [-19, -22], [-14, -12], [-28, -8], [-46, -6], [-48, 0], [-30, 3], [-12, 5], [-2, 7], [3, 15], [6, 13], [9, 18], [11, 13], [9, 7], [16, 5], [24, 2], [33, -1], [38, -1]];
    const far = [[16, -12], [24, -30], [30, -44], [33, -40], [28, -26], [21, -11]];
    return sil([{ p: far, c: shade(c, -.25), k: .1 }, { p, c }], { eye: [32, -8, 1.1], eyeC: o.eyeC || '#f2d080' });
  }
  function hawkSide(o = {}) { // perched upright, talons at 0
    const c = o.c || o.body || '#4a3424';
    const p = [[22, -52], [24, -56], [20, -60], [14, -64], [6, -63], [0, -58], [-6, -48], [-11, -30], [-12, -18], [-15, -4], [-18, 16], [-7, 16], [-4, -2], [0, -4], [0, 0], [3, 0], [4, -6], [8, -6], [8, 0], [11, 0], [11, -7], [14, -14], [18, -30], [18, -42], [17, -48], [19, -50]];
    const breast = [[17, -44], [18, -30], [14, -14], [8, -8], [5, -24], [9, -40]];
    const wing = [[4, -54], [-4, -50], [-10, -34], [-12, -14], [-4, -12], [4, -26], [8, -44]];
    return sil([{ p, c }, { p: breast, c: o.c3 || shade(c, .35), k: .1 }, { p: wing, c: shade(c, -.25), k: .12 }], { eye: [14, -57, 1.3], eyeC: o.eyeC || '#f2d080', shadow: o.shadow });
  }
  function swallow(o = {}) { // in flight, seen from above-ish, facing right
    const c = o.c || o.body || '#1b2440';
    const p = [[22, 0], [16, -4], [8, -4], [2, -10], [-14, -26], [-40, -34], [-26, -24], [-10, -8], [-14, -2], [-36, -8], [-24, 0], [-38, 8], [-12, 4], [-8, 8], [-20, 22], [-34, 30], [-12, 18], [2, 6], [16, 3]];
    return sil([{ p, c, n: 6 }], { });
  }
  function flyer(o = {}) { // small bird in flight, side view, wing raised and swept back
    const c = o.c || o.body || '#2a2a30', tail = o.tail === 'long' ? [[-12, -4], [-50, -1], [-49, 4], [-12, 4]] : [[-12, -4], [-28, -6], [-31, -1], [-27, 3], [-12, 4]];
    const p = [[24, -2], [20, -6], [14, -7], [6, -6], [-2, -24], [-18, -38], [-32, -44], [-26, -36], [-14, -24], [-8, -8]].concat(tail, [[0, 6], [12, 4], [19, 1]]);
    return sil([{ p: [[4, -6], [12, -22], [18, -28], [16, -18], [10, -5]], c: shade(c, -.25), k: .1, n: 0 }, { p, c }], { eye: [17, -3.5, .8], lines: o.twig ? S('M22 -2 l14 -4 M28 -4 l4 -5', o.twigC || '#3a2a20', 1.4) : '' });
  }
  function pheasant(o = {}) { // standing, calling, feet at 0
    const c = o.c || '#a8442a';
    const p = [[40, -62], [34, -65], [30, -69], [24, -68], [20, -58], [14, -46], [4, -38], [-12, -36], [-22, -36], [-82, -24], [-82, -19], [-20, -26], [-18, -24], [-16, -16], [-4, -12], [-6, 0], [-3, 0], [-1, -12], [6, -12], [6, 0], [9, 0], [9, -13], [18, -18], [24, -28], [28, -40], [32, -52], [36, -58], [37, -60]];
    const head = [[20, -58], [24, -68], [30, -69], [34, -65], [36, -58], [32, -52], [27, -50]];
    return sil([{ p, c }, { p: head, c: o.c2 || '#1c4a46', k: .14 }, { p: [[29, -64], [33, -64], [32, -59], [28, -60]], c: '#d8362a', k: 0, n: 0 }], { eye: [31, -66, 1], shadow: o.shadow ?? 26 });
  }
  function hen(o = {}) { // sitting, base at 0
    const c = o.c || '#e6dccb';
    const p = [[34, -36], [29, -39], [27, -34], [22, -30], [10, -30], [0, -26], [-14, -26], [-20, -30], [-24, -44], [-30, -48], [-33, -40], [-35, -28], [-37, -14], [-34, -4], [-28, 0], [22, 0], [28, -8], [30, -20], [30, -28], [31, -33]];
    const headTop = [[29, -39], [27, -42], [21, -44], [15, -42], [13, -38], [10, -30], [22, -30], [27, -34]];
    const comb = [[27, -42], [27, -48], [24, -44], [22, -50], [19, -45], [16, -49], [15, -42], [21, -44]];
    return sil([{ p: p.concat([]), c }, { p: headTop, c, k: .12 }, { p: comb, c: o.c2 || '#c8342a', k: .06, n: 0 }, { p: [[30, -32], [32, -26], [29, -24], [28, -30]], c: o.c2 || '#c8342a', k: 0, n: 0 }, { p: [[14, -22], [-6, -20], [-22, -14], [-6, -10], [10, -12]], c: shade(c, -.14), k: .08 }], { eye: [24, -38, 1.1], eyeC: '#2a1e16' });
  }
  function quail(o = {}) {
    const c = o.c || o.body || '#7a5a3e';
    const p = [[18, -20], [14, -23], [12, -26], [10, -34], [15, -37], [12, -31], [8, -27], [2, -22], [-8, -20], [-16, -14], [-20, -10], [-15, -6], [-8, -2], [0, -2], [0, 0], [2, 0], [3, -2], [6, -2], [6, 0], [8, 0], [9, -3], [14, -8], [17, -14], [17, -18]];
    return sil([{ p, c }], { eye: [13, -21, .9], shadow: o.shadow });
  }
  function heron(o = {}) { // standing on one leg; foot at 0
    const c = o.c || o.body || '#b8c2cc';
    const p = [[46, -98], [24, -102], [20, -106], [14, -104], [4, -108], [12, -101], [10, -96], [6, -86], [10, -76], [12, -68], [6, -64], [-6, -66], [-22, -62], [-36, -52], [-44, -44], [-30, -46], [-18, -42], [-2, -40], [8, -46], [16, -58], [18, -66], [14, -76], [12, -86], [18, -94], [23, -97]];
    return sil([{ p, c }, { p: [[46, -98], [24, -102], [23, -97]], c: o.beak || '#d6a640', k: 0, n: 0 }, { p: [[-20, -60], [-4, -64], [6, -58], [-4, -50], [-24, -50]], c: shade(c, -.2), k: .1 }],
      { eye: [19, -101, .9], eyeC: '#222', lines: S('M1 -40 L2 0 M1 -26 L-8 -32 L-6 -20', shade(c, -.45), 2.2) });
  }
  function owl(o = {}) { // front-facing, sitting, feet at 0
    const c = o.c || o.body || '#8a7a6a';
    const p = [[-13, 0], [-20, -14], [-22, -30], [-19, -42], [-17, -52], [-11, -47], [0, -50], [11, -47], [17, -52], [19, -42], [22, -30], [20, -14], [13, 0]];
    const face = [[-15, -40], [-9, -45], [0, -43], [9, -45], [15, -40], [12, -32], [0, -30], [-12, -32]];
    const wl = [[-22, -30], [-20, -12], [-14, -2], [-12, -18], [-15, -30]];
    return sil([{ p, c }, { p: face, c: o.c3 || shade(c, .3), k: .08, n: 2 }, { p: wl, c: shade(c, -.22), k: .1, n: 1 }, { p: mirror(wl), c: shade(c, -.22), k: .1, n: 1 }, { p: [[-2, -38], [2, -38], [0, -33]], c: '#c9a24a', k: 0, n: 0 }],
      { lum: o.lum, lines: (o.closed ? S('M-11 -39 q3.5 2.4 7 0 M4 -39 q3.5 2.4 7 0', shade(c, -.55), 1.3) : C(-6, -39, 2.6, '#f2c64a') + C(6, -39, 2.6, '#f2c64a') + C(-6, -39, 1.2, '#111') + C(6, -39, 1.2, '#111')) + S('M-5 0 l-2 2 M-3 0 l0 2.5 M3 0 l0 2.5 M5 0 l2 2', '#c9a24a', 1.1) });
  }
  function otter(o = {}) { // standing up, feet at 0
    const c = o.c || o.body || '#5a3a26';
    const p = [[17, -58], [13, -64], [8, -68], [2, -70], [-3, -68], [-5, -71], [-7, -66], [-9, -60], [-13, -48], [-16, -30], [-15, -14], [-13, -6], [-24, -4], [-40, -4], [-52, -8], [-48, -1], [-34, 2], [-14, 2], [-12, 0], [4, 0], [7, -2], [14, -1], [15, -4], [12, -8], [14, -18], [15, -28], [18, -33], [14, -37], [13, -44], [11, -50], [14, -54]];
    return sil([{ p, c }, { p: [[15, -56], [12, -52], [11, -46], [13, -36], [13, -20], [8, -14], [6, -30], [8, -48]], c: o.c3 || shade(c, .3), k: .08 }], { eye: [8, -63, 1.1], shadow: o.shadow ?? 22 });
  }
  function fish(o = {}) { // facing right, centered
    const c = o.c || o.body || '#8fb5c2';
    const p = [[20, 0], [14, -6], [4, -9], [0, -13], [-4, -9], [-14, -6], [-18, -2], [-28, -10], [-26, 0], [-28, 10], [-18, 2], [-8, 7], [8, 7], [16, 4]];
    return sil([{ p, c, n: 4 }], { eye: [13, -2, .9], eyeC: o.eyeC || '#10202a' });
  }
  function frog(o = {}) { // side view, sitting, base at 0 (put it on a pad or a stone)
    const c = o.c || o.body || '#5f9a45';
    const p = [[38, -18], [34, -24], [30, -30], [24, -36], [18, -33], [10, -30], [-6, -26], [-22, -20], [-30, -12], [-28, -4], [-34, 0], [-6, 0], [-4, -4], [6, -6], [12, -6], [14, 0], [22, 0], [22, -3], [18, -4], [20, -10], [30, -12], [36, -15]];
    const leg = [[-28, -14], [-16, -18], [-4, -12], [-6, -4], [-20, -4]];
    const parts = [{ p, c }, { p: leg, c: shade(c, -.2), k: .1 }];
    if (o.sac) parts.push({ p: [[22, -12], [30, -12], [34, -6], [30, -1], [22, -2], [19, -6]], c: o.sacC || shade(c, .45), k: .06, n: 2 });
    return sil(parts, { lum: o.lum, eye: [25, -31, 1.6], eyeC: o.eyeC || '#f4e9a0', shadow: o.shadow });
  }
  function deer(o = {}) { // side view facing right, hooves at 0
    const c = o.c || o.body || '#8a5432';
    const p = [[68, -96], [64, -101], [56, -107], [52, -112], [44, -120], [43, -116], [46, -110], [44, -108], [36, -96], [28, -80], [20, -76], [0, -75], [-20, -75], [-34, -72], [-40, -66], [-44, -66], [-42, -60], [-42, -52], [-38, -40], [-36, -30], [-38, -12], [-37, 0], [-33, 0], [-33, -14], [-30, -30], [-28, -38], [-26, -30], [-24, -14], [-25, 0], [-21, 0], [-21, -14], [-20, -34], [-14, -42], [10, -42], [16, -40], [18, -22], [17, 0], [21, 0], [21, -22], [22, -38], [24, -40], [26, -38], [28, -20], [28, 0], [32, 0], [32, -22], [32, -42], [36, -50], [38, -62], [44, -78], [52, -90], [60, -92], [66, -92]];
    const ant = o.antlers === false ? S('M49 -112 l-1 -5 M55 -110 l1 -5', o.antlerC || shade(c, .5), 3) : S('M50 -110 C46 -126 40 -136 30 -142 M45 -124 L52 -136 M41 -132 L44 -146 M36 -137 L26 -150 M54 -110 C58 -124 64 -132 72 -136 M60 -124 L56 -138 M66 -131 L72 -146', o.antlerC || shade(c, .45), 2.6);
    return sil([{ p, c }, { p: [[-40, -66], [-42, -56], [-36, -54], [-34, -64]], c: shade(c, .35), k: .05, n: 0 }, { p: [[36, -50], [38, -62], [44, -78], [40, -70], [34, -56]], c: shade(c, .2), k: .05, n: 0 }], { eye: [55, -103, 1.2], lines: ant, shadow: o.shadow ?? 52 });
  }
  function wolf(o = {}) { // sitting, muzzle raised to howl, base at 0
    const c = o.c || o.body || '#4a4a52';
    const body = [[-34, 0], [-38, -18], [-34, -36], [-24, -48], [-10, -56], [4, -62], [8, -74], [12, -86], [14, -94], [12, -106], [20, -99], [26, -101], [40, -111], [45, -113], [46, -108], [37, -100], [29, -90], [27, -78], [27, -62], [25, -46], [26, -30], [28, -4], [31, 0], [20, 0], [19, -27], [16, -29], [14, -4], [16, 0], [6, 0]];
    const tail = [[-30, -6], [-46, -9], [-60, -5], [-69, 0], [-56, 2], [-36, 2]], leg = [[16, -30], [19, -27], [20, 0], [12, 0], [14, -4]];
    return sil([{ p: tail, c: shade(c, -.1), k: .14 }, { p: body, c }, { p: leg, c: shade(c, -.18), k: .08, n: 0 }, { p: [[25, -66], [27, -52], [23, -38], [19, -54]], c: o.c3 || shade(c, .32), k: .05, n: 0 }, { p: [[-30, -8], [-33, -24], [-24, -40], [-16, -30], [-18, -10]], c: shade(c, -.15), k: .1, n: 1 }],
      { eye: [27, -99, 1.1], shadow: o.shadow ?? 40, shadowX: -6 });
  }
  function tiger(o = {}) { // prowling, facing right, feet at 0. Stripes are clipped to each part so they wrap the body
    const c = o.c || o.body || '#d9772a', st = o.st || '#1c1719', cr = o.c3 || '#efe3cf';
    const torso = [[-52, -46], [-46, -51], [-30, -56], [-10, -58], [8, -60], [22, -64], [34, -62], [43, -52], [42, -40], [36, -34], [20, -32], [0, -30], [-20, -31], [-34, -34], [-48, -39]];
    const head = [[36, -58], [40, -66], [48, -70], [58, -68], [66, -62], [71, -56], [72, -52], [68, -48], [60, -45], [50, -45], [42, -48]];
    const legFn = [[26, -46], [40, -46], [40, -14], [44, -6], [47, 0], [35, 0], [34, -8], [30, -22]], legFf = [[12, -40], [24, -40], [22, -22], [18, -6], [19, 0], [8, 0], [9, -6], [12, -22]];
    const legHn = [[-50, -46], [-26, -46], [-24, -34], [-30, -22], [-38, -8], [-38, 0], [-50, 0], [-49, -8], [-44, -24], [-50, -36]], legHf = [[-28, -38], [-14, -38], [-13, -20], [-12, -6], [-11, 0], [-22, 0], [-22, -6], [-25, -20]];
    const tail = [[-50, -49], [-62, -46], [-72, -38], [-78, -26], [-80, -16], [-74, -15], [-72, -26], [-66, -36], [-56, -42], [-49, -42]];
    const ear1 = [[42, -66], [43, -75], [49, -69]], ear2 = [[53, -69], [57, -76], [60, -67]];
    const wedge = (x, y0, len, w, bend) => P(poly([[x - w, y0], [x + w, y0], [x + w * .5 + bend * .5, y0 + len * .55], [x + bend, y0 + len], [x - w * .45 + bend * .5, y0 + len * .55]]), st, .93);
    const band = (x0, y0, x1, y1, w) => P(poly([[x0, y0 - w], [x1, y1 - w * .6], [x1, y1 + w * .6], [x0, y0 + w]]), st, .93);
    let torsoSt = '';
    [[-46, 20, 3.4], [-38, 26, 3], [-30, 17, 3.2], [-22, 25, 3], [-14, 15, 3.2], [-6, 24, 3], [2, 16, 3], [10, 22, 2.8], [18, 15, 2.6], [26, 18, 2.4], [34, 12, 2.2]].forEach(([x, len, w], i) => {
      torsoSt += wedge(x, -66, len + 8, w, i % 2 ? -3 : 3);
      if (i % 3 === 1) torsoSt += wedge(x + 3, -46, 9, 1.6, 4); // a short fork lower on the flank
    });
    torsoSt += band(30, -38, 44, -42, 1.6) + band(28, -44, 44, -48, 1.4); // shoulder marks
    const legSt = (pts, n) => { const ys = pts.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys) - 6, xs = pts.map(p => p[0]); let g = ''; for (let i = 1; i <= n; i++) { const y = y0 + (y1 - y0) * i / (n + 1); g += band(Math.min(...xs) - 4, y - 2, Math.max(...xs) + 4, y + 2, 1.5); } return g; };
    const tailSt = [[-60, -46, -57, -40], [-68, -41, -64, -36], [-74, -34, -69, -31], [-79, -25, -73, -24], [-80, -18, -74, -18]].map(([x0, y0, x1, y1]) => band(x0, y0, x1, y1, 1.6)).join('');
    const headSt = wedge(46, -72, 9, 1.4, -1) + wedge(51, -73, 8, 1.3, 0) + wedge(56, -72, 7, 1.2, 1) + band(40, -58, 48, -55, 1.3) + band(41, -53, 49, -51, 1.1) + band(60, -66, 66, -62, 1);
    const clip = (pts, inner) => { const id = ID + 's' + (SID++); defs += `<clipPath id="${id}"><path d="${poly(pts)}"/></clipPath>`; return `<g clip-path="url(#${id})">${inner}</g>`; };
    const part = (pts, col, stripes, k) => facets(pts, col, { k: k ?? .22 }) + (stripes ? clip(pts, stripes) : '');
    let g = E(-4, 1, 56, 7, '#000', .3);
    g += part(tail, c, tailSt) + part(legFf, shade(c, -.16), legSt(legFf, 2), .12) + part(legHf, shade(c, -.16), legSt(legHf, 2), .12);
    g += part(torso, c, torsoSt) + clip(torso, P(poly([[42, -40], [36, -34], [20, -32], [0, -30], [-20, -31], [-34, -34], [-20, -35], [0, -34], [20, -35]]), cr, .95));
    g += part(legHn, c, legSt(legHn, 3), .14) + part(legFn, c, legSt(legFn, 3), .14);
    g += part(head, c, headSt) + facets([[62, -50], [70, -54], [71, -50], [66, -46], [58, -45]], cr, { k: .05, n: 0 }) + facets(ear1, c, { n: 0 }) + facets(ear2, c, { n: 0 }) + P(poly([[44, -69], [46, -72], [47, -69]]), st, .8) + P(poly([[55, -70], [57, -73], [58, -69]]), st, .8);
    return g + C(57, -60, 1.4, '#f2d27a') + C(57, -60, .6, '#111') + E(71.5, -53, 1.6, 1.2, '#2a1c1a');
  }

  function mouse(o = {}) {
    const c = o.c || o.body || '#7a6454';
    const p = [[18, -10], [12, -15], [8, -17], [6, -24], [0, -24], [1, -17], [-6, -16], [-14, -12], [-17, -6], [-16, 0], [-6, 0], [-4, -2], [2, -2], [4, 0], [10, 0], [11, -3], [15, -6]];
    return sil([{ p, c }], { eye: [12, -12, .9], lines: S('M-16 -3 C-28 -2 -34 -10 -42 -6', c, 1.4), shadow: o.shadow });
  }
  /* ---- insects & small things (seen from above unless noted) ---- */
  function beetle(o = {}) {
    const c = o.c || o.body || '#2f4a3a';
    const p = [[-3, -24], [3, -24], [6, -20], [9, -14], [12, -8], [12, 6], [9, 16], [4, 21], [0, 22], [-4, 21], [-9, 16], [-12, 6], [-12, -8], [-9, -14], [-6, -20]];
    return sil([{ p, c, n: 5 }], { lines: S('M0 -12 L0 21 M-9 -14 L9 -14', shade(c, -.35), 1) + S('M-11 -6 l-9 -7 l-3 -6 M-12 2 l-11 1 l-4 5 M-10 10 l-8 8 l-1 6 M11 -6 l9 -7 l3 -6 M12 2 l11 1 l4 5 M10 10 l8 8 l1 6 M-2 -24 q-4 -6 -9 -7 M2 -24 q4 -6 9 -7', c, 1.4) });
  }
  function cicada(o = {}) { // head up
    const c = o.c || o.body || '#2e2a20', w = o.wing || '#cfe8e0';
    const body = [[0, -18], [6, -14], [8, -6], [6, 10], [3, 20], [0, 24], [-3, 20], [-6, 10], [-8, -6], [-6, -14]];
    const lw = [[-4, -8], [-16, -2], [-24, 14], [-22, 34], [-14, 44], [-6, 28], [-4, 8]];
    return `<g opacity=".72">${sil([{ p: lw, c: w, k: .1, n: 4 }, { p: mirror(lw), c: w, k: .1, n: 4 }], { glowR: 5, lines: S('M-5 -4 L-14 10 L-15 32 M-5 0 L-9 20 L-8 34 M5 -4 L14 10 L15 32 M5 0 L9 20 L8 34', shade(w, -.3), .7) })}</g>`
      + sil([{ p: body, c, n: 4 }, { p: [[-10, -12], [-6, -18], [0, -19], [6, -18], [10, -12], [0, -10]], c: shade(c, .15), n: 1 }], { lines: C(-8, -13, 2.4, o.eyeC || '#b8402a') + C(8, -13, 2.4, o.eyeC || '#b8402a') + S('M-6 4 l-10 -2 M-6 10 l-11 4 M6 4 l10 -2 M6 10 l11 4', c, 1.2) });
  }
  function mantis(o = {}) { // side view on a stem, hind feet at 0
    const c = o.c || o.body || '#6fbf4a';
    const abd = [[-14, -20], [-10, -36], [-2, -54], [4, -58], [6, -48], [2, -30], [-6, -18]], thx = [[0, -56], [4, -58], [10, -90], [7, -92]], head = [[5, -92], [14, -100], [18, -94], [12, -88]];
    return sil([{ p: abd, c, n: 4 }, { p: [[-12, -24], [-6, -44], [2, -54], [0, -40], [-6, -26]], c: shade(c, .2), k: .08, n: 1 }, { p: thx, c, n: 0 }, { p: head, c, n: 0 }],
      { eye: [13, -95, 1.2], eyeC: '#20301a', lines: S('M8 -80 L20 -86 L16 -70 M7 -78 L18 -76 L14 -64 M-4 -22 L-14 -10 L-10 0 M0 -24 L8 -12 L4 0 M2 -40 L12 -34', c, 2) + S('M14 -98 q8 -10 16 -12 M12 -98 q4 -12 10 -18', c, .8) });
  }
  function cricket(o = {}) { // side view, facing right, feet at 0
    const c = o.c || o.body || '#2a2016';
    const body = [[-14, -6], [-10, -12], [8, -13], [14, -10], [18, -6], [14, -3], [-12, -2]], head = [[12, -11], [20, -12], [22, -6], [16, -4]], leg = [[-6, -10], [-24, -20], [-26, -16], [-8, -6]];
    return sil([{ p: body, c, n: 3 }, { p: head, c, n: 0 }, { p: leg, c: shade(c, -.15), n: 0 }], { lum: o.lum, lines: S('M-24 -19 L-30 0 M-2 -4 L-6 0 M6 -4 L9 0 M20 -11 q14 -14 28 -12 M20 -10 q12 -6 22 0 M-14 -6 l-12 3', c, 1.3) });
  }
  function worm(len = 40, c = '#d9908a') { const d = `M0 0 q${len * .15} ${-len * .2} ${len * .3} 0 t${len * .3} 0 t${len * .3} 0`; return S(d, shade(c, -.3), 5.6) + S(d, c, 4.2) + S(d, shade(c, .3), 1.2, .7); }

  /* supports & props in the same faceted style */
  const halo = (x, y, r, c, a = .5) => C(x, y, r, rg([[0, c, a], [.5, c, a * .3], [1, c, 0]]));
  const rockP = (x, y, w, h) => [[x - w, y + 2], [x - w * .94, y - h * .42], [x - w * .72, y - h * .82], [x - w * .34, y - h], [x + w * .22, y - h * .98], [x + w * .58, y - h * .88], [x + w * .88, y - h * .52], [x + w, y + 2]];
  function rock(x, y, w, h, c, o = {}) { return facets(rockP(x, y, w, h), c, Object.assign({ k: .34, n: Math.round(w * h / 500) + 3 }, o)); }
  function pad(x, y, rx, ry, c, o = {}) { // floating lily pad (top surface at y), faceted, with a notch
    const pts = [[x, y]]; for (let i = 0; i <= 18; i++) { const a = .22 + i / 18 * 5.9; pts.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
    return E(x, y + ry * .22, rx * 1.02, ry * 1.05, shade(c, -.45), .9) + facets(pts, c, { k: .22, n: o.n ?? 6 }) + S(`M${f(x)} ${f(y)} l${f(rx * .8)} ${f(-ry * .3)} M${f(x)} ${f(y)} l${f(-rx * .7)} ${f(ry * .2)} M${f(x)} ${f(y)} l${f(rx * .1)} ${f(ry * .8)} M${f(x)} ${f(y)} l${f(-rx * .3)} ${f(-ry * .7)}`, shade(c, -.28), 1, .55);
  }
  const ringsAt = (x, y, rx, ry, c, n = 3, a = .45) => Array.from({ length: n }, (_, i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * (1 + i * .35))}" ry="${f(ry * (1 + i * .35))}" fill="none" stroke="${c}" stroke-width="1.2" opacity="${f(a - i * .12)}"/>`).join('');
  const arcs = (x, y, c, dir = 1, n = 3, o = .6) => Array.from({ length: n }, (_, i) => S(`M${f(x + dir * i * 13)} ${f(y - 12 - i * 9)} q${f(dir * (10 + i * 5))} ${f(12 + i * 9)} 0 ${f(24 + i * 18)}`, c, 1.6, o - i * .15)).join('');
  /* ================= compositions ================= */
  function framePines(p, c, o = {}) { // tall pines framing the sides, rooted in the foreground (like a window onto the scene)
    const col = o.col || mix(p.deep, p.far, .14), col2 = o.col2 || mix(p.deep, p.far, .28); let g = '';
    const L = o.left !== false, Rt = o.right !== false, y = o.y ?? 800;
    if (L) g += pine(-8, y + 20, o.h1 ?? 420, col) + pine(48, y + 30, (o.h1 ?? 420) * .62, col2) + pine(18, y + 40, (o.h1 ?? 420) * .45, col);
    if (Rt) g += pine(410, y + 10, (o.h1 ?? 420) * .92, col) + pine(356, y + 34, (o.h1 ?? 420) * .55, col2) + pine(384, y + 44, (o.h1 ?? 420) * .4, col);
    return g;
  }
  const nest = (x, y, w, c) => { let g = E(x, y, w, w * .38, shade(c, -.25)); for (let i = 0; i < 26; i++) { const a = R(-.3, .3), yy = y + R(-w * .3, w * .3), l = R(w * .6, w * 1.2), xx = x + R(-w * .55, w * .55) - l / 2; g += S(`M${f(xx)} ${f(yy)} l${f(l)} ${f(l * a)}`, i % 3 ? c : shade(c, .25), R(1, 2)); } return g; };
  function snowMounds(p, y, n = 5) { let g = ''; for (let i = 0; i < n; i++) g += E(R(-20, 420), y + R(0, 60), R(30, 80), R(8, 16), p.snow, R(.25, .5)); return g; }
  function stone(x, y, w, h, c, lt) { return P(`M${f(x - w)} ${f(y)} C${f(x - w)} ${f(y - h * .9)} ${f(x - w * .4)} ${f(y - h)} ${f(x)} ${f(y - h)} C${f(x + w * .6)} ${f(y - h)} ${f(x + w)} ${f(y - h * .7)} ${f(x + w)} ${f(y)}Z`, c) + P(`M${f(x - w * .7)} ${f(y - h * .7)} C${f(x - w * .4)} ${f(y - h * .98)} ${f(x + w * .5)} ${f(y - h)} ${f(x + w * .8)} ${f(y - h * .6)} C${f(x + w * .3)} ${f(y - h * .8)} ${f(x - w * .3)} ${f(y - h * .82)} ${f(x - w * .7)} ${f(y - h * .7)}Z`, lt, .7); }
  function iceSlab(x, y, w, h, top, side) { const d = R(-.2, .2) * w; return P(`M${f(x - w)} ${f(y)} L${f(x - w * .7 + d)} ${f(y - h)} L${f(x + w * .8 + d)} ${f(y - h * .8)} L${f(x + w)} ${f(y)}Z`, top) + P(`M${f(x - w)} ${f(y)} L${f(x + w)} ${f(y)} L${f(x + w * .95)} ${f(y + h * .45)} L${f(x - w * .9)} ${f(y + h * .45)}Z`, side); }
  function floe(x, y, w, h, top, side) { const n = 7, pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(-.3, .3), r = R(.65, 1); pts.push([x + Math.cos(a) * w * r, y + Math.sin(a) * h * r]); } const low = pts.map(([px, py]) => [px, py + h * .35]); return P(poly(low), side) + P(poly(pts), top) + S(line(pts.slice(0, 3)), '#fff', 1, .5); }
  function soilSection(p, y, c) { // ground cut away to show what's underneath
    const top = mix('#5b3f2a', p.deep, .25), mid = mix('#4a3222', p.deep, .35), low = mix('#3a281c', p.deep, .45);
    let g = P(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, y + Math.sin(i * 1.3) * 4]), ` L440 ${H} L-40 ${H}Z`), top);
    g += P(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, y + 90 + Math.sin(i * .9 + 1) * 10]), ` L440 ${H} L-40 ${H}Z`), mid) + P(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, y + 190 + Math.sin(i * .7 + 2) * 14]), ` L440 ${H} L-40 ${H}Z`), low);
    for (let i = 0; i < 26; i++) g += E(R(0, 400), R(y + 20, H), R(3, 9), R(2, 5), shade(mid, R(.05, .25)), .8);
    g += S(smooth(Array.from({ length: 11 }, (_, i) => [-40 + i * 48, y + Math.sin(i * 1.3) * 4])), c.grass || '#6f9a4a', 6);
    return g;
  }
  const roots = (x, y, l, c) => S(`M${f(x)} ${f(y)} q${f(R(-8, 8))} ${f(l * .4)} ${f(R(-6, 6))} ${f(l)} M${f(x)} ${f(y + l * .3)} q${f(R(6, 14))} ${f(l * .2)} ${f(R(12, 20))} ${f(l * .5)} M${f(x)} ${f(y + l * .45)} q${f(-R(6, 14))} ${f(l * .2)} ${f(-R(12, 20))} ${f(l * .45)}`, c, 1.2, .7);
  const chamber = (x, y, rx, ry, c) => E(x, y, rx, ry, c) + E(x, y + ry * .35, rx * .9, ry * .55, shade(c, -.2), .6);
  function lightRays(x, y, n, c, a = .14) { let g = ''; for (let i = 0; i < n; i++) { const x0 = x + R(-120, 120), w = R(14, 34), l = R(260, 420), sk = R(40, 90); g += P(`M${f(x0)} ${f(y)} L${f(x0 + w)} ${f(y)} L${f(x0 + w + sk)} ${f(y + l)} L${f(x0 + sk)} ${f(y + l)}Z`, c, a * R(.5, 1)); } return g; }
  function bubbles(x, y, n, c) { let g = ''; for (let i = 0; i < n; i++) g += `<circle cx="${f(x + R(-14, 14))}" cy="${f(y - i * R(10, 18))}" r="${f(R(1.5, 3.6))}" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/>`; return g; }

  const COMP = [];
  /* 小寒 Minor Cold */
  /* 大寒 Major Cold */
  COMP[5] = { t: 'night', mtn: 'alps', hy: 520, draw(p, c) { // 水澤腹堅 lakes and marshes freeze solid
    const ice1 = mix(p.snow, p.far, .35), ice2 = mix(p.snow, p.deep, .5);
    let g = RC(-20, 520, 440, 300, lg([[0, ice1], [1, ice2]]));
    g += clipBelow(520, reflect(rangeSvg(jaggedRange(510, 160, 4, .5), mix(p.far, p.snow, .3)), 520, .25));
    let d = ''; const net = (x, y, l, a, k) => { if (k > 4 || l < 8) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l * .45; d += `M${f(x)} ${f(y)} L${f(x2)} ${f(y2)} `; net(x2, y2, l * .7, a + R(-.6, .6), k + 1); if (rnd() < .5) net(x2, y2, l * .55, a + R(-1.4, 1.4), k + 1); };
    for (let i = 0; i < 9; i++) net(200, 640, R(60, 110), i * .7 + R(-.2, .2), 0);
    g += S(d, p.deep, 4, .18) + S(d, '#ffffff', 1.8, .9) + C(200, 640, 6, '#fff', .9) + Array.from({ length: 40 }, () => C(R(20, 380), R(560, 760), R(1, 2.6), '#fff', .45)).join('') + E(200, 600, 150, 14, '#fff', .12);
    g += snowMounds(p, 560, 6) + reeds(10, 800, 160, mix(p.snow, p.deep, .25), 9, mix(p.snow, p.deep, .1)) + reeds(330, 810, 170, mix(p.snow, p.deep, .25), 9, mix(p.snow, p.deep, .1));
    g += P(smooth([[-40, 790], [60, 770], [160, 790], [260, 780], [360, 770], [440, 785]], ` L440 ${H} L-40 ${H}Z`), mix(p.snow, p.deep, .6));
    return g;
  } };
  /* 立春 Start of Spring */
  COMP[6] = { t: 'dawn', mtn: 'hills', hy: 560, sunX: 300, draw(p, c) { // 東風解凍 the east wind thaws the ice
    const bank = mix('#6b7a4a', p.deep, .45), bank2 = mix('#4f5a36', p.deep, .55);
    let g = P(`M-40 ${H} L-40 600 Q100 570 180 562 L220 562 Q300 570 440 600 L440 ${H}Z`, bank);
    g += P(`M182 562 L218 562 Q260 640 380 ${H} L20 ${H} Q140 640 182 562Z`, lg([[0, mix(p.glow, p.far, .3)], [1, mix(p.far, p.deep, .5)]]));
    for (let i = 0; i < 11; i++) { const t = (i + .5) / 11, y = 572 + t * t * 270, x = 200 + R(-1, 1) * (14 + t * 120), w = 10 + t * 52; g += floe(x, y, w, w * .3, mix(p.snow, p.glow, .2), mix(p.far, p.deep, .3)); }
    g += P(`M-40 ${H} L-40 680 Q60 650 120 700 Q150 760 140 ${H}Z`, bank2) + P(`M440 ${H} L440 670 Q340 650 290 700 Q260 770 270 ${H}Z`, bank2);
    g += E(40, 690, 40, 8, p.snow, .5) + E(360, 680, 36, 7, p.snow, .5) + grassTufts(x => 690 + (x - 60) * (x - 60) / 900, -20, 130, mix('#8fbf6a', p.deep, .2), 5, 10) + grassTufts(x => 690 + (x - 350) * (x - 350) / 900, 280, 420, mix('#8fbf6a', p.deep, .2), 5, 10);
    for (let i = 0; i < 5; i++) g += windGust(400 - i * 30, 380 + i * 34, -260 + i * 20, p.ink, .55 - i * .06, 2.2);
    g += swirl(150, 430, 30, p.ink, .5) + [[120, 400], [180, 455], [250, 420], [90, 470]].map(([x, y]) => leafShape(x, y, 9, R(0, 360), p.acc2, .9)).join('');
    return g;
  } };
  /* 雨水 Rain Water */
  COMP[11] = { t: 'day', mtn: 'hills', hy: 580, ph: 3, draw(p, c) { // 草木萌動 grass and trees begin to sprout
    let g = '';
    [[60, 610, 120], [130, 600, 90], [300, 606, 110], [360, 612, 80]].forEach(([x, y, h]) => { const t = treeLimbs(x, y, h, .55, 3, mix('#5a4a3a', p.deep, .2), 6); g += t.g + t.tips.map(([tx, ty]) => C(tx, ty, R(2, 4), mix('#bfe38a', p.glow, .1), .9) + C(tx + 3, ty - 3, 2, mix('#d8ef9f', p.glow, .2), .8)).join(''); });
    g += ground(p, c, 650, { col: mix('#6f9a4a', p.deep, .2), col2: mix('#4f7a36', p.deep, .35), amp: 8 });
    for (let r = 0; r < 5; r++) for (let x = -10; x < 420; x += 26 - r * 2) g += G(x + r * 9, 668 + r * 18, .5 + r * .1, sprout(14, mix('#a6d977', p.deep, .1 + r * .02)));
    g += facets([[60, 860], [90, 800], [150, 772], [200, 768], [256, 774], [312, 802], [340, 860]], mix('#4a3a2a', p.deep, .25), { k: .3, n: 8 }) + G(200, 772, 3.4, sprout(30, '#6fb43f', '#99cf5f')) + C(176, 676, 3, '#e8f6ff', .8) + C(232, 670, 2.5, '#e8f6ff', .8);
    return g + rainLines(70, p.ink, 0, 400, 100, 700, .28, -3);
  } };
  const limb = (x0, y0, x1, y1, w0, w1, c, bend = 0) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + bend, a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, ox = Math.cos(a), oy = Math.sin(a); return P(`M${f(x0 + ox * w0 / 2)} ${f(y0 + oy * w0 / 2)} Q${f(mx + ox * (w0 + w1) / 4)} ${f(my + oy * (w0 + w1) / 4)} ${f(x1 + ox * w1 / 2)} ${f(y1 + oy * w1 / 2)} L${f(x1 - ox * w1 / 2)} ${f(y1 - oy * w1 / 2)} Q${f(mx - ox * (w0 + w1) / 4)} ${f(my - oy * (w0 + w1) / 4)} ${f(x0 - ox * w0 / 2)} ${f(y0 - oy * w0 / 2)}Z`, c); };
  const onQuad = (x0, y0, x1, y1, bend, t) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + bend; return [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1]; };
  function strands(pts, c, l0, l1, o = .85) { let g = ''; pts.forEach(([x, y]) => { const l = R(l0, l1), sw = R(-8, 8); g += S(`M${f(x)} ${f(y)} q${f(sw)} ${f(l * .5)} ${f(sw * .4)} ${f(l)}`, c, 1.3, o); for (let k = 1; k < 5; k++) g += leafShape(x + sw * .4 * k / 5, y + l * k / 5, 6, 80 + R(-20, 20), c, o); }); return g; }
  const notes = (x, y, c, o = .8) => S(`M${x} ${y} v-14 l8 -3 v14 M${x + 18} ${y - 18} v-12`, c, 1.6, o) + E(x - 2, y, 3.2, 2.4, c, o, -20) + E(x + 6, y - 3, 3.2, 2.4, c, o, -20) + E(x + 16, y - 18, 3.2, 2.4, c, o, -20);
  function heartLeaf(x, y, s, rot, c) { return `<path d="M0 0 C${-s * .7} ${-s * .2} ${-s * .9} ${-s * .9} ${-s * .4} ${-s * 1.05} C${-s * .15} ${-s * 1.1} 0 ${-s * .9} 0 ${-s * .8} C0 ${-s * .9} ${s * .15} ${-s * 1.1} ${s * .4} ${-s * 1.05} C${s * .9} ${-s * .9} ${s * .7} ${-s * .2} 0 0Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>`; }
  function paddies(p, y0, y1, c) { let g = ''; let y = y0; for (let i = 0; y < y1; i++) { const h = 8 + i * i * 1.6; g += RC(-20, y, 440, h, mix(p.sky[p.sky.length - 2], p.deep, .25 + i * .03)) + RC(-20, y + h - 2.2, 440, 2.5 + i * .4, c); y += h; } return g; }
  /* 驚蟄 Awakening of Insects */
  COMP[12] = { t: 'day', mtn: 'hills', hy: 590, draw(p, c) { // 桃始華 peach trees begin to bloom
    let g = ground(p, c, 700, { col: mix('#7fae5a', p.deep, .25), col2: mix('#5a8a40', p.deep, .35), amp: 6 });
    const t = treeLimbs(200, 742, 420, .74, 4, mix('#4a3230', p.deep, .2), 26); g += t.g;
    const pk = ['#f6b3c4', '#f39ab0', '#fbd3dd'];
    t.tips.forEach(([x, y, d]) => { for (let k = 0; k < (d >= 3 ? 4 : 2); k++) g += blossom(x + R(-16, 16), y + R(-12, 12), R(5, 8), pk[RI(0, 2)]); });
    for (let i = 0; i < 34; i++) g += E(R(40, 360), R(460, 800), 2.8, 1.8, pk[RI(0, 2)], R(.5, .9), R(0, 180));
    return g + grassTufts(c.gy2, -20, 420, mix('#4a7a36', p.deep, .4), 6, 12);
  } };
  /* 春分 Spring Equinox */
  COMP[16] = { t: 'dusk', mtn: 'hills', hy: 610, noSun: true, streaks: false, draw(p, c) { // 雷乃發聲 thunder raises its voice
    let g = RC(0, 0, W, H, '#1a1a2a', .25) + rainLines(120, p.ink, 40, 380, 470, 700, .3, -6);
    g += storm(190, 380, 120, mix(p.far, p.deep, .25), mix(p.far, p.deep, .55));
    for (let i = 1; i <= 5; i++) g += S(`M${200 - i * 46} ${472 + i * 6} Q200 ${520 + i * 26} ${200 + i * 46} ${472 + i * 6}`, p.glow, 3.4 - i * .4, .8 - i * .12);
    g += forest(wave(660, 6, 60, 1), -40, 440, 18, 34, c.col.near, 'round', [10, 16]) + ground(p, c, 730, { amp: 8 });
    return g + S('M120 300 l-10 -16 M300 290 l10 -18 M90 360 l-18 -6 M320 350 l18 -8', p.glow, 2, .5);
  } };
  COMP[17] = { t: 'night', mtn: 'low', hy: 640, noSun: true, streaks: false, draw(p, c) { // 始電 lightning first flashes
    let g = storm(140, 230, 110, mix(p.far, p.sky[1], .4), mix(p.deep, p.sky[0], .3)) + storm(310, 270, 90, mix(p.far, p.sky[1], .3), mix(p.deep, p.sky[0], .3));
    g += C(205, 650, 260, rg([[0, '#fff8d6', .28], [1, '#fff8d6', 0]])) + bolt(210, 320, 330, '#fffbe6', '#f6f0b0');
    g += P(`M60 ${H} Q120 700 210 660 Q300 700 360 ${H}Z`, mix(p.deep, p.far, .25));
    const t = treeLimbs(212, 664, 120, .7, 3, mix(p.deep, p.far, .05), 8); g += t.g + t.tips.map(([x, y]) => C(x, y, R(6, 10), mix(p.deep, p.far, .1))).join('');
    return g + ground(p, c, 760, { amp: 10 }) + rainLines(140, p.ink, 0, 400, 300, 820, .3, -7);
  } };
  COMP[18] = { t: 'day', mtn: 'hills', hy: 600, ph: 4, draw(p, c) { // 桐始華 paulownia trees begin to bloom
    let g = ground(p, c, 700, { col: mix('#7fae5a', p.deep, .25), col2: mix('#5a8a40', p.deep, .38) });
    const t = treeLimbs(200, 742, 400, .7, 4, mix('#6a5a56', p.deep, .15), 24); g += t.g;
    t.tips.forEach(([x, y, d]) => { if (d >= 2) g += heartLeaf(x + R(-14, 14), y + R(4, 16), R(10, 16), R(-60, 60), mix('#7fae5a', p.deep, .1)); });
    t.tips.forEach(([x, y, d]) => { if (d < 2) return; for (let k = 0; k < 7; k++) g += E(x + R(-6, 6), y - k * 6 - 4, 3.6 - k * .3, 5, k % 2 ? '#b79ae6' : '#a283d8', 1, R(-20, 20)); g += C(x, y - 46, 2, '#d8c8f2'); });
    for (let i = 0; i < 16; i++) g += E(R(60, 340), R(700, 800), 3, 4.5, '#b79ae6', .7, R(0, 180));
    return g;
  } };
  COMP[20] = { t: 'day', mtn: 'alps', hy: 600, sunX: 70, draw(p, c) { // 虹始見 rainbows first appear
    let g = puff(250, 230, 70, '#fff', .55) + puff(30, 300, 50, '#fff', .4) + water(600, 80, p, {});
    g += rainbow(200, 650, 205, .7) + `<g opacity=".25">${reflect(rainbow(200, 650, 205, .6), 650)}</g>`;
    g += ground(p, c, 700, { col: mix('#6f9a4a', p.deep, .25), col2: mix('#4f7a36', p.deep, .4) }) + E(150, 760, 50, 7, p.sky[2], .6) + E(280, 790, 40, 6, p.sky[2], .6);
    return g + grassTufts(c.gy2, -20, 420, mix('#4f7a36', p.deep, .5), 8, 16) + Array.from({ length: 20 }, () => C(R(0, 400), R(700, 840), 1.6, '#e8f6ff', .7)).join('');
  } };
  /* 穀雨 Grain Rain */
  COMP[21] = { t: 'day', mtn: 'hills', hy: 460, ph: 5, draw(p, c) { // 萍始生 duckweed begins to grow
    const w1 = mix(p.sky[2], '#3f7a6a', .45), w2 = mix('#24504a', p.deep, .3);
    let g = forest(wave(470, 5, 40, 2), -40, 440, 16, 30, c.col.mid, 'round', [10, 16]) + RC(-20, 480, 440, 400, lg([[0, w1], [1, w2]]));
    for (let i = 0; i < 520; i++) { const y = 490 + Math.pow(rnd(), .8) * 360, cl = Math.sin(y / 40) * 120 + 200, x = cl + R(-1, 1) * R(40, 220), s = .6 + (y - 480) / 360 * 2.2; g += E(x, y, s * 2.2, s * 1.3, i % 3 ? '#9fd45a' : '#bfe56f', .95); }
    [[110, 640, 34], [300, 700, 46], [210, 790, 40]].forEach(([x, y, r]) => { g += P(`M${x} ${y} L${x + r} ${y - 4} A${r} ${r * .42} 0 1 1 ${x + r * .9} ${y + 6}Z`, '#5f9a4a') + S(`M${x} ${y} l${r * .7} ${-r * .2} M${x} ${y} l${r * .6} ${r * .25} M${x} ${y} l${-r * .7} ${r * .1}`, '#4a7a3a', 1, .8); });
    g += E(300, 676, 9, 12, '#f4d6e0') + E(292, 680, 8, 10, '#f9e6ec') + E(308, 680, 8, 10, '#f9e6ec') + C(300, 672, 2.4, '#f2c96b');
    return g + reeds(0, 860, 200, mix('#6f9a4a', p.deep, .2), 7) + reeds(360, 860, 220, mix('#6f9a4a', p.deep, .2), 7);
  } };
  const lilyPad = (x, y, r, c, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${P(`M0 0 L${f(r)} ${f(-r * .08)} A${f(r)} ${f(r * .38)} 0 1 1 ${f(r * .92)} ${f(r * .12)}Z`, c)}${S(`M0 0 l${f(r * .7)} ${f(-r * .14)} M0 0 l${f(-r * .6)} ${f(r * .12)} M0 0 l${f(r * .1)} ${f(r * .3)} M0 0 l${f(-r * .2)} ${f(-r * .3)}`, shade(c, -.25), 1, .7)}</g>`;
  const mushroom = (x, y, s, cap, stem) => P(`M${f(x - s * .18)} ${f(y)} L${f(x - s * .12)} ${f(y - s * .7)} L${f(x + s * .12)} ${f(y - s * .7)} L${f(x + s * .18)} ${f(y)}Z`, stem) + P(`M${f(x - s * .6)} ${f(y - s * .66)} C${f(x - s * .55)} ${f(y - s * 1.2)} ${f(x + s * .55)} ${f(y - s * 1.2)} ${f(x + s * .6)} ${f(y - s * .66)}Z`, cap) + C(x - s * .2, y - s * .92, s * .07, '#fff', .7) + C(x + s * .18, y - s * .84, s * .06, '#fff', .7);
  function sowThistle(x, y, h, c, fl) { let g = S(`M${f(x)} ${f(y)} Q${f(x + R(-6, 6))} ${f(y - h * .5)} ${f(x + R(-4, 4))} ${f(y - h)}`, c, 2.2); for (let k = 0; k < 3; k++) { const yy = y - h * (.2 + k * .2), s = k % 2 ? 1 : -1; g += P(`M${f(x)} ${f(yy)} l${s * 10} -6 l${s * 2} 4 l${s * 10} -5 l${s * 1} 5 l${s * 9} -3 l${-s * 8} 8 l${-s * 10} 0Z`, c); }
    const tops = [[0, 0], [-14, 12], [12, 16]]; tops.forEach(([dx, dy]) => { const fx = x + dx, fy = y - h + dy; g += S(`M${f(x)} ${f(y - h * .75)} Q${f(fx)} ${f(fy + 20)} ${f(fx)} ${f(fy)}`, c, 1.4); let rd = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; rd += `M${f(fx + Math.cos(a) * 2.5)} ${f(fy + Math.sin(a) * 2.5)} L${f(fx + Math.cos(a) * 9)} ${f(fy + Math.sin(a) * 9)} `; } g += S(rd, fl, 1.6) + C(fx, fy, 3, shade(fl, -.15)); }); return g; }
  function stook(x, y, h, c, dk) { let g = ''; for (let i = -7; i <= 7; i++) { const bx = x + i * h * .045, wx = x + i * h * .012, tx = x + i * h * .05 + R(-2, 2), ty = y - h + Math.abs(i) * h * .02; g += S(`M${f(bx)} ${f(y)} Q${f(wx)} ${f(y - h * .45)} ${f(tx)} ${f(ty)}`, i % 2 ? c : shade(c, -.1), 3.2); g += E(tx, ty - 5, 2.6, 7, shade(c, .08), 1, i * 6); } g += E(x, y - h * .45, h * .1, h * .035, dk); return g; }
  function fern(x, y, l, rot, c) { let g = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` + S(`M0 0 Q${f(l * .2)} ${f(-l * .5)} 0 ${f(-l)}`, c, 1.4); for (let i = 1; i < 12; i++) { const t = i / 12, yy = -l * t, w = (1 - t) * l * .28 + 3; g += leafShape(t * l * .1, yy, w, -20, c) + leafShape(t * l * .1, yy, w, 200, c); } return g + '</g>'; }
  function pinellia(x, y, s, c) { // 半夏: three-lobed leaves and a hooded spathe with a long tail
    let g = S(`M${x} ${y} q-2 ${-s * .6} -6 ${-s}`, c, 1.8) + S(`M${x + 6} ${y} q4 ${-s * .7} 12 ${-s * 1.3}`, c, 1.8);
    [[-6, -s], [18, -s * 1.3]].forEach(([dx, dy]) => { [-40, 0, 40].forEach(r => g += leafShape(x + dx, y + dy, s * .55, -90 + r, shade(c, r ? 0 : .12))); });
    g += S(`M${x + 2} ${y} q6 ${-s * .5} 2 ${-s * .9}`, shade(c, .15), 1.6) + P(`M${x + 2} ${y - s * .9} c-6 -4 -6 -18 2 -24 c6 6 8 18 -2 24Z`, shade(c, .25)) + S(`M${x + 3} ${y - s * .9 - 22} q12 -20 4 -40 q-4 -10 6 -20`, shade(c, .3), 1.2);
    return g;
  }
  function fencePost(x, y, h, c, top) { return RC(x - 6, y - h, 12, h, c) + P(`M${x - 6} ${y - h} L${x} ${y - h - 6} L${x + 6} ${y - h}Z`, top || shade(c, .1)) + S(`M${x - 3} ${y - h + 10} l0 ${h - 20}`, shade(c, -.2), 1, .6); }
  function barkTrunk(x, y0, y1, w, c) { let g = P(`M${x - w / 2} ${y0} C${x - w / 2 - 4} ${(y0 + y1) / 2} ${x - w / 2 + 3} ${y1 + 40} ${x - w / 2 + 4} ${y1} L${x + w / 2 - 4} ${y1} C${x + w / 2 - 3} ${y1 + 40} ${x + w / 2 + 4} ${(y0 + y1) / 2} ${x + w / 2} ${y0}Z`, c); for (let i = 0; i < 18; i++) { const xx = x + R(-w * .4, w * .4), yy = R(y1 + 20, y0 - 20); g += S(`M${f(xx)} ${f(yy)} q${f(R(-3, 3))} ${f(R(14, 30))} 0 ${f(R(30, 60))}`, shade(c, -.25), R(1, 2.4), .7); } return g + P(`M${x + w * .18} ${y0} C${x + w * .3} ${(y0 + y1) / 2} ${x + w * .2} ${y1 + 40} ${x + w * .25} ${y1} L${x + w / 2 - 4} ${y1} C${x + w / 2 - 3} ${y1 + 40} ${x + w / 2 + 4} ${(y0 + y1) / 2} ${x + w / 2} ${y0}Z`, shade(c, .15), .45); }
  /* 立夏 Start of Summer */
  COMP[26] = { t: 'day', mtn: 'hills', hy: 600, ph: 3, draw(p, c) { // 王瓜生 snake gourds sprout
    let g = ground(p, c, 720, { col: mix('#7a8a4a', p.deep, .3), col2: mix('#5a6a3a', p.deep, .45), amp: 5 });
    const bam = mix('#c9b27a', p.deep, .2), vine = mix('#5f9a3e', p.deep, .1);
    [100, 200, 300].forEach(x => g += RC(x - 4, 330, 8, 410, bam) + S(`M${x - 4} ${400} h8 M${x - 4} 520 h8 M${x - 4} 640 h8`, shade(bam, -.3), 1.5));
    [360, 470, 580].forEach(y => g += RC(70, y - 3, 260, 6, bam));
    let d = 'M110 740'; for (let y = 700; y > 340; y -= 40) d += ` Q${130 + (y % 80 ? 50 : -30)} ${y + 20} ${y % 80 ? 190 : 120} ${y}`; g += S(d, vine, 2.4) + S('M210 740 Q260 640 230 560 Q200 480 270 420 Q320 380 300 340', vine, 2.2);
    for (let i = 0; i < 26; i++) g += heartLeaf(R(90, 320), R(350, 720), R(12, 20), R(-60, 60), i % 2 ? vine : shade(vine, .15));
    [[150, 450], [250, 520], [180, 610], [280, 400]].forEach(([x, y]) => { g += S(`M${x} ${y} l0 18`, vine, 1.4) + E(x, y + 40, 6, 26, '#7fbf5a') + S(`M${x - 3} ${y + 22} l0 34 M${x + 3} ${y + 22} l0 34`, '#a9db8f', 1, .7); });
    [[210, 440], [130, 560], [270, 600], [160, 380]].forEach(([x, y]) => { for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g += S(`M${x} ${y} l${f(Math.cos(a) * 8)} ${f(Math.sin(a) * 8)}`, '#fbf8f2', 4); for (let k = 0; k < 4; k++) g += S(`M${f(x + Math.cos(a) * 9)} ${f(y + Math.sin(a) * 9)} l${f(Math.cos(a + (k - 1.5) * .3) * 10)} ${f(Math.sin(a + (k - 1.5) * .3) * 10)}`, '#fbf8f2', .7, .9); } g += C(x, y, 2.4, '#f2e6a0'); });
    return g;
  } };
  /* 小滿 Grain Buds */
  COMP[27] = { t: 'day', mtn: 'hills', hy: 580, ph: 1, draw(p, c) { // 苦菜秀 bitter herbs flourish
    let g = ground(p, c, 640, { col: mix('#7faa4a', p.deep, .25), col2: mix('#5a8a36', p.deep, .38), amp: 6 });
    for (let i = 0; i < 20; i++) { const x = R(-10, 410), y = R(650, 700); g += sowThistle(x, y, R(30, 50), mix('#6f9a3e', p.deep, .3), '#f2d24a'); }
    g += sowThistle(200, 800, 300, mix('#5f8f36', p.deep, .1), '#f6d33a') + sowThistle(110, 820, 220, mix('#5f8f36', p.deep, .15), '#f2c93a') + sowThistle(300, 830, 240, mix('#5f8f36', p.deep, .15), '#f2c93a');
    const bf = (x, y, cc) => E(x - 6, y - 4, 7, 5, cc, .95, -30) + E(x + 6, y - 4, 7, 5, cc, .95, 30) + E(x - 4, y + 3, 4, 3, cc, .9, 30) + E(x + 4, y + 3, 4, 3, cc, .9, -30) + RC(x - 1, y - 6, 2, 11, '#2a2a2a');
    return g + bf(150, 470, '#f2f0e8') + bf(270, 430, '#f2b84a') + grassTufts(x => 845, -20, 420, mix('#4a7a2e', p.deep, .4), 10, 20);
  } };
  COMP[28] = { t: 'day', mtn: 'low', hy: 600, sunX: 200, sunY: 210, draw(p, c) { // 靡草死 delicate grasses wither
    const dry = mix('#c9a85a', p.deep, .25), earth = mix('#a8845a', p.deep, .3);
    let g = C(200, 210, 150, rg([[0, '#fff3c0', .35], [1, '#fff3c0', 0]])) + ground(p, c, 650, { col: mix('#b89a5a', p.deep, .35), col2: earth, amp: 4, gap: 50 });
    let d = ''; for (let i = 0; i < 30; i++) { const x = R(20, 380), y = R(720, 840); d += `M${f(x)} ${f(y)} l${f(R(-30, 30))} ${f(R(-6, 6))} l${f(R(-20, 20))} ${f(R(-6, 6))} `; } g += S(d, shade(earth, -.35), 1.4, .8);
    for (let i = 0; i < 5; i++) g += S(`M20 ${560 + i * 18} q40 -6 80 0 t80 0 t80 0 t80 0 t80 0`, '#fff8e0', 1.4, .3);
    for (let x = -10; x < 420; x += 6) { const h = R(20, 60), bend = R(10, 30); g += S(`M${f(x)} ${f(700 + R(-6, 6))} q${f(bend * .3)} ${f(-h * .7)} ${f(bend)} ${f(-h * .6)}`, dry, 1.4, .9); }
    for (let i = 0; i < 34; i++) { const a0 = -Math.PI / 2 + R(-1.1, 1.1), l = R(120, 240), x1 = 200 + Math.cos(a0) * l * .6, y1 = 760 + Math.sin(a0) * l * .8, droop = R(30, 70) * Math.sign(Math.cos(a0) || 1); g += S(`M${f(200 + R(-14, 14))} 762 Q${f(x1)} ${f(y1)} ${f(x1 + droop)} ${f(y1 + R(20, 60))}`, i % 3 ? dry : mix('#9a7a3a', p.deep, .15), R(1.6, 3)); }
    g += E(200, 764, 46, 10, shade(earth, -.25)) + [[300, 770], [110, 780]].map(([x, y]) => S(`M${x} ${y} q-4 -40 -26 -50 M${x + 4} ${y} q6 -36 30 -44`, dry, 2)).join('');
    return g;
  } };
  COMP[29] = { t: 'dusk', mtn: 'hills', hy: 580, sunX: 250, draw(p, c) { // 麥秋至 the barley harvest arrives
    const gold = mix('#e2b45a', p.deep, .15);
    let g = ground(p, c, 620, { col: mix('#c99a4a', p.deep, .3), col2: mix('#a87a36', p.deep, .38), amp: 5 });
    for (let r = 0; r < 4; r++) for (let x = -10; x < 420; x += 11 + r * 2) g += wheatStalk(x + R(-3, 3), 630 + r * 10, 24 + r * 6, mix(gold, p.deep, .35 - r * .06), 4);
    g += stook(110, 712, 90, mix(gold, p.deep, .2), mix('#8a5a2a', p.deep, .2)) + stook(205, 700, 120, gold, mix('#8a5a2a', p.deep, .1)) + stook(300, 714, 86, mix(gold, p.deep, .2), mix('#8a5a2a', p.deep, .2));
    for (let x = -14; x < 420; x += 10) g += wheatStalk(x, 830 + R(0, 30), R(70, 100), mix(gold, p.deep, .45), R(4, 12));
    return g + S('M40 530 q20 -8 40 0 M300 500 q16 -6 32 0', p.deep, 1.6, .5);
  } };
  /* 芒種 Grain in Ear */
  /* 夏至 Summer Solstice */
  COMP[35] = { t: 'dawn', mtn: 'hills', hy: 560, ph: 4, draw(p, c) { // 半夏生 crow-dipper sprouts
    let g = forest(wave(600, 6, 40, 2), -40, 440, 40, 80, c.col.mid, 'spire', [5, 10]) + fog(640, 60, p.fog, .7) + ground(p, c, 700, { col: mix('#4f6a46', p.deep, .45), col2: mix('#33463a', p.deep, .5) });
    g += lightRays(260, 300, 5, p.glow, .12);
    [[20, 860, 160, 20], [60, 860, 130, -10], [380, 860, 170, -20], [340, 860, 140, 10]].forEach(([x, y, l, r]) => g += fern(x, y, l, r, mix('#5f8a4a', p.deep, .3)));
    g += pinellia(150, 760, 90, '#6fa24a') + pinellia(230, 790, 120, '#7fb252') + pinellia(300, 740, 70, '#6fa24a') + pinellia(100, 800, 60, '#5f924a');
    return g + Array.from({ length: 16 }, () => C(R(40, 360), R(560, 780), R(1, 2), '#e8f4e0', .6)).join('');
  } };
  function stoneWall(y0, y1, c, mortar) { let g = RC(-20, y0, 440, y1 - y0, mortar); for (let y = y0 + 4, r = 0; y < y1; r++) { const h = R(30, 44); for (let x = -30 + (r % 2) * 24; x < 420;) { const w = R(46, 74); g += P(`M${f(x + 4)} ${f(y + 3)} Q${f(x + w / 2)} ${f(y - 1)} ${f(x + w - 3)} ${f(y + 4)} Q${f(x + w + 1)} ${f(y + h / 2)} ${f(x + w - 4)} ${f(y + h - 3)} Q${f(x + w / 2)} ${f(y + h + 1)} ${f(x + 3)} ${f(y + h - 4)} Q${f(x - 1)} ${f(y + h / 2)} ${f(x + 4)} ${f(y + 3)}Z`, shade(c, R(-.12, .12))) + P(`M${f(x + 6)} ${f(y + 5)} Q${f(x + w / 2)} ${f(y + 2)} ${f(x + w - 6)} ${f(y + 6)} L${f(x + w - 8)} ${f(y + 12)} Q${f(x + w / 2)} ${f(y + 8)} ${f(x + 8)} ${f(y + 11)}Z`, '#fff', .07); x += w + 4; } y += h + 4; } return g; }
  function bigLeaf(x, y, l, rot, c) { return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${P(`M0 0 C${l * .1} ${-l * .35} ${l * .6} ${-l * .42} ${l} ${-l * .05} C${l * .6} ${l * .3} ${l * .1} ${l * .25} 0 0Z`, c)}${S(`M0 0 Q${l * .5} ${-l * .08} ${l} ${-l * .05}` + Array.from({ length: 6 }, (_, i) => { const t = (i + 1) / 7; return ` M${f(l * t)} ${f(-l * .06 * t)} l${f(l * .08)} ${f(-l * .14)} M${f(l * t)} ${f(-l * .06 * t)} l${f(l * .08)} ${f(l * .12)}`; }).join(''), shade(c, -.2), 1.2, .6)}</g>`; }
  function riceEar(x, y, h, c, bow) { let g = S(`M${f(x)} ${f(y)} Q${f(x + 2)} ${f(y - h * .7)} ${f(x + bow * .5)} ${f(y - h)}`, mix(c, '#6a8a3a', .5), 1.8); for (let i = 0; i < 9; i++) { const t = i / 9, px = x + bow * .5 + bow * .5 * t, py = y - h + t * h * .5; g += E(px - 3, py, 2.2, 4.4, c, 1, 30 + t * 40) + E(px + 3, py + 1, 2.2, 4.4, shade(c, -.08), 1, -10 + t * 40); } return g; }
  function crag(x, y, w, h, c, lt) { return P(`M${x - w} ${H} L${x - w} ${y + h * .4} L${x - w * .7} ${y + h * .1} L${x - w * .3} ${y} L${x + w * .2} ${y + h * .05} L${x + w * .6} ${y + h * .2} L${x + w} ${y + h * .5} L${x + w} ${H}Z`, c) + P(`M${x - w * .3} ${y} L${x + w * .2} ${y + h * .05} L${x + w * .6} ${y + h * .2} L${x + w * .4} ${y + h * .4} L${x} ${y + h * .3} L${x - w * .2} ${y + h * .22}Z`, lt, .55) + S(`M${x - w * .5} ${y + h * .5} l20 30 M${x + w * .3} ${y + h * .6} l-14 40`, shade(c, -.3), 2, .6); }
  /* 小暑 Minor Heat */
  COMP[36] = { t: 'dusk', mtn: 'hills', hy: 590, draw(p, c) { // 溫風至 warm winds arrive
    let g = ground(p, c, 640, { col: mix('#8a9a5a', p.deep, .35), col2: mix('#6a7a46', p.deep, .45), amp: 5 });
    const t = treeLimbs(330, 660, 200, .6, 3, mix('#3a3030', p.deep, .2), 10); g += `<g transform="rotate(8 330 660)">${t.g}${t.tips.map(([x, y]) => C(x + 6, y, R(14, 22), mix('#5f7a46', p.deep, .3))).join('')}</g>`;
    for (let x = -10; x < 430; x += 4) { const h = R(40, 120), y = 760 + R(-10, 60); g += S(`M${f(x)} ${f(y)} q${f(h * .15)} ${f(-h * .6)} ${f(h * .45)} ${f(-h)}`, mix('#b9b06a', p.deep, R(.2, .45)), 1.4, .9); }
    for (let i = 0; i < 7; i++) g += windGust(-20 + i * 12, 360 + i * 38, 360 - i * 20, i % 2 ? p.sun : '#fff', .8 - i * .07, 3.2 - i * .2);
    g += swirl(250, 420, 26, p.sun, .55, 2);
    for (let i = 0; i < 12; i++) { const x = R(60, 360), y = R(360, 600); g += S(`M${f(x)} ${f(y)} l6 -6`, '#fff', 1, .8) + C(x + 6, y - 6, 2.2, '#fff', .7); }
    return g;
  } };
  /* 大暑 Major Heat */
  COMP[39] = { t: 'night', mtn: 'hills', hy: 560, draw(p, c) { // 腐草爲螢 rotting grass becomes fireflies
    let g = water(600, 40, p, { dark: .7 }) + ground(p, c, 640, { col: mix('#1f3a2e', p.deep, .4), col2: mix('#10241e', p.deep, .4), amp: 6 });
    for (let x = -10; x < 430; x += 5) { const h = R(30, 110), y = 860 - R(0, 80); g += S(`M${f(x)} ${f(y)} q${f(R(-8, 8))} ${f(-h * .6)} ${f(R(-14, 14))} ${f(-h)}`, mix('#0a1a14', p.deep, .2), 1.6, .95); }
    for (let i = 0; i < 80; i++) { const a = R(0, 6.283), r = Math.pow(rnd(), .7) * 200, x = 200 + Math.cos(a) * r, y = 560 + Math.sin(a) * r * .9; g += C(x, y, R(1.6, 2.8), p.acc2, R(.75, 1)); }
    return g;
  } };
  COMP[40] = { t: 'dawn', mtn: 'hills', hy: 560, draw(p, c) { // 土潤溽暑 the earth is damp, the air sultry
    let g = forest(wave(590, 6, 40, 2), -40, 440, 30, 60, c.col.mid, 'round', [8, 14]);
    for (let i = 0; i < 6; i++) g += band(470 + i * 40, 30, p.fog, .5);
    g += ground(p, c, 700, { col: mix('#3f5a3a', p.deep, .45), col2: mix('#2f4a2e', p.deep, .5) });
    for (let i = 0; i < 7; i++) { const x = 60 + i * 48 + R(-10, 10); g += S(`M${x} 700 q-14 -40 0 -80 q14 -40 0 -90`, p.fog, 6, .25) + S(`M${x} 700 q-14 -40 0 -80 q14 -40 0 -90`, '#fff', 2, .2); }
    const lf = mix('#4f8a46', p.deep, .2);
    g += S('M60 860 Q70 760 100 680 M340 860 Q330 760 300 690', mix('#3f6a36', p.deep, .2), 5) + bigLeaf(100, 680, 150, -120, lf) + bigLeaf(300, 690, 160, -60, shade(lf, .08)) + bigLeaf(150, 860, 180, -70, shade(lf, -.1)) + bigLeaf(260, 860, 170, -110, lf);
    for (let i = 0; i < 18; i++) g += C(R(60, 340), R(560, 800), R(1.5, 3), '#eaf6f2', .7);
    return g;
  } };
  /* 立秋 Start of Autumn */
  COMP[42] = { t: 'day', mtn: 'alps', hy: 600, draw(p, c) { // 涼風至 cool winds arrive
    let g = ground(p, c, 690, { col: mix('#a8925a', p.deep, .3), col2: mix('#7a6a40', p.deep, .4) });
    const t = treeLimbs(80, 720, 320, .62, 4, mix('#3a2a22', p.deep, .2), 18);
    g += `<g transform="rotate(6 80 720)">${t.g}${t.tips.map(([x, y]) => leafShape(x, y, 12, R(0, 60), [p.acc, p.acc2, '#d9b04a'][RI(0, 2)])).join('')}</g>`;
    for (let i = 0; i < 5; i++) g += windGust(40 + i * 10, 360 + i * 46, 360 - i * 30, p.ink, .6 - i * .08, 2.2);
    for (let i = 0; i < 40; i++) { const t2 = rnd(), x = 110 + t2 * 290, y = 380 + Math.sin(t2 * 7) * 60 + R(-50, 50) + t2 * 60; g += leafShape(x, y, R(8, 13), R(0, 360), [p.acc, p.acc2, '#d9b04a'][RI(0, 2)], .95); }
    for (let x = -10; x < 430; x += 5) g += S(`M${f(x)} ${f(860 - R(0, 50))} q8 -30 26 -44`, mix('#8a7a46', p.deep, .45), 1.4);
    return g;
  } };
  COMP[43] = { t: 'dawn', mtn: 'hills', hy: 580, draw(p, c) { // 白露降 white dew descends
    let g = fog(620, 80, p.fog, .7) + ground(p, c, 700, { col: mix('#7a8a5a', p.deep, .35), col2: mix('#5a6a46', p.deep, .45) });
    const st = mix('#6a7a46', p.deep, .2);
    g += S('M80 860 Q90 600 110 300 M330 860 Q320 600 300 320', st, 3) + S('M110 300 q-10 -20 -30 -30 M300 320 q10 -20 30 -26', st, 2);
    g += S('M108 330 L200 470 L302 340 M112 420 L200 470 L296 600 M104 560 L200 470', '#eef2f2', .9, .85) + web(200, 470, 110, '#f2f6f6', '#ffffff');
    for (let x = -10; x < 430; x += 6) { const h = R(40, 120); g += S(`M${f(x)} 860 q${f(R(-6, 6))} ${f(-h * .6)} ${f(R(-10, 10))} ${f(-h)}`, mix('#5a6a3e', p.deep, .35), 1.4) + (rnd() < .4 ? C(x + R(-6, 6), 860 - h * R(.5, .9), R(1.4, 2.6), '#fff', .85) : ''); }
    return g;
  } };
  /* 處暑 End of Heat */
  COMP[46] = { t: 'dawn', mtn: 'alps', hy: 600, sunX: 90, draw(p, c) { // 天地始肅 heaven and earth grow austere
    let g = fog(640, 60, p.fog, .8);
    const cr = [[140, H], [166, 600], [218, 520], [262, 502], [302, 530], [334, 612], [346, H]];
    g += facets(cr, mix(p.far, p.deep, .6), { k: .36, n: 14 });
    const pn = mix(p.deep, '#1a2a22', .3);
    g += S('M262 502 Q250 470 264 440 Q280 410 266 380', pn, 7) + S('M264 440 Q230 432 200 444 M268 412 Q300 404 330 412 M266 386 Q246 372 230 376', pn, 4);
    [[198, 440, 34], [228, 432, 26], [330, 408, 34], [300, 404, 24], [232, 372, 26], [266, 366, 30]].forEach(([x, y, w]) => g += E(x, y - 4, w, 9, pn) + E(x, y - 8, w * .7, 5, shade(pn, .15), .7));
    g += ground(p, c, 790, { amp: 6 }) + S('M40 320 h60 M300 260 h40', p.ink, 1, .3);
    return g + G(110, 330, .5, goose({ body: '#4a4048', dark: '#1a1418' }, true), { rot: -6 });
  } };
  function oakLeaf(x, y, s, rot, c) { return `<path d="M0 0 C${s * .1} ${-s * .2} ${s * .3} ${-s * .3} ${s * .3} ${-s * .15} C${s * .45} ${-s * .32} ${s * .6} ${-s * .3} ${s * .58} ${-s * .14} C${s * .75} ${-s * .28} ${s * .95} ${-s * .2} ${s} 0 C${s * .95} ${s * .2} ${s * .75} ${s * .28} ${s * .58} ${s * .14} C${s * .6} ${s * .3} ${s * .45} ${s * .32} ${s * .3} ${s * .15} C${s * .3} ${s * .3} ${s * .1} ${s * .2} 0 0Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>`; }
  const acorn = (x, y, s) => E(x, y + s * .3, s * .42, s * .55, '#a8743a') + P(`M${f(x - s * .5)} ${f(y)} Q${f(x)} ${f(y - s * .55)} ${f(x + s * .5)} ${f(y)}Z`, '#6a4a2a') + S(`M${f(x)} ${f(y - s * .4)} l${f(s * .1)} ${f(-s * .25)}`, '#6a4a2a', s * .12);
  function ginkgoLeaf(x, y, s, rot, c) { return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${P(`M0 0 L${f(-s * .5)} ${f(-s * .8)} Q0 ${f(-s * 1.05)} ${f(s * .5)} ${f(-s * .8)}Z`, c)}${S(`M0 0 l0 ${f(s * .35)}`, c, 1)}</g>`; }
  /* 白露 White Dew */
  /* 秋分 Autumn Equinox */
  COMP[51] = { t: 'dusk', mtn: 'low', hy: 600, sunX: 120, draw(p, c) { // 雷始收聲 thunder lowers its voice
    let g = storm(330, 560, 44, mix(p.far, p.deep, .3), mix(p.far, p.deep, .5)) + bolt(334, 588, 40, '#fff4d6', '#ffe8a0') + rainLines(20, p.ink, 290, 380, 590, 640, .3);
    for (let i = 1; i <= 3; i++) g += S(`M${330 - i * 14} ${600 + i * 3} Q330 ${606 + i * 8} ${330 + i * 14} ${600 + i * 3}`, p.glow, 1.4, .5 - i * .12);
    g += water(600, 90, p, { sunX: c.sunX }) + ground(p, c, 700, { col: mix('#7a5a40', p.deep, .45), col2: mix('#4a3428', p.deep, .5) });
    const t = treeLimbs(140, 740, 220, .66, 3, mix('#2a1e1e', p.deep, .2), 12); g += t.g + t.tips.map(([x, y]) => C(x, y, R(12, 22), mix('#a8542e', p.deep, .35))).join('');
    return g + puff(60, 260, 60, p.glow, .25) + puff(240, 200, 46, p.glow, .2);
  } };
  /* 寒露 Cold Dew */
  COMP[56] = { t: 'day', mtn: 'hills', hy: 590, ph: 1, draw(p, c) { // 菊有黃華 chrysanthemums bloom yellow
    let g = ground(p, c, 660, { col: mix('#7a8a4a', p.deep, .35), col2: mix('#4f5a36', p.deep, .45) });
    const post = mix('#8a6a4a', p.deep, .3); [40, 110, 290, 360].forEach(x => g += fencePost(x, 690, 70, post)); g += S('M40 640 L360 640 M40 664 L360 664', post, 4);
    const lf = mix('#4f7a3a', p.deep, .2);
    for (let i = 0; i < 22; i++) g += leafShape(R(80, 320), R(660, 820), R(20, 30), R(-180, 0), i % 2 ? lf : shade(lf, .12));
    [[200, 600, 46], [130, 660, 34], [272, 650, 38], [90, 740, 28], [320, 730, 30], [200, 720, 36], [160, 560, 24], [250, 560, 26]].forEach(([x, y, r]) => g += S(`M${x} ${y} l${f(R(-8, 8))} 120`, lf, 2.2) + chrysanthemum(x, y, r, '#f4c62e', '#c98a1a'));
    return g;
  } };
  /* 霜降 Frost Descent */
  COMP[58] = { t: 'day', mtn: 'hills', hy: 610, ph: 2, draw(p, c) { // 草木黃落 leaves turn yellow and fall
    const gold = ['#f2c43a', '#e8b02a', '#f6d65a', '#d99a2a'];
    let g = ground(p, c, 710, { col: mix('#c9a03a', p.deep, .25), col2: mix('#a87a2a', p.deep, .3) });
    const t = treeLimbs(200, 742, 380, .7, 4, mix('#4a3a30', p.deep, .2), 26); g += t.g;
    t.tips.forEach(([x, y, d]) => { const n = d >= 3 ? 7 : 3; for (let k = 0; k < n; k++) g += ginkgoLeaf(x + R(-20, 20), y + R(-16, 16), R(10, 15), R(0, 360), gold[RI(0, 3)]); });
    for (let i = 0; i < 40; i++) g += ginkgoLeaf(R(20, 380), R(420, 720), R(9, 13), R(0, 360), gold[RI(0, 3)]);
    for (let i = 0; i < 80; i++) g += ginkgoLeaf(R(-10, 410), R(720, 850), R(8, 12), R(0, 360), gold[RI(0, 3)]);
    return g;
  } };
  function icicles(x0, x1, y, c, n = 10) { let g = ''; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + R(.2, .8)) / n, l = R(10, 34); g += P(`M${f(x - 3)} ${f(y)} L${f(x + 3)} ${f(y)} L${f(x)} ${f(y + l)}Z`, c, .9); } return g; }
  function pavilion(x, y, s, c) { return RC(x - s, y - s * .5, s * 2, s * .5, c) + P(`M${x - s * 1.4} ${y - s * .5} Q${x} ${y - s * .75} ${x + s * 1.4} ${y - s * .5} L${x + s * .9} ${y - s * 1} L${x - s * .9} ${y - s * 1}Z`, c) + RC(x - s * .6, y - s * 1.4, s * 1.2, s * .4, c) + P(`M${x - s} ${y - s * 1.4} Q${x} ${y - s * 1.6} ${x + s} ${y - s * 1.4} L${x + s * .5} ${y - s * 1.8} L${x - s * .5} ${y - s * 1.8}Z`, c) + S(`M${x} ${y - s * 1.8} l0 ${-s * .4}`, c, 2); }
  /* 立冬 Start of Winter */
  COMP[60] = { t: 'dawn', mtn: 'alps', hy: 570, draw(p, c) { // 水始冰 water begins to freeze
    let g = forest(wave(600, 6, 50, 1), -40, 440, 30, 60, c.col.near, 'pine', [7, 12]) + fog(610, 40, p.fog, .5);
    const bank = mix(p.snow, p.deep, .5), w1 = mix(p.sky[3], p.deep, .3), w2 = mix(p.far, p.deep, .6);
    g += P(`M-40 ${H} L-40 620 L440 620 L440 ${H}Z`, bank) + P(`M170 620 L230 620 Q300 700 360 ${H} L40 ${H} Q110 700 170 620Z`, lg([[0, w1], [1, w2]]));
    const ice = mix(p.snow, p.glow, .3);
    g += P(`M150 640 Q140 700 60 ${H} L150 ${H} Q190 760 196 700 Q190 670 174 640Z`, ice, .75) + P(`M230 640 Q264 700 330 ${H} L270 ${H} Q232 770 214 710 Q216 680 226 640Z`, ice, .7);
    let d = ''; for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, y = R(650, 840), x = 200 + sd * (24 + (y - 620) * .5) * R(.6, 1); d += `M${f(x)} ${f(y)} l${f(-sd * R(8, 22))} ${f(R(-10, 10))} l${f(-sd * R(4, 10))} ${f(R(-8, 8))} `; } g += S(d, '#fff', 1.2, .85);
    for (let i = 0; i < 6; i++) g += G(R(120, 280), R(660, 800), R(.6, 1.2), S('M-8 0 L8 0 M-4 -7 L4 7 M-4 7 L4 -7', '#fff', 1.2, .9));
    return g + reeds(10, 860, 180, mix(p.snow, p.deep, .3), 8, mix(p.snow, p.deep, .2)) + reeds(330, 860, 170, mix(p.snow, p.deep, .3), 8, mix(p.snow, p.deep, .2)) + framePines(p, c, { h1: 340, y: 760 });
  } };
  COMP[61] = { t: 'day', mtn: 'hills', hy: 560, draw(p, c) { // 地始凍 the earth begins to freeze
    const soil = mix('#5a4636', p.deep, .35);
    let g = forest(wave(590, 5, 40, 2), -40, 440, 18, 30, c.col.mid, 'spire', [6, 12]) + P(smooth([[-40, 620], [100, 612], [200, 626], [320, 612], [440, 620]], ` L440 ${H} L-40 ${H}Z`), soil);
    for (let i = 0; i < 60; i++) { const x = R(-10, 410), y = R(630, 850); g += C(x, y, R(1, 2.4), '#fff', .55); }
    g += E(200, 721, 132, 44, shade(soil, -.35)) + facets(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.283; return [200 + Math.cos(a) * 124 * R(.94, 1), 720 + Math.sin(a) * 38 * R(.9, 1)]; }), mix(p.snow, p.far, .3), { k: .3, n: 10 });
    g += oakLeaf(186, 716, 50, -24, '#b8642e') + S('M150 700 l30 10 M200 690 l20 18 M230 730 l40 -8 M170 740 l20 -10', '#fff', 1.3, .9);
    for (let x = 0; x < 420; x += 7) { const sx = x + R(-2, 2); if (sx > 60 && sx < 340) continue; const h = R(14, 40); g += S(`M${f(sx)} 760 l0 ${f(-h)}`, '#eef4f8', 1.4, .9) + RC(sx - 2, 760 - h - 4, 4, 4, soil); }
    for (let x = -10; x < 430; x += 5) { const h = R(30, 70); g += S(`M${f(x)} 860 q${f(R(-8, 8))} ${f(-h * .6)} ${f(R(-14, 14))} ${f(-h)}`, mix('#9aa88a', p.snow, .4), 2) + S(`M${f(x)} 860 q${f(R(-8, 8))} ${f(-h * .6)} ${f(R(-14, 14))} ${f(-h)}`, '#fff', .8, .7); }
    return g;
  } };
  /* 小雪 Minor Snow */
  COMP[64] = { t: 'dawn', mtn: 'alps', hy: 600, draw(p, c) { // 天氣上升地氣下降 heaven's breath rises, earth's sinks
    let g = forest(wave(650, 6, 50, 2), -40, 440, 20, 40, c.col.near, 'pine', [7, 12]) + ground(p, c, 720);
    for (let i = 0; i < 5; i++) { const x = 90 + i * 55; g += S(`M${x} 700 C${x - 40} 600 ${x + 40} 520 ${x} 420 C${x - 30} 360 ${x + 10} 320 ${x - 10} 280`, p.glow, 14 - i, .18) + S(`M${x} 700 C${x - 40} 600 ${x + 40} 520 ${x} 420 C${x - 30} 360 ${x + 10} 320 ${x - 10} 280`, '#fff', 1.6, .55); }
    for (let i = 0; i < 4; i++) { const x = 120 + i * 60; g += S(`M${x} 160 C${x + 40} 260 ${x - 40} 340 ${x} 440 C${x + 30} 500 ${x - 10} 540 ${x + 10} 580`, p.acc2, 10 - i, .16) + S(`M${x} 160 C${x + 40} 260 ${x - 40} 340 ${x} 440 C${x + 30} 500 ${x - 10} 540 ${x + 10} 580`, p.acc2, 1.4, .6); }
    g += S('M200 270 l-6 -12 M200 270 l6 -12', '#fff', 1.6, .7) + S('M230 590 l-6 12 M230 590 l6 12', p.acc2, 1.6, .7);
    return g + C(200, 440, 80, rg([[0, '#fff', .18], [1, '#fff', 0]])) + flakes(30, '#fff', 0, 700);
  } };
  /* 大雪 Major Snow */
  COMP[68] = { t: 'dawn', mtn: 'hills', hy: 590, draw(p, c) { // 荔挺出 irises push up shoots
    let g = ground(p, c, 680);
    const gr = '#5fa25a', gr2 = '#7fc06a';
    [[150, 30, -8], [176, 46, -3], [200, 60, 1], [222, 50, 5], [248, 36, 10], [120, 24, -14], [278, 26, 14]].forEach(([x, h, lean]) => g += P(`M${x - 7} 770 Q${x - 6 + lean * .3} ${770 - h * 2} ${x + lean} ${770 - h * 3.8} Q${x + 4 + lean * .3} ${770 - h * 2} ${x + 7} 770Z`, lean > 0 ? gr2 : gr) + S(`M${x} 770 Q${x + lean * .3} ${770 - h * 2} ${x + lean} ${770 - h * 3.6}`, shade(gr, -.2), 1, .6));
    g += facets([[60, 860], [80, 790], [130, 768], [200, 760], [270, 766], [320, 788], [340, 860]], mix(p.snow, p.far, .15), { k: .2, n: 8 });
    [[60, 800], [348, 806]].forEach(([x, y]) => g += P(`M${x - 4} ${y} Q${x} ${y - 40} ${x + 4} ${y - 64} Q${x + 6} ${y - 40} ${x + 6} ${y}Z`, gr) + facets([[x - 34, y + 30], [x - 20, y - 2], [x, y - 6], [x + 22, y - 1], [x + 34, y + 30]], mix(p.snow, p.far, .2), { k: .2, n: 1 }));
    return g + flakes(25, '#fff', 0, 760);
  } };
  /* 冬至 Winter Solstice */
  COMP[71] = { t: 'dawn', mtn: 'peak', hy: 600, draw(p, c) { // 水泉動 frozen springs begin to stir
    let g = ground(p, c, 680);
    const rk = mix('#6a7080', p.deep, .35);
    g += rock(80, 770, 100, 118, rk) + facets([[-6, 676], [40, 652], [110, 650], [168, 676], [120, 668], [40, 668]], p.snow, { k: .15, n: 2 }) + rock(330, 780, 110, 126, rk) + facets([[230, 680], [290, 656], [370, 652], [430, 680], [370, 674], [290, 674]], p.snow, { k: .15, n: 2 }) + icicles(10, 160, 672, '#e8f4ff', 9) + icicles(232, 400, 678, '#e8f4ff', 9);
    g += E(205, 770, 92, 26, mix(p.snow, p.far, .35)) + E(205, 772, 54, 14, lg([[0, mix(p.sky[3], p.far, .2)], [1, mix(p.far, p.deep, .4)]]));
    for (let i = 1; i <= 3; i++) g += `<ellipse cx="205" cy="772" rx="${14 * i}" ry="${4 * i}" fill="none" stroke="#fff" stroke-width="1.2" opacity="${.8 - i * .2}"/>`;
    g += bubbles(205, 770, 6, '#fff') + C(205, 768, 4, '#fff', .9);
    for (let i = 0; i < 4; i++) { const x = 180 + i * 16; g += S(`M${x} 760 q-12 -30 4 -60 q14 -26 -2 -54`, '#fff', 3, .35 - i * .05); }
    return g;
  } };
  const clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));
  /* ===== v7.1: faceted animals, grounded supports, abstract over cozy ===== */
  function hayMound(x, y, w, h, c) { const pts = [[x - w, y + 2], [x - w * .8, y - h * .5], [x - w * .45, y - h * .9], [x, y - h], [x + w * .5, y - h * .86], [x + w * .85, y - h * .45], [x + w, y + 2]]; let g = facets(pts, c, { k: .3, n: 10 }); for (let i = 0; i < 26; i++) { const t = R(-.9, .9), xx = x + t * w, yy = y - h * (1 - t * t) * R(.3, 1); g += S(`M${f(xx)} ${f(yy)} l${f(R(-10, 10))} ${f(R(-4, 4))}`, shade(c, R(-.2, .25)), 1.1, .7); } return g; }
  function stoneGate(x, y, s, c, snow) { // a closed mountain-temple gate: tall pillars, sweeping roof, shut doors
    const pil = (px) => facets([[px - s * .12, y], [px - s * .1, y - s * 1.7], [px + s * .1, y - s * 1.7], [px + s * .12, y]], c, { k: .2, n: 1 });
    let g = RC(x - s * .95, y - s * 1.45, s * 1.9, s * 1.45, shade(c, -.3)) + pil(x - s * 1.05) + pil(x + s * 1.05);
    g += S(`M${x} ${y - s * 1.45} V${y}`, shade(c, .25), 1.6, .8) + [-.5, .5].map(k => C(x + k * s * .14, y - s * .7, s * .03, shade(c, .4))).join('') + RC(x - s * .95, y - s * 1.5, s * 1.9, s * .08, shade(c, .1));
    const roof = [[x - s * 2, y - s * 1.66], [x - s * 1.55, y - s * 1.74], [x - s * 1.2, y - s * 2.1], [x + s * 1.2, y - s * 2.1], [x + s * 1.55, y - s * 1.74], [x + s * 2, y - s * 1.66], [x + s * 1.7, y - s * 1.82], [x - s * 1.7, y - s * 1.82]];
    g += facets([[x - s * 1.9, y - s * 1.66], [x - s * 1.4, y - s * 1.84], [x + s * 1.4, y - s * 1.84], [x + s * 1.9, y - s * 1.66], [x + s * 1.2, y - s * 1.7], [x - s * 1.2, y - s * 1.7]], shade(c, -.1), { k: .2, n: 2 });
    g += facets(roof, c, { k: .25, n: 5 }) + facets([[x - s * 1.95, y - s * 1.68], [x - s * 1.25, y - s * 2.14], [x, y - s * 2.26], [x + s * 1.25, y - s * 2.14], [x + s * 1.95, y - s * 1.68], [x + s * 1.2, y - s * 1.98], [x - s * 1.2, y - s * 1.98]], snow, { k: .12, n: 4 });
    return g;
  }
  /* 小寒 */
  COMP[0] = { t: 'dawn', mtn: 'alps', hy: 570, draw(p, c) { // 雁北鄕 wild geese turn north
    let g = forest(wave(650, 8, 60, 1), -40, 440, 16, 32, c.col.near) + fog(660, 40, p.fog, .5) + ground(p, c, 715, { amp: 8 }) + snowMounds(p, 730) + framePines(p, c, { h1: 400 });
    const gc = { c: '#2b2638' }, ax = 318, ay = 292, A = [-.97, .24], B = [-.45, .89];
    const birds = [[ax, ay, .6]]; for (let k = 1; k <= 3; k++) { birds.push([ax + A[0] * 78 * k, ay + A[1] * 78 * k, .6 + k * .13]); birds.push([ax + B[0] * 78 * k, ay + B[1] * 78 * k, .6 + k * .13]); }
    birds.forEach(([x, y, s], i) => { g += G(x, y, s, goose(gc, i % 2 === 0), { rot: -26 }); });
    return g + flakes(25, p.snow, 0, 700);
  } };
  COMP[1] = { t: 'day', mtn: 'low', hy: 610, draw(p, c) { // 鵲始巢 magpies begin to nest
    let g = forest(wave(628, 6, 50, 2), -40, 440, 14, 26, c.col.mid) + ground(p, c, 700, { amp: 7 });
    const trunk = mix('#2e2626', p.deep, .3), t = treeLimbs(200, 728, 560, .62, 4, trunk, 22);
    g += t.g; t.tips.forEach(([x, y, d]) => { if (d >= 3) g += S(`M${f(x)} ${f(y)} l${f(R(-10, 10))} ${f(-R(8, 16))}`, trunk, 1.2); });
    g += P(`M150 730 Q200 712 250 730Z`, p.snow, .8) + nest(200, 520, 50, '#6a4e36');
    g += G(224, 512, 1.9, songbird({ c: '#141820', c2: '#22344e', c3: '#e8e8ee', tail: 'long', pose: 'look' }) + S('M23 -31 l14 -3 M30 -32 l6 -6', '#4a3424', 1.4), { flip: true });
    g += G(104, 380, 1.6, flyer({ c: '#141820', tail: 'long', twig: true }), { rot: 8 });
    return g + flakes(18, '#fff', 0, 700);
  } };
  COMP[2] = { t: 'dusk', mtn: 'alps', hy: 580, sunX: 290, draw(p, c) { // 雉始雊 pheasants begin to call
    let g = forest(wave(640, 10, 70, 3), -40, 440, 18, 36, c.col.near, 'pine', [8, 14]) + ground(p, c, 690, { amp: 12, gap: 90 });
    g += reeds(18, 790, 150, mix('#c9a777', p.deep, .45), 8, mix('#8a6a4a', p.deep, .4)) + reeds(318, 800, 160, mix('#c9a777', p.deep, .45), 9, mix('#8a6a4a', p.deep, .4));
    const gy = c.gy(196);
    g += rock(196, gy + 14, 96, 44, mix('#a89aa6', p.deep, .35)) + G(190, gy - 29, 2.4, pheasant({ c: '#a8442a', shadow: 24 }));
    return g + arcs(292, 548, p.ink, 1, 3, .55) + flakes(14, p.snow, 0, 650);
  } };
  /* 大寒 */
  COMP[3] = { t: 'dawn', mtn: 'low', hy: 620, sunX: 250, draw(p, c) { // 雞始乳 hens begin to lay
    let g = ground(p, c, 690, { amp: 6 }) + P(`M300 ${636} L318 600 L336 636Z`, mix(p.deep, p.far, .3)) + RC(304, 618, 28, 18, mix(p.deep, p.far, .3));
    g += hayMound(205, 760, 130, 70, mix('#d9a84a', p.deep, .12));
    g += G(196, 712, 2.9, hen({ c: '#ebe1cf' })) + E(276, 716, 9, 11, '#f6eedf') + E(292, 720, 8, 10, '#efe3cc') + E(128, 720, 8, 10, '#f6eedf');
    return g + flakes(14, p.snow, 0, 650);
  } };
  COMP[4] = { t: 'day', mtn: 'peak', hy: 600, draw(p, c) { // 征鳥厲疾 birds of prey fly swift and fierce
    let g = forest(wave(670, 8, 60, 2), -40, 440, 20, 40, c.col.near, 'pine', [9, 16]) + ground(p, c, 740, { amp: 10 }) + framePines(p, c, { h1: 360, y: 830 });
    g += S('M30 250 L140 352 M60 226 L160 320 M10 290 L110 380 M90 210 L180 290', p.ink, 1.6, .5);
    g += G(222, 418, 2.6, raptorSide({ c: '#231c18' }), { rot: 32 });
    g += G(322, 240, .8, raptor({ c: '#2c221c' }), { rot: -10 });
    return g + flakes(40, '#fff', 0, 760);
  } };
  /* 立春 */
  COMP[7] = { t: 'day', mtn: 'low', hy: 480, draw(p, c) { // 蟄蟲始振 hibernating insects begin to stir
    let g = forest(wave(500, 5, 50, 3), -40, 440, 12, 22, c.col.mid, 'round', [10, 18]) + soilSection(p, 530, { grass: mix('#8fbf6a', p.deep, .15) });
    [70, 140, 262, 330].forEach((x, i) => { g += roots(x, 534, R(40, 70), '#c9a87a') + G(x, 532, .9 + (i % 2) * .4, sprout(20, mix('#8fcf6a', p.deep, .1))); });
    const cham = '#1a120c';
    g += chamber(200, 650, 66, 36, cham) + G(200, 652, 2.4, beetle({ c: '#4f8a68' }), { rot: 75 }) + arcs(130, 662, '#c9b8a0', -1, 3, .5) + arcs(270, 662, '#c9b8a0', 1, 3, .5);
    g += S('M330 534 Q318 570 332 600 Q346 630 330 660', cham, 18) + G(332, 586, 1.6, cricket({ c: '#8a6a3e' }), { rot: -70 });
    g += chamber(96, 610, 34, 18, cham) + G(96, 612, 1.3, beetle({ c: '#8a5a3e' }), { rot: -20 });
    return g;
  } };
  COMP[8] = { t: 'dawn', mtn: 'alps', hy: 470, draw(p, c) { // 魚陟負冰 fish rise, carrying ice on their backs
    const w1 = mix(p.far, '#4f8fa0', .5), w2 = mix(p.deep, '#0d2a33', .5);
    let g = RC(-20, 470, 440, 400, lg([[0, w1], [1, w2]])) + lightRays(200, 470, 7, p.glow, .12);
    [[60, 476, 46], [170, 478, 58], [300, 475, 52], [390, 477, 36]].forEach(([x, y, w]) => { g += iceSlab(x, y, w, 7, mix(p.snow, p.glow, .25), mix(p.snow, p.far, .45)) + P(`M${x - w} ${y + 3} L${x + w} ${y + 3} L${x + w * .8} ${y + 16} L${x - w * .8} ${y + 14}Z`, mix(p.snow, w1, .5), .5); });
    g += G(176, 520, 2.8, fish({ c: '#cfeaf0' }) + P('M-6 -9 L4 -17 L14 -10 L4 -6Z', mix(p.snow, p.glow, .3), .95), { rot: -38 });
    [[120, 640, 1.5, -55], [270, 610, 1.8, -48], [210, 720, 1.2, -60], [330, 700, 1.1, -52], [70, 760, 1, -62]].forEach(([x, y, s, r]) => { g += G(x, y, s, fish({ c: mix('#a8ccd6', w2, .35) }), { rot: r }); });
    g += bubbles(205, 500, 5, p.ink) + bubbles(285, 590, 4, p.ink);
    return g + [40, 90, 330, 370].map(x => S(`M${x} ${H} q-10 -50 4 -90 q10 -30 -2 -60 M${x + 10} ${H} q8 -40 -2 -70`, mix('#5f8f6a', w2, .4), 3)).join('');
  } };
  /* 雨水 */
  COMP[9] = { t: 'dawn', mtn: 'hills', hy: 560, ph: 2, draw(p, c) { // 獺祭魚 otters lay out their fish
    let g = forest(wave(585, 6, 50, 1), -40, 440, 20, 34, c.col.mid, 'round', [12, 20]) + water(590, 70, p, { sunX: c.sunX });
    g += P(smooth([[-40, 650], [80, 646], [200, 660], [320, 648], [440, 654]], ` L440 ${H} L-40 ${H}Z`), mix('#4a5a3a', p.deep, .5));
    const top = [[20, 760], [34, 712], [70, 686], [200, 680], [330, 683], [362, 704], [380, 760]];
    g += facets(top, mix('#7a7f7c', p.deep, .35), { k: .32, n: 12 });
    g += G(178, 683, 2.3, otter({ c: '#4a3020', shadow: 0 }));
    for (let i = 3; i >= 0; i--) g += G(292 + i * 7, 676 - i * 4, 1.15 - i * .06, fish({ c: i % 2 ? '#b4c4c6' : '#a2b6ba' }));
    return g + reeds(4, 790, 130, mix('#6a7a4a', p.deep, .4), 7) + reeds(350, 800, 120, mix('#6a7a4a', p.deep, .4), 7) + grassTufts(x => 800 + Math.sin(x / 40) * 6, -10, 420, mix('#4a5a32', p.deep, .55), 8, 16);
  } };
  COMP[10] = { t: 'dusk', mtn: 'low', hy: 560, sunX: 220, draw(p, c) { // 鴻雁來 wild geese return
    let g = water(560, 170, p, { sunX: c.sunX }) + forest(wave(560, 3, 40, 2), -40, 120, 10, 22, c.col.mid) + forest(wave(560, 3, 40, 1), 290, 440, 10, 22, c.col.mid);
    const gc = { c: '#2e2630' };
    g += G(200, 470, 2.3, goose(gc, true) + S('M-4 7 L-9 18 M2 7 L0 19', '#2e2630', 2), { rot: 12 });
    g += G(110, 650, 1.5, gooseSwim(gc)) + G(290, 668, 1.3, gooseSwim(gc), { flip: true }) + G(186, 700, 1.1, gooseSwim(gc));
    g += `<g opacity=".7">${G(80, 380, .5, goose(gc, false))}${G(320, 350, .45, goose(gc, true))}${G(350, 390, .4, goose(gc, false))}</g>`;
    g += P(smooth([[-40, 730], [80, 722], [200, 740], [320, 726], [440, 734]], ` L440 ${H} L-40 ${H}Z`), mix('#2e2a2a', p.deep, .5)) + reeds(0, 800, 170, mix('#3a322e', p.deep, .45), 10, mix('#5a4436', p.deep, .4)) + reeds(320, 800, 180, mix('#3a322e', p.deep, .45), 10, mix('#5a4436', p.deep, .4));
    return g;
  } };
  /* 驚蟄 */
  COMP[13] = { t: 'dawn', mtn: 'hills', hy: 590, ph: 1, draw(p, c) { // 倉庚鳴 orioles sing
    let g = water(600, 60, p, { sunX: c.sunX }) + ground(p, c, 700, { col: mix('#5f8a4a', p.deep, .35), col2: mix('#3f6a36', p.deep, .5) });
    const bark = mix('#3a302a', p.deep, .3), wl = mix('#a9cf6f', p.deep, .2);
    g += limb(70, 760, 84, 380, 40, 18, bark, 0) + limb(80, 470, 290, 486, 16, 4, bark, 20) + limb(84, 420, 20, 300, 14, 4, bark, 0) + limb(84, 400, 170, 280, 12, 3, bark, -10);
    const pts = []; for (let t = .1; t <= 1; t += .07) pts.push(onQuad(80, 470, 290, 486, 20, t));
    for (let t = .2; t <= 1; t += .12) pts.push(onQuad(84, 400, 170, 280, -10, t), onQuad(84, 420, 20, 300, 0, t));
    g += strands(pts, wl, 50, 130);
    g += G(212, onQuad(80, 470, 290, 486, 20, .62)[1] - 6, 3, songbird({ c: '#e8b52a', c2: '#2a2622', mask: '#1a1a1a', pose: 'sing' }));
    return g + arcs(300, 420, p.ink, 1, 3, .6);
  } };
  COMP[14] = { t: 'dusk', mtn: 'alps', hy: 600, draw(p, c) { // 鷹化爲鳩 hawks turn into doves
    let g = forest(wave(650, 8, 60, 2), -40, 440, 16, 30, c.col.near, 'round', [10, 16]) + ground(p, c, 720, { amp: 8 });
    g += G(122, 444, 1.6, raptor({ c: mix('#2c221c', p.sky[1], .3) }), { rot: -12, o: .6 });
    for (let i = 0; i < 9; i++) g += leafShape(150 + i * 10 + R(-6, 6), 440 + R(-20, 20), R(8, 12), R(-40, 40), i < 4 ? mix('#4a3a30', p.glow, .4) : '#f4eee8', .85);
    g += G(272, 424, 2.8, flyer({ c: '#f4f0ea' }), { rot: -8 });
    return g + Array.from({ length: 14 }, () => C(R(140, 320), R(360, 500), R(1, 2.2), '#fff', R(.4, .9))).join('');
  } };
  /* 春分 */
  COMP[15] = { t: 'day', mtn: 'hills', hy: 560, ph: 2, draw(p, c) { // 玄鳥至 swallows arrive
    let g = paddies(p, 570, 860, mix('#7fae5a', p.deep, .35));
    const sw = { c: '#18213a' };
    g += G(178, 440, 3, swallow(sw), { rot: 10 }) + G(84, 548, 1.8, swallow(sw), { rot: -16 }) + G(262, 350, 1.5, swallow(sw), { rot: 26, flip: true }) + G(318, 520, 1.2, swallow(sw), { rot: -6 });
    g += G(250, 690, 1.6, swallow(sw), { rot: 4 }) + `<g opacity=".3" transform="translate(0 1386) scale(1 -1)">${G(250, 690, 1.6, swallow(sw), { rot: 4 })}</g>` + ringsAt(282, 694, 10, 2.5, '#fff', 2, .5);
    return g + S('M40 560 q60 -40 120 -110 M230 380 q-40 40 -50 50', p.ink, 1.2, .35);
  } };
  /* 淸明 */
  COMP[19] = { t: 'dusk', mtn: 'low', hy: 590, ph: 1, sunX: 210, draw(p, c) { // 田鼠化爲鴽 field mice turn into quail
    let g = ground(p, c, 650, { col: mix('#7a8a4a', p.deep, .45), col2: mix('#56663a', p.deep, .5), amp: 6 });
    for (let x = -10; x < 420; x += 12) g += wheatStalk(x, 660 + R(0, 20), R(30, 50), mix('#a9b46a', p.deep, .4), R(-4, 4));
    g += G(128, c.gy(128) + 3, 3.6, mouse({ c: '#9a7458', shadow: 18 })) + G(284, c.gy(284) + 3, 3.6, quail({ c: '#a8845a', shadow: 18 }), { flip: true });
    g += swirl(176, 640, 24, p.ink, .75, 1.8) + Array.from({ length: 14 }, () => C(R(160, 240), R(600, 690), R(1, 2.4), '#fff', .85)).join('');
    for (let x = -14; x < 420; x += 8) g += wheatStalk(x, 840 + R(0, 30), R(50, 70), mix('#6a7a3a', p.deep, .5), R(-6, 6));
    return g;
  } };
  /* 穀雨 */
  COMP[22] = { t: 'dusk', mtn: 'hills', hy: 610, draw(p, c) { // 鳴鳩拂其羽 turtledoves preen their feathers
    let g = forest(wave(640, 6, 60, 1), -40, 440, 18, 30, c.col.near, 'round', [10, 16]) + ground(p, c, 720, { amp: 8 });
    const bark = mix('#2e2626', p.deep, .2), lf = mix('#4a6a3a', p.deep, .35);
    g += limb(352, 770, 334, 330, 52, 22, bark) + limb(340, 470, 110, 500, 16, 4, bark, 14) + limb(338, 410, 420, 300, 16, 6, bark) + limb(336, 360, 250, 270, 12, 4, bark) + [[300, 270, 60], [360, 250, 70], [260, 300, 40], [400, 300, 50]].map(([x, y, r]) => C(x, y, r, mix(lf, p.deep, .15)) + C(x + r * .3, y - r * .3, r * .5, shade(lf, .1), .5)).join('');
    for (let t = .15; t < 1; t += .1) { const [x, y] = onQuad(340, 470, 110, 500, 14, t); g += leafShape(x, y - 2, 18, R(-160, -100), lf) + leafShape(x, y + 2, 16, R(100, 160), shade(lf, .12)); }
    const [bx, by] = onQuad(340, 470, 110, 500, 14, .6);
    g += G(bx, by - 4, 2.7, dove({ pose: 'preen', c: '#b8a09a', c2: '#86706a', stripes: '#3a2e2c' }), { flip: true });
    return g + `<g transform="translate(150 610) rotate(30)">${leafShape(0, 0, 18, 0, '#e9e2de', .9)}${S('M0 0 L18 0', '#c9bcb8', .8)}</g>`;
  } };
  COMP[23] = { t: 'day', mtn: 'low', hy: 600, ph: 2, draw(p, c) { // 戴勝降于桑 hoopoes alight on the mulberry
    let g = ground(p, c, 700, { col: mix('#7fae5a', p.deep, .28), col2: mix('#5a8a40', p.deep, .4) });
    const t = treeLimbs(196, 742, 390, .72, 4, mix('#4a3a2e', p.deep, .2), 24); g += t.g;
    const lf = mix('#6fa24a', p.deep, .15);
    t.tips.forEach(([x, y, d]) => { if (d < 2) return; for (let k = 0; k < 3; k++) g += heartLeaf(x + R(-16, 16), y + R(-10, 14), R(9, 14), R(-80, 80), k % 2 ? lf : shade(lf, .15)); if (rnd() < .6) g += C(x + R(-8, 8), y + R(4, 12), 3.2, '#3a1430'); });
    const tp = t.tips.filter(x => x[2] === 2 && x[1] > 380).sort((a, b) => Math.abs(a[0] - 230) - Math.abs(b[0] - 230))[0] || [230, 460];
    g += G(tp[0], tp[1] + 2, 2.5, songbird({ c: '#d98a4a', c2: '#1e1a18', crest: true, longBeak: true, stripes: '#f2ece2', pose: 'look' }));
    return g;
  } };
  /* 立夏 */
  COMP[24] = { t: 'night', mtn: 'low', hy: 520, full: true, sunX: 300, sunY: 170, draw(p, c) { // 螻蟈鳴 frogs begin to croak
    const w1 = mix(p.sky[3], p.deep, .35), w2 = mix(p.deep, '#000', .2);
    let g = forest(wave(526, 4, 40, 2), -40, 440, 18, 34, c.col.near, 'round', [10, 16]) + RC(-20, 534, 440, 340, lg([[0, w1], [1, w2]]));
    g += S('M282 560 h36 M276 576 h48 M286 592 h28', p.sun, 2, .45);
    [[70, 606, 34, 9], [340, 640, 40, 11], [110, 800, 56, 15], [326, 812, 50, 14]].forEach(([x, y, rx, ry]) => g += pad(x, y, rx, ry, mix('#2f6a3e', p.deep, .35), { n: 3 }));
    g += ringsAt(200, 718, 128, 32, p.ink, 3, .4) + pad(200, 714, 118, 30, mix('#3f7a46', p.deep, .2), { n: 9 });
    g += G(194, 712, 2.4, frog({ sac: true, c: '#86e066', lum: true, sacC: '#e6ffc6', eyeC: '#183410' }));
    g += arcs(328, 650, p.ink, 1, 3, .55);
    for (let i = 0; i < 14; i++) g += C(R(20, 380), R(440, 640), 1.9, p.acc2, .95);
    return g + reeds(0, 860, 230, mix('#1f3a2a', p.deep, .3), 8, mix('#3a2a1a', p.deep, .2)) + reeds(350, 860, 240, mix('#1f3a2a', p.deep, .3), 8, mix('#3a2a1a', p.deep, .2));
  } };
  COMP[25] = { t: 'dawn', mtn: 'hills', hy: 560, draw(p, c) { // 蚯蚓出 earthworms come out
    let g = forest(wave(590, 6, 50, 1), -40, 440, 18, 30, c.col.mid, 'round', [10, 16]);
    const soil = mix('#4a3426', p.deep, .35);
    g += P(smooth([[-40, 620], [80, 612], [200, 624], [320, 610], [440, 618]], ` L440 ${H} L-40 ${H}Z`), soil) + grassTufts(x => 616 + Math.sin(x / 50) * 4, -20, 420, mix('#5f8a4a', p.deep, .3), 8, 18, [4, 8]);
    [[90, 700, 70, 12], [300, 770, 80, 14], [170, 826, 60, 9]].forEach(([x, y, rx, ry]) => g += E(x, y - 1, rx + 3, ry + 2, shade(soil, -.35)) + E(x, y, rx, ry, lg([[0, mix(p.sky[1], soil, .45)], [1, mix(p.sky[3], soil, .4)]])) + S(`M${x - rx * .5} ${y + 1} h${rx * .6}`, p.glow, 1.2, .5));
    g += G(122, 690, 3.2, worm(46, '#d89488'), { rot: -8 }) + G(214, 744, 2.8, worm(42, '#cc8a7e'), { rot: 12 }) + G(254, 652, 2, worm(36, '#d89488'), { rot: -20 });
    for (let i = 0; i < 30; i++) g += C(R(0, 400), R(620, 840), R(1, 2), '#e8f2f6', .5);
    return g + rainLines(40, p.ink, 0, 400, 200, 600, .25, -3);
  } };
  /* 芒種 */
  COMP[30] = { t: 'day', mtn: 'hills', hy: 600, ph: 5, draw(p, c) { // 螳螂生 mantises hatch
    const st = mix('#4f7f36', p.deep, .15);
    let g = ground(p, c, 720, { col: mix('#5f8a42', p.deep, .35), col2: mix('#3f6a30', p.deep, .5) }) + grassTufts(c.gy, -20, 420, mix('#4f7a36', p.deep, .4), 14, 30, [6, 12]);
    g += S('M170 860 Q160 640 190 420', st, 5) + S('M186 520 Q240 470 300 470', mix('#5a4030', p.deep, .2), 4) + leafShape(176, 600, 60, -130, st) + leafShape(168, 700, 70, -40, shade(st, .1));
    g += facets([[252, 474], [262, 468], [282, 468], [290, 476], [286, 494], [258, 494]], '#b89870', { k: .2, n: 2 });
    for (let i = 0; i < 9; i++) { const x = 256 + R(-30, 40), y = 470 + R(-60, 60); g += G(x, y, .26, mantis({ c: '#c9e39a' }), { rot: R(-40, 40) }); }
    g += G(190, 562, 2.8, mantis({ c: '#5fb43a' }), { rot: 6 });
    return g;
  } };
  COMP[31] = { t: 'dawn', mtn: 'alps', hy: 590, draw(p, c) { // 鵙始鳴 shrikes begin to call
    let g = forest(wave(640, 6, 60, 2), -40, 440, 16, 28, c.col.near, 'round', [10, 16]) + ground(p, c, 700, { col: mix('#5f7a46', p.deep, .4), col2: mix('#3f5a32', p.deep, .5) });
    const post = mix('#4a3a30', p.deep, .3);
    [[60, 760, 90], [130, 740, 100], [290, 744, 96], [360, 764, 86]].forEach(([x, y, h]) => g += fencePost(x, y, h, post));
    g += S('M60 690 L130 660 L200 640 L290 668 L360 700 M60 720 L130 700 L200 690 L290 704 L360 730', mix('#6a5a4a', p.deep, .3), 1.4);
    g += fencePost(200, 750, 140, post) + G(200, 610, 2.7, songbird({ c: '#a8a6a2', c2: '#262422', mask: '#121212', head: '#8a8884', tail: 'long', pose: 'sing' }));
    return g + arcs(264, 560, p.ink, 1, 3, .55);
  } };
  COMP[32] = { t: 'dusk', mtn: 'hills', hy: 600, ph: 2, draw(p, c) { // 反舌無聲 mockingbirds fall silent
    let g = water(600, 90, p, { sunX: c.sunX }) + ground(p, c, 700, { col: mix('#3a4a3e', p.deep, .5), col2: mix('#222c28', p.deep, .55) });
    const bark = mix('#221e20', p.deep, .2), lf = mix('#2f4a3a', p.deep, .35);
    g += limb(60, 760, 70, 380, 44, 16, bark) + limb(68, 480, 270, 510, 14, 4, bark, 14) + limb(70, 410, 10, 300, 14, 5, bark) + [[60, 330, 70], [120, 300, 50], [10, 290, 60]].map(([x, y, r]) => C(x, y, r, lf)).join('');
    for (let t = .2; t < 1; t += .14) { const [x, y] = onQuad(68, 480, 270, 510, 14, t); g += leafShape(x, y, 16, R(60, 120), lf); }
    const [bx, by] = onQuad(68, 480, 270, 510, 14, .66);
    g += G(bx, by - 3, 2.8, songbird({ c: '#5a5a62', c2: '#3a3a42', pose: 'sleep', tail: 'long' }));
    return g;
  } };
  /* 夏至 */
  COMP[33] = { t: 'day', mtn: 'alps', hy: 580, draw(p, c) { // 鹿角解 deer shed their antlers
    let g = forest(wave(630, 6, 50, 1), -40, 440, 30, 60, c.col.mid, 'spire', [6, 12]) + fog(650, 30, p.fog, .45) + ground(p, c, 700, { col: mix('#5f8a42', p.deep, .35), col2: mix('#3a6a30', p.deep, .45) });
    g += framePines(p, c, { h1: 380, y: 820, col: mix(p.deep, '#1a3a2a', .3), col2: mix(p.deep, '#2a4a3a', .3) });
    g += G(176, c.gy(176) + 34, 2.5, deer({ antlers: false, c: '#8a5432' }));
    g += S('M262 806 C276 784 290 776 312 770 M276 790 L270 772 M288 780 L288 760 M300 774 L310 756', '#d8c4a0', 4.5) + E(286, 810, 34, 4, '#000', .25);
    return g + grassTufts(c.gy2, -20, 420, mix('#2f5a26', p.deep, .45), 8, 16);
  } };
  COMP[34] = { t: 'day', mtn: 'low', hy: 640, sunX: 300, draw(p, c) { // 蜩始鳴 cicadas begin to sing
    const lf = mix('#3f7a3a', p.deep, .25);
    let g = ground(p, c, 760, { col: mix('#5f8a42', p.deep, .35), col2: mix('#3f6a30', p.deep, .5) });
    g += barkTrunk(200, 860, 150, 120, mix('#4a3a32', p.deep, .25));
    g += [[90, 150, 110], [200, 110, 120], [320, 150, 110], [40, 230, 70], [360, 240, 80]].map(([x, y, r]) => C(x, y, r, mix(lf, p.deep, .2)) + C(x + r * .3, y - r * .2, r * .55, shade(lf, .1), .6)).join('');
    g += G(206, 470, 3, cicada({ c: '#241f18', wing: '#dfeee6' }), { rot: 4 });
    return g + arcs(274, 470, p.ink, 1, 4, .7) + arcs(140, 470, p.ink, -1, 4, .7);
  } };
  /* 小暑 */
  COMP[37] = { t: 'night', mtn: 'alps', hy: 520, full: true, sunX: 300, sunY: 170, draw(p, c) { // 蟋蟀居壁 crickets shelter in the walls
    let g = forest(wave(560, 6, 50, 1), -40, 440, 20, 40, c.col.near, 'pine', [8, 13]);
    const wallTop = [[-30, 560], [40, 548], [120, 552], [160, 530], [230, 536], [300, 556], [440, 560]];
    g += `<g clip-path="url(#${ID}wc)">${stoneWall(520, 860, mix('#6a6874', p.deep, .45), mix('#1a1a22', p.deep, .3))}</g>`;
    defs += `<clipPath id="${ID}wc"><path d="${poly(wallTop.concat([[440, 860], [-30, 860]]))}"/></clipPath>`;
    g += RC(-20, 520, 440, 340, lg([[0, '#000', 0], [1, '#000', .35]]));
    g += P('M196 600 L210 580 L222 640 L236 610 L246 700 L228 716 L214 670 L202 690Z', '#07070a') + G(226, 654, 2.6, cricket({ c: '#f2b84a', lum: true }), { rot: -62 });
    g += arcs(262, 640, '#f2d8a0', 1, 3, .55) + [[300, 760], [120, 800], [350, 600]].map(([x, y]) => E(x, y, 22, 6, mix('#3f6a3a', p.deep, .45))).join('');
    return g + P(`M-20 ${H} L-20 830 Q200 810 420 830 L420 ${H}Z`, mix('#1f2a22', p.deep, .45)) + grassTufts(x => 830, -20, 420, mix('#2f4a2e', p.deep, .45), 10, 26);
  } };
  COMP[38] = { t: 'day', mtn: 'alps', hy: 610, draw(p, c) { // 鷹始擊 young hawks learn to hunt
    let g = ground(p, c, 680, { col: mix('#7f9e52', p.deep, .35), col2: mix('#5a7a3a', p.deep, .45) });
    for (let i = 0; i < 6; i++) g += S(`M-20 ${700 + i * 26} Q200 ${690 + i * 30} 420 ${700 + i * 26}`, mix('#4a6a30', p.deep, .4), 1.4, .5);
    g += G(300, 230, 1, raptor({ c: '#3a2a1e' }), { rot: -8 }) + `<circle cx="300" cy="240" r="62" fill="none" stroke="${p.ink}" stroke-width="1" stroke-dasharray="4 6" opacity=".5"/>`;
    g += S('M70 330 L150 430 M100 306 L170 400 M50 370 L126 456', p.ink, 1.6, .5);
    g += G(206, 486, 2.6, raptorSide({ c: '#5a3e2a' }), { rot: 40 });
    g += G(250, c.gy(250) + 4, 1.4, mouse({ c: '#6a5440', shadow: 10 }), { flip: true });
    return g + grassTufts(c.gy2, -20, 420, mix('#3a5a26', p.deep, .45), 8, 16);
  } };
  /* 大暑 */
  COMP[41] = { t: 'day', mtn: 'hills', hy: 590, noSun: true, streaks: false, draw(p, c) { // 大雨時行 great rains sweep through
    let g = RC(0, 0, W, H, '#20303a', .35) + storm(120, 210, 120, mix(p.far, '#5a6a72', .4), mix(p.deep, '#2a3a42', .3)) + storm(300, 250, 100, mix(p.far, '#5a6a72', .3), mix(p.deep, '#2a3a42', .3));
    for (let i = 0; i < 5; i++) g += P(`M${40 + i * 80} 300 L${90 + i * 80} 300 L${60 + i * 80} 640 L${10 + i * 80} 640Z`, p.ink, .07);
    g += paddies(p, 600, 860, mix('#7fae5a', p.deep, .35)) + G(300, 664, 1.1, heron({ c: '#c8d0d8' })) + `<g opacity=".25" transform="translate(0 1330) scale(1 -1)">${G(300, 664, 1.1, heron({ c: '#c8d0d8' }))}</g>`;
    for (let i = 0; i < 40; i++) { const x = R(0, 400), y = R(650, 850); g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4 + (y - 650) / 30)}" ry="${f(1 + (y - 650) / 120)}" fill="none" stroke="${p.ink}" stroke-width=".9" opacity=".5"/>`; }
    return g + rainLines(260, p.ink, -20, 440, 260, 860, .5, -9) + rainLines(80, '#fff', -20, 440, 260, 860, .35, -10);
  } };
  /* 立秋 */
  COMP[44] = { t: 'dusk', mtn: 'alps', hy: 600, draw(p, c) { // 寒蟬鳴 autumn cicadas sing
    let g = forest(wave(650, 8, 60, 1), -40, 440, 18, 34, c.col.near, 'round', [10, 16]) + ground(p, c, 720);
    const bark = mix('#221a1a', p.deep, .2);
    g += limb(370, 780, 350, 380, 50, 20, bark) + limb(352, 470, 90, 520, 16, 4, bark, 22) + limb(350, 420, 420, 300, 16, 5, bark) + limb(348, 390, 260, 300, 12, 4, bark);
    for (let t = .1; t < 1; t += .07) { const [x, y] = onQuad(352, 470, 90, 520, 22, t); g += leafShape(x, y, 16, R(-170, -110), [p.acc, p.acc2, '#c97a3a'][RI(0, 2)]) + leafShape(x, y, 14, R(100, 160), [p.acc, p.acc2, '#d9a04a'][RI(0, 2)]); }
    [[330, 300, 60], [390, 330, 50], [280, 330, 40]].forEach(([x, y, r]) => { for (let i = 0; i < 26; i++) g += leafShape(x + R(-r, r), y + R(-r, r) * .7, R(12, 18), R(0, 360), [p.acc, p.acc2, '#c97a3a'][RI(0, 2)]); });
    const [cx, cy] = onQuad(352, 470, 90, 520, 22, .5);
    g += G(cx, cy - 16, 1.9, cicada({ c: '#20301e', wing: '#e6ead6' }), { rot: 96 });
    return g + arcs(cx + 30, cy - 50, p.ink, 1, 3, .6) + arcs(cx - 30, cy - 50, p.ink, -1, 3, .6);
  } };
  /* 處暑 */
  COMP[45] = { t: 'day', mtn: 'peak', hy: 620, draw(p, c) { // 鷹乃祭鳥 hawks lay out their prey
    let g = ground(p, c, 760);
    const cr = [[50, H], [60, 700], [100, 620], [150, 576], [196, 566], [250, 572], [290, 600], [330, 660], [350, H]];
    g += facets(cr, mix('#7a6a5e', p.deep, .35), { k: .34, n: 18 });
    g += G(200, 567, 2.8, hawkSide({ c: '#4a3424', c3: '#e6d4b4', shadow: 22 }));
    [[132, 584, -24], [152, 576, 6], [258, 576, 18], [278, 586, -8]].forEach(([x, y, r]) => g += leafShape(x, y, 22, r, '#e8ddd0') + S(`M${x} ${y} l22 0`, '#b8a890', 1, .8));
    return g + G(320, 260, .8, raptor({ c: '#3a2a1e' }), { rot: 12 }) + G(90, 300, .55, raptor({ c: '#3a2a1e' }), { rot: -18 });
  } };
  COMP[47] = { t: 'day', mtn: 'hills', hy: 540, draw(p, c) { // 禾乃登 the grain ripens
    const gold = '#e2b44a';
    let g = '';
    for (let i = 0; i < 8; i++) { const y = 560 + i * 34, col = mix(gold, p.deep, .35 - i * .02); g += P(smooth([[-40, y], [100, y - 10 + (i % 2) * 14], [220, y + 6], [330, y - 8], [440, y + 4]], ` L440 ${y + 40} L-40 ${y + 40}Z`), col) + S(smooth([[-40, y], [100, y - 10 + (i % 2) * 14], [220, y + 6], [330, y - 8], [440, y + 4]]), mix('#7a9a4a', p.deep, .3), 2, .8); }
    for (let x = -10; x < 430; x += 10) g += riceEar(x + R(-3, 3), 870, R(190, 250), gold, R(40, 60));
    return g + G(110, 300, .5, flyer({ c: '#3a3028' }), { rot: -10 }) + G(150, 330, .42, flyer({ c: '#3a3028' }), { rot: -6 });
  } };
  /* 白露 */
  COMP[48] = { t: 'dusk', mtn: 'alps', hy: 590, sunX: 110, draw(p, c) { // 鴻雁來 wild geese arrive (heading south)
    let g = water(600, 60, p, { sunX: c.sunX }) + forest(wave(600, 4, 40, 1), -40, 440, 14, 26, c.col.near) + ground(p, c, 680, { amp: 10 });
    const gc = { c: '#2a2026' }, ax = 96, ay = 520, A = [.95, -.3], B = [.5, -.86];
    const birds = [[ax, ay, 1]]; for (let k = 1; k <= 3; k++) { birds.push([ax + A[0] * 84 * k, ay + A[1] * 84 * k, 1 - k * .16]); birds.push([ax + B[0] * 84 * k, ay + B[1] * 84 * k, 1 - k * .16]); }
    birds.forEach(([x, y, s], i) => g += G(x, y, s, goose(gc, i % 2 === 1), { rot: 18, flip: true }));
    return g + framePines(p, c, { h1: 360, y: 820, left: false });
  } };
  COMP[49] = { t: 'day', mtn: 'low', hy: 560, draw(p, c) { // 玄鳥歸 swallows depart
    let g = water(560, 120, p, { sunX: c.sunX }) + P(smooth([[-40, 690], [100, 676], [200, 690], [300, 680], [440, 690]], ` L440 ${H} L-40 ${H}Z`), mix('#c9b08a', p.deep, .35)) + P(smooth([[-40, 760], [120, 748], [260, 762], [440, 750]], ` L440 ${H} L-40 ${H}Z`), mix('#7a6a4a', p.deep, .45));
    const post = mix('#4a3a30', p.deep, .2);
    g += fencePost(40, 760, 320, post) + fencePost(360, 760, 300, post) + S('M40 470 Q200 520 360 490', '#1a1a1a', 1.6) + S('M40 520 Q200 566 360 540', '#1a1a1a', 1.6, .7);
    for (let i = 0; i < 9; i++) { const t = (i + 1) / 10, x = 40 + 320 * t, y = (1 - t) * (1 - t) * 470 + 2 * (1 - t) * t * 520 + t * t * 490; g += G(x, y, 1.2, songbird({ c: '#18213a', c2: '#101628', c3: '#e8e0d6', tail: 'fork' }), { flip: i % 3 === 0 }); }
    const sw = { c: '#18213a' };
    return g + G(140, 360, 1.8, swallow(sw), { rot: -18 }) + G(250, 300, 1.3, swallow(sw), { rot: -26 }) + G(320, 250, 1, swallow(sw), { rot: -30 }) + G(370, 220, .7, swallow(sw), { rot: -30 });
  } };
  COMP[50] = { t: 'day', mtn: 'hills', hy: 600, ph: 2, draw(p, c) { // 群鳥養羞 birds store up food
    let g = ground(p, c, 710, { col: mix('#a8844a', p.deep, .35), col2: mix('#7a5a36', p.deep, .45) });
    const bark = mix('#3a2a22', p.deep, .2); g += limb(70, 770, 84, 330, 56, 22, bark) + limb(82, 470, 300, 500, 18, 5, bark, 18) + limb(84, 400, 0, 280, 16, 5, bark) + limb(84, 380, 200, 260, 14, 4, bark);
    const lc = [p.acc, '#c98a3a', '#a86a2a', mix('#7a8a3a', p.acc, .4)];
    [[60, 270, 80], [170, 250, 70], [0, 300, 60], [240, 300, 50]].forEach(([x, y, r]) => { for (let i = 0; i < 30; i++) g += oakLeaf(x + R(-r, r), y + R(-r, r) * .7, R(16, 24), R(0, 360), lc[RI(0, 3)]); });
    for (let t = .15; t < 1; t += .13) { const [x, y] = onQuad(82, 470, 300, 500, 18, t); g += oakLeaf(x, y, 20, R(60, 120), lc[RI(0, 3)]) + (rnd() < .5 ? acorn(x + 6, y + 14, 9) : ''); }
    const [bx, by] = onQuad(82, 470, 300, 500, 18, .7);
    g += G(bx, by - 3, 2.6, songbird({ c: '#b89478', c2: '#3a66a8', mask: '#1a1a1a', pose: 'look' }) + acorn(32, -29, 6));
    g += E(200, 770, 30, 8, mix('#2a1e16', p.deep, .2)) + acorn(190, 766, 10) + acorn(208, 768, 9) + G(150, c.gy(150) + 2, 1.4, songbird({ c: '#7a5a40', c2: '#4a3424' }) + C(32, -28, 2.4, '#c9a24a'));
    return g + [[300, 790], [340, 760], [110, 800]].map(([x, y]) => oakLeaf(x, y, 18, R(0, 360), lc[RI(0, 3)])).join('');
  } };
  /* 秋分 */
  COMP[52] = { t: 'day', mtn: 'hills', hy: 480, ph: 3, draw(p, c) { // 蟄蟲坏戶 insects seal their burrows
    let g = forest(wave(500, 5, 50, 2), -40, 440, 16, 28, c.col.mid, 'round', [10, 18]) + soilSection(p, 530, { grass: mix('#a8843a', p.deep, .2) });
    const lc = [p.acc, '#c98a3a', '#a86a2a']; for (let i = 0; i < 26; i++) g += leafShape(R(-10, 410), 530 + R(-8, 4), R(10, 16), R(-30, 30), lc[RI(0, 2)]);
    const cham = '#1a120c', tun = '#2e2016', plug = mix('#5a4030', p.deep, .2);
    g += S('M200 540 Q190 590 210 640', tun, 14) + chamber(214, 664, 54, 30, cham) + G(214, 666, 2.2, beetle({ c: '#8a5a36' }), { rot: -80 }) + facets([[188, 548], [196, 540], [212, 542], [214, 556], [198, 562]], plug, { k: .2, n: 1 });
    g += S('M80 540 Q90 580 70 620', tun, 11) + chamber(70, 640, 34, 18, cham) + G(70, 642, 1.3, beetle({ c: '#4a7a5e' }), { rot: 20 }) + facets([[70, 548], [78, 540], [90, 544], [86, 556]], plug, { k: .2, n: 0 });
    g += S('M320 540 Q336 600 320 680', tun, 11) + chamber(320, 702, 38, 20, cham) + G(320, 706, 1.5, cricket({ c: '#7a5a34' }), { rot: 10 }) + facets([[312, 548], [320, 540], [332, 544], [330, 556]], plug, { k: .2, n: 0 });
    return g;
  } };
  COMP[53] = { t: 'day', mtn: 'alps', hy: 590, draw(p, c) { // 水始涸 waters begin to dry
    let g = ground(p, c, 650, { col: mix('#a88a5a', p.deep, .35), col2: mix('#8a6a46', p.deep, .4), amp: 5 });
    const mud = mix('#7a5a40', p.deep, .3);
    g += E(200, 740, 190, 56, shade(mud, .12)) + E(200, 742, 160, 44, mud) + E(200, 744, 120, 30, shade(mud, -.12)) + E(200, 746, 86, 18, lg([[0, mix(p.sky[2], p.deep, .2)], [1, mix(p.sky[1], p.deep, .4)]]));
    let d = ''; for (let i = 0; i < 18; i++) { const a = R(0, 6.283), r = R(95, 180); d += `M${f(200 + Math.cos(a) * r)} ${f(742 + Math.sin(a) * r * .28)} l${f(R(-14, 14))} ${f(R(-5, 5))} `; } g += S(d, shade(mud, -.35), 1.2, .8);
    g += `<g opacity=".3" transform="translate(0 1500) scale(1 -1)">${G(206, 750, 2.4, heron({ c: '#c8d0d8' }))}</g>` + G(206, 750, 2.4, heron({ c: '#c8d0d8' })) + ringsAt(208, 751, 20, 4, '#fff', 2, .5);
    return g + reeds(30, 760, 120, mix('#a8945a', p.deep, .3), 7, mix('#7a5a3a', p.deep, .3)) + reeds(330, 770, 130, mix('#a8945a', p.deep, .3), 7, mix('#7a5a3a', p.deep, .3));
  } };
  /* 寒露 */
  COMP[54] = { t: 'night', mtn: 'alps', hy: 560, full: true, sunX: 200, sunY: 330, draw(p, c) { // 鴻雁來賓 wild geese arrive as guests
    let g = water(560, 200, p, { sunX: 200, dark: .55 });
    const gc = { c: '#1e1820' };
    g += G(168, 334, 1, goose(gc, true)) + G(230, 318, .82, goose(gc, false)) + G(266, 346, .66, goose(gc, true));
    g += G(128, 642, 1.7, gooseSwim(gc)) + G(254, 664, 1.5, gooseSwim(gc), { flip: true }) + G(196, 704, 1.3, gooseSwim(gc)) + G(316, 622, 1.1, gooseSwim(gc), { flip: true });
    return g + reeds(0, 860, 200, mix(p.deep, p.far, .2), 9, mix(p.deep, p.far, .3)) + reeds(330, 860, 210, mix(p.deep, p.far, .2), 9, mix(p.deep, p.far, .3)) + P(`M-20 ${H} L-20 800 Q200 780 420 800 L420 ${H}Z`, p.deep);
  } };
  COMP[55] = { t: 'dawn', mtn: 'low', hy: 560, sunX: 260, draw(p, c) { // 雀入大水爲蛤 sparrows enter the sea and become clams
    let g = water(560, 130, p, { sunX: c.sunX }) + S('M-20 640 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0', '#fff', 2, .55) + S('M-20 668 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0', '#fff', 2.4, .7);
    g += P(smooth([[-40, 690], [100, 680], [220, 694], [320, 682], [440, 690]], ` L440 ${H} L-40 ${H}Z`), mix('#d9c49a', p.deep, .25)) + S(smooth([[-40, 690], [100, 680], [220, 694], [320, 682], [440, 690]]), '#fff', 3, .6);
    const sp = { c: '#6a4a34' };
    g += G(150, 440, 1.7, flyer(sp), { rot: 24 }) + G(230, 480, 1.4, flyer(sp), { rot: 30 }) + G(300, 420, 1.2, flyer(sp), { rot: 26 }) + G(90, 380, 1, flyer(sp), { rot: 20 });
    g += S('M170 470 q20 40 40 90 M245 505 q10 30 20 70', p.ink, 1.2, .35);
    return g + G(150, 760, 2.4, shell({ body: '#e8d4bc' })) + G(240, 780, 2.8, shell({ body: '#d9b8a0' })) + G(320, 750, 1.6, shell({ body: '#efe0cc' })) + G(80, 790, 1.8, shell({ body: '#e2c8b0' })) + Array.from({ length: 20 }, () => C(R(0, 400), R(700, 840), R(1, 2), '#fff', .5)).join('');
  } };
  /* 霜降 */
  COMP[57] = { t: 'night', mtn: 'alps', hy: 600, full: true, sunX: 236, sunY: 300, draw(p, c) { // 豺乃祭獸 wild dogs lay out their prey
    let g = ground(p, c, 720) + halo(236, 300, 160, p.sun, .25);
    const rk = [[30, H], [44, 690], [90, 630], [150, 592], [210, 588], [262, 596], [300, 628], [336, 700], [350, H]];
    g += facets(rk, mix(p.far, p.deep, .45), { k: .38, n: 16 });
    g += G(184, 590, 2.5, wolf({ c: '#a8441f', shadow: 36 }));
    return g + arcs(268, 336, p.ink, 1, 3, .5) + [[238, 589, 10], [252, 591, -12]].map(([x, y, r]) => leafShape(x, y, 12, r, '#d8c0a8')).join('') + framePines(p, c, { h1: 320, y: 830 });
  } };
  COMP[59] = { t: 'dawn', mtn: 'hills', hy: 480, ph: 5, draw(p, c) { // 蟄蟲咸俯 insects all lie dormant
    let g = forest(wave(500, 5, 50, 1), -40, 440, 18, 30, c.col.mid, 'spire', [6, 12]) + soilSection(p, 530, { grass: mix('#d8d0c8', p.deep, .2) });
    const lc = ['#a86a2a', '#8a5a2a', '#c98a3a']; for (let i = 0; i < 30; i++) g += leafShape(R(-10, 410), 528 + R(-6, 6), R(10, 16), R(-30, 30), lc[RI(0, 2)]);
    for (let i = 0; i < 40; i++) g += C(R(0, 400), 524 + R(-6, 4), R(1, 2), '#fff', .7);
    const cham = '#1a120c';
    g += chamber(200, 664, 62, 32, cham) + G(200, 668, 2.3, beetle({ c: '#4a6a56' }), { rot: 90, o: .85 });
    g += chamber(90, 612, 32, 16, cham) + G(90, 614, 1.2, beetle({ c: '#7a5640' }), { rot: 90, o: .8 });
    g += chamber(310, 742, 46, 18, cham) + `<g transform="translate(290 744)" opacity=".85">${S('M0 0 q10 -10 20 0 q10 10 20 0 q-6 -12 -20 -6', '#b8786c', 4.5)}</g>` + chamber(302, 604, 30, 14, cham) + G(302, 608, 1.1, cricket({ c: '#6a5032' }), { o: .8 });
    return g;
  } };
  /* 立冬 */
  COMP[62] = { t: 'dusk', mtn: 'low', hy: 560, sunX: 300, draw(p, c) { // 雉入大水爲蜃 pheasants enter the sea and become great clams
    let g = water(560, 150, p, { sunX: c.sunX }) + S('M-20 690 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0', '#fff', 2.4, .6);
    g += `<g opacity=".55">${puff(70, 420, 90, p.glow, .5)}${pavilion(150, 430, 30, mix(p.glow, p.far, .35))}${pavilion(230, 410, 40, mix(p.glow, p.far, .3))}${pavilion(300, 436, 24, mix(p.glow, p.far, .35))}${RC(110, 430, 230, 6, mix(p.glow, p.far, .35))}</g>`;
    for (let i = 0; i < 4; i++) g += S(`M${200 + i * 6} 700 Q${170 + i * 20} 600 ${200 + i * 10} 480`, p.glow, 4 - i * .6, .35);
    g += P(smooth([[-40, 712], [100, 704], [220, 716], [320, 706], [440, 712]], ` L440 ${H} L-40 ${H}Z`), mix('#c9b48a', p.deep, .35));
    g += facets([[132, 774], [140, 734], [170, 712], [200, 706], [230, 712], [260, 734], [268, 774]], '#d9c4a8', { k: .3, n: 6 }) + S('M150 752 L250 752 M160 734 q40 -12 80 0', '#a88a70', 1.4, .7);
    g += facets([[132, 776], [268, 776], [250, 798], [150, 798]], '#b89c80', { k: .25, n: 2 }) + E(200, 802, 80, 6, '#000', .25);
    return g + G(76, 520, 1.5, flyer({ c: '#a8442a', tail: 'long' }), { rot: 16 });
  } };
  /* 小雪 */
  COMP[63] = { t: 'day', mtn: 'hills', hy: 600, noSun: true, streaks: false, draw(p, c) { // 虹藏不見 rainbows hide away
    let g = RC(0, 0, W, H, '#8a96a8', .25) + `<g opacity=".3">${rainbow(200, 620, 170, .5)}</g>`;
    for (let i = 0; i < 6; i++) g += band(240 + i * 62, 90, mix('#d4dae2', p.far, i * .1), .9);
    g += puff(120, 470, 80, '#d8dee6', .9) + puff(230, 430, 70, '#e2e6ec', .9);
    g += forest(wave(660, 6, 50, 1), -40, 440, 24, 50, mix(p.far, p.deep, .5), 'spire', [7, 12]) + ground(p, c, 700);
    return g + flakes(90, '#fff', 0, 860);
  } };
  COMP[65] = { t: 'night', mtn: 'alps', hy: 600, draw(p, c) { // 閉塞而成冬 all is closed; winter sets in
    let g = forest(wave(640, 6, 50, 1), -40, 440, 24, 44, c.col.near, 'pine', [8, 13]) + ground(p, c, 710);
    g += halo(200, 640, 140, p.sun, .12) + stoneGate(200, 744, 72, mix('#3a3448', p.deep, .2), p.snow);
    g += P(`M60 ${H} L60 742 Q120 724 200 738 Q290 722 350 744 L350 ${H}Z`, mix(p.snow, p.deep, .5)) + S('M60 742 Q120 724 200 738 Q290 722 350 744', p.snow, 2.5, .7);
    return g + flakes(120, '#fff', 0, 860) + framePines(p, c, { h1: 340, y: 800 });
  } };
  /* 大雪 */
  COMP[66] = { t: 'night', mtn: 'alps', hy: 610, full: true, sunX: 290, sunY: 300, draw(p, c) { // 鶡鴠不鳴 the night bird falls silent
    let g = forest(wave(650, 6, 50, 1), -40, 440, 20, 36, c.col.near, 'pine', [8, 13]) + ground(p, c, 720);
    const bark = mix('#1e1a24', p.deep, .2);
    g += limb(60, 780, 72, 360, 50, 18, bark) + limb(70, 500, 300, 520, 18, 5, bark, 16) + limb(72, 420, 0, 300, 14, 4, bark) + limb(72, 390, 170, 280, 12, 4, bark);
    g += P(smooth(Array.from({ length: 9 }, (_, i) => { const [x, y] = onQuad(70, 500, 300, 520, 16, i / 8); return [x, y - 9 + (i % 2) * 2]; })) + ' ' + smooth(Array.from({ length: 9 }, (_, i) => { const [x, y] = onQuad(70, 500, 300, 520, 16, 1 - i / 8); return [x, y - 2]; })).replace('M', 'L') + 'Z', p.snow, .95);
    const [bx, by] = onQuad(70, 500, 300, 520, 16, .62);
    g += G(bx, by - 8, 2.5, owl({ closed: true, c: '#cfd4de', c3: '#eef0f6', lum: true }));
    return g + flakes(50, '#fff', 0, 860);
  } };
  COMP[67] = { t: 'day', mtn: 'alps', hy: 600, draw(p, c) { // 虎始交 tigers begin to court
    let g = forest(wave(640, 6, 50, 2), -40, 440, 30, 56, c.col.near, 'pine', [7, 12]) + ground(p, c, 700) + framePines(p, c, { h1: 400, y: 800 });
    g += G(112, c.gy(112) + 40, 1.32, tiger({ c: '#d9772a' })) + G(300, c.gy(300) + 44, 1.3, tiger({ c: '#e08a38' }), { flip: true });
    return g + flakes(40, '#fff', 0, 860);
  } };
  /* 冬至 */
  COMP[69] = { t: 'night', mtn: 'alps', hy: 480, draw(p, c) { // 蚯蚓結 earthworms knot together
    let g = forest(wave(500, 5, 50, 2), -40, 440, 18, 34, c.col.near, 'pine', [7, 12]) + soilSection(p, 540, { grass: p.snow });
    g += P(smooth([[-40, 530], [100, 524], [200, 534], [320, 522], [440, 530]], ` L440 556 L-40 556Z`), p.snow) + S(smooth([[-40, 556], [100, 552], [200, 560], [320, 550], [440, 556]]), '#fff', 2, .4);
    const ch = Array.from({ length: 13 }, (_, i) => { const t = i / 13 * 6.283; return [200 + Math.cos(t) * R(84, 108), 692 + Math.sin(t) * R(46, 62)]; });
    g += facets(ch, '#120c08', { k: .12, n: 4 }) + E(200, 726, 80, 14, '#000', .25);
    const wc = ['#c98276', '#d8968a', '#b8706a', '#e2a69a', '#c27c72', '#d28e82'];
    for (let i = 0; i < 9; i++) { // each worm: a smooth random path through the clump, so it reads as a tangle, not a ring
      const n = RI(4, 6), pts = []; let x = 200 + R(-60, 60), y = 692 + R(-24, 24), a0 = R(0, 6.283);
      for (let k = 0; k < n; k++) { pts.push([x, y]); a0 += R(-1.6, 1.6); x = clamp2(x + Math.cos(a0) * R(16, 30), 128, 272); y = clamp2(y + Math.sin(a0) * R(10, 20), 660, 724); }
      const d = smooth(pts), w = R(5, 7.5), col = wc[i % wc.length];
      g += S(d, shade(col, -.35), w + 1.6) + S(d, col, w) + S(d, shade(col, .28), w * .22, .7);
    }
    g += [[150, 668, -40], [254, 712, 30], [182, 720, 150]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${S('M0 0 q8 -6 16 -2 t14 4', '#c98276', 5.6)}</g>`).join('');
    return g + flakes(30, '#fff', 0, 520);
  } };
  COMP[70] = { t: 'day', mtn: 'alps', hy: 600, draw(p, c) { // 麋角解 elk shed their antlers
    let g = water(600, 60, p, {}) + ground(p, c, 680);
    g += reeds(10, 760, 130, mix('#a89878', p.deep, .35), 8, mix('#7a6a4a', p.deep, .35)) + reeds(320, 770, 140, mix('#a89878', p.deep, .35), 9, mix('#7a6a4a', p.deep, .35));
    g += G(166, c.gy(166) + 54, 2.4, deer({ antlers: false, c: '#6a4e3c' }));
    g += S('M246 806 C258 786 276 778 300 778 M262 792 L256 776 M276 784 L280 766 M290 780 L302 768 M226 818 C240 804 254 800 268 802 M240 810 L236 796', '#ece0c8', 4.5) + E(262, 816, 46, 5, '#000', .2);
    return g + flakes(30, '#fff', 0, 860);
  } };
  function render(key, season, idx) {
    idx = +idx || 0; seed = 11 + idx * 977; ID = "z" + idx + "_"; defs = ""; SID = 0;
    const comp = COMP[idx] || { t: 'day', draw: () => '' };
    const c = Object.assign({ season }, comp);
    const p = PAL[season + '-' + c.t] || PAL[season + '-day'];
    let body = base(p, c); LIGHT = [c.sunX >= 200 ? .55 : -.55, -.85];
    body += comp.draw(p, c);
    body += vignette(p);
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
  }
  window.SCENES = { render, PAL, W, H };
})();
