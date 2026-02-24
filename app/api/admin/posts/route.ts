import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/auth-api";
import { UserRole, PostStatus, PostType, Language, PageTemplate} from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export async function POST(req: Request) {
  const auth = await requireRoleApi([UserRole.SUPER_ADMIN, UserRole.EDITOR]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json();

  const type = body.type as PostType;
  const status = (body.status as PostStatus) ?? PostStatus.DRAFT;
  const lang = body.lang as Language;

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!type || !lang) return NextResponse.json({ error: "type/lang required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

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

  return NextResponse.json({ post }, { status: 201 });
}