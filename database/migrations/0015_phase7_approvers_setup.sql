-- ============================================================================
-- Phase 7: Report Approvers Setup
-- Creates profiles and contract assignments for two PM/APM users
-- ============================================================================

-- Approver 1: ba919fe4-eb24-4826-8305-c4e4a3258948 (approver1@example.com)
-- Approver 2: b728449a-c349-4996-be02-9fd4cdb64073 (approver2@example.com)

DO $$
DECLARE
    approver1_id uuid := 'ba919fe4-eb24-4826-8305-c4e4a3258948';
    approver2_id uuid := 'b728449a-c349-4996-be02-9fd4cdb64073';
    contract_id uuid;
    contract2_id uuid;
    report_month date;
BEGIN
    RAISE NOTICE 'Setting up Phase 7 Report Approvers...';
    
    -- Get contract IDs (assuming at least one contract exists)
    SELECT id INTO contract_id FROM public.contracts ORDER BY created_at LIMIT 1;
    SELECT id INTO contract2_id FROM public.contracts ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- If only one contract exists, both approvers will share it
    IF contract2_id IS NULL THEN
        contract2_id := contract_id;
        RAISE NOTICE 'Only one contract found, both approvers will be assigned to it';
    END IF;
    
    report_month := date_trunc('month', CURRENT_DATE);
    
    RAISE NOTICE 'Approver 1 ID: %', approver1_id;
    RAISE NOTICE 'Approver 2 ID: %', approver2_id;
    RAISE NOTICE 'Contract 1 ID: %', contract_id;
    RAISE NOTICE 'Contract 2 ID: %', contract2_id;
    
    -- ========================================================================
    -- Create/Update Approver 1 Profile
    -- ========================================================================
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        approver1_id, 
        'approver1@example.com', 
        'Test Approver One', 
        'Report Approver', 
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'Report Approver', 
        full_name = 'Test Approver One', 
        is_active = true,
        email = 'approver1@example.com';
    
    RAISE NOTICE '✓ Created/Updated Approver 1 profile';
    
    -- Assign PM role for Contract 1
    INSERT INTO public.user_contract_roles (user_id, contract_id, role)
    VALUES (approver1_id, contract_id, 'PM')
    ON CONFLICT (user_id, contract_id, role) DO NOTHING;
    
    RAISE NOTICE '✓ Assigned Approver 1 as PM for Contract 1';
    
    -- ========================================================================
    -- Create/Update Approver 2 Profile
    -- ========================================================================
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        approver2_id, 
        'approver2@example.com', 
        'Test Approver Two', 
        'Report Approver', 
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'Report Approver', 
        full_name = 'Test Approver Two', 
        is_active = true,
        email = 'approver2@example.com';
    
    RAISE NOTICE '✓ Created/Updated Approver 2 profile';
    
    -- Assign APM role for Contract 2 (or Contract 1 if only one exists)
    INSERT INTO public.user_contract_roles (user_id, contract_id, role)
    VALUES (approver2_id, contract2_id, 'APM')
    ON CONFLICT (user_id, contract_id, role) DO NOTHING;
    
    RAISE NOTICE '✓ Assigned Approver 2 as APM for Contract 2';
    
    -- ========================================================================
    -- Create Monthly Reports for Testing
    -- ========================================================================
    
    -- Pending report for current month (Contract 1)
    INSERT INTO public.monthly_reports (
        contract_id, 
        report_month, 
        pm_review_status
    )
    VALUES (
        contract_id, 
        report_month, 
        'pending'
    )
    ON CONFLICT (contract_id, report_month) DO NOTHING;
    
    RAISE NOTICE '✓ Created pending report for Contract 1, current month';
    
    -- Approved report for previous month (Contract 1) - for testing PDF export
    INSERT INTO public.monthly_reports (
        contract_id, 
        report_month, 
        pm_review_status, 
        pm_reviewer, 
        pm_reviewed_at,
        pm_review_comment
    )
    VALUES (
        contract_id, 
        report_month - INTERVAL '1 month', 
        'approved',
        approver1_id,
        NOW() - INTERVAL '5 days',
        'Report approved for testing PDF export'
    )
    ON CONFLICT (contract_id, report_month) DO NOTHING;
    
    RAISE NOTICE '✓ Created approved report for Contract 1, previous month';
    
    -- If we have a second contract, create reports for it too
    IF contract2_id != contract_id THEN
        INSERT INTO public.monthly_reports (
            contract_id, 
            report_month, 
            pm_review_status
        )
        VALUES (
            contract2_id, 
            report_month, 
            'pending'
        )
        ON CONFLICT (contract_id, report_month) DO NOTHING;
        
        RAISE NOTICE '✓ Created pending report for Contract 2, current month';
    END IF;
    
    -- ========================================================================
    -- Ensure Report Queue Has Items
    -- ========================================================================
    
    -- Get approved task statuses and add to report queue
    DECLARE
        status_record RECORD;
        queue_count integer := 0;
    BEGIN
        FOR status_record IN 
            SELECT DISTINCT ON (ts.task_id) 
                ts.id as status_id,
                pli.contract_id,
                ts.report_month
            FROM public.task_statuses ts
            JOIN public.tasks t ON ts.task_id = t.id
            JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
            WHERE ts.lead_review_status = 'approved'
            AND ts.report_month = report_month
            AND pli.contract_id IN (contract_id, contract2_id)
            ORDER BY ts.task_id, ts.submitted_at DESC
            LIMIT 10
        LOOP
            INSERT INTO public.report_queue (contract_id, report_month, task_status_id)
            VALUES (status_record.contract_id, status_record.report_month, status_record.status_id)
            ON CONFLICT (contract_id, report_month, task_status_id) DO NOTHING;
            
            queue_count := queue_count + 1;
        END LOOP;
        
        RAISE NOTICE '✓ Added % items to report queue', queue_count;
    END;
    
    -- ========================================================================
    -- Summary
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Phase 7 Approvers Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Credentials:';
    RAISE NOTICE '  Approver 1 (PM): approver1@example.com / TestPassword123!';
    RAISE NOTICE '  Approver 2 (APM): approver2@example.com / TestPassword123!';
    RAISE NOTICE '';
    RAISE NOTICE 'Contract Assignments:';
    RAISE NOTICE '  Approver 1 → Contract 1 (PM)';
    RAISE NOTICE '  Approver 2 → Contract 2 (APM)';
    RAISE NOTICE '';
    RAISE NOTICE 'Reports Created:';
    RAISE NOTICE '  - Pending report for current month';
    RAISE NOTICE '  - Approved report for previous month (for PDF testing)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Verify .env has TEST_APPROVER_EMAIL and TEST_APPROVER2_EMAIL';
    RAISE NOTICE '  2. Run: npm test -- reporting.spec.js';
    RAISE NOTICE '';
    
END $$;
