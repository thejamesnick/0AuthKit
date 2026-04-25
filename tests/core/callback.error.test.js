import { describe, expect, it, vi, afterEach } from 'vitest';
import { handleCallback } from '../../src/core/callback.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
function textResponse(text, status) {
    return new Response(text, { status });
}
// ---------------------------------------------------------------------------
// Malformed responses
// ---------------------------------------------------------------------------
describe('handleCallback — malformed responses', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('throws when token response is not valid JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('not json', 200)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow();
    });
    it('throws when profile response is not valid JSON', async () => {
        const tokenResp = jsonResponse({ access_token: 'token', token_type: 'bearer' });
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(tokenResp)
            .mockResolvedValueOnce(textResponse('not json', 200)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow();
    });
    it('handles missing access_token in token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ token_type: 'Bearer' })));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow();
    });
    it('handles empty token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({})));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow();
    });
});
// ---------------------------------------------------------------------------
// HTTP error responses
// ---------------------------------------------------------------------------
describe('handleCallback — HTTP errors', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('throws on 400 token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('invalid_grant', 400)));
        await expect(handleCallback({
            provider: 'github',
            code: 'bad-code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Token exchange failed (400)');
    });
    it('throws on 401 token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('Unauthorized', 401)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'bad-id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Token exchange failed (401)');
    });
    it('throws on 403 token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('Forbidden', 403)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Token exchange failed (403)');
    });
    it('throws on 500 token response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(textResponse('Internal Server Error', 500)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Token exchange failed (500)');
    });
    it('throws on 401 profile response', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(textResponse('Unauthorized', 401)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Profile fetch failed (401)');
    });
    it('throws on 403 profile response', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(textResponse('Forbidden', 403)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Profile fetch failed (403)');
    });
    it('throws on 500 profile response', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(textResponse('Internal Server Error', 500)));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Profile fetch failed (500)');
    });
});
// ---------------------------------------------------------------------------
// Edge case tokens
// ---------------------------------------------------------------------------
describe('handleCallback — edge case tokens', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('handles missing expires_in', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({
            access_token: 'token',
            token_type: 'Bearer',
        }))
            .mockResolvedValueOnce(jsonResponse({
            sub: 'user-id',
            email: 'user@example.com',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'google',
            code: 'code',
            codeVerifier: 'verifier',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.tokens.accessToken).toBe('token');
        expect(result.tokens.expiresIn).toBeUndefined();
    });
    it('handles missing refreshToken', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({
            access_token: 'token',
            token_type: 'Bearer',
            expires_in: 3600,
        }))
            .mockResolvedValueOnce(jsonResponse({
            sub: 'user-id',
            email: 'user@example.com',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'google',
            code: 'code',
            codeVerifier: 'verifier',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.tokens.refreshToken).toBeUndefined();
    });
    it('handles lowercase token_type', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({
            access_token: 'token',
            token_type: 'bearer',
        }))
            .mockResolvedValueOnce(jsonResponse({
            id: 123,
            login: 'user',
            email: 'user@example.com',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.tokens.tokenType).toBe('bearer');
    });
    it('handles uppercase token_type', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({
            access_token: 'token',
            token_type: 'BEARER',
        }))
            .mockResolvedValueOnce(jsonResponse({
            sub: 'user-id',
            email: 'user@example.com',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'google',
            code: 'code',
            codeVerifier: 'verifier',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.tokens.tokenType).toBe('BEARER');
    });
});
// ---------------------------------------------------------------------------
// Edge case profiles
// ---------------------------------------------------------------------------
describe('handleCallback — edge case profiles', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('handles missing email in profile', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(jsonResponse({
            id: 123,
            login: 'user',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.profile.email).toBe('');
    });
    it('handles null email in profile', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(jsonResponse({
            id: 123,
            login: 'user',
            email: null,
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.profile.email).toBe('');
    });
    it('handles missing name in profile', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(jsonResponse({
            id: 123,
            login: 'user',
            email: 'user@example.com',
        })));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.profile.name).toBe('user');
    });
    it('handles missing avatar in profile', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(jsonResponse({
            id: 123,
            login: 'user',
            email: 'user@example.com',
            name: 'User',
        })));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.profile.avatar).toBeNull();
    });
    it('handles empty profile response', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockResolvedValueOnce(jsonResponse({})));
        const result = await handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        });
        expect(result.profile.id).toBe('');
        expect(result.profile.email).toBe('');
        expect(result.profile.name).toBe('');
        expect(result.profile.avatar).toBeNull();
    });
});
// ---------------------------------------------------------------------------
// Network failures
// ---------------------------------------------------------------------------
describe('handleCallback — network failures', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('throws when fetch fails on token exchange', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Network error');
    });
    it('throws when fetch fails on profile fetch', async () => {
        vi.stubGlobal('fetch', vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: 'token', token_type: 'bearer' }))
            .mockRejectedValueOnce(new Error('Network error')));
        await expect(handleCallback({
            provider: 'github',
            code: 'code',
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://example.com/callback',
        })).rejects.toThrow('Network error');
    });
});
//# sourceMappingURL=callback.error.test.js.map