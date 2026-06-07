import { getNextBestRound, PlayerId, Round, Team } from "./heuristics";

addEventListener(
  "message",
  async (
    event: MessageEvent<
      [Round[], PlayerId[], number, PlayerId[], Team[]?]
    >
  ) => {
    const [rounds, players, courts, volunteerSitouts, fixedPairs = []] =
      event.data;
    const round = await getNextBestRound(
      rounds,
      players,
      courts,
      volunteerSitouts,
      fixedPairs
    );
    postMessage(round);
  }
);
