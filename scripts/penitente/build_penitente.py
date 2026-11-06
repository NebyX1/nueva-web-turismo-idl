"""Author an editable, photograph-led Penitente rock gorge in Blender.

Coordinates in the exported scene: X right, Y up, Z downstream. The terrain,
stream bed and shoreline share one surface; water is projected onto that bed.
No photos or third-party geometry are incorporated in the asset.
"""
import bpy,bmesh,math,random,json,sys,argparse,hashlib
from pathlib import Path
from mathutils import Vector,noise
from mathutils.bvhtree import BVHTree

sys.dont_write_bytecode=True
parser=argparse.ArgumentParser();parser.add_argument('--out',required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
noise.seed_set(714);rng=random.Random(714)

def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)

def interpolate(keys,z):
    if z<=keys[0][0]:return keys[0][1]
    for (a,x),(b,y) in zip(keys,keys[1:]):
        if z<=b:return x+(y-x)*(z-a)/(b-a)
    return keys[-1][1]

# The public '60 m' refers to length, not a measured vertical fall. These are
# proportional scene units fitted to the photographs, not a geographic survey.
PROFILE=[(-75,1.4,45.8,1.9),(-61,2.2,45.6,2.6),(-52,.6,45.4,3.0),(-45,1.7,45.2,1.8),(-39,.8,45.0,2.4),(-33,2.1,44.7,1.1),
         (-26,1.6,42.8,.9),(-17,.6,36.0,1.25),(-9,.8,30.2,1.55),(-4,-.8,26.7,1.85),
         (3,-.3,21.8,1.6),(9,-1.8,16.7,1.25),(16,-1.3,10.5,1.7),(22,-3.0,4.0,3.3),
         (26,-3.3,1.25,2.4),(37,-4.2,1.1,2.7),(49,-3.5,1.3,2.8),(59,-2.4,1.8,2.2),
         (64,-2.9,3.60,1.65),(65,-3.0,3.28,1.60),(73,-4.8,1.8,1.35),(85,-8.0,.4,1.1)]
LEFT=[(-75,49),(-45,54),(-20,57),(0,55),(20,49),(40,38),(58,20),(74,5),(87,.5)]
RIGHT=[(-75,48),(-45,50),(-24,47),(-5,39),(15,27),(35,18),(58,10),(76,4),(87,.5)]

def monotone_table(keys):
    h=[b[0]-a[0] for a,b in zip(keys,keys[1:])]
    delta=[(b[1]-a[1])/step for a,b,step in zip(keys,keys[1:],h)]
    derivatives=[delta[0]]
    for i in range(1,len(keys)-1):
        before,after=delta[i-1],delta[i]
        if before*after<=0:derivatives.append(0)
        else:
            w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1]
            derivatives.append((w1+w2)/(w1/before+w2/after))
    derivatives.append(delta[-1])
    return [(z,y,d) for (z,y),d in zip(keys,derivatives)]

def monotone_value(table,z):
    if z<=table[0][0]:return table[0][1]
    for (a,y0,d0),(b,y1,d1) in zip(table,table[1:]):
        if z<=b:
            h=b-a;t=(z-a)/h
            return (2*t**3-3*t*t+1)*y0+(t**3-2*t*t+t)*h*d0+(-2*t**3+3*t*t)*y1+(t**3-t*t)*h*d1
    return table[-1][1]

PROFILE_TABLES=[monotone_table([(p[0],p[i]) for p in PROFILE]) for i in range(1,4)]
def profile(z):return [monotone_value(table,z) for table in PROFILE_TABLES]
def n3(x,y,z):return noise.noise(Vector((x,y,z)),noise_basis='PERLIN_ORIGINAL')

# Irregular finite plates, rather than endless bands across both margins.
# (distance from channel, downstream station, offset, transverse dip, local
# longitudinal dip). Angular cell boundaries form unequal slab terminations.
LEFT_PLATES=[(8,-65,1.1,2.4,.07),(26,-53,-1.8,2.7,-.06),
    (5,-35,2.2,2.6,.12),(20,-29,-1.6,2.0,-.10),(38,-18,1.5,2.8,.08),
    (6,-11,-2.4,2.9,-.13),(23,-2,2.7,2.3,.11),
    (7,10,2.8,2.6,-.10),(36,16,-1.8,2.7,.08),
    (6,29,-1.5,2.7,-.15),(22,39,2.6,2.2,.12),
    (8,51,1.8,2.4,-.07),(35,59,-1.5,2.8,.11),
    (12,72,-1.1,2.2,-.08),(60,4,0,2.5,0),(62,64,0,2.5,0)]
RIGHT_PLATES=[(8,-64,1.2,.51,.06),(30,-49,-1.3,.58,-.07),
    (7,-36,-1.7,.46,-.08),(24,-22,1.9,.61,.10),(45,-13,-1.1,.42,-.08),
    (6,-9,2.1,.48,.09),(21,6,-1.6,.59,-.10),
    (7,18,-1.3,.48,-.08),(36,27,2,.53,.08),
    (8,36,1.8,.44,.08),(22,51,-1.9,.56,-.09),
    (7,66,1.1,.49,.06),(39,71,1.4,.58,.07),(65,18,0,.5,0),(65,70,0,.5,0)]

def slab_rise(x,z,t,gap,left):
    plates=LEFT_PLATES if left else RIGHT_PLATES
    distances=sorted((math.hypot((t-p[0])*1.12,(z-p[1])*.72),i) for i,p in enumerate(plates))
    def plate_height(index):
        px,pz,offset,grade,z_dip=plates[index]
        rise=min(gap,grade*t)
        if not left:
            rim=min(2.4,1.6*t)+grade*max(0,t-1.5)
            blend_pool=smooth(23,28,z)*(1-smooth(60,65,z))
            rise=rise*(1-blend_pool)+min(gap,rim)*blend_pool
        relief=(offset+(z-pz)*z_dip+(t-px)*.045)*smooth(.25,2.5,t)*(1-smooth(35,66,t))
        return rise+relief
    border=distances[1][0]-distances[0][0]
    # A narrow geometric bevel joins adjacent plates. A discontinuous jump
    # sampled on a height grid otherwise creates a periodic sawtooth edge.
    bevel=.5*(1-smooth(0,1.35,border))
    height=plate_height(distances[0][1])*(1-bevel)+plate_height(distances[1][1])*bevel
    cut=(1-smooth(.10,.85,border))*(.4+(1.6 if left else 1.15)*smooth(2,12,t))
    return max(0,height-cut)*(1-(.20 if left else .28)*smooth(44,78,t))

def terrain_height(x,z):
    cx,bed,width=profile(z);d=abs(x-cx);t=max(0,d-width)
    if d<=width:
        # Oblique, slightly ragged bed ledges avoid a ruler-straight elbow.
        bed=profile(z+.70*(x-cx)+.12*n3(x,z,1))[1]
        # A last unequal rock lip supports the flared foot. Its oblique edge
        # intersects the pool at different stations across the water sheet.
        lip=z-.55*(x-cx)
        bed+=.55*smooth(19.3,20.1,lip)*(1-smooth(23.3,24.2,lip))*(.7+.3*(x-cx)/width)
        return bed+.14*(d/width)**2+.025*n3(x*1.4,z*.9,2)*(d/width)
    left=x<cx;crest=interpolate(LEFT if left else RIGHT,z);gap=max(.2,crest-bed)*(.68 if left else .83)
    rise=slab_rise(x,z,t,gap,left)
    if left:
        # One broad, oblique setback in the lower inner cliff, observed in
        # R10/R11. It ends within this face instead of circling the massif.
        inset=min(t-2.5,14.5-t,z-(11+.48*t),30+.20*t-z)
        if inset>0:
            rise=max(0,rise-(4.7+.08*(t-6)-.06*(z-22))*min(1,inset/.6))
        diagonal=abs(z-.62*t-15.7)
        rise=max(0,rise-2.4*(1-smooth(.12,.85,diagonal))*smooth(.8,2,t)*(1-smooth(18,21,t)))
    # Weathering is small compared with the authored planes. It must not
    # turn the left cliff into rounded columns or the right bank into a dune.
    macro=n3(x*.092,z*.075,6)*.16+n3(x*.23,z*.18,1)*.07
    y=bed+rise+macro*smooth(0,2.3,t)
    boundary=max(abs(x)/91,max(0,(z-4)/86))
    return max(.03,y*(1-smooth(.87,1.09,boundary)))

def world(x,y,z):return Vector((x,-z,y))
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def blend(a,b,t):return tuple(x+(y-x)*t for x,y in zip(a,b))

def rock_color(x,y,z):
    cx,bed,width=profile(z);d=abs(x-cx)
    warm=.5+.5*n3(x*.14,y*.13,z*.12)
    base=blend((.42,.41,.38),(.46,.37,.335),warm*.6)
    fleck=.5+.5*n3(x*1.65,y*1.6,z*1.6)
    lichen=smooth(.57,.72,fleck)*(.78 if y>bed+1 else .15)
    base=blend(base,(.68,.69,.59),lichen*.35)
    t=max(0,d-width);plates=LEFT_PLATES if x<cx else RIGHT_PLATES
    distances=sorted(math.hypot((t-p[0])*1.12,(z-p[1])*.72) for p in plates)
    boundary=distances[1]-distances[0]
    base=blend(base,(.22,.20,.18),(1-smooth(.1,.7,boundary))*.24*smooth(.5,3,t))
    wet=(1-smooth(width*.75,width+2.2,d))*(smooth(-36,-24,z)*(1-smooth(23,30,z)))
    base=blend(base,(.15,.135,.12),wet*.85)
    # Warm grassy soil only beyond exposed main rock faces.
    soil=smooth(28,63,d)*smooth(.0,.6,n3(x*.17,z*.19,7)+.35)
    base=blend(base,(.33,.37,.23),soil*.65)
    return (*[linear(max(.025,min(.9,c))) for c in base],1)

rock_material=bpy.data.materials.new('Gneis gris rosado, líquenes y roca mojada');rock_material.use_nodes=True
bsdf=rock_material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.92
color_node=rock_material.node_tree.nodes.new('ShaderNodeVertexColor');color_node.layer_name='RockColor';rock_material.node_tree.links.new(color_node.outputs['Color'],bsdf.inputs['Base Color'])

def make_mesh(name,points,faces,kind='rock',flow=None):
    data=bpy.data.meshes.new(name);data.from_pydata(points,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj['kind']=kind
    if kind=='rock':
        attr=data.color_attributes.new(name='RockColor',type='FLOAT_COLOR',domain='POINT')
        attr.data.foreach_set('color',[c for p in points for c in rock_color(p[0],p[2],-p[1])]);data.materials.append(rock_material)
    else:
        mat=bpy.data.materials.new(name);mat.use_nodes=True;shader=mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value=(.53,.65,.62,1) if kind=='falls' else (.035,.075,.06,1)
        shader.inputs['Roughness'].default_value=.38 if kind=='falls' else .19
        shader.inputs['Metallic'].default_value=.08;data.materials.append(mat)
        uv=data.uv_layers.new(name='Flow')
        for poly in data.polygons:
            for loop in poly.loop_indices:uv.data[loop].uv=flow[data.loops[loop].vertex_index][:2]
        obj['flow']=json.dumps(flow,separators=(',',':'))
    for poly in data.polygons:poly.use_smooth=True
    return obj

inner=[i/4 for i in range(5)]
bank=[1+i*.42 for i in range(1,34)]+[15+i*.70 for i in range(101)]
q=sorted(set([-v for v in inner[1:]+bank]+inner+bank));cols=len(q);rows=513
points=[];faces=[]
for j in range(rows):
    z=-78+j*164/(rows-1);cx,bed,width=profile(z)
    for u in q:
        offset=u*width if abs(u)<=1 else math.copysign(width+abs(u)-1,u)
        x=cx+offset;points.append(world(x,terrain_height(x,z),z))
for j in range(rows-1):
    for i in range(cols-1):
        a=j*cols+i;b=a+1;c=a+cols;d=c+1;faces.extend([(a,c,b),(b,c,d)])
perimeter=list(range(cols))+[j*cols+cols-1 for j in range(1,rows)]+list(range((rows-1)*cols+cols-2,(rows-1)*cols-1,-1))+[j*cols for j in range(rows-2,0,-1)]
bottom=[]
for i in perimeter:
    p=points[i];bottom.append(len(points));points.append(Vector((p.x,p.y,-1.2)))
for k,a in enumerate(perimeter):
    n=(k+1)%len(perimeter);b=perimeter[n];faces.append((a,b,bottom[n],bottom[k]))
bottom_center=len(points);points.append(Vector((0,0,-1.2)))
for k in range(len(bottom)):faces.append((bottom_center,bottom[k],bottom[(k+1)%len(bottom)]))
terrain=make_mesh('Farallón izquierdo, canaleta y rampa derecha — macizo continuo',points,faces)
bvh=BVHTree.FromPolygons(points,faces)

def bed_hit(x,z):
    hit,normal,_,_=bvh.ray_cast(Vector((x,-z,100)),Vector((0,0,-1)),200)
    if hit is None:raise RuntimeError('Surface sampling missed the rock mass')
    return hit.z,normal

def monolith(name,x,z,width,depth,height,lean):
    base=bed_hit(x,z)[0]-.7;vertices=[];polys=[]
    outline=[(-.5,-.28),(-.32,-.5),(.29,-.5),(.5,-.25),(.5,.31),(.27,.5),(-.34,.5),(-.5,.25)];sides=len(outline)
    for j,(h,r) in enumerate([(0,1),(.72,.96),(1,.78)]):
        for i,(u,v) in enumerate(outline):
            vertices.append(world(x+u*width*r+lean*h,base+height*h+(u*.55+v*.25)*h,z+v*depth*r))
            if j:
                a=(j-1)*sides+i;b=(j-1)*sides+(i+1)%sides;c=j*sides+(i+1)%sides;d=j*sides+i;polys.append((a,b,c,d))
    polys.extend([tuple(reversed(range(sides))),tuple(2*sides+i for i in range(sides))])
    obj=make_mesh(name,vertices,polys);bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    return obj

def macro_mass(name,x,z,w,d,top,side,tilt=0,rotation=0,drop=-12):
    # Large joined polyhedral masses produce the silhouette and major planes.
    # They are intentionally different in footprint, setback, height and tilt.
    outline=[(-.50,-.31),(-.31,-.50),(.24,-.50),(.50,-.27),(.50,.22),(.26,.50),(-.28,.50),(-.50,.29)]
    vertices=[];polys=[];sides=len(outline)
    for ring in range(3):
        for i,(u,v) in enumerate(outline):
            inset=1 if ring<2 else .87
            xx=x+(u*w*math.cos(rotation)-v*d*math.sin(rotation))*inset
            zz=z+(u*w*math.sin(rotation)+v*d*math.cos(rotation))*inset
            cx,_,width=profile(zz)
            if side<0:xx=min(xx,cx-width-.75)
            else:xx=max(xx,cx+width+.75)
            ground=bed_hit(xx,zz)[0]
            cap=top+u*tilt+v*drop+(.45 if i in [0,3,6] else -.45)
            if side>0:
                # The right margin is a broad inclined pavement. Its exposed
                # slab edges are shallow, not a second row of tall parapets.
                cap=min(ground+1.10,cap)
                yy=ground-2.0 if ring==0 else ground-.25 if ring==1 else max(ground+.18,cap)
            elif name.startswith('Raíz'):
                yy=ground-3.5 if ring==0 else max(ground-.2,cap-(2.6 if ring==1 else 0))
            else:
                # These slabs follow the steep oblique left rock face. The
                # old tall caps produced vertical barrel-like columns.
                cap=min(ground+1.6,cap)
                yy=ground-2.5 if ring==0 else ground-.3 if ring==1 else max(ground+.15,cap)
            vertices.append(world(xx,yy,zz))
            if ring:
                a=(ring-1)*sides+i;b=(ring-1)*sides+(i+1)%sides;c=ring*sides+(i+1)%sides;e=ring*sides+i;polys.append((a,b,c,e))
    polys.extend([tuple(reversed(range(sides))),tuple(2*sides+i for i in range(sides))])
    obj=make_mesh(name,vertices,polys);bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    for p in obj.data.polygons:p.use_smooth=False

# The main slabs are already in the terrain volume. Do not lay broad caps
# over them: those caps bridge the carved faults and erase their relief.
macro_mass('Raíz común del monolito partido',-17,8,15,9,58,-1,-3,.05,-3)

def all_rock_bvh():
    p=[];f=[]
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or obj.get('kind')!='rock':continue
        obj.data.calc_loop_triangles();start=len(p);p.extend(v.co.copy() for v in obj.data.vertices)
        f.extend(tuple(start+i for i in t.vertices) for t in obj.data.loop_triangles)
    return BVHTree.FromPolygons(p,f)

bvh=all_rock_bvh()
monolith('Monolito partido — laja mayor',-19,8,6.4,4.6,13.2,.20)
monolith('Monolito partido — laja menor',-12.2,7.7,5.0,4.1,12.2,-.12)
for i,(z,offset,w,d) in enumerate([(-67,-.8,1.6,2.1),(-60,.9,1.8,1.8),(-55,-.3,1.7,1.7),(-49,1,1.7,2),(-43,-.7,1.4,1.6),(-37,.3,1.3,1.5)]):
    cx,_,_=profile(z)
    monolith('Piedra emergente del arroyo %02d'%i,cx+offset,z,w,d,1.6,0)

# Union the actual masses, then weather their surface in 3D. This does not
# replace macroscopic geometry with noise; the setbacks and planes are above.
rocks=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.get('kind')=='rock']
bpy.ops.object.select_all(action='DESELECT')
for obj in rocks:obj.select_set(True)
bpy.context.view_layer.objects.active=terrain;bpy.ops.object.join()
print('PENITENTE_STAGE union',len(terrain.data.vertices),'input vertices',flush=True)
remesh=terrain.modifiers.new('Unión de macizos y lajas','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.42;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
print('PENITENTE_STAGE weathering',len(terrain.data.vertices),'vertices',flush=True)
terrain.data.update()
surface_vertices=[(v,v.co.copy(),v.normal.copy()) for v in terrain.data.vertices]
for v,co,normal in surface_vertices:
    x,y,z=co.x,co.z,-co.y
    if y<.5:continue
    amplitude=.035+.065*(1-abs(normal.z))
    grain=n3(x*.72,y*.73,z*.70)*amplitude+n3(x*.24,y*.27,z*.21)*.12
    cx,_,width=profile(z);grain*=.15+.85*smooth(width+.4,width+2.5,abs(x-cx))
    v.co=co+normal*grain
terrain.data.update();terrain.data.calc_loop_triangles()
print('PENITENTE_STAGE decimation',len(terrain.data.loop_triangles),'input triangles',flush=True)
decimate=terrain.modifiers.new('Masa rocosa optimizada para la web','DECIMATE');decimate.ratio=min(1,108000/len(terrain.data.loop_triangles));decimate.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=decimate.name)
print('PENITENTE_STAGE paint',len(terrain.data.vertices),'vertices',flush=True)
bm=bmesh.new();bm.from_mesh(terrain.data);remaining=set(bm.verts);components=[]
while remaining:
    seed=remaining.pop();component=[seed];queue=[seed]
    while queue:
        current=queue.pop()
        for edge in current.link_edges:
            adjacent=edge.other_vert(current)
            if adjacent in remaining:remaining.remove(adjacent);component.append(adjacent);queue.append(adjacent)
    components.append(component)
largest=max(components,key=len);loose=[v for component in components if component is not largest for v in component]
if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS')
bmesh.ops.dissolve_degenerate(bm,dist=.004,edges=list(bm.edges))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(terrain.data);bm.free()
print('PENITENTE_STAGE removed detached remesh artifacts',len(loose),'vertices',flush=True)
terrain.data.update()
existing=terrain.data.color_attributes.get('RockColor')
if existing:terrain.data.color_attributes.remove(existing)
attr=terrain.data.color_attributes.new(name='RockColor',type='FLOAT_COLOR',domain='POINT')
attr.data.foreach_set('color',[c for v in terrain.data.vertices for c in rock_color(v.co.x,v.co.z,-v.co.y)])
for face in terrain.data.polygons:face.use_smooth=True
bvh=all_rock_bvh()
print('PENITENTE_STAGE water and shoreline',flush=True)

terrain.data.calc_loop_triangles()
upper_points=[];upper_faces=[];upper_flow=[]
for tri in terrain.data.loop_triangles:
    if tri.normal.z<.10:continue
    original=[terrain.data.vertices[i].co.copy() for i in tri.vertices]
    if all(-p.y< -72 or -p.y> -33 for p in original):continue
    if all(abs(p.x-profile(-p.y)[0])>profile(-p.y)[2]+1 for p in original):continue
    polygon=[(p,False) for p in original]
    fields=[(lambda p:-p.y+72,False),(lambda p:-33+p.y,False),
            (lambda p:profile(-p.y)[2]+.35-abs(p.x-profile(-p.y)[0]),False),
            (lambda p:profile(-p.y)[1]+.22-p.z,True)]
    for distance,shore in fields:
        clipped=[]
        for (p,edge),(b,_) in zip(polygon,polygon[1:]+polygon[:1]):
            da,db=distance(p),distance(b);a_in=da>=0;b_in=db>=0
            if a_in:clipped.append((p,edge))
            if a_in!=b_in:clipped.append((p.lerp(b,da/(da-db)),shore))
        polygon=clipped
        if not polygon:break
    if len(polygon)<3:continue
    start=len(upper_points)
    for p,shore in polygon:
        z=-p.y;cx,bed,width=profile(z)
        upper_points.append(world(p.x,bed+.235,z))
        upper_flow.append([(p.x-cx)/(2*(width+.35))+.5,(z+72)/1.6,.55 if shore else .18])
    for i in range(1,len(polygon)-1):upper_faces.append((start,start+i,start+i+1))
make_mesh('Arroyo superior — ensanches, rápidos y piedras emergentes',upper_points,upper_faces,'falls',upper_flow)

water_points=[];water_faces=[];flow=[];curve=[];travel=39/1.6;previous=None
for j in range(385):
    z=-33+j*57/384;cx,bed,width=profile(z);yy=bed_hit(cx,z)[0]
    current=Vector((cx,yy,z));slope=0 if previous is None else max(0,(previous.y-yy)/max(.001,(current-previous).length))
    speed=1.5+7.5*slope
    if previous is not None:travel+=(current-previous).length/speed
    curve.append([cx,yy+.085,z,width,travel,slope]);previous=current
    for i in range(17):
        u=i/16
        flare=smooth(15,23,z)
        side_width=width*(.92+.10*n3(z*.7,u*4,3))*(1+flare*(-.10+.20*u))
        x=cx+(u*2-1)*side_width+flare*.22;h,_=bed_hit(x,z)
        water_points.append(world(x,h+.085,z));flow.append([u,travel,.18+.77*smooth(.08,.75,slope)])
        if j and i:
            a=(j-1)*17+i-1;b=a+1;c=j*17+i-1;d=c+1;water_faces.extend([(a,c,b),(b,c,d)])
make_mesh('Canaleta del salto inclinado — agua apoyada en roca',water_points,water_faces,'falls',flow)

# Clip each submerged rock triangle at pool level. Its shoreline is therefore
# the intersection with the gorge, never a disk placed on top of the bank.
pool_y=3.65;pool_points=[];pool_faces=[];pool_flow=[]
terrain.data.calc_loop_triangles()
for tri in terrain.data.loop_triangles:
    if tri.normal.z<.10:continue
    original=[terrain.data.vertices[i].co.copy() for i in tri.vertices]
    if all(-p.y<22 or -p.y>64 for p in original):continue
    if all(abs(p.x-profile(-p.y)[0])>profile(-p.y)[2]+6 for p in original):continue
    polygon=[(p,False) for p in original]
    for distance,shore in [(lambda p:-p.y-22,False),(lambda p:64+p.y,False),(lambda p:pool_y-p.z,True)]:
        clipped=[]
        for (p,edge),(b,_) in zip(polygon,polygon[1:]+polygon[:1]):
            da,db=distance(p),distance(b);a_in=da>=0;b_in=db>=0
            if a_in:clipped.append((p,edge))
            if a_in!=b_in:clipped.append((p.lerp(b,da/(da-db)),shore))
        polygon=clipped
        if not polygon:break
    if len(polygon)<3:continue
    start=len(pool_points)
    for p,edge in polygon:
        pool_points.append(Vector((p.x,p.y,pool_y+.018)));pool_flow.append([p.x,-p.y,1 if edge else max(0,1-(pool_y-p.z)/.6)])
    for i in range(1,len(polygon)-1):pool_faces.append((start,start+i,start+i+1))
make_mesh('Poza alargada — orilla recortada por las rocas',pool_points,pool_faces,'pool',pool_flow)

# Lower outlet runs on the bed, connecting the pool with the serrano valley.
out_points=[];out_faces=[];out_flow=[];travel=0;previous=None
for j in range(65):
    z=64+j*21.2/64;cx,bed,width=profile(z);y,_=bed_hit(cx,z)
    current=Vector((cx,y,z))
    if previous is not None:travel+=(current-previous).length/1.9
    previous=current
    for i in range(9):
        u=i/8;xx=cx+(u*2-1)*width;yy,_=bed_hit(xx,z)
        out_points.append(world(xx,yy+.06,z));out_flow.append([u,travel,.23])
        if j and i:
            a=(j-1)*9+i-1;b=a+1;c=j*9+i-1;d=c+1;out_faces.extend([(a,c,b),(b,c,d)])
make_mesh('Desagüe de la poza hacia el valle',out_points,out_faces,'falls',out_flow)

shrubs=[]
for trial in range(10000):
    if len(shrubs)>=900:break
    x=rng.uniform(-72,73);z=rng.uniform(-72,81);cx,bed,width=profile(z)
    if abs(x-cx)<width+2.7:continue
    if 18<z<68 and abs(x-cx)<width+9:continue
    if z>=68 and abs(x-cx)<width+4:continue
    y,normal=bed_hit(x,z)
    if normal.z<.38 or y<.1:continue
    if math.hypot(x+17,z-8)<6:continue
    if ((x<cx and abs(x-cx)<13) or (x>cx and abs(x-cx)<27)) and -30<z<50 and rng.random()<.89:continue
    shrubs.append([x,y,z,rng.uniform(.8,1.4) if z>=68 else rng.uniform(1.15,2.8),rng.random()*math.tau,rng.random()])

# The lower brook continues into riparian monte at the edge of this model.
# Roots are on the banks; only their crowns overhang the water, as in F01.
for z in [79.5,81,82.5,84,85]:
    cx,_,width=profile(z)
    for side in [-1,1]:
        x=cx+side*(width+.75);y,_=bed_hit(x,z)
        shrubs.append([x,y,z,2.15,rng.random()*math.tau,rng.random()])

raw=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    data=obj.data;data.calc_loop_triangles();positions=[];normals=[];colors=[]
    color=data.color_attributes.get('RockColor')
    for v in data.vertices:
        positions.extend((v.co.x,v.co.z,-v.co.y));normals.extend((v.normal.x,v.normal.z,-v.normal.y))
        if color:colors.extend(color.data[v.index].color[:3])
    raw.append(dict(name=obj.name,kind=obj['kind'],positions=positions,normals=normals,colors=colors,
                    indices=[i for t in data.loop_triangles for i in t.vertices],flow=json.loads(obj['flow']) if 'flow' in obj else None))

impact=next(p[:3] for p in curve if p[1]<=pool_y+.018)
impact[1]=pool_y+.018
report={'coordinateSystem':'X right / Y up / Z downstream','profile':PROFILE,'curve':curve,'shrubs':shrubs,
        'poolLevel':pool_y+.018,'impact':impact,
        'maxY':max(max(m['positions'][1::3]) for m in raw),'source':'Photograph-led interpretation; no metric survey'}
(out/'raw.json').write_text(json.dumps({'meshes':raw,'landscape':report},separators=(',',':')),encoding='utf8')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'penitente.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'penitente.glb'),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
print('PENITENTE_AUTHORED',len(raw),'meshes',sum(len(m['indices'])//3 for m in raw),'triangles',len(shrubs),'shrubs',report['maxY'],'maximum Y',flush=True)
