import { getHomepageMouSliderSetting } from "@/lib/site-setting";
import WhoWeAreClient from "./WhoWeAreClient";

export default async function WhoWeAreSection() {
  const images = await getHomepageMouSliderSetting();
  if(!images || images.length ===0){
    return null
  }
  const firstTwo = images.slice(0, 2);

  return <WhoWeAreClient images={firstTwo} />;
}