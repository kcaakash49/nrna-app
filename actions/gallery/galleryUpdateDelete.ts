"use server";

import {prisma} from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UpdateAlbumInput } from "@/types/album";


//update album status 
export async function updateAlbumStatus(albumId: string, status: PostStatus) {
  const admin = await requireAdmin();
   const result = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if(!result){
    return {
      ok:false,
      error: "No such album exist!!!"
    }
  }
  if (result.status === "ARCHIVED"){
    return {
      ok: false,
      error: "Album already archived"
    }
  }

  await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: { status, updatedById: admin.id },
  });

  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath(`/admin/gallery`);
  return { ok: true };
}

//bind events to albums
export async function bindAlbumEvent(albumId: string, eventId: string | null) {
  const admin = await requireAdmin();

  const album = await prisma.galleryAlbum.findUnique({
    where: { id: albumId },
    select: { id: true, status: true },
  });

  if (!album) return { ok: false, error: "No such album exist!!!" };

  if (album.status === "ARCHIVED") {
    return { ok: false, error: "Archived albums cannot be modified." };
  }


  if (!eventId) {
    await prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { eventId: null, updatedById: admin.id },
    });
    revalidatePath(`/admin/gallery/${albumId}`);
    return { ok: true };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });

  if (!event) return { ok: false, error: "Event does not exist." };

  if (event.status === "ARCHIVED") {
    return { ok: false, error: "Cannot attach album to an archived event." };
  }

  await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: { eventId, updatedById: admin.id },
  });

  revalidatePath(`/admin/gallery/${albumId}`);
  return { ok: true };
}

//delete albums
export async function deleteAlbum(albumId: string) {
  await requireAdmin();

  const result = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if(!result){
    return {
      ok:false,
      error: "No such album exist!!!"
    }
  }
  if (result.status === "ARCHIVED"){
    return {
      ok:false,
      error: "Album already archived"
    }
  }
  await prisma.galleryAlbum.delete({where: {id:albumId}});

  revalidatePath(`/admin/gallery`);
  redirect("/admin/gallery");
}

//delete photos from album
export async function removeAlbumPhoto(albumId: string, photoId: string) {
  await requireAdmin();
  const result = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if(!result){
    return {
      ok:false,
      error: "No such album exist!!!"
    }
  }
  if (result.status === "ARCHIVED"){
    return {
      ok:false,
      error: "Album already archived"
    }
  }

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

//update album cover
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
  const result = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if(!result){
    return {
      ok:false,
      error: "No such album exist!!!"
    }
  }
  if (result.status === "ARCHIVED"){
    return {
      ok:false,
      error: "Album already archived"
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

//updating gallery info
export async function updateGalleryAlbum(input: UpdateAlbumInput) {
  const admin = await requireAdmin();

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Title is required" };

  const result = await prisma.galleryAlbum.findUnique({where: {id:input.id}});
  if(!result){
    return {
      success:false,
      error: "Album doens't exist!!!"
    }
  }

  if(result.status === "ARCHIVED"){
    return {
      success: false,
      error: "Archived albums cannot be updated"
    }
  }

  try {
    await prisma.galleryAlbum.update({
      where: { id: input.id },
      data: {
        title,
        description: input.description?.trim() || null,
        status: input.status ?? "DRAFT",
        lang: input.lang ?? null,
        coverMediaId: input.coverMediaId || null,
        updatedById: admin.id,
        // slug is intentionally NOT updated
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath(`/admin/gallery/${input.id}`);

    return { ok: true };
  } catch (err: any) {
    throw err;
  }
}