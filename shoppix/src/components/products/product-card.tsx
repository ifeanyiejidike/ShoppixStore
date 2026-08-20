"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import type { ProductListItem } from "@/lib/types";
import { formatPriceToNaira } from "@/lib/utils";
import { getProductFallbackImage } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/auth/login?next=/products`);
      return;
    }
    if (!product.is_in_stock) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success(`Added "${product.name}" to your cart.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that to your cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 rounded-lg">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <Image
            src={product.thumbnail || getProductFallbackImage(product.name)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Signature price tag — notched corner, pinned to the image */}
          <div className="price-tag absolute top-0 right-0 bg-marigold px-2.5 py-1.5 pr-3">
            <span className="price-tag-hole" />
            <span className="font-mono-tag text-xs font-semibold text-marigold-ink">
              {formatPriceToNaira(product.current_price)}
            </span>
          </div>

          {product.is_on_flash_sales && product.percentage_difference > 0 && (
            <span className="absolute bottom-2 left-2 rounded bg-coral px-2 py-0.5 font-mono-tag text-[11px] font-semibold text-white">
              -{Math.round(product.percentage_difference)}%
            </span>
          )}

          {!product.is_in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
              <span className="rounded bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 pb-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
            {product.vendor_name}
          </p>
          <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2 min-h-[2.5em]">
            {product.name}
          </h3>
        </div>
      </Link>

      {/* Price + add-to-cart row lives outside the Link — a <button> can't be
          nested inside an <a> (invalid HTML, breaks screen reader / keyboard
          behavior), so this row is a sibling instead of nesting the button. */}
      <div className="flex items-center justify-between gap-2 p-3 pt-1">
        <Link href={`/products/${product.slug}`} className="flex flex-col" tabIndex={-1} aria-hidden="true">
          <span className="font-mono-tag text-sm font-semibold text-ink">
            {formatPriceToNaira(product.current_price)}
          </span>
          {product.old_price && (
            <span className="font-mono-tag text-xs text-muted-foreground line-through">
              {formatPriceToNaira(product.old_price)}
            </span>
          )}
        </Link>

        <Button
          size="icon-sm"
          variant="outline"
          className="shrink-0 rounded-full border-jade text-jade hover:bg-jade hover:text-white disabled:opacity-40"
          onClick={handleAddToCart}
          disabled={!product.is_in_stock || adding}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
