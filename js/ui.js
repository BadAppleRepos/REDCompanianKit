/* Shared UI helpers: escaping, toast, modal, file import/export, dice. */
CPR.ui = (function () {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* modal({title, body (html), actions:[{label, cls, onClick(root) -> false keeps open}]}) */
  function modal(opts) {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true">
      ${opts.title ? `<h2>${esc(opts.title)}</h2>` : ''}
      <div class="modal-body">${opts.body || ''}</div>
      <div class="actions"></div></div>`;
    const close = () => wrap.remove();
    const actions = wrap.querySelector('.actions');
    (opts.actions || [{ label: 'Close' }]).forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || '');
      b.textContent = a.label;
      b.onclick = () => {
        const keep = a.onClick ? a.onClick(wrap) === false : false;
        if (!keep) close();
      };
      actions.appendChild(b);
    });
    wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
    root.appendChild(wrap);
    const first = wrap.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 30);
    if (opts.onOpen) opts.onOpen(wrap);
    return { el: wrap, close };
  }

  function confirm(title, text, okLabel, onOk) {
    modal({
      title, body: `<p>${esc(text)}</p>`,
      actions: [{ label: 'Cancel' }, { label: okLabel || 'OK', cls: 'primary', onClick: onOk }],
    });
  }

  /* Save a file. Uses the share sheet on phones when available, otherwise a download. */
  async function saveFile(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/json' });
    try {
      const file = new File([blob], filename, { type: blob.type });
      const isTouch = matchMedia('(pointer: coarse)').matches;
      if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* Ask the user for a file; resolves with {name, text} or {name, dataUrl}. */
  function pickFile(accept, asDataUrl) {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept || '';
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) return resolve(null);
        const r = new FileReader();
        r.onload = () => resolve(asDataUrl ? { name: f.name, dataUrl: r.result } : { name: f.name, text: r.result });
        if (asDataUrl) r.readAsDataURL(f); else r.readAsText(f);
      };
      input.click();
    });
  }

  function safeName(s) { return (s || 'untitled').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 40); }

  /* ---- dice ---- */
  const d = n => 1 + Math.floor(Math.random() * n);

  // "3d6+2", "1d10", "2d6/2"
  function roll(expr) {
    const m = String(expr).replace(/\s+/g, '').match(/^(\d*)d(\d+)(?:([+\-])(\d+))?(?:\/(\d+))?$/i);
    if (!m) {
      const n = parseInt(expr, 10);
      return { total: isNaN(n) ? 0 : n, rolls: [], expr };
    }
    const count = parseInt(m[1] || '1', 10), sides = parseInt(m[2], 10);
    const rolls = [];
    for (let i = 0; i < Math.min(count, 100); i++) rolls.push(d(sides));
    let total = rolls.reduce((a, b) => a + b, 0);
    if (m[3]) total += (m[3] === '+' ? 1 : -1) * parseInt(m[4], 10);
    if (m[5]) total = Math.ceil(total / parseInt(m[5], 10));
    const sixes = sides === 6 ? rolls.filter(r => r === 6).length : 0;
    return { total, rolls, expr, crit: sixes >= 2 };
  }

  // Cyberpunk RED skill check die: 10 explodes (+1d10), 1 implodes (-1d10).
  function rollD10Check() {
    const first = d(10);
    if (first === 10) { const x = d(10); return { total: 10 + x, rolls: [10, x], crit: true }; }
    if (first === 1) { const x = d(10); return { total: 1 - x, rolls: [1, -x], fumble: true }; }
    return { total: first, rolls: [first] };
  }

  return { esc, toast, modal, confirm, saveFile, pickFile, safeName, roll, rollD10Check, d };
})();
