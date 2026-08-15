/* The Glasshouse Letters v5 — two canonical garden views, royal identities,
   spatial decor, companion adventures, and local owner tooling. */

const V5_LEADS={
  sabrina:{id:'sabrina',name:'Princess Sabrina',estate:'Moonrose Terrace',collection:'The Fern & Velvet Library',crest:'❦',accent:'#b65f89',soft:'#f9d9e8',affinity:'understory',story:'A layered garden of fern shade, velvet leaves and handwritten plant stories.'},
  sean:{id:'sean',name:'Prince Sean',estate:'Sunstone Court',collection:'The Desert Form Archive',crest:'✦',accent:'#b76d3d',soft:'#f3dfbf',affinity:'dry',story:'A warm stone garden where sculptural cacti frame every restored path.'},
};
const V5_DECOR_POSITIONS=[[8,67],[21,82],[34,66],[47,86],[61,65],[76,84],[89,67],[14,45],[31,42],[52,43],[72,46],[90,43],[9,91],[40,92],[69,92],[91,91]];
const V5_PET_IDS={joeytrail:'Joey',salempounce:'Salem',tracecache:'Trace'};
const V5_BUILD='estate-identities-20260814a';
let v5OwnerKnocks=0;

function v5Defaults(){
  if(!S)return;
  sequelDefaults();
  if(!['estate','collection'].includes(S.sequel.gardenMode))S.sequel.gardenMode='estate';
  S.sequel.decorLayout=S.sequel.decorLayout&&typeof S.sequel.decorLayout==='object'?S.sequel.decorLayout:{};
  S.sequel.identityStarters={sabrina:false,sean:false,...(S.sequel.identityStarters||{})};
  const petDefault={plays:0,wins:0,best:0,lastPlayed:null};
  S.sequel.petGames=S.sequel.petGames||{};
  ['Joey','Salem','Trace'].forEach(name=>S.sequel.petGames[name]={...petDefault,...(S.sequel.petGames[name]||{})});
  S.sequel.ownerTools=S.sequel.ownerTools||{};
  const o=S.sequel.ownerTools;
  if(typeof o.unlocked!=='boolean')o.unlocked=false;
  if(!Array.isArray(o.history))o.history=[];
  if(!Array.isArray(o.giftDrafts))o.giftDrafts=[];
  o.giftService={configured:false,endpoint:null,...(o.giftService||{})};
  if(!S.estate?.rooms?.fernery&&typeof migrateEstateSave==='function')S.estate=migrateEstateSave(S.estate,S.sequel);
  if(!S.estate.grounds)S.estate.grounds={decorLayout:{},storyVisits:[]};
}
function v5Lead(){return V5_LEADS[S.sequel?.lead]||V5_LEADS.sabrina}
function v5ApplyLeadSkin(){const app=document.querySelector('#app');if(app)app.dataset.lead=v5Lead().id}
function v5ModeSwitch(){const mode=S.sequel.gardenMode;return `<div class="garden-mode-switch" role="group" aria-label="Garden view"><button data-garden-mode="estate" aria-pressed="${mode==='estate'}" class="${mode==='estate'?'on':''}"><i>⌂</i><span>Estate<small>living world</small></span></button><button data-garden-mode="collection" aria-pressed="${mode==='collection'}" class="${mode==='collection'?'on':''}"><i>▦</i><span>Collection<small>detailed care</small></span></button></div>`}
function v5RoyalPortrait(){const l=v5Lead();return `<div class="royal-seal ${l.id}" aria-hidden="true"><i>♛</i><b>${l.crest}</b></div>`}

function v5PetArt(name,pose='idle'){
  if(name==='Joey')return `<svg class="pet-svg joey ${pose}" viewBox="0 0 120 88" role="img" aria-label="Joey, a black-and-white border collie with a predominantly black face and narrow white blaze"><path class="tail" d="M21 52Q3 45 9 27"/><path class="leg" d="M40 60v17M74 60v17"/><ellipse class="body" cx="57" cy="49" rx="38" ry="24"/><path class="whitecoat" d="M38 31q18 4 24 37q-17 7-29-6q-7-13 5-31"/><circle class="head" cx="89" cy="35" r="23"/><path class="ear" d="M73 19L69 2l17 12M99 15l15-11-4 22"/><path class="blaze" d="M86 13q5 14 1 38q5 2 9-1q0-24-4-38z"/><circle class="eye" cx="80" cy="34" r="2.5"/><circle class="eye" cx="99" cy="34" r="2.5"/><ellipse class="muzzle" cx="91" cy="46" rx="9" ry="6"/><circle class="nose" cx="95" cy="44" r="3"/><path class="smile" d="M95 47q-3 6-8 2"/></svg>`;
  if(name==='Salem')return `<svg class="pet-svg salem ${pose}" viewBox="0 0 120 88" role="img" aria-label="Salem, a young all-black cat"><path class="tail" d="M31 57Q7 58 12 27Q15 13 26 21"/><ellipse class="body" cx="58" cy="55" rx="32" ry="19"/><circle class="head" cx="86" cy="35" r="20"/><path class="ear" d="M70 25l5-20l12 14M91 18l14-12l-2 23"/><circle class="eye glow" cx="80" cy="34" r="3"/><circle class="eye glow" cx="96" cy="34" r="3"/><path class="nose" d="M88 42l4 0l-2 3z"/><path class="leg" d="M49 66v12M73 66v12"/></svg>`;
  return `<svg class="pet-svg trace ${pose}" viewBox="0 0 120 88" role="img" aria-label="Trace, a brownish calico cat"><path class="tail" d="M29 58Q5 62 12 35Q16 20 28 27"/><ellipse class="body" cx="57" cy="54" rx="34" ry="20"/><path class="patch cream" d="M31 43q17-17 25 7q-2 20-22 15z"/><path class="patch dark" d="M55 35q22-6 28 15q-9 7-25 4z"/><circle class="head" cx="88" cy="35" r="21"/><path class="ear" d="M72 23l5-19l12 15M94 18l13-11l-2 22"/><path class="patch cream face" d="M72 29q15-9 17 8q-4 12-15 11z"/><path class="patch dark face" d="M91 15q17 5 14 23q-7 0-15-8z"/><circle class="eye" cx="81" cy="34" r="2.5"/><circle class="eye" cx="98" cy="34" r="2.5"/><path class="nose" d="M88 42h5l-2.5 3z"/><path class="leg" d="M47 66v12M72 66v12"/></svg>`;
}
function v5PetButton(name,place='grounds'){const r=S.estate?.rooms?.fernery,info=r?.companions?.[name],sub=place==='fernery'?(info?.clues?.includes('fernery')?`bond ${info.bond}`:'has a clue'):'tap for adventures';return `<button class="v5-pet ${name.toLowerCase()} ${place}" data-pet="${name}" aria-label="${name}: ${sub}">${v5PetArt(name)}<b>${name}</b><small>${sub}</small></button>`}

companionHTML=function(){return ['Joey','Salem','Trace'].map(name=>v5PetButton(name,'grounds')).join('')};
renderCompanion=function(name){return v5PetButton(name,'fernery').replace(`data-pet="${name}"`,`data-estate-companion="${name}"`)};

function v5OwnedDecor(){
  const out=[];let n=0;
  DECOR.forEach(d=>{const count=Math.max(0,Math.floor(Number(S.decor?.[d.id])||0));for(let i=0;i<count;i++){const pos=V5_DECOR_POSITIONS[n%V5_DECOR_POSITIONS.length];out.push({id:d.id,index:i,data:d,x:pos[0],y:pos[1]});n++}});
  return out;
}
function v5DecorScene(){const owned=v5OwnedDecor();if(!owned.length)return `<button class="scene-decor-empty" data-open-decor-market="1">Your first garden furnishing will appear here</button>`;return `<div class="scene-decor-layer" aria-label="Owned garden decor">${owned.map((x,i)=>`<button class="scene-decor decor-${x.id}" data-scene-decor="${x.id}" style="--x:${x.x}%;--y:${x.y}%;--z:${70+Math.round(x.y)}" aria-label="${esc(x.data.name)}${x.index?` ${x.index+1}`:''}: ${esc(x.data.desc)}"><i>${x.data.icon}</i><span>${esc(x.data.name)}</span></button>`).join('')}</div>`}
function v5DecorClass(){return DECOR.filter(d=>(S.decor?.[d.id]||0)>0).map(d=>`has-${d.id}`).join(' ')}
function v5IdentityBanner(compact=false){const l=v5Lead(),dry=l.id==='sean';return `<section class="identity-banner ${compact?'compact':''}">${v5RoyalPortrait()}<div><span>${dry?'SUNSTONE ESTATE':'MOONROSE ESTATE'}</span><h2>${l.estate}</h2><p>${l.story}</p></div><i>${dry?'Cactus affinity · bright, dry forms grow 5% faster':'Understory affinity · ferns and shade plants grow 5% faster'}</i></section>`}

function v5CollectionGarden(){
  const l=v5Lead(),cap=slotCap();let h=v5ModeSwitch()+`<section class="collection-hero">${v5RoyalPortrait()}<div><span>DETAILED PLANT VIEW</span><h1>${l.collection}</h1><p>Every canonical plant, leaf, care meter and lineage—shared with the estate.</p></div><button class="btn sm" data-garden-mode="estate">See estate</button></section>`;
  h+=`<div class="collection-summary"><span><b>${S.plants.length}</b> plants</span><span><b>${Object.keys(S.dex||{}).length}/${SPECIES.length}</b> species</span><span><b>${S.plants.filter(p=>p.hybrid).length}</b> hybrids</span><span><b>${v5OwnedDecor().length}</b> decor</span></div>`;
  h+=`<div class="quickrow collection-actions"><button class="btn" data-sequel="care">💧 Morning care</button><button class="btn gold" data-shop="1">🛒 Find plants</button><button class="btn pink" data-sequel="seed">✦ Surprise seed</button></div>${requestCard()}`;
  ZONE_IDS.forEach(z=>{const list=S.plants.filter(p=>p.zone===z);h+=`<h2 class="sec">${ZONES[z].icon} ${ZONES[z].name}<span class="cap">${list.length}/${cap[z]}</span></h2><div class="grid collection-grid">${list.map(plantCard).join('')}${list.length<cap[z]?`<button class="empty-slot" data-shop="1"><i>＋</i><b>Open place</b><span>Visit the market for a new companion</span></button>`:''}</div>`});
  if(!S.plants.length)h+=`<div class="v5-empty"><i>🌱</i><h3>The collection is ready for its first plant</h3><p>The market and surprise seed will both add the same canonical plants used in the estate.</p><button class="btn" data-shop="1">Open Market</button></div>`;
  $('#screen-garden').innerHTML=h;
}
function v5EnhanceEstate(){
  const root=$('#screen-garden');if(!root)return;
  root.insertAdjacentHTML('afterbegin',v5ModeSwitch());
  const world=root.querySelector('.living-world');
  if(world){world.classList.add(`identity-${v5Lead().id}`,...v5DecorClass().split(' ').filter(Boolean));world.insertAdjacentHTML('afterbegin',v5IdentityBanner(true));world.insertAdjacentHTML('beforeend',v5DecorScene())}
  else{const header=root.querySelector('.estate-room-head');if(header)header.insertAdjacentHTML('afterend',v5IdentityBanner(true))}
}
const v5EstateRenderGarden=renderGarden;
renderGarden=function(){v5Defaults();v5ApplyLeadSkin();if(S.sequel.gardenMode==='collection')v5CollectionGarden();else{v5EstateRenderGarden();v5EnhanceEstate()}v5UpdateSaveChip()};

const v5PriorSecondsPerLeaf=secondsPerLeaf;
secondsPerLeaf=function(p){const base=v5PriorSecondsPerLeaf(p);if(!S?.sequel?.lead)return base;const sp=SPECIES_BY_ID[p.speciesId],fav=v5Lead().affinity==='dry'?(sp.tags.includes('cactus')||sp.tags.includes('succulent')||sp.tags.includes('sunstone')):(sp.shape==='fern'||sp.tags.includes('humidity')||sp.light==='shade');return fav?base*.95:base};

function v5EnsureIdentityStarter(lead){
  v5Defaults();if(!V5_LEADS[lead]||S.sequel.identityStarters[lead])return;
  const species=lead==='sean'?'barrel':'birdsnest';
  if(!S.plants.some(p=>p.speciesId===species)){const zone=anyFreeSlot();if(zone)newPlant(species,{nick:lead==='sean'?'Sol':'Lace',zone,leaves:3})}
  S.sequel.identityStarters[lead]=true;save();
}

function v5PetGameResult(id,score,won,detail,perk){
  const rank=won?'🏆':score>0?'🐾':'🌱';return{id,score,coins:Math.max(25,score*18),xp:12+score*2,rank,title:won?'Companion triumph':'A good practice run',detail,won,perk:won?perk:null,perkText:won?'A companion cache was added to your supplies.':''};
}
function v5JoeyGame(field,hud,done){
  let lane=1,round=0,seeds=0,hearts=3,alive=true,current=null;
  field.innerHTML=`<div class="pet-game joey-game"><div class="pet-stage"><div class="pet-lanes">${[0,1,2].map(i=>`<i data-lane-bg="${i}"></i>`).join('')}</div><div id="petActor">${v5PetArt('Joey','run')}</div><div id="petTarget"></div></div><p id="petMsg">Guide Joey to seed packets and around muddy puddles.</p><div class="pet-controls"><button data-pet-move="-1" aria-label="Move Joey left">◀</button><button data-pet-dash="1">Dash forward</button><button data-pet-move="1" aria-label="Move Joey right">▶</button></div></div>`;
  const actor=field.querySelector('#petActor'),target=field.querySelector('#petTarget'),msg=field.querySelector('#petMsg');
  const hudUp=()=>hud.innerHTML=`<span>Trail <b>${Math.min(round+1,12)}/12</b></span><span>Seeds <b>${seeds}/6</b></span><span>Hearts <b>${'♥'.repeat(hearts)}</b></span>`;
  function next(){if(!alive)return;current={lane:Math.floor(Math.random()*3),kind:Math.random()<.68?'seed':'mud'};target.className=current.kind;target.textContent=current.kind==='seed'?'◈':'≈';target.style.left=(17+current.lane*33)+'%';actor.style.left=(17+lane*33)+'%';hudUp()}
  function move(d){lane=clamp(lane+d,0,2);actor.style.left=(17+lane*33)+'%';sfx('tap')}
  function dash(){if(!alive)return;if(lane===current.lane){if(current.kind==='seed'){seeds++;msg.textContent='Found a restoration seed packet!';sfx('coin')}else{hearts--;msg.textContent='Muddy paws—Joey shakes it off.';sfx('error')}}else msg.textContent='Clean stride. Read the next stretch.';round++;if(round>=12||hearts<=0){alive=false;const won=seeds>=6&&hearts>0;done(v5PetGameResult('joeytrail',seeds,won,`${seeds} seed packets · ${hearts} hearts left`,'v5joey'));return}next()}
  field.addEventListener('click',e=>{const m=e.target.closest('[data-pet-move]');if(m)move(+m.dataset.petMove);if(e.target.closest('[data-pet-dash]'))dash()});next();return()=>{alive=false};
}
function v5SalemGame(field,hud,done){
  let round=0,hits=0,misses=0,alive=true,timer=null,locked=false;
  field.innerHTML=`<div class="pet-game salem-game"><div class="pet-game-portrait">${v5PetArt('Salem','pounce')}</div><p id="petMsg">Tap the moon moth before it slips back into shadow.</p><div class="shadow-grid">${Array.from({length:6},(_,i)=>`<button data-shadow="${i}" aria-label="Shadow patch ${i+1}">✦</button>`).join('')}</div></div>`;
  const buttons=[...field.querySelectorAll('[data-shadow]')],msg=field.querySelector('#petMsg');const hudUp=()=>hud.innerHTML=`<span>Round <b>${Math.min(round+1,8)}/8</b></span><span>Pounces <b>${hits}</b></span><span>Misses <b>${misses}</b></span>`;
  function spawn(){if(!alive)return;locked=false;buttons.forEach(b=>{b.className='';b.textContent='✦'});const at=Math.floor(Math.random()*buttons.length),b=buttons[at];b.className='moth';b.textContent='🦋';hudUp();timer=setTimeout(()=>resolve(-1,at),1800)}
  function resolve(choice,target){if(!alive||locked)return;locked=true;clearTimeout(timer);if(choice===target){hits++;msg.textContent='Perfect pounce! Salem guards the leaves.';sfx('snip')}else{misses++;msg.textContent=choice<0?'The moth escaped into the rafters.':'Only a leaf shadow—try the next one.';sfx('error')}round++;if(round>=8){alive=false;const won=hits>=5;done(v5PetGameResult('salempounce',hits,won,`${hits}/8 clean pounces · ${misses} misses`,'v5salem'));return}setTimeout(spawn,450)}
  buttons.forEach((b,i)=>b.addEventListener('click',()=>{const target=buttons.findIndex(x=>x.classList.contains('moth'));resolve(i,target)}));spawn();return()=>{alive=false;clearTimeout(timer)};
}
function v5TraceGame(field,hud,done){
  let round=0,finds=0,alive=true,target=0,ready=false,timer=null;
  field.innerHTML=`<div class="pet-game trace-game"><div class="pet-game-portrait">${v5PetArt('Trace','search')}</div><p id="petMsg">Watch where Trace hides the brass garden token.</p><div class="cache-row">${['Left','Middle','Right'].map((n,i)=>`<button data-cache="${i}" aria-label="${n} cache"><i>🪴</i><span>${n}</span></button>`).join('')}</div></div>`;
  const buttons=[...field.querySelectorAll('[data-cache]')],msg=field.querySelector('#petMsg');const hudUp=()=>hud.innerHTML=`<span>Round <b>${Math.min(round+1,6)}/6</b></span><span>Found <b>${finds}</b></span><span>Goal <b>4</b></span>`;
  function show(){if(!alive)return;ready=false;target=Math.floor(Math.random()*3);buttons.forEach((b,i)=>{b.className=i===target?'show':'';b.querySelector('i').textContent=i===target?'🐾':'🪴'});msg.textContent='Trace is choosing a cache…';hudUp();timer=setTimeout(()=>{buttons.forEach(b=>{b.className='';b.querySelector('i').textContent='🪴'});ready=true;msg.textContent='Which cache held the pawprint?'},950)}
  function choose(i){if(!ready||!alive)return;ready=false;if(i===target){finds++;buttons[i].className='found';msg.textContent='Found! Trace chirps proudly.';sfx('coin')}else{buttons[i].className='miss';buttons[target].className='reveal';msg.textContent='Trace was watching the other pot.';sfx('error')}round++;if(round>=6){alive=false;const won=finds>=4;setTimeout(()=>done(v5PetGameResult('tracecache',finds,won,`${finds}/6 brass tokens recovered`,'v5trace')),350);return}timer=setTimeout(show,650)}
  buttons.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));show();return()=>{alive=false;clearTimeout(timer)};
}
ARCADE.GAMES.joeytrail={name:"Joey's Path Patrol",icon:'🐕',rule:'Steer Joey to seed packets and around puddles',run:v5JoeyGame};
ARCADE.GAMES.salempounce={name:"Salem's Shadow Pounce",icon:'🐈‍⬛',rule:'Guide Salem to moon moths before they vanish',run:v5SalemGame};
ARCADE.GAMES.tracecache={name:"Trace's Calico Cache",icon:'🐾',rule:'Remember where Trace hid each garden token',run:v5TraceGame};

const v5PriorArcadeReward=A.arcadeReward.bind(A);
A.arcadeReward=function(res){
  const prior=v5PriorArcadeReward(res),name=V5_PET_IDS[res.id];if(!name)return prior;
  v5Defaults();const rec=S.sequel.petGames[name],today=sequelDay(),firstToday=rec.lastPlayed!==today;rec.plays++;rec.best=Math.max(rec.best,res.score||0);if(res.won)rec.wins++;rec.lastPlayed=today;
  let note='';if(res.won&&res.id==='joeytrail'){S.inv.fertilizer=(S.inv.fertilizer||0)+1;S.estate.resources.timber++;note='Joey recovered Fertilizer and Cedar Timber.'}
  if(res.won&&res.id==='salempounce'){S.inv.neem=(S.inv.neem||0)+1;const pest=S.plants.find(p=>p.pests);if(pest)pest.pests=false;note='Salem earned Neem Spray and cleared one pest outbreak.'}
  if(res.won&&res.id==='tracecache'){S.inv.rooting=(S.inv.rooting||0)+1;S.estate.resources.pollen++;note='Trace uncovered Rooting Hormone and pressed pollen.'}
  if(firstToday){const bond=S.estate.rooms.fernery.companions[name];bond.bond++;if(typeof seasonAction==='function')seasonAction('companion',1);bumpQuest('companion',1)}
  save();return [prior,note].filter(Boolean).join(' ');
};
const v5PriorRenderArcade=renderArcade;
renderArcade=function(){v5PriorRenderArcade();v5Defaults();const root=$('#screen-arcade'),list=root.querySelector('.list');if(list)list.insertAdjacentHTML('beforebegin',`<section class="pet-arcade-banner"><div>${v5PetArt('Joey')}${v5PetArt('Salem')}${v5PetArt('Trace')}</div><span>COMPANION ADVENTURES</span><h2>You steer the paws now</h2><p>Three ticketed games feed real supplies, Fernery materials, companion bonds and the garden economy. Practice runs still pay coins.</p></section>`);root.querySelectorAll('.gcard').forEach(card=>{if(/Joey|Salem|Trace/.test(card.textContent))card.classList.add('pet-centered')})};

function v5OwnerCodeMatches(value){return hashStr(String(value||'').trim())===hashStr(String.fromCharCode(103,111,100,49))}
function v5Owner(){v5Defaults();return S.sequel.ownerTools}
function v5OwnerPanel(){const o=v5Owner(),history=o.history.slice(0,10);return `<section class="owner-panel"><span>LOCAL OWNER TOOLS</span><h2>Garden Steward Console</h2><p>Grants affect only this device. Every change is recorded and can be reversed once. This local lock is not server authentication.</p><div class="owner-grants"><button data-owner-grant="coins">+2,000🪙</button><button data-owner-grant="gems">+25💎</button><button data-owner-grant="supplies">Supply cache</button><button data-owner-grant="rare">Vault plant</button></div><button class="btn ghost" data-owner-gift="1">Create secure-service gift draft</button><h3>Local audit history</h3><div class="owner-history">${history.length?history.map(x=>`<div><span><b>${esc(x.label)}</b><small>${new Date(x.at).toLocaleString()} · ${x.reversed?'reversed':'active'}</small></span><button data-owner-reverse="${x.id}" ${x.reversed?'disabled':''}>${x.reversed?'Reversed':'Reverse'}</button></div>`).join(''):'<p>No local grants yet.</p>'}</div><button class="owner-lock" data-owner-lock="1">Lock owner tools</button></section>`}
const v5PriorRenderProfile=renderProfile;
renderProfile=function(){v5PriorRenderProfile();v5Defaults();const root=$('#screen-profile');root.insertAdjacentHTML('beforeend',`${v5Owner().unlocked?v5OwnerPanel():''}<button class="build-stamp" data-owner-knock="1" aria-label="Build information">${V5_BUILD}</button>`) };
function v5OwnerUnlockModal(){modal(`<h3>Local build access</h3><p>Enter the owner setting for this device.</p><input class="name" id="ownerCode" type="password" autocomplete="off" aria-label="Local access code"><button class="btn" id="submitOwnerCode" style="width:100%">Unlock local tools</button>`)}
function v5GrantDescription(kind){if(kind==='coins')return'Add 2,000 coins';if(kind==='gems')return'Add 25 gems';if(kind==='supplies')return'Add care supplies and one of each Fernery material';return'Choose one curated vault specimen'}
function v5ConfirmGrant(kind){if(kind==='rare')return modal(`<h3>Choose a vault specimen</h3><p>The new plant receives a canonical ID and can be reversed without renumbering anything else.</p><div class="owner-rare-grid">${['thai','obliqua','saguaro'].map(id=>`<button data-owner-rare="${id}">${renderPlant({id:99000+id.length,speciesId:id,potId:'gold',path:SPECIES_BY_ID[id].light,shading:'iridescent',health:100,water:80,growth:0,leaves:[{seed:id.length*41,len:62,fen:.5,varieg:SPECIES_BY_ID[id].forceVar||'none',unfurl:1}]},{tag:'owner'+id})}<b>${esc(SPECIES_BY_ID[id].name)}</b><small>${RARITY[SPECIES_BY_ID[id].rarity].name}</small></button>`).join('')}</div>`);modal(`<h3>Confirm local grant</h3><p><b>${v5GrantDescription(kind)}</b><br>This affects only this saved garden and creates a reversible audit entry.</p><div class="row"><button class="btn ghost" data-close="1">Cancel</button><button class="btn gold" data-confirm-owner-grant="${kind}">Grant locally</button></div>`)}
function v5ApplyGrant(kind){
  const o=v5Owner(),entry={id:`grant-${now()}-${Math.floor(Math.random()*9999)}`,at:now(),kind,label:v5GrantDescription(kind),delta:{coins:0,gems:0,inv:{},estate:{}},plantId:null,reversed:false};
  if(kind==='coins'){S.coins+=2000;entry.delta.coins=2000}
  else if(kind==='gems'){S.gems+=25;entry.delta.gems=25}
  else if(kind==='supplies'){const inv={fertilizer:5,neem:3,rooting:3,camera:2,tonic:2};Object.entries(inv).forEach(([k,n])=>S.inv[k]=(S.inv[k]||0)+n);const estate={glass:1,timber:1,copper:1,pollen:1};Object.entries(estate).forEach(([k,n])=>S.estate.resources[k]=(S.estate.resources[k]||0)+n);entry.delta.inv=inv;entry.delta.estate=estate}
  else if(kind.startsWith('plant:')){const speciesId=kind.split(':')[1],zone=anyFreeSlot();if(!zone){toast('Make room before granting a vault plant.','bad');return false}const p=newPlant(speciesId,{zone,leaves:4,potId:'gold'});entry.plantId=p.id;entry.label=`Vault specimen: ${SPECIES_BY_ID[speciesId].name}`}
  else return false;
  o.history.unshift(entry);o.history=o.history.slice(0,100);save();closeModal();renderProfile();renderTop();sparkle('✦',18);toast(`${entry.label} granted locally.`,'gold');return entry;
}
function v5ReverseGrant(id){const o=v5Owner(),entry=o.history.find(x=>x.id===id);if(!entry||entry.reversed)return false;S.coins=Math.max(0,S.coins-(entry.delta?.coins||0));S.gems=Math.max(0,S.gems-(entry.delta?.gems||0));Object.entries(entry.delta?.inv||{}).forEach(([k,n])=>S.inv[k]=Math.max(0,(S.inv[k]||0)-n));Object.entries(entry.delta?.estate||{}).forEach(([k,n])=>S.estate.resources[k]=Math.max(0,(S.estate.resources[k]||0)-n));if(entry.plantId){if(typeof removePlantFromRoom==='function')removePlantFromRoom(entry.plantId);S.plants=S.plants.filter(p=>p.id!==entry.plantId)}entry.reversed=true;entry.reversedAt=now();save();renderProfile();renderTop();toast(`${entry.label} reversed on this device.`);return true}

const GIFT_SERVICE_V5={
  configured(){return false},
  async createGift(){throw new Error('Secure gift service is not configured')},
  async redeemGift(){throw new Error('Secure gift service is not configured')},
  contract:{create:'Authenticated owner POST /gifts → opaque token',redeem:'POST /redeem in one database transaction with a unique redeemed_at constraint',storage:'Server database; never localStorage or public JavaScript'},
};
function v5GiftDraftModal(){
  const o=v5Owner();
  const drafts=o.giftDrafts.length?`<h3>Local drafts</h3>${o.giftDrafts.slice(0,5).map(d=>`<p><b>${esc(d.label)}</b><br>${esc(d.id)} · awaiting secure service</p>`).join('')}`:'';
  modal(`<h3>Secure gift draft</h3><p>This static PWA cannot enforce global one-time use. A draft stays only on this device and is <b>not a redeemable code</b> until an authenticated backend creates an opaque token.</p><div class="owner-grants"><button data-owner-draft="starter">Starter bundle</button><button data-owner-draft="rare">Rare plant bundle</button><button data-owner-draft="gems">Gem bundle</button></div><div class="gift-boundary"><b>Backend required</b><span>Authenticated gift creation · atomic redemption · database uniqueness · rate limits · audit log.</span></div>${drafts}`)
}
function v5CreateGiftDraft(kind){const spec={starter:{label:'Starter bundle',payload:{coins:500,fertilizer:2}},rare:{label:'Rare plant bundle',payload:{plantTier:'rare',count:1}},gems:{label:'Gem bundle',payload:{gems:5}}}[kind];if(!spec)return;const draft={id:`draft-${now()}-${Math.floor(Math.random()*9999)}`,createdAt:now(),label:spec.label,payload:spec.payload,status:'needs-secure-backend'};v5Owner().giftDrafts.unshift(draft);save();v5GiftDraftModal();toast('Local draft saved. It is not redeemable yet.')}

function v5DecorModal(id){const d=DECOR_BY_ID[id],count=S.decor[id]||0;if(!d)return;modal(`<div class="decor-focus decor-${d.id}"><i>${d.icon}</i></div><h3>${esc(d.name)}</h3><p><b>${count} owned</b> · ${esc(d.desc)}</p><p>This furnishing is automatically arranged in the estate and its original gameplay effect remains active.</p><button class="btn" data-close="1">Back to the garden</button>`)}
function v5UpdateSaveChip(ok=true){let chip=document.querySelector('#saveChip');if(!chip){chip=document.createElement('div');chip.id='saveChip';chip.className='save-chip';document.querySelector('#topbar')?.appendChild(chip)}if(chip){chip.classList.toggle('bad',!ok);chip.textContent=ok?'● saved locally':'! save blocked'}}
const v5PriorSave=save;
save=function(){const ok=v5PriorSave();v5UpdateSaveChip(ok!==false);return ok};
function v5ShowRuntimeError(message){if(document.querySelector('.v5-error-strip'))return;const root=document.querySelector('#app');if(!root)return;root.insertAdjacentHTML('afterbegin',`<div class="v5-error-strip"><b>The garden hit a snag.</b><span>${esc(String(message||'A screen could not finish rendering. Your saved plants are still local.'))}</span><button id="backupBtn">Backup</button><button data-v5-reload="1">Reload</button></div>`)}
window.addEventListener('error',e=>v5ShowRuntimeError(e.message));window.addEventListener('unhandledrejection',e=>v5ShowRuntimeError(e.reason?.message||e.reason));

const v5PriorWire=wire;
wire=function(){v5PriorWire();
  const screenHandle=e=>{
    const mode=e.target.closest('[data-garden-mode]');if(mode){S.sequel.gardenMode=mode.dataset.gardenMode;save();sfx('tap');renderGarden();$('#screens').scrollTop=0;return}
    const decor=e.target.closest('[data-scene-decor]');if(decor){v5DecorModal(decor.dataset.sceneDecor);return}
    if(e.target.closest('[data-open-decor-market]')){go('shop');shopTab='decor';renderShop();return}
    if(e.target.closest('[data-owner-knock]')){v5OwnerKnocks++;if(v5OwnerKnocks>=5){v5OwnerKnocks=0;v5OwnerUnlockModal()}return}
    const grant=e.target.closest('[data-owner-grant]');if(grant){v5ConfirmGrant(grant.dataset.ownerGrant);return}
    const reverse=e.target.closest('[data-owner-reverse]');if(reverse){v5ReverseGrant(reverse.dataset.ownerReverse);return}
    if(e.target.closest('[data-owner-lock]')){v5Owner().unlocked=false;save();renderProfile();return}
    if(e.target.closest('[data-owner-gift]')){v5GiftDraftModal();return}
    if(e.target.closest('[data-v5-reload]'))location.reload();
  };
  $('#screens').addEventListener('click',screenHandle);
  $('#modal').addEventListener('click',e=>{
    if(e.target.closest('#submitOwnerCode')){if(v5OwnerCodeMatches($('#ownerCode')?.value)){v5Owner().unlocked=true;save();closeModal();if(screen==='profile')renderProfile();toast('Local owner tools unlocked.','gold')}else{bad('That local setting did not match.');$('#ownerCode').value=''}return}
    const confirm=e.target.closest('[data-confirm-owner-grant]');if(confirm){v5ApplyGrant(confirm.dataset.confirmOwnerGrant);return}
    const rare=e.target.closest('[data-owner-rare]');if(rare){const id=rare.dataset.ownerRare;modal(`<h3>Confirm vault specimen</h3><p>Add <b>${esc(SPECIES_BY_ID[id].name)}</b> to this device with a new canonical plant ID and reversible audit entry?</p><div class="row"><button class="btn ghost" data-close="1">Cancel</button><button class="btn gold" data-confirm-owner-grant="plant:${id}">Grant plant</button></div>`);return}
    const draft=e.target.closest('[data-owner-draft]');if(draft){v5CreateGiftDraft(draft.dataset.ownerDraft);return}
    const lead=e.target.closest('[data-lead]');if(lead){v5EnsureIdentityStarter(lead.dataset.lead);v5ApplyLeadSkin();if(screen==='garden')renderGarden()}
  });
};

const v5PriorBoot=boot;
boot=async function(){await v5PriorBoot();v5Defaults();v5ApplyLeadSkin();document.querySelector('#bootSplash')?.remove();v5UpdateSaveChip(true);if(screen==='garden')renderGarden()};

globalThis.SEQUEL_V5_TEST={v5Defaults,v5OwnedDecor,v5OwnerCodeMatches,v5ApplyGrant,v5ReverseGrant,v5CreateGiftDraft,V5_LEADS,V5_PET_IDS,GIFT_SERVICE_V5};
