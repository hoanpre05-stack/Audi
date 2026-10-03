# LyricStudio AI — AdSense-ready hybrid + Freemium PayOS

Date: 2026-10-03
Status: draft pending user review
Scope: v1 shippable product — content site for AdSense approval, studio tool, Google login, PayOS subscription (manual renew), AI quota, watermark.

## 1. Goal

Turn the existing LyricStudio AI React/Express app into a site that:

1. Can be deployed on a real domain and submitted to Google AdSense without an immediate policy reject.
2. Makes money from AdSense on **content pages** (landing, blog, FAQ).
3. Makes money from a **Pro subscription** via PayOS (79.000đ / 30 days or 790.000đ / 365 days).
4. Does not lose money on Gemini/FFmpeg: Free is capped at 3 AI calls/day + watermarked 720p export.

Success criteria for v1:

- `curl` of `/`, `/blog`, a blog post, `/pricing`, `/privacy` returns real HTML with an `<h1>` and ≥300 characters of body text (no JS required).
- `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/config.js` are served from Express.
- Anonymous user: 4th AI call in a day returns `AI_LIMIT_FREE`.
- Logged-in user who pays via PayOS webhook: ads off, watermark off, 1080p unlocked, AI limit 50/day until `pro_until`.
- Production HTML never contains the placeholder string `Khu Vực Quảng Cáo`.

## 2. Non-goals (v1)

- Auto-renew / PayOS subscription vault (PayOS is one-shot QR; we add days to `pro_until`).
- Credit packs, seats, teams, coupons.
- Next.js rewrite or splitting frontend onto Vercel.
- ffmpeg.wasm.
- Changing Gemini prompt quality or canvas kinetic effects except watermark overlay.
- 50 thin AI-generated blog posts.
- Visual regression of the studio canvas.
- Load testing.

## 3. Stack

One Docker service on **Railway** (existing Node 22 + FFmpeg image).

| Piece | Role |
|---|---|
| Express (`server.ts`) | HTML for public pages, static ads/SEO files, AI APIs, FFmpeg convert, PayOS webhook, quota |
| React SPA | `/studio` (existing editor) and `/account` only |
| Supabase Auth | Google OAuth |
| Supabase Postgres | `profiles`, `usage_daily`, `payments` |
| PayOS | Checkout QR 79k / 790k, webhook |
| Google AdSense | Display ads on content pages after approval |
| Domain | Custom HTTPS domain on Railway. Never submit `*.up.railway.app` to AdSense |

Client env may expose `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. Service role, PayOS checksum, Gemini, IP hash salt stay server-only.

## 4. Information architecture

`/` is **no longer** the studio. Studio moves to `/studio`. Old mental model “open the app” is a CTA on the landing page, not a 301 (that would delete the landing Google/AdSense need).

| URL | Render | Index | Ads |
|---|---|---|---|
| `/` | Server HTML landing | yes | yes (after approval) |
| `/studio` | React SPA (current `App.tsx`) | yes | header only, never next to Tải nhạc / Xuất |
| `/blog` | Server HTML | yes | yes |
| `/blog/:slug` | Server HTML article | yes | in-article + end |
| `/pricing` | Server HTML | yes | **no** |
| `/account` | React SPA | **noindex** | no |
| `/about` `/faq` `/contact` `/privacy` `/terms` | Server HTML | yes | FAQ yes; legal uncluttered |
| `/ads.txt` `/robots.txt` `/sitemap.xml` `/config.js` | Express | n/a | n/a |

All public GET pages above (except studio/account) are **fully formed HTML from Express**. React does not hydrate them. Blog post bodies stay in `src/data/blogPosts.ts` imported by both the server templates and any remaining client listing if needed — single source of truth.

Landing `/` required blocks, in order:

1. H1 in Vietnamese, one idea (create lyric videos with AI).
2. 120–180 word intro.
3. Three steps: upload audio → AI align lyrics → export MP4.
4. Feature list (transcribe, forced alignment, 9:16/16:9, kinetic type).
5. Compact Free vs Pro with link to `/pricing`.
6. 5–6 FAQs + `FAQPage` JSON-LD.
7. Primary CTA → `/studio`. Secondary → `/blog`.

Studio UX stays. Add: usage badge `used/limit` AI today, Free watermark, upgrade CTA when capped.

## 5. SEO and AdSense plumbing

- Canonical + OG from `APP_URL` (no `example.com`).
- Replace every `contact@lyricstudio-ai.example.com` and dummy GitHub/YouTube with real contact once domain is known. Until then use a single constant `CONTACT_EMAIL` read from env `CONTACT_EMAIL`.
- `robots.txt`: allow `/`, disallow `/account`, point to sitemap.
- `sitemap.xml`: `/`, `/studio`, `/pricing`, legal pages, `/blog`, every blog slug. `lastmod` from post `date`.
- `ads.txt` body (single line, publisher from env):
  `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
  If `ADSENSE_CLIENT_ID` is empty, serve `ads.txt` as empty 200 with `text/plain` (do not invent a pub id).
- `/config.js` injects `window.__APP_CONFIG__` from env (`ADSENSE_CLIENT_ID` → `adsenseClient`, slot ids, `CONSENT_REQUIRED`, `GA_MEASUREMENT_ID`, `APP_URL`). `Cache-Control: private, max-age=60`.
- Production `AdSenseSlot`: if not configured **or** Pro **or** no consent → render nothing (0 height). **Never** show the educational placeholder in `NODE_ENV=production`.
- Ad placements after approval: landing after intro + before FAQ; blog after 2nd heading + end; FAQ at end. No overlay, no ads on `/pricing` `/account` `/privacy` `/terms`, no ads inside canvas.

Blog v1 (minimum to submit AdSense): keep the existing 5 posts, expand each to ≥800 words, remove keyword stuffing about “kiếm tiền AdSense”. Same content slice may add more how-to posts in the same cluster (TikTok 9:16, karaoke from MP3, Vietnamese timestamps, fonts by genre, watermark vs Pro on YouTube, copyright). Extra posts must not block slices 3–4 (auth/PayOS). No bulk AI thin content.

Copyright: Terms + a confirm checkbox before upload (“Tôi có quyền sử dụng tệp này”). Do not build a copyright detector in v1.

## 6. Plans and product rules

| | Free | Pro |
|---|---|---|
| Identity | optional (IP quota) | Google login required to purchase |
| AI (transcribe + align + design + lyric-assistant) | 3 / calendar day `Asia/Ho_Chi_Minh` | 50 / day fair-use |
| Export | 720p, watermark `LyricStudio AI` burned into canvas before MediaRecorder | 1080p, no watermark |
| Ads | on | off (`pro_until > now`) |
| Price | 0 | 79.000đ / 30 days or 790.000đ / 365 days via PayOS |

Plan is **not** a stored enum that can drift. Source of truth: `pro_until > now()` ⇒ Pro, else Free. Column `profiles.plan` is a cache updated on webhook/login, never trusted alone on the server.

Watermark is **client-burned** for Free: bottom-right of the canvas, text `LyricStudio AI`, ~14px, ~50% opacity, drawn every frame before MediaRecorder. `/api/convert-to-mp4` does not strip it (it cannot). Server does not downscale 1080p; the Free UI simply does not offer 1080p (honor system on resolution; watermark is the real differentiator).

PayOS does not auto-renew. Each successful payment **adds** 30 or 365 days onto `max(now, pro_until)` so early renewal extends, it does not reset.

## 7. Data model (Supabase)

RLS: users can `select` their own `profiles` and `usage_daily` and `payments`. All writes from the app server use the **service role**. Frontend never uses service role.

### `profiles`

- `id uuid PK` references `auth.users(id)` on delete cascade
- `email text`
- `display_name text`
- `avatar_url text`
- `plan text not null default 'free' check (plan in ('free','pro'))`
- `pro_until timestamptz null`
- `created_at`, `updated_at timestamptz`

Trigger on `auth.users` insert: upsert profile with `plan='free'`, `pro_until=null`, copy email/name/avatar from Google metadata.

### `usage_daily`

- `id bigserial PK`
- `user_id uuid null` references `profiles(id)`
- `ip_hash text null`
- `day date not null`
- `ai_count int not null default 0`
- Unique `(user_id, day)` where `user_id is not null`
- Unique `(ip_hash, day)` where `user_id is null`

Logged-in usage counts **only** toward `user_id`, never toward that day’s IP row (café Wi-Fi must not steal a member’s quota). Anonymous counts toward `ip_hash = sha256(ip + IP_HASH_SALT)`.

### `payments`

- `id uuid PK`
- `user_id uuid not null` references `profiles(id)`
- `payos_order_code bigint unique not null`
- `amount int not null` — 79000 or 790000
- `plan_kind text not null check (plan_kind in ('monthly','yearly'))`
- `status text not null` — `pending` \| `paid` \| `cancelled` \| `expired`
- `paid_at timestamptz null`
- `raw_webhook jsonb null`
- `created_at timestamptz`

Never delete payment rows.

## 8. Auth

- Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: ${APP_URL}/account })`.
- Google Cloud OAuth client authorized redirect: `https://<project>.supabase.co/auth/v1/callback`.
- Supabase additional redirect: `https://<domain>/account`.
- Login entry points: `/account`, `/pricing`, and the AI-cap modal.
- Anonymous users **may** use `/studio` (IP quota, watermark, ads).
- Purchase **requires** login. No “pay then attach account”.
- Protected / metered APIs read `Authorization: Bearer <access_token>` and call `supabase.auth.getUser(token)`. Fake/expired token on a metered AI route: treat as anonymous IP identity, do not hang the UI. `/api/payos/create` with no/invalid token: **401**, do not create an order.

`GET /api/me` (optional auth):

```
{ userId, email, name, avatar,
  plan: 'free'|'pro',
  proUntil: string|null,
  aiUsedToday: number,
  aiLimit: 3|50 }
```

Anonymous `GET /api/me` returns `userId: null`, `plan: 'free'`, IP-based `aiUsedToday` / `aiLimit: 3`.

`GET /api/payments` (auth required): the caller’s payment rows, newest first, fields `orderCode, amount, planKind, status, paidAt, createdAt`. 401 if anonymous.

Replace `src/utils/premium.ts` localStorage demo. Cookie consent storage stays.

## 9. PayOS flow

Amounts are integer VND: monthly `79000`, yearly `790000`. Description ASCII short: `LS Pro 1 thang` / `LS Pro 1 nam`.

1. Logged-in `POST /api/payos/create { plan: 'monthly'|'yearly' }`
   - `orderCode` = unique integer (`Date.now() * 1000 + random 0–999`, retry on unique violation).
   - Create PayOS order, persist `payments` **pending** only after PayOS returns success with that `orderCode`.
   - Return `{ checkoutUrl, orderCode }`.
   - Already-Pro with >7 days remaining: still allowed (early renew).
2. Return URL: `${APP_URL}/account?paid=1&orderCode=...`. Cancel: `${APP_URL}/pricing?cancelled=1`.
3. `POST /api/payos/webhook`
   - Verify checksum. Bad checksum → 400, no DB write.
   - Unknown `orderCode` → 200 + log (stop PayOS retry storms).
   - Already `paid` → 200 no-op (idempotent).
   - `PAID`: single transaction: `payments.status=paid`, `paid_at=now`, `raw_webhook=body`; `profiles.pro_until = max(now, pro_until) + interval`; `profiles.plan='pro'`. DB failure → 500 so PayOS retries.
   - `CANCELLED` / `EXPIRED`: update payment only.
4. `GET /api/payos/status/:orderCode` (auth, owner only): if still pending, query PayOS and apply the same paid logic. Powers `/account?paid=1` polling (5 tries, 2s apart) and the “Tôi đã thanh toán” button. Never trust the client to flip Pro.

## 10. Request flows and errors

### AI routes

Existing: `POST /api/transcribe-lyrics`, `/api/forced-align`, `/api/ai-design-video`, `/api/ai-lyric-assistant`.

Order:

1. Validate body (missing audio/lyrics → 400, **no** quota increment).
2. Resolve identity (user or `ip_hash`).
3. Resolve plan from `pro_until`.
4. Atomic increment `usage_daily.ai_count`. If result > limit → 429, no Gemini.
   - Free: `{ code: 'AI_LIMIT_FREE', used, limit: 3, upgrade: boolean }` where `upgrade` is true only if the request had a valid logged-in user (anonymous modal offers login; logged-in modal offers `/pricing`).
   - Pro: `{ code: 'AI_LIMIT_PRO', used, limit: 50 }`
5. Call Gemini with the existing model fallback chain.
6. Upstream 5xx after increment: **do not refund** the count (stops retry burns). Client toasts and may retry (counts again).
7. Existing procedural lyric fallback when user supplied raw lyrics still applies and **does** consume quota (it is still an AI-endpoint success from the product’s point of view). If you later want fallback to be free, that is a v2 change — v1 always counts a successful 200 from these routes.

Limits: Free 3, Pro 50, day boundary `Asia/Ho_Chi_Minh`. Express timeout ~55s.

If Supabase is down during quota check: **fail closed** for AI (503 `{ code: 'AUTH_BACKEND' }`). Preview/playback that never hits the server still works.

### Convert

Existing `POST /api/convert-to-mp4`. Auth optional (watermark already in frames). Concurrency: max **2 in-flight converts per IP**, else 429 `{ code: 'CONVERT_BUSY' }`. Always unlink temp files in `finally`. ffmpeg fail → 500, client offers WebM download. Empty body → 400, do not spawn ffmpeg.

### Rate limits (in addition to daily quota)

- AI: 10 req / IP / minute
- PayOS create: 5 req / IP / minute
- Convert: 6 req / IP / minute
- CORS allow only `APP_URL`
- Convert accepts video webm/mp4; AI audio mime whitelist unchanged
- Do not log raw IP; store `ip_hash` only

### Ads client

`AdSenseSlot` reads plan from `/api/me` (anonymous = Free). Pro: return null, do not inject `adsbygoogle.js`. Consent denied: no ads script (keep Consent Mode v2).

## 11. Frontend surface area

New pages:

- Server templates for landing, blog index, blog post, pricing, about, faq, contact, privacy, terms (shared chrome: header, footer, legal links).
- React `AccountPage` at `/account`: Google button, avatar, `plan`, `proUntil`, usage bar, PayOS history (from `GET /api/me` + `GET /api/payments`).
- React router only mounts `/studio` and `/account`. Unknown public URLs are Express HTML 404, not the SPA shell.

Express route order in production:

1. API + webhook + `/ads.txt` `/robots.txt` `/sitemap.xml` `/config.js`
2. Server-rendered public HTML routes (exact paths + `/blog/:slug`)
3. `express.static(dist)` for assets
4. `/studio` and `/account` → `dist/index.html` (SPA)
5. HTML 404 template

Existing to change:

- `AppRouter.tsx`: studio at `/studio`.
- `AdSenseSlot.tsx`: production empty state; plan from `/api/me`.
- `premium.ts`: delete localStorage source of truth.
- `appConfig.ts`: still merges `/config.js`.
- `Studio` / export modal: 1080p locked for Free; watermark overlay component drawn on canvas for Free only.
- Cookie/privacy copy: keep AdSense disclosure; contact from env.
- Navbar: Studio, Blog, Bảng giá, Tài khoản.

## 12. Environment

Server:

```
GEMINI_API_KEY
OPENAI_API_KEY          # optional Whisper
APP_URL                 # https://real-domain
PORT
CONTACT_EMAIL
IP_HASH_SALT
ADSENSE_CLIENT_ID       # ca-pub-...
ADSENSE_SLOT_HEADER
ADSENSE_SLOT_SIDEBAR
ADSENSE_SLOT_INFEED
CONSENT_REQUIRED        # true
GA_MEASUREMENT_ID       # optional
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYOS_CLIENT_ID
PAYOS_API_KEY
PAYOS_CHECKSUM_KEY
```

Client (Vite):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

`.env.example` updated to match. Dockerfile unchanged in spirit (still FFmpeg runtime). Railway: custom domain, env vars, persistent not required (temp files in OS tmp).

## 13. Testing

`npm run check:seo` (`scripts/check-seo.ts`) against a running server:

- Named public pages have `<h1>` and ≥300 body chars without JS.
- Canonical present; `/account` is noindex if crawled via SPA shell.
- `ads.txt` format when publisher configured.
- sitemap lists all blog slugs + `/` + `/studio` + legal + `/pricing`.
- Production HTML **and** built client JS (`dist/**/*.js`) must not include `Khu Vực Quảng Cáo`.
- `/` is not an empty `#root` shell.

Unit (no Gemini, no live PayOS):

- `resolvePlan` / quota math.
- Four concurrent Free increments → 3 ok, 1 `AI_LIMIT_FREE`.
- Validation failure does not increment.
- Logged-in user does not consume IP quota.
- PayOS: bad checksum no-op; first PAID adds 30d; second PAID same order no extra days; early renew extends; yearly +365d; CANCELLED does not touch `pro_until`.
- `/api/payos/create` without token → 401.

Manual smoke (20 min pre-ship): curl H1; Free 4th AI modal; Google login; PayOS sandbox → Pro; Free export has watermark; Pro export does not; consent deny blocks ads script; ffmpeg kill still cleans tmp.

## 14. Implementation order (for the later plan, not this spec’s job to expand)

Suggested slices so AdSense can be submitted before PayOS is live:

1. Route split + server-rendered content + ads.txt/sitemap/robots/config.js + production ad placeholder removal + real contact constants.
2. Expand blog + landing copy + upload rights checkbox.
3. Supabase schema + Google OAuth + `/api/me` + quota on AI routes + watermark + 1080p lock.
4. PayOS create/webhook/status + `/pricing` + `/account`.
5. `check:seo` + quota/PayOS unit tests + smoke.

AdSense application happens after slice 1–2 are on a custom domain with a few days of stable content. PayOS can land the same week; it is not required for the ads review.

## 15. Risks

- AdSense still rejects SPA studio or user-generated music. Mitigation: content-first `/`, copyright checkbox, no ads in canvas, no thin posts.
- Gemini cost on Pro 50/day. Mitigation: fair-use cap, fail-closed quota, no refund on 5xx.
- PayOS webhook delay. Mitigation: status poll + “Tôi đã thanh toán”.
- Railway FFmpeg CPU. Mitigation: convert concurrency 2/IP.
- Empty `ads.txt` if publisher id missing — do not submit AdSense until `ca-pub` is set.
