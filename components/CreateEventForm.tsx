"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { EventStatus, Language } from "@prisma/client";

import { useFetchParentCategories } from "@/hooks/useFetchParentCategories"; // adjust path
import { createEvent } from "@/actions/events";
import { useFetchMediaQueries } from "@/hooks/useFetchMediaQueries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// If your hook is elsewhere, update import.

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

export default function EventForm() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  // Basic fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [lang, setLang] = useState<Language>(Language.EN);
  const [status, setStatus] = useState<EventStatus>(EventStatus.DRAFT);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Time
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kathmandu");

  // Location / online
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLink, setOnlineLink] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState<null | "cover" | "attachments">(null);
  const isPickerOpen = !!pickerOpen;


  const { data: medias, isLoading: mediaLoading, isFetching: mediaFetching } = useFetchMediaQueries({ page, q, pageSize,enabled:isPickerOpen });
  console.log(medias);
  const { data: parents = [], isLoading: catLoading } = useFetchParentCategories();
  const parentCategories = parents as unknown as EventCategory[];
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");

  const selectedParent = useMemo(() => {
    return parentCategories.find((p) => p.id === parentId) || null;
  }, [parentCategories, parentId]);

  const childOptions = selectedParent?.children ?? [];

  const finalCategoryId = childId || parentId || null;

  // Media
  const [cover, setCover] = useState<Media | null>(null);
  const [attachments, setAttachments] = useState<Media[]>([]);

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
    onError: () => {
      toast.error("Upload Failed!!!")
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const res = await createEvent({
        title,
        slug: slug.trim() || null,
        lang,
        status,
        excerpt: excerpt.trim() || null,
        content,
        startDateTime,
        endDateTime: endDateTime.trim() || null,
        timezone: timezone.trim() || "Asia/Kathmandu",

        isOnline,
        onlineLink: onlineLink.trim() || null,
        locationName: locationName.trim() || null,
        locationAddress: locationAddress.trim() || null,
        registrationUrl: registrationUrl.trim() || null,

        isFeatured,
        coverMediaId: cover?.id ?? null,
        attachmentMediaIds: attachments.map((a) => a.id),
        categoryId: finalCategoryId,
      });

      if (!res.ok) throw new Error(res.error || "Failed to create event");
      return true;
    },
    onSuccess: () => {
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
    if (pickerOpen === "attachments") {
      setAttachments((prev) => (prev.some((x) => x.id === item.id) ? prev : [...prev, item]));
    }
  }

  function autoEndPlus24h() {
    if (!startDateTime) return;
    const start = new Date(startDateTime);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    // Convert to "YYYY-MM-DDTHH:mm" format for datetime-local
    const iso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEndDateTime(iso);
  }

   async function submit() {
    createEventMutation.mutate();
  }


  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0 && startDateTime.trim().length > 0;
  }, [title, content, startDateTime]);

  
  const mediaItems = medias?.items ?? [];
  const totalPages = medias?.totalPages ?? 1;

  return (
    <div className="space-y-6 shadow-xl p-4 rounded-2xl max-w-7xl">
      {/* Basic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} className="rounded-xl border p-2">
            {Object.values(EventStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="rounded-xl border p-2">
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Timezone</span>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="rounded-xl border p-2 cursor-not-allowed" disabled />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border p-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug (optional)</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-xl border p-2" placeholder="leave empty to auto-generate" />
      </label>

      {/* Category - Option A */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Parent Category (optional)</span>
          <select
            value={parentId}
            onChange={(e) => {
              setParentId(e.target.value);
              setChildId(""); // reset child when parent changes
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
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
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
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="rounded-xl border p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">End Date & Time (optional)</span>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="rounded-xl border p-2"
          />
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
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <span className="text-sm">Mark as featured</span>
          </div>
        </label>
      </div>

      {/* Online/Location */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
          <span className="text-sm font-medium">Online event</span>
        </div>

        {isOnline ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Online Link</span>
            <input value={onlineLink} onChange={(e) => setOnlineLink(e.target.value)} className="rounded-xl border p-2" placeholder="https://..." />
          </label>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Location Name</span>
              <input value={locationName} onChange={(e) => setLocationName(e.target.value)} className="rounded-xl border p-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Location Address</span>
              <input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} className="rounded-xl border p-2" />
            </label>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Registration URL (optional)</span>
          <input value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} className="rounded-xl border p-2" placeholder="https://..." />
        </label>
      </div>

      {/* Content */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt (optional)</span>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="rounded-xl border p-2" rows={3} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content</span>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="rounded-xl border p-2" rows={10} />
      </label>

      {/* Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => { setPickerOpen("cover") }}>
          {cover ? "Change Cover" : "Choose Cover"}
        </button>
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => { setPickerOpen("attachments") }}>
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
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || createEventMutation.isPending}
        onClick={submit}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {createEventMutation.isPending ? "Creating..." : "Create Event"}
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} {medias ? `• Total ${medias.total}` : ""}
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || mediaFetching}
                >
                  Prev
                </button>
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || mediaFetching}
                >
                  Next
                </button>
              </div>
            </div>

            {mediaLoading ? <div className="text-sm text-gray-500">Loading media...</div> : null}

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