import * as THREE from 'three';

type HeritageFlag = 'artigas' | 'treinta-y-tres';
const BLUE = '#0038a8', WHITE = '#ffffff', RED = '#c92532';

/** Official designs; source references are in docs/artigas-national-flags.md.
 * Drawn locally on canvas so the complete inscription is ready with the cloth.
 */
function createHeritageFlag(kind: HeritageFlag, width: number, phase: number) {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el pabellón');
  const bands = kind === 'artigas' ? [BLUE, WHITE, BLUE] : [BLUE, WHITE, RED];
  bands.forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(0, i * canvas.height / 3, canvas.width, canvas.height / 3 + 1); });
  if (kind === 'artigas') {
    ctx.strokeStyle = RED; ctx.lineWidth = canvas.height / 3; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvas.width, canvas.height); ctx.stroke();
  } else {
    ctx.fillStyle = '#111820'; ctx.font = '700 91px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LIBERTAD O MUERTE', canvas.width / 2, canvas.height / 2, canvas.width * .9);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const height = width * 2 / 3, geometry = new THREE.PlaneGeometry(width, height, 40, 18);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + width / 2, y = p.getY(i) - height / 2;
    p.setXYZ(i, x, y, Math.sin(x * 2 + phase) * .18 * x / width);
  }
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, roughness: .92, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(geometry, material); cloth.receiveShadow = true;
  cloth.name = kind === 'artigas' ? 'Paño de Artigas — banda diagonal punzó' : 'Paño de los Treinta y Tres — Libertad o Muerte';
  const group = new THREE.Group();
  group.name = kind === 'artigas' ? 'Bandera de Artigas / Liga Federal' : 'Bandera de los Treinta y Tres Orientales';
  group.userData.flag = {
    kind, width, height, stripes: 3, bands,
    diagonal: kind === 'artigas' ? 'upper-hoist-to-lower-fly' : undefined,
    legend: kind === 'treinta-y-tres' ? 'LIBERTAD O MUERTE' : undefined,
  };
  group.add(cloth); return group;
}

export function createArtigasFlag(width: number, phase = 0) { return createHeritageFlag('artigas', width, phase); }
export function createThirtyThreeFlag(width: number, phase = 0) { return createHeritageFlag('treinta-y-tres', width, phase); }
