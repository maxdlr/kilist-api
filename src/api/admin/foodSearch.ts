import Fuse from "fuse.js";

const FILLERS = new Set(["with", "and", "of", "the", "a", "avec", "et", "de", "du", "des", "la", "le", "les", "l", "d", "au", "aux", "en"]);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

export const compact = (text: string) => words(text).filter((word) => !FILLERS.has(word)).join("");

export const rankByName = <T extends { id: number; name: string }>(items: T[], search: string): T[] => {
  const query = compact(search);
  if (!query) return items;

  const scored = new Map<number, number>();
  const entries = items.map((item) => ({ item, key: compact(item.name) }));
  for (const { item, key } of entries) {
    if (key === query) scored.set(item.id, 0);
    else if (key.startsWith(query)) scored.set(item.id, 0.05);
    else if (key.includes(query)) scored.set(item.id, 0.1);
  }

  if (query.length >= 3) {
    const fuse = new Fuse(entries, { keys: ["key"], includeScore: true, threshold: 0.34, ignoreLocation: true });
    for (const result of fuse.search(query)) {
      const key = result.item.key;
      if (Math.min(key.length, query.length) / Math.max(key.length, query.length) < 0.75) continue;
      const id = result.item.item.id;
      const score = 0.2 + (result.score ?? 0);
      if (!scored.has(id) || scored.get(id)! > score) scored.set(id, score);
    }
  }

  return items
    .filter((item) => scored.has(item.id))
    .sort((a, b) => scored.get(a.id)! - scored.get(b.id)! || a.name.localeCompare(b.name));
};
