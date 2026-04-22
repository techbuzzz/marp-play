<div align="center">

# 🎬 Marp Player

**Turn plain Markdown into beautiful, shareable slide decks — with animations, PDF export, and a first-class API for AI agents.**

[![Live demo](https://img.shields.io/badge/demo-marp--play.techbuzzz.me-7D63FF?logo=vercel&logoColor=white&style=for-the-badge)](https://marp-play.techbuzzz.me)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&style=for-the-badge)](https://nextjs.org)
[![Made for AI agents](https://img.shields.io/badge/MCP-ready-8B5CF6?style=for-the-badge)](https://modelcontextprotocol.io)

<img src="./docs/marp-player-hero.jpeg" alt="Marp Player — live editor on the left, rendered slide with cards layout on the right, control panel for theme / animation / autoplay below" width="100%" />

<sub>Marp Player rendering the bundled <code>all-features.md</code> example on <a href="https://marp-play.techbuzzz.me">marp-play.techbuzzz.me</a>.</sub>

</div>

---

## ✨ What is Marp Player?

**Marp Player** is a modern, open Next.js application that turns [Marp](https://marp.app) Markdown into a full-featured presentation experience **in the browser**:

- Paste or load Markdown on the left, get rendered slides on the right — live.
- Swap themes, enable slide animations (Animate.css-powered), autoplay, click-to-advance, fullscreen.
- Export a pixel-perfect **16:9 PDF** of your deck.
- **Share** a deck via a clean public link (editor hidden, play-only mode for viewers).
- Plug AI agents — Claude, ChatGPT, any MCP-compatible client — straight into the player via the built-in **REST + OpenAPI** interface.

It is designed to be **self-hostable in under 5 minutes** (Docker, bare-metal, or managed Postgres + Node), and to be genuinely useful both as a human editor and as a tool surface for LLMs.

---

## 🔥 Feature tour

| Area | What you get |
| --- | --- |
| **Live editor** | Full Marp syntax (frontmatter, directives, themes, custom CSS, HTML), server-side rendering via `@marp-team/marp-core`, sub-second refresh with debouncing. `New` / `Load` / `Save` buttons let you reset, import (`.md` / `.markdown` / `.txt` / `.json`) or export the current deck as a plain `.md` file (Marp-compatible, round-trips with Load) — `New` asks for confirmation when the editor has unsaved content. |
| **Themes** | 4 built-in themes (Modern / Minimal / Dark / Light) plus anything you ship in Marp CSS. |
| **Animations** | 38 Animate.css transitions, 5 presets (None / Fade / Bounce / Slide / Flip) and a **Per-slide** mode driven by `<!-- _animateIn: fadeInUp -->` directives. |
| **Playback** | Keyboard shortcuts (arrows, space, F for fullscreen), click-to-advance toggle, autoplay with 1–10 s interval, speaker notes panel. |
| **PDF export** | 1280×720 landscape PDF rendered through a headless Chromium pipeline, one slide per page. |
| **Sharing** | One-click share modal, URL of the form `/?s=<id>`, viewers land in a clean play-only mode with the editor collapsed. |
| **MCP / API** | Native MCP server at `/api/v1/mcp` (Streamable HTTP, JSON-RPC 2.0) **and** OpenAPI 3.1 spec at `/api/v1/openapi`. DB-backed API keys (SHA-256 hashed), Bearer auth, AI-agent-friendly tools for render / share / fetch / delete. |
| **Tiered auth** | **UI** uses a same-origin `/api/internal/play` endpoint — no token needed, so the Share button Just Works™. **REST & MCP** require a Bearer token. Every row is stamped with its `source` (`ui` / `api` / `mcp`) so you always know who created it. |
| **Encryption at rest** | `SharedPresentation.markdown` is transparently AES-256-CBC encrypted via a Prisma Client extension. `enc:` prefix marks encrypted rows so legacy plain-text data stays readable and is upgraded lazily on the next write. |
| **SEO & LLM-ready** | Rich metadata, structured data (SoftwareApplication / WebApplication / FAQPage), dynamic `robots.txt` + `sitemap.xml`, `llms.txt` + `llms-full.txt`, allow-listed crawlers for GPTBot / ClaudeBot / PerplexityBot. |
| **Hydration-safe** | Strict SSR/CSR parity — no random/date-based state in render paths. |

---

## 🖼️ The UI in one picture

The screenshot above shows the three core zones:

1. **Top bar** — title, `Example` / `MCP` buttons on the left; `PDF` / `Share` / `Fullscreen` on the right; `SlideNavigator` centered for quick jumping.
2. **Main area** — Markdown editor (Load / Save) on the left, rendered slide on the right.
3. **Control panel** (below the slide) — Theme, Animation preset, Click-to-advance, Play/Pause + interval.

When a visitor opens a shared `?s=<id>` URL, the `Example` / `MCP` / `Share` controls are hidden and the editor is collapsed so viewers get a clean, presentation-only experience.

---

## 🚀 Quick start (local dev)

### Prerequisites

- **Node.js ≥ 20** (we test on 20.x and 22.x)
- **Yarn** (Classic or Berry) — `npm i -g yarn` if needed
- **PostgreSQL 14+** — any provider works (local, Supabase, Neon, RDS, Railway, …)

### 1. Clone & install

```bash
git clone https://github.com/techbuzzz/marp-play.git
cd marp-play/nextjs_space
yarn install
```

### 2. Configure environment

Create `nextjs_space/.env`:

```env
# --- Required ---------------------------------------------------------------
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?connect_timeout=15"

# --- Optional: AI-assisted features and PDF export --------------------------
# LLM API key (Abacus.AI routeLLM-compatible).
# Needed for /api/v1/render-pdf and /api/export-pdf.
ABACUSAI_API_KEY="your_llm_api_key"

# --- Optional: social-support gate in MCP modal -----------------------------
LINKEDIN_PERS_URL="https://www.linkedin.com/in/your-handle/"
GITHUB_CURRENT_REPO="https://github.com/your-org/your-fork"

# --- Optional: legacy static API keys (comma-separated) ---------------------
# New deployments should use the in-app "Generate API Key" flow instead.
# MARP_API_KEYS="key1,key2,key3"
```

### 3. Database schema

```bash
yarn prisma generate
yarn prisma db push          # creates the tables (shared_presentations, app_api_keys)
```

### 4. Run it

```bash
yarn dev                     # http://localhost:3000
```

Open the URL, hit the **Example** button, and you should see the `all-features.md` deck rendered live.

---

## 🐳 Self-hosting with Docker

The repository ships a production-ready `Dockerfile` (multi-stage, `node:20-alpine`, `dumb-init` for signal handling) and a development-oriented `docker-compose.yml`.

### Option A — Docker Compose (recommended for local / single-host)

```bash
cp nextjs_space/.env.example nextjs_space/.env   # or create it manually (see above)
docker compose up --build -d
docker compose logs -f app
```

The app will be available at `http://localhost:3000`. Source changes hot-reload because `nextjs_space/` is bind-mounted into the container.

> **Heads-up:** by default `docker-compose.yml` runs `yarn dev`. For production, use the `Dockerfile` directly (`docker build -t marp-player .` → `docker run -p 3000:3000 ...`) or override the `command:` in compose to `node server.js`.

### Option B — Plain Docker (production)

```bash
docker build -t marp-player .
docker run -d \
  --name marp-player \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ABACUSAI_API_KEY="..." \
  -e LINKEDIN_PERS_URL="https://www.linkedin.com/in/you/" \
  -e GITHUB_CURRENT_REPO="https://github.com/you/your-fork" \
  --restart unless-stopped \
  marp-player
```

Then front it with your favourite reverse proxy (Caddy, nginx, Traefik). An example Caddyfile:

```caddy
marp.example.com {
    reverse_proxy localhost:3000
    encode gzip zstd
}
```

### Option C — Bare metal / systemd

```bash
# on your server
git clone https://github.com/techbuzzz/marp-play.git
cd marp-play/nextjs_space
yarn install --frozen-lockfile
yarn prisma generate && yarn prisma db push
yarn build
# Next.js standalone output lives in .next/standalone — copy static & public next to it.
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
PORT=3000 NODE_ENV=production node .next/standalone/server.js
```

Minimal `systemd` unit (`/etc/systemd/system/marp-player.service`):

```ini
[Unit]
Description=Marp Player
After=network.target

[Service]
Type=simple
User=marp
WorkingDirectory=/opt/marp-play/nextjs_space/.next/standalone
EnvironmentFile=/etc/marp-player.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 🤖 MCP / REST API

Marp Player ships **two** integration paths so every agent framework is first-class:

1. **Native MCP server** at `POST /api/v1/mcp` — JSON-RPC 2.0 over the Model Context Protocol **Streamable HTTP** transport. Point Claude Desktop, Cursor, Cline or any other MCP client at this URL.
2. **REST + OpenAPI 3.1** — for platforms that ingest plain tool definitions (OpenAI GPTs Actions, LangChain, LlamaIndex, n8n, Make, …).

Both share the same Bearer-token auth scheme and the same underlying storage.

### Base URLs

- **MCP endpoint:** `POST {BASE}/api/v1/mcp`
- **OpenAPI spec:** `GET {BASE}/api/v1/openapi`
- **API index:** `GET {BASE}/api/v1`
- **LLM-friendly docs:** `GET {BASE}/llms-full.txt` · `GET {BASE}/llms.txt`

### MCP tools

| Tool | Purpose |
| --- | --- |
| `create_share_link` | Store Markdown → return a public play URL. |
| `render_pdf` | Markdown → 16:9 PDF returned as a base64 `resource` content item. |
| `get_presentation` | Fetch metadata & markdown by id. |
| `delete_presentation` | Revoke a shared presentation. |

Supported MCP methods: `initialize`, `ping`, `tools/list`, `tools/call`, plus the usual `notifications/*`.

### REST endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/keys` | None (public) | **Generate a Bearer token** (shown once, never retrievable). Requires `acknowledgedSocials: true`. |
| `POST` | `/api/v1/play` | Bearer | Store Markdown → return `playUrl` + `embedUrl`. Rows stamped `source="api"`. |
| `POST` | `/api/v1/render-pdf` | Bearer | Markdown → 16:9 landscape PDF binary. |
| `GET`  | `/api/v1/presentations/{id}` | Bearer | Fetch stored deck metadata + markdown. |
| `DELETE` | `/api/v1/presentations/{id}` | Bearer | Delete a stored deck. |
| `POST` | `/api/v1/mcp` | Bearer | MCP Streamable HTTP endpoint (JSON-RPC 2.0). Rows stamped `source="mcp"`. |
| `GET`  | `/api/v1/openapi` | None | OpenAPI 3.1 spec for non-MCP agents. |
| `POST` | `/api/internal/play` | Same-origin only | **UI-only** Share endpoint — browser → 201. External callers get 403; they must use `/api/v1/play` with a token. Rows stamped `source="ui"`. |

### Authentication surfaces (UI vs REST vs MCP)

Marp Player separates **human UI traffic** from **programmatic traffic**, because forcing end users to create an API key just to click *Share* would be terrible UX, while letting bots hit the same endpoint without identity would be terrible ops. Three surfaces, one storage:

| Surface | Endpoint | Auth | `source` tag |
| --- | --- | --- | --- |
| Web UI **Share** button | `POST /api/internal/play` | Same-origin check (browser `Origin` header must equal deployment origin) | `ui` |
| REST / OpenAPI clients | `POST /api/v1/play` | Bearer token (DB-backed `AppApiKey` or legacy `MARP_API_KEYS`) | `api` |
| MCP `create_share_link` | `POST /api/v1/mcp` | Bearer token (same as REST) | `mcp` |

All three paths write to the same `shared_presentations` table. The `source` column lets you audit usage without any JOINs:

```sql
SELECT source, COUNT(*) FROM shared_presentations GROUP BY source;
```

The internal endpoint additionally enforces a 256 KiB cap on markdown and a 1-year max expiry — large or long-lived decks must go through `/api/v1/play`, where the caller has an identity to rate-limit.

### Authentication

Every request carries a Bearer token of the form `mkp_<keyId>.<secret>`:

```http
Authorization: Bearer mkp_AbCdEfGhIjKlMnOpQrStUvWx.abcdefg...
```

Server-side we store **only** the public `keyId` and a **SHA-256 hash** of the secret. The raw token is shown exactly **once** — in the MCP modal after generation, or in the `201` response of `POST /api/v1/keys`. If it's lost, just generate a new one.

### Generating a key via the UI

1. Click the **MCP** button in the top bar → the MCP & API modal opens.
2. Scroll to **Generate an API key**.
3. Tick the two social-support checkboxes (LinkedIn follow + GitHub star) — they unlock the `Generate API Key` button.
4. Copy the token **immediately** — the UI even pre-fills it into the Claude config + cURL snippets for you.
5. Tick *"I have saved the Bearer token"* to close the dialog cleanly.

### Generating a key via the API

```bash
curl -X POST https://marp-play.techbuzzz.me/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"label": "My Claude agent", "acknowledgedSocials": true}'
```

### End-to-end: create a shareable deck

```bash
curl -X POST https://marp-play.techbuzzz.me/api/v1/play \
  -H "Authorization: Bearer mkp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q1 Review",
    "markdown": "---\nmarp: true\ntheme: default\n---\n\n# Q1 Review\n\n---\n\n## Highlights\n\n- Launched Marp Player\n- 2× users MoM\n"
  }'
```

Response:

```json
{
  "success": true,
  "id": "cmo9ycsg10002tv1lxp4wroml",
  "playUrl": "https://marp-play.techbuzzz.me/?s=cmo9ycsg10002tv1lxp4wroml",
  "embedUrl": "https://marp-play.techbuzzz.me/play/cmo9ycsg10002tv1lxp4wroml?embed=true",
  "title": "Q1 Review",
  "slideCount": 2,
  "createdAt": "2026-04-22T11:11:25.426Z",
  "expiresAt": "2026-05-22T11:11:25.425Z"
}
```

### Claude Desktop / Cursor / Cline config

Use the native MCP endpoint — `/api/v1/mcp`, **not** the OpenAPI URL:

```json
{
  "mcpServers": {
    "marp-player": {
      "type": "http",
      "url": "https://marp-play.techbuzzz.me/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer mkp_your_full_token_here"
      }
    }
  }
}
```

Quick handshake with plain curl (no client library required):

```bash
curl -X POST https://marp-play.techbuzzz.me/api/v1/mcp \
  -H "Authorization: Bearer mkp_your_full_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "demo", "version": "1.0.0" }
    }
  }'
```

### House-keeping

- **Expired decks** are pruned on every `POST /api/v1/play` (default TTL: 30 days, override with `expiresInHours`).
- **Unused API keys** (no linked presentation, no activity for 30+ days) are pruned by the same code path — no cron required.
- Keys linked to at least one deck are **never** auto-deleted.

---

## 🔐 Encryption at rest

The `markdown` column of `SharedPresentation` — the only user-supplied field that can legitimately contain sensitive content (tokens pasted into slides, internal product names, customer data) — is **transparently encrypted** via a Prisma Client extension.

### How it works

| Step | What happens |
| --- | --- |
| **Write** | `lib/db.ts` extends `PrismaClient` with a `query` hook on `sharedPresentation.{create,createMany,update,updateMany,upsert}`. Before the SQL runs, `encryptField(plaintext)` wraps the value as `enc:<base64-ciphertext>` using AES-256-CBC. |
| **Read** | On `findUnique` / `findFirst` / `findMany`, the same hook runs `decryptField` on the way out. Callers see plaintext; they never know encryption exists. |
| **Legacy** | Rows created before encryption was enabled have no `enc:` prefix. `decryptField` detects this and returns the value unchanged — zero-downtime migration. |
| **Upgrade** | The next `update` on a legacy row silently re-writes it as ciphertext. No background job needed. |
| **Idempotency** | `encryptField` is a **no-op** on values that already start with `enc:`, so re-saves never double-encrypt. |

### Required environment variables

| Name | Format | Generator |
| --- | --- | --- |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes / 256 bits) | `openssl rand -hex 32` |
| `ENCRYPTION_VECTOR` | 32 hex chars (16 bytes / 128 bits) | `openssl rand -hex 16` |

Both must be set **before** the app starts. `lib/crypto.ts::validateEnv()` throws a descriptive error at first use if either is missing or malformed.

> ⚠️ **Production checklist.** The keys stored in `nextjs_space/.env` are **for local dev only**. Before deploying, set `ENCRYPTION_KEY` and `ENCRYPTION_VECTOR` via your hosting platform's secret manager (Abacus → *Settings → Environment*, AWS Secrets Manager, Doppler, 1Password Connect, etc.). If you rotate the keys, legacy ciphertext becomes unreadable — see *Key rotation* below.

### Design trade-offs

- **Static IV per row** (not random). Rationale: (a) `markdown` is a large blob so CBC-with-static-IV leaks at most "two rows have identical content", which is acceptable for public-by-design presentations; (b) it keeps the Prisma extension stateless and avoids schema changes. **Do not** reuse this scheme for passwords, tokens, or short secrets — those need per-value IVs or a proper AEAD like AES-GCM.
- **Scope.** Only `markdown` is encrypted. `title`, `slideCount`, `views`, `apiKey`, `apiKeyId`, `source`, timestamps — all plaintext so you can still index / query them.
- **Known quirk.** Write operations currently return the **ciphertext** in their result objects (we only decrypt on reads). Every code path in this repo fetches a fresh copy via `findUnique` after a write, so this never leaks. Don't start reading `markdown` off a `create()` return value without first running it through `decryptField`.

### Ops tooling

```bash
# Unit smoke tests (no DB required)
yarn tsx --require dotenv/config scripts/test-crypto.ts

# End-to-end round-trip against the real DB
yarn tsx --require dotenv/config scripts/test-crypto-prisma.ts

# Optional one-shot migration: encrypt all legacy plain-text rows immediately
# (safe to run repeatedly — idempotent).
yarn tsx --require dotenv/config scripts/encrypt-markdown-fields.ts
```

### Key rotation

There is no automatic rotation. The manual recipe:

1. Add `ENCRYPTION_KEY_V2` (new 64-hex value) to the environment; keep the original `ENCRYPTION_KEY`.
2. In `lib/crypto.ts`, change the prefix constant to `enc:v2:` and add a branch that decrypts the old `enc:` prefix with the original key, the new `enc:v2:` prefix with the new key.
3. Run `scripts/encrypt-markdown-fields.ts` — because encryption is idempotent under the **current** key/prefix only, it will re-encrypt old rows under v2.
4. Once `SELECT count(*) FROM shared_presentations WHERE markdown LIKE 'enc:%' AND markdown NOT LIKE 'enc:v2:%' = 0`, retire the old key.

---

## 🧩 Project layout

```
marp_player/
├── Dockerfile                  # Production multi-stage image
├── docker-compose.yml          # Dev-friendly compose stack
├── docs/
│   └── marp-player-hero.jpeg   # README screenshot
└── nextjs_space/
    ├── app/
    │   ├── page.tsx                # Main editor + viewer UI
    │   ├── layout.tsx              # SEO / LLM metadata + JSON-LD
    │   ├── play/[id]/              # Play-only embed route
    │   └── api/
    │       ├── v1/                 # Public AI-agent API
    │       │   ├── mcp/            # NEW: native MCP server (Streamable HTTP, JSON-RPC 2.0)
    │       │   ├── keys/           # Generate API keys
    │       │   ├── play/           # Store markdown, return share URL
    │       │   ├── render-pdf/     # Marp → PDF
    │       │   ├── presentations/[id]/
    │       │   └── openapi/        # OpenAPI 3.1 spec (for GPTs / LangChain)
    │       ├── config/social/      # LinkedIn + GitHub URLs for the MCP modal
    │       ├── internal/play/      # NEW: POST (same-origin, UI-only) + [id]/GET (no-auth fetch)
    │       ├── render-marp/        # Server-side Marp rendering (editor live preview)
    │       ├── export-pdf/         # UI-driven PDF export
    │       └── markdown/           # Load examples from public/examples
    ├── components/
    │   ├── mcp-modal.tsx          # MCP docs + API key generator
    │   ├── share-modal.tsx
    │   ├── control-panel.tsx      # Theme / animation / play controls
    │   ├── slide-viewer.tsx
    │   └── ui/                    # shadcn/ui primitives
    ├── hooks/use-presentation.ts  # Slide state + animations
    ├── lib/
    │   ├── api-auth.ts            # Token generation, hashing, validation, cleanup
    │   ├── crypto.ts              # NEW: AES-256-CBC encrypt/decrypt for markdown column
    │   ├── db.ts                  # Prisma singleton + $extends query hook for encryption
    │   ├── animation-presets.ts
    │   ├── animations.css
    │   └── markdown-parser.ts
    ├── prisma/schema.prisma       # SharedPresentation (+source col) + AppApiKey models
    ├── public/
    │   ├── examples/              # Bundled demo presentations
    │   ├── llms.txt / llms-full.txt
    │   └── screenshots/           # README-ready screenshots
    └── scripts/                   # Maintenance scripts
        ├── sync_to_github.py            # Push repo to GitHub via Git DB API
        ├── test-crypto.ts               # Unit smoke tests for lib/crypto.ts
        ├── test-crypto-prisma.ts        # E2E round-trip against the real DB
        └── encrypt-markdown-fields.ts   # One-shot legacy-row migration
```

---

## ⚙️ Environment variables reference

| Name | Required? | Used by | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma | PostgreSQL connection string. |
| `ENCRYPTION_KEY` | ✅ | `lib/crypto.ts` → Prisma `$extends` | 64 hex chars (32 bytes). AES-256-CBC key for the `markdown` column. Generate with `openssl rand -hex 32`. **Losing this makes existing rows unreadable.** |
| `ENCRYPTION_VECTOR` | ✅ | `lib/crypto.ts` → Prisma `$extends` | 32 hex chars (16 bytes). Initialization vector paired with `ENCRYPTION_KEY`. Generate with `openssl rand -hex 16`. |
| `ABACUSAI_API_KEY` | Optional | `/api/export-pdf`, `/api/v1/render-pdf` | LLM / headless-Chromium gateway for PDF rendering. |
| `LINKEDIN_PERS_URL` | Optional | MCP modal | LinkedIn profile the user is asked to follow before key generation. |
| `GITHUB_CURRENT_REPO` | Optional | MCP modal | GitHub repo the user is asked to star/fork before key generation. |
| `MARP_API_KEYS` | Optional | `lib/api-auth.ts` | Legacy comma-separated Bearer tokens. Kept for backward compatibility. |
| `GITHUB_TOKEN` | Optional | `.github/workflows/push-to-github.yml`, `scripts/sync_to_github.py` | PAT used by the `workflow_dispatch` job and the local sync script that mirror the app back to GitHub. |
| `NEXTAUTH_URL` | Auto | Next.js runtime | Automatically set at runtime; do **not** hard-code. |

---

## 🧠 Design notes

- **Marp rendering is server-side.** `/api/render-marp` takes raw Markdown and returns individual `div.marpit > svg > foreignObject > section` slides. The Marp CSS depends on that exact structure, so we inject it verbatim via `dangerouslySetInnerHTML`.
- **Animations** are driven by `Animate.css` keyframes (38 extracted in `lib/animations.css`). A global preset can be overridden per slide with HTML comment directives inside Marp notes:
  ```md
  <!-- _animateIn: bounceInLeft -->
  <!-- _animateOut: fadeOutRight -->
  ```
- **API key storage** is intentionally minimal: `keyId` (public) + `sha256(secret)` + optional `label`. We never accept a plain secret back from the DB.
- **Auth split** is a CSRF pattern, not a security bypass. `/api/internal/play` uses the browser-enforced `Origin` / `Referer` headers (which JavaScript in another tab cannot forge on a cross-origin POST) to cheaply prove the request came from our own page. Every programmatic caller still needs a Bearer token — cross-origin XHR from `evil.com` gets 403, curl with no `Origin` gets 403. See the *Authentication surfaces* table above.
- **Encryption is opaque to callers.** Routes call `prisma.sharedPresentation.create({ data: { markdown } })` with plaintext; the `$extends` hook does the rest. Adding a new field to the encrypted set = add it to `encryptFields` in `lib/db.ts`. See `lib/crypto.ts` for the primitives.
- **Cleanup** piggybacks on normal traffic instead of a scheduler. If the app is idle, nothing happens — which is the correct behaviour for a write-on-demand deck store.
- **LLM indexing**: `llms.txt`, `llms-full.txt`, OpenGraph, JSON-LD, `application/llms+txt` alternate link, and allow-listed GPTBot/ClaudeBot/PerplexityBot in `robots.txt`.

---

## 🛟 Troubleshooting

<details>
<summary><b>Prisma says <code>Environment variable not found: DATABASE_URL</code></b></summary>

Make sure `.env` lives at `nextjs_space/.env` (not the repo root). When calling Prisma from outside Next.js, export the variable first: `export $(grep -v '^#' nextjs_space/.env | xargs -d '\n')`.

</details>

<details>
<summary><b>PDF export hangs / returns 504</b></summary>

PDF generation uses the Abacus.AI HTML→PDF gateway. Verify `ABACUSAI_API_KEY` is set and that the server can reach `https://apps.abacus.ai`. Self-hosters who want a fully offline path can swap the gateway for Puppeteer/Chromium in `app/api/export-pdf/route.ts` (look for `createConvertHtmlToPdfRequest`).

</details>

<details>
<summary><b>Generated API key returns 401 on first use</b></summary>

Make sure you're sending the **full** token (`mkp_<keyId>.<secret>`), not just the `keyId`. The secret is only shown once — if you lost it, generate a new key.

</details>

<details>
<summary><b>Shared link opens the editor</b></summary>

Shared links must be of the shape `/?s=<id>` (on the landing page). The older `/play/<id>` route still works but is intended for iframe embeds.

</details>

<details>
<summary><b>Clicking <em>Share</em> returns <code>Missing Authorization header</code></b></summary>

You're on an old build that had the UI calling `/api/v1/play` directly. Current builds route the Share button to `/api/internal/play`, which uses a same-origin check instead of a Bearer token. Pull the latest code and rebuild; the only call site that still needs a token is the MCP modal's *Generate API Key* flow.

</details>

<details>
<summary><b><code>/api/internal/play</code> returns 403 from curl / Postman</b></summary>

That's by design — the endpoint is UI-only. External clients must use `POST /api/v1/play` with a Bearer token (generate one at `POST /api/v1/keys` or in the MCP modal). Browsers set `Origin` automatically, so the in-app Share button just works.

</details>

<details>
<summary><b>App throws <code>ENCRYPTION_KEY must be 64 hex chars</code> on startup</b></summary>

Generate and add both encryption variables to your environment:

```bash
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> nextjs_space/.env
echo "ENCRYPTION_VECTOR=$(openssl rand -hex 16)" >> nextjs_space/.env
```

In production, set them via your hosting platform's secret manager — **never commit them**. If you rotate the key you'll lose access to existing rows; see *Key rotation* in the Encryption section.

</details>

<details>
<summary><b>Rows look like <code>enc:abc123…</code> in <code>psql</code> but the app displays them fine</b></summary>

Expected. The column is encrypted at rest; only the Prisma extension in `lib/db.ts` decrypts on read. To inspect plaintext manually, run `yarn tsx --require dotenv/config scripts/test-crypto-prisma.ts` or write a one-off script that uses the shared `prisma` singleton (not raw SQL).

</details>

---

## 🧪 Scripts cheatsheet

```bash
# development
yarn dev                 # next dev
yarn build               # production build (emits .next/standalone)
yarn start               # run the built server

# database
yarn prisma generate
yarn prisma db push      # apply schema to DB
yarn prisma studio       # visual DB browser

# encryption (see "Encryption at rest" section)
yarn tsx --require dotenv/config scripts/test-crypto.ts             # unit smoke tests
yarn tsx --require dotenv/config scripts/test-crypto-prisma.ts      # DB round-trip
yarn tsx --require dotenv/config scripts/encrypt-markdown-fields.ts # one-shot legacy migration

# mirror the repo to GitHub (requires GITHUB_TOKEN in env)
python3 scripts/sync_to_github.py
```

---

## 🗺️ Roadmap

- [ ] Per-user workspaces & API-key listing / revocation UI.
- [ ] Collaborative editing (CRDT-based).
- [ ] Pluggable PDF engine (Puppeteer fallback).
- [ ] Rich AI assistant inside the editor ("rewrite this slide with bullet points").
- [ ] Slide thumbnails / table of contents in shared-view mode.

---

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/your-idea`.
3. Make sure `yarn tsc --noEmit` and `yarn build` both pass.
4. Open a pull request — bonus points for screenshots of any UI change.

Found a bug or have a feature request? Open an issue at [github.com/techbuzzz/marp-play/issues](https://github.com/techbuzzz/marp-play/issues).

---

## 💜 Support the project

If Marp Player saves you time, the nicest way to say thanks is to:

- ⭐ **Star** this repo on GitHub — [github.com/techbuzzz/marp-play](https://github.com/techbuzzz/marp-play)
- 🔗 **Follow** the author on LinkedIn — [linkedin.com/in/techbuzzz](https://www.linkedin.com/in/techbuzzz/)
- 🐦 **Share** a deck you built with it — mentions welcome!

That's literally the whole ask. The MCP modal's *"support the project"* checkboxes are the in-app version of this section — kept identical on purpose.

---

## 📜 License

[MIT](./LICENSE) © techbuzzz. Marp and the Marp logo are trademarks of their respective owners; this project is an independent player and is not affiliated with the Marp team.

---

> **Note to future maintainers (and AI agents editing this repo):** this `README.md` is the project's front door. **Never delete it** — on every new feature or refactor, *enhance* it (new section, updated screenshot, new env var, new endpoint). Keep the hero screenshot at the top, keep the self-hosting instructions current, and keep the API section in sync with the OpenAPI spec.
