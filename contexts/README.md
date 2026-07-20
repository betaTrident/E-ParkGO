# AI Workspace

This directory is the team-facing home for project-specific AI workflow assets.

## Layout

- `agents/` — human-maintained agent definitions
- `rules/` — reusable policy and implementation guidance by stack/domain
- `plans/phases/` — Composer 2.5 phase playbooks selected by `PLAN.md §0.2`
- `plans/evidence/` — append-only phase gate attempts and completion evidence

## Runtime Note

Codex still auto-loads skills from the hidden `.agents/skills/` directory.
Keep that runtime surface aligned with the documented workflow in `AGENTS.md`.

## Phase Playbook Rule

`PLAN.md §0.2` is the only current-phase authority. Read only the playbook named
there, complete its gate, update the completion record, and stop. A future-phase
playbook is specification only and does not authorize edits to its owned files.
