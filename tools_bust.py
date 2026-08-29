# -*- coding: utf-8 -*-
"""배포 시 정적 파일에 ?v=N 을 붙여 브라우저 캐시를 확실히 갱신한다.
   sw.js 의 캐시 이름(chaeksa-vN)과 버전을 맞춘다."""
import io, os, re, sys, subprocess

# 배포 전 필수 검사 — 따옴표 문자열 안 줄바꿈이 있으면 앱이 통째로 죽는다
_here = os.path.dirname(os.path.abspath(__file__))
_r = subprocess.run([sys.executable, os.path.join(_here, 'tools_check.py')], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(_r.stdout.strip() or _r.stderr.strip())
if _r.returncode != 0:
    print('배포 중단: 위 문제를 먼저 고치세요.')
    sys.exit(1)

APP = r"C:\Users\LEE\Desktop\궁극의 책사\app"
FILES = ['style.css', 'config.js', 'track.js', 'cloud.js', 'usage.js', 'places.js', 'people.js', 'lunar.js', 'astro.js', 'engine.js', 'chaeyong.js', 'brief.js', 'typecard.js', 'memo.js', 'hyeopgi.js', 'classic.js', 'calendar.js',
         'compat.js', 'tongbyeon.js', 'rules-wealth-love.js', 'rules-health-study-move.js', 'consult.js', 'share.js', 'ai.js',
         'gyeokguk.js', 'pay.js', 'app.js']

sw = io.open(os.path.join(APP, 'sw.js'), encoding='utf-8').read()
cur = int(re.search(r'chaeksa-v(\d+)', sw).group(1))
new = cur + 1 if '--bump' in sys.argv else cur
if new != cur:
    sw = sw.replace('chaeksa-v%d' % cur, 'chaeksa-v%d' % new)
    io.open(os.path.join(APP, 'sw.js'), 'w', encoding='utf-8').write(sw)

html = io.open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
for f in FILES:
    html = re.sub(r'(["\'])' + re.escape(f) + r'(\?v=\d+)?\1',
                  lambda m: '%s%s?v=%d%s' % (m.group(1), f, new, m.group(1)), html)
io.open(os.path.join(APP, 'index.html'), 'w', encoding='utf-8').write(html)
print('version', new)
print('tagged:', len(re.findall(r'\?v=%d' % new, html)))

# -- 빠진 파일을 잡는다 --
# FILES 목록에 안 적힌 스크립트는 ?v= 가 안 올라가고, URL 이 안 바뀌니
# 브라우저가 영원히 옛 파일을 물고 있는다. 2026-08-28 gyeokguk.js 가 그랬다.
_pat_v  = re.compile(r'src=.([A-Za-z0-9_.-]+\.js)\?v=(\d+)')
_pat_no = re.compile(r'src=.([A-Za-z0-9_.-]+\.js)(?!\?)')
_missed = [(m.group(1), m.group(2)) for m in _pat_v.finditer(html) if int(m.group(2)) != new]
_notag  = [m.group(1) for m in _pat_no.finditer(html)]
if _missed or _notag:
    print()
    print('!! 버전이 안 올라간 스크립트가 있습니다 - FILES 목록에 넣으세요')
    for f, v in _missed: print('   %-28s ?v=%s  (현재 %d)' % (f, v, new))
    for f in _notag:     print('   %-28s ?v= 없음' % f)
    sys.exit(1)
