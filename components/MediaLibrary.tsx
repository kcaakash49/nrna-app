"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Media = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  createdAt: string;
};

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["media", q],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(q)}&page=1&pageSize=36`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load media");
      return json.items as Media[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // ✅ now you WILL see this log
      console.log("Uploading files:", files.length);

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const items = data ?? [];

  return (
    <div className="mt-6 space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or mime type…"
          className="flex-1 rounded-xl border px-4 py-3"
        />

        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["media", q] })}
          className="rounded-xl border px-4 py-3"
          disabled={isFetching}
        >
          {isFetching ? "Searching..." : "Search"}
        </button>

        {/* ✅ Reliable uploader */}
        <button
          type="button"
          className="rounded-xl bg-black text-white px-4 py-3"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload"}
        </button>

        <input
          ref={fileRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            const fileList = e.currentTarget.files;
            if (fileList && fileList.length > 0) {
              const files = Array.from(fileList);
              uploadMutation.mutate(files);
            }
            e.currentTarget.value = "";
          }}
        />
      </div>

      {isLoading ? <div className="text-sm text-gray-500">Loading media...</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-2xl border p-2">
            {m.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`} alt={m.originalName} className="h-28 w-full object-cover rounded-xl" />
            ) : (
              <div className="h-28 w-full rounded-xl border border-red-500 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                {m.mimeType.includes("pdf") ? "PDF" : "FILE"}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 truncate">{m.mimeType}</div>
            <div className="text-sm font-medium line-clamp-2">{m.originalName}</div>
            <div className="mt-1 text-[11px] text-gray-500 font-mono truncate">{m.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}