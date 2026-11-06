"""Author the replacement sculpture in Blender; no browser or previous sculpture.

Run: blender --background --python scripts/artigas/build_artigas.py -- --out DIR
Sources: assets/artigas/source (CC0 horse and MakeHuman mesh/shape targets).
Blender Z-up is converted to Three.js Y-up by the export step.
"""
import bpy
import math
import json
import sys
import argparse
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/artigas/source'
args = argparse.ArgumentParser()
args.add_argument('--out', required=True)
args.add_argument('--views', default='all')
args.add_argument('--cloth-steps',type=int,default=48)
ARGS = args.parse_args(sys.argv[sys.argv.index('--') + 1:])
OUT = Path(ARGS.out); OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)


def obj_data(path):
    vertices, groups, current = [], {}, 'default'
    for line in path.read_text(encoding='utf8').splitlines():
        if line.startswith('v '): vertices.append(Vector(map(float, line.split()[1:4])))
        elif line.startswith(('o ', 'g ')): current = line[2:]; groups.setdefault(current, [])
        elif line.startswith('f '): groups.setdefault(current, []).append([int(v.split('/')[0])-1 for v in line.split()[1:]])
    return vertices, groups


def surface(name, color, roughness=.87):
    mat = bpy.data.materials.new(name); mat.diffuse_color = (*color, 1); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


STONE = surface('Hormigón pétreo gris cálido', (.50, .49, .445))
CLOTH = surface('Manto y uniforme tallados', (.47, .46, .415), .96)
DETAIL = surface('Relieve de crin y aparejos', (.43, .425, .385))
HAIR = surface('Cabellera tallada', (.455, .445, .40))
BASE = surface('Basamento de hormigón claro', (.57, .56, .515))


def mesh(name, vertices, faces, material=STONE, subdivision=0):
    data = bpy.data.meshes.new(name); data.from_pydata(vertices, [], faces); data.update()
    item = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(item); data.materials.append(material)
    for polygon in data.polygons: polygon.use_smooth = True
    if subdivision:
        mod = item.modifiers.new('Subdivisión de la anatomía', 'SUBSURF'); mod.levels = mod.render_levels = subdivision
        apply(item, mod)
    return item


def apply(item, modifier):
    bpy.context.view_layer.objects.active = item; item.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name); item.select_set(False)


def ellipsoid(name, at, scale, material=STONE, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=at)
    item = bpy.context.object; item.name = name; item.scale = scale; item.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in item.data.polygons: p.use_smooth = True
    item.select_set(False); return item


def cube(name, at, scale, material=BASE, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at); item = bpy.context.object; item.name = name; item.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); item.data.materials.append(material)
    if bevel:
        mod = item.modifiers.new('Aristas talladas', 'BEVEL'); mod.width = bevel; mod.segments = 3; apply(item, mod)
        mod = item.modifiers.new('Normales del basamento', 'WEIGHTED_NORMAL'); mod.keep_sharp = True; apply(item, mod)
    item.select_set(False); return item


def curve(name, points, radius, material=DETAIL, resolution=4):
    data = bpy.data.curves.new(name, 'CURVE'); data.dimensions = '3D'; data.resolution_u = 8
    data.bevel_depth = radius; data.bevel_resolution = resolution; data.use_fill_caps = True
    spline = data.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points): p.co = co; p.handle_left_type = p.handle_right_type = 'AUTO'
    item = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(item); item.data.materials.append(material); return item


def smoothstep(a, b, value):
    t = min(1, max(0, (value-a)/(b-a))); return t*t*(3-2*t)


# The actual horse mesh supplies the anatomy. Change its pose with continuous
# weighted bends; the four hooves are independently seated on the same plinth.
horse_vertices, horse_groups = obj_data(SOURCE / 'horse.obj')
body_faces = [face for face in horse_groups['Plane'] if not all(horse_vertices[i].y > 3.45 and horse_vertices[i].z > 6.25 for i in face)]
foot_min = {}
body_ids={i for face in body_faces for i in face}
for v in horse_vertices:
    if v.y < -2.5:
        key = (v.x > 0, v.z > 0)
        foot_min[key] = min(foot_min.get(key, 1e9), v.y)
leg_axes={}
for key in foot_min:
    samples=[]
    for j in range(9):
        height=-5+j*.45
        points=[horse_vertices[i] for i in body_ids if (horse_vertices[i].x>0,horse_vertices[i].z>0)==key and abs(horse_vertices[i].y-height)<.30]
        if points:samples.append((height,(min(v.x for v in points)+max(v.x for v in points))/2,(min(v.z for v in points)+max(v.z for v in points))/2))
    leg_axes[key]=samples


def horse_pose(v):
    x, y, z = v
    if y < -1.35:
        samples=leg_axes[(x>0,z>0)]
        a=min(samples,key=lambda sample:abs(sample[0]-y))
        for b in samples:
            if b[0]<=y and b[0]>=a[0]-.5:a=b
        b=next((s for s in samples if s[0]>y),samples[-1])
        t=max(0,min(1,(y-a[0])/max(.001,b[0]-a[0])))
        cx=a[1]+t*(b[1]-a[1]);cz=a[2]+t*(b[2]-a[2])
        strength=1-smoothstep(-2.1,-1.35,y)
        x=cx+(x-cx)*(1+.15*strength);z=cz+(z-cz)*(1+.30*strength)
    if y < -1.3:
        y += (-5.008283-foot_min[(x > 0, z > 0)]) * (1-smoothstep(-3.4, -1.3, y))
    trunk = (1-smoothstep(1.1, 3.4, abs(z+.8))) * smoothstep(-2.3, -.4, y)
    x *= 1 + .32*trunk
    y -= .23 * trunk * (1-smoothstep(-.2, 1.7, y))
    neck = smoothstep(1.3, 2.8, z) * (1-smoothstep(5.4, 6.8, z)) * smoothstep(.4, 2.7, y)
    x *= 1 + .16*neck; y += .22*neck
    # Flatten the original long swept-back ears into the poll. New compact,
    # upright sculpted ears are fitted below after the head is bent.
    if z > 6.1 and y > 3.75: y = 3.75+(y-3.75)*.16
    if y < -.8:
        side_center = 1.15 if x > 0 else -1.15
        strength = 1-smoothstep(-1.2, .3, y)
        x = side_center+(x-side_center)*(1+.22*strength)
    weight = smoothstep(4.25, 6.1, z) * smoothstep(.2, 1.25, y)
    angle = math.radians(25)*weight; yy, zz = y-3.8, z-6
    y, z = 3.8+yy*math.cos(angle)-zz*math.sin(angle), 6+yy*math.sin(angle)+zz*math.cos(angle)
    return Vector((-z*.88, -x*.95, (y+5.008283)*.95+.80))


horse = mesh('Caballo — anatomía continua y cabeza recogida', [horse_pose(v) for v in horse_vertices], body_faces)
import bmesh
bm=bmesh.new();bm.from_mesh(horse.data)
boundaries=[edge for edge in bm.edges if edge.is_boundary and all(horse_vertices[v.index].y>3.2 and horse_vertices[v.index].z>6.0 for v in edge.verts)]
if boundaries:bmesh.ops.holes_fill(bm,edges=boundaries,sides=64)
bm.to_mesh(horse.data);bm.free()
sub=horse.modifiers.new('Subdivisión anatómica','SUBSURF');sub.levels=1;apply(horse,sub)
for name in ['Sphere.002_Sphere.004', 'Sphere']:
    mesh('Ojo del caballo tallado', [horse_pose(v) for v in horse_vertices], horse_groups[name], STONE, subdivision=1)
deps = bpy.context.evaluated_depsgraph_get(); horse_bvh = BVHTree.FromObject(horse, deps)
for side in [-1, 1]:
    base = horse_pose(Vector((side*.46, 3.64, 6.38)))
    ev, ef = [], []
    for j, (rise, width, depth) in enumerate([(0, .16, .18), (.25, .22, .16), (.58, .11, .085), (.80, .008, .015)]):
        for i in range(16):
            a=i*math.tau/16; ev.append(base+Vector((-.12*rise+depth*math.sin(a), side*.12*rise+width*math.cos(a), rise)))
            if j:
                n=j*16+i; m=j*16+(i+1)%16; ef.append((n-16,m-16,m,n))
    ef.extend([tuple(reversed(range(16))), tuple(range(48,64))]); mesh('Oreja corta erguida del caballo',ev,ef,STONE,1)

# Sculpted mane grows from the actual neck surface, replacing alpha hair cards.
for index in range(18):
    x = -2.0-index*.235
    hit, normal, _, _ = horse_bvh.ray_cast(Vector((x, 0, 20)), Vector((0, 0, -1)))
    if hit is None: continue
    for side in [-1, 1]:
        points=[]
        for dx, width in [(-.10,.04),(.02,.22),(.18,.43),(.35,.64)]:
            p, normal, _, _=horse_bvh.ray_cast(Vector((x+dx,side*width,20)),Vector((0,0,-1)))
            if p is not None: points.append(p+normal*.018)
        if len(points)>2: curve('Relieve ondulado de crin adherido al cuello', points, .035, STONE, 2)

# Tail is a solid, heavy folded form: not textured transparent strips.
tail_sections = [(4.15, 0, 6.75, .39, .35), (4.65, 0, 5.8, .49, .42), (5.05, 0, 4.55, .46, .48), (5.55, 0, 3.25, .53, .50), (6.2, 0, 2.9, .53, .28), (6.5, 0, 3.05, .22, .13)]
tail_v, tail_f = [], []
for j, (x, y, z, ry, rz) in enumerate(tail_sections):
    for i in range(32):
        a = i*math.tau/32; fold = 1+.10*math.cos(7*a+j*.3)
        tail_v.append((x, y+ry*1.65*math.cos(a)*fold, z+rz*2.0*math.sin(a)*fold))
        if j:
            n = j*32+i; prev = j*32+(i+1)%32; tail_f.append((n-32, prev-32, prev, n))
tail_f += [tuple(reversed(range(32))), tuple(range((len(tail_sections)-1)*32, len(tail_sections)*32))]
mesh('Cola pesada de pliegues longitudinales', tail_v, tail_f, STONE, 2)


# MakeHuman's head and topology are a fresh CC0 base, independent of the deleted
# procedural head. Age, masculine proportions and a strong nose are shaped here.
human, human_groups = obj_data(SOURCE / 'human.obj')
targets = {
    'caucasian-male-young.target': .60, 'caucasian-male-old.target': .40,
    'universal-male-young-averagemuscle-averageweight.target': .60,
    'universal-male-old-averagemuscle-averageweight.target': .40,
    'head-square.target': .42, 'head-age-incr.target': .30,
    'nose-hump-incr.target': .38, 'nose-scale-depth-incr.target': .28,
    'nose-point-down.target': .18, 'chin-width-incr.target': .60,
    'chin-prominent-incr.target': .16, 'eyebrows-angle-down.target': .40,
    'eyebrows-trans-down.target': .13, 'eyebrows-trans-forward.target': .24,
    'mouth-angles-down.target': .18,
}
for filename, weight in targets.items():
    for line in (SOURCE / filename).read_text().splitlines():
        if not line or line.startswith('#'): continue
        values = line.split()
        if len(values) == 4: human[int(values[0])] += Vector(map(float, values[1:])) * weight

body = human_groups['body']
def joint(name):
    ids = {i for face in human_groups['joint-'+name] for i in face}
    return sum((human[i] for i in ids), Vector())/len(ids)
neck_y = joint('neck').y
eye_y = joint('l-eye').y
head_top = max(human[i].y for face in body for i in face)
head_faces = [face for face in body if all(human[i].y > neck_y-.16 for i in face)]
SCALE = .62
NECK = Vector((-.10, 0, 11.42))
tilt = Matrix.Rotation(math.radians(-18), 4, 'Y')


def head_position(v):
    # Forward is -X; tilt the chin gently toward the horse rather than leaning
    # the entire rider or stretching the neck.
    local = Vector((-v.z*SCALE, -v.x*SCALE, (v.y-neck_y)*SCALE))
    pivot = Vector((-.10, 0, .40))
    return NECK + pivot + tilt.to_3x3() @ (local-pivot)


head = mesh('Artigas — rostro adulto, mandíbula y cuello anatómicos', [head_position(v) for v in human], head_faces, STONE, subdivision=1)
bm=bmesh.new();bm.from_mesh(head.data)
neck_edges=[e for e in bm.edges if e.is_boundary and all(v.co.z<NECK.z+.24 for v in e.verts)]
if neck_edges:
    extended=bmesh.ops.extrude_edge_only(bm,edges=neck_edges)['geom']
    for vertex in extended:
        if isinstance(vertex,bmesh.types.BMVert):vertex.co.z-=.40
    bottom=[e for e in bm.edges if e.is_boundary and all(v.co.z<NECK.z-.12 for v in e.verts)]
    if bottom:bmesh.ops.holes_fill(bm,edges=bottom,sides=128)
bm.to_mesh(head.data);bm.free();head.data.update()
for side in ['l', 'r']:
    ids = {i for face in human_groups['joint-'+side+'-eye'] for i in face}
    center = sum((human[i] for i in ids), Vector())/len(ids)
    center.z -= .035
    ellipsoid('Globo ocular pétreo dentro de la órbita', head_position(center), (.105, .105, .105), STONE)

# Hair cap follows the real scalp topology; swept waves and sideburns are raised
# low relief, not separate spheres attached around the face.
hair_faces = []
def hairline(v):
    front=smoothstep(.20,1.18,v.z)
    return neck_y+.62+1.34*front-.13*abs(v.x)+.075*math.sin(v.x*4+.6)*front
for face in head_faces:
    if all(human[i].y > hairline(human[i]) for i in face): hair_faces.append(face)
hair_vertices = []
for v in human:
    delta = v-Vector((0, eye_y+.2, .20))
    a=math.atan2(v.x+.22, v.z-.20)
    flow=12*a+4.0*(v.y-eye_y)+.7*math.sin(a*3)
    root=smoothstep(0,.22,v.y-hairline(v))
    wave=(.035+.032*math.cos(flow))*root
    forelock=.18*math.exp(-((v.y-eye_y-.63)/.28)**2-((v.z-1.12)/.38)**2-((v.x+.22)/.55)**2)*root
    hair_vertices.append(head_position(v+delta.normalized()*(.012+wave+forelock)))
hair = mesh('Cabellera ondulada barrida hacia atrás — superficie continua', hair_vertices, hair_faces, HAIR, subdivision=2)
inverse_tilt=tilt.to_3x3().inverted(); pivot=Vector((-.10,0,.40))
for vertex in hair.data.vertices:
    local=inverse_tilt@(vertex.co-NECK-pivot)+pivot
    native=Vector((-local.y/SCALE,local.z/SCALE+neck_y,-local.x/SCALE))
    a=math.atan2(native.x+.22,native.z-.20);root=smoothstep(0,.28,native.y-hairline(native))
    ripple=(.075*math.cos(6*a+2.6*(native.y-eye_y))+.025*math.cos(17*a+5.3*(native.y-eye_y)))*root
    radial=(native-Vector((0,eye_y+.2,.20))).normalized()
    vertex.co+=tilt.to_3x3()@Vector((-radial.z, -radial.x,radial.y))*ripple*SCALE
hair.data.update()
solid = hair.modifiers.new('Borde integrado del cabello tallado', 'SOLIDIFY'); solid.thickness = -.018; apply(hair, solid)


# Pose the body against photographed shoulder/elbow/knee/ankle landmarks. The
# torso remains vertical and both legs straddle the barrel with natural knees.
def rest(v): return Vector((-v.z*.62, -v.x*.62, (v.y-.727)*.62+8.12))


bones = []
def bone(name, a, b, da, db): bones.append((name, rest(joint(a)), rest(joint(b)), Vector(da), Vector(db)))
bone('spine', 'pelvis', 'spine-1', (0, 0, 8.12), (-.10, 0, 10.9))
bone('chest', 'spine-1', 'neck', (-.10, 0, 10.9), (-.10, 0, 11.4))
for side, letter in [(-1, 'l'), (1, 'r')]:
    shoulder = (-.12, side*1.05, 11.20)
    elbow = (-.62, side*1.62, 10.15) if side == -1 else (-.80, side*1.35, 10.6)
    hand = (-2.1, side*.92, 9.35) if side == -1 else (-1.35, .18, 10.45)
    bone(letter+'-arm', letter+'-shoulder', letter+'-elbow', shoulder, elbow)
    bone(letter+'-forearm', letter+'-elbow', letter+'-hand', elbow, hand)
    bone(letter+'-thigh', letter+'-upper-leg', letter+'-knee', (.15, side*.72, 8.12), (-1.2, side*1.92, 7.0))
    bone(letter+'-calf', letter+'-knee', letter+'-ankle', (-1.2, side*1.92, 7.0), (-.95, side*2.12, 4.48))


def posed_body(v):
    p = rest(v); candidates = []
    letter = 'l' if v.x > 0 else 'r'
    for name, a, b, da, db in bones:
        if name not in ['spine','chest',letter+'-thigh',letter+'-calf',letter+'-arm',letter+'-forearm']: continue
        direction = b-a; t = max(0, min(1, (p-a).dot(direction)/direction.length_squared))
        distance = (p-a-t*direction).length
        q = direction.rotation_difference(db-da)
        longitudinal = (p-a).dot(direction)/direction.length_squared
        mapped = da+longitudinal*(db-da)+q@(p-a-longitudinal*direction)
        candidates.append((1/max(.08, distance)**6, mapped))
    candidates.sort(key=lambda item: -item[0]); candidates = candidates[:2]
    result = sum((weight*point for weight, point in candidates), Vector())/sum(w for w, _ in candidates)
    return result


knee_y=joint('l-knee').y
def clothed(v):
    if not knee_y-.15 < v.y < neck_y-.12:return False
    if abs(v.x)>abs(joint('l-elbow').x)-.1:
        letter='l' if v.x>0 else 'r'; elbow=joint(letter+'-elbow'); wrist=joint(letter+'-hand'); direction=wrist-elbow
        t=(v-elbow).dot(direction)/direction.length_squared
        if t>.94:return False
    return True
uniform_faces = [face for face in body if all(clothed(human[i]) for i in face)]
uniform = mesh('Jinete — casaca, brazos flexionados y pantalón', [posed_body(v) for v in human], uniform_faces, CLOTH, subdivision=1)
solid = uniform.modifiers.new('Grosor de la ropa', 'SOLIDIFY'); solid.thickness = .08; apply(uniform, solid)

for side in [-1, 1]:
    # Tall, clothed boots; natural ankle narrowing, shaped instep and flat soles.
    sections = [(7.38, -1.20, side*1.94, .43, .45), (6.8, -1.15, side*2.0, .38, .39), (5.7, -.98, side*2.1, .32, .32), (4.65, -.95, side*2.12, .26, .28), (4.35, -1.13, side*2.12, .53, .30)]
    vertices, faces = [], []
    for j, (z, x, y, rx, ry) in enumerate(sections):
        for i in range(24):
            a = i*math.tau/24; wrinkle = .018*math.cos(3*a+j*2)
            vertices.append((x+(rx+wrinkle)*math.cos(a), y+(ry+wrinkle)*math.sin(a), z))
            if j:
                n=j*24+i; m=j*24+(i+1)%24; faces.append((n-24, n, m, m-24))
    faces += [tuple(range(24)), tuple(reversed(range((len(sections)-1)*24, len(sections)*24)))]
    mesh('Bota de montar con caña y tobillo', vertices, faces, STONE, 1)
    shoe = ellipsoid('Empeine y puntera de la bota', (-1.43, side*2.12, 4.31), (.77, .34, .30), STONE)
    cube('Suela plana de la bota', (-1.42, side*2.12, 4.12), (1.44, .65, .14), DETAIL, .08)
    cube('Tacón', (-.92, side*2.12, 4.02), (.38, .57, .23), STONE, .04)
    # Flat stirrup below the sole, two angled branches and a leather suspension.
    curve('Estribo de montar', [(-1.95, side*2.12, 4.15), (-1.97, side*2.12, 3.98), (-.78, side*2.12, 3.98), (-.72, side*2.12, 4.22), (-1.30, side*2.12, 5.05), (-1.95, side*2.12, 4.15)], .055, DETAIL, 2)
    curve('Ación del estribo', [(-.2, side*1.6, 8.1), (-.7, side*1.9, 6.7), (-1.3, side*2.13, 5.02)], .08, DETAIL, 2)
    for z in [5.45, 6.90]: curve('Pliegue y ribete de la bota', [(-1.47, side*2.13, z), (-1.12, side*(2.13+.35), z+.05), (-.80, side*2.13, z)], .045, DETAIL, 2)

# Heavy asymmetrical poncho: a continuous shell, broad diagonal folds and a hem
# resting on the croup. Both shoulders and the back are connected in one mesh.
cape_v, cape_f = [], []
ROWS, COLS = 38, 144
for j in range(ROWS+1):
    t = j/ROWS
    for i in range(COLS):
        a = i*math.tau/COLS; back = (1-math.cos(a))/2
        center_x = 1.35*t*t
        shoulder=smoothstep(0,.16,t)
        rx = .32+.47*shoulder+1.42*t*t; ry = .52+.85*shoulder+.63*math.sin(t*math.pi/2)
        front=max(0,math.cos(a))**2
        z = 11.45 - t*(1.72+2.03*back)-.30*front*(1-smoothstep(0,.18,t))
        fold = (.02+.18*t)*math.sin(7*a+5.1*t) + .045*t*math.sin(15*a-1.8*t)
        fold += back**.6*(.22*math.exp(-((t-.43-.10*math.sin(a))/.075)**2)+.24*math.exp(-((t-.72-.09*math.sin(a))/.075)**2))
        fold += front*(.20*math.sin(math.pi*t)+.08*math.sin(2*a+9*t)*math.sin(math.pi*t))
        x = center_x-(rx+fold)*math.cos(a)
        y = (ry+fold)*math.sin(a)
        # The gathered near-side elbow lifts the fabric slightly.
        z += .48*math.exp(-((a-4.65)/.5)**2)*math.sin(t*math.pi)
        if t>.7 and back>.5:
            contact,n,_,_=horse_bvh.ray_cast(Vector((x,y,18)),Vector((0,0,-1)))
            if contact is not None:
                blend=smoothstep(.7,1,t)*smoothstep(.5,.9,back)
                z=z*(1-blend)+(contact.z+.10)*blend
        cape_v.append((x, y, z))
        if j:
            n=j*COLS+i; m=j*COLS+(i+1)%COLS; cape_f.append((n-COLS, m-COLS, m, n))
cape = mesh('Poncho — paño pesado sobre hombros y grupa', cape_v, cape_f, CLOTH)
if ARGS.cloth_steps:
    for collider in [horse,uniform]:
        collider.modifiers.new('Colisión del paño','COLLISION')
        collider.collision.thickness_outer=.035
    pins=cape.vertex_groups.new(name='Cuello y hombros sujetos')
    pins.add(list(range(COLS)),1,'REPLACE')
    pins.add(list(range(COLS,COLS*2)),.8,'REPLACE')
    pins.add([ROWS*COLS+i for i in range(COLS) if math.cos(i*math.tau/COLS)<-.5],.60,'REPLACE')
    cloth=cape.modifiers.new('Caída física del poncho','CLOTH')
    cloth.settings.quality=8;cloth.settings.mass=.7
    cloth.settings.tension_stiffness=35;cloth.settings.compression_stiffness=35
    cloth.settings.shear_stiffness=20;cloth.settings.bending_stiffness=1.6
    cloth.settings.vertex_group_mass=pins.name
    cloth.collision_settings.use_collision=True;cloth.collision_settings.distance_min=.025
    cloth.collision_settings.use_self_collision=True;cloth.collision_settings.self_distance_min=.025
    cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=ARGS.cloth_steps
    for frame in range(1,ARGS.cloth_steps+1):
        bpy.context.scene.frame_set(frame)
        if frame%10==0:print('CLOTH_FRAME',frame,flush=True)
    apply(cape,cloth);cape_v=[v.co.copy() for v in cape.data.vertices]
solid = cape.modifiers.new('Espesor continuo del poncho', 'SOLIDIFY'); solid.thickness = .11; apply(cape, solid)
bevel = cape.modifiers.new('Borde blando del paño', 'BEVEL'); bevel.width = .035; bevel.segments = 2; apply(cape, bevel)
# Join the intersecting garment surfaces so shoulders, chest and hem form a
# continuous sculpted mass instead of exposed cut edges between assemblies.
for item in [cape,uniform]:item.select_set(True)
bpy.context.view_layer.objects.active=cape;bpy.ops.object.join();cape.select_set(False)
remesh=cape.modifiers.new('Unión esculpida de manto y uniforme','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.055;remesh.use_smooth_shade=True;apply(cape,remesh)
smooth=cape.modifiers.new('Suavizado de las costuras talladas','SMOOTH');smooth.factor=.35;smooth.iterations=3;apply(cape,smooth)
for row,name,radius in [(0,'Borde continuo del cuello del poncho',.045),(ROWS,'Dobladillo continuo apoyado sobre la grupa',.060)]:
    edge=curve(name,[cape_v[row*COLS+i] for i in range(0,COLS,2)],radius,CLOTH,2)
    edge.data.splines[0].use_cyclic_u=True
for i in range(COLS):
    if i % 2: continue
    p = Vector(cape_v[ROWS*COLS+i]); a=i*math.tau/COLS
    if math.cos(a) > .75: continue
    curve('Fleco corto en el borde del poncho', [p, p+Vector((.06*math.cos(a), .04*math.sin(a), -.18))], .026, CLOTH, 1)

# Saddle blankets, fringe and girth read clearly on both sides of the barrel.
for side in [-1, 1]:
    bv,bf=[],[]
    for j in range(13):
        v=j/12
        for i in range(17):
            u=i/16; bv.append((-.06+2.16*u+.05*math.sin(v*math.pi), side*(1.83+.13*math.sin(u*math.pi)+.06*math.sin(v*math.pi)),6.20+1.65*v+.06*math.sin(u*math.pi)))
            if j and i:
                n=j*17+i;bf.append((n-18,n-17,n,n-1))
    blanket=mesh('Carona blanda de bordes y flecos',bv,bf,CLOTH,1)
    thick=blanket.modifiers.new('Espesor del sudadero','SOLIDIFY');thick.thickness=.14;apply(blanket,thick)
    for x in [.14, .38, .62, .86, 1.1, 1.34, 1.58, 1.82]:
        curve('Fleco de la carona', [(x, side*2.01, 6.25), (x+.04, side*2.05, 6.03)], .04, STONE, 1)
    for z in [6.35, 7.70]: curve('Ribete de carona', [(-.05, side*1.90, z), (1.0, side*1.98, z+.03), (2.05, side*1.90, z)], .025, DETAIL, 2)
    curve('Cincha ceñida al costillar', [(.15, side*1.65, 8), (.15, side*2.0, 6.6), (.15, side*1.7, 4.8), (.15, side*.4, 4.6)], .11, DETAIL, 2)

# Head tack follows the same bend as the imported head rather than floating.
for side in [-1, 1]:
    def hp(x, y, z): return horse_pose(Vector((side*x, y, z)))
    curve('Brida — carrillera', [hp(.58, 3.7, 6.7), hp(.66, 2.8, 7.1), hp(.42, 1.15, 7.9)], .055, DETAIL, 2)
    curve('Riendas hacia la mano baja', [hp(.42, 1.15, 7.9), (-4.0, side*.75, 7.4), (-2.2, -.91 if side < 0 else .55, 9.35)], .043, DETAIL, 2)
curve('Muserola', [horse_pose(Vector((-.42, 1.25, 7.85))), horse_pose(Vector((0, 1.2, 8.18))), horse_pose(Vector((.42, 1.25, 7.85)))], .055, DETAIL, 2)

# A low two-stage concrete plinth, matching the photographed rectangular base.
cube('Basamento inferior rectangular', (0, 0, .22), (10.9, 5.3, .44), BASE, .045)
cube('Basamento superior escalonado', (0, 0, .60), (10.35, 4.8, .34), BASE, .06)
cube('Losa de apoyo de los cuatro cascos', (0, 0, .80), (9.85, 4.45, .09), BASE, .025)


# Freeze every curve/modifier, remove unused vertices, and export only the new
# sculpture. Keep named components for the independent anatomical inspection.
sculpture = [o for o in bpy.context.scene.objects if o.type in {'MESH', 'CURVE'}]
for item in sculpture:
    bpy.context.view_layer.objects.active = item; item.select_set(True)
    if item.type == 'CURVE': bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    item.select_set(False)
    name=item.name
    ratio=1
    if name.startswith('Poncho'):ratio=.28
    elif name.startswith('Cabellera'):ratio=.18
    elif name.startswith('Cola') or name.startswith('Ojo del caballo'):ratio=.40
    elif name.startswith('Fleco') or name.startswith('Carona'):ratio=.55
    if ratio<1:
        mod=item.modifiers.new('Malla estática optimizada para la web','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True;apply(item,mod)
    # All components use the same final scale; the hill is never rescaled.
    item.location *= 1.10
    for vertex in item.data.vertices: vertex.co *= 1.10
    import bmesh
    bm=bmesh.new(); bm.from_mesh(item.data)
    unused=[v for v in bm.verts if not v.link_faces]
    if unused:bmesh.ops.delete(bm, geom=unused, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces));bm.to_mesh(item.data);bm.free()

# Keep the human hand topology intact after all other geometry is frozen.
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from anatomical_hands import create_hands
from adult_arms import refine_arms
refine_arms()
create_hands(STONE)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'artigas-rebuilt.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'artigas-rebuilt.glb'), export_format='GLB', use_selection=False, export_animations=False, export_cameras=False, export_lights=False, export_yup=True)


def camera_view(name, eye, target, lens, ortho=None):
    bpy.ops.object.camera_add(location=eye); camera=bpy.context.object; camera.name='QA '+name
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens=lens
    if ortho: camera.data.type='ORTHO'; camera.data.ortho_scale=ortho
    bpy.context.scene.camera=camera
    bpy.context.scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera, do_unlink=True)


scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=24
scene.cycles.use_denoising=True; scene.render.resolution_x=1080; scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.world.color=(.28, .28, .28)
scene.view_settings.view_transform='AgX'
for at, energy, size in [((-10,-12,22), 2400, 9), ((6,8,17), 1800, 8), ((10,-2,12), 900, 7)]:
    bpy.ops.object.light_add(type='AREA', location=at); light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,0,7))-light.location).to_track_quat('-Z','Y').to_euler()
floor=surface('Fondo neutro de estudio', (.22,.25,.25))
cube('Suelo de estudio — no exportado', (0,0,-.22), (200,200,.2), floor, 0)
views={
    'side':((0,-30,9), (0,0,7), 50, 18),
    'other-side':((0,30,9), (0,0,7),50,18),
    'front':((-30,0,9),(-1,0,7.4),50,18),
    'three-quarter':((-20,-25,12),(0,0,7.3),52,None),
    'rear':((27,-5,11),(1,0,7.3),50,18),
    'head-front':((-10.5,-.1,14.1),(-.65,0,13.1),70,None),
    'head-three-quarter':((-7,-6.5,14.4),(-.5,0,13.1),65,None),
    'head-low-front':((-10,0,11.6),(-.65,0,13.2),70,None),
    'head-low-quarter':((-7,-7,12.0),(-.5,0,13.2),65,None),
}
for name, view in views.items():
    if ARGS.views=='all' or name in ARGS.views.split(','): camera_view(name,*view)
print('ARTIGAS_REBUILD_DONE', flush=True)
