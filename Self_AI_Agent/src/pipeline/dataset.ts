import { MemoryItem, PersonaProfile } from "../types";

// Build a simple persona dataset string from memories and profile
export function buildPersonaDataset(
  memories: MemoryItem[],
  profile?: PersonaProfile
): string {
  const header = [
    `Name: ${profile?.name ?? "User"}`,
    `Tone: ${profile?.tone ?? "friendly"}`,
    `SpeakingStyle: ${profile?.speakingStyle ?? "concise"}`,
    `Topics: ${(profile?.topics ?? []).join(", ")}`,
  ].join("\n");

  const samples = memories
    .map((m) => {
      const meta = m.metadata ? `|meta=${JSON.stringify(m.metadata)}` : "";
      return `[${m.type}] ${m.content ?? ""} ${meta}`.trim();
    })
    .join("\n");

  return `# Persona Profile\n${header}\n\n# Memory Samples\n${samples}`;
}
