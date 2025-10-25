// Type shims for packages without TypeScript declarations

// ffprobe-static has no bundled types in some versions; declare a minimal module
declare module 'ffprobe-static' {
  const ffprobeStatic: { path: string };
  export default ffprobeStatic;
}

// mailparser minimal types
declare module 'mailparser' {
  export interface ParsedMail {
    subject?: string;
    text?: string;
    html?: string | false;
    date?: Date;
    from?: { text: string };
  }
  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
}
