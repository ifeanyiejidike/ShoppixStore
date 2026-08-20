"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { ProductListItem } from "@/lib/types";
import ProductGrid from "@/components/products/product-grid";
import ProductGridSkeleton from "@/components/products/product-grid-skeleton";
import ProductFilters, { DEFAULT_FILTERS, type ProductFilterState } from "@/components/products/ProductFilters";
import { Button } from "@/components/ui/button";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("min_price") || "",
    maxPrice: searchParams.get("max_price") || "",
    inStock: searchParams.get("in_stock") === "true",
    flashSale: searchParams.get("flash_sale") === "true",
    ordering: searchParams.get("ordering") || DEFAULT_FILTERS.ordering,
  }));
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [products, setProducts] = useState<ProductListItem[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const search = searchParams.get("search") || "";

  const handleFilterChange = (next: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const fetchProducts = useCallback(() => {
    setProducts(null);
    catalogApi
      .listProducts({
        search: search || undefined,
        category: filters.category || undefined,
        min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        in_stock: filters.inStock || undefined,
        flash_sale: filters.flashSale || undefined,
        ordering: filters.ordering,
        page,
      })
      .then(({ data }) => {
        setProducts(data.results);
        setTotalPages(data.total_pages);
        setTotalCount(data.count);
      })
      .catch(() => setProducts([]));
  }, [search, filters, page]);

  useEffect(() => {
    fetchProducts();
    // Keep the URL shareable/bookmarkable without a full navigation.
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filters.category) params.set("category", filters.category);
    if (filters.minPrice) params.set("min_price", filters.minPrice);
    if (filters.maxPrice) params.set("max_price", filters.maxPrice);
    if (filters.inStock) params.set("in_stock", "true");
    if (filters.flashSale) params.set("flash_sale", "true");
    if (filters.ordering !== DEFAULT_FILTERS.ordering) params.set("ordering", filters.ordering);
    if (page > 1) params.set("page", String(page));
    router.replace(`/products${params.toString() ? `?${params}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl italic text-ink">
          {search ? `Results for "${search}"` : "All products"}
        </h1>
        {products !== null && (
          <p className="mt-1 text-sm text-muted-foreground">{totalCount} product{totalCount === 1 ? "" : "s"}</p>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductFilters filters={filters} onChange={handleFilterChange} />

        <div className="flex-1">
          {products === null ? (
            <ProductGridSkeleton count={10} />
          ) : (
            <>
              <ProductGrid products={products} />

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="font-mono-tag text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><ProductGridSkeleton /></div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
