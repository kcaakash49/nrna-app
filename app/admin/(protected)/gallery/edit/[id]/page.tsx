import GalleryAlbumForm from "@/components/GalleryAlbumCreateForm";
import { requireAdmin } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const album = await prisma.galleryAlbum.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      lang: true,
      coverMediaId: true,
    },
  });

  if (!album) return <div className="p-6">Album not found.</div>;

  return <GalleryAlbumForm mode="edit" initialAlbum={album as any} />;
}