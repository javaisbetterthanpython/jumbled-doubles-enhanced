import { PlayerId, Team } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

type StateWithFixedPairs = {
  fixedPairs?: Team[];
  playersById?: Record<PlayerId, { name: string; id: PlayerId }>;
};

export function useFixedPairs(): Team[] {
  const state = useShufflerState() as StateWithFixedPairs;
  const fixedPairs = state.fixedPairs;
  return Array.isArray(fixedPairs) ? fixedPairs : [];
}

export function getFixedPairPartnerMap(
  fixedPairs: Team[]
): Map<PlayerId, PlayerId> {
  const partnerMap = new Map<PlayerId, PlayerId>();
  for (const [a, b] of fixedPairs) {
    partnerMap.set(a, b);
    partnerMap.set(b, a);
  }
  return partnerMap;
}

export function getPartnerId(
  playerId: PlayerId,
  fixedPairs: Team[]
): PlayerId | undefined {
  return getFixedPairPartnerMap(fixedPairs).get(playerId);
}

export function getPartnerName(
  playerId: PlayerId,
  fixedPairs: Team[],
  playersById: Record<PlayerId, { name: string }>
): string | undefined {
  const partnerId = getPartnerId(playerId, fixedPairs);
  return partnerId ? playersById[partnerId]?.name : undefined;
}

export function areFixedPartners(
  playerA: PlayerId,
  playerB: PlayerId,
  fixedPairs: Team[]
): boolean {
  return getPartnerId(playerA, fixedPairs) === playerB;
}

export function getPlayerIdByName(
  name: string,
  playersById: Record<PlayerId, { name: string; id: PlayerId }>
): PlayerId | undefined {
  return Object.values(playersById).find((player) => player.name === name)?.id;
}

export function sanitizeFixedPairs(
  fixedPairs: Team[],
  activePlayerIds: Iterable<PlayerId>
): Team[] {
  const active = new Set(activePlayerIds);
  const seen = new Set<string>();
  const result: Team[] = [];

  for (const [a, b] of fixedPairs) {
    if (a === b || !active.has(a) || !active.has(b)) continue;
    const key = [a, b].sort().join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push([a, b]);
  }

  return result;
}

export function setPlayerPair(
  playerId: PlayerId,
  partnerId: PlayerId | null,
  fixedPairs: Team[]
): Team[] {
  if (partnerId !== null && playerId === partnerId) return fixedPairs;

  const withoutPlayers = fixedPairs.filter(
    ([a, b]) =>
      a !== playerId && b !== playerId && a !== partnerId && b !== partnerId
  );

  if (partnerId === null) return withoutPlayers;

  return [...withoutPlayers, [playerId, partnerId]];
}

export function pairsEqual(a: Team[], b: Team[]): boolean {
  if (a.length !== b.length) return false;
  const normalize = (pairs: Team[]) =>
    pairs
      .map(([x, y]) => [x, y].sort().join(":"))
      .sort()
      .join("|");
  return normalize(a) === normalize(b);
}
