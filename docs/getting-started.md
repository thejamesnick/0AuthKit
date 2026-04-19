# Getting Started

This guide will take you from zero to a working OAuth login in under 5 minutes.

---

## 1. Install

```bash
npm install 0authkit
```

Requires **Node.js 18+** (for native `fetch` and Web Crypto API).

---

## 2. Create credentials

You need a **Client ID** and **Client Secret** from each provider you want to use.

- **Google** → see [Providers: Google](./providers.md#google)
- **GitHub** → see [Providers: GitHub](./providers.md#github)

Store them in environment variables — never commit them to source control:

```env
# .env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## 3. Pick your entry point

| Scenario | Import |
|---|---|
| Server-side (Express, Next.js API routes, etc.) | `0authkit` or `0authkit/server` |
| Client-side only (React, plain browser, no backend) | `0authkit/client` |

---

## 4. Server-side: 3-step integration

### Step 1 — Initialise the kit

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',                           // 'google' | 'github'
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
})
```

### Step 2 — Generate auth URL and redirect user

```ts
app.get('/auth/google', async (req, res) => {
  const { url, state, codeVerifier } = await kit.getAuthUrl()

  // Store state and codeVerifier in session — you'll need them in step 3
  req.session.oauthState = state
  req.session.oauthCodeVerifier = codeVerifier

  res.redirect(url)
})
```

### Step 3 — Handle the callback

```ts
app.get('/auth/callback', async (req, res) => {
  const result = await kit.handleCallback(
    String(req.query.code),
    String(req.query.state),
  )

  // result.profile → { id, email, name, avatar, raw }
  // result.tokens  → { accessToken, refreshToken?, expiresIn?, tokenType }
  res.json(result.profile)
})
```

> The `OAuthKit` class automatically saves `state` and `codeVerifier` from `getAuthUrl()` and validates them in `handleCallback()`. If you need stateless/manual control, use the functional API — see [API Reference](./api.md).

---

## 5. Client-side: PKCE flow (Google only, no backend)

```ts
import { getAuthUrl } from '0authkit/client'

const { url, state, codeVerifier } = await getAuthUrl({
  provider: 'google',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  redirectUri: `${window.location.origin}/auth/callback`,
})

sessionStorage.setItem('oauth_state', state)
sessionStorage.setItem('oauth_code_verifier', codeVerifier!)
window.location.href = url
```

> GitHub does not support PKCE. For GitHub auth without a backend you need a proxy server that calls `handleCallback` server-side.

---

## What's next?

- [Full API Reference](./api.md)
- [Security guide](./security.md)
- [Complete Express example](./examples/express.md)
- [Complete Next.js example](./examples/nextjs.md)
