# -*- coding: utf-8 -*-
"""정본 생성기 — marketing/붙여넣기-*.html(네이버용 요약) → app/taekil-*.html(구글·AI용 정본).

docs/10 두 형식: 정본은 chaeksa.kr, 요약은 네이버. 2026-09-15 사장님 「구글에 보여줄 글을 만들어서 올려줘」「seo geo에 맞춰야겠지」.
정본에 얹는 것: title·description·canonical·og · Article+FAQPage+Breadcrumb JSON-LD · 맨 위 「이 글의 답 세 줄」 요약 상자
· 앞뒤 달 링크 · 상담 신청은 taekil-apply.html(사이트 안) · 사이트맵. 문장은 요약본과 같다(두 벌이 어긋나지 않게 여기서만 만든다).

  python tools_jeongbon.py        # 생성 + 사이트맵 + taekil.html 목록
"""
import re, os, glob, html, datetime, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, 'marketing'); A = os.path.join(ROOT, 'app')
TODAY = datetime.date.today().isoformat()

MONTHS = [(2026, 9), (2026, 10), (2026, 11), (2026, 12), (2027, 1), (2027, 2), (2027, 3), (2027, 4), (2027, 5), (2027, 6), (2027, 7), (2027, 8)]
# 제목은 사람이 검색창·AI에 묻는 말 그대로 — 「왜 …」「어떻게 …」(2026-09-15 사장님 「지금의 SEO·GEO는 전부 왜로 시작한다」).
# 첫 줄(「이 글의 답 세 줄」)이 그 질문의 답이다. 원래 제목은 부제로 남긴다.
PILLARS = [  # (붙여넣기 이름, slug, 질문형 제목)
    ('곳마다다른이유', 'taekil-why-different', '왜 출산택일은 곳마다 다르게 나올까요'),
    ('제왕절개날짜정하기', 'taekil-cesarean-date', '제왕절개 날짜는 어떻게 정하나요'),
    ('후보고르는법', 'taekil-how-to-choose', '출산택일 후보는 어떻게 고르나요'),
    ('택일검증', 'taekil-verify', '받은 출산택일이 맞는지 어떻게 확인하나요'),
    ('출산택일비용', 'taekil-price', '출산택일 비용은 얼마인가요'),
    ('음력12월시작시간', 'taekil-lunar-december', '음력 12월은 왜 12월 1일에 시작하지 않나요'),
    ('그릇과타이밍', 'taekil-fate-vs-timing', '왜 타고난 사주와 대운이 반대로 갈리나요'),
    ('담당의시간표택일', 'taekil-doctor-schedule', '담당 선생님 수술 시간이 정해져 있으면 택일은 어떻게 하나요'),
    ('왜진태양시', 'taekil-solar-time', '왜 출산택일은 시계 시각이 아니라 진태양시로 보나요'),
    ('왜2026병오년', 'why-2026-byeongo', '왜 2026년은 병오년인가요'),
    ('왜하루는밤11시', 'why-day-starts-11pm', '왜 하루는 밤 11시에 시작하나요'),
    ('왜입춘이새해', 'why-ipchun-new-year', '왜 입춘이 새해인가요, 설이 아니고'),
    ('왜일간이나', 'why-day-master-is-me', '왜 일간이 나인가요'),
    ('왜60인가', 'why-sixty', '왜 60갑자인가요, 왜 하필 60인가요'),
    ('왜사주는넷', 'why-four-pillars', '왜 사주는 네 기둥인가요, 다섯이 아니고'),
    ('왜합이되면죽나', 'why-hap-dies', '왜 합이 되면 죽는다고 하나요'),
    ('내사주좋은지', 'how-good-is-my-saju', '내 사주가 좋은지 어떻게 아나요'),
    ('왜뿌리없는글자', 'why-rootless-letters', '왜 뿌리 없는 글자는 쓰이지 않나요 — 믿음과 행동'),
    ('왜충이일어나나', 'why-chung-happens', '왜 충이 일어나고, 충이 오면 무엇을 해야 하나요'),
    ('왜오행은다섯', 'why-five-elements', '왜 오행은 다섯인가요, 넷도 여섯도 아니고'),
    ('사주를회사로', 'why-gyeok-is-my-role', '왜 사주는 같은 글자인데 사람마다 읽는 순서가 다른가요 — 격국을 회사로 읽으면'),
    ('세고전을AI가보면', 'why-ai-three-classics', 'AI에게 사주 고전 세 권을 맡기면 어떻게 되나요'),
]

def read(p): return open(p, 'rb').read().decode('utf-8').replace('\r\n', '\n')
def strip(s): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip()
def doc_of(s):
    m = re.search(r'<div id="doc">(.*?)</div>\s*</div>\s*<script', s, re.S); return m.group(1)

def transform(body, slug):
    b = body
    h2 = re.search(r'<h2>(.*?)</h2>', b, re.S); title = strip(h2.group(1)) if h2 else slug
    b = re.sub(r'<h2>.*?</h2>', '', b, count=1, flags=re.S)
    b = re.sub(r'<p class="alt">.*?</p>', '', b, count=1, flags=re.S)          # 제목 대안은 안 낸다
    tags = re.findall(r'#([^\s#<]+)', ''.join(re.findall(r'<p class="tag">(.*?)</p>', b, re.S)))
    b = re.sub(r'<p class="tag">.*?</p>', '', b, flags=re.S)
    b = b.replace('<h3>', '<h2>').replace('</h3>', '</h2>')
    # 사이트 안 링크 — 꼬리표는 site-*, 신청은 사이트 신청 페이지
    b = re.sub(r'https://chaeksa\.kr/\?from=blog-([a-z0-9]+)', r'./?from=site-\1', b)
    b = b.replace('https://chaeksa.kr/?from=blog-taekil', './?from=site-taekil')
    b = re.sub(r'<a href="https://naver\.me/[^"]+">여기</a>', '<a href="taekil-apply.html?from=' + slug + '">여기</a>', b)
    b = re.sub(r'<a href="https://naver\.me/[^"]+"><b>보고서 신청서 →</b></a>', '<a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청서 →</a>', b)
    b = re.sub(r'<p><a href="https://naver\.me/[^"]+"><b>naver\.me/[^<]+</b></a></p>', '<p><a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청하기 →</a></p>', b)
    b = b.replace('<p><b>naver.me/FdqTMrhq</b></p>', '<p><a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청하기 →</a></p>')
    return title, tags, b

def summary_lines(body, monthly):
    """「이 글의 답 세 줄」 — 월별은 상위 열 자리 첫 셋, 기둥 글은 첫 문단 셋."""
    if monthly:
        m = re.search(r'<h2>이달 상위 열 자리</h2>(.*?)<hr>', body, re.S)
        if m:
            qs = re.findall(r'<blockquote>(.*?)</blockquote>', m.group(1), re.S)
            lines = []
            for q in qs:
                for piece in re.split(r'<br\s*/?>', q):     # 한 <p> 안에 <br> 로 열 줄이 붙어 있다
                    t = strip(piece).lstrip('▸ ').strip()
                    if t: lines.append(t)
            lines = [l for l in lines if re.match(r'^\d+위', l)][:3]
            if lines: return lines
    ps = [strip(p) for p in re.findall(r'<p>(.*?)</p>', body, re.S)]
    return [p for p in ps if 12 < len(p) < 120][:3]

def page(slug, title, desc, body, summary, faq, prev_next, monthly, tags):
    url = 'https://chaeksa.kr/' + slug + '.html'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "headline": title, "description": desc, "url": url, "mainEntityOfPage": url,
         "datePublished": TODAY, "dateModified": TODAY, "inLanguage": "ko-KR",
         "author": {"@type": "Organization", "name": "책사", "url": "https://chaeksa.kr/"},
         "publisher": {"@type": "Organization", "name": "책사", "url": "https://chaeksa.kr/", "logo": {"@type": "ImageObject", "url": "https://chaeksa.kr/icon-512.png"}},
         "image": "https://chaeksa.kr/og.jpg", "keywords": ', '.join(tags[:10]), "about": "출산택일",
         # GEO(2026-09-15): AI 답변 엔진이 집어 가는 문장을 명시한다 — 「이 글의 답 세 줄」이 abstract 이고 speakable 이다.
         "abstract": ' '.join(summary),
         "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".note.answer", "h1"]},
         "citation": ["자평진전(청 심효첨)", "적천수(임철초 주석)", "궁통보감(통용 판본 조후용신표)", "삼명통회(만민영)"],
         "isAccessibleForFree": True},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "책사", "item": "https://chaeksa.kr/"},
            {"@type": "ListItem", "position": 2, "name": "출산택일", "item": "https://chaeksa.kr/taekil.html"},
            {"@type": "ListItem", "position": 3, "name": title, "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}]}
    import json
    ldjson = json.dumps(ld, ensure_ascii=False)
    nav = ''
    if prev_next:
        p, n = prev_next
        nav = '<p class="pn">' + (f'<a href="{p[0]}.html">← {p[1]}</a>' if p else '<span></span>') + (f'<a href="{n[0]}.html">{n[1]} →</a>' if n else '') + '</p>'
    summ = '<div class="note answer"><p><b>이 글의 답 세 줄</b></p>' + ''.join(f'<p>{html.escape(l)}</p>' for l in summary) + '</div>'
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)} · 책사</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="https://chaeksa.kr/og.jpg">
<meta property="og:url" content="{url}">
<meta property="article:modified_time" content="{TODAY}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@400;500;700&family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
  .doc{{max-width:660px;margin:0 auto;padding:24px 18px 90px}}
  .doc h1{{font-family:var(--serif);font-size:26px;line-height:1.4;margin-bottom:10px}}
  .doc h2{{font-size:17px;font-weight:700;color:var(--ink);margin:34px 0 11px;letter-spacing:-.01em}}
  .doc h2::after{{display:none}}
  .doc p,.doc li{{font-size:14.5px;line-height:1.9;color:var(--ink2)}}
  .doc p{{margin-bottom:11px}}
  .doc b{{color:var(--ink)}}
  .doc a{{color:var(--accent)}}
  .doc hr{{border:0;border-top:1px solid var(--line);margin:30px 0}}
  .doc blockquote{{margin:0 0 14px;padding:12px 15px;background:var(--accent-soft);border-left:3px solid var(--accent-line);border-radius:0 8px 8px 0}}
  .doc blockquote p{{margin:0 0 4px;font-size:14px}}
  .note{{border-left:3px solid var(--accent-line);background:var(--accent-soft);padding:13px 15px;border-radius:0 8px 8px 0;margin:14px 0}}
  .note p{{margin:0;font-size:14px}} .note p + p{{margin-top:7px}}
  .note.answer{{border-left-color:var(--accent);margin:18px 0 26px}}
  .doc a.btn{{color:var(--seal-ink);display:inline-block;text-decoration:none}}
  .back{{display:inline-block;margin-bottom:20px;font-size:13px;color:var(--ink3);text-decoration:none}}
  .pn{{display:flex;justify-content:space-between;gap:12px;margin-top:30px;font-size:13.5px}}
  .meta{{font-size:12.5px;color:var(--ink3);margin-bottom:18px}}
</style>
<script type="application/ld+json">{ldjson}</script>
</head>
<body>
<div class="doc">
  <a class="back" href="taekil.html">← 출산택일 안내</a>
  <h1>{html.escape(title)}</h1>
  <p class="meta">책사 · {TODAY} 갱신 · 계산은 chaeksa.kr 엔진(절기 시각·진태양시 보정), 기준은 본문에 공개</p>
  {summ}
{body}
  {nav}
  <p style="margin-top:34px;font-size:13px;color:var(--ink3)">
    <a href="./">책사 홈</a> · <a href="taekil.html">출산택일 안내</a> · <a href="taekil-apply.html">보고서 신청</a> ·
    <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a></p>
  <p style="font-size:12px;line-height:1.8;opacity:.75;color:var(--ink3)">유코아 팔달 · 대표 이승용 · 사업자등록번호 745-68-00160 · 통신판매업 제2026-대구북구-0909호<br>대구 북구 매천로 2길19 상가 126동 1층 111호 · 010-9999-1263 · dl4431@naver.com</p>
</div>
<script>
(function(){{var m=localStorage.getItem('chaeksa.theme')||'auto',h=new Date().getHours();document.documentElement.setAttribute('data-theme',(m==='night'||(m==='auto'&&(h<6||h>=18)))?'night':'day');}})();
</script>
<script src="config.js"></script>
<script src="track.js"></script>
</body>
</html>
'''

GEN_FAQ = [
    ("왜 출산택일은 시계 시각이 아니라 진태양시로 보나요?","한국 표준시는 동경 135도 기준이라 지역마다 태양시가 시계보다 24~34분 늦습니다(서울 32분, 대구·창원 26분, 부산 24분). 여기에 계절마다 균시차가 붙어, 예를 들어 오후 3시 정각 수술은 신시가 아니라 미시가 될 수 있습니다. 병원에는 시계 시각으로 경계를 넘긴 시각을 말해야 합니다."),
    ("왜 표만 보고 출산 날짜를 정하면 안 되나요?","표는 아이의 원국(타고난 네 기둥)만 본 첫 겹입니다. 실제 택일은 대운, 담당 선생님 수술 가능 시간, 부모·형제 사주와의 충, 무엇을 앞세우는지까지 네 겹을 더 얹어야 하며 그때 순위가 바뀝니다. 출산 날짜는 의사가 정하고, 택일은 그 범위 안에서 고르는 참고자료입니다."),
]

def build():
    out = []; sitemap = []
    # 월별
    items = []
    for i, (y, mo) in enumerate(MONTHS):
        src = os.path.join(M, f'붙여넣기-{mo}월출산택일.html')
        if not os.path.exists(src): continue
        items.append((y, mo, src))
    for i, (y, mo, src) in enumerate(items):
        slug = f'taekil-{y}-{mo:02d}'
        title, tags, body = transform(doc_of(read(src)), slug)
        summ = summary_lines(body, True)
        desc = f'{y}년 {mo}월 출산택일 — 모든 날 모든 시각을 시진 단위로 전부 계산한 순위. 제왕절개·유도분만 날짜 고를 때 시계 시각 경계와 표가 못 보는 것까지.'
        faq = [(f'{y}년 {mo}월 출산택일, 언제가 제일 좋나요?',' / '.join(summ) + ' (원국만 본 순위이며, 시계 시각은 지역 보정을 거친 값입니다.)')] + GEN_FAQ
        if '<h2>두 고전에 걸리지 않는 낮 자리</h2>' in body:      # 새 형식(60 · 65조, tools_wolbyeol.py) — 점수 · 순위가 없다
            m = re.search(r'<h2>이달은 이만큼 남습니다</h2>\s*<blockquote>(.*?)</blockquote>', body, re.S)
            ls = [strip(x).lstrip('▸ ').strip() for x in re.split(r'<br\s*/?>', m.group(1))] if m else []
            ls = [l for l in ls if l and l[0].isdigit() is False and '곳' in l]
            summ = ['점수와 순위를 매기지 않고, 세 고전(궁통보감 · 자평진전 · 적천수)이 각자 본 것을 시간대마다 적었습니다.'] + [f'{y}년 {mo}월, 궁통보감 · 자평진전 ' + l for l in ls if '둘 다' in l][:1] + [l for l in ls if '낮 시간' in l][:1]
            desc = f'{y}년 {mo}월 출산택일 — 모든 날 모든 시각을 시진 단위로 계산해 궁통보감 · 자평진전 · 적천수가 각자 본 것을 적었습니다. 점수 · 순위 없이, 두 고전에 걸리지 않는 자리와 병원에 말할 시계 시각까지.'
            faq = [(f'{y}년 {mo}월 출산택일, 어느 자리가 걸리는 것이 없나요?', ' '.join(summ) + ' 자리 목록은 본문에 날짜순으로 있습니다(원국만 본 것이며, 시계 시각은 서울 기준 보정값입니다).')] + GEN_FAQ
        prev = (f'taekil-{items[i-1][0]}-{items[i-1][1]:02d}', f'{items[i-1][0]}년 {items[i-1][1]}월') if i > 0 else None
        nxt = (f'taekil-{items[i+1][0]}-{items[i+1][1]:02d}', f'{items[i+1][0]}년 {items[i+1][1]}월') if i + 1 < len(items) else None
        open(os.path.join(A, slug + '.html'), 'wb').write(page(slug, title, desc, body, summ, faq, (prev, nxt), True, tags).replace('\n', '\r\n').encode('utf-8'))
        out.append((slug, f'{y}년 {mo}월', title)); sitemap.append(slug)
    # 기둥
    for name, slug, short in PILLARS:
        src = os.path.join(M, f'붙여넣기-{name}.html')
        if not os.path.exists(src): print('없음', name); continue
        title0, tags, body = transform(doc_of(read(src)), slug)
        body = '<p class="meta" style="margin-top:-8px">' + html.escape(title0) + '</p>\n' + body   # 원래 제목은 부제
        title = short                                                                          # H1·title 은 질문
        summ = summary_lines(body, False)
        desc = (strip(' '.join(summ)))[:150]
        faq = [(short, ' '.join(summ))] + GEN_FAQ
        open(os.path.join(A, slug + '.html'), 'wb').write(page(slug, title, desc, body, summ, faq, None, False, tags).replace('\n', '\r\n').encode('utf-8'))
        out.append((slug, short, title)); sitemap.append(slug)
    # sitemap
    sm = read(os.path.join(A, 'sitemap.xml'))
    for slug in sitemap:
        if slug + '.html' in sm: continue
        sm = sm.replace('</urlset>', f'  <url><loc>https://chaeksa.kr/{slug}.html</loc><lastmod>{TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>')
    open(os.path.join(A, 'sitemap.xml'), 'wb').write(sm.replace('\n', '\r\n').encode('utf-8'))
    # taekil.html 목록
    tk = read(os.path.join(A, 'taekil.html'))
    monthly = [o for o in out if o[0].startswith('taekil-20')]
    pillars = [o for o in out if not o[0].startswith('taekil-20')]
    block = ('<!-- 정본 목록 시작 (tools_jeongbon.py 가 만든다) -->\n'
             '  <h2>매달 올리는 자료 — 모든 날 모든 시각 순위</h2>\n'
             '  <p>그달 전체를 밤낮 없이 시진 단위로 나눠 전부 계산한 표입니다. 계산 근거도 함께 적었습니다.</p>\n'
             '  <ul>' + ''.join(f'<li><a href="{s}.html">{l} 출산택일</a></li>' for s, l, t in monthly) + '</ul>\n'
             '  <h2>택일을 고를 때 먼저 읽을 것</h2>\n'
             '  <ul>' + ''.join(f'<li><a href="{s}.html">{l}</a></li>' for s, l, t in pillars) + '</ul>\n'
             '<!-- 정본 목록 끝 -->')
    if '<!-- 정본 목록 시작' in tk:
        tk = re.sub(r'<!-- 정본 목록 시작.*?<!-- 정본 목록 끝 -->', block, tk, flags=re.S)
    else:
        tk = re.sub(r'  <h2>매달 올리는 자료</h2>.*?<p>블로그에서 보실 수 있습니다\.</p>\n', block + '\n', tk, count=1, flags=re.S)
    open(os.path.join(A, 'taekil.html'), 'wb').write(tk.replace('\n', '\r\n').encode('utf-8'))
    print('정본', len(out), '쪽 · 사이트맵', len(sitemap))
    for o in out: print(' ', o[0], '|', o[2][:50])

if __name__ == '__main__': build()
