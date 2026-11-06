import { BufferGeometry, Color, CylinderGeometry, DataTexture, DoubleSide, Float32BufferAttribute, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, RepeatWrapping, RGBAFormat, Shape, ShapeGeometry, TubeGeometry, CatmullRomCurve3, Vector3, RingGeometry } from 'three';
import type { LandmarkModel } from '../types';
import { createSalusPuma } from './salusPuma';
/** Fuente del Puma: reclining stone feline, spring pool and woodland, from photographic references. */
export function createSalus(): LandmarkModel {
    const group = new Group();
    group.name = 'Salus · Fuente del Puma';
    let seed = 8173;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const pixels = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
        const n = 105 + random() * 95;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = n;
        pixels[i + 3] = 255;
    }
    const texture = new DataTexture(pixels, 128, 128, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    const stone = new MeshStandardMaterial({ color: '#a19c83', roughness: .97, bumpMap: texture, bumpScale: .055 });
    const rockMat = new MeshStandardMaterial({ color: '#777b62', roughness: 1, bumpMap: texture, bumpScale: .08 });
    const bark = new MeshStandardMaterial({ color: '#716657', roughness: .97 });
    const canopyMat = new MeshStandardMaterial({ color: '#526545', roughness: 1 });
    const leafMat = new MeshStandardMaterial({ color: '#377842', roughness: .7, side: DoubleSide });
    const rockGeo = new IcosahedronGeometry(1, 1), dummy = new Object3D(), tint = new Color();
    const groundShape = new Shape();
    groundShape.absarc(0, 0, 33, 0, Math.PI * 2, false);
    const groundGeo = new ShapeGeometry(groundShape, 80);
    groundGeo.rotateX(-Math.PI / 2);
    const colors: number[] = [];
    for (let i = 0; i < groundGeo.attributes.position.count; i++) {
        tint.setHSL(.23 + random() * .035, .18 + random() * .16, .29 + random() * .09);
        colors.push(tint.r, tint.g, tint.b);
    }
    groundGeo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const ground = new Mesh(groundGeo, new MeshStandardMaterial({ color: '#65774d', roughness: 1, vertexColors: true }));
    ground.position.y = .015;
    ground.receiveShadow = true;
    group.add(ground);
    // The real park photograph shows a wide, curving ochre-red path under tall trees.
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 48; i++) {
        const z = 6 + i / 48 * 25, x = Math.sin(i / 48 * 2.2) * 3.4;
        vertices.push(x - 2.35, .055, z, x + 2.35, .055, z);
        if (i < 48) {
            const a = i * 2;
            indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
    }
    const pathGeo = new BufferGeometry();
    pathGeo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    pathGeo.setIndex(indices);
    pathGeo.computeVertexNormals();
    const path = new Mesh(pathGeo, new MeshStandardMaterial({ color: '#c8b09a', roughness: 1 }));
    path.receiveShadow = true;
    group.add(path);
    const ledge = new InstancedMesh(rockGeo, rockMat, 34);
    for (let i = 0; i < 34; i++) {
        const a = random() * Math.PI * 2, r = Math.sqrt(random()) * 3.8;
        dummy.position.set(Math.cos(a) * r, .65 + random() * .5, Math.sin(a) * r * .65 - 1.3);
        dummy.rotation.set(random() * .7, random() * 6.28, random() * .8);
        dummy.scale.set(.65 + random() * .9, .35 + random() * .55, .5 + random() * .8);
        dummy.updateMatrix();
        ledge.setMatrixAt(i, dummy.matrix);
    }
    ledge.castShadow = ledge.receiveShadow = true;
    group.add(ledge);
    const puma = createSalusPuma(stone);
    group.add(puma.group);
    const poolShape = new Shape();
    poolShape.moveTo(-3.15, -1.2);
    poolShape.bezierCurveTo(-4.4, .3, -2.5, 3.4, 0, 3.2);
    poolShape.bezierCurveTo(3.8, 3.35, 4.7, .5, 2.8, -1.4);
    poolShape.bezierCurveTo(1, -2, -1.5, -2.2, -3.15, -1.2);
    const poolGeo = new ShapeGeometry(poolShape, 40);
    poolGeo.rotateX(-Math.PI / 2);
    const pool = new Mesh(poolGeo, new MeshStandardMaterial({ color: '#6b9b8c', roughness: .18, metalness: .15, transparent: true, opacity: .87 }));
    pool.position.set(0, .38, 4.2);
    pool.receiveShadow = true;
    group.add(pool);
    const edging = new InstancedMesh(rockGeo, rockMat, 38);
    for (let i = 0; i < 38; i++) {
        const a = i / 38 * Math.PI * 2;
        dummy.position.set(Math.cos(a) * (3.5 + random() * .25), .35 + random() * .16, 4.2 + Math.sin(a) * (2.4 + random() * .35));
        dummy.rotation.set(random(), random() * 6.28, random());
        dummy.scale.set(.3 + random() * .28, .24 + random() * .22, .3 + random() * .35);
        dummy.updateMatrix();
        edging.setMatrixAt(i, dummy.matrix);
    }
    edging.castShadow = edging.receiveShadow = true;
    group.add(edging);
    // The jet comes from the mouth, following a parabolic fall into a shallow natural basin.
    const jetCurve = new CatmullRomCurve3([puma.mouth, puma.mouth.clone().add(new Vector3(0, -.035, .55)), new Vector3(0, 2.4, 2.95), new Vector3(0, .44, 4.05)]);
    const jetMat = new MeshStandardMaterial({ color: '#daeeee', roughness: .08, metalness: .12, transparent: true, opacity: .76, emissive: '#203d3d', emissiveIntensity: .3 });
    const jet = new Mesh(new TubeGeometry(jetCurve, 36, .033, 6, false), jetMat);
    jet.name = 'Agua desde la boca del puma';
    group.add(jet);
    const ripples: Mesh[] = [];
    for (let i = 0; i < 4; i++) {
        const ripple = new Mesh(new RingGeometry(.27, .29, 36), new MeshStandardMaterial({ color: '#dcefe4', transparent: true, opacity: .5, roughness: .4, side: DoubleSide }));
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(0, .395 + i * .001, 4.05);
        group.add(ripple);
        ripples.push(ripple);
    }
    // Broad split leaves frame the sculpture in the official Salus and Presidency photographs.
    const leafShape = new Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(-.18, .11, -.65, .1, -.73, .5);
    leafShape.lineTo(-.39, .5);
    leafShape.bezierCurveTo(-.6, .64, -.78, .83, -.65, 1.08);
    leafShape.lineTo(-.27, .87);
    leafShape.bezierCurveTo(-.5, 1.18, -.45, 1.42, -.28, 1.54);
    leafShape.lineTo(-.08, 1.21);
    leafShape.quadraticCurveTo(-.08, 1.66, 0, 1.84);
    leafShape.quadraticCurveTo(.12, 1.55, .12, 1.2);
    leafShape.lineTo(.35, 1.55);
    leafShape.bezierCurveTo(.56, 1.35, .49, 1.11, .3, .9);
    leafShape.lineTo(.66, 1.08);
    leafShape.bezierCurveTo(.8, .8, .63, .64, .39, .5);
    leafShape.lineTo(.73, .5);
    leafShape.bezierCurveTo(.65, .12, .21, .13, 0, 0);
    const broadLeaves = new InstancedMesh(new ShapeGeometry(leafShape, 10), leafMat, 90);
    for (let i = 0; i < 90; i++) {
        const a = random() * Math.PI * 2, r = 3.6 + random() * 4.2;
        dummy.position.set(Math.cos(a) * r, .2 + random() * .8, Math.sin(a) * r - 2.2);
        dummy.rotation.set(-.25 - random() * .65, a + random(), random() * .35 - .175);
        const s = .72 + random() * .65;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        broadLeaves.setMatrixAt(i, dummy.matrix);
        broadLeaves.setColorAt(i, tint.setHSL(.3 + random() * .065, .35 + random() * .24, .2 + random() * .13));
    }
    broadLeaves.castShadow = broadLeaves.receiveShadow = true;
    group.add(broadLeaves);
    const treeCount = 76, trunks = new InstancedMesh(new CylinderGeometry(.55, .8, 1, 7, 1), bark, treeCount), crowns = new InstancedMesh(new IcosahedronGeometry(1, 1), canopyMat, treeCount * 4), branches = new InstancedMesh(new CylinderGeometry(.17, .3, 1, 5), bark, treeCount * 2);
    for (let i = 0; i < treeCount; i++) {
        const a = random() * Math.PI * 2, r = 10 + random() * 21;
        let x = Math.cos(a) * r;
        const z = Math.sin(a) * r - 3;
        if (z > 2 && Math.abs(x - Math.sin((z - 6) / 25 * 2.2) * 3.4) < 4.8)
            x += x > 0 ? 5 : -5;
        const h = 12 + random() * 11, d = .32 + random() * .4;
        dummy.position.set(x, h / 2, z);
        dummy.rotation.set((random() - .5) * .1, 0, (random() - .5) * .1);
        dummy.scale.set(d, h, d);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        for (let c = 0; c < 4; c++) {
            dummy.position.set(x + Math.cos(c * 1.6) * 2.1, h - .7 + (c % 2) * 1.8, z + Math.sin(c * 1.6) * 2.2);
            dummy.rotation.set(random(), random() * 6.28, random());
            dummy.scale.set(2.9 + random() * 1.4, 2.4 + random() * 1.5, 2.8 + random() * 1.4);
            dummy.updateMatrix();
            crowns.setMatrixAt(i * 4 + c, dummy.matrix);
            crowns.setColorAt(i * 4 + c, tint.setHSL(.25 + random() * .07, .2 + random() * .2, .24 + random() * .11));
        }
        for (let b = 0; b < 2; b++) {
            const start = new Vector3(x, h * .66, z), end = new Vector3(x + (b ? 2.2 : -1.9), h - .6, z + (b ? -1.7 : 1.8));
            dummy.position.copy(start).add(end).multiplyScalar(.5);
            dummy.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize());
            dummy.scale.set(.65, start.distanceTo(end), .65);
            dummy.updateMatrix();
            branches.setMatrixAt(i * 2 + b, dummy.matrix);
        }
    }
    trunks.castShadow = branches.castShadow = crowns.castShadow = true;
    trunks.receiveShadow = crowns.receiveShadow = true;
    group.add(trunks, branches, crowns);
    return { group, target: new Vector3(0, 2.5, 1.3), bounds: { radius: 40, height: 31 }, groundY: 0, cameraDirection: new Vector3(.2, .06, 1).normalize(), update(time) { ripples.forEach((r, i) => { const phase = (time * .45 + i / ripples.length) % 1; r.scale.setScalar(.55 + phase * 2.4); (r.material as MeshStandardMaterial).opacity = (1 - phase) * .38; }); jetMat.opacity = .68 + Math.sin(time * 5) * .08; } };
}
