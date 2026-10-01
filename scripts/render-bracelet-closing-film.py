"""Render a quiet native Halo closing film without writing the approved master.

Blender --background HALO_Bracelet_Master.blend --python this.py --
    --output-dir /path/to/output --months 12 --finishes Gold --width 1152 --samples 32

The year renderer supplies the actual twelve receiver positions, stones, clasp
and shared mineral materials. This script changes only the presentation studio.
"""
import argparse
from array import array
import ast
from datetime import datetime, timezone
import hashlib
import json
import math
import struct
import sys
import time
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', type=Path, required=True)
parser.add_argument('--months', default='12')
parser.add_argument('--finishes', default='Gold')
parser.add_argument('--width', type=int, default=1152)
parser.add_argument('--samples', type=int, default=32)
parser.add_argument('--frames', type=int, default=1)
parser.add_argument('--start-frame', type=int, default=0)
parser.add_argument('--end-frame', type=int)
parser.add_argument('--resume', action='store_true')
options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
out = options.output_dir.expanduser().resolve()
out.mkdir(parents=True, exist_ok=True)
executed_script = Path(__file__).read_bytes()
executed_script_hash = hashlib.sha256(executed_script).hexdigest()
source_snapshot = out / 'render-source.py'
if options.resume and (source_snapshot.exists() or any(out.glob('halo-*.png'))):
    if not source_snapshot.exists() or hashlib.sha256(source_snapshot.read_bytes()).hexdigest() != executed_script_hash:
        raise RuntimeError('Cannot resume with a different or missing executed-source snapshot; use a new output directory')
if not source_snapshot.exists() or source_snapshot.read_bytes() != executed_script:
    source_snapshot.write_bytes(executed_script)
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
hero_path = HERE / 'render-bracelet.py'
canonical_script = hero_path.read_bytes()
canonical_script_hash = hashlib.sha256(canonical_script).hexdigest()
material_library_hash = hashlib.sha256((HERE / 'halo_bracelet_materials.py').read_bytes()).hexdigest()
render_configuration = dict(width=options.width, height=round(options.width * 2 / 3),
                            samples=options.samples, cycleFrames=options.frames,
                            sourceSha256=source_hash, scriptSha256=executed_script_hash,
                            canonicalRendererSha256=canonical_script_hash,
                            materialLibrarySha256=material_library_hash)
render_configuration_hash = hashlib.sha256(json.dumps(render_configuration, sort_keys=True).encode()).hexdigest()
nodes = []
for node in ast.parse(canonical_script.decode()).body:
    if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'states' for t in node.targets):
        break
    nodes.append(node)
else:
    raise RuntimeError('Canonical setup boundary was not found')
namespace = {'__file__': str(hero_path), '__name__': 'halo_closing_film_setup'}
original_argv = sys.argv
sys.argv = [str(hero_path), '--', '--months', '11', '--finishes', 'Light',
            '--output-dir', str(out / 'setup'), '--asset-dir', str(out / 'setup')]
try:
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(hero_path), 'exec'), namespace)
finally:
    sys.argv = original_argv
scene, root, cam, model = (namespace[k] for k in ('scene', 'root', 'cam', 'model'))
set_state = namespace['set_state']
set_state(11, 'Light')
root['clasp_open_deg'] = 0
root.rotation_euler = (0, math.pi, math.radians(-4))
root.update_tag()
bpy.context.view_layer.update()
product = {root, *root.children_recursive}
lowest = min((ob.matrix_world @ Vector(corner)).z for ob in product
             if ob.type in {'MESH', 'CURVE', 'FONT'} and not ob.hide_render
             for corner in ob.bound_box)
root.location.z = -lowest + .04
bpy.context.view_layer.update()
for ob in list(scene.objects):
    if ob.type == 'LIGHT':
        bpy.data.objects.remove(ob, do_unlink=True)

silver = model.M['Steel_Light_Brushed']
black = model.M['Steel_Dark_PVD']
gold = silver.copy()
gold.name = 'Halo closing film / champagne gold'
gold_color = (.68, .55, .35, 1)
next(n for n in gold.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = gold_color
gold.diffuse_color = gold_color
metals = {'Silver': silver, 'Black': black, 'Gold': gold}

bpy.ops.mesh.primitive_plane_add(size=1400, location=(0, 0, 0))
ground = bpy.context.object
ground.name = 'Closing film / matte charcoal ground'
ground_material = bpy.data.materials.new('Closing film / absorptive charcoal')
ground_material.use_nodes = True
shader = ground_material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = (.0018, .0024, .0034, 1)
shader.inputs['Roughness'].default_value = .63
shader.inputs['Specular IOR Level'].default_value = .10
ground.data.materials.append(ground_material)

def light(name, location, target, energy, width, height, color):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'RECTANGLE'
    data.size, data.size_y, data.color = width, height, color
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    ob.location = location
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob

lights = [
    light('Closing / long silk key', (-82, -88, 140), (0, 0, 4), 180000, 82, 105, (1, .98, .95)),
    light('Closing / cool contour', (92, 48, 105), (0, 0, 4), 115000, 65, 110, (.94, .97, 1)),
    light('Closing / stone reflection', (0, -130, 48), (0, -15, 5), 95000, 90, 23, (1, 1, 1)),
    light('Closing / fine upper rim', (-20, 100, 100), (0, 0, 4), 105000, 90, 18, (1, .94, .86)),
]
light_origins = [ob.location.copy() for ob in lights]
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.5, .53, .59, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .14
cam.data.type = 'ORTHO'
cam.data.dof.use_dof = False
cam.data.ortho_scale = 94
cam.data.clip_end = 1600
scene.camera = cam
scene.render.film_transparent = False
scene.render.resolution_x = options.width
scene.render.resolution_y = round(options.width * 2 / 3)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.cycles.samples = options.samples
scene.cycles.adaptive_threshold = .025 if options.samples <= 32 else .012
scene.cycles.use_persistent_data = True
scene.render.use_persistent_data = True
scene.cycles.seed = 29
scene.cycles.use_animated_seed = False
scene.view_settings.exposure = -.20
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

def pose(frame):
    # The complete orbit is only four degrees. Its periodic camera and softbox
    # movement makes the boundary seamless without an invented moving product.
    phase = math.tau * frame / max(1, options.frames - 1)
    orbit = math.radians(2) * math.sin(phase)
    rotation = Matrix.Rotation(orbit, 4, 'Z')
    cam.location = rotation @ Vector((3, -185, 108 + 2 * math.cos(phase)))
    target = Vector((0, 0, 6))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    for index, (ob, origin) in enumerate(zip(lights, light_origins)):
        # Reflection motion follows a small smooth physical light translation.
        ob.location = origin + Vector((3 * math.sin(phase + index * .3), 0, 0))
        ob.rotation_euler = (Vector((0, 0, 4)) - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return dict(camera=list(cam.location), orbitDegrees=math.degrees(orbit), phase=phase)

def geometry_digest():
    """Material-independent digest of the actual evaluated product geometry."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    digest = hashlib.sha256()
    for ob in sorted(product, key=lambda item: item.name):
        if ob.hide_render or ob.type not in {'MESH', 'CURVE', 'FONT'}:
            continue
        evaluated = ob.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        coordinates = array('f', [0.0]) * (len(mesh.vertices) * 3)
        mesh.vertices.foreach_get('co', coordinates)
        corners = array('i', [0]) * len(mesh.loops)
        mesh.loops.foreach_get('vertex_index', corners)
        digest.update(ob.name.encode())
        digest.update(coordinates.tobytes())
        digest.update(corners.tobytes())
        digest.update(struct.pack('<16f', *(v for row in evaluated.matrix_world for v in row)))
        evaluated.to_mesh_clear()
    return digest.hexdigest()

records = []
for finish in options.finishes.split(','):
    if finish not in metals:
        raise ValueError('Unknown finish: ' + finish)
    for month in [int(v) for v in options.months.split(',')]:
        if month not in range(1, 13):
            raise ValueError('Month must be 1–12')
        set_state(month - 1, 'Dark' if finish == 'Black' else 'Light')
        for ob in product:
            if ob.type in {'MESH', 'CURVE'}:
                for slot in ob.material_slots:
                    if slot.material and (slot.material.name.startswith('Steel_') or slot.material == gold):
                        slot.link = 'OBJECT'
                        slot.material = metals[finish]
        modules = [o for o in scene.objects if o.name.startswith('StoneModule_') and not o.hide_render]
        blanks = [o for o in scene.objects if o.name.startswith('Blank_') and not o.hide_render]
        assert len(modules) == month
        assert len(blanks) == 12 - month
        geometry_hash = geometry_digest()
        end = min(options.end_frame or options.frames, options.frames)
        for frame in range(options.start_frame, end):
            camera = pose(frame)
            bpy.context.view_layer.update()
            visible = [ob for ob in product if not ob.hide_render and ob.type in {'MESH', 'CURVE', 'FONT'}]
            projected = [world_to_camera_view(scene, cam, ob.matrix_world @ Vector(corner))
                         for ob in visible for corner in ob.bound_box]
            bounds = dict(left=min(p.x for p in projected), right=max(p.x for p in projected),
                          top=1-max(p.y for p in projected), bottom=1-min(p.y for p in projected))
            assert all(0 <= value <= 1 for value in bounds.values()), bounds
            filename = f'halo-{finish.lower()}-month-{month:02}-{frame:03}.png'
            target = out / filename
            record = dict(file=filename, finish=finish, month=month, frame=frame,
                          installedStones=len(modules), blankPositions=len(blanks),
                          closedClasp=True, geometrySha256=geometry_hash, bounds=bounds,
                          renderConfigurationSha256=render_configuration_hash, **camera)
            print('HALO_CLOSING_RENDER', json.dumps(record), flush=True)
            started = time.monotonic()
            if options.resume and target.exists():
                receipt = target.with_suffix('.json')
                previous = json.loads(receipt.read_text()) if receipt.exists() else {}
                if (previous.get('renderConfigurationSha256') != render_configuration_hash
                        or previous.get('geometrySha256') != geometry_hash
                        or previous.get('sha256') != hashlib.sha256(target.read_bytes()).hexdigest()):
                    raise RuntimeError('Cached frame differs from this render configuration or its receipt: ' + filename)
                # Preserve the original render timestamp and measurement. A
                # resume must not relabel old pixels as a fresh render.
                records.append(previous)
                print('HALO_CLOSING_CACHED', filename, flush=True)
                continue
            temporary = target.with_name(target.stem + '.pending.png')
            scene.render.filepath = str(temporary)
            bpy.ops.render.render(write_still=True)
            temporary.replace(target)
            record.update(renderSeconds=round(time.monotonic()-started, 3),
                          sha256=hashlib.sha256(target.read_bytes()).hexdigest(), bytes=target.stat().st_size,
                          recordedAt=datetime.now(timezone.utc).isoformat())
            (target.with_suffix('.json')).write_text(json.dumps(record, indent=2) + '\n')
            records.append(record)
            print('HALO_CLOSING_COMPLETE', json.dumps(record), flush=True)

final_hash = hashlib.sha256(source.read_bytes()).hexdigest()
assert final_hash == source_hash, 'Native master changed'
manifest = dict(version=1, createdAt=datetime.now(timezone.utc).isoformat(),
                source=source.name, sourceSha256Before=source_hash, sourceSha256After=final_hash,
                sourceUnchanged=True, canonicalSetup='scripts/render-bracelet.py before states=[]',
                scriptSha256=executed_script_hash, executedSourceSnapshot=source_snapshot.name,
                canonicalRendererSha256=canonical_script_hash,
                materialLibrarySha256=material_library_hash,
                renderConfigurationSha256=render_configuration_hash,
                blenderVersion=bpy.app.version_string,
                width=scene.render.resolution_x, height=scene.render.resolution_y,
                samples=options.samples, renderEngine=scene.render.engine, device=scene.cycles.device,
                mineralOrder=[dict(month=i + 1, key=spec['key'], name=spec['name'])
                              for i, spec in enumerate(namespace['SPECS'])],
                goldColorLinearRGBA=gold_color, cycleFrames=options.frames, frames=records)
(out / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('HALO_CLOSING_FINISHED', str(out / 'render-manifest.json'), flush=True)
