"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Clock, Store } from "lucide-react";
import { registerVendorSchema, type RegisterVendorSchema } from "@/lib/schema";
import { vendorsApi } from "@/lib/api/vendors";
import { getApiErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorApplyPage() {
  const router = useRouter();
  const { user, vendor, isLoggedIn, loading: authLoading, refreshVendor } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RegisterVendorSchema>({
    resolver: zodResolver(registerVendorSchema),
    defaultValues: { email: "", brand_name: "", description: "" },
  });

  useEffect(() => {
    if (user?.email && !form.getValues("email")) {
      form.setValue("email", user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (data: RegisterVendorSchema) => {
    try {
      await vendorsApi.apply(data);
      await refreshVendor();
      setSubmitted(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't submit your application."));
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <Store className="mx-auto h-10 w-10 text-jade" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Sign in to become a vendor</h1>
        <Button asChild className="mt-6">
          <Link href="/auth/login?next=/vendor/apply">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (vendor || submitted) {
    const isActivated = vendor?.is_activated;
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        {isActivated ? (
          <>
            <Store className="mx-auto h-10 w-10 text-jade" />
            <h1 className="font-display mt-4 text-2xl italic text-ink">You&apos;re already a vendor</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your storefront from your dashboard.</p>
            <Button asChild className="mt-6">
              <Link href="/vendor/dashboard">Go to dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-10 w-10 text-marigold" />
            <h1 className="font-display mt-4 text-2xl italic text-ink">Application submitted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re reviewing your vendor application. You&apos;ll be able to list products once approved.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => router.push("/")}>
              Back to shopping
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <div className="mb-6 text-center">
        <Store className="mx-auto h-10 w-10 text-jade" />
        <h1 className="font-display mt-3 text-3xl italic text-ink">Become a vendor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about your brand. An admin will review your application before you can start listing products.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="brand_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Naija Gadgets Co" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand contact email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="brand@example.com" {...field} />
                </FormControl>
                <FormDescription>Can be different from your login email.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About your brand (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="What do you sell? What makes your brand stand out?" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
