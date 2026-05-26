export type Judgment = { doc_id: string; relevance: number };

function dcg(rels: number[], k = 5): number {
  return rels.slice(0, k).reduce((sum, r, i) => sum + r / Math.log2(i + 2), 0);
}

export function ndcg5(
  submittedOrder: string[],
  judgments: Judgment[] | null
): number | null {
  const relDict: Record<string, number> = {};
  if (judgments) {
    for (const j of judgments) relDict[j.doc_id] = j.relevance;
  }

  const submittedRels = submittedOrder.slice(0, 5).map((id) => relDict[id] ?? 0);
  const idealRels = Object.values(relDict).sort((a, b) => b - a).slice(0, 5);

  const idcg = dcg(idealRels);
  if (idcg === 0) return null; // no relevant docs in this query
  return dcg(submittedRels) / idcg;
}

export type ConditionLabel =
  | "rankshap"
  | "chunkgroupshap"
  | "chunkgroupshap_random";

export const CONDITION_DISPLAY: Record<ConditionLabel, string> = {
  rankshap: "RankSHAP",
  chunkgroupshap: "ChunkGroupSHAP",
  chunkgroupshap_random: "ChunkGroupSHAP w/ Random Grouping",
};

export interface ResponseRow {
  id: string;
  session_id: string;
  email: string;
  task_index: number;
  condition: string;
  query_id: string;
  judgments: Judgment[] | null;
  submitted_order: string[];
  target_order: string[];
  elapsed_ms: number;
  started_at: string | null;
  submitted_at: string;
}

export interface PerResponseResult extends ResponseRow {
  ndcg5: number | null;
  elapsed_s: number;
}

export interface ConditionSummary {
  condition: string;
  label: string;
  n: number;
  ndcg5_mean: number | null;
  ndcg5_std: number | null;
  elapsed_s_mean: number;
  elapsed_s_std: number;
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
}

export function computeResults(rows: ResponseRow[]): {
  perResponse: PerResponseResult[];
  summary: ConditionSummary[];
} {
  const perResponse: PerResponseResult[] = rows.map((row) => ({
    ...row,
    ndcg5: ndcg5(row.submitted_order, row.judgments),
    elapsed_s: row.elapsed_ms / 1000,
  }));

  const conditions = ["rankshap", "chunkgroupshap", "chunkgroupshap_random"] as const;

  const summary: ConditionSummary[] = conditions.map((cond) => {
    const group = perResponse.filter((r) => r.condition === cond);
    const ndcgVals = group.map((r) => r.ndcg5).filter((v): v is number => v !== null);
    const timeVals = group.map((r) => r.elapsed_s);

    return {
      condition: cond,
      label: CONDITION_DISPLAY[cond],
      n: group.length,
      ndcg5_mean: ndcgVals.length > 0 ? mean(ndcgVals) : null,
      ndcg5_std: ndcgVals.length > 0 ? std(ndcgVals) : null,
      elapsed_s_mean: mean(timeVals),
      elapsed_s_std: std(timeVals),
    };
  });

  return { perResponse, summary };
}

export function toCSV(perResponse: PerResponseResult[], summary: ConditionSummary[]): string {
  const summaryHeader = "condition,label,n,ndcg5_mean,ndcg5_std,elapsed_s_mean,elapsed_s_std";
  const summaryRows = summary.map((s) =>
    [
      s.condition,
      `"${s.label}"`,
      s.n,
      s.ndcg5_mean?.toFixed(4) ?? "",
      s.ndcg5_std?.toFixed(4) ?? "",
      s.elapsed_s_mean.toFixed(2),
      s.elapsed_s_std.toFixed(2),
    ].join(",")
  );

  const detailHeader =
    "session_id,email,task_index,condition,query_id,ndcg5,elapsed_s,submitted_at";
  const detailRows = perResponse.map((r) =>
    [
      r.session_id,
      r.email,
      r.task_index,
      r.condition,
      r.query_id,
      r.ndcg5?.toFixed(4) ?? "",
      r.elapsed_s.toFixed(2),
      r.submitted_at,
    ].join(",")
  );

  return (
    "=== SUMMARY ===\n" +
    [summaryHeader, ...summaryRows].join("\n") +
    "\n\n=== DETAIL ===\n" +
    [detailHeader, ...detailRows].join("\n")
  );
}
