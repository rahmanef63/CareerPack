import { describe, it, expect } from "vitest";
import { validatePlan } from "./lib";

describe("validatePlan", () => {
  it("rejects empty input", () => {
    expect(validatePlan({})).toBeNull();
  });

  it("rejects when no valid actions are present", () => {
    const r = validatePlan({
      title: "Test",
      etaMonths: 12,
      actions: [],
    });
    expect(r).toBeNull();
  });

  it("drops actions with unknown types", () => {
    const r = validatePlan({
      title: "Test Quest",
      etaMonths: 12,
      actions: [
        { type: "exec_shell", label: "rm -rf /" },
        { type: "study_skill", label: "Learn TypeScript" },
      ],
    });
    expect(r).not.toBeNull();
    expect(r!.actions).toHaveLength(1);
    expect(r!.actions[0].type).toBe("study_skill");
  });

  it("clamps etaMonths to [1, 60]", () => {
    const r1 = validatePlan({
      title: "T",
      etaMonths: 999,
      actions: [{ type: "study_skill", label: "X" }],
    });
    expect(r1!.etaMonths).toBe(60);

    const r2 = validatePlan({
      title: "T",
      etaMonths: -5,
      actions: [{ type: "study_skill", label: "X" }],
    });
    expect(r2!.etaMonths).toBe(1);
  });

  it("caps action count at 12", () => {
    const actions = Array.from({ length: 25 }, (_, i) => ({
      type: "study_skill" as const,
      label: `Skill ${i}`,
    }));
    const r = validatePlan({ title: "T", etaMonths: 12, actions });
    expect(r!.actions.length).toBe(12);
  });

  it("strips actions with empty labels", () => {
    const r = validatePlan({
      title: "T",
      etaMonths: 12,
      actions: [
        { type: "study_skill", label: "   " },
        { type: "study_skill", label: "Valid" },
      ],
    });
    expect(r!.actions).toHaveLength(1);
    expect(r!.actions[0].label).toBe("Valid");
  });

  it("falls back etaMonths to 12 when missing/invalid", () => {
    const r = validatePlan({
      title: "T",
      actions: [{ type: "study_skill", label: "X" }],
    });
    expect(r!.etaMonths).toBe(12);
  });
});
