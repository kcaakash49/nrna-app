import HomepageMouSliderSection from "@/components/client/HomepageMouSliderSection";
import InfoBanner from "@/components/client/InfoBanner";
import PDFDisplaySection from "@/components/client/PdfDisplaySection";

export default function Home() {
  console.log("I am rendering");
  return (
    <>
      <section className="w-full py-6 md:py-8">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="min-w-0">
            <HomepageMouSliderSection />
          </div>

          <div className="min-w-0">
            <PDFDisplaySection />
          </div>
        </div>
      </section>
      <InfoBanner/>
    </>
  );
}