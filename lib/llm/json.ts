/**
 * Reasoning models emit their scratchpad before the answer. Sarvam returns it in
 * a separate field, but an inline block still shows up often enough that parsing
 * without stripping it is a real source of avoidable retries.
 */
export function stripThinkTags(text: string): string {
  let cleaned = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');

  // A reply that opens a reasoning block and never closes it, or closes one it
  // never opened, still has to give up its JSON.
  const closing = cleaned.search(/<\/think(?:ing)?>/i);
  if (closing !== -1) cleaned = cleaned.slice(cleaned.indexOf('>', closing) + 1);

  return cleaned.replace(/<think(?:ing)?>/gi, '').trim();
}

/**
 * Models wrap JSON in prose or fences often enough that trusting `JSON.parse`
 * on the raw text is a real source of avoidable retries.
 */
export function extractJsonBlock(text: string): string {
  const withoutThinking = stripThinkTags(text);
  const fenced = withoutThinking.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? withoutThinking).trim();

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
