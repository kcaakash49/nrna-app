"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createGalleryAlbum } from "@/actions/gallery/createGalleryAlbum";
import { PostStatus, Language } from "@prisma/client";


import { useFetchMediaQueries } from "@/hooks/useFetchMediaQueries"; 

export default function GalleryAlbumCreateForm() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [lang, setLang] = useState<Language | "">("");
  const [eventId, setEventId] = useState(""); // optional for now
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);

  // media picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const pageSize = 24;

  // ✅ only fetch media when picker open
  const mediaQuery = useFetchMediaQueries({
    page,
    q,
    pageSize,
    enabled: pickerOpen, // <-- important
  } as any); // remove `as any` if your hook already accepts enabled in types

  const coverPreview = useMemo(() => {
    if (!coverMediaId) return null;
    const found = mediaQuery.data?.items?.find((m: any) => m.id === coverMediaId);
    return found || null;
  }, [coverMediaId, mediaQuery.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await createGalleryAlbum({
      title,
      slug: slug.trim() || undefined,
      description,
      status,
      lang: lang ? (lang as Language) : null,
      coverMediaId,
      eventId: eventId || null,
    });

    if (!res.ok) {
      alert(res.error);
      return;
    }

    router.push("/admin/gallery");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={title}
            onChange={(e) => {
              const v = e.target.value;
              setTitle(v);
            }}
            placeholder="e.g. कार्यक्रम फोटोहरू"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Slug *</label>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. कार्यक्रम-फोटोहरू-2026"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Unicode supported (Nepali slugs allowed).
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="mt-2 w-full rounded-md border px-3 py-2 min-h-[90px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Language</label>
          <select
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
          >
            <option value="">Auto/None</option>
            <option value="NP">NP</option>
            <option value="EN">EN</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Event ID (optional)</label>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Paste eventId (later we can pick event)"
          />
        </div>
      </div>

      {/* Cover Media */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Cover Image</div>
            <div className="text-xs text-muted-foreground">
              Choose from Media library
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
          >
            {coverMediaId ? "Change Cover" : "Select Cover"}
          </button>
        </div>

        {coverMediaId ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <div className="text-sm">
              Selected Media ID: <span className="font-mono">{coverMediaId}</span>
            </div>
            <button
              type="button"
              onClick={() => setCoverMediaId(null)}
              className="text-sm underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            No cover selected.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-black px-5 py-2.5 text-white hover:opacity-90"
        >
          Create Album
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/gallery")}
          className="rounded-md border px-5 py-2.5"
        >
          Cancel
        </button>
      </div>

      {/* Media Picker Modal (simple) */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Select Cover Media</div>
                <div className="text-xs text-muted-foreground">
                  Search and pick an image
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-md border px-3 py-1.5"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search media..."
              />
            </div>

            <div className="mt-4 min-h-[200px]">
              {mediaQuery.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading...</div>
              ) : mediaQuery.isError ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load media.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {mediaQuery.data?.items?.map((m: any) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCoverMediaId(m.id);
                        setPickerOpen(false);
                      }}
                      className="rounded-lg border p-2 text-left hover:shadow-sm"
                      title={m.originalName || m.filename || m.id}
                    >
                      <div className="aspect-square w-full rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {/* swap this to <Image src={m.url} ...> once we confirm field */}
                        IMG
                      </div>
                      <div className="mt-2 line-clamp-1 text-xs">
                        {m.originalName || m.filename || m.id}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <div className="text-xs text-muted-foreground">
                Page {page}
              </div>

              <button
                type="button"
                className="rounded-md border px-3 py-1.5"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}