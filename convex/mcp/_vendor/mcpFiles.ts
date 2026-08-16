/* GENERATED — do not edit here.
 *
 * @rahmanef/mcp-files@0.1.0, bundled to a single module.
 * source:   github.com/rahmanef63/connectors/packages/mcp-files
 * checksum: e804b6ab73d7
 *
 * Fix bugs upstream and re-run `npm run bundle:single` there.
 * Replace this file with the npm dependency once it is published. */

/* One error shape for every connector, machine-actionable and safe to show.
 *
 * The rule this enforces: what reaches the model is a sentence plus a code it
 * can branch on. What never reaches the model is a stack, a query, a host name,
 * a token, or a signed URL. */

export type ConnectorErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "insufficient_scope"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "url_rejected"
  | "upstream_unavailable"
  | "timeout"
  | "rate_limited"
  | "internal";

/** Codes where retrying the same call unchanged could plausibly succeed. */
const RECOVERABLE: ReadonlySet<ConnectorErrorCode> = new Set([
  "upstream_unavailable",
  "timeout",
  "rate_limited",
]);

export interface FieldError {
  field: string;
  message: string;
}

export class ConnectorError extends Error {
  readonly code: ConnectorErrorCode;
  readonly recoverable: boolean;
  readonly fields?: FieldError[];
  readonly correlationId?: string;
  /** Operator-only. Never serialised toward a client. */
  readonly internal?: unknown;

  constructor(
    code: ConnectorErrorCode,
    message: string,
    opts: { fields?: FieldError[]; correlationId?: string; internal?: unknown } = {},
  ) {
    super(message);
    this.name = "ConnectorError";
    this.code = code;
    this.recoverable = RECOVERABLE.has(code);
    this.fields = opts.fields;
    this.correlationId = opts.correlationId;
    this.internal = opts.internal;
  }

  /** The only shape that may cross the wire. `internal` is dropped here, which
   *  is the entire point of it living on a separate property. */
  toPublic(): {
    code: ConnectorErrorCode;
    message: string;
    recoverable: boolean;
    fields?: FieldError[];
    correlation_id?: string;
  } {
    return {
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      ...(this.fields ? { fields: this.fields } : {}),
      ...(this.correlationId ? { correlation_id: this.correlationId } : {}),
    };
  }
}

/**
 * Reduce anything thrown to a public error.
 *
 * Unknown throwables become a flat `internal` with a fixed message: a raw
 * `error.message` is exactly where a driver leaks a connection string or a
 * runtime leaks a file path. Convex, for instance, decorates a thrown Error as
 * `Uncaught Error: <msg>\n    at handler (../convex/x.ts:87:13)`.
 */
export function toConnectorError(e: unknown, correlationId?: string): ConnectorError {
  if (e instanceof ConnectorError) {
    return e.correlationId || !correlationId
      ? e
      : new ConnectorError(e.code, e.message, { fields: e.fields, correlationId, internal: e.internal });
  }
  return new ConnectorError("internal", "The operation failed. Nothing was changed.", {
    correlationId,
    internal: e,
  });
}

/** Non-cryptographic; it correlates a log line with a user report, nothing more. */
export const newCorrelationId = (): string =>
  `c_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

/* The safe-fetch policy for pulling bytes from a caller-supplied URL.
 *
 * A tool that accepts a file turns your backend into something that makes
 * outbound requests on behalf of whoever holds a token. This module exists so
 * that is an explicit, bounded policy rather than an accidental general-purpose
 * URL fetcher. */

/** Reasons a URL is refused. Stable strings — consumers may branch on them. */
export type UrlRejection =
  | "not-a-url"
  | "scheme-not-https"
  | "private-address"
  | "credentials-in-url"
  | "port-not-allowed";

export interface FetchPolicy {
  /** Accepted content types, lower-case, no parameters. */
  allowedMimeTypes: readonly string[];
  /** Hard ceiling on the decoded body, in bytes. */
  maxBytes: number;
  /** Whole-request budget, milliseconds. */
  timeoutMs: number;
  /** Redirect hops to follow. Each hop is re-validated. 0 refuses redirects. */
  maxRedirects: number;
  /** Non-default ports to permit. 443 is always allowed. */
  allowedPorts: readonly number[];
}

/** Images a portfolio or CMS would accept. SVG is deliberately absent: it is a
 *  document that can carry script, and nothing downstream renders it safely by
 *  default. Add it consciously or not at all. */
export const imagePolicy: FetchPolicy = {
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
  maxBytes: 10 * 1024 * 1024,
  timeoutMs: 15_000,
  maxRedirects: 3,
  allowedPorts: [],
};

export const documentPolicy: FetchPolicy = {
  ...imagePolicy,
  allowedMimeTypes: [...imagePolicy.allowedMimeTypes, "application/pdf"],
  maxBytes: 25 * 1024 * 1024,
};

const PRIVATE_V4 =
  /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

/**
 * Hostname-level guard.
 *
 * KNOWN LIMIT, and the reason this is not the last line of defence: no DNS
 * resolution happens here, so a public name that resolves to a private address
 * still passes, and a name validated now can resolve differently at connect
 * time (DNS rebinding). Closing that needs an egress allowlist or a resolving
 * HTTP agent at the network layer, not more regex. Documented rather than
 * implied, so nobody mistakes this for complete.
 */
export function checkUrl(raw: string, policy: FetchPolicy): { ok: true; url: URL } | { ok: false; reason: UrlRejection } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "not-a-url" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "scheme-not-https" };
  // user:pass@host is a classic way to make a hostile host look familiar
  if (url.username || url.password) return { ok: false, reason: "credentials-in-url" };
  if (url.port && url.port !== "443" && !policy.allowedPorts.includes(Number(url.port))) {
    return { ok: false, reason: "port-not-allowed" };
  }

  const h = url.hostname.toLowerCase();
  const bracketless = h.startsWith("[") && h.endsWith("]") ? h.slice(1, -1) : h;
  const isPrivate =
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal" ||
    PRIVATE_V4.test(h) ||
    bracketless === "::1" ||
    bracketless.startsWith("fd") ||
    bracketless.startsWith("fc") ||
    bracketless.startsWith("fe80");
  if (isPrivate) return { ok: false, reason: "private-address" };

  return { ok: true, url };
}

/* ── content sniffing ─────────────────────────────────────────────────────
   The declared content-type and the file name both come from the caller and
   neither is evidence. These signatures are. A body whose bytes disagree with
   its header is refused rather than trusted in either direction. */

const startsWith = (b: Uint8Array, sig: readonly number[], offset = 0): boolean =>
  sig.every((v, i) => b[offset + i] === v);

const ascii = (b: Uint8Array, offset: number, s: string): boolean =>
  [...s].every((c, i) => b[offset + i] === c.charCodeAt(0));

/** The true media type of a body, or null when unrecognised. */
export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii(bytes, 0, "GIF8")) return "image/gif";
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return "image/webp";
  if (ascii(bytes, 4, "ftyp") && (ascii(bytes, 8, "avif") || ascii(bytes, 8, "avis"))) return "image/avif";
  if (ascii(bytes, 0, "%PDF")) return "application/pdf";
  return null;
}

/** Strip parameters and normalise: `image/PNG; charset=x` -> `image/png`. */
export const normalizeMime = (raw: string | null | undefined): string =>
  (raw ?? "").split(";")[0]!.trim().toLowerCase();

/** A file name safe to store and to put in a URL. Never reuse the caller's. */
export function safeFileName(declared: string | undefined, mime: string, fallback = "file"): string {
  const ext =
    { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "application/pdf": "pdf" }[
      mime
    ] ?? "bin";
  const base = (declared ?? "").split(/[\\/]/).pop() ?? "";
  const stem = base.replace(/\.[A-Za-z0-9]+$/, "");
  const safe = stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${safe || fallback}.${ext}`;
}

/* The OpenAI file-input contract, as a reusable schema builder.
 *
 * Consumers must never hand-write this shape. ChatGPT's Scan Tools step and
 * plugin submission reject a file schema that omits any of the four
 * properties, does not require exactly `download_url` and `file_id`, or marks
 * an optional property as required — and nothing fails locally when it drifts,
 * so the tool just silently stops being offered a file.
 *
 * Source: developers.openai.com/plugins/reference (Files), checked 2026-08-14.
 */

/** What ChatGPT actually sends. `mime_type` and `file_name` are declared in the
 *  schema but may be absent at runtime, so both are optional here too. */
export interface OpenAIFile {
  download_url: string;
  file_id: string;
  mime_type?: string;
  file_name?: string;
}

/** A JSON Schema fragment. Deliberately loose — consumers merge these into
 *  whatever their own tool definition looks like. */
export type JsonSchema = Record<string, unknown>;

const FILE_OBJECT: JsonSchema = {
  type: "object",
  // The object itself is described, not only its members. A model reading the
  // schema sees this line first, and without it the only clue that the HOST
  // supplies this value — rather than the model inventing a URL or passing a
  // CareerPack file_id — is buried in two sub-property descriptions.
  description:
    "A file the HOST is holding for the user (an upload in the conversation, or an image you generated). The host fills this in; do not construct it yourself and do not pass an id from files_list here.",
  properties: {
    download_url: { type: "string", description: "Temporary URL the server fetches the bytes from." },
    file_id: { type: "string", description: "Host-side identifier for the file." },
    mime_type: { type: "string", description: "Declared content type. Advisory only." },
    file_name: { type: "string", description: "Declared file name. Advisory only." },
  },
  required: ["download_url", "file_id"],
  additionalProperties: false,
};

/* A JSON round-trip rather than structuredClone: the latter is absent from
   some MCP host runtimes, Convex's V8 isolate among them, and a schema literal
   holds nothing a JSON clone cannot carry. */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* Inlined on purpose, never `$defs` + `$ref`.
 *
 * The published OpenAI example uses `$defs`. That form is equivalent JSON
 * Schema, but Convex refuses to encode ANY key beginning with `$` — returning
 * such a descriptor throws `Field name $defs starts with a '$', which is
 * reserved` and takes down the whole of `tools/list`, not just the tool with
 * the file input. Inlining costs nothing and works on every backend. */
export const openAIFileSchema = (): JsonSchema => clone(FILE_OBJECT);

/** An array of files, for tools that accept several at once. */
export const openAIFileArraySchema = (opts: { minItems?: number; maxItems?: number } = {}): JsonSchema => ({
  type: "array",
  items: clone(FILE_OBJECT),
  ...(opts.minItems === undefined ? {} : { minItems: opts.minItems }),
  ...(opts.maxItems === undefined ? {} : { maxItems: opts.maxItems }),
});

/** The `_meta` block naming which top-level fields carry files. Merge into the
 *  tool descriptor. Inert to every non-OpenAI host, which is why one tool can
 *  serve them all — Claude Code and Cursor just see an object with a
 *  `download_url` and can put any public URL in it. */
export const fileParamsMeta = (fields: readonly string[]): { "openai/fileParams": string[] } => {
  if (fields.length === 0) throw new Error("fileParamsMeta: name at least one field");
  return { "openai/fileParams": [...fields] };
};

/** Structural check that a schema conforms to the file contract. Exported so
 *  consumers can assert it in their own contract tests without re-deriving the
 *  rules — see `assertFileParamsConformant` for the whole-descriptor version. */
export function isConformantFileObject(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") return false;
  const s = schema as { type?: unknown; properties?: Record<string, unknown>; required?: unknown };
  if (s.type !== "object" || !s.properties) return false;
  const props = Object.keys(s.properties).sort();
  if (props.join(",") !== "download_url,file_id,file_name,mime_type") return false;
  if (!Array.isArray(s.required)) return false;
  return [...s.required].sort().join(",") === "download_url,file_id";
}

/** Validate a whole tool descriptor: every field named in
 *  `_meta["openai/fileParams"]` must exist and be a conformant file object, or
 *  an array whose `items` is one. Throws with the offending path. */
export function assertFileParamsConformant(tool: {
  name?: string;
  inputSchema?: unknown;
  _meta?: Record<string, unknown>;
}): void {
  const fields = tool._meta?.["openai/fileParams"];
  if (!fields) return;
  const label = tool.name ?? "<unnamed tool>";
  if (!Array.isArray(fields)) throw new Error(`${label}: openai/fileParams must be an array`);

  const schema = tool.inputSchema as { properties?: Record<string, unknown> } | undefined;
  const props = schema?.properties;
  if (!props) throw new Error(`${label}: declares fileParams but has no inputSchema.properties`);

  for (const field of fields) {
    const node = props[field as string] as { type?: unknown; items?: unknown } | undefined;
    if (!node) throw new Error(`${label}.${field}: named in fileParams but absent from properties`);
    const target = node.type === "array" ? node.items : node;
    if (!isConformantFileObject(target)) {
      throw new Error(
        `${label}.${field}: not a conformant file object — declare exactly ` +
          `download_url, file_id, mime_type, file_name and require only the first two`,
      );
    }
  }

  // A `$`-prefixed key anywhere is fatal on Convex; catch it here rather than
  // at the first client call.
  const walk = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${i}]`));
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) throw new Error(`${label}: ${path}.${k} — keys starting with "$" break Convex encoding`);
      walk(v, `${path}.${k}`);
    }
  };
  walk(tool.inputSchema, "inputSchema");
}

/* Turn an OpenAIFile reference into verified bytes.
 *
 * Order matters and is not negotiable: the CALLER IS AUTHORIZED BEFORE THIS
 * FUNCTION IS CALLED. Nothing here checks permissions, because by the time a
 * URL is being fetched it is already too late — an unauthenticated caller must
 * never be able to make the backend emit an outbound request at all. Consumers
 * enforce that; this module refuses to be the place it is remembered. */



/** Bytes plus the metadata we actually verified. Note what is NOT here: the
 *  download URL. It is short-lived and host-owned, so persisting it produces a
 *  column full of dead links and a needless secret at rest. */
export interface NormalizedIncomingFile {
  bytes: Uint8Array;
  /** Sniffed from content, not copied from the header. */
  mimeType: string;
  /** Re-derived server-side; never the caller's string. */
  fileName: string;
  sizeBytes: number;
  /** The host's opaque id, safe to keep for provenance. */
  sourceFileId: string;
}

const REJECTION_MESSAGE: Record<UrlRejection, string> = {
  "not-a-url": "The file location is not a valid URL.",
  "scheme-not-https": "Only https file locations are accepted.",
  "private-address": "That file location points at a private network address.",
  "credentials-in-url": "File locations must not embed credentials.",
  "port-not-allowed": "That file location uses a port this server does not fetch from.",
};

export interface IngestOptions {
  policy: FetchPolicy;
  correlationId?: string;
  /** Injectable for tests and for runtimes with a non-global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Fetch and verify. Throws {@link ConnectorError} and nothing else.
 *
 * Redirects are followed MANUALLY and every hop is re-validated. Handing
 * `redirect: "follow"` to fetch would let an allowed host bounce the request
 * to `169.254.169.254`, which is the whole attack.
 */
export async function ingestOpenAIFile(file: OpenAIFile, opts: IngestOptions): Promise<NormalizedIncomingFile> {
  const { policy, correlationId } = opts;
  const doFetch = opts.fetchImpl ?? globalThis.fetch;
  if (!file?.download_url || !file?.file_id) {
    throw new ConnectorError("invalid_input", "The file is missing download_url or file_id.", { correlationId });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
  try {
    let target = file.download_url;
    let res: Response | undefined;

    for (let hop = 0; ; hop++) {
      const checked = checkUrl(target, policy);
      if (!checked.ok) {
        throw new ConnectorError("url_rejected", REJECTION_MESSAGE[checked.reason], { correlationId });
      }
      res = await doFetch(checked.url.toString(), { redirect: "manual", signal: controller.signal });

      if (res.status >= 300 && res.status < 400) {
        if (hop >= policy.maxRedirects) {
          throw new ConnectorError("url_rejected", "The file location redirected too many times.", { correlationId });
        }
        const loc = res.headers.get("location");
        if (!loc) throw new ConnectorError("upstream_unavailable", "The file location redirected without a target.", { correlationId });
        target = new URL(loc, checked.url).toString(); // resolve relative, then re-validate at the top
        continue;
      }
      break;
    }

    if (!res!.ok) {
      // 4xx here is usually an expired temporary URL, which the user can fix by
      // re-attaching. Say that rather than echoing an upstream status.
      throw new ConnectorError(
        res!.status >= 500 ? "upstream_unavailable" : "url_rejected",
        res!.status === 404 || res!.status === 403
          ? "The file could not be downloaded — its temporary link may have expired. Attach it again."
          : `The file could not be downloaded (status ${res!.status}).`,
        { correlationId },
      );
    }

    // Cheap early rejection. The header is advisory and often absent or wrong,
    // so the real cap is enforced on the bytes below.
    const declaredLength = Number(res!.headers.get("content-length") ?? 0);
    if (declaredLength > policy.maxBytes) {
      throw new ConnectorError("payload_too_large", tooLarge(declaredLength, policy.maxBytes), { correlationId });
    }

    const bytes = await readCapped(res!, policy.maxBytes, correlationId);
    if (bytes.byteLength === 0) {
      throw new ConnectorError("upstream_unavailable", "The file location returned an empty body.", { correlationId });
    }

    const sniffed = sniffMime(bytes);
    if (!sniffed) {
      throw new ConnectorError("unsupported_media_type", "That file type is not recognised.", { correlationId });
    }
    if (!policy.allowedMimeTypes.includes(sniffed)) {
      throw new ConnectorError(
        "unsupported_media_type",
        `${sniffed} is not an accepted file type here. Accepted: ${policy.allowedMimeTypes.join(", ")}.`,
        { correlationId },
      );
    }
    // A body whose content disagrees with its own header is refused outright.
    // Either side could be the lie, so trusting either one is the bug.
    const declaredMime = normalizeMime(res!.headers.get("content-type"));
    if (declaredMime && declaredMime !== sniffed && policy.allowedMimeTypes.includes(declaredMime)) {
      throw new ConnectorError(
        "unsupported_media_type",
        "The file's contents do not match the type it claims to be.",
        { correlationId },
      );
    }

    return {
      bytes,
      mimeType: sniffed,
      fileName: safeFileName(file.file_name, sniffed),
      sizeBytes: bytes.byteLength,
      sourceFileId: file.file_id,
    };
  } catch (e) {
    if (e instanceof ConnectorError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ConnectorError("timeout", "Downloading the file took too long.", { correlationId, internal: e });
    }
    throw new ConnectorError("upstream_unavailable", "The file could not be downloaded.", { correlationId, internal: e });
  } finally {
    clearTimeout(timer);
  }
}

const tooLarge = (got: number, max: number) =>
  `The file is ${(got / 1048576).toFixed(1)}MB; the limit is ${(max / 1048576).toFixed(0)}MB.`;

/** Read the body, aborting as soon as the cap is passed rather than buffering
 *  a hostile response first and measuring it afterwards. */
async function readCapped(res: Response, maxBytes: number, correlationId?: string): Promise<Uint8Array> {
  const reader = res.body?.getReader?.();
  if (!reader) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new ConnectorError("payload_too_large", tooLarge(buf.byteLength, maxBytes), { correlationId });
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new ConnectorError("payload_too_large", tooLarge(total, maxBytes), { correlationId });
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

/* The seam between protocol and product.
 *
 * Everything above this line is the same for every consumer: the file contract,
 * the safe fetch, the verification. Everything below it is theirs: where bytes
 * live, what "attach" means, which resources exist. A consumer implements two
 * small interfaces and gets the whole ingestion path for free — and this
 * package never learns what a portfolio is. */



/** A file after the consumer has persisted it. `url` is whatever the consumer
 *  serves publicly — prefer a stable path on its own origin over a storage
 *  provider's URL, which rots when the deployment is renamed. */
export interface StoredFile {
  id: string;
  url: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
}

export interface FileStoreAdapter {
  save(input: NormalizedIncomingFile & { correlationId?: string }): Promise<StoredFile>;
}

/** What the consumer did with the file. `previous` exists so a caller can tell
 *  the user what was displaced, and so an "undo" is expressible — see the note
 *  on reversibility below. */
export interface AttachedMedia {
  resourceId: string;
  mediaId: string;
  usage: string;
  url: string;
  previous?: { mediaId: string; url: string } | null;
}

export interface MediaAttachAdapter {
  attach(input: {
    resourceId: string;
    media: StoredFile;
    usage: string;
    correlationId?: string;
  }): Promise<AttachedMedia>;
}

/**
 * Ingest, store, attach — the whole path behind one call.
 *
 * This is the primitive a consumer composes into a single user-goal tool
 * (`portfolio_attach_media`, `profile_set_avatar`). The model calls one tool
 * and never sees upload URLs, blob registration or storage ids.
 *
 * On reversibility: an adapter that returns `previous` has performed a
 * reversible pointer change and its tool should NOT be marked destructive. An
 * adapter that discards the prior asset has, and its tool should be. That is a
 * property of the adapter, not of this function, so it cannot be decided here
 * — which is exactly why `previous` is part of the interface.
 */
export async function receiveFileIntoMedia(args: {
  file: OpenAIFile;
  resourceId: string;
  usage: string;
  store: FileStoreAdapter;
  attach: MediaAttachAdapter;
  ingest: IngestOptions;
}): Promise<AttachedMedia> {
  const correlationId = args.ingest.correlationId ?? newCorrelationId();
  if (!args.resourceId) {
    throw new ConnectorError("invalid_input", "A target resource id is required.", { correlationId });
  }
  try {
    const normalized = await ingestOpenAIFile(args.file, { ...args.ingest, correlationId });
    const stored = await args.store.save({ ...normalized, correlationId });
    return await args.attach.attach({
      resourceId: args.resourceId,
      media: stored,
      usage: args.usage,
      correlationId,
    });
  } catch (e) {
    // A store or attach failure must not surface a driver message. toConnectorError
    // keeps the correlation id so the operator can find the real one in the log.
    throw toConnectorError(e, correlationId);
  }
}
