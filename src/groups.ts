import { v4 as uuidv4 } from "uuid";
import { PlayerId, Team } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

export type GroupId = string;

export type SkillGroup = {
  id: GroupId;
  name: string;
};

export type GroupPlayMode = "separate" | "combined";

export type GroupsState = {
  enabled: boolean;
  /** Priority order: index 0 = highest skill level */
  groups: SkillGroup[];
  playerGroups: Record<PlayerId, GroupId[]>;
  playMode: GroupPlayMode;
};

/** Default group names; Standard is lower priority (listed first). */
export const DEFAULT_GROUP_NAMES = ["Standard", "Advanced"] as const;

export function defaultGroupsState(): GroupsState {
  return {
    enabled: false,
    groups: [],
    playerGroups: {},
    playMode: "separate",
  };
}

export function createDefaultGroups(): SkillGroup[] {
  return DEFAULT_GROUP_NAMES.map((name) => ({ id: uuidv4(), name }));
}

export function createEnabledGroupsState(playerIds: PlayerId[]): GroupsState {
  const groups = createDefaultGroups();
  const standardId =
    groups.find((g) => g.name === "Standard")?.id ?? groups[0].id;
  const playerGroups: Record<PlayerId, GroupId[]> = {};
  for (const id of playerIds) {
    playerGroups[id] = [standardId];
  }
  return {
    enabled: true,
    groups,
    playerGroups,
    playMode: "separate",
  };
}

export function normalizeGroupsState(raw: unknown): GroupsState {
  if (!raw || typeof raw !== "object") return defaultGroupsState();
  const value = raw as Partial<GroupsState>;
  const enabled = value.enabled === true;
  const groups = Array.isArray(value.groups)
    ? value.groups.filter(
        (g): g is SkillGroup =>
          !!g &&
          typeof g === "object" &&
          typeof g.id === "string" &&
          typeof g.name === "string"
      )
    : [];
  const playerGroups =
    value.playerGroups && typeof value.playerGroups === "object"
      ? (value.playerGroups as Record<PlayerId, GroupId[]>)
      : {};
  const playMode = value.playMode === "combined" ? "combined" : "separate";
  return { enabled, groups, playerGroups, playMode };
}

export function groupsEqual(a: GroupsState, b: GroupsState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type StateWithGroups = {
  groups?: GroupsState;
};

export function useGroups(): GroupsState {
  const state = useShufflerState() as StateWithGroups;
  return normalizeGroupsState(state.groups);
}

export function getGroupPriorityIndex(
  groupId: GroupId,
  groups: SkillGroup[]
): number {
  const index = groups.findIndex((g) => g.id === groupId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getPlayerGroupIds(
  playerId: PlayerId,
  groupsState: GroupsState
): GroupId[] {
  return groupsState.playerGroups[playerId] ?? [];
}

export function isSwingPlayer(
  playerId: PlayerId,
  groupsState: GroupsState
): boolean {
  return (
    groupsState.enabled && getPlayerGroupIds(playerId, groupsState).length > 1
  );
}

export function getHighestPriorityGroupId(
  playerIds: PlayerId[],
  groupsState: GroupsState
): GroupId | undefined {
  let bestId: GroupId | undefined;
  let bestIndex = Number.MAX_SAFE_INTEGER;

  for (const playerId of playerIds) {
    for (const groupId of getPlayerGroupIds(playerId, groupsState)) {
      const index = getGroupPriorityIndex(groupId, groupsState.groups);
      if (index < bestIndex) {
        bestIndex = index;
        bestId = groupId;
      }
    }
  }

  return bestId;
}

export function playersShareGroup(
  playerA: PlayerId,
  playerB: PlayerId,
  groupsState: GroupsState
): boolean {
  if (!groupsState.enabled) return true;
  const a = new Set(getPlayerGroupIds(playerA, groupsState));
  return getPlayerGroupIds(playerB, groupsState).some((id) => a.has(id));
}

export function getGroupName(
  groupId: GroupId,
  groups: SkillGroup[]
): string | undefined {
  return groups.find((g) => g.id === groupId)?.name;
}

export function reorderGroups(
  groups: SkillGroup[],
  fromIndex: number,
  toIndex: number
): SkillGroup[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= groups.length ||
    toIndex >= groups.length ||
    fromIndex === toIndex
  ) {
    return groups;
  }
  const next = [...groups];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function addGroup(groups: SkillGroup[], name: string): SkillGroup[] {
  const trimmed = name.trim();
  if (!trimmed) return groups;
  return [...groups, { id: uuidv4(), name: trimmed }];
}

export function renameGroup(
  groups: SkillGroup[],
  groupId: GroupId,
  name: string
): SkillGroup[] {
  const trimmed = name.trim();
  if (!trimmed) return groups;
  return groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g));
}

export function removeGroup(
  groupsState: GroupsState,
  groupId: GroupId,
  activePlayerIds: PlayerId[]
): GroupsState {
  const remainingGroups = groupsState.groups.filter((g) => g.id !== groupId);
  if (!remainingGroups.length) return groupsState;

  const fallbackId = remainingGroups[0].id;
  const playerGroups: Record<PlayerId, GroupId[]> = {};

  for (const playerId of activePlayerIds) {
    const current = getPlayerGroupIds(playerId, groupsState).filter(
      (id) => id !== groupId
    );
    playerGroups[playerId] = current.length ? current : [fallbackId];
  }

  return {
    ...groupsState,
    groups: remainingGroups,
    playerGroups,
  };
}

export function togglePlayerGroup(
  groupsState: GroupsState,
  playerId: PlayerId,
  groupId: GroupId
): GroupsState {
  const current = getPlayerGroupIds(playerId, groupsState);
  const next = current.includes(groupId)
    ? current.filter((id) => id !== groupId)
    : [...current, groupId];

  return {
    ...groupsState,
    playerGroups: {
      ...groupsState.playerGroups,
      [playerId]: next,
    },
  };
}

export function setPlayerGroups(
  groupsState: GroupsState,
  playerId: PlayerId,
  groupIds: GroupId[]
): GroupsState {
  return {
    ...groupsState,
    playerGroups: {
      ...groupsState.playerGroups,
      [playerId]: groupIds,
    },
  };
}

export function ensurePlayerHasGroup(
  groupsState: GroupsState,
  playerId: PlayerId
): GroupsState {
  const current = getPlayerGroupIds(playerId, groupsState);
  if (current.length || !groupsState.groups.length) return groupsState;
  const standardId =
    groupsState.groups.find((g) => g.name === "Standard")?.id ??
    groupsState.groups[0].id;
  return setPlayerGroups(groupsState, playerId, [standardId]);
}

export function sanitizePlayerGroups(
  groupsState: GroupsState,
  activePlayerIds: PlayerId[]
): GroupsState {
  if (!groupsState.enabled) return groupsState;

  const validGroupIds = new Set(groupsState.groups.map((g) => g.id));
  const fallbackId =
    groupsState.groups.find((g) => g.name === "Standard")?.id ??
    groupsState.groups[0]?.id;
  const playerGroups: Record<PlayerId, GroupId[]> = {};

  for (const playerId of activePlayerIds) {
    const filtered = getPlayerGroupIds(playerId, groupsState).filter((id) =>
      validGroupIds.has(id)
    );
    playerGroups[playerId] =
      filtered.length > 0 ? filtered : fallbackId ? [fallbackId] : [];
  }

  return { ...groupsState, playerGroups };
}

export function allPlayersHaveGroup(
  groupsState: GroupsState,
  activePlayerIds: PlayerId[]
): boolean {
  if (!groupsState.enabled) return true;
  return activePlayerIds.every(
    (id) => getPlayerGroupIds(id, groupsState).length > 0
  );
}

export function ensurePairInHighestGroup(
  playerA: PlayerId,
  playerB: PlayerId,
  groupsState: GroupsState
): GroupsState {
  if (!groupsState.enabled) return groupsState;

  const highestGroupId = getHighestPriorityGroupId(
    [playerA, playerB],
    groupsState
  );
  if (!highestGroupId) return groupsState;

  let next = groupsState;
  for (const playerId of [playerA, playerB]) {
    const current = getPlayerGroupIds(playerId, next);
    if (!current.includes(highestGroupId)) {
      next = setPlayerGroups(next, playerId, [...current, highestGroupId]);
    }
  }
  return next;
}

export function levelFixedPairsForGroups(
  fixedPairs: Team[],
  groupsState: GroupsState
): GroupsState {
  if (!groupsState.enabled) return groupsState;

  return fixedPairs.reduce(
    (state, [a, b]) => ensurePairInHighestGroup(a, b, state),
    groupsState
  );
}

export function assignNewPlayersToStandard(
  groupsState: GroupsState,
  newPlayerIds: PlayerId[]
): GroupsState {
  if (!groupsState.enabled || !groupsState.groups.length) return groupsState;

  const standardId =
    groupsState.groups.find((g) => g.name === "Standard")?.id ??
    groupsState.groups[groupsState.groups.length - 1].id;
  const playerGroups = { ...groupsState.playerGroups };

  for (const id of newPlayerIds) {
    if (!playerGroups[id]?.length) {
      playerGroups[id] = [standardId];
    }
  }

  return { ...groupsState, playerGroups };
}
