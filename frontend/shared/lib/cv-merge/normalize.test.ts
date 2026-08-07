import { afterAll, describe, expect, it } from "vitest";

import { buildMergePlan } from "./plan";
import { norm, normText, phoneKey, repairUrl } from "./normalize";
import type { CurrentCV, CurrentProfile } from "./types";

const profile: CurrentProfile = {
  fullName: "Budi Santoso",
  location: "",
  targetRole: "",
  experienceLevel: "",
};

const cvWith = (over: Partial<CurrentCV> = {}): CurrentCV => ({
  _id: "cv_1",
  title: "CV Utama",
  personalInfo: { fullName: "", email: "", phone: "", location: "", summary: "" },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  ...over,
});

describe("phoneKey", () => {
  // Indonesians write their number both ways on the same day. Without the
  // leading-0 → 62 rewrite every single import would open with a phantom
  // phone conflict.
  it("reads the local and international forms of one number as equal", () => {
    expect(phoneKey("0812-3456-7890")).toBe(phoneKey("+62 812 3456 7890"));
  });

  it("keeps that equality out of the conflict list", () => {
    const plan = buildMergePlan({
      profile: { ...profile, phone: "0812-3456-7890" },
      cv: cvWith(),
      parsed: { phone: "+62 812 3456 7890" },
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(plan.draft.profile).not.toHaveProperty("phone");
  });
});

describe("timezone independence", () => {
  const original = process.env.TZ;
  afterAll(() => {
    process.env.TZ = original;
  });

  // `ym()` is a string slice on purpose. An `asISODate`-style UTC round-trip
  // shifts the day either side of the date line, which changes the match key
  // and forks one job into two on the next import.
  it("produces an identical plan on both sides of the date line", () => {
    const build = () =>
      buildMergePlan({
        profile,
        cv: cvWith({
          experience: [
            {
              id: "exp_stored",
              company: "PT Tokopedia",
              position: "Senior Software Engineer",
              startDate: "2020-03-01",
              endDate: "2023-01",
              current: false,
              description: "Membangun layanan pembayaran.",
              achievements: [],
            },
          ],
        }),
        parsed: {
          experience: [
            { company: "PT. Tokopedia", position: "Sr. Software Engineer", startDate: "2020-03" },
          ],
        },
      });

    process.env.TZ = "Pacific/Kiritimati";
    const east = build();
    process.env.TZ = "Pacific/Niue";
    const west = build();

    expect(west).toEqual(east);
    expect(east.conflicts).toHaveLength(1);
  });
});

describe("repairUrl", () => {
  // The bare host+path form is what appears on virtually every real CV;
  // an `isHttpUrl` gate silently drops all of them.
  it("adds the scheme a CV never prints", () => {
    expect(repairUrl("linkedin.com/in/budi")).toBe("https://linkedin.com/in/budi");
    expect(repairUrl("https://budi.dev/portfolio")).toBe("https://budi.dev/portfolio");
  });

  it("returns empty for something that is not a link", () => {
    expect(repairUrl("not a url")).toBe("");
    expect(repairUrl("Jakarta, Indonesia")).toBe("");
  });
});

describe("control-character handling", () => {
  // quickFill's `asString` stripped `\n` with no replacement, gluing
  // "Senior Dev\nJakarta" into "Senior DevJakarta".
  it("never glues two lines into one word", () => {
    expect(norm("Senior Dev\nJakarta")).toBe("Senior Dev Jakarta");
  });

  it("keeps the line structure of free text", () => {
    expect(normText("Senior Dev\nJakarta")).toBe("Senior Dev\nJakarta");
    expect(normText("Baris satu\r\n\r\n\r\n\r\nBaris dua")).toBe("Baris satu\n\nBaris dua");
    expect(normText("Bersih\u0000kan")).toBe("Bersih kan");
  });
});
