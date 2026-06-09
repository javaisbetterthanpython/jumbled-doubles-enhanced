import React from "react";
import clsx from "clsx";
import { PlayerId } from "./matching/heuristics";
import { getPartnerName, useFixedPairs } from "./fixedPairs";
import { isSwingPlayer, useGroups } from "./groups";
import { useShufflerState } from "./useShuffler";

export function PairLinkIcon({
  partnerName,
  className,
  color = "currentColor",
  size = 16,
}: {
  partnerName?: string;
  className?: string;
  color?: string;
  size?: number;
}) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  if (!partnerName) return icon;

  return (
    <span
      className={clsx("inline-flex items-center", className)}
      aria-label={`Fixed pair with ${partnerName}`}
      title={`Fixed pair with ${partnerName}`}
    >
      {icon}
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
  const groups = useGroups();
  const partnerName =
    playerId && fixedPairs.length
      ? getPartnerName(playerId, fixedPairs, state.playersById)
      : undefined;
  const swing =
    playerId && groups.enabled && isSwingPlayer(playerId, groups);

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
      {swing ? (
        <span title="Swing player (multiple groups)">⚠️</span>
      ) : null}
      {partnerName ? (
        <PairLinkIcon partnerName={partnerName} className="opacity-80" />
      ) : null}
      {children}
    </p>
  );
}
