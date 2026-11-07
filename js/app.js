/* App shell: navigation between views and offline support. */
(function () {
  const modules = { characters: CPR.characters, combat: CPR.combat, map: CPR.map, homebrew: CPR.homebrew, dice: CPR.dice };

  Object.entries(modules).forEach(([k, m]) => m.mount(document.getElementById('view-' + k)));

  CPR.roller.init();
  CPR.roller.onRoll = e => CPR.combat.logRoll(e);

  function show(name) {
    if (!modules[name]) name = 'characters';
    document.body.dataset.view = name;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('#mainnav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    modules[name].onShow();
    try { sessionStorage.setItem('cprkit.view', name); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
  }

  document.getElementById('mainnav').addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (b) show(b.dataset.view);
  });

  let start = 'characters';
  try { start = sessionStorage.getItem('cprkit.view') || start; } catch (e) { /* ignore */ }
  show(start);

  /*
   * Install button. Chrome / Edge / Android fire `beforeinstallprompt` when the app can be installed
   * (Windows gets a Start-menu app with its own window). iPhone Safari has no prompt, so we show steps.
   */
  const installBtn = document.getElementById('install-btn');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferredPrompt = null;
  if (!standalone && location.protocol === 'https:' && isIOS) installBtn.hidden = false;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; CPR.ui.toast('RED Kit installed'); });
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') installBtn.hidden = true;
      return;
    }
    CPR.ui.modal({
      title: 'Install RED Kit',
      body: `<ol class="install-steps">
        <li>Tap the <b>Share</b> button (the square with an arrow) in Safari.</li>
        <li>Choose <b>Add to Home Screen</b>.</li>
        <li>Tap <b>Add</b>. RED Kit opens full-screen and works offline.</li></ol>
        <p class="muted small">Your characters stay on this device. Use Export to back them up.</p>`,
    });
  });

  // Offline support when served over http(s). Opening index.html directly still works, just without the cache.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
