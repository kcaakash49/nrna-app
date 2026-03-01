"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function AlbumSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setQ(initialQ), [initialQ]);

  const apply = () => {
    const params = new URLSearchParams(sp.toString());
    const value = q.trim();

    if (value) params.set("q", value);
    else params.delete("q");

    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clear = () => {
    const params = new URLSearchParams(sp.toString());
    params.delete("q");
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="text-sm font-medium">Search albums</div>
        <div className="mt-2 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
            }}
            placeholder="Search by title or slug…"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            disabled={isPending}
          />

          <button
            type="button"
            onClick={apply}
            disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}