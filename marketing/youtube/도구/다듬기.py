"""다듬기 — 독백의 긴 침묵을 줄이고 낱말 시각을 맞춰 옮긴다(10-21). 받아쓰기 → (사장님 확인 · 고침) → 다듬기 → 모션.

쓰는 법:  python 다듬기.py <녹음> <words.json> <나갈 이름(확장자 없이)> [--gap 0.5] [--drop 0,3]
  · 말과 말 사이가 --gap 초보다 길면 --gap 초로 줄인다(숨 고르는 짧은 틈은 그대로).
  · --drop 은 뺄 덩어리 번호(0부터, 받아쓴 txt 의 줄 순서) — 「아 말이 안 나온다」 같은 줄을 통째로 뺀다.
  → <이름>.wav · <이름>.words.json
"""
import argparse
import json
import os
import shutil
import subprocess

FFMPEG = shutil.which('ffmpeg') or os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio'); ap.add_argument('words'); ap.add_argument('out')
    ap.add_argument('--gap', type=float, default=0.5); ap.add_argument('--drop', default='')
    a = ap.parse_args()
    data = json.load(open(a.words, encoding='utf-8'))
    뺄 = {int(x) for x in a.drop.split(',') if x.strip()}
    segs = [s for i, s in enumerate(data['segments']) if i not in 뺄]

    # 받아쓰기가 낱말 끝을 다음 말 직전까지 길게 잡는 일이 있다(머뭇거린 틈이 낱말 안에 숨음, 10-21 1편 둘째 녹음 75초) — 글자 수로 끝을 자른다
    for s_ in segs:
        for w in s_['words']:
            w['e'] = min(w['e'], w['s'] + 0.45 + 0.16 * len(w['w']))
    # 남길 구간 — 낱말마다 앞 0.12초 · 뒤 0.25초 여유, 가까운 것끼리 합친다
    구간 = []
    for s in segs:
        for w in s['words']:
            st, en = max(0.0, w['s'] - 0.12), w['e'] + 0.25
            if 구간 and st - 구간[-1][1] <= a.gap:
                구간[-1][1] = max(구간[-1][1], en)
            else:
                구간.append([st, en])
    # 새 시각표 — 구간 사이는 gap 초 쉼
    새 = []
    t = 0.0
    for i, (st, en) in enumerate(구간):
        if i:
            t += a.gap
        새.append((st, en, t))
        t += en - st
    길이 = round(t, 2)

    def 옮김(x):
        for st, en, n in 새:
            if st - 0.01 <= x <= en + 0.01:
                return round(n + (x - st), 2)
        return None

    for s in segs:
        for w in s['words']:
            w['s'], w['e'] = 옮김(w['s']), 옮김(w['e'])
        s['words'] = [w for w in s['words'] if w['s'] is not None and w['e'] is not None]
        if s['words']:
            s['s'], s['e'] = s['words'][0]['s'], s['words'][-1]['e']
    segs = [s for s in segs if s['words']]

    # 소리 — 구간마다 잘라 쉼(무음)과 번갈아 잇는다
    parts, labels = [], []
    for i, (st, en, _) in enumerate(새):
        parts.append(f'[0:a]atrim={st:.3f}:{en:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={max(0, en - st - 0.03):.3f}:d=0.03[p{i}]')
        labels.append(f'[p{i}]')
        if i < len(새) - 1:
            parts.append(f'anullsrc=r=48000:cl=mono,atrim=0:{a.gap}[g{i}]')
            labels.append(f'[g{i}]')
    f = ';'.join(parts) + ';' + ''.join(labels) + f'concat=n={len(labels)}:v=0:a=1[o]'
    subprocess.run([FFMPEG, '-nostdin', '-loglevel', 'error', '-y', '-i', a.audio, '-filter_complex', f, '-map', '[o]',
                    '-ar', '48000', '-ac', '1', a.out + '.wav'], check=True)
    json.dump({'src': os.path.basename(a.audio), 'length': 길이, 'segments': segs},
              open(a.out + '.words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'다듬음: {data.get("length")}초 → {길이}초 · 덩어리 {len(segs)}(뺀 것 {len(뺄)})')


if __name__ == '__main__':
    main()
