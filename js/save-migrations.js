/* Forward-only save upgrades. Existing values always win; migrations only add
   fields that older builds did not know about. Unknown fields are retained so
   a newer save can safely pass through this build without being truncated. */
const GLASSHOUSE_SAVE_VERSION=6;
const GLASSHOUSE_RAW_BACKUP_KEY='sabrina-glasshouse-pre-estate-v3-backup';
const GLASSHOUSE_V5_BACKUP_KEY='sabrina-glasshouse-pre-v5-backup';
const GLASSHOUSE_V6_BACKUP_KEY='sabrina-glasshouse-pre-v6-backup';
const GLASSHOUSE_SEQUEL_DEFAULTS={
  lead:null,legacy:1,season:0,seasonClaimed:false,glassRooms:0,showWins:0,
  secret:false,lastSeed:null,lastMorning:null,visitors:[],request:null,
  favoriteIds:[],scenePage:0,events:{},sunstoneClaims:[],showRecords:{},
  companionDays:{},weatherDay:'',gardenMode:'estate',identityVersion:1,
  decorLayout:{},identityStarters:{sabrina:false,sean:false},
  petGames:{
    Joey:{plays:0,wins:0,best:0,lastPlayed:null},
    Salem:{plays:0,wins:0,best:0,lastPlayed:null},
    Trace:{plays:0,wins:0,best:0,lastPlayed:null},
  },
  ownerTools:{
    unlocked:false,history:[],giftDrafts:[],
    giftService:{configured:false,endpoint:null},
  },
};
const saveObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const saveArray=value=>Array.isArray(value)?value:[];

const FERNERY_ESTATE_DEFAULTS={
  version:3,activeRoom:'fernery',resources:{glass:2,timber:2,copper:1,pollen:0},
  heirloomIds:[],shells:{fernery:true,sunstone:false,moon:false,secret:false},
  history:{events:{},shows:{},visitors:[]},
  grounds:{decorLayout:{},storyVisits:[]},
  plantAreas:{},
  areaAssignmentsSeeded:false,
  areas:{
    outside:{lastVisit:null},
    greenhouse:{profile:'balanced',lastVisit:null,lastCondensation:null,condensationCount:0},
  },
  rooms:{fernery:{
    status:'neglected',diagnosed:{pane:false,bench:false,drain:false},
    repairs:{pane:null,bench:null,drain:null},placements:{},decor:{d1:null,d2:null},
    letterStep:0,clues:[],chapterComplete:false,nextChapter:null,openedAt:null,starterGuild:null,
    companions:{Joey:{bond:0,lastDay:null,clues:[]},Salem:{bond:0,lastDay:null,clues:[]},Trace:{bond:0,lastDay:null,clues:[]}},
    visitors:[],exhibitions:[],exhibitionDraft:{plantIds:[],decor:'moss',story:'renewal'},
    minigames:{irrigation:{solved:false,best:null,lastRewardDay:null},pollination:{solved:false,best:null,lastRewardDay:null,prep:0}},
  }},
};

function mergeSaveDefaults(defaults,value){
  const prior=saveObject(value),out={...defaults,...prior};
  Object.keys(defaults).forEach(key=>{
    if(Array.isArray(defaults[key]))out[key]=saveArray(prior[key]);
    else if(defaults[key]&&typeof defaults[key]==='object')out[key]=mergeSaveDefaults(defaults[key],prior[key]);
  });
  return out;
}

function companionBondsFromLegacy(days){
  const bonds={Joey:0,Salem:0,Trace:0};
  Object.keys(saveObject(days)).forEach(key=>Object.keys(bonds).forEach(name=>{
    if(key.endsWith(':'+name)&&days[key])bonds[name]++;
  }));
  return bonds;
}

function migrateEstateSave(priorEstate,priorSequel){
  const existing=saveObject(priorEstate),legacy=saveObject(priorSequel);
  const estate=mergeSaveDefaults(FERNERY_ESTATE_DEFAULTS,existing);
  estate.version=Math.max(3,Number(existing.version)||3);
  estate.heirloomIds=saveArray(existing.heirloomIds).length?saveArray(existing.heirloomIds):saveArray(legacy.favoriteIds).slice();
  estate.history.events={...saveObject(legacy.events),...saveObject(existing.history?.events)};
  estate.history.shows={...saveObject(legacy.showRecords),...saveObject(existing.history?.shows)};
  estate.history.visitors=saveArray(existing.history?.visitors).length?saveArray(existing.history.visitors):saveArray(legacy.visitors).slice();
  estate.shells.sunstone=existing.shells?.sunstone??Number(legacy.glassRooms)>=2;
  estate.shells.moon=existing.shells?.moon??Number(legacy.glassRooms)>=1;
  estate.shells.secret=existing.shells?.secret??!!legacy.secret;
  if(!Object.keys(existing).length){
    const credit=Math.max(0,Number(legacy.glassRooms)||0);
    estate.resources.glass+=credit*2;
    estate.resources.timber+=credit;
    estate.resources.copper+=Math.floor(credit/2);
    const bonds=companionBondsFromLegacy(legacy.companionDays);
    Object.keys(bonds).forEach(name=>estate.rooms.fernery.companions[name].bond=bonds[name]);
  }
  estate.rooms.fernery.placements=saveObject(estate.rooms.fernery.placements);
  estate.rooms.fernery.visitors=saveArray(estate.rooms.fernery.visitors);
  estate.rooms.fernery.exhibitions=saveArray(estate.rooms.fernery.exhibitions);
  estate.rooms.fernery.clues=saveArray(estate.rooms.fernery.clues);
  return estate;
}

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
  Object.keys(GLASSHOUSE_SEQUEL_DEFAULTS).forEach(key=>{
    if(migrated.sequel[key]===undefined)migrated.sequel[key]=GLASSHOUSE_SEQUEL_DEFAULTS[key];
  });
  ['visitors','favoriteIds','sunstoneClaims'].forEach(key=>{
    migrated.sequel[key]=saveArray(prior.sequel?.[key]);
  });
  ['events','showRecords','companionDays'].forEach(key=>{
    migrated.sequel[key]={...saveObject(prior.sequel?.[key])};
  });
  migrated.sequel.decorLayout={...saveObject(prior.sequel?.decorLayout)};
  migrated.sequel.identityStarters={...GLASSHOUSE_SEQUEL_DEFAULTS.identityStarters,...saveObject(prior.sequel?.identityStarters)};
  migrated.sequel.petGames=mergeSaveDefaults(GLASSHOUSE_SEQUEL_DEFAULTS.petGames,prior.sequel?.petGames);
  migrated.sequel.ownerTools=mergeSaveDefaults(GLASSHOUSE_SEQUEL_DEFAULTS.ownerTools,prior.sequel?.ownerTools);
  if(prior.nextId===undefined){
    const ids=[...migrated.plants,...migrated.lab].map(item=>Number(item.id)||0);
    migrated.nextId=Math.max(0,...ids)+1;
  }
  migrated.estate=migrateEstateSave(prior.estate,prior.sequel);
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
  if(from<GLASSHOUSE_SAVE_VERSION&&typeof localStorage!=='undefined'){
    try{
      if(!localStorage.getItem(GLASSHOUSE_RAW_BACKUP_KEY))localStorage.setItem(GLASSHOUSE_RAW_BACKUP_KEY,raw);
      if(!localStorage.getItem(GLASSHOUSE_V5_BACKUP_KEY))localStorage.setItem(GLASSHOUSE_V5_BACKUP_KEY,raw);
      if(!localStorage.getItem(GLASSHOUSE_V6_BACKUP_KEY))localStorage.setItem(GLASSHOUSE_V6_BACKUP_KEY,raw);
    }catch(e){}
  }
  const result=loadBeforeMigrations(JSON.stringify(migrated));
  if(result&&from<GLASSHOUSE_SAVE_VERSION)result.migratedFrom=from;
  return result;
};
