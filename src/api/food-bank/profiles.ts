export const EATER_PROFILES = [
  { id: "meat", kind: "exclude" },
  { id: "fish", kind: "exclude" },
  { id: "pork", kind: "exclude" },
  { id: "shellfish", kind: "exclude" },
  { id: "dairy", kind: "exclude" },
  { id: "gluten", kind: "exclude" },
  { id: "soda", kind: "exclude" },
  { id: "alcohol", kind: "exclude" },
  { id: "coffee", kind: "include" },
  { id: "baby", kind: "include" },
  { id: "cat", kind: "include" },
  { id: "dog", kind: "include" },
  { id: "baking", kind: "include" },
] as const;

export type ProfileId = (typeof EATER_PROFILES)[number]["id"];

const PROFILE_IDS = new Set<string>(EATER_PROFILES.map((profile) => profile.id));

export const cleanProfiles = (input: unknown): ProfileId[] =>
  Array.isArray(input)
    ? [...new Set(input.filter((id): id is ProfileId => typeof id === "string" && PROFILE_IDS.has(id)))]
    : [];
