# Providers

How to create OAuth credentials for each supported provider.

---

## Google

### Create credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Select **Web application**
6. Add your **Authorized redirect URIs**:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

### Environment variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### SDK configuration

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

These give you the user's Google ID, verified email, and display name. Override with the `scopes` option if you need additional access (e.g. `['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar']`).

### Raw payload fields

| Field | Description |
|---|---|
| `sub` | Google's unique user ID |
| `email` | Primary email address |
| `email_verified` | Whether the email is verified |
| `name` | Full display name |
| `picture` | Profile picture URL |
| `locale` | User locale |
| `hd` | Hosted domain (G Suite / Google Workspace accounts only) |

### Notes

- Google requires you to verify your OAuth consent screen before allowing non-test users. During development, add test users under **OAuth consent screen → Test users**.
- PKCE is supported and enabled by default in 0AuthKit.

---

## GitHub

### Create credentials

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name** — your app name
   - **Homepage URL** — e.g. `http://localhost:3000`
   - **Authorization callback URL** — e.g. `http://localhost:3000/auth/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

### Environment variables

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### SDK configuration

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

These give you the user's public profile and their primary email. Override with the `scopes` option for additional access (e.g. `['read:user', 'user:email', 'repo']`).

### Raw payload fields

| Field | Description |
|---|---|
| `id` | GitHub's unique numeric user ID |
| `login` | GitHub username |
| `name` | Display name |
| `email` | Primary email (may be `null` if the user's email is private) |
| `avatar_url` | Profile picture URL |
| `bio` | Short bio |
| `company` | Company name |
| `location` | Location |
| `public_repos` | Number of public repositories |
| `followers` | Follower count |

### Notes

- GitHub does not support PKCE — state-only CSRF protection is used.
- A user's email may be `null` if they have set it to private in GitHub settings. The normalized profile will return an empty string in that case. Consider prompting the user to make their email public or request the `user:email` scope and call the `/user/emails` GitHub API endpoint directly.
- GitHub OAuth tokens do not expire by default (unless you use fine-grained tokens).
