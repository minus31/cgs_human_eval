import rawData from "../data/human_eval_data.json";

export interface Feature {
  token: string;
  shap: number;
  abs_shap: number;
  rank: number;
}

export interface Chunk {
  chunk_id: string;
  doc_id: string;
  is_displayed_passage: boolean;
  is_corpus_fallback: boolean;
  text: string;
}

export interface Group {
  group_id: number;
  shap: number;
  abs_shap: number;
  rank: number;
  chunks: Chunk[];
}

export interface Document {
  doc_id: string;
  text: string;
  preview?: string;
  target_rank: number;
  ranker_score: number;
  is_relevant: boolean;
}

export interface Item {
  query_id: string;
  query_text: string;
  target_order: string[];
  documents: Document[];
  judgments: Array<{ doc_id: string; relevance: number }>;
  conditions: {
    rankshap: { features: Feature[] };
    chunkgroupshap: { groups: Group[] };
  };
}

export interface HumanEvalData {
  metadata: {
    ui_instruction: string;
    assignment_policy: {
      tasks_per_user: number;
      rankshap_tasks: number;
      chunkgroupshap_tasks: number;
    };
  };
  condition_pools: {
    rankshap: string[];
    chunkgroupshap: string[];
  };
  items: Item[];
}

const data = rawData as unknown as HumanEvalData;

const itemMap = new Map<string, Item>(data.items.map((item) => [item.query_id, item]));

export function getHumanEvalData(): HumanEvalData {
  return data;
}

export function getItem(queryId: string): Item | undefined {
  return itemMap.get(queryId);
}

export function getRankSHAPPool(): string[] {
  return data.condition_pools.rankshap;
}

export function getChunkGroupSHAPPool(): string[] {
  return data.condition_pools.chunkgroupshap;
}
