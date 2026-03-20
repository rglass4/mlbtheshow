create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id bigint primary key,
  played_at timestamptz not null,
  platform text,
  user_username text not null,
  opponent_username text not null,
  user_team text not null,
  opponent_team text not null,
  user_score integer not null,
  opponent_score integer not null,
  result text not null check (result in ('W', 'L', 'T')),
  stadium text,
  stadium_elevation_ft integer,
  hitting_difficulty text,
  pitching_difficulty text,
  weather text,
  temperature_f integer,
  wind text,
  attendance integer,
  attendance_capacity_pct numeric(5,2),
  scheduled_first_pitch text,
  winning_pitcher text,
  losing_pitcher text,
  winning_pitcher_record text,
  losing_pitcher_record text,
  user_game_score integer,
  opponent_game_score integer,
  raw_html_filename text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  is_public boolean not null default true,
  coop_players text[] not null default '{}'::text[]
);

create table if not exists public.inning_lines (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  team_side text not null check (team_side in ('user', 'opponent')),
  inning integer not null,
  runs text not null,
  unique (game_id, team_side, inning)
);

create table if not exists public.batting_lines (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  team_side text not null check (team_side in ('user', 'opponent')),
  player_name text not null,
  position text,
  batting_order integer,
  ab integer not null default 0,
  r integer not null default 0,
  h integer not null default 0,
  rbi integer not null default 0,
  bb integer not null default 0,
  so integer not null default 0,
  avg_display text,
  doubles integer not null default 0,
  triples integer not null default 0,
  home_runs integer not null default 0,
  unique (game_id, team_side, player_name)
);

create table if not exists public.pitching_lines (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  team_side text not null check (team_side in ('user', 'opponent')),
  player_name text not null,
  ip numeric(4,1) not null,
  h integer not null default 0,
  r integer not null default 0,
  er integer not null default 0,
  bb integer not null default 0,
  so integer not null default 0,
  era_display text,
  decision text,
  unique (game_id, team_side, player_name)
);

create table if not exists public.play_events (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  inning integer not null,
  half text not null check (half in ('top', 'bottom')),
  batting_team_side text not null check (batting_team_side in ('user', 'opponent')),
  sequence_num integer not null,
  description text not null,
  runs_scored integer not null default 0,
  hits integer not null default 0,
  walks integer not null default 0,
  errors integer not null default 0,
  pitches integer,
  runners_left_on integer,
  event_type text,
  batter_name text,
  pitcher_name text,
  unique (game_id, inning, half, sequence_num)
);

create table if not exists public.perfect_perfect_events (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  team_side text not null check (team_side in ('user', 'opponent')),
  player_name text not null,
  exit_velocity_mph numeric(5,1),
  description text not null
);

create table if not exists public.import_logs (
  id bigint generated always as identity primary key,
  game_id bigint,
  uploaded_by uuid references auth.users(id),
  filename text,
  status text not null check (status in ('success', 'failed')),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists games_played_at_desc_idx on public.games (played_at desc);
create index if not exists games_user_username_idx on public.games (user_username);
create index if not exists games_opponent_username_idx on public.games (opponent_username);
create index if not exists batting_lines_game_id_idx on public.batting_lines (game_id);
create index if not exists pitching_lines_game_id_idx on public.pitching_lines (game_id);
create index if not exists play_events_order_idx on public.play_events (game_id, inning, half, sequence_num);

create or replace view public.v_game_summary as
select
  g.id,
  g.played_at,
  g.user_username,
  g.opponent_username,
  g.user_team,
  g.opponent_team,
  g.user_score,
  g.opponent_score,
  g.result,
  g.stadium,
  g.hitting_difficulty,
  g.pitching_difficulty,
  g.is_public,
  coalesce(pe.perfect_perfect_count, 0) as perfect_perfect_count,
  coalesce(bl.user_hits, 0) as user_hits,
  coalesce(bl.opponent_hits, 0) as opponent_hits
from public.games g
left join (
  select game_id, count(*) as perfect_perfect_count
  from public.perfect_perfect_events
  group by game_id
) pe on pe.game_id = g.id
left join (
  select
    game_id,
    sum(case when team_side = 'user' then h else 0 end) as user_hits,
    sum(case when team_side = 'opponent' then h else 0 end) as opponent_hits
  from public.batting_lines
  group by game_id
) bl on bl.game_id = g.id;

create or replace view public.v_batting_leaders as
with batting_totals as (
  select
    bl.player_name,
    count(distinct bl.game_id) as games,
    sum(bl.ab) as ab,
    sum(bl.r) as r,
    sum(bl.h) as h,
    sum(bl.rbi) as rbi,
    sum(bl.bb) as bb,
    sum(bl.so) as so,
    sum(bl.doubles) as doubles,
    sum(bl.triples) as triples,
    sum(bl.home_runs) as home_runs
  from public.batting_lines bl
  join public.games g on g.id = bl.game_id
  where g.is_public
  group by bl.player_name
)
select
  bt.player_name,
  bt.games,
  bt.ab,
  bt.r,
  bt.h,
  bt.rbi,
  bt.bb,
  bt.so,
  case when bt.ab > 0 then round(bt.h::numeric / bt.ab, 3) else 0 end as avg,
  case when bt.ab + bt.bb > 0 then round((bt.h + bt.bb)::numeric / (bt.ab + bt.bb), 3) else 0 end as obp,
  case when bt.ab > 0 then round(((bt.h - bt.doubles - bt.triples - bt.home_runs) + 2 * bt.doubles + 3 * bt.triples + 4 * bt.home_runs)::numeric / bt.ab, 3) else null end as slg,
  case
    when bt.ab > 0 and bt.ab + bt.bb > 0 then round(
      ((bt.h + bt.bb)::numeric / (bt.ab + bt.bb)) +
      (((bt.h - bt.doubles - bt.triples - bt.home_runs) + 2 * bt.doubles + 3 * bt.triples + 4 * bt.home_runs)::numeric / bt.ab),
      3
    )
    else null
  end as ops
from batting_totals bt;

create or replace view public.v_pitching_leaders as
select
  pl.player_name,
  count(distinct pl.game_id) as games,
  round(sum(pl.ip), 1) as ip,
  sum(pl.h) as h,
  sum(pl.r) as r,
  sum(pl.er) as er,
  sum(pl.bb) as bb,
  sum(pl.so) as so,
  case when sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)) > 0 then round((sum(pl.er) * 9)::numeric / sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)), 2) else 0 end as era,
  case when sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)) > 0 then round((sum(pl.bb) + sum(pl.h))::numeric / sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)), 2) else 0 end as whip,
  case when sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)) > 0 then round((sum(pl.so) * 9)::numeric / sum(floor(pl.ip) + ((pl.ip - floor(pl.ip)) * 10 / 3.0)), 2) else 0 end as k9
from public.pitching_lines pl
join public.games g on g.id = pl.game_id
where g.is_public
group by pl.player_name;

create or replace view public.v_player_game_log as
select
  bl.player_name,
  g.id as game_id,
  g.played_at,
  g.user_team,
  g.opponent_team,
  g.result,
  bl.ab,
  bl.h,
  bl.r,
  bl.rbi,
  bl.bb,
  bl.so,
  null::numeric as ip,
  null::integer as er,
  null::integer as pitcher_so
from public.games g
join public.batting_lines bl on bl.game_id = g.id
where g.is_public
union all
select
  pl.player_name,
  g.id as game_id,
  g.played_at,
  g.user_team,
  g.opponent_team,
  g.result,
  null::integer as ab,
  null::integer as h,
  null::integer as r,
  null::integer as rbi,
  null::integer as bb,
  null::integer as so,
  pl.ip,
  pl.er,
  pl.so as pitcher_so
from public.games g
join public.pitching_lines pl on pl.game_id = g.id
where g.is_public;

create or replace view public.v_recent_games as
select *
from public.v_game_summary
order by played_at desc
limit 10;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.inning_lines enable row level security;
alter table public.batting_lines enable row level security;
alter table public.pitching_lines enable row level security;
alter table public.play_events enable row level security;
alter table public.perfect_perfect_events enable row level security;
alter table public.import_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'role') = 'service_role', false)
      or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

create policy "profiles are readable" on public.profiles
for select using (true);

create policy "profiles self-manage" on public.profiles
for all using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "public games readable" on public.games
for select using (is_public or auth.uid() = created_by or public.is_admin());

create policy "authenticated users insert games" on public.games
for insert to authenticated with check (auth.uid() = created_by or public.is_admin());

create policy "owners update games" on public.games
for update using (auth.uid() = created_by or public.is_admin())
with check (auth.uid() = created_by or public.is_admin());

create policy "owners delete games" on public.games
for delete using (auth.uid() = created_by or public.is_admin());

create policy "public inning lines readable" on public.inning_lines
for select using (exists (select 1 from public.games g where g.id = game_id and (g.is_public or g.created_by = auth.uid() or public.is_admin())));
create policy "owners write inning lines" on public.inning_lines
for all using (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())));

create policy "public batting lines readable" on public.batting_lines
for select using (exists (select 1 from public.games g where g.id = game_id and (g.is_public or g.created_by = auth.uid() or public.is_admin())));
create policy "owners write batting lines" on public.batting_lines
for all using (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())));

create policy "public pitching lines readable" on public.pitching_lines
for select using (exists (select 1 from public.games g where g.id = game_id and (g.is_public or g.created_by = auth.uid() or public.is_admin())));
create policy "owners write pitching lines" on public.pitching_lines
for all using (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())));

create policy "public play events readable" on public.play_events
for select using (exists (select 1 from public.games g where g.id = game_id and (g.is_public or g.created_by = auth.uid() or public.is_admin())));
create policy "owners write play events" on public.play_events
for all using (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())));

create policy "public perfect events readable" on public.perfect_perfect_events
for select using (exists (select 1 from public.games g where g.id = game_id and (g.is_public or g.created_by = auth.uid() or public.is_admin())));
create policy "owners write perfect events" on public.perfect_perfect_events
for all using (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.games g where g.id = game_id and (g.created_by = auth.uid() or public.is_admin())));

create policy "import logs readable by uploader" on public.import_logs
for select using (auth.uid() = uploaded_by or public.is_admin());
create policy "authenticated users insert import logs" on public.import_logs
for insert to authenticated with check (auth.uid() = uploaded_by or public.is_admin());
create policy "import logs admin delete" on public.import_logs
for delete using (auth.uid() = uploaded_by or public.is_admin());
