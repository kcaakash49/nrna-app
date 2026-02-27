"use server";

import {prisma} from "@/lib/prisma";
import { PostStatus, PostType, Language } from "@prisma/client";
import { revalidatePath } from "next/cache";

type Sort =
  | "CREATED_DESC"
  | "UPDATED_DESC"
  | "PUBLISHED_DESC"
  | "TITLE_ASC";

type BoolFilter = "ALL" | "true" | "false";

export type AdminListPostsFilters = {
  q?: string;
  status?: "ALL" | PostStatus;
  type?: "ALL" | PostType;
  lang?: "ALL" | Language;
  featured?: BoolFilter;
  pinned?: BoolFilter;
  sort?: Sort;
  page?: number;
  pageSize?: number;
};

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseBoolFilter(v: BoolFilter | undefined) {
  if (!v || v === "ALL") return undefined;
  return v === "true";
}

function sortToOrderBy(sort: Sort | undefined) {
  switch (sort) {
    case "UPDATED_DESC":
      return [{ updatedAt: "desc" as const }];
    case "PUBLISHED_DESC":
      return [{ publishedAt: "desc" as const }, { updatedAt: "desc" as const }];
    case "TITLE_ASC":
      return [{ title: "asc" as const }];
    case "CREATED_DESC":
    default:
      return [{ createdAt: "desc" as const }];
  }
}

export async function adminListPosts(filters: AdminListPostsFilters) {
  const page = clampInt(Number(filters.page ?? 1), 1, 1_000_000);
  const pageSize = clampInt(Number(filters.pageSize ?? 10), 1, 100);

  const q = (filters.q ?? "").trim();
  const featured = parseBoolFilter(filters.featured);
  const pinned = parseBoolFilter(filters.pinned);

  const where: any = {
    ...(q
      ? {
          title: {
            contains: q,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.type && filters.type !== "ALL" ? { type: filters.type } : {}),
    ...(filters.lang && filters.lang !== "ALL" ? { lang: filters.lang } : {}),
    ...(typeof featured === "boolean" ? { isFeatured: featured } : {}),
    ...(typeof pinned === "boolean" ? { isPinned: pinned } : {}),
  };

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: sortToOrderBy(filters.sort),
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        lang: true,
        isFeatured: true,
        isPinned: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function adminUpdatePostStatus(input: { id: string; status: PostStatus }) {
  const existing = await prisma.post.findUnique({
    where: { id: input.id },
    select: { id: true, status: true, publishedAt: true },
  });

  if (!existing) return { ok: false, error: "Post not found" };

  // ✅ lock archived posts
  if (existing.status === "ARCHIVED") {
    return { ok: false, error: "Archived posts are locked" };
  }

  // If moving to PUBLISHED and publishedAt not set, set it.
  const shouldSetPublishedAt =
    input.status === "PUBLISHED" && !existing.publishedAt;

  await prisma.post.update({
    where: { id: input.id },
    data: {
      status: input.status,
      ...(shouldSetPublishedAt ? { publishedAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/posts");
  return { ok: true };
}

export async function adminDeletePost(input: { id: string }) {
  const existing = await prisma.post.findUnique({
    where: { id: input.id },
    select: { id: true, status: true },
  });

  if (!existing) return { ok: false, error: "Post not found" };

  // ✅ no delete for archived
  if (existing.status === "ARCHIVED") {
    return { ok: false, error: "Archived posts cannot be deleted" };
  }

  await prisma.post.delete({ where: { id: input.id } });

  revalidatePath("/admin/posts");
  return { ok: true };
}