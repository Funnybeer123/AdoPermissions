import { inventory } from '../data/contoso';
import type {
  DirectFinding,
  GroupDetail,
  GroupSummary,
  MatrixQuery,
  MatrixRow,
  MigrationPlan,
  OverviewSnapshot,
  ProjectDetail,
  ProjectSummary,
  SearchHit,
  UserDetail,
  UserSummary,
} from './types';

export interface AccessInventoryClient {
  getOverview(): Promise<OverviewSnapshot>;
  listUsers(query?: string): Promise<UserSummary[]>;
  getUser(id: string): Promise<UserDetail | undefined>;
  listGroups(query?: string): Promise<GroupSummary[]>;
  getGroup(id: string): Promise<GroupDetail | undefined>;
  listProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<ProjectDetail | undefined>;
  listMatrix(query?: MatrixQuery): Promise<MatrixRow[]>;
  listDirectFindings(): Promise<DirectFinding[]>;
  listPlans(): Promise<MigrationPlan[]>;
  getPlan(id: string): Promise<MigrationPlan | undefined>;
  search(query: string): Promise<SearchHit[]>;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matches(query: string, ...fields: string[]): boolean {
  const q = normalize(query);
  if (!q) {
    return true;
  }
  return fields.some((field) => normalize(field).includes(q));
}

export function createAccessInventoryClient(): AccessInventoryClient {
  return {
    async getOverview() {
      return inventory.overview;
    },
    async listUsers(query = '') {
      return inventory.users.filter((user) =>
        matches(query, user.displayName, user.email, user.id, user.license),
      );
    },
    async getUser(id) {
      return Object.hasOwn(inventory.userDetails, id)
        ? inventory.userDetails[id as keyof typeof inventory.userDetails]
        : undefined;
    },
    async listGroups(query = '') {
      return inventory.groups.filter((group) =>
        matches(query, group.name, group.descriptor, group.originLabel),
      );
    },
    async getGroup(id) {
      return inventory.groupDetails[id];
    },
    async listProjects() {
      return inventory.projects;
    },
    async getProject(id) {
      return inventory.projectDetails[id];
    },
    async listMatrix(query = {}) {
      return inventory.matrix.filter((row) => {
        if (query.q && !matches(query.q, row.principal, row.resource, row.action, row.project)) {
          return false;
        }
        if (query.principalKind && row.principalKind !== query.principalKind) {
          return false;
        }
        if (query.projectId && row.projectId !== query.projectId) {
          return false;
        }
        if (query.directOnly && row.source !== 'DIRECT' && row.source !== 'DENY') {
          return false;
        }
        if (query.inheritedOnly && row.source !== 'INHERITED') {
          return false;
        }
        if (query.deniedOnly && row.effect !== 'Deny' && row.source !== 'DENY') {
          return false;
        }
        if (query.administrativeOnly && !row.administrative) {
          return false;
        }
        return true;
      });
    },
    async listDirectFindings() {
      return inventory.directFindings;
    },
    async listPlans() {
      return inventory.plans;
    },
    async getPlan(id) {
      return inventory.plans.find((plan) => plan.id === id);
    },
    async search(query) {
      return inventory.searchIndex.filter((hit) =>
        matches(query, hit.title, hit.subtitle, hit.kind),
      );
    },
  };
}

export const accessClient = createAccessInventoryClient();
