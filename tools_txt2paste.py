# -*- coding: utf-8 -*-
"""naver-NN 원고(.txt) → 붙여넣기 페이지(.html) 변환.

옛 방식(.txt에 ■·▸ 표시를 달고 사용자가 에디터에서 서식을 다시 잡는 것)을
붙여넣기 페이지로 옮길 때 쓴다. 규칙:
  ─────  → <hr>
  ■ 제목  → <h3>
  ▸ 묶음  → <blockquote> (연속된 ▸와 그 들여쓴 이어짐 줄을 한 덩어리로)
  **글**  → <b>글</b>
  #태그   → <p class="tag">
  [네이버 에디터 적용 안내] 블록 → 버린다 (붙여넣기 페이지가 그 일을 대신한다)

  python tools_txt2paste.py marketing/naver-05-후보고르는법.txt marketing/붙여넣기-후보고르는법.html "탭제목"
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')

def convert(txt):
    # 안내 블록부터 자른다
    txt = re.split(r'═{3,}', txt)[0]
    lines = txt.split('\n')
    out, i = [], 0
    title, alt = '', ''
    def bold(s):
        s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
        return s
    while i < len(lines):
        ln = lines[i].rstrip()
        s = ln.strip()
        if not s: i += 1; continue
        if s == '[제목]':
            i += 1
            while i < len(lines) and not lines[i].strip(): i += 1
            title = lines[i].strip(); i += 1; continue
        if s == '[제목 대안]':
            i += 1
            while i < len(lines) and not lines[i].strip(): i += 1
            alt = lines[i].strip(); i += 1; continue
        if re.fullmatch(r'─+', s):
            out.append('    <hr>'); i += 1; continue
        if s.startswith('■'):
            out.append('    <h3>%s</h3>' % bold(s[1:].strip())); i += 1; continue
        if s.startswith('▸'):
            items = []
            while i < len(lines):
                t = lines[i].rstrip()
                if t.strip().startswith('▸'):
                    items.append(bold(t.strip())); i += 1
                elif t.startswith('   ') and t.strip():          # 이어짐 줄
                    items[-1] += ' · ' + bold(t.strip()); i += 1
                else: break   # 빈 줄이면 묶음 끝 — 원고의 덩어리 나눔을 그대로 따른다
            out.append('    <blockquote>%s</blockquote>' % ''.join('<p>%s</p>' % x for x in items))
            continue
        if s.startswith('#'):
            out.append('    <p class="tag">%s</p>' % s); i += 1; continue
        out.append('    <p>%s</p>' % bold(s)); i += 1
    return title, alt, '\n'.join(out)

def main():
    src, dst, tab = sys.argv[1], sys.argv[2], sys.argv[3]
    txt = io.open(src, encoding='utf-8').read()
    title, alt, body = convert(txt)
    shell = io.open(os.path.join(os.path.dirname(dst), '붙여넣기-그릇과타이밍.html'), encoding='utf-8').read()
    head = shell[:shell.index('<div class="wrap">')]
    tail = shell[shell.index('<script>'):]
    head = head.replace('붙여넣기 · 원국이 좋은 아이와 대운이 좋은 아이', '붙여넣기 · ' + tab)
    head = head.replace('<b>원국이 좋은 아이와 대운이 좋은 아이</b>', '<b>%s</b>' % tab)
    doc = '<div class="wrap">\n  <div id="doc">\n    <h2>%s</h2>\n    <p class="alt">%s</p>\n%s\n  </div>\n</div>\n\n' % (title, alt, body)
    io.open(dst, 'w', encoding='utf-8').write(head + doc + tail)
    print('%s → %s (%d줄)' % (os.path.basename(src), os.path.basename(dst), body.count('\n')+1))

if __name__ == '__main__':
    main()
