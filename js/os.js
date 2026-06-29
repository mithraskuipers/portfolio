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

/* ── Blue Screen of Death ── */
function showBSOD() {
  const el = document.createElement('div');
  el.id = 'bsod-overlay';
  const stopCodes = ['0x0000007E','0x00000050','0xC0000034','0x0000008E','0x000000D1','0xDEADBEEF'];
  const code = stopCodes[Math.floor(Math.random()*stopCodes.length)];
  el.style.cssText = `
    position:fixed;inset:0;z-index:999999;background:#0000aa;
    color:#fff;font-family:"Courier New",monospace;font-size:13px;
    padding:40px 60px;line-height:1.8;cursor:none;
  `;
  el.innerHTML = `
    <div style="background:#aaa;color:#000;padding:2px 6px;display:inline-block;margin-bottom:20px;font-weight:bold;">Windows</div>
    <p>A problem has been detected and Portfolio OS has been shut down to prevent damage<br>to your computer.</p>
    <p style="margin-top:16px;">IRQL_NOT_LESS_OR_EQUAL</p>
    <p style="margin-top:16px;">If this is the first time you've seen this stop error screen,<br>
    restart your computer. If this screen appears again, follow<br>
    these steps:</p>
    <p style="margin-top:16px;">Check to make sure any new hardware or software is properly installed.<br>
    If this is a new installation, ask your hardware or software manufacturer<br>
    for any Windows updates you might need.</p>
    <p style="margin-top:16px;">If problems continue, disable or remove any newly installed hardware<br>
    or software. Disable BIOS memory options such as caching or shadowing.<br>
    If you need to use Safe Mode to remove or disable components, restart<br>
    your computer, press F8 to select Advanced Startup Options, and then<br>
    select Safe Mode.</p>
    <p style="margin-top:16px;">Technical information:</p>
    <p style="margin-top:8px;">*** STOP: ${code} (0xC0000005, 0xBFC5A23D, 0x00000000, 0x00000000)</p>
    <p style="margin-top:24px;color:#aaa;font-size:11px;">Press any key to restart... (or click anywhere)</p>
  `;
  el.addEventListener('click', () => el.remove());
  el.addEventListener('keydown', () => el.remove(), {once:true});
  document.body.appendChild(el);
  el.tabIndex = 0; el.focus();
}


/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
(async function boot() {
  /* ── Cache busting ──────────────────────────────────────────────
     Bump APP_VERSION whenever you deploy new code. On first load
     with a new version every localStorage key is wiped so the user
     always sees a clean state without having to clear their cache.
  ────────────────────────────────────────────────────────────────── */
  const APP_VERSION = '1.0.2';
  const VER_KEY     = 'portfolio-version';
  try {
    if (localStorage.getItem(VER_KEY) !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem(VER_KEY, APP_VERSION);
    }
  } catch(_) {}

  buildStartMenu();
  Wallpaper.loadSaved();
  await Desktop.init();
  await initDosGames();   // auto-discover assets/dos/games/*.zip
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
