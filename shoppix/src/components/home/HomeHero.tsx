import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_POINTS = [
  { icon: Truck, label: "Delivery across Nigeria" },
  { icon: ShieldCheck, label: "Secure Paystack & Opay checkout" },
  { icon: Zap, label: "New flash deals daily" },
];

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-canvas">
      <div className="container mx-auto grid gap-8 px-4 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-28">
        <div>
          <span className="font-mono-tag inline-block rounded-full border border-marigold/40 px-3 py-1 text-xs uppercase tracking-wider text-marigold">
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

        {/* Market ticket stack — echoes the price-tag signature at hero scale */}
        <div className="relative mx-auto hidden w-full max-w-sm sm:block lg:max-w-none">
          <div className="price-tag absolute -top-3 right-6 w-48 rotate-3 rounded-md bg-marigold p-4 shadow-lg">
            <span className="price-tag-hole" />
            <p className="font-mono-tag text-[11px] text-marigold-ink/70">Today&apos;s deal</p>
            <p className="font-mono-tag text-lg font-semibold text-marigold-ink">-30%</p>
          </div>
          <div className="price-tag relative left-4 top-8 w-52 -rotate-2 rounded-md bg-jade p-4 shadow-lg">
            <span className="price-tag-hole" style={{ background: "rgba(255,255,255,0.4)" }} />
            <p className="font-mono-tag text-[11px] text-canvas/70">Verified vendor</p>
            <p className="font-mono-tag text-lg font-semibold text-canvas">2,400+ sellers</p>
          </div>
          <div className="price-tag relative left-16 top-16 w-44 rotate-1 rounded-md bg-canvas p-4 shadow-lg">
            <span className="price-tag-hole" />
            <p className="font-mono-tag text-[11px] text-ink/60">Fast delivery</p>
            <p className="font-mono-tag text-lg font-semibold text-ink">Lagos → PH → Abuja</p>
          </div>
        </div>
      </div>
    </section>
  );
}
