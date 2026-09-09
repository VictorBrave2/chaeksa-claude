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

사용:  python tools_check.py
막힘(X)이 하나라도 있으면 배포하지 않는다. 확인(!)은 눈으로 보고 판단한다.
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


# ── 4) JS 가 만지는 DOM id 가 index.html 에 있는가 ────────────────
ID_IN_HTML = re.compile(r'\bid\s*=\s*["\']([\w-]+)["\']')
ID_TOUCH = re.compile(r"""(?:\$|getElementById)\(\s*['"]([\w-]+)['"]\s*\)""")
# 주석 안의 `$('memoSub')` 같은 설명을 코드로 읽으면 안 된다 — 지우고 나서 왜 지웠는지
# 적어 두면 그게 다시 걸린다. 실제로 그랬다(2026-09-10).
COMMENT = re.compile(r'//[^\n]*|/\*.*?\*/', re.S)


def strip_comments(s):
    return COMMENT.sub('', s)


def scan_dead_ids():
    html = read(os.path.join(APP, 'index.html'))
    defined = set(ID_IN_HTML.findall(html))
    # JS 가 문자열로 그려 넣는 id 도 「있는 것」으로 친다
    for f in js_files():
        defined |= set(ID_IN_HTML.findall(read(os.path.join(APP, f))))
    dead = {}
    for f in js_files():
        src = strip_comments(read(os.path.join(APP, f)))
        for name in set(ID_TOUCH.findall(src)):
            if name not in defined:
                dead.setdefault(f, []).append(name)
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


def main():
    막힘, 확인 = 0, 0

    print('1) 따옴표 안 줄바꿈')
    hit = False
    for f in js_files():
        src = read(os.path.join(APP, f))
        bad = scan(src)
        if bad:
            hit = True
            막힘 += 1
            print('  X %s %d행 — 따옴표 문자열 안에서 줄이 바뀜. 배포하면 앱이 죽는다' % (f, bad[0]))
            for ln in bad[:3]:
                print('      %d: %s' % (ln, src.split('\n')[ln - 1][:88]))
    if not hit:
        print('  O %d개 파일 이상 없음' % len(js_files()))

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
        for f, names in sorted(dead.items()):
            확인 += len(names)
            print('  ! %s — index.html 에 없는 id: %s' % (f, ', '.join(sorted(names))))
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

    print('\n' + '─' * 52)
    print('막힘 %d · 확인 %d' % (막힘, 확인))
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
