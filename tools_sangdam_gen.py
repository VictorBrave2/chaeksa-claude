# -*- coding: utf-8 -*-
"""출산택일 상담 답글 · 보고서(99,000원) 생성기 — 판정엔진 + 출산택일 관점 (법전 60 · 63 · 65 · 68조).

**점수 · 순위 · TOP N 을 내지 않는다**(60조). 사이트 월별 글(tools_wolbyeol.py) · 시뮬레이터(app/taekilsim.js)와 같은 방식이다.
  - 궁통보감 · 자평진전 두 고전은 거르개다 — 둘 다 걸리는 것이 없는 시각만 남긴다(65조).
  - 적천수는 거르지 않는다. 참고 한 줄(흐름)만 붙인다.
  - 으뜸 = 걸리는 것 없고, 궁통보감이 적어 둔 글자(먼저 찾는 글자 + 돕는 글자)가 천간에 다 있는 곳(68조).
  - 가족 일지와 아이 일지가 부딪히는(충) 곳은 뺀다. 아이 시지의 충과 합은 적기만 한다(--strict 면 시지 충도 뺀다).
  - 대운은 app/gwanjeom.js 의 대운(R, 성별)이 낸 줄을 줄여 옮긴다(충 · 계절 글자 · 격 바뀜).
여기서 새로 재지 않는다 — 브라우저에서 ChaeksaTaekilSim.하루 + ChaeksaGwanjeom.대운 이 낸 덤프를 글로 옮길 뿐이다.
줄 순서는 날짜순이다. 권하는 순서는 사람이 정해서 --order 로 넣는다(까닭은 --summary 에 말로 적는다).

2026-09-22 옛 판(.taekil/_taekil.json · scan.js 점수로 「N칸 전수 순위」를 내던 것)을 버리고 새로 짰다. 옛 판은 git 기록(39c10e1 이전)에 있다.

쓰는 법 (자세한 절차는 .claude/skills/택일상담/SKILL.md)
  1) python tools_sangdam_gen.py 받기 [폴더] [개수]
       덤프 수신기(127.0.0.1:8793). 백그라운드로 띄운다. 개수(기본 1)만큼 받으면 스스로 끝난다.
  2) 개발 서버(tests_taekilsim.html)에서 기간을 덤프해 http://127.0.0.1:8793/consult.json 으로 보낸다(스킬 「계산」 절)
  3) python tools_sangdam_gen.py 짜기 <덤프.json> --name 2026-10-son --family "아버님:丁丑,어머님:壬辰"
       [--asked "2026-10-26T15:00"] [--order "10-26 유,10-28 미"] [--summary "…|…"] [--window 7-21] [--strict] [--cards 3] [--no-cards] [--no-daeun]
       → marketing/cards/상담-<name>/붙여넣기.html   부모 일지가 든 답글. **커밋하지 않는다.**
       → app/cards/consult-<name>/01.png …          아기 시각만 든 명식 카드. 배포해야 https://chaeksa.kr/cards/… 가 산다.
"""
import argparse
import html
import io
import json
import os
import re
import sys
import tempfile
import urllib.parse

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
지지 = '子丑寅卯辰巳午未申酉戌亥'
지지말 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
육합짝 = {0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6}


# ── 받기: 브라우저 덤프 수신기 ──────────────────────────────────────
def 받기(폴더, 개수=1):
    import http.server
    os.makedirs(폴더, exist_ok=True)
    남은 = [개수]

    class H(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            n = int(self.headers.get('Content-Length', '0'))
            b = self.rfile.read(n)
            name = os.path.basename(urllib.parse.unquote(self.path.strip('/'))) or 'dump.json'
            path = os.path.join(폴더, name)
            open(path, 'wb').write(b)
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'ok')
            print('받음', path, len(b), 'bytes', flush=True)
            남은[0] -= 1

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(('127.0.0.1', 8793), H)
    print('덤프 받는 중 — http://127.0.0.1:8793/<파일이름>.json 으로 POST · 저장 폴더', 폴더, flush=True)
    while 남은[0] > 0:
        srv.handle_request()


# ── 말 도우미 ──────────────────────────────────────────────────────
def 받침(s):
    t = re.sub(r'\([^)]*\)\s*$', '', str(s)).strip()
    if not t:
        return False
    c = ord(t[-1])
    return 0xAC00 <= c <= 0xD7A3 and (c - 0xAC00) % 28 != 0


def 이가(s): return s + ('이' if 받침(s) else '가')
def 이에요(s): return s + ('이에요' if 받침(s) else '예요')
def 과와(s): return s + ('과' if 받침(s) else '와')


def 지말(ch): return 지지말[지지.index(ch)] + '(' + ch + ')'


def 지(간지):
    """'계유(癸酉)' → '酉'"""
    m = re.search(r'([子丑寅卯辰巳午未申酉戌亥])\)?\s*$', 간지)
    return m.group(1) if m else ''


def 때말(분):
    h, m = divmod(분, 60)
    if h == 0: s = '밤 12시'
    elif h < 6: s = '새벽 %d시' % h
    elif h < 12: s = '오전 %d시' % h
    elif h == 12: s = '낮 12시'
    elif h < 18: s = '오후 %d시' % (h - 12)
    elif h < 21: s = '저녁 %d시' % (h - 12)
    else: s = '밤 %d시' % (h - 12)
    return s + (' %d분' % m if m else '')


def 창말(r):
    A, B = 때말(r['시작']), 때말(r['끝'])
    if A.split(' ')[0] == B.split(' ')[0]:
        B = B.split(' ', 1)[1]
    return A + ' ~ ' + B


def 날말(d): return '%d월 %d일(%s)' % (d['m'], d['d'], d['요일'])


def 눈(r, key):
    return next((n for n in r.get('눈', []) if n.get('key') == key), None)


def 격이름(r):
    n = 눈(r, '격')
    if not n or n.get('모름'):
        return '격을 하나로 잡기 어려움'
    return n['한줄'].split(' · ')[0]


def 흐름(r):
    n = 눈(r, '통관')
    if not n:
        return ''
    for p in n.get('풀이', []):
        if p.startswith('흐름은'):
            return p
    return n.get('한줄', '')


def 궁짧게(r):
    n = 눈(r, '조후')
    if not n or not n.get('걸림'):
        return ''
    h = n['한줄']
    if '돕는 글자만' in h: return '궁통보감 걸림(필요한 글자 없음, 돕는 글자만)'
    if '걸리는 구절' in h: return '궁통보감 걸림(원문에 걸리는 구절)'
    return '궁통보감 걸림(필요한 글자 없음)'


def 병원(d, r):
    """시계 시각 창이 병원 시간과 어떻게 겹치나 → (짧은 꼬리표, 한 줄)."""
    a, b = r['시작'], r['끝']
    길이 = b - a + 1
    겹 = lambda s, e: max(0, min(b, e - 1) - max(a, s) + 1)
    if d['요일'] in ('토', '일'):
        return '주말', '주말이에요. 예약 수술은 어려울 수 있어요.'
    정 = 겹(540, 1020)
    if 정 == 길이:
        return '평일 낮', '평일 낮(9~17시) 안이에요.'
    if 정 > 0:
        return '평일 낮 %d분' % 정, '평일 낮(9~17시)과 겹치는 건 %d분이에요. 병원이 조금만 늦어도 시주가 바뀌어요.' % 정
    if 겹(420, 540) + 겹(1020, 1140) > 0:
        return '연장 시간', '평일 이른 아침(7~9시) · 저녁(17~19시) 시간이에요. 협의하면 잡아 주는 병원이 있어요.'
    return '야간', '야간(저녁 7시 ~ 아침 7시)이에요. 이 시간에 수술을 잡아 주는 병원을 찾아야 해요.'


def 가족읽기(s):
    out = []
    for tok in [t.strip() for t in (s or '').split(',') if t.strip()]:
        이름, _, 값 = tok.partition(':')
        값 = 값.strip()
        hz = re.findall(r'[子丑寅卯辰巳午未申酉戌亥]', 값)
        if hz:
            out.append((이름.strip(), hz[-1]))
        elif 값 and 값[-1] in 지지말:
            out.append((이름.strip(), 지지[지지말.index(값[-1])]))
        else:
            sys.exit('가족 일지를 못 읽었다: %r — "아버님:丁丑" 이나 "아버님:축" 꼴로 넣는다' % tok)
    return out


def 가족본(r, 가족, 엄격=False):
    """가족 일지와 아이 일지 · 시지. 돌려주는 것 = (거를 충, 적기만 할 충, 합).
       기본은 아이 **일지**가 부딪히는 곳만 거른다(09-21 상담에서 쓴 기준). 시지 충은 적어 두고, --strict 면 시지 충도 거른다."""
    일, 시 = 지(r['일주']), 지(r['시주'])
    거를, 적을, 합들 = [], [], []
    for 이름, g in 가족:
        gi = 지지.index(g)
        for 무엇, x in (('일지', 일), ('시지', 시)):
            if not x:
                continue
            xi = 지지.index(x)
            if (xi - gi) % 12 == 6:
                말 = '아이 %s %s %s 일지 %s 부딪혀요(충)' % (무엇, 이가(지말(x)), 이름, 과와(지말(g)))
                (거를 if (무엇 == '일지' or 엄격) else 적을).append(말)
            elif 육합짝[xi] == gi:
                합들.append('아이 %s %s %s 일지 %s 합이 돼요' % (무엇, 이가(지말(x)), 이름, 과와(지말(g))))
    return 거를, 적을, 합들


def 대운줄들(dl, 몇=5):
    """gwanjeom.대운 의 줄을 한 대운 한 줄로 줄인다 — 천간 · 지지 십신(뜻), 원국과의 충, 계절이 찾던 글자, 격 바뀜. 앞 다섯 대운(50대 초까지)만."""
    out = []
    for x in (dl or [])[:몇]:
        줄 = x.get('줄', [])
        말 = []
        m1 = re.search(r'천간에 \S+ (\S+\([^)]*\))[이가] 와요', 줄[0]) if 줄 else None
        m2 = re.search(r'지지에 \S+ (\S+\([^)]*\))[이가] 와요', 줄[1]) if len(줄) > 1 else None
        if m1: 말.append('천간 ' + m1.group(1))
        if m2: 말.append('지지 ' + m2.group(1))
        for t in 줄[2:]:
            if '부딪혀요(충)' in t:
                궁 = re.findall(r'(연|월|일|시)지는 ([^,.]+?) 자리', t)
                if 궁:
                    말.append(과와(' · '.join('%s 자리(%s지)' % (g, k) for k, g in 궁)) + ' 부딪혀요(충)')
            elif t.startswith('계절이 나에게 먼저 찾던'):
                c = re.search(r'찾던 (\S+?\([^)]*\))', t)
                if c: 말.append('계절이 먼저 찾던 ' + 이가(c.group(1)) + ' 와요')
            elif t.startswith('계절이 나에게 찾던 돕는 글자'):
                c = re.search(r'돕는 글자 (\S+?\([^)]*\))', t)
                if c: 말.append('계절이 찾던 돕는 글자 ' + 이가(c.group(1)) + ' 와요')
            elif '격이' in t and '바뀌어요' in t:
                말.append(t.replace('이 열 해에는 ', '').rstrip('.'))
        out.append('▸ %d~%d살 %s 대운 — %s' % (x['시작나이'], x['끝나이'], x['간지'], ' · '.join(말)))
    return out


def 대운첫말(dl):
    """앞 세 대운에 원국과 부딪히는 글자가 있나 — 한 줄."""
    앞 = (dl or [])[:3]
    if not 앞:
        return ''
    부딪 = [x for x in 앞 if any('부딪혀요(충)' in t for t in x.get('줄', []))]
    if not 부딪:
        return '%d살부터 %d살까지 오는 대운에는 사주와 부딪히는 글자가 없어요.' % (앞[0]['시작나이'], 앞[-1]['끝나이'])
    x = 부딪[0]
    return '%d~%d살 대운에 사주와 부딪히는(충) 글자가 와요. 충은 글자의 십성이 발현되거나 있던 것이 깨질 수 있어요.' % (x['시작나이'], x['끝나이'])


# ── 짜기 ──────────────────────────────────────────────────────────
def 시각읽기(s, days):
    out = []
    for tok in [t.strip() for t in (s or '').split(',') if t.strip()]:
        m = re.match(r'(?:(\d{4})-)?(\d{1,2})-(\d{1,2})[T ]\s*(\d{1,2}):(\d{2})$', tok)
        if not m:
            sys.exit('--asked 를 못 읽었다: %r — "2026-10-26T15:00" 꼴' % tok)
        y, mo, dd, hh, mi = (int(x) if x else None for x in m.groups())
        d = next((d for d in days if d['m'] == mo and d['d'] == dd and (y is None or d['y'] == y)), None)
        if not d:
            sys.exit('--asked %s 는 덤프 기간 밖이다' % tok)
        t = hh * 60 + mi
        r = next((r for r in d['rows'] if r['시작'] <= t <= r['끝']), None)
        if not r:
            sys.exit('--asked %s 에 맞는 시진을 못 찾았다' % tok)
        out.append((d, r, t))
    return out


def 순서읽기(s, 후보):
    out = []
    for tok in [t.strip() for t in (s or '').split(',') if t.strip()]:
        m = re.match(r'(?:(\d{4})-)?(\d{1,2})-(\d{1,2})\s*([가-힣])', tok)
        if not m:
            sys.exit('--order 를 못 읽었다: %r — "10-26 유" 꼴' % tok)
        y, mo, dd, 시 = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        밤 = '밤' in tok[m.end():]
        맞 = [x for x in 후보 if x[0]['m'] == mo and x[0]['d'] == dd and x[1]['시진'][0] == 시
              and (y is None or x[0]['y'] == int(y)) and (x[1]['밤끝'] == 밤 or 시 != '자')]
        if not 맞:
            sys.exit('--order %s 는 걸리는 것 없는 곳(가족 충 뺀 뒤)에 없다 — 걸린 곳은 권할 수 없다' % tok)
        out.append(맞[0])
    return out


머리 = '''<meta charset="utf-8">
<title>붙여넣기 · 상담 답글 — {제목}</title>
<style>
 :root{ --ink:#222; --sub:#888; --line:#e8e8e8; --pt:#03c75a; color-scheme:light; }
 *{box-sizing:border-box}
 body{margin:0;background:#f4f4f4;color:var(--ink);
   font-family:"Noto Sans KR","Malgun Gothic",-apple-system,sans-serif}
 .bar{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);
   padding:14px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;z-index:9}
 .bar b{font-size:14px}
 .bar span{font-size:13px;color:var(--sub);line-height:1.6}
 .bar button{background:var(--pt);color:#fff;border:0;border-radius:6px;
   padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
 .wrap{max-width:720px;margin:22px auto;background:#fff;padding:34px 30px 50px;
   border:1px solid var(--line)}
 #doc h2{font-size:22px;line-height:1.4;margin:0 0 6px;font-weight:700}
 #doc .alt{font-size:13.5px;color:var(--sub);margin:0 0 24px}
 #doc h3{font-size:20px;font-weight:700;margin:30px 0 14px;line-height:1.45}
 #doc p{font-size:16px;line-height:1.8;margin:0 0 15px}
 #doc hr{border:0;border-top:1px solid var(--line);margin:26px 0}
 #doc blockquote{margin:0 0 16px;padding:14px 16px;background:#f7f7f7;
   border-left:3px solid var(--pt)}
 #doc blockquote p{font-size:15px;line-height:1.9;margin:0}
 .done{background:#111 !important}
</style>

<div class="bar">
  <button id="copy">본문 전체 복사</button>
  <b>상담 답글 — {제목}</b>
  <span>복사 → 네이버 답글 · 글쓰기 · 메일 본문에 <b>Ctrl+V</b><br>
    그림 안내 줄은 복사할 때 빠집니다. 부모님 정보가 든 파일이라 커밋하지 않습니다.</span>
</div>
<div class="wrap">
  <div id="doc">
'''

꼬리 = '''  </div>
</div>

<script>
document.getElementById('copy').onclick = async () => {
  const el = document.getElementById('doc');
  const clone = el.cloneNode(true);
  clone.querySelectorAll('h2, .alt').forEach(x => x.remove());   // 제목 · 그림 안내 줄은 빼고
  const html = clone.innerHTML;
  const text = clone.innerText;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], {type:'text/html'}),
      'text/plain': new Blob([text], {type:'text/plain'}),
    })]);
  } catch (e) {
    const r = document.createRange(); r.selectNodeContents(clone);
    document.body.appendChild(clone);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.execCommand('copy'); sel.removeAllRanges(); clone.remove();
  }
  const b = document.getElementById('copy');
  b.textContent = '복사됐습니다 — 붙여넣으세요'; b.classList.add('done');
  setTimeout(() => { b.textContent = '본문 전체 복사'; b.classList.remove('done'); }, 2600);
};
</script>
'''


def 짜기(a):
    D = json.load(io.open(a.dump, encoding='utf-8'))
    if isinstance(D, list):
        sys.exit('덤프 꼴이 다르다 — 상담 덤프는 {성별, 곳값, days:[{y,m,d,…}]} 이다(월별 글 덤프와 다르다)')
    days = D['days']
    성별 = D.get('성별', 'M')
    곳값 = D.get('곳값', 'KR:서울')
    곳 = days[0].get('곳', '서울')
    if not re.match(r'^[A-Za-z0-9-]+$', a.name):
        sys.exit('--name 은 영문 · 숫자 · - 만 (카드 주소에 들어간다)')
    가족 = 가족읽기(a.family)
    물은 = 시각읽기(a.asked, days)
    창 = None
    if a.window:
        s, e = a.window.split('-')
        창 = (int(s) * 60, int(e) * 60)

    전체 = [(d, r) for d in days for r in d['rows']]
    깨끗 = [(d, r) for d, r in 전체 if r.get('없음')]
    후보, 뺀가족, 뺀시간 = [], [], []
    for d, r in 깨끗:
        거를, 적을, 합들 = 가족본(r, 가족, a.strict)
        if 거를:
            뺀가족.append((d, r, ' · '.join(거를)))
        elif 창 and not (r['시작'] < 창[1] and r['끝'] >= 창[0]):
            뺀시간.append((d, r))
        else:
            후보.append((d, r, (적을, 합들)))
    상세 = 순서읽기(a.order, 후보) if a.order else 후보[:6]
    나머지 = [x for x in 후보 if x not in 상세]
    으뜸수 = sum(1 for _, r, _ in 후보 if r.get('으뜸'))

    # 터미널 요약 — 사람이 --order 를 고를 때 보는 것
    print('전체 %d · 두 고전 걸림 없음 %d · 가족 충으로 뺌 %d · 시간 밖 %d · 남음 %d (으뜸 %d)'
          % (len(전체), len(깨끗), len(뺀가족), len(뺀시간), len(후보), 으뜸수))
    for d, r, (적을, 합들) in 후보:
        충대운 = [x['시작나이'] for x in (r.get('대운') or [])[:4] if any('부딪혀요(충)' in t for t in x.get('줄', []))]
        print('  %02d-%02d %s %s %s %s%s%s%s' % (d['m'], d['d'], d['요일'], r['시진'], r['창'], 격이름(r),
              ' · 으뜸' if r.get('으뜸') else '', ' · ' + 병원(d, r)[0],
              (' · 대운 충 %s살' % ','.join(map(str, 충대운)) if 충대운 else '') + (' · 합 %d' % len(합들) if 합들 else '')
              + (' · 시지 충: ' + ' / '.join(적을) if 적을 else '')))
    for d, r, 까닭 in 뺀가족:
        print('  뺌 %02d-%02d %s %s — %s' % (d['m'], d['d'], r['시진'], r['창'], 까닭))

    # 카드 — 물어본 시각(걸리면 걸린 대로) 다음에 권하는 곳. 본문 번호와 카드 순서를 맞춘다.
    카드들 = []   # (slot, label, key)
    def 걸림말(r):
        if r.get('없음'):
            return '걸리는 것 없음'
        걸 = [n['고전'] for n in r.get('눈', []) if n.get('걸림') and not n.get('보조')]
        return (' · '.join(걸) + '에 걸려요') if 걸 else '격을 하나로 잡기 어려워요'
    for d, r, t in 물은:
        카드들.append(('%d-%02d-%02dT%02d:%02d' % (d['y'], d['m'], d['d'], t // 60, t % 60), '물어보신 시각 — ' + 걸림말(r), ('물', id(r), t)))
    for i, (d, r, _) in enumerate(상세[:a.cards], 1):
        c = (r['시작'] + r['끝']) // 2
        카드들.append(('%d-%02d-%02dT%02d:%02d' % (d['y'], d['m'], d['d'], c // 60, c % 60),
                     '%d번 — %s' % (i, '으뜸' if r.get('으뜸') else '두 고전에 걸리지 않는 곳'), ('후', id(r))))
    그림 = {}
    if 카드들 and not a.no_cards:
        import tools_card
        폴더 = a.card_dir or os.path.join(ROOT, 'app', 'cards', 'consult-' + a.name)
        이름들 = ['%02d' % (i + 1) for i in range(len(카드들))]
        tools_card.찍기(폴더, 곳값, [c[0] for c in 카드들], [c[1] for c in 카드들], 성별, 이름들=이름들)
        for n, c in zip(이름들, 카드들):
            그림[c[2]] = n
    def 카드(key, 설명):
        n = 그림.get(key)
        if not n:
            return []
        url = 'https://chaeksa.kr/cards/consult-%s/%s.png' % (a.name, n)
        return ['<p class="card-img"><img src="%s" alt="%s" style="max-width:100%%;height:auto"></p>' % (url, html.escape(설명)),
                '<p class="alt">그림 %d — 네이버에 그림이 안 따라오면 app/cards/consult-%s/%s.png 를 이 자리에 끌어다 놓으세요.</p>' % (int(n), a.name, n)]

    첫날, 끝날 = days[0], days[-1]
    기간 = '%s ~ %s' % (날말(첫날), 날말(끝날) if 끝날['m'] != 첫날['m'] else '%d일(%s)' % (끝날['d'], 끝날['요일']))
    P = []
    p = P.append
    p('<p>%s</p>' % html.escape(a.intro or '안녕하세요. 알려 주신 조건으로 계산했어요.'))
    조건 = ['▸ 기간 — %s, %d일' % (기간, len(days)),
            '▸ 태어날 곳 — %s (%s 시계 시각으로 적었어요)' % (곳, 곳),
            '▸ 아기 — ' + ('성별을 몰라서 대운은 빼고 봤어요' if a.no_daeun else ('남아' if 성별 == 'M' else '여아'))]
    if 가족:
        조건.append('▸ 가족 일지 — ' + ' · '.join('%s %s' % (n, 지말(g)) for n, g in 가족))
    if 창:
        조건.append('▸ 병원에서 된다고 하신 시간 — %d시 ~ %d시' % (창[0] // 60, 창[1] // 60))
    p('<blockquote><p>' + '<br>\n'.join(조건) + '</p></blockquote>')
    p('<p>하루를 열두 시진으로 나눠 <b>%d개 시간대를 하나도 빼지 않고</b> 봤어요.</p>' % len(전체))
    p('<hr>')
    p('<h3>무엇으로 골랐나요</h3>')
    p('<p>세 고전에게 따로 물었어요. 점수로 합치지 않았어요.</p>')
    p('<blockquote><p>▸ <b>궁통보감</b> — 태어난 계절에 이 아이에게 필요한 글자가 천간에 있나<br>\n'
      '▸ <b>자평진전</b> — 무슨 격이고, 파격인가<br>\n'
      '▸ <b>적천수</b> — 어느 기운이 세를 잡았고, 흐름이 어디서 멈추나 (참고로만 읽어요)</p></blockquote>')
    p('<p>궁통보감 · 자평진전 <b>두 고전 모두 걸리는 것이 없는 곳</b>만 남겼어요.</p>')
    p('<p>그 가운데 궁통보감이 적어 둔 글자가 천간에 다 있는 곳은 <b>으뜸</b>이라고 적었어요.</p>')
    if 가족:
        p('<p>그다음 가족분들 일지와 부딪히는(충) 곳을 뺐어요.</p>')
    셈 = ['▸ 전체 시간대 %d곳' % len(전체), '▸ 두 고전 모두 걸리는 것 없는 곳 <b>%d곳</b>' % len(깨끗)]
    if 가족: 셈.append('▸ 가족과 부딪혀서 뺀 곳 %d곳' % len(뺀가족))
    if 창: 셈.append('▸ 병원 시간 밖이라 뺀 곳 %d곳' % len(뺀시간))
    셈.append('▸ 남은 곳 <b>%d곳</b>' % len(후보) + (' (그 가운데 으뜸 %d곳)' % 으뜸수 if 으뜸수 else ''))
    p('<blockquote><p>' + '<br>\n'.join(셈) + '</p></blockquote>')
    p('<hr>')

    if 물은:
        p('<h3>물어보신 시각부터 볼게요</h3>')
        for d, r, t in 물은:
            p('<p><b>%s %s</b> — %s %s 안이에요.</p>' % (날말(d), 때말(t), r['시진'], 창말(r)))
            P.extend(카드(('물', id(r), t), '%s %s 명식 — %s일 %s시' % (날말(d), 때말(t), r['일주'], r['시주'])))
            if r.get('없음'):
                p('<p>두 고전 모두 걸리는 것이 없어요.%s</p>' % (' <b>으뜸이에요.</b>' if r.get('으뜸') else ''))
                거를, 적을, _ = 가족본(r, 가족, a.strict)
                if 거를 or 적을:
                    p('<p>다만 ' + html.escape(' · '.join(거를 + 적을)) + '.</p>')
            else:
                궁, 자 = 눈(r, '조후'), 눈(r, '격')
                if 궁 and 궁.get('걸림'):
                    p('<p><b>궁통보감에 걸려요.</b></p>')
                    p('<p>' + '<br>\n'.join(html.escape(x) for x in 궁['풀이'][:2]) + '</p>')
                if 자 and 자.get('걸림'):
                    p('<p><b>자평진전에 걸려요.</b> %s이 파격이에요.</p>' % html.escape(격이름(r)))
                elif 자 and 자.get('모름'):
                    p('<p>자평진전으로는 격을 하나로 잡기 어려워요. 이런 곳은 사람이 따로 봐야 해요.</p>')
            같은날 = [x for x in d['rows'] if x.get('없음')]
            if 같은날:
                p('<p>같은 날 두 고전 모두 걸리는 것 없는 시간대는 ' + 이에요(', '.join('%s %s' % (x['시진'], 창말(x)) for x in 같은날)) + '.</p>')
            else:
                p('<p>같은 날에는 두 고전 모두 걸리는 것 없는 시간대가 없어요.</p>')
        p('<p>다른 곳에서 받으신 시각이라면, 그곳이 틀렸다는 말은 아니에요. 보는 기준이 다르면 답도 달라요.</p>')
        p('<hr>')

    p('<h3>걸리는 것 없는 곳</h3>')
    if not 후보:
        p('<p>이 기간에는 두 고전 모두 걸리는 것 없는 곳이 ' + ('가족과 부딪히지 않는 쪽으로는 ' if 뺀가족 else '') + '<b>없어요.</b></p>')
        p('<p>아래 날짜별 목록에서 무엇에 걸리는지 보시고, 앞뒤 날짜도 같이 보시면 좋아요.</p>')
    else:
        p('<p>%s</p>' % ('순서는 병원 시간 · 가족 · 대운을 보고 고른 순서예요. 점수로 매긴 순위는 아니에요.' if a.order else '날짜순이에요. 순위가 아니에요.'))
    for i, (d, r, (적을, 합들)) in enumerate(상세, 1):
        p('<h3>%d. %s %s</h3>' % (i, 날말(d), 창말(r)))
        P.extend(카드(('후', id(r)), '%s %s 명식 — %s일 %s시' % (날말(d), r['창'], r['일주'], r['시주'])))
        if r.get('으뜸'):
            p('<p><b>으뜸이에요.</b> 궁통보감이 찾는 글자와 돕는 글자가 천간에 다 있어요.</p>')
        궁 = 눈(r, '조후')
        if 궁:
            p('<p>' + '<br>\n'.join(html.escape(x) for x in 궁['풀이'][:2]) + '</p>')
        p('<p>자평진전으로는 %s이고, 파격이 아니에요.</p>' % html.escape(격이름(r)))
        f = 흐름(r)
        if f:
            p('<p>적천수(참고) — %s</p>' % html.escape(f))
        if 가족:
            p('<p>가족 — ' + ('아이 일지가 가족분들 일지와 부딪히지 않아요.' if 적을 else '가족분들 일지와 부딪히지 않아요.')
              + (' 다만 ' + html.escape(' · '.join(적을)) + '.' if 적을 else '')
              + (' ' + html.escape(' · '.join(합들)) + '.' if 합들 else '') + '</p>')
        if not a.no_daeun and r.get('대운'):
            p('<p>대운(10년마다 바뀌는 운)은 이렇게 와요. %s 기준이에요. %s</p>' % ('남아' if 성별 == 'M' else '여아', 대운첫말(r['대운'])))
            p('<blockquote><p>' + '<br>\n'.join(html.escape(x) for x in 대운줄들(r['대운'])) + '</p></blockquote>')
        p('<p>병원 시간 — %s</p>' % 병원(d, r)[1])
        if r.get('밤끝'):
            p('<p>밤 11시 넘어 태어나면 다음 날 일주(%s)가 돼요.</p>' % r['일주'])
        p('<hr>')
    if a.summary:
        for k, t in enumerate(x.strip() for x in a.summary.split('|') if x.strip()):
            p(('<p><b>%s</b></p>' if k == 0 else '<p>%s</p>') % html.escape(t))
        p('<hr>')
    if 나머지:
        p('<p>그 밖에 두 고전 모두 걸리는 것 없는 곳이에요. 날짜순이에요.</p>')
        p('<blockquote><p>' + '<br>\n'.join('▸ %s %s %s · %s%s · %s' % (날말(d), r['시진'], 창말(r), html.escape(격이름(r)),
                                                                      ' · 으뜸' if r.get('으뜸') else '', 병원(d, r)[0]) for d, r, _ in 나머지) + '</p></blockquote>')
        p('<hr>')
    if 뺀가족:
        p('<h3>가족과 부딪혀서 뺀 곳</h3>')
        p('<blockquote><p>' + '<br>\n'.join('▸ %s %s %s — %s' % (날말(d), r['시진'], 창말(r), html.escape(까닭)) for d, r, 까닭 in 뺀가족) + '</p></blockquote>')
        p('<p>두 고전으로는 걸리는 것이 없는 곳이에요. 가족과의 충을 크게 보지 않으시면 쓰셔도 돼요.</p>')
        p('<hr>')

    p('<h3>날짜별로 전부</h3>')
    p('<p>날마다 열두 시진을 다 적었어요. 굵은 것이 두 고전 모두 걸리는 것 없는 곳이에요.</p>')
    뺀표 = {id(r): 까닭 for _, r, 까닭 in 뺀가족}
    for d in days:
        줄들 = ['▸ <b>%s %s일</b>' % (날말(d), d['rows'][len(d['rows']) // 2]['일주'])]
        for r in d['rows']:
            이름 = r['시진'][0] + ('(밤)' if r.get('밤끝') else '')
            if r.get('없음'):
                t = '%s %s · 걸리는 것 없음%s · %s' % (이름, r['창'], ' · 으뜸' if r.get('으뜸') else '', html.escape(격이름(r)))
                if id(r) in 뺀표:
                    t += ' · 가족과 부딪힘'
                줄들.append('&nbsp;&nbsp;<b>' + t + '</b>')
            else:
                자 = 눈(r, '격')
                걸 = [x for x in [궁짧게(r), ('자평진전 걸림(%s 파격)' % 격이름(r)) if 자 and 자.get('걸림') else ('자평진전 모름' if 자 and 자.get('모름') else '')] if x]
                줄들.append('&nbsp;&nbsp;%s %s · %s' % (이름, r['창'], ' · '.join(걸)))
        p('<blockquote><p>' + '<br>\n'.join(줄들) + '</p></blockquote>')
    p('<p>자(밤)은 밤 11시 넘어 자정까지예요. 이때 태어나면 다음 날 일주가 돼요.</p>')
    p('<hr>')

    밀 = [d['밀림'] for d in days]
    p('<h3>시계 시각을 꼭 확인하세요</h3>')
    p('<p>위 시각은 %s 기준으로 날마다 보정을 마친 시계 시각이에요.</p>' % 곳)
    p('<p>이 기간 %s은 시계가 해보다 %d~%d분 %s. 그래서 교과서 시진표와 시각이 달라요.</p>'
      % (곳, min(abs(x) for x in 밀), max(abs(x) for x in 밀), '빨라요' if 밀[0] >= 0 else '늦어요'))
    p('<p>시간대의 시작과 끝에서는 앞뒤로 10분쯤 여유를 두세요.</p>')
    p('<p>병원에는 시진 이름 말고 시계 시각으로, 몇 시 몇 분 이후라고 말씀하세요.</p>')
    p('<hr>')
    p('<p>출산 날짜와 시각은 산모와 아기의 안전, 담당 선생님의 판단이 먼저예요.</p>')
    p('<p>택일은 그 범위 안에서 고르는 참고자료예요.</p>')
    p('<p>다른 기준으로 보는 곳에서는 다른 시각이 나올 수 있어요. 그 집이 틀린 게 아니에요.</p>')
    p('<p><a href="https://chaeksa.kr/taekil-sim.html">chaeksa.kr 출산택일 시뮬레이터</a>에 날짜를 넣으시면 같은 결과를 직접 보실 수 있어요.</p>')
    p('<p>날짜가 정해지면 확정된 시각을 알려 주세요. 최종 사주를 확인해 드릴게요.</p>')
    p('<p>순산하시길 바랍니다.</p>')

    제목 = '%s %s' % (기간, '남아' if 성별 == 'M' else '여아')
    out = 머리.replace('{제목}', html.escape(제목)) + '    ' + '\n\n    '.join(P) + '\n' + 꼬리
    dst = a.out or os.path.join(ROOT, 'marketing', 'cards', '상담-' + a.name, '붙여넣기.html')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    io.open(dst, 'w', encoding='utf-8', newline='').write(out.replace('\n', '\r\n'))
    print('답글', dst, '(커밋하지 않는다)')
    if 그림:
        print('카드', a.card_dir or os.path.join(ROOT, 'app', 'cards', 'consult-' + a.name), len(그림), '장 — 배포해야 chaeksa.kr 주소가 산다')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '받기':
        폴더 = sys.argv[2] if len(sys.argv) > 2 else os.path.join(tempfile.gettempdir(), 'chaeksa-dump')
        받기(폴더, int(sys.argv[3]) if len(sys.argv) > 3 else 1)
        return
    if len(sys.argv) > 1 and sys.argv[1] == '짜기':
        ap = argparse.ArgumentParser(prog='tools_sangdam_gen.py 짜기')
        ap.add_argument('dump')
        ap.add_argument('--name', required=True, help='카드 폴더 이름(영문) — app/cards/consult-<name>/')
        ap.add_argument('--family', default='', help='"아버님:丁丑,어머님:壬辰" — 일주나 일지')
        ap.add_argument('--asked', default='', help='물어본 시각 "2026-10-26T15:00,…"')
        ap.add_argument('--order', default='', help='권하는 순서 "10-26 유,10-28 미" — 사람이 고른다')
        ap.add_argument('--summary', default='', help='정리 문단. | 로 문단을 나눈다. 첫 문단은 굵게')
        ap.add_argument('--intro', default='', help='첫 인사 한 줄')
        ap.add_argument('--window', default='', help='병원이 된다고 한 시간 "7-21" — 밖이면 뺀다')
        ap.add_argument('--strict', action='store_true', help='아이 시지가 가족 일지와 부딪히는 곳도 거른다(기본은 일지만 거르고 시지는 적기만)')
        ap.add_argument('--cards', type=int, default=3, help='권하는 곳 카드 장수(물어본 시각 카드는 따로)')
        ap.add_argument('--no-cards', action='store_true')
        ap.add_argument('--no-daeun', action='store_true', help='성별을 모를 때')
        ap.add_argument('--card-dir', default='', help='카드 PNG 폴더(기본 app/cards/consult-<name>)')
        ap.add_argument('--out', default='', help='답글 파일(기본 marketing/cards/상담-<name>/붙여넣기.html)')
        짜기(ap.parse_args(sys.argv[2:]))
        return
    print(__doc__)
    sys.exit(1)


if __name__ == '__main__':
    main()
