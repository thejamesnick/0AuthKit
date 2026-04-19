import { describe, expect, it } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js'

// base64url alphabet — no +, /, or = padding
const BASE64URL_RE = /^[A-Za-z0-9\-_]+$/

describe('generateCodeVerifier', () => {
  it('returns a non-empty string', () => {
    expect(generateCodeVerifier()).toBeTruthy()
  })

  it('contains only base64url-safe characters', () => {
    expect(generateCodeVerifier()).toMatch(BASE64URL_RE)
  })

  it('generates a unique value each call', () => {
    const a = generateCodeVerifier()
    const b = generateCodeVerifier()
    expect(a).not.toBe(b)
  })

  it('has a reasonable minimum length (≥ 40 chars for 32 bytes)', () => {
    // 32 bytes → base64url → ~43 chars
    expect(generateCodeVerifier().length).toBeGreaterThanOrEqual(40)
  })
})

describe('generateCodeChallenge', () => {
  it('returns a non-empty string', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).toBeTruthy()
  })

  it('contains only base64url-safe characters', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).toMatch(BASE64URL_RE)
  })

  it('is deterministic — same verifier always gives same challenge', async () => {
    const verifier = generateCodeVerifier()
    const a = await generateCodeChallenge(verifier)
    const b = await generateCodeChallenge(verifier)
    expect(a).toBe(b)
  })

  it('produces a different challenge for different verifiers', async () => {
    const a = await generateCodeChallenge(generateCodeVerifier())
    const b = await generateCodeChallenge(generateCodeVerifier())
    expect(a).not.toBe(b)
  })

  it('produces a SHA-256 output (32 bytes → ~43 base64url chars)', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge.length).toBeGreaterThanOrEqual(40)
  })
})

describe('generateState', () => {
  it('returns a non-empty string', () => {
    expect(generateState()).toBeTruthy()
  })

  it('contains only base64url-safe characters', () => {
    expect(generateState()).toMatch(BASE64URL_RE)
  })

  it('generates a unique value each call', () => {
    const a = generateState()
    const b = generateState()
    expect(a).not.toBe(b)
  })

  it('has a reasonable minimum length (≥ 20 chars for 16 bytes)', () => {
    // 16 bytes → base64url → ~22 chars
    expect(generateState().length).toBeGreaterThanOrEqual(20)
  })
})
