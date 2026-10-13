import { shuContent } from '../../private-content/shu-content';
import {
  PACKED_AUDIO_BY_FILENAME,
  PACKED_AUDIO_BY_STEM,
  PACKED_PHOTOS_BY_FILENAME,
  PACKED_PHOTOS_BY_STEM,
  PACKED_VIDEO_BY_FILENAME,
  PACKED_VIDEO_BY_STEM,
  type PackedAsset,
} from '../_generated/private-bundle';

export interface Env {
  SHU_PASSWORD?: string;
  SHU_SESSION_SECRET?: string;
  SHU_PASSWORD_HINT?: string;
}

const SESSION_COOKIE_NAME = 'shu_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Sliding-window brute-force protection for POST /api/auth/login
const LOGIN_RATE_WINDOW_MS = 60_000;
const MAX_LOGIN_ATTEMPTS_PER_WINDOW = 10;
const loginAttemptsByClient = new Map<string, number[]>();

export function resetLoginRateLimiter(): void {
  loginAttemptsByClient.clear();
}

function getClientKey(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'local-client'
  );
}

function isRateLimited(clientKey: string, nowMs = Date.now()): boolean {
  const history = loginAttemptsByClient.get(clientKey) || [];
  const active = history.filter((ts) => nowMs - ts < LOGIN_RATE_WINDOW_MS);
  if (active.length >= MAX_LOGIN_ATTEMPTS_PER_WINDOW) {
    loginAttemptsByClient.set(clientKey, active);
    return true;
  }
  return false;
}

function recordFailedLoginAttempt(clientKey: string, nowMs = Date.now()): void {
  const history = loginAttemptsByClient.get(clientKey) || [];
  const active = history.filter((ts) => nowMs - ts < LOGIN_RATE_WINDOW_MS);
  active.push(nowMs);
  loginAttemptsByClient.set(clientKey, active);
}

const textEncoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(message),
  );
  return toHex(sig);
}

/**
 * Constant-time string comparison via HMAC digests to prevent timing attacks.
 */
async function safeVerifyPassword(
  candidate: string,
  expected: string,
  secret: string,
): Promise<boolean> {
  const [hashA, hashB] = await Promise.all([
    hmacSha256Hex(secret, `pwd:${candidate}`),
    hmacSha256Hex(secret, `pwd:${expected}`),
  ]);
  if (hashA.length !== hashB.length) return false;
  let diff = 0;
  for (let i = 0; i < hashA.length; i++) {
    diff |= hashA.charCodeAt(i) ^ hashB.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(
  secret: string,
  nowMs = Date.now(),
): Promise<string> {
  const exp = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  const payload = `shu-authenticated.${exp}`;
  const signature = await hmacSha256Hex(secret, payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token || !secret || secret.length < 16) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [prefix, expStr, providedSig] = parts;
  if (prefix !== 'shu-authenticated') return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(nowMs / 1000)) {
    return false;
  }
  const expectedSig = await hmacSha256Hex(secret, `${prefix}.${expStr}`);
  if (expectedSig.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}

function safeDecodeURIComponent(val: string): string | null {
  try {
    return decodeURIComponent(val);
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    const decoded = safeDecodeURIComponent(v);
    if (decoded !== null) {
      out[k] = decoded;
    }
  }
  return out;
}

function decodeBase64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

function servePackedAsset(
  request: Request,
  asset: PackedAsset | undefined,
): Response {
  if (!asset) {
    return jsonResponse(
      {
        error: 'Private asset not found',
        missingAsset: true,
      },
      404,
    );
  }

  const bytes = decodeBase64ToUint8Array(asset.base64);
  const total = bytes.byteLength;
  const rangeHeader =
    request.headers.get('Range') || request.headers.get('range');

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    let start = startStr ? parseInt(startStr, 10) : 0;
    let end = endStr ? parseInt(endStr, 10) : total - 1;
    if (Number.isNaN(start) || start < 0) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;

    if (start <= end && start < total) {
      const sliced = bytes.slice(start, end + 1);
      return new Response(sliced, {
        status: 206,
        headers: {
          'Content-Type': asset.mimeType,
          'Content-Length': String(sliced.byteLength),
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          ...SECURITY_HEADERS,
        },
      });
    }
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(total),
      'Accept-Ranges': 'bytes',
      ...SECURITY_HEADERS,
    },
  });
}

const SAFE_ASSET_KEY_REGEX = /^[a-zA-Z0-9._-]+$/;

function sanitizePasswordHint(
  rawHint: string | undefined,
  configuredPassword: string | undefined,
): string {
  const fallback = 'A personal phrase Atharva chose just for Shu';
  const trimmed = rawHint?.trim();
  if (!trimmed) return fallback;
  if (
    configuredPassword &&
    configuredPassword.length > 0 &&
    trimmed.toLowerCase().includes(configuredPassword.toLowerCase())
  ) {
    return fallback;
  }
  return trimmed;
}

function lookupOwnAsset(
  map: Record<string, PackedAsset>,
  key: string,
): PackedAsset | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

export async function handleApiRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  const configuredPassword = env.SHU_PASSWORD?.trim();
  const sessionSecret = env.SHU_SESSION_SECRET?.trim();
  const passwordHint = sanitizePasswordHint(
    env.SHU_PASSWORD_HINT,
    configuredPassword,
  );

  // Ensure server secrets are configured
  const isConfigured = Boolean(
    configuredPassword &&
      configuredPassword.length > 0 &&
      sessionSecret &&
      sessionSecret.length >= 16,
  );

  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  const isAuthenticated = isConfigured
    ? await verifySessionToken(sessionCookie, sessionSecret)
    : false;

  // 1. GET /api/auth/session
  if (pathname === '/api/auth/session' && method === 'GET') {
    return jsonResponse({
      authenticated: isAuthenticated,
      configured: isConfigured,
      recipientNickname: 'Shu',
      recipientName: 'Yashvi Pokar',
      senderName: 'Atharva Patil',
      passwordHint,
    });
  }

  // 2. POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    if (!isConfigured || !configuredPassword || !sessionSecret) {
      return jsonResponse(
        {
          authenticated: false,
          error:
            'Server authentication environment variables (SHU_PASSWORD and SHU_SESSION_SECRET) are not configured yet.',
        },
        503,
      );
    }

    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return jsonResponse(
        {
          authenticated: false,
          error:
            'Too many password attempts right now. Please wait a minute and try again gently.',
        },
        429,
        {
          'Retry-After': '60',
        },
      );
    }

    let body: { password?: string } = {};
    try {
      body = (await request.json()) as { password?: string };
    } catch {
      return jsonResponse(
        { authenticated: false, error: 'Please enter the password.' },
        400,
      );
    }

    const inputPassword = (body.password ?? '').trim();
    if (!inputPassword) {
      return jsonResponse(
        {
          authenticated: false,
          error: 'Write the secret word on the seal first, Shu.',
        },
        400,
      );
    }

    const valid = await safeVerifyPassword(
      inputPassword,
      configuredPassword,
      sessionSecret,
    );

    if (!valid) {
      recordFailedLoginAttempt(clientKey);
      return jsonResponse(
        {
          authenticated: false,
          error:
            'That wasn’t quite the secret phrase, Shu. Take your time and try again.',
          passwordHint,
        },
        401,
      );
    }

    loginAttemptsByClient.delete(clientKey);
    const token = await createSessionToken(sessionSecret);
    const isSecure = url.protocol === 'https:';
    const cookieParts = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${SESSION_TTL_SECONDS}`,
    ];
    if (isSecure) {
      cookieParts.push('Secure');
    }

    return jsonResponse(
      {
        authenticated: true,
        message: 'Welcome inside, Shu.',
      },
      200,
      {
        'Set-Cookie': cookieParts.join('; '),
      },
    );
  }

  // 3. POST /api/auth/logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return jsonResponse(
      { authenticated: false },
      200,
      {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
      },
    );
  }

  // ============================================================================
  // ALL ROUTES BELOW REQUIRE AUTHENTICATION
  // ============================================================================
  if (!isAuthenticated) {
    return jsonResponse(
      {
        error:
          'Unauthorized: Please unlock the entrance with Shu’s password to access private memories and media.',
        authenticated: false,
      },
      401,
    );
  }

  // 4. GET /api/content — Protected personal narrative, memories metadata & letter
  if (pathname === '/api/content' && method === 'GET') {
    return jsonResponse(shuContent, 200);
  }

  // 5. GET /api/media/photos/:key — Protected private photographs & portraits
  if (pathname.startsWith('/api/media/photos/') && method === 'GET') {
    const rawKey = safeDecodeURIComponent(
      pathname.slice('/api/media/photos/'.length),
    );
    if (
      !rawKey ||
      rawKey.includes('..') ||
      !SAFE_ASSET_KEY_REGEX.test(rawKey)
    ) {
      return jsonResponse({ error: 'Invalid photo key' }, 400);
    }
    const asset =
      lookupOwnAsset(PACKED_PHOTOS_BY_FILENAME, rawKey) ??
      lookupOwnAsset(PACKED_PHOTOS_BY_STEM, rawKey);
    return servePackedAsset(request, asset);
  }

  // 6. GET /api/media/audio/:key — Protected private song audio
  if (pathname.startsWith('/api/media/audio/') && method === 'GET') {
    const rawKey = safeDecodeURIComponent(
      pathname.slice('/api/media/audio/'.length),
    );
    if (
      !rawKey ||
      rawKey.includes('..') ||
      !SAFE_ASSET_KEY_REGEX.test(rawKey)
    ) {
      return jsonResponse({ error: 'Invalid audio key' }, 400);
    }
    const asset =
      lookupOwnAsset(PACKED_AUDIO_BY_FILENAME, rawKey) ??
      lookupOwnAsset(PACKED_AUDIO_BY_STEM, rawKey);
    return servePackedAsset(request, asset);
  }

  // 7. GET /api/media/video/:key — Protected private video / motion keepsakes
  if (pathname.startsWith('/api/media/video/') && method === 'GET') {
    const rawKey = safeDecodeURIComponent(
      pathname.slice('/api/media/video/'.length),
    );
    if (
      !rawKey ||
      rawKey.includes('..') ||
      !SAFE_ASSET_KEY_REGEX.test(rawKey)
    ) {
      return jsonResponse({ error: 'Invalid video key' }, 400);
    }
    const asset =
      lookupOwnAsset(PACKED_VIDEO_BY_FILENAME, rawKey) ??
      lookupOwnAsset(PACKED_VIDEO_BY_STEM, rawKey) ??
      lookupOwnAsset(PACKED_PHOTOS_BY_STEM, rawKey);
    return servePackedAsset(request, asset);
  }

  return jsonResponse({ error: 'API route not found' }, 404);
}

// Cloudflare Pages Functions entrypoint
export const onRequest = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  return handleApiRequest(context.request, context.env);
};
