import { NextRequest, NextResponse } from "next/server";
import { sampleTasks, shuffleDocIds } from "@/lib/assignment";
import { getItem } from "@/lib/data";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const sessionId = randomUUID();
  const seed = sessionId;

  const taskInputs = sampleTasks(seed);

  const tasks = taskInputs.map((t) => {
    const item = getItem(t.queryId)!;
    const docIds = item.documents.map((d) => d.doc_id);
    const initialOrder = shuffleDocIds(docIds, seed + "-" + t.taskIndex);

    const documents = initialOrder.map((docId, i) => {
      const doc = item.documents.find((d) => d.doc_id === docId)!;
      return {
        doc_id: doc.doc_id,
        label: String.fromCharCode(65 + i),
        text: doc.text,
        preview: doc.preview ?? null,
      };
    });

    return {
      taskIndex: t.taskIndex,
      condition: t.condition,
      queryId: t.queryId,
      queryText: item.query_text,
      documents,
      initialOrder,
      targetOrder: item.target_order,
      judgments: item.judgments,
      conditions:
        t.condition === "rankshap"
          ? { rankshap: item.conditions.rankshap }
          : { chunkgroupshap: item.conditions.chunkgroupshap },
    };
  });

  return NextResponse.json({ sessionId, email: normalizedEmail, tasks });
}
