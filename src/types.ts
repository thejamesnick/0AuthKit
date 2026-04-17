
export type Provider = 'google' | 'github'

export interface OAuthConfig {
  provider: Provider
  clientId: string
  clientSecret?: string  // not needed for client-side PKCE flow
  redirectUri: string
  scopes?: string[]
}

export interface AuthUrlResult {
  url: string
  state: string
  codeVerifier?: string  // only present when PKCE is used
}

export interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType: string
  scope?: string
}

export interface Profile {
  id: string
  email: string
  name: string
  avatar: string | null
  raw: Record<string, unknown>
}

export interface CallbackResult {
  tokens: TokenSet
  profile: Profile
}

export interface HandleCallbackOptions extends OAuthConfig {
  code: string
  state?: string
  codeVerifier?: string  // required if PKCE was used
}

export interface ProviderConfig {
  authUrl: string
  tokenUrl: string
  profileUrl: string
  defaultScopes: string[]
  supportsPkce: boolean
  normalizeProfile: (raw: Record<string, unknown>) => Profile
}
