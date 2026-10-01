"""Render the existing HALO Blender master for the scroll section, without saving it.

The original rigid chassis and rear mechanism are retained. The obsolete Intention
receiver is removed, remaining right-side receivers are respaced, and twelve real
modules implement the provisional Moonstone-to-Opal year. This is a visual study.
Run Blender --background MASTER.blend --python this.py -- [--preview] [--months 0,1,6,11].
"""
import argparse, ast, json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

PROJECT = Path('/Users/connor/Documents/ChatGPT/habit halo')
SOURCE = PROJECT / 'output/halo-bracelet-master/source'
OUT = Path(__file__).resolve().parent.parent / 'website/assets/bracelet-year'
RENDER_OUT = PROJECT / 'output/halo-bracelet-year-renders'
sys.path.insert(0, str(SOURCE))
import build_halo as model
from halo_delivery import configure_cycles, apply_preset

parser = argparse.ArgumentParser()
parser.add_argument('--preview', action='store_true')
parser.add_argument('--months', default='0,1,2,3,4,5,6,7,8,9,10,11')
parser.add_argument('--samples', type=int, help='Override sample count, including previews')
parser.add_argument('--width', type=int, help='Override render width, including previews')
parser.add_argument('--output-dir', type=Path, default=RENDER_OUT, help='Raw PNG output directory')
parser.add_argument('--asset-dir', type=Path, default=OUT, help='Website manifest output directory')
parser.add_argument('--resume', action='store_true')
parser.add_argument('--finishes', default='Light,Dark')
parser.add_argument('--gems-only', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT = args.asset_dir.expanduser().resolve()
RENDER_OUT = args.output_dir.expanduser().resolve()
OUT.mkdir(parents=True, exist_ok=True)
RENDER_OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes['HALO_Master']
bpy.context.window.scene = scene
scene.frame_set(1)
# Prune only in-memory non-product scenes and objects; the master file is never saved.
product=model.by_role(scene, 'HALO_Controls')
keep={product,*product.children_recursive}
for other in list(bpy.data.scenes):
    if other != scene: bpy.data.scenes.remove(other)
for ob in list(bpy.data.objects):
    if ob not in keep: bpy.data.objects.remove(ob,do_unlink=True)
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
root = model.by_role(scene, 'HALO_Controls')
root['size_mix'] = 0
root['clasp_open_deg'] = 0
root['adjustment_mm'] = 0
root['turntable_deg'] = 0
if root.animation_data:
    root.animation_data.action = None
    for track in root.animation_data.nla_tracks: track.mute = True
model.M = {m.name: m for m in bpy.data.materials}
# One material library is shared by monthly layers and the native clasp sequence.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from halo_bracelet_materials import SPECS, mineral_material, refine_metals
refine_metals(model.M)
KEYS=[spec['key'] for spec in SPECS]
materials={spec['key']:mineral_material(spec) for spec in SPECS}

# Remove the obsolete thirteenth receiver and its actual blind-pocket Boolean.
chassis=model.by_role(scene,'UpperRigidChassis')
# The native band rim UVs collapse across its wall thickness. Restore a radial
# V coordinate there so circumferential brushing also exists on the cut edges.
# This changes texture coordinates only; all vertices and receiver seats stay put.
uv=chassis.data.uv_layers.active
if uv:
    for face in chassis.data.polygons:
        if face.index < 1600 and face.index % 4 in (0,2):
            for loop in face.loop_indices:
                vertex=chassis.data.loops[loop].vertex_index
                uv.data[loop].uv.y = 1.0 if vertex % 4 in (1,2) else 0.0

intention=model.by_role(scene,'StoneModule_Intention')
if intention:
    for ob in list(intention.children_recursive)+[intention]:bpy.data.objects.remove(ob,do_unlink=True)
removed=model.by_role(scene,'Anchor_Intention')
for modifier in list(chassis.modifiers):
    if modifier.type=='BOOLEAN' and modifier.object and modifier.object.parent==removed:chassis.modifiers.remove(modifier)
for ob in list(removed.children_recursive)+[removed]:bpy.data.objects.remove(ob,do_unlink=True)
# Re-space the five remaining right receivers without changing chassis or clasp.
ROLES=[role for role in model.SOCKET_ROLES if role!='Intention']
RANKS=[0,-1,1,-2,2,-3,-4,3,-5,4,-6,5]
old_ranks=model.RANKS;model.RANKS=RANKS
angles=model.socket_angles();model.RANKS=old_ranks
for role,rank,t in zip(ROLES,RANKS,angles):
    old=model.by_role(scene,'Anchor_'+role)
    children=list(old.children)
    new=model.anchor('YearAnchor_'+role,t,old.users_collection[0],root)
    new['halo_role']='Anchor_'+role;new['visual_rank']=rank
    for child in children:child.parent=new
    bpy.data.objects.remove(old,do_unlink=True)
    new.name='Anchor_'+role

assert sum(mod.type=='BOOLEAN' for mod in chassis.modifiers)==12
assert len([ob for ob in scene.objects if ob.name.startswith('Socket_')])==12
assert model.by_role(scene,'Socket_Intention') is None

def set_state(index,finish):
    month=index+1;root['month']=month;root['finish']=finish
    occupied=({'Current'} if month else set())|{f'History_{i:02}' for i in range(1,month)}
    for i in range(1,13):
        module=model.by_role(scene,f'StoneModule_{i:02}')
        role='Current' if i==month else f'History_{min(i,11):02}'
        module.parent=model.by_role(scene,'Anchor_'+role);module.location=(0,0,0);module.rotation_euler=(0,0,0)
        module['assigned_socket']='Socket_'+role
        for ob in model.descendants(module):ob.hide_render=i>month;ob.hide_set(i>month)
    for role in ROLES:
        blank=model.by_role(scene,'Blank_'+role);blank.hide_render=role in occupied;blank.hide_set(role in occupied)
    for ob in scene.objects:
        if ob.type not in ('MESH','CURVE'):continue
        for slot in ob.material_slots:
            if slot.material and slot.material.name.startswith('Steel_'):
                slot.link='OBJECT';slot.material=model.M['Steel_'+('Light_Brushed' if finish=='Light' else 'Dark_PVD')]
    bpy.context.view_layer.update()

def cabochon_mesh():
    verts, faces = [], []
    n, rings = 96, 24
    # Polished rounded crown, common mechanical envelope of original master.
    for j in range(rings + 1):
        t = math.pi * j / rings
        radius = 4.435 * math.sin(t)
        z = .13 + (1.77 if math.cos(t) >= 0 else .97) * math.cos(t)
        for i in range(n):
            a = math.tau * i / n
            verts.append((radius*math.cos(a), radius*math.sin(a), z))
    for j in range(rings):
        for i in range(n):
            faces.append(((j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n,j*n+i))
    mesh = bpy.data.meshes.new('Website polished cabochon / original common envelope')
    mesh.from_pydata(verts, [], faces); mesh.update()
    for face in mesh.polygons: face.use_smooth = True
    return mesh

crown = cabochon_mesh()
gems = []
for month, key in enumerate(KEYS):
    module = model.by_role(scene, f'StoneModule_{month+1:02}')
    gem = next(o for o in module.children if o.name.startswith('Gemstone_'))
    gem.data = crown.copy()
    gem.data.materials.append(materials[SPECS[month]['key']])
    gems.append(gem)
    module['website_mineral'] = key

configure_cycles(scene)
apply_preset(scene, 'WEBSITE', transparent=True)
scene.render.resolution_x = args.width if args.width is not None else (720 if args.preview else 1000)
scene.render.resolution_y = round(scene.render.resolution_x*7/8)
scene.render.image_settings.color_depth = '8'
scene.cycles.samples = args.samples if args.samples is not None else (16 if args.preview else 96)
scene.cycles.use_persistent_data = True
scene.cycles.adaptive_threshold = .025 if args.preview and scene.cycles.samples <= 16 else .012
scene.cycles.film_transparent_glass = False
scene.view_settings.exposure = -.40
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

# Looking from below the product plane puts Current at the top/front and the
# real clasp on the opposite lower/rear arc, preserving the upright old staging.
cam_data = bpy.data.cameras.new('Website upright hero')
cam = bpy.data.objects.new('Website upright hero', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (0,-165,-150)
cam.rotation_euler = (Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 79
cam.data.clip_start = .1; cam.data.clip_end = 1000
cam.data.dof.use_dof = False
for ob in scene.objects:
    if ob.name.startswith('StudioCyclorama'): ob.hide_render = True
    if ob.type == 'LIGHT': ob.hide_render = True

world = scene.world.copy(); scene.world = world
world.node_tree.nodes['Background'].inputs[0].default_value = (.66,.70,.76,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .28

def light(name, loc, power, sx, sy, color):
    data = bpy.data.lights.new(name, 'AREA'); data.energy=power
    data.shape='RECTANGLE';data.size=sx;data.size_y=sy;data.color=color
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob)
    ob.location=loc;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob
lights = [
    light('Website tall silk',(-68,-95,-115),175000,100,135,(1,.97,.93)),
    light('Website cool reflection',(85,-15,-65),60000,85,110,(.90,.95,1)),
    light('Website rear strip',(5,65,-55),52000,95,28,(1,.98,.95)),
    light('Website front silk',(0,-85,78),46000,95,38,(1,1,1)),
]

def render(filename):
    bpy.context.view_layer.update()
    target=RENDER_OUT/filename
    temporary=target.with_name(target.stem+'.pending.png')
    scene.render.filepath=str(temporary)
    print('HALO_WEBSITE_RENDER', filename, flush=True)
    if not (args.resume and target.exists() and target.stat().st_size>1000):
        bpy.ops.render.render(write_still=True)
        temporary.replace(target)

states=[]
if not args.gems_only:
    for finish in args.finishes.split(','):
        for month in map(int,args.months.split(',')):
            set_state(month,finish)
            if month == -1:
                render(f'empty-{finish.lower()}.png')
                continue
            current = gems[month]
            if args.preview:
                render(f'{finish.lower()}-{month:02}.png')
            else:
                # Camera-only hiding preserves real gemstone reflections and shadows.
                current.visible_camera = False
                render(f'base-{finish.lower()}-{month:02}.png')
                current.visible_camera = True
                if finish == 'Light':
                    visible_objects = [o for o in scene.objects if o.type in {'MESH','CURVE'} and not o.hide_render]
                    for ob in visible_objects: ob.visible_camera = (ob == current)
                    render(f'stone-{month:02}.png')
                    for ob in visible_objects: ob.visible_camera = True
            occupied=[o for o in scene.objects if o.name.startswith('StoneModule_') and not o.hide_render]
            blanks=[o for o in scene.objects if o.name.startswith('Blank_') and not o.hide_render]
            positions=[]
            for rank, role in sorted(zip(RANKS,ROLES)):
                anchor = model.by_role(scene, 'Anchor_' + role)
                module = next((o for o in occupied if o.parent == anchor), None)
                earned_month = module.get('milestone')-1 if module else None
                projected = world_to_camera_view(scene,cam,anchor.matrix_world.translation)
                positions.append(dict(rank=rank,role='current' if role=='Current' else 'history',socket=role,month=earned_month,installed=module is not None,mineral=KEYS[earned_month] if earned_month is not None else None,projected=[round(projected.x,5),round(1-projected.y,5)]))
            assert len(positions)==12 and len(occupied)==month+1 and len(blanks)==11-month
            assert [p for p in positions if p['rank']==0][0]['month']==month
            states.append(dict(month=month,finish=finish,installed=len(occupied),blanks=len(blanks),current=KEYS[month],base=f'base-{finish.lower()}-{month:02}.webp',stone=f'stone-{month:02}.webp',positions=positions))

if args.gems_only:
    # Independent isolated materials for the months absent from the old collection.
    # Preserve the same domed geometry and studio material response as the hero.
    for ob in scene.objects:
        if ob.type in {'MESH','CURVE'}: ob.hide_render = True
    scene.render.resolution_x=900; scene.render.resolution_y=750
    cam.location=(0,-22,10);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=15.5
    scene.view_settings.exposure = .20
    studio = [((-20,-25,36),20000,25,35),((17,20,32),28000,8,40),((25,-25,10),6000,28,33),((-6,-15,-12),6000,28,28)]
    for ob,(loc,power,sx,sy) in zip(lights,studio):
        ob.location=loc;ob.data.energy=power;ob.data.size=sx;ob.data.size_y=sy
        ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()
    for month in map(int,args.months.split(',')):
        gem=gems[month];gem.parent=None;gem.location=(0,0,0);gem.rotation_euler=(0,0,0);gem.hide_render=False
        render(f'gem-{month:02}.png');gem.hide_render=True

if states:
    manifest_path=OUT/('render-manifest-'+args.finishes.replace(',','-')+'.json')
    # Re-rendering one material must retain the other verified month entries.
    if manifest_path.exists():
        previous=json.loads(manifest_path.read_text())
        if previous.get('width')==scene.render.resolution_x and previous.get('height')==scene.render.resolution_y:
            merged={(state['finish'],state['month']):state for state in previous.get('states',[])}
            merged.update({(state['finish'],state['month']):state for state in states})
            states=[merged[key] for key in sorted(merged)]
    manifest_path.write_text(json.dumps(dict(source='HALO_Bracelet_Master.blend',width=scene.render.resolution_x,height=scene.render.resolution_y,positions=12,indexConvention='index 0 is Month 01; no separate Intention stone',historyRanks=[-1,1,-2,2,-3,-4,3,-5,4,-6,5],states=states),indent=2))
print('HALO_WEBSITE_FINISHED', flush=True)
