"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

type Media = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  createdAt: string;
};

type MediaResponse = {
  items: Media[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [page, setPage] = useState(1);

  // input vs applied search
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState(""); // applied query

  const pageSize = 24;

  const mediaQuery = useQuery({
    queryKey: ["media", { page, q, pageSize }],
    queryFn: async (): Promise<MediaResponse> => {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load media");
      return json;
    },
    staleTime: 1 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      return json;
    },
    onSuccess: () => {
      // invalidate ALL pages & searches
      queryClient.invalidateQueries({ queryKey: ["media"] });

      // optional UX: jump back to page 1 to see latest uploads
      setPage(1);
    },
    onError: () => {
      toast.error("Couldn't upload file!!!")
    }
  });

  function applySearch() {
    setPage(1);
    setQ(qInput.trim());
  }

  const data = mediaQuery.data;
  const items = data?.items ?? [];

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="mt-6 space-y-4">
      {mediaQuery.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(mediaQuery.error as Error).message}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applySearch();
            }
          }}
          placeholder="Search by name or mime type…"
          className="flex-1 rounded-xl border px-4 py-3"
        />

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setQ(qInput.trim()); // ✅ triggers fetch only when you click Search
          }}
          className="rounded-xl border px-4 py-3"
          disabled={mediaQuery.isFetching}
        >
          {mediaQuery.isFetching ? "Searching..." : "Search"}
        </button>

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
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const list = e.currentTarget.files;
            if (!list) return;

            const validFiles = Array.from(list).filter((file) => {
              return (
                file.type.startsWith("image/") ||
                file.type === "application/pdf"
              );
            });

            if (validFiles.length !== list.length) {
              alert("Only images and PDFs are allowed.");
            }

            if (validFiles.length > 0) {
              uploadMutation.mutate(validFiles);
            }

            e.currentTarget.value = "";
          }}
        />
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages} {data ? `• Total ${data.total}` : ""}
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || mediaQuery.isFetching}
          >
            Prev
          </button>
          <button
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || mediaQuery.isFetching}
          >
            Next
          </button>
        </div>
      </div>

      {mediaQuery.isLoading ? <div className="text-sm text-gray-500">Loading media...</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-2xl border p-2">
            {m.mimeType.startsWith("image/") ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                alt={m.originalName}
                className="h-28 w-full object-cover rounded-xl"
                unoptimized={process.env.NODE_ENV !== "production"}
                height={28}
                width={28}
                quality={100}
              />
            ) : (
              <Link href={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`} target="blank" className="h-28 w-full rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                {m.mimeType.includes("pdf") ? "PDF" : "FILE"}
              </Link>
            )}
            <div className="mt-2 text-xs text-gray-500 truncate">{m.mimeType}</div>
            <div className="text-sm font-medium line-clamp-2">{m.originalName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}