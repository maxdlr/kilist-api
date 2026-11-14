export const AISLES = [
  { id: "produce", names: { en: "Fruit & vegetables", fr: "Fruits et légumes" } },
  { id: "bakery", names: { en: "Bakery", fr: "Boulangerie" } },
  { id: "meat", names: { en: "Meat & deli", fr: "Boucherie et charcuterie" } },
  { id: "fish", names: { en: "Fish & seafood", fr: "Poissonnerie" } },
  { id: "dairy", names: { en: "Dairy & eggs", fr: "Crèmerie et œufs" } },
  { id: "meals", names: { en: "Ready meals", fr: "Plats préparés" } },
  { id: "frozen", names: { en: "Frozen", fr: "Surgelés" } },
  { id: "pantry", names: { en: "Pantry", fr: "Épicerie salée" } },
  { id: "sweet", names: { en: "Baking & sweets", fr: "Épicerie sucrée" } },
  { id: "drinks", names: { en: "Drinks", fr: "Boissons" } },
  { id: "baby", names: { en: "Baby", fr: "Bébé" } },
  { id: "pets", names: { en: "Pets", fr: "Animaux" } },
  { id: "household", names: { en: "Home & hygiene", fr: "Maison et hygiène" } },
] as const;

export type AisleId = (typeof AISLES)[number]["id"];

const AISLE_IDS = new Set<string>(AISLES.map((aisle) => aisle.id));

export const cleanAisle = (input: unknown): AisleId | null =>
  typeof input === "string" && AISLE_IDS.has(input) ? (input as AisleId) : null;
