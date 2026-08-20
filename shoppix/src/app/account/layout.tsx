"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
  { href: "/account", label: "Profile", icon: UserIcon, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <UserIcon className="mx-auto h-10 w-10 text-jade" />
        <h1 className="font-display mt-4 text-2xl italic text-ink">Sign in to view your account</h1>
        <Button asChild className="mt-6">
          <Link href="/auth/login?next=/account">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display mb-6 text-3xl italic text-ink">My account</h1>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
