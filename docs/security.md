# Security

0AuthKit is designed with security in mind. This page explains the threat model and the protections in place.

---

## Client secret isolation

Your `clientSecret` must **never** reach the browser.

- The `0authkit/client` entry point exports only `getAuthUrl` — it never asks for or touches a `clientSecret`.
- Token exchange (the step that uses `clientSecret`) always happens server-side via `handleCallback`.
- For client-only PKCE flows (Google), no `clientSecret` is required — the PKCE verifier provides the security guarantee instead.

**Rule:** Import from `0authkit/client` in any code that runs in the browser. Import from `0authkit` or `0authkit/server` only in server-side code.

---

## State parameter — CSRF protection

Every call to `getAuthUrl` generates a cryptographically random `state` value (16 bytes via `crypto.getRandomValues`).

**What you must do:**
1. Save `state` in a server-side session or an `HttpOnly` cookie immediately after `getAuthUrl`.
2. On callback, pass the saved value as `expectedState` to `handleCallback`.
3. 0AuthKit will throw `'Invalid OAuth state'` if the values don't match.

```ts
// Step 1 — save state
const { url, state } = await kit.getAuthUrl()
req.session.oauthState = state
res.redirect(url)

// Step 2 — validate state on callback
const result = await kit.handleCallback(
  String(req.query.code),
  String(req.query.state),
  // OAuthKit class automatically uses the saved lastState as expectedState
)
```

> The `OAuthKit` class handles this automatically if you call `getAuthUrl` and `handleCallback` on the same instance. For stateless/functional use, pass `expectedState` explicitly.

**What happens without state validation?**

A malicious site could trick a user into completing an OAuth flow that logs them into the attacker's account. The state parameter prevents this (CSRF attack). Always validate it.

---

## PKCE — Proof Key for Code Exchange

PKCE protects against authorization code interception attacks, particularly in single-page apps and mobile clients.

**How it works:**
1. `getAuthUrl` generates a random `codeVerifier` and derives a `codeChallenge` from it (SHA-256, base64url-encoded).
2. The challenge is sent in the auth URL.
3. On callback, the original `codeVerifier` is sent during token exchange. The provider verifies that `SHA256(codeVerifier) === codeChallenge`.

**What you must do:**
1. Save `codeVerifier` alongside `state` after `getAuthUrl`.
2. Pass it to `handleCallback` (the class does this automatically, or pass it via `options.codeVerifier`).

```ts
const { url, state, codeVerifier } = await kit.getAuthUrl()
req.session.oauthState = state
req.session.oauthCodeVerifier = codeVerifier
```

**PKCE provider support:**
- Google — ✅ supported (recommended — pass `codeVerifier` for best security)
- GitHub — ❌ not supported by GitHub

---

## HTTPS enforcement

All provider URLs in 0AuthKit are hardcoded `https://` — there is no HTTP fallback. Your redirect URI should also use HTTPS in production.

---

## No credential storage

0AuthKit never logs, caches, or persists credentials. `clientId`, `clientSecret`, `code`, and tokens exist only in memory during the request.

---

## Session storage recommendations

| Value | Where to store |
|---|---|
| `state` | Server session or `HttpOnly` cookie |
| `codeVerifier` | Server session or `HttpOnly` cookie |
| `accessToken` | Server session (never expose to browser unless necessary) |
| `refreshToken` | Server session, encrypted at rest if possible |

---

## Threat summary

| Threat | Mitigation |
|---|---|
| CSRF via forged callback | State parameter validation |
| Authorization code interception | PKCE (Google) |
| Secret leakage to browser | Client/server entry point split |
| Token leakage | Server-side token exchange, HttpOnly cookie storage |
| Man-in-the-middle | HTTPS-only provider URLs |
