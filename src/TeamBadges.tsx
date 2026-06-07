import clsx from "clsx";
import { BadgeGroup } from "./BadgeGroup";
import { PairLinkIcon, PlayerBadge } from "./PlayerBadge";
import {
  areFixedPartners,
  getPlayerIdByName,
  useFixedPairs,
} from "./fixedPairs";
import { useShufflerState } from "./useShuffler";

export default function TeamBadges({
  team,
  isHome,
}: {
  team: string[];
  isHome?: boolean;
}) {
  const [player1, player2] = team;
  const fixedPairs = useFixedPairs();
  const { playersById } = useShufflerState();
  const color = isHome ? "primary" : "secondary";

  const player1Id = getPlayerIdByName(player1, playersById);
  const player2Id = getPlayerIdByName(player2, playersById);
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
        aria-label={`Fixed pair: ${player1} and ${player2}`}
      >
        <PlayerBadge color={color} playerId={player1Id}>
          {player1}
        </PlayerBadge>
        <span className="opacity-70" aria-hidden>
          <PairLinkIcon />
        </span>
        <PlayerBadge color={color} playerId={player2Id}>
          {player2}
        </PlayerBadge>
      </div>
    );
  }

  return (
    <BadgeGroup>
      <PlayerBadge color={color} playerId={player1Id}>
        {player1}
      </PlayerBadge>
      <PlayerBadge color={color} playerId={player2Id}>
        {player2}
      </PlayerBadge>
    </BadgeGroup>
  );
}
