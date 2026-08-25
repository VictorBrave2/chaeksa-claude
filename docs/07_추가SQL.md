# 나중에 실행해야 하는 SQL

Supabase → SQL Editor → New query 에 붙여넣고 Run 하세요. 순서대로, 각각 한 번씩이면 됩니다.

| 파일 | 내용 | 상태 |
|---|---|---|
| `server/schema.sql` | 회원·원국·상담 표와 보안(RLS) | ✅ 실행 완료 |
| `server/schema-2.sql` | 계정·데이터 완전 삭제 함수 | ✅ 실행 완료 |
| `server/schema-3.sql` | **여러 사람 저장** + 상담-인물 연결 + 삭제 함수 갱신 | ✅ 실행 완료 |
| `server/schema-4.sql` | 유입 카운터 `visits` (insert 전용 RLS) | ✅ 실행 완료 |
| `server/schema-5.sql` | **AI 사용량 서버 강제** — 프록시가 토큰 검증 + 한도 계량 | ⬜ 실행 필요 |

`schema-3.sql`을 실행하기 전에는 여러 사람이 **이 기기에만** 저장되고 서버로 동기화되지 않습니다.
앱은 그 상태에서도 오류 없이 동작하며, 실행한 뒤 자동으로 서버에 올라갑니다.

## schema-5 실행 후 해야 할 일 (Vercel)

SQL만 실행하면 아직 아무것도 안 바뀝니다. 프록시가 Supabase를 알아야 합니다.

1. Vercel → chaeksa-claude → Settings → Environment Variables 에 두 개 추가:
   - `SUPABASE_URL` = `https://dedgzremezveiwhosqjj.supabase.co`
   - `SUPABASE_ANON_KEY` = (app/config.js 에 있는 anonKey 그대로 — 공개 키라 비밀 아님)
2. Deployments → 최신 배포 → Redeploy (환경변수는 재배포해야 반영됩니다)
3. 확인: 브라우저에서 `https://chaeksa-claude.vercel.app/api/chat` 을 열면
   `"usageEnforced": true` 가 보여야 합니다.

이 두 값을 넣기 전까지 프록시는 지금처럼(강제 없이) 동작합니다.
그래서 순서가 틀려도 서비스가 멈추지는 않습니다.

**절대 `service_role` 키를 Vercel에 넣지 마세요.** 필요 없게 설계했습니다 —
사용자의 로그인 토큰만으로 검증과 계량이 됩니다(`ai_usage_bump`가 SECURITY DEFINER).
