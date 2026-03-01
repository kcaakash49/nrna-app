"use server";

import {prisma} from "@/lib/prisma";

import { PostStatus, Language } from "@prisma/client";

type Input = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: PostStatus;
  lang?: Language;
};

export async function getGalleryAlbums(input: Input) {
 
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.min(48, Math.max(1, Number(input.pageSize || 12)));
  const skip = (page - 1) * pageSize;

  const q = input.q?.trim();
  const where: any = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.lang ? { lang: input.lang } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.galleryAlbum.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        lang: true,
        description: true,
        createdAt: true,
        coverMedia: {
          select: {
            id: true,
            url: true,
          },
        },
        _count: { select: { photos: true } },
      },
    }),
    prisma.galleryAlbum.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}