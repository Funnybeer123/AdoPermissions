import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { accessClient } from '../api/client';
import type { MatrixRow } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { EffectBadge, SourceBadge } from '../components/SourceBadge';

export function MatrixPage() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const query = {
    q: params.get('q') ?? '',
    principalKind: (params.get('principalKind') ?? '') as '' | 'user' | 'group' | 'team',
    projectId: params.get('projectId') ?? '',
    directOnly: params.get('directOnly') === '1',
    inheritedOnly: params.get('inheritedOnly') === '1',
    deniedOnly: params.get('deniedOnly') === '1',
    administrativeOnly: params.get('administrativeOnly') === '1',
  };

  useEffect(() => {
    void accessClient.listMatrix({
      q: params.get('q') ?? '',
      principalKind: (params.get('principalKind') ?? '') as '' | 'user' | 'group' | 'team',
      projectId: params.get('projectId') ?? '',
      directOnly: params.get('directOnly') === '1',
      inheritedOnly: params.get('inheritedOnly') === '1',
      deniedOnly: params.get('deniedOnly') === '1',
      administrativeOnly: params.get('administrativeOnly') === '1',
    }).then(setRows);
  }, [params]);

  function update(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        merged.set(key, value);
      } else {
        merged.delete(key);
      }
    }
    setParams(merged, { replace: true });
  }

  return (
    <section>
      <PageHeader
        title="Permission matrix"
        description="Filter principals, projects, source, Deny, and administrative bits. Source labels are text, not color alone."
      />
      <div className="filter-bar">
        <Input
          value={query.q}
          placeholder="Filter principal, resource, or action"
          aria-label="Filter matrix"
          onChange={(_, data) => update({ q: data.value })}
        />
        <Dropdown
          aria-label="Principal kind"
          placeholder="Principal kind"
          value={query.principalKind || 'All principals'}
          selectedOptions={query.principalKind ? [query.principalKind] : []}
          onOptionSelect={(_, data) => update({ principalKind: data.optionValue === 'all' ? undefined : data.optionValue })}
        >
          <Option value="all">All principals</Option>
          <Option value="user">User</Option>
          <Option value="group">Group</Option>
          <Option value="team">Team</Option>
        </Dropdown>
        <Dropdown
          aria-label="Project"
          placeholder="Project"
          value={query.projectId || 'All projects'}
          selectedOptions={query.projectId ? [query.projectId] : []}
          onOptionSelect={(_, data) => update({ projectId: data.optionValue === 'all' ? undefined : data.optionValue })}
        >
          <Option value="all">All projects</Option>
          <Option value="project:alpha">Project Alpha</Option>
          <Option value="project:beta">Project Beta</Option>
          <Option value="project:gamma">Project Gamma</Option>
          <Option value="org:contoso">Contoso</Option>
        </Dropdown>
        <Checkbox
          label="Direct only"
          checked={query.directOnly}
          onChange={(_, data) => update({ directOnly: data.checked ? '1' : undefined })}
        />
        <Checkbox
          label="Inherited only"
          checked={query.inheritedOnly}
          onChange={(_, data) => update({ inheritedOnly: data.checked ? '1' : undefined })}
        />
        <Checkbox
          label="Denied"
          checked={query.deniedOnly}
          onChange={(_, data) => update({ deniedOnly: data.checked ? '1' : undefined })}
        />
        <Checkbox
          label="Administrative"
          checked={query.administrativeOnly}
          onChange={(_, data) => update({ administrativeOnly: data.checked ? '1' : undefined })}
        />
        <Button appearance="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
          Clear filters
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No permission rows match the current filters" />
      ) : (
        <Table aria-label="Permission matrix">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Principal</TableHeaderCell>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Resource</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Effect</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    to={
                      row.principalKind === 'user'
                        ? `/users/${row.principalId}`
                        : row.principalKind === 'group'
                          ? `/groups/${row.principalId}`
                          : '/projects/project:alpha'
                    }
                  >
                    {row.principal}
                  </Link>
                </TableCell>
                <TableCell>{row.project}</TableCell>
                <TableCell>{row.resource}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>
                  <SourceBadge source={row.source} />
                </TableCell>
                <TableCell>
                  <EffectBadge effect={row.effect} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
