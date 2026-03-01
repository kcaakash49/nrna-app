"use client"
import { removeAlbumPhoto } from "@/actions/gallery/galleryUpdateDelete";
import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";

export default function PhotoCard({
  albumId,
  photo,
  img,
}: {
  albumId: string;
  photo: any;
  img: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const onRemove = () => {
    const ok = window.confirm("Remove this photo from the album?");
    if (!ok) return;

    startTransition(async () => {
      const res = await removeAlbumPhoto(albumId, photo.id);
      if (!res.ok) toast.error(res.error || "Couldn't remove photo");
      else toast.success("Removed from album");
    });
  };

  const isImage = photo.media?.mimeType?.startsWith("image/");

  return (
    <div className="group rounded-2xl border bg-white overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {img && isImage ? (
          <Image
            src={img}
            alt={photo.media.originalName || "photo"}
            fill
            className="object-cover"
            unoptimized={process.env.NODE_ENV !== "production"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            FILE
          </div>
        )}

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        </div>

        {/* Actions (hover) */}
        <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-white disabled:opacity-60"
          >
            {isPending ? "Removing..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="p-2">
        {photo.caption ? (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {photo.caption}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">&nbsp;</div>
        )}
      </div>
    </div>
  );
}