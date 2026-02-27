"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EventStatus, Language } from "@prisma/client";
import { useForm } from "react-hook-form";

import { useFetchParentCategories } from "@/hooks/useFetchParentCategories";
import { useFetchMediaQueries } from "@/hooks/useFetchMediaQueries";
import { createEvent } from "@/actions/events/create-events";
import { updateEvent } from "@/actions/events/update-events";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";

type Media = {
  id: string;
  url: string;
  mimeType: string;
  originalName: string;
  createdAt: string;
};

type EventCategory = {
  id: string;
  name: string;
  slug: string;
  order: number;
  children: EventCategory[];
};

// This matches what your edit page includes
type InitialEvent = {
  id: string;
  title: string;
  slug: string;
  lang: Language;
  status: EventStatus;
  excerpt: string | null;
  content: string;

  startDateTime: Date;
  endDateTime: Date | null;
  timezone: string | null;

  isOnline: boolean;
  onlineLink: string | null;
  locationName: string | null;
  locationAddress: string | null;
  registrationUrl: string | null;

  isFeatured: boolean;
  categoryId: string | null;

  coverMediaId: string | null;
  coverMedia: Media | null;

  attachments: { media: Media }[];
};

type FormValues = {
  // basic
  title: string;
  slug: string;
  lang: Language;
  status: EventStatus;
  excerpt: string;
  content: string;

  // time
  startDateTime: string; // datetime-local
  endDateTime: string;   // datetime-local (optional)
  timezone: string;

  // location/online
  isOnline: boolean;
  onlineLink: string;
  locationName: string;
  locationAddress: string;
  registrationUrl: string;

  // meta
  isFeatured: boolean;

  // category selection (UI)
  parentId: string;
  childId: string;

  // media
  cover: Media | null;
  attachments: Media[];
};

function toDateTimeLocal(d: Date | string | null | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  // convert to local datetime-local string: YYYY-MM-DDTHH:mm
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function EventForm({
  mode = "create",
  initialEvent,
}: {
  mode?: "create" | "edit";
  initialEvent?: InitialEvent;
}) {
  const isEdit = mode === "edit";
  const isArchived = isEdit && initialEvent?.status === EventStatus.ARCHIVED;

  const fileRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Media picker state
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState<null | "cover" | "attachments">(null);
  const isPickerOpen = !!pickerOpen;

  // Queries
  const { data: medias, isLoading: mediaLoading, isFetching: mediaFetching } =
    useFetchMediaQueries({ page, q, pageSize, enabled: isPickerOpen });

  const { data: parents = [], isLoading: catLoading } = useFetchParentCategories();
  const parentCategories = parents as unknown as EventCategory[];

  // RHF setup
  const { register, watch, setValue, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      title: "",
      slug: "",
      lang: Language.EN,
      status: EventStatus.DRAFT,
      excerpt: "",
      content: "",

      startDateTime: "",
      endDateTime: "",
      timezone: "Asia/Kathmandu",

      isOnline: false,
      onlineLink: "",
      locationName: "",
      locationAddress: "",
      registrationUrl: "",

      isFeatured: false,

      parentId: "",
      childId: "",

      cover: null,
      attachments: [],
    },
  });

  const parentId = watch("parentId");
  const childId = watch("childId");
  const isOnline = watch("isOnline");
  const startDateTime = watch("startDateTime");
  const title = watch("title");
  const content = watch("content");
  const cover = watch("cover");
  const attachments = watch("attachments");

  const selectedParent = useMemo(() => {
    return parentCategories.find((p) => p.id === parentId) || null;
  }, [parentCategories, parentId]);

  const childOptions = selectedParent?.children ?? [];
  const finalCategoryId = childId || parentId || null;

  // Populate form for edit mode
  useEffect(() => {
    if (!isEdit || !initialEvent) return;

    const coverMedia = initialEvent.coverMedia
      ? {
          id: initialEvent.coverMedia.id,
          url: initialEvent.coverMedia.url,
          mimeType: initialEvent.coverMedia.mimeType,
          originalName: initialEvent.coverMedia.originalName,
          createdAt: String(initialEvent.coverMedia.createdAt),
        }
      : null;

    const att = (initialEvent.attachments ?? [])
      .map((a) => a.media)
      .filter(Boolean)
      .map((m) => ({
        id: m.id,
        url: m.url,
        mimeType: m.mimeType,
        originalName: m.originalName,
        createdAt: String(m.createdAt),
      }));

    reset({
      title: initialEvent.title ?? "",
      slug: initialEvent.slug ?? "",
      lang: initialEvent.lang ?? Language.EN,
      status: initialEvent.status ?? EventStatus.DRAFT,
      excerpt: initialEvent.excerpt ?? "",
      content: initialEvent.content ?? "",

      startDateTime: toDateTimeLocal(initialEvent.startDateTime),
      endDateTime: toDateTimeLocal(initialEvent.endDateTime),
      timezone: initialEvent.timezone ?? "Asia/Kathmandu",

      isOnline: !!initialEvent.isOnline,
      onlineLink: initialEvent.onlineLink ?? "",
      locationName: initialEvent.locationName ?? "",
      locationAddress: initialEvent.locationAddress ?? "",
      registrationUrl: initialEvent.registrationUrl ?? "",

      isFeatured: !!initialEvent.isFeatured,

      parentId: "",
      childId: "",

      cover: coverMedia,
      attachments: att,
    });
  }, [isEdit, initialEvent, reset]);

  // After categories load, set parentId/childId from initialEvent.categoryId
  useEffect(() => {
    if (!isEdit || !initialEvent?.categoryId) return;
    if (!parentCategories.length) return;

    const catId = initialEvent.categoryId;

    const parent = parentCategories.find((p) => p.id === catId);
    if (parent) {
      setValue("parentId", parent.id);
      setValue("childId", "");
      return;
    }

    for (const p of parentCategories) {
      const child = (p.children ?? []).find((c) => c.id === catId);
      if (child) {
        setValue("parentId", p.id);
        setTimeout(() => setValue("childId", child.id), 0);
        return;
      }
    }
  }, [isEdit, initialEvent?.categoryId, parentCategories, setValue]);

  // Mutations
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

  const createEventMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await createEvent({
        title: values.title,
        slug: values.slug.trim() || null,
        lang: values.lang,
        status: values.status,
        excerpt: values.excerpt.trim() || null,
        content: values.content,

        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime.trim() || null,
        timezone: values.timezone.trim() || "Asia/Kathmandu",

        isOnline: values.isOnline,
        onlineLink: values.onlineLink.trim() || null,
        locationName: values.locationName.trim() || null,
        locationAddress: values.locationAddress.trim() || null,
        registrationUrl: values.registrationUrl.trim() || null,

        isFeatured: values.isFeatured,
        coverMediaId: values.cover?.id ?? null,
        attachmentMediaIds: values.attachments.map((a) => a.id),
        categoryId: finalCategoryId,
      });

      if (!res.ok) throw new Error(res.error || "Failed to create event");
      return true;
    },
    onSuccess: () =>{
      toast.success("Event Created Successfully!!!" );
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      router.replace("/admin/events");
    },
    onError: (error: any) => toast.error(error.message || "Operation Failed!!!"),
  });
  
  const updateEventMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!initialEvent?.id) throw new Error("Missing event id");
      const res = await updateEvent({
        id: initialEvent.id,
        title: values.title,
        lang: values.lang,
        status: values.status,
        excerpt: values.excerpt.trim() || null,
        content: values.content,

        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime.trim() || null,
        timezone: values.timezone.trim() || "Asia/Kathmandu",

        isOnline: values.isOnline,
        onlineLink: values.onlineLink.trim() || null,
        locationName: values.locationName.trim() || null,
        locationAddress: values.locationAddress.trim() || null,
        registrationUrl: values.registrationUrl.trim() || null,

        isFeatured: values.isFeatured,
        coverMediaId: values.cover?.id ?? null,
        attachmentMediaIds: values.attachments.map((a) => a.id),
        categoryId: finalCategoryId,
      });

      if (!res.ok) throw new Error(res.error || "Failed to update event");
      return true;
    },
    onSuccess: () => {
      toast.success("Event Updated Successfully!!!");
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      router.replace("/admin/events");
    },
    onError: (error: any) => toast.error(error.message || "Update Failed!!!"),
  });

  function selectMedia(item: Media) {
    if (pickerOpen === "cover") {
      setValue("cover", item);
      setPickerOpen(null);
      return;
    }
    if (pickerOpen === "attachments") {
      const current = watch("attachments") || [];
      if (current.some((x) => x.id === item.id)) return;
      setValue("attachments", [...current, item]);
    }
  }

  function autoEndPlus24h() {
    if (!startDateTime) return;
    const start = new Date(startDateTime);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const iso = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setValue("endDateTime", iso);
  }

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0 && startDateTime.trim().length > 0;
  }, [title, content, startDateTime]);

  const mediaItems = medias?.items ?? [];
  const totalPages = medias?.totalPages ?? 1;

  const onSubmit = handleSubmit(async (values) => {
    if (isArchived) {
      toast.error("Archived events are locked.");
      return;
    }
    if (isEdit) updateEventMutation.mutate(values);
    else createEventMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 shadow-xl p-4 rounded-2xl max-w-7xl">
      {/* Basic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select
            {...register("status")}
            className="rounded-xl border p-2"
            disabled={isArchived}
          >
            {Object.values(EventStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Language</span>
          <select {...register("lang")} className="rounded-xl border p-2">
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Timezone</span>
          <input {...register("timezone")} className="rounded-xl border p-2 cursor-not-allowed" disabled />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input {...register("title")} className="rounded-xl border p-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug (optional)</span>
        <input
          {...register("slug")}
          className="rounded-xl border p-2"
          placeholder="leave empty to auto-generate"
          disabled={isEdit} // ✅ lock slug in edit
        />
      </label>

      {/* Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Parent Category (optional)</span>
          <select
            {...register("parentId")}
            onChange={(e) => {
              setValue("parentId", e.target.value);
              setValue("childId", "");
            }}
            className="rounded-xl border p-2"
            disabled={catLoading}
          >
            <option value="">— None —</option>
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Subcategory (optional)</span>
          <select
            {...register("childId")}
            className="rounded-xl border p-2"
            disabled={!parentId || childOptions.length === 0}
          >
            <option value="">— None —</option>
            {childOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            If subcategory is selected, it will be saved as the event category.
          </span>
        </label>
      </div>

      {/* Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Start Date & Time</span>
          <input type="datetime-local" {...register("startDateTime")} className="rounded-xl border p-2" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">End Date & Time (optional)</span>
          <input type="datetime-local" {...register("endDateTime")} className="rounded-xl border p-2" />
          <button
            type="button"
            onClick={autoEndPlus24h}
            className="mt-2 rounded-xl border px-3 py-2 text-sm w-fit"
            disabled={!startDateTime}
          >
            +24 hours
          </button>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Featured</span>
          <div className="flex items-center gap-2 rounded-xl border p-2">
            <input type="checkbox" {...register("isFeatured")} />
            <span className="text-sm">Mark as featured</span>
          </div>
        </label>
      </div>

      {/* Online/Location */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("isOnline")} />
          <span className="text-sm font-medium">Online event</span>
        </div>

        {isOnline ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Online Link</span>
            <input {...register("onlineLink")} className="rounded-xl border p-2" placeholder="https://..." />
          </label>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Location Name</span>
              <input {...register("locationName")} className="rounded-xl border p-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Location Address</span>
              <input {...register("locationAddress")} className="rounded-xl border p-2" />
            </label>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Registration URL (optional)</span>
          <input {...register("registrationUrl")} className="rounded-xl border p-2" placeholder="https://..." />
        </label>
      </div>

      {/* Content */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt (optional)</span>
        <textarea {...register("excerpt")} className="rounded-xl border p-2" rows={3} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content</span>
        <textarea {...register("content")} className="rounded-xl border p-2" rows={10} />
      </label>

      {/* Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("cover")}>
          {cover ? "Change Cover" : "Choose Cover"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setPickerOpen("attachments")}>
          Add Attachments ({attachments.length})
        </button>
      </div>

      {cover ? <div className="text-sm text-gray-600">Cover: {cover.originalName}</div> : null}

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
                  onClick={() => setValue("attachments", attachments.filter((x) => x.id !== a.id))}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          !canSubmit ||
          isArchived ||
          createEventMutation.isPending ||
          updateEventMutation.isPending
        }
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {isEdit
          ? updateEventMutation.isPending
            ? "Saving..."
            : "Save Changes"
          : createEventMutation.isPending
          ? "Creating..."
          : "Create Event"}
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
                disabled={mediaFetching}
              >
                {mediaFetching ? "Searching..." : "Search"}
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

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} {medias ? `• Total ${medias.total}` : ""}
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

            {mediaLoading ? <div className="text-sm text-gray-500 mt-3">Loading media...</div> : null}

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
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                      alt={m.originalName}
                      height={28}
                      width={28}
                      unoptimized={process.env.NODE_ENV !== "production"}
                      className="mt-2 h-28 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="mt-2 h-28 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                      FILE
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
                <button
                  type="button"
                  className="rounded-xl bg-black px-4 py-2 text-white"
                  onClick={() => setPickerOpen(null)}
                >
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