# IMG-0029 — 오늘의 운세 홈 표지

- 요청: 적절한 새 이미지를 생성해서 삽입.
- 상태: 생성 및 카드 연결 완료, 클로드 통합·배포 대기.
- 생성: 내장 image_gen, 신규 이미지 1장, 불투명 배경.
- 장면: 아침 식탁에서 휴대폰 알림을 확인하는 성인 여성, 옆의 시계. 오늘의 사건과 시간에 대한 호기심.
- 적용: app/home-cats.js의 today 카드와 이 카드 표지를 사용하는 입력창. 남녀 공용 표지 한 장.
- 카드 설명: 오늘 무슨 일이 생길까? 누구와, 몇 시쯤인지 미리 보세요.
- 원본: 삽화원본/today-cover-v1.png (로컬 보관, 1024×1536).
- 제공 파일: app/art/today-cover-v1.webp(원본 해상도), app/art/today-cover-v1-s.webp(가로 360). WebP 인코딩과 작은 판 생성만 수행, 원본 내용 수정 없음.
- 카드 위치·화면 배치·엔진은 변경하지 않음. 기존 when 표지는 그대로 보존.

## 최종 생성 프롬프트

Use case: illustration-story. Asset type: production homepage cover illustration for a Korean daily fortune service, portrait 2:3, highest available resolution. Create one polished premium Korean romance-webtoon editorial illustration: an attractive adult Korean woman in her late twenties with expressive clearly OPEN eyes and a subtle intrigued smile, natural proportions, tasteful teal cardigan over an ivory top. She is at a bright breakfast table just before going out, noticing a new notification on a smartphone resting upright on a small stand. A simple round analog clock sits beside the phone, visibly recognizable, while warm fresh morning sunlight enters the room. The narrative is 'a glimpse of what will happen today, and when', curious and anticipatory rather than anxious. Medium close composition: face, phone and clock clustered in the central upper two-thirds, recognizable even in a narrow small thumbnail; full shoulders within canvas, avoid chopped shoulders. Face is the emotional focal point; phone and clock large enough to read as objects. Arms naturally relaxed on table, hands mostly obscured by the table edge, no pinching gestures, no pointing hand. Beautiful crisp precise linework, detailed hair and eyes, restrained dimensional cel shading, clean high-resolution edges, sophisticated warm light, clear distinct shapes and vivid but gentle colors. Cozy contemporary Korean apartment interior softly simplified, no mountain landscape, no dark lower fade, no excessive decorative particles. No words, no letters, no numbers, no logos, no watermark; phone screen uses a simple luminous notification bubble icon only. Not a photograph, not a flat vector icon, not a UI screenshot. Opaque full-frame background.
