# Autonomous Agent Workflow

This repo is designed for **mostly autonomous** development using Cursor agents, GitHub Issues, and PRs.

## Quick Start

In a new Cursor chat in this repo:

```
Run the jumbled orchestrator: pick the next open issue, dispatch a coder, then a reviewer.
```

Or use slash commands (if configured in `.cursor/commands/`):

- `/jumbled-tick` — Run one full issue cycle (coder → reviewer → merge or fix loop)
- `/jumbled-status` — List open issues and in-flight PRs
- `/jumbled-review-pr <number>` — Review a specific PR

## Roles

| Role | Skill | Model | Job |
|------|-------|-------|-----|
| **Orchestrator** | `.cursor/skills/jumbled-orchestrator/` | Any | Pick issues, dispatch workers, track state |
| **Coder** | `.cursor/skills/jumbled-coder/` | composer-2.5 | Implement issue, open PR, link issue |
| **Reviewer** | `.cursor/skills/jumbled-reviewer/` | composer-2.5 | Review PR; APPROVE or REQUEST_CHANGES |
| **Fixer** | `.cursor/skills/jumbled-coder/` | composer-2.5 | Address review feedback on same branch |

## Issue → PR → Merge Loop

```
1. Orchestrator reads docs/ISSUE_QUEUE.md + `gh issue list`
2. Picks highest-priority open issue with satisfied dependencies
3. Assigns issue: `gh issue edit N --add-assignee @me`
4. Dispatches Coder subagent with issue number + acceptance criteria
5. Coder: branch `issue-N-short-name` → implement → `yarn test:ci && yarn build` → PR
6. Coder: `gh pr create` with "Closes #N" in body
7. Dispatches Reviewer subagent with PR number
8. Reviewer checks out PR, runs tests, compares to acceptance criteria
9. If REQUEST_CHANGES: dispatch Fixer → push → re-dispatch Reviewer (repeat)
10. If APPROVE: `gh pr merge --squash` → close issue → update ISSUE_QUEUE.md
```

## Context Window Management

Each worker gets **minimal context**:

| Worker | Reads | Does NOT read |
|--------|-------|---------------|
| Coder | Issue body, `docs/PLAN.md` (skim), relevant `src/` files | Full repo, other PRs |
| Reviewer | PR diff, issue acceptance criteria, changed files | Unrelated modules |
| Orchestrator | `ISSUE_QUEUE.md`, `gh issue list`, open PRs | Source code |

Use **issue bodies** as the single source of truth for scope. Keep issues small (one concern per issue).

## Branch Naming

`issue-<number>-<kebab-summary>` e.g. `issue-2-fixed-pairs-model`

## PR Requirements

- Title: `[#N] Short description`
- Body must include `Closes #N` and a test plan checklist
- Tests, build, and lint must pass locally before merge (no GitHub Actions CI)
- Reviewer must leave `APPROVE` or `REQUEST_CHANGES` as a PR comment

## Running Multiple Workers

Independent issues can run in parallel (e.g. #6 and #2 after #1 merges):

```
Dispatch 3 coder subagents for issues #2, #6, #12 in parallel.
Each uses model composer-2.5 and the jumbled-coder skill.
```

Dependent issues wait for blockers (see dependency graph in `docs/PLAN.md`).

## Continuous Loop

For unattended runs, use the loop skill or repeat:

```
/loop 10m /jumbled-tick
```

Or ask the orchestrator:

```
Keep running jumbled-tick until all issues are closed or you hit a blocker.
```

## Files

| File | Purpose |
|------|---------|
| `docs/PLAN.md` | Architecture and milestones |
| `docs/ISSUE_QUEUE.md` | Priority queue and status (updated by orchestrator) |
| `.cursor/skills/jumbled-orchestrator/SKILL.md` | Orchestrator instructions |
| `.cursor/skills/jumbled-coder/SKILL.md` | Coder instructions |
| `.cursor/skills/jumbled-reviewer/SKILL.md` | Reviewer instructions |
| `.github/ISSUE_TEMPLATE/feature.md` | Issue template |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template |
