"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

export default function TopNavbar() {
  return (
    <header className="w-full bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Logo + Title */}
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="relative h-[56px] w-[56px] sm:h-[72px] sm:w-[72px] md:h-[90px] md:w-[90px] flex-shrink-0">
              <Image
                src="/logo.jpeg"
                alt="NRNA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0 leading-tight flex flex-col justify-center gap-1 sm:gap-2">
              <div className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-black truncate">
                Non-Resident Nepali Association
              </div>
              <div className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-black truncate">
                गैरआवासीय नेपाली संघ
              </div>
            </div>
          </Link>

          {/* Right: Search + Social + Flag */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            {/* Search + Social */}
            <div className="flex flex-col gap-3 md:items-end">
              {/* Search Bar */}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex h-[40px] w-full max-w-[520px] overflow-hidden border border-gray-300"
              >
                <div className="flex w-[44px] items-center justify-center border-r border-gray-300 flex-shrink-0">
                  <Search className="h-4 w-4 text-gray-700" />
                </div>

                <input
                  type="text"
                  placeholder="Search"
                  className="h-full flex-1 min-w-0 px-3 text-sm outline-none"
                />

                <button
                  type="submit"
                  className="h-full px-3 bg-[#2B6CB0] text-sm font-medium text-white flex-shrink-0"
                >
                  Search
                </button>
              </form>

              {/* Social Icons */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-black">
                <Link href="#" aria-label="X" className="hover:opacity-70">
                  X
                </Link>
                <Link href="#" aria-label="Instagram" className="hover:opacity-70">
                  ⌁
                </Link>
                <Link href="#" aria-label="Facebook" className="hover:opacity-70">
                  f
                </Link>
                <Link href="#" aria-label="LinkedIn" className="hover:opacity-70">
                  in
                </Link>
                <Link href="#" aria-label="YouTube" className="hover:opacity-70">
                  ▶
                </Link>
              </div>
            </div>

            {/* Nepal Flag */}
            <div className="relative h-[44px] w-[34px] sm:h-[56px] sm:w-[44px] md:h-[70px] md:w-[54px] hidden md:inline-block">
              <Image
                src="/np_flag.gif"
                alt="Nepal Flag"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-200" />
    </header>
  );
}