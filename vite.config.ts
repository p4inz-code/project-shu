import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest, type Env } from './functions/api/[[route]]';

function loadDevVars(): Env {
  const env: Env = {
    SHU_PASSWORD: process.env.SHU_PASSWORD,
    SHU_SESSION_SECRET: process.env.SHU_SESSION_SECRET,
    SHU_PASSWORD_HINT: process.env.SHU_PASSWORD_HINT,
  };

  const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const raw = fs.readFileSync(devVarsPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim() as keyof Env;
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!env[key]) {
        env[key] = val;
      }
    }
  }
  return env;
}

async function nodeToWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host || 'localhost:5173';
  const url = `http://${host}${req.url || '/'}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) {
      headers.set(k, v.join(', '));
    } else if (typeof v === 'string') {
      headers.set(k, v);
    }
  }

  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    return new Request(url, { method, headers });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const bodyBuffer = Buffer.concat(chunks);
  return new Request(url, {
    method,
    headers,
    body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
  });
}

async function sendWebResponse(res: ServerResponse, webRes: Response): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const arrayBuffer = await webRes.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}

function cloudflarePagesApiPlugin(): Plugin {
  const middleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const rawUrlPath = (req.url || '/').split('?')[0];
    let decodedPath = rawUrlPath;
    try {
      decodedPath = decodeURIComponent(rawUrlPath);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Malformed request URI.' }));
      return;
    }

    const normalizedPath = path.posix
      .normalize(decodedPath.replace(/\\/g, '/'))
      .toLowerCase();

    // Block direct filesystem access to private content, server functions, and config files
    if (
      normalizedPath.startsWith('/private-content') ||
      normalizedPath.startsWith('/functions') ||
      normalizedPath.startsWith('/scripts') ||
      normalizedPath.startsWith('/.dev.vars') ||
      normalizedPath.startsWith('/.git') ||
      normalizedPath === '/wrangler.toml' ||
      normalizedPath === '/vite.config.ts' ||
      normalizedPath === '/package.json'
    ) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: 'Direct access to private-content or server resources is forbidden.',
        }),
      );
      return;
    }

    if (rawUrlPath.startsWith('/api/')) {
      try {
        const env = loadDevVars();
        const webReq = await nodeToWebRequest(req);
        const webRes = await handleApiRequest(webReq, env);
        await sendWebResponse(res, webRes);
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: 'Internal server error',
          }),
        );
      }
      return;
    }

    next();
  };

  return {
    name: 'cloudflare-pages-api-adapter',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), cloudflarePagesApiPlugin()],
});
