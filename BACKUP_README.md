# Backup and Recovery System

This document describes the comprehensive backup and recovery mechanisms implemented for the AI automated monetization system.

## Overview

The backup system provides:
- **Database backups**: PostgreSQL dumps with compression and encryption
- **Application state backups**: Redis RDB snapshots
- **Automated scheduling**: Cron-based backup jobs
- **Point-in-time recovery**: Restore to specific timestamps
- **Integrity validation**: Comprehensive backup validation
- **Emergency procedures**: Quick disaster recovery scripts
- **Monitoring integration**: Health checks and notifications

## Architecture

### Core Components

1. **Backup Configuration** (`app/utils/backup.server.ts`)
   - Centralized configuration management
   - Environment variable handling
   - Zod schema validation

2. **Backup Implementation** (`app/utils/backup-impl.server.ts`)
   - Database backup via `pg_dump`
   - Redis backup via RDB snapshots
   - S3 upload functionality
   - Restore operations

3. **Backup Scheduler** (`app/utils/backup-scheduler.server.ts`)
   - Cron-based job scheduling
   - Concurrent backup management
   - Automatic cleanup of old backups
   - Notification system

4. **Recovery System** (`app/utils/backup-recovery.server.ts`)
   - Point-in-time recovery
   - Emergency restore procedures
   - Recovery plan generation

5. **Integrity Checks** (`app/utils/backup-integrity.server.ts`)
   - File integrity validation
   - Content validation
   - System-wide integrity checks

6. **Main Service** (`app/utils/backup-service.server.ts`)
   - Unified API for all backup operations
   - Auto-initialization in production

## Configuration

### Environment Variables

```bash
# S3 Configuration
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_S3_ACCESS_KEY=your-access-key
BACKUP_S3_SECRET_KEY=your-secret-key
BACKUP_S3_REGION=us-east-1

# Local Storage (fallback)
BACKUP_LOCAL_PATH=/tmp/backups

# Notifications
BACKUP_NOTIFICATION_WEBHOOK=https://your-webhook-url

# Encryption
BACKUP_ENCRYPTION_KEY=your-encryption-key
```

### Default Configuration

```typescript
const defaultBackupConfig = {
  database: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30, // 30 days
    destination: 's3',
    compression: true,
    encryption: true,
  },
  redis: {
    enabled: true,
    schedule: '0 3 * * *', // Daily at 3 AM
    retention: 7, // 7 days
    destination: 's3',
  },
  maxConcurrentBackups: 2,
  timeout: 3600, // 1 hour
  retryAttempts: 3,
  notificationEnabled: true,
};
```

## Usage

### Manual Operations

#### Trigger Backup
```bash
# Full system backup
npm run backup:manual

# Database only
npm run backup:manual -- database

# Redis only
npm run backup:manual -- redis
```

#### Check Status
```bash
npm run backup:status
```

#### Validate Backup
```bash
npm run backup:validate -- <backup-id>
```

#### System Integrity Check
```bash
npm run backup:integrity
```

### Emergency Restore

#### Using CLI Script
```bash
# Check available backups
tsx scripts/emergency-restore.ts status

# Validate specific backup
tsx scripts/emergency-restore.ts validate <backup-id>

# Perform emergency restore
tsx scripts/emergency-restore.ts restore <backup-id> --force

# Restore with options
tsx scripts/emergency-restore.ts restore <backup-id> \
  --database-only \
  --force \
  --no-backup
```

#### Programmatic Usage
```typescript
import { backupService } from './app/utils/backup-service.server';

// Trigger manual backup
await backupService.triggerDatabaseBackup();

// Point-in-time recovery
await backupService.performPointInTimeRecovery({
  targetTime: new Date('2024-01-01T12:00:00Z'),
  dryRun: false,
});

// Emergency restore
await backupService.performEmergencyRestore({
  backupId: 'db-1234567890-abcdef',
  force: true,
});
```

## Backup Types

### Database Backups
- **Format**: PostgreSQL custom dump
- **Compression**: Enabled by default
- **Encryption**: Configurable
- **Retention**: 30 days (configurable)
- **Schedule**: Daily at 2 AM

### Redis Backups
- **Format**: RDB snapshot
- **Compression**: Native RDB compression
- **Retention**: 7 days (configurable)
- **Schedule**: Daily at 3 AM

## Recovery Procedures

### Point-in-Time Recovery
1. Identify target timestamp
2. System finds most recent backup before timestamp
3. Creates recovery plan
4. Executes restore operations
5. Validates system integrity

### Emergency Restore
1. Identify critical backup
2. Optional: Backup current state
3. Stop services
4. Restore from backup
5. Restart services
6. Manual validation required

## Monitoring and Health Checks

### Integrated Monitoring
- Backup health checks every 5 minutes
- Database health monitoring
- Automatic notifications on failures
- Metrics stored in analytics database

### Health Status Indicators
- **Healthy**: All backups successful, recent backups exist
- **Degraded**: Some failures or missing recent backups
- **Unhealthy**: Backup system not functioning

## Security Considerations

### Data Protection
- S3 server-side encryption
- Optional client-side encryption
- Secure credential management
- Access logging and monitoring

### Access Control
- Environment variable based configuration
- No hardcoded secrets
- Principle of least privilege for S3 access

## Disaster Recovery Plan

### Immediate Response (0-1 hour)
1. Assess system status: `npm run backup:status`
2. Check integrity: `npm run backup:integrity`
3. Trigger emergency restore if needed

### Short-term Recovery (1-4 hours)
1. Identify root cause
2. Perform point-in-time recovery if data loss
3. Validate all systems
4. Restore user access

### Long-term Prevention (1+ days)
1. Review backup configurations
2. Update retention policies
3. Implement additional safeguards
4. Document lessons learned

## Maintenance

### Regular Tasks
- Monitor backup success rates
- Review retention policies
- Test restore procedures monthly
- Update backup configurations as needed

### Troubleshooting
- Check logs for backup failures
- Validate S3 bucket permissions
- Test database connectivity
- Verify Redis accessibility

## Performance Considerations

### Resource Usage
- Backups run during low-traffic hours
- Concurrent backup limits prevent resource exhaustion
- Compression reduces storage and transfer costs
- Timeout and retry mechanisms prevent hanging operations

### Scalability
- S3 storage scales automatically
- Configurable retention prevents unlimited growth
- Parallel backup execution for multiple components

## Compliance and Auditing

### Audit Trail
- All backup operations logged
- Checksum validation for integrity
- Timestamp tracking for compliance
- Notification history for accountability

### Compliance Features
- Immutable backup storage
- Encryption at rest and in transit
- Access logging
- Retention policy enforcement
