"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { vendorsApi } from "@/lib/api/vendors";
import { catalogApi } from "@/lib/api/catalog";
import type { ProductListItem, Vendor } from "@/lib/types";
import { formatPriceToNaira } from "@/lib/utils";
import { getVendorFallbackImage } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from "@/components/products/product-grid";
import ProductGridSkeleton from "@/components/products/product-grid-skeleton";

export default function VendorStorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [products, setProducts] = useState<ProductListItem[] | null>(null);

  useEffect(() => {
    vendorsApi
      .getBySlug(slug)
      .then(({ data }) => setVendor(data))
      .catch(() => setVendor(null));
  }, [slug]);

  useEffect(() => {
    catalogApi
      .listProducts({ vendor: slug })
      .then(({ data }) => setProducts(data.results))
      .catch(() => setProducts([]));
  }, [slug]);

  if (vendor === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (vendor === null) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl italic text-ink">Vendor not found</h1>
        <p className="mt-2 text-muted-foreground">This storefront may no longer be available.</p>
        <Link href="/vendors" className="mt-6 inline-block text-sm font-medium text-jade hover:underline">
          Browse all vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center sm:flex-row sm:text-left">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-jade-soft">
          <Image src={vendor.avatar || getVendorFallbackImage()} alt={vendor.brand_name} fill className="object-cover" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-2xl italic text-ink">{vendor.brand_name}</h1>
            {vendor.is_diamond && (
              <span className="rounded-full bg-marigold/20 px-2 py-0.5 text-[10px] font-semibold text-marigold-ink">
                DIAMOND VENDOR
              </span>
            )}
          </div>
          {vendor.description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{vendor.description}</p>}
          <p className="mt-2 text-xs text-jade">{formatPriceToNaira(vendor.total_sales_ever)} in total sales</p>
        </div>
      </div>

      <h2 className="font-display mt-8 mb-4 text-xl italic text-ink">Products from {vendor.brand_name}</h2>
      {products === null ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No products listed yet.
        </p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
