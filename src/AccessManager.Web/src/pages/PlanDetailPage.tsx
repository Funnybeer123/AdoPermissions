import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { accessClient } from '../api/client';
import type { MigrationPlan } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ClassificationBadge, EffectBadge } from '../components/SourceBadge';

export function PlanDetailPage() {
  const { planId } = useParams();
  const [plan, setPlan] = useState<MigrationPlan | null | undefined>(undefined);

  useEffect(() => {
    if (!planId) {
      return;
    }
    void accessClient.getPlan(decodeURIComponent(planId)).then((value) => setPlan(value ?? null));
  }, [planId]);

  if (plan === undefined) {
    return <p>Loading plan…</p>;
  }
  if (!plan) {
    return <EmptyState title="Plan not found" />;
  }

  return (
    <section>
      <PageHeader
        title={plan.title}
        description={`State: ${plan.state} · created by ${plan.createdBy}. This is a dry-run comparison, not an execution form.`}
      />
      <MessageBar intent="info">
        <MessageBarBody>
          <MessageBarTitle>Nothing executes from this planning screen</MessageBarTitle>
          Read-only mode is on. There is no Execute, Approve, or Apply control. The backend write path is not
          composed into this shell.
        </MessageBarBody>
      </MessageBar>
      <p>
        Target user: <Link to={`/users/${plan.userId}`}>{plan.user}</Link>
        {' · '}
        Candidate group: <Link to={`/groups/${plan.candidateGroupId}`}>{plan.candidateGroup}</Link>
      </p>
      <h2>Before / after comparison</h2>
      <Table aria-label="Access comparison">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Resource</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
            <TableHeaderCell>Current</TableHeaderCell>
            <TableHeaderCell>Proposed</TableHeaderCell>
            <TableHeaderCell>Classification</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plan.comparison.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.resource}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>
                <EffectBadge effect={row.current} />
              </TableCell>
              <TableCell>
                <EffectBadge effect={row.proposed} />
              </TableCell>
              <TableCell>
                <ClassificationBadge classification={row.classification} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h2>Proposed operations</h2>
      <Table aria-label="Proposed operations">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Summary</TableHeaderCell>
            <TableHeaderCell>Executable here</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plan.operations.map((operation) => (
            <TableRow key={operation.id}>
              <TableCell>{operation.type}</TableCell>
              <TableCell>{operation.summary}</TableCell>
              <TableCell>{operation.executable ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {plan.warnings.length > 0 ? (
        <ul className="plain-list">
          {plan.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      {plan.blocks.length > 0 ? (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Automatic migration is blocked</MessageBarTitle>
            {plan.blocks.join(' ')}
          </MessageBarBody>
        </MessageBar>
      ) : null}
    </section>
  );
}
