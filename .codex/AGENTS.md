# Codex CLI Baseline

This supplements the root `AGENTS.md` with Codex-specific guidance.

## Model Recommendations

| Task Type | Recommended Model |
|-----------|------------------|
| Routine coding, tests, formatting | GPT 5.4 |
| Complex features, architecture | GPT 5.4 |
| Debugging, refactoring | GPT 5.4 |
| Security review | GPT 5.4 |

## Skills Discovery

Skills are auto-loaded from `.agents/skills/`. Each skill contains:
- `SKILL.md` — Detailed instructions and workflow
- `agents/openai.yaml` — Codex interface metadata

Available skills:
- accessibility — WCAG 2.2 Level AA accessibility guidance
- agent-harness-construction — AI agent action spaces and tool design
- agent-introspection-debugging — Structured self-debugging workflow for agent failures
- agentic-engineering — Eval-first execution, decomposition, and cost-aware routing
- ai-first-engineering — Engineering operating model for AI-heavy workflows
- ai-regression-testing — Regression testing strategies for AI-assisted development
- api-design — REST API design patterns
- architecture-decision-records — Capture architectural decisions as ADRs
- backend-patterns — Backend architecture, API design, and data access patterns
- benchmark — Performance baselines and regression measurement
- browser-qa — Browser automation and visual testing
- coding-standards — Baseline cross-project coding conventions
- deep-research — Multi-source deep research with cited synthesis
- deployment-patterns — Deployment workflows, Docker, and CI/CD patterns
- design-system — Design system generation and review
- dmux-workflows — Multi-agent orchestration with dmux
- documentation-lookup — Up-to-date library and framework docs lookup
- docker-patterns — Docker and Docker Compose patterns
- exa-search — Neural search via Exa MCP
- frontend-patterns — React and Next.js patterns
- git-workflow — Git workflow patterns and collaboration practices
- imagegen — Generate or edit raster images
- nextjs-turbopack — Next.js 16+ and Turbopack guidance
- product-capability — Translate PRD intent into implementation-ready capability plans
- prompt-optimizer — Analyze and improve prompts
- python-patterns — Pythonic idioms, PEP 8, type hints, and maintainability
- python-testing — Python testing strategies with pytest and TDD
- repo-scan — Cross-stack source code asset audit
- security-review — Comprehensive security checklist
- seo — SEO analysis and optimization
- strategic-compact — Context management and compaction timing
- tdd-workflow — Test-driven development with 80%+ coverage
- verification-loop — Build, test, lint, typecheck, security
- taste-skill — The default design skill (v2 experimental). Read the brief, infer the design language, tune three dials (VARIANCE / MOTION / DENSITY), and ship landing pages, portfolios, and redesigns that do not look templated. Brief inference, design-system map, em-dash ban, GSAP code skeletons, hard-rules pre-flight check. Actively iterating toward v2.0.0 stable.
- taste-skill-v1 — The original v1 of taste-skill, preserved for projects depending on its exact behavior. The current default is `design-taste-frontend` (v2 experimental).
- gpt-taste — Elite Awwwards-level frontend design and GSAP motion skill for premium, deterministic, anti-slop UI generation.
- image-to-code-skill — Image-first frontend skill for generating premium website references, deeply analyzing them, and implementing code to match.
- imagegen-frontend-web — Image-generation-only skill for creating premium website design reference images. Does not write code.
- imagegen-frontend-mobile — Image-generation-only skill for creating premium mobile app screen concepts and flows. Does not write code.
- brandkit: Image-generation-only skill for creating premium brand-kit overview images with logo concepts, identity systems, color palettes, typography, and mockups. Does not write code.
- redesign-skill — For upgrading existing projects by auditing and fixing design problems.
- soft-skill: Focuses on an expensive, soft UI look with premium fonts, whitespace, depth, and smooth animations.
- output-skill — Prevents AI from being lazy, skipping code blocks, or using placeholder comments.
- minimalist-skill — Enforces clean, editorial-style interfaces (Notion/Linear style) with strict monochrome palettes.
- brutalist-skill — Raw mechanical interfaces, Swiss typography, extreme scale contrast. (Beta)
- stitch-skill — Google Stitch-compatible semantic design rules for premium AI UI generation.

## MCP Servers

Treat the project-local `.codex/config.toml` as the default Codex baseline. The current baseline enables GitHub, Context7, Exa, Memory, Playwright, and Sequential Thinking; add heavier extras in `~/.codex/config.toml` only when a task actually needs them.

The canonical Codex section name is `[mcp_servers.context7]`. The launcher package remains `@upstash/context7-mcp`; only the TOML section name is normalized for consistency with `codex mcp list` and the reference config.

### Automatic config.toml merging

The sync script uses a Node-based TOML parser to safely merge the baseline MCP servers into `~/.codex/config.toml`:

- **Add-only by default** — missing servers are appended; existing servers are never modified or removed.
- **7 managed servers** — Supabase, Playwright, Context7, Exa, GitHub, Memory, Sequential Thinking.
- **Canonical naming** — Codex manages Context7 as `[mcp_servers.context7]`; legacy `[mcp_servers.context7-mcp]` entries are treated as aliases during updates.
- **Package-manager aware** — uses the project's configured package manager (npm/pnpm/yarn/bun) instead of hardcoding `pnpm`.
- **Drift warnings** — if an existing server's config differs from the recommendation, the script logs a warning.
- **`--update-mcp`** — explicitly replaces all managed servers with the latest recommended config (safely removes subtables like `[mcp_servers.supabase.env]`).
- **User config is always preserved** — custom servers, args, env vars, and credentials outside managed sections are never touched.

## External Action Boundaries

Treat networked tools as read-only by default. Search, inspect, and draft freely within the user's requested scope, but require explicit user approval before posting, publishing, pushing, merging, opening paid jobs, dispatching remote agents, changing third-party resources, or modifying credentials.

When approval is ambiguous, produce a local plan or draft artifact instead of taking the external action. Preserve user config and private state unless the user specifically asks for a scoped change.

## Multi-Agent Support

Codex now supports multi-agent workflows behind the experimental `features.multi_agent` flag.

- Enable it in `.codex/config.toml` with `[features] multi_agent = true`
- Define project-local roles under `[agents.<name>]`
- Point each role at a TOML layer under `.codex/agents/`
- Use `/agent` inside Codex CLI to inspect and steer child agents

Sample role configs in this repo:
- `.codex/agents/explorer.toml` — read-only evidence gathering
- `.codex/agents/reviewer.toml` — correctness/security review
- `.codex/agents/docs-researcher.toml` — API and release-note verification

## Key Differences from Claude Code

| Feature | Claude Code | Codex CLI |
|---------|------------|-----------|
| Hooks | 8+ event types | Not yet supported |
| Context file | CLAUDE.md + AGENTS.md | AGENTS.md only |
| Skills | Skills loaded via plugin | `.agents/skills/` directory |
| Commands | `/slash` commands | Instruction-based |
| Agents | Subagent Task tool | Multi-agent via `/agent` and `[agents.<name>]` roles |
| Security | Hook-based enforcement | Instruction + sandbox |
| MCP | Full support | Supported via `config.toml` and `codex mcp add` |

## Security Without Hooks

Since Codex lacks hooks, security enforcement is instruction-based:
1. Always validate inputs at system boundaries
2. Never hardcode secrets — use environment variables
3. Run `npm audit` / `pip audit` before committing
4. Review `git diff` before every push
5. Use `sandbox_mode = "workspace-write"` in config

