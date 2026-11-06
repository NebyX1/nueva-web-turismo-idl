"""Local sleeve/arm correction on the saved sculpture; preserve all other parts."""
import bpy
import bmesh
import math
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)


def elbow(shoulder,wrist,side):
    upper,fore=1.86,1.82
    delta=wrist-shoulder;distance=delta.length;direction=delta.normalized()
    along=(upper*upper-fore*fore+distance*distance)/(2*distance)
    centre=shoulder+direction*along
    outward=Vector((-.05,side,-.75));outward=(outward-direction*outward.dot(direction)).normalized()
    return centre+outward*math.sqrt(max(0,upper*upper-along*along))


def refine_arms():
    coat=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Poncho'))
    baseline=BVHTree.FromPolygons([coat.matrix_world@v.co for v in coat.data.vertices],[list(p.vertices) for p in coat.data.polygons])
    rigs=[]
    for side,shoulder,old_elbow,wrist,new_wrist in [
        (-1,(-.132,-1.155,12.32),(-.682,-1.782,11.165),(-2.16,-1.09,10.48),(-2.16,-1.09,10.48)),
        (1,(-.132,1.155,12.32),(-.88,1.485,11.66),(-1.46,.28,11.51),(-1.58,.28,11.45)),
    ]:
        s,e,w,nw=map(Vector,[shoulder,old_elbow,wrist,new_wrist]);ne=elbow(s,nw,side)
        rigs.append({'side':side,'old':[s,e,w],'new':[s,ne,nw]})
    inverse=coat.matrix_world.inverted();changed=[]
    for vertex in coat.data.vertices:
        original=coat.matrix_world@vertex.co;candidates=[]
        for rig in rigs:
            for segment in range(2):
                a,b=rig['old'][segment:segment+2];c,d=rig['new'][segment:segment+2]
                delta=b-a;t=(original-a).dot(delta)/delta.length_squared
                if t<-.12 or t>1.18:continue
                offset=original-(a+delta*t);r=offset.length
                if r>.64:continue
                radial=1-smooth(.43,.64,r)
                axial=smooth(-.12,.02,t)*(1-smooth(1.04,1.18,t))
                if segment==0:axial*=smooth(.025,.22,t)
                influence=radial*axial
                if influence<.00001:continue
                rotation=delta.rotation_difference(d-c)
                if segment==0:inflation=.225*smooth(.06,.30,t)
                else:inflation=.16*(1-smooth(0,.5,t))+.12*smooth(0,.5,t)
                if segment==1:inflation*=1-.45*smooth(.65,1,t)
                target_r=r+min(inflation,max(0,.42-r))
                radial_offset=offset*(target_r/r) if r>.00001 else offset
                posed=c+(d-c)*t+rotation@radial_offset
                weight=influence/max(.08,r)**4
                candidates.append((weight,influence,posed))
        if candidates:
            candidates.sort(key=lambda x:-x[0]);candidates=candidates[:2]
            mapped=sum((weight*p for weight,_,p in candidates),Vector())/sum(weight for weight,_,_ in candidates)
            strength=max(influence for _,influence,_ in candidates)
            updated=original.lerp(mapped,strength)
            if (updated-original).length>.000001:
                vertex.co=inverse@updated;changed.append(vertex.index)
    coat.data.update()
    # The old garment contains intersecting layers. Rebuild their union after
    # posing, then restore every surface outside the arm attachments to its
    # original shape rather than leaving stretched triangles under a sleeve.
    bpy.context.view_layer.objects.active=coat;coat.select_set(True)
    remesh=coat.modifiers.new('Uniones cerradas de mangas','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.040;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    weights=coat.vertex_groups.new(name='Suavizar codos')
    for v in coat.data.vertices:
        point=coat.matrix_world@v.co;distance=min((point-rig['new'][1]).length for rig in rigs)
        strength=1-smooth(.20,.62,distance)
        if strength>0:weights.add([v.index],strength,'REPLACE')
    smoothing=coat.modifiers.new('Pliegue redondo del codo','SMOOTH');smoothing.factor=.35;smoothing.iterations=4;smoothing.vertex_group=weights.name
    bpy.ops.object.modifier_apply(modifier=smoothing.name)
    coat.data.calc_loop_triangles();ratio=min(1,35000/max(1,len(coat.data.loop_triangles)))
    decimate=coat.modifiers.new('Detalle de abrigo para la web','DECIMATE');decimate.ratio=ratio;decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    restored=0
    for v in coat.data.vertices:
        point=coat.matrix_world@v.co;near=False
        for rig in rigs:
            for chain in [rig['old'],rig['new']]:
                for a,b in zip(chain,chain[1:]):
                    direction=b-a;t=max(0,min(1,(point-a).dot(direction)/direction.length_squared))
                    if (point-a-direction*t).length<.90:near=True
        if not near:
            hit,_,_,_=baseline.find_nearest(point)
            if hit is not None:v.co=inverse@hit;restored+=1
    coat.data.update();coat.select_set(False)
    # Internal sleeve volumes close cavities left by the old intersecting
    # garment layers. They sit inside the dressed contours, with a continuous
    # bend around the elbow rather than an external ball at the joint.
    pieces=[coat]
    # Back of the lower shoulder: an old cloth slit lies behind the sleeve
    # axis. This small internal overlap fills that pocket flush with its rim.
    mesh=bpy.data.meshes.new('Solape interior de hombro');bm=bmesh.new()
    bmesh.ops.create_uvsphere(bm,u_segments=24,v_segments=16,radius=1)
    for v in bm.verts:v.co=Vector((.01,-1.53,11.93))+Vector((v.co.x*.24,v.co.y*.28,v.co.z*.30))
    bm.to_mesh(mesh);bm.free();item=bpy.data.objects.new('Solape de hombro bajo',mesh);bpy.context.collection.objects.link(item);pieces.append(item)
    # Close the sunken outer elbow flush with the photographed dressed volume;
    # a broad shallow overlap removes the old cuff-like oval termination.
    mesh=bpy.data.meshes.new('Continuidad exterior de codo alto');bm=bmesh.new()
    bmesh.ops.create_uvsphere(bm,u_segments=32,v_segments=20,radius=1)
    for v in bm.verts:v.co=Vector((-1.03,2.03,10.92))+Vector((v.co.x*.40,v.co.y*.24,v.co.z*.40))
    bm.to_mesh(mesh);bm.free();item=bpy.data.objects.new('Solape interior de codo alto',mesh);bpy.context.collection.objects.link(item);pieces.append(item)
    for rig in rigs:
        s,e,w=rig['new'];p=s.lerp(e,.78);q=e.lerp(w,.22)
        centres=[s.lerp(p,t/8) for t in range(9)]
        centres.extend((1-t/12)**2*p+2*(1-t/12)*(t/12)*e+(t/12)**2*q for t in range(1,13))
        centres.extend(q.lerp(w,t/8) for t in range(1,9))
        vertices=[];faces=[];sides=16
        for i,centre in enumerate(centres):
            tangent=(centres[min(i+1,len(centres)-1)]-centres[max(0,i-1)]).normalized()
            u=tangent.cross(Vector((1,0,0))).normalized();v=tangent.cross(u)
            fraction=i/(len(centres)-1);radius=.33-.06*smooth(.65,1,fraction)
            for j in range(sides):
                angle=2*math.pi*j/sides;vertices.append(centre+radius*(u*math.cos(angle)+v*math.sin(angle)))
            if i:
                for j in range(sides):faces.append(((i-1)*sides+j,(i-1)*sides+(j+1)%sides,i*sides+(j+1)%sides,i*sides+j))
        faces.extend([tuple(reversed(range(sides))),tuple((len(centres)-1)*sides+j for j in range(sides))])
        mesh=bpy.data.meshes.new('Volumen interno de manga');mesh.from_pydata(vertices,[],faces);mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        item=bpy.data.objects.new('Núcleo anatómico de manga',mesh);bpy.context.collection.objects.link(item);pieces.append(item)
    bpy.ops.object.select_all(action='DESELECT')
    for piece in pieces:piece.select_set(True)
    bpy.context.view_layer.objects.active=coat;bpy.ops.object.join()
    closure=coat.modifiers.new('Superficie continua final de las mangas','REMESH');closure.mode='VOXEL';closure.voxel_size=.035;closure.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=closure.name)
    blend=coat.vertex_groups.new(name='Continuidad del codo alto')
    for v in coat.data.vertices:
        distance=(coat.matrix_world@v.co-Vector((-1.03,2.03,10.92))).length
        weight=1-smooth(.20,.70,distance)
        if weight>0:blend.add([v.index],weight,'REPLACE')
    elbow_smooth=coat.modifiers.new('Pliegue continuo del codo alto','SMOOTH');elbow_smooth.factor=.40;elbow_smooth.iterations=6;elbow_smooth.vertex_group=blend.name
    bpy.ops.object.modifier_apply(modifier=elbow_smooth.name)
    smoothing=coat.modifiers.new('Acabado de uniones de tela','SMOOTH');smoothing.factor=.25;smoothing.iterations=2
    bpy.ops.object.modifier_apply(modifier=smoothing.name)
    coat.data.calc_loop_triangles();decimate=coat.modifiers.new('Presupuesto de abrigo','DECIMATE');decimate.ratio=min(1,35000/len(coat.data.loop_triangles));decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name);coat.select_set(False)
    coat['adult_arms_revision']='balanced-1.86-1.82'
    report=[]
    for rig in rigs:
        s,e,w=rig['new']
        report.append({'side':rig['side'],'shoulder':list(s),'elbow':list(e),'wrist':list(w),'upperLength':(e-s).length,'forearmLength':(w-e).length})
    print('ARM_PROPORTIONS',report,'changed vertices',len(changed),'restored garment vertices',restored,flush=True)
    return report
