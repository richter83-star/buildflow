import { defaultBackupConfig, backupConfigSchema } from './backup.server';
import { initializeBackupScheduler, getBackupScheduler, shutdownBackupScheduler } from './backup-scheduler.server';
import { performIntegrityCheck, performSystemIntegrityCheck } from './backup-integrity.server';
import { performPointInTimeRecovery, performEmergencyRestore } from './backup-recovery.server';
import { logger } from './logger.server';

export class BackupService {
  private static instance: BackupService;
  private config = defaultBackupConfig;
  private initialized = false;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Initialize the backup service
   */
  async initialize(configOverrides: Partial<typeof defaultBackupConfig> = {}): Promise<void> {
    if (this.initialized) {
      throw new Error('Backup service already initialized');
    }

    try {
      // Validate and merge configuration
      const fullConfig = { ...defaultBackupConfig, ...configOverrides };
      this.config = backupConfigSchema.parse(fullConfig);

      logger.info('[Backup Service] Initializing with config:', {
        databaseEnabled: this.config.database.enabled,
        redisEnabled: this.config.redis.enabled,
        maxConcurrent: this.config.maxConcurrentBackups,
      });

      // Initialize scheduler
      const scheduler = initializeBackupScheduler(this.config);
      scheduler.start();

      this.initialized = true;
      logger.info('[Backup Service] Backup service initialized successfully');
    } catch (error) {
      logger.error('[Backup Service] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown the backup service
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    logger.info('[Backup Service] Shutting down backup service...');

    shutdownBackupScheduler();
    this.initialized = false;

    logger.info('[Backup Service] Backup service shutdown complete');
  }

  /**
   * Trigger manual database backup
   */
  async triggerDatabaseBackup(): Promise<any> {
    this.ensureInitialized();
    const scheduler = getBackupScheduler();
    if (!scheduler) throw new Error('Backup scheduler not available');

    return scheduler.triggerBackup('database');
  }

  /**
   * Trigger manual Redis backup
   */
  async triggerRedisBackup(): Promise<any> {
    this.ensureInitialized();
    const scheduler = getBackupScheduler();
    if (!scheduler) throw new Error('Backup scheduler not available');

    return scheduler.triggerBackup('redis');
  }

  /**
   * Trigger full system backup
   */
  async triggerFullBackup(): Promise<{ database: any; redis: any }> {
    this.ensureInitialized();

    logger.info('[Backup Service] Starting full system backup');

    const results = await Promise.allSettled([
      this.triggerDatabaseBackup(),
      this.triggerRedisBackup(),
    ]);

    const database = results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason };
    const redis = results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason };

    logger.info('[Backup Service] Full system backup completed');

    return { database, redis };
  }

  /**
   * Perform point-in-time recovery
   */
  async performPointInTimeRecovery(options: {
    targetTime: Date;
    targetDatabase?: string;
    dryRun?: boolean;
  }): Promise<any> {
    this.ensureInitialized();

    return performPointInTimeRecovery({
      targetTime: options.targetTime,
      targetDatabase: options.targetDatabase,
      dryRun: options.dryRun || false,
    });
  }

  /**
   * Perform emergency restore
   */
  async performEmergencyRestore(options: {
    backupId?: string;
    targetDatabase?: string;
    targetRedis?: string;
    force?: boolean;
    backupCurrentState?: boolean;
  }): Promise<any> {
    this.ensureInitialized();

    const backupCurrentState = options.backupCurrentState ?? true;

    return performEmergencyRestore({
      backupId: options.backupId,
      targetDatabase: options.targetDatabase,
      targetRedis: options.targetRedis,
      force: options.force || false,
      backupData: backupCurrentState,
    });
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupId: string): Promise<any> {
    this.ensureInitialized();

    // Find backup metadata (simplified - would need proper metadata storage)
    const scheduler = getBackupScheduler();
    if (!scheduler) throw new Error('Backup scheduler not available');

    const history = scheduler.getBackupHistory();
    const backup = history.find(b => b.id === backupId);

    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    return performIntegrityCheck(backup);
  }

  /**
   * Perform system integrity check
   */
  async performSystemIntegrityCheck(): Promise<any> {
    this.ensureInitialized();
    return performSystemIntegrityCheck();
  }

  /**
   * Get backup service status
   */
  getStatus() {
    if (!this.initialized) {
      return { initialized: false };
    }

    const scheduler = getBackupScheduler();
    const schedulerStatus = scheduler ? scheduler.getStatus() : null;

    return {
      initialized: true,
      config: {
        databaseEnabled: this.config.database.enabled,
        redisEnabled: this.config.redis.enabled,
        maxConcurrentBackups: this.config.maxConcurrentBackups,
      },
      scheduler: schedulerStatus,
    };
  }

  /**
   * Get backup history
   */
  getBackupHistory(type?: 'database' | 'redis') {
    const scheduler = getBackupScheduler();
    return scheduler ? scheduler.getBackupHistory(type) : [];
  }

  /**
   * Update backup configuration
   */
  async updateConfig(newConfig: Partial<typeof defaultBackupConfig>): Promise<void> {
    try {
      const fullConfig = { ...this.config, ...newConfig };
      this.config = backupConfigSchema.parse(fullConfig);

      // Restart scheduler with new config
      if (this.initialized) {
        shutdownBackupScheduler();
        const scheduler = initializeBackupScheduler(this.config);
        scheduler.start();
      }

      logger.info('[Backup Service] Configuration updated');
    } catch (error) {
      logger.error('[Backup Service] Failed to update configuration:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Backup service not initialized');
    }
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  backupService.initialize().catch(error => {
    logger.error('[Backup Service] Failed to auto-initialize:', error);
  });
}
