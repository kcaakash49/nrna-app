"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  CommitteeMemberListItem,
  CommitteeMembersResponse,
} from "@/types/committee-members";

const PAGE_SIZE = 10;

async function fetchCommitteeMembers(page: number): Promise<CommitteeMembersResponse> {
  const res = await fetch(
    `/api/admin/committee-members?page=${page}&pageSize=${PAGE_SIZE}`,
    {
      cache: "no-store",
    }
  );

  const json: CommitteeMembersResponse = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error || "Failed to fetch committee members");
  }

  return json;
}

export default function CommitteeMembersClient() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["committee-members", { page, pageSize: PAGE_SIZE }],
    queryFn: () => fetchCommitteeMembers(page),
    staleTime: 60 * 1000,
  });

  const items: CommitteeMemberListItem[] = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Committee Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage committee members and their display order.
          </p>
        </div>

        <Link
          href="/admin/committee-members/new"
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Add Member
        </Link>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Total Members: <span className="font-medium text-black">{total}</span>
            {isFetching && !isLoading ? (
              <span className="ml-2 text-xs text-muted-foreground">Refreshing...</span>
            ) : null}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : "Something went wrong"}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No committee members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Tenure</th>
                  <th className="px-4 py-3 font-medium">Team Type</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((member) => (
                  <tr key={member.id} className="border-b align-middle">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border bg-muted">
                        {member.imageUrl ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_BASE_URL}${member.imageUrl}`}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={process.env.NODE_ENV !== "production"}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3">{member.designation}</td>
                    <td className="px-4 py-3">{member.country || "-"}</td>
                    <td className="px-4 py-3">{member.tenure.label}</td>
                    <td className="px-4 py-3">{member.teamType.name}</td>
                    <td className="px-4 py-3">{member.group.name}</td>
                    <td className="px-4 py-3">{member.order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/committee-members/${member.id}/edit`}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          disabled
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {Math.max(totalPages, 1)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}