"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, Store, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/products?flash_sale=true", label: "Flash deals" },
  { href: "/vendors", label: "Vendors" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { user, vendor, isLoggedIn, logout, loading } = useAuth();
  const { itemCount } = useCart();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      {/* Top utility bar — hidden on mobile to save vertical space */}
      <div className="hidden md:block border-b border-border bg-ink text-canvas">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
          <span>Delivering across Nigeria — pay with Paystack or Opay</span>
          {!loading && !isLoggedIn && (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="hover:text-marigold transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="hover:text-marigold transition-colors">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3 md:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display italic text-2xl md:text-3xl font-semibold text-ink">
              Shoppix
            </span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl" role="search">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Search products, brands, and categories"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full rounded-full border-border bg-card"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-ink/80">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-marigold-ink transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {isLoggedIn && vendor?.is_activated && (
              <Button variant="ghost" size="icon" className="hidden md:flex" asChild title="Vendor dashboard">
                <Link href="/vendor/dashboard">
                  <Store className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="relative" asChild title="Cart">
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-coral px-1 font-mono-tag text-[10px] font-semibold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </Button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex" title="Account">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">My account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">My orders</Link>
                  </DropdownMenuItem>
                  {!vendor && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/apply">Become a vendor</Link>
                    </DropdownMenuItem>
                  )}
                  {vendor?.is_activated && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/dashboard">Vendor dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-coral focus:text-coral">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="hidden md:flex" asChild title="Sign in">
                <Link href="/auth/login">
                  <UserIcon className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm bg-canvas p-0">
                <SheetHeader className="border-b border-border px-4 py-4 flex-row items-center justify-between space-y-0">
                  <SheetTitle className="font-display italic text-xl">Shoppix</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <div className="flex flex-col gap-6 p-4 overflow-y-auto">
                  <nav className="flex flex-col gap-1">
                    {NAV_LINKS.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-secondary"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  <div className="h-px bg-border" />

                  {isLoggedIn ? (
                    <div className="flex flex-col gap-1">
                      <p className="px-3 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        {user?.email}
                      </p>
                      <SheetClose asChild>
                        <Link href="/account" className="rounded-md px-3 py-2.5 hover:bg-secondary">
                          My account
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/account/orders" className="rounded-md px-3 py-2.5 hover:bg-secondary">
                          My orders
                        </Link>
                      </SheetClose>
                      {!vendor && (
                        <SheetClose asChild>
                          <Link href="/vendor/apply" className="rounded-md px-3 py-2.5 hover:bg-secondary">
                            Become a vendor
                          </Link>
                        </SheetClose>
                      )}
                      {vendor?.is_activated && (
                        <SheetClose asChild>
                          <Link href="/vendor/dashboard" className="rounded-md px-3 py-2.5 hover:bg-secondary">
                            Vendor dashboard
                          </Link>
                        </SheetClose>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md px-3 py-2.5 text-left text-coral hover:bg-coral-soft"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button asChild className="w-full">
                          <Link href="/auth/login">Sign in</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/auth/register">Create account</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search — mobile, persistent (not buried in the hamburger menu,
            since search is a primary action on an e-commerce site) */}
        <form onSubmit={handleSearch} className="pb-3 md:hidden" role="search">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full rounded-full border-border bg-card"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
