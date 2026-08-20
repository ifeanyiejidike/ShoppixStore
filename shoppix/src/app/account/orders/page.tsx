"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import type { Order } from "@/lib/types";
import { formatDate, formatPriceToNaira, getApiErrorMessage } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-marigold/20 text-marigold-ink",
  paid: "bg-jade-soft text-jade",
  processing: "bg-jade-soft text-jade",
  shipped: "bg-jade-soft text-jade",
  delivered: "bg-jade-soft text-jade",
  cancelled: "bg-coral-soft text-coral",
  refunded: "bg-coral-soft text-coral",
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = () => {
    ordersApi
      .list()
      .then(({ data }) => setOrders(data.results))
      .catch(() => setOrders([]));
  };

  useEffect(fetchOrders, []);

  const handleCancel = async (order: Order) => {
    if (!confirm(`Cancel order ${order.order_reference}? This can't be undone.`)) return;
    setCancellingId(order.id);
    try {
      await ordersApi.cancel(order.id);
      toast.success("Order cancelled.");
      fetchOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't cancel that order."));
    } finally {
      setCancellingId(null);
    }
  };

  if (orders === null) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
        <p className="mt-3 text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono-tag text-xs text-muted-foreground">{order.order_reference}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-secondary text-secondary-foreground"}`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-1">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-mono-tag shrink-0 text-ink">{formatPriceToNaira(item.sub_total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-mono-tag text-sm font-semibold text-ink">
              Total: {formatPriceToNaira(order.amount)}
            </span>
            {order.status === "pending_payment" && (
              <Button
                variant="outline"
                size="sm"
                className="text-coral hover:text-coral"
                disabled={cancellingId === order.id}
                onClick={() => handleCancel(order)}
              >
                {cancellingId === order.id ? "Cancelling..." : "Cancel order"}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
