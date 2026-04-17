
import type { OAuthConfig, AuthUrlResult } from '../types.js'
import { googleProvider } from '../providers/google.js'
import { githubProvider } from '../providers/github.js'
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js'
import type { ProviderConfig } from '../types.js'

function getProvider(name: OAuthConfig['provider']): ProviderConfig {
  if (name === 'google') return googleProvider
  if (name === 'github') return githubProvider
  throw new Error(`Unknown provider: ${name}`)
}

export async function getAuthUrl(config: OAuthConfig): Promise<AuthUrlResult> {
  const provider = getProvider(config.provider)
  const scopes = config.scopes ?? provider.defaultScopes
  const state = generateState()

  const params: Record<string, string> = {
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
  }

  let codeVerifier: string | undefined

  if (provider.supportsPkce) {
    codeVerifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(codeVerifier)
    params.code_challenge = challenge
    params.code_challenge_method = 'S256'
  }

  const url = `${provider.authUrl}?${new URLSearchParams(params).toString()}`

  return { url, state, codeVerifier }
}
