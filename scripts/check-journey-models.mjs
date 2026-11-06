import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url), cache = new Map();
// Geometry checks do not need a browser; raster drawing is stubbed here and
// Artigas is separately reviewed from the exact packed geometry in Blender CPU.
function canvas() {
  const ctx = new Proxy({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
    measureText: text => ({ width: text.length * 20 }),
  }, { get: (target, key) => key in target ? target[key] : () => {}, set: (target, key, value) => (target[key] = value, true) });
  return { width: 0, height: 0, getContext: () => ctx };
}
class PathStub { constructor() { return new Proxy(this, { get: () => () => {} }); } }
function load(filename) {
  filename = resolve(root, filename);
  if (filename.endsWith('.json')) return JSON.parse(readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, Path2D: PathStub, atob,
    document: { createElement: canvas },
    require: specifier => specifier.startsWith('.') ? load(resolve(dirname(filename), specifier.endsWith('.json') ? specifier : specifier + '.ts')) : require(specifier),
  }, { filename });
  return module.exports;
}
const { journeyStops } = load('src/data/journeyStops.ts');
const { JOURNEY_MAP_SCALE } = load('src/data/journeyRoute.ts');
const { journeyDefinitions, JOURNEY_WORLD_SIZE, JOURNEY_TERRAIN_SEGMENTS } = load('src/three/journeySites.ts');
const { journeyTerrainHeight } = load('src/three/journeyTerrain.ts');
const { guideChapters } = load('src/data/lavallejaGuide.ts');
assert.equal(new Set(journeyStops.map(stop => stop.id)).size, journeyStops.length, 'Paradas duplicadas');
assert.equal(journeyStops.length, 9);
const correctOrder = ['monasterio', 'salus', 'minas-sign', 'verdun', 'plaza-libertad', 'arequita', 'cerro-artigas', 'penitente', 'villa-serrana'];
assert.equal(JSON.stringify(journeyStops.map(stop => stop.id)), JSON.stringify(correctOrder), 'La navegación debe seguir el orden confirmado por el usuario');
assert.equal(JSON.stringify(journeyDefinitions.map(stop => stop.id)), JSON.stringify(correctOrder), 'El vuelo de cámara debe coincidir con la navegación');
for (let i = 0; i < journeyDefinitions.length; i++) {
  const site = journeyDefinitions[i], pad = site.pad ?? 48;
  assert.ok(Number.isFinite(site.x) && Number.isFinite(site.z) && typeof site.make === 'function');
  assert.ok(Math.abs(site.x) + pad < JOURNEY_WORLD_SIZE / 2 && Math.abs(site.z) + pad < JOURNEY_WORLD_SIZE / 2, `${site.id}: fuera del terreno`);
  if (i > 0) assert.ok(site.z < journeyDefinitions[i - 1].z, 'El recorrido debe avanzar de abajo hacia arriba en el esquema');
  for (const previous of journeyDefinitions.slice(0, i)) {
    assert.ok(Math.hypot(site.x - previous.x, site.z - previous.z) > pad + (previous.pad ?? 48), `${site.id}/${previous.id}: se superponen las áreas de apoyo`);
  }
}
const byId = Object.fromEntries(journeyDefinitions.map(stop => [stop.id, stop]));
assert.ok(journeyDefinitions.every(site => site.x >= byId.arequita.x), 'Arequita debe estar en el extremo izquierdo');
assert.ok(journeyDefinitions.every(site => site.x <= byId['villa-serrana'].x), 'Villa Serrana debe estar en el extremo superior derecho');
assert.ok(Math.abs(byId.arequita.z - byId['cerro-artigas'].z) < JOURNEY_MAP_SCALE * 4, 'Arequita y Artigas deben compartir prácticamente la misma altura en el esquema');
assert.ok(byId['plaza-libertad'].x > byId.verdun.x && byId['minas-sign'].x < byId.salus.x, 'Las posiciones laterales deben conservar la distribución del esquema');
console.log('Recorrido confirmado: ' + journeyStops.map(stop => stop.name).join(' → '));
for (const stop of journeyStops) if (stop.guideChapter) assert.ok(guideChapters.some(chapter => chapter.id === stop.guideChapter), `Capítulo inexistente para ${stop.id}`);
const models = [
  ['arequita', 'createArequita'], ['artigas', 'createArtigas'],
  ['minasSign', 'createMinasSign'], ['plazaLibertad', 'createPlazaLibertad'],
  ['salus', 'createSalus'],
  ['monastery', 'createMonastery'],
  ['penitente', 'createPenitente'],
];
for (const [file, factory] of models) {
  const model = load(`src/three/landmarks/${file}.ts`)[factory]();
  assert.ok(model.group.isGroup && model.group.children.length, `${file}: grupo vacío`);
  assert.ok(model.bounds.radius > 0 && model.bounds.height > 0);
  for (const value of model.target.toArray()) assert.ok(Number.isFinite(value));
  if (file === 'arequita') {
    const top = model.group.getObjectByName('Corona pétrea baja, quebrada y sin tapa plana').geometry.attributes.position;
    const left = [], right = [];
    for (let i = 0; i < top.count; i++) {
      if (Math.abs(top.getZ(i)) > 25) continue;
      const x = top.getX(i), y = top.getY(i);
      if (x > -90 && x < -45) left.push(y);
      if (x > 125 && x < 158) right.push(y);
    }
    const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    assert.ok(left.length && right.length);
    assert.ok(mean(left) > 78 && mean(right) < 40 && mean(left) - mean(right) > 42, 'Arequita debe descender hacia la derecha');
    const plants = model.group.getObjectByName('Troncos arraigados');
    let upperPlants = 0;
    for (let i = 0; i < plants.count; i++) if (plants.instanceMatrix.array[i * 16 + 13] > 70) upperPlants++;
    assert.ok(upperPlants > 180, 'Falta cobertura vegetal en la cima');
    console.log(`Arequita: cima izquierda ${mean(left).toFixed(1)}, hombro derecho ${mean(right).toFixed(1)}, ${upperPlants} plantas en la zona alta`);
  }
  if (file === 'artigas') {
    const sculpture = model.group.getObjectByName('Artigas — monumento ecuestre reconstruido');
    assert.ok(sculpture?.isGroup && sculpture.children.length >= 8, 'Falta el activo reconstruido');
    const asset = JSON.parse(readFileSync(resolve(root, 'src/three/landmarks/artigasAsset.json'), 'utf8'));
    assert.equal(sculpture.userData.assetSha256, asset.sourceSha256, 'La escena debe usar la revisión aprobada');
    execFileSync(process.execPath, [resolve(root, 'scripts/check-artigas-rebuild.mjs')], { stdio: 'inherit' });
  }
  if (file === 'penitente') execFileSync(process.execPath, [resolve(root, 'scripts/check-penitente-rebuild.mjs')], { stdio: 'inherit' });
  if (file === 'plazaLibertad') {
    const { Box3, Vector3, MathUtils } = require('three');
    const base = model.group.getObjectByName('plaza-lavalleja-granite');
    const size = new Box3().setFromObject(base).getSize(new Vector3());
    assert.ok(Math.abs(size.x - 10.1) < .001 && Math.abs(size.z - 12.7) < .001, 'El granito debe girar 90° y alinear su lado largo con el estanque');
    const bronze = model.group.getObjectByName('plaza-lavalleja-bronze');
    const p = bronze.geometry.attributes.position, statue = new Box3(), point = new Vector3();
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 9.3) statue.expandByPoint(point.fromBufferAttribute(p, i));
    const statueSize = statue.getSize(new Vector3());
    assert.ok(statueSize.z > statueSize.x * 2, 'El caballo debe conservar su orientación sobre el eje del estanque');
    const lights = [];
    model.group.traverse(object => { if (object.isPointLight && object.name !== 'plaza-fountain-colour-light') lights.push(object); });
    assert.equal(lights.length, 12, 'Deben iluminar los ocho faroles dobles y las cuatro luminarias altas');
    const rig = model.group.getObjectByName('plaza-street-lights');
    const glass = model.group.getObjectByName('plaza-lamp-glass').material;
    assert.ok(!rig.visible && lights.every(light => !light.visible && !light.castShadow));
    model.nightLighting.setNight(true, true);
    assert.ok(rig.visible && lights.every(light => light.visible && light.intensity > 0));
    assert.ok(glass.emissiveIntensity > 1, 'Las lámparas deben verse encendidas');
    // Check the actual finite reach across walks/lawns, not just emissive bulbs.
    for (const x of [-50, -30, 0, 30, 50]) for (const z of [-50, -25, 0, 25, 50]) {
      point.set(x, .25, z);
      assert.ok(lights.some(light => light.position.distanceTo(point) < light.distance), `Falta luz de la plaza en ${x},${z}`);
    }
    model.nightLighting.setNight(true, false);
    assert.ok(!rig.visible && lights.every(light => !light.visible) && glass.emissiveIntensity > 1, 'Las fuentes distantes deben salir del presupuesto sin apagar visualmente sus lámparas');
    model.nightLighting.setNight(false, true);
    assert.ok(!rig.visible && glass.emissiveIntensity === 0 && lights.every(light => !light.visible), 'El día debe apagar las luminarias nocturnas');
    const [monument, church] = model.nightLighting.floodlights;
    assert.ok(monument.target.z === 21 && monument.target.y > 11 && monument.target.y < 15, 'El primer reflector debe apuntar al caballo y el jinete');
    assert.ok(church.target.z < -118 && church.target.y > 15, 'El segundo reflector debe apuntar a la fachada de la iglesia');
    // Measure useful direct illumination on the statue surfaces facing the tour
    // camera. A light aimed at the right point from behind still leaves them dark.
    const lamp = monument.foot.clone().add(new Vector3(0, 1.65 * (monument.scale ?? 1), 0));
    const axis = monument.target.clone().sub(lamp).normalize(), reach = lamp.distanceTo(monument.target);
    const view = model.cameraDirection.clone().normalize(), normal = bronze.geometry.attributes.normal, n = new Vector3(), toLight = new Vector3();
    const illumination = [];
    for (let i = 0; i < p.count; i++) {
      n.fromBufferAttribute(normal, i); point.fromBufferAttribute(p, i);
      if (point.y < 9.4 || n.dot(view) < .4) continue;
      toLight.copy(lamp).sub(point); const distance = toLight.length(); toLight.normalize();
      const spot = MathUtils.smoothstep(-toLight.dot(axis), Math.cos(monument.angle), Math.cos(monument.angle * (1 - (monument.penumbra ?? .72))));
      const cutoff = Math.max(0, 1 - (distance / (reach * 2.7 + 30)) ** 4) ** 2;
      illumination.push(Math.max(0, n.dot(toLight)) * spot * cutoff * reach ** 2 * monument.strength / distance ** 2);
    }
    illumination.sort((a, b) => a - b);
    const median = illumination[Math.floor(illumination.length / 2)];
    assert.ok(illumination.length > 100 && median > 1.2, `La cara visible de la estatua queda oscura: irradiancia mediana ${median}`);
    const colouredLights = [];
    model.group.traverse(object => { if (object.name === 'plaza-fountain-colour-light') colouredLights.push(object); });
    assert.equal(colouredLights.length, 3);
    const jets = model.group.getObjectByName('plaza-fountain-jets').material;
    const leds = model.group.getObjectByName('plaza-fountain-leds').material;
    const dayColour = jets.color.clone();
    model.nightLighting.setNight(true, true);
    for (const [time, colour] of [[0, '9654ff'], [6, 'ff5ca8'], [12, '68ceff'], [18, '9654ff']]) {
      model.update(time);
      assert.equal(jets.emissive.getHexString(), colour);
      assert.equal(leds.emissive.getHexString(), colour);
      assert.ok(colouredLights.every(light => light.visible && !light.castShadow && light.color.getHexString() === colour));
    }
    let previous = jets.emissive.clone();
    for (let time = .25; time <= 18; time += .25) {
      model.update(time);
      assert.ok(jets.emissive.clone().sub(previous).toArray().every(channel => Math.abs(channel) < .14), 'El ciclo de color debe cambiar suavemente, sin saltos');
      previous.copy(jets.emissive);
    }
    model.nightLighting.setNight(false, true);
    assert.ok(jets.color.equals(dayColour) && jets.emissiveIntensity === .22 && jets.opacity === .7);
    assert.ok(colouredLights.every(light => !light.visible), 'Los focos de color deben apagarse durante el día');
    console.log(`Plaza Libertad: base girada, estatua iluminada (mediana ${median.toFixed(2)}), faroles y ciclo violeta/rosado/celeste`);
  }
  if (file === 'salus') {
    const puma = model.group.getObjectByName('Puma de Salus — escultura anatómica');
    assert.ok(puma?.isGroup, 'Falta la escultura del puma');
    let pumaTriangles = 0;
    puma.traverse(part => { if (part.isMesh) pumaTriangles += (part.geometry.index?.count || part.geometry.attributes.position.count) / 3; });
    assert.ok(pumaTriangles < 90000, 'La escultura excede su presupuesto de geometría');
    // A closed, connected surface catches detached limbs and cuts that pierce
    // the voxel boundary. Finite buffers alone would miss both regressions.
    const sculpts = [];
    puma.traverse(part => { if (part.isMesh && (part.name.startsWith('Cuerpo continuo') || part.name.startsWith('Cráneo esculpido'))) sculpts.push(part); });
    assert.equal(sculpts.length, 2, 'Faltan superficies esculpidas');
    for (const mesh of sculpts) {
      const position = mesh.geometry.attributes.position, normal = mesh.geometry.attributes.normal;
      const vertices = new Map(), parents = [], edges = new Map();
      const root = n => parents[n] === n ? n : (parents[n] = root(parents[n]));
      const ids = [];
      for (let i = 0; i < position.count; i++) {
        const key = [position.getX(i), position.getY(i), position.getZ(i)].map(v => Math.round(v * 100000)).join(',');
        if (!vertices.has(key)) { vertices.set(key, parents.length); parents.push(parents.length); }
        ids.push(vertices.get(key));
        const length = Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i));
        assert.ok(Math.abs(length - 1) < .001, `${mesh.name}: normal degenerada`);
      }
      for (let i = 0; i < ids.length; i += 3) {
        const triangle = ids.slice(i, i + 3);
        if (new Set(triangle).size < 3) continue;
        for (let j = 0; j < 3; j++) {
          const a = triangle[j], b = triangle[(j + 1) % 3];
          parents[root(a)] = root(b);
          const key = a < b ? `${a}/${b}` : `${b}/${a}`;
          edges.set(key, (edges.get(key) || 0) + 1);
        }
      }
      assert.equal(new Set(parents.map((_, i) => root(i))).size, 1, `${mesh.name}: hay piezas sueltas`);
      assert.equal([...edges.values()].filter(count => count !== 2).length, 0, `${mesh.name}: superficie abierta o no manifold`);
    }
    const outlet = model.group.getObjectByName('Salida del manantial en la boca');
    const jet = model.group.getObjectByName('Agua desde la boca del puma');
    model.group.updateMatrixWorld(true);
    outlet.geometry.computeBoundingSphere();
    const { Vector3 } = require('three');
    const outletCenter = outlet.geometry.boundingSphere.center.clone().applyMatrix4(outlet.matrixWorld);
    const jetStart = jet.geometry.parameters.path.getPoint(0).applyMatrix4(jet.matrixWorld);
    const direction = new Vector3(0, 0, 1).transformDirection(outlet.matrixWorld);
    const separation = jetStart.clone().sub(outletCenter);
    assert.ok(separation.distanceTo(direction.multiplyScalar(.0275)) < .0001, 'El chorro debe comenzar en el borde de la boca');
    console.log(`Salus: puma de ${pumaTriangles} triángulos, superficies cerradas y chorro alineado con la boca`);
  }
  if (file === 'monastery') {
    const { Box3, Vector3 } = require('three');
    model.group.updateMatrixWorld(true);
    const front = model.group.getObjectByName('Ventanas superiores frontales — dos vanos');
    assert.equal(front.children.length, 2, 'La planta superior debe tener exactamente dos ventanas al frente');
    const frontCenters = front.children.map(opening => new Box3().setFromObject(opening)).map(b => (b.min.x + b.max.x) / 2).sort((a, b) => a - b);
    assert.ok(frontCenters[0] < -3 && frontCenters[1] > 3, 'Las dos ventanas deben quedar a ambos lados del emblema');
    const central = model.group.getObjectByName('Ventanas de planta baja del cuerpo central — dos vanos');
    const corners = model.group.getObjectByName('Ventanas de planta baja de los extremos — dos vanos');
    assert.equal(central.children.length, 2, 'Planta baja: debe haber una ventana junto a cada lado del portal');
    assert.equal(corners.children.length, 2, 'Planta baja: debe haber una ventana en cada extremo del frente');
    for (const part of [central, corners]) assert.ok(part.children[0].position.x < 0 && part.children[1].position.x > 0, 'Los vanos deben distribuirse de forma simétrica a ambos lados de la entrada');
    for (const side of ['izquierdo', 'derecho']) {
      const windows = model.group.getObjectByName(`Ventanas superiores del costado ${side} — tres vanos`);
      assert.equal(windows.children.length, 3, `La planta superior debe conservar tres ventanas en el costado ${side}`);
      assert.ok(windows.children.every(opening => new Box3().setFromObject(opening).getSize(new Vector3()).y > 4), 'Los vanos laterales deben contener sus mallas completas');
    }
    const roofNames = ['Cubierta principal dorada — aleros curvos', 'Cubierta superior — esquinas levantadas', 'Cubierta del portal — alero dorado'];
    for (const name of roofNames) {
      const roof = model.group.getObjectByName(name), shape = roof.userData.roofShape;
      const sheet = roof.getObjectByName('Cubierta curva — cuatro faldones');
      const p = sheet.geometry.attributes.position, n = sheet.geometry.attributes.normal;
      let corners = 0, averageNormalY = 0;
      for (let i = 0; i < p.count; i++) {
        averageNormalY += n.getY(i);
        if (Math.abs(Math.abs(p.getX(i)) - shape.width / 2) < .001 && Math.abs(Math.abs(p.getZ(i)) - shape.depth / 2) < .001) {
          assert.ok(p.getY(i) > shape.eave + 1, `${name}: faltan las esquinas levantadas`); corners++;
        }
      }
      assert.ok(corners >= 4 && averageNormalY / p.count > .65, `${name}: faldones o normales incorrectos`);
    }
    const crown = model.group.getObjectByName('Tres pináculos torneados sobre la cumbrera');
    assert.equal(crown.children.length, 3, 'Deben existir tres pináculos');
    assert.ok(crown.children.every(pin => Math.abs(pin.position.x) < .001), 'Los pináculos deben alinearse sobre la cumbrera longitudinal');
    assert.ok(model.group.getObjectByName('Frontón triangular — tímpano azul y marco dorado'));
    const emblem = model.group.getObjectByName('Rueda del Dharma y dos ciervos arrodillados');
    assert.equal(emblem.getObjectByName('Ocho radios de la rueda').count, 8);
    const left = new Box3().setFromObject(emblem.getObjectByName('Ciervo izquierdo — mirando a la rueda'));
    const right = new Box3().setFromObject(emblem.getObjectByName('Ciervo derecho — mirando a la rueda'));
    assert.ok(left.max.x < -1.8 && right.min.x > 1.8, 'Los ciervos deben flanquear la rueda');
    assert.ok(new Box3().setFromObject(model.group).max.y <= model.bounds.height, 'El encuadre debe incluir todos los remates');
    console.log('Monasterio: dos ventanas al frente superior y tres por costado; cuatro al frente de planta baja; cubiertas curvas, tres pináculos y rueda con dos ciervos');
  }
  const geometries = new Set(), materials = new Set(), textures = new Set();
  let meshes = 0, triangles = 0, invalid = 0;
  model.group.updateMatrixWorld(true);
  model.group.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    const geometry = object.geometry; geometries.add(geometry);
    triangles += (geometry.index?.count || geometry.attributes.position.count) / 3 * (object.isInstancedMesh ? object.count : 1);
    for (const name of ['position', 'normal']) {
      const attribute = geometry.attributes[name];
      assert.ok(attribute, `${file}: falta ${name}`);
      for (const value of attribute.array) if (!Number.isFinite(value)) invalid++;
    }
    if (geometry.index) for (const index of geometry.index.array) assert.ok(index < geometry.attributes.position.count, `${file}: índice inválido`);
    for (const value of object.matrixWorld.elements) assert.ok(Number.isFinite(value));
    if (object.isInstancedMesh) for (const value of object.instanceMatrix.array) assert.ok(Number.isFinite(value));
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(mat); for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value); }
  });
  for (const t of [0, .5, 4, 11, 27, 65]) model.update?.(t);
  model.group.traverse(object => { if (object.isInstancedMesh) for (const value of object.instanceMatrix.array) assert.ok(Number.isFinite(value), `${file}: animación inválida`); });
  assert.equal(invalid, 0, `${file}: coordenadas o normales inválidas`);
  console.log(`${file}: ${meshes} mallas, ${Math.round(triangles)} triángulos, geometría y animación válidas`);
  geometries.forEach(geometry => geometry.dispose()); textures.forEach(texture => texture.dispose()); materials.forEach(mat => mat.dispose());
}
// Compare actual world-space geometry, not just local height metadata: Verdún's
// terrain summit itself must exceed every other monument, hill and canopy.
{
  const { Box3, Vector3, Raycaster } = require('three');
  const elevations = [];
  let verdunCrest, verdunModelTop, verdunWidth, verdunDepth;
  for (const site of journeyDefinitions) {
    const model = site.make();
    model.group.position.set(site.x, journeyTerrainHeight(site.x, site.z) + (site.groundOffset ?? -.3), site.z);
    model.group.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model.group);
    elevations.push({ id: site.id, top: box.max.y, width: box.max.x - box.min.x, depth: box.max.z - box.min.z });
    if (site.id === 'verdun') {
      const hill = model.group.getObjectByName('Cumbre del Verdún — relieve dominante');
      const shrine = model.group.getObjectByName('Santuario del Verdún — escala original');
      const ascent = model.group.getObjectByName('Sendero del Verdún — apoyado en la ladera');
      verdunCrest = new Box3().setFromObject(hill).max.y; verdunModelTop = box.max.y;
      // Measure the raised hillside, excluding the flat ground patch around it.
      const footprint = new Box3(), vertices = hill.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) if (vertices.getY(i) >= 1) footprint.expandByPoint(new Vector3().fromBufferAttribute(vertices, i));
      verdunWidth = footprint.max.x - footprint.min.x; verdunDepth = footprint.max.z - footprint.min.z;
      assert.ok(verdunWidth > 580 && verdunDepth > 490, 'El Verdún debe tener laderas amplias en ambos ejes');
      assert.ok(Math.min(verdunWidth, verdunDepth) > 3.4 * 140, 'El cerro debe verse ancho y tendido');
      assert.ok(shrine.scale.equals(new Vector3(1, 1, 1)), 'Elevar el cerro no debe estirar el santuario');
      assert.ok(site.eye + model.group.position.y > verdunCrest + 5, 'El enfoque cercano debe quedar por encima de la cima');
      assert.ok(site.reveal + model.group.position.y >= verdunModelTop - 1, 'El barrido debe incluir la cima y el santuario');
      const ray = new Raycaster(), p = ascent.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 6) {
        const point = new Vector3().fromBufferAttribute(p, i).applyMatrix4(ascent.matrixWorld);
        ray.set(new Vector3(point.x, verdunCrest + 10, point.z), new Vector3(0, -1, 0));
        const ground = ray.intersectObject(hill)[0];
        assert.ok(ground && Math.abs(point.y - ground.point.y - .18) < .001, 'El camino debe acompañar la ladera elevada');
      }
    }
    const geometries = new Set(), materials = new Set(), textures = new Set();
    model.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose());
  }
  const otherTop = Math.max(...elevations.filter(site => site.id !== 'verdun').map(site => site.top));
  const otherSpan = Math.max(...elevations.filter(site => site.id !== 'verdun').flatMap(site => [site.width, site.depth]));
  assert.ok(Math.min(verdunWidth, verdunDepth) > otherSpan, 'El relieve del Verdún debe ser más ancho que el conjunto de cualquier otra parada');
  assert.ok(verdunCrest > otherTop + 12, `La cima del Verdún (${verdunCrest}) debe dominar al resto del mapa (${otherTop})`);
  let terrainTop = -Infinity;
  for (let z = 0; z <= JOURNEY_TERRAIN_SEGMENTS; z++) for (let x = 0; x <= JOURNEY_TERRAIN_SEGMENTS; x++) {
    terrainTop = Math.max(terrainTop, journeyTerrainHeight((x / JOURNEY_TERRAIN_SEGMENTS - .5) * JOURNEY_WORLD_SIZE, (z / JOURNEY_TERRAIN_SEGMENTS - .5) * JOURNEY_WORLD_SIZE));
  }
  assert.ok(verdunCrest > terrainTop + 20, 'El relieve y el bosque de fondo deben quedar por debajo de la cumbre');
  console.log(`Verdún: ladera ${verdunWidth.toFixed(0)} × ${verdunDepth.toFixed(0)}, cima ${verdunCrest.toFixed(1)}, santuario ${verdunModelTop.toFixed(1)}, siguiente sitio ${otherTop.toFixed(1)}, terreno de fondo ${terrainTop.toFixed(1)}`);
}
console.log('Nueve paradas y enlaces a la guía verificados.');
