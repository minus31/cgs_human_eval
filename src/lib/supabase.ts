import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (bypasses RLS)
export const supabase = createClient(url, serviceKey);

export interface EvalResponse {
  session_id: string;
  email: string;
  task_index: number;
  condition: string;
  query_id: string;
  judgments: Array<{ doc_id: string; relevance: number }> | null;
  initial_order: string[];
  target_order: string[];
  submitted_order: string[];
  elapsed_ms: number;
  drag_count: number;
}
