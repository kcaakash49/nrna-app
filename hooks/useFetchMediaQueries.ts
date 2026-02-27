import { MediaResponse } from "@/types/mediaTypes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

type QueryType = {
    page: number;
    q?: string;
    pageSize: number;
    enabled?: boolean;
}

export const useFetchMediaQueries = ({page,q="",pageSize, enabled=true}:QueryType) => {
    return useQuery({
    queryKey: ["media", { page, q, pageSize }],
    queryFn: async (): Promise<MediaResponse> => {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load media");
      return json;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
    placeholderData:keepPreviousData

  });
}