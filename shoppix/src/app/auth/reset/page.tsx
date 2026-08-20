"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordSchema } from "@/lib/schema";
import { accountsApi } from "@/lib/api/accounts";
import { getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";

function ResetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "" },
  });

  if (!uid || !token) {
    return (
      <AuthCard title="Invalid link">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <AlertTriangle className="h-10 w-10 text-coral" />
          <p className="text-sm text-muted-foreground">
            This password reset link is missing required information. Request a new one.
          </p>
          <Button variant="outline" asChild className="mt-2">
            <Link href="/auth/forgot-password">Request new link</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      await accountsApi.confirmPasswordReset(uid, token, data.new_password);
      setDone(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "This link may have expired. Request a new one."));
    }
  };

  if (done) {
    return (
      <AuthCard title="Password reset">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-jade" />
          <p className="text-sm text-muted-foreground">Your password has been reset successfully.</p>
          <Button className="mt-2" onClick={() => router.push("/auth/login")}>
            Sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <Button type="submit" className="mt-2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPageContent />
    </Suspense>
  );
}
