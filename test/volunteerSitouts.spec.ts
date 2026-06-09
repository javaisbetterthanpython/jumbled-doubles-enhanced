import { normalizeVolunteerSitoutsByRound } from "../src/useShuffler";

describe("normalizeVolunteerSitoutsByRound", () => {
  test("fills missing entries with empty arrays", () => {
    expect(normalizeVolunteerSitoutsByRound(2, undefined)).toEqual([[], []]);
    expect(normalizeVolunteerSitoutsByRound(2, null)).toEqual([[], []]);
    expect(normalizeVolunteerSitoutsByRound(2, [])).toEqual([[], []]);
    expect(normalizeVolunteerSitoutsByRound(2, [["a"]])).toEqual([["a"], []]);
  });

  test("truncates extra entries", () => {
    expect(
      normalizeVolunteerSitoutsByRound(1, [["a"], ["b", "c"]])
    ).toEqual([["a"]]);
  });

  test("replaces non-array slots", () => {
    expect(
      normalizeVolunteerSitoutsByRound(2, [["a"], null, "bad"])
    ).toEqual([["a"], []]);
  });
});
