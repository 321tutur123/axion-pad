const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      credentials: "include",
      signal: controller.signal,
      ...options,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Erreur réseau");
  }
  return res.json();
}

export const api = {
  products: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ products: Product[]; total: number }>(`/products${qs}`);
    },
    getOne: (slug: string) => request<{ product: Product }>(`/products/${slug}`),
  },
  cart: {
    get: () => request<CartResponse>("/cart"),
    add: (productId: string, quantity: number, variantId?: string) =>
      request<CartResponse>("/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity, variantId }),
      }),
    update: (itemId: string, quantity: number) =>
      request<CartResponse>(`/cart/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }),
    remove: (itemId: string) =>
      request<CartResponse>(`/cart/items/${itemId}`, { method: "DELETE" }),
    clear: () => request<CartResponse>("/cart", { method: "DELETE" }),
    applyCoupon: (code: string) =>
      request<CartResponse>("/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
  },
  orders: {
    create: (data: OrderPayload) =>
      request<{ order: Order; clientSecret?: string }>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};

export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  comparePrice?: number;
  description: string;
  images?: string[];
  stock?: number;
  inStock?: boolean;
}

export interface CartItem {
  _id: string;
  id?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantLabel?: string;
}

export interface CartResponse {
  cart?: { items: CartItem[]; coupon?: { code: string; discount: number } };
  items?: CartItem[];
}

export interface OrderPayload {
  shipping: {
    firstName: string; lastName: string; email: string; phone?: string;
    address: string; postalCode: string; city: string; country: string;
    method: "standard" | "express" | "relay";
  };
  paymentMethodId?: string;
  couponCode?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
}
