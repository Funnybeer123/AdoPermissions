# Access Manager web shell

Read-only React shell for Azure DevOps Access Manager. It is served as a
same-origin SPA and reads a typed inventory client seam. This milestone uses
the deterministic Contoso fake inventory. The client never handles Azure DevOps
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

The Contoso fake inventory is the default. The `evanbeer` Azure DevOps
organization is the disposable sandbox. To inventory it, set a short-lived
read-only `AZURE_DEVOPS_PAT` in the environment (never in git or chat), then
use the **evanbeer sandbox** switch. The proxy only issues GET requests and
never creates users.

## Checks

```bash
npm test
npm run lint
npm run build
```

## What is in this shell

- Access-problem overview
- User, group, and project explorers
- Permission matrix with source/effect labels
- Direct-permission cleanup report
- Dry-run migration plan with no execute controls
- Global search, including email-to-user access graph
