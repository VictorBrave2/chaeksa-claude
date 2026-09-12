# -*- coding: utf-8 -*-
"""이야기 썸네일 작은 판 만들기.

GPT 가 뽑은 그림(1024×1536, 보통 150~300KB)을 app/art/story-<id>.webp 로 넣으면
홈 격자용 작은 판 app/art/story-<id>-s.webp (너비 360, 30~40KB)를 여기서 만든다.
큰 판은 이야기 화면이 쓰고, 작은 판은 홈 격자가 쓴다. 백 장이 돼도 홈은 가볍다.

    python tools_thumb.py          # story-*.webp 전부 (이미 있는 -s 는 건너뜀)
    python tools_thumb.py --force  # 다시 만듦
"""
import io, os, sys, glob
from PIL import Image
try: sys.stdout.reconfigure(encoding='utf-8')   # 윈도 콘솔이 cp949 라 한글이 깨진다
except Exception: pass

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'art')
WIDTH = 360
QUALITY = 82
force = '--force' in sys.argv

made = skipped = 0
for src in sorted(glob.glob(os.path.join(APP, 'story-*.webp'))):
    if src.endswith('-s.webp'):
        continue
    dst = src[:-5] + '-s.webp'
    if os.path.exists(dst) and not force:
        skipped += 1
        continue
    im = Image.open(src)
    im = im.convert('RGB')
    w, h = im.size
    if w > WIDTH:
        im = im.resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=QUALITY, method=6)
    print('%s  %dKB -> %s  %dKB' % (os.path.basename(src), os.path.getsize(src) // 1024,
                                    os.path.basename(dst), os.path.getsize(dst) // 1024))
    made += 1

print('만듦 %d · 건너뜀 %d' % (made, skipped))
