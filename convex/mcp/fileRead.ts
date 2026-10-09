import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyFileToken } from "../_shared/signedFileUrl";

/**
 * `GET /files/read?t=<token>` — redeem a link minted by the `files_read_url`
 * MCP tool.
 *
 * Unauthenticated by design: the token is the credential. An AI host fetches
 * this URL to render the image, with no CareerPack session to present. What
 * keeps that safe is that the token expires in an hour, is HMAC-bound to one
 * file id and one owner, and is re-checked against the row here — a token
 * minted an hour ago must not still work if the file was deleted since.
 *
 * Every failure answers the same 404 with the same body. A caller probing with
 * altered tokens learns nothing about which part was wrong, whether the file
 * exists, or whether it belongs to someone else.
 */

const NOT_FOUND = () =>
  new Response("Tautan tidak berlaku atau sudah kedaluwarsa.", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Nothing here is ever worth caching, least of all a 404 for a token
      // that may become valid-looking again on the next mint.
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

export const handleSignedFileRead = httpAction(async (ctx, request) => {
  const token = new URL(request.url).searchParams.get("t");
  if (!token) return NOT_FOUND();

  const payload = await verifyFileToken(token);
  if (!payload) return NOT_FOUND();

  const file = await ctx.runQuery(internal.mcp.data.files.resolveSignedFile, {
    fileId: payload.f,
    userId: payload.u,
  });
  if (!file) return NOT_FOUND();

  const blob = await ctx.storage.get(file.storageId);
  if (!blob) return NOT_FOUND();
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": file.fileType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      // Serve bytes without exposing the durable storage bearer URL.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
