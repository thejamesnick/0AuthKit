# Troubleshooting

Common errors and how to fix them.

---

## `clientSecret is required for handleCallback`

**Cause:** You called `handleCallback` without a `clientSecret` in config.

**Fix:** Pass `clientSecret` in your config. This always runs server-side — never expose it in client code.

```ts
const kit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // ← required
  redirectUri: '...',
})
```

---

## `Invalid OAuth state`

**Cause:** The `state` in the callback URL doesn't match the one you stored in step 1.

**Common reasons:**
- You're not storing `state` in a session or cookie after `getAuthUrl`.
- The session expired between the login redirect and the callback.
- Something stripped or modified the `state` query parameter.

**Fix:** Store `state` immediately after `getAuthUrl`:

```ts
const { url, state } = await kit.getAuthUrl()
req.session.oauthState = state
res.redirect(url)
```

---

## `Missing state in callback`

**Cause:** You provided `expectedState` but no `state` arrived in the callback URL.

**Fix:** Check that your callback route reads `req.query.state` and passes it as the second argument to `handleCallback`.

---

## `codeVerifier is required for PKCE providers`

**Cause:** You're using Google (which requires PKCE) but didn't pass `codeVerifier` to `handleCallback`.

**Fix:** Store `codeVerifier` from `getAuthUrl` in your session:

```ts
const { url, state, codeVerifier } = await kit.getAuthUrl()
req.session.oauthState = state
req.session.oauthCodeVerifier = codeVerifier // ← required for Google
```

Then pass it on callback. If you're using the `OAuthKit` class this happens automatically — just make sure `getAuthUrl` and `handleCallback` are called on the same instance within the same process.

---

## `Token exchange failed (400)`

**Cause:** The provider rejected the authorization code.

**Common reasons:**
- The code was already used (codes are single-use).
- The code expired (usually valid for ~10 minutes).
- `redirectUri` in `handleCallback` doesn't exactly match the one in `getAuthUrl` and in your provider's console.
- `clientId` or `clientSecret` is wrong.

**Fix:** Ensure `redirectUri` is identical in all three places — `getAuthUrl`, `handleCallback`, and your provider's developer console.

---

## `Profile fetch failed (401)`

**Cause:** The access token was rejected by the profile endpoint.

**Common reasons:**
- The token exchange actually failed silently and returned an empty `access_token`.
- The token was revoked.

**Fix:** Log `result.tokens.accessToken` temporarily to check if it has a value. Ensure the token exchange succeeded cleanly before the profile fetch runs.

---

## Redirect URI mismatch

**Cause:** The provider's console and your code have different redirect URIs.

**Fix:** They must match **exactly** — including protocol (`http` vs `https`), trailing slash, and port.

| In provider console | In code | Match? |
|---|---|---|
| `http://localhost:3000/auth/callback` | `http://localhost:3000/auth/callback` | ✅ |
| `http://localhost:3000/auth/callback` | `http://localhost:3000/auth/callback/` | ❌ |
| `https://myapp.com/callback` | `http://myapp.com/callback` | ❌ |

---

## Google: `access_denied` from user

The user clicked "Cancel" on the Google consent screen. Your callback route should handle a missing `code` parameter gracefully:

```ts
app.get('/auth/callback', async (req, res) => {
  if (!req.query.code) {
    return res.redirect('/?error=access_denied')
  }
  // ...
})
```

---

## GitHub: email is `null`

GitHub users can set their email to private. In that case `profile.email` will be an empty string.

**Options:**
1. Ask users to make their email public in their GitHub settings.
2. Call the GitHub `/user/emails` API endpoint with the access token to retrieve all associated emails (even private ones), then pick the primary/verified one.

---

## Still stuck?

Open an issue at [github.com/thejamesnick/0AuthKit](https://github.com/thejamesnick/0AuthKit).
