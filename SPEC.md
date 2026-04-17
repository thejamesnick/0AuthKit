
# 0AuthKit Spec

> HACK #2 — thejamesnick HACK Series
> Phase 1: Google + GitHub. Universal SDK — Node, React, Browser. Ship fast. 🔥

---

## 🎯 What We're Building

An SDK that makes adding OAuth to any app dead simple. Devs bring their own credentials — 0AuthKit handles the full flow: auth URL generation, callback handling, token exchange, and profile fetching. Returns the full provider payload plus a clean normalized object so you only pick what you need.

Meta angle: *"I got tired of copy-pasting OAuth boilerplate into every project"* 😂

---

## 🛠️ Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js (ESM) + Browser | Universal — works server-side and in the browser |
| Language | TypeScript | Type safety, better DX, full intellisense on payloads |
| HTTP | Native `fetch` | Built into Node 18+ and all modern browsers — zero extra deps |
| Crypto | `crypto.subtle` (Web Crypto API) | Available in Node 18+ and browsers — PKCE without extra deps |
| Build | `tsc` | Straight compile to `dist/` |
| Distribution | `npm publish` | Drop-in for any project |

**No database. No cloud. No telemetry. Credentials stay in your env vars.**

---

## 🌍 Environment Support

0AuthKit is a **universal SDK** — same package, two entry points:

| Entry point | Environment | What it does |
|---|---|---|
| `0authkit/client` | Browser, React, any frontend | `getAuthUrl()` — builds the redirect URL, PKCE helpers. No secret needed. |
| `0authkit/server` | Node.js, Edge runtime | `handleCallback()` — token exchange + profile fetch. Needs clientSecret. |
| `0authkit` | Node.js only | Full class-based API (backwards compat, server-side only) |

> The clientSecret **never touches the browser**. Token exchange always happens server-side.
> For pure client-side apps (no backend), Google's PKCE-only flow is supported — no clientSecret required.

---

## 📁 File Structure

```
0AuthKit/
├── src/
│   ├── index.ts            # Full server-side OAuthKit class + re-exports
│   ├── client.ts           # Browser-safe entry: getAuthUrl(), PKCE helpers
│   ├── server.ts           # Server-only entry: handleCallback(), token exchange
│   ├── providers/
│   │   ├── google.ts       # Google OAuth config + profile normalizer
│   │   └── github.ts       # GitHub OAuth config + profile normalizer
│   ├── core/
│   │   ├── auth.ts         # getAuthUrl() — builds redirect URL with PKCE/state
│   │   ├── callback.ts     # handleCallback() — token exchange + profile fetch
│   │   └── pkce.ts         # PKCE via Web Crypto API (works in Node + browser)
│   └── types.ts            # Shared types: OAuthConfig, TokenSet, Profile, RawPayload
├── dist/                   # compiled output (gitignored)
├── SPEC.md                 # this file
├── HACKLEARN.md            # lessons learned
├── STACK.md                # stack breakdown
├── README.md               # user-facing docs
├── package.json
└── tsconfig.json
```

---

## ⚙️ API

### Server-side (Node / Next.js API routes / Express)

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',           // 'google' | 'github'
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://myapp.com/auth/callback',
  scopes: ['email', 'profile'], // optional — defaults to sensible per provider
})

const { url, state } = kit.getAuthUrl()
const result = await kit.handleCallback(code, state)
```

### Client-side (React / plain browser — no secret needed)

```ts
import { getAuthUrl } from '0authkit/client'

const { url, state } = getAuthUrl({
  provider: 'google',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'https://myapp.com/auth/callback',
})

// store state in sessionStorage for CSRF check, then redirect
sessionStorage.setItem('oauth_state', state)
window.location.href = url
```

### Server-side functional API (alternative to class)

```ts
import { handleCallback } from '0authkit/server'

const result = await handleCallback({
  provider: 'google',
  code,
  state,
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://myapp.com/auth/callback',
})
```

### Result Shape

```ts
result.tokens     // { accessToken, refreshToken?, expiresIn, tokenType }
result.profile    // normalized: { id, email, name, avatar, raw }
result.raw        // full provider payload — pick whatever else you need
```

### Normalized Profile Shape

```ts
interface Profile {
  id: string
  email: string
  name: string
  avatar: string | null
  raw: Record<string, unknown>  // full provider payload
}
```

---

## 🔑 Provider Configs

### Google

- Auth URL: `https://accounts.google.com/o/oauth2/v2/auth`
- Token URL: `https://oauth2.googleapis.com/token`
- Profile URL: `https://www.googleapis.com/oauth2/v3/userinfo`
- Default scopes: `openid email profile`
- Supports PKCE: yes
- Raw payload includes: `sub`, `email`, `email_verified`, `name`, `picture`, `locale`, `hd` (hosted domain for GSuite), and more

### GitHub

- Auth URL: `https://github.com/login/oauth/authorize`
- Token URL: `https://github.com/login/oauth/access_token`
- Profile URL: `https://api.github.com/user`
- Default scopes: `read:user user:email`
- Supports PKCE: no (GitHub doesn't support it — state param only)
- Raw payload includes: `id`, `login`, `name`, `email`, `avatar_url`, `bio`, `company`, `location`, `public_repos`, `followers`, and more

---

## 🔒 Security

- **State param** — generated on every `getAuthUrl()` call, validated in `handleCallback()` to prevent CSRF
- **PKCE** — used for Google (and any provider that supports it) — code verifier stored in memory, challenge sent in auth URL
- **No credential storage** — clientId/clientSecret only used in-memory during token exchange, never logged or persisted
- **HTTPS only** — all provider URLs are hardcoded HTTPS, no HTTP fallback

---

## 🚀 Usage Examples

### Express (server-side)

```ts
app.get('/auth/google', (req, res) => {
  const { url, state } = kit.getAuthUrl()
  req.session.oauthState = state
  res.redirect(url)
})

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query
  const result = await kit.handleCallback(code as string, state as string)
  res.json(result.profile)
})
```

### Next.js App Router (server-side)

```ts
// app/api/auth/[provider]/route.ts
export async function GET() {
  const { url, state } = kit.getAuthUrl()
  const res = Response.redirect(url)
  res.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/`)
  return res
}

// app/api/auth/callback/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const result = await kit.handleCallback(
    searchParams.get('code')!,
    searchParams.get('state')!
  )
  return Response.json(result.profile)
}
```

### React (client-side, no backend)

```tsx
import { getAuthUrl } from '0authkit/client'

function LoginButton() {
  const handleLogin = () => {
    const { url, state } = getAuthUrl({
      provider: 'google',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
    })
    sessionStorage.setItem('oauth_state', state)
    window.location.href = url
  }

  return <button onClick={handleLogin}>Sign in with Google</button>
}
```

### Plain Browser (vanilla JS)

```html
<script type="module">
  import { getAuthUrl } from 'https://cdn.jsdelivr.net/npm/0authkit/dist/client.js'

  const { url, state } = getAuthUrl({
    provider: 'github',
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'https://myapp.com/callback',
  })
  sessionStorage.setItem('oauth_state', state)
  window.location.href = url
</script>
```

---

## 🗄️ Token Shape

```ts
interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType: string
  scope?: string
}
```

---

## ✅ Phase 1 Scope

- [x] Google OAuth — full flow (auth URL → callback → token exchange → profile)
- [x] GitHub OAuth — full flow
- [x] Normalized profile: `{ id, email, name, avatar, raw }`
- [x] PKCE via Web Crypto API (works in Node 18+ and browser)
- [x] State param CSRF protection
- [x] `0authkit/client` — browser-safe entry point (no secret, no Node APIs)
- [x] `0authkit/server` — server-only entry point (token exchange, profile fetch)
- [x] `0authkit` — full class-based API (server-side)
- [x] TypeScript types exported for full intellisense
- [x] Works in Express, Next.js, React (Vite/CRA), plain browser
- [x] Zero non-built-in dependencies

## ❌ Out of Scope (Phase 1)

- No token refresh handling (Phase 2)
- No session/cookie management (bring your own)
- No database / token storage
- No React hooks / UI components (Phase 2)
- No Twitter, Discord, Slack, etc. (Phase 2+)
- No PKCE for GitHub (GitHub doesn't support it)

---

## 🔮 Phase 2+ Providers

Consumer: Twitter/X, Discord, Apple, Facebook, TikTok
SaaS: Slack, Notion, Linear, Atlassian, Salesforce, HubSpot
