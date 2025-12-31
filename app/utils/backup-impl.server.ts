import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';
import type { BackupConfig, BackupResult, BackupMetadata, ValidationResult, RestoreOptions, RestoreResult } from './backup.server';

// S3 client for backups
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      credentials: process.env.BACKUP_S3_ACCESS_KEY && process.env.BACKUP_S3_SECRET_KEY ? {
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
        secretAccessKey: process.env.BACKUP_S3_SECRET_KEY,
      } : undefined,
    });
  }
  return s3Client;
}

/**
 * Execute pg_dump to create database backup
 */
export async function createDatabaseBackup(config: BackupConfig['database']): Promise<BackupResult> {
  const backupId = `db-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date();

  const metadata: BackupMetadata = {
    id: backupId,
    type: 'database',
    timestamp,
    status: 'running',
    destination: config.destination === 's3' ? `s3://${config.s3Bucket}/${config.s3Prefix}${backupId}.sql` : path.join(config.localPath || '/tmp/backups', `${backupId}.sql`),
    validated: false,
  };

  try {
    // Create temporary file for backup
    const tempFile = path.join('/tmp', `${backupId}.sql`);
    const dumpArgs = [
      '--host', process.env.DB_HOST || 'localhost',
      '--port', process.env.DB_PORT || '5432',
      '--username', process.env.DB_USER || 'postgres',
      '--dbname', process.env.DB_NAME || 'buildflow',
      '--no-password',
      '--format', 'plain',
      '--compress', config.compression ? '9' : '0',
      '--file', tempFile,
    ];

    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

    await executeCommand('pg_dump', dumpArgs, { env });

    // Calculate checksum and size
    const fileContent = await fs.readFile(tempFile);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    const size = fileContent.length;

    metadata.size = size;
    metadata.checksum = checksum;

    // Upload to destination
    if (config.destination === 's3') {
      await uploadToS3(tempFile, `${config.s3Prefix}${backupId}.sql`, config.s3Bucket!);
    } else {
      const destPath = path.join(config.localPath || '/tmp/backups', `${backupId}.sql`);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(tempFile, destPath);
    }

    // Clean up temp file
    await fs.unlink(tempFile);

    metadata.status = 'completed';
    metadata.validated = true;

    return { success: true, metadata };
  } catch (error) {
    metadata.status = 'failed';
    metadata.error = error instanceof Error ? error.message : 'Unknown error';

    return { success: false, metadata, error: metadata.error };
  }
}

/**
 * Create Redis backup using BGSAVE or copy RDB file
 */
export async function createRedisBackup(config: BackupConfig['redis']): Promise<BackupResult> {
  const backupId = `redis-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date();

  const metadata: BackupMetadata = {
    id: backupId,
    type: 'redis',
    timestamp,
    status: 'running',
    destination: config.destination === 's3' ? `s3://${config.s3Bucket}/${config.s3Prefix}${backupId}.rdb` : path.join(config.localPath || '/tmp/backups', `${backupId}.rdb`),
    validated: false,
  };

  try {
    let rdbPath = config.rdbPath || '/var/lib/redis/dump.rdb';

    // Check if RDB file exists, if not trigger BGSAVE
    try {
      await fs.access(rdbPath);
    } catch {
      // Trigger BGSAVE via Redis CLI
      await executeCommand('redis-cli', ['BGSAVE']);
      // Wait for BGSAVE to complete (this is a simple wait, in production you'd monitor for completion)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Copy RDB file to temp location
    const tempFile = path.join('/tmp', `${backupId}.rdb`);
    await fs.copyFile(rdbPath, tempFile);

    // Calculate checksum and size
    const fileContent = await fs.readFile(tempFile);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    const size = fileContent.length;

    metadata.size = size;
    metadata.checksum = checksum;

    // Upload to destination
    if (config.destination === 's3') {
      await uploadToS3(tempFile, `${config.s3Prefix}${backupId}.rdb`, config.s3Bucket!);
    } else {
      const destPath = path.join(config.localPath || '/tmp/backups', `${backupId}.rdb`);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(tempFile, destPath);
    }

    // Clean up temp file
    await fs.unlink(tempFile);

    metadata.status = 'completed';
    metadata.validated = true;

    return { success: true, metadata };
  } catch (error) {
    metadata.status = 'failed';
    metadata.error = error instanceof Error ? error.message : 'Unknown error';

    return { success: false, metadata, error: metadata.error };
  }
}

/**
 * Validate backup integrity
 */
export async function validateBackup(metadata: BackupMetadata): Promise<ValidationResult> {
  try {
    let fileContent: Buffer;

    if (metadata.destination.startsWith('s3://')) {
      // Download from S3
      const s3Url = metadata.destination.replace('s3://', '');
      const [bucket, ...keyParts] = s3Url.split('/');
      const key = keyParts.join('/');

      const command = getS3Client();
      const response = await command.send(new (await import('@aws-sdk/client-s3')).GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      if (!response.Body) {
        throw new Error('Failed to download backup from S3');
      }

      fileContent = Buffer.from(await response.Body.transformToByteArray());
    } else {
      // Read from local file
      fileContent = await fs.readFile(metadata.destination);
    }

    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    const size = fileContent.length;

    const isValid = checksum === metadata.checksum && size === metadata.size;

    return {
      valid: isValid,
      checksum,
      size,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore database from backup
 */
export async function restoreDatabase(options: RestoreOptions): Promise<RestoreResult> {
  const startTime = Date.now();

  try {
    if (options.dryRun) {
      return {
        success: true,
        restoredItems: 0,
        duration: Date.now() - startTime,
      };
    }

    // Download backup file
    const tempFile = path.join('/tmp', `restore-${Date.now()}.sql`);
    let backupPath = options.backupId;

    if (backupPath.startsWith('s3://')) {
      // Download from S3
      const s3Url = backupPath.replace('s3://', '');
      const [bucket, ...keyParts] = s3Url.split('/');
      const key = keyParts.join('/');

      const command = getS3Client();
      const response = await command.send(new (await import('@aws-sdk/client-s3')).GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      if (!response.Body) {
        throw new Error('Failed to download backup from S3');
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray());
      await fs.writeFile(tempFile, buffer);
      backupPath = tempFile;
    }

    // Restore database
    const restoreArgs = [
      '--host', process.env.DB_HOST || 'localhost',
      '--port', process.env.DB_PORT || '5432',
      '--username', process.env.DB_USER || 'postgres',
      '--dbname', options.targetDatabase || process.env.DB_NAME || 'buildflow',
      '--no-password',
      '--file', backupPath,
    ];

    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };
    await executeCommand('psql', restoreArgs, { env });

    // Clean up temp file if downloaded
    if (backupPath === tempFile) {
      await fs.unlink(tempFile);
    }

    return {
      success: true,
      restoredItems: 1, // Simplified count
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      restoredItems: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore Redis from backup
 */
export async function restoreRedis(options: RestoreOptions): Promise<RestoreResult> {
  const startTime = Date.now();

  try {
    if (options.dryRun) {
      return {
        success: true,
        restoredItems: 0,
        duration: Date.now() - startTime,
      };
    }

    const tempFile = path.join('/tmp', `restore-redis-${Date.now()}.rdb`);
    let backupPath = options.backupId;

    if (backupPath.startsWith('s3://')) {
      const s3Url = backupPath.replace('s3://', '');
      const [bucket, ...keyParts] = s3Url.split('/');
      const key = keyParts.join('/');

      const command = getS3Client();
      const response = await command.send(new (await import('@aws-sdk/client-s3')).GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      if (!response.Body) {
        throw new Error('Failed to download Redis backup from S3');
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray());
      await fs.writeFile(tempFile, buffer);
      backupPath = tempFile;
    }

    const defaultRdbPath = process.env.REDIS_RDB_PATH || '/var/lib/redis/dump.rdb';
    const looksLikePath = options.targetRedis?.includes('/') || options.targetRedis?.includes('\\') || options.targetRedis?.endsWith('.rdb');
    const targetPath = looksLikePath ? options.targetRedis! : defaultRdbPath;

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(backupPath, targetPath);

    if (backupPath === tempFile) {
      await fs.unlink(tempFile);
    }

    return {
      success: true,
      restoredItems: 1,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      restoredItems: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload file to S3
 */
async function uploadToS3(filePath: string, key: string, bucket: string): Promise<void> {
  const fileStream = await fs.readFile(filePath);

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
    },
  });

  await upload.done();
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
