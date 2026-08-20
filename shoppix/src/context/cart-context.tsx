"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cartApi } from "@/lib/api/cart";
import type { Cart } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/utils";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      await cartApi.addItem(productId, quantity);
      await refreshCart();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Couldn't add that to your cart."));
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      await cartApi.updateItem(itemId, quantity);
      await refreshCart();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Couldn't update that item."));
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await cartApi.removeItem(itemId);
      await refreshCart();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Couldn't remove that item."));
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      await refreshCart();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Couldn't clear your cart."));
    }
  };

  const itemCount = cart?.item_count ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, refreshCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
