# HACKLEARN — 0AuthKit

## What this hack taught us

### 1) OAuth can be simple if you split it into 3 steps
1. Build auth URL
2. Exchange code for tokens
3. Fetch profile

That mental model keeps implementation small and reusable.

### 2) State is not optional
`state` is CSRF protection for OAuth. If you generate it but do not validate it, security is incomplete.

### 3) PKCE matters
For providers that support PKCE (Google), keep the `codeVerifier` from login request and send it during callback token exchange.

### 4) “Easy to use” = fewer decisions
SDK should expose defaults that work:
- provider defaults for scopes
- one function for auth URL
- one function for callback
- normalized profile shape

### 5) Docs are part of the product
If examples are not accurate (missing `await`, missing state validation), developers lose trust quickly.

---

## Beginner educational notes

### OAuth terms in plain English
- **Client ID**: public app identifier.
- **Client Secret**: private password for your server.
- **Redirect URI**: where provider sends user back.
- **Authorization Code**: short-lived code exchanged for tokens.
- **Access Token**: token used to call provider APIs.
- **Scope**: permission level requested from user.

### Safe integration checklist
- [ ] Store secret in env vars
- [ ] Use HTTPS in production
- [ ] Save `state` in session/cookie
- [ ] Validate callback `state` equals stored value
- [ ] Save and send `codeVerifier` for PKCE providers
- [ ] Handle provider errors cleanly

---

## Next improvements to make this project truly “solid”

1. Add automated tests for:
   - state mismatch rejection
   - PKCE verifier requirement
   - profile normalization
2. Add minimal copy-paste examples for Express + Next
3. Add troubleshooting section for common provider setup mistakes
4. Add typed error codes for better app-level handling

---

Mini-hack takeaway: this is a strong base. Add tests + polished docs and it becomes very usable for others.
