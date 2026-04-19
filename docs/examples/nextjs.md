# Example: Next.js App Router

A complete integration using Next.js 14+ App Router API routes.

---

## Setup

```bash
npm install 0authkit
```

```env
# .env.local
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## File structure

```
app/
  api/
    auth/
      google/
        route.ts        ← Step 1: redirect to Google
      callback/
        route.ts        ← Step 2: handle callback
  page.tsx
```

---

## Step 1 — Initiate login

```ts
// app/api/auth/google/route.ts
import { getAuthUrl } from '0authkit/server'
import { cookies } from 'next/headers'

export async function GET() {
  const { url, state, codeVerifier } = await getAuthUrl({
    provider: 'google',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
  })

  const cookieStore = await cookies()

  // Store state and codeVerifier in HttpOnly cookies
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  if (codeVerifier) {
    cookieStore.set('oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    })
  }

  return Response.redirect(url)
}
```

---

## Step 2 — Handle callback

```ts
// app/api/auth/callback/route.ts
import { handleCallback } from '0authkit/server'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return Response.redirect(`${process.env.NEXTAUTH_URL}/?error=access_denied`)
  }

  const cookieStore = await cookies()
  const expectedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value

  try {
    const result = await handleCallback({
      provider: 'google',
      code,
      state: state ?? undefined,
      expectedState,
      codeVerifier,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
    })

    // Clear OAuth cookies
    cookieStore.delete('oauth_state')
    cookieStore.delete('oauth_code_verifier')

    // Set session cookie (use a real session library in production)
    cookieStore.set('session_user', JSON.stringify(result.profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
  } catch (err) {
    console.error('OAuth error:', err)
    return Response.redirect(`${process.env.NEXTAUTH_URL}/?error=auth_failed`)
  }
}
```

---

## Reading the session

```ts
// app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('session_user')?.value

  if (!raw) {
    redirect('/')
  }

  const user = JSON.parse(raw)

  return (
    <main>
      <h1>Hello, {user.name}</h1>
      <p>{user.email}</p>
      {user.avatar && <img src={user.avatar} alt="avatar" />}
    </main>
  )
}
```

---

## Login button (client component)

```tsx
// app/components/LoginButton.tsx
'use client'

export function LoginButton() {
  return (
    <a href="/api/auth/google">
      <button>Sign in with Google</button>
    </a>
  )
}
```

---

## Adding GitHub

Add a second route pair following the same pattern:

```ts
// app/api/auth/github/route.ts
import { getAuthUrl } from '0authkit/server'
import { cookies } from 'next/headers'

export async function GET() {
  const { url, state } = await getAuthUrl({
    provider: 'github',
    clientId: process.env.GITHUB_CLIENT_ID!,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
  })

  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600 })
  return Response.redirect(url)
}
```

```ts
// app/api/auth/github/callback/route.ts
import { handleCallback } from '0authkit/server'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('oauth_state')?.value

  const result = await handleCallback({
    provider: 'github',
    code: searchParams.get('code')!,
    state: searchParams.get('state') ?? undefined,
    expectedState,
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
  })

  cookieStore.delete('oauth_state')
  cookieStore.set('session_user', JSON.stringify(result.profile), { httpOnly: true })
  return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
}
```
