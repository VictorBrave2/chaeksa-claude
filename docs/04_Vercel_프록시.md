# AI 프록시 — Vercel (Cloudflare 대체)

## 왜 옮기나
Anthropic API가 **Cloudflare 네트워크에서 오는 요청을 간헐적으로 403 "Request not allowed"로 차단**한다.
Workers·AI Gateway 공통으로 널리 보고된 문제이며, 헤더 조정이나 재시도로 우회할 수 없다.
실측: 워커 10회 호출 중 4회만 성공. 실패한 요청은 4번 재시도해도 전부 실패(같은 엣지 IP 재사용).

Vercel의 **Node 런타임은 AWS에서 실행**되므로 이 차단에 걸리지 않는다.
※ Vercel Edge Runtime은 Cloudflare 위에서 돌기 때문에 절대 쓰면 안 된다. `api/chat.js`는 Node 런타임이다.

## 설정 (약 5분)
1. https://vercel.com 접속 → **Continue with GitHub** (기존 GitHub 계정 사용, 카드 등록 불필요)
2. **Add New… → Project** → `VictorBrave2/chaeksa-claude` 選 → **Import**
3. 설정은 건드리지 말고 **Deploy** (`vercel.json`이 알아서 처리)
4. 배포 후 **Settings → Environment Variables** 에서 추가:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-…` |
   | `ALLOWED_ORIGIN` | `https://chaeksa.kr` |
   | `DAILY_LIMIT` | `40` |

5. **Deployments → 최신 배포 → Redeploy** (환경변수 반영)
6. 프록시 주소: `https://<프로젝트이름>.vercel.app/api/chat`

## 확인
브라우저로 `https://<프로젝트>.vercel.app/api/chat` 접속 시
`{"ok":true,"runtime":"vercel-node","hasKey":true,...}` 가 나오면 정상.

## 비용 방어
- `DAILY_LIMIT` 은 인스턴스 메모리 기반이라 완벽하지 않다. **최종 방어선은 Anthropic 콘솔의 지출 한도**이므로
  Console → Settings → Limits 에서 월 한도를 반드시 설정할 것.
- Vercel 무료 플랜: 함수 호출 월 10만 회 수준. 베타 규모엔 충분.

## Cloudflare 워커는?
`server/worker.js` 는 참고용으로 남겨둔다. Anthropic 차단이 풀리면 다시 쓸 수 있다.
