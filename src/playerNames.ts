import { Player, PlayerId } from "./matching/heuristics";

/** Pickleball-themed adjectives prepended when duplicate base names appear. */
export const PICKLEBALL_ADJECTIVES = [
  "Pickle",
  "Dink",
  "Kitchen",
  "Paddle",
  "Ernie",
  "Lob",
  "Spin",
  "Volley",
  "Smash",
  "Rally",
  "Drop",
  "Poach",
  "Banger",
  "Flick",
  "Slice",
  "Drive",
  "Baseline",
  "Cross",
  "Golden",
  "Sneaky",
  "Sharp",
  "Quick",
  "Soft",
  "Power",
  "Angle",
  "Net",
  "Spinny",
  "Third",
  "Reset",
  "ATP",
] as const;

const NUMBER_SUFFIX_RE = /^(.+) \((\d+)\)$/;

export function hasPickleballAdjective(name: string): boolean {
  return PICKLEBALL_ADJECTIVES.some((adj) => name.startsWith(`${adj} `));
}

export function getPickleballAdjective(name: string): string | null {
  for (const adj of PICKLEBALL_ADJECTIVES) {
    if (name.startsWith(`${adj} `)) return adj;
  }
  return null;
}

/** Strip auto adjective prefix and ` (N)` suffix to recover the user's base name. */
export function getBaseName(name: string): string {
  const numbered = name.match(NUMBER_SUFFIX_RE);
  if (numbered) return numbered[1];
  const adj = getPickleballAdjective(name);
  if (adj) return name.slice(adj.length + 1);
  return name;
}

function isPlainBaseName(name: string, base: string): boolean {
  return name === base;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function collectUsedAdjectives(
  players: Array<{ id: string; name: string }>
): Set<string> {
  const used = new Set<string>();
  for (const player of players) {
    const adj = getPickleballAdjective(player.name);
    if (adj) used.add(adj);
  }
  return used;
}

function assignAdjectives(
  members: Array<{ id: string; name: string }>,
  base: string,
  usedAdjectives: Set<string>
): Map<string, string> {
  const result = new Map<string, string>();
  const sorted = [...members].sort((a, b) => a.id.localeCompare(b.id));
  const available = shuffleArray(
    PICKLEBALL_ADJECTIVES.filter((adj) => !usedAdjectives.has(adj))
  );
  sorted.forEach((member, index) => {
    const adj = available[index];
    if (adj) {
      result.set(member.id, `${adj} ${base}`);
      usedAdjectives.add(adj);
    } else {
      result.set(member.id, index === 0 ? base : `${base} (${index + 1})`);
    }
  });
  return result;
}

function assignNumbering(
  members: Array<{ id: string; name: string }>,
  base: string
): Map<string, string> {
  const result = new Map<string, string>();
  const sorted = [...members].sort((a, b) => a.id.localeCompare(b.id));
  sorted.forEach((member, index) => {
    result.set(member.id, index === 0 ? base : `${base} (${index + 1})`);
  });
  return result;
}

function groupHadAdjective(
  memberIds: Set<string>,
  before: Array<{ id: string; name: string }>
): boolean {
  return before.some(
    (p) => memberIds.has(p.id) && hasPickleballAdjective(p.name)
  );
}

/**
 * Apply duplicate-name rules across a roster after one or more name edits.
 * Pass `before` when reacting to a rename so adjective→plain transitions use numbering.
 */
export function disambiguateNames(
  players: Array<{ id: string; name: string }>,
  before?: Array<{ id: string; name: string }>
): Map<PlayerId, string> {
  const result = new Map<PlayerId, string>();
  const usedAdjectives = collectUsedAdjectives(players);
  const byBase = new Map<string, Array<{ id: string; name: string }>>();

  for (const player of players) {
    const base = getBaseName(player.name);
    const group = byBase.get(base) ?? [];
    group.push(player);
    byBase.set(base, group);
  }

  for (const [base, members] of Array.from(byBase.entries())) {
    if (members.length === 1) {
      const [player] = members;
      if (hasPickleballAdjective(player.name)) {
        result.set(player.id, player.name);
      } else {
        result.set(player.id, base);
      }
      continue;
    }

    const memberIds = new Set(members.map((m) => m.id));
    const plainMembers = members.filter((p) => isPlainBaseName(p.name, base));
    const adjectivedMembers = members.filter((p) =>
      hasPickleballAdjective(p.name)
    );
    const allPlainNow = members.every((p) => isPlainBaseName(p.name, base));
    const wasAdjectivedGroup =
      before !== undefined && groupHadAdjective(memberIds, before);

    if (allPlainNow && wasAdjectivedGroup) {
      const numbering = assignNumbering(members, base);
      for (const [id, name] of Array.from(numbering.entries())) {
        result.set(id, name);
      }
      continue;
    }

    if (plainMembers.length >= 2) {
      const adjectiveAssignments = assignAdjectives(
        plainMembers,
        base,
        usedAdjectives
      );
      for (const member of members) {
        if (adjectiveAssignments.has(member.id)) {
          result.set(member.id, adjectiveAssignments.get(member.id)!);
        } else {
          result.set(member.id, member.name);
        }
      }
      continue;
    }

    if (plainMembers.length === 1 && adjectivedMembers.length >= 1) {
      for (const member of members) {
        result.set(member.id, member.name);
      }
      continue;
    }

    for (const member of members) {
      result.set(member.id, member.name);
    }
  }

  return result;
}

export function applyDisambiguationToPlayers(
  players: Player[],
  before?: Player[]
): Record<PlayerId, string> {
  const names = disambiguateNames(
    players.map((p) => ({ id: p.id, name: p.name })),
    before?.map((p) => ({ id: p.id, name: p.name }))
  );
  return Object.fromEntries(names);
}

export function renameWithDisambiguation(
  players: Player[],
  playerId: PlayerId,
  newName: string
): Record<PlayerId, string> {
  const trimmed = newName.trim();
  if (!trimmed) return Object.fromEntries(players.map((p) => [p.id, p.name]));

  const updated = players.map((p) =>
    p.id === playerId ? { ...p, name: trimmed } : p
  );
  return applyDisambiguationToPlayers(updated, players);
}

/** Disambiguate a name list on /new (no stable ids yet — use index strings). */
export function disambiguateNameList(names: string[]): string[] {
  const players = names.map((name, index) => ({
    id: String(index),
    name,
  }));
  const result = disambiguateNames(players, players);
  return names.map((_, index) => result.get(String(index)) ?? names[index]);
}

/** After editing one name on /new, re-run disambiguation with rename context. */
export function renameInNameList(
  names: string[],
  index: number,
  newName: string
): string[] {
  const trimmed = newName.trim();
  if (!trimmed) return names;

  const before = names.map((name, i) => ({ id: String(i), name }));
  const after = names.map((name, i) =>
    i === index ? trimmed : name
  );
  const players = after.map((name, i) => ({ id: String(i), name }));
  const result = disambiguateNames(players, before);
  return names.map((_, i) => result.get(String(i)) ?? after[i]);
}
