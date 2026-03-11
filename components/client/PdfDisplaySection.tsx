import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Eye } from "lucide-react";

export async function getLatestPdfMedia() {

  const pdfs = await prisma.media.findMany({
    where: {
      mimeType: {
        startsWith: "application/pdf",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      originalName: true,
      url: true,
      createdAt: true,
    },
  });

  return pdfs;
}



export default async function PDFDisplaySection() {
  const pdfs = await getLatestPdfMedia();

  if (!pdfs.length) return null;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-4xl rounded-lg p-4 shadow-xl w-full">
        
        {/* Tabs header (static for now) */}
        <div className="flex">
          <div className="flex-1 bg-[#3f3c8c] text-white text-center py-3 font-medium">
            Press Releases
          </div>
          <div className="flex-1 bg-[#4d82a9] text-white text-center py-3 font-medium opacity-70">
            News
          </div>
          <div className="flex-1 bg-[#4d82a9] text-white text-center py-3 font-medium opacity-70">
            Notice
          </div>
        </div>

        {/* PDF list */}
        <div className="space-y-3 mt-4">
          {pdfs.map((pdf) => (
            <Link
              key={pdf.id}
              href={`${process.env.NEXT_PUBLIC_BASE_URL}${pdf.url}`}
              target="_blank"
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/pdf-icon.jpg"
                  alt="pdf"
                  className="h-8 w-8"
                />

                <span className="text-blue-700 font-medium">
                  {pdf.originalName}
                </span>
              </div>

              <span className="text-sm text-gray-500">
                {new Date(pdf.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </Link>
          ))}
        </div>

        {/* View More */}
        <div className="mt-5">
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Eye size={16} />
            View More
          </Link>
        </div>
      </div>
    </section>
  );
}