"""Assemble native Halo renders into the closing film; no optical-flow synthesis.

python3 scripts/encode-closing-film.py --render-dir /path/to/halo-closing-film
Requires FFmpeg/ffprobe and Pillow. Native input hashes are checked before use.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--render-dir', type=Path, required=True)
parser.add_argument('--asset-dir', type=Path, default=Path(__file__).resolve().parents[1] / 'marketing/closing-film')
options = parser.parse_args()
source = options.render_dir.expanduser().resolve()
assets = options.asset_dir.expanduser().resolve()
temporary = source / 'encode'
temporary.mkdir(parents=True, exist_ok=True)
assets.mkdir(parents=True, exist_ok=True)
fps = 24

def run(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', *args], check=True)

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

inputs = []
manifests = {}
for directory, expected in [('months', 12), ('motion', 108), ('poster', 1)]:
    manifest = json.loads((source / directory / 'render-manifest.json').read_text())
    if not manifest['sourceUnchanged'] or len(manifest['frames']) != expected:
        raise RuntimeError(f'Incomplete or altered native source: {directory}')
    for frame in manifest['frames']:
        file = source / directory / frame['file']
        if digest(file) != frame['sha256']:
            raise RuntimeError(f'Frame hash mismatch: {directory}/{file.name}')
        if frame['installedStones'] + frame['blankPositions'] != 12 or not frame['closedClasp']:
            raise RuntimeError(f'Invalid bracelet occupancy: {file.name}')
        inputs.append({'path': f'{directory}/{file.name}', 'sha256': frame['sha256']})
    manifests[directory] = manifest

if len({manifest['sourceSha256Before'] for manifest in manifests.values()}) != 1:
    raise RuntimeError('The sequence must come from one unchanged native master.')
geometry = {frame['geometrySha256'] for frame in manifests['motion']['frames']}
if len(geometry) != 1 or manifests['months']['frames'][-1]['geometrySha256'] not in geometry:
    raise RuntimeError('Completed bracelet geometry differs between the monthly and finish studies.')

width, height = manifests['motion']['width'], manifests['motion']['height']
intro = temporary / 'accumulation.mkv'
args = []
filters = []
for index in range(12):
    args += ['-loop', '1', '-framerate', str(fps), '-t', '0.5', '-i', str(source / 'months' / f'halo-gold-month-{index + 1:02}-000.png')]
    filters.append(f'[{index}:v]format=yuv444p,settb=1/{fps},setpts=PTS-STARTPTS[m{index}]')
previous = 'm0'
for index in range(1, 12):
    current = f'blend{index}'
    # Twelve held poses, four-frame dissolves, eight new frames per month.
    filters.append(f'[{previous}][m{index}]xfade=transition=fade:duration={4/fps:.9f}:offset={index*8/fps:.9f}[{current}]')
    previous = current
run([*args, '-filter_complex_threads', '1', '-filter_complex', ';'.join(filters), '-map', f'[{previous}]', '-frames:v', '100', '-an', '-c:v', 'ffv1', '-level', '3', str(intro)])

portraits = []
for finish in ['gold', 'silver', 'black']:
    target = temporary / f'{finish}.mkv'
    run(['-framerate', '12', '-start_number', '0', '-i', str(source / 'motion' / f'halo-{finish}-month-12-%03d.png'),
         '-vf', 'fps=24,format=yuv444p,loop=loop=1:size=72:start=0,setpts=N/(24*TB)', '-frames:v', '84', '-an', '-c:v', 'ffv1', '-level', '3', str(target)])
    portraits.append(target)

movie = assets / 'halo-closing-film-v1.mp4'
pending = temporary / 'halo-closing-film-v1.pending.mp4'
args = ['-i', str(intro)]
for portrait in portraits:
    args += ['-i', str(portrait)]
args += ['-t', '0.5', '-i', str(portraits[0])]
filters = [f'[{index}:v]format=yuv444p,settb=1/24,setpts=PTS-STARTPTS[v{index}]' for index in range(5)]
filters += [
    '[v0][v1]concat=n=2:v=1:a=0,settb=1/24[gold]',
    # Appending the first twelve delivery frames to every portrait makes each
    # overlap use identical native camera poses; only the metal finish dissolves.
    f'[gold][v2]xfade=transition=fade:duration=0.5:offset={172/fps:.9f}[silver]',
    f'[silver][v3]xfade=transition=fade:duration=0.5:offset={244/fps:.9f}[black]',
    f'[black][v4]xfade=transition=fade:duration=0.5:offset={316/fps:.9f},format=yuv420p[film]',
]
run([*args, '-filter_complex_threads', '1', '-filter_complex', ';'.join(filters), '-map', '[film]',
     '-frames:v', '328', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high',
     '-pix_fmt', 'yuv420p', '-g', '24', '-movflags', '+faststart', str(pending)])
pending.replace(movie)
poster = assets / 'halo-closing-film-v1-poster.webp'
with Image.open(source / 'poster/halo-gold-month-12-000.png') as image:
    image.convert('RGB').save(poster, 'WEBP', quality=92, method=6)
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(movie)]))
video = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')
if video['nb_frames'] != '328' or video['r_frame_rate'] != '24/1' or (video['width'], video['height']) != (width, height):
    raise RuntimeError('Encoded movie does not match its native frame dimensions or intended timeline.')
if any(stream['codec_type'] == 'audio' for stream in probe['streams']):
    raise RuntimeError('The marketing film must be silent.')
if movie.stat().st_size > 5 * 1024 * 1024:
    raise RuntimeError('Marketing film exceeds the 5 MB delivery budget.')
record = {
    'schema_version': 1,
    'generated_at_utc': datetime.now(timezone.utc).isoformat(),
    'source_master_sha256': manifests['motion']['sourceSha256Before'],
    'source_master_unchanged': all(item['sourceUnchanged'] for item in manifests.values()),
    'render_engine': 'Blender Cycles', 'native_samples': manifests['motion']['samples'],
    'native_motion_fps': 12, 'delivery_fps': 24,
    'motion_note': 'Native camera and light motion. Frames repeat at delivery rate; no optical flow or invented geometry. Monthly poses and finish changes use editorial dissolves.',
    'loop_start_seconds': 112 / fps,
    'loop_note': 'Accumulation plays once. Subsequent playback loops only the completed twelve-stone bracelet across finishes.',
    'width': video['width'], 'height': video['height'], 'duration_seconds': float(probe['format']['duration']),
    'outputs': [{ 'path': file.name, 'sha256': digest(file), 'bytes': file.stat().st_size } for file in [movie, poster]],
    'native_inputs': inputs,
    'render_script_versions': {directory: manifest['scriptSha256'] for directory, manifest in manifests.items()},
    'encoder_script_sha256': digest(Path(__file__)),
}
(source / 'delivery-manifest.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({key: value for key, value in record.items() if key not in ('native_inputs',)}, indent=2))
