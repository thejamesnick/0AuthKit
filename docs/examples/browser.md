# Example: Plain Browser (vanilla JS)

Use 0AuthKit directly in the browser via CDN — no build step, no framework.

---

## With GitHub (state-only, no PKCE)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Login with GitHub</title>
</head>
<body>
  <button id="login-btn">Sign in with GitHub</button>

  <script type="module">
    import { getAuthUrl } from 'https://cdn.jsdelivr.net/npm/0authkit/dist/client.js'

    document.getElementById('login-btn').addEventListener('click', async () => {
      const { url, state } = await getAuthUrl({
        provider: 'github',
        clientId: 'YOUR_GITHUB_CLIENT_ID',
        redirectUri: `${window.location.origin}/callback.html`,
      })

      // Store state for CSRF validation on the callback page
      sessionStorage.setItem('oauth_state', state)
      window.location.href = url
    })
  </script>
</body>
</html>
```

---

## With Google (PKCE)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Login with Google</title>
</head>
<body>
  <button id="login-btn">Sign in with Google</button>

  <script type="module">
    import { getAuthUrl } from 'https://cdn.jsdelivr.net/npm/0authkit/dist/client.js'

    document.getElementById('login-btn').addEventListener('click', async () => {
      const { url, state, codeVerifier } = await getAuthUrl({
        provider: 'google',
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: `${window.location.origin}/callback.html`,
      })

      sessionStorage.setItem('oauth_state', state)
      // Store codeVerifier — required for PKCE token exchange
      if (codeVerifier) {
        sessionStorage.setItem('oauth_code_verifier', codeVerifier)
      }

      window.location.href = url
    })
  </script>
</body>
</html>
```

---

## Callback page

The callback page receives the `code` and `state` from the provider. State validation must happen here.

> **Token exchange cannot happen here** — it requires `clientSecret` and must run server-side. Call a backend endpoint or serverless function to complete the exchange.

```html
<!-- callback.html -->
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Authenticating…</title></head>
<body>
  <p id="status">Completing login…</p>

  <script type="module">
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const expectedState = sessionStorage.getItem('oauth_state')
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
    const statusEl = document.getElementById('status')

    // Validate state
    if (!code || state !== expectedState) {
      statusEl.textContent = 'Login failed: invalid state'
      throw new Error('Invalid OAuth state')
    }

    // Exchange code server-side
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier }),
    })
      .then(res => res.json())
      .then(profile => {
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_code_verifier')
        statusEl.textContent = `Logged in as ${profile.name} (${profile.email})`
      })
      .catch(err => {
        statusEl.textContent = 'Login failed'
        console.error(err)
      })
  </script>
</body>
</html>
```

---

## Server endpoint for token exchange

Your server receives the `code` + `codeVerifier` and calls `handleCallback`:

```ts
// Express example
import { handleCallback } from '0authkit/server'

app.post('/api/auth/callback', async (req, res) => {
  const { code, codeVerifier } = req.body

  const result = await handleCallback({
    provider: 'google',         // or 'github'
    code,
    codeVerifier,               // undefined for GitHub
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'https://myapp.com/callback.html',
  })

  res.json(result.profile)
})
```

---

## Notes

- `sessionStorage` clears when the browser tab is closed — suitable for temporary OAuth state.
- For production, host your `clientId` in a config file or inject it at build time. Never commit it directly in JS files.
- Always use HTTPS in production.
