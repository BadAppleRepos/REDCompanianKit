/*
 * GM homebrew & sourcebook content.
 *
 * CPR.cyber      — single lookup for built-in + homebrew cyberware (used by the builder and Ripperdoc).
 * CPR.quickhacks — GM-defined quickhacks netrunners can pick and roll on the Play tab.
 * CPR.tableRules — the GM's wording for weapon-type rules (Power / Tech / Smart).
 * CPR.homebrew   — the Homebrew page (Mission Kit templates, libraries, import/export).
 *
 * Installed homebrew cyberware and chosen quickhacks carry a copy of their definition inside the
 * character, so a character file still works on a device that never imported the GM's library.
 */
CPR.cyber = (function () {
  const D = CPR.DATA, S = CPR.store;
  const KEY = 'homebrew';
  let cache = null;

  const CATS = [
    ['neural', 'Neuralware'], ['chip', 'Chipware'], ['optic', 'Cyberoptics'], ['audio', 'Cyberaudio'],
    ['arm', 'Cyberarm option'], ['leg', 'Cyberleg option'], ['internal', 'Internal body'],
    ['external', 'External body'], ['fashion', 'Fashionware'], ['borg', 'Borgware'],
  ];
  const KINDS = ['Combat', 'Defense', 'Sensory', 'Netrunning', 'Style', 'Utility'];

  // Keep only known keys with numeric values (stat / skill bonuses).
  function numMap(o, ok) {
    const out = {};
    Object.entries(o && typeof o === 'object' ? o : {}).forEach(([k, v]) => { if (ok(k) && Number(v)) out[k] = Number(v); });
    return out;
  }

  function normalize(h) {
    const m = h.mods || {};
    const w = h.weapon || {};
    return {
      id: S.safeId(h.id, 'hb'), name: String(h.name || 'Untitled chrome'),
      cats: Array.isArray(h.cats) && h.cats.length ? h.cats.filter(c => CATS.some(x => x[0] === c)) : ['internal'],
      kind: KINDS.includes(h.kind) ? h.kind : 'Utility', cost: Number(h.cost) || 0, hl: Number(h.hl) || 0, hlDice: String(h.hlDice || ''),
      slots: h.slots == null ? 1 : Math.max(0, Number(h.slots) || 0),
      fx: Array.isArray(h.fx) ? h.fx.filter(Boolean).map(String) : [], details: String(h.details || ''), source: String(h.source || ''),
      mods: { init: Number(m.init) || 0, sp: Number(m.sp) || 0, stats: numMap(m.stats, k => D.STATS.some(s => s.id === k)), skills: numMap(m.skills, k => D.SKILLS.some(s => s.name === k)) },
      weapon: w.damage ? { damage: String(w.damage), skill: D.SKILLS.some(s => s.name === w.skill) ? w.skill : 'Melee Weapon', rof: Number(w.rof) || 1, wtype: D.WEAPON_TYPES.some(t => t.id === w.wtype) ? w.wtype : '' } : null,
      homebrew: true, updated: h.updated || Date.now(),
    };
  }

  function list() {
    if (!cache) cache = S.list(KEY).map(normalize).sort((a, b) => a.name.localeCompare(b.name));
    return cache;
  }
  function save(def) { S.put(KEY, normalize(def)); cache = null; }
  function remove(id) { S.remove(KEY, id); cache = null; }

  // Shape a homebrew definition like a built-in item, for the slot category it's shown in.
  function toItem(h, cat) {
    if (!h) return null;
    const n = normalize(h);
    return { ...n, cat: cat || n.cats[0], desc: n.details };
  }

  function get(id) { return D.cyberById[id] || toItem(list().find(h => h.id === id)) || null; }

  function forCat(cat) {
    return D.CYBERWARE.filter(i => i.cat === cat)
      .concat(list().filter(h => h.cats.includes(cat)).map(h => toItem(h, cat)));
  }

  function snapshot(id) {
    const h = list().find(x => x.id === id);
    return h ? JSON.parse(JSON.stringify(h)) : null;
  }

  // Merge definitions into the library. Returns how many were added or updated.
  function importDefs(defs, onlyIfMissing) {
    let n = 0;
    const have = new Set(S.list(KEY).map(h => h.id));
    defs.forEach(d => {
      if (!d || typeof d !== 'object' || !d.name) return;
      if (onlyIfMissing && have.has(d.id)) return;
      S.put(KEY, normalize(d)); n++;
    });
    cache = null;
    return n;
  }

  return { CATS, KINDS, list, get, forCat, toItem, snapshot, save, remove, importDefs, normalize };
})();

CPR.quickhacks = (function () {
  const S = CPR.store, KEY = 'quickhacks';

  // base: 'interface' (Netrunner Interface rank) or a skill name.
  function normalize(q) {
    return {
      id: S.safeId(q.id, 'qh'), name: String(q.name || 'Untitled quickhack'), effect: String(q.effect || ''),
      base: q.base === 'interface' || CPR.DATA.SKILLS.some(s => s.name === q.base) ? q.base : 'interface',
      dv: String(q.dv || ''), damage: String(q.damage || ''), cost: String(q.cost || ''), source: String(q.source || ''),
      updated: q.updated || Date.now(),
    };
  }
  // Built-in quickhacks (Edgerunners Mission Kit table in data.js) come first, then the GM's own.
  const builtins = () => CPR.DATA.MISSION_KIT_QUICKHACKS.map(q => ({
    ...normalize({ ...q, source: CPR.DATA.MISSION_KIT_SOURCE, updated: 1 }), builtIn: true, unset: !q.dv && !q.damage,
  }));
  const builtinIds = new Set(CPR.DATA.MISSION_KIT_QUICKHACKS.map(q => q.id));
  const library = () => S.list(KEY).map(normalize).sort((a, b) => a.name.localeCompare(b.name));
  const list = () => builtins().concat(library());
  const get = id => list().find(q => q.id === id) || null;
  const save = q => S.put(KEY, normalize(q));
  const remove = id => S.remove(KEY, id);
  function importDefs(defs, onlyIfMissing) {
    let n = 0;
    const have = new Set(S.list(KEY).map(q => q.id));
    defs.forEach(d => {
      if (!d || typeof d !== 'object' || !d.name || builtinIds.has(d.id)) return;
      if (onlyIfMissing && have.has(d.id)) return;
      S.put(KEY, normalize(d)); n++;
    });
    return n;
  }
  return { list, library, get, save, remove, importDefs, normalize };
})();

CPR.tableRules = (function () {
  const S = CPR.store, D = CPR.DATA, KEY = 'tablerules';
  const all = () => S.read(KEY, {});
  // Rule reminder for a weapon type: the GM's wording if set, otherwise the placeholder.
  function weaponRule(wtype) {
    if (!wtype) return '';
    const custom = (all().weapons || {})[wtype];
    return custom || (D.WEAPON_TYPES.find(t => t.id === wtype) || {}).rule || '';
  }
  function setWeaponRule(wtype, text) {
    const r = all();
    r.weapons = { ...(r.weapons || {}), [wtype]: text };
    S.write(KEY, r);
  }
  return { all, weaponRule, setWeaponRule, replace: r => S.write(KEY, r || {}) };
})();

CPR.homebrew = (function () {
  const D = CPR.DATA, U = CPR.ui, esc = U.esc, C = CPR.cyber, Q = CPR.quickhacks;
  let root;

  const catName = id => (C.CATS.find(c => c[0] === id) || [id, id])[1];
  const tierN = hl => (hl <= 0 ? 0 : hl <= 3 ? 1 : hl <= 7 ? 2 : hl <= 10 ? 3 : 4);
  const signed = n => (n >= 0 ? '+' : '−') + Math.abs(n);
  const wtypeName = id => (D.WEAPON_TYPES.find(t => t.id === id) || {}).name || 'Standard';

  function modsSummary(m) {
    const out = [];
    if (m.init) out.push(`${signed(m.init)} Initiative`);
    if (m.sp) out.push(`SP ${m.sp}`);
    Object.entries(m.stats).forEach(([k, v]) => v && out.push(`${signed(v)} ${k}`));
    Object.entries(m.skills).forEach(([k, v]) => v && out.push(`${signed(v)} ${k}`));
    return out;
  }

  /* ---------- page ---------- */
  function render() {
    const items = C.list(), hacks = Q.library();
    const rules = CPR.tableRules;
    root.innerHTML = `
      <div class="row">
        <h2 style="margin:0">Homebrew & Sourcebooks</h2><span class="spacer"></span>
        <button class="btn" data-a="import">⇪ Import</button>
        <button class="btn" data-a="export">⇩ Export library</button>
      </div>
      <p class="muted small" style="max-width:780px">GM tools. Anything made here shows up for every character on this device, marked with ★.
        To give it to players on other devices, use <b>Export library</b> and have them <b>Import</b> the file. It includes cyberware,
        quickhacks and your weapon-type rules. Characters also carry a copy of whatever they've installed, so their exported sheets work anywhere.</p>

      <section class="panel hb-mk">
        <div class="row"><h3 style="margin:0">Mission Kit weapon types</h3><span class="badge warn">Fill in from your book</span></div>
        <p class="muted small">Edgerunners Mission Kit cyberware (Gorilla Arms, Mantis Blades, Monowire) and quickhacks are built in. Their numbers live in one table
          at the top of <code>js/data.js</code>. Here, write the rule each weapon type follows; it's shown on attack and damage rolls with that weapon.</p>
        <div class="hb-rules">${D.WEAPON_TYPES.filter(t => t.id).map(t => `<label class="field">${esc(t.name)} weapons
          <textarea rows="2" data-rule="${t.id}" placeholder="${esc(t.rule)}">${esc((rules.all().weapons || {})[t.id] || '')}</textarea></label>`).join('')}</div>
        <p class="muted small" style="margin:0">Set a weapon's type on a character's Gear tab. Leave a box empty to show the placeholder.</p>
      </section>

      <section class="hb-section">
        <div class="row"><h3 style="margin:0">Cyberware</h3><span class="spacer"></span><button class="btn primary sm" data-a="new">+ New cyberware</button></div>
        ${items.length ? `<div class="hb-grid">${items.map(h => {
          const mods = modsSummary(h.mods);
          return `<article class="hb-card t${tierN(h.hl)}" data-edit="${h.id}">
            <header><b>★ ${esc(h.name)}</b><span>${esc(h.kind)}</span></header>
            ${h.source ? `<div class="small" style="color:var(--orange)">${esc(h.source)}</div>` : ''}
            <div class="hb-cats">${h.cats.map(c => `<span>${esc(catName(c))}</span>`).join('')}</div>
            <div class="hb-nums"><span>${h.cost.toLocaleString()}eb</span><span>HL ${h.hl}${h.hlDice ? ` (${esc(h.hlDice)})` : ''}</span><span>${h.slots} slot${h.slots === 1 ? '' : 's'}</span></div>
            ${h.fx.length || mods.length || h.weapon ? `<div class="hb-fx">${h.weapon ? `<span class="wpn">⚔ ${esc(h.weapon.damage)} ${esc(h.weapon.skill)}</span>` : ''}${h.fx.map(f => `<span>${esc(f)}</span>`).join('')}${mods.map(f => `<span class="mod">${esc(f)}</span>`).join('')}</div>` : ''}
            ${h.details ? `<p>${esc(h.details)}</p>` : ''}
            <div class="row end">
              <button class="btn sm ghost" data-a="share" data-id="${h.id}" title="Export just this one">⇩</button>
              <button class="btn sm ghost" data-a="dup" data-id="${h.id}">Duplicate</button>
              <button class="btn sm danger" data-a="del" data-id="${h.id}">Delete</button>
            </div>
          </article>`;
        }).join('')}</div>` : `<div class="empty small">No homebrew cyberware yet. Try a prototype Sandevistan, corp-issue optics or a gang's signature fashionware.</div>`}
      </section>

      <section class="hb-section">
        <div class="row"><h3 style="margin:0">Quickhacks</h3><span class="spacer"></span><button class="btn primary sm" data-a="new-qh">+ New quickhack</button></div>
        <p class="muted small" style="margin:4px 0 0">Your own quickhacks, alongside the built-in Mission Kit ones. Players pick them on their character's Netrunning tab and roll them there (Interface + d10 by default).</p>
        ${hacks.length ? `<div class="hb-grid">${hacks.map(q => `<article class="hb-card qh" data-editqh="${q.id}">
            <header><b>⌁ ${esc(q.name)}</b><span>${q.base === 'interface' ? 'Interface' : esc(q.base)}</span></header>
            ${q.source ? `<div class="small" style="color:var(--orange)">${esc(q.source)}</div>` : ''}
            <div class="hb-nums">${q.dv ? `<span>DV ${esc(q.dv)}</span>` : ''}${q.damage ? `<span>DMG ${esc(q.damage)}</span>` : ''}${q.cost ? `<span>${esc(q.cost)}</span>` : ''}</div>
            ${q.effect ? `<p>${esc(q.effect)}</p>` : ''}
            <div class="row end"><button class="btn sm danger" data-a="del-qh" data-id="${q.id}">Delete</button></div>
          </article>`).join('')}</div>` : '<div class="empty small">No custom quickhacks yet.</div>'}
      </section>`;
  }

  /* ---------- cyberware editor ---------- */
  function editor(def, isTemplate) {
    const h = C.normalize(def || { name: '', cats: ['neural'], kind: 'Combat', hlDice: '2d6', hl: 7, cost: 500 });
    const isNew = isTemplate || !def || !C.list().some(x => x.id === h.id);
    const w0 = (def && def.weapon) || {};
    const skillOpts = (sel, filter) => D.SKILLS.filter(filter || (() => true)).map(s => `<option ${s.name === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
    const skillRow = (name, v) => `<div class="hb-skillrow"><select data-skill>${skillOpts(name)}</select>
      <input type="number" data-skillv value="${v}" style="width:70px"><button class="btn icon sm danger" type="button" data-delskill>×</button></div>`;
    const fightSkill = s => ['Fighting', 'Ranged Weapon'].includes(s.cat);

    const m = U.modal({
      cls: 'wide',
      title: isNew ? (h.source ? `Set up ${h.name}` : 'New homebrew cyberware') : `Edit ${h.name}`,
      body: `<div class="hb-editor">
        <form class="hb-form" onsubmit="return false">
          ${h.source ? `<div class="hb-src">📖 ${esc(h.source)} — copy the values from your book.</div>` : ''}
          <label class="field">Name<input id="hb-name" value="${esc(h.name)}" placeholder="e.g. Militech 'Apogee' Sandevistan" required></label>
          <div class="field"><span>Installs in (pick one or more)</span>
            <div class="hb-catpick">${C.CATS.map(([id, label]) => `<label class="check small"><input type="checkbox" data-cat="${id}" ${h.cats.includes(id) ? 'checked' : ''}>${esc(label)}</label>`).join('')}</div>
          </div>
          <div class="hb-row">
            <label class="field">Playstyle<select id="hb-kind">${C.KINDS.map(k => `<option ${k === h.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
            <label class="field">Cost (eb)<input id="hb-cost" type="number" min="0" value="${h.cost}"></label>
            <label class="field">Slots used<input id="hb-slots" type="number" min="0" max="5" value="${h.slots}"></label>
          </div>
          <div class="hb-row">
            <label class="field">Humanity Loss<input id="hb-hl" type="number" min="0" value="${h.hl}"></label>
            <label class="field">HL dice (optional)<input id="hb-hldice" value="${esc(h.hlDice)}" placeholder="2d6"></label>
          </div>
          <label class="field">Effect tags (comma separated)<input id="hb-fx" value="${esc(h.fx.join(', '))}" placeholder="+4 Initiative for 1 min, Recharge 1 hour"></label>
          <label class="field">Description<textarea id="hb-details" rows="4" placeholder="What it does, how it looks, any drawbacks…">${esc(h.details)}</textarea></label>

          <details class="hb-mech" ${w0.damage !== undefined || h.weapon ? 'open' : ''}>
            <summary>Works as a weapon (optional)</summary>
            <p class="muted small">Gives the character Hit and Damage buttons for this piece on their Play tab. Leave damage empty if it isn't a weapon.</p>
            <div class="hb-row">
              <label class="field">Damage<input id="hb-wdmg" value="${esc((h.weapon && h.weapon.damage) || w0.damage || '')}" placeholder="e.g. 3d6"></label>
              <label class="field">Skill<select id="hb-wskill">${skillOpts((h.weapon && h.weapon.skill) || w0.skill || 'Melee Weapon', fightSkill)}</select></label>
              <label class="field">ROF<input id="hb-wrof" type="number" min="1" value="${(h.weapon && h.weapon.rof) || w0.rof || 2}"></label>
              <label class="field">Type<select id="hb-wtype">${D.WEAPON_TYPES.map(t => `<option value="${t.id}" ${t.id === ((h.weapon && h.weapon.wtype) || '') ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
            </div>
          </details>

          <details class="hb-mech" ${modsSummary(h.mods).length ? 'open' : ''}>
            <summary>Roll bonuses (optional)</summary>
            <p class="muted small">Added to rolls on the Play tab and to combat-tracker initiative. They don't change HP or Humanity.</p>
            <div class="hb-row">
              <label class="field">Initiative bonus<input id="hb-init" type="number" value="${h.mods.init}"></label>
              <label class="field">Armor SP (head & body)<input id="hb-sp" type="number" min="0" value="${h.mods.sp}" title="Like Subdermal Armor: doesn't stack with worn armor"></label>
            </div>
            <div class="field"><span>Stat bonuses (to checks)</span>
              <div class="hb-stats">${D.STATS.map(s => `<label><small>${s.id}</small><input type="number" data-stat="${s.id}" value="${h.mods.stats[s.id] || 0}"></label>`).join('')}</div>
            </div>
            <div class="field"><span>Skill bonuses</span>
              <div id="hb-skills">${Object.entries(h.mods.skills).map(([k, v]) => skillRow(k, v)).join('')}</div>
              <button class="btn sm" type="button" id="hb-addskill" style="align-self:flex-start;margin-top:4px">+ Add skill bonus</button>
            </div>
          </details>
        </form>
        <div class="hb-preview"><div class="muted small" style="margin-bottom:6px">PREVIEW — how players will see it</div><div id="hb-prev" class="rd-modal"></div></div>
      </div>`,
      actions: [
        { label: 'Cancel' },
        { label: isNew ? 'Create' : 'Save', cls: 'primary', onClick: w => {
          const def2 = read(w, h.id, h.source);
          if (!def2.name.trim()) { U.toast('Give it a name'); return false; }
          if (!def2.cats.length) { U.toast('Pick at least one slot type'); return false; }
          C.save(def2); render(); U.toast(`${def2.name} saved`);
        } },
      ],
    });

    const w = m.el;
    const preview = () => {
      const d = read(w, h.id, h.source);
      w.querySelector('#hb-prev').innerHTML = CPR.ripperdoc.preview(C.toItem(d));
    };
    w.addEventListener('input', preview);
    w.addEventListener('change', preview);
    w.addEventListener('click', e => {
      if (e.target.id === 'hb-addskill') { w.querySelector('#hb-skills').insertAdjacentHTML('beforeend', skillRow('Perception', 1)); preview(); }
      if (e.target.closest('[data-delskill]')) { e.target.closest('.hb-skillrow').remove(); preview(); }
    });
    preview();
  }

  function read(w, id, source) {
    const v = sel => w.querySelector(sel).value;
    const stats = {};
    w.querySelectorAll('[data-stat]').forEach(i => { const n = Number(i.value) || 0; if (n) stats[i.dataset.stat] = n; });
    const skills = {};
    w.querySelectorAll('.hb-skillrow').forEach(r => {
      const n = Number(r.querySelector('[data-skillv]').value) || 0;
      if (n) skills[r.querySelector('[data-skill]').value] = n;
    });
    return C.normalize({
      id, source, name: v('#hb-name').trim(),
      cats: [...w.querySelectorAll('[data-cat]:checked')].map(i => i.dataset.cat),
      kind: v('#hb-kind'), cost: v('#hb-cost'), slots: v('#hb-slots'), hl: v('#hb-hl'), hlDice: v('#hb-hldice').trim(),
      fx: v('#hb-fx').split(',').map(s => s.trim()).filter(Boolean), details: v('#hb-details').trim(),
      mods: { init: v('#hb-init'), sp: v('#hb-sp'), stats, skills },
      weapon: { damage: v('#hb-wdmg').trim(), skill: v('#hb-wskill'), rof: v('#hb-wrof'), wtype: v('#hb-wtype') },
    });
  }

  /* ---------- quickhack editor ---------- */
  function qhEditor(def, isTemplate) {
    const q = Q.normalize(def || {});
    const isNew = isTemplate || !def || !Q.get(q.id);
    U.modal({
      title: isNew ? (q.source ? `Set up ${q.name}` : 'New quickhack') : `Edit ${q.name}`,
      body: `<div class="hb-form">
        ${q.source ? `<div class="hb-src">📖 ${esc(q.source)} — copy the values from your book.</div>` : ''}
        <label class="field">Name<input id="qh-name" value="${esc(q.name)}"></label>
        <div class="hb-row">
          <label class="field">Roll with<select id="qh-base"><option value="interface" ${q.base === 'interface' ? 'selected' : ''}>Interface (Netrunner rank)</option>
            ${D.SKILLS.map(s => `<option ${s.name === q.base ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
          <label class="field">DV / opposed by<input id="qh-dv" value="${esc(q.dv)}" placeholder="e.g. 13, or target's Evasion"></label>
        </div>
        <div class="hb-row">
          <label class="field">Damage (optional)<input id="qh-dmg" value="${esc(q.damage)}" placeholder="e.g. 3d6"></label>
          <label class="field">Cost / limits (optional)<input id="qh-cost" value="${esc(q.cost)}" placeholder="e.g. 1 NET Action"></label>
        </div>
        <label class="field">Effect<textarea id="qh-effect" rows="4">${esc(q.effect)}</textarea></label>
      </div>`,
      actions: [{ label: 'Cancel' }, {
        label: isNew ? 'Create' : 'Save', cls: 'primary', onClick: w => {
          const v = s => w.querySelector(s).value.trim();
          if (!v('#qh-name')) { U.toast('Give it a name'); return false; }
          Q.save({ ...q, name: v('#qh-name'), base: v('#qh-base'), dv: v('#qh-dv'), damage: v('#qh-dmg'), cost: v('#qh-cost'), effect: v('#qh-effect'), updated: Date.now() });
          render(); U.toast('Quickhack saved');
        },
      }],
    });
  }

  /* ---------- import / export ---------- */
  function exportAll() {
    U.saveFile('redkit_homebrew.json', JSON.stringify({
      app: 'RED Kit', type: 'homebrew', homebrew: C.list(), quickhacks: Q.library(), tableRules: CPR.tableRules.all(),
    }, null, 2));
  }

  async function importFile() {
    const f = await U.pickFile('.json,application/json');
    if (!f) return;
    try {
      const data = JSON.parse(f.text);
      let a = 0, b = 0;
      if (Array.isArray(data)) a = C.importDefs(data);
      else {
        if (data.homebrew) a = C.importDefs(data.homebrew);
        if (data.quickhacks) b = Q.importDefs(data.quickhacks);
        if (data.tableRules) CPR.tableRules.replace({ ...CPR.tableRules.all(), ...data.tableRules });
        if (!data.homebrew && !data.quickhacks && data.name) a = C.importDefs([data]);
      }
      U.toast(a || b || data.tableRules ? `Imported ${a} cyberware, ${b} quickhack${b === 1 ? '' : 's'}${data.tableRules ? ' and weapon rules' : ''}` : 'Nothing to import in that file');
      render();
    } catch (e) { U.toast('That file is not a homebrew library'); }
  }

  function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (b) {
      const id = b.dataset.id;
      switch (b.dataset.a) {
        case 'new': return editor(null);
        case 'new-qh': return qhEditor(null);
        case 'import': return importFile();
        case 'export': return exportAll();
        case 'share': { const h = C.snapshot(id); return U.saveFile(U.safeName(h.name) + '.homebrew.json', JSON.stringify({ app: 'RED Kit', type: 'homebrew', homebrew: [h] }, null, 2)); }
        case 'dup': { const h = C.snapshot(id); h.id = CPR.store.uid('hb'); h.name += ' (copy)'; C.save(h); render(); return; }
        case 'del': {
          const h = C.snapshot(id);
          return U.confirm('Delete homebrew cyberware?', `"${h.name}" will be removed from the library. Characters that already have it installed keep their copy.`, 'Delete', () => { C.remove(id); render(); });
        }
        case 'del-qh': {
          e.stopPropagation();
          const q = Q.get(id);
          return U.confirm('Delete quickhack?', `"${q.name}" will be removed from the library. Characters that already have it keep their copy.`, 'Delete', () => { Q.remove(id); render(); });
        }
      }
      return;
    }
    const card = e.target.closest('[data-edit]');
    if (card) return editor(C.snapshot(card.dataset.edit));
    const qcard = e.target.closest('[data-editqh]');
    if (qcard) qhEditor(Q.get(qcard.dataset.editqh));
  }

  function onChange(e) {
    const t = e.target;
    if (t.dataset.rule) { CPR.tableRules.setWeaponRule(t.dataset.rule, t.value.trim()); U.toast('Weapon rule saved'); }
  }

  function mount(el) { root = el; root.addEventListener('click', onClick); root.addEventListener('change', onChange); render(); }
  return { mount, onShow: render };
})();
