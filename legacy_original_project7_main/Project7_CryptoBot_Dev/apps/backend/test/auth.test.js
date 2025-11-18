import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import ts from 'typescript';

const loadAuthPlugin = async () => {
  const sourceUrl = new URL('../src/routes/auth.ts', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
    },
    fileName: sourceUrl.pathname,
  });

  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const tempDir = await mkdtemp(path.join(testDir, '.tmp-auth-'));
  const compiledPath = path.join(tempDir, 'auth.js');
  await writeFile(compiledPath, outputText, 'utf8');

  try {
    const module = await import(pathToFileURL(compiledPath).href);
    return module.default;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const DEMO_PASSWORD = 'super-secret';

const buildApp = async () => {
  const authPlugin = await loadAuthPlugin();
  process.env.DEMO_PASSWORD = DEMO_PASSWORD;
  const app = Fastify();
  await app.register(jwt, { secret: 'test-secret' });
  await app.register(authPlugin, { prefix: '/auth' });
  await app.ready();
  return app;
};

test('POST /auth/login rejects missing credentials', async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
    delete process.env.DEMO_PASSWORD;
  });

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {},
  });

  assert.equal(response.statusCode, 400);
  assert.deepStrictEqual(response.json(), { error: 'Invalid credentials' });
});

test('POST /auth/login rejects incorrect password', async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
    delete process.env.DEMO_PASSWORD;
  });

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'user@example.com',
      password: 'not-secret',
    },
  });

  assert.equal(response.statusCode, 401);
  assert.deepStrictEqual(response.json(), { error: 'Unauthorized' });
});

test('POST /auth/login returns JWT for valid credentials', async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
    delete process.env.DEMO_PASSWORD;
  });

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'user@example.com',
      password: DEMO_PASSWORD,
    },
  });

  assert.equal(response.statusCode, 200);
  const payload = response.json();
  assert.ok(payload.access_token, 'expected access_token in response');

  const decoded = await app.jwt.verify(payload.access_token);
  assert.equal(decoded.sub, 'user@example.com');
  assert.equal(decoded.tenant, 'default');
  assert.deepEqual(decoded.roles, ['user']);
});
