import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function safeFetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${backendUrl}/api${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    // Sitemap generation shouldn't fail the whole build/request if the
    // backend is briefly unreachable — fall back to static routes only.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/vendors`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/auth/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/auth/register`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/vendor/apply`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const [products, vendors] = await Promise.all([
    safeFetchList<{ slug: string; updated_at: string }>("/catalog/products/?page_size=100"),
    safeFetchList<{ slug: string; updated_at: string }>("/vendors/?page_size=100"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const vendorRoutes: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${siteUrl}/vendors/${v.slug}`,
    lastModified: v.updated_at,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...vendorRoutes];
}
