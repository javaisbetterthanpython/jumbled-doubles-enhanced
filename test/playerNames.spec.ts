import {
  disambiguateNames,
  getBaseName,
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
    expect(result.get("a")).toMatch(/^(Pickle|Dink|Kitchen) Bob$/);
    expect(result.get("b")).toMatch(/^(Pickle|Dink|Kitchen) Bob$/);
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
    expect(
      names.every((n) => /^(Pickle|Dink|Kitchen|Paddle|Ernie) Bob$/.test(n))
    ).toBe(true);
    expect(new Set(names).size).toBe(3);
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
    expect(names.a).toMatch(/^(Pickle|Dink|Kitchen) Alice$/);
    expect(names.b).toMatch(/^(Pickle|Dink|Kitchen) Alice$/);
    expect(names.a).not.toBe(names.b);
  });
});

describe("renameInNameList", () => {
  it("assigns adjectives when adding a duplicate via rename", () => {
    const result = renameInNameList(["Alice", "Bob"], 1, "Alice");
    expect(result[0]).toMatch(/^(Pickle|Dink|Kitchen) Alice$/);
    expect(result[1]).toMatch(/^(Pickle|Dink|Kitchen) Alice$/);
  });
});
