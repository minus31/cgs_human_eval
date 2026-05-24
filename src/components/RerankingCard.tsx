"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface PassageDoc {
  doc_id: string;
  label: string;
  text: string;
  preview: string | null;
}

interface SortablePassageProps {
  id: string;
  label: string;
  text: string;
  preview: string | null;
  rank: number;
}

function SortablePassage({ id, label, text, preview, rank }: SortablePassageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 cursor-grab active:cursor-grabbing shadow-sm select-none ${
        isDragging ? "shadow-lg border-blue-300" : "border-gray-200 hover:border-gray-300"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">
            Passage {label}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
            {preview ?? text}
          </p>
        </div>
        <div className="flex-shrink-0 text-gray-300 mt-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6h8M4 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface Props {
  documents: PassageDoc[];
  initialOrder: string[];
  onSubmit: (orderedDocIds: string[], dragCount: number) => void;
  isSubmitting: boolean;
}

export default function RerankingCard({ documents, initialOrder, onSubmit, isSubmitting }: Props) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [dragCount, setDragCount] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
    setDragCount(0);
    setHasInteracted(false);
  }, [initialOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrder((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIdx, newIdx);
      });
      setDragCount((c) => c + 1);
      setHasInteracted(true);
    }
  }, []);

  const docMap = new Map(documents.map((d) => [d.doc_id, d]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Order the passages
      </h2>
      <p className="text-xs text-gray-400 mb-4">Drag passages to rank from most to least relevant.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 flex-1">
            {order.map((docId, i) => {
              const doc = docMap.get(docId);
              if (!doc) return null;
              return (
                <SortablePassage
                  key={docId}
                  id={docId}
                  label={doc.label}
                  text={doc.text}
                  preview={doc.preview}
                  rank={i + 1}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {!hasInteracted && (
          <p className="text-xs text-amber-600 mb-2">
            Drag at least one passage to enable submit, or confirm the current order.
          </p>
        )}
        <div className="flex gap-2">
          {!hasInteracted && (
            <button
              onClick={() => setHasInteracted(true)}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Confirm current order
            </button>
          )}
          <button
            disabled={!hasInteracted || isSubmitting}
            onClick={() => onSubmit(order, dragCount)}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
