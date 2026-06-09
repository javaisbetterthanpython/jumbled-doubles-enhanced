import {
  allPlayersHaveGroup,
  createDefaultGroups,
  createEnabledGroupsState,
  ensurePairInHighestGroup,
  getHighestPriorityGroupId,
  isSwingPlayer,
  levelFixedPairsForGroups,
  reorderGroups,
  sanitizePlayerGroups,
} from "../src/groups";

describe("groups", () => {
  const playerA = "player-a";
  const playerB = "player-b";
  const playerC = "player-c";

  test("createEnabledGroupsState assigns all players to Standard", () => {
    const state = createEnabledGroupsState([playerA, playerB]);
    const standardId = state.groups.find((g) => g.name === "Standard")!.id;

    expect(state.enabled).toBe(true);
    expect(state.playMode).toBe("separate");
    expect(state.groups.map((g) => g.name)).toEqual(["Standard", "Advanced"]);
    expect(state.playerGroups[playerA]).toEqual([standardId]);
    expect(state.playerGroups[playerB]).toEqual([standardId]);
  });

  test("isSwingPlayer detects multiple group membership", () => {
    const state = createEnabledGroupsState([playerA]);
    const advancedId = state.groups.find((g) => g.name === "Advanced")!.id;
    const standardId = state.groups.find((g) => g.name === "Standard")!.id;

    expect(isSwingPlayer(playerA, state)).toBe(false);

    state.playerGroups[playerA] = [standardId, advancedId];
    expect(isSwingPlayer(playerA, state)).toBe(true);
  });

  test("reorderGroups moves priority", () => {
    const groups = createDefaultGroups();
    const reordered = reorderGroups(groups, 1, 0);
    expect(reordered[0].name).toBe("Advanced");
    expect(reordered[1].name).toBe("Standard");
  });

  test("getHighestPriorityGroupId picks top group", () => {
    const state = createEnabledGroupsState([playerA, playerB]);
    const advancedId = state.groups.find((g) => g.name === "Advanced")!.id;
    const standardId = state.groups.find((g) => g.name === "Standard")!.id;
    state.groups = reorderGroups(state.groups, 1, 0);

    state.playerGroups[playerA] = [standardId];
    state.playerGroups[playerB] = [advancedId];

    expect(getHighestPriorityGroupId([playerA, playerB], state)).toBe(
      advancedId
    );
  });

  test("levelFixedPairsForGroups adds higher-priority group to swing pair", () => {
    const state = createEnabledGroupsState([playerA, playerB]);
    const advancedId = state.groups.find((g) => g.name === "Advanced")!.id;
    const standardId = state.groups.find((g) => g.name === "Standard")!.id;
    state.groups = reorderGroups(state.groups, 1, 0);

    state.playerGroups[playerA] = [standardId];
    state.playerGroups[playerB] = [standardId, advancedId];

    const leveled = levelFixedPairsForGroups([[playerA, playerB]], state);

    expect(leveled.playerGroups[playerA]).toContain(advancedId);
    expect(leveled.playerGroups[playerB]).toContain(advancedId);
  });

  test("ensurePairInHighestGroup levels pair to shared top group", () => {
    const state = createEnabledGroupsState([playerA, playerB]);
    const advancedId = state.groups.find((g) => g.name === "Advanced")!.id;
    const standardId = state.groups.find((g) => g.name === "Standard")!.id;
    state.groups = reorderGroups(state.groups, 1, 0);

    state.playerGroups[playerA] = [standardId];
    state.playerGroups[playerB] = [advancedId];

    const next = ensurePairInHighestGroup(playerA, playerB, state);
    expect(next.playerGroups[playerA]).toContain(advancedId);
    expect(next.playerGroups[playerB]).toContain(advancedId);
  });

  test("sanitizePlayerGroups ensures every active player has a group", () => {
    const state = createEnabledGroupsState([playerA]);
    delete state.playerGroups[playerA];

    const sanitized = sanitizePlayerGroups(state, [playerA, playerC]);
    expect(allPlayersHaveGroup(sanitized, [playerA, playerC])).toBe(true);
    expect(sanitized.playerGroups[playerC].length).toBeGreaterThan(0);
  });
});
