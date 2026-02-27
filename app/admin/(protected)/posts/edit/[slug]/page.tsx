import PostForm from "@/components/Post-Form";
import {prisma} from "@/lib/prisma";
import { notFound } from "next/navigation";


export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const param = await params;
  const post = await prisma.post.findUnique({
    where: { slug: param.slug },
    include: {
      coverMedia: { select: { id: true, url: true, mimeType: true, originalName: true, createdAt: true } },
      ogMedia: { select: { id: true, url: true, mimeType: true, originalName: true, createdAt: true } },
      attachments: {
        include: {
          media: { select: { id: true, url: true, mimeType: true, originalName: true, createdAt: true } },
        },
      },
    },
  });

  if (!post) return notFound();

  return (
    <div className="p-6">
      <PostForm mode="edit" initialPost={post as any} />
    </div>
  );
}