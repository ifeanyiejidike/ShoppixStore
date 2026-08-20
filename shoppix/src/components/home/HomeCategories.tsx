"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    catalogApi
      .listCategories()
      .then(({ data }) => setCategories(data.results))
      .catch(() => setCategories([]));
  }, []);

  if (categories !== null && categories.length === 0) return null;

  return (
    <section className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <h2 className="font-display text-lg italic text-ink mb-4">Browse stalls</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          {categories === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-28 shrink-0 rounded-lg" />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-center transition-colors hover:border-marigold hover:bg-secondary"
                >
                  <Layers className="h-5 w-5 text-jade" />
                  <span className="px-1 text-xs font-medium text-ink line-clamp-1">{cat.name}</span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
