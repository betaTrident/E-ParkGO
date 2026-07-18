# Repository Guardrails

This file captures the repo-local conventions that should stay stable unless the project itself changes.

## Commit Workflow

- Prefer conventional commit messages such as `fix`, `test`, `feat`, and `docs`.
- Keep changes aligned with the review flow already used in this repository.

## Architecture

- Preserve the current hybrid module organization.
- Respect the current separate test layout.

## Code Style

- Use camelCase file naming.
- Prefer relative imports and mixed exports.

## Repository Defaults

- Keep riskier config changes small and reviewable.
- Keep generated manifests and workflow files under source control.

## Detected Workflows

- database-migration: Database schema changes with migration files
- feature-development: Standard feature implementation workflow
- add-language-rules: Adds a new programming language to the rules system, including coding style, hooks, patterns, security, and testing guidelines.

## Review Reminder

- Refresh this file when repository conventions materially change.
- Keep suppressions narrow and auditable.