# 회원가입·동기화 설정 (Supabase)

로그인하면 원국과 상담 기록이 서버에 보관되어 기기를 바꿔도 이어집니다.
로그인 방식: **카카오** (기본) · **구글** · 이메일 링크(예비)

> 네이버는 Supabase가 공식 지원하지 않습니다. 필요하면 나중에 별도 구현합니다.
> 카카오만으로 한국 사용자 대부분이 커버됩니다.

---

## 1. 프로젝트 만들기 (3분)
1. https://supabase.com/dashboard → **New project**
2. Name: `chaeksa`, Region: **Northeast Asia (Seoul)** 선택, 데이터베이스 비밀번호는 아무거나 (안 쓸 겁니다)
3. 생성까지 1~2분 대기

## 2. 표 만들기 (1분)
1. 왼쪽 **SQL Editor** → **New query**
2. 저장소의 `server/schema.sql` 내용을 전부 붙여넣기 → **Run**
3. "Success"가 나오면 끝

## 3. 값 두 개 가져오기
**Project Settings → API** 에서:

| 이름 | 예시 |
|---|---|
| Project URL | `https://abcdefgh.supabase.co` |
| anon public key | `eyJhbGciOi...` (긴 문자열) |

이 두 개를 알려주시면 제가 앱에 넣고 배포합니다.
**anon key는 공개용 키라 노출되어도 안전합니다.** 실제 보호는 데이터베이스의 행 수준 보안(RLS)이 하고,
2단계에서 실행한 SQL이 "내 데이터는 나만 본다"를 강제합니다.

## 4. 돌아올 주소 등록
**Authentication → URL Configuration**
- Site URL: `https://chaeksa.kr`
- Redirect URLs에 추가: `https://chaeksa.kr` , `https://chaeksa.kr/`

## 5. 카카오 로그인 붙이기 (10분)
1. https://developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 이름 `책사`, 회사명 아무거나
2. **앱 설정 → 플랫폼 → Web 플랫폼 등록**: `https://chaeksa.kr`
3. **제품 설정 → 카카오 로그인 → 활성화 ON**
4. **Redirect URI 등록**: `https://<프로젝트>.supabase.co/auth/v1/callback`
   (3번에서 받은 Project URL 뒤에 `/auth/v1/callback`)
5. **동의항목**: 닉네임(필수 아님으로 두어도 됨), 이메일은 선택으로 두면 됩니다
6. **앱 키**의 **REST API 키**를 복사
7. **제품 설정 → 카카오 로그인 → 보안 → Client Secret 생성** → 복사, 사용 상태 **사용함**
8. Supabase → **Authentication → Providers → Kakao** → 활성화
   - Client ID: REST API 키
   - Client Secret: 7번 값

## 6. 구글 로그인 (선택, 10분)
Supabase → Authentication → Providers → Google 에 Google Cloud Console에서 만든
OAuth 클라이언트 ID/시크릿을 넣으면 됩니다. 카카오만으로도 충분하니 나중에 하셔도 됩니다.

---

## 무엇이 저장되나
- 이름, 생년월일시(원국 입력값), 비서의 고정 원국 해석
- 심층 상담 기록: 질문, 가설, 판단, 실행 과제, 관측 지표 기록

## 저장되지 않는 것
- 채팅 대화 (이 기기에만)
- 매일 브리핑 (매일 새로 만들므로 옮길 이유가 없음)

## 설정 전에는
`app/config.js`가 비어 있으면 동기화 기능이 조용히 꺼지고, 앱은 지금처럼 이 기기에만 저장합니다.
