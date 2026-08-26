# 0007 — Immutable plans, transactional outbox, and Service Bus workers

Status: Accepted  
Date: 2026-08-26

## Context

Migration planning, approval, execution, and provider calls occur at different
times. Azure DevOps state can change between them. Queue delivery is at least
once, provider mutations have no universal idempotency key/transaction, and a
process can crash after a remote call but before recording the result.

Executing a mutable UI payload directly would make approval, replay protection,
audit, and recovery unreliable.

## Decision

- Persist every plan edit as an immutable version with canonical SHA-256 hash,
  exact evidence/preconditions, operations, comparisons, expiry, and evaluator
  versions.
- Approval binds the exact plan and expansion hashes and requires a different
  human.
- Store execution intent and an outbox message in one SQL transaction.
- Dispatch plan/execution IDs through Azure Service Bus.
- Change worker reloads authoritative SQL state and live provider state.
- Persist an audit-attempt event before each remote call.
- Reconcile ambiguous write results before retry (`InDoubt`).
- Use an organization execution lease in MVP and exact desired-state
  reconciliation for idempotency.

## Consequences

- Queue messages are small and nonauthoritative.
- Database/outbox/worker recovery is testable.
- Approval cannot silently follow a changed plan.
- State-machine and audit storage add implementation complexity.
- Azure DevOps remains a nontransactional external system; compensation can be
  manual-only.
- Service Bus and SQL availability are required for execution; writes fail
  closed when either authority/audit path is unavailable.

## Alternatives considered

- **Execute from API request:** rejected due to credential exposure, timeouts,
  and weak recovery.
- **Put full operation payload on queue:** rejected because it can diverge from
  approved/audited SQL state and leak sensitive data.
- **Rely on Service Bus duplicate detection:** rejected because it cannot prove
  remote desired state.
- **Blindly retry mutations:** rejected because a timed-out request may already
  have committed.
- **Distributed transaction with Azure DevOps:** unavailable.

## Validation

- Deterministic plan hash/edit/expiry/replay tests.
- Transactional outbox rollback/duplicate tests.
- Crash injection before/after every transition and provider call.
- Timeout before send/after commit reconciliation.
- Audit failure prevents call.
- Duplicate queue delivery cannot create a second active execution or broaden
  provider state.
