# -*- coding: utf-8 -*-
"""출산택일 블로그판 검수판을 짓는다.

2026-09-10 사장님 「검수하기에 너무 어려운 형식이란 것이야」.

블로그판은 한 편이 35KB 고 그 대부분이 372줄짜리 순위표다. 그런데 순위표는
tools_taekil_verify.py 가 이미 자료와 맞대본 것이라 **사람 눈이 갈 자리가 아니다.**
사람이 봐야 하는 건 그 사이에 묻힌 판단 문장 열 줄뿐인데, 지금은 그걸 찾으려고
열두 파일을 열고 스크롤을 내려야 한다.

그래서 뒤집는다 — **판단 문장을 앞에 세우고, 순위표는 그림 한 장으로 줄인다.**

  · 왼쪽 = 사람이 봐야 하는 곳. 문장마다 번호가 붙어 있어 「3월 특징 4」로 부를 수 있다
  · 오른쪽 = 기계가 이미 센 것. 그 문장이 어느 숫자에서 나왔는지
  · 아래 = 한 달 전체 지형 한 장. 「6월은 낮이 밀린다」가 참인지 눈으로 본다

값어치는 히트맵에 있다. 문장이 참인지 재는 건 검사기가 하고, 여기서는
**고른 이야기가 그 달의 진짜 얼굴인지**를 본다. 그건 기계가 못 한다.
"""
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
시진 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
# 시계 09:00~17:00 안에 대표시각(2i:30)이 드는 슬롯. 병원 정규시간이다.
낮칸 = (5, 6, 7, 8)


def 창(i, shift):
    s = (23 + 2 * i) % 24 * 60 + shift
    e = (s + 120) % 1440
    return '%02d:%02d~%02d:%02d' % (s // 60 % 24, s % 60, e // 60 % 24, e % 60)


def 칸들(v):
    out = []
    for r in v['d']:
        for i in range(12):
            out.append((r[15 + i], r[0], r[1], i, r[3 + i]))
    return sorted(out)


def 문장들(html):
    """<p>…</p> 를 하나씩 끊어 번호를 붙인다. 사장님이 「특징 4」로 부를 수 있게."""
    return [m.group(1).strip() for m in re.finditer(r'<p>(.*?)</p>', html, re.S)]


def 원문대조(키, 취용):
    """글에 실은 조건절 옆에 **원문 전문**을 나란히 놓는다.

    흉 조항의 뒷말(死無棺槨 · 非貧即夭 · 孤苦零丁)을 잘라내고 싣기로 했는데,
    자른 자리를 사장님이 못 보면 그건 감춘 것이다. 여기서만 둘을 함께 보인다.
    """
    from tools_taekil_gen import 조건절, 근사말
    쓴 = {}
    for r in 취용['달'][키]:
        i, n = r[3], r[4]
        if i < 0 or not n:
            continue
        for s in 취용['조항'][i].split('/'):
            쓴[s] = 쓴.get(s, 0) + n
    줄 = []
    for s, n in sorted(쓴.items(), key=lambda kv: -kv[1]):
        실은 = ('「%s」' % 조건절[s]) if s in 조건절 else 근사말.get(s, '(안 실음)')
        원 = s if s in 조건절 else '원문 아님 — 관계식·근사'
        줄.append('<tr><td class="cut">%s</td><td class="src">%s</td>'
                  '<td class="cnt">%d칸</td></tr>' % (실은, 원, n))
    if not 줄:
        return '<p class="none">이달은 원문이 경계하는 짜임에 걸린 칸이 없습니다.</p>'
    return ('<table class="cutt"><tr><th>글에 실은 것</th><th>원문 전문</th><th></th></tr>'
            + ''.join(줄) + '</table>')


def 근거(v, rows, 키=None, 취용=None, 구절=None):
    """그 달에서 기계가 셀 수 있는 것 전부. 문장이 여기서 나왔어야 한다."""
    n, shift = v['n'], v['shift']
    낮 = [x for x in rows if x[3] in 낮칸 and x[2] not in ('토', '일')]
    백 = [x for x in rows if x[4] == 100]
    분포 = {}
    for x in rows[:20]:
        분포[시진[x[3]]] = 분포.get(시진[x[3]], 0) + 1
    날점 = {r[0]: r[3:15] for r in v['d']}
    고른 = sorted(날점.items(), key=lambda kv: -min(kv[1]))[:3]
    낙차 = sorted(날점.items(), key=lambda kv: -(max(kv[1]) - min(kv[1])))[:3]
    ㄴ = lambda x: '%d일(%s) %s시 %s · %d점 · %d위' % (
        x[1], x[2], 시진[x[3]], 창(x[3], shift), x[4], x[0])
    return [
        ('후보 칸', '%d칸 · %d일 · 시계 보정 %d분' % (n, len(v['d']), shift)),
        ('전체 1위', ㄴ(rows[0])),
        ('평일 낮 최고', ㄴ(낮[0]) if 낮 else '없음'),
        ('100점 칸', '%d개 — %s' % (len(백), ', '.join(
            '%d일(%s) %s시' % (x[1], x[2], 시진[x[3]]) for x in 백)) if 백 else '없음'),
        ('상위 20 시진', ' · '.join('%s %d' % (k, c) for k, c in
                                 sorted(분포.items(), key=lambda kv: -kv[1]))),
        ('상위 20 중 낮', '%d개' % sum(1 for x in rows[:20] if x[3] in 낮칸)),
        ('고른 날 (열두 칸 최저가 높은)', ' · '.join(
            '%d일 최저 %d점' % (d, min(s)) for d, s in 고른)),
        ('낙차 큰 날', ' · '.join(
            '%d일 %d점 차' % (d, max(s) - min(s)) for d, s in 낙차)),
        ('원문 구절', 원문칸(키, v, 취용, 구절)),
    ]


def 원문칸(키, v, 취용, 구절):
    """원문 구절이 안 붙은 날을 **드러낸다.** 안 보이면 비운 걸 감춘 것이다."""
    if not 키:
        return '—'
    빈 = []
    for r, 취 in zip(v['d'], 취용['달'][키]):
        일간 = r[2][0]
        if not any(구절.get(일간 + b) for b in 취[0].split('/')):
            빈.append('%d일 %s' % (r[0], r[2]))
    붙 = len(v['d']) - len(빈)
    if not 빈:
        return '%d일 전부 붙었습니다' % 붙
    return ('%d일 붙음 · <b>%d일 비어 있음</b> — %s (원문 대조 미완, docs/35)'
            % (붙, len(빈), ' · '.join(빈)))


def 히트(v):
    """일 × 시진 격자. 점수는 열 단계 색으로, 상위 20위는 인장 점으로."""
    shift = v['shift']
    # 평일 낮 네 칸은 색만으로는 안 보인다 — 칸마다 배경색이 이미 있어서
    # 옅은 띠를 덧씌워도 묻힌다. 그래서 띠의 **양끝에 선**을 세운다.
    def 띠(i):
        c = ['day'] if i in 낮칸 else []
        if i == 낮칸[0]:
            c.append('dayL')
        if i == 낮칸[-1]:
            c.append('dayR')
        return ' '.join(c)

    머리 = ''.join('<th class="%s"><b>%s</b><small>%s</small></th>'
                   % (띠(i), 시진[i], 창(i, shift)[:5])
                   for i in range(12))
    줄 = []
    for r in v['d']:
        d, w, 일주 = r[0], r[1], r[2]
        칸 = []
        for i in range(12):
            s, 순 = r[3 + i], r[15 + i]
            cls = 's%d' % min(10, s // 10)
            if 띠(i):
                cls += ' ' + 띠(i)
            if 순 <= 20:
                cls += ' top'
            칸.append('<td class="%s"><b>%d</b>%s</td>'
                      % (cls, s, '<i>%d</i>' % 순 if 순 <= 20 else ''))
        말 = ' wk' if w in ('토', '일') else ''
        줄.append('<tr><th class="d%s">%d<small>%s</small></th>%s</tr>'
                  % (말, d, w, ''.join(칸)))
    return ('<table class="heat"><thead><tr><th></th>%s</tr></thead>'
            '<tbody>%s</tbody></table>' % (머리, ''.join(줄)))


def main():
    데이터 = json.load(io.open(os.path.join(ROOT, '.taekil', '_taekil.json'),
                             encoding='utf-8'))
    메모 = json.load(io.open(os.path.join(ROOT, '.taekil', '_taekil_notes.json'),
                            encoding='utf-8'))
    취용 = json.load(io.open(os.path.join(ROOT, '.taekil', '_chwiyong.json'),
                            encoding='utf-8'))
    구절 = json.load(io.open(os.path.join(ROOT, '.taekil', '_wonmun_ok.json'),
                            encoding='utf-8'))
    차례 = sorted(데이터, key=lambda s: (int(s.split('-')[0]), int(s.split('-')[1])))

    nav, 몸 = [], []
    for 키 in 차례:
        v = 데이터[키]
        y, m = 키.split('-')
        rows = 칸들(v)
        n = 메모.get(키, {})
        nav.append('<a href="#m%s">%s월</a>' % (m, m))

        블록 = []
        for 이름, 코드 in [('이달의 절기', '절기'), ('눈여겨볼 것', '특징')]:
            ps = 문장들(n.get(코드, ''))
            줄 = ''.join('<li><span class="no">%s %d</span><p>%s</p></li>'
                         % (코드, i + 1, p) for i, p in enumerate(ps))
            블록.append('<h4>%s <small>%d줄</small></h4><ol class="say">%s</ol>'
                        % (이름, len(ps), 줄 or '<li class="none">비어 있음</li>'))

        표 = ''.join('<tr><th>%s</th><td>%s</td></tr>' % (a, b)
                     for a, b in 근거(v, rows, 키, 취용, 구절))

        몸.append(
            '<section id="m%s">'
            '<h2>%s년 %s월 <small>%d칸</small></h2>'
            '<div class="two">'
            '<div class="say-box"><p class="zone">사람이 봐야 하는 곳 — 판단이 들어갔습니다</p>%s</div>'
            '<div class="fact"><p class="zone ok">기계가 이미 센 것 — 검사기가 맞대봤습니다</p>'
            '<table class="kv">%s</table>'
            '<p class="zone cutz">원문에서 잘라낸 자리 — 뒷말을 뺐습니다</p>%s</div>'
            '</div>%s</section>'
            % (m, y, m, v['n'], ''.join(블록), 표, 원문대조(키, 취용), 히트(v)))

    p = os.path.join(ROOT, 'marketing', '검수-출산택일.html')
    with io.open(p, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write((틀.replace('{{NAV}}', ''.join(nav))
                    .replace('{{BODY}}', ''.join(몸))
                    .replace('{{N}}', str(len(차례)))).replace('\r\n', '\n'))
    print('  + %s  (%d달)' % (os.path.relpath(p, ROOT), len(차례)))


틀 = u'''<meta charset="utf-8">
<title>출산택일 검수판</title>
<style>
:root{
  --paper:#faf8f4; --card:#fff; --ink:#23201c; --ink2:#5c564d; --ink3:#928a7d;
  --line:#e6e0d5; --band:#f3efe6; --seal:#a83c2c; --deep:#2c3d52;
  --s0:#faf8f4; --s10:#2c3d52;
  color-scheme:light dark;
}
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
  --paper:#15161a; --card:#1c1e24; --ink:#e9e5dd; --ink2:#a9a49a; --ink3:#7b766d;
  --line:#2c2f37; --band:#22252c; --seal:#d4685a; --deep:#8fb4d8;
}}
:root[data-theme="dark"]{
  --paper:#15161a; --card:#1c1e24; --ink:#e9e5dd; --ink2:#a9a49a; --ink3:#7b766d;
  --line:#2c2f37; --band:#22252c; --seal:#d4685a; --deep:#8fb4d8;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:"Noto Sans KR","Malgun Gothic",-apple-system,sans-serif;
  font-size:14px;line-height:1.75;-webkit-text-size-adjust:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px 90px}
header{position:sticky;top:0;z-index:9;background:var(--paper);
  border-bottom:1px solid var(--line);padding:14px 0 10px;margin-bottom:26px}
h1{font-family:"Noto Serif KR",serif;font-size:20px;margin:0 0 4px;letter-spacing:-.02em}
.lead{color:var(--ink2);font-size:13px;margin:0 0 10px}
.lead b{color:var(--ink)}
nav{display:flex;flex-wrap:wrap;gap:6px}
nav a{display:inline-block;padding:3px 11px;border:1px solid var(--line);
  border-radius:99px;color:var(--ink2);text-decoration:none;font-size:12.5px;
  font-variant-numeric:tabular-nums}
nav a:hover,nav a:focus-visible{border-color:var(--deep);color:var(--ink);outline:none}
section{margin:0 0 46px;scroll-margin-top:92px}
h2{font-family:"Noto Serif KR",serif;font-size:22px;margin:0 0 14px;
  padding-bottom:8px;border-bottom:2px solid var(--ink);letter-spacing:-.02em}
h2 small{font-size:12px;font-weight:400;color:var(--ink3);margin-left:8px;
  font-family:"Noto Sans KR",sans-serif;letter-spacing:0}
.two{display:grid;grid-template-columns:1.35fr 1fr;gap:18px;margin-bottom:20px}
@media(max-width:860px){.two{grid-template-columns:1fr}}
.say-box,.fact{background:var(--card);border:1px solid var(--line);
  border-radius:8px;padding:16px 18px}
.say-box{border-left:3px solid var(--seal)}
.zone{margin:0 0 14px;font-size:11.5px;letter-spacing:.06em;color:var(--seal);
  text-transform:none;font-weight:700}
.zone.ok{color:var(--ink3);font-weight:500}
h4{font-size:13px;margin:18px 0 8px;color:var(--ink2);font-weight:700}
h4:first-of-type{margin-top:0}
h4 small{font-weight:400;color:var(--ink3);margin-left:5px}
ol.say{list-style:none;margin:0;padding:0}
ol.say li{display:flex;gap:10px;padding:5px 0;border-top:1px dotted var(--line)}
ol.say li:first-child{border-top:none}
ol.say li.none{color:var(--ink3)}
.no{flex:0 0 52px;font-size:11px;color:var(--ink3);padding-top:4px;
  font-variant-numeric:tabular-nums;user-select:all}
ol.say p{margin:0;font-size:14px}
ol.say b{color:var(--ink)}
table.kv{width:100%;border-collapse:collapse;font-size:12.5px}
table.kv th{text-align:left;color:var(--ink3);font-weight:500;white-space:nowrap;
  padding:5px 12px 5px 0;vertical-align:top;width:1%}
table.kv td{padding:5px 0;color:var(--ink2);font-variant-numeric:tabular-nums}
.cutz{margin:18px 0 8px;color:var(--seal);font-weight:700}
table.cutt{width:100%;border-collapse:collapse;font-size:12.5px}
table.cutt th{text-align:left;color:var(--ink3);font-weight:500;padding:0 10px 5px 0;
  border-bottom:1px solid var(--line)}
table.cutt td{padding:5px 10px 5px 0;vertical-align:top;border-bottom:1px dotted var(--line)}
table.cutt .cut{color:var(--ink);white-space:nowrap}
table.cutt .src{color:var(--ink3)}
table.cutt .cnt{color:var(--ink3);text-align:right;white-space:nowrap;
  font-variant-numeric:tabular-nums}
.fact .none{color:var(--ink3);font-size:12.5px;margin:0}
/* 격자를 **제 안에서 구르는 판**으로 만든다. 가로만 구르게 하면(overflow-x:auto)
   그 감싸개가 sticky 의 기준을 가로채서, 머리글이 쪽을 따라 안 내려온다.
   세로도 함께 구르게 해야 머리글이 판 안에 붙는다. 열두 달을 견주기에도
   한 달이 한 판으로 접혀 있는 편이 낫다 — 31줄 벽을 내리 지나칠 일이 없다. */
.heatwrap{overflow:auto;max-height:min(72vh,660px);
  border:1px solid var(--line);border-radius:8px;background:var(--card);
  overscroll-behavior:contain;scroll-margin-top:calc(var(--hh,92px) + 12px)}
table.heat{border-collapse:separate;border-spacing:0;font-size:10.5px;width:100%;
  font-variant-numeric:tabular-nums}
table.heat th{font-weight:500;color:var(--ink3);padding:5px 2px;
  background:var(--card);position:sticky;top:0;z-index:3}
table.heat thead th b{display:block;font-size:12px;color:var(--ink);font-weight:700}
table.heat thead th small{display:block;font-size:8.5px;color:var(--ink3);
  letter-spacing:-.02em}
table.heat th.d{position:sticky;left:0;top:auto;background:var(--card);text-align:right;
  padding-right:7px;font-size:11.5px;color:var(--ink2);z-index:2;min-width:38px}
table.heat thead th:first-child{left:0;z-index:4}
table.heat th.d small{color:var(--ink3);margin-left:3px;font-size:10px}
table.heat th.wk small{color:var(--seal)}
/* border-collapse:separate 이라 사방에 테두리를 주면 칸 사이가 두 겹이 된다.
   오른쪽·아래만 준다. */
table.heat td{text-align:center;padding:3px 1px;min-width:44px;position:relative;
  border-right:1px solid var(--paper);border-bottom:1px solid var(--paper)}
table.heat td b{font-weight:600;font-size:11px}
table.heat td i{display:block;font-style:normal;font-size:8.5px;opacity:.8}
table.heat td.top{outline:1.5px solid var(--seal);outline-offset:-2px}
table.heat .dayL{box-shadow:inset 2px 0 0 var(--seal)}
table.heat .dayR{box-shadow:inset -2px 0 0 var(--seal)}
table.heat thead .dayL,table.heat thead .dayR{color:var(--seal)}
table.heat thead .day b{color:var(--seal)}
.s0{background:var(--s0);color:var(--ink3)}
.s1{background:color-mix(in srgb,var(--s10) 10%,var(--s0));color:var(--ink2)}
.s2{background:color-mix(in srgb,var(--s10) 20%,var(--s0));color:var(--ink2)}
.s3{background:color-mix(in srgb,var(--s10) 30%,var(--s0));color:var(--ink2)}
.s4{background:color-mix(in srgb,var(--s10) 40%,var(--s0));color:var(--ink)}
.s5{background:color-mix(in srgb,var(--s10) 50%,var(--s0));color:var(--ink)}
.s6{background:color-mix(in srgb,var(--s10) 62%,var(--s0));color:#fff}
.s7{background:color-mix(in srgb,var(--s10) 74%,var(--s0));color:#fff}
.s8{background:color-mix(in srgb,var(--s10) 84%,var(--s0));color:#fff}
.s9{background:color-mix(in srgb,var(--s10) 92%,var(--s0));color:#fff}
.s10{background:var(--s10);color:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .s6,
 :root:not([data-theme="light"]) .s7,:root:not([data-theme="light"]) .s8,
 :root:not([data-theme="light"]) .s9,:root:not([data-theme="light"]) .s10{color:#12141a}}
:root[data-theme="dark"] .s6,:root[data-theme="dark"] .s7,
:root[data-theme="dark"] .s8,:root[data-theme="dark"] .s9,
:root[data-theme="dark"] .s10{color:#12141a}
.legend{display:flex;flex-wrap:wrap;gap:14px;align-items:center;
  font-size:11.5px;color:var(--ink3);margin:8px 2px 0}
.legend span{display:inline-flex;align-items:center;gap:5px}
.chip{width:13px;height:13px;border-radius:3px;display:inline-block}
.chip.o{outline:1.5px solid var(--seal);outline-offset:-2px;background:var(--band)}
</style>
<div class="wrap">
<header>
  <h1>출산택일 검수판 · {{N}}달</h1>
  <p class="lead">왼쪽 <b>붉은 줄</b>이 사람이 봐야 하는 곳입니다. 판단이 들어간 문장만 모았습니다.
    고칠 데가 있으면 <b>「3월 특징 4」</b>처럼 번호로 불러주세요.
    오른쪽과 아래 격자는 <b>검사기가 이미 자료와 맞대본 것</b>이라 눈으로 다시 세실 필요가 없습니다.</p>
  <nav>{{NAV}}</nav>
</header>
{{BODY}}
<p class="lead" style="text-align:center;margin-top:40px">
  격자는 <b>같은 달 안에서만</b> 견줄 수 있습니다. 다른 달 점수와 비교하면 안 됩니다.</p>
</div>
<script>
// 쪽 머리 높이를 재서 --hh 에 넣는다. 히트맵 머리글이 그 아래에 붙는다.
// 안내문이 몇 줄로 접히느냐에 따라 높이가 달라져서 고정값으로는 못 맞춘다.
(function () {
  const h = document.querySelector('header');
  const 재기 = () => document.documentElement.style.setProperty(
    '--hh', h.getBoundingClientRect().height + 'px');
  재기();
  if (window.ResizeObserver) new ResizeObserver(재기).observe(h);
  else addEventListener('resize', 재기);
})();

// 히트맵을 옆으로 굴릴 수 있게 감싼다. 표를 그대로 두면 폰에서 본문이 통째로 밀린다.
document.querySelectorAll('table.heat').forEach(t => {
  const w = document.createElement('div');
  w.className = 'heatwrap';
  t.parentNode.insertBefore(w, t);
  w.appendChild(t);
  const l = document.createElement('div');
  l.className = 'legend';
  l.innerHTML = '<span><i class="chip s0"></i><i class="chip s3"></i>'
    + '<i class="chip s6"></i><i class="chip s10"></i> 0점 → 100점</span>'
    + '<span><i class="chip o"></i> 상위 20위</span>'
    + '<span>세로 띠 = 평일 낮에 잡을 수 있는 네 시진</span>';
  w.parentNode.insertBefore(l, w.nextSibling);
});
</script>
'''

if __name__ == '__main__':
    main()
