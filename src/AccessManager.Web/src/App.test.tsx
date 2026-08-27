import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import App from './App';

async function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(<App />);
}

test('overview shows access problems rather than generic BI copy', async () => {
  await renderApp('/');
  expect(await screen.findByRole('heading', { name: 'Access overview' })).toBeInTheDocument();
  expect(screen.getByText('Users with direct permissions')).toBeInTheDocument();
  expect(screen.getByText('Explicit Deny assignments')).toBeInTheDocument();
  expect(screen.getByText(/not a generic BI dashboard/i)).toBeInTheDocument();
});

test('users filter evan keeps Evan Hale and hides Alice', async () => {
  const user = userEvent.setup();
  await renderApp('/users');
  expect(await screen.findByRole('link', { name: 'Alice Ng' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Filter users'), 'evan');
  expect(screen.getByRole('link', { name: 'Evan Hale' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Alice Ng' })).not.toBeInTheDocument();
});

test('user search finds Evan and opens the access hierarchy', async () => {
  const user = userEvent.setup();
  await renderApp('/users');
  await screen.findByRole('heading', { name: 'Users' });
  await user.type(screen.getByLabelText('Filter users'), 'evan@');
  expect(await screen.findByRole('link', { name: 'Evan Hale' })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Evan Hale' }));
  expect(await screen.findByRole('heading', { name: 'Evan Hale' })).toBeInTheDocument();
  expect(screen.getAllByText('DIRECT').length).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: 'ADO-Alpha-Developers' })).toBeInTheDocument();
});

test('planning screen is dry-run only', async () => {
  await renderApp('/plans/plan:evan-alpha');
  expect(await screen.findByText(/dry-run comparison, not an execution form/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Nothing executes from this planning screen/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: /execute|apply|approve/i })).not.toBeInTheDocument();
  expect(screen.getAllByText('No').length).toBeGreaterThan(0);
});

test('overview has no serious accessibility violations', async () => {
  const { container } = await renderApp('/');
  await screen.findByRole('heading', { name: 'Access overview' });
  const results = await axe(container);
  expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([]);
});
