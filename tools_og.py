# -*- coding: utf-8 -*-
"""카카오톡·페이스북 공유 미리보기 그림(og)을 만든다.

문구만 바꾸고 그림이 옛것으로 남아 있으면 공유했을 때 서로 어긋난다.
앱 화면을 캡처하는 대신 여기서 직접 그린다 — 브라우저도, 손질도 필요 없다.

    python tools_og.py
"""
import io
import os

from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 630
APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
FONTS = r'C:\Windows\Fonts'

BG_TOP = (250, 245, 234)
BG_BOTTOM = (238, 229, 209)
INK = (60, 47, 28)
INK2 = (122, 106, 72)
SEAL = (178, 58, 42)

# 카드 세 장의 바탕색 — 실제 카드(녹패·도화첩·천직첩)에서 가져왔다
CARDS = [
    ((122, 90, 56), (93, 66, 40), (233, 200, 119), '祿'),
    ((251, 238, 241), (239, 212, 221), (142, 59, 86), '緣'),
    ((31, 75, 71), (21, 54, 52), (237, 220, 154), '職'),
]


def font(name, size):
    return __import__('PIL.ImageFont', fromlist=['ImageFont']).truetype(
        os.path.join(FONTS, name), size)


def vgrad(size, top, bottom):
    """세로 그라데이션 — 한 줄씩 칠하면 느려서 1픽셀 폭으로 만들고 늘린다."""
    w, h = size
    strip = Image.new('RGB', (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return strip.resize((w, h))


def rounded(size, radius, top, bottom):
    """모서리 둥근 그라데이션 카드."""
    img = vgrad(size, top, bottom).convert('RGBA')
    mask = Image.new('L', size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1],
                                           radius=radius, fill=255)
    img.putalpha(mask)
    return img


def build():
    base = vgrad((W, H), BG_TOP, BG_BOTTOM)

    # 아래쪽 한지 결 — 은은한 띠 하나
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(band).ellipse([-260, 470, W + 260, H + 300],
                                 fill=(230, 217, 189, 130))
    base = Image.alpha_composite(base.convert('RGBA'), band).convert('RGB')

    # 카드 셋을 부채꼴로 — 오른쪽 위에만 둔다. 아래는 글자 자리라 침범하면 안 된다.
    # 회전하면 이미지가 커지므로(expand) 중심 좌표로 붙여야 카드가 잘리지 않는다.
    # 겹치면 옆 카드가 한자를 먹는다. 폭을 줄이고 간격을 벌려 셋 다 온전히 보이게.
    cw, ch = 176, 274
    cy = 208
    spots = [(745, -9, 0), (1055, 9, 1), (900, 0, 2)]   # 가운데를 마지막에 = 맨 앞
    order = sorted(spots, key=lambda t: t[2])
    for cx, rot, idx in order:
        top, bottom, accent, ch_txt = CARDS[[745, 900, 1055].index(cx)]
        card = rounded((cw, ch), 18, top, bottom)
        d = ImageDraw.Draw(card)
        d.rounded_rectangle([8, 8, cw - 9, ch - 9], radius=12,
                            outline=accent + (150,), width=2)
        f = font('malgunbd.ttf', 38)
        d.text(((cw - d.textlength(ch_txt, font=f)) / 2, 40), ch_txt, font=f, fill=accent)
        for i in range(5):
            d.line([26, 128 + i * 21, cw - 26 - (i % 2) * 32, 128 + i * 21],
                   fill=accent + (70,), width=3)
        card = card.rotate(rot, resample=Image.BICUBIC, expand=True)
        ox, oy = cx - card.size[0] // 2, cy - card.size[1] // 2
        shadow = Image.new('RGBA', card.size, (0, 0, 0, 0))
        shadow.paste((70, 52, 28, 66), (0, 0), card.split()[3])
        shadow = shadow.filter(ImageFilter.GaussianBlur(8))
        base.paste((70, 52, 28), (ox + 3, oy + 7), shadow.split()[3])
        base.paste(card.convert('RGB'), (ox, oy), card.split()[3])

    d = ImageDraw.Draw(base)

    # 인장
    d.rounded_rectangle([78, 96, 160, 178], radius=14, fill=SEAL)
    f = font('malgunbd.ttf', 50)
    d.text((119 - d.textlength('策', font=f) / 2, 109), '策',
           font=f, fill=(253, 243, 231))

    d.text((78, 198), '책사', font=font('malgunbd.ttf', 82), fill=INK)
    d.text((78, 292), '나의 명리비서', font=font('malgun.ttf', 25), fill=INK2)

    # 아래 띠 — 카드(y 60~372) 아래라 폭을 다 써도 된다
    d.text((78, 398), '686개 유형 중 내 카드 한 장',
           font=font('malgunbd.ttf', 36), fill=(92, 66, 28))
    d.text((78, 452), '금지령 · 전생 직업 · 재물 그릇 · 공범 판결 · 인생 곡선 — 전부 무료',
           font=font('malgun.ttf', 23), fill=INK2)
    d.text((78, 516), '절기 시각까지 천문 계산한 만세력 위에서',
           font=font('malgun.ttf', 22), fill=(138, 122, 88))
    d.text((78, 556), 'chaeksa.kr', font=font('malgunbd.ttf', 25), fill=SEAL)

    out = os.path.join(APP, 'og.jpg')
    base.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB', base.size)


if __name__ == '__main__':
    build()
