"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { vendorsApi } from "@/lib/api/vendors";
import type { Vendor } from "@/lib/types";
import { formatPriceToNaira } from "@/lib/utils";
import { getVendorFallbackImage } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    vendorsApi
      .list()
      .then(({ data }) => setVendors(data.results))
      .catch(() => setVendors([]));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl italic text-ink">Vendors</h1>
      <p className="mt-1 text-sm text-muted-foreground">Independent sellers on Shoppix.</p>

      {vendors === null ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">No vendors yet — check back soon.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-jade-soft">
                <Image src={vendor.avatar || getVendorFallbackImage()} alt={vendor.brand_name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink">{vendor.brand_name}</p>
                  {vendor.is_diamond && (
                    <span className="shrink-0 rounded-full bg-marigold/20 px-1.5 py-0.5 text-[10px] font-semibold text-marigold-ink">
                      DIAMOND
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {vendor.description || "No description yet."}
                </p>
                <p className="mt-1 text-xs text-jade">{formatPriceToNaira(vendor.total_sales_ever)} in sales</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
