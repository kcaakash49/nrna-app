"use client"

import { fetchEvents } from "@/actions/events/events";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (ev: Event | null) => void;
}

type Event = {
  id: string;
  title: string;
}

const pageSize = 10;

export default function EventAttachModal({ open, onClose, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventsQuery = useInfiniteQuery({
    queryKey: ["events", { q, pageSize }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchEvents({ page: pageParam, pageSize, q }),
    getNextPageParam: (lastPage) => {
      const next = lastPage.meta.page + 1;
      return next <= lastPage.meta.totalPages ? next : undefined;
    },
    enabled: open,
    staleTime: 60_000,
  });
  const applySearch = () => {
    setQ(qInput.trim())
  }

  const items =
    eventsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Bind Album to Event</div>
          <button className="rounded-lg border px-3 py-1" onClick={() => {
            setQ("");
            setQInput("");
            onClose();
          }}>
            Close
          </button>
        </div>

        {/* Optional search */}
        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Search events..."
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
          />
          <button className="border px-2 py-1 rounded-xl bg-black text-white" onClick={applySearch}>Search</button>
        </div>

        {/* List */}
        <div className="mt-4 max-h-[360px] overflow-auto rounded-xl">
          {eventsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : eventsQuery.isError ? (
            <div className="p-4 text-sm text-red-600">Failed to load events</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No events found</div>
          ) : (
            <div className="divide-y">
              {items.map((ev: Event,index) => (
                <button
                  key={ev.id}
                  type="button"
                  className="w-full p-3 text-left hover:bg-gray-100 cursor-pointer"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      await onSelect(ev);
                    } finally {
                      setIsSubmitting(false);
                      setQInput("")
                      setQ("")
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <div className="text-sm font-medium">{index+1}.{"  "}<span className="font-semibold text-base">{ev.title}</span></div>
                  {/* <div className="text-xs text-muted-foreground">{ev.id}</div> */}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            onClick={async () => {
              try {
                setIsSubmitting(true);
                await onSelect(null);
              } finally {
                setIsSubmitting(false);
                setQInput("")
                setQ("")
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Loading...." : "Unbind Event"}
          </button>

          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            disabled={!eventsQuery.hasNextPage || eventsQuery.isFetchingNextPage}
            onClick={() => eventsQuery.fetchNextPage()}
          >
            {eventsQuery.isFetchingNextPage ? "Loading..." : "View more"}
          </button>
        </div>
      </div>
    </div>
  );
}