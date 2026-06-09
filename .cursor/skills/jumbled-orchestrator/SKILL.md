---
name: jumbled-orchestrator
description: >-
  Orchestrates autonomous development of Jumbled Doubles Enhanced. Picks the
  next GitHub issue, dispatches coder/reviewer subagents, and manages the PR
  merge loop. Use when running jumbled-tick, managing the issue queue, or
  coordinating parallel composer-2.5 workers on this repo.
---

# Jumbled Orchestrator

Coordinate issue-driven development for this repo.

## One Tick (full cycle)

1. Read `docs/ISSUE_QUEUE.md` and run `gh issue list --state open --json number,title,labels`
2. Pick the highest-priority issue whose dependencies are **done** (merged PRs)
3. If an issue already has an open PR in review, dispatch **reviewer** instead of coder
4. If reviewer left `REQUEST_CHANGES`, dispatch **fixer** (coder skill, same branch)
5. If reviewer left `APPROVE`, merge: `gh pr merge <n> --squash --delete-branch` (verify tests/build/lint locally — no GitHub CI)
6. Update `docs/ISSUE_QUEUE.md` status column

## Dispatch Coder

Launch a Task subagent with `model: composer-2.5` and this prompt shape:

```
Read .cursor/skills/jumbled-coder/SKILL.md and follow it.
Issue: #<N> — <title>
Repo: <path>
Branch from main. Implement, test, open PR. Closes #<N>.
```

## Dispatch Reviewer

```
Read .cursor/skills/jumbled-reviewer/SKILL.md and follow it.
PR: #<N>
Issue: #<M>
Verify acceptance criteria. Comment APPROVE or REQUEST_CHANGES on the PR.
```

## Parallel dispatch

After issue #1 merges, up to 4 coders can run in parallel on issues #2, #6, #7, #12.
Never dispatch two coders on the same issue.

## Blockers

Stop and report if: merge conflict unresolvable, tests fail after 2 fix cycles, issue scope unclear.

## Status command

```bash
gh issue list --state open
gh pr list --state open
```
