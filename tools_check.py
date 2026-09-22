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
