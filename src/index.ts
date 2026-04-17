
import { getAuthUrl } from './core/auth.js'
import { handleCallback } from './core/callback.js'
import type { OAuthConfig, AuthUrlResult, CallbackResult } from './types.js'

// Full class-based API — server-side only
export class OAuthKit {
  private config: OAuthConfig

  constructor(config: OAuthConfig) {
    this.config = config
  }

  async getAuthUrl(): Promise<AuthUrlResult> {
    return getAuthUrl(this.config)
  }

  async handleCallback(code: string, state?: string): Promise<CallbackResult> {
    return handleCallback({ ...this.config, code, state })
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
