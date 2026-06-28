const Desktop = (() => {

  /* ── Grid ── */
  const CELL_W = 82, CELL_H = 86, PAD = 10;

  function gridCols() { return Math.max(1, Math.floor((window.innerWidth - PAD*2) / CELL_W)); }
  function gridRows() { return Math.max(1, Math.floor((window.innerHeight - 40 - PAD*2) / CELL_H)); }
  function cellToPos(col, row) { return { x: PAD + col*CELL_W, y: PAD + row*CELL_H }; }
  function snapToGrid(x, y) {
    return {
      col: Math.max(0, Math.min(gridCols()-1, Math.round((x-PAD)/CELL_W))),
      row: Math.max(0, Math.min(gridRows()-1, Math.round((y-PAD)/CELL_H)))
    };
  }

  /* ── State ── */
  let entries  = [];
  let selected = new Set();

  /* ── Next free grid cell ── */
  function nextFreeCell() {
    const occ = new Set(entries.map(e => `${e.col},${e.row}`));
    for (let col = 0; col < gridCols(); col++)
      for (let row = 0; row < gridRows(); row++)
        if (!occ.has(`${col},${row}`)) return { col, row };
    return { col: 0, row: entries.length };
  }

  /* ── Build one icon element ── */
  function makeEl(item, col, row) {
    const el = document.createElement('div');
    el.className = 'desktop-icon';
    el.dataset.itemId = item._id;
    const pos = cellToPos(col, row);
    el.style.left = pos.x + 'px';
    el.style.top  = pos.y + 'px';
    el.innerHTML  = `
      <div class="icon-img">${item.icon}</div>
      <div class="icon-label">${item.label}</div>`;

    /* Mouse: click → select, drag, dblclick → open */
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (!e.ctrlKey && !selected.has(item._id)) clearSel();
      setSel(item._id, true);
      startIconDrag(e, item._id);
    });
    el.addEventListener('dblclick', e => { e.stopPropagation(); activateDesktopItem(item); });

    /* Touch: tap = open, with tap detection */
    let tapTimer = null;
    let tapCount = 0;
    el.addEventListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      tapCount++;
      if (tapCount === 1) {
        // Select on first tap
        if (!selected.has(item._id)) clearSel();
        setSel(item._id, true);
        tapTimer = setTimeout(() => { tapCount = 0; }, 400);
      } else if (tapCount >= 2) {
        // Double-tap: open
        clearTimeout(tapTimer);
        tapCount = 0;
        activateDesktopItem(item);
      }
    });

    /* right-click → icon menu */
    el.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      if (!selected.has(item._id)) { clearSel(); setSel(item._id, true); }
      CtxIcon._target = item;
      showCtxMenu('ctx-icon', e.clientX, e.clientY);
    });

    return el;
  }

  /* ── Build / rebuild desktop ── */
  function build() {
    const container = document.getElementById('desktop-icons');
    container.innerHTML = '';
    entries  = [];
    selected = new Set();

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('desktop-pos') || '{}'); } catch(_) {}

    const repoItems = (typeof GITHUB_REPOS !== 'undefined' ? GITHUB_REPOS : []).map(r => ({
      kind:  'github',
      label: r.label || r.repo.split('/').pop(),
      icon:  r.icon  || '📦',
      repo:  r.repo,
    }));
    const allItems = [...DESKTOP_ITEMS, ...repoItems];

    allItems.forEach((item, idx) => {
      item._id = item._id || `${item.kind}-${idx}-${(item.label||'').replace(/\W/g,'')}`;

      let col, row;
      if (saved[item._id] != null) { col = saved[item._id].col; row = saved[item._id].row; }
      else { ({ col, row } = nextFreeCell()); }

      const el = makeEl(item, col, row);
      container.appendChild(el);
      entries.push({ item, el, col, row });
    });
  }

  function savePos() {
    const d = {};
    entries.forEach(e => { d[e.item._id] = { col: e.col, row: e.row }; });
    try { localStorage.setItem('desktop-pos', JSON.stringify(d)); } catch(_) {}
  }

  /* ── Selection ── */
  function setSel(id, on) {
    on ? selected.add(id) : selected.delete(id);
    entries.forEach(e => e.el.classList.toggle('selected', selected.has(e.item._id)));
  }

  function clearSel() {
    selected.clear();
    entries.forEach(e => e.el.classList.remove('selected'));
  }

  /* ── Icon drag (mouse only — touch opens) ── */
  function startIconDrag(e, id) {
    const sx = e.clientX, sy = e.clientY;
    let moved = false;

    const dragging = entries
      .filter(e => selected.has(e.item._id))
      .map(e => ({ e, ox: parseInt(e.el.style.left), oy: parseInt(e.el.style.top) }));

    function onMove(e) {
      const dx = e.clientX-sx, dy = e.clientY-sy;
      if (!moved && Math.hypot(dx,dy) < 5) return;
      moved = true;
      dragging.forEach(d => {
        d.e.el.style.left = (d.ox+dx) + 'px';
        d.e.el.style.top  = (d.oy+dy) + 'px';
        d.e.el.classList.add('dragging');
      });
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (!moved) return;
      dragging.forEach(d => {
        const x = parseInt(d.e.el.style.left), y = parseInt(d.e.el.style.top);
        const { col, row } = snapToGrid(x, y);
        d.e.col = col; d.e.row = row;
        const pos = cellToPos(col, row);
        d.e.el.style.left = pos.x + 'px';
        d.e.el.style.top  = pos.y + 'px';
        d.e.el.classList.remove('dragging');
      });
      savePos();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  /* ── Rubber-band selection (mouse only) ── */
  function initRubberBand() {
    const rectEl  = document.getElementById('selection-rect');
    const desktop = document.getElementById('desktop');

    desktop.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.desktop-icon,.window,.ctx-menu,#taskbar,#start-menu')) return;

      hideAllCtx();
      if (!e.ctrlKey) clearSel();

      const sx = e.clientX, sy = e.clientY;

      function upd(e) {
        const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY);
        const w = Math.abs(e.clientX-sx),  h = Math.abs(e.clientY-sy);
        rectEl.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
        entries.forEach(en => {
          const r = en.el.getBoundingClientRect();
          const hit = r.left < x+w && r.right > x && r.top < y+h && r.bottom > y;
          setSel(en.item._id, hit);
        });
      }

      function fin() {
        rectEl.style.display = 'none';
        document.removeEventListener('mousemove', upd);
        document.removeEventListener('mouseup',   fin);
      }

      document.addEventListener('mousemove', upd);
      document.addEventListener('mouseup',   fin);
    });
  }

  /* ── Arrange ── */
  function arrange(by) {
    hideAllCtx();
    const sorted = [...entries].sort((a, b) => {
      if (by === 'type') {
        const tc = a.item.kind.localeCompare(b.item.kind);
        if (tc !== 0) return tc;
      }
      return a.item.label.localeCompare(b.item.label);
    });
    sorted.forEach((entry, i) => {
      entry.col = 0; entry.row = i;
      const p = cellToPos(0, i);
      entry.el.style.left = p.x + 'px';
      entry.el.style.top  = p.y + 'px';
    });
    savePos();
  }

  function refresh() { hideAllCtx(); build(); }

  /* ── Load shortcuts from shortcuts/*.json via shortcuts/index.json ── */
  async function loadShortcuts() {
    let filenames;
    try {
      const res = await fetch('shortcuts/index.json');
      if (!res.ok) {
        console.warn('[shortcuts] index.json fetch failed:', res.status, res.url);
        return;
      }
      filenames = await res.json();
    } catch (e) {
      console.warn('[shortcuts] Could not load index.json:', e);
      return;
    }

    const results = await Promise.allSettled(
      filenames.map(f => fetch('shortcuts/' + f).then(r => {
        if (!r.ok) { console.warn('[shortcuts] failed to load:', f, r.status); return null; }
        return r.json();
      }))
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn('[shortcuts] error loading', filenames[i], r.reason);
        return;
      }
      const item = r.value;
      if (!item) return;
      if (DESKTOP_ITEMS.find(d => d.label === item.label && d.kind === item.kind)) {
        console.log('[shortcuts] skipped duplicate:', item.label);
        return;
      }
      console.log('[shortcuts] added:', item.label, item.kind);
      DESKTOP_ITEMS.push(item);
    });
  }

  /* ── Init ── */
  async function init() {
    await loadShortcuts();
    build();
    initRubberBand();

    const desktop = document.getElementById('desktop');

    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.desktop-icon,.window,.ctx-menu,#taskbar,#start-menu')) return;
      e.preventDefault();
      hideAllCtx();
      showCtxMenu('ctx-desktop', e.clientX, e.clientY);
    });

    desktop.addEventListener('mousedown', e => {
      if (e.target.closest('.desktop-icon,.window,.ctx-menu,#taskbar,#start-menu')) return;
      clearSel(); hideAllCtx();
    });

    // Touch: tap on empty desktop closes menus
    desktop.addEventListener('touchend', e => {
      if (e.target.closest('.desktop-icon,.window,.ctx-menu,#taskbar,#start-menu')) return;
      clearSel(); hideAllCtx();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { clearSel(); hideAllCtx(); }
      if (e.key === 'F2' && selected.size === 1) {
        const id  = [...selected][0];
        const ent = entries.find(e => e.item._id === id);
        if (ent) startRename(ent);
      }
    });
  }

  return { init, build, refresh, arrange };
})();


/* ══════════════════════════════════════════════════════════════════
   CONTEXT MENU HELPERS
══════════════════════════════════════════════════════════════════ */

function showCtxMenu(id, x, y) {
  hideAllCtx();
  const menu = document.getElementById(id);
  menu.classList.remove('hidden');
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  requestAnimationFrame(() => {
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    if (x + mw > window.innerWidth  - 4) menu.style.left = (window.innerWidth  - mw - 4) + 'px';
    if (y + mh > window.innerHeight - 4) menu.style.top  = (window.innerHeight - mh - 4) + 'px';
  });
}

function hideAllCtx() {
  document.querySelectorAll('.ctx-menu').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('mousedown', e => {
  if (!e.target.closest('.ctx-menu')) hideAllCtx();
}, true);


/* ══════════════════════════════════════════════════════════════════
   ICON CONTEXT MENU  (CtxIcon)
══════════════════════════════════════════════════════════════════ */
const CtxIcon = {
  _target: null,

  open() {
    hideAllCtx();
    if (this._target) activateDesktopItem(this._target);
  },

  rename() {
    hideAllCtx();
    if (!this._target) return;
    const id  = this._target._id;
    const el  = document.querySelector(`[data-item-id="${id}"]`);
    if (el) {
      const entry = { item: this._target, el };
      startRename(entry);
    } else {
      const newLabel = prompt('Rename:', this._target.label);
      if (newLabel && newLabel.trim()) this._target.label = newLabel.trim();
    }
  },

  props() {
    hideAllCtx();
    const item = this._target; if (!item) return;
    WM.open({
      id: 'props-' + item._id,
      label: 'Properties', icon: 'ℹ️',
      window: {
        title: `${item.label} Properties`, width: 340, height: 270, type: 'html',
        content: `
          <div class="content-area" style="padding:14px;">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;">
              <span style="font-size:40px;">${item.icon}</span>
              <div>
                <div style="font-weight:bold;font-size:14px;">${item.label}</div>
                <div style="color:#555;font-size:10px;">${item.kind?.toUpperCase() || ''}</div>
              </div>
            </div>
            <table style="width:100%;font-size:11px;border-collapse:collapse;">
              <tr><td style="color:#555;padding:3px 6px 3px 0;width:80px;">Type:</td><td>${item.kind || '—'}</td></tr>
              ${item.appId   ? `<tr><td style="color:#555;padding:3px 6px 3px 0;">App ID:</td><td>${item.appId}</td></tr>` : ''}
              ${item.url     ? `<tr><td style="color:#555;padding:3px 6px 3px 0;">URL:</td><td>${item.url}</td></tr>` : ''}
              ${item.pageSrc ? `<tr><td style="color:#555;padding:3px 6px 3px 0;">File:</td><td>${item.pageSrc}</td></tr>` : ''}
              ${item.children? `<tr><td style="color:#555;padding:3px 6px 3px 0;">Contains:</td><td>${item.children.length} item(s)</td></tr>` : ''}
            </table>
          </div>`
      }
    });
  }
};

/* ── Activate any desktop item ── */
function activateDesktopItem(item) {
  switch (item.kind) {
    case 'app':
      openApp(item.appId);
      break;
    case 'github':
      openGithubRepo(item);
      break;
    case 'folder':
      WM.open({
        id: 'folder-' + item._id,
        label: item.label, icon: item.icon || '📁',
        window: { title: item.label, width: 480, height: 360, type: '_folder', folderItem: item }
      });
      break;
    case 'link':
      window.open(item.url, '_blank');
      break;
    case 'page':
      WM.open({
        id: 'page-' + item.pageSrc,
        label: item.pageTitle || item.label, icon: item.icon,
        window: { title: item.pageTitle || item.label, width: 680, height: 520, type: 'page', src: item.pageSrc }
      });
      break;
  }
}

/* ══════════════════════════════════════════════════════════════════
   INLINE RENAME
══════════════════════════════════════════════════════════════════ */
function startRename(entry) {
  const labelEl = entry.el.querySelector('.icon-label');
  if (!labelEl) return;
  labelEl.contentEditable = 'true';
  labelEl.focus();
  const r = document.createRange();
  r.selectNodeContents(labelEl);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);

  function commit() {
    labelEl.contentEditable = 'false';
    const v = labelEl.textContent.trim() || entry.item.label;
    entry.item.label = v;
    labelEl.textContent = v;
    labelEl.removeEventListener('blur',    commit);
    labelEl.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { labelEl.textContent = entry.item.label; commit(); }
    e.stopPropagation();
  }
  labelEl.addEventListener('blur',    commit);
  labelEl.addEventListener('keydown', onKey);
}
