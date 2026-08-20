"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { ProductListItem } from "@/lib/types";
import ProductGrid from "@/components/products/product-grid";
import ProductGridSkeleton from "@/components/products/product-grid-skeleton";

export default function HomeFeaturedProducts() {
  const [products, setProducts] = useState<ProductListItem[] | null>(null);

  useEffect(() => {
    catalogApi
      .listProducts({ ordering: "-created_at", in_stock: true })
      .then(({ data }) => setProducts(data.results.slice(0, 10)))
      .catch(() => setProducts([]));
  }, []);

  return (
    <section className="container mx-auto px-4 py-10 sm:py-14">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-jade" />
          <h2 className="font-display text-2xl italic text-ink">Fresh on Shoppix</h2>
        </div>
        <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-jade hover:underline">
          Browse all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {products === null ? (
        <ProductGridSkeleton count={10} />
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No products yet — check back soon.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}
