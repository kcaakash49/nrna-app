"use server";

import {prisma} from "@/lib/prisma";
import { PostStatus, Language } from "@prisma/client";

import { revalidatePath } from "next/cache";

// If you already have slugify helper that supports Nepali Unicode, reuse it instead:

import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/lib";

type CreateAlbumInput = {
  title: string;
  slug?: string;
  description?: string;
  status?: PostStatus;
  lang?: Language | null;
  coverMediaId?: string | null;
  eventId?: string | null;
};

export async function createGalleryAlbum(input: CreateAlbumInput) {
  const admin = await requireAdmin();

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Title is required" };

  // slug: allow user input, else generate from title
  const rawSlug = (input.slug?.trim() || slugify(title)).trim();
  if (!rawSlug) return { ok: false, error: "Slug is required" };

  try {
    const album = await prisma.galleryAlbum.create({
      data: {
        title,
        slug: rawSlug,
        description: input.description?.trim() || null,
        status: input.status ?? "DRAFT",
        lang: input.lang ?? null,
        coverMediaId: input.coverMediaId || null,
        eventId: input.eventId || null,
        createdById: admin.id,
        updatedById: admin.id,
      },
      select: { id: true, slug: true },
    });

    revalidatePath("/admin/gallery");
    return { ok: true, album };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { ok: false, error: "Slug already exists. Try a different one." };
    }
    throw err;
  }
}