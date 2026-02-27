"use server"
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/auth-api";
import { UserRole, PostStatus, PostType, Language, PageTemplate} from "@prisma/client";
import { CreatePostType } from "@/types/postType";

function slugify(input: string) {
  const s = input
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    // remove quotes
    .replace(/['"]/g, "")
    // turn spaces/underscores into hyphen
    .replace(/[\s_]+/g, "-")
    // remove anything that's NOT letter/number/hyphen (unicode-safe)
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim hyphens
    .replace(/^-+|-+$/g, "");

  return s;
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  let i = 2;
  while (true) {
    const exists = await prisma.post.findFirst({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}


export async function createPostAction(payload: CreatePostType) {
  const auth = await requireRoleApi([UserRole.SUPER_ADMIN, UserRole.EDITOR]);
  if (!auth.ok) throw new Error("Unauthorized")

  const body = payload;

  const type = body.type as PostType;
  const status = (body.status as PostStatus) ?? PostStatus.DRAFT;
  const lang = body.lang as Language;

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!type || !lang) throw new Error("Type/lang required")
  if (!title) throw new Error("Title required")
  if (!content) throw new Error("Content required")

  const baseSlug = slugify(String(body.slug ?? "").trim() || title);
  const slug = await ensureUniqueSlug(baseSlug);

  const coverMediaId = (String(body.coverMediaId ?? "").trim() || null) as string | null;
  const ogMediaId = (String(body.ogMediaId ?? "").trim() || null) as string | null;

  const attachmentMediaIds = Array.isArray(body.attachmentMediaIds)
    ? (body.attachmentMediaIds as string[]).filter(Boolean)
    : [];

  const pageTemplate =
    type === PostType.PAGE
      ? ((body.pageTemplate ?? PageTemplate.STANDARD) as PageTemplate)
      : null;

  const post = await prisma.post.create({
    data: {
      type,
      status,
      lang,
      title,
      slug,
      excerpt: body.excerpt?.trim?.() || null,
      content,
      coverMediaId,
      ogMediaId,
      isFeatured: !!body.isFeatured,
      isPinned: !!body.isPinned,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      translationGroupId: body.translationGroupId || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      pageTemplate: pageTemplate ?? undefined,
      createdById: auth.user!.id,
      updatedById: auth.user!.id,
      attachments: {
        create: attachmentMediaIds.map((mediaId) => ({ mediaId })),
      },
    },
    select: { id: true, slug: true },
  });

  return {
    success: true, post
  };
}

