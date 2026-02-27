"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Language, PageTemplate, PostStatus, PostType } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Media } from "@/types/mediaTypes";
import { createPostAction } from "@/actions/posts/create-post";
import { updatePostAction } from "@/actions/posts/updatePosts";
import { useFetchMediaQueries } from "@/hooks/useFetchMediaQueries";

type InitialPost = {
  id: string;
  type: PostType;
  status: PostStatus;
  lang: Language;

  title: string;
  slug: string;
  excerpt: string | null;
  content: string;

  isFeatured: boolean;
  isPinned: boolean;
  pageTemplate: PageTemplate | null;

  coverMedia: Media | null;
  ogMedia: Media | null;
  attachments: { media: Media }[];
};

type FormValues = {
  type: PostType;
  status: PostStatus;
  lang: Language;

  title: string;
  slug: string;
  excerpt: string;
  content: string;

  isFeatured: boolean;
  isPinned: boolean;

  pageTemplate: PageTemplate;

  cover: Media | null;
  og: Media | null;
  attachments: Media[];
};

export default function PostForm({
  mode = "create",
  initialPost,
}: {
  mode?: "create" | "edit";
  initialPost?: InitialPost;
}) {
  const isEdit = mode === "edit";
  const isArchived = isEdit && initialPost?.status === "ARCHIVED";

  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // media picker UI state
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState<null | "cover" | "og" | "attachments">(null);
  const isPickerOpen = !!pickerOpen;

  // ✅ your hook with enabled
  const { data, isLoading, isFetching, error } = useFetchMediaQueries({
    page,
    q,
    pageSize,
    enabled: isPickerOpen,
  });

  const mediaItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const { register, watch, setValue, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      type: PostType.NEWS,
      status: PostStatus.DRAFT,
      lang: Language.EN,

      title: "",
      slug: "",
      excerpt: "",
      content: "",

      isFeatured: false,
      isPinned: false,

      pageTemplate: PageTemplate.STANDARD,

      cover: null,
      og: null,
      attachments: [],
    },
  });

  const type = watch("type");
  const status = watch("status");
  const title = watch("title");
  const content = watch("content");
  const cover = watch("cover");
  const og = watch("og");
  const attachments = watch("attachments");

  // populate on edit
  useEffect(() => {
    if (!isEdit || !initialPost) return;

    const atts =
      (initialPost.attachments ?? [])
        .map((a) => a.media)
        .filter(Boolean) as Media[];

    reset({
      type: initialPost.type,
      status: initialPost.status,
      lang: initialPost.lang,

      title: initialPost.title ?? "",
      slug: initialPost.slug ?? "",
      excerpt: initialPost.excerpt ?? "",
      content: initialPost.content ?? "",

      isFeatured: !!initialPost.isFeatured,
      isPinned: !!initialPost.isPinned,

      pageTemplate: (initialPost.pageTemplate ?? PageTemplate.STANDARD) as PageTemplate,

      cover: initialPost.coverMedia ?? null,
      og: initialPost.ogMedia ?? null,
      attachments: atts,
    });
  }, [isEdit, initialPost, reset]);

  // when type changes away from PAGE, clear template
  useEffect(() => {
    if (type !== PostType.PAGE) {
      // keep stored but irrelevant; optional to clear:
      // setValue("pageTemplate", PageTemplate.STANDARD);
    }
  }, [type, setValue]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      return json;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["media"] });
      setPage(1);
      toast.success("Uploaded");
    },
    onError: (e: any) => toast.error(e?.message || "Upload failed"),
  });

  const createPostMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!values.cover?.id) throw new Error("Cover image is required!");
      if (!values.og?.id) throw new Error("OG image is required (can be same as cover)!");

      const res = await createPostAction({
        type: values.type,
        status: values.status,
        lang: values.lang,
        title: values.title,
        slug: values.slug.trim() || null,
        excerpt: values.excerpt.trim() || null,
        content: values.content,
        isFeatured: values.isFeatured,
        isPinned: values.isPinned,
        pageTemplate: values.type === PostType.PAGE ? values.pageTemplate : null,
        coverMediaId: values.cover.id,
        ogMediaId: values.og.id,
        attachmentMediaIds: values.attachments.map((a) => a.id),
      });

      if (!res.success) throw new Error("Failed to create post");
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post Created Successfully!!!");
      router.push("/admin/posts");
    },
    onError: (e: any) => toast.error(e?.message || "Operation Failed!!!"),
  });

  const updatePostMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!initialPost?.id) throw new Error("Missing post id");
      if (isArchived) throw new Error("Archived posts are locked");

      if (!values.cover?.id) throw new Error("Cover image is required!");
      if (!values.og?.id) throw new Error("OG image is required (can be same as cover)!");

      const res = await updatePostAction({
        id:initialPost.id,
        slug:initialPost.slug,
        type: values.type,
        status: values.status,
        lang: values.lang,
        title: values.title,
        excerpt: values.excerpt.trim() || null,
        content: values.content,
        isFeatured: values.isFeatured,
        isPinned: values.isPinned,
        pageTemplate: values.type === PostType.PAGE ? values.pageTemplate : null,
        coverMediaId: values.cover.id,
        ogMediaId: values.og.id,
        attachmentMediaIds: values.attachments.map((a) => a.id),
      });

      if (!res.success) throw new Error(res.error || "Failed to update post");
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post Updated Successfully!!!");
      router.push("/admin/posts");
    },
    onError: (e: any) => toast.error(e?.message || "Update Failed!!!"),
  });

  function selectMedia(item: Media) {
    if (pickerOpen === "cover") {
      setValue("cover", item);
      setPickerOpen(null);
      return;
    }
    if (pickerOpen === "og") {
      setValue("og", item);
      setPickerOpen(null);
      return;
    }
    if (pickerOpen === "attachments") {
      const current = watch("attachments") || [];
      if (current.some((x) => x.id === item.id)) return;
      setValue("attachments", [...current, item]);
    }
  }

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0;
  }, [title, content]);

  const onSubmit = handleSubmit(async (values) => {
    if (!canSubmit) return;

    if (isEdit) updatePostMutation.mutate(values);
    else createPostMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      ) : null}

      {/* top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Type</span>
          <select {...register("type")} className="rounded-lg border p-2" disabled={isArchived}>
            {Object.values(PostType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select {...register("status")} className="rounded-lg border p-2" disabled={isArchived}>
            {Object.values(PostStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Language</span>
          <select {...register("lang")} className="rounded-lg border p-2" disabled={isArchived}>
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input {...register("title")} className="rounded-lg border p-2" disabled={isArchived} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug (optional)</span>
        <input
          {...register("slug")}
          className="rounded-lg border p-2"
          placeholder="leave empty to auto-generate"
          disabled={isEdit || isArchived} // ✅ lock slug in edit
        />
      </label>

      {type === PostType.PAGE ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Page Template</span>
          <select {...register("pageTemplate")} className="rounded-lg border p-2" disabled={isArchived}>
            {Object.values(PageTemplate).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt</span>
        <textarea {...register("excerpt")} className="rounded-lg border p-2" rows={3} disabled={isArchived} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content</span>
        <textarea {...register("content")} className="rounded-lg border p-2" rows={10} disabled={isArchived} />
      </label>

      {/* media buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("cover")} disabled={isArchived}>
          {cover ? "Change Cover" : "Choose Cover"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("og")} disabled={isArchived}>
          {og ? "Change OG" : "Choose OG"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("attachments")} disabled={isArchived}>
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
                {!isArchived ? (
                  <button
                    type="button"
                    className="text-sm text-red-600"
                    onClick={() => setValue("attachments", attachments.filter((x) => x.id !== a.id))}
                  >
                    remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* flags */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("isFeatured")} disabled={isArchived} />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("isPinned")} disabled={isArchived} />
          <span className="text-sm">Pinned</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={
          !canSubmit ||
          isArchived ||
          createPostMutation.isPending ||
          updatePostMutation.isPending
        }
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60 cursor-pointer"
      >
        {isEdit
          ? updatePostMutation.isPending
            ? "Saving..."
            : "Save Changes"
          : createPostMutation.isPending
          ? "Creating..."
          : "Create Post"}
      </button>

      {/* Media Picker Modal */}
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
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const list = e.currentTarget.files;
                  if (!list || list.length === 0) return;

                  const files = Array.from(list);
                  const valid = files.filter(
                    (f) => f.type.startsWith("image/") || f.type === "application/pdf"
                  );

                  if (valid.length !== files.length) {
                    toast.error("Only images and PDFs are allowed.");
                  }

                  if (valid.length) uploadMutation.mutate(valid);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} {data ? `• Total ${data.total}` : ""}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                >
                  Next
                </button>
              </div>
            </div>

            {isLoading ? <div className="text-sm text-gray-500 mt-3">Loading media...</div> : null}

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
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                      alt={m.originalName}
                      className="mt-2 h-28 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="mt-2 h-28 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                      PDF
                    </div>
                  )}

                  <div className="mt-2 text-sm font-medium line-clamp-2">{m.originalName}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {pickerOpen === "attachments" ? "Click to add" : "Click to select"}
                  </div>
                </button>
              ))}
            </div>

            {pickerOpen === "attachments" ? (
              <div className="mt-4 flex justify-end">
                <button type="button" className="rounded-xl bg-black px-4 py-2 text-white" onClick={() => setPickerOpen(null)}>
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}