# Jumbled Doubles Enhanced — Master Plan

Clone of [jumbleddoubles.com](https://jumbleddoubles.com/) (source: [panathea/pickleball-shuffler](https://github.com/panathea/pickleball-shuffler)) with two major enhancements:

1. **Fixed pairs** — Mark two players as a team that always plays together for the session.
2. **Stronger diversity scheduling** — Minimize repeated partner/opponent pairings and prevent back-to-back matchups with the same people.

## Architecture (unchanged from upstream)

| Layer | Stack |
|-------|-------|
| App | Next.js 13 (Pages Router), React 18, TypeScript |
| UI | NextUI, Tailwind, Framer Motion |
| State | `useShuffler` context + `localStorage` |
| Matching | Web Worker → `heuristics.ts` + `PairMaker` |

## Feature Design

### Fixed Pairs

- **Model**: `fixedPairs: [PlayerId, PlayerId][]` in app state, persisted to `localStorage`.
- **UI**: Pair picker on `/new` and pair management in `PlayersModal` on `/rounds`.
- **Algorithm**: Pre-form fixed teams before `PairMaker`; only unpaired players enter partner matching.
- **Sit-outs**: Fixed pairs sit out together when capacity requires it (atomic unit).
- **Visual**: Linked-pair indicator on `PlayerBadge` / `TeamBadges`.

### Diversity Enhancements

Upstream already has partner/opponent scoring and 3-round lookahead. We strengthen:

- **Back-to-back penalty**: Heavy score penalty if two players were partners or opponents in the previous round.
- **Explicit pair-pair counts**: Track `partnerPairCounts` and `opponentPairCounts` with squared penalties (like full-match dedup).
- **Variance fairness**: Wire existing `getVariance()` into round selection to balance distribution.
- **Tunable search**: Increase `ROUND_ATTEMPTS` / `GENERATIONS` where performance allows.

## Issue Dependency Graph

```
#1 Bootstrap ──┬── #2 Data model ──┬── #5 Algorithm ── #8 Sit-out logic
               │                   ├── #3 New-game UI
               │                   └── #4 In-game UI
               ├── #6 Diversity scoring
               ├── #7 Back-to-back prevention
               └── #12 CI/CD

#5 + #6 + #7 + #8 ── #9 Fixed-pair tests
                  └── #10 Diversity tests

#3 + #4 + #11 ── #13 Visual polish
All ── #14 Site comparison validation
```

## Milestones

| Milestone | Issues | Done when |
|-----------|--------|-----------|
| M0 Foundation | #1, #12 | Repo builds, tests pass, CI green |
| M1 Fixed pairs | #2–#5, #8, #9 | Pairs persist, always teamed, tested |
| M2 Diversity | #6, #7, #10 | Back-to-back rare, distribution fair |
| M3 Polish | #3, #4, #11, #13 | UI matches original + pair features |
| M4 Ship | #14 | Side-by-side validation vs jumbleddoubles.com |

## Success Criteria

- [ ] All upstream flows work: new game, rounds, edit players/courts/sit-outs, resume
- [ ] Fixed pairs always on same team; never split
- [ ] No two players partner or oppose each other in consecutive rounds (unless mathematically unavoidable)
- [ ] `yarn test:ci` and `yarn build` pass
- [ ] Visual parity with jumbleddoubles.com for core flows
