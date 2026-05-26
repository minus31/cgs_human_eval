import { getRankSHAPPool, getChunkGroupSHAPPool, getChunkGroupSHAPRandomPool } from "./data";

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type Condition = "rankshap" | "chunkgroupshap" | "chunkgroupshap_random";

export interface TaskAssignmentInput {
  taskIndex: number;
  condition: Condition;
  queryId: string;
}

export function sampleTasks(seed: string): TaskAssignmentInput[] {
  const rsPool = getRankSHAPPool();
  const cgPool = getChunkGroupSHAPPool();
  const cgrPool = getChunkGroupSHAPRandomPool();

  const shuffledRS = seededShuffle(rsPool, seed + "-rs");
  const selectedRS = shuffledRS.slice(0, 5);

  const usedIds = new Set(selectedRS);
  const shuffledCG = seededShuffle(cgPool, seed + "-cg").filter((id) => !usedIds.has(id));
  const selectedCG = shuffledCG.slice(0, 5);

  selectedCG.forEach((id) => usedIds.add(id));
  const shuffledCGR = seededShuffle(cgrPool, seed + "-cgr").filter((id) => !usedIds.has(id));
  const selectedCGR = shuffledCGR.slice(0, 5);

  const tasks: TaskAssignmentInput[] = [];
  for (let i = 0; i < 5; i++) {
    tasks.push({ taskIndex: i + 1, condition: "rankshap", queryId: selectedRS[i] });
  }
  for (let i = 0; i < 5; i++) {
    tasks.push({ taskIndex: i + 6, condition: "chunkgroupshap", queryId: selectedCG[i] });
  }
  for (let i = 0; i < 5; i++) {
    tasks.push({ taskIndex: i + 11, condition: "chunkgroupshap_random", queryId: selectedCGR[i] });
  }
  return tasks;
}

export function shuffleDocIds(docIds: string[], seed: string): string[] {
  return seededShuffle(docIds, seed);
}
