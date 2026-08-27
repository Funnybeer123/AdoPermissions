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
import { getInventorySource, setInventorySource, subscribeInventorySource } from '../api/inventorySource';
import { liveStatus } from '../api/live';
import type { InventorySource } from '../api/inventorySource';
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
  const [source, setSource] = useState<InventorySource>(getInventorySource());
  const [sandboxReady, setSandboxReady] = useState(false);
  const [sandboxReason, setSandboxReason] = useState('missing_pat');

  useEffect(() => subscribeInventorySource(setSource), []);

  useEffect(() => {
    void liveStatus().then((status) => {
      setSandboxReady(status.connected);
      setSandboxReason(status.reason);
    });
  }, []);

  useEffect(() => {
    void accessClient.getOverview().then((overview) => setOrganization(overview.organization));
  }, [source]);

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
            {source === 'sandbox'
              ? 'Connected to sandbox evanbeer. No users are created and no ACEs are written.'
              : 'Mutations are disabled. Plans stay at dry-run preview.'}
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
            <span className="org-name">{organization?.name ?? 'Contoso'}</span>
            <span>
              generation {organization?.generation ?? '—'} · synced {organization?.syncedAtUtc ?? '—'} ·{' '}
              {organization?.coverage ?? 'Complete'} coverage
            </span>
            <div className="source-switch" role="group" aria-label="Inventory source">
              <Button
                appearance={source === 'contoso' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setInventorySource('contoso')}
              >
                Contoso fake
              </Button>
              <Button
                appearance={source === 'sandbox' ? 'primary' : 'secondary'}
                size="small"
                disabled={!sandboxReady}
                title={
                  sandboxReady
                    ? 'Read-only inventory from sandbox org evanbeer'
                    : `Sandbox evanbeer is not connected (${sandboxReason}). Add AZURE_DEVOPS_PAT to the environment.`
                }
                onClick={() => setInventorySource('sandbox')}
              >
                evanbeer sandbox
              </Button>
            </div>
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
          <Outlet key={source} />
        </main>
      </div>
    </div>
  );
}
