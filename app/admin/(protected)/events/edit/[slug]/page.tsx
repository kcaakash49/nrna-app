import EventForm from "@/components/CreateEventForm";
import {prisma} from "@/lib/prisma";
import { notFound } from "next/navigation";


export default async function EditEventPage({ params }: { params: { slug: string } }) {
  const param = await params;
  console.log(param);
  const ev = await prisma.event.findUnique({
    where: { slug: param.slug },
    include: {
      coverMedia: true,
      attachments: { include: { media: true } },
    },
  });

  if (!ev) return notFound();

  return (
    <div className="p-6">
      <EventForm mode="edit" initialEvent={ev as any} />
    </div>
  );
}