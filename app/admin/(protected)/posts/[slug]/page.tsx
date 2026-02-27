import {prisma} from "@/lib/prisma";
import { notFound } from "next/navigation";
import PdfSwitcher from "@/components/PdfSwitcher";

function formatDT(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function isPdf(mimeType?: string | null, url?: string | null) {
  if (mimeType?.toLowerCase() === "application/pdf") return true;
  if (url?.toLowerCase().endsWith(".pdf")) return true;
  return false;
}

export default async function PostRenderPage({ params }: { params: { slug: string } }) {
  const param = await params;
  const p = await prisma.post.findUnique({
    where: { slug: param.slug },
    include: {
      coverMedia: { select: { id: true, url: true, mimeType: true, originalName: true } },
      ogMedia: { select: { id: true, url: true, mimeType: true, originalName: true } },
      attachments: {
        include: {
          media: { select: { id: true, url: true, mimeType: true, originalName: true } },
        },
      },
    },
  });

  if (!p) return notFound();

  const coverUrl = p.coverMedia?.url ? `${process.env.NEXT_PUBLIC_BASE_URL}${p.coverMedia.url}` : null;
  const ogUrl = p.ogMedia?.url ? `${process.env.NEXT_PUBLIC_BASE_URL}${p.ogMedia.url}` : null;

  const attachmentMedias = (p.attachments ?? []).map((a) => a.media).filter(Boolean);

  const images = attachmentMedias.filter((m) => m.mimeType?.startsWith("image/"));
  const pdfs = attachmentMedias.filter((m) => isPdf(m.mimeType, m.url));

  const hasHeaderBadges = true; // always show badges
  const hasImages = images.length > 0;
  const hasPdfs = pdfs.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        {hasHeaderBadges ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="rounded-full border px-3 py-1">{p.type}</span>
            <span className="rounded-full border px-3 py-1">{p.lang}</span>
            <span className="rounded-full border px-3 py-1">{p.status}</span>
            {p.isFeatured ? <span className="rounded-full border px-3 py-1">Featured</span> : null}
            {p.isPinned ? <span className="rounded-full border px-3 py-1">Pinned</span> : null}
            {p.pageTemplate ? <span className="rounded-full border px-3 py-1">{p.pageTemplate}</span> : null}
          </div>
        ) : null}

        <h1 className="text-3xl font-semibold leading-tight">{p.title}</h1>

        <div className="text-sm text-gray-600 flex flex-col gap-1">
          <div>
            <span className="font-medium">Published:</span> {formatDT(p.publishedAt)}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {formatDT(p.updatedAt)}
          </div>
        </div>
      </header>

      {/* Cover */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={p.coverMedia?.originalName ?? p.title}
          className="w-full max-h-[60vh] object-cover rounded-2xl border"
        />
      ) : null}

      {/* OG preview (optional) */}
      {/* {ogUrl ? (
        <section className="rounded-2xl border p-4 bg-gray-50">
          <div className="text-sm font-medium mb-2">OG Image</div>
         
          <img
            src={ogUrl}
            alt={p.ogMedia?.originalName ?? "OG image"}
            className="w-full max-h-[260px] object-cover rounded-xl border"
          />
        </section>
      ) : null} */}

      {/* Excerpt */}
      {p.excerpt ? (
        <section className="rounded-2xl border p-4 bg-gray-50">
          <p className="text-gray-800 whitespace-pre-wrap">{p.excerpt}</p>
        </section>
      ) : null}

      {/* Content */}
      <section className="prose max-w-none">
        {/* If you later store HTML, switch to dangerouslySetInnerHTML. */}
        <div className="whitespace-pre-wrap">{p.content}</div>
      </section>

      {/* Attachments */}
      {hasImages || hasPdfs ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Attachments</h2>

          {/* Images: show all */}
          {hasImages ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Images</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                    alt={m.originalName}
                    className="rounded-xl border object-cover w-full"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* PDFs: switcher */}
          {hasPdfs ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">PDFs</div>
              <PdfSwitcher
                pdfs={pdfs.map((m) => ({
                  id: m.id,
                  originalName: m.originalName,
                  url: `${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`,
                }))}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}