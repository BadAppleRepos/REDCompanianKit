/* Map editor: square or hex grid, terrain painting, tokens, fog of war, measuring, background image. */
CPR.map = (function () {
  const D = CPR.DATA, S = CPR.store, U = CPR.ui, esc = U.esc;
  const KEY = 'maps';
  const SQ3 = Math.sqrt(3);
  const METERS_PER_CELL = 2;

  let root, canvas, ctx, stage, map;
  let view = { scale: 1, ox: 20, oy: 20 };
  let tool = 'paint', shape = 'brush', terrainId = 'wall', tokenColor = D.TOKEN_COLORS[0], tokenLabel = 'A';
  let playerView = false, selectedToken = null;
  let undoStack = [], dirty = false, saveTimer, drawQueued = false;
  const pointers = new Map();
  let act = null; // current gesture
  const bgCache = {};

  const TERRAIN = Object.fromEntries(D.TERRAIN.map(t => [t.id, t]));

  /* ---------------- model ---------------- */
  function blankMap(o) {
    return Object.assign({
      id: S.uid('map'), name: 'New Map', grid: 'square', cols: 30, rows: 20, cell: 48,
      terrain: {}, fog: {}, tokens: [], bg: null, bgOpacity: 0.8, showGrid: true,
    }, o);
  }

  // Imported map files come from other people: coerce every field to what the editor expects.
  function sanitize(m) {
    const num = S.num, clamp = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Math.round(num(v, d))));
    const o = blankMap({
      name: String(m.name || 'Imported Map'), grid: m.grid === 'hex' ? 'hex' : 'square',
      cols: clamp(m.cols, 1, 200, 30), rows: clamp(m.rows, 1, 200, 20), cell: clamp(m.cell, 16, 200, 48),
      bg: typeof m.bg === 'string' && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(m.bg) ? m.bg : null,
      bgOpacity: Math.max(0.1, Math.min(1, num(m.bgOpacity, 0.8))), showGrid: m.showGrid !== false,
    });
    const cellKey = k => /^\d{1,3},\d{1,3}$/.test(k);
    Object.entries(m.terrain && typeof m.terrain === 'object' ? m.terrain : {}).forEach(([k, v]) => { if (cellKey(k) && TERRAIN[v]) o.terrain[k] = v; });
    Object.keys(m.fog && typeof m.fog === 'object' ? m.fog : {}).forEach(k => { if (cellKey(k)) o.fog[k] = 1; });
    o.tokens = (Array.isArray(m.tokens) ? m.tokens : []).filter(t => t && typeof t === 'object').map(t => ({
      id: S.safeId(t.id, 'tok'), c: clamp(t.c, 0, o.cols - 1, 0), r: clamp(t.r, 0, o.rows - 1, 0),
      label: String(t.label || '').slice(0, 3), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : D.TOKEN_COLORS[0],
      name: String(t.name || ''),
    }));
    return o;
  }

  function loadCurrent() {
    const all = S.list(KEY);
    const curId = S.read('map.current', null);
    map = all.find(m => m.id === curId) || all[0] || null;
    if (!map) { map = blankMap({ name: 'First Map' }); S.put(KEY, map); }
    S.write('map.current', map.id);
    undoStack = []; selectedToken = null;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => S.put(KEY, map), 300);
  }

  function snapshot() {
    undoStack.push(JSON.stringify({ terrain: map.terrain, fog: map.fog, tokens: map.tokens }));
    if (undoStack.length > 40) undoStack.shift();
  }
  function undo() {
    const s = undoStack.pop();
    if (!s) return U.toast('Nothing to undo');
    Object.assign(map, JSON.parse(s));
    selectedToken = null;
    save(); renderSide(); draw();
  }

  /* ---------------- geometry ---------------- */
  const hexS = () => map.cell / SQ3; // hex radius; hex width == map.cell

  function worldSize() {
    if (map.grid === 'hex') { const s = hexS(); return { w: map.cell * (map.cols + 0.5), h: 1.5 * s * (map.rows - 1) + 2 * s }; }
    return { w: map.cols * map.cell, h: map.rows * map.cell };
  }

  function cellCenter(c, r) {
    if (map.grid === 'hex') { const s = hexS(); return { x: map.cell * (c + 0.5 * (r & 1)) + map.cell / 2, y: 1.5 * s * r + s }; }
    return { x: (c + 0.5) * map.cell, y: (r + 0.5) * map.cell };
  }

  function pixelToCell(x, y) {
    if (map.grid === 'hex') {
      const s = hexS();
      const px = x - map.cell / 2, py = y - s;
      let q = (SQ3 / 3 * px - py / 3) / s, r = (2 / 3 * py) / s, z = -q - r;
      let rq = Math.round(q), rr = Math.round(r), rz = Math.round(z);
      const dq = Math.abs(rq - q), dr = Math.abs(rr - r), dz = Math.abs(rz - z);
      if (dq > dr && dq > dz) rq = -rr - rz; else if (dr > dz) rr = -rq - rz;
      return { c: rq + (rr - (rr & 1)) / 2, r: rr };
    }
    return { c: Math.floor(x / map.cell), r: Math.floor(y / map.cell) };
  }

  const inBounds = p => p.c >= 0 && p.r >= 0 && p.c < map.cols && p.r < map.rows;
  const key = (c, r) => c + ',' + r;

  function distance(a, b) {
    if (map.grid === 'hex') {
      const toCube = p => { const q = p.c - (p.r - (p.r & 1)) / 2; return { q, r: p.r }; };
      const A = toCube(a), B = toCube(b);
      const dq = A.q - B.q, dr = A.r - B.r;
      return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    }
    return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r));
  }

  function cellPath(g, c, r, inset) {
    const p = cellCenter(c, r);
    if (map.grid === 'hex') {
      const s = hexS() - (inset || 0);
      g.moveTo(p.x + s * Math.cos(-Math.PI / 6), p.y + s * Math.sin(-Math.PI / 6));
      for (let i = 1; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 6; g.lineTo(p.x + s * Math.cos(a), p.y + s * Math.sin(a)); }
      g.closePath();
    } else {
      const h = map.cell / 2 - (inset || 0);
      g.rect(p.x - h, p.y - h, h * 2, h * 2);
    }
  }

  function cellsInRect(a, b) {
    const out = [];
    for (let r = Math.max(0, Math.min(a.r, b.r)); r <= Math.min(map.rows - 1, Math.max(a.r, b.r)); r++)
      for (let c = Math.max(0, Math.min(a.c, b.c)); c <= Math.min(map.cols - 1, Math.max(a.c, b.c)); c++) out.push({ c, r });
    return out;
  }

  const screenToWorld = (sx, sy) => ({ x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale });
  const tokenAt = p => map.tokens.slice().reverse().find(t => t.c === p.c && t.r === p.r) || null;

  /* ---------------- drawing ---------------- */
  function draw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => { drawQueued = false; paint(ctx, canvas.width, canvas.height, window.devicePixelRatio || 1, view, true); });
  }

  function bgImage() {
    if (!map.bg) return null;
    let img = bgCache[map.id];
    if (!img || img._src !== map.bg) {
      img = new Image(); img._src = map.bg;
      img.onload = () => draw();
      img.src = map.bg;
      bgCache[map.id] = img;
    }
    return img.complete && img.naturalWidth ? img : null;
  }

  function paint(g, W, H, dpr, v, interactive) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#07080b';
    g.fillRect(0, 0, W, H);
    g.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.ox, dpr * v.oy);
    const ws = worldSize();
    g.fillStyle = '#12151d';
    g.fillRect(0, 0, ws.w, ws.h);

    const img = bgImage();
    if (img) { g.globalAlpha = map.bgOpacity; g.drawImage(img, 0, 0, ws.w, ws.h); g.globalAlpha = 1; }

    // terrain
    for (const k in map.terrain) {
      const t = TERRAIN[map.terrain[k]]; if (!t) continue;
      const [c, r] = k.split(',').map(Number);
      g.beginPath(); cellPath(g, c, r); g.fillStyle = t.color; g.fill();
      if (t.id === 'wall') { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); }
    }

    // grid
    if (map.showGrid) {
      g.strokeStyle = 'rgba(25, 227, 255, .18)';
      g.lineWidth = 1 / v.scale;
      g.beginPath();
      if (map.grid === 'hex') {
        for (let r = 0; r < map.rows; r++) for (let c = 0; c < map.cols; c++) cellPath(g, c, r);
      } else {
        for (let c = 0; c <= map.cols; c++) { g.moveTo(c * map.cell, 0); g.lineTo(c * map.cell, ws.h); }
        for (let r = 0; r <= map.rows; r++) { g.moveTo(0, r * map.cell); g.lineTo(ws.w, r * map.cell); }
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 42, 61, .5)'; g.lineWidth = 2 / v.scale;
    if (map.grid === 'square') g.strokeRect(0, 0, ws.w, ws.h);

    // rect preview
    if (interactive && act && act.type === 'rect' && act.end) {
      g.beginPath();
      cellsInRect(act.start, act.end).forEach(p => cellPath(g, p.c, p.r));
      g.fillStyle = act.tool === 'paint' ? hexA(TERRAIN[terrainId].color, .6) : act.tool === 'fog' ? 'rgba(0,0,0,.5)' : 'rgba(255,42,61,.3)';
      g.fill();
    }

    // tokens
    const combat = CPR.combat.getList();
    map.tokens.forEach(t => {
      const p = cellCenter(t.c, t.r), rad = map.cell * 0.4;
      g.beginPath(); g.arc(p.x, p.y, rad, 0, Math.PI * 2);
      g.fillStyle = t.color; g.fill();
      g.lineWidth = 3 / Math.max(v.scale, .5); g.strokeStyle = '#0b0d12'; g.stroke();
      if (interactive && selectedToken === t.id) {
        g.beginPath(); g.arc(p.x, p.y, rad + 4, 0, Math.PI * 2);
        g.strokeStyle = '#f7e21b'; g.lineWidth = 2.5 / v.scale; g.stroke();
      }
      g.fillStyle = isLight(t.color) ? '#000' : '#fff';
      g.font = `800 ${Math.round(map.cell * 0.32)}px system-ui, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText((t.label || '').slice(0, 3), p.x, p.y + 1);
      const cb = t.combatId && combat.find(x => x.id === t.combatId);
      if (cb) {
        const w = map.cell * 0.8, pct = Math.max(0, Math.min(1, cb.hp / cb.hpMax));
        g.fillStyle = '#000'; g.fillRect(p.x - w / 2, p.y + rad + 1, w, 5);
        g.fillStyle = cb.hp <= 0 ? '#ff2a3d' : cb.hp < cb.hpMax / 2 ? '#ff9b2a' : '#3dff9a';
        g.fillRect(p.x - w / 2, p.y + rad + 1, w * pct, 5);
      }
    });

    // fog
    const fogAlpha = playerView || !interactive ? 1 : 0.55;
    g.fillStyle = `rgba(4,5,8,${fogAlpha})`;
    g.beginPath();
    for (const k in map.fog) { const [c, r] = k.split(',').map(Number); cellPath(g, c, r); }
    g.fill();

    // measure
    if (interactive && act && act.type === 'measure' && act.end) {
      const a = cellCenter(act.start.c, act.start.r), b = cellCenter(act.end.c, act.end.r);
      g.strokeStyle = '#f7e21b'; g.lineWidth = 3 / v.scale; g.setLineDash([8 / v.scale, 6 / v.scale]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
      const n = distance(act.start, act.end);
      const label = `${n} ${map.grid === 'hex' ? 'hex' : 'sq'} · ${n * METERS_PER_CELL}m`;
      g.font = `700 ${14 / v.scale}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'bottom';
      const tw = g.measureText(label).width + 10 / v.scale;
      g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(b.x - tw / 2, b.y - 30 / v.scale, tw, 20 / v.scale);
      g.fillStyle = '#f7e21b'; g.fillText(label, b.x, b.y - 13 / v.scale);
    }
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) > 150;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    draw();
  }

  function fit() {
    const r = stage.getBoundingClientRect(), ws = worldSize();
    if (!r.width) return;
    view.scale = Math.min((r.width - 20) / ws.w, (r.height - 20) / ws.h, 2);
    view.ox = (r.width - ws.w * view.scale) / 2;
    view.oy = (r.height - ws.h * view.scale) / 2;
    draw();
  }

  function zoomAt(sx, sy, factor) {
    const ns = Math.min(6, Math.max(0.1, view.scale * factor));
    const w = screenToWorld(sx, sy);
    view.scale = ns;
    view.ox = sx - w.x * ns; view.oy = sy - w.y * ns;
    draw(); hud();
  }

  /* ---------------- input ---------------- */
  function localPt(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function cellFromEvent(e) { const p = localPt(e); const w = screenToWorld(p.x, p.y); return pixelToCell(w.x, w.y); }

  function applyBrush(p, t) {
    if (!inBounds(p)) return;
    const k = key(p.c, p.r);
    if (t === 'paint') map.terrain[k] = terrainId;
    else if (t === 'erase') delete map.terrain[k];
    else if (t === 'fog') map.fog[k] = 1;
    else if (t === 'reveal') delete map.fog[k];
  }

  function onDown(e) {
    // Some browsers refuse capture for certain pointers; drawing still works without it.
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers.set(e.pointerId, localPt(e));
    if (pointers.size === 2) {
      // Start a pinch: cancel any one-finger action
      if (act && act.snap) { undoStack.push(act.snap); undo(); }
      const [a, b] = [...pointers.values()];
      act = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      return;
    }
    if (pointers.size > 2) return;
    const p = localPt(e), cell = cellFromEvent(e);
    const t = (e.button === 1 || e.button === 2) ? 'pan' : tool;

    if (t === 'pan') { act = { type: 'pan', last: p }; return; }
    if (['paint', 'erase', 'fog', 'reveal'].includes(t)) {
      const snap = JSON.stringify({ terrain: map.terrain, fog: map.fog, tokens: map.tokens });
      if (shape === 'rect') act = { type: 'rect', tool: t, start: cell, end: cell, snap };
      else { act = { type: 'brush', tool: t, last: key(cell.c, cell.r), snap }; applyBrush(cell, t); }
      draw(); return;
    }
    if (t === 'measure') { act = { type: 'measure', start: cell, end: cell }; draw(); return; }
    if (t === 'token' || t === 'move') {
      const tok = tokenAt(cell);
      if (tok) {
        selectedToken = tok.id;
        act = { type: 'drag', token: tok, snap: JSON.stringify({ terrain: map.terrain, fog: map.fog, tokens: map.tokens }), moved: false };
        renderSide(); draw(); return;
      }
      if (t === 'token' && inBounds(cell)) {
        snapshot();
        const tk = { id: S.uid('tok'), c: cell.c, r: cell.r, label: tokenLabel, color: tokenColor };
        map.tokens.push(tk);
        selectedToken = tk.id;
        tokenLabel = nextLabel(tokenLabel);
        save(); renderSide(); draw();
        act = null; return;
      }
      selectedToken = null; renderSide();
      act = { type: 'pan', last: p }; draw(); return;
    }
  }

  function onMove(e) {
    if (!pointers.has(e.pointerId)) {
      return;
    }
    pointers.set(e.pointerId, localPt(e));
    if (!act) return;
    if (act.type === 'pinch' && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      view.ox += mid.x - act.mid.x; view.oy += mid.y - act.mid.y;
      zoomAt(mid.x, mid.y, dist / act.dist);
      act.dist = dist; act.mid = mid; return;
    }
    const p = localPt(e);
    if (act.type === 'pan') { view.ox += p.x - act.last.x; view.oy += p.y - act.last.y; act.last = p; draw(); return; }
    const cell = cellFromEvent(e);
    if (act.type === 'brush') {
      const k = key(cell.c, cell.r);
      if (k !== act.last) { act.last = k; applyBrush(cell, act.tool); draw(); }
    } else if (act.type === 'rect' || act.type === 'measure') {
      act.end = cell; draw();
    } else if (act.type === 'drag' && inBounds(cell) && (cell.c !== act.token.c || cell.r !== act.token.r)) {
      act.token.c = cell.c; act.token.r = cell.r; act.moved = true; draw();
    }
  }

  function onUp(e) {
    pointers.delete(e.pointerId);
    if (!act) return;
    if (act.type === 'pinch') { if (pointers.size === 0) act = null; return; }
    if (act.type === 'rect') cellsInRect(act.start, act.end).forEach(c => applyBrush(c, act.tool));
    if (act.snap && (act.type !== 'drag' || act.moved)) { undoStack.push(act.snap); if (undoStack.length > 40) undoStack.shift(); save(); }
    if (act.type === 'measure') {
      // keep the ruler on screen briefly so it can be read
      const a = act;
      setTimeout(() => { if (act === a) { act = null; draw(); } }, 2000);
      return;
    }
    act = null; draw();
  }

  function nextLabel(l) {
    if (/^\d+$/.test(l)) return String(+l + 1);
    if (/^[A-Y]$/i.test(l)) return String.fromCharCode(l.charCodeAt(0) + 1);
    const m = l.match(/^(.*?)(\d+)$/);
    return m ? m[1] + (+m[2] + 1) : l;
  }

  function hud() {
    const el = root.querySelector('#map-hud');
    if (el) el.innerHTML = `<span class="badge">${esc(map.name)}</span><span class="badge cyan">${map.grid === 'hex' ? '⬡ Hex' : '▦ Square'} ${map.cols}×${map.rows}</span>
      <span class="badge">${Math.round(view.scale * 100)}%</span>${playerView ? '<span class="badge warn">Player view</span>' : ''}`;
  }

  /* ---------------- side panel ---------------- */
  const TOOLS = [
    ['paint', '🖌', 'Paint'], ['erase', '⌫', 'Erase'], ['token', '●', 'Token'], ['move', '✥', 'Move'],
    ['measure', '📏', 'Measure'], ['fog', '☁', 'Fog'], ['reveal', '☀', 'Reveal'], ['pan', '✋', 'Pan'],
  ];

  function renderSide() {
    const side = root.querySelector('#map-side');
    const maps = S.list(KEY);
    const tok = map.tokens.find(t => t.id === selectedToken);
    side.innerHTML = `
      <div class="panel tight">
        <div class="row"><select id="map-pick" style="flex:1">${maps.map(m => `<option value="${m.id}" ${m.id === map.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
          <button class="btn icon sm primary" data-a="new" title="New map">+</button></div>
        <div class="row" style="margin-top:6px">
          <button class="btn sm" data-a="rename">Rename</button>
          <button class="btn sm" data-a="dup">Copy</button>
          <button class="btn sm danger" data-a="delete">Delete</button>
        </div>
      </div>
      <div class="panel tight">
        <h3>Tools</h3>
        <div class="tool-grid">${TOOLS.map(([id, ic, l]) => `<button class="btn ${tool === id ? 'active' : ''}" data-tool="${id}"><span class="ti">${ic}</span>${l}</button>`).join('')}</div>
        ${['paint', 'erase', 'fog', 'reveal'].includes(tool) ? `<div class="row" style="margin-top:6px">
          <button class="btn sm ${shape === 'brush' ? 'active' : ''}" data-shape="brush">Brush</button>
          <button class="btn sm ${shape === 'rect' ? 'active' : ''}" data-shape="rect">Rectangle</button></div>` : ''}
        <div class="row" style="margin-top:6px"><button class="btn sm" data-a="undo">↶ Undo</button><button class="btn sm" data-a="fit">⤢ Fit</button></div>
        <p class="muted small" style="margin:6px 0 0">Right-drag or two fingers to pan · wheel/pinch to zoom.</p>
      </div>
      ${tool === 'paint' ? `<div class="panel tight"><h3>Terrain</h3><div class="swatches">
        ${D.TERRAIN.map(t => `<div class="swatch ${t.id === terrainId ? 'active' : ''}" data-terrain="${t.id}" style="background:${t.color}">${esc(t.name)}</div>`).join('')}</div></div>` : ''}
      ${tool === 'token' || tool === 'move' || tok ? `<div class="panel tight"><h3>Tokens</h3>
        ${tool === 'token' ? `<label class="field">Next label<input id="tok-label" value="${esc(tokenLabel)}" maxlength="3"></label>
        <div class="token-colors" style="margin-top:6px">${D.TOKEN_COLORS.map(c => `<button data-tcolor="${c}" class="${c === tokenColor ? 'active' : ''}" style="background:${c}"></button>`).join('')}</div>` : ''}
        <button class="btn sm cyan" style="margin-top:8px;width:100%" data-a="import-combat">⚔ Place combatants from tracker</button>
        ${tok ? `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">
          <div class="small muted">SELECTED TOKEN</div>
          <div class="row"><input id="sel-label" value="${esc(tok.label)}" maxlength="3" style="width:70px">
            <button class="btn sm danger" data-a="del-token">Delete</button></div>
          <div class="token-colors" style="margin-top:6px">${D.TOKEN_COLORS.map(c => `<button data-selcolor="${c}" class="${c === tok.color ? 'active' : ''}" style="background:${c}"></button>`).join('')}</div>
        </div>` : ''}
      </div>` : ''}
      <div class="panel tight">
        <h3>Grid</h3>
        <div class="row">
          <button class="btn sm ${map.grid === 'square' ? 'active' : ''}" data-grid="square">▦ Square</button>
          <button class="btn sm ${map.grid === 'hex' ? 'active' : ''}" data-grid="hex">⬡ Hex</button>
        </div>
        <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
          <label class="field">Cols<input type="number" min="1" max="200" data-mf="cols" value="${map.cols}"></label>
          <label class="field">Rows<input type="number" min="1" max="200" data-mf="rows" value="${map.rows}"></label>
          <label class="field">Cell px<input type="number" min="16" max="200" data-mf="cell" value="${map.cell}"></label>
        </div>
        <label class="check small" style="margin-top:6px"><input type="checkbox" data-mf="showGrid" ${map.showGrid ? 'checked' : ''}> Show grid lines</label>
        <p class="muted small" style="margin:4px 0 0">1 cell = ${METERS_PER_CELL}m.</p>
      </div>
      <div class="panel tight">
        <h3>Fog of War</h3>
        <label class="check small"><input type="checkbox" id="player-view" ${playerView ? 'checked' : ''}> Player view (fog fully black)</label>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-a="fog-all">Fog everything</button><button class="btn sm" data-a="fog-clear">Clear fog</button></div>
      </div>
      <div class="panel tight">
        <h3>Background Image</h3>
        <div class="row"><button class="btn sm" data-a="bg">Upload image…</button>${map.bg ? '<button class="btn sm danger" data-a="bg-remove">Remove</button>' : ''}</div>
        ${map.bg ? `<label class="field" style="margin-top:6px">Opacity<input type="range" min="0.1" max="1" step="0.05" data-mf="bgOpacity" value="${map.bgOpacity}"></label>` : ''}
        <p class="muted small" style="margin:4px 0 0">Stretched to fit the grid. Set cols/rows to match the image.</p>
      </div>
      <div class="panel tight">
        <h3>File</h3>
        <div class="row">
          <button class="btn sm" data-a="png">⇩ PNG image</button>
          <button class="btn sm" data-a="export">⇩ Map file</button>
          <button class="btn sm" data-a="import">⇪ Import</button>
          <button class="btn sm danger" data-a="clear">Clear all</button>
        </div>
      </div>`;
    hud();
  }

  function newMapDialog(cb) {
    U.modal({
      title: 'New map',
      body: `<div class="grid" style="gap:8px">
        <label class="field">Name<input id="nm-name" value="Map ${S.list(KEY).length + 1}"></label>
        <label class="field">Grid<select id="nm-grid"><option value="square">Square</option><option value="hex">Hexagonal</option></select></label>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">
          <label class="field">Columns<input id="nm-cols" type="number" value="30"></label>
          <label class="field">Rows<input id="nm-rows" type="number" value="20"></label></div></div>`,
      actions: [{ label: 'Cancel' }, {
        label: 'Create', cls: 'primary', onClick: w => {
          const v = id => w.querySelector('#' + id).value;
          const m = blankMap({
            name: v('nm-name') || 'New Map', grid: v('nm-grid'),
            cols: Math.max(1, Math.min(200, +v('nm-cols') || 30)), rows: Math.max(1, Math.min(200, +v('nm-rows') || 20)),
          });
          S.put(KEY, m); S.write('map.current', m.id);
          loadCurrent(); renderSide(); fit();
        },
      }],
    });
  }

  async function uploadBg() {
    const f = await U.pickFile('image/*', true);
    if (!f) return;
    // Downscale so it fits in device storage.
    const img = new Image();
    img.onload = () => {
      const max = 2048, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      map.bg = cv.toDataURL('image/jpeg', 0.82);
      if (!S.put(KEY, map)) { map.bg = null; return; }
      renderSide(); draw();
    };
    img.src = f.dataUrl;
  }

  function exportPng() {
    const ws = worldSize(), k = 1.5;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(ws.w * k); cv.height = Math.ceil(ws.h * k);
    paint(cv.getContext('2d'), cv.width, cv.height, 1, { scale: k, ox: 0, oy: 0 }, false);
    cv.toBlob(b => U.saveFile(U.safeName(map.name) + '.png', b, 'image/png'), 'image/png');
  }

  function importCombatants() {
    const list = CPR.combat.getList();
    if (!list.length) return U.toast('No combatants in the tracker yet');
    snapshot();
    const taken = new Set(map.tokens.map(t => key(t.c, t.r)));
    let c = 0, r = 0, added = 0;
    const nextFree = () => {
      while (taken.has(key(c, r)) || (map.terrain[key(c, r)] === 'wall')) { c++; if (c >= map.cols) { c = 0; r++; if (r >= map.rows) return false; } }
      return true;
    };
    list.forEach(cb => {
      if (map.tokens.some(t => t.combatId === cb.id)) return;
      if (!nextFree()) return;
      // "Gang Enforcer 2" -> "GE2", "Razor" -> "RA"
      const words = cb.name.split(/\s+/).filter(w => w && !/^\d+$/.test(w));
      const num = (cb.name.match(/\d+$/) || [''])[0];
      const letters = words.length > 1 ? words.map(w => w[0]).join('') : (words[0] || '?').replace(/[^A-Za-z0-9]/g, '');
      const label = (letters.slice(0, num ? 3 - num.length : 2) + num).toUpperCase() || '?';
      map.tokens.push({ id: S.uid('tok'), c, r, label, color: cb.kind === 'pc' ? '#19e3ff' : '#ff2a3d', combatId: cb.id, name: cb.name });
      taken.add(key(c, r)); added++;
    });
    save(); renderSide(); draw();
    U.toast(added ? `Placed ${added} token${added > 1 ? 's' : ''} — drag them into position` : 'All combatants already have tokens');
  }

  function onSideClick(e) {
    const tl = e.target.closest('[data-tool]');
    if (tl) { tool = tl.dataset.tool; if (tool !== 'token' && tool !== 'move') selectedToken = null; renderSide(); draw(); return; }
    const sh = e.target.closest('[data-shape]');
    if (sh) { shape = sh.dataset.shape; renderSide(); return; }
    const tr = e.target.closest('[data-terrain]');
    if (tr) { terrainId = tr.dataset.terrain; renderSide(); return; }
    const tc = e.target.closest('[data-tcolor]');
    if (tc) { tokenColor = tc.dataset.tcolor; renderSide(); return; }
    const sc = e.target.closest('[data-selcolor]');
    if (sc) { const t = map.tokens.find(x => x.id === selectedToken); if (t) { t.color = sc.dataset.selcolor; save(); renderSide(); draw(); } return; }
    const gr = e.target.closest('[data-grid]');
    if (gr) {
      if (gr.dataset.grid === map.grid) return;
      map.grid = gr.dataset.grid; save(); renderSide(); fit(); return;
    }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    switch (b.dataset.a) {
      case 'new': newMapDialog(); break;
      case 'rename':
        U.modal({
          title: 'Rename map', body: `<input id="rn" value="${esc(map.name)}">`,
          actions: [{ label: 'Cancel' }, { label: 'Save', cls: 'primary', onClick: w => { map.name = w.querySelector('#rn').value || map.name; S.put(KEY, map); renderSide(); } }],
        });
        break;
      case 'dup': {
        const m = JSON.parse(JSON.stringify(map)); m.id = S.uid('map'); m.name += ' (copy)';
        S.put(KEY, m); S.write('map.current', m.id); loadCurrent(); renderSide(); draw(); U.toast('Map copied'); break;
      }
      case 'delete':
        U.confirm('Delete map?', `"${map.name}" will be removed from this device.`, 'Delete', () => {
          S.remove(KEY, map.id); S.write('map.current', null); loadCurrent(); renderSide(); fit();
        });
        break;
      case 'undo': undo(); break;
      case 'fit': fit(); hud(); break;
      case 'import-combat': importCombatants(); break;
      case 'del-token': snapshot(); map.tokens = map.tokens.filter(t => t.id !== selectedToken); selectedToken = null; save(); renderSide(); draw(); break;
      case 'fog-all': snapshot(); for (let r = 0; r < map.rows; r++) for (let c = 0; c < map.cols; c++) map.fog[key(c, r)] = 1; save(); draw(); break;
      case 'fog-clear': snapshot(); map.fog = {}; save(); draw(); break;
      case 'bg': uploadBg(); break;
      case 'bg-remove': map.bg = null; save(); renderSide(); draw(); break;
      case 'png': exportPng(); break;
      case 'export': U.saveFile(U.safeName(map.name) + '.redmap.json', JSON.stringify(map)); break;
      case 'import':
        U.pickFile('.json,application/json').then(f => {
          if (!f) return;
          try {
            const m = JSON.parse(f.text);
            if (!m || !m.cols || !m.rows) throw 0;
            const nm = sanitize(m);
            S.put(KEY, nm); S.write('map.current', nm.id); loadCurrent(); renderSide(); fit(); U.toast('Map imported');
          } catch (err) { U.toast('That file is not a RED Kit map'); }
        });
        break;
      case 'clear':
        U.confirm('Clear map?', 'Removes all terrain, tokens and fog (you can undo).', 'Clear', () => {
          snapshot(); map.terrain = {}; map.tokens = []; map.fog = {}; selectedToken = null; save(); renderSide(); draw();
        });
        break;
    }
  }

  function onSideChange(e) {
    const t = e.target;
    if (t.id === 'map-pick') { S.put(KEY, map); S.write('map.current', t.value); loadCurrent(); renderSide(); fit(); return; }
    if (t.id === 'player-view') { playerView = t.checked; draw(); hud(); return; }
    const f = t.dataset.mf;
    if (f) {
      if (t.type === 'checkbox') map[f] = t.checked;
      else if (f === 'bgOpacity') map[f] = Number(t.value);
      else map[f] = Math.max(f === 'cell' ? 16 : 1, Math.min(f === 'cell' ? 200 : 200, parseInt(t.value, 10) || 1));
      if (f === 'cols' || f === 'rows') {
        // drop anything outside the new bounds
        const ok = k => { const [c, r] = k.split(',').map(Number); return c < map.cols && r < map.rows; };
        for (const k in map.terrain) if (!ok(k)) delete map.terrain[k];
        for (const k in map.fog) if (!ok(k)) delete map.fog[k];
        map.tokens = map.tokens.filter(tk => tk.c < map.cols && tk.r < map.rows);
      }
      save(); draw(); hud();
    }
  }

  function onSideInput(e) {
    const t = e.target;
    if (t.id === 'tok-label') tokenLabel = t.value;
    if (t.id === 'sel-label') { const tk = map.tokens.find(x => x.id === selectedToken); if (tk) { tk.label = t.value; save(); draw(); } }
    if (t.dataset.mf === 'bgOpacity') { map.bgOpacity = Number(t.value); draw(); }
  }

  function onKey(e) {
    if (!root.classList.contains('active')) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedToken) {
      snapshot(); map.tokens = map.tokens.filter(t => t.id !== selectedToken); selectedToken = null; save(); renderSide(); draw();
    }
  }

  function mount(el) {
    root = el;
    root.innerHTML = `<div class="map-wrap">
      <div class="map-side" id="map-side"></div>
      <div class="map-stage" id="map-stage"><canvas></canvas>
        <div class="map-hud" id="map-hud"></div>
        <div class="map-zoom"><button class="btn icon" data-z="1.25">+</button><button class="btn icon" data-z="0.8">−</button></div>
      </div></div>`;
    stage = root.querySelector('#map-stage');
    canvas = stage.querySelector('canvas');
    ctx = canvas.getContext('2d');
    loadCurrent();
    renderSide();

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { e.preventDefault(); const p = localPt(e); zoomAt(p.x, p.y, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    stage.querySelector('.map-zoom').addEventListener('click', e => {
      const b = e.target.closest('[data-z]'); if (!b) return;
      const r = stage.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, +b.dataset.z);
    });
    const side = root.querySelector('#map-side');
    side.addEventListener('click', onSideClick);
    side.addEventListener('change', onSideChange);
    side.addEventListener('input', onSideInput);
    document.addEventListener('keydown', onKey);
    new ResizeObserver(() => resize()).observe(stage);
  }

  let fitted = false;
  function onShow() {
    resize();
    if (!fitted) { fitted = true; requestAnimationFrame(fit); }
    renderSide(); draw();
  }

  return { mount, onShow };
})();
