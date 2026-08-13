const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

let loadedState = null;
const context = vm.createContext({ console });
context.blankSave = () => ({
  v: 1, coins: 250, gems: 2, xp: 0, level: 1, plants: [], lab: [], nextId: 1,
  inv: { fertilizer: 3, neem: 1, rooting: 1 }, decor: {}, dex: {}, market: [],
  alerts: [], memorial: [], quests: [], ach: {}, best: {}, played: {}, visited: {},
  stats: { leaves: 0, rooted: 0, grafts: 0, watered: 0, lost: 0, revived: 0, arcade: 0, arcadeBest: 0 },
  lastTick: 1000, lastDay: null, streak: 0, dust: false, sound: true, music: true,
  sfxVol: 80, musVol: 45, intro: false, gentle: true, gardener: '', tickets: 5,
});
context.load = raw => { loadedState = JSON.parse(raw); return { fresh: false }; };

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'save-migrations.js'), 'utf8');
vm.runInContext(source + '\nglobalThis.MIGRATION_TEST={migrateSaveObject,GLASSHOUSE_SAVE_VERSION};', context, { filename: 'js/save-migrations.js' });

const prior = {
  v: 1, savedAt: 1710000000000, lastTick: 1710000000000,
  coins: 4321, gems: 17, xp: 88, level: 12, streak: 9, nextId: 57,
  plants: [{
    id: 41, speciesId: 'barrel', nick: 'Goldie', potId: 'ceramic', soilId: 'grit',
    zone: 'sun', water: 43, food: 67, health: 92, growth: .61, path: 'sun',
    pathScore: { sun: 840, bright: 20, shade: 0 }, shading: 'frost', varieg: 'mint',
    pests: true, moss: false, rotated: 1234, misted: 5678, born: 1600000000000,
    leaves: [{ seed: 77, len: 63, fen: 0, varieg: 'mint', unfurl: .8, at: 1700000000000 }],
    customFutureTrait: 'keep-me',
  }],
  lab: [{ id: 56, speciesId: 'monstera', name: 'Mo', progress: .72, rooted: false }],
  inv: { fertilizer: 8, neem: 4, camera: 6, customToken: 3 },
  decor: { shelf: 2, cabinet: 1 }, dex: { barrel: { seen: 12, grown: 4, bestVar: 'mint' } },
  market: [{ key: 'saved-offer', speciesId: 'orchid', price: 99 }],
  alerts: [{ type: 'leaf', text: 'A memory', at: 12 }], memorial: [{ name: 'Fernie' }],
  quests: [{ id: 'photo1', prog: 1, goal: 2, claimed: false }], ach: { first: 10 },
  best: { pour: 500 }, played: { pour: true }, visited: { friend: 123 },
  stats: { leaves: 144, rooted: 8, grafts: 3, watered: 90, lost: 1, revived: 2, arcade: 20, arcadeBest: 610 },
  sound: false, music: true, sfxVol: 23, musVol: 61, gentle: false,
  gardener: 'Sean', hideInstall: true,
  sequel: {
    lead: 'sean', legacy: 7, season: 24, seasonClaimed: true, glassRooms: 3,
    showWins: 6, secret: false, lastSeed: '2026-08-10', lastMorning: '2026-08-11',
    visitors: [{ at: 20, name: 'Trace', text: 'Pawprint' }],
    request: { plantId: 41, type: 'photo', done: false }, favoriteIds: [41], scenePage: 2,
    companionDays: { '2026-08-11:Joey': true }, customStoryFlag: 'letter-seven',
  },
  unknownFutureField: { stillHere: true },
};

const migrated = JSON.parse(JSON.stringify(context.MIGRATION_TEST.migrateSaveObject(prior)));
assert.equal(migrated.v, 3);
assert.equal(migrated.coins, 4321); assert.equal(migrated.gems, 17);
assert.equal(migrated.xp, 88); assert.equal(migrated.level, 12); assert.equal(migrated.streak, 9);
Object.entries(prior.inv).forEach(([key,value])=>assert.equal(migrated.inv[key],value));
assert.equal(migrated.inv.rooting, 1, 'new inventory defaults should be added without replacing old items');
assert.deepEqual(migrated.decor, prior.decor);
assert.deepEqual(migrated.dex, prior.dex); assert.deepEqual(migrated.quests, prior.quests);
assert.deepEqual(migrated.stats, prior.stats); assert.deepEqual(migrated.lab, prior.lab);
assert.equal(migrated.plants.length, 1); assert.equal(migrated.plants[0].nick, 'Goldie');
assert.equal(migrated.plants[0].water, 43); assert.equal(migrated.plants[0].customFutureTrait, 'keep-me');
assert.deepEqual(migrated.plants[0].leaves[0], prior.plants[0].leaves[0]);
assert.equal(migrated.sequel.lead, 'sean'); assert.equal(migrated.sequel.legacy, 7);
assert.equal(migrated.sequel.season, 24); assert.equal(migrated.sequel.showWins, 6);
assert.equal(migrated.sequel.glassRooms, 3); assert.deepEqual(migrated.sequel.favoriteIds, [41]);
assert.deepEqual(migrated.sequel.visitors, prior.sequel.visitors);
assert.deepEqual(migrated.sequel.companionDays, prior.sequel.companionDays);
assert.equal(migrated.sequel.customStoryFlag, 'letter-seven');
assert.deepEqual(migrated.sequel.events, {}); assert.deepEqual(migrated.sequel.showRecords, {});
assert.deepEqual(migrated.sequel.sunstoneClaims, []);
assert.equal(migrated.sound, false); assert.equal(migrated.music, true);
assert.equal(migrated.sfxVol, 23); assert.equal(migrated.musVol, 61);
assert.equal(migrated.gentle, false); assert.equal(migrated.gardener, 'Sean'); assert.equal(migrated.hideInstall, true);
assert.deepEqual(migrated.unknownFutureField, { stillHere: true });

context.load(JSON.stringify(prior));
assert.equal(loadedState.v, 3, 'the real load wrapper should apply the migration');
assert.equal(loadedState.coins, 4321); assert.equal(loadedState.plants[0].nick, 'Goldie');
assert.equal(loadedState.sequel.lead, 'sean'); assert.equal(loadedState.sequel.legacy, 7);
assert.equal(loadedState.sound, false); assert.deepEqual(loadedState.unknownFutureField, { stillHere: true });

console.log('Migration checks passed: prior v1/v2 progress preserved and new v3 fields defaulted safely.');
