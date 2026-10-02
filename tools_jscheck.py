# -*- coding: utf-8 -*-
"""배포 전 자바스크립트 문법 검사(10-02 멈춤 안전장치).

app/ 안의 모든 .js 를 node --check 로 열어 본다. 한 파일이라도 문법이 틀리면
그 파일을 부르는 화면이 손님 앞에서 통째로 멈춘다(09-20 pay.js 가 하루 두 번 죽었다).
말 · 금지어를 보는 검사(tools_check.py)와 다르다 — 이것은 「열리기는 하나」만 본다.

  tools_bust.py 가 파일을 고치기 전에 부른다. 틀린 파일이 있으면 배포를 멈추고 파일 · 줄을 보여 준다.
  혼자 돌리기: python tools_jscheck.py            (다른 폴더: python tools_jscheck.py <폴더>)

이름이 _ 로 시작하는 파일(점검 부스러기, .gitignore 에 있음)은 안 본다.
node 가 없는 컴퓨터에서는 경고만 하고 지나간다 — 검사 도구가 없다고 배포를 막지는 않는다.
"""
import os, re, sys, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')


def js_files(root):
    out = []
    for d, dirs, files in os.walk(root):
        dirs[:] = sorted(x for x in dirs if not x.startswith(('.', '_')) and x != 'node_modules')
        out += [os.path.join(d, n) for n in sorted(files) if n.endswith('.js') and not n.startswith('_')]
    return out


def _one(node, p):
    try:
        r = subprocess.run([node, '--check', p], capture_output=True, timeout=60)
        return p, r.returncode, r.stderr.decode('utf-8', 'replace')
    except Exception as e:  # 시간 초과 등 — 열어 보지 못한 것도 틀린 것으로 센다
        return p, 1, str(e)


def check(root=APP):
    """틀린 파일이 없으면 True."""
    node = shutil.which('node')
    if not node:
        print('!! node 가 없어 자바스크립트 문법 검사를 건너뜁니다')
        return True
    files = js_files(root)
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(lambda p: _one(node, p), files))
    bad = [(p, err) for p, code, err in res if code != 0]
    if not bad:
        print('js 문법 검사: %d개 모두 열림' % len(files))
        return True
    print()
    print('!! 문법이 틀린 자바스크립트 %d개 — 배포를 멈춥니다. 고친 뒤 다시 돌리세요.' % len(bad))
    for p, err in bad:
        print('   ' + os.path.relpath(p, root).replace('\\', '/'))
        for ln in err.splitlines():
            if ln.lstrip().startswith('at ') or ln.startswith('Node.js'):
                continue
            if ln.strip():
                print('      ' + ln.replace(root + os.sep, '').rstrip())
            if re.match(r'[A-Za-z]*Error\b', ln):   # 「SyntaxError: …」 줄까지만 보여 준다
                break
    return False


if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    sys.exit(0 if check(sys.argv[1] if len(sys.argv) > 1 else APP) else 1)
