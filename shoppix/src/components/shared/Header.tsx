"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const cartItemsCount = 0;

  const { user, isLoggedIn, logout, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
  //       <div className="container mx-auto px-4 flex h-16 items-center justify-between">
  //         <span className="text-gray-400">Loading...</span>
  //       </div>
  //     </header>
  //   );
  // }

  const getUserDisplayName = (email: string | undefined) => {
    if (!email) return "";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout(); // wait for the backend to clear cookies
    router.push("/"); // then redirect
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
              Shoppix
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for products, brands, and categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full rounded-full border border-cyan-300 bg-white text-gray-700 placeholder-gray-400
                 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 transition-all"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex text-gray-600 hover:bg-purple-500 hover:text-white" asChild>
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-purple-500 hover:text-white" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-cyan-500 hover:bg-cyan-600">
                    {cartItemsCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Desktop Auth Buttons */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-gray-800">Hello, {getUserDisplayName(user?.email)}</span>
                <Link href="/profile" className="flex items-center gap-2 text-blue-600 hover:underline">
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  Profile
                </Link>
                <Button
                  variant="default"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                {/* Login button */}
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium 
                  text-cyan-600 border border-cyan-500 
                  rounded-lg transition-colors duration-300
                  hover:bg-cyan-50"
                >
                  Login
                </Link>

                {/* Register button */}
                <Button
                  variant="default"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  asChild
                >
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600 hover:bg-purple-500 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <form onSubmit={handleSearch} className="pb-3 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full rounded-full border border-cyan-300 bg-white text-gray-700 placeholder-gray-400
                   focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 transition-all"
            />
          </div>
        </form>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100">
            <Link
              href="/wishlist"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-cyan-500 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart className="h-5 w-5" /> <span>Wishlist</span>
            </Link>

            <Link
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-cyan-500 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="h-5 w-5" /> <span>Cart</span>
            </Link>

            {/* Mobile Auth Buttons */}
            {isLoggedIn ? (
              <div className="space-y-2">
                <span className="px-4 py-2 text-gray-800 block">Hello, {getUserDisplayName(user?.email)}</span>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:underline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-gray-50 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-4">
                {/* Mobile login */}
                <Link
                  href="/auth/login"
                  className="block w-full text-center px-4 py-2 border border-cyan-500 text-cyan-600 rounded-lg hover:bg-cyan-50 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>

                {/* Mobile Register */}
                <Link
                  href="/auth/register"
                  className="block w-full text-center px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}