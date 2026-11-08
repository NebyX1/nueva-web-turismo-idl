"""Photograph-led Stewart Vargas dam, authored in Blender, Y-up web coordinates.
blender --background --threads 8 --python scripts/stewart-vargas/build_model.py -- --out DIR
"""
import bpy, bmesh, math, random, json, argparse, sys
from pathlib import Path
from mathutils import Vector, Matrix

parser = argparse.ArgumentParser()
parser.add_argument('--out', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
rng = random.Random(1958)
CREST, LAKE, LENGTH, COUNT = 13.2, 13.035, 120.0, 18
PITCH = LENGTH / COUNT

def smooth(a, b, value):
    t = max(0, min(1, (value-a)/(b-a))); return t*t*(3-2*t)

def world(p): return (p[0], -p[2], p[1])

def shore(z):
    keys = [(-225, 3), (-215, 29), (-190, 70), (-150, 111), (-100, 119), (-50, 106), (-12, 70), (-4.42, 60)]
    center = 7*math.sin((z+5)*.016)+5*math.sin((z+7)*.034)*smooth(-225,-205,z)
    for (a, w), (b, v) in zip(keys, keys[1:]):
        if z <= b:
            t = smooth(a, b, z)
            irregular=(3.8*math.sin(z*.052+.6)+1.8*math.sin(z*.13)+.8*math.sin(z*.31))*smooth(-225,-207,z)*(1-smooth(-17,-4.4,z))
            return center, w+(v-w)*t+irregular
    return center, 60

def toe(x): return .28+11.45*smooth(-22, 64, x)**1.65

def brook(z):
    center = -43 - .24*(z-14) + 4*math.sin((z-14)*.05)
    width = 5.1+20*math.exp(-((z-16)/17)**2)
    return center, width

def ground(x, z):
    broad = 14.4 + math.sin(x*.021+z*.009)*1.7 + math.cos(z*.027)*1.1
    broad += 15*math.exp(-((x+170)/65)**2-((z+102)/90)**2)
    broad += 9*math.exp(-((x-60)/130)**2-((z+228)/50)**2)
    if z >= -5.5:
        low = toe(x)+.018*max(0,z-10)
        low += 14*math.exp(-((x+92)/30)**2-((z-10)/58)**2)
        low += 5*math.exp(-((x-100)/70)**2-((z-85)/65)**2)
        side = smooth(59, 81, abs(x))
        h = low*(1-side)+broad*side
        if z < -2.7: h = h*(1-smooth(-5.5,-2.7,z))+low*smooth(-5.5,-2.7,z)
        if z > 9:
            cx, width = brook(z)
            cut = (1-smooth(width-1,width+5,abs(x-cx)))*smooth(8.5,11.5,z)
            bed = .08 + .12*math.sin(z*.07)**2
            h = h*(1-cut)+bed*cut
    else:
        cx, width = shore(max(-225,min(-5.3,z)))
        bank = abs(x-cx)-width
        inside = 11.3 + .20*math.sin(x*.1)*math.sin(z*.07)
        blend = smooth(-2,7,bank)
        h = inside*(1-blend)+max(broad,14.1)*blend
        if z < -225: h = broad
    # A broad irregular patch meets the existing flattened world without a disc.
    feather = smooth(0,22,min(240-abs(x),z+248,181-z))
    return max(.02,h*feather)

def material(name, color, rough=.85, metallic=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1)
    s.inputs['Roughness'].default_value=rough;s.inputs['Metallic'].default_value=metallic
    return m

materials={
 'concrete':material('Hormigón gris pardo envejecido',(.32,.30,.235)),
 'wood':material('Madera rojiza oscura',(.19,.067,.043)),
 'metal':material('Malla y uniones galvanizadas',(.34,.37,.34),.7,.35),
 'terrain':material('Pradera serrana',(.20,.27,.105)),
 'rock':material('Estribo de roca serrana',(.30,.32,.265)),
 'lake':material('Embalse verde azulado',(.035,.12,.105),.19,.12),
 'flow':material('Agua de los canales',(.64,.77,.73),.32,.06),
 'brook':material('Cauce de salida',(.055,.13,.105),.24,.08),
 'reed':material('Juncos de la ribera',(.32,.35,.12)),
 'plants':material('Vegetación acuática dispersa',(.18,.32,.07)),
 'roof':material('Techos lejanos',(.14,.12,.085)),
 'house':material('Casas en la ladera',(.49,.43,.29)),
 'foliage':material('Monte nativo',(.10,.19,.055)),
}
# Offline water is a procedural approximation of the live GLSL material.
for kind in ['lake','flow','brook']:
    m=materials[kind];nodes=m.node_tree.nodes;links=m.node_tree.links;shader=nodes.get('Principled BSDF')
    coords=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY'
    mapping.inputs[1].default_value=(18,44,1) if kind=='flow' else (.7,.7,.7)
    links.new(coords.outputs['UV'],mapping.inputs[0]);noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1;noise.inputs['Detail'].default_value=2;links.new(mapping.outputs[0],noise.inputs['Vector'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=.045;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],shader.inputs['Normal'])
    if kind=='flow':
        sep=nodes.new('ShaderNodeSeparateXYZ');links.new(coords.outputs['UV'],sep.inputs[0])
        ramp=nodes.new('ShaderNodeMath');ramp.operation='MULTIPLY';links.new(sep.outputs['Y'],ramp.inputs[0]);links.new(noise.outputs['Fac'],ramp.inputs[1])
        gain=nodes.new('ShaderNodeMath');gain.operation='MULTIPLY_ADD';gain.inputs[1].default_value=1.5;gain.inputs[2].default_value=.15;links.new(ramp.outputs[0],gain.inputs[0])
        mix=nodes.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.05,.12,.09,1);mix.inputs[2].default_value=(.82,.91,.86,1);links.new(gain.outputs[0],mix.inputs[0]);links.new(mix.outputs[0],shader.inputs['Base Color'])
# Native editable materials; the web uses the same palette and its own flow clock.
for kind in ['concrete','wood','rock']:
    m=materials[kind];nodes=m.node_tree.nodes;links=m.node_tree.links
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=4 if kind!='wood' else 12;noise.inputs['Detail'].default_value=2
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.035
    links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],nodes.get('Principled BSDF').inputs['Normal'])
for kind in ['terrain','concrete']:
    m=materials[kind];node=m.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='LandscapeColor';m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    if kind=='concrete':
        noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.4;noise.inputs['Detail'].default_value=3
        ramp=m.node_tree.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.61,.64,.60,1);ramp.color_ramp.elements[1].color=(1.08,1.02,.91,1)
        m.node_tree.links.new(noise.outputs['Fac'],ramp.inputs['Fac'])
        multiply=m.node_tree.nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
        m.node_tree.links.new(node.outputs['Color'],multiply.inputs[1]);m.node_tree.links.new(ramp.outputs['Color'],multiply.inputs[2]);m.node_tree.links.new(multiply.outputs[0],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

fence=material('Malla fina de la pasarela',(.42,.43,.39),.65,.4)
image=bpy.data.images.new('Malla propia 16px',width=16,height=16,alpha=True)
pixels=[]
for y in range(16):
    for x in range(16):pixels.extend((.55,.57,.52,1 if x==0 or y==0 else 0))
image.pixels.foreach_set(pixels);image.pack()
texture=fence.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image;texture.extension='REPEAT'
fence.node_tree.links.new(texture.outputs['Alpha'],fence.node_tree.nodes.get('Principled BSDF').inputs['Alpha'])
fence.surface_render_method='DITHERED';materials['fence']=fence

objects=[]
def make_mesh(name, vertices, faces, kind, uvs=None, smooth_faces=False):
    data=bpy.data.meshes.new(name);data.from_pydata([world(v) for v in vertices],[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    for polygon in data.polygons:polygon.use_smooth=smooth_faces
    if uvs:
        uv=data.uv_layers.new(name='UVMap')
        for loop in data.loops:uv.data[loop.index].uv=uvs[loop.vertex_index]
    if kind in ['terrain','rock','concrete']:
        attr=data.color_attributes.new(name='LandscapeColor',type='FLOAT_COLOR',domain='POINT')
        for vertex in data.vertices:
            x,y,z=vertex.co.x,vertex.co.z,-vertex.co.y
            n=.5+.25*math.sin(x*.31+z*.17)+.25*math.sin(z*.67-y*.38)
            if kind=='terrain':
                wet=1-smooth(1,4,y);col=(.17+n*.075,.23+n*.09,.08+n*.035)
                col=tuple(v*(1-wet*.12) for v in col)
            elif kind=='concrete':
                wet=(1-smooth(2,8,y))*.16;col=(.19+n*.075-wet*.3,.177+n*.07-wet*.1,.13+n*.06-wet*.2)
            else:col=(.25+n*.13,.27+n*.12,.225+n*.1)
            attr.data[vertex.index].color=(*col,1)
    data.materials.append(materials[kind]);obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj['kind']=kind;objects.append(obj);return obj

def box(name,center,size,kind):
    x,y,z=center;dx,dy,dz=[s*.5 for s in size]
    p=[(x+a*dx,y+b*dy,z+c*dz) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    return make_mesh(name,p,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(1,2,6,5),(0,4,7,3)],kind)

def beam(name,a,b,width,depth,kind):
    a,b=Vector(a),Vector(b);direction=(b-a).normalized();side=Vector((1,0,0))
    if abs(direction.dot(side))>.95:side=Vector((0,0,1))
    side=direction.cross(side).normalized()*width*.5;other=direction.cross(side).normalized()*depth*.5
    p=[tuple(c+side*s+other*t) for c in [a,b] for s,t in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    return make_mesh(name,p,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],kind)

# One continuous landscape. Row/column order gives upward-facing ground.
vertices=[];faces=[];NX,NZ=160,144
for j in range(NZ+1):
    z=-248+j*429/NZ
    for i in range(NX+1):
        x=-240+i*480/NX;vertices.append((x,ground(x,z),z))
for j in range(NZ):
    for i in range(NX):
        a=j*(NX+1)+i;faces.append((a,a+NX+1,a+NX+2,a+1))
make_mesh('Valle continuo del embalse y la pradera',vertices,faces,'terrain',smooth_faces=True)

modules=[];active=[]
for i in range(COUNT):
    center=-60+(i+.5)*PITCH;x0=center-(PITCH-1.12)/2;x1=center+(PITCH-1.12)/2
    bed=ground(center,10);bottom=bed-.65;front=10.0
    # Dent the upstream crown in plan; leave a broad flat downstream plane.
    # The narrow water channel is genuinely recessed below these heavy cheeks.
    p=[(x0,CREST,-4.4),(center,CREST,-2.4),(x1,CREST,-4.4),(x1,CREST,-.35),(x0,CREST,-.35),
       (x0,bottom,-4.4),(center,bottom,-2.4),(x1,bottom,-4.4),(x1,bed,front),(x0,bed,front)]
    obj=make_mesh(f'Paño inclinado {i+1:02d} — coronamiento dentado',p,[(0,1,2,3,4),(9,8,7,6,5),(0,5,6,1),(1,6,7,2),(2,7,8,3),(3,8,9,4),(4,9,5,0)],'concrete')
    bevel=obj.modifiers.new('Aristas de hormigón discretamente suavizadas','BEVEL');bevel.width=.055;bevel.segments=2
    modules.append({'x':center,'toeY':bed,'crestY':CREST,'width':PITCH-1.12})

# The channel backing is real geometry, shared with the water's sampled shape.
def chute_y(x,z):
    bed=ground(x,10)
    if z < -1.65:return 12.965
    t=max(0,min(1,(z+1.65)/11.65))
    return bed+.035+(12.965-bed-.035)*(1-t)

for i in range(COUNT-1):
    x=-60+(i+1)*PITCH;wet=i<6;half=.54
    p=[];f=[];uv=[]
    for j in range(65):
        z=-5.3+j*15.3/64
        for side in [-1,1]:p.append((x+side*half,chute_y(x,z),z));uv.append((0 if side<0 else 1,j/64))
        if j:
            a=(j-1)*2;f.append((a,a+2,a+3,a+1))
    # Solidify downward so dry channels have thickness and visible edge normals.
    channel=make_mesh(f'Canal estrecho {i+1:02d} — lecho',p,f,'concrete',uv)
    solid=channel.modifiers.new('Lecho macizo','SOLIDIFY');solid.thickness=.24;solid.offset=-1
    if wet:
        p=[];uv=[];f=[];width=.46+(.025 if i%2 else 0)
        for j in range(65):
            t=j/64;z=-5.3+t*15.3;spread=.60+.4*smooth(.35,1,t)
            for col in range(5):
                across=col/4;xx=x+(across*2-1)*width*spread
                p.append((xx,chute_y(x,z)+.042,z));uv.append((across,t))
                if j and col:
                    a=(j-1)*5+col-1;f.append((a,a+5,a+6,a+1))
        make_mesh(f'Cinta de agua {i+1:02d}',p,f,'flow',uv,smooth_faces=True)
        active.append({'x':x,'width':width*2,'toeY':chute_y(x,10),'startZ':-5.3,'endZ':10})

# Modern narrow reddish walkway, with a slight continuation beyond the wall.
DECK=14.18;SPAN=128.4
box('Viga longitudinal aguas arriba',(0,DECK-.20,-2.42),(SPAN,.28,.16),'wood')
box('Viga longitudinal aguas abajo',(0,DECK-.20,-.42),(SPAN,.28,.16),'wood')
for i in range(573):
    x=-SPAN/2+(i+.5)*SPAN/573
    box(f'Tablón de la pasarela {i:03d}',(x,DECK-.055,-1.42),(SPAN/573-.014,.11,2.12),'wood')
for item in modules:
    x=item['x']
    for z in [-2.17,-.67]:box('Apoyo corto de la pasarela',(x,13.61,z),(.24,.82,.24),'concrete')
    box('Travesaño bajo deck',(x,DECK-.31,-1.42),(.18,.16,2.5),'wood')
for side in [-1,1]:
    footZ=-1.42+side*1.04;topZ=-1.42+side*1.46
    for i in range(108):
        x=-SPAN/2+i*SPAN/107
        beam('Puntal inclinado repetido',(x,DECK-.07,footZ),(x,DECK+1.18,topZ),.10,.10,'wood')
    box('Pasamanos largo',(0,DECK+1.18,topZ),(SPAN,.10,.13),'wood')
    # UVs repeat a locally generated one-cell wire texture, not a photograph.
    make_mesh('Malla fina de la baranda',[(-SPAN/2,DECK+.08,footZ+side*.04),(SPAN/2,DECK+.08,footZ+side*.04),(SPAN/2,DECK+1.12,topZ),(-SPAN/2,DECK+1.12,topZ)],[(0,1,2,3)],'fence',[(0,0),(SPAN/.13,0),(SPAN/.13,8),(0,8)])

# Clip water polygons against the very same terrain triangles. This gives
# continuous shore contact rather than separate painted strips or floating rims.
def clipped_water(name,kind,height,zmin,zmax,lateral):
    points=[];polygons=[];uv=[]
    cuts=[lambda p:p.z-zmin,lambda p:zmax-p.z,lateral,lambda p:height(p.z)-p.y]
    for face in faces:
        for ids in [(face[0],face[1],face[2]),(face[0],face[2],face[3])]:
            original=[Vector(vertices[i]) for i in ids]
            if max(p.z for p in original)<zmin or min(p.z for p in original)>zmax:continue
            polygon=original
            for distance in cuts:
                clipped=[]
                for a,b in zip(polygon,polygon[1:]+polygon[:1]):
                    da,db=distance(a),distance(b);ain=da>=0;bin=db>=0
                    if ain:clipped.append(a)
                    if ain!=bin:clipped.append(a.lerp(b,da/(da-db)))
                polygon=clipped
                if not polygon:break
            if len(polygon)<3:continue
            start=len(points)
            for p in polygon:points.append((p.x,height(p.z)+.008,p.z));uv.append((p.x/12,p.z/12))
            for i in range(1,len(polygon)-1):polygons.append((start,start+i,start+i+1))
    return make_mesh(name,points,polygons,kind,uv,smooth_faces=True)

clipped_water('Embalse amplio recortado contra la ribera','lake',lambda z:LAKE,-224.7,-4.42,lambda p:shore(p.z)[1]+6-abs(p.x-shore(p.z)[0]))
clipped_water('Cauce colector continuo y arroyo de salida','brook',lambda z:.38-.13*smooth(27,100,z),9.85,167,lambda p:brook(p.z)[1]-abs(p.x-brook(p.z)[0]))

# Fill the crown's alternating upstream recesses at the reservoir level.
# These small triangles/strips meet the retaining faces instead of leaving a
# straight artificial gap between a rectangular lake edge and the dented wall.
lip=[];lipfaces=[];lipuv=[]
for item in modules:
    x=item['x'];half=item['width']/2;b=len(lip)
    points=[(x-half,LAKE,-4.42),(x,LAKE,-2.42),(x+half,LAKE,-4.42)]
    lip.extend(points);lipuv.extend([(p[0]/12,p[2]/12) for p in points]);lipfaces.append((b,b+1,b+2))
for i in range(COUNT-1):
    x=-60+(i+1)*PITCH;b=len(lip)
    points=[(x-.56,LAKE,-4.42),(x-.56,LAKE,-1.67),(x+.56,LAKE,-1.67),(x+.56,LAKE,-4.42)]
    lip.extend(points);lipuv.extend([(p[0]/12,p[2]/12) for p in points]);lipfaces.append((b,b+1,b+2,b+3))
make_mesh('Embalse entre los dientes del coronamiento',lip,lipfaces,'lake',lipuv,smooth_faces=True)

# Riparian tufts. Mesh leaves provide volume rather than discs on the lake.
reedp=[];reedf=[];plantp=[];plantf=[]
for i in range(190):
    z=rng.uniform(-218,-12);cx,width=shore(z);side=-1 if i%2 else 1
    x=cx+side*(width+rng.uniform(-.3,3));y=ground(x,z)
    for k in range(5):
        a=rng.random()*math.tau;dx,dz=math.cos(a),math.sin(a);height=rng.uniform(.8,1.65);base=len(reedp)
        reedp.extend([(x-.035,y,z),(x+.035,y,z),(x+dx*.35,y+height,z+dz*.35)])
        reedf.append((base,base+1,base+2))
for i in range(140):
    z=rng.uniform(-208,-19);cx,width=shore(z);x=cx+rng.uniform(-.9,.9)*width
    if rng.random()>.55 and abs(x-cx)<width*.6:continue
    for k in range(9):
        a=rng.random()*math.tau;r=rng.uniform(.2,1.4);xx=x+math.cos(a)*r;zz=z+math.sin(a)*r
        b=len(plantp);w=rng.uniform(.12,.25)
        plantp.extend([(xx-w,LAKE+.055,zz),(xx,LAKE+.075,zz+.38),(xx+w,LAKE+.055,zz),(xx,LAKE+.06,zz-.38)])
        plantf.append((b,b+1,b+2,b+3))
make_mesh('Juncos enraizados en las orillas',reedp,reedf,'reed')
make_mesh('Manchas dispersas de vegetación acuática',plantp,plantf,'plants')

# A photographed rocky/wooded side and a noticeably more open meadow side.
shrubs=[]
for attempt in range(2800):
    if len(shrubs)>=215:break
    x=rng.uniform(-190,165);z=rng.uniform(-225,165)
    if abs(x)<69 and -9<z<25:continue
    if x>0 and z>5 and rng.random()<.95:continue
    if z<-6:
        cx,width=shore(z)
        if abs(x-cx)<width+5:continue
    else:
        cx,width=brook(z)
        if abs(x-cx)<width+3:continue
    if x>-68 and z>-5:continue
    size=rng.uniform(2.2,4.9);y=ground(x,z);shrubs.append([x,y,z,size,rng.random()*math.tau,rng.random()])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=world((x,y+size*.85,z)))
    obj=bpy.context.object;obj.name='Monte serrano sobre la margen rocosa';obj.scale=(size,size*.85,size*1.15);obj.data.materials.append(materials['foliage']);obj['kind']='foliage';obj['skip_raw']=True

for i in range(38):
    x=rng.uniform(-105,-67);z=rng.uniform(-8,65);size=rng.uniform(1.2,3.4)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=world((x,ground(x,z)+size*.25,z)))
    obj=bpy.context.object;obj.name='Roca de estribo';obj.scale=(size*1.6,size,size*.65);obj.data.materials.append(materials['rock']);obj['kind']='rock';objects.append(obj)

# Dense monte belongs to the western abutment, leaving the spillway face clear.
for i in range(95):
    x=rng.uniform(-120,-82);z=rng.uniform(-4,76);size=rng.uniform(2,4.2);y=ground(x,z)
    shrubs.append([x,y,z,size,rng.random()*math.tau,rng.random()])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=world((x,y+size*.85,z)))
    obj=bpy.context.object;obj.name='Monte denso del estribo occidental';obj.scale=(size,size*.85,size*1.15);obj.data.materials.append(materials['foliage']);obj['kind']='foliage';obj['skip_raw']=True

# Distant generic houses only; not presented as surveyed heritage buildings.
for i,(x,z) in enumerate([(-105,-205),(-48,-234),(50,-226),(113,-180),(161,-112)]):
    y=ground(x,z);w=6.5+i%2;d=5.2
    box('Casa lejana de la ladera',(x,y+2.1,z),(w,4.2,d),'house')
    p=[(x-w*.58,y+4.2,z-d*.62),(x+w*.58,y+4.2,z-d*.62),(x+w*.58,y+4.2,z+d*.62),(x-w*.58,y+4.2,z+d*.62),(x,y+6.3,z-d*.62),(x,y+6.3,z+d*.62)]
    make_mesh('Cubierta sencilla lejana',p,[(0,3,5,4),(4,5,2,1),(0,4,1),(3,2,5)],'roof')

# Export exactly evaluated geometry, with modifiers and split face normals.
parts={};deps=bpy.context.evaluated_depsgraph_get()
for obj in objects:
    if obj.get('skip_raw'):continue
    evaluated=obj.evaluated_get(deps);data=evaluated.to_mesh();data.calc_loop_triangles()
    kind=obj['kind'];bucket=parts.setdefault(kind,{'name':kind,'kind':kind,'positions':[],'normals':[],'uv':[],'colors':[],'indices':[],'lookup':{}})
    uv=data.uv_layers.active;colors=data.color_attributes.get('LandscapeColor');normalmatrix=obj.matrix_world.to_3x3().inverted().transposed()
    for triangle in data.loop_triangles:
        for li in triangle.loops:
            loop=data.loops[li];v=data.vertices[loop.vertex_index];p=obj.matrix_world@v.co;n=(normalmatrix@data.corner_normals[li].vector).normalized()
            tex=tuple(uv.data[li].uv) if uv else (0,0);color=tuple(colors.data[loop.vertex_index].color[:3]) if colors else (1,1,1)
            position=(p.x,p.z,-p.y);normal=(n.x,n.z,-n.y);key=tuple(round(f,6) for f in (*position,*normal,*tex,*color))
            index=bucket['lookup'].get(key)
            if index is None:
                index=len(bucket['positions'])//3;bucket['lookup'][key]=index
                bucket['positions'].extend(position);bucket['normals'].extend(normal);bucket['uv'].extend(tex);bucket['colors'].extend(color)
            bucket['indices'].append(index)
    evaluated.to_mesh_clear()
raw=[]
for part in parts.values():del part['lookup'];raw.append(part)
landscape={'crestY':CREST,'lakeLevel':LAKE,'length':LENGTH,'moduleCount':COUNT,'modules':modules,'activeChannels':active,'shrubs':shrubs,'deckY':DECK,'deckSpan':SPAN,'interpretation':'Photograph-led proportional reconstruction; not a measured survey. Modern walkway, unequal bank heights, moderate flow.'}
(out/'raw.json').write_text(json.dumps({'meshes':raw,'landscape':landscape},separators=(',',':')),encoding='utf8')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'stewart-vargas.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'stewart-vargas.glb'),export_format='GLB',export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
print('STEWART_VARGAS_AUTHORED',len(raw),'batches',sum(len(p['indices'])//3 for p in raw),'triangles',len(shrubs),'shrubs',flush=True)
