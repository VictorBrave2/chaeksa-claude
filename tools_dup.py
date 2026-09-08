# -*- coding: utf-8 -*-
"""이름 덮어쓰기 검사 — 모듈 객체의 프로퍼티가 한 파일 안에 두 번 정의되는 걸 잡는다.

왜: 2026-09-09 `M.상태`(십신 상태 → 겉뿌/겉무/속/없)를 덮어써서 문장표 전반을
    깰 뻔했다. 이미 있는 이름인지 안 찾아보고 새로 만들어서 생긴 일이다.
    사람이 기억하는 대신 여기서 잡는다.

무엇을 보나: `global.ChaeksaXxx` 에 붙은 별칭(예: `const M = global.ChaeksaMun`)에 대한
             프로퍼티 대입만 본다. 캔버스·DOM 속성 대입은 안 본다.
             한 파일에서 여러 번 선언되는 이름은 지역 변수 재사용이므로 뺀다.

  python tools_dup.py                앱 전체
  python tools_dup.py app/mun.js     한 파일
"""
import io, os, re, sys, glob

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.abspath(__file__))
NL = chr(10)

DECL = r'(?:const|let|var)[ \t]+'
ALIAS = re.compile(DECL + r'([A-Za-z_$][\w$]*)[ \t]*=[ \t]*global\.(Chaeksa[\w$]*)')


def props_of(s, names):
    """names 안의 식별자에 대한 `X.prop =` 대입을 (이름, 프로퍼티, 줄번호)로 낸다"""
    if not names:
        return []
    pat = re.compile(r'^[ \t]*(' + '|'.join(re.escape(n) for n in sorted(names)) +
                     r')\.([\w가-힣$]+)[ \t]*=(?!=)', re.M)
    return [(m.group(1), m.group(2), s.count(NL, 0, m.start()) + 1) for m in pat.finditer(s)]


def check(path):
    s = io.open(path, encoding='utf-8').read().replace(chr(13) + NL, NL)
    lines = s.split(NL)
    names = set(m.group(1) for m in ALIAS.finditer(s))
    # 같은 이름을 여러 번 선언하면 모듈 별칭이 아니라 지역 변수 재사용이다 — 뺀다
    names = set(n for n in names
                if len(re.findall(DECL + re.escape(n) + r'[ \t]*=', s)) == 1)
    seen = {}
    for obj, prop, ln in props_of(s, names):
        seen.setdefault((obj, prop), []).append(ln)
    bad = dict((k, v) for k, v in seen.items() if len(v) > 1)
    name = os.path.basename(path)
    if not bad:
        tail = '  (모듈 ' + ', '.join(sorted(names)) + ')' if names else ''
        print('O  ' + name + tail)
        return 0
    print('X  ' + name)
    for (obj, prop), lns in sorted(bad.items(), key=lambda x: x[1][0]):
        print('     ' + obj + '.' + prop + ' 을 ' + str(len(lns)) + '번 정의합니다')
        for n in lns:
            print('       ' + str(n) + ': ' + lines[n - 1].strip()[:90])
    return len(bad)


if __name__ == '__main__':
    args = sys.argv[1:]
    files = [os.path.join(ROOT, a) for a in args] if args else sorted(
        glob.glob(os.path.join(ROOT, 'app', '*.js')))
    total = 0
    for f in files:
        total += check(f)
    print('')
    print(str(len(files)) + '개 검사 · 덮어쓴 이름 ' + str(total) + '개')
    sys.exit(1 if total else 0)
