import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accessClient } from '../api/client';
import type { GroupDetail } from '../api/types';
import { AccessTree } from '../components/AccessTree';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function GroupDetailPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<GroupDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!groupId) {
      return;
    }
    void accessClient.getGroup(decodeURIComponent(groupId)).then(setGroup);
  }, [groupId]);

  if (group === undefined) {
    return <p>Loading group…</p>;
  }
  if (!group) {
    return <EmptyState title="Group not found" />;
  }

  return (
    <section>
      <PageHeader
        title={group.name}
        description={`${group.originLabel} · ${group.descriptor}`}
      />
      <dl className="meta-list">
        <div>
          <dt>Origin</dt>
          <dd>{group.origin === 'aad' ? 'Entra' : 'Azure DevOps'}</dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>{group.memberCount}</dd>
        </div>
        <div>
          <dt>Nested groups</dt>
          <dd>{group.nestedGroupCount}</dd>
        </div>
        <div>
          <dt>Privileged</dt>
          <dd>{group.privileged ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
      <div className="split-panels">
        <article className="panel">
          <h2>Members</h2>
          {group.members.length === 0 ? (
            <EmptyState title="No members" detail="This empty group is a cleanup finding." />
          ) : (
            <ul className="plain-list">
              {group.members.map((member) => (
                <li key={member.id}>
                  <Link to={member.kind === 'user' ? `/users/${member.id}` : `/groups/${member.id}`}>
                    {member.displayName}
                  </Link>{' '}
                  <span className="cell-sub">{member.kind}</span>
                </li>
              ))}
            </ul>
          )}
          <h2>Related</h2>
          <ul className="plain-list">
            {group.nestedGroups.map((nested) => (
              <li key={nested.id}>
                Nested group: <Link to={`/groups/${nested.id}`}>{nested.name}</Link>
              </li>
            ))}
            {group.teams.map((team) => (
              <li key={team.id}>Team: {team.name}</li>
            ))}
            {group.projects.map((project) => (
              <li key={project.id}>
                Project: <Link to={`/projects/${project.id}`}>{project.name}</Link>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h2>Permissions</h2>
          {group.access.length === 0 ? (
            <EmptyState title="No observed assignments" />
          ) : (
            <AccessTree nodes={group.access} label={`Permissions for ${group.name}`} />
          )}
        </article>
      </div>
    </section>
  );
}
