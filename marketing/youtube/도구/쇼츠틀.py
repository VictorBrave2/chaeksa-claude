"""쇼츠틀 — 「위 검은 띠 큰 제목 + 가운데 그림 + 굵은 짧은 자막」 쇼츠(10-21 사장님이 보낸 김블루님 쇼츠 꼴).

쓰는 법:
  python 쇼츠틀.py <소리> <words.json> <장면.json> <나갈.mp4> [--bgm 음악]

장면.json:
  {"title": ["변신할 때", "공격 안 하는 이유"],      # 위 띠 두 줄 — 첫 줄 흰색, 둘째 줄 노란색(영상 내내 고정)
   "scenes": [{"s": 0, "img": "그림 경로"}, ...],    # s 초부터 그 그림(다음 장면까지). 그림은 천천히 다가간다
   "end": "chaeksa.kr"}
화면: 1080x1920 검은 바탕 · 위 띠(0~400) · 그림 칸(400~1320, 1080x920) · 그림 아래쪽에 굵은 흰 자막(검은 테두리, 2~4낱말씩)
     · 위 띠 아래 작은 줄 = 지금 말하는 문장 전체. 쇼츠 단추 · 아래 글이 가리는 곳(오른쪽 · 아래)은 비운다.
소리는 모션.py 와 같다(잡음 줄이기 · -14 LUFS · --bgm 작게).
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from 모션 import FFMPEG, SANS, 글꼴, 쉬움, 소리만들기  # noqa: E402

W, H, FPS = 1080, 1920, 30
흰, 노랑, 검정, 흐림 = (255, 255, 255), (0xff, 0xe1, 0x4d), (0, 0, 0), (0xc8, 0xc8, 0xc8)
칸 = (0, 400, 1080, 1320)   # 그림 칸


def 자막덩이(segments, 최대=9):
    """낱말을 화면 자막 한 덩이(2~4낱말, 글자 9 안쪽)로 묶는다."""
    out = []
    for seg in segments:
        cur = []
        for w in seg['words']:
            if not w['w']:
                continue
            if cur and (sum(len(x['w']) for x in cur) + len(w['w']) > 최대 or len(cur) >= 4):
                out.append(cur); cur = []
            cur.append(w)
            if re.search(r'[.?!,]$', w['w']):
                out.append(cur); cur = []
        if cur:
            out.append(cur)
    return [{'s': c[0]['s'], 'e': c[-1]['e'], 'text': re.sub(r'[.,]$', '', ' '.join(x['w'] for x in c))} for c in out]


def 그림맞춤(path, cw, ch):
    im = Image.open(path).convert('RGB')
    if im.size == (cw, ch):   # 장면그림.py 로 칸 크기 그대로 그린 것 — 키우지 않는다(가장자리 글이 잘렸다, 10-21)
        return im
    r = max(cw / im.width, ch / im.height) * 1.12   # 다가갈 여유 12%
    return im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio'); ap.add_argument('words'); ap.add_argument('scenes'); ap.add_argument('out')
    ap.add_argument('--bgm', default='')
    ap.add_argument('--speed', type=float, default=1.0, help='말 빠르기(높낮이 그대로) — 1.1 이면 10% 빠르게')
    a = ap.parse_args()
    data = json.load(open(a.words, encoding='utf-8'))
    sc = json.load(open(a.scenes, encoding='utf-8'))
    sp = a.speed
    if abs(sp - 1) > 1e-3:   # 빠르게 하면 낱말 시각 · 장면 시각도 같이 당긴다
        data['length'] = data['length'] / sp
        for seg in data['segments']:
            seg['s'] /= sp; seg['e'] /= sp
            for w in seg['words']:
                w['s'] /= sp; w['e'] /= sp
        for x in sc['scenes']:
            x['s'] /= sp
    길이 = float(data['length']); 끝 = 2.0; 전체 = 길이 + 끝
    덩이 = 자막덩이(data['segments'])
    문장 = [{'s': s['s'], 'e': s['e'], 'text': s['text']} for s in data['segments']]
    장면 = sorted(sc['scenes'], key=lambda x: x['s'])
    cw, ch = 칸[2] - 칸[0], 칸[3] - 칸[1]
    그림들 = {}
    for x in 장면:
        if x['img'] not in 그림들:
            그림들[x['img']] = 그림맞춤(x['img'], cw, ch)

    f제목 = 글꼴(SANS, 96, 900)
    f작은 = 글꼴(SANS, 30, 500)
    f자막 = 글꼴(SANS, 92, 900)
    f끝 = 글꼴(SANS, 110, 900)
    f끝작 = 글꼴(SANS, 44, 600)

    tmp = tempfile.mkdtemp(prefix='shorts-')
    소리 = os.path.join(tmp, 'a.wav')
    소리만들기(a.audio, a.bgm, 길이, 끝, 소리, sp)
    enc = subprocess.Popen([FFMPEG, '-nostdin', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-i', 소리, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', a.out],
                           stdin=subprocess.PIPE)
    t1, t2 = (sc.get('title') + ['', ''])[:2]
    for i in range(int(math.ceil(전체 * FPS))):
        t = i / FPS
        im = Image.new('RGB', (W, H), 검정)
        d = ImageDraw.Draw(im)
        if t < 길이:
            # 그림 — 지금 장면, 장면마다 천천히 다가간다(켄 번즈)
            지금 = 장면[0]; 다음s = 길이
            for j, x in enumerate(장면):
                if x['s'] <= t:
                    지금 = x; 다음s = 장면[j + 1]['s'] if j + 1 < len(장면) else 길이
            src = 그림들[지금['img']]
            p = max(0.0, min(1.0, (t - 지금['s']) / max(0.5, 다음s - 지금['s'])))
            sx = (src.width - cw) / 2 + (src.width - cw) * 0.15 * (p - 0.5)
            sy = (src.height - ch) * (0.10 + 0.08 * p)   # 세로 그림은 얼굴이 위에 있다 — 위쪽을 잡고 천천히 내려간다(10-21 시험: 가운데를 잡아 몸통만 나옴)
            sx = int(max(0, min(src.width - cw, sx))); sy = int(max(0, min(src.height - ch, sy)))
            crop = src.crop((sx, sy, sx + cw, sy + ch))
            if p > 0:
                s2 = 1 + (0.03 if src.size == (cw, ch) else 0.06) * p
                crop = crop.resize((int(cw * s2), int(ch * s2)), Image.BILINEAR)
                ox, oy = (crop.width - cw) // 2, (crop.height - ch) // 2
                crop = crop.crop((ox, oy, ox + cw, oy + ch))
            # 장면 바뀔 때 0.15초 흰 번쩍
            if t - 지금['s'] < 0.15 and 지금['s'] > 0:
                crop = Image.blend(crop, Image.new('RGB', crop.size, 흰), 0.5 * (1 - (t - 지금['s']) / 0.15))
            im.paste(crop, (칸[0], 칸[1]))
            # 굵은 자막 — 그림 칸 아래쪽
            for c in 덩이:
                if c['s'] - 0.05 <= t <= c['e'] + 0.15:
                    k = 쉬움((t - c['s'] + 0.05) / 0.12)
                    fs = 글꼴(SANS, int(92 * (0.9 + 0.1 * k)), 900)
                    d.text((W / 2 - 30, 칸[3] + 110), c['text'], font=fs, fill=흰, anchor='mm', stroke_width=10, stroke_fill=검정)
                    break
            # 위 띠 아래 작은 줄 — 지금 문장 전체
            for s in 문장:
                if s['s'] <= t <= s['e'] + 0.3:
                    글 = s['text'] if len(s['text']) <= 34 else s['text'][:33] + '…'
                    d.text((W / 2, 칸[1] - 26), 글, font=f작은, fill=흐림, anchor='mm')
                    break
        else:
            k = 쉬움((t - 길이) / 0.4)
            d.text((W / 2, 860), sc.get('end', 'chaeksa.kr'), font=f끝, fill=노랑 if k > 0.05 else 검정, anchor='mm')
            d.text((W / 2, 980), '사주 공부, 제가 대신 했습니다', font=f끝작, fill=흰, anchor='mm')
        # 위 띠 — 큰 제목 두 줄(내내)
        d.text((W / 2, 140), t1, font=f제목, fill=흰, anchor='mm', stroke_width=4, stroke_fill=검정)
        d.text((W / 2, 260), t2, font=f제목, fill=노랑, anchor='mm', stroke_width=4, stroke_fill=검정)
        enc.stdin.write(im.tobytes())
    enc.stdin.close(); enc.wait()
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'만듦: {a.out} · {전체:.1f}초 · 장면 {len(장면)} · 자막 {len(덩이)}')


if __name__ == '__main__':
    main()
