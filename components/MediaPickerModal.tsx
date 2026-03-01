"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetchMediaQueries } from "@/hooks/useFetchMediaQueries";
import { toast } from "sonner";

type PickerMode = "single" | "multiple";

type MediaItem = {
  id: string;
  url: string; // your media has url like "/uploads/.."
  originalName: string;
  mimeType: string;
};

type Props = {
  open: string | null;
  onClose: () => void;

  mode?: PickerMode;

  /** Optional: show selected state when mode="multiple" */
  selectedIds?: string[];

  /** Single mode: returns one item, modal auto closes */
  onSelectOne?: (m: MediaItem) => void;

  /**
   * Multiple mode: you control the list outside.
   * We'll toggle and return next list.
   */
  onChangeSelected?: (nextIds: string[], lastClicked: MediaItem) => void;
  onConfirmMultiple?: (ids: string[]) => Promise<void> | void;
  confirmLabel?: string;

  /** Optional */
  title?: string;
  pageSize?: number;
};

export default function MediaPickerModal({
  open,
  onClose,
  mode = "single",
  selectedIds = [],
  onSelectOne,
  onChangeSelected,
  onConfirmMultiple,
  confirmLabel,
  title = "Media Library",
  pageSize = 24,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Search state
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const isOpen = !!open;

  // ✅ fetch only when modal is open
  const mediaQuery = useFetchMediaQueries({
    page,
    q,
    pageSize,
    enabled: isOpen,
  });

  const medias = mediaQuery.data;
  const mediaItems = (medias?.items || []) as MediaItem[];
  const totalPages = medias?.totalPages || 1;

  // const totalPages = useMemo(() => {
  //   const tp = medias?.meta?.totalPages;
  //   return typeof tp === "number" && tp > 0 ? tp : 1;
  // }, [medias]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Reset modal UI when opening
  useEffect(() => {
    if (open) {
      setPage(1);
      setQ("");
      setQInput("");
    }
  }, [open]);

  // Upload (multiple files) -> your existing API endpoint
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!files?.length) return;
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setPage(1);
    },
    onError: () => toast.error("Upload Failed!!!"),
  });

  const mediaLoading = mediaQuery.isLoading;
  const mediaFetching = mediaQuery.isFetching;

  const handleSearch = () => {
    setPage(1);
    setQ(qInput.trim());
  };

  const toggleMultiple = (m: MediaItem) => {
    const exists = selectedSet.has(m.id);
    const next = exists ? selectedIds.filter((id) => id !== m.id) : [...selectedIds, m.id];
    onChangeSelected?.(next, m);
  };

  const handlePick = (m: MediaItem) => {
    if (mode === "multiple") {
      toggleMultiple(m);
      return;
    }
    if (open === "cover") {
      if (!m.mimeType?.startsWith("image/")) {
        toast.error("Cover can't be a file but an image");
        return;
      }
    }
    onSelectOne?.(m);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">{title}</div>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Search + Upload */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="flex-1 rounded-lg border p-2"
            placeholder="Search media..."
          />

          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl border px-4 py-3 disabled:opacity-50"
            disabled={mediaFetching}
          >
            {mediaFetching ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            className="rounded-xl bg-black text-white px-4 py-3 disabled:opacity-50"
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
              const list = e.currentTarget.files;
              if (list && list.length > 0) {
                uploadMutation.mutate(Array.from(list));
              }
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
            {medias?.total ? ` • Total ${medias?.total}` : ""}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || mediaFetching}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || mediaFetching}
            >
              Next
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {mediaLoading ? (
          <div className="text-sm text-gray-500 mt-3">Loading media...</div>
        ) : null}

        {mediaQuery.isError ? (
          <div className="text-sm text-red-600 mt-3">
            Failed to load media.
          </div>
        ) : null}

        {/* Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {mediaItems.map((m) => {
            const active = selectedSet.has(m.id);
            const isImage = m.mimeType?.startsWith("image/");
            return (
              <button
                key={m.id}
                type="button"
                disabled={!isImage}
                className={`rounded-xl border p-2 text-left ${!isImage
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-50"
                  }`}
                onClick={() => {
                  if (!isImage) return;
                  handlePick(m);
                }}
              >
                <div className="text-xs text-gray-500 truncate">{m.mimeType}</div>

                {m.mimeType?.startsWith("image/") ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                    alt={m.originalName || "media"}
                    height={280}
                    width={280}
                    unoptimized={process.env.NODE_ENV !== "production"}
                    className="mt-2 h-28 w-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="mt-2 h-28 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                    FILE
                  </div>
                )}

                <div className="mt-2 text-sm font-medium line-clamp-2">
                  {m.originalName}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {mode === "multiple" ? "Click to add/remove" : "Click to select"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Done button (multiple mode) */}
        {mode === "multiple" ? (
          <div className="mt-6 border-t pt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium">{selectedIds.length}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirming}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0 || isConfirming}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={async () => {
                  try {
                    setIsConfirming(true);
                    await onConfirmMultiple?.(selectedIds);
                    onClose();
                  } finally {
                    setIsConfirming(false);
                  }
                }}
              >
                {isConfirming ? "Adding..." : confirmLabel ?? "Add selected"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}