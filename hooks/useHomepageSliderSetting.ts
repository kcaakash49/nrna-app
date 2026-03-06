import { useQuery,useMutation, useQueryClient  } from "@tanstack/react-query";

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
};

export type HomepageSliderResponse = {
  key: string;
  imageIds: string[];
  items: MediaItem[];
};

export function useHomepageSliderSetting() {
  return useQuery({
    queryKey: ["site-setting", "homepage_mou_slider"],
    queryFn: async (): Promise<HomepageSliderResponse> => {
      const res = await fetch("/api/admin/site-settings/homepage-mou-slider", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to fetch homepage slider setting");
      }

      return json;
    },
  });
}



export function useHomepageSliderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageIds: string[]) => {
      const res = await fetch("/api/admin/site-settings/homepage-mou-slider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save homepage slider");
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-setting", "homepage_mou_slider"],
      });
    },
  });
}