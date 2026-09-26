/**
 * pdf-parse's package entry point runs a debug branch that reads a bundled test
 * PDF when it cannot see a parent module, which breaks under a bundler. The
 * library file underneath has no such branch, so it is imported directly and
 * typed here.
 */
declare module 'pdf-parse/lib/pdf-parse.js' {
  type PdfParseResult = { text: string; numpages: number; info: unknown };
  function pdfParse(data: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}
