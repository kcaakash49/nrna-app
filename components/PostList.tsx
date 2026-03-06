"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    adminDeletePost,
    adminListPosts,
    adminUpdatePostStatus,
} from "@/actions/posts/posts"; // <- adjust path to your actions
import { toast } from "sonner";
import Link from "next/link";

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type PostType = "NEWS" | "NOTICE" | "PRESS_RELEASE" | "ACTIVITY" | "PUBLICATION" | "PAGE";
type Lang = "EN" | "NP";

const STATUS_OPTIONS: Array<{ value: "ALL" | PostStatus; label: string }> = [
    { value: "ALL", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
];

const TYPE_OPTIONS: Array<{ value: "ALL" | PostType; label: string }> = [
    { value: "ALL", label: "All types" },
    { value: "NEWS", label: "News" },
    { value: "NOTICE", label: "Notice" },
    { value: "PRESS_RELEASE", label: "Press Release" },
    { value: "ACTIVITY", label: "Activity" },
    { value: "PUBLICATION", label: "Publication" },
    { value: "PAGE", label: "Page" },
];

const LANG_OPTIONS: Array<{ value: "ALL" | Lang; label: string }> = [
    { value: "ALL", label: "All languages" },
    { value: "EN", label: "EN" },
    { value: "NP", label: "NP" },
];

const BOOL_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
] as const;

const SORT_OPTIONS = [
    { value: "CREATED_DESC", label: "Created (newest)" },
    { value: "UPDATED_DESC", label: "Updated (newest)" },
    { value: "PUBLISHED_DESC", label: "Published (newest)" },
    { value: "TITLE_ASC", label: "Title (A–Z)" },
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

function formatDT(d: Date | string | null | undefined) {
    if (!d) return "—";
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

export default function PostsListClient() {
    const router = useRouter();
    const sp = useSearchParams();
    const qc = useQueryClient();

    // URL is the source of truth
    const filters = useMemo(() => {
        const q = sp.get("q") ?? "";
        const status = (sp.get("status") ?? "ALL") as any;
        const type = (sp.get("type") ?? "ALL") as any;
        const lang = (sp.get("lang") ?? "ALL") as any;

        const featured = (sp.get("featured") ?? "ALL") as any; // "ALL" | "true" | "false"
        const pinned = (sp.get("pinned") ?? "ALL") as any;

        const sort = (sp.get("sort") ?? "CREATED_DESC") as any;

        const page = clampInt(parseInt(sp.get("page") ?? "1", 10), 1, 1_000_000);
        const pageSize = clampInt(parseInt(sp.get("pageSize") ?? "10", 10), 1, 100);

        return { q, status, type, lang, featured, pinned, sort, page, pageSize };
    }, [sp]);

    // debounced search input
    const [searchInput, setSearchInput] = useState(filters.q);

    useEffect(() => setSearchInput(filters.q), [filters.q]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchInput === filters.q) return;
            updateUrl({ q: searchInput, page: "1" });
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    function updateUrl(next: Partial<Record<string, string>>) {
        const merged: Record<string, string | undefined> = {
            q: filters.q || undefined,
            status: filters.status,
            type: filters.type,
            lang: filters.lang,
            featured: filters.featured,
            pinned: filters.pinned,
            sort: filters.sort,
            page: String(filters.page),
            pageSize: String(filters.pageSize),
            ...next,
        };

        const qs = toQueryString(merged);
        router.push(qs ? `/admin/posts?${qs}` : "/admin/posts");
    }

    const postsQ = useQuery({
        queryKey: ["admin-posts", filters],
        queryFn: () => adminListPosts(filters),
        staleTime:5 * 60 * 1000
    });

    const updateStatusM = useMutation<
        Awaited<ReturnType<typeof adminUpdatePostStatus>>,
        Error,
        { id: string; status: PostStatus }
    >({
        mutationFn: async (vars) => {
            const res = await adminUpdatePostStatus(vars);
            if (!res.ok) throw new Error(res.error);
            return res;
        },
        onSuccess: async () => {
            toast.success("Post updated Successfully!!!")
            await qc.invalidateQueries({ queryKey: ["admin-posts"] });
        },
        onError: () => {
            toast.error("Couldn't update post!!")
        }
    });

    const deleteM = useMutation({
        mutationFn: (vars: { id: string }) => adminDeletePost(vars),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin-posts"] });
        },
    });

    const data = postsQ.data;
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
                    <h1 className="text-2xl font-semibold">Posts</h1>
                    <p className="text-sm text-gray-500">Manage posts with filters, pagination, status updates, and delete.</p>
                </div>

                <Link
                    href="/admin/posts/create-posts"
                    className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90"
                >
                    Create Post
                </Link>
            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search title</label>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="e.g. Notice, Press release..."
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
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => updateUrl({ type: e.target.value, page: "1" })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            {TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
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
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Featured */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Featured</label>
                        <select
                            value={filters.featured}
                            onChange={(e) => updateUrl({ featured: e.target.value, page: "1" })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            {BOOL_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pinned */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pinned</label>
                        <select
                            value={filters.pinned}
                            onChange={(e) => updateUrl({ pinned: e.target.value, page: "1" })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            {BOOL_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
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
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Reset */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push("/admin/posts")}
                        className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
                    >
                        Reset filters
                    </button>

                    <div className="text-xs text-gray-500">
                        {postsQ.isFetching ? "Refreshing..." : " "}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-left">
                                <th className="p-3">Title</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Lang</th>
                                <th className="p-3">Featured</th>
                                <th className="p-3">Pinned</th>
                                <th className="p-3">Published</th>
                                <th className="p-3">Updated</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {postsQ.isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b last:border-b-0">
                                        <td className="p-3" colSpan={9}>
                                            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td className="p-6 text-center text-gray-500" colSpan={9}>
                                        No posts match your filters.
                                    </td>
                                </tr>
                            ) : (
                                items.map((p: any) => {
                                    const isArchived = p.status === "ARCHIVED";
                                    return (
                                        <tr key={p.id} className="border-b last:border-b-0">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                    <Link href={`/admin/posts/${p.slug}`} className="truncate max-w-[420px]">{p.title}</Link>
                                                    {p.isFeatured ? (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                                            Featured
                                                        </span>
                                                    ) : null}
                                                    {p.isPinned ? (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            Pinned
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500">{p.slug}</div>
                                            </td>

                                            <td className="p-3">{p.type}</td>

                                            <td className="p-3">
                                                <select
                                                    value={p.status}
                                                    disabled={isArchived || updateStatusM.isPending}
                                                    onChange={(e) =>
                                                        updateStatusM.mutate({
                                                            id: p.id,
                                                            status: e.target.value as PostStatus,
                                                        })
                                                    }
                                                    className={`rounded-lg border px-2 py-1 text-sm ${isArchived ? "opacity-60 cursor-not-allowed" : ""
                                                        }`}
                                                    title={isArchived ? "Archived posts are locked" : "Change status"}
                                                >
                                                    <option value="DRAFT">DRAFT</option>
                                                    <option value="PUBLISHED">PUBLISHED</option>
                                                    <option value="ARCHIVED">ARCHIVED</option>
                                                </select>
                                            </td>

                                            <td className="p-3">{p.lang}</td>
                                            <td className="p-3">{p.isFeatured ? "Yes" : "No"}</td>
                                            <td className="p-3">{p.isPinned ? "Yes" : "No"}</td>
                                            <td className="p-3">{formatDT(p.publishedAt)}</td>
                                            <td className="p-3">{formatDT(p.updatedAt)}</td>

                                            <td className="p-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={`/admin/posts/edit/${p.slug}`}
                                                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </a>

                                                    {!isArchived && (
                                                        <button
                                                            onClick={() => {
                                                                const ok = window.confirm(
                                                                    `Delete "${p.title}" permanently?\n\nThis cannot be undone.`
                                                                );
                                                                if (!ok) return;
                                                                deleteM.mutate({ id: p.id });
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

                {/* Error */}
                {(postsQ.isError || updateStatusM.isError || deleteM.isError) && (
                    <div className="p-4 border-t bg-red-50 text-red-800 text-sm">
                        {postsQ.error ? (postsQ.error as Error).message : null}
                        {updateStatusM.error ? ` ${String((updateStatusM.error as Error).message)}` : null}
                        {deleteM.error ? ` ${String((deleteM.error as Error).message)}` : null}
                    </div>
                )}
            </div>
        </div>
    );
}