# -*- coding: utf-8 -*-
"""상품 소개 쪽 · 미리보기 그림 · 사이트맵을 만든다 — 10-02 개편 3묶음 「상품마다 제 소개 페이지와 미리보기 그림 — 검색 · 카톡의 문」.

왜: love.html 은 425바이트짜리 빈 넘김 쪽이었고 사용설명서는 쪽이 아예 없었다. 정통궁합 · 웹툰궁합 · 정통사주 쪽은 noindex 이거나
    robots.txt 에 막혀 검색 로봇에게 없는 쪽이었다. 신살 · 「왜」 글을 카톡에 붙이면 미리보기는 모두 출산택일 그림(og.jpg)이었다.
    이제 검색으로 온 사람이 그 상품 쪽에 바로 닿고, 카톡에 붙인 주소가 제 표지로 뜬다.

하는 일 — 모두 「바뀐 것만 쓴다」(글 · 그림이 그대로면 파일을 건드리지 않는다):
  1) 상품 소개 쪽 다섯(love.html · pair.html · ssom.html · gunghap-chongnon.html · jeongtong.html).
     글을 여기 손으로 적지 않는다. 이름 · 한줄 · 받는 것 · 미리 보는 것 · 만드는 시간 · 보관 · 환불 · 딱지 · 필요한 것은 상품 약속 장부(app/yaksok.js),
     무료 콘텐츠의 이름 · 한줄과 「이걸 보면 알 수 있는 것」(그 콘텐츠의 장이 답하는 물음)은 분야 표(app/bunya.js),
     차례(장 이름)는 그 콘텐츠를 그리는 파일(love.js 장그림 · pair.js 글 · jeongtong.js · gunghap-chongnon.js · ssom-dangye.js),
     표지 그림은 홈 칸 표(home-cats.js), 바닥글(사업자 정보)은 홈 바닥글(index.html <footer>)에서 읽는다.
     값은 적지 않는다 — 쪽이 열릴 때 상품표(/api/pay)에서 받아 붙인다(yaksok.js 값자리 · 값채우기). 판정 · 가중치 · 프롬프트는 싣지 않는다.
     넣어 둔 사람이 있는 손님은 지금처럼 그 탭으로 곧장 넘긴다(머리 스크립트). 검색 · 카톡 로봇은 스크립트 없이 이 글을 읽는다.
  2) 미리보기 그림(1200×630, app/cards/og/<쪽 이름>.jpg) — 상품 쪽은 표지 그림 + 이름 + 한 줄 + 딱지,
     읽을거리(read.html)에 걸린 글 · 출산택일 신청 쪽 · 읽을거리 쪽은 글 제목 + 삽화 한 장(월별 택일 글의 cards/ 방식).
     그 쪽 머리의 og:image 를 그 그림으로 바꾼다 — 지금 그림이 출산택일 그림(og.jpg)이거나 없을 때만(손으로 고른 그림은 둔다).
     tools_jeongbon.py 가 만드는 글(why-* · how-good-is-my-saju)은 tools_jeongbon.og_image 도 같은 그림을 고른다(두 곳이 같은 답).
  3) 홈 미리보기 그림 og-home-3.jpg — 지금 진열(연애 · 사용설명서 · 궁합 · 정통사주 · 출산택일). 「회원가입 없이 무료」 글씨는 없다.
     옛 og-home-2.jpg 는 지우지 않는다(어디서도 부르지 않게 될 뿐).
  4) 사이트맵(app/sitemap.xml) — noindex 가 아니고 robots.txt 가 막지 않은 공개 쪽을 모두. 시험 쪽 · 원고 보기 · 소유확인 쪽은 뺀다.
     lastmod 는 git 기록(아직 올리지 않은 고침이 있으면 오늘). 이미 있던 줄의 changefreq · priority 는 그대로 둔다.

    python tools_sogae.py           # 만든다. tools_bust.py --bump 끝에서도 부른다(배포 때마다 장부와 맞춘다)
    python tools_sogae.py --check   # 쓰지 않고 어긋난 것만 말한다(tools_check.py 9) 이 부른다)

그림을 바꾸려면 아래 ART 표 한 줄. 새 글을 read.html 에 걸면 다음 배포 때 그 글의 미리보기도 저절로 찍힌다.
"""
import datetime
import glob
import html
import io
import json
import os
import re
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, 'app')
SITE = 'https://chaeksa.kr/'
TODAY = datetime.date.today().isoformat()
FONTS = r'C:\Windows\Fonts'
OG_DIR = os.path.join(APP, 'cards', 'og')
HOME_OG = 'og-home-3.jpg'
MARK = 'tools_sogae.py 가 만든 쪽'          # 소개 쪽 머리의 표시 — tools_check.py 가 이 표시로 「장부 글을 손으로 옮겨 적었다」 경고에서 뺀다

# 상품 소개 쪽 — 장부 키: 파일. 차례 = 진열 차례(홈 첫 줄부터).
PRODUCTS = [('love', 'love.html'), ('pair', 'pair.html'), ('chongnon', 'gunghap-chongnon.html'), ('ssom', 'ssom.html'), ('jeongtong', 'jeongtong.html')]
# 무료 콘텐츠가 답하는 물음 — 분야 표 물음의 칸 id 앞머리(이 콘텐츠의 장)
SLOT_PREFIX = {'jeongtong': 'jt.', 'chongnon': 'gc.', 'ssom': 'ss.'}
# 홈 미리보기 다섯 칸 — 진열 차례(연애 · 사용설명서 · 궁합 · 정통사주 · 출산택일)
HOME_PANELS = ['love', 'pair', 'chongnon', 'jeongtong', 'taekil']

# 글 미리보기에 얹는 삽화 — 쪽 이름: art/ 그림. 표에 없으면 그 글이 걸린 read.html 칸(h2)의 첫 낱말로 고른다(SECTION_ART).
# 그림 원본은 지우지도 줄이지도 않는다 — 미리보기 그림 안에서만 잘라 쓴다.
ART = {
    'how-good-is-my-saju': 'art/jt-04-good-bad-f.webp',
    'why-day-master-is-me': 'art/jt-05-who-f.webp',
    'why-four-pillars': 'art/jt-01-born-f.webp',
    'why-five-elements': 'art/jt-15-work-f.webp',
    'why-sixty': 'art/jt-18-ten-years-f.webp',
    'why-day-starts-11pm': 'art/jt-13-heart-f.webp',
    'why-ipchun-new-year': 'art/jt-g-bigyeon-f.webp',
    'why-2026-byeongo': 'art/jt-02-push-f.webp',
    'why-gyeok-is-my-role': 'art/jt-03-seat-f.webp',
    'why-rootless-letters': 'art/jt-09-shadow-f.webp',
    'why-hap-dies': 'art/jt-16-alone-together-f.webp',
    'why-chung-happens': 'art/jt-07-shake-f.webp',
    'why-ai-three-classics': 'art/jt-g-pyeongwan-f.webp',
    'dohwa': 'art/ss-her.webp',
    'hongyeom': 'art/story-say-love.webp',
    'gwaegang': 'art/jt-08-power-f.webp',
    'baekho': 'art/jt-06-steady-f.webp',
    'read': 'art/jt-g-jeongin-f.webp',
    'taekil-apply': 'art/taekil-main.webp',
    'when': 'art/jt-19-return-f.webp',   # 10-06 「언제 나아지나」 카톡 미리보기 — 홈 칸과 같은 그림
}
SECTION_ART = {'왜': 'art/jt-g-jeongin-f.webp', '신살': 'art/ss-her.webp', '연애': 'art/love-cover.webp', '출산택일': 'art/taekil-main.webp'}
DEFAULT_ART = 'art/jt-05-who-f.webp'
# read.html 밖에서 미리보기를 붙일 쪽 — 쪽 이름: 칸 말(그 쪽이 read.html 의 어느 칸 말을 쓰나)
EXTRA_CARDS = {'taekil-apply': '출산택일', 'read': None, 'when': '무료'}
# read.html 에 걸려 있어도 미리보기를 찍지 않는 쪽 — 출산택일 안내는 출산택일 그림(og.jpg)이 제 표지다
NO_CARD = {'taekil'}


# ───────────────────────── 읽기 ─────────────────────────
def read(p):
    return io.open(p, encoding='utf-8').read().replace('\r\n', '\n')


def write_text(p, text):
    """바뀌었을 때만 쓴다. 줄 끝은 그 파일의 지금 꼴(없던 파일은 CRLF — 작업 사본 꼴)을 지킨다. 썼으면 True."""
    new = text.replace('\r\n', '\n')
    crlf = True
    if os.path.exists(p):
        raw = open(p, 'rb').read().decode('utf-8')
        if raw.replace('\r\n', '\n') == new:
            return False
        crlf = '\r\n' in raw or '\n' not in raw
    open(p, 'wb').write((new.replace('\n', '\r\n') if crlf else new).encode('utf-8'))
    return True


def write_bytes(p, data):
    if os.path.exists(p) and open(p, 'rb').read() == data:
        return False
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'wb').write(data)
    return True


def _json_between(src, start, end):
    a, b = src.find(start), src.find(end)
    if a < 0 or b < a:
        raise ValueError('표시를 못 찾음: %s' % start)
    return json.loads(src[a + len(start):b])


def load_yaksok():
    return _json_between(read(os.path.join(APP, 'yaksok.js')), '/*장부 시작*/', '/*장부 끝*/')


def load_bunya():
    return _json_between(read(os.path.join(APP, 'bunya.js')), '/*표 시작*/', '/*표 끝*/')


def _js_block(src, head):
    """`var 이름 = {` 로 시작하는 객체 글 하나 — 괄호 짝을 센다(문자열 안 괄호는 건너뜀)."""
    i = src.find(head)
    if i < 0:
        raise ValueError('못 찾음: %s' % head)
    i = src.index('{', i)
    depth, j, q = 0, i, None
    while j < len(src):
        c = src[j]
        if q:
            if c == '\\':
                j += 2
                continue
            if c == q:
                q = None
        elif c in '"\'':
            q = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
        j += 1
    raise ValueError('괄호 짝이 안 맞음: %s' % head)


def _js_object(src, head):
    """JSON 꼴(키에 큰따옴표) 객체 하나를 읽는다."""
    return json.loads(_js_block(src, head))


def home_art():
    """홈 칸 표(home-cats.js) — 콘텐츠 키: (그림, 작은 판, 가로, 세로)."""
    src = read(os.path.join(APP, 'home-cats.js'))
    out = {}
    for m in re.finditer(r"키: '(\w+)'[^}]*?그림: '([^']+)', 작은: '([^']+)', 크기: \[(\d+), (\d+)\]", src):
        out.setdefault(m.group(1), (m.group(2), m.group(3), int(m.group(4)), int(m.group(5))))
    return out


def footer_html():
    """홈 바닥글 — 사업자 정보까지 글자 하나 다르지 않게 그대로(tools_check.py 8 이 맞춰 보는 줄)."""
    src = read(os.path.join(APP, 'index.html'))
    m = re.search(r'<footer>([\s\S]*?)</footer>', src)
    if not m:
        raise ValueError('index.html 에 <footer> 가 없다')
    f = re.sub(r'<!--[\s\S]*?-->', '', m.group(1))
    return '\n'.join(l.strip() for l in f.split('\n') if l.strip())


def version():
    m = re.search(r'chaeksa-v(\d+)', read(os.path.join(APP, 'sw.js')))
    return int(m.group(1)) if m else 0


# ── 차례(장 이름) — 그 콘텐츠를 그리는 파일에서. 손님 사람마다 달라지는 말(변수)은 빼고 글자만 잇는다. ──
def _literal_title(expr):
    """'나를 둘러싼 ' + 남수 + ' 글자 — 십성' → 「나를 둘러싼 글자 — 십성」(사람마다 달라지는 낱말은 뺀다)."""
    return re.sub(r'\s+', ' ', ''.join(re.findall(r"'([^']*)'", expr))).strip()


def chapters_from(js):
    """안전(번호, '제목', …) 으로 짓는 장 — 번호 차례 그대로. 아직 못 지은 장(안전 밖의 「준비」)은 넣지 않는다."""
    src = read(os.path.join(APP, js))
    out = []
    for m in re.finditer(r"안전\((\d+),\s*((?:'[^']*'|[^,'])+?),\s*(?:'|\(|[A-Za-z가-힣])", src):
        t = _literal_title(m.group(2))
        if t:
            out.append((int(m.group(1)), t))
    seen, uniq = set(), []
    for n, t in out:
        if n not in seen:
            seen.add(n)
            uniq.append(t)
    return uniq


def chapters(key):
    if key == 'love':
        return re.findall(r"'([^']+)':\s*\[", _js_block(read(os.path.join(APP, 'love.js')), 'var 장그림 ='))
    if key == 'jeongtong':
        return chapters_from('jeongtong.js')
    if key == 'chongnon':
        return chapters_from('gunghap-chongnon.js')
    if key == 'ssom':
        src = read(os.path.join(APP, 'ssom-dangye.js'))
        blk = src[src.find('단계: ['):src.find('원고: {')]
        return re.findall(r"이름: '([^']+)'", blk)
    return []


def love_example():
    return _js_object(read(os.path.join(APP, 'love.js')), 'var 예시자료 =')


def pair_text():
    return _js_object(read(os.path.join(APP, 'pair.js')), 'var 글 =')


# ───────────────────────── 상품 소개 쪽 ─────────────────────────
E = lambda s: html.escape(str(s if s is not None else ''), quote=True)


def _bunya_row(B, k):
    for c in B.get('콘텐츠', []):
        if c.get('키') == k:
            return c
    return {}


def info(key, Y, B):
    """한 콘텐츠의 쪽 재료 — 모두 장부 · 분야 표 · 그 콘텐츠 파일에서."""
    r = Y['콘텐츠'][key]
    b = _bunya_row(B, key)
    이름 = r.get('이름') or b.get('이름') or ''
    한줄 = r.get('한줄') or b.get('한줄') or ''
    홈한줄 = r.get('홈한줄') or b.get('한줄') or 한줄
    if r.get('코드'):
        알것 = [t for t in r.get('받는것', []) if isinstance(t, str)]   # 조건이 붙은 줄(서버가 줄 때만 보이는 것)은 약속하지 않는다
    else:
        # 그 콘텐츠의 장이 답하는 물음 — 제 분야(본적) 물음이 먼저, 그다음 이 콘텐츠가 첫 답인 물음, 그다음 표 차례
        pre, 본적, 후보 = SLOT_PREFIX.get(key, '@'), b.get('본적'), []
        for f in B.get('분야', []):
            for q in f.get('물음', []):
                칸 = [str(c) for c in (q.get('칸') or [])]
                if any(c.startswith(pre) for c in 칸):
                    후보.append((0 if f.get('키') == 본적 else 1, 0 if 칸[0].startswith(pre) else 1, len(후보), q['글']))
        알것 = []
        for *_, 글 in sorted(후보):
            if 글 not in 알것:
                알것.append(글)
        알것 = 알것[:5]
    딱지 = r.get('딱지') or ''
    m = re.match(r'^([\s\S]*?)(\s*·\s*|\s+)?\{값\}([\s\S]*)$', 딱지)
    딱지앞, 딱지사이, 딱지뒤 = (m.group(1), m.group(2) or '', m.group(3)) if m else (딱지, '', '')
    필요 = r.get('필요') or ''
    return {
        '키': key, '코드': r.get('코드'), '탭': r.get('탭') or key, '이름': 이름, '한줄': 한줄, '홈한줄': 홈한줄,
        '알것': 알것, '딱지앞': 딱지앞, '딱지사이': 딱지사이, '딱지뒤': 딱지뒤, '필요': 필요,
        '미리': r.get('미리') or '', '만듦': (r.get('만듦', '') + ('(' + r['시간'] + ')' if r.get('시간') else '') + '.') if r.get('만듦') else '',
        '보관': r.get('보관') or '', '환불': r.get('환불') or '',
        '시작': ('그 사람 생년월일로 시작' if 필요.startswith('그 사람') else '내 생년월일로 시작'),
    }


def _section(title, body):
    return '\n  <h2>%s</h2>\n%s' % (E(title), body)


def _paras(text):
    return '\n'.join('  <p>%s</p>' % E(p).replace('\n', '<br>') for p in re.split(r'\n\s*\n', text or '') if p.strip())


def product_page(key, fname, Y, B, arts, foot, ver):
    I = info(key, Y, B)
    art = arts.get(key)
    url = SITE + fname
    제목 = I['이름'] + (' — ' + I['홈한줄'] if I['홈한줄'] else '')
    설명 = I['한줄'] if I['코드'] else (I['한줄'] + ' — ' + ' '.join(I['알것'][:3]) if I['알것'] else I['한줄'])
    go = './?go=%s&amp;from=site-%s' % (I['탭'], key)
    파는 = bool(I['코드'])

    # 머리 — 표지 · 딱지 · 이름 · 한줄 · 값 · 단추
    cover = ''
    if art:
        cover = ('  <img class="sg-cover" src="%s" srcset="%s 360w, %s %dw" sizes="(min-width:600px) 240px, 62vw" width="%d" height="%d" alt="" decoding="async">\n'
                 % (art[0], art[1], art[0], art[2], art[2], art[3]))
    값 = ('<span data-yaksok-price="%s" data-pre="%s" data-post="" data-fmt="won"></span>' % (E(I['코드']), E(I['딱지사이']))) if 파는 else ''
    딱지 = '<p class="sg-tag">%s%s%s</p>' % (E(I['딱지앞']), 값, E(I['딱지뒤'])) if (I['딱지앞'] or 값) else ''
    head = ('  <div class="sg-hero">\n%s  <div class="sg-head">\n    %s\n    <h1>%s</h1>\n    <p class="sg-lead">%s</p>\n'
            '    <a class="btn sg-go" data-go href="%s">%s</a>\n    <p class="hint">필요한 것 — %s</p>\n  </div>\n  </div>'
            % (cover, 딱지, E(I['이름']), E(I['한줄']), go, E(I['시작']), E(I['필요'])))
    parts = [head]

    목록 = lambda xs: '  <ul class="sg-list">\n%s\n  </ul>' % '\n'.join('    <li>%s</li>' % E(t) for t in xs)
    if I['알것'] and not 파는:
        parts.append(_section('이걸 보면 알 수 있는 것', 목록(I['알것'])))

    if 파는 and I['미리']:
        body = '  <p>%s</p>' % E(I['미리'])
        if key == 'love':
            ex = love_example()
            it = (ex.get('items') or [{}])[0]
            # 예시 칸의 말(해독 결과 첫 줄 · 모습 하나)은 love.js 예시()와 같은 말이다
            body += ('\n  <div class="card sg-ex">\n    <p class="hint">예시 — 지어낸 한 사람의 결과 일부</p>\n'
                     '    <p><b>해독 결과 첫 줄</b></p>\n    <p class="sg-exline">%s</p>\n'
                     '    <p><b>모습 하나 — %s</b></p>\n    <p>%s</p>\n'
                     '    <p class="hint">예시 · %s</p>\n    <p class="sg-exline">%s</p>\n    <p>%s</p>\n  </div>'
                     % (E(ex.get('title')), E((ex.get('trait') or {}).get('name')), E((ex.get('trait') or {}).get('line')),
                        E(it.get('section')), E(it.get('t')), E(it.get('a'))))
        parts.append(_section('결제 전에 볼 수 있는 것', body))
    if I['알것'] and 파는:
        parts.append(_section('결제하면 받는 것', 목록(I['알것'])))   # pay.html 「무엇을 사나」와 같은 줄

    if key == 'pair':
        intro = [x for x in pair_text().get('intro', []) if '단계' in (x.get('head') or '')]
        if intro:
            parts.append(_section(intro[0]['head'], _paras(intro[0].get('body'))))
    else:
        ch = chapters(key)
        if ch:
            parts.append(_section('차례', '  <ol class="sg-toc">\n%s\n  </ol>' % '\n'.join('    <li>%s</li>' % E(t) for t in ch)))

    if 파는:
        rows = [('값', '<span data-yaksok-price="%s" data-pre="" data-post=""></span>' % E(I['코드']))]
        if I['만듦']:
            rows.append(('만드는 시간', E(I['만듦'])))
        if I['보관']:
            rows.append(('보관', E(I['보관'])))
        if I['환불']:
            rows.append(('환불', E(I['환불'])))
        parts.append(_section('값과 환불', '  <dl class="sg-dl">\n%s\n  </dl>' % '\n'.join('    <dt>%s</dt><dd>%s</dd>' % (a, b) for a, b in rows)))

    parts.append('\n  <a class="btn sg-go" data-go href="%s">%s</a>' % (go, E(I['시작'])))
    parts.append('\n  <p class="sg-foot">%s</p>' % foot.replace('\n', '\n  '))

    scripts = ['config.js', 'track.js'] + (['yaksok.js', 'pay.js'] if 파는 else [])
    tail = '\n'.join('<script src="%s?v=%d"></script>' % (s, ver) for s in scripts)
    # 들어온 길(from)을 단추에 그대로 잇고, 값 자리를 상품표 값으로 채운다
    tail += ('\n<script>\n(function(){\n  var f=\'\';try{f=new URLSearchParams(location.search).get(\'from\')||\'\';}catch(e){}\n'
             '  if(f)Array.prototype.forEach.call(document.querySelectorAll(\'a[data-go]\'),function(a){a.href=\'./?go=%s&from=\'+encodeURIComponent(f);});\n'
             '  try{if(window.ChaeksaYaksok)ChaeksaYaksok.값채우기(document);}catch(e){}\n})();\n</script>' % I['탭'])

    return '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · 책사</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="책사">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<!-- {mark} — 글은 상품 약속 장부(yaksok.js) · 분야 표(bunya.js) · 그 콘텐츠 파일에서 읽는다. 손으로 고치지 말고 장부를 고친 뒤 python tools_sogae.py (배포 때도 저절로 돈다). -->
<script>
/* 넣어 둔 사람이 있는 손님은 지금처럼 앱의 그 화면으로 곧장 간다(들어온 길 from 은 그대로). 처음 온 손님 · 검색 로봇은 아래 소개를 본다. */
(function(){{try{{var l=JSON.parse(localStorage.getItem('chaeksa.people')||'[]');if(!(l&&l.length)&&!localStorage.getItem('chaeksa.profile'))return;var f=new URLSearchParams(location.search).get('from');location.replace('./?go={tab}'+(f?'&from='+encodeURIComponent(f):''));}}catch(e){{}}}})();
(function(){{var m='auto';try{{m=localStorage.getItem('chaeksa.theme')||'auto';}}catch(e){{}}var h=new Date().getHours();document.documentElement.setAttribute('data-theme',(m==='night'||(m==='auto'&&(h<6||h>=18)))?'night':'day');}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@400;500;700&family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v={ver}">
<style>
  .doc{{max-width:660px;margin:0 auto;padding:24px 18px 90px}}
  .doc h1{{font-family:var(--serif);font-size:var(--t6);line-height:1.35;margin:6px 0 8px;color:var(--ink)}}
  .doc h2{{font-size:var(--t4);font-weight:700;color:var(--ink);margin:34px 0 11px;letter-spacing:-.01em}}
  .doc h2::after{{display:none}}
  .doc p,.doc li,.doc dd{{font-size:var(--t2);line-height:1.85;color:var(--ink2)}}
  .doc p{{margin:0 0 10px}}
  .doc a{{color:var(--accent)}}
  .sg-hero{{display:flex;gap:20px;align-items:flex-start}}
  .sg-cover{{flex:0 0 240px;width:240px;height:auto;border-radius:var(--r2);box-shadow:var(--shadow-lift)}}
  .sg-head{{flex:1;min-width:0}}
  .sg-tag{{display:inline-block;margin:0;padding:3px 11px;border:1px solid var(--accent-line);border-radius:var(--r3);background:var(--accent-soft);color:var(--accent);font-size:var(--t1);line-height:1.6}}
  .doc .sg-lead{{font-size:var(--t3);line-height:1.8;color:var(--ink2)}}
  .doc a.btn{{display:block;text-align:center;text-decoration:none;color:var(--seal-ink)}}
  .sg-list,.sg-toc{{margin:0;padding-left:20px}}
  .sg-list li,.sg-toc li{{margin-bottom:4px}}
  .sg-ex{{margin:12px 0 0}}
  .doc .sg-exline{{font-family:var(--letter);font-size:var(--t3);color:var(--ink);font-weight:700}}
  .sg-dl{{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}}
  .sg-dl dt{{font-size:var(--t2);font-weight:700;color:var(--ink);line-height:1.85}}
  .sg-dl dd{{margin:0}}
  .doc .sg-foot{{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);font-size:var(--t1);line-height:1.8;color:var(--ink3)}}
  .doc .sg-foot a{{color:var(--ink3)}}
  @media (max-width:560px){{
    .sg-hero{{display:block}}
    .sg-cover{{display:block;width:62vw;max-width:260px;margin:0 auto 16px}}
  }}
</style>
</head>
<body>
<div class="mini-head" role="banner"><a class="logo" href="./" title="처음 화면으로"><i class="seal">策</i><span>책사</span></a><a class="mh-home" href="./">← 홈</a></div>
<main class="doc sg" data-sogae="{key}">
{body}
</main>
{tail}
</body>
</html>
'''.format(title=E(제목), desc=E(설명), url=url, img=SITE + 'cards/og/' + key + '.jpg', mark=MARK, tab=I['탭'], ver=ver, key=key,
           body='\n'.join(parts), tail=tail)


# ───────────────────────── 미리보기 그림 ─────────────────────────
W, H = 1200, 630
BG_TOP, BG_BOT = (18, 16, 48), (36, 31, 77)          # style.css 밤(새벽 인디고) 바탕
INK, INK2, GOLD = (238, 234, 247), (182, 174, 212), (230, 201, 138)
SEAL_A, SEAL_B, SEAL_INK = (240, 215, 155), (187, 148, 69), (28, 26, 60)


def _font(kind, size, weight='Regular'):
    from PIL import ImageFont
    name = {'serif': 'NotoSerifKR-VF.ttf', 'sans': 'NotoSansKR-VF.ttf'}[kind]
    p = os.path.join(FONTS, name)
    if os.path.exists(p):
        f = ImageFont.truetype(p, size)
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
        return f
    return ImageFont.truetype(os.path.join(FONTS, 'malgunbd.ttf' if weight in ('Bold', 'Black', 'SemiBold') else 'malgun.ttf'), size)


def _vgrad(size, top, bot):
    from PIL import Image
    w, h = size
    strip = Image.new('RGB', (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
    return strip.resize((w, h))


def _wrap(d, text, font, width):
    """낱말(띄어쓰기) 단위로 줄을 나눈다. 한 낱말이 폭보다 길면 글자 단위로."""
    lines, cur = [], ''
    for word in text.split(' '):
        trial = (cur + ' ' + word).strip()
        if d.textlength(trial, font=font) <= width:
            cur = trial
            continue
        if cur:
            lines.append(cur)
        cur = ''
        for ch in word:
            if d.textlength(cur + ch, font=font) <= width:
                cur += ch
            else:
                lines.append(cur)
                cur = ch
    if cur:
        lines.append(cur)
    return lines


def _balance(d, text, font, width, lines):
    """줄 수는 그대로 두고 폭을 줄여 가며 줄 길이를 고르게 — 마지막 줄에 한 낱말만 남지 않게."""
    if len(lines) < 2:
        return lines
    lo, hi, best = int(width * 0.5), width, lines
    while lo <= hi:
        mid = (lo + hi) // 2
        ls = _wrap(d, text, font, mid)
        if len(ls) == len(lines):
            best, hi = ls, mid - 1
        else:
            lo = mid + 1
    return best


def _fit(d, text, kind, weight, sizes, width, max_lines):
    for s in sizes:
        f = _font(kind, s, weight)
        ls = _wrap(d, text, f, width)
        if len(ls) <= max_lines:
            return f, _balance(d, text, f, width, ls), s
    f = _font(kind, sizes[-1], weight)
    ls = _wrap(d, text, f, width)
    if len(ls) > max_lines:
        ls = ls[:max_lines]
        ls[-1] = ls[-1].rstrip() + '…'
    return f, ls, sizes[-1]


def _art_panel(src, w, h, top_bias=0.0):
    """그림을 w×h 로 자른다 — 가로는 가운데, 세로는 위쪽부터(얼굴이 위에 있다). 원본은 건드리지 않는다."""
    from PIL import Image
    im = Image.open(os.path.join(APP, src)).convert('RGB')
    sw, sh = im.size
    aspect = w / h
    if sw / sh > aspect:
        cw = int(sh * aspect)
        x0 = (sw - cw) // 2
        box = (x0, 0, x0 + cw, sh)
    else:
        ch = int(sw / aspect)
        y0 = int((sh - ch) * top_bias)
        box = (0, y0, sw, y0 + ch)
    return im.crop(box).resize((w, h), Image.LANCZOS)


def _seal(d, x, y, s):
    d.rounded_rectangle([x, y, x + s, y + s], radius=int(s * 0.22), fill=SEAL_B)
    d.rounded_rectangle([x, y, x + s, y + int(s * 0.55)], radius=int(s * 0.22), fill=SEAL_A)
    d.rectangle([x, y + int(s * 0.3), x + s, y + int(s * 0.55)], fill=SEAL_A)
    f = _font('serif', int(s * 0.62), 'Black')
    bb = d.textbbox((0, 0), '策', font=f)
    d.text((x + (s - (bb[2] - bb[0])) / 2 - bb[0], y + (s - (bb[3] - bb[1])) / 2 - bb[1]), '策', font=f, fill=SEAL_INK)


def _jpeg(im):
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=88, optimize=True, progressive=True)
    return buf.getvalue()


def card(art, title, label=None, sub=None, pill=None):
    """미리보기 한 장 — 왼쪽 삽화, 오른쪽 글. 반환: JPEG 바이트."""
    from PIL import Image, ImageDraw
    base = _vgrad((W, H), BG_TOP, BG_BOT)
    AW = 470
    pic = _art_panel(art, AW, H)
    mask = Image.new('L', (AW, H), 255)
    md = ImageDraw.Draw(mask)
    for i in range(140):                       # 그림 오른쪽 가장자리를 바탕으로 녹인다
        md.line([(AW - 140 + i, 0), (AW - 140 + i, H)], fill=int(255 * (1 - i / 140) ** 1.6))
    base.paste(pic, (0, 0), mask)
    d = ImageDraw.Draw(base)
    X0, X1 = 520, 1140
    # 글 덩어리(칸 말 · 제목 · 한 줄 · 딱지)의 높이를 먼저 재고, 바닥 줄(책사 · 주소) 위 자리 가운데에 세운다
    tf, tl, ts = _fit(d, title, 'serif', 'Bold', [64, 58, 52, 48, 44, 40], X1 - X0, 4 if not sub else 3)
    sf, sl, ss = _fit(d, sub, 'sans', 'Regular', [30, 28, 26], X1 - X0, 2) if sub else (None, [], 0)
    hh = (54 if label else 0) + len(tl) * int(ts * 1.32) + ((10 + len(sl) * int(ss * 1.45)) if sl else 0) + (64 if pill else 0)
    y = max(56, (40 + 510 - hh) // 2)
    if label:
        d.text((X0, y), label, font=_font('sans', 26, 'Medium'), fill=GOLD)
        y += 54
    for ln in tl:
        d.text((X0, y), ln, font=tf, fill=INK)
        y += int(ts * 1.32)
    if sl:
        y += 10
        for ln in sl:
            d.text((X0, y), ln, font=sf, fill=INK2)
            y += int(ss * 1.45)
    if pill:
        y += 18
        pf = _font('sans', 24, 'Bold')
        pw = d.textlength(pill, font=pf)
        d.rounded_rectangle([X0, y, X0 + pw + 36, y + 46], radius=23, outline=GOLD, width=2)
        d.text((X0 + 18, y + 7), pill, font=pf, fill=GOLD)
    _seal(d, X0, 540, 46)
    d.text((X0 + 60, 543), '책사', font=_font('serif', 30, 'Bold'), fill=INK)
    d.text((X0 + 136, 550), 'chaeksa.kr', font=_font('sans', 24, 'Regular'), fill=INK2)
    return _jpeg(base)


def home_card(Y, B, arts):
    """홈 미리보기 — 다섯 칸(지금 진열). 칸 이름은 장부 · 분야 표 이름 그대로."""
    from PIL import Image, ImageDraw
    base = _vgrad((W, H), (12, 11, 32), (24, 21, 56))
    d = ImageDraw.Draw(base)
    TOP = 64
    _seal(d, 22, 12, 40)
    d.text((74, 13), '책사', font=_font('serif', 30, 'Bold'), fill=GOLD)
    d.text((146, 20), 'chaeksa.kr', font=_font('sans', 22, 'Regular'), fill=INK2)
    n = len(HOME_PANELS)
    pw = (W - (n - 1) * 3) // n
    for i, k in enumerate(HOME_PANELS):
        x = i * (pw + 3)
        a = arts.get(k)
        if not a:
            continue
        pic = _art_panel(a[0], pw, H - TOP, 0.0)
        shade = Image.new('L', (pw, H - TOP), 0)
        sd = ImageDraw.Draw(shade)
        for yy in range(H - TOP):               # 아래쪽을 어둡게 — 이름 자리
            t = max(0.0, (yy / (H - TOP) - 0.55) / 0.45)
            sd.line([(0, yy), (pw, yy)], fill=int(215 * t))
        pic = Image.composite(Image.new('RGB', pic.size, (10, 9, 28)), pic, shade)
        base.paste(pic, (x, TOP))
        r = Y['콘텐츠'].get(k, {})
        name = r.get('이름') or _bunya_row(B, k).get('이름') or ''
        f, ls, s = _fit(d, name, 'serif', 'Bold', [34, 30, 28, 26], pw - 24, 2)
        yy = H - 30 - len(ls) * int(s * 1.25)
        for ln in ls:
            d.text((x + (pw - d.textlength(ln, font=f)) / 2, yy), ln, font=f, fill=INK)
            yy += int(s * 1.25)
        if i:
            d.rectangle([x - 3, TOP, x - 1, H], fill=(201, 168, 98))
    d.rectangle([0, TOP - 3, W, TOP - 1], fill=(201, 168, 98))
    return _jpeg(base)


# ── 글 미리보기 대상 — read.html 에 걸린 글(칸 이름과 함께) + 신청 쪽 + 읽을거리 쪽 ──
def article_targets():
    src = read(os.path.join(APP, 'read.html'))
    out = {}
    body = src[src.find('<body'):]
    for sec in re.split(r'(?=<h2>)', body):
        m = re.match(r'<h2>(.*?)</h2>', sec)
        label = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else None
        for a in re.finditer(r'<a href="([a-z0-9-]+)\.html"', sec):
            slug = a.group(1)
            if label and slug not in NO_CARD and slug not in out and os.path.exists(os.path.join(APP, slug + '.html')):
                out[slug] = label
    for slug, label in EXTRA_CARDS.items():
        out.setdefault(slug, label)
    return out


def _h1(src):
    m = re.search(r'<h1[^>]*>([\s\S]*?)</h1>', src)
    return html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else ''


def _lead(src):
    m = re.search(r'<p class="lead">([\s\S]*?)</p>', src)
    return html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else None


def article_art(slug, label):
    if slug in ART:
        return ART[slug]
    for k, v in SECTION_ART.items():
        if label and label.startswith(k):
            return v
    return DEFAULT_ART


OG_IMG = re.compile(r'<meta property="og:image" content="([^"]*)">')


def set_og_image(src, slug):
    """쪽 머리의 og:image 를 cards/og/<slug>.jpg 로. 지금 그림이 og.jpg · 같은 카드 · 없음일 때만 바꾼다. (새 글, 바꿨나)"""
    url = SITE + 'cards/og/' + slug + '.jpg'
    m = OG_IMG.search(src)
    if m:
        if m.group(1) not in (SITE + 'og.jpg', url):
            return src, False                  # 손으로 고른 그림(월별 명식 카드 등)은 둔다
        out = src[:m.start()] + '<meta property="og:image" content="%s">' % url + src[m.end():]
        if '<meta property="og:image:width"' not in out:
            i = out.find('\n', out.find('<meta property="og:image" content="'))
            out = out[:i] + '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">' + out[i:]
        else:
            out = re.sub(r'<meta property="og:image:width" content="\d+">', '<meta property="og:image:width" content="1200">', out)
            out = re.sub(r'<meta property="og:image:height" content="\d+">', '<meta property="og:image:height" content="630">', out)
    else:
        # og 머리가 아예 없는 쪽(출산택일 신청) — 그 쪽의 제목 · 설명 · 주소를 그대로 옮겨 단다
        t = re.search(r'<title>([\s\S]*?)</title>', src)
        ds = re.search(r'<meta name="description" content="([^"]*)">', src)
        cn = re.search(r'<link rel="canonical" href="([^"]*)">', src)
        if not (t and cn):
            return src, False
        title = re.sub(r'\s*·\s*책사\s*$', '', t.group(1).strip())
        block = ('\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="책사">'
                 '\n<meta property="og:title" content="%s">' % title
                 + ('\n<meta property="og:description" content="%s">' % ds.group(1) if ds else '')
                 + '\n<meta property="og:image" content="%s">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
                   '\n<meta property="og:url" content="%s">\n<meta name="twitter:card" content="summary_large_image">' % (url, cn.group(1)))
        out = src[:cn.end()] + block + src[cn.end():]
    # 구조화 데이터(JSON-LD)의 대표 그림도 같은 그림으로
    out = re.sub(r'("image"\s*:\s*")' + re.escape(SITE + 'og.jpg') + '"', lambda mm: mm.group(1) + url + '"', out)
    return out, out != src


# ───────────────────────── 사이트맵 ─────────────────────────
def _robots_disallow():
    p = os.path.join(APP, 'robots.txt')
    pats = []
    if os.path.exists(p):
        for line in read(p).split('\n'):
            m = re.match(r'\s*Disallow:\s*(\S+)', line)
            if m:
                pats.append(re.compile('^' + re.escape(m.group(1)).replace(r'\*', '.*')))
    return pats


def public_pages():
    """사이트맵에 넣을 쪽 — noindex 아님 · robots 가 막지 않음 · 시험 · 원고 보기 · 소유확인 · 404 아님."""
    deny = _robots_disallow()
    out = []
    for p in sorted(glob.glob(os.path.join(APP, '*.html'))):
        f = os.path.basename(p)
        if f.startswith('tests_') or f.startswith('google') or f == '404.html' or f.endswith('-wongo-view.html'):
            continue
        if any(rx.match('/' + f) for rx in deny):
            continue
        src = read(p)
        if re.search(r'<meta name="robots" content="[^"]*noindex', src):
            continue
        out.append(f)
    return out


def _git(args):
    try:
        r = subprocess.run(['git'] + args, cwd=ROOT, capture_output=True, timeout=60)
        return r.stdout.decode('utf-8', 'replace') if r.returncode == 0 else None
    except Exception:
        return None


def git_dates():
    """app/ 파일 — 마지막으로 올린 날(커밋 날짜). 아직 올리지 않은 고침이 있거나 새 파일이면 오늘."""
    dates = {}
    log = _git(['-c', 'core.quotepath=off', 'log', '--format=@@%cs', '--name-only', '--', 'app'])
    if log is None:
        return None
    cur = None
    for line in log.split('\n'):
        line = line.strip()
        if line.startswith('@@'):
            cur = line[2:]
        elif line.startswith('app/') and cur:
            dates.setdefault(line[4:], cur)
    dirty = (_git(['-c', 'core.quotepath=off', 'diff', '--name-only', 'HEAD', '--', 'app']) or '') + \
            (_git(['-c', 'core.quotepath=off', 'ls-files', '--others', '--exclude-standard', '--', 'app']) or '')
    for line in dirty.split('\n'):
        line = line.strip()
        if line.startswith('app/'):
            dates[line[4:]] = TODAY
    return dates


def sitemap_text():
    p = os.path.join(APP, 'sitemap.xml')
    old_src = read(p) if os.path.exists(p) else ''
    old = {}
    order = []
    for m in re.finditer(r'<url>([\s\S]*?)</url>', old_src):
        u = m.group(1)
        loc = re.search(r'<loc>([^<]+)</loc>', u)
        if not loc:
            continue
        g = lambda t: (re.search(r'<%s>([^<]+)</%s>' % (t, t), u) or [None, None])[1]
        old[loc.group(1)] = {'lastmod': g('lastmod'), 'changefreq': g('changefreq'), 'priority': g('priority')}
        order.append(loc.group(1))
    dates = git_dates()
    prod_files = set(f for _, f in PRODUCTS)
    rows = {}
    for f in public_pages():
        loc = SITE if f == 'index.html' else SITE + f
        o = old.get(loc, {})
        lm = (dates or {}).get(f) or o.get('lastmod') or TODAY
        rows[loc] = (lm, o.get('changefreq') or ('weekly' if f in prod_files else 'monthly'),
                     o.get('priority') or ('0.9' if f in prod_files else '0.7'))
    locs = [l for l in order if l in rows] + sorted((l for l in rows if l not in old),
                                                    key=lambda l: (-float(rows[l][2]), l))
    body = ''.join('  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>\n'
                   % (l, rows[l][0], rows[l][1], rows[l][2]) for l in locs)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '</urlset>\n'


# ───────────────────────── 모두 ─────────────────────────
def _visible(src):
    s = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', src)
    s = re.sub(r'<!--[\s\S]*?-->', ' ', s)
    s = re.sub(r'<head>[\s\S]*?</head>', ' ', s)
    return html.unescape(re.sub(r'<[^>]+>', ' ', s))


def plan(ver=None):
    """만들 것 전부 — [(경로, 'text'|'bytes', 내용, 설명)]. 쓰지 않는다."""
    Y, B = load_yaksok(), load_bunya()
    arts, foot = home_art(), footer_html()
    ver = version() if ver is None else ver
    out = []
    # 1) 상품 소개 쪽 + 그 미리보기
    for key, fname in PRODUCTS:
        if key not in Y['콘텐츠']:
            continue
        page = product_page(key, fname, Y, B, arts, foot, ver)
        if key in Y.get('무료라고 쓰지 않는 콘텐츠', []) and '무료' in _visible(page):
            raise ValueError('%s — 「무료」가 화면 글에 있다(10-02 사장님 「무료범위없이 예시만」)' % fname)
        out.append((os.path.join(APP, fname), 'text', page, '소개 쪽'))
        I = info(key, Y, B)
        a = arts.get(key)
        if a:
            out.append((os.path.join(OG_DIR, key + '.jpg'), 'bytes',
                        card(a[0], I['이름'], sub=I['홈한줄'], pill=(I['딱지앞'] or '').strip() or None), '소개 미리보기'))
    # 2) 글 미리보기 — 그림 + 그 쪽 머리
    for slug, label in article_targets().items():
        p = os.path.join(APP, slug + '.html')
        src = read(p)
        new, changed = set_og_image(src, slug)
        if not changed and (SITE + 'cards/og/' + slug + '.jpg') not in src:
            continue                                   # 손으로 고른 그림이 있는 쪽
        title = _h1(src) or re.sub(r'\s*·\s*책사\s*$', '', (re.search(r'<title>([\s\S]*?)</title>', src) or [None, slug])[1])
        sub = _lead(src) if slug == 'read' else None
        out.append((os.path.join(OG_DIR, slug + '.jpg'), 'bytes', card(article_art(slug, label), title, label=label, sub=sub), '글 미리보기'))
        out.append((p, 'text', new, '글 머리'))
    # 3) 홈 미리보기
    out.append((os.path.join(APP, HOME_OG), 'bytes', home_card(Y, B, arts), '홈 미리보기'))
    idx = os.path.join(APP, 'index.html')
    isrc = read(idx)
    inew = re.sub(r'(<meta property="og:image" content="' + re.escape(SITE) + r')og-home-\d+\.jpg(">)', r'\g<1>' + HOME_OG + r'\2', isrc)
    out.append((idx, 'text', inew, '홈 머리'))
    # 4) 사이트맵(소개 쪽 · 글 머리가 정해진 뒤 — 새 쪽도 들어가게 마지막에)
    out.append((os.path.join(APP, 'sitemap.xml'), 'sitemap', None, '사이트맵'))
    return out


def build(ver=None, dry=False):
    """만든다. dry=True 면 쓰지 않고 바뀔 파일 목록만. 반환: 바뀐(바뀔) 파일 [상대 경로]."""
    changed = []
    for p, kind, content, what in plan(ver):
        rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
        if kind == 'sitemap':
            continue
        if kind == 'bytes':
            same = os.path.exists(p) and open(p, 'rb').read() == content
            if not same:
                changed.append(rel)
                if not dry:
                    write_bytes(p, content)
        else:
            same = os.path.exists(p) and read(p) == content.replace('\r\n', '\n')
            if not same:
                changed.append(rel)
                if not dry:
                    write_text(p, content)
    sm = os.path.join(APP, 'sitemap.xml')
    st = sitemap_text()
    if not (os.path.exists(sm) and read(sm) == st):
        changed.append('app/sitemap.xml')
        if not dry:
            write_text(sm, st)
    return changed


def check():
    """tools_check.py 가 부른다 — (막힘 [글], 확인 [글]). 소개 쪽이 장부와 어긋났으면 확인(배포 때 tools_bust 가 다시 만든다)."""
    bad, warn = [], []
    try:
        diff = build(dry=True)
    except Exception as e:
        return ['tools_sogae.py 가 쪽을 만들지 못했다: %s' % e], []
    for rel in diff:
        if rel == 'app/sitemap.xml':
            warn.append('사이트맵이 지금 쪽 목록 · git 날짜와 다르다 — python tools_sogae.py (배포 때 저절로)')
        elif rel.endswith('.jpg'):
            warn.append('%s — 미리보기 그림을 새로 찍어야 한다 — python tools_sogae.py' % rel)
        else:
            warn.append('%s — 장부 · 분야 표와 어긋났다 — python tools_sogae.py (배포 때 저절로)' % rel)
    return bad, warn


if __name__ == '__main__':
    if '--check' in sys.argv:
        b, w = check()
        for x in b:
            print('X', x)
        for x in w:
            print('!', x)
        print('막힘 %d · 확인 %d' % (len(b), len(w)))
        sys.exit(1 if b else 0)
    ch = build()
    print('바뀐 파일 %d개' % len(ch))
    for c in ch:
        print('  *', c)
