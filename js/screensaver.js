const Screensaver = (() => {

  const LS_KEY = 'portfolio-screensaver';

  /* ── Default config ── */
  let cfg = {
    name:    'matrix',   // active screensaver id
    delay:   120,        // seconds of idle before activation (0 = never)
    speed:   'medium',   // 'slow' | 'medium' | 'fast'
  };

  let idleTimer   = null;
  let animFrame   = null;
  let active      = false;
  let overlay     = null;
  let canvas      = null;
  let ctx2d       = null;
  let stopFn      = null;   // called to clean up current screensaver

  /* ══════════════════════════════════════════════
     SCREENSAVER DEFINITIONS
  ══════════════════════════════════════════════ */
  const SCREENSAVERS = {

    /* ── 1. Matrix rain ── */
    matrix: {
      name: 'Matrix Rain',
      icon: '🟩',
      init(canvas, ctx, speed) {
        canvas.style.background = '#000';
        const cols = Math.floor(canvas.width / 16);
        const drops = Array.from({ length: cols }, () => Math.random() * -50);
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
        const spd = { slow: 55, medium: 35, fast: 18 }[speed] || 35;
        let last = 0;

        function frame(ts) {
          if (ts - last < spd) { animFrame = requestAnimationFrame(frame); return; }
          last = ts;
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = '15px "Courier New"';
          drops.forEach((y, i) => {
            const ch = chars[Math.floor(Math.random() * chars.length)];
            const bright = Math.random() > 0.95;
            ctx.fillStyle = bright ? '#fff' : '#0f0';
            ctx.fillText(ch, i * 16, y * 16);
            if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 1;
          });
          animFrame = requestAnimationFrame(frame);
        }
        animFrame = requestAnimationFrame(frame);
      }
    },

    /* ── 2. Starfield ── */
    starfield: {
      name: 'Starfield',
      icon: '⭐',
      init(canvas, ctx, speed) {
        canvas.style.background = '#000';
        const N = 200;
        const spd = { slow: 0.5, medium: 1.5, fast: 3.5 }[speed] || 1.5;
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const stars = Array.from({ length: N }, () => ({
          x: (Math.random() - 0.5) * canvas.width,
          y: (Math.random() - 0.5) * canvas.height,
          z: Math.random() * canvas.width,
        }));

        function frame() {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          stars.forEach(s => {
            s.z -= spd * 4;
            if (s.z <= 0) { s.x = (Math.random() - 0.5) * canvas.width; s.y = (Math.random() - 0.5) * canvas.height; s.z = canvas.width; }
            const px = (s.x / s.z) * canvas.width  + cx;
            const py = (s.y / s.z) * canvas.height + cy;
            const r  = Math.max(0.3, (1 - s.z / canvas.width) * 3);
            const bright = Math.floor((1 - s.z / canvas.width) * 255);
            ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
          });
          animFrame = requestAnimationFrame(frame);
        }
        animFrame = requestAnimationFrame(frame);
      }
    },

    /* ── 3. Bouncing logo ── */
    dvd: {
      name: 'Bouncing Logo',
      icon: '📀',
      init(canvas, ctx, speed) {
        canvas.style.background = '#000';
        const spd = { slow: 1, medium: 2, fast: 4 }[speed] || 2;
        const W = canvas.width, H = canvas.height;
        const bw = 120, bh = 60;
        let x = Math.random() * (W - bw), y = Math.random() * (H - bh);
        let dx = spd, dy = spd * 0.7;
        const colors = ['#ff4444','#44ff44','#4444ff','#ffff44','#ff44ff','#44ffff','#ff8844'];
        let ci = 0;

        function frame() {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, W, H);
          let bounced = false;
          x += dx; y += dy;
          if (x <= 0 || x + bw >= W) { dx = -dx; x = Math.max(0, Math.min(W - bw, x)); bounced = true; }
          if (y <= 0 || y + bh >= H) { dy = -dy; y = Math.max(0, Math.min(H - bh, y)); bounced = true; }
          if (bounced) ci = (ci + 1) % colors.length;
          ctx.fillStyle = colors[ci];
          ctx.font = 'bold 22px "Courier New"';
          ctx.textAlign = 'center';
          ctx.fillText('PORTFOLIO', x + bw/2, y + 22);
          ctx.font = '14px "Courier New"';
          ctx.fillText('OS  v2.0', x + bw/2, y + 44);
          ctx.textAlign = 'left';
          animFrame = requestAnimationFrame(frame);
        }
        animFrame = requestAnimationFrame(frame);
      }
    },

    /* ── 4. Pipes ── */
    pipes: {
      name: 'Pipes',
      icon: '🔧',
      init(canvas, ctx, speed) {
        canvas.style.background = '#000';
        const CELL = 20;
        const cols = Math.floor(canvas.width  / CELL);
        const rows = Math.floor(canvas.height / CELL);
        const spd  = { slow: 150, medium: 60, fast: 20 }[speed] || 60;
        const palette = ['#ff4444','#44ff44','#4488ff','#ff8800','#ff44ff','#44ffff','#ffffff'];
        const DIRS = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
        let pipes = [];
        let last  = 0;
        let clearTimer = 0;

        function newPipe() {
          return {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows),
            dir: DIRS[Math.floor(Math.random() * 4)],
            color: palette[Math.floor(Math.random() * palette.length)],
            len: 0,
          };
        }

        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 4; i++) pipes.push(newPipe());

        function frame(ts) {
          if (ts - last < spd) { animFrame = requestAnimationFrame(frame); return; }
          last = ts;
          clearTimer++;
          if (clearTimer > 600) {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            pipes = []; for (let i = 0; i < 4; i++) pipes.push(newPipe());
            clearTimer = 0;
          }

          pipes.forEach(p => {
            // maybe turn
            if (Math.random() < 0.2) {
              const turns = DIRS.filter(d => !(d.dx === -p.dir.dx && d.dy === -p.dir.dy));
              p.dir = turns[Math.floor(Math.random() * turns.length)];
            }
            const nx = p.x + p.dir.dx, ny = p.y + p.dir.dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
              p.x = Math.floor(Math.random() * cols);
              p.y = Math.floor(Math.random() * rows);
            } else {
              ctx.strokeStyle = p.color;
              ctx.lineWidth   = 4;
              ctx.lineCap     = 'round';
              ctx.beginPath();
              ctx.moveTo(p.x * CELL + CELL/2, p.y * CELL + CELL/2);
              p.x = nx; p.y = ny;
              ctx.lineTo(p.x * CELL + CELL/2, p.y * CELL + CELL/2);
              ctx.stroke();
              // joint dot
              ctx.fillStyle = p.color;
              ctx.beginPath(); ctx.arc(p.x * CELL + CELL/2, p.y * CELL + CELL/2, 4, 0, Math.PI*2); ctx.fill();
            }
            p.len++;
            if (p.len > 80) { Object.assign(p, newPipe()); }
          });

          animFrame = requestAnimationFrame(frame);
        }
        animFrame = requestAnimationFrame(frame);
      }
    },

    /* ── 5. Big clock ── */
    clock: {
      name: 'Clock',
      icon: '🕐',
      init(canvas, ctx, speed) {
        canvas.style.background = '#000';
        const W = canvas.width, H = canvas.height;

        function frame() {
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

          // Glow effect
          ctx.shadowColor = '#0ff'; ctx.shadowBlur = 30;
          ctx.fillStyle = '#0ff';
          ctx.font = `bold ${Math.min(W/5, 120)}px "Courier New"`;
          ctx.textAlign = 'center';
          ctx.fillText(timeStr, W/2, H/2);

          ctx.shadowBlur = 10;
          ctx.fillStyle = '#88ccff';
          ctx.font = `${Math.min(W/18, 32)}px "Courier New"`;
          ctx.fillText(dateStr, W/2, H/2 + 60);
          ctx.shadowBlur = 0;
          ctx.textAlign = 'left';

          animFrame = requestAnimationFrame(frame);
        }
        animFrame = requestAnimationFrame(frame);
      }
    },

    /* ── 6. Blank ── */
    blank: {
      name: 'Blank (Black)',
      icon: '⬛',
      init(canvas, ctx) {
        canvas.style.background = '#000';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // No animation needed — just stays black
      }
    },
  };

  /* ══════════════════════════════════════════════
     CORE: activate / deactivate
  ══════════════════════════════════════════════ */
  function activate() {
    if (active) return;
    active = true;

    overlay = document.createElement('div');
    overlay.id = 'screensaver-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99998;
      background:#000;cursor:none;
    `;

    canvas = document.createElement('canvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    ctx2d = canvas.getContext('2d');

    const ss = SCREENSAVERS[cfg.name] || SCREENSAVERS.matrix;
    ss.init(canvas, ctx2d, cfg.speed);

    // Dismiss on any interaction
    const dismiss = () => deactivate();
    overlay.addEventListener('mousemove', dismiss, { once: true });
    overlay.addEventListener('mousedown', dismiss, { once: true });
    overlay.addEventListener('keydown',   dismiss, { once: true });
    overlay.addEventListener('touchstart',dismiss, { once: true });
    overlay._dismiss = dismiss;

    // Handle resize
    const onResize = () => {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    overlay._onResize = onResize;
  }

  function deactivate() {
    if (!active) return;
    active = false;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    if (overlay) {
      window.removeEventListener('resize', overlay._onResize);
      overlay.remove(); overlay = null; canvas = null; ctx2d = null;
    }
    resetIdleTimer();
  }

  /* ══════════════════════════════════════════════
     IDLE DETECTION
  ══════════════════════════════════════════════ */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (cfg.delay === 0) return;
    idleTimer = setTimeout(activate, cfg.delay * 1000);
  }

  function initIdleDetection() {
    ['mousemove','mousedown','keydown','touchstart','wheel'].forEach(ev => {
      document.addEventListener(ev, () => { if (!active) resetIdleTimer(); }, { passive: true });
    });
    resetIdleTimer();
  }

  /* ══════════════════════════════════════════════
     SETTINGS DIALOG
  ══════════════════════════════════════════════ */
  function loadSaved() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (s) Object.assign(cfg, s);
    } catch(_) {}
  }

  function saveCfg() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch(_) {}
  }

  function openDialog() {
    hideAllCtx();
    WM.open({
      id: '__ss_dialog__',
      label: 'Screen Saver Settings',
      icon: '🖥️',
      window: { title: 'Display Properties — Screen Saver', width: 480, height: 400, type: '_ss_dialog' }
    });
  }

  function buildDialog(container) {
    const ssOpts = Object.entries(SCREENSAVERS).map(([id, ss]) =>
      `<option value="${id}" ${cfg.name===id?'selected':''}>${ss.icon} ${ss.name}</option>`
    ).join('');

    const delayOpts = [
      [0, 'Never'],
      [60, '1 minute'],
      [120, '2 minutes'],
      [300, '5 minutes'],
      [600, '10 minutes'],
      [1800, '30 minutes'],
    ].map(([v,l]) => `<option value="${v}" ${cfg.delay==v?'selected':''}>${l}</option>`).join('');

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;font-family:var(--font-ui);font-size:11px;">

        <!-- fake tab bar -->
        <div style="padding:6px 8px 0;border-bottom:2px solid #aaa;">
          <div style="display:flex;gap:2px;">
            ${['Themes','Desktop','Screen Saver','Appearance','Settings'].map((t,i)=>`
              <div style="padding:4px 10px;border:1px solid #aaa;border-bottom:none;border-radius:3px 3px 0 0;
                background:${i===2?'#ece9d8':'#d4cfbf'};cursor:default;${i===2?'font-weight:bold;position:relative;top:2px;z-index:1;':''}">
                ${t}
              </div>`).join('')}
          </div>
        </div>

        <!-- monitor preview -->
        <div style="display:flex;justify-content:center;padding:10px 0 6px;">
          <div style="background:#c0bdb4;border:2px solid #888;border-radius:6px;padding:6px;box-shadow:2px 2px 6px rgba(0,0,0,0.3);">
            <div style="position:relative;width:180px;height:110px;border:2px inset #666;overflow:hidden;background:#000;">
              <canvas id="ss-preview-canvas" width="180" height="110" style="display:block;"></canvas>
              <div style="position:absolute;bottom:0;left:0;right:0;height:7px;background:linear-gradient(180deg,#3a7bd5,#1a4cba);"></div>
              <div style="position:absolute;bottom:1px;left:2px;width:20px;height:5px;background:linear-gradient(90deg,#3da63a,#5dc158);border-radius:2px;"></div>
            </div>
          </div>
        </div>

        <!-- controls -->
        <div style="padding:0 16px;flex:1;display:flex;flex-direction:column;gap:8px;">

          <fieldset class="os-group">
            <legend>Screen saver</legend>
            <div style="display:flex;gap:6px;align-items:center;">
              <select id="ss-name" style="flex:1;font-family:var(--font-ui);font-size:11px;padding:2px 4px;">
                ${ssOpts}
              </select>
              <button class="os-btn" onclick="Screensaver._testRun()">Preview</button>
            </div>
          </fieldset>

          <fieldset class="os-group">
            <legend>Wait</legend>
            <div style="display:flex;gap:6px;align-items:center;">
              <select id="ss-delay" style="font-family:var(--font-ui);font-size:11px;padding:2px 4px;">
                ${delayOpts}
              </select>
            </div>
          </fieldset>

          <fieldset class="os-group">
            <legend>Speed</legend>
            <div style="display:flex;gap:10px;">
              ${['slow','medium','fast'].map(s=>`
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                  <input type="radio" name="ss-speed" value="${s}" ${cfg.speed===s?'checked':''}>
                  ${s.charAt(0).toUpperCase()+s.slice(1)}
                </label>`).join('')}
            </div>
          </fieldset>

        </div>

        <!-- buttons -->
        <div style="display:flex;gap:6px;justify-content:flex-end;padding:8px 16px;border-top:1px solid #ccc;">
          <button class="os-btn" onclick="Screensaver._cancel()">Cancel</button>
          <button class="os-btn" onclick="Screensaver._applyDialog()">Apply</button>
          <button class="os-btn default" onclick="Screensaver._okDialog()">OK</button>
        </div>
      </div>`;

    // Live preview in mini canvas
    _runMiniPreview(container);

    container.querySelector('#ss-name').addEventListener('change', () => _runMiniPreview(container));
  }

  let miniFrame = null;
  function _runMiniPreview(container) {
    if (miniFrame) { cancelAnimationFrame(miniFrame); miniFrame = null; }
    const sel  = container.querySelector('#ss-name');
    const cvs  = container.querySelector('#ss-preview-canvas');
    if (!cvs || !sel) return;
    const ctx  = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    const ss = SCREENSAVERS[sel.value];
    if (!ss) return;
    // hijack animFrame slot temporarily
    const savedAF = animFrame;
    animFrame = null;
    ss.init(cvs, ctx, cfg.speed);
    miniFrame = animFrame;
    animFrame = savedAF;
  }

  function _readDialog() {
    const c = document.querySelector('#win-__ss_dialog__ .window-content');
    if (!c) return;
    cfg.name  = c.querySelector('#ss-name')?.value  || cfg.name;
    cfg.delay = parseInt(c.querySelector('#ss-delay')?.value ?? cfg.delay);
    cfg.speed = c.querySelector('input[name="ss-speed"]:checked')?.value || cfg.speed;
  }

  function _applyDialog() {
    _readDialog();
    saveCfg();
    resetIdleTimer();
    // Restart mini preview with new speed
    const c = document.querySelector('#win-__ss_dialog__ .window-content');
    if (c) _runMiniPreview(c);
  }

  function _okDialog() {
    _applyDialog();
    if (miniFrame) { cancelAnimationFrame(miniFrame); miniFrame = null; }
    WM.close('__ss_dialog__');
  }

  function _cancel() {
    if (miniFrame) { cancelAnimationFrame(miniFrame); miniFrame = null; }
    WM.close('__ss_dialog__');
  }

  /* Full-screen test run — ESC or click to exit */
  function _testRun() {
    _readDialog();
    // Close the dialog first so it's not in the way
    if (miniFrame) { cancelAnimationFrame(miniFrame); miniFrame = null; }
    WM.close('__ss_dialog__');
    setTimeout(activate, 80);
  }

  /* Preview button - just applies and shows mini */
  function _preview() {
    _readDialog();
    const c = document.querySelector('#win-__ss_dialog__ .window-content');
    if (c) _runMiniPreview(c);
  }

  /* ── Init ── */
  function init() {
    loadSaved();
    initIdleDetection();
  }

  return {
    init, activate, deactivate, openDialog, buildDialog,
    SCREENSAVERS,
    getCfg: () => cfg,
    setCfg: (k, v) => { cfg[k] = v; saveCfg(); resetIdleTimer(); },
    _applyDialog, _okDialog, _cancel, _testRun, _preview,
  };

})();
