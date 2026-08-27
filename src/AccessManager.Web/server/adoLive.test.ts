import { buildAdoUrl, mapEntitlementToUser, mapLicense, resolveSandboxOrg } from './adoLive.ts';

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
