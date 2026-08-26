# 0003 — Same-origin BFF and separated workload identities

Status: Accepted  
Date: 2026-08-26

## Context

The React UI needs enterprise sign-in but never needs direct Azure DevOps API
access. Background sync should be deterministic and independent of a signed-in
administrator. Mutation capability has a much larger blast radius than reads.

Keeping Azure DevOps tokens in the browser or giving one backend identity every
permission would weaken token protection and least privilege.

## Decision

- Use a same-origin ASP.NET Core BFF with Entra authorization-code flow and PKCE.
- Issue secure HttpOnly application sessions with anti-CSRF protection.
- Never send Azure DevOps or Microsoft Graph tokens to the SPA.
- Use distinct managed identities for web, sync/read, and change/write.
- The web identity has no Azure DevOps rights.
- The sync identity has tested read-only Azure DevOps access.
- The change identity has only allowlisted membership and Project/Git write
  rights and is available only to the change worker.
- Production does not use PATs or legacy Azure DevOps OAuth.

On-behalf-of is deferred unless a future feature explicitly requires the signed-
in user's delegated Azure DevOps authority.

## Consequences

- Strong token and credential isolation.
- Every workload identity must be added, licensed, and authorized separately in
  every configured Azure DevOps organization.
- Application roles and Azure DevOps rights remain distinct.
- BFF session/CSRF/security patching becomes an application responsibility.
- Managed identities require same-tenant Azure hosting in the normal model.
- True separation requires separate deployments/RBAC; loading all identities in
  one process is prohibited.

## Alternatives considered

- **SPA calls Azure DevOps directly:** rejected due to browser token exposure,
  CORS/consent complexity, and inability to centralize sync/audit.
- **OBO for every call:** rejected because background inventory and deterministic
  execution should not vary with the interactive user's Azure DevOps rights.
- **Single service principal:** rejected because a compromised read/web runtime
  would inherit mutation blast radius.
- **PAT service account:** rejected for production security and lifecycle.

## Validation

- Browser/network tests show no Azure DevOps/Graph token.
- CSRF, session, issuer/audience, and role/scope tests pass.
- Web/sync identity cannot invoke mutation or obtain change credential.
- Read identity mutation probes fail.
- Change identity outside-scope probes fail.

References:

- [Azure DevOps authentication guidance](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/authentication-guidance?view=azure-devops)
- [Service principals and managed identities](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity?view=azure-devops)
