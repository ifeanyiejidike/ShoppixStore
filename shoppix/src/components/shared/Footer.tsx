import Link from "next/link";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/products" },
      { label: "Flash deals", href: "/products?flash_sale=true" },
      { label: "Vendors", href: "/vendors" },
    ],
  },
  {
    heading: "Sell",
    links: [
      { label: "Become a vendor", href: "/vendor/apply" },
      { label: "Vendor dashboard", href: "/vendor/dashboard" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "My orders", href: "/account/orders" },
      { label: "My account", href: "/account" },
      { label: "Sign in", href: "/auth/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-ink text-canvas">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display italic text-2xl font-semibold">Shoppix</span>
            <p className="mt-3 text-sm text-canvas/70 max-w-xs">
              Shop like no other — a marketplace for independent Nigerian vendors, all in one place.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="font-mono-tag text-xs uppercase tracking-wider text-marigold">
                {group.heading}
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-canvas/80 hover:text-canvas transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-canvas/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-canvas/60">
            © {new Date().getFullYear()} Shoppix. All rights reserved.
          </p>
          <p className="text-xs text-canvas/60">
            Secure payment via <span className="text-canvas/90">Paystack</span> &{" "}
            <span className="text-canvas/90">Opay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
