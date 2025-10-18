import { buildPersonaDataset } from "./dataset";
import { TrainingProvider } from "../providers/provider";
import { MemoryItem, PersonaProfile, TrainingJob } from "../types";

const jobs = new Map<string, TrainingJob & { modelId?: string }>();

export function getJob(id: string) {
  return jobs.get(id);
}

export async function startTraining(
  userId: string,
  memories: MemoryItem[],
  profile: PersonaProfile | undefined,
  provider: TrainingProvider
) {
  const id = `${userId}-${Date.now()}`;
  const now = Date.now();
  const job: TrainingJob = {
    id,
    userId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);

  // fire and forget
  (async () => {
    try {
      jobs.set(id, { ...job, status: "running", updatedAt: Date.now() });
      const dataset = buildPersonaDataset(memories, profile);
      const { modelId } = await provider.trainPersona(userId, dataset);
      jobs.set(id, { ...job, status: "succeeded", updatedAt: Date.now(), error: undefined });
      const extended = jobs.get(id);
      if (extended) (extended as any).modelId = modelId;
    } catch (e: any) {
      jobs.set(id, { ...job, status: "failed", updatedAt: Date.now(), error: String(e?.message || e) });
    }
  })();

  return job;
}
