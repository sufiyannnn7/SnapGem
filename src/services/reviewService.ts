import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export const reviewService = {
  async getReviewsByProduct(productId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllReviewsAdmin() {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products(name, thumbnail)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createReview(review: ReviewInsert) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateReviewStatus(id: string, is_approved: boolean) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteReview(id: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
