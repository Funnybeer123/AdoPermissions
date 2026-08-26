# 0006 — Namespace-specific evaluation with authority and Unknown

Status: Accepted  
Date: 2026-08-26

## Context

Azure DevOps stores permissions as namespace-specific ACL tokens and ACE masks,
plus separate role models for some pipeline resources. Group membership,
resource inheritance, Deny precedence, administrator exceptions, and incomplete
Entra paths make a universal local algorithm unsafe.

Azure DevOps exposes useful effective evidence, but no public endpoint
authoritatively calculates every resource/action for an arbitrary selected user.

## Decision

- Implement one interpreter per supported security namespace/token family.
- MVP supports Project and Git project/repository tokens only.
- Discover action bits at runtime and compare them with tested schemas.
- Separate assignment effect, assignee source, resource inheritance, effective
  outcome, constraints, authority, and completeness.
- Prefer provider-computed evidence where its exact contract applies.
- Use `DerivedSupported` only for a complete, tested interpreter case.
- Replacement verification derives a counterfactual with only selected direct
  user bits suppressed; the current provider-effective result is not proof while
  those bits remain.
- Represent all incomplete/unsupported/disagreeing cases as `Unknown`.
- Unknown is visible to users and always blocks automatic removal.
- Preserve raw tokens and unknown bits without interpreting or rewriting them.

## Consequences

- The product is honest about limits rather than claiming universal access truth.
- Each new namespace requires token, precedence, provider-oracle, and live
  contract tests.
- Some views contain Unknown even when the Azure DevOps UI appears decisive.
- The local model can explain paths while provider evidence verifies outcomes.
- Disagreement creates drift/capability failure, not silent normalization.

## Alternatives considered

- **Generic Deny-wins bitmask engine for all namespaces:** rejected because role
  models, token hierarchies, and administrator exceptions differ.
- **Use ACL extended info only:** rejected because inherited fields explicitly
  omit groups and cannot explain complete provenance.
- **Use Has Permissions:** rejected because it evaluates the caller, not an
  arbitrary selected user.
- **Treat missing data as Not Set/Deny:** rejected because permission trimming
  and partial traversal make that unsafe.

## Validation

- Property tests for masks/tokens/membership DAGs and Unknown preservation.
- Sandbox precedence matrix for Project/Git.
- Direct-only versus direct+replacement counterfactual tests.
- Git comparisons with Permissions Report where supported.
- Provider/local disagreement blocks plans and emits drift.
- State-machine tests prove Unknown cannot reach removal.
