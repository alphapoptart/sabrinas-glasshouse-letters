/* Sabrina's Secret Garden — the arcade.
   Three tap-friendly mini-games. Each one calls done({score, coins, perks}) and the
   UI layer handles paying out. Every game must clean up its own timers in stop(). */

const ARCADE = (function () {
  let box = null, stopFn = null, doneCb = null;
  let running = false;
  const isRunning = () => running;

  /* ---------- shell ---------- */
  function open(id, done) {
    const g = GAMES[id];
    if (!g) return;
    doneCb = done;
    running = true;
    box = document.getElementById('gameBox');
    document.getElementById('gameOverlay').classList.add('on');
    box.innerHTML = `<div class="gamehead">
        <div><b>${g.icon} ${g.name}</b><span>${g.rule}</span></div>
        <button class="btn sm ghost" id="gQuit">Quit</button>
      </div>
      <div class="gamehud" id="gHud"></div>
      <div class="gamefield" id="gField"></div>`;
    box.querySelector('#gQuit').onclick = () => finish(null);
    stopFn = g.run(box.querySelector('#gField'), box.querySelector('#gHud'), res => finish(res));
  }

  function finish(res) {
    if (!running) return;
    running = false;
    try { stopFn && stopFn(); } catch (e) {}
    stopFn = null;
    if (!res) { close(); return; }
    showResult(res);
  }

  function showResult(res) {
    box.innerHTML = `<div class="gameover">
      <div class="big">${res.rank}</div>
      <h3>${res.title}</h3>
      <p>${res.detail}</p>
      <div class="payout">+${res.coins} 🪙${res.xp ? ` · +${res.xp} xp` : ''}</div>
      ${res.perk ? `<div class="perk">${res.perkText || ''}</div>` : ''}
      <button class="btn pink" id="gDone" style="width:100%;margin-top:14px">Lovely</button>
      <button class="btn ghost" id="gAgain" style="width:100%;margin-top:8px">Play again</button>
    </div>`;
    box.querySelector('#gDone').onclick = () => { doneCb && doneCb(res); close(); };
    box.querySelector('#gAgain').onclick = () => { doneCb && doneCb(res); const id = res.id; close(); setTimeout(() => window.tryPlay(id), 60); };
  }

  function close() {
    running = false;
    try { stopFn && stopFn(); } catch (e) {}
    stopFn = null;
    document.getElementById('gameOverlay').classList.remove('on');
    if (box) box.innerHTML = '';
  }

  /* All three games top out around the same number, so no single game is the
     obvious grind. Level scaling is capped at 2x. */
  const PAYOUT_CEIL = 300;
  const payout = base => Math.round(Math.min(base, PAYOUT_CEIL) * Math.min(2, 1 + S.level * 0.05));

  /* one leaf, drawn on its own — used by the memory game */
  function leafTile(speciesId, seed) {
    const sp = SPECIES_BY_ID[speciesId];
    const L = 82;
    const piece = drawLeaf({ seed, len: L, fen: sp.shape === 'fenestrated' ? 0.5 : 0, varieg: 'none', n: seed, unfurl: 1 }, sp, { uid: 'tile' + speciesId + seed });
    return `<svg viewBox="-52 -96 104 104" class="tilesvg"><defs>${piece.defs}</defs>${piece.body}</svg>`;
  }

  /* ================= 1. Perfect Pour ================= */
  const pour = {
    name: 'Perfect Pour', icon: '💧', rule: 'Tap when the drop hits the wet zone',
    run(field, hud, done) {
      const ROUNDS = 6;
      let round = 0, score = 0, combo = 0, best = 0, pos = 0, dir = 1, raf = null, alive = true;

      field.innerHTML = `<div class="pourwrap">
        <div class="pourbar" id="pb">
          <div class="pourzone" id="pz"></div>
          <div class="pourmark" id="pm"></div>
        </div>
        <div class="pourmsg" id="pmsg">Tap anywhere to pour</div>
        <div class="pourplant">💧</div>
      </div>`;
      const pm = field.querySelector('#pm'), pz = field.querySelector('#pz'), msg = field.querySelector('#pmsg');

      let zoneCenter = 50, zoneHalf = 15, speed = 0.75;
      function setupRound() {
        zoneHalf = Math.max(4.5, 15 - round * 1.9);
        zoneCenter = 22 + Math.random() * 56;
        speed = 0.75 + round * 0.22;
        pos = 0; dir = 1;
        pz.style.left = (zoneCenter - zoneHalf) + '%';
        pz.style.width = (zoneHalf * 2) + '%';
        hudUp();
      }
      const hudUp = () => hud.innerHTML =
        `<span>Round <b>${Math.min(round + 1, ROUNDS)}/${ROUNDS}</b></span><span>Score <b>${score}</b></span><span>Combo <b>×${combo}</b></span>`;

      function loop() {
        if (!alive) return;
        pos += dir * speed;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        pm.style.left = pos + '%';
        raf = requestAnimationFrame(loop);
      }

      function tap() {
        if (!alive) return;
        const d = Math.abs(pos - zoneCenter);
        let gained = 0, label = '';
        if (d <= zoneHalf * 0.34) { combo++; gained = 3 + combo; label = 'PERFECT!'; msg.className = 'pourmsg good'; }
        else if (d <= zoneHalf) { combo++; gained = 1 + Math.floor(combo / 2); label = 'Nice'; msg.className = 'pourmsg ok'; }
        else { combo = 0; label = 'Missed'; msg.className = 'pourmsg miss'; }
        score += gained; best = Math.max(best, combo);
        msg.textContent = label + (gained ? ` +${gained}` : '');
        try { AUDIO.sfx(gained >= 4 ? 'rare' : gained ? 'water' : 'error'); } catch (e) {}
        round++;
        if (round >= ROUNDS) return end();
        setupRound();
      }

      function end() {
        alive = false;
        cancelAnimationFrame(raf);
        const coins = payout(score * 6.5);
        done({
          id: 'pour', score, coins, xp: 10 + score,
          rank: score >= 22 ? '🏆' : score >= 14 ? '💧' : '🌱',
          title: score >= 22 ? 'Immaculate pour' : score >= 14 ? 'Well watered' : 'A bit splashy',
          detail: `${score} points · best combo ×${best}`,
          perk: score >= 14 ? 'water' : null,
          perkText: 'Every plant in the garden got watered.',
        });
      }

      field.addEventListener('pointerdown', tap);
      setupRound(); loop();
      return () => { alive = false; cancelAnimationFrame(raf); field.removeEventListener('pointerdown', tap); };
    },
  };

  /* ================= 2. Bug Blitz ================= */
  const bugs = {
    name: 'Bug Blitz', icon: '🐛', rule: 'Squash pests — never the ladybirds or bees',
    run(field, hud, done) {
      const PESTS = ['🐛', '🕷️', '🦗', '🪲'], FRIENDS = ['🐞', '🐝', '🦋'];
      let score = 0, hits = 0, oops = 0, combo = 0, timeLeft = 25;
      let spawnT = null, tickT = null, alive = true;
      field.innerHTML = `<div class="bugfield" id="bf"></div>`;
      const bf = field.querySelector('#bf');
      const hudUp = () => hud.innerHTML =
        `<span>⏱ <b>${timeLeft}s</b></span><span>Score <b>${score}</b></span><span>Combo <b>×${combo}</b></span>`;
      hudUp();

      function spawn() {
        if (!alive) return;
        const friend = Math.random() < 0.24;
        const el = document.createElement('div');
        el.className = 'bug' + (friend ? ' friend' : '');
        el.textContent = friend ? FRIENDS[(Math.random() * FRIENDS.length) | 0] : PESTS[(Math.random() * PESTS.length) | 0];
        el.style.left = (6 + Math.random() * 82) + '%';
        el.style.top = (6 + Math.random() * 78) + '%';
        const life = Math.max(620, 1250 - (25 - timeLeft) * 26);
        el.style.animationDuration = life + 'ms';
        el.addEventListener('pointerdown', ev => {
          ev.stopPropagation();
          if (!alive || el.dataset.dead) return;
          el.dataset.dead = '1';
          if (friend) {
            oops++; combo = 0; score = Math.max(0, score - 2);
            el.textContent = '💔'; try { AUDIO.sfx('error'); } catch (e) {}
          } else {
            hits++; combo++; score += 1 + Math.min(3, Math.floor(combo / 5));
            el.textContent = '💥'; try { AUDIO.sfx('snip'); } catch (e) {}
          }
          el.classList.add('popped'); hudUp();
          setTimeout(() => el.remove(), 220);
        });
        bf.appendChild(el);
        setTimeout(() => el.remove(), life);
        const gap = Math.max(240, 700 - (25 - timeLeft) * 17);
        spawnT = setTimeout(spawn, gap * (0.6 + Math.random() * 0.8));
      }

      tickT = setInterval(() => {
        timeLeft--; hudUp();
        if (timeLeft <= 0) end();
      }, 1000);

      function end() {
        alive = false;
        clearInterval(tickT); clearTimeout(spawnT);
        const coins = payout(score * 3);
        done({
          id: 'bugs', score, coins, xp: 8 + Math.min(60, score),
          rank: score >= 70 ? '🏆' : score >= 40 ? '🧴' : '🐛',
          title: score >= 70 ? 'Nothing survives you' : score >= 40 ? 'Pest patrol' : 'They got away',
          detail: `${hits} squashed · ${oops} friend${oops === 1 ? '' : 's'} hurt`,
          perk: score >= 40 ? 'pests' : null,
          perkText: 'Every plant in the garden is now pest-free.',
        });
      }

      spawn();
      return () => { alive = false; clearInterval(tickT); clearTimeout(spawnT); };
    },
  };

  /* ================= 3. Leaf Match ================= */
  const match = {
    name: 'Leaf Match', icon: '🍃', rule: 'Find all 8 pairs in as few flips as possible',
    run(field, hud, done) {
      const pool = SPECIES.slice().sort(() => Math.random() - 0.5).slice(0, 8);
      let deck = [];
      pool.forEach((sp, i) => { deck.push({ sp, k: i }); deck.push({ sp, k: i }); });
      deck.sort(() => Math.random() - 0.5);

      let flips = 0, found = 0, first = null, lock = false, timeLeft = 70, tickT = null, alive = true;
      field.innerHTML = `<div class="matchgrid" id="mg">${deck.map((c, i) =>
        `<div class="mcard" data-i="${i}"><div class="mface back">🌿</div><div class="mface front">${leafTile(c.sp.id, c.k * 37 + 11)}</div></div>`).join('')}</div>`;
      const grid = field.querySelector('#mg');
      const hudUp = () => hud.innerHTML =
        `<span>⏱ <b>${timeLeft}s</b></span><span>Pairs <b>${found}/8</b></span><span>Flips <b>${flips}</b></span>`;
      hudUp();

      grid.addEventListener('pointerdown', e => {
        const el = e.target.closest('.mcard');
        if (!el || lock || !alive || el.classList.contains('done') || el.classList.contains('up')) return;
        el.classList.add('up'); flips++;
        try { AUDIO.sfx('tap'); } catch (err) {}
        const i = +el.dataset.i;
        if (first === null) { first = i; hudUp(); return; }
        const a = deck[first], b = deck[i];
        if (a.k === b.k && first !== i) {
          found++;
          grid.querySelector(`[data-i="${first}"]`).classList.add('done');
          el.classList.add('done');
          first = null;
          try { AUDIO.sfx('leaf'); } catch (err) {}
          hudUp();
          if (found === 8) return end();
        } else {
          lock = true;
          const prev = grid.querySelector(`[data-i="${first}"]`);
          first = null; hudUp();
          setTimeout(() => { prev.classList.remove('up'); el.classList.remove('up'); lock = false; }, 620);
        }
      });

      tickT = setInterval(() => { timeLeft--; hudUp(); if (timeLeft <= 0) end(); }, 1000);

      function end() {
        alive = false; clearInterval(tickT);
        const eff = Math.max(0, 26 - flips);               // 16 flips is a perfect run
        const score = found * 10 + eff * 3 + Math.max(0, timeLeft);
        const coins = payout(score * 1.8);
        done({
          id: 'match', score, coins, xp: 10 + found * 3,
          rank: found === 8 && flips <= 22 ? '🏆' : found === 8 ? '🍃' : '🌱',
          title: found === 8 ? (flips <= 22 ? 'Photographic memory' : 'All matched') : 'Time!',
          detail: `${found}/8 pairs · ${flips} flips · ${Math.max(0, timeLeft)}s left`,
          perk: found === 8 ? 'supply' : null,
          perkText: 'Sabrina slipped a free supply into your bag.',
        });
      }
      return () => { alive = false; clearInterval(tickT); };
    },
  };

  const GAMES = { pour, bugs, match };
  const list = () => Object.keys(GAMES).map(id => ({ id, ...GAMES[id] }));

  return { open, close, list, isRunning, GAMES };
})();
