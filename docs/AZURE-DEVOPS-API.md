# Azure DevOps API Research and Capability Map

Status: planning baseline  
Research date: 2026-08-26  
Target: Azure DevOps Services (cloud), not Azure DevOps Server

This document pins the API contracts that the Access Manager may use. It is not
evidence that an endpoint works with the application's eventual identity in
every organization. Phase 0 must run the capability probes in a disposable
Azure DevOps organization before implementation or production writes.

## Rules

1. Prefer an official, generally available API at `7.1`.
2. Pin the version per operation. Do not set one version globally.
3. Isolate preview APIs behind provider interfaces and capability flags.
4. Treat list responses as permission-trimmed unless Microsoft explicitly says
   otherwise.
5. Preserve continuation tokens as opaque, URL-encoded values.
6. Keep Azure DevOps Graph descriptors, legacy identity descriptors, storage
   keys, and Entra object IDs as distinct identifier types.
7. Do not infer an unsupported endpoint or token format from Azure DevOps web
   traffic.
8. Do not enable a write merely because the REST reference documents it. The
   target namespace, resource, action, and identity must all be allowlisted.

## Hosts and authentication

| Area | Base URL |
|---|---|
| Core, Git, Build, Security | `https://dev.azure.com/{organization}` |
| Graph and Identity (IMS) | `https://vssps.dev.azure.com/{organization}` |
| Member entitlements | `https://vsaex.dev.azure.com/{organization}` |
| Profile and account discovery | `https://app.vssps.visualstudio.com` |

Production workloads use Microsoft Entra tokens. The Azure DevOps resource is:

```text
Application/resource ID: 499b84ac-1321-427f-aa17-267ca6975798
Resource URI:            https://app.vssps.visualstudio.com
Managed identity scope:  https://app.vssps.visualstudio.com/.default
```

Azure DevOps does not authorize service principals through Entra application
permissions. A managed identity or service principal must be explicitly added,
licensed, and granted Azure DevOps permissions in each organization. The
Enterprise Application service-principal object ID—not the app-registration
object ID—is used when adding it.

The scope names below are the delegated/PAT scopes advertised by the REST
references. They do not replace Azure DevOps organization membership, access
level, groups, or resource ACLs for an application identity.

| Capability | Read scope | Write scope |
|---|---|---|
| Profile/account discovery | `vso.profile` | none |
| Member entitlements | `vso.memberentitlementmanagement` | `vso.memberentitlementmanagement_write` |
| Projects/teams | `vso.project` (some Core reads also accept `vso.profile`) | `vso.project_write`; project lifecycle uses `vso.project_manage` |
| Graph users/groups/memberships | `vso.graph` | `vso.graph_manage` |
| Legacy identity resolution | `vso.identity` | not used |
| Security ACLs and roles | No narrower read-only scope is documented | `vso.security_manage` |
| Repositories | `vso.code` | `vso.code_manage` |
| Builds/pipelines | `vso.build` | `vso.build_execute` |
| Environments | `vso.environment_manage` | `vso.environment_manage` |
| Service endpoints | `vso.serviceendpoint` | `vso.serviceendpoint_manage` |
| Variable groups | `vso.variablegroups_read` | `vso.variablegroups_manage` |
| Pipeline resource authorization | `vso.build` | `vso.pipelineresources_manage` |

Legacy Azure DevOps OAuth is deprecated. New registrations stopped in April
2025 and Microsoft scheduled removal during 2026. New development must use
Microsoft Entra authentication. A PAT is permitted only for short-lived local
prototyping and must be rejected by production configuration.

## MVP API mapping

### Organization registry

| Purpose | Operation | Version | Paging | MVP use |
|---|---|---:|---|---|
| Current delegated-user profile | `GET https://app.vssps.visualstudio.com/_apis/profile/profiles/me` | `7.1` | none | Development/onboarding only |
| Organizations associated with a delegated user | `GET https://app.vssps.visualstudio.com/_apis/accounts?memberId={profileId}` | `7.1` | none documented | Optional convenience only |

There is no supported application-identity API that discovers every Azure
DevOps organization a service principal can access. Production uses an explicit
organization registry, validates each canonical URL, records the tenant, and
runs a least-privilege connectivity probe. Accounts returned in delegated user
context are not a tenant-wide inventory.

Sources: [Profiles - Get][profiles-get], [Accounts - List][accounts-list].

### Users and service principals

| Purpose | Operation | Version | Paging | Notes |
|---|---|---:|---|---|
| Entitled human-user roster | `GET https://vsaex.dev.azure.com/{org}/_apis/userentitlements` | `7.1` | Body `continuationToken` | Stable primary roster; includes license/status/last-access metadata |
| Azure DevOps Graph users | `GET https://vssps.dev.azure.com/{org}/_apis/graph/users` | `7.1-preview.1` | `X-MS-ContinuationToken` response header | Authorization principals and descriptors |
| Azure DevOps Graph service principals | `GET .../_apis/graph/serviceprincipals` | `7.1-preview.1` | continuation header | Supplement to user entitlements |

User Entitlements is the most reliable stable organization member/license
inventory, but it is not a complete authorization graph. Join it to Graph users
and service principals by stable IDs. A missing row can also reflect caller
visibility, so coverage must be reported.

The Graph list contains materialized Azure DevOps subjects, not every user or
group in the Entra tenant. User creation through Azure DevOps Graph materializes
an existing Entra/MSA identity; it does not create a directory account.

Sources: [Search User Entitlements][user-entitlements],
[Graph Users - List][graph-users], [Graph Service Principals - List][graph-sps].

### Projects, teams, groups, and memberships

| Feature | Operation | Version | Paging | Read/write |
|---|---|---:|---|---|
| Projects | `GET /_apis/projects` | `7.1` | `$top`, `$skip`, `continuationToken` | Read MVP; lifecycle excluded |
| Project teams | `GET /_apis/projects/{projectId}/teams?$expandIdentity=true` | `7.1` | `$top`/`$skip` | Read |
| Team members | `GET /_apis/projects/{projectId}/teams/{teamId}/members` | `7.1` | `$top`/`$skip` | Read |
| All teams | `GET /_apis/teams` | `7.1-preview.3` | `$top`/`$skip` | Avoid; enumerate stable project-scoped teams |
| Graph groups | `GET https://vssps.../_apis/graph/groups` | `7.1-preview.1` | `X-MS-ContinuationToken` | Read MVP; create deferred |
| Direct memberships | `GET .../_apis/graph/memberships/{descriptor}?direction={up|down}&depth=1` | `7.1-preview.1` | none documented | Read |
| Exact membership | `GET .../_apis/graph/memberships/{subject}/{container}` | `7.1-preview.1` | none | Verification |
| Add membership | `PUT .../_apis/graph/memberships/{subject}/{container}` | `7.1-preview.1` | n/a | Narrow write phase |
| Remove membership | `DELETE .../_apis/graph/memberships/{subject}/{container}` | `7.1-preview.1` | n/a | Narrow write phase |

Projects and repositories are permission-trimmed. Graph membership depth is
only one; transitive membership must be traversed from direct edges with cycle,
depth, node, and query limits. Core Teams has no team-member mutation endpoint.
A team is backed by a Graph group, so membership changes use Graph Memberships
after descriptor resolution.

Entra-backed group membership is not modified through Azure DevOps. If complete
Entra transitive membership is required, use the separately consented Microsoft
Graph provider. Without it, show incomplete coverage and block destructive
automation affected by that gap.

Sources: [Projects - List][projects-list], [Teams - Get Teams][teams-list],
[Teams - Get Members][team-members], [Graph Groups - List][graph-groups],
[Graph Memberships][graph-memberships].

### Descriptor translation

| Conversion | Operation | Version |
|---|---|---:|
| Storage key/VSID to Graph descriptor | `GET .../_apis/graph/descriptors/{storageKey}` | `7.1` |
| Graph descriptor to storage key/VSID | `GET .../_apis/graph/storagekeys/{descriptor}` | `7.1` |
| Batch Graph subject lookup | `POST .../_apis/graph/subjectlookup` | `7.1-preview.1` |
| Graph/legacy descriptor or UUID to legacy identity | `GET .../_apis/identities?subjectDescriptors=...&descriptors=...&identityIds=...` | `7.1` |

Security ACEs use legacy identity descriptors. Graph APIs use Graph subject
descriptors. They are not interchangeable. Persist:

```text
organization
storageKey (identity UUID/VSID)
graphDescriptor
legacyIdentityDescriptor
origin
originId
tenantId
subjectKind
validFrom / validTo
```

Descriptors and `originId` can change after identity relinking. Email, UPN, and
display name are mutable lookup attributes only.

Sources: [Descriptors - Get][descriptor-get],
[Storage Keys - Get][storage-key-get], [Read Identities][read-identities],
[Subject Lookup][subject-lookup].

### Repositories

| Purpose | Operation | Version | Paging |
|---|---|---:|---|
| List repositories | `GET /{project}/_apis/git/repositories?includeHidden=true` | `7.1` | none documented |
| Get repository | `GET /{project}/_apis/git/repositories/{repositoryId}` | `7.1` | n/a |

Repository APIs inventory resources. User/group permissions are obtained from
the Git Repositories security namespace, not from repository DTOs.

Source: [Repositories - List][repositories-list].

### Security namespaces, ACLs, and ACEs

| Purpose | Operation | Version | Notes |
|---|---|---:|---|
| Discover namespaces/actions | `GET /_apis/securitynamespaces` | `7.1` | No paging |
| Query ACLs | `GET /_apis/accesscontrollists/{namespaceId}` | `7.1` | Filters: token, descriptors, recurse, extended info; no paging |
| Add/update ACE | `POST /_apis/accesscontrolentries/{namespaceId}` | `7.1` | Write phase; exact masks and preconditions |
| Remove selected permission bits | `DELETE /_apis/permissions/{namespaceId}/{permissionBits}` | `7.1` | Preferred removal primitive |
| Remove whole ACE | `DELETE /_apis/accesscontrolentries/{namespaceId}` | `7.1` | Exceptional; too broad for routine migration |
| Replace ACL | `POST /_apis/accesscontrollists/{namespaceId}` | `7.1` | Do not use for routine migration |

Namespace metadata supplies action names/bits, `separatorValue`,
`elementLength`, `isHierarchical`, and system masks. Discover and version it;
do not scatter permission constants through UI code.

`includeExtendedInfo=true` may return `effectiveAllow`, `effectiveDeny`,
`inheritedAllow`, and `inheritedDeny`. Microsoft explicitly states that the
inherited masks exclude groups containing the identity. Extended information
therefore helps with resource-token inheritance but does not by itself explain
all group-derived access.

An ACE under the selected user's exact legacy descriptor is direct. A
descriptor-filtered query can synthesize zero-valued entries; direct-assignment
detection must inspect stored, unfiltered `acesDictionary` entries.

ACL queries have no documented paging. MVP sync builds deterministic Project
and repository tokens and queries those tokens rather than dumping an
unbounded namespace.

Sources: [Security Namespaces - Query][security-namespaces],
[ACL Query][acl-query], [Set ACEs][set-aces],
[Remove Permission][remove-permission], [Namespace reference][namespace-ref].

### Effective permission oracles

| API | Version | What it can prove | Limitation |
|---|---:|---|---|
| ACL query with extended info | `7.1` | Provider-computed masks for one ACE identity/token | Does not provide complete group provenance |
| Has Permissions / evaluation batch | `7.1` | Whether the calling identity has requested bits | Cannot evaluate an arbitrary selected user |
| Permissions Report | `7.1` | Asynchronous effective report for supported Git/TFVC/release resources and descriptors | Not a universal Project/Build/resource evaluator; broad scope |

The Permissions Report supported resource types must be checked against the
live schema. It is a useful Git verification oracle, not the application's sole
permission engine. No public API authoritatively evaluates every Azure DevOps
permission for an arbitrary principal.

Sources: [Has Permissions][has-permissions],
[Has Permissions Batch][has-permissions-batch],
[Permissions Report][permissions-report].

## Post-MVP resource APIs

These APIs are mapped now so the data model does not preclude them. They are not
part of the initial Project/Git permission implementation.

| Resource | Inventory API | Version | Paging | Permission model / limitation |
|---|---|---:|---|---|
| Build definitions | `GET /{project}/_apis/build/definitions` | `7.1` | `$top` + continuation | Build ACL namespace; next stable adapter |
| Pipelines | `GET /{project}/_apis/pipelines` | `7.1` | `$top` + continuation | Inventory only; permissions are not pipeline-run records |
| Environments | `GET /{project}/_apis/distributedtask/environments` | `7.1` | `$top` + token; token response channel needs contract test | Role based; no narrow read scope |
| Service endpoints | `GET /{project}/_apis/serviceendpoint/endpoints` | `7.1` | none documented | Role based; authorization secrets are unavailable and must never be stored |
| Variable groups | `GET /{project}/_apis/distributedtask/variablegroups` | `7.1` | Integer continuation + stable order | Role based; secret values return null and must never be stored |
| Security role definitions/assignments | `/ _apis/securityroles/scopes/{scopeId}/...` (without the space) | `7.1-preview.1` | none documented | Scope/resource-key grammar is incompletely documented |
| Pipeline resource authorization | `GET/PATCH /{project}/_apis/pipelines/pipelinepermissions/...` | `7.1-preview.1` | none documented | Controls pipeline use of a resource, not human/group access |

Role APIs use `scopeId`, `resourceId`, `identityId`, and `roleName`; the identity
is a UUID/storage key rather than an arbitrary Graph descriptor. Official
references do not completely specify every environment, service endpoint, or
library resource key. These writes stay disabled until a sandbox capability
test proves list, set, read-back, and compensation for the exact resource type.

Never round-trip a service endpoint or variable-group GET body into PUT. Secret
fields are intentionally redacted and cannot be backed up or reconstructed.

Sources: [Build Definitions][build-definitions], [Pipelines][pipelines],
[Environments][environments], [Service Endpoints][service-endpoints],
[Variable Groups][variable-groups], [Security Roles][security-roles],
[Pipeline Permissions][pipeline-permissions].

## Security namespace boundary

| Namespace | ID | MVP status |
|---|---|---|
| Project | `52d39943-cb85-4d7f-8fa8-c6baac873819` | Required read/analysis; narrow write after proof |
| Git Repositories | `2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87` | Project/repository tokens required; branch excluded |
| Build | `33344d9c-fc72-4d6f-aba5-fa317101a7e9` | Post-MVP stable ACL adapter |
| Environment | `83d4c2e6-e57d-4d6e-892b-b87222b7ad20` | Post-MVP role adapter |
| ServiceEndpoints | `49b48001-ca20-4adc-8111-5b60c903a50c` | Post-MVP role adapter |
| Library | `b7e84409-6553-448a-bbb2-af228e07cbeb` | Post-MVP role adapter |

Known documented tokens:

```text
Project root:       $PROJECT
Project:            $PROJECT:vstfs:///Classification/TeamProject/{projectId}
Git project:        repoV2/{projectId}
Git repository:     repoV2/{projectId}/{repositoryId}
Build project:      {projectId}
Build definition:   {projectId}/{definitionId}
```

Git branch token encoding is documented separately and is deliberately excluded
from MVP. The application must preserve raw tokens even when it cannot parse
them.

## Pagination and rate handling

Pagination is endpoint-specific:

- Graph users/groups/service principals: consume `X-MS-ContinuationToken`.
- User entitlements: consume the body `continuationToken`.
- Projects: preserve `$top`, `$skip`, and continuation behavior.
- Teams/members: offset page with `$top`/`$skip`.
- Builds/pipelines: preserve filters and ordering with opaque continuation.
- Variable groups: preserve deterministic `queryOrder` with integer token.
- Repositories, memberships, namespaces, ACLs, service endpoints, and role
  assignments have no documented paging; absence of paging is not permission
  to issue unbounded broad queries.

Do not infer completion from a short page where the API documents a continuation
token. Persist checkpoints only at complete page boundaries.

Azure DevOps uses throughput units (TSTUs), with a documented global limit of
200 TSTUs per identity in a sliding five-minute window. Handle:

```text
Retry-After
X-RateLimit-Delay
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-RateLimit-Cost
HTTP 429
```

`Retry-After` can accompany a successful HTTP 200. In that case, do not repeat
the successful request; pause subsequent calls. On 429, wait as directed and
retry a safe read with bounded jitter. A timed-out write is never blindly
retried—reconcile live state first.

Source: [Rate and usage limits][rate-limits].

## Phase 0 capability probes

For each configured organization, record a `ProviderCapability` result with
endpoint, pinned version, identity, timestamp, outcome, and evidence:

- [ ] Read identity can acquire an Entra token and reach only registered orgs.
- [ ] User Entitlements plus Graph users/service principals gives expected
      roster coverage.
- [ ] Project, project-team, group, membership, and repository paging completes.
- [ ] Graph-to-legacy descriptor translation round-trips representative users,
      native groups, Entra groups, teams, and service principals.
- [ ] Project and Git namespace definitions match tested action expectations.
- [ ] Exact Project/repository ACL queries return expected ACEs and extended
      information.
- [ ] Permissions Report can validate the selected Git cases.
- [ ] Read identity cannot mutate membership or ACL state.
- [ ] Write identity cannot read or write outside the sandbox allowlist.
- [ ] A harmless sandbox membership add/read/remove is idempotent.
- [ ] A harmless Project/Git bit add/read/remove preserves unrelated and unknown
      bits.
- [ ] 403, partial paging, 429, delayed 200, timeout, and unknown JSON members
      are represented as explicit capability/coverage outcomes.

No production mutation feature is eligible for enablement until its exact probe
passes with the production authentication type.

## Known limitations and non-assumptions

1. A service principal cannot discover all its organizations; configure them.
2. Graph lists are not an Entra tenant inventory.
3. Email is not a principal key.
4. Graph and legacy descriptors are not interchangeable.
5. Lists are permission-trimmed; absence is not proof of nonexistence.
6. No universal arbitrary-user effective-permission endpoint exists.
7. Extended ACL masks do not reveal every group path.
8. Graph identity and membership endpoints are unavoidable preview dependencies.
9. Role resource key formats are not fully documented.
10. Pipeline resource authorization is distinct from user/group authorization.
11. Redacted secrets cannot be compared or rolled back.
12. Azure DevOps writes have no universal transaction, ETag, or idempotency-key
    contract.
13. Preview APIs can change or be retired; capability failure must degrade
    safely rather than silently changing behavior.
14. Last-access data from User Entitlements is useful context, not sufficient
    evidence by itself for automatic stale-access removal.

## Official references

[accounts-list]: https://learn.microsoft.com/en-us/rest/api/azure/devops/account/accounts/list?view=azure-devops-rest-7.1
[acl-query]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1
[build-definitions]: https://learn.microsoft.com/en-us/rest/api/azure/devops/build/definitions/list?view=azure-devops-rest-7.1
[descriptor-get]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1
[environments]: https://learn.microsoft.com/en-us/rest/api/azure/devops/distributedtask/environments/list?view=azure-devops-rest-7.1
[graph-groups]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1
[graph-memberships]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1
[graph-sps]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/service-principals/list?view=azure-devops-rest-7.1
[graph-users]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/list?view=azure-devops-rest-7.1
[has-permissions-batch]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/permissions/has-permissions-batch?view=azure-devops-rest-7.1
[has-permissions]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/permissions/has-permissions?view=azure-devops-rest-7.1
[namespace-ref]: https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops
[permissions-report]: https://learn.microsoft.com/en-us/rest/api/azure/devops/permissionsreport/?view=azure-devops-rest-7.1
[pipeline-permissions]: https://learn.microsoft.com/en-us/rest/api/azure/devops/approvalsandchecks/pipeline-permissions/get?view=azure-devops-rest-7.1
[pipelines]: https://learn.microsoft.com/en-us/rest/api/azure/devops/pipelines/pipelines/list?view=azure-devops-rest-7.1
[profiles-get]: https://learn.microsoft.com/en-us/rest/api/azure/devops/profile/profiles/get?view=azure-devops-rest-7.1
[projects-list]: https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1
[rate-limits]: https://learn.microsoft.com/en-us/azure/devops/integrate/concepts/rate-limits?view=azure-devops
[read-identities]: https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1
[remove-permission]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/permissions/remove-permission?view=azure-devops-rest-7.1
[repositories-list]: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/list?view=azure-devops-rest-7.1
[security-namespaces]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1
[security-roles]: https://learn.microsoft.com/en-us/rest/api/azure/devops/securityroles/roleassignments/list?view=azure-devops-rest-7.1
[service-endpoints]: https://learn.microsoft.com/en-us/rest/api/azure/devops/serviceendpoint/endpoints/get-service-endpoints?view=azure-devops-rest-7.1
[set-aces]: https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-entries/set-access-control-entries?view=azure-devops-rest-7.1
[storage-key-get]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/storage-keys/get?view=azure-devops-rest-7.1
[subject-lookup]: https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1
[team-members]: https://learn.microsoft.com/en-us/rest/api/azure/devops/core/teams/get-team-members-with-extended-properties?view=azure-devops-rest-7.1
[teams-list]: https://learn.microsoft.com/en-us/rest/api/azure/devops/core/teams/get-teams?view=azure-devops-rest-7.1
[user-entitlements]: https://learn.microsoft.com/en-us/rest/api/azure/devops/memberentitlementmanagement/user-entitlements/search-user-entitlements?view=azure-devops-rest-7.1
[variable-groups]: https://learn.microsoft.com/en-us/rest/api/azure/devops/distributedtask/variablegroups/get-variable-groups?view=azure-devops-rest-7.1
