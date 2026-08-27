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
import { PageHeader } from '../components/PageHeader';
import { SeverityBadge } from '../components/SourceBadge';

export function DirectPermissionsPage() {
  const [findings, setFindings] = useState<DirectFinding[]>([]);

  useEffect(() => {
    void accessClient.listDirectFindings().then(setFindings);
  }, []);

  return (
    <section>
      <PageHeader
        title="Direct permission cleanup"
        description="Every user-scoped ACE in Contoso, ranked by risk. Selecting findings can only open a dry-run plan. Bulk execution is not available."
      />
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
      <p className="page-description">
        The only generated remediation plan in this inventory is the{' '}
        <Link to="/plans/plan:evan-alpha">Evan Hale Alpha replacement preview</Link>.
      </p>
    </section>
  );
}
