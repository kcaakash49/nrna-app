"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SliderImage = {
  id: string;
  url: string;
  originalName?: string | null;
};

type Props = {
  images: SliderImage[];
};

export default function HomepageMouSliderClient({ images }: Props) {
  const safeImages = images.slice(0, 5);
  const [current, setCurrent] = useState(0);

  if (!safeImages.length) return null;

  const hasMultiple = safeImages.length > 1;

  const goPrev = () => {
    setCurrent((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrent((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-sm bg-[#efefef]">
      <div className="relative h-[240px] w-full sm:h-[320px] md:h-[420px] lg:h-[520px]">
        {safeImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${image.url}`}
              alt={image.originalName || "Slider image"}
              fill
              className="object-contain"
              priority={index === 0}
              unoptimized={process.env.NODE_ENV !== "production"}
            />
          </div>
        ))}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {safeImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                aria-label={`Go to image ${index + 1}`}
                onClick={() => setCurrent(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === current ? "bg-sky-400" : "bg-white/90"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}