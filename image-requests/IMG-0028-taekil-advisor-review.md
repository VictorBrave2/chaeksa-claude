# IMG-0028 — 출산택일 — 근거를 확인하는 책사

- 요청: 2026-10-25 사용자 직접 요청. 출산택일 페이지에 적절한 삽화를 생성·교체하고 실제 사이트에 반영.
- 상태: 적용됨(3e17fb9c에 포함되어 공개 배포, 실제 페이지 표시 확인).
- 이 화면이 하려던 말: 자동 계산한 보고서를 책사가 한 번 더 확인한 뒤 열어 드립니다.
- 그림이 보여 줄 것: 같은 책사가 고전과 보고서를 대조해 근거를 짚는다. 제작 설명 첫 문단 다음, 세 단계 설명 앞에 배치한다.
- 기존 방향: 고객은 그림에 등장하지 않음. 로맨스 웹툰 남주 같은 책사 한 명, 밝은 크림·라벤더·금빛. 두 번째 그림은 첫 번째 그림을 인물·화풍 참고로 사용.
- 생성: 내장 image_gen, 투명 배경 없음. 별도 API 호출 없음.
- 원본: 삽화원본/taekil-advisor-review-v1.png (1536×1024, 로컬 보관).
- 최종: app/art/taekil-advisor-review-v1.webp (1320×880), app/art/taekil-advisor-review-v1-s.webp (660×440).
- 반영: app/taekil.html. 3:2 전체 구도, 자르지 않음. 화면 너비에 맞는 WebP, 지연 로딩, 대체 텍스트.
- 소품은 개념 삽화이며 실제 보고서·추천 수치가 아님. 실제 결과는 기존 견본 링크에서 확인.

## 최종 생성 프롬프트

```text
Use case: illustration-story.
Asset type: SECOND companion editorial illustration for the 'How we prepare your report' section of the same Korean birth-date-and-time selection webpage, landscape 1536x1024, displayed uncropped at 3:2.
Input image 1 is a CHARACTER AND STYLE reference, not a layout to repeat. Create a new scene with exactly the SAME adult male scholar: identical exceptionally handsome face, violet-gray eyes, long black hair half tied with gold ornament, ivory and periwinkle hanbok with gold embroidery. Keep refined drawn Korean romantic-fantasy webtoon style, luminous pastel spring light, ivory, lilac, champagne gold.
Scene: the same bright Korean garden pavilion, closer and quieter composition. The scholar carefully cross-checks a few traditional thread-bound books and an opened cream report folio on a low reading stand. Upper body and face on the LEFT half, graceful three-quarter view, eyes lowered slightly toward the open page with a calm focused expression. Right half: only two elegant slim thread-bound reference books, the open folio, and a small antique brass time instrument. One hand delicately points to a narrow highlighted line on the folio and the other holds a reference page open. Hands anatomically natural with five fingers, no surplus limbs. His face remains visually dominant and beautiful, supporting props much less prominent. No modern desk or office furniture. Clear intentional negative space, fewer flowers and background details than reference, elegant spring foliage softly beyond the pavilion.
Meaning: painstaking comparison and explanation behind a personal recommendation. Depict intellectual care and attention. This is a fictional editorial scholar, no claims of medical expertise. No customer, pregnant woman, baby, couple, medical equipment, doctor coat, computer, suit, tie. No calendar date selection or invented real recommendations.
Composition: full landscape 3:2 scene, avoid cropping face or key book props, generous outer margins, all hands fully visible. No collage or multiple panels.
Style: premium hand-DRAWN romance manhwa, clean fine ink linework, expressive illustrated eyes and hair, subtle cel shading, warm bright luminous gradient coloring. No photographic texture, no 3D, no realistic portrait or plastic skin, no chibi.
Text: absolutely NO readable text, numbers, logo, watermarks, captions or fake Chinese characters. Book pages have only faint small abstract line groups and a gold line accent, clearly conceptual, not a real report. No charts with fabricated data. No magic aura or guaranteed destiny imagery.
```

