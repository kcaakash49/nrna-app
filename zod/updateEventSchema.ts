import { EventStatus, Language } from "@prisma/client";
import {z} from "zod";

export const updateEventSchema = z.object({
  id: z.string().uuid(),

  title: z.string().min(1),
  slug: z.string().optional().nullable(), // we won't allow changing slug in edit UI anyway
  lang: z.nativeEnum(Language),
  status: z.nativeEnum(EventStatus),

  excerpt: z.string().optional().nullable(),
  content: z.string().min(1),

  startDateTime: z.string().min(1),
  endDateTime: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),

  isOnline: z.boolean(),
  onlineLink: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  registrationUrl: z.string().optional().nullable(),

  isFeatured: z.boolean(),
  coverMediaId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),

  attachmentMediaIds: z.array(z.string().uuid()).optional().default([]),
});

export type UpdateEventSchema = z.infer<typeof updateEventSchema>