"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
} from "lucide-react";

export default function Footer() {
  const notices = [
    "Request for Proposal (RFP) for Professional Auditing Services",
    "१३ औं विश्व सम्मेलन,१३ औं बृहत एकताको अन्तर्राष्ट्रिय महाधिवेशन र वार्षिक साधारणसभा, २०३१ सम्बन्धी सूचना",
    "Notice: Call for Proposal for procurement of travel agency",
    "Notice: Call for Proposal for Consultancy on Institutional Capacity Building Training",
  ];

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#dfe8ee] text-black">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-11 h-40 opacity-20"
        style={{
          background:
            "linear-gradient(to top, rgba(82,107,151,0.35), rgba(82,107,151,0))",
          clipPath:
            "polygon(0 100%, 8% 88%, 14% 92%, 20% 78%, 28% 84%, 36% 60%, 42% 68%, 48% 40%, 54% 64%, 61% 48%, 69% 80%, 76% 55%, 82% 72%, 88% 52%, 94% 78%, 100% 62%, 100% 100%)",
        }}
      />

      <div className="mx-auto max-w-[1700px] px-6 py-12 md:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-5 flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <Image
                  src="/logo.jpeg"
                  alt="NRNA Logo"
                  fill
                  className="object-contain"
                  unoptimized={process.env.NODE_ENV !== "production"}
                />
              </div>

              <div>
                <h3 className="text-[20px] font-bold leading-tight">
                  Non-Resident Nepali Association
                </h3>
                <p className="mt-1 text-[18px] font-semibold leading-tight">
                  गैरआवासीय नेपाली संघ
                </p>
              </div>
            </div>

            <p className="max-w-[540px] text-[15px] leading-8 text-black/95">
              Non-Resident Nepali Association (NRNA) was established with the
              purpose of uniting and binding the Nepali Diaspora under one
              umbrella on 11 October, 2003. In the course of completing 22 years
              of its existence NRNA has developed into a non-governmental global
              organization and a network of Nepali origin by establishing
              National Coordination Council (NCC) in 90 countries to represent
              its interests, concerns and commitments.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-[24px] font-bold">Contact Us</h3>

            <div className="space-y-3 text-[15px]">
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0" />
                <span>+977-014511530 ,014526005</span>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0" />
                <span>info@nrna.org</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>Subarna Shamsher Marg, Baluwatar, Kathmandu</span>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-md border border-black/10 shadow-sm">
              <iframe
                title="NRNA Location"
                src="https://www.google.com/maps?q=Baluwatar%20Kathmandu&z=15&output=embed"
                className="h-[150px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[24px] font-bold">Notice</h3>

            <ul className="space-y-3 text-[15px] leading-8">
              {notices.map((item, index) => (
                <li key={index} className="ml-5 list-disc">
                  <Link href="#" className="hover:text-blue-700">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[24px] font-bold">Follow Us</h3>

            <div className="mb-8 flex items-center gap-4">
              <Link href="#" aria-label="Twitter" className="hover:text-blue-700">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Instagram" className="hover:text-blue-700">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Facebook" className="hover:text-blue-700">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="hover:text-blue-700">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Youtube" className="hover:text-blue-700">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>

            <h3 className="mb-4 text-[24px] font-bold">Subscribe Newsletter</h3>

            <form className="flex w-full max-w-[430px] overflow-hidden rounded border border-[#9eb3c8] bg-white">
              <input
                type="email"
                placeholder="Subscribe newsletter"
                className="w-full px-4 py-2.5 outline-none"
              />
              <button
                type="submit"
                className="bg-[#4f86bf] px-4 py-2.5 font-medium text-white hover:bg-[#3f76af]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-[#2f287b]">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-4 px-6 py-4 text-white md:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <p className="text-[15px]">
            Copyright © 2026{" "}
            <Link href="https://niceitsolution.com" className="text-[#58a7ff] hover:underline">
              Nice IT Solution
            </Link>{" "}
            All Rights Reserved by NRNA
          </p>

          <div className="flex flex-wrap items-center gap-6 text-[15px]">
            <Link href="#" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:underline">
              Terms and Conditions
            </Link>
            <Link href="#" className="hover:underline">
              FAQs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}