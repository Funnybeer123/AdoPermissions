# Deployment and Operations Plan

Status: proposed  
Target: Azure, with production initially enforced read-only

## Environment topology

Use separate development, staging, and production subscriptions or strongly
isolated resource groups, identities, networks, databases, queues, Key Vaults,
and application registrations.

Production baseline:

| Component | Azure service |
|---|---|
| Edge | Front Door Premium and WAF |
| Web/BFF/API | App Service Premium v3, at least two instances, deployment slots |
| Operations/sync/change workers | Azure Container Apps, no public ingress |
| Database | Azure SQL General Purpose; zone redundancy where region/tier supports it |
| Messaging | Azure Service Bus Premium where private endpoint/isolation requirements apply |
| Secrets/certificates | Key Vault |
| Dynamic flags/config | App Configuration |
| Audit authority | WORM-capable Blob Storage; security-owned Log Analytics is an optional searchable copy |
| Telemetry | Application Insights and Log Analytics through OpenTelemetry |
| Images | Azure Container Registry |
| IaC | Bicep |

Redis, Azure AI Search, a graph database, and Kubernetes are deferred until
measurements demonstrate a need.

## Network

- Front Door is the only public entry point.
- App Service accepts Front Door/private administrative traffic according to
  policy.
- Workers expose no public ingress.
- SQL, Service Bus, Key Vault, App Configuration, Blob, and ACR use private
  endpoints/private DNS where supported.
- Egress permits required Entra login, Azure DevOps documented hosts, Azure
  control plane dependencies, and optional Microsoft Graph only when enabled.
- Azure DevOps organization/resource metadata never controls an outbound host.
- WAF, DDoS platform protection, TLS policy, and diagnostic logs are enabled.

## Workload identities

Separate managed identities:

```text
web identity
  App Service, SQL/API infrastructure only, no Azure DevOps

operations identity
  Outbox dispatch, audit export, approved App Configuration changes, and
  maintenance; no Azure DevOps

sync identity
  Sync Container App, minimum tested Azure DevOps inventory/ACL capability

change identity
  Change Container App, narrowly scoped Azure DevOps write capability

deployment identity
  GitHub Actions OIDC, only deployment-time Azure RBAC
```

Each identity has its own SQL/Service Bus/Key Vault/App Configuration roles.
The sync runtime cannot assign the change identity, and the web runtime cannot
enqueue an arbitrary provider operation.

## Required Entra configuration

- single-tenant user-facing app registration
- assignment required
- production/staging redirect and logout URIs
- application roles:
  - Viewer
  - Access Analyst
  - Migration Approver
  - Access Administrator
  - Application Administrator
- role-assignment groups with PIM for privileged roles
- reviewed bootstrap Application Administrator scope record; no UI self-grant
- Conditional Access and MFA
- user/group assignment governance and access reviews
- managed identities in the Azure DevOps-connected tenant
- optional Microsoft Graph app permission/consent kept disabled for MVP

If Microsoft Graph enrichment is later enabled, use a separate provider identity
and least privilege. Directory-wide permissions require explicit privacy/security
review and admin consent.

## Required Azure DevOps configuration per organization

1. Register canonical organization slug in Access Manager.
2. Add sync and change managed identities explicitly using their Enterprise
   Application object IDs.
3. Assign the necessary license/access level directly to each service principal.
4. Create custom Azure DevOps groups for tested read/write permissions rather
   than using Project Collection Administrators.
5. Grant sync identity only inventory and ACL visibility for approved projects.
6. Grant change identity only membership management and Project/Git permission
   management for allowed projects/resources. Application policy further limits
   writes to Project `GENERIC_READ` and Git `GenericRead`,
   `GenericContribute`, `CreateBranch`, and `CreateTag`.
7. Configure protected identities, system/admin groups, projects, repositories,
   and break-glass users.
8. Create a dedicated sandbox project/repository for capability validation.
9. Run and retain capability evidence.
10. Keep organization and all mutation flags disabled until review.

Service principals must be from the same connected tenant in the normal model.
If least privilege cannot support an operation, the operation remains manual.
Because Azure DevOps documents `vso.security_manage` for both ACL reads and
writes, Phase 0 must explicitly record whether the sync identity has unavoidable
residual mutation capability even though its runtime has no mutation client.

## Configuration hierarchy

Nonsecret configuration in App Configuration:

```text
READ_ONLY_MODE=true
WRITES_GLOBAL_ENABLED=false
organization:{id}:writes=false
organization:{id}:operation:add-membership=false
organization:{id}:operation:add-project-git-allow=false
organization:{id}:operation:remove-direct-bit=false
organization:{id}:operation:restore-direct-bit=false
provider endpoint versions
sync schedules/concurrency/budgets
freshness and plan-expiry policy
authorization-evidence:max-age=00:15:00  # initial proposal; ratify in Phase 0
retention/export policy
audit:max-export-lag=00:15:00   # initial proposal; ratify before writes
```

Static deployment configuration also determines whether the mutation provider
and change worker are deployed. Dynamic flags cannot enable code absent from the
deployment.

Azure App Configuration is authoritative for app-owned nonsecret dynamic flags
and policy values. The API records `ConfigurationChangeRequest` in SQL; the
Operations worker applies it with the expected App Configuration ETag and reads
back the observed version. Protected targets and mapping overrides are
authoritative SQL records with their own audited change workflows, not App
Configuration keys.

Configuration validation atomically rejects
`operation:remove-direct-bit=true` unless `operation:restore-direct-bit=true`
and current restoration capability evidence exist. Disabling restoration first
automatically disables forward removal. The absolute read-only/all-mutation kill
switch can still stop restoration; doing so during removal triggers the manual
partial-application incident procedure.

Secrets/certificates remain in Key Vault. Configuration retrieval failure makes
writes unavailable. Flag changes are audited and monitored.

## Infrastructure as code

Planned Bicep modules:

```text
/infra/bicep
  main.bicep
  /modules
    network.bicep
    front-door-waf.bicep
    app-service.bicep
    container-apps.bicep
    sql.bicep
    service-bus.bicep
    key-vault.bicep
    app-configuration.bicep
    storage-audit.bicep
    monitoring.bicep
    identities-rbac.bicep
  /environments
    dev.bicepparam
    staging.bicepparam
    prod.bicepparam
```

Requirements:

- no secret parameter outputs
- resource locks where appropriate
- diagnostic settings and retention
- private DNS and endpoint dependencies
- tags for owner, data class, environment, cost center
- Azure Policy/Defender compliance
- budgets and cost alerts
- `what-if` review before deployment

## Build and release

GitHub Actions uses OIDC federation to Azure; no long-lived deployment secret.

Build once:

1. restore locked dependencies
2. format/lint/build/test
3. security/IaC/dependency/license scans
4. generate OpenAPI compatibility report and TypeScript client
5. generate SBOM
6. build immutable web/API and worker artifacts/images
7. sign/attest artifacts and record source commit
8. publish to controlled registry

Promote the same artifact digest through staging and production. Do not rebuild
from a production branch tag with different dependencies.

Deployment:

1. IaC `what-if` and policy checks
2. backup/restore readiness and capacity checks
3. apply backward-compatible database migration job
4. deploy workers disabled/drained as required
5. deploy API to staging slot
6. smoke health/readiness/authz/read-only behavior
7. swap slot
8. enable sync worker and monitor generations
9. keep write worker/gates disabled
10. record deployment and capability versions

Production environment approval and separation from code authors are configured
according to organizational policy.

## Database migration policy

Use expand/migrate/contract:

- schema additions and compatible indexes first
- application versions support old/new shape during rolling deployment
- backfill through resumable bounded jobs
- validate counts/invariants
- remove old shape only in a later release

Migrations:

- run as a separate least-privileged deployment job
- do not run automatically on API startup
- are tested against representative database size and restored production-like
  sanitized data
- have lock/duration and rollback/forward-fix plans

Destructive migration requires explicit review and backup/restore evidence.

## Health and readiness

Liveness means the process loop is running. Readiness is component-specific:

- API can validate config and reach required SQL state
- sync worker can reach SQL/queue and has valid read configuration
- change worker additionally has all write gates disabled/enabled as expected,
  valid audit path, and capability state

Provider organization failures degrade that organization's freshness but do not
necessarily make the entire API unready. Status pages expose organization/stage
degradation only to authorized users.

No health response includes tenant, organization, descriptor, token, connection,
or secret detail.

## Observability and alerts

Dashboards:

- API availability/latency/error by safe route template
- SQL saturation, deadlocks, query regressions, storage growth
- Service Bus age, active/retry/dead-letter counts
- sync stage freshness/completeness/rate delay by internal organization ID
- provider capability and namespace drift
- plan/approval/expiry/stale-baseline counts
- write attempts, `InDoubt`, verification/compensation/rollback outcomes
- audit append/export lag
- identity/token acquisition failures

Alerts requiring runbooks:

- production write gate unexpectedly enabled
- write identity used outside approved worker/resource/time
- protected target attempt
- audit persistence/export failure
- any partially applied or rollback-failed execution
- sustained verification failure/Unknown increase
- dead-letter messages or stale critical data
- namespace schema drift
- Key Vault/App Configuration/SQL/Bus outage
- backup/restore or replication failure

Avoid PII and high-cardinality provider identifiers in metric dimensions.

## Operational runbooks

Create under `docs/runbooks/` before the relevant feature ships:

- provider throttling and prolonged 429
- Azure DevOps/Entra permission or token expiration
- organization capability degradation
- partial sync and continuation failure
- descriptor remapping/unresolved principals
- namespace/action drift
- queue dead letter/outbox backlog
- database/storage capacity
- audit store/export unavailable
- `InDoubt` mutation reconciliation
- replacement/final verification failure
- partial application and compensation
- write kill switch and identity disablement
- backup restore and regional recovery
- suspected identity/app compromise

Runbooks specify owner, symptoms/alerts, safe diagnosis, containment, recovery,
verification, communications, and evidence retention. They never instruct an
operator to bypass safety validation.

## Rollout

### Stage 1 — Internal fake/read model

- fake provider, no external credential
- security/authorization review
- accessibility and load baselines

### Stage 2 — Sandbox read-only

- read managed identity
- complete capability probes
- compare representative Project/Git results with Azure DevOps

### Stage 3 — Production read-only

- explicit registered organizations
- `READ_ONLY_MODE=true`
- validate freshness, coverage, audit, SLO, retention, and support

### Stage 4 — Sandbox writes

- separately deployed change worker/write identity
- exact membership and allowlisted Project/Git forward/restoration tests plus
  ManualOnly cleanup preview/observation
- direct-bit-suppressed replacement counterfactual
- failure injection, compensation, and kill-switch drills

### Stage 5 — Limited production pilot

- all read-only and production-write deployment acceptance items pass, including
  privacy, penetration/accessibility review, immutable audit, and DR exercise
- one approved organization/project
- low-risk supported operations and small operation cap
- two-person approval
- active monitoring and post-change review

### Stage 6 — Controlled expansion

- enable by organization and operation only after pilot evidence
- never globally enable unsupported namespaces
- revert to read-only on unexplained drift/failure

## Backup and disaster recovery

Stakeholders must approve numeric RPO/RTO, region, residency, and retention
before production. Planned controls:

- Azure SQL point-in-time restore and geo/zone strategy appropriate to targets
- Service Bus message recovery/dead-letter retention
- versioned App Configuration and IaC source
- Key Vault soft delete/purge protection
- immutable audit export replicated according to policy
- ACR artifact retention/replication

Test at least:

- isolated SQL point-in-time restore
- application recovery from SQL plus outbox/queue reconciliation
- audit chain/export verification
- region recovery/failover according to approved architecture

A recovered environment starts with all write gates disabled. Before writes can
resume:

1. verify database/audit integrity
2. reconcile outbox/queue and `InDoubt` executions
3. complete full/targeted provider refresh
4. re-probe capabilities and namespace schemas
5. expire plans based on pre-recovery baselines
6. exercise kill switch
7. obtain operational/security approval

## Decommissioning

- disable write/read identities in Azure DevOps first
- disable queues/workers and revoke federated deployment trust
- export/retain audit according to policy
- remove organization configuration and provider access
- delete/pseudonymize data according to approved retention/legal hold
- let backups/immutable storage expire through policy
- remove private endpoints/resources through reviewed IaC
- verify no PAT, app credential, service principal license, role, DNS, or alert
  remains orphaned

## Deployment acceptance

Read-only production:

- [ ] IaC, identity, network, auth, authorization, privacy, and audit review pass.
- [ ] Restore drill meets approved RPO/RTO.
- [ ] Representative load/cost and SLO targets pass.
- [ ] All provider organizations show explicit coverage/capability state.
- [ ] Production starts read-only and the API/worker fail closed.
- [ ] Support ownership, dashboards, alerts, and read-only runbooks are active.

Production write pilot:

- [ ] Every read-only production acceptance item remains satisfied.
- [ ] Separate change worker/identity and least privilege are verified.
- [ ] Sandbox safety suite and kill-switch/compromise drills pass.
- [ ] Immutable audit watermark, both phase-specific `InDoubt` paths, direct-bit
      restoration, ManualOnly cleanup, and partial-application runbooks are
      exercised.
- [ ] Direct-bit-suppressed counterfactual and final provider verification pass
      for every enabled action.
- [ ] Only one organization/project and exact operations are enabled.
- [ ] Post-pilot evidence is reviewed before any expansion.
