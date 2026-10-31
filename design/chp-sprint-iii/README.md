# CU Ways UX/UI handoff

**Repository snapshot:** start at [EXPORT.md](EXPORT.md) for local run/check commands, current evidence scope and archive boundaries.

Read the [design book](book/README.md) and [current project principles](book/PRINCIPLES.md) before changing components. The [searchable book](book/index.html) owns consolidated human guidance, modular records, source links, captures and visited/unvisited review coverage. Update the existing record after every edit and rendered inspection.

This folder contains the HTML-first design handoff and its source material. Start at [index.html](index.html), which links to the shared visual workbench and the five Chp-assigned Sprint III UX/UI story demonstrations (94 named states). To serve it locally from the CUWAY workspace, run `node "UX UI/serve.mjs"`; see the [workflow](WORKFLOW.md) for packaging, editing and evidence boundaries.

The [exhaustive review](book/reviews/exhaustive/root-judgment.md) covers all 94 named states and unique component families in its documented scope. Use `CU-Ways-HTML-Handoff-v1.7.0-exhaustive.zip` for the completed review phase; the earlier version-only archive is preserved. Human acceptance and palette judgment remain pending.

## Current 1.9 iteration

[Review and exact coverage](book/reviews/1.9.1/root-judgment.md) · [Compare palette roles](theme/color-review.html) · [Machine component index](book/INDEX.md) · [Implemented UI context CLI](tools/ui/README.md). Purple was rejected and removed. The slate-blue / blue-teal replacement remains proposed pending human judgment. Compiler-derived scope and strict ownership/rendered checks now enforce shared components. Content dialogs, loading structure, minimal previews and consistency checks use the shared sources. The earlier 1.7 archives remain preserved.

## Shared system

The current design revision is [CU Ways Rose × Slate 1.9.1](theme/README.md). See [the rendered review record](REVIEW.md) for coverage and limits. It carries the selected Round 10 appearance and inspected frontend patterns forward with later user corrections. Do not dismiss Round 10 as historical during visual comparison; use its [latest direction notes](US-025/color-playground/ROUND-10.md) when intermediate screenshots disagree. Figma/SVG remain read-only unless the user explicitly authorizes edits. [theme.json](theme/theme.json) owns promoted shared and Light/Dark values. The generated [reference](theme/REFERENCE.md) lists resolved values and statuses. The [component guide](theme/COMPONENTS.md), [parameter guide](theme/PARAMETERS.md), [specialization rules](theme/SPECIALIZATION.md) and [adoption handoff](theme/ADOPTION.md) explain how future work inherits the system.

Stories keep their own requirements, behavior, routes, copy and content-driven layout. Reuse shared theme tokens and component recipes; do not elevate a demo coordinate or local exception into a global rule. Story specialization records are decisions only: the host must explicitly bind each approved alias. Visual acceptance requires a fresh, unbiased review of the rendered work; green functional checks alone do not approve its appearance. Application migration remains pending.

## Stories assigned to Chp — Sprint III

| Story | Scope | Current handoff status |
| --- | --- | --- |
| [US-025](US-025/README.md) | My Jobs entry; start an accepted job; confirmation, status and rejection feedback | Interactive HTML handoff with 41 state definitions and local mock behavior; application implementation is separate and pending |
| [US-026](US-026/README.md) | Proof-link submission, URL/timestamp list and validation | Interactive HTML demo covers 14 canonical states with shared theme 1.9.0; prior independent review is recorded in its demo/REVIEW.md; application implementation remains separate |
| [US-027](US-027/README.md) | Completion-blocked warning and US031 prerequisites | Interactive HTML studio, 14 canonical states |
| [US-028](US-028/README.md) | Job cancellation and warning states | Interactive HTML studio, 15 canonical states |
| [US-034](US-034/README.md) | Verified profile reviews and empty state | Interactive HTML studio, 10 canonical states |

Source: `Backlog (3).xlsx`, Sprint Backlog III. Chp owns 12 UX/UI tasks / 6.5 estimated hours; the additional minimal My Jobs entry was authorized in this chat on 21 October 2026.

## Unpromoted extra drafts — outside current scope

The user clarified on 29 October 2026: complete only the three remaining Chp stories, US027, US028 and US034. Tim’s US029/US032/US033 files had already been generated before that answer arrived. They are preserved as unpromoted local drafts, excluded from the main library and portable bundle, and receive no further implementation or review under this request.

| Story | Scope | Current handoff status |
| --- | --- | --- |
| US-029 (local draft only) | Payment method, exact amount, confirmation and Paid record | Interactive HTML studio, 14 canonical states |
| US-032 (local draft only) | Participant-only transaction breakdown and empty history | Interactive HTML studio, 10 canonical states |
| US-033 (local draft only) | 1–5 rating, optional comment, confirmation and duplicate guard | Interactive HTML studio, 15 canonical states |

US031’s system completion prerequisites remain represented in US027; no additional payment story is included in the scoped handoff. See [current implementation and review evidence](stories/REVIEW.md). The new shared story host is a named task-composition specialization; it uses the existing theme and never modifies historical Figma/SVG exports.

## Story ownership and boundaries

Each story owns its accepted requirements, flow/state model, responsive composition, component and copy decisions, integration handoff, acceptance criteria and source links. Shared visual rules come from the global theme; a story can specialize them only through a scoped, reviewed decision.

Visual authority is: current explicit user decisions → the selected Round 10 appearance and inspected frontend as comparison inputs, corrected by later user decisions → shared baseline defaults. Accepted story requirements continue to own behavior and copy. Round 10 remains a visual comparison source, not an approval of new renders. Figma stays untouched unless the user explicitly reauthorizes work in it. HTML previews use local fixtures and mock behavior; they do not call product APIs, persist application data or prove application integration.
