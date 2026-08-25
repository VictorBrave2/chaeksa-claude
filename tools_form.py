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

def check_blog(name, s):
    """블로그형 — 네이버 스마트에디터에 붙여넣는 글."""
    bad, warn = [], []
    m = re.search(r'<div id="doc">(.*?)\n  </div>', s, re.S)
    if not m:
        return ['본문 컨테이너 <div id="doc">를 못 찾았다. 복사 버튼이 무엇을 복사할지 모른다'], []
    doc = m.group(1)

    if '<table' in doc:
        bad.append('본문에 <table>이 있다. 네이버 모바일에서 본문이 통째로 밀린다. blockquote + ▸ 로 바꿔라')
    if re.search(r'style\s*=', doc):
        bad.append('본문에 inline style이 있다. 네이버가 대부분 버린다')
    cls = set(re.findall(r'class="([^"]+)"', doc)) - {'alt','tag'}
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
    for kind, name, bad, warn in rows:
        mark = 'X' if bad else ('!' if warn else 'O')
        print('%s  [%s] %s' % (mark, kind, name))
        for x in bad:  print('     막힘  ' + x); 
        for x in warn: print('     확인  ' + x)
        if bad: fail += 1
    print('\n%d개 검사 · 막힘 %d개' % (len(rows), fail))
    return 1 if fail else 0

if __name__ == '__main__':
    sys.exit(main())
