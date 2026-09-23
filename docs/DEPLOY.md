# CareConnect — Deployment

> **Vercel does not use the Dockerfile.** Vercel builds the repo directly and
> serves `dist/` from its CDN, configured by [`vercel.json`](../vercel.json).
> The [Dockerfile](#self-hosting-with-docker) is for hosts that run containers
> — Fly.io, Railway, Cloud Run, Kubernetes, a VPS.
>
> Pick one. You do not need both.

---

## 1. Before you deploy — repo hygiene

This repository had `node_modules/` (7,626 files), `dist/` and
`*.tsbuildinfo` committed. They are now untracked and covered by
`.gitignore`, but **the change is staged, not committed**:

```bash
git status --short      # ~7,600 staged deletions, plus the new config files
```

Commit it before you push, or every Vercel build will download a repository
mostly made of dependencies it is about to reinstall anyway:

```bash
git add -A
git commit -m "Add deployment config; stop tracking build artifacts"
git push origin main
```

The files stay on your disk — `git rm --cached` only removes them from
version control.

> **Note on history.** Past commits still contain those blobs, so a fresh
> `git clone` stays large. That is cosmetic and safe to ignore. Shrinking it
> requires rewriting history with `git filter-repo`, which **breaks every
> existing clone** — only worth doing if nobody else has pulled yet.

---

## 2. Deploy to Vercel

### Option A — CLI (fastest)

```bash
bunx vercel login
bunx vercel            # preview deployment
bunx vercel --prod     # production
```

Vercel reads `vercel.json`, so accept the detected settings when prompted.

### Option B — GitHub import (recommended for a team)

1. Push to GitHub (this repo already points at
   `github.com/Sanjna0301/careconnect.git`).
2. Go to **vercel.com/new** and import the repository.
3. Leave every build setting on its default — `vercel.json` supplies them.
4. **Deploy.**

Every push to `main` then ships to production, and every pull request gets its
own preview URL.

### What `vercel.json` configures

| Setting | Value | Why |
|---|---|---|
| `framework` | `vite` | Correct build detection and output handling |
| `installCommand` | `bun install --frozen-lockfile` | Uses `bun.lock`; fails loudly if it is stale |
| `buildCommand` | `bun run build` | Runs `tsc -b` first — **a type error fails the deploy** |
| `outputDirectory` | `dist` | Where Vite writes |
| `rewrites` | `/(.*) → /index.html` | SPA fallback. Without it, refreshing `/wallet` 404s. Vercel checks the filesystem first, so real assets still serve. |
| `headers` → `/assets/*` | `max-age=31536000, immutable` | Filenames are content-hashed, so they can cache forever |
| `headers` → `/sw.js` | `max-age=0, must-revalidate` | A stale service worker can strand users on an old build |
| `headers` → security | CSP, HSTS, `X-Frame-Options`, `Permissions-Policy` | Verified against the real build: no inline scripts, and only Google Fonts is allowed as an external origin |

`Permissions-Policy` explicitly allows `geolocation=(self)` and
`microphone=(self)`. **Do not tighten those to `()`** — it would kill the
hospital locator and voice search.

### Post-deploy checklist

Run through this on your phone, on the production URL:

- [ ] `/` loads and the red **EMERGENCY** button is visible without scrolling
- [ ] Refreshing directly on `https://…/wallet` returns the page, not a 404
- [ ] **Use my location** prompts for permission and distances appear
- [ ] The 🎤 voice button appears (Chrome / Safari 16+) and hears you
- [ ] **Add to Home Screen** works and the app opens full-screen
- [ ] Open `/first-aid`, enable aeroplane mode, reload — it still renders
- [ ] `curl -sI https://your-domain/sw.js | grep -i cache-control` → `max-age=0`

### Environment variables

None are required today — all data is local seed data. When you add
integrations, set them in **Project → Settings → Environment Variables**.

Anything the browser reads **must** be prefixed `VITE_`, and is **public** in
the built bundle. Never put a secret API key behind a `VITE_` prefix; it
belongs in a backend service. See [`.env.example`](../.env.example).

---

## 3. Self-hosting with Docker

Only if you are *not* using Vercel.

```bash
docker build -t careconnect .
docker run --rm -p 8080:80 careconnect
# → http://localhost:8080
```

Or with Compose:

```bash
docker compose up --build
```

### How the image is built

Two stages:

1. **`oven/bun:1-alpine`** — installs dependencies from `bun.lock`, then runs
   `bun run build`. Because `tsc -b` runs first, a type error fails the image
   build rather than shipping a broken site.
2. **`nginx:alpine`** — serves the static output. **No Bun or Node at
   runtime.** Final image is roughly 55 MB.

Manifests are copied before the source, so editing a component reuses the
cached dependency layer instead of reinstalling everything.

### What the nginx config handles

- SPA fallback via `try_files $uri $uri/ /index.html`
- Immutable caching for `/assets/`, no-cache for `/sw.js` and the manifest
- gzip for text assets — this is what matters on a weak mobile connection
- The same security headers as the Vercel config
- `GET /healthz` → `200 ok`, used by the container `HEALTHCHECK`

> One nginx subtlety worth knowing if you edit
> [`docker/nginx.conf`](../docker/nginx.conf): an `add_header` inside a
> `location` block **discards every header inherited from the server block**.
> That is why the security headers live in a separate file that each location
> `include`s, rather than being declared once at the top.

### TLS

The image serves plain HTTP on port 80 and expects TLS to be terminated in
front of it — a load balancer, Cloudflare, or Caddy/Traefik as a reverse
proxy. **HTTPS is not optional in production:** geolocation, the microphone
and the service worker all refuse to run on an insecure origin.

### Deploying the image

<details>
<summary><strong>Fly.io</strong></summary>

```bash
fly launch --dockerfile Dockerfile --internal-port 80
fly deploy
```
TLS is automatic.
</details>

<details>
<summary><strong>Google Cloud Run</strong></summary>

Cloud Run injects a `$PORT` (default 8080) and nginx here listens on 80, so
set the container port explicitly:

```bash
gcloud run deploy careconnect --source . --port 80 --allow-unauthenticated
```
</details>

<details>
<summary><strong>Railway</strong></summary>

Railway auto-detects the Dockerfile. Set the exposed port to **80**.
</details>

---

## 4. Other static hosts

The build output is plain static files. Any host works, but **all of them need
the SPA fallback** or deep links will 404.

<details>
<summary><strong>Netlify</strong> — add <code>public/_redirects</code></summary>

```
/*  /index.html  200
```
</details>

<details>
<summary><strong>Cloudflare Pages</strong></summary>

Build command `bun run build`, output directory `dist`, and enable
**Single-page application** in the build settings.
</details>

<details>
<summary><strong>GitHub Pages</strong></summary>

Workable but awkward: Pages has no rewrite rules, so the usual trick is to
copy `index.html` to `404.html` after building. Prefer Vercel or Cloudflare
Pages for this app.
</details>

---

## 5. Troubleshooting a deployment

| Symptom | Cause and fix |
|---|---|
| Build fails on Vercel with a TypeScript error | Correct — `buildCommand` runs `tsc -b`. Run `bun run verify` locally and fix it. |
| `bun: command not found` in the Vercel build log | Vercel's image could not resolve Bun. Remove `installCommand` from `vercel.json` to fall back to auto-detection, or set it to `npm install`. |
| `--frozen-lockfile` fails | `bun.lock` is out of date. Run `bun install` locally and commit the updated lockfile. |
| Refreshing a deep link 404s | The SPA rewrite is missing. Confirm `vercel.json` is committed at the repo root. |
| Site loads but location and voice do nothing | You are on HTTP, or `Permissions-Policy` is blocking them. Both features require HTTPS. |
| A deploy ships but users keep seeing the old version | `/sw.js` is being cached. Verify with `curl -sI https://your-domain/sw.js`; it must return `max-age=0`. |
| Fonts do not load and the console shows CSP errors | You changed the CSP. `style-src` needs `https://fonts.googleapis.com` and `font-src` needs `https://fonts.gstatic.com`. |
| Docker build fails at `bun install` | Stale lockfile, or the build context excluded a needed file. Check [`.dockerignore`](../.dockerignore). |
