"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { accountsApi } from "@/lib/api/accounts";
import { getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AuthCard from "@/components/auth/AuthCard";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">(uid && token ? "pending" : "error");
  const [errorMessage, setErrorMessage] = useState(
    uid && token ? "" : "This verification link is missing required information."
  );

  useEffect(() => {
    if (!uid || !token) return;
    accountsApi
      .verifyEmail(uid, token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(getApiErrorMessage(err, "This link may have expired."));
      });
  }, [uid, token]);

  return (
    <AuthCard title="Email verification">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {status === "pending" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-jade" />
            <p className="text-sm text-muted-foreground">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-jade" />
            <p className="text-sm text-muted-foreground">Your email has been verified. You can now sign in.</p>
            <Button className="mt-2" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="h-10 w-10 text-coral" />
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" className="mt-2" asChild>
              <Link href="/auth/register">Back to sign up</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
