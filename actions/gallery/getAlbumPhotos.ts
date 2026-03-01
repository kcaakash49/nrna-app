"use server";

import { requireAdmin } from "@/lib/auth";
import {prisma} from "@/lib/prisma";


export async function getAlbumPhots(albumId: string) {
  await requireAdmin();

  const album = await prisma.galleryAlbum.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      lang: true,
      eventId: true,
      createdAt: true,
      updatedAt: true,
      coverMedia: { select: { id: true, url: true, mimeType: true, originalName: true } },
      photos: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          caption: true,
          order: true,
          media: { select: { id: true, url: true, mimeType: true, originalName: true } },
        },
      },
      _count: { select: { photos: true } },
      event: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!album) return null;
  return album;
}