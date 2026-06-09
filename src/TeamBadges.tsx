import clsx from "clsx";
import React from "react";
import { BadgeGroup } from "./BadgeGroup";
import { PairLinkIcon, PlayerBadge } from "./PlayerBadge";
import { areFixedPartners, useFixedPairs } from "./fixedPairs";
import { PlayerId } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

export default function TeamBadges({
  teamIds,
  isHome,
  renderName,
}: {
  teamIds: PlayerId[];
  isHome?: boolean;
  renderName?: (id: PlayerId) => React.ReactNode;
}) {
  const [player1Id, player2Id] = teamIds;
  const fixedPairs = useFixedPairs();
  const { playersById } = useShufflerState();
  const color = isHome ? "primary" : "secondary";

  const displayName = (id: PlayerId) =>
    renderName ? renderName(id) : playersById[id]?.name ?? "";

  const isFixedPairTeam =
    player1Id &&
    player2Id &&
    fixedPairs.length > 0 &&
    areFixedPartners(player1Id, player2Id, fixedPairs);

  if (isFixedPairTeam) {
    return (
      <div
        className={clsx(
          "inline-flex items-center gap-1 rounded-xl border-2 border-dashed px-1 py-0.5",
          isHome ? "border-primary/60" : "border-secondary/60"
        )}
        aria-label={`Fixed pair: ${playersById[player1Id]?.name} and ${playersById[player2Id]?.name}`}
      >
        <PlayerBadge color={color} playerId={player1Id}>
          {displayName(player1Id)}
        </PlayerBadge>
        <span className="opacity-70" aria-hidden>
          <PairLinkIcon />
        </span>
        <PlayerBadge color={color} playerId={player2Id}>
          {displayName(player2Id)}
        </PlayerBadge>
      </div>
    );
  }

  return (
    <BadgeGroup>
      <PlayerBadge color={color} playerId={player1Id}>
        {displayName(player1Id)}
      </PlayerBadge>
      <PlayerBadge color={color} playerId={player2Id}>
        {displayName(player2Id)}
      </PlayerBadge>
    </BadgeGroup>
  );
}
