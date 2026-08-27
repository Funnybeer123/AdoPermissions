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
import type { DirectFinding } from '../api/types';
import { DisconnectedState, EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { SeverityBadge } from '../components/SourceBadge';

export function DirectPermissionsPage() {
  const [findings, setFindings] = useState<DirectFinding[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void accessClient
      .listDirectFindings()
      .then((value) => {
        setFindings(value);
        setError(null);
      })
      .catch((err: unknown) => {
        setFindings([]);
        setError(err instanceof Error ? err.message : 'Sandbox inventory is not connected');
      });
  }, []);

  return (
    <section>
      <PageHeader
        title="Direct permission cleanup"
        description="User-scoped ACEs from the live evanbeer inventory, when evaluation is available. Bulk execution is not available."
      />
      {error ? (
        <DisconnectedState reason={error} />
      ) : findings.length === 0 ? (
        <EmptyState
          title="No direct-permission findings yet"
          detail="Live ACE evaluation is not enabled. Membership and license reads stay GET-only."
        />
      ) : (
        <Table aria-label="Direct permission findings">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Risk</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Resource</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Why it matters</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell>
                  <SeverityBadge severity={finding.risk} />
                </TableCell>
                <TableCell>
                  <Link to={`/users/${finding.userId}`}>{finding.user}</Link>
                </TableCell>
                <TableCell>{finding.project}</TableCell>
                <TableCell>{finding.resource}</TableCell>
                <TableCell>{finding.action}</TableCell>
                <TableCell>{finding.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
