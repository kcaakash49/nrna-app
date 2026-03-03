
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { EventStatus, Language } from "@prisma/client";
import { slugify } from "@/lib/lib";



async function ensureUniqueEventSlug(base: string) {
  let slug = base || "event";
  let i = 0;

  // Try slug, slug-2, slug-3...
  while (true) {
    const exists = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i + 1}`;
  }
}

type CreateEventInput = {
  title: string;
  slug?: string | null;
  lang: Language;
  status: EventStatus;

  excerpt?: string | null;
  content: string;

  startDateTime: string; // ISO from client
  endDateTime?: string | null; // ISO or null
  timezone?: string | null;

  locationName?: string | null;
  locationAddress?: string | null;
  isOnline: boolean;
  onlineLink?: string | null;
  registrationUrl?: string | null;

  isFeatured: boolean;

  coverMediaId?: string | null;
  attachmentMediaIds?: string[];

  categoryId?: string | null;
};

export async function createEvent(input: CreateEventInput) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const title = (input.title ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  const content = (input.content ?? "").trim();
  if (!content) return { ok: false, error: "Content is required." };

  // Parse dates
  const start = new Date(input.startDateTime);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Start date/time is invalid." };

  let end: Date | null = null;
  if (input.endDateTime) {
    const e = new Date(input.endDateTime);
    if (Number.isNaN(e.getTime())) return { ok: false, error: "End date/time is invalid." };
    end = e;
  }

  const baseSlug = slugify(input.slug?.trim() || title);
  const slug = await ensureUniqueEventSlug(baseSlug);

  // Optional sanity for online
  if (input.isOnline && input.onlineLink && !/^https?:\/\//i.test(input.onlineLink)) {
    return { ok: false, error: "Online link must start with http:// or https://." };
  }

  try {
    const created = await prisma.event.create({
      data: {
        title,
        slug,
        lang: input.lang,
        status: input.status,

        excerpt: input.excerpt?.trim() || null,
        content,

        startDateTime: start,
        endDateTime: end,
        timezone: input.timezone?.trim() || "Asia/Kathmandu",

        isOnline: !!input.isOnline,
        onlineLink: input.isOnline ? (input.onlineLink?.trim() || null) : null,
        locationName: input.isOnline ? null : (input.locationName?.trim() || null),
        locationAddress: input.isOnline ? null : (input.locationAddress?.trim() || null),
        registrationUrl: input.registrationUrl?.trim() || null,

        isFeatured: !!input.isFeatured,

        coverMediaId: input.coverMediaId || null,
        categoryId: input.categoryId || null,

        createdById: admin.id,
        updatedById: admin.id,

        attachments: input.attachmentMediaIds?.length
          ? {
              createMany: {
                data: input.attachmentMediaIds.map((mediaId) => ({ mediaId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      select: { id: true, slug: true },
    });

    revalidatePath("/admin/events");
    return { ok: true, event: created };
  } catch (e: any) {
    console.error(e);
    return { ok: false, error: "Failed to create event." };
  }
}