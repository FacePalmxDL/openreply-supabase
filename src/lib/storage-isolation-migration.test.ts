import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260908000002_storage_isolation.sql'
);

describe('card image storage isolation migration', () => {
  it('limits uploads and deletes to the authenticated user folder', () => {
    expect(existsSync(migrationPath), 'storage isolation migration is missing').toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, 'utf8');
    const ownershipCheck = /\(storage\.foldername\(name\)\)\[1\]\s*=\s*auth\.uid\(\)::text/gi;

    expect(sql.match(ownershipCheck)).toHaveLength(2);
    expect(sql).toContain('FOR INSERT TO authenticated');
    expect(sql).toContain('FOR DELETE TO authenticated');
  });
});
