import { supabase } from '../lib/supabase';
import { isUUID } from '@/utils/uuid';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  mrp?: number;
  line_total?: number;
  thumbnail?: string;
  variant_id?: string | null;
  product?: any;
}

export interface AddressData {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  notes?: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

const LOCAL_ORDERS_KEY = 'snapgem_orders_fallback';

/**
 * Universal Order Number Formatter
 * Ensures WhatsApp message, Checkout, Order Success, and Admin Panel ALWAYS display the exact same order number format!
 */
export function formatOrderNumber(order: any): string {
  if (!order) return '#SG-ORD-000000';
  
  if (order.order_number && typeof order.order_number === 'string') {
    const cleanNum = order.order_number.trim();
    return cleanNum.startsWith('#') ? cleanNum : `#${cleanNum}`;
  }

  // Deterministic fallback for older database rows lacking explicit order_number
  const rawId = String(order.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanCode = rawId.length >= 6 ? rawId.slice(0, 6) : '100001';
  return `#SG-ORD-${cleanCode}`;
}

export const orderService = {
  /**
   * Recalculates selling_price and MRP directly from Supabase product records
   * and creates an authoritative order in the database BEFORE WhatsApp is opened.
   */
  async createOrder(
    cartItems: any[],
    subtotal: number,
    shipping: number,
    discount: number,
    total: number,
    addressData: AddressData
  ): Promise<Order> {
    // 1. Fetch current database product prices for all items
    const productIds = cartItems
      .map(item => item.id)
      .filter(id => isUUID(id));

    let dbProductsMap: Record<string, any> = {};

    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, name, price, selling_price, mrp, stock')
          .in('id', productIds);

        if (dbProducts) {
          dbProducts.forEach(p => {
            dbProductsMap[p.id] = p;
          });
        }
      } catch (e) {
        console.warn('Could not fetch products for authoritative price calculation:', e);
      }
    }

    // 2. Fetch Store Settings for authoritative shipping calculation
    let baseShippingCharge = 0;
    let freeShippingThreshold = 1000;
    try {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('base_shipping_charge, free_shipping_threshold')
        .limit(1);
        
      if (settings && settings.length > 0) {
        baseShippingCharge = Number(settings[0].base_shipping_charge || 0);
        freeShippingThreshold = Number(settings[0].free_shipping_threshold || 1000);
      }
    } catch (e) {}

    // 3. Recalculate authoritative line items and totals
    let recalculatedSubtotal = 0;
    let recalculatedTotalMRP = 0;

    const validatedItems = cartItems.map(item => {
      const dbProd = dbProductsMap[item.id];
      
      const sellingPrice = dbProd 
        ? Number(dbProd.selling_price || dbProd.price || 0)
        : Number(item.selling_price || item.price || item.mrp || 0);

      const mrpPrice = dbProd
        ? Number(dbProd.mrp || sellingPrice)
        : Number(item.mrp || sellingPrice);

      const title = dbProd ? dbProd.name : item.name;
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const lineTotal = sellingPrice * quantity;
      const lineMRP = mrpPrice * quantity;

      recalculatedSubtotal += lineTotal;
      recalculatedTotalMRP += lineMRP;

      return {
        product_id: item.id,
        product_name: title,
        quantity,
        unit_price: sellingPrice,
        mrp: mrpPrice,
        line_total: lineTotal,
        thumbnail: item.thumbnail || '',
        variant_id: item.variant_id || null,
        product: dbProd || item
      };
    });

    const recalculatedDiscount = Math.max(0, recalculatedTotalMRP - recalculatedSubtotal);
    const isFreeShipping = recalculatedSubtotal >= freeShippingThreshold;
    const recalculatedShipping = isFreeShipping ? 0 : baseShippingCharge;
    const recalculatedGrandTotal = recalculatedSubtotal + recalculatedShipping;

    // 4. Generate unique, human-readable Order Number (e.g. SG-ORD-674447)
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const randomNum = Math.floor(Math.random() * 900000 + 100000);
    const orderNumber = `SG-ORD-${randomNum}`;

    const combinedNotes = [
      addressData.landmark ? `Landmark: ${addressData.landmark}` : '',
      addressData.notes ? `Instructions: ${addressData.notes}` : ''
    ].filter(Boolean).join(' | ');

    const fallbackOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: addressData.full_name,
      customer_phone: addressData.phone,
      address_line_1: addressData.address_line_1,
      address_line_2: addressData.address_line_2 || null,
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
      notes: combinedNotes || null,
      subtotal: recalculatedSubtotal,
      shipping: recalculatedShipping,
      discount: recalculatedDiscount,
      total: recalculatedGrandTotal,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      items: validatedItems.map(item => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price,
        mrp: item.mrp,
        line_total: item.line_total,
        product: item.product
      }))
    };

    // 5. Save instant backup in LocalStorage
    try {
      const existingStr = localStorage.getItem(LOCAL_ORDERS_KEY);
      const existingOrders = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([fallbackOrder, ...existingOrders]));
    } catch (e) {}

    // 6. Insert Authoritative Order into Supabase
    try {
      const { data: dbOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_name: addressData.full_name,
          customer_phone: addressData.phone,
          address_line_1: addressData.address_line_1,
          address_line_2: addressData.address_line_2 || null,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          notes: combinedNotes || null,
          subtotal: recalculatedSubtotal,
          shipping: recalculatedShipping,
          discount: recalculatedDiscount,
          total: recalculatedGrandTotal,
          status: 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (!orderError && dbOrder) {
        // Save Authoritative Order Items Snapshot
        const orderItemsPayload = validatedItems.map(item => ({
          order_id: dbOrder.id,
          product_id: isUUID(item.product_id) ? item.product_id : null,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.unit_price
        }));

        await supabase.from('order_items').insert(orderItemsPayload);

        return {
          ...dbOrder,
          order_number: dbOrder.order_number || orderNumber,
          items: validatedItems,
          total: recalculatedGrandTotal
        };
      }
    } catch (e) {
      console.warn('Supabase orders insert failed (using recalculated local fallback):', e);
    }

    return fallbackOrder;
  },

  async getAdminOrders() {
    let ordersList: any[] = [];

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        ordersList = data;
      }
    } catch (e) {
      console.warn('Error fetching DB orders (using local fallback):', e);
    }

    if (ordersList.length === 0) {
      try {
        const savedLocal = localStorage.getItem(LOCAL_ORDERS_KEY);
        if (savedLocal) {
          ordersList = JSON.parse(savedLocal);
        }
      } catch (e) {}
    }

    // Standardize order_number on every order
    return ordersList.map(o => ({
      ...o,
      order_number: o.order_number || formatOrderNumber(o).replace(/^#/, '')
    }));
  },

  async updateOrder(id: string, updates: any, currentOrder?: any) {
    // 1. Update in LocalStorage backup array
    try {
      const savedLocal = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (savedLocal) {
        const localOrders = JSON.parse(savedLocal);
        const updatedLocal = localOrders.map((o: any) => 
          o.id === id ? { ...o, ...updates } : o
        );
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedLocal));
      }
    } catch (e) {}

    // 2. Stock Deduction Logic
    if (updates.status === 'confirmed' || updates.status === 'processing') {
      const isAlreadyConfirmed = currentOrder && (currentOrder.status === 'confirmed' || currentOrder.status === 'processing');
      
      if (!isAlreadyConfirmed) {
        const itemsToProcess = currentOrder?.items || [];
        for (const item of itemsToProcess) {
          if (item.product_id && isUUID(item.product_id)) {
            try {
              const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
              if (prod) {
                const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
              }
            } catch (err) {
              console.warn(`Failed to update stock for product ${item.product_id}:`, err);
            }
          }
        }
      }
    }

    // 3. If valid UUID, update in Supabase database
    if (isUUID(id)) {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order in Supabase:', error);
        throw new Error(error.message);
      }

      return data;
    }

    return { ...currentOrder, ...updates };
  }
};
