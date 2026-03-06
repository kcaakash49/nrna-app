import Image from "next/image";
import Link from "next/link";

function statusClasses(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "ARCHIVED":
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"; // DRAFT
  }
}

export default function GalleryAlbums({ data, q }: { data: any; q: string }) {
  return (
    <div className="py-2 px-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gallery Albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage albums, covers, and photos • Total {data.meta.total}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((a: any) => {
          const coverUrl = a.coverMedia?.url
            ? `${process.env.NEXT_PUBLIC_BASE_URL}${a.coverMedia.url}`
            : null;

          return (
            <Link
              key={a.id}
              href={`/gallery/${a.slug}`}
              className="group rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Cover */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-muted">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={a.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    unoptimized={process.env.NODE_ENV !== "production"}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/70">
                      📷
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      No cover image
                    </div>
                  </div>
                )}

                {/* Top badges */}
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                      a.status
                    )}`}
                  >
                    {a.status}
                  </span>

                  {a.lang ? (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                      {a.lang}
                    </span>
                  ) : null}
                </div>

                {/* Photo count pill */}
                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white">
                    {a._count.photos} photos
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-base font-semibold">
                      {a.title}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      /{a.slug}
                    </div>
                  </div>
                </div>

                {a.description && (
                  <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {a.description}
                  </div>
                )
                }
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
        <Link
          className={`rounded-xl border px-4 py-2 text-sm hover:bg-muted transition ${
            data.meta.page <= 1 ? "pointer-events-none opacity-50" : ""
          }`}
          href={`/gallery?page=${data.meta.page - 1}&q=${encodeURIComponent(q)}`}
        >
          ← <span className="hidden sm:inline-block">Prev</span>
        </Link>

        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-zinc-900">{data.meta.page}</span>{" "}
          of <span className="font-medium text-zinc-900">{data.meta.totalPages}</span>
        </div>

        <Link
          className={`rounded-xl border px-4 py-2 text-sm hover:bg-muted transition ${
            data.meta.page >= data.meta.totalPages ? "pointer-events-none opacity-50" : ""
          }`}
          href={`/gallery?page=${data.meta.page + 1}&q=${encodeURIComponent(q)}`}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}