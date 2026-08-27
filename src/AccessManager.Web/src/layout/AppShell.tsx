import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '@fluentui/react-components';
import {
  CalendarAgenda24Regular,
  Folder24Regular,
  Home24Regular,
  Navigation24Regular,
  People24Regular,
  PeopleTeam24Regular,
  Search24Regular,
  ShieldError24Regular,
  Table24Regular,
} from '@fluentui/react-icons';
import { accessClient } from '../api/client';
import { liveStatus } from '../api/live';
import type { Organization } from '../api/types';

const navItems = [
  { to: '/', label: 'Overview', icon: Home24Regular, end: true },
  { to: '/users', label: 'Users', icon: People24Regular },
  { to: '/groups', label: 'Groups', icon: PeopleTeam24Regular },
  { to: '/projects', label: 'Projects', icon: Folder24Regular },
  { to: '/matrix', label: 'Permission matrix', icon: Table24Regular },
  { to: '/direct-permissions', label: 'Direct permissions', icon: ShieldError24Regular },
  { to: '/plans', label: 'Plans', icon: CalendarAgenda24Regular },
];

export function AppShell() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionReason, setConnectionReason] = useState('missing_pat');

  useEffect(() => {
    void liveStatus().then((status) => {
      setConnected(status.connected);
      setConnectionReason(status.reason);
    });
  }, []);

  useEffect(() => {
    void accessClient.getOverview().then((overview) => setOrganization(overview.organization)).catch(() => {
      setOrganization({
        id: 'org:evanbeer',
        name: 'evanbeer',
        generation: 0,
        syncedAtUtc: '—',
        coverage: 'VisibilityReduced',
      });
    });
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      return;
    }
    setNavOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${navOpen ? 'open' : ''}`} id="navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            AM
          </span>
          <div>
            <p className="brand-name">Access Manager</p>
            <p className="brand-tag">Find why they have access</p>
          </div>
        </div>
        <nav aria-label="Application">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setNavOpen(false)}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>Read-only mode</strong>
          <p>
            {connected
              ? 'Connected to sandbox evanbeer. No users are created and no ACEs are written.'
              : 'Live inventory only. Mutations stay disabled until a later write slice.'}
          </p>
        </div>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <Button
            appearance="subtle"
            icon={<Navigation24Regular />}
            className="nav-toggle"
            aria-controls="navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </Button>
          <div className="org-meta">
            <span className="org-name">{organization?.name ?? 'evanbeer'}</span>
            <span>
              generation {organization?.generation ?? '—'} · synced {organization?.syncedAtUtc ?? '—'} ·{' '}
              {organization?.coverage ?? 'VisibilityReduced'} coverage
            </span>
            <p className="connection-status" role="status">
              {connected
                ? 'Live evanbeer inventory'
                : `Disconnected (${connectionReason}). Add AZURE_DEVOPS_PAT to read the org.`}
            </p>
          </div>
          <form className="search-form" role="search" onSubmit={onSearch}>
            <Input
              contentBefore={<Search24Regular />}
              placeholder="Search users, email, groups, projects, repos"
              value={query}
              onChange={(_, data) => setQuery(data.value)}
              aria-label="Search inventory"
            />
          </form>
          <span className="readonly-pill">Read-only</span>
        </header>
        <main id="main" className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
