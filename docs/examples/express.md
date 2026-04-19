# Example: Express.js

A complete, production-ready Express integration with Google OAuth.

---

## Setup

```bash
npm install express express-session 0authkit
npm install -D @types/express @types/express-session
```

```env
# .env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=a-long-random-string
```

---

## Full example

```ts
// server.ts
import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import { OAuthKit } from '0authkit'

const app = express()

// Session middleware — required to persist state and codeVerifier between requests
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
  }),
)

// Initialise 0AuthKit
const googleKit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/callback`,
})

// Extend session type
declare module 'express-session' {
  interface SessionData {
    oauthState: string
    oauthCodeVerifier: string | undefined
    user: { id: string; email: string; name: string; avatar: string | null } | null
  }
}

// ─────────────────────────────────────────────
// Step 1 — Initiate login
// ─────────────────────────────────────────────
app.get('/auth/google', async (req, res) => {
  const { url, state, codeVerifier } = await googleKit.getAuthUrl()

  req.session.oauthState = state
  req.session.oauthCodeVerifier = codeVerifier

  res.redirect(url)
})

// ─────────────────────────────────────────────
// Step 2 — Handle callback
// ─────────────────────────────────────────────
app.get('/auth/callback', async (req, res) => {
  try {
    // Handle user cancelling the consent screen
    if (req.query.error) {
      return res.redirect('/?error=access_denied')
    }

    if (!req.query.code) {
      return res.status(400).send('Missing authorization code')
    }

    const result = await googleKit.handleCallback(
      String(req.query.code),
      String(req.query.state),
      // OAuthKit class uses stored lastState/lastCodeVerifier automatically
    )

    // Save user to session
    req.session.user = {
      id: result.profile.id,
      email: result.profile.email,
      name: result.profile.name,
      avatar: result.profile.avatar,
    }

    // Clean up OAuth session data
    delete req.session.oauthState
    delete req.session.oauthCodeVerifier

    res.redirect('/dashboard')
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.redirect('/?error=auth_failed')
  }
})

// ─────────────────────────────────────────────
// Protected route example
// ─────────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/')
  }
  res.json({ message: `Hello ${req.session.user.name}!`, user: req.session.user })
})

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
})

// Home
app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`<p>Logged in as ${req.session.user.email}. <a href="/dashboard">Dashboard</a> | <a href="/auth/logout">Logout</a></p>`)
  } else {
    res.send('<a href="/auth/google">Sign in with Google</a>')
  }
})

app.listen(3000, () => console.log('Listening on http://localhost:3000'))
```

---

## Adding GitHub

Create a second `OAuthKit` instance and add matching routes:

```ts
const githubKit = new OAuthKit({
  provider: 'github',
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/github/callback',
})

app.get('/auth/github', async (req, res) => {
  const { url, state } = await githubKit.getAuthUrl()
  req.session.oauthState = state
  res.redirect(url)
})

app.get('/auth/github/callback', async (req, res) => {
  try {
    const result = await githubKit.handleCallback(
      String(req.query.code),
      String(req.query.state),
    )
    req.session.user = {
      id: result.profile.id,
      email: result.profile.email,
      name: result.profile.name,
      avatar: result.profile.avatar,
    }
    res.redirect('/dashboard')
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    res.redirect('/?error=auth_failed')
  }
})
```

---

## Using the functional API (stateless / multiple providers)

If you can't use a class instance per provider (e.g. a single generic callback route), use the functional API:

```ts
import { getAuthUrl, handleCallback } from '0authkit/server'

app.get('/auth/:provider', async (req, res) => {
  const provider = req.params.provider as 'google' | 'github'
  const { url, state, codeVerifier } = await getAuthUrl({
    provider,
    clientId: process.env[`${provider.toUpperCase()}_CLIENT_ID`]!,
    redirectUri: `http://localhost:3000/auth/${provider}/callback`,
  })
  req.session.oauthState = state
  req.session.oauthCodeVerifier = codeVerifier
  req.session.oauthProvider = provider
  res.redirect(url)
})

app.get('/auth/:provider/callback', async (req, res) => {
  const provider = req.session.oauthProvider as 'google' | 'github'
  const result = await handleCallback({
    provider,
    code: String(req.query.code),
    state: String(req.query.state),
    expectedState: req.session.oauthState,
    codeVerifier: req.session.oauthCodeVerifier,
    clientId: process.env[`${provider.toUpperCase()}_CLIENT_ID`]!,
    clientSecret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]!,
    redirectUri: `http://localhost:3000/auth/${provider}/callback`,
  })
  req.session.user = result.profile
  res.redirect('/dashboard')
})
```
