"""장면그림 — 쇼츠 가운데 칸(1080x920)에 넣을 그림을 코드로 그린다(10-21 「삽화가 부족하다」 → 그림 AI 없이 되는 장면).
사이트 낮 테마(아침 한지) 색 · 본고딕 · 본명조. 함수 하나가 그림 한 장.
  카톡(대화들, 경로)            말풍선 대화
  기둥(간지 넷, 표시, 경로)      사주 네 기둥 카드(빈 칸은 「?」)
  시진판(경로)                  열두 시진 시계판
  해와시계(경로)                해 ↔ 시계
  경도(경로)                    도쿄 135° 기준선 · 서울 127°
  두시계(위말, 아래말, 경로)      시계 오후 3:00 vs 사주 시
  큰말(줄들, 경로, 작은말)        큰 글씨 한 장
"""
import math
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from 모션 import SANS, SERIF, 글꼴  # noqa: E402

W, H = 1080, 920
BG, CARD = (0xf6, 0xf3, 0xf4), (0xff, 0xfd, 0xfe)
INK, INK2, INK3 = (0x24, 0x1f, 0x33), (0x54, 0x4b, 0x60), (0x78, 0x6d, 0x84)
RED, GOLD, LINE = (0xa3, 0x23, 0x38), (0xc9, 0x9a, 0x3b), (0xe4, 0xdc, 0xe0)
KAKAO_BG, KAKAO_Y = (0xb2, 0xc7, 0xda), (0xfe, 0xe5, 0x00)
SKY, SUN = (0xdd, 0xe9, 0xf5), (0xf2, 0xa9, 0x00)


def 새판(bg=BG):
    im = Image.new('RGB', (W, H), bg)
    return im, ImageDraw.Draw(im)


def 카톡(대화들, path, 제목='병원 다녀온 날'):
    """대화들 = [(쪽 'L'|'R', 말), …]"""
    im, d = 새판(KAKAO_BG)
    d.rectangle([0, 0, W, 96], fill=(0xa9, 0xbd, 0xce))
    d.text((W / 2, 48), 제목, font=글꼴(SANS, 40, 700), fill=INK, anchor='mm')
    f = 글꼴(SANS, 46, 500)
    y = 140
    for 쪽, 말 in 대화들:
        tw = d.textlength(말, font=f)
        bw, bh = tw + 64, 96
        if 쪽 == 'R':
            x1 = W - 60 - bw
            d.rounded_rectangle([x1, y, W - 60, y + bh], radius=28, fill=KAKAO_Y)
            d.text((x1 + 32, y + bh / 2), 말, font=f, fill=INK, anchor='lm')
        else:
            d.ellipse([50, y, 130, y + 80], fill=(0xf0, 0xe6, 0xd8))
            d.text((90, y + 42), '策', font=글꼴(SERIF, 40, 800), fill=RED, anchor='mm')
            d.rounded_rectangle([150, y, 150 + bw, y + bh], radius=28, fill=(255, 255, 255))
            d.text((182, y + bh / 2), 말, font=f, fill=INK, anchor='lm')
        y += bh + 36
    im.save(path)


def 기둥(간지, 표시, path, 아래말=''):
    """간지 = ['丙午','庚子','丁巳', None] 순서 연 · 월 · 일 · 시. 표시 = 강조할 칸 번호 목록. None 이면 「?」"""
    im, d = 새판()
    이름 = ['年 · 해', '月 · 달', '日 · 날', '時 · 시']
    cw, gap = 210, 34
    x0 = (W - (cw * 4 + gap * 3)) / 2
    fh = 글꼴(SERIF, 150, 800)
    # 10-21 사장님 「사주 명식표는 시 일 월 년으로」 — 입력은 연 · 월 · 일 · 시 차례 그대로 받고, 화면은 왼쪽부터 時 · 日 · 月 · 年
    for col in range(4):
        k = 3 - col
        x = x0 + col * (cw + gap)
        강조 = k in 표시
        d.rounded_rectangle([x, 150, x + cw, 720], radius=26, fill=CARD, outline=RED if 강조 else LINE, width=8 if 강조 else 3)
        d.text((x + cw / 2, 105), 이름[k], font=글꼴(SANS, 40, 700), fill=RED if 강조 else INK2, anchor='mm')
        g = 간지[k]
        if g:
            d.text((x + cw / 2, 310), g[0], font=fh, fill=INK, anchor='mm')
            d.text((x + cw / 2, 540), g[1], font=fh, fill=INK, anchor='mm')
        else:
            d.text((x + cw / 2, 430), '?', font=글꼴(SANS, 220, 900), fill=RED, anchor='mm')
    if 아래말:
        d.text((W / 2, 810), 아래말, font=글꼴(SANS, 50, 800), fill=INK, anchor='mm')
    im.save(path)


def 시진판(path):
    im, d = 새판()
    cx, cy, r = W / 2, H / 2 + 10, 400
    지 = '子丑寅卯辰巳午未申酉戌亥'
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CARD, outline=INK, width=6)
    fz = 글꼴(SERIF, 64, 800)
    for k in range(12):
        a = math.radians(90 + k * 30)        # 子 아래(밤 12시) — 시계 방향
        a2 = math.radians(90 + k * 30 + 15)
        d.line([(cx, cy), (cx + r * math.cos(a2), cy + r * math.sin(a2))], fill=LINE, width=3)
        tx, ty = cx + (r - 70) * math.cos(a), cy + (r - 70) * math.sin(a)
        d.text((tx, ty), 지[k], font=fz, fill=RED if k % 3 == 0 else INK, anchor='mm')
    d.ellipse([cx - 150, cy - 150, cx + 150, cy + 150], fill=BG)
    d.text((cx, cy - 30), '하루', font=글꼴(SANS, 52, 700), fill=INK2, anchor='mm')
    d.text((cx, cy + 40), '열두 칸', font=글꼴(SANS, 70, 900), fill=RED, anchor='mm')
    im.save(path)


def 해와시계(path):
    im, d = 새판(SKY)
    # 해
    sx, sy = 300, 400
    for k in range(12):
        a = math.radians(k * 30)
        d.line([(sx + 150 * math.cos(a), sy + 150 * math.sin(a)), (sx + 205 * math.cos(a), sy + 205 * math.sin(a))], fill=SUN, width=14)
    d.ellipse([sx - 120, sy - 120, sx + 120, sy + 120], fill=SUN)
    d.text((sx, 700), '사주는 해를 봐요', font=글꼴(SANS, 50, 800), fill=INK, anchor='mm')
    # 시계 (X)
    cx, cy, r = 780, 400, 170
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CARD, outline=INK3, width=8)
    d.line([(cx, cy), (cx, cy - 120)], fill=INK3, width=10)
    d.line([(cx, cy), (cx + 90, cy)], fill=INK3, width=10)
    d.line([(cx - 190, cy - 190), (cx + 190, cy + 190)], fill=RED, width=16)
    d.text((cx, 700), '시계가 아니라', font=글꼴(SANS, 50, 800), fill=INK2, anchor='mm')
    im.save(path)


def 경도(path):
    im, d = 새판()
    fx = 글꼴(SANS, 44, 700)
    # 가로 = 동서. 서울 127°, 도쿄 기준선 135°
    x서울, x기준 = 330, 800
    d.line([(80, 470), (W - 80, 470)], fill=LINE, width=4)
    for x, 위, 아래, 색 in [(x서울, '서울', '동경 127°', INK), (x기준, '시계 기준선', '동경 135° (일본)', RED)]:
        d.line([(x, 170), (x, 760)], fill=색, width=8 if 색 == RED else 5)
        d.text((x, 130), 위, font=글꼴(SANS, 52, 900), fill=색, anchor='mm')
        d.text((x, 800), 아래, font=fx, fill=INK2, anchor='mm')
    # 해 움직임 화살표(동 → 서)
    d.line([(x기준 - 30, 400), (x서울 + 40, 400)], fill=SUN, width=12)
    d.polygon([(x서울 + 40, 375), (x서울 + 40, 425), (x서울, 400)], fill=SUN)
    d.ellipse([x기준 - 60, 340, x기준 + 0, 400], fill=SUN)
    d.text(((x서울 + x기준) / 2, 520), '해가 늦게 와요', font=글꼴(SANS, 56, 900), fill=INK, anchor='mm')
    d.text(((x서울 + x기준) / 2, 600), '철마다 16~46분', font=글꼴(SANS, 64, 900), fill=RED, anchor='mm')
    im.save(path)


def 두시계(위말, 아래말, path):
    im, d = 새판()
    for k, (cx, 말, 색, 시, 분) in enumerate([(290, 위말, INK, 3, 0), (790, 아래말, RED, 2, 30)]):
        cy, r = 400, 220
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CARD, outline=색, width=10)
        for h in range(12):
            a = math.radians(h * 30 - 90)
            d.line([(cx + (r - 30) * math.cos(a), cy + (r - 30) * math.sin(a)), (cx + (r - 10) * math.cos(a), cy + (r - 10) * math.sin(a))], fill=INK3, width=6)
        am = math.radians(분 * 6 - 90); ah = math.radians((시 % 12 + 분 / 60) * 30 - 90)
        d.line([(cx, cy), (cx + (r - 50) * math.cos(am), cy + (r - 50) * math.sin(am))], fill=INK, width=10)
        d.line([(cx, cy), (cx + (r - 100) * math.cos(ah), cy + (r - 100) * math.sin(ah))], fill=색, width=16)
        d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=색)
        d.text((cx, 720), 말, font=글꼴(SANS, 50, 900), fill=색, anchor='mm')
    d.text((W / 2, 400), '≠', font=글꼴(SANS, 120, 900), fill=INK2, anchor='mm')
    im.save(path)


def 큰말(줄들, path, 작은말=''):
    im, d = 새판()
    y = H / 2 - (len(줄들) - 1) * 70 - (30 if 작은말 else 0)
    for k, 줄 in enumerate(줄들):
        d.text((W / 2, y + k * 140), 줄, font=글꼴(SERIF, 104, 900), fill=RED if k == len(줄들) - 1 else INK, anchor='mm')
    if 작은말:
        d.text((W / 2, y + len(줄들) * 140 + 10), 작은말, font=글꼴(SANS, 44, 600), fill=INK2, anchor='mm')
    im.save(path)
