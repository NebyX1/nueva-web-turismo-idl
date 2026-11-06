import * as THREE from 'three';

export interface TempleRoofShape {
  width: number;
  depth: number;
  eave: number;
  rise: number;
  ridgeWidth: number;
  ridgeDepth: number;
  curl: number;
}

/** Four curved hip surfaces, with a narrow ridge and lifted corner eaves. */
export function roofPoint(shape: TempleRoofShape, face: number, s: number, t: number) {
  const w = THREE.MathUtils.lerp(shape.width, shape.ridgeWidth, t) / 2;
  const d = THREE.MathUtils.lerp(shape.depth, shape.ridgeDepth, t) / 2;
  const y = shape.eave + shape.rise * (.12 * t + .88 * Math.pow(t, 1.65))
    + shape.curl * Math.pow(Math.abs(s), 10) * (1 - t) ** 2;
  return face === 0 ? new THREE.Vector3(s * w, y, d)
    : face === 1 ? new THREE.Vector3(w, y, -s * d)
      : face === 2 ? new THREE.Vector3(-s * w, y, -d)
        : new THREE.Vector3(-w, y, s * d);
}

export function createTempleRoof(name: string, shape: TempleRoofShape, gold: THREE.Material, underside: THREE.Material) {
  const group = new THREE.Group(); group.name = name;
  const position: number[] = [], uv: number[] = [], indices: number[] = [];
  const columns = 32, rows = 12;
  for (let face = 0; face < 4; face++) {
    const offset = position.length / 3;
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const t = row / rows, s = column / columns * 2 - 1;
      position.push(...roofPoint(shape, face, s, t).toArray()); uv.push(column / columns, t);
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = offset + row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const sheet = new THREE.Mesh(geometry, gold); sheet.name = 'Cubierta curva — cuatro faldones';
  sheet.castShadow = sheet.receiveShadow = true; sheet.userData.keepMesh = true; group.add(sheet);

  const fascia: number[] = [], fasciaIndex: number[] = [], ribs: number[] = [];
  for (let face = 0; face < 4; face++) {
    const edge: THREE.Vector3[] = [];
    for (let i = 0; i <= columns; i++) {
      const p = roofPoint(shape, face, i / columns * 2 - 1, 0), n = fascia.length / 3;
      fascia.push(p.x, p.y - .08, p.z, p.x * .987, p.y - .65, p.z * .987);
      if (i) fasciaIndex.push(n - 2, n - 1, n, n - 1, n + 1, n);
      edge.push(p.clone().add(new THREE.Vector3(0, .08, 0)));
    }
    const lip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 48, .13, 5, false), gold);
    lip.castShadow = true; group.add(lip);
    const ribCount = Math.round((face % 2 ? shape.depth : shape.width) * 1.4);
    for (let i = 0; i <= ribCount; i++) for (let j = 0; j < rows; j++) {
      const s = i / ribCount * 2 - 1;
      for (const t of [j / rows, (j + 1) / rows]) {
        const p = roofPoint(shape, face, s, t); ribs.push(p.x, p.y + .045, p.z);
      }
    }
  }
  const undersideGeometry = new THREE.BufferGeometry();
  undersideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fascia, 3));
  undersideGeometry.setIndex(fasciaIndex); undersideGeometry.computeVertexNormals();
  const edge = new THREE.Mesh(undersideGeometry, underside); edge.name = 'Alero turquesa'; group.add(edge);
  const ribGeometry = new THREE.BufferGeometry(); ribGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ribs, 3));
  const tiles = new THREE.LineSegments(ribGeometry, new THREE.LineBasicMaterial({ color: '#89602b', transparent: true, opacity: .65 }));
  tiles.name = 'Juntas de las tejas doradas'; group.add(tiles);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(shape.ridgeWidth, .15, shape.ridgeDepth), gold);
  cap.position.y = shape.eave + shape.rise; group.add(cap);

  // Small hooked golden end ornaments continue the sweep of each lifted corner.
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const corner = new THREE.Vector3(x * shape.width / 2, shape.eave + shape.curl, z * shape.depth / 2);
    const points = [corner, corner.clone().add(new THREE.Vector3(x * .36, .2, z * .36)),
      corner.clone().add(new THREE.Vector3(x * .7, .8, z * .7)), corner.clone().add(new THREE.Vector3(x * .66, 1.45, z * .66))];
    const hook = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 14, .15, 6, false), gold);
    hook.castShadow = true; group.add(hook);
  }
  group.userData.roofShape = shape;
  return group;
}
