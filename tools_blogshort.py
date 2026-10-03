# -*- coding: utf-8 -*-
"""월별 출산택일 글의 네이버 블로그판(짧은 판) — 「모든 날 모든 시각」 표는 사이트에 두고 블로그에는 답과 낮 자리만.

10-04 사장님 「전체 분석은 인기가 없네 글이 터무니없이 길어서 그런가?」 — 11월 글 33,692자 가운데 「날짜별 전부」(N월 1일 ~ 10일 · 11 ~ 20 · 21 ~ 말일)가
22,985자(68%)였다. 폰에서 끝없이 내려야 했다(09-25 사장님 「블로그에 올리기에 모바일에서 읽기가 어렵다」 — 결론 맨 위 · 긴 목록은 뒤로).
그래서 블로그판은 그 세 칸을 빼고, 그 자리에 사이트 표로 가는 줄 하나를 둔다 — 블로그 손님이 사이트로 넘어오는 길도 된다(1단계 잣대).
사이트 정본(app/taekil-YYYY-MM.html)은 지금처럼 전부 싣는다(tools_jeongbon 이 marketing/붙여넣기-N월출산택일.html 을 읽는다 — 그 파일은 안 건드린다).

  python tools_blogshort.py            → 2026-10 ~ 2027-08 열한 달: marketing/블로그-N월출산택일.html
  python tools_blogshort.py 2026 11    → 그 달만
"""
import io, os, re, sys
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ROOT = os.path.dirname(os.path.abspath(__file__))
MONTHS = [(2026, 10), (2026, 11), (2026, 12), (2027, 1), (2027, 2), (2027, 3), (2027, 4), (2027, 5), (2027, 6), (2027, 7), (2027, 8)]
글자 = lambda h: len(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h)))

def 짧게(y, mo):
    src = os.path.join(ROOT, 'marketing', f'붙여넣기-{mo}월출산택일.html')
    s = io.open(src, encoding='utf-8').read()
    # 날짜별 전부 — 「<h3>N월 1일 ~ 10일</h3>」 꼴 칸 셋을 다음 <h3> 앞까지 걷는다(사이 <hr> 포함)
    칸꼴 = re.compile(r'\s*<h3>' + str(mo) + r'월 \d+일 ~ \d+일</h3>.*?(?=<h3>)', re.S)
    걷은 = 칸꼴.findall(s)
    if len(걷은) != 3: raise SystemExit(f'{y}-{mo:02d}: 날짜별 칸이 셋이 아니다({len(걷은)}) — 생성기 꼴이 바뀌었나 확인')
    주소 = f'https://chaeksa.kr/taekil-{y}-{mo:02d}.html?from=blog-m{mo}-all'
    줄 = ('\n    <h3>날마다 열두 시진 — 모든 날 모든 시각</h3>\n'
          f'    <p>{mo}월 하루하루 열두 시진을 빠짐없이 적은 표는 길어서 사이트에 두었습니다.</p>\n'
          '    <p>사이트 표에서 날마다 열두 칸이 두 고전에 걸리는지, 왜 걸리는지 보실 수 있습니다.</p>\n'
          f'    <p><a href="{주소}"><b>{mo}월 모든 날 모든 시각 표 보기 →</b></a></p>\n\n    <hr>\n\n    ')
    첫 = s.find(걷은[0])
    s = s[:첫] + 줄 + s[첫:]
    for x in 걷은: s = s.replace(x, '', 1)
    s = re.sub(r'(<hr>\s*){2,}', '<hr>\n\n    ', s)   # 걷은 자리에 남은 겹친 줄
    # 머리 띠의 이름(붙여넣기 → 블로그판)
    s = s.replace('<title>붙여넣기', '<title>블로그판', 1)
    out = os.path.join(ROOT, 'marketing', f'블로그-{mo}월출산택일.html')
    io.open(out, 'w', encoding='utf-8', newline='').write(s)
    전, 후 = 글자(io.open(src, encoding='utf-8').read()), 글자(s)
    print(f'{y}-{mo:02d}  {전:,}자 → {후:,}자  ({os.path.basename(out)})')

if __name__ == '__main__':
    a = sys.argv[1:]
    for y, mo in ([(int(a[0]), int(a[1]))] if len(a) >= 2 else MONTHS): 짧게(y, mo)
