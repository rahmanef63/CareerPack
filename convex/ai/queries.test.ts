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
// an explicit same-dir glob remapped to the `../ai/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../ai/"),
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

// @convex-dev/auth's getAuthUserId reads `identity.subject` and splits on "|".
const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

async function insertUser(t: Tester, email: string): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", { email }));
}

describe("upsertChatSession denormalizes list metadata", () => {
  it("writes messageCount + lastMessagePreview (<=160 chars) on insert", async () => {
    const t = setup();
    const userId = await insertUser(t, "denorm@x.com");
    const now = Date.now();

    const id = await t
      .withIdentity(identity(userId))
      .mutation(api.ai.mutations.upsertChatSession, {
        sessionId: "s1",
        title: "Sesi",
        createdAt: now,
        updatedAt: now,
        messages: [
          { id: "m1", role: "user", content: "halo", timestamp: now },
          { id: "m2", role: "assistant", content: "x".repeat(300), timestamp: now + 1 },
        ],
      });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.messageCount).toBe(2);
    // Preview is the LAST message, capped at 160 chars.
    expect(stored?.lastMessagePreview).toBe("x".repeat(160));
    expect(stored?.lastMessagePreview?.length).toBe(160);
  });

  it("refreshes the denormalized fields on a subsequent upsert", async () => {
    const t = setup();
    const userId = await insertUser(t, "refresh@x.com");
    const now = Date.now();
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.ai.mutations.upsertChatSession, {
      sessionId: "s1",
      title: "Sesi",
      createdAt: now,
      updatedAt: now,
      messages: [{ id: "m1", role: "user", content: "satu", timestamp: now }],
    });
    const id = await as.mutation(api.ai.mutations.upsertChatSession, {
      sessionId: "s1",
      title: "Sesi",
      createdAt: now,
      updatedAt: now + 10,
      messages: [
        { id: "m1", role: "user", content: "satu", timestamp: now },
        { id: "m2", role: "assistant", content: "dua", timestamp: now + 5 },
        { id: "m3", role: "user", content: "tiga terakhir", timestamp: now + 9 },
      ],
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.messageCount).toBe(3);
    expect(stored?.lastMessagePreview).toBe("tiga terakhir");
  });
});

describe("listChatSessions returns metadata-only shape", () => {
  it("returns id/title/timestamps/messageCount/lastMessagePreview WITHOUT messages[]", async () => {
    const t = setup();
    const userId = await insertUser(t, "list@x.com");
    const now = Date.now();

    await t.withIdentity(identity(userId)).mutation(api.ai.mutations.upsertChatSession, {
      sessionId: "s1",
      title: "Judul",
      createdAt: now,
      updatedAt: now,
      messages: [
        { id: "m1", role: "user", content: "halo", timestamp: now },
        { id: "m2", role: "assistant", content: "balasan terakhir", timestamp: now + 1 },
      ],
    });

    const list = await t
      .withIdentity(identity(userId))
      .query(api.ai.queries.listChatSessions, {});

    expect(list).toHaveLength(1);
    const row = list[0];
    expect(row.sessionId).toBe("s1");
    expect(row.title).toBe("Judul");
    expect(row.messageCount).toBe(2);
    expect(row.lastMessagePreview).toBe("balasan terakhir");
    // The heavy `messages` array must NOT be part of the list payload.
    expect("messages" in row).toBe(false);
    // The legacy `preview` field name is gone.
    expect("preview" in row).toBe(false);
  });

  it("falls back to 0 / empty for legacy rows lacking the denormalized fields", async () => {
    const t = setup();
    const userId = await insertUser(t, "legacy@x.com");
    const now = Date.now();

    // Simulate a row written before denormalization: insert directly without
    // messageCount / lastMessagePreview.
    await t.run((ctx) =>
      ctx.db.insert("chatConversations", {
        userId,
        sessionId: "legacy",
        title: "Lama",
        messages: [{ id: "m1", role: "user", content: "halo", timestamp: now }],
        createdAt: now,
        updatedAt: now,
      }),
    );

    const list = await t
      .withIdentity(identity(userId))
      .query(api.ai.queries.listChatSessions, {});

    expect(list).toHaveLength(1);
    expect(list[0].messageCount).toBe(0);
    expect(list[0].lastMessagePreview).toBe("");
  });

  it("returns an empty array for unauthenticated callers", async () => {
    const t = setup();
    await expect(
      t.query(api.ai.queries.listChatSessions, {}),
    ).resolves.toEqual([]);
  });
});

describe("getChatSession still returns the full transcript", () => {
  it("includes the messages array for the active session", async () => {
    const t = setup();
    const userId = await insertUser(t, "active@x.com");
    const now = Date.now();
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.ai.mutations.upsertChatSession, {
      sessionId: "s1",
      title: "Aktif",
      createdAt: now,
      updatedAt: now,
      messages: [
        { id: "m1", role: "user", content: "halo", timestamp: now },
        { id: "m2", role: "assistant", content: "hai", timestamp: now + 1 },
      ],
    });

    const session = await as.query(api.ai.queries.getChatSession, {
      sessionId: "s1",
    });
    expect(session?.messages).toHaveLength(2);
    expect(session?.messages[0].content).toBe("halo");
  });
});
