/* Procedural SVG plant art. Every leaf is drawn from its own seed, so a plant
   looks identical every time it renders but unique from every other plant. */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- leaf geometry ----------
   Every blade is drawn with the petiole at (0,0) and the apex at (0,-L).
   The outline, proportions, venation and markings all come from the species'
   LEAF_SPECS entry, so a Monstera, an Alocasia and a Hoya are genuinely
   different leaves rather than one silhouette recoloured. */

const ellipsePath = (cx, cy, rx, ry) =>
  ` M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

const DEFAULT_SPEC = { r: 1.4, form: 'ovate', sinus: .08, tip: .18, sh: .45, vein: 'pinnate' };
const specOf = sp => (typeof LEAF_SPECS !== 'undefined' && LEAF_SPECS[sp.id]) || DEFAULT_SPEC;

/* cordate / ovate / elliptic / strap all come from one curve — what changes is how
   far the basal lobes swing out and down, and where the blade is widest */
function outline(L, W, o) {
  const s = (o.sinus || 0) * L, sh = o.sh ?? .45, tip = o.tip ?? .15;
  const lobe = Math.min(1, (o.sinus || 0) / 0.3);
  const y0 = -s;
  const c1x = W * (0.50 + 0.34 * lobe), c1y = y0 + s * 0.66 + lobe * L * 0.045;
  const c2x = W * (0.92 + 0.08 * lobe), c2y = -L * sh * 0.40;
  const c3x = W * 0.97, c3y = -L * (sh + (1 - sh) * 0.55);
  const c4x = W * tip * 1.8, c4y = -L * 0.93;
  return `M 0 ${y0}`
    + ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${W} ${-L * sh}`
    + ` C ${c3x} ${c3y}, ${c4x} ${c4y}, 0 ${-L}`
    + ` C ${-c4x} ${c4y}, ${-c3x} ${c3y}, ${-W} ${-L * sh}`
    + ` C ${-c2x} ${c2y}, ${-c1x} ${c1y}, 0 ${y0} Z`;
}

/* arrowhead — Alocasia / Pink Princess: basal lobes point backwards past the stalk */
function sagittate(L, W, o) {
  const s = (o.sinus ?? .3) * L, sh = o.sh ?? .34, tip = o.tip ?? .1;
  return `M 0 ${-s}`
    + ` C ${W * 0.55} ${-s * 0.45}, ${W * 0.9} ${-s * 0.15}, ${W * 0.96} ${L * 0.045}`
    + ` C ${W} ${-L * 0.16}, ${W} ${-L * sh}, ${W * 0.86} ${-L * (sh + 0.08)}`
    + ` C ${W * 0.58} ${-L * 0.74}, ${W * tip * 1.7} ${-L * 0.9}, 0 ${-L}`
    + ` C ${-W * tip * 1.7} ${-L * 0.9}, ${-W * 0.58} ${-L * 0.74}, ${-W * 0.84} ${-L * (sh + 0.08)}`
    + ` C ${-W} ${-L * sh}, ${-W} ${-L * 0.16}, ${-W * 0.96} ${L * 0.045}`
    + ` C ${-W * 0.9} ${-s * 0.15}, ${-W * 0.55} ${-s * 0.45}, 0 ${-s} Z`;
}

/* Syngonium: one central lobe flanked by two ears. Drawn as separate filled parts
   so their winding direction can't punch holes in the central lobe. */
function syngoniumEars(L, W) {
  let d = '';
  for (const k of [1, -1]) {
    d += ` M ${k * W * 0.04} ${-L * 0.26}`
      + ` C ${k * W * 0.45} ${-L * 0.10}, ${k * W * 0.96} ${-L * 0.08}, ${k * W * 0.99} ${-L * 0.32}`
      + ` C ${k * W} ${-L * 0.54}, ${k * W * 0.5} ${-L * 0.62}, ${k * W * 0.04} ${-L * 0.5} Z`;
  }
  return d;
}

/* Rhaphidophora tetrasperma: cut almost to the midrib, no interior windows */
function pinnatifidSlits(L, W) {
  let d = '';
  for (const k of [1, -1]) {
    for (let i = 0; i < 5; i++) {
      const cx = W * 1.06;
      d += ellipsePath(k * cx, -L * (0.17 + i * 0.15), cx - W * 0.18, L * 0.03);
    }
  }
  return d;
}

/* Hoya kerrii: the point is at the stalk and the notch is at the apex */
function sweetheart(L, W) {
  return `M 0 0`
    + ` C ${W * 0.78} ${-L * 0.12}, ${W * 1.1} ${-L * 0.52}, ${W * 0.55} ${-L * 0.9}`
    + ` C ${W * 0.36} ${-L * 1.02}, ${W * 0.12} ${-L * 0.99}, 0 ${-L * 0.87}`
    + ` C ${-W * 0.12} ${-L * 0.99}, ${-W * 0.36} ${-L * 1.02}, ${-W * 0.55} ${-L * 0.9}`
    + ` C ${-W * 1.1} ${-L * 0.52}, ${-W * 0.78} ${-L * 0.12}, 0 0 Z`;
}

/* Hindu rope: a curled, crumpled stack rather than a flat blade */
function crumpled(L, W, rng) {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    d += ellipsePath((i % 2 ? 1 : -1) * W * 0.3, -L * (0.16 + t * 0.68), W * 0.66, L * 0.155);
  }
  return d;
}

/* Bird's nest fern: rippled margin, made by unioning bumps onto the blade */
function wavyEdge(L, W, base) {
  let d = base;
  for (const k of [1, -1]) {
    for (let i = 0; i < 7; i++) {
      const t = 0.12 + i * 0.115;
      d += ellipsePath(k * W * (0.96 - Math.abs(t - 0.45) * 0.4), -L * t, W * 0.26, L * 0.07);
    }
  }
  return d;
}

/* pinnate frond — leaflets are fans on a maidenhair, ovals otherwise */
function fernBlade(L, W, leaflet) {
  let d = `M ${-W * 0.045} 0 L ${W * 0.045} 0 L ${W * 0.03} ${-L} L ${-W * 0.03} ${-L} Z`;
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), y = -L * t;
    const len = W * (1.05 - Math.abs(t - 0.42) * 1.15);
    for (const k of [1, -1]) {
      if (leaflet === 'fan') {
        const fl = L * 0.14;
        d += ` M 0 ${y} C ${k * len * 0.15} ${y - fl * 0.5}, ${k * len * 0.55} ${y - fl * 0.8}, ${k * len} ${y - fl * 0.66}`
          + ` C ${k * len * 0.86} ${y - fl * 0.34}, ${k * len * 0.5} ${y - fl * 0.1}, 0 ${y} Z`;
      } else {
        d += ` M 0 ${y} Q ${k * len * 0.55} ${y - L * 0.075} ${k * len} ${y - L * 0.05}`
          + ` Q ${k * len * 0.55} ${y + L * 0.025} 0 ${y} Z`;
      }
    }
  }
  return d;
}

/* Staghorn: a forked antler frond */
function antler(L, W) {
  let d = `M ${-W * 0.13} 0 C ${-W * 0.09} ${-L * 0.28}, ${-W * 0.05} ${-L * 0.38}, ${-W * 0.05} ${-L * 0.44}`
    + ` L ${W * 0.05} ${-L * 0.44} C ${W * 0.05} ${-L * 0.38}, ${W * 0.09} ${-L * 0.28}, ${W * 0.13} 0 Z`;
  for (const k of [1, -1]) {
    d += ` M ${k * W * 0.02} ${-L * 0.4}`
      + ` C ${k * W * 0.34} ${-L * 0.54}, ${k * W * 0.5} ${-L * 0.72}, ${k * W * 0.4} ${-L * 0.96}`
      + ` L ${k * W * 0.62} ${-L * 0.9}`
      + ` C ${k * W * 0.8} ${-L * 0.68}, ${k * W * 0.54} ${-L * 0.5}, ${k * W * 0.17} ${-L * 0.36} Z`;
    d += ` M ${k * W * 0.05} ${-L * 0.46}`
      + ` C ${k * W * 0.55} ${-L * 0.5}, ${k * W * 0.85} ${-L * 0.58}, ${k * W * 0.95} ${-L * 0.76}`
      + ` L ${k * W * 0.7} ${-L * 0.78} C ${k * W * 0.5} ${-L * 0.62}, ${k * W * 0.3} ${-L * 0.5}, ${k * W * 0.05} ${-L * 0.46} Z`;
  }
  return d;
}

function wingBlade(L, W) { // begonia: one shoulder much fuller than the other
  return `M 0 0`
    + ` C ${W * 0.9} ${L * 0.06}, ${W * 1.5} ${-L * 0.3}, ${W * 1.15} ${-L * 0.66}`
    + ` C ${W * 0.9} ${-L * 0.93}, ${W * 0.35} ${-L} , ${W * 0.12} ${-L}`
    + ` C ${-W * 0.3} ${-L * 0.95}, ${-W * 0.72} ${-L * 0.6}, ${-W * 0.68} ${-L * 0.26}`
    + ` C ${-W * 0.66} ${-L * 0.08}, ${-W * 0.35} ${L * 0.02}, 0 0 Z`;
}

/* venus flytrap — stalk plus two hinged, toothed jaws */
function trapBlade(L, W) {
  const h = -L * 0.5;
  let d = `M ${-W * 0.09} 0 L ${W * 0.09} 0 L ${W * 0.07} ${h} L ${-W * 0.07} ${h} Z`;
  for (const s of [1, -1]) {
    d += ` M 0 ${h} C ${s * W * 0.85} ${h - L * 0.06}, ${s * W * 0.95} ${h - L * 0.42}, ${s * W * 0.16} ${h - L * 0.46}`
      + ` C ${s * W * 0.06} ${h - L * 0.3}, ${s * W * 0.06} ${h - L * 0.12}, 0 ${h} Z`;
    for (let i = 0; i < 5; i++) {
      const t = 0.18 + i * 0.16;
      const x = s * W * (0.86 - t * 0.62), y = h - L * 0.44 * t - L * 0.02;
      d += ` M ${x} ${y} L ${x + s * W * 0.30} ${y - L * 0.10} L ${x - s * W * 0.04} ${y - L * 0.10} Z`;
    }
  }
  return d;
}

/* nepenthes — a stalk holding an upright jug with a lid */
function pitcherBlade(L, W) {
  const s = -L * 0.4;
  let d = `M ${-W * 0.06} 0 L ${W * 0.06} 0 L ${W * 0.05} ${s} L ${-W * 0.05} ${s} Z`;
  d += ` M ${-W * 0.42} ${s} C ${-W * 0.58} ${s - L * 0.18}, ${-W * 0.44} ${s - L * 0.44}, ${-W * 0.22} ${s - L * 0.5}`
    + ` L ${W * 0.22} ${s - L * 0.5} C ${W * 0.44} ${s - L * 0.44}, ${W * 0.58} ${s - L * 0.18}, ${W * 0.42} ${s}`
    + ` C ${W * 0.22} ${s + L * 0.06}, ${-W * 0.22} ${s + L * 0.06}, ${-W * 0.42} ${s} Z`;
  d += ` M ${-W * 0.28} ${s - L * 0.49} C ${-W * 0.12} ${s - L * 0.74}, ${W * 0.34} ${s - L * 0.7}, ${W * 0.38} ${s - L * 0.48} Z`;
  return d;
}

const ovalBlade = (L, W) => `M 0 0 C ${W} ${-L * 0.12}, ${W} ${-L * 0.85}, 0 ${-L}`
  + ` C ${-W} ${-L * 0.85}, ${-W} ${-L * 0.12}, 0 0 Z`;
const padBlade = (L, W) => ovalBlade(L, W * 0.92);
const globeBlade = (L, W) => ellipsePath(0, -L * 0.46, W * 0.95, L * 0.46).trim();
const lithopsBlade = (L, W) => {
  const rx = W * 0.44, ry = L * 0.44;
  return (ellipsePath(-rx * 1.04, -ry, rx, ry) + ellipsePath(rx * 1.04, -ry, rx, ry)).trim();
};
const columnBlade = (L, W) => `M ${-W * .62} 0 L ${-W * .7} ${-L * .72} Q ${-W * .58} ${-L} 0 ${-L} Q ${W * .58} ${-L} ${W * .7} ${-L * .72} L ${W * .62} 0 Z`;
const starCactusBlade = (L, W) => {
  const pts=[]; for(let i=0;i<16;i++){const a=-Math.PI/2+i*Math.PI/8,r=i%2?W*.52:W;pts.push(`${Math.cos(a)*r} ${-L*.5+Math.sin(a)*r}`)}
  return `M ${pts.join(' L ')} Z`;
};
const segmentBlade = (L, W, scallop=false) => {
  let d='M 0 0'; for(let i=0;i<5;i++){const y=-L*i/5,y2=-L*(i+1)/5,ww=W*(scallop?.78:(i%2?.58:1));d+=` C ${ww} ${y-L*.05}, ${ww} ${y2+L*.05}, 0 ${y2}`}
  for(let i=4;i>=0;i--){const y=-L*(i+1)/5,y2=-L*i/5,ww=-W*(scallop?.78:(i%2?.58:1));d+=` C ${ww} ${y+L*.05}, ${ww} ${y2-L*.05}, 0 ${y2}`} return d+' Z';
};
const rosetteBlade = (L,W,teeth=false) => teeth
  ? `M 0 0 L ${W*.6} ${-L*.18} L ${W*.42} ${-L*.28} L ${W*.7} ${-L*.4} L ${W*.4} ${-L*.52} L ${W*.5} ${-L*.7} L 0 ${-L} L ${-W*.5} ${-L*.7} L ${-W*.4} ${-L*.52} L ${-W*.7} ${-L*.4} L ${-W*.42} ${-L*.28} L ${-W*.6} ${-L*.18} Z`
  : outline(L,W,{sinus:0,sh:.35,tip:.22});
const dolphinBlade = (L,W) => `M 0 0 C ${W*.8} ${-L*.08}, ${W*.9} ${-L*.55}, ${W*.18} ${-L*.72} L ${W*.5} ${-L} L 0 ${-L*.82} L ${-W*.36} ${-L} L ${-W*.18} ${-L*.7} C ${-W*.75} ${-L*.48}, ${-W*.62} ${-L*.1}, 0 0 Z`;
const triangleBlade = (L,W) => `M 0 0 L ${W} ${-L*.86} L ${-W} ${-L*.86} Z`;

/* Hole shapes, painted black into the leaf's mask. Ellipses that straddle the
   margin read as splits; interior ones are classic monstera windows. */
function fenestrations(L, W, rng, amount, style) {
  if (amount <= 0) return '';
  let d = '';
  if (style === 'split') {
    /* deliciosa: narrow slits cut in from the margin, stopping short of the midrib
       so a solid central band always remains */
    const rows = 4 + Math.round(amount * 3);
    for (const k of [1, -1]) {
      for (let i = 0; i < rows; i++) {
        const t = 0.18 + (i / rows) * 0.66;
        const y = -L * (t + rng() * 0.02);
        const inner = W * (0.74 - amount * 0.40);
        const cx = W * 1.04;
        d += ellipsePath(k * cx, y, cx - inner, L * 0.028 * (0.85 + rng() * 0.4));
      }
    }
    if (amount > 0.55) {                     // a couple of true windows near the midrib
      for (const k of [1, -1]) {
        for (let i = 0; i < 2; i++) {
          const y = -L * (0.34 + i * 0.24 + rng() * 0.04);
          d += ellipsePath(k * W * 0.26, y, W * 0.09, L * 0.035);
        }
      }
    }
    return d;
  }
  if (style === 'lace') {
    /* obliqua: more hole than leaf */
    for (const k of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        const y = -L * (0.2 + i * 0.19 + rng() * 0.03);
        d += ellipsePath(k * W * (0.46 + rng() * 0.08), y, W * 0.34, L * (0.07 + rng() * 0.02));
      }
    }
    return d;
  }
  /* adansonii: scattered oval windows either side of the midrib */
  for (const k of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      if (rng() > 0.35 + amount * 0.6) continue;
      const y = -L * (0.22 + i * 0.17 + rng() * 0.05);
      d += ellipsePath(k * W * (0.36 + rng() * 0.24), y, W * (0.13 + amount * 0.07), L * (0.045 + amount * 0.025));
    }
  }
  return d;
}

/* pick the outline for a species, and the half-width its proportions imply */
function leafOutline(sp, L, rng, fenAmt) {
  const s = specOf(sp);
  const W = L / (2 * (s.r || 1.4));
  let d, holes = '', parts = '';
  switch (s.form) {
    case 'sagittate':  d = sagittate(L, W, s); break;
    case 'trilobe':    d = outline(L, W * 0.62, { sinus: .12, sh: .44, tip: s.tip ?? .12 }); parts = syngoniumEars(L, W); break;
    case 'pinnatifid': d = outline(L, W, { sinus: .1, sh: .45, tip: .14 }); holes = pinnatifidSlits(L, W); break;
    case 'sweetheart': d = sweetheart(L, W); break;
    case 'crumpled':   d = crumpled(L, W, rng); break;
    case 'wing':       d = wingBlade(L, W * 1.3); break;
    case 'pearl':      d = ellipsePath(0, -L * 0.32, L * 0.28, L * 0.32).trim(); break;
    case 'fern':       d = fernBlade(L, W * 1.7, s.leaflet); break;
    case 'antler':     d = antler(L, W * 1.6); break;
    case 'trap':       d = trapBlade(L, W * 1.5); break;
    case 'pitcher':    d = pitcherBlade(L, W * 1.7); break;
    case 'pad':        d = padBlade(L, W * 1.8); break;
    case 'globe':      d = globeBlade(L, W * 1.9); break;
    case 'lithops':    d = lithopsBlade(L, W * 1.9); break;
    case 'column':     d = columnBlade(L, W * 1.5); break;
    case 'starcactus': d = starCactusBlade(L, W * 1.9); break;
    case 'segment':    d = segmentBlade(L, W * 1.4, s.margin === 'scallop'); break;
    case 'rosette':    d = rosetteBlade(L, W * 1.4, s.margin === 'teeth'); break;
    case 'dolphin':    d = dolphinBlade(L, W * 1.5); break;
    case 'triangle':   d = triangleBlade(L, W * 1.1); break;
    case 'coin':       d = ellipsePath(0, -L * .5, L * .48, L * .48).trim(); break;
    case 'strap':      d = s.margin === 'wavy' ? wavyEdge(L, W, outline(L, W, s)) : outline(L, W, s); break;
    default:           d = outline(L, W, s);
  }
  if (s.fen && fenAmt > 0) holes += fenestrations(L, W, rng, fenAmt, s.fen);
  return { d, holes, parts, W, spec: s };
}

/* ---------- venation ---------- */
function veins(spec, L, W, color, rng) {
  const style = spec.vein || 'pinnate';
  if (style === 'none') return '';
  const base = -(spec.sinus || 0) * L;
  const mid = w => `<path d="M 0 ${base} L 0 ${-L * 0.94}" stroke="${color}" stroke-width="${L * w}" fill="none" opacity=".6" stroke-linecap="round"/>`;
  if (style === 'midrib') return mid(0.022);

  if (style === 'areole') {                       // cactus pad: spines from areoles
    let g = '';
    for (let i = 0; i < 15; i++) {
      const x = (rng() - 0.5) * W * 1.5, y = -L * (0.1 + rng() * 0.82);
      g += `<circle cx="${x}" cy="${y}" r="${L * 0.02}" fill="${color}" opacity=".9"/>`;
      for (let k = 0; k < 3; k++)
        g += `<path d="M ${x} ${y} l ${(rng() - 0.5) * L * 0.09} ${-L * (0.02 + rng() * 0.045)}" stroke="${color}" stroke-width="${L * 0.009}" opacity=".8"/>`;
    }
    return g;
  }
  if (style === 'ribs') {                         // barrel cactus ribs + spine rows
    let g = '';
    for (let i = -4; i <= 4; i++) {
      const x = (i / 4.6) * W * 0.95;
      g += `<path d="M ${x} ${-L * 0.05} Q ${x * 1.08} ${-L * 0.46} ${x} ${-L * 0.9}" stroke="${color}" stroke-width="${L * 0.022}" fill="none" opacity=".55"/>`;
      g += `<path d="M ${x} ${-L * 0.14} L ${x} ${-L * 0.8}" stroke="#fff8d8" stroke-width="${L * 0.013}" stroke-dasharray="${L * 0.028} ${L * 0.06}" opacity=".75"/>`;
    }
    return g;
  }
  if (style === 'stone') {                        // lithops: fissure + translucent windows
    const rx = W * 0.44;
    let g = '';
    for (const k of [1, -1])
      g += `<path d="M ${k * rx * 1.04 - rx * 0.55} ${-L * 0.46} L ${k * rx * 1.04 + rx * 0.55} ${-L * 0.46}" stroke="${color}" stroke-width="${L * 0.045}" opacity=".7" stroke-linecap="round"/>`;
    for (let i = 0; i < 18; i++) {
      const x = (rng() - 0.5) * W * 1.7, y = -L * (0.16 + rng() * 0.6);
      g += `<circle cx="${x}" cy="${y}" r="${L * (0.015 + rng() * 0.015)}" fill="${color}" opacity=".4"/>`;
    }
    return g;
  }
  if (style === 'speck') {                        // carnivore mottling
    let g = '';
    for (let i = 0; i < 20; i++) {
      const x = (rng() - 0.5) * W * 1.3, y = -L * (0.35 + rng() * 0.6);
      g += `<circle cx="${x}" cy="${y}" r="${L * 0.016}" fill="${color}" opacity=".7"/>`;
    }
    return g;
  }
  if (style === 'window') {                       // string of pearls: the light stripe
    return `<path d="M ${-W * 0.1} ${-L * 0.52} Q 0 ${-L * 0.3} ${W * 0.12} ${-L * 0.14}" stroke="#eafbe6" stroke-width="${L * 0.035}" fill="none" opacity=".8" stroke-linecap="round"/>`;
  }
  if (style === 'stripe') {                       // Calathea / Stromanthe banding
    let g = mid(0.03);
    for (let i = 1; i <= 7; i++) {
      const t = i / 8, y = -L * t, x = W * (0.92 - Math.abs(t - 0.5) * 0.5);
      for (const k of [1, -1])
        g += `<path d="M 0 ${y} Q ${k * x * 0.55} ${y - L * 0.04} ${k * x} ${y - L * 0.1}" stroke="${color}" stroke-width="${L * 0.05}" fill="none" opacity=".45" stroke-linecap="round"/>`;
    }
    return g;
  }
  if (style === 'chevron') {
    let g=mid(.025); for(let i=1;i<=6;i++){const y=-L*(.12+i*.12),x=W*(.75-i*.035);g+=`<path d="M ${-x} ${y-L*.08} L 0 ${y} L ${x} ${y-L*.08}" stroke="${color}" stroke-width="${L*.035}" fill="none" opacity=".75"/>`} return g;
  }
  if (style === 'net') {
    let g=mid(.025); for(let i=1;i<=5;i++){const y=-L*(.14+i*.14);g+=`<path d="M ${-W*.8} ${y} Q 0 ${y-L*.1} ${W*.8} ${y}" stroke="${color}" stroke-width="${L*.025}" fill="none" opacity=".8"/>`}for(const k of[-1,1])g+=`<path d="M 0 0 Q ${k*W*.75} ${-L*.45} ${k*W*.25} ${-L*.92}" stroke="${color}" stroke-width="${L*.022}" fill="none" opacity=".7"/>`;return g;
  }
  if (style === 'radial') {                       // watermelon peperomia
    let g = '';
    for (let i = -5; i <= 5; i++) {
      const a = i / 5;
      const sx = a * W * 0.2, sy = -L * (0.2 - Math.abs(a) * 0.06);   // spread the origins
      const ex = a * W * 0.95, ey = -L * (0.95 - Math.abs(a) * 0.62);
      g += `<path d="M ${sx} ${sy} Q ${a * W * 0.78} ${-L * 0.58} ${ex} ${ey}" stroke="${color}" stroke-width="${L * 0.04}" fill="none" opacity=".55" stroke-linecap="round"/>`;
    }
    return g;
  }
  if (style === 'quilt') {                        // Alocasia dragon scale
    let g = mid(0.03);
    for (let i = 1; i <= 5; i++) {
      const t = 0.12 + i * 0.15, y = -L * t, x = W * (0.85 - Math.abs(t - 0.45) * 0.6);
      for (const k of [1, -1])
        g += `<path d="M 0 ${y} Q ${k * x * 0.55} ${y - L * 0.05} ${k * x * 0.95} ${y - L * 0.12}" stroke="${color}" stroke-width="${L * 0.032}" fill="none" opacity=".7"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const y = -L * (0.22 + i * 0.14);
      g += `<path d="M ${-W * 0.8} ${y} Q 0 ${y + L * 0.04} ${W * 0.8} ${y}" stroke="${color}" stroke-width="${L * 0.016}" fill="none" opacity=".35"/>`;
    }
    return g;
  }
  if (style === 'bold') {                         // gloriosum, clarinervium, frydek
    let g = `<path d="M 0 ${base} L 0 ${-L * 0.95}" stroke="${color}" stroke-width="${L * 0.045}" fill="none" opacity=".9" stroke-linecap="round"/>`;
    for (let i = 1; i <= 4; i++) {
      const t = 0.12 + i * 0.19, y = -L * t, x = W * (0.85 - Math.abs(t - 0.45) * 0.5);
      for (const k of [1, -1])
        g += `<path d="M 0 ${y} Q ${k * x * 0.5} ${y - L * 0.06} ${k * x * 0.95} ${y - L * 0.16}" stroke="${color}" stroke-width="${L * 0.032}" fill="none" opacity=".85" stroke-linecap="round"/>`;
    }
    return g;
  }
  let g = mid(0.022);                             // pinnate default
  for (let i = 1; i <= 5; i++) {
    const t = 0.12 + i * 0.16, y = -L * t, x = W * (0.82 - Math.abs(t - 0.45) * 0.6);
    for (const k of [1, -1])
      g += `<path d="M 0 ${y} Q ${k * x * 0.55} ${y - L * 0.05} ${k * x * 0.92} ${y - L * 0.14}" stroke="${color}" stroke-width="${L * 0.014}" fill="none" opacity=".45"/>`;
  }
  return g;
}

/* ---------- surface markings ---------- */
function marks(spec, L, W, rng) {
  const m = spec.marks;
  if (!m) return '';
  let g = '';
  if (m === 'spots') {                            // Begonia maculata polka dots
    for (let i = 0; i < 16; i++) {
      const x = (rng() - 0.5) * W * 1.7, y = -L * (0.12 + rng() * 0.78);
      g += `<circle cx="${x}" cy="${y}" r="${L * (0.02 + rng() * 0.014)}" fill="#eaf3ec" opacity=".85"/>`;
    }
  } else if (m === 'splash') {                    // Scindapsus silver
    for (let i = 0; i < 9; i++) {
      const x = (rng() - 0.5) * W * 1.5, y = -L * (0.15 + rng() * 0.7);
      g += `<ellipse cx="${x}" cy="${y}" rx="${W * (0.14 + rng() * 0.2)}" ry="${L * (0.05 + rng() * 0.07)}" fill="#dfe8e2" opacity="${(0.45 + rng() * 0.35).toFixed(2)}" transform="rotate(${(-35 + rng() * 70).toFixed(1)} ${x} ${y})"/>`;
    }
  } else if (m === 'marble') {                    // string of hearts
    for (let i = 0; i < 11; i++) {
      const x = (rng() - 0.5) * W * 1.5, y = -L * (0.12 + rng() * 0.76);
      g += `<path d="M ${x} ${y} q ${W * 0.3} ${-L * 0.08} ${W * 0.5} ${L * 0.02}" stroke="#e4e9ee" stroke-width="${L * 0.05}" fill="none" opacity=".55" stroke-linecap="round"/>`;
    }
  } else if (m === 'wool') {
    for(let i=0;i<26;i++){const x=(rng()-.5)*W*1.5,y=-L*(.05+rng()*.9);g+=`<path d="M ${x} ${y} q ${W*.22} ${-L*.1} ${W*.05} ${-L*.22}" stroke="#fffdf0" stroke-width="${L*.018}" fill="none" opacity=".8"/>`}
  } else if (m === 'flecks') {
    for(let i=0;i<34;i++){const x=(rng()-.5)*W*1.6,y=-L*(.08+rng()*.82);g+=`<circle cx="${x}" cy="${y}" r="${L*.012}" fill="#f5f0dd" opacity=".85"/>`}
  } else if (m === 'zebra') {
    for(let i=1;i<=7;i++){const y=-L*(.1+i*.11);g+=`<path d="M ${-W*.7} ${y} Q 0 ${y-L*.04} ${W*.7} ${y}" stroke="#f5f2df" stroke-width="${L*.04}" fill="none" opacity=".85"/>`}
  } else if (m === 'spiral') {
    g+=`<path d="M 0 ${-L*.5} C ${W*.7} ${-L*.75}, ${W*.7} ${-L*.18}, 0 ${-L*.2} C ${-W*.65} ${-L*.22}, ${-W*.75} ${-L*.78}, 0 ${-L*.88}" stroke="#d47a9f" stroke-width="${L*.12}" fill="none" opacity=".62"/>`;
  } else if (m === 'tentacles') {
    for(let i=0;i<22;i++){const x=(rng()-.5)*W*1.5,y=-L*(.08+rng()*.84);g+=`<circle cx="${x}" cy="${y}" r="${L*.018}" fill="#d94361"/><path d="M ${x} ${y} l ${(rng()-.5)*L*.08} ${-L*.08}" stroke="#e35a72" stroke-width="${L*.012}"/>`}
  } else if (m === 'spines' || m === 'thorns') {
    for(let i=0;i<18;i++){const x=(rng()-.5)*W*1.45,y=-L*(.08+rng()*.84);g+=`<path d="M ${x} ${y} l ${(rng()-.5)*L*.12} ${-L*(m==='thorns'?.1:.07)}" stroke="${m==='thorns'?'#7c432f':'#f1dfb1'}" stroke-width="${L*.012}"/>`}
  }
  return g;
}

/* ---------- variegation ---------- */
function varieg(type, L, W, rng, clipId) {
  const v = VARIEG[type];
  if (!v || !v.color) return '';
  const c = v.color;
  let g = `<g clip-path="url(#${clipId})">`;
  if (type === 'sport') {
    g += `<rect x="0" y="${-L * 1.05}" width="${W * 1.4}" height="${L * 1.1}" fill="${c}" opacity=".92"/>`;
    g += `<path d="M 0 ${-L * 1.05} L ${W * 0.25} ${-L * 0.4} L 0 0" fill="${c}" opacity=".5"/>`;
  } else if (type === 'const_') {
    for (let i = 0; i < 46; i++) {
      const y = -L * (0.06 + rng() * 0.9), x = (rng() - 0.5) * W * 1.7;
      g += `<ellipse cx="${x}" cy="${y}" rx="${W * (0.02 + rng() * 0.05)}" ry="${L * (0.012 + rng() * 0.03)}" fill="${c}" opacity="${0.5 + rng() * 0.5}" transform="rotate(${rng() * 60 - 30} ${x} ${y})"/>`;
    }
  } else {
    const n = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      const y = -L * (0.12 + rng() * 0.78), x = (rng() - 0.5) * W * 1.5;
      const rx = W * (0.12 + rng() * 0.26), ry = L * (0.06 + rng() * 0.16);
      g += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${0.72 + rng() * 0.28}" transform="rotate(${rng() * 90 - 45} ${x} ${y})"/>`;
    }
    for (let i = 0; i < 6; i++) { // speckle spray at the boundary
      const y = -L * (0.1 + rng() * 0.8), x = (rng() - 0.5) * W * 1.6;
      g += `<circle cx="${x}" cy="${y}" r="${W * (0.02 + rng() * 0.05)}" fill="${c}" opacity=".8"/>`;
    }
  }
  return g + '</g>';
}

/* ---------- one leaf ---------- */
function drawLeaf(leaf, sp, opts) {
  const rng = mulberry32(leaf.seed);
  const uid = opts.uid + '_' + leaf.n;
  const L = leaf.len;
  const shape = leafOutline(sp, L, rng, leaf.fen || 0);
  const d = shape.d + shape.parts, W = shape.W * (leaf.wide || 1), spec = shape.spec;
  const clipId = `c${uid}`;
  const gradId = `g${uid}`;
  const maskId = `k${uid}`;
  const pal = leaf.pal || sp.pal;

  /* Splits and windows are cut with a MASK, not a fill rule: an even-odd hole that
     crosses the leaf margin would paint the part of itself that lies outside the
     blade, which drew slits as bars sticking out into thin air. */
  const holed = !!shape.holes;
  let defs = `<clipPath id="${clipId}"><path d="${d}"/></clipPath>`
    + `<linearGradient id="${gradId}" x1="0" y1="1" x2="0.4" y2="0">`
    + `<stop offset="0" stop-color="${pal.dark}"/><stop offset=".55" stop-color="${pal.base}"/>`
    + `<stop offset="1" stop-color="${pal.light}"/></linearGradient>`;
  if (holed) {
    defs += `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-W * 3}" y="${-L * 1.25}" width="${W * 6}" height="${L * 1.5}">`
      + `<path d="${d}" fill="#fff"/><path d="${shape.holes}" fill="#000"/></mask>`;
  }

  let body = `<path d="${shape.parts}" fill="url(#${gradId})"/>`
    + `<path d="${shape.d}" fill="url(#${gradId})" stroke="${pal.dark}" stroke-width="${L * 0.012}" stroke-opacity=".5"/>`;
  body += `<g clip-path="url(#${clipId})">${veins(spec, L, W, pal.vein, rng)}</g>`;
  const mk = marks(spec, L, W, mulberry32(leaf.seed + 3));
  if (mk) body += `<g clip-path="url(#${clipId})">${mk}</g>`;
  if (leaf.varieg && leaf.varieg !== 'none') body += varieg(leaf.varieg, L, W, rng, clipId);

  /* shading finish */
  switch (leaf.shading) {
    case 'glossy':
      body += `<g clip-path="url(#${clipId})"><ellipse cx="${-W * 0.35}" cy="${-L * 0.62}" rx="${W * 0.34}" ry="${L * 0.22}" fill="#fff" opacity=".22" transform="rotate(-25 ${-W * 0.35} ${-L * 0.62})"/></g>`;
      break;
    case 'velvet':
      defs += `<radialGradient id="v${uid}" cx=".5" cy=".45" r=".62"><stop offset=".3" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>`;
      body += `<g clip-path="url(#${clipId})"><rect x="${-W * 1.4}" y="${-L * 1.05}" width="${W * 2.8}" height="${L * 1.1}" fill="url(#v${uid})"/></g>`;
      break;
    case 'silver':
      body += `<g clip-path="url(#${clipId})" opacity=".3">${veins(spec, L * 0.96, W, '#eaf6ff', mulberry32(leaf.seed + 7))}</g>`;
      break;
    case 'blush':
      body += `<g clip-path="url(#${clipId})"><ellipse cx="0" cy="${-L * 0.5}" rx="${W * 1.5}" ry="${L * 0.6}" fill="none" stroke="#ff9ec4" stroke-width="${L * 0.14}" opacity=".28"/></g>`;
      break;
    case 'iridescent':
      defs += `<linearGradient id="i${uid}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7fe3ff" stop-opacity=".3"/><stop offset=".5" stop-color="#c9a0ff" stop-opacity=".22"/><stop offset="1" stop-color="#ffd6a0" stop-opacity=".3"/></linearGradient>`;
      body += `<g clip-path="url(#${clipId})"><rect x="${-W * 1.4}" y="${-L * 1.05}" width="${W * 2.8}" height="${L * 1.1}" fill="url(#i${uid})"/></g>`;
      break;
    case 'frost':
      body += `<g clip-path="url(#${clipId})">` +
        Array.from({ length: 22 }, () => {
          const x = (rng() - 0.5) * W * 1.8, y = -L * rng();
          return `<circle cx="${x}" cy="${y}" r="${W * 0.03}" fill="#fff" opacity=".55"/>`;
        }).join('') + `</g>`;
      break;
  }

  /* light-path tint */
  const tint = { sun: ['#ffd35e', .16], shade: ['#06301f', .22], cabinet: ['#6ff0c0', .14] }[leaf.path];
  if (tint) body += `<g clip-path="url(#${clipId})"><rect x="${-W * 1.4}" y="${-L * 1.05}" width="${W * 2.8}" height="${L * 1.1}" fill="${tint[0]}" opacity="${tint[1]}"/></g>`;

  /* ill health browns the leaf from the edges in */
  if (leaf.sick > 0) {
    body += `<g clip-path="url(#${clipId})">`
      + `<rect x="${-W * 1.4}" y="${-L * 1.05}" width="${W * 2.8}" height="${L * 1.1}" fill="#a8752a" opacity="${(leaf.sick * 0.5).toFixed(2)}"/>`
      + `<ellipse cx="0" cy="${-L * 0.5}" rx="${W * 1.15}" ry="${L * 0.62}" fill="none" stroke="#6d4a17"
          stroke-width="${L * 0.16 * leaf.sick}" opacity="${(leaf.sick * 0.75).toFixed(2)}"/></g>`;
  }

  if (holed) body = `<g mask="url(#${maskId})">${body}</g>`;
  return { defs, body, petioleLen: L };
}

/* ---------- pot ---------- */
function drawPot(potId, cx, topY, w, h) {
  const p = POTS_BY_ID[potId] || POTS[0];
  const halfT = w / 2, halfB = w / 2 * 0.72;
  const botY = topY + h;
  return `<g>
    <ellipse cx="${cx}" cy="${botY}" rx="${halfB * 1.05}" ry="${h * 0.11}" fill="#000" opacity=".16"/>
    <path d="M ${cx - halfT} ${topY} L ${cx + halfT} ${topY} L ${cx + halfB} ${botY} Q ${cx} ${botY + h * 0.13} ${cx - halfB} ${botY} Z" fill="${p.fill}"/>
    <path d="M ${cx - halfT} ${topY} L ${cx - halfT + w * 0.16} ${topY} L ${cx - halfB + w * 0.1} ${botY} L ${cx - halfB} ${botY} Z" fill="#fff" opacity=".13"/>
    <ellipse cx="${cx}" cy="${topY}" rx="${halfT}" ry="${w * 0.15}" fill="${p.rim}"/>
    <ellipse cx="${cx}" cy="${topY + w * 0.02}" rx="${halfT * 0.86}" ry="${w * 0.125}" fill="#4a3b2c"/>
    <ellipse cx="${cx}" cy="${topY + w * 0.01}" rx="${halfT * 0.86}" ry="${w * 0.125}" fill="#2f2519" opacity=".55"/>
  </g>`;
}

/* ---------- whole plant ---------- */
function renderPlant(plant, opt = {}) {
  const sp = SPECIES_BY_ID[plant.speciesId];
  const uid = 'p' + (plant.id || 0) + (opt.tag || '');
  const W = 260, H = 300;
  const cx = 130;
  const potW = 74 + (POTS_BY_ID[plant.potId]?.size || 1) * 7;
  const leaves = plant.leaves || [];
  const trailing = sp.tags.includes('trailing');
  /* trailers hang, so their pot sits high and the frame fills downward */
  const potTop = (trailing || sp.shape === 'pearls') ? 118 : 208, potH = 62;
  const health = plant.health === undefined ? 100 : plant.health;
  const sick = health < 55 ? Math.min(1, (55 - health) / 55) : 0;
  const droop = Math.min(1, (plant.water < 25 ? (25 - plant.water) / 25 : 0) + sick * 0.85);

  let defs = '', art = '', front = '';   // `front` draws over the pot (draping strands)

  /* stem / strands */
  /* cacti and living stones cluster on the soil instead of climbing a stem */
  const squat = ['globe', 'lithops', 'pad', 'column', 'starcactus', 'rosette'].includes(sp.shape);
  const stemH = squat ? 26 : Math.min(150, 34 + leaves.length * 9) * (plant.moss ? 1.2 : 1);
  const baseY = potTop + 4;

  if (!trailing && sp.shape !== 'pearls' && !squat) {
    art += `<path d="M ${cx} ${baseY} C ${cx - 6} ${baseY - stemH * 0.5}, ${cx + 5} ${baseY - stemH * 0.8}, ${cx} ${baseY - stemH}"
      stroke="${sp.pal.dark}" stroke-width="${5 + leaves.length * 0.18}" fill="none" stroke-linecap="round"/>`;
    if (plant.moss) art += `<rect x="${cx - 7}" y="${baseY - stemH - 12}" width="14" height="${stemH + 14}" rx="6" fill="#6b5a3e" opacity=".85"/>
      <rect x="${cx - 7}" y="${baseY - stemH - 12}" width="5" height="${stemH + 14}" rx="3" fill="#fff" opacity=".08"/>`;
  }

  /* leaves, oldest first so new growth sits on top */
  const n = Math.max(leaves.length, 1);
  leaves.forEach((leaf, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const side = i % 2 === 0 ? -1 : 1;
    const rng = mulberry32(leaf.seed + 991);
    let x, y, rot;

    const drapes = trailing || sp.shape === 'pearls';
    if (drapes) {
      /* four strands spill over the rim — two per side, so the pot stays visible */
      const offs = [-0.62, -0.3, 0.3, 0.62];
      const strand = i % 4, row = Math.floor(i / 4);
      const dir = offs[strand] < 0 ? -1 : 1;
      const sx = cx + offs[strand] * potW;
      x = sx + dir * (5 + row * 8) + (rng() - 0.5) * 6;
      y = potTop + 4 + row * 30;
      rot = dir * (14 + row * 5) + 178 + (rng() - 0.5) * 22;
      front += `<path d="M ${sx} ${potTop - 6} Q ${sx + dir * 10} ${y - 18} ${x} ${y}" stroke="${sp.pal.dark}" stroke-width="2.2" fill="none" opacity=".85" stroke-linecap="round"/>`;
    } else if (squat) {
      const col = i % 3, row = Math.floor(i / 3);
      x = cx + (col - 1) * (26 - row * 4) + (rng() - 0.5) * 8;
      y = baseY - 2 - row * 9;
      rot = (col - 1) * 9 + (rng() - 0.5) * 10;
    } else {
      x = cx + side * (4 + t * 5);
      y = baseY - stemH * (0.12 + t * 0.86);
      rot = side * (74 - t * 30) + (rng() - 0.5) * 12;
      rot += side * droop * 34;                    // thirsty leaves flop outward
    }

    const grown = leaf.unfurl === undefined ? 1 : Math.min(1, leaf.unfurl);
    const scale = (0.55 + 0.45 * grown);
    const L = leaf.len * (drapes ? 0.8 : 1.28);
    const piece = drawLeaf({ ...leaf, len: L, path: plant.path, shading: plant.shading, n: i, sick, pal: plant.pal || leaf.pal }, sp,
      { uid });
    defs += piece.defs;
    const g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})" opacity="${0.35 + 0.65 * grown}">`
      + `<path d="M 0 0 L 0 ${-L * 0.1}" stroke="${sp.pal.dark}" stroke-width="${L * 0.05}" stroke-linecap="round"/>`
      + piece.body + `</g>`;
    if (drapes) front += g; else art += g;
  });

  /* an unfurling cigar for the leaf currently in progress */
  if (plant.growth > 0.45 && leaves.length < sp.maxLeaves && !trailing && sp.shape !== 'pearls') {
    const y = baseY - stemH - 4;
    art += `<g transform="translate(${cx + 3} ${y}) rotate(12)">
      <path d="M 0 0 C 6 -8, 6 -20, 0 -26 C -6 -20, -6 -8, 0 0 Z" fill="${sp.pal.light}" opacity=".95"/>
      <path d="M 0 -2 C 3 -9, 3 -18, 0 -24" stroke="${sp.pal.dark}" stroke-width="1.2" fill="none" opacity=".6"/></g>`;
  }

  /* flowering species bloom once they're grown and healthy */
  if (sp.tags.includes('flowers') && leaves.length >= sp.maxLeaves * 0.55 && health > 60) {
    const r3 = mulberry32((plant.id || 1) * 77 + leaves.length);
    const petal = sp.id === 'orchid' ? '#f6e9f7' : '#ffd9e4', heart = sp.id === 'orchid' ? '#c86fb0' : '#e0729f';
    const bx = trailing ? cx : cx + 16, by = trailing ? potTop + 34 : baseY - stemH - 10;
    for (let i = 0; i < 3; i++) {
      const fx = bx + (r3() - 0.5) * 46, fy = by + (r3() - 0.5) * 34;
      let f = '';
      for (let k = 0; k < 5; k++) {
        f += `<ellipse cx="0" cy="-7" rx="4.4" ry="7.6" fill="${petal}" transform="rotate(${k * 72})"/>`;
      }
      art += `<g transform="translate(${fx} ${fy})">${f}<circle r="3.1" fill="${heart}"/></g>`;
    }
  }

  art += drawPot(plant.potId, cx, potTop, potW, potH) + front;

  if (plant.pests) {
    const r2 = mulberry32(plant.id * 31 + 5);
    for (let i = 0; i < 8; i++) {
      art += `<circle cx="${cx - 60 + r2() * 120}" cy="${baseY - stemH * r2()}" r="2" fill="#d94f4f" opacity=".9"/>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="plant-svg" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${art}</svg>`;
}

/* ---------- Sabrina ---------- */
let _sabN = 0;
function renderSabrina(mood = 'happy') {
  const u = 's' + (++_sabN);   // unique gradient ids — two portraits can share a page
  const eyes = mood === 'excited'
    ? `<path d="M 78 96 q 7 -9 14 0" stroke="#2b4c73" stroke-width="3.4" fill="none" stroke-linecap="round"/>
       <path d="M 108 96 q 7 -9 14 0" stroke="#2b4c73" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    : mood === 'sad'
    ? `<ellipse cx="85" cy="97" rx="6" ry="6.5" fill="#5aa9e6"/><ellipse cx="115" cy="97" rx="6" ry="6.5" fill="#5aa9e6"/>
       <circle cx="83" cy="95" r="2.2" fill="#fff"/><circle cx="113" cy="95" r="2.2" fill="#fff"/>
       <path d="M 74 88 q 10 4 18 2" stroke="#c98a63" stroke-width="2.6" fill="none" stroke-linecap="round"/>
       <path d="M 126 88 q -10 4 -18 2" stroke="#c98a63" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="85" cy="96" rx="7" ry="8" fill="#2b4c73"/><ellipse cx="115" cy="96" rx="7" ry="8" fill="#2b4c73"/>
       <ellipse cx="85" cy="97" rx="5.4" ry="6.2" fill="#5aa9e6"/><ellipse cx="115" cy="97" rx="5.4" ry="6.2" fill="#5aa9e6"/>
       <circle cx="83" cy="94" r="2.4" fill="#fff"/><circle cx="113" cy="94" r="2.4" fill="#fff"/>
       <circle cx="87.5" cy="100" r="1.2" fill="#fff" opacity=".7"/><circle cx="117.5" cy="100" r="1.2" fill="#fff" opacity=".7"/>`;
  const mouth = mood === 'sad'
    ? `<path d="M 93 116 q 7 -5 14 0" stroke="#b5535f" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : mood === 'excited'
    ? `<path d="M 91 111 q 9 12 18 0 z" fill="#b5535f"/><path d="M 94 113 q 6 5 12 0 z" fill="#ff8fa8"/>`
    : `<path d="M 92 112 q 8 7 16 0" stroke="#b5535f" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 200 200" class="sabrina-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hairG${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f0b27a"/><stop offset=".5" stop-color="#d98b5f"/><stop offset="1" stop-color="#b96a45"/>
      </linearGradient>
      <linearGradient id="skinG${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe4d2"/><stop offset="1" stop-color="#f7cdb4"/>
      </linearGradient>
    </defs>
    <path d="M 40 150 q -6 -70 60 -74 q 66 4 60 74 q -10 30 -60 30 q -50 0 -60 -30 z" fill="url(#hairG${u})"/>
    <path d="M 62 172 q 8 -34 38 -34 q 30 0 38 34 q -38 16 -76 0 z" fill="#e8dcc8"/>
    <ellipse cx="100" cy="100" rx="42" ry="46" fill="url(#skinG${u})"/>
    <path d="M 58 84 q 4 -40 42 -42 q 38 2 42 42 q -14 -22 -42 -20 q -28 -2 -42 20 z" fill="url(#hairG${u})"/>
    <path d="M 56 80 q -16 26 -12 62 q -12 -34 4 -66 z" fill="#d98b5f"/>
    <path d="M 144 80 q 16 26 12 62 q 12 -34 -4 -66 z" fill="#d98b5f"/>
    ${eyes}
    <path d="M 76 84 q 9 -5 18 -1" stroke="#c07a4e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M 124 84 q -9 -5 -18 -1" stroke="#c07a4e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="71" cy="108" rx="8" ry="5" fill="#ff9aa8" opacity=".45"/>
    <ellipse cx="129" cy="108" rx="8" ry="5" fill="#ff9aa8" opacity=".45"/>
    ${mouth}
    <g transform="translate(140 62) rotate(18)">
      <path d="M 0 0 C 14 -6, 22 -18, 16 -30 C 4 -26, -2 -12, 0 0 Z" fill="#4f9c5c"/>
      <path d="M 2 -2 C 10 -10, 14 -20, 15 -27" stroke="#2f6b39" stroke-width="1.4" fill="none"/>
    </g>
    <circle cx="60" cy="60" r="5" fill="#ffb3d1"/><circle cx="52" cy="68" r="3.4" fill="#ffd6e6"/>
  </svg>`;
}
