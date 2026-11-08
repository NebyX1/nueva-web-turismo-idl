"""Photo-led Parque Rodo, Minas. Blender 4.5 LTS, web axes X/Y-up/Z.
Run: blender --background --python build_model.py -- --out assets/parque-rodo
Distances between sectors are condensed; this is not a cadastral survey.
"""
import bpy, bmesh, math, random, json, argparse, sys
from pathlib import Path
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('--out',required=True)
args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.preferences.filepaths.save_version=0
rng=random.Random(1941);objects=[];icos={}
def world(p):return(p[0],-p[2],p[1])
def smooth(a,b,t):
 t=max(0,min(1,(t-a)/(b-a)));return t*t*(3-2*t)
def ground(x,z):
 base=.5+4.3*smooth(180,262,z)+.26*math.sin(x*.03)*math.sin(z*.025)
 r=math.hypot((x-56)/36,(z-132)/43)
 if r<1.12:base=base*smooth(.83,1.12,r)-1.05*(1-smooth(.83,1.12,r))
 return base*(1-smooth(155,185,abs(x)))*(1-smooth(296,326,z))*(smooth(-120,-98,z))
palette={'grass':(.24,.32,.14),'stone':(.33,.31,.27),'cream':(.70,.68,.58),'metal':(.16,.22,.19),'wood':(.13,.075,.039),'thatch':(.24,.17,.08),'road':(.25,.25,.23),'path':(.46,.29,.18),'concrete':(.45,.45,.39),'blue':(.035,.23,.43),'water':(.035,.15,.13),'glass':(.18,.37,.38),'red':(.50,.08,.055),'yellow':(.71,.44,.04),'green':(.08,.30,.12),'leaf':(.15,.26,.10),'bark':(.34,.31,.23),'pink':(.53,.12,.21)}
materials={}
for key,c in palette.items():
 m=bpy.data.materials.new(key);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*c,1);s.inputs['Roughness'].default_value=.88 if key not in ['water','glass'] else .22
 if key=='glass':s.inputs['Alpha'].default_value=.28;m.surface_render_method='DITHERED'
 materials[key]=m
def register(obj,name,kind):
 obj.name=name;obj['kind']=kind
 if not obj.data.materials:obj.data.materials.append(materials[kind])
 objects.append(obj);return obj
def mesh(name,verts,faces,kind):
 d=bpy.data.meshes.new(name);d.from_pydata([world(v) for v in verts],[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return register(o,name,kind)
def box(name,pos,size,kind,bevel=0):
 x,y,z=[s/2 for s in size]
 o=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)],kind);o.location=world(pos)
 if bevel:m=o.modifiers.new('Soft edge','BEVEL');m.width=bevel;m.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def beam(name,a,b,r,kind,vertices=8):
 a,b=Vector(a),Vector(b);direction=(b-a).normalized();u=direction.cross(Vector((0,0,1)) if abs(direction.z)<.9 else Vector((0,1,0))).normalized();v=direction.cross(u)
 points=[]
 for center in [a,b]:
  for i in range(vertices):
   angle=i/vertices*math.tau;points.append(tuple(center+(u*math.cos(angle)+v*math.sin(angle))*r))
 faces=[tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))]
 for i in range(vertices):k=(i+1)%vertices;faces.append((i,k,k+vertices,i+vertices))
 return mesh(name,points,faces,kind)
def ellipsoid(name,pos,scale,kind,sub=1):
 key=(sub,kind)
 if key not in icos:
  bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1);data=bpy.data.meshes.new('Shared '+kind);bm.to_mesh(data);bm.free()
  if kind=='leaf':
   for polygon in data.polygons:polygon.use_smooth=True
  icos[key]=data
 o=bpy.data.objects.new(name,icos[key]);bpy.context.collection.objects.link(o);o.location=world(pos);o.scale=(scale[0],scale[2],scale[1]);return register(o,name,kind)
def circle(name,x,z,rx,rz,y,kind,segments=64):
 v=[(x,y,z)]+[(x+rx*math.sin(i/segments*math.tau),y,z+rz*math.cos(i/segments*math.tau)) for i in range(segments)]
 return mesh(name,v,[(0,1+i,1+(i+1)%segments) for i in range(segments)],kind)
def ring(name,x,z,inner,outer,y,kind,segments=96,start=0,end=math.tau):
 v=[];f=[]
 for i in range(segments+1):
  a=start+(end-start)*i/segments
  for rx,rz in [inner,outer]:v.append((x+rx*math.sin(a),y,z-rz*math.cos(a)))
  if i:n=i*2;f.append((n-2,n,n+1,n-1))
 return mesh(name,v,f,kind)
def ribbon(name,points,width,kind):
 v=[];f=[]
 for i,(x,z) in enumerate(points):
  ax,az=points[max(0,i-1)];bx,bz=points[min(len(points)-1,i+1)];dx,dz=bx-ax,bz-az;l=max(.001,math.hypot(dx,dz))
  for side in [-1,1]:
   xx=x+dz/l*width/2*side;zz=z-dx/l*width/2*side;v.append((xx,ground(xx,zz)+.065,zz))
  if i:n=i*2;f.append((n-2,n,n+1,n-1))
 return mesh(name,v,f,kind)

# A continuous patch, feathered to the journey's level terrain; no floating disc.
v=[];f=[];nx,nz=92,112
for j in range(nz+1):
 z=-125+j*455/nz
 for i in range(nx+1):x=-190+i*380/nx;v.append((x,ground(x,z),z))
for j in range(nz):
 for i in range(nx):n=j*(nx+1)+i;f.append((n,n+nx+1,n+nx+2,n+1))
terrain=mesh('Suelo continuo del parque',v,f,'grass')
color=terrain.data.color_attributes.new(name='ParkColor',type='FLOAT_COLOR',domain='POINT')
for i,p in enumerate(v):
 variation=.9+.12*math.sin(p[0]*.17+p[2]*.11);color.data[i].color=tuple(c*variation for c in palette['grass'])+(1,)
m=materials['grass'];n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='ParkColor';m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
ribbon('Calle de acceso descendente',[(8*math.sin((z-244)*.012),z) for z in range(60,317,4)],8,'road')
ribbon('Paseo del lago',[(13+9*math.sin(i*.08),67+i*2.4) for i in range(63)],2.7,'path')
ring('Circuito del ruedo',0,0,(91,65),(99,73),.56,'road')
circle('Campo del ruedo',0,0,64,43,.68,'grass')
ring('Pista de tierra oval',0,0,(64,43),(73,51),.70,'path')
for tier in range(5):
 inner=(74+tier*2.25,52+tier*1.7);outer=(76.2+tier*2.25,53.65+tier*1.7)
 ring('Tribuna curva de hormigon '+str(tier+1),0,0,inner,outer,.82+tier*.48,'concrete',110,.34,math.tau-.34)
 v=[];f=[]
 for i in range(111):
  a=.34+(math.tau-.68)*i/110;x=inner[0]*math.sin(a);z=-inner[1]*math.cos(a)
  v.extend([(x,.02 if tier==0 else .82+(tier-1)*.48,z),(x,.82+tier*.48,z)])
  if i:n=i*2;f.append((n-2,n,n+1,n-1))
 mesh('Contrahuella de tribuna',v,f,'concrete')
v=[];f=[]
for i in range(111):
 a=.34+(math.tau-.68)*i/110;x=85.2*math.sin(a);z=-60.45*math.cos(a)
 v.extend([(x,.02,z),(x,2.74,z)])
 if i:n=i*2;f.append((n-2,n-1,n+1,n))
mesh('Muro posterior de tribuna',v,f,'concrete')
for i in range(86):
 a=.36+(math.tau-.72)*i/85;x=73.4*math.sin(a);z=-51.4*math.cos(a)
 beam('Poste del ruedo',(x,.72,z),(x,2.05,z),.055,'cream',6)
ring('Baranda interior del ruedo',0,0,(73.3,51.3),(73.5,51.5),2.02,'cream',120,.34,math.tau-.34)

# The characteristic portal is a horizontal canopy on stone piers/cream columns.
GZ=244;GY=ground(0,GZ)
for side in [-1,1]:
 x=side*8.4;box('Pilar de piedra',(x,GY+1.7,GZ),(1.7,3.4,1.6),'stone',.035)
 box('Coronacion del pilar',(x,GY+3.45,GZ),(2.04,.22,1.95),'cream',.035)
 beam('Columna clara',(x,GY+3.56,GZ),(x,GY+6.05,GZ),.36,'cream',24)
 box('Base de columna',(x,GY+3.64,GZ),(.84,.16,.84),'cream',.02)
 # Sloping side wings have the same irregular stone surface as the piers.
 a=side*9.25;b=side*15.7
 mesh('Ala de piedra inclinada',[(a,GY,GZ-.58),(b,GY,GZ-.58),(b,GY+1.18,GZ-.58),(a,GY+3.15,GZ-.58),(a,GY,GZ+.58),(b,GY,GZ+.58),(b,GY+1.18,GZ+.58),(a,GY+3.15,GZ+.58)],[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2)],'stone')
 beam('Remate inclinado',(a,GY+3.18,GZ),(b,GY+1.25,GZ),.11,'cream')
 box('Muro lateral de piedra',(side*21,GY+.65,GZ),(10.5,1.3,1.1),'stone')
 for xx in [17,23,27]:box('Pilon del muro',(side*xx,GY+.77,GZ),(1,1.55,1.5),'cream')
 box('Coronacion del muro',(side*21,GY+1.37,GZ),(10.5,.15,1.35),'cream')
 # Individual warm/grey irregular plaques keep the stone legible at close range.
 for row in range(9):
  for col in range(4):
   xx=x+(col-1.5)*.36+(rng.random()-.5)*.10;y=GY+.16+row*.35
   box('Piedra vista',(xx,y,GZ+.819),(.30+rng.random()*.12,.25+rng.random()*.10,.035),'stone',.025)
roof=box('Marquesina horizontal',(0,GY+6.22,GZ),(20.6,.48,3.8),'cream',.08)
for x in [-5.4,0,5.4]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.62,depth=1.5,location=world((x,GY+6.22,GZ)))
 cutter=bpy.context.object;mod=roof.modifiers.new('Oculo circular','BOOLEAN');mod.object=cutter;mod.operation='DIFFERENCE';bpy.context.view_layer.objects.active=roof;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
for i in range(32):
 x=-7.5+15*i/32;xx=-7.5+15*(i+1)/32
 y=GY+6.55+2.08*math.sqrt(max(0,1-(x/7.5)**2));yy=GY+6.55+2.08*math.sqrt(max(0,1-(xx/7.5)**2))
 beam('Arco metalico del nombre',(x,y,GZ),(xx,yy,GZ),.075,'metal')
font=bpy.data.curves.new('PARQUE RODO','FONT');font.body='P A R Q U E  R O D Ó';font.align_x='CENTER';font.size=.69;font.extrude=.012;font.bevel_depth=.004
try:font.font=bpy.data.fonts.load('C:/Windows/Fonts/arial.ttf')
except:pass
text=bpy.data.objects.new('Nombre del parque',font);bpy.context.collection.objects.link(text);text.location=world((0,GY+6.66,GZ+.10));text.rotation_euler=(math.pi/2,0,0);text.data.materials.append(materials['metal']);text['kind']='metal';bpy.context.view_layer.objects.active=text;text.select_set(True);bpy.ops.object.convert(target='MESH');objects.append(bpy.context.object)

# Long pergola/rose walk, as photographed in 2017 and 2022.
for i in range(10):
 z=168+i*3.8
 for x in [-50,-45]:beam('Poste claro de pergola',(x,ground(x,z),z),(x,ground(x,z)+3.0,z),.12,'cream')
 beam('Travesano verde',(-50.8,ground(-47,z)+3.05,z),(-44.2,ground(-47,z)+3.05,z),.11,'green')
for x in [-50,-45]:beam('Viga verde longitudinal',(x,ground(x,168)+3.1,167),(x,ground(x,202)+3.1,203),.12,'green')
ribbon('Sendero rojizo del rosedal',[(-47.5,z) for z in range(164,209,2)],3.5,'path')
for side in [-1,1]:
 for i in range(28):
  z=166+i*1.45;x=-47.5+side*4.3;y=ground(x,z)
  ellipsoid('Rosal',(x,y+.34,z),(.46,.42,.5),'green',1)
  for j in range(3):ellipsoid('Rosas',(x+(rng.random()-.5)*.6,y+.62,z+(rng.random()-.5)*.65),(.12,.1,.12),'pink' if i%2 else 'yellow',1)

# Shoreline clipped against the SAME terrain triangles, with a 7 mm contact bias.
LAKE=.22
waterverts=[];waterfaces=[]
for polygon in terrain.data.polygons:
 for ids in [(polygon.vertices[0],polygon.vertices[1],polygon.vertices[2]),(polygon.vertices[0],polygon.vertices[2],polygon.vertices[3])]:
  triangle=[]
  for vi in ids:
   co=terrain.data.vertices[vi].co;triangle.append((co.x,co.z,-co.y))
  if not any(math.hypot((q[0]-56)/36,(q[2]-132)/43)<1.2 for q in triangle):continue
  clipped=[]
  for a,b in zip(triangle,triangle[1:]+triangle[:1]):
   inside=a[1]<=LAKE;other=b[1]<=LAKE
   if inside:clipped.append(a)
   if inside!=other:
    t=(LAKE-a[1])/(b[1]-a[1]);clipped.append(tuple(a[k]+(b[k]-a[k])*t for k in range(3)))
  if len(clipped)>=3:
   first=len(waterverts);waterverts.extend([(q[0],LAKE+.007,q[2]) for q in clipped])
   for i in range(1,len(clipped)-1):waterfaces.append((first,first+i,first+i+1))
mesh('Lago artificial',waterverts,waterfaces,'water')
startY=ground(26,186)+.1
mesh('Rampa de acceso al mirador',[(24.85,startY,186),(27.15,startY,186),(28.15,2,173),(25.85,2,173)],[(0,1,2,3)],'wood')
for side in [-1,1]:
 for i in range(6):
  t=i/5;x=26+t;z=186-13*t;y=startY+(2-startY)*t
  beam('Poste de rampa',(x+side*1.25,ground(x+side*1.25,z)-.05,z),(x+side*1.25,y+1.2,z),.10,'wood')
 beam('Pasamanos de rampa',(26+side*1.25,startY+1.2,186),(27+side*1.25,3.2,173),.085,'wood')
def walkway(a,b):
 ax,az=a;bx,bz=b;length=math.hypot(bx-ax,bz-az);dx,dz=(bx-ax)/length,(bz-az)/length;px,pz=dz,-dx
 def point(t,s,y):return(ax+dx*t+px*s,y,az+dz*t+pz*s)
 count=math.ceil(length/.30)
 for i in range(count):
  o=box('Tabla de pasarela',point((i+.5)*length/count,0,2.0),(2.3,.12,length/count*.94),'wood');o.rotation_euler.z=math.atan2(dx,dz)
 sections=math.ceil(length/2.35)
 for i in range(sections+1):
  t=length*i/sections
  for side in [-1,1]:
   foot=point(t,side*1.25,-.9);top=point(t,side*1.25,3.3);beam('Poste oscuro de pasarela',foot,top,.105,'wood')
   if i:
    prev=length*(i-1)/sections
    for y in [2.22,3.2]:beam('Pasamanos de madera',point(prev,side*1.25,y),point(t,side*1.25,y),.085,'wood')
    beam('Diagonal X',point(prev,side*1.25,2.22),point(t,side*1.25,3.2),.065,'wood')
    beam('Diagonal X',point(prev,side*1.25,3.2),point(t,side*1.25,2.22),.065,'wood')
walkway((27,173),(30,146));walkway((30,146),(47,146));walkway((47,146),(51,139))
for i in range(18):box('Tablas del mirador',(51,2.0,136.5+i*.30),(5.5,.12,.27),'wood')
for a,b in [((48.2,136),(53.8,136)),((48.2,142.2),(53.8,142.2)),((53.8,136),(53.8,142.2))]:
 for y in [2.25,3.2]:beam('Baranda del mirador',(a[0],y,a[1]),(b[0],y,b[1]),.085,'wood')
for x in [48.2,53.8]:
 for z in [136,142.2]:beam('Pilar del mirador',(x,-.8,z),(x,3.35,z),.11,'wood')

# Current covered swimming complex; roof and blue/glazed frames are legible.
PX,PZ=113,110;PW,PL=24,43;PY=ground(PX,PZ)
box('Basamento de piscina',(PX,PY+.20,PZ),(PW+3,.4,PL+3),'concrete')
box('Agua de piscina',(PX,PY+.55,PZ),(18,.04,34),'blue')
for lane in range(6):box('Carril de natacion',(PX-7.5+lane*3,PY+.575,PZ),(.12,.015,32),'metal')
for side in [-1,1]:
 for i in range(10):
  z=PZ-PL/2+i*PL/9;beam('Columna azul de piscina',(PX+side*PW/2,PY+.4,z),(PX+side*PW/2,PY+6.4,z),.10,'blue')
  if i<9:box('Ventanal de piscina',(PX+side*PW/2,PY+3.3,z+PL/18),(.05,5.6,PL/9-.20),'glass')
roofv=[(PX-PW*.56,PY+6.5,PZ-PL*.54),(PX+PW*.56,PY+6.5,PZ-PL*.54),(PX+PW*.56,PY+6.5,PZ+PL*.54),(PX-PW*.56,PY+6.5,PZ+PL*.54),(PX,PY+9.2,PZ-PL*.54),(PX,PY+9.2,PZ+PL*.54)]
mesh('Cubierta azul liviana',roofv,[(0,3,5,4),(4,5,2,1),(0,4,1),(3,2,5)],'blue')
for i in range(10):
 z=PZ-PL/2+i*PL/9
 for side in [-1,1]:beam('Cercha de cubierta',(PX+side*PW/2,PY+6.2,z),(PX,PY+8.9,z),.08,'cream')

def picnic(x,z):
 y=ground(x,z);box('Mesa de picnic',(x,y+.83,z),(2.3,.12,1.05),'green')
 for side in [-1,1]:
  box('Banco de picnic',(x,y+.44,z+side*.87),(2.4,.12,.34),'green')
  for xx in [-.65,.65]:box('Apoyo de banco',(x+xx,y+.20,z+side*.87),(.14,.4,.16),'wood')
 for xx in [-.7,.7]:box('Apoyo de mesa',(x+xx,y+.4,z),(.18,.8,.65),'wood')
def quincho(x,z):
 y=ground(x,z);circle('Piso de quincho',x,z,4,4,y+.07,'concrete',32)
 for i in range(6):
  a=i/6*math.tau;beam('Poste del quincho',(x+3*math.sin(a),y,z+3*math.cos(a)),(x+3*math.sin(a),y+2.8,z+3*math.cos(a)),.14,'wood')
 bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=4.1,radius2=.08,depth=2.45,location=world((x,y+3.95,z)));register(bpy.context.object,'Quincho de paja','thatch')
 picnic(x,z);box('Parrillero',(x+5,y+.75,z),(1.6,1.5,.8),'stone');box('Campana del parrillero',(x+5,y+1.65,z),(1.75,.45,.95),'stone')
for x,z in [(-80,105),(-112,132),(-96,166),(-125,198)]:quincho(x,z)
for x,z in [(-50,115),(-65,140),(-74,195),(44,195),(87,184),(-34,81)]:picnic(x,z)

# Inclusive play area and a small timber climbing structure, on their own pads.
for x,z,colorname in [(-13,180,'red'),(-27,166,'blue'),(0,163,'yellow')]:circle('Pavimento de juegos',x,z,8,7,ground(x,z)+.10,colorname,32)
for x,z in [(-12,180),(-28,168)]:
 y=ground(x,z)
 for sx in [-1,1]:
  for sz in [-1,1]:beam('Torre infantil',(x+sx*1.25,y,z+sz*1.25),(x+sx*1.25,y+3.8,z+sz*1.25),.10,'green')
 box('Plataforma infantil',(x,y+2.3,z),(2.7,.2,2.7),'red')
 bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=2.1,radius2=0,depth=1.1,location=world((x,y+4.2,z)));register(bpy.context.object,'Techo de juego','red')
 for i in range(7):box('Escalera de juego',(x-2+i*.25,y+.25+i*.29,z+2.2-i*.27),(1.25,.16,.5),'wood')
 for section in range(3):
  verts=[];faces=[];steps=8
  for i in range(steps+1):
   t=(section+i/steps)/3;cx=x+1.35+4.0*t;cy=y+.38+2.05*(1-t)**1.4;cz=z+.65*math.sin(t*math.pi)
   tangent=Vector((4,-2.87*max(.0001,1-t)**.4,.65*math.pi*math.cos(t*math.pi))).normalized();normal=Vector((0,0,1)).cross(tangent).normalized();binormal=tangent.cross(normal)
   for radius in [.47,.43]:
    for j in range(10):
     a=j/10*math.tau;offset=(normal*math.cos(a)+binormal*math.sin(a))*radius;verts.append((cx+offset.x,cy+offset.y,cz+offset.z))
   if i:
    n=i*20
    for j in range(10):
     k=(j+1)%10;faces.append((n-20+j,n-20+k,n+k,n+j));faces.append((n-10+j,n+10+j,n+10+k,n-10+k))
  for n in [0,steps*20]:
   for j in range(10):k=(j+1)%10;faces.append((n+j,n+10+j,n+10+k,n+k))
  mesh('Tobogan tubular multicolor',verts,faces,['blue','yellow','red'][section])
for x,z in [(-2,196),(-25,194)]:
 y=ground(x,z)
 for sx in [-1,1]:
  for sz in [-1,1]:beam('Armazon de hamacas',(x+sx*2.5,y,z+sz*1.3),(x+sx*2.5,y+3.1,z),.10,'yellow')
 beam('Viga de hamacas',(x-2.7,y+3.1,z),(x+2.7,y+3.1,z),.11,'blue')
 for xx in [-1,1]:
  for side in [-1,1]:beam('Cadena de hamaca',(x+xx+side*.28,y+3,z),(x+xx+side*.28,y+.7,z),.018,'metal',5)
  box('Asiento inclusivo',(x+xx,y+.65,z),(.72,.25,.65),'blue' if xx<0 else 'red',.08)

# Low parador, kept secondary to the entry/lake/arena rather than a resort hotel.
x,z=-31,224;y=ground(x,z);box('Parador bajo',(x,y+1.7,z),(13,3.4,7),'cream');box('Techo del parador',(x,y+3.5,z),(14,.25,8),'metal')
for xx in range(-5,7,3):box('Vidrios de parador',(x+xx,y+1.8,z+3.52),(2.25,1.8,.04),'glass')

# Palms frame the entry; airy eucalyptus/pines leave the landmarks unobstructed.
for x,z in [(-14,256),(14,256),(-14,233),(14,231),(-21,214),(24,211)]:
 y=ground(x,z);h=16+rng.random()*4;beam('Tronco de palmera',(x,y,z),(x+.5,y+h,z),.30,'bark',10)
 for i in range(13):
  a=i/13*math.tau;verts=[];faces=[]
  for j in range(1,15):
   t=j/15;r=5.1*t;yy=y+h+1.15*math.sin(t*math.pi)-2.2*t**1.35;cx=x+math.cos(a)*r;cz=z+math.sin(a)*r
   length=.75*math.sin(t*math.pi)**.6
   for side in [-1,1]:
    n=len(verts);verts.extend([(cx,yy,cz),(cx+math.cos(a)*.32,yy-.05,cz+math.sin(a)*.32),(cx+math.cos(a)*.15+side*math.sin(a)*length,yy-.20-length*.2,cz+math.sin(a)*.15-side*math.cos(a)*length)]);faces.append((n,n+1,n+2))
  mesh('Palma de frondas plumosas',verts,faces,'leaf')
trees=[]
for attempt in range(3000):
 if len(trees)>=155:break
 x=rng.uniform(-152,150);z=rng.uniform(-95,278)
 if math.hypot(x/99,z/74)<1.05:continue
 if math.hypot((x-56)/46,(z-132)/53)<1:continue
 if abs(x-PX)<PW/2+7 and abs(z-PZ)<PL/2+7:continue
 if abs(x)<35 and 215<z<278:continue
 if -58<x<-38 and 160<z<210:continue
 if -38<x<10 and 150<z<204:continue
 if abs(x-8*math.sin((z-244)*.012))<9 and z>60:continue
 y=ground(x,z);h=rng.uniform(15,28);w=rng.uniform(2.5,4.2);trees.append([x,y,z,h,w])
 beam('Tronco alto de eucalipto',(x,y,z),(x+.5,y+h*.78,z-.25),.22+rng.random()*.13,'bark',7)
 for j in range(4):
  a=j*2.4+rng.random();r=w*.65;px=x+math.cos(a)*r;pz=z+math.sin(a)*r;py=y+h*(.67+j*.075)
  beam('Rama de eucalipto',(x+.3,y+h*(.52+j*.07),z),(px,py,pz),.10,'bark',6)
  ellipsoid('Copa alta irregular',(px,py,pz),(w*(.8+rng.random()*.25),h*.13,w*.82),'leaf',2)

# The grass material reads this attribute in Blender, including the arena field.
for obj in objects:
 if obj['kind']=='grass' and obj.data.color_attributes.get('ParkColor') is None:
  attribute=obj.data.color_attributes.new(name='ParkColor',type='FLOAT_COLOR',domain='POINT')
  for vertex in attribute.data:vertex.color=(*palette['grass'],1)
# Evaluate modifiers and preserve actual split normals in the web asset.
parts={};deps=bpy.context.evaluated_depsgraph_get()
for obj in objects:
 evaluated=obj.evaluated_get(deps);data=evaluated.to_mesh();data.calc_loop_triangles();kind=obj['kind']
 bucket=parts.setdefault(kind,{'name':kind,'kind':kind,'positions':[],'normals':[],'uv':[],'colors':[],'indices':[],'lookup':{}})
 normalmatrix=obj.matrix_world.to_3x3().inverted().transposed();colors=data.color_attributes.get('ParkColor')
 for tri in data.loop_triangles:
  for li in tri.loops:
   loop=data.loops[li];v=data.vertices[loop.vertex_index];pos=obj.matrix_world@v.co;normal=(normalmatrix@data.corner_normals[li].vector).normalized()
   c=tuple(colors.data[loop.vertex_index].color[:3]) if colors else palette[kind]
   position=(pos.x,pos.z,-pos.y);norm=(normal.x,normal.z,-normal.y);uv=(position[0]*.1,position[2]*.1);key=tuple(round(f,6) for f in (*position,*norm,*uv,*c));index=bucket['lookup'].get(key)
   if index is None:
    index=len(bucket['positions'])//3;bucket['lookup'][key]=index;bucket['positions'].extend(position);bucket['normals'].extend(norm);bucket['uv'].extend(uv);bucket['colors'].extend(c)
   bucket['indices'].append(index)
 evaluated.to_mesh_clear()
raw=[]
for part in parts.values():del part['lookup'];raw.append(part)
landscape={'gate':{'origin':[0,GY,GZ],'span':16.8,'canopyY':GY+6.22,'archY':GY+8.63},'lake':{'center':[56,LAKE,132],'radius':[36,43],'bridgeDeckY':2.0},'arena':{'center':[0,.68,0],'fieldRadius':[64,43],'trackRadius':[73,51],'tierCount':5},'pool':{'center':[PX,PY,PZ],'size':[PW,9.2,PL],'covered':True},'trees':trees,'interpretation':'Photograph-led scenic reconstruction of Parque Rodo in Minas. Distances condensed, not a measured site survey.'}
(out/'raw.json').write_text(json.dumps({'meshes':raw,'landscape':landscape},separators=(',',':')),encoding='utf8')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'parque-rodo.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'parque-rodo.glb'),export_format='GLB',export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
print('PARQUE_RODO_AUTHORED',len(raw),'batches',sum(len(p['indices'])//3 for p in raw),'triangles',len(trees),'trees',flush=True)
