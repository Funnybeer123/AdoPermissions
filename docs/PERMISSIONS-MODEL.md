# Permission and Access Analysis Model

Status: proposed  
MVP namespaces: Project and Git Repositories at project/repository scope

## Purpose

The application must answer two different questions without conflating them:

1. **What assignments exist?** Exact ACEs, group membership, role assignments,
   and resource inheritance.
2. **What can this principal effectively do, and why?** A result with authority,
   completeness, constraints, and explanatory paths.

Azure DevOps has no universal arbitrary-user effective-permission endpoint.
Provider-computed evidence is used where supported; a namespace-specific local
model supplies analysis and explanations. Any unsupported or incomplete case is
`Unknown`, never a guessed Allow, Deny, or Not Set.

## Vocabulary and independent axes

### Assignment state

An explicit assignment on an exact securable token:

```text
ExplicitAllow
ExplicitDeny
NotSet (no explicit bit)
```

### Assignee source

```text
Self
AzureDevOpsGroup
TeamGroup
EntraGroup
SystemPrincipal
UnresolvedPrincipal
```

### Resource scope source

```text
ExactToken
AncestorToken (resource-inherited)
RoleScope
UnknownToken
```

### Effective outcome

```text
Allow
Deny
NotSet
Unknown
```

`NotSet` means the supported model found no applicable grant or deny. It is not
an explicit Deny. `Unknown` means the model cannot establish a reliable result.

### Authority

```text
ProviderComputed   Azure DevOps returned an effective result for this exact case
DerivedSupported   A tested namespace interpreter calculated a complete result
DerivedPartial     Useful evidence exists, but some inputs are incomplete
Unknown            No supported evaluation
```

`DerivedPartial` is displayed as `Unknown` for migration safety even when the UI
shows known contributing facts.

### Constraints

An ACL Allow may not mean the person can use the feature. Keep these separate:

- access level/license
- disabled/deleted/pending identity
- project visibility
- product-specific policy/check
- conditional access
- administrator/system exception
- incomplete Entra membership
- stale/partial provider data

The UI says “ACL allows, but access is constrained/unknown” rather than
rewriting the ACL result.

## Identity and descriptor handling

Azure DevOps uses:

- **Graph subject descriptor** for Graph users, groups, and memberships
- **legacy IMS identity descriptor** for ACL/ACE security APIs
- **storage key / VSID** GUID to bridge identity systems
- **origin/originId** to correlate a materialized Entra subject

Resolution:

```text
From legacy descriptor:
  ReadIdentities(descriptors=...)
    -> storage key + Graph subject descriptor

From Graph descriptor:
  ReadIdentities(subjectDescriptors=...)
    -> legacy descriptor
  Graph Storage Keys Get
    -> storage key

From storage key:
  Graph Descriptors Get
    -> Graph descriptor
  ReadIdentities(identityIds=...)
    -> legacy descriptor
```

All values are opaque. Do not base64-decode descriptors. Store identifier
history because descriptors and `originId` can change after relinking. Email and
UPN are searchable attributes only.

An Entra-backed Graph group normally has `origin=aad` and `originId` equal to
the Entra object ID. Include tenant in the correlation. Azure DevOps Graph only
shows materialized groups and cannot manage directory membership.

Permission evaluation always operates on one organization-specific principal.
The cross-organization Person Explorer links those principals through a
tenant-scoped directory subject only when tenant, object ID, origin, and kind
match; it then evaluates/authorizes each organization independently. Ambiguous
or relinked identities remain separate and `Unknown`, never merged by email.

## Teams and groups

A Core team has a corresponding identity/security group. Team ID is the team
identity GUID, and `$expandIdentity=true` returns its descriptors. Model:

```text
Team(projectId, providerTeamId, groupPrincipalId)
```

All team membership and permission inheritance then use the same direct
membership graph as other groups. Do not maintain a duplicate team-membership
graph.

## Security namespace engine

```text
ISecurityNamespaceInterpreter
  NamespaceId
  InterpreterVersion
  ReadCapabilities
  WriteCapabilities
  TryParseToken(rawToken)
  BuildToken(resource)
  GetAncestorTokens(token)
  DecodeMask(mask, discoveredActions)
  ResolveResource(parsedToken)
  ClassifyRisk(action, scope)
  EvaluateSubjectAssignments(subject, tokenChain, action)
  ValidateDesiredAce(current, desired)
```

The registry refuses to select an interpreter when:

- namespace/action schema drift is unaccepted
- token form is unsupported
- action bit is unknown/system/internal/deprecated
- organization capability has not been proven
- operation is outside the explicit read/write allowlist

Provider namespace/action metadata is canonicalized and versioned. Permission
names and bits are discovered at runtime and compared with tested expectations.
Unknown bits are preserved.

### Mask decoding

```text
knownMask = OR(all discovered action bits)

for action in discoveredActions:
    explicitAllow = (ace.allowMask AND action.bit) != 0
    explicitDeny  = (ace.denyMask  AND action.bit) != 0

unknownAllowMask = ace.allowMask AND NOT knownMask
unknownDenyMask  = ace.denyMask  AND NOT knownMask
```

Use a server numeric representation that safely holds provider masks. Do not use
JavaScript's signed 32-bit bitwise operators in the UI.

If the same bit is present in both explicit allow and deny, preserve and expose
the conflict. Treat it as denied for safety and block unrelated automated
normalization.

## Supported tokens

### Project

```text
Namespace: 52d39943-cb85-4d7f-8fa8-c6baac873819
Root:      $PROJECT
Project:   $PROJECT:vstfs:///Classification/TeamProject/{PROJECT_GUID}
```

`AGILETOOLS_BACKLOG` is documented as internal and must not be changed.
Underdocumented, system, unknown, or reserved actions are read-only/unsupported.

Initial automatic-write allowlist after Phase 0 confirms the live namespace
schema:

```text
GENERIC_READ (expected bit 1)
```

`GENERIC_WRITE` and every administrative/project-lifecycle action remain
analysis/manual-only in the first write slice.

### Git Repositories

```text
Namespace: 2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87
Project:   repoV2/{PROJECT_GUID}
Repository:repoV2/{PROJECT_GUID}/{REPOSITORY_GUID}
```

The obsolete `Administer` action is unsupported. Branch tokens have a special
UTF-16LE hexadecimal path encoding and are post-MVP. Raw branch tokens can be
preserved but not interpreted or changed by the MVP.

Initial automatic-write allowlist at Git project/repository scope, after live
schema proof:

```text
GenericRead        expected bit 2
GenericContribute  expected bit 4
CreateBranch       expected bit 16
CreateTag          expected bit 32
```

ForcePush, repository create/delete/rename, policy bypass/edit, lock removal,
ManagePermissions, pull-request bypass, obsolete Administer, branch tokens, and
all unknown/system actions remain analysis/manual-only. Action name and expected
bit must both match the capability snapshot; discovery alone cannot enable it.

### Build (post-MVP)

```text
Namespace: 33344d9c-fc72-4d6f-aba5-fa317101a7e9
Project:   {PROJECT_GUID}
Definition:{PROJECT_GUID}/{DEFINITION_ID}
```

Build uses the stable ACL APIs but requires a separate interpreter and sandbox
evidence before support.

### Role-based resources (post-MVP)

Environment, ServiceEndpoint, and Library use security roles with `scopeId`,
`resourceId`, identity storage key, and role name. They are not ordinary ACL
tokens. The public APIs and resource-key grammar are not fully documented, so
they remain read-only/experimental until independently proven.

## Direct, inherited, and group-derived classification

For ACL namespaces:

- **Direct** — a stored, nonzero ACE bit belongs to the selected user's exact
  legacy descriptor.
- **Resource inherited** — the applicable setting is from an ancestor token.
- **Group derived** — the applicable ACE belongs to a transitive Azure DevOps
  group.
- **Team derived** — group derived where the group is linked to a team.
- **Entra derived** — at least one membership path contains an Entra group.
- **Effective** — provider-computed or namespace-interpreter outcome after all
  applicable inputs.

These labels can coexist. For example: “Allow, group-derived through Team Alpha,
resource-inherited from the Git project token.”

A descriptor-filtered ACL response can contain a synthetic zero-valued ACE.
Direct detection uses unfiltered stored `acesDictionary`, not row presence in a
filtered response and not arithmetic on effective/inherited masks.

Role resources use `access=assigned|inherited` for resource scope. A role
assigned to a group is direct for that group but group-derived for a user.

## Membership traversal

Store and traverse direct edges:

```text
ResolveContainers(principal):
    queue = [(principal, 0)]
    visited = {}
    edges = {}

    while queue not empty:
        current, depth = dequeue
        if current in visited: continue
        if depth > MaxDepth or counts exceed budgets:
            return Partial(edges, LimitExceeded)

        parents = direct Memberships(direction=up, depth=1)
        if request failed:
            return Partial(edges, ProviderError)

        for parent in parents:
            edges.add(current -> parent)
            enqueue(parent, depth + 1)

    return Complete(edges)
```

Retain all known direct edges so explanations can show paths. Use a visited set,
node/edge/depth/query limits, and deterministic ordering. A partial traversal
makes affected effective results `Unknown`.

For Entra groups, Azure DevOps does not provide a complete directory membership
graph. Service principals can inherit permissions from Entra groups while being
absent from Azure DevOps Entra-group member listings. The optional Microsoft
Graph provider may add direct/transitive evidence; without it, affected results
remain `Unknown`.

Entra changes might take up to one hour to become visible in Azure DevOps.
Dynamic-group changes typically process within a few hours but can take more
than 24 hours. Neither figure is an end-to-end SLA. Destructive verification
still waits for Azure DevOps itself to observe replacement access and stops at
its bounded policy window.

## Provider-computed evidence

### ACL extended information

ACL Query with `includeExtendedInfo=true` can return:

```text
effectiveAllow
effectiveDeny
inheritedAllow
inheritedDeny
```

Microsoft describes effective masks as those used for that identity/token. The
inherited masks exclude explicit settings on that token and groups containing
the identity. Use them for provider evidence and resource inheritance, not as a
complete “why” graph.

### Has Permissions

Has Permissions and the batch evaluation API evaluate the calling identity.
Their documented request does not support impersonating the arbitrary user
selected in Access Manager. They are useful for capability probes, not user
inventory.

### Permissions Report

The stable asynchronous Permissions Report can produce effective results for
supported Git/TFVC/release resource types and selected descriptors. Use it as a
Git verification oracle where the contract supports the resource. It is not a
universal Project, Build, Environment, or ServiceEndpoint evaluator.

## Effective evaluation

Azure DevOps permission precedence has two dimensions:

- among applicable group assignments at the same effective resource level,
  Deny generally overrides Allow
- in a resource hierarchy, an explicit setting at a more specific child can
  override an inherited parent setting

Administrator/system exceptions and cross-principal/resource interactions are
not modeled generically. The interpreter is namespace-specific and provider
evidence takes priority.

```text
Evaluate(principal, resource, action, snapshot, suppressedAssignments=none):
    interpreter = Registry.Resolve(resource.namespace, schemaHash)
    if no supported interpreter:
        return Unknown(UnsupportedNamespaceOrSchema)

    if action is unknown, system, internal, or unsupported:
        return Unknown(UnsupportedAction)

    closure = ResolveContainers(principal)
    if closure is partial:
        return Unknown(IncompleteMembership, knownPaths=closure.edges)

    subjects = principal + closure.transitiveContainers
    tokenChain = interpreter.GetAncestorTokens(resource.token)
    if tokenChain cannot be proven:
        return Unknown(UnsupportedToken)

    subjectResults = []
    for subject in subjects:
        subjectResults += interpreter.EvaluateSubjectAssignments(
            subject, tokenChain, action, suppressedAssignments)

    derived = interpreter.CombineSubjects(subjectResults)
    provider = none when suppressedAssignments is not empty
               else TryGetProviderComputedEvidence(
                   principal, resource, action, subjects)

    if provider is authoritative for this exact case:
        if derived disagrees:
            record drift and block writes
        outcome = provider.outcome
        authority = ProviderComputed
    else if interpreter supports the complete case:
        outcome = derived.outcome
        authority = DerivedSupported
    else:
        return Unknown(UnsupportedEffectiveCase, knownPaths=...)

    constraints = EvaluateNonAclConstraints(principal, resource)
    return outcome + authority + constraints + all explanatory paths
```

For the MVP Project/Git ACL interpreters, the helper behavior is explicit:

```text
EvaluateSubjectAssignments(subject, targetToRootTokens, action, suppressed):
    for token in targetToRootTokens:
        acl = exact ACL for token
        ace = exact stored ACE for subject at token, with only the explicitly
              named suppressed bits removed in memory

        if ace explicitly denies action:
            return Deny(scope=token, specificity=ExactOrNearest)
        if ace explicitly allows action:
            return Allow(scope=token, specificity=ExactOrNearest)

        if acl exists and acl.inheritPermissions == false:
            return NotSet(InheritanceStoppedAt=token)

    return NotSet

CombineSubjects(subjectResults):
    # Each subject result has already applied resource specificity independently.
    if any subject result is Deny:
        return Deny
    if any subject result is Allow:
        return Allow
    return NotSet
```

This models the documented rules that a more-specific explicit setting replaces
that subject's inherited parent setting, while applicable group Deny generally
overrides Allow. Project/Git sandbox tests must cover user/group and child/parent
combinations. Administrator/system exceptions, an incomplete token chain, or a
provider/local disagreement return `Unknown`.

### Counterfactual replacement evaluation

Replacement verification cannot use the user's current provider-computed result
while the direct ACE still exists; that result may be supplied entirely by the
permission about to be removed. Before entering removal:

```text
EvaluateReplacementCounterfactual(liveState, selectedDirectBits):
    require live membership, group ACE, token chain, and namespace schema complete
    require each selected bit exists exactly as planned on the user

    result = Evaluate(
        user,
        affected resource/action,
        liveState,
        suppressedAssignments=selected exact user ACE bits)

    require result == Allow
    require result.authority == DerivedSupported
    require at least one surviving explanatory path reaches the replacement group
    require no selected direct user ACE appears in any surviving path
    return result
```

The provider cannot be asked to suppress a hypothetical ACE, so the
counterfactual is a tested namespace-derived result. Immediately after actual
removal, final verification uses fresh provider state and provider-computed
evidence where supported. If counterfactual derivation is not authoritative for
that coordinate, automation stops before removal.

If Microsoft documentation, provider extended information, Permissions Report,
and the local explanation disagree, the result is not silently normalized:

1. preserve all facts
2. mark the capability/evaluation `Unknown`
3. raise a namespace drift issue
4. block migration for affected coordinates

## Direct-permission detection

```text
DetectDirectAssignments(generation):
    for namespace in SupportedNamespaces:
        for acl in CompleteKnownTokenAcls(namespace):
            for storedAce in acl.acesDictionary:
                principal = ResolveLegacyDescriptor(storedAce.descriptor)

                if principal is unresolved:
                    emit HighRiskUnknownFinding(storedAce)
                    continue

                if principal.kind != User:
                    continue

                for action in DecodeKnownBits(storedAce.allow, storedAce.deny):
                    emit DirectPermissionFinding(
                        principal,
                        namespace,
                        acl.token,
                        action,
                        effect=Allow|Deny,
                        source=ExactStoredAce,
                        risk=Classify(action, scope, effect))

                if unknown bits exist:
                    emit AdministrativeOrUnknownFinding(...)
```

Risk inputs:

- action risk (`ManagePermissions`, repository policy bypass, force push, project
  administration, etc.)
- breadth of resource scope
- direct Deny
- unresolved identity/resource/action
- system/protected principal
- current effective contribution
- available replacement and evaluation authority

A finding is “redundant” only after supported comparison proves replacement
access. Team membership is reported separately; it is not an ACL assignment.

## Access snapshots and comparisons

Coordinate:

```text
organization + namespace + canonical resource/token + action
```

Each side contains outcome, authority, constraints, and source paths.

```text
CompareAccess(before, after):
    keys = union(before.coordinates, after.coordinates)

    for key in keys:
        if either side outcome/coverage is Unknown:
            UNKNOWN
        else if before is not Allow and after is Allow:
            GAINED
        else if before is Allow and after is not Allow:
            LOST
        else if outcome/effect materially differs:
            CHANGED
        else if access paths differ:
            CHANGED_SOURCE
        else:
            SAME
```

`CHANGED_SOURCE` is a useful addition to the original five labels: access can
remain effective while moving from direct to group-derived. API consumers can
fold it into `CHANGED` if they only support the original contract.

Materiality policy:

- any `LOST` Allow is material
- Allow to Deny is always material
- any administrative or broad-scope gain is material
- an `UNKNOWN` on a selected/removal coordinate is material
- all gains and group-cohort changes require explicit acknowledgement

## Group recommendation

Names are display data, never ranking evidence.

```text
RecommendGroups(userSnapshot, selectedFindings):
    candidates = indexed groups in same organization and valid scope
    remove protected/system/admin groups
    remove groups whose membership cannot be managed as proposed
    mark incomplete groups non-automatic

    prefilter by:
        scope compatibility
        normalized permission fingerprint overlap on affected coordinates
        native/team/Entra policy
        membership and cohort completeness

    take deterministic top CandidateBudget (default 100)

    for candidate in candidates within Query/Time/Coordinate budgets:
        proposedUser = Simulate(
            add user membership,
            remove selected direct assignments,
            optionally add exact missing group bits)

        userComparison = CompareAccess(baseline, proposedUser)

        if group bits would change:
            cohort = complete transitive current members
            if cohort exceeds CohortBudget:
                mark ManualOnly(ImpactBudgetExceeded)
            cohortComparison = simulate only changed coordinates for cohort
        else:
            cohortComparison = no change

        score:
          1. no loss or unknown
          2. no group permission modification needed
          3. lowest weighted user gain
          4. lowest cohort blast radius
          5. highest selected-direct coverage
          6. fewest operations

        emit incremental candidate result

    return coverage, missing, gains, losses, unknowns, cohort impact,
           operations, rejection reasons, budget/completeness metadata
```

Adding a permission to an existing group can expand access for every current
and future member. That cohort/future-member policy is a first-class comparison
and requires separate approval. The engine should prefer membership in a group
that already provides the needed access.

Recommendation runs as a cancellable background analysis job. It never scans
unbounded groups × members × resources in an HTTP request. Exceeding any budget
returns partial ranked results plus `ManualOnly/Unknown` candidates; it does not
weaken safety to finish. Performance tests set final budgets from representative
enterprise data.

Entra-backed groups are recommendation-only in MVP unless the user is already a
directory member. Access Manager does not write Entra membership.

Adding missing permissions to a candidate group is automatic only when it is a
native, non-team, non-system group explicitly registered as permission-managed
for that project. Approval acknowledges the permission as policy for all current
and future members. If that governance acknowledgement is not appropriate, the
candidate must already provide the exact replacement access and the plan can
only add membership.

## Safe ACE mutation design

Project/Git write support uses exact, allowlisted bits only:

```text
current = LiveReadExactStoredAce(token, descriptor)
assert current equals operation.precondition
assert namespace/token/action/capability are allowlisted
assert no system, reserved, deprecated, or unknown bit is targeted

if descriptor is replacement group:
    assert group is native, non-team, non-system, permission-managed
    assert approval acknowledges all current and future members
    assert LiveHash(transitive current cohort) == operation.cohortPrecondition

desired = ChangeOnlyApprovedBits(current)
assert desired preserves every unrelated and unknown bit
assert (desired.allow AND desired.deny) == 0 for targeted bits

LiveReadAgainImmediatelyBeforeCall()
execute exact operation once
LiveReadAndVerifyStoredState()
```

Guidance:

- Prefer Remove Permission for selected-bit removal.
- Avoid whole-ACL replacement for routine migration.
- Avoid whole-ACE removal unless the approved operation owns every bit.
- `merge=true` only ORs masks and cannot safely clear a bit; use only for a
  proven additive operation.
- `merge=false` can replace an ACE and therefore requires exact current-state
  preservation and a second precondition read.
- Azure DevOps has no universal conditional-write ETag or transaction; a live
  preflight reduces but cannot eliminate races.
- A timeout after a mutation is `InDoubt`; reconcile before retry.
- Re-read the transitive cohort immediately before and after a group ACE change.
  Any unacknowledged policy/scope change stops. Azure DevOps has no atomic
  membership+ACE transaction, so approval of future-member semantics is required
  to cover a member added in the unavoidable final race window.

Explicit Deny is not automatically migrated. Copying a user's Deny to a shared
group denies every member. MVP leaves direct Deny untouched and requires a
manual/dedicated-group design outside the automatic path.

## What stops automation

- unsupported namespace/token/action or changed action schema
- unknown or system bits
- unresolved principal/resource
- partial membership/ACL data
- incomplete Entra path relevant to the result
- unsupported administrator/system exception
- disagreement between provider and derived result
- stale baseline or changed direct/group/cohort state
- any material loss
- unacknowledged gain or cohort impact
- Deny migration/removal
- verification that is failed or inconclusive

## UI representation

Each permission row displays:

```text
Action:       Contribute
Outcome:      Allow
Authority:    Provider computed | Derived | Unknown
Assignment:   Explicit Allow on group
Scope:        Inherited from Git project | Exact repository
Via:          Evan -> ADO-Alpha-Developers -> repository API
Freshness:    timestamp + generation
Constraints:  none | license/identity/coverage warning
```

Allow, Deny, Not Set, and Unknown have text/icon treatment; color is never the
only signal. Users can expand evidence, provider limitation, and all known
paths. Truncated paths are labeled.

## Tests and invariants

Unit/property tests:

- discovered mask decode and unknown-bit preservation
- Project/Git token round trip and malformed tokens
- same-token group Deny/Allow combinations
- resource-specific exact versus inherited settings
- disabled inheritance
- random membership DAGs, cycles, limits, duplicate paths
- direct versus synthetic filtered ACE
- direct/group/team/Entra/resource source classification
- provider/local agreement and disagreement
- comparison classifications and materiality
- recommendation ordering and cohort blast radius
- exact-bit add/remove with unrelated bits

Live sandbox comparisons:

- representative Project and Git repository assignments
- user direct Allow plus group Deny
- parent Deny/child Allow and parent Allow/child Deny
- nested native and Entra groups
- Permissions Report versus local Git result
- namespace schema/action drift

Safety invariants:

- Unknown never authorizes removal.
- Unknown bits survive every simulation and supported write.
- A user ACE is direct only when it exists in the stored ACL.
- Group modification always includes cohort impact.
- No generic interpreter enables a namespace merely because its actions were
  discoverable.

## Official references

- [About permissions and inheritance](https://learn.microsoft.com/en-us/azure/devops/organizations/security/about-permissions?view=azure-devops)
- [Security namespace reference](https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops)
- [Security namespaces API](https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1)
- [ACL Query and extended information](https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1)
- [Set Access Control Entries](https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-entries/set-access-control-entries?view=azure-devops-rest-7.1)
- [Remove Permission](https://learn.microsoft.com/en-us/rest/api/azure/devops/security/permissions/remove-permission?view=azure-devops-rest-7.1)
- [Permissions Report](https://learn.microsoft.com/en-us/rest/api/azure/devops/permissionsreport/?view=azure-devops-rest-7.1)
- [Graph Memberships](https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1)
- [Read Identities](https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1)
