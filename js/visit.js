/* Sabrina's Secret Garden — visiting each other's gardens.

   There is no server behind this game, so a visit can't be a live connection.
   Instead a garden is squeezed into a link: everything needed to *draw* it is
   packed into short arrays, deflated, and base64url'd onto the URL fragment.
   Send the link, and it opens as a read-only tour of your garden.

   The fragment never reaches a server — it stays in the browser — so sharing a
   garden doesn't hand your save to anyone but the person you sent it to. */

const GARDEN_LINK = (function () {
  const VERSION = 1;
  const MAX_PLANTS = 24;      // biggest gardens get trimmed to their best
  const MAX_LEAVES = 14;      // beyond this the picture barely changes
  const SOFT_URL_LIMIT = 6000;

  /* index tables keep the payload tiny — a species becomes a number */
  const spIdx = () => SPECIES.map(s => s.id);
  const potIdx = () => POTS.map(p => p.id);
  const shIdx = () => SHADINGS.map(s => s.id);
  const varIdx = () => Object.keys(VARIEG);
  const pathIdx = ['sun', 'bright', 'shade', 'cabinet'];

  /* ---------- base64url ---------- */
  function bytesToB64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64ToBytes(s) {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(pad + '==='.slice((pad.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deflate(str) {
    if (typeof CompressionStream === 'undefined') return null;
    try {
      const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) { return null; }
  }
  async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  }

  /* ---------- pack ---------- */
  function packPlants(plants) {
    const SP = spIdx(), PO = potIdx(), SH = shIdx(), VA = varIdx();
    return plants.map(p => {
      const leaves = p.leaves.slice(-MAX_LEAVES).map(l => [
        (l.seed >>> 0).toString(36),
        Math.round(l.len),
        Math.round((l.fen || 0) * 100),
        Math.max(0, VA.indexOf(l.varieg || 'none')),
      ]);
      return [
        SP.indexOf(p.speciesId),
        Math.max(0, PO.indexOf(p.potId)),
        Math.max(0, pathIdx.indexOf(p.path || 'bright')),
        Math.max(0, SH.indexOf(p.shading || 'matte')),
        Math.round(p.health ?? 100),
        p.nick || 0,
        p.hybridName || 0,
        p.moss ? 1 : 0,
        leaves,
      ];
    });
  }

  function unpackPlants(rows) {
    const SP = spIdx(), PO = potIdx(), SH = shIdx(), VA = varIdx();
    return rows.map((r, i) => {
      const [sp, pot, path, shade, health, nick, hybridName, moss, leaves] = r;
      if (!SP[sp]) return null;
      return {
        id: 90000 + i,
        speciesId: SP[sp],
        potId: PO[pot] || 'nursery',
        soilId: 'basic',
        zone: pathIdx[path] || 'bright',
        path: pathIdx[path] || 'bright',
        shading: SH[shade] || 'matte',
        health: health ?? 100,
        nick: nick || null,
        hybridName: hybridName || null,
        hybrid: !!hybridName,
        moss: !!moss,
        water: 85, food: 80, growth: 0, pests: false, pal: null,
        lastLeaf: 0, born: 0,
        leaves: (leaves || []).map(l => ({
          seed: parseInt(l[0], 36) || 1,
          len: l[1] || 50,
          fen: (l[2] || 0) / 100,
          varieg: VA[l[3]] || 'none',
          unfurl: 1,
        })),
      };
    }).filter(Boolean);
  }

  /* Best plants first, so a trimmed garden still shows off the good stuff. */
  function pickBest(plants) {
    return plants.slice().sort((a, b) => {
      const d = rarityOrder(effectiveRarity(b)) - rarityOrder(effectiveRarity(a));
      return d !== 0 ? d : b.leaves.length - a.leaves.length;
    }).slice(0, MAX_PLANTS);
  }

  async function encode(state) {
    const chosen = pickBest(state.plants);
    const payload = {
      v: VERSION,
      n: (state.gardener || '').slice(0, 24),
      lv: state.level || 1,
      cz: cosiness(),
      lf: state.stats?.leaves || 0,
      dx: Object.keys(state.dex || {}).length,
      st: state.streak || 0,
      tp: chosen.length < state.plants.length ? state.plants.length : 0,
      p: packPlants(chosen),
    };
    const json = JSON.stringify(payload);
    const packed = await deflate(json);
    if (packed) return 'z' + bytesToB64(packed);
    return 'j' + bytesToB64(new TextEncoder().encode(json));
  }

  async function decode(code) {
    if (!code || code.length < 2) return null;
    try {
      const bytes = b64ToBytes(code.slice(1));
      const json = code[0] === 'z' ? await inflate(bytes) : new TextDecoder().decode(bytes);
      const data = JSON.parse(json);
      if (!data || !Array.isArray(data.p)) return null;
      data.plants = unpackPlants(data.p);
      delete data.p;
      return data;
    } catch (e) { return null; }
  }

  const baseUrl = () => location.origin === 'null'
    ? location.href.split('#')[0]
    : location.origin + location.pathname;

  async function makeLink(state) {
    const code = await encode(state);
    const url = `${baseUrl()}#g=${code}`;
    return { url, code, tooLong: url.length > SOFT_URL_LIMIT, chars: url.length };
  }

  const readHash = () => {
    const m = (location.hash || '').match(/[#&]g=([A-Za-z0-9\-_]+)/);
    return m ? m[1] : null;
  };
  const clearHash = () => {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  };

  return { encode, decode, makeLink, readHash, clearHash, MAX_PLANTS };
})();
