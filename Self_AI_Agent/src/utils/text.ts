export function stripHtml(html: string): string {
  // naive html tag stripper
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(text: string): string {
  return (text || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
}
