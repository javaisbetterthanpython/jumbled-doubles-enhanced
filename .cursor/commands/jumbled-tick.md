---
description: Run one orchestrator cycle — pick next issue, coder or reviewer, merge if approved
---

Read and follow `.cursor/skills/jumbled-orchestrator/SKILL.md`.

Run one full tick:
1. Check `docs/ISSUE_QUEUE.md` and open GitHub issues/PRs
2. Pick the next actionable issue or in-review PR
3. Dispatch a composer-2.5 subagent as coder or reviewer per the skill
4. If a PR has APPROVE (tests/build/lint verified locally), merge it
5. Update `docs/ISSUE_QUEUE.md`

Report what happened and what to run next.
