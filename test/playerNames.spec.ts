import {
  disambiguateNames,
  getBaseName,
  getPickleballAdjective,
  PICKLEBALL_ADJECTIVES,
  renameInNameList,
  renameWithDisambiguation,
} from "../src/playerNames";

describe("getBaseName", () => {
  it("strips pickleball adjectives", () => {
    expect(getBaseName("Pickle Bob")).toBe("Bob");
    expect(getBaseName("Dink Alice")).toBe("Alice");
  });

  it("strips numbering suffix", () => {
    expect(getBaseName("Bob (2)")).toBe("Bob");
    expect(getBaseName("Bob (3)")).toBe("Bob");
  });

  it("returns plain names unchanged", () => {
    expect(getBaseName("Bob")).toBe("Bob");
  });
});

describe("PICKLEBALL_ADJECTIVES", () => {
  it("has at least 30 options for a session", () => {
    expect(PICKLEBALL_ADJECTIVES.length).toBeGreaterThanOrEqual(30);
  });
});

describe("disambiguateNames", () => {
  it("leaves a single player as plain base name", () => {
    const result = disambiguateNames([{ id: "a", name: "Bob" }]);
    expect(result.get("a")).toBe("Bob");
  });

  it("leaves a lone adjectived name when no duplicate base", () => {
    const result = disambiguateNames([{ id: "a", name: "Pickle Bob" }]);
    expect(result.get("a")).toBe("Pickle Bob");
  });

  it("assigns adjectives when a second plain duplicate appears", () => {
    const result = disambiguateNames([
      { id: "a", name: "Bob" },
      { id: "b", name: "Bob" },
    ]);
    const names = [result.get("a")!, result.get("b")!];
    const adjectives = names.map((n) => getPickleballAdjective(n));
    expect(adjectives.every(Boolean)).toBe(true);
    expect(new Set(adjectives).size).toBe(2);
    expect(result.get("a")).not.toBe(result.get("b"));
  });

  it("leaves mixed plain and adjectived names as-is", () => {
    const result = disambiguateNames([
      { id: "a", name: "Bob" },
      { id: "b", name: "Dink Bob" },
    ]);
    expect(result.get("a")).toBe("Bob");
    expect(result.get("b")).toBe("Dink Bob");
  });

  it("numbers when all members return to plain after adjectives", () => {
    const before = [
      { id: "a", name: "Pickle Bob" },
      { id: "b", name: "Dink Bob" },
    ];
    const after = [
      { id: "a", name: "Bob" },
      { id: "b", name: "Bob" },
    ];
    const result = disambiguateNames(after, before);
    expect(result.get("a")).toBe("Bob");
    expect(result.get("b")).toBe("Bob (2)");
  });

  it("assigns adjectives to three plain duplicates", () => {
    const result = disambiguateNames([
      { id: "a", name: "Bob" },
      { id: "b", name: "Bob" },
      { id: "c", name: "Bob" },
    ]);
    const names = [...result.values()];
    const adjectives = names.map((n) => getPickleballAdjective(n));
    expect(adjectives.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(3);
    expect(new Set(adjectives).size).toBe(3);
  });

  it("does not reuse adjectives across different duplicate base names", () => {
    const result = disambiguateNames([
      { id: "a", name: "Alex" },
      { id: "b", name: "Alex" },
      { id: "c", name: "Andrew" },
      { id: "d", name: "Andrew" },
    ]);
    const adjectives = [...result.values()]
      .map((n) => getPickleballAdjective(n))
      .filter(Boolean);
    expect(adjectives).toHaveLength(4);
    expect(new Set(adjectives).size).toBe(4);
  });
});

describe("renameWithDisambiguation", () => {
  it("disambiguates after a rename introduces a duplicate", () => {
    const names = renameWithDisambiguation(
      [
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob" },
      ],
      "b",
      "Alice"
    );
    expect(getPickleballAdjective(names.a)).toBeTruthy();
    expect(getPickleballAdjective(names.b)).toBeTruthy();
    expect(getPickleballAdjective(names.a)).not.toBe(
      getPickleballAdjective(names.b)
    );
    expect(names.a).not.toBe(names.b);
  });
});

describe("renameInNameList", () => {
  it("assigns adjectives when adding a duplicate via rename", () => {
    const result = renameInNameList(["Alice", "Bob"], 1, "Alice");
    expect(getPickleballAdjective(result[0])).toBeTruthy();
    expect(getPickleballAdjective(result[1])).toBeTruthy();
    expect(getPickleballAdjective(result[0])).not.toBe(
      getPickleballAdjective(result[1])
    );
  });
});
