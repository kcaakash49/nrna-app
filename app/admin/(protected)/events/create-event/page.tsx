import EventForm from "@/components/CreateEventForm";


export default function NewEventPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Create Event</h1>
        <EventForm mode="create" />
      </div>
    </div>
  );
}