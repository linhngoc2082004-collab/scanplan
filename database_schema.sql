-- ============================================================
-- ScanPlan Database Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- 1. Profiles
-- Stores user profile information after signup.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 2. Deadlines
-- Stores each detected or manually added deadline for a user.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_name TEXT DEFAULT '',
    deadline_type TEXT DEFAULT 'assignment',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index so we can quickly fetch deadlines for a specific user
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON deadlines(user_id);

-- -----------------------------------------------------------
-- 3. Reminder Settings
-- Stores each user's reminder/notification preferences.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    remind_5_days BOOLEAN DEFAULT TRUE,
    remind_3_days BOOLEAN DEFAULT TRUE,
    remind_1_day BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4. Syllabi
-- Records each syllabus upload by a user.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS syllabi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    processing_status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for looking up uploads by user
CREATE INDEX IF NOT EXISTS idx_syllabi_user_id ON syllabi(user_id);