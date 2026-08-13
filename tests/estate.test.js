const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const context=vm.createContext({console,Math,Date,setTimeout,clearTimeout});
const run=(file,suffix='')=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8')+suffix,context,{filename:file});
run('js/data.js');
vm.runInContext(`
  globalThis.now=()=>1700000000000;globalThis.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  globalThis.sequelDay=()=> '2026-08-13';globalThis.esc=s=>String(s);globalThis.save=()=>true;
  globalThis.sfx=()=>{};globalThis.toast=()=>{};globalThis.sparkle=()=>{};globalThis.modal=()=>{};
  globalThis.closeModal=()=>{};globalThis.renderPlant=()=>'<svg></svg>';globalThis.renderTop=()=>{};
  globalThis.renderGarden=()=>{};globalThis.renderShop=()=>{};globalThis.renderJournal=()=>{};
  globalThis.secondsPerLeaf=()=>100;globalThis.tick=()=>{};globalThis.wire=()=>{};globalThis.boot=async()=>{};
  globalThis.chooseLead=()=>{};globalThis.leadName=()=> 'Princess Sabrina';globalThis.openPlant=()=>{};
  globalThis.go=()=>{};globalThis.screen='garden';globalThis.shopTab='plants';
  globalThis.$=()=>({addEventListener:()=>{},insertAdjacentHTML:()=>{}});
  globalThis.seasonAction=()=>{};globalThis.bumpQuest=()=>{};globalThis.anyFreeSlot=()=> 'bright';
  globalThis.newPlant=()=>null;globalThis.plantName=p=>SPECIES_BY_ID[p.speciesId].name;
  globalThis.S={coins:1000,gems:2,gentle:true,plants:[
    {id:1,speciesId:'barrel',nick:'Sol',health:96,leaves:[{}]},
    {id:2,speciesId:'haworthia',health:90,leaves:[{}]},
    {id:3,speciesId:'echeveria',health:88,leaves:[{}]},
    {id:4,speciesId:'birdsnest',health:93,leaves:[{}]},
    {id:5,speciesId:'maidenhair',health:91,leaves:[{}]}
  ],sequel:{legacy:1,glassRooms:0,visitors:[],favoriteIds:[]},decor:{},estate:{
    version:1,activeRoom:'fernery',resources:{glass:9,timber:9,copper:9,pollen:0},heirloomIds:[],
    shells:{fernery:true,sunstone:false,moon:false,secret:false},history:{events:{},shows:{},visitors:[]},
    rooms:{fernery:{status:'neglected',diagnosed:{pane:false,bench:false,drain:false},repairs:{pane:null,bench:null,drain:null},placements:{},decor:{d1:null,d2:null},letterStep:0,clues:[],chapterComplete:false,nextChapter:null,openedAt:1,starterGuild:'dry',companions:{Joey:{bond:0,lastDay:null,clues:[]},Salem:{bond:0,lastDay:null,clues:[]},Trace:{bond:0,lastDay:null,clues:[]}},visitors:[],exhibitions:[],exhibitionDraft:{plantIds:[],decor:'stone',story:'renewal'},minigames:{irrigation:{solved:false,best:null,lastRewardDay:null},pollination:{solved:false,best:null,lastRewardDay:null,prep:0}}}}
  }};
`,context);
run('js/estate.js');
const T=context.ESTATE_TEST;

assert.equal(T.ESTATE_ANCHORS.length,14,'the Fernery must expose fourteen persistent plant anchors');
assert.equal(T.placePlantAt('a12',1),true);assert.equal(T.placePlantAt('a13',2),true);assert.equal(T.placePlantAt('a14',3),true);
assert.deepEqual(Array.from(vm.runInContext('placedIds()',context)),[1,2,3]);
vm.runInContext(`S.estate.rooms.fernery.repairs={pane:'prism',bench:'sand',drain:'stone'}`,context);
let climate=JSON.parse(JSON.stringify(T.roomClimate()));
assert.ok(climate.light>=70&&climate.humidity<=20&&climate.water<=30,'the dry build should create a legible bright, dry climate');
assert.equal(T.guildState().dry.active,true,'adjacent cacti/succulents should activate the dry guild in a compatible climate');
assert.ok(T.plantEstateFit(context.S.plants[0])>70,'a cactus should gain strong vitality in the dry guild');

vm.runInContext(`S.estate.rooms.fernery.placements={a6:4,a7:5,a8:3};S.estate.rooms.fernery.repairs={pane:'shade',bench:'mist',drain:'reed'}`,context);
climate=JSON.parse(JSON.stringify(T.roomClimate()));
assert.ok(climate.humidity>=70&&climate.water>=50,'the understory build should create a humid room');
assert.equal(T.guildState().understory.active,true,'neighboring humidity plants should activate the understory guild');

const solved=Array(16).fill(0);solved[1]=2;solved[5]=0;solved[6]=2;solved[10]=0;solved[11]=2;
assert.equal(T.pipeConnected(solved),true,'the designed irrigation route must connect source to drain');
const broken=solved.slice();broken[6]=3;assert.equal(T.pipeConnected(broken),false,'a rotated break must fail clearly');

vm.runInContext(`S.estate.rooms.fernery.decor={d1:'moss',d2:'lantern'};S.estate.rooms.fernery.minigames.pollination.prep=10`,context);
const score=T.exhibitionBreakdown([4,5,3],'moss','renewal');
assert.ok(score.total>=60&&score.ecology>=16&&score.prep===10,'exhibition score must use guild ecology and pollinator preparation');

vm.runInContext(`
  const r=S.estate.rooms.fernery;r.letterStep=2;r.diagnosed={pane:true,bench:true,drain:true};r.minigames.irrigation.solved=true;r.minigames.pollination.solved=true;
  r.companions.Joey.clues=['fernery'];r.companions.Joey.bond=2;
`,context);
const visitor=JSON.parse(JSON.stringify(T.generateFerneryVisitor()));
assert.ok(visitor.text.includes('Room climate:'),'visitor evidence must record the actual climate');
assert.deepEqual(visitor.plantIds,[4,5,3]);assert.equal(visitor.companion,'Joey');

console.log('Estate checks passed: anchors persist canonical ids, both guild builds work, irrigation connects, exhibitions use room state, and visitor evidence is composition-driven.');
