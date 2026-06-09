import * as React from "react";
import { Player, PlayerId, Round, Team } from "./matching/heuristics";
import { v4 as uuidv4 } from "uuid";
import { sanitizeFixedPairs } from "./fixedPairs";
import { renameWithDisambiguation } from "./playerNames";

type NewRoundOptions = {
  volunteerSitouts: PlayerId[];
  regenerate?: boolean;
  players?: PlayerId[];
  playersById?: Record<PlayerId, Player>;
  fixedPairs?: Team[];
};

type NewGameOptions = {
  names: string[];
  courts: number;
  courtNames: string[];
  fixedPairs?: [string, string][];
};

type EditCourts = {
  courts: number;
  regenerate: boolean;
};
type EditPlayers = {
  newPlayers: Player[];
  fixedPairs: Team[];
  regenerate: boolean;
};

type Action =
  | {
      type: "load-from-cache";
      payload: null;
    }
  | {
      type: "new-game-start";
      payload: {
        players: PlayerId[];
        playersById: Record<PlayerId, Player>;
        courts: number;
        courtNames: string[];
        fixedPairs: Team[];
      };
    }
  | {
      type: "new-game";
      payload: Round;
    }
  | {
      type: "new-game-fail";
      payload: { error: Error };
    }
  | {
      type: "new-round";
      payload: {
        round: Round;
        courts?: number;
        volunteerSitouts: PlayerId[];
        regenerate?: boolean;
      };
    }
  | {
      type: "start-generation";
      payload: NewRoundOptions;
    }
  | {
      type: "new-round-fail";
      payload: { error: Error };
    }
  | {
      type: "rename-players";
      payload: { playersById: Record<PlayerId, Player> };
    };
type Dispatch = (action: Action) => void;
type State = {
  players: PlayerId[];
  rounds: Round[];
  courts: number;
  courtNames: string[];
  fixedPairs: Team[];
  volunteerSitoutsByRound: PlayerId[][];
  playersById: Record<PlayerId, Player>;
  generating: boolean;
  cacheLoaded: boolean;
};
type ShufflerProviderProps = { children: React.ReactNode };

const defaultState: State = {
  players: [],
  volunteerSitoutsByRound: [],
  playersById: {},
  rounds: [],
  courts: 2,
  courtNames: [],
  fixedPairs: [],
  generating: false,
  cacheLoaded: false,
};

const ShufflerStateContext = React.createContext<State | undefined>(undefined);
const ShufflerDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);
const ShufflerWorkerContext = React.createContext<Worker | null | undefined>(
  undefined
);

type PregenCache = {
  key: string | null;
  round: Round | null;
  promise: Promise<Round> | null;
  volunteerSitouts: PlayerId[];
  generationId: number;
};

const emptyPregenCache = (): PregenCache => ({
  key: null,
  round: null,
  promise: null,
  volunteerSitouts: [],
  generationId: 0,
});

const ShufflerPregenContext = React.createContext<
  React.MutableRefObject<PregenCache> | undefined
>(undefined);

function buildPregenKey(
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  fixedPairs: Team[]
): string {
  return JSON.stringify({
    players,
    courts,
    fixedPairs,
    rounds: rounds.map(({ matches, sitOuts }) => ({ matches, sitOuts })),
  });
}

const sitoutsEqual = (a: PlayerId[], b: PlayerId[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index]);

function invalidatePregen(
  pregen: React.MutableRefObject<PregenCache>
): void {
  pregen.current.generationId += 1;
  pregen.current.key = null;
  pregen.current.round = null;
  pregen.current.promise = null;
  pregen.current.volunteerSitouts = [];
}

function startPregenerate(
  pregen: React.MutableRefObject<PregenCache>,
  worker: Worker,
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  fixedPairs: Team[],
  volunteerSitouts: PlayerId[] = []
): void {
  const key = buildPregenKey(rounds, players, courts, fixedPairs);
  const genId = pregen.current.generationId;

  if (
    pregen.current.key === key &&
    sitoutsEqual(pregen.current.volunteerSitouts, volunteerSitouts) &&
    (pregen.current.round !== null || pregen.current.promise !== null)
  ) {
    return;
  }

  pregen.current.key = key;
  pregen.current.volunteerSitouts = [...volunteerSitouts];
  pregen.current.round = null;

  pregen.current.promise = generateRound(
    worker,
    rounds,
    players,
    courts,
    volunteerSitouts,
    fixedPairs
  ).then((round) => {
    if (
      genId === pregen.current.generationId &&
      pregen.current.key === key
    ) {
      pregen.current.round = round;
    }
    return round;
  });
}

async function consumePregen(
  pregen: React.MutableRefObject<PregenCache>,
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  fixedPairs: Team[],
  volunteerSitouts: PlayerId[]
): Promise<Round | null> {
  const key = buildPregenKey(rounds, players, courts, fixedPairs);
  if (
    pregen.current.key !== key ||
    !sitoutsEqual(pregen.current.volunteerSitouts, volunteerSitouts)
  ) {
    return null;
  }

  if (pregen.current.round) {
    const round = pregen.current.round;
    invalidatePregen(pregen);
    return round;
  }

  if (pregen.current.promise) {
    try {
      const round = await pregen.current.promise;
      if (
        pregen.current.key === key &&
        sitoutsEqual(pregen.current.volunteerSitouts, volunteerSitouts)
      ) {
        invalidatePregen(pregen);
        return round;
      }
    } catch {
      invalidatePregen(pregen);
    }
  }

  return null;
}

function createPlayers(names: string[]) {
  return names.map((name) => {
    return { name, id: uuidv4() };
  });
}

function getPlayersById(previous: Record<PlayerId, Player>, players: Player[]) {
  const byId = { ...previous };
  players.forEach((player) => {
    byId[player.id] = player;
  });
  return byId;
}

function loadFromCache(previousState: State): State {
  const existingState = previousState || defaultState;
  if (typeof window === "undefined") return existingState;
  const storageState = window.localStorage.getItem("state");
  if (storageState === null) {
    return existingState;
  }
  try {
    const {
      players,
      rounds,
      courts,
      volunteerSitoutsByRound,
      playersById,
      courtNames = [],
      fixedPairs = [],
    } = JSON.parse(storageState);
    if (
      !Array.isArray(players) ||
      !Array.isArray(rounds) ||
      isNaN(courts) ||
      !playersById
    )
      return existingState;

    return {
      players,
      playersById,
      volunteerSitoutsByRound,
      rounds,
      courts,
      courtNames,
      fixedPairs,
      cacheLoaded: true,
      generating: false,
    };
  } catch (e) {
    return existingState;
  }
}

function cacheState(state: State): State {
  if (typeof window === "undefined") return state;
  window.setTimeout(() => {
    const {
      players,
      courts,
      courtNames,
      fixedPairs,
      rounds,
      volunteerSitoutsByRound,
      playersById,
    } = state;
    window.localStorage.setItem(
      "state",
      JSON.stringify({
        players,
        courts,
        courtNames,
        fixedPairs,
        rounds,
        volunteerSitoutsByRound,
        playersById,
      })
    );
  }, 0);
  return state;
}

function shufflerReducer(state: State, action: Action): State {
  switch (action.type) {
    case "new-game-start": {
      const { payload } = action;
      const { players, playersById, courts, courtNames, fixedPairs } = payload;

      return cacheState({
        ...state,
        players,
        playersById,
        courts,
        courtNames,
        fixedPairs,
        rounds: [],
        volunteerSitoutsByRound: [],
        generating: true,
      });
    }
    case "new-game": {
      const { payload } = action;
      const round = withNameSnapshot(
        payload,
        state.playersById,
        state.players
      );

      return cacheState({
        ...state,
        rounds: [round],
        volunteerSitoutsByRound: [[]],
        generating: false,
      });
    }
    case "load-from-cache": {
      return loadFromCache(state);
    }
    case "start-generation":
      return {
        ...state,
        generating: true,
        players: action.payload.players || state.players,
        playersById: action.payload.playersById || state.playersById,
        fixedPairs: action.payload.fixedPairs ?? state.fixedPairs,
      };
    case "new-round": {
      const { regenerate } = action.payload;
      const round = withNameSnapshot(
        action.payload.round,
        state.playersById,
        state.players
      );
      const rounds = regenerate
        ? [...state.rounds.slice(0, -1), round]
        : [...state.rounds, round];
      const volunteerSitoutsByRound = regenerate
        ? [
            ...state.volunteerSitoutsByRound.slice(0, -1),
            action.payload.volunteerSitouts,
          ]
        : [
            ...state.volunteerSitoutsByRound,
            action.payload.volunteerSitouts,
          ];
      return cacheState({
        ...state,
        generating: false,
        rounds,
        courts: action.payload.courts ?? state.courts,
        volunteerSitoutsByRound,
      });
    }
    case "new-round-fail":
    case "new-game-fail": {
      return {
        ...state,
        generating: false,
      };
    }
    case "rename-players": {
      return cacheState({
        ...state,
        playersById: action.payload.playersById,
      });
    }
  }
  return state;
}

function snapshotNamesForRound(
  round: Round,
  playersById: Record<PlayerId, Player>,
  activePlayerIds: PlayerId[]
): Round {
  const ids = new Set<PlayerId>(activePlayerIds);
  round.sitOuts.forEach((id) => ids.add(id));
  round.matches.forEach(([teamA, teamB]) => {
    teamA.forEach((id) => ids.add(id));
    teamB.forEach((id) => ids.add(id));
  });
  const playerNamesById = Object.fromEntries(
    Array.from(ids).map((id) => [id, playersById[id]?.name ?? ""])
  );
  return { ...round, playerNamesById };
}

function withNameSnapshot(
  round: Round,
  playersById: Record<PlayerId, Player>,
  activePlayerIds: PlayerId[]
): Round {
  return snapshotNamesForRound(round, playersById, activePlayerIds);
}

async function newRound(
  dispatch: Dispatch,
  state: State,
  worker: Worker | null,
  payload: NewRoundOptions,
  pregen: React.MutableRefObject<PregenCache>
) {
  if (!worker) return;
  if (state.generating || roundGenerationInFlight) return;
  roundGenerationInFlight = true;
  const rounds = payload.regenerate ? state.rounds.slice(0, -1) : state.rounds;
  const players = payload.players ?? state.players;
  const fixedPairs = payload.fixedPairs ?? state.fixedPairs;

  const precomputed = await consumePregen(
    pregen,
    rounds,
    players,
    state.courts,
    fixedPairs,
    payload.volunteerSitouts
  );
  try {
    if (precomputed?.matches) {
      dispatch({
        type: "new-round",
        payload: {
          round: precomputed,
          volunteerSitouts: payload.volunteerSitouts,
          regenerate: payload.regenerate ?? false,
        },
      });
      return;
    }

    invalidatePregen(pregen);
    dispatch({ type: "start-generation", payload });

    const nextRound = await generateRound(
      worker,
      rounds,
      players,
      state.courts,
      payload.volunteerSitouts,
      fixedPairs
    );
    if (!nextRound?.matches) {
      throw new Error("Round generation returned an empty round");
    }
    dispatch({
      type: "new-round",
      payload: {
        round: nextRound,
        volunteerSitouts: payload.volunteerSitouts,
        regenerate: payload.regenerate ?? false,
      },
    });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
  } finally {
    roundGenerationInFlight = false;
  }
}

async function newGame(
  dispatch: Dispatch,
  state: State,
  worker: Worker | null,
  payload: NewGameOptions,
  pregen: React.MutableRefObject<PregenCache>
) {
  if (!worker) return;
  if (state.generating) return;
  invalidatePregen(pregen);
  const { courts, names, courtNames, fixedPairs: namePairs = [] } = payload;
  const players = createPlayers(names).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const playerIds = players.map(({ id }) => id);
  const playersById = getPlayersById({}, players);
  const nameToId = Object.fromEntries(players.map((p) => [p.name, p.id]));
  const fixedPairs: Team[] = namePairs
    .map(([a, b]) => [nameToId[a], nameToId[b]] as Team)
    .filter(([a, b]) => a && b);
  dispatch({
    type: "new-game-start",
    payload: {
      players: players.map(({ id }) => id),
      playersById,
      courts,
      courtNames,
      fixedPairs,
    },
  });
  try {
    const nextRound = await generateRound(
      worker,
      [],
      playerIds,
      courts,
      [],
      fixedPairs
    );
    dispatch({ type: "new-game", payload: nextRound });
  } catch (error) {
    dispatch({ type: "new-game-fail", payload: { error: error as Error } });
  }
}

// One in-flight worker request at a time (pregen + user clicks share the worker).
let workerTaskTail: Promise<unknown> = Promise.resolve();
let roundGenerationInFlight = false;

function generateRoundUncached(
  worker: Worker,
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  volunteerSitouts: PlayerId[],
  fixedPairs: Team[] = []
): Promise<Round> {
  return new Promise((resolve, reject) => {
    const messageCallback = (event: MessageEvent<Round>) => {
      cleanup();
      resolve(event.data);
    };
    const errorCallback = (error: ErrorEvent) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      worker.removeEventListener("message", messageCallback);
      worker.removeEventListener("error", errorCallback);
    };
    worker.addEventListener("message", messageCallback);
    worker.addEventListener("error", errorCallback);

    worker.postMessage([rounds, players, courts, volunteerSitouts, fixedPairs]);
  });
}

async function generateRound(
  worker: Worker,
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  volunteerSitouts: PlayerId[],
  fixedPairs: Team[] = []
): Promise<Round> {
  const task = () =>
    generateRoundUncached(
      worker,
      rounds,
      players,
      courts,
      volunteerSitouts,
      fixedPairs
    );
  const result = workerTaskTail.then(task, task);
  workerTaskTail = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function editCourts(
  dispatch: Dispatch,
  state: State,
  worker: Worker | null,
  payload: EditCourts,
  pregen: React.MutableRefObject<PregenCache>
) {
  if (!worker) return;
  if (state.generating) return;
  const { courts, regenerate } = payload;
  const volunteerSitouts = regenerate
    ? state.volunteerSitoutsByRound.slice(-1)[0]
    : [];
  const rounds = regenerate ? state.rounds.slice(0, -1) : state.rounds;

  const precomputed = await consumePregen(
    pregen,
    rounds,
    state.players,
    courts,
    state.fixedPairs,
    volunteerSitouts
  );
  if (precomputed?.matches) {
    dispatch({
      type: "new-round",
      payload: {
        round: precomputed,
        volunteerSitouts,
        courts,
        regenerate,
      },
    });
    return;
  }

  invalidatePregen(pregen);
  dispatch({
    type: "start-generation",
    payload: { volunteerSitouts, regenerate },
  });

  try {
    const round = await generateRound(
      worker,
      rounds,
      state.players,
      courts,
      volunteerSitouts,
      state.fixedPairs
    );
    dispatch({
      type: "new-round",
      payload: {
        round,
        volunteerSitouts,
        courts,
        regenerate,
      },
    });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
  }
}

function renamePlayer(
  dispatch: Dispatch,
  state: State,
  playerId: PlayerId,
  newName: string
): Record<PlayerId, string> {
  const allPlayers = Object.values(state.playersById);
  const namesById = renameWithDisambiguation(allPlayers, playerId, newName);
  const playersById = { ...state.playersById };
  for (const [id, name] of Object.entries(namesById)) {
    if (playersById[id]) {
      playersById[id] = { ...playersById[id], name };
    }
  }
  dispatch({ type: "rename-players", payload: { playersById } });
  return namesById;
}

async function editPlayers(
  dispatch: Dispatch,
  state: State,
  worker: Worker | null,
  payload: EditPlayers,
  pregen: React.MutableRefObject<PregenCache>
) {
  if (!worker) return;
  if (state.generating) return;
  const { newPlayers, fixedPairs, regenerate } = payload;
  const volunteerSitouts = regenerate
    ? state.volunteerSitoutsByRound.slice(-1)[0]
    : [];
  const rounds = regenerate ? state.rounds.slice(0, -1) : state.rounds;

  const playerIds = newPlayers.map(({ id }) => id);
  const playersById = getPlayersById(state.playersById, newPlayers);
  const sanitizedPairs = sanitizeFixedPairs(fixedPairs, playerIds);

  const precomputed = await consumePregen(
    pregen,
    rounds,
    playerIds,
    state.courts,
    sanitizedPairs,
    volunteerSitouts
  );
  if (precomputed?.matches) {
    dispatch({
      type: "new-round",
      payload: {
        round: precomputed,
        volunteerSitouts,
        regenerate,
      },
    });
    return;
  }

  invalidatePregen(pregen);
  dispatch({
    type: "start-generation",
    payload: {
      volunteerSitouts,
      regenerate,
      playersById,
      players: playerIds,
      fixedPairs: sanitizedPairs,
    },
  });
  try {
    const nextRound = await generateRound(
      worker,
      rounds,
      playerIds,
      state.courts,
      volunteerSitouts,
      sanitizedPairs
    );
    dispatch({
      type: "new-round",
      payload: {
        round: nextRound,
        volunteerSitouts,
        regenerate,
      },
    });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
  }
}

function useShufflerPregen(): React.MutableRefObject<PregenCache> {
  const pregen = React.useContext(ShufflerPregenContext);
  if (pregen === undefined) {
    throw new Error("useShufflerPregen must be used within a ShufflerProvider");
  }
  return pregen;
}

function usePregenerateNextRound(): void {
  const pregen = useShufflerPregen();
  const state = useShufflerState();
  const worker = useShufflerWorker();

  React.useEffect(() => {
    if (!worker || state.generating || !state.cacheLoaded) return;
    if (!state.rounds.length) return;

    startPregenerate(
      pregen,
      worker,
      state.rounds,
      state.players,
      state.courts,
      state.fixedPairs,
      []
    );
  }, [
    pregen,
    worker,
    state.generating,
    state.cacheLoaded,
    state.players,
    state.courts,
    state.fixedPairs,
    state.rounds,
  ]);
}

function ShufflerProvider({ children }: ShufflerProviderProps) {
  const [state, dispatch] = React.useReducer(shufflerReducer, defaultState);
  const [worker, setWorker] = React.useState<Worker | null>(null);
  const pregenRef = React.useRef<PregenCache>(emptyPregenCache());

  React.useEffect(() => {
    const worker = new Worker(new URL("./matching/worker.ts", import.meta.url));
    setWorker(worker);
    return () => {
      worker.terminate();
      invalidatePregen(pregenRef);
      setWorker(null);
    };
  }, []);
  return (
    <ShufflerPregenContext.Provider value={pregenRef}>
      <ShufflerStateContext.Provider value={state}>
        <ShufflerDispatchContext.Provider value={dispatch}>
          <ShufflerWorkerContext.Provider value={worker ?? null}>
            {children}
          </ShufflerWorkerContext.Provider>
        </ShufflerDispatchContext.Provider>
      </ShufflerStateContext.Provider>
    </ShufflerPregenContext.Provider>
  );
}

function useShufflerState() {
  const state = React.useContext(ShufflerStateContext);

  if (state === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }
  return state;
}

function useShufflerDispatch(): Dispatch {
  const dispatch = React.useContext(ShufflerDispatchContext);

  if (dispatch === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }

  return dispatch;
}

function useShufflerWorker(): Worker | null {
  const worker = React.useContext(ShufflerWorkerContext);

  if (worker === undefined) {
    throw new Error(
      "useShufflerWorker must be used within a ShufflerWorkerProvider"
    );
  }

  return worker;
}

function useLoadState() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();
  React.useEffect(() => {
    if (!state) return;
    if (state.cacheLoaded === false) {
      dispatch({ type: "load-from-cache", payload: null });
    }
  }, [state?.cacheLoaded]);
}

export {
  ShufflerProvider,
  useShufflerState,
  useShufflerDispatch,
  useShufflerWorker,
  useShufflerPregen,
  usePregenerateNextRound,
  useLoadState,
  newRound,
  newGame,
  editCourts,
  editPlayers,
  renamePlayer,
  invalidatePregen,
  consumePregen,
  startPregenerate,
};
