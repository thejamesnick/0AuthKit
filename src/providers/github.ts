
import type { ProviderConfig, Profile } from '../types.js'

function normalizeProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? raw.login ?? ''),
    avatar: raw.avatar_url ? String(raw.avatar_url) : null,
    raw,
  }
}

export const githubProvider: ProviderConfig = {
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  profileUrl: 'https://api.github.com/user',
  defaultScopes: ['read:user', 'user:email'],
  supportsPkce: false,
  normalizeProfile,
}
