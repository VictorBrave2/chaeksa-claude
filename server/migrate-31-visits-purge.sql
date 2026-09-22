-- migrate-31 · 방문 집계 90일 자동 파기 (2026-09-22)
--
-- ■ 왜
--   개인정보처리방침(app/privacy.html 3절)은 「방문 집계는 90일이 지나면 지운다」고 약속한다.
--   그런데 지금까지 지우는 방법은 schema-4.sql 맨 끝 주석 한 줄(손으로 돌리는 delete)뿐이었다.
--   첫 방문 기록이 2026-08-26 이라, 11월 24일쯤부터는 손으로 안 지우면 방침을 어기게 된다.
--   이 파일은 Supabase 안에서 매일 새벽 한 번, 90일 지난 기록을 저절로 지우게 예약해 둔다.
--
-- ■ 지우는 것
--   public.visits 의 90일 지난 줄 전부. 깔때기 사건(path 가 'ev:' 로 시작하는 줄 — 생년월일 넣음 · 유료 장 엶 ·
--   결제 단추 · 네이버폼 단추)은 따로 표가 없고 같은 visits 표에 들어 있어서 같이 지워진다.
--   visits_stats · funnel_stats 는 오늘·14일만 보므로 계기판은 그대로다. 다만 visits_stats 의 total(전체 합계)은
--   「90일 안의 합계」로 바뀐다.
--
-- ■ 사장님이 할 일 (한 번만)
--   1) Supabase 대시보드 → Database → Extensions 에서 pg_cron 을 켠다.
--      (아래 create extension 줄이 대신 켜 주기도 한다. 권한 오류가 나면 대시보드에서 켜고 다시 Run.)
--   2) SQL Editor 에 이 파일 전체를 붙여넣고 Run.
--      여러 번 돌려도 안전하다 — 같은 이름의 예약을 지우고 다시 건다.
--      「destructive operation」 경고가 뜨면 delete 줄 때문이다. 90일 지난 기록만 지운다 — Run query.
--   3) 확인: 맨 아래 「확인」 줄을 하나씩 돌려 본다. 첫 줄에 예약 한 줄(active = true)이 보이면 끝.
--
-- ■ 시각
--   pg_cron 은 세계 표준시(UTC)로 돈다. '10 18 * * *' = 매일 UTC 18:10 = 한국 시각 새벽 3시 10분.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 같은 이름의 예약이 있으면 먼저 지운다(두 번 돌려도 하나만 남게)
select cron.unschedule(jobid) from cron.job where jobname = 'chaeksa-visits-90d';

select cron.schedule(
  'chaeksa-visits-90d',
  '10 18 * * *',
  $$delete from public.visits where at < now() - interval '90 days'$$
);

-- 이미 90일 지난 기록이 있으면 지금 한 번 지운다(첫 기록이 08-26 이라 11월 하순 전에는 0줄이다)
delete from public.visits where at < now() - interval '90 days';

-- 확인
--   select jobid, jobname, schedule, command, active from cron.job where jobname = 'chaeksa-visits-90d';
--   select status, return_message, start_time from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname = 'chaeksa-visits-90d')
--    order by start_time desc limit 5;
--   select min(at) as 가장_오래된_기록, count(*) as 줄_수 from public.visits;
--
-- 되돌리기(자동 파기를 멈출 때 — 그러면 방침 3절을 손으로 지켜야 한다)
--   select cron.unschedule('chaeksa-visits-90d');
