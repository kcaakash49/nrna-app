import GalleryAlbumForm from "@/components/GalleryAlbumCreateForm";



export default function CreateGalleryAlbumPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Create Album</h1>
        <p className="text-sm text-muted-foreground">
          Create an album and choose a cover image from your Media library.
        </p>
      </div>

      <GalleryAlbumForm mode="create" />
    </div>
  );
}