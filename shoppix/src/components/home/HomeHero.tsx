"use client";

import Link from "next/link";
import Image from "next/image"; // Import Next.js Image component
import { Button } from "@/components/ui/button";
import { HiOutlineArrowRight, HiOutlineSparkles } from "react-icons/hi";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-cyan-50">
      {/* 1. BACKGROUND IMAGE:  We use 'fill' to make it cover the container. 'priority' ensures it loads immediately (since it's the hero section).*/}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg.jpeg" 
          alt="Hero Background" 
          fill 
          className="object-cover"
          priority 
        />
      </div>

      {/* 2. GLASS OVERLAY 
        This sits on top of the image (absolute inset-0) but behind the text. Adjust opacity (bg-white/80) to control how much image shows through.
      */}
      <div className="absolute inset-0 z-0 bg-white/80 backdrop-blur-[3px]" />

      {/* 3. MAIN CONTENT (z-10 ensures it sits above the image and overlay) */}
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-cyan-200 text-cyan-700 rounded-full bg-white shadow-sm text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-500">
            <HiOutlineSparkles className="h-4 w-4 text-cyan-500" />
            <span>AI-Powered Shopping Experience</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            Discover Amazing Products from{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500">
              Trusted Vendors
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Shop millions of products at unbeatable prices. Get fast delivery,
            secure payments, and personalized recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
              asChild
            >
              <Link href="/products" className="flex items-center">
                Start Shopping
                <HiOutlineArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/50 border-gray-300 text-gray-700 hover:bg-purple-600 hover:text-white backdrop-blur-sm"
              asChild
            >
              <Link href="/vendor">Become a Vendor</Link>
            </Button>
          </div>

          {/* Stats Container */}
          <div className="mt-12 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 md:gap-8 divide-x divide-gray-200/50">
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-extrabold text-cyan-600">
                  10M+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Products
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-extrabold text-cyan-600">
                  50K+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Vendors
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-extrabold text-cyan-600">
                  2M+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Happy Customers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}