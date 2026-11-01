/* Minimal line-art backgrounds for the 72 micro-seasons. Pure SVG, drawn on the fly, no image files. */
(function () {
  const PAL = {
    spring: { sky: ['#2b3d37', '#0f1514'], far: '#22332d', near: '#18241f', ink: '#bcd6c6', acc: '#f2a9bb', acc2: '#a9db8f', sun: '#f6e3b4' },
    summer: { sky: ['#15404a', '#08141a'], far: '#14323a', near: '#0d2328', ink: '#acdcd4', acc: '#62d6c6', acc2: '#f2c96b', sun: '#f7d77a' },
    autumn: { sky: ['#43291a', '#15100c'], far: '#30200f', near: '#22170e', ink: '#e6c6a2', acc: '#eda25a', acc2: '#d0573f', sun: '#f3e2b8' },
    winter: { sky: ['#22305a', '#0b0f17'], far: '#202c4c', near: '#162036', ink: '#cddcf0', acc: '#a0c9f2', acc2: '#eef3fa', sun: '#e6edf8' },
  };
  const G = 418; // ground line
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const f1 = n => Math.round(n * 10) / 10;
  const L = (d, c, w = 2, o = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
  const F = (d, c, o = 1) => `<path d="${d}" fill="${c}" opacity="${o}"/>`;
  const C = (x, y, r, c, o = 1) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}" opacity="${o}"/>`;
  const E = (x, y, rx, ry, c, o = 1, rot = 0) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${c}" opacity="${o}" transform="rotate(${rot} ${f1(x)} ${f1(y)})"/>`;
  const RING = (x, y, rx, ry, c, w = 1.5, o = 1) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;

  /* ---- primitives ---- */
  const fly = (x, y, s, c, o = .85) => L(`M${f1(x - s)} ${f1(y - s * .25)} Q${f1(x - s * .45)} ${f1(y - s * .7)} ${f1(x)} ${f1(y)} Q${f1(x + s * .45)} ${f1(y - s * .7)} ${f1(x + s)} ${f1(y - s * .25)}`, c, 1.8, o);
  const geese = (x, y, c, dir) => { let s = ''; for (let i = -3; i <= 3; i++) s += fly(x + i * 20, y + Math.abs(i) * 11 * dir, 9, c); return s; };
  const swallow = (x, y, s, c) => L(`M${x - s} ${y + 2} Q${x - s * .4} ${y - s * .5} ${x} ${y} Q${x + s * .4} ${y - s * .5} ${x + s} ${y + 2} M${x} ${y} l-3 9 M${x} ${y} l3 9`, c, 1.8, .9);
  function perched(x, y, s, c, o = {}) {
    let g = E(x, y, s * 1.15, s * .7, c, 1, o.rot || -8) + C(x + s * .95, y - s * .55, s * .45, c);
    g += F(`M${x + s * 1.35} ${y - s * .65} l${s * .55} ${s * .15} l-${s * .55} ${s * .18}Z`, o.beak || c);
    g += L(`M${x - s} ${y + s * .1} L${x - s * (o.longTail ? 4.2 : 2)} ${y + s * (o.longTail ? .2 : .55)}`, c, o.longTail ? 2.2 : 3);
    if (o.crest) g += L(`M${x + s * .8} ${y - s * .95} l-${s * .5} -${s * .7} M${x + s * 1} ${y - s * .95} l-${s * .2} -${s * .8} M${x + s * 1.2} ${y - s * .9} l${s * .1} -${s * .7}`, o.crestC || c, 1.6);
    if (o.notes) g += L(`M${x + s * 2.2} ${y - s * 1.2} q4 -4 8 0 M${x + s * 2.6} ${y - s * 2} q5 -5 10 0`, o.notes, 1.5, .8);
    g += L(`M${x - s * .2} ${y + s * .6} l-2 ${s * .55} M${x + s * .3} ${y + s * .6} l2 ${s * .55}`, c, 1.2);
    return g;
  }
  const branch = (x1, y1, x2, y2, c) => L(`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + 10} ${x2} ${y2} M${(x1 * 2 + x2) / 3} ${(y1 * 2 + y2) / 3 + 5} l-6 -14 M${(x1 + x2 * 2) / 3} ${(y1 + y2 * 2) / 3 + 5} l8 -12`, c, 2.2);
  function tree(x, y, h, c) {
    const tips = [[-.42, .62], [.4, .7], [-.32, .9], [.3, .95], [-.08, 1.1], [.14, 1.06], [-.5, .8], [.5, .85]].map(([dx, dy]) => [x + dx * h, y - dy * h]);
    let g = L(`M${x} ${y} L${x} ${y - h * .55}`, c, 3.2);
    tips.forEach(([tx, ty], i) => { const from = y - h * (i % 2 ? .5 : .62); g += L(`M${x} ${from} Q${(x + tx) / 2} ${(from + ty) / 2 - 6} ${f1(tx)} ${f1(ty)}`, c, i < 2 ? 2.4 : 1.6); });
    return { g, tips };
  }
  const flower = (x, y, r, c, ctr) => { let g = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g += C(x + Math.cos(a) * r, y + Math.sin(a) * r, r * .75, c, .9); } return g + C(x, y, r * .45, ctr || '#fff6', 1); };
  function cloud(x, y, s, c, o = .55) { return `<g opacity="${o}">` + C(x, y, s * .45, c) + C(x + s * .55, y - s * .28, s * .6, c) + C(x + s * 1.2, y - s * .05, s * .5, c) + C(x + s * 1.65, y + s * .1, s * .35, c) + `<rect x="${f1(x)}" y="${f1(y - s * .05)}" width="${f1(s * 1.65)}" height="${f1(s * .5)}" fill="${c}"/></g>`; }
  const waves = (y, c, n = 3, o = .6) => { let g = ''; for (let k = 0; k < n; k++) { let d = `M-10 ${y + k * 12}`; for (let x = -10; x < 410; x += 30) d += ` q15 ${k % 2 ? -5 : 5} 30 0`; g += L(d, c, 1.4, o - k * .12); } return g; };
  const fish = (x, y, s, c, rot = 0) => `<g transform="rotate(${rot} ${x} ${y})">` + E(x, y, s, s * .42, c) + F(`M${x - s * .9} ${y} l-${s * .6} -${s * .45} l0 ${s * .9}Z`, c) + C(x + s * .55, y - s * .08, s * .09, '#0006') + `</g>`;
  const sprout = (x, y, s, c) => L(`M${x} ${y} q-1 -${s} 1 -${s * 1.6}`, c, 1.8) + E(x - s * .45, y - s * 1.45, s * .5, s * .22, c, 1, -30) + E(x + s * .5, y - s * 1.65, s * .5, s * .22, c, 1, 25);
  const grass = (x, y, h, c, o = .9) => L(`M${x} ${y} q-4 -${h * .6} -10 -${h} M${x + 3} ${y} q1 -${h * .7} 4 -${h * 1.1} M${x + 6} ${y} q5 -${h * .5} 12 -${h * .8}`, c, 1.6, o);
  const wheat = (x, y, h, c) => { let g = L(`M${x} ${y} q2 -${h * .5} 0 -${h}`, c, 1.6); for (let i = 0; i < 5; i++) { g += E(x - 3, y - h + 4 + i * 6, 2.6, 4.4, c, 1, -25) + E(x + 3, y - h + 6 + i * 6, 2.6, 4.4, c, 1, 25); } return g; };
  const leaf = (x, y, r, rot, c, o = .9) => E(x, y, r, r * .45, c, o, rot) + L(`M${x - r * .9} ${y} L${x + r * .9} ${y}`, '#0003', .8);
  const paw = (x, y, c, o = .7) => `<g opacity="${o}">` + E(x, y, 5, 4.2, c) + C(x - 5, y - 6, 2, c) + C(x - 1.7, y - 8, 2, c) + C(x + 1.7, y - 8, 2, c) + C(x + 5, y - 6, 2, c) + `</g>`;
  const mound = (x, y, w, c, hole) => F(`M${x - w} ${y} Q${x} ${y - w * .8} ${x + w} ${y}Z`, c, .9) + L(`M${x - w} ${y} Q${x} ${y - w * .8} ${x + w} ${y}`, '#ffffff', 1.2, .18) + E(x, y - w * .18, w * .22, w * .13, hole);
  const sun = (x, y, r, c, o = .9) => C(x, y, r * 2.1, c, .06) + C(x, y, r * 1.45, c, .1) + C(x, y, r, c, o);
  const insect = (x, y, c) => E(x, y, 5, 3.2, c) + C(x + 5, y - 1, 2.2, c) + L(`M${x + 6} ${y - 3} l4 -5 M${x + 7} ${y - 2} l6 -3 M${x - 2} ${y + 2} l-3 4 M${x + 1} ${y + 3} l0 4 M${x + 3} ${y + 2} l3 4`, c, 1);
  const antlers = (x, y, c) => L(`M${x} ${y} q-6 -18 -22 -30 M${x - 12} ${y - 16} l-12 -2 M${x - 18} ${y - 25} l-4 -12 M${x + 8} ${y} q6 -18 22 -30 M${x + 20} ${y - 16} l12 -2 M${x + 26} ${y - 25} l4 -12`, c, 2.4);
  const cicada = (x, y, c, o = .95) => `<g opacity="${o}">` + E(x, y, 4, 9, c) + E(x - 6, y + 3, 4, 12, c, .55, 12) + E(x + 6, y + 3, 4, 12, c, .55, -12) + C(x - 2.5, y - 8, 1.5, '#0008') + C(x + 2.5, y - 8, 1.5, '#0008') + `</g>`;
  const frog = (x, y, c) => E(x, y, 13, 8, c) + C(x - 6, y - 7, 4, c) + C(x + 6, y - 7, 4, c) + C(x - 6, y - 7.5, 1.6, '#0009') + C(x + 6, y - 7.5, 1.6, '#0009') + L(`M${x - 12} ${y + 5} q-8 4 -12 0 M${x + 12} ${y + 5} q8 4 12 0`, c, 2);
  const worm = (x, y, c) => L(`M${x} ${y} q6 -8 12 0 t12 0 t12 0`, c, 3);
  const ripples = (x, y, c, n = 3, o = .6) => { let g = ''; for (let i = 1; i <= n; i++) g += RING(x, y, i * 16, i * 4.5, c, 1.2, o - i * .12); return g; };
  const shell = (x, y, s, c) => F(`M${x - s} ${y} Q${x} ${y - s * 1.6} ${x + s} ${y} Q${x} ${y + s * .35} ${x - s} ${y}Z`, c, .9) + L(`M${x} ${y + 2} L${x} ${y - s * .95} M${x} ${y + 2} L${x - s * .55} ${y - s * .7} M${x} ${y + 2} L${x + s * .55} ${y - s * .7}`, '#0004', 1);
  const chrys = (x, y, r, c) => { let g = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; g += L(`M${f1(x + Math.cos(a) * r * .25)} ${f1(y + Math.sin(a) * r * .25)} L${f1(x + Math.cos(a) * r)} ${f1(y + Math.sin(a) * r)}`, c, 2.4); } return g + C(x, y, r * .28, c); };
  const zig = (x, y, c) => L(`M${x} ${y} l-10 26 l12 -2 l-14 34`, c, 2.6);
  const crystal = (x, y, r, c, o = .8) => L(`M${x - r} ${y} L${x + r} ${y} M${x - r / 2} ${y - r * .87} L${x + r / 2} ${y + r * .87} M${x - r / 2} ${y + r * .87} L${x + r / 2} ${y - r * .87}`, c, 1.2, o);
  const flakes = (n, c, y0 = 30, y1 = 400) => { let g = ''; for (let i = 0; i < n; i++) g += C(rnd() * 400, y0 + rnd() * (y1 - y0), .9 + rnd() * 1.8, c, .35 + rnd() * .45); return g; };
  const windLines = (y, c, o = .55) => L(`M20 ${y} q60 -18 120 0 t120 -4 q20 -2 26 -14 q4 -10 -6 -12 M60 ${y + 28} q70 -14 150 2 t110 -6 M100 ${y + 54} q50 -10 110 0`, c, 1.6, o);
  const ice = (y, c) => F(`M30 ${y} l60 -4 l12 8 l-66 4Z M130 ${y - 2} l70 2 l-8 8 l-60 -2Z M230 ${y + 1} l52 -3 l14 6 l-58 5Z M310 ${y - 3} l60 2 l-4 8 l-50 0Z`, c, .45);
  const ground = (c, o = .9) => grass(40, G + 2, 16, c, o) + grass(140, G - 4, 12, c, o) + grass(260, G - 2, 14, c, o) + grass(350, G + 4, 18, c, o);

  /* ---- 72-候 compositions ---- */
  const M = {
    geeseN: p => geese(210, 120, p.ink, 1) + geese(120, 220, p.ink, 1).replace(/opacity="0.85"/g, 'opacity="0.45"'),
    geeseS: p => geese(200, 150, p.ink, -1) + geese(300, 250, p.ink, -1).replace(/opacity="0.85"/g, 'opacity="0.45"'),
    magpie: p => { const t = tree(300, G, 230, p.ink); return t.g + RING(292, G - 168, 22, 13, p.ink, 3, .9) + L(`M276 ${G - 170} l32 6 M280 ${G - 162} l26 -6`, p.ink, 1.4) + perched(205, 180, 10, p.acc2, { longTail: true }) + branch(160, 192, 250, 186, p.ink); },
    pheasant: p => perched(170, G - 32, 14, p.acc, { longTail: true, notes: p.ink }) + ground(p.ink, .6),
    hen: p => perched(180, G - 26, 18, p.acc2, { crest: true, crestC: p.acc }) + E(250, G - 6, 8, 10, p.acc2, .9) + E(268, G - 5, 7, 9, p.acc2, .7),
    raptor: p => L('M120 210 Q170 160 210 200 Q250 160 300 210', p.ink, 3) + F('M205 198 l10 30 l-14 -8Z', p.ink) + fly(90, 120, 10, p.ink, .4) + fly(330, 90, 8, p.ink, .35),
    lakeIce: p => F(`M-10 ${G - 6} H410 V${G + 40} H-10Z`, p.acc, .12) + L(`M60 ${G + 6} l40 10 l30 -6 l50 14 M220 ${G + 10} l40 -8 l60 12 l40 -4`, p.acc2, 1.2, .7),
    thaw: p => windLines(150, p.ink) + waves(G + 4, p.acc, 2) + ice(G, p.acc2),
    insects: p => mound(140, G + 6, 30, p.far, p.near) + mound(270, G + 4, 26, p.far, p.near) + `<g transform="translate(150 ${G - 30}) scale(1.8) translate(-150 -${G - 30})">` + insect(150, G - 30, p.acc2) + `</g><g transform="translate(262 ${G - 26}) scale(1.6) translate(-262 -${G - 26})">` + insect(262, G - 26, p.acc2) + `</g>` + sprout(200, G, 8, p.acc2),
    fishIce: p => waves(G - 8, p.acc, 3) + ice(G - 12, p.acc2) + fish(160, G + 14, 16, p.acc, -12) + fish(250, G + 22, 13, p.acc, 8),
    otterFish: p => F(`M120 ${G} Q200 ${G - 26} 290 ${G}Z`, p.ink, .25) + fish(160, G - 10, 13, p.acc) + fish(200, G - 14, 13, p.acc) + fish(240, G - 10, 13, p.acc) + waves(G + 12, p.acc, 2),
    sprouts: p => [50, 110, 170, 230, 290, 350].map((x, i) => sprout(x, G + (i % 2) * 4, 9 + (i % 3) * 3, p.acc2)).join(''),
    peach: p => { const t = tree(250, G, 250, p.ink); return t.g + t.tips.map(([x, y], i) => flower(x, y, 5.5, p.acc) + flower(x - 14, y + 10, 4.5, p.acc) + (i % 2 ? flower(x + 10, y + 14, 4, p.acc) : '')).join(''); },
    oriole: p => branch(60, 210, 300, 190, p.ink) + perched(190, 182, 12, p.acc2.replace('a9db8f', 'f2d36b'), { notes: p.ink, beak: p.acc }) + flower(110, 200, 4, p.acc) + flower(260, 188, 4, p.acc),
    dove: p => branch(80, 230, 320, 214, p.ink) + perched(205, 204, 14, '#e4e9ec', { beak: p.acc }) + fly(300, 110, 10, p.ink, .4),
    swallows: p => swallow(140, 150, 16, p.ink) + swallow(230, 120, 13, p.ink) + swallow(300, 190, 11, p.ink) + swallow(90, 230, 9, p.ink),
    thunder: p => cloud(80, 140, 120, p.ink, .3) + cloud(220, 110, 100, p.ink, .25) + L('M150 210 q10 6 20 0 M160 222 q14 8 28 0', p.acc, 1.6, .6),
    lightning: p => cloud(110, 120, 130, p.ink, .3) + zig(220, 150, p.acc2.replace('a9db8f', 'f6e3b4')) + zig(290, 140, p.acc2.replace('a9db8f', 'f6e3b4')),
    paulownia: p => { const t = tree(140, G, 250, p.ink); return t.g + t.tips.map(([x, y]) => E(x, y + 6, 4, 8, '#b9a2e6') + E(x + 7, y + 12, 3.5, 7, '#b9a2e6', .8)).join(''); },
    quail: p => perched(170, G - 14, 11, p.acc2.replace('a9db8f', 'c9a47a'), {}) + perched(230, G - 12, 9, p.acc2.replace('a9db8f', 'c9a47a'), {}) + ground(p.ink, .6),
    rainbow: p => ['#e88b8b', '#efc27a', '#a9db8f', '#8fbfe8', '#b39be8'].map((c, i) => L(`M${40 + i * 7} ${G} A${160 - i * 7} ${170 - i * 7} 0 0 1 ${360 - i * 7} ${G}`, c, 4, .55)).join(''),
    duckweed: p => F(`M-10 ${G - 2} H410 V${G + 40} H-10Z`, p.acc, .1) + waves(G + 4, p.acc, 2) + Array.from({ length: 22 }, () => E(30 + rnd() * 340, G + rnd() * 26, 4, 2.4, p.acc2, .8)).join(''),
    hoopoe: p => branch(70, 220, 330, 200, p.ink) + perched(200, 196, 13, '#e3a46a', { crest: true, crestC: '#e3a46a', beak: p.ink }) + [100, 150, 270, 300].map(x => leaf(x, 212, 9, -20, p.acc2)).join(''),
    frog: p => F(`M-10 ${G} H410 V${G + 40} H-10Z`, p.acc, .1) + E(160, G + 8, 30, 8, p.acc2, .6) + frog(160, G - 2, p.acc2) + ripples(280, G + 10, p.acc),
    worms: p => worm(110, G + 10, p.acc) + worm(230, G + 18, p.acc) + mound(170, G + 4, 18, p.far, p.near) + ground(p.acc2, .7),
    gourd: p => L(`M40 ${G} q30 -60 80 -50 t70 -60 t80 -20`, p.acc2, 2) + [[90, G - 54], [160, G - 100], [230, G - 140]].map(([x, y]) => leaf(x, y, 12, -30, p.acc2) + L(`M${x} ${y} q8 -10 0 -16`, p.acc2, 1.2)).join('') + C(198, G - 102, 9, p.acc2.replace('a9db8f', 'f2c96b')) + C(198, G - 88, 12, p.acc2.replace('a9db8f', 'f2c96b')),
    herbs: p => [80, 150, 230, 310].map((x, i) => L(`M${x} ${G} q-3 -40 2 -${70 + i * 8}`, p.acc2, 2) + leaf(x - 10, G - 30, 11, -40, p.acc2) + leaf(x + 10, G - 46, 11, 30, p.acc2) + flower(x + 2, G - 74 - i * 8, 4, p.sun)).join(''),
    grassDry: p => [60, 140, 220, 300].map(x => L(`M${x} ${G} q0 -30 18 -36 M${x + 6} ${G} q2 -24 22 -22`, p.sun, 1.6, .6)).join('') + ground(p.acc2, .5),
    barley: p => [50, 90, 130, 170, 210, 250, 290, 330].map((x, i) => wheat(x, G + 4, 64 + (i % 3) * 10, p.acc2.replace('62d6c6', 'f2c96b'))).join(''),
    mantis: p => L(`M150 ${G} q10 -60 30 -110`, p.acc2, 2) + L(`M178 ${G - 100} l14 -16 l6 4 M182 ${G - 86} l-14 -10 M176 ${G - 70} l10 18 M180 ${G - 98} l-6 -14`, p.acc, 2) + grass(240, G, 40, p.acc2, .7) + grass(80, G, 30, p.acc2, .7),
    shrike: p => L(`M210 ${G} V${G - 120}`, p.ink, 3) + perched(214, G - 132, 11, p.ink, { notes: p.acc }) + ground(p.acc2, .6),
    quietBird: p => branch(70, 230, 320, 212, p.ink) + perched(200, 206, 13, p.ink, {}) + (p.snow ? flakes(40, p.acc2) : ''),
    antlers: p => antlers(190, G - 6, p.ink) + antlers(260, G + 4, p.ink).replace(/opacity="1"/g, 'opacity="0.5"') + ground(p.acc2, .6),
    cicada: p => L(`M230 ${G} V${G - 260}`, p.ink, 7, .8) + cicada(230, G - 150, p.acc) + L('M260 160 q8 -6 16 0 M270 140 q10 -8 20 0 M262 180 q6 -4 12 0', p.acc, 1.4, .6),
    warmWind: p => windLines(160, p.sun, .5) + L(`M40 ${G - 20} q10 -6 20 0 t20 0 t20 0 M240 ${G - 40} q10 -6 20 0 t20 0 t20 0`, p.sun, 1.2, .35) + ground(p.acc2, .8),
    cricketWall: p => F(`M90 ${G} V${G - 70} H310 V${G}Z`, p.far, .9) + L(`M90 ${G - 35} H310 M150 ${G - 70} V${G - 35} M230 ${G - 35} V${G} M200 ${G - 70} V${G - 35}`, p.near, 2) + insect(210, G - 48, p.acc),
    hawk: p => L('M110 170 Q160 130 200 165 Q240 130 290 170', p.ink, 3) + F('M196 163 l8 24 l-12 -6Z', p.ink) + fly(110, 260, 8, p.ink, .35),
    fireflies: p => `<rect width="400" height="${G + 60}" fill="#000" opacity=".28"/>` + Array.from({ length: 26 }, () => { const x = 20 + rnd() * 360, y = 160 + rnd() * 250; return C(x, y, 7, p.acc2, .1) + C(x, y, 1.8, p.acc2, .95); }).join('') + ground(p.acc, .6),
    humid: p => [190, 240, 300, 360].map((y, i) => `<rect x="-20" y="${y}" width="440" height="${16 + i * 4}" rx="10" fill="${p.ink}" opacity="${.06 + i * .02}"/>`).join('') + ground(p.acc2, .7),
    rain: p => cloud(40, 110, 150, p.ink, .25) + cloud(230, 90, 140, p.ink, .25) + Array.from({ length: 70 }, () => { const x = rnd() * 420, y = 130 + rnd() * 280; return L(`M${f1(x)} ${f1(y)} l-6 16`, p.acc, 1.2, .45); }).join(''),
    coolWind: p => windLines(170, p.ink) + leaf(300, 160, 8, 30, p.acc) + leaf(250, 210, 7, -20, p.acc2) + ground(p.ink, .5),
    dew: p => [70, 150, 230, 310].map(x => grass(x, G, 30, p.acc2, .7) + C(x - 9, G - 30, 2.6, '#fff', .7) + C(x + 14, G - 25, 2.2, '#fff', .6)).join(''),
    solemn: p => { const t = tree(280, G, 220, p.ink); return t.g + t.tips.slice(0, 4).map(([x, y]) => leaf(x, y, 7, 20, p.acc)).join('') + L('M40 200 H160 M60 216 H140', p.ink, 1, .35); },
    grain: p => [40, 80, 120, 160, 200, 240, 280, 320, 360].map((x, i) => L(`M${x} ${G + 4} q2 -50 18 -${66 + (i % 3) * 8}`, p.acc, 1.6) + E(x + 18, G - 64 - (i % 3) * 8, 3.2, 10, p.acc, .95, 20)).join(''),
    birdsStore: p => branch(60, 230, 320, 214, p.ink) + perched(150, 222, 9, p.acc, {}) + perched(240, 214, 9, p.acc2, {}) + [180, 196, 270, 286].map(x => C(x, 230, 2.5, p.sun, .8)).join(''),
    thunderFade: p => cloud(150, 130, 120, p.ink, .18) + L('M190 210 q10 4 20 0', p.acc, 1.2, .3) + fly(300, 160, 8, p.ink, .4),
    burrows: p => mound(110, G + 4, 26, p.far, '#0008') + mound(210, G + 8, 34, p.far, '#0008') + mound(310, G + 4, 24, p.far, '#0008') + [70, 160, 260, 340].map((x, i) => leaf(x, G - 2, 6, i * 40, p.acc, .8)).join(''),
    pondDry: p => E(200, G + 14, 140, 18, p.acc, .12) + RING(200, G + 14, 110, 13, p.acc, 1.2, .4) + RING(200, G + 14, 80, 9, p.acc, 1.2, .6) + E(200, G + 14, 54, 6, p.acc, .3),
    clam: p => waves(G - 4, p.acc, 3) + shell(170, G + 30, 14, p.acc2) + shell(240, G + 34, 11, p.acc2) + fly(260, 180, 9, p.ink, .5),
    chrysanthemum: p => [90, 170, 250, 320].map((x, i) => L(`M${x} ${G} q4 -40 0 -${60 + i * 10}`, p.ink, 1.8) + chrys(x, G - 62 - i * 10, 14 - (i % 2) * 3, '#f2c94c') + leaf(x - 10, G - 24, 9, -30, p.ink, .6)).join(''),
    paws: p => [[120, G - 4], [150, G + 8], [185, G - 2], [215, G + 10], [250, G], [280, G + 12], [315, G + 2]].map(([x, y]) => paw(x, y, p.ink, .55)).join('') + (p.snow ? flakes(30, p.acc2) : [80, 340].map(x => leaf(x, G - 6, 6, 30, p.acc)).join('')),
    leavesFall: p => { const t = tree(120, G, 230, p.ink); return t.g + t.tips.slice(0, 3).map(([x, y]) => leaf(x, y, 7, 40, p.acc)).join('') + Array.from({ length: 16 }, () => leaf(140 + rnd() * 240, 120 + rnd() * 290, 5 + rnd() * 3, rnd() * 180, rnd() > .5 ? p.acc : p.acc2, .85)).join(''); },
    iceForm: p => waves(G + 4, p.acc, 2) + ice(G, p.acc2) + crystal(120, 200, 8, p.acc2) + crystal(280, 160, 6, p.acc2),
    frost: p => Array.from({ length: 18 }, () => crystal(20 + rnd() * 360, G - 10 + rnd() * 34, 3 + rnd() * 4, p.acc2, .7)).join('') + L(`M0 ${G + 2} H400`, p.acc2, 1, .4),
    overcast: p => cloud(20, 120, 180, p.ink, .2) + cloud(200, 90, 200, p.ink, .2) + L(`M60 ${G} A140 150 0 0 1 340 ${G}`, p.ink, 3, .07),
    qi: p => [100, 160, 220, 280].map((x, i) => L(i % 2 ? `M${x} 140 V260 M${x - 6} 252 l6 8 l6 -8` : `M${x} 260 V140 M${x - 6} 148 l6 -8 l6 8`, p.ink, 1.6, .5)).join('') + flakes(20, p.acc2),
    closed: p => cloud(-20, 100, 220, p.ink, .25) + cloud(190, 120, 220, p.ink, .25) + flakes(60, p.acc2),
    iris: p => [140, 200, 260].map((x, i) => L(`M${x} ${G} q-6 -30 -2 -${44 + i * 6} M${x + 4} ${G} q6 -24 2 -${36 + i * 4}`, p.acc2.replace('eef3fa', '9fd6a8'), 2.4)).join('') + flakes(35, p.acc2),
    wormKnot: p => L(`M180 ${G + 22} c-20 -10 10 -24 20 -10 s-14 18 -22 4 s20 -14 30 0`, p.acc, 3) + L(`M0 ${G + 2} H400`, p.acc2, 1, .3) + flakes(20, p.acc2),
    springWater: p => ripples(200, G + 12, p.acc, 4, .8) + C(200, G + 12, 3, p.acc2) + flakes(25, p.acc2),
  };
  const NO_SUN = new Set(['thunder', 'lightning', 'rain', 'overcast', 'closed', 'humid', 'fireflies', 'thunderFade']);

  function render(motif, season, idx) {
    const p = Object.assign({}, PAL[season]); if (season === 'winter') p.snow = true;
    seed = 1 + (idx || 0) * 977;
    let s = `<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg"><defs>
      <linearGradient id="sky${idx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
      <linearGradient id="fadeB${idx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[1]}" stop-opacity="0"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs>
      <rect width="400" height="600" fill="url(#sky${idx})"/>`;
    if (!NO_SUN.has(motif)) s += season === 'autumn' ? sun(305, 112, 28, p.sun, .85) + C(296, 106, 26, p.sky[0], .25) : season === 'winter' ? sun(92, 150, 22, p.sun, .7) : sun(312, 104, season === 'summer' ? 30 : 24, p.sun, .9);
    s += F('M-10 392 Q60 330 140 372 T290 350 T410 368 V600 H-10Z', p.far);
    if (p.snow) s += L('M-10 392 Q60 330 140 372 T290 350 T410 368', p.acc2, 2, .35);
    s += F(`M-10 ${G + 4} Q100 ${G - 12} 200 ${G} T410 ${G - 4} V600 H-10Z`, p.near);
    if (p.snow) s += L(`M-10 ${G + 4} Q100 ${G - 12} 200 ${G} T410 ${G - 4}`, p.acc2, 2.5, .45);
    s += `<g>${(M[motif] || (() => ''))(p)}</g>`;
    s += `<rect y="455" width="400" height="145" fill="url(#fadeB${idx})"/></svg>`;
    return s;
  }
  window.SCENES = { render, PAL };
})();
