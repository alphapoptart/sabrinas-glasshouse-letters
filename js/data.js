/* Sabrina's Secret Garden — static game data */

const RARITY = {
  common:    { name: 'Common',    color: '#8fbf7f', order: 0, mult: 1.0 },
  uncommon:  { name: 'Uncommon',  color: '#5bbfa8', order: 1, mult: 1.6 },
  rare:      { name: 'Rare',      color: '#5aa9e6', order: 2, mult: 2.8 },
  epic:      { name: 'Epic',      color: '#b083e0', order: 3, mult: 5.0 },
  legendary: { name: 'Legendary', color: '#f0a63c', order: 4, mult: 9.0 },
  mythic:    { name: 'Mythic',    color: '#ff7fb0', order: 5, mult: 16.0 },
};

/* light zones — where a plant lives decides how it grows */
const ZONES = {
  sun:     { name: 'Sun Window',   icon: '☀️', desc: 'Hot & bright. Fast growth, thirsty, can scorch.' },
  bright:  { name: 'Bright Shelf', icon: '⛅', desc: 'Bright indirect. The all-rounder.' },
  shade:   { name: 'Shady Nook',   icon: '🌙', desc: 'Low light. Slow, but deep colour & big fenestration.' },
  cabinet: { name: 'Greenhouse Cabinet', icon: '🌫️', desc: 'Bright and soaking wet. Humidity lovers go feral in here.' },
};

/* grow paths — earned by where a plant spends its life */
const PATHS = {
  sun:    { id: 'sun',    name: 'Sun-Kissed', tint: '#c9d96b', desc: 'Compact, bronzed, sun-hardened leaves.', badge: '☀' },
  bright: { id: 'bright', name: 'Classic',    tint: null,      desc: 'Textbook form. Big, even, healthy leaves.', badge: '⛅' },
  shade:  { id: 'shade',  name: 'Moonlit',    tint: '#2f6b52', desc: 'Deep green, elongated, heavily fenestrated.', badge: '🌙' },
  cabinet:{ id: 'cabinet',name: 'Hothouse',   tint: '#9fe8c8', desc: 'Fat, glossy, humidity-swollen leaves.', badge: '🌫' },
};

/* leaf shading styles rolled per plant — cosmetic variety layer */
const SHADINGS = [
  { id: 'matte',    name: 'Matte',        weight: 30 },
  { id: 'glossy',   name: 'Glossy',       weight: 24 },
  { id: 'velvet',   name: 'Velvet',       weight: 16 },
  { id: 'silver',   name: 'Silver-Wash',  weight: 12 },
  { id: 'blush',    name: 'Blush',        weight: 9 },
  { id: 'iridescent', name: 'Iridescent', weight: 6 },
  { id: 'frost',    name: 'Frosted',      weight: 3 },
];

/* variegation types — the collector chase */
const VARIEG = {
  none:   { id: 'none',   name: '',            rarityBump: 0, color: null },
  mint:   { id: 'mint',   name: 'Mint',        rarityBump: 1, color: '#d8f3c8' },
  albo:   { id: 'albo',   name: 'Albo',        rarityBump: 2, color: '#ffffff' },
  aurea:  { id: 'aurea',  name: 'Aurea',       rarityBump: 2, color: '#ffe066' },
  sport:  { id: 'sport',  name: 'Half-Moon',   rarityBump: 3, color: '#fdfdf5' },
  const_: { id: 'const_', name: 'Constellation', rarityBump: 3, color: '#fff6c9' },
  pink:   { id: 'pink',   name: 'Pink',        rarityBump: 4, color: '#ffb3d1' },
};

/* ---- species ---- */
const SPECIES = [
  {
    id: 'monstera', name: 'Monstera', latin: 'Monstera deliciosa', rarity: 'common',
    shape: 'fenestrated', pal: { base: '#3f8f4f', dark: '#2c6b39', light: '#63b168', vein: '#2a5c33' },
    thirst: 2.4, hunger: 0.9, light: 'bright', vigor: 1.0, maxLeaves: 14, value: 40,
    varChance: 0.04, tags: ['fenestrates', 'climber'],
    blurb: 'Sabrina\'s first love. Every new leaf splits a little more than the last.',
  },
  {
    id: 'adansonii', name: 'Swiss Cheese', latin: 'Monstera adansonii', rarity: 'uncommon',
    shape: 'fenestrated', pal: { base: '#3a8a58', dark: '#276340', light: '#5fb37c', vein: '#245439' },
    thirst: 3.0, hunger: 1.0, light: 'bright', vigor: 1.15, maxLeaves: 18, value: 70,
    varChance: 0.05, tags: ['fenestrates', 'trailing'],
    blurb: 'Holes from day one. Trails beautifully off a high shelf.',
  },
  {
    id: 'thai', name: 'Thai Constellation', latin: 'Monstera deliciosa "Thai"', rarity: 'mythic',
    shape: 'fenestrated', pal: { base: '#4d9a5c', dark: '#337140', light: '#7cc283', vein: '#2f6338' },
    thirst: 2.2, hunger: 1.3, light: 'bright', vigor: 0.72, maxLeaves: 12, value: 900,
    varChance: 0.95, forceVar: 'const_', tags: ['fenestrates', 'variegated', 'grail'],
    blurb: 'Star-flecked and impossibly slow. The one she\'d save from a fire.',
  },
  {
    id: 'albo', name: 'Monstera Albo', latin: 'M. deliciosa "Albo-Variegata"', rarity: 'legendary',
    shape: 'fenestrated', pal: { base: '#3f8f4f', dark: '#2c6b39', light: '#63b168', vein: '#2a5c33' },
    thirst: 2.4, hunger: 1.2, light: 'bright', vigor: 0.78, maxLeaves: 12, value: 620,
    varChance: 0.9, forceVar: 'albo', tags: ['fenestrates', 'variegated', 'grail'],
    blurb: 'White as paper, sunburns if you look at it wrong. Worth every panic.',
  },
  {
    id: 'pinkprincess', name: 'Pink Princess', latin: 'Philodendron erubescens', rarity: 'epic',
    shape: 'arrow', pal: { base: '#2f6b45', dark: '#1e4a30', light: '#4a8f5f', vein: '#173d27' },
    thirst: 2.6, hunger: 1.1, light: 'bright', vigor: 0.9, maxLeaves: 14, value: 320,
    varChance: 0.8, forceVar: 'pink', tags: ['variegated'],
    blurb: 'Bubblegum splashes on near-black leaves. Sabrina named hers "Duchess".',
  },
  {
    id: 'micans', name: 'Micans', latin: 'Philodendron hederaceum var. micans', rarity: 'uncommon',
    shape: 'heart', pal: { base: '#4a3f6b', dark: '#2f2749', light: '#6f5f96', vein: '#241d3a' },
    thirst: 3.2, hunger: 0.8, light: 'shade', vigor: 1.25, maxLeaves: 22, value: 60,
    varChance: 0.03, tags: ['velvet', 'trailing'],
    blurb: 'Velvet hearts that shift from bronze to purple depending on the light.',
  },
  {
    id: 'gloriosum', name: 'Gloriosum', latin: 'Philodendron gloriosum', rarity: 'rare',
    shape: 'heart', pal: { base: '#2e6f42', dark: '#1d4a2b', light: '#4d9159', vein: '#f0f5e6' },
    thirst: 2.4, hunger: 1.2, light: 'shade', vigor: 0.8, maxLeaves: 10, value: 210,
    varChance: 0.04, tags: ['velvet', 'crawler'],
    blurb: 'Crawls sideways across the soil. White veins like stitched silver.',
  },
  {
    id: 'clarinervium', name: 'Clarinervium', latin: 'Anthurium clarinervium', rarity: 'rare',
    shape: 'heart', pal: { base: '#245c37', dark: '#153b23', light: '#3d8049', vein: '#eaf3dc' },
    thirst: 2.0, hunger: 1.1, light: 'shade', vigor: 0.72, maxLeaves: 9, value: 260,
    varChance: 0.03, tags: ['velvet', 'humidity'],
    blurb: 'Thick velvet hearts with bone-white veining. Hates dry air.',
  },
  {
    id: 'frydek', name: 'Alocasia Frydek', latin: 'Alocasia micholitziana', rarity: 'rare',
    shape: 'arrow', pal: { base: '#1f5c39', dark: '#123821', light: '#357a4a', vein: '#e9f7e2' },
    thirst: 3.4, hunger: 1.3, light: 'bright', vigor: 0.95, maxLeaves: 8, value: 190,
    varChance: 0.06, tags: ['velvet', 'dramatic'],
    blurb: 'Green velvet arrowheads. Drops a leaf every time it grows one — rude.',
  },
  {
    id: 'dragonscale', name: 'Dragon Scale', latin: 'Alocasia baginda', rarity: 'epic',
    shape: 'arrow', pal: { base: '#5c7f6b', dark: '#37503f', light: '#87a893', vein: '#20362a' },
    thirst: 3.0, hunger: 1.4, light: 'shade', vigor: 0.75, maxLeaves: 8, value: 340,
    varChance: 0.05, tags: ['textured', 'humidity'],
    blurb: 'Leaves like hammered metal. Feels prehistoric in your hand.',
  },
  {
    id: 'hoyakerrii', name: 'Sweetheart Hoya', latin: 'Hoya kerrii', rarity: 'common',
    shape: 'round', pal: { base: '#4f8a44', dark: '#37642f', light: '#74ab63', vein: '#2f5828' },
    thirst: 1.2, hunger: 0.5, light: 'sun', vigor: 0.85, maxLeaves: 16, value: 35,
    varChance: 0.08, tags: ['succulent', 'flowers'],
    blurb: 'A single fat heart. Grows on its own sweet schedule.',
  },
  {
    id: 'compacta', name: 'Hindu Rope', latin: 'Hoya carnosa compacta', rarity: 'uncommon',
    shape: 'round', pal: { base: '#54924b', dark: '#3a6a35', light: '#7cb56b', vein: '#325a2c' },
    thirst: 1.3, hunger: 0.6, light: 'sun', vigor: 0.9, maxLeaves: 20, value: 80,
    varChance: 0.12, tags: ['succulent', 'trailing', 'flowers'],
    blurb: 'Curled, crumpled rope of leaves. Blooms sticky star clusters.',
  },
  {
    id: 'whitefusion', name: 'White Fusion', latin: 'Calathea lietzei', rarity: 'rare',
    shape: 'oval', pal: { base: '#3d7d55', dark: '#28573a', light: '#5fa06f', vein: '#f4fbf2' },
    thirst: 4.0, hunger: 0.9, light: 'shade', vigor: 1.0, maxLeaves: 14, value: 150,
    varChance: 0.85, forceVar: 'albo', tags: ['variegated', 'humidity', 'dramatic'],
    blurb: 'Painted white and mint. Will crisp if she forgets it for one day.',
  },
  {
    id: 'syngonium', name: 'Syngonium Albo', latin: 'Syngonium podophyllum', rarity: 'rare',
    shape: 'arrow', pal: { base: '#4c9a5e', dark: '#347240', light: '#71bb7c', vein: '#2c6136' },
    thirst: 3.0, hunger: 0.9, light: 'bright', vigor: 1.3, maxLeaves: 18, value: 130,
    varChance: 0.7, forceVar: 'albo', tags: ['variegated', 'fast'],
    blurb: 'Fast, forgiving, and throws white sectors like confetti.',
  },
  {
    id: 'ruby', name: 'Ficus Ruby', latin: 'Ficus elastica "Ruby"', rarity: 'rare',
    shape: 'paddle', pal: { base: '#3f6b4a', dark: '#28472f', light: '#5f8f61', vein: '#c9375e' },
    thirst: 1.8, hunger: 1.0, light: 'sun', vigor: 0.85, maxLeaves: 12, value: 160,
    varChance: 0.8, forceVar: 'pink', tags: ['variegated', 'tree'],
    blurb: 'Cream, green and hot pink. New leaves unfurl in a red sheath.',
  },
  {
    id: 'maculata', name: 'Polka Dot Begonia', latin: 'Begonia maculata', rarity: 'uncommon',
    shape: 'wing', pal: { base: '#2f6b4a', dark: '#1d4630', light: '#4a8f5f', vein: '#8f2f4a' },
    thirst: 3.6, hunger: 1.0, light: 'bright', vigor: 1.1, maxLeaves: 16, value: 75,
    varChance: 0.06, tags: ['spotted', 'flowers'],
    blurb: 'Silver-dotted angel wings, wine red underneath.',
  },
  {
    id: 'pearls', name: 'String of Pearls', latin: 'Curio rowleyanus', rarity: 'common',
    shape: 'pearls', pal: { base: '#7fb26a', dark: '#5c8a4c', light: '#a3cf8c', vein: '#4a7340' },
    thirst: 1.0, hunger: 0.4, light: 'sun', vigor: 1.0, maxLeaves: 24, value: 30,
    varChance: 0.07, tags: ['succulent', 'trailing'],
    blurb: 'Little green beads on a thread. Rot it once and you\'ll never forget.',
  },
  {
    id: 'raven', name: 'Raven ZZ', latin: 'Zamioculcas zamiifolia "Raven"', rarity: 'uncommon',
    shape: 'frond', pal: { base: '#2a2b33', dark: '#17181d', light: '#464a56', vein: '#101115' },
    thirst: 0.7, hunger: 0.4, light: 'shade', vigor: 0.8, maxLeaves: 12, value: 90,
    varChance: 0.02, tags: ['tough', 'goth'],
    blurb: 'New growth comes out lime green, then goes black as ink.',
  },

  /* ---- aroids, part two ---- */
  {
    id: 'melano', name: 'Melanochrysum', latin: 'Philodendron melanochrysum', rarity: 'epic',
    shape: 'strap', pal: { base: '#25402c', dark: '#14261a', light: '#3d6141', vein: '#c8a94e' },
    thirst: 2.2, hunger: 1.2, light: 'cabinet', vigor: 0.78, maxLeaves: 10, value: 380,
    varChance: 0.04, tags: ['velvet', 'climber', 'humidity'],
    blurb: 'Black velvet that drips down a pole, veined in old gold.',
  },
  {
    id: 'obliqua', name: 'Monstera Obliqua', latin: 'Monstera obliqua "Peru"', rarity: 'mythic',
    shape: 'fenestrated', pal: { base: '#57a55f', dark: '#3a7742', light: '#84c886', vein: '#356b3c' },
    thirst: 3.2, hunger: 1.4, light: 'cabinet', vigor: 0.6, maxLeaves: 9, value: 1400,
    varChance: 0.03, tags: ['fenestrates', 'humidity', 'grail'],
    blurb: 'More hole than leaf. Costs a car and dies if you breathe on it.',
  },
  {
    id: 'queen', name: 'Queen Anthurium', latin: 'Anthurium warocqueanum', rarity: 'legendary',
    shape: 'strap', pal: { base: '#1e4a2c', dark: '#0f2c19', light: '#356b3d', vein: '#e8f2dc' },
    thirst: 2.6, hunger: 1.3, light: 'cabinet', vigor: 0.62, maxLeaves: 8, value: 780,
    varChance: 0.03, tags: ['velvet', 'humidity', 'grail'],
    blurb: 'Leaves longer than your forearm. She is not called the Queen for nothing.',
  },
  {
    id: 'spiritus', name: 'Spiritus Sancti', latin: 'Philodendron spiritus-sancti', rarity: 'mythic',
    shape: 'strap', pal: { base: '#2c6b40', dark: '#194527', light: '#4a8f57', vein: '#1a4526' },
    thirst: 2.0, hunger: 1.5, light: 'cabinet', vigor: 0.5, maxLeaves: 8, value: 2400,
    varChance: 0.02, tags: ['humidity', 'grail'],
    blurb: 'Long ribbons of leaf. Fewer than a hundred exist. Sabrina whispers near it.',
  },
  {
    id: 'aurea', name: 'Monstera Aurea', latin: 'M. deliciosa "Aurea"', rarity: 'mythic',
    shape: 'fenestrated', pal: { base: '#43944f', dark: '#2e6d38', light: '#6dbb70', vein: '#2b5f33' },
    thirst: 2.4, hunger: 1.3, light: 'bright', vigor: 0.68, maxLeaves: 12, value: 1100,
    varChance: 0.92, forceVar: 'aurea', tags: ['fenestrates', 'variegated', 'grail'],
    blurb: 'Egg-yolk yellow sectors instead of white. Somehow even harder to keep.',
  },
  {
    id: 'blackvelvet', name: 'Black Velvet', latin: 'Alocasia reginula', rarity: 'rare',
    shape: 'arrow', pal: { base: '#232228', dark: '#111014', light: '#3d3b45', vein: '#dfe8dc' },
    thirst: 2.8, hunger: 1.2, light: 'cabinet', vigor: 0.7, maxLeaves: 8, value: 230,
    varChance: 0.04, tags: ['velvet', 'humidity', 'goth'],
    blurb: 'Tiny, matte black, silver-veined. A goth pin badge with roots.',
  },
  {
    id: 'tetrasperma', name: 'Mini Monstera', latin: 'Rhaphidophora tetrasperma', rarity: 'uncommon',
    shape: 'fenestrated', pal: { base: '#42945a', dark: '#2c6c3e', light: '#6cbb7c', vein: '#28603a' },
    thirst: 3.0, hunger: 0.9, light: 'bright', vigor: 1.35, maxLeaves: 20, value: 65,
    varChance: 0.05, tags: ['fenestrates', 'climber', 'fast'],
    blurb: 'Not a monstera, not a philodendron. Grows like it has somewhere to be.',
  },

  /* ---- pothos & scindapsus ---- */
  {
    id: 'marble', name: 'Marble Queen', latin: 'Epipremnum aureum "Marble Queen"', rarity: 'common',
    shape: 'heart', pal: { base: '#4f9a55', dark: '#357140', light: '#7cc07e', vein: '#2f6338' },
    thirst: 2.0, hunger: 0.7, light: 'bright', vigor: 1.2, maxLeaves: 22, value: 38,
    varChance: 0.75, forceVar: 'mint', tags: ['variegated', 'trailing', 'tough'],
    blurb: 'Splattered cream and green. Almost impossible to kill, which helps.',
  },
  {
    id: 'neon', name: 'Neon Pothos', latin: 'Epipremnum aureum "Neon"', rarity: 'common',
    shape: 'heart', pal: { base: '#9fd13f', dark: '#7aa82c', light: '#c4e871', vein: '#6d9626' },
    thirst: 2.0, hunger: 0.7, light: 'bright', vigor: 1.25, maxLeaves: 22, value: 34,
    varChance: 0.03, tags: ['trailing', 'tough'],
    blurb: 'Highlighter green. Looks radioactive in a dim room.',
  },
  {
    id: 'exotica', name: 'Scindapsus Exotica', latin: 'Scindapsus pictus "Exotica"', rarity: 'uncommon',
    shape: 'heart', pal: { base: '#3a5a4a', dark: '#233b30', light: '#5c8069', vein: '#cfe0d8' },
    thirst: 1.8, hunger: 0.7, light: 'shade', vigor: 1.1, maxLeaves: 20, value: 70,
    varChance: 0.35, forceVar: 'mint', tags: ['velvet', 'trailing'],
    blurb: 'Matte green brushed with silver paint. Handles neglect gracefully.',
  },
  {
    id: 'hearts', name: 'String of Hearts', latin: 'Ceropegia woodii', rarity: 'uncommon',
    shape: 'heart', pal: { base: '#5c7f66', dark: '#3d5a47', light: '#8aa891', vein: '#e6d9e8' },
    thirst: 1.1, hunger: 0.5, light: 'sun', vigor: 1.0, maxLeaves: 26, value: 72,
    varChance: 0.22, tags: ['succulent', 'trailing'],
    blurb: 'Marbled hearts on a thread metres long. Pink underneath if it gets sun.',
  },

  /* ---- hoyas & flowering ---- */
  {
    id: 'krimson', name: 'Krimson Queen', latin: 'Hoya carnosa "Krimson Queen"', rarity: 'uncommon',
    shape: 'round', pal: { base: '#4f8a52', dark: '#37643a', light: '#78ab74', vein: '#2f5830' },
    thirst: 1.2, hunger: 0.5, light: 'sun', vigor: 0.88, maxLeaves: 18, value: 95,
    varChance: 0.8, forceVar: 'pink', tags: ['succulent', 'variegated', 'flowers', 'trailing'],
    blurb: 'New growth comes out shocking pink before it settles into cream.',
  },
  {
    id: 'orchid', name: 'Moth Orchid', latin: 'Phalaenopsis', rarity: 'uncommon',
    shape: 'paddle', pal: { base: '#3e7a4c', dark: '#275434', light: '#5f9c66', vein: '#245030' },
    thirst: 1.6, hunger: 0.8, light: 'bright', vigor: 0.9, maxLeaves: 8, value: 85,
    varChance: 0.04, tags: ['flowers', 'epiphyte'],
    blurb: 'Four leaves and an arching spray of moths. Blooms for months.',
  },
  {
    id: 'triostar', name: 'Stromanthe Triostar', latin: 'Stromanthe sanguinea', rarity: 'rare',
    shape: 'oval', pal: { base: '#2f6b4a', dark: '#1d4630', light: '#4d8f5f', vein: '#f2dfe8' },
    thirst: 3.8, hunger: 1.0, light: 'cabinet', vigor: 0.95, maxLeaves: 14, value: 165,
    varChance: 0.85, forceVar: 'pink', tags: ['variegated', 'humidity', 'dramatic'],
    blurb: 'Cream, green and raspberry on top, pure magenta underneath.',
  },
  {
    id: 'orbifolia', name: 'Calathea Orbifolia', latin: 'Goeppertia orbifolia', rarity: 'rare',
    shape: 'oval', pal: { base: '#4a8f63', dark: '#2f6642', light: '#6fb07f', vein: '#e9f4ea' },
    thirst: 4.0, hunger: 0.9, light: 'cabinet', vigor: 0.9, maxLeaves: 12, value: 175,
    varChance: 0.05, tags: ['humidity', 'dramatic'],
    blurb: 'Dinner-plate leaves pinstriped in silver. Demands rainforest air.',
  },
  {
    id: 'watermelon', name: 'Watermelon Peperomia', latin: 'Peperomia argyreia', rarity: 'common',
    shape: 'round', pal: { base: '#2f6b47', dark: '#1e482f', light: '#4f8f5c', vein: '#dff0e4' },
    thirst: 1.4, hunger: 0.6, light: 'bright', vigor: 1.05, maxLeaves: 16, value: 42,
    varChance: 0.06, tags: ['succulent'],
    blurb: 'Striped exactly like a watermelon rind. Nobody believes it is real.',
  },

  /* ---- ferns ---- */
  {
    id: 'birdsnest', name: "Bird's Nest Fern", latin: 'Asplenium nidus', rarity: 'common',
    shape: 'strap', pal: { base: '#4f9c53', dark: '#357338', light: '#79bd77', vein: '#2c5f32' },
    thirst: 3.0, hunger: 0.7, light: 'shade', vigor: 1.1, maxLeaves: 14, value: 40,
    varChance: 0.03, tags: ['humidity'],
    blurb: 'Ripple-edged fronds unfurling out of a fuzzy brown crown.',
  },
  {
    id: 'maidenhair', name: 'Maidenhair Fern', latin: 'Adiantum raddianum', rarity: 'uncommon',
    shape: 'fern', pal: { base: '#6bb36a', dark: '#4a8b4b', light: '#96cf90', vein: '#3d7440' },
    thirst: 5.5, hunger: 0.8, light: 'cabinet', vigor: 1.15, maxLeaves: 18, value: 60,
    varChance: 0.03, tags: ['humidity', 'dramatic'],
    blurb: 'Drama incarnate. Miss one watering and it crisps out of spite.',
  },
  {
    id: 'staghorn', name: 'Staghorn Fern', latin: 'Platycerium bifurcatum', rarity: 'rare',
    shape: 'fern', pal: { base: '#6d9a63', dark: '#4a6f44', light: '#95bd86', vein: '#3f5f3a' },
    thirst: 2.4, hunger: 0.9, light: 'bright', vigor: 0.8, maxLeaves: 10, value: 195,
    varChance: 0.04, tags: ['epiphyte', 'humidity'],
    blurb: 'Mounted on a board like a trophy, except the antlers are alive.',
  },

  /* ---- carnivores ---- */
  {
    id: 'flytrap', name: 'Venus Flytrap', latin: 'Dionaea muscipula', rarity: 'rare',
    shape: 'trap', pal: { base: '#5aa34a', dark: '#3d7433', light: '#82c46b', vein: '#b8342f' },
    thirst: 5.0, hunger: 0.2, light: 'sun', vigor: 0.9, maxLeaves: 14, value: 140,
    varChance: 0.05, tags: ['carnivore', 'humidity', 'dramatic'],
    blurb: 'Eats its own fertilizer. Sits in a saucer of rainwater, permanently smug.',
  },
  {
    id: 'nepenthes', name: 'Tropical Pitcher', latin: 'Nepenthes ventricosa', rarity: 'epic',
    shape: 'pitcher', pal: { base: '#77a052', dark: '#54763a', light: '#9dc072', vein: '#a83f3a' },
    thirst: 4.2, hunger: 0.3, light: 'cabinet', vigor: 0.8, maxLeaves: 10, value: 300,
    varChance: 0.06, tags: ['carnivore', 'humidity', 'trailing'],
    blurb: 'Dangles speckled jugs of digestive soup. Sabrina names each pitcher.',
  },

  /* ---- desert shelf ---- */
  {
    id: 'bunny', name: 'Bunny Ear Cactus', latin: 'Opuntia microdasys', rarity: 'common',
    shape: 'pad', pal: { base: '#8fbf5f', dark: '#6d9946', light: '#b3d98a', vein: '#fff7d0' },
    thirst: 0.5, hunger: 0.3, light: 'sun', vigor: 0.7, maxLeaves: 12, value: 32,
    varChance: 0.05, tags: ['cactus', 'tough'],
    blurb: 'Two ears, then four, then eight. The tiny spines get everywhere.',
  },
  {
    id: 'barrel', name: 'Golden Barrel', latin: 'Echinocactus grusonii', rarity: 'uncommon',
    shape: 'globe', pal: { base: '#6fa04a', dark: '#4f7736', light: '#96c26a', vein: '#f2d878' },
    thirst: 0.4, hunger: 0.3, light: 'sun', vigor: 0.55, maxLeaves: 9, value: 88,
    varChance: 0.04, tags: ['cactus', 'tough'],
    blurb: 'A ribbed golden ball. Grows at roughly the speed of geology.',
  },
  {
    id: 'lithops', name: 'Living Stones', latin: 'Lithops', rarity: 'rare',
    shape: 'lithops', pal: { base: '#b8a888', dark: '#8d7f62', light: '#dbcfb2', vein: '#6f6549' },
    thirst: 0.3, hunger: 0.2, light: 'sun', vigor: 0.5, maxLeaves: 8, value: 150,
    varChance: 0.18, tags: ['succulent', 'tough', 'weird'],
    blurb: 'Pebbles that are secretly plants. Water them wrong once and they melt.',
  },
];

const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));

/* ---- how each species' leaf is actually shaped ----
   r      length : width  (higher = narrower)
   form   outline family
   sinus  depth of the basal notch, 0 = no lobes
   tip    apex bluntness (0.05 drawn to a point … 0.5 rounded)
   sh     where the blade is widest, 0 = near the base
   vein   venation pattern   marks  surface markings
   fen    fenestration style (monstera relatives only)              */
const LEAF_SPECS = {
  /* — Monstera & relatives — */
  monstera:    { r: 1.15, form: 'cordate', sinus: .26, tip: .18, sh: .42, vein: 'pinnate', fen: 'split' },
  thai:        { r: 1.15, form: 'cordate', sinus: .26, tip: .18, sh: .42, vein: 'pinnate', fen: 'split' },
  albo:        { r: 1.15, form: 'cordate', sinus: .26, tip: .18, sh: .42, vein: 'pinnate', fen: 'split' },
  aurea:       { r: 1.15, form: 'cordate', sinus: .26, tip: .18, sh: .42, vein: 'pinnate', fen: 'split' },
  adansonii:   { r: 1.75, form: 'ovate',   sinus: .10, tip: .10, sh: .44, vein: 'pinnate', fen: 'hole' },
  obliqua:     { r: 1.60, form: 'ovate',   sinus: .08, tip: .10, sh: .46, vein: 'midrib',  fen: 'lace' },
  tetrasperma: { r: 1.35, form: 'pinnatifid', sinus: .12, tip: .14, sh: .45, vein: 'pinnate' },

  /* — Philodendron & Anthurium — */
  pinkprincess:{ r: 2.10, form: 'sagittate', sinus: .30, tip: .10, sh: .34, vein: 'pinnate' },
  micans:      { r: 1.45, form: 'cordate', sinus: .30, tip: .12, sh: .36, vein: 'pinnate' },
  melano:      { r: 2.30, form: 'cordate', sinus: .26, tip: .08, sh: .34, vein: 'bold' },
  gloriosum:   { r: 1.20, form: 'cordate', sinus: .36, tip: .16, sh: .36, vein: 'bold' },
  spiritus:    { r: 4.20, form: 'strap',   sinus: .14, tip: .06, sh: .30, vein: 'midrib' },
  clarinervium:{ r: 1.05, form: 'cordate', sinus: .40, tip: .20, sh: .40, vein: 'bold' },
  queen:       { r: 3.60, form: 'strap',   sinus: .22, tip: .08, sh: .30, vein: 'bold' },

  /* — Alocasia & Syngonium — */
  frydek:      { r: 1.70, form: 'sagittate', sinus: .34, tip: .10, sh: .32, vein: 'bold' },
  blackvelvet: { r: 1.25, form: 'cordate', sinus: .32, tip: .16, sh: .40, vein: 'bold' },
  dragonscale: { r: 1.30, form: 'ovate',   sinus: .22, tip: .18, sh: .42, vein: 'quilt' },
  syngonium:   { r: 1.40, form: 'trilobe', sinus: .28, tip: .12, sh: .38, vein: 'pinnate' },

  /* — Hoyas — */
  hoyakerrii:  { r: 0.95, form: 'sweetheart', sinus: 0, tip: .5, sh: .5, vein: 'midrib' },
  compacta:    { r: 1.30, form: 'crumpled', sinus: .05, tip: .3, sh: .5, vein: 'none' },
  krimson:     { r: 1.50, form: 'elliptic', sinus: .04, tip: .28, sh: .5, vein: 'midrib' },

  /* — prayer plants & foliage — */
  whitefusion: { r: 1.60, form: 'elliptic', sinus: .06, tip: .22, sh: .48, vein: 'stripe' },
  orbifolia:   { r: 1.10, form: 'elliptic', sinus: .08, tip: .40, sh: .50, vein: 'stripe' },
  triostar:    { r: 2.20, form: 'elliptic', sinus: .05, tip: .16, sh: .46, vein: 'stripe' },
  watermelon:  { r: 1.20, form: 'elliptic', sinus: .10, tip: .40, sh: .48, vein: 'radial' },
  maculata:    { r: 1.90, form: 'wing',    sinus: .20, tip: .12, sh: .40, vein: 'pinnate', marks: 'spots' },
  ruby:        { r: 1.90, form: 'elliptic', sinus: .04, tip: .20, sh: .50, vein: 'midrib' },
  raven:       { r: 2.00, form: 'elliptic', sinus: .03, tip: .16, sh: .50, vein: 'midrib' },
  orchid:      { r: 1.70, form: 'elliptic', sinus: .04, tip: .45, sh: .52, vein: 'midrib' },

  /* — trailers — */
  pearls:      { form: 'pearl',   r: 1.0,  vein: 'window' },
  hearts:      { r: 1.05, form: 'cordate', sinus: .30, tip: .22, sh: .44, vein: 'none', marks: 'marble' },
  marble:      { r: 1.35, form: 'cordate', sinus: .24, tip: .12, sh: .40, vein: 'pinnate' },
  neon:        { r: 1.35, form: 'cordate', sinus: .24, tip: .12, sh: .40, vein: 'pinnate' },
  exotica:     { r: 1.55, form: 'cordate', sinus: .22, tip: .12, sh: .40, vein: 'midrib', marks: 'splash' },

  /* — ferns, carnivores, desert — */
  birdsnest:   { r: 2.50, form: 'strap', sinus: .05, tip: .14, sh: .45, vein: 'midrib', margin: 'wavy' },
  maidenhair:  { form: 'fern', leaflet: 'fan', r: 1.5, vein: 'none' },
  staghorn:    { form: 'antler',  r: 1.2,  vein: 'none' },
  flytrap:     { form: 'trap',    r: 1.2,  vein: 'speck' },
  nepenthes:   { form: 'pitcher', r: 1.3,  vein: 'speck' },
  bunny:       { form: 'pad',     r: 1.05, vein: 'areole' },
  barrel:      { form: 'globe',   r: 1.0,  vein: 'ribs' },
  lithops:     { form: 'lithops', r: 1.0,  vein: 'stone' },
};

/* ---- pots ---- */
const POTS = [
  { id: 'nursery',  name: 'Nursery Pot',    price: 0,    size: 1, drain: 1.0,  growth: 1.00, fill: '#5d6068', rim: '#767a84' },
  { id: 'terra',    name: 'Terracotta',     price: 60,   size: 2, drain: 1.25, growth: 1.05, fill: '#c67b52', rim: '#e0946a' },
  { id: 'cream',    name: 'Cream Ceramic',  price: 180,  size: 2, drain: 1.0,  growth: 1.10, fill: '#f2e6d8', rim: '#fff8ee' },
  { id: 'blush',    name: 'Blush Fluted',   price: 420,  size: 3, drain: 1.0,  growth: 1.18, fill: '#f3c6d3', rim: '#ffdde6' },
  { id: 'sage',     name: 'Sage Stoneware', price: 700,  size: 3, drain: 1.1,  growth: 1.22, fill: '#a9c3a4', rim: '#c3d9bd' },
  { id: 'glass',    name: 'Glass Cloche',   price: 1200, size: 3, drain: 0.8,  growth: 1.35, fill: '#bfe6ea', rim: '#e2f6f8', humid: 1.5 },
  { id: 'gold',     name: 'Gilded Urn',     price: 2600, size: 4, drain: 1.0,  growth: 1.5,  fill: '#e5c15c', rim: '#f6e09a' },
];
const POTS_BY_ID = Object.fromEntries(POTS.map(p => [p.id, p]));

/* ---- soils ---- */
const SOILS = [
  { id: 'basic',   name: 'Bagged Potting Mix', price: 0,   growth: 1.00, drain: 1.0, rot: 1.0 },
  { id: 'chunky',  name: 'Chunky Aroid Mix',   price: 45,  growth: 1.15, drain: 1.3, rot: 0.6 },
  { id: 'moss',    name: 'Sphagnum Moss',      price: 90,  growth: 1.25, drain: 0.9, rot: 0.8 },
  { id: 'leca',    name: 'LECA + Hydro',       price: 220, growth: 1.30, drain: 1.6, rot: 0.3 },
  { id: 'premium', name: 'Sabrina\'s Blend',   price: 500, growth: 1.45, drain: 1.35, rot: 0.35 },
];
const SOILS_BY_ID = Object.fromEntries(SOILS.map(s => [s.id, s]));

/* ---- consumables & tools ---- */
const ITEMS = {
  fertilizer:  { name: 'Fertilizer',      icon: '🧪', price: 25,  desc: 'Fills the feed meter and adds a growth burst.' },
  neem:        { name: 'Neem Spray',      icon: '🧴', price: 40,  desc: 'Clears pests instantly.' },
  rooting:     { name: 'Rooting Hormone', icon: '🍯', price: 60,  desc: 'Cuttings root ~60% faster.' },
  graftTape:   { name: 'Graft Tape',      icon: '🎀', price: 150, desc: 'Required to graft two plants together.' },
  moss:        { name: 'Moss Pole',       icon: '🪵', price: 200, desc: 'Permanent +25% growth & bigger leaves on a climber.' },
  lamp:        { name: 'Grow Lamp',       icon: '💡', price: 350, desc: 'Permanently upgrades a Shady Nook slot to Bright.' },
  mister:      { name: 'Humidifier',      icon: '💨', price: 300, desc: 'Garden-wide +15% growth for humidity lovers.' },
  glitter:     { name: 'Variegation Dust',icon: '✨', price: 900, desc: 'Guarantees the next new leaf rolls for variegation.' },
  camera:      { name: 'Polaroid',        icon: '📸', price: 120, desc: 'Snap a plant for the Journal and earn bonus coins.' },
  tonic:       { name: 'Revival Tonic',   icon: '💗', price: 240, desc: 'Pulls a dying plant back from the brink — health to 55.' },
  globes:      { name: 'Watering Globes', icon: '🫧', price: 420, desc: 'Permanently halves how fast one plant dries out. Buy these before a holiday.' },
};

/* ---- decor: pure vibes, small global buffs ---- */
const DECOR = [
  { id: 'rug',     name: 'Woven Rug',       price: 150,  icon: '🟫', buff: 'joy',    val: 1, desc: '+1 Cosiness' },
  { id: 'cat',     name: 'Napping Cat',     price: 400,  icon: '🐈', buff: 'joy',    val: 3, desc: '+3 Cosiness. Occasionally knocks a pot over.' },
  { id: 'lights',  name: 'Fairy Lights',    price: 250,  icon: '✨', buff: 'joy',    val: 2, desc: '+2 Cosiness' },
  { id: 'bench',   name: 'Potting Bench',   price: 600,  icon: '🪑', buff: 'lab',    val: 1, desc: '+1 propagation slot, +1 Shady Nook slot' },
  { id: 'shelf',   name: 'Extra Shelf',     price: 800,  icon: '🗄️', buff: 'slots',  val: 2, desc: '+2 Bright Shelf slots' },
  { id: 'stand',   name: 'Plant Stand',     price: 950,  icon: '🪴', buff: 'shade',  val: 2, desc: '+2 Shady Nook slots' },
  { id: 'window',  name: 'Bay Window',      price: 1500, icon: '🪟', buff: 'sun',    val: 2, desc: '+2 Sun Window slots' },
  { id: 'ladder',  name: 'Ladder Shelf',    price: 1800, icon: '🪜', buff: 'slots',  val: 3, desc: '+3 Bright Shelf slots' },
  { id: 'stall',   name: 'Plant Stall',     price: 1800, icon: '🏪', buff: 'income', val: 1, desc: 'Sells spare cuttings while you\'re away — passive coins from your collection' },
  { id: 'fountain',name: 'Stone Fountain',  price: 2200, icon: '⛲', buff: 'joy',    val: 6, desc: '+6 Cosiness' },
  { id: 'cabinet', name: 'Greenhouse Cabinet', price: 3000, icon: '🌫️', buff: 'cabinet', val: 4, desc: 'Unlocks the Greenhouse Cabinet — +4 humid slots' },
  { id: 'green',   name: 'Greenhouse Wall', price: 5000, icon: '🏡', buff: 'joy',    val: 10, desc: '+10 Cosiness. Sabrina cries happy tears.' },
];
const DECOR_BY_ID = Object.fromEntries(DECOR.map(d => [d.id, d]));

/* ---- Sabrina's lines ---- */
const LINES = {
  greet: [
    'Morning! I already checked everyone twice.',
    'The Monstera made a noise. I swear it did.',
    'Okay but what if we bought ONE more plant.',
    'I dreamed about a half-moon leaf. Bad omen or good?',
    'Tea\'s on. Let\'s go say hi to the babies.',
  ],
  water: [
    'There you go, drink up.',
    'That soil was bone dry, poor thing.',
    'Bottom-watered. We\'re professionals here.',
  ],
  thirsty: [
    'Um. Someone\'s drooping.',
    'I can hear the soil crunching from here.',
  ],
  newLeaf: [
    'A NEW LEAF. Everyone be quiet.',
    'It\'s unfurling! Look at the little cigar!',
    'Okay that one is going straight on the shelf of honour.',
  ],
  rare: [
    'Wait. WAIT. Is that variegation?!',
    'I need to sit down. Look at this leaf.',
    'That\'s a grail leaf. That is a grail leaf.',
  ],
  pest: [
    'Ugh, thrips. Quarantine, now.',
    'Something\'s been chewing. Not on my watch.',
  ],
  sad: [
    'I think I overwatered. Again.',
    'It\'s okay. Plants forgive. Mostly.',
  ],
  wilting: [
    'That one\'s gone crispy at the edges. Water. Now.',
    'It\'s drooping badly. Please tell me I\'m not too late.',
    'Okay, triage. Who needs me most?',
  ],
  critical: [
    'It\'s barely hanging on. I can\'t watch this.',
    'Please. Please don\'t die on me.',
    'Emergency. Tonic. Something.',
  ],
  death: [
    'I lost one. I need a minute.',
    'It\'s gone. I should have checked on it sooner.',
    'Into the compost. I\'m sorry, little one.',
  ],
};

/* ---- quests ---- */
const QUEST_POOL = [
  { id: 'water5',   text: 'Water 5 plants',            goal: 5,  type: 'water',  coins: 60,  xp: 20 },
  { id: 'feed3',    text: 'Feed 3 plants',             goal: 3,  type: 'feed',   coins: 70,  xp: 25 },
  { id: 'leaf2',    text: 'Unfurl 2 new leaves',       goal: 2,  type: 'leaf',   coins: 120, xp: 40 },
  { id: 'prop1',    text: 'Take 1 cutting',            goal: 1,  type: 'prop',   coins: 90,  xp: 30 },
  { id: 'pot1',     text: 'Repot a plant',             goal: 1,  type: 'pot',    coins: 80,  xp: 25 },
  { id: 'sell2',    text: 'Sell 2 plants at market',   goal: 2,  type: 'sell',   coins: 100, xp: 30 },
  { id: 'move2',    text: 'Move 2 plants to new light',goal: 2,  type: 'move',   coins: 70,  xp: 20 },
  { id: 'root1',    text: 'Root a cutting fully',      goal: 1,  type: 'root',   coins: 150, xp: 50 },
];

/* ---- achievements ---- */
const ACHIEVEMENTS = [
  { id: 'first',    name: 'First Sprout',      desc: 'Grow your first new leaf.',            gems: 1 },
  { id: 'ten',      name: 'Leaf Collector',    desc: 'Grow 10 leaves total.',                gems: 2 },
  { id: 'fifty',    name: 'Jungle Keeper',     desc: 'Grow 50 leaves total.',                gems: 5 },
  { id: 'varieg',   name: 'Lucky Sector',      desc: 'Roll a variegated leaf.',              gems: 3 },
  { id: 'halfmoon', name: 'Half-Moon',         desc: 'Roll a half-moon leaf.',               gems: 8 },
  { id: 'propper',  name: 'Propagation Nerd',  desc: 'Root 5 cuttings.',                     gems: 3 },
  { id: 'grafter',  name: 'Mad Botanist',      desc: 'Successfully graft a hybrid.',         gems: 6 },
  { id: 'dex10',    name: 'Ten Species',       desc: 'Discover 10 species.',                 gems: 4 },
  { id: 'dexall',   name: 'Completionist',     desc: 'Discover every species.',              gems: 20 },
  { id: 'grail',    name: 'Grail Hunter',      desc: 'Own a Legendary or Mythic plant.',     gems: 10 },
  { id: 'rich',     name: 'Plant Money',       desc: 'Hold 5,000 coins.',                    gems: 5 },
  { id: 'cosy',     name: 'Cottagecore',       desc: 'Reach 20 Cosiness.',                   gems: 5 },
  { id: 'jungle',   name: 'Jungle Apartment',  desc: 'Keep 20 plants alive at once.',        gems: 8 },
  { id: 'cabinet',  name: 'Humidity Freak',    desc: 'Unlock the Greenhouse Cabinet.',       gems: 5 },
  { id: 'medic',    name: 'Plant Paramedic',   desc: 'Revive a plant from critical.',        gems: 4 },
  { id: 'nurse',    name: 'Nobody Left Behind',desc: 'Reach 30 leaves with no plant lost.',  gems: 8 },
  { id: 'arcade',   name: 'Arcade Regular',    desc: 'Play all three mini-games.',           gems: 3 },
  { id: 'hustler',  name: 'Side Hustle',       desc: 'Earn 400 coins in one mini-game.',     gems: 5 },
  { id: 'shopkeep', name: 'Shopkeeper',        desc: 'Open your own Plant Stall.',           gems: 4 },
];

const STAGES = ['Seedling', 'Sprout', 'Juvenile', 'Mature', 'Specimen', 'Heirloom'];
const STAGE_AT = [0, 1, 3, 6, 10, 15]; // leaf count thresholds
