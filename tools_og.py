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


def icons():
    """앱 아이콘 — 탭·홈화면·공유 그림이 같은 얼굴이어야 한다.
    원래는 금색 도넛(자리 표시)이라 브랜드와 따로 놀았다."""
    for size in (192, 512):
        pad = round(size * 0.10)
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([0, 0, size - 1, size - 1],
                            radius=round(size * 0.22), fill=SEAL)
        f = font('malgunbd.ttf', round(size * 0.62))
        w = d.textlength('策', font=f)
        # 글자 높이를 실측해 가운데에 앉힌다
        box = d.textbbox((0, 0), '策', font=f)
        d.text(((size - w) / 2, (size - (box[3] - box[1])) / 2 - box[1]),
               '策', font=f, fill=(253, 243, 231))
        out = os.path.join(APP, 'icon-%d.png' % size)
        img.save(out, 'PNG', optimize=True)
        print('wrote', out, os.path.getsize(out) // 1024, 'KB', img.size)
        if size == 512:
            # 브라우저는 <link rel="icon">이 있어도 /favicon.ico를 직접 찾을 때가 있다.
            # 파일이 없으면 방문자마다 콘솔에 404가 남는다. 실물을 둔다.
            ico = os.path.join(APP, 'favicon.ico')
            img.convert('RGB').save(ico, 'ICO',
                                    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
            print('wrote', ico, os.path.getsize(ico) // 1024, 'KB')


def kakao():
    """카카오톡 채널 프로필 사진 — 640×640.

    채팅 목록에서는 지름 40px 원으로 잘린다. 그래서 두 가지가 정해진다.
      · 모서리는 안 보인다 → 중요한 건 내접원 안에 둔다
      · 40px에서 글자는 안 읽힌다 → 채널명은 옆에 뜨니 인장 하나만 남긴다
    앱 아이콘·og 그림과 같은 얼굴이어야 한다. 색과 글자를 그대로 쓴다.
    """
    S = 640
    img = Image.new('RGB', (S, S), SEAL)

    # 왼쪽 위에서 들어오는 빛 — 평면으로 두면 인쇄물처럼 죽는다
    glow = Image.new('L', (S, S), 0)
    ImageDraw.Draw(glow).ellipse([-S // 3, -S // 2, S, S // 2 + 60], fill=64)
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    img = Image.composite(Image.new('RGB', (S, S), (214, 96, 66)), img, glow)

    d = ImageDraw.Draw(img)

    # 테두리는 원이어야 한다. 사각 테두리를 두면 네 모서리가 크롭에 잘려
    # 선 네 토막으로 남는다 — 실제로 그렇게 나와서 원으로 바꿨다.
    d.ellipse([48, 48, S - 49, S - 49], outline=(253, 243, 231), width=5)

    f = font('malgunbd.ttf', 300)
    box = d.textbbox((0, 0), '策', font=f)
    d.text(((S - (box[2] - box[0])) / 2 - box[0],
            (S - (box[3] - box[1])) / 2 - box[1]),
           '策', font=f, fill=(253, 243, 231))

    out = os.path.join(os.path.dirname(APP), 'marketing', '카카오-프로필.png')
    img.save(out, 'PNG', optimize=True)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB', img.size)

    # 잘렸을 때를 미리 본다. 올리고 나서 "글자가 잘렸네"를 하지 않으려고 둔다.
    prev = img.copy()
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, S - 1, S - 1], fill=255)
    circ = Image.new('RGB', (S, S), (245, 245, 245))
    circ.paste(prev, (0, 0), mask)
    out2 = os.path.join(os.path.dirname(APP), 'marketing', '카카오-프로필-원형확인.png')
    circ.save(out2, 'PNG', optimize=True)
    print('wrote', out2, os.path.getsize(out2) // 1024, 'KB')


def blog_title():
    """네이버 블로그 타이틀(대문) — 966×280.

    네이버 블로그 본문 폭이 966px이라 그보다 좁으면 좌우가 뜨고 넓으면 잘린다.
    글자를 그림에 구워 넣고 '블로그 제목 표시'는 꺼야 한다 — 안 그러면
    스킨 글꼴로 쓴 제목이 그림 위에 한 번 더 얹힌다.
    """
    # 높이는 220. 처음 280으로 뽑았더니 글자 아래로 100px 가까이 비어
    # 첫 화면에서 본문이 밀렸다. 대문은 인상만 남기고 빨리 비켜야 한다.
    W, H = 966, 220
    base = vgrad((W, H), BG_TOP, BG_BOTTOM)

    # 아래쪽 한지 결 — og 그림과 같은 손짓이어야 한 사람이 만든 것으로 보인다
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(band).ellipse([-200, 150, W + 200, H + 130],
                                 fill=(230, 217, 189, 120))
    base = Image.alpha_composite(base.convert('RGBA'), band).convert('RGB')
    d = ImageDraw.Draw(base)

    # 인장
    d.rounded_rectangle([64, 62, 156, 154], radius=16, fill=SEAL)
    f = font('malgunbd.ttf', 56)
    d.text((110 - d.textlength('策', font=f) / 2, 76), '策',
           font=f, fill=(253, 243, 231))

    d.text((186, 66), '책사', font=font('malgunbd.ttf', 62), fill=INK)
    d.text((188, 138), '나의 명리비서 · chaeksa.kr',
           font=font('malgun.ttf', 20), fill=INK2)

    # 오른쪽 한 줄 — 무엇을 파는 블로그인지 여기서 끝낸다
    f2 = font('malgun.ttf', 19)
    lines = ['절기 시각까지 천문 계산한 만세력 위에서', '기준을 공개하고 봅니다']
    widest = max(d.textlength(t, font=f2) for t in lines)
    for i, t in enumerate(lines):
        w = d.textlength(t, font=f2)
        d.text((W - 70 - w, 86 + i * 32), t, font=f2, fill=(138, 122, 88))
    # 구분선은 글 덩어리 왼쪽에 세운다. 오른쪽에 두면 글이 잘린 것처럼 보인다.
    x = W - 70 - widest - 30
    d.line([x, 82, x, 146], fill=(205, 190, 160), width=2)

    out = os.path.join(os.path.dirname(APP), 'marketing', '블로그-대문.png')
    base.save(out, 'PNG', optimize=True)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB', base.size)


if __name__ == '__main__':
    import sys
    if '--kakao' in sys.argv:
        kakao()
    elif '--blog' in sys.argv:
        blog_title()
    else:
        build()
        icons()
        kakao()
        blog_title()
