"""Render the completed HALO bracelet's native clasp closure for scroll playback.

Blender --background HALO_Bracelet_Master.blend --python this.py -- [--preview]
No master .blend is saved. The existing hero studio and cabochon recipe are reused;
only camera orbit and the native clasp_open_deg control vary. 24 deterministic
frames show the clasp, close its shoulder/rail and cover, then return to hero.
"""
import argparse, ast, hashlib, json, math, shutil, sys
from pathlib import Path
# Packing runs with normal Python/Pillow; rendering runs inside Blender.
if '--pack' in sys.argv:
    from PIL import Image, ImageChops
    pack_parser=argparse.ArgumentParser()
    pack_parser.add_argument('--pack',action='store_true')
    pack_parser.add_argument('--raw-dir','--output-dir',dest='raw_dir',type=Path,
        default=Path('/Users/connor/Documents/ChatGPT/habit halo/output/halo-bracelet-year-renders/finale'))
    pack_parser.add_argument('--site-dir','--asset-dir',dest='site_dir',type=Path,
        default=Path(__file__).resolve().parent.parent/'website/assets/bracelet-year/finale')
    pack_options=pack_parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
    site=pack_options.site_dir.expanduser().resolve()
    raw=pack_options.raw_dir.expanduser().resolve()
    manifest=json.loads((site/'manifest.json').read_text())
    assert manifest['frameCount']==24 and len(manifest['frames'])==48
    assets=[]
    for finish in ['Light','Dark']:
        frames=[f for f in manifest['frames'] if f['finish']==finish]
        assert [f['index'] for f in frames]==list(range(24))
        assert all(f['installedStones']==12 and f['blankPositions']==0 for f in frames)
        assert frames[0]['claspOpenDegrees']==frames[-1]['claspOpenDegrees']==frames[16]['claspOpenDegrees']==0
        assert frames[6]['claspOpenDegrees']==88
        assert all(abs(f['claspOpenDegrees']-f['lidAngleDegrees'])<.001 for f in frames)
        assert frames[0]['camera']==frames[-1]['camera']
        assert frames[0]['claspLidWorld']==frames[-1]['claspLidWorld']
        for frame in frames:
            source=raw/(Path(frame['file']).stem+'.png')
            output=site/frame['file']
            with Image.open(source if source.exists() else output) as image:
                assert image.mode=='RGBA' and image.size==(1000,875)
                assert image.getchannel('A').getextrema()==(0,255)
                if source.exists() and (not output.exists() or source.stat().st_mtime>output.stat().st_mtime):
                    temporary=output.with_name('.'+output.name+'.pending')
                    image.save(temporary,'WEBP',quality=91,method=6,exact=True)
                    temporary.replace(output)
                assets.append(dict(file=output.name,bytes=output.stat().st_size))
        # Both metadata poses were verified identical above. Reuse the actual
        # first rendered hero byte-for-byte so the last hold cannot flicker.
        shutil.copy2(site/f'{finish.lower()}-00.webp',site/f'{finish.lower()}-23.webp')
        endpoints=[site/f'{finish.lower()}-{i:02}.webp' for i in [0,23]]
        with Image.open(endpoints[0]) as first, Image.open(endpoints[1]) as last:
            extrema=ImageChops.difference(first,last).getextrema()
            assert max(high for low,high in extrema)<=3, (finish,extrema)
    for index in range(24):
        light,dark=[f for f in manifest['frames'] if f['index']==index]
        assert light['camera']==dark['camera'] and light['claspLidWorld']==dark['claspLidWorld']
    for asset in assets: asset['bytes']=(site/asset['file']).stat().st_size
    manifest['heroEndpointReuse']=True
    manifest['assets']=assets
    manifest['totalWebBytes']=sum(a['bytes'] for a in assets)
    manifest['validation']='48 RGBA frames; 12 installed stones each; native lid movement; closed lock; matched finish geometry and hero endpoints'
    (site/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(dict(frames=len(assets),bytes=manifest['totalWebBytes'],sourceUnchanged=manifest['sourceUnchanged'])))
    raise SystemExit(0)

import bpy
from mathutils import Matrix, Vector

# Presentation copies, export meshes and hidden technical scenes are unnecessary
# for this single-product sequence. Release them in memory before Cycles allocates
# its device buffers; the source .blend is never saved.
master=bpy.data.scenes['HALO_Master']
bpy.context.window.scene=master
product=next(o for o in master.objects if o.get('halo_role',o.name)=='HALO_Controls')
keep={product,*product.children_recursive}
for other in list(bpy.data.scenes):
    if other != master: bpy.data.scenes.remove(other)
for ob in list(bpy.data.objects):
    if ob not in keep: bpy.data.objects.remove(ob,do_unlink=True)
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
print('HALO_FINALE_PRODUCT_ONLY',len(bpy.data.objects),flush=True)

HERE = Path(__file__).resolve().parent
SITE = HERE.parent / 'website/assets/bracelet-year/finale'
RAW = Path('/Users/connor/Documents/ChatGPT/habit halo/output/halo-bracelet-year-renders/finale')
parser = argparse.ArgumentParser()
parser.add_argument('--preview', action='store_true')
parser.add_argument('--resume', action='store_true')
parser.add_argument('--frames', default='all')
parser.add_argument('--finishes', default='Light,Dark')
parser.add_argument('--samples', type=int, help='Override sample count, including previews')
parser.add_argument('--width', type=int, help='Override render width, including previews')
parser.add_argument('--output-dir', type=Path, default=RAW, help='Raw finale PNG output directory')
parser.add_argument('--asset-dir', type=Path, default=SITE, help='Finale manifest output directory')
options = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SITE=options.asset_dir.expanduser().resolve()
RAW=options.output_dir.expanduser().resolve()
source_file = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
SITE.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

# Evaluate only the canonical hero setup, before its monthly render loop. This
# avoids a second independent material/studio implementation and never touches
# already-delivered monthly assets.
hero_path = HERE / 'render-bracelet.py'
hero_ast = ast.parse(hero_path.read_text())
setup_nodes = []
for node in hero_ast.body:
    if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'states' for t in node.targets):
        break
    setup_nodes.append(node)
else:
    raise RuntimeError('Canonical hero setup boundary was not found')
namespace = {'__file__':str(hero_path),'__name__':'halo_hero_setup'}
original_argv = sys.argv
sys.argv = [str(hero_path),'--','--months','11','--finishes','Light',
            '--output-dir',str(RAW.parent),'--asset-dir',str(SITE.parent)]
try:
    exec(compile(ast.Module(body=setup_nodes,type_ignores=[]),str(hero_path),'exec'),namespace)
finally:
    sys.argv = original_argv
scene, root, cam, model = (namespace[k] for k in ('scene','root','cam','model'))
set_state=namespace['set_state']
lights = namespace['lights']
light_origins = [ob.location.copy() for ob in lights]
scene.render.resolution_x = options.width if options.width is not None else (700 if options.preview else 1000)
scene.render.resolution_y = round(scene.render.resolution_x*7/8)
scene.cycles.samples = options.samples if options.samples is not None else (16 if options.preview else 96)
scene.cycles.adaptive_threshold = .025 if options.preview and scene.cycles.samples <= 16 else .016
scene.cycles.seed = 29
scene.cycles.use_animated_seed = False
scene.cycles.use_persistent_data = False
scene.render.use_persistent_data = False
# Preserve the GPU selected by canonical studio configuration.

# Entrance and exit are the exact monthly hero camera, lens and closed geometry.
# The reveal opens continuously, then spends nine frames on the physical closure.
POSES = [
    (0,0),(.04,0),(.15,20),(.35,55),(.60,82),(.84,88),(1,88),(1,88),
    (1,82),(1,72),(1,59),(1,45),(1,33),(1,22),(1,12),(1,4),(1,0),
    (.99,0),(.90,0),(.70,0),(.40,0),(.18,0),(.04,0),(0,0),
]
assert len(POSES)==24
frame_ids = [0,6,12,16,23] if options.preview and options.frames=='all' else list(range(24)) if options.frames=='all' else [int(v) for v in options.frames.split(',')]
frames=[]

def apply_pose(index):
    orbit, opening = POSES[index]
    angle = math.radians(140)*orbit
    rotation = Matrix.Rotation(angle,4,'Z')
    # The slight widening keeps the actual released right shoulder in frame.
    cam.location = rotation @ Vector((0,-165,-150))
    target=Vector((0,3*orbit,0))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=79+7*orbit
    for light,origin in zip(lights,light_origins):
        light.location=rotation @ origin
        light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
    if root['clasp_open_deg'] != opening:
        root['clasp_open_deg']=opening
        root.update_tag()
    bpy.context.view_layer.update()
    return dict(index=index,orbitDegrees=round(math.degrees(angle),4),claspOpenDegrees=opening,
                camera=list(cam.location),target=list(target),orthoScale=cam.data.ortho_scale,
                phase='reveal' if index<8 else 'close' if index<17 else 'return',
                installedStones=12,blankPositions=0)

for finish in options.finishes.split(','):
    set_state(11,finish)
    modules=[o for o in scene.objects if o.name.startswith('StoneModule_') and not o.hide_render]
    assert len(modules)==12
    assert not any(o.name.startswith('Blank_') and not o.hide_render for o in scene.objects)
    for index in frame_ids:
        frame=apply_pose(index)
        suffix='preview-' if options.preview else ''
        filename=f'{suffix}{finish.lower()}-{index:02}.png'
        target=RAW/filename
        temporary=target.with_name(target.stem+'.pending.png')
        scene.render.filepath=str(temporary)
        print('HALO_FINALE_RENDER',filename,flush=True)
        initial=RAW/f'{suffix}{finish.lower()}-00.png'
        if options.resume and target.exists() and target.stat().st_size>1000:
            print('HALO_FINALE_CACHED',filename,flush=True)
        elif index==23 and initial.exists():
            # The final closed hero is exactly the entrance pose and light rig.
            shutil.copy2(initial,RAW/filename)
        else:
            bpy.ops.render.render(write_still=True)
            temporary.replace(target)
        frame.update(finish=finish,file=f'{finish.lower()}-{index:02}.webp')
        # Record evaluated native mechanism evidence rather than only inputs.
        lid=model.by_role(scene,'ClaspLidPivot')
        frame['lidAngleDegrees']=round(math.degrees(lid.rotation_euler.z),5)
        frame['claspLidWorld']=[list(row) for row in model.by_role(scene,'ClaspLid').matrix_world]
        frames.append(frame)

final_hash=hashlib.sha256(source_file.read_bytes()).hexdigest()
manifest=dict(version=1,frameCount=24,width=scene.render.resolution_x,height=scene.render.resolution_y,
              source=source_file.name,sourceSha256Before=source_hash,sourceSha256After=final_hash,
              sourceUnchanged=source_hash==final_hash,month=12,installedStones=12,
              currentMonth=12,lockFrame=16,heroFrames=[0,23],
              timing=dict(reveal=[0,7],close=[8,16],returnToHero=[17,23]),
              identicalGeometryAcrossFinishes=True,frames=frames)
path=(RAW/'preview-manifest.json') if options.preview else (SITE/('manifest-'+options.finishes.replace(',','-')+'.json'))
if path.exists() and not options.preview:
    previous=json.loads(path.read_text())
    if previous.get('width')==manifest['width'] and previous.get('height')==manifest['height']:
        merged={(frame['finish'],frame['index']):frame for frame in previous.get('frames',[])}
        merged.update({(frame['finish'],frame['index']):frame for frame in frames})
        manifest['frames']=[merged[key] for key in sorted(merged)]
path.write_text(json.dumps(manifest,indent=2)+'\n')
print('HALO_FINALE_FINISHED',str(path),flush=True)
