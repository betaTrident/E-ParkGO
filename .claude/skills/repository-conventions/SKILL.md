---
name: repository-conventions
description: Repository-local conventions and patterns for this workspace.
---

# Repository Conventions

Repository-local conventions for this workspace.

## When to Use This Skill

Use this skill when making changes that should follow the repository's established patterns.

## Core Conventions

- Keep changes small and consistent with nearby code.
- Prefer conventional commits with concise, imperative subjects.
- Use camelCase naming where the repository already does.
- Prefer relative imports and the existing module style.
- Keep tests close to the code they cover and follow the existing `*.test.js` pattern.

## Repository Shape

- JavaScript only for Node.js utilities.
- Hybrid module organization.
- Separate test layout.

## Common Workflows

- Database migration: schema changes with migration files.
- Feature development: implementation, tests, and docs updates.
- Add language rules: create or update language-specific rule files under `rules/{language}/`.
