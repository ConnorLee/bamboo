"""Native Halo closing macro portraits, reusing the approved film studio.

Blender --background HALO_Bracelet_Master.blend --python this.py --
    --output-dir /path/to/output --layout landscape --width 2400 --samples 96

The bracelet is cropped by the camera. No master model or existing film frame is
modified; transparent space is reserved for the website's own near-black surface.
"""
import argparse
import ast
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import sys
import time

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', type=Path, required=True)
parser.add_argument('--layout', choices=('landscape', 'mobile'), default='landscape')
parser.add_argument('--width', type=int, default=2400)
parser.add_argument('--samples', type=int, default=96)
parser.add_argument('--scale', type=float)
parser.add_argument('--roll', type=float, default=-27)
parser.add_argument('--shift-x', type=float)
parser.add_argument('--shift-y', type=float)
options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
out = options.output_dir.expanduser().resolve()
out.mkdir(parents=True, exist_ok=True)
source_file = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
executed_source = Path(__file__).read_bytes()
executed_source_hash = hashlib.sha256(executed_source).hexdigest()
(out / 'render-source.py').write_bytes(executed_source)
studio_path = HERE / 'render-bracelet-closing-film.py'
studio_source = studio_path.read_bytes()
nodes = []
for node in ast.parse(studio_source.decode()).body:
    if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'records' for t in node.targets):
        break
    nodes.append(node)
else:
    raise RuntimeError('Canonical studio setup boundary was not found')
namespace = {'__file__': str(studio_path), '__name__': 'halo_closing_macro_studio'}
original_argv = sys.argv
sys.argv = [str(studio_path), '--', '--output-dir', str(out / 'setup'),
            '--width', str(options.width), '--samples', str(options.samples)]
try:
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(studio_path), 'exec'), namespace)
finally:
    sys.argv = original_argv
scene, root, cam, model, product = (namespace[k] for k in ('scene', 'root', 'cam', 'model', 'product'))
namespace['set_state'](11, 'Light')
namespace['pose'](0)
namespace['ground'].hide_render = True
# Return to the canonical website orientation: the mineral arc sits above the
# mechanism, so a close crop gives the stones the strongest visual emphasis.
root.rotation_euler = (0, 0, math.radians(-4))
root.location = (0, 0, 0)
root.update_tag()
for light, energy_scale in zip(namespace['lights'], (.38, .15, .25, .08)):
    light.location.z *= -1
    light.data.energy *= energy_scale
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
# A silk reflection on the opposite side of the mineral normals reveals their
# polished crown without flooding the broad, brushed inside edge with white.
namespace['light']('Macro / mineral polish silk', (-16, -112, 86), (0, -24, 0),
                   62000, 72, 22, (1, .985, .965))
# Same closed bracelet, with the studio camera moved closer and rolled rather
# than changing any product shape, stone assignment, or material.
cam.location = (3, -185, -150)
cam.rotation_euler = (-cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.rotation_euler.rotate_axis('Z', math.radians(options.roll))
cam.data.ortho_scale = options.scale or (78 if options.layout == 'landscape' else 55)
cam.data.shift_x = options.shift_x if options.shift_x is not None else (-.31 if options.layout == 'landscape' else -.03)
cam.data.shift_y = options.shift_y if options.shift_y is not None else (.06 if options.layout == 'landscape' else .01)
scene.render.resolution_x = options.width
scene.render.resolution_y = round(options.width * (7 / 12 if options.layout == 'landscape' else 11 / 12))
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.cycles.samples = options.samples
scene.cycles.adaptive_threshold = .018 if options.samples <= 32 else .008
bpy.context.view_layer.update()

visible = [ob for ob in product if not ob.hide_render and ob.type in {'MESH', 'CURVE', 'FONT'}]
projected = [world_to_camera_view(scene, cam, ob.matrix_world @ Vector(corner))
             for ob in visible for corner in ob.bound_box]
bounds = dict(left=min(p.x for p in projected), right=max(p.x for p in projected),
              top=1-max(p.y for p in projected), bottom=1-min(p.y for p in projected))
gemstones = []
for i, spec in enumerate(namespace['namespace']['SPECS']):
    module = model.by_role(scene, f'StoneModule_{i + 1:02}')
    gem = next(ob for ob in module.children if ob.name.startswith('Gemstone_'))
    location = world_to_camera_view(scene, cam, gem.matrix_world.translation)
    gemstones.append(dict(month=i + 1, mineral=spec['name'], x=location.x, y=1-location.y))
filename = f'halo-closing-macro-{options.layout}.png'
target = out / filename
temporary = target.with_name(target.stem + '.pending.png')
scene.render.filepath = str(temporary)
geometry_hash = namespace['geometry_digest']()
print('HALO_MACRO_READY', json.dumps(dict(file=filename, bounds=bounds,
      width=scene.render.resolution_x, height=scene.render.resolution_y,
      gemstoneProjection=gemstones)), flush=True)
started = time.monotonic()
bpy.ops.render.render(write_still=True)
temporary.replace(target)
render_seconds = time.monotonic() - started
after_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
assert source_hash == after_hash, 'Approved source master changed'
manifest = dict(version=1, generatedAt=datetime.now(timezone.utc).isoformat(),
                file=filename, width=scene.render.resolution_x, height=scene.render.resolution_y,
                channels='RGBA', samples=options.samples, renderSeconds=round(render_seconds, 3),
                sha256=hashlib.sha256(target.read_bytes()).hexdigest(), bytes=target.stat().st_size,
                source=source_file.name, sourceSha256Before=source_hash, sourceSha256After=after_hash,
                sourceUnchanged=True, scriptSha256=executed_source_hash, executedSourceSnapshot='render-source.py',
                studioRendererSha256=hashlib.sha256(studio_source).hexdigest(),
                canonicalRendererSha256=namespace['canonical_script_hash'],
                materialLibrarySha256=namespace['material_library_hash'],
                geometrySha256=geometry_hash, installedStones=12, blankPositions=0, closedClasp=True,
                finish='Silver', camera=list(cam.location), target=[0, 0, 0],
                rollDegrees=options.roll, orthoScale=cam.data.ortho_scale,
                shiftX=cam.data.shift_x, shiftY=cam.data.shift_y,
                bounds=bounds, gemstoneProjection=gemstones,
                renderEngine=scene.render.engine, blenderVersion=bpy.app.version_string)
(out / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('HALO_MACRO_FINISHED', json.dumps(manifest), flush=True)
