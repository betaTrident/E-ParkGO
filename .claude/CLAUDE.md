# CLAUDE.md

This file gives repo-local guidance for AI-assisted work in this workspace.

## Project Overview

This repository contains the prompts, agents, skills, rules, and hook/config files used to support the codebase.

## Running Tests

```bash
node tests/run-all.js
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

## Repository Layout

- `agents/` - Specialized subagents for delegation
- `skills/` - Workflow definitions and domain knowledge
- `commands/` - Slash commands used by the workspace
- `hooks/` - Trigger-based automations
- `rules/` - Always-follow guidelines
- `scripts/` - Cross-platform Node.js utilities
- `tests/` - Test suite for scripts and utilities

## Development Notes

- Package manager detection supports npm, pnpm, yarn, and bun.
- The repo uses CommonJS for Node.js utilities.
- Agent files use Markdown with YAML frontmatter.
- Skill files should stay concise and task-focused.

## Contributing

Follow the formats already used in this repository for agents, skills, commands, and hooks.
