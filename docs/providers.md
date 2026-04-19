# Providers

This guide walks users through creating OAuth credentials for every provider currently supported by 0AuthKit:

- Google
- GitHub

Use this page when you need `clientId` and `clientSecret` for your app setup.

---

## Before you start

1. Decide your callback URL (must match exactly in provider dashboards):
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
2. Keep secrets server-side only.
3. Never commit credentials to source control.

---

## Google

### Dashboard steps (Google Cloud Console)

1. Open [console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project
3. Go to **APIs & Services → OAuth consent screen**
4. Configure the consent screen (app name, support email, and test users if needed)
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → OAuth client ID**
7. Choose **Web application**
8. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`
9. Click **Create**
10. Copy your **Client ID** and **Client Secret**

### Environment variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 0AuthKit config

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
})
```

### Default scopes

`openid email profile`

### Provider notes

- Google supports PKCE (enabled by default in 0AuthKit).
- For non-test users, you may need to publish/verify your OAuth consent screen depending on requested scopes.

---

## GitHub

### Dashboard steps (GitHub Developer Settings)

1. Open [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps**
3. Click **New OAuth App**
4. Fill in:
   - **Application name**
   - **Homepage URL** (for example `http://localhost:3000`)
   - **Authorization callback URL** (for example `http://localhost:3000/auth/callback`)
5. Click **Register application**
6. Copy **Client ID**
7. Click **Generate a new client secret** and copy it

### Environment variables

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### 0AuthKit config

```ts
import { OAuthKit } from '0authkit'

const kit = new OAuthKit({
  provider: 'github',
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
})
```

### Default scopes

`read:user user:email`

### Provider notes

- GitHub OAuth Apps do not support PKCE.
- Email can be private; in that case `email` may be missing/null in provider payloads.

---

## Quick verification checklist

After creating credentials for any provider:

- Redirect URI in provider dashboard exactly matches your app `redirectUri`
- `clientId` and `clientSecret` are loaded from environment variables
- Secrets are not exposed in client-side bundles
- Login completes without `redirect_uri_mismatch` or `invalid_client`
