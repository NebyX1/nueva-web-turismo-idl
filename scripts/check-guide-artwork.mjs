import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = new Map();
// Synthetic text metrics exercise every pagination branch; visual layout is
// checked separately in the browser using the real bundled fonts.
const measure = { font: '', measureText(text) { return { width: [...text].length * Number(this.font.match(/([\d.]+)px/)?.[1] || 30) * .55 }; } };
function load(relativePath) {
  const filename = resolve(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports,
    require(specifier) { return load(resolve(dirname(filename), specifier + '.ts')); },
    document: { createElement: () => ({ getContext: () => measure }) },
  }, { filename });
  return module.exports;
}
const { chapterDesign } = load('src/data/bookletDesign.ts');
const { guideChapters } = load('src/data/lavallejaGuide.ts');
const { paginateGuide, paintBookPage } = load('src/lib/guidebook.ts');
// This independent editorial specification catches incorrect changes to the
// artwork map, including two different equestrian monuments in Minas.
const destinations = {
  minas: ['minas'], 'cerro-artigas': ['artigas'], verdun: ['verdun'], arequita: ['arequita'],
  'villa-serrana': ['serrana'], penitente: ['penitente'], salus: ['salus'],
  'marco-de-los-reyes': ['marco'], 'aguas-blancas': ['aguas'], solis: ['solis'],
  mariscala: ['mariscala'], varela: ['varela'], batlle: ['batlle'], piraraja: ['piraraja'], zapican: ['zapican'],
  geoparque: ['arequita', 'salus', 'aguas'],
};
for (const chapter of guideChapters) {
  const design = chapterDesign(chapter);
  if (chapter.category === 'Destinos') {
    assert.ok(destinations[chapter.id], `Falta especificar el lugar: ${chapter.id}`);
    assert.ok(design.photos.length, `Destino sin ilustración propia: ${chapter.id}`);
    for (const plate of design.photos) assert.ok(destinations[chapter.id].includes(plate.place), `${chapter.id} muestra ${plate.place}`);
  }
  if (chapter.category === 'Planificá') assert.equal(design.photos.length, 0, `Relleno geográfico en ${chapter.id}`);
  for (const plate of design.photos) assert.ok(existsSync(resolve(root, 'public', plate.src.slice(1))), `Falta ${plate.src}`);
}
assert.equal(chapterDesign(guideChapters.find(ch => ch.id === 'arequita')).photos.length, 3);
assert.equal(chapterDesign({ id: 'un-destino-futuro', title: 'Nuevo destino', eyebrow: 'Nuevo' }).photos.length, 0, 'Un capítulo nuevo no debe heredar paisajes ajenos');
let checked = 0;
for (const scale of [.9, 1, 1.5]) {
  const plan = paginateGuide(guideChapters, scale);
  const noop = () => {};
  const ctx = new Proxy({ measureText: measure.measureText.bind(measure) }, { get(target, key) { return key in target ? target[key] : noop; }, set(target, key, value) { target[key] = value; return true; } });
  for (const spread of plan.spreads) {
    const chapter = guideChapters[spread.chapterIndex];
    const allowed = new Set(chapterDesign(chapter).photos.map(plate => plate.src));
    for (const src of spread.images) assert.ok(allowed.has(src), `Carga cruzada en ${chapter.id}: ${src}`);
    for (const page of [spread.left, spread.right]) {
      assert.equal(page.chapter.id, chapter.id);
      assert.equal(page.nextChapter, undefined, 'Las notas no deben introducir imágenes del capítulo siguiente');
      for (const plate of page.design.photos) assert.ok(allowed.has(plate.src));
      paintBookPage(ctx, page, new Map()); // Exercises layouts with zero, one, two and three plates.
      checked++;
    }
  }
}
console.log(`Arte geográfico correcto: ${guideChapters.length} capítulos, ${checked} páginas verificadas en tres escalas.`);
