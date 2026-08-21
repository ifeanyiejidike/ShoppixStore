import type { Metadata } from "next";
// Self-hosted fonts (via @fontsource, bundled at build time from local node_modules)
// instead of next/font/google, which requires live network access to
// fonts.googleapis.com at BUILD time with no fallback — a production build
// fails outright in any network-restricted environment (Docker, CI/CD,
// corporate firewalls) if Google's font CDN isn't reachable. Self-hosting
// removes that dependency entirely and is also better for performance/privacy.
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { siteUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: "Shoppix — Shop like no other",
    template: "%s | Shoppix",
  },
  description:
    "Shoppix is a Nigerian multi-vendor marketplace — browse thousands of products from independent sellers, with fast delivery and secure payment via Paystack and Opay.",
  keywords: [
    "e-commerce Nigeria",
    "online shopping Nigeria",
    "multi-vendor marketplace",
    "buy products online",
    "sell products online",
    "flash deals",
    "Paystack",
    "Opay",
  ],
  authors: [{ name: "Ifeanyi Ejidike", url: "https://github.com/GravityGuy123/" }],
  creator: "Ifeanyi Ejidike",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Shoppix — Shop like no other",
    description:
      "Browse thousands of products from independent Nigerian vendors — one cart, one checkout, delivered to your door.",
    url: siteUrl,
    siteName: "Shoppix",
    locale: "en_NG",
    type: "website",
    // Placeholder stock image so link previews (WhatsApp, Twitter/X, etc.)
    // aren't blank while there's no real vendor imagery yet — swap for a
    // proper branded 1200x630 OG asset before launch.
    images: [
      {
        url: "https://images.unsplash.com/photo-1519520104014-df63821cb6f9?w=1200&h=630&q=80&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Shoppix — a Nigerian multi-vendor marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoppix — Shop like no other",
    description: "A Nigerian multi-vendor marketplace — browse, shop, and sell in one place.",
    images: ["https://images.unsplash.com/photo-1519520104014-df63821cb6f9?w=1200&h=630&q=80&auto=format&fit=crop"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex min-h-screen flex-col">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
