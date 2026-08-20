"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Clock, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import { ordersApi } from "@/lib/api/orders";
import type { Product, VendorOrderItem, OrderStatus } from "@/lib/types";
import type { ProductFormSchema } from "@/lib/schema";
import { formatPriceToNaira, getApiErrorMessage } from "@/lib/utils";
import { getProductFallbackImage } from "@/lib/placeholder-images";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProductForm from "@/components/vendor/ProductForm";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
};

function ProductsTab() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = () => {
    catalogApi
      .myProducts()
      .then(({ data }) => setProducts(data.results))
      .catch(() => setProducts([]));
  };

  useEffect(fetchProducts, []);

  const openCreate = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: ProductFormSchema) => {
    setSubmitting(true);
    const payload = {
      name: data.name,
      description: data.description || "",
      category_id: data.category_id || null,
      stock: data.stock,
      current_price: String(data.current_price),
      old_price: data.old_price ? String(data.old_price) : null,
      is_on_flash_sales: data.is_on_flash_sales || false,
      flash_sale_ends_at: data.flash_sale_ends_at || null,
    };
    try {
      if (editingProduct) {
        await catalogApi.updateProduct(editingProduct.slug, payload);
        toast.success("Product updated.");
      } else {
        await catalogApi.createProduct(payload);
        toast.success("Product created.");
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't save that product."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await catalogApi.deleteProduct(product.slug);
      toast.success("Product deleted.");
      fetchProducts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't delete that product."));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products === null ? "Loading..." : `${products.length} product${products.length === 1 ? "" : "s"}`}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>
            <ProductForm product={editingProduct} onSubmit={handleSubmit} submitting={submitting} />
          </DialogContent>
        </Dialog>
      </div>

      {products === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You haven&apos;t listed any products yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={product.thumbnail || getProductFallbackImage(product.name)} alt={product.name} fill className="object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono-tag text-sm text-ink">{formatPriceToNaira(product.current_price)}</span>
                  <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  {!product.is_active && (
                    <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[10px] font-medium text-coral">
                      Inactive
                    </span>
                  )}
                  {product.is_on_flash_sales && (
                    <span className="rounded-full bg-marigold/20 px-2 py-0.5 text-[10px] font-medium text-marigold-ink">
                      Flash sale
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(product)}
                  className="text-coral hover:text-coral"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrdersTab() {
  const [items, setItems] = useState<VendorOrderItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchItems = () => {
    ordersApi
      .vendorItems()
      .then(({ data }) => setItems(data.results))
      .catch(() => setItems([]));
  };

  useEffect(fetchItems, []);

  const handleAdvance = async (item: VendorOrderItem) => {
    const nextStatus = NEXT_STATUS[item.fulfillment_status];
    if (!nextStatus) return;
    setBusyId(item.id);
    try {
      await ordersApi.advanceVendorItemStatus(item.id, nextStatus);
      toast.success(`Marked as ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}.`);
      fetchItems();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't update order status."));
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No orders yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const nextStatus = NEXT_STATUS[item.fulfillment_status];
        return (
          <li key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono-tag text-xs text-muted-foreground">{item.order_reference}</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {item.product_name} × {item.quantity}
                </p>
                <p className="text-xs text-muted-foreground">{item.customer_email}</p>
              </div>
              <div className="text-right">
                <p className="font-mono-tag text-sm font-semibold text-ink">
                  {formatPriceToNaira(item.sub_total)}
                </p>
                <p className="text-xs text-jade">Your earning: {formatPriceToNaira(item.vendor_earning)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {ORDER_STATUS_LABELS[item.fulfillment_status]}
              </span>
              {nextStatus && (
                <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => handleAdvance(item)}>
                  {busyId === item.id ? "Updating..." : `Mark as ${ORDER_STATUS_LABELS[nextStatus]}`}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function VendorDashboardPage() {
  const { vendor, isLoggedIn, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <Store className="mx-auto h-10 w-10 text-jade" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Sign in to access your dashboard</h1>
        <Button asChild className="mt-6">
          <Link href="/auth/login?next=/vendor/dashboard">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <Store className="mx-auto h-10 w-10 text-jade" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">You&apos;re not a vendor yet</h1>
        <Button asChild className="mt-6">
          <Link href="/vendor/apply">Apply to become a vendor</Link>
        </Button>
      </div>
    );
  }

  if (!vendor.is_activated) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <Clock className="mx-auto h-10 w-10 text-marigold" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Application pending</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your vendor application for &quot;{vendor.brand_name}&quot; is awaiting admin approval.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-jade-soft">
          <Store className="h-6 w-6 text-jade" />
        </div>
        <div>
          <h1 className="font-display text-2xl italic text-ink">{vendor.brand_name}</h1>
          <p className="text-sm text-muted-foreground">
            {vendor.is_diamond ? "Diamond vendor" : "Vendor"} · {formatPriceToNaira(vendor.total_sales_ever)} in
            total sales
          </p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
