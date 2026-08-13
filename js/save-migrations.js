/* Forward-only save upgrades. Existing values always win; migrations only add
   fields that older builds did not know about. Unknown fields are retained so
   a newer save can safely pass through this build without being truncated. */
const GLASSHOUSE_SAVE_VERSION=3;
const GLASSHOUSE_SEQUEL_DEFAULTS={
  lead:null,legacy:1,season:0,seasonClaimed:false,glassRooms:0,showWins:0,
  secret:false,lastSeed:null,lastMorning:null,visitors:[],request:null,
  favoriteIds:[],scenePage:0,events:{},sunstoneClaims:[],showRecords:{},
  companionDays:{},weatherDay:'',
};
const saveObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const saveArray=value=>Array.isArray(value)?value:[];

function migratePlantSave(plant){
  const p=saveObject(plant);
  return {
    nick:null,potId:'nursery',soilId:'basic',zone:'bright',water:80,food:70,
    health:100,growth:0,pathScore:{sun:0,bright:0,shade:0},path:'bright',
    shading:'matte',varieg:'none',pests:false,moss:false,rotated:0,misted:0,
    pal:null,hybrid:false,hybridName:null,...p,
    pathScore:{sun:0,bright:0,shade:0,...saveObject(p.pathScore)},
    leaves:saveArray(p.leaves).map(leaf=>({fen:0,varieg:'none',unfurl:1,...saveObject(leaf)})),
  };
}

function migrateSaveObject(value){
  const prior=saveObject(value),base=blankSave();
  const migrated={...base,...prior};
  ['inv','decor','dex','ach','best','played','visited','stats'].forEach(key=>{
    migrated[key]={...saveObject(base[key]),...saveObject(prior[key])};
  });
  ['lab','market','alerts','memorial','quests','album'].forEach(key=>{
    migrated[key]=saveArray(prior[key]);
  });
  migrated.plants=saveArray(prior.plants).map(migratePlantSave);
  migrated.sequel={...GLASSHOUSE_SEQUEL_DEFAULTS,...saveObject(prior.sequel)};
  ['visitors','favoriteIds','sunstoneClaims'].forEach(key=>{
    migrated.sequel[key]=saveArray(prior.sequel?.[key]);
  });
  ['events','showRecords','companionDays'].forEach(key=>{
    migrated.sequel[key]={...saveObject(prior.sequel?.[key])};
  });
  if(prior.nextId===undefined){
    const ids=[...migrated.plants,...migrated.lab].map(item=>Number(item.id)||0);
    migrated.nextId=Math.max(0,...ids)+1;
  }
  migrated.v=GLASSHOUSE_SAVE_VERSION;
  return migrated;
}

const loadBeforeMigrations=load;
load=function(raw){
  if(!raw)return loadBeforeMigrations(raw);
  let parsed;
  try{parsed=JSON.parse(raw)}catch(e){return loadBeforeMigrations(raw)}
  if(!parsed||!Array.isArray(parsed.plants))return loadBeforeMigrations(raw);
  const from=Number(parsed.v)||1,migrated=migrateSaveObject(parsed);
  const result=loadBeforeMigrations(JSON.stringify(migrated));
  if(result&&from<GLASSHOUSE_SAVE_VERSION)result.migratedFrom=from;
  return result;
};
