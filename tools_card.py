# -*- coding: utf-8 -*-
"""명식 카드를 PNG 로 뽑는다 — 사장님 09-21 「내가 일일이 잘라서 붙여넣으려니 끔찍한데?」
   app/myeongsik.html 을 머리 없는 크롬으로 한 장씩 찍고, 바탕을 잘라 낸다.

   쓰는 법:
     python tools_card.py 나갈폴더 "KR:서울" "2026-10-26T15:00,2026-10-28T14:00" "병원 추천 시각,권하는 시각" [M|F]
   나갈폴더에 01-….png, 02-….png 가 생긴다. 네이버 글에는 파일을 한꺼번에 끌어다 놓으면 된다."""
import os, sys, subprocess, urllib.parse, re
from PIL import Image, ImageChops
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(ROOT, 'app', 'myeongsik.html')
BROWSERS = [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"]

def 찍기(out_dir, place, slots, labels, g=None):
    os.makedirs(out_dir, exist_ok=True)
    exe = next(b for b in BROWSERS if os.path.exists(b))
    made = []
    for i, slot in enumerate(slots):
        q = {'place': place, 'slots': ','.join(slots), 'labels': ','.join(labels), 'only': str(i), 'shot': '1'}
        if g: q['g'] = g
        url = 'file:///' + PAGE.replace(os.sep, '/').replace(' ', '%20') + '?' + urllib.parse.urlencode(q, quote_via=urllib.parse.quote)
        name = '%02d-%s.png' % (i + 1, re.sub(r'[^0-9A-Za-z가-힣]+', '_', (labels[i] if i < len(labels) else slot)).strip('_')[:40])
        path = os.path.join(os.path.abspath(out_dir), name)
        # 크롬은 상대 경로 · 한글 경로에 그림을 못 쓸 때가 있다 — 임시 폴더의 영문 이름으로 찍고 옮긴다.
        import tempfile, shutil
        tmp = os.path.join(tempfile.gettempdir(), 'chaeksa_card_%d.png' % i)
        if os.path.exists(tmp): os.remove(tmp)
        final, path = path, tmp
        subprocess.run([exe, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
                        '--window-size=600,900', '--virtual-time-budget=9000', '--allow-file-access-from-files',
                        '--screenshot=' + path, url], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
        im = Image.open(path).convert('RGB')
        box = ImageChops.difference(im, Image.new('RGB', im.size, im.getpixel((2, 2)))).getbbox()   # 바탕색과 다른 곳만
        if box:
            m = 28; box = (max(0, box[0] - m), max(0, box[1] - m), min(im.width, box[2] + m), min(im.height, box[3] + m)); im = im.crop(box)
        im.save(final); os.remove(tmp); made.append(final); print(' ', name, im.size)
    return made

if __name__ == '__main__':
    if len(sys.argv) < 5: print(__doc__); sys.exit(1)
    찍기(sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4].split(','), sys.argv[5] if len(sys.argv) > 5 else None)
