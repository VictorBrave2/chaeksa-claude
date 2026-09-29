-- migrate-35 — 첫 유료상품 「연애 속의 나 — 100가지 행동 분석」(2026-09-30 사장님)
-- 값: 할인가 9,900원(정상가 59,000원은 상품 페이지 표시만 — 결제 금액은 이 표의 amount 하나).
-- 결과는 reports 에 저장한다. 쓰기는 서버(service role)만, 읽기는 본인만.
-- 다시 돌려도 안전하다.

insert into public.products (code, name, amount, active, sort)
values ('love100', '연애 속의 나 — 100가지 행동 분석', 9900, true, 1)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;

create table if not exists public.reports (
  order_id    text primary key references public.orders(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  product     text not null,
  status      text not null default 'making' check (status in ('making','done','partial','failed')),
  birth_label text,            -- 날짜 표시만(시각 · 성별 없음)
  result      jsonb,           -- { sections:[{title, items:[{q,a}]}] } — 질문과 답뿐
  created_at  timestamptz not null default now(),
  made_at     timestamptz
);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);
alter table public.reports enable row level security;

drop policy if exists reports_mine on public.reports;
create policy reports_mine on public.reports
  for select to authenticated using (user_id = auth.uid());
-- insert · update 정책은 두지 않는다 — service role 만 쓴다.

-- 확인
select code, name, amount, active from public.products where code = 'love100';
