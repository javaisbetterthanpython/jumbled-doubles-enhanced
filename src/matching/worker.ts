import { getNextBestRound, PlayerId, Round, Team } from "./heuristics";

type WorkerJob = [
  Round[],
  PlayerId[],
  number,
  PlayerId[],
  Team[]?
];

let processing = false;
const pending: WorkerJob[] = [];

async function drainQueue(): Promise<void> {
  if (processing || pending.length === 0) return;
  processing = true;
  const [rounds, players, courts, volunteerSitouts, fixedPairs = []] =
    pending.shift()!;
  try {
    const round = await getNextBestRound(
      rounds,
      players,
      courts,
      volunteerSitouts,
      fixedPairs
    );
    postMessage(round);
  } finally {
    processing = false;
    void drainQueue();
  }
}

addEventListener("message", (event: MessageEvent<WorkerJob>) => {
  pending.push(event.data);
  void drainQueue();
});
