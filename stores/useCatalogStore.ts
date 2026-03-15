import type { ProductWithCategory } from '@/db/types';
import { productService } from '@/services/productService';
import { create } from 'zustand';

type CatalogState = {
  products: ProductWithCategory[];
  isLoading: boolean;
  load: () => void;
  addProduct: (name: string, price: number, categoryId?: number | null) => number;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  isLoading: false,

  load() {
    set({ isLoading: true });
    const products = productService.getAll();
    set({ products, isLoading: false });
  },

  addProduct(name, price, categoryId) {
    const id = productService.create(name, price, categoryId ?? null);
    const products = productService.getAll();
    set({ products });
    return id;
  },
}));
