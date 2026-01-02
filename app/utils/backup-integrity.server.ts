import type { BackupMetadata, ValidationResult } from "./backup.server";
import { validateBackup } from "./backup-impl.server";

export async function performIntegrityCheck(
  backup: BackupMetadata
): Promise<ValidationResult> {
  return validateBackup(backup);
}

export async function performSystemIntegrityCheck(): Promise<{
  ok: boolean;
  checkedAt: string;
  notes: string[];
}> {
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    notes: [],
  };
}
