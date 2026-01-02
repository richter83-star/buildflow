import { z } from "zod";

const backupTargetSchema = z.object({
  enabled: z.boolean(),
  schedule: z.string().min(1),
  retention: z.number().int().min(1),
  destination: z.enum(["s3", "local"]),
  s3Bucket: z.string().optional(),
  s3Prefix: z.string(),
  localPath: z.string().optional(),
  compression: z.boolean().optional(),
  rdbPath: z.string().optional(),
});

export const backupConfigSchema = z.object({
  database: backupTargetSchema,
  redis: backupTargetSchema,
  maxConcurrentBackups: z.number().int().min(1),
  notificationEnabled: z.boolean(),
  notificationWebhook: z.string().url().optional(),
});

export type BackupConfig = z.infer<typeof backupConfigSchema>;

export type BackupType = "database" | "redis";
export type BackupStatus = "running" | "completed" | "failed";

export interface BackupMetadata {
  id: string;
  type: BackupType;
  timestamp: Date;
  status: BackupStatus;
  destination: string;
  validated: boolean;
  size?: number;
  duration?: number;
  checksum?: string;
  error?: string;
}

export interface BackupResult {
  success: boolean;
  metadata: BackupMetadata;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  checksum?: string;
  size?: number;
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  targetRedis?: string;
  dryRun: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredItems: number;
  duration: number;
  error?: string;
}

export const defaultBackupConfig: BackupConfig = {
  database: {
    enabled: true,
    schedule: "0 2 * * *",
    retention: 7,
    destination: "local",
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    s3Prefix: "database/",
    localPath: process.env.BACKUP_LOCAL_PATH || "/tmp/backups",
    compression: true,
  },
  redis: {
    enabled: true,
    schedule: "0 3 * * *",
    retention: 7,
    destination: "local",
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    s3Prefix: "redis/",
    localPath: process.env.BACKUP_LOCAL_PATH || "/tmp/backups",
    rdbPath: process.env.REDIS_RDB_PATH,
  },
  maxConcurrentBackups: 2,
  notificationEnabled: false,
  notificationWebhook: process.env.BACKUP_NOTIFICATION_WEBHOOK,
};
