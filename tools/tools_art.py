# -*- coding: utf-8 -*-
"""삽화 무인 생성기 — OpenAI Images API로 프롬프트 대장을 전부 뽑는다.

쓰는 법:
  1. https://platform.openai.com/api-keys 에서 키를 만들어
     프로젝트 루트의 `.openai_key` 파일에 한 줄로 저장 (gitignore 되어 있음)
  2. python tools/tools_art.py            → 없는 장만 순서대로 생성
     python tools/tools_art.py --only love-open-spring-2   → 그 장만 다시
     python tools/tools_art.py --quality high              → 고화질(비쌈)

원리:
  - tools/art_prompts.json 의 각 항목을 gpt-image-1 로 생성
  - 연애(love-*) 컷은 app/art/love-open-winter.webp 를 **인물 참조**로 넣어
    (edits 엔드포인트) 열두 장이 같은 남자로 나오게 한다
  - 결과는 1536폭 webp(q82)로 압축해 app/art/ 에 규격 이름으로 저장
  - API 원판 png 는 삽화원본/ 에 보관
  - 이미 있는 파일은 건너뛴다 — 대장에 장을 더 붙이고 다시 돌리면 새 장만 생성

비용 감: quality medium 기준 장당 약 $0.06 → 48장 ≈ $3, 240장 ≈ $15.
API 는 3:1을 직접 못 뽑아 1536x1024(3:2)로 받고, 화면(3:1 틀)이 위쪽을
남기며 맞춘다. 프롬프트에 「머리를 중앙 띠에」 지시를 덧붙인다.
"""
import io, os, sys, json, base64, time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'app', 'art')
RAW = os.path.join(ROOT, '삽화원본')
PROMPTS = [os.path.join(ROOT, 'tools', 'art_prompts.json'),
           os.path.join(ROOT, 'tools', 'art_prompts_chaeksa.json')]
REF = os.path.join(ART, 'love-open-winter.webp')   # 인물 기준컷

CROP_HINT = (' Composition must survive a 3:1 horizontal crop: keep the subject\'s '
             'head and key content within the vertical middle band of the frame.')


def key():
    for p in (os.path.join(ROOT, '.openai_key'), os.path.expanduser('~/.openai_key')):
        if os.path.exists(p):
            return io.open(p, encoding='utf-8').read().strip()
    k = os.environ.get('OPENAI_API_KEY')
    if k:
        return k.strip()
    sys.exit('키가 없습니다 — .openai_key 파일에 API 키를 한 줄 넣어주세요 '
             '(https://platform.openai.com/api-keys)')


def gen(prompt, quality, use_ref, size='1536x1024'):
    url = 'https://api.openai.com/v1/images/' + ('edits' if use_ref else 'generations')
    if use_ref:
        # multipart — 참조 이미지 + 프롬프트
        boundary = '----chaeksa' + str(int(time.time()))
        ref = io.open(REF, 'rb').read()
        parts = []
        def field(name, val):
            parts.append(('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n'
                          % (boundary, name, val)).encode())
        field('model', 'gpt-image-1')
        field('prompt', 'Exactly the same man as in the reference image (face, hair, aura). ' + prompt)
        field('size', size)
        field('quality', quality)
        parts.append(('--%s\r\nContent-Disposition: form-data; name="image[]"; filename="ref.webp"\r\n'
                      'Content-Type: image/webp\r\n\r\n' % boundary).encode() + ref + b'\r\n')
        parts.append(('--%s--\r\n' % boundary).encode())
        body = b''.join(parts)
        req = urllib.request.Request(url, data=body, headers={
            'Authorization': 'Bearer ' + key(),
            'Content-Type': 'multipart/form-data; boundary=' + boundary})
    else:
        body = json.dumps({'model': 'gpt-image-1', 'prompt': prompt,
                           'size': size, 'quality': quality}).encode()
        req = urllib.request.Request(url, data=body, headers={
            'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    return base64.b64decode(d['data'][0]['b64_json'])


def 한장(r, quality):
    from PIL import Image
    fn = r['file']
    use_ref = fn.startswith('love') and os.path.exists(REF)
    size = r.get('size', '1536x1024')
    # 3:1 크롭 힌트는 가로 배너에만 쓴다 — 정사각 초상에 붙이면 얼굴을 가운데 띠로 밀어 넣는다
    png = gen(r['prompt'] + (CROP_HINT if size == '1536x1024' else ''), quality, use_ref, size)
    raw_path = os.path.join(RAW, fn.replace('.webp', '.png'))
    io.open(raw_path, 'wb').write(png)
    im = Image.open(raw_path)
    # 초상은 화면에서 44px 원형으로 쓰므로 512면 넉넉하다. 배너만 1536.
    W = 512 if r.get('size') == '1024x1024' else 1536
    if im.width > W:
        im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS)
    im.save(os.path.join(ART, fn), 'WEBP', quality=82)
    return os.path.getsize(os.path.join(ART, fn)) // 1024


def main():
    quality = 'high' if '--quality' in sys.argv and 'high' in sys.argv else 'medium'
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    # 병렬 — 240장을 240분 기다릴 이유가 없다. 계정 등급의 분당 한도에 걸리면
    # 알아서 실패→재시도가 되니, 기본 4로 두고 한도가 높으면 --workers 8.
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 4
    os.makedirs(RAW, exist_ok=True)
    rows = []
    for pf in PROMPTS:
        if os.path.exists(pf):
            rows += json.load(io.open(pf, encoding='utf-8'))
    todo = [r for r in rows if (only and only in r['file'])
            or (not only and not os.path.exists(os.path.join(ART, r['file'])))]
    print('%d장 생성 예정 (품질 %s · 동시 %d)' % (len(todo), quality, workers))
    from concurrent.futures import ThreadPoolExecutor, as_completed
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(한장, r, quality): r['file'] for r in todo}
        for i, f in enumerate(as_completed(futs), 1):
            fn = futs[f]
            try:
                kb = f.result()
                ok += 1
                print('[%d/%d] %s  %dKB' % (i, len(todo), fn, kb))
            except Exception as e:
                fail += 1
                print('[%d/%d] %s  실패: %s' % (i, len(todo), fn, str(e)[:120]))
    print('끝 — 성공 %d · 실패 %d. 실패분은 다시 돌리면 그 장만 재시도됩니다.' % (ok, fail))


if __name__ == '__main__':
    main()
