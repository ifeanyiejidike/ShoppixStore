"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordSchema } from "@/lib/schema";
import { accountsApi } from "@/lib/api/accounts";
import { getApiErrorMessage, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PasswordInput from "@/components/auth/PasswordInput";

export default function AccountProfilePage() {
  const { user, vendor } = useAuth();

  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: "", new_password: "", confirm_new_password: "" },
  });

  const onSubmit = async (data: ChangePasswordSchema) => {
    try {
      await accountsApi.changePassword(data.old_password, data.new_password);
      toast.success("Password changed successfully.");
      form.reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't change your password."));
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-jade-soft font-mono-tag text-lg font-semibold text-jade">
            {getInitials(user.email)}
          </div>
          <div>
            <p className="font-medium text-ink">{user.email}</p>
            <p className="text-sm text-muted-foreground">Member since {formatDate(user.date_joined)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {user.is_email_verified ? "Email verified" : "Email not verified"}
          </span>
          {vendor && (
            <span className="rounded-full bg-jade-soft px-2.5 py-1 text-xs font-medium text-jade">
              {vendor.is_activated ? `Vendor · ${vendor.brand_name}` : "Vendor application pending"}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-lg italic text-ink">Change password</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 max-w-sm">
            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2 w-fit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}
