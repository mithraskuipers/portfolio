const Wallpaper = (() => {

  const LS_KEY = 'portfolio-wallpaper';
  let currentIdx = 0;

  /* ── Apply a wallpaper entry to the desktop ── */
  function apply(entry, position) {
    const d = document.getElementById('desktop');
    const imgSrc = entry.url || (entry.file ? `assets/bg/${entry.file}` : null);
    if (imgSrc) {
      d.style.backgroundImage    = `url('${imgSrc}')`;
      d.style.backgroundSize     = position || 'cover';
      d.style.backgroundPosition = 'center';
      d.style.backgroundRepeat   = position === 'auto' ? 'repeat' : 'no-repeat';
      d.style.backgroundColor    = '#000';
    } else {
      d.style.backgroundImage = 'none';
      d.style.backgroundColor = entry.color || '#3a6ea5';
    }
  }

  /* ── Restore saved wallpaper on boot ── */
  function loadSaved() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (s && typeof s.idx === 'number' && WALLPAPERS[s.idx]) {
        currentIdx = s.idx;
        apply(WALLPAPERS[s.idx], s.position);
        return;
      }
    } catch (_) {}
    if (WALLPAPERS.length) apply(WALLPAPERS[0]);
  }

  /* ── Open the dialog ── */
  function openDialog() {
    hideAllCtx();
    WM.open({
      id: '__wp_dialog__',
      label: 'Display Properties',
      icon: '🖥️',
      window: { title: 'Display Properties', width: 510, height: 445, type: '_wallpaper_dialog' }
    });
  }

  /* ── Build dialog DOM (called by WM when type === _wallpaper_dialog) ── */
  function buildDialog(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;font-family:var(--font-ui);font-size:11px;">

        <!-- fake tab bar -->
        <div style="padding:6px 8px 0;border-bottom:2px solid #aaa;">
          <div style="display:flex;gap:2px;">
            ${['Themes','Desktop','Screen Saver','Appearance','Settings'].map((t,i)=>`
              <div style="padding:4px 10px;border:1px solid #aaa;border-bottom:none;border-radius:3px 3px 0 0;
                background:${i===1?'#ece9d8':'#d4cfbf'};cursor:default;${i===1?'font-weight:bold;position:relative;top:2px;z-index:1;':''}">
                ${t}
              </div>`).join('')}
          </div>
        </div>

        <!-- content -->
        <div style="display:flex;gap:10px;padding:10px;flex:1;overflow:hidden;">

          <!-- monitor preview -->
          <div style="flex:0 0 172px;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <!-- monitor outer bezel -->
            <div style="background:#c0bdb4;border:2px solid #888;border-radius:6px;padding:8px;box-shadow:2px 2px 6px rgba(0,0,0,0.3);">
              <div id="wp-preview" style="width:148px;height:110px;border:2px inset #666;overflow:hidden;position:relative;">
                <div id="wp-preview-inner" style="width:100%;height:100%;background-size:cover;background-position:center;transition:all 0.3s;"></div>
                <!-- mini taskbar -->
                <div style="position:absolute;bottom:0;left:0;right:0;height:7px;background:linear-gradient(180deg,#3a7bd5,#1a4cba);"></div>
                <!-- mini start btn -->
                <div style="position:absolute;bottom:1px;left:2px;width:20px;height:5px;background:linear-gradient(90deg,#3da63a,#5dc158);border-radius:2px;"></div>
              </div>
            </div>
            <!-- monitor stand -->
            <div style="width:40px;height:6px;background:#b0ada4;border-radius:0 0 3px 3px;"></div>
            <div style="width:60px;height:4px;background:#a0a0a0;border-radius:2px;"></div>
            <div style="font-size:9px;color:#555;margin-top:2px;">Preview</div>
          </div>

          <!-- right panel -->
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;overflow:hidden;">

            <fieldset class="os-group" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
              <legend>Background</legend>
              <div style="color:#555;margin-bottom:4px;">
                Select a background picture or HTML document:
              </div>
              <div id="wp-list" class="os-listbox" style="flex:1;overflow-y:auto;"></div>
            </fieldset>

            <fieldset class="os-group">
              <legend>Position</legend>
              <select id="wp-pos" style="font-family:var(--font-ui);font-size:11px;padding:2px 6px;width:100%;">
                <option value="cover">Stretch (fill)</option>
                <option value="contain">Fit</option>
                <option value="auto">Tile</option>
                <option value="50% 50% / auto">Center</option>
              </select>
            </fieldset>

            <!-- dialog buttons -->
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button class="os-btn" onclick="Wallpaper._cancel()">Cancel</button>
              <button class="os-btn" onclick="Wallpaper._apply()">Apply</button>
              <button class="os-btn default" onclick="Wallpaper._ok()">OK</button>
            </div>

          </div>
        </div>
      </div>`;

    /* ── Populate wallpaper list ── */
    const list = container.querySelector('#wp-list');
    WALLPAPERS.forEach((wp, idx) => {
      const row = document.createElement('div');
      row.className = 'os-listbox-item';
      row.style.padding = '3px 6px';
      row.dataset.idx   = idx;

      const swatch = document.createElement('span');
      const imgSrc = wp.url || (wp.file ? `assets/bg/${wp.file}` : null);
      swatch.style.cssText = `display:inline-block;width:20px;height:14px;border:1px solid #888;flex-shrink:0;vertical-align:middle;
        ${imgSrc ? `background:url('${imgSrc}') center/cover;` : `background:${wp.color};`}`;

      row.appendChild(swatch);
      row.appendChild(document.createTextNode('\u00a0' + wp.name));

      row.addEventListener('click', () => {
        list.querySelectorAll('.os-listbox-item').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        container._selIdx = idx;
        _previewWp(container, idx);
      });

      if (idx === currentIdx) { row.classList.add('selected'); container._selIdx = idx; }
      list.appendChild(row);
    });

    _previewWp(container, currentIdx);

    /* scroll selected item into view */
    requestAnimationFrame(() => {
      list.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ── Update preview pane ── */
  function _previewWp(container, idx) {
    const wp = WALLPAPERS[idx]; if (!wp) return;
    const inner = container.querySelector('#wp-preview-inner'); if (!inner) return;
    const imgSrc = wp.url || (wp.file ? `assets/bg/${wp.file}` : null);
    if (imgSrc) {
      inner.style.backgroundImage    = `url('${imgSrc}')`;
      inner.style.backgroundSize     = 'cover';
      inner.style.backgroundPosition = 'center';
      inner.style.backgroundColor    = '#000';
    } else {
      inner.style.backgroundImage = 'none';
      inner.style.backgroundColor = wp.color;
    }
  }

  /* ── Get dialog container ── */
  function _dlg() {
    return document.querySelector('#win-__wp_dialog__ .window-content');
  }

  /* ── Apply button ── */
  function _apply() {
    const c = _dlg(); if (!c) return;
    const idx = c._selIdx ?? currentIdx;
    const wp  = WALLPAPERS[idx]; if (!wp) return;
    const pos = c.querySelector('#wp-pos')?.value || 'cover';
    currentIdx = idx;
    apply(wp, pos);
    try { localStorage.setItem(LS_KEY, JSON.stringify({ idx, position: pos })); } catch(_) {}
  }

  function _ok()     { _apply(); WM.close('__wp_dialog__'); }
  function _cancel() { WM.close('__wp_dialog__'); }

  function applyByEntry(entry) {
    const idx = WALLPAPERS.indexOf(entry);
    if (idx >= 0) currentIdx = idx;
    apply(entry, 'cover');
    try { localStorage.setItem(LS_KEY, JSON.stringify({ idx: idx >= 0 ? idx : currentIdx, position: 'cover' })); } catch(_) {}
  }

  return { loadSaved, openDialog, buildDialog, applyByEntry, _apply, _ok, _cancel };

})();
