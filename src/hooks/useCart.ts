import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../services/productService';

export interface CartItem extends Product {
  cart_item_id?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  totalItems: () => number;
  subtotal: () => number;
}

export const getCartSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const selling = Number(item.selling_price || 0);
    const price = Number(item.price || 0);
    const mrp = Number(item.mrp || 0);
    
    const effectivePrice = selling > 0 ? selling : (price > 0 ? price : (mrp > 0 ? mrp : 0));
    return total + (effectivePrice * item.quantity);
  }, 0);
};

export const getCartTotalItems = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ 
        items: items.map(item => {
          const selling = Number(item.selling_price || 0);
          const price = Number(item.price || 0);
          const mrp = Number(item.mrp || 0);
          const effectivePrice = selling > 0 ? selling : (price > 0 ? price : mrp);
          return {
            ...item,
            selling_price: effectivePrice,
            mrp: mrp > 0 ? mrp : effectivePrice
          };
        })
      }),
      syncCart: async () => {},
      addItem: async (product, quantity = 1) => {
        const selling = Number(product.selling_price || 0);
        const price = Number(product.price || 0);
        const mrp = Number(product.mrp || 0);
        const effectivePrice = selling > 0 ? selling : (price > 0 ? price : mrp);

        const sanitizedProduct = {
          ...product,
          selling_price: effectivePrice,
          mrp: mrp > 0 ? mrp : effectivePrice
        };

        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, ...sanitizedProduct, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...sanitizedProduct, quantity }] };
        });
      },
      removeItem: async (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },
      updateQuantity: async (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }));
      },
      clearCart: async () => {
        set({ items: [] });
      },
      totalItems: () => getCartTotalItems(get().items),
      subtotal: () => getCartSubtotal(get().items)
    }),
    {
      name: 'cart-storage',
    }
  )
);
