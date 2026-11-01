-- 1日の目標（v1.6.0）
-- 草の色の濃さを「その日の目標に対する達成率」で決めるため、習慣ごとに目標値を持たせる。
-- 既存の習慣には仮の目標（分: 30 / 回: 10）を入れる。アプリから編集可能。

alter table habits
  add column daily_goal numeric not null default 30 check (daily_goal > 0);

update habits set daily_goal = 10 where unit = 'count';
