# AIwebsite

A static, single-page site: light, dark and sepia themes, confetti and rain effects, and a user-lookup demo backed by an in-browser SQLite database ([sql.js](https://sql.js.org)).

## Run locally

Serve the folder over HTTP rather than opening `index.html` as a file, so the Content-Security-Policy and the WASM download behave as they will in production:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Lint

```sh
npm install
npm run lint        # html-validate, stylelint and ESLint
```

CI runs the same checks, plus `npm audit`, on every push to `main` and every pull request (`.github/workflows/lint.yml`). Node is only used for linting; the site itself has no build step.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Markup, CSP and metadata |
| `theme/theme.css` | Theme tokens and all styles (see `theme/CLAUDE.md` for font rules) |
| `js/theme-init.js` | Applies the saved theme before first paint; loaded blocking in `<head>` |
| `js/main.js` | Theme toggle, mobile menu, effects, user lookup |
| `favicon.svg` | Site icon |

## Security notes

- **No inline scripts.** The CSP in `index.html` allows scripts only from this origin and `cdnjs.cloudflare.com`. Keep new JavaScript in `js/`. If your host can set HTTP headers, send the same policy as a `Content-Security-Policy` header and add `frame-ancestors 'none'`, which a `<meta>` tag can't set.
- **sql.js is integrity-checked.** `sql-wasm.js` has an `integrity` attribute in `index.html`, and `js/main.js` fetches `sql-wasm.wasm` with its own SRI hash. To upgrade sql.js, change the version in both places and update both hashes:

  ```sh
  openssl dgst -sha512 -binary sql-wasm.wasm | openssl base64 -A
  ```

- **The lookup database is public.** It is built in the visitor's browser, so anyone can read every row. Use it for demo data only, never for real users or credentials.

## License

[Mozilla Public License 2.0](LICENSE). sql.js, loaded from cdnjs, is under its own MIT license.
