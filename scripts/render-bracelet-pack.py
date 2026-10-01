"""Pack twelve-seat native renders without changing alignment or source geometry.
Run after render-bracelet.py (Light/Dark and --gems-only) and finale rendering.
--partial permits an incremental website preview while remaining images render.
"""
from pathlib import Path
import argparse, hashlib, json, shutil
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'website/assets/bracelet-year'
RAW=Path('/Users/connor/Documents/ChatGPT/habit halo/output/halo-bracelet-year-renders')
MASTER=Path('/Users/connor/Documents/ChatGPT/habit halo/output/halo-bracelet-master/HALO_Bracelet_Master.blend')
parser=argparse.ArgumentParser()
parser.add_argument('--partial',action='store_true',help='Keep existing assets when no new raw render is present')
parser.add_argument('--raw-dir',type=Path,default=RAW)
parser.add_argument('--site-dir',type=Path,default=SITE)
args=parser.parse_args()
RAW=args.raw_dir.expanduser().resolve()
SITE=args.site_dir.expanduser().resolve()
ALIASES={'green-aventurine':'aventurine','clear-quartz':'quartz'}
required=[f'base-{finish}-{index:02}' for finish in ['light','dark'] for index in range(12)]+[f'{kind}-{index:02}' for kind in ['stone','gem'] for index in range(12)]+['empty-light','empty-dark']
SITE.mkdir(parents=True,exist_ok=True)
def save_webp(image,target):
    temporary=target.with_name('.'+target.name+'.pending')
    image.save(temporary,'WEBP',quality=93,method=6,exact=True)
    temporary.replace(target)

for name in required:
    source=RAW/f'{name}.png';target=SITE/f'{name}.webp'
    if not source.exists():
        if args.partial:continue
        raise FileNotFoundError(source)
    if not target.exists() or source.stat().st_mtime>target.stat().st_mtime:
        with Image.open(source) as image:
            assert image.mode=='RGBA',name
            assert image.size==((900,750) if name.startswith('gem-') else (1000,875)),(name,image.size)
            save_webp(image,target)
for finish in ['light','dark']:
    for index in range(12):
        base=RAW/f'base-{finish}-{index:02}.png';stone=RAW/f'stone-{index:02}.png'
        if not (base.exists() and stone.exists()):continue
        target=SITE/f'progress-{finish}-{index+1:02}.webp'
        if not target.exists() or target.stat().st_mtime<max(base.stat().st_mtime,stone.stat().st_mtime):
            with Image.open(base) as band,Image.open(stone) as current:
                save_webp(Image.alpha_composite(band,current),target)
        if finish=='light':shutil.copy2(target,SITE/f'progress-{index+1:02}.webp')
    empty=SITE/f'empty-{finish}.webp'
    if empty.exists():
        shutil.copy2(empty,SITE/f'progress-{finish}-00.webp')
        if finish=='light':
            shutil.copy2(empty,SITE/'empty.webp');shutil.copy2(empty,SITE/'progress-00.webp')
manifest_path=SITE/'render-manifest.json'
previous=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
state_map={(state['finish'],state['month']):state for state in previous.get('states',[])}
# Both a combined render and independent Light/Dark jobs are supported. Newer
# renderer manifests supersede earlier month entries, while partial updates keep
# untouched states and standalone gem cards from the existing staged delivery.
for path in sorted(SITE.glob('render-manifest-*.json'),key=lambda path:path.stat().st_mtime):
    data=json.loads(path.read_text())
    if data.get('width')!=1000 or data.get('height')!=875:
        if args.partial:continue
        raise ValueError(f'Non-delivery render dimensions in {path}')
    assert data['positions']==12
    for state in data['states']:
        state_map[(state['finish'],state['month'])]=state
complete_states=all((finish,index) in state_map for finish in ['Light','Dark'] for index in range(12))
if not args.partial and not complete_states:
    raise ValueError('All twelve monthly states are required for both finishes')
if complete_states:
    states=[]
    for finish in ['Light','Dark']:
        for index in range(12):
            state=state_map[(finish,index)]
            state['current']=ALIASES.get(state['current'],state['current'])
            for position in state['positions']:position['mineral']=ALIASES.get(position['mineral'],position['mineral'])
            assert state['installed']==state['month']+1 and state['blanks']==11-state['month']
            assert len(state['positions'])==12
            states.append(state)
    for index in range(12):
        a,b=[state for state in states if state['month']==index]
        assert a['positions']==b['positions']
    assets=[dict(file=p.name,bytes=p.stat().st_size) for p in sorted(SITE.glob('*.webp'))]
    manifest=dict(previous,source=MASTER.name,sourceSha256=hashlib.sha256(MASTER.read_bytes()).hexdigest(),width=1000,height=875,
        positions=12,receiverCount=12,blindPocketCount=12,removedIntentionReceiver=True,
        indexConvention='index 0 is Month 01; no separate Intention stone',
        status='Native visual design study; materials, retention, fit and RF remain unqualified.',
        historyRanks=[-1,1,-2,2,-3,-4,3,-5,4,-6,5],states=states,assets=assets,totalWebBytes=sum(a['bytes'] for a in assets))
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
# Finale has independent manifests because Light/Dark can render concurrently.
finale=SITE/'finale'
finale_paths=sorted(finale.glob('manifest-*.json'),key=lambda path:path.stat().st_mtime)
if finale_paths:
    manifests=[json.loads(path.read_text()) for path in finale_paths]
    assert len({data['sourceSha256Before'] for data in manifests})==1
    frame_map={(frame['finish'],frame['index']):frame for data in manifests for frame in data['frames']}
    complete_frames=all((finish,index) in frame_map for finish in ['Light','Dark'] for index in range(24))
    if complete_frames:
        manifest={**manifests[-1],'frames':[frame_map[key] for key in sorted(frame_map)]}
        assert len(manifest['frames'])==48 and all(f['installedStones']==12 for f in manifest['frames'])
        (finale/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(packed=len(list(SITE.glob('*.webp'))),partial=args.partial)))
