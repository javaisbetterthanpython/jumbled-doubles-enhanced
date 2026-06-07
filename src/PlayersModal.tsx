import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
} from "@nextui-org/react";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { AddUser, Delete, Link } from "react-iconly";
import { Player, Team } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";
import clsx from "clsx";
import {
  getPartnerId,
  pairsEqual,
  sanitizeFixedPairs,
  setPlayerPair,
} from "./fixedPairs";
import { PlayerPairSelect } from "./PlayerPairSelect";

export function PlayersModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    newPlayers: Player[],
    fixedPairs: Team[],
    regenerate: boolean
  ) => void;
}) {
  const state = useShufflerState();
  const [newPlayer, setNewPlayer] = useState("");
  const newPlayerRef = useRef<HTMLInputElement>(null);
  const [players, setPlayers] = useState<
    Array<Player & { delete: boolean; new: boolean }>
  >([]);
  const [fixedPairs, setFixedPairs] = useState<Team[]>([]);

  const activePlayers = players.filter((x) => !x.delete);
  const activePlayerIds = activePlayers.map(({ id }) => id);

  const handleSubmit =
    (regenerate: boolean = false) =>
    () => {
      const newPlayers = activePlayers
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      if (newPlayers.length < 4) return;

      const sanitizedPairs = sanitizeFixedPairs(fixedPairs, activePlayerIds);
      const pairsChanged = !pairsEqual(sanitizedPairs, state.fixedPairs);
      onSubmit(newPlayers, sanitizedPairs, pairsChanged ? true : regenerate);
    };

  useEffect(() => {
    if (open) {
      const allPlayers = Object.values(state.playersById);

      setPlayers(
        allPlayers
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ name, id }) => ({
            id,
            name,
            delete: !state.players.includes(id),
            new: false,
          }))
      );
      setFixedPairs(state.fixedPairs);
    }
  }, [open, state.players, state.playersById, state.fixedPairs]);

  const handlePairChange = (playerId: string, partnerId: string | null) => {
    setFixedPairs((pairs) => setPlayerPair(playerId, partnerId, pairs));
  };

  const handleToggleDelete = (playerId: string) => {
    setPlayers((current) => {
      const updated = current.map((x) =>
        x.id === playerId ? { ...x, delete: !x.delete } : x
      );
      const remainingIds = updated.filter((x) => !x.delete).map((x) => x.id);
      setFixedPairs((pairs) => sanitizeFixedPairs(pairs, remainingIds));
      return updated;
    });
  };

  return (
    <Modal
      closeButton
      aria-labelledby="players-modal-title"
      isOpen={open}
      scrollBehavior="inside"
      onClose={() => {
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="players-modal-title">Edit players</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-lg">
            Add or remove players, or link fixed pairs. You can either{" "}
            <span className="font-bold">redo the current round</span> (because
            you haven't played yet) or{" "}
            <span className="font-bold">start a new round</span> with the
            updated roster. Changing fixed pairs always redoes the current
            round.
          </p>
          <form
            name="new-player"
            onSubmit={(e) => {
              e.preventDefault();
              const playerName = newPlayer.trim();
              if (!playerName) return;
              if (players.some((player) => player.name === playerName)) return;
              setPlayers((players) => [
                { name: playerName, id: uuidv4(), delete: false, new: true },
                ...players,
              ]);
              setNewPlayer("");
              newPlayerRef.current?.focus();
            }}
          >
            <div className="flex gap-2 items-end">
              <Input
                variant="bordered"
                label="Add player"
                labelPlacement="outside"
                placeholder="Enter player name"
                color="primary"
                className="flex-1"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                ref={newPlayerRef}
              />
              <Button
                color="primary"
                aria-label="Submit add player"
                isIconOnly
                type="submit"
              >
                <AddUser />
              </Button>
            </div>
          </form>
          {players.map((player) => {
            const partnerId = getPartnerId(player.id, fixedPairs);
            const partnerName = partnerId
              ? players.find((p) => p.id === partnerId)?.name
              : null;

            return (
              <div
                className="flex items-center border-b-1 pb-3 gap-2"
                key={player.id}
              >
                <span
                  className={clsx("text-large flex-1 min-w-0", {
                    "line-through": player.delete,
                    "text-neutral-400": player.delete,
                  })}
                >
                  {player.new ? "🆕 " : ""}
                  {player.delete ? "❌ " : ""}
                  {player.name}
                  {partnerName && !player.delete ? (
                    <span className="text-primary text-medium font-normal ml-2 inline-flex items-center gap-1">
                      <Link size="small" />
                      {partnerName}
                    </span>
                  ) : null}
                </span>
                {!player.delete ? (
                  <PlayerPairSelect
                    playerId={player.id}
                    playerName={player.name}
                    players={activePlayers.map(({ id, name }) => ({
                      id,
                      name,
                    }))}
                    fixedPairs={fixedPairs}
                    onPairChange={handlePairChange}
                  />
                ) : null}
                <Spacer x={0.5} />
                <Button
                  variant="flat"
                  size="sm"
                  color={player.delete ? "success" : "default"}
                  aria-label={
                    player.delete
                      ? `Restore player named ${player.name}`
                      : `Remove player named ${player.name}`
                  }
                  endContent={player.delete ? <AddUser /> : <Delete />}
                  title={player.delete ? "Restore player" : "Remove player"}
                  onPress={() => handleToggleDelete(player.id)}
                >
                  {player.delete ? "Re-add" : "Remove"}
                </Button>
              </div>
            );
          })}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={handleSubmit(true)} color="danger">
            Redo round
          </Button>
          <Button onPress={handleSubmit()} color="primary">
            New round
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
