import { describe, it, expect } from "vitest";
import { DEMO_CHECKLIST_PROGRESS } from "./demoUser";
import { indonesianDocumentChecklist } from "./indonesianData";

describe("DEMO_CHECKLIST_PROGRESS", () => {
  // The overlay is keyed by document id. Slugs that match nothing show a guest
  // a 0% checklist with no error anywhere — which is how this drifted unnoticed.
  it("only references ids that exist in the checklist", () => {
    const known = new Set(indonesianDocumentChecklist.map((d) => d.id));
    const unknown = DEMO_CHECKLIST_PROGRESS.map((e) => e.id).filter(
      (id) => !known.has(id),
    );
    expect(unknown).toEqual([]);
  });

  it("gives the guest walkthrough some completed items to show", () => {
    expect(DEMO_CHECKLIST_PROGRESS.some((e) => e.completed)).toBe(true);
  });
});
