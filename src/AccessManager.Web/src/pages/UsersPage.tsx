import { useEffect, useState } from 'react';
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
import { accessClient } from '../api/client';
import type { UserSummary } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    void accessClient.listUsers(query).then(setUsers);
  }, [query]);

  return (
    <section>
      <PageHeader
        title="Users"
        description="Search by name or email. Opening a user shows the access hierarchy and why each bit is present."
      />
      <Input
        value={query}
        placeholder="Filter by name or email"
        aria-label="Filter users"
        onChange={(_, data) => {
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
