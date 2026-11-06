"""Refine adult arms, sleeves and hands in the saved sculpture, preserving other parts."""
import bpy, sys, argparse, json, hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from anatomical_hands import create_hands
from adult_arms import refine_arms

parser=argparse.ArgumentParser();parser.add_argument('--input',required=True);parser.add_argument('--out',required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(Path(args.input).resolve()))
old=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Mano')]
assert len(old)==2,'Expected exactly two hand meshes'
material=old[0].data.materials[0]
for obj in old:bpy.data.objects.remove(obj,do_unlink=True)
arm_report=refine_arms()
hands=create_hands(material)
for hand in hands:print('NEW_HAND',hand.name,len(hand.data.vertices),flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'artigas-rebuilt.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'artigas-rebuilt.glb'),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
(out/'arm-proportions.json').write_text(json.dumps(arm_report,indent=2),encoding='utf-8')
print('ARTIGAS_HANDS_REPLACED',flush=True)
