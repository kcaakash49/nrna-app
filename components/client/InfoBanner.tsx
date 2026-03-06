import Image from "next/image";
import Link from "next/link";


export default function InfoBanner() {
  return (
    <section className="w-full py-6">
      <div className="mx-auto max-w-[1600px] px-4">
        <Link
          href="https://ssf.gov.np/"
          target="blank"
          className="block w-full overflow-hidden rounded-md shadow hover:opacity-95 transition"
        >
          <div className="relative w-full aspect-[16/3]">
            <Image
              src="/ssf.jfif"
              alt="ssf image"
              fill
              priority
              quality={100}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1600px"
              unoptimized = {process.env.NODE_ENV !== "production"}
            />
          </div>
        </Link>
      </div>
    </section>
  );
}