-- 招待コード（v1.1.0）
-- 新規登録時に招待コードをサーバー側で検証する。
-- コードの値はリポジトリに含めず、SQL Editor で直接 insert する:
--   insert into invite_codes (code) values ('<招待コード>');

create table invite_codes (
  code text primary key,
  created_at timestamptz default now()
);

-- ポリシーなしで RLS を有効化 → クライアント（anon / authenticated）からは読み書き不可
alter table invite_codes enable row level security;

-- auth.users への insert 前に、signUp の metadata に含まれる招待コードを検証
create function public.check_invite_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.invite_codes
    where code = new.raw_user_meta_data ->> 'invite_code'
  ) then
    raise exception 'invalid invite code';
  end if;

  -- 検証後はコードをユーザー情報に残さない
  new.raw_user_meta_data := new.raw_user_meta_data - 'invite_code';
  return new;
end;
$$;

create trigger check_invite_code
  before insert on auth.users
  for each row execute function public.check_invite_code();
