# -*- coding: utf-8 -*-
"""정본 생성기 — marketing/붙여넣기-*.html(네이버용 요약) → app/taekil-*.html(구글·AI용 정본).

docs/10 두 형식: 정본은 chaeksa.kr, 요약은 네이버. 2026-09-15 사장님 「구글에 보여줄 글을 만들어서 올려줘」「seo geo에 맞춰야겠지」.
정본에 얹는 것: title·description·canonical·og · Article+FAQPage+Breadcrumb JSON-LD · 맨 위 「이 글의 답 세 줄」 요약 상자
· 앞뒤 달 링크 · 끝에 「같이 읽으면 좋은 글」 · 상담 신청은 taekil-apply.html(사이트 안) · 사이트맵 · llms.txt. 문장은 요약본과 같다(두 벌이 어긋나지 않게 여기서만 만든다).

2026-09-22 점검(live-1 · 3 · 4 · 6 · 10, growth-1 · 2 · 4 · 9 · 10 · 11, rules-2, code-3)에서 고친 것:
  - 점수 · 순위 말을 뺐다(60조). FAQ 「그때 순위가 바뀝니다」, taekil.html 목록 제목 「모든 날 모든 시각 순위」.
  - 답 상자는 「답부터 드리면」 줄부터 셋을 쓴다(기둥 글은 원본에 답 줄을 넣었다). 설명(description)은 월별은 답 첫 줄, 궁통보감은 그 달 글자 줄을 앞에 쓴다.
  - 미리보기 그림 — 그 달 명식 카드(app/cards/YYYY-MM[-gungtong]/01.png)가 있으면 그것, 없으면 og.jpg.
  - 사이트 안 링크는 blog-* 꼬리표를 site-* 로 바꾼다. 시뮬레이터 링크에는 그 달(d=YYYY-MM-15)을 단다.
  - 글끼리 잇는다 — 끝에 「같이 읽으면 좋은 글」(RELATED) 셋 + 시뮬레이터. 궁통보감 글도 앞뒤 달로 잇는다.
  - **글이 안 바뀌면 파일을 안 쓴다**(날짜만 바뀐 파일이 안 생긴다). 바뀐 글만 dateModified · 사이트맵 lastmod 를 오늘로 한다.
    datePublished 는 그 파일이 git 에 처음 들어간 날이다.
  - llms.txt 의 월별 · 궁통보감 줄은 여기서 다시 쓰고, 빠진 정본은 한 줄씩 더한다(이제 손으로 안 넣어도 된다).

  python tools_jeongbon.py        # 생성 + 사이트맵 + taekil.html 목록 + llms.txt
"""
import re, os, html, datetime, sys, json, subprocess
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, 'marketing'); A = os.path.join(ROOT, 'app')
TODAY = datetime.date.today().isoformat()
SITE = 'https://chaeksa.kr/'

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
# 궁통보감 관점 월별 글(tools_gungtong.py) — 열두 달. 여섯 갈래 가운데 첫째(09-19). 달이 늘면 MONTHS 에 줄을 더한다.
PILLARS += [(f'{mo}월궁통보감', f'taekil-{y}-{mo:02d}-gungtong', f'왜 {mo}월에 태어나는 아이에겐 이 글자가 필요한가요 — 궁통보감으로 본 {y}년 {mo}월') for y, mo in MONTHS]

# 같이 읽으면 좋은 글 — 주제가 가까운 글 셋(09-22 점검: 질문 글이 들어오는 링크 하나뿐인 막다른 길이었다).
# 월별 · 궁통보감 글은 아래 related() 가 같은 달 짝을 붙인다. 없는 slug 는 건너뛴다.
RELATED = {
    'taekil-why-different': ['why-ai-three-classics', 'taekil-verify', 'taekil-how-to-choose'],
    'taekil-cesarean-date': ['taekil-doctor-schedule', 'taekil-solar-time', 'taekil-how-to-choose'],
    'taekil-how-to-choose': ['taekil-cesarean-date', 'taekil-verify', 'taekil-fate-vs-timing'],
    'taekil-verify': ['taekil-why-different', 'taekil-solar-time', 'taekil-price'],
    'taekil-price': ['taekil-verify', 'taekil-why-different', 'taekil-cesarean-date'],
    'taekil-lunar-december': ['why-ipchun-new-year', 'taekil-solar-time', 'taekil-2027-01'],
    'taekil-fate-vs-timing': ['how-good-is-my-saju', 'why-gyeok-is-my-role', 'taekil-how-to-choose'],
    'taekil-doctor-schedule': ['taekil-cesarean-date', 'taekil-solar-time', 'taekil-price'],
    'taekil-solar-time': ['why-day-starts-11pm', 'taekil-cesarean-date', 'taekil-verify'],
    'why-2026-byeongo': ['why-sixty', 'why-ipchun-new-year', 'why-four-pillars'],
    'why-day-starts-11pm': ['taekil-solar-time', 'why-four-pillars', 'why-ipchun-new-year'],
    'why-ipchun-new-year': ['taekil-lunar-december', 'why-2026-byeongo', 'why-day-starts-11pm'],
    'why-day-master-is-me': ['why-four-pillars', 'why-gyeok-is-my-role', 'how-good-is-my-saju'],
    'why-sixty': ['why-2026-byeongo', 'why-five-elements', 'why-four-pillars'],
    'why-four-pillars': ['why-day-master-is-me', 'why-day-starts-11pm', 'why-sixty'],
    'why-hap-dies': ['why-chung-happens', 'why-rootless-letters', 'why-five-elements'],
    'how-good-is-my-saju': ['why-gyeok-is-my-role', 'taekil-fate-vs-timing', 'why-ai-three-classics'],
    'why-rootless-letters': ['why-hap-dies', 'why-five-elements', 'why-day-master-is-me'],
    'why-chung-happens': ['why-hap-dies', 'taekil-how-to-choose', 'why-rootless-letters'],
    'why-five-elements': ['why-sixty', 'why-hap-dies', 'why-rootless-letters'],
    'why-gyeok-is-my-role': ['how-good-is-my-saju', 'why-day-master-is-me', 'why-ai-three-classics'],
    'why-ai-three-classics': ['taekil-why-different', 'how-good-is-my-saju', 'taekil-verify'],
}

def read(p): return open(p, 'rb').read().decode('utf-8').replace('\r\n', '\n')
def write(p, s): open(p, 'wb').write(s.replace('\n', '\r\n').encode('utf-8'))
def strip(s): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip()
def cut(s, n=160):
    """설명(description)은 160자 안쪽에서 문장 끝으로 자른다 — 낱말 가운데서 끊지 않게."""
    if len(s) <= n: return s
    k = s.rfind('. ', 0, n)
    return s[:k + 1] if k > 60 else s[:n].rstrip() + '…'
def doc_of(s):
    m = re.search(r'<div id="doc">(.*?)</div>\s*</div>\s*<script', s, re.S); return m.group(1)

def month_of(slug):
    m = re.match(r'taekil-(\d{4})-(\d{2})(-gungtong)?$', slug)
    return (int(m.group(1)), int(m.group(2)), bool(m.group(3))) if m else None

def sim_href(slug, tag):
    """시뮬레이터 링크 — 달 글이면 그 달 15일로 열리게 d 를 단다(taekilsim.js 첫날())."""
    ym = month_of(slug)
    return 'taekil-sim.html?from=site-' + tag + (f'&amp;d={ym[0]}-{ym[1]:02d}-15' if ym else '')

def site_tag(slug):
    ym = month_of(slug)
    if ym: return ('gt' if ym[2] else 'm') + str(ym[1])
    return slug

def transform(body, slug):
    b = body
    h2 = re.search(r'<h2>(.*?)</h2>', b, re.S); title = strip(h2.group(1)) if h2 else slug
    b = re.sub(r'<h2>.*?</h2>', '', b, count=1, flags=re.S)
    b = re.sub(r'<p class="alt">.*?</p>', '', b, flags=re.S)                   # 제목 대안 · 그림 안내(붙여넣는 사람에게 하는 말)는 안 낸다
    tags = re.findall(r'#([^\s#<]+)', ''.join(re.findall(r'<p class="tag">(.*?)</p>', b, re.S)))
    b = re.sub(r'<p class="tag">.*?</p>', '', b, flags=re.S)
    b = b.replace('<h3>', '<h2>').replace('</h3>', '</h2>')
    # 사이트 안 링크 — 꼬리표는 site-*, 신청은 사이트 신청 페이지.
    # 다른 글 · 시뮬레이터로 가는 링크도 site-* 로 — blog-* 를 달면 검색으로 읽은 사람이 블로그 손님으로 세어진다(09-22 growth-4).
    b = re.sub(r'https://chaeksa\.kr/\?from=blog-([a-z0-9-]+)', r'./?from=site-\1', b)
    b = re.sub(r'https://chaeksa\.kr/([a-z0-9-]+\.html)\?from=blog-([a-z0-9-]+)',
               lambda m: sim_href(slug, m.group(2)) if m.group(1) == 'taekil-sim.html' else f'{m.group(1)}?from=site-{m.group(2)}', b)
    b = re.sub(r'<a href="https://naver\.me/[^"]+">여기</a>', '<a href="taekil-apply.html?from=' + slug + '">여기</a>', b)
    b = re.sub(r'<a href="https://naver\.me/[^"]+"><b>보고서 신청서 →</b></a>', '<a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청서 →</a>', b)
    b = re.sub(r'<p><a href="https://naver\.me/[^"]+"><b>naver\.me/[^<]+</b></a></p>', '<p><a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청하기 →</a></p>', b)
    b = b.replace('<p><b>naver.me/FdqTMrhq</b></p>', '<p><a class="btn" href="taekil-apply.html?from=' + slug + '">보고서 신청하기 →</a></p>')
    return title, tags, b

def summary_lines(body):
    """「이 글의 답 세 줄」 — 「답부터 드리면」 줄부터 셋. 그 줄이 없으면 첫 문단 셋."""
    ps = [strip(p) for p in re.findall(r'<p>(.*?)</p>', body, re.S)]
    ps = [p for p in ps if 12 < len(p) < 120]
    i = next((k for k, p in enumerate(ps) if p.startswith('답부터')), 0)
    return ps[i:i + 3]

def monthly_summary(body, y, mo):
    """월별 종합 글(tools_wolbyeol.py) — 으뜸이 있으면 그것이 답이다(68조). 점수 · 순위는 없다(60 · 65조)."""
    m = re.search(r'<h2>이달은 이만큼 남습니다</h2>\s*<blockquote>(.*?)</blockquote>', body, re.S)
    ls = [strip(x).lstrip('▸ ').strip() for x in re.split(r'<br\s*/?>', m.group(1))] if m else []
    ls = [l for l in ls if l and not l[0].isdigit() and '곳' in l]
    summ = ['점수와 순위를 매기지 않고, 세 고전(궁통보감 · 자평진전 · 적천수)이 각자 본 것을 시간대마다 적었습니다.'] + [f'{y}년 {mo}월, 궁통보감 · 자평진전 ' + l for l in ls if '둘 다' in l][:1] + [l for l in ls if '낮 시간' in l][:1]
    mu = re.search(r'<h2>이달의 으뜸 자리</h2>.*?<blockquote>(.*?)</blockquote>', body, re.S)
    if mu and '<h2>두 고전에 걸리지 않는 낮 자리</h2>' in body[mu.end():]:
        us = [u for u in (strip(x).lstrip('▸ ').strip() for x in re.split(r'<br\s*/?>', mu.group(1))) if u]
        낮먼저 = [u for u in us if '밤/새벽' not in u and '저녁' not in u] + [u for u in us if '저녁' in u] + [u for u in us if '밤/새벽' in u]
        summ = [f'{y}년 {mo}월의 으뜸 자리는 {len(us)}곳입니다 — 궁통보감 · 자평진전에 걸리는 것이 없고, 궁통보감이 적어 둔 글자가 천간에 다 뜬 시각(서울 시계 기준).'] + 낮먼저[:2]
    return summ

def og_image(slug):
    """미리보기 그림 — 그 달 첫 명식 카드가 있으면 그것(09-22 live-1 · growth-2: og.jpg 는 사이트 전체 그림)."""
    ym = month_of(slug)
    if ym:
        folder = f'{ym[0]}-{ym[1]:02d}' + ('-gungtong' if ym[2] else '')
        p = os.path.join(A, 'cards', folder, '01.png')
        if os.path.exists(p):
            try:
                from PIL import Image
                w, h = Image.open(p).size
            except Exception:
                w = h = None
            return f'{SITE}cards/{folder}/01.png', w, h
    return SITE + 'og.jpg', 1200, 630

def first_added(slug):
    """그 파일이 git 에 처음 들어간 날 — datePublished. git 이 없거나 새 파일이면 None."""
    try:
        out = subprocess.run(['git', 'log', '--diff-filter=A', '--format=%cs', '--', f'app/{slug}.html'], cwd=ROOT,
                             capture_output=True, text=True, timeout=30).stdout.split()
        return out[-1] if out else None
    except Exception:
        return None

def page(slug, title, desc, body, summary, faq, prev_next, related, img, published, modified, tags):
    url = SITE + slug + '.html'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "headline": title, "description": desc, "url": url, "mainEntityOfPage": url,
         "datePublished": published, "dateModified": modified, "inLanguage": "ko-KR",
         "author": {"@type": "Organization", "name": "책사", "url": SITE},
         "publisher": {"@type": "Organization", "name": "책사", "url": SITE, "logo": {"@type": "ImageObject", "url": SITE + "icon-512.png"}},
         "image": img[0], "keywords": ', '.join(tags[:10]), "about": "출산택일",
         # GEO(2026-09-15): AI 답변 엔진이 집어 가는 문장을 명시한다 — 「이 글의 답 세 줄」이 abstract 이고 speakable 이다.
         "abstract": ' '.join(summary),
         "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".note.answer", "h1"]},
         "citation": ["자평진전(청 심효첨)", "적천수(임철초 주석)", "궁통보감(통용 판본 조후용신표)", "삼명통회(만민영)"],
         "isAccessibleForFree": True},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "책사", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "출산택일", "item": SITE + "taekil.html"},
            {"@type": "ListItem", "position": 3, "name": title, "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}]}
    ldjson = json.dumps(ld, ensure_ascii=False)
    nav = ''
    if prev_next:
        p, n = prev_next
        if p or n:
            nav = '<p class="pn">' + (f'<a href="{p[0]}.html">← {p[1]}</a>' if p else '<span></span>') + (f'<a href="{n[0]}.html">{n[1]} →</a>' if n else '') + '</p>'
    summ = '<div class="note answer"><p><b>이 글의 답 세 줄</b></p>' + ''.join(f'<p>{html.escape(l)}</p>' for l in summary) + '</div>'
    rel = ('<div class="readmore">'
           + ('<p><b>같이 읽으면 좋은 글</b></p><ul>' + ''.join(f'<li><a href="{s}.html">{html.escape(t)}</a></li>' for s, t in related) + '</ul>' if related else '')
           + f'<p>날짜를 직접 넣어 보시려면 <a href="{sim_href(slug, site_tag(slug))}">출산택일 시뮬레이터</a>를 여세요. 회원가입 없이 무료입니다.</p></div>')
    imgmeta = f'<meta property="og:image" content="{img[0]}">' + (f'\n<meta property="og:image:width" content="{img[1]}">\n<meta property="og:image:height" content="{img[2]}">' if img[1] else '')
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
{imgmeta}
<meta property="og:url" content="{url}">
<meta property="article:published_time" content="{published}">
<meta property="article:modified_time" content="{modified}">
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
  .readmore{{margin-top:34px;border-top:1px solid var(--line);padding-top:20px}}
  .readmore ul{{margin:6px 0 12px 18px}} .readmore li{{margin-bottom:6px}}
</style>
<script type="application/ld+json">{ldjson}</script>
</head>
<body>
<div class="doc">
  <a class="back" href="taekil.html">← 출산택일 안내</a>
  <h1>{html.escape(title)}</h1>
  <p class="meta">책사 · {modified} 갱신 · 계산은 chaeksa.kr 엔진(절기 시각·진태양시 보정), 기준은 본문에 공개</p>
  {summ}
{body}
  {rel}
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
    ("왜 표만 보고 출산 날짜를 정하면 안 되나요?","표는 아이의 원국(타고난 네 기둥)만 본 첫 겹입니다. 실제 택일은 대운, 담당 선생님 수술 가능 시간, 부모·형제 사주와의 충, 무엇을 앞세우는지까지 네 겹을 더 얹어야 하며, 겹마다 남는 시각이 달라집니다. 출산 날짜는 의사가 정하고, 택일은 그 범위 안에서 고르는 참고자료입니다."),
]

def write_page(slug, make):
    """글이 그대로면 파일을 안 쓴다 — 날짜만 바뀐 파일이 생기지 않게(09-22). 바뀌었으면 오늘 날짜로 쓰고 True."""
    p = os.path.join(A, slug + '.html')
    old = read(p) if os.path.exists(p) else ''
    mm = re.search(r'"dateModified": "(\d{4}-\d{2}-\d{2})"', old)
    pm = re.search(r'"datePublished": "(\d{4}-\d{2}-\d{2})"', old)
    published = first_added(slug) or (pm.group(1) if pm else TODAY)
    if old and mm and make(published, mm.group(1)) == old:
        return False
    write(p, make(published, TODAY))
    return True

def related(slug, titles):
    ym = month_of(slug)
    if ym:
        y, mo, gt = ym
        짝 = f'taekil-{y}-{mo:02d}' + ('' if gt else '-gungtong')
        rs = [짝] + (['why-ai-three-classics', 'taekil-solar-time'] if gt else ['taekil-solar-time', 'taekil-how-to-choose'])
    else:
        rs = RELATED.get(slug, [])
    return [(s, titles[s]) for s in rs if s in titles and s != slug][:3]

def build():
    # 1) 모은다 — 제목 표가 있어야 서로 잇는다
    pages = []      # (slug, title, desc, body, summ, faq, prev_next, tags, label)
    items = [(y, mo, os.path.join(M, f'붙여넣기-{mo}월출산택일.html')) for y, mo in MONTHS]
    items = [it for it in items if os.path.exists(it[2])]
    for i, (y, mo, src) in enumerate(items):
        slug = f'taekil-{y}-{mo:02d}'
        title, tags, body = transform(doc_of(read(src)), slug)
        summ = monthly_summary(body, y, mo) if '<h2>두 고전에 걸리지 않는 낮 자리</h2>' in body else summary_lines(body)
        # 설명은 그 달 답 첫 줄부터(09-22 growth-11: 열두 편이 달 이름만 빼고 같았다). 으뜸이 없는 달은 남는 곳 수가 답이다.
        앞 = summ[0] if summ[0].startswith(f'{y}년') else f'{y}년 {mo}월 출산택일 — ' + ' · '.join(re.sub(rf'^{y}년 {mo}월, ', '', s) for s in summ[1:])
        desc = 앞 + ' 모든 날 모든 시각을 계산해 세 고전이 각자 본 것을 점수 · 순위 없이 날짜순으로 적었습니다.'
        faq = [(f'{y}년 {mo}월 출산택일, 어느 자리가 걸리는 것이 없나요?', ' '.join(summ) + ' 자리 목록은 본문에 날짜순으로 있습니다(원국만 본 것이며, 시계 시각은 서울 기준 보정값입니다).')] + GEN_FAQ
        prev = (f'taekil-{items[i-1][0]}-{items[i-1][1]:02d}', f'{items[i-1][0]}년 {items[i-1][1]}월') if i > 0 else None
        nxt = (f'taekil-{items[i+1][0]}-{items[i+1][1]:02d}', f'{items[i+1][0]}년 {items[i+1][1]}월') if i + 1 < len(items) else None
        pages.append((slug, title, desc, body, summ, faq, (prev, nxt), tags, f'왜 {y}년 {mo}월 출산택일은 이 시각인가요 — 세 고전이 본 것'))
    gts = [slug for _, slug, _ in PILLARS if slug.endswith('-gungtong') and os.path.exists(os.path.join(M, f'붙여넣기-{month_of(slug)[1]}월궁통보감.html'))]
    for name, slug, short in PILLARS:
        src = os.path.join(M, f'붙여넣기-{name}.html')
        if not os.path.exists(src): print('없음', name); continue
        title0, tags, body = transform(doc_of(read(src)), slug)
        body = '<p class="meta" style="margin-top:-8px">' + html.escape(title0) + '</p>\n' + body   # 원래 제목은 부제
        summ = summary_lines(body)
        pn = None; label = short
        ym = month_of(slug)
        if ym:      # 궁통보감 — 설명에 그 달과 그 달에 찾는 글자(둘째 줄)를 먼저(09-22 live-6 · growth-11: 열두 편 설명이 글자 하나 안 달랐다)
            desc = cut(' '.join(summ[1:2] + summ[:1]))
            k = gts.index(slug)
            lab = lambda s: f'{month_of(s)[0]}년 {month_of(s)[1]}월 궁통보감'
            pn = ((gts[k - 1], lab(gts[k - 1])) if k > 0 else None, (gts[k + 1], lab(gts[k + 1])) if k + 1 < len(gts) else None)
            label = f'궁통보감으로 본 {ym[0]}년 {ym[1]}월 — 이 달 아이에게 필요한 글자'
        else:
            desc = cut(strip(' '.join(summ)))
        faq = [(short, ' '.join(summ))] + GEN_FAQ
        pages.append((slug, short, desc, body, summ, faq, pn, tags, label))
    titles = {pg[0]: pg[8] for pg in pages}
    # 2) 쓴다 — 바뀐 글만
    changed = {}
    for slug, title, desc, body, summ, faq, pn, tags, label in pages:
        img = og_image(slug); rel = related(slug, titles)
        changed[slug] = write_page(slug, lambda pub, mod: page(slug, title, desc, body, summ, faq, pn, rel, img, pub, mod, tags))
    # 3) taekil.html 목록
    monthly = [pg for pg in pages if month_of(pg[0]) and not month_of(pg[0])[2]]
    gungtong = [pg for pg in pages if month_of(pg[0]) and month_of(pg[0])[2]]
    taekilq = [pg for pg in pages if not month_of(pg[0]) and pg[0].startswith('taekil-')]
    whys = [pg for pg in pages if not month_of(pg[0]) and not pg[0].startswith('taekil-')]
    li = lambda xs, f: '  <ul>' + ''.join(f'<li><a href="{pg[0]}.html">{html.escape(f(pg))}</a></li>' for pg in xs) + '</ul>\n'
    block = ('<!-- 정본 목록 시작 (tools_jeongbon.py 가 만든다) -->\n'
             '  <h2>매달 올리는 자료 — 두 고전에 걸리지 않는 시각을 날짜순으로</h2>\n'
             '  <p>그달 모든 날 모든 시각을 계산해, 궁통보감 · 자평진전 두 고전에 걸리는 것이 없는 시각을 날짜순으로 적었습니다. 점수와 순위는 매기지 않습니다. 계산 근거도 함께 적었습니다.</p>\n'
             + li(monthly, lambda pg: f'{pg[0][7:11]}년 {int(pg[0][12:14])}월 출산택일') +
             '  <p>날짜를 직접 넣어 보시려면 <a href="taekil-sim.html?from=site-taekil">출산택일 시뮬레이터</a>를 여세요. 회원가입 없이 무료입니다.</p>\n'
             '  <h2>궁통보감으로 본 달 — 이 달에 태어나는 아이에게 필요한 글자</h2>\n'
             + li(gungtong, lambda pg: pg[1]) +
             '  <h2>택일을 고를 때 먼저 읽을 것</h2>\n'
             + li(taekilq, lambda pg: pg[1]) +
             '  <h2>사주에 대한 「왜」</h2>\n'
             + li(whys, lambda pg: pg[1]) +
             '<!-- 정본 목록 끝 -->')
    tp = os.path.join(A, 'taekil.html'); tk0 = read(tp)
    if '<!-- 정본 목록 시작' in tk0:
        tk = re.sub(r'<!-- 정본 목록 시작.*?<!-- 정본 목록 끝 -->', lambda m: block, tk0, flags=re.S)
    else:
        tk = re.sub(r'  <h2>매달 올리는 자료</h2>.*?<p>블로그에서 보실 수 있습니다\.</p>\n', lambda m: block + '\n', tk0, count=1, flags=re.S)
    if tk != tk0: write(tp, tk)
    changed['taekil'] = tk != tk0
    # 4) 사이트맵 — 바뀐 글만 lastmod 를 오늘로, 없는 글은 더한다
    smp = os.path.join(A, 'sitemap.xml'); sm = sm0 = read(smp)
    for slug, ch in changed.items():
        loc = f'{SITE}{slug}.html'
        if loc not in sm:
            sm = sm.replace('</urlset>', f'  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>')
        elif ch:
            sm = re.sub(r'(<loc>' + re.escape(loc) + r'</loc>\s*<lastmod>)[^<]*(</lastmod>)', r'\g<1>' + TODAY + r'\2', sm)
    if sm != sm0: write(smp, sm)
    # 5) llms.txt
    llms(pages)
    n = sum(1 for s, c in changed.items() if c and s != 'taekil')
    print('정본', len(pages), '쪽 · 바뀐 글', n, '· taekil.html', '바뀜' if changed['taekil'] else '그대로')
    for pg in pages: print(' ', '*' if changed[pg[0]] else ' ', pg[0], '|', pg[1][:50])

# llms.txt — AI 답변 엔진이 읽는 안내판. 월별 · 궁통보감 절은 통째로 다시 쓰고, 나머지는 빠진 정본만 한 줄씩 더한다(손으로 쓴 요약은 둔다).
LLMS_MONTHLY = '## 월별 출산택일 — 두 고전에 걸리지 않는 시각'
LLMS_GT = '## 궁통보감으로 본 달'
LLMS_TQ = '## 출산택일 질문'
LLMS_WHY = '## 「왜」 — 사주 자체에 대한 질문과 답'

def _sec(txt, head, lines):
    """head 절의 본문을 lines 로 갈아 끼운다(절이 없으면 「## 계산기」 앞에 만든다)."""
    body = '\n'.join(lines) + '\n'
    if head in txt:
        return re.sub(re.escape(head) + r'\n.*?(?=\n## |\Z)', lambda m: head + '\n\n' + body, txt, count=1, flags=re.S)
    return txt.replace('## 계산기', head + '\n\n' + body + '\n## 계산기', 1)

def _add(txt, head, line):
    """head 절 끝에 한 줄 더한다."""
    m = re.search(re.escape(head) + r'\n.*?(?=\n\n## |\Z)', txt, re.S)
    if not m: return txt.replace('## 계산기', head + '\n\n' + line + '\n\n## 계산기', 1)
    return txt[:m.end()] + '\n' + line + txt[m.end():]

def llms(pages):
    p = os.path.join(A, 'llms.txt')
    if not os.path.exists(p): return
    raw = open(p, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
    txt = t0 = raw.replace('\r\n', '\n')
    짧게 = lambda s, n=220: s if len(s) <= n else s[:n].rstrip() + '…'
    mon = [pg for pg in pages if month_of(pg[0]) and not month_of(pg[0])[2]]
    gt = [pg for pg in pages if month_of(pg[0]) and month_of(pg[0])[2]]
    txt = _sec(txt, LLMS_MONTHLY, ['한 달을 날마다 열두 시진으로 전부 계산해, 궁통보감 · 자평진전에 걸리는 것이 없는 시각을 날짜순으로 적는다. 점수 · 순위는 매기지 않는다. 원국만 본 첫 겹이며, 대운 · 담당의 수술 시간 · 가족 충 · 최종 판단은 보고서에서 사람이 얹는다.', '']
                   + [f'- [{pg[0][7:11]}년 {int(pg[0][12:14])}월 출산택일]({SITE}{pg[0]}.html): {짧게(" 예: ".join(pg[4][:2]))}' for pg in mon])
    txt = _sec(txt, LLMS_GT, ['궁통보감 한 권이 본 것만 적은 달 글. 태어난 달과 날의 천간을 짝지어 아이에게 먼저 찾는 글자와, 그 글자가 천간에 뜨는 시각(서울 시계).', '']
                   + [f'- [{pg[1]}]({SITE}{pg[0]}.html): {짧게(pg[4][1] if len(pg[4]) > 1 else pg[4][0])}' for pg in gt])
    for pg in pages:
        if month_of(pg[0]): continue
        url = f'{SITE}{pg[0]}.html'
        if url in txt: continue
        요약 = re.sub(r'^답부터 드리면, ', '', ' '.join(pg[4])).replace('▸ ', '')
        txt = _add(txt, LLMS_TQ if pg[0].startswith('taekil-') else LLMS_WHY, f'- [{pg[1]}]({url}): {짧게(요약)}')
    if txt != t0:
        open(p, 'wb').write((txt.replace('\n', '\r\n') if crlf else txt).encode('utf-8'))

if __name__ == '__main__': build()
