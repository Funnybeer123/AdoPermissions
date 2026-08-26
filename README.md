# Azure DevOps Access Manager

Internal application for visualizing and managing Azure DevOps users, groups, teams, projects, and permissions across an organization.

## Start Here

Open this repository in Cursor and use **Plan Mode**.

The complete project specification and planning prompt is located at:

- [`docs/CURSOR-PLAN.md`](docs/CURSOR-PLAN.md)

In Cursor, instruct the agent:

> Read `docs/CURSOR-PLAN.md` in full. Follow it as the authoritative project specification. Remain in Plan Mode, research the current Azure DevOps APIs, inspect this repository, and create `docs/IMPLEMENTATION-PLAN.md`. Do not implement application code until the plan is complete.

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
