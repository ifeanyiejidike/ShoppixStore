"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { registerFormSchema, type RegisterSchema } from "@/lib/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: "", password: "", confirm_password: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      await register(data);
      setSubmittedEmail(data.email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create your account.");
    }
  };

  if (submittedEmail) {
    return (
      <AuthCard title="Check your email">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-jade" />
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to <span className="font-medium text-ink">{submittedEmail}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Button variant="outline" className="mt-2" onClick={() => router.push("/auth/login")}>
            Go to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Shoppix to shop or start selling."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-jade hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
