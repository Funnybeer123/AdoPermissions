# Azure DevOps Access Manager — Cursor Plan Mode Prompt

You are a senior Azure DevOps platform engineer, security architect, and full-stack developer.

I want you to **PLAN FIRST** for a production-ready internal application called **Azure DevOps Access Manager**.

Do **not** begin implementation until you have inspected the repository, researched the Azure DevOps APIs required, documented the architecture, identified API limitations, and produced a phased implementation plan.

## 1. Goal

Build an internal web application that gives administrators one place to visualize and manage:

- Every Azure DevOps organization the configured identity can access
- Every project
- Project teams
- Azure DevOps groups
- Microsoft Entra-backed groups referenced by Azure DevOps
- Users
- Group memberships
- Team memberships
- Project-level permissions
- Repository permissions
- Pipeline/build permissions
- Environment permissions
- Service connection permissions where supported
- Variable group/library permissions where supported
- Other Azure DevOps security namespaces that can reasonably be represented

The main problem the application must solve is:

> What access does this person have across Azure DevOps, why do they have it, and how can I replace their individual access with group-based access?

The application must make direct user permissions easy to identify and migrate into groups.

## 2. Primary Workflow: User-to-Group Migration

This is the most important feature.

An administrator should be able to search for a user and see their effective Azure DevOps access across **all projects**.

Example:

`evan@company.com`

The application should identify:

- Projects the user can access
- Teams they belong to
- Azure DevOps groups they belong to
- Entra groups contributing to their access
- Direct permissions assigned to the user
- Permissions inherited through groups
- Repository permissions
- Pipeline permissions
- Environment permissions
- Service connection permissions
- Other resource-level permissions
- Permission inheritance paths
- Deny permissions
- Conflicting permissions
- Effective permission where it can be calculated reliably

Then provide a migration workflow such as:

### Current

```text
Evan
├── Project A Contributors
├── Project A Team
├── Repository X: Contribute [DIRECT]
├── Repository X: Create Branch [DIRECT]
├── Pipeline Y: Queue Builds [DIRECT]
├── Environment PROD: User [DIRECT]
└── Project B Readers
```

### Proposed

```text
ADO-AppTeam-Developers
├── Project A Contributors
├── Project A Team
├── Repository X: Contribute
├── Repository X: Create Branch
├── Pipeline Y: Queue Builds
└── Environment PROD: User

Evan
└── Member of ADO-AppTeam-Developers
```

The application must compare the user's existing effective access against the proposed group access before removing anything.

## 3. Safe Migration Process

Never simply remove the user and hope the group replacement works.

Implement this workflow:

```text
Select User
     ↓
Inventory Existing Access
     ↓
Separate Direct vs Inherited Access
     ↓
Select Existing Group
or
Create New Group
     ↓
Model Proposed Group Permissions
     ↓
Compare Before vs After
     ↓
Identify Access Loss / Expansion
     ↓
Generate Change Plan
     ↓
Administrator Approval
     ↓
Add Group Membership
     ↓
Apply Missing Group Permissions
     ↓
Verify Effective Access
     ↓
Remove Redundant Direct User Permissions
     ↓
Verify Again
     ↓
Audit Result
```

A migration should stop automatically if verification shows unexpected access loss.

Do not remove existing access before replacement access has been applied and validated.

## 4. Application Views

### A. Access Overview

Dashboard showing:

- Total users
- Total groups
- Total projects
- Total teams
- Users with direct permissions
- Users with excessive direct permissions
- Orphaned permissions
- Empty groups
- Nested groups
- Potential duplicate groups
- Users with access across many projects
- Explicit Deny assignments
- Highly privileged users/groups

Do not turn this into a generic BI dashboard. The primary purpose is finding access problems.

## 5. User Explorer

Search users by name or email.

Display a user's access as a hierarchy:

```text
Evan
│
├── Organization
│
├── Project A
│   ├── Contributors
│   ├── Team Alpha
│   ├── Repositories
│   │   ├── API
│   │   │   ├── Read
│   │   │   ├── Contribute
│   │   │   └── Create Branch
│   │   └── Web
│   ├── Pipelines
│   ├── Environments
│   └── Service Connections
│
└── Project B
    ├── Readers
    └── Team Beta
```

Every permission should indicate its source:

- DIRECT
- INHERITED
- GROUP
- TEAM
- ENTRA GROUP
- DENY
- NOT SET

Where possible, provide an inheritance explanation.

Example:

```text
Contribute

Allowed

via:
Evan
 → ADO-AppTeam-Developers
 → Project Alpha Contributors
 → Repository API
```

## 6. Group Explorer

Selecting a group should show:

- Group name
- Descriptor
- Origin
- Azure DevOps vs Entra origin
- Members
- Nested groups
- Teams
- Projects
- Security permissions
- Repository permissions
- Pipeline permissions
- Environment permissions
- Service connection permissions
- Related access paths

Also provide reverse lookups.

## 7. Project Explorer

Allow selecting any Azure DevOps project.

Show:

```text
Project
├── Teams
├── Groups
├── Users
├── Repositories
├── Pipelines
├── Environments
├── Service Connections
└── Permission Assignments
```

Support switching between project-centric, user-centric, and group-centric views.

## 8. Permission Matrix

Provide a matrix with columns for:

- Principal
- Project
- Resource
- Individual permission actions
- Permission source

Filters should include:

- User
- Group
- Project
- Resource
- Permission
- Direct only
- Inherited only
- Denied
- Administrative permissions

## 9. Direct-Permission Cleanup

Create a dedicated report to find every instance where access has been granted directly to an individual instead of through a group.

Categorize findings:

- Low risk
- Medium risk
- High risk
- Administrative

Allow administrators to select multiple findings and generate a remediation plan.

Do not perform bulk changes without showing a preview.

## 10. Group Recommendation Engine

Build logic that recommends existing groups before creating new ones.

For a selected user:

1. Calculate their effective access.
2. Find existing groups with similar permissions.
3. Rank candidate groups by coverage.
4. Calculate additional permissions the user would gain.
5. Calculate permissions that would remain missing.

Do **not** recommend a group solely because its name looks appropriate.

Base recommendations on actual membership and permission data.

## 11. Access Comparison

Create a before/after comparison for every migration.

Classification:

- SAME
- GAINED
- LOST
- CHANGED
- UNKNOWN

Require explicit acknowledgement for access expansion.

Block automatic migration when material access would be lost.

## 12. Bulk Migration

Support selecting multiple users and generating one combined change set before execution.

Show:

- Adds
- Removals
- Group membership changes
- Permission changes
- Warnings
- Failed validation
- Estimated API operations

Allow individual changes to be removed from the batch.

## 13. Visualization

The relationship model should be easy to understand visually.

Example:

```text
                 ┌───────────────┐
                 │ Evan          │
                 └───────┬───────┘
                         │
              member of  │
                         ▼
          ┌──────────────────────────┐
          │ ADO-App-Developers       │
          └────┬─────────┬───────────┘
               │         │
              team     group
               │         │
               ▼         ▼
          Team Alpha  Contributors
               │
       ┌───────┼─────────┐
       ▼       ▼         ▼
      Repo   Pipeline Environment
```

Evaluate a suitable visualization library during planning. React Flow is a candidate, but do not select it until compatibility and maintainability have been reviewed.

## 14. Azure DevOps APIs

Research the current Azure DevOps REST APIs before implementation.

At minimum investigate:

- Core Projects API
- Teams API
- Graph API
- Memberships API
- Groups API
- Users API
- Security Namespaces API
- Access Control Lists API
- Git Repositories API
- Build/Pipeline APIs
- Distributed Task APIs
- Environments
- Service Connections
- Variable Groups
- Azure DevOps identities/descriptors

Do not guess API paths.

Document:

- Feature
- API
- API version
- Required permissions/scopes
- Read support
- Write support
- Known limitations

Pay special attention to Azure DevOps descriptors, security tokens, ACLs, ACEs, and security namespaces.

Build abstractions around them instead of spreading raw Azure DevOps token parsing across the application.

## 15. Security Namespace Engine

Create a domain layer that can translate Azure DevOps security data into human-readable information.

Design something similar to:

```text
SecurityNamespaceInterpreter
    ├── ProjectNamespace
    ├── GitNamespace
    ├── BuildNamespace
    ├── EnvironmentNamespace
    └── ServiceConnectionNamespace
```

Centralize bitmask decoding.

Do not hard-code permission meanings throughout UI components.

## 16. Effective Permission Engine

Azure DevOps permissions can involve:

- ALLOW
- DENY
- NOT SET
- Inherited permissions
- Nested memberships

Determine what Azure DevOps APIs can authoritatively calculate versus what the application must derive.

Never display a calculated permission as authoritative unless the algorithm supports that resource/security namespace correctly.

Use states such as:

- Allow
- Deny
- Not set
- Inherited allow
- Inherited deny
- Unknown

If an API limitation prevents reliable effective-access calculation, display that limitation clearly.

## 17. Authentication

Prefer enterprise authentication.

Evaluate Microsoft Entra ID plus supported Azure DevOps API authorization.

Avoid designing the production system around manually entered PATs.

A PAT may be supported for local development if needed, but:

- Never commit it
- Never log it
- Never store it in plaintext
- Never expose it to the frontend

Research the supported authentication model for Azure DevOps REST APIs as of the implementation date.

## 18. Authorization Inside the Application

Plan application roles such as:

- Viewer
- Access Analyst
- Access Administrator
- Application Administrator

Viewer:
- Read only

Access Analyst:
- Run reports
- Compare access
- Create migration plans
- No Azure DevOps writes

Access Administrator:
- Execute approved permission changes

Application Administrator:
- Configure organizations
- Manage app configuration
- Manage application roles

## 19. Read-Only Mode

The application must have a global:

```text
READ_ONLY_MODE=true
```

When enabled:

- No Azure DevOps mutations
- No group changes
- No permission changes
- No membership changes

The backend must enforce this.

Do not rely on hiding buttons in the UI.

Default development and initial deployment to read-only.

## 20. Dry Run

Every mutation operation should support a dry-run planning stage.

Nothing should execute from the initial planning screen.

## 21. Audit Logging

Every attempted mutation should create an audit record.

Capture:

- Timestamp
- Administrator
- Target user/group
- Organization
- Project
- Resource
- Previous state
- Requested state
- Result
- API operation
- Correlation ID
- Error if unsuccessful

Never log:

- Access tokens
- Client secrets
- PATs
- Authorization headers

## 22. Rollback

Where technically possible, capture enough state before a migration to generate a rollback operation.

Rollback should itself generate a preview and audit record.

Do not market rollback as guaranteed if an Azure DevOps API or external change prevents reliable restoration.

## 23. Data Model

Plan a normalized internal model.

Candidate entities:

- Organization
- Project
- Principal
- User
- Group
- Team
- Membership
- Resource
- SecurityNamespace
- Permission
- PermissionAssignment
- EffectivePermission
- MigrationPlan
- MigrationOperation
- AuditEvent
- SyncRun

Do not make Azure DevOps REST response objects the application's permanent domain model.

## 24. Sync Architecture

Do not make the UI call dozens of Azure DevOps APIs every time someone opens a page.

Evaluate:

```text
Azure DevOps
      ↓
Sync Service
      ↓
Normalized Database
      ↓
API
      ↓
Web Application
```

The application should indicate data freshness and support targeted refresh for organization, project, and user.

Writes should trigger targeted refreshes.

## 25. Scale

Assume an enterprise Azure DevOps environment containing:

- Thousands of users
- Hundreds of groups
- Dozens or hundreds of projects
- Thousands of repositories/resources
- Large ACL collections

Plan for:

- Pagination
- API rate handling
- Bounded concurrency
- Caching
- Incremental synchronization where possible
- Background synchronization
- Retry with backoff
- Partial sync failure
- API throttling
- Large permission graphs

Do not load the entire Azure DevOps organization into browser memory.

## 26. Proposed Technology Stack

Evaluate this stack rather than accepting it blindly.

### Frontend

- React
- TypeScript
- Vite
- React Flow candidate
- TanStack Query candidate
- TanStack Table candidate

### Backend

Prefer:

- .NET 8 or current supported .NET LTS
- ASP.NET Core Web API

Use:

- Dependency Injection
- Typed HttpClient
- Polly or current .NET resilience mechanisms
- OpenAPI
- Structured logging

### Database

Evaluate Azure SQL with Entity Framework Core.

For local development, evaluate SQLite.

### Hosting

Target Azure App Service or another justified Azure service.

### Secrets

Use Azure Key Vault and Managed Identity where practical.

Avoid application secrets when managed identity or workload identity provides a practical alternative.

## 27. Architecture

Consider a structure similar to:

```text
/src
  /AccessManager.Web
  /AccessManager.Api
  /AccessManager.Application
  /AccessManager.Domain
  /AccessManager.Infrastructure
  /AccessManager.AzureDevOps
/tests
  /AccessManager.UnitTests
  /AccessManager.IntegrationTests
  /AccessManager.ArchitectureTests
```

Keep Azure DevOps-specific API logic isolated.

Candidate interfaces:

- IAzureDevOpsClient
- IProjectService
- IIdentityService
- IMembershipService
- IPermissionService
- ISecurityNamespaceService
- IAccessAnalysisService
- IMigrationPlanner
- IMigrationExecutor

## 28. Change Engine

Do not have UI controllers directly modify Azure DevOps.

Implement a change pipeline:

```text
Requested Change
       ↓
Planner
       ↓
Validation
       ↓
Impact Analysis
       ↓
Change Set
       ↓
Approval
       ↓
Executor
       ↓
Verification
       ↓
Audit
```

Represent individual operations explicitly:

- AddGroupMembership
- RemoveGroupMembership
- AddPermission
- RemovePermission
- CreateGroup
- AddTeamMember
- RemoveTeamMember

This should make testing, dry runs, auditing, and rollback simpler.

## 29. Idempotency

All mutation operations should be safe to retry when practical.

If a desired membership already exists, return NO_CHANGE instead of failing the migration.

## 30. Concurrency Protection

Permissions may change between planning and execution.

Before executing:

1. Re-query affected resources.
2. Compare them to the baseline used to generate the plan.
3. Stop if material differences exist.

Require regeneration of the migration plan after material changes.

## 31. Entra ID Integration

Research how Azure DevOps identities map to Entra users and groups.

Where possible display the relationship between Azure DevOps principals and Microsoft Entra objects.

Do not assume email address is the permanent identifier.

Store stable identifiers/descriptors.

If Microsoft Graph is needed for richer Entra membership information, isolate that integration behind a separate provider.

Do not request unnecessary Microsoft Graph permissions.

## 32. Governance Reports

Add reporting capabilities for:

### Direct permission report
- Users receiving resource permissions directly

### Cross-project access
- Users with access to many projects

### Privileged access
Identify high-impact permissions such as:
- Project administration
- Repository administration
- Permission management
- Pipeline administration
- Environment administration
- Service connection administration

### Stale access
If reliable sign-in/activity information is available through appropriate APIs, support identifying potentially stale assignments.

Do not infer inactivity from incomplete data.

### Access anomalies
Examples:
- User directly assigned when peers use a group
- Single-user group
- Identical groups
- Group with no members
- Permission attached to unresolved identity
- Explicit DENY assignment

## 33. Search

Create global search for:

- User
- Email
- Group
- Team
- Project
- Repository
- Pipeline
- Environment
- Service Connection

Searching an email should immediately provide access to that user's access graph.

## 34. Safety Rules

Treat Azure DevOps permission changes as sensitive administrative operations.

The application must never:

- Automatically grant itself additional Azure DevOps privileges
- Automatically change its own identity permissions
- Automatically grant administrator access
- Circumvent Azure DevOps permission checks
- Remove a user's existing access before replacement access has been validated
- Hide permission expansion from the administrator
- Silently ignore failed changes
- Treat API errors as successful operations
- Store credentials in source control

## 35. Testing

Build extensive tests around permission logic.

### Unit Tests

Test:

- Permission decoding
- Security token parsing
- Nested memberships
- Direct vs inherited access
- DENY behavior
- Group recommendations
- Access comparisons
- Migration planning
- Idempotency

### Integration Tests

Mock Azure DevOps APIs.

Test:

- Pagination
- Throttling
- API errors
- Partial failures
- Descriptor resolution
- ACL processing
- Migration execution
- Verification

### Migration Safety Tests

Test cases such as:

- Existing access = proposed access
- Proposed group gives less access
- Proposed group gives greater access
- User contains explicit DENY
- Group contains DENY
- Nested group permissions
- Permissions changed after planning
- Partial API failure
- Verification failure
- Rollback generation

## 36. Development Seed Data

Create a local fake Azure DevOps provider.

Example organization: Contoso

Projects:
- Project Alpha
- Project Beta
- Project Gamma

Users:
- Evan
- Alice
- Bob
- Charlie

Groups:
- ADO-Alpha-Developers
- ADO-Alpha-Readers
- ADO-Platform-Admins
- ADO-Beta-Developers

Include realistic examples of:

- Direct access
- Group access
- Team memberships
- Nested groups
- DENY permissions
- Repository permissions
- Pipeline permissions
- Environment permissions

The full UI must be usable without connecting to a real Azure DevOps organization.

## 37. Initial MVP

### Phase 1 — Read-only inventory

- Organizations
- Projects
- Users
- Groups
- Teams
- Memberships

### Phase 2 — Permissions

- Security namespaces
- ACLs
- Repository permissions
- Project permissions

### Phase 3 — Analysis

- Direct permission detection
- Access graph
- Group recommendations
- Before/after comparisons

### Phase 4 — Controlled writes

- Group membership changes
- Permission migration
- Dry runs
- Validation
- Audit logs

### Phase 5 — Additional resources

- Pipelines
- Environments
- Service connections
- Variable groups
- Additional security namespaces

Do not attempt every Azure DevOps security namespace in the first implementation.

## 38. Repository Documentation

Create:

- README.md
- ARCHITECTURE.md
- AZURE-DEVOPS-API.md
- SECURITY.md
- PERMISSIONS-MODEL.md
- MIGRATION-ENGINE.md
- LOCAL-DEVELOPMENT.md
- DEPLOYMENT.md
- TESTING.md

Also create `/docs/decisions/` for Architecture Decision Records.

## 39. Plan Mode Instructions

You are currently in **Cursor Plan Mode**.

Do not start writing application code yet.

### Step 1 — Repository Inspection

Inspect:

- repository structure
- existing code
- dependencies
- configuration
- CI/CD
- tests
- documentation

Reuse good existing components where appropriate.

Do not rewrite working components without a reason.

### Step 2 — API Research

Research the current Microsoft documentation for the Azure DevOps APIs needed.

Document actual APIs and supported API versions.

Identify:

- API
- Authentication
- Scopes
- Pagination
- Rate considerations
- Read operations
- Write operations
- Limitations

Pay particular attention to how Azure DevOps calculates and stores security permissions.

### Step 3 — Architecture

Create the proposed architecture.

Include:

- Frontend
- Backend
- Database
- Azure DevOps integration
- Entra integration
- Synchronization
- Permission engine
- Migration engine
- Audit system
- Authentication
- Authorization

### Step 4 — Domain Model

Define the normalized entities and relationships.

Show important identifiers.

Azure DevOps descriptors and security tokens must be handled deliberately.

### Step 5 — API Mapping

Create a table:

| Application Feature | Azure DevOps API | Read | Write | Notes |
|---|---|---|---|---|

Do not move forward until every MVP feature has an identified data source.

If Azure DevOps cannot provide something reliably, mark it as a limitation rather than inventing behavior.

### Step 6 — Permission Model

Document exactly how the application will represent:

- Allow
- Deny
- Not Set
- Inherited
- Direct
- Effective
- Unknown

Explain how nested group membership affects the calculation.

### Step 7 — Migration Algorithm

Write pseudocode for:

- AnalyzeUserAccess()
- RecommendGroups()
- CreateMigrationPlan()
- CompareAccess()
- ValidateMigration()
- ExecuteMigration()
- VerifyMigration()
- GenerateRollback()

Prioritize correctness over brevity.

### Step 8 — Security Review

Threat-model:

- Compromised administrator
- Compromised app identity
- Credential leakage
- Privilege escalation
- Unexpected permission expansion
- Accidental permission removal
- API replay
- Concurrent access modifications
- Stale cached permissions
- Audit tampering

Document mitigations.

### Step 9 — Implementation Phases

Break development into small phases.

Every phase must contain:

- Goal
- Files/modules
- Implementation tasks
- Tests
- Acceptance criteria
- Dependencies

Tasks should be small enough for Cursor agents to implement and verify independently.

### Step 10 — Produce the Plan

Create:

`docs/IMPLEMENTATION-PLAN.md`

The plan should include checkboxes.

Each implementation task should specify:

- Files affected
- Interfaces
- Expected behavior
- Tests required
- Definition of done

## 40. Decision Rules

During planning:

1. Prefer official Microsoft APIs.
2. Prefer stable APIs over previews when practical.
3. Minimize Azure DevOps privileges required by the application.
4. Keep read access separate from write access.
5. Default to read-only.
6. Centralize Azure DevOps API communication.
7. Centralize security-token interpretation.
8. Never treat email as the authoritative principal identifier.
9. Never silently expand access.
10. Never silently remove access.
11. Prefer existing groups over creating unnecessary groups.
12. Build dry-run capabilities before write capabilities.
13. Build verification before removal operations.
14. Build auditing before enabling production mutations.
15. Keep individual Azure DevOps security namespaces modular.
16. Make API limitations visible to the administrator.
17. Stop on ambiguous high-impact permission changes.

## 41. Questions Cursor Must Resolve

Before implementation, explicitly answer these questions in the plan:

1. What Azure DevOps API provides the most reliable organization-wide user inventory?
2. How are Azure DevOps identities and descriptors resolved?
3. How do Azure DevOps groups map to Entra groups?
4. How are teams represented relative to groups?
5. Which security namespaces must the MVP support?
6. How are ACL tokens decoded for each namespace?
7. Can Azure DevOps return authoritative effective permissions, or must some be calculated?
8. How should DENY override ALLOW during analysis?
9. How should nested group membership be traversed safely?
10. How can direct permissions be differentiated from inherited permissions?
11. Which resource permissions can safely be modified through supported APIs?
12. How should changes be verified after execution?
13. What permissions does the application's Azure DevOps identity require?
14. Can read-only and modification identities be separated?
15. How should Entra IDs be correlated with Azure DevOps descriptors?
16. How should stale cached data be detected before a migration?
17. What Azure DevOps API throttling behavior must the sync engine handle?
18. Which Azure DevOps APIs are preview-only?
19. What operations cannot be safely automated?
20. What should cause a migration to stop rather than continue?

## 42. Final Plan Output

At the end of Plan Mode, provide:

1. Executive architecture summary
2. Architecture diagram
3. Repository assessment
4. Azure DevOps API mapping
5. Authentication model
6. Authorization model
7. Domain/data model
8. Synchronization design
9. Security namespace strategy
10. Effective permission algorithm
11. Direct-permission detection algorithm
12. Group recommendation algorithm
13. Migration algorithm
14. Verification and rollback design
15. Security threat model
16. Testing strategy
17. Implementation phases
18. Risks and API limitations
19. Required Azure/Entra/Azure DevOps configuration
20. Recommended MVP boundary
21. `docs/IMPLEMENTATION-PLAN.md`

Do not begin implementation until this planning work is complete.

The end goal is an application where I can select a person and quickly answer:

- What can this person access?
- Why can they access it?
- Which permissions are assigned directly?
- Which groups provide their access?
- What group should replace their individual permissions?
- Would changing them to that group remove any access?
- Would it give them additional access?
- Can I safely migrate them?
- What exactly will change before I approve it?

Optimize the architecture around answering those questions accurately and making the resulting changes safely.
