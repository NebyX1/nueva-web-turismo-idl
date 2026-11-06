"""Render exact decoded Three geometry; approximate its procedural water offline."""
import bpy,json,sys,argparse,math
from pathlib import Path
from mathutils import Vector,Matrix

parser=argparse.ArgumentParser();parser.add_argument('--scene',required=True);parser.add_argument('--out',required=True);parser.add_argument('--views',default='all');parser.add_argument('--clay',action='store_true');parser.add_argument('--time',type=float,default=0);parser.add_argument('--night',action='store_true');parser.add_argument('--web-scale',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
source=json.loads(Path(args.scene).read_text());conversion=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))

def constant(material,color,roughness=.9):
    material.use_nodes=True;shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*color,1);shader.inputs['Roughness'].default_value=roughness
    return shader

def water_material(kind):
    mat=bpy.data.materials.new('Offline approximation of '+kind);shader=constant(mat,(.35,.45,.4),.40 if kind=='falls' else .22)
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    attr=nodes.new('ShaderNodeAttribute');attr.attribute_name='Flow'
    sep=nodes.new('ShaderNodeSeparateXYZ');links.new(attr.outputs['Vector'],sep.inputs[0])
    combine=nodes.new('ShaderNodeCombineXYZ')
    for axis,scale,offset in [('X',19 if kind=='falls' else .72,0),('Y',2.5 if kind=='falls' else .72,-args.time*(2.5 if kind=='falls' else .12))]:
        multiply=nodes.new('ShaderNodeMath');multiply.operation='MULTIPLY_ADD';multiply.inputs[1].default_value=scale;multiply.inputs[2].default_value=offset;links.new(sep.outputs[axis],multiply.inputs[0]);links.new(multiply.outputs[0],combine.inputs[axis])
    texture=nodes.new('ShaderNodeTexNoise');texture.inputs['Scale'].default_value=1;texture.inputs['Detail'].default_value=2;texture.inputs['Roughness'].default_value=.5;links.new(combine.outputs[0],texture.inputs['Vector'])
    ramp=nodes.new('ShaderNodeValToRGB')
    if kind=='falls':
        ramp.color_ramp.elements[0].position=.30;ramp.color_ramp.elements[0].color=(.035,.075,.055,1)
        ramp.color_ramp.elements[1].position=.80;ramp.color_ramp.elements[1].color=(.84,.91,.85,1)
    else:
        ramp.color_ramp.elements[0].color=(.025,.061,.047,1);ramp.color_ramp.elements[1].color=(.06,.11,.08,1)
    if kind=='falls':
        shift=nodes.new('ShaderNodeMath');shift.operation='MULTIPLY_ADD';shift.inputs[1].default_value=.55;shift.inputs[2].default_value=-.35;links.new(sep.outputs['Z'],shift.inputs[0])
        add=nodes.new('ShaderNodeMath');add.operation='ADD';links.new(texture.outputs['Fac'],add.inputs[0]);links.new(shift.outputs[0],add.inputs[1]);links.new(add.outputs[0],ramp.inputs['Fac'])
    else:links.new(texture.outputs['Fac'],ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'],shader.inputs['Base Color'])
    if kind=='pool':
        position=nodes.new('ShaderNodeNewGeometry');distance=nodes.new('ShaderNodeVectorMath');distance.operation='DISTANCE'
        impact=source['impact'];distance.inputs[1].default_value=(impact[0],-impact[2],impact[1]);links.new(position.outputs['Position'],distance.inputs[0])
        squared=nodes.new('ShaderNodeMath');squared.operation='MULTIPLY';links.new(distance.outputs['Value'],squared.inputs[0]);links.new(distance.outputs['Value'],squared.inputs[1])
        negative=nodes.new('ShaderNodeMath');negative.operation='MULTIPLY';negative.inputs[1].default_value=-.22;links.new(squared.outputs[0],negative.inputs[0])
        fade=nodes.new('ShaderNodeMath');fade.operation='EXPONENT';links.new(negative.outputs[0],fade.inputs[0])
        strength=nodes.new('ShaderNodeMath');strength.operation='MULTIPLY';strength.inputs[1].default_value=.62;links.new(fade.outputs[0],strength.inputs[0])
        mix=nodes.new('ShaderNodeMixRGB');mix.inputs[2].default_value=(.65,.74,.68,1);links.new(strength.outputs[0],mix.inputs[0]);links.new(ramp.outputs['Color'],mix.inputs[1]);links.new(mix.outputs[0],shader.inputs['Base Color'])
    # A flow attribute is retained in the scene. GLSL noise/Fresnel are not
    # claimed to be executed here; topology and contacts are exact.
    return mat

clay=bpy.data.materials.new('Neutral clay');constant(clay,(.47,.48,.46))
claywater=bpy.data.materials.new('Neutral water distinction');constant(claywater,(.25,.36,.36),.35)
for part in source['parts']:
    if args.clay and part['kind']=='foliage':continue
    p=part['positions'];n=part['normals'];vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
    normals=[Vector((n[i],-n[i+2],n[i+1])).normalized() for i in range(0,len(n),3)]
    index=part['indices'] or list(range(len(vertices)));mesh=bpy.data.meshes.new(part['name']);mesh.from_pydata(vertices,[],[index[i:i+3] for i in range(0,len(index),3)]);mesh.update()
    for face in mesh.polygons:face.use_smooth=True
    mesh.normals_split_custom_set_from_vertices(normals)
    if part['flow']:
        attr=mesh.attributes.new('Flow','FLOAT_VECTOR','POINT');attr.data.foreach_set('vector',part['flow'])
    if args.clay:mat=claywater if part['kind'] in ['falls','pool'] else clay
    elif part['kind']=='rock':
        mat=bpy.data.materials.new(part['name']);shader=constant(mat,(.4,.4,.4));attr=mesh.color_attributes.new(name='RockColor',type='FLOAT_COLOR',domain='POINT');c=part['colors'];attr.data.foreach_set('color',[v for i in range(0,len(c),3) for v in (*c[i:i+3],1)])
        nodes=mat.node_tree.nodes;links=mat.node_tree.links
        node=nodes.new('ShaderNodeVertexColor');node.layer_name='RockColor'
        position=nodes.new('ShaderNodeNewGeometry');grain=nodes.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=8;grain.inputs['Detail'].default_value=2;links.new(position.outputs['Position'],grain.inputs['Vector'])
        threshold=nodes.new('ShaderNodeMapRange');threshold.inputs['From Min'].default_value=.62;threshold.inputs['From Max'].default_value=.77;threshold.inputs['To Max'].default_value=.42;links.new(grain.outputs['Fac'],threshold.inputs['Value'])
        mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[2].default_value=(.52,.54,.45,1);links.new(node.outputs['Color'],mix.inputs[1]);links.new(threshold.outputs['Result'],mix.inputs[0]);links.new(mix.outputs[0],shader.inputs['Base Color'])
    elif part['kind']=='foliage':
        mat=bpy.data.materials.new('Native serrano vegetation');shader=constant(mat,(.1,.15,.05));node=mat.node_tree.nodes.new('ShaderNodeObjectInfo');mat.node_tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
    else:mat=water_material(part['kind'])
    mesh.materials.append(mat)
    if 'instances' in part:
        for instance in part['instances']:
            obj=bpy.data.objects.new(part['name'],mesh);bpy.context.collection.objects.link(obj)
            m=instance['matrix'];matrix=Matrix(tuple(tuple(m[col*4+row] for col in range(4)) for row in range(4)))
            obj.matrix_world=conversion@matrix@conversion.inverted();obj.color=(*instance['color'],1)
    else:
        obj=bpy.data.objects.new(part['name'],mesh);bpy.context.collection.objects.link(obj)
        if part['kind']!='rock':obj.visible_shadow=False

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1440;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Neutral sky');scene.world.color=(.12,.14,.16);scene.view_settings.view_transform='AgX'
if args.web_scale:scene.render.resolution_x=1440;scene.render.resolution_y=810
if args.night:scene.world.color=(.025,.04,.07)
for pos,energy,size in [((60,-80,105),70000,28),((-75,-15,85),18000,45),((0,75,70),12000,38)]:
    bpy.ops.object.light_add(type='AREA',location=pos);obj=bpy.context.object;obj.data.energy=energy*(.42 if args.night else 1);obj.data.size=size;obj.rotation_euler=(Vector((0,0,24))-obj.location).to_track_quat('-Z','Y').to_euler()
    if args.night:obj.data.color=(.83,.90,1)

views={
 'front':((1,12,82),(0,24,-2),32),
 'right-oblique':((53,32,68),(-1,25,4),44),
 'left-oblique':((-48,44,66),(0,25,4),38),
 'aerial':((90,143,118),(0,21,3),42),
 'upstream':((-4,68,-58),(0,24,15),38),
 'outlet':((8,10,92),(-3,12,30),45),
 'close':((2,10,55),(-1,23,-2),42),
 'tour':((14.87,14,123.91),(0,25,5),44),
 'tour-top':((42.45,18.32,127.52),(0,69.12,5),44),
}
for name,(eye,target,lens) in views.items():
    if args.views!='all' and name not in args.views.split(','):continue
    e=Vector((eye[0],-eye[2],eye[1]));t=Vector((target[0],-target[2],target[1]))
    bpy.ops.object.camera_add(location=e);camera=bpy.context.object;camera.rotation_euler=(t-e).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens
    if args.web_scale and name.startswith('tour'):
        camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(44)/2));camera.data.shift_x=-.13*1280/720
    scene.camera=camera;scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(camera,do_unlink=True)
print('PENITENTE_EXACT_GEOMETRY_REVIEW_COMPLETE',flush=True)
