import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import App from './App';
import { mockLiveConnected, mockLiveDisconnected, mockLiveStatusPending } from './test/mockLiveFetch';

async function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(<App />);
}

test('shell does not claim missing_pat before live status resolves', async () => {
  const pending = mockLiveStatusPending();
  await renderApp('/');
  expect(screen.getByText(/Checking evanbeer connection/i)).toBeInTheDocument();
  expect(screen.getByText(/Connecting to evanbeer/i)).toBeInTheDocument();
  expect(screen.queryByText(/missing_pat/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/AZURE_DEVOPS_PAT/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/VisibilityReduced/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Disconnected/i)).not.toBeInTheDocument();
  pending.releaseMissingPat();
  expect(await screen.findByText(/missing_pat/i)).toBeInTheDocument();
  expect(screen.getAllByText(/AZURE_DEVOPS_PAT/i).length).toBeGreaterThan(0);
  pending.fetchSpy.mockRestore();
});

test('disconnected shell has no Contoso switch and explains the missing PAT', async () => {
  const fetchSpy = mockLiveDisconnected();
  await renderApp('/');
  expect(await screen.findByText(/evanbeer is not connected/i)).toBeInTheDocument();
  expect(screen.getAllByText(/AZURE_DEVOPS_PAT/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Contoso fake' })).not.toBeInTheDocument();
  expect(screen.queryByText('Evan Hale')).not.toBeInTheDocument();
  expect(screen.queryByText('Dana Cole')).not.toBeInTheDocument();
  fetchSpy.mockRestore();
});

test('connected overview shows live evanbeer totals, not a generic BI dashboard', async () => {
  const fetchSpy = mockLiveConnected();
  await renderApp('/');
  expect(await screen.findByRole('heading', { name: 'Access overview' })).toBeInTheDocument();
  expect(screen.getByText(/not a generic BI dashboard/i)).toBeInTheDocument();
  expect(screen.getByText('Sandbox inventory is read-only')).toBeInTheDocument();
  expect(screen.getByText('Live evanbeer inventory')).toBeInTheDocument();
  fetchSpy.mockRestore();
});

test('users filter stakeholder keeps Pat Nguyen and hides the Basic owner', async () => {
  const fetchSpy = mockLiveConnected();
  const user = userEvent.setup();
  await renderApp('/users');
  expect(await screen.findByRole('link', { name: 'Org Owner' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Filter users'), 'stakeholder');
  expect(await screen.findByRole('link', { name: 'Pat Nguyen' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Org Owner' })).not.toBeInTheDocument();
  expect(screen.getAllByText('Stakeholder (free)').length).toBeGreaterThan(0);
  fetchSpy.mockRestore();
});

test('users filter pat keeps Pat Nguyen and hides the owner', async () => {
  const fetchSpy = mockLiveConnected();
  const user = userEvent.setup();
  await renderApp('/users');
  expect(await screen.findByRole('link', { name: 'Org Owner' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Filter users'), 'pat');
  expect(screen.getByRole('link', { name: 'Pat Nguyen' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Org Owner' })).not.toBeInTheDocument();
  fetchSpy.mockRestore();
});

test('user search opens a live principal without mock access bits', async () => {
  const fetchSpy = mockLiveConnected();
  const user = userEvent.setup();
  await renderApp('/users');
  await screen.findByRole('heading', { name: 'Users' });
  await user.type(screen.getByLabelText('Filter users'), 'pat@');
  expect(await screen.findByRole('link', { name: 'Pat Nguyen' })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Pat Nguyen' }));
  expect(await screen.findByRole('heading', { name: 'Pat Nguyen' })).toBeInTheDocument();
  expect(screen.getByText(/does not evaluate ACEs yet/i)).toBeInTheDocument();
  fetchSpy.mockRestore();
});

test('planning screen stays dry-run only with no execute controls', async () => {
  const fetchSpy = mockLiveConnected();
  await renderApp('/plans');
  expect(await screen.findByText(/Dry-run previews only/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Nothing on this screen can execute/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: /execute|apply|approve/i })).not.toBeInTheDocument();
  fetchSpy.mockRestore();
});

test('overview has no serious accessibility violations', async () => {
  const fetchSpy = mockLiveConnected();
  const { container } = await renderApp('/');
  await screen.findByRole('heading', { name: 'Access overview' });
  const results = await axe(container);
  expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([]);
  fetchSpy.mockRestore();
});
