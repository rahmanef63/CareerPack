import { describe, expect, it } from "vitest";
import { compareValues, nextSortState, sortRows } from "./comparators";
import type { ColumnDef } from "./types";

describe("compareValues", () => {
  it("sorts numbers ascending", () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
    expect(compareValues(2, 1)).toBeGreaterThan(0);
    expect(compareValues(2, 2)).toBe(0);
  });

  it("uses locale-aware string compare with numeric flag", () => {
    // Numeric flag ensures "item-2" sorts before "item-10".
    expect(compareValues("item-2", "item-10")).toBeLessThan(0);
  });

  it("places null last regardless of direction", () => {
    // Null > anything → falls to bottom in asc, the wrapping factor in
    // sortRows still leaves null last in desc because we don't apply
    // the factor inside compareValues.
    expect(compareValues(null, 5)).toBeGreaterThan(0);
    expect(compareValues(5, null)).toBeLessThan(0);
    expect(compareValues(null, null)).toBe(0);
  });

  it("compares Date objects by epoch ms", () => {
    const a = new Date("2024-01-01");
    const b = new Date("2024-06-01");
    expect(compareValues(a, b)).toBeLessThan(0);
    expect(compareValues(b, a)).toBeGreaterThan(0);
  });

  it("compares booleans true > false", () => {
    expect(compareValues(true, false)).toBeGreaterThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
    expect(compareValues(true, true)).toBe(0);
  });
});

describe("sortRows", () => {
  type Row = { name: string; age: number };
  const col: ColumnDef<Row> = {
    id: "age",
    header: "Age",
    accessor: (r) => r.age,
  };

  it("sorts ascending", () => {
    const rows: Row[] = [{ name: "B", age: 30 }, { name: "A", age: 20 }];
    const sorted = sortRows(rows, col, "asc");
    expect(sorted.map((r) => r.age)).toEqual([20, 30]);
  });

  it("sorts descending", () => {
    const rows: Row[] = [{ name: "A", age: 20 }, { name: "B", age: 30 }];
    const sorted = sortRows(rows, col, "desc");
    expect(sorted.map((r) => r.age)).toEqual([30, 20]);
  });

  it("is stable on ties", () => {
    const rows: Row[] = [
      { name: "first", age: 25 },
      { name: "second", age: 25 },
      { name: "third", age: 25 },
    ];
    const sorted = sortRows(rows, col, "asc");
    expect(sorted.map((r) => r.name)).toEqual(["first", "second", "third"]);
  });

  it("places null-accessor rows at the bottom even in desc", () => {
    type R2 = { name: string; score: number | null };
    const c: ColumnDef<R2> = {
      id: "score",
      header: "",
      accessor: (r) => r.score,
    };
    const rows: R2[] = [
      { name: "x", score: null },
      { name: "y", score: 10 },
      { name: "z", score: null },
    ];
    const desc = sortRows(rows, c, "desc");
    // y first (10), then nulls (z and x — but stability keeps original order).
    expect(desc[0].name).toBe("y");
  });
});

describe("nextSortState", () => {
  it("first click on column → asc", () => {
    expect(nextSortState(null, "name")).toEqual({
      columnId: "name",
      direction: "asc",
    });
  });

  it("click already-asc → desc", () => {
    expect(
      nextSortState({ columnId: "name", direction: "asc" }, "name"),
    ).toEqual({ columnId: "name", direction: "desc" });
  });

  it("click already-desc → null (clear)", () => {
    expect(
      nextSortState({ columnId: "name", direction: "desc" }, "name"),
    ).toBeNull();
  });

  it("clicking a different column resets to asc", () => {
    expect(
      nextSortState({ columnId: "name", direction: "desc" }, "age"),
    ).toEqual({ columnId: "age", direction: "asc" });
  });
});
