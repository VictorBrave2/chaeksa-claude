# -*- coding: utf-8 -*-
"""출산택일 월별 블로그판을 데이터에서 바로 짠다.

**사람이 숫자를 옮겨 적지 않는다.** 2026-09-10 에 부모 일지 숫자를 짐작으로 적었다가
실측과 달라 고친 적이 있다. 손으로 옮기면 반드시 틀린다.

입력  _taekil.json  — 브라우저(chaeksa.kr 엔진)에서 뽑은 전수 계산
      { "2026-12": { n: 후보수, shift: 보정분, d: [[일, 요일, 일주,
                       점수12(자축인묘진사오미신유술해), 순위12], ...] } }
출력  marketing/붙여넣기-<N>월출산택일.html

병원 시간으로 자르지 않는다(2026-09-10 사장님 「병원 규칙 넣지말고 걍 모든 날 모든시간을
순위로 세우라고」). 스킬에도 「주간·야간을 함부로 자르지 말 것」이 원래 있었다.
"""
import io
import json
import os
import re

시진 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
지지 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
ROOT = os.path.dirname(os.path.abspath(__file__))


def 창(i, shift):
    """시진 i 의 시계 창. 자시(i=0)는 태양시 23~01 이다."""
    s = (23 + 2 * i) % 24 * 60 + shift
    e = (s + 120) % 1440
    return '%02d:%02d~%02d:%02d' % (s // 60 % 24, s % 60, e // 60 % 24, e % 60)


def 충날(월, 부모지지):
    """부모 일지가 t 일 때 부딪히는 날. 아이 일지 또는 그날 1위 시진의 지지가 t 면 걸린다."""
    t = (부모지지 + 6) % 12
    hit = []
    for row in 월['d']:
        d, _, 일주 = row[0], row[1], row[2]
        점 = row[3:15]
        일지 = 지지.index(일주[1])
        best = max(range(12), key=lambda i: 점[i])
        if 일지 == t or best == t:
            hit.append(d)
    return hit


def 날블록(월, row):
    d, w, 일주 = row[0], row[1], row[2]
    점, 순 = row[3:15], row[15:27]
    칸 = sorted(range(12), key=lambda i: (-점[i], 순[i]))
    줄 = ['▸ <b>%d일(%s)</b> %s' % (d, w, 일주)]
    for i in 칸:
        # 상위 10위는 줄 전체를 굵게. 안쪽에 <b> 를 또 넣으면 겹친다(2026-09-10 고침).
        본 = '%s %s · %d점 · %d위' % (시진[i], 창(i, 월['shift']), 점[i], 순[i])
        줄.append('&nbsp;&nbsp;' + ('<b>%s</b>' % 본 if 순[i] <= 10 else 본))
    return '<br>\n        '.join(줄)


def 본문(키, 월, 절기말, 특징):
    y, m =키.split('-')
    n = 월['n']
    날 = 월['d']
    # 전체 상위 열
    평 = []
    for row in 날:
        for i in range(12):
            평.append((row[15 + i], row[0], row[1], i, row[3 + i], row[2]))
    평.sort()
    top = 평[:10]
    top줄 = '<br>\n        '.join(
        '▸ <b>%d위</b> %d일(%s) %s %s · %d점' % (r, d, w, 시진[i], 창(i, 월['shift']), s)
        for r, d, w, i, s, _ in top)

    # 부모 일지별 부딪히는 날
    쌍 = sorted(((len(충날(월, b)), 지지[b], 시진[b]) for b in range(12)))
    부모줄 = '<br>\n        '.join(
        '▸ 일지가 <b>%s</b>면 — 부딪히는 날 <b>%d일</b>' % (한, c) for c, 한, _ in 쌍)

    블록 = []
    묶 = [(1, 10), (11, 20), (21, 31)]
    for a, b in 묶:
        골 = [r for r in 날 if a <= r[0] <= b]
        if not 골:
            continue
        블록.append('<h3>%s월 %d일 ~ %d일</h3>\n\n    <blockquote>\n      <p>%s</p>\n    </blockquote>'
                    % (m, a, min(b, 골[-1][0]),
                       '<br>\n        '.join(날블록(월, r) for r in 골)))

    return (본문틀
            .replace('{{Y}}', y).replace('{{M}}', m).replace('{{N}}', str(n))
            .replace('{{DAYS}}', str(len(날)))
            .replace('{{SHIFT}}', str(월['shift']))
            .replace('{{TOP}}', top줄)
            .replace('{{PARENT}}', 부모줄)
            .replace('{{MINP}}', 쌍[0][1]).replace('{{MINC}}', str(쌍[0][0]))
            .replace('{{MAXP}}', 쌍[-1][1]).replace('{{MAXC}}', str(쌍[-1][0]))
            .replace('{{BLOCKS}}', '\n\n    <hr>\n\n    '.join(블록))
            .replace('{{JEOLGI}}', 절기말)
            .replace('{{FEATURE}}', 특징))


본문틀 = ''  # 아래 main 에서 채운다


def main():
    global 본문틀
    with io.open(os.path.join(ROOT, '.taekil', '_tpl_taekil.html'), encoding='utf-8') as f:
        머리, 본문틀, 꼬리 = f.read().split('<!--SPLIT-->')
    with io.open(os.path.join(ROOT, '.taekil', '_taekil.json'), encoding='utf-8') as f:
        데이터 = json.load(f)
    with io.open(os.path.join(ROOT, '.taekil', '_taekil_notes.json'), encoding='utf-8') as f:
        메모 = json.load(f)

    for 키, 월 in sorted(데이터.items()):
        y, m = 키.split('-')
        n = 메모.get(키, {})
        b = 본문(키, 월, n.get('절기', ''), n.get('특징', ''))
        h = 머리.replace('{{Y}}', y).replace('{{M}}', m)
        out = os.path.join(ROOT, 'marketing', '붙여넣기-%s월출산택일.html' % m)
        with io.open(out, 'w', encoding='utf-8', newline='\r\n') as f:
            f.write((h + b + 꼬리).replace('\r\n', '\n'))
        print('  + %s월  %d칸 · %d일 · 보정 %d분' % (m, 월['n'], len(월['d']), 월['shift']))


if __name__ == '__main__':
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    main()
