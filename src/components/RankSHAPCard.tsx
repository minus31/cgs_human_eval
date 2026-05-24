"use client";

import { Feature } from "@/lib/data";

interface Props {
  features: Feature[];
}

export default function RankSHAPCard({ features }: Props) {
  const maxAbs = Math.max(...features.map((f) => f.abs_shap), 1e-9);
  const hasNegative = features.some((f) => f.shap < 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Important terms
      </h2>
      <div className="space-y-3">
        {features.map((feat) => {
          const pct = (feat.abs_shap / maxAbs) * 100;
          const isPositive = feat.shap >= 0;
          const barColor = hasNegative
            ? isPositive
              ? "bg-blue-500"
              : "bg-red-400"
            : "bg-blue-500";

          return (
            <div key={feat.token} className="flex items-center gap-3">
              <span className="w-28 text-sm text-gray-700 truncate text-right font-mono">
                {feat.token}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full ${barColor} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-20 text-xs text-gray-500 font-mono text-right">
                {feat.shap >= 0 ? "+" : ""}
                {feat.shap.toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
