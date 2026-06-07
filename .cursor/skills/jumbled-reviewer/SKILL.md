---
name: jumbled-reviewer
description: >-
  Reviews PRs for Jumbled Doubles Enhanced against issue acceptance criteria.
  Comments APPROVE or REQUEST_CHANGES. Use when reviewing a jumbled PR or
  acting as a reviewer subagent before merge.
---

# Jumbled Reviewer

Review **one** PR. Do not implement fixes — only report findings.

## Setup

```bash
gh pr checkout <PR_NUMBER>
gh issue view <ISSUE_NUMBER>
git diff main...HEAD --stat
```

## Checklist

1. **Scope**: Changes match issue only; no unrelated edits
2. **Correctness**: Logic handles edge cases (odd players, sit-outs, fixed pairs)
3. **Tests**: New behavior has tests if issue requires them
4. **CI**: `yarn test:ci && yarn build && yarn lint` pass locally
5. **Style**: Matches project conventions

## Severity

- 🔴 **Critical**: Must fix before merge (bugs, broken tests, data loss)
- 🟡 **Suggestion**: Should fix (missing edge case, weak test)
- 🟢 **Nit**: Optional (naming, comment style)

## Verdict

Post a single PR comment starting with exactly one of:

```
APPROVE

<summary>
```

```
REQUEST_CHANGES

<summary>

## Findings
- 🔴 ...
- 🟡 ...
- 🟢 ...
```

## Merge rules

- Only `APPROVE` with zero 🔴 and zero 🟡 allows merge
- 🟢 nits alone → still APPROVE
- If REQUEST_CHANGES, orchestrator dispatches fixer coder

## Do not

- Merge the PR (orchestrator does after APPROVE)
- Request changes for pure 🟢 nits
