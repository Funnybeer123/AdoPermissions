import { createLiveInventoryClient } from './live';
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

export { matches } from './match';

export const accessClient: AccessInventoryClient = createLiveInventoryClient();
