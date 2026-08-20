"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import { accountsApi, type LoginPayload, type RegisterPayload } from "@/lib/api/accounts";
import { vendorsApi } from "@/lib/api/vendors";
import type { User, Vendor } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  vendor: Vendor | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshVendor = useCallback(async () => {
    try {
      const { data } = await vendorsApi.me();
      setVendor(data);
    } catch {
      setVendor(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await accountsApi.me();
      setUser(data);
      if (data.is_vendor) {
        await refreshVendor();
      } else {
        setVendor(null);
      }
    } catch {
      setUser(null);
      setVendor(null);
    }
  }, [refreshVendor]);

  useEffect(() => {
    // The csrftoken cookie must exist before any unsafe request; grab it
    // once on load, then check whether a session is already active.
    (async () => {
      try {
        await accountsApi.getCsrf();
      } catch {
        // Backend unreachable — fail open to "logged out", not a crash.
      }
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = async (data: LoginPayload) => {
    try {
      await accountsApi.getCsrf();
      await accountsApi.login(data);
      await refreshUser();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Invalid email or password."));
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      await accountsApi.getCsrf();
      await accountsApi.register(data);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Couldn't create your account."));
    }
  };

  const logout = async () => {
    try {
      await accountsApi.logout();
    } finally {
      setUser(null);
      setVendor(null);
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, vendor, loading, isLoggedIn, login, register, logout, refreshUser, refreshVendor }}
    >
      {children}
    </AuthContext.Provider>
  );
}
