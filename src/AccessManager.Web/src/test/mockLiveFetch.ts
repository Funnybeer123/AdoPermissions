import { vi } from 'vitest';
import { liveGroups, liveOverview, liveProjects, liveUserDetails, liveUsers } from './liveFixture';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function mockLiveDisconnected() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes('/api/live/status')) {
      return json({
        connected: false,
        organization: 'evanbeer',
        reason: 'missing_pat',
        writes: false,
        configured: false,
      });
    }
    return json({ connected: false, organization: 'evanbeer', reason: 'missing_pat', writes: false }, 503);
  });
}

export function mockLiveConnected() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes('/api/live/status')) {
      return json({
        connected: true,
        organization: 'evanbeer',
        reason: 'ok',
        writes: false,
        configured: true,
      });
    }
    if (url.includes('/api/live/overview')) {
      return json(liveOverview);
    }
    if (url.includes('/api/live/users/')) {
      const id = decodeURIComponent(url.split('/api/live/users/')[1] ?? '');
      const user = liveUserDetails[id];
      return user ? json(user) : json({ title: 'User not found' }, 404);
    }
    if (url.includes('/api/live/users')) {
      return json(liveUsers);
    }
    if (url.includes('/api/live/groups')) {
      return json(liveGroups);
    }
    if (url.includes('/api/live/projects')) {
      return json(liveProjects);
    }
    return json({ title: 'Not found' }, 404);
  });
}
