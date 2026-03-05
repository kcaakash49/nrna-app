import PdfSwitcher from "@/components/PdfSwitcher";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function formatDT(d: Date | null | undefined) {
    if (!d) return "";
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

export default async function EventRenderPage({ params }: { params: { slug: string } }) {
    console.log("Events page");
    const param = await params;
    const ev = await prisma.event.findUnique({
        where: { slug: param.slug },
        include: {
            category: { select: { id: true, name: true, parentId: true } },
            coverMedia: { select: { id: true, url: true, mimeType: true, originalName: true } },
            attachments: {
                include: {
                    media: { select: { id: true, url: true, mimeType: true, originalName: true } },
                },
            },
        },
    });



    if (!ev) return notFound();

    const hasMeta =
        (ev.isOnline && !!ev.onlineLink) ||
        (!ev.isOnline && (!!ev.locationName || !!ev.locationAddress)) ||
        !!ev.registrationUrl;

    const coverUrl = ev.coverMedia?.url ? `${process.env.NEXT_PUBLIC_BASE_URL}${ev.coverMedia.url}` : null;

    const attachmentMedias = (ev.attachments ?? [])
        .map((a) => a.media)
        .filter(Boolean);

    const pdfs = attachmentMedias.filter((m) => isPdf(m.mimeType, m.url));
    // const others = attachmentMedias.filter((m) => !isPdf(m.mimeType, m.url));
    const images = attachmentMedias.filter(
        (m) => m.mimeType?.startsWith("image/")
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    {ev.category?.name ? (
                        <span className="rounded-full border px-3 py-1">{ev.category.name}</span>
                    ) : null}
                    <span className="rounded-full border px-3 py-1">{ev.lang}</span>
                    <span className="rounded-full border px-3 py-1">{ev.status}</span>
                    {ev.isFeatured ? <span className="rounded-full border px-3 py-1">Featured</span> : null}
                </div>

                <h1 className="text-3xl font-semibold leading-tight">{ev.title}</h1>

                <div className="text-sm text-gray-600 flex flex-col gap-1">
                    <div>
                        <span className="font-medium">Start:</span> {formatDT(ev.startDateTime)}
                        {ev.timezone ? <span className="text-gray-500"> ({ev.timezone})</span> : null}
                    </div>
                    {ev.endDateTime ? (
                        <div>
                            <span className="font-medium">End:</span> {formatDT(ev.endDateTime)}
                        </div>
                    ) : null}
                </div>
            </header>

            {/* Cover */}
            {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={coverUrl}
                    alt={ev.coverMedia?.originalName ?? ev.title}
                    className="w-full max-h-[60vh] object-cover rounded-2xl border"
                />
            ) : null}

            {/* Meta (location/online/registration) */}
            {hasMeta ? (
                <section className="rounded-2xl border p-4 space-y-2">
                    {ev.isOnline ? (
                        <div className="text-sm">
                            <span className="font-medium">Online:</span>{" "}
                            {ev.onlineLink ? (
                                <a
                                    className="text-blue-600 underline"
                                    href={ev.onlineLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {ev.onlineLink}
                                </a>
                            ) : (
                                <span className="text-gray-500">—</span>
                            )}
                        </div>
                    ) : (
                        <>
                            {ev.locationName ? (
                                <div className="text-sm">
                                    <span className="font-medium">Location:</span> {ev.locationName}
                                </div>
                            ) : null}
                            {ev.locationAddress ? (
                                <div className="text-sm text-gray-700">{ev.locationAddress}</div>
                            ) : null}
                        </>
                    )}

                    {ev.registrationUrl ? (
                        <div className="text-sm">
                            <span className="font-medium">Registration:</span>{" "}
                            <a
                                className="text-blue-600 underline"
                                href={ev.registrationUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {ev.registrationUrl}
                            </a>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {/* Excerpt */}
            {ev.excerpt ? (
                <section className="rounded-2xl border p-4 bg-gray-50">
                    <p className="text-gray-800">{ev.excerpt}</p>
                </section>
            ) : null}

            {/* Content */}
            <section className="prose max-w-none">
                <div className="whitespace-pre-wrap">{ev.content}</div>
            </section>

            {/* Attachments */}
            {attachmentMedias.length ? (
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">Attachments</h2>

                    {/* Non-PDF list */}
                    {images.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold">Images</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map((m) => (
                                    <img
                                        key={m.id}
                                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`}
                                        alt={m.originalName}
                                        className="rounded-xl border object-cover w-full"
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* PDF inline viewer */}
                    {pdfs.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold">Documents</h2>

                            <PdfSwitcher
                                pdfs={pdfs.map((m) => ({
                                    id: m.id,
                                    originalName: m.originalName,
                                    url: `${process.env.NEXT_PUBLIC_BASE_URL}${m.url}`,
                                }))}
                            />
                        </section>
                    )}
                </section>
            ) : null}
        </div>
    );
}