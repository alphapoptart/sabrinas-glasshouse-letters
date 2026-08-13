const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Math, Date, setTimeout, clearTimeout });
const run = (file, suffix = '') => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8') + suffix, context, { filename: file });

run('js/data.js', '\nglobalThis.DATA_TEST={SPECIES,SPECIES_BY_ID,LEAF_SPECS};');
run('js/plantart.js', '\nglobalThis.ART_TEST={renderPlant};');

const expected = [
  'saguaro', 'bluetorch', 'oldman', 'fairycastle', 'astrophytum', 'mooncactus',
  'fishbone', 'rattail', 'christmas', 'peanut', 'aloe', 'haworthia', 'echeveria',
  'dolphins', 'euphorbia', 'oxalis', 'maranta', 'rex', 'pilea', 'fittonia',
  'strelitzia', 'sundew',
];
const { SPECIES, SPECIES_BY_ID, LEAF_SPECS } = context.DATA_TEST;
assert.equal(SPECIES.length, 64, 'the complete collection should contain 64 species');
assert.equal(new Set(SPECIES.map(species => species.id)).size, SPECIES.length, 'species ids must be unique');
for (const id of expected) {
  const species = SPECIES_BY_ID[id];
  assert.ok(species, `${id} should exist`);
  assert.ok(LEAF_SPECS[id], `${id} should have species-specific art data`);
  assert.ok(species.name && species.latin && species.blurb, `${id} should have complete collection text`);
  assert.ok(['sun', 'bright', 'shade', 'cabinet'].includes(species.light), `${id} should have a valid light path`);
  const plant = {
    id: 9000 + expected.indexOf(id), speciesId: id, potId: 'terra', path: species.light,
    shading: 'matte', health: 100, water: 80, growth: 0,
    leaves: [{ seed: 700 + expected.indexOf(id), len: 58, fen: 0, varieg: 'none', unfurl: 1 }],
  };
  const svg = context.ART_TEST.renderPlant(plant, { tag: 'test' });
  assert.match(svg, /^<svg/);
  assert.doesNotMatch(svg, /NaN|undefined/);
}
assert.equal(LEAF_SPECS.saguaro.arms, 'saguaro');
assert.equal(LEAF_SPECS.euphorbia.arms, 'candelabra');
assert.equal(LEAF_SPECS.haworthia.marks, 'zebra');
assert.equal(LEAF_SPECS.fittonia.vein, 'net');

vm.runInContext(`
  globalThis.S={sequel:{lead:'sean',legacy:1,glassRooms:0,favoriteIds:[],events:{},sunstoneClaims:[],showRecords:{},companionDays:{}},dex:{},plants:[],market:[],quests:[],coins:1000,gems:2,inv:{},decor:{},album:[]};
  globalThis.sequelDay=()=>new Date().toISOString().slice(0,10);
  globalThis.sequelDefaults=()=>{if(!S.sequel)S.sequel={};if(!S.sequel.favoriteIds)S.sequel.favoriteIds=[]};
  globalThis.rollMarket=()=>{S.market=SPECIES.slice(0,5).map((sp,i)=>({key:'base'+i,speciesId:sp.id,price:sp.value,leaves:1,varieg:'none'}))};
  globalThis.renderShop=()=>{}; globalThis.renderJournal=()=>{}; globalThis.wire=()=>{};
  globalThis.secondsPerLeaf=()=>100; globalThis.save=()=>{S.saved=(S.saved||0)+1};
  globalThis.pick=a=>a[0]; globalThis.now=()=>Date.now(); globalThis.$=()=>null;
  globalThis.A={buyPlant:()=>true,cutting:()=>true,arcadeReward:()=>'',water:()=>true,feed:()=>true,photo:()=>1};
  globalThis.renderPlant=()=>'<svg></svg>'; globalThis.modal=()=>{}; globalThis.toast=()=>{};
  globalThis.sparkle=()=>{}; globalThis.renderTop=()=>{}; globalThis.closeModal=()=>{};
  globalThis.anyFreeSlot=()=> 'sun'; globalThis.newPlant=()=>({}); globalThis.bumpQuest=()=>{};
  globalThis.rarityOrder=r=>Object.keys(RARITY).indexOf(r); globalThis.effectiveRarity=p=>SPECIES_BY_ID[p.speciesId].rarity;
  globalThis.bestVarOf=()=> 'none'; globalThis.esc=s=>s; globalThis.plantName=p=>SPECIES_BY_ID[p.speciesId].name;
`, context);
run('js/sunstone-seasons.js', '\nglobalThis.EXP_TEST={SUNSTONE_IDS,SEASON_CALENDAR,SHOW_CATEGORIES,currentSeason,eventState,seasonAction,seasonSummary,sunstoneCount,gardenAtmosphere};');

const expansion = context.EXP_TEST;
assert.equal(expansion.SUNSTONE_IDS.length, 18);
assert.equal(expansion.SEASON_CALENDAR.length, 4);
assert.equal(expansion.SHOW_CATEGORIES.length, 5);
const active = expansion.currentSeason();
assert.ok(active.months.includes(new Date().getMonth()), 'the active event should match the current month');
expansion.seasonAction(active.challenges[0][0], 1);
assert.equal(expansion.eventState(active).progress[active.challenges[0][0]], 1, 'real actions should advance seasonal progress');
vm.runInContext('rollMarket()', context);
assert.equal(context.S.market.length, 5);
const isEventOffer = offer => {
  const species = SPECIES_BY_ID[offer.speciesId];
  if (active.id === 'summer') return expansion.SUNSTONE_IDS.includes(species.id);
  if (active.id === 'winter') return species.tags.includes('nightfold') || species.light === 'shade';
  if (active.id === 'spring') return species.tags.includes('humidity') || species.tags.includes('flowers');
  return species.tags.includes('dramatic') || species.tags.includes('variegated');
};
assert.ok(context.S.market.slice(0, 2).every(isEventOffer), 'the market should guarantee two active-event offers');
assert.ok(context.S.saved > 0, 'seasonal progress should autosave immediately');

console.log('Expansion checks passed: 64 species, 22 new botanical renders, 18 Sunstone entries, 4 seasons, 5 show categories.');
