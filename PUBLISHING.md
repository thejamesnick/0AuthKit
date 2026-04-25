# Publishing 0AuthKit to npm

## Pre-Publishing Checklist

Before publishing to npm, make sure:

- [ ] All tests pass: `npm test`
- [ ] Build compiles: `npm run build`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] Git changes committed and pushed
- [ ] You have npm account with publish access

## Publishing Steps

### 1. Verify Everything Works

```bash
# Run tests
npm test

# Build
npm run build

# Check dist folder exists and has files
ls -la dist/
```

### 2. Update Version

Update `package.json` version following [semver](https://semver.org/):

```json
{
  "version": "1.0.0"
}
```

### 3. Update CHANGELOG

Add entry to `CHANGELOG.md`:

```markdown
## [1.0.0] - 2026-04-25

### Added
- Initial release
- Google OAuth support
- GitHub OAuth support
- PKCE implementation
- 247 comprehensive tests
```

### 4. Commit and Tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 5. Publish to npm

```bash
npm publish
```

This will:
- Run `prepublishOnly` script (build + test)
- Package only files in `files` array
- Upload to npm registry
- Make it available at `npm install 0authkit`

### 6. Verify Published Package

```bash
# Check npm registry
npm view 0authkit

# Install from npm
npm install 0authkit

# Test it works
node -e "import('0authkit').then(m => console.log('✅ Works!'))"
```

## Publishing from CI/CD (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then just push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically publish!

## Versioning Strategy

- **Major (1.0.0):** Breaking changes, new providers, major features
- **Minor (1.1.0):** New features, new entry points, backwards compatible
- **Patch (1.0.1):** Bug fixes, security patches, documentation

## What Gets Published

Files included in npm package (from `package.json` `files` array):

```
dist/
├── index.js
├── index.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
├── core/
│   ├── auth.js
│   ├── auth.d.ts
│   ├── callback.js
│   ├── callback.d.ts
│   ├── pkce.js
│   └── pkce.d.ts
└── providers/
    ├── github.js
    ├── github.d.ts
    ├── google.js
    └── google.d.ts
README.md
LICENSE
```

Files excluded (from `.npmignore`):

```
src/
tests/
*.test.ts
tsconfig.json
SPEC.md
STACK.md
HACKLEARN.md
TODO.txt
TEST_COVERAGE.md
PRODUCTION_READY.md
```

## After Publishing

### Update Documentation

- [ ] Update README with npm install command
- [ ] Update docs with published version
- [ ] Announce on social media / GitHub discussions

### Monitor

- [ ] Check npm downloads
- [ ] Monitor GitHub issues for bugs
- [ ] Respond to user feedback

### Next Release

- [ ] Plan Phase 2 features
- [ ] Gather community feedback
- [ ] Start development on next version

## Troubleshooting

### "npm ERR! 403 Forbidden"

You don't have publish access. Ask maintainer to add you:

```bash
npm owner add <username> 0authkit
```

### "npm ERR! 409 Conflict"

Version already exists. Bump version in `package.json`.

### "npm ERR! 400 Bad Request"

Package name might be taken or invalid. Check npm registry:

```bash
npm view 0authkit
```

### Build fails before publish

`prepublishOnly` script runs tests and build. Fix errors:

```bash
npm test
npm run build
```

## Support

Questions about publishing? Check:

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm CLI Docs](https://docs.npmjs.com/cli/publish)
- GitHub Issues

---

**Ready to publish?** Follow the steps above and you're good to go! 🚀
