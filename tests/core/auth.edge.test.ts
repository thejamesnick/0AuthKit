import { describe, expect, it } from 'vitest'
import { getAuthUrl } from '../../src/core/auth.js'

// ---------------------------------------------------------------------------
// URL encoding and special characters
// ---------------------------------------------------------------------------

describe('getAuthUrl — URL encoding', () => {
  it('properly encodes special characters in redirectUri', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback?foo=bar&baz=qux',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('redirect_uri')).toBe('https://example.com/callback?foo=bar&baz=qux')
  })

  it('properly encodes special characters in clientId', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id-with-special_chars.123',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('client_id')).toBe('id-with-special_chars.123')
  })

  it('properly encodes spaces in scopes', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
      scopes: ['scope one', 'scope two'],
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('scope')).toBe('scope one scope two')
  })
})

// ---------------------------------------------------------------------------
// State and PKCE uniqueness
// ---------------------------------------------------------------------------

describe('getAuthUrl — state and PKCE uniqueness', () => {
  it('generates different states across multiple calls', async () => {
    const states = new Set()
    for (let i = 0; i < 10; i++) {
      const result = await getAuthUrl({
        provider: 'google',
        clientId: 'id',
        redirectUri: 'https://example.com/callback',
      })
      states.add(result.state)
    }
    expect(states.size).toBe(10)
  })

  it('generates different codeVerifiers across multiple calls', async () => {
    const verifiers = new Set()
    for (let i = 0; i < 10; i++) {
      const result = await getAuthUrl({
        provider: 'google',
        clientId: 'id',
        redirectUri: 'https://example.com/callback',
      })
      verifiers.add(result.codeVerifier)
    }
    expect(verifiers.size).toBe(10)
  })

  it('state is always present in URL', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.has('state')).toBe(true)
    expect(params.get('state')).toBeTruthy()
  })

  it('state in URL matches returned state', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('state')).toBe(result.state)
  })
})

// ---------------------------------------------------------------------------
// PKCE challenge validation
// ---------------------------------------------------------------------------

describe('getAuthUrl — PKCE challenge', () => {
  it('code_challenge is always present for Google', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.has('code_challenge')).toBe(true)
  })

  it('code_challenge_method is S256 for Google', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('code_challenge_method')).toBe('S256')
  })

  it('code_challenge is never present for GitHub', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.has('code_challenge')).toBe(false)
  })

  it('code_challenge_method is never present for GitHub', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.has('code_challenge_method')).toBe(false)
  })

  it('code_challenge is different for different verifiers', async () => {
    const result1 = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const result2 = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params1 = new URLSearchParams(new URL(result1.url).search)
    const params2 = new URLSearchParams(new URL(result2.url).search)
    expect(params1.get('code_challenge')).not.toBe(params2.get('code_challenge'))
  })
})

// ---------------------------------------------------------------------------
// Response type and grant type
// ---------------------------------------------------------------------------

describe('getAuthUrl — response type', () => {
  it('always uses response_type=code', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('response_type')).toBe('code')
  })

  it('response_type=code for GitHub too', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('response_type')).toBe('code')
  })
})

// ---------------------------------------------------------------------------
// Empty and edge case inputs
// ---------------------------------------------------------------------------

describe('getAuthUrl — edge case inputs', () => {
  it('handles empty scopes array', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
      scopes: [],
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('scope')).toBe('')
  })

  it('handles very long clientId', async () => {
    const longId = 'a'.repeat(500)
    const result = await getAuthUrl({
      provider: 'google',
      clientId: longId,
      redirectUri: 'https://example.com/callback',
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('client_id')).toBe(longId)
  })

  it('handles very long redirectUri', async () => {
    const longUri = 'https://example.com/callback?' + 'a=b&'.repeat(100)
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: longUri,
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('redirect_uri')).toBe(longUri)
  })

  it('handles many scopes', async () => {
    const scopes = Array.from({ length: 50 }, (_, i) => `scope${i}`)
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
      scopes,
    })
    const params = new URLSearchParams(new URL(result.url).search)
    expect(params.get('scope')).toBe(scopes.join(' '))
  })
})

// ---------------------------------------------------------------------------
// HTTPS enforcement
// ---------------------------------------------------------------------------

describe('getAuthUrl — HTTPS enforcement', () => {
  it('always uses HTTPS for Google auth URL', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    expect(result.url).toMatch(/^https:/)
  })

  it('always uses HTTPS for GitHub auth URL', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'id',
      redirectUri: 'https://example.com/callback',
    })
    expect(result.url).toMatch(/^https:/)
  })
})
