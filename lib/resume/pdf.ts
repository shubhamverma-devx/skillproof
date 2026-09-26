export class ResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeParseError';
  }
}

const MIN_USABLE_CHARS = 120;

/**
 * Pulls text out of an uploaded PDF. Scanned or image only resumes produce
 * almost no text, which is reported as a parse error so the UI can ask the
 * student to paste the text instead.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  let text: string;
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    throw new ResumeParseError(
      `Could not read that PDF: ${error instanceof Error ? error.message : 'unknown error'}. Paste your resume text instead.`,
    );
  }

  if (text.length < MIN_USABLE_CHARS) {
    throw new ResumeParseError(
      'That PDF has almost no selectable text, so it is probably a scan. Paste your resume text instead.',
    );
  }

  return text;
}
