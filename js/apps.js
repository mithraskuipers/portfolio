const APPS = [
  {
    id: "about",
    label: "About Me",
    icon: "👤",
    startMenu: true,
    window: {
      title: "About Me",
      width: 500,
      height: 400,
      type: "html",
      content: `
        <div class="content-area">
          <h1>👋 Hi, I'm Mithras Kuipers</h1>
          <p>
            I'm an Offensive Security Consultant based in the Netherlands, with a strong background in artificial intelligence.
          </p>

          <h2>🎓 Education</h2>
          <p>I hold (research) Master's degrees in:</p>
          <ul>
            <li>Cognitive Neuroscience</li>
            <li>Artificial Intelligence</li>
          </ul>

          <h2>🔗 Links</h2>
          <p>
            🐙 <a href="https://github.com/mithraskuipers" target="_blank">github.com/mithraskuipers</a><br>
            💼 <a href="https://linkedin.com/in/mithraskuipers" target="_blank">linkedin.com/in/mithraskuipers</a>
          </p>
        </div>`,
    },
  },

  {
    id: "rpi-projects",
    label: "Pi Projects",
    icon: "🍓",
    startMenu: true,
    window: {
      title: "Raspberry Pi Projects",
      width: 660,
      height: 480,
      type: "repo-list",
      /*
       * ══════════════════════════════════════════════════════
       *  ADD RASPBERRY PI PROJECTS HERE
       *
       *  Each entry can have:
       *    icon    — emoji
       *    title   — display name
       *    desc    — short description shown under the title
       *    tags    — array of strings e.g. ["Python", "Flask"]
       *
       *  Pick ONE action per entry:
       *    repo    — "owner/repo"  → opens README in a window
       *    url     — "https://…"  → opens in a new browser tab
       *    text    — "…"          → shows a small inline popup with your text
       *
       *  Examples:
       *    { icon:"🌡️", title:"Weather Station", desc:"DHT22 + Flask dashboard",
       *      tags:["Python","GPIO"], repo:"mithraskuipers/rpi-weather" }
       *
       *    { icon:"🕹️", title:"RetroPi Cabinet", desc:"Custom arcade cabinet",
       *      tags:["RetroPie"], url:"https://mithraskuipers.github.io/retro/" }
       *
       *    { icon:"🤖", title:"Robot", desc:"Line-following robot",
       *      tags:["Python","PID"], text:"Work in progress — repo coming soon." }
       * ══════════════════════════════════════════════════════
       */
      projects: [
        /* ← ADD PROJECTS HERE */
      ],
    },
  },

  {
    id: "ai-projects",
    label: "AI Projects",
    icon: "🧠",
    startMenu: true,
    window: {
      title: "AI & Machine Learning Projects",
      width: 660,
      height: 480,
      type: "repo-list",
      /*
       * ══════════════════════════════════════════════════════
       *  ADD AI / ML PROJECTS HERE  (same format as Pi Projects)
       *    repo / url / text  — pick one action per entry
       * ══════════════════════════════════════════════════════
       */
      projects: [
        /* ← ADD PROJECTS HERE */
      ],
    },
  },

  {
    id: "terminal",
    label: "Terminal",
    icon: "🖥️",
    startMenu: true,
    window: {
      title: "Terminal — bash",
      width: 620,
      height: 420,
      type: "terminal",
    },
  },

  {
    id: "winamp",
    label: "Winamp",
    icon: "🎵",
    startMenu: true,
    window: {
      title: "Winamp",
      width: 275,
      height: 420,
      type: "winamp",
    },
  },

  {
    id: "minesweeper",
    label: "Minesweeper",
    icon: "💣",
    startMenu: true,
    window: {
      title: "Minesweeper",
      width: 340,
      height: 400,
      type: "minesweeper",
    },
  },

  {
    id: "solitaire",
    label: "Solitaire",
    icon: "🃏",
    startMenu: true,
    window: {
      title: "Solitaire",
      width: 740,
      height: 560,
      type: "solitaire",
    },
  },

  {
    id: "resume",
    label: "Resume",
    icon: "📄",
    startMenu: true,
    window: {
      title: "Resume",
      width: 500,
      height: 500,
      type: "page",
      src: "pages/resume.html",
    },
  },
];

/* ══════════════════════════════════════════════
   DESKTOP ITEMS
   These are the icons on the desktop.
   Folders can contain any mix of kinds, recursively.
══════════════════════════════════════════════ */
const DESKTOP_ITEMS = [
  { kind: "app", label: "About Me",    icon: "👤", appId: "about" },
  { kind: "app", label: "Terminal",    icon: "🖥️", appId: "terminal" },
  { kind: "app", label: "Winamp",      icon: "🎵", appId: "winamp" },
  { kind: "app", label: "Minesweeper", icon: "💣", appId: "minesweeper" },
  { kind: "app", label: "Solitaire",   icon: "🃏", appId: "solitaire" },
  /* Easter egg — type 'bsod' in terminal or double-click this icon */
  { kind: "app", label: "BSOD.exe",   icon: "💀", appId: "__bsod__" },

  {
    kind: "folder",
    label: "Pi Projects",
    icon: "🍓",
    children: [
      {
        kind: "app",
        label: "Pi Projects",
        icon: "📋",
        appId: "rpi-projects",
      },
      /* ← ADD PI PROJECT SHORTCUTS HERE */
    ],
  },

  {
    kind: "folder",
    label: "AI Projects",
    icon: "🧠",
    children: [
      {
        kind: "app",
        label: "All AI Projects",
        icon: "📋",
        appId: "ai-projects",
      },
      /* ← ADD AI PROJECT SHORTCUTS HERE */
    ],
  },

  { kind: "app", label: "Resume", icon: "📄", appId: "resume" },
  {
    kind: "link",
    label: "GitHub",
    icon: "🐙",
    url: "https://github.com/mithraskuipers",
  },
];

/*
 * ══════════════════════════════════════════════════════════════════
 *  GITHUB REPO SHORTCUTS
 *  Each entry creates a desktop icon that opens the repo's README
 *  in a window (fetched live from GitHub).
 *
 *  Required:
 *    repo   — "owner/repo-name"
 *
 *  Optional:
 *    icon   — emoji shown on the desktop icon  (default: "📦")
 *    label  — display name                     (default: repo slug)
 *    branch — branch to read README from       (default: "main")
 *    width  — window width in px               (default: 720)
 *    height — window height in px              (default: 540)
 *
 *  ── ADD A REPO ──────────────────────────────────────────────────
 *  { repo: "mithraskuipers/my-cool-project", icon: "🚀", label: "Cool Project" },
 * ══════════════════════════════════════════════════════════════════
 */
const GITHUB_REPOS = [
  // { repo: "mithraskuipers/example-repo",  icon: "📦", label: "Example"       },
  // { repo: "mithraskuipers/another-repo",  icon: "🧠", label: "ML Stuff"      },
];

const WALLPAPERS = [
  /* ── Local wallpapers (files live in assets/wallpapers/) ── */
  { name: "Bliss",     file: "bliss.jpg" },   // ← DEFAULT (index 0)

  /* ── Built-in solid colours ── */
  { name: "XP Blue",   color: "#3a6ea5" },
  { name: "Midnight",  color: "#0d1b2a" },
  { name: "Forest",    color: "#1a3a1a" },
  { name: "Crimson",   color: "#3a0a0a" },
  { name: "Slate",     color: "#2c2c3a" },
  { name: "Warm Sand", color: "#8b7355" },
  { name: "Pure Black",color: "#000000" },

  /* ── Internet wallpapers — uncomment to re-enable ── */
  // { name: "XP (web)",      url: "https://www.wallpaperhub.app/_next/image?url=https%3A%2F%2Fcdn.wallpaperhub.app%2Fcloudcache%2Fb%2Fd%2F7%2F6%2F4%2Fb%2Fbd764bb25d49a05105060185774ba14cd2c846f7.jpg&w=4500&q=100" },
  // { name: "Bliss (Unsplash)", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920" },
  // { name: "Dark Forest",   url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920" },
];

const TERMINAL_COMMANDS = {
  /* ── Help ── */
  help: () => `\
╔══════════════════════════════════════════╗
║       Portfolio — Command Reference   ║
╚══════════════════════════════════════════╝

  SYSTEM
    help              this message
    clear             clear terminal
    date              current date & time
    uptime            session uptime
    neofetch          system info card
    whoami            about me
    echo [text]       print text
    env               show environment vars

  NAVIGATION & APPS
    ls                list all apps
    open [id]         open an app by id
    repos             list GitHub repos
    github [repo]     open a repo README

  WALLPAPER
    wallpaper         list wallpapers
    wallpaper [name]  apply a wallpaper

  SCREENSAVER
    screensaver       show screensaver settings
    screensaver [id]  set screensaver by id
    screensaver test  run screensaver now
    screensaver off   disable screensaver

  NETWORK & WEB
    ping [host]       ping a hostname (simulated)
    curl [url]        fetch URL headers (real)
    weather [city]    fetch current weather

  FUN
    banner [text]     print big ASCII banner
    matrix            go full matrix for 3s
    cowsay [text]     cow says something
    hack              look very busy\
    bsod              blue screen of death`,

  /* ── System ── */
  clear: () => "__clear__",

  date: () => new Date().toString(),

  uptime: () => {
    const s = Math.floor(performance.now() / 1000);
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = s % 60;
    return `up ${h}h ${m}m ${sec}s  |  load average: 0.42, 0.38, 0.31`;
  },

  whoami: () => `todo`,

  echo: (args) => args.join(" "),

  env: () => `\
TERM=xterm-256color
SHELL=/bin/bash
LANG=en_US.UTF-8
HOME=/home/mithras
EDITOR=vim
OS=Portfolio
NODE_ENV=production
GITHUB_USER=mithraskuipers`,

  neofetch: () => `
  Mithras @ Portfolio
  ─────────────────────────
  OS:      Portfolio
  Host:    GitHub Pages
  Shell:   TODO
  Theme:   TODO
  Terminal: PortfolioTerm
  Apps:    ${APPS.length}
  Repos:   ${GITHUB_REPOS.length}`,

  /* ── Navigation ── */
  ls: (args, io) => {
    const flag = args[0];
    if (flag === "-la" || flag === "-l") {
      return APPS.map(
        (a) => `-rwxr-xr-x  mithras  ${String(a.id).padEnd(20)} ${a.label}`,
      ).join("\n");
    }
    return APPS.map((a) => `  ${a.icon}  ${a.id.padEnd(20)} ${a.label}`).join(
      "\n",
    );
  },

  open: (args) => {
    const id = args[0];
    if (!id) return "Usage: open [id]   (try: ls)";
    const app = APPS.find((a) => a.id === id);
    if (!app)
      return `bash: open: app not found: "${id}"\nTry 'ls' to see available apps.`;
    openApp(id);
    return `Opening ${app.icon} ${app.label}…`;
  },

  repos: () => {
    if (!GITHUB_REPOS.length)
      return "No repos configured. Add entries to GITHUB_REPOS in apps.js";
    return GITHUB_REPOS.map(
      (r) =>
        `  ${r.icon || "📦"}  ${r.repo.padEnd(35)} ${r.label || r.repo.split("/").pop()}`,
    ).join("\n");
  },

  github: (args) => {
    const slug = args[0];
    if (!slug) return "Usage: github [owner/repo]";
    const found = GITHUB_REPOS.find(
      (r) => r.repo === slug || r.repo.split("/").pop() === slug,
    );
    if (found) {
      openGithubRepo(found);
      return `Opening ${found.label || found.repo}…`;
    }
    // Open as ad-hoc repo
    openGithubRepo({
      repo: slug.includes("/") ? slug : `mithras/${slug}`,
      icon: "📦",
      label: slug,
    });
    return `Fetching README for ${slug}…`;
  },

  /* ── Wallpaper ── */
  wallpaper: (args) => {
    const name = args.join(" ").trim();
    if (!name) {
      return WALLPAPERS.map(
        (w, i) =>
          `  [${i}] ${w.name}${w.color ? " (colour)" : w.url ? " (url)" : " (file)"}`,
      ).join("\n");
    }
    // match by name or index
    const idx = parseInt(name);
    const wp = isNaN(idx)
      ? WALLPAPERS.find((w) =>
          w.name.toLowerCase().includes(name.toLowerCase()),
        )
      : WALLPAPERS[idx];
    if (!wp)
      return `wallpaper: not found: "${name}"\nTry 'wallpaper' to list options.`;
    Wallpaper.applyByEntry(wp);
    return `Wallpaper set to: ${wp.name}`;
  },

  /* ── Screensaver ── */
  screensaver: (args) => {
    const sub = args[0];
    if (!sub) {
      Screensaver.openDialog();
      return "Opening screensaver settings…";
    }
    if (sub === "test" || sub === "run") {
      Screensaver.activate();
      return null;
    }
    if (sub === "off") {
      Screensaver.setCfg("delay", 0);
      return "Screensaver disabled.";
    }
    if (sub === "list") {
      return Object.entries(Screensaver.SCREENSAVERS)
        .map(([id, ss]) => `  ${ss.icon}  ${id.padEnd(14)} ${ss.name}`)
        .join("\n");
    }
    // Try setting by id
    if (Screensaver.SCREENSAVERS[sub]) {
      Screensaver.setCfg("name", sub);
      return `Screensaver set to: ${Screensaver.SCREENSAVERS[sub].name}`;
    }
    return `screensaver: unknown option: "${sub}"\nOptions: test, off, list, or a screensaver id`;
  },

  /* ── Network ── */
  ping: async (args, { print, spinner }) => {
    const host = args[0] || "github.com";
    const spin = spinner(`Pinging ${host}…`);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    spin.stop();
    const lines = [];
    for (let i = 1; i <= 4; i++) {
      const ms = (10 + Math.random() * 40).toFixed(1);
      lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=57 time=${ms} ms`);
      print(lines[lines.length - 1]);
      await new Promise((r) => setTimeout(r, 200));
    }
    return `\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`;
  },

  curl: async (args, { spinner }) => {
    const url = args[0];
    if (!url) return "Usage: curl [url]";
    if (!url.startsWith("http"))
      return `curl: invalid URL — must start with http(s)://`;
    const spin = spinner(`Fetching ${url}…`);
    try {
      const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
      spin.stop();
      return `HTTP/1.1 ${res.status || 200} OK\nContent-Type: ${res.headers?.get("content-type") || "unknown"}\nServer: remote\nURL: ${url}`;
    } catch (e) {
      spin.stop();
      return `HTTP/1.1 200 OK\nURL: ${url}\n(Headers not available — CORS restricted)`;
    }
  },

  weather: async (args, { spinner }) => {
    const city = args.join(" ") || "Amsterdam";
    const spin = spinner(`Fetching weather for ${city}…`);
    try {
      // Open-Meteo geocoding + weather (no API key needed)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      );
      const geo = await geoRes.json();
      if (!geo.results?.length) {
        spin.stop();
        return `weather: city not found: "${city}"`;
      }
      const { latitude: lat, longitude: lon, name, country } = geo.results[0];
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=ms`,
      );
      const w = await wRes.json();
      const c = w.current;
      spin.stop();
      const codes = {
        0: "☀️ Clear",
        1: "🌤 Mainly clear",
        2: "⛅ Partly cloudy",
        3: "☁️ Overcast",
        45: "🌫 Foggy",
        48: "🌫 Icy fog",
        51: "🌦 Light drizzle",
        61: "🌧 Light rain",
        71: "🌨 Light snow",
        80: "🌦 Showers",
        95: "⛈ Thunderstorm",
      };
      const desc =
        codes[c.weather_code] ||
        codes[Math.round(c.weather_code / 10) * 10] ||
        "🌡 Unknown";
      return `Weather for ${name}, ${country}
  ${desc}
  Temperature : ${c.temperature_2m}°C
  Humidity    : ${c.relative_humidity_2m}%
  Wind        : ${c.wind_speed_10m} m/s`;
    } catch (e) {
      spin.stop();
      return `weather: failed to fetch — ${e.message}`;
    }
  },

  /* ── Fun ── */
  banner: (args, { printHTML }) => {
    const text = args.join(" ") || "MITHRAS";
    // Simple block-letter renderer using CSS
    printHTML(`<div style="font-size:9px;color:#39ff14;letter-spacing:2px;font-family:'Courier New';padding:4px 0;">
      <div style="font-size:22px;font-weight:bold;text-shadow:0 0 8px #0f0;letter-spacing:6px;">${text}</div>
    </div>`);
    return null;
  },

  cowsay: (args) => {
    const text = args.join(" ") || "Moo!";
    const line = "─".repeat(text.length + 2);
    return `  ┌${line}┐\n  │ ${text} │\n  └${line}┘\n        \\  ^__^\n         \\ (oo)\\_______\n           (__)\\       )\\/\\\n               ||----w |\n               ||     ||`;
  },

  hack: async (_, { print, spinner }) => {
    const lines = [
      "Initializing breach sequence…",
      "Bypassing firewall layer 1… ✓",
      "Injecting polymorphic payload…",
      "Cracking 4096-bit RSA… ██████████ 100%",
      "Accessing mainframe… ✓",
      "Downloading schematics…",
      "Uploading virus.exe…",
      "Covering tracks…",
      "ACCESS GRANTED. Welcome, Mithras.",
    ];
    for (const l of lines) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      print(l);
    }
    return null;
  },

  matrix: async (_, { print }) => {
    Screensaver.setCfg("name", "matrix");
    Screensaver.activate();
    await new Promise((r) => setTimeout(r, 4000));
    Screensaver.deactivate();
    return "Welcome back.";
  },

  bsod: () => {
    showBSOD();
    return null;
  },
};

/* ══════════════════════════════════════════════════════════════════
   WINAMP TRACKS
   Add tracks to the Winamp playlist here.
══════════════════════════════════════════════════════════════════ */
const WINAMP_TRACKS = [
  {
    metaData: { artist: 'Linkin Park', title: 'In The End (Mellen Gi & Tommee Profitt Remix)' },
    url: 'https://archive.org/download/linkinparkintheendmellengiamptommeeprofittremix/Linkin%20Park%20-%20In%20The%20End%20%28Mellen%20Gi%20%26amp%3B%20Tommee%20Profitt%20Remix%29.mp3',
  },
  /* ← ADD MORE TRACKS HERE */
];

/* ══════════════════════════════════════════════════════════════════
   WINAMP SKINS
   Paths are relative to index.html.
   Comment out or leave empty if you have no skins — an empty array
   makes Winamp load with the default built-in skin (no alert).
   Add .wsz files to assets/winamp/skins/ then list them here.
══════════════════════════════════════════════════════════════════ */
const WINAMP_SKINS = [
  { url: 'assets/winamp/skins/winamp_skin_wsz_06.zip', name: 'Winamp Skin 06' },
  /* ← ADD MORE SKINS HERE */
];
// NOTE: initialSkin is intentionally NOT set — Webamp will use its
// built-in default skin on startup. Users can switch via Options > Skins.
