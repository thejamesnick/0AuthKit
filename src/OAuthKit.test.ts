import { describe, expect, it, vi, afterEach } from 'vitest'
import { OAuthKit } from './index.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const GOOGLE_TOKEN = {
  access_token: 'goog-token',
  token_type: 'Bearer',
  expires_in: 3600,
}

const GOOGLE_PROFILE = {
  sub: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
}

const GITHUB_TOKEN = {
  access_token: 'gh-token',
  token_type: 'bearer',
}

const GITHUB_PROFILE = {
  id: 99,
  login: 'testuser',
  name: 'Test User',
  email: 'user@example.com',
  avatar_url: 'https://avatars.githubusercontent.com/u/99',
}

// ---------------------------------------------------------------------------
// getAuthUrl
// ---------------------------------------------------------------------------

describe('OAuthKit — getAuthUrl', () => {
  it('returns url, state, and codeVerifier for Google (PKCE)', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    const result = await kit.getAuthUrl()
    expect(result.url).toContain('accounts.google.com')
    expect(result.state).toBeTruthy()
    expect(result.codeVerifier).toBeTruthy()
  })

  it('returns url and state but no codeVerifier for GitHub (no PKCE)', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    const result = await kit.getAuthUrl()
    expect(result.url).toContain('github.com')
    expect(result.state).toBeTruthy()
    expect(result.codeVerifier).toBeUndefined()
  })

  it('generates a unique state on each call', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    const a = await kit.getAuthUrl()
    const b = await kit.getAuthUrl()
    expect(a.state).not.toBe(b.state)
  })
})

// ---------------------------------------------------------------------------
// handleCallback — uses stored state & codeVerifier
// ---------------------------------------------------------------------------

describe('OAuthKit — handleCallback state/PKCE lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('passes validation when callback state matches the stored lastState', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    const { state } = await kit.getAuthUrl()

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GOOGLE_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GOOGLE_PROFILE)),
    )

    const result = await kit.handleCallback('auth-code', state)
    expect(result.profile.email).toBe('user@example.com')
  })

  it('rejects a tampered callback state', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    await kit.getAuthUrl()

    await expect(
      kit.handleCallback('auth-code', 'tampered-state'),
    ).rejects.toThrow('Invalid OAuth state')
  })

  it('accepts an explicit expectedState override', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GITHUB_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GITHUB_PROFILE)),
    )

    const result = await kit.handleCallback('auth-code', 'manual-state', {
      expectedState: 'manual-state',
    })
    expect(result.profile.id).toBe('99')
  })

  it('accepts an explicit codeVerifier override', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GOOGLE_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GOOGLE_PROFILE)),
    )

    const result = await kit.handleCallback('auth-code', undefined, {
      codeVerifier: 'my-own-verifier',
    })
    expect(result.profile.id).toBe('user-123')
  })

  it('uses the most recently stored state (last getAuthUrl wins)', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    })
    // Call getAuthUrl twice — the second state should be active
    await kit.getAuthUrl()
    const { state: secondState } = await kit.getAuthUrl()

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GITHUB_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GITHUB_PROFILE)),
    )

    const result = await kit.handleCallback('auth-code', secondState)
    expect(result.profile.id).toBe('99')
  })
})

// ---------------------------------------------------------------------------
// Constructor / config forwarding
// ---------------------------------------------------------------------------

describe('OAuthKit — config forwarding', () => {
  it('forwards custom scopes to the auth URL', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
      scopes: ['email'],
    })
    const { url } = await kit.getAuthUrl()
    const params = new URLSearchParams(new URL(url).search)
    expect(params.get('scope')).toBe('email')
  })

  it('forwards the correct redirectUri', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://myapp.com/auth/callback',
    })
    const { url } = await kit.getAuthUrl()
    const params = new URLSearchParams(new URL(url).search)
    expect(params.get('redirect_uri')).toBe('https://myapp.com/auth/callback')
  })
})
