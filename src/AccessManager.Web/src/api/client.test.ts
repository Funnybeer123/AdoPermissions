import { accessClient } from './client';
import { mockLiveConnected, mockLiveDisconnected } from '../test/mockLiveFetch';

test('live overview is a findings inventory for evanbeer', async () => {
  const fetchSpy = mockLiveConnected();
  const overview = await accessClient.getOverview();
  expect(overview.organization.name).toBe('evanbeer');
  expect(overview.readOnly).toBe(true);
  expect(overview.findings.some((finding) => finding.title === 'Sandbox inventory is read-only')).toBe(true);
  fetchSpy.mockRestore();
});

test('email search returns the live principal route', async () => {
  const fetchSpy = mockLiveConnected();
  const hits = await accessClient.search('pat@example.invalid');
  expect(hits[0]).toMatchObject({
    title: 'Pat Nguyen',
    href: '/users/user:pat',
    kind: 'user',
  });
  fetchSpy.mockRestore();
});

test('Stakeholder filter uses live license fields', async () => {
  const fetchSpy = mockLiveConnected();
  const stakeholders = await accessClient.listUsers('stakeholder');
  expect(stakeholders).toHaveLength(1);
  expect(stakeholders[0]?.email).toBe('pat@example.invalid');
  expect(stakeholders[0]?.license).toBe('Stakeholder');
  fetchSpy.mockRestore();
});

test('plans stay empty and non-executable on the live path', async () => {
  const fetchSpy = mockLiveConnected();
  const plans = await accessClient.listPlans();
  expect(plans).toEqual([]);
  expect(await accessClient.getPlan('plan:anything')).toBeUndefined();
  fetchSpy.mockRestore();
});

test('disconnected inventory rejects product reads', async () => {
  const fetchSpy = mockLiveDisconnected();
  await expect(accessClient.getOverview()).rejects.toThrow(/not connected/i);
  fetchSpy.mockRestore();
});
