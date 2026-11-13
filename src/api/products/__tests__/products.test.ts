import { afterEach, describe, expect, it, vi } from "vitest";
import { addBoughtDates, buyGapDays, isBarcode, packSize, productChanges, staleDaysFor, waitDaysFor } from "@/api/foods/helpers";
import { basicName, dietTags, productIcon, productQuantity } from "../helpers";
import lookupProduct from "../services/lookupProduct";

const nutella = {
  brands: "Ferrero, Nutella",
  categories_tags: ["en:breakfasts", "en:spreads", "en:hazelnut-spreads", "fr:Nutella"],
  categories_tags_fr: ["Petit-déjeuners", "Pâtes à tartiner", "Pâtes à tartiner aux noisettes", "en:Confectionary based spreads", "Nutella"],
  generic_name_fr: "Pâte à tartiner aux noisettes et au cacao",
  product_name: "Nutella",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("basicName", () => {
  it("prefers a food the catalogue already knows", () => {
    expect(basicName({ product_name: "Barilla Spaghetti n.5", categories_tags_en: ["Plant-based foods", "Pastas", "Spaghetti"] }, "en")).toBe("Pasta");
  });

  it("falls back to a short category, skipping brands and untranslated ones", () => {
    expect(basicName(nutella, "fr")).toBe("Pâtes à tartiner");
  });

  it("prefers a short, specific category over a long or a top-level one", () => {
    expect(
      basicName({ product_name: "Nutella", brands: "Nutella", categories_tags_en: ["Breakfasts", "Spreads", "Hazelnut spreads", "Confectionary based spreads"] }, "en"),
    ).toBe("Hazelnut spreads");
    expect(basicName({ product_name: "Coca", categories_tags_fr: ["Boissons", "Sodas", "Sodas au cola"] }, "fr")).toBe("Sodas");
  });

  it("uses the product name when nothing else is known", () => {
    expect(basicName({ product_name: "  mystery bar " }, "en")).toBe("Mystery bar");
    expect(basicName({}, "en")).toBeNull();
  });
});

describe("isBarcode", () => {
  it("accepts only 8 to 14 digits", () => {
    expect(isBarcode("3017620422003")).toBe(true);
    expect(isBarcode("12345")).toBe(false);
    expect(isBarcode("30176204x2003")).toBe(false);
  });
});

describe("lookupProduct", () => {
  it("asks the source once per barcode and language", async () => {
    vi.stubEnv("EMAIL_SUPPORT", "help@example.com");
    const fetchMock = vi.fn(async (..._args: unknown[]) => new Response(JSON.stringify({ product: nutella }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await lookupProduct("3017620422003", "fr")).toMatchObject({ name: "Pâtes à tartiner", tags: [] });
    expect((await lookupProduct("3017620422003", "fr"))?.name).toBe("Pâtes à tartiner");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toMatchObject([expect.any(String), { headers: { "User-Agent": "Kilist/1.0 (help@example.com)" } }]);
  });

  it("returns null for a product no database knows", async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await lookupProduct("00000000", "en")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("quietly falls back to the sister databases", async () => {
    const fetchMock = vi.fn(async (url: unknown) =>
      String(url).includes("openpetfoodfacts")
        ? new Response(JSON.stringify({ product: { product_name: "Cat kibble", quantity: "2 kg" } }), { status: 200 })
        : new Response("{}", { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await lookupProduct("22222222", "en")).toMatchObject({ name: "Cat kibble", quantity: "2 kg" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the source being down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));

    await expect(lookupProduct("11111111", "en")).rejects.toMatchObject({ status: 503, code: "product.unavailable" });
  });
});

describe("what a product tells us", () => {
  it("finds diet and allergen tags", () => {
    expect(dietTags({ allergens_tags: ["en:milk", "en:gluten"] }).sort()).toEqual(["dairy", "gluten"]);
    expect(dietTags({ categories_tags: ["en:meats", "en:hams"] }).sort()).toEqual(["meat", "pork"]);
    expect(dietTags({ ingredients_tags: ["en:wheat-flour", "en:beef"] })).toEqual(["meat"]);
    expect(dietTags({ categories_tags: ["en:beverages", "en:sodas"] })).toEqual(["soda"]);
    expect(dietTags(nutella)).toEqual([]);
  });

  it("picks an icon from the categories when the name has none", () => {
    expect(productIcon({ categories_tags: ["en:plant-based-foods", "en:pastas"] }, "en", "Barilla n.5")).toBe("pasta");
    expect(productIcon({}, "en", "Zzz")).toBeUndefined();
  });

  it("reads the pack size", () => {
    expect(productQuantity({ quantity: "6 x 33 cl" })).toBe("6 x 33 cl");
    expect(productQuantity({ product_quantity: "750", product_quantity_unit: "g" })).toBe("750 g");
    expect(packSize("6 x 33 cl")).toBe(1980);
    expect(packSize("1,5 L")).toBe(1500);
    expect(packSize("a box")).toBeNull();
    expect(staleDaysFor("2 kg")).toBe(10);
    expect(staleDaysFor("250 g")).toBe(7);
    expect(staleDaysFor(null)).toBe(7);
  });

  it("learns how long to wait from past purchases", () => {
    const now = Date.now();
    const daysAgo = (days: number) => new Date(now - days * 24 * 3600000).toISOString();
    expect(buyGapDays([daysAgo(16), daysAgo(10), daysAgo(4)])).toBe(6);
    expect(buyGapDays([daysAgo(100), daysAgo(12), daysAgo(6), daysAgo(0)])).toBe(6);
    expect(buyGapDays([daysAgo(10), daysAgo(4)])).toBeNull();
    expect(waitDaysFor({ quantity: null, boughtDates: [daysAgo(16), daysAgo(10), daysAgo(4)] })).toBe(3);
    expect(waitDaysFor({ quantity: null, boughtDates: [daysAgo(140), daysAgo(80), daysAgo(20)] })).toBe(30);
    expect(waitDaysFor({ quantity: null, boughtDates: [daysAgo(2), daysAgo(1), daysAgo(0)] })).toBe(2);
    expect(waitDaysFor({ quantity: "2 kg", boughtDates: [daysAgo(4)] })).toBe(10);
    expect(addBoughtDates([daysAgo(6)], [new Date(Date.parse(daysAgo(6)) + 3600000)])).toHaveLength(1);
    const many = addBoughtDates(null, Array.from({ length: 12 }, (_, index) => daysAgo(index)));
    expect(many).toHaveLength(8);
  });

  it("attaches a scanned product to a food", () => {
    expect(productChanges({ barcodes: null, quantity: null, icon: null }, { barcode: "3017620422003", quantity: " 750 g ", icon: "pasta" })).toEqual({
      barcodes: ["3017620422003"],
      quantity: "750 g",
      icon: "pasta",
    });
    expect(productChanges({ barcodes: ["3017620422003"], quantity: null, icon: "rice" }, { barcode: "3017620422003", icon: "nope" })).toEqual({});
    expect(productChanges({ barcodes: null, quantity: null, icon: null }, { barcode: "abc" })).toEqual({});
  });
});
