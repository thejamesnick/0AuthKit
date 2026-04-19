# 0AuthKit Documentation

Welcome to the official docs for **0AuthKit** — a lightweight TypeScript OAuth 2.0 SDK for Node.js, Next.js, React, and plain browser environments.

---

## Quick navigation

| Doc | Description |
|---|---|
| [Getting Started](./getting-started.md) | Install, set up env vars, first login in 5 minutes |
| [API Reference](./api.md) | Full type and function reference |
| [Providers](./providers.md) | How to create credentials with Google and GitHub |
| [Security](./security.md) | State validation, PKCE, secret isolation |
| [Troubleshooting](./troubleshooting.md) | Common errors and how to fix them |
| **Examples** | |
| [Express](./examples/express.md) | Complete Express.js integration |
| [Next.js App Router](./examples/nextjs.md) | Complete Next.js 14+ API route integration |
| [React (client-only)](./examples/react-client.md) | React with PKCE, no backend needed |
| [Plain Browser](./examples/browser.md) | Vanilla JS ES module integration |

---

## What is 0AuthKit?

0AuthKit handles the repetitive parts of OAuth 2.0:

1. **Auth URL generation** — builds the correct redirect URL with state and optional PKCE parameters
2. **Token exchange** — trades the authorization code for access + refresh tokens
3. **Profile normalization** — fetches user info and returns a clean `{ id, email, name, avatar }` shape alongside the full raw payload

You bring your own credentials. 0AuthKit handles the flow.

---

## Entry points

| Import | Environment | Exposes |
|---|---|---|
| `0authkit` | Node.js (server) | `OAuthKit` class + functional API |
| `0authkit/server` | Node.js (server) | `getAuthUrl`, `handleCallback` |
| `0authkit/client` | Browser / React | `getAuthUrl` only — no secret |

---

## Supported providers

| Provider | Status | PKCE |
|---|---|---|
| Google | ✅ | ✅ |
| GitHub | ✅ | ❌ |
| Twitter/X | 🔜 Phase 2 | — |
| Discord | 🔜 Phase 2 | — |
