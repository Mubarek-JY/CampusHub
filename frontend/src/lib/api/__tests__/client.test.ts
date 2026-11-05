import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetApiClientForTests, apiRequest } from '../client';
import { getRefreshToken, setAccessToken, setRefreshToken } from '../tokenStore';

describe('API refresh coordination', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); __resetApiClientForTests(); });

  it('shares one in-flight refresh across concurrent 401 responses and stores the rotated token', async () => {
    setAccessToken('expired-access');
    setRefreshToken('old-refresh');
    let refreshCalls = 0;
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/auth/refresh')) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 15));
        return new Response(JSON.stringify({ accessToken: 'fresh-access', refreshToken: 'fresh-refresh' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const headers = new Headers(init?.headers);
      if (url.endsWith('/api/protected-b') && headers.get('Authorization') === 'Bearer expired-access') {
        // Simulate a slower request whose 401 arrives after the first refresh has completed.
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      if (headers.get('Authorization') === 'Bearer fresh-access') {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', mockFetch);

    const [first, second] = await Promise.all([
      apiRequest<{ ok: boolean }>('/api/protected-a'),
      apiRequest<{ ok: boolean }>('/api/protected-b'),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(getRefreshToken()).toBe('fresh-refresh');
    expect(mockFetch).toHaveBeenCalledTimes(5); // two originals, one refresh, two retries
  });
});
