"""Content curation v1 (director). Selects 40 puzzles from generator pools in generated/<band>/ and writes
ramp-ordered, renamed definitions to generated/curated/. Criteria are documented in docs/content/CURATION.md.
Usage: python3 scripts/curate.py"""
import json, glob, os

def load(band):
    return [json.load(open(f)) for f in sorted(glob.glob(f'generated/{band}/*.json'))]

def m(d, k, default=0): return d['difficulty']['metrics'].get(k, default)
def balanced(d):
    v = list(d['population'].values()); return len(v) == 1 or max(v) <= 3 * min(v)
def species(d): return tuple(sorted(d['population']))

def pick_spread(cands, n, key):
    """Pick n candidates spread evenly across the sorted range of `key` (deterministic)."""
    cands = sorted(cands, key=lambda d: (key(d), d['id']))
    if len(cands) <= n: return cands
    idx = sorted({round(i * (len(cands) - 1) / (n - 1)) for i in range(n)})
    return [cands[i] for i in idx]

sel = {}
tut = sorted(load('tutorial'), key=lambda d: (m(d, 'substantiveSteps'), d['id']))
by_sp = {s: [d for d in tut if species(d) == (s,)] for s in ('fox', 'mouse', 'rabbit')}
sel['tutorial'] = by_sp['fox'][:2] + by_sp['mouse'][:1] + by_sp['rabbit'][:1]

beg = [d for d in load('beginner') if balanced(d)]
one = [d for d in beg if len(d['population']) == 1]; two = [d for d in beg if len(d['population']) == 2]
sel['beginner'] = pick_spread(one, 3, lambda d: m(d, 'substantiveSteps')) + pick_spread(two, 5, lambda d: m(d, 'substantiveSteps'))

easy = [d for d in load('easy') if balanced(d)]
easy = sorted(easy, key=lambda d: (-m(d, 'overlap'), d['id']))[:20]
sel['easy'] = pick_spread(easy, 8, lambda d: m(d, 'substantiveSteps'))

inter = [d for d in load('intermediate') if balanced(d)]
t2 = [d for d in inter if m(d, 'requiredTier') == 2]
t1 = sorted([d for d in inter if m(d, 'requiredTier') == 1], key=lambda d: (-m(d, 'chain'), -m(d, 'overlap'), d['id']))
sel['intermediate'] = (pick_spread(t2, min(8, len(t2)), lambda d: m(d, 'chain')) + t1)[:12]

adv = [d for d in load('advanced') if balanced(d) and m(d, 'requiredTier') == 3]
sizes = {}
for d in sorted(adv, key=lambda d: (-m(d, 'chain'), d['id'])): sizes.setdefault(d['rows'] * d['columns'], []).append(d)
out = []
while len(out) < 8 and any(sizes.values()):
    for k in sorted(sizes):
        if sizes[k] and len(out) < 8: out.append(sizes[k].pop(0))
sel['advanced'] = out

os.makedirs('generated/curated', exist_ok=True)
for band, items in sel.items():
    if band == 'tutorial':  # introduce species in GDD order: fox, mouse, rabbit (onboarding)
        order = {'fox': 0, 'mouse': 1, 'rabbit': 2}
        items = sorted(items, key=lambda d: (order[species(d)[0]], m(d, 'substantiveSteps'), d['id']))
    else:
        items = sorted(items, key=lambda d: (m(d, 'requiredTier'), m(d, 'substantiveSteps'), m(d, 'chain'), d['id']))
    for i, d in enumerate(items, 1):
        d = dict(d); d['provenance'] = dict(d['provenance'], params=dict(d['provenance'].get('params', {}), generatedId=d['id']))
        d['id'] = f'{band}-{i:02d}'
        json.dump(d, open(f'generated/curated/{d["id"]}.json', 'w'), indent=2)
        print(f"{d['id']:16} {d['rows']}x{d['columns']} {','.join(f'{k}{v}' for k,v in d['population'].items()):22} tier{m(d,'requiredTier')} subst={m(d,'substantiveSteps'):<3} chain={m(d,'chain'):<3} overlap={m(d,'overlap')}")
    print(f'-- {band}: {len(items)}')
