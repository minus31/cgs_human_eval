import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    session_id, email, task_index, condition, query_id,
    judgments, initial_order, target_order, submitted_order,
    elapsed_ms, drag_count, started_at, submitted_at,
  } = body;

  if (!session_id || !email || !task_index || !condition || !query_id ||
      !initial_order || !target_order || !submitted_order ||
      typeof elapsed_ms !== "number" || typeof drag_count !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabase.from("eval_responses").insert({
    session_id,
    email,
    task_index,
    condition,
    query_id,
    judgments,
    initial_order,
    target_order,
    submitted_order,
    elapsed_ms,
    drag_count,
    started_at: started_at ?? null,
    submitted_at: submitted_at ?? new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
