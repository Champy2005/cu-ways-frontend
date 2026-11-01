# US-025 · Start an accepted job

[Studio](demo/index.html) · [Product screen](demo/screen.html) · [Scenario model](model/scenarios.json) · [Shared workbench](../theme/lab.html)

The current HTML handoff exposes 41 states: My Jobs L01–L09, job detail D01–D10, confirmation C01–C08 and recovery R01–R14. It uses the shared Rose × Slate 1.9.1 theme. See [demo controls](demo/README.md) and the [export instructions](../EXPORT.md).

## Essential specification

1. [Requirements and contract conflicts](01-requirements.md)
2. [Flows and states](02-flows-and-states.md)
3. [Responsive layout](03-responsive-layouts.md)
4. [Components and copy](04-components-and-copy.md)
5. [Integration handoff and proposed contracts](05-integration-handoff.md)
6. [Acceptance criteria and scenario coverage](06-acceptance-and-frames.md)
7. [Decisions and implementation prerequisites](07-decisions-and-readiness.md)

These specifications retain story reasoning and historical proposals. Current explicit user decisions, the [principles](../book/PRINCIPLES.md), [decision records](../book/README.md), current canonical theme and scenario model take precedence over older visual details. Screenshots, study boards and review archives are excluded from this export and remain in the original workspace.

A hired-marketer job read contract and Start operation need current frontend/backend agreement before application adoption. Proposed endpoints and failure semantics in the specification are not existing API guarantees. Resolve the backlog's conflicting transition/trigger wording with the story owner.

Fixtures and simulated requests do not prove real permissions, concurrency or persistence. Pending Start can be dismissed and revisited without cancelling or duplicating the dispatched operation. Uncertain outcomes require reconciliation. Human palette and complete-page acceptance remain pending.
