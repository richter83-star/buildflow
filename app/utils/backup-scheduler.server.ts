import * as cron from 'node-cron';
import { createDatabaseBackup, createRedisBackup, validateBackup } from './backup-impl.server';
import type { BackupConfig, BackupMetadata, BackupResult } from './backup.server';
import { logger } from './logger.server';

class BackupScheduler {
  private config: BackupConfig;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private runningBackups: Set<string> = new Set();
  private backupHistory: BackupMetadata[] = [];

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Start the backup scheduler
   */
  start(): void {
    logger.info('[Backup Scheduler] Starting backup scheduler...');

    // Schedule database backups
    if (this.config.database.enabled) {
      this.scheduleBackup('database', this.config.database.schedule, async () => {
        await this.runDatabaseBackup();
      });
    }

    // Schedule Redis backups
    if (this.config.redis.enabled) {
      this.scheduleBackup('redis', this.config.redis.schedule, async () => {
        await this.runRedisBackup();
      });
    }

    logger.info('[Backup Scheduler] Backup scheduler started');
  }

  /**
   * Stop the backup scheduler
   */
  stop(): void {
    logger.info('[Backup Scheduler] Stopping backup scheduler...');

    for (const task of this.scheduledTasks.values()) {
      task.stop();
    }
    this.scheduledTasks.clear();
    this.runningBackups.clear();

    logger.info('[Backup Scheduler] Backup scheduler stopped');
  }

  /**
   * Schedule a backup task
   */
  private scheduleBackup(name: string, schedule: string, task: () => Promise<void>): void {
    try {
      const cronTask = cron.schedule(schedule, async () => {
        if (this.runningBackups.has(name)) {
          logger.warn(`[Backup Scheduler] ${name} backup already running, skipping`);
          return;
        }

        this.runningBackups.add(name);
        try {
          await task();
        } catch (error) {
          logger.error(`[Backup Scheduler] ${name} backup failed:`, error);
        } finally {
          this.runningBackups.delete(name);
        }
      });

      this.scheduledTasks.set(name, cronTask);
      logger.info(`[Backup Scheduler] Scheduled ${name} backup with cron: ${schedule}`);
    } catch (error) {
      logger.error(`[Backup Scheduler] Failed to schedule ${name} backup:`, error);
    }
  }

  /**
   * Run database backup
   */
  private async runDatabaseBackup(): Promise<BackupResult> {
    logger.info('[Backup Scheduler] Starting database backup...');

    const startTime = Date.now();
    const result = await createDatabaseBackup(this.config.database);

    result.metadata.duration = Date.now() - startTime;
    this.backupHistory.push(result.metadata);

    // Validate backup if successful
    if (result.success) {
      const validation = await validateBackup(result.metadata);
      if (!validation.valid) {
        logger.error('[Backup Scheduler] Database backup validation failed:', validation.error);
        result.metadata.validated = false;
        result.metadata.error = validation.error;
      } else {
        logger.info('[Backup Scheduler] Database backup validated successfully');
      }
    }

    // Clean up old backups
    await this.cleanupOldBackups('database');

    // Send notification
    if (this.config.notificationEnabled) {
      await this.sendNotification(result);
    }

    logger.info(`[Backup Scheduler] Database backup completed in ${result.metadata.duration}ms`);
    return result;
  }

  /**
   * Run Redis backup
   */
  private async runRedisBackup(): Promise<BackupResult> {
    logger.info('[Backup Scheduler] Starting Redis backup...');

    const startTime = Date.now();
    const result = await createRedisBackup(this.config.redis);

    result.metadata.duration = Date.now() - startTime;
    this.backupHistory.push(result.metadata);

    // Validate backup if successful
    if (result.success) {
      const validation = await validateBackup(result.metadata);
      if (!validation.valid) {
        logger.error('[Backup Scheduler] Redis backup validation failed:', validation.error);
        result.metadata.validated = false;
        result.metadata.error = validation.error;
      } else {
        logger.info('[Backup Scheduler] Redis backup validated successfully');
      }
    }

    // Clean up old backups
    await this.cleanupOldBackups('redis');

    // Send notification
    if (this.config.notificationEnabled) {
      await this.sendNotification(result);
    }

    logger.info(`[Backup Scheduler] Redis backup completed in ${result.metadata.duration}ms`);
    return result;
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(type: 'database' | 'redis'): Promise<void> {
    const retentionDays = type === 'database' ? this.config.database.retention : this.config.redis.retention;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = this.backupHistory.filter(
      backup => backup.type === type && backup.timestamp < cutoffDate
    );

    for (const backup of oldBackups) {
      try {
        // Remove from history
        const index = this.backupHistory.indexOf(backup);
        if (index > -1) {
          this.backupHistory.splice(index, 1);
        }

        // TODO: Delete actual backup files from S3/local storage
        // This would require implementing delete functions

        logger.info(`[Backup Scheduler] Cleaned up old ${type} backup: ${backup.id}`);
      } catch (error) {
        logger.error(`[Backup Scheduler] Failed to cleanup backup ${backup.id}:`, error);
      }
    }
  }

  /**
   * Send notification about backup result
   */
  private async sendNotification(result: BackupResult): Promise<void> {
    if (!this.config.notificationWebhook) return;

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        type: 'backup_notification',
        backup: {
          id: result.metadata.id,
          type: result.metadata.type,
          status: result.metadata.status,
          duration: result.metadata.duration,
          size: result.metadata.size,
          validated: result.metadata.validated,
          error: result.metadata.error,
        },
      };

      // Send webhook notification
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error('[Backup Scheduler] Failed to send notification:', response.statusText);
      }
    } catch (error) {
      logger.error('[Backup Scheduler] Failed to send notification:', error);
    }
  }

  /**
   * Get backup history
   */
  getBackupHistory(type?: 'database' | 'redis'): BackupMetadata[] {
    if (type) {
      return this.backupHistory.filter(backup => backup.type === type);
    }
    return [...this.backupHistory];
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.scheduledTasks.size > 0,
      activeBackups: Array.from(this.runningBackups),
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      totalBackups: this.backupHistory.length,
    };
  }

  /**
   * Manually trigger a backup
   */
  async triggerBackup(type: 'database' | 'redis'): Promise<BackupResult> {
    if (this.runningBackups.has(type)) {
      throw new Error(`${type} backup already running`);
    }

    this.runningBackups.add(type);
    try {
      if (type === 'database') {
        return await this.runDatabaseBackup();
      } else {
        return await this.runRedisBackup();
      }
    } finally {
      this.runningBackups.delete(type);
    }
  }
}

// Global scheduler instance
let globalScheduler: BackupScheduler | null = null;

/**
 * Initialize backup scheduler
 */
export function initializeBackupScheduler(config: BackupConfig): BackupScheduler {
  if (globalScheduler) {
    throw new Error('Backup scheduler already initialized');
  }

  globalScheduler = new BackupScheduler(config);
  return globalScheduler;
}

/**
 * Get backup scheduler instance
 */
export function getBackupScheduler(): BackupScheduler | null {
  return globalScheduler;
}

/**
 * Shutdown backup scheduler
 */
export function shutdownBackupScheduler(): void {
  if (globalScheduler) {
    globalScheduler.stop();
    globalScheduler = null;
  }
}
