import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
// import { AuthProvider } from "@/components/auth/AuthContext";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { siteUrl } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // title: "Shoppix - shop like no other",
  title: {
    default: "Shoppix - shop like no other",
    template: "%s | Shoppix",
  },
  description: "E-Commerce Store specializing in the pruchase and sale of all kinds of products.",
  verification: {
    google: "google-site-verification-code",
  },

  keywords: [
    "E-Commerce",
    "Online Shopping",
    "Buy Products",
    "Sell Products",
    "Shop Online",
    "Discounts",
    "Deals",
    "Free Shipping",
    "Customer Reviews",
    "Secure Payment",
    "Fast Delivery",
  ],

  authors: [
    { name: "Ifeanyi Ejidike", url: "https://github.com/GravityGuy123/" },
    // Any other authors here
  ],

  creator: "Ifeanyi Ejidike",

  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Header />
            <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}