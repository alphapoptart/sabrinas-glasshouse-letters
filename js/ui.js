/* Sabrina's Secret Garden — UI layer */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let screen = 'garden';
let openPlantId = null;
let shopTab = 'plants';
let renderSig = '';

/* ---------- feedback ---------- */
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s,transform .4s'; t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; }, 2100);
  setTimeout(() => t.remove(), 2600);
}
function sparkle(emoji = '🌿', n = 14) {
  const fx = $('#fx');
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'sp'; s.textContent = emoji;
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * .5) + 's';
    s.style.animationDuration = (1.2 + Math.random()) + 's';
    s.style.fontSize = (12 + Math.random() * 16) + 'px';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}
const sfx = name => { try { AUDIO.sfx(name); } catch (e) {} };
const bad = m => { toast(m, 'bad'); sfx('error'); };
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
function pushAudioSettings() {
  AUDIO.config({
    sfx: S.sound !== false, music: S.music !== false,
    sfxVol: (S.sfxVol ?? 80) / 100, musVol: (S.musVol ?? 45) / 100,
  });
}

/* hook called from game.js */
function onAlert(type, text, plantId) {
  if (type === 'rare') { toast(text, 'pink'); sparkle('✨', 26); sfx('rare'); buzz([20, 40, 30]); say('rare'); }
  else if (type === 'leaf') { toast(text, ''); sparkle('🌱', 10); sfx('leaf'); buzz(24); say('newLeaf'); }
  else if (type === 'pest') { toast(text, 'bad'); sfx('pest'); say('pest'); }
  else if (type === 'wilt') { toast(text, 'bad'); sfx('wilt'); buzz(40); say('wilting'); }
  else if (type === 'critical') { toast(text, 'bad'); sfx('critical'); buzz([60, 40, 60]); say('critical'); }
  else if (type === 'death') { toast(text, 'bad'); sparkle('🥀', 8); sfx('death'); buzz([80, 60, 120]); say('death'); }
  else if (type === 'ach' || type === 'level') { toast(text, 'gold'); sparkle('💎', 16); sfx('fanfare'); }
  else toast(text);
}

/* ---------- Sabrina chatter ---------- */
let sabMood = 'happy', sabLine = '';
function say(kind) {
  sabLine = pick(LINES[kind] || LINES.greet);
  sabMood = kind === 'rare' || kind === 'newLeaf' ? 'excited' : (kind === 'sad' || kind === 'pest') ? 'sad' : 'happy';
  const bar = $('#sabbar'); if (bar) bar.innerHTML = sabrinaBarHTML();
}
let sabCache = { key: null, line: '' };
function sabrinaBarHTML() {
  const thirsty = S.plants.filter(p => p.water < 25).length;
  const buggy = S.plants.filter(p => p.pests).length;
  const dying = S.plants.filter(p => p.critSince).length;
  const wilting = S.plants.filter(p => !p.critSince && p.health < WILT_AT).length;
  let line = sabLine || pick(LINES.greet);
  let mood = sabMood;
  /* keep the line stable while the situation is stable, so re-renders don't babble */
  const key = dying ? 'critical' : wilting ? 'wilting' : buggy ? 'pest' : thirsty ? 'thirsty' : null;
  if (key) {
    if (sabCache.key !== key) sabCache = { key, line: pick(LINES[key]) };
    line = sabCache.line; mood = 'sad';
  } else sabCache.key = null;
  const hint = dying ? `${dying} plant${dying > 1 ? 's are' : ' is'} dying — act now`
    : wilting ? `${wilting} plant${wilting > 1 ? 's' : ''} wilting`
    : buggy ? `${buggy} plant${buggy > 1 ? 's need' : ' needs'} treating`
    : thirsty ? `${thirsty} thirsty plant${thirsty > 1 ? 's' : ''}`
    : `${S.plants.length}/${totalSlots()} slots · ${cosiness()} cosiness · 🔥${S.streak} day streak`;
  return `${renderSabrina(mood)}<div class="speech"><b>Sabrina:</b> ${esc(line)}<em>${esc(hint)}</em></div>`;
}

/* ---------- small bits ---------- */
const rarPill = r => `<span class="rar" style="background:${RARITY[r].color}">${RARITY[r].name}</span>`;
const meterRow = p => `<div class="meters">
  <div class="m w"><i style="width:${p.water}%"></i></div>
  <div class="m f"><i style="width:${p.food}%"></i></div>
  <div class="m h"><i style="width:${p.health}%"></i></div>
  <div class="m g"><i style="width:${Math.round(p.growth * 100)}%"></i></div></div>`;

function plantCard(p) {
  const sp = SPECIES_BY_ID[p.speciesId];
  const er = effectiveRarity(p);
  const fresh = now() - p.lastLeaf < 1000 * 60 * 3;
  let badge = '';
  if (p.critSince) badge = `<div class="badge dying">🥀 dying ${fmtTime(p.critLeft ?? CRITICAL_H * 3600)}</div>`;
  else if (p.health < WILT_AT) badge = `<div class="badge bug">🥀 wilting</div>`;
  else if (p.pests) badge = `<div class="badge bug">🐛 pests</div>`;
  else if (p.water < 22) badge = `<div class="badge warn">💧 thirsty</div>`;
  else if (fresh) badge = `<div class="badge">✨ new leaf</div>`;
  return `<div class="pcard ${p.critSince ? 'crit' : ''}" data-plant="${p.id}" data-lv="${p.leaves.length}">
    ${badge}
    <div class="art">${renderPlant(p, { tag: 'c' })}</div>
    <div class="nm">${esc(p.nick || plantName(p))}</div>
    <div class="sub">${rarPill(er)} <span>${PATHS[p.path].badge} ${p.leaves.length}🍃</span></div>
    ${meterRow(p)}
  </div>`;
}

/* ---------- garden ---------- */
function renderGarden() {
  const zones = ZONE_IDS;
  const cap = slotCap();
  let h = '';
  /* Home-screen apps keep their storage; plain Safari tabs get wiped after 7 idle
     days. This is the single most important thing a new player can do. */
  if (!STORE.isInstalled() && !S.hideInstall) {
    h += `<div class="installbar">
      <div style="font-size:24px">📲</div>
      <div class="txt" style="flex:1"><b>Keep your garden safe</b>
        <span>Add this to your home screen so your plants can't be wiped.</span></div>
      <button class="btn sm" id="installHow">How</button>
      <button class="btn sm ghost" id="installNo">✕</button>
    </div>`;
  }
  h += `<div class="sabrina-bar" id="sabbar">${sabrinaBarHTML()}</div>`;

  const dailyDone = S.quests.filter(q => q.claimed).length;
  h += `<h2 class="sec">📋 Today's list <span class="cap">${dailyDone}/${S.quests.length}</span></h2><div class="list">`;
  S.quests.forEach(q => {
    const done = q.prog >= q.goal;
    h += `<div class="item">
      <div class="ic">${q.claimed ? '✅' : done ? '🎁' : '⬜'}</div>
      <div class="txt"><b>${esc(q.text)}</b><span>${q.prog}/${q.goal} · ${q.coins}🪙 ${q.xp}xp</span>
        <div class="pbar"><i style="width:${Math.min(100, q.prog / q.goal * 100)}%"></i></div></div>
      ${q.claimed ? '' : `<button class="btn sm ${done ? 'gold' : 'ghost'}" data-quest="${q.id}" ${done ? '' : 'disabled'}>Claim</button>`}
    </div>`;
  });
  h += `</div>`;

  zones.forEach(z => {
    const list = S.plants.filter(p => p.zone === z);
    if (z === 'cabinet' && !cap.cabinet && !list.length) {
      h += `<h2 class="sec">🌫️ Greenhouse Cabinet <span class="cap">locked</span></h2>
        <div class="empty-slot" data-decor="cabinet" style="min-height:96px">
          <div style="font-size:26px">🌫️</div>buy a Greenhouse Cabinet<br>
          <span class="small">4 humid slots — where the fussy ones thrive</span></div>`;
      return;
    }
    h += `<h2 class="sec">${ZONES[z].icon} ${ZONES[z].name} <span class="cap">${list.length}/${cap[z]}</span></h2>`;
    h += `<div class="grid">`;
    h += list.map(plantCard).join('');
    if (list.length < cap[z]) h += `<div class="empty-slot" data-shop="1"><div style="font-size:26px">🪴</div>empty spot<br><span class="small">tap to visit market</span></div>`;
    h += `</div>`;
  });
  $('#screen-garden').innerHTML = h;
}

/* ---------- plant sheet ---------- */
function openPlant(id) {
  openPlantId = id;
  $('#sheet').classList.add('on');
  renderSheet();
}
function closeSheet() { openPlantId = null; $('#sheet').classList.remove('on'); }

function renderSheet() {
  const p = S.plants.find(x => x.id === openPlantId);
  if (!p) return closeSheet();
  const sp = SPECIES_BY_ID[p.speciesId];
  const er = effectiveRarity(p);
  const fac = factorsFor(p);
  const spl = secondsPerLeaf(p);
  const eta = isFinite(spl) ? fmtTime(Math.max(0, (1 - p.growth) * spl)) : '—';
  const varName = VARIEG[bestVarOf(p)]?.name;
  const shade = SHADINGS.find(s => s.id === p.shading);

  let h = `<div class="grab"></div>
  <div class="hero">
    <div style="flex:1;display:flex;justify-content:center">${renderPlant(p, { tag: 's' })}</div>
    <div class="side">
      <h3>${esc(p.nick || plantName(p))}</h3>
      <div class="lat">${esc(sp.latin)}</div>
      <div class="tagrow">
        ${rarPill(er)}
        <span class="tag">${PATHS[p.path].badge} ${PATHS[p.path].name}</span>
        <span class="tag">${shade ? shade.name : ''}</span>
        ${varName ? `<span class="tag">${varName}</span>` : ''}
        ${p.hybrid ? `<span class="tag">🧬 Hybrid</span>` : ''}
        ${p.moss ? `<span class="tag">🪵 Poled</span>` : ''}
        ${p.globes ? `<span class="tag">🫧 Globes</span>` : ''}
        <span class="tag">${STAGES[stageOf(p)]}</span>
      </div>
    </div>
  </div>

  ${p.critSince ? `<div class="critbar">🥀 CRITICAL — ${esc(p.nick || plantName(p))} dies in ${fmtTime(p.critLeft ?? CRITICAL_H * 3600)}.<br>
      Water it and use a 💗 Revival Tonic.</div>`
    : p.health < WILT_AT ? `<div class="critbar" style="background:#c06a2a;animation:none">🥀 Wilting — health ${Math.round(p.health)}%. Water and feed it before it bottoms out.</div>` : ''}

  <div class="statline"><span>🍃 ${p.leaves.length}/${sp.maxLeaves} leaves</span><span>💰 worth ${plantValue(p)}</span></div>

  <div class="bigmeter"><label><span>💧 Water</span><span>${Math.round(p.water)}%</span></label><div class="m w"><i style="width:${p.water}%"></i></div></div>
  <div class="bigmeter"><label><span>🧪 Feed</span><span>${Math.round(p.food)}%</span></label><div class="m f"><i style="width:${p.food}%"></i></div></div>
  <div class="bigmeter"><label><span>❤️ Health</span><span>${Math.round(p.health)}%</span></label><div class="m f"><i style="width:${p.health}%;background:linear-gradient(90deg,#ff9ec4,#e0729f)"></i></div></div>
  <div class="bigmeter"><label><span>🌱 Next leaf</span><span>${eta}</span></label><div class="m g"><i style="width:${Math.round(p.growth * 100)}%"></i></div></div>

  <div class="actions">
    <div class="act ${p.water > 92 ? 'off' : ''}" data-act="water"><b>💧</b>Water</div>
    <div class="act ${(S.inv.fertilizer || 0) < 1 ? 'off' : ''}" data-act="feed"><b>🧪</b>Feed<br>${S.inv.fertilizer || 0}</div>
    <div class="act ${p.misted > now() ? 'off' : ''}" data-act="mist"><b>💨</b>Mist</div>
    <div class="act ${p.rotated > now() ? 'off' : ''}" data-act="rotate"><b>🔄</b>Turn</div>
    <div class="act ${p.pests ? '' : 'off'}" data-act="treat"><b>🐛</b>Treat<br>${S.inv.neem || 0}</div>
    <div class="act ${p.health > 45 || (S.inv.tonic || 0) < 1 ? 'off' : ''}" data-act="revive"><b>💗</b>Tonic<br>${S.inv.tonic || 0}</div>
    <div class="act ${p.leaves.length < 4 ? 'off' : ''}" data-act="cut"><b>✂️</b>Cutting</div>
    <div class="act ${p.moss || (S.inv.moss || 0) < 1 ? 'off' : ''}" data-act="moss"><b>🪵</b>Pole</div>
    <div class="act ${p.globes || (S.inv.globes || 0) < 1 ? 'off' : ''}" data-act="globes"><b>🫧</b>Globes<br>${S.inv.globes || 0}</div>
    <div class="act ${(S.inv.camera || 0) < 1 ? 'off' : ''}" data-act="photo"><b>📸</b>Photo<br>${S.inv.camera || 0}</div>
  </div>

  <h2 class="sec">☀️ Light</h2>
  <div class="zones">
    ${ZONE_IDS.filter(z => slotCap()[z] > 0 || p.zone === z).map(z => `<div class="zbtn ${p.zone === z ? 'on' : ''}" data-zone="${z}">
      <div style="font-size:17px">${ZONES[z].icon}</div>${ZONES[z].name}<br>
      <span style="font-weight:800;opacity:.7">${zoneUsed(z)}/${slotCap()[z]}</span></div>`).join('')}
  </div>
  <p class="small" style="margin:8px 2px">${esc(ZONES[p.zone].desc)} Growing here is shaping it toward the <b>${PATHS[p.path].name}</b> form — ${esc(PATHS[p.path].desc)}</p>

  <h2 class="sec">🪴 Pot &amp; soil</h2>
  <div class="item"><div class="ic">🪴</div><div class="txt"><b>${POTS_BY_ID[p.potId].name}</b>
    <span>${SOILS_BY_ID[p.soilId].name} · growth ×${(POTS_BY_ID[p.potId].growth * SOILS_BY_ID[p.soilId].growth).toFixed(2)}${fac.potFit < 1 ? ' · <b style="color:#c05252">root-bound!</b>' : ''}</span></div>
    <button class="btn sm ghost" data-act="repot">Change</button></div>

  <p class="small" style="margin:12px 2px">${esc(sp.blurb)}</p>

  <div class="row" style="margin-top:12px">
    <button class="btn ghost" data-act="rename">✏️ Rename</button>
    <button class="btn pink" data-act="sell">💰 Sell · ${plantValue(p)}</button>
  </div>
  <button class="btn ghost" style="width:100%;margin-top:8px" data-act="close">Close</button>`;

  $('#sheetPanel').innerHTML = h;
}
function fmtTime(s) {
  if (!isFinite(s)) return '—';
  if (s < 60) return Math.ceil(s) + 's';
  if (s < 3600) return Math.round(s / 60) + 'm';
  return (s / 3600).toFixed(1) + 'h';
}

/* ---------- propagation lab ---------- */
function renderLab() {
  let h = `<h2 class="sec">🧪 Propagation station <span class="cap">${S.lab.length}/${labCap()}</span></h2>`;
  h += `<p class="small" style="margin:0 4px 10px">Take a cutting from any plant with 4+ leaves. Rooted cuttings can be potted up — or grafted together into something that shouldn't exist.</p>`;
  if (!S.lab.length) {
    h += `<div class="empty-slot" style="min-height:110px">no cuttings yet<br><span class="small">open a plant → ✂️ Cutting</span></div>`;
  }
  h += `<div class="list">`;
  S.lab.forEach(c => {
    const rootLen = 6 + c.progress * 30;
    const roots = Array.from({ length: 5 }, (_, i) => {
      const dir = i % 2 ? 1 : -1, len = rootLen * (0.5 + (i % 3) * 0.25);
      return `<path d="M 23 ${14 + i * 3} q ${dir * 7} ${len * 0.5} ${dir * (4 + i * 2)} ${len}"
        stroke="#efe6d2" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    }).join('');
    h += `<div class="prop">
      <div class="jar">
        <div class="stem">🌿</div>
        <div class="glass"></div>
        <svg viewBox="0 0 46 56" style="position:absolute;inset:0">${roots}</svg>
      </div>
      <div class="txt" style="flex:1">
        <b>${esc(c.name)}</b>
        <span>${c.rooted ? 'Rooted and ready 🎉' : `Rooting… ${Math.round(c.progress * 100)}%${c.hormone ? ' · 🍯 boosted' : ''}`}</span>
        <div class="pbar"><i style="width:${c.progress * 100}%"></i></div>
      </div>
      <button class="btn sm ${c.rooted ? '' : 'ghost'}" data-pot="${c.id}" ${c.rooted ? '' : 'disabled'}>Pot up</button>
    </div>`;
  });
  h += `</div>`;

  const rooted = S.lab.filter(c => c.rooted);
  h += `<h2 class="sec">🧬 Grafting bench</h2>
  <p class="small" style="margin:0 4px 10px">Fuse two rooted cuttings into a hybrid with blended foliage. Needs 🎀 Graft Tape (you have ${S.inv.graftTape || 0}). ~72% success — a failed union costs both cuttings.</p>`;
  if (rooted.length < 2) {
    h += `<div class="empty-slot" style="min-height:80px">need 2 rooted cuttings</div>`;
  } else {
    h += `<div class="chips" id="graftPick">${rooted.map(c => `<div class="chip" data-graft="${c.id}">${esc(c.name)}</div>`).join('')}</div>
      <button class="btn gold" style="width:100%" id="doGraft" disabled>🎀 Graft selected</button>`;
  }

  h += `<h2 class="sec">🎒 Supplies</h2><div class="list">`;
  Object.keys(ITEMS).forEach(k => {
    const n = S.inv[k] || 0;
    if (!n) return;
    h += `<div class="item"><div class="ic">${ITEMS[k].icon}</div><div class="txt"><b>${ITEMS[k].name} ×${n}</b><span>${esc(ITEMS[k].desc)}</span></div></div>`;
  });
  if (S.dust) h += `<div class="item"><div class="ic">✨</div><div class="txt"><b>Variegation Dust is primed</b><span>The next leaf anywhere in the garden is guaranteed a variegation roll.</span></div></div>`;
  h += `</div>`;
  $('#screen-lab').innerHTML = h;
}
let graftSel = [];

/* ---------- arcade ---------- */
function renderArcade() {
  regenTickets();
  const eta = ticketETA();
  let h = `<div class="ticketbar">
    <div class="tk">${'🎟️'.repeat(Math.max(0, S.tickets)) || '—'}</div>
    <div class="txt" style="flex:1"><b>${S.tickets}/${MAX_TICKETS} tickets</b>
      <span>${S.tickets >= MAX_TICKETS ? 'Full house. Go and win something.' : `next in ${fmtTime(eta)} · one per ${TICKET_MIN} min`}</span></div>
  </div>
  <p class="small" style="margin:10px 4px">Sabrina's little arcade. Each game costs a ticket and pays out
  in coins — far faster than waiting on leaves. Play well and you get a garden perk on top.</p>`;

  h += `<div class="list">`;
  ARCADE.list().forEach(g => {
    const best = (S.best || {})[g.id] || 0;
    h += `<div class="gcard">
      <div class="gic">${g.icon}</div>
      <div class="txt" style="flex:1"><b>${esc(g.name)}</b><span>${esc(g.rule)}</span>
        <span style="color:var(--gold);font-weight:900">best ${best}${best ? ' pts' : ''}</span></div>
      <button class="btn ${S.tickets > 0 ? '' : 'ghost'}" data-play="${g.id}">Play</button>
    </div>`;
  });
  h += `</div>`;

  /* passive income */
  h += `<h2 class="sec">🏪 Plant stall</h2>`;
  if (!stallCount()) {
    h += `<div class="empty-slot" data-decor="stall" style="min-height:96px">
      <div style="font-size:26px">🏪</div>buy a Plant Stall<br>
      <span class="small">earns coins on its own, even while the app is closed</span></div>`;
  } else {
    const ready = Math.floor(S.stall || 0);
    h += `<div class="stallcard">
      <div style="font-size:34px">🏪</div>
      <div class="txt" style="flex:1"><b>${ready} 🪙 waiting</b>
        <span>${stallRate()}/hour from your collection · fills in 12h · ${stallCount()} stall${stallCount() > 1 ? 's' : ''}</span>
        <div class="pbar"><i style="width:${stallCap() ? Math.min(100, (S.stall || 0) / stallCap() * 100) : 0}%"></i></div></div>
      <button class="btn gold" id="collectStall" ${ready < 1 ? 'disabled' : ''}>Collect</button>
    </div>`;
  }

  h += `<h2 class="sec">💰 Faster coins</h2><div class="list">
    <div class="item"><div class="ic">🎮</div><div class="txt"><b>Mini-games</b><span>up to ~${Math.round(300 * (1 + S.level * 0.05))}🪙 a play, ${MAX_TICKETS} banked plays</span></div></div>
    <div class="item"><div class="ic">🏪</div><div class="txt"><b>Plant stall</b><span>passive income that scales with how valuable your collection is</span></div></div>
    <div class="item"><div class="ic">📸</div><div class="txt"><b>Polaroids</b><span>photograph a rare, mature plant for a cut of its value</span></div></div>
    <div class="item"><div class="ic">📋</div><div class="txt"><b>Dailies &amp; streak</b><span>three quests a day plus a streak bonus that keeps climbing</span></div></div>
  </div>`;
  $('#screen-arcade').innerHTML = h;
}

function tryPlay(id) {
  if (!A.spendTicket()) {
    bad(`Out of tickets — one back in ${fmtTime(ticketETA())}.`);
    return;
  }
  sfx('open');
  renderArcade();
  ARCADE.open(id, res => {
    const note = A.arcadeReward(res);
    toast(`+${res.coins}🪙 from ${ARCADE.GAMES[res.id].name}`, 'gold');
    sparkle('🪙', 14); sfx('coin');
    if (note) setTimeout(() => toast(note, 'pink'), 900);
    renderTop(); renderArcade();
  });
}
window.tryPlay = tryPlay;

/* ---------- shop ---------- */
function renderShop() {
  const tabs = [['plants', '🪴 Market'], ['pots', '🏺 Pots'], ['soil', '🌰 Soil'], ['supplies', '🎒 Supplies'], ['decor', '🏡 Garden']];
  let h = `<div class="tabs">${tabs.map(([k, n]) => `<div class="tab ${shopTab === k ? 'on' : ''}" data-tab="${k}">${n}</div>`).join('')}</div>`;

  if (shopTab === 'plants') {
    h += `<p class="small" style="margin:0 4px 10px">Stock rotates every day. Rare drops are luck — refresh early with 💎 if you're feeling reckless.</p><div class="list">`;
    S.market.forEach(o => {
      const sp = SPECIES_BY_ID[o.speciesId];
      const er = effectiveRarity({ speciesId: o.speciesId, leaves: [{ varieg: o.varieg }] });
      h += `<div class="item">
        <div style="width:66px;height:78px;flex:none">${renderPlant({ id: 9000 + parseInt(o.key.slice(1)) || 9000, speciesId: o.speciesId, potId: 'nursery', path: 'bright', shading: 'matte', water: 90, growth: 0, leaves: Array.from({ length: o.leaves }, (_, i) => ({ seed: hashStr(o.key + i), len: 48 + i * 5, fen: sp.shape === 'fenestrated' ? .2 + i * .1 : 0, varieg: i === o.leaves - 1 ? o.varieg : 'none', unfurl: 1 })) }, { tag: 'm' })}</div>
        <div class="txt"><b>${esc((VARIEG[o.varieg]?.name ? VARIEG[o.varieg].name + ' ' : '') + sp.name)}</b>
          <span>${rarPill(er)} ${o.leaves} ${o.leaves > 1 ? 'leaves' : 'leaf'} · ${esc(sp.latin)}</span></div>
        <div style="text-align:right"><div class="price">${o.price}🪙</div>
          <button class="btn sm" data-buyplant="${o.key}" style="margin-top:4px">Buy</button></div>
      </div>`;
    });
    h += `</div><button class="btn ghost" style="width:100%;margin-top:10px" id="refreshMarket">🔄 Refresh stock · 1💎</button>`;
  }

  if (shopTab === 'pots') {
    h += `<div class="list">` + POTS.map(p => `<div class="item">
      <div class="ic" style="color:${p.fill}">🏺</div>
      <div class="txt"><b>${p.name}</b><span>size ${p.size} · growth ×${p.growth}${p.humid ? ' · humidity +' : ''} · drainage ${p.drain}</span></div>
      <div class="price">${p.price ? p.price + '🪙' : 'free'}</div></div>`).join('')
      + `</div><p class="small" style="margin:10px 4px">Pots are bought at the moment you repot — open a plant → 🪴 Repot.</p>`;
  }

  if (shopTab === 'soil') {
    h += `<div class="list">` + SOILS.map(s => `<div class="item">
      <div class="ic">🌰</div>
      <div class="txt"><b>${s.name}</b><span>growth ×${s.growth} · drainage ×${s.drain} · rot risk ×${s.rot}</span></div>
      <div class="price">${s.price ? s.price + '🪙' : 'free'}</div></div>`).join('')
      + `</div><p class="small" style="margin:10px 4px">Chosen during repotting, same as pots.</p>`;
  }

  if (shopTab === 'supplies') {
    h += `<div class="list">` + Object.keys(ITEMS).map(k => `<div class="item">
      <div class="ic">${ITEMS[k].icon}</div>
      <div class="txt"><b>${ITEMS[k].name}</b><span>${esc(ITEMS[k].desc)}${S.inv[k] ? ` · owned ${S.inv[k]}` : ''}</span></div>
      <div style="text-align:right"><div class="price">${ITEMS[k].price}🪙</div>
      <button class="btn sm" data-buyitem="${k}" style="margin-top:4px">Buy</button></div></div>`).join('') + `</div>`;
  }

  if (shopTab === 'decor') {
    h += `<p class="small" style="margin:0 4px 10px">Cosiness speeds every plant a little and improves variegation odds. Shelves and windows add slots.</p><div class="list">`;
    h += DECOR.map(d => {
      const owned = S.decor[d.id] || 0;
      const cost = Math.round(d.price * Math.pow(1.7, owned));
      return `<div class="item"><div class="ic">${d.icon}</div>
        <div class="txt"><b>${d.name}${owned ? ` ×${owned}` : ''}</b><span>${esc(d.desc)}</span></div>
        <div style="text-align:right"><div class="price">${cost}🪙</div>
        <button class="btn sm" data-buydecor="${d.id}" style="margin-top:4px">Buy</button></div></div>`;
    }).join('') + `</div>`;
  }
  $('#screen-shop').innerHTML = h;
}

/* ---------- journal ---------- */
function renderJournal() {
  const found = Object.keys(S.dex).length;
  let h = `<h2 class="sec">📖 Species journal <span class="cap">${found}/${SPECIES.length}</span></h2><div class="dexgrid">`;
  SPECIES.slice().sort((a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity)).forEach(sp => {
    const d = S.dex[sp.id];
    const demo = {
      id: hashStr(sp.id) % 9999, speciesId: sp.id, potId: 'terra', path: 'bright',
      shading: 'matte', water: 90, growth: 0,
      leaves: Array.from({ length: 4 }, (_, i) => ({ seed: hashStr(sp.id + i), len: 44 + i * 6, fen: sp.shape === 'fenestrated' ? .2 + i * .12 : 0, varieg: d && i === 3 ? d.bestVar : 'none', unfurl: 1 })),
    };
    h += `<div class="dex ${d ? '' : 'locked'}" data-dex="${sp.id}">
      ${renderPlant(demo, { tag: 'd' })}
      <div class="nm">${d ? esc(sp.name) : '???'}</div>
      <div class="sub" style="font-size:8.5px">${rarPill(sp.rarity)}</div>
      ${d ? `<div class="small" style="font-size:8.5px">${d.grown} leaves grown</div>` : ''}
    </div>`;
  });
  h += `</div>`;

  h += `<h2 class="sec">🏆 Achievements <span class="cap">${Object.keys(S.ach).length}/${ACHIEVEMENTS.length}</span></h2><div class="list">`;
  ACHIEVEMENTS.forEach(a => {
    const got = !!S.ach[a.id];
    h += `<div class="item" style="${got ? '' : 'opacity:.55'}"><div class="ic">${got ? '🏆' : '🔒'}</div>
      <div class="txt"><b>${a.name}</b><span>${esc(a.desc)}</span></div><div class="price">${a.gems}💎</div></div>`;
  });
  h += `</div>`;

  if (S.memorial && S.memorial.length) {
    h += `<h2 class="sec">🥀 In memory <span class="cap">${S.memorial.length}</span></h2>
      <p class="small" style="margin:0 4px 8px">Every plant person has a shelf like this. Keep a 💗 Revival Tonic on hand.</p><div class="list">`;
    S.memorial.slice(0, 10).forEach(m => {
      h += `<div class="item" style="opacity:.75"><div class="ic">🥀</div>
        <div class="txt"><b>${esc(m.name)}</b>
        <span>${esc(m.species)} · ${RARITY[m.rarity].name} · ${m.leaves} leaves · lived ${m.days} day${m.days > 1 ? 's' : ''} · ${timeAgo(m.at)}</span></div></div>`;
    });
    h += `</div>`;
  }

  if (S.album && S.album.length) {
    h += `<h2 class="sec">📸 Photo album <span class="cap">${S.album.length}</span></h2><div class="list">`;
    S.album.slice(0, 8).forEach(a => {
      h += `<div class="item"><div class="ic">📷</div><div class="txt"><b>${esc(a.name)}</b>
        <span>${RARITY[a.rarity].name} · ${a.leaves} leaves · ${timeAgo(a.at)}</span></div></div>`;
    });
    h += `</div>`;
  }

  h += `<h2 class="sec">🔔 Recent</h2><div class="list">`;
  if (!S.alerts.length) h += `<div class="item"><div class="ic">🌙</div><div class="txt"><span>Nothing yet. Go grow something.</span></div></div>`;
  S.alerts.slice(0, 15).forEach(a => {
    const ico = { leaf: '🌱', rare: '✨', pest: '🐛', root: '🫙', ach: '🏆', level: '⭐', wilt: '🥀', critical: '🚨', death: '🥀' }[a.type] || '🔔';
    h += `<div class="item"><div class="ic">${ico}</div><div class="txt"><b style="font-size:12px">${esc(a.text)}</b>
      <span>${timeAgo(a.at)}</span></div></div>`;
  });
  h += `</div>`;
  $('#screen-journal').innerHTML = h;
}
function timeAgo(t) {
  const s = (now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return Math.round(s / 86400) + ' d ago';
}

/* ---------- Sabrina / profile ---------- */
/* ---------- visiting someone else's garden ---------- */
let visiting = null;          // decoded snapshot, or null when you're home
let pendingWelcome = false;   // opened a friend's link before ever playing

function renderVisit() {
  const g = visiting;
  const name = g.name || 'Their';
  const owner = name.endsWith('s') ? `${name}'` : `${name}'s`;
  let h = `<div class="visitbar">
      <div style="font-size:24px">🌏</div>
      <div class="txt" style="flex:1"><b>Visiting ${esc(owner)} garden</b>
        <span>Have a look around — you can't change anything here.</span></div>
      <button class="btn sm ghost" id="leaveVisit">Leave</button>
    </div>`;

  h += `<div class="list" style="margin-bottom:4px">
    <div class="item"><div class="ic">🪴</div><div class="txt"><b>${g.plants.length} plant${g.plants.length === 1 ? '' : 's'} on show</b>
      <span>${g.tp ? `their best ${g.plants.length} of ${g.tp} · ` : ''}level ${g.lv || 1} · ${g.cz || 0} cosiness · 🔥${g.st || 0} day streak</span></div></div>
    <div class="item"><div class="ic">🍃</div><div class="txt"><b>${g.lf || 0} leaves grown</b>
      <span>${g.dx || 0} of ${SPECIES.length} species discovered</span></div></div>`;
  const best = g.plants.slice().sort((a, b) => rarityOrder(effectiveRarity(b)) - rarityOrder(effectiveRarity(a)))[0];
  if (best) {
    h += `<div class="item"><div class="ic">👑</div><div class="txt"><b>Pride of their shelf: ${esc(best.nick || plantName(best))}</b>
      <span>${RARITY[effectiveRarity(best)].name} · ${best.leaves.length} leaves</span></div></div>`;
  }
  h += `</div>`;

  h += `<h2 class="sec">🌿 Their garden</h2><div class="grid">`;
  h += g.plants.map(p => `<div class="pcard" data-visit="${p.id}">
      <div class="art">${renderPlant(p, { tag: 'v' })}</div>
      <div class="nm">${esc(p.nick || plantName(p))}</div>
      <div class="sub">${rarPill(effectiveRarity(p))} <span>${PATHS[p.path].badge} ${p.leaves.length}🍃</span></div>
    </div>`).join('');
  h += `</div>`;

  h += `<button class="btn pink" style="width:100%;margin-top:16px" id="shareBack">📤 Send them your garden</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" id="leaveVisit2">Back to my garden</button>`;
  $('#screen-visit').innerHTML = h;
}

function visitPlantModal(id) {
  const p = visiting && visiting.plants.find(x => x.id === id);
  if (!p) return;
  const sp = SPECIES_BY_ID[p.speciesId];
  const shade = SHADINGS.find(s => s.id === p.shading);
  const bv = VARIEG[bestVarOf(p)];
  modal(`<div style="height:170px">${renderPlant(p, { tag: 'vm' })}</div>
    <h3>${esc(p.nick || plantName(p))}</h3>
    <p><i>${esc(sp.latin)}</i></p>
    <div class="tagrow" style="justify-content:center">
      ${rarPill(effectiveRarity(p))}
      <span class="tag">${PATHS[p.path].badge} ${PATHS[p.path].name}</span>
      ${shade ? `<span class="tag">${shade.name}</span>` : ''}
      ${bv && bv.name ? `<span class="tag">${bv.name}</span>` : ''}
      <span class="tag">${p.leaves.length} leaves</span>
      ${p.moss ? `<span class="tag">🪵 Poled</span>` : ''}
    </div>
    <p class="small" style="margin-top:12px">${esc(sp.blurb)}</p>
    <button class="btn ghost" style="width:100%;margin-top:10px" data-close="1">Close</button>`);
  $('#modalBox').onclick = e => { if (e.target.closest('[data-close]')) closeModal(); };
}

/* a small thank-you for going to look, once per friend per day */
function visitReward(name) {
  const day = new Date().toISOString().slice(0, 10);
  S.visited = S.visited || {};
  const key = (name || 'friend').toLowerCase();
  if (S.visited[key] === day) return null;
  S.visited[key] = day;
  const coins = 60 + Math.floor((S.level || 1) * 12);
  S.coins += coins;
  addXP(15);
  save();
  return coins;
}

async function openVisit(code) {
  const data = await GARDEN_LINK.decode(code);
  if (!data) { bad('That garden link is damaged or from a newer version.'); return false; }
  visiting = { ...data, name: data.n };
  go('visit');
  const got = visitReward(visiting.name);
  if (got) {
    setTimeout(() => {
      toast(`+${got}🪙 for visiting${visiting.name ? ' ' + visiting.name : ''} 🌏`, 'gold');
      sparkle('🌿', 12); sfx('coin'); renderTop();
    }, 700);
  }
  return true;
}

function leaveVisit() {
  visiting = null;
  GARDEN_LINK.clearHash();
  go('garden');
  /* if their link was this player's very first contact with the game, introduce
     Sabrina now rather than dumping them in a garden with no explanation */
  if (pendingWelcome) { pendingWelcome = false; welcomeModal(); return; }
  toast('Back in your own garden 🌿');
}

async function shareGarden() {
  if (!S.plants.length) return bad('Grow something first!');
  if (!S.gardener) return nameGardenModal();
  const link = await GARDEN_LINK.makeLink(S);
  const text = `Come and see my garden 🌿`;
  let shared = false;
  try {
    if (navigator.share) { await navigator.share({ title: "Sabrina's Secret Garden", text, url: link.url }); shared = true; }
  } catch (e) { shared = e && e.name === 'AbortError'; if (shared) return; }
  if (!shared) {
    try { await navigator.clipboard.writeText(link.url); toast('Garden link copied — paste it to them 📋', 'gold'); sfx('coin'); }
    catch (e) { linkFallbackModal(link.url); return; }
  }
  if (link.tooLong) setTimeout(() => toast('Big garden! Only your best plants fit in the link.', ''), 1400);
}

function linkFallbackModal(url) {
  modal(`<h3>Your garden link</h3><p>Copy this and send it to them.</p>
    <textarea class="name" id="linkBox" rows="4" style="height:auto;font-size:11px;text-align:left">${esc(url)}</textarea>
    <button class="btn pink" style="width:100%" id="copyLink">Copy</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" data-close="1">Done</button>`);
  setTimeout(() => { const t = $('#linkBox'); if (t) { t.focus(); t.select(); } }, 60);
  $('#modalBox').onclick = e => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#copyLink')) {
      const t = $('#linkBox'); t.select();
      try { document.execCommand('copy'); toast('Copied 📋', 'gold'); } catch (err) { bad('Select it and copy manually.'); }
    }
  };
}

function nameGardenModal() {
  modal(`<div style="width:96px;height:96px;margin:0 auto">${renderSabrina('excited')}</div>
    <h3>What should we call your garden?</h3>
    <p>They'll see this name when they visit.</p>
    <input class="name" id="gName" maxlength="24" placeholder="e.g. Sean" value="${esc(S.gardener || '')}">
    <button class="btn pink" style="width:100%" id="saveName">Save &amp; share</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" data-close="1">Cancel</button>`);
  setTimeout(() => $('#gName') && $('#gName').focus(), 60);
  $('#modalBox').onclick = e => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#saveName')) {
      const v = $('#gName').value.trim();
      if (!v) return bad('Pick a name first.');
      S.gardener = v.slice(0, 24); save(); closeModal(); shareGarden();
    }
  };
}

/* ---------- install prompt ---------- */
let deferredInstall = null;
function installModal() {
  const ios = STORE.isIOS();
  const steps = ios
    ? `<p style="text-align:left">1. Tap the <b>Share</b> button at the bottom of Safari<br>
        2. Scroll down and tap <b>Add to Home Screen</b><br>
        3. Tap <b>Add</b><br><br>
        Open it from that icon from now on. Safari clears a normal tab's saved data after
        7 days without a visit — a home screen app is exempt, so your garden stays put.</p>`
    : deferredInstall
    ? `<p>Install it as an app so it gets its own icon and your garden can't be cleared out
        with your browsing data.</p>`
    : `<p style="text-align:left">Open your browser menu and choose <b>Install app</b> or
        <b>Add to Home screen</b>.<br><br>
        It gets its own icon, works with no signal, and keeps your garden safe from being
        cleared with your browsing data.</p>`;
  modal(`<div style="font-size:44px">📲</div><h3>Add to your home screen</h3>${steps}
    ${deferredInstall ? `<button class="btn pink" style="width:100%" id="doInstall">Install</button>` : ''}
    <button class="btn ghost" style="width:100%;margin-top:8px" data-close="1">Got it</button>`);
  $('#modalBox').onclick = e => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#doInstall') && deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(() => { deferredInstall = null; closeModal(); });
    }
  };
}

/* ---------- save safety ---------- */
function backupSave() {
  save();
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sabrinas-garden-${d}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Backup saved. Keep it somewhere safe 💚', 'gold'); sfx('coin');
}

function restoreSave(file) {
  const fr = new FileReader();
  fr.onload = () => {
    let data = null;
    try { data = JSON.parse(fr.result); } catch (e) {}
    if (!data || !data.plants) return bad('That file isn\'t a garden backup.');
    modal(`<h3>Restore this garden?</h3>
      <p><b>${data.plants.length}</b> plant${data.plants.length === 1 ? '' : 's'} · <b>${Math.floor(data.coins || 0)}</b>🪙 · level <b>${data.level || 1}</b><br>
      saved ${data.savedAt ? timeAgo(data.savedAt) : 'at an unknown time'}.<br><br>
      This replaces the garden currently on this device.</p>
      <div class="row"><button class="btn ghost" data-close="1">Cancel</button>
      <button class="btn pink" id="doRestore">Restore</button></div>`);
    $('#modalBox').onclick = e => {
      if (e.target.closest('[data-close]')) closeModal();
      if (e.target.closest('#doRestore')) {
        S = data;
        save();
        closeModal();
        toast('Garden restored 🌿', 'gold'); sparkle('🌿', 16); sfx('fanfare');
        renderSig = ''; renderTop(); renderScreen();
      }
    };
  };
  fr.onerror = () => bad('Could not read that file.');
  fr.readAsText(file);
}

async function refreshStorageState() {
  const el = $('#storageState');
  if (!el) return;
  const st = await STORE.status();
  let msg, tone = 'var(--ink2)';
  if (st.installed) {
    msg = 'Added to your home screen — progress is safe here.';
    tone = 'var(--green)';
  } else if (st.ios) {
    msg = 'Safari can wipe a website\'s save after 7 unopened days. Add to Home Screen to stop that.';
    tone = '#c06a2a';
  } else if (st.persisted) {
    msg = 'Storage marked persistent — the browser won\'t evict your garden.';
    tone = 'var(--green)';
  } else {
    msg = 'Saved in this browser. Add to Home Screen (or back up) to be certain.';
    tone = '#c06a2a';
  }
  el.textContent = msg;
  el.style.color = tone;
}

function renderProfile() {
  const totalValue = S.plants.reduce((a, p) => a + plantValue(p), 0);
  const rarest = S.plants.slice().sort((a, b) => rarityOrder(effectiveRarity(b)) - rarityOrder(effectiveRarity(a)))[0];
  let h = `<div class="sabrina-bar" style="flex-direction:column;text-align:center;padding:16px">
    <div style="width:120px;height:120px">${renderSabrina('happy')}</div>
    <div style="font-weight:900;font-size:20px;color:var(--green)">Sabrina</div>
    <div class="small">Level ${S.level} plant person · 🔥 ${S.streak} day streak</div>
  </div>`;

  h += `<h2 class="sec">🌏 Visiting</h2>
  <p class="small" style="margin:0 4px 10px">Send someone a link to your garden and they can walk
  round it — no account, no signup. Visiting theirs earns you coins once a day.</p>
  <div class="list">
    <div class="item"><div class="ic">📤</div><div class="txt"><b>Share my garden</b>
      <span>${S.gardener ? `they'll see it as “${esc(S.gardener)}”` : 'pick a name and send a link'}</span></div>
      <button class="btn sm" id="shareGarden">Share</button></div>
    ${S.gardener ? `<div class="item"><div class="ic">✏️</div><div class="txt"><b>Garden name</b>
      <span>${esc(S.gardener)}</span></div>
      <button class="btn sm ghost" id="renameGarden">Rename</button></div>` : ''}
  </div>

  <h2 class="sec">🌿 Her garden</h2><div class="list">
    <div class="item"><div class="ic">🪴</div><div class="txt"><b>${S.plants.length} plants · ${totalSlots()} slots</b><span>collection worth ${totalValue}🪙</span></div></div>
    <div class="item"><div class="ic">🍃</div><div class="txt"><b>${S.stats.leaves} leaves grown</b><span>${S.stats.watered} waterings · ${S.stats.rooted} cuttings rooted · ${S.stats.grafts} grafts</span></div></div>
    <div class="item"><div class="ic">${(S.stats.lost || 0) ? '🥀' : '💚'}</div><div class="txt"><b>${(S.stats.lost || 0)} lost · ${(S.stats.revived || 0)} revived</b>
      <span>${(S.stats.lost || 0) ? 'Their names are in the Journal.' : 'Not one plant lost. Sabrina is very proud.'}</span></div></div>
    <div class="item"><div class="ic">🏡</div><div class="txt"><b>${cosiness()} cosiness</b><span>${Object.entries(S.decor).map(([k, v]) => DECOR_BY_ID[k].icon + '×' + v).join(' ') || 'no decor yet'}</span></div></div>
    ${rarest ? `<div class="item"><div class="ic">👑</div><div class="txt"><b>Pride of the shelf: ${esc(rarest.nick || plantName(rarest))}</b><span>${RARITY[effectiveRarity(rarest)].name} · ${rarest.leaves.length} leaves</span></div></div>` : ''}
  </div>`;

  h += `<h2 class="sec">🌗 Grow paths</h2><div class="list">`
    + Object.values(PATHS).map(p => `<div class="item"><div class="ic">${p.badge}</div>
      <div class="txt"><b>${p.name}</b><span>${esc(p.desc)}</span></div>
      <div class="price">${S.plants.filter(x => x.path === p.id).length}</div></div>`).join('') + `</div>`;

  h += `<h2 class="sec">🎵 Sound</h2><div class="list">
    <div class="item"><div class="ic">🔊</div><div class="txt"><b>Sound effects</b><span>watering, unfurling leaves, coins</span></div>
      <button class="btn sm ${S.sound !== false ? '' : 'ghost'}" id="toggleSound">${S.sound !== false ? 'On' : 'Off'}</button></div>
    <div class="item"><div class="ic">🎚️</div><div class="txt" style="padding-right:4px"><b>Effects volume</b>
      <input class="slider" type="range" min="0" max="100" value="${S.sfxVol ?? 80}" id="sfxVol"></div>
      <span class="price" id="sfxVolN">${S.sfxVol ?? 80}</span></div>
    <div class="item"><div class="ic">🎶</div><div class="txt"><b>Background music</b><span>a slow, generative greenhouse loop</span></div>
      <button class="btn sm ${S.music !== false ? '' : 'ghost'}" id="toggleMusic">${S.music !== false ? 'On' : 'Off'}</button></div>
    <div class="item"><div class="ic">🎚️</div><div class="txt" style="padding-right:4px"><b>Music volume</b>
      <input class="slider" type="range" min="0" max="100" value="${S.musVol ?? 45}" id="musVol"></div>
      <span class="price" id="musVolN">${S.musVol ?? 45}</span></div>
  </div>

  <h2 class="sec">⚙️ Settings</h2><div class="list">
    <div class="item"><div class="ic">🕊️</div><div class="txt"><b>Gentle mode</b>
      <span>${S.gentle ? 'On — nothing can die, health floors at 6%.' : 'Off — neglect a plant for long enough and you lose it.'}</span></div>
      <button class="btn sm ${S.gentle ? '' : 'ghost'}" id="toggleGentle">${S.gentle ? 'On' : 'Off'}</button></div>
    <div class="item"><div class="ic">💾</div><div class="txt"><b>Save</b><span>auto-saves locally; ${MAX_OFFLINE_H}h offline growth, ${MAX_DECAY_H}h of thirst</span></div>
      <button class="btn sm ghost" id="manualSave">Save</button></div>
    <div class="item" id="storageRow"><div class="ic">🛡️</div><div class="txt"><b>Your garden's safety</b>
      <span id="storageState">checking…</span></div></div>
    <div class="item"><div class="ic">📤</div><div class="txt"><b>Back up to a file</b>
      <span>downloads your whole garden — keep it somewhere safe</span></div>
      <button class="btn sm ghost" id="backupBtn">Back up</button></div>
    <div class="item"><div class="ic">📥</div><div class="txt"><b>Restore from a backup</b>
      <span>replaces the current garden with a saved file</span></div>
      <label class="btn sm ghost" for="restoreFile" style="cursor:pointer">Restore</label>
      <input type="file" id="restoreFile" accept="application/json,.json" style="display:none"></div>
    <div class="item"><div class="ic">🧨</div><div class="txt"><b>Start over</b><span>wipes the whole garden</span></div>
      <button class="btn sm ghost" id="resetBtn">Reset</button></div>
  </div>`;
  $('#screen-profile').innerHTML = h;
  refreshStorageState();
}

/* ---------- modals ---------- */
function modal(html) { $('#modalBox').innerHTML = html; $('#modal').classList.add('on'); }
function closeModal() { $('#modal').classList.remove('on'); }

function repotModal(p) {
  let potSel = p.potId, soilSel = p.soilId;
  const draw = () => {
    const cost = (potSel !== p.potId ? POTS_BY_ID[potSel].price : 0) + (soilSel !== p.soilId ? SOILS_BY_ID[soilSel].price : 0);
    modal(`<h3>Repot ${esc(p.nick || plantName(p))}</h3>
      <div style="height:150px">${renderPlant({ ...p, potId: potSel }, { tag: 'r' })}</div>
      <p>Bigger pots let roots run. Better soil means faster, healthier growth.</p>
      <div class="chips">${POTS.map(x => `<div class="chip ${potSel === x.id ? 'on' : ''}" data-pot2="${x.id}">${x.name}${x.price ? ' ' + x.price + '🪙' : ''}</div>`).join('')}</div>
      <div class="chips">${SOILS.map(x => `<div class="chip ${soilSel === x.id ? 'on' : ''}" data-soil="${x.id}">${x.name}${x.price ? ' ' + x.price + '🪙' : ''}</div>`).join('')}</div>
      <div class="row"><button class="btn ghost" data-close="1">Cancel</button>
      <button class="btn" id="doRepot">Repot · ${cost}🪙</button></div>`);
    $('#modalBox').onclick = e => {
      const pot = e.target.closest('[data-pot2]'), soil = e.target.closest('[data-soil]');
      if (pot) { potSel = pot.dataset.pot2; draw(); }
      else if (soil) { soilSel = soil.dataset.soil; draw(); }
      else if (e.target.closest('[data-close]')) closeModal();
      else if (e.target.closest('#doRepot')) {
        const r = A.repot(p, potSel, soilSel);
        if (r === true) { toast('Repotted! Fresh soil, happy roots.', ''); sfx('thunk'); closeModal(); renderSheet(); }
        else bad(r);
      }
    };
  };
  draw();
}

function renameModal(p) {
  modal(`<h3>Name this one</h3><p>Every plant person names their plants. It's the law.</p>
    <input class="name" id="nameIn" maxlength="22" value="${esc(p.nick || '')}" placeholder="${esc(plantName(p))}">
    <div class="row"><button class="btn ghost" data-close="1">Cancel</button><button class="btn pink" id="doName">Save</button></div>`);
  setTimeout(() => $('#nameIn') && $('#nameIn').focus(), 60);
  $('#modalBox').onclick = e => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#doName')) { A.rename(p, $('#nameIn').value.trim()); closeModal(); renderSheet(); toast('Named.', 'pink'); }
  };
}

function sellModal(p) {
  const v = plantValue(p);
  modal(`<h3>Sell ${esc(p.nick || plantName(p))}?</h3>
    <div style="height:140px">${renderPlant(p, { tag: 'x' })}</div>
    <p>A collector offers <b>${v}🪙</b>. Sabrina will be brave about it.</p>
    <div class="row"><button class="btn ghost" data-close="1">Keep it</button><button class="btn pink" id="doSell">Sell</button></div>`);
  $('#modalBox').onclick = e => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#doSell')) { const got = A.sell(p); closeModal(); closeSheet(); toast(`Sold for ${got}🪙`, 'gold'); sparkle('🪙', 12); sfx('coin'); }
  };
}

function welcomeModal() {
  modal(`<div style="width:110px;height:110px;margin:0 auto">${renderSabrina('excited')}</div>
    <h3>Hi, I'm Sabrina!</h3>
    <p>This is my apartment and that is my Monstera. I'd like it to be a jungle by the end of the year, so — help me out?<br><br>
    Water them, feed them, move them into the right light, and every so often a brand new leaf will unfurl. Some come out <b>variegated</b>. Those are the ones worth staying up for.</p>
    <button class="btn pink" style="width:100%" data-close="1">Let's grow 🌿</button>`);
  $('#modalBox').onclick = e => { if (e.target.closest('[data-close]')) { closeModal(); S.intro = true; save(); } };
}

function awayModal(r, daily) {
  const bits = [];
  if (r.gained) bits.push(`<b>${r.gained}</b> new ${r.gained > 1 ? 'leaves' : 'leaf'} unfurled`);
  if (r.rooted) bits.push(`<b>${r.rooted}</b> cutting${r.rooted > 1 ? 's' : ''} rooted`);
  const thirsty = S.plants.filter(p => p.water < 25).length;
  if (thirsty) bits.push(`<b>${thirsty}</b> plant${thirsty > 1 ? 's are' : ' is'} thirsty`);
  const dying = S.plants.filter(p => p.critSince).length;
  if (dying) bits.push(`<b style="color:#8f2020">${dying} dying — go now</b>`);
  if (r.lost) bits.push(`<b style="color:#8f2020">you lost ${r.lost} plant${r.lost > 1 ? 's' : ''}</b>`);
  modal(`<div style="width:100px;height:100px;margin:0 auto">${renderSabrina(bits.length ? 'excited' : 'happy')}</div>
    <h3>You were gone ${fmtTime(r.away)}</h3>
    <p>${bits.length ? bits.join('<br>') : 'Everything held steady while you were out.'}
    ${daily ? `<br><br>🎁 Daily gift: <b>${daily.reward}🪙</b> + fertilizer · 🔥 ${daily.streak} day streak` : ''}</p>
    <button class="btn" style="width:100%" data-close="1">Go say hi</button>`);
  $('#modalBox').onclick = e => { if (e.target.closest('[data-close]')) closeModal(); };
}

/* ---------- nav & routing ---------- */
function go(name) {
  screen = name;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === 'screen-' + name));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === name));
  renderScreen();
  $('#screens').scrollTop = 0;
}
function renderScreen() {
  if (screen === 'garden') renderGarden();
  if (screen === 'lab') renderLab();
  if (screen === 'arcade') renderArcade();
  if (screen === 'visit') renderVisit();
  if (screen === 'shop') renderShop();
  if (screen === 'journal') renderJournal();
  if (screen === 'profile') renderProfile();
}
function renderTop() {
  $('#coins').textContent = Math.floor(S.coins);
  $('#gems').textContent = S.gems;
  $('#lvlnum').textContent = 'Lv ' + S.level;
  $('#lvlfill').style.width = Math.min(100, S.xp / levelCost(S.level) * 100) + '%';
  const unread = S.alerts.filter(a => !a.seen).length;
  $('#navDot').style.display = unread ? 'block' : 'none';
  /* nudge toward the arcade when tickets are capped or the stall is loaded */
  const nudge = (S.tickets >= MAX_TICKETS) || Math.floor(S.stall || 0) >= 50;
  const ad = $('#arcadeDot'); if (ad) ad.style.display = nudge && screen !== 'arcade' ? 'block' : 'none';
}

/* signature = anything that changes plant art structure */
function sigOf() {
  /* health is bucketed so wilting redraws the art, but not on every single point */
  return S.plants.map(p => `${p.id}:${p.leaves.length}:${p.potId}:${p.zone}:${p.path}:${p.pests ? 1 : 0}:${p.moss ? 1 : 0}:${Math.round(p.health / 10)}:${p.critSince ? 1 : 0}`).join('|')
    + '#' + S.lab.map(c => c.id + (c.rooted ? 'r' : '')).join(',') + '#' + S.market.length + '#' + screen
    /* arcade counters only matter while you're looking at the arcade */
    + (screen === 'arcade' ? `#${S.tickets}:${Math.floor(S.stall || 0)}:${Math.round(ticketETA() / 30)}` : '');
}

/* cheap per-second refresh that doesn't rebuild SVGs */
function refreshLive() {
  renderTop();
  /* never rebuild the DOM out from under a running mini-game. Guarded so that a
     failed script load degrades to "no arcade" instead of killing the game loop. */
  if (typeof ARCADE !== 'undefined' && ARCADE.isRunning()) return;
  if (visiting) return;                       // their garden is a snapshot, leave it alone
  const sig = sigOf();
  if (sig !== renderSig) { renderSig = sig; renderScreen(); if (openPlantId) renderSheet(); return; }

  if (screen === 'garden') {
    S.plants.forEach(p => {
      const card = document.querySelector(`.pcard[data-plant="${p.id}"]`);
      if (!card) return;
      const ms = card.querySelectorAll('.m i');
      if (ms[0]) ms[0].style.width = p.water + '%';
      if (ms[1]) ms[1].style.width = p.food + '%';
      if (ms[2]) ms[2].style.width = p.health + '%';
      if (ms[3]) ms[3].style.width = (p.growth * 100) + '%';
      const db = card.querySelector('.badge.dying');
      if (db) db.textContent = `🥀 dying ${fmtTime(p.critLeft ?? CRITICAL_H * 3600)}`;
    });
  }
  if (screen === 'lab') {
    S.lab.forEach(c => {
      const el = document.querySelector(`[data-pot="${c.id}"]`);
      if (el) { const bar = el.parentElement.querySelector('.pbar i'); if (bar) bar.style.width = c.progress * 100 + '%'; }
    });
  }
  if (openPlantId) {
    const p = S.plants.find(x => x.id === openPlantId);
    if (p) {
      const bm = $$('#sheetPanel .bigmeter');
      const vals = [p.water, p.food, p.health, p.growth * 100];
      const labels = [Math.round(p.water) + '%', Math.round(p.food) + '%', Math.round(p.health) + '%', fmtTime(Math.max(0, (1 - p.growth) * secondsPerLeaf(p)))];
      bm.forEach((b, i) => {
        const f = b.querySelector('.m i'); if (f) f.style.width = vals[i] + '%';
        const l = b.querySelectorAll('label span')[1]; if (l) l.textContent = labels[i];
      });
    }
  }
}

/* ---------- global click routing ---------- */
function wire() {
  $('#nav').onclick = e => {
    const b = e.target.closest('button[data-go]');
    if (!b) return;
    sfx('tap');
    if (b.dataset.go === 'journal') { S.alerts.forEach(a => a.seen = true); save(); }
    if (visiting) {                                   // leaving their garden
      visiting = null; GARDEN_LINK.clearHash();
      if (pendingWelcome) { pendingWelcome = false; go(b.dataset.go); welcomeModal(); return; }
    }
    go(b.dataset.go);
  };

  $('#screens').onclick = e => {
    const card = e.target.closest('.pcard');
    if (card) { sfx('open'); openPlant(+card.dataset.plant); return; }
    if (e.target.closest('[data-shop]')) { go('shop'); shopTab = 'plants'; renderShop(); return; }

    const q = e.target.closest('[data-quest]');
    if (q) { const quest = S.quests.find(x => x.id === q.dataset.quest); if (claimQuest(quest)) { toast(`+${quest.coins}🪙`, 'gold'); sparkle('🪙', 10); sfx('coin'); } return; }

    const tab = e.target.closest('[data-tab]');
    if (tab) { shopTab = tab.dataset.tab; renderShop(); sfx('tap'); return; }

    const bp = e.target.closest('[data-buyplant]');
    if (bp) {
      const o = S.market.find(x => x.key === bp.dataset.buyplant);
      const r = A.buyPlant(o);
      if (r === true) { toast('Welcome home, little one 🌱', 'pink'); sparkle('🌿', 14); sfx('buy'); renderShop(); }
      else bad(r);
      return;
    }
    const bi = e.target.closest('[data-buyitem]');
    if (bi) { const r = A.buyItem(bi.dataset.buyitem); if (r === true) { toast('Bought!', ''); sfx('buy'); renderShop(); } else bad(r); return; }
    const bd = e.target.closest('[data-buydecor]');
    if (bd) { const r = A.buyDecor(bd.dataset.buydecor); if (r === true) { toast('The place looks lovely 🏡', 'pink'); sparkle('✨', 12); sfx('buy'); renderShop(); } else bad(r); return; }

    if (e.target.closest('#refreshMarket')) {
      if (S.gems < 1) return toast('Not enough gems.', 'bad');
      S.gems--; rollMarket(); save(); renderShop(); toast('New stock in.', ''); sfx('tap'); return;
    }

    const potUp = e.target.closest('[data-pot]');
    if (potUp) {
      const c = S.lab.find(x => x.id === +potUp.dataset.pot);
      const r = A.potCutting(c);
      if (r === true) { toast('Potted up! A whole new plant.', 'pink'); sparkle('🪴', 14); sfx('root'); renderLab(); }
      else bad(r);
      return;
    }

    const g = e.target.closest('[data-graft]');
    if (g) {
      const id = +g.dataset.graft;
      graftSel = graftSel.includes(id) ? graftSel.filter(x => x !== id) : [...graftSel, id].slice(-2);
      $$('[data-graft]').forEach(el => el.classList.toggle('on', graftSel.includes(+el.dataset.graft)));
      $('#doGraft').disabled = graftSel.length !== 2;
      return;
    }
    if (e.target.closest('#doGraft')) {
      const [a, b] = graftSel.map(id => S.lab.find(c => c.id === id));
      const r = A.graft(a, b);
      graftSel = [];
      if (r === true) { toast('The graft took! Say hello to a hybrid 🧬', 'pink'); sparkle('🧬', 20); sfx('graft'); }
      else bad(r);
      renderLab();
      return;
    }

    if (e.target.closest('#toggleSound')) {
      S.sound = S.sound === false; save(); pushAudioSettings(); renderProfile();
      if (S.sound) sfx('feed');
      return;
    }
    if (e.target.closest('#toggleMusic')) {
      S.music = S.music === false; save(); pushAudioSettings();
      if (!S.music) AUDIO.stopMusic();
      renderProfile(); return;
    }
    if (e.target.closest('#toggleGentle')) {
      S.gentle = !S.gentle;
      if (S.gentle) S.plants.forEach(p => { p.critSince = null; p.critLeft = undefined; p.health = Math.max(p.health, 6); });
      save(); renderProfile(); toast(S.gentle ? 'Gentle mode on — nothing dies.' : 'Gentle mode off. Look after them.', S.gentle ? '' : 'bad');
      return;
    }
    const vc = e.target.closest('[data-visit]');
    if (vc) { sfx('open'); visitPlantModal(+vc.dataset.visit); return; }
    if (e.target.closest('#leaveVisit') || e.target.closest('#leaveVisit2')) { leaveVisit(); return; }
    if (e.target.closest('#shareBack') || e.target.closest('#shareGarden')) { shareGarden(); return; }
    if (e.target.closest('#renameGarden')) { nameGardenModal(); return; }

    if (e.target.closest('#installNo')) { S.hideInstall = true; save(); renderGarden(); return; }
    if (e.target.closest('#installHow')) { installModal(); return; }

    const dec = e.target.closest('[data-decor]');
    if (dec) { go('shop'); shopTab = 'decor'; renderShop(); return; }

    const play = e.target.closest('[data-play]');
    if (play) { tryPlay(play.dataset.play); return; }
    if (e.target.closest('#collectStall')) {
      const got = collectStall();
      if (got) { toast(`The stall took ${got}🪙 while you were out.`, 'gold'); sparkle('🪙', 14); sfx('coin'); }
      renderArcade(); renderTop(); return;
    }
    if (e.target.closest('#manualSave')) {
      const ok = save();
      if (ok) toast('Saved 💾'); else bad('This browser is blocking saves — back up to a file.');
      return;
    }
    if (e.target.closest('#backupBtn')) { backupSave(); return; }
    if (e.target.closest('#resetBtn')) {
      modal(`<h3>Start over?</h3><p>This wipes Sabrina's whole garden. There is no undo.</p>
        <div class="row"><button class="btn ghost" data-close="1">Never mind</button><button class="btn pink" id="doReset">Wipe it</button></div>`);
      $('#modalBox').onclick = ev => {
        if (ev.target.closest('[data-close]')) closeModal();
        if (ev.target.closest('#doReset')) hardReset();
      };
      return;
    }
  };

  $('#sheet').onclick = e => {
    if (e.target.closest('.veil')) return closeSheet();
    const p = S.plants.find(x => x.id === openPlantId);
    if (!p) return;
    const z = e.target.closest('[data-zone]');
    if (z) {
      const r = A.move(p, z.dataset.zone);
      if (r === true) { toast(`Moved to the ${ZONES[z.dataset.zone].name}.`, ''); sfx('turn'); renderSheet(); }
      else bad(r);
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    let r;
    switch (act) {
      case 'water': r = A.water(p); if (r === true) { toast(pick(LINES.water), ''); sparkle('💧', 10); sfx('water'); buzz(15); say('water'); } break;
      case 'feed': r = A.feed(p); if (r === true) { toast('Fed. Growth burst!', 'gold'); sparkle('✨', 8); sfx('feed'); } break;
      case 'mist': r = A.mist(p); if (r === true) { toast('Misted — +8% growth for 15 min.', ''); sparkle('💨', 8); sfx('mist'); } break;
      case 'rotate': r = A.rotate(p); if (r === true) { toast('Turned toward the light — +10% for 20 min.', ''); sfx('turn'); } break;
      case 'treat': r = A.treat(p); if (r === true) { toast('Pests gone. Crisis averted.', ''); sparkle('🧴', 8); sfx('spray'); } break;
      case 'revive': r = A.revive(p); if (r === true) { toast('It\'s breathing again. Don\'t do that to me.', 'pink'); sparkle('💗', 18); sfx('revive'); buzz([20, 30, 20]); } break;
      case 'moss': r = A.addMoss(p); if (r === true) { toast('Moss pole in — bigger leaves incoming.', 'gold'); sfx('thunk'); } break;
      case 'globes': r = A.addGlobes(p); if (r === true) { toast('Globes in. This one dries out half as fast now.', 'gold'); sparkle('🫧', 10); sfx('thunk'); } break;
      case 'cut': r = A.cutting(p); if (r === true) { toast('Cutting taken — check the Lab 🧪', 'pink'); sparkle('✂️', 8); sfx('snip'); } break;
      case 'photo': {
        const pay = A.photo(p);
        if (typeof pay === 'number') { toast(`📸 Snapped! The plant people loved it. +${pay}🪙`, 'gold'); sparkle('📸', 10); sfx('shutter'); }
        else r = pay;
        break;
      }
      case 'repot': repotModal(p); return;
      case 'rename': renameModal(p); return;
      case 'sell': sellModal(p); return;
      case 'close': closeSheet(); return;
    }
    if (typeof r === 'string') bad(r);
    else renderSheet();
  };

  /* volume sliders live-update the buses as you drag */
  $('#screens').addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'sfxVol') { S.sfxVol = +t.value; $('#sfxVolN').textContent = t.value; pushAudioSettings(); }
    else if (t.id === 'musVol') { S.musVol = +t.value; $('#musVolN').textContent = t.value; pushAudioSettings(); }
    else return;
    save();
  });
  $('#screens').addEventListener('change', e => {
    if (e.target.id === 'sfxVol') sfx('leaf');
  });

  /* audio can only start inside a real gesture on mobile — and some browsers only
     grant persistent storage from a gesture too, so ask again here */
  const wake = () => { AUDIO.unlock(); pushAudioSettings(); STORE.requestPersistence(); };
  ['pointerdown', 'touchend', 'keydown'].forEach(ev =>
    window.addEventListener(ev, wake, { once: true, passive: true }));

  $('#screens').addEventListener('change', e => {
    if (e.target.id === 'restoreFile' && e.target.files && e.target.files[0]) {
      restoreSave(e.target.files[0]);
      e.target.value = '';
    }
  });

  $('#modal').onclick = e => { if (e.target.closest('.veil')) closeModal(); };
  /* Tapping a garden link while the game is already open only changes the fragment —
     the page never reloads, so boot() won't see it. Catch it here. */
  window.addEventListener('hashchange', () => {
    const code = GARDEN_LINK.readHash();
    if (code) openVisit(code);
    else if (visiting) { visiting = null; go('garden'); }
  });

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  window.addEventListener('appinstalled', () => { S.hideInstall = true; save(); renderGarden(); toast('Installed! Your garden is safe here 💚', 'gold'); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { save(); AUDIO.setActive(false); }
    else AUDIO.setActive(true);
  });
  window.addEventListener('beforeunload', save);
}

/* Pin the app to the *visual* viewport. Without this a phone's collapsing browser
   toolbar leaves the app sized to a different height than the page, and you can
   scroll down onto a second, empty screen below the nav bar. */
function fitViewport() {
  const vv = window.visualViewport;
  const h = Math.round(vv ? vv.height : window.innerHeight);
  document.documentElement.style.setProperty('--appH', h + 'px');
  window.scrollTo(0, 0);
}
function watchViewport() {
  fitViewport();
  ['resize', 'orientationchange', 'pageshow'].forEach(ev => window.addEventListener(ev, fitViewport));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitViewport);
    window.visualViewport.addEventListener('scroll', fitViewport);
  }
  /* iOS fires the resize after the rotation paints */
  window.addEventListener('orientationchange', () => setTimeout(fitViewport, 260));
}

/* ---------- boot ---------- */
async function boot() {
  watchViewport();
  /* read both stores and take the newest surviving copy */
  const found = await STORE.loadBest();
  const res = load(found.raw);
  if (found.recovered) {
    setTimeout(() => toast(`Recovered your garden from backup storage.`, 'gold'), 1200);
  }
  STORE.requestPersistence();
  const daily = checkDaily();
  save();
  wire();
  onChange(() => { renderTop(); });
  go('garden');
  renderTop();

  const shared = GARDEN_LINK.readHash();
  let openedVisit = false;
  if (shared) {
    openedVisit = await openVisit(shared);
    if (openedVisit && res.fresh) { pendingWelcome = true; S.intro = true; save(); }
  }

  if (openedVisit) { /* skip the usual welcome/daily popups over someone's garden */ }
  else if (res.fresh) welcomeModal();
  else if (res.away > 90) awayModal(res, daily);
  else if (daily) {
    modal(`<div style="width:100px;height:100px;margin:0 auto">${renderSabrina('excited')}</div>
      <h3>Day ${daily.streak}!</h3><p>🎁 <b>${daily.reward}🪙</b> and a fertilizer. New market stock and new dailies are up.</p>
      <button class="btn" style="width:100%" data-close="1">Lovely</button>`);
    $('#modalBox').onclick = e => { if (e.target.closest('[data-close]')) closeModal(); };
  }

  let last = now();
  setInterval(() => {
    const t = now(), dt = (t - last) / 1000; last = t;
    try {
      tick(Math.min(dt, 5));
      refreshLive();
    } catch (err) {
      console.error('tick failed', err);   // one bad frame must not stop the garden
    }
  }, 1000);
  setInterval(save, 8000);
}
document.addEventListener('DOMContentLoaded', () => { boot(); });
