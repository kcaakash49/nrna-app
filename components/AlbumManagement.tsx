"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import MediaPickerModal from "./MediaPickerModal";
import { addAlbumPhotos } from "@/actions/gallery/addAlbumPhotos";
import { updateAlbumStatus } from "@/actions/gallery/galleryUpdateDelete";
import { bindAlbumEvent } from "@/actions/gallery/galleryUpdateDelete";
import { deleteAlbum } from "@/actions/gallery/galleryUpdateDelete";
import { toast } from "sonner";
import PhotoCard from "./PhotoCard";

export default function AlbumManageClient({ album }: { album: any }) {
  const [isPending, startTransition] = useTransition();

  const [pickerOpen, setPickerOpen] = useState<"images" | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const coverUrl = album.coverMedia?.url
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${album.coverMedia.url}`
    : null;

  const onAddPhotos = () => {
    setSelectedIds([]);
    setPickerOpen("images");
  };

  const saveSelectedPhotos = () => {
    startTransition(async () => {
      const res = await addAlbumPhotos(album.id, selectedIds);
      if (!res.ok) alert(res.error);
      setPickerOpen("images");
    });
  };

  const setStatus = (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    startTransition(async () => {
      await updateAlbumStatus(album.id, status as any);
    });
  };

  const bindEvent = () => {
    // Simple version: prompt for eventId (fastest).
    // Later we can replace with an Event picker modal.
    const eventId = window.prompt("Enter Event ID (leave empty to unbind):", album.eventId || "");
    startTransition(async () => {
      await bindAlbumEvent(album.id, eventId?.trim() ? eventId.trim() : null);
    });
  };

  const onDelete = () => {
    const ok = window.confirm("Delete this album? This will remove all photos in it.");
    if (!ok) return;
    startTransition(async () => {
      await deleteAlbum(album.id);
    });
  };

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/gallery" className="text-sm text-muted-foreground hover:underline">
            ← Back to albums
          </Link>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight line-clamp-1">
            {album.title}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
            /{album.slug} • {album._count.photos} photos
          </div>

          {album.event ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
              Bound to event: <span className="font-medium">{album.event.title}</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">Not bound to any event</div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAddPhotos}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            disabled={isPending}
          >
            + Add Photos
          </button>

          <button
            onClick={bindEvent}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
            disabled={isPending}
          >
            Bind Event
          </button>

          <Link
            href={`/admin/gallery/${album.id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
          >
            Edit
          </Link>

          <button
            onClick={onDelete}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
            disabled={isPending}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Cover + Status controls */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="relative aspect-[16/7] bg-muted">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={album.title}
                fill
                className="object-cover"
                unoptimized={process.env.NODE_ENV !== "production"}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No cover selected
              </div>
            )}
          </div>
          {album.description ? (
            <div className="p-4 text-sm text-muted-foreground">{album.description}</div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No description</div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Status</div>
          <div className="mt-3 grid gap-2">
            <button
              onClick={() => setStatus("DRAFT")}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
              disabled={isPending}
            >
              Set DRAFT
            </button>
            <button
              onClick={() => setStatus("PUBLISHED")}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
              disabled={isPending}
            >
              Set PUBLISHED
            </button>
            <button
              onClick={() => setStatus("ARCHIVED")}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
              disabled={isPending}
            >
              Set ARCHIVED
            </button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Current: <span className="font-medium">{album.status}</span>
          </div>
        </div>
      </div>

      {/* Photos grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Photos</h2>
          <button
            onClick={onAddPhotos}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
          >
            Add more
          </button>
        </div>

        {album.photos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No photos yet. Click <span className="font-medium">Add Photos</span> to upload/select media.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {album.photos.map((p: any) => {
              const img = p.media?.url
                ? `${process.env.NEXT_PUBLIC_BASE_URL}${p.media.url}`
                : null;

              return (
                <PhotoCard
                  key={p.id}
                  albumId={album.id}
                  photo={p}
                  img={img}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Media picker modal */}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(null)}
        mode="multiple"
        selectedIds={selectedIds}
        onChangeSelected={(next) => setSelectedIds(next)}
        confirmLabel="Add photos"
        onConfirmMultiple={async (ids) => {
          const res = await addAlbumPhotos(album.id, ids);
          if (!res.ok) {
            toast.error("Couldn't add photos!!!")
            throw new Error("Add failed");
          }
        }}
      />
    </div>
  );
}