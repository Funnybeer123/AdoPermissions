# 0002 — Modular monolith with separate runtime boundaries

Status: Accepted  
Date: 2026-08-26

## Context

The product has one cohesive domain but three materially different security and
workload profiles:

- interactive read/plan API
- high-volume background inventory
- rare, sensitive Azure DevOps mutations

A single process would unnecessarily expose the write identity to web and sync
code. Independent microservices would add distributed contracts and operations
before domain boundaries are understood.

## Decision

Use one repository/release and shared Domain/Application modules, with separate
composition roots and deployments:

1. Web/BFF/API
2. Sync worker
3. Change worker

Enforce module references with architecture tests. The web and sync composition
roots cannot resolve `IAccessMutationProvider`; only the change worker can.
Workers communicate through SQL state, a transactional outbox, and Service Bus
job IDs.

## Consequences

- Credential and failure isolation without duplicating domain logic.
- One schema and release train simplify consistency.
- Workers can scale independently.
- Strict architecture tests and deployment identity controls are required.
- A database or release issue can still affect all runtimes; this is an accepted
  modular-monolith tradeoff.
- Modules can be extracted later only if measured ownership/scale needs justify
  it.

## Alternatives considered

- **One web process with hosted services:** rejected because it exposes write
  credential/composition and couples web restarts to long work.
- **Microservices per domain area:** rejected as premature distributed
  complexity and transaction/audit risk.
- **Serverless function per endpoint:** rejected because long sync generations,
  orchestration, and credential boundaries benefit from explicit workers.

## Validation

- Architecture tests reject forbidden references/composition.
- Deployment identity tests prove web/sync cannot acquire the write identity.
- End-to-end fake execution crosses outbox/queue/change worker.
- Worker termination/recovery and independent scaling tests pass.
