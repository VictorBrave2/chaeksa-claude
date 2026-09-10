# -*- coding: utf-8 -*-
"""채록한 원문 취용 구절을 **엔진의 120칸 표와 맞대본다.**

원문을 옮겨 적는 일은 이 집에서 가장 지어내기 쉬운 자리다. 그래서 관문을 둔다.

  구절 안에 그 칸의 **주용신 글자가 들어 있어야 한다.**

이건 약한 검사가 아니다 — 채록기가 엉뚱한 절을 집으면 거의 반드시 걸린다.
실제로 첫 채록에서 辛金 열두 달 중 아홉이 癸水 절의 문장이었고, 이 검사가 다 잡았다.

통과 못 한 칸은 **지어내지 않는다.** 「못 찾음」으로 두고 다시 떠 온다.
"""
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
간 = '甲乙丙丁戊己庚辛壬癸'
달지지 = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
달이름 = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']


def 조후표():
    """docs/12 의 120칸. 이것이 대조 기준이다(app/classic.js 에서 자동 생성된 것)."""
    지지 = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
    표 = {}
    p = os.path.join(ROOT, 'docs', '12_조후용신표.md')
    for 줄 in io.open(p, encoding='utf-8').read().replace('\r\n', '\n').split('\n'):
        m = re.match(r'^\|\s*\*\*([甲乙丙丁戊己庚辛壬癸])\*\*\s*\|(.+)$', 줄.strip())
        if not m:
            continue
        칸 = [c.strip() for c in m.group(2).split('|')]
        for i, c in enumerate(칸[:12]):
            g = re.match(r'\*\*(.)\*\*\s*(?:\(([^)]*)\))?', c)
            if g:
                표[m.group(1) + 지지[i]] = (g.group(1), g.group(2) or '')
    return 표


def main():
    표 = 조후표()
    raw = json.load(io.open(os.path.join(ROOT, '.taekil', '_wonmun_raw.json'),
                            encoding='utf-8'))
    통과, 실패 = {}, []
    for s in 간:
        구절들 = raw.get(s, [])
        for i, 구 in enumerate(구절들):
            키 = s + 달지지[i]
            need, aux = 표[키]
            if not 구 or 구 == 'NOTFOUND':
                실패.append((키, s, 달이름[i], need, aux, '', '구절 없음'))
                continue
            if need not in 구:
                실패.append((키, s, 달이름[i], need, aux, 구, '주용신 %s 가 구절에 없다' % need))
                continue
            # 더 날카로운 검사 — 구절에 **처음 나오는 천간**이 표의 주용신과 같아야 한다.
            # 「주용신 글자가 들어 있나」만 보면 「先丙後癸」가 癸 칸을 통과해 버린다.
            # 채록기가 옆 절을 집어 오면 대개 순서가 어긋나므로 여기서 걸린다.
            첫 = next((c for c in 구 if c in 간), '')
            if 첫 != need:
                실패.append((키, s, 달이름[i], need, aux, 구,
                            '구절이 먼저 부르는 글자가 %s 라 표(%s)와 다르다' % (첫 or '없음', need)))
                continue
            통과[키] = 구

    # 같은 구절이 다른 칸에 두 번 나오면 채록기가 옆 절을 집어 온 것이다.
    # 실제로 辛金 여덟 칸이 癸水 문장이었고, 그때도 이 꼴이었다.
    # 다만 원문이 정말 같은 문장을 쓰는 칸이 있다(丁亥·丁子 「丁先庚後」).
    # 그래서 지우지 않고 **표시만** 한다 — 사람이 보고 정한다.
    from collections import Counter
    셈 = Counter(통과.values())
    겹 = {k: v for k, v in 통과.items() if 셈[v] > 1}
    io.open(os.path.join(ROOT, '.taekil', '_wonmun_ok.json'), 'w',
            encoding='utf-8', newline='\n').write(
        json.dumps(통과, ensure_ascii=False, indent=1, sort_keys=True))

    # 채록 기록을 문서로 남긴다. 출처와 못 채운 칸을 함께 적어야 기록이다.
    줄 = ['# 궁통보감 취용 구절 채록 (2026-09-10)', '',
          '출처: <https://zh.wikisource.org/zh-hant/窮通寶鑑> (欄江網).',
          '`WebFetch` 로 십간 열 절을 각각 떠서 월별 취용 구절만 뽑았다.', '',
          '**세 관문을 다 지난 칸만 싣는다**(`tools_wonmun_check.py`).', '',
          '1. 그 칸의 주용신 글자가 구절 안에 있는가',
          '2. 구절이 **먼저 부르는 천간**이 표의 주용신과 같은가',
          '3. 다른 칸과 구절이 겹치지 않는가 (겹치면 표시만 하고 사람이 본다)', '',
          '2번이 없으면 「先丙後癸」가 癸 칸을 통과해 버린다.',
          '실제로 1차 채록에서 辛金 여덟 칸이 통째로 癸水 절의 문장이었고,',
          '1번만으로는 그중 여럿이 그냥 지나갔다.', '',
          '**못 채운 칸은 지어내지 않고 비워둔다.** 세 번 떠서 안 잡힌 것들이다.', '',
          '| 채운 칸 | 못 채운 칸 | 겹치는 칸(눈으로 볼 것) |', '|---|---|---|',
          '| %d | %d | %d |' % (len(통과), len(실패), len(겹)), '',
          '## 채운 칸', '', '| 칸 | 표 | 원문 구절 |', '|---|---|---|']
    for k in sorted(통과):
        need, aux = 표[k]
        줄.append('| %s | %s(%s) | %s |' % (k, need, aux, 통과[k]))
    줄 += ['', '## 못 채운 칸 — 원문 구절 미확정', '', '| 칸 | 표 | 받은 것 | 왜 물렸나 |', '|---|---|---|---|']
    for 키, st, m, need, aux, 구, 왜 in 실패:
        줄.append('| %s | %s(%s) | %s | %s |' % (키, need, aux, 구 or '—', 왜))
    if 겹:
        줄 += ['', '## 구절이 겹치는 칸', '',
               '원문이 정말 같은 문장을 쓰는 칸도 있다. 지우지 않고 표시만 한다.', '',
               '| 칸 | 구절 |', '|---|---|']
        for k in sorted(겹):
            줄.append('| %s | %s |' % (k, 겹[k]))
    io.open(os.path.join(ROOT, 'docs', '35_취용구절_채록.md'), 'w',
            encoding='utf-8', newline='\n').write('\n'.join(줄) + '\n')

    print('통과 %d칸 / 120칸 · 다시 떠야 할 칸 %d · 구절이 겹치는 칸 %d'
          % (len(통과), len(실패), len(겹)))
    print('  + docs/35_취용구절_채록.md')
    print()
    for 키, s, m, need, aux, 구, 왜 in 실패:
        print('X  %s (%s일 %s월)  표=%s(%s)' % (키, s, m, need, aux))
        print('     받은 것: %s' % (구 or '(없음)'))
        print('     %s' % 왜)
    if 겹:
        print()
        for k in sorted(겹):
            print('?  %s  구절이 다른 칸과 겹친다 — %s' % (k, 겹[k]))
    return 1 if 실패 else 0


if __name__ == '__main__':
    sys.exit(main())
