-- Learning Service Tables
-- Run this in Supabase SQL Editor

-- ========================================
-- Schema and Permissions Setup
-- ========================================
-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS learning_svc;

-- Grant usage on schema to service role and authenticated users
GRANT USAGE ON SCHEMA learning_svc TO service_role;
GRANT USAGE ON SCHEMA learning_svc TO authenticated;
GRANT USAGE ON SCHEMA learning_svc TO anon;


-- ========================================
-- Session Resources (Tài nguyên buổi học)
-- ========================================
CREATE TABLE IF NOT EXISTS learning_svc.session_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,  -- Liên kết đến academic_svc.class_sessions.id
    resource_type TEXT NOT NULL CHECK (resource_type IN ('slide', 'exercise', 'video', 'document')), 
    title TEXT NOT NULL,       -- Tiêu đề của tài nguyên, ví dụ: "Slide bài 1"
    url TEXT NOT NULL,         -- Đường link đến tài nguyên (Google Drive, Youtube, v.v.)
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_on_session ON learning_svc.session_resources(session_id);


-- ========================================
-- Student Submissions (Bài nộp của học viên)
-- ========================================
CREATE TABLE IF NOT EXISTS learning_svc.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES learning_svc.session_resources(id), -- Liên kết đến bài tập được giao
    student_id UUID NOT NULL,
    submission_url TEXT NOT NULL,      -- Link bài làm của học viên
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grade NUMERIC(5, 2),               -- Điểm số
    feedback TEXT,                     -- Nhận xét của gia sư
    graded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_submissions_on_resource ON learning_svc.student_submissions(resource_id);


-- ========================================
-- Session Attendance (Điểm danh buổi học)
-- ========================================
CREATE TABLE IF NOT EXISTS learning_svc.session_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,  -- Reference to class_sessions.id in academic service
    student_id UUID NOT NULL,  -- Reference to users.id in user service
    status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    UNIQUE(session_id, student_id)  -- One attendance record per student per session
);


-- ========================================
-- Grant Permissions on Tables
-- ========================================
-- Grant all permissions to service_role (used by backend)
GRANT ALL ON ALL TABLES IN SCHEMA learning_svc TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA learning_svc TO service_role;

-- Grant select, insert, update to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA learning_svc TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA learning_svc TO authenticated;

-- Grant select to anon (if needed for public access)
GRANT SELECT ON ALL TABLES IN SCHEMA learning_svc TO anon;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_svc GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_svc GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_svc GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_svc GRANT USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning_svc GRANT USAGE ON SEQUENCES TO authenticated;
