import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let fetchImpl;
function loadModule(path, require) {
  const module = { exports: {} };
  const source = readFileSync(resolve(root, path), 'utf8')
    .replaceAll('import.meta.env.PUBLIC_GIANNA_API_BASE', '""');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require, URL, Error, TypeError,
    fetch: (...args) => fetchImpl(...args),
  }, { filename: path });
  return module.exports;
}
const presentation = loadModule('gianna-backend/frontend/src/presentation.ts');
const api = loadModule('src/lib/giannaApi.ts', name => {
  assert.equal(name, '../../gianna-backend/frontend/src/presentation');
  return presentation;
});
const controller = new AbortController();
assert.equal(api.giannaApiUrl('/api/ready'), '/api/ready');
assert.equal(api.giannaApiUrl('/api/ready', 'https://api.turismo.example/'), 'https://api.turismo.example/api/ready');
assert.equal(api.giannaApiUrl('/api/turn-progress?session_id=test', 'https://api.turismo.example'), 'https://api.turismo.example/api/turn-progress?session_id=test');
for (const base of ['javascript:alert(1)', 'https://example.com/api', 'https://user:password@example.com', 'https://example.com/?token=x']) {
  assert.throws(() => api.giannaApiUrl('/api/ready', base));
}
const session = 'lavalleja-test-session';
const generation = 'lavalleja-test-generation';
const answer = overrides => ({
  generation_id: generation, state: 'ANSWERABLE', answer: 'Visitá Minas. [1]',
  evidence: [{ title: 'Guía de Lavalleja', source_refs: ['https://www.lavalleja.gub.uy/'] }],
  ...overrides,
});
const reply = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});
fetchImpl = async (url, options) => {
  assert.equal(url, '/api/ask-text');
  assert.equal(options.method, 'POST');
  assert.equal(options.signal, controller.signal);
  assert.equal(options.headers['Content-Type'], 'application/json');
  const body = JSON.parse(options.body);
  assert.equal(body.question.length, 4000, 'The full API message limit must be preserved');
  assert.equal(body.session_id, session);
  assert.equal(body.conversation_id, session);
  assert.equal(body.generation_id, generation);
  assert.equal(body.turn_id, generation);
  assert.equal(body.source, 'human');
  return reply(answer());
};
const result = await api.askGianna('a'.repeat(4000), session, generation, controller.signal);
assert.equal(result.answer, 'Visitá Minas.');
assert.equal(result.sources.length, 1);
assert.equal(api.sourceUrl(result.sources[0]), 'https://www.lavalleja.gub.uy/');
assert.equal(api.sourceUrl({ title: 'Unsafe', url: 'javascript:alert(1)' }), undefined);
assert.equal(api.sourceUrl({ title: 'Unsafe', url: '//example.com' }), undefined);
assert.equal(api.sourceUrl({ title: 'Guide', source_refs: [123] }), undefined);

for (const data of [
  answer({ answer: '' }), answer({ answer: '[1]' }), answer({ answer: null }),
  answer({ generation_id: 'stale-turn' }),
  answer({ evidence: [{ title: 123 }] }), answer({ evidence: [{ title: 'Invalid', source_refs: [{}] }] }),
]) {
  fetchImpl = async () => reply(data);
  await assert.rejects(api.askGianna('Minas', session, generation, controller.signal), /INVALID_RESPONSE/);
}
fetchImpl = async () => reply(answer({ state: 'INTERRUPTED' }));
await assert.rejects(api.askGianna('Minas', session, generation, controller.signal), /INTERRUPTED/);
fetchImpl = async () => reply(answer({ state: 'ASKING_WEB_PERMISSION', answer: null }));
assert.equal((await api.askGianna('Minas', session, generation, controller.signal)).needsWebPermission, true);
fetchImpl = async () => reply(answer({ evidence: [], searched_sources: [{ title: 'Web', url: 'https://example.org/' }] }));
assert.equal((await api.askGianna('Minas', session, generation, controller.signal)).sources[0].title, 'Web');
for (const [response, code] of [
  [new Response('<h1>Unavailable</h1>', { status: 502 }), 'BACKEND_UNAVAILABLE'],
  [new Response('Slow down', { status: 429 }), 'RATE_LIMITED'],
  [reply({ error_code: 'LLM_UNAVAILABLE' }, 503), 'LLM_UNAVAILABLE'],
]) {
  fetchImpl = async () => response;
  await assert.rejects(api.askGianna('Minas', session, generation, controller.signal), new RegExp(code));
}
fetchImpl = async () => { throw new TypeError('Network failed'); };
await assert.rejects(api.askGianna('Minas', session, generation, controller.signal), /Network failed/);
assert.match(api.giannaError(new Error('RATE_LIMITED')), /un minuto/);
assert.match(api.giannaError(new Error(), true), /demoró/);
const bundle = readFileSync(resolve(root, 'public/scripts/tourism.js'), 'utf8');
assert.match(bundle, /new CustomEvent\("gianna:open"/);
assert.doesNotMatch(bundle, /vr\.send|vr\.simulateVoice|respuestas preparadas|var cr=class/);
const ui = readFileSync(resolve(root, 'src/islands/GiannaChat.tsx'), 'utf8');
assert.match(ui, /maxLength=\{4000\}/);
assert.doesNotMatch(ui, /voice-demo|data-open-gianna|data-question/);
console.log('Gianna: payload, 4000 characters, sources, stale/invalid responses, consent, rate limits, network errors and mock removal verified.');

if (process.argv.includes('--live')) {
  const base = process.env.GIANNA_SITE_URL || 'http://localhost:4321';
  const request = (path, options) => fetch(new URL(path, base), {
    ...options, signal: AbortSignal.timeout(120000),
  });
  const readiness = await request('/api/ready');
  assert.equal(readiness.status, 200);
  assert.equal((await readiness.json()).status, 'ready');
  const liveSession = crypto.randomUUID();
  const ask = async question => {
    const generationId = crypto.randomUUID();
    const response = await request('/api/ask-text', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: liveSession, generation_id: generationId, source: 'human' }),
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.generation_id, generationId);
    assert.equal(data.state, 'ANSWERABLE');
    assert.ok(data.answer?.length > 30);
    return data;
  };
  const tourism = await ask('¿Qué puedo visitar en Minas en un día?');
  assert.equal(tourism.route, 'HYBRID_RERANK');
  assert.ok(tourism.evidence.length > 0, 'Real tourism answers need evidence');
  const memory = await ask('Repetí lo que me dijiste antes.');
  assert.equal(memory.route, 'CONTEXT_RECAP');
  assert.match(memory.answer, /Minas/i);
  const invalid = await request('/api/ask-text', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'a'.repeat(4001) }),
  });
  assert.equal(invalid.status, 400);
  console.log(`Gianna live: readiness, real RAG evidence, conversation memory and length validation verified at ${base}.`);
}
