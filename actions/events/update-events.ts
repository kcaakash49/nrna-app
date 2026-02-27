"use server";

import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateEventSchema, UpdateEventSchema } from "@/zod/updateEventSchema";



export async function updateEvent(input: UpdateEventSchema ) {
  const data = updateEventSchema.parse(input);

  const existing = await prisma.event.findUnique({
    where: { id: data.id },
    select: { id: true, status: true, slug: true },
  });
  if (!existing) return { ok: false, error: "Event not found" };

  if (existing.status === "ARCHIVED") {
    return { ok: false, error: "Archived events are locked" };
  }

  // Convert datetime-local strings to Date
  const start = new Date(data.startDateTime);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid startDateTime" };

  const end = data.endDateTime ? new Date(data.endDateTime) : null;
  if (end && Number.isNaN(end.getTime())) return { ok: false, error: "Invalid endDateTime" };

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        // slug: keep unchanged (recommended)
        lang: data.lang,
        status: data.status,
        excerpt: data.excerpt ?? null,
        content: data.content,

        startDateTime: start,
        endDateTime: end,
        timezone: data.timezone ?? "Asia/Kathmandu",

        isOnline: data.isOnline,
        onlineLink: data.onlineLink ?? null,
        locationName: data.locationName ?? null,
        locationAddress: data.locationAddress ?? null,
        registrationUrl: data.registrationUrl ?? null,

        isFeatured: data.isFeatured,
        coverMediaId: data.coverMediaId ?? null,
        categoryId: data.categoryId ?? null,

        publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
      },
    });

    // replace attachments
    await tx.eventAttachment.deleteMany({ where: { eventId: data.id } });

    if (data.attachmentMediaIds.length) {
      await tx.eventAttachment.createMany({
        data: data.attachmentMediaIds.map((mediaId) => ({
          eventId: data.id,
          mediaId,
        })),
        skipDuplicates: true,
      });
    }
  });
  revalidatePath(`/admin/events/${existing.slug}`);
  return { ok: true };
}