"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Eye, Mail } from "lucide-react";

type SliderImage = {
  id: string;
  url: string;
  originalName: string | null;
  mimeType: string;
};

type Props = {
  images: SliderImage[];
};

export default function WhoWeAreClient({ images }: Props) {
  const topImage = images[0];
  const bottomImage = images[1];
  console.log(topImage);

  return (
    <section className="w-full bg-[#eaf1f4] py-12 md:py-16 max-w-[1600px] mx-auto shadow-xl rounded-md">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-16 hover:z-10">
        <div className="relative mx-auto h-[420px] w-full max-w-[760px] md:h-[500px]">
          {topImage ? (
            <div className="absolute right-0 top-0 h-[230px] w-[72%] overflow-hidden rounded-[56px] bg-white shadow-sm">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${topImage.url}`}
                alt={topImage.originalName || "NRNA image"}
                fill
                unoptimized={process.env.NODE_ENV !== "production"}
                className="object-cover hover:z-10"
              />
            </div>
          ) : null}

          {bottomImage ? (
            <div className="absolute bottom-0 left-0 h-[230px] w-[72%] overflow-hidden rounded-[56px] bg-white shadow-sm md:h-[290px]">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${bottomImage.url}`}
                alt={bottomImage.originalName || "NRNA image"}
                fill
                unoptimized={process.env.NODE_ENV !== "production"}
                className="object-cover hover:z-10"
              />
            </div>
          ) : null}
        </div>

        <div className="max-w-[680px]">
          <h2 className="text-3xl font-bold text-[#13233a] md:text-5xl">
            Who We Are ?
          </h2>
          <div className="mt-3 h-[4px] w-16 bg-[#4c89c7]" />

          <p className="mt-6 text-[18px] leading-9 text-[#1a2433]">
            <span className="font-bold">
              Non-Resident Nepali Association (NRNA)
            </span>{" "}
            was established with the purpose of uniting and binding the Nepali
            Diaspora under one umbrella on 11 October, 2003. In the course of
            completing 20 years of its existence NRNA has developed into a
            non-governmental global organization and a network of Nepali origin
            by establishing National Coordination Council (NCC) in 90 countries
            to represent its interests, concerns and commitments. Wherever we
            Nepalis may go or settle, whichever nationality we may possess, we
            never forget our land of origin, the land which holds...
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] shadow-inner">
                <Building2 className="h-6 w-6 text-[#1b2a44]" />
              </div>
              <div>
                <div className="text-[18px] font-bold text-[#1a2433]">Office</div>
                <div className="text-[15px] font-medium leading-7 text-[#39465a]">
                  +977- 014511530 ,<br />
                  014526005
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] shadow-inner">
                <Mail className="h-6 w-6 text-[#1b2a44]" />
              </div>
              <div>
                <div className="text-[18px] font-bold text-[#1a2433]">Email</div>
                <div className="text-[15px] font-medium text-[#39465a]">
                  info@nrna.org
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/about-us"
              className="inline-flex items-center gap-2 rounded-md bg-[#4f93c6] px-5 py-3 text-[18px] font-medium text-white transition hover:bg-[#3f85ba]"
            >
              <Eye className="h-5 w-5" />
              View More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}