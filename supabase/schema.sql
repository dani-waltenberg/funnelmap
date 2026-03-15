-- ═══════════════════════════════════════════════════════════════════
-- FUNNELMAP — Schema Supabase
-- Execute este SQL no Supabase: Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabela de perfis (estende auth.users) ──────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text,
  email      text,
  created_at timestamptz default now()
);

-- Preenche automaticamente o perfil ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Tabela de funis ────────────────────────────────────────────────
create table if not exists public.funnels (
  id          uuid default gen_random_uuid() primary key,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  nodes       jsonb default '{}'::jsonb,
  connections jsonb default '[]'::jsonb,
  members     jsonb default '[]'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Índice para busca por dono
create index if not exists funnels_owner_idx on public.funnels(owner_id);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists funnels_updated_at on public.funnels;
create trigger funnels_updated_at
  before update on public.funnels
  for each row execute procedure public.set_updated_at();

-- ── Row Level Security (RLS) ───────────────────────────────────────
-- Ativa RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.funnels  enable row level security;

-- Profiles: cada usuário vê/edita apenas o seu perfil
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Funnels: owner tem controle total
create policy "funnels_select" on public.funnels
  for select using (auth.uid() = owner_id);

create policy "funnels_insert" on public.funnels
  for insert with check (auth.uid() = owner_id);

create policy "funnels_update" on public.funnels
  for update using (auth.uid() = owner_id);

create policy "funnels_delete" on public.funnels
  for delete using (auth.uid() = owner_id);

-- ═══════════════════════════════════════════════════════════════════
-- Pronto! Agora configure .env com sua SUPABASE_URL e ANON_KEY
-- ═══════════════════════════════════════════════════════════════════
