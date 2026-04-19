import { describe, expect, it } from 'vitest'
import { handleCallback } from './callback.js'

describe('handleCallback', () => {
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
        state: 'wrong-state',
        expectedState: 'expected-state',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/auth/callback',
      })
    ).rejects.toThrow('Invalid OAuth state')
  })

  it('throws when PKCE provider callback omits codeVerifier', async () => {
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
})
