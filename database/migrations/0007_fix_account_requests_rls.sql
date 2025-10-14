-- 0007_fix_account_requests_rls.sql
-- Fix RLS policies for account_requests table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage account requests" ON public.account_requests;

-- Create separate policies for better clarity and debugging
CREATE POLICY "Admins can select account requests" 
ON public.account_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Admin'
    )
);

CREATE POLICY "Admins can insert account requests" 
ON public.account_requests 
FOR INSERT 
WITH CHECK (true); -- Anyone can submit an account request

CREATE POLICY "Admins can update account requests" 
ON public.account_requests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Admin'
    )
);

CREATE POLICY "Admins can delete account requests" 
ON public.account_requests 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Admin'
    )
);
