import { describe, expect, it, vi, afterEach } from 'vitest'
import { getAuthUrl, handleCallback } from '../src/server.js'

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
  access_token: 'token-123',
  token_type: 'Bearer',
  expires_in: 3600,
}

const GOOGLE_PROFILE = {
  sub: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
}

// ---------------------------------------------------------------------------
// Server entry point — functional API
// ---------------------------------------------------------------------------

describe('server entry point', () => {
  it('exports getAuthUrl', () => {
    expect(typeof getAuthUrl).toBe('function')
  })

  it('exports handleCallback', () => {
    expect(typeof handleCallback).toBe('function')
  })

  it('getAuthUrl works with or without clientSecret', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
    })
    expect(result.url).toBeTruthy()
    expect(result.state).toBeTruthy()
  })

  it('handleCallback requires clientSecret', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        clientId: 'client-id',
        redirectUri: 'http://localhost:3000/callback',
      })
    ).rejects.toThrow('clientSecret is required')
  })
})

// ---------------------------------------------------------------------------
// Functional API — getAuthUrl
// ---------------------------------------------------------------------------

describe('server.getAuthUrl', () => {
  it('returns url, state, and codeVerifier for Google', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'goog-id',
      redirectUri: 'https://example.com/callback',
    })
    expect(result.url).toContain('accounts.google.com')
    expect(result.state).toBeTruthy()
    expect(result.codeVerifier).toBeTruthy()
  })

  it('returns url and state but no codeVerifier for GitHub', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'gh-id',
      redirectUri: 'https://example.com/callback',
    })
    expect(result.url).toContain('github.com')
    expect(result.state).toBeTruthy()
    expect(result.codeVerifier).toBeUndefined()
  })

  it('respects custom scopes', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
      scopes: ['email'],
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('scope')).toBe('email')
  })
})

// ---------------------------------------------------------------------------
// Functional API — handleCallback
// ---------------------------------------------------------------------------

describe('server.handleCallback', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('exchanges code for tokens and profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GOOGLE_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GOOGLE_PROFILE)),
    )

    const result = await handleCallback({
      provider: 'google',
      code: 'auth-code',
      codeVerifier: 'verifier',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://example.com/callback',
    })

    expect(result.tokens.accessToken).toBe('token-123')
    expect(result.profile.email).toBe('user@example.com')
  })

  it('validates state when expectedState is provided', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        state: 'tampered',
        expectedState: 'expected',
        codeVerifier: 'verifier',
        clientId: 'id',
        clientSecret: 'secret',
        redirectUri: 'https://example.com/callback',
      })
    ).rejects.toThrow('Invalid OAuth state')
  })

  it('passes state validation when it matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GOOGLE_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GOOGLE_PROFILE)),
    )

    const result = await handleCallback({
      provider: 'google',
      code: 'code',
      state: 'good-state',
      expectedState: 'good-state',
      codeVerifier: 'verifier',
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'https://example.com/callback',
    })

    expect(result.profile.id).toBe('user-123')
  })
})
