import type {
  GroupDetail,
  GroupSummary,
  OverviewSnapshot,
  ProjectDetail,
  ProjectSummary,
  SearchHit,
  UserDetail,
  UserSummary,
} from './types';
import { matches } from './match';

async function liveJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('Sandbox inventory is not connected');
  }
  return response.json() as Promise<T>;
}

export async function liveStatus() {
  try {
    const response = await fetch('/api/live/status');
    if (!response.ok) {
      return { connected: false, organization: 'evanbeer', reason: 'unreachable', writes: false as const };
    }
    return response.json() as Promise<{
      connected: boolean;
      organization: string;
      reason: string;
      writes: false;
      configured?: boolean;
    }>;
  } catch {
    return { connected: false, organization: 'evanbeer', reason: 'unreachable', writes: false as const };
  }
}

export function createLiveInventoryClient() {
  return {
    getOverview: () => liveJson<OverviewSnapshot>('/api/live/overview'),
    listUsers: async (query = '') => {
      const users = await liveJson<UserSummary[]>('/api/live/users');
      return users.filter((user) => matches(query, user.displayName, user.email, user.id, user.license));
    },
    getUser: async (id: string) => {
      const response = await fetch(`/api/live/users/${encodeURIComponent(id)}`);
      if (response.status === 404) {
        return undefined;
      }
      if (!response.ok) {
        throw new Error('Sandbox inventory is not connected');
      }
      return response.json() as Promise<UserDetail>;
    },
    listGroups: async (query = '') => {
      const groups = await liveJson<GroupSummary[]>('/api/live/groups');
      return groups.filter((group) => matches(query, group.name, group.descriptor, group.originLabel));
    },
    getGroup: async (id: string) => {
      const response = await fetch(`/api/live/groups/${encodeURIComponent(id)}`);
      if (response.status === 404) {
        return undefined;
      }
      if (!response.ok) {
        throw new Error('Sandbox inventory is not connected');
      }
      return response.json() as Promise<GroupDetail>;
    },
    listProjects: () => liveJson<ProjectSummary[]>('/api/live/projects'),
    getProject: async (id: string) => {
      const response = await fetch(`/api/live/projects/${encodeURIComponent(id)}`);
      if (response.status === 404) {
        return undefined;
      }
      if (!response.ok) {
        throw new Error('Sandbox inventory is not connected');
      }
      return response.json() as Promise<ProjectDetail>;
    },
    listMatrix: async () => [],
    listDirectFindings: async () => [],
    listPlans: async () => [],
    getPlan: async () => undefined,
    search: async (query: string) => {
      const [users, groups, projects] = await Promise.all([
        liveJson<UserSummary[]>('/api/live/users'),
        liveJson<GroupSummary[]>('/api/live/groups'),
        liveJson<ProjectSummary[]>('/api/live/projects'),
      ]);
      const hits: SearchHit[] = [
        ...users.map((user) => ({
          id: user.id,
          kind: 'user' as const,
          title: user.displayName,
          subtitle: `${user.license} · ${user.email}`,
          href: `/users/${user.id}`,
        })),
        ...groups.map((group) => ({
          id: group.id,
          kind: 'group' as const,
          title: group.name,
          subtitle: `${group.originLabel} · ${group.descriptor}`,
          href: `/groups/${group.id}`,
        })),
        ...projects.map((project) => ({
          id: project.id,
          kind: 'project' as const,
          title: project.name,
          subtitle: 'Azure DevOps project',
          href: `/projects/${project.id}`,
        })),
      ];
      return hits.filter((hit) => matches(query, hit.title, hit.subtitle, hit.kind));
    },
  };
}
