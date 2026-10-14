# -*- coding: utf-8 -*-
"""상담 후보 시각마다 자미두수 명반 판 그림(PNG) + 판정표 결론 붙여넣기 글(HTML) — 10-14 사장님 「명반도 뽑아줘야 하는 것 아니야?」.
판 = 비공개 서버 /api/myeongban(별 배치), 결론 = 비공개 jamidusu/puli.js 풀이(원문 판정표, LLM 없음 — 미리 json 으로 뽑아 넘긴다).
  python tools/myeongban_consult.py <풀이.json> <나갈폴더> <곳값 KR:성남> <성별 M|F>
"""
import sys, os, json, re, urllib.request, html
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
src, out, place, g = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
data = json.load(open(src, encoding='utf-8')); os.makedirs(out, exist_ok=True)
def F(serif, size, w=500):
    f = ImageFont.truetype('C:/Windows/Fonts/' + ('NotoSerifKR-VF.ttf' if serif else 'NotoSansKR-VF.ttf'), size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
BG, CARD, INK, SUB, LINE, RED, SOFT = (245, 240, 230), (253, 251, 246), (40, 36, 30), (115, 105, 92), (214, 202, 182), (168, 52, 40), (243, 228, 220)
쉬운 = {'命宮': '나', '兄弟': '형제', '夫妻': '배우자', '妻妾': '배우자', '子女': '자녀', '財帛': '돈', '疾厄': '몸', '遷移': '바깥', '奴僕': '아랫사람·동료', '交友': '아랫사람·동료', '官祿': '일', '田宅': '집', '福德': '마음·복', '父母': '부모'}
자리 = {'巳': (0, 0), '午': (1, 0), '未': (2, 0), '申': (3, 0), '酉': (3, 1), '戌': (3, 2), '亥': (3, 3), '子': (2, 3), '丑': (1, 3), '寅': (0, 3), '卯': (0, 2), '辰': (0, 1)}
def api(y, mo, d, h, m):
    req = urllib.request.Request('https://chaeksa-behavior-core.vercel.app/api/myeongban', data=json.dumps({'year': y, 'month': mo, 'day': d, 'hour': h, 'minute': m, 'gender': g, 'place': place}).encode(), headers={'Content-Type': 'application/json', 'Origin': 'https://chaeksa.kr'})
    return json.load(urllib.request.urlopen(req, timeout=60))
def 별이름(s): return (s.get('이름') or (s.get('별', '') + s.get('화', ''))) if isinstance(s, dict) else s
def 판그림(j, 라벨, 때말, path):
    S = 2; cw, ch, pad, top = 270 * S, 210 * S, 30 * S, 120 * S
    W, H = pad * 2 + cw * 4, top + pad + ch * 4
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((pad, 30 * S), 라벨, font=F(False, 24 * S, 700), fill=RED); d.text((pad, 66 * S), 때말, font=F(True, 30 * S, 800), fill=INK)
    M = j['명반']
    for gung in M['궁']:
        cx, cy = 자리[gung['지지']]; x0, y0 = pad + cx * cw, top + cy * ch
        명 = gung['이름'] == '命宮'
        d.rectangle((x0, y0, x0 + cw, y0 + ch), fill=SOFT if 명 else CARD, outline=RED if 명 else LINE, width=4 * S if 명 else 2 * S)
        d.text((x0 + 12 * S, y0 + 10 * S), gung['이름'], font=F(True, 22 * S, 800), fill=RED)
        d.text((x0 + 12 * S, y0 + 40 * S), 쉬운.get(gung['이름'], ''), font=F(False, 15 * S, 500), fill=SUB)
        d.text((x0 + cw - 12 * S, y0 + 12 * S), (gung.get('궁간') or '') + gung['지지'], font=F(True, 18 * S, 600), fill=SUB, anchor='ra')
        yy = y0 + 70 * S
        for s in gung.get('주성', []):
            nm = 별이름(s); br = s.get('밝기', '') if isinstance(s, dict) else ''
            d.text((x0 + 12 * S, yy), nm, font=F(True, 28 * S, 900), fill=INK); d.text((x0 + 12 * S + d.textlength(nm, font=F(True, 28 * S, 900)) + 6 * S, yy + 10 * S), (br or '')[:2], font=F(False, 14 * S, 500), fill=SUB); yy += 38 * S
        if not gung.get('주성'): d.text((x0 + 12 * S, yy), '주성 없음', font=F(False, 16 * S, 500), fill=LINE); yy += 30 * S
        작 = [별이름(s) for s in (gung.get('보좌', []) + gung.get('살성', []))] + [별이름(s) for s in gung.get('사화', [])]
        if 작: d.text((x0 + 12 * S, y0 + ch - 34 * S), ' '.join(작)[:18], font=F(True, 16 * S, 500), fill=SUB)
    # 가운데
    x0, y0 = pad + cw, top + ch
    d.rectangle((x0, y0, x0 + 2 * cw, y0 + 2 * ch), fill=BG)
    lines = [('명궁 ' + M['명궁지지'] + ' · ' + M['오행국'], F(True, 30 * S, 800), INK), ('신궁 ' + str(M.get('신궁')), F(False, 20 * S, 500), SUB), ('자미두수 명반 · 책사 chaeksa.kr', F(False, 16 * S, 500), SUB)]
    yy = y0 + 2 * ch // 2 - 70 * S
    for t, f, c in lines: d.text((x0 + cw, yy), t, font=f, fill=c, anchor='ma'); yy += 56 * S
    im.resize((W // S, H // S), Image.LANCZOS).save(path)
blocks = []
for i, s in enumerate(data, 1):
    y, mo, d_ = map(int, s['날'].split('-'))
    j = api(y, mo, d_, s['h'], s['m'])
    때말 = f"{mo}월 {d_}일 {s['h']:02d}:{s['m']:02d} 무렵 · " + ('남아' if g == 'M' else '여아')
    png = os.path.join(out, f'명반-{i:02d}.png'); 판그림(j, s['라벨'], 때말, png)
    b = [f"<h3>{html.escape(s['라벨'])} — {mo}월 {d_}일 아이의 자미두수 명반</h3>", f"<p>{html.escape(s['한줄'])}</p>"]
    for q in s['질문']:
        if not q['결론']: continue
        b.append(f"<p><b>{html.escape(q['제목'])}</b></p>")
        b.append('<blockquote>' + '<br>'.join('▸ ' + html.escape(re.sub(r'\s*\(근거:[^)]*\)', '', c)) for c in q['결론'][:2]) + '</blockquote>')
    blocks.append('\n'.join(b))
intro = ('<p>세 고전으로 고른 곳을, 그 시각에 태어날 아이의 자미두수 명반으로 한 번 더 보았어요. 자미두수는 날을 고르거나 빼는 데 쓰지 않았어요. 부모 · 형제 · 몸을 열두 궁으로 따로 보는 눈이라 「이렇게도 보인다」를 알려 드려요.</p>'
         '<p>근거는 모두 《자미두수전서》 원문이에요. 원문의 조건이 이 명반에 그대로 맞는 구절에서만 결론을 냈어요.</p>')
doc = '<h2>자미두수로 한 번 더 본 세 곳</h2>' + intro + '<hr>'.join(blocks)
page = ('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>자미두수 붙여넣기</title>'
        '<style>body{font:16px/1.8 "Malgun Gothic",sans-serif;background:#f6f1e7;margin:0}.wrap{max-width:720px;margin:0 auto;padding:20px}#doc{background:#fff;padding:20px;border-radius:10px}button{position:sticky;top:8px;padding:12px 20px;background:#2e7d32;color:#fff;border:0;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer}blockquote{margin:6px 0 14px;padding:8px 12px;border-left:3px solid #a83428;background:#faf6ee}</style></head>'
        '<body><div class="wrap"><button onclick="var r=document.createRange();r.selectNodeContents(document.getElementById(\'doc\'));var s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand(\'copy\');this.textContent=\'복사했어요 — 네이버 본문에 붙여 넣으세요\'">본문 전체 복사</button>'
        '<p style="color:#776">명반 그림(명반-01.png ~)은 이 폴더에 있어요. 붙여 넣은 뒤 끌어다 놓으세요.</p><div id="doc">' + doc + '</div></div></body></html>')
open(os.path.join(out, '자미두수-붙여넣기.html'), 'w', encoding='utf-8').write(page)
print('ok', len(data))
