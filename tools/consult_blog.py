# -*- coding: utf-8 -*-
"""출산택일 상담 · 재문의 답을 블로그 붙여넣기 글로 짠다 — 10-14 사장님 「잘했어 스킬로 저장해」(성남 재문의 네 곳 글).
  python tools/consult_blog.py <글.json> <나갈 붙여넣기.html>
꼴은 택일상담 스킬 「블로그 글 꼴」 그대로다:
  제목(질문) · 첫 줄(답) → 순서는 사주로만(세 단계 기준) → 순서 한눈에 → 곳마다 같은 모양
  (사주 카드 → [1단계 사주 자체] → [2단계 대운] → 명반 카드 → [참고 · 자미두수] 크게 반긴 말 · 크게 걱정한 말 · 그 밖에 좋게 · 조심)
  → 정리 → 귀인 · 신살(맨 뒤 한 칸, 일시 + 귀인 / 신살, 뜻은 이름마다 한 번) → 원문 · 면책 · 시계 시각 · 출산 후 확인 · 해시태그.
글.json 의 칸은 .claude/skills/택일상담/references/블로그-예시.json 을 본다. 값(반김 · 걱정 구절 · 귀인 · 신살)은
tools/consult_ziwei_lines.js · tools/consult_sinsal.js 가 낸 것을 옮긴다(지어내지 않는다). 구절은 「뜻(원문)」 꼴, 순하게 바꾸지 않는다.
「꼬리표」 · 「반김」 · 「걱정 N」 · 「실단」 은 우리끼리 말이라 글에 들어가면 멈춘다(10-14 「꼬리표는 우리끼리 얘기인데」).
부모님 일지 · 생일은 넣지 않는다(10-14). 이 파일이 낸 글은 부모 정보가 없지만, 답글 폴더는 커밋하지 않는다.
"""
import sys, json, re, html
sys.stdout.reconfigure(encoding='utf-8')

HEAD = '''<meta charset="utf-8">
<title>붙여넣기 · {title}</title>
<style>
 :root{{ --ink:#222; --sub:#888; --line:#e8e8e8; --pt:#03c75a; color-scheme:light; }}
 *{{box-sizing:border-box}}
 body{{margin:0;background:#f4f4f4;color:var(--ink);
   font-family:"Noto Sans KR","Malgun Gothic",-apple-system,sans-serif}}
 .bar{{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);
   padding:14px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;z-index:9}}
 .bar b{{font-size:14px}}
 .bar span{{font-size:13px;color:var(--sub);line-height:1.6}}
 .bar button{{background:var(--pt);color:#fff;border:0;border-radius:6px;
   padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}}
 .wrap{{max-width:720px;margin:22px auto;background:#fff;padding:34px 30px 50px;
   border:1px solid var(--line)}}
 #doc h2{{font-size:22px;line-height:1.4;margin:0 0 6px;font-weight:700}}
 #doc .alt{{font-size:13.5px;color:var(--sub);margin:0 0 24px}}
 #doc h3{{font-size:20px;font-weight:700;margin:30px 0 14px;line-height:1.45}}
 #doc p{{font-size:16px;line-height:1.8;margin:0 0 15px}}
 #doc hr{{border:0;border-top:1px solid var(--line);margin:26px 0}}
 #doc blockquote{{margin:0 0 16px;padding:14px 16px;background:#f7f7f7;
   border-left:3px solid var(--pt)}}
 #doc blockquote p{{font-size:15px;line-height:1.9;margin:0}}
 .done{{background:#111 !important}}
</style>

'''
TAIL = '''<script>
document.getElementById('copy').onclick = async () => {
  const el = document.getElementById('doc');
  const clone = el.cloneNode(true);
  clone.querySelectorAll('h2, .alt').forEach(x => x.remove());   // 제목 · 그림 안내 줄은 빼고
  const html = clone.innerHTML;
  const text = clone.innerText;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], {type:'text/html'}),
      'text/plain': new Blob([text], {type:'text/plain'}),
    })]);
  } catch (e) {
    const r = document.createRange(); r.selectNodeContents(clone);
    document.body.appendChild(clone);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.execCommand('copy'); sel.removeAllRanges(); clone.remove();
  }
  const b = document.getElementById('copy');
  b.textContent = '복사됐습니다 — 붙여넣으세요'; b.classList.add('done');
  setTimeout(() => { b.textContent = '본문 전체 복사'; b.classList.remove('done'); }, 2600);
};
</script>
'''
# 귀인 · 신살 뜻 — 정통사주 엔진(samyeong.js, 삼명통회 卷三 · 卷六) 뜻 칸을 입니다체로 줄인 것. 새 이름이 나오면 엔진 뜻 칸에서 옮겨 여기에 더한다.
# 순서: 귀인 먼저, 신살 뒤(글에도 이 순서로 나간다).
GWI = {
 '천을귀인': '삼명통회가 가장 높고 귀하다고 한 신입니다. 있는 곳에서는 나쁜 살이 숨어 피하고, 이름이 일찍 나고 자리가 쉽게 오른다고 했습니다. 다만 그 자리가 충을 맞거나 공망에 들면 힘을 잃는다고 했습니다.',
 '천덕': '남을 이롭게 하고 나쁜 것을 덮어 좋게 돌리는 기운입니다. 책은 이 글자를 얻으면 평생 편안하고, 나쁜 일을 만나도 저절로 흩어진다고 했습니다. 태어난 날에 있는 것을 으뜸으로 쳤습니다.',
 '월덕': '천덕과 짝을 이루는 덕입니다. 두 덕이 붙들어 주면 나쁜 것들이 풀려 흩어진다고 했습니다.',
 '학당': '글 읽는 집이라는 뜻입니다. 책은 만나면 총명하고 재주가 있으며 시험과 글에서 빼어나다고 했습니다.',
 '금여': '금 수레라는 뜻입니다. 책은 성품이 부드럽고 몸가짐이 온화하다고 했고, 태어난 날과 시에 있는 것이 좋다고 했습니다.',
 '괴강': '책은 괴강일에 난 사람이 총명하고 결단이 빠르며 권세를 쥔다고 했습니다. 내 힘이 세면 견줄 데 없이 귀하고, 약하면 몹시 가난하다고도 했습니다.',
 '망신': '안에서 새어 나가 잃는다는 뜻입니다. 책은 좋게 나오면 위엄이 있고 꾀와 셈이 밝으며, 나쁘게 나오면 조급하고 시비 · 송사가 따른다고 했습니다.',
 '공망': '열 천간과 열두 지지를 짝지으면 남는 두 지지입니다. 책은 비었다고 곧 나쁘다 할 수 없다고 했습니다. 나쁜 살이 모인 자리는 풀어 주고, 복이 모인 자리는 흩어 버린다고 했습니다.',
}

src, out = sys.argv[1], sys.argv[2]
c = json.load(open(src, encoding='utf-8'))
GWI.update(c.get('뜻더하기', {}))
U = c['카드주소'].rstrip('/') + '/'
def img(n, alt): return f'<p class="card-img"><img src="{U}{n}.png" alt="{html.escape(alt)}" style="max-width:100%"></p>\n<p class="alt">그림이 따라오지 않으면 폴더의 같은 번호 그림을 끌어다 놓으세요.</p>'
def P(t): return f'<p>{t}</p>'
def Q(lines): return '<blockquote>' + ''.join(f'<p>▸ {l}</p>' for l in lines) + '</blockquote>'

T = c['제목']
S = [f'<h2>{T}</h2>', P(c['답']), *[P(x) for x in c.get('물음', [])]]
S.append('<h3>순서는 사주로만 정했습니다</h3>')
S.append(Q(['1단계 사주 자체 — 궁통보감 · 자평진전 두 고전에 걸리는 것이 없는가',
            '2단계 + 대운 — 50살 전에 오는 대운에 사주와 부딪히는 글자(충)가 없는가',
            '자미두수와 귀인 · 신살은 순서에 넣지 않고 참고로 함께 적었습니다. 자미두수는 《자미두수전서》 원문이 크게 반긴 말과 크게 걱정한 말이 걸렸는지를 보았고, 귀인 · 신살은 맨 뒤에 한 번에 모았습니다.']))
S.append(P(c['통과']))
S.append(Q(c['순서']))
S += [P(x) for x in c.get('순서덧말', [])]
S.append(P('대운에 들어오는 합은 걸러내지 않았습니다. 합은 글자의 십성이 묶여서 기능을 잃거나 합생할 수 있어, 좋다 나쁘다로 정하지 않았습니다.'))

for b in c['곳']:
    S.append('<hr>')
    S.append(f"<h3>{b['등']} · {b['때']}</h3>")
    S.append(img(b['사주카드'], b['때'] + ' 사주 명식'))
    S.append(P('<b>[1단계 사주 자체]</b> ' + b['사주']))
    S.append(Q(b['1단계']))
    S.append(P('<b>[2단계 대운]</b>'))
    S.append(Q(b['2단계']))
    S.append(img(b['명반카드'], b['때'] + ' 자미두수 명반'))
    S.append(P('<b>[참고 · 자미두수]</b> ' + b['명궁']))
    반, 걱 = b.get('크게반긴말', []), b.get('크게걱정한말', [])
    S.append(P('<b>크게 반긴 말 ' + (f'{len(반)}줄' if 반 else '없음') + ' · 크게 걱정한 말 ' + (f'{len(걱)}줄' if 걱 else '없음') + '</b>'))
    if 반: S += [P('옛 책이 크게 반긴 말'), Q(반)]
    if 걱: S += [P('옛 책이 크게 걱정한 말'), Q(걱)]
    if not b.get('좋게'): sys.exit(f"멈춤: {b['때']} — 원문이 좋게 본 것이 비었습니다(조심만 옮기지 않는다)")
    S += [P('그 밖에 원문이 좋게 본 것'), Q(b['좋게'])]
    if b.get('조심'): S += [P('그 밖에 원문이 조심하라고 한 것'), Q(b['조심'])]

S.append('<hr>')
S.append('<h3>정리</h3>')
S.append(Q(c['정리']))
S += [P(x) for x in c['고르신다면']]

S.append('<hr>')
S.append('<h3>귀인 · 신살</h3>')
S.append(P('삼명통회 卷三 · 卷六 기준입니다. 순서에는 넣지 않았습니다.'))
S.append(Q([f"{r['때']} — 귀인 {' · '.join(r['귀인']) or '없음'} / 신살 {' · '.join(r['신살']) or '없음'}" for r in c['귀인신살']]))
있는 = {n for r in c['귀인신살'] for n in r['귀인'] + r['신살']}
없는뜻 = 있는 - set(GWI)
if 없는뜻: sys.exit('멈춤: 뜻이 없는 이름 — ' + ' · '.join(sorted(없는뜻)) + ' (엔진 뜻 칸을 입니다체로 옮겨 글.json 「뜻더하기」에 넣는다)')
S.append(P('책이 말한 뜻'))
S.append(Q([f'{n} — {GWI[n]}' for n in GWI if n in 있는]))
S.append(P('자미두수와 귀인 · 신살의 말은 옛 책 원문을 그대로 옮긴 것입니다. 원문은 조건이 맞을 때를 말한 것이고, 한 구절이 한 사람의 삶을 정하지는 않습니다. 그래서 순서에는 넣지 않았습니다.'))
S.append(P('받으신 택일이 틀렸다고 말씀드리지 않습니다. 기준이 다르면 답도 달라집니다. 저희는 두 고전 · 대운 · 삼명통회 · 자미두수전서 원문이라는 기준을 공개하고 그대로 보았습니다.'))
S.append(P(f"출산 날짜는 담당 선생님이 정하십니다. 정해진 범위 안에서 참고로 보아 주십시오. 병원에는 {c['시계시각']}처럼 시계 시각으로 말씀하시면 됩니다."))
S.append(P('출산 후 확정된 시각을 알려 주시면 최종 사주를 확인해 드리겠습니다.'))
S.append(P(c['해시태그']))

body = '\n'.join(S)
막힘 = [w for w in ('꼬리표', '반김', '실단', '**') if w in body] + re.findall(r'걱정 \d', body)
if 막힘: sys.exit('멈춤: 우리끼리 말이 글에 들어감 — ' + ' · '.join(막힘))
bar = ('<div class="bar">\n  <button id="copy">본문 전체 복사</button>\n  <b>' + T + '</b>\n  <span>제목은 따로 붙여 넣으세요. 복사 → 네이버 글쓰기 본문에 <b>Ctrl+V</b><br>그림 안내 줄은 복사할 때 빠집니다.</span>\n</div>\n')
page = HEAD.format(title=T) + bar + '<div class="wrap">\n  <div id="doc">\n' + body + '\n  </div>\n</div>\n\n' + TAIL
open(out, 'w', encoding='utf-8').write(page)
print('ok', out, len(page))
