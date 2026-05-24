"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import RankSHAPCard from "@/components/RankSHAPCard";
import ChunkGroupSHAPCard from "@/components/ChunkGroupSHAPCard";
import RerankingCard from "@/components/RerankingCard";
import { Feature, Group } from "@/lib/data";

interface PassageDoc {
  doc_id: string;
  label: string;
  text: string;
  preview: string | null;
}

interface TaskData {
  taskIndex: number;
  condition: "rankshap" | "chunkgroupshap";
  queryId: string;
  queryText: string;
  documents: PassageDoc[];
  initialOrder: string[];
  targetOrder: string[];
  judgments: Array<{ doc_id: string; relevance: number }> | null;
  conditions: {
    rankshap?: { features: Feature[] };
    chunkgroupshap?: { groups: Group[] };
  };
}

interface SessionData {
  sessionId: string;
  email: string;
  tasks: TaskData[];
}

export default function TaskPage() {
  const { sessionId, taskIndex } = useParams<{ sessionId: string; taskIndex: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const raw = localStorage.getItem(`session:${sessionId}`);
    if (!raw) {
      router.replace("/");
      return;
    }
    const data: SessionData = JSON.parse(raw);
    const idx = parseInt(taskIndex, 10);
    const t = data.tasks.find((t) => t.taskIndex === idx);
    if (!t) {
      router.replace("/");
      return;
    }
    setSession(data);
    setTask(t);
    startTimeRef.current = Date.now();
  }, [sessionId, taskIndex, router]);

  const handleSubmit = async (orderedDocIds: string[], dragCount: number) => {
    if (!task || !session) return;
    setSubmitting(true);
    const elapsedMs = Date.now() - startTimeRef.current;

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sessionId,
          email: session.email,
          task_index: task.taskIndex,
          condition: task.condition,
          query_id: task.queryId,
          judgments: task.judgments,
          initial_order: task.initialOrder,
          target_order: task.targetOrder,
          submitted_order: orderedDocIds,
          elapsed_ms: elapsedMs,
          drag_count: dragCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Submission failed.");
        return;
      }

      const next = task.taskIndex + 1;
      if (next > 10) {
        router.push(`/session/${sessionId}/complete`);
      } else {
        router.push(`/session/${sessionId}/task/${next}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  const idx = parseInt(taskIndex, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Passage Ranking Study</span>
          <span className="text-sm text-gray-500">Task {idx} of 10</span>
        </div>
        <div className="max-w-7xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-blue-500 rounded-full transition-all"
              style={{ width: `${((idx - 1) / 10) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Instruction */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <p className="text-xs text-gray-500">
          Use the information on the left to correctly order the documents on the right.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Explanation card */}
          <div className="lg:w-2/5">
            {task.condition === "rankshap" && task.conditions.rankshap && (
              <RankSHAPCard features={task.conditions.rankshap.features} />
            )}
            {task.condition === "chunkgroupshap" && task.conditions.chunkgroupshap && (
              <ChunkGroupSHAPCard groups={task.conditions.chunkgroupshap.groups} />
            )}
          </div>

          {/* Reranking card */}
          <div className="lg:w-3/5">
            <RerankingCard
              key={task.taskIndex}
              documents={task.documents}
              initialOrder={task.initialOrder}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}
