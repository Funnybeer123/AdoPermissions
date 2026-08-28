# 0001 — Use .NET 10 LTS

Status: Accepted  
Date: 2026-08-26

## Context

The original specification suggested “.NET 8 or current supported .NET LTS.”
This is a greenfield service planned in August 2026. Microsoft support for .NET
8 ends in November 2026; .NET 10 LTS is supported through November 2028.

Starting on .NET 8 would create an immediate runtime migration before the
application reaches production maturity.

## Decision

Target .NET 10 LTS, ASP.NET Core 10, and EF Core 10. Pin an approved SDK feature
band in `global.json`, use the latest supported servicing patch in builds and
runtime images, and enable SDK vulnerability/EOL checks.

Use `Microsoft.Extensions.Http.Resilience` with typed `HttpClient` for provider
resilience. Dependency versions are selected and locked when the scaffold is
implemented.

## Consequences

- Longer support runway and current platform/security APIs.
- Build agents, local setup, base images, and hosting must support .NET 10.
- Libraries must be validated for .NET 10 compatibility.
- Monthly servicing updates remain required; “LTS” does not mean unpatched.
- If an approved enterprise platform cannot host .NET 10, this ADR must be
  superseded before implementation, not silently downgraded.

## Alternatives considered

- **.NET 8 LTS:** rejected because support ends roughly three months after this
  decision.
- **.NET 9 STS:** rejected because support also ends in November 2026.
- **Non-.NET backend:** no requirement justifies losing the organization's
  preferred ASP.NET/Azure ecosystem fit.

## Validation

- Clean restore/build/test on pinned SDK and target deployment service.
- Dependency compatibility and container/hosting smoke tests.
- CI fails on unsupported runtime/servicing policy.

Reference: [Microsoft .NET releases and support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support).
