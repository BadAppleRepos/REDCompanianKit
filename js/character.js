/* Character builder: list, editor (identity, stats, skills, cyberware, gear, lifepath), sheet & export. */
CPR.characters = (function () {
  const D = CPR.DATA, R = D.RULES, S = CPR.store, U = CPR.ui, esc = U.esc;
  const KEY = 'characters';
  let root, current = null, tab = 'identity', saveTimer;
  let cyberView = S.read('ui.cyberView', 'ripper');

  /* ---------------- model ---------------- */
  function blank() {
    const stats = {};
    D.STATS.forEach(s => (stats[s.id] = 6));
    const skills = {};
    D.SKILLS.forEach(s => (skills[s.name] = s.basic ? R.basicSkillMin : 0));
    return {
      id: S.uid('chr'), schema: 1,
      handle: '', name: '', role: 'solo', roleRank: R.startingRoleRank, age: '', pronouns: '',
      creationMode: 'package',
      stats, skills, customSkills: [],
      hpCurrent: null, humanityExtra: 0, deathSaveBonus: 0, deathPenalty: 0, quickhacks: [], deck: '', programs: [],
      armor: { head: { name: 'None', sp: 0, spCurrent: 0 }, body: { name: 'None', sp: 0, spCurrent: 0 } },
      weapons: [], gear: [],
      cyber: { zones: {} },
      lifepath: {}, notes: '',
      money: R.startingMoney, ip: 0, reputation: 0,
      created: Date.now(),
    };
  }

  // Fill in any fields missing from older / imported characters.
  // Also coerces every field to the type the UI expects, so a shared file can't inject markup.
  function normalize(c) {
    const b = blank(), num = S.num, str = v => (v == null ? '' : String(v));
    const arr = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []);
    const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    for (const k in b) if (c[k] === undefined) c[k] = b[k];
    c.stats = obj(c.stats); c.skills = obj(c.skills); c.lifepath = obj(c.lifepath);
    D.STATS.forEach(s => { c.stats[s.id] = num(c.stats[s.id]); });
    Object.keys(c.skills).forEach(k => { c.skills[k] = num(c.skills[k]); });
    D.SKILLS.forEach(s => { if (c.skills[s.name] === undefined) c.skills[s.name] = 0; });
    Object.keys(c.lifepath).forEach(k => { c.lifepath[k] = str(c.lifepath[k]); });
    ['handle', 'name', 'age', 'pronouns', 'notes'].forEach(k => { c[k] = str(c[k]); });
    ['roleRank', 'money', 'ip', 'reputation', 'humanityExtra', 'deathSaveBonus', 'deathPenalty'].forEach(k => { c[k] = num(c[k]); });
    c.hpCurrent = c.hpCurrent == null ? null : num(c.hpCurrent, null);
    if (!D.ROLES.some(r => r.id === c.role)) c.role = 'solo';
    if (c.creationMode !== 'free') c.creationMode = 'package';
    const statId = v => (D.STATS.some(s => s.id === v) ? v : 'INT');
    c.customSkills = arr(c.customSkills).map(s => ({ name: str(s.name), stat: statId(s.stat), level: num(s.level), x2: !!s.x2 }));
    // Older saves have no cost: fill the base price when the name matches a standard weapon / armor.
    const basePrice = (list, name) => (list.find(x => x.name === name) || {}).cost || 0;
    c.weapons = arr(c.weapons).map(w => ({
      cost: w.cost == null ? basePrice(D.WEAPONS, w.name) : num(w.cost),
      name: str(w.name), skill: str(w.skill) || 'Handgun', damage: str(w.damage), rof: num(w.rof, 1), mag: num(w.mag),
      ammo: w.ammo == null ? null : num(w.ammo), notes: str(w.notes), dmgOverride: str(w.dmgOverride), dmgMod: num(w.dmgMod),
      wtype: D.WEAPON_TYPES.some(t => t.id === w.wtype) ? w.wtype : '',
    }));
    c.gear = arr(c.gear).map(g => ({ name: str(g.name), qty: num(g.qty, 1), notes: str(g.notes) }));
    c.armor = obj(c.armor);
    ['head', 'body'].forEach(l => {
      const a = obj(c.armor[l] || b.armor[l]);
      const name = str(a.name) || 'None';
      c.armor[l] = { name, sp: num(a.sp), spCurrent: num(a.spCurrent), cost: a.cost == null ? basePrice(D.ARMOR, name) : num(a.cost) };
    });
    c.cyber = obj(c.cyber);
    const zones = obj(c.cyber.zones), clean = {};
    const entry = e => {
      if (!e || typeof e !== 'object' || typeof e.id !== 'string') return null;
      const out = { id: e.id, hl: e.hl == null ? null : num(e.hl) };
      // Installed while its Mission Kit Humanity Loss was a 0 placeholder: follow the table now.
      const it = D.cyberById[e.id];
      if (it && it.source === D.MISSION_KIT_SOURCE && out.hl === 0 && it.hl > 0) out.hl = null;
      if (e.id === 'custom') Object.assign(out, { name: str(e.name), cost: num(e.cost), slots: num(e.slots, 1) });
      if (e.hb && typeof e.hb === 'object') out.hb = CPR.cyber.normalize(e.hb);
      return out;
    };
    D.CYBER_ZONES.forEach(z => {
      const zs = obj(zones[z.id]);
      clean[z.id] = { foundation: entry(zs.foundation), options: (Array.isArray(zs.options) ? zs.options : []).map(entry).filter(Boolean) };
    });
    c.cyber.zones = clean;
    c.quickhacks = arr(c.quickhacks).map(CPR.quickhacks.normalize);
    if (!D.CYBERDECKS.some(k => k.id === c.deck)) c.deck = '';
    c.programs = arr(c.programs).filter(pg => D.programById[pg.id])
      .map(pg => ({ id: pg.id, rez: Math.max(0, Math.min(D.programById[pg.id].rez, num(pg.rez, D.programById[pg.id].rez))) }));
    return c;
  }

  function cyberInfo(entry) {
    if (!entry) return null;
    if (entry.id === 'custom') {
      return { name: entry.name || 'Custom', cost: Number(entry.cost) || 0, hl: Number(entry.hl) || 0, slots: entry.slots == null ? 1 : Number(entry.slots), desc: 'Custom entry', custom: true };
    }
    // Library first (so GM edits show up), then the copy saved with the character.
    const item = CPR.cyber.get(entry.id) || (entry.hb ? CPR.cyber.toItem(entry.hb) : null);
    if (!item) return { name: entry.id, cost: 0, hl: Number(entry.hl) || 0, slots: 1, desc: 'Unknown item' };
    return { ...item, hl: entry.hl == null ? item.hl : Number(entry.hl), slots: item.slots == null ? 1 : item.slots };
  }

  function zoneState(c, zid) {
    const z = c.cyber.zones[zid] || (c.cyber.zones[zid] = { foundation: null, options: [] });
    z.options = z.options || [];
    return z;
  }

  function zoneCapacity(c, zone) {
    if (zone.needs) {
      // chips: one per Chipware Socket
      const n = zoneState(c, 'neural');
      return n.foundation ? n.options.filter(o => o && o.id === zone.needs).length : 0;
    }
    if (zone.foundation && !zoneState(c, zone.id).foundation) return 0;
    return zone.slots;
  }

  function zoneUsed(c, zone) {
    return zoneState(c, zone.id).options.reduce((a, o) => a + (cyberInfo(o) ? cyberInfo(o).slots : 0), 0);
  }

  function allCyber(c) {
    const out = [];
    D.CYBER_ZONES.forEach(zone => {
      const z = zoneState(c, zone.id);
      if (z.foundation) out.push({ zone, entry: z.foundation, info: cyberInfo(z.foundation) });
      if (zone.foundation && !z.foundation) return;
      z.options.forEach(o => o && out.push({ zone, entry: o, info: cyberInfo(o) }));
    });
    return out;
  }

  function derive(c) {
    const st = c.stats;
    const cyber = allCyber(c);
    const hlCyber = cyber.reduce((a, x) => a + x.info.hl, 0);
    const cyberCost = cyber.reduce((a, x) => a + x.info.cost, 0);
    const humanityMax = (st.EMP || 0) * 10;
    const humanity = humanityMax - hlCyber - (Number(c.humanityExtra) || 0);
    const empCur = Math.max(0, Math.min(st.EMP || 0, Math.floor(humanity / 10)));
    const hpMax = 10 + 5 * Math.ceil(((st.BODY || 0) + (st.WILL || 0)) / 2);
    const hp = c.hpCurrent == null ? hpMax : c.hpCurrent;
    const statTotal = D.STATS.reduce((a, s) => a + (st[s.id] || 0), 0);
    let skillTotal = 0;
    D.SKILLS.forEach(s => (skillTotal += (c.skills[s.name] || 0) * (s.x2 ? 2 : 1)));
    c.customSkills.forEach(s => (skillTotal += (Number(s.level) || 0) * (s.x2 ? 2 : 1)));

    const warnings = [];
    if (c.creationMode === 'package') {
      if (statTotal !== R.statPoints) warnings.push(`Stats use ${statTotal}/${R.statPoints} points`);
      D.STATS.forEach(s => { if (st[s.id] < R.statMin || st[s.id] > R.statMax) warnings.push(`${s.id} should be ${R.statMin}–${R.statMax}`); });
      if (skillTotal !== R.skillPoints) warnings.push(`Skills use ${skillTotal}/${R.skillPoints} points`);
      D.SKILLS.forEach(s => {
        const v = c.skills[s.name] || 0;
        if (s.basic && v < R.basicSkillMin) warnings.push(`${s.name} is a basic skill (min ${R.basicSkillMin})`);
        if (v > R.skillMaxAtCreation) warnings.push(`${s.name} above ${R.skillMaxAtCreation}`);
      });
    }
    D.CYBER_ZONES.forEach(zone => {
      const cap = zoneCapacity(c, zone), used = zoneUsed(c, zone);
      if (used > cap) warnings.push(`${zone.label}: ${used}/${cap} slots used`);
    });
    const ids = new Set(cyber.map(x => x.entry.id));
    Object.entries(D.CYBER_CONFLICTS || {}).forEach(([a, bs]) => bs.forEach(b => {
      if (a < b && ids.has(a) && ids.has(b)) warnings.push(`${D.cyberById[a].name} and ${D.cyberById[b].name} can't be combined`);
    }));
    const deckSlots = (D.CYBERDECKS.find(k => k.id === (c.deck || '')) || { slots: 0 }).slots;
    if ((c.programs || []).length > deckSlots) warnings.push(`Cyberdeck: ${(c.programs || []).length}/${deckSlots} program slots used`);
    if (humanity <= 0) warnings.push('Humanity 0 or less — cyberpsychosis!');

    // Roll bonuses from cyberware (Kerenzikov + any homebrew bonuses).
    const mods = { initParts: [], statParts: {}, skillParts: {} };
    if (ids.has('kerenzikov')) mods.initParts.push({ label: 'Kerenzikov', v: 2 });
    cyber.forEach(x => {
      const m = x.info.mods;
      if (!m) return;
      const label = x.info.name;
      if (m.init) mods.initParts.push({ label, v: m.init });
      Object.entries(m.stats || {}).forEach(([k, v]) => v && (mods.statParts[k] = mods.statParts[k] || []).push({ label, v }));
      Object.entries(m.skills || {}).forEach(([k, v]) => v && (mods.skillParts[k] = mods.skillParts[k] || []).push({ label, v }));
    });
    const initBonus = mods.initParts.reduce((a, p) => a + p.v, 0);

    // Cyberware that sets BODY for Choke, Slam and strength feats (Gorilla Arms): highest one wins.
    let brawlBody = st.BODY || 0, brawlBodySource = '';
    cyber.forEach(x => { if (x.info.body && x.info.body > brawlBody) { brawlBody = x.info.body; brawlBodySource = x.info.name; } });
    // Paired arm cyberware: count arms that have it; pair-only effects need both.
    const pairs = {};
    ['armL', 'armR'].forEach(zid => cyber.filter(x => x.zone.id === zid && x.info.pair)
      .forEach(x => { (pairs[x.entry.id] = pairs[x.entry.id] || { info: x.info, arms: new Set() }).arms.add(zid); }));
    const fullPairs = [];
    Object.values(pairs).forEach(p => {
      if (p.arms.size < 2) warnings.push(`${p.info.name} is only in one arm; install it in both for the pair effects`);
      else fullPairs.push(p.info);
    });

    const skinSp =Math.max(0, ...cyber.map(x => x.entry.id === 'subdermal_armor' ? 11 : x.entry.id === 'skin_weave' ? 7 : (x.info.mods && x.info.mods.sp) || 0));
    const role = D.ROLES.find(r => r.id === c.role) || D.ROLES[0];
    return {
      hpMax, hp, seriously: Math.ceil(hpMax / 2), deathSave: (st.BODY || 0) + (Number(c.deathSaveBonus) || 0),
      humanityMax, humanity, empCur, hlCyber, cyberCost, statTotal, skillTotal, warnings, cyber, skinSp, role, mods, initBonus,
      brawlBody, brawlBodySource, fullPairs,
      walk: st.MOVE * 2, run: st.MOVE * 6,
    };
  }

  function statFor(c, d, stat) { return stat === 'EMP' ? d.empCur : (c.stats[stat] || 0); }

  function woundState(hp, hpMax) {
    if (hp <= 0) return { label: 'Mortally Wounded', cls: 'bad' };
    if (hp < Math.ceil(hpMax / 2)) return { label: 'Seriously Wounded', cls: 'warn' };
    if (hp < hpMax) return { label: 'Lightly Wounded', cls: 'cyan' };
    return { label: 'Healthy', cls: 'ok' };
  }

  /* ---------------- persistence ---------------- */
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => current && S.put(KEY, current), 250);
  }
  function saveNow() { clearTimeout(saveTimer); if (current) S.put(KEY, current); }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
  }
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }

  /* ---------------- list view ---------------- */
  function renderList() {
    current = null;
    const chars = S.list(KEY).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    root.innerHTML = `
      <div class="row">
        <h2 style="margin:0">Characters</h2><span class="spacer"></span>
        <button class="btn" data-a="import">⇪ Import</button>
        ${chars.length ? '<button class="btn" data-a="export-all">⇩ Export all</button>' : ''}
        <button class="btn primary" data-a="new">+ New Character</button>
      </div>
      ${chars.length ? `<div class="char-list">${chars.map(c => {
        normalize(c);
        const d = derive(c);
        return `<div class="char-card" data-open="${c.id}">
          <div class="handle">${esc(c.handle || 'Unnamed Edgerunner')}</div>
          <div class="meta">${esc(d.role.name)} · Rank ${c.roleRank} ${c.name ? '· ' + esc(c.name) : ''}</div>
          <div class="row" style="margin-top:8px">
            <span class="badge">HP ${d.hp}/${d.hpMax}</span>
            <span class="badge">HUM ${d.humanity}</span>
            <span class="badge">${d.cyber.length} chrome</span>
          </div></div>`;
      }).join('')}</div>` : `<div class="empty" style="margin-top:12px">
          <p>No characters yet.</p><button class="btn primary" data-a="new">+ Create your first Edgerunner</button></div>`}
    `;
  }

  async function importFile() {
    const f = await U.pickFile('.json,application/json');
    if (!f) return;
    try {
      let data = JSON.parse(f.text);
      if (data && data.characters) data = data.characters;
      const arr = Array.isArray(data) ? data : [data];
      let n = 0;
      const hb = [];
      arr.forEach(c => {
        if (!c || typeof c !== 'object' || !c.stats) return;
        normalize(c);
        c.id = S.safeId(c.id, 'chr');
        if (S.get(KEY, c.id)) c.id = S.uid('chr');
        S.put(KEY, c); n++;
        // Homebrew chrome travels inside the character: add any we don't have to the library.
        Object.values(c.cyber.zones).forEach(z => (z.options || []).forEach(o => o && o.hb && hb.push(o.hb)));
        CPR.quickhacks.importDefs(c.quickhacks || [], true);
      });
      const added = hb.length ? CPR.cyber.importDefs(hb, true) : 0;
      U.toast(n ? `Imported ${n} character${n > 1 ? 's' : ''}${added ? ` + ${added} homebrew cyberware` : ''}` : 'No characters found in that file');
      renderList();
    } catch (e) {
      U.toast('That file is not valid character JSON');
    }
  }

  /* ---------------- editor ---------------- */
  const TABS = [
    ['play', '🎲 Play'], ['netrunning', '⌁ Netrunning'], ['identity', 'Identity'], ['stats', 'Stats'], ['skills', 'Skills'], ['cyber', 'Cyberware'],
    ['gear', 'Gear'], ['lifepath', 'Lifepath'], ['sheet', 'Sheet & Export'],
  ];

  function open(id) {
    const c = S.get(KEY, id);
    if (!c) return renderList();
    current = normalize(c);
    renderEditor();
  }

  function renderEditor() {
    root.innerHTML = `
      <div class="editor-head">
        <button class="btn ghost" data-a="back">← All</button>
        <div class="title" data-d="title"></div>
        <span class="spacer"></span>
        <button class="btn cyan sm" data-a="to-combat">⚔ Add to combat</button>
        <button class="btn sm" data-a="dup">Duplicate</button>
        <button class="btn danger sm" data-a="delete">Delete</button>
      </div>
      <div class="derived-bar" id="derived"></div>
      <div class="tabs">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div id="tab-body"></div>`;
    renderTab();
  }

  function renderTab() {
    root.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const body = root.querySelector('#tab-body');
    const fn = { play: tabPlay, netrunning: tabNetrunning, identity: tabIdentity, stats: tabStats, skills: tabSkills, cyber: tabCyber, gear: tabGear, lifepath: tabLifepath, sheet: tabSheet }[tab];
    body.innerHTML = fn(current, derive(current));
    refreshDerived();
  }

  function refreshDerived() {
    if (!current) return;
    const c = current, d = derive(c);
    const t = root.querySelector('[data-d="title"]');
    if (t) t.textContent = c.handle || 'Unnamed Edgerunner';
    const wound = woundState(d.hp, d.hpMax);
    const bar = root.querySelector('#derived');
    if (bar) {
      const statCls = c.creationMode !== 'package' ? '' : d.statTotal === R.statPoints ? 'ok' : 'warn';
      const skillCls = c.creationMode !== 'package' ? '' : d.skillTotal === R.skillPoints ? 'ok' : 'warn';
      bar.innerHTML = `
        <div class="chip"><b>${d.hp}/${d.hpMax}</b><span>Hit Points</span></div>
        <div class="chip"><b>${d.seriously}</b><span>Serious Wnd</span></div>
        <div class="chip"><b>${d.deathSave}</b><span>Death Save</span></div>
        <div class="chip"><b>${d.humanity}/${d.humanityMax}</b><span>Humanity</span></div>
        <div class="chip"><b>${d.empCur}</b><span>Current EMP</span></div>
        <div class="chip"><b>${Math.max(c.armor.head.spCurrent, d.skinSp)}/${Math.max(c.armor.body.spCurrent, d.skinSp)}</b><span>SP Head/Body</span></div>
        <div class="chip"><b class="${statCls}">${d.statTotal}${c.creationMode === 'package' ? '/' + R.statPoints : ''}</b><span>Stat pts</span></div>
        <div class="chip"><b>${d.skillTotal}${c.creationMode === 'package' ? '/' + R.skillPoints : ''}</b><span>Skill pts</span></div>
        <div class="chip"><b>${d.cyberCost.toLocaleString()}</b><span>Chrome eb</span></div>
        ${d.warnings.length ? `<div class="chip" style="flex:1;min-width:200px"><span class="badge warn" title="${esc(d.warnings.join('\n'))}">⚠ ${d.warnings.length} issue${d.warnings.length > 1 ? 's' : ''}</span>
          <span class="small" style="text-transform:none;letter-spacing:0">${esc(d.warnings.slice(0, 3).join(' · '))}${d.warnings.length > 3 ? ' …' : ''}</span></div>` : `<div class="chip"><span class="badge ok">✓ Valid</span><span>${esc(wound.label)}</span></div>`}
      `;
      bar.querySelectorAll('.chip b.ok').forEach(b => (b.style.color = 'var(--green)'));
      bar.querySelectorAll('.chip b.warn').forEach(b => (b.style.color = 'var(--orange)'));
    }
    root.querySelectorAll('[data-skillbase]').forEach(el => {
      const name = el.dataset.skillbase;
      const sk = D.SKILLS.find(s => s.name === name);
      const lvl = c.skills[name] || 0;
      el.textContent = statFor(c, d, sk.stat) + lvl;
      el.closest('tr').classList.toggle('low', c.creationMode === 'package' && sk.basic && lvl < R.basicSkillMin);
    });
    root.querySelectorAll('[data-customskillbase]').forEach(el => {
      const s = c.customSkills[+el.dataset.customskillbase];
      if (s) el.textContent = statFor(c, d, s.stat) + (Number(s.level) || 0);
    });
    root.querySelectorAll('[data-statnote]').forEach(el => {
      const v = c.stats[el.dataset.statnote];
      el.textContent = c.creationMode === 'package' && (v < R.statMin || v > R.statMax) ? `range ${R.statMin}–${R.statMax}` : '';
    });
    root.querySelectorAll('[data-d]').forEach(el => {
      const k = el.dataset.d;
      if (k !== 'title' && d[k] !== undefined) el.textContent = typeof d[k] === 'number' ? d[k].toLocaleString() : d[k];
    });
  }

  /* ----- play (roll from the sheet) ----- */
  let playAllSkills = false, lastHpAmt = 1;

  function armorPenalty(c) {
    return Math.max(0, ...['head', 'body'].map(l => (D.ARMOR.find(x => x.name === c.armor[l].name) || {}).penalty || 0));
  }

  // Penalties that apply automatically to a check using `stat`.
  function penalties(c, d, stat, opts) {
    const out = [];
    if (!(opts && opts.noWound)) {
      const painEditor = d.cyber.some(x => x.entry.id === 'pain_editor');
      if (d.hp <= 0) out.push({ label: 'Mortally Wounded', v: -4 });
      else if (d.hp < d.seriously && !painEditor) out.push({ label: 'Seriously Wounded', v: -2 });
    }
    if (stat === 'REF' || stat === 'DEX') { const p = armorPenalty(c); if (p) out.push({ label: 'armor', v: -p }); }
    return out;
  }

  // Everything a check adds up, before the die.
  // Cyberware roll bonuses for a stat and/or skill.
  function bonuses(d, stat, skill) {
    return (d.mods.statParts[stat] || []).concat(skill ? d.mods.skillParts[skill] || [] : []);
  }

  function skillParts(c, d, name) {
    const sk = D.SKILLS.find(s => s.name === name);
    if (sk) return [{ label: sk.stat, v: statFor(c, d, sk.stat) }, { label: name, v: c.skills[name] || 0 }, ...bonuses(d, sk.stat, name), ...penalties(c, d, sk.stat)];
    const cs = c.customSkills.find(s => s.name === name);
    if (cs) return [{ label: cs.stat, v: statFor(c, d, cs.stat) }, { label: name, v: Number(cs.level) || 0 }, ...bonuses(d, cs.stat, name), ...penalties(c, d, cs.stat)];
    return [{ label: 'REF', v: c.stats.REF }, ...bonuses(d, 'REF'), ...penalties(c, d, 'REF')];
  }
  const statParts = (c, d, stat) => [{ label: stat, v: statFor(c, d, stat) }, ...bonuses(d, stat), ...penalties(c, d, stat)];
  const sum = parts => parts.reduce((a, p) => a + p.v, 0);
  const signed = n => (n >= 0 ? '+' : '−') + Math.abs(n);

  const wtypeName = id => (D.WEAPON_TYPES.find(t => t.id === id) || {}).name || '';
  // Damage a weapon actually rolls: the Override dice (if set) replace its base damage, then the Modifier is added.
  function effDmg(w) {
    const over = String(w.dmgOverride || '').trim();
    const dice = over || w.damage;
    const bonus = Number(w.dmgMod) || 0;
    return { dice, bonus, over: !!over, label: dice + (bonus ? (bonus > 0 ? '+' : '−') + Math.abs(bonus) : '') };
  }
  // Installed cyberware that works as a weapon (built-in blades and homebrew with damage set).
  // Paired arm pieces (Gorilla Arms) are listed once, not once per arm.
  const onePerPair = list => { const seen = new Set(); return list.filter(x => !x.info.pair || (!seen.has(x.entry.id) && seen.add(x.entry.id))); };
  const cyberWeaponsOf = d => onePerPair(d.cyber.filter(x => x.info.weapon && x.info.weapon.damage)).map(x => ({ ...x, w: x.info.weapon }));
  // Character's quickhacks: the GM's latest version if this device has it, otherwise the saved copy.
  const quickhacksOf = c => (c.quickhacks || []).map(s => CPR.quickhacks.get(s.id) || CPR.quickhacks.normalize(s));
  const interfaceRank = c => (c.role === 'netrunner' ? Number(c.roleRank) || 0 : 0);
  function qhParts(c, d, q) {
    return q.base === 'interface' ? [{ label: 'Interface', v: interfaceRank(c) }] : skillParts(c, d, q.base);
  }

  function qhRow(c, d, q, i) {
    return `<div class="pw qh">
      <div class="pw-name"><b>${esc(q.name)}${q.builtIn ? ' <span class="wt mk">Mission Kit</span>' : ' <span class="wt hb">★ GM</span>'}</b>
        <small>${q.base === 'interface' ? 'Interface' : esc(q.base)}${q.dv ? ' · DV ' + esc(q.dv) : ''}${q.cost ? ' · ' + esc(q.cost) : ''}</small>
        ${q.effect ? `<div class="qh-effect">${esc(q.effect)}</div>` : ''}
        ${q.unset ? '<div class="qh-unset">⚠ Mission Kit values not entered (DV, damage, cost) — add them in js/data.js.</div>' : ''}</div>
      <div class="pw-btns">
        <button class="roll-btn qh" data-roll="qh:${i}"><small>HACK</small>${signed(sum(qhParts(c, d, q)))}</button>
        ${q.damage ? `<button class="roll-btn dmg" data-roll="qhdmg:${i}"><small>DMG</small>${esc(q.damage)}</button>` : ''}
        <button class="btn sm ghost" data-a="qh-toggle" data-id="${q.id}" title="Remove from this character">Forget</button>
      </div></div>`;
  }

  /* ----- netrunning tab ----- */
  // Boosters add +2 to one Interface ability while they still have REZ.
  const BOOSTS = { eraser: 'cloak', see_ya: 'pathfinder', worm: 'backdoor' };
  const programsOf = c => (c.programs || []).map(p => ({ ...D.programById[p.id], cur: p.rez })).filter(p => p.id);
  const deckOf = c => D.CYBERDECKS.find(k => k.id === (c.deck || '')) || D.CYBERDECKS[0];
  function abilityParts(c, abilityId) {
    const parts = [{ label: 'Interface', v: interfaceRank(c) }];
    programsOf(c).forEach(pg => { if (BOOSTS[pg.id] === abilityId && pg.cur > 0) parts.push({ label: pg.name, v: 2 }); });
    return parts;
  }

  function tabNetrunning(c, d) {
    const known = quickhacksOf(c);
    const knownIds = new Set(known.map(q => q.id));
    const avail = CPR.quickhacks.list().filter(q => !knownIds.has(q.id));
    const plugs = d.cyber.some(x => x.entry.id === 'interface_plugs');
    const netrunner = c.role === 'netrunner';
    const deck = deckOf(c), progs = programsOf(c), free = deck.slots - progs.length;
    const owned = new Set(progs.map(p => p.id));
    const classes = ['Booster', 'Defender', 'Attacker'];
    return `<div class="grid" style="grid-template-columns:minmax(0,1fr)">
      <div class="panel qh-head">
        <div class="pv"><small>INTERFACE</small><b>${interfaceRank(c)}</b><span>${netrunner ? 'Netrunner role rank' : 'Only Netrunners have Interface'}</span></div>
        <div class="pv"><small>INTERFACE PLUGS</small><b>${plugs ? '✓' : '—'}</b><span>${plugs ? 'Installed' : 'Install them in the Neural Link'}</span></div>
        <div class="pv"><small>CYBERDECK</small>
          <select data-deck>${D.CYBERDECKS.map(k => `<option value="${k.id}" ${k.id === deck.id ? 'selected' : ''}>${esc(k.name)}${k.slots ? ` — ${k.slots} slots, ${k.cost.toLocaleString()}eb` : ''}</option>`).join('')}</select></div>
        <div class="pv"><small>PROGRAM SLOTS</small><b class="${free < 0 ? 'over' : ''}">${progs.length}/${deck.slots}</b><span>${free < 0 ? 'Over capacity' : free === 1 ? '1 free' : free + ' free'}</span></div>
        ${!netrunner ? '<p class="small" style="color:var(--orange);margin:0;flex-basis:100%">Interface rolls count it as 0 for non-Netrunners. Ask your GM before running the NET.</p>' : ''}
      </div>

      <div class="panel">
        <h3>Interface abilities</h3>
        <p class="muted small" style="margin-top:0">NET Actions: Interface + 1d10 against the DV your GM sets. Boosters on your deck add their bonus automatically.</p>
        <div class="ia-grid">${D.INTERFACE_ABILITIES.map(a => `<div class="ia">
          <button class="ia-main" data-roll="iface:${a.id}"><b>${esc(a.name)}</b><em>${signed(sum(abilityParts(c, a.id)))}</em><small>${esc(a.text)}</small></button>
          ${a.damage ? `<button class="roll-btn dmg" data-roll="ifdmg:${a.id}"><small>DMG</small>${a.damage}</button>` : ''}</div>`).join('')}</div>
      </div>

      <div class="panel">
        <div class="row"><h3 style="margin:0">Programs on your deck</h3><span class="spacer"></span><span class="badge ${free < 0 ? 'bad' : 'cyan'}">${progs.length}/${deck.slots} slots</span></div>
        <div class="pw-list" style="margin-top:8px">${progs.map((pg, i) => `<div class="pw prog">
          <div class="pw-name"><b>${esc(pg.name)} <span class="wt pg-${pg.cls.toLowerCase()}">${esc(pg.kind || pg.cls)}</span></b>
            <small>ATK ${pg.atk} · DEF ${pg.def} · REZ ${pg.rez}</small><div class="qh-effect">${esc(pg.text)}</div></div>
          <div class="pw-btns">
            ${pg.cls === 'Attacker' ? `<button class="roll-btn qh" data-roll="pgatk:${i}" title="Interface + ATK + 1d10"><small>ATK</small>${signed(interfaceRank(c) + pg.atk)}</button>` : ''}
            ${pg.damage ? `<button class="roll-btn dmg" data-roll="pgdmg:${i}:1" title="${esc(pg.dmgLabel || '')}"><small>${pg.damage2 ? 'DMG 1' : 'DMG'}</small>${pg.damage}</button>` : ''}
            ${pg.damage2 ? `<button class="roll-btn dmg" data-roll="pgdmg:${i}:2" title="${esc(pg.dmg2Label || '')}"><small>DMG 2</small>${pg.damage2}</button>` : ''}
            ${pg.rez > 0 ? `<div class="rez"><button class="btn icon sm" data-a="pg-rez" data-i="${i}" data-d="-1" title="Take 1 REZ damage">−</button>
              <span class="${pg.cur <= 0 ? 'out' : ''}">${pg.cur <= 0 ? 'DEREZZED' : `REZ ${pg.cur}/${pg.rez}`}</span>
              <button class="btn icon sm" data-a="pg-rez" data-i="${i}" data-d="1" title="Restore 1 REZ">+</button></div>` : ''}
            <button class="btn sm ghost" data-a="pg-remove" data-i="${i}">Remove</button>
          </div></div>`).join('') || `<p class="muted small">${deck.slots ? 'No programs yet. Add some from the list below.' : 'Pick a cyberdeck above to load programs.'}</p>`}</div>
        ${progs.some(p => p.rez > 0) ? '<button class="btn sm" data-a="pg-rez-all" style="margin-top:8px">↻ Restore all REZ</button>' : ''}
      </div>

      <div class="panel">
        <h3>Program shop</h3>
        <p class="muted small" style="margin-top:0">Core rulebook programs (short summaries; check values against your book). Each uses 1 deck slot.</p>
        ${classes.map(cl => `<h4 class="pg-h">${cl}s</h4><div class="qh-avail">${D.PROGRAMS.filter(p => p.cls === cl).map(p => `<div class="qh-av">
          <div><b>${esc(p.name)}</b> <span class="wt pg-${cl.toLowerCase()}">${esc(p.kind || cl)}</span>
            <small>${p.cls === 'Attacker' ? `ATK ${p.atk}` : `REZ ${p.rez}`}${p.damage ? ` · ${p.damage}${p.damage2 ? '/' + p.damage2 : ''}` : ''} · ${p.cost}eb — ${esc(p.text)}</small></div>
          ${owned.has(p.id) ? '<span class="badge ok">On deck</span>' : `<button class="btn sm cyan" data-a="pg-add" data-id="${p.id}" ${free > 0 ? '' : 'disabled'}>+ Add</button>`}</div>`).join('')}</div>`).join('')}
        <p class="muted small">Black ICE isn't listed: those are your GM's enemies to run.</p>
      </div>

      <div class="panel">
        <h3>⌁ Quickhacks</h3>
        <div class="pw-list">${known.map((q, i) => qhRow(c, d, q, i)).join('') || '<p class="muted small">None learned yet.</p>'}</div>
        ${avail.length ? `<h4 class="pg-h">Available</h4><p class="muted small" style="margin-top:0">Edgerunners Mission Kit quickhacks, plus any your GM made on the Homebrew page.</p>
        <div class="qh-avail">${avail.map(q => `<div class="qh-av">
          <div><b>${esc(q.name)}</b> ${q.builtIn ? '<span class="wt mk">Mission Kit</span>' : '<span class="wt hb">★ GM</span>'}
            ${q.effect ? `<small>${esc(q.effect)}</small>` : ''}</div>
          <button class="btn sm cyan" data-a="qh-toggle" data-id="${q.id}">+ Learn</button></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  function toggleQuickhack(id) {
    const c = current;
    c.quickhacks = c.quickhacks || [];
    const i = c.quickhacks.findIndex(q => q.id === id);
    if (i >= 0) c.quickhacks.splice(i, 1);
    else { const q = CPR.quickhacks.get(id); if (q) c.quickhacks.push(JSON.parse(JSON.stringify(q))); }
    saveNow(); renderTab();
  }

  function brawlDice(body) { return body >= 11 ? '4d6' : body >= 7 ? '3d6' : body >= 5 ? '2d6' : '1d6'; }
  const isMelee = w => /melee|brawl|martial/i.test(w.skill);
  const autofireN = w => { const m = String(w.notes || '').match(/autofire\s*\(?\s*(\d+)/i); return m ? +m[1] : 0; };

  function tabPlay(c, d) {
    const wound = woundState(d.hp, d.hpMax);
    const pens = penalties(c, d, 'INT').concat(armorPenalty(c) ? [{ label: `armor −${armorPenalty(c)} to REF & DEX`, v: 0 }] : []);
    const initBonus = d.initBonus;
    const spH = Math.max(c.armor.head.spCurrent, d.skinSp), spB = Math.max(c.armor.body.spCurrent, d.skinSp);
    const skills = D.SKILLS.map(s => ({ name: s.name, stat: s.stat, lvl: c.skills[s.name] || 0, key: 'skill:' + s.name }))
      .concat(c.customSkills.filter(s => s.name).map(s => ({ name: s.name, stat: s.stat, lvl: Number(s.level) || 0, key: 'skill:' + s.name })))
      .filter(s => playAllSkills || s.lvl > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    const weapons = c.weapons.map((w, i) => ({ w, i }));
    const cyberWeapons = cyberWeaponsOf(d);
    const fxOf =x => (x.info.fx || []).concat(CPR.ripperdoc.modTags(x.info.mods));
    const fxList = onePerPair(d.cyber.filter(x => fxOf(x).length && x.info.cat !== 'foundation'));
    const pairFx = d.fullPairs.filter(p => p.pairFx && p.pairFx.length);

    return `<div class="play">
      <div class="play-vitals">
        <div class="pv pv-hp ${wound.cls}">
          <small>HIT POINTS</small>
          <div class="pv-hpnum"><b>${d.hp}</b><span>/ ${d.hpMax}</span></div>
          <div class="hpbar"><div class="${d.hp <= 0 ? 'mor' : d.hp < d.seriously ? 'ser' : ''}" style="width:${Math.max(0, Math.min(100, d.hp / d.hpMax * 100))}%"></div></div>
          <div class="pv-hpctl">
            <button class="btn sm danger" data-a="play-hp" data-dir="-1">− Damage</button>
            <input id="play-hp-amt" type="number" inputmode="numeric" value="${lastHpAmt}" min="1" aria-label="Amount">
            <button class="btn sm" data-a="play-hp" data-dir="1" style="color:var(--green)">+ Heal</button>
          </div>
          <span class="badge ${wound.cls}">${wound.label}</span>
        </div>
        <button class="pv pv-roll" data-roll="init">
          <small>INITIATIVE</small><b>${signed(c.stats.REF - armorPenalty(c) + initBonus)}</b>
          <span>REF${d.mods.initParts.map(p => ' + ' + esc(p.label)).join('')} + d10</span></button>
        <button class="pv pv-roll ${d.hp <= 0 ? 'urgent' : ''}" data-roll="death">
          <small>DEATH SAVE</small><b>&lt; ${d.deathSave}</b>
          <span>d10${c.deathPenalty ? ' + ' + c.deathPenalty + ' penalty' : ''}</span></button>
        <div class="pv">
          <small>ARMOR SP</small>
          <div class="pv-sp">
            <div><span>Head</span><b>${spH}</b><button class="btn icon sm" data-a="sp-dec" data-loc="head" title="Ablate head armor by 1">−1</button></div>
            <div><span>Body</span><b>${spB}</b><button class="btn icon sm" data-a="sp-dec" data-loc="body" title="Ablate body armor by 1">−1</button></div>
          </div>
        </div>
        <div class="pv"><small>HUMANITY</small><b>${d.humanity}</b><span>EMP ${d.empCur} · Run ${d.walk}m/turn</span></div>
      </div>
      ${pens.length ? `<div class="play-pen">⚠ Applied to rolls: ${pens.map(p => esc(p.v ? `${p.label} ${signed(p.v)}` : p.label)).join(' · ')}</div>` : ''}

      <div class="play-stats">
        ${D.STATS.map(s => {
          const v = statFor(c, d, s.id);
          const tot = v + sum(statParts(c, d, s.id).slice(1));
          return `<button class="ps" data-roll="stat:${s.id}" title="Roll ${s.name} + d10">
            <small>${s.id}</small><b>${v}</b>${tot !== v ? `<em>${signed(tot)}</em>` : ''}</button>`;
        }).join('')}
      </div>

      <div class="play-cols">
        <div class="panel">
          <h3>Weapons</h3>
          <div class="pw-list">
          ${weapons.map(({ w, i }) => {
            const atk = sum(skillParts(c, d, w.skill));
            const ranged = !isMelee(w) && Number(w.mag) > 0;
            const ammo = w.ammo == null ? Number(w.mag) : w.ammo;
            const af = autofireN(w);
            return `<div class="pw">
              <div class="pw-name"><b>${esc(w.name)}${w.wtype ? ` <span class="wt">${esc(wtypeName(w.wtype))}</span>` : ''}</b><small>${esc(w.skill)} · ROF ${w.rof}${w.notes ? ' · ' + esc(w.notes) : ''}</small></div>
              <div class="pw-btns">
                <button class="roll-btn" data-roll="atk:${i}" title="Attack: ${esc(w.skill)} + d10"><small>HIT</small>${signed(atk)}</button>
                <button class="roll-btn dmg" data-roll="dmg:${i}" title="${effDmg(w).over ? 'Override of base ' + esc(w.damage) : 'Roll damage'}"><small>DMG${effDmg(w).over ? '*' : ''}</small>${esc(effDmg(w).label)}</button>
                ${af ? `<button class="roll-btn" data-roll="auto:${i}" title="Autofire: uses 10 rounds"><small>AUTO</small>${signed(sum(skillParts(c, d, 'Autofire')))}</button>` : ''}
              </div>
              ${ranged ? `<div class="pw-ammo"><span>Ammo <b class="${ammo === 0 ? 'out' : ''}">${ammo}</b>/${w.mag}</span>
                <button class="btn sm ghost" data-a="reload" data-i="${i}">↻ Reload</button></div>` : ''}
            </div>`;
          }).join('')}
          ${cyberWeapons.map((x, i) => `<div class="pw cyberw">
            <div class="pw-name"><b>${x.info.homebrew ? '★ ' : ''}${esc(x.info.name)}${x.w.wtype ? ` <span class="wt">${esc(wtypeName(x.w.wtype))}</span>` : ''}</b>
              <small>Cyberware · ${esc(x.w.skill)} · ROF ${x.w.rof}</small></div>
            <div class="pw-btns">
              <button class="roll-btn" data-roll="cwatk:${i}"><small>HIT</small>${signed(sum(skillParts(c, d, x.w.skill)))}</button>
              <button class="roll-btn dmg" data-roll="cwdmg:${i}"><small>DMG</small>${esc(x.w.damage)}</button>
            </div></div>`).join('')}
          <div class="pw">
            <div class="pw-name"><b>Brawling</b><small>Unarmed · BODY ${c.stats.BODY}${d.brawlBodySource ? ` · Choke/Slam & strength: BODY ${d.brawlBody} (${esc(d.brawlBodySource)})` : ''}</small></div>
            <div class="pw-btns">
              <button class="roll-btn" data-roll="brawl-atk"><small>HIT</small>${signed(sum(skillParts(c, d, 'Brawling')))}</button>
              <button class="roll-btn dmg" data-roll="brawl-dmg"><small>DMG</small>${brawlDice(c.stats.BODY)}</button>
            </div>
          </div>
          </div>
          ${weapons.length ? '' : '<p class="muted small">Add weapons on the Gear tab.</p>'}
        </div>

        <div class="panel">
          <div class="row"><h3 style="margin:0">Skills</h3><span class="spacer"></span>
            <button class="btn sm ${playAllSkills ? '' : 'active'}" data-a="play-skills" data-v="0">Trained</button>
            <button class="btn sm ${playAllSkills ? 'active' : ''}" data-a="play-skills" data-v="1">All</button></div>
          <input type="search" id="play-skill-filter" placeholder="Find a skill…" style="margin:8px 0">
          <div class="pskills">
            ${skills.map(s => `<button class="psk" data-roll="${esc(s.key)}" data-playskill="${esc(s.name.toLowerCase())}">
              <span>${esc(s.name)}<small>${s.stat}</small></span><b>${signed(sum(skillParts(c, d, s.name)))}</b></button>`).join('')
              || '<p class="muted small">No trained skills yet — set levels on the Skills tab.</p>'}
          </div>
        </div>
      </div>



      ${fxList.length || pairFx.length ? `<div class="panel"><h3>Chrome Effects</h3><div class="play-fx">
        ${pairFx.map(p => `<div><b>${esc(p.name)} (pair)</b>${p.pairFx.map(f => `<span class="pair">${esc(f)}</span>`).join('')}</div>`).join('')}
        ${fxList.map(x => `<div><b>${x.info.homebrew ? "★ " : ""}${esc(x.info.name)}</b>${fxOf(x).map(f => `<span>${esc(f)}</span>`).join('')}</div>`).join('')}</div></div>` : ''}
      <p class="muted small">Tap any stat, skill or weapon to roll. Checks are STAT + Skill + 1d10: a 10 rolls again and adds, a 1 rolls again and subtracts.
        Use the 🎲 button for a situational modifier and your roll history.</p>
    </div>`;
  }

  function doRoll(spec) {
    const c = current, d = derive(c);
    const R = CPR.roller;
    const who = c.handle || 'Unnamed';
    const base = { who, charId: c.id };
    const i = spec.indexOf(':');
    const kind = i < 0 ? spec : spec.slice(0, i), arg = i < 0 ? '' : spec.slice(i + 1);

    switch (kind) {
      case 'stat': {
        const st = D.STATS.find(s => s.id === arg);
        return R.check({ ...base, label: `${st.name} check`, parts: statParts(c, d, arg) });
      }
      case 'skill': return R.check({ ...base, label: arg, parts: skillParts(c, d, arg) });
      case 'init': {
        const parts = [{ label: 'REF', v: c.stats.REF }, ...d.mods.initParts, ...penalties(c, d, 'REF', { noWound: true })];
        const e = R.check({ ...base, label: 'Initiative', parts, plain: true, noMod: true });
        if (CPR.combat.setInitiative(c.id, e.total)) U.toast('Initiative sent to the combat tracker');
        return;
      }
      case 'death': {
        const roll = U.d(10), pen = Number(c.deathPenalty) || 0, total = roll + pen, body = d.deathSave;
        const ok = roll !== 10 && total < body;
        const dying = d.hp <= 0;
        if (ok && dying) c.deathPenalty = pen + 1;
        save();
        R.custom({ ...base, label: 'Death Save', total, detail: `d10: ${roll}${pen ? ` + ${pen} penalty` : ''} — needs under ${body}${roll === 10 ? ' (a 10 always fails)' : ''}`,
          crit: ok, fumble: !ok, flag: ok ? 'STILL BREATHING' : 'FLATLINED',
          note: !dying ? 'Practice roll — you are not Mortally Wounded' : ok ? `Next Death Save penalty: +${c.deathPenalty}` : 'Unless someone stabilizes you…' });
        return renderTab();
      }
      case 'atk': case 'auto': {
        const w = c.weapons[+arg];
        const ranged = !isMelee(w) && Number(w.mag) > 0;
        const need = kind === 'auto' ? 10 : 1;
        if (w.ammo == null) w.ammo = Number(w.mag) || 0;
        if (ranged && w.ammo < need) return U.toast(`${w.name}: ${w.ammo ? 'not enough' : 'out of'} ammo — reload`);
        if (ranged) w.ammo -= need;
        save();
        if (kind === 'auto') {
          const n = autofireN(w);
          R.check({ ...base, label: `${w.name} — Autofire`, parts: skillParts(c, d, 'Autofire'),
            note: `Used 10 rounds (${w.ammo} left). If you beat the DV: damage 2d6 × the amount you beat it by, max ×${n}.` });
        } else {
          R.check({ ...base, label: `${w.name} — Attack`, parts: skillParts(c, d, w.skill),
            note: [ranged ? `${w.ammo}/${w.mag} rounds left · ROF ${w.rof}` : `ROF ${w.rof}`, CPR.tableRules.weaponRule(w.wtype)].filter(Boolean).join(' · ') });
        }
        return renderTab();
      }
      case 'dmg': {
        const w = c.weapons[+arg];
        const ed = effDmg(w);
        return R.damage({ ...base, label: `${w.name} — Damage`, dice: ed.dice, bonus: ed.bonus,
          note: [ed.over ? `Override (base ${w.damage})` : '', isMelee(w) ? 'Melee: target armor counts at half SP' : 'Head hits: double damage after armor', CPR.tableRules.weaponRule(w.wtype)].filter(Boolean).join(' · ') });
      }
      case 'cwatk': case 'cwdmg': {
        const x = cyberWeaponsOf(d)[+arg];
        if (!x) return;
        const rule = CPR.tableRules.weaponRule(x.w.wtype);
        if (kind === 'cwatk') return R.check({ ...base, label: `${x.info.name} — Attack`, parts: skillParts(c, d, x.w.skill), note: [`ROF ${x.w.rof}`, rule].filter(Boolean).join(' · ') });
        return R.damage({ ...base, label: `${x.info.name} — Damage`, dice: x.w.damage,
          note: [isMelee({ skill: x.w.skill }) ? 'Melee: target armor counts at half SP' : '', rule].filter(Boolean).join(' · ') });
      }
      case 'iface': {
        const a = D.INTERFACE_ABILITIES.find(x => x.id === arg);
        return R.check({ ...base, label: `⌁ ${a.name}`, parts: abilityParts(c, a.id), note: a.text });
      }
      case 'ifdmg': {
        const a = D.INTERFACE_ABILITIES.find(x => x.id === arg);
        return R.damage({ ...base, label: `${a.name} — Damage`, dice: a.damage, note: a.text });
      }
      case 'pgatk': {
        const pg = programsOf(c)[+arg];
        if (!pg) return;
        return R.check({ ...base, label: `${pg.name} — Attack`, parts: [{ label: 'Interface', v: interfaceRank(c) }, { label: `${pg.name} ATK`, v: pg.atk }],
          note: `Opposed by the defender's Interface (or ICE) + DEF + 1d10. ${pg.text}` });
      }
      case 'pgdmg': {
        const [idx, which] = arg.split(':');
        const pg = programsOf(c)[+idx];
        if (!pg) return;
        const two = which === '2';
        return R.damage({ ...base, label: `${pg.name} — ${two ? pg.dmg2Label : pg.dmgLabel}`, dice: two ? pg.damage2 : pg.damage, note: pg.text });
      }
      case 'qh': case 'qhdmg': {
        const q = quickhacksOf(c)[+arg];
        if (!q) return;
        if (kind === 'qhdmg') return R.damage({ ...base, label: `${q.name} — Damage`, dice: q.damage, note: q.effect });
        return R.check({ ...base, label: `⌁ ${q.name}`, parts: qhParts(c, d, q), note: [q.dv ? `vs DV ${q.dv}` : '', q.effect].filter(Boolean).join(' · ') });
      }
      case 'brawl-atk': return R.check({ ...base, label: 'Brawling — Attack', parts: skillParts(c, d, 'Brawling') });
      case 'brawl-dmg': return R.damage({ ...base, label: 'Brawling — Damage', dice: brawlDice(c.stats.BODY), note: 'Damage dice set by BODY' });
    }
  }

  /* ----- identity ----- */
  function tabIdentity(c, d) {
    return `<div class="grid cols-2">
      <div class="panel">
        <h3>Who are you, choom?</h3>
        <div class="grid cols-2">
          <label class="field">Handle<input data-bind="handle" value="${esc(c.handle)}" placeholder="e.g. Razor"></label>
          <label class="field">Real Name<input data-bind="name" value="${esc(c.name)}"></label>
          <label class="field">Age<input data-bind="age" value="${esc(c.age)}"></label>
          <label class="field">Pronouns<input data-bind="pronouns" value="${esc(c.pronouns)}"></label>
        </div>
      </div>
      <div class="panel">
        <h3>Role</h3>
        <div class="grid cols-2">
          <label class="field">Role<select data-bind="role" data-rerender="1">${D.ROLES.map(r => `<option value="${r.id}" ${r.id === c.role ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
          <label class="field">${esc(d.role.ability)} Rank<input type="number" min="1" max="10" data-bind="roleRank" value="${c.roleRank}"></label>
        </div>
        <p class="muted small" style="margin:8px 0 0"><b style="color:var(--yellow)">${esc(d.role.ability)}</b> — ${esc(d.role.desc)}</p>
      </div>
      <div class="panel">
        <h3>Creation Rules</h3>
        <label class="field">Method<select data-bind="creationMode" data-rerender="1">
          <option value="package" ${c.creationMode === 'package' ? 'selected' : ''}>Complete Package (${R.statPoints} stat / ${R.skillPoints} skill points, checks limits)</option>
          <option value="free" ${c.creationMode === 'free' ? 'selected' : ''}>Free entry (no limits — for advanced or Streetrat characters)</option>
        </select></label>
      </div>
      <div class="panel">
        <h3>Status</h3>
        <div class="grid cols-3">
          <label class="field">Current HP<input type="number" data-bind="hpCurrent" value="${d.hp}"></label>
          <label class="field">Eurobucks<input type="number" data-bind="money" value="${c.money}"></label>
          <label class="field">Improvement Pts<input type="number" data-bind="ip" value="${c.ip}"></label>
          <label class="field">Reputation<input type="number" data-bind="reputation" value="${c.reputation}"></label>
          <label class="field" title="Extra humanity lost (or regained as a negative number) outside of cyberware">Extra Hum. Loss<input type="number" data-bind="humanityExtra" value="${c.humanityExtra}"></label>
        </div>
      </div>
      <div class="panel" style="grid-column:1/-1">
        <h3>Notes</h3>
        <textarea data-bind="notes" rows="5" placeholder="Anything else…">${esc(c.notes)}</textarea>
      </div>
    </div>`;
  }

  /* ----- stats ----- */
  function tabStats(c, d) {
    return `<div class="panel">
      <div class="row"><h3 style="margin:0">Stats</h3><span class="spacer"></span>
        <span class="muted small">${c.creationMode === 'package' ? `Spend exactly ${R.statPoints} points, each ${R.statMin}–${R.statMax}.` : 'Free entry.'}</span></div>
      <div class="stat-grid" style="margin-top:10px">
        ${D.STATS.map(s => `<div class="stat-box">
          <div class="abbr">${s.id}</div><div class="full">${s.name}</div>
          <div class="ctrl">
            <button class="btn icon sm" data-a="stat-dec" data-stat="${s.id}">−</button>
            <input type="number" min="0" max="20" data-bind="stats.${s.id}" value="${c.stats[s.id]}">
            <button class="btn icon sm" data-a="stat-inc" data-stat="${s.id}">+</button>
          </div>
          <div class="note" data-statnote="${s.id}"></div>
          <button class="btn sm ghost" data-roll="stat:${s.id}" title="Roll ${s.name} + d10">🎲 Roll</button>
          ${s.id === 'EMP' ? `<div class="small muted">Current: <b data-d="empCur"></b></div>` : ''}
          ${s.id === 'MOVE' ? `<div class="small muted">Run ${c.stats.MOVE * 2}m/turn</div>` : ''}
        </div>`).join('')}
      </div>
      <p class="muted small" style="margin-bottom:0">HP = 10 + 5 × ⌈(BODY + WILL) ÷ 2⌉. Humanity = EMP × 10, minus Humanity Loss from cyberware. Current EMP drops 1 for every 10 Humanity lost.</p>
    </div>`;
  }

  /* ----- skills ----- */
  function tabSkills(c, d) {
    const cats = [...new Set(D.SKILLS.map(s => s.cat))];
    return `
      <div class="panel tight" style="margin-bottom:12px">
        <div class="row"><span class="muted small">• = basic skill (min ${R.basicSkillMin}). <span class="x2">x2</span> skills cost double. Max ${R.skillMaxAtCreation} at creation. Base = STAT + Level.</span>
        <span class="spacer"></span><input type="search" id="skill-filter" placeholder="Filter skills…" style="max-width:220px"></div>
      </div>
      <div class="grid cols-2" id="skill-groups">
        ${cats.map(cat => `<div class="panel skill-group" data-cat="${esc(cat)}"><h3>${esc(cat)}</h3>
          <table class="skill-table">${D.SKILLS.filter(s => s.cat === cat).map(s => `
            <tr class="${s.basic ? 'basic' : ''}" data-skillrow="${esc(s.name.toLowerCase())}">
              <td>${esc(s.name)}${s.x2 ? '<span class="x2">x2</span>' : ''}</td>
              <td class="stat">${s.stat} ${statFor(c, d, s.stat)}</td>
              <td class="lvl"><input type="number" min="0" max="10" data-skill="${esc(s.name)}" value="${c.skills[s.name] || 0}"></td>
              <td class="base" data-skillbase="${esc(s.name)}"></td>
              <td class="roll"><button class="btn icon sm ghost" data-roll="skill:${esc(s.name)}" title="Roll ${esc(s.name)}">🎲</button></td>
            </tr>`).join('')}
          </table></div>`).join('')}
        <div class="panel skill-group" data-cat="custom">
          <div class="row"><h3 style="margin:0">Extra / Specialized</h3><span class="spacer"></span><button class="btn sm" data-a="add-skill">+ Add</button></div>
          <p class="muted small">Extra languages, Local Expert areas, Science fields, instruments, Martial Arts forms…</p>
          <table class="skill-table">${c.customSkills.map((s, i) => `<tr>
            <td><input data-bind="customSkills.${i}.name" value="${esc(s.name)}" placeholder="Language (Spanish)"></td>
            <td class="stat"><select data-bind="customSkills.${i}.stat">${D.STATS.map(st => `<option ${st.id === s.stat ? 'selected' : ''}>${st.id}</option>`).join('')}</select></td>
            <td class="lvl"><input type="number" min="0" max="10" data-bind="customSkills.${i}.level" value="${s.level || 0}"></td>
            <td><label class="check small" title="Costs double"><input type="checkbox" data-bind="customSkills.${i}.x2" ${s.x2 ? 'checked' : ''}>x2</label></td>
            <td class="base" data-customskillbase="${i}"></td>
            <td><button class="btn icon sm ghost" data-roll="skill:${esc(s.name)}" title="Roll" ${s.name ? '' : 'disabled'}>🎲</button></td>
            <td><button class="btn icon sm danger" data-a="del-skill" data-i="${i}">×</button></td></tr>`).join('')}
          </table>
        </div>
      </div>`;
  }

  /* ----- cyberware ----- */
  function optionLabel(item) {
    const slots = item.slots == null ? 1 : item.slots;
    if (item.unset && item.missing.includes('cost')) return `${item.name} — Mission Kit (needs ${item.missing.join(', ')})`;
    if (item.unset) return `${item.name} — ${item.cost.toLocaleString()}eb, HL ${item.hl} (needs ${item.missing.join(', ')})`;
    return `${item.homebrew ? '★ ' : ''}${item.name} — ${item.cost.toLocaleString()}eb, HL ${item.hl}${item.cat !== 'foundation' && item.cat !== 'chip' && slots !== 1 ? `, ${slots} slots` : ''}`;
  }

  function bodySvg(c) {
    const on = body => D.CYBER_ZONES.some(z => z.body === body && (zoneState(c, z.id).foundation || zoneState(c, z.id).options.length));
    const zoneFor = { head: 'neural', eyes: 'eyeL', ears: 'audio', torso: 'internal', armL: 'armL', armR: 'armR', legL: 'legL', legR: 'legR' };
    const p = (body, shape) => shape.replace('<', `<`).replace(/^<(\w+)/, `<$1 class="bz ${on(body) ? 'on' : ''}" data-jump="${zoneFor[body]}"`);
    // Figure faces the viewer: the character's left arm is on the viewer's right.
    return `<svg viewBox="0 0 200 300" aria-label="Body map — tap a part to jump to it">
      ${p('head', '<circle cx="100" cy="38" r="26"/>')}
      ${p('eyes', '<rect x="84" y="30" width="32" height="10" rx="5"/>')}
      ${p('ears', '<rect x="70" y="32" width="60" height="8" rx="4" opacity=".7"/>')}
      ${p('torso', '<rect x="68" y="70" width="64" height="100" rx="14"/>')}
      ${p('armR', '<rect x="38" y="74" width="24" height="98" rx="11"/>')}
      ${p('armL', '<rect x="138" y="74" width="24" height="98" rx="11"/>')}
      ${p('legR', '<rect x="70" y="176" width="27" height="112" rx="12"/>')}
      ${p('legL', '<rect x="103" y="176" width="27" height="112" rx="12"/>')}
      <text x="50" y="190" fill="#8c94a6" font-size="10" text-anchor="middle">R</text>
      <text x="150" y="190" fill="#8c94a6" font-size="10" text-anchor="middle">L</text>
    </svg>`;
  }

  function slotRow(zone, idx, entry, free) {
    const info = cyberInfo(entry);
    const items = CPR.cyber.forCat(zone.cat);
    const fits = i => entry || (i.slots == null ? 1 : i.slots) <= free || zone.needs;
    const cur = entry ? entry.id : '';
    return `<div class="cw-slot">
      <select data-cw="${zone.id}" data-slot="${idx}">
        <option value="">${entry ? '— remove —' : '+ Add ' + (zone.cat === 'chip' ? 'chip' : 'cyberware') + '…'}</option>
        ${items.map(i => `<option value="${i.id}" ${i.id === cur ? 'selected' : ''} ${fits(i) || i.id === cur ? '' : 'disabled'}>${esc(optionLabel(i))}</option>`).join('')}
        <option value="custom" ${cur === 'custom' ? 'selected' : ''}>Custom…</option>
      </select>
      ${entry ? `<div class="slot-meta">HL <input type="number" style="width:54px;min-height:30px;padding:2px 4px" data-bind="cyber.zones.${zone.id}.options.${idx}.hl" value="${info.hl}">
        ${info.hlDice && info.hlDice !== '0' ? `<button class="btn icon sm" title="Roll ${esc(info.hlDice)} Humanity Loss" data-a="roll-hl" data-zone="${zone.id}" data-slot="${idx}">🎲</button>` : ''}</div>` : '<span></span>'}
      ${entry && entry.id === 'custom' ? `<div class="cw-custom">
        <input data-bind="cyber.zones.${zone.id}.options.${idx}.name" value="${esc(entry.name)}" placeholder="Name">
        <input type="number" data-bind="cyber.zones.${zone.id}.options.${idx}.cost" value="${entry.cost || 0}" placeholder="Cost" title="Cost (eb)">
        <input type="number" data-bind="cyber.zones.${zone.id}.options.${idx}.slots" value="${entry.slots == null ? 1 : entry.slots}" placeholder="Slots" title="Slots used"></div>`
        : entry ? `<div class="desc">${info.fx && info.fx.length ? `<b style="color:var(--yellow)">${esc(info.fx.join(' · '))}</b> — ` : ''}${esc(info.details || info.desc || '')}</div>` : ''}
    </div>`;
  }

  /* Install / remove helpers shared by both cyberware views. */
  function setFoundation(c, zid, id) {
    const z = zoneState(c, zid);
    if (id) { z.foundation = { id, hl: defaultHl(D.cyberById[id]) }; return; }
    if (z.options.length) U.toast('Options in that body part were removed too');
    z.foundation = null; z.options = [];
    if (zid === 'neural') zoneState(c, 'chips').options = [];
  }

  // Humanity Loss saved on install. null = follow the table, so values entered later still apply.
  const defaultHl = item => (item.missing && item.missing.includes('Humanity Loss') ? null : item.hl);

  // id: item id, 'custom', or null to remove. Pass a custom entry object as `custom`.
  function setOption(c, zid, i, id, custom) {
    const z = zoneState(c, zid);
    if (!id) z.options.splice(i, 1);
    else if (id === 'custom') z.options[i] = custom || { id: 'custom', name: '', cost: 0, hl: 0, slots: 1 };
    else {
      const item = CPR.cyber.get(id);
      z.options[i] = { id, hl: defaultHl(item) };
      if (item.homebrew) z.options[i].hb = CPR.cyber.snapshot(id); // travels with the character file
    }
    // Removing a Chipware Socket drops chips that no longer have a socket.
    if (zid === 'neural') {
      const chips = zoneState(c, 'chips');
      const cap = zoneCapacity(c, D.CYBER_ZONES.find(x => x.id === 'chips'));
      if (chips.options.length > cap) { chips.options.length = cap; U.toast('Removed chips without a socket'); }
    }
  }

  function tabCyber(c, d) {
    return `<div class="rd-switch no-print">
        <button class="${cyberView === 'ripper' ? 'on' : ''}" data-a="cw-view" data-v="ripper">◢ Ripperdoc</button>
        <button class="${cyberView === 'list' ? 'on' : ''}" data-a="cw-view" data-v="list">☰ List / dropdowns</button>
      </div>` + (cyberView === 'ripper' ? CPR.ripperdoc.render(c, d) : tabCyberList(c, d));
  }

  function tabCyberList(c, d) {
    const zones = D.CYBER_ZONES.map(zone => {
      const z = zoneState(c, zone.id);
      const cap = zoneCapacity(c, zone), used = zoneUsed(c, zone), free = cap - used;
      const found = zone.foundation ? D.cyberById[zone.foundation] : null;
      const installed = !!(z.foundation || (!zone.foundation && z.options.length));
      let inner = '';
      if (found) {
        const fi = cyberInfo(z.foundation);
        inner += `<div class="cw-slot cw-foundation">
          <select data-cw-found="${zone.id}">
            <option value="">Natural (no ${esc(found.name.toLowerCase())})</option>
            <option value="${found.id}" ${z.foundation ? 'selected' : ''}>${esc(optionLabel(found))}</option>
          </select>
          ${z.foundation ? `<div class="slot-meta">HL <input type="number" style="width:54px;min-height:30px;padding:2px 4px" data-bind="cyber.zones.${zone.id}.foundation.hl" value="${fi.hl}">
            <button class="btn icon sm" title="Roll ${esc(fi.hlDice)} Humanity Loss" data-a="roll-hl" data-zone="${zone.id}" data-slot="f">🎲</button></div>` : '<span></span>'}
        </div>`;
      }
      if (zone.foundation && !z.foundation) {
        inner += `<p class="muted small" style="margin:8px 0 0">Install a ${esc(found.name)} to unlock ${zone.slots} option slots.</p>`;
      } else if (zone.needs && cap === 0 && !z.options.length) {
        inner += `<p class="muted small" style="margin:0">${esc(zone.note)}</p>`;
      } else {
        z.options.forEach((o, i) => (inner += slotRow(zone, i, o, free)));
        if (free > 0) inner += slotRow(zone, z.options.length, null, free);
      }
      const capLabel = zone.foundation || zone.needs ? `${used}/${cap} slots` : `${z.options.length}/${zone.slots}`;
      const over = used > cap;
      return `<div class="cw-zone ${installed ? 'installed' : ''}" id="cwz-${zone.id}">
        <div class="zone-head"><h3>${esc(zone.label)}</h3><span class="spacer"></span>
          ${cap || z.options.length ? `<span class="badge ${over ? 'bad' : free === 0 ? 'cyan' : ''}">${capLabel}</span>` : ''}</div>
        ${inner}</div>`;
    }).join('');

    return `<div class="grid" style="grid-template-columns:minmax(0,1fr)">
      <div class="panel">
        <div class="grid cols-2" style="align-items:center">
          <div class="body-map">${bodySvg(c)}</div>
          <div>
            <h3>Chrome Summary</h3>
            <div class="row"><span class="badge cyan">${d.cyber.length} pieces</span>
              <span class="badge">Cost <b data-d="cyberCost"></b> eb</span>
              <span class="badge warn">Humanity Loss ${d.hlCyber}</span>
              <span class="badge ${d.humanity <= 0 ? 'bad' : d.humanity < 20 ? 'warn' : 'ok'}">Humanity ${d.humanity}/${d.humanityMax}</span>
              <span class="badge">EMP ${c.stats.EMP} → ${d.empCur}</span></div>
            <p class="muted small">Pick a foundation (Cybereye, Cyberarm…) for each body part, then fill its option slots from the dropdowns.
              Humanity Loss uses the average by default — tap 🎲 to roll it instead, or type your own number.</p>
            <div class="row"><button class="btn sm" data-a="roll-all-hl">🎲 Roll all HL</button><button class="btn sm" data-a="avg-all-hl">Reset all HL to average</button></div>
          </div>
        </div>
      </div>
      <div class="cw-zones">${zones}</div>
    </div>`;
  }

  /* ----- gear ----- */
  function armorSelect(loc, c) {
    const a = c.armor[loc];
    const known = D.ARMOR.some(x => x.name === a.name);
    return `<select data-armor="${loc}">${D.ARMOR.map(x => `<option value="${esc(x.name)}" ${x.name === a.name ? 'selected' : ''}>${esc(x.name)}${x.sp ? ` — SP ${x.sp}, ${x.cost.toLocaleString()}eb` : ''}</option>`).join('')}
      <option value="__custom" ${known ? '' : 'selected'}>Custom…</option></select>`;
  }

  function tabGear(c, d) {
    const weaponCost = c.weapons.reduce((a, w) => a + (Number(w.cost) || 0), 0);
    const armorCost = (Number(c.armor.head.cost) || 0) + (Number(c.armor.body.cost) || 0);
    return `<div class="grid cols-2">
      <div class="panel">
        <h3>Armor</h3>
        ${['head', 'body'].map(loc => {
          const a = c.armor[loc];
          const known = D.ARMOR.some(x => x.name === a.name);
          const pen = (D.ARMOR.find(x => x.name === a.name) || {}).penalty || 0;
          return `<div class="grid armor-row" style="grid-template-columns:minmax(0,1fr) 64px 72px 80px;gap:6px;margin-bottom:8px;align-items:end">
            <label class="field">${loc === 'head' ? 'Head' : 'Body'}${armorSelect(loc, c)}</label>
            <label class="field">SP<input type="number" data-bind="armor.${loc}.sp" value="${a.sp}"></label>
            <label class="field">Current<input type="number" data-bind="armor.${loc}.spCurrent" value="${a.spCurrent}"></label>
            <label class="field">Cost (eb)<input type="number" min="0" data-bind="armor.${loc}.cost" value="${a.cost || 0}"></label>
            ${!known ? `<input data-bind="armor.${loc}.name" value="${esc(a.name)}" placeholder="Armor name" style="grid-column:1/-1">` : ''}
            ${pen ? `<div class="small" style="grid-column:1/-1;color:var(--orange)">−${pen} to REF, DEX and MOVE</div>` : ''}
          </div>`;
        }).join('')}
        ${d.skinSp ? `<p class="small muted">Cyberware armor gives SP ${d.skinSp} (doesn't stack with worn armor — the higher one applies).</p>` : ''}
        <button class="btn sm" data-a="repair-armor">Repair armor to full SP</button>
      </div>
      <div class="panel">
        <h3>Money</h3>
        <label class="field">Eurobucks<input type="number" data-bind="money" value="${c.money}"></label>
        <label class="check small" style="margin-top:8px"><input type="checkbox" id="pay-gear" ${S.read('ui.payChrome', false) ? 'checked' : ''}> Pay from eurobucks when buying weapons, armor & chrome</label>
        <table class="gear-value">
          <tr><td>Weapons</td><td>${weaponCost.toLocaleString()}eb</td></tr>
          <tr><td>Armor</td><td>${armorCost.toLocaleString()}eb</td></tr>
          <tr><td>Cyberware</td><td><span data-d="cyberCost"></span>eb</td></tr>
          <tr class="total"><td>Total value</td><td>${(weaponCost + armorCost + d.cyberCost).toLocaleString()}eb</td></tr>
        </table>
        <p class="muted small">Complete Package starting funds: ${R.startingMoney.toLocaleString()}eb for weapons, armor, cyberware & gear. Prices are for standard-quality items; edit a cost for anything better, worse or second-hand.</p>
      </div>
      <div class="panel" style="grid-column:1/-1">
        <div class="row"><h3 style="margin:0">Weapons</h3><span class="spacer"></span>
          <select id="weapon-pick" style="max-width:220px"><option value="">+ Add weapon…</option>${D.WEAPONS.map((w, i) => `<option value="${i}">${esc(w.name)} (${w.damage}, ${w.cost.toLocaleString()}eb)</option>`).join('')}<option value="custom">Custom weapon</option></select></div>
        <div class="scroll-x"><table class="list-table" style="margin-top:8px;min-width:980px">
          <tr><th>Name</th><th>Skill</th><th>Type</th><th>Dmg</th><th title="Replaces the base damage dice, e.g. 4d6">Override</th><th title="Flat amount added to the damage roll">Modifier</th><th>ROF</th><th>Mag</th><th title="Price paid (standard quality by default)">Cost</th><th>Base</th><th>Notes</th><th></th></tr>
          ${c.weapons.map((w, i) => {
            const sk = D.SKILLS.find(s => s.name === w.skill);
            const base = sk ? statFor(c, d, sk.stat) + (c.skills[sk.name] || 0) : '';
            return `<tr>
            <td><input data-bind="weapons.${i}.name" value="${esc(w.name)}"></td>
            <td><select data-bind="weapons.${i}.skill" data-rerender="1">${D.SKILLS.filter(s => ['Ranged Weapon', 'Fighting'].includes(s.cat)).map(s => `<option ${s.name === w.skill ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></td>
            <td style="width:96px"><select data-bind="weapons.${i}.wtype" title="Edgerunners Mission Kit weapon type">${D.WEAPON_TYPES.map(t => `<option value="${t.id}" ${t.id === (w.wtype || '') ? 'selected' : ''}>${t.name}</option>`).join('')}</select></td>
            <td style="width:70px"><input data-bind="weapons.${i}.damage" value="${esc(w.damage)}"></td>
            <td style="width:80px"><input data-bind="weapons.${i}.dmgOverride" value="${esc(w.dmgOverride || '')}" placeholder="—" title="Replaces the base damage dice, e.g. 4d6"></td>
            <td style="width:70px"><input type="number" data-bind="weapons.${i}.dmgMod" value="${Number(w.dmgMod) || 0}" title="Flat amount added to the damage roll"></td>
            <td style="width:56px"><input type="number" data-bind="weapons.${i}.rof" value="${w.rof}"></td>
            <td style="width:64px"><input type="number" data-bind="weapons.${i}.mag" value="${w.mag}"></td>
            <td style="width:76px"><input type="number" min="0" data-bind="weapons.${i}.cost" value="${Number(w.cost) || 0}"></td>
            <td style="width:46px" class="mono"><b style="color:var(--yellow)">${base}</b></td>
            <td><input data-bind="weapons.${i}.notes" value="${esc(w.notes || '')}"></td>
            <td style="width:40px"><button class="btn icon sm danger" data-a="del-weapon" data-i="${i}">×</button></td></tr>`;
          }).join('')}
        </table></div>
        ${c.weapons.length ? '' : '<p class="muted small">No weapons yet.</p>'}
      </div>
      <div class="panel" style="grid-column:1/-1">
        <div class="row"><h3 style="margin:0">Gear</h3><span class="spacer"></span><button class="btn sm" data-a="add-gear">+ Add item</button></div>
        <table class="list-table" style="margin-top:8px">
          <tr><th>Item</th><th style="width:70px">Qty</th><th>Notes</th><th></th></tr>
          ${c.gear.map((g, i) => `<tr>
            <td><input data-bind="gear.${i}.name" value="${esc(g.name)}"></td>
            <td><input type="number" data-bind="gear.${i}.qty" value="${g.qty}"></td>
            <td><input data-bind="gear.${i}.notes" value="${esc(g.notes || '')}"></td>
            <td style="width:40px"><button class="btn icon sm danger" data-a="del-gear" data-i="${i}">×</button></td></tr>`).join('')}
        </table>
      </div>
    </div>`;
  }

  /* ----- lifepath ----- */
  function tabLifepath(c) {
    return `<div class="panel"><h3>Lifepath</h3>
      <p class="muted small">Roll on the Lifepath tables in your rulebook (or make it up) and record the results here.</p>
      <div class="grid cols-2">${D.LIFEPATH_FIELDS.map(([k, l]) => `<label class="field">${esc(l)}
        <textarea data-bind="lifepath.${k}" rows="2">${esc(c.lifepath[k] || '')}</textarea></label>`).join('')}</div></div>`;
  }

  /* ----- sheet / export ----- */
  function sheetHtml(c, d) {
    const skillRows = D.SKILLS.filter(s => (c.skills[s.name] || 0) > 0)
      .map(s => ({ name: s.name, stat: s.stat, lvl: c.skills[s.name], base: statFor(c, d, s.stat) + c.skills[s.name] }))
      .concat(c.customSkills.filter(s => s.name).map(s => ({ name: s.name, stat: s.stat, lvl: Number(s.level) || 0, base: statFor(c, d, s.stat) + (Number(s.level) || 0) })));
    const lp = D.LIFEPATH_FIELDS.filter(([k]) => c.lifepath[k]);
    return `<div class="sheet">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div><h1>${esc(c.handle || 'Unnamed')}</h1><div>${esc(c.name)}${c.age ? ' · Age ' + esc(c.age) : ''}${c.pronouns ? ' · ' + esc(c.pronouns) : ''}</div></div>
        <div style="text-align:right"><b>${esc(d.role.name)}</b><br>${esc(d.role.ability)} Rank ${c.roleRank}</div>
      </div>
      <h4>Stats</h4>
      <div class="stats">${D.STATS.map(s => `<div>${s.id}<b>${s.id === 'EMP' ? `${d.empCur}/${c.stats.EMP}` : c.stats[s.id]}</b></div>`).join('')}</div>
      <div class="cols">
        <div>
          <h4>Health</h4>
          <table><tr><td>Hit Points</td><td>${d.hp} / ${d.hpMax}</td></tr>
            <tr><td>Seriously Wounded</td><td>${d.seriously}</td></tr><tr><td>Death Save</td><td>${d.deathSave}</td></tr>
            <tr><td>Humanity</td><td>${d.humanity} / ${d.humanityMax}</td></tr></table>
          <h4>Armor</h4>
          <table><tr><th>Loc</th><th>Armor</th><th>SP</th></tr>
            <tr><td>Head</td><td>${esc(c.armor.head.name)}</td><td>${c.armor.head.spCurrent}/${c.armor.head.sp}</td></tr>
            <tr><td>Body</td><td>${esc(c.armor.body.name)}</td><td>${c.armor.body.spCurrent}/${c.armor.body.sp}</td></tr>
            ${d.skinSp ? `<tr><td colspan="2">Cyberware armor</td><td>${d.skinSp}</td></tr>` : ''}</table>
          <h4>Weapons</h4>
          <table><tr><th>Weapon</th><th>Dmg</th><th>ROF</th><th>Mag</th><th>Notes</th></tr>
            ${c.weapons.map(w => `<tr><td>${esc(w.name)}${w.wtype ? ` (${esc(wtypeName(w.wtype))})` : ''}</td><td>${esc(effDmg(w).label)}</td><td>${w.rof}</td><td>${w.mag || '—'}</td><td>${esc(w.notes || '')}</td></tr>`).join('')}
            ${cyberWeaponsOf(d).map(x => `<tr><td>${esc(x.info.name)} (cyber)</td><td>${esc(x.w.damage)}</td><td>${x.w.rof}</td><td>—</td><td>${esc(x.w.skill)}</td></tr>`).join('')}
            ${c.weapons.length || cyberWeaponsOf(d).length ? '' : '<tr><td colspan="5">—</td></tr>'}</table>
          ${c.deck || (c.programs || []).length ? `<h4>Cyberdeck</h4><table><tr><td>${esc(deckOf(c).name)}</td><td>${(c.programs || []).length}/${deckOf(c).slots} slots</td></tr>${programsOf(c).map(pg => `<tr><td>${esc(pg.name)} (${esc(pg.kind || pg.cls)})</td><td>${pg.cls === 'Attacker' ? 'ATK ' + pg.atk : 'REZ ' + pg.cur + '/' + pg.rez}${pg.damage ? ' · ' + pg.damage : ''}</td></tr>`).join('')}</table>` : ''}
          ${quickhacksOf(c).length ? `<h4>Quickhacks</h4><table>${quickhacksOf(c).map(q => `<tr><td>${esc(q.name)}</td><td>${q.dv ? 'DV ' + esc(q.dv) : ''}${q.damage ? ' · ' + esc(q.damage) : ''}</td><td>${esc(q.effect)}</td></tr>`).join('')}</table>` : ''}
        </div>
        <div>
          <h4>Skills</h4>
          <table><tr><th>Skill</th><th>Stat</th><th>Lvl</th><th>Base</th></tr>
            ${skillRows.map(s => `<tr><td>${esc(s.name)}</td><td>${s.stat}</td><td>${s.lvl}</td><td><b>${s.base}</b></td></tr>`).join('')}</table>
        </div>
        <div>
          <h4>Cyberware</h4>
          <table><tr><th>Location</th><th>Cyberware</th><th>HL</th></tr>
            ${d.cyber.map(x => `<tr><td>${esc(x.zone.label.split(' — ')[0])}</td><td>${esc(x.info.name)}</td><td>${x.info.hl}</td></tr>`).join('') || '<tr><td colspan="3">— all meat —</td></tr>'}</table>
          <h4>Gear</h4>
          <table>${c.gear.map(g => `<tr><td>${esc(g.name)}</td><td>×${g.qty}</td><td>${esc(g.notes || '')}</td></tr>`).join('') || '<tr><td>—</td></tr>'}</table>
          <h4>Resources</h4>
          <table><tr><td>Eurobucks</td><td>${Number(c.money).toLocaleString()}eb</td></tr><tr><td>Gear & chrome value</td><td>${gearValue(c, d).toLocaleString()}eb</td></tr><tr><td>IP</td><td>${c.ip}</td></tr><tr><td>Reputation</td><td>${c.reputation}</td></tr></table>
        </div>
      </div>
      ${lp.length ? `<h4>Lifepath</h4><table>${lp.map(([k, l]) => `<tr><td style="width:35%">${esc(l)}</td><td>${esc(c.lifepath[k])}</td></tr>`).join('')}</table>` : ''}
      ${c.notes ? `<h4>Notes</h4><div style="white-space:pre-wrap">${esc(c.notes)}</div>` : ''}
      <div class="legal-line">Made with RED Kit. RED Kit is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.</div>
    </div>`;
  }

  const gearValue = (c, d) => c.weapons.reduce((a, w) => a + (Number(w.cost) || 0), 0)
    + (Number(c.armor.head.cost) || 0) + (Number(c.armor.body.cost) || 0) + d.cyberCost;

  function sheetText(c, d) {
    const L = [];
    L.push(`${c.handle || 'Unnamed'}${c.name ? ' (' + c.name + ')' : ''} — ${d.role.name}, ${d.role.ability} ${c.roleRank}`);
    L.push(D.STATS.map(s => `${s.id} ${s.id === 'EMP' ? d.empCur + '/' + c.stats.EMP : c.stats[s.id]}`).join('  '));
    L.push(`HP ${d.hp}/${d.hpMax} | Seriously Wounded ${d.seriously} | Death Save ${d.deathSave} | Humanity ${d.humanity}/${d.humanityMax}`);
    L.push(`Armor: Head ${c.armor.head.name} SP${c.armor.head.spCurrent} | Body ${c.armor.body.name} SP${c.armor.body.spCurrent}`);
    L.push('', 'SKILLS');
    D.SKILLS.filter(s => (c.skills[s.name] || 0) > 0).forEach(s => L.push(`  ${s.name} (${s.stat}) ${c.skills[s.name]} → ${statFor(c, d, s.stat) + c.skills[s.name]}`));
    c.customSkills.filter(s => s.name).forEach(s => L.push(`  ${s.name} (${s.stat}) ${s.level} → ${statFor(c, d, s.stat) + (Number(s.level) || 0)}`));
    L.push('', 'WEAPONS');
    c.weapons.forEach(w => L.push(`  ${w.name}${w.wtype ? ' [' + wtypeName(w.wtype) + ']' : ''}: ${effDmg(w).label}, ROF ${w.rof}${w.mag ? ', Mag ' + w.mag : ''}${w.notes ? ' — ' + w.notes : ''}`));
    cyberWeaponsOf(d).forEach(x => L.push(`  ${x.info.name} (cyberware): ${x.w.damage}, ROF ${x.w.rof}`));
    if (c.deck || (c.programs || []).length) {
      L.push('', `CYBERDECK: ${deckOf(c).name} (${(c.programs || []).length}/${deckOf(c).slots} slots)`);
      programsOf(c).forEach(pg => L.push(`  ${pg.name} [${pg.kind || pg.cls}] ${pg.cls === 'Attacker' ? 'ATK ' + pg.atk : 'REZ ' + pg.cur + '/' + pg.rez}${pg.damage ? ' ' + pg.damage : ''} — ${pg.text}`));
    }
    if (quickhacksOf(c).length) { L.push('', 'QUICKHACKS'); quickhacksOf(c).forEach(q => L.push(`  ${q.name}${q.dv ? ' (DV ' + q.dv + ')' : ''}${q.damage ? ' ' + q.damage : ''}${q.effect ? ' — ' + q.effect : ''}`)); }
    L.push('', 'CYBERWARE');
    d.cyber.forEach(x => L.push(`  [${x.zone.label.split(' — ')[0]}] ${x.info.name} (HL ${x.info.hl})`));
    L.push('', 'GEAR');
    c.gear.forEach(g => L.push(`  ${g.name} x${g.qty}${g.notes ? ' — ' + g.notes : ''}`));
    L.push('', `Eurobucks ${c.money} | Gear & chrome value ${gearValue(c, d)}eb | IP ${c.ip} | Reputation ${c.reputation}`);
    D.LIFEPATH_FIELDS.filter(([k]) => c.lifepath[k]).forEach(([k, l], i) => { if (!i) L.push('', 'LIFEPATH'); L.push(`  ${l}: ${c.lifepath[k]}`); });
    if (c.notes) L.push('', 'NOTES', c.notes);
    L.push('', '— Made with RED Kit. RED Kit is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.');
    return L.join('\n');
  }

  function tabSheet(c, d) {
    return `<div class="panel no-print" style="margin-bottom:12px">
        <h3>Export</h3>
        <div class="row">
          <button class="btn primary" data-a="export-json">⇩ Character file (.json)</button>
          <button class="btn" data-a="print">🖶 Print / Save as PDF</button>
          <button class="btn" data-a="export-txt">⇩ Plain text (.txt)</button>
          <button class="btn" data-a="copy-txt">⧉ Copy as text</button>
        </div>
        <p class="muted small" style="margin-bottom:0">The .json file can be imported back into RED Kit on any device (Characters → Import). Use Print → "Save as PDF" for a printable sheet.</p>
      </div>
      ${sheetHtml(c, d)}`;
  }

  /* ---------------- events ---------------- */
  function onInput(e) {
    const t = e.target;
    if (!current) return;
    if (t.id === 'play-skill-filter') {
      const q = t.value.trim().toLowerCase();
      root.querySelectorAll('[data-playskill]').forEach(r => (r.style.display = !q || r.dataset.playskill.includes(q) ? '' : 'none'));
      return;
    }
    if (t.id === 'skill-filter') {
      const q = t.value.trim().toLowerCase();
      root.querySelectorAll('[data-skillrow]').forEach(r => (r.style.display = !q || r.dataset.skillrow.includes(q) ? '' : 'none'));
      return;
    }
    if (t.dataset.skill) {
      current.skills[t.dataset.skill] = Math.max(0, parseInt(t.value, 10) || 0);
      save(); refreshDerived(); return;
    }
    if (t.dataset.bind) {
      let v;
      if (t.type === 'checkbox') v = t.checked;
      else if (t.type === 'number') v = t.value === '' ? 0 : Number(t.value);
      else v = t.value;
      setPath(current, t.dataset.bind, v);
      save();
      if (t.dataset.rerender && e.type === 'change') renderTab(); else refreshDerived();
    }
  }

  // Deduct a purchase from eurobucks when the "pay" option is on (shared with the Ripperdoc).
  function pay(cost, name) {
    if (!cost) return;
    if (!S.read('ui.payChrome', false)) { U.toast(`${name} added (${cost.toLocaleString()}eb, not paid)`); return; }
    current.money = (Number(current.money) || 0) - cost;
    U.toast(`Bought ${name} for ${cost.toLocaleString()}eb${current.money < 0 ? ' (eurobucks now negative)' : ''}`);
  }

  function onChange(e) {
    const t = e.target;
    if (!current) return;
    if (t.dataset.bind) return onInput(e);

    if (t.dataset.cwFound) {
      setFoundation(current, t.dataset.cwFound, t.value || null);
      saveNow(); return renderTab();
    }
    if (t.dataset.cw) {
      setOption(current, t.dataset.cw, +t.dataset.slot, t.value || null);
      saveNow(); return renderTab();
    }
    if (t.id === 'pay-gear') { S.write('ui.payChrome', t.checked); return; }
    if (t.dataset.deck !== undefined) {
      const k = D.CYBERDECKS.find(x => x.id === t.value) || D.CYBERDECKS[0];
      current.deck = k.id;
      pay(k.cost, k.name);
      if ((current.programs || []).length > k.slots) U.toast(`Only ${k.slots} program slots: remove some programs`);
      saveNow(); return renderTab();
    }
    if (t.dataset.armor) {
      const loc = t.dataset.armor;
      if (t.value === '__custom') current.armor[loc] = { name: 'Custom armor', sp: current.armor[loc].sp, spCurrent: current.armor[loc].spCurrent, cost: 0 };
      else {
        const a = D.ARMOR.find(x => x.name === t.value);
        current.armor[loc] = { name: a.name, sp: a.sp, spCurrent: a.sp, cost: a.cost };
        pay(a.cost, a.name);
      }
      saveNow(); return renderTab();
    }
    if (t.id === 'weapon-pick') {
      if (t.value === 'custom') current.weapons.push({ name: 'New weapon', skill: 'Handgun', damage: '2d6', rof: 1, mag: 0, notes: '', cost: 0 });
      else if (t.value !== '') {
        const w = D.WEAPONS[+t.value];
        current.weapons.push({ name: w.name, skill: w.skill, damage: w.damage, rof: w.rof, mag: w.mag, notes: w.notes || '', cost: w.cost });
        pay(w.cost, w.name);
      }
      saveNow(); return renderTab();
    }
  }

  function rollHL(entry) {
    const info = cyberInfo(entry);
    const dice = info.hlDice || '0';
    entry.hl = U.roll(dice).total;
  }

  function onClick(e) {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn && current) { saveNow(); tab = tabBtn.dataset.tab; return renderTab(); }

    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const el = root.querySelector('#cwz-' + jump.dataset.jump);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.animate([{ boxShadow: '0 0 0 2px #f7e21b' }, { boxShadow: '0 0 0 0 transparent' }], 900); }
      return;
    }

    const openEl = e.target.closest('[data-open]');
    if (openEl) { tab = 'play'; return open(openEl.dataset.open); }

    const rollEl = e.target.closest('[data-roll]');
    if (rollEl && current) { saveNow(); return doRoll(rollEl.dataset.roll); }

    if (current && CPR.ripperdoc.onClick(e)) return;

    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a, c = current;
    switch (a) {
      case 'cw-view': cyberView = b.dataset.v; S.write('ui.cyberView', cyberView); renderTab(); break;
      case 'play-skills': playAllSkills = b.dataset.v === '1'; renderTab(); break;
      case 'qh-toggle': toggleQuickhack(b.dataset.id); break;
      case 'pg-add': {
        const p = D.programById[b.dataset.id];
        if (!p) break;
        const deck = deckOf(c);
        if ((c.programs || []).length >= deck.slots) { U.toast(deck.slots ? 'Your cyberdeck is full' : 'Pick a cyberdeck first'); break; }
        c.programs = (c.programs || []).concat({ id: p.id, rez: p.rez });
        pay(p.cost, p.name);
        saveNow(); renderTab(); break;
      }
      case 'pg-remove': c.programs.splice(+b.dataset.i, 1); saveNow(); renderTab(); break;
      case 'pg-rez': {
        const pg = c.programs[+b.dataset.i], max = D.programById[pg.id].rez;
        pg.rez = Math.max(0, Math.min(max, pg.rez + Number(b.dataset.d)));
        saveNow(); renderTab(); break;
      }
      case 'pg-rez-all': c.programs.forEach(pg => { pg.rez = D.programById[pg.id].rez; }); saveNow(); renderTab(); break;
      case 'play-hp': {
        const d = derive(c);
        const amt = Math.max(0, parseInt(root.querySelector('#play-hp-amt').value, 10) || 0);
        lastHpAmt = amt || 1;
        c.hpCurrent = Math.min(d.hpMax, d.hp + amt * Number(b.dataset.dir));
        if (c.hpCurrent > 0) c.deathPenalty = 0;
        CPR.combat.syncHp(c.id, c.hpCurrent);
        saveNow(); renderTab(); break;
      }
      case 'sp-dec': {
        const a = c.armor[b.dataset.loc];
        if (a.spCurrent > 0) a.spCurrent--;
        else U.toast('Worn armor is already at 0 (cyberware armor repairs itself)');
        saveNow(); renderTab(); break;
      }
      case 'reload': {
        const w = c.weapons[+b.dataset.i];
        w.ammo = Number(w.mag) || 0;
        U.toast(`${w.name} reloaded (${w.ammo})`);
        saveNow(); renderTab(); break;
      }
      case 'new': {
        const nc = blank(); S.put(KEY, nc); tab = 'identity'; open(nc.id); break;
      }
      case 'import': importFile(); break;
      case 'export-all': U.saveFile('redkit_characters.json', JSON.stringify({ app: 'RED Kit', characters: S.list(KEY) }, null, 2)); break;
      case 'back': saveNow(); renderList(); break;
      case 'delete':
        U.confirm('Delete character?', `${c.handle || 'This character'} will be removed from this device. Export it first if you want a backup.`, 'Delete', () => {
          S.remove(KEY, c.id); renderList(); U.toast('Character deleted');
        });
        break;
      case 'dup': {
        saveNow();
        const copy = JSON.parse(JSON.stringify(c));
        copy.id = S.uid('chr'); copy.handle = (c.handle || 'Unnamed') + ' (copy)';
        S.put(KEY, copy); open(copy.id); U.toast('Duplicated'); break;
      }
      case 'to-combat': saveNow(); CPR.combat.addCharacter(c); U.toast(`${c.handle || 'Character'} added to combat`); break;
      case 'stat-inc': case 'stat-dec': {
        const s = b.dataset.stat;
        c.stats[s] = Math.max(0, (c.stats[s] || 0) + (a === 'stat-inc' ? 1 : -1));
        root.querySelector(`[data-bind="stats.${s}"]`).value = c.stats[s];
        save(); refreshDerived(); break;
      }
      case 'add-skill': c.customSkills.push({ name: '', stat: 'INT', level: 0, x2: false }); saveNow(); renderTab(); break;
      case 'del-skill': c.customSkills.splice(+b.dataset.i, 1); saveNow(); renderTab(); break;
      case 'del-weapon': c.weapons.splice(+b.dataset.i, 1); saveNow(); renderTab(); break;
      case 'add-gear': c.gear.push({ name: '', qty: 1, notes: '' }); saveNow(); renderTab(); break;
      case 'del-gear': c.gear.splice(+b.dataset.i, 1); saveNow(); renderTab(); break;
      case 'repair-armor': c.armor.head.spCurrent = c.armor.head.sp; c.armor.body.spCurrent = c.armor.body.sp; saveNow(); renderTab(); break;
      case 'roll-hl': {
        const z = zoneState(c, b.dataset.zone);
        const entry = b.dataset.slot === 'f' ? z.foundation : z.options[+b.dataset.slot];
        if (entry) { rollHL(entry); U.toast(`${cyberInfo(entry).name}: rolled ${entry.hl} Humanity Loss`); }
        saveNow(); renderTab(); break;
      }
      case 'roll-all-hl': case 'avg-all-hl':
        allCyber(c).forEach(x => {
          if (a === 'roll-all-hl') rollHL(x.entry);
          else if (x.entry.id !== 'custom') { const it = cyberInfo({ ...x.entry, hl: null }); if (it) x.entry.hl = it.hl; }
        });
        saveNow(); renderTab(); break;
      case 'export-json':
        saveNow();
        U.saveFile(`${U.safeName(c.handle)}.redkit.json`, JSON.stringify(c, null, 2));
        break;
      case 'export-txt': U.saveFile(`${U.safeName(c.handle)}.txt`, sheetText(c, derive(c)), 'text/plain'); break;
      case 'copy-txt':
        navigator.clipboard.writeText(sheetText(c, derive(c))).then(() => U.toast('Copied to clipboard'), () => U.toast('Clipboard not available'));
        break;
      case 'print': saveNow(); window.print(); break;
    }
  }

  function mount(el) {
    root = el;
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    renderList();
  }

  function onShow() { if (!current) renderList(); }

  // Internals the Ripperdoc view (ripperdoc.js) builds on.
  const cw = {
    current: () => current, zoneState, zoneCapacity, zoneUsed, cyberInfo, setFoundation, setOption, rollHL, derive,
    commit() { saveNow(); renderTab(); },
  };

  return { mount, onShow, derive, normalize, woundState, cw, list: () => S.list(KEY).map(normalize) };
})();
