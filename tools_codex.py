# -*- coding: utf-8 -*-
"""Codex(사장님 ChatGPT 구독)에게 요청 명세 한 장을 이 컴퓨터에서 바로 맡긴다 — 10-22 사장님 「git 으로 말고 다른 방법으로 gpt 랑 수정 · 업데이트 · 검수」 · 「설치해」.

    python tools_codex.py copy-requests/COPY-0001-paid-pages.md      # 명세 한 장 → 따로 떨어진 작업 폴더에서 Codex 가 고침
    python tools_codex.py copy-requests/COPY-0001-paid-pages.md --ask "추가 지시 한 줄"

하는 일
  1) 이 저장소 옆에 작업 폴더(git worktree) ../chaeksa-codex-<작업 ID> 를 가지 codex/<작업 ID> 로 만든다(있으면 그대로 쓴다).
     — 본 폴더(main)를 Codex 가 직접 만지지 않게. 다른 손(사장님 Codex 앱 · 다른 세션)과 겹치지 않는다.
  2) 그 폴더에서 codex exec 를 부른다. 깃발은 10-22 시험으로 맞춘 것:
       --ignore-user-config(사장님 설정의 모델 「gpt-6-astra」는 ChatGPT 로그인으로 안 돼서 기본 모델로) · --ignore-rules ·
       -s workspace-write + -c windows.sandbox="elevated"(사장님 설정에 있던 윈도우 보안 상자 — 이게 없으면 읽기 전용으로 떨어져 못 고친다, 10-23 시험) · --skip-git-repo-check
  3) Codex 가 끝나면 작업 폴더의 바뀐 파일 목록과 Codex 마지막 말(CODEX_REPORT.md)을 보여 준다. 커밋 · 합치기는 하지 않는다 —
     Claude Code 가 뜻 대조(원문 · 계산) · 시험(tools_check · tests_yaksok) 뒤 main 으로 가져온다.
비밀값 없음. 이미지 생성 · 유료 API 없음(구독 사용량만 쓴다 — 한도가 있으니 큰 요청은 나눠서).
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd or ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if check and r.returncode != 0:
        sys.exit('실패: ' + ' '.join(cmd) + '\n' + (r.stderr or r.stdout)[-1500:])
    return r

def main():
    a = sys.argv[1:]
    if not a or a[0].startswith('-'):
        sys.exit(__doc__)
    spec = a[0].replace('\\', '/')
    더 = a[a.index('--ask') + 1] if '--ask' in a else ''
    if not os.path.exists(os.path.join(ROOT, spec)):
        sys.exit('명세가 없다: ' + spec)
    m = re.search(r'(COPY|DES|IMG)-\d{4}', spec)
    if not m:
        sys.exit('명세 파일 이름에 작업 ID(COPY-0001 · DES-0001 · IMG-0001)가 없다')
    wid = m.group(0)
    wt = os.path.normpath(os.path.join(ROOT, '..', 'chaeksa-codex-' + wid))
    branch = 'codex/' + wid
    if not os.path.isdir(wt):
        has = run(['git', 'branch', '--list', branch]).stdout.strip()
        run(['git', 'worktree', 'add', wt, branch] if has else ['git', 'worktree', 'add', '-b', branch, wt, 'main'])
        print('작업 폴더 만듦:', wt, '(가지 ' + branch + ')')
    else:
        print('작업 폴더 그대로 씀:', wt)
    gate = spec.split('/')[0] + '/README.md'
    prompt = ('You are working in a copy of the chaeksa.kr repository. Read ' + gate + ' (the rules for this lane) and then ' + spec +
              ' (the task). Do the task exactly as the spec says: edit only the files it allows, keep meaning, numbers, code and line endings (CRLF) unchanged, '
              'and follow every rule in the README. Do not commit, do not push, do not call any image or paid API. '
              'When finished, write CODEX_REPORT.md at the repository root in Korean: for every changed line give 파일 · 전 → 후 · 까닭, and list separately anything you were unsure about under 「판단 필요」.'
              + (' Extra instruction from the owner: ' + 더 if 더 else ''))
    last = os.path.join(wt, 'CODEX_LAST.txt')
    print('Codex 부름 — 끝날 때까지 몇 분 걸릴 수 있다 …')
    r = subprocess.run(['codex', 'exec', '--ignore-user-config', '--ignore-rules', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'windows.sandbox="elevated"', '-o', last, prompt],
                       cwd=wt, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=(os.name == 'nt'))
    print('Codex 끝(종료 코드 ' + str(r.returncode) + ')')
    if r.returncode != 0:
        print((r.stderr or '')[-1500:])
    print('\n== 바뀐 파일 ==')
    print(run(['git', 'status', '--short'], cwd=wt, check=False).stdout or '(없음)')
    rep = os.path.join(wt, 'CODEX_REPORT.md')
    print('== CODEX_REPORT.md ==' if os.path.exists(rep) else '== Codex 마지막 말 ==')
    p = rep if os.path.exists(rep) else last
    if os.path.exists(p):
        print(open(p, encoding='utf-8', errors='replace').read()[:6000])

if __name__ == '__main__':
    main()
