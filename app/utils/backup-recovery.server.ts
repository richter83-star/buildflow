import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger.server';
import type { BackupMetadata, RestoreOptions, RestoreResult } from './backup.server';

export interface PointInTimeRecoveryOptions {
  targetTime: Date;
  targetDatabase?: string;
  dryRun: boolean;
  maxBackups?: number;
}

export interface EmergencyRestoreOptions {
  backupId?: string; // If not provided, use latest
  targetDatabase?: string;
  targetRedis?: string;
  force: boolean; // Skip safety checks
  backupData: boolean; // Backup current state before restore
}

export interface RecoveryPlan {
  steps: RecoveryStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
}

export interface RecoveryStep {
  id: string;
  description: string;
  type: 'backup' | 'stop_services' | 'restore_database' | 'restore_redis' | 'start_services' | 'validate';
  estimatedDuration: number;
  required: boolean;
}

interface RecoveryExecutionOptions {
  targetDatabase?: string;
  targetRedis?: string;
  dryRun: boolean;
}

/**
 * Perform point-in-time recovery
 */
export async function performPointInTimeRecovery(options: PointInTimeRecoveryOptions): Promise<RestoreResult> {
  const startTime = Date.now();

  try {
    logger.info(`[Recovery] Starting point-in-time recovery to ${options.targetTime.toISOString()}`);

    // Find available backups before target time
    const availableBackups = await findBackupsBeforeTime(options.targetTime, options.maxBackups || 10);

    if (availableBackups.length === 0) {
      throw new Error(`No backups found before ${options.targetTime.toISOString()}`);
    }

    // Select the most recent backup before target time
    const selectedBackup = availableBackups[0]; // Already sorted by timestamp desc

    logger.info(`[Recovery] Selected backup: ${selectedBackup.id} from ${selectedBackup.timestamp.toISOString()}`);

    if (options.dryRun) {
      return {
        success: true,
        restoredItems: 0,
        duration: Date.now() - startTime,
      };
    }

    // Create recovery plan
    const plan = await createRecoveryPlan(selectedBackup, options);
    logger.info(`[Recovery] Recovery plan created with ${plan.steps.length} steps`);

    // Execute recovery plan
    const result = await executeRecoveryPlan(
      plan,
      { targetDatabase: options.targetDatabase, dryRun: options.dryRun },
      selectedBackup
    );

    logger.info(`[Recovery] Point-in-time recovery completed in ${Date.now() - startTime}ms`);

    return result;
  } catch (error) {
    logger.error('[Recovery] Point-in-time recovery failed:', error);

    return {
      success: false,
      restoredItems: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform emergency restore
 */
export async function performEmergencyRestore(options: EmergencyRestoreOptions): Promise<RestoreResult> {
  const startTime = Date.now();

  try {
    logger.warn('[Emergency Restore] Starting emergency restore procedure');

    let backupToRestore: BackupMetadata;

    if (options.backupId) {
      // Find specific backup
      backupToRestore = await findBackupById(options.backupId);
    } else {
      // Find latest backup
      const latestBackups = await findLatestBackups(1);
      if (latestBackups.length === 0) {
        throw new Error('No backups available for emergency restore');
      }
      backupToRestore = latestBackups[0];
    }

    logger.warn(`[Emergency Restore] Using backup: ${backupToRestore.id} from ${backupToRestore.timestamp.toISOString()}`);

    // Create emergency recovery plan
    const plan = await createEmergencyRecoveryPlan(backupToRestore, options);

    // Execute emergency recovery
    const result = await executeEmergencyRecovery(
      plan,
      { targetDatabase: options.targetDatabase, targetRedis: options.targetRedis, dryRun: false },
      backupToRestore
    );

    logger.warn(`[Emergency Restore] Emergency restore completed in ${Date.now() - startTime}ms`);

    return result;
  } catch (error) {
    logger.error('[Emergency Restore] Emergency restore failed:', error);

    return {
      success: false,
      restoredItems: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find backups before a specific time
 */
async function findBackupsBeforeTime(targetTime: Date, limit: number = 10): Promise<BackupMetadata[]> {
  // This would typically query a backup metadata database
  // For now, we'll scan S3 bucket for backup files

  const s3Client = new S3Client({
    region: process.env.BACKUP_S3_REGION || 'us-east-1',
    credentials: process.env.BACKUP_S3_ACCESS_KEY && process.env.BACKUP_S3_SECRET_KEY ? {
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
      secretAccessKey: process.env.BACKUP_S3_SECRET_KEY,
    } : undefined,
  });

  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) {
    throw new Error('BACKUP_S3_BUCKET not configured');
  }

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: 'database/', // Only database backups for PITR
  });

  const response = await s3Client.send(command);

  const backups: BackupMetadata[] = [];

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (obj.Key && obj.LastModified) {
        // Parse backup ID from key
        const keyParts = obj.Key.split('/');
        const fileName = keyParts[keyParts.length - 1];
        const backupId = fileName.replace('.sql', '');

        if (obj.LastModified <= targetTime) {
          backups.push({
            id: backupId,
            type: 'database',
            timestamp: obj.LastModified,
            status: 'completed',
            destination: `s3://${bucket}/${obj.Key}`,
            size: obj.Size,
            validated: true, // Assume validated if stored
          });
        }
      }
    }
  }

  // Sort by timestamp descending (most recent first)
  backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return backups.slice(0, limit);
}

/**
 * Find backup by ID
 */
async function findBackupById(backupId: string): Promise<BackupMetadata> {
  // This would query backup metadata
  // For now, construct from S3
  const s3Client = new S3Client({
    region: process.env.BACKUP_S3_REGION || 'us-east-1',
    credentials: process.env.BACKUP_S3_ACCESS_KEY && process.env.BACKUP_S3_SECRET_KEY ? {
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
      secretAccessKey: process.env.BACKUP_S3_SECRET_KEY,
    } : undefined,
  });

  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) {
    throw new Error('BACKUP_S3_BUCKET not configured');
  }

  // Try database backup first
  let key = `database/${backupId}.sql`;
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);

    return {
      id: backupId,
      type: 'database',
      timestamp: response.LastModified || new Date(),
      status: 'completed',
      destination: `s3://${bucket}/${key}`,
      size: response.ContentLength,
      validated: true,
    };
  } catch {
    // Try Redis backup
    key = `redis/${backupId}.rdb`;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);

    return {
      id: backupId,
      type: 'redis',
      timestamp: response.LastModified || new Date(),
      status: 'completed',
      destination: `s3://${bucket}/${key}`,
      size: response.ContentLength,
      validated: true,
    };
  }
}

/**
 * Find latest backups
 */
async function findLatestBackups(limit: number = 5): Promise<BackupMetadata[]> {
  const s3Client = new S3Client({
    region: process.env.BACKUP_S3_REGION || 'us-east-1',
    credentials: process.env.BACKUP_S3_ACCESS_KEY && process.env.BACKUP_S3_SECRET_KEY ? {
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
      secretAccessKey: process.env.BACKUP_S3_SECRET_KEY,
    } : undefined,
  });

  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) {
    throw new Error('BACKUP_S3_BUCKET not configured');
  }

  const command = new ListObjectsV2Command({
    Bucket: bucket,
  });

  const response = await s3Client.send(command);

  const backups: BackupMetadata[] = [];

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (obj.Key && obj.LastModified) {
        const keyParts = obj.Key.split('/');
        const fileName = keyParts[keyParts.length - 1];
        const backupId = fileName.replace(/\.(sql|rdb)$/, '');
        const type = obj.Key.includes('database') ? 'database' : 'redis';

        backups.push({
          id: backupId,
          type: type as 'database' | 'redis',
          timestamp: obj.LastModified,
          status: 'completed',
          destination: `s3://${bucket}/${obj.Key}`,
          size: obj.Size,
          validated: true,
        });
      }
    }
  }

  // Sort by timestamp descending
  backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return backups.slice(0, limit);
}

/**
 * Create recovery plan for point-in-time recovery
 */
async function createRecoveryPlan(backup: BackupMetadata, options: PointInTimeRecoveryOptions): Promise<RecoveryPlan> {
  const steps: RecoveryStep[] = [
    {
      id: 'pre_backup',
      description: 'Create backup of current state',
      type: 'backup',
      estimatedDuration: 300, // 5 minutes
      required: true,
    },
    {
      id: 'stop_services',
      description: 'Stop application services',
      type: 'stop_services',
      estimatedDuration: 30,
      required: true,
    },
    {
      id: 'restore_database',
      description: `Restore database from backup ${backup.id}`,
      type: 'restore_database',
      estimatedDuration: 600, // 10 minutes
      required: true,
    },
    {
      id: 'start_services',
      description: 'Start application services',
      type: 'start_services',
      estimatedDuration: 60,
      required: true,
    },
    {
      id: 'validate',
      description: 'Validate system integrity',
      type: 'validate',
      estimatedDuration: 120,
      required: true,
    },
  ];

  const warnings: string[] = [];
  if (backup.timestamp.getTime() < (Date.now() - 24 * 60 * 60 * 1000)) {
    warnings.push('Backup is older than 24 hours');
  }

  return {
    steps,
    estimatedDuration: steps.reduce((sum, step) => sum + step.estimatedDuration, 0),
    riskLevel: 'medium',
    warnings,
  };
}

/**
 * Create emergency recovery plan
 */
async function createEmergencyRecoveryPlan(backup: BackupMetadata, options: EmergencyRestoreOptions): Promise<RecoveryPlan> {
  const steps: RecoveryStep[] = [];

  if (options.backupData) {
    steps.push({
      id: 'emergency_backup',
      description: 'Create emergency backup of current state',
      type: 'backup',
      estimatedDuration: 180,
      required: true,
    });
  }

  steps.push(
    {
      id: 'stop_services',
      description: 'Stop all services immediately',
      type: 'stop_services',
      estimatedDuration: 15,
      required: true,
    },
    {
      id: 'restore_database',
      description: `Emergency restore database from ${backup.id}`,
      type: 'restore_database',
      estimatedDuration: 300,
      required: backup.type === 'database',
    },
    {
      id: 'restore_redis',
      description: `Emergency restore Redis from ${backup.id}`,
      type: 'restore_redis',
      estimatedDuration: 60,
      required: backup.type === 'redis',
    },
    {
      id: 'start_services',
      description: 'Start services after emergency restore',
      type: 'start_services',
      estimatedDuration: 30,
      required: true,
    }
  );

  return {
    steps,
    estimatedDuration: steps.reduce((sum, step) => sum + step.estimatedDuration, 0),
    riskLevel: 'high',
    warnings: [
      'Emergency restore may cause data loss',
      'System may be unstable after restore',
      'Manual validation required after restore',
    ],
  };
}

/**
 * Execute recovery plan
 */
async function executeRecoveryPlan(
  plan: RecoveryPlan,
  options: RecoveryExecutionOptions,
  backup: BackupMetadata
): Promise<RestoreResult> {
  const startTime = Date.now();
  let restoredItems = 0;

  for (const step of plan.steps) {
    if (!step.required) {
      logger.info(`[Recovery] Skipping optional step: ${step.id}`);
      continue;
    }

    logger.info(`[Recovery] Executing step: ${step.description}`);

    try {
      switch (step.type) {
        case 'backup':
          // Create backup of current state
          await executeCommand('pg_dump', [
            '--host', process.env.DB_HOST || 'localhost',
            '--username', process.env.DB_USER || 'postgres',
            '--dbname', process.env.DB_NAME || 'buildflow',
            '--file', `/tmp/emergency-backup-${Date.now()}.sql`,
          ], { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } });
          break;

        case 'stop_services':
          // This would typically stop the application services
          // For now, just log
          logger.warn('[Recovery] Services should be stopped manually');
          break;

        case 'restore_database':
          // Restore database (implementation in backup-impl.server.ts)
          {
            const { restoreDatabase } = await import('./backup-impl.server');
            const restoreResult = await restoreDatabase({
              backupId: backup.destination,
              targetDatabase: options.targetDatabase,
              dryRun: options.dryRun,
            });
            if (restoreResult.success) restoredItems++;
          }
          break;

        case 'restore_redis':
          {
            const { restoreRedis } = await import('./backup-impl.server');
            const restoreResult = await restoreRedis({
              backupId: backup.destination,
              targetRedis: options.targetRedis,
              dryRun: options.dryRun,
            });
            if (restoreResult.success) restoredItems++;
          }
          break;

        case 'start_services':
          // This would typically start the application services
          logger.info('[Recovery] Services should be started manually');
          break;

        case 'validate':
          // Basic validation
          await executeCommand('psql', [
            '--host', process.env.DB_HOST || 'localhost',
            '--username', process.env.DB_USER || 'postgres',
            '--dbname', options.targetDatabase || process.env.DB_NAME || 'buildflow',
            '--command', 'SELECT 1;',
          ], { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } });
          break;
      }

      logger.info(`[Recovery] Step completed: ${step.id}`);
    } catch (error) {
      logger.error(`[Recovery] Step failed: ${step.id}`, error);
      throw error;
    }
  }

  return {
    success: true,
    restoredItems,
    duration: Date.now() - startTime,
  };
}

/**
 * Execute emergency recovery
 */
async function executeEmergencyRecovery(
  plan: RecoveryPlan,
  options: RecoveryExecutionOptions,
  backup: BackupMetadata
): Promise<RestoreResult> {
  // Similar to executeRecoveryPlan but with emergency flags
  logger.warn('[Emergency Restore] Executing emergency recovery - this is high risk!');
  return executeRecoveryPlan(plan, options, backup);
}

/**
 * Execute shell command with promise
 */
function executeCommand(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}
