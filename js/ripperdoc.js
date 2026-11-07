/*
 * Ripperdoc view for cyberware: a body scan in the middle, body systems around it,
 * slot tiles you tap to open a shop / detail panel. Uses the same data and rules as the list view.
 */
CPR.ripperdoc = (function () {
  const D = CPR.DATA, S = CPR.store, U = CPR.ui, esc = U.esc;
  const cw = () => CPR.characters.cw;
  let selZone = null;

  /* ---------- icons (simple line art, 24x24) ---------- */
  const ICONS = {
    neural: 'M7 7h10v10H7z M10 10h4v4h-4z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
    chip: 'M6 3h9l3 3v15H6z M9 8h6 M9 12h6 M9 16h3',
    optic: 'M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
    audio: 'M4 10v4 M8 7v10 M12 4v16 M16 7v10 M20 10v4',
    arm: 'M7 21l1-8 2-8h4l-1 6h4l2 3-3 7z M10 13h5',
    leg: 'M9 3h5l-1 9 2 6h4v3H9l1-9z',
    internal: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z M8 11h2l1-2 2 4 1-2h2',
    external: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4',
    fashion: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
    borg: 'M12 2v20 M6 6h12 M5 11h14 M6 16h12 M8 21h8',
    custom: 'M12 5v14 M5 12h14',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z M12 15v2',
    plus: 'M12 6v12 M6 12h12',
  };
  const ZONE_ICON = { neural: 'neural', chips: 'chip', eyeL: 'optic', eyeR: 'optic', audio: 'audio', armL: 'arm', armR: 'arm',
    legL: 'leg', legR: 'leg', internal: 'internal', external: 'external', fashion: 'fashion', borg: 'borg' };
  const CAT_NAME = { foundation: 'Foundation', neural: 'Neuralware', chip: 'Chipware', optic: 'Cyberoptics', audio: 'Cyberaudio',
    arm: 'Cyberarm option', leg: 'Cyberleg option', internal: 'Internal body', external: 'External body', fashion: 'Fashionware', borg: 'Borgware' };

  function icon(name, size) {
    return `<svg class="rd-ico" viewBox="0 0 24 24" width="${size || 24}" height="${size || 24}" fill="none" stroke="currentColor"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ICONS.custom}"/></svg>`;
  }

  // Color tier by Humanity Loss, shown like item rarity.
  function tier(hl) {
    if (hl <= 0) return { n: 0, label: 'No Humanity cost' };
    if (hl <= 3) return { n: 1, label: 'Low Humanity cost' };
    if (hl <= 7) return { n: 2, label: 'Moderate Humanity cost' };
    if (hl <= 10) return { n: 3, label: 'High Humanity cost' };
    return { n: 4, label: 'Severe Humanity cost' };
  }

  /* ---------- body scan ---------- */
  const PARTS = {
    head: '<ellipse cx="100" cy="46" rx="24" ry="30"/>',
    earR: '<rect x="72" y="38" width="6" height="15" rx="3"/>',
    earL: '<rect x="122" y="38" width="6" height="15" rx="3"/>',
    eyeR: '<circle cx="90" cy="43" r="5.5"/>',
    eyeL: '<circle cx="110" cy="43" r="5.5"/>',
    torso: '<path d="M66 90 L134 90 L141 150 L129 218 L71 218 L59 150 Z"/>',
    armR: '<path d="M62 92 L47 102 L37 170 L32 244 L45 247 L56 176 L66 122 Z"/>',
    armL: '<path d="M138 92 L153 102 L163 170 L168 244 L155 247 L144 176 L134 122 Z"/>',
    legR: '<path d="M73 223 L98 223 L96 300 L93 386 L76 386 L73 300 Z"/>',
    legL: '<path d="M102 223 L127 223 L127 300 L124 386 L107 386 L104 300 Z"/>',
  };
  const PART_ZONE = { head: 'neural', earR: 'audio', earL: 'audio', eyeR: 'eyeR', eyeL: 'eyeL', torso: 'internal', armR: 'armR', armL: 'armL', legR: 'legR', legL: 'legL' };
  const PART_ZONES = { head: ['neural', 'chips', 'fashion'], earR: ['audio'], earL: ['audio'], eyeR: ['eyeR'], eyeL: ['eyeL'],
    torso: ['internal', 'external', 'borg'], armR: ['armR'], armL: ['armL'], legR: ['legR'], legL: ['legL'] };

  function bodyScan(c) {
    const k = cw();
    const has = zid => { const z = k.zoneState(c, zid); return !!(z.foundation || z.options.length); };
    const parts = Object.entries(PARTS).map(([p, shape]) => {
      const on = PART_ZONES[p].some(has);
      const sel = selZone && PART_ZONES[p].includes(selZone);
      return shape.replace(/^<(\w+)/, `<$1 class="rd-part ${on ? 'on' : ''} ${sel ? 'sel' : ''}" data-rdpart="${p}"`);
    }).join('');
    return `<div class="rd-scan">
      <svg viewBox="0 0 200 400" aria-label="Body scan — tap a body part">
        <defs><pattern id="rdgrid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="rgba(94,246,255,.08)" stroke-width="1"/></pattern></defs>
        <rect x="0" y="0" width="200" height="400" fill="url(#rdgrid)"/>
        <rect x="94" y="74" width="12" height="18" class="rd-neck"/>
        ${parts}
        <text x="22" y="395" class="rd-lbl">R</text><text x="172" y="395" class="rd-lbl">L</text>
      </svg>
      <div class="rd-scanline"></div>
    </div>`;
  }

  /* ---------- tiles ---------- */
  function tile(zone, idx, entry) {
    const info = cw().cyberInfo(entry);
    const t = tier(info.hl);
    const span = Math.max(1, Math.min(4, info.slots || 1));
    const ico = entry.id === 'custom' ? 'custom' : ZONE_ICON[zone.id];
    return `<button class="rd-tile t${t.n}" style="grid-column:span ${span}" data-rd="${zone.id}" data-idx="${idx}" title="${esc(info.name)}">
      ${icon(ico, 26)}<span class="rd-tname">${info.homebrew ? '★ ' : ''}${esc(info.name || 'Custom')}</span>
      ${info.slots > 1 ? `<span class="rd-tslots">${info.slots}▮</span>` : ''}</button>`;
  }

  function zoneCard(c, zone) {
    const k = cw();
    const z = k.zoneState(c, zone.id);
    const cap = k.zoneCapacity(c, zone), used = k.zoneUsed(c, zone), free = cap - used;
    const found = zone.foundation ? D.cyberById[zone.foundation] : null;
    const [title, sub] = zone.label.split(' — ');
    let body = '';

    if (found) {
      body += z.foundation
        ? `<button class="rd-found on" data-rd="${zone.id}" data-idx="f">${icon(ZONE_ICON[zone.id], 18)}<span>${esc(found.name)}</span><em>HL ${k.cyberInfo(z.foundation).hl}</em></button>`
        : `<button class="rd-found" data-rd="${zone.id}" data-idx="f">${icon('lock', 18)}<span>Install ${esc(found.name)}</span><em>${found.cost}eb</em></button>`;
    }

    let tiles = '';
    if (found && !z.foundation) {
      for (let i = 0; i < zone.slots; i++) tiles += `<div class="rd-tile locked">${icon('lock', 18)}</div>`;
    } else if (zone.needs && cap === 0 && !z.options.length) {
      body += `<p class="rd-note">${esc(zone.note)}</p>`;
    } else {
      z.options.forEach((o, i) => (tiles += tile(zone, i, o)));
      const empties = found || zone.needs ? Math.max(0, free) : (z.options.length < zone.slots ? 1 : 0);
      for (let i = 0; i < empties; i++) tiles += `<button class="rd-tile empty" data-rd="${zone.id}" data-idx="new" title="Add cyberware">${icon('plus', 22)}</button>`;
    }

    const count = found || zone.needs ? `${used}/${cap}` : `${z.options.length}/${zone.slots}`;
    return `<section class="rd-zone ${selZone === zone.id ? 'sel' : ''} ${used > cap ? 'over' : ''}" id="rdz-${zone.id}">
      <header>${icon(ZONE_ICON[zone.id], 16)}<b>${esc(sub || title)}</b><small>${esc(sub ? title : '')}</small><span class="rd-count">${count}</span></header>
      ${body}${tiles ? `<div class="rd-tiles">${tiles}</div>` : ''}
    </section>`;
  }

  function humanityBar(c, d) {
    const segs = Math.max(1, c.stats.EMP || 0);
    let html = '';
    for (let i = 0; i < segs; i++) {
      const fill = Math.max(0, Math.min(1, (d.humanity - i * 10) / 10));
      html += `<i><b style="width:${fill * 100}%"></b></i>`;
    }
    const low = d.humanity < 20;
    return `<div class="rd-hum ${low ? 'low' : ''}">
      <div class="rd-humtop"><span>HUMANITY</span><b>${d.humanity}<small>/${d.humanityMax}</small></b><span class="rd-emp">EMP ${d.empCur}/${c.stats.EMP}</span></div>
      <div class="rd-segs">${html}</div>
      <div class="rd-humnote">Each block is 1 point of EMP (10 Humanity). ${d.humanity <= 0 ? '<b>CYBERPSYCHOSIS</b>' : `Total Humanity Loss: ${d.hlCyber}`}</div>
    </div>`;
  }

  function render(c, d) {
    const left = ['neural', 'chips', 'eyeR', 'eyeL', 'audio', 'fashion'];
    const right = ['armR', 'armL', 'internal', 'external', 'legR', 'legL', 'borg'];
    const z = id => zoneCard(c, D.CYBER_ZONES.find(x => x.id === id));
    return `<div class="rd">
      <div class="rd-head">
        <div class="rd-title"><span>RIPPERDOC</span><small>// ${esc(c.handle || 'Unnamed')}</small></div>
        <div class="rd-kpi"><small>EUROBUCKS</small><b>${Number(c.money).toLocaleString()}</b></div>
        <div class="rd-kpi"><small>CHROME VALUE</small><b>${d.cyberCost.toLocaleString()}</b></div>
        <div class="rd-kpi"><small>INSTALLED</small><b>${d.cyber.length}</b></div>
      </div>
      ${humanityBar(c, d)}
      <div class="rd-main">
        <div class="rd-col">${left.map(z).join('')}</div>
        <div class="rd-center">${bodyScan(c)}
          <div class="rd-legend">${[0, 1, 2, 3, 4].map(n => `<span class="t${n}">${['None', 'Low', 'Moderate', 'High', 'Severe'][n]}</span>`).join('')}<em>Humanity cost</em></div>
        </div>
        <div class="rd-col">${right.map(z).join('')}</div>
      </div>
    </div>`;
  }

  /* ---------- shop / detail panel ---------- */
  // Roll bonuses on homebrew items, as readable tags.
  function modTags(m) {
    if (!m) return [];
    const s = n => (n >= 0 ? '+' : '−') + Math.abs(n);
    const out = [];
    if (m.init) out.push(`${s(m.init)} Initiative`);
    if (m.sp) out.push(`SP ${m.sp} head & body`);
    Object.entries(m.stats || {}).forEach(([k, v]) => v && out.push(`${s(v)} ${k} checks`));
    Object.entries(m.skills || {}).forEach(([k, v]) => v && out.push(`${s(v)} ${k}`));
    return out;
  }

  function detailHtml(item, opts) {
    const t = tier(item.hl);
    const slots = item.slots == null ? 1 : item.slots;
    const zone = opts.zone;
    const w = item.homebrew && item.weapon;
    const mods = (w ? [`⚔ ${w.damage} ${w.skill}${w.wtype ? ' · ' + w.wtype.toUpperCase() : ''}`] : []).concat(modTags(item.mods));
    return `<div class="rd-dhead t${t.n}">${icon(item.id === 'custom' ? 'custom' : ZONE_ICON[zone.id], 40)}
        <div><div class="rd-dname">${item.homebrew ? '★ ' : ''}${esc(item.name || 'Custom cyberware')}</div>
        <div class="rd-dsub">${esc(CAT_NAME[item.cat] || 'Custom')} · ${esc(item.kind || 'Custom')}${item.homebrew ? ' · GM homebrew' : ''}${item.source && !item.homebrew ? ' · ' + esc(item.source) : ''}</div></div></div>
      <div class="rd-tierline t${item.unset ? 4 : t.n}">${item.unset ? 'Humanity cost not entered' : t.label}</div>
      ${item.unset ? '<div class="rd-unset">⚠ Mission Kit values not entered. Cost, Humanity Loss, slots and damage are placeholders until they are added to the table at the top of <code>js/data.js</code>. After installing, you can still set Humanity Loss for this character.</div>' : ''}
      <div class="rd-stats">
        <div><small>COST</small><b>${Number(item.cost || 0).toLocaleString()}eb</b></div>
        <div><small>HUMANITY LOSS</small><b>${item.hl}</b>${item.hlDice && item.hlDice !== '0' ? `<em>or roll ${esc(item.hlDice)}</em>` : ''}</div>
        <div><small>${item.cat === 'foundation' ? 'PROVIDES' : 'SLOTS'}</small><b>${item.cat === 'foundation' ? (zone.slots + ' slots') : item.cat === 'chip' ? 'socket' : slots}</b></div>
      </div>
      ${(item.fx && item.fx.length) || mods.length ? `<div class="rd-fx">${(item.fx || []).map(f => `<span>${esc(f)}</span>`).join('')}${mods.map(f => `<span class="mod">${esc(f)}</span>`).join('')}</div>` : ''}
      <p class="rd-desc">${esc(item.details || item.desc || '')}</p>`;
  }

  // Used by the Homebrew editor to show how a piece will look to players.
  const CAT_ZONE = { neural: 'neural', chip: 'chips', optic: 'eyeL', audio: 'audio', arm: 'armL', leg: 'legL', internal: 'internal', external: 'external', fashion: 'fashion', borg: 'borg' };
  function preview(item) {
    return `<div class="rd-detail">${detailHtml(item, { zone: { id: CAT_ZONE[item.cat] || 'internal', slots: 0 } })}</div>`;
  }

  function openShop(zone, idx) {
    const k = cw(), c = k.current();
    const z = k.zoneState(c, zone.id);
    const isFound = idx === 'f';
    const replacing = typeof idx === 'number' && z.options[idx] ? k.cyberInfo(z.options[idx]).slots : 0;
    const free = k.zoneCapacity(c, zone) - k.zoneUsed(c, zone) + replacing;
    const items = isFound ? [D.cyberById[zone.foundation]] : CPR.cyber.forCat(zone.cat);
    const owned = new Set(z.options.map(o => o && o.id));
    const replacingId = typeof idx === 'number' && z.options[idx] ? z.options[idx].id : null;
    const room = i => isFound || zone.needs || !zone.foundation || (i.slots == null ? 1 : i.slots) <= free;
    const conflict = i => (D.CYBER_CONFLICTS[i.id] || []).find(x => owned.has(x) && x !== replacingId);
    const fits = i => room(i) && !conflict(i);
    const why = i => (conflict(i) ? ` · not with ${D.cyberById[conflict(i)].name}` : !room(i) ? ' · no room' : '');
    const first = items.find(fits) || items[0];
    const pay = S.read('ui.payChrome', false);

    const m = U.modal({
      cls: 'wide rd-modal',
      body: `<div class="rd-shophead">${icon(ZONE_ICON[zone.id], 18)}<b>${esc(zone.label)}</b><span>${isFound ? 'Foundation' : `${Math.max(0, free)} slot${free === 1 ? '' : 's'} free`}</span></div>
        <div class="rd-shop">
          <div class="rd-list">
            ${items.map(i => {
              const t = tier(i.hl), ok = fits(i);
              return `<button class="rd-card t${t.n}" data-pick="${i.id}" ${ok ? '' : 'disabled'}>
                ${icon(ZONE_ICON[zone.id], 22)}
                <span class="rd-cname"><b>${i.homebrew ? '★ ' : ''}${esc(i.name)}</b><small>${i.homebrew ? 'Homebrew · ' : ''}${i.source && !i.homebrew ? 'Mission Kit · ' : ''}${i.unset ? '⚠ values needed · ' : ''}${esc(i.kind)}${(i.slots || 1) > 1 ? ` · ${i.slots} slots` : ''}${!ok ? why(i) : owned.has(i.id) ? ' · owned' : ''}</small></span>
                <span class="rd-cprice">${i.cost.toLocaleString()}<small>eb</small><em>HL ${i.hl}</em></span></button>`;
            }).join('')}
            ${isFound ? '' : `<button class="rd-card t0" data-pick="custom">${icon('custom', 22)}<span class="rd-cname"><b>Custom cyberware</b><small>Homebrew or from a sourcebook</small></span><span class="rd-cprice">—</span></button>`}
          </div>
          <div class="rd-detail" id="rd-detail"></div>
        </div>`,
      actions: [{ label: 'Close' }],
    });

    let picked = first.id;
    const detail = m.el.querySelector('#rd-detail');
    const showDetail = id => {
      picked = id;
      m.el.querySelectorAll('.rd-card').forEach(b => b.classList.toggle('sel', b.dataset.pick === id));
      if (id === 'custom') {
        detail.innerHTML = detailHtml({ id: 'custom', name: 'Custom cyberware', cost: 0, hl: 0, slots: 1, kind: 'Custom',
          details: 'Add anything not in the list: sourcebook chrome, homebrew or a GM special.' }, { zone }) +
          `<div class="rd-customform">
            <label class="field">Name<input id="rc-name" placeholder="e.g. Mantis Blades"></label>
            <label class="field">Cost (eb)<input id="rc-cost" type="number" value="0"></label>
            <label class="field">Humanity Loss<input id="rc-hl" type="number" value="0"></label>
            <label class="field">Slots<input id="rc-slots" type="number" value="1" min="0"></label>
          </div>`;
      } else {
        detail.innerHTML = detailHtml(items.find(x => x.id === id), { zone });
      }
      const item = items.find(x => x.id === id);
      const ok = id === 'custom' || fits(item);
      detail.insertAdjacentHTML('beforeend', `<div class="rd-buy">
        <label class="check small"><input type="checkbox" id="rd-pay" ${pay ? 'checked' : ''}> Pay from eurobucks (${Number(c.money).toLocaleString()}eb)</label>
        <button class="btn primary rd-install" data-install ${ok ? '' : 'disabled'}>${ok ? `Install${item ? ' — ' + item.cost.toLocaleString() + 'eb' : ''}` : esc(why(item).replace(' · ', '')) || 'Unavailable'}</button></div>`);
      if (matchMedia('(max-width: 760px)').matches) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    showDetail(picked);

    m.el.addEventListener('click', e => {
      const card = e.target.closest('[data-pick]');
      if (card && !card.disabled) return showDetail(card.dataset.pick);
      if (!e.target.closest('[data-install]')) return;
      const payNow = m.el.querySelector('#rd-pay').checked;
      S.write('ui.payChrome', payNow);
      let cost;
      if (isFound) {
        k.setFoundation(c, zone.id, picked); cost = items.find(x => x.id === picked).cost;
      } else if (picked === 'custom') {
        const v = id => m.el.querySelector('#' + id).value;
        const entry = { id: 'custom', name: v('rc-name') || 'Custom cyberware', cost: Number(v('rc-cost')) || 0, hl: Number(v('rc-hl')) || 0, slots: Math.max(0, Number(v('rc-slots')) || 0) };
        k.setOption(c, zone.id, typeof idx === 'number' ? idx : z.options.length, 'custom', entry); cost = entry.cost;
      } else {
        k.setOption(c, zone.id, typeof idx === 'number' ? idx : z.options.length, picked); cost = items.find(x => x.id === picked).cost;
      }
      if (payNow) c.money = Number(c.money) - cost;
      U.toast(`Installed${payNow ? ` — paid ${cost.toLocaleString()}eb` : ''}`);
      m.close(); selZone = zone.id; k.commit();
    });
  }

  function openInstalled(zone, idx) {
    const k = cw(), c = k.current();
    const z = k.zoneState(c, zone.id);
    const entry = idx === 'f' ? z.foundation : z.options[idx];
    if (!entry) return;
    const info = k.cyberInfo(entry);
    const custom = entry.id === 'custom';
    const m = U.modal({
      cls: 'rd-modal',
      body: `<div class="rd-detail solo">${detailHtml({ ...info, id: entry.id, cat: custom ? 'custom' : info.cat, kind: info.kind || 'Custom' }, { zone })}
        <div class="rd-installed">
          ${custom ? `<div class="rd-customform">
            <label class="field">Name<input id="ri-name" value="${esc(entry.name)}"></label>
            <label class="field">Cost (eb)<input id="ri-cost" type="number" value="${entry.cost || 0}"></label>
            <label class="field">Slots<input id="ri-slots" type="number" value="${entry.slots == null ? 1 : entry.slots}"></label></div>` : ''}
          <div class="row"><label class="field" style="flex:1">Humanity Loss for this character<input id="ri-hl" type="number" value="${info.hl}"></label>
            ${info.hlDice && info.hlDice !== '0' ? `<button class="btn" data-ri="roll" style="align-self:flex-end">🎲 Roll ${esc(info.hlDice)}</button>` : ''}</div>
        </div></div>`,
      actions: [
        { label: 'Remove', cls: 'danger', onClick: () => {
          if (idx === 'f') k.setFoundation(c, zone.id, null); else k.setOption(c, zone.id, idx, null);
          U.toast(`${info.name} removed`); selZone = zone.id; k.commit();
        } },
        ...(idx === 'f' ? [] : [{ label: 'Replace…', onClick: () => { setTimeout(() => openShop(zone, idx), 0); } }]),
        { label: 'Save', cls: 'primary', onClick: w => {
          entry.hl = Number(w.querySelector('#ri-hl').value) || 0;
          if (custom) {
            entry.name = w.querySelector('#ri-name').value || entry.name;
            entry.cost = Number(w.querySelector('#ri-cost').value) || 0;
            entry.slots = Math.max(0, Number(w.querySelector('#ri-slots').value) || 0);
          }
          selZone = zone.id; k.commit();
        } },
      ],
    });
    m.el.addEventListener('click', e => {
      if (e.target.closest('[data-ri="roll"]')) {
        const r = U.roll(info.hlDice).total;
        m.el.querySelector('#ri-hl').value = r;
        U.toast(`Rolled ${info.hlDice}: ${r} — press Save to keep it`);
      }
    });
  }

  /* Returns true when the click was handled. */
  function onClick(e) {
    const part = e.target.closest('[data-rdpart]');
    if (part) {
      selZone = PART_ZONE[part.dataset.rdpart];
      cw().commit();
      const el = document.getElementById('rdz-' + selZone);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    const t = e.target.closest('[data-rd]');
    if (!t) return false;
    const zone = D.CYBER_ZONES.find(z => z.id === t.dataset.rd);
    const raw = t.dataset.idx;
    const c = cw().current();
    const z = cw().zoneState(c, zone.id);
    selZone = zone.id;
    if (raw === 'new') openShop(zone, 'new');
    else if (raw === 'f') (z.foundation ? openInstalled(zone, 'f') : openShop(zone, 'f'));
    else openInstalled(zone, +raw);
    return true;
  }

  return { render, onClick, preview, modTags };
})();
