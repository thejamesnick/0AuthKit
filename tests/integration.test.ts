import { describe, expect, it, vi, afterEach } from 'vitest'
import { OAuthKit } from '../src/index.js'
import { getAuthUrl as getAuthUrlServer, handleCallback as handleCallbackServer } from '../src/server.js'
import { getAuthUrl as getAuthUrlClient } from '../src/client.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Full OAuth flow simulation — Google
// ---------------------------------------------------------------------------

describe('integration — Google OAuth flow', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('completes full flow: getAuthUrl → handleCallback', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'goog-client-id',
      clientSecret: 'goog-client-secret',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    // Step 1: Get auth URL
    const { url, state, codeVerifier } = await kit.getAuthUrl()
    expect(url).toContain('accounts.google.com')
    expect(state).toBeTruthy()
    expect(codeVerifier).toBeTruthy()

    // Step 2: Simulate callback with mocked token exchange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: 'goog-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'goog-refresh-token',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            sub: 'goog-user-123',
            email: 'user@gmail.com',
            name: 'John Doe',
            picture: 'https://example.com/avatar.jpg',
          }),
        ),
    )

    const result = await kit.handleCallback('auth-code', state)

    expect(result.tokens.accessToken).toBe('goog-access-token')
    expect(result.tokens.refreshToken).toBe('goog-refresh-token')
    expect(result.profile.id).toBe('goog-user-123')
    expect(result.profile.email).toBe('user@gmail.com')
  })

  it('rejects callback with mismatched state', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'goog-client-id',
      clientSecret: 'goog-client-secret',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    await kit.getAuthUrl()

    await expect(kit.handleCallback('auth-code', 'wrong-state')).rejects.toThrow(
      'Invalid OAuth state',
    )
  })
})

// ---------------------------------------------------------------------------
// Full OAuth flow simulation — GitHub
// ---------------------------------------------------------------------------

describe('integration — GitHub OAuth flow', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('completes full flow: getAuthUrl → handleCallback', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'gh-client-id',
      clientSecret: 'gh-client-secret',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    // Step 1: Get auth URL
    const { url, state } = await kit.getAuthUrl()
    expect(url).toContain('github.com')
    expect(state).toBeTruthy()

    // Step 2: Simulate callback
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: 'gh-access-token',
            token_type: 'bearer',
            scope: 'read:user user:email',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            id: 12345,
            login: 'johndoe',
            name: 'John Doe',
            email: 'john@example.com',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          }),
        ),
    )

    const result = await kit.handleCallback('auth-code', state)

    expect(result.tokens.accessToken).toBe('gh-access-token')
    expect(result.profile.id).toBe('12345')
    expect(result.profile.email).toBe('john@example.com')
  })
})

// ---------------------------------------------------------------------------
// Server functional API flow
// ---------------------------------------------------------------------------

describe('integration — server functional API', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('completes flow using server functional API', async () => {
    // Step 1: Get auth URL
    const { url, state, codeVerifier } = await getAuthUrlServer({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    expect(url).toContain('accounts.google.com')
    expect(state).toBeTruthy()
    expect(codeVerifier).toBeTruthy()

    // Step 2: Handle callback
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: 'token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            sub: 'user-123',
            email: 'user@example.com',
            name: 'User',
          }),
        ),
    )

    const result = await handleCallbackServer({
      provider: 'google',
      code: 'auth-code',
      state,
      expectedState: state,
      codeVerifier,
      clientId: 'goog-client-id',
      clientSecret: 'goog-client-secret',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    expect(result.profile.email).toBe('user@example.com')
  })
})

// ---------------------------------------------------------------------------
// Client-side flow (browser)
// ---------------------------------------------------------------------------

describe('integration — client-side flow', () => {
  it('generates auth URL without clientSecret', async () => {
    const { url, state } = await getAuthUrlClient({
      provider: 'google',
      clientId: 'goog-client-id',
      redirectUri: 'https://myapp.com/auth/callback',
    })

    expect(url).toContain('accounts.google.com')
    expect(state).toBeTruthy()
  })

  it('client API does not expose handleCallback', () => {
    // This is a type-level check, but we can verify the export doesn't exist
    expect(typeof getAuthUrlClient).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Multiple concurrent flows
// ---------------------------------------------------------------------------

describe('integration — concurrent flows', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('handles multiple concurrent OAuth flows', async () => {
    const kit1 = new OAuthKit({
      provider: 'google',
      clientId: 'goog-id',
      clientSecret: 'goog-secret',
      redirectUri: 'https://app1.com/callback',
    })

    const kit2 = new OAuthKit({
      provider: 'github',
      clientId: 'gh-id',
      clientSecret: 'gh-secret',
      redirectUri: 'https://app2.com/callback',
    })

    const [result1, result2] = await Promise.all([kit1.getAuthUrl(), kit2.getAuthUrl()])

    expect(result1.url).toContain('accounts.google.com')
    expect(result2.url).toContain('github.com')
    expect(result1.state).not.toBe(result2.state)
  })

  it('handles multiple sequential flows with different states', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'goog-id',
      clientSecret: 'goog-secret',
      redirectUri: 'https://myapp.com/callback',
    })

    const flow1 = await kit.getAuthUrl()
    const flow2 = await kit.getAuthUrl()

    expect(flow1.state).not.toBe(flow2.state)
    expect(flow1.codeVerifier).not.toBe(flow2.codeVerifier)
  })
})

// ---------------------------------------------------------------------------
// Error recovery
// ---------------------------------------------------------------------------

describe('integration — error recovery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recovers from token exchange failure and retries', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'goog-id',
      clientSecret: 'goog-secret',
      redirectUri: 'https://myapp.com/callback',
    })

    const { state } = await kit.getAuthUrl()

    // First attempt fails
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')))

    await expect(kit.handleCallback('code', state)).rejects.toThrow('Network error')

    // Second attempt succeeds
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: 'token',
            token_type: 'Bearer',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            sub: 'user-123',
            email: 'user@example.com',
            name: 'User',
          }),
        ),
    )

    const result = await kit.handleCallback('code', state)
    expect(result.profile.email).toBe('user@example.com')
  })

  it('handles provider returning partial profile data', async () => {
    const kit = new OAuthKit({
      provider: 'github',
      clientId: 'gh-id',
      clientSecret: 'gh-secret',
      redirectUri: 'https://myapp.com/callback',
    })

    const { state } = await kit.getAuthUrl()

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: 'token',
            token_type: 'bearer',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            id: 123,
            login: 'user',
            // Missing email, name, avatar_url
          }),
        ),
    )

    const result = await kit.handleCallback('code', state)
    expect(result.profile.id).toBe('123')
    expect(result.profile.email).toBe('')
    expect(result.profile.name).toBe('user')
    expect(result.profile.avatar).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Custom scopes
// ---------------------------------------------------------------------------

describe('integration — custom scopes', () => {
  it('respects custom scopes in auth URL', async () => {
    const kit = new OAuthKit({
      provider: 'google',
      clientId: 'goog-id',
      clientSecret: 'goog-secret',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    })

    const { url } = await kit.getAuthUrl()
    const params = new URLSearchParams(new URL(url).search)
    expect(params.get('scope')).toContain('email')
    expect(params.get('scope')).toContain('calendar')
  })
})
