import React from "react";
import clsx from "clsx";
import { Link } from "react-iconly";
import { PlayerId } from "./matching/heuristics";
import { getPartnerName, useFixedPairs } from "./fixedPairs";
import { useShufflerState } from "./useShuffler";

function PairLinkIcon({
  partnerName,
  className,
}: {
  partnerName: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex items-center", className)}
      aria-label={`Fixed pair with ${partnerName}`}
      title={`Fixed pair with ${partnerName}`}
    >
      <Link set="light" size="small" aria-hidden />
    </span>
  );
}

export function PlayerBadge({
  color,
  children,
  playerId,
}: {
  children: React.ReactNode;
  color: "primary" | "secondary" | "default";
  playerId?: PlayerId;
}) {
  const fixedPairs = useFixedPairs();
  const state = useShufflerState();
  const partnerName =
    playerId && fixedPairs.length
      ? getPartnerName(playerId, fixedPairs, state.playersById)
      : undefined;

  return (
    <p
      className={clsx(
        "border-2 font-semibold text-lg sm:text-medium inline-flex items-center gap-1",
        `text-${color} border-${color} rounded-lg px-2 py-1`,
        {
          "bg-slate-100": color === "default",
          "border-slate-400": color === "default",
          "text-slate-800": color === "default",
        }
      )}
    >
      {partnerName ? (
        <PairLinkIcon partnerName={partnerName} className="opacity-80" />
      ) : null}
      {children}
    </p>
  );
}
