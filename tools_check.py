# -*- coding: utf-8 -*-
"""조용히 틀리는 것을 잡는다. 배포 전에 이것 하나만 돌리면 된다.

여기 있는 검사는 전부 **실제로 터진 뒤에** 넣은 것이다.
공통점은 하나다 — 오류가 안 난다. 그래서 사람이 못 찾는다.

  1) 따옴표 줄바꿈  파이썬으로 문자열을 치환할 때 \\n 이 진짜 줄바꿈으로 들어가
                    '...' 안에서 줄이 바뀐다. 앱이 통째로 죽는다. (네 번 터짐)
  2) 모듈 이름 덮어쓰기  M.상태(십신)를 M.상태(다른 뜻)로 덮었다. 문장표 전반이 깨질 뻔했다.
  3) 객체 안 이름 덮어쓰기  {_d: 날짜, ...v} 에서 v 가 _d(대운 점수)를 덮었다.
                    정렬이 날짜순이 아니라 점수순으로 돌았는데 오류는 안 났다. (2026-09-09)
  4) 없는 곳에 쓰기  서고를 지웠는데 app.js 가 그 id 에 계속 값을 썼다.
                    $() 가 null 을 주면 조용히 넘어가거나 그때서야 터진다. (2026-09-09)
  5) charset 없음   marketing/*.html 56개 중 51개에 없었다. 열어봐야 안다. (2026-09-09)
  6) 화면 금지말    app/*.js · app/mun/*.js · app/*.html 의 화면 문자열에 깨졌 · 떠 있 · 이레 · 잣대 ·
                    순위 · TOP5 · 1위 · 몇 점 · (41조) · 하늘 · 땅 이 들었나. 확인(!)으로만 낸다. (2026-09-22)
                    코드 안 판정키(객체 키 · === 비교 · includes 인자)는 화면 글이 아니라서 뺀다.
  7) 상품 약속 장부  상품 약속은 app/yaksok.js 장부 한 곳이다. 장부 꼴(파는 줄의 꼭 칸 · 값 「숫자+원」 없음 ·
                    「무료」라고 쓰지 않는 콘텐츠), 손으로 쓴 곳(약관 · 처리방침 · 검색 설명 · 화면 글)에 걷은 약속이
                    남았나, 만드는 시간 · 질문 수 · 보관 해가 장부와 같은가를 본다 — 어긋나면 막힘(X, 환불 · 표시광고).
                    장부 글을 다른 파일에 그대로 옮겨 적은 곳 · 사장님 확인 대기는 확인(!). (2026-10-02 — pay.html 이
                    걷은 「맞아요/아니에요」 · 옛 판 30장을 계속 팔았고, 무료 범위를 걷은 뒤 「1장 무료」가 남았다)

사용:  python tools_check.py
막힘(X)이 하나라도 있으면 배포하지 않는다. 확인(!)은 눈으로 보고 판단한다.
2026-09-20 부터 tools_bust.py 는 이 검사를 부르지 않는다(사장님 지시). 배포 전에 손으로 돌린다.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, 'app')
MARKETING = os.path.join(ROOT, 'marketing')


def read(path):
    return io.open(path, encoding='utf-8').read()


def js_files():
    return [f for f in sorted(os.listdir(APP)) if f.endswith('.js')]


def mun_files():
    """app/mun/*.js — 문장표. APP 기준 상대 경로('mun/…js')로 낸다."""
    d = os.path.join(APP, 'mun')
    if not os.path.isdir(d):
        return []
    return ['mun/' + f for f in sorted(os.listdir(d)) if f.endswith('.js')]


def html_files():
    return [f for f in sorted(os.listdir(APP)) if f.endswith('.html')]


# ── 1) 따옴표 안에서 줄이 바뀜 ────────────────────────────────────
# 원본 tools_check.py 의 scan() 을 그대로 쓴다. 정규식 리터럴(/[&<>"']/g)을
# 문자열로 오인하지 않도록 통째로 건너뛰는 처리가 들어 있다 — 다시 짜지 말 것.
def scan(src):
    """따옴표 문자열 안에서 줄이 바뀌는 지점을 찾는다. (줄번호 목록)"""
    bad = []
    i, n = 0, len(src)
    line = 1
    state = None          # None | "'" | '"' | '`' | '//' | '/*'
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '\n':
            if state in ("'", '"'):
                bad.append(line)
                state = None          # 한 번만 보고하고 회복
            elif state == '//':
                state = None
            line += 1
            i += 1
            continue
        if state is None:
            if c == '/' and nxt == '/': state = '//'; i += 2; continue
            if c == '/' and nxt == '*': state = '/*'; i += 2; continue
            if c == '/':
                # 정규식 리터럴일 수 있다 — 앞 글자로 구분해서 통째로 건너뛴다
                j = i - 1
                while j >= 0 and src[j] in ' 	': j -= 1
                prev = src[j] if j >= 0 else ''
                if prev in '(,=:[!&|?{};+-*%~^' or prev == '':
                    k, esc, cls = i + 1, False, False
                    while k < n:
                        ch = src[k]
                        if esc: esc = False
                        elif ch == chr(92): esc = True
                        elif ch == '[': cls = True
                        elif ch == ']': cls = False
                        elif ch == '/' and not cls: break
                        elif ch == chr(10): break
                        k += 1
                    i = k + 1; continue
            if c in ("'", '"', '`'):   state = c;   i += 1; continue
            i += 1; continue
        if state == '/*':
            if c == '*' and nxt == '/': state = None; i += 2; continue
            i += 1; continue
        if state == '//':
            i += 1; continue
        # 문자열 안
        if c == '\\':
            i += 2; continue
        if c == state:
            state = None
        i += 1
    return bad

# ── 3) 객체 리터럴에서 키를 적은 뒤에 오는 ...펼침 ────────────────
# `{ a: 1, ...v }` 는 v 가 a 를 덮는다. 오류 없이 값만 바뀐다.
# 되도록 펼침을 앞에 두면(`{ ...v, a: 1 }`) 내가 적은 것이 이긴다.
KEY_RE = re.compile(r'(?<![\w$.])([A-Za-z_$가-힣][\w$가-힣]*)\s*:')
SPREAD_RE = re.compile(r'\.\.\.\s*([A-Za-z_$][\w$]*)')


def scan_spread_after_keys(src):
    """{키:..., ...펼침} 꼴을 찾아 (행번호, 펼침이름, 앞선 키 몇 개) 를 낸다."""
    out = []
    depth_stack = []          # (여는 위치, 여기까지 나온 키 수)
    i, n, line = 0, len(src), 1
    while i < n:
        c = src[i]
        if c == '\n':
            line += 1
        elif c in ('"', "'", '`'):          # 문자열은 건너뛴다
            q, i = c, i + 1
            while i < n and src[i] != q:
                if src[i] == '\\':
                    i += 1
                elif src[i] == '\n':
                    line += 1
                i += 1
        elif c == '/' and i + 1 < n and src[i + 1] == '/':
            while i < n and src[i] != '\n':
                i += 1
            continue
        elif c == '/' and i + 1 < n and src[i + 1] == '*':
            i += 2
            while i + 1 < n and not (src[i] == '*' and src[i + 1] == '/'):
                if src[i] == '\n':
                    line += 1
                i += 1
            i += 1
        elif c == '{':
            depth_stack.append([line, 0])
        elif c == '[':
            # 배열 펼침 `[...new Set(x)]` 은 덮어쓰기가 아니다. 안쪽이 대괄호면 안 센다.
            depth_stack.append(None)
        elif c in '}]':
            if depth_stack:
                depth_stack.pop()
        elif depth_stack and depth_stack[-1] is not None:
            m = KEY_RE.match(src, i)
            if m and src[i - 1] not in '?':
                depth_stack[-1][1] += 1
                i = m.end()
                continue
            m = SPREAD_RE.match(src, i)
            if m and depth_stack[-1][1] > 0:
                out.append((line, m.group(1), depth_stack[-1][1]))
                i = m.end()
                continue
        i += 1
    return out


# ── 4) JS 가 만지는 DOM id 가 그 JS 를 부르는 html 에 있는가 ──────
# 처음엔 index.html 만 봤다. jeongtong.js 의 jtForm 은 jeongtong.html 에 있는데 「없다」고 떴다(2026-09-22).
# 이제 <script src="그 js"> 로 부르는 html 을 다 보고, 어디서도 안 부르면 index.html 을 본다.
ID_IN_HTML = re.compile(r'\bid\s*=\s*["\']([\w-]+)["\']')
SCRIPT_SRC = re.compile(r'<script\b[^>]*\bsrc\s*=\s*["\']([^"\'?#]+)', re.I)
HTML_COMMENT = re.compile(r'<!--.*?-->', re.S)


def callers_of(js):
    """app/js 를 <script src> 로 부르는 app/*.html 목록."""
    out = []
    for h in html_files():
        srcs = SCRIPT_SRC.findall(HTML_COMMENT.sub('', read(os.path.join(APP, h))))
        if any(os.path.basename(s) == js for s in srcs):
            out.append(h)
    return out
ID_TOUCH = re.compile(r"""(?:\$|getElementById)\(\s*['"]([\w-]+)['"]\s*\)""")
# 주석 안의 `$('memoSub')` 같은 설명을 코드로 읽으면 안 된다 — 지우고 나서 왜 지웠는지
# 적어 두면 그게 다시 걸린다. 실제로 그랬다(2026-09-10).
COMMENT = re.compile(r'//[^\n]*|/\*.*?\*/', re.S)


def strip_comments(s):
    return COMMENT.sub('', s)


def scan_midline_comment(src):
    """// 주석 뒤에 코드가 이어진 줄 — 한 줄짜리 함수 가운데 주석을 넣어 뒤가 잘린 사고(09-26 app.js 컷바꾸기). 문자열 · URL 안의 // 는 뺀다."""
    out = []
    for n, line in enumerate(src.split('\n'), 1):
        i = line.find('//')
        if i < 0 or 'http' in line[max(0, i - 6):i + 8]: continue
        if line.count("'", 0, i) % 2 or line.count('"', 0, i) % 2 or line.count('`', 0, i) % 2: continue
        tail = line[i + 2:]
        if re.search(r"[{};]\s*$", tail) and re.search(r"\b(if|return|const|let|var|function)\b\s*[(\s]|=>", tail):
            out.append((n, line.strip()[:120]))
    return out

def scan_dead_ids():
    """{js: (부르는 html 목록, [없는 id])}"""
    # JS 가 문자열로 그려 넣는 id 도 「있는 것」으로 친다
    drawn = set()
    for f in js_files():
        drawn |= set(ID_IN_HTML.findall(read(os.path.join(APP, f))))
    ids_of = {}
    dead = {}
    for f in js_files():
        pages = callers_of(f) or ['index.html']
        defined = set(drawn)
        for h in pages:
            if h not in ids_of:
                ids_of[h] = set(ID_IN_HTML.findall(read(os.path.join(APP, h))))
            defined |= ids_of[h]
        src = strip_comments(read(os.path.join(APP, f)))
        names = sorted(n for n in set(ID_TOUCH.findall(src)) if n not in defined)
        if names:
            dead[f] = (pages, names)
    return dead


# ── 5) marketing/*.html 에 charset 이 있는가 ──────────────────────
def scan_charset():
    if not os.path.isdir(MARKETING):
        return []
    out = []
    for f in sorted(os.listdir(MARKETING)):
        if f.endswith('.html') and 'charset' not in read(os.path.join(MARKETING, f)):
            out.append(f)
    return out


# ── 6) 화면 글에 금지말이 들었나 (확인만) ──────────────────────────
# 금지말 표는 tools_form.py 것을 같이 쓴다(격 성패 말 · 떠 있 · 이레 · 잣대 · 점수·순위).
# 여기서 조 번호와 하늘·땅을 더 본다.
#   조 번호 — 「(41조)」「법전 58조」는 저와 사장님 사이 말이다. 읽는 사람은 모른다.
#   하늘·땅 — 09-21 사장님 「천간 · 지지로 전체 바꿔야」. 이미 올라간 「왜」 글(why-*.html)은 「냅둬~」라 뺀다.
#            「기름진 땅 · 땅이 메마르고 · 창원 하늘의 해」 같은 보통 말은 두고, 글자 자리로 쓴 것만 본다
#            (하늘과 땅 · 하늘에 뜬/있/없 · 땅에 뿌리 · 하늘 글자 …).
#   점수·순위 — app/mun 문장표는 연애 질문이라 「순위」가 「먼저 챙기는 차례」 뜻이다. 거기선 안 본다.
화면만_금지 = [
    ('조 번호', re.compile(r'\(\s*\d{1,3}조[^()\n]{0,12}\)|(?:법전|규칙)\s*제?\s*\d{1,3}조'),
     '조 번호는 읽는 사람이 모른다. 뜻을 풀어 쓴다'),
    ('하늘·땅', re.compile(r'(?<![가-힣])(?:하늘\s?[·과와,]\s?땅|땅\s?[·과와,]\s?하늘'
                          r'|(?:하늘|땅)(?:에서|에|의|과|와|은|는|이|가|엔)?\s?'
                          r'(?:글자|뜬|떠|떴|있|없|숨|뿌리|기둥|자리|칸|쪽|드러))'),
     '천간 · 지지로 쓴다'),
]
SCREEN_SKIP_HTML = re.compile(r'^(tests_|google)')     # 검사용 쪽 · 서치콘솔 확인 파일
WHY_HTML = re.compile(r'^why-.*\.html$')


def js_strings(src):
    """JS 소스에서 문자열 조각의 (시작, 끝, 따옴표) 목록. 주석 · 정규식 · 템플릿 ${…} 안 코드는 빠진다.
    템플릿 문자열은 ${…} 앞뒤로 조각이 나뉜다(따옴표 자리에 '`')."""
    spans = []
    n = len(src)
    stack = []        # 템플릿 ${ } 안에서 중괄호 깊이

    def tpl(i):
        s = i
        while i < n:
            c = src[i]
            if c == '\\':
                i += 2
                continue
            if c == '`':
                spans.append((s, i, '`'))
                return i + 1, False
            if c == '$' and i + 1 < n and src[i + 1] == '{':
                spans.append((s, i, '`'))
                return i + 2, True
            i += 1
        spans.append((s, n, '`'))
        return n, False

    i = 0
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and nxt == '*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == '/':
            # 정규식 리터럴일 수 있다 — scan() 과 같은 방법으로 앞 글자를 보고 통째로 건너뛴다
            j = i - 1
            while j >= 0 and src[j] in ' \t\r\n':
                j -= 1
            prev = src[j] if j >= 0 else ''
            if prev in '(,=:[!&|?{};+-*%~^' or prev == '' or src[max(0, j - 5):j + 1] == 'return':
                k, esc, cls = i + 1, False, False
                while k < n:
                    ch = src[k]
                    if esc: esc = False
                    elif ch == '\\': esc = True
                    elif ch == '[': cls = True
                    elif ch == ']': cls = False
                    elif ch == '/' and not cls: break
                    elif ch == '\n': break
                    k += 1
                i = k + 1
                continue
            i += 1
            continue
        if c in ('"', "'"):
            k = i + 1
            while k < n and src[k] != c and src[k] != '\n':
                if src[k] == '\\':
                    k += 1
                k += 1
            spans.append((i + 1, k, c))
            i = k + 1
            continue
        if c == '`':
            i, expr = tpl(i + 1)
            if expr:
                stack.append(0)
            continue
        if stack:
            if c == '{':
                stack[-1] += 1
            elif c == '}':
                if stack[-1] == 0:
                    stack.pop()
                    i, expr = tpl(i + 1)
                    if expr:
                        stack.append(0)
                    continue
                stack[-1] -= 1
        i += 1
    return spans


# 판정키를 코드에서 쓰는 꼴 — 화면 글이 아니다.
_CALL_ARG = re.compile(r'(?:\.(?:includes|indexOf|lastIndexOf|has|get|delete|startsWith|endsWith|split|search|match|matchAll|replace|replaceAll|test)|\bnew RegExp|\bRegExp)\(\s*$')


def is_code_string(src, s, e, q):
    """'…' 문자열이 객체 키 · 비교 · 색인 · 찾기 인자 · 띄어쓰기 없는 짧은 말(판정키)이면 True.
    붙('깨졌다', …) · 판('잣대') · 판정: '깨졌다' 처럼 한 낱말짜리는 거의 늘 판정키다.
    화면 글은 띄어쓰기가 있는 말이다."""
    if q == '`':
        return False
    body = src[s:e]
    if len(body) <= 6 and not re.search(r'\s', body):
        return True
    j = s - 2
    while j >= 0 and src[j] in ' \t\r\n':
        j -= 1
    prev = src[j] if j >= 0 else ''
    k = e + 1
    while k < len(src) and src[k] in ' \t\r\n':
        k += 1
    nxt = src[k:k + 3]
    before = src[max(0, j - 30):j + 1]
    if nxt[:1] == ':' and prev in '{,':
        return True                                   # { '띠었다': … }
    if before.endswith(('==', '!=')) or nxt.startswith(('==', '!=')):
        return True                                   # x === '띠었다'
    if re.search(r'\bcase$', before):
        return True                                   # case '띠었다':
    if prev == '[' and nxt[:1] == ']':
        return True                                   # 표['띠었다']
    if prev == '(' and _CALL_ARG.search(src[max(0, j - 40):j + 1]):
        return True                                   # s.includes('떠 있')
    return False


def visible_js(src):
    """화면에 나갈 수 있는 문자열만 남기고 나머지는 빈칸으로 바꾼 사본(줄 · 위치 그대로)."""
    out = [ch if ch == '\n' else ' ' for ch in src]
    for s, e, q in js_strings(src):
        if is_code_string(src, s, e, q):
            continue
        out[s:e] = list(src[s:e])
    return ''.join(out)


_BLANK = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
_SCRIPT_BLOCK = re.compile(r'(<script\b[^>]*>)(.*?)(</script>)', re.S | re.I)
_ATTR_TEXT = re.compile(r'\b(?:alt|title|placeholder|aria-label|content)\s*=\s*"([^"]*)"', re.I)


def visible_html(src):
    """html 에서 사람이 읽는 글(본문 · alt · title · placeholder · meta content · 안쪽 script 문자열)만 남긴 사본."""
    s = HTML_COMMENT.sub(_BLANK, src)
    s = re.sub(r'<style\b.*?</style>', _BLANK, s, flags=re.S | re.I)
    scripts = []

    def take(m):
        body = m.group(2)
        if 'src=' not in m.group(1):
            scripts.append((m.start(2), visible_js(body)))
        return _BLANK(m)
    s = _SCRIPT_BLOCK.sub(take, s)
    out = list(s)
    # 태그는 지우고, 태그 안의 사람이 읽는 속성 값은 남긴다
    for m in re.finditer(r'<[^>]*>', s):
        tag = m.group(0)
        keep = [(m.start() + a.start(1), m.start() + a.end(1)) for a in _ATTR_TEXT.finditer(tag)]
        for p in range(m.start(), m.end()):
            if out[p] != '\n':
                out[p] = ' '
        for a, b in keep:
            out[a:b] = list(s[a:b])
    for off, vis in scripts:
        out[off:off + len(vis)] = list(vis)
    return ''.join(out)


def scan_screen_words():
    """[(파일, 행, 갈래, 찾은 말, 줄 발췌)]"""
    import tools_form
    out = []
    targets = [(f, 'js') for f in js_files() + mun_files()] + \
              [(f, 'html') for f in html_files() if not SCREEN_SKIP_HTML.match(f)]
    for f, kind in targets:
        src = read(os.path.join(APP, f))
        vis = visible_js(src) if kind == 'js' else visible_html(src)
        표 = [x for x in tools_form.금지말 if not (x[0] == '점수·순위' and f.startswith('mun/'))] \
           + [x for x in 화면만_금지 if not (x[0] == '하늘·땅' and WHY_HTML.match(f))]
        lines = src.split('\n')
        for 갈래, word, pos, _ in tools_form.금지말찾기(vis, 표):
            ln = vis.count('\n', 0, pos) + 1
            col = pos - (vis.rfind('\n', 0, pos) + 1)
            text = lines[ln - 1]
            out.append((f, ln, 갈래, word, text[max(0, col - 30):col + 40].strip()))
    return out


# ── 7) 상품 약속 장부(10-02) ──────────────────────────────────────
# tests_yaksok.html 의 라 · 마 와 같은 규칙이다. 걷은 약속 · 확인 대기 목록은 장부(yaksok.js) 안에 있다 — 두 검사가 같은 목록을 읽는다.
YAKSOK_START, YAKSOK_END = '/*장부 시작*/', '/*장부 끝*/'
# 손으로 쓴 곳 — 장부를 읽지 못하는 법 문서 · 정적 글과, 장부를 읽게 바꾼 화면 파일(남은 손글씨가 없는지)
YAKSOK_FILES = ['pay.html', 'terms.html', 'privacy.html', 'index.html', 'manifest.json', 'llms.txt', 'taekil.html',
                'taekil-apply.html', 'taekil-sample.html', 'pay-done.html', 'pay-fail.html', 'love.html', 'love.js', 'pair.js', 'home-cats.js',
                'app.js', 'pay.js', 'gunghap-gwanjeom.js', 'bunya.js', 'about.html']
YAKSOK_NUM = {   # 갈래: (꼴, 보는 파일) — about.html(10-02 개편 3묶음 책사 소개)은 상품 말을 장부에서 읽는다. 손으로 쓴 숫자가 끼면 여기서 잡는다
    '만드는 시간': (re.compile(r'(\d+)\s?분\s?(남짓|쯤)'),
                ['pay.html', 'terms.html', 'love.js', 'pair.js', 'index.html', 'pay-done.html', 'pay-fail.html', 'home-cats.js', 'about.html']),
    '질문 수': (re.compile(r'질문\s?(\d+)\s?개'),
              ['pay.html', 'terms.html', 'privacy.html', 'love.js', 'pair.js', 'index.html', 'llms.txt', 'gunghap-gwanjeom.js', 'home-cats.js', 'about.html']),
    '보관 해': (re.compile(r'(\d+)\s?년\s?동안'), ['pay.html', 'terms.html', 'privacy.html', 'love.js', 'pair.js', 'about.html']),
}
# 10-02 개편 3묶음 — 상품 소개 쪽 다섯(tools_sogae.py 가 장부 · 분야 표에서 만든다). 걷은 약속 · 시간 · 질문 수 · 보관 해는 여기서도 본다.
# 장부 글을 그대로 담는 것은 만든 쪽이라서 아래 「장부 글을 그대로 옮겨 적었다」 확인에서는 뺀다. tests_yaksok.html 도 같은 목록.
SOGAE_PAGES = ['love.html', 'pair.html', 'ssom.html', 'gunghap-chongnon.html', 'jeongtong.html']
YAKSOK_FILES += [f for f in SOGAE_PAGES if f not in YAKSOK_FILES]
# 10-02 「켜는 날」(출산택일 신청 = 사이트 신청서 → 결제 → 「내 보고서」) — 바깥 신청 폼 · 「사람이 직접」 · 「작업 전 전액 환불」 같은 걷은 약속이
# 택일 쪽 어디에도 다시 들어오지 않게 출산택일 쪽 전부(월별 · 궁통보감 · 질문 글 · 신청 · 견본 · 보고서 · 사장님 목록)와 택일 스크립트도 본다.
# 걷은 약속만 본다 — 숫자(시간 · 질문 수 · 보관 해)는 위 YAKSOK_NUM 목록 그대로. tests_yaksok.html 은 월별 쪽을 빼고 같은 목록을 본다.
TAEKIL_PAGES = sorted(f for f in os.listdir(APP) if re.match(r'taekil-[a-z0-9-]+\.html$', f)) if os.path.isdir(APP) else []
YAKSOK_FILES += [f for f in TAEKIL_PAGES + ['taekilsim.js', 'taekil-admin.js', 'taekil-report.js'] if f not in YAKSOK_FILES]
for _pat, _files in YAKSOK_NUM.values():
    _files += [f for f in SOGAE_PAGES if f not in _files]
YAKSOK_MUST =['탭', '상품이름', '단위', '한줄', '딱지', '받는것', '환불', '자리', '그림']


def load_yaksok():
    """장부 JSON(dict). 못 읽으면 None."""
    import json
    p = os.path.join(APP, 'yaksok.js')
    if not os.path.exists(p):
        return None
    src = read(p).replace('\r\n', '\n')
    a, b = src.find(YAKSOK_START), src.find(YAKSOK_END)
    if a < 0 or b < a:
        return None
    try:
        return json.loads(src[a + len(YAKSOK_START):b])
    except ValueError:
        return None


def _texts(v, out=None):
    out = [] if out is None else out
    if isinstance(v, str):
        out.append(v)
    elif isinstance(v, list):
        for x in v:
            _texts(x, out)
    elif isinstance(v, dict):
        for x in v.values():
            _texts(x, out)
    return out


def _visible_any(f, src):
    if f.endswith('.js'):
        return visible_js(src)
    if f.endswith('.html'):
        return visible_html(src)
    return src


def scan_yaksok():
    """(막힘 [글], 확인 [글]). 장부를 못 읽으면 막힘 하나."""
    T = load_yaksok()
    if not T or not isinstance(T.get('콘텐츠'), dict):
        return ['app/yaksok.js 장부(「장부 시작」 ~ 「장부 끝」 JSON)를 읽지 못했다'], []
    bad, warn = [], []
    rows = T['콘텐츠']
    for k, r in rows.items():
        if r.get('코드'):
            for c in YAKSOK_MUST:
                if not r.get(c):
                    bad.append('장부 %s 줄에 %s 칸이 없다' % (k, c))
            if '{값}' not in (r.get('딱지') or ''):
                bad.append('장부 %s 줄 딱지에 {값} 자리가 없다(값은 상품표에서 붙인다)' % k)
            if r.get('그림') and not os.path.exists(os.path.join(APP, r['그림'])):
                bad.append('장부 %s 줄 그림 %s 이 없다' % (k, r['그림']))
            if r.get('견본') and not os.path.exists(os.path.join(APP, r['견본'])):   # 10-02 개편 3묶음 — 결제 전에 여는 견본 쪽
                bad.append('장부 %s 줄 견본 쪽 %s 이 없다' % (k, r['견본']))
        elif '{값}' in (r.get('딱지') or ''):
            bad.append('장부 %s 줄은 무료인데 딱지에 {값} 자리가 있다' % k)
        for t in _texts(r):
            if re.search(r'\d[\d,]*\s?원(?![가-힣])', t):
                bad.append('장부 %s 줄에 값(숫자+원) — 값은 상품표(products) 한 곳: %s' % (k, t[:40]))
    for k in T.get('무료라고 쓰지 않는 콘텐츠', []):
        if any('무료' in t for t in _texts(rows.get(k, {}))):
            bad.append('장부 %s 줄에 「무료」 — 10-02 사장님 「무료범위없이 예시만」' % k)
    vis = {}
    for f in YAKSOK_FILES:
        p = os.path.join(APP, f)
        if os.path.exists(p):
            vis[f] = _visible_any(f, read(p))
    for f, v in vis.items():
        for phrase in T.get('걷은 약속', []):
            for m in re.finditer(re.escape(phrase), v):
                bad.append('%s %d행 — 걷은 약속 「%s」' % (f, v.count('\n', 0, m.start()) + 1, phrase))
    for x in T.get('확인 대기', []):
        v = vis.get(x.get('곳'), '')
        if x.get('글') and x['글'] in v:
            warn.append('%s 「%s」 — 사장님 확인 대기: %s' % (x['곳'], x['글'], x.get('까닭', '')))
    norm = lambda m: re.sub(r'\s', '', m.group(0))
    every = '\n'.join(_texts(rows))
    for 갈래, (pat, files) in YAKSOK_NUM.items():
        ok = set(norm(m) for m in pat.finditer(every))
        for f in files:
            for m in pat.finditer(vis.get(f, '')):
                if norm(m) not in ok:
                    bad.append('%s %d행 — %s 「%s」가 장부(%s)와 다르다' % (f, vis[f].count('\n', 0, m.start()) + 1, 갈래, m.group(0), ' · '.join(sorted(ok)) or '없음'))
    terms = vis.get('terms.html', '')
    for k, r in rows.items():
        if r.get('코드') and '분' in (r.get('시간') or '') and r['시간'] not in terms:
            bad.append('terms.html — %s 만드는 시간 「%s」가 약관에 없다(약관 9절과 장부를 같이 고친다)' % (k, r['시간']))
    long_texts = set()
    for r in rows.values():
        for t in _texts([r.get('한줄'), r.get('미리'), r.get('만듦'), r.get('보관'), r.get('환불'), r.get('받는것'), r.get('신청')]):
            if len(t) >= 12:
                long_texts.add(t)
    for f, v in vis.items():
        if f in SOGAE_PAGES:      # 장부에서 만든 쪽 — 손으로 옮겨 적은 것이 아니다(tools_sogae.py)
            continue
        for t in sorted(long_texts):
            if t in v:
                warn.append('%s — 장부 글을 그대로 옮겨 적었다(장부에서 읽게): %s…' % (f, t[:30]))
    return bad, warn


# ── 8) 사업자 정보 — 홈 바닥글과 글자 하나까지 같은가(10-02 개편 3묶음 책사 소개) ──────
# 통신판매업자는 초기화면(홈 바닥글)에 사업자 정보를 드러낸다. 같은 값을 손으로 옮겨 적은 쪽(책사 소개 · 유료 상품과 환불)이
# 한 곳만 고쳐져 어긋나면 막는다. 바닥글의 사업자 줄(숫자가 든 줄)을 「 · 」로 나눈 조각이 그 쪽 화면 글에 그대로 있어야 한다.
BIZ_FILES = ['about.html', 'pay.html']


def scan_biz():
    """(막힘 [글], 조각 수)."""
    idx = os.path.join(APP, 'index.html')
    if not os.path.exists(idx):
        return ['app/index.html 이 없다'], 0
    src = read(idx)
    m = re.search(r'<footer>([\s\S]*?)</footer>', src)
    if not m:
        return ['index.html 에 <footer> 가 없다'], 0
    foot = re.sub(r'<!--[\s\S]*?-->', ' ', m.group(1))
    foot = re.sub(r'<br\s*/?>', '\n', foot)
    foot = re.sub(r'<[^>]+>', '', foot)
    pieces = [p.strip() for line in foot.split('\n') if re.search(r'\d', line)
              for p in line.split('·') if p.strip()]
    if not pieces:
        return ['index.html 바닥글에서 사업자 정보 줄을 찾지 못했다'], 0
    bad = []
    for f in BIZ_FILES:
        p = os.path.join(APP, f)
        if not os.path.exists(p):
            bad.append('%s 이 없다' % f)
            continue
        v = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', re.sub(r'<!--[\s\S]*?-->', ' ', read(p))))
        for piece in pieces:
            if re.sub(r'\s+', ' ', piece) not in v:
                bad.append('%s — 바닥글의 「%s」가 없다(바닥글 · 약관 11절과 같이 고친다)' % (f, piece))
    return bad, len(pieces)


def main():
    막힘, 확인 = 0, 0

    print('1) 따옴표 안 줄바꿈')
    hit = False
    quote_files = js_files() + mun_files()      # 문장표(app/mun)도 본다 — 2026-09-22
    for f in quote_files:
        src = read(os.path.join(APP, f))
        bad = scan(src)
        if bad:
            hit = True
            막힘 += 1
            print('  X %s %d행 — 따옴표 문자열 안에서 줄이 바뀜. 배포하면 앱이 죽는다' % (f, bad[0]))
            for ln in bad[:3]:
                print('      %d: %s' % (ln, src.split('\n')[ln - 1][:88]))
    if not hit:
        print('  O %d개 파일 이상 없음 (app %d · app/mun %d)'
              % (len(quote_files), len(js_files()), len(mun_files())))

    print('\n1-2) 한 줄 가운데 주석 — // 뒤에 코드가 이어진 줄(09-26 app.js 컷바꾸기 사고)')
    mid = []
    for f in js_files():
        for n, l in scan_midline_comment(read(os.path.join(APP, f))):
            mid.append('%s:%d — %s' % (f, n, l))
    if mid:
        막힘 += len(mid)
        for m in mid: print('  X ' + m)
    else:
        print('  O 없음')

    print('\n2) 모듈 이름 덮어쓰기')
    try:
        import tools_dup
        # tools_dup.check() 는 파일마다 제 결과를 찍고 덮어쓴 개수를 낸다.
        # 여기서는 요약만 내고 싶으니 찍는 것을 잠깐 모아 두었다가, 걸린 것만 보여준다.
        import contextlib
        bad_files = []
        for f in js_files():
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                cnt = tools_dup.check(os.path.join(APP, f))
            if cnt:
                bad_files.append((f, buf.getvalue().rstrip()))
        if bad_files:
            막힘 += len(bad_files)
            for f, detail in bad_files:
                print('  X %s' % f)
                for ln in detail.split('\n')[1:]:
                    print('    ' + ln.strip())
        else:
            print('  O %d개 파일에 덮어쓴 이름 없음' % len(js_files()))
    except Exception as e:
        print('  ? tools_dup 을 못 돌렸다: %s' % e)

    print('\n3) 객체 안에서 키 뒤에 오는 ...펼침')
    hit = False
    for f in js_files():
        for line, name, cnt in scan_spread_after_keys(read(os.path.join(APP, f))):
            hit = True
            확인 += 1
            print('  ! %s %d행 — 키 %d개를 적은 뒤 ...%s. %s 가 그 키를 덮을 수 있다'
                  % (f, line, cnt, name, name))
    if not hit:
        print('  O 키 뒤에 오는 펼침 없음')

    print('\n4) 없는 id 에 쓰기')
    dead = scan_dead_ids()
    if dead:
        for f, (pages, names) in sorted(dead.items()):
            확인 += len(names)
            print('  ! %s — %s 에 없는 id: %s' % (f, ' · '.join(pages), ', '.join(names)))
    else:
        print('  O JS 가 만지는 id 가 전부 화면에 있다')

    print('\n5) marketing charset')
    miss = scan_charset()
    if miss:
        확인 += len(miss)
        print('  ! charset 없는 파일 %d개 — python tools_charset.py 로 넣는다' % len(miss))
        for f in miss[:5]:
            print('      %s' % f)
    else:
        print('  O 전부 있음')

    print('\n6) 화면 글 금지말 (확인만 — 막지 않는다)')
    words = scan_screen_words()
    if words:
        확인 += len(words)
        # 월별 글(taekil-YYYY-MM*.html)은 생성기 하나에서 나오니 한 묶음으로 보인다.
        group_of = lambda f: re.sub(r'^taekil-\d{4}-\d{2}', 'taekil-YYYY-MM', f)
        by_group = {}
        for f, ln, 갈래, word, text in words:
            by_group.setdefault(group_of(f), []).append((f, ln, 갈래, word, text))
        print('  ! %d곳 · %d개 파일' % (len(words), len(set(w[0] for w in words))))
        for grp in sorted(by_group, key=lambda x: (-len(by_group[x]), x)):
            hits = by_group[grp]
            files = sorted(set(h[0] for h in hits))
            kinds = {}
            for _, _, 갈래, word, _ in hits:
                kinds.setdefault(갈래, set()).add(re.sub(r'^\d+위$', 'N위', word))
            name = grp if len(files) == 1 else '%s (%d개 파일, 월별 글 생성기에서 나옴)' % (grp, len(files))
            print('  ! %s %d곳 — %s' % (name, len(hits), ' · '.join(
                '%s「%s」' % (g, '」「'.join(sorted(w)[:4])) for g, w in sorted(kinds.items()))))
            shown = set()
            for f, ln, 갈래, word, text in hits:
                if 갈래 in shown:
                    continue
                shown.add(갈래)
                print('      %s%d: %s' % ('' if len(files) == 1 else f + ' ', ln, text[:80]))
    else:
        print('  O 화면 문자열에 금지말 없음')

    print('\n7) 상품 약속 장부(app/yaksok.js) — 걷은 약속 · 만드는 시간 · 질문 수 · 보관 해')
    y_bad, y_warn = scan_yaksok()
    for x in y_bad:
        print('  X ' + x)
    for x in y_warn:
        print('  ! ' + x)
    막힘 += len(y_bad)
    확인 += len(y_warn)
    if not y_bad and not y_warn:
        print('  O 장부 꼴 · 손으로 쓴 곳 %d개 파일 모두 장부와 같다' % len(YAKSOK_FILES))
    elif not y_bad:
        print('  O 막힘 없음 — 위 확인(!)만 눈으로 본다')

    print('\n8) 사업자 정보 — 홈 바닥글과 같은가(%s)' % ' · '.join(BIZ_FILES))
    b_bad, b_n = scan_biz()
    for x in b_bad:
        print('  X ' + x)
    막힘 += len(b_bad)
    if not b_bad:
        print('  O 바닥글 조각 %d개가 %d개 파일에 그대로 있다' % (b_n, len(BIZ_FILES)))

    # 10-02 개편 3묶음 — 상품 소개 쪽 다섯 · 미리보기 그림 · 사이트맵은 tools_sogae.py 가 장부 · 분야 표에서 만든다.
    # 장부를 고치고 아직 다시 만들지 않았으면 확인(!) — 배포(tools_bust.py --bump) 때 저절로 다시 만든다. 만들다 죽으면 막힘.
    print('\n9) 상품 소개 쪽 · 미리보기 · 사이트맵(tools_sogae.py) — 장부와 같은가')
    try:
        import tools_sogae
        s_bad, s_warn = tools_sogae.check()
    except Exception as e:
        s_bad, s_warn = ['tools_sogae.py 를 못 돌렸다: %s' % e], []
    for x in s_bad:
        print('  X ' + x)
    for x in s_warn:
        print('  ! ' + x)
    막힘 += len(s_bad)
    확인 += len(s_warn)
    if not s_bad and not s_warn:
        print('  O 소개 쪽 · 미리보기 그림 · 사이트맵이 장부 · 쪽 목록과 같다')

    print('\n' + '─' * 52)
    print('막힘 %d · 확인 %d' % (막힘, 확인) + (' (그중 화면 금지말 %d곳)' % len(words) if words else ''))
    if 막힘:
        print('막힘이 있으면 배포하지 않는다.')
        return 1
    if 확인:
        print('확인은 눈으로 보고 판단한다. 일부러 그런 것이면 그냥 둔다.')
    return 0


if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    sys.exit(main())
