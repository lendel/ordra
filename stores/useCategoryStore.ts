import type { Category } from '@/db/types';
import { categoryService } from '@/services/categoryService';
import { create } from 'zustand';

type CategoryState = {
  categories: Category[];
  load: () => void;
  addCategory: (name: string) => number;
  deleteCategory: (id: number) => void;
};

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],

  load() {
    const categories = categoryService.getAll();
    set({ categories });
  },

  addCategory(name) {
    const id = categoryService.create(name);
    const categories = categoryService.getAll();
    set({ categories });
    return id;
  },

  deleteCategory(id) {
    categoryService.delete(id);
    const categories = categoryService.getAll();
    set({ categories });
  },
}));
