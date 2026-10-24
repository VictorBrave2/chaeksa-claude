# IMG-0027 — 출산택일 — 추천서를 건네는 책사

- 요청: 2026-10-25 사용자 직접 요청. 출산택일 페이지에 적절한 삽화를 생성·교체하고 실제 사이트에 반영.
- 상태: 적용됨(3e17fb9c에 포함되어 공개 배포, 실제 페이지 표시 확인).
- 이 화면이 하려던 말: 의사가 정해 준 범위 안에서 책사 기준으로 가장 좋은 날과 시간을 골라 드립니다.
- 그림이 보여 줄 것: 책사가 고객을 바라보며 추천서를 건넨다. 신청·견본 버튼 다음에 배치해 설명을 이어 준다.
- 기존 방향: 고객은 그림에 등장하지 않음. 로맨스 웹툰 남주 같은 책사 한 명, 밝은 크림·라벤더·금빛. 두 번째 그림은 첫 번째 그림을 인물·화풍 참고로 사용.
- 생성: 내장 image_gen, 투명 배경 없음. 별도 API 호출 없음.
- 원본: 삽화원본/taekil-advisor-offer-v1.png (1536×1024, 로컬 보관).
- 최종: app/art/taekil-advisor-offer-v1.webp (1320×880), app/art/taekil-advisor-offer-v1-s.webp (660×440).
- 반영: app/taekil.html. 3:2 전체 구도, 자르지 않음. 화면 너비에 맞는 WebP, 지연 로딩, 대체 텍스트.
- 소품은 개념 삽화이며 실제 보고서·추천 수치가 아님. 실제 결과는 기존 견본 링크에서 확인.

## 최종 생성 프롬프트

```text
Use case: illustration-story.
Asset type: landscape editorial illustration for a Korean birth date and time selection service landing page, 1536x1024, composed to display completely at 3:2.
Primary request: An exceptionally beautiful adult Korean male scholar-strategist, a romantic fantasy webtoon male lead, personally offering his carefully selected recommendation to the viewer. This is a reassuring advisor, NOT a father or doctor. Only one person in the image. The customer is not depicted.
Scene: luminous spring morning in an elegant Korean pavilion, ivory fabric and soft wisteria, fresh blue sky, subtle light on the woodwork. The handsome scholar in an ivory hanbok with a pale periwinkle outer robe and restrained antique-gold trim, long black hair half tied back with a simple gold hairpin, expressive violet-gray eyes, serene direct eye contact and a very slight warm smile. Refined adult features, graceful sharp jaw, elegant nose, luminous eyes.
Pose and composition: waist-up three-quarter portrait, face near upper third center-right, holding out a small folded cream recommendation folio toward the viewer at lower center, only an understated gold bordered blank panel inside. One hand holds the folio, the other lightly rests on its edge; natural anatomical hands. A small antique brass timepiece near the lower left, minor supporting prop. Clear dominant face, spacious airy composition, all important content inside generous margins. Low visual density, beautiful subject fills about half the picture.
Style: distinctly DRAWN Korean romance fantasy webtoon/manhwa, exquisite confident fine ink contours, elegant cel shading and soft luminous color gradients, delicate illustrated hair strands, premium illustrated book cover finish. Bright cream, periwinkle, lavender and champagne gold. Romantic editorial lighting, a divine-looking human male lead. NOT photorealistic, NOT semi-realistic, NOT 3D, NOT plastic doll face, no photographic skin, no generic chibi/anime child face.
Constraints: no pregnant person, no baby, no couple, no medical clothes or equipment, no modern office, no suit or necktie, no magic fortune guarantees, no halo, no floating zodiac icons, no countdown, no fake data or fake report text. No letters, numbers, readable characters, logos, watermark, captions, or border. Folio has elegant empty lines/shapes only, it is a conceptual prop. No large calendar. Full-bleed complete landscape illustration.
```

