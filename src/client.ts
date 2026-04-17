
// Browser-safe entry point — no clientSecret, no Node-only APIs
export { getAuthUrl } from './core/auth.js'
export type { OAuthConfig, AuthUrlResult, Provider } from './types.js'
