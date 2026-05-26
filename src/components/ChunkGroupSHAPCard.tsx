"use client";

import { Group } from "@/lib/data";

interface Props {
  groups: Group[];
  title?: string;
}

const borderColors = [
  "border-indigo-300", "border-emerald-300", "border-amber-300",
  "border-rose-300",   "border-sky-300",     "border-violet-300", "border-teal-300",
];
const labelColors = [
  "text-indigo-700", "text-emerald-700", "text-amber-700",
  "text-rose-700",   "text-sky-700",     "text-violet-700", "text-teal-700",
];
const bgColors = [
  "bg-indigo-50", "bg-emerald-50", "bg-amber-50",
  "bg-rose-50",   "bg-sky-50",     "bg-violet-50", "bg-teal-50",
];

export default function ChunkGroupSHAPCard({ groups, title = "Important passage groups" }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        {title}
      </h2>
      <div className="space-y-3">
        {groups.map((group, idx) => (
          <div
            key={group.group_id}
            className={`rounded-lg border ${borderColors[idx % 7]} ${bgColors[idx % 7]} p-3`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${labelColors[idx % 7]}`}>
                Group {idx + 1}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {group.abs_shap.toFixed(4)}
              </span>
            </div>
            {/* Show only the first chunk, truncated */}
            {group.chunks.slice(0, 1).map((chunk) => (
              <p key={chunk.chunk_id} className="text-xs text-gray-600 leading-relaxed line-clamp-3 border-l-2 border-current pl-2">
                {chunk.text}
              </p>
            ))}
            {group.chunks.length > 1 && (
              <p className="text-xs text-gray-400 mt-1">
                +{group.chunks.length - 1} more snippet{group.chunks.length > 2 ? "s" : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
