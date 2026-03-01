"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGalleryAlbum } from "@/actions/gallery/createGalleryAlbum";
import { PostStatus, Language } from "@prisma/client";

import MediaPickerModal from "./MediaPickerModal";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function GalleryAlbumCreateForm() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [lang, setLang] = useState<Language | "">("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [open, setOpen] = useState<"cover" | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await createGalleryAlbum({
        title,
        slug: slug.trim() || undefined,
        description,
        status,
        lang: lang ? (lang as Language) : null,
        coverMediaId,
      });
      if (!res.ok) {
        throw new Error(res.error || "Couldn't create album!!!")
      }
      return true;

    },
    onSuccess:() => {
      toast.success("Album Created Successfully!!!");
      router.replace("/admin/gallery");
    },
    onError: () => {
      toast.error("Operation Failed!!!")
    }
  })


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate();
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
          disabled = {isPending}
        >
          { isPending ? "Creating...." : "Create Album"}
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
      {
        open === "cover" && (
          <MediaPickerModal
            open={open}
            onClose={() => setOpen(null)}
            mode="single"
            title="Select Cover Image"
            onSelectOne={(m) => setCoverMediaId(m.id)}
          />
        )
      }
    </form>
  );
}