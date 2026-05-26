"use client";

import { RankSHAPFeature } from "@/lib/data";

interface Props {
  features: RankSHAPFeature[];
}

export default function RankSHAPCard({ features }: Props) {
  const maxAbs = Math.max(...features.map((f) => f.abs_shap), 1e-9);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Important terms
      </h2>
      <div className="space-y-2">
        {features.map((feat, idx) => {
          const pct = (feat.abs_shap / maxAbs) * 100;
          const isPositive = feat.shap >= 0;

          return (
            <div key={feat.chunk_id + idx} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${isPositive ? "bg-blue-500" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-400 w-16 text-right flex-shrink-0">
                  {feat.shap >= 0 ? "+" : ""}{feat.shap.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{feat.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
