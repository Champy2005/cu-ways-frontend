# Standalone UX/UI handoff

This is HTML/CSS/JS reference material, separate from the Next.js app. Read README.md, EXPORT.md, WORKFLOW.md, book/PRINCIPLES.md and the owning book/records entry before editing. Shared values/markup belong to theme/theme.json, theme/components.mjs and theme/recipes.css; stories own behavior, copy and intrinsic composition.

Preserve human decisions, pending palette judgment and unvisited scope. Material visual edits require component/parent/page inspection in both themes and relevant responsive/keyboard/fallback states, plus fresh independent rendered review before visual acceptance. The full workspace retains original references and the evidence workflow; this export excludes capture archives and compiler tooling.

Run `node check-handoff.mjs` and `node package-handoff.mjs` here. Preserve runtime bytes unless a change is intended; the standalone export uses its own checks. Keep logs, screenshots, caches and exports under ignored .artifacts/. Do not add mock state machines to application src/ without a separate adoption task.
