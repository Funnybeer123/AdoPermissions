# Access Manager web shell

Read-only React shell for Azure DevOps Access Manager. It is served as a
same-origin SPA and reads a typed inventory client seam. This milestone uses
the live `evanbeer` organization. The client never handles Azure DevOps
or Entra tokens.

## Run locally

```bash
cd src/AccessManager.Web
npm install
npm run dev
```

Or from the repository root:

```bash
./eng/dev-web
```

Open http://localhost:4780

The site inventories the `evanbeer` Azure DevOps organization. Set a
short-lived `AZURE_DEVOPS_PAT` in the environment (never in git or chat).
The proxy only issues GET requests and never creates users. Azure DevOps
Stakeholder seats require real Microsoft identities.

## Checks

```bash
npm test
npm run lint
npm run build
```

## What is in this shell

- Access-problem overview from live membership and licenses
- User, group, and project explorers
- Permission matrix and plans stay empty until ACE evaluation exists
- Global search over live users, groups, and projects
