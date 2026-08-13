/* Sabrina's Secret Garden — simulation & state */

const SAVE_KEY = 'sabrina-garden-v1';
const MAX_OFFLINE_H = 12;   // growth is only banked for this long while you're away
const MAX_DECAY_H = 48;     // ...but thirst and decline keep running, so a long trip can cost you
const MAX_TICKETS = 5;     // arcade plays you can bank
const TICKET_MIN = 25;     // minutes to regenerate one
const WILT_AT = 30;        // health below this = visibly wilting, warning fires
const CRITICAL_H = 18;     // hours a plant can sit at zero health before it dies —
                           // long enough that one daily check-in always saves it

let S = null;                    // the whole save
const listeners = [];
const onChange = fn => listeners.push(fn);
const emit = () => listeners.forEach(f => f());

/* ---------- helpers ---------- */
const rnd = (a = 1, b = 0) => b + Math.random() * (a - b);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => Date.now();
const rarityOrder = r => RARITY[r].order;
const orderToRarity = o => Object.keys(RARITY).find(k => RARITY[k].order === clamp(o, 0, 5));
const isDaylight = () => { const h = new Date().getHours(); return h >= 6 && h < 19; };

function effectiveRarity(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const bv = bestVarOf(p);
  /* a species that is *defined* by its variegation already prices that in —
     only a surprise sector earns the bump */
  const bump = sp.forceVar === bv ? 0 : (VARIEG[bv]?.rarityBump || 0);
  return orderToRarity(rarityOrder(sp.rarity) + bump + (p.hybrid ? 1 : 0));
}
function bestVarOf(p) {
  let best = 'none', bo = -1;
  (p.leaves || []).forEach(l => {
    const b = VARIEG[l.varieg]?.rarityBump ?? -1;
    if (b > bo) { bo = b; best = l.varieg; }
  });
  return best;
}
function plantName(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const bv = bestVarOf(p);
  const v = VARIEG[bv];
  const base = p.hybridName || sp.name;
  /* don't say "Albo Monstera Albo" — skip the prefix when the name already carries it */
  const redundant = !v || !v.name || sp.forceVar === bv ||
    base.toLowerCase().includes(v.name.toLowerCase());
  return redundant ? base : `${v.name} ${base}`;
}
function plantValue(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const er = effectiveRarity(p);
  const mult = RARITY[er].mult / RARITY[sp.rarity].mult;
  const pot = POTS_BY_ID[p.potId]?.growth || 1;
  return Math.round(sp.value * mult * (1 + p.leaves.length * 0.14) * pot * (0.55 + p.health / 220) * (p.hybrid ? 1.6 : 1));
}
function stageOf(p) {
  let s = 0;
  for (let i = 0; i < STAGE_AT.length; i++) if (p.leaves.length >= STAGE_AT[i]) s = i;
  return s;
}
const cosiness = () => DECOR.reduce((a, d) => a + (d.buff === 'joy' ? (S.decor[d.id] || 0) * d.val : 0), 0);
const ZONE_IDS = ['sun', 'bright', 'shade', 'cabinet'];
function slotCap() {
  const base = { sun: 3, bright: 6, shade: 3, cabinet: 0 };
  base.bright += (S.decor.shelf || 0) * 2 + (S.decor.ladder || 0) * 3 + (S.inv.lamp || 0);
  base.sun += (S.decor.window || 0) * 2;
  base.shade += (S.decor.stand || 0) * 2 + ((S.decor.bench || 0) > 0 ? 1 : 0);
  base.cabinet += (S.decor.cabinet || 0) * 4;
  return base;
}
const zoneUsed = z => S.plants.filter(p => p.zone === z).length;
const freeZone = z => zoneUsed(z) < slotCap()[z];
const anyFreeSlot = () => ['bright', 'sun', 'shade', 'cabinet'].find(freeZone);
const totalSlots = () => ZONE_IDS.reduce((a, z) => a + slotCap()[z], 0);
const labCap = () => 3 + (S.decor.bench || 0) * 1;

/* ---------- new plant / leaf ---------- */
function makeLeaf(p, n) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const t = clamp(n / sp.maxLeaves, 0, 1);
  const potSize = POTS_BY_ID[p.potId]?.size || 1;
  let len = 44 + t * 34 + potSize * 4 + (p.moss ? 8 : 0);
  if (p.path === 'sun') len *= 0.9;
  if (p.path === 'shade') len *= 1.1;
  len *= 0.85 + p.health / 400;
  let fen = 0;
  if (sp.shape === 'fenestrated') {
    fen = clamp(0.1 + n * 0.085 + (p.path === 'shade' ? 0.22 : 0) + rnd(0.1), 0, 1);
  }
  return { seed: Math.floor(rnd(1e9)), len: Math.round(len), fen: +fen.toFixed(2), varieg: rollVarieg(p), unfurl: 0, at: now() };
}

function rollVarieg(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  let chance = sp.varChance + (p.varieg !== 'none' ? 0.55 : 0) + cosiness() * 0.001;
  if (S.dust) chance = 1;                                  // Variegation Dust primed
  if (p.zone === 'bright') chance *= 1.15;                 // best light for stable sectors
  if (Math.random() > chance) return 'none';
  if (sp.forceVar && Math.random() < 0.7) return sp.forceVar;
  if (p.varieg !== 'none' && Math.random() < 0.6) {
    // sectors drift: small chance of upgrading to something rarer
    const order = ['mint', 'albo', 'aurea', 'sport', 'const_', 'pink'];
    const i = order.indexOf(p.varieg);
    if (i >= 0 && Math.random() < 0.14) return order[Math.min(order.length - 1, i + 1)];
    return p.varieg;
  }
  const table = [['mint', 46], ['albo', 25], ['aurea', 15], ['sport', 7], ['const_', 4], ['pink', 3]];
  let r = Math.random() * table.reduce((a, x) => a + x[1], 0);
  for (const [k, w] of table) { r -= w; if (r <= 0) return k; }
  return 'mint';
}

function rollShading() {
  const total = SHADINGS.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * total;
  for (const s of SHADINGS) { r -= s.weight; if (r <= 0) return s.id; }
  return 'matte';
}

function newPlant(speciesId, opts = {}) {
  const sp = SPECIES_BY_ID[speciesId];
  const p = {
    id: S.nextId++,
    speciesId,
    nick: opts.nick || null,
    potId: opts.potId || 'nursery',
    soilId: opts.soilId || 'basic',
    zone: opts.zone || (freeZone(sp.light) ? sp.light : anyFreeSlot() || 'bright'),
    water: 80, food: 70, health: 100, growth: 0,
    leaves: [],
    pathScore: { sun: 0, bright: 0, shade: 0 },
    path: sp.light,
    shading: opts.shading || rollShading(),
    varieg: opts.varieg || 'none',
    pests: false, moss: false, rotated: 0, misted: 0,
    born: now(), lastLeaf: now(),
    pal: opts.pal || null, hybrid: opts.hybrid || false, hybridName: opts.hybridName || null,
  };
  const start = opts.leaves ?? 2;
  for (let i = 0; i < start; i++) {
    const l = makeLeaf(p, i);
    l.unfurl = 1;
    if (opts.varieg && opts.varieg !== 'none' && i === start - 1) l.varieg = opts.varieg;
    p.leaves.push(l);
  }
  S.plants.push(p);
  discover(speciesId);
  return p;
}

function discover(speciesId) {
  if (!S.dex[speciesId]) S.dex[speciesId] = { seen: now(), grown: 0, bestVar: 'none' };
}

/* ---------- growth factors ---------- */
function factorsFor(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const pot = POTS_BY_ID[p.potId] || POTS[0];
  const soil = SOILS_BY_ID[p.soilId] || SOILS[0];

  const w = p.water >= 60 ? 1.0 : p.water >= 30 ? 0.72 : p.water >= 10 ? 0.35 : 0;
  const overWater = p.water > 96 ? 0.85 : 1;
  const f = 0.6 + (p.food / 100) * 0.6;
  /* the cabinet reads as bright light, with its own humidity payoff below */
  const lightOf = z => z === 'cabinet' ? 'bright' : z;
  const zoneMatch = p.zone === sp.light ? 1.18
    : (lightOf(p.zone) === lightOf(sp.light)) ? 1.12
    : (lightOf(p.zone) === 'bright' || lightOf(sp.light) === 'bright') ? 1.0 : 0.68;
  const daylight = p.zone === 'sun' ? (isDaylight() ? 1.12 : 0.8) : 1;
  const needSize = 1 + Math.floor(p.leaves.length / 5);
  const potFit = pot.size >= needSize ? 1 : 0.7;
  const cab = p.zone === 'cabinet' ? (sp.tags.includes('humidity') ? 1.35 : 1.08) : 1;
  const humid = sp.tags.includes('humidity') && (S.decor.mister || S.inv.mister) ? 1.15 : 1;
  const cloche = pot.humid && sp.tags.includes('humidity') ? 1.2 : 1;
  const mossB = p.moss ? 1.25 : 1;
  const health = 0.5 + p.health / 200;
  const cosy = 1 + cosiness() * 0.006;
  const rotate = p.rotated > now() ? 1.1 : 1;
  const mist = p.misted > now() ? 1.08 : 1;
  const pests = p.pests ? 0.55 : 1;

  return {
    total: w * overWater * f * zoneMatch * daylight * potFit * pot.growth * soil.growth *
      cab * humid * cloche * mossB * health * cosy * rotate * mist * pests,
    w, f, zoneMatch, potFit, pests,
  };
}

function secondsPerLeaf(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const fac = factorsFor(p).total;
  if (fac <= 0) return Infinity;
  const young = p.leaves.length < 3 ? 0.45 : 1;    // early leaves come fast, to hook you
  return (420 * young * (1 + p.leaves.length * 0.45)) / (sp.vigor * fac);
}

/* ---------- the tick ---------- */
function tick(dt, silent = false, noGrowth = false) {   // dt in seconds
  const min = dt / 60;
  S.plants.forEach(p => {
    const sp = SPECIES_BY_ID[p.speciesId];
    const pot = POTS_BY_ID[p.potId] || POTS[0];
    const soil = SOILS_BY_ID[p.soilId] || SOILS[0];
    const dryMult = p.zone === 'sun' ? 1.35 : p.zone === 'shade' ? 0.75 : 1;

    /* thirst/hunger are tuned per 10 min so a full pot lasts most of a day —
       this is a check-in-twice game, not a babysitting game */
    p.water = clamp(p.water - sp.thirst * pot.drain * soil.drain * dryMult * min * 0.1 * (p.globes ? 0.5 : 1), 0, 100);
    p.food = clamp(p.food - sp.hunger * 0.1 * min, 0, 100);

    /* health */
    let dh = 0;
    if (p.water < 6) dh -= 0.22;
    else if (p.water > 97 && soil.rot > 0.7) dh -= 0.5 * soil.rot;
    else if (p.water > 35 && p.food > 15) dh += 0.5;
    if (p.zone === 'sun' && sp.light === 'shade') dh -= 0.35;
    if (p.pests) dh -= 0.25;
    if (p.zone === 'cabinet' && sp.tags.includes('cactus')) dh -= 0.4;   // wet air rots a cactus
    p.health = clamp(p.health + dh * min, S.gentle ? 6 : 0, 100);

    /* wilting warning, then a countdown to death once health bottoms out */
    if (p.health < WILT_AT && !p.warned) {
      p.warned = true;
      if (!silent) pushAlert('wilt', p.id, `${plantName(p)} is wilting badly.`);
    }
    if (p.health > WILT_AT + 12) p.warned = false;

    if (p.health <= 0) {
      if (!p.critSince) {
        p.critSince = now();
        if (!silent) pushAlert('critical', p.id, `${plantName(p)} is dying — ${CRITICAL_H}h to save it.`);
      }
      p.critLeft = clamp((p.critLeft === undefined ? CRITICAL_H * 3600 : p.critLeft) - dt, 0, CRITICAL_H * 3600);
      if (p.critLeft <= 0 && !S.gentle) { killPlant(p, silent); return; }
    } else if (p.critSince) {
      p.critSince = null; p.critLeft = undefined;
    }

    /* light path memory — where it has spent its life shapes the form */
    p.pathScore[p.zone] = (p.pathScore[p.zone] || 0) + min;
    const dom = Object.keys(p.pathScore).reduce((a, b) => p.pathScore[a] >= p.pathScore[b] ? a : b);
    p.path = dom;

    /* pests */
    /* ~1 outbreak per 20h per plant, doubled on a struggling one */
    if (!p.pests && Math.random() < 0.0008 * min * (p.health < 60 ? 2 : 1)) {
      p.pests = true;
      if (!silent) pushAlert('pest', p.id, `${plantName(p)} has thrips!`);
    }

    /* unfurl animation for the newest leaves */
    p.leaves.forEach(l => { if (l.unfurl < 1) l.unfurl = clamp(l.unfurl + dt / 45, 0, 1); });

    /* growth */
    if (!noGrowth && p.leaves.length < sp.maxLeaves) {
      const spl = secondsPerLeaf(p);
      if (isFinite(spl)) p.growth += dt / spl;
      while (p.growth >= 1 && p.leaves.length < sp.maxLeaves) {
        p.growth -= 1;
        growLeaf(p, silent);
      }
    } else p.growth = 0;
  });

  regenTickets();
  if (stallCount()) S.stall = clamp((S.stall || 0) + stallRate() * (dt / 3600), 0, stallCap());

  /* propagation station */
  S.lab.forEach(c => {
    if (c.rooted) return;
    const speed = c.hormone ? 1.6 : 1;
    c.progress = clamp(c.progress + (dt / 420) * speed, 0, 1);
    if (c.progress >= 1) {
      c.rooted = true;
      S.stats.rooted++;
      bumpQuest('root', 1);
      if (!silent) pushAlert('root', null, `A ${c.name} cutting has rooted!`);
      checkAch();
    }
  });
}

function growLeaf(p, silent) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const leaf = makeLeaf(p, p.leaves.length);
  p.leaves.push(leaf);
  p.lastLeaf = now();
  S.stats.leaves++;
  if (S.dust) S.dust = false;
  if (leaf.varieg !== 'none' && p.varieg === 'none') p.varieg = leaf.varieg;
  const d = S.dex[p.speciesId]; if (d) {
    d.grown++;
    if ((VARIEG[leaf.varieg]?.rarityBump || 0) > (VARIEG[d.bestVar]?.rarityBump || 0)) d.bestVar = leaf.varieg;
  }
  addXP(12 + (VARIEG[leaf.varieg]?.rarityBump || 0) * 15);
  bumpQuest('leaf', 1);
  if (!silent) {
    const rare = leaf.varieg !== 'none';
    pushAlert(rare ? 'rare' : 'leaf', p.id,
      rare ? `${plantName(p)} unfurled a ${VARIEG[leaf.varieg].name} leaf!` : `${plantName(p)} unfurled a new leaf!`);
  }
  checkAch();
}

function killPlant(p, silent) {
  S.plants = S.plants.filter(x => x.id !== p.id);
  if (!S.memorial) S.memorial = [];
  S.memorial.unshift({
    name: p.nick || plantName(p), species: SPECIES_BY_ID[p.speciesId].name,
    rarity: effectiveRarity(p), leaves: p.leaves.length,
    days: Math.max(1, Math.round((now() - p.born) / 864e5)), at: now(),
  });
  S.memorial = S.memorial.slice(0, 40);
  S.stats.lost = (S.stats.lost || 0) + 1;
  if (!silent) pushAlert('death', null, `${p.nick || plantName(p)} didn't make it.`);
}

/* ---------- arcade tickets ---------- */
function regenTickets() {
  if (S.tickets === undefined) { S.tickets = MAX_TICKETS; S.ticketAt = now(); }
  if (S.tickets >= MAX_TICKETS) { S.ticketAt = now(); return; }
  const per = TICKET_MIN * 60000;
  const gained = Math.floor((now() - (S.ticketAt || now())) / per);
  if (gained > 0) {
    S.tickets = Math.min(MAX_TICKETS, S.tickets + gained);
    S.ticketAt = S.tickets >= MAX_TICKETS ? now() : (S.ticketAt || now()) + gained * per;
  }
}
const ticketETA = () => {
  if (S.tickets >= MAX_TICKETS) return 0;
  return Math.max(0, TICKET_MIN * 60 - (now() - (S.ticketAt || now())) / 1000);
};

/* ---------- plant stall: passive coins from the collection ---------- */
const stallCount = () => S.decor.stall || 0;
function stallRate() {                       // coins per hour
  if (!stallCount()) return 0;
  const worth = S.plants.reduce((a, p) => a + plantValue(p), 0);
  return Math.round(Math.min(worth * 0.02, 260) * stallCount());
}
const stallCap = () => stallRate() * 12;     // fills up after 12h, then idles
function collectStall() {
  const amt = Math.floor(S.stall || 0);
  if (amt < 1) return 0;
  S.coins += amt; S.stall = 0; addXP(Math.round(amt / 12));
  checkAch(); save(); emit(); return amt;
}

/* ---------- alerts ---------- */
function pushAlert(type, plantId, text) {
  S.alerts.unshift({ type, plantId, text, at: now(), seen: false });
  S.alerts = S.alerts.slice(0, 40);
  if (typeof onAlert === 'function') onAlert(type, text, plantId);
}

/* ---------- actions ---------- */
const A = {
  water(p) {
    p.water = 100; p.health = clamp(p.health + 1.5, 0, 100);
    S.stats.watered++; bumpQuest('water', 1); addXP(2); save(); emit(); return true;
  },
  feed(p) {
    if ((S.inv.fertilizer || 0) < 1) return 'You\'re out of fertilizer.';
    S.inv.fertilizer--; p.food = 100; p.growth = clamp(p.growth + 0.08, 0, 0.99);
    bumpQuest('feed', 1); addXP(5); save(); emit(); return true;
  },
  mist(p) {
    if (p.misted > now()) return 'Already misted.';
    p.misted = now() + 15 * 60 * 1000; p.health = clamp(p.health + 1, 0, 100);
    addXP(1); save(); emit(); return true;
  },
  rotate(p) {
    if (p.rotated > now()) return 'Already turned toward the light.';
    p.rotated = now() + 20 * 60 * 1000; addXP(1); save(); emit(); return true;
  },
  revive(p) {
    if ((S.inv.tonic || 0) < 1) return 'You need a Revival Tonic.';
    if (p.health > 45) return 'This one doesn\'t need it.';
    S.inv.tonic--;
    p.health = 55; p.water = 100; p.food = Math.max(p.food, 50);
    p.critSince = null; p.critLeft = undefined; p.warned = false;
    S.stats.revived = (S.stats.revived || 0) + 1;
    addXP(30); checkAch(); save(); emit(); return true;
  },
  treat(p) {
    if (!p.pests) return 'Nothing to treat.';
    if ((S.inv.neem || 0) < 1) return 'You need Neem Spray.';
    S.inv.neem--; p.pests = false; p.health = clamp(p.health + 5, 0, 100);
    addXP(8); save(); emit(); return true;
  },
  move(p, zone) {
    if (p.zone === zone) return 'Already there.';
    if (!freeZone(zone)) return `No free space in the ${ZONES[zone].name}.`;
    p.zone = zone; bumpQuest('move', 1); addXP(3); save(); emit(); return true;
  },
  repot(p, potId, soilId) {
    const pot = POTS_BY_ID[potId], soil = SOILS_BY_ID[soilId];
    const cost = (potId !== p.potId ? pot.price : 0) + (soilId !== p.soilId ? soil.price : 0);
    if (cost > S.coins) return 'Not enough coins.';
    S.coins -= cost; p.potId = potId; p.soilId = soilId;
    p.health = clamp(p.health + 4, 0, 100); p.growth = clamp(p.growth + 0.05, 0, 0.99);
    bumpQuest('pot', 1); addXP(10); save(); emit(); return true;
  },
  addGlobes(p) {
    if (p.globes) return 'Already has globes.';
    if ((S.inv.globes || 0) < 1) return 'You need Watering Globes.';
    S.inv.globes--; p.globes = true; addXP(8); save(); emit(); return true;
  },
  addMoss(p) {
    if (p.moss) return 'Already has a pole.';
    if ((S.inv.moss || 0) < 1) return 'You need a Moss Pole.';
    S.inv.moss--; p.moss = true; addXP(8); save(); emit(); return true;
  },
  cutting(p) {
    if (S.lab.length >= labCap()) return 'The propagation station is full.';
    if (p.leaves.length < 4) return 'Needs at least 4 leaves before you cut a node.';
    const taken = p.leaves.pop();
    const c = {
      id: S.nextId++, speciesId: p.speciesId, name: plantName(p),
      varieg: taken.varieg !== 'none' ? taken.varieg : p.varieg,
      shading: p.shading, pal: p.pal, hybridName: p.hybridName, hybrid: p.hybrid,
      progress: 0, rooted: false, hormone: false, at: now(),
    };
    if ((S.inv.rooting || 0) > 0) { S.inv.rooting--; c.hormone = true; }
    S.lab.push(c);
    bumpQuest('prop', 1); addXP(15); save(); emit(); return true;
  },
  potCutting(c) {
    if (!c.rooted) return 'Not rooted yet.';
    const z = anyFreeSlot();
    if (!z) return 'No free space in the garden — sell or shelve something first.';
    newPlant(c.speciesId, {
      varieg: c.varieg, shading: c.shading, leaves: 1, zone: z,
      pal: c.pal, hybrid: c.hybrid, hybridName: c.hybridName,
    });
    S.lab = S.lab.filter(x => x.id !== c.id);
    addXP(20); save(); emit(); return true;
  },
  graft(a, b) {
    if ((S.inv.graftTape || 0) < 1) return 'You need Graft Tape.';
    if (!a.rooted || !b.rooted) return 'Both cuttings must be rooted first.';
    if (a.id === b.id) return 'Pick two different cuttings.';
    const spA = SPECIES_BY_ID[a.speciesId], spB = SPECIES_BY_ID[b.speciesId];
    S.inv.graftTape--;
    const success = Math.random() < 0.72 + cosiness() * 0.004;
    S.lab = S.lab.filter(x => x.id !== a.id && x.id !== b.id);
    if (!success) { save(); emit(); return 'The graft failed — the union never callused. Both cuttings lost.'; }
    const pal = {
      base: mixHex(spA.pal.base, spB.pal.base), dark: mixHex(spA.pal.dark, spB.pal.dark),
      light: mixHex(spA.pal.light, spB.pal.light), vein: spB.pal.vein,
    };
    const host = rarityOrder(spA.rarity) >= rarityOrder(spB.rarity) ? a : b;
    const other = host === a ? b : a;
    let varieg = (VARIEG[a.varieg]?.rarityBump || 0) >= (VARIEG[b.varieg]?.rarityBump || 0) ? a.varieg : b.varieg;
    const sameSpecies = a.speciesId === b.speciesId;
    /* same-species union is a chimera graft — no new name, but the sectors stabilise
       and can jump a tier, which is exactly why people do it in real life */
    if (sameSpecies && varieg !== 'none') {
      const ladder = ['mint', 'albo', 'aurea', 'sport', 'const_', 'pink'];
      const i = ladder.indexOf(varieg);
      if (i >= 0 && Math.random() < 0.35) varieg = ladder[Math.min(ladder.length - 1, i + 1)];
    }
    const name = sameSpecies
      ? 'Chimera ' + SPECIES_BY_ID[host.speciesId].name
      : SPECIES_BY_ID[host.speciesId].name.split(' ')[0] + '×' + SPECIES_BY_ID[other.speciesId].name.split(' ')[0];
    const z = anyFreeSlot();
    if (!z) { save(); emit(); return 'Graft took, but there is no free slot. Cuttings lost.'; }
    newPlant(host.speciesId, { varieg, shading: rollShading(), leaves: 1, zone: z, pal, hybrid: true, hybridName: name });
    S.stats.grafts++; addXP(60); checkAch(); save(); emit();
    return true;
  },
  sell(p) {
    const v = plantValue(p);
    S.coins += v; S.plants = S.plants.filter(x => x.id !== p.id);
    bumpQuest('sell', 1); addXP(8); save(); emit(); return v;
  },
  buyItem(key, n = 1) {
    const it = ITEMS[key]; const cost = it.price * n;
    if (cost > S.coins) return 'Not enough coins.';
    S.coins -= cost; S.inv[key] = (S.inv[key] || 0) + n;
    if (key === 'glitter') { S.inv.glitter--; S.dust = true; }
    save(); emit(); return true;
  },
  buyDecor(id) {
    const d = DECOR_BY_ID[id];
    const owned = S.decor[id] || 0;
    const cost = Math.round(d.price * Math.pow(1.7, owned));
    if (cost > S.coins) return 'Not enough coins.';
    S.coins -= cost; S.decor[id] = owned + 1; addXP(15); checkAch(); save(); emit(); return true;
  },
  buyPlant(offer) {
    if (offer.price > S.coins) return 'Not enough coins.';
    if (!anyFreeSlot()) return 'No free space in the garden.';
    S.coins -= offer.price;
    newPlant(offer.speciesId, { varieg: offer.varieg, leaves: offer.leaves });
    S.market = S.market.filter(o => o.key !== offer.key);
    addXP(10); checkAch(); save(); emit(); return true;
  },
  photo(p) {
    if ((S.inv.camera || 0) < 1) return 'You need a Polaroid.';
    S.inv.camera--;
    const pay = Math.round(plantValue(p) * 0.22 + p.leaves.length * 6);
    S.coins += pay; addXP(12);
    if (!S.album) S.album = [];
    S.album.unshift({ name: plantName(p), rarity: effectiveRarity(p), leaves: p.leaves.length, at: now() });
    S.album = S.album.slice(0, 30);
    save(); emit(); return pay;
  },
  /* mini-game payout, plus whatever perk the game earned */
  arcadeReward(res) {
    S.coins += res.coins; addXP(res.xp || 0);
    S.stats.arcade = (S.stats.arcade || 0) + 1;
    S.stats.arcadeBest = Math.max(S.stats.arcadeBest || 0, res.coins);
    S.best = S.best || {};
    if ((res.score || 0) > (S.best[res.id] || 0)) S.best[res.id] = res.score;
    S.played = S.played || {};
    S.played[res.id] = true;
    let note = '';
    if (res.perk === 'water') { S.plants.forEach(p => { p.water = 100; }); note = res.perkText; }
    if (res.perk === 'pests') { S.plants.forEach(p => { p.pests = false; }); note = res.perkText; }
    if (res.perk === 'supply') {
      const opts = ['fertilizer', 'neem', 'rooting', 'camera', 'tonic'];
      const k = opts[Math.floor(Math.random() * opts.length)];
      S.inv[k] = (S.inv[k] || 0) + 1;
      note = `Sabrina slipped a free ${ITEMS[k].name} into your bag.`;
    }
    checkAch(); save(); emit();
    return note;
  },
  spendTicket() {
    regenTickets();
    if ((S.tickets || 0) < 1) return false;
    S.tickets--; S.ticketAt = S.ticketAt || now();
    if (S.tickets === MAX_TICKETS - 1) S.ticketAt = now();
    save(); return true;
  },
  rename(p, name) { p.nick = name.slice(0, 22) || null; save(); emit(); },
};

const mixHex = (a, b) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = v => Math.round(v).toString(16).padStart(2, '0');
  return '#' + c((r1 + r2) / 2) + c((g1 + g2) / 2) + c((b1 + b2) / 2);
};

/* ---------- market ---------- */
function rollMarket() {
  const pool = SPECIES.slice();
  const offers = [];
  for (let i = 0; i < 5; i++) {
    // weight toward commons; rare stock is the treat
    const weighted = pool.filter(s => Math.random() < [1, 0.6, 0.32, 0.16, 0.07, 0.03][rarityOrder(s.rarity)]);
    const sp = pick(weighted.length ? weighted : pool);
    const varieg = sp.forceVar && Math.random() < 0.5 ? sp.forceVar : 'none';
    const leaves = 1 + Math.floor(Math.random() * 3);
    const base = sp.value * RARITY[sp.rarity].mult * 0.9;
    offers.push({
      key: 'm' + i + '_' + now() + Math.floor(rnd(999)),
      speciesId: sp.id, varieg, leaves,
      /* only a *surprise* sector costs extra — a species that is always variegated
         already carries that in its base value */
      price: Math.round(base * (0.8 + leaves * 0.15) * (varieg !== 'none' && sp.forceVar !== varieg ? 1.8 : 1)),
    });
  }
  S.market = offers;
}

/* ---------- quests, xp, achievements ---------- */
function addXP(n) {
  S.xp += n;
  while (S.xp >= levelCost(S.level)) { S.xp -= levelCost(S.level); S.level++; S.gems += 1; pushAlert('level', null, `Level ${S.level}! +1 gem.`); }
}
const levelCost = lv => Math.round(120 * Math.pow(1.25, lv - 1));

function bumpQuest(type, n) {
  S.quests.forEach(q => { if (q.type === type && !q.claimed) q.prog = Math.min(q.goal, q.prog + n); });
}
function claimQuest(q) {
  if (q.prog < q.goal || q.claimed) return false;
  q.claimed = true; S.coins += q.coins; addXP(q.xp);
  if (S.quests.every(x => x.claimed)) { S.gems += 2; pushAlert('level', null, 'All dailies done — +2 gems!'); }
  save(); emit(); return true;
}
function rollQuests() {
  const shuffled = QUEST_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  S.quests = shuffled.map(q => ({ ...q, prog: 0, claimed: false }));
}

function checkAch() {
  const give = (id) => { if (!S.ach[id]) { S.ach[id] = now(); const a = ACHIEVEMENTS.find(x => x.id === id); S.gems += a.gems; pushAlert('ach', null, `Achievement: ${a.name} (+${a.gems}💎)`); } };
  if (S.stats.leaves >= 1) give('first');
  if (S.stats.leaves >= 10) give('ten');
  if (S.stats.leaves >= 50) give('fifty');
  if (S.plants.some(p => bestVarOf(p) !== 'none')) give('varieg');
  if (S.plants.some(p => bestVarOf(p) === 'sport')) give('halfmoon');
  if (S.stats.rooted >= 5) give('propper');
  if (S.stats.grafts >= 1) give('grafter');
  if (Object.keys(S.dex).length >= 10) give('dex10');
  if (Object.keys(S.dex).length >= SPECIES.length) give('dexall');
  if (S.plants.some(p => rarityOrder(effectiveRarity(p)) >= 4)) give('grail');
  if (S.coins >= 5000) give('rich');
  if (cosiness() >= 20) give('cosy');
  if (S.plants.length >= 20) give('jungle');
  if ((S.decor.cabinet || 0) > 0) give('cabinet');
  if ((S.stats.revived || 0) >= 1) give('medic');
  if (S.stats.leaves >= 30 && !(S.stats.lost || 0)) give('nurse');
  if (S.played && Object.keys(S.played).length >= 3) give('arcade');
  if ((S.stats.arcadeBest || 0) >= 400) give('hustler');
  if (stallCount() > 0) give('shopkeep');
}

/* ---------- daily ---------- */
const dayStamp = () => new Date().toISOString().slice(0, 10);
function checkDaily() {
  const d = dayStamp();
  if (S.lastDay === d) return null;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.streak = S.lastDay === yesterday ? S.streak + 1 : 1;
  S.lastDay = d;
  rollQuests(); rollMarket();
  const reward = 80 + S.streak * 25;
  S.coins += reward;
  S.inv.fertilizer = (S.inv.fertilizer || 0) + 1;
  if (S.streak % 7 === 0) S.gems += 3;
  return { reward, streak: S.streak };
}

/* ---------- save / load ---------- */
function blankSave() {
  const s = {
    v: 1, coins: 250, gems: 2, xp: 0, level: 1,
    plants: [], lab: [], nextId: 1,
    inv: { fertilizer: 3, neem: 1, rooting: 1 },
    decor: {}, dex: {}, market: [], alerts: [], memorial: [],
    quests: [], ach: {}, best: {}, played: {}, tickets: MAX_TICKETS, ticketAt: now(), stall: 0,
    stats: { leaves: 0, rooted: 0, grafts: 0, watered: 0, lost: 0, revived: 0, arcade: 0, arcadeBest: 0 },
    lastTick: now(), lastDay: null, streak: 0, dust: false,
    sound: true, music: true, sfxVol: 80, musVol: 45, intro: false, gentle: true,
    gardener: '', visited: {},
  };
  return s;
}
/* every save goes to localStorage *and* IndexedDB via STORE, so losing one
   store doesn't lose the garden */
function save() {
  S.lastTick = now();
  S.savedAt = now();
  return STORE.write(JSON.stringify(S));
}

function load(raw) {
  if (raw) {
    try { S = JSON.parse(raw); } catch (e) { S = null; }
  }
  if (!S || !S.plants) {
    S = blankSave();
    newPlant('monstera', { nick: 'Mo', zone: 'bright', leaves: 2 });
    rollQuests(); rollMarket();
    S.lastDay = dayStamp();
    save();
    return { fresh: true };
  }
  /* offline catch-up */
  if (!S.memorial) S.memorial = [];                       // migrate older saves
  const away = clamp((now() - (S.lastTick || now())) / 1000, 0, MAX_DECAY_H * 3600);
  const before = { leaves: S.stats.leaves, rooted: S.stats.rooted, lost: S.stats.lost || 0 };
  /* first stretch grows as normal; anything past the growth cap only decays */
  const growPart = Math.min(away, MAX_OFFLINE_H * 3600);
  for (let r = growPart; r > 0; r -= 60) tick(Math.min(60, r), true);
  for (let r = away - growPart; r > 0; r -= 60) tick(Math.min(60, r), true, true);
  const dt = away;
  S.lastTick = now();
  return {
    fresh: false, away: dt,
    gained: S.stats.leaves - before.leaves,
    rooted: S.stats.rooted - before.rooted,
    lost: (S.stats.lost || 0) - before.lost,
  };
}
function hardReset() { STORE.clear(); setTimeout(() => location.reload(), 120); }
