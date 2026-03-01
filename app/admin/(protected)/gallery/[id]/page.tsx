
import { getAlbumPhots } from "@/actions/gallery/getAlbumPhotos";
import AlbumManageClient from "@/components/AlbumManagement";


export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbumPhots(id)

  if (!album) {
    return <div className="p-6">Album not found.</div>;
  }

  return <AlbumManageClient album={album} />;
}