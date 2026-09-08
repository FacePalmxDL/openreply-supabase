import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260908000001_instance_roles.sql'
);

describe('instance role migration', () => {
  it('bootstraps an owner and prevents members from promoting themselves', () => {
    expect(existsSync(migrationPath), 'instance role migration is missing').toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toMatch(/ADD COLUMN role/i);
    expect(sql).toMatch(/SET role = 'owner'/i);
    expect(sql).toMatch(/NEW\.role\s*=\s*OLD\.role/i);
    expect(sql).toMatch(/CREATE POLICY "Users can update own profile"/i);
  });
});
