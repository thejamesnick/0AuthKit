# 0AuthKit

> HACK #2 — thejamesnick HACK Series

Add OAuth to any app in minutes. Bring your own credentials — 0AuthKit handles the rest.

Works in **Node.js**, **Express**, **Next.js**, **React**, and plain **browser**. Zero dependencies.

---

## Install

```bash
npm install 0authkit
```

---

## Get Your Credentials

You need a `clientId` and `clientSecret` from each provider you want to use. 0AuthKit never stores or manages these — they stay in your env vars.

### Google

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID → Web application
4. Add your redirect URI (e.g. `http://localhost:3000/auth/callback`)
5. Copy `Client ID` and `Client Secret`

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### GitHub

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. New OAuth App
3. Set Homepage URL and Authorization callback URL
4. Copy `Client ID` and generate a `Client Secret`

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

---

## Usage

### Node.js / Express

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
})

// 1. Redirect user to provider
app.get('/auth/google', (req, res) => {
  const { url, state } = kit.getAuthUrl()
  req.session.oauthState = state
  res.redirect(url)
})

// 2. Handle the callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query
  const result = await kit.handleCallback(code as string, state as string)

  console.log(result.profile)  // { id, email, name, avatar, raw }
  res.json(result.profile)
})
```

### Next.js App Router

```ts
// app/api/auth/google/route.ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://myapp.com/auth/callback',
})

export async function GET() {
  const { url, state } = kit.getAuthUrl()
  const res = Response.redirect(url)
  res.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/`)
  return res
}
```

```ts
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

> Uses PKCE — no clientSecret needed. Google only (GitHub doesn't support PKCE).

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

### Plain Browser

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

## Result Shape

```ts
result.tokens   // { accessToken, refreshToken?, expiresIn, tokenType }
result.profile  // { id, email, name, avatar, raw }
result.raw      // full provider payload — pick whatever you need
```

### Google raw payload includes
`sub`, `email`, `email_verified`, `name`, `picture`, `locale`, `hd` (GSuite domain), and more.

### GitHub raw payload includes
`id`, `login`, `name`, `email`, `avatar_url`, `bio`, `company`, `location`, `public_repos`, `followers`, and more.

---

## Entry Points

| Import | Use when |
|---|---|
| `0authkit` | Server-side — full class API |
| `0authkit/client` | Browser / React — `getAuthUrl()` only, no secret needed |
| `0authkit/server` | Server-side — functional API, `handleCallback()` |

---

## Providers

| Provider | Status | PKCE |
|---|---|---|
| Google | ✅ Phase 1 | ✅ |
| GitHub | ✅ Phase 1 | ❌ |
| Twitter/X | 🔜 Phase 2 | — |
| Discord | 🔜 Phase 2 | — |
| Slack | 🔜 Phase 2 | — |
| Notion | 🔜 Phase 2 | — |

---

## Security

- Your `clientSecret` never touches the browser
- PKCE via Web Crypto API — no extra deps
- State param on every auth URL — CSRF protection
- All provider URLs hardcoded HTTPS
- Nothing logged or persisted

---

Built by [thejamesnick](https://github.com/thejamesnick) — HACK Series #2
