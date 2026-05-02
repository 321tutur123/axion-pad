"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, api } from "@/lib/api";

interface CartStore {
  items: CartItem[];
  coupon: { code: string; discount: number } | null;
  loading: boolean;
  fetch: () => Promise<void>;
  add: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  subtotal: () => number;
  count: () => number;
}

const SHIPPING = { standard: 5.99, express: 12.99, relay: 3.99 };
export const FREE_SHIPPING_THRESHOLD = 100;

export const getShipping = (subtotal: number, method: keyof typeof SHIPPING = "standard") =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING[method];

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      loading: false,

      fetch: async () => {
        set({ loading: true });
        try {
          const res = await api.cart.get();
          const data = res.cart || res;
          set({ items: (data as any).items || [], coupon: (data as any).coupon || null });
        } catch {
          // keep local state on API failure
        } finally {
          set({ loading: false });
        }
      },

      add: async (productId, quantity = 1, variantId) => {
        try {
          const res = await api.cart.add(productId, quantity, variantId);
          const data = (res as any).cart || res;
          if ((data as any).items) set({ items: (data as any).items });
        } catch {
          // keep local state on API failure
        }
      },

      update: async (itemId, quantity) => {
        if (quantity < 1) { await get().remove(itemId); return; }
        set({ items: get().items.map(i => (i._id || i.id) === itemId ? { ...i, quantity } : i) });
        api.cart.update(itemId, quantity).then(res => {
          const data = (res as any).cart || res;
          if ((data as any).items) set({ items: (data as any).items });
        }).catch(() => null);
      },

      remove: async (itemId) => {
        set({ items: get().items.filter(i => (i._id || i.id) !== itemId) });
        api.cart.remove(itemId).catch(() => null);
      },

      clear: async () => {
        await api.cart.clear().catch(() => null);
        set({ items: [], coupon: null });
      },

      applyCoupon: async (code) => {
        const res = await api.cart.applyCoupon(code);
        const coupon = (res as any).coupon || { code, discount: (res as any).discount || 0 };
        set({ coupon });
      },

      removeCoupon: () => set({ coupon: null }),

      subtotal: () => get().items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0),
      count: () => get().items.reduce((s, i) => s + (i.quantity || 1), 0),
    }),
    { name: "axionpad-cart", partialize: (s) => ({ items: s.items, coupon: s.coupon }) }
  )
);
