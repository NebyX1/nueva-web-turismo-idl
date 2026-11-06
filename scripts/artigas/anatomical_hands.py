"""Closed, posed hands from the CC0 MakeHuman topology; no voxel finger fusion."""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
import numpy as np

SOURCE = Path(__file__).resolve().parents[2] / 'assets/artigas/source'


def human_source():
    vertices, groups, group = [], {}, ''
    for line in (SOURCE / 'human.obj').read_text(encoding='utf8').splitlines():
        if line.startswith('v '): vertices.append(Vector(map(float, line.split()[1:4])))
        elif line.startswith('g '): group = line[2:]
        elif line.startswith('f '): groups.setdefault(group, []).append([int(v.split('/')[0])-1 for v in line.split()[1:]])
    for name, weight in [('caucasian-male-young.target', .60), ('caucasian-male-old.target', .40),
                         ('universal-male-young-averagemuscle-averageweight.target', .60),
                         ('universal-male-old-averagemuscle-averageweight.target', .40)]:
        for line in (SOURCE / name).read_text().splitlines():
            values = line.split()
            if len(values) == 4 and not line.startswith('#'): vertices[int(values[0])] += Vector(map(float, values[1:])) * weight
    return vertices, groups


def segment_distance(point, a, b):
    delta = b-a; t = max(0, min(1, (point-a).dot(delta)/delta.length_squared))
    return (point-a-delta*t).length


def mapped_segment(point, a, b, c, d):
    source = (b-a).normalized(); target = (d-c).normalized()
    across = Vector((1,0,0)); su = (across-source*across.dot(source)).normalized()
    tu = (across-target*across.dot(target)).normalized()
    sn = su.cross(source); tn = tu.cross(target)
    delta = point-a; t = delta.dot(source)/(b-a).length
    return c+(d-c)*t+tu*delta.dot(su)+tn*delta.dot(sn)


def support_cloth(hand,origin,across,forward,normal):
    """Seat fabric under the intact hand, without cutting through its thumb."""
    coat=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Poncho'))
    surface=BVHTree.FromPolygons([hand.matrix_world@v.co for v in hand.data.vertices],[list(p.vertices) for p in hand.data.polygons])
    original_cloth=BVHTree.FromPolygons([coat.matrix_world@v.co for v in coat.data.vertices],[list(p.vertices) for p in coat.data.polygons])
    points=[];spacing=.025
    for ix in range(-22,31):
        for iy in range(3,55):
            x,y=ix*spacing,iy*spacing;base=origin+across*x+forward*y
            hit,_,_,_=surface.ray_cast(base-normal*3,normal,6)
            if hit is not None:points.append(Vector((x,y,(hit-base).dot(normal)-.015)))
    tree=KDTree(len(points))
    for i,p in enumerate(points):tree.insert((p.x,p.y,0),i)
    tree.balance();inverse=coat.matrix_world.inverted();moved=0
    def basis(x,y):return np.array([1,x,y,x*x,x*y,y*y])
    matrix=np.array([basis(p.x,p.y) for p in points]);heights=np.array([p.z for p in points])
    coefficients=np.linalg.lstsq(matrix,heights,rcond=None)[0]
    coefficients[0]+=float(np.percentile(heights-matrix@coefficients,2))-.012
    for v in coat.data.vertices:
        world=coat.matrix_world@v.co;delta=world-origin
        x,y,z=delta.dot(across),delta.dot(forward),delta.dot(normal)
        if y<.045 or y>1.48 or abs(x)>.9:continue
        closest=tree.find_n((x,y,0),1);distance=closest[0][2]
        if distance>.30:continue
        target=float(basis(x,y)@coefficients)
        base=origin+across*x+forward*y
        hit,_,_,_=original_cloth.ray_cast(base+normal*4,-normal,8)
        if hit is None:continue
        front=(hit-base).dot(normal)
        # Translate front and back of the fabric together. Moving only its
        # visible skin would collapse a thin fold and cut holes in the cloak.
        depth=max(0,min(1,(z-front+1.8)/1.2));depth=depth*depth*(3-2*depth)
        edge=max(0,min(1,(.30-distance)/.20));edge=edge*edge*(3-2*edge)
        wrist=max(0,min(1,(y-.045)/.12));wrist=wrist*wrist*(3-2*wrist)
        displacement=min(.18,target-front)*edge*wrist*depth
        v.co=inverse@(world+normal*displacement);moved+=1
    coat.data.update()
    bpy.context.view_layer.objects.active=coat;coat.select_set(True)
    remesh=coat.modifiers.new('Paño apoyado bajo palma y pulgar','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.025;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smoothing=coat.modifiers.new('Transición suave del apoyo','SMOOTH');smoothing.factor=.25;smoothing.iterations=2
    bpy.ops.object.modifier_apply(modifier=smoothing.name)
    coat.data.calc_loop_triangles();decimate=coat.modifiers.new('Detalle final de uniforme','DECIMATE');decimate.ratio=min(1,36000/len(coat.data.loop_triangles));decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name);coat.select_set(False)
    print('CLOTH_HAND_SUPPORT',moved,'vertices; anatomical hand unchanged',flush=True)


def create_hands(material):
    vertices, groups = human_source()
    def joint(letter, name):
        ids = {i for f in groups['joint-'+letter+'-'+name] for i in f}
        return sum((vertices[i] for i in ids), Vector())/len(ids)
    result = []
    for letter, name, scale, forward, dorsal, wrist, sleeve, gripping in [
        ('l', 'Mano baja — cinco dedos sujetando las riendas', .60,
         (-.78,.58,-.23), (-.46,0,.89), (-2.19,-1.13,10.49), (-2.16,-1.09,10.48), True),
        ('r', 'Mano alta — cinco dedos sobre el paño', .64,
         (-.10,-.98,-.15), (-1,0,.08), (-1.82,.20,11.44), (-1.58,.28,11.45), False),
    ]:
        w=joint(letter,'hand'); m=joint(letter,'finger-3-1')
        longitudinal=(m-w).normalized()
        across=joint(letter,'finger-2-1')-joint(letter,'finger-5-1')
        across=(across-longitudinal*across.dot(longitudinal)).normalized()
        # In the source pose the fingers flex toward the palmar side. Use the
        # opposite normal as dorsal, so bending never hyperextends them.
        handed=-1 if letter=='r' else 1
        normal=across.cross(longitudinal)*handed
        f=Vector(forward).normalized(); n=Vector(dorsal); n=(n-f*n.dot(f)).normalized()
        a=f.cross(n)*handed
        origin=Vector(wrist); anchor=Vector(sleeve)
        if not gripping:
            # A rigid inclination preserves phalanx lengths and palm volume.
            # The wrist then meets the cuff and the fingertips face the cloth.
            angle=math.radians(-12);old_f=f.copy();old_n=n.copy()
            f=old_f*math.cos(angle)+old_n*math.sin(angle)
            n=old_n*math.cos(angle)-old_f*math.sin(angle)
            origin-=old_n*.18
        def local(v):
            d=v-w
            return Vector((d.dot(across)*scale,d.dot(longitudinal)*scale,d.dot(normal)*scale*.95))
        chains={digit:[local(joint(letter,f'finger-{digit}-{i}')) for i in range(1,5)] for digit in range(1,6)}
        desired={}
        for digit in range(2,6):
            source=chains[digit]; target=[source[0].copy()]
            angles=([78+(digit-2)*2, 83, 44] if gripping else [12+(digit-2)*2, 17, 10])
            cumulative=0
            for j in range(3):
                cumulative+=math.radians(angles[j]); length=(source[j+1]-source[j]).length
                spread=(3.4-digit)*.018 if not gripping else (3.2-digit)*.012
                direction=Vector((spread, math.cos(cumulative), -math.sin(cumulative))).normalized()
                target.append(target[-1]+direction*length)
            desired[digit]=target
        thumb=chains[1]; base=thumb[0].copy()
        if gripping:
            # Preserve the metacarpal and thenar web. Only its distal joints
            # oppose the index, at their original anatomical lengths.
            target=[base,thumb[1].copy()]
            goal=(desired[2][0]+desired[2][1])*.5+Vector((0,0,.055))
            target.append(target[-1]+(goal-target[-1]).normalized()*(thumb[2]-thumb[1]).length)
            target.append(target[-1]+(goal-target[-1]).normalized()*(thumb[3]-thumb[2]).length)
        else:
            target=[p.copy() for p in thumb]
        desired[1]=target
        def pose(p):
            digit=min(range(1,6),key=lambda d:min(segment_distance(p,chains[d][j],chains[d][j+1]) for j in range(3)))
            source=chains[digit]; target=desired[digit]
            nearest=[]
            for j in range(3):
                distance=segment_distance(p,source[j],source[j+1])
                nearest.append((1/max(.015,distance)**5,mapped_segment(p,source[j],source[j+1],target[j],target[j+1])))
            nearest.sort(key=lambda x:-x[0]); nearest=nearest[:2]
            bent=sum((weight*q for weight,q in nearest),Vector())/sum(weight for weight,_ in nearest)
            along=(p-source[0]).dot((source[1]-source[0]).normalized())
            blend=max(0,min(1,(along+.08)/.18)); blend=blend*blend*(3-2*blend)
            q=p.lerp(bent,blend)
            return origin+a*q.x+f*q.y+n*q.z
        faces=[]
        for face in groups['body']:
            if all((vertices[i]-w).length<2.7 and vertices[i].x*(1 if letter=='l' else -1)>abs(w.x)-.55
                   and local(vertices[i]).y>-.12 for i in face): faces.append(face)
        ids=sorted({i for face in faces for i in face}); lookup={i:j for j,i in enumerate(ids)}
        data=bpy.data.meshes.new(name); data.from_pydata([pose(local(vertices[i])) for i in ids],[],[[lookup[i] for i in face] for face in faces]); data.update()
        item=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(item); data.materials.append(material)
        bm=bmesh.new(); bm.from_mesh(data)
        boundary=[edge for edge in bm.edges if edge.is_boundary]
        if boundary:
            ring={v for edge in boundary for v in edge.verts}; centre=sum((v.co for v in ring),Vector())/len(ring)
            extended=bmesh.ops.extrude_edge_only(bm,edges=boundary)['geom']
            for v in extended:
                if isinstance(v,bmesh.types.BMVert):v.co=anchor+(v.co-centre)*.93
            # Cap the proximal wrist inside the existing sleeve.
            edges=[edge for edge in bm.edges if edge.is_boundary]
            bmesh.ops.holes_fill(bm,edges=edges,sides=128)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
        for polygon in data.polygons:polygon.use_smooth=True
        bpy.context.view_layer.objects.active=item;item.select_set(True)
        subdivision=item.modifiers.new('Falanges y nudillos conservados','SUBSURF');subdivision.levels=1
        bpy.ops.object.modifier_apply(modifier=subdivision.name);item.select_set(False)
        data=item.data
        if not gripping:support_cloth(item,origin,a,f,n)
        item['anatomical_digits']=5;item['gesture']='reins_grip' if gripping else 'resting_on_cloak'
        result.append(item)
    return result
