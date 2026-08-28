import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  adoGetJson,
  buildAdoUrl,
  entitlementCollection,
  hasSandboxPat,
  mapEntitlementToUser,
  mapGroup,
  mapProject,
  resolveSandboxOrg,
  type EntitlementCollection,
  type GraphGroup,
  type ProjectValue,
  type SandboxStatus,
} from './adoLive.ts';

type Next = (error?: unknown) => void;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function pathname(req: IncomingMessage): string {
  return (req.url ?? '').split('?')[0] ?? '';
}

type SandboxInventory = Awaited<ReturnType<typeof readSandboxInventory>>;

const INVENTORY_TTL_MS = 10_000;
let inFlightInventory: Promise<SandboxInventory> | null = null;
let cachedInventory: { at: number; value: SandboxInventory } | null = null;

export async function loadSandboxInventory(fetchImpl: typeof fetch = fetch) {
  if (fetchImpl !== fetch) {
    return readSandboxInventory(fetchImpl);
  }
  if (cachedInventory && Date.now() - cachedInventory.at < INVENTORY_TTL_MS) {
    return cachedInventory.value;
  }
  if (!inFlightInventory) {
    inFlightInventory = readSandboxInventory(fetch).finally(() => {
      inFlightInventory = null;
    });
  }
  const value = await inFlightInventory;
  cachedInventory = { at: Date.now(), value };
  return value;
}

async function readSandboxInventory(fetchImpl: typeof fetch) {
  const organization = resolveSandboxOrg();
  const pat = process.env.AZURE_DEVOPS_PAT?.trim() ?? '';
  if (!pat) {
    const status: SandboxStatus = {
      connected: false,
      organization,
      reason: 'missing_pat',
      writes: false,
    };
    return { status };
  }

  const projectsUrl = buildAdoUrl('core', organization, '_apis/projects', {
    'api-version': '7.1',
    $top: '100',
  });
  const entitlementsUrl = buildAdoUrl('entitlements', organization, '_apis/userentitlements', {
    'api-version': '7.1',
  });
  const groupsUrl = buildAdoUrl('graph', organization, '_apis/graph/groups', {
    'api-version': '7.1-preview.1',
  });

  const [projects, entitlements, groups] = await Promise.all([
    adoGetJson<{ value?: ProjectValue[] }>(projectsUrl, pat, fetchImpl),
    adoGetJson<EntitlementCollection>(entitlementsUrl, pat, fetchImpl),
    adoGetJson<{ value?: GraphGroup[] }>(groupsUrl, pat, fetchImpl),
  ]);

  if (!projects.ok || !entitlements.ok || !groups.ok) {
    const statusCode = [projects, entitlements, groups].find((result) => !result.ok);
    const unauthorized = statusCode && 'status' in statusCode && statusCode.status === 401;
    const status: SandboxStatus = {
      connected: false,
      organization,
      reason: unauthorized ? 'unauthorized' : 'unreachable',
      writes: false,
    };
    return { status };
  }

  const users = entitlementCollection(entitlements.data).map(mapEntitlementToUser);
  const projectSummaries = (projects.data.value ?? []).map(mapProject);
  const groupSummaries = (groups.data.value ?? []).map(mapGroup);
  const stakeholders = users.filter((user) => user.license === 'Stakeholder').length;
  const basic = users.filter((user) => user.license === 'Basic').length;
  const now = new Date().toISOString();

  return {
    status: {
      connected: true,
      organization,
      reason: 'ok',
      writes: false,
    } satisfies SandboxStatus,
    overview: {
      organization: {
        id: `org:${organization}`,
        name: organization,
        generation: 1,
        syncedAtUtc: now,
        coverage: 'Partial' as const,
      },
      totals: {
        users: users.length,
        groups: groupSummaries.length,
        projects: projectSummaries.length,
        teams: 0,
        basic,
        stakeholders,
        freeBasicUsed: Math.min(basic, 5),
        freeBasicIncluded: 5,
      },
      findings: [
        {
          id: 'finding:live-read-only',
          severity: 'info' as const,
          title: 'Sandbox inventory is read-only',
          count: users.length,
          description:
            'evanbeer is connected for membership and license reads only. No users are created and no ACEs are written.',
          href: '/users',
        },
        {
          id: 'finding:live-no-ace',
          severity: 'medium' as const,
          title: 'Live permission bits are not evaluated yet',
          count: 1,
          description: 'Access hierarchy, matrix, and dry-run plans stay empty until ACE evaluation is added.',
          href: '/users',
        },
      ],
      readOnly: true as const,
    },
    users,
    groups: groupSummaries,
    projects: projectSummaries,
  };
}

export function createLiveMiddleware() {
  return async function liveMiddleware(req: IncomingMessage, res: ServerResponse, next: Next) {
    const path = pathname(req);
    if (!path.startsWith('/api/live')) {
      next();
      return;
    }
    if (req.method !== 'GET') {
      sendJson(res, 405, { title: 'Method not allowed', writes: false });
      return;
    }

    try {
      if (path === '/api/live/status' && !hasSandboxPat()) {
        sendJson(res, 200, {
          connected: false,
          organization: resolveSandboxOrg(),
          reason: 'missing_pat',
          writes: false,
          configured: false,
        });
        return;
      }
      const inventory = await loadSandboxInventory();
      if (path === '/api/live/status') {
        sendJson(res, 200, {
          ...inventory.status,
          configured: hasSandboxPat(),
        });
        return;
      }
      if (!inventory.status.connected) {
        sendJson(res, 503, inventory.status);
        return;
      }
      if (path === '/api/live/overview') {
        sendJson(res, 200, inventory.overview);
        return;
      }
      if (path === '/api/live/users') {
        sendJson(res, 200, inventory.users);
        return;
      }
      if (path.startsWith('/api/live/users/')) {
        const id = decodeURIComponent(path.slice('/api/live/users/'.length));
        const user = inventory.users?.find((entry) => entry.id === id);
        if (!user) {
          sendJson(res, 404, { title: 'User not found' });
          return;
        }
        sendJson(res, 200, {
          ...user,
          findings: [],
          recommendations: [],
          access: [
            {
              id: `${user.id}-org`,
              label: inventory.overview?.organization.name ?? 'evanbeer',
              kind: 'organization',
              source: 'UNKNOWN',
              explanation:
                'Live sandbox inventory does not evaluate ACEs yet. Membership and license are shown from evanbeer.',
            },
          ],
        });
        return;
      }
      if (path === '/api/live/groups') {
        sendJson(res, 200, inventory.groups);
        return;
      }
      if (path.startsWith('/api/live/groups/')) {
        const id = decodeURIComponent(path.slice('/api/live/groups/'.length));
        const group = inventory.groups?.find((entry) => entry.id === id);
        if (!group) {
          sendJson(res, 404, { title: 'Group not found' });
          return;
        }
        sendJson(res, 200, {
          ...group,
          members: [],
          nestedGroups: [],
          teams: [],
          projects: [],
          access: [],
        });
        return;
      }
      if (path === '/api/live/projects') {
        sendJson(res, 200, inventory.projects);
        return;
      }
      if (path.startsWith('/api/live/projects/')) {
        const id = decodeURIComponent(path.slice('/api/live/projects/'.length));
        const project = inventory.projects?.find((entry) => entry.id === id);
        if (!project) {
          sendJson(res, 404, { title: 'Project not found' });
          return;
        }
        sendJson(res, 200, {
          ...project,
          teams: [],
          groups: [],
          users: [],
          repositories: [],
          pipelines: [],
          environments: [],
          serviceConnections: [],
          assignments: [],
        });
        return;
      }
      sendJson(res, 404, { title: 'Not found' });
    } catch (error) {
      const reason = error instanceof Error && error.message === 'invalid_org' ? 'invalid_org' : 'unreachable';
      sendJson(res, 500, {
        connected: false,
        organization: 'evanbeer',
        reason,
        writes: false,
      });
    }
  };
}
