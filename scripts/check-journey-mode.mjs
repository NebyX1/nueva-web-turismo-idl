import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const module = { exports: {} };
const source = readFileSync(resolve(root, 'src/lib/journeyModeTransition.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(compiled, { module, exports: module.exports, setTimeout, clearTimeout }, { filename: 'journeyModeTransition.ts' });
const { createJourneyModeTransition, CURTAIN_TIMINGS: normal, REDUCED_CURTAIN_TIMINGS: reduced } = module.exports;

function clock() {
  let now = 0, id = 0;
  const tasks = new Map();
  return {
    get now() { return now; },
    get pending() { return tasks.size; },
    setTimeout(callback, delay) { const handle = ++id; tasks.set(handle, { callback, at: now + delay }); return handle; },
    clearTimeout(handle) { tasks.delete(handle); },
    advance(duration) {
      const end = now + duration;
      for (;;) {
        const next = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        const [handle, task] = next; tasks.delete(handle); now = task.at; task.callback();
      }
      now = end;
    },
  };
}
function harness(extra = {}) {
  const scheduler = clock(), events = [], applied = [], errors = [];
  let settled = 0;
  const controller = createJourneyModeTransition({
    scheduler,
    onStage: (stage, mode) => events.push([stage, mode, scheduler.now]),
    applyMode: mode => { applied.push(mode); events.push(['apply', mode, scheduler.now]); },
    onSettled: () => settled++, onError: error => errors.push(error), ...extra,
  });
  return { scheduler, events, applied, errors, controller, get settled() { return settled; } };
}
const normalTotal = normal.close + normal.hold + normal.open;

// Scene changes under the closed curtain, once, and only after closing ends.
{
  const h = harness(), c = h.controller;
  assert.equal(c.start('night'), true); assert.equal(c.busy, true);
  assert.equal(c.start('day'), false, 'A rapid second click must not queue a different mode');
  h.scheduler.advance(normal.close - 1); assert.equal(h.applied.length, 0);
  h.scheduler.advance(1); assert.deepEqual(h.applied, ['night']);
  assert.deepEqual(h.events.slice(-2).map(event => event[0]), ['presenting', 'apply']);
  assert.equal(c.busy, true);
  h.scheduler.advance(normal.hold); assert.equal(h.events.at(-1)[0], 'opening');
  h.scheduler.advance(normal.open - 1); assert.equal(c.busy, true);
  h.scheduler.advance(1); assert.equal(c.busy, false); assert.equal(h.settled, 1); assert.equal(h.events.at(-1)[0], 'idle');
  assert.equal(h.scheduler.pending, 0);
  assert.equal(c.start('day'), true); h.scheduler.advance(normalTotal);
  assert.deepEqual(h.applied, ['night', 'day']); assert.equal(h.settled, 2);
  console.log('Telón: cierre antes de aplicar, apertura completa, doble clic bloqueado y retorno a día válidos');
}

// Cancelling at any visible stage prevents late state changes after unmount.
for (const at of [0, normal.close + 1, normal.close + normal.hold + 1]) {
  const h = harness(); h.controller.start('night'); h.scheduler.advance(at);
  const eventCount = h.events.length, applyCount = h.applied.length;
  h.controller.dispose(); h.controller.dispose();
  assert.equal(h.controller.busy, false); assert.equal(h.scheduler.pending, 0);
  h.scheduler.advance(normalTotal * 2);
  assert.equal(h.events.length, eventCount); assert.equal(h.applied.length, applyCount); assert.equal(h.settled, 0);
  assert.equal(h.controller.start('day'), false);
}
console.log('Telón: desmontaje durante cierre, presentación y apertura limpia todos los temporizadores');

// Reduced motion follows the same contract with the short fade timings.
{
  const h = harness(); h.controller.start('night', true);
  h.scheduler.advance(reduced.close - 1); assert.equal(h.applied.length, 0);
  h.scheduler.advance(1); assert.deepEqual(h.applied, ['night']);
  h.scheduler.advance(reduced.hold + reduced.open);
  assert.equal(h.controller.busy, false); assert.equal(h.settled, 1);
  assert.equal(h.scheduler.now, 420);
  assert.equal(h.scheduler.pending, 0);
  console.log('Telón: movimiento reducido completa su transición breve de 420 ms');
}

// Render failures release the overlay and pause guard, then permit another try.
{
  const failure = new Error('Simulated rendering failure');
  let shouldFail = true;
  const h = harness({ applyMode() { if (shouldFail) throw failure; } });
  h.controller.start('night'); h.scheduler.advance(normal.close);
  assert.equal(h.controller.busy, false); assert.equal(h.scheduler.pending, 0);
  assert.equal(h.events.at(-1)[0], 'idle'); assert.equal(h.errors[0], failure); assert.equal(h.settled, 1);
  shouldFail = false; assert.equal(h.controller.start('day'), true); h.scheduler.advance(normalTotal);
  assert.equal(h.controller.busy, false); assert.equal(h.settled, 2);
  console.log('Telón: un fallo de render libera la pantalla y permite cambiar de modo de nuevo');
}

// Disposal from a stage listener must not apply a mode after the owner vanishes.
{
  const scheduler = clock(); let applied = false, controller;
  controller = createJourneyModeTransition({ scheduler, onStage(stage) { if (stage === 'presenting') controller.dispose(); }, applyMode() { applied = true; } });
  controller.start('night'); scheduler.advance(normalTotal);
  assert.equal(applied, false); assert.equal(controller.busy, false); assert.equal(scheduler.pending, 0);
}
console.log('Transiciones día/noche verificadas sin temporizadores reales ni esperas.');
