"""Review the exact packed mesh consumed by Three.js, with neutral CPU lighting."""
import bpy, json, base64, struct, argparse, sys
from pathlib import Path
from mathutils import Vector

parser=argparse.ArgumentParser();parser.add_argument('--asset',required=True);parser.add_argument('--out',required=True);parser.add_argument('--views',default='all');parser.add_argument('--isolate-hand',choices=['low','high']);parser.add_argument('--web-scale',action='store_true');parser.add_argument('--web-size',default='646x436');parser.add_argument('--night',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)

def complete_hand(vertices,faces,which):
    # Select whole welded components. A bent fingertip can cross the height of
    # the other wrist; clipping faces by height would falsely amputate it.
    lookup={};remap=[];parent=[]
    for point in vertices:
        key=tuple(round(v,6) for v in point)
        if key not in lookup:lookup[key]=len(parent);parent.append(len(parent))
        remap.append(lookup[key])
    def root(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for face in faces:
        first=root(remap[face[0]])
        for i in face[1:]:parent[root(remap[i])]=first
    heights={}
    for i,point in enumerate(vertices):heights.setdefault(root(remap[i]),[]).append(point[2])
    assert len(heights)==2,'Hands must have exactly two complete components'
    ordered=sorted(heights,key=lambda r:sum(heights[r])/len(heights[r]))
    selected=ordered[0 if which=='low' else 1]
    return [face for face in faces if root(remap[face[0]])==selected]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
asset=json.loads(Path(args.asset).read_text())
for part in asset['groups']:
    if args.isolate_hand and part['name']!='Manos y dedos de Artigas':continue
    q=struct.unpack('<'+'H'*(part['vertices']*3),base64.b64decode(part['positions']))
    n=struct.unpack('<'+'b'*(part['vertices']*3),base64.b64decode(part['normals']))
    p=[part['min'][i%3]+v/65535*part['extent'][i%3] for i,v in enumerate(q)]
    vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
    normals=[Vector((n[i],-n[i+2],n[i+1])).normalized() for i in range(0,len(n),3)]
    index=struct.unpack('<'+('H' if part['indexBytes']==2 else 'I')*(part['triangles']*3),base64.b64decode(part['indices']))
    faces=[index[i:i+3] for i in range(0,len(index),3)]
    if args.isolate_hand:faces=complete_hand(vertices,faces,args.isolate_hand)
    data=bpy.data.meshes.new(part['name']);data.from_pydata(vertices,[],faces);data.update()
    for f in data.polygons:f.use_smooth=True
    data.normals_split_custom_set_from_vertices(normals)
    item=bpy.data.objects.new(part['name'],data);bpy.context.collection.objects.link(item)
    mat=bpy.data.materials.new(part['name']);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*part['color'],1);bsdf.inputs['Roughness'].default_value=part['roughness'];data.materials.append(mat)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1080;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.world.color=(.28,.28,.28);scene.view_settings.view_transform='AgX'
if args.web_scale:scene.render.resolution_x,scene.render.resolution_y=map(int,args.web_size.split('x'))
if args.night:scene.world.color=(.008,.014,.025)
for at,energy,size in [((-10,-12,22),2400,9),((6,8,17),1800,8),((10,-2,12),900,7)]:
    bpy.ops.object.light_add(type='AREA',location=at);o=bpy.context.object;o.data.energy=energy*(.45 if args.night else 1);o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,7))-o.location).to_track_quat('-Z','Y').to_euler()
    if args.night:o.data.color=(1,.90,.72)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.25));floor=bpy.context.object
mat=bpy.data.materials.new('Suelo neutro');mat.diffuse_color=(.22,.25,.25,1);floor.data.materials.append(mat)
views={
 'side':((0,-30,9),(0,0,7),50,18),'other-side':((0,30,9),(0,0,7),50,18),
 'front':((-30,0,9),(-1,0,7.4),50,18),'three-quarter':((-20,-25,12),(0,0,7.3),52,None),
 'rear':((27,-5,11),(1,0,7.3),50,18),'head-front':((-10.5,-.1,14.1),(-.65,0,13.1),70,None),
 'head-three-quarter':((-7,-6.5,14.4),(-.5,0,13.1),65,None),
 'head-low-front':((-10,0,11.6),(-.65,0,13.2),70,None),'head-low-quarter':((-7,-7,12.0),(-.5,0,13.2),65,None),
 'low-hand-dorsal':((-5.0,-4.0,12.5),(-2.40,-1.0,10.35),80,None),
 'low-hand-palm':((-4.0,1.8,8.9),(-2.40,-1.0,10.35),80,None),
 'low-hand-side':((-5.4,-1.0,10.7),(-2.40,-1.0,10.35),95,None),
 'high-hand-dorsal':((-5.5,-2.2,12.0),(-1.65,-.1,11.42),85,None),
 'high-hand-palm':((.8,-2.0,11.7),(-1.65,-.1,11.42),85,None),
 'high-hand-side':((-3.0,-3.8,10.8),(-1.65,-.1,11.42),85,None),
 'user-angle':((-28,-18,.8),(0,0,7.6),60,None),
}
for name,(eye,target,lens,ortho) in views.items():
    if args.views!='all' and name not in args.views.split(','):continue
    bpy.ops.object.camera_add(location=eye);camera=bpy.context.object;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens
    if args.web_scale and name=='user-angle':camera.data.lens=42*646/scene.render.resolution_x
    if ortho:camera.data.type='ORTHO';camera.data.ortho_scale=ortho
    scene.camera=camera;scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(camera,do_unlink=True)
print('PACKED_ARTIGAS_REVIEW_DONE',asset['sourceSha256'],flush=True)
