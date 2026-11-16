document.getElementById("year").textContent = new Date().getFullYear();

const mobileNav = matchMedia("(max-width: 640px)");

document.querySelector(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current =
        root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // Cycle dark → light → sepia → dark; the button shows the next theme's icon.
    const next = { dark: "light", light: "sepia", sepia: "dark" }[current];
    root.dataset.theme = next;
    try {
        localStorage.setItem("theme", next);
    } catch {
        /* storage blocked: theme just won't persist */
    }
});

const nav = document.querySelector("nav");
const menuToggle = document.querySelector(".menu-toggle");

function setMenuOpen(open) {
    nav.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
}

menuToggle.addEventListener("click", () =>
    setMenuOpen(!nav.classList.contains("menu-open")),
);
nav.querySelectorAll(".link").forEach((a) =>
    a.addEventListener("click", () => setMenuOpen(false)),
);
// Leaving the mobile layout with the menu open would otherwise leave it flagged open.
mobileNav.addEventListener("change", (e) => {
    if (!e.matches) setMenuOpen(false);
});

// Escape closes the menu wherever focus is; focus returns to the toggle only if it was
// inside the menu, so focus elsewhere on the page isn't moved.
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !nav.classList.contains("menu-open")) return;
    const hadFocus = nav.contains(document.activeElement);
    setMenuOpen(false);
    if (hadFocus) menuToggle.focus();
});

// Clicking outside the nav closes the menu.
document.addEventListener("click", (e) => {
    if (nav.classList.contains("menu-open") && !nav.contains(e.target)) {
        setMenuOpen(false);
    }
});

// Only reveal controls after all handlers are installed. If this script fails to load,
// mobile navigation remains visible and JavaScript-only controls stay hidden.
document.documentElement.classList.add("app-ready");
