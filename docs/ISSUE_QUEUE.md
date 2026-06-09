# Issue Queue

Updated by the orchestrator. Status: `open` | `in-progress` | `in-review` | `done` | `blocked`

| Priority | Issue | Title | Status | Depends on | PR |
|----------|-------|-------|--------|------------|-----|
| 1 | [#30](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/30) | Richer session mix + instant next round | in-review | — | [#40](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/pull/40) |
| 2 | [#31](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/31) | Edit player names (in-game + setup) | done | — | [#37](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/pull/37) |
| 3 | [#32](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/32) | Recent matchup spacing — formal guarantee | open | #30 | — |
| 4 | [#33](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/33) | Skill groups — foundation (data model + UI) | open | — | — |
| 5 | [#34](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/34) | Skill groups — court-to-group mapping + rounds layout | open | #33 | — |
| 6 | [#35](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/35) | Skill groups — separate/combined round generation | open | #30, #33, #34 | — |
| 7 | [#36](https://github.com/javaisbetterthanpython/jumbled-doubles-enhanced/issues/36) | Sit-out modal — draft pre-gen + correct volunteer state | open | #30 | — |

## Parallel batches

- **Batch E** (now): #30, #31, #33 (in parallel)
- **Batch F** (after #30): #32, #36
- **Batch G** (after #33): #34
- **Batch H** (after #30 + #33 + #34): #35

## Upstream mapping

| Upstream (pickleball-shuffler) | Enhanced issue |
|-------------------------------|----------------|
| #4 Improve generation look-ahead | #30 |
| #16 Edit player names | #31 |
| #22 Reduce same person back-to-back | #32 |
| #25 Run multiple groups | #33, #34, #35 |
| #32 Volunteer sit-out modal | #36 |
