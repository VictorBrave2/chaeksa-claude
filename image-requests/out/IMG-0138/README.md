# IMG-0138 — 정통사주 여자 안내 삽화 5장

- 제작: 2026-11-02, 기본 image_gen 도구.
- 얼굴 기준: app/art/tarot/chaeksa-v1/P13.webp. 주문서 경로의 art/ 누락을 실제 위치로 바로잡아 참조했다.
- 기존 남자판의 책·서재·초록과 상아색 의상·구도를 여자 안내 인물로 제작했다.
- 맞이하기, 읽기, 마무리: 1254×1254 투명 PNG. 모바일 시작·마침: 1024×1536 무손실 WebP.
- 원본 PNG 다섯 장은 이 폴더, 사용 파일은 아래 경로에 저장했다. 생성 도구 원본도 보존했다.
- 모바일 시작은 원본 남자판처럼 아래 약 47%가 빈 책상이다. 의상과 시선이 달라진 중간 수정본은 채택하지 않았다.
- 얼굴·눈·손·책·여백을 눈으로 확인했다. 애플리케이션 시험은 실행하지 않았다.
- app/jeongtong-pyo.js의 기존 여성 경로와 일치한다. 코드 수정·커밋·푸시·라이브 배포는 하지 않았다.

## 사용 파일

- app/art/jeongtong-tarot-v1/f/welcome.png
- app/art/jeongtong-tarot-v1/f/reading.png
- app/art/jeongtong-tarot-v1/f/closing.png
- app/art/content-tarot-v2/library-mobile-f.webp
- app/art/content-tarot-v2/library-ending-f.webp

## 확인 및 인계

- index.html: 다섯 장 모음.
- manifest.json: 실제 프롬프트, 참조, 생성 원본, 채택·미채택 기록.
- Claude는 이 다섯 사용 파일을 배포에 포함하면 된다. 원래 남자판은 유지했다.