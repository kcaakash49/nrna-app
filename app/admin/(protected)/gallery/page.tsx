import { getGalleryAlbums } from "@/actions/gallery/gallery";
import Link from "next/link";


export default async function GalleryAdminPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const page = Number(sp.page || 1);
    const q = typeof sp.q === "string" ? sp.q : "";
    const status = typeof sp.status === "string" ? (sp.status as any) : undefined;
    const lang = typeof sp.lang === "string" ? (sp.lang as any) : undefined;

    const data = await getGalleryAlbums({ page, pageSize: 12, q, status, lang });

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

                    <Link
                        href="/admin/gallery/create"
                        className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90 transition"
                    >
                        Create Album
                    </Link>
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
                        href="/admin/gallery/create"
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
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Gallery Albums</h1>
                    <p className="text-sm text-muted-foreground">
                        Total: {data.meta.total}
                    </p>
                </div>

                <Link
                    href="/admin/gallery/create"
                    className="rounded-md bg-black px-4 py-2 text-white"
                >
                    Create Album
                </Link>
            </div>

            {/* TODO: Filters UI (can be client component that updates URL params) */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {data.items.map((a) => (
                    <Link
                        key={a.id}
                        href={`/admin/gallery/${a.id}`}
                        className="rounded-xl border p-4 hover:shadow-sm"
                    >
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                            {/* cover image */}
                            {/* Replace with <Image> once we finalize the media url field */}
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                {a.coverMedia?.url ? "Cover" : "No cover"}
                            </div>
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-3">
                            <div>
                                <div className="font-medium line-clamp-1">{a.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                    /{a.slug}
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {a._count.photos} photos
                            </div>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                            {a.status} {a.lang ? `• ${a.lang}` : ""}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination (simple) */}
            <div className="mt-6 flex items-center justify-between">
                <Link
                    className={`text-sm ${data.meta.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
                    href={`/admin/gallery?page=${data.meta.page - 1}&q=${encodeURIComponent(q)}`}
                >
                    ← Prev
                </Link>

                <div className="text-sm text-muted-foreground">
                    Page {data.meta.page} / {data.meta.totalPages}
                </div>

                <Link
                    className={`text-sm ${data.meta.page >= data.meta.totalPages ? "pointer-events-none opacity-50" : ""}`}
                    href={`/admin/gallery?page=${data.meta.page + 1}&q=${encodeURIComponent(q)}`}
                >
                    Next →
                </Link>
            </div>
        </div>
    );
}