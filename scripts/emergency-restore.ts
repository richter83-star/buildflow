#!/usr/bin/env tsx

/**
 * Emergency Restore Script
 *
 * This script provides quick disaster recovery procedures for the AI automated monetization system.
 * Use this script when the system is in a critical state and needs immediate restoration.
 *
 * WARNING: This script performs destructive operations. Use with extreme caution.
 */

import { program } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { backupService } from '../app/utils/backup-service.server';
import { logger } from '../app/utils/logger.server';

async function initializeBackupService(): Promise<void> {
  try {
    await backupService.initialize();
  } catch (error) {
    if (error instanceof Error && error.message.includes('already initialized')) {
      return;
    }
    throw error;
  }
}

program
  .name('emergency-restore')
  .description('Emergency restore script for AI automated monetization system')
  .version('1.0.0');

program.hook('preAction', async () => {
  try {
    await initializeBackupService();
  } catch (error) {
    console.error('❌ Failed to initialize backup service:', error);
    process.exit(1);
  }
});

program
  .command('status')
  .description('Check current system and backup status')
  .action(async () => {
    try {
      console.log('🔍 Checking system status...\n');

      // Check backup service status
      const backupStatus = backupService.getStatus();
      console.log('📦 Backup Service Status:');
      console.log(`  Initialized: ${backupStatus.initialized ? '✅' : '❌'}`);
      if (backupStatus.initialized) {
        console.log(`  Database backups: ${backupStatus.config.databaseEnabled ? '✅' : '❌'}`);
        console.log(`  Redis backups: ${backupStatus.config.redisEnabled ? '✅' : '❌'}`);
        console.log(`  Max concurrent: ${backupStatus.config.maxConcurrentBackups}`);
      }

      // Check backup history
      const history = backupService.getBackupHistory();
      console.log(`\n📊 Backup History: ${history.length} total backups`);

      const recent = history.filter(b => b.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000));
      console.log(`  Last 24h: ${recent.length} backups`);

      const failed = history.filter(b => b.status === 'failed');
      console.log(`  Failed: ${failed.length} backups`);

      // Show last successful backups
      const dbBackups = history.filter(b => b.type === 'database' && b.status === 'completed');
      const redisBackups = history.filter(b => b.type === 'redis' && b.status === 'completed');

      if (dbBackups.length > 0) {
        const lastDb = dbBackups[0];
        console.log(`\n🗄️  Last Database Backup: ${lastDb.timestamp.toISOString()}`);
        console.log(`  Size: ${formatBytes(lastDb.size || 0)}`);
        console.log(`  Validated: ${lastDb.validated ? '✅' : '❌'}`);
      }

      if (redisBackups.length > 0) {
        const lastRedis = redisBackups[0];
        console.log(`\n🔴 Last Redis Backup: ${lastRedis.timestamp.toISOString()}`);
        console.log(`  Size: ${formatBytes(lastRedis.size || 0)}`);
        console.log(`  Validated: ${lastRedis.validated ? '✅' : '❌'}`);
      }

    } catch (error) {
      console.error('❌ Failed to check status:', error);
      process.exit(1);
    }
  });

program
  .command('restore <backupId>')
  .description('Perform emergency restore from specific backup')
  .option('-d, --database-only', 'Restore only database')
  .option('-r, --redis-only', 'Restore only Redis')
  .option('-f, --force', 'Force restore without safety checks')
  .option('--no-backup', 'Skip backing up current state')
  .action(async (backupId: string, options: any) => {
    try {
      console.log(`🚨 EMERGENCY RESTORE STARTED`);
      console.log(`Backup ID: ${backupId}`);
      console.log(`Force mode: ${options.force ? 'ENABLED' : 'DISABLED'}`);
      console.log(`Backup current state: ${options.backup ? 'YES' : 'NO'}`);
      console.log('');

      if (!options.force) {
        console.log('⚠️  SAFETY CHECKS:');
        console.log('  - This operation will overwrite existing data');
        console.log('  - Current data will be lost if --no-backup is used');
        console.log('  - System may be unavailable during restore');
        console.log('');

        // Prompt for confirmation
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        await new Promise((resolve) => {
          rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', (answer) => {
            rl.close();
            if (answer !== 'YES') {
              console.log('❌ Restore cancelled');
              process.exit(0);
            }
            resolve(void 0);
          });
        });
      }

      console.log('🔄 Starting emergency restore...\n');

      const targetDatabase = options.redisOnly ? undefined : process.env.DB_NAME;
      const targetRedis = options.databaseOnly ? undefined : process.env.REDIS_RDB_PATH;

      const result = await backupService.performEmergencyRestore({
        backupId,
        targetDatabase,
        targetRedis,
        force: options.force,
        backupCurrentState: options.backup,
      });

      if (result.success) {
        console.log('✅ Emergency restore completed successfully');
        console.log(`Restored items: ${result.restoredItems}`);
        console.log(`Duration: ${result.duration}ms`);
      } else {
        console.log('❌ Emergency restore failed');
        console.log(`Error: ${result.error}`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Emergency restore failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate <backupId>')
  .description('Validate backup integrity')
  .action(async (backupId: string) => {
    try {
      console.log(`🔍 Validating backup: ${backupId}\n`);

      const result = await backupService.validateBackup(backupId);

      if (result.passed) {
        console.log('✅ Backup validation passed');
      } else {
        console.log('❌ Backup validation failed');
      }

      console.log(`\n📊 Validation Results:`);
      console.log(`Total checks: ${result.summary.totalChecks}`);
      console.log(`Passed: ${result.summary.passedChecks}`);
      console.log(`Failed: ${result.summary.failedChecks}`);

      if (result.summary.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.summary.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      console.log(`\n📋 Detailed Checks:`);
      result.checks.forEach(check => {
        const icon = check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : '⚠️';
        console.log(`${icon} ${check.name}: ${check.description}`);
        if (check.details) {
          console.log(`    ${check.details}`);
        }
      });

    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('integrity')
  .description('Perform system-wide integrity check')
  .action(async () => {
    try {
      console.log('🔍 Performing system integrity check...\n');

      const result = await backupService.performSystemIntegrityCheck();

      if (result.passed) {
        console.log('✅ System integrity check passed');
      } else {
        console.log('❌ System integrity check failed');
      }

      console.log(`\n📊 Integrity Results:`);
      console.log(`Total checks: ${result.summary.totalChecks}`);
      console.log(`Passed: ${result.summary.passedChecks}`);
      console.log(`Failed: ${result.summary.failedChecks}`);

      if (result.summary.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.summary.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      console.log(`\n📋 Detailed Checks:`);
      result.checks.forEach(check => {
        const icon = check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : '⚠️';
        console.log(`${icon} ${check.name}: ${check.description}`);
        if (check.details) {
          console.log(`    ${check.details}`);
        }
      });

    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      process.exit(1);
    }
  });

program
  .command('backup [type]')
  .description('Trigger manual backup')
  .action(async (type?: string) => {
    try {
      console.log('📦 Starting manual backup...\n');

      let result;
      if (type === 'database') {
        result = await backupService.triggerDatabaseBackup();
      } else if (type === 'redis') {
        result = await backupService.triggerRedisBackup();
      } else {
        const fullResult = await backupService.triggerFullBackup();
        const databaseOk = logBackupResult('Database', fullResult.database);
        const redisOk = logBackupResult('Redis', fullResult.redis);
        if (!databaseOk || !redisOk) {
          process.exit(1);
        }
        return;
      }

      if (!logBackupResult(type, result)) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  });

// Utility functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function logBackupResult(label: string | undefined, result: any): boolean {
  const name = label ? label : 'Backup';
  if (result?.success) {
    console.log(`✅ ${name} backup completed successfully`);
    console.log(`Duration: ${result.metadata?.duration || 0}ms`);
    console.log(`Size: ${formatBytes(result.metadata?.size || 0)}`);
    console.log(`Validated: ${result.metadata?.validated ? '✅' : '❌'}`);
    return true;
  }

  console.log(`❌ ${name} backup failed`);
  const errorMessage = result?.error || result?.metadata?.error;
  if (errorMessage) {
    console.log(`Error: ${errorMessage}`);
  }
  return false;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
