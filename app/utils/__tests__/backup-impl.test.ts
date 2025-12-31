import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  GetObjectCommand: class {},
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    async done() {
      return undefined;
    }
  },
}));

let restoreDatabase: typeof import('../backup-impl.server').restoreDatabase;
let restoreRedis: typeof import('../backup-impl.server').restoreRedis;

beforeAll(async () => {
  const mod = await import('../backup-impl.server');
  restoreDatabase = mod.restoreDatabase;
  restoreRedis = mod.restoreRedis;
});

describe('restoreDatabase', () => {
  it('returns success during dry runs', async () => {
    const result = await restoreDatabase({
      backupId: 's3://bucket/backup.sql',
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.restoredItems).toBe(0);
  });
});

describe('restoreRedis', () => {
  it('returns success during dry runs', async () => {
    const result = await restoreRedis({
      backupId: 's3://bucket/backup.rdb',
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.restoredItems).toBe(0);
  });
});
