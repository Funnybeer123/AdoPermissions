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
import type { ProjectSummary } from '../api/types';
import { DisconnectedState, EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void accessClient
      .listProjects()
      .then((value) => {
        setProjects(value);
        setError(null);
      })
      .catch((err: unknown) => {
        setProjects([]);
        setError(err instanceof Error ? err.message : 'Sandbox inventory is not connected');
      });
  }, []);

  return (
    <section>
      <PageHeader title="Projects" description="Switch from the organization inventory into a project-centric view." />
      {error ? (
        <DisconnectedState reason={error} />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects in evanbeer" />
      ) : (
        <Table aria-label="Projects">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Users</TableHeaderCell>
              <TableHeaderCell>Groups</TableHeaderCell>
              <TableHeaderCell>Teams</TableHeaderCell>
              <TableHeaderCell>Repositories</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link to={`/projects/${project.id}`}>{project.name}</Link>
                </TableCell>
                <TableCell>{project.userCount}</TableCell>
                <TableCell>{project.groupCount}</TableCell>
                <TableCell>{project.teamCount}</TableCell>
                <TableCell>{project.repositoryCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
