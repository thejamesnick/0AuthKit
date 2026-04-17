
import type { HandleCallbackOptions, CallbackResult, TokenSet } from '../types.js'
import { googleProvider } from '../providers/google.js'
import { githubProvider } from '../providers/github.js'
import type { ProviderConfig } from '../types.js'

function getProvider(name: HandleCallbackOptions['provider']): ProviderConfig {
  if (name === 'google') return googleProvider
  if (name === 'github') return githubProvider
  throw new Error(`Unknown provider: ${name}`)
}

async function exchangeToken(
  provider: ProviderConfig,
  config: HandleCallbackOptions
): Promise<TokenSet> {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code: config.code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret!,
  }

  if (config.codeVerifier) {
    body.code_verifier = config.codeVerifier
  }

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(body).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  const data = await res.json() as Record<string, unknown>

  return {
    accessToken: String(data.access_token ?? ''),
    refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
    expiresIn: data.expires_in ? Number(data.expires_in) : undefined,
    tokenType: String(data.token_type ?? 'Bearer'),
    scope: data.scope ? String(data.scope) : undefined,
  }
}

async function fetchProfile(
  provider: ProviderConfig,
  accessToken: string
): Promise<Record<string, unknown>> {
  const res = await fetch(provider.profileUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      // GitHub requires a User-Agent
      'User-Agent': '0authkit',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Profile fetch failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<Record<string, unknown>>
}

export async function handleCallback(config: HandleCallbackOptions): Promise<CallbackResult> {
  if (!config.clientSecret) {
    throw new Error('clientSecret is required for handleCallback — use the server entry point')
  }

  const provider = getProvider(config.provider)
  const tokens = await exchangeToken(provider, config)
  const raw = await fetchProfile(provider, tokens.accessToken)
  const profile = provider.normalizeProfile(raw)

  return { tokens, profile }
}
