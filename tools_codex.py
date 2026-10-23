# -*- coding: utf-8 -*-
"""Codex(사장님 ChatGPT 구독)에게 요청 명세 한 장을 이 컴퓨터에서 바로 맡긴다 — 10-22 사장님 「git 으로 말고 다른 방법으로 gpt 랑 수정 · 업데이트 · 검수」 · 「설치해」.

    python tools_codex.py copy-requests/COPY-0001-paid-pages.md      # 명세 한 장 → 따로 떨어진 작업 폴더에서 Codex 가 고침
    python tools_codex.py copy-requests/COPY-0001-paid-pages.md --ask "추가 지시 한 줄"
    python tools_codex.py copy-requests/COPY-0002-free-pages.md --part ssom12 --ask "「웹툰궁합(썸) — 화면 · 앞 회차」 절만"
        # --part: 한 명세를 묶음으로 나눠 동시에 돌릴 때 — 묶음마다 작업 폴더 ~/.chaeksa-codex/<ID>-<part>
    python tools_codex.py --clean                                      # 합친 뒤: 작업 폴더 · codex/* 가지 전부 지움
    --model gpt-6-astra(기본) · --effort high(기본) — 10-23 사장님 Pro 구독 뒤 가장 센 모델로

하는 일
  1) 홈의 숨은 폴더에 작업 폴더(git worktree) ~/.chaeksa-codex/<작업 ID> 를 가지 codex/<작업 ID> 로 만든다(있으면 그대로 쓴다). 바탕화면에는 안 만든다(10-23 사장님).
     합친 뒤 `python tools_codex.py --clean` 으로 작업 폴더 · codex/* 가지를 전부 지운다.
     — 본 폴더(main)를 Codex 가 직접 만지지 않게. 다른 손(사장님 Codex 앱 · 다른 세션)과 겹치지 않는다.
  2) 그 폴더에서 codex exec 를 부른다. 깃발은 10-22 · 23 시험으로 맞춘 것:
       -m gpt-6-astra · model_reasoning_effort=high(10-23 사장님 Pro 구독 — 이제 astra 가 목록에 있다. 안 되면 가벼운 모델로 내려가지 않고 멈춘다) ·
       --ignore-user-config · --ignore-rules ·
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
    try:
        sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')  # 파일로 받을 때 cp949 로 죽지 않게
    except Exception:
        pass
    a = sys.argv[1:]
    if a and a[0] == '--clean':
        # 10-23 사장님 「바탕화면에 왜 쌓는 거야 폴더를?」 — 합친 뒤 작업 폴더(worktree) · codex/* 가지를 전부 지운다
        n = 0
        for line in run(['git', 'worktree', 'list', '--porcelain']).stdout.splitlines():
            if line.startswith('worktree ') and '.chaeksa-codex' in line.replace('\\', '/'):
                run(['git', 'worktree', 'remove', '--force', line[9:]], check=False); n += 1
        run(['git', 'worktree', 'prune'], check=False)
        for b in run(['git', 'branch', '--list', 'codex/*']).stdout.split():
            if b.startswith('codex/'):
                run(['git', 'branch', '-D', b], check=False)
        print('지움: 작업 폴더 %d개 · codex/* 가지' % n)
        return
    if not a or a[0].startswith('-'):
        sys.exit(__doc__)
    spec = a[0].replace('\\', '/')
    def 값(k, d=''):
        return a[a.index(k) + 1] if k in a else d
    더 = 값('--ask')
    part = re.sub(r'[^A-Za-z0-9_-]', '', 값('--part'))
    model = 값('--model', 'gpt-6-astra')
    effort = 값('--effort', 'high')
    if not os.path.exists(os.path.join(ROOT, spec)):
        sys.exit('명세가 없다: ' + spec)
    m = re.search(r'(COPY|DES|IMG)-\d{4}', spec)
    if not m:
        sys.exit('명세 파일 이름에 작업 ID(COPY-0001 · DES-0001 · IMG-0001)가 없다')
    wid = m.group(0) + ('-' + part if part else '')
    # 10-23 사장님 「바탕화면에 왜 쌓는 거야 폴더를?」 — 작업 폴더는 저장소 옆(바탕화면)이 아니라 홈의 숨은 폴더 ~/.chaeksa-codex/<작업 ID> 에. 합친 뒤엔 --clean 으로 지운다
    wt = os.path.normpath(os.path.join(os.path.expanduser('~'), '.chaeksa-codex', wid))
    branch = 'codex/' + wid
    if not os.path.isdir(wt):
        has = run(['git', 'branch', '--list', branch]).stdout.strip()
        run(['git', 'worktree', 'add', wt, branch] if has else ['git', 'worktree', 'add', '-b', branch, wt, 'main'])
        print('작업 폴더 만듦:', wt, '(가지 ' + branch + ')')
    else:
        print('작업 폴더 그대로 씀:', wt)
    gate = spec.split('/')[0] + '/README.md'
    prompt = ('You are working in a copy of the chaeksa.kr repository. Read ' + gate + ' (the rules for this lane) and then ' + spec +
              ' (the task). Do the task exactly as the spec says: edit only the files it allows, keep meaning, numbers and line endings (CRLF) unchanged, change code only where the spec explicitly allows it, '
              'and follow every rule in the README. Do not commit, do not push, do not call any image or paid API. '
              'When finished, write CODEX_REPORT.md at the repository root in Korean: for every changed line give 파일 · 전 → 후 · 까닭, and list separately anything you were unsure about under 「판단 필요」.'
              + (' Extra instruction from the owner: ' + 더 if 더 else ''))
    last = os.path.join(wt, 'CODEX_LAST.txt')
    print('Codex 부름 — 끝날 때까지 몇 분 걸릴 수 있다 …')
    기본 = ['codex', 'exec', '--ignore-user-config', '--ignore-rules', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'windows.sandbox="elevated"',
            '-c', 'model_reasoning_effort="' + effort + '"', '-m', model, '-o', last]
    # 10-23 사장님 Pro 구독(「구독했어」) — gpt-6-astra 를 부르고, 요금제가 안 받으면 가벼운 모델로 몰래 내려가지 않고 멈춘다
    r = subprocess.run(기본 + [prompt], cwd=wt, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=(os.name == 'nt'), stdin=subprocess.DEVNULL)   # 입력을 닫아야 codex 가 안 멈춘다(10-23)
    if 'not supported' in ((r.stdout or '') + (r.stderr or '')):
        sys.exit(model + ' 는 지금 요금제로 안 됨 — 멈춤(가벼운 모델로 돌리지 않음). ~/.codex/models_cache.json 목록을 보라')
    print('쓴 모델:', model, '· 생각 깊이:', effort)
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
