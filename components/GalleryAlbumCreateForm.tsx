"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PostStatus, Language } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import MediaPickerModal from "./MediaPickerModal";
import { createGalleryAlbum } from "@/actions/gallery/createGalleryAlbum";
import { updateGalleryAlbum } from "@/actions/gallery/galleryUpdateDelete";
import { AlbumInitial } from "@/types/album";



export default function GalleryAlbumForm({
  mode,
  initialAlbum,
}: {
  mode: "create" | "edit";
  initialAlbum?: AlbumInitial;
}) {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [lang, setLang] = useState<Language | "">("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);

  const [open, setOpen] = useState<"cover" | null>(null);

  // ✅ preload on edit
  useEffect(() => {
    if (mode === "edit" && initialAlbum) {
      setTitle(initialAlbum.title || "");
      setSlug(initialAlbum.slug || "");
      setDescription(initialAlbum.description || "");
      setStatus(initialAlbum.status || "DRAFT");
      setLang((initialAlbum.lang as any) || "");
      setCoverMediaId(initialAlbum.coverMediaId || null);
    }
  }, [mode, initialAlbum]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "create") {
        const res = await createGalleryAlbum({
          title,
          slug: slug.trim() || undefined,
          description,
          status,
          lang: lang ? (lang as Language) : null,
          coverMediaId,
        });
        if (!res.ok) throw new Error(res.error || "Couldn't create album");
        return { id: res.album?.id };
      }

      // edit
      if (!initialAlbum?.id) throw new Error("Missing album id");

      const res = await updateGalleryAlbum({
        id: initialAlbum.id,
        title,
        description,
        status,
        lang: lang ? (lang as Language) : null,
        coverMediaId,
      });

      if (!res.ok) throw new Error(res.error || "Couldn't update album");
      return { id: initialAlbum.id };
    },
    onSuccess: (payload) => {
      toast.success(mode === "create" ? "Album created!" : "Album updated!");
      if (mode === "create") router.replace("/admin/gallery");
      else router.replace(`/admin/gallery/${payload.id}`);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Operation failed!");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. कार्यक्रम फोटोहरू"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Slug *</label>
          <input
            className={`mt-2 w-full rounded-md border px-3 py-2 ${
              mode === "edit" ? "bg-muted/40 text-muted-foreground" : ""
            }`}
            value={slug}
            onChange={(e) => {
              if (mode === "edit") return; // ✅ lock slug in edit
              setSlug(e.target.value);
            }}
            placeholder="e.g. कार्यक्रम-फोटोहरू-2026"
            readOnly={mode === "edit"}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "edit"
              ? "Slug can’t be changed after creation."
              : "Unicode supported (Nepali slugs allowed)."}
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
            onClick={() => setOpen("cover")}
            className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
            disabled={mutation.isPending}
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
              className="text-sm underline disabled:opacity-60"
              disabled={mutation.isPending}
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
          className="rounded-md bg-black px-5 py-2.5 text-white hover:opacity-90 disabled:opacity-60"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create Album"
            : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() =>
            mode === "create"
              ? router.push("/admin/gallery")
              : router.push(`/admin/gallery/${initialAlbum?.id}`)
          }
          className="rounded-md border px-5 py-2.5 disabled:opacity-60"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
      </div>

      {/* Media Picker Modal */}
      {open === "cover" ? (
        <MediaPickerModal
          open={open}
          onClose={() => setOpen(null)}
          mode="single"
          title="Select Cover Image"
          onSelectOne={(m) => {
            if (!m.mimeType.startsWith("image/")) {
              toast.error("Cover must be an image.");
              return;
            }
            setCoverMediaId(m.id);
          }}
        />
      ) : null}
    </form>
  );
}