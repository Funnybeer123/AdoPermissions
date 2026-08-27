import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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

export function PlansPage() {
  const [plans, setPlans] = useState<MigrationPlan[]>([]);

  useEffect(() => {
    void accessClient.listPlans().then(setPlans);
  }, []);

  return (
    <section>
      <PageHeader
        title="Migration plans"
        description="Dry-run previews only. Nothing on this screen can execute a membership or ACE change."
      />
      {plans.length === 0 ? (
        <EmptyState title="No plans" />
      ) : (
        <Table aria-label="Migration plans">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Candidate group</TableHeaderCell>
              <TableHeaderCell>State</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Link to={`/plans/${plan.id}`}>{plan.title}</Link>
                </TableCell>
                <TableCell>
                  <Link to={`/users/${plan.userId}`}>{plan.user}</Link>
                </TableCell>
                <TableCell>
                  <Link to={`/groups/${plan.candidateGroupId}`}>{plan.candidateGroup}</Link>
                </TableCell>
                <TableCell>{plan.state}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
