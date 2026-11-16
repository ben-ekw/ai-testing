# AIwebsite

A static, single-page site: light, dark and sepia themes, confetti and rain effects, and a user-lookup demo backed by an in-browser SQLite database ([sql.js](https://sql.js.org)).

## Run locally

Opening `index.html` directly works, but serving it over HTTP is closer to production:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Lint

```sh
npm install
npm run lint        # html-validate, stylelint and ESLint
```

CI runs the same checks, plus `npm audit`, on every push to `main` and every pull request (`.github/workflows/lint.yml`). Dependabot opens weekly update PRs for the npm packages and the pinned GitHub Actions. Node is only used for linting; the site itself has no build step.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Markup, CSP and metadata |
| `theme/theme.css` | Theme tokens and all styles (see `theme/CLAUDE.md` for font rules) |
| `js/theme-init.js` | Marks the page as JS-enabled and applies the saved theme before first paint; loaded blocking in `<head>` |
| `js/main.js` | Theme toggle, mobile menu, effects, user lookup |
| `favicon.svg` | Site icon |
| `_headers` | HTTP security headers for Netlify / Cloudflare Pages |

## Deploying

Send the headers in `_headers` from whichever host you use. Netlify and Cloudflare Pages read that file as-is. For other hosts (Azure Static Web Apps, Vercel, nginx, …), copy the same headers into that host's config. GitHub Pages can't set custom headers, so it gets only the `<meta>` CSP, which has no clickjacking protection.

The headers add what a `<meta>` CSP can't: `frame-ancestors 'none'` (stops other sites framing the page), plus `nosniff`, a referrer policy, a permissions policy and HSTS.

## Browser support

The page works in all current browsers. The user lookup needs WebAssembly allowed under a CSP (`'wasm-unsafe-eval'`): Chrome/Edge 97+, Firefox 102+, Safari 16+. In older browsers the lookup says it's unavailable and the rest of the page is unaffected. The OS dark-mode theme uses `:not()` with a selector list (Chrome 88+, Firefox 84+, Safari 9+).

With JavaScript disabled the content and navigation still work. The theme toggle, effects and lookup buttons are hidden.

## Security notes

- **No inline scripts.** The CSP allows scripts only from this origin plus the one sql.js file on cdnjs. Keep new JavaScript in `js/`. The policy lives in two places, the `<meta>` tag in `index.html` and `_headers`; keep them in sync.
- **sql.js is integrity-checked and loaded on demand.** `js/main.js` loads `sql-wasm.js` only when someone first searches, with an SRI hash, and fetches `sql-wasm.wasm` with its own hash. To upgrade sql.js, change the version in `js/main.js`, `index.html` and `_headers`, and update both hashes:

  ```sh
  openssl dgst -sha512 -binary sql-wasm.js | openssl base64 -A
  openssl dgst -sha512 -binary sql-wasm.wasm | openssl base64 -A
  ```

- **The lookup database is public.** It is built in the visitor's browser, so anyone can read every row. Use it for demo data only, never for real users or credentials.

## License

[Mozilla Public License 2.0](LICENSE.txt). sql.js, loaded from cdnjs, is under its own MIT license.
