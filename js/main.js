document.getElementById("year").textContent = new Date().getFullYear();

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobileNav = matchMedia("(max-width: 640px)");

document.querySelector(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // Cycle dark → light → sepia → dark; the button shows the next theme's icon.
    const next = { dark: "light", light: "sepia", sepia: "dark" }[current];
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* storage blocked: theme just won't persist */ }
});

// Mobile menu: below 640px the nav links collapse behind a toggle button.
const nav = document.querySelector("nav");
const menuToggle = document.querySelector(".menu-toggle");

function setMenuOpen(open) {
    nav.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
}

menuToggle.addEventListener("click", () => setMenuOpen(!nav.classList.contains("menu-open")));
nav.querySelectorAll(".link").forEach(a => a.addEventListener("click", () => setMenuOpen(false)));
// Leaving the mobile layout with the menu open would otherwise leave it flagged open.
mobileNav.addEventListener("change", e => { if (!e.matches) setMenuOpen(false); });

// Full-page confetti: bursts pieces up from the bottom and lets them fall under gravity.
const canvas = document.querySelector(".confetti");
const ctx = canvas.getContext("2d");
const colors = ["#f94144", "#f3722c", "#f9c74f", "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#f15bb5"];
const CONFETTI_BURST = 250;
const CONFETTI_MAX = 1000; // cap so rapid clicking can't pile up thousands of pieces
let pieces = [];
let frame = null;

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Rain: a light drizzle. Sparse, short, slow drops at varied depths (far = smaller, slower, fainter),
// drifting on a gentle breeze. Intensity eases in and out over the shower instead of starting/stopping abruptly.
const RAIN_MS = 6000;
let drops = [];
let rainStart = 0;
let rainUntil = 0;

function spawnRain(now) {
    const t = (now - rainStart) / RAIN_MS;            // 0..1 through the shower
    const intensity = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    const rate = 2.2 * intensity * (innerWidth / 1200); // avg drops per frame, scaled to screen width
    let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    while (n--) {
        const z = Math.random();                       // depth: 0 = far, 1 = near
        const len = 6 + z * 10;
        drops.push({
            x: Math.random() * (innerWidth + 120) - 20,
            y: -len - Math.random() * 30,
            vy: 3.5 + z * 3.5 + Math.random() * 0.8,
            len,
            width: 0.6 + z * 0.7,
            alpha: 0.12 + z * 0.3,
            phase: Math.random() * Math.PI * 2,
        });
    }
}

function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const now = performance.now();
    if (now < rainUntil) spawnRain(now);
    drops = drops.filter(d => d.y < innerHeight + d.len);
    ctx.lineCap = "round";
    const breeze = -0.6 + Math.sin(now / 1800) * 0.35; // slow, shifting wind
    for (const d of drops) {
        const vx = breeze * (d.vy / 5) + Math.sin(now / 600 + d.phase) * 0.15;
        d.x += vx;
        d.y += d.vy;
        const k = d.len / d.vy;
        ctx.lineWidth = d.width;
        ctx.strokeStyle = `rgba(150, 180, 215, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - vx * k, d.y - d.len);
        ctx.stroke();
    }
    pieces = pieces.filter(p => p.y < innerHeight + 40);
    for (const p of pieces) {
        p.vy += 0.25;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        p.tilt += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.tilt));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
    }
    const active = pieces.length || drops.length || performance.now() < rainUntil;
    frame = active ? requestAnimationFrame(tick) : null;
    if (!frame) ctx.clearRect(0, 0, innerWidth, innerHeight);
}

function stopEffects() {
    pieces = [];
    drops = [];
    rainUntil = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
}

// The effect buttons are hidden by CSS under prefers-reduced-motion. If the preference turns on
// while an effect is running, stop it; the click guards cover the moment before CSS applies.
reducedMotion.addEventListener("change", e => { if (e.matches) stopEffects(); });

document.querySelector(".confetti-btn").addEventListener("click", () => {
    if (reducedMotion.matches) return;
    resize();
    for (let i = 0; i < CONFETTI_BURST; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const speed = 12 + Math.random() * 14;
        pieces.push({
            x: Math.random() * innerWidth,
            y: innerHeight + 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            w: 6 + Math.random() * 6,
            h: 10 + Math.random() * 8,
            rot: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.3,
            tilt: Math.random() * Math.PI,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }
    // Drop the oldest pieces (they're furthest along their fall) beyond the cap.
    if (pieces.length > CONFETTI_MAX) pieces.splice(0, pieces.length - CONFETTI_MAX);
    if (!frame) frame = requestAnimationFrame(tick);
});
document.querySelector(".rain-btn").addEventListener("click", () => {
    if (reducedMotion.matches) return;
    resize();
    rainStart = performance.now();
    rainUntil = rainStart + RAIN_MS;
    if (!frame) frame = requestAnimationFrame(tick);
});
// Only resize the canvas while something is animating; clicks resize it before starting.
addEventListener("resize", () => { if (frame) resize(); });

// User lookup against an in-browser SQLite database (sql.js) seeded with fake, public demo data.
// Everything here ships to the browser, so the table must never hold anything secret.
//
// sql.js is only downloaded on the first search, so a slow or unreachable CDN never blocks the rest
// of the page. Both files are integrity-checked: the script via its SRI attribute, and the WASM
// binary via fetch() with an integrity option, after which it's handed to sql.js directly.
// If you change these URLs, update the CSP in index.html and _headers to match.
const SQLJS_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
const SQLJS_JS_SRI = "sha512-+6Q7hv5pGUBXOuHWw8OdQx3ac7DzM3oJhYqz7SHDku0yl9EBdMqegoPed4GsHRoNF/VQYK2LTYewAIEBrEf/3w==";
const SQLJS_WASM_URL = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm";
const SQLJS_WASM_SRI = "sha512-CJH7qneqrGY0mG25MkTl5ngjoTBv3m1bJXG0OVXK/kAe2n+IZdDtdqfgbspy+ozOSjA9g8bzCkcwpcZE9jcTZA==";

const lookupBtn = document.querySelector(".lookup-btn");
const lookupPanel = document.getElementById("lookup-panel");
const lookupInput = document.getElementById("lookup-name");
const lookupSubmit = lookupPanel.querySelector("button[type=submit]");
const lookupOut = lookupPanel.querySelector(".lookup-out");
let dbPromise = null;
let sqlJsScript = null;

function loadSqlJs() {
    if (typeof initSqlJs === "function") return Promise.resolve();
    return new Promise((resolve, reject) => {
        // A failed earlier attempt leaves a dead <script>; replace it so the retry re-downloads.
        sqlJsScript?.remove();
        sqlJsScript = document.createElement("script");
        sqlJsScript.src = SQLJS_JS_URL;
        sqlJsScript.integrity = SQLJS_JS_SRI;
        sqlJsScript.crossOrigin = "anonymous";
        sqlJsScript.referrerPolicy = "no-referrer";
        sqlJsScript.onload = () => typeof initSqlJs === "function"
            ? resolve()
            : reject(new Error("sql.js loaded but initSqlJs is missing"));
        sqlJsScript.onerror = () => reject(new Error("sql.js failed to load"));
        document.head.append(sqlJsScript);
    });
}

function getDb() {
    if (!dbPromise) {
        // Load the script first so a missing script fails fast, before the 655 KB WASM download.
        dbPromise = loadSqlJs()
            .then(() => fetch(SQLJS_WASM_URL, { integrity: SQLJS_WASM_SRI }))
            .then(res => {
                if (!res.ok) throw new Error(`WASM download failed: HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(wasmBinary => initSqlJs({ wasmBinary }))
            .then(SQL => {
                const db = new SQL.Database();
                db.run(`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT);
                    INSERT INTO users (name, email, role) VALUES
                        ('alice', 'alice@example.com', 'user'),
                        ('bob',   'bob@example.com',   'user'),
                        ('carol', 'carol@example.com', 'admin');
                `);
                return db;
            })
            .catch(err => {
                dbPromise = null; // allow a later search to retry
                throw err;
            });
    }
    return dbPromise;
}

function setLookupOpen(open) {
    lookupPanel.hidden = !open;
    lookupBtn.setAttribute("aria-expanded", String(open));
    if (open) lookupInput.focus();
}

lookupBtn.addEventListener("click", () => setLookupOpen(lookupPanel.hidden));

// Escape closes whichever popup is open, wherever focus is. Focus returns to the popup's
// toggle only if it was inside the popup, so we never yank focus from elsewhere on the page.
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!lookupPanel.hidden) {
        const hadFocus = lookupPanel.contains(document.activeElement);
        setLookupOpen(false);
        if (hadFocus) lookupBtn.focus();
    }
    if (nav.classList.contains("menu-open")) {
        const hadFocus = nav.contains(document.activeElement);
        setMenuOpen(false);
        if (hadFocus) menuToggle.focus();
    }
});

// Clicking outside a popup closes it.
document.addEventListener("click", e => {
    if (!lookupPanel.hidden && !lookupPanel.contains(e.target) && !lookupBtn.contains(e.target)) {
        setLookupOpen(false);
    }
    if (nav.classList.contains("menu-open") && !nav.contains(e.target)) setMenuOpen(false);
});

function formatUser([id, name, email, role]) {
    return `#${id} ${name} · ${email} · ${role}`;
}

lookupPanel.addEventListener("submit", async e => {
    e.preventDefault();
    if (lookupSubmit.disabled) return; // a search is already running
    const name = lookupInput.value.trim();
    if (!name) {
        lookupOut.textContent = "Please enter a user name.";
        return;
    }

    lookupSubmit.disabled = true;
    lookupPanel.setAttribute("aria-busy", "true");
    lookupOut.textContent = dbPromise ? "Searching…" : "Loading database…";
    try {
        const db = await getDb();
        const stmt = db.prepare("SELECT id, name, email, role FROM users WHERE name = ?");
        try {
            stmt.bind([name]);
            const rows = [];
            while (stmt.step()) rows.push(stmt.get());
            lookupOut.textContent = rows.length ? rows.map(formatUser).join("\n") : "No matching user.";
        } finally {
            stmt.free();
        }
    } catch (err) {
        console.error("Lookup failed:", err);
        lookupOut.textContent = "Lookup is unavailable. Please try again later.";
    } finally {
        lookupSubmit.disabled = false;
        lookupPanel.removeAttribute("aria-busy");
    }
});
