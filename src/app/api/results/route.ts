import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { computeResults, toCSV, ResponseRow } from "@/lib/metrics";

async function fetchRows(): Promise<ResponseRow[]> {
  const { data, error } = await supabase
    .from("eval_responses")
    .select(
      "id, session_id, email, task_index, condition, query_id, judgments, submitted_order, target_order, elapsed_ms, started_at, submitted_at"
    )
    .order("submitted_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ResponseRow[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  try {
    const rows = await fetchRows();
    const { perResponse, summary } = computeResults(rows);

    if (format === "csv") {
      const csv = toCSV(perResponse, summary);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="human_eval_results_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ summary, perResponse, total: rows.length });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
