# -*- coding: utf-8 -*-
"""marketing/*.html 에 <meta charset="utf-8"> 를 넣는다.

없으면 브라우저가 인코딩을 추측한다. 로컬 파일로 열거나 charset 을 안 붙이는
서버로 내보내면 한글이 통째로 깨진다(2026-09-09 대표이미지에서 실제로 깨졌다).
저장소는 CRLF 라 읽을 때 \\r\\n -> \\n, 쓸 때 되돌린다.
"""
import glob
import io
import os
import sys

META = '<meta charset="utf-8">'


def fix(path):
    with io.open(path, encoding='utf-8', newline='') as f:
        raw = f.read()
    crlf = '\r\n' in raw
    s = raw.replace('\r\n', '\n')
    if 'charset' in s:
        return False
    # <title> 앞에 넣는다. charset 은 문서 첫 1024바이트 안에 있어야 한다.
    i = s.lower().find('<title')
    if i < 0:
        i = 0
    s = s[:i] + META + '\n' + s[i:]
    if crlf:
        s = s.replace('\n', '\r\n')
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    return True


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    files = sorted(glob.glob(os.path.join(root, 'marketing', '*.html')))
    done = [p for p in files if fix(p)]
    print('%d개 검사 · %d개에 charset 넣음' % (len(files), len(done)))
    for p in done:
        print('  +', os.path.basename(p))


if __name__ == '__main__':
    sys.exit(main())
