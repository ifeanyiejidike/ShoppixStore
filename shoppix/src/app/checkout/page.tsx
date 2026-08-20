"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus } from "lucide-react";
import { accountsApi } from "@/lib/api/accounts";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { PaymentMethod, ShippingAddress } from "@/lib/types";
import type { ShippingAddressSchema } from "@/lib/schema";
import { formatPriceToNaira, getApiErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ShippingAddressForm from "@/components/account/ShippingAddressForm";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: "paystack", label: "Paystack", description: "Card, bank transfer, or USSD" },
  { value: "opay", label: "Opay", description: "Opay wallet or bank transfer" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();

  const [addresses, setAddresses] = useState<ShippingAddress[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchAddresses = () => {
    accountsApi
      .listAddresses()
      .then(({ data }) => {
        setAddresses(data.results);
        const defaultAddr = data.results.find((a) => a.is_default) || data.results[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      })
      .catch(() => setAddresses([]));
  };

  useEffect(() => {
    if (isLoggedIn) fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleAddAddress = async (data: ShippingAddressSchema) => {
    setAddingAddress(true);
    try {
      const { data: newAddress } = await accountsApi.createAddress(data);
      toast.success("Address saved.");
      setAddressDialogOpen(false);
      fetchAddresses();
      setSelectedAddressId(newAddress.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't save that address."));
    } finally {
      setAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Select a shipping address first.");
      return;
    }
    setPlacingOrder(true);
    try {
      const { data: order } = await ordersApi.checkout(selectedAddressId);
      const { data: paymentInit } = await paymentsApi.initialize(order.id, paymentMethod);
      await refreshCart();
      window.location.href = paymentInit.authorization_url;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't complete checkout."));
      setPlacingOrder(false);
    }
  };

  if (authLoading || (isLoggedIn && cartLoading && !cart)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl italic text-ink">Sign in to check out</h1>
        <Button asChild className="mt-6">
          <Link href="/auth/login?next=/checkout">Sign in</Link>
        </Button>
      </div>
    );
  }

  const items = cart?.cart_items ?? [];
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl italic text-ink">Your cart is empty</h1>
        <Button asChild className="mt-6">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl italic text-ink">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {/* Shipping address */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg italic text-ink">Shipping address</h2>
              <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Add address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>New shipping address</DialogTitle>
                  </DialogHeader>
                  <ShippingAddressForm onSubmit={handleAddAddress} submitting={addingAddress} />
                </DialogContent>
              </Dialog>
            </div>

            {addresses === null ? (
              <Skeleton className="h-24 w-full" />
            ) : addresses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No saved addresses yet — add one to continue.
              </p>
            ) : (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Shipping address">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedAddressId === addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-marigold bg-secondary"
                        : "border-border hover:border-marigold/50"
                    }`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-jade" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-ink">
                        {addr.first_name} {addr.last_name}
                        {addr.is_default && (
                          <span className="ml-2 rounded-full bg-jade-soft px-2 py-0.5 text-[10px] font-medium text-jade">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {addr.address}, {addr.lga}, {addr.state}
                      </p>
                      <p className="text-muted-foreground">{addr.phone}</p>
                    </div>
                    {selectedAddressId === addr.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-marigold" />}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Payment method */}
          <section>
            <h2 className="mb-3 font-display text-lg italic text-ink">Payment method</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors ${
                    paymentMethod === method.value
                      ? "border-marigold bg-secondary"
                      : "border-border hover:border-marigold/50"
                  }`}
                >
                  <span className="font-medium text-ink">{method.label}</span>
                  <span className="text-xs text-muted-foreground">{method.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg italic text-ink">Order summary</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground line-clamp-1">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-mono-tag shrink-0 text-ink">{formatPriceToNaira(item.sub_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono-tag text-ink">{formatPriceToNaira(cart?.total ?? "0")}</span>
          </div>
          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId}
          >
            {placingOrder ? "Redirecting to payment..." : "Place order & pay"}
          </Button>
        </div>
      </div>
    </div>
  );
}
