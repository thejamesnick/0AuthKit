# 0AuthKit Content Pack

## One-line pitch
Add OAuth to your app in minutes. Bring your credentials, 0AuthKit handles the flow.

## Short project intro (for README, Devpost, portfolio)
0AuthKit is a lightweight TypeScript OAuth SDK for Google and GitHub. It focuses on the boring parts developers repeatedly re-implement: auth URL generation, callback handling, token exchange, and profile normalization. The goal is simple integration with fewer moving parts and no runtime dependencies.

## “What problem does this solve?”
Developers keep copying OAuth boilerplate across projects, and each copy introduces subtle mistakes (state handling, PKCE flow, provider-specific quirks). 0AuthKit centralizes that logic into a small reusable package.

## Feature bullets
- Google + GitHub OAuth support
- State generation and validation support
- PKCE support for compatible providers
- Normalized profile shape + raw payload access
- Server and client entry points
- Zero runtime dependencies

## Educational mini-post (for HackLearn / blog)
OAuth feels hard mostly because tutorials mix too many concerns at once. Split it into three steps: generate auth URL, exchange code, fetch profile. Once that model is clear, provider-specific differences become manageable. The biggest beginner trap is skipping state validation; always compare callback state to stored state.

## X/Twitter post ideas
1. Built a tiny OAuth SDK this weekend: 0AuthKit. Goal: reduce copy-paste auth boilerplate to a few lines. Google + GitHub supported. #buildinpublic #typescript
2. If your OAuth setup doesn’t validate state, it’s incomplete. Added explicit `expectedState` validation in 0AuthKit callback flow. Security first. 🔐
3. Mini-hack shipped: 0AuthKit — zero runtime deps, normalized profile output, fast setup for Node apps.

## LinkedIn post draft
I built 0AuthKit as a mini hack project to make OAuth integration less repetitive. Instead of rebuilding auth URL generation, callback token exchange, and profile normalization in each project, this package standardizes those steps with a small TypeScript API. The biggest learning: documentation quality is as important as code quality, especially for security-sensitive flows like OAuth.

## Demo script (60 seconds)
1. Show install command
2. Show auth route generating URL/state
3. Show callback route exchanging code
4. Log normalized profile object
5. Mention security basics (state + PKCE + server-side secret)

## FAQ snippet
**Is it production ready?**
Good foundation, but add automated tests and more provider coverage before heavy production use.

**Can I use it in frontend-only apps?**
Use client entry for URL generation, but token exchange requiring secret should remain server-side.
