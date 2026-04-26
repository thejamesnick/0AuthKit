# API Reference

---

## Entry points

```ts
import { OAuthKit, getAuthUrl, handleCallback } from '0authkit'       // server
import { getAuthUrl }                             from '0authkit/client' // browser-safe
import { getAuthUrl, handleCallback }             from '0authkit/server' // server functional
```

---

## Types

### `Provider`

```ts
type Provider = 'google' | 'github'
```

---

### `OAuthConfig`

Configuration passed to `OAuthKit` constructor or `getAuthUrl`.

```ts
interface OAuthConfig {
  provider: Provider        // which OAuth provider to use
  clientId: string          // your app's client ID
  clientSecret?: string     // your app's client secret — server only, never send to browser
  redirectUri: string       // where the provider sends the user back after login
  scopes?: string[]         // optional — overrides the provider default scopes
}
```

**Default scopes:**
- Google: `['openid', 'email', 'profile']`
- GitHub: `['read:user', 'user:email']`

> **Google note:** `access_type=offline` and `include_granted_scopes=true` are automatically added to Google auth URLs. This ensures Google returns a refresh token and supports incremental authorization.

---

### `AuthUrlResult`

Returned by `getAuthUrl`.

```ts
interface AuthUrlResult {
  url: string            // the full redirect URL — send the user here
  state: string          // random CSRF token — store in session/cookie
  codeVerifier?: string  // PKCE verifier — present only for PKCE providers (Google)
                         // store in session/cookie alongside state
}
```

---

### `HandleCallbackOptions`

Options passed to the functional `handleCallback`.

```ts
interface HandleCallbackOptions extends OAuthConfig {
  code: string             // authorization code from the provider callback
  state?: string           // state param received in the callback URL
  expectedState?: string   // state you stored in step 1 — compared against state
  codeVerifier?: string    // PKCE verifier stored in step 1 — optional, but recommended for Google
}
```

---

### `TokenSet`

```ts
interface TokenSet {
  accessToken: string    // use this to call provider APIs
  refreshToken?: string  // present only when the provider returns one
  expiresIn?: number     // seconds until accessToken expires
  tokenType: string      // typically 'Bearer'
  scope?: string         // scopes granted by the user
}
```

---

### `Profile`

Normalized user profile — same shape for every provider.

```ts
interface Profile {
  id: string              // provider's unique user ID (always a string)
  email: string           // primary email address
  name: string            // display name
  avatar: string | null   // profile picture URL, or null if not available
  raw: Record<string, unknown>  // full provider payload — use this for provider-specific fields
}
```

**Google `raw` fields include:** `sub`, `email`, `email_verified`, `name`, `picture`, `locale`, `hd`

**GitHub `raw` fields include:** `id`, `login`, `name`, `email`, `avatar_url`, `bio`, `company`, `location`, `public_repos`, `followers`

---

### `CallbackResult`

Returned by `handleCallback`.

```ts
interface CallbackResult {
  tokens: TokenSet
  profile: Profile
}
```

---

## `OAuthKit` class

The class-based server-side API. It automatically carries `state` and `codeVerifier` from `getAuthUrl` into `handleCallback` so you don't have to thread them manually (beyond session storage).

### Constructor

```ts
new OAuthKit(config: OAuthConfig)
```

### `getAuthUrl()`

```ts
kit.getAuthUrl(): Promise<AuthUrlResult>
```

Generates a redirect URL. Internally saves the returned `state` and `codeVerifier` for use in the next `handleCallback` call.

### `handleCallback(code, state?, options?)`

```ts
kit.handleCallback(
  code: string,
  state?: string,
  options?: {
    expectedState?: string  // override stored expectedState
    codeVerifier?: string   // override stored codeVerifier
  }
): Promise<CallbackResult>
```

Validates state (comparing against the stored `lastState` or `options.expectedState`), exchanges the code for tokens, and fetches the user profile.

**Throws:**
- `'clientSecret is required'` — if config has no clientSecret
- `'Missing state in callback'` — if expectedState is provided but no state came back
- `'Invalid OAuth state'` — if state does not match expectedState
- `'Token exchange failed (STATUS): BODY'` — provider returned an error on token exchange
- `'Profile fetch failed (STATUS): BODY'` — provider returned an error on profile fetch

---

## Functional API

Use when you need stateless, explicit control (e.g., multiple concurrent sessions, edge runtimes).

### `getAuthUrl(config)`

```ts
import { getAuthUrl } from '0authkit/server' // or '0authkit/client' in the browser

getAuthUrl(config: OAuthConfig): Promise<AuthUrlResult>
```

### `handleCallback(options)`

```ts
import { handleCallback } from '0authkit/server'

handleCallback(options: HandleCallbackOptions): Promise<CallbackResult>
```

Full example:

```ts
const { url, state, codeVerifier } = await getAuthUrl({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  redirectUri: 'https://myapp.com/auth/callback',
})
// → save state + codeVerifier in session

const result = await handleCallback({
  provider: 'google',
  code: callbackCode,
  state: callbackState,
  expectedState: session.oauthState,
  codeVerifier: session.oauthCodeVerifier,
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://myapp.com/auth/callback',
})
```
