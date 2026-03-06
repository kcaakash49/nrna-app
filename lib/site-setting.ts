import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

type SliderMedia = {
  id: string;
  url: string;
  originalName: string | null;
  mimeType: string;
};

export const getHomepageMouSliderSetting = unstable_cache(
  async (): Promise<SliderMedia[]> => {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "homepage_mou_slider" },
    });

    const value = setting?.value as { imageIds?: string[] } | null;

    const imageIds = Array.isArray(value?.imageIds)
      ? value.imageIds.slice(0, 5)
      : [];

    if (!imageIds.length) return [];

    const medias = await prisma.media.findMany({
      where: {
        id: { in: imageIds },
      },
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
      },
    });

    const ordered: SliderMedia[] = [];

    for (const id of imageIds) {
      const media = medias.find((m) => m.id === id);
      if (media) ordered.push(media);
    }

    return ordered;
  },
  ["site-setting", "homepage_mou_slider"],
  {
    revalidate: 3600,
    tags: ["site-setting:homepage_mou_slider"],
  }
);

export const getSiteContactSetting = unstable_cache(
  async () => {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "site_contact" },
    });

    return setting?.value ?? null;
  },
  ["site-setting", "site_contact"],
  {
    revalidate: 3600,
    tags: ["site-setting:site_contact"],
  },
);
