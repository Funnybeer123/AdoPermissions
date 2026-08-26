# Architecture Decision Records

ADRs capture choices that are expensive to reverse or important to safety.

## Status meanings

- **Proposed** — ready for stakeholder/implementation review.
- **Accepted** — implementation should follow it; changes require a superseding
  ADR.
- **Deprecated** — retained for history but no longer recommended.
- **Superseded** — replaced by a linked ADR.

## Index

| ADR | Status | Decision |
|---|---|---|
| [0001](0001-dotnet-10-lts.md) | Accepted | Use .NET 10 LTS |
| [0002](0002-modular-monolith-and-worker-boundaries.md) | Accepted | Modular monolith with separately deployed web, sync, and change runtimes |
| [0003](0003-bff-and-separated-workload-identities.md) | Accepted | Same-origin BFF and separate web/read/write identities |
| [0004](0004-azure-sql-generational-sync.md) | Accepted | Azure SQL with generation-based synchronization |
| [0005](0005-versioned-provider-capabilities.md) | Accepted | Pin API versions per endpoint and gate behavior by proven capability |
| [0006](0006-permission-authority-and-unknown.md) | Accepted | Namespace-specific evaluation with explicit authority and Unknown |
| [0007](0007-immutable-plans-outbox-and-service-bus.md) | Accepted | Immutable plans, transactional outbox, and Service Bus workers |
| [0008](0008-react-enterprise-ui-and-accessibility.md) | Proposed | React/Fluent/TanStack/React Flow with accessible alternatives |

The accepted status means the planning baseline selected the decision after
research. Phase 0 can supersede an ADR if live capability evidence disproves an
assumption.

## ADR template

```markdown
# NNNN — Title

Status: Proposed
Date: YYYY-MM-DD

## Context

What forces a choice?

## Decision

What is selected?

## Consequences

Positive, negative, operational, and security effects.

## Alternatives considered

Why were realistic alternatives not selected?

## Validation

What evidence/tests can confirm or invalidate the decision?
```
