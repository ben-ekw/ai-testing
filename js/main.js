document.getElementById("year").textContent = new Date().getFullYear();

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobileNav = matchMedia("(max-width: 640px)");

document.querySelector(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current =
        root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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
mobileNav.addEventListener("change", (e) => {
    if (!e.matches) setMenuOpen(false);
});

if (reducedMotion.matches) {
    document.documentElement.classList.add("reduced-motion");
}
