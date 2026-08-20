"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where an error-monitoring integration (e.g.
    // Sentry, already stubbed on the backend) would capture the exception.
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-coral" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to the homepage.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
