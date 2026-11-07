/* Dice roller: skill checks (exploding/imploding d10), damage dice with critical injury detection, history. */
CPR.dice = (function () {
  const U = CPR.ui, esc = U.esc;
  let root, history = [];

  function render(last) {
    root.innerHTML = `<div class="grid cols-2">
      <div class="panel">
        <h3>Skill Check — STAT + Skill + 1d10</h3>
        <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px">
          <label class="field">Base (STAT+Skill)<input id="dc-base" type="number" value="${esc(root.dataset.base || 10)}"></label>
          <label class="field">Modifier<input id="dc-mod" type="number" value="${esc(root.dataset.mod || 0)}"></label>
          <label class="field">DV<input id="dc-dv" type="number" value="${esc(root.dataset.dv || 15)}"></label>
        </div>
        <button class="btn primary" style="width:100%;margin-top:8px" data-a="check">🎲 Roll check</button>
        <p class="muted small" style="margin-bottom:0">A natural 10 adds another d10 (critical success); a natural 1 subtracts one (critical failure). Beat the DV to succeed — ties go to the defender.</p>
      </div>
      <div class="panel">
        <h3>Result</h3>
        <div class="dice-result">${last ? esc(last.total) : '—'}</div>
        <div class="dice-detail">${last ? esc(last.detail) : 'Roll something'}</div>
      </div>
      <div class="panel">
        <h3>Damage & Other Dice</h3>
        <div class="dice-btns">
          ${['1d6', '2d6', '3d6', '4d6', '5d6', '6d6', '8d6', '1d10', '2d10', '1d100', '1d6/2', '3d6+2'].map(x => `<button class="btn" data-a="roll" data-e="${x}">${x}</button>`).join('')}
        </div>
        <div class="row" style="margin-top:8px"><input id="dc-expr" placeholder="e.g. 4d6+1" style="flex:1"><button class="btn cyan" data-a="custom">Roll</button></div>
        <p class="muted small" style="margin-bottom:0">Two or more 6s on damage dice means a Critical Injury (+5 damage).</p>
      </div>
      <div class="panel">
        <div class="row"><h3 style="margin:0">History</h3><span class="spacer"></span><button class="btn sm ghost" data-a="clear">Clear</button></div>
        <div class="log">${history.map(h => `<div class="${h.cls}">${esc(h.label)}: <b>${esc(h.total)}</b> <span class="muted">${esc(h.detail)}</span></div>`).join('') || '<div class="muted">No rolls yet.</div>'}</div>
      </div>
    </div>`;
  }

  function push(entry) { history.unshift(entry); history = history.slice(0, 100); render(entry); }

  function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const v = id => root.querySelector('#' + id).value;
    switch (b.dataset.a) {
      case 'check': {
        const base = Number(v('dc-base')) || 0, mod = Number(v('dc-mod')) || 0, dv = Number(v('dc-dv')) || 0;
        root.dataset.base = base; root.dataset.mod = mod; root.dataset.dv = dv;
        const r = U.rollD10Check();
        const total = base + mod + r.total;
        const pass = total > dv;
        push({
          label: 'Check', total,
          detail: `${base}${mod ? (mod > 0 ? '+' : '') + mod : ''} + d10 [${r.rolls.join(r.crit ? ' + ' : ' − ').replace('− -', '− ')}] vs DV ${dv} → ${pass ? 'SUCCESS' : 'FAIL'}${r.crit ? ' (crit!)' : r.fumble ? ' (fumble!)' : ''}`,
          cls: r.crit ? 'crit' : r.fumble ? 'fumble' : '',
        });
        break;
      }
      case 'roll': case 'custom': {
        const ex = b.dataset.a === 'roll' ? b.dataset.e : v('dc-expr');
        if (!ex) return;
        const r = U.roll(ex);
        if (!r.rolls.length) return U.toast('Use dice notation like 3d6 or 2d6+1');
        push({ label: ex, total: r.total, detail: `[${r.rolls.join(', ')}]${r.crit ? ' — CRITICAL INJURY' : ''}`, cls: r.crit ? 'crit' : '' });
        break;
      }
      case 'clear': history = []; render(); break;
    }
  }

  function mount(el) { root = el; root.addEventListener('click', onClick); render(); }
  return { mount, onShow() {} };
})();
