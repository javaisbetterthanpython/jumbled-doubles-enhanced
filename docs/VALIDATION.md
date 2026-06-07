# Site comparison validation

Manual checklist for comparing **Jumbled Doubles Enhanced** (this repo) against the upstream site [jumbleddoubles.com](https://jumbleddoubles.com/) (source: [panathea/pickleball-shuffler](https://github.com/panathea/pickleball-shuffler)).

Use this document before release to confirm upstream parity and to verify fork-only features (fixed pairs, stronger diversity scheduling).

## References

| | URL / path | Notes |
|---|------------|-------|
| **Upstream (baseline)** | https://jumbleddoubles.com/ | Production reference for layout, copy, and core flows |
| **Enhanced clone (local)** | `yarn dev` → http://localhost:3000 | This fork |
| **Architecture** | [docs/PLAN.md](./PLAN.md) | Feature design and issue map |
| **Automated tests** | `yarn test:ci` | Algorithm + diversity + fixed-pair coverage in `test/heuristics.spec.tsx` |

## What was implemented

### Unchanged from upstream (parity target)

- **Stack**: Next.js 13 (Pages Router), React 18, TypeScript, NextUI, Tailwind, Framer Motion
- **State**: `useShuffler` context with `localStorage` persistence (`src/useShuffler.tsx`)
- **Matching**: Web Worker (`src/matching/worker.ts`) → `heuristics.ts` + `PairMaker` (`ranked-matches.tsx`)
- **Routes**: `/` (landing), `/new` (setup), `/rounds` (play)
- **Core flows**: new game, round generation, edit players/courts/sit-outs, resume in-progress session, round pagination

### Enhanced (fork-only)

| Feature | Implementation | Verified by |
|---------|----------------|-------------|
| **Fixed pairs data model** | `fixedPairs: Team[]` in app state, persisted to `localStorage` | `src/fixedPairs.ts`, `src/useShuffler.tsx` |
| **Fixed pairs — new game UI** | Link/unlink players on `/new` before starting | `pages/new.tsx` |
| **Fixed pairs — in-game UI** | Pair picker in `PlayersModal` on `/rounds` | `src/PlayersModal.tsx`, `src/PlayerPairSelect.tsx` |
| **Fixed pairs — algorithm** | Pre-formed teams before `PairMaker`; unpaired players enter partner matching | `src/matching/heuristics.ts` (`getActiveFixedTeams`, `buildSitOutUnits`) |
| **Fixed pairs — sit-outs** | Fixed pair is an atomic sit-out unit; volunteer pulls partner | `heuristics.ts`, `test/heuristics.spec.tsx` |
| **Fixed pairs — visuals** | Dashed border + link icon on court teams; partner label on badges | `src/TeamBadges.tsx`, `src/PlayerBadge.tsx` |
| **Back-to-back penalty** | `BACK_TO_BACK_MATCHUP_PENALTY` (5000) for consecutive partner/opponent repeats | `src/matching/heuristics.ts` |
| **Partner-pair counts** | Squared penalties via `partnerPairCounts` / `opponentPairCounts` | `src/matching/heuristics.ts` |
| **Variance fairness** | `getVariance()` wired into `getNextBestRound` round selection | `src/matching/variance.tsx` |
| **Tunable search** | `GENERATIONS = 4`, `ROUND_ATTEMPTS = 30`, `ROUND_LOOKAHEAD = 3` | `src/matching/heuristics.ts` |
| **CI** | `yarn test:ci`, `yarn lint`, `yarn build` on push/PR | `.github/workflows/ci.yml` |

---

## Validation checklist

Mark each item after a side-by-side or local walkthrough. **Upstream** = jumbleddoubles.com; **Enhanced** = this repo at `localhost:3000`.

### A. Landing page (`/`)

| # | Check | Upstream | Enhanced | Notes |
|---|-------|----------|----------|-------|
| A1 | Gradient hero headline (“Jumble your social play”) | ☐ | ☐ | |
| A2 | “Why jumble?” explanatory copy | ☐ | ☐ | |
| A3 | “Start shufflin'” CTA → `/new` | ☐ | ☐ | |
| A4 | Compatible sports list | ☐ | ☐ | |
| A5 | Beta / feedback section with email link | ☐ | ☐ | |
| A6 | Navbar: curved “Jumbled Doubles” logo + Beta badge | ☐ | ☐ | CircleType on `#jumbled` (`src/Layout.tsx`) |
| A7 | Navbar “New game” button (home only) | ☐ | ☐ | |
| A8 | **Resume card** when `localStorage` has an active game | ☐ | ☐ | `src/ResumeActiveGame.tsx` — shows round number, links to `/rounds` |

### B. New game (`/new`)

| # | Check | Upstream | Enhanced | Notes |
|---|-------|----------|----------|-------|
| B1 | Add players via textarea (comma/newline) + add button | ☐ | ☐ | |
| B2 | Inline edit / remove player names | ☐ | ☐ | |
| B3 | “Reset players” confirmation modal | ☐ | ☐ | `src/ResetPlayersModal.tsx` |
| B4 | Validation: minimum 4 players | ☐ | ☐ | |
| B5 | Court count input with “enough players for N courts” hint | ☐ | ☐ | |
| B6 | “Customize court names” toggle | ☐ | ☐ | |
| B7 | Quick-set court names (1,2,3… / evens / odds) | ☐ | ☐ | |
| B8 | Duplicate / empty court name validation | ☐ | ☐ | |
| B9 | “Let's play!” starts game → `/rounds` | ☐ | ☐ | |
| B10 | Pre-fills players/courts from last session | ☐ | ☐ | `localStorage` via `useShuffler` |
| B11 | **Fixed pair link** on each unpaired player row | N/A | ☐ | Fork-only: chain icon, tap-two-to-pair |
| B12 | **Paired players** show partner name + unlink | N/A | ☐ | Secondary highlight + `↔ Partner` label |
| B13 | **Linking hint** while first player selected | N/A | ☐ | “Tap another player to pair…” |
| B14 | Fixed pairs survive player rename before start | N/A | ☐ | |
| B15 | Reset players clears fixed pairs | N/A | ☐ | |

### C. Rounds view (`/rounds`)

| # | Check | Upstream | Enhanced | Notes |
|---|-------|----------|----------|-------|
| C1 | Round header with round number | ☐ | ☐ | |
| C2 | “Sitting out” card with player badges | ☐ | ☐ | |
| C3 | Volunteer label on sit-out badges | ☐ | ☐ | `(volunteer)` suffix |
| C4 | Edit sit-outs modal → regenerate current round | ☐ | ☐ | `src/SitoutsModal.tsx` |
| C5 | Court cards: team A vs team B layout | ☐ | ☐ | `src/TeamBadges.tsx` |
| C6 | Custom court names displayed | ☐ | ☐ | |
| C7 | Round pagination (browse history) | ☐ | ☐ | |
| C8 | “Jump to latest round” on older pages | ☐ | ☐ | |
| C9 | “Start round N!” generates next round | ☐ | ☐ | Web Worker async generation |
| C10 | Players button (count) → edit modal | ☐ | ☐ | Latest round only |
| C11 | Courts button (count) → edit modal | ☐ | ☐ | `src/CourtsModal.tsx` |
| C12 | **Fixed pair teams** show dashed border + link icon on court | N/A | ☐ | `TeamBadges` `aria-label="Fixed pair: …"` |
| C13 | **Edit players modal** includes pair dropdown per player | N/A | ☐ | `PlayerPairSelect` — “No fixed partner” option |
| C14 | Changing pairs forces round regenerate | N/A | ☐ | `pairsChanged ? true : regenerate` in `PlayersModal` |

### D. Persistence and resume

| # | Check | Upstream | Enhanced | Notes |
|---|-------|----------|----------|-------|
| D1 | Refresh `/rounds` — game state restored | ☐ | ☐ | |
| D2 | Close tab, reopen `/` — resume card appears | ☐ | ☐ | |
| D3 | Resume lands on correct round count | ☐ | ☐ | |
| D4 | **Fixed pairs** restored after refresh | N/A | ☐ | `fixedPairs` in cached state |
| D5 | Start new game clears old session appropriately | ☐ | ☐ | |

### E. Edit flows (mid-session)

| # | Check | Upstream | Enhanced | Notes |
|---|-------|----------|----------|-------|
| E1 | Add player in players modal | ☐ | ☐ | |
| E2 | Remove (soft-delete) player | ☐ | ☐ | |
| E3 | Regenerate vs keep history option after player edit | ☐ | ☐ | |
| E4 | Increase/decrease courts | ☐ | ☐ | |
| E5 | Volunteer sit-out reshuffles current round only | ☐ | ☐ | |
| E6 | **Volunteer fixed-pair member** — partner also sits out | N/A | ☐ | See automated test “volunteer sit-out pulls fixed pair partner” |
| E7 | **Add fixed pair mid-game** — pair stays together after regenerate | N/A | ☐ | |

---

## Enhanced feature validation (sample sessions)

Run these on the **enhanced** site after upstream checks pass.

### F. Fixed pairs — new game session

**Setup:** 8 players, 2 courts. Pair Alice+Bob and Carol+Dave.

| # | Check | Pass |
|---|-------|------|
| F1 | Alice and Bob on the same team every round (10 rounds) | ☐ |
| F2 | Carol and Dave on the same team every round | ☐ |
| F3 | Unpaired players still rotate partners/opponents | ☐ |
| F4 | When 4 must sit out, each fixed pair sits out together (both in or both out) | ☐ |
| F5 | Court display shows dashed fixed-pair styling for Alice+Bob and Carol+Dave | ☐ |

### G. Fixed pairs — in-game

**Setup:** Start 6-player / 1-court game with no pairs. Play 3 rounds.

| # | Check | Pass |
|---|-------|------|
| G1 | Open players modal, pair two players, save with regenerate | ☐ |
| G2 | Regenerated round shows pair on same team | ☐ |
| G3 | Unlink pair in modal — subsequent regenerate allows separate teams | ☐ |
| G4 | Removing one member of a pair drops the pair from `fixedPairs` | ☐ |

### H. Diversity — no back-to-back (sample session)

**Setup:** 8 players, 2 courts. Use “Start round” for **20 rounds** (enhanced uses `getNextBestRound`).

| # | Check | Pass |
|---|-------|------|
| H1 | Scan rounds: note any **consecutive partner** repeats (same two players partnered in round N and N+1) | ☐ |
| H2 | Scan rounds: note any **consecutive opponent** repeats | ☐ |
| H3 | Repeats in H1/H2 only occur when unavoidable (small player count / court constraint) | ☐ |
| H4 | Partner distribution feels even — no one stuck with same partner many rounds in a row | ☐ |
| H5 | Sit-out rotation roughly fair across players | ☐ |

**Automated equivalent:** `test/heuristics.spec.tsx` — “diversity enhancements” and “fixed pairs” suites cover H1–H3 and F1–F4 at the algorithm layer.

---

## Intentional UI differences

Document any visual or copy differences that are **by design** (not bugs).

| Area | Upstream | Enhanced | Rationale |
|------|----------|----------|-----------|
| Fixed pair controls on `/new` | Not present | Link icon + partner label per player | New feature (#4) |
| Fixed pair controls in players modal | Not present | Dropdown pair selector per player | New feature (#5) |
| Court team display | Separate badges | Dashed border + link icon for fixed pairs | Visual polish (#11) |
| Sit-out / player badges | Plain badges | Partner name tooltip via `PairLinkIcon` when paired | Visual polish (#11) |
| Matching quality | Baseline heuristics | Stronger penalties + variance + more search attempts | Not visible in UI; different round outcomes for same seed |
| README “New features” | N/A | Lists fixed pairs + diversity | Docs only; upstream landing unchanged |

*Add screenshots or notes below when differences need visual confirmation:*

```
[Screenshot: upstream /new vs enhanced /new with fixed pairs]
[Screenshot: enhanced court card with fixed-pair dashed border]
```

---

## Automated verification (required before merge)

```bash
yarn install
yarn test:ci    # Jest: heuristics, variance, fixed pairs, diversity
yarn lint       # ESLint
yarn build      # Next.js production build
```

| Suite | What it validates |
|-------|-------------------|
| `test/variance.spec.tsx` | `getVariance()` ordering |
| `test/heuristics.spec.tsx` — core | Round generation, sit-outs, preferences |
| `test/heuristics.spec.tsx` — diversity | No avoidable back-to-back partner/opponent repeats; lower partner variance vs baseline |
| `test/heuristics.spec.tsx` — fixed pairs | Same team, joint sit-out, mid-game pair, volunteer pulls partner |

---

## Sign-off

| Role | Name | Date | Upstream parity (A–E) | Enhanced features (F–H) |
|------|------|------|------------------------|-------------------------|
| Tester | | | ☐ | ☐ |

**Release criteria (from [PLAN.md](./PLAN.md)):**

- [ ] All upstream flows work: new game, rounds, edit players/courts/sit-outs, resume
- [ ] Fixed pairs always on same team; never split
- [ ] No consecutive partner/opponent repeats unless mathematically unavoidable
- [ ] `yarn test:ci` and `yarn build` pass
- [ ] Visual parity with jumbleddoubles.com for core flows (enhanced adds pair UI only where noted)
