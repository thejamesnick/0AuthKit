# Example: React (client-only, PKCE)

Use this when you have **no backend** and want to handle Google OAuth entirely in the browser using PKCE.

> **Note:** This only works with Google. GitHub does not support PKCE, so GitHub auth always requires a server-side token exchange.

---

## When to use this

- Static site / SPA with no server
- You're comfortable handling tokens client-side
- You only need Google login

---

## Setup

```bash
npm install 0authkit
```

```env
# .env (Vite)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

You do **not** need a `clientSecret` — PKCE replaces it for this flow.

---

## Login button

```tsx
// src/components/LoginButton.tsx
import { getAuthUrl } from '0authkit/client'

export function LoginButton() {
  const handleLogin = async () => {
    const { url, state, codeVerifier } = await getAuthUrl({
      provider: 'google',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
    })

    // Store in sessionStorage — clears when the tab closes
    sessionStorage.setItem('oauth_state', state)
    if (codeVerifier) {
      sessionStorage.setItem('oauth_code_verifier', codeVerifier)
    }

    window.location.href = url
  }

  return <button onClick={handleLogin}>Sign in with Google</button>
}
```

---

## Callback page

```tsx
// src/pages/AuthCallback.tsx  (or wherever your redirectUri points)
import { useEffect, useState } from 'react'
import { handleCallback } from '0authkit/server'  // ← NOT available client-side!
```

> ⚠️ **`handleCallback` cannot run in the browser** — it requires `clientSecret` and calls the provider's token endpoint server-side.

For a fully client-side flow you need a small serverless function (Vercel function, Netlify function, Cloudflare Worker, etc.) to perform the token exchange. Here's the pattern:

---

## Full client-only pattern (with serverless token exchange)

### 1. Login (browser)

```tsx
// src/components/LoginButton.tsx
import { getAuthUrl } from '0authkit/client'

export function LoginButton() {
  const handleLogin = async () => {
    const { url, state, codeVerifier } = await getAuthUrl({
      provider: 'google',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
    })
    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_code_verifier', codeVerifier ?? '')
    window.location.href = url
  }
  return <button onClick={handleLogin}>Sign in with Google</button>
}
```

### 2. Callback page (browser — calls your serverless function)

```tsx
// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react'

export function AuthCallback() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const expectedState = sessionStorage.getItem('oauth_state')
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier')

    if (!code || state !== expectedState) {
      setError('Invalid OAuth response')
      return
    }

    // Call your serverless token exchange endpoint
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier }),
    })
      .then(res => res.json())
      .then(profile => {
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_code_verifier')
        setUser(profile)
      })
      .catch(() => setError('Authentication failed'))
  }, [])

  if (error) return <p>Error: {error}</p>
  if (!user) return <p>Logging in...</p>
  return <p>Welcome, {user.name}!</p>
}
```

### 3. Serverless token exchange (server — Vercel / Netlify / Cloudflare)

```ts
// api/auth/callback.ts  (Vercel serverless function)
import { handleCallback } from '0authkit/server'

export default async function handler(req: any, res: any) {
  const { code, codeVerifier } = req.body

  const result = await handleCallback({
    provider: 'google',
    code,
    codeVerifier,
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  res.json(result.profile)
}
```

---

## Security considerations for client-side flows

- Always validate `state` client-side before sending code to the server (prevents CSRF).
- Never store `accessToken` in `localStorage` — use `sessionStorage` or a secure `HttpOnly` cookie set by your server.
- The `codeVerifier` is safe to store in `sessionStorage` (it's only useful during this specific flow and expires with the tab).
