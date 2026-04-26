# Changelog

All notable changes to 0AuthKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-04-26

### Fixed

- Google OAuth 2.0 compliance: `access_type=offline` is now automatically added to Google auth URLs — required for Google to return a refresh token
- Google OAuth 2.0 compliance: `include_granted_scopes=true` is now automatically added to Google auth URLs — recommended by Google for incremental authorization
- Neither param is sent for GitHub (not applicable)
- PKCE (`codeVerifier`) is now optional, not required — removed hard enforcement. If provided it's used in token exchange, if not it falls back to standard code exchange
- Removed stale `'codeVerifier is required for PKCE providers'` error from API docs
- Updated security docs: PKCE for Google is now "recommended" not "required"
- Updated troubleshooting docs: replaced old PKCE error entry with correct optional PKCE guidance

## [1.0.1] - 2026-04-25

### Fixed

- PKCE is now optional, not required — `codeVerifier` no longer throws when omitted for PKCE providers (e.g. Google). If provided it's used, if not it falls back to a standard code exchange. This allows clients that don't use PKCE to still work with `handleCallback`.

## [1.0.0] - 2026-04-25

### Added

- **Initial Release** — Production-ready OAuth client library
- **Google OAuth** — Full OAuth 2.0 flow with PKCE support
- **GitHub OAuth** — Full OAuth 2.0 flow with state validation
- **PKCE Implementation** — Code verifier and challenge via Web Crypto API
- **CSRF Protection** — State parameter generation and validation
- **Profile Normalization** — Consistent profile shape across providers
- **Multiple Entry Points:**
  - `0authkit` — Class-based API for server-side
  - `0authkit/server` — Functional API for server-side
  - `0authkit/client` — Browser-safe API (no clientSecret)
- **TypeScript Support** — Full type definitions and intellisense
- **Universal Support** — Works in Node.js 18+ and modern browsers
- **Zero Dependencies** — Uses native `fetch` and Web Crypto API
- **Comprehensive Tests** — 247 tests covering:
  - Core OAuth flows (Google, GitHub)
  - PKCE implementation
  - State validation
  - Error scenarios (HTTP errors, network failures, malformed responses)
  - Edge cases (missing fields, special characters, concurrent flows)
  - All entry points (class, server, client)
  - Integration tests (full OAuth simulations)
- **Documentation:**
  - README.md with usage examples
  - API documentation
  - Security notes
  - Provider configuration details
  - TEST_COVERAGE.md with detailed test breakdown
  - PRODUCTION_READY.md with deployment checklist
  - ROADMAP.md with Phase 1/2/3 planning

### Security

- PKCE support for Google (code verifier + SHA-256 challenge)
- State parameter for CSRF protection
- HTTPS enforcement on all provider URLs
- ClientSecret never exposed to browser
- No credential logging or storage
- Input validation on all parameters

### Performance

- Auth URL generation: < 1ms
- Token exchange: 100-500ms (provider dependent)
- Profile fetch: 50-200ms (provider dependent)
- Minimal memory footprint
- No caching overhead

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Node.js 18+

### Known Limitations

These are intentional out-of-scope items for Phase 1:

- No token refresh (Phase 2)
- No session/cookie management (bring your own)
- No database/token storage (bring your own)
- No React hooks/UI components (Phase 2)
- No additional providers (Phase 2+)
- No PKCE for GitHub (GitHub doesn't support it)

---

## Upcoming

### Phase 2 (Q2 2026)

- User management helpers
- Token storage and refresh
- Session management helpers
- Database adapters

### Phase 3 (Q3 2026)

- Express middleware
- Next.js integration
- React hooks
- Framework-specific middleware

### Phase 4+ (Future)

- Additional providers (Twitter/X, Discord, Apple, Facebook, etc.)
- SaaS providers (Slack, Notion, Linear, Atlassian, etc.)
- Enterprise providers (Microsoft, Okta, Auth0, etc.)

---

## Contributing

Found a bug? Have a feature request? Open an issue or PR on [GitHub](https://github.com/thejamesnick/0AuthKit).

## License

MIT — See LICENSE file for details

---

Built by [thejamesnick](https://github.com/thejamesnick)
