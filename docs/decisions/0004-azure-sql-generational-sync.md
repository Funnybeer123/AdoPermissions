# 0004 — Azure SQL with generation-based synchronization

Status: Accepted  
Date: 2026-08-26

## Context

Interactive pages cannot call dozens of Azure DevOps endpoints. Enterprise
inventories are paged, caller-visibility-dependent, eventually consistent, and
can fail part way through. Migration planning also needs immutable evidence and
strong relational integrity.

The data is graph-shaped for explanation but heavily relational for scope,
search, ACL masks, audit, plans, and transactions.

## Decision

Use Azure SQL as the production system of record and EF Core for persistence.
Store direct graph edges and relational security facts; calculate closure/read
models in SQL/application logic.

Every authoritative sync stage writes a staging generation and promotes it
atomically only after all pages, visibility, and validation checks complete. A
partial or visibility-reduced stage retains the previous active generation and
reports degraded coverage. Absence is only a deletion candidate and requires
authoritative confirmation. Targeted refresh updates exact authoritative keys
but never infers global deletion.

Use SQL Server containers/Testcontainers for correctness tests. SQLite is
permitted only for an explicitly disposable read-only demo profile.

## Consequences

- Strong FKs, transactions, rowversion, outbox, indexing, backup/restore, and
  audit support.
- Generation storage and retention require capacity planning.
- Closure and access queries need representative performance testing.
- Azure SQL is not a native graph visualization engine; direct edges and bounded
  traversal are sufficient for MVP.
- Migrations must use expand/migrate/contract and not run on API startup.

## Alternatives considered

- **Live API fan-out:** rejected for latency, throttling, partial failure, and
  inability to bind plans to evidence.
- **Graph database:** rejected because no proven query need outweighs operational
  and transactional complexity; may be revisited after measurements.
- **Cosmos DB:** rejected because relational constraints/joins/audit/transactions
  dominate this workload.
- **SQLite everywhere:** rejected due to production concurrency/type/locking
  differences.

## Validation

- Partial stage never tombstones active rows.
- Complete-but-visibility-reduced stage is quarantined; only authoritative
  confirmation creates a provider-deleted tombstone.
- Full generation promotion is atomic under crash/failure injection.
- SQL integration tests prove organization isolation, rowversion, outbox, and
  append-only audit.
- Representative enterprise data meets ratified query/freshness/cost targets.
- Backup restore and regional recovery drills pass.
