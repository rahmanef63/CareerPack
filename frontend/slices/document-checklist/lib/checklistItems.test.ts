import { describe, it, expect } from "vitest";
import {
  indonesianDocumentChecklist,
  indonesianCategoryLabels,
} from "@/shared/data/indonesianData";
import { DOCUMENT_SEED_BY_COUNTRY } from "../../../../convex/_seeds/documents";
import {
  buildChecklistItems,
  needsBaselineSeed,
  type ServerChecklistDoc,
} from "./checklistItems";

const imported: ServerChecklistDoc = {
  id: "jp-jlpt-n4",
  name: "JLPT N4 (atau setara)",
  description: "Sertifikat kemampuan bahasa Jepang minimum N4.",
  category: "international",
  subcategory: "language",
  required: true,
  completed: false,
  notes: "",
};

describe("buildChecklistItems", () => {
  it("renders imported country documents alongside the static baseline", () => {
    const items = buildChecklistItems([imported], {});
    expect(items).toHaveLength(indonesianDocumentChecklist.length + 1);

    const jp = items.find((i) => i.id === "jp-jlpt-n4");
    expect(jp).toMatchObject({
      title: "JLPT N4 (atau setara)",
      category: "international",
      subcategory: "language",
    });
    expect(jp!.description).toBeTruthy();
  });

  it("does not duplicate a server document that is already in the baseline", () => {
    const items = buildChecklistItems(
      [{ ...imported, id: "doc-1", name: "KTP", category: "local", subcategory: "identity" }],
      {},
    );
    expect(items).toHaveLength(indonesianDocumentChecklist.length);
    expect(items.filter((i) => i.id === "doc-1")).toHaveLength(1);
  });

  it("applies the overlay to baseline and imported documents alike", () => {
    const items = buildChecklistItems([imported], {
      "doc-1": { completed: true, notes: "beres" },
      "jp-jlpt-n4": { completed: true, expiryDate: "2027-01-01" },
    });
    expect(items.find((i) => i.id === "doc-1")).toMatchObject({
      completed: true,
      notes: "beres",
    });
    expect(items.find((i) => i.id === "jp-jlpt-n4")).toMatchObject({
      completed: true,
      dueDate: "2027-01-01",
    });
  });

  it("puts every item on one of the two tab axes", () => {
    const items = buildChecklistItems([{ ...imported, category: "language" }], {});
    for (const i of items) {
      expect(["local", "international"]).toContain(i.category);
    }
  });
});

describe("needsBaselineSeed", () => {
  it("is true for an empty checklist and for one an old import wiped", () => {
    expect(needsBaselineSeed([])).toBe(true);
    expect(needsBaselineSeed([imported])).toBe(true);
  });

  it("is false once the baseline is present", () => {
    const full = indonesianDocumentChecklist.map((d) => ({
      id: d.id,
      name: d.title,
      category: d.category,
      subcategory: d.subcategory,
      required: d.required,
      completed: false,
      notes: "",
    }));
    expect(needsBaselineSeed(full)).toBe(false);
  });
});

describe("category label coverage", () => {
  it("labels every category the country templates can produce", () => {
    const missing = new Set<string>();
    for (const country of DOCUMENT_SEED_BY_COUNTRY) {
      for (const doc of country.documents) {
        const key = doc.subcategory ?? doc.category;
        if (!indonesianCategoryLabels[key]) missing.add(key);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
