"""Camera-independent mineral and brushed-metal appearance for the Halo website.

Geometry, seats and motion belong to the native master. These art-directed
appearance materials are not measured mineral spectra. Albedo contains no
lighting; Cycles supplies the reflections on each continuous polished crown.
"""
from pathlib import Path
import bpy

TEXTURES = Path(__file__).resolve().parent / 'bracelet-materials'
SPECS = [
    # key, display name, transmission, polish roughness, IOR, internal haze
    ('moonstone', 'Moonstone', .28, .19, 1.52, .025),
    ('amethyst', 'Amethyst', .43, .135, 1.544, .008),
    ('turquoise', 'Turquoise', 0, .255, 1.61, 0),
    ('rose-quartz', 'Rose Quartz', .30, .19, 1.544, .035),
    ('carnelian', 'Carnelian', .30, .16, 1.54, .019),
    ('lapis-lazuli', 'Lapis Lazuli', 0, .215, 1.50, 0),
    ('aventurine', 'Green Aventurine', .12, .22, 1.544, .024),
    ('tigers-eye', "Tiger's Eye", 0, .165, 1.544, 0),
    ('black-tourmaline', 'Black Tourmaline', 0, .205, 1.64, 0),
    ('citrine', 'Citrine', .55, .13, 1.544, .004),
    ('quartz', 'Clear Quartz', .72, .12, 1.544, .003),
    ('opal', 'Opal', .15, .185, 1.46, .023),
]
SPECS = [dict(zip(('key','name','transmission','roughness','ior','haze'), row)) for row in SPECS]


def mineral_material(spec):
    key = spec['key']
    material = bpy.data.materials.new('Halo mineral / ' + spec['name'])
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    surface = nodes.get('Principled BSDF')
    surface.inputs['Metallic'].default_value = 0
    surface.inputs['IOR'].default_value = spec['ior']
    surface.inputs['Transmission Weight'].default_value = spec['transmission']
    surface.inputs['Coat Weight'].default_value = .025
    surface.inputs['Coat Roughness'].default_value = .19
    surface.inputs['Thin Film Thickness'].default_value = 0
    surface.inputs['Emission Strength'].default_value = 0

    coordinates = nodes.new('ShaderNodeTexCoord')
    texture = nodes.new('ShaderNodeTexImage')
    texture.label = 'Mineral structure / local crown coordinates'
    texture.image = bpy.data.images.load(str(TEXTURES / (key + '.png')), check_existing=True)
    texture.image.colorspace_settings.name = 'sRGB'
    texture.extension = 'EXTEND'
    links.new(coordinates.outputs['Generated'], texture.inputs['Vector'])
    links.new(texture.outputs['Color'], surface.inputs['Base Color'])

    # Tiny polish variation, without embossing cracks onto a finished surface.
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 42
    noise.inputs['Detail'].default_value = 2
    links.new(coordinates.outputs['Generated'], noise.inputs['Vector'])
    roughness = nodes.new('ShaderNodeMapRange')
    roughness.inputs['To Min'].default_value = spec['roughness'] - .012
    roughness.inputs['To Max'].default_value = spec['roughness'] + .012
    links.new(noise.outputs['Fac'], roughness.inputs['Value'])
    links.new(roughness.outputs['Result'], surface.inputs['Roughness'])

    if spec['haze']:
        scatter = nodes.new('ShaderNodeVolumeScatter')
        scatter.label = 'Faint internal clouding / native millimetre units'
        scatter.inputs['Color'].default_value = (.87,.89,.91,1)
        scatter.inputs['Density'].default_value = spec['haze']
        scatter.inputs['Anisotropy'].default_value = .25
        links.new(scatter.outputs['Volume'], nodes.get('Material Output').inputs['Volume'])

    if key == 'tigers-eye':
        surface.inputs['Anisotropic'].default_value = .65
        tangent = nodes.new('ShaderNodeVectorTransform')
        tangent.vector_type = 'VECTOR'
        tangent.convert_from = 'OBJECT'
        tangent.convert_to = 'WORLD'
        tangent.inputs['Vector'].default_value = (0,1,0)
        links.new(tangent.outputs['Vector'], surface.inputs['Tangent'])
    if key == 'black-tourmaline':
        tint = nodes.new('ShaderNodeMixRGB')
        tint.blend_type = 'MULTIPLY'
        tint.inputs[0].default_value = .65
        tint.inputs[2].default_value = (.15,.17,.18,1)
        links.new(texture.outputs['Color'], tint.inputs[1])
        links.new(tint.outputs[0], surface.inputs['Base Color'])
    return material


def refine_metals(materials):
    for name, material in materials.items():
        if name not in ('Steel_Light_Brushed','Steel_Dark_PVD'):
            continue
        dark = name.endswith('PVD')
        nodes = material.node_tree.nodes
        surface = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
        # Blender 4.5 renamed this socket; the master's legacy setter silently
        # skipped anisotropy, making the band read like uniformly painted plastic.
        surface.inputs['Anisotropic'].default_value = .38 if dark else .44
        surface.inputs['Base Color'].default_value = (.060,.065,.070,1) if dark else (.53,.55,.56,1)
        for node in nodes:
            if node.type == 'VALTORGB' and 'roughness' in node.name.lower():
                for element, value in zip(node.color_ramp.elements, (.235,.30) if dark else (.245,.31)):
                    element.color = (value,value,value,1)
            if node.type == 'VECT_MATH' and 'Brushing:' in node.name:
                node.inputs[1].default_value = (5,950,1)
