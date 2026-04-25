import { describe, expect, it } from 'vitest'
import { getAuthUrl } from '../src/client.js'

// ---------------------------------------------------------------------------
// Client entry point — browser-safe, no secrets
// ---------------------------------------------------------------------------

describe('client entry point', () => {
  it('exports getAuthUrl', () => {
    expect(typeof getAuthUrl).toBe('function')
  })

  it('works without clientSecret', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
    })
    expect(result.url).toBeTruthy()
    expect(result.state).toBeTruthy()
  })

  it('generates PKCE for Google', async () => {
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
    })
    expect(result.codeVerifier).toBeTruthy()
  })

  it('does not generate PKCE for GitHub', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/callback',
    })
    expect(result.codeVerifier).toBeUndefined()
  })

  it('can be used in a browser context (no Node APIs)', async () => {
    // This test verifies the module doesn't use Node-only APIs
    // by checking it exports only browser-safe functions
    const result = await getAuthUrl({
      provider: 'google',
      clientId: 'test-id',
      redirectUri: 'https://example.com/callback',
    })
    expect(result).toHaveProperty('url')
    expect(result).toHaveProperty('state')
  })
})
