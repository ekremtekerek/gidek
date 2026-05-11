/**
 * Render a JSON-LD script tag. Pass a serialisable JS object that follows
 * schema.org. The data is stringified server-side; never include user-supplied
 * HTML — only structured field values.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
