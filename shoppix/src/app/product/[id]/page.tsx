// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

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
  features: string[];
  specifications: Record<string, string>;
};

const products: Product[] = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    category: "Bags",
    description:
      "A premium everyday backpack designed for work, travel, and daily carry. Built with durable materials, clean detailing, and a comfortable fit.",
    price: 89.99,
    currency: "USD",
    inStock: true,
    rating: 4.8,
    reviewCount: 124,
    features: [
      "Premium leather finish",
      "Padded laptop compartment",
      "Water-resistant lining",
      "Adjustable shoulder straps",
    ],
    specifications: {
      Material: "Leather",
      Color: "Brown",
      Capacity: "20L",
      Weight: "1.1kg",
    },
  },
  {
    id: "2",
    name: "Minimal White Sneakers",
    category: "Footwear",
    description:
      "A clean and versatile sneaker silhouette made for everyday comfort. Pairs effortlessly with casual and smart-casual outfits.",
    price: 64.99,
    currency: "USD",
    inStock: true,
    rating: 4.6,
    reviewCount: 87,
    features: [
      "Breathable inner lining",
      "Cushioned sole",
      "Durable rubber outsole",
      "Minimal premium design",
    ],
    specifications: {
      Material: "Synthetic leather",
      Color: "White",
      Fit: "Regular",
      Sole: "Rubber",
    },
  },
  {
    id: "3",
    name: "Wireless Over-Ear Headphones",
    category: "Electronics",
    description:
      "Immersive over-ear headphones with rich sound, long battery life, and a sleek modern build for everyday listening.",
    price: 129.99,
    currency: "USD",
    inStock: false,
    rating: 4.7,
    reviewCount: 203,
    features: [
      "Bluetooth connectivity",
      "Up to 30 hours battery",
      "Noise isolation",
      "Fast charging support",
    ],
    specifications: {
      Connectivity: "Bluetooth 5.3",
      Battery: "30 hours",
      Color: "Matte Black",
      Weight: "280g",
    },
  },
];

function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  return {
    title: `${product.name} | Shoppix`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to products
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
                  {product.name.charAt(0)}
                </div>
                <p className="text-sm text-slate-500">Product preview</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-3">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>
                ⭐ {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
              <span
                className={
                  product.inStock ? "text-emerald-600" : "text-rose-600"
                }
              >
                {product.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold text-slate-950">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
              {product.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!product.inStock}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {product.inStock ? "Add to cart" : "Currently unavailable"}
              </button>

              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Save for later
              </button>
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Key features
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Product details
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Designed with a balance of aesthetics, function, and everyday
              usability, this product is a strong fit for customers who want
              premium presentation and reliable performance.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Specifications
            </h2>
            <dl className="mt-4 space-y-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm font-medium text-slate-500">{key}</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </section>
    </main>
  );
}