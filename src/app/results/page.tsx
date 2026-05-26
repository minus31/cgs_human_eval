"use client";

import { useEffect, useState, useCallback } from "react";
import { ConditionSummary, PerResponseResult } from "@/lib/metrics";

interface ResultsData {
  summary: ConditionSummary[];
  perResponse: PerResponseResult[];
  total: number;
}

function fmt(v: number | null, digits = 4): string {
  return v == null ? "—" : v.toFixed(digits);
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const downloadCSV = () => {
    window.open("/api/results?format=csv", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Human Eval Results</h1>
            {lastFetched && (
              <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastFetched}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchResults}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Total responses */}
            <p className="text-sm text-gray-500">
              Total responses: <strong className="text-gray-800">{data.total}</strong>
            </p>

            {/* Summary table */}
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-3">Summary by Condition</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Condition</th>
                      <th className="px-4 py-3 text-right">N</th>
                      <th className="px-4 py-3 text-right">NDCG@5 mean</th>
                      <th className="px-4 py-3 text-right">NDCG@5 std</th>
                      <th className="px-4 py-3 text-right">Time mean (s)</th>
                      <th className="px-4 py-3 text-right">Time std (s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.summary.map((s) => (
                      <tr key={s.condition} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.label}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.n}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {s.n === 0 ? "—" : (
                            <span className={s.ndcg5_mean != null && s.ndcg5_mean >= 0.7 ? "text-green-600 font-semibold" : "text-gray-800"}>
                              {fmt(s.ndcg5_mean)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{fmt(s.ndcg5_std)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800">{fmt(s.elapsed_s_mean, 1)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{fmt(s.elapsed_s_std, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Per-response detail */}
            {data.perResponse.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-gray-800 mb-3">
                  Per-Response Detail ({data.perResponse.length} rows)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Session</th>
                        <th className="px-3 py-2 text-right">#</th>
                        <th className="px-3 py-2 text-left">Condition</th>
                        <th className="px-3 py-2 text-left">Query</th>
                        <th className="px-3 py-2 text-right">NDCG@5</th>
                        <th className="px-3 py-2 text-right">Time (s)</th>
                        <th className="px-3 py-2 text-left">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.perResponse.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{r.email}</td>
                          <td className="px-3 py-2 font-mono text-gray-400 max-w-[80px] truncate">{r.session_id.slice(0, 8)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{r.task_index}</td>
                          <td className="px-3 py-2 text-gray-600">{r.condition}</td>
                          <td className="px-3 py-2 font-mono text-gray-500">{r.query_id}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {r.ndcg5 == null ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <span className={r.ndcg5 >= 0.7 ? "text-green-600 font-semibold" : "text-gray-800"}>
                                {r.ndcg5.toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-700">{r.elapsed_s.toFixed(1)}</td>
                          <td className="px-3 py-2 text-gray-400">{new Date(r.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {data.perResponse.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                No responses yet.
              </div>
            )}
          </>
        )}

        {loading && !data && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        )}
      </main>
    </div>
  );
}
