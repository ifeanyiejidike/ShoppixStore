"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Store, ShieldCheck } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { Product } from "@/lib/types";
import { formatPriceToNaira, getApiErrorMessage } from "@/lib/utils";
import { getProductFallbackImage } from "@/lib/placeholder-images";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductReviews from "@/components/products/ProductReviews";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    catalogApi
      .getProduct(slug)
      .then(({ data }) => {
        setProduct(data);
        setActiveImage(data.thumbnail || data.images[0]?.image || null);
      })
      .catch(() => setProduct(null));
  }, [slug]);

  if (product === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl italic text-ink">Product not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or is no longer available.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const gallery = [product.thumbnail, ...product.images.map((img) => img.image)].filter(
    (src, i, arr): src is string => !!src && arr.indexOf(src) === i
  );
  const displayImage = activeImage || getProductFallbackImage(product.name, product.category?.name);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/products/${slug}`);
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success(`Added ${quantity} × "${product.name}" to your cart.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't add that to your cart."));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-ink">
          All products
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            <Image src={displayImage} alt={product.name} fill className="object-cover" priority />
            {product.is_flash_sale_active && product.percentage_difference > 0 && (
              <span className="absolute top-3 left-3 rounded bg-coral px-2.5 py-1 font-mono-tag text-xs font-semibold text-white">
                -{Math.round(product.percentage_difference)}% flash deal
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Product images">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="radio"
                  aria-checked={activeImage === src}
                  aria-label={`View image ${i + 1} of ${gallery.length}`}
                  onClick={() => setActiveImage(src)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                    activeImage === src ? "border-marigold" : "border-transparent"
                  }`}
                >
                  <Image src={src} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Link
            href={`/vendors/${product.vendor.slug}`}
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-jade hover:underline"
          >
            <Store className="h-4 w-4" />
            {product.vendor.brand_name}
            {product.vendor.is_diamond && (
              <span className="rounded-full bg-marigold/20 px-1.5 py-0.5 text-[10px] font-semibold text-marigold-ink">
                DIAMOND VENDOR
              </span>
            )}
          </Link>

          <h1 className="font-display mt-2 text-2xl italic text-ink sm:text-3xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono-tag text-2xl font-semibold text-ink">
              {formatPriceToNaira(product.current_price)}
            </span>
            {product.old_price && (
              <span className="font-mono-tag text-base text-muted-foreground line-through">
                {formatPriceToNaira(product.old_price)}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm">
            {product.is_in_stock ? (
              <span className="text-jade">In stock — {product.stock} available</span>
            ) : (
              <span className="text-coral">Out of stock</span>
            )}
          </p>

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-input">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-ink hover:bg-secondary disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono-tag w-10 text-center text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="flex h-10 w-10 items-center justify-center text-ink hover:bg-secondary disabled:opacity-40"
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!product.is_in_stock || adding}
            >
              <ShoppingBag className="h-4 w-4" />
              {adding ? "Adding..." : "Add to cart"}
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-jade" />
            Secure checkout via Paystack & Opay
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
}
