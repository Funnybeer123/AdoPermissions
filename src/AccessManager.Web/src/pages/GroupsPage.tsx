import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import type { GroupSummary } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function GroupsPage() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<GroupSummary[]>([]);

  useEffect(() => {
    void accessClient.listGroups(query).then(setGroups);
  }, [query]);

  return (
    <section>
      <PageHeader title="Groups" description="Native Azure DevOps groups and Entra-backed groups in the Contoso inventory." />
      <Input
        value={query}
        placeholder="Filter groups"
        aria-label="Filter groups"
        onChange={(_, data) => setQuery(data.value)}
      />
      {groups.length === 0 ? (
        <EmptyState title="No groups match" />
      ) : (
        <Table aria-label="Groups">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Group</TableHeaderCell>
              <TableHeaderCell>Origin</TableHeaderCell>
              <TableHeaderCell>Members</TableHeaderCell>
              <TableHeaderCell>Nested</TableHeaderCell>
              <TableHeaderCell>Flags</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Link to={`/groups/${group.id}`}>{group.name}</Link>
                  <div className="cell-sub">{group.descriptor}</div>
                </TableCell>
                <TableCell>{group.originLabel}</TableCell>
                <TableCell>{group.memberCount}</TableCell>
                <TableCell>{group.nestedGroupCount}</TableCell>
                <TableCell>
                  {[
                    group.empty ? 'Empty' : null,
                    group.privileged ? 'Privileged' : null,
                    group.possibleDuplicateOf ? `Possible duplicate of ${group.possibleDuplicateOf}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
