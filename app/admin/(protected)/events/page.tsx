import Link from "next/link";

export default function Events(){
    return <div className="p-10">
        <Link href="/admin/events/create-category" className="p-2 bg-blue-800 rounded-xl text-white">Create Category</Link><br/>
        <div className="h-10"/>
        <Link href="/admin/events/create-event" className="p-2 bg-green-800 rounded-xl text-white">Create Event</Link>
    </div>
}