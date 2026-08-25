# -*- coding: utf-8 -*-
"""배포 시 정적 파일에 ?v=N 을 붙여 브라우저 캐시를 확실히 갱신한다.
   sw.js 의 캐시 이름(chaeksa-vN)과 버전을 맞춘다."""
import io, os, re, sys

APP = r"C:\Users\LEE\Desktop\궁극의 책사\app"
FILES = ['style.css', 'config.js', 'cloud.js', 'lunar.js', 'astro.js', 'engine.js', 'brief.js', 'calendar.js',
         'compat.js', 'tongbyeon.js', 'rules-wealth-love.js', 'rules-health-study-move.js', 'consult.js', 'share.js', 'ai.js', 'app.js']

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
