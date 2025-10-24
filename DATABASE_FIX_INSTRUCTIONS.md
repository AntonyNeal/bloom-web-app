# 🚀 IMMEDIATE DATABASE FIX - Manual Steps

**This will take 2 minutes and fix the application submission immediately**

## Step-by-Step Instructions:

### 1. Go to Azure Portal

- Open https://portal.azure.com
- Navigate to **SQL databases**
- Select `lpa-applications-db`

### 2. Open Query Editor

- Click **Query editor (preview)** in the left sidebar
- Login with:
  - **Login**: `lpaadmin`
  - **Password**: `BloomPlatform2025!Secure`

### 3. Run This SQL Command

Copy and paste this exactly:

```sql
-- Add missing columns for application form
ALTER TABLE applications ADD qualification_type NVARCHAR(50);
ALTER TABLE applications ADD qualification_check NVARCHAR(MAX);

-- Verify it worked
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'applications'
AND COLUMN_NAME IN ('qualification_type', 'qualification_check');
```

### 4. Click "Run"

You should see:

- Commands completed successfully
- Two rows showing the new columns

## ✅ That's It!

The application form will **immediately start working** again.

---

## Alternative: Quick Function Fix (If you can't access Azure Portal)

I can update the function code to work without these columns temporarily:

1. Remove `qualification_type` and `qualification_check` from the form submission
2. Store this data in a temporary way until database is updated later

**Which approach would you prefer?**
