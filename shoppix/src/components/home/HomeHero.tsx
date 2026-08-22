import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_POINTS = [
  { icon: Truck, label: "Delivery across Nigeria" },
  { icon: ShieldCheck, label: "Secure Paystack & Opay checkout" },
  { icon: Zap, label: "New flash deals daily" },
];

// Verified real Unsplash photo (resolved via a live fetch of the photo's
// own page, not a guessed ID) — a warm, human market portrait that carries
// the "Nigeria's open market, online" positioning without leaning on the
// generic gray placeholder boxes or the decorative-only mockups this hero
// used before.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1585540083814-ea6ee8af9e4f?w=1400&q=80&auto=format&fit=crop";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-canvas">
      <div className="lg:grid lg:min-h-[640px] lg:grid-cols-2">
        {/* Text — reads first on mobile is debatable for a visual brand
            statement, so the photo leads on small screens (order-1) and the
            copy leads on desktop, where both are visible side by side. */}
        <div className="order-2 flex flex-col justify-center px-4 py-12 sm:px-8 sm:py-16 lg:order-1 lg:px-14 lg:py-0">
          <span className="font-mono-tag inline-block w-fit rounded-full border border-marigold/40 px-3 py-1 text-xs uppercase tracking-wider text-marigold">
            Nigeria&apos;s open market, online
          </span>

          <h1 className="font-display mt-5 text-4xl italic leading-[1.05] sm:text-5xl lg:text-6xl">
            Shop like <span className="not-italic text-marigold">no other.</span>
          </h1>

          <p className="mt-5 max-w-md text-base text-canvas/75 sm:text-lg">
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
              <div key={label} className="flex items-center gap-2.5 text-sm text-canvas/80">
                <Icon className="h-4 w-4 shrink-0 text-marigold" />
                <span>{label}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Photo — full-bleed, edge to edge, no padding, so it reads as a
            real photograph rather than a boxed-in illustration. */}
        <div className="relative order-1 h-72 sm:h-96 lg:order-2 lg:h-auto">
          <Image
            src={HERO_IMAGE}
            alt="A vendor at a Nigerian market stall — Shoppix brings independent sellers like this online"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {/* Gradient for text legibility where the photo meets the ink
              background, plus a subtle overall darken so the canvas-colored
              badge below reads clearly against any part of the photo. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent lg:bg-gradient-to-r lg:from-ink/50 lg:via-transparent lg:to-transparent" />

          {/* Single, confident social-proof callout — replaces the three
              competing sticky-note mockups from the previous design, which
              read as decorative filler rather than a real trust signal. */}
          <div className="price-tag absolute bottom-5 left-5 w-52 rounded-md bg-canvas/95 p-4 shadow-lg backdrop-blur-sm lg:bottom-8 lg:left-8">
            <span className="price-tag-hole" />
            <p className="font-mono-tag text-[11px] text-ink/60">Verified vendors</p>
            <p className="font-mono-tag text-lg font-semibold text-ink">2,400+ sellers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
