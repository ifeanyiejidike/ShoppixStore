"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { accountsApi } from "@/lib/api/accounts";
import type { ShippingAddress } from "@/lib/types";
import type { ShippingAddressSchema } from "@/lib/schema";
import { getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ShippingAddressForm from "@/components/account/ShippingAddressForm";

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<ShippingAddress[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = () => {
    accountsApi
      .listAddresses()
      .then(({ data }) => setAddresses(data.results))
      .catch(() => setAddresses([]));
  };

  useEffect(fetchAddresses, []);

  const handleAdd = async (data: ShippingAddressSchema) => {
    setSubmitting(true);
    try {
      await accountsApi.createAddress(data);
      toast.success("Address added.");
      setDialogOpen(false);
      fetchAddresses();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't save that address."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (address: ShippingAddress) => {
    if (!confirm(`Delete this address (${address.address})?`)) return;
    try {
      await accountsApi.deleteAddress(address.id);
      toast.success("Address deleted.");
      fetchAddresses();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't delete that address."));
    }
  };

  const handleSetDefault = async (address: ShippingAddress) => {
    try {
      await accountsApi.updateAddress(address.id, { is_default: true });
      toast.success("Default address updated.");
      fetchAddresses();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't update default address."));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {addresses === null ? "Loading..." : `${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New shipping address</DialogTitle>
            </DialogHeader>
            <ShippingAddressForm onSubmit={handleAdd} submitting={submitting} />
          </DialogContent>
        </Dialog>
      </div>

      {addresses === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No saved addresses yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <li key={addr.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
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
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr)}
                    className="mt-1.5 text-xs font-medium text-jade hover:underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(addr)}
                className="shrink-0 text-coral hover:text-coral/70"
                aria-label="Delete address"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
