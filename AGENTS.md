# Agent Instructions

This is a **production-ready AI coding plugin** providing 18 specialized agents, 28 skills, and automated hook workflows for software development.

**Version:** 2.0.0-rc.1

## Core Principles

1. **Agent-First** — Delegate to specialized agents for domain tasks
2. **Test-Driven** — Write tests before implementation, 80%+ coverage required
3. **Security-First** — Never compromise on security; validate all inputs
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design and scalability | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code quality and maintainability | After writing/modifying code |
| security-reviewer | Vulnerability detection | Before commits, sensitive code |
| build-error-resolver | Fix build/type errors | When build fails |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation and codemaps | Updating docs |
| docs-lookup | Documentation lookup via Context7 | API/docs questions |
| python-reviewer | Python code review | Python projects |
| typescript-reviewer | TypeScript/JavaScript code review | TypeScript/JavaScript projects |
| code-architect | Code architecture analysis | Structural decisions |
| code-explorer | Codebase exploration and navigation | Understanding unfamiliar code |
| code-simplifier | Code simplification and clarity | Reducing complexity |
| comment-analyzer | Code comment quality analysis | Documentation review |
| performance-optimizer | Performance profiling and tuning | Performance bottlenecks |
| seo-specialist | SEO analysis and optimization | Search visibility |
| silent-failure-hunter | Detect silent failures and swallowed errors | Reliability audits |

## Agent Orchestration

Use agents proactively without user prompt:
- Complex feature requests → **planner**
- Code just written/modified → **code-reviewer**
- Bug fix or new feature → **tdd-guide**
- Architectural decision → **architect**
- Security-sensitive code → **security-reviewer**
- Performance bottlenecks → **performance-optimizer**
- SEO improvements → **seo-specialist**

Use parallel execution for independent operations — launch multiple agents simultaneously.

## Composer 2.5 Execution Protocol

> **For Composer 2.5**: Read this entire section before taking any action in this project, every session.

### Boot Sequence (Every Session)

1. Read `AGENTS.md` (this file) — done if you are reading this now.
2. Read `PLAN.md §0` — the Composer 2.5 Execution Guide with current phase status, active step, and gate checklist.
3. Use the `Read` tool to load **every skill file listed** in the Phase Skills Routing Table for the current phase.
4. Check the gate conditions for the current phase before making any changes.

### Execution Rules

1. **Skills before code.** For every phase, load all listed skill files with the `Read` tool before writing a single line of implementation. Skills carry live API patterns and known gotchas that override training data.
2. **One phase gate at a time.** Never begin Phase N+1 without running and passing every gate verification command from Phase N. Record the results.
3. **Verify after each step.** Each numbered step in a phase ends with a verification command. Run it, confirm the expected output, then proceed. If it fails, fix the failure before moving on — do not skip.
4. **No invented APIs.** If any library API (Next.js App Router, Supabase, shadcn/ui, Playwright, Vitest) is uncertain, call Context7 MCP (`resolve-library-id` then `query-docs`) before writing code.
5. **Exact commands only.** Use the PowerShell commands exactly as specified. Do not substitute flags, change paths, or add unlisted arguments.
6. **Context budget.** When context window utilisation exceeds 70%, stop at the nearest phase step boundary, commit all created or modified files, summarise completed steps, and continue in a fresh session.
7. **File size discipline.** Target 200–400 lines per file. Hard cap is 800 lines. If a file exceeds 400 lines during implementation, stop and evaluate whether to split it before writing more. Log any deliberate exception in `docs/adr/`.
8. **PostgreSQL owns authoritative logic.** If the functionality being implemented already exists in a PostgreSQL RPC (fee calculation, state transitions, official timestamps, idempotency), call the RPC — never reimplement it in TypeScript.
9. **No hardcoded values.** Every secret, key, URL, and configurable constant goes through `src/lib/env.ts` or a named constant. Nothing is inline.
10. **Immutability is mandatory.** Return new objects with spread; never mutate in place. This is enforced across all TypeScript, SQL functions, and state management.

### Anti-Hallucination Constraints

| Domain | Constraint |
|--------|-----------|
| **Supabase** | Read the `supabase` skill before ANY Supabase task. Never guess `createServerClient`, `createBrowserClient`, or `@supabase/ssr` signatures. The skill instructs you to fetch the changelog first. |
| **Next.js App Router** | Use Context7 (`/vercel/next.js`) for `cookies()`, `headers()`, `redirect()`, `notFound()`, Server Actions, and Middleware. These APIs change between minor versions. |
| **shadcn/ui** | Add components with `npx shadcn@latest add <component>` only. Never write shadcn component source code manually. |
| **RLS & SQL functions** | Read `supabase-postgres-best-practices` skill before writing any RLS policy or `SECURITY DEFINER` function. Every such function needs a fixed empty `search_path`. |
| **Environment variables** | Every variable must exist in `.env.example` with an ownership comment. Never reference a variable not in `.env.example`. |
| **Zod validation** | Schemas live at the Route Handler boundary. Never trust client-supplied `actor_id`, `location_id`, `total_centavos`, `entry_time`, or session state. |
| **Money arithmetic** | All fees are `bigint` integer centavos. Never use `float`, `Number.parseFloat`, or division for fee values. Format for display only in UI layer. |
| **Timestamps** | All stored instants are UTC `timestamptz`. `clock_timestamp()` in PostgreSQL is the only authoritative source for entry, payment, and exit times. |
| **QR tokens** | Raw tokens are shown once (issuance response + immediate print surface) and never logged, cached, stored in IndexedDB, or placed in API paths. Only the SHA-256 hash is persisted. |

### Phase Skills Routing Table

Load skills with the `Read` tool on the listed absolute paths **before writing any code for that phase**. Project skills are listed first; IDE plugin skills follow and are marked `[plugin]`.

| Phase | Objective | Project skills | IDE plugin skills |
|-------|-----------|---------------|-------------------|
| 2 | Scaffolding | `nextjs-turbopack`, `repository-conventions`, `supabase`, `git-workflow`, `coding-standards`, `tdd-workflow`, `design-system` | `v-nextjs`, `v-turbopack`, `v-shadcn`, `v-env-vars`, `sp-executing` |
| 3 | Database foundation | `supabase`, `supabase-postgres-best-practices`, `backend-patterns` | `plug-supabase`, `plug-supabase-pg`, `context7-mcp` |
| 4 | Auth & authorization | `supabase`, `security-review`, `backend-patterns` | `plug-supabase`, `v-auth`, `v-routing-middleware` |
| 5 | Facility, spaces, rates | `backend-patterns`, `api-design`, `supabase` | `v-vercel-functions`, `plug-supabase`, `sp-executing` |
| 6 | Entry & QR ticket | `backend-patterns`, `security-review`, `api-design` | `v-vercel-functions`, `sp-executing` |
| 7 | Validation, fee, exit preview | `backend-patterns`, `supabase-postgres-best-practices` | `plug-supabase-pg`, `sp-executing` |
| 8 | Cash payment & confirmed exit | `backend-patterns`, `security-review`, `supabase` | `plug-supabase`, `sp-executing` |
| 9 | Dashboard & Realtime | `frontend-patterns`, `supabase`, `accessibility` | `v-react-best-practices`, `v-next-cache-components`, `plug-supabase`, `c-canvas` |
| 10 | Reports & audit | `backend-patterns`, `frontend-patterns` | `v-react-best-practices`, `c-canvas` |
| 11 | PWA & offline | `frontend-patterns`, `supabase` | `v-runtime-cache`, `v-next-cache-components` |
| 12 | Security hardening | `security-review`, `supabase-postgres-best-practices` | `plug-supabase-pg`, `c-security-review` |
| 13 | Release test suite | `tdd-workflow`, `ai-regression-testing`, `verification-loop` | `pl-browser-automation`, `c-review-bugbot`, `sp-finish-branch`, `v-verification` |
| 14 | Staging & deploy | `deployment-patterns`, `supabase`, `docker-patterns` | `v-deployments-cicd`, `v-vercel-cli`, `v-vercel-agent`, `v-verification`, `sp-finish-branch`, `c-split-prs` |
| 15 | Docs & handover | `documentation-lookup` | `context7-mcp` |

### Cross-Phase Plugin Skills

These skills apply broadly across multiple phases. Load them whenever the named situation arises, regardless of active phase:

| Situation | Load this plugin skill |
|-----------|------------------------|
| Looking up any library, framework, SDK, or API docs | `context7-mcp` |
| Launching parallel independent sub-tasks | `sp-parallel-agents` |
| Requesting a code review after writing code | `sp-requesting-review` |
| Receiving and acting on a code review | `sp-receiving-review` |
| Complex multi-step feature work | `sp-subagent-driven` |
| Running iterative fix/verify loops | `c-loop` |
| Checking progress across phases | `c-statusline` |
| Security review before any commit | `c-security-review` |
| Bug detection after any implementation phase | `c-review-bugbot` |

---

### Skill Absolute Paths

#### Project Skills (`k:\E-ParkGO\`)

| Alias | Absolute path |
|-------|---------------|
| `nextjs-turbopack` | `k:\E-ParkGO\.agents\skills\nextjs-turbopack\SKILL.md` |
| `repository-conventions` | `k:\E-ParkGO\.claude\skills\repository-conventions\SKILL.md` |
| `supabase` | `k:\E-ParkGO\.agents\skills\supabase\SKILL.md` |
| `supabase-postgres-best-practices` | `k:\E-ParkGO\.agents\skills\supabase-postgres-best-practices\SKILL.md` |
| `git-workflow` | `k:\E-ParkGO\.agents\skills\git-workflow\SKILL.md` |
| `coding-standards` | `k:\E-ParkGO\.agents\skills\coding-standards\SKILL.md` |
| `tdd-workflow` | `k:\E-ParkGO\.agents\skills\tdd-workflow\SKILL.md` |
| `design-system` | `k:\E-ParkGO\.agents\skills\design-system\SKILL.md` |
| `backend-patterns` | `k:\E-ParkGO\.agents\skills\backend-patterns\SKILL.md` |
| `api-design` | `k:\E-ParkGO\.agents\skills\api-design\SKILL.md` |
| `frontend-patterns` | `k:\E-ParkGO\.agents\skills\frontend-patterns\SKILL.md` |
| `security-review` | `k:\E-ParkGO\.agents\skills\security-review\SKILL.md` |
| `accessibility` | `k:\E-ParkGO\.agents\skills\accessibility\SKILL.md` |
| `ai-regression-testing` | `k:\E-ParkGO\.agents\skills\ai-regression-testing\SKILL.md` |
| `verification-loop` | `k:\E-ParkGO\.agents\skills\verification-loop\SKILL.md` |
| `deployment-patterns` | `k:\E-ParkGO\.agents\skills\deployment-patterns\SKILL.md` |
| `docker-patterns` | `k:\E-ParkGO\.agents\skills\docker-patterns\SKILL.md` |
| `documentation-lookup` | `k:\E-ParkGO\.agents\skills\documentation-lookup\SKILL.md` |

#### IDE Plugin Skills — Vercel (`v-*`)

> These are the **official Vercel Cursor plugin** skills. Prefer these over web search for Next.js, Vercel CLI, deployment, and React patterns.

| Alias | Absolute path |
|-------|---------------|
| `v-nextjs` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\nextjs\SKILL.md` |
| `v-turbopack` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\turbopack\SKILL.md` |
| `v-shadcn` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\shadcn\SKILL.md` |
| `v-auth` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\auth\SKILL.md` |
| `v-env-vars` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\env-vars\SKILL.md` |
| `v-routing-middleware` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\routing-middleware\SKILL.md` |
| `v-vercel-functions` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\vercel-functions\SKILL.md` |
| `v-react-best-practices` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\react-best-practices\SKILL.md` |
| `v-next-cache-components` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\next-cache-components\SKILL.md` |
| `v-runtime-cache` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\runtime-cache\SKILL.md` |
| `v-deployments-cicd` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\deployments-cicd\SKILL.md` |
| `v-vercel-cli` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\vercel-cli\SKILL.md` |
| `v-vercel-agent` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\vercel-agent\SKILL.md` |
| `v-verification` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\verification\SKILL.md` |

#### IDE Plugin Skills — Supabase (`plug-*`)

> These are the **official Supabase Cursor plugin** skills. They track the current Supabase release more closely than the project copies — use alongside the project `supabase` skill.

| Alias | Absolute path |
|-------|---------------|
| `plug-supabase` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase\SKILL.md` |
| `plug-supabase-pg` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase-postgres-best-practices\SKILL.md` |

#### IDE Plugin Skills — Superpowers (`sp-*`)

> Workflow orchestration skills for agentic execution, parallel agents, and code review cycles.

| Alias | Absolute path |
|-------|---------------|
| `sp-executing` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\executing-plans\SKILL.md` |
| `sp-parallel-agents` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\dispatching-parallel-agents\SKILL.md` |
| `sp-finish-branch` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\finishing-a-development-branch\SKILL.md` |
| `sp-requesting-review` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\requesting-code-review\SKILL.md` |
| `sp-receiving-review` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\receiving-code-review\SKILL.md` |
| `sp-subagent-driven` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\subagent-driven-development\SKILL.md` |

#### IDE Plugin Skills — Browser Automation (`pl-*`)

> Playwright and browser automation patterns for E2E tests.

| Alias | Absolute path |
|-------|---------------|
| `pl-browser-automation` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\browse\release_v0.2.4\skills\browser-automation\SKILL.md` |

#### IDE Plugin Skills — Context7 (`context7-mcp`)

> Fetches live documentation for any library, framework, SDK, or cloud service. Use this before any API call you are uncertain about.

| Alias | Absolute path |
|-------|---------------|
| `context7-mcp` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\context7-plugin\58a36cea87ea887e7bb4850409f1f9ea58dae5e5\skills\context7-mcp\SKILL.md` |

#### IDE Plugin Skills — Cursor Tools (`c-*`)

> Built-in Cursor IDE workflow skills for code review, bug detection, iteration loops, and PR management.

| Alias | Absolute path |
|-------|---------------|
| `c-review-bugbot` | `C:\Users\Dennis\.cursor\skills-cursor\review-bugbot\SKILL.md` |
| `c-security-review` | `C:\Users\Dennis\.cursor\skills-cursor\review-security\SKILL.md` |
| `c-canvas` | `C:\Users\Dennis\.cursor\skills-cursor\canvas\SKILL.md` |
| `c-loop` | `C:\Users\Dennis\.cursor\skills-cursor\loop\SKILL.md` |
| `c-split-prs` | `C:\Users\Dennis\.cursor\skills-cursor\split-to-prs\SKILL.md` |
| `c-statusline` | `C:\Users\Dennis\.cursor\skills-cursor\statusline\SKILL.md` |

## Web Research Tooling

When web search, web crawling, or full-page extraction is needed, use Firecrawl MCP as the primary web data provider whenever it is available. If Firecrawl tools are not already loaded, discover them through `tool_search` first, then use the Firecrawl search, scrape, crawl, or extract tool that matches the task.

Use more specific documentation tools before general web search when they apply:
- OpenAI docs tooling for OpenAI product/API questions.
- Context7 or docs-lookup for library, framework, SDK, CLI, and cloud-service documentation.
- Supabase docs/MCP tooling for Supabase-specific schema, auth, RLS, Edge Function, CLI, and platform questions.

Use the built-in web search/browser tools only for quick lightweight lookups, specialized built-in data tools such as finance/weather/sports/time, opening a known URL, or as a fallback when Firecrawl or the more specific docs tool is unavailable or fails.

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

**Secret management:** NEVER hardcode secrets. Use environment variables or a secret manager. Validate required secrets at startup. Rotate any exposed secrets immediately.

**If security issue found:** STOP → use security-reviewer agent → fix CRITICAL issues → rotate exposed secrets → review codebase for similar issues.

## Coding Style

**Immutability (CRITICAL):** Always create new objects, never mutate. Return new copies with changes applied.

**File organization:** Many small files over few large ones. 200-400 lines typical, 800 max. Organize by feature/domain, not by type. High cohesion, low coupling.

**Error handling:** Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side. Never silently swallow errors.

**Input validation:** Validate all user input at system boundaries. Use schema-based validation. Fail fast with clear messages. Never trust external data.

**Code quality checklist:**
- Functions small (<50 lines), files focused (<800 lines)
- No deep nesting (>4 levels)
- Proper error handling, no hardcoded values
- Readable, well-named identifiers

## Testing Requirements

**Minimum coverage: 80%**

Test types (all required):
1. **Unit tests** — Individual functions, utilities, components
2. **Integration tests** — API endpoints, database operations
3. **E2E tests** — Critical user flows

**TDD workflow (mandatory):**
1. Write test first (RED) — test should FAIL
2. Write minimal implementation (GREEN) — test should PASS
3. Refactor (IMPROVE) — verify coverage 80%+

Troubleshoot failures: check test isolation → verify mocks → fix implementation (not tests, unless tests are wrong).

## Development Workflow

1. **Plan** — Use planner agent, identify dependencies and risks, break into phases
2. **TDD** — Use tdd-guide agent, write tests first, implement, refactor
3. **Review** — Use code-reviewer agent immediately, address CRITICAL/HIGH issues
4. **Capture knowledge in the right place**
   - Personal debugging notes, preferences, and temporary context → auto memory
   - Team/project knowledge (architecture decisions, API changes, runbooks) → the project's existing docs structure
   - If the current task already produces the relevant docs or code comments, do not duplicate the same information elsewhere
   - If there is no obvious project doc location, ask before creating a new top-level file
5. **Commit** — Conventional commits format, comprehensive PR summaries

## Workflow Surface Policy

- `contexts/` is the team-facing home for agent-related project assets.
- `.agents/skills/` remains the runtime-loaded skill surface.
- Keep root-level AI docs limited to `AGENTS.md`, `RULES.md`, and tool manifests.
- New workflow contributions should land in the organized surfaces above instead of adding new root directories.

## Git Workflow

**Commit format:** `<type>: <description>` — Types: feat, fix, refactor, docs, test, chore, perf, ci

**PR workflow:** Analyze full commit history → draft comprehensive summary → include test plan → push with `-u` flag.

## Architecture Patterns

**API response format:** Consistent envelope with success indicator, data payload, error message, and pagination metadata.

**Repository pattern:** Encapsulate data access behind standard interface (findAll, findById, create, update, delete). Business logic depends on abstract interface, not storage mechanism.

**Skeleton projects:** Search for battle-tested templates, evaluate with parallel agents (security, extensibility, relevance), clone best match, iterate within proven structure.

## Performance

**Context management:** Avoid last 20% of context window for large refactoring and multi-file features. Lower-sensitivity tasks (single edits, docs, simple fixes) tolerate higher utilization.

**Build troubleshooting:** Use build-error-resolver agent → analyze errors → fix incrementally → verify after each fix.

## Project Structure

```text
contexts/
  agents/        — team-maintained agent definitions
  rules/         — always-follow guidance by stack/domain
  baseline/      — base rules, standards, and templates for new projects and agents
.agents/
  skills/        — runtime-loaded skills and plugin asset
```

## Success Metrics

- All tests pass with 80%+ coverage
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
