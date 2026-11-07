/* GM combat tracker: initiative, turns, HP / SP with armor ablation, wound states, death saves, log. */
CPR.combat = (function () {
  const D = CPR.DATA, S = CPR.store, U = CPR.ui, esc = U.esc;
  const KEY = 'combat';
  let root, state, editing = new Set();

  function load() {
    state = S.read(KEY, null) || { round: 1, turn: 0, list: [], log: [] };
    state.list = state.list || []; state.log = state.log || [];
  }
  function save() { S.write(KEY, state); }

  function sorted() {
    return state.list.slice().sort((a, b) => (b.init - a.init) || (b.ref - a.ref) || a.name.localeCompare(b.name));
  }

  function log(msg, cls) {
    state.log.unshift({ t: Date.now(), msg, cls: cls || '', round: state.round });
    state.log = state.log.slice(0, 200);
  }

  function make(o) {
    return Object.assign({
      id: S.uid('cmb'), name: 'Combatant', kind: 'npc', ref: 6, initMod: 0, init: 0,
      hpMax: 30, hp: 30, body: 6, spHead: 0, spHeadMax: 0, spBody: 0, spBodyMax: 0,
      deathPenalty: 0, notes: '', cond: '', charId: null,
    }, o);
  }

  /* Add (or refresh) a player character from the builder. */
  function addCharacter(c) {
    if (!state) load();
    const d = CPR.characters.derive(c);
    const head = Math.max(c.armor.head.spCurrent, d.skinSp), headMax = Math.max(c.armor.head.sp, d.skinSp);
    const body = Math.max(c.armor.body.spCurrent, d.skinSp), bodyMax = Math.max(c.armor.body.sp, d.skinSp);
    const data = {
      name: c.handle || c.name || 'PC', kind: 'pc', charId: c.id, ref: c.stats.REF, initMod: d.initBonus,
      hpMax: d.hpMax, hp: d.hp, body: d.deathSave, spHead: head, spHeadMax: headMax, spBody: body, spBodyMax: bodyMax,
      notes: c.weapons.map(w => `${w.name} ${w.damage}`).join(', '),
    };
    const existing = state.list.find(x => x.charId === c.id);
    if (existing) Object.assign(existing, data);
    else state.list.push(make(data));
    save();
    if (root) render();
  }

  // Keep the PC's sheet in sync with HP changes made here.
  function syncToCharacter(cb) {
    if (!cb.charId) return;
    const c = S.get('characters', cb.charId);
    if (!c) return;
    c.hpCurrent = cb.hp;
    S.put('characters', c);
  }

  function applyDamage(cb, amount, loc, opts) {
    const spKey = loc === 'head' ? 'spHead' : 'spBody';
    let sp = cb[spKey];
    let effSp = opts.ignore ? 0 : opts.half ? Math.ceil(sp / 2) : sp;
    let through = Math.max(0, amount - effSp);
    if (loc === 'head') through *= 2;
    let ablated = false;
    if (through > 0 && !opts.ignore && cb[spKey] > 0) { cb[spKey] -= 1; ablated = true; }
    if (opts.crit) through += 5;
    const before = cb.hp;
    cb.hp -= through;
    const parts = [`${cb.name} takes ${amount} to the ${loc} ` + (through ? `→ ${through} damage (${before} → ${cb.hp} HP)` : '→ stopped by armor')];
    if (ablated) parts.push(`SP ${loc} now ${cb[spKey]}`);
    if (opts.crit) parts.push('incl. +5 critical injury');
    log(parts.join(', '), through ? '' : 'crit');
    const w = CPR.characters.woundState(cb.hp, cb.hpMax);
    if (before > 0 && cb.hp <= 0) log(`${cb.name} is MORTALLY WOUNDED — death saves each turn`, 'fumble');
    else if (before >= Math.ceil(cb.hpMax / 2) && cb.hp < Math.ceil(cb.hpMax / 2) && cb.hp > 0) log(`${cb.name} is Seriously Wounded (−2 to all actions)`);
    syncToCharacter(cb);
    return w;
  }

  /* ---------------- render ---------------- */
  function render() {
    const list = sorted();
    const cur = list[state.turn] || null;
    const chars = CPR.characters.list();
    root.innerHTML = `<div class="combat-layout">
      <div>
        <div class="panel round-bar">
          <div><div class="muted small">ROUND</div><div class="round-num">${state.round}</div></div>
          <div style="flex:1;min-width:140px"><div class="muted small">CURRENT TURN</div>
            <div style="font-weight:800;font-size:18px;color:var(--yellow)">${cur ? esc(cur.name) : '—'}</div></div>
          <button class="btn" data-a="prev">◀ Prev</button>
          <button class="btn primary" data-a="next">Next turn ▶</button>
          <button class="btn yellow" data-a="roll-init">🎲 Roll initiative</button>
          <button class="btn ghost sm" data-a="reset">New combat</button>
        </div>
        ${list.length ? list.map((cb, i) => card(cb, i === state.turn)).join('') :
          '<div class="empty">No combatants yet. Add player characters or NPCs from the panel.</div>'}
      </div>
      <div>
        <div class="panel">
          <h3>Add NPC</h3>
          <label class="field">Template<select id="npc-template"><option value="">Custom…</option>
            ${D.NPC_TEMPLATES.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('')}</select></label>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
            <label class="field" style="grid-column:1/-1">Name<input id="npc-name" placeholder="Booster #1"></label>
            <label class="field">REF<input id="npc-ref" type="number" value="6"></label>
            <label class="field">HP<input id="npc-hp" type="number" value="30"></label>
            <label class="field">SP Head<input id="npc-sph" type="number" value="7"></label>
            <label class="field">SP Body<input id="npc-spb" type="number" value="7"></label>
            <label class="field">Count<input id="npc-count" type="number" value="1" min="1" max="20"></label>
            <label class="field">BODY<input id="npc-body" type="number" value="6"></label>
          </div>
          <input id="npc-notes" placeholder="Weapons / notes" style="margin-top:6px">
          <button class="btn primary" style="width:100%;margin-top:8px" data-a="add-npc">+ Add NPC</button>
        </div>
        <div class="panel">
          <h3>Add Player Character</h3>
          ${chars.length ? `<div class="row"><select id="pc-pick" style="flex:1">${chars.map(c => `<option value="${c.id}">${esc(c.handle || 'Unnamed')}</option>`).join('')}</select>
            <button class="btn cyan" data-a="add-pc">Add</button></div>
            <button class="btn sm ghost" style="margin-top:6px" data-a="add-all-pc">Add all characters</button>`
            : '<p class="muted small">Create characters in the Characters tab first.</p>'}
        </div>
        <div class="panel">
          <div class="row"><h3 style="margin:0">Quick Roll</h3></div>
          <div class="row" style="margin-top:6px">
            <button class="btn sm" data-a="qr" data-e="d10">d10 check</button>
            ${['1d6', '2d6', '3d6', '4d6', '5d6', '6d6'].map(x => `<button class="btn sm" data-a="qr" data-e="${x}">${x}</button>`).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="row"><h3 style="margin:0">Combat Log</h3><span class="spacer"></span><button class="btn sm ghost" data-a="clear-log">Clear</button></div>
          <div class="log">${state.log.map(l => `<div class="${l.cls}"><span class="muted">R${l.round}</span> ${esc(l.msg)}</div>`).join('') || '<div class="muted">Nothing yet.</div>'}</div>
        </div>
      </div>
    </div>`;
  }

  function card(cb, isCur) {
    const w = CPR.characters.woundState(cb.hp, cb.hpMax);
    const pct = Math.max(0, Math.min(100, (cb.hp / cb.hpMax) * 100));
    const barCls = cb.hp <= 0 ? 'mor' : cb.hp < Math.ceil(cb.hpMax / 2) ? 'ser' : '';
    const ed = editing.has(cb.id);
    return `<div class="combatant ${cb.kind} ${isCur ? 'current' : ''} ${cb.hp <= 0 ? 'down' : ''}" data-id="${cb.id}">
      <div class="c-top">
        <input class="init" type="number" data-f="init" value="${cb.init}" title="Initiative">
        <div class="name">${esc(cb.name)} <span class="badge ${cb.kind === 'pc' ? 'cyan' : 'bad'}" style="font-size:10px">${cb.kind.toUpperCase()}</span></div>
        <span class="badge ${w.cls}">${w.label}</span>
        <button class="btn icon sm ${ed ? 'active' : ''}" data-a="edit" title="Edit stats">✎</button>
        <button class="btn icon sm danger" data-a="remove" title="Remove">×</button>
      </div>
      <div class="hpbar"><div class="${barCls}" style="width:${pct}%"></div></div>
      <div class="c-stats">
        <span>HP <b>${cb.hp}/${cb.hpMax}</b></span>
        <span>SP Head <b>${cb.spHead}/${cb.spHeadMax}</b></span>
        <span>SP Body <b>${cb.spBody}/${cb.spBodyMax}</b></span>
        <span>REF <b>${cb.ref}${cb.initMod ? '+' + cb.initMod : ''}</b></span>
        ${cb.hp <= 0 ? `<span>Death Save <b>BODY ${cb.body}, penalty +${cb.deathPenalty}</b></span>` : ''}
      </div>
      ${cb.notes ? `<div class="small muted" style="margin-top:4px">${esc(cb.notes)}</div>` : ''}
      ${ed ? `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px;margin-top:8px">
        <label class="field">Name<input data-f="name" value="${esc(cb.name)}"></label>
        <label class="field">HP<input type="number" data-f="hp" value="${cb.hp}"></label>
        <label class="field">Max HP<input type="number" data-f="hpMax" value="${cb.hpMax}"></label>
        <label class="field">REF<input type="number" data-f="ref" value="${cb.ref}"></label>
        <label class="field">Init bonus<input type="number" data-f="initMod" value="${cb.initMod}"></label>
        <label class="field">BODY<input type="number" data-f="body" value="${cb.body}"></label>
        <label class="field">SP Head<input type="number" data-f="spHead" value="${cb.spHead}"></label>
        <label class="field">Max<input type="number" data-f="spHeadMax" value="${cb.spHeadMax}"></label>
        <label class="field">SP Body<input type="number" data-f="spBody" value="${cb.spBody}"></label>
        <label class="field">Max<input type="number" data-f="spBodyMax" value="${cb.spBodyMax}"></label>
        <label class="field" style="grid-column:1/-1">Notes<input data-f="notes" value="${esc(cb.notes)}"></label>
      </div>` : ''}
      <div class="c-controls">
        <div class="mini" style="grid-column:span 2;flex-wrap:wrap">
          <input type="number" class="dmg" placeholder="Dmg" style="width:70px" inputmode="numeric">
          <select class="loc" style="width:86px"><option value="body">Body</option><option value="head">Head ×2</option></select>
          <label class="check small"><input type="checkbox" class="half">½ SP</label>
          <label class="check small"><input type="checkbox" class="crit">Crit +5</label>
          <button class="btn sm primary" data-a="damage">Hit</button>
        </div>
        <div class="mini">
          <input type="number" class="heal" placeholder="HP" style="width:64px" inputmode="numeric">
          <button class="btn sm" data-a="heal" style="color:var(--green)">Heal</button>
        </div>
        <div class="mini">
          <input class="cond" data-f="cond" value="${esc(cb.cond)}" placeholder="Conditions…">
        </div>
        ${cb.hp <= 0 ? `<div class="mini"><button class="btn sm yellow" data-a="death-save">☠ Death Save</button></div>` : ''}
        <div class="mini"><button class="btn sm ghost" data-a="repair">Repair SP</button>${cb.kind === 'pc' ? `<button class="btn sm ghost" data-a="refresh" title="Reload stats from the character sheet">↻ Sheet</button>` : ''}</div>
      </div>
    </div>`;
  }

  /* ---------------- events ---------------- */
  function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    const cardEl = b.closest('.combatant');
    const cb = cardEl ? state.list.find(x => x.id === cardEl.dataset.id) : null;

    switch (a) {
      case 'next': {
        const n = state.list.length; if (!n) return;
        state.turn++;
        if (state.turn >= n) { state.turn = 0; state.round++; log(`— Round ${state.round} —`, 'crit'); }
        break;
      }
      case 'prev': {
        const n = state.list.length; if (!n) return;
        state.turn--;
        if (state.turn < 0) { state.turn = n - 1; state.round = Math.max(1, state.round - 1); }
        break;
      }
      case 'roll-init':
        state.list.forEach(x => {
          const r = U.d(10);
          x.init = x.ref + (Number(x.initMod) || 0) + r;
        });
        state.turn = 0;
        log('Initiative: ' + sorted().map(x => `${x.name} ${x.init}`).join(', '));
        break;
      case 'reset':
        U.confirm('Start a new combat?', 'Clears all combatants, the round counter and the log.', 'Clear', () => {
          state = { round: 1, turn: 0, list: [], log: [] }; save(); render();
        });
        return;
      case 'add-npc': {
        const v = id => root.querySelector('#' + id).value;
        const count = Math.max(1, Math.min(20, parseInt(v('npc-count'), 10) || 1));
        const base = v('npc-name').trim() || 'NPC';
        for (let i = 0; i < count; i++) {
          const hp = Number(v('npc-hp')) || 1;
          state.list.push(make({
            name: count > 1 ? `${base} ${i + 1}` : base, kind: 'npc', ref: Number(v('npc-ref')) || 0,
            hp, hpMax: hp, body: Number(v('npc-body')) || 6,
            spHead: Number(v('npc-sph')) || 0, spHeadMax: Number(v('npc-sph')) || 0,
            spBody: Number(v('npc-spb')) || 0, spBodyMax: Number(v('npc-spb')) || 0,
            notes: v('npc-notes'),
          }));
        }
        log(`Added ${count} × ${base}`);
        break;
      }
      case 'add-pc': {
        const id = root.querySelector('#pc-pick').value;
        const c = CPR.characters.list().find(x => x.id === id);
        if (c) addCharacter(c);
        return;
      }
      case 'add-all-pc': CPR.characters.list().forEach(c => addCharacter(c)); return;
      case 'qr': {
        const ex = b.dataset.e;
        if (ex === 'd10') {
          const r = U.rollD10Check();
          log(`d10 check: ${r.rolls.join(' → ')} = ${r.total}${r.crit ? ' (CRITICAL!)' : r.fumble ? ' (FUMBLE!)' : ''}`, r.crit ? 'crit' : r.fumble ? 'fumble' : '');
        } else {
          const r = U.roll(ex);
          log(`${ex}: [${r.rolls.join(', ')}] = ${r.total}${r.crit ? ' — two 6s: CRITICAL INJURY' : ''}`, r.crit ? 'crit' : '');
        }
        break;
      }
      case 'clear-log': state.log = []; break;
      case 'edit': editing.has(cb.id) ? editing.delete(cb.id) : editing.add(cb.id); return render();
      case 'remove': {
        const idx = sorted().findIndex(x => x.id === cb.id);
        state.list = state.list.filter(x => x.id !== cb.id);
        if (idx < state.turn) state.turn--;
        if (state.turn >= state.list.length) state.turn = 0;
        break;
      }
      case 'damage': {
        const amt = parseInt(cardEl.querySelector('.dmg').value, 10);
        if (!amt) return U.toast('Enter the damage rolled');
        applyDamage(cb, amt, cardEl.querySelector('.loc').value, {
          crit: cardEl.querySelector('.crit').checked, half: cardEl.querySelector('.half').checked,
        });
        break;
      }
      case 'heal': {
        const amt = parseInt(cardEl.querySelector('.heal').value, 10);
        if (!amt) return;
        cb.hp = Math.min(cb.hpMax, cb.hp + amt);
        if (cb.hp > 0) cb.deathPenalty = 0;
        log(`${cb.name} heals ${amt} (${cb.hp}/${cb.hpMax})`);
        syncToCharacter(cb);
        break;
      }
      case 'repair': cb.spHead = cb.spHeadMax; cb.spBody = cb.spBodyMax; log(`${cb.name}'s armor repaired`); break;
      case 'refresh': {
        const c = CPR.characters.list().find(x => x.id === cb.charId);
        if (c) { addCharacter(c); U.toast('Reloaded from sheet'); } else U.toast('Character no longer exists');
        return;
      }
      case 'death-save': {
        const r = U.d(10);
        const total = r + cb.deathPenalty;
        const ok = r !== 10 && total < cb.body;
        log(`${cb.name} Death Save: rolled ${r}${cb.deathPenalty ? ' + ' + cb.deathPenalty : ''} = ${total} vs BODY ${cb.body} → ${ok ? 'SURVIVES' : 'DIES'}`, ok ? 'crit' : 'fumble');
        if (ok) cb.deathPenalty++;
        break;
      }
      default: return;
    }
    save(); render();
  }

  function onChange(e) {
    const t = e.target;
    if (t.id === 'npc-template') {
      const tpl = D.NPC_TEMPLATES[+t.value];
      if (!tpl) return;
      const set = (id, v) => (root.querySelector('#' + id).value = v);
      set('npc-name', tpl.name); set('npc-ref', tpl.ref); set('npc-hp', tpl.hp);
      set('npc-sph', tpl.spHead); set('npc-spb', tpl.spBody); set('npc-notes', tpl.notes);
      return;
    }
    const f = t.dataset.f;
    if (!f) return;
    const cardEl = t.closest('.combatant');
    const cb = state.list.find(x => x.id === cardEl.dataset.id);
    const curId = (sorted()[state.turn] || {}).id;
    cb[f] = t.type === 'number' ? Number(t.value) || 0 : t.value;
    if (f === 'hp') syncToCharacter(cb);
    // keep the same combatant active after re-sorting by initiative
    if (f === 'init' && curId) state.turn = Math.max(0, sorted().findIndex(x => x.id === curId));
    save();
    if (f !== 'cond' && f !== 'notes') render();
  }

  function mount(el) {
    root = el;
    load();
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    render();
  }

  function onShow() { load(); render(); }

  /* ---- hooks used by the character Play tab ---- */
  const byChar = id => { load(); return state.list.find(x => x.charId === id) || null; };
  const visible = () => root && root.classList.contains('active');

  // Player rolled initiative on their sheet: update their combatant. Returns true if they're in combat.
  function setInitiative(charId, value) {
    const cb = byChar(charId);
    if (!cb) return false;
    const curId = (sorted()[state.turn] || {}).id;
    cb.init = value;
    if (curId) state.turn = Math.max(0, sorted().findIndex(x => x.id === curId));
    log(`${cb.name} rolls initiative: ${value}`);
    save(); if (visible()) render();
    return true;
  }

  function syncHp(charId, hp) {
    const cb = byChar(charId);
    if (!cb) return;
    cb.hp = hp;
    save(); if (visible()) render();
  }

  // Every roll a player makes on their sheet shows up in the GM's log (if they're in this combat).
  function logRoll(e) {
    if (!e || !e.charId || e.label === 'Initiative') return;
    const cb = byChar(e.charId);
    if (!cb) return;
    log(`🎲 ${cb.name} — ${e.label}: ${e.total}${e.flag ? ' (' + e.flag + ')' : ''}  [${e.detail}]`, e.crit ? 'crit' : e.fumble ? 'fumble' : '');
    save(); if (visible()) render();
  }

  return { mount, onShow, addCharacter, setInitiative, syncHp, logRoll, getList: () => { if (!state) load(); return sorted(); } };
})();
