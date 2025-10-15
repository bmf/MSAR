-- 0013_migrate_updates_to_task_statuses.sql
-- Phase 5: Migrate data from old updates table to task_statuses table
-- This addresses the known issue where updates table uses old schema (bigint task_id)

-- Note: This migration assumes:
-- 1. The old 'updates' table references 'pws_tasks' (bigint ids)
-- 2. The new 'task_statuses' table references 'tasks' (uuid ids)
-- 3. We need to map old task IDs to new task IDs based on task names or other identifiers

-- For now, we'll add a helper function to derive report_month from submitted_at
-- and prepare the task_statuses table for use going forward

-- Add a comment to the old updates table indicating it's deprecated
COMMENT ON TABLE public.updates IS 'DEPRECATED: Use task_statuses table instead. This table uses old schema with bigint task_id referencing pws_tasks.';

-- Ensure task_statuses table has proper constraints for Phase 5 requirements
-- Add unique constraint to prevent duplicate submissions for same task/user/month
-- unless the prior submission is draft or rejected

-- First, drop the existing unique constraint if it exists (from initial schema)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'task_statuses_task_id_submitted_by_report_month_submitted_at_key'
    ) THEN
        ALTER TABLE public.task_statuses 
        DROP CONSTRAINT task_statuses_task_id_submitted_by_report_month_submitted_at_key;
    END IF;
END $$;

-- Add a partial unique index that prevents duplicate pending/approved submissions
-- for the same task/user/month combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_statuses_unique_submission 
ON public.task_statuses (task_id, submitted_by, report_month)
WHERE lead_review_status IN ('pending', 'approved');

-- Add index for efficient querying by status and month
CREATE INDEX IF NOT EXISTS idx_task_statuses_status_month 
ON public.task_statuses (lead_review_status, report_month);

-- Add a helper function to get the first day of the current month
CREATE OR REPLACE FUNCTION get_current_report_month()
RETURNS date AS $$
BEGIN
    RETURN date_trunc('month', CURRENT_DATE)::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_current_report_month() IS 'Returns the first day of the current month for use as report_month';

-- Add a helper function to check if a user can submit a new status for a task/month
CREATE OR REPLACE FUNCTION can_submit_task_status(
    p_task_id uuid,
    p_user_id uuid,
    p_report_month date
)
RETURNS boolean AS $$
DECLARE
    v_existing_status text;
BEGIN
    -- Check if there's an existing submission for this task/user/month
    SELECT lead_review_status INTO v_existing_status
    FROM public.task_statuses
    WHERE task_id = p_task_id
      AND submitted_by = p_user_id
      AND report_month = p_report_month
    ORDER BY submitted_at DESC
    LIMIT 1;
    
    -- Allow submission if:
    -- 1. No existing submission exists (v_existing_status IS NULL)
    -- 2. The most recent submission was rejected
    RETURN v_existing_status IS NULL OR v_existing_status = 'rejected';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION can_submit_task_status(uuid, uuid, date) IS 'Checks if a user can submit a new status for a task in a given month. Returns true if no pending/approved submission exists.';

-- Migration note: 
-- Data migration from 'updates' to 'task_statuses' should be done carefully
-- as the table structures are different. This would require:
-- 1. Mapping old bigint task_ids to new uuid task_ids
-- 2. Setting appropriate report_month values based on submitted_at dates
-- 3. Handling the status field differences (old: draft/submitted, new: pending/approved/rejected)
--
-- For this phase, we'll start fresh with task_statuses and deprecate the old updates table.
-- Existing data in 'updates' table will remain for historical reference but new submissions
-- will use 'task_statuses'.
