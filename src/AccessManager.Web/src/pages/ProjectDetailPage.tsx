import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Tab, TabList } from '@fluentui/react-components';
import { accessClient } from '../api/client';
import type { ProjectDetail } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { EffectBadge, SourceBadge } from '../components/SourceBadge';

type ProjectTab = 'teams' | 'groups' | 'users' | 'repositories' | 'pipelines' | 'environments' | 'connections' | 'assignments';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetail | null | undefined>(undefined);
  const [tab, setTab] = useState<ProjectTab>('assignments');

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void accessClient.getProject(decodeURIComponent(projectId)).then(setProject);
  }, [projectId]);

  if (project === undefined) {
    return <p>Loading project…</p>;
  }
  if (!project) {
    return <EmptyState title="Project not found" />;
  }

  return (
    <section>
      <PageHeader title={project.name} description="Project-centric inventory with permission assignments and unsupported resource facts." />
      <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as ProjectTab)} aria-label="Project views">
        <Tab value="assignments">Permission assignments</Tab>
        <Tab value="users">Users</Tab>
        <Tab value="groups">Groups</Tab>
        <Tab value="teams">Teams</Tab>
        <Tab value="repositories">Repositories</Tab>
        <Tab value="pipelines">Pipelines</Tab>
        <Tab value="environments">Environments</Tab>
        <Tab value="connections">Service connections</Tab>
      </TabList>
      <div className="tab-panel">
        {tab === 'assignments' ? (
          project.assignments.length === 0 ? (
            <EmptyState title="No assignments in view" />
          ) : (
            <ul className="assignment-list">
              {project.assignments.map((row) => (
                <li key={row.id}>
                  <Link to={row.principalKind === 'user' ? `/users/${row.principalId}` : `/groups/${row.principalId}`}>
                    {row.principal}
                  </Link>{' '}
                  · {row.resource} · {row.action} <SourceBadge source={row.source} /> <EffectBadge effect={row.effect} />
                </li>
              ))}
            </ul>
          )
        ) : null}
        {tab === 'users' ? (
          <LinkList items={project.users.map((user) => ({ href: `/users/${user.id}`, label: user.displayName }))} />
        ) : null}
        {tab === 'groups' ? (
          <LinkList items={project.groups.map((group) => ({ href: `/groups/${group.id}`, label: group.name }))} />
        ) : null}
        {tab === 'teams' ? (
          <LinkList items={project.teams.map((team) => ({ href: '#', label: `${team.name} (${team.memberCount} members)` }))} />
        ) : null}
        {tab === 'repositories' ? (
          <LinkList items={project.repositories.map((repo) => ({ href: '#', label: repo.name }))} />
        ) : null}
        {tab === 'pipelines' ? <FactList items={project.pipelines} empty="No pipelines" /> : null}
        {tab === 'environments' ? <FactList items={project.environments} empty="No environments" /> : null}
        {tab === 'connections' ? <FactList items={project.serviceConnections} empty="No service connections" /> : null}
      </div>
    </section>
  );
}

function LinkList({ items }: { items: { href: string; label: string }[] }) {
  if (items.length === 0) {
    return <EmptyState title="None" />;
  }
  return (
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item.label}>
          {item.href === '#' ? item.label : <Link to={item.href}>{item.label}</Link>}
        </li>
      ))}
    </ul>
  );
}

function FactList({
  items,
  empty,
}: {
  items: { id: string; name: string; unsupported?: boolean }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} />;
  }
  return (
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          {item.unsupported ? <span className="unsupported-flag"> unsupported fact</span> : null}
        </li>
      ))}
    </ul>
  );
}
