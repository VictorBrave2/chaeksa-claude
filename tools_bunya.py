# -*- coding: utf-8 -*-
"""홈 분야 표(app/bunya.js)를 읽어 수를 세고, 근거 상태를 계산하고, 설계(docs/100)와 대조한다.

  표는 bunya.js 의 「표 시작」 표시와 「표 끝」 표시 사이 JSON 한 덩어리다(설계 docs/100 전략 가).
  근거 상태(● ◐ ○)는 표에 적지 않고 여기서 계산한다(전략 나):
    ● = 조문이 「조문」 또는 「원문」이고, 물음 · 하위에 답하는 칸이 하나 이상(열린 콘텐츠의 열린 칸만 센다)
    ◐ = 조문은 있는데 답하는 칸이 없다
    ○ = 조문이 「없음」
  칸이 닿는 분야도 표에 적지 않고 분야 표를 거꾸로 읽어 계산한다(전략 라).

사용:  python tools_bunya.py
  수 · 근거 상태 · 설계와 다른 곳을 낸다. 수 · 근거 상태 · 격결론 · 닿는 분야가 설계와 다르면 끝 코드 1.
  글(분야 이름 · 물음 글)이 설계와 다른 것은 확인만 낸다 — 작가가 다듬으면 달라지는 것이 정상이다.
  빈칸을 채우거나 줄을 더하면 수가 설계와 달라지는 것도 정상이다 — 그때 설계 문서(1 · 3절 표와 수)를 같이 고쳐 쓴다.

만들어 내기(아래 make_* 함수)는 연결 단계에서 채운다. 지금은 이름만 있다.
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
APP = os.path.join(ROOT, 'app')
TABLE = os.path.join(APP, 'bunya.js')
DOC = os.path.join(ROOT, 'docs', '100_홈_분야_설계.md')
START, END = '/*표 시작*/', '/*표 끝*/'


def read(path):
    return io.open(path, encoding='utf-8').read().replace('\r\n', '\n')


def load_table(path=TABLE):
    src = read(path)
    a, b = src.find(START), src.find(END)
    if a < 0 or b < 0 or b < a:
        raise SystemExit('bunya.js 에서 표 시작 · 표 끝 표시를 못 찾았다')
    return json.loads(src[a + len(START):b])


# ── 계산 ─────────────────────────────────────────────────────────────

def open_cells(T):
    """열린 콘텐츠의 열린 목차 칸 id 집합."""
    열린콘텐츠 = {c['키'] for c in T['콘텐츠'] if c.get('상태') == '열림'}
    return {r['칸'] for r in T['목차'] if r.get('상태') == '열림' and r['콘텐츠'] in 열린콘텐츠}


def q_kind(q):
    """물음 하나의 갈래: 답 · 곁 · 방향 · 빈칸."""
    if q.get('방향'):
        return '방향'
    if q.get('칸'):
        return '답'
    if q.get('곁'):
        return '곁'
    return '빈칸'


def field_stats(T):
    """분야마다 {상태, 물음답, 물음수, 하위답, 하위수, 격만}."""
    열림 = open_cells(T)
    격 = {r['칸'] for r in T['목차'] if r.get('격결론')}
    out = {}
    for f in T['분야']:
        qa = sum(1 for q in f['물음'] if any(k in 열림 for k in q.get('칸', [])))
        ha = sum(1 for h in f['하위'] if any(k in 열림 for k in h.get('칸', [])))
        답칸 = {k for q in f['물음'] for k in q.get('칸', []) if k in 열림} | {k for h in f['하위'] for k in h.get('칸', []) if k in 열림}
        if f['조문'] == '없음':
            st = '○'
        elif 답칸:
            st = '●'
        else:
            st = '◐'
        out[f['키']] = {'상태': st, '물음답': qa, '물음수': len(f['물음']), '하위답': ha, '하위수': len(f['하위']),
                       '격만': bool(답칸) and 답칸 <= 격}
    return out


def reach(T):
    """칸 id → {'답': [분야키], '곁': [분야키]} — 분야 표를 거꾸로 읽는다. 답으로 걸린 분야는 곁에서 뺀다."""
    답, 곁 = {}, {}
    for f in T['분야']:
        k = f['키']
        for q in f['물음']:
            for c in q.get('칸', []):
                답.setdefault(c, set()).add(k)
            for c in q.get('곁', []):
                곁.setdefault(c, set()).add(k)
        for h in f['하위']:
            for c in h.get('칸', []):
                답.setdefault(c, set()).add(k)
            for c in h.get('곁', []):
                곁.setdefault(c, set()).add(k)
        for c in f.get('곁', []):
            곁.setdefault(c, set()).add(k)
    out = {}
    for c in set(답) | set(곁):
        a = 답.get(c, set())
        out[c] = {'답': sorted(a), '곁': sorted(곁.get(c, set()) - a)}
    return out


def counts(T):
    qs = [q for f in T['분야'] for q in f['물음']]
    kinds = {}
    for q in qs:
        kinds[q_kind(q)] = kinds.get(q_kind(q), 0) + 1
    hs = [h for f in T['분야'] for h in f['하위']]
    st = field_stats(T)
    by = {'●': 0, '◐': 0, '○': 0}
    for v in st.values():
        by[v['상태']] += 1
    return {
        '큰 분야': len(T['큰분야']), '작은 분야': len(T['분야']), '물음': len(qs),
        '물음 답': kinds.get('답', 0), '물음 곁만': kinds.get('곁', 0), '물음 방향': kinds.get('방향', 0), '물음 빈칸': kinds.get('빈칸', 0),
        '하위': len(hs), '하위 답': sum(v['하위답'] for v in st.values()),
        '●': by['●'], '◐': by['◐'], '○': by['○'], '답 0 작은 분야': by['◐'] + by['○'],
        '콘텐츠': len(T['콘텐츠']), '목차 칸': len(T['목차']),
    }


# ── 설계 문서 읽기 ───────────────────────────────────────────────────

def doc_numbers(doc):
    n = {}
    m = re.search(r'### 1\. 분야 표 — 큰 분야 (\d+) · 작은 분야 (\d+)', doc)
    if m:
        n['큰 분야'], n['작은 분야'] = int(m.group(1)), int(m.group(2))
    m = re.search(r'근거\(계산\): ● (\d+) · ◐ (\d+) · ○ (\d+) = (\d+)\. 물음 (\d+) 가운데 답하는 칸이 있는 것 (\d+) · 곁만 (\d+) · 방향 물음 (\d+) · 빈칸 (\d+)\. 하위 (\d+) 가운데 답하는 칸이 있는 것 (\d+)', doc)
    if m:
        g = [int(x) for x in m.groups()]
        n.update({'●': g[0], '◐': g[1], '○': g[2], '물음': g[4], '물음 답': g[5], '물음 곁만': g[6], '물음 방향': g[7],
                  '물음 빈칸': g[8], '하위': g[9], '하위 답': g[10]})
    m = re.search(r'### 빈칸 목록 \(큰 분야마다 · 답하는 칸이 없는 작은 분야 (\d+)\)', doc)
    if m:
        n['답 0 작은 분야'] = int(m.group(1))
    return n


def doc_rows(doc):
    """1절 분야 표의 줄: 키 → {이름, 물음들(글), 하위수, 근거 칸}."""
    rows, big_order = {}, []
    for ln in doc.split('\n'):
        m = re.match(r'^\*\*\d+ (.+?)\*\* \(`([a-z]+)` · 대표 「(.+?)」 = `([a-z.]+)` 물음 (\d+) · 머리 〔(.+?)〕\)$', ln)
        if m:
            big_order.append({'키': m.group(2), '이름': m.group(1), '대표글': m.group(3), '대표': [m.group(4), int(m.group(5))], '머리': m.group(6)})
            continue
        m = re.match(r'^\| ([a-z]+\.[a-z]+) \| (.*) \|$', ln)
        if not m:
            continue
        cells = [c.strip() for c in m.group(2).split(' | ')]
        if len(cells) != 6:
            continue
        name, qs, subs, _show, _law, stat = cells
        name = re.sub(r'\s*＋$', '', name.split('<br>')[0].strip())
        글들 = []
        for q in qs.split('<br>'):
            mm = re.match(r'^「(.*?)」', q.strip())
            글들.append(mm.group(1) if mm else q.strip())
        하위수 = sum(1 for s in subs.split('<br>') if not s.strip().startswith('그 밖의 곁:'))
        sm = re.match(r'^([●◐○]) 물음 (\d+)/(\d+) · 하위 (\d+)/(\d+)', stat)
        rows[m.group(1)] = {'이름': name, '물음': 글들, '하위수': 하위수,
                            '근거': (sm.group(1), int(sm.group(2)), int(sm.group(3)), int(sm.group(4)), int(sm.group(5))) if sm else None,
                            '격만': '답 칸이 모두 격결론 표시' in stat}
    return rows, big_order


def doc_toc(doc):
    """3절 목차 표: 칸 id → {답: [], 곁: [], 격: bool}. 단계 표(ss.<단계>.n)는 회마다 펼친다."""
    out = {}

    def reach_of(s):
        r = {'답': [], '곁': []}
        for part in s.split(' / '):
            mm = re.match(r'^\s*(답|곁): (.*)$', part)
            if mm:
                r[mm.group(1)] = sorted(x.strip() for x in mm.group(2).split(' · ') if x.strip())
        return r

    for ln in doc.split('\n'):
        m = re.match(r'^\| `([a-z0-9.-]+)` \| (.*) \|$', ln)
        if m:
            cells = [c.strip() for c in m.group(2).split(' | ')]
            if len(cells) == 5:
                r = reach_of(cells[2])
                r['격'] = cells[3] == '표시'
                out[m.group(1)] = r
            continue
        # 단계 표: | 단계(모듈 키 · 이름) | `ss.<단계>.n` | 회 제목과 닿는 분야 | 보여줌 | 무료/잠금 |
        m = re.match(r'^\| [^|`]+ \| `([a-z]+\.[a-z]+)\.n` \| (.*) \|$', ln)
        if m:
            cells = [c.strip() for c in m.group(2).split(' | ')]
            for item in cells[0].split('<br>'):
                mm = re.match(r'^(\d+) 「.*」 \[(.*)\]$', item.strip())
                if mm:
                    r = reach_of(mm.group(2))
                    r['격'] = False
                    out['%s.%s' % (m.group(1), mm.group(1))] = r
    return out


def doc_content_keys(doc):
    sec = doc.split('### 2. 콘텐츠 표', 1)[-1].split('### 3.', 1)[0]
    return [m.group(1) for m in re.finditer(r'^\| ([a-z]+) \| ', sec, re.M)]


# ── 만들어 내기(연결 단계에서 채운다 — 설계 전략 가 · 타) ─────────────

def make_script_lines(T):
    """index.html 의 <script> 줄(표시 사이)을 콘텐츠 표 `파일` 에서 쓴다."""
    raise NotImplementedError('연결 단계에서 채운다')


def make_bust_files(T):
    """tools_bust.py 가 읽을 버전 목록(FILES)을 콘텐츠 표 `파일` 에서 낸다."""
    raise NotImplementedError('연결 단계에서 채운다')


def make_read_list(T):
    """read.html 목록을 목차 표의 읽을거리 줄에서 쓴다."""
    raise NotImplementedError('연결 단계에서 채운다')


def make_month_rows(T):
    """출산택일 월별 달 목록 줄을 app/taekil-YYYY-MM*.html 파일에서 쓴다(지난 달은 뒤로)."""
    raise NotImplementedError('연결 단계에서 채운다')


def make_sitemap(T):
    """app/sitemap.xml 을 표 · 바깥 글 파일에서 쓴다."""
    raise NotImplementedError('연결 단계에서 채운다')


def make_llms(T):
    """app/llms.txt 를 표에서 쓴다."""
    raise NotImplementedError('연결 단계에서 채운다')


# ── 내기 ─────────────────────────────────────────────────────────────

def main():
    T = load_table()
    doc = read(DOC)
    c = counts(T)
    st = field_stats(T)
    다름 = []

    print('1) 수')
    print('  큰 분야 %d · 작은 분야 %d · 콘텐츠 %d · 목차 칸 %d' % (c['큰 분야'], c['작은 분야'], c['콘텐츠'], c['목차 칸']))
    print('  물음 %d — 답하는 칸 %d · 곁만 %d · 방향 %d · 빈칸 %d' % (c['물음'], c['물음 답'], c['물음 곁만'], c['물음 방향'], c['물음 빈칸']))
    print('  하위 %d — 답하는 칸 %d' % (c['하위'], c['하위 답']))

    print('\n2) 근거 상태(계산 — 손님에게는 보이지 않는다)')
    print('  ● %d · ◐ %d · ○ %d  (답하는 칸이 없는 작은 분야 %d)' % (c['●'], c['◐'], c['○'], c['답 0 작은 분야']))
    이름 = {f['키']: f['이름'] for f in T['분야']}
    for b in T['큰분야']:
        fs = [f['키'] for f in T['분야'] if f['큰'] == b['키']]
        줄 = ' · '.join('%s %s(%d/%d)' % (st[k]['상태'], k.split('.', 1)[1], st[k]['물음답'], st[k]['물음수']) for k in fs)
        print('  %-7s %s' % (b['이름'], 줄))
    격만 = [k for k, v in st.items() if v['격만']]
    if 격만:
        print('  답 칸이 모두 격결론 표시: ' + ' · '.join('%s(%s)' % (k, 이름[k]) for k in 격만))

    print('\n3) 설계와 대조(docs/100)')
    dn = doc_numbers(doc)
    for k, v in dn.items():
        if c.get(k) != v:
            다름.append('수 %s — 설계 %s · 표 %s' % (k, v, c.get(k)))
    rows, bigs = doc_rows(doc)
    big_order = [b['키'] for b in bigs]
    표큰 = [b['키'] for b in T['큰분야']]
    if big_order != 표큰:
        다름.append('큰 분야 차례 — 설계 %s · 표 %s' % (' '.join(big_order), ' '.join(표큰)))
    표키 = [f['키'] for f in T['분야']]
    if sorted(rows) != sorted(표키):
        다름.append('작은 분야 키 — 설계에만 %s · 표에만 %s' % (sorted(set(rows) - set(표키)), sorted(set(표키) - set(rows))))
    글다름 = []
    물음글 = {f['키']: [q['글'] for q in f['물음']] for f in T['분야']}
    표큰줄 = {b['키']: b for b in T['큰분야']}
    for d in bigs:
        b = 표큰줄.get(d['키'])
        if not b:
            continue
        if b['대표'] != d['대표']:
            다름.append('%s 대표 — 설계 %s · 표 %s' % (d['키'], d['대표'], b['대표']))
        if b['이름'] != d['이름'] or b['머리'] != d['머리']:
            글다름.append('%s 큰 분야 이름 · 머리 — 설계 「%s」「%s」 · 표 「%s」「%s」' % (d['키'], d['이름'], d['머리'], b['이름'], b['머리']))
        qs = 물음글.get(b['대표'][0], [])
        실제 = qs[b['대표'][1] - 1] if 0 < b['대표'][1] <= len(qs) else None
        if 실제 != d['대표글']:
            글다름.append('%s 대표 물음 — 설계 「%s」 · 표 「%s」' % (d['키'], d['대표글'], 실제))
    for f in T['분야']:
        d = rows.get(f['키'])
        if not d:
            continue
        s = st[f['키']]
        mine = (s['상태'], s['물음답'], s['물음수'], s['하위답'], s['하위수'])
        if d['근거'] and d['근거'] != mine:
            다름.append('%s 근거 — 설계 %s 물음 %d/%d · 하위 %d/%d · 표 %s 물음 %d/%d · 하위 %d/%d' % ((f['키'],) + d['근거'] + mine))
        if d['격만'] != s['격만']:
            다름.append('%s 「답 칸이 모두 격결론」 — 설계 %s · 표 %s' % (f['키'], d['격만'], s['격만']))
        if d['이름'] != f['이름']:
            글다름.append('%s 이름 — 설계 「%s」 · 표 「%s」' % (f['키'], d['이름'], f['이름']))
        if d['물음'] != [q['글'] for q in f['물음']]:
            글다름.append('%s 물음 글 — 설계와 다름' % f['키'])
        if d['하위수'] != len(f['하위']):
            다름.append('%s 하위 수 — 설계 %d · 표 %d' % (f['키'], d['하위수'], len(f['하위'])))
    dt = doc_toc(doc)
    rc = reach(T)
    표격 = {r['칸'] for r in T['목차'] if r.get('격결론')}
    설계격 = {k for k, v in dt.items() if v['격']}
    if 표격 != 설계격:
        다름.append('격결론 칸 — 설계에만 %s · 표에만 %s' % (sorted(설계격 - 표격), sorted(표격 - 설계격)))
    표칸 = [r['칸'] for r in T['목차']]
    if sorted(dt) != sorted(표칸):
        다름.append('목차 칸 — 설계에만 %s · 표에만 %s' % (sorted(set(dt) - set(표칸)), sorted(set(표칸) - set(dt))))
    for k in 표칸:
        if k not in dt:
            continue
        mine = rc.get(k, {'답': [], '곁': []})
        if mine['답'] != dt[k]['답'] or mine['곁'] != dt[k]['곁']:
            다름.append('%s 닿는 분야 — 설계 답 %s 곁 %s · 표(거꾸로 계산) 답 %s 곁 %s' % (k, dt[k]['답'], dt[k]['곁'], mine['답'], mine['곁']))
    ck = doc_content_keys(doc)
    표콘 = [x['키'] for x in T['콘텐츠']]
    if ck and ck != 표콘:
        다름.append('콘텐츠 키 — 설계 %s · 표 %s' % (ck, 표콘))
    if 다름:
        for x in 다름:
            print('  X ' + x)
    else:
        print('  O 수 · 근거 상태(74줄) · 큰 분야 차례 · 격결론 칸 %d · 목차 칸 %d · 닿는 분야 · 콘텐츠 키가 설계와 같다' % (len(표격), len(표칸)))
    if 글다름:
        print('  ! 글이 설계와 다름 %d곳(작가가 다듬었으면 정상 — 확인만)' % len(글다름))
        for x in 글다름[:20]:
            print('      ' + x)
    else:
        print('  O 분야 이름 · 물음 글이 설계의 「하려던 말」 그대로')

    print('\n4) 파일')
    없는 = []
    for x in T['콘텐츠']:
        for f in x.get('파일', []):
            if not os.path.exists(os.path.join(APP, f)):
                없는.append('%s 파일 %s' % (x['키'], f))
    for r in T['목차']:
        if r.get('주소') and not os.path.exists(os.path.join(APP, r['주소'])):
            없는.append('%s 주소 %s' % (r['칸'], r['주소']))
    if 없는:
        for x in 없는:
            print('  X 없는 파일 — ' + x)
    else:
        print('  O 콘텐츠 표의 파일 · 목차 표의 주소가 모두 app/ 에 있다')
    try:
        bust = read(os.path.join(ROOT, 'tools_bust.py'))
        빠짐 = [f for f in ('bunya.js',) if "'%s'" % f not in bust] + [p for p in ('tests_bunya.html',) if "'%s'" % p not in bust]
        if 빠짐:
            print('  ! tools_bust.py 에 아직 없음: %s (화면에 실을 때 FILES · PAGES 에 넣는다)' % ' · '.join(빠짐))
    except Exception:
        pass

    print('\n' + '─' * 52)
    print('설계와 다름 %d' % len(다름))
    return 1 if 다름 else 0


if __name__ == '__main__':
    sys.exit(main())
