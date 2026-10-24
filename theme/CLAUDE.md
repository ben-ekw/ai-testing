# CLAUDE.md

- Keep the Google Fonts `<link>` tags (the two `preconnect` hints and the Inter / JetBrains Mono stylesheet) in the `<head>` of `index.html`. Don't move them into `theme.css` as an `@import`: an `@import` makes the browser wait for `theme.css` to load before it starts fetching the fonts, which slows down text rendering.
- If you add or change a font in `theme.css`, update the Google Fonts URL in `index.html` to match.
