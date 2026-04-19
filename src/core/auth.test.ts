import { describe, expect, it } from 'vitest'
import { getAuthUrl } from './auth.js'

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------
describe('getAuthUrl — Google', () => {
  it('returns a URL starting with the Google auth endpoint', async () => {
    const { url } = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
  })

  it('includes client_id, redirect_uri, response_type, and state params', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('client_id')).toBe('goog-client-id')
    expect(params.get('redirect_uri')).toBe('http://localhost:3000/auth/callback')
    expect(params.get('response_type')).toBe('code')
    expect(params.get('state')).toBe(result.state)
  })

  it('includes PKCE code_challenge and code_challenge_method=S256', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('code_challenge')).toBeTruthy()
    expect(params.get('code_challenge_method')).toBe('S256')
  })

  it('returns a codeVerifier when PKCE is used', async () => {
    const { codeVerifier } = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    expect(codeVerifier).toBeTruthy()
  })

  it('uses default Google scopes (openid email profile)', async () => {
    const { url } = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    const params = new URLSearchParams(new URL(url).search)
    expect(params.get('scope')).toBe('openid email profile')
  })

  it('uses custom scopes when provided', async () => {
    const { url } = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
      scopes: ['email'],
    })
    expect(new URLSearchParams(new URL(url).search).get('scope')).toBe('email')
  })

  it('generates a unique state on each call', async () => {
    const a = await getAuthUrl({ provider: 'google', clientId: 'id', redirectUri: 'http://localhost:3000' })
    const b = await getAuthUrl({ provider: 'google', clientId: 'id', redirectUri: 'http://localhost:3000' })
    expect(a.state).not.toBe(b.state)
  })
})

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------
describe('getAuthUrl — GitHub', () => {
  it('returns a URL starting with the GitHub auth endpoint', async () => {
    const { url } = await getAuthUrl({
      provider: 'github',
      clientId: 'gh-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    expect(url).toContain('https://github.com/login/oauth/authorize')
  })

  it('does not include PKCE params for GitHub', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'gh-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('code_challenge')).toBeNull()
    expect(result.codeVerifier).toBeUndefined()
  })

  it('uses default GitHub scopes (read:user user:email)', async () => {
    const { url } = await getAuthUrl({
      provider: 'github',
      clientId: 'gh-client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })
    const params = new URLSearchParams(new URL(url).search)
    expect(params.get('scope')).toBe('read:user user:email')
  })

  it('generates a unique state on each call', async () => {
    const a = await getAuthUrl({ provider: 'github', clientId: 'id', redirectUri: 'http://localhost:3000' })
    const b = await getAuthUrl({ provider: 'github', clientId: 'id', redirectUri: 'http://localhost:3000' })
    expect(a.state).not.toBe(b.state)
  })
})

// ---------------------------------------------------------------------------
// Unknown provider
// ---------------------------------------------------------------------------
describe('getAuthUrl — unknown provider', () => {
  it('throws a descriptive error for an unsupported provider', async () => {
    await expect(
      // @ts-expect-error — intentionally passing invalid provider for runtime test
      getAuthUrl({ provider: 'twitter', clientId: 'id', redirectUri: 'http://localhost:3000' })
    ).rejects.toThrow('Unknown provider: twitter')
  })
})
