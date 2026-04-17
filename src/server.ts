
// Server-only entry point — functional API
export { getAuthUrl } from './core/auth.js'
export { handleCallback } from './core/callback.js'
export type {
  OAuthConfig,
  AuthUrlResult,
  HandleCallbackOptions,
  CallbackResult,
  TokenSet,
  Profile,
  Provider,
} from './types.js'
