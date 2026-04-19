# 0AuthKit

> Add OAuth to apps fast, with minimal boilerplate.

0AuthKit gives you a small TypeScript SDK for Google + GitHub OAuth flows.

## Project health (honest status)

- ✅ Build passes
- ✅ Basic automated tests (core auth + callback security checks)
- ✅ Core flow implemented: auth URL, token exchange, profile fetch
- ✅ State validation support (pass `expectedState` in callback)

So: solid mini-hack foundation, but add tests before calling it production-grade.

---

## Install

```bash
npm install 0authkit
```

---

## 60-second integration (server-side)

### 1) Create kit

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
})
```

### 2) Redirect user

```ts
app.get('/auth/google', async (req, res) => {
  const { url, state, codeVerifier } = await kit.getAuthUrl()
  req.session.oauthState = state
  req.session.oauthCodeVerifier = codeVerifier
  res.redirect(url)
})
```

### 3) Handle callback

```ts
app.get('/auth/callback', async (req, res) => {
  const result = await kit.handleCallback(
    String(req.query.code),
    String(req.query.state)
  )

  // Recommended: use server functional API for explicit state/codeVerifier checks
  // import { handleCallback } from '0authkit/server'
  // const result = await handleCallback({
  //   provider: 'google',
  //   code: String(req.query.code),
  //   state: String(req.query.state),
  //   expectedState: req.session.oauthState,
  //   codeVerifier: req.session.oauthCodeVerifier,
  //   clientId: process.env.GOOGLE_CLIENT_ID!,
  //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   redirectUri: 'http://localhost:3000/auth/callback',
  // })

  res.json(result.profile)
})
```

---

## Best-practice callback (recommended)

Use `0authkit/server` so you can validate state and PKCE verifier explicitly.

```ts
import { getAuthUrl, handleCallback } from '0authkit/server'

app.get('/auth/google', async (req, res) => {
  const { url, state, codeVerifier } = await getAuthUrl({
    provider: 'google',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    redirectUri: 'http://localhost:3000/auth/callback',
  })

  req.session.oauthState = state
  req.session.oauthCodeVerifier = codeVerifier
  res.redirect(url)
})

app.get('/auth/callback', async (req, res) => {
  const result = await handleCallback({
    provider: 'google',
    code: String(req.query.code),
    state: String(req.query.state),
    expectedState: req.session.oauthState,
    codeVerifier: req.session.oauthCodeVerifier,
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/auth/callback',
  })

  res.json(result.profile)
})
```

---

## Entry points

| Import | Use |
|---|---|
| `0authkit` | Class-based server API |
| `0authkit/server` | Functional server API (`getAuthUrl`, `handleCallback`) |
| `0authkit/client` | Client-safe `getAuthUrl` only |

---

## Providers

| Provider | Status | PKCE |
|---|---|---|
| Google | ✅ | ✅ |
| GitHub | ✅ | ❌ |

---

## Security notes

- Keep `clientSecret` on server only.
- Always persist + validate `state` (`expectedState`).
- For PKCE providers, persist + reuse `codeVerifier`.
- Use HTTPS in production.

---

## Output shape

```ts
result.tokens  // { accessToken, refreshToken?, expiresIn?, tokenType, scope? }
result.profile // { id, email, name, avatar, raw }
```

---

Built by [thejamesnick](https://github.com/thejamesnick)
