// Runs as a blocking script in <head>, before the body renders.

// Mark that JavaScript is running. CSS only collapses the mobile menu and shows the
// JavaScript-driven controls (theme toggle, menu button) under .js, so the page stays
// usable when scripts are disabled or main.js fails to load.
document.documentElement.classList.add("js");

// Apply a saved theme before first paint to avoid a flash of the wrong theme.
try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "sepia")
        document.documentElement.dataset.theme = saved;
} catch {
    /* storage blocked: fall back to the OS theme */
}
