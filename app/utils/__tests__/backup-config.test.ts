import { describe, expect, it } from 'vitest';
import { backupConfigSchema, defaultBackupConfig } from '../backup.server';

describe('backupConfigSchema', () => {
  it('accepts the default backup config', () => {
    expect(() => backupConfigSchema.parse(defaultBackupConfig)).not.toThrow();
  });

  it('rejects invalid retention values', () => {
    const badConfig = {
      ...defaultBackupConfig,
      database: {
        ...defaultBackupConfig.database,
        retention: 0,
      },
    };

    expect(() => backupConfigSchema.parse(badConfig)).toThrow();
  });
});
