/**
 * Models wrap JSON in prose or fences often enough that trusting `JSON.parse`
 * on the raw text is a real source of avoidable retries.
 */
export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? text).trim();

  const firstBrace = body.search(/[[{]/);
  if (firstBrace === -1) return body;

  const opener = body[firstBrace];
  const closer = opener === '{' ? '}' : ']';
  const lastCloser = body.lastIndexOf(closer);
  if (lastCloser <= firstBrace) return body;
  return body.slice(firstBrace, lastCloser + 1);
}

export function parseJsonBlock(text: string): unknown {
  return JSON.parse(extractJsonBlock(text));
}
