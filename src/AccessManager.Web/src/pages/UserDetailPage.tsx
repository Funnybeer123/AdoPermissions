import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { accessClient } from '../api/client';
import type { UserDetail } from '../api/types';
import { AccessTree } from '../components/AccessTree';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ClassificationBadge, SeverityBadge } from '../components/SourceBadge';

export function UserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState<UserDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      return;
    }
    void accessClient.getUser(decodeURIComponent(userId)).then(setUser);
  }, [userId]);

  if (user === undefined) {
    return <p>Loading user access…</p>;
  }
  if (!user) {
    return <EmptyState title="User not found" detail="The Contoso inventory does not contain that principal." />;
  }

  return (
    <section>
      <PageHeader
        title={user.displayName}
        description={`${user.email} · ${user.descriptor} · ${user.directAssignmentCount} direct assignments`}
      />
      {user.findings.length > 0 ? (
        <ul className="inline-findings">
          {user.findings.map((finding) => (
            <li key={finding.id}>
              <SeverityBadge severity={finding.severity} /> {finding.title}: {finding.description}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="split-panels">
        <article className="panel">
          <h2>Access hierarchy</h2>
          <AccessTree nodes={user.access} label={`Access for ${user.displayName}`} />
        </article>
        <article className="panel">
          <h2>Group recommendations</h2>
          <p className="page-description">
            Recommendations are ranked from actual coverage, not group names. A gain requires acknowledgement;
            a loss blocks automatic migration.
          </p>
          {user.recommendations.length === 0 ? (
            <EmptyState title="No replacement candidates" detail="This user already receives access from groups." />
          ) : (
            <Table aria-label="Group recommendations">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Group</TableHeaderCell>
                  <TableHeaderCell>Coverage</TableHeaderCell>
                  <TableHeaderCell>Same</TableHeaderCell>
                  <TableHeaderCell>Gained</TableHeaderCell>
                  <TableHeaderCell>Lost</TableHeaderCell>
                  <TableHeaderCell>Unknown</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.recommendations.map((recommendation) => (
                  <TableRow key={recommendation.groupId}>
                    <TableCell>
                      <Link to={`/groups/${recommendation.groupId}`}>{recommendation.groupName}</Link>
                    </TableCell>
                    <TableCell>
                      <ClassificationBadge
                        classification={
                          recommendation.coverage === 'exact'
                            ? 'SAME'
                            : recommendation.coverage === 'gain'
                              ? 'GAINED'
                              : recommendation.coverage === 'loss'
                                ? 'LOST'
                                : 'UNKNOWN'
                        }
                      />
                    </TableCell>
                    <TableCell>{recommendation.sameCount}</TableCell>
                    <TableCell>{recommendation.gainedCount}</TableCell>
                    <TableCell>{recommendation.lostCount}</TableCell>
                    <TableCell>{recommendation.unknownCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {user.recommendations.map((recommendation) => (
            <p key={`${recommendation.groupId}-why`} className="rationale">
              <strong>{recommendation.groupName}:</strong> {recommendation.rationale}
            </p>
          ))}
          {user.id === 'user:evan' ? (
            <p>
              <Link to="/plans/plan:evan-alpha">Open the dry-run plan for ADO-Alpha-Developers</Link>
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
