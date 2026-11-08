import bpy, math, argparse, sys
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--out',required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(Path(a.model).resolve()))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Review daylight');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.50,.63,.67,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.8
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.rotation_euler=(.55,-.40,-.45);sun.data.energy=2.1;sun.data.angle=.12
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
def world(v):return Vector((v[0],-v[2],v[1]))
views=[('entry-front',(0,13,316),(0,8.5,244),44),('entry-oblique',(39,18,291),(0,8.5,244),39),('pergola',(-70,14,220),(-47,6,182),40),('lake-bridge',(8,13,200),(49,1.7,140),39),('lake-aerial',(139,91,192),(57,1,135),39),('pool',(158,17,154),(113,4,110),38),('arena',(95,87,125),(0,1,-3),34),('overall',(335,296,461),(0,1,111),38)]
for name,position,target,lens in views:
 camera.location=world(position);camera.rotation_euler=(world(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens
 scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);print('REVIEW_READY',name,flush=True)
