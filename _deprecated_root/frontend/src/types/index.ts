export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  modelPath: string;
  images: string[];
  variants?: ProductVariant[];
  stock: number;
  featured: boolean;
}

export interface ProductVariant {
  id: string;
  label: string;
  color?: string;
  price?: number;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
