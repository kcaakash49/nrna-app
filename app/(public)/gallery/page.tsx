import { getGalleryAlbums } from "@/actions/gallery/gallery";
import AlbumSearchBar from "@/components/AlbumSearchBar";
import GalleryAlbums from "@/components/client/GalleryAlbum";
import GalleryAlbumsUI from "@/components/GalleryAlbumsUI";
import { Language, PostStatus } from "@prisma/client";
import Link from "next/link";


export default async function GalleryPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const page = Number(sp.page || 1);
    const q = typeof sp.q === "string" ? sp.q : "";
    const status = typeof sp.status === "string" ? (sp.status as PostStatus) : undefined;
    const lang = typeof sp.lang === "string" ? (sp.lang as Language) : undefined;

    const data = await getGalleryAlbums({ page, pageSize: 12, q, status: "PUBLISHED", lang });

    if (!data.items.length) {
        return (
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">Gallery Albums</h1>
                        <p className="text-sm text-muted-foreground">
                            Total: {data.meta.total}
                        </p>
                    </div>
                </div>

                {/* Empty State */}
                <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        📷
                    </div>

                    <h2 className="text-lg font-semibold">No albums yet</h2>

                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Start organizing your event photos by creating your first gallery
                        album. You can upload images and manage them inside each album.
                    </p>

                    <Link
                        href="#"
                        className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
                    >
                        Create your first album
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
      {/* You can keep header inside GalleryAlbumsUI too; up to you */}
      <AlbumSearchBar />
      <GalleryAlbums data={data} q={q} />
    </div>
    );
}