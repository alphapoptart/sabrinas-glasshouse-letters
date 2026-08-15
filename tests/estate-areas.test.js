const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const fakeNode={addEventListener(){},querySelector(){return null},insertAdjacentHTML(){},classList:{add(){}}};
const context=vm.createContext({console,Math,Date,setTimeout,clearTimeout,fakeNode,document:{querySelector(){return fakeNode}}});
const run=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
run('js/data.js');
vm.runInContext(`
  globalThis.now=()=>1700000000000;globalThis.sequelDay=()=> '2026-08-15';globalThis.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));globalThis.esc=String;
  globalThis.saveCount=0;globalThis.save=()=>{saveCount++;return true};globalThis.toast=()=>{};globalThis.sparkle=()=>{};globalThis.sfx=()=>{};
  globalThis.renderGarden=()=>{};globalThis.renderSheet=()=>{};globalThis.wire=()=>{};globalThis.boot=async()=>{};globalThis.secondsPerLeaf=()=>100;
  globalThis.v5ModeSwitch=()=>'';globalThis.v5ApplyLeadSkin=()=>{};globalThis.v5UpdateSaveChip=()=>{};globalThis.v5DecorClass=()=>'';globalThis.v5DecorScene=()=>'';globalThis.v5IdentityBanner=()=>'';globalThis.v5Lead=()=>({id:'sabrina'});globalThis.v5PetButton=()=>'';
  globalThis.renderPlant=()=>'<svg></svg>';globalThis.plantName=p=>SPECIES_BY_ID[p.speciesId].name;globalThis.closeModal=()=>{};globalThis.closeSheet=()=>{};globalThis.openPlantId=null;globalThis.screen='garden';globalThis.$=()=>fakeNode;
  globalThis.S={coins:100,gems:2,sequel:{gardenMode:'collection',scenePage:0},plants:[
    {id:1,speciesId:'barrel',zone:'sun',water:40,health:90},
    {id:2,speciesId:'birdsnest',zone:'shade',water:45,health:88},
    {id:3,speciesId:'clarinervium',zone:'shade',water:50,health:92},
    {id:4,speciesId:'haworthia',zone:'sun',water:35,health:95}
  ],estate:{version:3,activeRoom:'grounds',resources:{glass:0,timber:0,copper:0,pollen:0},plantAreas:{},areas:{},rooms:{fernery:{letterStep:0,placements:{}}}}};
  globalThis.ensureEstate=()=>S.estate;globalThis.ferneryRoom=()=>S.estate.rooms.fernery;globalThis.placedIds=()=>Object.values(S.estate.rooms.fernery.placements).map(Number);
  globalThis.isDryPlant=p=>{const sp=SPECIES_BY_ID[p.speciesId];return sp.tags.includes('cactus')||sp.tags.includes('succulent')};
  globalThis.isUnderstoryPlant=p=>{const sp=SPECIES_BY_ID[p.speciesId];return sp.shape==='fern'||sp.tags.includes('humidity')||sp.light==='shade'};
  globalThis.removePlantFromRoom=id=>{Object.keys(S.estate.rooms.fernery.placements).forEach(a=>{if(Number(S.estate.rooms.fernery.placements[a])===Number(id))delete S.estate.rooms.fernery.placements[a]})};
`,context);
run('js/estate-areas.js');
const T=context.ESTATE_AREAS_TEST;

T.ensureEstateAreas();
assert.equal(context.S.estate.areas.greenhouse.profile,'balanced');
assert.deepEqual(Array.from(T.estateScenePlants('outside'),p=>p.id),[1,4]);
assert.deepEqual(Array.from(T.estateScenePlants('greenhouse'),p=>p.id),[2,3]);

assert.equal(T.movePlantArea(1,'greenhouse'),true);
assert.equal(context.S.estate.plantAreas[1],'greenhouse');
assert.deepEqual(Array.from(context.S.plants,p=>p.id),[1,2,3,4],'area movement must not clone or renumber canonical plants');
context.S.estate.areas.greenhouse.profile='airy';
assert.ok(T.greenhouseFit(context.S.plants[0])>T.greenhouseFit(context.S.plants[1]),'airy glass should better fit a barrel cactus than a fern');

const pollenBefore=context.S.estate.resources.pollen;
assert.equal(T.collectGreenhouseCondensation(),true);
assert.equal(context.S.estate.resources.pollen,pollenBefore+1,'three greenhouse plants should press one pollen');
assert.equal(context.S.plants.find(p=>p.id===1).water,58);
assert.equal(context.S.plants.find(p=>p.id===2).water,63);
assert.equal(T.collectGreenhouseCondensation(),false,'condensation is capped to one gentle daily round');

context.S.estate.rooms.fernery.placements.a1=1;
assert.equal(T.estateAreaOf(context.S.plants[0]),'fernery');
assert.equal(T.estateScenePlants('greenhouse').some(p=>p.id===1),false);
context.removePlantFromRoom(1);
assert.equal(T.estateAreaOf(context.S.plants[0]),'outside','returning from the Fernery should place a plant outside');
assert.equal(T.movePlantArea(2,'outside'),true);
assert.equal(T.movePlantArea(3,'outside'),true);
assert.deepEqual(Array.from(T.estateScenePlants('greenhouse'),p=>p.id),[],'a player may intentionally leave the greenhouse empty');

console.log('Estate area checks passed: canonical plants move persistently between outside, greenhouse, and Fernery; climate fit and daily condensation are functional.');
