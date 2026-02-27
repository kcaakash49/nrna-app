"use client";

import {  useMemo, useRef, useState } from "react";
import { Language, PageTemplate, PostStatus, PostType } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Media, MediaResponse } from "@/types/mediaTypes";
import { toast } from "sonner";
import { createPostAction } from "@/actions/posts/create-post";



export default function PostForm() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  // post fields
  const [type, setType] = useState<PostType>(PostType.NEWS);
  const [status, setStatus] = useState<PostStatus>(PostStatus.DRAFT);
  const [lang, setLang] = useState<Language>(Language.EN);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [pageTemplate, setPageTemplate] = useState<PageTemplate>(PageTemplate.STANDARD);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [page, setPage] = useState(1);

  // selected media
  const [cover, setCover] = useState<Media | null>(null);
  const [og, setOg] = useState<Media | null>(null);
  const [attachments, setAttachments] = useState<Media[]>([]);

  // media picker state
  const [pickerOpen, setPickerOpen] = useState<null | "cover" | "og" | "attachments">(null);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const pageSize = 24;

  const { data, isLoading, isFetching, error } = useQuery({
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
    staleTime: 5 * 60 * 1000,
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
      
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setPage(1);
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        status,
        lang,
        title,
        slug: slug || null,
        excerpt: excerpt || null,
        content,
        isFeatured,
        isPinned,
        pageTemplate: type === PostType.PAGE ? pageTemplate : null,
        coverMediaId: cover?.id ?? null,
        ogMediaId: og?.id ?? null,
        attachmentMediaIds: attachments.map((a) => a.id),
      };

      if(!payload.coverMediaId){
        throw new Error("CoverImage is required!!!")
      }
      if(!payload.ogMediaId){
        throw new Error("OgImage is required, you can select same as coverimage!!!")
      }

      const res = await createPostAction(payload);
      if (!res.success) throw new Error("Failed to create post");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-posts"]
      })
      toast.success("Post Created Successfully!!!")
    },
    onError: (error) => {
      toast.error(error.message || "Operation Failed!!!")
    }
  })

  function selectMedia(item: Media) {
    if (pickerOpen === "cover") {
      setCover(item);
      setPickerOpen(null);
      return;
    }
    if (pickerOpen === "og") {
      setOg(item);
      setPickerOpen(null);
      return;
    }
    if (pickerOpen === "attachments") {
      setAttachments((prev) => (prev.some((x) => x.id === item.id) ? prev : [...prev, item]));
    }
  }

  async function submit() {
    createPostMutation.mutate();
  }

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0;
  }, [title, content]);

  const mediaItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;


  return (
    <div className="mt-6 space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as PostType)} className="rounded-lg border p-2">
            {Object.values(PostType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)} className="rounded-lg border p-2">
            {Object.values(PostStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="rounded-lg border p-2">
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border p-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug (optional)</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border p-2" placeholder="leave empty to auto-generate" />
      </label>

      {type === PostType.PAGE ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Page Template</span>
          <select value={pageTemplate} onChange={(e) => setPageTemplate(e.target.value as PageTemplate)} className="rounded-lg border p-2">
            {Object.values(PageTemplate).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt</span>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="rounded-lg border p-2" rows={3} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content</span>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="rounded-lg border p-2" rows={10} />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("cover")}>
          {cover ? "Change Cover" : "Choose Cover"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("og")}>
          {og ? "Change OG" : "Choose OG"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("attachments")}>
          Add Attachments ({attachments.length})
        </button>
      </div>

      {cover ? <div className="text-sm text-gray-600">Cover: {cover.originalName}</div> : null}
      {og ? <div className="text-sm text-gray-600">OG: {og.originalName}</div> : null}

      {attachments.length ? (
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">Attachments</div>
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                <div className="text-sm">
                  <div className="font-medium">{a.originalName}</div>
                  <div className="text-gray-500">{a.mimeType}</div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          <span className="text-sm">Pinned</span>
        </label>
      </div>

      <button
        type="button"
        disabled={!canSubmit || createPostMutation.isPending}
        onClick={submit}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60 cursor-pointer"
      >
        {createPostMutation.isPending ? "Creating..." : "Create Post"}
      </button>

      {/* Picker Modal */}
      {pickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">Media Library</div>
              <button className="rounded-lg border px-3 py-1" onClick={() => setPickerOpen(null)}>
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                className="flex-1 rounded-lg border p-2"
                placeholder="Search media..."
              />
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setQ(qInput.trim());
                }}
                className="rounded-xl border px-4 py-3"
                disabled={isFetching}
              >
                {isFetching ? "Searching..." : "Search"}
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} {data ? `• Total ${data.total}` : ""}
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                >
                  Prev
                </button>
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                >
                  Next
                </button>
              </div>
            </div>

             {isLoading ? <div className="text-sm text-gray-500">Loading media...</div> : null}

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {mediaItems.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="rounded-xl border p-2 text-left hover:bg-gray-50"
                  onClick={() => selectMedia(m)}
                >
                  <div className="text-xs text-gray-500 truncate">{m.mimeType}</div>
                  {m.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`} alt={m.originalName} className="mt-2 h-28 w-full object-cover rounded-lg" />
                  ) : (
                    <div className="mt-2 h-28 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                      FILE
                    </div>
                  )}
                  <div className="mt-2 text-sm font-medium line-clamp-2">{m.originalName}</div>
                  {pickerOpen === "attachments" ? (
                    <div className="mt-1 text-xs text-gray-500">Click to add</div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-500">Click to select</div>
                  )}
                </button>
              ))}
            </div>

            {pickerOpen === "attachments" ? (
              <div className="mt-4 flex justify-end">
                <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={() => setPickerOpen(null)}>
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}