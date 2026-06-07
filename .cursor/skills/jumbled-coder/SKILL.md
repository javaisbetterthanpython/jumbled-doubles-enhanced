---
name: jumbled-coder
description: >-
  Implements a single GitHub issue for Jumbled Doubles Enhanced: branch,
  code, test, and open a PR. Use when picking up an issue, fixing review
  feedback, or acting as a composer-2.5 coder subagent.
---

# Jumbled Coder

Implement **one** GitHub issue. Stay in scope.

## Setup

```bash
git fetch origin && git checkout main && git pull origin main
git checkout -b issue-<N>-<short-name>
```

## Read first

1. Issue body: `gh issue view <N>`
2. Acceptance criteria only — do not read unrelated `src/` files
3. Skim `docs/PLAN.md` for architecture context

## Implement

- Match existing code style (NextUI, TypeScript, `useShuffler` patterns)
- Key algorithm files: `src/matching/heuristics.ts`, `src/matching/ranked-matches.tsx`, `src/useShuffler.tsx`
- Minimal diff — no drive-by refactors

## Verify

```bash
yarn test:ci
yarn build
yarn lint
```

All must pass before opening PR.

## Open PR

```bash
git add -A && git commit -m "..."
git push -u origin HEAD
gh pr create --title "[#<N>] <title>" --body "$(cat <<'EOF'
## Summary
<what changed>

## Test plan
- [ ] yarn test:ci passes
- [ ] yarn build passes
- [ ] <issue-specific checks>

Closes #<N>
EOF
)"
```

## Fix cycle (review feedback)

1. `gh pr checkout <N>`
2. Address every `REQUEST_CHANGES` item
3. Push, reply on PR threads, re-run tests

## Do not

- Merge your own PR
- Work on multiple issues in one branch
- Expand scope beyond the issue
