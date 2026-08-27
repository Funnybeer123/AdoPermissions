# Azure DevOps Access Manager

Internal application for visualizing and managing Azure DevOps users, groups, teams, projects, and permissions across an organization.

## Start Here

The first local site is the read-only Access Manager shell with Contoso fake
data. From the repository root:

```bash
./eng/dev-web
```

Then open http://localhost:4780. The design package is ready for Phase 0
validation. Start with:

- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) — phased,
  agent-sized implementation checklist
- [`docs/CURSOR-PLAN.md`](docs/CURSOR-PLAN.md) — authoritative product
  specification

The plan deliberately requires fake-provider and read-only milestones before
Azure DevOps mutations. Live writes also require sandbox capability evidence,
least-privilege validation, approval, audit, and verification gates.
Stakeholder policy and live Azure DevOps capability items remain visibly
unchecked in the implementation plan and must be resolved in Phase 0.

## Planning Documents

| Topic | Document |
|---|---|
| Architecture and technology decisions | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Azure DevOps API/version/scope mapping | [`docs/AZURE-DEVOPS-API.md`](docs/AZURE-DEVOPS-API.md) |
| Normalized domain model | [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) |
| Synchronization and freshness | [`docs/SYNC-ENGINE.md`](docs/SYNC-ENGINE.md) |
| Permission interpretation and analysis | [`docs/PERMISSIONS-MODEL.md`](docs/PERMISSIONS-MODEL.md) |
| Migration, verification, and rollback | [`docs/MIGRATION-ENGINE.md`](docs/MIGRATION-ENGINE.md) |
| Security and threat model | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Testing | [`docs/TESTING.md`](docs/TESTING.md) |
| Local fake-first workflow | [`docs/LOCAL-DEVELOPMENT.md`](docs/LOCAL-DEVELOPMENT.md) |
| Deployment and operations | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Architecture decision records | [`docs/decisions/`](docs/decisions/) |

The implementation plan resolves the original specification's 20 open design
questions and records current API limitations. API behavior—especially write
permissions—must still be contract-tested in a disposable Azure DevOps
organization before that capability is enabled.

## Primary Goal

The application should make it easy to answer:

- What access does a user have across every Azure DevOps project?
- Why do they have that access?
- Which permissions are direct versus inherited?
- Which Azure DevOps or Entra groups provide the access?
- Which existing group could replace direct user assignments?
- Would a proposed migration add or remove access?
- Can the migration be performed safely with validation, audit logging, and rollback planning?

Initial development should default to read-only access. See `docs/CURSOR-PLAN.md` for the complete architecture, security, migration, API research, testing, and implementation requirements.
