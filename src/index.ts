
import { getAuthUrl } from './core/auth.js'
import { handleCallback } from './core/callback.js'
import type { OAuthConfig, AuthUrlResult, CallbackResult } from './types.js'

// Full class-based API — server-side only
export class OAuthKit {
  private config: OAuthConfig
  private lastState?: string
  private lastCodeVerifier?: string

  constructor(config: OAuthConfig) {
    this.config = config
  }

  async getAuthUrl(): Promise<AuthUrlResult> {
    const result = await getAuthUrl(this.config)
    this.lastState = result.state
    this.lastCodeVerifier = result.codeVerifier
    return result
  }

  async handleCallback(
    code: string,
    state?: string,
    options?: { expectedState?: string; codeVerifier?: string }
  ): Promise<CallbackResult> {
    return handleCallback({
      ...this.config,
      code,
      state,
      expectedState: options?.expectedState ?? this.lastState,
      codeVerifier: options?.codeVerifier ?? this.lastCodeVerifier,
    })
  }
}

// Also export functional API and types
export { getAuthUrl, handleCallback }
export type {
  OAuthConfig,
  AuthUrlResult,
  HandleCallbackOptions,
  CallbackResult,
  TokenSet,
  Profile,
  Provider,
} from './types.js'
