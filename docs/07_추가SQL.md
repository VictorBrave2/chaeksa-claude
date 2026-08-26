# 나중에 실행해야 하는 SQL

Supabase → SQL Editor → New query 에 붙여넣고 Run 하세요. 순서대로, 각각 한 번씩이면 됩니다.

| 파일 | 내용 | 상태 |
|---|---|---|
| `server/schema.sql` | 회원·원국·상담 표와 보안(RLS) | ✅ 실행 완료 |
| `server/schema-2.sql` | 계정·데이터 완전 삭제 함수 | ✅ 실행 완료 |
| `server/schema-3.sql` | **여러 사람 저장** + 상담-인물 연결 + 삭제 함수 갱신 | ✅ 실행 완료 |
| `server/schema-4.sql` | 유입 카운터 `visits` (insert 전용 RLS) | ✅ 실행 완료 |
| `server/schema-5.sql` | **AI 사용량 서버 강제** — 프록시가 토큰 검증 + 한도 계량 | ✅ 실행 완료 |
| `server/schema-6.sql` | **아침 푸시 알림 구독** — push_subs + 발송자 비밀 | ⬜ 실행 필요 |

`schema-3.sql`을 실행하기 전에는 여러 사람이 **이 기기에만** 저장되고 서버로 동기화되지 않습니다.
앱은 그 상태에서도 오류 없이 동작하며, 실행한 뒤 자동으로 서버에 올라갑니다.

## schema-5 — 완료 (2026-08-26). 남은 확인 방법만 적어둔다

Vercel 환경변수는 이제 **필요 없다.** 붙여넣기 과정에서 anon 키가 깨져
강제가 무력화되는 사고가 났고(눈에 안 보이는 유니코드 문자), 애초에 주소와
anon 키는 config.js로 모든 방문자에게 내려가는 공개값이라 코드에 기본값으로
박았다. Vercel에 있어야 할 비밀은 `ANTHROPIC_API_KEY` 하나뿐이다.
(예전 이름 `SUPABASE_URL`·`SUPABASE_ANON_KEY`는 깨진 값이 남아 있어도
프록시가 일부러 읽지 않는다. 이전 시에는 `_OVERRIDE` 이름으로만 덮어쓴다.)

상태 확인: `https://chaeksa-claude.vercel.app/api/chat` 을 열어서

- `"supabaseProbe": "ok"` — 프록시가 Supabase에 닿고 함수가 살아 있다
- `"usageEnforced": true` — 토큰 없는 호출은 401

라이브 검증 완료(2026-08-26): 토큰 없음·가짜 토큰·서명 틀린 JWT 전부 401,
익명 RPC는 권한 거부(42501), ai_usage 표 익명 읽기는 빈 배열(RLS 정책 0개).

**`service_role` 키는 어디에도 절대 넣지 않는다.** 필요 없게 설계했다 —
사용자의 로그인 토큰만으로 검증과 계량이 된다(`ai_usage_bump`가 SECURITY DEFINER).

## schema-6 (아침 푸시) — 실행 후 두 값을 Vercel에

1. `server/schema-6.sql`을 SQL Editor에서 Run 하면 **결과 칸에 uuid 하나가 나온다.**
   그 값을 복사한다 (발송자 확인용 비밀이다).
2. Vercel → Settings → Environment Variables 에 두 개 추가:
   - `CRON_SECRET` = 방금 복사한 uuid
   - `VAPID_PRIVATE_KEY` = 아래 값 그대로 (푸시 서명용 비밀키)
     ```
     eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IjZlU1Qwa2lwS2t4Rmd0S2JjeDdDMU9nUkZEb0djVU1rMkkxaDktU2w3YTQiLCJ5IjoiN2NlX2hIQXFyZzJiQU1fNVhodU9UUTlfUjNQU1doVmt0aDdXSjVnZnVFZyIsImQiOiJlUDRyMnd1cXE5Z01XcGhVT0dYandXdFpJMzVLV3FEdGZNUkZXb0UtRUFzIn0
     ```
3. Deployments → Redeploy.
4. 확인: `https://chaeksa-claude.vercel.app/api/push` 를 열면
   `hasCronSecret: true, hasVapidKey: true` 가 보여야 한다.
5. 휴대폰에서 chaeksa.kr → 설정 → **아침 알림 받기**. 다음 날 아침 7시 30분에 온다.
   (아이폰은 "홈 화면에 추가"를 먼저 해야 한다. 버튼이 안내한다.)

발송은 매일 22:30 UTC(한국 07:30)에 Vercel Cron이 한다. 서버는 빈 푸시로
깨우기만 하고 문구·계산은 전부 기기에서 만든다 — 개인정보가 서버를 오가지 않는다.
