-- habits テーブル
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users default auth.uid() not null,
  name text not null,
  unit text not null check (unit in ('minutes', 'count')),
  color text not null,
  created_at timestamptz default now()
);

-- habit_logs テーブル
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users default auth.uid() not null,
  date date not null,
  value numeric not null check (value > 0),
  created_at timestamptz default now()
);

-- Row Level Security（自分のデータのみ操作可）
alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy "habits: own data only"
  on habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habit_logs: own data only"
  on habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
