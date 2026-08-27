export const SANDBOX_ORG_DEFAULT = 'evanbeer';

export type SandboxStatus = {
  connected: boolean;
  organization: string;
  reason: 'ok' | 'missing_pat' | 'unauthorized' | 'unreachable' | 'invalid_org';
  writes: false;
};

export type EntitlementMember = {
  id?: string;
  user?: {
    descriptor?: string;
    displayName?: string;
    mailAddress?: string;
    principalName?: string;
    origin?: string;
  };
  accessLevel?: {
    accountLicenseType?: string;
    licenseDisplayName?: string;
  };
};

export type ProjectValue = {
  id?: string;
  name?: string;
};

export type GraphGroup = {
  descriptor?: string;
  displayName?: string;
  principalName?: string;
  origin?: string;
  originId?: string;
};

export function resolveSandboxOrg(raw = process.env.AZURE_DEVOPS_ORG ?? SANDBOX_ORG_DEFAULT): string {
  if (!/^[A-Za-z0-9-]+$/.test(raw)) {
    throw new Error('invalid_org');
  }
  return raw;
}

export function hasSandboxPat(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.AZURE_DEVOPS_PAT?.trim());
}

export function mapLicense(accountLicenseType?: string, licenseDisplayName?: string): 'Basic' | 'Stakeholder' {
  const haystack = `${accountLicenseType ?? ''} ${licenseDisplayName ?? ''}`.toLowerCase();
  return haystack.includes('stakeholder') ? 'Stakeholder' : 'Basic';
}

export function buildAdoUrl(
  family: 'core' | 'graph' | 'entitlements',
  org: string,
  apiPath: string,
  query: Record<string, string>,
): URL {
  const resolved = resolveSandboxOrg(org);
  if (!apiPath.startsWith('_apis/')) {
    throw new Error('invalid_path');
  }
  if (apiPath.includes('..') || apiPath.includes('\\') || apiPath.includes('://')) {
    throw new Error('invalid_path');
  }
  const hosts = {
    core: `https://dev.azure.com/${resolved}`,
    graph: `https://vssps.dev.azure.com/${resolved}`,
    entitlements: `https://vsaex.dev.azure.com/${resolved}`,
  } as const;
  const url = new URL(`${hosts[family]}/${apiPath}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export function authorizationHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`, 'utf8').toString('base64')}`;
}

export async function adoGetJson<T>(
  url: URL,
  pat: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authorizationHeader(pat),
    },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  return { ok: true, data: (await response.json()) as T };
}

export function mapEntitlementToUser(member: EntitlementMember) {
  const descriptor = member.user?.descriptor ?? member.id ?? member.user?.principalName ?? 'unknown';
  const license = mapLicense(member.accessLevel?.accountLicenseType, member.accessLevel?.licenseDisplayName);
  return {
    id: `user:${descriptor}`,
    displayName: member.user?.displayName ?? member.user?.principalName ?? 'Unknown user',
    email: member.user?.mailAddress ?? member.user?.principalName ?? '',
    origin: member.user?.origin === 'vsts' ? ('vsts' as const) : ('aad' as const),
    projectCount: 0,
    directAssignmentCount: 0,
    privileged: false,
    license,
    descriptor,
  };
}

export function mapProject(project: ProjectValue) {
  return {
    id: `project:${project.id ?? project.name ?? 'unknown'}`,
    name: project.name ?? 'Unnamed project',
    userCount: 0,
    groupCount: 0,
    teamCount: 0,
    repositoryCount: 0,
  };
}

export function mapGroup(group: GraphGroup) {
  const origin = group.origin === 'aad' ? ('aad' as const) : ('vsts' as const);
  return {
    id: `group:${group.descriptor ?? group.principalName ?? 'unknown'}`,
    name: group.displayName ?? group.principalName ?? 'Unnamed group',
    origin,
    originLabel: origin === 'aad' ? ('Entra' as const) : ('Azure DevOps' as const),
    descriptor: group.descriptor ?? '',
    memberCount: 0,
    nestedGroupCount: 0,
    empty: false,
    privileged: false,
  };
}
