
import type { ProviderConfig, Profile } from '../types.js'

function normalizeProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.sub ?? raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    avatar: raw.picture ? String(raw.picture) : null,
    raw,
  }
}

export const googleProvider: ProviderConfig = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  defaultScopes: ['openid', 'email', 'profile'],
  supportsPkce: true,
  normalizeProfile,
}
