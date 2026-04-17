
# 0AuthKit Stack

> HACK #2 — thejamesnick HACK Series

---

## Runtime & Language

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js (ESM) + Browser | Universal — same package works server-side and in the browser |
| Language | TypeScript | Type safety, full intellisense on provider payloads |
| Build | `tsc` | Straight compile to `dist/` |

---

## Dependencies

**Zero runtime dependencies.** Everything uses built-ins:

| Built-in | Role |
|---|---|
| `fetch` | Token exchange + profile fetching (Node 18+ / all modern browsers) |
| `crypto.getRandomValues` | State param + PKCE code verifier generation |
| `crypto.subtle.digest` | SHA-256 for PKCE code challenge |
| `TextEncoder` | Encoding verifier string for hashing |

---

## Entry Points

| Import | Environment | What's exposed |
|---|---|---|
| `0authkit` | Node.js only | `OAuthKit` class — full server-side flow |
| `0authkit/client` | Browser + Node | `getAuthUrl()` — no secret needed |
| `0authkit/server` | Node.js only | `handleCallback()` — token exchange + profile |

---

## Providers (Phase 1)

| Provider | PKCE | Notes |
|---|---|---|
| Google | ✅ | Full PKCE support, `openid` scope gives JWT payload |
| GitHub | ❌ | State param only — GitHub doesn't support PKCE |

---

## Security Model

- `clientSecret` never touches the browser — server entry point only
- PKCE via Web Crypto API — no extra deps, works everywhere
- State param on every auth URL — CSRF protection
- All provider URLs hardcoded HTTPS — no HTTP fallback
- No credentials logged or persisted anywhere

---

## Distribution

```bash
npm install 0authkit
```

Entry points declared in `package.json` exports map — bundlers and Node resolve the right file automatically.

---

## Dev Commands

```bash
npm install       # install deps
npm run build     # tsc → dist/
npm run test      # vitest --run
```

---

**Zero deps. Universal. Bring your own credentials.** 🔒
