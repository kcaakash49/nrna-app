"use server";

import {prisma} from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// If you have auth/role guards, call them inside each action.
// import { requireAdmin } from "@/lib/auth"; // example

const EventStatusEnum = z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]);
const LangEnum = z.enum(["EN", "NP"]);

const ListEventsSchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).optional().default("ALL"),
  categoryId: z.string().uuid().optional(),
  lang: z.enum(["ALL", "EN", "NP"]).optional().default("ALL"),
  time: z.enum(["ALL", "UPCOMING", "PAST", "RANGE"]).optional().default("ALL"),
  from: z.string().optional(), // ISO date string (YYYY-MM-DD) or full ISO
  to: z.string().optional(),
  featured: z.enum(["ALL", "1", "0"]).optional().default("ALL"),
  sort: z.enum(["CREATED_DESC", "UPDATED_DESC", "START_ASC", "START_DESC"]).optional().default("CREATED_DESC"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type ListEventsInput = z.input<typeof ListEventsSchema>;

function parseMaybeDate(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function adminListEvents(input: ListEventsInput) {
  // await requireAdmin();

  const parsed = ListEventsSchema.parse(input);
  const now = new Date();

  const where: any = {};

  // Search (title only)
  if (parsed.q) {
    where.title = { contains: parsed.q, mode: "insensitive" };
  }

  // Status
  if (parsed.status !== "ALL") {
    where.status = parsed.status;
  }

  // Category
  if (parsed.categoryId) {
    where.categoryId = parsed.categoryId;
  }

  // Language
  if (parsed.lang !== "ALL") {
    where.lang = parsed.lang;
  }

  // Featured
  if (parsed.featured !== "ALL") {
    where.isFeatured = parsed.featured === "1";
  }

  // Time filter (handles endDateTime nullable)
  if (parsed.time === "UPCOMING") {
    where.OR = [
      { endDateTime: { not: null, gte: now } },
      { endDateTime: null, startDateTime: { gte: now } },
    ];
  } else if (parsed.time === "PAST") {
    where.OR = [
      { endDateTime: { not: null, lt: now } },
      { endDateTime: null, startDateTime: { lt: now } },
    ];
  } else if (parsed.time === "RANGE") {
    const from = parseMaybeDate(parsed.from);
    const to = parseMaybeDate(parsed.to);

    // Simple range on startDateTime; easy + predictable
    // (We can later add "overlaps range" logic if needed.)
    if (from || to) {
      where.startDateTime = {};
      if (from) where.startDateTime.gte = from;
      if (to) where.startDateTime.lte = to;
    }
  }

  // Sort
  let orderBy: any = { createdAt: "desc" };
  if (parsed.sort === "UPDATED_DESC") orderBy = { updatedAt: "desc" };
  if (parsed.sort === "START_ASC") orderBy = { startDateTime: "asc" };
  if (parsed.sort === "START_DESC") orderBy = { startDateTime: "desc" };

  const skip = (parsed.page - 1) * parsed.pageSize;
  const take = parsed.pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        lang: true,
        isFeatured: true,
        startDateTime: true,
        endDateTime: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / parsed.pageSize));

  return {
    items,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    totalPages,
  };
}

export async function adminListEventCategories() {
  // await requireAdmin();

  // Simple list; you can add ordering by (parentId, order, name) etc.
  const categories = await prisma.eventCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, parentId: true, slug: true, order: true },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
  });

  return categories;
}

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: EventStatusEnum,
});

export async function adminUpdateEventStatus(input: z.input<typeof UpdateStatusSchema>) {
  const admin = await requireAdmin();

  const { id, status } = UpdateStatusSchema.parse(input);

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) throw new Error("Event not found.");

  // Lock archived
  if (existing.status === "ARCHIVED") {
    throw new Error("Archived events are locked and cannot be modified.");
  }

  await prisma.event.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      updatedById:admin.id
    },
  });

  revalidatePath("/admin/events");
  return { ok: true };
}

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function adminDeleteEvent(input: z.input<typeof DeleteSchema>) {
  await requireAdmin();

  const { id } = DeleteSchema.parse(input);

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { id: true, status: true, slug: true },
  });

  if (!existing) throw new Error("Event not found.");

  // No delete for archived
  if (existing.status === "ARCHIVED") {
    throw new Error("Archived events cannot be deleted.");
  }

  await prisma.event.delete({ where: { id } });

  revalidatePath("/admin/events");
  return { ok: true };
}

//fetch events
export async function fetchEvents({ page = 1, pageSize = 10, q = "" }) {
  const where = q
    ? { title: { contains: q, mode: Prisma.QueryMode.insensitive } }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}