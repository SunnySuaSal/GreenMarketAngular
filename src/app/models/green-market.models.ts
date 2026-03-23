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
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
}
