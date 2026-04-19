import { describe, expect, it } from 'vitest'
import { googleProvider } from './google.js'

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

describe('googleProvider config', () => {
  it('has the correct authUrl', () => {
    expect(googleProvider.authUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  })

  it('has the correct tokenUrl', () => {
    expect(googleProvider.tokenUrl).toBe('https://oauth2.googleapis.com/token')
  })

  it('has the correct profileUrl', () => {
    expect(googleProvider.profileUrl).toBe('https://www.googleapis.com/oauth2/v3/userinfo')
  })

  it('all URLs use HTTPS', () => {
    expect(googleProvider.authUrl).toMatch(/^https:/)
    expect(googleProvider.tokenUrl).toMatch(/^https:/)
    expect(googleProvider.profileUrl).toMatch(/^https:/)
  })

  it('supports PKCE', () => {
    expect(googleProvider.supportsPkce).toBe(true)
  })

  it('includes openid, email, and profile in default scopes', () => {
    expect(googleProvider.defaultScopes).toContain('openid')
    expect(googleProvider.defaultScopes).toContain('email')
    expect(googleProvider.defaultScopes).toContain('profile')
  })
})

// ---------------------------------------------------------------------------
// normalizeProfile
// ---------------------------------------------------------------------------

describe('googleProvider.normalizeProfile', () => {
  const raw = {
    sub: 'goog-user-id',
    email: 'user@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true,
    locale: 'en',
    hd: 'company.com',
  }

  it('maps sub to id', () => {
    expect(googleProvider.normalizeProfile(raw).id).toBe('goog-user-id')
  })

  it('maps email', () => {
    expect(googleProvider.normalizeProfile(raw).email).toBe('user@example.com')
  })

  it('maps name', () => {
    expect(googleProvider.normalizeProfile(raw).name).toBe('Test User')
  })

  it('maps picture to avatar', () => {
    expect(googleProvider.normalizeProfile(raw).avatar).toBe('https://example.com/avatar.jpg')
  })

  it('sets avatar to null when picture is absent', () => {
    const { picture, ...withoutPicture } = raw
    expect(googleProvider.normalizeProfile(withoutPicture).avatar).toBeNull()
  })

  it('includes the full raw payload under .raw', () => {
    expect(googleProvider.normalizeProfile(raw).raw).toEqual(raw)
  })

  it('falls back to empty string id when both sub and id are absent', () => {
    const { sub, ...withoutSub } = raw
    expect(googleProvider.normalizeProfile(withoutSub).id).toBe('')
  })

  it('returns empty string for email when it is missing', () => {
    const { email, ...withoutEmail } = raw
    expect(googleProvider.normalizeProfile(withoutEmail).email).toBe('')
  })

  it('returns empty string for name when it is missing', () => {
    const { name, ...withoutName } = raw
    expect(googleProvider.normalizeProfile(withoutName).name).toBe('')
  })
})
