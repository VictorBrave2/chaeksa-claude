# -*- coding: utf-8 -*-
"""문장표(docs/33_문장표_*.md) → app/mun/<이름>.js

  python tools_mun.py                 docs/33_문장표_*.md 전부 변환
  python tools_mun.py 돈순위          하나만

md 형식 — 칸은 이렇게 생겼다(굵은 키 줄 · 답: · 왜:):

  **A1-B겉뿌-C한-D옴**
  답: …
  왜: …

머리의 `<!-- mun: code=geunamja q=3 -->` 주석으로 어느 장의 몇 번 비밀인지 알린다.
없으면 파일 이름으로 못 짓고 멈춘다. 검수 뒤 고친 md 를 다시 돌리면 js 가 갱신된다.
"""
import io, os, re, sys, glob, json
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.abspath(__file__))

def conv(path):
    s = io.open(path, encoding='utf-8').read().replace('\r\n', '\n')
    m = re.search(r'<!--\s*mun:\s*code=(\w+)\s+q=(\d+)\s*-->', s)
    if not m:
        print('X', os.path.basename(path), '— <!-- mun: code=.. q=.. --> 머리가 없다'); return
    code, q = m.group(1), int(m.group(2))
    cells = {}
    for mm in re.finditer(r'\*\*([A-Za-z0-9가-힣\-·+]+)\*\*\s*\n답:\s*(.+?)\n왜:\s*(.+?)(?=\n\n|\n\*\*|\n---|\Z)', s, re.S):
        key, ans, why = mm.group(1).strip(), mm.group(2).strip(), ' '.join(x.strip() for x in mm.group(3).split('\n')).strip()
        if key in cells: print('!', os.path.basename(path), '키 겹침', key)
        cells[key] = {'답': ans, '왜': why}
    name = os.path.basename(path).replace('33_문장표_', '').replace('.md', '')
    out = os.path.join(ROOT, 'app', 'mun', name + '.js')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    js = ('/* 문장표 — %s (%s 비밀 %d). docs/%s 에서 tools_mun.py 로 만든다. 여기 직접 고치지 말 것. */\n'
          '(function (g) { g.ChaeksaMun = g.ChaeksaMun || { 표: {} }; g.ChaeksaMun.표[%s] = %s; })(window);\n'
          % (name, code, q, os.path.basename(path), json.dumps(code + ':' + str(q), ensure_ascii=False),
             json.dumps(cells, ensure_ascii=False, indent=1)))
    io.open(out, 'w', encoding='utf-8', newline='\n').write(js)
    print('O', name, '→', code, q, len(cells), '칸')

if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    files = glob.glob(os.path.join(ROOT, 'docs', '33_문장표_*.md'))
    if arg: files = [f for f in files if arg in f]
    for f in sorted(files): conv(f)
