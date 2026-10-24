"""받아쓰기 — 사장님 독백 녹음 → 글 + 낱말마다 시각(10-21 사장님 「독백을 받아 적고 모션그래픽으로」).

쓰는 법:  python 받아쓰기.py <녹음 파일> [출력 폴더]
  → <출력>/<이름>.words.json  낱말마다 {w, s, e}(초)와 문장 덩어리
  → <출력>/<이름>.txt          사장님 확인용 글(덩어리마다 한 줄, 앞에 시각)

이 컴퓨터 안에서만 돈다(faster-whisper large-v3-turbo · RTX 그래픽카드). 녹음은 밖으로 나가지 않는다.
소리 풀기는 ffmpeg 로 한다(파이썬 av 묶음은 faster-whisper 와 판이 안 맞아 쓰지 않는다).
"""
import glob
import json
import os
import shutil
import site
import subprocess
import sys

import numpy as np

# 윈도우: pip 로 깐 nvidia cublas · cudnn DLL 을 찾게 한다
for sp in site.getsitepackages():
    for d in glob.glob(os.path.join(sp, 'nvidia', '*', 'bin')):
        os.add_dll_directory(d)
        os.environ['PATH'] = d + os.pathsep + os.environ['PATH']

from faster_whisper import WhisperModel  # noqa: E402

FFMPEG = shutil.which('ffmpeg') or os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')

# 명리 낱말을 잘 알아듣게 앞말로 준다(받아쓰기가 이 낱말들 쪽으로 기운다)
앞말 = ('사주팔자, 명리학, 자미두수, 출산택일, 제왕절개, 궁통보감, 자평진전, 적천수, 진태양시, 절기, 입춘, '
       '천간, 지지, 일간, 십성, 정관, 편관, 정인, 편인, 정재, 편재, 식신, 상관, 비견, 겁재, 대운, 세운, 용신, 격국, 책사.')


def 소리읽기(path):
    raw = subprocess.run([FFMPEG, '-nostdin', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(src))
    os.makedirs(out, exist_ok=True)
    name = os.path.splitext(os.path.basename(src))[0]

    audio = 소리읽기(src)
    model = WhisperModel('large-v3-turbo', device='cuda', compute_type='float16')
    segs, info = model.transcribe(audio, language='ko', word_timestamps=True, vad_filter=True,
                                  initial_prompt=앞말, condition_on_previous_text=False)
    덩어리 = []
    for s in segs:
        덩어리.append({'s': round(s.start, 2), 'e': round(s.end, 2), 'text': s.text.strip(),
                    'words': [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)} for w in (s.words or [])]})
    길이 = round(len(audio) / 16000, 2)
    with open(os.path.join(out, name + '.words.json'), 'w', encoding='utf-8') as f:
        json.dump({'src': os.path.basename(src), 'length': 길이, 'segments': 덩어리}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out, name + '.txt'), 'w', encoding='utf-8') as f:
        for d in 덩어리:
            m, s = divmod(d['s'], 60)
            f.write(f'[{int(m):02d}:{s:05.2f}] {d["text"]}\n')
    print(f'받아씀: {name} · 길이 {길이}초 · 덩어리 {len(덩어리)} · 낱말 {sum(len(d["words"]) for d in 덩어리)}')


if __name__ == '__main__':
    main()
