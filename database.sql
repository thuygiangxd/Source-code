create schema if not exists auth_svc;
create schema if not exists user_svc;
create schema if not exists academic_svc;
create schema if not exists learning_svc;
create schema if not exists payment_svc;
create schema if not exists accounting_svc;



-- ================================
-- CẤP QUYỀN RỘNG NHẤT CHO anon
-- ================================

-- Cho phép các schema tùy chỉnh được truy cập qua Data API
alter role anon set pgrst.db_schemas = 'public,graphql_public,auth_svc,user_svc,academic_svc,learning_svc,payment_svc,accounting_svc';
alter role authenticated set pgrst.db_schemas = 'public,graphql_public,auth_svc,user_svc,academic_svc,learning_svc,payment_svc,accounting_svc';
alter role service_role set pgrst.db_schemas = 'public,graphql_public,auth_svc,user_svc,academic_svc,learning_svc,payment_svc,accounting_svc';

grant usage on schema auth_svc, user_svc, academic_svc, learning_svc, payment_svc, accounting_svc
  to anon, authenticated, service_role;

grant all privileges on all tables in schema auth_svc, user_svc, academic_svc, learning_svc, payment_svc, accounting_svc
  to anon, authenticated, service_role;

grant usage, select, update on all sequences in schema auth_svc, user_svc, academic_svc, learning_svc, payment_svc, accounting_svc
  to anon, authenticated, service_role;

-- Default privileges cho đối tượng tạo SAU NÀY
alter default privileges in schema auth_svc
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema user_svc
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema academic_svc
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema learning_svc
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema payment_svc
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema accounting_svc
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema auth_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema user_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema academic_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema learning_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema payment_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema accounting_svc
  grant usage, select, update on sequences to anon, authenticated, service_role;

-- ===============================
-- SCHEMAS
-- ===============================
create schema if not exists auth_svc;
create schema if not exists user_svc;
create schema if not exists academic_svc;
create schema if not exists learning_svc;
create schema if not exists payment_svc;
create schema if not exists accounting_svc;

-- ===============================================
-- AUTH SERVICE
-- ===============================================
create table if not exists auth_svc.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- student | tutor | staff | admin | accountant
  name text not null
);

-- Seed role mặc định
insert into auth_svc.roles (code, name) values
  ('student','Học viên'),
  ('tutor','Gia sư'),
  ('staff','Nhân sự học vụ'),
  ('admin','Quản trị'),
  ('accountant','Kế toán')
on conflict (code) do nothing;

--Bảng tài khoản đăng nhập
create table if not exists auth_svc.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  external_user_id uuid null,      -- soft ref -> user_svc.users.id
  role_code text not null default 'student'
    references auth_svc.roles(code) on update cascade on delete restrict,
  created_at timestamptz default now()
);


-- ===============================================
-- AUTH SERVICE
-- ===============================================
create table if not exists auth_svc.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  external_user_id uuid null 
    REFERENCES user_svc.users(id),          -- liên kết mềm tới user_svc.users
  role_code text not null default 'student'
    REFERENCES auth_svc.roles(code)
      on update cascade 
      on delete restrict,
  created_at timestamptz default now()
);


create table if not exists auth_svc.password_reset_otps (
      id uuid primary key default gen_random_uuid(),
      email text not null,
      otp_code text not null,
      expires_at timestamptz not null,
      is_used boolean default false,
      created_at timestamptz default now()
);
create index if not exists idx_password_reset_otps_email on auth_svc.password_reset_otps (email);


--drop table  auth_svc.password_reset_otps

create index if not exists idx_accounts_username on auth_svc.accounts (username);
create index if not exists idx_accounts_role_code on auth_svc.accounts (role_code);

-- ===============================================
-- USER SERVICE
-- ===============================================
create table if not exists user_svc.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email    text not null unique,
  name     text not null,
  phone    text null,
  gender   text check (gender in ('Nam','Nữ')),
  balance  numeric(18,2) not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_users_username on user_svc.users (username);
create index if not exists idx_users_email    on user_svc.users (email);
create index if not exists idx_users_phone    on user_svc.users (phone);



-- ===============================
-- ACADEMIC SERVICE
-- ===============================


-- TUTOR PROFILES
create table if not exists academic_svc.tutor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,         -- soft ref -> user_svc.users.id
  bio text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);
create index if not exists idx_tutor_profiles_user 
  on academic_svc.tutor_profiles (user_id);





-- Thêm start_date / end_date, bỏ course
-- create table if not exists academic_svc.teaching_schedules (
--   id uuid primary key default gen_random_uuid(),
--   -- course_id uuid not null references academic_svc.courses(id),
--   schedule_json jsonb not null,             -- {"days":["Mon","Wed"],"start_time":"08:00","end_time":"10:00"}
--   start_date date not null,  -- ngày khai giảng --tao tu dong
--   end_date   date not null,-- ngày bế giảng
--   created_at timestamptz default now(),
--   updated_at timestamptz default now()
-- );



-- STUDENT REGISTRATIONS FORM
-- thêm   education_level, grade, subject, default_fee, note, type, address,

create table if not exists academic_svc.student_registrations (
  id uuid primary key default gen_random_uuid(),
    --course_id uuid not null references academic_svc.courses(id),
  student_id uuid not null,
  -- teaching_schedule_id uuid references academic_svc.teaching_schedules(id),
  education_level text not null,
  grade int not null,
  subject text not null,
  default_fee numeric(18,2) not null default 0,
  note text,
  type text not null default 'online' check (type in ('online', 'offline')),
  address text,
  status text not null default 'processing'
  check (status in ('pending','matched','cancelled','processing')),
  schedule_json jsonb not null, 
  start_date date not null,  -- ngày khai giảng 
  end_date   date not null,-- ngày bế giảng            -- {"days":["Mon","Wed"],"start_time":"08:00","end_time":"10:00"}
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);



-- STUDENT–TUTOR ASSIGNMENTS/ nhận lớp
create table if not exists academic_svc.student_tutor_assignments (
  id uuid primary key default gen_random_uuid(),

  registration_id uuid not null
    references academic_svc.student_registrations(id) on delete cascade,

  student_id uuid not null,             -- soft ref user_svc.users.id
  tutor_user_id uuid not null,          -- soft ref user_svc.users.id

  -- assignment_type text not null default 'claimed'
  --   check (assignment_type in ('claimed', 'staff_proxy')),

  status text not null default 'active'
    check (status in ('active','released')),

  assigned_at timestamptz default now()
);


-- CLASSES
create table if not exists academic_svc.classes (
  id uuid primary key default gen_random_uuid(),
  student_tutor_assignments_id uuid references academic_svc.student_tutor_assignments(id),
  class_name text not null,
  tutor_salary numeric(18,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed')),
  start_date date not null,  -- ngày khai giảng 
  end_date   date not null,-- ngày bế giảng
  created_at timestamptz default now()
);


create or replace function academic_svc.fn_classes_dates_from_registration_biu()
returns trigger
language plpgsql
as $$
declare
  reg_start_date date;
  reg_end_date   date;
begin
  -- Lấy start_date và end_date từ bảng student_registrations
  -- thông qua student_tutor_assignments
  select sr.start_date, sr.end_date
  into reg_start_date, reg_end_date
  from academic_svc.student_tutor_assignments sta
  join academic_svc.student_registrations sr
    on sr.id = sta.registration_id
  where sta.id = new.student_tutor_assignments_id
  limit 1;

  -- Nếu lớp chưa có start_date thì gán theo registration
  if new.start_date is null and reg_start_date is not null then
    new.start_date := reg_start_date;
  end if;

  -- Nếu lớp chưa có end_date thì gán theo registration
  if new.end_date is null and reg_end_date is not null then
    new.end_date := reg_end_date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_classes_dates_from_reg_biu
on academic_svc.classes;

create trigger trg_classes_dates_from_reg_biu
before insert or update on academic_svc.classes
for each row
execute function academic_svc.fn_classes_dates_from_registration_biu();



-- CLASS SESSIONS
-- bỏ substituted/substitute_tutor_user_id/is_tutor_absent
create table if not exists academic_svc.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references academic_svc.classes(id),
  session_index int not null,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  study_hours numeric(6,2),          --Số giờ học / buổi
  status text not null default 'scheduled' check (status in ('scheduled', 'processing','completed','cancelled')),
  created_at timestamptz default now(),
  unique (class_id, session_index),
  check (end_time > start_time)
);





-- ===============================
-- BẢNG payment_intents
-- ===============================
create table if not exists payment_svc.payment_intents (
    id uuid primary key default gen_random_uuid(),
    payer_user_id uuid not null,                -- người thanh toán
    payer_email text not null,                  -- email người thanh toán
    registration_id uuid not null,              -- ID đăng ký học
    amount numeric(18,2) not null,              -- số tiền phải trả
    status text not null default 'pending' check (status in ('pending','otp_sent','processing','confirmed','failed','cancelled','expired')),
    otp_code text null,
    otp_expires_at timestamptz null,
    otp_attempts int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);


create index if not exists idx_payment_intents_user on payment_svc.payment_intents(payer_user_id);
create index if not exists idx_payment_intents_reg on payment_svc.payment_intents(registration_id);





-- ===============================
-- BẢNG payments
-- ===============================
create table if not exists payment_svc.payments (
    id uuid primary key default gen_random_uuid(),
    intent_id uuid not null references payment_svc.payment_intents(id) on delete cascade,
    amount numeric(18,2) not null,
    payer_balance_before numeric(18,2) null,
    payer_balance_after numeric(18,2) null,
    created_at timestamptz default now()
);


create index if not exists idx_payments_intent on payment_svc.payments(intent_id);




-- ===============================
-- LEARNING SERVICE
-- ===============================

CREATE TABLE IF NOT EXISTS learning_svc.session_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,  -- Reference to class_sessions.id in academic service
    student_id UUID NOT NULL,  -- Reference to users.id in user service
    status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    UNIQUE(session_id, student_id)  -- One attendance record per student per session
);
-- drop schema if exists learning_svc cascade;

-- DROP TABLE IF EXISTS learning_svc.session_attendance  CASCADE;



CREATE TABLE IF NOT EXISTS learning_svc.session_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,  -- Liên kết đến academic_svc.class_sessions.id
    resource_type TEXT NOT NULL CHECK (resource_type IN ('slide', 'exercise', 'meeting', 'submission','review')), 
    title TEXT NOT NULL,       -- Tiêu đề của tài nguyên, ví dụ: "Slide bài 1"
    url TEXT NOT NULL,         -- Đường link đến tài nguyên (Google Drive, Youtube, v.v.)
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
    
);


-- DROP TABLE IF EXISTS academic_svc.session_resources CASCADE;

--không sử dụngg
CREATE TABLE IF NOT EXISTS learning_svc.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES learning_svc.session_resources(id), -- Liên kết đến bài tập được giao
    student_id UUID NOT NULL,
    submission_url TEXT NOT NULL,      -- Link bài làm của học viên
    submitted_at TIMESTAMTz default now(),
    grade NUMERIC(5, 2),               -- Điểm số
    feedback TEXT,                     -- Nhận xét của gia sư
    graded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_submissions_on_resource ON learning_svc.student_submissions(resource_id);


-- ===============================
-- ACADEMIC SERVICE - PAYROLL TRACKING
-- ===============================
create table if not exists academic_svc.monthly_payments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null,
  payment_month text not null, -- YYYY-MM format
  paid_at timestamptz default now(),
  unique(tutor_id, payment_month)
);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_tutor_month ON academic_svc.monthly_payments(tutor_id, payment_month);