/* Expanded estate areas. Canonical plants keep their original ids and care;
   this layer stores only where each plant is currently displayed. */

const ESTATE_AREA_PROFILES={
  balanced:{name:'Balanced glass',icon:'◐',light:58,humidity:62,copy:'A gentle all-round climate for mixed collections.'},
  mist:{name:'Fern mist',icon:'≋',light:44,humidity:82,copy:'Soft shade and humid air for ferns, aroids and cuttings.'},
  airy:{name:'Sun-warmed vents',icon:'☀',light:76,humidity:38,copy:'Bright moving air for succulents and flowering forms.'},
};
const GREENHOUSE_SPOTS=[[12,35],[31,32],[51,36],[72,31],[89,38],[18,63],[40,61],[62,64],[84,60],[50,81]];

function ensureEstateAreas(){
  const estate=ensureEstate();
  const seedAreaBalance=estate.areaAssignmentsSeeded!==true;
  estate.plantAreas=estate.plantAreas&&typeof estate.plantAreas==='object'?estate.plantAreas:{};
  estate.areas=estate.areas&&typeof estate.areas==='object'?estate.areas:{};
  estate.areas.outside=estate.areas.outside&&typeof estate.areas.outside==='object'?estate.areas.outside:{};
  estate.areas.greenhouse=estate.areas.greenhouse&&typeof estate.areas.greenhouse==='object'?estate.areas.greenhouse:{};
  if(estate.areas.outside.lastVisit===undefined)estate.areas.outside.lastVisit=null;
  const greenhouseDefaults={profile:'balanced',lastVisit:null,lastCondensation:null,condensationCount:0};
  Object.keys(greenhouseDefaults).forEach(key=>{if(estate.areas.greenhouse[key]===undefined)estate.areas.greenhouse[key]=greenhouseDefaults[key]});
  if(!ESTATE_AREA_PROFILES[estate.areas.greenhouse.profile])estate.areas.greenhouse.profile='balanced';
  if(!['grounds','greenhouse','fernery'].includes(estate.activeRoom))estate.activeRoom='grounds';
  const ids=new Set(S.plants.map(p=>p.id)),placed=new Set(placedIds());
  Object.keys(estate.plantAreas).forEach(id=>{if(!ids.has(Number(id)))delete estate.plantAreas[id]});
  const available=S.plants.filter(p=>!placed.has(p.id));
  available.forEach(p=>{if(!['outside','greenhouse'].includes(estate.plantAreas[p.id]))estate.plantAreas[p.id]=defaultEstateArea(p)});
  if(seedAreaBalance&&available.length>1&&!available.some(p=>estate.plantAreas[p.id]==='outside'))estate.plantAreas[available[0].id]='outside';
  if(seedAreaBalance&&available.length>1&&!available.some(p=>estate.plantAreas[p.id]==='greenhouse'))estate.plantAreas[available[available.length-1].id]='greenhouse';
  estate.areaAssignmentsSeeded=true;
  return estate;
}
function defaultEstateArea(p){const sp=SPECIES_BY_ID[p.speciesId];return p.zone==='cabinet'||sp.shape==='fern'||sp.light==='shade'||sp.tags.includes('humidity')?'greenhouse':'outside'}
function estateAreaOf(p){const estate=ensureEstateAreas();if(placedIds().includes(p.id))return'fernery';return estate.plantAreas[p.id]||defaultEstateArea(p)}
function estateScenePlants(area){const estate=ensureEstateAreas(),placed=new Set(placedIds());return S.plants.filter(p=>!placed.has(p.id)&&(estate.plantAreas[p.id]||defaultEstateArea(p))===area)}
function movePlantArea(id,area){
  const p=S.plants.find(x=>x.id===Number(id));if(!p||!['outside','greenhouse'].includes(area)||placedIds().includes(p.id))return false;
  const estate=ensureEstateAreas();estate.plantAreas[p.id]=area;estate.activeRoom=area==='outside'?'grounds':'greenhouse';S.sequel.scenePage=0;save();return true;
}
function greenhouseArea(){return ensureEstateAreas().areas.greenhouse}
function greenhouseClimate(){return ESTATE_AREA_PROFILES[greenhouseArea().profile]}
function greenhouseFit(p){
  const c=greenhouseClimate(),target=isDryPlant(p)?{light:78,humidity:32}:isUnderstoryPlant(p)?{light:40,humidity:82}:{light:58,humidity:58};
  return clamp(Math.round(100-Math.abs(c.light-target.light)*.55-Math.abs(c.humidity-target.humidity)*.45),20,100);
}
function areaCounts(){return{outside:estateScenePlants('outside').length,greenhouse:estateScenePlants('greenhouse').length,fernery:placedIds().length}}
function estateAreaNav(){
  const estate=ensureEstateAreas(),active=estate.activeRoom,counts=areaCounts(),g=greenhouseArea();
  return `<nav class="estate-area-switch" aria-label="Estate area"><button data-estate-area="grounds" class="${active==='grounds'?'on':''}" aria-pressed="${active==='grounds'}"><i>🌳</i><span>Outside<small>${counts.outside} plant${counts.outside===1?'':'s'}</small></span></button><button data-estate-area="greenhouse" class="${active==='greenhouse'?'on':''}" aria-pressed="${active==='greenhouse'}"><i>🪟</i><span>Greenhouse<small>${counts.greenhouse} · ${ESTATE_AREA_PROFILES[g.profile].name}</small></span></button><button data-estate-area="fernery" class="${active==='fernery'?'on':''}" aria-pressed="${active==='fernery'}"><i>✉</i><span>Fernery<small>${counts.fernery} · ${ferneryRoom().letterStep}/3 letters</small></span></button></nav>`;
}
function greenhousePlant(p,i,n){const sparse={1:[[50,45]],2:[[30,45],[70,45]],3:[[18,45],[50,42],[82,45]]},pos=(sparse[n]||GREENHOUSE_SPOTS)[i%((sparse[n]||GREENHOUSE_SPOTS).length)],fit=greenhouseFit(p),sp=SPECIES_BY_ID[p.speciesId];return `<button class="sceneplant pcard greenhouse-plant fit-${fit>=78?'great':fit>=55?'ok':'poor'}" data-plant="${p.id}" style="left:${pos[0]}%;top:${pos[1]}%;z-index:${20+Math.round(pos[1])}" aria-label="${esc(p.nick||plantName(p))}, ${sp.name}, greenhouse fit ${fit}"><span class="sceneart">${renderPlant(p,{tag:'greenhouse'+p.id})}</span><span class="scenename">${esc(p.nick||sp.name)}</span><i class="greenhouse-fit">${fit}</i>${p.water<22?'<i class="sceneneed">💧</i>':p.pests?'<i class="sceneneed">🐛</i>':''}</button>`}
function renderGreenhouse(){
  const plants=estateScenePlants('greenhouse').slice(0,GREENHOUSE_SPOTS.length),g=greenhouseArea(),c=greenhouseClimate(),today=sequelDay(),claimed=g.lastCondensation===today;
  ensureEstateAreas().activeRoom='greenhouse';g.lastVisit=now();
  let h=v5ModeSwitch()+estateAreaNav()+`<section class="greenhouse-world profile-${g.profile} identity-${v5Lead().id} ${v5DecorClass()}"><div class="greenhouse-sky"></div><div class="greenhouse-frame"></div><div class="greenhouse-panes"></div><div class="greenhouse-bench"></div><div class="greenhouse-floor"></div>${v5IdentityBanner(true)}<div class="greenhouse-climate"><span>☀ <b>${c.light}</b><small>light</small></span><span>≋ <b>${c.humidity}</b><small>humidity</small></span></div>${plants.map((p,i)=>greenhousePlant(p,i,plants.length)).join('')}${v5PetButton('Salem','greenhouse')}${v5PetButton('Trace','greenhouse')}${v5DecorScene('greenhouse')}${plants.length?'':`<div class="area-empty"><i>🪴</i><b>The benches are ready</b><span>Open a plant outside and move it into the greenhouse.</span><button data-estate-area="grounds">Choose an outdoor plant</button></div>`}</section>`;
  h+=`<section class="greenhouse-console"><span>WORKING CONSERVATORY</span><h2>Choose the greenhouse climate</h2><p>Climate changes are free, immediate and forgiving. A good match speeds growth; a mismatch never damages a plant.</p><div class="profile-choices">${Object.entries(ESTATE_AREA_PROFILES).map(([id,x])=>`<button data-greenhouse-profile="${id}" class="${g.profile===id?'on':''}"><i>${x.icon}</i><b>${x.name}</b><small>${x.copy}</small></button>`).join('')}</div><button class="condensation-btn" data-greenhouse-condensation="1" ${claimed||!plants.length?'disabled':''}>${claimed?'✓ Condensation collected today':'💧 Collect condensation'}<small>${plants.length?'Refresh greenhouse plants · bonus pollen with 3+ plants':'Move a plant here first'}</small></button><div class="area-summary"><b>${plants.length} visible plant${plants.length===1?'':'s'}</b><span>${plants.filter(p=>greenhouseFit(p)>=78).length} thriving in this profile · tap any plant for care or a new area</span></div></section>`;
  $('#screen-garden').innerHTML=h;v5ApplyLeadSkin();v5UpdateSaveChip();
}
function collectGreenhouseCondensation(){
  const g=greenhouseArea(),today=sequelDay(),plants=estateScenePlants('greenhouse');if(!plants.length||g.lastCondensation===today)return false;
  plants.forEach(p=>{p.water=clamp(p.water+18,0,100);p.health=Math.max(p.health,35)});if(plants.length>=3)ensureEstateAreas().resources.pollen=(ensureEstateAreas().resources.pollen||0)+1;
  g.lastCondensation=today;g.condensationCount++;save();renderGarden();sparkle('💧',18);sfx('water');toast(`Greenhouse condensation refreshed ${plants.length} plant${plants.length===1?'':'s'}${plants.length>=3?' and pressed 1 pollen':''}.`);return true;
}
function enhanceEstateAreas(){
  const root=$('#screen-garden'),mode=root?.querySelector('.garden-mode-switch');if(!root||!mode||S.sequel.gardenMode!=='estate')return;
  mode.insertAdjacentHTML('afterend',estateAreaNav());const world=root.querySelector('.living-world');if(world){world.classList.add('area-outside');world.insertAdjacentHTML('afterbegin','<div class="area-scene-title"><b>Outside Garden</b><span>sun, weather and wandering companions</span></div>')}
}

const areaPriorRenderGarden=renderGarden;
renderGarden=function(){ensureEstateAreas();if(S.sequel.gardenMode==='estate'&&S.estate.activeRoom==='greenhouse')renderGreenhouse();else{areaPriorRenderGarden();enhanceEstateAreas()}};
const areaPriorSecondsPerLeaf=secondsPerLeaf;
secondsPerLeaf=function(p){const base=areaPriorSecondsPerLeaf(p),area=estateAreaOf(p);if(area==='outside'){const sp=SPECIES_BY_ID[p.speciesId];return sp.light==='sun'||isDryPlant(p)?base*.95:base}if(area==='greenhouse'){const fit=greenhouseFit(p);return base*(fit>=78?.92:fit>=55?.98:1.03)}return base};
const areaPriorRemovePlantFromRoom=removePlantFromRoom;
removePlantFromRoom=function(id){areaPriorRemovePlantFromRoom(id);ensureEstateAreas().plantAreas[id]='outside';save()};
const areaPriorRenderSheet=renderSheet;
renderSheet=function(){areaPriorRenderSheet();const p=S.plants.find(x=>x.id===openPlantId),panel=$('#sheetPanel');if(!p||!panel)return;const area=estateAreaOf(p),label={outside:'Outside Garden',greenhouse:'Working Greenhouse',fernery:'The Fernery'}[area];panel.insertAdjacentHTML('beforeend',`<section class="plant-area-card"><span>ESTATE HOME</span><b>${label}</b>${area==='fernery'?'<small>Move this plant from its Fernery anchor before assigning a new area.</small>':`<small>The plant keeps this exact care, lineage and canonical id when it moves.</small><button data-move-plant-area="${area==='outside'?'greenhouse':'outside'}">Move to ${area==='outside'?'Greenhouse':'Outside Garden'}</button>`}</section>`)};
const areaPriorWire=wire;
wire=function(){areaPriorWire();const handle=e=>{const area=e.target.closest('[data-estate-area]');if(area){const estate=ensureEstateAreas(),target=area.dataset.estateArea;estate.activeRoom=target;const visitKey=target==='grounds'?'outside':target;if(estate.areas[visitKey])estate.areas[visitKey].lastVisit=now();save();closeModal();closeSheet();renderGarden();$('#screens').scrollTop=0;return}const profile=e.target.closest('[data-greenhouse-profile]');if(profile){greenhouseArea().profile=profile.dataset.greenhouseProfile;save();sfx('tap');renderGarden();return}if(e.target.closest('[data-greenhouse-condensation]')){collectGreenhouseCondensation();return}const move=e.target.closest('[data-move-plant-area]');if(move&&movePlantArea(openPlantId,move.dataset.movePlantArea)){closeSheet();renderGarden();toast(`Plant moved to the ${move.dataset.movePlantArea==='greenhouse'?'greenhouse':'outside garden'}.`,'gold')}};$('#screens').addEventListener('click',handle);$('#sheet').addEventListener('click',handle)};
const areaPriorBoot=boot;
boot=async function(){await areaPriorBoot();ensureEstateAreas();save();if(screen==='garden')renderGarden()};

globalThis.ESTATE_AREAS_TEST={ensureEstateAreas,defaultEstateArea,estateAreaOf,estateScenePlants,movePlantArea,greenhouseClimate,greenhouseFit,collectGreenhouseCondensation,ESTATE_AREA_PROFILES};
