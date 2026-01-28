# Database Backup & Restore Runbook

> **Last Updated**: January 28, 2026  
> **Database**: `lpa-bloom-db-prod` (Standard S1)  
> **Backup Retention**: 7 days (automatic), 35 days (point-in-time restore)  
> **RPO (Recovery Point Objective)**: 5 minutes  
> **RTO (Recovery Time Objective)**: 30 minutes

---

## Overview

Azure SQL Database provides automatic and manual backup capabilities. This runbook documents backup strategies, restore procedures, and disaster recovery.

### Backup Strategy

| Backup Type | Frequency | Retention | Cost | Use Case |
|------------|-----------|-----------|------|----------|
| **Automatic (Full)** | Daily | 7 days | Included | Daily recovery point |
| **Point-in-Time Restore** | Continuous | 35 days | Included | Restore to any time |
| **Manual Backup** | On-demand | 180 days | $0.15 per GB | Long-term archive |
| **Geo-Redundant Backup** | Continuous | 35 days | Included | Regional disaster |

---

## Automatic Backups (Built-in)

Azure SQL automatically backs up your database daily at no additional cost.

### Check Automatic Backup Status

```bash
# View backup information
az sql db show \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "{
    Name: name,
    BackupStorageRedundancy: backupStorageRedundancy,
    CreationDate: creationDate,
    EarliestRestoreDate: earliestRestoreDate
  }"

# Example output:
# {
#   "Name": "lpa-bloom-db-prod",
#   "BackupStorageRedundancy": "Geo",
#   "CreationDate": "2025-01-01T00:00:00+00:00",
#   "EarliestRestoreDate": "2026-01-21T12:34:56+00:00"
# }
```

**Key Info**:
- **EarliestRestoreDate**: Oldest point you can restore to (7-35 days ago depending on tier)
- **BackupStorageRedundancy**: "Geo" = backed up to secondary region automatically

---

## Point-in-Time Restore (PITR)

Restore the database to any specific point in time within the retention period.

### Use Cases

- ❌ Accidental data deletion
- ❌ Application bug corrupting data
- ❌ Malicious activity
- ✅ Testing in production environment
- ✅ Data recovery for specific date/time

### Restore to Specific Point in Time

```bash
# Example: Restore to 1 hour ago
# First, find the current time
RESTORE_TIME=$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S')

# Or specify exact time (e.g., Jan 20, 2026 at 14:30 UTC)
RESTORE_TIME="2026-01-20T14:30:00Z"

# Perform restore (creates new database, doesn't replace original)
az sql db restore \
  --dest-name "lpa-bloom-db-prod-restored" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --point-in-time "$RESTORE_TIME"

# Monitor restore progress
az sql db show \
  --name "lpa-bloom-db-prod-restored" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "{Name:name, Status:status, CreationDate:creationDate}"

# When ready, rename the restored database
# 1. Keep original as backup
# 2. Verify restored database
# 3. Switch application connection string
# 4. Delete original after verification
```

### Verify Restored Database

```bash
# Connect to restored database
sqlcmd -S lpa-sql-server.database.windows.net \
  -U sqluser \
  -P [password] \
  -d lpa-bloom-db-prod-restored

# Run queries to verify data integrity
SELECT COUNT(*) as ApplicationCount FROM applications;
SELECT MAX(created_at) as LatestApplication FROM applications;
SELECT MAX(updated_at) as LastUpdate FROM applications;
```

### Swap Restored Database into Production

Once verified, swap the restored database:

```bash
# Option A: Rename databases (recommended for zero downtime)
# 1. Temporarily rename current database
az sql db rename \
  --name "lpa-bloom-db-prod" \
  --new-name "lpa-bloom-db-prod-old" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 2. Rename restored database to production name
az sql db rename \
  --name "lpa-bloom-db-prod-restored" \
  --new-name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 3. Verify connection works
sqlcmd -S lpa-sql-server.database.windows.net -U sqluser -P [password] -d lpa-bloom-db-prod

# 4. Delete old database (after verification)
az sql db delete \
  --name "lpa-bloom-db-prod-old" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --yes

# Option B: Change application connection string
# If application can be repointed temporarily:
# Update connection string to point to lpa-bloom-db-prod-restored
# Test thoroughly
# Then delete original, rename restored
```

---

## Manual Backups (Long-term Archive)

Create manual backups for compliance, auditing, or long-term retention.

### Create Manual Backup

```bash
# Create a manual copy for archival
# This creates a new database (retained for 180 days by default)
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

az sql db copy \
  --dest-name "lpa-bloom-db-backup-${BACKUP_DATE}" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# Note: Backup database is billed separately (Standard S0 = ~$10/month)
# Only keep if needed for compliance

# Verify backup created
az sql db show \
  --name "lpa-bloom-db-backup-${BACKUP_DATE}" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "{Name:name, Edition:edition, Status:status}"
```

### List Backup Copies

```bash
# List all databases (including backups)
az sql db list \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "[].{Name:name, Edition:edition, CreatedDate:creationDate}" \
  -o table

# Identify manual backups by naming pattern (backup-*)
```

### Delete Old Backup Copies

```bash
# Delete backups older than 90 days to save costs
# Identify by creation date
az sql db delete \
  --name "lpa-bloom-db-backup-20251201_000000" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --yes
```

---

## Geo-Redundant Backups

Standard tier databases are automatically geo-redundant (backed up to secondary region).

### Check Geo-Redundant Status

```bash
# View backup redundancy setting
az sql db show \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "backupStorageRedundancy"

# Should output: "Geo"
```

### Restore from Geo-Redundant Backup (Regional Disaster)

If entire Australia East region fails:

```bash
# Restore to different region (e.g., Southeast Asia)
az sql db restore \
  --dest-name "lpa-bloom-db-prod-failover" \
  --dest-server "lpa-sql-server-sea" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --point-in-time "2026-01-20T14:30:00Z"
```

---

## Backup Verification Schedule

Implement regular backup testing to ensure recoverability.

### Weekly Backup Test

```bash
# Every Monday at 2 AM:
# 1. Create PITR restore to 1 day ago
# 2. Run data integrity checks
# 3. Delete test restore

RESTORE_TIME=$(date -u -d '1 day ago' '+%Y-%m-%dT%H:%M:%S')

az sql db restore \
  --dest-name "lpa-bloom-db-test" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --point-in-time "$RESTORE_TIME"

# Wait for restore
sleep 300

# Connect and verify
sqlcmd -S lpa-sql-server.database.windows.net \
  -U sqluser \
  -P [password] \
  -d lpa-bloom-db-test \
  -Q "SELECT COUNT(*) FROM applications;"

# Clean up
az sql db delete \
  --name "lpa-bloom-db-test" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --yes
```

### Monthly Backup RTO Test

Measure actual recovery time:

```bash
# Record start time
START_TIME=$(date +%s)

# 1. Create restore
# 2. Verify data
# 3. Delete restore

# Record end time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "Recovery took ${DURATION} seconds"

# Log result (target: < 30 minutes for Standard tier)
```

---

## Backup Costs

| Tier | Automatic Backup | PITR Restore | Manual Copy | Total Annual |
|------|-----------------|--------------|-------------|--------------|
| Basic (5 GB) | Included | Included (7d) | ~$0/month | Included |
| Standard S1 (250 GB) | Included | Included (35d) | ~$15/month | Included + Archives |
| Prod (250 GB used) | Included | Included | $0 (PITR only) | $30/month |

*Manual backups retained >35 days charged separately.*

---

## Disaster Recovery Checklist

- [ ] Automatic backups enabled
- [ ] Earliest restore date within 35 days
- [ ] Geo-redundancy enabled (Geo setting)
- [ ] Manual backup created (if compliance required)
- [ ] PITR restore tested monthly
- [ ] RTO measured < 30 minutes
- [ ] Data integrity verified post-restore
- [ ] Team trained on restore procedures

---

## Related Documents

- [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./SUBSCRIPTION_RECOVERY_RUNBOOK.md)
- [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)
- [AZURE_INFRASTRUCTURE_ASSESSMENT.md](./AZURE_INFRASTRUCTURE_ASSESSMENT.md)

---

## Support

For restore issues:
1. Check [Azure Service Health](https://status.azure.com)
2. Review [SQL Database Documentation](https://learn.microsoft.com/azure/azure-sql/)
3. Contact Azure Support (Severity: High)

