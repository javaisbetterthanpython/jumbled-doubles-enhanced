import { Select, SelectItem } from "@nextui-org/react";
import { PlayerId } from "./matching/heuristics";
import { getPartnerId } from "./fixedPairs";

type PlayerOption = { id: PlayerId; name: string };

export function PlayerPairSelect({
  playerId,
  playerName,
  players,
  fixedPairs,
  onPairChange,
  disabled,
}: {
  playerId: PlayerId;
  playerName: string;
  players: PlayerOption[];
  fixedPairs: [PlayerId, PlayerId][];
  onPairChange: (playerId: PlayerId, partnerId: PlayerId | null) => void;
  disabled?: boolean;
}) {
  const partnerId = getPartnerId(playerId, fixedPairs);
  const partnerOptions = players.filter((p) => p.id !== playerId);

  return (
    <Select
      aria-label={`Fixed pair for ${playerName}`}
      size="sm"
      variant="flat"
      className="max-w-[11rem]"
      selectedKeys={partnerId ? [partnerId] : ["__none__"]}
      isDisabled={disabled}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as string | undefined;
        onPairChange(
          playerId,
          !selected || selected === "__none__" ? null : selected
        );
      }}
    >
      {[
        <SelectItem key="__none__" value="__none__">
          No fixed pair
        </SelectItem>,
        ...partnerOptions.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        )),
      ]}
    </Select>
  );
}
