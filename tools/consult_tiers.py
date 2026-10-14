# -*- coding: utf-8 -*-
"""출산택일 상담 — 기간 전체를 세 단계로 거른다(10-14 사장님 「명심해 · 이 방식을 상담 스킬에 저장해」).
  1단계 사주 자체   = 궁통보감 · 자평진전 걸림 없음(덤프 rows[].없음)
  2단계 + 대운     = 50살 전에 오는 대운에 원국과 충 없음(덤프 대운 줄의 「부딪」). 합은 거르지 않는다(법전: 묶이거나 합생할 수 있음)
  3단계 자미두수   = 순위에 쓰지 않는다(10-14 사장님 「첫째는 사주 먼저 · 자미두수는 꼬리표」 → 「반김 걱정으로 가」). 걸린 구절에 센 말이 있으면 반김 · 걱정만 단다 — tools/consult_ziwei_lines.js
  귀인 · 신살도 꼬리표만(10-14 사장님 「순위 필터엔 넣지 말고 신살도 넣어 봐」) — tools/consult_sinsal.js
  부모님 일지는 넣지 않는다(10-14 사장님). 주말 · 병원 시간만 세 단계 밖에서 마지막에 댄다.
  python tools/consult_tiers.py <덤프 consult.json> <곳 KR:서울> <M|F>
  덤프는 택일상담 스킬 「4. 기간 덤프」 그대로(대운 줄이 있어야 한다).
"""
import json, sys, os, subprocess, tempfile, argparse
sys.stdout.reconfigure(encoding='utf-8')
ap = argparse.ArgumentParser(); ap.add_argument('dump'); ap.add_argument('place'); ap.add_argument('g'); a = ap.parse_args()
c = json.load(open(a.dump, encoding='utf-8'))
전체, t1, t2 = 0, 0, []
for d in c['days']:
    for r in d['rows']:
        전체 += 1
        if not r.get('없음'):
            continue
        t1 += 1
        충 = [x['시작나이'] for x in r.get('대운', []) if x['시작나이'] < 50 and any('부딪' in z for z in x['줄'])]
        if 충:
            continue
        mid = (r['시작'] + r['끝']) // 2
        t2.append({'시각': f"{d['y']}-{d['m']:02d}-{d['d']:02d}T{mid // 60:02d}:{mid % 60:02d}", '요일': d['요일'], '시진': r['시진'], '창': r['창'], '일주': r['일주'], '시주': r['시주']})
print(f'전체 {전체} → 1단계 사주 자체 {t1} → 2단계 대운 {len(t2)}')
here = os.path.dirname(os.path.abspath(__file__))
tmp = os.path.join(tempfile.gettempdir(), 'consult_tiers_ziwei.json')
subprocess.run(['node', os.path.join(here, 'consult_ziwei_lines.js'), tmp, a.place, a.g] + [x['시각'] for x in t2], check=True, stdout=subprocess.DEVNULL)
z = {x['시각']: x for x in json.load(open(tmp, encoding='utf-8'))}
tmp2 = os.path.join(tempfile.gettempdir(), 'consult_tiers_sinsal.json')
subprocess.run(['node', os.path.join(here, 'consult_sinsal.js'), tmp2, a.place, a.g] + [x['시각'] for x in t2], check=True, stdout=subprocess.DEVNULL)
ss = {x['시각']: x for x in json.load(open(tmp2, encoding='utf-8'))}
print('2단계까지 남은 곳(날짜순) — 자미두수 · 신살은 꼬리표만')
for i, x in enumerate(t2, 1):
    q = z[x['시각']]
    표 = ' · '.join(t for t in [('반김 ' + str(len(q['반김']))) if q['반김'] else '', ('걱정 ' + str(len(q['걱정']))) if q['걱정'] else ''] if t) or '꼬리표 없음'
    k = ss[x['시각']]
    print(f"  {i}. {x['시각'][5:10]}({x['요일']}) {x['시진']} {x['창']} · 일주 {x['일주']} · 명궁 {q['명궁']} · {표} · 귀인 {' · '.join(k['귀인']) or '없음'} · 신살 {' · '.join(k['신살']) or '없음'}")
