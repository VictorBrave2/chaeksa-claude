# -*- coding: utf-8 -*-
"""출산택일 「왜 하나」 쇼츠(세로 1080x1920 · 30fps · 약 24초 · 소리 없음) — 10-14 사장님 「3 ㄱㄱ 쇼츠 만들어」.
사이트 taekil.html 맨 위 네 장면(taekil-why.js)과 같은 글(작가 원고 비공개 core data/taekil-why-scenes-1013.json → app/taekil-why-copy.js)을 영상으로.
장면 1 예는 엔진 값(2026-12-09 09시 · 11시, 서울) — 시주만 바뀐다. 3 · 4장면 날짜는 「예시」로 적는다.
  python tools/shorts_taekil_why.py   → marketing/youtube/shorts/출산택일-왜-1.mp4
"""
import os, re, json, math, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'marketing', 'youtube', 'shorts', '출산택일-왜-1.mp4')
W, H, FPS = 1080, 1920, 30
BG, CARD, INK, SUB, LINE, ACC, SOFT = (246, 241, 231), (255, 253, 248), (42, 38, 32), (107, 99, 87), (226, 218, 203), (168, 67, 47), (241, 224, 214)
src = open(os.path.join(ROOT, 'app', 'taekil-why-copy.js'), encoding='utf-8').read()
C = json.loads(re.search(r'window\.TAEKIL_WHY = (\{.*\});', src, re.S).group(1))
S = C['장면']

def font(serif, size, w=400):
    f = ImageFont.truetype('C:/Windows/Fonts/' + ('NotoSerifKR-VF.ttf' if serif else 'NotoSansKR-VF.ttf'), size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
F_TOP, F_H, F_T, F_GZ, F_S, F_END, F_CAL = font(False, 46, 700), font(True, 88, 800), font(False, 56, 500), font(True, 96, 700), font(False, 42, 500), font(True, 64, 800), font(False, 50, 600)

def wrap(d, text, f, maxw):
    lines, cur = [], ''
    for ch in text:
        t = cur + ch
        if d.textlength(t, font=f) > maxw and cur:
            cut = max(cur.rfind(' '), 0)
            if cut > len(cur) * 0.5: lines.append(cur[:cut]); cur = cur[cut + 1:] + ch
            else: lines.append(cur); cur = ch
        else: cur = t
    if cur: lines.append(cur)
    return lines

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def frame(i, t, lt):   # i 장면, t 전체 초, lt 장면 안 초
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((80, 150), '출산택일, 왜 할까?', font=F_TOP, fill=ACC)
    d.text((W - 80, 150), f'{i + 1} / 4', font=F_TOP, fill=SUB, anchor='ra')
    a = ease(lt / 0.5)
    y0 = 300 + int((1 - a) * 30)
    d.rounded_rectangle((60, y0 - 40, W - 60, 1700), 36, fill=CARD, outline=LINE, width=3)
    s = S[i]
    y = y0 + 20
    for ln in wrap(d, s['머리'], F_H, W - 220): d.text((110, y), ln, font=F_H, fill=INK); y += 100
    y += 30; art_top = y
    if i == 0:
        cols = [('12월 9일 오전 9시', '丙午 庚子 丁巳 甲辰'.split()), ('같은 날 오전 11시', '丙午 庚子 丁巳 乙巳'.split())]
        bw, bh, gap = 190, 250, 22
        for k, (lab, gz) in enumerate(cols):
            yk = art_top + k * 360; d.text((110, yk), lab, font=F_S, fill=SUB)
            for j, g in enumerate(gz):
                bx, by = 110 + j * (bw + gap), yk + 64
                flip = (k == 1 and j == 3)
                p = ease((lt - 1.2) / 0.8) if flip else 0
                col = mix(LINE, ACC, p) if flip else LINE
                sc = abs(math.cos(p * math.pi)) if flip and 0 < p < 1 else 1
                txt = g if not flip else ('甲辰' if p < 0.5 else '乙巳')
                w2 = int(bw / 2 * sc); on = flip and p > 0.5
                d.rounded_rectangle((bx + bw // 2 - w2, by, bx + bw // 2 + w2, by + bh), 18, outline=col, width=6 if on else 3, fill=SOFT if on else CARD)
                if sc > 0.3:
                    d.text((bx + bw / 2, by + 70), txt[0], font=F_GZ, fill=ACC if on else INK, anchor='mm')
                    d.text((bx + bw / 2, by + 180), txt[1], font=F_GZ, fill=ACC if on else INK, anchor='mm')
        y = art_top + 720
    elif i in (1, 2):
        keep = [3, 4, 5, 6, 7, 10, 11, 12, 13, 14] if i == 1 else [5, 12]
        cw, ch = 118, 130
        for n in range(1, 22):
            r, c = (n - 1) // 7, (n - 1) % 7
            x, yy = 110 + c * (cw + 8), art_top + r * (ch + 12)
            if i == 1:
                p = ease((lt - 0.8 - n * 0.04) / 0.4)
                fill = mix(SOFT, ACC, 0) if False else None
                if n in keep: bg, fg = mix(BG, SOFT, p), mix(SUB, ACC, p)
                else: bg, fg = mix(BG, CARD, p), mix(SUB, LINE, p)
            else:
                p = ease((lt - 0.6 - n * 0.06) / 0.35)
                if n in keep:
                    g = ease((lt - 2.4) / 0.6); bg, fg = mix(BG, ACC, g), mix(SUB, (255, 255, 255), g)
                else: bg, fg = mix(BG, CARD, p), mix(SUB, LINE, p)
            d.rounded_rectangle((x, yy, x + cw, yy + ch), 14, fill=bg)
            d.text((x + cw / 2, yy + ch / 2), str(n), font=F_CAL, fill=fg, anchor='mm')
        y = art_top + 3 * (ch + 12) + 20
        if i == 2: d.text((110, y), '예시 — 남는 날은 사람마다 달라요', font=F_S, fill=SUB); y += 60
    else:
        for k, (big, small) in enumerate([('12월 5일 오전 9시 ~ 10시', '왜 이 시각인지 — 옛 책 세 권 근거'), ('12월 12일 오후 1시 ~ 2시', '왜 이 시각인지 — 옛 책 세 권 근거')]):
            p = ease((lt - 0.5 - k * 0.4) / 0.5)
            yy = art_top + k * 230 + int((1 - p) * 30)
            if p > 0:
                d.rounded_rectangle((110, yy, W - 110, yy + 200), 24, fill=mix(CARD, BG, p), outline=LINE, width=3)
                d.text((140, yy + 25), big, font=F_T, fill=mix(CARD, INK, p)); d.text((140, yy + 120), small, font=F_S, fill=mix(CARD, SUB, p))
        y = art_top + 480
        d.text((110, y), '보고서 예시 — 날짜는 부모님과 기간으로 계산해요', font=F_S, fill=SUB); y += 70
    y += 20
    for ln in wrap(d, s['글'], F_T, W - 220): d.text((110, y), ln, font=F_T, fill=INK); y += 84
    if i == 3 and s.get('끝줄'):
        p = ease((lt - 2.6) / 0.8)
        if p > 0:
            y += 50; d.rectangle((110, y, 120, y + 180), fill=mix(CARD, ACC, p))
            for ln in wrap(d, s['끝줄'], F_END, W - 280): d.text((145, y), ln, font=F_END, fill=mix(CARD, INK, p)); y += 92
    if i == 3:
        p = ease((lt - 4.2) / 0.6)
        if p > 0:
            d.rounded_rectangle((110, 1760, W - 110, 1860), 50, fill=mix(BG, ACC, p))
            d.text((W / 2, 1810), 'chaeksa.kr · 출산택일', font=F_TOP, fill=mix(BG, (255, 255, 255), p), anchor='mm')
    return im

DUR = [6.0, 5.0, 5.5, 7.5]
exe = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs(os.path.dirname(OUT), exist_ok=True)
p = subprocess.Popen([exe, '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
t = 0.0; n = 0
for i, dur in enumerate(DUR):
    for k in range(int(dur * FPS)):
        lt = k / FPS; p.stdin.write(frame(i, t + lt, lt).tobytes()); n += 1
    t += dur
p.stdin.close(); p.wait()
print('만듦', OUT, n, '프레임', round(n / FPS, 1), '초', os.path.getsize(OUT) // 1024, 'KB')
