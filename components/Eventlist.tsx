"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteEvent,
  adminListEventCategories,
  adminListEvents,
  adminUpdateEventStatus,
} from "@/actions/events/events";

type Status = "DRAFT" | "PUBLISHED" | "CANCELLED" | "ARCHIVED";
type Lang = "EN" | "NP";

const STATUS_OPTIONS: Array<{ value: "ALL" | Status; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

const LANG_OPTIONS: Array<{ value: "ALL" | Lang; label: string }> = [
  { value: "ALL", label: "All languages" },
  { value: "EN", label: "EN" },
  { value: "NP", label: "NP" },
];

const TIME_OPTIONS = [
  { value: "ALL", label: "All time" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "PAST", label: "Past" },
  { value: "RANGE", label: "Range" },
] as const;

const SORT_OPTIONS = [
  { value: "CREATED_DESC", label: "Created (newest)" },
  { value: "UPDATED_DESC", label: "Updated (newest)" },
  { value: "START_ASC", label: "Start (soonest)" },
  { value: "START_DESC", label: "Start (latest)" },
] as const;

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function toQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "" || v === "ALL") return;
    sp.set(k, v);
  });
  return sp.toString();
}

function formatDT(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function EventsListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();

  // Read URL params (single source of truth)
  const filters = useMemo(() => {
    const q = sp.get("q") ?? "";
    const status = (sp.get("status") ?? "ALL") as any;
    const categoryId = sp.get("categoryId") ?? "";
    const lang = (sp.get("lang") ?? "ALL") as any;
    const time = (sp.get("time") ?? "ALL") as any;
    const from = sp.get("from") ?? "";
    const to = sp.get("to") ?? "";
    const featured = (sp.get("featured") ?? "ALL") as any;
    const sort = (sp.get("sort") ?? "CREATED_DESC") as any;

    const page = clampInt(parseInt(sp.get("page") ?? "1", 10), 1, 1_000_000);
    const pageSize = clampInt(parseInt(sp.get("pageSize") ?? "10", 10), 1, 100);

    return {
      q,
      status,
      categoryId: categoryId || undefined,
      lang,
      time,
      from: from || undefined,
      to: to || undefined,
      featured,
      sort,
      page,
      pageSize,
    };
  }, [sp]);

  // Local input state for debounced search
  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  // Debounce q -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === filters.q) return;
      updateUrl({ q: searchInput, page: "1" }); // reset page on search
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateUrl(next: Partial<Record<string, string>>) {
    // Merge current URL params with updates
    const merged: Record<string, string | undefined> = {
      q: filters.q || undefined,
      status: filters.status,
      categoryId: filters.categoryId,
      lang: filters.lang,
      time: filters.time,
      from: filters.from,
      to: filters.to,
      featured: filters.featured,
      sort: filters.sort,
      page: String(filters.page),
      pageSize: String(filters.pageSize),
      ...next,
    };

    // If time != RANGE, remove from/to
    if (merged.time !== "RANGE") {
      merged.from = undefined;
      merged.to = undefined;
    }

    const qs = toQueryString(merged);
    router.push(qs ? `/admin/events?${qs}` : "/admin/events");
  }

  const categoriesQ = useQuery({
    queryKey: ["event-categories"],
    queryFn: () => adminListEventCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const eventsQ = useQuery({
    queryKey: ["admin-events", filters],
    queryFn: () => adminListEvents(filters),
  });

  const updateStatusM = useMutation({
    mutationFn: (vars: { id: string; status: Status }) => adminUpdateEventStatus(vars),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (vars: { id: string }) => adminDeleteEvent(vars),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const data = eventsQ.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? filters.page;
  const pageSize = data?.pageSize ?? filters.pageSize;
  const totalPages = data?.totalPages ?? 1;

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-gray-500">Manage events with filters, pagination, and status updates.</p>
        </div>

        <a
          href="/admin/events/create-event"
          className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90"
        >
          Create Event
        </a>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search title</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. NRNA meeting"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateUrl({ status: e.target.value, page: "1" })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={filters.categoryId ?? "ALL"}
              onChange={(e) =>
                updateUrl({
                  categoryId: e.target.value === "ALL" ? "ALL" : e.target.value,
                  page: "1",
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
              disabled={categoriesQ.isLoading}
            >
              <option value="ALL">All categories</option>
              {(categoriesQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
            <select
              value={filters.time}
              onChange={(e) => updateUrl({ time: e.target.value, page: "1" })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lang */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
            <select
              value={filters.lang}
              onChange={(e) => updateUrl({ lang: e.target.value, page: "1" })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sort</label>
            <select
              value={filters.sort}
              onChange={(e) => updateUrl({ sort: e.target.value, page: "1" })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Range fields */}
        {filters.time === "RANGE" && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={(filters.from ?? "").slice(0, 10)}
                onChange={(e) => updateUrl({ from: e.target.value || "ALL", page: "1" })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={(filters.to ?? "").slice(0, 10)}
                onChange={(e) => updateUrl({ to: e.target.value || "ALL", page: "1" })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {/* Reset */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/events")}
            className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            Reset filters
          </button>

          <div className="text-xs text-gray-500">
            {eventsQ.isFetching ? "Refreshing..." : " "}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Status</th>
                <th className="p-3">Lang</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {eventsQ.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-3" colSpan={8}>
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={8}>
                    No events match your filters.
                  </td>
                </tr>
              ) : (
                items.map((ev) => {
                  const isArchived = ev.status === "ARCHIVED";
                  return (
                    <tr key={ev.id} className="border-b last:border-b-0">
                      <td className="p-3">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <a className="hover:underline" href={`/admin/events/${ev.slug}`}>
                            {ev.title}
                          </a>
                          {ev.isFeatured ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-500">{ev.slug}</div>
                      </td>

                      <td className="p-3">{ev.category?.name ?? "—"}</td>
                      <td className="p-3">{formatDT(ev.startDateTime)}</td>
                      <td className="p-3">{ev.endDateTime ? formatDT(ev.endDateTime) : "—"}</td>

                      <td className="p-3">
                        <select
                          value={ev.status}
                          disabled={isArchived || updateStatusM.isPending}
                          onChange={(e) =>
                            updateStatusM.mutate({
                              id: ev.id,
                              status: e.target.value as Status,
                            })
                          }
                          className={`rounded-lg border px-2 py-1 text-sm ${
                            isArchived ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                          title={isArchived ? "Archived events are locked" : "Change status"}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </td>

                      <td className="p-3">{ev.lang}</td>
                      <td className="p-3">{formatDT(ev.updatedAt)}</td>

                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/admin/events/${ev.slug}`}
                            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                          >
                            Edit
                          </a>

                          {/* No delete UI for archived */}
                          {!isArchived && (
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `Delete "${ev.title}" permanently?\n\nThis cannot be undone.`
                                );
                                if (!ok) return;
                                deleteM.mutate({ id: ev.id });
                              }}
                              disabled={deleteM.isPending}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-t bg-white">
          <div className="text-sm text-gray-600">
            {total === 0 ? "Showing 0 results" : `Showing ${startIdx}–${endIdx} of ${total}`}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={String(pageSize)}
              onChange={(e) => updateUrl({ pageSize: e.target.value, page: "1" })}
              className="rounded-lg border px-2 py-2 text-sm"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>

            <button
              onClick={() => updateUrl({ page: String(Math.max(1, page - 1)) })}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>

            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> / {totalPages}
            </div>

            <button
              onClick={() => updateUrl({ page: String(Math.min(totalPages, page + 1)) })}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Simple error display */}
        {(eventsQ.isError || updateStatusM.isError || deleteM.isError) && (
          <div className="p-4 border-t bg-red-50 text-red-800 text-sm">
            {eventsQ.error ? (eventsQ.error as Error).message : null}
            {updateStatusM.error ? ` ${String((updateStatusM.error as Error).message)}` : null}
            {deleteM.error ? ` ${String((deleteM.error as Error).message)}` : null}
          </div>
        )}
      </div>
    </div>
  );
}