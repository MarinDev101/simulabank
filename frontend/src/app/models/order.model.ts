import { Product } from './product.model';

export interface Order {
  id: string;
  products: Product[];
  total: number;
  createdAt: string;
}
