#!/usr/bin/env bash
# Creates all project issues. Run once after repo setup.
set -euo pipefail

REPO="javaisbetterthanpython/jumbled-doubles-enhanced"

gh issue create --repo "$REPO" --title "Project bootstrap and attribution" --body "$(cat <<'EOF'
## Summary
Verify the fork builds and runs locally. Ensure attribution to upstream pickleball-shuffler is clear. Rename package to jumbled-doubles-enhanced.

## Acceptance criteria
- [ ] `yarn install && yarn test:ci && yarn build` all pass on main
- [ ] README documents upstream attribution and new features
- [ ] ATTRIBUTION.md present
- [ ] `package.json` name is `jumbled-doubles-enhanced`
- [ ] App runs at `yarn dev` and landing page loads

## Files likely touched
- README.md, ATTRIBUTION.md, package.json

## Test plan
- [ ] yarn test:ci
- [ ] yarn build
- [ ] yarn dev (manual smoke)

## Dependencies
none
EOF
)"

gh issue create --repo "$REPO" --title "Fixed pairs data model" --body "$(cat <<'EOF'
## Summary
Add `fixedPairs: [PlayerId, PlayerId][]` to app state and persist via localStorage. Pass fixed pairs through the Web Worker.

## Acceptance criteria
- [ ] `State` in `useShuffler.tsx` includes `fixedPairs: Team[]` (or equivalent)
- [ ] `newGame` accepts optional fixed pairs; defaults to `[]`
- [ ] State serializes/deserializes fixed pairs in localStorage
- [ ] `generateRound` / worker receives fixed pairs as additional argument
- [ ] Migrating old localStorage without fixedPairs defaults to `[]`

## Files likely touched
- src/useShuffler.tsx
- src/matching/worker.ts

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#1
EOF
)"

gh issue create --repo "$REPO" --title "Fixed pairs algorithm — always team together" --body "$(cat <<'EOF'
## Summary
Constrain round generation so fixed-pair players are always on the same team. Only unpaired players enter PairMaker partner matching.

## Acceptance criteria
- [ ] `getNextRound` in heuristics.ts pre-forms teams from fixedPairs before PairMaker
- [ ] Fixed pairs are never split across teams
- [ ] PairMaker runs only on unpaired players
- [ ] Fixed pair players excluded from partner preference matrix (or scored as already optimal)
- [ ] Works with odd player counts and multiple fixed pairs

## Files likely touched
- src/matching/heuristics.ts
- src/matching/worker.ts

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#2
EOF
)"

gh issue create --repo "$REPO" --title "Fixed pairs UI — new game page" --body "$(cat <<'EOF'
## Summary
On `/new`, let users link two players as a fixed pair before starting a game.

## Acceptance criteria
- [ ] UI to select two players and mark them as a pair (toggle/link control)
- [ ] Visual indicator showing who is paired with whom
- [ ] A player can only be in one fixed pair
- [ ] Pairs passed to `newGame()` on "Let's play!"
- [ ] Pairs can be removed before game starts

## Files likely touched
- pages/new.tsx
- src/PlayerBadge.tsx (optional link icon)

## Test plan
- [ ] yarn test:ci
- [ ] yarn build
- [ ] Manual: create game with 6 players and 1 fixed pair

## Dependencies
#2
EOF
)"

gh issue create --repo "$REPO" --title "Fixed pairs UI — in-game management" --body "$(cat <<'EOF'
## Summary
Allow adding/removing fixed pairs during an active game via PlayersModal.

## Acceptance criteria
- [ ] PlayersModal shows pair link controls consistent with /new page
- [ ] Adding/removing a pair triggers round regeneration (redo current round)
- [ ] Cannot pair a player with themselves
- [ ] Removing a player also removes their pair association

## Files likely touched
- src/PlayersModal.tsx
- src/useShuffler.tsx (editPlayers)

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#2
EOF
)"

gh issue create --repo "$REPO" --title "Enhanced diversity scoring" --body "$(cat <<'EOF'
## Summary
Strengthen partner/opponent diversity by tracking explicit pair-pair counts and integrating variance-based fairness.

## Acceptance criteria
- [ ] Add `partnerPairCounts` tracking (key: sorted player id pair) in heuristics
- [ ] Add squared penalty for repeated partner pairs in team scoring (similar to `repeatedGameCount²`)
- [ ] Wire `getVariance()` from variance.tsx into `getNextBestRound` scoring
- [ ] Existing heuristics tests still pass

## Files likely touched
- src/matching/heuristics.ts
- src/matching/variance.tsx

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#1
EOF
)"

gh issue create --repo "$REPO" --title "Back-to-back matchup prevention" --body "$(cat <<'EOF'
## Summary
Penalize scheduling the same two players as partners OR opponents in consecutive rounds.

## Acceptance criteria
- [ ] `getPartnerScore` adds large penalty if players were partners in the immediately previous round
- [ ] `getOpponentScore` adds large penalty if players were opponents in the immediately previous round
- [ ] Penalty is configurable constant at top of heuristics.ts
- [ ] Does not break existing lookahead (`getNextBestRound`)

## Files likely touched
- src/matching/heuristics.ts

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#1
EOF
)"

gh issue create --repo "$REPO" --title "Fixed pair sit-out logic" --body "$(cat <<'EOF'
## Summary
When sit-outs are required, fixed pairs sit out as a unit (both or neither).

## Acceptance criteria
- [ ] `getSitOuts` treats fixed pairs as atomic when selecting sit-outs
- [ ] If one member of a pair must sit out, both sit out
- [ ] Volunteer sit-out of one pair member pulls the partner too
- [ ] Capacity math accounts for pairs (don't leave orphaned single from a pair playing)

## Files likely touched
- src/matching/heuristics.ts
- src/SitoutsModal.tsx (if volunteer behavior needs update)

## Test plan
- [ ] yarn test:ci
- [ ] yarn build

## Dependencies
#5
EOF
)"

gh issue create --repo "$REPO" --title "Tests — fixed pairs" --body "$(cat <<'EOF'
## Summary
Unit tests for fixed pair behavior in round generation and sit-outs.

## Acceptance criteria
- [ ] Test: fixed pair always on same team across 10 generated rounds
- [ ] Test: two fixed pairs + unpaired players produces valid matches
- [ ] Test: fixed pair sits out together when sit-outs required
- [ ] Test: adding fixed pair mid-game keeps them together on regenerate

## Files likely touched
- test/heuristics.spec.tsx

## Test plan
- [ ] yarn test:ci

## Dependencies
#5, #8
EOF
)"

gh issue create --repo "$REPO" --title "Tests — diversity enhancements" --body "$(cat <<'EOF'
## Summary
Unit tests for back-to-back prevention and enhanced diversity scoring.

## Acceptance criteria
- [ ] Test: no consecutive-round partner repeats for 8 players over 20 rounds (unless unavoidable)
- [ ] Test: no consecutive-round opponent repeats where avoidable
- [ ] Test: partner pair count variance decreases vs baseline over many rounds

## Files likely touched
- test/heuristics.spec.tsx

## Test plan
- [ ] yarn test:ci

## Dependencies
#6, #7
EOF
)"

gh issue create --repo "$REPO" --title "Pair visualization polish" --body "$(cat <<'EOF'
## Summary
Visual polish: show linked-pair indicators on badges throughout the app.

## Acceptance criteria
- [ ] PlayerBadge shows link/chain icon or connector when player is in a fixed pair
- [ ] TeamBadges on rounds page visually groups fixed pair teammates
- [ ] Consistent styling with NextUI theme
- [ ] Accessible (aria-label for pair relationship)

## Files likely touched
- src/PlayerBadge.tsx
- src/TeamBadges.tsx
- src/BadgeGroup.tsx

## Test plan
- [ ] yarn build
- [ ] Manual visual check on /new and /rounds

## Dependencies
#3, #4
EOF
)"

gh issue create --repo "$REPO" --title "CI/CD GitHub Actions" --body "$(cat <<'EOF'
## Summary
Add GitHub Actions workflow for lint, test, and build on every PR.

## Acceptance criteria
- [ ] `.github/workflows/ci.yml` runs on push to main and on pull_request
- [ ] Steps: checkout, setup Node 18, yarn install, yarn test:ci, yarn lint, yarn build
- [ ] Uses yarn 3 via corepack or checked-in .yarn/releases
- [ ] Workflow passes on main

## Files likely touched
- .github/workflows/ci.yml

## Test plan
- [ ] Push branch and verify Actions green

## Dependencies
#1
EOF
)"

gh issue create --repo "$REPO" --title "Site comparison validation" --body "$(cat <<'EOF'
## Summary
Validate enhanced clone against jumbleddoubles.com and document parity + new features.

## Acceptance criteria
- [ ] docs/VALIDATION.md checklist comparing original vs enhanced site
- [ ] All upstream flows verified: landing, new game, rounds, edit players/courts/sit-outs, resume
- [ ] New flows verified: fixed pairs on new + in-game, diversity (no back-to-back in sample session)
- [ ] Screenshots or notes for any intentional UI differences

## Files likely touched
- docs/VALIDATION.md

## Test plan
- [ ] Full manual walkthrough
- [ ] yarn test:ci && yarn build

## Dependencies
All feature issues merged
EOF
)"

echo "Done creating issues"
