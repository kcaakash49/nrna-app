import MediaLibrary from "@/components/MediaLibrary";


export default function AdminMediaPage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold">Media Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload once, reuse in Posts / Events / Gallery / Downloads.
        </p>
        <MediaLibrary />
      </div>
    </div>
  );
}