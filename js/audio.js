/* Sabrina's Secret Garden — audio.
   Everything is synthesised with WebAudio: no files to download, works offline,
   and the whole soundtrack weighs nothing. */

const AUDIO = (function () {
  let ctx = null, master = null, sfxBus = null, musBus = null;
  let started = false, musicRunning = false, schedTimer = null;
  const cfg = { sfx: true, music: true, sfxVol: 0.8, musVol: 0.5 };

  /* ---------- graph ---------- */
  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = cfg.sfxVol; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(master);
    return ctx;
  }
  const now = () => ctx.currentTime;

  /* Called from the first real touch/click — mobile won't start audio otherwise. */
  function unlock() {
    if (started) return;
    if (!init()) return;
    started = true;
    if (ctx.state === 'suspended') ctx.resume();
    if (cfg.music) startMusic();
  }

  function config(next) {
    Object.assign(cfg, next);
    if (!ctx) return;
    sfxBus.gain.setTargetAtTime(cfg.sfxVol, now(), 0.05);
    if (cfg.music) { startMusic(); musBus.gain.setTargetAtTime(cfg.musVol, now(), 0.6); }
    else musBus.gain.setTargetAtTime(0, now(), 0.4);
  }

  /* ---------- voices ---------- */
  function tone(o) {
    /* an explicit bus means this is a music voice — the SFX mute must not silence it */
    if (!ctx || (!o.bus && !cfg.sfx)) return;
    const t = o.at ?? now();
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.dur || 0.2));
    const peak = (o.v ?? 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.a ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + (o.dur || 0.2) + 0.05);
  }

  let noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    const n = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    return noiseBuf;
  }
  function hiss(o) {
    if (!ctx || (!o.bus && !cfg.sfx)) return;
    const t = o.at ?? now();
    const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass'; f.Q.value = o.q ?? 1;
    f.frequency.setValueAtTime(o.f, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v ?? 0.2, t + (o.a ?? 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t); src.stop(t + o.dur + 0.05);
  }
  /* soft mallet / music-box hit */
  function mallet(f, at, v = 0.22, dur = 1.1, bus) {
    tone({ f, at, v, dur, type: 'sine', a: 0.004, bus });
    tone({ f: f * 2.01, at, v: v * 0.3, dur: dur * 0.5, type: 'sine', a: 0.004, bus });
    tone({ f: f * 3.02, at, v: v * 0.12, dur: dur * 0.25, type: 'sine', a: 0.004, bus });
  }

  /* ---------- sound effects ---------- */
  const RECIPES = {
    tap:     () => tone({ f: 520, to: 660, dur: 0.07, v: 0.1, type: 'sine' }),
    open:    () => { mallet(660, now(), 0.14, 0.4); mallet(880, now() + 0.05, 0.1, 0.35); },
    close:   () => tone({ f: 420, to: 300, dur: 0.12, v: 0.1 }),
    water:   () => {
      hiss({ f: 900, to: 320, dur: 0.55, v: 0.16, type: 'lowpass', q: 3 });
      [0, 0.09, 0.19, 0.3].forEach((d, i) => tone({ f: 900 + i * 130, to: 1500 + i * 100, at: now() + d, dur: 0.1, v: 0.09, type: 'sine' }));
    },
    feed:    () => [523, 659, 784, 1046].forEach((f, i) => mallet(f, now() + i * 0.055, 0.16, 0.7)),
    mist:    () => hiss({ f: 3200, to: 1400, dur: 0.5, v: 0.13, q: 0.7 }),
    turn:    () => tone({ f: 300, to: 520, dur: 0.22, v: 0.13, type: 'triangle' }),
    spray:   () => { hiss({ f: 2600, to: 900, dur: 0.42, v: 0.16, q: 0.8 }); tone({ f: 200, to: 140, dur: 0.2, v: 0.08, type: 'triangle' }); },
    snip:    () => { tone({ f: 2400, to: 1700, dur: 0.05, v: 0.14, type: 'square' }); tone({ f: 2100, to: 1500, at: now() + 0.08, dur: 0.05, v: 0.12, type: 'square' }); },
    thunk:   () => { tone({ f: 150, to: 80, dur: 0.24, v: 0.26, type: 'sine' }); hiss({ f: 400, dur: 0.18, v: 0.09, type: 'lowpass' }); },
    root:    () => { hiss({ f: 600, to: 1200, dur: 0.4, v: 0.1, q: 1.5 }); [392, 523, 659].forEach((f, i) => mallet(f, now() + 0.06 * i, 0.16, 0.8)); },
    shutter: () => { tone({ f: 1800, to: 900, dur: 0.04, v: 0.2, type: 'square' }); hiss({ f: 2000, dur: 0.1, v: 0.12, at: now() + 0.04 }); },
    coin:    () => { mallet(1046, now(), 0.2, 0.4); mallet(1568, now() + 0.07, 0.18, 0.7); },
    buy:     () => { tone({ f: 420, to: 780, dur: 0.12, v: 0.16, type: 'triangle' }); mallet(1046, now() + 0.1, 0.14, 0.5); },
    leaf:    () => { hiss({ f: 1800, to: 700, dur: 0.35, v: 0.08, q: 0.8 }); [587, 740, 880].forEach((f, i) => mallet(f, now() + 0.07 * i, 0.2, 1.2)); },
    rare:    () => {
      [659, 831, 988, 1319, 1661].forEach((f, i) => mallet(f, now() + 0.075 * i, 0.22, 1.8));
      tone({ f: 2637, at: now() + 0.4, dur: 2.2, v: 0.09, type: 'sine', a: 0.02 });
      hiss({ f: 5000, to: 2000, dur: 1.2, v: 0.05, at: now() + 0.1 });
    },
    graft:   () => { tone({ f: 220, to: 440, dur: 0.3, v: 0.18, type: 'triangle' }); [440, 554, 659, 880].forEach((f, i) => mallet(f, now() + 0.3 + i * 0.08, 0.2, 1.4)); },
    revive:  () => { tone({ f: 180, to: 320, dur: 0.5, v: 0.14, type: 'sine' }); [523, 659, 784].forEach((f, i) => mallet(f, now() + 0.2 + i * 0.1, 0.2, 1.6)); },
    fanfare: () => [523, 659, 784, 1046, 1319].forEach((f, i) => mallet(f, now() + i * 0.085, 0.22, 1.5)),
    error:   () => { tone({ f: 200, to: 130, dur: 0.22, v: 0.16, type: 'triangle' }); tone({ f: 100, to: 70, dur: 0.26, v: 0.1, type: 'sine' }); },
    pest:    () => { tone({ f: 90, dur: 0.5, v: 0.1, type: 'sawtooth', lp: 700 }); hiss({ f: 300, to: 180, dur: 0.45, v: 0.1, type: 'lowpass' }); },
    wilt:    () => { tone({ f: 400, to: 180, dur: 0.7, v: 0.14, type: 'triangle' }); },
    critical:() => [0, 0.34].forEach(d => {
      tone({ f: 466, at: now() + d, dur: 0.16, v: 0.17, type: 'triangle' });
      tone({ f: 349, at: now() + d + 0.16, dur: 0.22, v: 0.17, type: 'triangle' });
    }),
    death:   () => {
      [392, 330, 262, 196].forEach((f, i) => tone({ f, at: now() + i * 0.22, dur: 0.9, v: 0.16, type: 'sine' }));
      tone({ f: 98, at: now() + 0.6, dur: 2.4, v: 0.12, type: 'sine' });
    },
  };
  function sfx(name) {
    if (!cfg.sfx) return;
    if (!ctx) { init(); if (!ctx) return; }
    if (ctx.state === 'suspended') return;      // still waiting on a user gesture
    (RECIPES[name] || RECIPES.tap)();
  }

  /* ---------- background music ----------
     A slow four-chord loop with a pad, a sub bass, a sparse music-box melody and a
     filtered noise bed. Scheduled with lookahead so it never stutters. */
  const BPM = 58, BEAT = 60 / BPM, BAR = BEAT * 4;
  const CHORDS = [
    { root: 48, notes: [0, 4, 7, 11, 14] },   // Cmaj9
    { root: 45, notes: [0, 3, 7, 10, 14] },   // Am9
    { root: 41, notes: [0, 4, 7, 11, 14] },   // Fmaj9
    { root: 43, notes: [0, 4, 7, 9, 14] },    // G6/9
  ];
  const PENT = [0, 2, 4, 7, 9];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  let nextTime = 0, step = 0, bed = null;

  function pad(chord, at, dur) {
    chord.notes.forEach((iv, i) => {
      const f = mtof(chord.root + iv + 12);
      const osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = f * (1 + (i - 2) * 0.0015);        // gentle detune
      lp.type = 'lowpass'; lp.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.055, at + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(lp); lp.connect(g); g.connect(musBus);
      osc.start(at); osc.stop(at + dur + 0.1);
    });
    /* sub bass on the root */
    const b = ctx.createOscillator(), bg = ctx.createGain();
    b.type = 'sine'; b.frequency.value = mtof(chord.root - 12);
    bg.gain.setValueAtTime(0.0001, at);
    bg.gain.exponentialRampToValueAtTime(0.09, at + 0.4);
    bg.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    b.connect(bg); bg.connect(musBus);
    b.start(at); b.stop(at + dur + 0.1);
  }

  function startBed() {
    if (bed || !ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.035;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.05; lfoG.gain.value = 160;
    lfo.connect(lfoG); lfoG.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(musBus);
    src.start(); lfo.start();
    bed = { src, lfo };
  }

  function scheduler() {
    if (!ctx || !musicRunning) return;
    while (nextTime < now() + 1.2) {
      const chord = CHORDS[Math.floor(step / 2) % CHORDS.length];
      pad(chord, nextTime, BAR * 2);                      // each chord holds two bars

      /* sparse music-box phrase over the chord */
      for (let b = 0; b < 4; b++) {
        if (Math.random() < 0.42) {
          const deg = PENT[Math.floor(Math.random() * PENT.length)];
          const oct = Math.random() < 0.35 ? 24 : 12;
          mallet(mtof(chord.root + deg + oct), nextTime + b * BEAT + (Math.random() * 0.06), 0.075, 2.0, musBus);
        }
      }
      if (step % 8 === 0) mallet(mtof(chord.root + 24 + 7), nextTime + BEAT * 2, 0.06, 3.4, musBus);

      nextTime += BAR;
      step++;
    }
  }

  function startMusic() {
    if (!ctx || musicRunning) return;
    musicRunning = true;
    nextTime = now() + 0.15;
    startBed();
    musBus.gain.setTargetAtTime(cfg.musVol, now(), 1.2);
    scheduler();
    schedTimer = setInterval(scheduler, 250);
  }
  function stopMusic() {
    if (!ctx) return;
    musicRunning = false;
    clearInterval(schedTimer); schedTimer = null;
    musBus.gain.setTargetAtTime(0, now(), 0.5);
  }
  /* quieten while the app is in the background, don't tear the graph down */
  function setActive(on) {
    if (!ctx || !started) return;
    if (on) { if (ctx.state === 'suspended') ctx.resume(); if (cfg.music) startMusic(); }
    else stopMusic();
  }

  return { unlock, config, sfx, startMusic, stopMusic, setActive, get ready() { return !!ctx && ctx.state === 'running'; } };
})();
