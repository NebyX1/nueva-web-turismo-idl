import asset from './artigasAsset.json';
import { createArtigasFromAsset } from './artigasMesh';

/** Blender-authored sculpture; the exact mesh is approved in quality-approval.json. */
export function createArtigasMonument() {
  return createArtigasFromAsset(asset);
}
