import { getRankSHAPPool, getChunkGroupSHAPPool } from "./data";

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

export interface TaskAssignmentInput {
  taskIndex: number;
  condition: "rankshap" | "chunkgroupshap";
  queryId: string;
}

export function sampleTasks(seed: string): TaskAssignmentInput[] {
  const rsPool = getRankSHAPPool();
  const cgPool = getChunkGroupSHAPPool();

  const shuffledRS = seededShuffle(rsPool, seed + "-rs");
  const shuffledCG = seededShuffle(cgPool, seed + "-cg");

  const selectedRS = shuffledRS.slice(0, 5);
  const selectedCGFiltered = shuffledCG.filter((id) => !selectedRS.includes(id));
  const selectedCG = selectedCGFiltered.slice(0, 5);

  const tasks: TaskAssignmentInput[] = [];
  for (let i = 0; i < 5; i++) {
    tasks.push({ taskIndex: i + 1, condition: "rankshap", queryId: selectedRS[i] });
  }
  for (let i = 0; i < 5; i++) {
    tasks.push({ taskIndex: i + 6, condition: "chunkgroupshap", queryId: selectedCG[i] });
  }
  return tasks;
}

export function shuffleDocIds(docIds: string[], seed: string): string[] {
  return seededShuffle(docIds, seed);
}
