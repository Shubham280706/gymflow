-- GymFlow initial schema. Money is stored in paise (INR * 100). Dates are plain dates (IST).

create extension if not exists pgcrypto;

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  -- days relative to due date on which a reminder goes out: -3 = 3 days before, 0 = due day, 3 = 3 days overdue
  reminder_days int[] not null default '{-3,0,3,7}',
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  price_paise integer not null check (price_paise > 0),
  duration_days integer not null check (duration_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  name text not null,
  phone text not null, -- E.164 without '+', e.g. 919876543210
  start_date date not null default current_date,
  next_due_date date not null,
  status text not null default 'active' check (status in ('active','paused','left')),
  created_at timestamptz not null default now()
);
create index clients_gym_idx on public.clients(gym_id);
create index clients_plan_idx on public.clients(plan_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  payment_link_id text,
  payment_link_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, due_date)
);
create index invoices_gym_status_idx on public.invoices(gym_id, status, due_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  razorpay_payment_id text unique,
  amount_paise integer not null,
  method text not null default 'online', -- online | cash | upi | other
  paid_at timestamptz not null default now()
);
create index payments_gym_idx on public.payments(gym_id, paid_at);
create index payments_invoice_idx on public.payments(invoice_id);
create index payments_client_idx on public.payments(client_id);

-- Messages waiting to be delivered (n8n polls this through /api/automation/outbox).
create table public.outbox (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  kind text not null,            -- r-3, r0, r3 ... | receipt | manual-<ts>
  to_phone text not null,
  template text not null,        -- approved WhatsApp template name
  params jsonb not null default '[]'::jsonb,
  body text not null,            -- plain-text fallback
  status text not null default 'queued' check (status in ('queued','sending','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  unique (invoice_id, kind)
);
create index outbox_status_idx on public.outbox(status, created_at);
create index outbox_gym_idx on public.outbox(gym_id);
create index outbox_client_idx on public.outbox(client_id);

-- ---------- Row level security ----------
create or replace function public.owns_gym(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.gyms where id = g and owner_id = auth.uid())
$$;
revoke all on function public.owns_gym(uuid) from public, anon;
grant execute on function public.owns_gym(uuid) to authenticated, service_role;

alter table public.gyms     enable row level security;
alter table public.plans    enable row level security;
alter table public.clients  enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.outbox   enable row level security;

create policy gyms_owner on public.gyms
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy plans_owner on public.plans
  for all to authenticated
  using (public.owns_gym(gym_id)) with check (public.owns_gym(gym_id));

create policy clients_owner on public.clients
  for all to authenticated
  using (public.owns_gym(gym_id)) with check (public.owns_gym(gym_id));

create policy invoices_owner on public.invoices
  for all to authenticated
  using (public.owns_gym(gym_id)) with check (public.owns_gym(gym_id));

-- payments and outbox are written only by the server (service role); owners can read them.
create policy payments_read on public.payments
  for select to authenticated using (public.owns_gym(gym_id));

create policy outbox_read on public.outbox
  for select to authenticated using (public.owns_gym(gym_id));

-- ---------- Settling a payment (idempotent, server only) ----------
create or replace function public.mark_invoice_paid(
  p_invoice uuid,
  p_payment_id text default null,
  p_method text default 'online'
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  inv public.invoices%rowtype;
  dur integer;
  today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  select * into inv from public.invoices where id = p_invoice for update;
  if not found or inv.status <> 'pending' then
    return false;
  end if;

  update public.invoices set status = 'paid', paid_at = now() where id = p_invoice;

  insert into public.payments (gym_id, invoice_id, client_id, razorpay_payment_id, amount_paise, method)
  values (inv.gym_id, inv.id, inv.client_id, p_payment_id, inv.amount_paise, p_method)
  on conflict (razorpay_payment_id) do nothing;

  select coalesce(p.duration_days, 30) into dur
  from public.clients c left join public.plans p on p.id = c.plan_id
  where c.id = inv.client_id;

  -- paid early: extend from the due date; paid late: extend from today
  update public.clients
  set next_due_date = greatest(inv.due_date, today) + coalesce(dur, 30)
  where id = inv.client_id;

  return true;
end $$;

revoke all on function public.mark_invoice_paid(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mark_invoice_paid(uuid, text, text) to service_role;
