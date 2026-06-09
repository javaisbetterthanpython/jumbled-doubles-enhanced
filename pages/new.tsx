import {
  Button,
  ButtonGroup,
  Input,
  Spacer,
  Switch,
  Textarea,
} from "@nextui-org/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useEffect, useRef, useState } from "react";
import { AddUser, Delete, People, User, Document } from "react-iconly";
import { Court } from "../src/Court";
import { PairLinkIcon } from "../src/PlayerBadge";
import {
  newGame,
  useShufflerDispatch,
  useShufflerState,
  useShufflerWorker,
} from "../src/useShuffler";
import { ResetPlayersModal } from "../src/ResetPlayersModal";
import { PlayerNameEdit } from "../src/PlayerNameEdit";
import { disambiguateNames, renameWithDisambiguation } from "../src/playerNames";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";

type NamePair = [string, string];
type SetupPlayer = { id: string; name: string };

function getPartner(name: string, pairs: NamePair[]): string | null {
  for (const [a, b] of pairs) {
    if (a === name) return b;
    if (b === name) return a;
  }
  return null;
}

function isPaired(name: string, pairs: NamePair[]): boolean {
  return getPartner(name, pairs) !== null;
}

function removePairForPlayer(pairs: NamePair[], name: string): NamePair[] {
  return pairs.filter(([a, b]) => a !== name && b !== name);
}

function addPair(pairs: NamePair[], a: string, b: string): NamePair[] {
  const sorted: NamePair = a.localeCompare(b) <= 0 ? [a, b] : [b, a];
  return [
    ...removePairForPlayer(pairs, a),
    ...removePairForPlayer(pairs, b),
    sorted,
  ];
}

function renameInPairs(
  pairs: NamePair[],
  oldName: string,
  newName: string
): NamePair[] {
  return pairs.map(([a, b]) => {
    const next: NamePair = [
      a === oldName ? newName : a,
      b === oldName ? newName : b,
    ];
    return next[0].localeCompare(next[1]) <= 0
      ? next
      : [next[1], next[0]];
  });
}

function NewGame() {
  const router = useRouter();
  const state = useShufflerState();
  const { playersById } = state;
  const dispatch = useShufflerDispatch();
  const worker = useShufflerWorker();

  const [formStatus, setFormStatus] = useState<"edit" | "validating">("edit");
  const [modal, setModal] = useState<"none" | "reset-players">("none");

  const [playerInput, setPlayerInput] = useState("");
  const playerInputRef = useRef<HTMLTextAreaElement>(null);

  const [players, setPlayers] = useState<SetupPlayer[]>([]);
  const [courts, setCourts] = useState(state.courts.toString());
  const [customizeCourtNames, setCustomizeCourtNames] = useState(false);
  const [courtNames, setCourtNames] = useState<string[]>([]);
  const [fixedPairs, setFixedPairs] = useState<NamePair[]>([]);
  const [linkingPlayer, setLinkingPlayer] = useState<string | null>(null);

  const applySetupDisambiguation = (
    roster: SetupPlayer[],
    before?: SetupPlayer[]
  ): SetupPlayer[] => {
    const names = disambiguateNames(
      roster.map((p) => ({ id: p.id, name: p.name })),
      before?.map((p) => ({ id: p.id, name: p.name }))
    );
    return roster.map((p) => ({
      ...p,
      name: names.get(p.id) ?? p.name,
    }));
  };

  const handleAddPlayers = () => {
    if (!playerInput) return;
    const names = Array.from(
      new Set(
        (playerInput || "")
          .split(/[\n,]+/)
          .map((x) => x.trim())
          .filter((x) => !!x)
      )
    );
    setPlayers((current) => {
      const before = current;
      const added = names.map((name) => ({ id: uuidv4(), name }));
      return applySetupDisambiguation([...current, ...added], before);
    });
    setPlayerInput("");
    playerInputRef.current?.focus();
  };

  // Load last time's players and court names.
  useEffect(() => {
    const loaded = [...state.players]
      .filter((id) => playersById[id])
      .map((id) => ({
        id,
        name: playersById[id].name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setPlayers(loaded);
    setCourts(state.courts.toString());

    if (state.courtNames.length) {
      setCustomizeCourtNames(true);
      setCourtNames(state.courtNames);
    }

    if (state.fixedPairs?.length) {
      const namePairs = state.fixedPairs
        .map(([a, b]) => {
          const nameA = playersById[a]?.name;
          const nameB = playersById[b]?.name;
          if (nameA && nameB) return [nameA, nameB] as NamePair;
          return null;
        })
        .filter((pair): pair is NamePair => pair !== null);
      setFixedPairs(namePairs);
    }
  }, [state.players, state.courts, state.courtNames, state.fixedPairs, playersById]);

  const handleNewGame = async () => {
    const names = players.map((p) => p.name);
    if (names.length < 4) {
      setFormStatus("validating");
      return;
    }
    const courtCount = parseInt(courts);
    if (isNaN(courtCount) || courtCount < 1) {
      setFormStatus("validating");
      return;
    }
    if (
      customizeCourtNames &&
      (new Set(courtNames.map((x) => x.trim())).size !== courtNames.length ||
        courtNames.some((x) => !x.trim()))
    ) {
      setFormStatus("validating");
      return;
    }
    await newGame(dispatch, state, worker, {
      names,
      courts: courtCount,
      courtNames: customizeCourtNames ? courtNames : [],
      fixedPairs,
    });
    router.push("/rounds");
  };

  const handleResetPlayers = () => {
    setModal("reset-players");
  };

  const handleLinkClick = (name: string) => {
    if (isPaired(name, fixedPairs)) return;

    if (linkingPlayer === null) {
      setLinkingPlayer(name);
      return;
    }

    if (linkingPlayer === name) {
      setLinkingPlayer(null);
      return;
    }

    if (isPaired(linkingPlayer, fixedPairs)) {
      setLinkingPlayer(name);
      return;
    }

    setFixedPairs(addPair(fixedPairs, linkingPlayer, name));
    setLinkingPlayer(null);
  };

  const handleUnlink = (name: string) => {
    setFixedPairs(removePairForPlayer(fixedPairs, name));
    if (linkingPlayer === name) setLinkingPlayer(null);
  };

  const playerError = formStatus === "validating" && players.length < 4;
  const courtsError =
    formStatus === "validating" &&
    (isNaN(parseInt(courts)) || parseInt(courts) < 1);
  const courtNamesError =
    formStatus === "validating" &&
    (courtNames.some((x) => !x.trim()) ||
      new Set(courtNames.map((x) => x.trim())).size !== courtNames.length);

  return (
    <>
      <Head>
        <title>New game - Jumbled Doubles</title>
        <meta name="description" content="Add players" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="mx-auto max-w-xl">
        <ResetPlayersModal
          open={modal === "reset-players"}
          onClose={() => setModal("none")}
          onSubmit={() => {
            setPlayers([]);
            setFixedPairs([]);
            setLinkingPlayer(null);
            setModal("none");
          }}
        />
        <div className="flex justify-center items-center">
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <div className="flex items-center gap-2">
                <People />
                <span id="players-label">
                  Who&apos;s playing?{" "}
                  <span className="italic text-gray-500">
                    {players.length ? `${players.length} players` : ""}
                  </span>
                </span>
                <div className="flex-1" />
                <Button
                  size="sm"
                  color="secondary"
                  variant="flat"
                  onPress={() => handleResetPlayers()}
                >
                  Reset players
                </Button>
              </div>
              <Spacer y={2} />
              <div className="flex items-end gap-2">
                <Textarea
                  name="add-players"
                  className="flex-1"
                  ref={playerInputRef}
                  autoFocus
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  minRows={1}
                  maxRows={10}
                  itemID="player-input-label"
                  placeholder="Jo Swift, Kathryn Lob"
                  variant="bordered"
                  label="Add players"
                  labelPlacement="outside"
                  color={playerError ? "danger" : "default"}
                  isInvalid={players.length < 4 && formStatus === "validating"}
                  errorMessage={
                    players.length < 4 && formStatus === "validating"
                      ? "At least 4 players are required"
                      : undefined
                  }
                />
                <Button
                  color="primary"
                  aria-label="Add players in text box"
                  isIconOnly
                  type="button"
                  onPress={() => handleAddPlayers()}
                >
                  <AddUser />
                </Button>
              </div>
              <Spacer y={2} />
              {players.map((player, index) => {
                const { id, name } = player;
                const partner = getPartner(name, fixedPairs);
                const paired = partner !== null;
                const linking = linkingPlayer === name;
                return (
                  <Fragment key={id}>
                    <div
                      className={clsx(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5",
                        linking && "ring-2 ring-primary bg-primary-50",
                        paired && !linking && "bg-secondary-50"
                      )}
                    >
                      <span className="shrink-0">
                        <User
                          primaryColor={paired ? "#7828c8" : "#888"}
                          size="medium"
                        />
                      </span>
                      <span className="text-sm text-gray-500 w-4 shrink-0 tabular-nums">
                        {index + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                        <PlayerNameEdit
                          compact
                          editTrigger="click"
                          name={name}
                          onSave={(newName) => {
                            const namesById = renameWithDisambiguation(
                              players.map((p) => ({ id: p.id, name: p.name })),
                              id,
                              newName
                            );
                            const oldName = name;
                            const nextPlayers = players.map((p) => ({
                              ...p,
                              name: namesById[p.id] ?? p.name,
                            }));
                            setFixedPairs(
                              renameInPairs(
                                fixedPairs,
                                oldName,
                                namesById[id] ?? newName
                              )
                            );
                            if (linkingPlayer === oldName) {
                              setLinkingPlayer(namesById[id] ?? newName);
                            }
                            setPlayers(nextPlayers);
                          }}
                        />
                        {paired ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 text-sm font-normal text-secondary"
                            title={`Paired with ${partner}`}
                          >
                            <PairLinkIcon size={14} color="#7828c8" />
                            {partner}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {paired ? (
                          <Button
                            variant="flat"
                            color="secondary"
                            size="sm"
                            aria-label={`Unlink ${name} from ${partner}`}
                            isIconOnly
                            onPress={() => handleUnlink(name)}
                          >
                            <PairLinkIcon color="#7828c8" size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant={linking ? "solid" : "flat"}
                            color={linking ? "primary" : "default"}
                            size="sm"
                            aria-label={
                              linkingPlayer && linkingPlayer !== name
                                ? `Pair ${linkingPlayer} with ${name}`
                                : `Link ${name} as a fixed pair`
                            }
                            isIconOnly
                            onPress={() => handleLinkClick(name)}
                          >
                            <PairLinkIcon
                              color={linking ? "#fff" : "#888"}
                              size={16}
                            />
                          </Button>
                        )}
                        <Button
                          variant="flat"
                          color="default"
                          size="sm"
                          aria-label={`Remove player named ${name}`}
                          isIconOnly
                          onPress={() => {
                            setFixedPairs(removePairForPlayer(fixedPairs, name));
                            if (linkingPlayer === name) setLinkingPlayer(null);
                            setPlayers((current) => {
                              const before = current;
                              const next = current.filter((p) => p.id !== id);
                              return applySetupDisambiguation(next, before);
                            });
                          }}
                        >
                          <Delete />
                        </Button>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {linkingPlayer && !isPaired(linkingPlayer, fixedPairs) && (
                <>
                  <Spacer y={1} />
                  <p className="text-sm text-primary">
                    Tap another player to pair with {linkingPlayer}, or tap{" "}
                    {linkingPlayer}&apos;s link button again to cancel.
                  </p>
                </>
              )}
            </div>
            <Spacer y={3} />
            <label>
              <div className="flex items-center gap-2">
                <Court />
                <p
                  id="courts-label"
                  className={courtsError ? "text-danger" : ""}
                >
                  How many courts are available?{" "}
                  <span className="italic text-gray-500">
                    {Math.floor(players.length / 4) ? (
                      <>Enough players for {Math.floor(players.length / 4)}</>
                    ) : (
                      ""
                    )}
                  </span>
                </p>
              </div>
              <Spacer y={2} />
              <Input
                id="court-input"
                aria-labelledby="courts-label"
                type="number"
                variant="bordered"
                min={1}
                isInvalid={courtsError}
                errorMessage={
                  courtsError ? "Courts must be 1 or greater." : undefined
                }
                value={courts}
                onChange={(e) => setCourts(e.target.value)}
                fullWidth
              />
            </label>
            <Spacer y={3} />
            <label>
              <div className="flex gap-2">
                <Document />
                <p>Customize court names</p>
                <Spacer className="flex-1" />
                <Switch
                  isSelected={customizeCourtNames}
                  onChange={(e) => {
                    setCourtNames(
                      Array.from(
                        new Array(parseInt(courts) || 1),
                        (_, i) => `${i + 1}`
                      )
                    );
                    setCustomizeCourtNames(e.target.checked);
                  }}
                />
              </div>
            </label>
            {customizeCourtNames && (
              <>
                <div className="flex gap-2 items-center">
                  <p className="text-primary font-semibold">Quick set</p>
                  <ButtonGroup>
                    <Button
                      type="button"
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onPress={() =>
                        setCourtNames(
                          Array.from(
                            new Array(Math.max(parseInt(courts) || 0, 0)),
                            (_, i) => (i + 1).toString()
                          )
                        )
                      }
                    >
                      1, 2, 3, 4…
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() =>
                        setCourtNames(
                          Array.from(
                            new Array(Math.max(parseInt(courts) || 0, 0)),
                            (_, i) => ((i + 1) * 2).toString()
                          )
                        )
                      }
                    >
                      2, 4, 6, 8…
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onPress={() =>
                        setCourtNames(
                          Array.from(
                            new Array(Math.max(parseInt(courts) || 0, 0)),
                            (_, i) => ((i + 1) * 2 - 1).toString()
                          )
                        )
                      }
                    >
                      1, 3, 5, 7…
                    </Button>
                  </ButtonGroup>
                </div>
                {/* list-inside was causing wrapping with input, hack using ml. */}
                <ol className="list-disc ml-5">
                  {Array.from(
                    new Array(Math.max(parseInt(courts) || 0, 0)),
                    (_, i) => courtNames[i] || ""
                  ).map((courtName, index, allNames) => {
                    const duplicationError =
                      courtNamesError &&
                      allNames.some(
                        (name, j) =>
                          j < index && name.trim() === courtName.trim()
                      );
                    const emptyCourtName = courtNamesError && !courtName.trim();
                    return (
                      <li key={index} className="mt-2">
                        <Input
                          value={courtName}
                          label="Court"
                          labelPlacement="outside-left"
                          onChange={(e) => {
                            const name = e.target.value;
                            const newNames = [...courtNames];
                            newNames[index] = name;
                            setCourtNames(newNames);
                          }}
                          isInvalid={duplicationError || emptyCourtName}
                          errorMessage={
                            emptyCourtName
                              ? "Please provide a court name"
                              : duplicationError
                              ? "Duplicated court name"
                              : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
            <Spacer y={4} />
            <Button
              onPress={() => {
                // Set timeout to workaround issue where event gets ignored when pressing with keyboard open on Android.
                setTimeout(() => {
                  if (playerInput.trim().length) {
                    handleAddPlayers();
                  } else {
                    handleNewGame();
                  }
                }, 0);
              }}
              className="bg-gradient-to-l from-blue-600 to-pink-600 text-white"
            >
              Let&apos;s play!
            </Button>
            <Spacer y={8} />
          </div>
        </div>
      </div>
    </>
  );
}

export default NewGame;
