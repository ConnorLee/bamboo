"""Native Halo collection stills; the approved master is never overwritten.

Blender --background HALO_Bracelet_Master.blend --python this.py --
    --variant trio --width 1536 --samples 96 --output-dir /path/to/output

The canonical year renderer owns the twelve-stone geometry and materials. This
script freezes that evaluated, closed model before making three finish copies.
Only presentation transforms, the studio and the gold metal color are new.
"""
import argparse
import ast
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view


HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--variant', choices=('trio', 'closeup', 'quiet'), default='trio')
parser.add_argument('--width', type=int, default=1000)
parser.add_argument('--samples', type=int, default=24)
parser.add_argument('--output-dir', type=Path, required=True)
parser.add_argument('--save-scene', action='store_true')
options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
out = options.output_dir.expanduser().resolve()
out.mkdir(parents=True, exist_ok=True)
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()

# Reuse the complete canonical setup, not its render loop or delivery files.
hero_path = HERE / 'render-bracelet.py'
nodes = []
for node in ast.parse(hero_path.read_text()).body:
    if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'states' for t in node.targets):
        break
    nodes.append(node)
else:
    raise RuntimeError('Canonical setup boundary was not found')
namespace = {'__file__': str(hero_path), '__name__': 'halo_campaign_setup'}
original_argv = sys.argv
sys.argv = [str(hero_path), '--', '--months', '11', '--finishes', 'Light',
            '--output-dir', str(out / 'setup'), '--asset-dir', str(out / 'setup')]
try:
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(hero_path), 'exec'), namespace)
finally:
    sys.argv = original_argv
scene, root, cam, model = (namespace[k] for k in ('scene', 'root', 'cam', 'model'))
namespace['set_state'](11, 'Light')
root['clasp_open_deg'] = 0
root.update_tag()
bpy.context.view_layer.update()
assert len([o for o in scene.objects if o.name.startswith('StoneModule_') and not o.hide_render]) == 12
assert not any(o.name.startswith('Blank_') and not o.hide_render for o in scene.objects)

product_objects = {root, *root.children_recursive}
depsgraph = bpy.context.evaluated_depsgraph_get()
frozen = []
geometry_digest = hashlib.sha256()
gem_count = 0
source_points = []
for original in sorted(product_objects, key=lambda ob: ob.name):
    if original.hide_render or original.type not in {'MESH', 'CURVE', 'FONT'}:
        continue
    evaluated = original.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    transform = evaluated.matrix_world.copy()
    geometry_digest.update(original.name.encode())
    for vertex in mesh.vertices:
        geometry_digest.update(struct.pack('<3f', *vertex.co))
    for face in mesh.polygons:
        geometry_digest.update(struct.pack('<' + 'I' * len(face.vertices), *face.vertices))
    geometry_digest.update(struct.pack('<16f', *(v for row in transform for v in row)))
    mats = [slot.material for slot in original.material_slots]
    mesh.materials.clear()
    for material in mats:
        mesh.materials.append(material)
    frozen.append((original.name, mesh, transform))
    gem_count += original.name.startswith('Gemstone_')
    source_points.extend(transform @ Vector(corner) for corner in original.bound_box)
assert gem_count == 12, gem_count
geometry_hash = geometry_digest.hexdigest()
radius = max(math.hypot(p.x, p.y) for p in source_points)

# Native driver dependencies have been evaluated into the meshes. Remove the
# original hierarchy only in this in-memory campaign scene.
for ob in list(product_objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for ob in list(scene.objects):
    if ob.type == 'LIGHT':
        bpy.data.objects.remove(ob, do_unlink=True)

silver = model.M['Steel_Light_Brushed']
black = model.M['Steel_Dark_PVD']
gold = silver.copy()
gold.name = 'Halo champagne gold / silver brushing unchanged'
gold_surface = next(n for n in gold.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
gold_color = (.68, .55, .35, 1)
gold_surface.inputs['Base Color'].default_value = gold_color
gold.diffuse_color = gold_color
metals = {'Silver': silver, 'Black': black, 'Gold': gold}


def surface(name, color, roughness, texture_scale=1.0, relief=.025):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    coordinates = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = texture_scale
    noise.inputs['Detail'].default_value = 3
    links.new(coordinates.outputs['Object'], noise.inputs['Vector'])
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .18
    bump.inputs['Distance'].default_value = relief
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return material


quiet = options.variant == 'quiet'
stage = surface('Warm honed limestone' if quiet else 'Fine charcoal stone',
                (.38, .34, .285) if quiet else (.003, .005, .008), .70 if quiet else .34)
if options.variant == 'trio':
    # The site fades the edges into #080b10. A low-reflectance charcoal floor
    # preserves contact shadows without revealing a bright rectangular light card.
    floor_surface = stage.node_tree.nodes.get('Principled BSDF')
    floor_surface.inputs['Base Color'].default_value = (.0015, .002, .003, 1)
    floor_surface.inputs['Roughness'].default_value = .55
    floor_surface.inputs['Specular IOR Level'].default_value = .08
plinth_material = surface('Limestone cut edge' if quiet else 'Dark basalt cut edge',
                         (.33, .29, .245) if quiet else (.012, .016, .022), .62)
bpy.ops.mesh.primitive_plane_add(size=2400, location=(0, 0, -.04))
ground = bpy.context.object
ground.name = 'Campaign ground / physical contact shadows'
ground.data.materials.append(stage)


def plinth(name, x, y, height):
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=radius - 3.0,
                                      depth=height, location=(x, y, height / 2))
    ob = bpy.context.object
    ob.name = name + ' / honed stone plinth'
    ob.data.materials.append(plinth_material)
    bevel = ob.modifiers.new('Soft cut edge', 'BEVEL')
    bevel.width = .65
    bevel.segments = 3
    normal = ob.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    normal.keep_sharp = True
    return ob


# Every pair has disjoint horizontal bounding circles. Apparent overlap in the
# close-up comes solely from perspective; bracelets cannot pass through each other.
if options.variant == 'trio':
    poses = [('Silver', -55, -20, 3, -17), ('Black', -5, 58, 12, 7), ('Gold', 65, 8, 5, 19)]
    camera_location, target, scale = (5, -330, 211), (5, 8, 15), 236
elif options.variant == 'closeup':
    poses = [('Silver', -62, 31, 2, -25), ('Black', 35, 56, 6, 12), ('Gold', 7, -43, 0, 11)]
    camera_location, target, scale = (25, -300, 180), (7, -32, 4), 112
else:
    poses = [('Silver', -89, 4, 0, -17), ('Black', 0, 23, 0, 6), ('Gold', 89, -4, 0, 20)]
    camera_location, target, scale = (0, -320, 320), (0, 9, 0), 305
for index, pose in enumerate(poses):
    for other in poses[index + 1:]:
        distance = math.hypot(pose[1] - other[1], pose[2] - other[2])
        assert distance > radius * 2, (radius, distance, pose[0], other[0])

copies, bracelets = [], []
flip = Matrix.Rotation(math.pi, 4, 'Y')
for finish, x, y, support_height, angle in poses:
    rotation = Matrix.Rotation(math.radians(angle), 4, 'Z') @ flip
    lowest = min((rotation @ point).z for point in source_points)
    pose = Matrix.Translation((x, y, support_height - lowest + .02)) @ rotation
    if support_height:
        plinth(finish, x, y, support_height)
    collection = bpy.data.collections.new('Halo / ' + finish)
    scene.collection.children.link(collection)
    for name, mesh, transform in frozen:
        ob = bpy.data.objects.new(finish + ' / ' + name, mesh)
        collection.objects.link(ob)
        ob.matrix_world = pose @ transform
        for slot in ob.material_slots:
            if slot.material and slot.material.name.startswith('Steel_'):
                slot.link = 'OBJECT'
                slot.material = metals[finish]
        copies.append(ob)
    bracelets.append(dict(finish=finish, installedStones=12, blankPositions=0,
                          closedClasp=True, geometrySha256=geometry_hash,
                          position=[x, y, support_height], rotationDegrees=angle))


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


light('Campaign / directional silk key', (-110, -85, 210), (0, 0, 0), 610000, 115, 150, (1, .965, .92))
light('Campaign / neutral contour', (155, 65, 155), (0, 0, 18), 240000, 145, 200, (.93, .965, 1))
light('Campaign / front reflection strip', (0, -165, 62), (0, 0, 15), 320000, 190, 45, (1, 1, 1))
light('Campaign / rear horizon', (-40, 135, 120), (0, 0, 12), 180000, 180, 40, (1, .94, .86))
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.5, .53, .59, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .32 if quiet else .16
cam.location = camera_location
cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = scale
cam.data.dof.use_dof = False
scene.camera = cam
scene.render.film_transparent = False
scene.render.resolution_x = options.width
scene.render.resolution_y = round(options.width * 2 / 3)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.cycles.samples = options.samples
scene.cycles.adaptive_threshold = .025 if options.samples <= 24 else .012
scene.cycles.use_persistent_data = False
scene.render.use_persistent_data = False
scene.cycles.seed = 29
scene.view_settings.exposure = -.4 if quiet else -.20
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
bpy.context.view_layer.update()

projected = [world_to_camera_view(scene, cam, ob.matrix_world @ Vector(corner))
             for ob in copies for corner in ob.bound_box]
image_bounds = dict(left=min(p.x for p in projected), right=max(p.x for p in projected),
                    top=1-max(p.y for p in projected), bottom=1-min(p.y for p in projected))
print('HALO_CAMPAIGN_READY', json.dumps(dict(variant=options.variant, radius=radius,
      bounds=image_bounds, bracelets=3, gemstones=36, device=scene.cycles.device)), flush=True)
target_path = out / ('halo-' + options.variant + '.png')
temporary = target_path.with_name(target_path.stem + '.pending.png')
scene.render.filepath = str(temporary)
bpy.ops.render.render(write_still=True)
temporary.replace(target_path)
final_hash = hashlib.sha256(source.read_bytes()).hexdigest()
assert final_hash == source_hash, 'Native master changed'
manifest = dict(version=1, variant=options.variant, file=target_path.name,
                width=scene.render.resolution_x, height=scene.render.resolution_y,
                samples=options.samples, source=source.name, sourceSha256Before=source_hash,
                sourceSha256After=final_hash, sourceUnchanged=True,
                canonicalSetup='scripts/render-bracelet.py before states=[]',
                mineralKeys=namespace['KEYS'], braceletCount=3, gemstoneCount=36,
                identicalGeometryAcrossFinishes=True, nonIntersectingBracelets=True,
                geometrySha256=geometry_hash, meshCountPerBracelet=len(frozen),
                imageBounds=image_bounds, bracelets=bracelets,
                gold='Brushed silver shader copied; Base Color changed to linear RGB ' + str(gold_color[:3]))
(out / ('halo-' + options.variant + '.json')).write_text(json.dumps(manifest, indent=2) + '\n')
print('HALO_CAMPAIGN_FINISHED', str(target_path), flush=True)
if options.save_scene:
    # Save after the image so a full disk cannot prevent delivery of the still.
    # Separate compressed campaign scene; never the source path or backups.
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(out / ('halo-' + options.variant + '.blend')),
                              copy=True, compress=True)
