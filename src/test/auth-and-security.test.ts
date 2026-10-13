import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSessionToken,
  handleApiRequest,
  resetLoginRateLimiter,
  verifySessionToken,
  type Env,
} from '../../functions/api/[[route]]';

const testEnv: Env = {
  SHU_PASSWORD: 'test-shu-secret-password',
  SHU_SESSION_SECRET:
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  SHU_PASSWORD_HINT: 'Test clue for Shu',
};

describe('Server-Side Authentication & Protected Resource Security', () => {
  beforeEach(() => {
    resetLoginRateLimiter();
  });

  it('denies unauthenticated access to /api/content, all private photos, portraits, video, and audio (including Range requests)', async () => {
    const contentRes = await handleApiRequest(
      new Request('http://localhost/api/content'),
      testEnv,
    );
    expect(contentRes.status).toBe(401);
    expect(contentRes.headers.get('X-Frame-Options')).toBe('DENY');
    expect(contentRes.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(contentRes.headers.get('X-Content-Type-Options')).toBe('nosniff');

    for (const stem of [
      'memory-01',
      'memory-02',
      'memory-03',
      'memory-04',
      'memory-05',
      'memory-06',
      'portrait-01',
      'film-01',
      'final-photo',
    ]) {
      const photoRes = await handleApiRequest(
        new Request(`http://localhost/api/media/photos/${stem}`),
        testEnv,
      );
      expect(photoRes.status).toBe(401);
    }

    const videoRes = await handleApiRequest(
      new Request('http://localhost/api/media/video/film-01'),
      testEnv,
    );
    expect(videoRes.status).toBe(401);

    const audioRes = await handleApiRequest(
      new Request('http://localhost/api/media/audio/our-song'),
      testEnv,
    );
    expect(audioRes.status).toBe(401);

    const audioRangeUnauth = await handleApiRequest(
      new Request('http://localhost/api/media/audio/our-song', {
        headers: { Range: 'bytes=0-63' },
      }),
      testEnv,
    );
    expect(audioRangeUnauth.status).toBe(401);
  });

  it('rejects incorrect passwords with 401 and enforces per-IP brute-force rate limiting (429)', async () => {
    for (let i = 0; i < 10; i++) {
      const loginRes = await handleApiRequest(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '203.0.113.42',
          },
          body: JSON.stringify({ password: `wrong-password-${i}` }),
        }),
        testEnv,
      );
      expect(loginRes.status).toBe(401);
      expect(loginRes.headers.get('Set-Cookie')).toBeNull();
    }

    // 11th rapid attempt from same IP is rate-limited with 429 Too Many Requests
    const rateLimitedRes = await handleApiRequest(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '203.0.113.42',
        },
        body: JSON.stringify({ password: 'test-shu-secret-password' }),
      }),
      testEnv,
    );
    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.headers.get('Retry-After')).toBe('60');
  });

  it('redacts SHU_PASSWORD_HINT if it accidentally contains SHU_PASSWORD', async () => {
    const leakyEnv: Env = {
      ...testEnv,
      SHU_PASSWORD_HINT: 'The password is test-shu-secret-password!',
    };
    const sessionRes = await handleApiRequest(
      new Request('http://localhost/api/auth/session'),
      leakyEnv,
    );
    const body = (await sessionRes.json()) as { passwordHint: string };
    expect(body.passwordHint).not.toContain('test-shu-secret-password');
    expect(body.passwordHint).toBe(
      'A personal phrase Atharva chose just for Shu',
    );
  });

  it('issues an HttpOnly signed session cookie on valid password and grants access to all protected photo, portrait, video, and audio slots', async () => {
    const loginRes = await handleApiRequest(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-shu-secret-password' }),
      }),
      testEnv,
    );

    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/');

    const cookiePair = setCookie!.split(';')[0];

    // Verify protected content is accessible with valid cookie
    const contentRes = await handleApiRequest(
      new Request('http://localhost/api/content', {
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(contentRes.status).toBe(200);
    const contentData = (await contentRes.json()) as {
      meta: { recipientNickname: string };
    };
    expect(contentData.meta.recipientNickname).toBe('Shu');

    // Verify all 9 protected photo & portrait stems are served with valid cookie
    for (const stem of [
      'memory-01',
      'memory-02',
      'memory-03',
      'memory-04',
      'memory-05',
      'memory-06',
      'portrait-01',
      'film-01',
      'final-photo',
    ]) {
      const photoRes = await handleApiRequest(
        new Request(`http://localhost/api/media/photos/${stem}`, {
          headers: { Cookie: cookiePair },
        }),
        testEnv,
      );
      expect(photoRes.status).toBe(200);
      expect(photoRes.headers.get('Content-Type')).toContain('image/svg+xml');
    }

    // Verify protected video endpoint resolves film-01
    const videoRes = await handleApiRequest(
      new Request('http://localhost/api/media/video/film-01', {
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(videoRes.status).toBe(200);

    // Verify protected audio supports HTTP Range requests when authenticated
    const audioRangeRes = await handleApiRequest(
      new Request('http://localhost/api/media/audio/our-song', {
        headers: {
          Cookie: cookiePair,
          Range: 'bytes=0-63',
        },
      }),
      testEnv,
    );
    expect(audioRangeRes.status).toBe(206);
    expect(audioRangeRes.headers.get('Content-Range')).toMatch(
      /^bytes 0-63\/\d+$/,
    );
  });

  it('rejects forged, modified, expired, and malformed session cookies', async () => {
    const tamperedCookie =
      'shu_session=shu-authenticated.9999999999.deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd';
    const res = await handleApiRequest(
      new Request('http://localhost/api/content', {
        headers: { Cookie: tamperedCookie },
      }),
      testEnv,
    );
    expect(res.status).toBe(401);

    // Create a genuinely signed token from 8 days ago (expired beyond 7-day TTL)
    const eightDaysAgoMs = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const expiredToken = await createSessionToken(
      testEnv.SHU_SESSION_SECRET!,
      eightDaysAgoMs,
    );
    expect(
      await verifySessionToken(expiredToken, testEnv.SHU_SESSION_SECRET),
    ).toBe(false);

    const expiredRes = await handleApiRequest(
      new Request('http://localhost/api/content', {
        headers: { Cookie: `shu_session=${encodeURIComponent(expiredToken)}` },
      }),
      testEnv,
    );
    expect(expiredRes.status).toBe(401);

    // Malformed percent-encoded cookie should not throw 500
    const malformedCookieRes = await handleApiRequest(
      new Request('http://localhost/api/content', {
        headers: { Cookie: 'shu_session=%E0%A4%A' },
      }),
      testEnv,
    );
    expect(malformedCookieRes.status).toBe(401);
  });

  it('handles missing assets, blocks path traversal/malformed paths/prototype keys, and clears session on logout', async () => {
    const loginRes = await handleApiRequest(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-shu-secret-password' }),
      }),
      testEnv,
    );
    const cookiePair = loginRes.headers.get('Set-Cookie')!.split(';')[0];

    // Missing audio & video
    const missingAudioRes = await handleApiRequest(
      new Request('http://localhost/api/media/audio/missing-song', {
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(missingAudioRes.status).toBe(404);

    const missingVideoRes = await handleApiRequest(
      new Request('http://localhost/api/media/video/missing-video', {
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(missingVideoRes.status).toBe(404);

    // Path traversal & malformed URI encodings
    for (const badPath of [
      '/api/media/photos/..%2Fshu-content',
      '/api/media/photos/..%5Cshu-content',
      '/api/media/photos/%E0%A4%A',
      '/api/media/audio/..%2Fshu-content',
      '/api/media/audio/%E0%A4%A',
      '/api/media/video/..%2Fshu-content',
    ]) {
      const badRes = await handleApiRequest(
        new Request(`http://localhost${badPath}`, {
          headers: { Cookie: cookiePair },
        }),
        testEnv,
      );
      expect(badRes.status).toBe(400);
    }

    // Prototype property names must return 404, not 200 or 500
    for (const protoKey of ['constructor', 'toString', '__proto__', 'valueOf']) {
      const protoPhotoRes = await handleApiRequest(
        new Request(`http://localhost/api/media/photos/${protoKey}`, {
          headers: { Cookie: cookiePair },
        }),
        testEnv,
      );
      expect(protoPhotoRes.status).toBe(404);

      const protoAudioRes = await handleApiRequest(
        new Request(`http://localhost/api/media/audio/${protoKey}`, {
          headers: { Cookie: cookiePair },
        }),
        testEnv,
      );
      expect(protoAudioRes.status).toBe(404);
    }

    // Unknown API route
    const unknownRes = await handleApiRequest(
      new Request('http://localhost/api/unknown-endpoint', {
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(unknownRes.status).toBe(404);

    // Logout clears session
    const logoutRes = await handleApiRequest(
      new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: cookiePair },
      }),
      testEnv,
    );
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('verifies dist/ static build output contains zero private photos, audio, personal letter text, or secrets', () => {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) return;

    const allFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else allFiles.push(full);
      }
    };
    walk(distDir);

    // Ensure no private photo or audio files exist in dist/
    const relNames = allFiles.map((f) => path.relative(distDir, f));
    for (const rel of relNames) {
      expect(rel).not.toMatch(/memory-0[1-6]/i);
      expect(rel).not.toMatch(/portrait-01/i);
      expect(rel).not.toMatch(/film-01/i);
      expect(rel).not.toMatch(/final-photo/i);
      expect(rel).not.toMatch(/our-song/i);
    }

    // Ensure JS/CSS/HTML bundles do not contain private letter copy or secrets
    for (const file of allFiles) {
      if (/\.(js|css|html|svg)$/i.test(file)) {
        const content = fs.readFileSync(file, 'utf8');
        expect(content).not.toContain('PLACEHOLDER LETTER PARAGRAPH 1');
        expect(content).not.toContain('Placeholder Back-of-Photo Story 01');
        expect(content).not.toContain('test-shu-secret-password');
      }
    }
  });
});
