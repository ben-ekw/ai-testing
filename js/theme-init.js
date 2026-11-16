// Runs as a blocking script in <head>, before the body renders.

// Apply a saved theme before first paint to avoid a flash of the wrong theme.
try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "sepia")
        document.documentElement.dataset.theme = saved;
} catch {
    /* storage blocked: fall back to the OS theme */
}
