import type { RequestItem, RequestStatus, RequestWithStats } from '@/db/types';
import { requestService } from '@/services/requestService';
import { priceService } from '@/services/priceService';
import { create } from 'zustand';

type RequestState = {
  requests: RequestWithStats[];
  items: RequestItem[];
  isLoading: boolean;

  loadRequests: () => void;
  loadItems: (requestId: number) => void;
  clearItems: () => void;

  createRequest: (title: string) => number;
  updateStatus: (id: number, status: RequestStatus) => void;
  deleteRequest: (id: number) => void;

  addItem: (requestId: number, name: string, price: number, productId?: number) => void;
  deleteItem: (itemId: number, requestId: number) => void;
  markItemReceived: (itemId: number, requestId: number, productId: number | null, price: number) => void;
};

export const useRequestStore = create<RequestState>((set) => ({
  requests: [],
  items: [],
  isLoading: false,

  loadRequests() {
    set({ isLoading: true });
    const requests = requestService.getAllWithStats();
    set({ requests, isLoading: false });
  },

  loadItems(requestId) {
    const items = requestService.getItems(requestId);
    set({ items });
  },

  clearItems() {
    set({ items: [] });
  },

  createRequest(title) {
    const id = requestService.create(title);
    const requests = requestService.getAllWithStats();
    set({ requests });
    return id;
  },

  updateStatus(id, status) {
    requestService.updateStatus(id, status);
    const requests = requestService.getAllWithStats();
    set({ requests });
  },

  deleteRequest(id) {
    requestService.delete(id);
    const requests = requestService.getAllWithStats();
    set({ requests });
  },

  addItem(requestId, name, price, productId) {
    requestService.addItem(requestId, name, price, productId);
    const items = requestService.getItems(requestId);
    set({ items });
  },

  deleteItem(itemId, requestId) {
    requestService.deleteItem(itemId, requestId);
    const items = requestService.getItems(requestId);
    set({ items });
  },

  markItemReceived(itemId, requestId, productId, price) {
    requestService.markReceived(itemId);
    if (productId !== null) {
      priceService.addPrice(productId, price);
    }
    const items = requestService.getItems(requestId);
    if (items.length > 0 && items.every((it) => it.received === 1)) {
      requestService.updateStatus(requestId, 'completed');
      const requests = requestService.getAllWithStats();
      set({ items, requests });
    } else {
      set({ items });
    }
  },
}));
