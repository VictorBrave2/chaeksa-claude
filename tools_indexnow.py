# -*- coding: utf-8 -*-
"""IndexNow 알림 — 바뀐 쪽 주소를 Bing · 네이버 · Yandex 에 바로 알린다(10-03 사장님 「AI가 우리 사이트를 추천하게」).

ChatGPT 검색은 Bing 색인을, 네이버 AI 브리핑은 네이버 색인을 읽는다. 새 글이 색인에 늦게 들어가면 AI 답에도 늦게 나온다.
IndexNow 는 한 곳(api.indexnow.org)에 알리면 Bing · 네이버 · Yandex · Seznam 이 같이 받는다(네이버는 2023-07부터).
열쇠 파일 app/<열쇠>.txt 가 사이트에 올라가 있어야 받아 준다 — 배포(push) 뒤에 돌린다.
보내는 것은 이미 공개된 우리 쪽 주소뿐이다(손님 정보 없음).

  python tools_indexnow.py          # 사이트맵에서 lastmod 가 오늘인 주소만
  python tools_indexnow.py --all    # 사이트맵 전부
  python tools_indexnow.py URL ...  # 이 주소들만
"""
import glob, json, os, re, sys, datetime, urllib.request
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
ROOT = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(ROOT, 'app')
HOST = 'chaeksa.kr'

def key():
    ks = [os.path.basename(p)[:-4] for p in glob.glob(os.path.join(A, '*.txt')) if re.fullmatch(r'[0-9a-f]{32}\.txt', os.path.basename(p))]
    assert len(ks) == 1, '열쇠 파일(app/<32자>.txt)이 하나여야 한다: ' + str(ks)
    k = ks[0]; assert open(os.path.join(A, k + '.txt'), encoding='utf-8').read().strip() == k, '열쇠 파일 내용이 이름과 다르다'
    return k

def from_sitemap(only_today):
    s = open(os.path.join(A, 'sitemap.xml'), encoding='utf-8').read()
    today = datetime.date.today().isoformat(); out = []
    for u in re.findall(r'<url>(.*?)</url>', s, re.S):
        loc = re.search(r'<loc>(.*?)</loc>', u).group(1).strip(); lm = re.search(r'<lastmod>(.*?)</lastmod>', u)
        if not only_today or (lm and lm.group(1).strip() == today): out.append(loc)
    return out

def main():
    args = sys.argv[1:]
    urls = [a for a in args if a.startswith('https://' + HOST)] or from_sitemap('--all' not in args)
    if not urls: print('알릴 주소 없음(오늘 바뀐 쪽이 사이트맵에 없다). --all 이나 주소를 주세요.'); return
    k = key()
    body = json.dumps({'host': HOST, 'key': k, 'keyLocation': f'https://{HOST}/{k}.txt', 'urlList': urls[:10000]}).encode('utf-8')
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: print('IndexNow', r.status, '·', len(urls), '쪽')
    except urllib.error.HTTPError as e:
        print('IndexNow 실패', e.code, e.read()[:200].decode('utf-8', 'replace')); sys.exit(1)

if __name__ == '__main__':
    main()
