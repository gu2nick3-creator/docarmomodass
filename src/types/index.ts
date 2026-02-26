export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  sizes: string[];
  colors: ProductColor[];
  description: string;
  image: string;
  featured?: boolean;
  isNew?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export type OrderStatus = 'Pendente' | 'Entregue' | 'Cancelado' | 'Finalizado';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  buyer: BuyerInfo;
}

export interface BuyerInfo {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}
