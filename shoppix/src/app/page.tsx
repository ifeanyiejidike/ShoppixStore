import HomeHero from "@/components/home/HomeHero";
import HomeCategories from "@/components/home/HomeCategories";
import HomeFlashDeals from "@/components/home/HomeFlashDeals";
import HomeFeaturedProducts from "@/components/home/HomeFeaturedProducts";

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeCategories />
      <HomeFlashDeals />
      <HomeFeaturedProducts />
    </>
  );
}
