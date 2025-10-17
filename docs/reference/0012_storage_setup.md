# Storage Bucket Setup for Reports
## Phase 1.8: Create Supabase Storage Bucket for Reports

This document describes the manual steps required to set up the Supabase Storage bucket for PDF reports.

## Steps to Execute in Supabase Dashboard

### 1. Create Storage Bucket

1. Navigate to **Storage** in the Supabase Dashboard
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `reports`
   - **Public**: Unchecked (private bucket)
   - **File size limit**: 50 MB (or as needed)
   - **Allowed MIME types**: `application/pdf`

### 2. Set Up Bucket Policies

After creating the bucket, set up the following RLS policies:

#### Policy 1: Admins can upload reports
```sql
CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'reports' AND
    public.is_admin()
);
```

#### Policy 2: PM/APM can upload reports for their contracts
```sql
CREATE POLICY "PM/APM can upload reports for their contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'reports' AND
    -- Extract contract code from path: reports/{CONTRACT_CODE}/{YYYY-MM}/report.pdf
    (storage.foldername(name))[1] IN (
        SELECT c.code 
        FROM public.contracts c
        JOIN public.user_contract_roles ucr ON c.id = ucr.contract_id
        WHERE ucr.user_id = auth.uid()
        AND ucr.role IN ('PM', 'APM')
    )
);
```

#### Policy 3: Admins can read all reports
```sql
CREATE POLICY "Admins can read all reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'reports' AND
    public.is_admin()
);
```

#### Policy 4: PM/APM can read reports for their contracts
```sql
CREATE POLICY "PM/APM can read reports for their contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] IN (
        SELECT c.code 
        FROM public.contracts c
        JOIN public.user_contract_roles ucr ON c.id = ucr.contract_id
        WHERE ucr.user_id = auth.uid()
        AND ucr.role IN ('PM', 'APM')
    )
);
```

#### Policy 5: Admins can delete reports
```sql
CREATE POLICY "Admins can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'reports' AND
    public.is_admin()
);
```

### 3. Folder Structure

The bucket will use the following folder structure:
```
reports/
├── {CONTRACT_CODE}/
│   ├── {YYYY-MM}/
│   │   └── report.pdf
```

Example:
```
reports/
├── NMC-2025/
│   ├── 2025-10/
│   │   └── report.pdf
│   ├── 2025-11/
│   │   └── report.pdf
├── FSS-2025/
│   ├── 2025-10/
│   │   └── report.pdf
```

### 4. Verification

After setup, verify:
1. Bucket `reports` exists and is private
2. All 5 policies are active
3. Test upload with an admin user
4. Test signed URL generation

## Alternative: SQL Script for Storage Policies

If you have access to run SQL directly on the storage schema:

```sql
-- Note: Run these in the Supabase SQL Editor after creating the bucket via UI

-- Policy for admins to upload
INSERT INTO storage.policies (bucket_id, name, definition, check_definition)
VALUES (
    'reports',
    'Admins can upload reports',
    'INSERT',
    'bucket_id = ''reports'' AND public.is_admin()'
);

-- Policy for PM/APM to upload
INSERT INTO storage.policies (bucket_id, name, definition, check_definition)
VALUES (
    'reports',
    'PM/APM can upload reports for their contracts',
    'INSERT',
    'bucket_id = ''reports'' AND (storage.foldername(name))[1] IN (SELECT c.code FROM public.contracts c JOIN public.user_contract_roles ucr ON c.id = ucr.contract_id WHERE ucr.user_id = auth.uid() AND ucr.role IN (''PM'', ''APM''))'
);

-- Add remaining policies similarly...
```

## Acceptance Criteria

✅ Supabase Storage bucket `reports` created  
✅ Public access disabled  
✅ Folder structure `reports/{CONTRACT_CODE}/{YYYY-MM}/report.pdf` documented  
✅ Signed URL retrieval works in dev environment  
✅ RLS policies restrict access by role and contract  

## Testing

Test the storage setup with:
```javascript
// Upload test
const { data, error } = await supabase.storage
    .from('reports')
    .upload('NMC-2025/2025-10/test-report.pdf', pdfBlob);

// Get signed URL
const { data: signedUrl } = await supabase.storage
    .from('reports')
    .createSignedUrl('NMC-2025/2025-10/test-report.pdf', 3600);
```
