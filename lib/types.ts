// Shared type definitions for AgriConnect

export type Profile = {
  id: string;
  name: string;
  role: 'consumer' | 'farmer';
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  farmer_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Order = {
  id: string;
  product_id: string;
  buyer_id: string;
  quantity: number;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  products?: Product;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: Profile;
};

