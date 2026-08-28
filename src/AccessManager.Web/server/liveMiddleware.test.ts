import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { afterEach, expect, test, vi } from 'vitest';
import { loadSandboxInventory } from './liveMiddleware.ts';

const entitlementUser = {
  id: '11111111-1111-1111-1111-111111111111',
  user: {
    descriptor: 'aad.bGl2ZQ',
    displayName: 'Live Stakeholder',
    mailAddress: 'live.stakeholder@example.invalid',
    origin: 'aad',
  },
  accessLevel: { accountLicenseType: 'stakeholder', licenseDisplayName: 'Stakeholder' },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fixtureFetch(): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('_apis/projects')) {
      return jsonResponse({ value: [{ id: 'proj-1', name: 'Sandbox' }] });
    }
    if (url.includes('_apis/userentitlements')) {
      return jsonResponse({
        items: [entitlementUser],
        members: [],
        continuationToken: null,
        totalCount: 1,
      });
    }
    if (url.includes('_apis/graph/groups')) {
      return jsonResponse({ value: [{ descriptor: 'vssgp.admins', displayName: 'Project Collection Administrators' }] });
    }
    return jsonResponse({ title: 'unexpected' }, 404);
  }) as unknown as typeof fetch;
}

afterEach(() => {
  delete process.env.AZURE_DEVOPS_PAT;
  process.env.AZURE_DEVOPS_ORG = 'evanbeer';
});

test('fixture-backed live inventory maps 7.1 items into /api/live/users', async () => {
  process.env.AZURE_DEVOPS_PAT = 'fixture-pat';
  process.env.AZURE_DEVOPS_ORG = 'evanbeer';
  const inventory = await loadSandboxInventory(fixtureFetch());

  expect(inventory.status.connected).toBe(true);
  expect(inventory.status.writes).toBe(false);
  expect(inventory.users).toHaveLength(1);
  expect(inventory.users?.[0]).toMatchObject({
    displayName: 'Live Stakeholder',
    email: 'live.stakeholder@example.invalid',
    license: 'Stakeholder',
  });
  expect(inventory.overview?.totals.users).toBe(1);
  expect(inventory.overview?.totals.stakeholders).toBe(1);
  expect(inventory.projects).toHaveLength(1);
  expect(inventory.groups).toHaveLength(1);
});

test('members-only preview payloads still inventory users', async () => {
  process.env.AZURE_DEVOPS_PAT = 'fixture-pat';
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('_apis/userentitlements')) {
      return jsonResponse({ members: [entitlementUser], totalCount: 1 });
    }
    if (url.includes('_apis/projects')) {
      return jsonResponse({ value: [] });
    }
    return jsonResponse({ value: [] });
  }) as unknown as typeof fetch;

  const inventory = await loadSandboxInventory(fetchImpl);
  expect(inventory.users).toHaveLength(1);
  expect(inventory.overview?.totals.users).toBe(1);
});

test('value-only preview payloads still inventory users', async () => {
  process.env.AZURE_DEVOPS_PAT = 'fixture-pat';
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('_apis/userentitlements')) {
      return jsonResponse({ value: [entitlementUser] });
    }
    if (url.includes('_apis/projects')) {
      return jsonResponse({ value: [] });
    }
    return jsonResponse({ value: [] });
  }) as unknown as typeof fetch;

  const inventory = await loadSandboxInventory(fetchImpl);
  expect(inventory.users).toHaveLength(1);
});

test('live proxy rejects non-GET methods without writing to Azure DevOps', async () => {
  const { createLiveMiddleware } = await import('./liveMiddleware.ts');
  const middleware = createLiveMiddleware();
  const req = new IncomingMessage(new Socket());
  req.method = 'POST';
  req.url = '/api/live/users';
  const chunks: Buffer[] = [];
  const res = new ServerResponse(req);
  res.end = ((chunk?: unknown) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return res;
  }) as ServerResponse['end'];

  await middleware(req, res, () => undefined);
  expect(res.statusCode).toBe(405);
  expect(Buffer.concat(chunks).toString()).toContain('"writes":false');
});
