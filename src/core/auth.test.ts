import { describe, expect, it } from 'vitest'
import { getAuthUrl } from './auth.js'

describe('getAuthUrl', () => {
  it('returns a valid auth URL and state for github', async () => {
    const result = await getAuthUrl({
      provider: 'github',
      clientId: 'client-id',
      redirectUri: 'http://localhost:3000/auth/callback',
    })

    expect(result.url).toContain('https://github.com/login/oauth/authorize')
    expect(result.state).toBeTruthy()
    expect(result.codeVerifier).toBeUndefined()
  })
})
