import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="font-mono-tag text-sm text-marigold-ink">404</p>
        <h1 className="font-display mt-2 text-4xl italic text-ink">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {/* Button's asChild + Slot merges the Link's <a> and the button's
              styling into ONE element — the correct way to make a styled
              link, rather than nesting <button> inside <a> (invalid HTML). */}
          <Button asChild size="lg">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/products">
              <Search className="h-4 w-4" />
              Browse products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
