/* ── Clock ── */
function updateClock() {
  const n = new Date();
  const t = n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const d = n.toLocaleDateString([], { month: 'short', day: 'numeric' });
  document.getElementById('clock').innerHTML =
    `${t}<br><span style="font-size:9px;">${d}</span>`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Start Menu ── */
function buildStartMenu() {
  const list = document.getElementById('start-app-list');
  list.innerHTML = '';
  APPS.filter(a => a.startMenu).forEach(app => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="menu-icon">${app.icon}</span>
                    <span class="menu-label">${app.label}</span>`;
    li.onclick = () => { openApp(app.id); hideStartMenu(); hideAllCtx(); };
    list.appendChild(li);
  });
}

function hideStartMenu() {
  document.getElementById('start-menu').classList.add('hidden');
}

function toggleStartMenu() {
  const sm = document.getElementById('start-menu');
  const isHidden = sm.classList.contains('hidden');
  hideAllCtx();
  if (isHidden) sm.classList.remove('hidden');
  else sm.classList.add('hidden');
}

/* ── Refresh desktop helper ── */
function refreshDesktop() { Desktop.refresh(); }

/* ── Shutdown ── */
function showShutdown() {
  hideAllCtx();
  document.getElementById('shutdown-overlay').classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
(function boot() {
  buildStartMenu();
  Wallpaper.loadSaved();
  Desktop.init();
  Screensaver.init();

  /* Close start menu when clicking outside it */
  document.addEventListener('mousedown', e => {
    const sm  = document.getElementById('start-menu');
    const btn = document.getElementById('start-btn');
    if (!sm.classList.contains('hidden') &&
        !sm.contains(e.target) &&
        !btn.contains(e.target)) {
      hideStartMenu();
    }
  }, true);

  setTimeout(() => openApp('about'), 500);
})();
