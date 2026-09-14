-- =========================================================
-- SUMATIF PLANNER - PENUGASAN GURU
-- Guru + Tahun Pelajaran + Kelas + Mata Pelajaran
-- Jalankan SEKALI di Supabase SQL Editor.
-- =========================================================

create table if not exists public.teacher_assignments (
    id uuid primary key default gen_random_uuid(),
    academic_year_id uuid not null references public.academic_years(id),
    teacher_id uuid not null references public.profiles(id),
    class_id uuid not null references public.classes(id),
    subject_id uuid not null references public.subjects(id),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    unique (academic_year_id, teacher_id, class_id, subject_id)
);

create index if not exists idx_teacher_assignments_teacher
    on public.teacher_assignments(teacher_id, academic_year_id, class_id, is_active);

create index if not exists idx_teacher_assignments_class
    on public.teacher_assignments(class_id, academic_year_id, is_active);

alter table public.teacher_assignments enable row level security;

-- Guru hanya dapat membaca penugasannya sendiri.
drop policy if exists "teacher_assignments_select_own" on public.teacher_assignments;
create policy "teacher_assignments_select_own"
on public.teacher_assignments
for select
using (teacher_id = auth.uid());

-- Admin dapat mengelola seluruh penugasan.
drop policy if exists "teacher_assignments_admin_all" on public.teacher_assignments;
create policy "teacher_assignments_admin_all"
on public.teacher_assignments
for all
using (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
    )
);
