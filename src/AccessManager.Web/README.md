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
