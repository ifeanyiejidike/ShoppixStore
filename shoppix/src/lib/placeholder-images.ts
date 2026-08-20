/**
 * Products, categories, and vendors in this dataset don't have real uploaded
 * photos yet (no vendor has attached actual product images through the
 * backend). Rather than showing a bare icon in a gray box everywhere, these
 * curated, verified Unsplash photos stand in — picked to roughly match what
 * the item actually is, not just a generic gray placeholder.
 *
 * Every URL here was resolved from a live Unsplash page fetch this session,
 * not guessed — next.config.ts already whitelists images.unsplash.com /
 * plus.unsplash.com for next/image.
 */

const FALLBACK_IMAGES = {
  smartphone: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80&auto=format&fit=crop",
  earbuds: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80&auto=format&fit=crop",
  genericProduct: "https://images.unsplash.com/photo-1601600576337-c1d8a0d1373c?w=800&q=80&auto=format&fit=crop",
  vendorStorefront: "https://images.unsplash.com/photo-1519520104014-df63821cb6f9?w=400&q=80&auto=format&fit=crop",
} as const;

const KEYWORD_MAP: { keywords: string[]; image: string }[] = [
  { keywords: ["phone", "smartphone", "iphone", "android"], image: FALLBACK_IMAGES.smartphone },
  { keywords: ["earbud", "earphone", "headphone", "airpod", "audio", "speaker"], image: FALLBACK_IMAGES.earbuds },
];

/** Best-effort fallback product image based on the product/category name. */
export function getProductFallbackImage(name: string, categoryName?: string | null): string {
  const haystack = `${name} ${categoryName ?? ""}`.toLowerCase();
  for (const { keywords, image } of KEYWORD_MAP) {
    if (keywords.some((kw) => haystack.includes(kw))) return image;
  }
  return FALLBACK_IMAGES.genericProduct;
}

/** Fallback avatar image for a vendor storefront with no uploaded avatar. */
export function getVendorFallbackImage(): string {
  return FALLBACK_IMAGES.vendorStorefront;
}
