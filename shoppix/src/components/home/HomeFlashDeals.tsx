"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { ProductListItem } from "@/lib/types";
import ProductGrid from "@/components/products/product-grid";
import ProductGridSkeleton from "@/components/products/product-grid-skeleton";

export default function HomeFlashDeals() {
  const [products, setProducts] = useState<ProductListItem[] | null>(null);

  useEffect(() => {
    catalogApi
      .listProducts({ flash_sale: true, ordering: "-created_at" })
      .then(({ data }) => setProducts(data.results.slice(0, 5)))
      .catch(() => setProducts([]));
  }, []);

  if (products !== null && products.length === 0) return null;

  return (
    <section className="bg-coral-soft">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 fill-coral text-coral" />
            <h2 className="font-display text-2xl italic text-ink">Flash deals</h2>
          </div>
          <Link
            href="/products?flash_sale=true"
            className="flex items-center gap-1 text-sm font-medium text-coral hover:underline"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products === null ? <ProductGridSkeleton count={5} /> : <ProductGrid products={products} />}
      </div>
    </section>
  );
}
