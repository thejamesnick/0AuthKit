import { describe, expect, it } from 'vitest'
import { githubProvider } from '../../src/providers/github.js'

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

describe('githubProvider config', () => {
  it('has the correct authUrl', () => {
    expect(githubProvider.authUrl).toBe('https://github.com/login/oauth/authorize')
  })

  it('has the correct tokenUrl', () => {
    expect(githubProvider.tokenUrl).toBe('https://github.com/login/oauth/access_token')
  })

  it('has the correct profileUrl', () => {
    expect(githubProvider.profileUrl).toBe('https://api.github.com/user')
  })

  it('all URLs use HTTPS', () => {
    expect(githubProvider.authUrl).toMatch(/^https:/)
    expect(githubProvider.tokenUrl).toMatch(/^https:/)
    expect(githubProvider.profileUrl).toMatch(/^https:/)
  })

  it('does not support PKCE', () => {
    expect(githubProvider.supportsPkce).toBe(false)
  })

  it('includes read:user and user:email in default scopes', () => {
    expect(githubProvider.defaultScopes).toContain('read:user')
    expect(githubProvider.defaultScopes).toContain('user:email')
  })
})

// ---------------------------------------------------------------------------
// normalizeProfile
// ---------------------------------------------------------------------------

describe('githubProvider.normalizeProfile', () => {
  const raw = {
    id: 12345,
    login: 'testuser',
    name: 'Test User',
    email: 'user@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    bio: 'Developer',
    company: 'Acme',
    location: 'Earth',
    public_repos: 10,
    followers: 100,
  }

  it('maps id to a string', () => {
    expect(githubProvider.normalizeProfile(raw).id).toBe('12345')
  })

  it('maps email', () => {
    expect(githubProvider.normalizeProfile(raw).email).toBe('user@example.com')
  })

  it('maps name', () => {
    expect(githubProvider.normalizeProfile(raw).name).toBe('Test User')
  })

  it('falls back to login when name is absent', () => {
    const { name, ...withoutName } = raw
    expect(githubProvider.normalizeProfile(withoutName).name).toBe('testuser')
  })

  it('maps avatar_url to avatar', () => {
    expect(githubProvider.normalizeProfile(raw).avatar).toBe('https://avatars.githubusercontent.com/u/12345')
  })

  it('sets avatar to null when avatar_url is absent', () => {
    const { avatar_url, ...withoutAvatar } = raw
    expect(githubProvider.normalizeProfile(withoutAvatar).avatar).toBeNull()
  })

  it('returns empty string for email when it is null', () => {
    expect(githubProvider.normalizeProfile({ ...raw, email: null }).email).toBe('')
  })

  it('returns empty string for id when id is absent', () => {
    const { id, ...withoutId } = raw
    expect(githubProvider.normalizeProfile(withoutId).id).toBe('')
  })

  it('includes the full raw payload under .raw', () => {
    expect(githubProvider.normalizeProfile(raw).raw).toEqual(raw)
  })
})
