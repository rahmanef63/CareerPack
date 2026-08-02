import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test module graph: recursive glob misses this test's own dir, so add
// an explicit same-dir glob remapped to the `../applications/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../applications/"),
    mod,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...recursive, ...sameDir }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

function setup(): Tester {
  return convexTest(schema, modules);
}

async function insertUser(t: Tester): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", { email: "app@x.com" }));
}

const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

const CTRL = String.fromCharCode(7);

function validAppArgs() {
  return {
    company: "Acme Corp",
    position: "Backend Engineer",
    location: "Remote",
    source: "LinkedIn",
    salary: "Rp 20jt",
    notes: "Lamar lewat referral.",
  };
}

describe("createApplication input caps", () => {
  it("accepts a normal payload and stores trimmed values", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    const id = await asUser.mutation(api.applications.mutations.createApplication, {
      ...validAppArgs(),
      company: "  Acme Corp  ",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.company).toBe("Acme Corp");
    expect(stored?.notes).toBe("Lamar lewat referral.");
  });

  it("rejects an over-long company (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        company: "a".repeat(121),
      }),
    ).rejects.toThrow("Perusahaan maksimal 120 karakter");
  });

  it("rejects an over-long position (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        position: "a".repeat(121),
      }),
    ).rejects.toThrow("Posisi maksimal 120 karakter");
  });

  it("rejects an over-long location (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        location: "a".repeat(121),
      }),
    ).rejects.toThrow("Lokasi maksimal 120 karakter");
  });

  it("rejects an over-long source (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        source: "a".repeat(121),
      }),
    ).rejects.toThrow("Sumber maksimal 120 karakter");
  });

  it("rejects an over-long salary (>60)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        salary: "a".repeat(61),
      }),
    ).rejects.toThrow("Gaji maksimal 60 karakter");
  });

  it("rejects over-long notes (>600)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        notes: "a".repeat(601),
      }),
    ).rejects.toThrow("Catatan maksimal 600 karakter");
  });

  it("rejects a control character in company", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.applications.mutations.createApplication, {
        ...validAppArgs(),
        company: `Acme${CTRL}Corp`,
      }),
    ).rejects.toThrow("Perusahaan mengandung karakter tidak valid");
  });
});

async function seedApp(
  t: Tester,
  userId: Id<"users">,
): Promise<Id<"jobApplications">> {
  const asUser = t.withIdentity(identity(userId));
  return asUser.mutation(
    api.applications.mutations.createApplication,
    validAppArgs(),
  );
}

describe("updateApplicationStatus caps", () => {
  it("accepts a whitelisted status and caps notes", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await asUser.mutation(api.applications.mutations.updateApplicationStatus, {
      applicationId: id,
      status: "interview",
      notes: "  Jadwal minggu depan  ",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.status).toBe("interview");
    expect(stored?.notes).toBe("Jadwal minggu depan");
  });

  it("rejects a status outside the whitelist", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await expect(
      asUser.mutation(api.applications.mutations.updateApplicationStatus, {
        applicationId: id,
        status: "bogus",
      }),
    ).rejects.toThrow("Status tidak valid");
  });

  it("rejects over-long notes (>600)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await expect(
      asUser.mutation(api.applications.mutations.updateApplicationStatus, {
        applicationId: id,
        status: "applied",
        notes: "a".repeat(601),
      }),
    ).rejects.toThrow("Catatan maksimal 600 karakter");
  });
});

describe("addInterviewDate caps", () => {
  it("appends a trimmed interview entry", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await asUser.mutation(api.applications.mutations.addInterviewDate, {
      applicationId: id,
      type: "  HR Screening  ",
      date: 1_700_000_000_000,
      notes: "Via Zoom",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.interviewDates).toHaveLength(1);
    expect(stored?.interviewDates[0].type).toBe("HR Screening");
    expect(stored?.interviewDates[0].notes).toBe("Via Zoom");
  });

  it("rejects an over-long interview type (>60)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await expect(
      asUser.mutation(api.applications.mutations.addInterviewDate, {
        applicationId: id,
        type: "a".repeat(61),
        date: 1_700_000_000_000,
      }),
    ).rejects.toThrow("Jenis wawancara maksimal 60 karakter");
  });

  it("rejects a non-finite date", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const id = await seedApp(t, userId);

    await expect(
      asUser.mutation(api.applications.mutations.addInterviewDate, {
        applicationId: id,
        type: "Technical",
        date: Number.POSITIVE_INFINITY,
      }),
    ).rejects.toThrow("Tanggal wawancara tidak valid");
  });
});
