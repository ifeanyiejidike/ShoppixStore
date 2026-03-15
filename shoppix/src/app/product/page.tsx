// src/app/product/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
};

const products: Product[] = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    category: "Bags",
    description:
      "A premium everyday backpack designed for work, travel, and daily carry.",
    price: 89.99,
    currency: "USD",
    inStock: true,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "2",
    name: "Minimal White Sneakers",
    category: "Footwear",
    description:
      "Clean, versatile sneakers built for everyday comfort and modern styling.",
    price: 64.99,
    currency: "USD",
    inStock: true,
    rating: 4.6,
    reviewCount: 87,
  },
  {
    id: "3",
    name: "Wireless Over-Ear Headphones",
    category: "Electronics",
    description:
      "Immersive sound, long battery life, and a sleek design for daily use.",
    price: 129.99,
    currency: "USD",
    inStock: false,
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: "4",
    name: "Modern Wrist Watch",
    category: "Accessories",
    description:
      "A refined everyday timepiece with a clean face and durable strap.",
    price: 149.99,
    currency: "USD",
    inStock: true,
    rating: 4.5,
    reviewCount: 61,
  },
];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export const metadata: Metadata = {
  title: "Products | Shoppix",
  description: "Browse premium products available on Shoppix.",
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Shoppix Catalog
          </span>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Explore our products
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Browse a curated collection of products with clean presentation,
            pricing, and stock visibility.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                  {product.name.charAt(0)}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {product.category}
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      product.inStock ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {product.inStock ? "In stock" : "Out of stock"}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-slate-950">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    <p className="text-xs text-slate-500">
                      ⭐ {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                    </p>
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View product
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}