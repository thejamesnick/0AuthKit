# 0AuthKit Roadmap

## Phase 1: Core OAuth Flows ✅ COMPLETE

**Status:** Production Ready

### What's Included
- ✅ Google OAuth (with PKCE)
- ✅ GitHub OAuth (state validation)
- ✅ Auth URL generation
- ✅ Token exchange
- ✅ Profile normalization
- ✅ CSRF protection (state validation)
- ✅ Error handling
- ✅ TypeScript types
- ✅ Browser + Node.js support
- ✅ 247 comprehensive tests

### Entry Points
- `0authkit` — Class-based API
- `0authkit/server` — Server functional API
- `0authkit/client` — Browser-safe API

### What You Need to Handle
- Session management (cookies, Redis, etc.)
- User creation/login logic
- Token storage (database, session, etc.)
- Error recovery and retries
- Logging and monitoring

### Use Case
Perfect for apps that already have their own session/user/token management. Just plug in 0AuthKit for the OAuth part.

---

## Phase 2: User & Token Helpers (Planned)

**Timeline:** Q2 2026

### Goals
Make 0AuthKit more convenient by adding optional helpers for common patterns.

### Features to Add

#### User Management
```ts
import { createOrUpdateUser } from '0authkit/user'

const user = await createOrUpdateUser({
  profile: result.profile,
  provider: 'google',
  db: yourDatabase,
})
```

#### Token Storage
```ts
import { saveTokens, getTokens, refreshTokens } from '0authkit/tokens'

// Save tokens after OAuth
await saveTokens(user.id, result.tokens, {
  storage: 'database', // or 'redis', 'memory'
  db: yourDatabase,
})

// Get stored tokens
const tokens = await getTokens(user.id)

// Refresh expired tokens
const newTokens = await refreshTokens(user.id, {
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

#### Session Helpers
```ts
import { createSession, validateSession } from '0authkit/session'

// Create session after successful OAuth
const session = await createSession(user.id, {
  expiresIn: 7 * 24 * 60 * 60, // 7 days
  storage: 'cookie', // or 'redis'
})

// Validate session on protected routes
const userId = await validateSession(req.cookies.sessionId)
```

### What This Enables
- Faster integration for new projects
- Less boilerplate in your app
- Standardized patterns
- Still optional — use what you need

### Backwards Compatibility
- Phase 1 API stays exactly the same
- Phase 2 is purely additive
- No breaking changes

---

## Phase 3: Framework Middleware (Planned)

**Timeline:** Q3 2026

### Goals
Make 0AuthKit a true drop-in solution with framework-specific middleware.

### Features to Add

#### Express Middleware
```ts
import { oauthMiddleware } from '0authkit/express'

app.use(oauthMiddleware({
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  sessionStore: redisStore,
  onUserCreated: async (user) => {
    // Your custom logic
  },
}))

// Now you get these routes for free:
// GET /auth/google
// GET /auth/github
// GET /auth/callback
// GET /auth/logout
```

#### Next.js App Router
```ts
// app/api/auth/[provider]/route.ts
import { oauthHandler } from '0authkit/nextjs'

export const GET = oauthHandler({
  providers: { google, github },
  sessionStore: kv, // Vercel KV
})
```

#### React Hooks
```ts
import { useOAuth, useProfile } from '0authkit/react'

function LoginButton() {
  const { login, isLoading } = useOAuth('google')
  const { profile, isAuthenticated } = useProfile()

  if (isAuthenticated) {
    return <div>Welcome, {profile.name}!</div>
  }

  return (
    <button onClick={() => login()} disabled={isLoading}>
      Sign in with Google
    </button>
  )
}
```

### Supported Frameworks
- Express.js
- Next.js (App Router + Pages Router)
- Fastify
- Hono
- SvelteKit
- Nuxt

### What This Enables
- Zero-config OAuth for new projects
- Framework-specific best practices
- Automatic session management
- Built-in error handling
- Logging and monitoring

---

## Phase 4+: Additional Providers (Future)

### Planned Providers
- **Consumer:** Twitter/X, Discord, Apple, Facebook, TikTok
- **SaaS:** Slack, Notion, Linear, Atlassian, Salesforce, HubSpot
- **Enterprise:** Microsoft, Okta, Auth0

### Timeline
- Q4 2026: Consumer providers
- Q1 2027: SaaS providers
- Q2 2027: Enterprise providers

---

## Current Status

| Phase | Status | Tests | Docs | Production Ready |
|-------|--------|-------|------|------------------|
| Phase 1 | ✅ Complete | 247 | ✅ | ✅ YES |
| Phase 2 | 📋 Planned | — | — | — |
| Phase 3 | 📋 Planned | — | — | — |
| Phase 4+ | 🔮 Future | — | — | — |

---

## How to Use This Roadmap

### If You're Using Phase 1 Now
- You have a solid OAuth client library
- Handle session/user/token management yourself
- Perfect for apps with existing auth infrastructure
- Zero dependencies, full control

### If You Want Phase 2 Features
- Wait for Q2 2026 release
- Or contribute helpers to the project
- Or build your own on top of Phase 1

### If You Want Phase 3 Features
- Wait for Q3 2026 release
- Or use Phase 1 + Phase 2 + your own middleware
- Or use a full auth solution like Auth0/NextAuth

---

## Contributing

Want to help build Phase 2 or 3? We're open to contributions!

- Phase 2 helpers: Database adapters, token refresh logic
- Phase 3 middleware: Framework integrations
- Additional providers: New OAuth configs

See CONTRIBUTING.md for details.

---

## FAQ

**Q: Can I use Phase 1 in production now?**  
A: Yes! It's fully tested and production-ready for OAuth flows.

**Q: Do I need to wait for Phase 2?**  
A: No. If your app already handles sessions/users/tokens, Phase 1 is all you need.

**Q: Will Phase 2 break my Phase 1 code?**  
A: No. Phase 2 is purely additive. Your Phase 1 code will keep working.

**Q: When will Phase 2 be released?**  
A: Q2 2026 (estimated). No hard deadline yet.

**Q: Can I use this with my existing auth system?**  
A: Yes! Phase 1 is designed to work alongside existing auth. Just use it for OAuth.

**Q: What if I need a feature from Phase 2 now?**  
A: Build it on top of Phase 1. The API is stable and designed for extension.

---

## Feedback

Have ideas for Phase 2 or 3? Open an issue or discussion on GitHub.

Built by [thejamesnick](https://github.com/thejamesnick)
