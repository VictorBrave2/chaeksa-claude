/* 사용법 글 표 — 콘텐츠마다 머리 줄 아래 「사용법」 한 칸(11-08 사장님 「각 컨텐츠 마다 설명이 붙어야하지 않겠어?」 · 「사용법이라고 해야겠네」).
 * 이 파일만 Codex 가 채운다(COPY-0046). 그리기는 sayongbeop.js — 줄이 비면 칸이 안 보인다. 열쇠 · 파일 이름은 바꾸지 않는다.
 * 칸: 머리(비면 공통.머리 「사용법」) · 줄(문단 배열 — 3 ~ 5줄: 무엇을 보는 콘텐츠인가 → 손님이 할 것 → 받는 것 → 때 · 범위 → 주의). 값(원)은 쓰지 않는다 — 값은 장부 딱지가 말한다. */
(function (global) {
  'use strict';
  global.ChaeksaSayongbeopCopy = {
    "공통": { "머리": "사용법" },
    "표": {
      // 나를 알아보기
      "jeongtong": { "머리": "", "줄": [] },     // 정통사주 — 앱 탭 jeongtong(index.html ?go=jeongtong)
      "myeongban": { "머리": "", "줄": [] },     // 정통자미두수 — myeongban.html
      "tarot": { "머리": "", "줄": [] },         // 정통타로(켈틱 열 장 · 이번 달) — 앱 탭 tarot
      "three": { "머리": "", "줄": [] },         // SSS급 미래 관측(사주 · 자미두수 · 타로 세 점 · 물음 하나) — 앱 탭 three
      // 궁합
      "ghpyo": { "머리": "", "줄": [] },         // 정통 사주 궁합(필터식) — gunghap-pyo.html
      "zwghpyo": { "머리": "", "줄": [] },       // 정통 자미두수 궁합 — zw-gunghap-pyo.html
      "tarotghpyo": { "머리": "", "줄": [] },    // 정통 타로 궁합(현재 상황 → 열 장 → 결론 · 답 일곱) — tarot-gunghap-pyo.html
      "sss": { "머리": "", "줄": [] },           // SSS급 궁합 분석(유료 · 24관점) — sss-apply.html
      "chongnon": { "머리": "", "줄": [] },      // 정통궁합(궁합총론 · 3대 고전 나란히) — 앱 탭 chongnon
      "ssom": { "머리": "", "줄": [] },          // 우리 둘의 연애궁합(웹툰 · 단계) — 앱 탭 ssom
      // 유료
      "taekil": { "머리": "", "줄": [] },        // 출산택일(보고서) — taekil.html
      "ilgyeol": { "머리": "", "줄": [] },       // 내게 맞는 일과 돈(보고서) — ilgyeol.html
      "gyeolhon": { "머리": "", "줄": [] },      // 결혼 전 궁합 점검(보고서) — gyeolhon.html
      "love": { "머리": "", "줄": [] },          // 연애할 때의 나 — love.html
      "pair": { "머리": "", "줄": [] },          // 연애할 때의 그 사람 — pair.html
      // 무료
      "today": { "머리": "", "줄": [] },         // 오늘의 운세 — 앱 탭 today
      "why": { "머리": "", "줄": [] },           // 왜 내게만 이런 일이 일어날까? — 앱 탭 why
      "when": { "머리": "", "줄": [] },          // 내 운은 언제 풀릴까? — when.html
      "saram": { "머리": "", "줄": [] },         // 나와 잘 맞는 사람 — saram.html
      "read": { "머리": "", "줄": [] }           // 사주 궁금증 풀이(읽을거리) — read.html
    }
  };
})(typeof window !== 'undefined' ? window : this);
