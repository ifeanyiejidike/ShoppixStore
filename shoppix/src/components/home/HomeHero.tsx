import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_POINTS = [
  { icon: Truck, label: "Delivery across Nigeria" },
  { icon: ShieldCheck, label: "Secure Paystack & Opay checkout" },
  { icon: Zap, label: "New flash deals daily" },
];

// Verified real Unsplash photo (resolved via a live fetch of Unsplash's own
// search-results page, not a guessed ID): a close-up of richly colored
// textiles. Deliberately NOT a food/produce stall — a general marketplace
// sells electronics, fashion, home goods, everything — so the hero image
// needed to read as "vibrant marketplace of goods" rather than pigeonhole
// the brand to one category the way an earlier market-vendor photo did.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1578509566163-068acd11b8e7?w=2000&q=80&auto=format&fit=crop";

export default function HomeHero() {
  return (
    <section className="relative flex min-h-[640px] items-center overflow-hidden bg-ink text-canvas">
      {/* Full-bleed background photo, not a split layout */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Two layered gradients: one darkens the bottom (so the trust-point
          row and any short viewport always stay legible), the other
          darkens the left (where the text sits) while letting the photo's
          color show through more on the right. Together they guarantee
          contrast without a flat, all-over dark wash that would hide the
          photo entirely. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/60 to-transparent" />

      <div className="container relative mx-auto px-4 py-20 sm:py-28">
        <div className="max-w-xl">
          <span className="font-mono-tag inline-block w-fit rounded-full border border-marigold/40 px-3 py-1 text-xs uppercase tracking-wider text-marigold">
            Nigeria&apos;s open market, online
          </span>

          <h1 className="font-display mt-5 text-4xl italic leading-[1.05] sm:text-5xl lg:text-6xl">
            Shop like <span className="not-italic text-marigold">no other.</span>
          </h1>

          <p className="mt-5 max-w-md text-base text-canvas/80 sm:text-lg">
            Thousands of products from independent Nigerian vendors — one cart,
            one checkout, delivered to your door.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-marigold text-marigold-ink hover:bg-marigold/90" asChild>
              <Link href="/products">
                Start shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-canvas/30 bg-transparent text-canvas hover:bg-canvas/10" asChild>
              <Link href="/vendor/apply">Sell on Shoppix</Link>
            </Button>
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-canvas/85">
                <Icon className="h-4 w-4 shrink-0 text-marigold" />
                <span>{label}</span>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
