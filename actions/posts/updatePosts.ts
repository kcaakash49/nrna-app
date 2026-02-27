"use server";

import {prisma} from "@/lib/prisma";
import { PostStatus, PostType, Language, PageTemplate } from "@prisma/client";
import { revalidatePath } from "next/cache";

type UpdatePostInput = {
  id: string;
  slug:string;
  type: PostType;
  status: PostStatus;
  lang: Language;

  title: string;
  excerpt: string | null;
  content: string;

  isFeatured: boolean;
  isPinned: boolean;

  pageTemplate: PageTemplate | null;

  coverMediaId: string | null;
  ogMediaId: string | null;
  attachmentMediaIds: string[];
};

export async function updatePostAction(input: UpdatePostInput) {
  try {
    const existing = await prisma.post.findUnique({
      where: { id: input.id },
      select: { id: true, status: true },
    });

    if (!existing) return { success: false, error: "Post not found" };

    // ✅ lock archived like events
    if (existing.status === "ARCHIVED") {
      return { success: false, error: "Archived posts are locked" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: input.id },
        data: {
          type: input.type,
          status: input.status,
          lang: input.lang,

          title: input.title,
          excerpt: input.excerpt,
          content: input.content,

          isFeatured: input.isFeatured,
          isPinned: input.isPinned,

          pageTemplate: input.type === "PAGE" ? input.pageTemplate ?? "STANDARD" : null,

          coverMediaId: input.coverMediaId,
          ogMediaId: input.ogMediaId,
          publishedAt:
            input.status === "PUBLISHED"
              ? existing.status === "PUBLISHED"
                ? undefined
                : new Date()
              : undefined,
        },
        
      });

      // replace attachments
      await tx.postAttachment.deleteMany({ where: { postId: input.id } });

      if (input.attachmentMediaIds?.length) {
        await tx.postAttachment.createMany({
          data: input.attachmentMediaIds.map((mediaId) => ({
            postId: input.id,
            mediaId,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath("/admin/posts");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update post" };
  }
}