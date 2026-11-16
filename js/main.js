document.getElementById("year").textContent = new Date().getFullYear();

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

document.querySelector(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // Cycle light → dark → sepia → light; the button shows the next theme's icon.
    const next = { light: "dark", dark: "sepia", sepia: "light" }[current];
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
nav.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("menu-open")) {
        setMenuOpen(false);
        menuToggle.focus();
    }
});

// Full-page confetti: bursts pieces up from the bottom and lets them fall under gravity.
const canvas = document.querySelector(".confetti");
const ctx = canvas.getContext("2d");
const colors = ["#f94144", "#f3722c", "#f9c74f", "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#f15bb5"];
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

// The effect buttons are hidden by CSS under prefers-reduced-motion; the guards below cover
// a preference change while the page is open.
document.querySelector(".confetti-btn").addEventListener("click", () => {
    if (reducedMotion.matches) return;
    resize();
    for (let i = 0; i < 250; i++) {
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
// The WASM binary is fetched with a Subresource Integrity check and handed to sql.js directly,
// so both the script (see the <script integrity> in index.html) and the binary are verified.
const SQLJS_WASM_URL = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm";
const SQLJS_WASM_SRI = "sha512-CJH7qneqrGY0mG25MkTl5ngjoTBv3m1bJXG0OVXK/kAe2n+IZdDtdqfgbspy+ozOSjA9g8bzCkcwpcZE9jcTZA==";

const lookupBtn = document.querySelector(".lookup-btn");
const lookupPanel = document.getElementById("lookup-panel");
const lookupInput = document.getElementById("lookup-name");
const lookupOut = lookupPanel.querySelector(".lookup-out");
let dbPromise = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = fetch(SQLJS_WASM_URL, { integrity: SQLJS_WASM_SRI })
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
                dbPromise = null;
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

lookupPanel.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        setLookupOpen(false);
        lookupBtn.focus();
    }
});

lookupPanel.addEventListener("submit", async e => {
    e.preventDefault();
    const name = lookupInput.value.trim();
    if (!name) {
        lookupOut.textContent = "Please enter a user name.";
        return;
    }

    try {
        const db = await getDb();
        const stmt = db.prepare("SELECT id, name, email, role FROM users WHERE name = ?");
        try {
            stmt.bind([name]);
            const rows = [];
            while (stmt.step()) rows.push(stmt.get());
            lookupOut.textContent = rows.length
                ? rows.map(r => r.join("  |  ")).join("\n")
                : "No matching user.";
        } finally {
            stmt.free();
        }
    } catch (err) {
        console.error("Lookup failed:", err);
        lookupOut.textContent = "Lookup is unavailable. Please try again later.";
    }
});
