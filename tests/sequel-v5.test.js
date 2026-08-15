const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const fakeRoot={insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return[]},appendChild(){}};
const context=vm.createContext({console,Math,Date,setTimeout,clearTimeout,
  window:{addEventListener(){}},location:{reload(){}},
  document:{querySelector(sel){if(sel==='#screen-profile'||sel==='#screen-arcade'||sel==='#screen-garden'||sel==='#app'||sel==='#topbar')return fakeRoot;return null},createElement(){return{classList:{toggle(){}},textContent:'',className:''}}},
});
const run=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
run('js/data.js');
vm.runInContext(`
  globalThis.now=()=>1700000000000;globalThis.hashStr=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  globalThis.load=raw=>raw;
  globalThis.esc=s=>String(s);globalThis.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));globalThis.sequelDay=()=> '2026-08-15';
  globalThis.save=()=>true;globalThis.sequelDefaults=()=>{};globalThis.renderGarden=()=>{};globalThis.renderCompanion=()=>'';globalThis.companionHTML=()=>'';
  globalThis.renderArcade=()=>{};globalThis.renderProfile=()=>{};globalThis.secondsPerLeaf=()=>100;globalThis.wire=()=>{};globalThis.boot=async()=>{};
  globalThis.renderPlant=()=>'<svg></svg>';globalThis.plantCard=p=>'<button data-plant="'+p.id+'"></button>';globalThis.requestCard=()=>'';
  globalThis.slotCap=()=>({sun:3,bright:6,shade:3,cabinet:4});globalThis.ZONE_IDS=['sun','bright','shade','cabinet'];
  globalThis.$=sel=>document.querySelector(sel);globalThis.modal=()=>{};globalThis.closeModal=()=>{};globalThis.toast=()=>{};globalThis.bad=()=>{};globalThis.sparkle=()=>{};globalThis.sfx=()=>{};
  globalThis.renderTop=()=>{};globalThis.renderShop=()=>{};globalThis.go=()=>{};globalThis.shopTab='plants';globalThis.screen='profile';
  globalThis.anyFreeSlot=()=> 'bright';globalThis.newPlant=(speciesId,options={})=>{const p={id:S.nextId++,speciesId,health:100,leaves:[],...options};S.plants.push(p);return p};globalThis.removePlantFromRoom=()=>{};globalThis.bumpQuest=()=>{};globalThis.seasonAction=()=>{};
  globalThis.ARCADE={GAMES:{}};globalThis.A={arcadeReward:()=>''};
  globalThis.S={coins:100,gems:2,level:1,nextId:8,plants:[{id:7,speciesId:'barrel',health:100,leaves:[]}],inv:{fertilizer:1},decor:{rug:2,lights:1},dex:{},sequel:{lead:'sean',gardenMode:'estate'},estate:{resources:{glass:0,timber:0,copper:0,pollen:0},rooms:{fernery:{companions:{Joey:{bond:0},Salem:{bond:0},Trace:{bond:0}}}}}};
`,context);
run('js/save-migrations.js');
run('js/sequel-v5.js');
const T=context.SEQUEL_V5_TEST;

context.S.estate=undefined;
T.v5Defaults();
assert.equal(context.S.estate.rooms.fernery.status,'neglected','fresh saves must initialize the estate before the first render');
assert.equal(context.S.sequel.gardenMode,'estate');
assert.equal(context.S.sequel.petGames.Joey.plays,0);
assert.equal(context.S.sequel.ownerTools.unlocked,false);
assert.equal(T.v5OwnedDecor().length,3,'every owned decor instance should be spatially represented');
assert.deepEqual(Object.keys(context.ARCADE.GAMES),['joeytrail','salempounce','tracecache']);
assert.deepEqual(JSON.parse(JSON.stringify(T.V5_PET_IDS)),{joeytrail:'Joey',salempounce:'Salem',tracecache:'Trace'});
const timberBeforePet=context.S.estate.resources.timber;
context.A.arcadeReward({id:'joeytrail',score:12,won:true});
assert.equal(context.S.sequel.petGames.Joey.plays,1);assert.equal(context.S.sequel.petGames.Joey.wins,1);
assert.equal(context.S.estate.resources.timber,timberBeforePet+1);assert.equal(context.S.inv.fertilizer,2);
assert.equal(context.S.estate.rooms.fernery.companions.Joey.bond,1);

const localOwnerCode=String.fromCharCode(103,111,100,49);
assert.equal(T.v5OwnerCodeMatches(localOwnerCode),true);
assert.equal(T.v5OwnerCodeMatches('garden'),false);
const before={coins:context.S.coins,gems:context.S.gems};
const coinGrant=T.v5ApplyGrant('coins');
assert.equal(context.S.coins,before.coins+2000);assert.equal(coinGrant.reversed,false);
assert.equal(context.S.sequel.ownerTools.history.length,1);
assert.equal(T.v5ReverseGrant(coinGrant.id),true);assert.equal(context.S.coins,before.coins);
assert.equal(context.S.sequel.ownerTools.history[0].reversed,true);

const plantGrant=T.v5ApplyGrant('plant:thai');
assert.equal(plantGrant.plantId,8);assert.equal(context.S.nextId,9);
assert.equal(context.S.plants.some(p=>p.id===7),true,'existing canonical plant id must survive owner grants');
assert.equal(context.S.plants.some(p=>p.id===8&&p.speciesId==='thai'),true);
assert.equal(T.v5ReverseGrant(plantGrant.id),true);
assert.equal(context.S.plants.some(p=>p.id===7),true);assert.equal(context.S.plants.some(p=>p.id===8),false);
assert.equal(context.S.nextId,9,'reversal must never renumber or reuse ids');

const glassBeforeSupplies=context.S.estate.resources.glass;
T.v5ApplyGrant('supplies');
assert.equal(context.S.inv.fertilizer,7);assert.equal(context.S.estate.resources.glass,glassBeforeSupplies+1);
assert.equal(context.S.estate.resources.pollen,1);
T.v5CreateGiftDraft('starter');
const draft=context.S.sequel.ownerTools.giftDrafts[0];
assert.equal(draft.status,'needs-secure-backend');
assert.equal('code' in draft,false);assert.equal('token' in draft,false);
assert.equal(T.GIFT_SERVICE_V5.configured(),false);

console.log('V5 checks passed: both-mode state, spatial owned decor, three pet games, reversible owner grants, and non-redeemable gift drafts are functional.');
