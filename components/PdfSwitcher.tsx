"use client";

import { useState } from "react";

type Pdf = {
  id: string;
  url: string;
  originalName: string;
};

export default function PdfSwitcher({
  pdfs,
}: {
  pdfs: Pdf[];
}) {
  const [activeId, setActiveId] = useState(pdfs[0]?.id);

  const active = pdfs.find((p) => p.id === activeId);

  if (!active) return null;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {pdfs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {pdfs.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                p.id === activeId
                  ? "bg-black text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              {p.originalName}
            </button>
          ))}
        </div>
      )}

      {/* Viewer */}
      <div className="h-[80vh] w-full rounded-2xl border overflow-hidden">
        <iframe
          src={active.url}
          className="h-full w-full"
          title={active.originalName}
        />
      </div>
    </div>
  );
}