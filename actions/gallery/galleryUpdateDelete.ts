"use server";

import {prisma} from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAlbumStatus(albumId: string, status: PostStatus) {
  const admin = await requireAdmin();

  await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: { status, updatedById: admin.id },
  });

  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath(`/admin/gallery`);
  return { ok: true };
}

export async function bindAlbumEvent(albumId: string, eventId: string | null) {
  const admin = await requireAdmin();

  await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: { eventId: eventId || null, updatedById: admin.id },
  });

  revalidatePath(`/admin/gallery/${albumId}`);
  return { ok: true };
}

export async function deleteAlbum(albumId: string) {
  await requireAdmin();

  await prisma.galleryAlbum.delete({ where: { id: albumId } });

  revalidatePath(`/admin/gallery`);
  redirect("/admin/gallery");
}

export async function removeAlbumPhoto(albumId: string, photoId: string) {
  await requireAdmin();

  // ensure photo belongs to this album (safety)
  const photo = await prisma.galleryPhoto.findFirst({
    where: { id: photoId, albumId },
    select: { id: true },
  });

  if (!photo) return { ok: false, error: "Photo not found in this album." };

  await prisma.galleryPhoto.delete({ where: { id: photoId } });

  revalidatePath(`/admin/gallery/${albumId}`);
  return { ok: true };
}

export async function updateAlbumCover(albumId: string, coverMediaId: string | null) {
  const admin = await requireAdmin();

  // If setting cover, validate it's an image
  if (coverMediaId) {
    const media = await prisma.media.findUnique({
      where: { id: coverMediaId },
      select: { id: true, mimeType: true },
    });

    if (!media) return { ok: false, error: "Media not found" };
    if (!media.mimeType.startsWith("image/")) {
      return { ok: false, error: "Cover must be an image." };
    }
  }

  await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: {
      coverMediaId: coverMediaId || null,
      updatedById: admin.id,
    },
  });

  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath(`/admin/gallery`);
  return { ok: true };
}