# AIwebsite

A static, single-page site with a polished landing-page layout, light/dark/sepia themes, and a minimal script footprint for a production-safe experience.

## Run locally

Opening `index.html` directly works, but serving it over HTTP is closer to production:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Lint

```sh
npm install
npm run lint          # html-validate, stylelint and ESLint
npm run format        # format with Prettier
npm run format:check  # what CI runs
```

CI runs the same checks, plus `npm audit` and a Prettier format check, on every push to `main` and every pull request (`.github/workflows/lint.yml`). Dependabot opens weekly update PRs for the npm packages and the pinned GitHub Actions. Node is only used for linting; the site itself has no build step.

## Layout

| Path               | What it is                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| `index.html`       | Markup, CSP and metadata                                                     |
| `theme/theme.css`  | Theme tokens and all styles (see `theme/CLAUDE.md` for font rules)           |
| `js/theme-init.js` | Applies the saved theme before first paint; loaded blocking in `<head>`      |
| `js/main.js`       | Theme toggle and mobile menu behavior; reveals controls after initialization |
| `favicon.svg`      | Site icon                                                                    |
| `_headers`         | HTTP security headers for Netlify / Cloudflare Pages                         |

## Deploying

Send the headers in `_headers` from whichever host you use. Netlify and Cloudflare Pages read that file as-is. For other hosts (Azure Static Web Apps, Vercel, nginx, …), copy the same headers into that host's config. GitHub Pages can't set custom headers, so it gets only the `<meta>` CSP, which has no clickjacking protection.

The headers add what a `<meta>` CSP can't: `frame-ancestors 'none'` (stops other sites framing the page), plus `nosniff`, a referrer policy, a permissions policy and HSTS.

## Browser support

The page works in all current browsers. The OS dark-mode theme uses `:not()` with a selector list (Chrome 88+, Firefox 84+, Safari 9+).

With JavaScript disabled or the main app script unavailable, the content and navigation still work. JavaScript-only controls appear after their handlers initialize.

## Security notes

- **No external scripts for demo features.** The page keeps a minimal client-side footprint and does not load remote code for optional experiments. The CSP allows scripts only from this origin. Keep new JavaScript in `js/`. The policy lives in two places, the `<meta>` tag in `index.html` and `_headers`; keep them in sync.
- **The page remains safe by default.** All runtime behavior is simple and local. Avoid adding demo databases, user lookups, or remote data fetches unless they are required for a real product feature.

## License

Released into the public domain under [the Unlicense](LICENSE.txt).
