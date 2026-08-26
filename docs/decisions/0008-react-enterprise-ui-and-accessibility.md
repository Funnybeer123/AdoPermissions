# 0008 — React enterprise UI with accessible graph alternatives

Status: Proposed  
Date: 2026-08-26

## Context

The product needs server-paged enterprise tables and understandable access
graphs. The original specification named React Flow, TanStack Query, and
TanStack Table as candidates but required evaluation. Graph canvases alone are
not reliably keyboard or screen-reader accessible, and loading an enterprise
graph into the browser is unsafe for performance.

## Decision

Subject to an implementation spike:

- React 19 + TypeScript + Vite
- Fluent UI React v9 for accessible enterprise controls
- TanStack Query for server state
- TanStack Table plus TanStack Virtual for large server-paged tables
- `@xyflow/react` (React Flow 12) behind an application adapter
- replaceable deterministic layered layout (Dagre initially)
- graph progressive expansion with an initial ceiling of 500 visible nodes and
  1,000 edges
- equivalent semantic keyboard-operable tree/table for every graph
- WCAG 2.2 AA baseline, including high contrast, reduced motion, zoom/reflow, and
  no color-only permission semantics

TanStack Query cache and browser graph state are never migration execution
authority.

## Consequences

- Mature ecosystem and flexible visualization.
- Several third-party dependencies require security/maintenance review.
- Headless table/graph libraries require application accessibility work.
- The adapter keeps graph/layout replacement feasible.
- Server APIs must support cursor paging, expansion, sorting, and filtering.
- Product design must maintain both visual and semantic representations.

## Alternatives considered

- **Custom SVG/canvas:** rejected initially due to interaction/layout/maintenance
  cost.
- **Graph-only UI:** rejected for accessibility and large-graph usability.
- **Load entire graph client-side:** rejected for enterprise memory/latency and
  information disclosure risk.
- **Commercial grid/graph component:** may be reconsidered if procurement,
  accessibility, or performance evaluation beats the proposed stack.

## Validation

Before accepting:

- build a representative 500-node/1,000-edge read-only spike
- validate keyboard, screen reader, high contrast, reduced motion, and 200% zoom
- compare graph evidence with semantic tree/table
- measure memory/interaction on approved browsers
- review package health, license, update cadence, and security posture
- prove server paging/expansion and cancellation behavior

If the spike fails, supersede this ADR with a component that meets the same
bounded/accessibility contract.
