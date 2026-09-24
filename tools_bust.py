# -*- coding: utf-8 -*-
"""배포 시 정적 파일에 ?v=N 을 붙여 브라우저 캐시를 확실히 갱신한다.
   sw.js 의 캐시 이름(chaeksa-vN)과 버전을 맞춘다."""
import io, os, re, sys, subprocess

# 윈도에서 이 콘솔은 기본이 cp949 라, 검사 결과에 「—」 같은 글자가 있으면
# print 하다가 UnicodeEncodeError 로 죽는다. 검사는 통과했는데 배포가 막힌다(2026-09-10).
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

# (2026-09-20 사장님 「법전, 메모리 피드백 항목 제외하고 다 삭제해」 — 배포를 막던 검사 문을 뗐다. 검사는 python tools_check.py 로 따로 돌릴 수 있다.)

APP = r"C:\Users\LEE\Desktop\궁극의 책사\app"
FILES = ['style.css', 'config.js', 'track.js', 'cloud.js', 'usage.js', 'places.js', 'people.js', 'lunar.js', 'astro.js', 'engine.js', 'saenggeuk.js', 'gise.js', 'panjeong.js', 'questions.js', 'wongook.js', 'seolmyeongseo.js', 'chaeyong.js', 'brief.js', 'typecard.js', 'memo.js', 'classic.js', 'gwanjeom.js', 'taekilsim.js', 'gungtong-wonmun.js', 'samyeong.js', 'yeongyeok.js', 'ilju.js', 'jeongtong.js', 'stories.js', 'landing.js',
         'tongbyeon.js', 'rules-wealth-love.js', 'rules-health-study-move.js', 'consult.js', 'share.js', 'ai.js',
         'gyeokguk.js', 'chaeksadan.js', 'geunamja.js', 'maeum.js', 'gunghap.js', 'gunghap-gwanjeom.js', 'gunghap-chongnon.js', 'ssom-gwanjeom.js', 'ssom-wongo.js', 'ssom.js', 'sheets.js', 'hwakin.js', 'mun.js', 'mun/all.js', 'pay.js', 'app.js']

sw = io.open(os.path.join(APP, 'sw.js'), encoding='utf-8').read()
cur = int(re.search(r'chaeksa-v(\d+)', sw).group(1))
new = cur + 1 if '--bump' in sys.argv else cur
if new != cur:
    sw = sw.replace('chaeksa-v%d' % cur, 'chaeksa-v%d' % new)
    io.open(os.path.join(APP, 'sw.js'), 'w', encoding='utf-8').write(sw)

# 스크립트를 부르는 HTML 은 **전부** 여기서 버전을 올린다.
# 결제 화면 셋이 config·cloud·pay.js 를 버전 없이 불러서, pay.js 를 고쳐도 재방문자는
# 옛 파일을 물고 있었다 — 상품 그림이 결제 화면에만 안 뜬 게 그것이다(2026-09-11).
# 스크립트를 부르는 페이지를 새로 만들면 여기에 넣어야 한다.
PAGES = ['index.html', 'pay.html', 'pay-done.html', 'pay-fail.html', 'taekil.html', 'taekil-apply.html', 'taekil-sim.html', 'myeongsik.html', 'jeongtong.html', 'gunghap-chongnon.html', 'ssom.html', 'ssom-vn.html']
pages, tagged = {}, 0
for pg in PAGES:
    p = os.path.join(APP, pg)
    h = io.open(p, encoding='utf-8').read()
    for f in FILES:
        h = re.sub(r'(["\'])' + re.escape(f) + r'(\?v=\d+)?\1',
                   lambda m: '%s%s?v=%d%s' % (m.group(1), f, new, m.group(1)), h)
    io.open(p, 'w', encoding='utf-8').write(h)
    pages[pg] = h
    tagged += len(re.findall(r'\?v=%d' % new, h))
print('version', new)
print('tagged:', tagged, '(%s)' % ' · '.join(PAGES))

# -- 빠진 파일을 잡는다 --
# FILES 목록에 안 적힌 스크립트는 ?v= 가 안 올라가고, URL 이 안 바뀌니
# 브라우저가 영원히 옛 파일을 물고 있는다. 2026-08-28 gyeokguk.js 가 그랬다.
_pat_v  = re.compile(r'src=.([A-Za-z0-9_.-]+\.js)\?v=(\d+)')
_pat_no = re.compile(r'src=.([A-Za-z0-9_.-]+\.js)(?!\?)')
_missed, _notag = [], []
for pg, h in pages.items():
    _missed += [(pg, m.group(1), m.group(2)) for m in _pat_v.finditer(h) if int(m.group(2)) != new]
    _notag  += [(pg, m.group(1)) for m in _pat_no.finditer(h)]
if _missed or _notag:
    print()
    print('!! 버전이 안 올라간 스크립트가 있습니다 - FILES 목록에 넣으세요')
    for pg, f, v in _missed: print('   %-14s %-28s ?v=%s  (현재 %d)' % (pg, f, v, new))
    for pg, f in _notag:     print('   %-14s %-28s ?v= 없음' % (pg, f))
    sys.exit(1)
