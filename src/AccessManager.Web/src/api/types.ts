export type PermissionSource =
  | 'DIRECT'
  | 'INHERITED'
  | 'GROUP'
  | 'TEAM'
  | 'ENTRA_GROUP'
  | 'DENY'
  | 'NOT_SET'
  | 'UNKNOWN';

export type PermissionEffect = 'Allow' | 'Deny' | 'NotSet' | 'Unknown';

export type Origin = 'aad' | 'vsts';

export type FindingSeverity = 'administrative' | 'high' | 'medium' | 'low' | 'info';

export type ComparisonClass = 'SAME' | 'GAINED' | 'LOST' | 'CHANGED' | 'UNKNOWN';

export type AccessNodeKind =
  | 'organization'
  | 'project'
  | 'group'
  | 'team'
  | 'repository'
  | 'pipeline'
  | 'environment'
  | 'serviceConnection'
  | 'permission';

export type SearchKind =
  | 'user'
  | 'group'
  | 'team'
  | 'project'
  | 'repository'
  | 'pipeline'
  | 'environment'
  | 'serviceConnection';

export interface Organization {
  id: string;
  name: string;
  generation: number;
  syncedAtUtc: string;
  coverage: 'Complete' | 'Partial' | 'VisibilityReduced';
}

export interface Finding {
  id: string;
  severity: FindingSeverity;
  title: string;
  count: number;
  description: string;
  href: string;
}

export interface OverviewSnapshot {
  organization: Organization;
  totals: {
    users: number;
    groups: number;
    projects: number;
    teams: number;
  };
  findings: Finding[];
  readOnly: true;
}

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
  origin: Origin;
  projectCount: number;
  directAssignmentCount: number;
  privileged: boolean;
}

export interface AccessNode {
  id: string;
  label: string;
  kind: AccessNodeKind;
  source?: PermissionSource;
  effect?: PermissionEffect;
  via?: string[];
  explanation?: string;
  children?: AccessNode[];
  unsupported?: boolean;
  note?: string;
}

export interface GroupRecommendation {
  groupId: string;
  groupName: string;
  coverage: 'exact' | 'gain' | 'loss' | 'unknown';
  sameCount: number;
  gainedCount: number;
  lostCount: number;
  unknownCount: number;
  rationale: string;
}

export interface UserDetail extends UserSummary {
  descriptor: string;
  access: AccessNode[];
  recommendations: GroupRecommendation[];
  findings: Finding[];
}

export interface GroupSummary {
  id: string;
  name: string;
  origin: Origin;
  originLabel: 'Azure DevOps' | 'Entra';
  descriptor: string;
  memberCount: number;
  nestedGroupCount: number;
  empty: boolean;
  privileged: boolean;
  possibleDuplicateOf?: string;
}

export interface NamedRef {
  id: string;
  name: string;
}

export interface MemberRef {
  id: string;
  displayName: string;
  kind: 'user' | 'group';
}

export interface GroupDetail extends GroupSummary {
  members: MemberRef[];
  nestedGroups: NamedRef[];
  teams: NamedRef[];
  projects: NamedRef[];
  access: AccessNode[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  userCount: number;
  groupCount: number;
  teamCount: number;
  repositoryCount: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  projectId: string;
  memberCount: number;
}

export interface MatrixRow {
  id: string;
  principalId: string;
  principal: string;
  principalKind: 'user' | 'group' | 'team';
  projectId: string;
  project: string;
  resource: string;
  resourceKind: string;
  action: string;
  source: PermissionSource;
  effect: PermissionEffect;
  administrative: boolean;
}

export interface ProjectDetail extends ProjectSummary {
  teams: TeamSummary[];
  groups: NamedRef[];
  users: { id: string; displayName: string }[];
  repositories: NamedRef[];
  pipelines: { id: string; name: string; unsupported?: boolean }[];
  environments: { id: string; name: string; unsupported?: boolean }[];
  serviceConnections: { id: string; name: string; unsupported?: boolean }[];
  assignments: MatrixRow[];
}

export interface DirectFinding {
  id: string;
  userId: string;
  user: string;
  project: string;
  resource: string;
  action: string;
  risk: 'Low' | 'Medium' | 'High' | 'Administrative';
  reason: string;
}

export interface ComparisonRow {
  id: string;
  resource: string;
  action: string;
  current: PermissionEffect;
  proposed: PermissionEffect;
  classification: ComparisonClass;
}

export interface PlannedOperation {
  id: string;
  type: string;
  summary: string;
  executable: boolean;
}

export interface MigrationPlan {
  id: string;
  title: string;
  userId: string;
  user: string;
  candidateGroupId: string;
  candidateGroup: string;
  state: 'Draft' | 'PendingApproval' | 'Approved';
  createdBy: string;
  comparison: ComparisonRow[];
  operations: PlannedOperation[];
  warnings: string[];
  blocks: string[];
}

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
}

export interface MatrixQuery {
  q?: string;
  principalKind?: 'user' | 'group' | 'team' | '';
  projectId?: string;
  directOnly?: boolean;
  inheritedOnly?: boolean;
  deniedOnly?: boolean;
  administrativeOnly?: boolean;
}
