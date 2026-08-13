/* The Glasshouse Letters — the estate engine.
   Plants remain canonical collection objects. Rooms only store their ids. */

const ESTATE_ANCHORS=[
  {id:'a1',x:10,y:28,level:'upper'},{id:'a2',x:28,y:25,level:'upper'},
  {id:'a3',x:47,y:27,level:'upper'},{id:'a4',x:68,y:24,level:'upper'},
  {id:'a5',x:86,y:29,level:'upper'},{id:'a6',x:17,y:50,level:'bench'},
  {id:'a7',x:38,y:49,level:'bench'},{id:'a8',x:61,y:48,level:'bench'},
  {id:'a9',x:83,y:51,level:'bench'},{id:'a10',x:10,y:76,level:'floor'},
  {id:'a11',x:28,y:72,level:'floor'},{id:'a12',x:50,y:76,level:'floor'},
  {id:'a13',x:72,y:72,level:'floor'},{id:'a14',x:90,y:77,level:'floor'},
];
const ESTATE_ANCHOR_BY_ID=Object.fromEntries(ESTATE_ANCHORS.map(a=>[a.id,a]));
const ESTATE_DECOR={
  moss:{name:'Living moss panel',icon:'🌿',effect:'Humidity +8',climate:{humidity:8}},
  stone:{name:'River-stone basin',icon:'🪨',effect:'Water balance −7',climate:{water:-7}},
  lantern:{name:'Letter lantern',icon:'🏮',effect:'Light +6',climate:{light:6}},
};
const FERNERY_BLUEPRINTS={
  pane:{
    prism:{name:'Prism panes',icon:'◇',desc:'Restores bright shafts for sculptural and desert forms.',effects:{light:26,humidity:-8},cost:{glass:2,copper:1}},
    shade:{name:'Cedar shade lattice',icon:'▦',desc:'Softens the sun and holds moist air for understory plants.',effects:{light:-10,humidity:18},cost:{timber:2,glass:1}},
  },
  bench:{
    mist:{name:'Capillary mist bench',icon:'≋',desc:'A humid nursery for ferns, aroids and fresh cuttings.',effects:{humidity:27,water:7},cost:{glass:1,copper:1,timber:1}},
    sand:{name:'Sun-warmed sand bench',icon:'◌',desc:'A fast-drying display for cacti and compact succulents.',effects:{light:10,humidity:-12,water:-13},cost:{timber:2,glass:1}},
  },
  drain:{
    reed:{name:'Rain-reed filter',icon:'♒',desc:'Cleans overflow while keeping a soft, fern-friendly reservoir.',effects:{humidity:12,water:-18},cost:{timber:1,copper:1}},
    stone:{name:'Stone rill',icon:'⌁',desc:'Moves water out quickly and creates a dry, sunlit edge.',effects:{light:6,humidity:-9,water:-40},cost:{glass:1,copper:1}},
  },
};
const FAULT_COPY={
  pane:{name:'Broken roof pane',icon:'🪟',problem:'Cold glare leaks through a broken pane; light swings wildly.',companion:'Salem'},
  bench:{name:'Dry propagation bench',icon:'🪵',problem:'The old bench cannot hold a stable pocket of humidity.',companion:'Trace'},
  drain:{name:'Blocked floor drain',icon:'💧',problem:'Standing water has nowhere safe to travel.',companion:'Joey'},
};
const MATERIAL_META={glass:{name:'Salvaged glass',icon:'◇',price:65},timber:{name:'Cedar timber',icon:'▤',price:55},copper:{name:'Copper fittings',icon:'◉',price:80}};
const estateDay=()=>typeof sequelDay==='function'?sequelDay():new Date().toISOString().slice(0,10);

function ensureEstate(){
  if(!S)return null;
  if(!S.estate?.rooms?.fernery)S.estate=typeof migrateEstateSave==='function'?migrateEstateSave(S.estate,S.sequel):(S.estate||{});
  const r=S.estate.rooms.fernery;
  const seen=new Set();
  Object.keys(r.placements).forEach(anchor=>{
    const id=Number(r.placements[anchor]);
    if(!ESTATE_ANCHOR_BY_ID[anchor]||seen.has(id)||!S.plants.some(p=>p.id===id))delete r.placements[anchor];
    else{r.placements[anchor]=id;seen.add(id)}
  });
  ['d1','d2'].forEach(id=>{if(r.decor[id]&&!ESTATE_DECOR[r.decor[id]])r.decor[id]=null});
  return S.estate;
}
const ferneryRoom=()=>ensureEstate().rooms.fernery;
const estatePlant=id=>S.plants.find(p=>p.id===Number(id));
const placedEntries=()=>Object.entries(ferneryRoom().placements).map(([anchor,id])=>({anchor,plant:estatePlant(id)})).filter(x=>x.plant);
const placedIds=()=>placedEntries().map(x=>x.plant.id);
const repairCount=()=>Object.values(ferneryRoom().repairs).filter(Boolean).length;
const diagnosedCount=()=>Object.values(ferneryRoom().diagnosed).filter(Boolean).length;

function roomClimate(){
  const r=ferneryRoom(),c={light:38,humidity:32,water:72};
  Object.entries(r.repairs).forEach(([fault,id])=>{
    const bp=FERNERY_BLUEPRINTS[fault]?.[id];
    if(bp)Object.entries(bp.effects).forEach(([key,value])=>c[key]+=value);
  });
  Object.values(r.decor).forEach(id=>{
    const decor=ESTATE_DECOR[id];
    if(decor)Object.entries(decor.climate).forEach(([key,value])=>c[key]+=value);
  });
  Object.keys(c).forEach(key=>c[key]=clamp(Math.round(c[key]),5,100));
  return c;
}
function isDryPlant(p){const sp=SPECIES_BY_ID[p.speciesId];return sp.tags.includes('cactus')||sp.tags.includes('sunstone')||sp.tags.includes('succulent')||sp.tags.includes('euphorbia')}
function isUnderstoryPlant(p){const sp=SPECIES_BY_ID[p.speciesId];return sp.shape==='fern'||sp.tags.includes('humidity')||sp.light==='shade'}
function anchorAdjacent(a,b){const x=ESTATE_ANCHOR_BY_ID[a],y=ESTATE_ANCHOR_BY_ID[b];return !!x&&!!y&&Math.hypot(x.x-y.x,x.y-y.y)<=25}
function guildState(){
  const c=roomClimate(),entries=placedEntries();let dryPairs=0,underPairs=0;
  for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++)if(anchorAdjacent(entries[i].anchor,entries[j].anchor)){
    if(isDryPlant(entries[i].plant)&&isDryPlant(entries[j].plant))dryPairs++;
    if(isUnderstoryPlant(entries[i].plant)&&isUnderstoryPlant(entries[j].plant))underPairs++;
  }
  return{
    dry:{pairs:dryPairs,active:dryPairs>0&&c.light>=54&&c.humidity<=50&&c.water<=55},
    understory:{pairs:underPairs,active:underPairs>0&&c.humidity>=55&&c.light<=68&&c.water>=42},
  };
}
function plantEstateFit(p){
  const c=roomClimate(),dry=isDryPlant(p),under=isUnderstoryPlant(p),sp=SPECIES_BY_ID[p.speciesId];
  const target=dry?{light:78,humidity:24,water:28}:under?{light:42,humidity:76,water:62}:{light:sp.light==='sun'?74:sp.light==='shade'?35:55,humidity:48,water:50};
  let fit=100-(Math.abs(c.light-target.light)*.38+Math.abs(c.humidity-target.humidity)*.34+Math.abs(c.water-target.water)*.28);
  const g=guildState();if(dry&&g.dry.active)fit+=10;if(under&&g.understory.active)fit+=10;
  return clamp(Math.round(fit),10,100);
}
function climateLabel(value){return value>=70?'high':value>=45?'balanced':'low'}
function activeGuildName(){const g=guildState();return g.dry.active&&g.understory.active?'Two-guild mosaic':g.dry.active?'Sunstone dry guild':g.understory.active?'Fern understory guild':'No active guild yet'}

function placePlantAt(anchor,id){
  const r=ferneryRoom(),p=estatePlant(id);if(!p||!ESTATE_ANCHOR_BY_ID[anchor])return false;
  Object.keys(r.placements).forEach(a=>{if(Number(r.placements[a])===p.id)delete r.placements[a]});
  r.placements[anchor]=p.id;updateFerneryStory();save();return true;
}
function removePlantFromRoom(id){const r=ferneryRoom();Object.keys(r.placements).forEach(a=>{if(Number(r.placements[a])===Number(id))delete r.placements[a]});save()}
function unlockedDecor(){
  const r=ferneryRoom(),out=[];
  if(['mist','reed'].some(x=>Object.values(r.repairs).includes(x)))out.push('moss');
  if(['sand','stone'].some(x=>Object.values(r.repairs).includes(x)))out.push('stone');
  if(r.minigames.pollination.solved)out.push('lantern');
  return out;
}
function placeDecor(slot,id){
  const r=ferneryRoom();if(!['d1','d2'].includes(slot)||!unlockedDecor().includes(id))return false;
  Object.keys(r.decor).forEach(s=>{if(r.decor[s]===id)r.decor[s]=null});r.decor[slot]=id;save();return true;
}
function canAfford(cost){const bag=ensureEstate().resources;return Object.entries(cost).every(([k,n])=>(bag[k]||0)>=n)}
function costText(cost){return Object.entries(cost).map(([k,n])=>`${MATERIAL_META[k].icon}${n}`).join(' ')}

function diagnoseFault(fault){
  const r=ferneryRoom();if(!FAULT_COPY[fault])return;
  if(!r.diagnosed[fault]){r.diagnosed[fault]=true;r.clues.push({at:now(),kind:'diagnosis',text:FAULT_COPY[fault].problem});save();sfx('tap');toast(`${FAULT_COPY[fault].name} diagnosed. ${FAULT_COPY[fault].companion} may notice more.`,'gold')}
  faultModal(fault);
}
function buildRepair(fault,id){
  const r=ferneryRoom(),bp=FERNERY_BLUEPRINTS[fault]?.[id];if(!bp||!r.diagnosed[fault]||r.repairs[fault])return false;
  if(fault==='drain'&&!r.minigames.irrigation.solved){toast('Map the blocked pipe in Irrigation Rescue first.','bad');return false}
  if(!canAfford(bp.cost)){toast('The restoration cart has the missing materials.','bad');return false}
  Object.entries(bp.cost).forEach(([k,n])=>ensureEstate().resources[k]-=n);r.repairs[fault]=id;r.status=repairCount()>=2?'recovering':'worksite';
  r.clues.push({at:now(),kind:'repair',text:`${bp.name} built: ${bp.desc}`});
  if(typeof seasonAction==='function')seasonAction('glass',1);updateFerneryStory();save();closeModal();sparkle(bp.icon,18);sfx('thunk');toast(`${bp.name} changed the Fernery climate.`,'gold');renderGarden();return true;
}

function chooseStarterGuild(kind){
  const r=ferneryRoom();if(r.starterGuild)return;
  const ids=kind==='dry'?['barrel','haworthia']:['birdsnest','maidenhair'];const anchors=kind==='dry'?['a12','a13']:['a6','a7'];
  const made=[];ids.forEach((id,i)=>{const z=anyFreeSlot();if(z){const p=newPlant(id,{zone:z,leaves:2,nick:i===0?(kind==='dry'?'Ember':'Mina'):null});made.push(p);placePlantAt(anchors[i],p.id)}});
  r.starterGuild=kind;r.clues.push({at:now(),kind:'choice',text:kind==='dry'?'The Sunstone starter tray was carried inside.':'The understory starter tray was carried inside.'});save();sparkle(kind==='dry'?'🌵':'🌿',22);toast(`${kind==='dry'?'Sunstone':'Understory'} starter guild added to the collection.`,'pink');renderGarden();
}

function storyChecks(){
  const r=ferneryRoom(),g=guildState();return{
    first:diagnosedCount()===3&&r.minigames.irrigation.solved,
    second:repairCount()>=2&&placedIds().length>=3&&(g.dry.active||g.understory.active)&&r.minigames.pollination.solved,
    third:['Joey','Salem','Trace'].every(n=>r.companions[n].clues.includes('fernery'))&&r.visitors.length>0&&r.exhibitions.length>0,
  }
}
function updateFerneryStory(silent=false){
  const r=ferneryRoom(),c=storyChecks();let advanced=false;
  if(r.letterStep<1&&c.first){r.letterStep=1;r.clues.push({at:now(),kind:'letter',text:'Letter I: “Water remembers the route home.”'});ensureEstate().resources.glass++;advanced=true;if(!silent)toast('Letter I opened beneath the drain map.','pink')}
  if(r.letterStep<2&&c.second){r.letterStep=2;r.clues.push({at:now(),kind:'letter',text:`Letter II: “A room lives when its plants choose one another.” ${activeGuildName()} answered.`});advanced=true;if(!silent)toast('Letter II opened—the room has become a habitat.','pink')}
  if(r.letterStep<3&&c.third){r.letterStep=3;r.chapterComplete=true;r.status='restored';S.sequel.glassRooms=Math.max(1,S.sequel.glassRooms||0);S.decor.cabinet=Math.max(1,S.decor.cabinet||0);S.sequel.legacy=Math.max(1,S.sequel.legacy||0)+1;r.clues.push({at:now(),kind:'letter',text:'Letter III: “Restoration is not returning. It is making room for what comes next.”'});advanced=true;if(!silent){sparkle('✉️',28);sfx('fanfare');toast('The Fernery chapter is complete.','gold')}}
  return advanced;
}

function compositionKey(){const r=ferneryRoom(),c=roomClimate();return `${placedIds().slice().sort((a,b)=>a-b).join('.')}:${Object.values(r.repairs).join('.')}:${Object.values(r.decor).join('.')}:${c.light}.${c.humidity}.${c.water}`}
function generateFerneryVisitor(){
  const r=ferneryRoom();updateFerneryStory(true);if(r.letterStep<2){toast('Restore a working habitat and open Letter II first.','bad');return null}
  const key=compositionKey(),last=r.visitors[0];if(last&&last.compositionKey===key){toast(`${last.name}'s entry already records this exact room.`);return last}
  const entries=placedEntries(),g=guildState(),c=roomClimate(),bestCompanion=Object.entries(r.companions).sort((a,b)=>b[1].bond-a[1].bond)[0][0];
  const names=entries.slice().sort((a,b)=>plantEstateFit(b.plant)-plantEstateFit(a.plant)).slice(0,2).map(x=>x.plant.nick||plantName(x.plant));
  const visitor=g.dry.active&&!g.understory.active?{name:'Arlo Mesa, desert grower',focus:'the disciplined dry edge'}:g.understory.active&&!g.dry.active?{name:'Dr. Imani Vale, fern ecologist',focus:'the breathing understory'}:{name:'Mae Rowan, estate historian',focus:'the meeting of unlike plants'};
  const repair=Object.entries(r.repairs).find(([,id])=>id)?.[1]||'careful first repair';
  const text=`${visitor.name} studied ${names.join(' and ')||'the recovering benches'}, then praised ${visitor.focus}. ${bestCompanion} led the tour past the ${FERNERY_BLUEPRINTS.pane[repair]?.name||FERNERY_BLUEPRINTS.bench[repair]?.name||FERNERY_BLUEPRINTS.drain[repair]?.name||repair}. Room climate: ${c.light} light, ${c.humidity} humidity, ${c.water} water.`;
  const record={id:`fv${now()}`,at:now(),name:visitor.name,text,guild:activeGuildName(),plantIds:entries.map(x=>x.plant.id),climate:{...c},companion:bestCompanion,compositionKey:key};
  r.visitors.unshift(record);r.visitors=r.visitors.slice(0,20);ensureEstate().history.visitors.unshift(record);S.sequel.visitors.unshift(record);updateFerneryStory();save();sparkle('✍️',18);toast(`${visitor.name} signed the visitor book.`,'gold');renderGarden();return record;
}

function companionFerneryMoment(name){
  const r=ferneryRoom(),c=r.companions[name],need={Joey:'drain',Salem:'pane',Trace:'bench'}[name];if(!c)return;
  if(!r.diagnosed[need]){toast(`${name} keeps returning to the ${FAULT_COPY[need].name.toLowerCase()}. Diagnose it together.`);return}
  const first=!c.clues.includes('fernery'),today=estateDay();if(first){c.clues.push('fernery');c.bond++;const material={Joey:'copper',Salem:'glass',Trace:'timber'}[name];ensureEstate().resources[material]++;r.clues.push({at:now(),kind:'companion',text:{Joey:'Joey follows the wet pawprints to a buried copper elbow.',Salem:'Salem’s black silhouette reveals a hairline crack beside the broken pane.',Trace:'Trace curls beneath the bench where an old cedar brace is still sound.'}[name]});toast(`${name} found ${MATERIAL_META[material].icon} ${MATERIAL_META[material].name}. Bond ${c.bond}.`,'gold');sparkle('🐾',14)}else if(c.lastDay!==today){c.bond++;S.coins+=25;toast(`${name} helped with the daily room round. +25🪙`)}else toast(`${name} is settled into today’s Fernery role.`);
  c.lastDay=today;updateFerneryStory();save();renderGarden();
}

function exhibitionBreakdown(ids,decor,story){
  const plants=ids.map(estatePlant).filter(Boolean),r=ferneryRoom(),g=guildState();if(!plants.length)return{total:0};
  const avg=fn=>plants.reduce((a,p)=>a+fn(p),0)/plants.length;
  const health=Math.round(avg(p=>p.health)*.25),climate=Math.round(avg(plantEstateFit)*.2);
  const ecology=(g.dry.active||g.understory.active?16:4)+(g.dry.active&&g.understory.active?4:0);
  const composition=Math.min(15,new Set(plants.map(p=>p.speciesId)).size*3+plants.length);
  const levels=new Set(plants.map(p=>Object.entries(r.placements).find(([,id])=>Number(id)===p.id)?.[0]).map(id=>ESTATE_ANCHOR_BY_ID[id]?.level).filter(Boolean)).size;
  const layout=Math.min(10,levels*3+Object.values(r.decor).filter(Boolean).length*2);
  const decorPlaced=Object.values(r.decor).includes(decor),decorMatch=decorPlaced&&((decor==='moss'&&g.understory.active)||(decor==='stone'&&g.dry.active)||(decor==='lantern'&&plants.length>=4));
  const styling=decorMatch?10:decorPlaced?6:2;
  const narrative=story==='renewal'?Math.min(10,repairCount()*4):story==='lineage'?Math.min(10,plants.filter(p=>ensureEstate().heirloomIds.includes(p.id)||p.hybrid).length*5):Math.min(10,['Joey','Salem','Trace'].filter(n=>r.companions[n].clues.includes('fernery')).length*3+1);
  const prep=Math.min(10,r.minigames.pollination.prep||0);
  return{total:health+climate+ecology+composition+layout+styling+narrative+prep,health,climate,ecology,composition,layout,styling,narrative,prep};
}
function stageFerneryExhibition(){
  const r=ferneryRoom(),d=r.exhibitionDraft,ids=d.plantIds.filter(id=>placedIds().includes(id)).slice(0,5);if(ids.length<3){toast('Choose at least three Fernery plants.','bad');return}
  const sc=exhibitionBreakdown(ids,d.decor,d.story),day=estateDay(),full=!r.exhibitions.some(x=>x.day===day),reward=full?(sc.total>=82?220:sc.total>=66?135:75):15;
  S.coins+=reward;if(full&&sc.total>=82){S.gems++;S.sequel.legacy++}r.minigames.pollination.prep=0;
  const outcome={id:`ex${now()}`,at:now(),day,plantIds:ids.slice(),decor:d.decor,story:d.story,score:sc.total,breakdown:sc,reward};r.exhibitions.unshift(outcome);r.exhibitions=r.exhibitions.slice(0,20);
  if(typeof seasonAction==='function')seasonAction('show',1);bumpQuest('show',1);updateFerneryStory();save();closeModal();renderGarden();sfx(sc.total>=82?'fanfare':'coin');sparkle(sc.total>=82?'🏆':'🎗️',20);
  modal(`<h3>${sc.total>=82?'🏆 Fernery Laureate':sc.total>=66?'🎗️ Living Room Ribbon':'A promising opening'} · ${sc.total}</h3><p>${ids.map(id=>esc(estatePlant(id).nick||plantName(estatePlant(id)))).join(', ')} told a ${d.story} story.</p><div class="scorebreak"><span>Plant health <b>${sc.health}</b></span><span>Climate fit <b>${sc.climate}</b></span><span>Guild ecology <b>${sc.ecology}</b></span><span>Composition <b>${sc.composition}</b></span><span>Room layout <b>${sc.layout}</b></span><span>Decor styling <b>${sc.styling}</b></span><span>Narrative <b>${sc.narrative}</b></span><span>Pollinator prep <b>${sc.prep}</b></span></div><p><b>Reward: ${reward}🪙${full&&sc.total>=82?' + 1💎':''}</b>${full?'':' · repeat showing, modest encore reward'}</p><button class="btn" data-close="1">Return to the restored room</button>`);
}

let irrigationSession=null,pollinationSession=null;
const PIPE_KINDS=['source','elbow','straight','elbow','straight','elbow','elbow','straight','elbow','straight','elbow','elbow','straight','elbow','straight','sink'];
const PIPE_START=[0,0,1,2,0,1,3,0,1,1,2,1,0,3,1,0];
function pipeMask(kind,rot){if(kind==='source')return 2;if(kind==='sink')return 1;if(kind==='straight')return rot%2?10:5;return[3,6,12,9][rot%4]}
function pipeConnected(tiles){
  const seen=new Set([0]),queue=[0],dirs=[[-1,0,1,4],[0,1,2,8],[1,0,4,1],[0,-1,8,2]];
  while(queue.length){const i=queue.shift(),row=Math.floor(i/4),col=i%4,mask=pipeMask(PIPE_KINDS[i],tiles[i]);for(const[dr,dc,bit,opp]of dirs){if(!(mask&bit))continue;const nr=row+dr,nc=col+dc;if(nr<0||nr>3||nc<0||nc>3)continue;const ni=nr*4+nc;if(pipeMask(PIPE_KINDS[ni],tiles[ni])&opp&&!seen.has(ni)){seen.add(ni);queue.push(ni)}}}return seen.has(15)
}
const pipeGlyph=(kind,rot)=>kind==='source'?'●':kind==='sink'?'◎':({3:'└',6:'┌',12:'┐',9:'┘',5:'│',10:'─'}[pipeMask(kind,rot)]||'·');
function openIrrigation(){irrigationSession={tiles:PIPE_START.slice(),moves:0,message:''};renderIrrigationModal()}
function renderIrrigationModal(){const s=irrigationSession,r=ferneryRoom();modal(`<h3>💧 Irrigation Rescue</h3><p>Rotate the copper channels to carry water from <b>● source</b> to <b>◎ drain</b>. Check the route when it forms one unbroken line. There is no penalty for trying.</p><div class="pipegrid">${s.tiles.map((rot,i)=>`<button data-pipe="${i}" ${i===0||i===15?'disabled':''} aria-label="Rotate pipe ${i+1}">${pipeGlyph(PIPE_KINDS[i],rot)}</button>`).join('')}</div><div class="gamefeedback ${s.message?'show':''}">${s.message||`${s.moves} turns · first repair earns fittings and timber`}</div><div class="row"><button class="btn ghost" data-close="1">Later</button><button class="btn" id="checkIrrigation">Check route</button></div>${r.minigames.irrigation.solved?'<p class="small">✓ Drain map solved before. Replay is optional and capped to one modest daily reward.</p>':''}`)}
function checkIrrigation(){const s=irrigationSession;if(!pipeConnected(s.tiles)){s.message='The flow stops before the drain. Follow each open pipe edge and turn the break.';renderIrrigationModal();sfx('tap');return false}const r=ferneryRoom(),mg=r.minigames.irrigation,first=!mg.solved,today=estateDay();mg.solved=true;mg.best=mg.best===null?s.moves:Math.min(mg.best,s.moves);if(first){ensureEstate().resources.copper+=2;ensureEstate().resources.timber++;s.message='Flow restored! +2 copper fittings and +1 cedar timber.'}else if(mg.lastRewardDay!==today){S.coins+=20;s.message='Clean route! +20🪙 daily maintenance reward.'}else s.message='Clean route! Today’s maintenance reward was already collected.';mg.lastRewardDay=today;updateFerneryStory();save();renderIrrigationModal();sparkle('💧',18);sfx('water');return true}

function pollinationSymbols(){const ids=placedIds().slice().sort((a,b)=>a-b),pool=['✿','❀','✦','❋','✤','✺'];let seed=ids.reduce((a,n)=>a+n*17,31);return Array.from({length:5},(_,i)=>pool[(seed+i*3+ids.length)%pool.length])}
function openPollination(){if(placedIds().length<3){toast('Place three plants so the pollinator has a real route.','bad');return}pollinationSession={sequence:pollinationSymbols(),input:[],showing:true,tries:0,message:'Study the route, then hide it and guide the moth.'};renderPollinationModal()}
function renderPollinationModal(){const s=pollinationSession,r=ferneryRoom();modal(`<h3>🦋 Pollinator’s Waltz</h3><p>The moon moth memorizes markings from the plants currently placed here. Repeat the five-bloom route to prepare the multi-plant exhibition.</p><div class="pollenmemory">${s.showing?s.sequence.map(x=>`<i>${x}</i>`).join(''):'<span>'+s.input.map(x=>`<i>${x}</i>`).join('')+Array.from({length:5-s.input.length},()=>'<i>·</i>').join('')+'</span>'}</div><div class="pollengrid">${['✿','❀','✦','❋','✤','✺'].map(x=>`<button data-pollen="${x}" ${s.showing?'disabled':''}>${x}</button>`).join('')}</div><div class="gamefeedback show">${s.message}</div><div class="row"><button class="btn ghost" data-close="1">Later</button>${s.showing?'<button class="btn" id="startPollination">I remember—begin</button>':'<button class="btn ghost" id="revealPollination">Show route again</button>'}</div>${r.minigames.pollination.solved?'<p class="small">✓ The pressed-pollen clue is recorded. Replay is optional; preparation rewards refresh once daily.</p>':''}`)}
function pollinationTap(symbol){const s=pollinationSession,expected=s.sequence[s.input.length];if(symbol!==expected){s.tries++;s.input=[];s.showing=true;s.message=`The moth lost the trail at ${symbol}. The route is revealed again—nothing was spent.`;renderPollinationModal();sfx('tap');return false}s.input.push(symbol);if(s.input.length<s.sequence.length){s.message=`${s.input.length}/5 blooms correct`;renderPollinationModal();sfx('tap');return true}const r=ferneryRoom(),mg=r.minigames.pollination,first=!mg.solved,today=estateDay();mg.solved=true;mg.best=mg.best===null?s.tries:Math.min(mg.best,s.tries);if(mg.lastRewardDay!==today){ensureEstate().resources.pollen++;mg.prep=10;mg.lastRewardDay=today;s.message=`Route complete! Pressed pollen recorded; +10 exhibition preparation.`}else s.message='Route complete! Today’s exhibition preparation was already collected.';updateFerneryStory();save();sparkle('🦋',18);sfx('fanfare');renderPollinationModal();return true}

function renderRoomPlant(entry){const a=ESTATE_ANCHOR_BY_ID[entry.anchor],p=entry.plant,fit=plantEstateFit(p),sp=SPECIES_BY_ID[p.speciesId];return `<button class="fernery-plant fit-${fit>=78?'great':fit>=55?'ok':'poor'}" data-room-plant="${p.id}" style="--x:${a.x}%;--y:${a.y}%;--z:${Math.round(a.y)}" aria-label="${esc(p.nick||plantName(p))}, habitat fit ${fit}"><span>${renderPlant(p,{tag:'fernery'+p.id})}</span><b>${esc(p.nick||sp.name)}</b><i>${fit}</i></button>`}
function renderEmptyAnchor(a){return `<button class="fernery-anchor" data-room-anchor="${a.id}" style="--x:${a.x}%;--y:${a.y}%" aria-label="Place a plant here"><i>＋</i></button>`}
function renderFault(fault){const r=ferneryRoom(),copy=FAULT_COPY[fault],repair=r.repairs[fault],bp=repair&&FERNERY_BLUEPRINTS[fault][repair];return `<button class="room-fault ${repair?'fixed':r.diagnosed[fault]?'known':'unknown'} ${fault}" data-estate-fault="${fault}"><i>${bp?bp.icon:copy.icon}</i><span>${bp?bp.name:r.diagnosed[fault]?copy.name:'Inspect'}</span></button>`}
function renderCompanion(name){const r=ferneryRoom(),c=r.companions[name],done=c.clues.includes('fernery');return `<button class="fernery-companion ${name.toLowerCase()} ${done?'working':''}" data-estate-companion="${name}"><i></i><b>${name}</b><small>${done?`bond ${c.bond}`:'has a clue'}</small></button>`}
function renderStoryRail(){const r=ferneryRoom(),checks=storyChecks(),steps=[{n:'I',title:'The water map',done:r.letterStep>=1,need:`${diagnosedCount()}/3 faults · ${r.minigames.irrigation.solved?'route solved':'route unsolved'}`},{n:'II',title:'A living shelf',done:r.letterStep>=2,need:`${repairCount()}/2 repairs · ${placedIds().length}/3 plants · ${activeGuildName()}`},{n:'III',title:'The witness',done:r.letterStep>=3,need:`${['Joey','Salem','Trace'].filter(n=>r.companions[n].clues.includes('fernery')).length}/3 companions · ${r.visitors.length?1:0}/1 visitor · ${r.exhibitions.length?1:0}/1 exhibition`}];return `<button class="letter-rail" data-estate-letter="1"><span>THE FERNERY LETTER</span>${steps.map(s=>`<i class="${s.done?'done':''}"><b>${s.done?'✓':s.n} ${s.title}</b><small>${s.done?'opened':s.need}</small></i>`).join('')}</button>`}
function renderBlueprints(){const r=ferneryRoom();return `<div class="repair-grid">${Object.keys(FAULT_COPY).map(f=>{const chosen=r.repairs[f],bp=chosen&&FERNERY_BLUEPRINTS[f][chosen];return `<button data-estate-fault="${f}" class="repair-card ${chosen?'done':r.diagnosed[f]?'ready':'locked'}"><i>${bp?bp.icon:FAULT_COPY[f].icon}</i><span><b>${bp?bp.name:FAULT_COPY[f].name}</b><small>${chosen?bp.desc:r.diagnosed[f]?'Choose one of two climate builds':'Tap the fault in the room to diagnose it'}</small></span></button>`}).join('')}</div>`}
function renderFernery(){
  ensureEstate();const r=ferneryRoom(),c=roomClimate(),g=guildState(),entries=placedEntries(),placed=new Set(entries.map(x=>x.anchor)),atmo=typeof gardenAtmosphere==='function'?gardenAtmosphere():{className:'',label:'Soft daylight'};
  const neglect=r.status==='neglected'?'neglected':repairCount()>=2?'recovering':'worksite';
  let h=`<div class="estate-toolbar"><button data-estate-view="grounds">‹ Estate grounds</button><span><b>The Fernery</b><small>${r.chapterComplete?'Chapter restored':r.status}</small></span><button data-estate-letter="1">✉ ${r.letterStep}/3</button></div>`;
  h+=`<section class="fernery-scene ${neglect} ${atmo.className} ${r.chapterComplete?'complete':''}"><div class="fernery-sky"></div><div class="fernery-glass"></div><div class="fernery-wall"></div><div class="fernery-floor"></div><div class="fernery-bench"></div><div class="room-climate"><span>☀ <b>${c.light}</b><small>${climateLabel(c.light)} light</small></span><span>≋ <b>${c.humidity}</b><small>${climateLabel(c.humidity)} humidity</small></span><span>💧 <b>${c.water}</b><small>${climateLabel(c.water)} water</small></span></div>${renderFault('pane')}${renderFault('bench')}${renderFault('drain')}${ESTATE_ANCHORS.filter(a=>!placed.has(a.id)).map(renderEmptyAnchor).join('')}${entries.map(renderRoomPlant).join('')}<button class="fernery-decor d1" data-estate-decor="d1">${r.decor.d1?`<i>${ESTATE_DECOR[r.decor.d1].icon}</i><b>${ESTATE_DECOR[r.decor.d1].name}</b>`:'<i>＋</i><b>Decor</b>'}</button><button class="fernery-decor d2" data-estate-decor="d2">${r.decor.d2?`<i>${ESTATE_DECOR[r.decor.d2].icon}</i><b>${ESTATE_DECOR[r.decor.d2].name}</b>`:'<i>＋</i><b>Decor</b>'}</button>${renderCompanion('Joey')}${renderCompanion('Salem')}${renderCompanion('Trace')}<div class="guild-status ${g.dry.active||g.understory.active?'on':''}"><b>${activeGuildName()}</b><span>${g.understory.pairs} understory pair${g.understory.pairs===1?'':'s'} · ${g.dry.pairs} dry pair${g.dry.pairs===1?'':'s'}</span></div></section>`;
  h+=`<div class="estate-resourcebar"><b>Restoration cart</b>${Object.entries(MATERIAL_META).map(([k,m])=>`<span>${m.icon} ${ensureEstate().resources[k]||0}</span>`).join('')}<span>✿ ${ensureEstate().resources.pollen||0}</span><button data-shop="1">Get supplies</button></div>`;
  if(!r.starterGuild)h+=`<div class="starter-choice"><span class="eyebrow">Choose the room’s first promise</span><h3>Which community should lead the restoration?</h3><p>Both are viable. Repairs and placement decide whether it thrives.</p><div><button data-starter="understory"><b>🌿 Fern understory</b><small>Bird’s Nest + Maidenhair · cool, humid adjacency</small></button><button data-starter="dry"><b>🌵 Sunstone edge</b><small>Golden Barrel + Haworthia · bright, dry adjacency</small></button></div></div>`;
  h+=renderStoryRail()+`<h2 class="sec">Restore what the room needs <span class="cap">${repairCount()}/3</span></h2>${renderBlueprints()}<div class="estate-actions"><button data-estate-game="irrigation"><i>💧</i><b>Irrigation Rescue</b><span>${r.minigames.irrigation.solved?'Route mapped · replay optional':'Rotate pipes to map the blocked drain'}</span></button><button data-estate-game="pollination"><i>🦋</i><b>Pollinator’s Waltz</b><span>${r.minigames.pollination.prep?'Exhibition prep +10':r.minigames.pollination.solved?'Clue recorded · prep refreshes daily':'Memorize a route from placed plants'}</span></button><button data-estate-visitor="1" ${r.letterStep<2?'disabled':''}><i>✍️</i><b>Invite a witness</b><span>${r.visitors[0]?r.visitors[0].name:'Generated from the real room composition'}</span></button><button data-estate-exhibition="1" ${placedIds().length<3?'disabled':''}><i>♕</i><b>Fernery Exhibition</b><span>${r.exhibitions[0]?`Best recent score ${Math.max(...r.exhibitions.map(x=>x.score))}`:'Stage 3–5 plants, decor and a story'}</span></button></div>`;
  h+=`<div class="guild-guide"><h3>Plant guild ecology</h3><div><b>🌿 Fern understory</b><span>Place two humidity-loving or shade plants in neighboring anchors. It activates around 55+ humidity, moderate light and available water.</span></div><div><b>🌵 Sunstone dry guild</b><span>Place two cacti or succulents together. It activates below 50 humidity with bright light and fast drainage.</span></div><p>Active guilds add vitality and growth. A poor climate is gently recoverable; Gentle Mode still prevents death.</p></div>`;
  if(r.chapterComplete)h+=`<button class="next-chapter-card" data-estate-letter="1"><b>✉ The final letter is open</b><span>${r.nextChapter?r.nextChapter==='sunstone'?'The Sunstone Walk shell waits beyond the west door.':'The Moon Room shell waits beneath the east stair.':'Choose the estate’s next chapter.'}</span></button>`;
  $('#screen-garden').innerHTML=h;
}

function faultModal(fault){const r=ferneryRoom(),copy=FAULT_COPY[fault],chosen=r.repairs[fault];if(chosen){const bp=FERNERY_BLUEPRINTS[fault][chosen];return modal(`<h3>${bp.icon} ${bp.name}</h3><p>${bp.desc}</p><div class="climate-trade">${Object.entries(bp.effects).map(([k,v])=>`<span>${k}<b>${v>0?'+':''}${v}</b></span>`).join('')}</div><p>This construction is part of the saved room and is visible in the Fernery.</p><button class="btn" data-close="1">Back to the room</button>`)}const choices=FERNERY_BLUEPRINTS[fault];modal(`<h3>${copy.icon} ${copy.name}</h3><p>${copy.problem}</p><p><b>Choose a permanent first build.</b> Both solve the fault, but they support different plant communities.</p><div class="blueprint-choices">${Object.entries(choices).map(([id,bp])=>`<button data-blueprint="${fault}:${id}" ${fault==='drain'&&!r.minigames.irrigation.solved?'disabled':''}><i>${bp.icon}</i><b>${bp.name}</b><span>${bp.desc}</span><small>${Object.entries(bp.effects).map(([k,v])=>`${k} ${v>0?'+':''}${v}`).join(' · ')}</small><em>${costText(bp.cost)}${canAfford(bp.cost)?' · ready':' · supplies needed'}</em></button>`).join('')}</div>${fault==='drain'&&!r.minigames.irrigation.solved?'<button class="btn" data-estate-game="irrigation">Map the blocked pipe first</button>':''}`)}
function placementModal(anchor){const r=ferneryRoom(),available=S.plants.filter(p=>!placedIds().includes(p.id));modal(`<h3>Place a plant</h3><p>Plants keep their original care, lineage, leaves and identity. The room only remembers this anchor.</p><div class="placement-grid">${available.map(p=>`<button data-place-plant="${anchor}:${p.id}">${renderPlant(p,{tag:'place'+p.id})}<b>${esc(p.nick||plantName(p))}</b><small>${isDryPlant(p)?'dry guild':isUnderstoryPlant(p)?'understory guild':'flexible'} · estimated fit ${plantEstateFit(p)}</small></button>`).join('')||'<p>Every plant is already placed. Move one from its current anchor or visit the Market.</p>'}</div><div class="row"><button class="btn ghost" data-close="1">Cancel</button><button class="btn" data-shop="1">Open Market</button></div>`)}
function roomPlantModal(id){const p=estatePlant(id),entry=placedEntries().find(x=>x.plant.id===Number(id));if(!p)return;modal(`<h3>${esc(p.nick||plantName(p))}</h3><div class="room-plant-preview">${renderPlant(p,{tag:'roomfocus'+p.id})}</div><p><b>Fernery vitality ${plantEstateFit(p)}/100.</b> Climate affects growth and gently nudges health; original care remains available.</p><div class="row"><button class="btn" data-open-original-plant="${p.id}">Care & lineage</button><button class="btn ghost" data-move-room-plant="${p.id}">Move</button><button class="btn ghost" data-remove-room-plant="${p.id}">Return outside</button></div><small>Current anchor: ${entry?.anchor||'none'} · ${isDryPlant(p)?'Sunstone dry guild':isUnderstoryPlant(p)?'Fern understory guild':'flexible companion plant'}</small>`)}
function movePlantModal(id){const occupied=new Set(placedEntries().filter(x=>x.plant.id!==Number(id)).map(x=>x.anchor));modal(`<h3>Move within the Fernery</h3><p>Choose another anchor. Neighboring plants can activate a guild.</p><div class="anchor-picker">${ESTATE_ANCHORS.map(a=>`<button data-move-to="${id}:${a.id}" ${occupied.has(a.id)?'disabled':''}>${a.id.toUpperCase()}<small>${a.level}</small></button>`).join('')}</div>`)}
function decorModal(slot){const r=ferneryRoom(),open=unlockedDecor();modal(`<h3>Place room decor</h3><p>Decor is visible, movable, and changes climate or exhibition styling.</p><div class="blueprint-choices">${open.map(id=>{const d=ESTATE_DECOR[id];return `<button data-place-decor="${slot}:${id}"><i>${d.icon}</i><b>${d.name}</b><span>${d.effect}</span></button>`}).join('')||'<p>Complete a repair or the Pollinator’s Waltz to recover room decor.</p>'}</div>${r.decor[slot]?`<button class="btn ghost" data-remove-decor="${slot}">Clear this spot</button>`:''}`)}
function letterModal(){const r=ferneryRoom(),c=storyChecks();if(r.chapterComplete&&!r.nextChapter)return modal(`<h3>✉ Letter III · What comes next</h3><p>“Restoration is not returning. It is making room for what comes next.”</p><p>The Fernery is alive. Choose which locked shell the estate opens next; the collection and this room remain intact.</p><div class="next-choice"><button data-next-chapter="sunstone"><b>☀ Sunstone Walk</b><span>A dry outdoor architecture for Prince Sean’s cactus lineages.</span></button><button data-next-chapter="moon"><b>☾ Moon Room</b><span>A nocturnal conservatory for velvet leaves and night-folding plants.</span></button></div>`);modal(`<h3>✉ The Fernery Letters · ${r.letterStep}/3</h3><div class="letter-pages"><div class="${r.letterStep>=1?'open':''}"><b>I · The water map</b><p>${r.letterStep>=1?'“Water remembers the route home.”':`Diagnose all faults and solve Irrigation Rescue. ${diagnosedCount()}/3 · ${c.first?'ready':'route pending'}`}</p></div><div class="${r.letterStep>=2?'open':''}"><b>II · A living shelf</b><p>${r.letterStep>=2?`“A room lives when its plants choose one another.” ${activeGuildName()} answered.`:`Build two repairs, place three plants, activate a guild and complete Pollinator’s Waltz.`}</p></div><div class="${r.letterStep>=3?'open':''}"><b>III · The witness</b><p>${r.letterStep>=3?'“Restoration is making room for what comes next.”':'Work with all three companions, welcome a composition-driven visitor and hold an exhibition.'}</p></div></div><h4>Evidence ledger</h4><div class="evidence-ledger">${r.clues.slice(-8).reverse().map(x=>`<span><b>${x.kind}</b>${esc(x.text)}</span>`).join('')||'<span>The room is waiting for its first diagnosis.</span>'}</div>`)}
function openExhibition(){const r=ferneryRoom(),available=placedEntries();r.exhibitionDraft.plantIds=r.exhibitionDraft.plantIds.filter(id=>placedIds().includes(id)).slice(0,5);const d=r.exhibitionDraft;modal(`<h3>♕ The Fernery Exhibition</h3><p>Select 3–5 placed plants, a decor language, and the story the room tells. Judges score actual health, climate, guild, layout and preparation.</p><div class="exhibition-plants">${available.map(({plant})=>`<button class="${d.plantIds.includes(plant.id)?'on':''}" data-exhibit-plant="${plant.id}">${renderPlant(plant,{tag:'exhibit'+plant.id})}<b>${esc(plant.nick||plantName(plant))}</b><small>fit ${plantEstateFit(plant)}</small></button>`).join('')}</div><h4>Decor language</h4><div class="choice-chips">${Object.entries(ESTATE_DECOR).map(([id,x])=>`<button class="${d.decor===id?'on':''}" data-exhibit-decor="${id}">${x.icon} ${x.name}${Object.values(r.decor).includes(id)?' ✓':' · not placed'}</button>`).join('')}</div><h4>Narrative</h4><div class="choice-chips"><button class="${d.story==='renewal'?'on':''}" data-exhibit-story="renewal">Restoration & renewal</button><button class="${d.story==='lineage'?'on':''}" data-exhibit-story="lineage">Lineage & rarity</button><button class="${d.story==='companions'?'on':''}" data-exhibit-story="companions">Companions at work</button></div><div class="exhibit-estimate">Selected ${d.plantIds.length}/5 · current estimate ${d.plantIds.length>=3?exhibitionBreakdown(d.plantIds,d.decor,d.story).total:'—'} · pollinator prep +${r.minigames.pollination.prep||0}</div><button class="btn gold" id="stageFerneryExhibition" ${d.plantIds.length>=3?'':'disabled'}>Open the doors to the judges</button>`)}

const estatePriorGarden=renderGarden;
renderGarden=function(){ensureEstate();if(S.estate.activeRoom==='grounds'){estatePriorGarden();const root=$('#screen-garden');root.insertAdjacentHTML('afterbegin',`<button class="fernery-entry" data-estate-view="fernery"><span>✉</span><b>Enter the real Fernery</b><small>${ferneryRoom().chapterComplete?'Restored chapter · return to your room':`${diagnosedCount()}/3 faults · ${repairCount()}/3 repairs · ${ferneryRoom().letterStep}/3 letters`}</small></button>`);return}renderFernery()};
const estatePriorShop=renderShop;
renderShop=function(){estatePriorShop();ensureEstate();if(!['plants','supplies'].includes(shopTab))return;const tabs=$('#screen-shop .tabs');if(tabs)tabs.insertAdjacentHTML('afterend',`<div class="restoration-cart"><span><b>Fernery restoration cart</b><small>Market coins become permanent room repairs.</small></span>${Object.entries(MATERIAL_META).map(([id,m])=>`<button data-estate-material="${id}">${m.icon}<b>${ensureEstate().resources[id]||0}</b><small>${m.price}🪙</small></button>`).join('')}</div>`)};
const estatePriorJournal=renderJournal;
renderJournal=function(){estatePriorJournal();ensureEstate();const r=ferneryRoom(),root=$('#screen-journal');root.insertAdjacentHTML('afterbegin',`<button class="collection-banner estate" data-estate-view="fernery"><b>✉ Fernery chapter · ${r.letterStep}/3 letters</b><span>${r.chapterComplete?'Restored · '+(r.nextChapter||'next chapter awaiting choice'):`${repairCount()} repairs · ${placedIds().length} placed plants · ${activeGuildName()}`}</span></button><h2 class="sec">Fernery evidence & visitors</h2><div class="list">${r.clues.filter(x=>x.kind==='letter').slice().reverse().map(x=>`<div class="item"><div class="ic">✉</div><div class="txt"><b>${esc(x.text.split(':')[0])}</b><span>${esc(x.text.split(':').slice(1).join(':'))}</span></div></div>`).join('')}${r.visitors.map(v=>`<div class="item"><div class="ic">✍️</div><div class="txt"><b>${esc(v.name)}</b><span>${esc(v.text)}</span></div></div>`).join('')||'<div class="item"><div class="ic">○</div><div class="txt"><b>No Fernery witness yet</b><span>Visitors respond to the plants, climate, repairs and companions actually present.</span></div></div>'}</div>`)};

const estatePriorSeconds=secondsPerLeaf;
secondsPerLeaf=function(p){const base=estatePriorSeconds(p);if(!S?.estate)return base;ensureEstate();if(!placedIds().includes(p.id))return base;return base*(1.25-plantEstateFit(p)/200)};
const estatePriorTick=tick;
tick=function(dt,silent=false,noGrowth=false){estatePriorTick(dt,silent,noGrowth);if(!S?.estate)return;ensureEstate();placedIds().forEach(id=>{const p=estatePlant(id);if(!p)return;const fit=plantEstateFit(p);p.estateVitality=fit;p.health=clamp(p.health+(fit-55)*(dt/60)/5000,S.gentle?6:0,100)})};

glassModal=function(){ensureEstate();S.estate.activeRoom='fernery';ferneryRoom().openedAt=ferneryRoom().openedAt||now();save();closeModal();renderGarden()};
showModal=function(){openExhibition()};
welcomeModal=function(){ensureEstate();if(!S.sequel.lead)return chooseLead();modal(`<div class="welcome-letter">✉️</div><h3>The first room is waiting</h3><p><b>${leadName()}</b> has inherited a complete plant collection—and a Fernery that cannot live on collection alone. Diagnose the room, decide what climate it becomes, place real plants into communities, and follow the three letters.</p><p><b>Cozy promise:</b> Gentle Mode remains on. A poor habitat slows growth and asks for help; it never punishes an ordinary absence.</p><button class="btn" style="width:100%" data-enter-fernery="1">Enter the neglected Fernery</button>`)};

function buyEstateMaterial(id){const m=MATERIAL_META[id];if(!m)return;if(S.coins<m.price)return toast('Not enough coins. Care, sell, show or play to earn more.','bad');S.coins-=m.price;ensureEstate().resources[id]=(ensureEstate().resources[id]||0)+1;save();sfx('buy');toast(`${m.name} added to the restoration cart.`,'gold');renderShop();renderTop()}
function chooseNextChapter(id){const r=ferneryRoom();if(!r.chapterComplete||!['sunstone','moon'].includes(id))return;r.nextChapter=id;ensureEstate().shells[id]=true;save();closeModal();renderGarden();sparkle(id==='sunstone'?'☀':'☾',22);toast(`${id==='sunstone'?'Sunstone Walk':'Moon Room'} is now the next estate shell.`,'gold')}

const estatePriorWire=wire;
wire=function(){estatePriorWire();
  const handle=e=>{
    const view=e.target.closest('[data-estate-view]');if(view){ensureEstate().activeRoom=view.dataset.estateView;save();if(screen!=='garden')go('garden');else renderGarden();closeModal();return}
    if(e.target.closest('[data-enter-fernery]')){ensureEstate().activeRoom='fernery';ferneryRoom().openedAt=ferneryRoom().openedAt||now();S.intro=true;save();closeModal();renderGarden();return}
    const fault=e.target.closest('[data-estate-fault]');if(fault){diagnoseFault(fault.dataset.estateFault);return}
    const bp=e.target.closest('[data-blueprint]');if(bp){const[fault,id]=bp.dataset.blueprint.split(':');buildRepair(fault,id);return}
    const starter=e.target.closest('[data-starter]');if(starter){chooseStarterGuild(starter.dataset.starter);return}
    const anchor=e.target.closest('[data-room-anchor]');if(anchor){placementModal(anchor.dataset.roomAnchor);return}
    const rp=e.target.closest('[data-room-plant]');if(rp){roomPlantModal(+rp.dataset.roomPlant);return}
    const pp=e.target.closest('[data-place-plant]');if(pp){const[a,id]=pp.dataset.placePlant.split(':');placePlantAt(a,+id);closeModal();renderGarden();return}
    const original=e.target.closest('[data-open-original-plant]');if(original){closeModal();openPlant(+original.dataset.openOriginalPlant);return}
    const mover=e.target.closest('[data-move-room-plant]');if(mover){movePlantModal(+mover.dataset.moveRoomPlant);return}
    const moveTo=e.target.closest('[data-move-to]');if(moveTo){const[id,a]=moveTo.dataset.moveTo.split(':');placePlantAt(a,+id);closeModal();renderGarden();return}
    const remove=e.target.closest('[data-remove-room-plant]');if(remove){removePlantFromRoom(+remove.dataset.removeRoomPlant);closeModal();renderGarden();return}
    const decor=e.target.closest('[data-estate-decor]');if(decor){decorModal(decor.dataset.estateDecor);return}
    const placeD=e.target.closest('[data-place-decor]');if(placeD){const[slot,id]=placeD.dataset.placeDecor.split(':');placeDecor(slot,id);closeModal();renderGarden();return}
    const removeD=e.target.closest('[data-remove-decor]');if(removeD){ferneryRoom().decor[removeD.dataset.removeDecor]=null;save();closeModal();renderGarden();return}
    const companion=e.target.closest('[data-estate-companion]');if(companion){companionFerneryMoment(companion.dataset.estateCompanion);return}
    const letter=e.target.closest('[data-estate-letter]');if(letter){letterModal();return}
    const game=e.target.closest('[data-estate-game]');if(game){game.dataset.estateGame==='irrigation'?openIrrigation():openPollination();return}
    const pipe=e.target.closest('[data-pipe]');if(pipe&&irrigationSession){const i=+pipe.dataset.pipe;if(i!==0&&i!==15){irrigationSession.tiles[i]=(irrigationSession.tiles[i]+1)%4;irrigationSession.moves++;irrigationSession.message='';renderIrrigationModal()}return}
    if(e.target.closest('#checkIrrigation')){checkIrrigation();return}
    if(e.target.closest('#startPollination')){pollinationSession.showing=false;pollinationSession.message='Guide the moth through the remembered route.';renderPollinationModal();return}
    if(e.target.closest('#revealPollination')){pollinationSession.showing=true;pollinationSession.input=[];pollinationSession.message='Study the route again.';renderPollinationModal();return}
    const pollen=e.target.closest('[data-pollen]');if(pollen&&pollinationSession&&!pollinationSession.showing){pollinationTap(pollen.dataset.pollen);return}
    if(e.target.closest('[data-estate-visitor]')){generateFerneryVisitor();return}
    if(e.target.closest('[data-estate-exhibition]')){openExhibition();return}
    const ep=e.target.closest('[data-exhibit-plant]');if(ep){const id=+ep.dataset.exhibitPlant,d=ferneryRoom().exhibitionDraft,at=d.plantIds.indexOf(id);if(at>=0)d.plantIds.splice(at,1);else if(d.plantIds.length<5)d.plantIds.push(id);else return toast('Choose at most five plants.','bad');save();openExhibition();return}
    const ed=e.target.closest('[data-exhibit-decor]');if(ed){ferneryRoom().exhibitionDraft.decor=ed.dataset.exhibitDecor;save();openExhibition();return}
    const es=e.target.closest('[data-exhibit-story]');if(es){ferneryRoom().exhibitionDraft.story=es.dataset.exhibitStory;save();openExhibition();return}
    if(e.target.closest('#stageFerneryExhibition')){stageFerneryExhibition();return}
    const mat=e.target.closest('[data-estate-material]');if(mat){buyEstateMaterial(mat.dataset.estateMaterial);return}
    const next=e.target.closest('[data-next-chapter]');if(next){chooseNextChapter(next.dataset.nextChapter);return}
  };
  $('#screens').addEventListener('click',handle);$('#modal').addEventListener('click',handle);
};

const estatePriorBoot=boot;
boot=async function(){await estatePriorBoot();ensureEstate();ferneryRoom().openedAt=ferneryRoom().openedAt||now();save();if(screen==='garden')renderGarden()};

globalThis.ESTATE_TEST={roomClimate,guildState,plantEstateFit,placePlantAt,pipeConnected,exhibitionBreakdown,generateFerneryVisitor,updateFerneryStory,FERNERY_BLUEPRINTS,ESTATE_ANCHORS};
