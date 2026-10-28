# -*- coding: utf-8 -*-
"""배포 시 정적 파일에 ?v=지문(그 파일 내용의 sha1 앞 10자, 10-02 개편 3묶음)을 붙여 바뀐 파일만 브라우저가 새로 받게 한다.
   --bump 는 sw.js 의 캐시 이름(chaeksa-vN)을 올린다 — 서비스 워커 파일이 바뀌어야 브라우저가 새 일꾼을 받는다."""
import io, os, re, sys, subprocess

# 윈도에서 이 콘솔은 기본이 cp949 라, 검사 결과에 「—」 같은 글자가 있으면
# print 하다가 UnicodeEncodeError 로 죽는다. 검사는 통과했는데 배포가 막힌다(2026-09-10).
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

# (2026-09-20 사장님 「법전, 메모리 피드백 항목 제외하고 다 삭제해」 — 배포를 막던 검사 문을 뗐다. 검사는 python tools_check.py 로 따로 돌릴 수 있다.)

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')   # 10-28 자기 폴더의 app — 떨어진 작업 자리(worktree)에서 돌려도 원래 폴더를 건드리지 않게

# 10-02 멈춤 안전장치 — 아무 파일도 고치기 전에 app/ 의 모든 .js 가 문법상 열리는지 node --check 로 본다.
# 한 파일이라도 틀리면 여기서 멈추고 파일 · 줄을 보여 준다(버전도 안 올리고 HTML 도 안 건드린다).
# 말 · 금지어 검사(tools_check.py)는 여전히 배포를 막지 않는다 — 이것은 「열리기는 하나」만 본다.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_jscheck
if not tools_jscheck.check(APP):
    sys.exit(1)

# 10-23 화면 글 검사기 — 무작위 명식 120개로 손님 화면을 실제로 그려 깨진 글(「정불(화)」 · 틀린 조사 · {틀} · 엔진 표시)을 찾는다.
# 비공개 저장소에 검사기가 있을 때만 돈다. HARD 가 나오면(끝 코드 1) 여기서 멈춘다 — 버전도 HTML 도 안 건드린다.
SCAN = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'chaeksa-behavior-core', 'tools', 'hwamyeon-scan.js')
if os.path.exists(SCAN):
    r = subprocess.run(['node', SCAN, '--n', '120', '--app', APP], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode == 1:
        print(r.stdout + r.stderr)
        print('화면 글 검사에서 HARD 가 나와 배포를 멈춥니다(버전 그대로). 고친 뒤 다시 돌려 주세요.')
        sys.exit(1)
    print('화면 글 검사: ' + (r.stdout.strip().splitlines() or ['(출력 없음)'])[-1])

FILES = ['style.css', 'taekil-report-decision.css', 'landing-cuts.webp', 'config.js', 'track.js', 'cloud.js', 'usage.js', 'places.js', 'people.js', 'lunar.js', 'astro.js', 'engine.js', 'saenggeuk.js', 'gise.js', 'panjeong.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js', 'today-pieces.js', 'today.js', 'today.css', 'byeonhwa-jogak.js', 'byeonhwa.js', 'love.js', 'pair.js', 'yaksok.js', 'oryu.js', 'bunya.js', 'home-cats.js', 'home-ask.js', 'questions.js', 'wongook.js', 'seolmyeongseo.js', 'chaeyong.js', 'brief.js', 'typecard.js', 'memo.js', 'classic.js', 'gwanjeom.js', 'taekilsim.js', 'taekil-read.js', 'myeongsik-card.js', 'taekil-report.js', 'taekil-admin.js', 'gyeolhon-admin.js', 'gyeolhon-apply.js', 'ilgyeol-admin.js', 'ilgyeol-apply.js', 'gungtong-wonmun.js', 'samyeong.js', 'yeongyeok.js', 'ilju.js', 'jeongtong-prose.js', 'jeongtong-classic-reading.js', 'jeongtong-model-reading.js', 'jeongtong-distinct-reading.js', 'jeongtong.js', 'jeongtong-story.js', 'promo-art.js', 'jeongtong-share.js', 'jeongtong-share.css', 'jeongtong-pyo.js', 'jeongtong-evidence.js', 'jeongtong-pyo.css', 'stories.js', 'landing.js',
         'tongbyeon.js', 'rules-wealth-love.js', 'rules-health-study-move.js', 'consult.js', 'share.js', 'ai.js',
         'gyeokguk.js', 'chaeksadan.js', 'geunamja.js', 'maeum.js', 'gunghap.js', 'gunghap-gwanjeom.js', 'gunghap-1cheung.js', 'gunghap-chongnon.js', 'ssom-gwanjeom.js', 'ssom-wongo.js', 'ssom-baram.js', 'ssom-dangye.js', 'ssom-daehwa.js', 'ssom-webtoon.js', 'ssom-webtoon-2.js', 'ssom-webtoon-3.js', 'ssom-webtoon-check.js', 'ssom-score.js', 'ssom-score-mal.js', 'ssom-card.js', 'ssom-card-mal.js', 'ssom.js', 'jt-webtoon.js', 'jt-webtoon-2.js', 'jt-webtoon-check.js', 'jt-webtoon-proto.js', 'sheets.js', 'hwakin.js', 'mun.js', 'mun/all.js', 'jamgeum-mal.js', 'pay.js', 'when.js', 'when-chart.js', 'when-reading-copy.js', 'when-chart.css', 'when-copy.js', 'brain.js', 'brain-copy.js', 'gwi.js', 'gwi-copy.js', 'myeongban.js', 'myeongban-prose.js', 'myeongban-reading.js', 'myeongban-filter.js', 'myeongban-filter.css', 'myeongban-editorial.js', 'myeongban-editorial.css', 'myeongban-companion.js', 'myeongban-companion.css', 'myeongban-copy.js', 'gyeokgi.js', 'gyeokgi-copy.js', 'saram.js', 'saram-copy.js', 'taekil-why.js', 'taekil-why-copy.js', 'app.js']

sw = io.open(os.path.join(APP, 'sw.js'), encoding='utf-8').read()
cur = int(re.search(r'chaeksa-v(\d+)', sw).group(1))
new = cur + 1 if '--bump' in sys.argv else cur
if new != cur:
    sw = sw.replace('chaeksa-v%d' % cur, 'chaeksa-v%d' % new)
    io.open(os.path.join(APP, 'sw.js'), 'w', encoding='utf-8').write(sw)
    # 10-24 홈 칸 그림 꼬리(home-cats.js 그림판) — 그림 파일은 이름이 같아 바꿔 끼워도 캐시가 옛것을 보여 줬다(사장님 「안 바뀌었는데」)
    hc_path = os.path.join(APP, 'home-cats.js'); hc = io.open(hc_path, encoding='utf-8').read()
    hc2 = re.sub(r"var 그림판 = 'v\d+'", "var 그림판 = 'v%d'" % new, hc)
    if hc2 != hc: io.open(hc_path, 'w', encoding='utf-8', newline='').write(hc2)

# 스크립트를 부르는 HTML 은 **전부** 여기서 버전을 올린다.
# 결제 화면 셋이 config·cloud·pay.js 를 버전 없이 불러서, pay.js 를 고쳐도 재방문자는
# 옛 파일을 물고 있었다 — 상품 그림이 결제 화면에만 안 뜬 게 그것이다(2026-09-11).
# 스크립트를 부르는 페이지를 새로 만들면 여기에 넣어야 한다.
PAGES = ['index.html', 'taekil-report-guide.html', 'read.html', 'jt-wongo-view.html', 'tests_jt.html', 'pay.html', 'pay-done.html', 'pay-fail.html', 'taekil.html', 'taekil-apply.html', 'taekil-sim.html', 'taekil-sample.html', 'myeongsik.html', 'love.html', 'pair.html', 'jeongtong.html', 'gunghap-chongnon.html', 'gunghap-new-sample.html', 'gunghap-yetchaek-sample.html', 'ssom.html', 'ssom-vn.html', 'ssom-wongo-view.html', 'tests_ssom.html', 'tests_byeonhwa.html', 'tests_bunya.html', 'tests_yaksok.html', 'tests_taekilread.html', 'taekil-report.html', 'taekil-admin.html', 'tests_taekilreport.html', 'about.html', 'when.html', 'brain.html', 'gwi.html', 'myeongban.html', 'gyeolhon.html', 'gyeolhon-sample.html', 'gyeolhon-admin.html', 'gyeolhon-apply.html', 'ilgyeol.html', 'ilgyeol-admin.html', 'ilgyeol-apply.html', 'ilgyeol-report.html', 'gyeokgi.html', 'saram.html', 'today.html']
# 10-02 개편 3묶음 「빠르기」 — ?v= 뒤는 이제 배포 번호가 아니라 **그 파일 내용의 지문**(sha1 앞 10자)이다.
# 전에는 배포마다 모든 파일의 ?v= 가 함께 올라서, 파일 하나만 고쳐도 다시 온 손님이 스크립트 전부(1.2MB)를 다시 받았다.
# 이제 바뀐 파일만 주소가 바뀐다. 서비스 워커(sw.js)는 지문 붙은 주소를 캐시에서 먼저 꺼낸다 — 같은 지문은 언제나 같은 내용이라서.
# 그러니 **파일을 고친 뒤에는 꼭 이 도구를 다시 돌리고 올린다**(고친 뒤 지문을 안 붙이고 올리면, 다시 온 손님은 옛 내용을 계속 본다).
# 줄 끝(CRLF/LF)만 다른 것은 같은 내용으로 본다. 파일이 없으면 지문 대신 배포 번호(서비스 워커는 숫자 ?v= 를 네트워크 먼저로 받는다).
import hashlib
def 지문(f):
    try:
        b = open(os.path.join(APP, f), 'rb').read()
    except OSError:
        return None
    return hashlib.sha1(b.replace(b'\r\n', b'\n')).hexdigest()[:10]
VER = {f: (지문(f) or str(new)) for f in FILES}

pages, tagged = {}, 0
for pg in PAGES:
    p = os.path.join(APP, pg)
    h = io.open(p, encoding='utf-8').read()
    for f in FILES:
        h, n = re.subn(r'(["\'])' + re.escape(f) + r'(\?v=[0-9a-z]+)?\1',
                       lambda m: '%s%s?v=%s%s' % (m.group(1), f, VER[f], m.group(1)), h)
        tagged += n
    io.open(p, 'w', encoding='utf-8').write(h)
    pages[pg] = h
print('version', new, '(서비스 워커 판 · 파일 ?v= 는 내용 지문)')
print('tagged:', tagged, '(%s)' % ' · '.join(PAGES))

# -- 빠진 파일을 잡는다 --
# FILES 목록에 안 적힌 스크립트는 ?v= 가 안 바뀌고, URL 이 안 바뀌니
# 브라우저가 영원히 옛 파일을 물고 있는다. 2026-08-28 gyeokguk.js 가 그랬다.
# (10-02 mun/all.js 처럼 폴더 안 파일도 본다 — 전에는 / 가 든 이름을 못 읽어 검사에서 빠졌다.)
_pat_v  = re.compile(r'src=.([A-Za-z0-9_./-]+\.js)\?v=([0-9a-z]+)')
_pat_no = re.compile(r'src=.([A-Za-z0-9_./-]+\.js)(?!\?)')
_missed, _notag, _gone = [], [], []
for pg, h in pages.items():
    _missed += [(pg, m.group(1), m.group(2)) for m in _pat_v.finditer(h) if m.group(2) != VER.get(m.group(1))]
    _notag  += [(pg, m.group(1)) for m in _pat_no.finditer(h)]
    # 10-02 탭별 꾸러미 — index.html 의 template 줄은 탭을 열 때 받는다. 파일을 지우고 줄을 남기면 그 탭이 손님 앞에서 「불러오지 못했어요」가 된다.
    _gone   += [(pg, m.group(1)) for m in re.finditer(r'src=.([A-Za-z0-9_./-]+\.js)', h) if not os.path.exists(os.path.join(APP, m.group(1)))]
if _missed or _notag or _gone:
    print()
    print('!! 지문이 안 붙었거나 없는 스크립트가 있습니다 - FILES 목록에 넣거나, 지운 파일이면 그 쪽(index.html 은 template 줄까지)에서도 빼세요')
    for pg, f, v in _missed: print('   %-14s %-28s ?v=%s  (지금 내용 %s)' % (pg, f, v, VER.get(f, '목록에 없음')))
    for pg, f in _notag:     print('   %-14s %-28s ?v= 없음' % (pg, f))
    for pg, f in _gone:      print('   %-14s %-28s 파일이 없음' % (pg, f))
    sys.exit(1)

# 공통 종이 바탕 CSS는 정적 안내·약관·월별 글에도 같은 지문을 붙인다.
# PAGES에 없는 글도 재방문자의 이전 색을 문 채 남지 않게 한다.
_css_n = 0
for pg in sorted(os.listdir(APP)):
    if not pg.endswith('.html') or pg in PAGES:
        continue
    p = os.path.join(APP, pg)
    h = io.open(p, encoding='utf-8').read()
    h2, n = re.subn(r'(["\'])(/?style\.css)(?:\?v=[0-9a-z]+)?\1',
                    lambda m: m.group(1) + m.group(2) + '?v=' + VER['style.css'] + m.group(1), h)
    if h2 != h:
        io.open(p, 'w', encoding='utf-8', newline='\r\n').write(h2)
        _css_n += 1
print('정적 글 공통 CSS 지문:', _css_n)

# -- 상품 소개 쪽 · 미리보기 그림 · 사이트맵 (10-02 개편 3묶음) --
# 소개 쪽 다섯(love · pair · ssom · gunghap-chongnon · jeongtong.html)을 상품 약속 장부 · 분야 표에서, 글 미리보기(cards/og/*.jpg) ·
# 홈 미리보기(og-home-3.jpg)를 그 쪽 제목 · 삽화에서, 사이트맵을 공개 쪽 목록 · git 기록에서 다시 만든다. 바뀐 것만 쓴다.
# 장부 한 칸을 고치면 배포 때 소개 쪽도 같이 바뀐다 — 소개 쪽을 손으로 고치지 않는다. 자세한 것은 tools_sogae.py 머리.
import tools_sogae
try:
    _sogae = tools_sogae.build(ver=new)
except Exception as e:
    print()
    print('!! 소개 쪽 · 미리보기 · 사이트맵을 만들지 못했습니다 — python tools_sogae.py 로 까닭을 보세요:', e)
    sys.exit(1)
print('소개 쪽 · 미리보기 · 사이트맵:', ('바뀜 %d — %s' % (len(_sogae), ' · '.join(_sogae))) if _sogae else '그대로')

# 정통사주 비교 견본도 운영 원고·CSS·자료가 바뀌면 새로 받는다.
_example_path = os.path.join(APP, 'examples', 'jeongtong-reader.html')
if os.path.exists(_example_path):
    with open(_example_path, encoding='utf-8') as _f:
        _example = _f.read()
    _updated = re.sub(r'(?:\.\./)([a-z0-9-]+\.(?:js|css))(?:\?v=[a-z0-9]+)?', lambda m: '../' + m.group(1) + '?v=' + VER[m.group(1)] if m.group(1) in VER else m.group(0), _example)
    _data_version = 지문('examples/jeongtong-reader.json')
    if _data_version:
        _updated = re.sub(r"fetch\('jeongtong-reader\.json(?:\?v=[a-z0-9]+)?'\)", "fetch('jeongtong-reader.json?v=" + _data_version + "')", _updated)
    if _updated != _example:
        with open(_example_path, 'w', encoding='utf-8', newline='\r\n') as _f:
            _f.write(_updated)
