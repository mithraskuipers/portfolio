/* ═══════════════════════════════════════════════
   WM.JS — Window Manager
   drag · resize · focus · minimize · maximize ·
   taskbar · _folder · _wallpaper_dialog
════════════════════════════════════════════════ */

const WM = (() => {
  let windows = {};
  let zCounter = 100;
  let dragState = null;
  let resizeState = null;

  /* ── Open / restore a window ── */
  function open(app) {
    if (windows[app.id]) {
      const w = windows[app.id];
      w.minimized = false;
      w.el.classList.remove("minimized");
      focus(app.id);
      return;
    }

    const win = app.window;
    const el = document.createElement("div");
    el.className = "window focused";
    el.id = "win-" + app.id;
    el.style.width = (win.width || 500) + "px";
    el.style.height = (win.height || 400) + "px";

    const offset = (Object.keys(windows).length % 8) * 24;
    el.style.left = 60 + offset + "px";
    el.style.top = 40 + offset + "px";

    el.innerHTML = buildChrome(app);
    document.getElementById("window-layer").appendChild(el);
    windows[app.id] = { el, app, minimized: false };

    el.querySelector(".btn-close").onclick = () => close(app.id);
    el.querySelector(".btn-minimize").onclick = () => minimize(app.id);
    el.querySelector(".btn-maximize").onclick = () => toggleMaximize(app.id);
    el.querySelector(".title-bar").addEventListener("mousedown", (e) =>
      startDrag(e, app.id),
    );
    el.querySelector(".resize-handle")?.addEventListener("mousedown", (e) =>
      startResize(e, app.id),
    );
    el.addEventListener("mousedown", () => focus(app.id));

    renderContent(app, el.querySelector(".window-body"));
    addTaskbarItem(app);
    focus(app.id);
  }

  /* ── Window chrome HTML ── */
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

  /* ── Render content by type ── */
  function renderContent(app, body) {
    const container = body.querySelector(".window-content");
    const win = app.window;

    switch (win.type) {
      case "html":
        container.innerHTML = `<div class="content-area" style="padding:12px;">${win.content}</div>`;
        break;

      case "page":
        container.style.height = "100%";
        const iframe = document.createElement("iframe");
        iframe.src = win.src;
        iframe.style.cssText = "width:100%;height:100%;border:none;";
        container.appendChild(iframe);
        break;

      case "projects":
        renderProjects(win, container);
        break;

      case "terminal":
        renderTerminal(container);
        break;

      /* ── Folder window ── */
      case "_folder":
        renderFolder(win.folderItem, container);
        break;

      /* ── Wallpaper / Display Properties dialog ── */
      case "_wallpaper_dialog":
        container.style.cssText =
          "height:100%;display:flex;flex-direction:column;overflow:hidden;";
        Wallpaper.buildDialog(container);
        break;

      /* ── Screensaver dialog ── */
      case "_ss_dialog":
        container.style.cssText =
          "height:100%;display:flex;flex-direction:column;overflow:hidden;";
        Screensaver.buildDialog(container);
        break;

      default:
        container.innerHTML =
          '<p style="padding:12px;font-family:var(--font-ui);font-size:11px;">No content defined.</p>';
    }
  }

  /* ── Folder window renderer ── */
  function renderFolder(folderItem, container) {
    container.style.cssText = "height:100%;display:flex;flex-direction:column;";

    // Address bar
    const addr = document.createElement("div");
    addr.style.cssText =
      "flex-shrink:0;padding:3px 8px;border-bottom:1px solid #999;background:#f5f4ef;font-size:11px;font-family:var(--font-ui);display:flex;align-items:center;gap:6px;";
    addr.innerHTML = `<span>📁</span><span>${folderItem.label}</span>`;
    container.appendChild(addr);

    // Icon area
    const grid = document.createElement("div");
    grid.style.cssText =
      "flex:1;display:flex;flex-wrap:wrap;gap:4px;padding:10px;overflow:auto;align-content:flex-start;";

    (folderItem.children || []).forEach((child) => {
      const icon = document.createElement("div");
      icon.className = "folder-child-icon";
      icon.innerHTML = `<div style="font-size:30px;margin-bottom:3px;">${child.icon}</div><div style="font-size:10px;line-height:1.3;word-break:break-word;">${child.label}</div>`;
      icon.title = child.label;
      icon.addEventListener("dblclick", () => activateDesktopItem(child));
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

    // Status bar
    const status = document.createElement("div");
    status.style.cssText =
      "flex-shrink:0;padding:2px 8px;border-top:1px solid #bbb;font-size:10px;font-family:var(--font-ui);color:#555;";
    status.textContent = `${(folderItem.children || []).length} object(s)`;
    container.appendChild(status);
  }

  /* ── Projects grid / list ── */
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

  /* ── Terminal ── */
  function renderTerminal(container) {
    container.style.cssText =
      'height:100%;background:#0d1117;color:#39ff14;font-family:"Courier New",monospace;font-size:12px;display:flex;flex-direction:column;';
    container.innerHTML = `
      <div class="term-output" style="flex:1;overflow-y:auto;padding:8px 10px;"></div>
      <div style="display:flex;align-items:center;padding:4px 8px;border-top:1px solid #1e2a1e;background:#080c08;">
        <span style="color:#39ff14;margin-right:6px;white-space:nowrap;" id="term-prompt">guest@portfolios:~$</span>
        <input class="term-input" autocomplete="off" spellcheck="false"
          style="flex:1;background:transparent;border:none;outline:none;color:#39ff14;font-family:inherit;font-size:12px;caret-color:#39ff14;" />
      </div>`;

    const output = container.querySelector(".term-output");
    const input = container.querySelector(".term-input");
    const history = [];
    let histIdx = -1;
    let busy = false;

    /* Print plain text line */
    function print(text, cls) {
      const line = document.createElement("div");
      line.style.whiteSpace = "pre-wrap";
      line.style.marginBottom = "1px";
      line.style.lineHeight = "1.5";
      line.style.color =
        cls === "err"
          ? "#ff5555"
          : cls === "cmd"
            ? "#88aaff"
            : cls === "dim"
              ? "#557755"
              : cls === "warn"
                ? "#ffcc44"
                : "#39ff14";
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    /* Print HTML (trusted internal use only) */
    function printHTML(html) {
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "4px";
      wrap.innerHTML = html;
      output.appendChild(wrap);
      output.scrollTop = output.scrollHeight;
    }

    /* Spinner for async commands */
    function spinner(label) {
      const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
      let fi = 0;
      const el = document.createElement("div");
      el.style.color = "#ffcc44";
      el.textContent = `${frames[0]} ${label}`;
      output.appendChild(el);
      output.scrollTop = output.scrollHeight;
      const iv = setInterval(() => {
        el.textContent = `${frames[fi++ % frames.length]} ${label}`;
        output.scrollTop = output.scrollHeight;
      }, 80);
      return {
        stop: () => {
          clearInterval(iv);
          el.remove();
        },
      };
    }

    print("Portfolio [Version X.X.X]");
    print("Type 'help' for available commands.\n", "dim");

    async function runCmd(raw) {
      if (busy) return;
      busy = true;
      input.disabled = true;
      history.unshift(raw);
      histIdx = -1;
      print("$ " + raw, "cmd");
      const [cmd, ...args] = raw.trim().split(/\s+/);
      const fn = TERMINAL_COMMANDS[cmd];
      if (!fn) {
        print(`bash: ${cmd}: command not found`, "err");
        print(`Type 'help' to see available commands.`, "dim");
      } else {
        try {
          // Commands may return string, Promise<string>, or { html: '...' }
          let result = fn(args, { print, printHTML, spinner });
          if (result && typeof result.then === "function")
            result = await result;
          if (result === "__clear__") output.innerHTML = "";
          else if (result && typeof result === "object" && result.html)
            printHTML(result.html);
          else if (result) print(result);
        } catch (e) {
          print(`Error: ${e.message}`, "err");
        }
      }
      busy = false;
      input.disabled = false;
      input.focus();
    }

    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const raw = input.value.trim();
        input.value = "";
        if (!raw) return;
        await runCmd(raw);
      } else if (e.key === "ArrowUp") {
        histIdx = Math.min(histIdx + 1, history.length - 1);
        input.value = history[histIdx] || "";
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        histIdx = Math.max(histIdx - 1, -1);
        input.value = histIdx >= 0 ? history[histIdx] : "";
        e.preventDefault();
      } else if (e.key === "Tab") {
        e.preventDefault();
        // Tab completion
        const partial = input.value.trim();
        const matches = Object.keys(TERMINAL_COMMANDS).filter((k) =>
          k.startsWith(partial),
        );
        if (matches.length === 1) input.value = matches[0];
        else if (matches.length > 1) print(matches.join("  "), "dim");
      } else if (e.key === "c" && e.ctrlKey) {
        input.value = "";
        print("^C", "err");
      }
    });
    input.focus();
  }

  /* ── Focus ── */
  function focus(id) {
    Object.entries(windows).forEach(([wid, w]) =>
      w.el.classList.toggle("focused", wid === id),
    );
    windows[id].el.style.zIndex = ++zCounter;
    updateTaskbar(id);
  }

  /* ── Minimize ── */
  function minimize(id) {
    windows[id].minimized = true;
    windows[id].el.classList.add("minimized");
    updateTaskbar(null);
  }

  /* ── Maximize toggle ── */
  function toggleMaximize(id) {
    const el = windows[id].el;
    if (el.dataset.maximized) {
      Object.assign(el.style, JSON.parse(el.dataset.prevStyle));
      delete el.dataset.maximized;
      delete el.dataset.prevStyle;
    } else {
      el.dataset.prevStyle = JSON.stringify({
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
      });
      el.dataset.maximized = "1";
      Object.assign(el.style, {
        left: "0",
        top: "0",
        width: "100%",
        height: "calc(100vh - 40px)",
      });
    }
  }

  /* ── Close ── */
  function close(id) {
    if (!windows[id]) return;
    windows[id].el.remove();
    delete windows[id];
    removeTaskbarItem(id);
  }

  /* ── Taskbar ── */
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

  function removeTaskbarItem(id) {
    document.getElementById("tb-" + id)?.remove();
  }

  function updateTaskbar(activeId) {
    document.querySelectorAll(".taskbar-item").forEach((btn) => {
      btn.classList.toggle("active", btn.id === "tb-" + activeId);
    });
  }

  /* ── Drag ── */
  function startDrag(e, id) {
    if (e.target.closest(".title-bar-controls")) return;
    focus(id);
    const el = windows[id].el,
      rect = el.getBoundingClientRect();
    dragState = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
    };
    e.preventDefault();
  }

  /* ── Resize ── */
  function startResize(e, id) {
    const el = windows[id].el;
    resizeState = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origW: el.offsetWidth,
      origH: el.offsetHeight,
    };
    e.preventDefault();
    e.stopPropagation();
  }

  document.addEventListener("mousemove", (e) => {
    if (dragState) {
      const { id, startX, startY, origLeft, origTop } = dragState;
      const el = windows[id].el;
      el.style.left = Math.max(0, origLeft + e.clientX - startX) + "px";
      el.style.top = Math.max(0, origTop + e.clientY - startY) + "px";
    }
    if (resizeState) {
      const { id, startX, startY, origW, origH } = resizeState;
      const el = windows[id].el;
      el.style.width = Math.max(280, origW + e.clientX - startX) + "px";
      el.style.height = Math.max(180, origH + e.clientY - startY) + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
  });

  return { open, close, focus, minimize };
})();

/* ── Global helpers ── */
function openApp(id) {
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
        width: 340,
        height: 220,
        type: "html",
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
