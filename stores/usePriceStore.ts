import type { PriceHistory } from '@/db/types';
import { priceService } from '@/services/priceService';
import { create } from 'zustand';

type PriceState = {
  history: PriceHistory[];
  load: (productId: number) => void;
  addPrice: (productId: number, price: number) => void;
  clear: () => void;
};

export const usePriceStore = create<PriceState>((set) => ({
  history: [],

  load(productId) {
    const history = priceService.getByProduct(productId);
    set({ history });
  },

  addPrice(productId, price) {
    priceService.addPrice(productId, price);
    const history = priceService.getByProduct(productId);
    set({ history });
  },

  clear() {
    set({ history: [] });
  },
}));
