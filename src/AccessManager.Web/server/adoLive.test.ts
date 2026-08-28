import {
  buildAdoUrl,
  entitlementCollection,
  mapEntitlementToUser,
  mapLicense,
  resolveSandboxOrg,
} from './adoLive.ts';

const dana = {
  id: 'user-dana',
  user: {
    descriptor: 'aad.ZGFuYQ',
    displayName: 'Dana Cole',
    mailAddress: 'dana@example.invalid',
    origin: 'aad',
  },
  accessLevel: { accountLicenseType: 'stakeholder', licenseDisplayName: 'Stakeholder' },
};

const evan = {
  id: 'user-evan',
  user: {
    descriptor: 'aad.ZXZhbg',
    displayName: 'Evan Hale',
    mailAddress: 'evan@example.invalid',
    origin: 'aad',
  },
  accessLevel: { accountLicenseType: 'express', licenseDisplayName: 'Basic' },
};

test('allowlists the evanbeer sandbox org', () => {
  expect(resolveSandboxOrg('evanbeer')).toBe('evanbeer');
});

test('rejects org slugs that could be used for SSRF', () => {
  expect(() => resolveSandboxOrg('evanbeer.example')).toThrow('invalid_org');
  expect(() => resolveSandboxOrg('https://evil.example')).toThrow('invalid_org');
  expect(() => resolveSandboxOrg('evanbeer/../other')).toThrow('invalid_org');
});

test('builds only GET inventory URLs on Azure DevOps hosts', () => {
  const url = buildAdoUrl('entitlements', 'evanbeer', '_apis/userentitlements', {
    'api-version': '7.1',
  });
  expect(url.origin).toBe('https://vsaex.dev.azure.com');
  expect(url.pathname).toBe('/evanbeer/_apis/userentitlements');
});

test('rejects caller-controlled API paths', () => {
  expect(() => buildAdoUrl('core', 'evanbeer', 'https://evil.example', {})).toThrow('invalid_path');
  expect(() => buildAdoUrl('core', 'evanbeer', '_apis/../admin', {})).toThrow('invalid_path');
});

test('maps Stakeholder licenses from entitlements', () => {
  expect(mapLicense('stakeholder', 'Stakeholder')).toBe('Stakeholder');
  expect(mapLicense('express', 'Basic')).toBe('Basic');
  const user = mapEntitlementToUser({
    id: 'abc',
    user: {
      descriptor: 'aad.ZGFuYQ',
      displayName: 'Dana Cole',
      mailAddress: 'dana@example.invalid',
      origin: 'aad',
    },
    accessLevel: { accountLicenseType: 'stakeholder', licenseDisplayName: 'Stakeholder' },
  });
  expect(user.license).toBe('Stakeholder');
  expect(user.id).toBe('user:aad.ZGFuYQ');
});

test('7.1 stable User Entitlements uses items, even when members is empty', () => {
  const rows = entitlementCollection({
    items: [dana, evan],
    members: [],
    continuationToken: null,
    totalCount: 2,
  });
  expect(rows).toHaveLength(2);
  expect(rows.map((row) => row.user?.displayName)).toEqual(['Dana Cole', 'Evan Hale']);
});

test('7.1-preview.3 User Entitlements uses members', () => {
  const rows = entitlementCollection({ members: [dana] });
  expect(rows).toHaveLength(1);
  expect(rows[0]?.user?.mailAddress).toBe('dana@example.invalid');
});

test('7.1-preview.1 User Entitlements uses value', () => {
  const rows = entitlementCollection({ value: [evan] });
  expect(rows).toHaveLength(1);
  expect(rows[0]?.user?.displayName).toBe('Evan Hale');
});

test('unknown entitlement wrappers yield no invented users', () => {
  expect(entitlementCollection({})).toEqual([]);
  expect(entitlementCollection(undefined)).toEqual([]);
});
