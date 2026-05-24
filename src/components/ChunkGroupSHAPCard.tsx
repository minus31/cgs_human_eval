"use client";

import { Group } from "@/lib/data";

interface Props {
  groups: Group[];
}

const groupColors = [
  "border-indigo-300 bg-indigo-50",
  "border-emerald-300 bg-emerald-50",
  "border-amber-300 bg-amber-50",
];

const headerColors = [
  "text-indigo-700",
  "text-emerald-700",
  "text-amber-700",
];

export default function ChunkGroupSHAPCard({ groups }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Important passage groups
      </h2>
      <div className="space-y-4">
        {groups.map((group, idx) => (
          <div
            key={group.group_id}
            className={`rounded-lg border p-3 ${groupColors[idx % groupColors.length]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${headerColors[idx % headerColors.length]}`}>
                Group {idx + 1}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {group.abs_shap.toFixed(4)}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {group.chunks.map((chunk) => (
                <p
                  key={chunk.chunk_id}
                  className="text-xs text-gray-700 leading-relaxed border-l-2 border-current pl-2"
                >
                  {chunk.text}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
