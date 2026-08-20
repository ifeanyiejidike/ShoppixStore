"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { formatPriceToNaira, getApiErrorMessage } from "@/lib/utils";
import { getProductFallbackImage } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { cart, loading, updateItem, removeItem } = useCart();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setBusyItemId(itemId);
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      // Backend validates quantity against live stock — surface that error
      // directly rather than trying to duplicate the stock check client-side,
      // since CartItem's lighter product payload doesn't carry a stock count.
      toast.error(getApiErrorMessage(err, "Couldn't update quantity — check available stock."));
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
      toast.success("Removed from cart.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyItemId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Sign in to view your cart</h1>
        <Button asChild className="mt-6">
          <Link href="/auth/login?next=/cart">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const items = cart?.cart_items ?? [];

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse the marketplace and find something you like.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl italic text-ink">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cart?.item_count} item{cart?.item_count === 1 ? "" : "s"}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <Link href={`/products/${item.product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-24">
                <Image
                  src={item.product.thumbnail || getProductFallbackImage(item.product.name)}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <Link href={`/products/${item.product.slug}`} className="text-sm font-medium text-ink line-clamp-2 hover:underline">
                    {item.product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.product.vendor_name}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-md border border-input">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={busyItemId === item.id || item.quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center hover:bg-secondary disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono-tag w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={busyItemId === item.id}
                      className="flex h-8 w-8 items-center justify-center hover:bg-secondary disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-tag text-sm font-semibold text-ink">
                      {formatPriceToNaira(item.sub_total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={busyItemId === item.id}
                      className="text-coral hover:text-coral/70 disabled:opacity-40"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Order summary */}
        <div className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg italic text-ink">Order summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono-tag font-medium text-ink">{formatPriceToNaira(cart?.total ?? "0")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery fees calculated at checkout.</p>
          <Button className="mt-5 w-full" size="lg" onClick={() => router.push("/checkout")}>
            Proceed to checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
