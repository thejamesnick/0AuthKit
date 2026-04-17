
// PKCE via Web Crypto API — works in Node 18+ and all modern browsers

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  return base64UrlEncode(buffer.buffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

export function generateState(): string {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return base64UrlEncode(buffer.buffer)
}
