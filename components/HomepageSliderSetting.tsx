"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";
import {
  MediaItem,
  useHomepageSliderSetting,
} from "@/hooks/useHomepageSliderSetting";
import { useHomepageSliderMutation } from "@/hooks/useHomepageSliderSetting";

const MAX_IMAGES = 5;

export default function HomepageSliderSetting() {
  const { data, isLoading, isError } = useHomepageSliderSetting();
  const saveMutation = useHomepageSliderMutation();

  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setSelectedItems(data.items || []);
    setSelectedIds(data.imageIds || []);
  }, [data]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleChangeSelected = (nextIds: string[], lastClicked: MediaItem) => {
    if (!lastClicked.mimeType?.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }

    if (!selectedSet.has(lastClicked.id) && selectedIds.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setSelectedIds(nextIds);

    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.id === lastClicked.id);

      if (exists) {
        return prev.filter((item) => item.id !== lastClicked.id);
      }

      return [...prev, lastClicked].slice(0, MAX_IMAGES);
    });
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(selectedIds.slice(0, MAX_IMAGES));
      toast.success("Homepage slider updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save slider");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading slider setting...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Failed to load slider setting.</div>;
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Homepage MoU Slider</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select up to {MAX_IMAGES} images from media library.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen("homepage_mou_slider")}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Select Images
        </button>
      </div>

      <div className="mt-5">
        {selectedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No images selected yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="rounded-xl border p-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${item.url}`}
                  alt={item.originalName || "media"}
                  width={300}
                  height={200}
                  unoptimized={process.env.NODE_ENV !== "production"}
                  className="h-28 w-full rounded-lg object-cover"
                />

                <div className="mt-2 line-clamp-2 text-xs text-gray-600">
                  {item.originalName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedItems.length}</span> / {MAX_IMAGES}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving..." : "Save Slider"}
        </button>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(null)}
        mode="multiple"
        title="Select slider images"
        selectedIds={selectedIds}
        onChangeSelected={handleChangeSelected}
        onConfirmMultiple={() => setPickerOpen(null)}
        confirmLabel="Done"
      />
    </div>
  );
}