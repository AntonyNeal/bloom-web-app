# Bloom MVP - Manual SQL Setup Guide

## Problem
The SQL Server password needs to be reset in Azure Portal to complete migrations.

## Solution: Reset SQL Password (5 minutes)

### Step 1: Go to Azure Portal
- URL: https://portal.azure.com
- Sign in with: admin@life-psychology.com.au

### Step 2: Find SQL Server
- In search bar, type: **lpa-sql-server**
- Click: SQL Servers
- Select: **lpa-sql-server**

### Step 3: Reset Admin Password
- Click: **Reset password** (in left sidebar or Overview)
- New password: **Bloom2026!Secure#LPA** (or your choice)
- Click: **OK**
- Wait ~30 seconds for reset to complete

### Step 4: Save Credentials
After password reset, edit `bloom-sql-config.json` in this folder:

```json
{
  "SqlServer": "lpa-sql-server.database.windows.net",
  "SqlDatabase": "lpa-bloom-db-prod",
  "SqlUser": "lpaadmin",
  "SqlPassword": "Bloom2026!Secure#LPA",
  "SavedAt": "2026-01-28 12:00:00"
}
```

### Step 5: Run Migrations
```powershell
.\run-all-mvp-migrations.ps1
```

The script will automatically load credentials from `bloom-sql-config.json`.

---

## What Gets Created

### Tables
- ✅ `clients` - Patient demographics (imported from Halaxy)
- ✅ `appointments` - Scheduled sessions
- ✅ `availability_slots` - Zoe's weekly working hours
- ✅ `invoices` - Billing records (Proda-ready)

### Indexes
- Fast lookups by practitioner, client, appointment date
- Indexed session tokens for security

### Relationships
```
practitioners
  ├→ clients
  │   ├→ appointments
  │   │   ├→ clinical_notes
  │   │   └→ invoices
  │   └→ invoices
  └→ availability_slots
```

---

## What We've Built (Ready to Use)

### PowerShell Scripts
1. **save-sql-credentials.ps1** - Store credentials securely
2. **run-all-mvp-migrations.ps1** - Create all 4 tables with indexes
3. **run-migrations-azure-auth.ps1** - Alternative (needs Azure user in SQL)
4. **import-halaxy-patients.ps1** - Import client demographics from Halaxy

### SQL Migrations
1. **V035__create_clients_table.sql** - Patient demographics
2. **V036__create_appointments_table.sql** - Session scheduling
3. **V037__create_availability_slots.sql** - Working hours
4. **V038__create_invoices_table.sql** - Billing records

### API Endpoint
1. **appointments.ts** - Full CRUD for appointments (GET/POST/PUT/DELETE)

---

## Quick Start Checklist

- [ ] 1. Reset SQL password in Azure Portal (5 min)
- [ ] 2. Update bloom-sql-config.json with new password (1 min)
- [ ] 3. Run: `.\run-all-mvp-migrations.ps1` (2 min)
- [ ] 4. Verify tables exist (1 min)
- [ ] 5. Import Halaxy patients: `.\import-halaxy-patients.ps1` (3 min)
- [ ] 6. Create test appointment (5 min)

**Total time: ~15 minutes**

---

## Commands Quick Reference

### Test Database Connection
```powershell
$connectionString = "Server=lpa-sql-server.database.windows.net;Database=lpa-bloom-db-prod;User Id=lpaadmin;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()
Write-Host "Connected!"
$connection.Close()
```

### Verify Tables Exist
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('clients', 'appointments', 'availability_slots', 'invoices');
```

### Check Client Import
```sql
SELECT COUNT(*) as TotalClients FROM clients WHERE is_deleted = 0;
SELECT TOP 5 first_name, last_name, email FROM clients;
```

### Create Test Appointment
```sql
INSERT INTO appointments (
  practitioner_id,
  client_id,
  appointment_date,
  start_time,
  end_time,
  duration_minutes,
  status
) VALUES (
  'practitioner-uuid',
  'client-uuid',
  '2025-02-03',
  '10:00:00',
  '11:00:00',
  60,
  'scheduled'
);
```

---

## Next Steps (After Migrations)

### Week 1: Core Dashboard
- [ ] Create appointments calendar view (React)
- [ ] Build client list + add client form
- [ ] Appointment creation modal
- [ ] Zoe's daily schedule view

### Week 2: Availability & Billing
- [ ] Availability editor (set working hours)
- [ ] Invoice generation
- [ ] Basic billing reports

### When Proda Ready
- [ ] Integrate Proda API
- [ ] Auto-submit claims
- [ ] Medicare rebate tracking

---

## File Locations

```
bloom-web-app/
├── api/
│   ├── save-sql-credentials.ps1
│   ├── run-all-mvp-migrations.ps1
│   ├── import-halaxy-patients.ps1
│   └── src/functions/appointments.ts
│
├── db/migrations/
│   ├── V035__create_clients_table.sql
│   ├── V036__create_appointments_table.sql
│   ├── V037__create_availability_slots.sql
│   └── V038__create_invoices_table.sql
│
└── BLOOM_MVP_SETUP.md (main guide)
```

---

## Support

If you get stuck:
1. Check the error message carefully
2. Verify SQL password in Azure Portal is updated
3. Ensure bloom-sql-config.json has correct credentials
4. Try running the script again

Questions? Check:
- BLOOM_MVP_SETUP.md (this file)
- copilot-instructions.md (project architecture)
- Migration files (SQL schema details)
