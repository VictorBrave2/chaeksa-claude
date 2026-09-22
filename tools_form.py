# -*- coding: utf-8 -*-
"""두 형식 검사기.

같은 자료를 보고서형과 블로그형 두 벌로 낼 때, 각 형식이 지켜야 할 것이 다르다.
섞이면 조용히 망가진다 — 블로그에 표가 들어가면 모바일에서 본문이 통째로 밀리고,
보고서에서 표를 .tw로 안 감싸면 폰에서 가로로 잘린다.

  python tools_form.py                 marketing/ 전체 검사
  python tools_form.py <파일>          한 파일만
"""
import io, os, re, sys, glob
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.abspath(__file__))
VOID = {'br','img','hr','meta','link','input','source'}

class Bal(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.st=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append((t,s.getpos()[0]))
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st: s.err.append('%d행 닫는 태그 초과 </%s>'%(s.getpos()[0],t)); return
        if s.st[-1][0]!=t:
            s.err.append('%d행 <%s>(%d행)인데 </%s>'%(s.getpos()[0],s.st[-1][0],s.st[-1][1],t)); s.st.pop()
        else: s.st.pop()

def strip(h): return re.sub(r'<[^>]+>','',h)

# ── 명식 카드 (2026-09-21) — 월별 글 첫머리에 끼우는 그림 한 장.
# <p class="card-img"><img src=… alt=… style="max-width:100%;height:auto"></p> 는 생성기가 내는 정해진 꼴이다.
# 네이버가 class·style 을 버려도 그림(절대 주소)은 남는다. 이 꼴 그대로면 통과, 다른 class·style 은 그대로 막는다.
CARD = re.compile(r'<p class="card-img">(\s*<img\b[^>]*>\s*)</p>')
CARD_STYLE = re.compile(r'\s+style="\s*max-width:\s*100%\s*;\s*height:\s*auto\s*;?\s*"')

def without_cards(doc):
    """class·style 검사용 — 명식 카드의 정해진 class·style 만 걷어 낸 본문."""
    return CARD.sub(lambda m: CARD_STYLE.sub('', m.group(1), count=1), doc)

# ── 화면·글 금지말 — tools_check.py 도 이 표를 쓴다(앱 화면 글 검사).
# 격 성패 말: feedback-four-verdict-terms (섰다·띠었다·깨졌다·무너짐 → 성격·기신 있음·구응·파격)
# 투출 바꿔 부르기: 「떠 있어요」 → 「겉에 있어요」(사장님 09-16 「떠있어요 이런말 쓰지말자니까」)
# 내 말투: 이레·잣대 (feedback-my-dialect-is-the-problem)
# 점수·순위: 종합 점수·순위·TOP N 을 만들지 않는다(feedback-no-composite-score).
#   「점수와 순위는 매기지 않았습니다」「순위가 아닙니다」처럼 아니라고 밝히는 문장은 통과 — 뒤에 오는 말을 본다.
#   보통 한국말은 뺀다 — 「들떠 있다 · 마음이 떠 있다 · 창이 떴다 · 리듬이 무너졌다 · 우선순위 · 1순위(먼저 챙길 것)」.
#   「무너졌」은 앞 열두 글자 안에 「격」이 있을 때만 본다.
금지말 = [
    ('격 성패 말', re.compile(r'격이 서 있|서 있는 사주|격이 섰|안 섰다|띠었|온전한 격|흠 하나|깨졌|격[^.\n]{0,12}?(?P<w>무너졌|무너짐)'),
     '성격·기신 있음·구응·파격 넷으로만 쓴다'),
    ('투출 바꿔 부르기', re.compile(r'(?<!들)(?<!마음 )(?<!마음이 )떠\s?있|떴(?:어요|습니다|는데|고)'),
     '「천간에 있어요 · 겉에 있어요 · 안쪽에만 있어요」로 쓴다'),
    ('내 말투', re.compile(r'(?<![가-힣])이레|잣대'),
     '이레 → 7일, 잣대 → 기준'),
    ('점수·순위', re.compile(r'(?<!우선)(?<![앞뒷뒤\d])순위|[Tt][Oo][Pp]\s?\d+|(?<![\d.:])\d{1,3}위(?!치|원|험|반|기|협)|몇\s?점|몇\s?위'),
     '점수·순위를 매기지 않는다. 고전마다 본 것을 나란히 적고, 줄은 조건으로 거른다'),
]
# 뒤에 이 말이 오면 「안 매긴다」는 문장이다.
_아님 = re.compile(r'않|아닙|아니|말고|대신|안\s?(?:매|세|내|붙|만들|씁|써|합|해|줍|드)')
_곧없음 = re.compile(r'^[^.!?\n]{0,5}없')

def 금지말찾기(text, 표=None):
    """text 에서 금지말을 찾아 [(갈래, 찾은 말, 위치, 고칠 말)] 로 낸다. 점수·순위는 부정문이면 뺀다."""
    out = []
    for 갈래, rx, 고칠말 in (표 or 금지말):
        for m in rx.finditer(text):
            if 갈래 == '점수·순위':
                뒤 = re.split(r'[.!?。\n]', text[m.end():m.end() + 40], 1)[0]
                if _아님.search(뒤) or _곧없음.search(뒤):
                    continue
            w = m.group('w') if 'w' in rx.groupindex and m.group('w') else None
            out.append((갈래, w or m.group(0), m.start('w') if w else m.start(), 고칠말))
    return out

def plain_first(doc):
    """제목·부제 다음에 오는 본문 <p> 들(첫 <hr> 뒤부터). 답 첫 줄 검사용."""
    m = re.search(r'<p class="alt">.*?</p>', doc, re.S)
    after = doc[m.end():] if m else (doc.split('</h2>', 1)[1] if '</h2>' in doc else doc)
    return re.findall(r'<p>(.*?)</p>', after, re.S)[:3]

def check_blog(name, s):
    """블로그형 — 네이버 스마트에디터에 붙여넣는 글."""
    bad, warn = [], []
    m = re.search(r'<div id="doc">(.*?)\n  </div>', s, re.S)
    if not m:
        return ['본문 컨테이너 <div id="doc">를 못 찾았다. 복사 버튼이 무엇을 복사할지 모른다'], []
    doc = m.group(1)

    if '<table' in doc:
        bad.append('본문에 <table>이 있다. 네이버 모바일에서 본문이 통째로 밀린다. blockquote + ▸ 로 바꿔라')
    doc_cs = without_cards(doc)      # 명식 카드의 정해진 class·style 은 통과
    if re.search(r'style\s*=', doc_cs):
        bad.append('본문에 inline style이 있다. 네이버가 대부분 버린다')
    cls = set(re.findall(r'class="([^"]+)"', doc_cs)) - {'alt','tag'}
    if cls:
        bad.append('본문에 class가 남아 있다(%s). 네이버는 class를 버리므로 스타일이 안 따라간다' % ', '.join(sorted(cls)))
    if 'id="copy"' not in s:
        bad.append('복사 버튼이 없다')
    if not re.search(r'<h2>', doc):
        bad.append('<h2> 제목이 없다')
    if 'chaeksa.kr' not in doc:
        warn.append('chaeksa.kr 링크가 없다. 유입이 착지할 곳이 없다')
    if not re.search(r'#\S', doc):
        warn.append('해시태그가 없다. 네이버 검색 노출이 준다')

    # 격 성패 말 — 성격·기신 있음·구응·파격 넷만(feedback-four-verdict-terms). 「섰다·서 있다·띠었다·온전·흠 하나」는 사주쟁이도 안 쓰는 내 말이다.
    # 2026-09-15 사장님 「쓰지 말자 했잖아」 — 새 글 여덟 곳에서 또 나왔다. 검사기가 막는다.
    # 2026-09-22 깨졌·무너졌·떠 있·이레·잣대·순위·TOP·N위·몇 점 을 더했다(금지말 표).
    # 점수·순위는 「고침」 상자(옛날에 순위를 냈다고 밝히는 곳) 밖에서만 본다.
    줄글 = lambda h: strip(re.sub(r'<br\s*/?>|</p>|</li>|</h\d>|</blockquote>', '\n', h))
    고침밖 = re.sub(r'<blockquote>(?:(?!</blockquote>).)*?고침(?:(?!</blockquote>).)*?</blockquote>', '', doc, flags=re.S)
    hits = [h for h in 금지말찾기(줄글(doc)) if h[0] != '점수·순위'] \
         + [h for h in 금지말찾기(줄글(고침밖)) if h[0] == '점수·순위']
    for 갈래, _, 고칠말 in 금지말:
        words = sorted(set(re.sub(r'^\d+위$', 'N위', h[1]) for h in hits if h[0] == 갈래))
        if words:
            more = ' 외 %d개' % (len(words) - 8) if len(words) > 8 else ''
            bad.append('%s — 「%s」%s. %s' % (갈래, '」「'.join(words[:8]), more, 고칠말))

    # 내부 말 — 「규칙 6조」「법전」「41조」는 저와 사장님 사이 말이다. 독자는 모른다(2026-09-16 사장님). 「저희는 이렇게 봅니다」로.
    inner = re.findall(r'(규칙 \d+조|\d+조[는가이에]|법전|판정 모듈|판정키|조립기)', strip(doc))
    if inner:
        bad.append('내부 말 — 「%s」. 독자는 모른다. 「저희는 이렇게 봅니다」로 바꾼다' % '」「'.join(sorted(set(inner))))

    # 상담 내용을 실제 사례로 들먹이지 않는다(2026-09-16 사장님). 방법은 남기되 「지난 상담」「실제 사례」「의뢰인」은 안 나간다.
    # 「실제 상담 내용이 아닙니다」처럼 아니라고 밝히는 문장은 통과.
    tx = strip(doc).replace('실제 상담 내용이 아닙니다', '')
    case = re.findall(r'(지난 상담|저희가 본 실제 사례|실제 사례|실제로 계산했던 사례|의뢰인|상담에서 배운|이런 문의였습니다|이 문의는)', tx)
    if case:
        bad.append('상담 들먹임 — 「%s」. 상담 내용을 실제 사례로 쓰지 않는다. 만든 예로 바꾸고 「이해를 돕기 위해 만든 사례」라고 밝힌다' % '」「'.join(sorted(set(case))))

    # GEO 문(2026-09-15 사장님 「헛짓 = GEO 누락」) — 제목이 질문이면 첫 문단이 답이어야 한다.
    # AI 답변 엔진은 질문 제목 바로 아래 문장을 집어 간다. 「답부터 드리면」이 없으면 인용이 안 된다.
    h2 = re.search(r'<h2>(.*?)</h2>', doc, re.S)
    title = strip(h2.group(1)) if h2 else ''
    if re.search(r'(^왜 |나요\s*$|까요\s*$|인가요|하나요|얼마인가요)', title):
        first = [strip(x) for x in plain_first(doc)]
        if not first or not re.search(r'^(답부터|답은 |답부터 드리면)', first[0]):
            bad.append('GEO — 제목이 질문(「%s」)인데 첫 문단이 답이 아니다. 「답부터 드리면, …」으로 시작해야 AI가 집어 간다' % title[:30])
        elif len(first[0]) > 90:
            warn.append('GEO — 답 첫 줄이 %d자. 한 문장으로 짧게 해야 그대로 인용된다' % len(first[0]))

    # ── 값 검사 (2026-09-17) — 말만 보던 검사기가 **값**도 본다.
    # 엔진을 안 거친 택일 글이 교과서 시진표(미시=13:00~14:59)로 나가 독자가 댓글로 잡았다. 그 글대로 13:10 에 낳으면 다른 사주가 된다.
    # 「고침」 상자 안에서 옛 시각을 인용하는 것은 통과시킨다.
    값본문 = re.sub(r'<blockquote>(?:(?!</blockquote>).)*?고침(?:(?!</blockquote>).)*?</blockquote>', '', doc, flags=re.S)
    값글 = strip(값본문)
    교과서 = re.findall(r'(?<!\d)((?:0?[13579]|1[13579]|2[13]):00\s*[~∼\-–]\s*(?:0?[02468]|1[02468]|2[02]):59|(?:0?[13579]|1[13579]|2[13]):00\s*[~∼\-–]\s*(?:0?[13579]|1[13579]|2[13]):00)', 값글)
    if 교과서:
        bad.append('값 — 교과서 시진표 시각 「%s」. 책사는 진태양시로 본다(서울은 시계가 해보다 15~46분 빠르다). 엔진이 낸 시계 시각으로 적어라' % '」「'.join(sorted(set(교과서))[:4]))
    # 일주와 시주가 짝이 맞나 — 시간(時干)은 일간과 시지로 정해진다(甲己日 甲子時 …). 손으로 적으면 여기서 틀린다.
    천간, 지지 = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
    for 일, 시 in re.findall(r'([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*日[\s·,]*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*時', 값글):
        if 일[0] in 천간 and 시[0] in 천간 and 시[1] in 지지:
            기대 = 천간[(천간.index(일[0]) % 5 * 2 + 지지.index(시[1])) % 10]
            if 기대 != 시[0]:
                bad.append('값 — %s日 에 %s時 는 없다. %s시의 시간(時干)은 %s 이다' % (일, 시, 시[1], 기대))
    # 날짜와 일주가 맞나 — 월별 전수 자료(.taekil/_taekil.json)에 있는 달만 본다.
    try:
        import json as _json
        _d = _json.load(io.open(os.path.join(ROOT, '.taekil', '_taekil.json'), encoding='utf-8'))
        달일주 = {}
        for k, v in _d.items():
            달일주[int(k.split('-')[1])] = {r[0]: r[2] for r in v['d']}
        for 월, 날, 주 in re.findall(r'(\d{1,2})월\s*(\d{1,2})일[^。.]{0,40}?([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*日', 값글):
            참 = 달일주.get(int(월), {}).get(int(날))
            if 참 and 참 != 주:
                bad.append('값 — %s월 %s일은 %s日 이 아니라 %s日 이다(엔진 전수 자료)' % (월, 날, 주, 참))
    except Exception:
        pass

    # 본문 문단만 본다. 부제(.alt)와 해시태그(.tag)는 길어도 정상이다.
    plain = re.findall('<p>(.*?)</p>', doc, re.S)
    longs = [len(strip(x)) for x in plain if len(strip(x)) > 45 and '▸' not in x]
    if longs:
        warn.append('한 줄이 45자를 넘는 문단 %d개. 폰에서 서너 줄로 접힌다 (가장 긴 것 %d자)'
                    % (len(longs), max(longs)))
    hr = doc.count('<hr>')
    h3 = doc.count('<h3>')
    if h3 and hr < h3 - 1:
        warn.append('<h3> %d개인데 <hr> %d개. 단락 구분이 부족하다' % (h3, hr))
    return bad, warn

def check_report(name, s):
    """보고서형 — 의뢰인에게 보내는 한 장짜리."""
    bad, warn = [], []
    for m in re.finditer(r'<table>', s):
        head = s[max(0, m.start()-160):m.start()]
        if 'class="tw"' not in head:
            bad.append('%d행 근처의 <table>이 .tw로 안 감싸져 있다. 폰에서 가로로 잘린다'
                       % (s[:m.start()].count('\n')+1))
    if '@media print' not in s:
        warn.append('@media print가 없다. 인쇄하면 화면 그대로 나온다')
    if 'prefers-color-scheme' not in s:
        warn.append('다크모드 대응이 없다')
    if not re.search(r'class="say"', s):
        warn.append('"병원에 이렇게 말씀하세요" 상자가 없다. 보고서에서 제일 많이 쓰이는 부분이다')
    return bad, warn

def run(path):
    s = io.open(path, encoding='utf-8').read()
    name = os.path.basename(path)
    kind = '블로그형' if name.startswith('붙여넣기-') else ('보고서형' if '보고서' in name else None)
    if kind is None: return None
    b = Bal(); b.feed(s)
    bad, warn = (check_blog if kind == '블로그형' else check_report)(name, s)
    bad = b.err + bad
    left = [x for x in b.st if x[0] not in ('style','title','script')]
    if left: bad.append('안 닫힌 태그: ' + ', '.join('<%s>(%d행)'%x for x in left))
    return kind, name, bad, warn

def main():
    args = sys.argv[1:]
    files = args or sorted(glob.glob(os.path.join(ROOT, 'marketing', '*.html')))
    rows = [r for r in (run(f) for f in files) if r]
    if not rows:
        print('검사할 파일이 없다. 붙여넣기-*.html 또는 보고서*.html'); return 0
    fail = 0
    # 막힌 까닭을 갈래로 센다 — 말 때문에 막힌 글이 많아도 형식·값 문제가 묻히지 않게.
    말갈래 = tuple(g for g, _, _ in 금지말) + ('내부 말', '상담 들먹임')
    def 갈래of(x):
        if x.startswith(말갈래): return '말'
        if x.startswith('값'): return '값'
        if x.startswith('GEO'): return 'GEO'
        return '형식'
    tally = {}
    for kind, name, bad, warn in rows:
        mark = 'X' if bad else ('!' if warn else 'O')
        print('%s  [%s] %s' % (mark, kind, name))
        for x in bad:  print('     막힘  ' + x);
        for x in warn: print('     확인  ' + x)
        if bad: fail += 1
        for g in set(갈래of(x) for x in bad):
            tally[g] = tally.get(g, 0) + 1
    print('\n%d개 검사 · 막힘 %d개' % (len(rows), fail))
    if tally:
        print('막힌 까닭(글 수, 겹침 있음): ' + ' · '.join('%s %d' % (g, tally[g]) for g in ('형식', '값', 'GEO', '말') if g in tally))
    return 1 if fail else 0

if __name__ == '__main__':
    sys.exit(main())
