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
