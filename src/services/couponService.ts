import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
export type CouponUpdate = Database['public']['Tables']['coupons']['Update'];

export const couponService = {
  async getCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  },

  async getCouponByCode(code: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Coupon;
  },

  async validateCoupon(code: string, cartTotal: number): Promise<{ isValid: boolean; discountAmount: number; error?: string }> {
    const coupon = await this.getCouponByCode(code);

    if (!coupon || !coupon.is_active) {
      return { isValid: false, discountAmount: 0, error: 'Invalid or inactive coupon code.' };
    }

    const now = new Date().toISOString();
    if (coupon.start_date && coupon.start_date > now) {
      return { isValid: false, discountAmount: 0, error: 'Coupon is not active yet.' };
    }
    if (coupon.end_date && coupon.end_date < now) {
      return { isValid: false, discountAmount: 0, error: 'Coupon has expired.' };
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return { isValid: false, discountAmount: 0, error: 'Coupon usage limit reached.' };
    }

    if (coupon.min_purchase && cartTotal < coupon.min_purchase) {
      return { isValid: false, discountAmount: 0, error: `Minimum purchase of $${coupon.min_purchase} required.` };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'fixed') {
      discount = coupon.discount_amount;
    } else if (coupon.discount_type === 'percentage') {
      discount = cartTotal * (coupon.discount_amount / 100);
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    }

    // Ensure we don't discount more than the cart total
    discount = Math.min(discount, cartTotal);

    return { isValid: true, discountAmount: discount };
  },

  async createCoupon(coupon: CouponInsert) {
    // Ensure code is uppercase
    if (coupon.code) {
      coupon.code = coupon.code.toUpperCase();
    }
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupon)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  async updateCoupon(id: string, updates: CouponUpdate) {
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  async incrementCouponUsage(id: string) {
    // In a real app we'd use an RPC call for atomic increment.
    // For now we'll fetch and update, but ideally Supabase RPC is better.
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('times_used')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ times_used: coupon.times_used + 1 })
      .eq('id', id);

    if (updateError) throw updateError;
  },

  async deleteCoupon(id: string) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
