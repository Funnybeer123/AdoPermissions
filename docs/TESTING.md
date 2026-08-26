# Testing Strategy

Status: proposed

Correct permission interpretation and migration safety matter more than broad UI
coverage. Tests are organized around invariants, provider contracts, failure
recovery, and evidence from a dedicated Azure DevOps sandbox.

## Quality gates

Every pull request:

```text
format/lint
backend + frontend build
unit and architecture tests
provider contract tests
SQL integration tests
frontend component/accessibility tests
targeted Playwright E2E
SAST, dependency, secret, and IaC scans
SBOM generation
```

Scheduled/release gates add full browser, performance, chaos, backup/restore,
container scanning, and live-sandbox contract suites.

No production write flag can be enabled from CI alone. The exact deployed
version, identity type, organization capability, and live sandbox operation
must be approved.

## Test projects

```text
/tests
  /AccessManager.UnitTests
  /AccessManager.ArchitectureTests
  /AccessManager.ProviderContractTests
  /AccessManager.IntegrationTests
  /AccessManager.Web.Tests
  /AccessManager.E2E
  /AccessManager.PerformanceTests
```

| Project | Scope |
|---|---|
| UnitTests | Domain/application algorithms, tokens, masks, plans, state machine |
| ArchitectureTests | Module dependencies, provider DTO boundaries, mutation composition |
| ProviderContractTests | Sanitized wire fixtures, paging, errors, versions, fake parity |
| IntegrationTests | SQL Server, EF migrations, outbox, Service Bus abstraction, worker recovery |
| Web.Tests | React components/hooks with Testing Library, MSW, axe |
| E2E | Full API/web/fake provider through Playwright |
| PerformanceTests | API, sync, permission graph, SQL plans, browser list/graph budgets |

## Core invariants

Property/state-machine tests prove:

1. No direct-access removal can run before successful replacement verification.
2. No provider mutation can run without a durable audit-attempt event.
3. Executed plan hash equals the distinct approver's unexpired approved hash.
4. `Unknown` never authorizes a removal.
5. A retry cannot broaden an ACE mask.
6. Unknown, unrelated, system, and unselected bits remain unchanged.
7. A plan cannot target a protected principal/resource.
8. A partial provider page set cannot publish authoritative empty data.
9. A rollback cannot remove state that existed before its execution.
10. Cross-organization data cannot be joined or returned without explicit scope.
11. A completed page set after caller visibility loss cannot prove deletion.
12. Current effective access cannot prove replacement while selected direct bits
    remain; a suppressed counterfactual must independently Allow.
13. Application actors/role grants are never substituted with Azure DevOps
    principals.

## Unit and property tests

### Identity and membership

- Graph, storage-key, legacy, and origin identifiers remain distinct
- tenant/object/kind person correlation across organizations, ambiguity/relink,
  and no email auto-merge
- ApplicationActor and scoped role-grant current/revoked hash behavior
- descriptor remap creates history rather than a duplicate principal
- team correlates to one group principal/membership graph
- random membership DAGs
- cycles, self edges, duplicate edges, and duplicate paths
- depth/node/edge/query limits
- partial Entra graph and unresolved principals
- service principal inheriting from an Entra group while absent from Azure DevOps
  member listing; dynamic-group latency remains Unknown

### Namespace and permission

- Project token parse/build round trip
- Git project/repository token round trip and malformed tokens
- branch/unknown tokens are preserved but unsupported
- discovered action-mask decode
- signed/unsigned and maximum bit behavior
- unknown-bit preservation
- all-zero and synthetic filtered ACE behavior
- explicit Allow/Deny conflict
- resource inheritance and disabled inheritance
- group Deny versus Allow combinations
- administrator/system exception produces Unknown when unsupported
- provider-computed/local evaluation agreement and drift
- exact per-subject token walk and group result combination
- direct-bit-suppressed replacement counterfactual and surviving group path
- direct/group/team/Entra/resource-inherited classifications

### Analysis

- direct-assignment detection from stored ACE only
- risk classification for broad/admin/deny/unknown findings
- `SAME`, `GAINED`, `LOST`, `CHANGED`, `CHANGED_SOURCE`, `UNKNOWN`
- materiality and acknowledgement policy
- recommendation excludes protected/system groups
- permission similarity, not name similarity
- existing-group member blast radius
- deterministic safety-first recommendation ordering

### Plan and migration

- deterministic canonical JSON/hash across process/culture/time zone
- any plan edit invalidates approval
- plan creator/approver/execution-requester pairwise constraints and role evidence
- bounded AuthorizationEvidence app-role/scoped-grant/policy hashes, expiry and
  revocation-window behavior
- topological operation ordering
- operation precondition/inverse construction
- idempotent membership and permission operation
- exact-bit add/remove
- exact user-bit restoration and ManualOnly additive-cleanup preview/observation
- current/future-member governance acknowledgement and cohort hash
- state-machine legal/illegal transitions
- operation cap and feature/capability gates
- rollback ownership and reverse dependencies

Use property-based tests for masks, DAGs, operation sequences, hashes, and
state-machine transitions. Persist failing seeds.

## Provider contract tests

The Azure DevOps adapter is tested with sanitized official/recorded fixtures:

- endpoint-specific `api-version`
- expected host for Core, Graph, IMS, Entitlements
- request URL encoding without leaking descriptors into logs
- every documented pagination style
- continuation token containing reserved characters
- short page with continuation
- repeated/looping continuation
- fixed filters/order across pages
- unknown JSON fields and enum values
- empty versus forbidden/partial result
- human User Entitlements body continuation versus per-ID service-principal
  entitlement coverage
- identity descriptor translation
- ACL extended information and synthetic rows
- unknown namespace/action bits
- secret service endpoint and variable-group fields are discarded
- provider correlation IDs and safe error mapping

Error matrix:

```text
200 + Retry-After
200 + X-RateLimit-Delay
400 malformed/unsupported
401 expired/invalid token
403 forbidden/caller-visibility loss
404 absent/eventual visibility
408 timeout
409 conflict where exposed
429 with Retry-After
5xx transient
connection lost before send / after send
malformed/truncated body
```

Reads can retry under bounded policy. Mutation contract tests assert there is no
generic retry handler and ambiguous results force reconciliation.

The fake provider must pass the same provider behavior contract where
applicable.

## SQL integration tests

Use SQL Server Testcontainers, not EF InMemory and not SQLite, for correctness:

- all EF migrations up/down policy and fresh-database apply
- composite organization foreign keys and query isolation
- unique active external identifiers and membership edges
- rowversion/optimistic concurrency
- stage generation promotion and active pointer
- partial stage cannot tombstone
- complete generation after permission/visibility loss is quarantined
- direct 403 produces VisibilityLost; authoritative 404 can produce
  ProviderDeleted
- targeted refresh deletion boundary
- membership closure rebuild
- namespace schema drift invalidation
- transactional outbox commit/rollback
- worker leases and duplicate job handling
- append-only audit database permissions/hash chain
- configuration-change rowversion/ETag workflow and protected-target
  initiator/approver constraint
- mapping-override second-approval, validity history and transactional
  read-model/plan invalidation
- plan/approval/execution uniqueness and expiration
- crash/restart at every migration transition
- retention/pseudonymization jobs

Never make integration tests pass by weakening production constraints.

## Fake provider and Contoso data

Deterministic organization:

```text
Contoso
  Project Alpha
  Project Beta
  Project Gamma

Users
  Evan
  Alice
  Bob
  Charlie

Groups
  ADO-Alpha-Developers
  ADO-Alpha-Readers
  ADO-Platform-Admins
  ADO-Beta-Developers
```

Required scenarios:

- direct Project and repository access
- native group and team access
- Entra-backed group and nested groups
- same-level Allow/Deny conflict
- parent/child resource inheritance
- explicit direct and group Deny
- unresolved descriptor and raw token
- unknown action bit
- administrative/high-risk permission
- duplicate/single-user/empty group findings
- candidate group with exact coverage
- candidate group with loss
- candidate group with target-user gain
- group permission change with existing-member gain
- pipeline/environment facts for unsupported-state UX

Fault controls:

- page size and continuation style
- 200 delayed response and 429
- fail on selected page/call
- eventual membership/ACE visibility
- concurrent external state mutation
- caller visibility loss after a complete prior generation
- timeout before/after commit
- worker termination hook
- descriptor remap
- namespace/action drift

State and clock are seeded. Test IDs and ordering are stable.

## Migration safety matrix

At minimum:

| Scenario | Expected behavior |
|---|---|
| Existing access equals proposed | Plan may proceed; source becomes group-derived |
| Current direct ACE alone supplies access | Suppressed replacement counterfactual fails; block before removal |
| Proposed group provides less | Block |
| Proposed group provides more | Require exact acknowledgement; admin gain may block by policy |
| User direct Deny selected | Block automatic migration/removal |
| Group contains Deny | Compare; any loss/unknown blocks |
| Nested native groups | Resolve and explain |
| Entra path incomplete | Unknown; block destructive action |
| Group change affects members | Show cohort impact and require acknowledgement |
| Member joins around group ACE write | Cohort recheck plus approved all-current/future-member policy; otherwise group modification is blocked |
| State changed after planning | Mark plan stale |
| State changed immediately before operation | Stop on precondition |
| Desired edge/bit already exists | `NO_CHANGE`, audit, continue |
| Add replacement succeeds, verify fails | Keep direct access; ReplacementVerificationFailedSafe + ManualCleanupRequired |
| Mutation response lost but committed | Reconcile, record recovered success |
| Mutation response lost and not committed | Retry only after reconciliation and bounded policy |
| Direct removal partly succeeds | Partially applied; restore exact captured bits |
| Crash leaves removal outcome unknown | Reconcile every selected bit; restore confirmed-absent bits only |
| Exact bit remains Unknown after bounded reads | Do not blind-write; CompensationFailed/manual incident |
| Final verification fails | Compensate access first |
| Direct user bit was removed | Restore the exact captured bit and verify before any cleanup |
| Added group bit/membership pre-existed | Rollback must not remove it |
| External actor adds identical bit/edge in race window | Ownership is ambiguous; cleanup is ManualOnly |
| New group member relies on candidate cleanup bit | Preview shows loss/Unknown and remains ManualOnly |
| Successful migration is later rolled back | New approval restores exact direct bits, verifies, then requires manual additive cleanup |
| Compensation precondition changed | Stop/manual escalation; do not overwrite external state |
| Audit attempt cannot persist | No provider call |
| Audit result missing after crash | `InDoubt` recovery and live reconciliation |
| Kill switch changes mid-run | Stop before next operation |
| Removal flag enabled without restoration | Configuration/preflight rejects it |
| Namespace schema changes | Block and invalidate capability |

Run the matrix against fake provider and supported live sandbox operations.

## API tests

- authentication/unauthenticated behavior
- every role × organization/project scope × endpoint
- ApplicationActor/scoped-grant revalidation and Azure DevOps-principal
  substitution denial
- fresh app-role authorization evidence, expiry, local revoke/policy change, and
  no raw-token persistence
- IDOR with valid IDs from another organization
- person aggregation authorizes each linked organization and reports omitted/
  ambiguous coverage
- RFC 9457 error shape and safe diagnostics
- opaque cursor, maximum page, sort/filter validation
- freshness/coverage metadata
- conditional app-owned update with ETag/rowversion
- command idempotency and duplicate submission
- CSRF for every state-changing endpoint
- plan hash/approval/execution gates
- persisted creator/approver/requester actor/evidence attribution
- dynamic-setting request/App Configuration conflict and two-person
  protected-target removal
- mapping propose/approve/expire, high-impact second admin and invalidation status
- rate limits for search, refresh, export, plan, approval, execution
- exports neutralize CSV formula values and enforce limits
- OpenAPI breaking-change check and generated TypeScript client compile

## Frontend, accessibility, and browser tests

Component tests:

- loading, empty, error, stale, partial, unsupported, and permission-denied states
- Allow/Deny/NotSet/Unknown text/icon semantics
- no color-only meaning
- server-paged tables and cancellation
- plan gains/losses/unknowns/cohort acknowledgement
- verification/execution status announcements
- safe diagnostics and no token/raw-secret rendering

Accessibility baseline: WCAG 2.2 AA.

- automated axe checks
- keyboard-only route and dialogs
- visible focus and logical focus order
- screen-reader labels/live regions
- 200% zoom/reflow
- high contrast and reduced motion
- graph has equivalent semantic tree/table
- virtualized tables retain meaningful headers/row context

Playwright E2E:

- find Evan by email and open the authorized cross-organization person graph
- inspect why a repository permission exists
- switch user/group/project views
- filter direct/denied/admin findings
- compare group candidates and cohort impact
- create a dry-run plan
- requester cannot self-approve
- approver can approve exact plan
- read-only mode prevents execution at UI and API
- enabled fake execution follows add/verify/remove/verify timeline
- targeted refresh updates freshness

Support current organization-approved versions of Chromium and Edge; Firefox
coverage is evaluated based on user requirements. Browser policy is ratified
before production.

## Live Azure DevOps sandbox

A dedicated nonproduction organization/project/repository is mandatory. Tests
must not target a production organization.

Read proofs:

- read identity can access only configured test resources
- user entitlement, Graph, team, repository, namespace, ACL paging
- descriptor/storage-key/legacy round trips for all principal kinds
- Project/Git token and action schema
- representative effective results compared with Azure DevOps UI
- Permissions Report comparison for Git cases

Write proofs:

- sync runtime has no mutation client; identity-level mutation probes either fail
  or record an explicitly reviewed residual ACL capability
- write identity cannot mutate outside allowlisted sandbox scope
- membership add/check and raw probe cleanup; app executor exposes no automatic
  membership removal
- additive Project `GENERIC_READ` and each allowlisted Git bit
- exact selected-bit removal
- exact selected-bit restoration
- cleanup ownership ambiguity and current-cohort gates
- unrelated/unknown bit preservation
- direct-bit-suppressed replacement and final provider verification
- cohort race injection and current/future-member policy
- concurrent external change detection
- propagation timing and bounded timeout
- process termination/recovery after every remote call

Sanitize and review any fixture captured from the sandbox before committing it.

## Performance and scale

Representative target data:

- thousands of users
- hundreds of groups
- hundreds of projects
- thousands of repositories/resources
- large ACL sets and membership graphs

Measure:

- full and incremental sync throughput/TSTU behavior
- closure rebuild and user access analysis
- direct finding and recommendation queries
- recommendation candidate/cohort/time budgets and partial-result latency
- SQL query plans, logical reads, index use, and database growth
- API p50/p95/p99 under server pagination
- browser memory/interaction for large tables
- graph ceiling (500 visible nodes/1,000 edges) and progressive expansion
- export limits and queue backpressure

Define numeric SLO/capacity pass criteria after a representative benchmark,
before production approval. Do not invent them without deployment/user needs.

## Resilience, chaos, and recovery

- SQL unavailable during API command and worker transition
- Service Bus delay, duplicate, dead-letter, and outage
- Key Vault/App Configuration unavailable (writes fail closed)
- provider throttling and prolonged 5xx
- worker scale-out and termination
- outbox dispatch crash
- operations-worker/outbox failure and immutable audit export watermark beyond
  the write-gate threshold
- backup restore to an isolated environment
- regional recovery starts in read-only mode

Prove recovery point/time objectives after stakeholders ratify them. A backup
policy is not evidence of recoverability without restore drills.

## Security and privacy tests

- authorization matrix and privilege escalation
- session fixation, CSRF, CORS, CSP, cookie flags
- SSRF attempts through org/resource/service endpoint metadata
- SQL/filter injection and output encoding
- sensitive log/trace/metric snapshot scan
- token/header/query/body redaction
- no service endpoint authorization or variable values in DB/telemetry
- fake/PAT provider rejected in production
- audit update/delete denied
- retention/pseudonymization and backup policy review
- SAST, SCA, secret scan, IaC/container scan, SBOM/provenance
- penetration test before production and before enabling writes

## Test data rules

- No production identity, ACL, token, membership, email, or resource data in
  fixtures.
- Use synthetic deterministic IDs and `example.invalid` addresses.
- Sanitization must remove display names, URLs, descriptors, tokens, correlation
  values, service endpoint metadata, and secrets.
- Snapshot tests require human-readable review and avoid enormous payloads.
- Test clocks and random seeds are controlled.

## Definition of done for a feature

- expected behavior and failure modes are documented
- unit/property tests cover domain invariants
- provider contract changes have fixtures and unknown-field tests
- SQL behavior is tested against SQL Server where applicable
- authorization, organization isolation, and audit are tested
- UI states and accessibility are tested
- telemetry is present and redaction-tested
- docs/OpenAPI/runbooks are updated
- no skipped/flaky test is accepted without an owner and explicit issue
- live capability evidence exists before a provider write can be enabled
