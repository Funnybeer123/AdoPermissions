# 0005 — Version APIs per endpoint and gate by proven capability

Status: Accepted  
Date: 2026-08-26

## Context

Azure DevOps API maturity is uneven:

- many resource/security APIs are stable `7.1`
- Graph and membership APIs remain preview
- `7.2` documentation can map operations to preview revisions
- pagination differs by endpoint
- scopes in REST references do not prove a service principal's organization/
  resource permissions
- role scope/resource key formats are incomplete for some resources

A single global API version or generic REST client would hide meaningful
capability differences.

## Decision

- Pin the documented version on every operation.
- Prefer stable `7.1` over a newer preview when functionality is equivalent.
- Use endpoint-specific clients, paging, error, and rate behavior.
- Isolate preview APIs behind provider interfaces.
- Record `ProviderCapability` by organization, identity, feature, endpoint,
  version, read/write support, evidence date, and limitation.
- Require a live sandbox probe before enabling a real provider write.
- Degrade unsupported/changed capabilities explicitly; never substitute guessed
  paths/tokens based on web traffic.

## Consequences

- More adapter code than one generic client, but behavior is auditable/testable.
- Preview upgrades are localized.
- Organizations can show different capability states.
- Feature flags consume evidence rather than assuming documentation equals
  permission.
- API documentation/live behavior changes can disable a feature safely.

## Alternatives considered

- **Use latest global version:** rejected because endpoint preview status and
  contracts differ.
- **Use Azure DevOps .NET SDK for everything:** rejected because it does not
  remove REST version/coverage limitations and may obscure endpoint behavior.
- **Reverse-engineer Azure DevOps UI calls:** rejected as an unsupported
  production contract.
- **Enable every discovered namespace:** rejected because discovery does not
  prove token grammar or effective/write semantics.

## Validation

- Contract tests assert exact host/path/version/paging per endpoint.
- Unknown fields/enums and preview changes degrade explicitly.
- Read identity and write identity capability probes include negative cases.
- Namespace schema drift invalidates affected capability/plans.
- No provider mutation can run without current exact capability evidence.
