"""Read-only renders of the authored native asset, not a claim of WebGL execution."""
import bpy,sys,argparse,math
from pathlib import Path
from mathutils import Vector
parser=argparse.ArgumentParser();parser.add_argument('--model',required=True);parser.add_argument('--out',required=True);parser.add_argument('--views',default='all');parser.add_argument('--clay',action='store_true');parser.add_argument('--night',action='store_true');parser.add_argument('--samples',type=int,default=16)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=args.model)
def point(p):return Vector((p[0],-p[2],p[1]))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Review sky');scene.world.color=(.055,.07,.1) if args.night else (.19,.24,.28);scene.view_settings.view_transform='AgX'
if args.clay:
    clay=bpy.data.materials.new('Neutral review clay');clay.diffuse_color=(.42,.43,.40,1)
    for obj in list(scene.objects):
        if obj.type=='MESH' and obj.get('kind') in ['concrete','wood','terrain','rock','house','roof']:
            obj.data.materials.clear();obj.data.materials.append(clay)
bpy.ops.object.light_add(type='SUN',location=point((-80,160,140)));sun=bpy.context.object;sun.data.energy=.5 if args.night else 2.2;sun.rotation_euler=(point((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.angle=math.radians(12)
if args.night:
    for foot,target,power in [((-70,4,30),(-25,8,0),35000),((70,14,25),(15,9,0),24000)]:
        terrain=next(obj for obj in scene.objects if obj.get('kind')=='terrain')
        hit,location,normal,index=terrain.ray_cast(Vector((foot[0],-foot[2],100)),Vector((0,0,-1)))
        if hit:foot=(foot[0],location.z+1.8,foot[2])
        bpy.ops.object.light_add(type='AREA',location=point(foot));light=bpy.context.object;light.data.energy=power;light.data.size=10;light.data.color=(1,.83,.60);light.rotation_euler=(point(target)-light.location).to_track_quat('-Z','Y').to_euler()
views={
 'front':((0,25,172),(0,8,-8),43),
 'left-oblique':((-105,52,110),(0,10,-20),41),
 'right-oblique':((122,48,114),(-5,8,-16),40),
 'upstream':((28,47,-141),(0,12,4),42),
 'profile':((-92,25,12),(-20,8,0),38),
 'aerial':((105,175,125),(0,8,-72),40),
 'walkway':((-69,18,5),(34,14,-2),36),
 'crest':((-67,45,-18),(0,11,-1),42),
}
for name,(eye,target,lens) in views.items():
    if args.views!='all' and name not in args.views.split(','):continue
    bpy.ops.object.camera_add(location=point(eye));camera=bpy.context.object;camera.rotation_euler=(point(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.camera=camera
    scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(camera,do_unlink=True)
print('STEWART_REVIEW_RENDERED',flush=True)
