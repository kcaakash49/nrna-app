import { getHomepageMouSliderSetting } from "@/lib/site-setting";
import HomepageMouSliderClient from "./HomepageMouSlider";


export default async function HomepageMouSliderSection() {
  const images = await getHomepageMouSliderSetting();

  if (!images.length) return null;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1200px] px-4">
        <HomepageMouSliderClient images={images} />
      </div>
    </section>
  );
}