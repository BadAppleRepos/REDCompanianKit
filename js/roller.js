/*
 * Dice tray: a floating result card plus a panel with a situational modifier and roll history.
 * Used by the character Play tab (and anything else that wants a quick roll).
 */
CPR.roller = (function () {
  const U = CPR.ui, esc = U.esc;
  let card, fab, panel, hist = [], mod = 0, hideTimer, anim;

  function build() {
    if (card) return;
    card = document.createElement('div');
    card.className = 'roll-card';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.title = 'Tap to dismiss';
    panel = document.createElement('div');
    panel.className = 'roll-panel';
    fab = document.createElement('button');
    fab.className = 'roll-fab';
    fab.title = 'Dice tray — modifier & history';
    fab.innerHTML = '<span class="rf-ico">🎲</span><span class="rf-mod"></span>';
    document.body.append(card, panel, fab);

    card.addEventListener('click', () => card.classList.remove('show'));
    fab.addEventListener('click', () => { panel.classList.toggle('open'); renderPanel(); });
    panel.addEventListener('input', e => {
      if (e.target.id === 'roll-mod') { mod = parseInt(e.target.value, 10) || 0; updateFab(); }
    });
    panel.addEventListener('click', e => {
      const m = e.target.closest('[data-m]');
      if (m) { mod = m.dataset.m === '0' ? 0 : mod + Number(m.dataset.m); renderPanel(); updateFab(); }
      if (e.target.closest('[data-clear]')) { hist = []; renderPanel(); }
      if (e.target.closest('[data-close]')) panel.classList.remove('open');
    });
  }

  const sign = n => (n < 0 ? '− ' : '+ ') + Math.abs(n);

  function updateFab() {
    fab.querySelector('.rf-mod').textContent = mod ? (mod > 0 ? '+' : '') + mod : '';
    fab.classList.toggle('has-mod', !!mod);
  }

  function renderPanel() {
    if (!panel.classList.contains('open')) return;
    panel.innerHTML = `
      <div class="rp-head"><b>DICE TRAY</b><button class="btn icon sm ghost" data-close aria-label="Close">×</button></div>
      <div class="rp-mod">
        <span>Situational modifier</span>
        <div class="row" style="flex-wrap:nowrap">
          <button class="btn sm" data-m="-2">−2</button><button class="btn sm" data-m="-1">−1</button>
          <input id="roll-mod" type="number" value="${mod}" style="width:60px;text-align:center">
          <button class="btn sm" data-m="1">+1</button><button class="btn sm" data-m="2">+2</button>
          <button class="btn sm ghost" data-m="0">Reset</button>
        </div>
        <small>Added to every check until you reset it (aiming, cover, range, GM calls…).</small>
      </div>
      <div class="rp-hist">
        <div class="row"><small>HISTORY</small><span class="spacer"></span>${hist.length ? '<button class="btn sm ghost" data-clear>Clear</button>' : ''}</div>
        ${hist.map(h => `<div class="rp-item ${h.crit ? 'crit' : ''} ${h.fumble ? 'fumble' : ''}">
          <div><b>${esc(h.label)}</b> <span class="muted">${esc(h.who || '')}</span><div class="rp-detail">${esc(h.detail)}</div></div>
          <span class="rp-total">${h.total}</span></div>`).join('') || '<p class="muted small">No rolls yet — tap a stat, skill or weapon.</p>'}
      </div>`;
  }

  /*
   * Skill / stat check: STAT + Skill + modifiers + 1d10 (10 explodes, 1 implodes).
   * o = { who, charId, label, parts: [{label, v}], note, plain (no exploding die) }
   */
  function check(o) {
    build();
    let r;
    if (o.plain) { const n = U.d(10); r = { total: n, rolls: [n] }; } else r = U.rollD10Check();
    const parts = o.parts.filter((p, i) => i === 0 || p.v !== 0);
    if (mod && !o.noMod) parts.push({ label: 'situational', v: mod });
    const base = parts.reduce((a, p) => a + p.v, 0);
    const die = r.crit ? `d10: 10, +${r.rolls[1]}` : r.fumble ? `d10: 1, −${-r.rolls[1]}` : `d10: ${r.rolls[0]}`;
    const detail = parts.map((p, i) => `${i ? sign(p.v) : p.v} ${p.label}`).join(' ') + ` ${sign(r.total)} (${die})`;
    return show({ ...o, kind: 'check', total: base + r.total, base, die: r.total, crit: r.crit, fumble: r.fumble, detail });
  }

  /*
   * Damage roll: o = { who, charId, label, dice, bonus, note } — two or more 6s is a Critical Injury.
   * `bonus` is a flat modifier added after the dice (e.g. a weapon's damage Modifier).
   */
  function damage(o) {
    build();
    const r = U.roll(o.dice);
    if (!r.rolls.length) { U.toast(`Can't roll "${o.dice}" — use notation like 3d6`); return null; }
    const bonus = Number(o.bonus) || 0;
    const note = [r.crit ? 'Critical Injury: +5 damage that ignores armor' : '', o.note || ''].filter(Boolean).join(' · ');
    const detail = `${o.dice}: [${r.rolls.join(', ')}]${bonus ? ` ${sign(bonus)} modifier` : ''}`;
    return show({ ...o, kind: 'damage', total: r.total + bonus, crit: r.crit, detail, note, flag: r.crit ? 'CRITICAL INJURY' : '' });
  }

  /* Anything else: pass a finished entry { label, total, detail, flag, crit, fumble, note }. */
  function custom(o) { build(); return show({ kind: 'custom', ...o }); }

  function show(e) {
    e.t = Date.now();
    hist.unshift(e);
    hist = hist.slice(0, 60);
    clearTimeout(hideTimer);
    clearInterval(anim);
    const flag = e.flag != null && e.flag !== '' ? e.flag : e.crit ? 'CRITICAL SUCCESS' : e.fumble ? 'CRITICAL FAILURE' : '';
    card.className = `roll-card show ${e.crit ? 'crit' : ''} ${e.fumble ? 'fumble' : ''} ${e.kind === 'damage' ? 'dmg' : ''}`;
    card.innerHTML = `
      <div class="rc-head"><span>${esc(e.who || '')}</span><b>${esc(e.label)}</b></div>
      <div class="rc-total">${e.total}</div>
      <div class="rc-detail">${esc(e.detail)}</div>
      ${flag ? `<div class="rc-flag">${esc(flag)}</div>` : ''}
      ${e.note ? `<div class="rc-note">${esc(e.note)}</div>` : ''}`;
    const tot = card.querySelector('.rc-total');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let n = 0;
      tot.classList.add('spin');
      anim = setInterval(() => {
        tot.textContent = 1 + Math.floor(Math.random() * 20);
        if (++n > 7) { clearInterval(anim); tot.textContent = e.total; tot.classList.remove('spin'); }
      }, 45);
    }
    hideTimer = setTimeout(() => card.classList.remove('show'), 8000);
    renderPanel();
    if (typeof CPR.roller.onRoll === 'function') CPR.roller.onRoll(e);
    return e;
  }

  return { init: build, check, damage, custom, onRoll: null };
})();
