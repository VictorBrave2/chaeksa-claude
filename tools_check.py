# -*- coding: utf-8 -*-
"""JS 파일에 흔한 치명적 실수가 있는지 검사한다.

특히 이 프로젝트에서 반복해서 터진 버그를 잡는다:
  파이썬으로 문자열을 치환할 때 \\n 이 진짜 줄바꿈으로 들어가
  '...' 또는 "..." 문자열 안에서 줄이 바뀌어 SyntaxError가 난다.
  (백틱 템플릿 리터럴 안의 줄바꿈은 정상이므로 제외한다)

사용:  python tools_check.py
"""
import io, os, sys

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')

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

def main():
    files = [f for f in sorted(os.listdir(APP)) if f.endswith('.js')]
    problems = 0
    for f in files:
        src = io.open(os.path.join(APP, f), encoding='utf-8').read()
        bad = scan(src)
        if bad:
            problems += 1
            print('  [깨짐] %s - %d행 부근: 따옴표 문자열 안에서 줄이 바뀜' % (f, bad[0]))
            for ln in bad[:5]:
                print('         %d행: %s' % (ln, src.split('\n')[ln - 1][:90]))
    if problems:
        print('\n%d개 파일에 문제가 있습니다. 배포하면 앱이 통째로 죽습니다.' % problems)
        return 1
    print('  검사 통과 - %d개 파일에 따옴표 줄바꿈 문제 없음' % len(files))
    return 0

if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    sys.exit(main())
