import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { accessClient, matches } from '../api/client';
import type { UserSummary } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    void accessClient.listUsers().then(setAllUsers);
  }, []);

  const users = useMemo(
    () =>
      allUsers.filter((user) =>
        matches(draft, user.displayName, user.email, user.id, user.license),
      ),
    [allUsers, draft],
  );

  return (
    <section>
      <PageHeader
        title="Users"
        description="Search by name, email, or license (Basic / Stakeholder). Stakeholder is the free Azure DevOps license with no Repos or Pipelines."
      />
      <Input
        value={draft}
        placeholder="Filter by name, email, or license"
        aria-label="Filter users"
        onChange={(_, data) => {
          setDraft(data.value);
          const next = new URLSearchParams(params);
          if (data.value) {
            next.set('q', data.value);
          } else {
            next.delete('q');
          }
          setParams(next, { replace: true });
        }}
      />
      {users.length === 0 ? (
        <EmptyState title="No users match" detail="Try a display name or an email such as evan@example.invalid." />
      ) : (
        <Table aria-label="Users">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>License</TableHeaderCell>
              <TableHeaderCell>Projects</TableHeaderCell>
              <TableHeaderCell>Direct assignments</TableHeaderCell>
              <TableHeaderCell>Privileged</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link to={`/users/${user.id}`}>{user.displayName}</Link>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.license === 'Stakeholder' ? 'Stakeholder (free)' : 'Basic'}</TableCell>
                <TableCell>{user.projectCount}</TableCell>
                <TableCell>{user.directAssignmentCount}</TableCell>
                <TableCell>{user.privileged ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
