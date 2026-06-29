/* ═══════════════════════════════════════════════
   WM.JS — Window Manager
════════════════════════════════════════════════ */

const WM = (() => {
  let windows = {};
  let zCounter = 100;
  let dragState = null;
  let resizeState = null;

  function open(app) {
    if (windows[app.id]) {
      const w = windows[app.id];
      w.minimized = false;
      w.el.classList.remove("minimized");
      focus(app.id);
      return;
    }

    const win = app.window;
    const isMobile = window.innerWidth <= 600;
    const el = document.createElement("div");
    el.className = "window focused";
    el.id = "win-" + app.id;

    if (isMobile) {
      el.style.width  = "100%";
      el.style.height = "calc(100vh - var(--taskbar-h))";
      el.style.left   = "0px";
      el.style.top    = "0px";
    } else {
      el.style.width  = Math.min(win.width  || 500, window.innerWidth  - 20) + "px";
      el.style.height = Math.min(win.height || 400, window.innerHeight - 60) + "px";
      const offset = (Object.keys(windows).length % 8) * 24;
      el.style.left = 60 + offset + "px";
      el.style.top  = 40 + offset + "px";
    }

    el.innerHTML = buildChrome(app);
    document.getElementById("window-layer").appendChild(el);
    windows[app.id] = { el, app, minimized: false };

    el.querySelector(".btn-close").onclick    = () => close(app.id);
    el.querySelector(".btn-minimize").onclick = () => minimize(app.id);
    el.querySelector(".btn-maximize").onclick = () => toggleMaximize(app.id);

    const titleBar = el.querySelector(".title-bar");
    // Mouse drag
    titleBar.addEventListener("mousedown", (e) => startDrag(e, app.id));
    // Touch drag
    titleBar.addEventListener("touchstart", (e) => startTouchDrag(e, app.id), { passive: false });

    el.querySelector(".resize-handle")?.addEventListener("mousedown", (e) => startResize(e, app.id));
    el.addEventListener("mousedown",  () => focus(app.id));
    el.addEventListener("touchstart", () => focus(app.id), { passive: true });

    renderContent(app, el.querySelector(".window-body"));
    addTaskbarItem(app);
    focus(app.id);
  }

  function buildChrome(app) {
    return `
      <div class="title-bar">
        <span class="title-bar-icon">${app.icon}</span>
        <span class="title-bar-text">${app.window.title || app.label}</span>
        <div class="title-bar-controls">
          <button class="title-btn btn-minimize" title="Minimize">─</button>
          <button class="title-btn btn-maximize" title="Maximize">□</button>
          <button class="title-btn btn-close"    title="Close">✕</button>
        </div>
      </div>
      <div class="window-body">
        <div class="window-content" style="width:100%;height:100%;"></div>
      </div>
      <div class="resize-handle"></div>`;
  }

  function renderContent(app, body) {
    const container = body.querySelector(".window-content");
    const win = app.window;

    switch (win.type) {
      case "html":
        container.innerHTML = `<div class="content-area" style="padding:12px;">${win.content}</div>`;
        break;

      case "page": {
        container.style.height = "100%";
        const iframe = document.createElement("iframe");
        iframe.src = win.src;
        iframe.style.cssText = "width:100%;height:100%;border:none;";
        container.appendChild(iframe);
        break;
      }

      case "projects":
        renderProjects(win, container);
        break;

      case "terminal":
        renderTerminal(container);
        break;

      case "winamp":
        renderWinamp(container);
        break;

      case "dosbox":
        renderDosbox(win, container);
        break;

      case "minesweeper":
        renderMinesweeper(container);
        break;

      case "solitaire":
        renderSolitaire(container);
        break;

      case "_folder":
        renderFolder(win.folderItem, container);
        break;

      case "_wallpaper_dialog":
        container.style.cssText = "height:100%;display:flex;flex-direction:column;overflow:hidden;";
        Wallpaper.buildDialog(container);
        break;

      case "_ss_dialog":
        container.style.cssText = "height:100%;display:flex;flex-direction:column;overflow:hidden;";
        Screensaver.buildDialog(container);
        break;

      case "_github_readme":
        renderGithubReadme(win, container);
        break;

      case "repo-list":
        renderRepoList(win, container);
        break;

      default:
        container.innerHTML = '<p style="padding:12px;font-family:var(--font-ui);font-size:11px;">No content defined.</p>';
    }
  }

  function renderFolder(folderItem, container) {
    container.style.cssText = "height:100%;display:flex;flex-direction:column;";

    const addr = document.createElement("div");
    addr.style.cssText = "flex-shrink:0;padding:3px 8px;border-bottom:1px solid #999;background:#f5f4ef;font-size:11px;font-family:var(--font-ui);display:flex;align-items:center;gap:6px;";
    addr.innerHTML = `<span>📁</span><span>${folderItem.label}</span>`;
    container.appendChild(addr);

    const grid = document.createElement("div");
    grid.style.cssText = "flex:1;display:flex;flex-wrap:wrap;gap:4px;padding:10px;overflow:auto;align-content:flex-start;";

    (folderItem.children || []).forEach((child) => {
      const icon = document.createElement("div");
      icon.className = "folder-child-icon";
      icon.innerHTML = `<div style="font-size:30px;margin-bottom:3px;">${child.icon}</div><div style="font-size:10px;line-height:1.3;word-break:break-word;">${child.label}</div>`;
      icon.title = child.label;
      icon.addEventListener("dblclick",  () => activateDesktopItem(child));
      icon.addEventListener("touchend",  (e) => { e.preventDefault(); activateDesktopItem(child); });
      icon.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        child._id = child._id || "fi-" + Math.random().toString(36).slice(2);
        CtxIcon._target = child;
        showCtxMenu("ctx-icon", e.clientX, e.clientY);
      });
      grid.appendChild(icon);
    });

    container.appendChild(grid);

    const status = document.createElement("div");
    status.style.cssText = "flex-shrink:0;padding:2px 8px;border-top:1px solid #bbb;font-size:10px;font-family:var(--font-ui);color:#555;";
    status.textContent = `${(folderItem.children || []).length} object(s)`;
    container.appendChild(status);
  }

  function renderProjects(win, container) {
    const isList = win.cardMode === "list";
    let html = `<div class="${isList ? "os-listbox" : "project-grid"}" style="height:100%;overflow:auto;">`;
    for (const p of win.projects || []) {
      if (isList) {
        html += `
          <div class="os-listbox-item" onclick="openProjectPage('${p.link || ""}','${p.title}','${p.icon || "📄"}')" style="padding:8px;cursor:pointer;">
            <span style="font-size:18px;">${p.icon}</span>
            <div>
              <div style="font-weight:bold;">${p.title}</div>
              <div style="font-size:10px;color:#555;">${p.desc}</div>
              <div style="margin-top:3px;">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
            </div>
          </div>`;
      } else {
        html += `
          <div class="project-card" onclick="openProjectPage('${p.link || ""}','${p.title}','${p.icon || "📄"}')">
            <div class="card-icon">${p.icon}</div>
            <div class="card-title">${p.title}</div>
            <div class="card-desc">${p.desc}</div>
            <div class="card-tags">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          </div>`;
      }
    }
    html += "</div>";
    container.innerHTML = html;
    container.style.height = "100%";
  }

  /* ══════════════════════════════════════════════════════════════════
     TERMINAL — uses a simple DIV-based terminal (no xterm.js dependency)
  ══════════════════════════════════════════════════════════════════ */
  function renderTerminal(container) {
    container.style.cssText = 'height:100%;display:flex;flex-direction:column;overflow:hidden;background:#0d0d0d;';

    // Output area
    const output = document.createElement('div');
    output.style.cssText = 'flex:1;overflow-y:auto;padding:8px 10px;font-family:"Cascadia Code","Fira Code","Courier New",monospace;font-size:13px;line-height:1.5;color:#39ff14;white-space:pre-wrap;word-break:break-all;';
    container.appendChild(output);

    // Input row
    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'flex-shrink:0;display:flex;align-items:center;padding:4px 8px;border-top:1px solid #1a3a1a;background:#080808;';
    container.appendChild(inputRow);

    const prompt = document.createElement('span');
    prompt.style.cssText = 'color:#39ff14;font-family:"Cascadia Code","Fira Code","Courier New",monospace;font-size:13px;white-space:nowrap;margin-right:6px;';
    prompt.textContent = '$ ';
    inputRow.appendChild(prompt);

    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.style.cssText = 'flex:1;background:transparent;border:none;outline:none;color:#39ff14;font-family:"Cascadia Code","Fira Code","Courier New",monospace;font-size:13px;caret-color:#39ff14;';
    inputRow.appendChild(input);

    // Focus input when clicking anywhere in terminal
    container.addEventListener('click', () => input.focus());

    const history = [];
    let histIdx = -1;
    let busy = false;

    function appendLine(text, color) {
      const line = document.createElement('div');
      line.style.color = color || '#39ff14';
      line.style.fontFamily = '"Cascadia Code","Fira Code","Courier New",monospace';
      line.style.fontSize = '13px';
      line.style.lineHeight = '1.5';
      line.style.whiteSpace = 'pre-wrap';
      line.style.wordBreak = 'break-all';
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function appendHTML(html) {
      const div = document.createElement('div');
      div.style.fontFamily = '"Cascadia Code","Fira Code","Courier New",monospace';
      div.style.fontSize = '13px';
      div.style.lineHeight = '1.5';
      div.innerHTML = html;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    function spinnerObj(msg) {
      const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
      let i = 0;
      const el = document.createElement('div');
      el.style.color = '#39ff14';
      el.style.fontFamily = '"Cascadia Code","Fira Code","Courier New",monospace';
      el.style.fontSize = '13px';
      el.textContent = frames[0] + ' ' + msg;
      output.appendChild(el);
      output.scrollTop = output.scrollHeight;
      const iv = setInterval(() => {
        el.textContent = frames[++i % frames.length] + ' ' + msg;
      }, 80);
      return {
        stop() {
          clearInterval(iv);
          el.remove();
        }
      };
    }

    async function runCmd(raw) {
      if (busy || !raw.trim()) return;
      busy = true;
      input.disabled = true;

      history.unshift(raw);
      histIdx = -1;

      appendLine('$ ' + raw, '#88aaff');

      const [cmd, ...args] = raw.trim().split(/\s+/);
      const fn = TERMINAL_COMMANDS[cmd];

      if (!fn) {
        appendLine(`bash: ${cmd}: command not found`, '#ff5555');
        appendLine(`Type 'help' to see available commands.`, '#555');
      } else {
        try {
          let result = fn(args, {
            print:     (t, c) => appendLine(t, c === 'err' ? '#ff5555' : c === 'dim' ? '#555' : c === 'warn' ? '#ffcc44' : '#39ff14'),
            printHTML: appendHTML,
            spinner:   spinnerObj,
          });
          if (result && typeof result.then === 'function') result = await result;
          if (result === '__clear__') {
            output.innerHTML = '';
          } else if (result && typeof result === 'object' && result.html) {
            appendHTML(result.html);
          } else if (result) {
            appendLine(String(result));
          }
        } catch (e) {
          appendLine('Error: ' + e.message, '#ff5555');
        }
      }

      busy = false;
      input.disabled = false;
      input.focus();
    }

    // Boot message
    appendLine('Portfolio OS [Version X.X.X]');
    appendLine("Type 'help' for available commands.", '#555');
    appendLine('');

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const raw = input.value;
        input.value = '';
        await runCmd(raw);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        histIdx = Math.min(histIdx + 1, history.length - 1);
        input.value = history[histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        histIdx = Math.max(histIdx - 1, -1);
        input.value = histIdx >= 0 ? history[histIdx] : '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value;
        const matches = Object.keys(TERMINAL_COMMANDS).filter(k => k.startsWith(partial));
        if (matches.length === 1) {
          input.value = matches[0];
        } else if (matches.length > 1) {
          appendLine(matches.join('  '), '#555');
        }
      } else if (e.key === 'c' && e.ctrlKey) {
        appendLine('^C', '#ff5555');
        input.value = '';
        busy = false;
        input.disabled = false;
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        output.innerHTML = '';
      }
    });

    // Focus on open
    setTimeout(() => input.focus(), 100);
  }

  function focus(id) {
    Object.entries(windows).forEach(([wid, w]) => w.el.classList.toggle("focused", wid === id));
    windows[id].el.style.zIndex = ++zCounter;
    updateTaskbar(id);
    if (id === 'winamp') {
      const wc = document.getElementById('__webamp_container__');
      if (wc) wc.style.display = '';
      const sw = document.getElementById('__webamp_scale_wrap__');
      if (sw) sw.style.display = '';
    }
  }

  function minimize(id) {
    windows[id].minimized = true;
    windows[id].el.classList.add("minimized");
    updateTaskbar(null);
    if (id === 'winamp') {
      const wc = document.getElementById('__webamp_container__');
      if (wc) wc.style.display = 'none';
      const sw = document.getElementById('__webamp_scale_wrap__');
      if (sw) sw.style.display = 'none';
    }
  }

  function toggleMaximize(id) {
    const el = windows[id].el;
    if (el.dataset.maximized) {
      Object.assign(el.style, JSON.parse(el.dataset.prevStyle));
      delete el.dataset.maximized;
      delete el.dataset.prevStyle;
    } else {
      el.dataset.prevStyle = JSON.stringify({ left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height });
      el.dataset.maximized = "1";
      Object.assign(el.style, { left: "0", top: "0", width: "100%", height: "calc(100vh - var(--taskbar-h))" });
    }
  }

  function close(id) {
    if (!windows[id]) return;
    const winEl      = windows[id].el;
    const winContent = winEl.querySelector('.window-content');

    /* ── Kill DOS emulator + audio ── */
    if (winContent && winContent._dosCi) {
      const ci = winContent._dosCi;
      try { ci.exit();   } catch (_) {}
      try { ci.stop();   } catch (_) {}
      try { ci.destroy(); } catch (_) {}
      /* Belt-and-suspenders: close any Web Audio context the emulator opened */
      try {
        if (ci.emulator?.audioContext)       ci.emulator.audioContext.close();
        if (ci.ci?.audioContext)             ci.ci.audioContext.close();
      } catch (_) {}
      winContent._dosCi = null;
    }

    /* Kill ALL AudioContexts on the page that are running
       (js-dos doesn't always expose its context — catch them all) */
    try {
      if (window._dosAudioContexts) {
        window._dosAudioContexts.forEach(ctx => { try { ctx.close(); } catch(_){} });
        window._dosAudioContexts = [];
      }
    } catch (_) {}

    winEl.remove();
    delete windows[id];
    removeTaskbarItem(id);
    if (id === 'winamp') {
      document.getElementById('__webamp_frame__')?.remove();
      document.getElementById('__webamp_container__')?.remove();
      document.getElementById('__webamp_scale_wrap__')?.remove();
    }
  }

  function addTaskbarItem(app) {
    const btn = document.createElement("button");
    btn.className = "taskbar-item active";
    btn.id = "tb-" + app.id;
    btn.innerHTML = `<span>${app.icon}</span><span style="overflow:hidden;text-overflow:ellipsis;">${app.label}</span>`;
    btn.onclick = () => {
      const w = windows[app.id];
      if (!w) return;
      if (w.minimized) {
        w.minimized = false;
        w.el.classList.remove("minimized");
        focus(app.id);
      } else if (w.el.classList.contains("focused")) {
        minimize(app.id);
      } else {
        focus(app.id);
      }
    };
    document.getElementById("taskbar-items").appendChild(btn);
  }

  function removeTaskbarItem(id) { document.getElementById("tb-" + id)?.remove(); }

  function updateTaskbar(activeId) {
    document.querySelectorAll(".taskbar-item").forEach((btn) => {
      btn.classList.toggle("active", btn.id === "tb-" + activeId);
    });
  }

  // ── Mouse drag ──
  function startDrag(e, id) {
    if (e.target.closest(".title-bar-controls")) return;
    focus(id);
    const el = windows[id].el, rect = el.getBoundingClientRect();
    dragState = { id, startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top };
    e.preventDefault();
  }

  // ── Touch drag ──
  function startTouchDrag(e, id) {
    if (e.target.closest(".title-bar-controls")) return;
    focus(id);
    const touch = e.touches[0];
    const el = windows[id].el, rect = el.getBoundingClientRect();
    dragState = { id, startX: touch.clientX, startY: touch.clientY, origLeft: rect.left, origTop: rect.top, isTouch: true };
    e.preventDefault();
  }

  function startResize(e, id) {
    const el = windows[id].el;
    resizeState = { id, startX: e.clientX, startY: e.clientY, origW: el.offsetWidth, origH: el.offsetHeight };
    e.preventDefault();
    e.stopPropagation();
  }

  document.addEventListener("mousemove", (e) => {
    if (dragState && !dragState.isTouch) {
      const { id, startX, startY, origLeft, origTop } = dragState;
      const el = windows[id].el;
      el.style.left = Math.max(0, origLeft + e.clientX - startX) + "px";
      el.style.top  = Math.max(0, origTop  + e.clientY - startY) + "px";
    }
    if (resizeState) {
      const { id, startX, startY, origW, origH } = resizeState;
      const el = windows[id].el;
      el.style.width  = Math.max(280, origW + e.clientX - startX) + "px";
      el.style.height = Math.max(180, origH + e.clientY - startY) + "px";
    }
  });

  document.addEventListener("mouseup", () => { dragState = null; resizeState = null; });

  document.addEventListener("touchmove", (e) => {
    if (dragState && dragState.isTouch) {
      const touch = e.touches[0];
      const { id, startX, startY, origLeft, origTop } = dragState;
      const el = windows[id].el;
      el.style.left = Math.max(0, origLeft + touch.clientX - startX) + "px";
      el.style.top  = Math.max(0, origTop  + touch.clientY - startY) + "px";
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener("touchend", () => { dragState = null; resizeState = null; });

  function renderWinamp(container) {
    // Collapse the WM shell to nothing — Webamp draws its own windows.
    // We keep the shell alive purely for taskbar tracking.
    const winEl = container.closest('.window');
    if (winEl) {
      winEl.style.cssText =
        'position:absolute;width:0;height:0;min-width:0;min-height:0;' +
        'border:none;outline:none;box-shadow:none;background:transparent;' +
        'overflow:visible;pointer-events:none;left:0;top:0;';
      winEl.querySelector('.title-bar')?.remove();
      winEl.querySelector('.window-body')?.remove();
      winEl.querySelector('.resize-handle')?.remove();
    }

    const TRACKS = (typeof WINAMP_TRACKS !== 'undefined' ? WINAMP_TRACKS : [
      { metaData: { artist: 'Linkin Park', title: 'In The End (Mellen Gi & Tommee Profitt Remix)' },
        url: 'https://archive.org/download/linkinparkintheendmellengiamptommeeprofittremix/Linkin%20Park%20-%20In%20The%20End%20%28Mellen%20Gi%20%26amp%3B%20Tommee%20Profitt%20Remix%29.mp3' },
    ]);
    const availableSkins = (typeof WINAMP_SKINS !== 'undefined' ? WINAMP_SKINS : []);

    // Destroy any previous instance
    document.getElementById('__webamp_container__')?.remove();
    document.getElementById('__webamp_scale_wrap__')?.remove();

    // Mobile: Webamp panels are hardcoded ~275px wide and cannot reflow.
    // We wrap them in a scaled fixed overlay so everything fits the screen.
    const isMobile = window.innerWidth <= 600;
    const taskbarH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h')
    ) || 40;
    const availH = window.innerHeight - taskbarH;
    const availW = window.innerWidth;

    // Webamp three-panel stack: ~275px wide x ~268px tall
    const WEBAMP_W = 275;
    const WEBAMP_H = 268;
    const scale = isMobile
      ? Math.min((availW - 8) / WEBAMP_W, (availH - 8) / WEBAMP_H, 1)
      : 1;

    let waContainer;

    if (isMobile) {
      const scaleWrap = document.createElement('div');
      scaleWrap.id = '__webamp_scale_wrap__';
      scaleWrap.style.cssText =
        'position:fixed;top:0;left:0;width:' + availW + 'px;height:' + availH + 'px;' +
        'z-index:9000;overflow:hidden;pointer-events:none;';

      const scaledW = WEBAMP_W * scale;
      const scaledH = WEBAMP_H * scale;
      const offsetL = Math.round((availW - scaledW) / 2);
      const offsetT = Math.round((availH - scaledH) / 2);

      waContainer = document.createElement('div');
      waContainer.id = '__webamp_container__';
      waContainer.style.cssText =
        'position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;' +
        'transform:scale(' + scale + ');transform-origin:top left;' +
        'margin-top:' + offsetT + 'px;margin-left:' + offsetL + 'px;';

      scaleWrap.appendChild(waContainer);
      document.body.appendChild(scaleWrap);
    } else {
      waContainer = document.createElement('div');
      waContainer.id = '__webamp_container__';
      waContainer.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;';
      document.body.appendChild(waContainer);
    }

    function enablePointerEvents() {
      const wrap = document.getElementById('__webamp_scale_wrap__');
      if (wrap) wrap.style.pointerEvents = '';
      waContainer.style.pointerEvents = '';
    }

    function initWebamp() {
      const mainTop  = isMobile ? 0 : 40;
      const mainLeft = isMobile ? 0 : 60;

      const opts = {
        initialTracks: TRACKS,
        zIndex: 9000,
        windowLayout: {
          main:      { position: { top: mainTop,       left: mainLeft }, closed: false },
          equalizer: { position: { top: mainTop + 116, left: mainLeft }, closed: false },
          playlist:  { position: { top: mainTop + 152, left: mainLeft }, closed: false,
                       size: { extraHeight: 4, extraWidth: 0 } },
        },
      };
      if (availableSkins.length > 0) opts.availableSkins = availableSkins;

      try {
        const wa = new Webamp(opts);
        wa.renderWhenReady(waContainer)
          .then(() => setTimeout(enablePointerEvents, 400))
          .catch(e => console.error('Webamp render failed:', e));
        wa.onClose(() => {
          WM.close('winamp');
          waContainer.remove();
          document.getElementById('__webamp_scale_wrap__')?.remove();
        });
      } catch (e) {
        console.error('Webamp init error:', e);
      }
    }

    if (typeof Webamp !== 'undefined') {
      initWebamp();
    } else {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.js';
      s.onload  = initWebamp;
      s.onerror = () => console.error('Could not load Webamp bundle.');
      document.head.appendChild(s);
    }
  }


  function renderDosbox(win, container) {
    container.style.cssText = 'height:100%;width:100%;background:#000;overflow:hidden;position:relative;';

    /* ── Track AudioContexts so we can kill audio on close ── */
    if (!window._audioCtxPatched) {
      window._dosAudioContexts = [];
      const OrigAC = window.AudioContext || window.webkitAudioContext;
      if (OrigAC) {
        window.AudioContext = function(...a) {
          const ctx = new OrigAC(...a);
          window._dosAudioContexts.push(ctx);
          return ctx;
        };
        window.AudioContext.prototype = OrigAC.prototype;
        if (window.webkitAudioContext) window.webkitAudioContext = window.AudioContext;
      }
      window._audioCtxPatched = true;
    }

    /* ── Loading overlay ── */
    const status = document.createElement('div');
    status.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#39ff14;font-family:"Courier New",monospace;font-size:13px;gap:10px;z-index:30;background:#000;';
    status.innerHTML =
      '<div style="font-size:32px;">\uD83D\uDDA5\uFE0F</div>' +
      '<div id="_dos_msg">Loading DOS\u2026</div>' +
      '<div style="width:200px;height:6px;background:#111;border:1px solid #39ff14;border-radius:3px;overflow:hidden;">' +
      '<div id="_dos_fill" style="height:100%;width:0%;background:#39ff14;transition:width 0.3s;"></div></div>';
    container.appendChild(status);

    /* ── Mount point ── */
    const dosEl = document.createElement('div');
    dosEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;';
    container.appendChild(dosEl);

    /* ── MutationObserver: hide chrome, fill canvas ── */
    function applyToNode(node) {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'CANVAS') {
        node.style.cssText = 'position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;display:block!important;';
        let el = node.parentElement;
        while (el && el !== dosEl) {
          el.style.cssText = 'position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;overflow:hidden!important;';
          el = el.parentElement;
        }
        status.style.transition = 'opacity 0.5s';
        status.style.opacity = '0';
        setTimeout(function() { try { status.remove(); } catch(_){} }, 550);
      } else {
        setTimeout(function() {
          if (!node.querySelector('canvas')) {
            node.style.setProperty('display', 'none', 'important');
          }
        }, 0);
      }
    }

    const obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) { m.addedNodes.forEach(applyToNode); });
    });
    obs.observe(dosEl, { childList: true, subtree: true });

    function setMsg(txt, pct) {
      var m = document.getElementById('_dos_msg');
      var f = document.getElementById('_dos_fill');
      if (m) m.textContent = txt;
      if (f && pct != null) f.style.width = Math.min(100, pct) + '%';
    }

    function start() {
      /* Remove any js-dos CSS injected previously */
      var oldCss = document.getElementById('__jsdos_css__');
      if (oldCss) oldCss.remove();

      try {
        /* js-dos v8: Dos(el, opts) returns ci synchronously.
           ci.ready is a Promise that resolves when emulator is running.
           Do NOT pass backend — let js-dos pick automatically. */
        var ci = Dos(dosEl, {
          url: win.bundleUrl,
          onprogress: function(stage, total, loaded) {
            var pct = total > 0 ? Math.round(loaded / total * 100) : 0;
            setMsg(stage + ' ' + pct + '%', pct);
          },
        });

        /* ci may be the object directly or a thenable depending on build */
        if (ci && typeof ci.then === 'function') {
          ci.then(function(c) {
            container._dosCi = c;
            obs.disconnect();
          }).catch(function(e) {
            console.error('js-dos:', e);
            setMsg('\u26A0\uFE0F Failed: ' + e.message);
          });
        } else {
          /* Synchronous return — .ready may or may not exist */
          container._dosCi = ci;
          obs.disconnect();
          if (ci && ci.ready && typeof ci.ready.then === 'function') {
            ci.ready.catch(function(e) {
              console.error('js-dos ready:', e);
              setMsg('\u26A0\uFE0F ' + e.message);
            });
          }
        }
      } catch(e) {
        console.error('js-dos init:', e);
        setMsg('\u26A0\uFE0F ' + e.message);
      }
    }

    if (typeof Dos !== 'undefined') {
      start();
    } else {
      var s = document.createElement('script');
      s.src = 'https://v8.js-dos.com/latest/js-dos.js';
      s.onload = start;
      s.onerror = function() { setMsg('\u26A0\uFE0F Could not load js-dos.'); };
      document.head.appendChild(s);
    }
  }

    function renderMinesweeper(container) {
    container.style.cssText = 'height:100%;display:flex;flex-direction:column;align-items:center;background:#c0c0c0;font-family:Tahoma,sans-serif;overflow:auto;';

    const ROWS = 9, COLS = 9, MINES = 10;
    let board = [], revealed = [], flagged = [], gameOver = false, gameWon = false, firstClick = true, timerVal = 0, timerInterval = null, minesLeft = MINES;

    function initBoard() {
      board    = Array.from({length:ROWS}, () => Array(COLS).fill(0));
      revealed = Array.from({length:ROWS}, () => Array(COLS).fill(false));
      flagged  = Array.from({length:ROWS}, () => Array(COLS).fill(false));
      gameOver = false; gameWon = false; firstClick = true;
      timerVal = 0; minesLeft = MINES;
      clearInterval(timerInterval);
    }

    function placeMines(safeR, safeC) {
      let placed = 0;
      while (placed < MINES) {
        const r = Math.floor(Math.random()*ROWS), c = Math.floor(Math.random()*COLS);
        if (board[r][c] === -1 || (Math.abs(r-safeR)<=1 && Math.abs(c-safeC)<=1)) continue;
        board[r][c] = -1; placed++;
      }
      for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
        if (board[r][c]===-1) continue;
        let n=0;
        for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
          const nr=r+dr, nc=c+dc;
          if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc]===-1) n++;
        }
        board[r][c]=n;
      }
    }

    function reveal(r, c) {
      if (r<0||r>=ROWS||c<0||c>=COLS||revealed[r][c]||flagged[r][c]) return;
      revealed[r][c] = true;
      if (board[r][c] === 0) for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) reveal(r+dr,c+dc);
    }

    function checkWin() {
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++)
        if (!revealed[r][c] && board[r][c]!==-1) return false;
      return true;
    }

    // Long-press for flag on mobile
    let longPressTimer = null;

    function render() {
      container.innerHTML = '';

      const bar = document.createElement('div');
      bar.style.cssText = 'width:100%;display:flex;justify-content:space-between;align-items:center;padding:6px 14px;background:#c0c0c0;border-bottom:2px solid #808080;box-sizing:border-box;';

      const mineCounter = document.createElement('div');
      mineCounter.style.cssText = 'background:#000;color:#f00;font-family:"Courier New",monospace;font-size:20px;font-weight:bold;padding:2px 6px;min-width:48px;text-align:right;letter-spacing:2px;';
      mineCounter.textContent = String(minesLeft).padStart(3, '0');

      const resetBtn = document.createElement('button');
      resetBtn.style.cssText = 'font-size:20px;cursor:pointer;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:2px 8px;';
      resetBtn.textContent = gameOver ? '😵' : gameWon ? '😎' : '🙂';
      resetBtn.onclick = () => { initBoard(); render(); };

      const timer = document.createElement('div');
      timer.style.cssText = 'background:#000;color:#f00;font-family:"Courier New",monospace;font-size:20px;font-weight:bold;padding:2px 6px;min-width:48px;text-align:right;letter-spacing:2px;';
      timer.textContent = String(timerVal).padStart(3, '0');

      bar.append(mineCounter, resetBtn, timer);
      container.appendChild(bar);

      const grid = document.createElement('div');
      grid.style.cssText = `display:grid;grid-template-columns:repeat(${COLS},32px);gap:0;margin:10px;border:3px solid;border-color:#808080 #fff #fff #808080;`;

      for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:bold;cursor:pointer;user-select:none;box-sizing:border-box;';

        const numColors = ['','#0000ff','#006600','#ff0000','#000099','#880000','#008888','#000000','#888888'];

        if (revealed[r][c]) {
          cell.style.background = '#c0c0c0';
          cell.style.border = '1px solid #808080';
          if (board[r][c] === -1) {
            cell.textContent = '💣';
            cell.style.background = gameOver ? '#f00' : '#c0c0c0';
          } else if (board[r][c] > 0) {
            cell.textContent = board[r][c];
            cell.style.color = numColors[board[r][c]];
          }
        } else {
          cell.style.cssText += 'border:2px solid;border-color:#fff #808080 #808080 #fff;background:#c0c0c0;';
          if (flagged[r][c]) cell.textContent = '🚩';
          else if (gameOver && board[r][c]===-1) cell.textContent = '💣';
        }

        const handleReveal = () => {
          if (gameOver || gameWon || flagged[r][c]) return;
          if (firstClick) {
            firstClick = false;
            placeMines(r, c);
            timerInterval = setInterval(() => { timerVal = Math.min(999, timerVal+1); timer.textContent = String(timerVal).padStart(3,'0'); }, 1000);
          }
          if (board[r][c] === -1) {
            revealed[r][c] = true;
            gameOver = true;
            clearInterval(timerInterval);
            for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) if (board[rr][cc]===-1) revealed[rr][cc]=true;
            render(); return;
          }
          reveal(r, c);
          if (checkWin()) { gameWon = true; clearInterval(timerInterval); minesLeft = 0; }
          render();
        };

        const handleFlag = (e) => {
          if (e) e.preventDefault();
          if (gameOver || gameWon || revealed[r][c]) return;
          flagged[r][c] = !flagged[r][c];
          minesLeft += flagged[r][c] ? -1 : 1;
          render();
        };

        cell.addEventListener('click', handleReveal);
        cell.addEventListener('contextmenu', handleFlag);

        // Mobile long-press to flag
        cell.addEventListener('touchstart', () => {
          longPressTimer = setTimeout(() => { handleFlag(null); }, 500);
        }, { passive: true });
        cell.addEventListener('touchend', (e) => {
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });
        cell.addEventListener('touchmove', () => {
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });

        grid.appendChild(cell);
      }
      container.appendChild(grid);

      if (gameWon) {
        const msg = document.createElement('div');
        msg.style.cssText = 'color:#006600;font-weight:bold;font-size:13px;margin-bottom:8px;';
        msg.textContent = '🎉 You win! Click 😎 to play again.';
        container.appendChild(msg);
      }
    }

    initBoard();
    render();
  }

  function renderSolitaire(container) {
    container.style.cssText = 'height:100%;background:#006600;overflow:hidden;position:relative;user-select:none;';

    const SUITS = ['♠','♥','♦','♣'];
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const RED   = new Set(['♥','♦']);

    function makeDeck() {
      const d = [];
      for (const s of SUITS) for (const r of RANKS) d.push({suit:s, rank:r, faceUp:false});
      for (let i=d.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
      return d;
    }

    let deck, waste, tableau, foundations, dragInfo=null, score=0;

    function rankIdx(r)  { return RANKS.indexOf(r); }
    function isRed(card) { return RED.has(card.suit); }

    function canStackTableau(card, col) {
      const t = tableau[col];
      if (!t.length) return card.rank === 'K';
      const top = t[t.length-1];
      return top.faceUp && isRed(top) !== isRed(card) && rankIdx(top.rank) === rankIdx(card.rank)+1;
    }

    function canStackFoundation(card, fi) {
      const f = foundations[fi];
      if (!f.length) return card.rank === 'A';
      const top = f[f.length-1];
      return top.suit === card.suit && rankIdx(card.rank) === rankIdx(top.rank)+1;
    }

    function initGame() {
      deck = makeDeck(); waste = []; foundations = [[],[],[],[]]; tableau = Array.from({length:7},()=>[]); score = 0;
      for (let col=0;col<7;col++) {
        for (let row=0;row<=col;row++) { const c=deck.pop(); c.faceUp=(row===col); tableau[col].push(c); }
      }
    }

    const CW=56, CH=78, OVERLAP=20, PAD=8, TOP=90;

    function cardEl(card, x, y, zIndex) {
      const el = document.createElement('div');
      const col = card.faceUp && isRed(card) ? '#c00' : '#000';
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${CW}px;height:${CH}px;
        background:#fff;border:1px solid #888;border-radius:4px;
        box-shadow:1px 1px 3px rgba(0,0,0,0.4);z-index:${zIndex};
        cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;padding:2px 3px;
        font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:${col};`;
      if (!card.faceUp) {
        el.style.background = 'repeating-linear-gradient(45deg,#1a5c9e,#1a5c9e 4px,#174f88 4px,#174f88 8px)';
        el.style.cursor = 'default';
      } else {
        el.innerHTML = `<div>${card.rank}${card.suit}</div><div style="align-self:flex-end;transform:rotate(180deg);">${card.rank}${card.suit}</div>`;
      }
      return el;
    }

    function emptySlot(x, y, label) {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${CW}px;height:${CH}px;
        border:2px dashed rgba(255,255,255,0.4);border-radius:4px;
        display:flex;align-items:center;justify-content:center;
        color:rgba(255,255,255,0.4);font-size:10px;font-family:Arial,sans-serif;`;
      el.textContent = label;
      return el;
    }

    function colX(col) { return PAD + col*(CW+8); }

    function render() {
      container.innerHTML = '';

      const hdr = document.createElement('div');
      hdr.style.cssText = 'position:absolute;top:4px;right:8px;color:#fff;font-family:Tahoma,sans-serif;font-size:11px;display:flex;gap:10px;align-items:center;';
      hdr.innerHTML = `<span>Score: <b>${score}</b></span>`;
      const newBtn = document.createElement('button');
      newBtn.textContent = '🔄 New Game';
      newBtn.style.cssText = 'font-size:10px;padding:2px 8px;cursor:pointer;font-family:Tahoma,sans-serif;';
      newBtn.onclick = () => { initGame(); render(); };
      hdr.appendChild(newBtn);
      container.appendChild(hdr);

      const deckX = PAD, deckY = PAD+4;
      if (deck.length) {
        const dc = document.createElement('div');
        dc.style.cssText = `position:absolute;left:${deckX}px;top:${deckY}px;width:${CW}px;height:${CH}px;
          background:repeating-linear-gradient(45deg,#1a5c9e,#1a5c9e 4px,#174f88 4px,#174f88 8px);
          border:1px solid #888;border-radius:4px;box-shadow:1px 1px 3px rgba(0,0,0,0.4);cursor:pointer;`;
        dc.onclick = () => { const c = deck.pop(); c.faceUp = true; waste.push(c); score = Math.max(0, score-2); render(); };
        container.appendChild(dc);
      } else {
        const emp = emptySlot(deckX, deckY, '↺');
        emp.style.cursor = 'pointer';
        emp.onclick = () => { if (!waste.length) return; deck = waste.reverse().map(c => ({...c, faceUp:false})); waste = []; score = Math.max(0, score-100); render(); };
        container.appendChild(emp);
      }

      const wasteX = PAD+CW+8;
      if (waste.length) {
        const top = waste[waste.length-1];
        const we = cardEl(top, wasteX, deckY, 5);
        we.dataset.src = 'waste';
        we.addEventListener('mousedown', e => startCardDrag(e, 'waste', waste.length-1, [top], wasteX, deckY));
        container.appendChild(we);
      } else {
        container.appendChild(emptySlot(wasteX, deckY, ''));
      }

      for (let fi=0;fi<4;fi++) {
        const fx = colX(3+fi), fy = deckY;
        if (foundations[fi].length) {
          const top = foundations[fi][foundations[fi].length-1];
          const fe = cardEl(top, fx, fy, 5);
          container.appendChild(fe);
        } else {
          const emp = emptySlot(fx, fy, SUITS[fi]);
          container.appendChild(emp);
        }
        const dz = document.createElement('div');
        dz.style.cssText = `position:absolute;left:${fx}px;top:${fy}px;width:${CW}px;height:${CH}px;z-index:6;`;
        dz.dataset.dropFoundation = fi;
        container.appendChild(dz);
      }

      for (let col=0;col<7;col++) {
        const tx = colX(col);
        if (!tableau[col].length) {
          const emp = emptySlot(tx, TOP, '');
          emp.dataset.dropTableau = col;
          emp.style.zIndex = 1;
          container.appendChild(emp);
        }
        tableau[col].forEach((card, row) => {
          const ty = TOP + row*OVERLAP;
          const isLast = row === tableau[col].length-1;
          const el = cardEl(card, tx, ty, 10+row);
          if (!card.faceUp && isLast) {
            el.style.cursor = 'pointer';
            el.onclick = () => { card.faceUp = true; score += 5; render(); };
          }
          if (card.faceUp) {
            const run = tableau[col].slice(row);
            el.addEventListener('mousedown', e => startCardDrag(e, 'tableau', col, run, tx, ty, row));
          }
          if (isLast) {
            const dz = document.createElement('div');
            dz.style.cssText = `position:absolute;left:${tx}px;top:${ty}px;width:${CW}px;height:${CH}px;z-index:${20+row};pointer-events:none;`;
            dz.dataset.dropTableau = col;
            container.appendChild(dz);
          }
          container.appendChild(el);
        });
      }

      if (foundations.every(f=>f.length===13)) {
        const win = document.createElement('div');
        win.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,80,0,0.85);color:#fff;font-family:Tahoma,sans-serif;font-size:24px;font-weight:bold;z-index:9999;';
        win.innerHTML = `<div>🎉 YOU WIN! 🎉</div><div style="font-size:14px;margin-top:10px;">Score: ${score}</div>
          <button style="margin-top:16px;padding:6px 20px;font-size:12px;cursor:pointer;">Play Again</button>`;
        win.querySelector('button').onclick = () => { initGame(); render(); };
        container.appendChild(win);
      }
    }

    function startCardDrag(e, src, srcIdx, cards, startX, startY, runRow) {
      e.preventDefault(); e.stopPropagation();
      if (!cards[0].faceUp) return;

      const ghost = document.createElement('div');
      ghost.style.cssText = `position:fixed;pointer-events:none;z-index:99999;`;
      cards.forEach((card, i) => {
        const el = cardEl(card, 0, i*OVERLAP, i);
        el.style.position = 'relative';
        el.style.left = '0';
        el.style.top = i === 0 ? '0' : -CH+OVERLAP+'px';
        el.style.marginTop = i === 0 ? '0' : (OVERLAP-CH)+'px';
        ghost.appendChild(el);
      });
      const rect = e.currentTarget.getBoundingClientRect();
      const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
      ghost.style.left = (e.clientX - offX) + 'px';
      ghost.style.top  = (e.clientY - offY) + 'px';
      document.body.appendChild(ghost);

      dragInfo = { src, srcIdx, cards, runRow, ghost };

      function onMove(ev) {
        ghost.style.left = (ev.clientX - offX) + 'px';
        ghost.style.top  = (ev.clientY - offY) + 'px';
      }
      function onUp(ev) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
        dropCards(ev, cards, src, srcIdx, runRow);
        dragInfo = null;
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    function dropCards(e, cards, src, srcIdx, runRow) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) { render(); return; }
      const fi = el.closest('[data-drop-foundation]')?.dataset?.dropFoundation;
      if (fi != null && cards.length === 1) {
        const fIdx = parseInt(fi);
        if (canStackFoundation(cards[0], fIdx)) {
          removeFromSource(src, srcIdx, runRow);
          foundations[fIdx].push(cards[0]);
          score += 10;
          render(); return;
        }
      }
      let dtEl = el;
      let col = dtEl.dataset?.dropTableau;
      if (col == null) dtEl = dtEl.closest('[data-drop-tableau]');
      if (dtEl) col = dtEl?.dataset?.dropTableau;
      if (col != null) {
        const cIdx = parseInt(col);
        if (canStackTableau(cards[0], cIdx)) {
          removeFromSource(src, srcIdx, runRow);
          cards.forEach(c => tableau[cIdx].push(c));
          score += 5;
          render(); return;
        }
      }
      render();
    }

    function removeFromSource(src, srcIdx, runRow) {
      if (src === 'waste') {
        waste.pop();
      } else if (src === 'tableau') {
        tableau[srcIdx].splice(runRow);
        const t = tableau[srcIdx];
        if (t.length && !t[t.length-1].faceUp) { t[t.length-1].faceUp = true; score += 5; }
      }
    }

    initGame();
    render();
  }

  return { open, close, focus, minimize };
})();


/* ══════════════════════════════════════════════════════════════════
   GLOBAL HELPERS
══════════════════════════════════════════════════════════════════ */

function openApp(id) {
  if (id === '__bsod__') { showBSOD(); return; }
  const app = APPS.find((a) => a.id === id);
  if (app) WM.open(app);
  hideAllCtx();
}

function openProjectPage(link, title, icon) {
  if (!link) {
    WM.open({
      id: "soon-" + title.replace(/\s+/g, "-"),
      label: title,
      icon: icon || "📄",
      window: {
        title: title + " — Coming Soon",
        width: 340, height: 220, type: "html",
        content: `<div style="text-align:center;padding:30px;" class="content-area">
          <div style="font-size:48px;margin-bottom:12px;">🚧</div>
          <h1>${title}</h1><p style="margin-top:10px;">This page is coming soon!</p></div>`,
      },
    });
    return;
  }
  WM.open({
    id: "page-" + link,
    label: title,
    icon: icon || "📄",
    window: { title, width: 680, height: 520, type: "page", src: link },
  });
}


/* ══════════════════════════════════════════════════════════════════
   REPO-LIST RENDERER
══════════════════════════════════════════════════════════════════ */
function renderRepoList(win, container) {
  container.style.cssText = 'height:100%;display:flex;flex-direction:column;overflow:hidden;font-family:var(--font-ui);font-size:11px;';

  const projects = win.projects || [];

  if (!projects.length) {
    container.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#888;gap:10px;height:100%;">
        <div style="font-size:36px;">📂</div>
        <div style="font-size:12px;">No projects yet.</div>
        <div style="font-size:10px;color:#aaa;">Add entries to the <code>projects</code> array in apps.js</div>
      </div>`;
    return;
  }

  const list = document.createElement('div');
  list.style.cssText = 'flex:1;overflow-y:auto;';

  projects.forEach((p, i) => {
    const baseBg = i % 2 === 0 ? '#fff' : '#f7f6f0';
    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #ddd;background:${baseBg};transition:background 0.08s;`;
    row.onmouseenter = () => { row.style.background = '#dde8ff'; };
    row.onmouseleave = () => { row.style.background = baseBg; };

    let badge = '', badgeTitle = '';
    if      (p.repo) { badge = '📖'; badgeTitle = `Open README: ${p.repo}`; }
    else if (p.url)  { badge = '🔗'; badgeTitle = `Open: ${p.url}`; }
    else if (p.text) { badge = '📝'; badgeTitle = 'Show info'; }

    row.innerHTML = `
      <div style="font-size:26px;flex-shrink:0;">${p.icon || '📦'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:bold;font-size:11px;">${p.title || '(untitled)'}</div>
        ${p.desc ? `<div style="font-size:10px;color:#555;margin-top:1px;">${p.desc}</div>` : ''}
        ${(p.tags || []).length ? `<div style="margin-top:3px;">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      </div>
      <div title="${badgeTitle}" style="font-size:18px;flex-shrink:0;opacity:0.7;">${badge}</div>`;

    row.addEventListener('click', () => {
      if (p.repo) {
        openGithubRepo({ repo: p.repo, icon: p.icon || '📦', label: p.title || p.repo.split('/').pop() });
      } else if (p.url) {
        window.open(p.url, '_blank');
      } else if (p.text) {
        const pid = 'info-' + (p.title || String(i)).replace(/\W/g, '-');
        WM.open({
          id: pid, label: p.title || 'Info', icon: p.icon || '📝',
          window: { title: p.title || 'Info', width: 380, height: 220, type: 'html',
            content: `<div class="content-area" style="padding:14px;"><p>${p.text}</p></div>` }
        });
      }
    });

    list.appendChild(row);
  });

  container.appendChild(list);

  const status = document.createElement('div');
  status.style.cssText = 'flex-shrink:0;padding:2px 8px;border-top:1px solid #bbb;font-size:10px;color:#555;';
  status.textContent = `${projects.length} project(s)`;
  container.appendChild(status);
}


/* ══════════════════════════════════════════════════════════════════
   GITHUB REPO VIEWER
══════════════════════════════════════════════════════════════════ */
function openGithubRepo(repoEntry) {
  const repo   = repoEntry.repo;
  const branch = repoEntry.branch || 'main';
  const id     = 'gh-' + repo.replace(/\//g, '-');
  const label  = repoEntry.label || repo.split('/').pop();
  const icon   = repoEntry.icon  || '📦';
  const width  = repoEntry.width  || 720;
  const height = repoEntry.height || 540;

  WM.open({
    id, label, icon,
    window: { title: `${label} — GitHub`, width, height, type: '_github_readme', repo, branch }
  });
}

function renderGithubReadme(win, container) {
  container.style.cssText = 'height:100%;display:flex;flex-direction:column;overflow:hidden;';

  const addr = document.createElement('div');
  addr.style.cssText = 'flex-shrink:0;padding:3px 8px;border-bottom:1px solid #999;background:#f5f4ef;font-size:11px;font-family:var(--font-ui);display:flex;align-items:center;gap:8px;';
  addr.innerHTML = `
    <span>🐙</span>
    <a href="https://github.com/${win.repo}" target="_blank" style="color:#0000cc;text-decoration:underline;font-family:var(--font-ui);font-size:11px;">${win.repo}</a>
    <span style="margin-left:auto;color:#888;">branch: ${win.branch}</span>`;
  container.appendChild(addr);

  const content = document.createElement('div');
  content.className = 'content-area';
  content.style.cssText = 'flex:1;overflow:auto;padding:14px;';
  content.innerHTML = `<p style="color:#888;">⏳ Fetching README…</p>`;
  container.appendChild(content);

  fetch(`https://api.github.com/repos/${win.repo}/readme?ref=${win.branch}`,
    { headers: { Accept: 'application/vnd.github.v3.raw' } })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
    .then(md  => { content.innerHTML = markdownToHtml(md); })
    .catch(err => {
      content.innerHTML = `
        <div style="text-align:center;padding:30px;">
          <div style="font-size:40px;margin-bottom:10px;">😕</div>
          <p style="font-weight:bold;">Could not load README</p>
          <p style="color:#666;margin-top:6px;font-size:10px;">${err.message}</p>
          <p style="margin-top:12px;"><a href="https://github.com/${win.repo}" target="_blank"
            style="color:#0000cc;text-decoration:underline;">Open on GitHub ↗</a></p>
        </div>`;
    });
}

function markdownToHtml(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_, c) => `<pre>${c.trimEnd()}</pre>`)
    .replace(/^#### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ccc;margin:10px 0;">')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/__(.+?)__/g,     '<strong>$1</strong>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g,
      '<span style="display:inline-block;background:#eee;border:1px solid #ccc;padding:1px 6px;border-radius:2px;font-size:10px;color:#555;">🖼 $1</span>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" style="color:#0000cc;text-decoration:underline;">$1</a>')
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^&gt; (.+)$/gm,
      '<blockquote style="border-left:3px solid #ccc;margin:4px 0;padding:2px 8px;color:#555;">$1</blockquote>')
    .replace(/^(?!<[hupblo]|<pre|<hr|<blockquote)(.+)$/gm, '<p>$1</p>')
    .replace(/<p>\s*<\/p>/g, '');
}
