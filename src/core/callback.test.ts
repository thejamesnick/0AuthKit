import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { handleCallback } from './callback.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function textResponse(text: string, status: number): Response {
  return new Response(text, { status })
}

const GOOGLE_TOKEN = {
  access_token: 'goog-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'goog-refresh-token',
  scope: 'openid email profile',
}

const GOOGLE_PROFILE = {
  sub: 'goog-user-id',
  email: 'user@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  email_verified: true,
  locale: 'en',
}

const GITHUB_TOKEN = {
  access_token: 'gh-access-token',
  token_type: 'bearer',
  scope: 'read:user user:email',
}

const GITHUB_PROFILE = {
  id: 12345,
  login: 'testuser',
  name: 'Test User',
  email: 'user@example.com',
  avatar_url: 'https://avatars.githubusercontent.com/u/12345',
  bio: 'Developer',
  public_repos: 10,
  followers: 100,
}

// ---------------------------------------------------------------------------
// Validation errors (no network needed)
// ---------------------------------------------------------------------------

describe('handleCallback — validation errors', () => {
  it('throws when clientSecret is missing', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        clientId: 'client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('clientSecret is required')
  })

  it('throws when expectedState is provided but callback state is missing', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        expectedState: 'expected-state',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Missing state in callback')
  })

  it('throws when callback state does not match expectedState', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        state: 'tampered-state',
        expectedState: 'expected-state',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Invalid OAuth state')
  })

  it('passes state validation when state matches expectedState (then fails on PKCE check)', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        state: 'good-state',
        expectedState: 'good-state',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('codeVerifier is required for PKCE providers')
  })

  it('throws when a PKCE provider callback omits codeVerifier', async () => {
    await expect(
      handleCallback({
        provider: 'google',
        code: 'code',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('codeVerifier is required for PKCE providers')
  })

  it('does not throw for missing codeVerifier on a non-PKCE provider', async () => {
    // GitHub does not require codeVerifier — it should reach the network (and fail
    // because fetch is not mocked here), not throw the PKCE guard error
    await expect(
      handleCallback({
        provider: 'github',
        code: 'code',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.not.toThrow('codeVerifier is required for PKCE providers')
  })

  it('throws a descriptive error for an unknown provider', async () => {
    await expect(
      handleCallback({
        // @ts-expect-error — intentionally invalid provider for runtime test
        provider: 'discord',
        code: 'code',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Unknown provider: discord')
  })
})

// ---------------------------------------------------------------------------
// Happy path — Google
// ---------------------------------------------------------------------------

describe('handleCallback — Google happy path', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GOOGLE_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GOOGLE_PROFILE)),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  it('returns correct tokens', async () => {
    const { tokens } = await handleCallback({
      provider: 'google',
      code: 'auth-code',
      codeVerifier: 'my-verifier',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    expect(tokens.accessToken).toBe('goog-access-token')
    expect(tokens.tokenType).toBe('Bearer')
    expect(tokens.expiresIn).toBe(3600)
    expect(tokens.refreshToken).toBe('goog-refresh-token')
    expect(tokens.scope).toBe('openid email profile')
  })

  it('returns a normalized profile', async () => {
    const { profile } = await handleCallback({
      provider: 'google',
      code: 'auth-code',
      codeVerifier: 'my-verifier',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    expect(profile.id).toBe('goog-user-id')
    expect(profile.email).toBe('user@example.com')
    expect(profile.name).toBe('Test User')
    expect(profile.avatar).toBe('https://example.com/avatar.jpg')
    expect(profile.raw).toMatchObject(GOOGLE_PROFILE)
  })

  it('sends codeVerifier in the token exchange body', async () => {
    await handleCallback({
      provider: 'google',
      code: 'auth-code',
      codeVerifier: 'my-verifier',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    const call = vi.mocked(fetch).mock.calls[0]
    const body = new URLSearchParams(call[1]?.body as string)
    expect(body.get('code_verifier')).toBe('my-verifier')
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('auth-code')
  })

  it('sends Authorization header for profile fetch', async () => {
    await handleCallback({
      provider: 'google',
      code: 'auth-code',
      codeVerifier: 'my-verifier',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    const profileCall = vi.mocked(fetch).mock.calls[1]
    const headers = profileCall[1]?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer goog-access-token')
  })
})

// ---------------------------------------------------------------------------
// Happy path — GitHub
// ---------------------------------------------------------------------------

describe('handleCallback — GitHub happy path', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GITHUB_TOKEN))
        .mockResolvedValueOnce(jsonResponse(GITHUB_PROFILE)),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  it('returns correct tokens', async () => {
    const { tokens } = await handleCallback({
      provider: 'github',
      code: 'auth-code',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    expect(tokens.accessToken).toBe('gh-access-token')
    expect(tokens.tokenType).toBe('bearer')
  })

  it('returns a normalized profile', async () => {
    const { profile } = await handleCallback({
      provider: 'github',
      code: 'auth-code',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    expect(profile.id).toBe('12345')
    expect(profile.email).toBe('user@example.com')
    expect(profile.name).toBe('Test User')
    expect(profile.avatar).toBe('https://avatars.githubusercontent.com/u/12345')
  })

  it('does not send code_verifier for GitHub', async () => {
    await handleCallback({
      provider: 'github',
      code: 'auth-code',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    const body = new URLSearchParams(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(body.get('code_verifier')).toBeNull()
  })

  it('sends User-Agent header for profile fetch', async () => {
    await handleCallback({
      provider: 'github',
      code: 'auth-code',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    const profileCall = vi.mocked(fetch).mock.calls[1]
    const headers = profileCall[1]?.headers as Record<string, string>
    expect(headers['User-Agent']).toBe('0authkit')
  })
})

// ---------------------------------------------------------------------------
// Network error paths
// ---------------------------------------------------------------------------

describe('handleCallback — token exchange failure', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('throws with status and body on non-OK token response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('invalid_grant', 400)))

    await expect(
      handleCallback({
        provider: 'github',
        code: 'bad-code',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Token exchange failed (400): invalid_grant')
  })
})

describe('handleCallback — profile fetch failure', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('throws with status and body on non-OK profile response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(GITHUB_TOKEN))
        .mockResolvedValueOnce(textResponse('Unauthorized', 401)),
    )

    await expect(
      handleCallback({
        provider: 'github',
        code: 'code',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Profile fetch failed (401): Unauthorized')
  })
})
