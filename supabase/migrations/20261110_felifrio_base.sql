-- Felifrío: estructura inicial de almacenamiento en Supabase.
-- Preparada para sincronizar una misma cuenta entre celular y computadora.
-- NO se ejecuta automáticamente al publicar en Vercel.
-- Los datos existentes se migrarán desde un respaldo JSON verificado.

begin;

create table if not exists public.felifrio_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.felifrio_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request jsonb not null,
  revision bigint not null check (revision >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

create index if not exists felifrio_receipts_created_idx
  on public.felifrio_receipts (user_id, created_at desc);

alter table public.felifrio_state enable row level security;
alter table public.felifrio_receipts enable row level security;

revoke all on public.felifrio_state from anon;
revoke all on public.felifrio_receipts from anon;
grant select, insert, update on public.felifrio_state to authenticated;
grant select, insert on public.felifrio_receipts to authenticated;

drop policy if exists felifrio_state_read on public.felifrio_state;
create policy felifrio_state_read on public.felifrio_state
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists felifrio_state_insert on public.felifrio_state;
create policy felifrio_state_insert on public.felifrio_state
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists felifrio_state_update on public.felifrio_state;
create policy felifrio_state_update on public.felifrio_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists felifrio_receipts_read on public.felifrio_receipts;
create policy felifrio_receipts_read on public.felifrio_receipts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists felifrio_receipts_insert on public.felifrio_receipts;
create policy felifrio_receipts_insert on public.felifrio_receipts
  for insert to authenticated with check (user_id = (select auth.uid()));

commit;
