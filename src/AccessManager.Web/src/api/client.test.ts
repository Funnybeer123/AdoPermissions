import { createContosoInventoryClient } from './client';

const client = createContosoInventoryClient();

test('overview is a findings inventory, not an empty dashboard', async () => {
  const overview = await client.getOverview();
  expect(overview.organization.name).toBe('Contoso');
  expect(overview.readOnly).toBe(true);
  expect(overview.findings.some((finding) => finding.title === 'Users with direct permissions')).toBe(true);
  expect(overview.findings.some((finding) => finding.title === 'Explicit Deny assignments')).toBe(true);
});

test('email search returns Evan Hale access route', async () => {
  const hits = await client.search('evan@example.invalid');
  expect(hits[0]).toMatchObject({
    title: 'Evan Hale',
    href: '/users/user:evan',
    kind: 'user',
  });
});

test('Evan has direct access and an exact Alpha group recommendation', async () => {
  const evan = await client.getUser('user:evan');
  expect(evan?.directAssignmentCount).toBeGreaterThan(0);
  expect(evan?.recommendations[0]).toMatchObject({
    groupName: 'ADO-Alpha-Developers',
    coverage: 'exact',
    lostCount: 0,
    gainedCount: 0,
  });
});

test('Contoso includes free Stakeholder users that are not live Azure DevOps identities', async () => {
  const overview = await client.getOverview();
  expect(overview.totals.stakeholders).toBe(10);
  expect(overview.totals.basic).toBe(4);
  expect(overview.totals.freeBasicUsed).toBe(4);
  expect(overview.totals.freeBasicIncluded).toBe(5);
  expect(overview.findings.some((finding) => finding.title === 'Stakeholder (free) users')).toBe(true);

  const stakeholders = await client.listUsers('stakeholder');
  expect(stakeholders).toHaveLength(10);
  expect(stakeholders.every((user) => user.license === 'Stakeholder')).toBe(true);
  expect(stakeholders.some((user) => user.email === 'dana@example.invalid')).toBe(true);

  const dana = await client.getUser('user:dana');
  expect(dana?.license).toBe('Stakeholder');
  expect(JSON.stringify(dana?.access)).toMatch(/license-blocked/i);
});

test('draft plan operations are not executable', async () => {
  const plan = await client.getPlan('plan:evan-alpha');
  expect(plan?.state).toBe('Draft');
  expect(plan?.operations.every((operation) => operation.executable === false)).toBe(true);
  expect(plan?.comparison.every((row) => row.classification === 'SAME')).toBe(true);
});
