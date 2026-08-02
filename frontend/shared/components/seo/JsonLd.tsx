/**
 * Inline JSON-LD structured data. Server-rendered by default — pass
 * the data object and we serialise into a `<script type="application/
 * ld+json">` so Google + Bing read it during the initial HTML scan
 * (not after JS hydration).
 *
 * Keep payloads small; one schema per <JsonLd /> instance is the
 * cleanest pattern. Compose multiple schemas by stacking instances.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML is the canonical way to inline JSON-LD —
      // React-rendered text content gets HTML-escaped, breaking the
      // payload. JSON.stringify is safe; we control the input shape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
