"""모션그래픽 — 독백 녹음 + 받아쓴 낱말 시각 → 유튜브 mp4(10-21 사장님 「음향과 합쳐 모션그래픽을 네가 만들어」).

쓰는 법:
  python 모션.py <녹음> <words.json> <나갈.mp4> [--ratio 9x16|16x9] [--title "제목"] [--bgm 음악파일] [--end "chaeksa.kr"]

화면(사이트 밤 테마 「새벽 인디고」 색 그대로):
  · 위 — 策 도장 + 책사 · 제목
  · 가운데 위 — 핵심 낱말(명리 낱말 · 숫자)이 말해지는 순간 크게 떠오른다
  · 가운데 아래 — 지금 말하는 줄. 말한 낱말은 밝게, 지금 낱말은 금색, 아직은 흐리게
  · 맨 아래 — 금색 진행 막대
  · 끝 — 2.5초 끝 화면(사이트 주소)
소리: 낮은 웅웅 거르기 · 잡음 줄이기 · 유튜브 크기(-14 LUFS). 음악은 --bgm 을 주면 목소리 밑에 작게.
Pillow 로 한 장씩 그려 ffmpeg 로 넘긴다. 이 컴퓨터 안에서만 돈다.
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

FFMPEG = shutil.which('ffmpeg') or os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')
FONT_DIR = r'C:\Windows\Fonts'
SANS = os.path.join(FONT_DIR, 'NotoSansKR-VF.ttf')
SERIF = os.path.join(FONT_DIR, 'NotoSerifKR-VF.ttf')

# 사이트 밤 테마(app/style.css)
BG, BG2 = (0x16, 0x14, 0x33), (0x22, 0x1f, 0x45)
INK, INK2, INK3 = (0xee, 0xea, 0xf7), (0xb6, 0xae, 0xd4), (0x8f, 0x87, 0xb3)
GOLD, GOLD2 = (0xe6, 0xc9, 0x8a), (0xbb, 0x94, 0x45)
FPS = 30

핵심말 = ['사주팔자', '사주', '명리학', '명리', '자미두수', '출산택일', '택일', '제왕절개', '궁통보감', '자평진전', '적천수', '진태양시',
         '절기', '입춘', '천간', '지지', '일간', '십성', '정관', '편관', '정인', '편인', '정재', '편재', '식신', '상관', '비견', '겁재',
         '대운', '세운', '용신', '격국', '운명', '진리', '의식', '관측', '기둥', '네 기둥', '팔자']


def 글꼴(path, size, 굵기=None):
    f = ImageFont.truetype(path, size)
    if 굵기:
        try:
            f.set_variation_by_axes([굵기])
        except Exception:
            pass
    return f


def 쉬움(x):  # 0→1 부드럽게
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def 핵심인가(w):
    bare = re.sub(r'[^\w가-힣]', '', w)
    if re.search(r'\d', bare):
        return True
    return any(bare.startswith(k) for k in 핵심말 if len(k) >= 2)


def 줄나누기(segments, 최대):
    """낱말을 화면 한 줄씩 묶는다 — 글자 수가 넘거나 문장이 끝나면 새 줄."""
    줄들, 지금 = [], []
    for seg in segments:
        for w in seg['words']:
            if not w['w']:
                continue
            길이 = sum(len(x['w']) + 1 for x in 지금) + len(w['w'])
            if 지금 and 길이 > 최대:
                줄들.append(지금)
                지금 = []
            지금.append(w)
            if re.search(r'[.?!。]$', w['w']):
                줄들.append(지금)
                지금 = []
        if 지금:
            줄들.append(지금)
            지금 = []
    return 줄들


def 소리만들기(src, bgm, 길이, 끝, out, 속도=1.0):
    # 10-21 사장님 「마이크가 너무 정적」 · 「잡음 줄이기를 안 하니 오히려 듣기 좋다」 — 잡음 줄이기 뺌(무선 마이크가 깨끗하다), 또렷함(3.5kHz +3dB) · 눌러 꽉 채우기(압축) · 빠르기(atempo, 높낮이 그대로)
    목 = ((f'atempo={속도},' if abs(속도 - 1) > 1e-3 else '') +
         'highpass=f=80,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=200:t=q:w=1:g=1.5,'
         'acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=7')
    if bgm:
        f = (f'[0:a]{목},apad=pad_dur={끝}[v];'
             f'[1:a]aloop=loop=-1:size=2e9,atrim=0:{길이 + 끝},volume=0.10,afade=t=out:st={길이 + 끝 - 2}:d=2[m];'
             f'[v][m]amix=inputs=2:duration=first:normalize=0[a]')
        cmd = [FFMPEG, '-nostdin', '-loglevel', 'error', '-y', '-i', src, '-i', bgm, '-filter_complex', f, '-map', '[a]', '-ar', '48000', out]
    else:
        cmd = [FFMPEG, '-nostdin', '-loglevel', 'error', '-y', '-i', src, '-af', 목 + f',apad=pad_dur={끝}', '-ar', '48000', out]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio'); ap.add_argument('words'); ap.add_argument('out')
    ap.add_argument('--ratio', default='9x16'); ap.add_argument('--title', default='')
    ap.add_argument('--bgm', default=''); ap.add_argument('--end', default='chaeksa.kr')
    ap.add_argument('--keys', default='', help='이 영상만의 핵심 낱말, 쉼표로(예: 생각,무엇을,집중)')
    a = ap.parse_args()
    핵심말.extend(k.strip() for k in a.keys.split(',') if k.strip())

    W, H = (1080, 1920) if a.ratio == '9x16' else (1920, 1080)
    세로 = H > W
    data = json.load(open(a.words, encoding='utf-8'))
    segs = data['segments']
    길이 = float(data.get('length') or (segs[-1]['e'] if segs else 1))
    끝 = 2.5
    전체 = 길이 + 끝
    줄들 = 줄나누기(segs, 14 if 세로 else 22)
    낱말들 = [w for 줄 in 줄들 for w in 줄]
    핵심들 = [w for w in 낱말들 if 핵심인가(w['w'])]

    f줄 = 글꼴(SANS, 66 if 세로 else 60, 700)
    f핵심 = 글꼴(SERIF, 150 if 세로 else 130, 800)
    f제목 = 글꼴(SANS, 44 if 세로 else 40, 600)
    f도장 = 글꼴(SERIF, 64, 800)
    f이름 = 글꼴(SANS, 40, 700)
    f끝 = 글꼴(SERIF, 96 if 세로 else 88, 800)
    f끝작 = 글꼴(SANS, 38, 500)

    # 바탕 한 장(그라데이션)은 미리 그려 둔다
    바탕 = Image.new('RGB', (W, H), BG)
    d0 = ImageDraw.Draw(바탕)
    for y in range(H):
        r = y / H
        d0.line([(0, y), (W, y)], fill=tuple(int(BG[i] + (BG2[i] - BG[i]) * r) for i in range(3)))

    tmp = tempfile.mkdtemp(prefix='motion-')
    소리 = os.path.join(tmp, 'a.wav')
    소리만들기(a.audio, a.bgm, 길이, 끝, 소리)

    enc = subprocess.Popen([FFMPEG, '-nostdin', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-i', 소리, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', a.out],
                           stdin=subprocess.PIPE)
    n = int(math.ceil(전체 * FPS))
    for i in range(n):
        t = i / FPS
        im = 바탕.copy()
        d = ImageDraw.Draw(im, 'RGBA')

        # 천천히 떠도는 금빛 원 — 화면이 멈춰 보이지 않게
        cx = W * (0.5 + 0.28 * math.sin(t * 0.21)); cy = H * (0.42 + 0.12 * math.cos(t * 0.17)); rr = W * 0.55
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=GOLD + (10,))

        # 위 — 도장 + 이름 + 제목
        x0, y0 = (60, 90) if 세로 else (70, 60)
        d.rounded_rectangle([x0, y0, x0 + 96, y0 + 96], radius=18, fill=GOLD)
        d.text((x0 + 48, y0 + 50), '策', font=f도장, fill=BG, anchor='mm')
        d.text((x0 + 120, y0 + 48), '책사', font=f이름, fill=INK, anchor='lm')
        if a.title:
            d.text((x0, y0 + 140), a.title, font=f제목, fill=INK2)

        if t < 길이:
            # 핵심 낱말 — 말한 순간부터 2.5초(다음 핵심 낱말이 오면 바뀜)
            지금핵심 = None
            for w in 핵심들:
                if w['s'] <= t:
                    지금핵심 = w
            if 지금핵심 and t - 지금핵심['s'] < 2.5:
                k = 쉬움((t - 지금핵심['s']) / 0.3)
                사라짐 = 1 - 쉬움((t - 지금핵심['s'] - 2.1) / 0.4)
                알파 = int(255 * k * 사라짐)
                글 = re.sub(r'[,.?!]', '', 지금핵심['w'])
                크기 = int(f핵심.size * (0.85 + 0.15 * k))
                fk = 글꼴(SERIF, 크기, 800)
                ky = H * (0.36 if 세로 else 0.36) + (1 - k) * 40
                d.text((W / 2, ky), 글, font=fk, fill=GOLD + (알파,), anchor='mm')
                bw = d.textlength(글, font=fk)
                d.line([(W / 2 - bw / 2, ky + 크기 * 0.62), (W / 2 - bw / 2 + bw * k, ky + 크기 * 0.62)], fill=GOLD2 + (알파,), width=6)

            # 지금 말하는 줄
            줄 = None
            for z in 줄들:
                if z[0]['s'] <= t + 0.15:
                    줄 = z
            if 줄 and t <= 줄[-1]['e'] + 1.2:
                들어옴 = 쉬움((t - 줄[0]['s'] + 0.15) / 0.25)
                조각 = [(w, d.textlength(w['w'], font=f줄)) for w in 줄]
                사이 = d.textlength(' ', font=f줄)
                폭 = sum(x[1] for x in 조각) + 사이 * (len(조각) - 1)
                x = W / 2 - 폭 / 2
                y = H * (0.62 if 세로 else 0.66) + (1 - 들어옴) * 30
                지금말 = None   # 금색은 한 낱말만 — 말이 겹쳐 둘이 금색이 되던 것(10-21 시험)
                for w, _ in 조각:
                    if w['s'] <= t:
                        지금말 = w
                if 지금말 is not None and t > 지금말['e'] + 0.3:
                    지금말 = None
                for w, ww in 조각:
                    if w is 지금말:
                        색 = GOLD + (255,)
                    elif w['e'] < t:
                        색 = INK + (int(255 * 들어옴),)
                    else:
                        색 = INK3 + (int(110 * 들어옴),)
                    d.text((x, y), w['w'], font=f줄, fill=색, anchor='lm')
                    x += ww + 사이
        else:
            # 끝 화면
            k = 쉬움((t - 길이) / 0.5)
            d.text((W / 2, H * 0.46), a.end, font=f끝, fill=GOLD + (int(255 * k),), anchor='mm')
            d.text((W / 2, H * 0.46 + 110), '사주 공부, 제가 대신 했습니다', font=f끝작, fill=INK2 + (int(255 * k),), anchor='mm')

        # 진행 막대
        by = H - (70 if 세로 else 40)
        d.rounded_rectangle([60, by, W - 60, by + 8], radius=4, fill=INK3 + (60,))
        d.rounded_rectangle([60, by, 60 + (W - 120) * min(1, t / 전체), by + 8], radius=4, fill=GOLD)

        enc.stdin.write(im.tobytes())
    enc.stdin.close()
    enc.wait()
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'만듦: {a.out} · {W}x{H} · {전체:.1f}초 · 줄 {len(줄들)} · 핵심 낱말 {len(핵심들)}')


if __name__ == '__main__':
    main()
