import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { siteUrl } from "@/lib/constants";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} antialiased flex min-h-screen flex-col`}
      >
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
