import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Text } from '@fluentui/react-components';
import { accessClient } from '../api/client';
import type { OverviewSnapshot } from '../api/types';
import { DisconnectedState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { SeverityBadge } from '../components/SourceBadge';

export function OverviewPage() {
  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void accessClient
      .getOverview()
      .then((value) => {
        setSnapshot(value);
        setError(null);
      })
      .catch((err: unknown) => {
        setSnapshot(null);
        setError(err instanceof Error ? err.message : 'Sandbox inventory is not connected');
      });
  }, []);

  if (error) {
    return <DisconnectedState reason={error} />;
  }
  if (!snapshot) {
    return <p>Loading evanbeer inventory…</p>;
  }

  return (
    <section>
      <PageHeader
        title="Access overview"
        description="This is not a generic BI dashboard. Each card is an access problem in the live evanbeer inventory."
      />
      <div className="stat-row" aria-label="Inventory totals">
        <article className="stat-card">
          <span>Users</span>
          <strong>{snapshot.totals.users}</strong>
        </article>
        <article className="stat-card">
          <span>Groups</span>
          <strong>{snapshot.totals.groups}</strong>
        </article>
        <article className="stat-card">
          <span>Projects</span>
          <strong>{snapshot.totals.projects}</strong>
        </article>
        <article className="stat-card">
          <span>Teams</span>
          <strong>{snapshot.totals.teams}</strong>
        </article>
        <article className="stat-card">
          <span>Stakeholder (free)</span>
          <strong>{snapshot.totals.stakeholders}</strong>
        </article>
        <article className="stat-card">
          <span>Free Basic seats</span>
          <strong>
            {snapshot.totals.freeBasicUsed}/{snapshot.totals.freeBasicIncluded}
          </strong>
        </article>
      </div>
      <div className="finding-grid">
        {snapshot.findings.map((finding) => (
          <Card key={finding.id} className={`finding-card severity-${finding.severity}`}>
            <CardHeader
              header={
                <div className="finding-header">
                  <SeverityBadge severity={finding.severity} />
                  <Text weight="semibold">{finding.title}</Text>
                </div>
              }
              action={<span className="finding-count">{finding.count}</span>}
            />
            <p>{finding.description}</p>
            <Link to={finding.href}>Inspect finding</Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
