import type { OverviewSnapshot, ProjectSummary, UserDetail, UserSummary } from '../api/types';

export const liveOverview: OverviewSnapshot = {
  organization: {
    id: 'org:evanbeer',
    name: 'evanbeer',
    generation: 1,
    syncedAtUtc: '2026-08-27T21:00:00Z',
    coverage: 'Partial',
  },
  totals: {
    users: 2,
    groups: 1,
    projects: 1,
    teams: 0,
    basic: 1,
    stakeholders: 1,
    freeBasicUsed: 1,
    freeBasicIncluded: 5,
  },
  findings: [
    {
      id: 'finding:live-read-only',
      severity: 'info',
      title: 'Sandbox inventory is read-only',
      count: 2,
      description: 'evanbeer is connected for membership and license reads only.',
      href: '/users',
    },
  ],
  readOnly: true,
};

export const liveUsers: UserSummary[] = [
  {
    id: 'user:owner',
    displayName: 'Org Owner',
    email: 'owner@example.invalid',
    origin: 'aad',
    projectCount: 1,
    directAssignmentCount: 0,
    privileged: true,
    license: 'Basic',
  },
  {
    id: 'user:pat',
    displayName: 'Pat Nguyen',
    email: 'pat@example.invalid',
    origin: 'aad',
    projectCount: 0,
    directAssignmentCount: 0,
    privileged: false,
    license: 'Stakeholder',
  },
];

export const liveUserDetails: Record<string, UserDetail> = {
  'user:owner': {
    ...liveUsers[0],
    descriptor: 'aad.owner',
    findings: [],
    recommendations: [],
    access: [
      {
        id: 'user:owner-org',
        label: 'evanbeer',
        kind: 'organization',
        source: 'UNKNOWN',
        explanation: 'Live sandbox inventory does not evaluate ACEs yet.',
      },
    ],
  },
  'user:pat': {
    ...liveUsers[1],
    descriptor: 'aad.pat',
    findings: [],
    recommendations: [],
    access: [
      {
        id: 'user:pat-org',
        label: 'evanbeer',
        kind: 'organization',
        source: 'UNKNOWN',
        explanation: 'Live sandbox inventory does not evaluate ACEs yet.',
      },
    ],
  },
};

export const liveGroups = [
  {
    id: 'group:project-admins',
    name: 'Project Collection Administrators',
    origin: 'vsts' as const,
    originLabel: 'Azure DevOps' as const,
    descriptor: 'vssgp.admins',
    memberCount: 1,
    nestedGroupCount: 0,
    empty: false,
    privileged: true,
  },
];

export const liveProjects: ProjectSummary[] = [
  {
    id: 'project:sandbox',
    name: 'Sandbox',
    userCount: 0,
    groupCount: 0,
    teamCount: 0,
    repositoryCount: 0,
  },
];
