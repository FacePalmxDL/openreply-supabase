import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getMetaSettings: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  unauthorized: () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: mocks.from }),
}));

vi.mock('@/lib/settings', () => ({
  getMetaSettings: mocks.getMetaSettings,
  saveMetaSettings: vi.fn(),
}));

vi.mock('@/lib/crypto', () => ({ randomToken: () => 'verify-token' }));
vi.mock('@/lib/env', () => ({
  getAppUrl: () => 'https://example.test',
  getEnv: () => ({}),
}));

import { GET, POST } from './route';

function queryResult(data: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe('GET /api/setup authorization', () => {
  beforeEach(() => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'member@example.test' });
    mocks.getMetaSettings.mockResolvedValue(null);
    mocks.from.mockImplementation((table: string) =>
      table === 'profiles' ? queryResult({ role: 'member' }) : queryResult(null)
    );
  });

  it('rejects an authenticated member who is not an instance administrator', async () => {
    const response = await GET(new Request('https://example.test/api/setup'));

    expect(response.status).toBe(403);
    expect(mocks.getMetaSettings).not.toHaveBeenCalled();
  });

  it('allows the instance owner to read setup configuration', async () => {
    mocks.from.mockImplementation((table: string) =>
      table === 'profiles' ? queryResult({ role: 'owner' }) : queryResult(null)
    );

    const response = await GET(new Request('https://example.test/api/setup'));

    expect(response.status).toBe(200);
  });

  it('allows an instance administrator to read setup configuration', async () => {
    mocks.from.mockImplementation((table: string) =>
      table === 'profiles' ? queryResult({ role: 'admin' }) : queryResult(null)
    );

    const response = await GET(new Request('https://example.test/api/setup'));

    expect(response.status).toBe(200);
  });

  it('prevents an authenticated member from changing instance credentials', async () => {
    const response = await POST(
      new Request('https://example.test/api/setup', {
        method: 'POST',
        body: JSON.stringify({
          metaAppId: '12345',
          metaAppSecret: 'a'.repeat(32),
        }),
      })
    );

    expect(response.status).toBe(403);
  });
});
