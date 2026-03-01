"use server";

import { requireAdmin } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

import { revalidatePath } from "next/cache";

export async function addAlbumPhotos(albumId: string, mediaIds: string[]) {
  const admin = await requireAdmin();

  const ids = Array.from(new Set(mediaIds)).filter(Boolean);
  if (!ids.length) return { ok: false, error: "No media selected" };

  // Avoid duplicates
  const existing = await prisma.galleryPhoto.findMany({
    where: { albumId, mediaId: { in: ids } },
    select: { mediaId: true },
  });
  const existingSet = new Set(existing.map((e) => e.mediaId));
  const toCreate = ids.filter((id) => !existingSet.has(id));

  if (!toCreate.length) return { ok: true, created: 0 };

  await prisma.$transaction([
    prisma.galleryPhoto.createMany({
      data: toCreate.map((mediaId) => ({ albumId, mediaId })),
    }),
    prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { updatedById: admin.id },
    }),
  ]);

  revalidatePath(`/admin/gallery/${albumId}`);
  return { ok: true, created: toCreate.length };
}