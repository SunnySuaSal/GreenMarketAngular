export type UserRole = 'guest' | 'user' | 'admin';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  seller: string;
  description: string;
  stock: number;
  rating: number;
  reviews: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  customerUsername?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

export interface ProductComment {
  id: string;
  productId: string;
  username: string;
  text: string;
  rating: number;
  createdAt: string;
}
