import assert from 'node:assert/strict';

const web = process.env.GIANNA_WEB_URL;
const api = process.env.GIANNA_SITE_URL;
const origin = process.env.GIANNA_CORS_ORIGIN;
if (!web || !api || !origin) {
  throw new Error('Set GIANNA_WEB_URL, GIANNA_SITE_URL and GIANNA_CORS_ORIGIN to the deployed web, API and allowed frontend origin.');
}
const request = (base, path, options = {}) => fetch(new URL(path, base), {
  ...options, signal: AbortSignal.timeout(15000),
});
const webHealth = await request(web, '/health');
assert.equal(webHealth.status, 200, 'Frontend health');
assert.equal((await webHealth.json()).status, 'ok');
const homepage = await request(web, '/');
assert.equal(homepage.status, 200);
const html = await homepage.text();
assert.match(html, /GiannaChat/);
const asset = html.match(/component-url="([^"]*GiannaChat[^"]*\.js)"/)?.[1];
assert.ok(asset, 'The compiled chat island must be served');
const chat = await request(web, asset);
assert.equal(chat.status, 200);
const code = await chat.text();
if (process.env.GIANNA_EXPECT_PUBLIC_API === 'true') {
  assert.ok(code.includes(new URL(api).origin), 'The build must embed the configured public API origin');
}
const ready = await request(api, '/api/ready', { headers: { Origin: origin } });
assert.equal(ready.status, 200, 'Backend readiness');
assert.equal((await ready.json()).status, 'ready');
assert.equal(ready.headers.get('access-control-allow-origin'), origin);
assert.equal(ready.headers.get('access-control-allow-credentials'), null);
const preflight = await request(api, '/api/ask-text', {
  method: 'OPTIONS',
  headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
});
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST');
const forbidden = await request(api, '/api/ready', { headers: { Origin: 'https://untrusted.invalid' } });
assert.equal(forbidden.status, 403);
assert.equal(forbidden.headers.get('access-control-allow-origin'), null);
for (const path of ['/api/diagnostics', '/api/debug/last-turn', '/api/web/search']) {
  assert.equal((await request(api, path)).status, 404, `${path} must not be exposed in production`);
}
const generation = crypto.randomUUID();
const answer = await request(api, '/api/ask-text', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'Hola', session_id: crypto.randomUUID(), generation_id: generation, source: 'human' }),
});
assert.equal(answer.status, 200);
assert.equal(answer.headers.get('access-control-allow-origin'), origin);
const data = await answer.json();
assert.equal(data.generation_id, generation);
assert.equal(data.state, 'ANSWERABLE');
assert.ok(data.answer.length > 5);
console.log('Coolify: compiled web, health checks, allowed/denied CORS, preflight, private route isolation and public chat verified.');
